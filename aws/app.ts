import { App } from '@aws-cdk/core'

import { PipelineStack } from './stacks/pipeline'
import { GraphQLStack } from './stacks/graphql'
import { LambdaStack } from './stacks/lambda'

const app = new App()

const graphqlStack = new GraphQLStack(app, 'PetsGraphQLStack')

const lambdaStack = new LambdaStack(app, 'PetsLambdaStack', {
  graphqlApi: graphqlStack.api,
})

const pipelineStack = new PipelineStack(app, 'PetsPipelineStack', {
  code: lambdaStack.code,
  graphql: graphqlStack.api,
})

app.synth()
