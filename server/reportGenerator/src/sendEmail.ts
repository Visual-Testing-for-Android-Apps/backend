import { AttributeMap } from "aws-sdk/clients/dynamodb"
import * as dotenv from "dotenv"
import * as nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

import { getItem, GetItemInput } from "./service/dynamodbClient"
import { addPasswordToJob, getEmail } from "./service/dynamodbService"

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
 * @param key job key to get job details from DB
 */
export const sendEmail = async (key: string): Promise<any> => {

	const port = 465; 	// port connecting to the SMTP server.
	const baseUrl = 'https://afternoon-woodland-24079.herokuapp.com/batchreportpage/'; // url to add job id and pwd to

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
		host: process.env.HOST_EMAIL, // email through smtp gmail server
		port: port,
		secure: true, // use SSL (with port 465)
		requireTLS: true,
		auth: {
			user: process.env.EMAIL,  	// Vision email address
			pass: process.env.PASSWORD, // Vision email password
		},
	});

	// create unique password
	const password = uuidv4();
	// add password to job in db
	await addPasswordToJob(key, password);
	// format url to send via email
	const emailUrl = baseUrl + key + '?pwd=' + password;

	// send email with defined transport object
	console.log("sending email with url " + emailUrl);
	const info = await transporter.sendMail({
		from: '"Vision"<' + String(process.env.EMAIL)+'>',
		to: recipientEmail,
		subject: "Vision Job Results",
		text: "",
		html:
			'<p>Hi there,</p>'+
			'<p>Your ' +
			'<a style="text-decoration:none;" href="' +
			emailUrl +
			'">Job Results</a> are now available.</p>' +
			'<p>We hope you enjoyed using Vision!</p>' +
			'<p>Thanks, <br>Vision Team</p>'
	});

	// log response
	console.log("message sent! message id: ", {
	...info, 
	recipientEmail,
	});
	return info; 
};
