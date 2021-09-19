
import axios from "axios"
import axiosRetry from "axios-retry"

import { fileResult, saveFileProcessResult } from "./dynamodbService"
import { FileStatus, FileType, Job, Models } from "./jobModel"
import {
	getDownloadURL,
	uploadBase64EncodedImage,
	uploadToS3,
} from "./S3Client"

const BASE_URL = "https://u8iacl4gj0.execute-api.ap-southeast-2.amazonaws.com/Prod"
axiosRetry(axios, { retries: 3 });
// Draw runner triggers self-invoke when 1 minutes left.
const remainingTimeThresholdInMillis = 60*1000

export const modelTrigger = async (context: AWSLambda.Context, job: Job) => {
	const files = job.files
	for (let i = 0; i < files.length; i++) {
		const file = files[i]
		if (file.status == FileStatus.DONE) {
			continue
		}

		if (file.type == FileType.VIDEO) {
			const response = await getModelResponse(Models.SEENOMALY, file.s3Key)
			if (response) {
				const result = {
					code: response.data.classification,
					message: response.data.explanation
				} as fileResult
				await saveFileProcessResult(job.id, i, result)
			}
		} else if (file.type == FileType.IMAGE) {
			const outputKey = job.id + "/result/result_" + file.s3Key.split("/").pop()
			const response = await getModelResponse(Models.OWLEYE, file.s3Key)
			// save to dy
			if (response) {
				// save to s3
				await uploadBase64EncodedImage(response.data["res_img"], outputKey)
				// save to db
				const result = {
					message: response.data.bug_type,
					outputKey
				} as fileResult
				await saveFileProcessResult(job.id, i, result)
			}
		}

		if (context.getRemainingTimeInMillis() > remainingTimeThresholdInMillis) {
			return
		}
	}
}

const getModelResponse = async (model: string, fileKey: string) => {
	const downloadURL = await getDownloadURL(fileKey)
	console.log("download url", downloadURL)
	const response = await axios.post(`${BASE_URL}/${model}`, {
		download_url: downloadURL
	})
	console.log("response", response)
	return response
}
