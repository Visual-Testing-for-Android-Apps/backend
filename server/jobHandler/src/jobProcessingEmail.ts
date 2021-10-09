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
 * @param key job key to get job details from DB
 */
export const sendProcessingEmail = async (key: string): Promise<any> => {

    console.log("attempting to send job processing email...");
    const port = 465;   // port connecting to the SMTP server.

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
    
    // create transport for email
    console.log("creating transporter...");
    const transporter = nodemailer.createTransport({
        host: process.env.HOST_EMAIL,
        port: port,
        secure: true, // use SSL (with port 465)
        requireTLS: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    
    // send email with defined transport object
    console.log("sending email...");
    const info = await transporter.sendMail({
        from: process.env.EMAIL,
        to: recipientEmail,
        subject: "<p>Vision Job Status</p>",
        text: "",
        html:"<p>Hooray! Your Job is now processing.</p>" +
        "<br><p>A report will be sent to you when finished.</p>",
    });
    
    // log response
    console.log("message sent! message id: ", info.messageId);
    return info;

};