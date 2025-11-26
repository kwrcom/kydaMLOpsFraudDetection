import pandas as pd
import numpy as np

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Why: Shared feature engineering logic used by both training and inference
    This ensures consistency - the model sees the same features during training and prediction
    
    The upstream producer (generate_synthetic_fraud_dataset.py) provides pre-computed
    behavioral features, so this function primarily selects and validates the correct columns
    """
    # Why: Create a copy to avoid modifying the original DataFrame
    # This prevents unexpected side effects in calling code
    df = df.copy()
    
    # Why: Define the exact feature columns expected by the ML model
    # These must match what was used during training for predictions to work correctly
    # Features include: transaction amounts, time-based features, behavioral aggregations,
    # merchant risk indicators, and user profile information
    feature_cols = [
        # Transaction amount features
        "amount",              # Why: Raw transaction amount in local currency
        "amount_usd",          # Why: Normalized amount in USD for cross-currency comparison
        
        # Time-based features
        "transaction_hour",    # Why: Hour of day (0-23) - fraud patterns vary by time
        
        # Behavioral features (user transaction history)
        "prev_transaction_count_1h",   # Why: Velocity indicator - rapid transactions are suspicious
        "prev_transaction_count_24h",  # Why: Daily activity level
        "avg_transaction_amount_7d",   # Why: User's typical spending pattern over 7 days
        "total_spent_30d",             # Why: Monthly spending volume
        "hours_since_last_transaction", # Why: Time gap between transactions
        "transaction_frequency",        # Why: Average transactions per day for this user
        
        # Merchant risk features
        "merchant_risk_score",   # Why: Pre-computed merchant fraud risk (0-1)
        "is_high_risk_merchant", # Why: Binary flag for high-risk merchant categories
        "mcc_code",              # Why: Merchant Category Code - certain categories have higher fraud
        
        # Deviation and velocity features
        "amount_deviation",      # Why: How much this amount deviates from user's normal spending
        "velocity_1h",           # Why: Transaction rate compared to user's baseline
        "amount_velocity",       # Why: Rate of change in transaction amounts
        
        # User profile features
        "user_age",              # Why: Age demographics correlate with fraud patterns
        "user_tenure_days",      # Why: Account age - new accounts have higher fraud risk
        "account_balance",       # Why: Available funds - overdrafts may indicate fraud
        "credit_score"           # Why: Creditworthiness indicator
    ]
    
    # Why: Ensure all required features exist in the DataFrame
    # If a feature is missing, fill with 0 to prevent errors
    # This handles cases where the data generator or producer might have schema changes
    for col in feature_cols:
        if col not in df.columns:
            logger.warning(f"Feature '{col}' not found in data, filling with 0")
            df[col] = 0
    
    # Why: Handle categorical merchant_category if present
    # The generator provides merchant_category as a string (e.g., "electronics", "groceries")
    # LightGBM and other models need numeric encoding
    if 'merchant_category' in df.columns:
        # Why: Convert to categorical codes (0, 1, 2, ...) for model compatibility
        # This is a simple encoding that preserves the categorical nature
        df['merchant_category'] = df['merchant_category'].astype('category').cat.codes
        feature_cols.append('merchant_category')
    
    # Why: Select only the feature columns needed for the model
    # This removes metadata fields like transaction_id, timestamp, etc.
    X = df[feature_cols]
    
    # Why: Handle NaN values with appropriate fill strategies
    # Different features need different fill strategies based on their meaning
    # hours_since_last_transaction: NaN means first transaction, fill with large value
    if 'hours_since_last_transaction' in X.columns:
        X['hours_since_last_transaction'] = X['hours_since_last_transaction'].fillna(999)
    
    # Why: Fill remaining NaN values with 0 (safe default for most numeric features)
    # This prevents model prediction errors while maintaining reasonable defaults
    X = X.fillna(0)
    
    # Why: Validate that we have the expected number of features
    # This catches schema mismatches early before they cause model errors
    expected_feature_count = len(feature_cols)
    actual_feature_count = X.shape[1]
    if actual_feature_count != expected_feature_count:
        raise ValueError(
            f"Feature count mismatch: expected {expected_feature_count}, got {actual_feature_count}. "
            f"Missing or extra features detected."
        )
    
    return X

def validate_features(X: pd.DataFrame) -> bool:
    """
    Why: Validate feature DataFrame before training or inference
    This catches data quality issues early and provides clear error messages
    
    Returns: True if validation passes
    Raises: ValueError if validation fails
    """
    # Why: Check for infinite values that would break model training
    if np.isinf(X.values).any():
        raise ValueError("Features contain infinite values")
    
    # Why: Check for remaining NaN values after feature preparation
    if X.isnull().any().any():
        nan_cols = X.columns[X.isnull().any()].tolist()
        raise ValueError(f"Features contain NaN values in columns: {nan_cols}")
    
    # Why: Check for constant features (all same value)
    # These provide no information and can cause issues in some models
    constant_cols = [col for col in X.columns if X[col].nunique() <= 1]
    if constant_cols:
        logger.warning(f"Constant features detected (may reduce model performance): {constant_cols}")
    
    return True
