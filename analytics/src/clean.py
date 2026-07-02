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

    # Types
    df["customer_id"]   = df["customer_id"].astype(int)
    df["annual_income"] = pd.to_numeric(df["annual_income"], errors="coerce")
    df["credit_score"]  = pd.to_numeric(df["credit_score"],  errors="coerce").astype("Int64")
    df["created_at"]    = pd.to_datetime(df["created_at"],   errors="coerce")

    # Nulls
    df["phone"] = df["phone"].fillna("Unknown")

    # Derived: monthly_income — locked in spec Day 2
    df["monthly_income"] = (df["annual_income"] / 12).round(2)

    # Derived: income_segment for Q4 analysis
    df["income_segment"] = pd.cut(
        df["annual_income"],
        bins=[0, 300000, 600000, 1200000, 2500000, 5000000, float("inf")],
        labels=["< 3L", "3–6L", "6–12L", "12–25L", "25–50L", "50L+"]
    )

    # Derived: credit_band for Q4 analysis
    df["credit_band"] = pd.cut(
        df["credit_score"],
        bins=[300, 550, 650, 750, 900],
        labels=["Poor (300–550)", "Fair (550–650)",
                "Good (650–750)", "Excellent (750–900)"]
    )

    # Validate: drop rows with null income or credit score (data integrity)
    before = len(df)
    df = df.dropna(subset=["annual_income", "credit_score"])
    dropped = before - len(df)
    if dropped > 0:
        print(f"     ⚠️  Dropped {dropped} customers with null income/credit")

    print(f"     ✅ {len(df)} customers clean | "
          f"monthly_income derived | income_segment + credit_band added")
    return df


def clean_vehicles(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning vehicles...")
    df = df.copy()

    df["vehicle_id"] = df["vehicle_id"].astype(int)
    df["year"]       = pd.to_numeric(df["year"],      errors="coerce").astype("Int64")
    df["price_inr"]  = pd.to_numeric(df["price_inr"], errors="coerce")
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

    df["variant"] = df["variant"].fillna("Base")

    # Derived: price_segment for Q1/Q5 analysis
    df["price_segment"] = pd.cut(
        df["price_inr"],
        bins=[0, 600000, 1000000, 1500000, 2500000, 5000000, float("inf")],
        labels=["Budget (<6L)", "Economy (6–10L)", "Mid (10–15L)",
                "Upper-Mid (15–25L)", "Premium (25–50L)", "Luxury (50L+)"]
    )

    print(f"     ✅ {len(df)} vehicles clean | price_segment added")
    return df


def clean_leads(df: pd.DataFrame) -> pd.DataFrame:
    print("  🔧 Cleaning leads...")
    df = df.copy()

    df["lead_id"]     = df["lead_id"].astype(int)
    df["customer_id"] = df["customer_id"].astype(int)
    df["vehicle_id"]  = df["vehicle_id"].astype(int)
    df["enquiry_date"]= pd.to_datetime(df["enquiry_date"], errors="coerce")
    df["created_at"]  = pd.to_datetime(df["created_at"],   errors="coerce")

    df["dealer_name"] = df["dealer_name"].fillna("Unknown Dealer")
    df["notes"]       = df["notes"].fillna("")

    # Derived: enquiry month + year for Q3 seasonality analysis
    df["enquiry_month"] = df["enquiry_date"].dt.month
    df["enquiry_year"]  = df["enquiry_date"].dt.year
    df["enquiry_quarter"] = df["enquiry_date"].dt.quarter

    print(f"     ✅ {len(df)} leads clean | "
          f"enquiry_month/year/quarter derived")
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

    print(f"     ✅ {len(df)} transactions clean | "
          f"tx_month/year/quarter + is_loan derived")
    return df


def merge_master(
    customers: pd.DataFrame,
    vehicles: pd.DataFrame,
    leads: pd.DataFrame,
    transactions: pd.DataFrame
) -> pd.DataFrame:
    """
    Builds a denormalized master DataFrame joining all 4 tables.
    Used for Q1 affordability analysis and Q5 price sensitivity.
    """
    print("  🔧 Building master joined DataFrame...")

    master = transactions.merge(
        customers[["customer_id", "full_name", "city", "state",
                   "annual_income", "monthly_income", "credit_score",
                   "employment_type", "income_segment", "credit_band"]],
        on="customer_id", how="left"
    ).merge(
        vehicles[["vehicle_id", "make", "model", "segment",
                  "fuel_type", "price_inr", "price_segment"]],
        on="vehicle_id", how="left"
    )

    # Affordability ratio: EMI as % of monthly income (Q1 key metric)
    master["affordability_ratio"] = (
        master["emi_amount"] / master["monthly_income"]
    ).round(4)

    # Flag: affordable if EMI <= 40% of monthly income (standard lending rule)
    master["is_affordable"] = (
        master["affordability_ratio"] <= 0.40
    ).astype("Int64")

    print(f"     ✅ Master DataFrame: {len(master)} rows | "
          f"{master.shape[1]} columns")
    return master


def clean_all(raw: dict) -> dict:
    print("\n🧹 Cleaning all tables...\n")
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
            "final_price_inr", "emi_amount", "monthly_income",
            "affordability_ratio", "is_affordable"]
    print(clean["master"][cols].head(3).to_string())