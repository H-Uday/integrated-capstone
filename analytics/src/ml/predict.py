"""
predict.py
Loads the trained XGBoost model and provides prediction functions.

Two modes:
1. predict_single()  — predict for one customer + vehicle combination
2. predict_batch()   — predict for a DataFrame of combinations

Returns probability score (0.0–1.0) not just binary yes/no.
This is the key improvement over the rule-based 40% threshold.
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────
MODEL_DIR    = Path(__file__).resolve().parents[2] / 'models'
MODEL_PATH   = MODEL_DIR / 'affordability_model.joblib'
ENCODER_PATH = MODEL_DIR / 'label_encoders.joblib'
METRICS_PATH = MODEL_DIR / 'model_metrics.json'

FEATURE_COLS = [
    'annual_income_usd',
    'credit_score',
    'employment_type',
    'price_usd_equivalent',
    'loan_tenure_months',
    'interest_rate',
    'emi_amount_usd',
]

INR_TO_USD = 0.0107


def load_model():
    """Load trained model and encoders from disk."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}\n"
            f"Run: python src/ml/train.py"
        )
    model    = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODER_PATH)
    return model, encoders


def calculate_emi(principal, annual_rate, tenure_months):
    """EMI formula — same as Node.js and Python pipeline."""
    if not principal or not annual_rate or not tenure_months:
        return 0
    r = annual_rate / 12 / 100
    n = int(tenure_months)
    if r == 0:
        return principal / n
    return round(principal * r * (1 + r)**n / ((1 + r)**n - 1), 2)


def predict_single(
    annual_income_usd: float,
    credit_score: int,
    employment_type: str,
    price_usd: float,
    loan_tenure_months: int,
    interest_rate: float,
    down_payment_pct: float = 0.20
) -> dict:
    """
    Predict affordability probability for a single customer-vehicle pair.

    Args:
        annual_income_usd   : Customer's annual income in USD
        credit_score        : Credit score (300–900)
        employment_type     : Salaried / Self-Employed / Business / Retired
        price_usd           : Vehicle price in USD
        loan_tenure_months  : Loan tenure in months (12–84)
        interest_rate       : Annual interest rate in % (6.0–20.0)
        down_payment_pct    : Down payment % (default 20%)

    Returns:
        dict with probability, prediction, risk_level, and explanation
    """
    model, encoders = load_model()

    # Compute loan amount and EMI
    loan_amount_usd = price_usd * (1 - down_payment_pct)
    loan_amount_inr = loan_amount_usd / INR_TO_USD
    emi_inr         = calculate_emi(loan_amount_inr, interest_rate, loan_tenure_months)
    emi_usd         = emi_inr * INR_TO_USD

    # Encode employment type
    emp_encoded = employment_type
    if 'employment_type' in encoders:
        le = encoders['employment_type']
        try:
            emp_encoded = le.transform([employment_type])[0]
        except ValueError:
            emp_encoded = 0  # default to first class

    # Build feature vector
    features = np.array([[
        annual_income_usd,
        credit_score,
        emp_encoded,
        price_usd,
        loan_tenure_months,
        interest_rate,
        emi_usd,
    ]])

    # Predict
    prob_affordable = float(model.predict_proba(features)[0][1])
    prediction      = int(model.predict(features)[0])

    # Rule-based comparison
    monthly_income_usd = annual_income_usd / 12
    rule_ratio         = emi_usd / monthly_income_usd if monthly_income_usd > 0 else 99
    rule_affordable    = rule_ratio <= 0.40

    # Risk level
    if prob_affordable >= 0.75:
        risk_level = 'LOW RISK — Highly Affordable'
    elif prob_affordable >= 0.55:
        risk_level = 'MODERATE RISK — Borderline Affordable'
    elif prob_affordable >= 0.35:
        risk_level = 'HIGH RISK — Likely Unaffordable'
    else:
        risk_level = 'VERY HIGH RISK — Unaffordable'

    return {
        'probability_affordable': round(prob_affordable, 4),
        'ml_prediction':          'Affordable' if prediction == 1 else 'Unaffordable',
        'rule_prediction':        'Affordable' if rule_affordable else 'Unaffordable',
        'rule_emi_ratio':         round(rule_ratio, 4),
        'risk_level':             risk_level,
        'monthly_income_usd':     round(monthly_income_usd, 2),
        'emi_usd':                round(emi_usd, 2),
        'loan_amount_usd':        round(loan_amount_usd, 2),
        'ml_vs_rule_agreement':   (prediction == 1) == rule_affordable,
    }


def predict_batch(df: pd.DataFrame) -> pd.DataFrame:
    """
    Predict affordability for a batch DataFrame.
    Expects columns matching FEATURE_COLS.
    Returns df with added 'ml_probability' and 'ml_prediction' columns.
    """
    model, encoders = load_model()

    df = df.copy()

    # Encode
    if 'employment_type' in encoders and 'employment_type' in df.columns:
        le = encoders['employment_type']
        df['employment_type'] = df['employment_type'].apply(
            lambda x: le.transform([x])[0] if x in le.classes_ else 0
        )

    # Features
    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].fillna(0).values

    probs       = model.predict_proba(X)[:, 1]
    predictions = model.predict(X)

    df['ml_probability']  = probs.round(4)
    df['ml_prediction']   = ['Affordable' if p == 1 else 'Unaffordable' for p in predictions]
    df['ml_risk_level']   = df['ml_probability'].apply(
        lambda p: 'LOW' if p >= 0.75 else ('MODERATE' if p >= 0.55 else ('HIGH' if p >= 0.35 else 'VERY HIGH'))
    )
    return df


def get_model_metrics() -> dict:
    """Load saved model metrics from training."""
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH) as f:
        return json.load(f)


if __name__ == '__main__':
    print("🚗 CarIQ — ML Prediction Test")
    print("=" * 50)

    # Test Case 1 — Salaried customer, mid-range car
    result1 = predict_single(
        annual_income_usd=25000,
        credit_score=720,
        employment_type='Salaried',
        price_usd=15000,
        loan_tenure_months=60,
        interest_rate=9.5,
        down_payment_pct=0.20
    )
    print("\nTest 1 — Salaried, $25K income, $15K car, 60 months, 9.5%:")
    for k, v in result1.items():
        print(f"  {k:<30}: {v}")

    # Test Case 2 — Low income, luxury car
    result2 = predict_single(
        annual_income_usd=8000,
        credit_score=620,
        employment_type='Retired',
        price_usd=60000,
        loan_tenure_months=36,
        interest_rate=14.0,
        down_payment_pct=0.10
    )
    print("\nTest 2 — Retired, $8K income, $60K car, 36 months, 14%:")
    for k, v in result2.items():
        print(f"  {k:<30}: {v}")

    # Test Case 3 — Business owner, hypercar
    result3 = predict_single(
        annual_income_usd=500000,
        credit_score=850,
        employment_type='Business',
        price_usd=3200000,
        loan_tenure_months=84,
        interest_rate=8.0,
        down_payment_pct=0.30
    )
    print("\nTest 3 — Business, $500K income, Bugatti $3.2M, 84 months, 8%:")
    for k, v in result3.items():
        print(f"  {k:<30}: {v}")

    print("\n✅ Prediction tests complete")