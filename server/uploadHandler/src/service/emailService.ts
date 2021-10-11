import { integer } from "aws-sdk/clients/cloudfront"
import { randomDigits } from "crypto-secure-random-digit"

import {
  getEmailVerification,
  saveVerificationCode,
  updateEmailVerified,
} from "./dynamodbService"
import { FileType, Job } from "./jobModel"
import { EmailOption, sendEmail } from "./nodemailerClient"

const EXPIRE_DURATION  = 500; // in seconds
const isProd = process.env['IS_PROD'] === "true"

export const handleNewEmailSes = async (jobID:string ,emailAddress:string) => {
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
    
    // skip checking code for non-production mode
    if (!isProd){
        await updateEmailVerified(jobID, true)
        return true 
    }

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
    await updateEmailVerified(jobID,true)

    return true

}


const sendVerificationCodeEmail = async (emailAddress: string, verificationCode:string) => {
    const params: EmailOption = {
        to: emailAddress,
        text: `Your secret login code: ${verificationCode}`,
        html: `<html><body><p>Thanks for verifying your ${emailAddress} account!</p>
        <p>your code is:</p>
       <h3>${verificationCode}</h3></body></html>`,
        subject: 'VVTA: verify your email'
    }
    await sendEmail(params);
}

export const emailJobReceived = async (job: Job) =>{
    const videoFileCount = job.files.filter((file)=> file.type = FileType.VIDEO).length
    const imageFileCount = job.files.filter((file)=> file.type = FileType.IMAGE).length
    const params: EmailOption = {
        to: job.email,
        text: `Your visual testing job has been received`,
        html: `<html><body>
        <p>Your visual testing job has been received.<p>
        <p>Your job contains <b>${videoFileCount}</b> video files and <b>${imageFileCount}</b> image files.<p>
        <p>Thanks for using VISION, a visual bug detecting tool for Android apps</p>
        </body></html>`,
        subject: 'VISION: Upload Job Received'
    }
    await sendEmail(params);

}

