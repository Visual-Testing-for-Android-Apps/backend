import { SQSEvent } from "aws-lambda";
import { S3 } from "aws-sdk";
import { getItem, GetItemInput, pushToQueue, SendMessageRequest } from './service/dynamodbClient';

/**
 * Generates a html report for a given video issue
 * 
 * @param index - index of original video in batch
 * @param algResult - issue type code
 * @returns html string containing image, heatmap, and description
 */
function generateVidReport(index: number, algResult: number): string {
    const titles: string[] = [
        "Cannot place image in space",
        "Pass through other material",
        "Lack of scrimmed background",
        "Snackbar blocks bottom app bar",
        "Stack multiple banners",
        "Flip card to reveal information",
        "Move one card behind other card",
        "Stack multiple snackbars",
        "Lack of shadow",
        "Invisible scrim of modal bottom sheet"
    ];
    const desc: string[] = [
        "The video could not be matched in the sample space. No known design violations detected.",
        "Text and/or images is found to pass through other page elements resulting in some content being hidden from view.",
        "No scrimmed background is detected which can result in text that is difficult to read.",
        "A snackbar is found to block the app bar at the bottom of the screen which prevents easy page navigation until the snackbar disappears.",
        "Multiple banners were found to stack on each other hiding some information from the user.",
        "A card uses the flip annimation which forces the user to wait for the animation to end before app use can continue.",
        "A card was detected to be behind another card hiding some information from the user.",
        "Multiple snackbars were found to stack on each other hiding some information from the user.",
        "The background lacks shadow when another window appears. This can divert the user's attention away from the window.",
        "UI elements behind a modal bottom sheet lack a visible scrim/filter whilst the bottom sheet is onscreen.  A visible scrim indicates to the user that these elements cannot be interacted with whilst the menu is displayed.",
    ];

    let res = "<h2>Item " + index.toString() + "</h2>";
    res += "<p>" + titles[algResult] + "<br>" + desc[algResult] + "</p>";
    return res;
}


/**
 * Generates a html report for a given image issue
 * 
 * @param index - index of original image in batch
 * @param filePath - filepath to original image
 * @param algResultPath - filepath to heatmap outputted from OwlEyes algorithm
 * @param algResult - issue type code
 * @returns html string containing image, heatmap, and description
 */
function generateImgReport(index: number, filePath: string, algResultPath: string, algResult: number): string {
    const titles: string[] = [
        "General issue heatmap",
        "Null value",
        "Missing image",
        "Component occlusion"
        // no models for blurred screen or text overlap, so no description is needed
    ];
    const desc: string[] = [
        "Heatmap highlights all potential issues.",
        "'NULL' text is being displayed, instead of the correct information.",
        "A placeholder 'missing/broken image' symbol is displayed, instead of an intended image.",
        "Text is overlapped or obscured by other components."
    ];

    let res = "<h2>Item " + index.toString() + "</h2>";
    res += "<image src='" + filePath + "'>";
    res += "<image src='" + algResultPath + "'>";
    res += "<p>" + titles[algResult] + ".<br>" + desc[algResult] + "</p>";
    return res;
}

/**
 * Adds html report for a batch to s3 bucket. The function that's run when the lambda function is called.
 * 
 * @param event object containing information about the job as defined here: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
 *              The body attribute is a json object as a string containing job information
 * @param context object containing information about the invocation, function, and execution environment
 * @returns html string describing issues identified for each image and/or video
 */
export const generateReport = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
    // fetch job results from database
    const key: string = JSON.parse(event.Records[0].body).jobKey;  // queue batchsize = 1, so Records[0].length = 1
    const request: GetItemInput = {
        TableName: process.env.JOB_TABLE, 
        Key: {
            batch_id: { S: key }
        }
    };
    const dbRes = await getItem(request);

    // construct HTML report contents
    let res = "<!DOCTYPE html><html lang='en'><head></head><body><div>";
    if (dbRes.Item != null) {
        const files = dbRes.Item.files;
        if (files.L != null) {

            // Iterate through each file
            files.L.forEach((element, index) => {
                if (element.M != null) {
                    const fileRef = element.M.fileRef.S;
                    const fileType = element.M.fileType.S;
                    const resultCode = element.M.resultCode.N;
                    const resultFileRef = element.M.resultFileReference.S;

                    // Add image/vid string to overall report string
                    if (fileType != null && resultCode != null) {
                        if (fileType === "image" && fileRef != null && resultFileRef != null) {
                            res += generateImgReport(index, fileRef, resultFileRef, +resultCode);
                        } else if (fileType === "video") {
                            res += generateVidReport(index, +resultCode);
                        }
                        res += "<p><br><br></p>";
                    }
                }
            });
        }
    }
    res += "</div></body></html>";

    /* Add html file to s3 bucket */
    const filepath = key + "/report.html";
    const s3params = {
        Bucket: process.env.SRC_BUCKET,
        Key: filepath, // File name you want to save as in S3
        Body: res
    };
    const s3 = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    s3.upload(s3params);

    // AWS_ACCESS_KEY=<your_access_key> AWS_SECRET_ACCESS_KEY=<your_secret_key> node index.js


    /* Add batch to file zip queue */
    const params: SendMessageRequest = {
        MessageBody: '{ "queryStringParameters": { "id": "' + String(key) + '" } }', // zipfile accesses event["queryStringParameters"]["id"]
        QueueUrl: process.env.FILE_ZIP_QUEUE as string,
    };
    pushToQueue(params);
    
    return res;
};


// Currently, generateReport is called by the lambda function, so this is unused
// export const handler = (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
//     return generateReport(event, context);
// }