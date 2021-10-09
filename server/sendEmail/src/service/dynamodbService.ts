
import {
  Converter,
  GetItemInput,
  UpdateItemInput,
} from "aws-sdk/clients/dynamodb"

import { getItem, updateItem } from "./dynamodbClient"

const tableName = process.env.JOB_TABLE as string;

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