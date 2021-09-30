import { SQSEvent } from "aws-lambda"
import { S3 } from "aws-sdk"
import {
	pushToQueue,
	SendMessageRequest,
} from "./service/dynamodbClient"
import { getJob } from "./service/dynamodbService"
import { FileType, Job, JobStatus } from "./service/jobModel"

/**
 * Generates a html report for a given video issue
 *
 * @param filePath - filepath to original video
 * @param algResult - issue type code
 * @returns html string containing image, heatmap, and description
 */
function generateVidReport(filePath: string, algResult: number): Record<string, string> {
	const titles: string[] = [
		'Cannot place image in space',
		'Pass through other material',
		'Lack of scrimmed background',
		'Snackbar blocks bottom app bar',
		'Stack multiple banners',
		'Flip card to reveal information',
		'Move one card behind other card',
		'Stack multiple snackbars',
		'Lack of shadow',
		'Invisible scrim of modal bottom sheet'
	]
	const desc: string[] = [
		'The video could not be matched in the sample space. No known design violations detected.',
		'Text and/or images is found to pass through other page elements resulting in some content being hidden from view.',
		'No scrimmed background is detected which can result in text that is difficult to read.',
		'A snackbar is found to block the app bar at the bottom of the screen which prevents easy page navigation until the snackbar disappears.',
		'Multiple banners were found to stack on each other hiding some information from the user.',
		'A card uses the flip annimation which forces the user to wait for the animation to end before app use can continue.',
		'A card was detected to be behind another card hiding some information from the user.',
		'Multiple snackbars were found to stack on each other hiding some information from the user.',
		"The background lacks shadow when another window appears. This can divert the user's attention away from the window.",
		'UI elements behind a modal bottom sheet lack a visible scrim/filter whilst the bottom sheet is onscreen.  A visible scrim indicates to the user that these elements cannot be interacted with whilst the menu is displayed.'
	]

	return {
		title: titles[algResult],
		desc: desc[algResult],
		video: filePath,
	};
}

/**
 * Generates a html report for a given image issue
 *
 * @param filePath - filepath to original image
 * @param algResultPath - filepath to heatmap outputted from OwlEyes algorithm
 * @param algResult - issue type code
 * @returns html string containing image, heatmap, and description
 */
function generateImgReport(
	filePath: string,
	algResultPath: string,
	algResult: number
): Record<string, string> {
	const titles: string[] = [
		"General issue heatmap",
		"Null value",
		"Missing image",
		"Component occlusion"
		// no models for blurred screen or text overlap, so no description is needed
	]
	const desc: string[] = [
		"Heatmap highlights all potential issues.",
		"'NULL' text is being displayed, instead of the correct information.",
		"A placeholder 'missing/broken image' symbol is displayed, instead of an intended image.",
		"Text is overlapped or obscured by other components."
	]

	return {
		title: titles[algResult],
		desc: desc[algResult],
		orig_image: filePath,
		heatmap_image: algResultPath,
	};
}

/**
 * Adds html report for a batch to s3 bucket, then adds the batch to a queue for file zipping.
 * The report is saved in the bucket as <batch_id>/report.html
 * DynamoDB data about a batch is assumed to be in the format defined here: https://github.com/Visual-Testing-for-Android-Apps/backend/issues/15#issuecomment-898450609
 * with the exception of "batch_id" being "id" instead due to issues.
 *
 * @param event object containing information about the job. Its body attribute is a stringified json object containing a batch's id as jobKey
 * @param context object containing information about the invocation, function, and execution environment
 * @returns html string describing issues identified for each image and/or video
 */
export const generateReport = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	// fetch job results from database
	const key: string = JSON.parse(event.Records[0].body).jobKey // queue batchsize = 1, so Records[0].length = 1	
	const job: Job = await getJob(key);
	if (job.jobStatus != JobStatus.GENERATING) {
		console.log(`job: ${key} not ready for report generation yet`)
		return
	}
	const files = job.files

	// construct HTML report contents
	const image: Record<string, string>[] = [];
	const video: Record<string, string>[] = [];

	if (dbRes.Item != null) {
		const files = dbRes.Item.files;
		if (files.L != null) {
			// Iterate through each file
			files.L.forEach((element) => {
				if (element.M != null) {
					const fileRef = element.M.fileRef.S;
					const fileType = element.M.fileType.S;
					const resultCode = element.M.resultCode.N;
					const resultFileRef = element.M.resultFileReference.S;

					// Add image/vid string to overall report string
					if (fileType != null && fileRef != null && resultCode != null) {
						if (fileType === "image" && resultFileRef != null) {
							image.push(generateImgReport(fileRef, resultFileRef, +resultCode));
						} else if (fileType === "video") {
							video.push(generateVidReport(fileRef, +resultCode));
						}
					}
				}
			});
		}
	}

	// Add html file to s3 bucket
	const filepath = key + "/report.json";
	const s3params = {
		Bucket: process.env.SRC_BUCKET as string,
		Key: filepath, // File name you want to save as in S3
		Body: JSON.stringify({ images: image, videos: video }),
	};

	const s3 = new S3({
		accessKeyId: process.env.AWS_ACCESS_KEY,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	})

	// need to await, otherwise if the lambda function terminates before the upload is finished, it won't complete
	await s3.upload(s3params).promise()

	// Add batch to email queue
	const params: SendMessageRequest = {
		MessageBody: '{ "jobKey": "' + String(key) + '" }',
		QueueUrl: process.env.EMAIL_QUEUE as string,
	};
	pushToQueue(params);
};
