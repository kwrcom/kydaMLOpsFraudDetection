import time
import json
import os
import logging
import signal
import sys
import pandas as pd
from kafka import KafkaProducer
from kafka.errors import KafkaError
from generate_synthetic_fraud_dataset import run_generation

# Why: Configure logging to track producer execution and debug issues
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Why: Load configuration from environment variables for flexibility
# This allows different settings for development, staging, and production
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
TOPIC = os.environ.get('TRANSACTIONS_TOPIC', 'transactions')
SLEEP_TIME = float(os.environ.get('SLEEP_TIME', '0.1'))

# Why: Global flag for graceful shutdown on SIGTERM/SIGINT
shutdown_requested = False

def signal_handler(signum, frame):
    """
    Why: Handle shutdown signals gracefully (SIGTERM from Docker, SIGINT from Ctrl+C)
    This ensures we close Kafka producer cleanly and don't lose messages
    """
    global shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_requested = True

# Why: Register signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def get_producer():
    """
    Why: Create Kafka producer with retry logic
    Kafka might not be ready immediately on startup, so we retry until connection succeeds
    This prevents the service from crashing if Kafka is temporarily unavailable
    """
    producer = None
    retry_count = 0
    max_retries = 10
    
    while not producer and retry_count < max_retries:
        try:
            # Why: Create Kafka producer with JSON serialization
            # acks='all' ensures message is written to all replicas before confirming
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda x: json.dumps(x).encode('utf-8'),
                acks='all',
                retries=3,
                max_in_flight_requests_per_connection=1
            )
            logger.info(f"Connected to Kafka at {KAFKA_BROKER}")
        except KafkaError as e:
            retry_count += 1
            logger.error(f"Failed to connect to Kafka (attempt {retry_count}/{max_retries}): {e}")
            if retry_count < max_retries:
                logger.info("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                logger.error("Max retries reached. Exiting.")
                sys.exit(1)
    
    return producer

def validate_transaction_data(df):
    """
    Why: Validate generated transaction data has all required fields
    This prevents sending incomplete data to Kafka that would break downstream services
    """
    required_fields = ['transaction_id', 'timestamp', 'amount', 'user_id', 'is_fraud']
    missing_fields = [field for field in required_fields if field not in df.columns]
    
    if missing_fields:
        raise ValueError(f"Generated data is missing required fields: {missing_fields}")
    
    # Why: Check for NaN values in critical fields
    if df[required_fields].isnull().any().any():
        raise ValueError("Generated data contains NaN values in required fields")
    
    logger.info(f"Data validation passed: {len(df)} transactions with {df['is_fraud'].sum()} fraud cases")
    return True

def main():
    """
    Why: Main loop that generates synthetic transactions and streams them to Kafka
    This simulates real-time transaction flow for testing the fraud detection pipeline
    """
    
    # Why: Connect to Kafka with retry logic
    producer = get_producer()
    
    # Why: Continuous loop to generate and stream transactions
    # This replaces the previous infinite recursion which could cause stack overflow
    while not shutdown_requested:
        try:
            logger.info("Generating synthetic transaction dataset...")
            
            # Why: Generate batch of synthetic transactions with realistic fraud patterns
            # This uses the shared generator that creates behavioral features
            df = run_generation()
            
            # Why: Validate data before streaming to catch generation errors early
            validate_transaction_data(df)
            
            logger.info(f"Generated {len(df)} transactions. Sorting by timestamp for realistic streaming...")
            
            # Why: Sort by timestamp to simulate chronological transaction flow
            # This makes the stream more realistic and helps test time-based features
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Why: Convert timestamp back to ISO string for JSON serialization
            # Kafka messages must be JSON-serializable
            df['timestamp'] = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
            
            # Why: Convert DataFrame to list of dictionaries for Kafka publishing
            records = df.to_dict(orient='records')
            
            logger.info(f"Starting to stream {len(records)} transactions to topic '{TOPIC}'...")
            
            # Why: Stream transactions one by one with configurable delay
            # This simulates real-time transaction arrival rate
            for i, txn in enumerate(records):
                # Why: Check shutdown flag to exit cleanly
                if shutdown_requested:
                    logger.info("Shutdown requested, stopping transaction stream...")
                    break
                
                try:
                    # Why: Send transaction to Kafka asynchronously
                    # We don't wait for confirmation to maintain throughput
                    future = producer.send(TOPIC, value=txn)
                    
                    # Why: Log fraud transactions for visibility during testing
                    # This helps verify the fraud detection pipeline is working
                    if txn.get('is_fraud') == 1:
                        logger.info(f"💳 FRAUD SENT: {txn['transaction_id']} (amount: ${txn['amount']:.2f})")
                    
                    # Why: Periodic progress logging (every 100 transactions)
                    if (i + 1) % 100 == 0:
                        logger.info(f"Streamed {i + 1}/{len(records)} transactions...")
                    
                    # Why: Sleep between transactions to control streaming rate
                    # Configurable via SLEEP_TIME environment variable
                    time.sleep(SLEEP_TIME)
                    
                except KafkaError as e:
                    logger.error(f"Failed to send transaction {txn.get('transaction_id', 'unknown')}: {e}")
                    # Why: Continue with next transaction instead of crashing
                    continue
            
            if not shutdown_requested:
                logger.info(f"Finished streaming batch. Waiting 10 seconds before generating next batch...")
                time.sleep(10)
            
        except KeyboardInterrupt:
            # Why: Handle Ctrl+C gracefully
            logger.info("Keyboard interrupt received, shutting down...")
            break
        except Exception as e:
            # Why: Catch and log unexpected errors without crashing
            # This ensures the producer keeps running even if one batch fails
            logger.error(f"Error in main loop: {e}", exc_info=True)
            logger.info("Waiting 30 seconds before retry...")
            time.sleep(30)
    
    # Why: Clean shutdown - flush pending messages and close producer
    logger.info("Flushing pending messages...")
    producer.flush(timeout=10)
    logger.info("Closing Kafka producer...")
    producer.close()
    logger.info("Producer shutdown complete")

if __name__ == "__main__":
    # Why: Entry point when running as a standalone script
    logger.info(f"Starting fraud transaction producer (Kafka: {KAFKA_BROKER}, Topic: {TOPIC}, Sleep: {SLEEP_TIME}s)")
    main()
