import axios, { AxiosRequestConfig } from "axios"

import { getJob } from "./dynamodbService"
import { FileType } from "./jobModel"
import { getDownloadURL } from "./S3Client"

const BASE_URL = "https://4cyjqwwvr5.execute-api.ap-southeast-2.amazonaws.com/Prod"

export const modelTrigger = async (jobID:string) =>{
    const job = await getJob(jobID);
	// check email if verified 
	if (!job.emailVerified){
		return false
	}
    const files = job.files 
    for (const file of files){
        if (file.type == FileType.VIDEO) {
			console.log("send request to seenomaly", file.s3Key)
            // get download url of file
            const downloadURL = await getDownloadURL(file.s3Key)
            console.log("download url",downloadURL )
            // request model
			const response = await axios.post(`${BASE_URL}/Seenomaly`,{
                download_url :downloadURL
            })
            console.log(response)
            // save result to database 
			continue;
		}

		// TODO get URL trigger for owl-eye
		if (file.type == FileType.IMAGE) {
			console.log("send request to owl-eye", event);
		}
    }
}