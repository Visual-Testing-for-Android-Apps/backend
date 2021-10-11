
import nodemailer from "nodemailer"
import smtpTransport from "nodemailer-smtp-transport"

const hostname = "smtp.gmail.com";  // hostname to connect to
// console.log(process.env.EMAIL);
console.log("email password",process.env.EMAIL_PASSWORD);
const transporter = nodemailer.createTransport({
    host: hostname,
    port: 465, // secure -> 465, not secure -> 587
    secure: true,
    requireTLS: true,
    auth: {
        user: "vision.report.response@gmail.com",
        pass: "kWBbimBP3Aayn9r",
    },
    logger: true
});

// const transporter = nodemailer.createTransport(smtpTransport({
//     service: 'gmail',
//     auth: {
//         user: "vision.report.response@gmail.com",
//         pass: "kWBbimBP3Aayn9r",
//     },
//     logger: true
// }))

// transporter.verify(function (error, success) {
//     if (error) {
//     console.log(error);
//     } else {
//     console.log("Server is ready to take our messages");
//     }
// });

export const sendEmail = async (emailOption: EmailOption)  => {

    // verify connection
    console.log('verifying transporter...')
    // transporter.verify(function (error, success) {
    //     if (error) {
    //     console.log(error);
    //     } else {
    //     console.log("Server is ready to take our messages");
    //     }
    // });
   console.log('sending email...')
    // send email with define transport object
    // currently test email
    // transporter.sendMail({
    //     from: "vision.report.response@gmail.com",
    //     ...emailOption},
    //     function(error, info){
    //         if(error){
    //             return console.log(error);
    //         }
    //         console.log('Message sent: ' + info.response);
    //     }); // add callback to get response
    // log response
    //console.log("message sent: %s", info.response);
    // inform front end email has been sent
    // const info = await transporter.sendMail({
    //         from: "vision.report.response@gmail.com",
    //         ...emailOption})
    // console.log('Message sent: ' + info.response);
    

    transporter.sendMail(
    {
        from: "vision.report.response@gmail.com",
        ...emailOption}, 
        function(error, info){
            if(error){
                console.log(error)
                return
            }
        console.log('Message sent: ' + info.response);

    })

    await transporter.sendMail({
        from: "vision.report.response@gmail.com",
        ...emailOption})

    await sleep(100000)
    console.log("slept finish")
  
}

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export interface EmailOption {
    to: string
    subject: string
    text: string
    html: string
}