/*
Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021

*/

import { SQSEvent } from "aws-lambda";
import { getItem, GetItemInput } from "./service/dynamodbClient";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import * as dotenv from "dotenv";
dotenv.config(); // configure environment vars
import * as nodemailer from "nodemailer";
//const nodemailer = require("nodemailer");

export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null> => {
	const res = await getItem(request);
	if (res.Item != null) {
		return res.Item;
	}
	return null;
};

export const sendEmail = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	// endpoint with syndey aws region
	const smtpEndpoint = "email-smtp.ap-southeast-2.amazonaws.com";
	// The port to use when connecting to the SMTP server.
	const port = 465;
	// get job key from DB
	const key: string = JSON.parse(event.Records[0].body).jobKey;
	console.log("Job key: " + String(key));

	// make request for DB info using job key, store in request
	const request: GetItemInput = {
		TableName: process.env.JOB_TABLE as string,
		Key: {
			id: { S: key },
		},
	};
	// make request, store result in res
	const res = await awaitJob(request);

	// checks that email and results exist
	if (res?.email?.S != null && res?.resultsURL?.S != null) {
		// get email and results from job
		const recipientEmail = res.email.S; // recipient email address; if account in sandbox - this needs to be verified.
		const htmlResult = res.resultsURL.S;

		// create transport for email
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

		console.log("sending email...");
		// send email with defined transport object
		const info = await transporter.sendMail({
			from: process.env.EMAIL,
			to: recipientEmail,
			subject: "<p>Vision Job Results<p>",
			text: "",
			html:
				'<p>Job Processing Complete. <br>Your <a href="' +
				htmlResult +
				'">Job Results</a> are now available.</p>' +
				"<br><p>Thanks for using Vision!</p>",
		});

		// log response
		console.log("message sent! message id: ", info.messageId);
	} else {
		return null;
	}
};

exports.handler = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	return await sendEmail(event, context);
};
