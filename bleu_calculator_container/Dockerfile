FROM public.ecr.aws/lambda/python:3.10

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY tokenizer ./tokenizer
COPY app.py ./

CMD ["app.lambda_handler"]