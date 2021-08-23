function generate_vid_report(index: number, algResult: number) {
    // Input: index of vid in batch, number outputted from Seenomally alg
    // Output: html string describing identified UI issue

    let titles: string[] = [
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
    let desc: string[] = [
        "The video could not be matched in the sample space. No known design violations detected.",
        "Text and/or images is found to pass through other page elements resulting in some content being hidden from view.",
        "No scrimmed background is detected which can result in text that is difficult to read.",
        "A snackbar is found to block the app bar at the bottom of the screen which prevents easy page navigation until the snackbar disappears.",
        "Multiple banners were found to stack on each other hiding some information from the user.",
        "A card is found to use the flip annimation.", // ADD MORE
        "", // ONE CARD BEHIND OTHER
        "Multiple snackbars were found to stack on each other hiding some information from the user.",
        "The background lacks shadow when another window appears which can take away the users attention.",
        "", // SCRIM
    ]

    let res = "<h2>Item " + (index) + "</h2>";
    res += "<p>" + titles[algResult] + ".<br>" + desc[algResult] + "</p>";
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
function generate_img_report(index: number, filePath: string, algResultPath: string, algResult: number) {
    let titles: string[] = [
        "General issue heatmap",  
        "Null value",
        "Missing image",
        "Component occlusion"
        // no models for blurred screen or text overlap, so no description is needed
    ]
    let desc: string[] = [
        "Heatmap highlights all potential issues",
        "NULL text is being displayed, instead of the correct information",
        "A placeholder 'missing/broken image' symbol is displayed, instead of an intended image",
        "Text is overlapped or obscured by other components"
    ]

    let res = "<h2>Item " + (index) + "</h2>";
    res += "<image src='" + filePath + "'>";
    res += "<image src='" + algResultPath + "'>";
    res += "<p>" + titles[algResult] + ".<br>" + desc[algResult] + "</p>";
    return res;
}

function main(jsonString: string) {
    // Input: job object as jsonString
    // Output: html string describing issues identified for each img/vid
    
    let res = "";
    let jsonArray = JSON.parse(jsonString);
    let files = jsonArray.files;
    let results = jsonArray.results;

    for (let i = 0; i < results.length; i++) {
        let file = files[i];
        let result = results[i];

        if (file.fileType == "image") {
            res += generate_img_report(i, file.fileReferenceInS3Bucket, result.resultFileReference, result.resultCode);
        } else if (file.fileType == "video") {
            res += generate_vid_report(i, result.resultCode);
        }
        res += "<p><br><br></p>";
    }
    return res;
}