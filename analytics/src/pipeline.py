"""
pipeline.py
Single-command orchestrator for the CarIQ analytics pipeline.
Runs: extract → clean → export CSVs → print summary report

Usage:
    python src/pipeline.py
"""

import pandas as pd
from pathlib import Path
from extract import extract_all
from clean import clean_all

# Output directory — git-ignored
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def export_csvs(clean_data: dict) -> None:
    print("\n💾 Exporting clean CSVs...\n")
    for name, df in clean_data.items():
        path = OUTPUT_DIR / f"{name}.csv"
        df.to_csv(path, index=False)
        print(f"  ✅ {name}.csv — {len(df)} rows | {df.shape[1]} columns → {path}")


def print_summary(clean_data: dict) -> None:
    print("\n" + "━" * 55)
    print("📊 CarIQ Pipeline Summary Report")
    print("━" * 55)

    customers = clean_data["customers"]
    vehicles  = clean_data["vehicles"]
    leads     = clean_data["leads"]
    txns      = clean_data["transactions"]
    master    = clean_data["master"]

    # Customers
    print("\n👥 CUSTOMERS")
    print(f"   Total              : {len(customers)}")
    print(f"   Avg Annual Income  : ₹{customers['annual_income'].mean():>12,.0f}")
    print(f"   Avg Credit Score   : {customers['credit_score'].mean():.0f}")
    print(f"   Employment Mix:")
    for emp, count in customers["employment_type"].value_counts().items():
        pct = count / len(customers) * 100
        print(f"     {emp:<18}: {count:>3} ({pct:.0f}%)")

    # Vehicles
    print("\n🚗 VEHICLES")
    print(f"   Total              : {len(vehicles)}")
    print(f"   Price Range        : "
          f"₹{vehicles['price_inr'].min():,.0f} – ₹{vehicles['price_inr'].max():,.0f}")
    print(f"   Segment Mix:")
    for seg, count in vehicles["segment"].value_counts().items():
        print(f"     {seg:<18}: {count}")

    # Leads
    print("\n📋 LEADS")
    print(f"   Total              : {len(leads)}")
    print(f"   Status Breakdown:")
    for status, count in leads["status"].value_counts().items():
        pct = count / len(leads) * 100
        print(f"     {status:<18}: {count:>3} ({pct:.0f}%)")

    # Transactions
    print("\n💳 TRANSACTIONS")
    print(f"   Total              : {len(txns)}")
    print(f"   Payment Mode Mix:")
    for mode, count in txns["payment_mode"].value_counts().items():
        pct = count / len(txns) * 100
        print(f"     {mode:<18}: {count:>3} ({pct:.0f}%)")
    loan_txns = txns[txns["payment_mode"] == "Loan"]
    if len(loan_txns) > 0:
        print(f"   Avg EMI (Loan)     : ₹{loan_txns['emi_amount'].mean():>10,.0f}")
        print(f"   Avg Interest Rate  : {loan_txns['interest_rate'].mean():.2f}%")

    # Affordability (Q1 preview)
    print("\n📈 AFFORDABILITY SNAPSHOT (Q1 Preview)")
    affordable = master["is_affordable"].sum()
    total_loan = master["is_affordable"].notna().sum()
    if total_loan > 0:
        print(f"   Affordable loans   : {affordable}/{total_loan} "
              f"({affordable/total_loan*100:.0f}%)")
    avg_ratio = master["affordability_ratio"].mean()
    if pd.notna(avg_ratio):
        print(f"   Avg EMI/Income     : {avg_ratio*100:.1f}%")

    print("\n" + "━" * 55)
    print("✅ Pipeline complete. CSVs ready for EDA notebooks.")
    print("━" * 55)


def run_pipeline() -> dict:
    print("🚗 CarIQ Analytics Pipeline — Starting...\n")
    raw   = extract_all()
    clean = clean_all(raw)
    export_csvs(clean)
    print_summary(clean)
    return clean


if __name__ == "__main__":
    run_pipeline()