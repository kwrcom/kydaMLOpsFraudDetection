FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY inference_consumer.py .
# We need common/features.py, so we assume build context includes it or we copy it
# Best to set build context to root of repo in docker-compose

CMD ["python", "-u", "inference_consumer.py"]
