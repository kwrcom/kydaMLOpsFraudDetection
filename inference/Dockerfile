FROM python:3.9-slim

WORKDIR /app

# Copy requirements from the inference directory (relative to project root)
COPY inference/requirements.txt ./inference/requirements.txt
RUN pip install --no-cache-dir -r inference/requirements.txt

# Copy the inference script and common module
COPY inference/inference_consumer.py ./inference/inference_consumer.py
COPY common ./common

# Run from the project root so imports work as expected
CMD ["python", "-u", "inference/inference_consumer.py"]
