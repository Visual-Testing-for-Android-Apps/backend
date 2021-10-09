import { SQSEvent } from "aws-lambda";
import { getItem, GetItemInput } from "./service/dynamodbClient";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { addPasswordToJob, getEmail } from "./service/dynamodbService"
import { v4 as uuidv4 } from "uuid";
import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();
//const nodemailer = require("nodemailer");

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
 * Sends an email to the user associated with the job that triggered the SQS Event.
 * The email contains a url link that is used to access the batch job results report,
 * 
 * @param event SQS event indicating that job has finished and email can be sent
 * @param context 
 */
export const sendEmail = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {

	const port = 465; 	// port connecting to the SMTP server.
	const baseUrl = 'https://afternoon-woodland-24079.herokuapp.com/batchreportpage/'; // url to add job id and pwd to

	// get job key from DB
	const key: string = JSON.parse(event.Records[0].body).jobKey;

	// make request for DB info using job key, store in request
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: { id: { S: key } },
	};

	// make request, store result in res
	const res = await awaitJob(request);

	// get user email address
	const recipientEmail = await getEmail(key); 

	// create transport for email (if account in sandbox email needs to be verified)
	console.log("creating transporter...");
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_EMAIL, // email with aws region
		port: port,
		secure: true, // use SSL (with port 465)
		requireTLS: true,
		auth: {
			user: process.env.SMTP_USERNAME,
			pass: process.env.SMTP_PASSWORD,
		},
	});

	console.log("verifying transporter...");
	// verify connection
	/*
	transporter.verify(function (error, success) {
		if (error) {
			console.log(error);
		} else {
			console.log("Server is ready to take our messages");
		}
	});
	*/

	// create unique password
	const password = uuidv4();
	// add password to job in db
	await addPasswordToJob(key, password);
	// format url to send via email
	const emailUrl = baseUrl + key + '?pwd=' + password;

	// send email with defined transport object
	console.log("sending email with url " + emailUrl);
	const info = await transporter.sendMail({
		from: process.env.EMAIL,
		to: recipientEmail,
		subject: "<p>Vision Job Results</p>",
		text: "",
		html:
			'<p>Job Processing Complete. <br>Your <a href="' +
			emailUrl +
			'">Job Results</a> are now available.</p>' +
			"<br><p>Thanks for using Vision!</p>",
	});

	// log response
	console.log("message sent! message id: ", info.messageId);
};

exports.handler = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	return await sendEmail(event, context);
};
