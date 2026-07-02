"""
extract.py
Connects to the CarIQ SQLite operational database and extracts
all four core tables into pandas DataFrames.

No transformations are applied here — raw data only.
"""

import sqlite3
import pandas as pd
from pathlib import Path

# Path is relative to analytics/src/ — goes up two levels to find app/cariq.sqlite
DB_PATH = Path(__file__).resolve().parents[2] / "app" / "cariq.sqlite"


def get_connection() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise FileNotFoundError(
            f"Database not found at {DB_PATH}\n"
            f"Run the seed script first: cd app && node src/seed.js"
        )
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def extract_customers(conn: sqlite3.Connection) -> pd.DataFrame:
    query = "SELECT * FROM customers ORDER BY customer_id"
    df = pd.read_sql_query(query, conn)
    print(f"  ✅ customers      : {len(df):>4} rows | {df.shape[1]} columns")
    return df


def extract_vehicles(conn: sqlite3.Connection) -> pd.DataFrame:
    query = "SELECT * FROM vehicles ORDER BY vehicle_id"
    df = pd.read_sql_query(query, conn)
    print(f"  ✅ vehicles       : {len(df):>4} rows | {df.shape[1]} columns")
    return df


def extract_leads(conn: sqlite3.Connection) -> pd.DataFrame:
    query = "SELECT * FROM leads ORDER BY lead_id"
    df = pd.read_sql_query(query, conn)
    print(f"  ✅ leads          : {len(df):>4} rows | {df.shape[1]} columns")
    return df


def extract_transactions(conn: sqlite3.Connection) -> pd.DataFrame:
    query = "SELECT * FROM transactions ORDER BY transaction_id"
    df = pd.read_sql_query(query, conn)
    print(f"  ✅ transactions   : {len(df):>4} rows | {df.shape[1]} columns")
    return df


def extract_all() -> dict[str, pd.DataFrame]:
    print("\n📦 Extracting data from CarIQ database...")
    print(f"   Source: {DB_PATH}\n")
    conn = get_connection()
    try:
        data = {
            "customers":    extract_customers(conn),
            "vehicles":     extract_vehicles(conn),
            "leads":        extract_leads(conn),
            "transactions": extract_transactions(conn),
        }
    finally:
        conn.close()
    print(f"\n   Total tables extracted: {len(data)}")
    return data


if __name__ == "__main__":
    data = extract_all()
    for name, df in data.items():
        print(f"\n── {name} sample ──")
        print(df.head(2).to_string())