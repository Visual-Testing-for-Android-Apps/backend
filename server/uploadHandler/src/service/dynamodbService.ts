import {
  Converter,
  PutItemInput,
  UpdateItemInput,
} from "aws-sdk/clients/dynamodb"

import { File } from "../service/jobModel"
import { putItem, updateItem } from "./dynamodbClient"

const tableName = process.env.JOB_TABLE as string;

export const createNewJobItem = async ( id: string,email: string): Promise<void> => {
	const newJobItem = {
		TableName: tableName,
		Item: {
			id: { S: id },
			email: { S: email },
			createdAt: { S: new Date().toISOString() },
		},
	} as PutItemInput;
	await putItem(newJobItem);
};

export const addFileToJob = async (id: string, file:File) => {
	const fileElementAttrMap = Converter.marshall(file);
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
