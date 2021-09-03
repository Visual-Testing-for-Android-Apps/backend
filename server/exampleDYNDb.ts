var AWS = require('aws-sdk');import { v4 as uuidv4 } from "uuid"

import { addFileToJob } from "./uploadHandler/src/service/dynamodbService"
import { uploadToS3 } from "./uploadHandler/src/service/S3Client"

export const createNewJob = async (eventBody: string, jobID?:string) => {
	console.log("Running uploadHandler");
	// 1. upload files to S3
  const stream  = eventBody
  const extension  = "mp4"
  const fileName = `${uuidv4}.${extension}`
  await uploadToS3(fileName, stream)
	// 2. save job to DB
  const id = jobID ?jobID : uuidv4
   await addFileToJob("sample@gmail.com", "", "");

};