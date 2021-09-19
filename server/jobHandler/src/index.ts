import { SQSEvent } from "aws-lambda"

import { isJobComplete } from "./isJobComplete.js"
import { getJob } from "./service/dynamodbService"
import { JobStatus } from "./service/jobModel"
import { modelTrigger } from "./service/modelTrigger"
import { selfEnvoke } from "./service/sqsClient.js"

//Exports isJobComplete for use with AWS lambda
export const handler = async (event: SQSEvent, context: AWSLambda.Context): Promise<void> => {
	try{
		//Push a request to our SQS queue for the next iteration
		const key: string = JSON.parse(event.Records[0].body).jobKey;
		const runJob =  jobHandler(context,key)
		const timeoutPeriod = context.getRemainingTimeInMillis() - 10 * 1000
		const lambdaTimeoutMonitorTask: Promise<string> = new Promise((resolve) => {
		setTimeout(() => resolve("timeout"), timeoutPeriod)
		})
		const result = await Promise.race([runJob, lambdaTimeoutMonitorTask])
		if ((result as string) == "timeout"){
			// throw Error(JSON.stringify({ key, reason: "jobHandler time out" }))
			await selfEnvoke(key)
			return 
		}
		if (!(result as { skipSelfInvoke: boolean }).skipSelfInvoke) {
			await selfEnvoke(key)
			return
		}
		console.log(JSON.stringify({
			jobID :key,
			message: "🎉job completed"
		}))
		return 
	} catch (err) {
		console.error("DrawRunner terminated", err)
	}
};

const jobHandler = async (context: AWSLambda.Context,key:string ): Promise<{ skipSelfInvoke: boolean }>=>{
	//Job request object.
	const job = await getJob(key)
	//(QUES1) Check if this job is already complete
	if (job.jobStatus == JobStatus.GENERATING) {
		throw Error(`job:${job.id} already finished`) 
	}
	// check email if verified 
	if (!job.emailVerified){
		throw Error(`job:${job.id} not verified`) 
	}
	await modelTrigger(context,job)
	//The actual checking if all jobs are complete could be redundant, but leaving it in doesn't hurt anything
	return {skipSelfInvoke:await isJobComplete(key)}
}
 

