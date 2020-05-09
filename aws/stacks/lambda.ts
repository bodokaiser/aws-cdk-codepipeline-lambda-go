import { App, Duration, Stack, StackProps } from '@aws-cdk/core'
import { GraphQLApi, MappingTemplate } from '@aws-cdk/aws-appsync'
import { CfnParametersCode, Code, Function, Runtime } from '@aws-cdk/aws-lambda'

interface LambdaStackProps extends StackProps {
  graphqlApi: GraphQLApi
}

export class LambdaStack extends Stack {
  public readonly code: CfnParametersCode

  constructor(scope: App, id: string, props?: LambdaStackProps) {
    super(scope, id, props)

    this.code = Code.fromCfnParameters()

    const lambda = new Function(this, 'Lambda', {
      runtime: Runtime.GO_1_X,
      memorySize: 128,
      handler: 'main',
      code: this.code,
      timeout: Duration.seconds(30),
    })

    const source = props.graphqlApi.addLambdaDataSource('lambda', 'Lambda', lambda)

    source.createResolver({
      typeName: 'Query',
      fieldName: 'teams',
      requestMappingTemplate: MappingTemplate.lambdaRequest(`
      {
        "action": "teams",
        "query": $utils.toJson($ctx.args)
      }
      `),
      responseMappingTemplate: MappingTemplate.lambdaResult(),
    })
  }
}
