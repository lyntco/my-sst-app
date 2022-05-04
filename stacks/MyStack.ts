import { ApiAuthorizationType, App, Auth, GraphQLApi, Stack, StackProps } from "@serverless-stack/resources";
import { Table, TableFieldType } from "@serverless-stack/resources";
import { Queue } from "@serverless-stack/resources";

export default class MyStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a Table
    const table = new Table(this, "Notes", {
      fields: {
        sk: TableFieldType.STRING,
        pk: TableFieldType.STRING,
      },
      stream: true,
      primaryIndex: { partitionKey: "pk", sortKey: "sk" },
    });

    // this creates a lambda because it has a consumer
    const queue = new Queue(this, "LynQueue", {
      consumer: {
        function: {
          handler: "src/queueConsumer.main",
          timeout: 5,
          permissions: [table],
          environment: {
            TABLE_NAME: table.tableName,
          },
        },
      },
      sqsQueue: {
        queueName: "rollercoaster-queue",
      },
    });

    // Create the GraphQL API
    const api = new GraphQLApi(this, "ApolloApi", {
      server: "src/lambda.handler",
      defaultFunctionProps: {
        permissions: [table, queue],
        environment: {
          TABLE_NAME: table.tableName,
          QUEUE_URL: queue.sqsQueue.queueUrl,
        }
      },
      defaultAuthorizationType: ApiAuthorizationType.AWS_IAM
    });

    // table.addConsumers(this, {
    //   consumer: "src/queueConsumer.main",
    // });
    // table.attachPermissionsToConsumer("consumer", ["sqs"]);


    new Auth(this, "Auth", {
      cognito: {
        defaultFunctionProps: {
          timeout: 20,
          environment: { tableName: table.tableName },
          permissions: [table],
        },
        triggers: {
          // preAuthentication: "src/preAuthentication.main",
          // postAuthentication: "src/postAuthentication.main",
        },
      },
      // auth0: {
      //   domain: "https://myorg.us.auth0.com",
      //   clientId: "UsGRQJJz5sDfPQDs6bhQ9Oc3hNISuVif",
      // },
    });

    // auth.attachPermissionsForAuthUsers([
    //   api,
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ["s3:*"],
    //     resources: ["*"],
    //   }),
    // ]);
    // auth.attachPermissionsForUnauthUsers([
    //   api,
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ["s3:*"],
    //     resources: ["*"],
    //   }),
    // ]);

    // Show the API endpoint in output
    this.addOutputs({
      ApiEndpoint: api.url,
    });
  }
}
