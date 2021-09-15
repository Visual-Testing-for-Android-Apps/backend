import { v4 as uuidv4 } from "uuid"

import { addFileToJob, createNewJobItem } from "./service/dynamodbService"
import {
  extensionToContentType,
  File,
  FileStatus,
  getFileType,
} from "./service/jobModel"
import { getUploadedFilesInJob, getUploadURL } from "./service/S3Client"
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient"

const seenomalySqsURL = process.env.SEENORMALY_URL as string;
const videoExtension = ["mp4"];
const imageExtension = ["jpg", "jpeg"];

export interface FileUploadResponseBody {
	uploadUrls: { [key: string]: string };
	jobID: string;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const jobID = parsedBody["jobID"];
	const uploadDone = parsedBody["uploadDone"] === "true";
	// 3. trigger
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
	for (const i=0;i < uploadedFiles.length; i++) {
		const fileKey = uploadedFiles[i]
		console.log("fileKey", fileKey);
		const fileExtension = fileKey.split(".").pop();
		if (typeof fileExtension == "undefined") {
			throw Error("Can't find file extension");
		}
		const event = {
			jobID,
			fileKey,
			fileIdx:i
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
