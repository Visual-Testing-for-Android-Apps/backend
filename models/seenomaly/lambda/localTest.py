# ####################################################
# File for testing locally, will not be uploaded to AWS
# ####################################################
import requests
import io

# TEST_VIDEO = "outfile.mp4"

# class testPacket:
#     def __init__(self, data):
#         self.data = data
#         self.status_code = 200

#     def json(self):
#         return self.data

# def test_api():
#     with open(TEST_VIDEO, "rb") as open_file:
#         byte_content = open_file.read()
#     base64_bytes = base64.b64encode(byte_content)
#     base64_string = base64_bytes.decode("utf-8")
#     raw_data = base64_string

#     # event = testPacket({
#     #     "res_video" :  raw_data
#     # })


#     #print(len(event.json()["res_video"]))

#     res = app.handler({"body":raw_data}, None)

#     print(res)
#     j = json.loads(res["body"])
#     print("Prediciton: {}".format(j["classification"]))
#     print("Result: {}".format(j["explanation"]))

# def test_sqs():
#     s3 = boto3.client('s3')
#     bucket = "visual-testing-backend-v2-srcbucket-p3rsmcrs75qa"
#     key = "test_instagram.mp4"
#     response = s3.get_object(Bucket=bucket, Key=key)
#     videoBytes = response["Body"].read()


def getVideo():
    url = "https://visual-testing-backend-v2-srcbucket-p3rsmcrs75qa.s3.ap-southeast-2.amazonaws.com/c800565d-3aca-4d2c-bc44-0fdb1cfa41d0/1665416.mp4?AWSAccessKeyId=ASIAYDHTZUBQ5FUC4YI3&Expires=1631786859&Signature=%2FCDVJwdnCARJt9%2BE9rlhZZvxXhA%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEBoaDmFwLXNvdXRoZWFzdC0yIkcwRQIhAMbgZp0y2esq8dwQ%2BnpWwe9%2Ffg6B76%2FuWBIZ%2BmXNsvoVAiB24XwNJs9q903Akd6CqQYgWtjiixbixLsP0ctF7DwGpiq5AghzEAEaDDU1NjcwOTU1MjIyNSIMcbvsLObpo697qJCoKpYC3Fl1Xs6opvB%2BMqb2n7agnEI%2BU9837GMimEFcALQQQd6eCDjhx7RKSD5oUKRrpXY5Cg%2FVQSDVjUkg3D3H9ZBtY6%2BHpdcNWGzRNXzj2mLg6WQv5VcHEBaSRP3O2QkRZzvUCVcGE69CB1WLPh35rALpNChiIuYrxVfdSul%2Fgv%2BFGnm%2B%2F6YRcaz7%2BpzpBQlbndVuH02vmait6Z9Yldr2EyxQCx3ecytzONZ8tCcFAFZx%2BFedAW1qySKNPs9Mok%2FCFpoWprAHxV7BKUVxfPlLvqMhkaAGdkWb1WJdWHIyBeHKNIbeFkhVKeUIUEvFfOAbmvZVaHyRj475lUwMU9xIv5fHmAIiEsscQQIRLIMFFZqP1eO2uzyknYAwvqyMigY6mgG2nt7dUkcHOf6pBKXuLCpCavUYIuUsFGoObvwax7lY%2BCSwZz23iy2K35R%2Fqv2v0o2WMx%2FsXKQRN79N9SNTOGaYFl7QDDa1G%2Bnm9%2BH0Wt8qgNUqEXFGHb5Su0XzDYkNPVY5KwTr3SESnfZsDfdAqe3XX0zFacCAD4I%2BxB2nM5obw895p9EojvKGzHuEaeJacEfzsTtye%2FoLOupK"
    content = requests.get(url).content
    tmp = io.BytesIO(content)
    print(tmp)

if __name__ == "__main__":
    getVideo()
    