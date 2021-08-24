/* 
Script for sending email to user of job results
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021 

*note when using function you need to add catch for error, 
i.e. sendMail(<string>, <string>).catch(console.error)

*/

// import {credentials} from './credentials';
import dotenv from 'dotenv';
dotenv.config();

async function sendEmail(emailString: string, htmlResult: string) {
    
    const nodemailer = require("nodemailer");
    const hostname = "smtp.gmail.com";  // hostname to connect to


    const transporter = nodemailer.createTransport({
        host: hostname,
        port: 465, // secure -> 465, not secure -> 587
        secure: true,
        requireTLS: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
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
        from: process.env.EMAIL,
        to: emailString,
        subject: "Vision Job Results",
        text: "",
        html: htmlResult,
    }); // add callback to get response

    // log response
    console.log("message sent: %s", info.response);

    // inform front end email has been sent
}
