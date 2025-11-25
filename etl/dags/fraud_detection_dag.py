from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
from datetime import timedelta
import sys
import os
import logging
import pandas as pd

# Add parent directory to path to import common and train
sys.path.append('/opt/airflow')

# Import training function
from train.train import train_model

# Import generator
# We need to make sure the producer dir is in path or we copy the file to dags/plugins
# For simplicity, let's assume we can import it if we add the path
sys.path.append('/opt/airflow/producer') 
# Note: In docker-compose, we mount ../:/sources, but airflow mounts ../etl/dags:/opt/airflow/dags
# We might need to adjust imports or copy the file.
# Let's try to import from the mounted volume if possible, or just re-implement the call.
# Actually, the producer code is in ../producer. 
# We should probably mount ../producer to /opt/airflow/producer in docker-compose.

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'fraud_detection_pipeline',
    default_args=default_args,
    description='End-to-end fraud detection pipeline',
    schedule_interval=timedelta(days=1),
    start_date=days_ago(1),
    catchup=False,
)

def ingest_data_task(**kwargs):
    """
    Generates training data using the shared generator script.
    """
    logging.info("Generating training data...")
    
    # Dynamic import to avoid top-level errors if path is not ready yet
    try:
        sys.path.append('/opt/airflow/producer')
        from generate_synthetic_fraud_dataset import run_generation, CONFIG
    except ImportError:
        # Fallback if not mounted yet (should be fixed in docker-compose)
        logging.error("Could not import generate_synthetic_fraud_dataset. Ensure producer dir is mounted.")
        raise

    # Override config for training batch size if needed
    # CONFIG["n_users"] = 1000 
    
    df = run_generation()
    
    data_path = '/opt/airflow/dags/training_data.parquet'
    df.to_parquet(data_path)
    logging.info(f"Saved {len(df)} records to {data_path}")
    return data_path

def train_model_task(**kwargs):
    ti = kwargs['ti']
    data_path = ti.xcom_pull(task_ids='ingest_data')
    logging.info(f"Training on {data_path}")
    train_model(data_path)

t1 = PythonOperator(
    task_id='ingest_data',
    python_callable=ingest_data_task,
    dag=dag,
)

t2 = PythonOperator(
    task_id='train_model',
    python_callable=train_model_task,
    dag=dag,
)

t1 >> t2
