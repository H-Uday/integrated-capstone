# CarIQ — Product & Data Specification
**Phase 1 | Day 2 | Status: LOCKED**

---

## 1. Analytical Business Questions

| ID | Question | Primary Tables |
|----|----------|----------------|
| Q1 | What % of customers were matched within EMI budget, and which price segments have highest rejection rate? | customers, leads, transactions |
| Q2 | Which brands dominate by Indian state, and how does this compare to global trends? | vehicles, transactions, global_sales.csv |
| Q3 | What is average time-to-close per segment, and which months show peak buying? | leads, transactions |
| Q4 | How are customers distributed across income and credit score bands? | customers, transactions |
| Q5 | How does ±10% vehicle price change affect the eligible buyer pool? | customers, vehicles |

---

## 2. Database Schema (SQLite — Development)

### Table: customers
| Column | Type | Constraints |
|--------|------|-------------|
| customer_id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| full_name | TEXT | NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| phone | TEXT | — |
| city | TEXT | NOT NULL |
| state | TEXT | NOT NULL |
| annual_income | REAL | NOT NULL, CHECK > 0 |
| credit_score | INTEGER | NOT NULL, CHECK 300–900 |
| employment_type | TEXT | NOT NULL, CHECK IN (Salaried, Self-Employed, Business, Retired) |
| created_at | TEXT | DEFAULT datetime('now') |

> monthly_income is DERIVED in Python as annual_income / 12. Not stored.

### Table: vehicles
| Column | Type | Constraints |
|--------|------|-------------|
| vehicle_id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| make | TEXT | NOT NULL |
| model | TEXT | NOT NULL |
| variant | TEXT | — |
| year | INTEGER | NOT NULL, CHECK 2015–2026 |
| price_inr | REAL | NOT NULL, CHECK > 0 |
| segment | TEXT | NOT NULL, CHECK IN (Hatchback, Sedan, SUV, Luxury, EV, MUV) |
| fuel_type | TEXT | NOT NULL, CHECK IN (Petrol, Diesel, Electric, Hybrid, CNG) |
| country_origin | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT datetime('now') |

### Table: leads
| Column | Type | Constraints |
|--------|------|-------------|
| lead_id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| customer_id | INTEGER | NOT NULL, FK → customers |
| vehicle_id | INTEGER | NOT NULL, FK → vehicles |
| enquiry_date | TEXT | NOT NULL |
| status | TEXT | NOT NULL, CHECK IN (New, In-Progress, Converted, Rejected, On-Hold) |
| dealer_name | TEXT | — |
| state | TEXT | NOT NULL |
| notes | TEXT | — |
| created_at | TEXT | DEFAULT datetime('now') |

### Table: transactions
| Column | Type | Constraints |
|--------|------|-------------|
| transaction_id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| lead_id | INTEGER | NOT NULL, FK → leads |
| customer_id | INTEGER | NOT NULL, FK → customers |
| vehicle_id | INTEGER | NOT NULL, FK → vehicles |
| transaction_date | TEXT | NOT NULL |
| final_price_inr | REAL | NOT NULL, CHECK > 0 |
| loan_amount | REAL | CHECK >= 0 |
| loan_tenure_months | INTEGER | CHECK IN (12,24,36,48,60,72,84) |
| interest_rate | REAL | CHECK 6.0–20.0 |
| emi_amount | REAL | STORED — computed once at transaction time |
| payment_mode | TEXT | CHECK IN (Full Cash, Loan, Lease) |
| created_at | TEXT | DEFAULT datetime('now') |

> EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
> Where P = loan_amount, r = interest_rate/12/100, n = loan_tenure_months

---

## 3. Global Sales Data Strategy
- Source: CSV file at analytics/data/global_sales.csv
- Loaded exclusively in the Python analytics pipeline
- Never inserted into the operational SQLite database
- Columns (planned): country, brand, units_sold, year, segment

---

## 4. Architecture Decisions Log
| Decision | Choice | Rationale |
|----------|--------|-----------|
| monthly_income storage | Derive in Python | Avoids redundancy and update anomalies |
| emi_amount storage | Store in DB | Read-heavy dashboard queries need speed |
| global_sales storage | CSV only | Historical reference data, not operational |

---

## 5. API Endpoints (To Be Detailed in Phase 2)
- POST /api/customers
- GET  /api/customers/:id
- POST /api/vehicles
- GET  /api/vehicles
- POST /api/leads
- GET  /api/leads/:customerId
- POST /api/transactions
- GET  /api/transactions/:leadId

---
*Spec locked by: Uday183020 | Date: Day 2*
