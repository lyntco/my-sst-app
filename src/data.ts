import { DynamoDBDataSource } from "apollo-datasource-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

interface SomeItem {
  pk: string;
  sk: string;
  name: string;
}

const TABLE_NAME = process.env.TABLE_NAME as string;
const SCHEMA = [
  {
    AttributeName: "pk",
    KeyType: "HASH",
  },
  {
    AttributeName: "sk",
    KeyType: "RANGE",
  },
];

export class UserData extends DynamoDBDataSource<SomeItem> {
  private readonly ttl = 30 * 60; // 30minutes

  constructor(config?: any) {
    super(TABLE_NAME, SCHEMA, config);
  }

  async getSomeItem(pk: string, sk: string): Promise<SomeItem> {
    const getItemInput: DocumentClient.GetItemInput = {
      TableName: TABLE_NAME,
      ConsistentRead: true,
      Key: { pk, sk },
    };
    return this.getItem(getItemInput, this.ttl);
  }
}