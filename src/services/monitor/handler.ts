import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SNSEvent } from "aws-lambda";

async function handler(event: SNSEvent, context: Context): Promise<APIGatewayProxyResult> {
  
}

export { handler }