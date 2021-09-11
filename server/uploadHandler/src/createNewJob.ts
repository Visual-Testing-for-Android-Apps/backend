import { v4 as uuidv4 } from "uuid";

import { addFileToJob, createNewJobItem } from "./service/dynamodbService";
import { extensionToContentType, File, FileStatus, getFileType } from "./service/jobModel";
import { getUploadedFilesInJob, getUploadURL } from "./service/S3Client";
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient";

const seenomalySqsURL = process.env.SEENORMALY_URL as string;
const owlEyeSqsURL = process.env.OWLEUE_URL as string;
const videoExtension = ["mp4"];
const imageExtension = ["jpg", "jpeg", "png"];

export interface FileUploadResponseBody {
	uploadUrls: { [key: string]: string };
	jobID: string;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const recievedJobID = parsedBody["jobID"];
	const uploadDone = parsedBody["uploadDone"] === "true";
	// 3. trigger
	if (uploadDone) {
		if (!recievedJobID) {
			throw Error("No jobID provided");
		}
		await sqsTriggerModels(recievedJobID);
		return { jobID: recievedJobID } as FileUploadResponseBody;
	}
	const email = parsedBody["email"];
	const fileNames = parsedBody["fileNames"];
	const jobID = recievedJobID ? recievedJobID : uuidv4();
	const returnBody: FileUploadResponseBody = {
		jobID,
		uploadUrls: {},
	};
	// 2. create new job record in db
	await createNewJobItem(jobID, email);
	for (const fileName of fileNames) {
		const file = initFile(fileName, jobID);
		// 1. generate preSigned Url for files to S3
		const uploadUrl = await getUploadURL(file.s3Key, file.contentType);
		// 2. save job to DB
		await addFileToJob(jobID, file);
		returnBody.uploadUrls[fileName] = uploadUrl;
	}

	console.log("Running uploadHandler");

	return returnBody;
};

const sqsTriggerModels = async (jobID: string) => {
	const uploadedFiles = await getUploadedFilesInJob(jobID);
	for (let i = 0; i < uploadedFiles.length; i++) {
		const fileKey = uploadedFiles[i];
		console.log("fileKey", fileKey);
		const fileExtension = fileKey.split(".").pop();
		if (typeof fileExtension == "undefined") {
			throw Error("Can't find file extension");
		}
		const event = {
			jobID,
			fileKey,
			fileIdx: i,
		} as modelTiggerSqsEvent;

		if (videoExtension.includes(fileExtension.toLowerCase())) {
			console.log("send message to seenomaly", event);
			await sendMessage(event, seenomalySqsURL);
			continue;
		}

		// TODO get URL trigger for owl-eye
		if (imageExtension.includes(fileExtension.toLowerCase())) {
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
};

const initFile = (fileName: string, jobID: string): File => {
	const fileExtension = fileName.split(".").pop();
	if (typeof fileExtension == "undefined") {
		throw Error("Can't find file extension");
	}
	const randomfileName = Math.round(Math.random() * 10000000);
	const s3Key = `${jobID}/${randomfileName}.${fileExtension}`;
	const file: File = {
		contentType: extensionToContentType[fileExtension],
		s3Key,
		type: getFileType(fileExtension),
		orginalName: fileName,
		status: FileStatus.NEW,
	};
	return file;
};
