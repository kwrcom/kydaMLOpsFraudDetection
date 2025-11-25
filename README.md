# MVP Anti-Fraud System (Self-Hosted)

This project implements a real-time fraud detection system using Kafka, Airflow, MLflow, Dask, and LightGBM.

## Architecture

1.  **Producer**: Generates synthetic transactions and publishes to Kafka (`transactions`).
2.  **Airflow (Offline)**:
    - Ingests data from Kafka to Parquet.
    - Performs feature engineering.
    - Trains LightGBM model (with SMOTE) and logs to MLflow.
3.  **MLflow**: Tracks experiments and stores model artifacts in MinIO.
4.  **Inference (Online)**:
    - Dask/Pandas consumer reads from Kafka.
    - Loads production model from MLflow.
    - Predicts fraud and publishes to `fraud_predictions`.
5.  **Dashboard**: Simple script to view real-time predictions.

## Prerequisites

- Docker and Docker Compose
- Python 3.9+ (for local demo script)

## Quick Start

1.  **Start Infrastructure**:
    ```bash
    cd docker
    docker compose up -d --build
    ```
    *Note: This starts Kafka, Zookeeper, Postgres, Redis, MinIO, MLflow, Airflow, Producer, and Inference Consumer.*

2.  **Verify Services**:
    - **Airflow**: [http://localhost:8080](http://localhost:8080) (user: `airflow`, pass: `airflow`)
    - **MLflow**: [http://localhost:5000](http://localhost:5000)
    - **MinIO**: [http://localhost:9001](http://localhost:9001) (user: `minioadmin`, pass: `minioadmin`)
    - **Dashboard**: [http://localhost:8000](http://localhost:8000) (PHP Real-time Dashboard)
    - **Public Domain**: [http://kyda.tech](http://kyda.tech) (Requires DNS setup)

### DNS Setup for kyda.tech
To access the dashboard via `kyda.tech`, you must configure your domain's DNS settings:
1.  Log in to your domain registrar.
2.  Add an **A Record** for `@` (root) pointing to your server's public IP address.
3.  Ensure port **80** is open on your server's firewall.

3.  **Train Initial Model**:
    - Go to Airflow UI.
    - Trigger `fraud_detection_pipeline` DAG.
    - Wait for completion.
    - Check MLflow for the new run.
    - **Promote Model**: In MLflow UI, register the model and transition version 1 to `Production`. (Or run `python train/promote_model.py` if you have python env set up).

4.  **Run Demo Dashboard**:
    ```bash
    # Install dependencies
    pip install kafka-python pandas
- `common/`: Shared feature engineering logic.
- `notebooks/`: Demo scripts.

## Troubleshooting

- **Docker Errors**: Ensure Docker Desktop is running.
- **Kafka Connection**: If running scripts locally, ensure `localhost:9092` is accessible.
- **No Predictions**: Ensure the model is promoted to `Production` in MLflow.
