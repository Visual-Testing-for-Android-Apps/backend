import {
  Converter,
  GetItemInput,
  GetItemOutput,
  PutItemInput,
  UpdateItemInput,
} from "aws-sdk/clients/dynamodb"
import { table } from "console"

import { EmailVerification, File, Job } from "../service/jobModel"
import { getItem, putItem, updateItem } from "./dynamodbClient"

const tableName = process.env.JOB_TABLE as string;


export const getJob = async (id:string): Promise<Job> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:id}},
	}

	const ret = await getItem(getItemInput);
	return Converter.unmarshall(ret.Item!) as Job
}

export const createNewJobItem = async ( id: string,email: string): Promise<void> => {
	const newJobItem = {
		TableName: tableName,
		Item: {
			id: { S: id },
			email: { S: email },
			createdAt: { S: new Date().toISOString() },
			emailVerified: {BOOL:false}
		},
	} as PutItemInput;
	await putItem(newJobItem);
};

export const addFileToJob = async (id: string, fileKey: string, fileType: string) => {
	const fileElement: file = {
		fileReference: fileKey,
		fileStatus: FileStatus.NEW,
		fileType,
	};
	const fileElementAttrMap = Converter.marshall(fileElement);
	const updateItemInput = {
		ExpressionAttributeNames: { "#files": "files" },
		ExpressionAttributeValues: {
			":files": { L: [{ M: fileElementAttrMap }] },
			":emptyList": { L: [] },
		},
		Key: { id: { S: id } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET #files = list_append(if_not_exists(#files, :emptyList),:files)",
	} as UpdateItemInput;
	await updateItem(updateItemInput);
};

export const saveVerificationCode = async (id:string,verificationCode:string) => {
	const emailVerification = {
		code: {S:verificationCode},
		createdAt: {S: new Date().toISOString()}
	}
	const updateItemInput = {
		ExpressionAttributeNames: { "#emailVerification": "emailVerification" },
		ExpressionAttributeValues: {":emailVerification":{M:emailVerification}},
		Key: { id: { S: id } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET #emailVerification=:emailVerification",
	} as UpdateItemInput;
	await updateItem(updateItemInput);
}

export const getEmailVerification = async (id:string): Promise<EmailVerification> => {
	const getItemInput: GetItemInput = {
		TableName:tableName,
		Key: {id : {S:id}},
		ProjectionExpression: "emailVerification"
	}

	const ret = await getItem(getItemInput);
	console.log(ret)
	return Converter.unmarshall(ret.Item!).emailVerification as EmailVerification;
}

export const updateEmailToVerified = async (id:string) => {
	const updateItemInput = {
		ExpressionAttributeNames: { "#emailVerified": "emailVerified" },
		ExpressionAttributeValues: {":emailVerified":{BOOL:true}},
		Key: { id: { S: id } },
		ReturnValues: "UPDATED_NEW",
		TableName: tableName,
		UpdateExpression: "SET #emailVerified=:emailVerified",
	} as UpdateItemInput;
	await updateItem(updateItemInput);
}

