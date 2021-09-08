import { fileValidationMessageList } from "aws-sdk/clients/frauddetector"
import { v4 as uuidv4 } from "uuid"

import {
  addFileToJob,
  createNewJobItem,
  getJob,
} from "./service/dynamodbService"
import {
  extensionToContentType,
  File,
  FileStatus,
  FileType,
  getFileType,
} from "./service/jobModel"
import { getUploadedFilesInJob, getUploadURL } from "./service/S3Client"
import { checkVerificationCode, handlerNewEmailSes } from "./service/sesService"
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient"

const seenomalySqsURL = process.env.SEENORMALY_URL as string;
const owlEyeSqsURL = process.env.OWLEUE_URL as string;

export interface FileUploadResponseBody {
	uploadUrl?: string;
	jobID: string;
	verified?: boolean;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const jobID = parsedBody["jobID"];
	const uploadDone = parsedBody["uploadDone"] === "true";
	const verificationCode = parsedBody["verificationCode"];
	// 5. check verification code 
	if (typeof verificationCode != "undefined"){
		if (!recievedJobID) {
			throw Error("No jobID provided");
		}
		const verified = await checkVerificationCode(recievedJobID, verificationCode)
		return {verified, jobID:recievedJobID} as FileUploadResponseBody
	}
	// 6. trigger model
	if (uploadDone) {
		if (!jobID) {
			throw Error("No jobID provided");
		}
		await sqsTriggerModels(jobID);
		return { jobID } as FileUploadResponseBody;
	}
	const email = parsedBody["email"];
	const fullFileName = parsedBody["fileName"];
	const [fileName, fileExtension] = fullFileName.split(".");

	const id = jobID ? jobID : uuidv4();
	console.log("Running uploadHandler");
	// 1. upload files to S3
	const randomfileName = Math.round(Math.random() * 10000000);
	// append random number to resolve naming conflict, originalName#randomNumber.extension
	const fileKey = `${id}/${fileName}#${randomfileName}.${fileExtension}`;
	const uploadUrl = await getUploadURL(fileKey, fileExtension);
	const returnBody: FileUploadResponseBody = {
		uploadUrl,
		jobID: id,
	};
	// 2. create new job record in db
	await createNewJobItem(jobID, email);
	// 3. send verification code 
	await handlerNewEmailSes(jobID,email)
	// 4. init file upload
	for (const fileName of fileNames){
		const file = initFile(fileName, jobID)
		// 4.1. generate preSigned Url for files to S3
		const uploadUrl = await getUploadURL(file.s3Key, file.contentType);
		// 4.2. save job to DB
		await addFileToJob(jobID, file);
		returnBody.uploadUrls[fileName] = uploadUrl

	// 2. save job to DB
	if (!jobID) {
		await createNewJobItem(id, email);
	}
	await addFileToJob(id, fileKey, email);
	return returnBody;
};

const sqsTriggerModels = async (jobID: string) : Promise<boolean> => {
	const job = await getJob(jobID);
	// check email if verified 
	if (!job.emailVerified){
		return false
	}
	// init job 
	const files = job.files;
	for (let i = 0; i < files.length; i++) {
		const fileKey = files[i].s3Key;
		console.log("fileKey", fileKey);
		const event = {
			jobID,
			fileKey,
			fileIdx:i
		} as modelTiggerSqsEvent;

		if (files[i].type == FileType.VIDEO) {
			console.log("send message to seenomaly", event);
			await sendMessage(event, seenomalySqsURL);
			return;
		}

		// TODO get URL trigger for owl-eye
		if (files[i].type == FileType.IMAGE) {
			console.log("send message to owl-eye", event);
			await sendMessage(event, owlEyeSqsURL);
			continue;
		}

		throw Error(
			JSON.stringify({
				jobID,
				fileKey,
				message: "unrecoganised file extension",
			})
		);
	}
	return true
};
