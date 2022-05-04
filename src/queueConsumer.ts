import AWS from "aws-sdk";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME as string;

export async function main({ Records }) {
  return Records.map(async (r) => {
    const body = JSON.parse(r.body)
    const putParams = {
      TableName: TABLE_NAME,
      Item:  {
        pk: body.name,
        sk: body.name,
        ...body},
    };
    const results = await dynamoDb.put(putParams, function(err, data) {
      if (err) console.log(err);
      else console.log(data);
    });
    return results
  })
}