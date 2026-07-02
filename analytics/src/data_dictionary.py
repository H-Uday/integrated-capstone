"""
data_dictionary.py
Programmatically generates a data dictionary from clean DataFrames.
Outputs both a printed report and a CSV for stakeholder reference.
"""

import pandas as pd
from pathlib import Path
from extract import extract_all
from clean import clean_all

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "data"


def describe_column(df: pd.DataFrame, col: str) -> dict:
    s = df[col]
    info = {
        "column":   col,
        "dtype":    str(s.dtype),
        "non_null": int(s.notna().sum()),
        "null":     int(s.isna().sum()),
        "unique":   int(s.nunique()),
    }
    if pd.api.types.is_numeric_dtype(s):
        info["min"]  = round(float(s.min()), 2) if s.notna().any() else None
        info["max"]  = round(float(s.max()), 2) if s.notna().any() else None
        info["mean"] = round(float(s.mean()), 2) if s.notna().any() else None
    else:
        info["min"]  = None
        info["max"]  = None
        info["mean"] = None
        if s.notna().any():
            info["sample_values"] = ", ".join(
                str(v) for v in s.dropna().unique()[:4]
            )
    return info


def generate_data_dictionary(clean_data: dict) -> pd.DataFrame:
    print("\n📖 Generating data dictionary...\n")
    rows = []

    table_descriptions = {
        "customers":    "Operational customer profiles with financial attributes",
        "vehicles":     "Vehicle inventory with pricing and segment classification",
        "leads":        "Customer enquiries linked to vehicles and dealers",
        "transactions": "Completed sales with EMI computation and payment mode",
        "master":       "Denormalized join of all 4 tables for analytical queries",
    }

    for table_name, df in clean_data.items():
        print(f"  📋 {table_name} ({len(df)} rows, {df.shape[1]} columns)")
        for col in df.columns:
            entry = describe_column(df, col)
            entry["table"]             = table_name
            entry["table_description"] = table_descriptions.get(table_name, "")
            rows.append(entry)

    cols_order = [
        "table", "table_description", "column", "dtype",
        "non_null", "null", "unique", "min", "max", "mean"
    ]
    dd = pd.DataFrame(rows)[cols_order]

    # Export
    path = OUTPUT_DIR / "data_dictionary.csv"
    dd.to_csv(path, index=False)
    print(f"\n  ✅ Data dictionary exported → {path}")
    print(f"     {len(dd)} column entries across {dd['table'].nunique()} tables")
    return dd


def print_dictionary_report(dd: pd.DataFrame) -> None:
    print("\n" + "━" * 60)
    print("📖 DATA DICTIONARY — CarIQ Analytics")
    print("━" * 60)

    for table in dd["table"].unique():
        t = dd[dd["table"] == table]
        desc = t["table_description"].iloc[0]
        print(f"\n┌─ {table.upper()} — {desc}")
        for _, row in t.iterrows():
            null_note = f" ⚠️  {row['null']} nulls" if row["null"] > 0 else ""
            num_note  = ""
            if row["mean"] is not None:
                num_note = f" | range: {row['min']:,} – {row['max']:,} | mean: {row['mean']:,}"
            print(f"│  {row['column']:<30} {row['dtype']:<12}"
                  f"{null_note}{num_note}")
        print(f"└─ {len(t)} columns")

    print("\n" + "━" * 60)


if __name__ == "__main__":
    raw   = extract_all()
    clean = clean_all(raw)
    dd    = generate_data_dictionary(clean)
    print_dictionary_report(dd)