
import { v4 as uuidv4 } from "uuid"

import { addFileToJob, createNewJobItem } from "./service/dynamodbService"
import {
  extensionToContentType,
  File,
  FileStatus,
  getFileType,
} from "./service/jobModel"
import { getUploadURL } from "./service/S3Client"
import { handleNewEmailSes } from "./service/sesService"

export interface FileUploadResponseBody {
	uploadUrl?: string;
	jobID: string;
	verified?: boolean;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const recievedJobID = parsedBody["jobID"];
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
	await handleNewEmailSes(jobID,email)
	// 4. init file upload
	for (const fileName of fileNames){
		const file = initFile(fileName, jobID)
		// 4.1. generate preSigned Url for files to S3
		const uploadUrl = await getUploadURL(file.s3Key, file.contentType);
		// 4.2. save job to DB
		await addFileToJob(jobID, file);
		returnBody.uploadUrls[fileName] = uploadUrl
	}

	console.log("Running uploadHandler");
	return returnBody;
};




const initFile = (fileName:string, jobID:string): File => {
	const fileExtension = fileName.split(".").pop();
	if (typeof fileExtension == "undefined"){
		throw Error("Can't find file extension")
	}
	const randomfileName = Math.round(Math.random() * 10000000);
	const s3Key = `${jobID}/${randomfileName}.${fileExtension}`;
	const file:File = {
		contentType: extensionToContentType[fileExtension],
		s3Key,
		type: getFileType(fileExtension),
		orginalName: fileName, 
		status:FileStatus.NEW,
	}
	return file

} 
