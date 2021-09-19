
import { integer } from "aws-sdk/clients/cloudfront"
import {
  Converter,
  GetItemInput,
  UpdateItemInput,
} from "aws-sdk/clients/dynamodb"

import { getItem, updateItem } from "./dynamodbClient"
import { Job } from "./jobModel"

const tableName = process.env.JOB_TABLE as string;


export const getJob = async (id:string): Promise<Job> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:id}},
	}

	const ret = await getItem(getItemInput);
	return Converter.unmarshall(ret.Item!) as Job
}

export interface fileResult {
	code?: string,
	message: string,
	outputKey?:string
}

export const saveFileProcessResult = async(jobID:string, fileIdx: integer, result:fileResult) =>{
	const resultAtrr = Converter.marshall(result)
	const updateItemInput = {
		ExpressionAttributeNames: { "#result": "result", "#status":"status"},
		ExpressionAttributeValues: {":result":{M:resultAtrr},":status":{S:"DONE"}},
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET files["+fileIdx+"].#result = :result, files["+fileIdx+"].#status = :status",
	} as UpdateItemInput;
	await updateItem(updateItemInput);

}
export const updateJobStatus = async (jobID: string, jobStatus:string) => {
	const updateItemInput = {
		ExpressionAttributeNames: { "#jobStatus": "jobStatus"},
		ExpressionAttributeValues: {":jobStatus":{S:jobStatus}},
		Key: { id: { S: jobID } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "set #jobStatus = :jobStatus",
	} as UpdateItemInput;
	await updateItem(updateItemInput);

}