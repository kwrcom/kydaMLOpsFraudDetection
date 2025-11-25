import mlflow
import mlflow.tracking
from mlflow.tracking import MlflowClient
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MLFLOW_TRACKING_URI = os.environ.get("MLFLOW_TRACKING_URI", "http://mlflow:5000")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def promote_model(model_name="FraudDetectionModel", min_precision=0.8):
    client = MlflowClient()
    
    # Get all versions
    versions = client.search_model_versions(f"name='{model_name}'")
    if not versions:
        logger.info("No versions found.")
        return

    # Sort by creation time desc
    versions.sort(key=lambda x: x.creation_timestamp, reverse=True)
    latest_version = versions[0]
    
    logger.info(f"Checking version {latest_version.version}...")
    
    # Get run metrics
    run_id = latest_version.run_id
    run = client.get_run(run_id)
    metrics = run.data.metrics
    
    precision = metrics.get("precision", 0)
    logger.info(f"Version {latest_version.version} Precision: {precision}")
    
    if precision >= min_precision:
        logger.info(f"Promoting version {latest_version.version} to Production...")
        client.transition_model_version_stage(
            name=model_name,
            version=latest_version.version,
            stage="Production",
            archive_existing_versions=True
        )
    else:
        logger.info(f"Version {latest_version.version} did not meet criteria ({min_precision}).")

if __name__ == "__main__":
    promote_model()
