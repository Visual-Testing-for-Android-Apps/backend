import { AWSError, DynamoDB } from "aws-sdk";
import {
  GetItemInput,
  GetItemOutput,
  PutItemInput,
  PutItemOutput,
  QueryInput,
  QueryOutput,
  UpdateItemInput,
  UpdateItemOutput,
} from "aws-sdk/clients/dynamodb";
import { PromiseResult } from "aws-sdk/lib/request";
import { Agent } from "https";

const awsRegion = process.env.AWS_REGION

// The reason of using DynamoDB directly, see:
// https://github.com/aws/aws-sdk-js/issues/3578
const dynamoDb = new DynamoDB({
  apiVersion: "2012-08-10",
  httpOptions: { agent: new Agent({ maxSockets: 200 }) },
  maxRetries: 3,
  region: awsRegion,
})

export const getItem = (
  params: GetItemInput
): Promise<PromiseResult<GetItemOutput, AWSError>> =>
  dynamoDb.getItem(params).promise()

export const queryItem = (
  params: QueryInput
): Promise<PromiseResult<QueryOutput, AWSError>> =>
  dynamoDb.query(params).promise()

export const putItem = (
  params: PutItemInput
): Promise<PromiseResult<PutItemOutput, AWSError>> =>
  dynamoDb.putItem(params).promise()

export const updateItem = (
  params: UpdateItemInput
): Promise<PromiseResult<UpdateItemOutput, AWSError>> =>
  dynamoDb.updateItem(params).promise()