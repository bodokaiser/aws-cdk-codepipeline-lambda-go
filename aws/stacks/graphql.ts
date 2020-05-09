import { App, Stack, StackProps } from '@aws-cdk/core'
import { UserPool } from '@aws-cdk/aws-cognito'
import { GraphQLApi } from '@aws-cdk/aws-appsync'

export class GraphQLStack extends Stack {
  public readonly api: GraphQLApi

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    this.api = new GraphQLApi(this, 'GraphQL', {
      name: 'pets',
      schemaDefinition: `
      type Dog {
        id: ID!
        name: String!
      }

      type Query {
        dogs: [Dog!]!
      }

      schema {
        query: Query
      }
      `,
    })
  }
}
