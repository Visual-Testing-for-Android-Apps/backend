import multiEventHandler 
def handler(event, context):
    # check event header 
    if "httpMethod" in event and event["httpMethod"] =="POST":
        return multiEventHandler.handleRequestFromAPIGateway(event)
    return multiEventHandler.handleRequestFromSQS(event)
