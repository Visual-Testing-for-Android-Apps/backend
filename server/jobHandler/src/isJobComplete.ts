import { AttributeMap } from "aws-sdk/clients/dynamodb"

import {
  getItem,
  GetItemInput,
  updateItem,
  UpdateItemInput,
} from "./service/dynamodbClient"
import { getJob, updateJobStatus } from "./service/dynamodbService"
import { FileStatus, JobStatus } from "./service/jobModel"
import { triggerReportGen } from "./service/sqsClient"

//Gets a job from the database. Exists to skip a null check and allow for mocking
export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null> => {
	const res = await getItem(request);
	if (res.Item != null) {
		return res.Item;
	}
	return null;
};

//Updates a job in the database. Exists for mocking.
export const updateJob = async (request: UpdateItemInput): Promise<any> => {
	return await updateItem(request);
};

/*
 * Checks if all files for a job are processed. If so, the job state is updated
 * and a request is sent to the report generation queue.
 */
export const isJobComplete = async (key: string): Promise<any> => {
	//Job request object.
	console.log("check is job Complete ... ")
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: {
			id: { S: key },
		},
	};

	//Ready to be submitted for report generation
	let ready = true;

	//Load files from job data
	const res = await getJob(key)

	//Iterate though every file and check the value of "finished"
	for (const element of res.files) {
		ready &&= (element.status == FileStatus.DONE);
		//console.log("Is " + (element.fileRef != null ? String(element.fileRef) : "") + " finished?: " + String(element.status == FileStatus.DONE))
	}

	if (ready) {
		//A request to update the job status
		await updateJobStatus(key, JobStatus.GENERATING)
		//Push a request to the SQS queue
		await triggerReportGen(key)
		return true;
	}

	return ready;
};