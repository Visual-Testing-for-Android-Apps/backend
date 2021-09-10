import { SQS, AWSError, DynamoDB } from "aws-sdk";
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
import { SendMessageRequest, SendMessageResult } from "aws-sdk/clients/sqs";
export { GetItemInput, GetItemOutput, SendMessageRequest };
import { PromiseResult } from "aws-sdk/lib/request";
import { Agent } from "https";

const awsRegion = process.env.AWS_REGION;

const dynamoDb = new DynamoDB({
	apiVersion: "2012-08-10",
	httpOptions: { agent: new Agent({ maxSockets: 200 }) },
	maxRetries: 3,
	region: awsRegion,
});

const sqs = new SQS({
	apiVersion: "2012-11-05",
	region: awsRegion,
});

export const getItem = (params: GetItemInput): Promise<PromiseResult<GetItemOutput, AWSError>> =>
	dynamoDb.getItem(params).promise();

export const queryItem = (params: QueryInput): Promise<PromiseResult<QueryOutput, AWSError>> =>
	dynamoDb.query(params).promise();

export const putItem = (params: PutItemInput): Promise<PromiseResult<PutItemOutput, AWSError>> =>
	dynamoDb.putItem(params).promise();

export const updateItem = (
	params: UpdateItemInput
): Promise<PromiseResult<UpdateItemOutput, AWSError>> => dynamoDb.updateItem(params).promise();

export const pushToQueue = (
	params: SendMessageRequest
): Promise<PromiseResult<SendMessageResult, AWSError>> => sqs.sendMessage(params).promise();
