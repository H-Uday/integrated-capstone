"""
clean.py
Applies transformations to raw extracted DataFrames:
  - Type coercion
  - Null handling
  - Derived column: monthly_income (annual_income / 12)
  - Derived column: affordability_ratio (emi_amount / monthly_income)
  - Categorical encoding for segmentation
  - Date parsing
"""

import pandas as pd
import numpy as np


def clean_customers(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning customers...")
    df = df.copy()

    df["customer_id"]         = df["customer_id"].astype(int)
    df["annual_income_local"] = pd.to_numeric(df["annual_income_local"], errors="coerce")
    df["annual_income_usd"]   = pd.to_numeric(df["annual_income_usd"],   errors="coerce")
    df["credit_score"]        = pd.to_numeric(df["credit_score"], errors="coerce").astype("Int64")
    df["created_at"]          = pd.to_datetime(df["created_at"],  errors="coerce")

    df["phone"] = df["phone"].fillna("Unknown")

    # monthly_income derived from local currency (spec locked Day 2)
    df["monthly_income_local"] = (df["annual_income_local"] / 12).round(2)
    df["monthly_income_usd"]   = (df["annual_income_usd"]   / 12).round(2)

    # income_segment based on USD for cross-country comparability
    df["income_segment"] = pd.cut(
        df["annual_income_usd"],
        bins=[0, 10000, 30000, 60000, 120000, 300000, float("inf")],
        labels=["<$10K", "$10–30K", "$30–60K", "$60–120K", "$120–300K", "$300K+"]
    )

    df["credit_band"] = pd.cut(
        df["credit_score"],
        bins=[300, 550, 650, 750, 900],
        labels=["Poor (300–550)", "Fair (550–650)",
                "Good (650–750)", "Excellent (750–900)"]
    )

    before = len(df)
    df = df.dropna(subset=["annual_income_local", "credit_score"])
    dropped = before - len(df)
    if dropped > 0:
        print(f"     ⚠️  Dropped {dropped} customers with null income/credit")

    print(f"     ✅ {len(df)} customers clean | "
          f"monthly_income_local + monthly_income_usd derived | "
          f"income_segment + credit_band added")
    return df


def clean_vehicles(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning vehicles...")
    df = df.copy()

    df["vehicle_id"]           = df["vehicle_id"].astype(int)
    df["year"]                 = pd.to_numeric(df["year"],                 errors="coerce").astype("Int64")
    df["price_local"]          = pd.to_numeric(df["price_local"],          errors="coerce")
    df["price_usd_equivalent"] = pd.to_numeric(df["price_usd_equivalent"], errors="coerce")
    df["created_at"]           = pd.to_datetime(df["created_at"],           errors="coerce")

    df["variant"] = df["variant"].fillna("Base")

    # price_segment based on USD for global comparability
    df["price_segment"] = pd.cut(
        df["price_usd_equivalent"],
        bins=[0, 5000, 15000, 30000, 60000, 150000, float("inf")],
        labels=["Budget (<$5K)", "Economy ($5–15K)", "Mid ($15–30K)",
                "Upper-Mid ($30–60K)", "Premium ($60–150K)", "Ultra ($150K+)"]
    )

    print(f"     ✅ {len(df)} vehicles clean | price_segment (USD) added")
    return df


def clean_leads(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning leads...")
    df = df.copy()

    df["lead_id"]      = df["lead_id"].astype(int)
    df["customer_id"]  = df["customer_id"].astype(int)
    df["vehicle_id"]   = df["vehicle_id"].astype(int)
    df["enquiry_date"] = pd.to_datetime(df["enquiry_date"], errors="coerce")
    df["created_at"]   = pd.to_datetime(df["created_at"],   errors="coerce")

    df["dealer_name"]  = df["dealer_name"].fillna("Unknown Dealer")
    df["notes"]        = df["notes"].fillna("")

    # Derived: enquiry month + year for Q3 seasonality analysis
    df["enquiry_month"]   = df["enquiry_date"].dt.month
    df["enquiry_year"]    = df["enquiry_date"].dt.year
    df["enquiry_quarter"] = df["enquiry_date"].dt.quarter

    print(f"     ✅ {len(df)} leads clean | enquiry_month/year/quarter derived")
    return df


def clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning transactions...")
    df = df.copy()

    df["transaction_id"]     = df["transaction_id"].astype(int)
    df["customer_id"]        = df["customer_id"].astype(int)
    df["vehicle_id"]         = df["vehicle_id"].astype(int)
    df["transaction_date"]   = pd.to_datetime(df["transaction_date"], errors="coerce")
    df["created_at"]         = pd.to_datetime(df["created_at"],       errors="coerce")
    df["final_price_inr"]    = pd.to_numeric(df["final_price_inr"],   errors="coerce")
    df["loan_amount"]        = pd.to_numeric(df["loan_amount"],        errors="coerce")
    df["interest_rate"]      = pd.to_numeric(df["interest_rate"],      errors="coerce")
    df["emi_amount"]         = pd.to_numeric(df["emi_amount"],         errors="coerce")

    # lead_id nullable (walk-in cash sales) — keep as float with NaN
    df["loan_tenure_months"] = pd.to_numeric(
        df["loan_tenure_months"], errors="coerce"
    ).astype("Int64")

    # Derived: transaction month/year for Q3 seasonality
    df["tx_month"]   = df["transaction_date"].dt.month
    df["tx_year"]    = df["transaction_date"].dt.year
    df["tx_quarter"] = df["transaction_date"].dt.quarter

    # Derived: is_loan flag for Q1 analysis
    df["is_loan"] = (df["payment_mode"] == "Loan").astype(int)

    print(f"     ✅ {len(df)} transactions clean | tx_month/year/quarter + is_loan derived")
    return df


def merge_master(
    customers: pd.DataFrame,
    vehicles: pd.DataFrame,
    leads: pd.DataFrame,
    transactions: pd.DataFrame
) -> pd.DataFrame:
    print("  🔧 Building master joined DataFrame...")

    master = transactions.merge(
        customers[["customer_id", "full_name", "city", "state", "country",
                   "currency_code", "annual_income_local", "annual_income_usd",
                   "monthly_income_local", "monthly_income_usd",
                   "credit_score", "employment_type",
                   "income_segment", "credit_band"]],
        on="customer_id", how="left"
    ).merge(
        vehicles[["vehicle_id", "make", "model", "segment", "fuel_type",
                  "price_local", "currency_code", "price_usd_equivalent",
                  "price_segment"]],
        on="vehicle_id", how="left",
        suffixes=("_customer", "_vehicle")
    )

    # Convert emi_amount (stored in INR) to USD for cross-currency comparison
    INR_TO_USD = 0.0107
    master["emi_amount_usd"] = (master["emi_amount"] * INR_TO_USD).round(2)

# Affordability ratio: EMI (USD) as % of monthly income (USD)
    master["affordability_ratio"] = (
    master["emi_amount_usd"] / master["monthly_income_usd"]
).round(4)

    master["is_affordable"] = (
    master["affordability_ratio"] <= 0.40
).astype("Int64")

    print(f"     ✅ Master DataFrame: {len(master)} rows | {master.shape[1]} columns")
    return master


def clean_all(raw: dict) -> dict:
    print("\nRules Engine: 🧹 Cleaning all tables...\n")
    customers    = clean_customers(raw["customers"])
    vehicles     = clean_vehicles(raw["vehicles"])
    leads        = clean_leads(raw["leads"])
    transactions = clean_transactions(raw["transactions"])
    master       = merge_master(customers, vehicles, leads, transactions)

    return {
        "customers":    customers,
        "vehicles":     vehicles,
        "leads":        leads,
        "transactions": transactions,
        "master":       master
    }


if __name__ == "__main__":
    from extract import extract_all
    raw    = extract_all()
    clean  = clean_all(raw)
    print("\n── Master sample ──")
    cols = ["transaction_id", "full_name", "make", "model",
            "final_price_inr", "emi_amount", "monthly_income_usd",
            "affordability_ratio", "is_affordable"]
    print(clean["master"][cols].head(3).to_string())