/* 
usage: 
        node ./send-email.js

Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021 
*/


import nodemailer from "nodemailer"
import * as dotenv from 'dotenv';
dotenv.config()

const sendEmail = async (emailString, htmlResult)  => {
    
    const hostname = "email-smtp.ap-southeast-2.amazonaws.com";  // hostname to connect to
    // console.log(process.env.EMAIL);
    console.log("password",process.env.EMAIL_PASSWORD);
    const transporter = nodemailer.createTransport({
        host: hostname,
        port: 465, // secure -> 465, not secure -> 587
        secure: true,
        requireTLS: true,
        auth: {
            user: "vision.report.response@gmail.com",
            pass: process.env.EMAIL_PASSWORD,
        },
        logger: true
    });
    // verify connection
    console.log('verifying transporter...')
    
    transporter.verify(function (error, success) {
        if (error) {
        console.log(error);
        } else {
        console.log("Server is ready to take our messages");
        }
    });
    
   console.log('sending email...')
    // send email with define transport object
    // currently test email
    const info = await transporter.sendMail({
        to: emailString,
        subject: "Vision Job Results",
        text: "",
        html: '<p>Job Processing Complete.'+'<br>Your '+'<a href="'+htmlResult+'">Job Results</a> are now available.</p>'
        +'<br><p>Thanks for using Vision!</p>',
    }) // add callback to get response
    // log response
    console.log("message sent: %s", info.response);

    // inform front end email has been sent
}




sendEmail("beining0026@gmail.com", "https://www.google.com/");
sendEmail("jeanne_chen@126.com", "https://www.google.com/");