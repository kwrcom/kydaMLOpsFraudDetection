import json
import os
from kafka import KafkaConsumer
import pandas as pd
import time

# Configuration
KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
TOPIC = 'fraud_predictions'

def main():
    print(f"Connecting to {KAFKA_BROKER} topic {TOPIC}...")
    try:
        consumer = KafkaConsumer(
            TOPIC,
            bootstrap_servers=[KAFKA_BROKER],
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            auto_offset_reset='latest'
        )
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    print("Listening for predictions...")
    print("-" * 50)
    print(f"{'Txn ID':<20} | {'Amount':<10} | {'Fraud?':<10} | {'Prob':<10} | {'Label':<10}")
    print("-" * 50)

    try:
        for message in consumer:
            txn = message.value
            is_fraud = "YES" if txn.get('is_fraud') == 1 else "NO"
            pred_label = "FRAUD" if txn.get('pred_label') == 1 else "OK"
            prob = f"{txn.get('pred_proba', 0):.4f}"
            
            # Highlight fraud
            if txn.get('pred_label') == 1:
                row = f"\033[91m{txn.get('transaction_id', 'unknown'):<20} | {txn['amount']:<10} | {is_fraud:<10} | {prob:<10} | {pred_label:<10}\033[0m"
            else:
                row = f"{txn.get('transaction_id', 'unknown'):<20} | {txn['amount']:<10} | {is_fraud:<10} | {prob:<10} | {pred_label:<10}"
            
            print(row)
            
    except KeyboardInterrupt:
        print("Stopping...")

if __name__ == "__main__":
    main()
