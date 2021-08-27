import { SQS } from "aws-sdk"
import { v4 as uuidv4 } from "uuid"

import { addFileToJob, createNewJobItem } from "./service/dynamodbService"
import { uploadToS3 } from "./service/S3Client"
import { modelTiggerSqsEvent, sendMessage } from "./service/sqsClient"

const seenomalySqsURL = process.env.SEENORMALY_URL as string;
const videoExtension  =["mp4"]
const imageExtension = ["jpg", "jpeg"]

export const createNewJob = async (eventBody: string, jobID?:string) => {
  const id = jobID ?jobID : uuidv4
  const filename = "test_fileName"
  const test_email = "abc@gmail.com"
	// TODO differentiate image body and video body
	console.log("Running uploadHandler");
	// 1. upload files to S3
  const stream  = eventBody
  const extension  = "mp4"
  const fileKey = `${id}/${filename}.${extension}`
  await uploadToS3(fileKey, stream) 
	// 2. save job to DB
  if (!jobID){
    await createNewJobItem(id.toString(), test_email);
  } 
  await addFileToJob(id.toString(), fileKey, extension)
  
	// 3. trigger the seenomaly/owleye lamdbas
  const event = {
    jobId: id,
    fileReference: fileKey
  } as modelTiggerSqsEvent

  if (videoExtension.includes(extension.toLowerCase())){
    await sendMessage(
      event,
      seenomalySqsURL
    )
    return 
  }

  // TODO get URL trigger for owl-eye
  if (imageExtension.includes(extension.toLowerCase())){
    // await sendMessage(
    //   event,
    //   seenomalySqsURL
    // )
    console.log("send message to owl-eye")
    return 
  }

  throw Error(JSON.stringify({
    jobId: id,
    fileKey,
    message: "unrecoganised file extension"
  }))
};


