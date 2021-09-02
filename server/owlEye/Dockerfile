FROM public.ecr.aws/lambda/python:3.7

COPY app/app.py app/index.py app/requirements.txt ./
COPY app/opt/ml/* /opt/ml/
ENV MODEL_DIR=/opt/ml/

RUN python3.7 -m pip install -r requirements.txt -t .

CMD ["index.handler"]