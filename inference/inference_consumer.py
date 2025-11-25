import os
import json
import time
import logging
import pandas as pd
import mlflow.pyfunc
import redis
from kafka import KafkaConsumer, KafkaProducer
import sys

# Add parent directory to path to import common
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from common.features import prepare_features

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
INPUT_TOPIC = os.environ.get('TRANSACTIONS_TOPIC', 'transactions')
OUTPUT_TOPIC = os.environ.get('PREDICTIONS_TOPIC', 'fraud_predictions')
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '10'))
MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "http://mlflow:5000")
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

# Connect to Redis
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
    logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.error(f"Failed to connect to Redis: {e}")
    redis_client = None

def load_model():
    model_uri = "models:/FraudDetectionModel/Production"
    try:
        # Use pyfunc to load generic model wrapper (works for LGBM, XGB, CatBoost)
        model = mlflow.pyfunc.load_model(model_uri)
        logger.info("Loaded Production model.")
        return model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

def main():
    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=[KAFKA_BROKER],
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset='latest',
        group_id='fraud_detector'
    )
    
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
    
    logger.info(f"Listening on {INPUT_TOPIC}...")
    
    model = load_model()
    
    batch = []
    
    for message in consumer:
        batch.append(message.value)
        
        if len(batch) >= BATCH_SIZE:
            logger.info(f"Processing batch of {len(batch)}...")
            
            if not model:
                model = load_model()
                if not model:
                    logger.warning("Model not available, skipping inference.")
                    batch = []
                    continue

            try:
                df = pd.DataFrame(batch)
                X = prepare_features(df)
                
                preds = model.predict(X)
                
                for i, txn in enumerate(batch):
                    pred_val = preds[i]
                    txn['pred_label'] = int(pred_val)
                    txn['pred_proba'] = float(pred_val) 
                    
                    producer.send(OUTPUT_TOPIC, value=txn)
                    
                    # Push to Redis for Dashboard
                    if redis_client:
                        try:
                            redis_client.lpush('recent_predictions', json.dumps(txn))
                            redis_client.ltrim('recent_predictions', 0, 99)
                        except Exception as e:
                            logger.error(f"Redis error: {e}")

                    if txn['pred_label'] == 1:
                        logger.info(f"FRAUD DETECTED: {txn.get('transaction_id', 'unknown')}")
                        
            except Exception as e:
                logger.error(f"Error during inference: {e}")
            
            batch = []

if __name__ == "__main__":
    main()
