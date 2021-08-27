import { SQS } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

import { addFileToJob, createNewJobItem } from "./service/dynamodbService";
import { getUploadedFilesInJob, getUploadURL } from "./service/S3Client";
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient";

const seenomalySqsURL = process.env.SEENORMALY_URL as string;
const videoExtension = ["mp4"];
const imageExtension = ["jpg", "jpeg"];

export interface FileUploadResponseBody {
	uploadUrl?: string;
	jobID: string;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const jobID = parsedBody["jobID"];
	const email = parsedBody["email"];
	const fileExtension = parsedBody["fileExtension"];
	const uploadDone = parsedBody["uploadDone"] === "true";
	// 3. trigger
	if (uploadDone) {
		await sqsTriggerModels(jobID);
		return { jobID } as FileUploadResponseBody;
	}
	const id = jobID ? jobID : uuidv4;
	console.log("Running uploadHandler");
	// 1. upload files to S3
	const randomfileName = Math.round(Math.random() * 10000000);
	const fileKey = `${id}/${randomfileName}.${fileExtension}`;
	const uploadUrl = await getUploadURL(fileKey, fileExtension);
	const returnBody: FileUploadResponseBody = {
		uploadUrl,
		jobID: id,
	};

	// 2. save job to DB
	if (!jobID) {
		await createNewJobItem(id.toString(), email);
	}
	await addFileToJob(id.toString(), fileKey, email);
	return returnBody;
};

const sqsTriggerModels = async (jobID: string) => {
	const uploadedFiles = await getUploadedFilesInJob(jobID);
	for (const fileKey of uploadedFiles) {
		const fileExtension = fileKey.split(".")[1];
		const event = {
			jobID,
			fileReference: fileKey,
		} as modelTiggerSqsEvent;

		if (videoExtension.includes(fileExtension.toLowerCase())) {
			await sendMessage(event, seenomalySqsURL);
			return;
		}

		// TODO get URL trigger for owl-eye
		if (imageExtension.includes(fileExtension.toLowerCase())) {
			// await sendMessage(
			//   event,
			//   seenomalySqsURL
			// )
			console.log("send message to owl-eye");
			return;
		}

		throw Error(
			JSON.stringify({
				jobID,
				fileKey,
				message: "unrecoganised file extension",
			})
		);
	}
};
