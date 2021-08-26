import { SQSEvent } from "aws-lambda";
import { getItem, GetItemInput } from "./service/dynamodbClient";

/**
 * Generates a html report for a given image issue
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
    ]
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
    ]

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
    ]
    const desc: string[] = [
        "Heatmap highlights all potential issues.",
        "'NULL' text is being displayed, instead of the correct information.",
        "A placeholder 'missing/broken image' symbol is displayed, instead of an intended image.",
        "Text is overlapped or obscured by other components."
    ]

    let res = "<h2>Item " + index.toString() + "</h2>";
    res += "<image src='" + filePath + "'>";
    res += "<image src='" + algResultPath + "'>";
    res += "<p>" + titles[algResult] + ".<br>" + desc[algResult] + "</p>";
    return res;
}

/**
 * 
 * @param event 
 * @param context 
 * @returns html string describing issues identified for each img/vid
 */
export const generateReport = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
    const key: string = JSON.parse(event.Records[0].body).jobKey;
    const request: GetItemInput = {
        TableName: 'JobTable',
        Key: {
            batch_id: { S: key }
        }
    };
    const dbRes = await getItem(request);

    let res = "";
    if (dbRes.Item != null) {
        const files = dbRes.Item.files;
        if (files.L != null) {
            files.L.forEach((element, index) => {
                if (element.M != null) {
                    const fileRef = element.M.fileRef.S;
                    const fileType = element.M.fileType.S;
                    const resultCode = element.M.resultCode.N;
                    const resultFileRef = element.M.resultFileReference.S;

                    if (fileType === "image" && !(fileRef == null || resultFileRef == null || resultCode == null)) {
                        res += generateImgReport(index, fileRef, resultFileRef, +resultCode);
                    } else if (fileType === "video" && !(resultCode == null)) {
                        res += generateVidReport(index, +resultCode);
                    }
                    res += "<p><br><br></p>";
                }
            });
        }
    }
    return res;
    // Call Collins' function?
};
