import { App, Duration, Stack, StackProps } from '@aws-cdk/core'
import { BuildSpec, ComputeType, PipelineProject, LinuxBuildImage } from '@aws-cdk/aws-codebuild'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import { Repository } from '@aws-cdk/aws-codecommit'
import {
  CloudFormationCreateUpdateStackAction,
  CodeBuildAction,
  CodeCommitSourceAction,
} from '@aws-cdk/aws-codepipeline-actions'
import { CfnParametersCode } from '@aws-cdk/aws-lambda'

interface PipelineStackProps extends StackProps {
  code: CfnParametersCode
}

export class PipelineStack extends Stack {
  constructor(scope: App, id: string, props?: PipelineStackProps) {
    super(scope, id, props)

    const repository = new Repository(this, 'Repository', {
      repositoryName: 'pets',
    })

    const cdkBuild = new PipelineProject(this, 'CdkBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['cd aws', 'yarn install'],
          },
          build: {
            commands: 'npx cdk synth',
          },
        },
        artifacts: {
          'base-directory': 'aws/cdk.out',
          files: ['PetsLambdaStack.template.json'],
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_4_0,
        computeType: ComputeType.SMALL,
      },
      timeout: Duration.minutes(10),
    })
    const lambdaBuild = new PipelineProject(this, 'LambdaBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['cd lambda'],
          },
          build: {
            commands: 'go build -o main ./...',
          },
        },
        artifacts: {
          'base-directory': 'lambda',
          files: ['main'],
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_4_0,
        computeType: ComputeType.SMALL,
      },
      timeout: Duration.minutes(10),
    })

    const sourceArtifact = new Artifact('SourceArtifact')
    const cdkArtifact = new Artifact('CdkArtifact')
    const lambdaArtifact = new Artifact('LambdaArtifact')

    new Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new CodeCommitSourceAction({
              actionName: 'Source',
              repository,
              output: sourceArtifact,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'LambdaBuild',
              project: lambdaBuild,
              input: sourceArtifact,
              outputs: [lambdaArtifact],
            }),
            new CodeBuildAction({
              actionName: 'CdkBuild',
              project: cdkBuild,
              input: sourceArtifact,
              outputs: [cdkArtifact],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new CloudFormationCreateUpdateStackAction({
              actionName: 'LambdaDeploy',
              templatePath: cdkArtifact.atPath('PetsLambdaStack.template.json'),
              stackName: 'LambdaStack',
              adminPermissions: true,
              parameterOverrides: {
                ...props.code.assign(lambdaArtifact.s3Location),
              },
              extraInputs: [lambdaArtifact],
            }),
          ],
        },
      ],
    })
  }
}
