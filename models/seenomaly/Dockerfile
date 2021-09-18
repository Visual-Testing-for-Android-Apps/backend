FROM public.ecr.aws/lambda/python:3.7

COPY lambda/app.py lambda/multiEventHandler.py lambda/use.py lambda/preprocess.py lambda/constants.py lambda/extract_features.py lambda/requirements.txt ./
COPY lambda/nets/* ./nets/
COPY lambda/models/gan/* /opt/ml/models/gan/
ENV  MODEL_DIR=/opt/ml/models/gan/

RUN python3.7 -m pip install -r requirements.txt -t .

CMD ["app.handler"]

