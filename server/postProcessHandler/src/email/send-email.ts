/* 
script to be called by post process handler when job is complete
code referencing: https://www.cloudmailin.com/blog/sending_and_receiving_email_in_node_2021 

TODO:
- link to post process handler so called when job is complete
- get user email from DB (link DB)
- get report link to send
- need to verify account without including password as repo is open source

*/

import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

async function main() {
    const hostname = "smtp.gmail.com";  // hostname to connect to
    const sender_email = "vtaa.report.response@gmail.com";  // team email (sender)
    const password = String(prompt("enter password: "));    // ask for password
    const receiver_email = "adel0011@student.monash.edu"


    const transporter = nodemailer.createTransport({
        host: hostname,
        port: 465, // secure -> 465, not secure -> 587
        secure: true,
        requireTLS: true,
        auth: {
            user: sender_email,
            pass: password,
        },
        logger: true
    });

    // verify connection
    transporter.verify(function (error, success) {
        if (error) {
        console.log(error);
        } else {
        console.log("Server is ready to take our messages");
        }
    });
  
    // send email with define transport object
    // currently test email
    const info = await transporter.sendMail({
        from: sender_email,
        to: receiver_email,
        subject: "Test Email",
        text: " this is test email from VTAA",
        html: "<strong> test html </strong>",
    });

    console.log("message sent: %s", info.response);
}