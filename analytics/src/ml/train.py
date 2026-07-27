"""
train.py
Trains a Gradient Boosted Classifier (XGBoost) to predict
loan affordability probability for CarIQ customers.

Replaces the rule-based 40% EMI threshold with a probabilistic model
that considers income, credit score, employment type, vehicle price,
loan tenure, and interest rate together.

Usage:
    python src/ml/train.py
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, accuracy_score
)
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

# ── Paths ─────────────────────────────────────────────────────
DATA_DIR  = Path(__file__).resolve().parents[2] / 'data'
MODEL_DIR = Path(__file__).resolve().parents[2] / 'models'
MODEL_DIR.mkdir(exist_ok=True)

MODEL_PATH    = MODEL_DIR / 'affordability_model.joblib'
ENCODER_PATH  = MODEL_DIR / 'label_encoders.joblib'
METRICS_PATH  = MODEL_DIR / 'model_metrics.json'
FEATURES_PATH = MODEL_DIR / 'feature_importance.json'


def load_data() -> pd.DataFrame:
    """Load master CSV and filter to loan transactions only."""
    master = pd.read_csv(DATA_DIR / 'master.csv')
    loans  = master[master['payment_mode'] == 'Loan'].copy()
    print(f"\n📦 Data loaded: {len(master)} total transactions")
    print(f"   Loan transactions for training: {len(loans)}")
    print(f"   Affordable (label=1): {loans['is_affordable'].sum()}")
    print(f"   Unaffordable (label=0): {(loans['is_affordable'] == 0).sum()}")
    return loans


def prepare_features(df: pd.DataFrame):
    """
    Select and encode features for the ML model.

    Features chosen:
    - annual_income_usd   : Strongest predictor (Q4 finding: correlation > credit score)
    - credit_score        : Secondary risk indicator
    - employment_type     : Proxy for income stability
    - price_usd_equivalent: Vehicle price determines loan size
    - loan_tenure_months  : Longer tenure = lower EMI = more affordable
    - interest_rate       : Higher rate = higher EMI = less affordable
    - emi_amount_usd      : Direct affordability indicator

    Target:
    - is_affordable       : 1 if EMI <= 40% monthly income, else 0
    """
    feature_cols = [
        'annual_income_usd',
        'credit_score',
        'employment_type',
        'price_usd_equivalent',
        'loan_tenure_months',
        'interest_rate',
        'emi_amount_usd',
    ]
    target_col = 'is_affordable'

    # Drop rows with any nulls in features or target
    df_clean = df[feature_cols + [target_col]].dropna()
    print(f"\n🔧 Feature preparation:")
    print(f"   Rows after dropping nulls: {len(df_clean)}")

    # Encode categorical features
    encoders = {}
    for col in ['employment_type']:
        le = LabelEncoder()
        df_clean[col] = le.fit_transform(df_clean[col].astype(str))
        encoders[col] = le
        print(f"   Encoded '{col}': {list(le.classes_)}")

    X = df_clean[feature_cols].values
    y = df_clean[target_col].astype(int).values

    print(f"   Features shape: {X.shape}")
    print(f"   Target distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    return X, y, feature_cols, encoders


def train_model(X, y):
    """
    Train XGBoost Gradient Boosted Classifier.
    XGBoost chosen because:
    - Handles mixed numeric + categorical (after encoding)
    - Robust to small datasets (we have 60 loan transactions)
    - Produces probability scores, not just binary output
    - Built-in feature importance
    """
    print("\n🤖 Training XGBoost Gradient Boosted Classifier...")

    # Split — stratified to preserve class balance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y if len(np.unique(y)) > 1 else None
    )
    print(f"   Train size: {len(X_train)} | Test size: {len(X_test)}")

    model = XGBClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='logloss',
        verbosity=0,
    )

    model.fit(X_train, y_train)

    # Predictions
    y_pred      = model.predict(X_test)
    y_pred_prob = model.predict_proba(X_test)[:, 1]

    return model, X_train, X_test, y_train, y_test, y_pred, y_pred_prob


def evaluate_model(model, X, y, X_test, y_test, y_pred, y_pred_prob, feature_cols):
    """Evaluate model performance and return metrics dict."""
    print("\n📊 Model Evaluation:")

    # Basic metrics
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n   Accuracy     : {accuracy:.4f} ({accuracy*100:.1f}%)")

    # ROC-AUC (only if both classes present in test)
    if len(np.unique(y_test)) > 1:
        auc = roc_auc_score(y_test, y_pred_prob)
        print(f"   ROC-AUC      : {auc:.4f}")
    else:
        auc = None
        print("   ROC-AUC      : N/A (single class in test set)")

    # Cross validation on full dataset
    cv_model = XGBClassifier(
        n_estimators=100, max_depth=3,
        learning_rate=0.1, random_state=42,
        eval_metric='logloss', verbosity=0
    )
    cv_scores = cross_val_score(cv_model, X, y, cv=3, scoring='accuracy')
    print(f"   CV Accuracy  : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Classification report
    print("\n   Classification Report:")
    print(classification_report(y_test, y_pred,
          target_names=['Unaffordable', 'Affordable']))

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print(f"   Confusion Matrix:")
    print(f"   True Neg (correctly predicted unaffordable): {cm[0][0]}")
    print(f"   True Pos (correctly predicted affordable)  : {cm[1][1]}")
    print(f"   False Neg (missed affordable)              : {cm[1][0]}")
    print(f"   False Pos (missed unaffordable)            : {cm[0][1]}")

    # Feature importance
    importance = dict(zip(feature_cols, model.feature_importances_.tolist()))
    importance_sorted = dict(sorted(importance.items(),
                                    key=lambda x: x[1], reverse=True))
    print(f"\n   Feature Importance (ranked):")
    for feat, imp in importance_sorted.items():
        bar = '█' * int(imp * 40)
        print(f"   {feat:<25} {imp:.4f}  {bar}")

    metrics = {
        'accuracy':           round(float(accuracy), 4),
        'roc_auc':            round(float(auc), 4) if auc else None,
        'cv_mean_accuracy':   round(float(cv_scores.mean()), 4),
        'cv_std':             round(float(cv_scores.std()), 4),
        'train_samples':      int(len(X) * 0.8),
        'test_samples':       int(len(X) * 0.2),
        'confusion_matrix':   cm.tolist(),
        'feature_importance': importance_sorted,
    }
    return metrics


def run_training():
    print("🚗 CarIQ — ML Affordability Model Training")
    print("=" * 50)

    # Load
    loans = load_data()

    # Prepare
    X, y, feature_cols, encoders = prepare_features(loans)

    # Validate we have enough samples
    if len(X) < 10:
        print("\n⚠️  Not enough loan samples to train. Run seed.js first.")
        return

    # Train
    model, X_train, X_test, y_train, y_test, y_pred, y_pred_prob = train_model(X, y)

    # Evaluate
    metrics = evaluate_model(
        model, X, y, X_test, y_test,
        y_pred, y_pred_prob, feature_cols
    )

    # Save model artifacts
    joblib.dump(model,    MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)

    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)

    with open(FEATURES_PATH, 'w') as f:
        json.dump(metrics['feature_importance'], f, indent=2)

    print(f"\n✅ Model saved    → {MODEL_PATH}")
    print(f"✅ Encoders saved → {ENCODER_PATH}")
    print(f"✅ Metrics saved  → {METRICS_PATH}")

    print("\n" + "=" * 50)
    print(f"🎯 Training Complete!")
    print(f"   Accuracy: {metrics['accuracy']*100:.1f}%")
    if metrics['roc_auc']:
        print(f"   ROC-AUC:  {metrics['roc_auc']:.4f}")
    print(f"   CV Accuracy: {metrics['cv_mean_accuracy']*100:.1f}% ± {metrics['cv_std']*100:.1f}%")
    print("=" * 50)

    return model, encoders, metrics


if __name__ == '__main__':
    run_training()