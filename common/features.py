import pandas as pd
import numpy as np

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Shared feature engineering logic.
    Since the upstream producer now provides pre-computed behavioral features,
    this function primarily selects the relevant columns and handles any final formatting.
    """
    df = df.copy()
    
    # List of features expected by the model
    # These match the output of generate_synthetic_fraud_dataset.py
    feature_cols = [
        "amount", "amount_usd", "transaction_hour", 
        "prev_transaction_count_1h", "prev_transaction_count_24h",
        "avg_transaction_amount_7d", "total_spent_30d",
        "hours_since_last_transaction", "transaction_frequency",
        "merchant_risk_score", "is_high_risk_merchant", "mcc_code",
        "amount_deviation", "velocity_1h", "amount_velocity",
        "user_age", "user_tenure_days", "account_balance", "credit_score"
    ]
    
    # Ensure all cols exist (fill with 0 if missing, though they should be there)
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
            
    # Handle categorical if needed (e.g. merchant_category)
    # The new generator provides 'merchant_category' string. 
    # LightGBM can handle it if we cast to category, or we can hash it.
    if 'merchant_category' in df.columns:
        df['merchant_category'] = df['merchant_category'].astype('category').cat.codes
        feature_cols.append('merchant_category')

    # Select only feature columns
    X = df[feature_cols]
    
    return X
