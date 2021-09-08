import { SES } from "aws-sdk"
import { randomDigits } from "crypto-secure-random-digit"

import {
  getEmailVerification,
  saveVerificationCode,
  updateEmailToVerified,
} from "./dynamodbService"

const ses = new SES();
const EXPIRE_DURATION  = 500; // in seconds


export const handlerNewEmailSes = async (jobID:string ,emailAddress:string) => {
    const verificationCode = randomDigits(6).join('');
    Promise.all([
        sendVerificationCodeEmail(emailAddress, verificationCode),
        saveVerificationCode(jobID,verificationCode)
    ])
}

export const checkVerificationCode = async (jobID:string, userVerificationCode:string):Promise<boolean> =>{
    // get code from db 
    const savedVerification = await getEmailVerification(jobID)
    console.log("savedVerification", savedVerification)
    // check time stamp 
    const currentTime = new Date();
    const verifyTime = new Date(savedVerification.createdAt);
    const timeDiff = Math.abs(verifyTime.getTime() - currentTime.getTime())/1000; // in seconds
    if (timeDiff > EXPIRE_DURATION){
        console.log("timestamp expired", {
            timeDiff,
            currentTime,
            verifyTime
        })
        return false;
    }
    // check code
    if (savedVerification.code !== userVerificationCode){
        console.log("wrong code", {
            userVerificationCode,
            correctCode: savedVerification.code
        })
        return false;
    }
    // update db 
    await updateEmailToVerified(jobID)

    return true

}


const sendVerificationCodeEmail = async (emailAddress: string, verificationCode:string) => {
    const params:  SES.SendEmailRequest= {
        Destination: { ToAddresses: [emailAddress] },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<html><body><p>Thanks for verifying your ${emailAddress} account!</p>
                            <p>your code is:</p>
                           <h3>${verificationCode}</h3></body></html>`
                },
                Text: {
                    Charset: 'UTF-8',
                    Data: `Your secret login code: ${verificationCode}`
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'VVTA: verify your email'
            }
        },
        Source: process.env.SES_FROM_ADDRESS!
    };
    await ses.sendEmail(params).promise();
}