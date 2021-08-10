import use
import preprocess
import os
import json
from multiEventHandler import handleRequestFromSQS, handleRequestFromAPIGateway
def handler(event, context):
    # check event header 
    if "httpMethod" in event and event["httpMethod"] =="POST":
        return handleRequestFromAPIGateway(event)
    return handleRequestFromSQS(event)
