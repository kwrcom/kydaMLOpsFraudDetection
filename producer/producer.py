import time
import json
import os
import logging
import pandas as pd
from kafka import KafkaProducer
from generate_synthetic_fraud_dataset import run_generation

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
TOPIC = os.environ.get('TRANSACTIONS_TOPIC', 'transactions')
SLEEP_TIME = float(os.environ.get('SLEEP_TIME', '0.1'))

def get_producer():
    producer = None
    while not producer:
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda x: json.dumps(x).encode('utf-8')
            )
            logger.info("Connected to Kafka")
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}. Retrying in 5s...")
            time.sleep(5)
    return producer

def main():
    producer = get_producer()
    
    logger.info("Generating synthetic dataset (this may take a moment)...")
    # Generate a batch of data
    df = run_generation()
    logger.info(f"Generated {len(df)} transactions. Sorting by timestamp...")
    
    # Sort by timestamp to simulate real-time
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values('timestamp')
    
    # Convert back to string for JSON serialization
    df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
    
    records = df.to_dict(orient='records')
    
    logger.info(f"Starting stream to {TOPIC}...")
    
    try:
        for txn in records:
            producer.send(TOPIC, value=txn)
            
            # Log fraud for visibility
            if txn.get('is_fraud') == 1:
                logger.info(f"FRAUD SENT: {txn['transaction_id']}")
                
            time.sleep(SLEEP_TIME)
            
        logger.info("Finished streaming generated dataset. Restarting generation...")
        # In a real loop, we might want to generate more or loop forever.
        # For demo, let's just loop the same logic (generate new batch)
        main() 
        
    except KeyboardInterrupt:
        logger.info("Stopping producer...")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
