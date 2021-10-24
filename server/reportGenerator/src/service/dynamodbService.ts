
import { integer } from "aws-sdk/clients/cloudfront"
import {
	Converter,
	GetItemInput,
	UpdateItemInput,
} from "aws-sdk/clients/dynamodb"

import { getItem, updateItem } from "./dynamodbClient"
import { Job } from "./jobModel"

const tableName = process.env.JOB_TABLE as string;

//Loads a job from the database
export const getJob = async (id: string): Promise<Job> => {
	const getItemInput: GetItemInput = {
		TableName: tableName,
		Key: { id: { S: id } },
	}

	const ret = await getItem(getItemInput);
	return Converter.unmarshall(ret.Item!) as Job
}

export interface fileResult {
	code?: string,
	message: string,
	outputKey?: string
}

//Sets the result and status of the given file index for this job
export const saveFileProcessResult = async (jobID: string, fileIdx: integer, result: fileResult) => {
	const resultAtrr = Converter.marshall(result)
	const updateItemInput: UpdateItemInput = {
		ExpressionAttributeNames: { "#result": "result", "#status": "status" },
		ExpressionAttributeValues: { ":result": { M: resultAtrr }, ":status": { S: "DONE" } },
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET files[" + fileIdx + "].#result = :result, files[" + fileIdx + "].#status = :status",
	};
	await updateItem(updateItemInput);
}

//Sets the jobStatus of the given job
export const updateJobStatus = async (jobID: string, jobStatus: string) => {
	const updateItemInput: UpdateItemInput = {
		ExpressionAttributeNames: { "#jobStatus": "jobStatus" },
		ExpressionAttributeValues: { ":jobStatus": { S: jobStatus } },
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "set #jobStatus = :jobStatus",
	};
	await updateItem(updateItemInput);
}


/**
 * Sets given password to the job with corresponding jobId in database
 * This is to be checked by jobData.py to check batch report url 
 * @param id
 * @param password 
 * @returns output of updating db
 */
export const addPasswordToJob = async (id: string, password: string) => {
	const UpdateItemInput = {
		ExpressionAttributeNames: { "#password": "password" },
		ExpressionAttributeValues: {
			":password": {S: password}
		},
		Key: { id: { S: id } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET #password=:password"
	} as UpdateItemInput;
	await updateItem(UpdateItemInput);
}

/**
 * Gets the email associated with the given job id
 * @param id job id
 * @returns email address for user
 */
export const getEmail = async (id:string):Promise<string> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:id}},
		ProjectionExpression: "email"
	}

	const ret = await getItem(getItemInput);
	console.log(ret)
	return Converter.unmarshall(ret.Item!).email;
}