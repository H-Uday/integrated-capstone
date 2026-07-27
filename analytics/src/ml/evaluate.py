"""
evaluate.py
Generates detailed evaluation report comparing ML model
vs rule-based 40% threshold across all loan transactions.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from predict import predict_batch, get_model_metrics

DATA_DIR = Path(__file__).resolve().parents[2] / 'data'


def run_evaluation():
    print("🚗 CarIQ — ML vs Rule-Based Comparison Report")
    print("=" * 55)

    # Load master data
    master = pd.read_csv(DATA_DIR / 'master.csv')
    loans  = master[master['payment_mode'] == 'Loan'].copy()
    loans  = loans.dropna(subset=['emi_amount_usd', 'annual_income_usd'])

    print(f"\n📊 Evaluating on {len(loans)} loan transactions...\n")

    # Batch predict
    loans_pred = predict_batch(loans)

    # Compare ML vs Rule
    ml_affordable   = (loans_pred['ml_prediction'] == 'Affordable').sum()
    rule_affordable = loans['is_affordable'].sum()
    total           = len(loans_pred)

    print(f"{'Metric':<35} {'Rule-Based':>12} {'ML Model':>12}")
    print("-" * 60)
    print(f"{'Affordable count':<35} {rule_affordable:>12} {ml_affordable:>12}")
    print(f"{'Affordable rate':<35} {rule_affordable/total*100:>11.1f}% {ml_affordable/total*100:>11.1f}%")
    print(f"{'Unaffordable count':<35} {total-rule_affordable:>12} {total-ml_affordable:>12}")

    # Agreement analysis
    agreement = (
        (loans_pred['ml_prediction'] == 'Affordable') ==
        (loans['is_affordable'] == 1)
    ).sum()
    print(f"\n{'Agreement between ML and Rule':<35} {agreement}/{total} ({agreement/total*100:.1f}%)")

    # Risk distribution
    print(f"\n── ML Risk Level Distribution ──")
    risk_counts = loans_pred['ml_risk_level'].value_counts()
    for level, count in risk_counts.items():
        pct = count / total * 100
        bar = '█' * int(pct / 3)
        print(f"  {level:<15} : {count:>3} ({pct:>5.1f}%)  {bar}")

    # Model metrics
    metrics = get_model_metrics()
    if metrics:
        print(f"\n── Saved Model Metrics ──")
        print(f"  Accuracy     : {metrics.get('accuracy', 'N/A')}")
        print(f"  ROC-AUC      : {metrics.get('roc_auc', 'N/A')}")
        print(f"  CV Accuracy  : {metrics.get('cv_mean_accuracy', 'N/A')} ± {metrics.get('cv_std', 'N/A')}")

        print(f"\n── Feature Importance (from training) ──")
        fi = metrics.get('feature_importance', {})
        for feat, imp in fi.items():
            bar = '█' * int(imp * 40)
            print(f"  {feat:<25} {imp:.4f}  {bar}")

    print("\n" + "=" * 55)
    print("✅ Evaluation complete")
    return loans_pred


if __name__ == '__main__':
    run_evaluation()