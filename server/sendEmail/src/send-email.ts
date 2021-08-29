/*
Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021

*note when using function you need to add catch for error,
i.e. sendMail(<string>, <string>).catch(console.error)

*/

import { SQSEvent } from 'aws-lambda'
import { getItem, GetItemInput } from './service/dynamodbClient'
import { AttributeMap } from 'aws-sdk/clients/dynamodb'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
// const nodemailer = require("nodemailer");   // import nodemailer to use
dotenv.config()

export const awaitJob = async (request: GetItemInput): Promise<AttributeMap | null> => {
  const res = await getItem(request)
  if (res.Item != null) {
    return res.Item
  }
  return null
}

export const sendEmail = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
  const hostname = 'smtp.gmail.com' // hostname to connect to

  const key: string = JSON.parse(event.Records[0].body).jobKey // get job key from DB
  console.log('Job key: ' + String(key))

  // make request for DB info using job key, store in request
  const request: GetItemInput = {
    TableName: process.env.JOB_TABLE as string,
    Key: {
      id: { S: key }
    }
  }
  const res = await awaitJob(request) // wait for job

  // check if result exists with email and link, will add: && res?.link?.S
  if (res?.email?.S != null) {
    // get email and link from job
    const emailString = res.email.S
    const htmlResult = res.link.S

    // create transport for email
    const transporter = nodemailer.createTransport({
      host: hostname,
      port: 465, // secure -> 465, not secure -> 587
      secure: true,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      },
      logger: true
    })

    // verify connection
    console.log('verifying transporter...')
    /*
        transporter.verify(function (error, success) {
            if (error) {
            console.log(error);
            } else {
            console.log("Server is ready to take our messages");
            }
        });
        */

    console.log('sending email...')
    // send email with defined transport object
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: emailString,
      subject: 'Vision Job Results',
      text: '',
      html: htmlResult
    }) // add callback to get response

    // log response
    console.log('message sent: %s', info.response)
  } else {
    return null
  }
}

exports.handler = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
  return await sendEmail(event, context)
}
