"""
ML Model for Supply Chain Risk Prediction
Trains a RandomForestRegressor on the dataset to predict Final_Risk_Score.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

MODEL = None
MODEL_METRICS = {}

FEATURES = [
    'Geo_Risk_2023',
    'Risk_Reduction_%',
    'Base_Cost_per_Unit',
    'ESG_Score',
    'ESG_Penalty',
    'Environmental_Score',
    'Social_Score',
    'Governance_Score'
]

TARGET = 'Final_Risk_Score'


def train_model(df):
    """Train the risk prediction model on the dataset."""
    global MODEL, MODEL_METRICS

    # Drop rows with missing values in our feature/target columns
    model_df = df[FEATURES + [TARGET]].dropna()

    X = model_df[FEATURES]
    y = model_df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    MODEL = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    MODEL.fit(X_train, y_train)

    # Evaluate
    y_pred = MODEL.predict(X_test)
    MODEL_METRICS = {
        'mae': round(mean_absolute_error(y_test, y_pred), 4),
        'r2_score': round(r2_score(y_test, y_pred), 4),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': FEATURES
    }

    # Feature importance
    importances = MODEL.feature_importances_
    feature_importance = sorted(
        zip(FEATURES, importances),
        key=lambda x: x[1],
        reverse=True
    )
    MODEL_METRICS['feature_importance'] = [
        {'feature': f, 'importance': round(float(imp), 4)}
        for f, imp in feature_importance
    ]

    print(f"[ML] Model trained — MAE: {MODEL_METRICS['mae']}, R²: {MODEL_METRICS['r2_score']}")
    return MODEL


def predict(features_dict):
    """
    Predict Final_Risk_Score from a dict of feature values.
    Returns predicted score and model confidence info.
    """
    if MODEL is None:
        return {'error': 'Model not trained yet'}

    # Build feature vector in correct order
    feature_values = []
    for f in FEATURES:
        val = features_dict.get(f, 0)
        feature_values.append(float(val))

    X_input = np.array([feature_values])
    prediction = MODEL.predict(X_input)[0]

    # Get predictions from individual trees for confidence interval
    tree_preds = np.array([tree.predict(X_input)[0] for tree in MODEL.estimators_])
    std = np.std(tree_preds)

    return {
        'predicted_risk_score': round(float(prediction), 2),
        'confidence_interval': {
            'low': round(float(prediction - 2 * std), 2),
            'high': round(float(prediction + 2 * std), 2)
        },
        'model_std': round(float(std), 4)
    }


def get_metrics():
    """Return model training metrics."""
    return MODEL_METRICS
