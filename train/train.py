import os
import pandas as pd
import lightgbm as lgb
import xgboost as xgb
import catboost as cb
import mlflow
import mlflow.lightgbm
import mlflow.xgboost
import mlflow.catboost
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score
from imblearn.over_sampling import SMOTE
import logging
import sys
import numpy as np

# Add parent directory to path to import common
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from common.features import prepare_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def train_model(data_path):
    logger.info(f"Loading data from {data_path}...")
    df = pd.read_parquet(data_path)
    
    logger.info("Preparing features...")
    X = prepare_features(df)
    y = df['is_fraud']
    
    # Ensure X doesn't have is_fraud
    if 'is_fraud' in X.columns:
        X = X.drop(columns=['is_fraud'])
        
    logger.info(f"Features: {X.columns.tolist()}")
    
    # Split
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # SMOTE
    logger.info("Applying SMOTE...")
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
    
    # MLflow Setup
    mlflow.set_tracking_uri("http://mlflow:5000")
    mlflow.set_experiment("fraud_detection_mvp")
    
    best_model = None
    best_f1 = -1
    best_model_name = ""
    
    models_to_train = {
        "LightGBM": lgb.LGBMClassifier(n_estimators=100, learning_rate=0.05, num_leaves=31, random_state=42, n_jobs=-1, verbose=-1),
        "XGBoost": xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42, n_jobs=-1, eval_metric='logloss'),
        "CatBoost": cb.CatBoostClassifier(n_estimators=100, learning_rate=0.05, depth=6, random_state=42, verbose=0, allow_writing_files=False)
    }
    
    with mlflow.start_run(run_name="MultiModel_Training") as parent_run:
        for name, model in models_to_train.items():
            with mlflow.start_run(run_name=name, nested=True):
                logger.info(f"Training {name}...")
                model.fit(X_train_resampled, y_train_resampled)
                
                # Evaluate
                y_pred = model.predict(X_val)
                y_pred_proba = model.predict_proba(X_val)[:, 1]
                
                precision = precision_score(y_val, y_pred)
                recall = recall_score(y_val, y_pred)
                f1 = f1_score(y_val, y_pred)
                roc_auc = roc_auc_score(y_val, y_pred_proba)
                
                logger.info(f"{name} Metrics: Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}, AUC={roc_auc:.4f}")
                
                # Log metrics
                mlflow.log_metrics({
                    "precision": precision,
                    "recall": recall,
                    "f1": f1,
                    "roc_auc": roc_auc
                })
                
                # Log params
                mlflow.log_params(model.get_params())
                
                # Log model
                if name == "LightGBM":
                    mlflow.lightgbm.log_model(model, "model")
                elif name == "XGBoost":
                    mlflow.xgboost.log_model(model, "model")
                elif name == "CatBoost":
                    mlflow.catboost.log_model(model, "model")
                
                # Check if best
                if f1 > best_f1:
                    best_f1 = f1
                    best_model = model
                    best_model_name = name
                    
        logger.info(f"Best model is {best_model_name} with F1={best_f1:.4f}")
        mlflow.log_param("best_model", best_model_name)
        mlflow.log_metric("best_f1", best_f1)
        
        # Register the best model as "FraudDetectionModel" for production use
        # We need to log it again in the parent run or just use the nested run's artifact?
        # Easier to log it in parent run as the "Selected Model"
        
        logger.info(f"Logging best model ({best_model_name}) to parent run...")
        if best_model_name == "LightGBM":
            mlflow.lightgbm.log_model(best_model, "model", registered_model_name="FraudDetectionModel")
        elif best_model_name == "XGBoost":
            mlflow.xgboost.log_model(best_model, "model", registered_model_name="FraudDetectionModel")
        elif best_model_name == "CatBoost":
            mlflow.catboost.log_model(best_model, "model", registered_model_name="FraudDetectionModel")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
        train_model(data_path)
    else:
        logger.error("Please provide data path argument.")
