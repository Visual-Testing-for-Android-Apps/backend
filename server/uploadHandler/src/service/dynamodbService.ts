import { Converter, PutItemInput, UpdateItemInput } from "aws-sdk/clients/dynamodb";

import { file, FileStatus } from "../service/jobModel";
import { putItem, updateItem } from "./dynamodbClient";

const tableName = process.env.JOB_TABLE as string;

export const createNewJobItem = async (email: string, id: string): Promise<void> => {
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
		UpdateExpression: "SET #eventLog = list_append(if_not_exists(#files, :emptyList),:files)",
	} as UpdateItemInput;
	await updateItem(updateItemInput);
};
