import { gql, ApolloServer } from "apollo-server-lambda";
import AWS from "aws-sdk";
import { UserData } from './data'

const sqs = new AWS.SQS();

const typeDefs = gql`
  type Query {
    hello: String
    tuna: Int
  }

  type QueueItem {
    name: String
  }

  type Mutation {
    test(value: String): String
    queueItem(name: String): QueueItem
  }
`;

const QUEUE_URL = process.env.QUEUE_URL as string;

const resolvers = {
  Query: {
    hello: async (_, queryParams: any, context: any) => {
        const source: UserData = context.dataSources.tableDataSource
        const result = await source.getSomeItem('1','1')
        return result.name
      },
    tuna: () => 5,
  },
  Mutation: {
    test: async (_, queryParams: any, context: any) => {
      return queryParams.value
    },
    queueItem: async (_, queryParams: any, context: any) => {
      const results = await sqs.sendMessage({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(queryParams),
      }, (err, data) => {
        if (err) return console.log(err)
        console.log("Message queued!", data);
        return data
      })
      const { params: {MessageBody} } = results
      console.log(`MessageBody`, MessageBody);
      return JSON.parse(MessageBody)
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    tableDataSource: new UserData()
  }),
});

export const handler = server.createHandler();
