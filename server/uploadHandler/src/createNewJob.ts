import { v4 as uuidv4 } from "uuid"

import { addNewJobToDb } from "./service/dynamodbService"
import { uploadToS3 } from "./service/S3Client"

export const createNewJob = async (eventBody: string, jobID?:string) => {
	// TODO differentiate image body and video body
	console.log("Running uploadHandler");
	// 1. upload files to S3
  const stream  = eventBody
  const extension  = "mp4"
  const fileName = `${uuidv4}.${extension}`
  await uploadToS3(fileName, stream)
	// 2. save job to DB
  const id = jobID ?jobID : uuidv4
   await addNewJobToDb("sample@gmail.com", ["src/v1"], ["src/v2"]);

	// 3. trigger the seenomaly/owleye lamdbas
};
