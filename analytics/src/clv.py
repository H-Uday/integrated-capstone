"""
clv.py
Customer Lifetime Value (CLV) analysis for CarIQ.

Answers Q7: Which customer segments generate the most
long-term value, and how should CarIQ prioritize them?

CLV Formula used:
CLV = Average Transaction Value × Purchase Frequency × Customer Lifespan

Segments customers into High/Medium/Low CLV tiers
for targeted marketing and lending strategy.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).resolve().parents[1] / 'data'


def load_clv_data():
    """Load and prepare data for CLV analysis."""
    master    = pd.read_csv(DATA_DIR / 'master.csv')
    customers = pd.read_csv(DATA_DIR / 'customers.csv')

    master['transaction_date'] = pd.to_datetime(master['transaction_date'])

    print(f"📦 CLV Analysis Data:")
    print(f"   Total transactions : {len(master)}")
    print(f"   Total customers    : {len(customers)}")
    print(f"   Unique buyers      : {master['customer_id'].nunique()}")

    return master, customers


def compute_clv(master: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    """
    Compute CLV for each customer.

    Components:
    - avg_transaction_value : Mean price paid per transaction (USD)
    - purchase_frequency    : Number of transactions per customer
    - customer_lifespan     : Estimated years as active customer (1–5)
    - clv                   : avg_value × frequency × lifespan
    """
    # Per-customer transaction stats
    customer_stats = master.groupby('customer_id').agg(
        transaction_count    = ('transaction_id', 'count'),
        total_revenue_usd    = ('price_usd_equivalent', 'sum'),
        avg_transaction_usd  = ('price_usd_equivalent', 'mean'),
        first_transaction    = ('transaction_date', 'min'),
        last_transaction     = ('transaction_date', 'max'),
        segments_bought      = ('segment', 'nunique'),
        payment_modes        = ('payment_mode', lambda x: x.mode()[0]),
    ).reset_index()

    # Merge with customer profiles
    clv_df = customer_stats.merge(
        customers[[
            'customer_id', 'full_name', 'country',
            'annual_income_usd', 'credit_score',
            'employment_type', 'income_segment'
        ]],
        on='customer_id', how='left'
    )

    # Compute lifespan in years (capped at 5)
    clv_df['first_transaction'] = pd.to_datetime(clv_df['first_transaction'])
    clv_df['last_transaction']  = pd.to_datetime(clv_df['last_transaction'])
    clv_df['lifespan_days']     = (
        clv_df['last_transaction'] - clv_df['first_transaction']
    ).dt.days.fillna(0)
    clv_df['lifespan_years']    = (
        clv_df['lifespan_days'] / 365
    ).clip(lower=0.5, upper=5.0).round(2)

    # CLV = avg transaction value × frequency × lifespan
    clv_df['clv'] = (
        clv_df['avg_transaction_usd'] *
        clv_df['transaction_count']   *
        clv_df['lifespan_years']
    ).round(2)

    # CLV Tier segmentation
    clv_33 = clv_df['clv'].quantile(0.33)
    clv_66 = clv_df['clv'].quantile(0.66)

    def assign_tier(clv):
        if clv >= clv_66:   return 'High Value'
        elif clv >= clv_33: return 'Medium Value'
        else:               return 'Low Value'

    clv_df['clv_tier'] = clv_df['clv'].apply(assign_tier)

    print(f"\n📊 CLV Distribution:")
    print(f"   Min CLV  : ${clv_df['clv'].min():>12,.2f}")
    print(f"   Max CLV  : ${clv_df['clv'].max():>12,.2f}")
    print(f"   Mean CLV : ${clv_df['clv'].mean():>12,.2f}")
    print(f"   Median   : ${clv_df['clv'].median():>12,.2f}")

    print(f"\n   CLV Tier Breakdown:")
    for tier, count in clv_df['clv_tier'].value_counts().items():
        avg = clv_df[clv_df['clv_tier'] == tier]['clv'].mean()
        print(f"   {tier:<15}: {count:>3} customers | Avg CLV: ${avg:>10,.2f}")

    return clv_df


def clv_by_segment(clv_df: pd.DataFrame) -> pd.DataFrame:
    """Analyze CLV by income segment."""
    seg_clv = clv_df.groupby('income_segment').agg(
        customer_count = ('customer_id', 'count'),
        avg_clv        = ('clv', 'mean'),
        total_clv      = ('clv', 'sum'),
        avg_txn_value  = ('avg_transaction_usd', 'mean'),
        avg_frequency  = ('transaction_count', 'mean'),
        high_value_pct = ('clv_tier', lambda x: (x == 'High Value').sum() / len(x) * 100),
    ).reset_index()

    seg_clv['avg_clv']        = seg_clv['avg_clv'].round(2)
    seg_clv['total_clv']      = seg_clv['total_clv'].round(2)
    seg_clv['avg_txn_value']  = seg_clv['avg_txn_value'].round(2)
    seg_clv['avg_frequency']  = seg_clv['avg_frequency'].round(2)
    seg_clv['high_value_pct'] = seg_clv['high_value_pct'].round(1)

    seg_clv = seg_clv.sort_values('avg_clv', ascending=False)

    print(f"\n📊 CLV by Income Segment:")
    print(f"   {'Segment':<15} {'Customers':>10} {'Avg CLV':>12} {'High Value%':>12}")
    print("   " + "-" * 52)
    for _, row in seg_clv.iterrows():
        print(f"   {str(row['income_segment']):<15} "
              f"{row['customer_count']:>10} "
              f"${row['avg_clv']:>11,.2f} "
              f"{row['high_value_pct']:>11.1f}%")

    return seg_clv


def clv_by_employment(clv_df: pd.DataFrame) -> pd.DataFrame:
    """Analyze CLV by employment type."""
    emp_clv = clv_df.groupby('employment_type').agg(
        customer_count = ('customer_id', 'count'),
        avg_clv        = ('clv', 'mean'),
        total_clv      = ('clv', 'sum'),
        avg_frequency  = ('transaction_count', 'mean'),
    ).reset_index().sort_values('avg_clv', ascending=False)

    emp_clv['avg_clv']   = emp_clv['avg_clv'].round(2)
    emp_clv['total_clv'] = emp_clv['total_clv'].round(2)

    print(f"\n📊 CLV by Employment Type:")
    print(f"   {'Employment':<20} {'Customers':>10} {'Avg CLV':>12} {'Total CLV':>14}")
    print("   " + "-" * 58)
    for _, row in emp_clv.iterrows():
        print(f"   {row['employment_type']:<20} "
              f"{row['customer_count']:>10} "
              f"${row['avg_clv']:>11,.2f} "
              f"${row['total_clv']:>13,.2f}")

    return emp_clv


def top_customers(clv_df: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    """Return top N customers by CLV."""
    top = clv_df.nlargest(n, 'clv')[[
        'customer_id', 'full_name', 'country',
        'employment_type', 'income_segment',
        'transaction_count', 'avg_transaction_usd',
        'clv', 'clv_tier'
    ]].reset_index(drop=True)

    print(f"\n🏆 Top {n} Customers by CLV:")
    print(f"   {'Name':<20} {'Country':<12} {'CLV':>12} {'Tier':<15}")
    print("   " + "-" * 62)
    for _, row in top.iterrows():
        print(f"   {str(row['full_name']):<20} "
              f"{str(row['country']):<12} "
              f"${row['clv']:>11,.2f} "
              f"{row['clv_tier']:<15}")

    return top


def run_clv_analysis():
    print("🚗 CarIQ — Customer Lifetime Value Analysis")
    print("=" * 50)

    master, customers = load_clv_data()
    clv_df   = compute_clv(master, customers)
    seg_clv  = clv_by_segment(clv_df)
    emp_clv  = clv_by_employment(clv_df)
    top_custs = top_customers(clv_df, n=10)

    print(f"\n✅ CLV Analysis complete")
    print(f"   Customers analyzed : {len(clv_df)}")
    print(f"   High Value tier    : {(clv_df['clv_tier'] == 'High Value').sum()}")
    print(f"   Medium Value tier  : {(clv_df['clv_tier'] == 'Medium Value').sum()}")
    print(f"   Low Value tier     : {(clv_df['clv_tier'] == 'Low Value').sum()}")

    return clv_df, seg_clv, emp_clv, top_custs


if __name__ == '__main__':
    run_clv_analysis()