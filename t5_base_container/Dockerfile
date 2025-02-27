FROM public.ecr.aws/lambda/python:3.8

ENV TRANSFORMERS_CACHE=/tmp

# Install required Python packages
RUN pip install --no-cache-dir transformers torch sentencepiece

# Copy the Lambda function code
COPY app.py ${LAMBDA_TASK_ROOT}

# Set the entry point for the Lambda container
CMD ["app.handler"]