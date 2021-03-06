import use
import preprocess
import os
import json
import base64
import requests


netName = "gan"
checkpoint = 29471
modelDir = os.getenv("MODEL_DIR", "./models/gan") # local env default to ./models
def handleVideoInBody(body):
        print("handler video in request body ....")
        videoBytes = base64.b64decode(body.encode("utf-8"))
        return use.main(netName, checkpoint, modelDir, preprocess.fromJson(videoBytes))



def handleVideoInPresignedUrl(body):
    print("handler video from url ....")
    url = body['download_url']
    response = requests.get(url)
    print("response",response)
    #img = Image.open(BytesIO(response.content))
    return use.main(netName, checkpoint, modelDir, preprocess.fromJson(response.content))
 