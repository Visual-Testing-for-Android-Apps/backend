/*
Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021

*/

import { SQSEvent } from "aws-lambda";
import { getItem, GetItemInput } from "./service/dynamodbClient";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config(); // configure environment vars

export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null> => {
	const res = await getItem(request);
	if (res.Item != null) {
		return res.Item;
	}
	return null;
};

export const sendEmail = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	const hostname = "smtp.gmail.com"; // hostname to connect to

	const key: string = JSON.parse(event.Records[0].body).jobKey; // get job key from DB
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
		const emailString = res.email.S;
		const htmlResult = res.resultsURL.S;

		// create transport for email
		const transporter = nodemailer.createTransport({
			host: hostname,
			port: 465, // secure -> 465, not secure -> 587
			secure: true, // use SSL
			requireTLS: true,
			auth: {
				user: process.env.EMAIL,
				pass: process.env.PASSWORD,
			},
		});

		console.log("verifying transporter...");
		// verify connection
		transporter.verify(function (error, success) {
			if (error) {
				console.log(error);
			} else {
				console.log("Server is ready to take our messages");
			}
		});

		console.log("sending email...");
		// send email with defined transport object
		const info = await transporter.sendMail({
			from: process.env.EMAIL,
			to: emailString,
			subject: "<p>Vision Job Results<p>",
			text: "",
			html:
				'<p>Job Processing Complete. <br>Your <a href="' +
				htmlResult +
				'">Job Results</a> are now available.</p>' +
				"<br><p>Thanks for using Vision!</p>",
		});

		// log response
		console.log("message sent: %s", info.response);
	} else {
		return null;
	}
};

exports.handler = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
	return await sendEmail(event, context);
};
