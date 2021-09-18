
import axios, { AxiosRequestConfig } from "axios"
import axiosRetry from "axios-retry"

import { fileResult, getJob, saveFileProcessResult } from "./dynamodbService"
import { FileStatus, FileType, Models } from "./jobModel"
import { getDownloadURL, uploadBase64EncodedImage } from "./S3Client"

const BASE_URL = "https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod"
axiosRetry(axios, { retries: 3 });

export const modelTrigger = async (jobID:string) =>{
    const job = await getJob(jobID);
	// check email if verified 
	if (!job.emailVerified){
		return false
	}
    const files = job.files 
    for (let i=0;i < files.length;i++){
        const file = files[i]
        if (file.status == FileStatus.DONE){
            continue
        }
        if (file.type == FileType.VIDEO){
            const response = await getModelResponse(Models.SEENOMALY, file.s3Key)
            if (response){
                const result = {
                    code: response.data.classification,
                    message: response.data.explanation
                } as fileResult
                await saveFileProcessResult(jobID,i, result)
            }
            continue
        }

        if (file.type == FileType.IMAGE){
            const outputKey  = jobID + "/result/result_" + file.s3Key.split("/").pop()
            const response = await getModelResponse(Models.OWLEYE, file.s3Key)
            // save to dy
            if (response){
                // save to s3
                await uploadBase64EncodedImage(response.data["res_img"],outputKey)
                // save to db
                const result = {
                    message: response.data.bug_type,
                    outputKey
                } as fileResult
                await saveFileProcessResult(jobID,i, result)
            }
        }

    }
}

const getModelResponse = async (model:string, fileKey:string) => {
    const downloadURL = await getDownloadURL(fileKey)
    console.log("download url",downloadURL )
    // let response;
    // const startTime = new Date()
    // request model
    // do {
    //     const curretTime = new Date()
    //     const collapse = Math.abs(startTime.getTime() - curretTime.getTime())/1000 // in seconds
    //     if (collapse > 300 ){
    //         break // timeout
    //     }
    const response = await axios.post(`${BASE_URL}/${model}`,{
        download_url :downloadURL
    })
    console.log("response", response)
    // }while(response.status == 408)  // 408 => time out 

    return response
}

