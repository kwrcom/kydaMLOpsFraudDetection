FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all scripts (producer.py and generate_synthetic_fraud_dataset.py)
COPY . .

CMD ["python", "-u", "producer.py"]
