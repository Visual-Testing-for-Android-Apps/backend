/* 
Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021 

*/

import {credentials} from './credentials';

async function sendEmail(emailString: string, htmlResult: string) {
    
    const nodemailer = require("nodemailer");
    const hostname = "smtp.gmail.com";  // hostname to connect to


    const transporter = nodemailer.createTransport({
        host: hostname,
        port: 465, // secure -> 465, not secure -> 587
        secure: true,
        requireTLS: true,
        auth: {
            user: credentials.email,
            pass: credentials.password,
        },
        logger: true
    });

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
    // send email with define transport object
    // currently test email
    const info = await transporter.sendMail({
        from: credentials.email,
        to: emailString,
        subject: "Vision Job Results",
        text: "",
        html: htmlResult,
    }); // add callback to get response

    // log response
    console.log("message sent: %s", info.response);

    // inform front end email has been sent
}