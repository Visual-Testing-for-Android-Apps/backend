import { integer } from "aws-sdk/clients/cloudfront"
import {
	Converter,
	GetItemInput,
	UpdateItemInput,
} from "aws-sdk/clients/dynamodb"
import { Job } from "../service/jobModel"
import { getItem, updateItem } from "./dynamodbClient"

const tableName = process.env.JOB_TABLE as string;

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

export const saveFileProcessResult = async (jobID: string, fileIdx: integer, result: fileResult) => {
	const resultAtrr = Converter.marshall(result)
	const updateItemInput = {
		ExpressionAttributeNames: { "#result": "result", "#status": "status" },
		ExpressionAttributeValues: { ":result": { M: resultAtrr }, ":status": { S: "DONE" } },
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET files[" + fileIdx + "].#result = :result, files[" + fileIdx + "].#status = :status",
	} as UpdateItemInput;
	await updateItem(updateItemInput);

}

//Set the jobStatus attribute of the given jobID in the database
export const updateJobStatus = async (jobID: string, jobStatus: string) => {
	const updateItemInput = {
		ExpressionAttributeNames: { "#jobStatus": "jobStatus" },
		ExpressionAttributeValues: { ":jobStatus": { S: jobStatus } },
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "set #jobStatus = :jobStatus",
	} as UpdateItemInput;
	await updateItem(updateItemInput);

}

/**
 * Gets the email associated with the given job id
 * @param jobId job id in db
 * @returns email address for user
 */
export const getEmail = async (jobId:string):Promise<string> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:jobId}},
		ProjectionExpression: "email"
	}

	const ret = await getItem(getItemInput);
	console.log(ret)
	return Converter.unmarshall(ret.Item!).email;
}


/**
 * Gets the job status associated with the given job id
 * @param jobId job id in db
 * @returns job status
 */
export const getJobStatus = async (jobId:string):Promise<string> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:jobId}},
		ProjectionExpression: "jobStatus"
	}
	const ret = await getItem(getItemInput);
	console.log(ret)
	return Converter.unmarshall(ret.Item!).jobStatus;
}