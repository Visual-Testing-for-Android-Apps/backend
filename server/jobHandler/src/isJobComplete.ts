import { AttributeMap } from "aws-sdk/clients/dynamodb"

import {
  getItem,
  GetItemInput,
  updateItem,
  UpdateItemInput,
} from "./service/dynamodbClient"
import { JobStatus } from "./service/jobModel"
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
	//const key: string = JSON.parse(event.Records[0].body).jobKey;
	//console.log("Job key: " + String(key))

	//Job request object.
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: {
			id: { S: key },
		},
	};

	//Ready to be submitted for report generation
	let ready = false;

	const res = await awaitJob(request);

	if (res) {
		//Check current job status. If we are already generating the report, then return early (could happen due to queue buffer)
		//If jobStatus doesn't exist, we return as the job is illformed
		if (res.jobStatus?.S) {
			const status = res.jobStatus.S;
			//console.log(status);
			if (status !== "PROCESSING") {
				return true;
			}
		} else {
			return false;
		}
		//Load files from job data
		const media = res.files;
		ready = true;

		//Iterate though every file and check the value of "finished"
		if (media.L != null) {
			media.L.forEach((element) => {
				if (element.M != null) {
					const fin = element.M.finished.BOOL;
					if (!(fin == null)) {
						ready &&= fin.valueOf();
						//console.log("Is " + (element.M.fileRef.S != null ? String(element.M.fileRef.S) : "") + " finished?: " + String(fin))
					}
				}
			});
		}
		if (ready) {
			//A request to update the job status
			const request: UpdateItemInput = {
				TableName: process.env.JOB_TABLE as string,
				Key: {
					id: { S: key },
				},
				UpdateExpression: "set jobStatus = :s",
				ExpressionAttributeValues: {
					":s": { S: JobStatus.GENERATING },
				},
			};
			await updateJob(request);

			//const message: String = '{ "jobKey": "' + String(key) + '" }'

			//Push a request to the SQS queue
			await triggerReportGen(key)
			return true; //message
		}
	}

	return false;
};