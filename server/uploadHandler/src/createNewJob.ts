
import { v4 as uuidv4 } from "uuid"

import { addFileToJob, createNewJobItem } from "./service/dynamodbService"
import { handleNewEmailSes } from "./service/emailService"
import {
  extensionToContentType,
  File,
  FileStatus,
  getFileType,
} from "./service/jobModel"
import { getUploadURL } from "./service/S3Client"

export interface FileUploadResponseBody {
	uploadUrls: {[key:string]:string};
	jobID: string;
}

export const createNewJob = async (eventBody: string): Promise<FileUploadResponseBody> => {
	// 0. parse event body
	const parsedBody = JSON.parse(eventBody);
	const email = parsedBody["email"];
	const filenames = parsedBody["fileNames"];

	const jobID = uuidv4();
	// 2. create new job record in db
	await createNewJobItem(jobID, email);
	// 3. send verification code 
	await handleNewEmailSes(jobID,email)
	// 4. init file upload
	const returnBody:FileUploadResponseBody = {uploadUrls:{}, jobID}
	for (const fileName of filenames){
		const file = initFile(fileName, jobID)
		// 4.1. generate preSigned Url for files to S3
		const uploadUrl = await getUploadURL(file.s3Key, file.contentType);
		// 4.2. save files to DB
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
