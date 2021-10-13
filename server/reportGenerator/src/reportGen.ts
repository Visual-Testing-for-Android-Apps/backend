import { SQSEvent } from 'aws-lambda'
import { S3 } from 'aws-sdk'
import { getJob } from './service/dynamodbService'
import { FileType, Job, JobStatus } from './service/jobModel'
import { sendEmail } from './sendEmail'

/**
 * Creates an object related to a given video issue
 *
 * @param filePath - filepath to original video
 * @param algResult - issue type code
 * @returns object containing video issue, description and video file path
 */
function generateVidReport (filePath: string, algResult: number): Record<string, string> {
  const titles: string[] = [
    'Cannot place image in space',
    'Pass through other material',
    'Lack of scrimmed background',
    'Snackbar blocks bottom app bar',
    'Stack multiple banners',
    'Flip card to reveal information',
    'Move one card behind other card',
    'Stack multiple snackbars',
    'Lack of shadow',
    'Invisible scrim of modal bottom sheet'
  ]
  const desc: string[] = [
    'The video could not be matched in the sample space. No known design violations detected.',
    'Text and/or images is found to pass through other page elements resulting in some content being hidden from view.',
    'No scrimmed background is detected which can result in text that is difficult to read.',
    'A snackbar is found to block the app bar at the bottom of the screen which prevents easy page navigation until the snackbar disappears.',
    'Multiple banners were found to stack on each other hiding some information from the user.',
    'A card uses the flip annimation which forces the user to wait for the animation to end before app use can continue.',
    'A card was detected to be behind another card hiding some information from the user.',
    'Multiple snackbars were found to stack on each other hiding some information from the user.',
    "The background lacks shadow when another window appears. This can divert the user's attention away from the window.",
    'UI elements behind a modal bottom sheet lack a visible scrim/filter whilst the bottom sheet is onscreen.  A visible scrim indicates to the user that these elements cannot be interacted with whilst the menu is displayed.'
  ]

  return {
    title: titles[algResult],
    desc: desc[algResult],
    video: filePath
  }
}

/**
 * Creates an object related to a given image issue
 *
 * @param filePath - filepath to original image
 * @param algResultPath - filepath to heatmap outputted from OwlEyes algorithm
 * @param algResult - issue type code
 * @returns object containing image issues, descriptions, image and heatmap path
 */
function generateImgReport (
  filePath: string,
  algResultPath: string,
  algMessage: string[]
): Record<string, string> {
  const titles: string[] = ['Null value', 'Missing image', 'Component occlusion']
  const descs: string[] = [
    '"NULL" text is being displayed, instead of the correct information.',
    'A placeholder "missing/broken image" symbol is displayed, instead of an intended image.',
    'Text is overlapped or obscured by other components.'
  ]

  const outputTitles: string[] = []
  const outputDescs: string[] = []

  algMessage.forEach((message) => {
    titles.forEach((title, index) => {
      if (title === message) {
        outputTitles.push(titles[index])
        outputDescs.push(descs[index])
      }
    })
  })

  // TODO: update function return type, object like {string[], string[], string, string}
  return {
    titles: outputTitles,
    descs: outputDescs,
    orig_image: filePath,
    heatmap_image: algResultPath
  }
}

/**
 * Adds report contents as json for a batch to s3 bucket, then adds the batch to a queue for emailing the user.
 * The report is saved in the bucket as <batch_id>/report.json
 * DynamoDB data about a batch is assumed to be in the format defined in ./service/jobModel.ts
 * NOT in the form here: https://github.com/Visual-Testing-for-Android-Apps/backend/issues/15#issuecomment-898450609
 *
 * @param event object containing information about the job. Its body attribute is a stringified json object containing a batch's id as jobKey
 * @param context object containing information about the invocation, function, and execution environment
 * @returns json object describing issues identified for each image and/or video
 */
export const generateReport = async (event: SQSEvent, context: AWSLambda.Context): Promise<any> => {
  // fetch job results from database
  const key: string = JSON.parse(event.Records[0].body).jobKey // queue batchsize = 1, so Records[0].length = 1
  console.log(`Fetching info for job key ${key}...`)
  const job: Job = await getJob(key)
  if (job.jobStatus !== JobStatus.GENERATING) {
    console.log(`job: ${key} not ready for report generation yet`)
    return
  }
  const files = job.files

  // construct report contents as arrays
  const image: Array<Record<string, string>> = []
  const video: Array<Record<string, string>> = []

  console.log(`Generating report for ${files.length} files...`)
  files.forEach((element) => {
    const fileRef = element.s3Key
    const fileType = element.type
    const resultMessage = Array(element.result.message)
    const resultCode = Number(element.result.code)
    const resultFileRef = element.result.outputKey

    if (fileType != null && fileRef != null) {
      if (fileType === FileType.IMAGE && resultFileRef != null && resultMessage != null) {
        image.push(generateImgReport(fileRef, resultFileRef, resultMessage))
        console.log(`Image ${fileRef} added to report`)
      } else if (fileType === FileType.VIDEO && resultCode != null) {
        video.push(generateVidReport(fileRef, +resultCode))
        console.log(`Video ${fileRef} added to report`)
      } else {
        console.log(`File ${fileRef} of unknown filetype`)
      }
    }
  })

  // Add json file to s3 bucket
  const filepath = key + '/report.json'
  const s3params = {
    Bucket: process.env.SRC_BUCKET as string,
    Key: filepath, // File name you want to save as in S3
    Body: JSON.stringify({ images: image, videos: video })
  }

  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  // need to await, otherwise if the lambda function terminates before the upload is finished, it won't complete
  console.log('Uploading report to s3 bucket...')
  await s3.upload(s3params).promise()
  console.log('JSON uploaded!')

  // request to send email
  await sendEmail(key)
}
