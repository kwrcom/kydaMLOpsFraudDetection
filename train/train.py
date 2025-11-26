# Train script for fraud detection models

"""
This script trains LightGBM, XGBoost, and CatBoost models on prepared transaction data.
It includes:
- Loading data (Parquet) with error handling
- Feature preparation using shared module
- SMOTE oversampling for class imbalance
- MLflow tracking (URI configurable via env var)
- Model logging and registration of the best model
- Detailed logging for observability
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
import mlflow
import mlflow.lightgbm
import mlflow.xgboost
import mlflow.catboost
import lightgbm as lgb
import xgboost as xgb
import catboost as cb

# Add project root to sys.path for shared modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from common.features import prepare_features, validate_features

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Environment configuration
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://mlflow:5000")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("fraud_detection_mvp")

def load_data(data_path: str) -> pd.DataFrame:
    """Load parquet data with graceful error handling."""
    if not os.path.exists(data_path):
        logger.error(f"Data file not found: {data_path}")
        raise FileNotFoundError(data_path)
    try:
        df = pd.read_parquet(data_path)
        logger.info(f"Loaded data with {len(df)} rows from {data_path}")
        return df
    except Exception as e:
        logger.exception(f"Failed to read parquet file: {e}")
        raise

def train_model(data_path: str):
    """Main training pipeline.

    Steps:
    1. Load data
    2. Prepare features
    3. Split train/validation
    4. Apply SMOTE
    5. Train three models
    6. Log metrics & models to MLflow
    7. Register best model
    """
    # Load data
    df = load_data(data_path)

    # Feature engineering
    logger.info("Preparing features...")
    X = prepare_features(df)
    y = df["is_fraud"]

    # Ensure target column is not in features
    if "is_fraud" in X.columns:
        X = X.drop(columns=["is_fraud"])
        logger.debug("Dropped stray 'is_fraud' column from features.")

    # Validate feature consistency
    validate_features(X)

    # Train/validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # SMOTE oversampling for imbalance
    logger.info("Applying SMOTE to balance classes...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

    # Define models
    models_to_train = {
        "LightGBM": lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.05,
            num_leaves=31,
            random_state=42,
            n_jobs=-1,
            verbose=-1,
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=6,
            random_state=42,
            n_jobs=-1,
            eval_metric="logloss",
        ),
        "CatBoost": cb.CatBoostClassifier(
            n_estimators=100,
            learning_rate=0.05,
            depth=6,
            random_state=42,
            verbose=0,
            allow_writing_files=False,
        ),
    }

    best_model = None
    best_f1 = -1.0
    best_model_name = ""

    with mlflow.start_run(run_name="MultiModel_Training") as parent_run:
        for name, model in models_to_train.items():
            with mlflow.start_run(run_name=name, nested=True):
                logger.info(f"Training {name}...")
                model.fit(X_train_resampled, y_train_resampled)

                # Evaluation
                y_pred = model.predict(X_val)
                y_pred_proba = model.predict_proba(X_val)[:, 1]
                precision = precision_score(y_val, y_pred)
                recall = recall_score(y_val, y_pred)
                f1 = f1_score(y_val, y_pred)
                roc_auc = roc_auc_score(y_val, y_pred_proba)
                logger.info(
                    f"{name} Metrics: Precision={precision:.4f}, Recall={recall:.4f}, "
                    f"F1={f1:.4f}, AUC={roc_auc:.4f}"
                )

                # Log metrics and params
                mlflow.log_metrics({"precision": precision, "recall": recall, "f1": f1, "roc_auc": roc_auc})
                mlflow.log_params(model.get_params())

                # Log model artifact
                if name == "LightGBM":
                    mlflow.lightgbm.log_model(model, "model")
                elif name == "XGBoost":
                    mlflow.xgboost.log_model(model, "model")
                elif name == "CatBoost":
                    mlflow.catboost.log_model(model, "model")

                # Track best model by F1
                if f1 > best_f1:
                    best_f1 = f1
                    best_model = model
                    best_model_name = name

        logger.info(f"Best model: {best_model_name} with F1={best_f1:.4f}")
        mlflow.log_param("best_model", best_model_name)
        mlflow.log_metric("best_f1", best_f1)

        # Register best model in Model Registry
        if best_model_name == "LightGBM":
            mlflow.lightgbm.log_model(best_model, "model", registered_model_name="FraudDetectionModel")
        elif best_model_name == "XGBoost":
            mlflow.xgboost.log_model(best_model, "model", registered_model_name="FraudDetectionModel")
        elif best_model_name == "CatBoost":
            mlflow.catboost.log_model(best_model, "model", registered_model_name="FraudDetectionModel")
        else:
            logger.warning("No model registered – unexpected best model name.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
        try:
            train_model(data_path)
        except Exception as e:
            logger.exception(f"Training failed: {e}")
            sys.exit(1)
    else:
        logger.error("Please provide the data path as the first argument.")
        sys.exit(2)
