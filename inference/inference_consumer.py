import os
import json
import time
import logging
import pandas as pd
import numpy as np
import mlflow.pyfunc
import redis
from kafka import KafkaConsumer, KafkaProducer
import sys

# Why: Add parent directory to Python path to import shared feature engineering module
# This allows us to reuse the same feature preparation logic used during training
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from common.features import prepare_features

# Why: Configure logging to track inference pipeline execution and debug issues
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Why: Load configuration from environment variables for flexibility across environments
# This allows different settings for development, staging, and production without code changes
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
INPUT_TOPIC = os.environ.get('TRANSACTIONS_TOPIC', 'transactions')
OUTPUT_TOPIC = os.environ.get('PREDICTIONS_TOPIC', 'fraud_predictions')
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '10'))
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "http://mlflow:5000")
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
FRAUD_THRESHOLD = float(os.environ.get('FRAUD_THRESHOLD', '0.5'))

# Why: Set MLflow tracking URI to connect to the MLflow server for model loading
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def connect_redis_with_retry(max_retries=5, initial_delay=1):
    """
    Why: Connect to Redis with exponential backoff retry logic
    Redis might not be ready immediately on startup, so we retry with increasing delays
    This prevents the service from crashing if Redis is temporarily unavailable
    """
    for attempt in range(max_retries):
        try:
            # Why: Create Redis client with connection timeout to avoid hanging indefinitely
            client = redis.Redis(
                host=REDIS_HOST, 
                port=REDIS_PORT, 
                db=0,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Why: Test connection by pinging Redis
            client.ping()
            logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            return client
        except Exception as e:
            # Why: Calculate exponential backoff delay (1s, 2s, 4s, 8s, 16s)
            delay = initial_delay * (2 ** attempt)
            logger.warning(f"Redis connection attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {delay}s...")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                logger.error("Failed to connect to Redis after all retries")
                return None

# Why: Initialize Redis connection at startup with retry logic
redis_client = connect_redis_with_retry()

def load_model():
    """
    Why: Load the production fraud detection model from MLflow Model Registry
    We use the 'Production' stage to ensure we always load the approved model
    Returns None if model is not available (e.g., not yet trained or promoted)
    """
    model_uri = "models:/FraudDetectionModel/Production"
    try:
        # Why: Use pyfunc to load model - works with any ML framework (LightGBM, XGBoost, CatBoost)
        # This provides a consistent interface regardless of which model performed best
        model = mlflow.pyfunc.load_model(model_uri)
        logger.info("Loaded Production model from MLflow")
        return model
    except Exception as e:
        logger.error(f"Failed to load model from MLflow: {e}")
        logger.info("Model may not be trained yet or not promoted to Production stage")
        return None

def main():
    """
    Why: Main inference loop that consumes transactions from Kafka, runs predictions, and publishes results
    This is the core real-time fraud detection pipeline
    """
    
    # Why: Create Kafka consumer to read incoming transactions
    # auto_offset_reset='latest' means we only process new transactions, not historical ones
    # group_id ensures multiple consumers can share the load if we scale horizontally
    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=[KAFKA_BROKER],
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset='latest',
        group_id='fraud_detector',
        enable_auto_commit=True,
        auto_commit_interval_ms=1000
    )
    
    # Why: Create Kafka producer to publish fraud predictions
    # This allows downstream systems to consume predictions for alerting, blocking, etc.
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
    
    logger.info(f"Listening on Kafka topic '{INPUT_TOPIC}' with batch size {BATCH_SIZE}...")
    
    # Why: Load the ML model once at startup for efficiency
    # We'll reload it if it fails, but avoid reloading on every batch
    model = load_model()
    
    # Why: Accumulate transactions into batches for efficient batch prediction
    # Batch processing is much faster than predicting one transaction at a time
    batch = []
    
    # Why: Infinite loop to continuously process incoming transactions
    for message in consumer:
        batch.append(message.value)
        
        # Why: Process batch when it reaches the configured size
        # This balances latency (smaller batches = faster) vs throughput (larger batches = more efficient)
        if len(batch) >= BATCH_SIZE:
            logger.info(f"Processing batch of {len(batch)} transactions...")
            
            # Why: Check if model is loaded, attempt to reload if not
            # Model might not be available on first startup before training completes
            if not model:
                model = load_model()
                if not model:
                    logger.warning("Model not available, skipping inference for this batch")
                    batch = []
                    continue

            try:
                # Why: Convert batch to DataFrame for feature engineering
                # Our feature preparation function expects a pandas DataFrame
                df = pd.DataFrame(batch)
                
                # Why: Apply the same feature engineering used during training
                # This ensures consistency between training and inference
                X = prepare_features(df)
                
                # Why: Handle NaN values that might appear in features
                # Fill with 0 to prevent prediction errors
                X = X.fillna(0)
                
                # CRITICAL FIX: Get probability predictions instead of binary labels
                # Why: We need the fraud probability (0.0 to 1.0) for risk scoring, not just 0/1 label
                # The model.predict() method returns binary predictions (0 or 1)
                # We need model.predict_proba() or check if preds are already probabilities
                try:
                    # Why: Try to get probability predictions (works for sklearn-style models)
                    # This returns array of shape (n_samples, 2) with [prob_class_0, prob_class_1]
                    preds_proba = model.predict_proba(X)
                    # Why: Extract probability of fraud (class 1) from second column
                    fraud_probabilities = preds_proba[:, 1]
                except AttributeError:
                    # Why: Fallback if model doesn't have predict_proba (shouldn't happen with our models)
                    # In this case, use predict which might already return probabilities
                    logger.warning("Model doesn't have predict_proba, using predict()")
                    preds = model.predict(X)
                    # Why: Check if predictions are already probabilities (0-1 range) or binary (0/1)
                    if np.max(preds) <= 1.0 and np.min(preds) >= 0.0 and not np.all(np.isin(preds, [0, 1])):
                        fraud_probabilities = preds
                    else:
                        # Why: If binary predictions, convert to probabilities (not ideal but prevents crash)
                        fraud_probabilities = preds.astype(float)
                
                # Why: Iterate through batch and add predictions to each transaction
                for i, txn in enumerate(batch):
                    # Why: Extract fraud probability for this transaction
                    fraud_prob = float(fraud_probabilities[i])
                    
                    # Why: Apply threshold to determine binary fraud label
                    # Threshold of 0.5 means >50% probability is classified as fraud
                    pred_label = 1 if fraud_prob >= FRAUD_THRESHOLD else 0
                    
                    # Why: Add predictions to transaction object
                    # pred_proba is the actual fraud probability (e.g., 0.234 = 23.4% chance of fraud)
                    # pred_label is the binary decision (0 = legitimate, 1 = fraud)
                    txn['pred_proba'] = round(fraud_prob, 4)
                    txn['pred_label'] = int(pred_label)
                    
                    # Why: Publish prediction to Kafka for downstream consumers
                    # Other systems can subscribe to this topic for alerting, blocking, etc.
                    producer.send(OUTPUT_TOPIC, value=txn)
                    
                    # Why: Store prediction in Redis for real-time dashboard display
                    # Dashboard reads from Redis to show latest predictions without querying Kafka
                    if redis_client:
                        try:
                            # Why: Push to Redis list (lpush adds to front of list)
                            redis_client.lpush('recent_predictions', json.dumps(txn))
                            # Why: Trim list to keep only last 100 predictions to prevent memory growth
                            redis_client.ltrim('recent_predictions', 0, 99)
                        except Exception as e:
                            logger.error(f"Redis error: {e}")
                            # Why: Try to reconnect to Redis if connection was lost
                            redis_client = connect_redis_with_retry(max_retries=3, initial_delay=1)

                    # Why: Log fraud detections for monitoring and alerting
                    if pred_label == 1:
                        logger.info(f"🚨 FRAUD DETECTED: {txn.get('transaction_id', 'unknown')} (probability: {fraud_prob:.2%})")
                
                # Why: Log batch processing statistics for monitoring
                fraud_count = sum(1 for txn in batch if txn.get('pred_label') == 1)
                logger.info(f"Batch processed: {fraud_count}/{len(batch)} flagged as fraud")
                        
            except Exception as e:
                # Why: Catch and log errors without crashing the service
                # This ensures one bad batch doesn't stop the entire inference pipeline
                logger.error(f"Error during inference: {e}", exc_info=True)
            
            # Why: Clear batch after processing to start accumulating next batch
            batch = []

if __name__ == "__main__":
    # Why: Entry point when running as a standalone script
    main()
