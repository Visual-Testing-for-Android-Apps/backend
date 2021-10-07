import { getItem, GetItemInput } from "./service/dynamodbClient";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { getEmail, getJobStatus } from "./service/dynamodbService"
import * as dotenv from "dotenv";
dotenv.config(); // configure environment vars
import * as nodemailer from "nodemailer";


/**
 * Gets a job from the database.
 * @param request 
 */
export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null> => {
	const res = await getItem(request);
	if (res.Item != null) {
		return res.Item;
	}
	return null;
};

/**
 * Sends an email to the user telling them that their job is processing.
 * @param key job key to be accessed from db
 */
export const sendProcessingEmail = async (key: string): Promise<any> => {
    console.log("attempting to send job processing email...");
    const smtpEndpoint = process.env.SMTP_EMAIL; // aws email endpoint email
    const port = 465;

	// make request for DB info using job key, store in request
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: {
			id: { S: key },
		},
    };

    // make request, store result in res
    const res = await awaitJob(request);
    // get user email 
    const recipientEmail = await getEmail(key); 
    // get job status
    const currJobStatus = await getJobStatus(key);
    
    // check that job is processing or generating report
    if (currJobStatus === "PROCESSING" || currJobStatus === "GENERATING") {

        // create transport for email
        console.log("creating transporter...");
        const transporter = nodemailer.createTransport({
			host: smtpEndpoint,
			port: port,
			secure: true, // use SSL (with port 465)
			requireTLS: true,
			auth: {
				user: process.env.SMTP_USERNAME,
				pass: process.env.SMTP_PASSWORD,
			},
        });
        
        // send email with defined transport object
        console.log("sending email...");
        const info = await transporter.sendMail({
			from: process.env.EMAIL,
			to: recipientEmail,
			subject: "<p>Vision Job Status<p>",
            text: "",
            html:"<p>Hooray! Your Job is now processing."+"<br><p>A report will be sent to you when finished.</p>",
        });
        
        // log response
        console.log("message sent! message id: ", info.messageId);
        return info;

    } else {
        return null; 
    }

};