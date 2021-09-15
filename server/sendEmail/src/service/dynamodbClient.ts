import { SQS, AWSError, DynamoDB } from 'aws-sdk'
import {
  GetItemInput,
  GetItemOutput,
  PutItemInput,
  PutItemOutput,
  QueryInput,
  QueryOutput,
  UpdateItemInput,
  UpdateItemOutput
} from 'aws-sdk/clients/dynamodb'
import { SendMessageRequest, SendMessageResult } from 'aws-sdk/clients/sqs'
import { PromiseResult } from 'aws-sdk/lib/request'
import { Agent } from 'https'
export { GetItemInput, GetItemOutput, UpdateItemInput, UpdateItemOutput, SendMessageRequest }

const awsRegion = process.env.AWS_REGION

const dynamoDb = new DynamoDB({
  apiVersion: '2012-08-10',
  httpOptions: { agent: new Agent({ maxSockets: 200 }) },
  maxRetries: 3,
  region: awsRegion
})

const sqs = new SQS({
  apiVersion: '2012-11-05',
  region: awsRegion
})

export const getItem = async (params: GetItemInput): Promise<PromiseResult<GetItemOutput, AWSError>> =>
  await dynamoDb.getItem(params).promise()

export const queryItem = async (params: QueryInput): Promise<PromiseResult<QueryOutput, AWSError>> =>
  await dynamoDb.query(params).promise()

export const putItem = async (params: PutItemInput): Promise<PromiseResult<PutItemOutput, AWSError>> =>
  await dynamoDb.putItem(params).promise()

export const updateItem = async (
  params: UpdateItemInput
): Promise<PromiseResult<UpdateItemOutput, AWSError>> => await dynamoDb.updateItem(params).promise()

export const pushToQueue = async (
  params: SendMessageRequest
): Promise<PromiseResult<SendMessageResult, AWSError>> => await sqs.sendMessage(params).promise()
