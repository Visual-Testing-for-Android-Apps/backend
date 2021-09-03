// AWS initiating variable
var AWS = require('aws-sdk');import { v4 as uuidv4 } from "uuid"

import { addFileToJob } from "./uploadHandler/src/service/dynamodbService"
import { uploadToS3 } from "./uploadHandler/src/service/S3Client"

export const createNewJob = async (eventBody: string, jobID?:string) => {
	console.log("Running uploadHandler");
    // Upload files 
  const stream  = eventBody
  const extension  = "mp4"
  const fileName = `${uuidv4}.${extension}`
  await uploadToS3(fileName, stream)
	// Saving files
  const id = jobID ?jobID : uuidv4
   await addFileToJob("sample@gmail.com", "", "");

};