# 🚗 CarIQ — Global & India Car Sales + Affordability Intelligence

> A production-grade full-stack data analytics capstone system built in 15 days.
> Tracks automotive transactions across 7 countries and matches buyers to vehicles
> they can realistically afford based on income, credit score, and EMI capacity.

---

## 📊 Project at a Glance

| Metric                        | Value                                                     |
| ----------------------------- | --------------------------------------------------------- |
| Customers                     | 170 (150 India + 20 International)                        |
| Vehicles                      | 26 (Maruti Alto ₹3.5L → Bugatti Chiron $3.2M)             |
| Leads                         | 300 across 7 countries                                    |
| Transactions                  | 94 with EMI computation                                   |
| Loan Affordability Rate       | 55%                                                       |
| Countries                     | India, USA, UK, UAE, Germany, Japan, Australia, Singapore |
| Analytical Questions Answered | 5                                                         |
| Git Commits                   | 14 clean commits                                          |

---

## 🏗️ System Architecture

```
integrated-capstone/
├── app/                          # Node.js + Express operational web application
│   ├── src/
│   │   ├── config/database.js    # SQLite connection, WAL mode, FK enforcement
│   │   ├── controllers/          # Business logic — customers, vehicles, leads,
│   │   │                         # transactions, auth
│   │   ├── middleware/           # Input validation + JWT auth middleware
│   │   ├── routes/               # Express routers — 8 REST endpoints
│   │   └── utils/emiCalculator.js# EMI formula (isolated, testable)
│   ├── public/                   # Frontend — HTML, CSS, JS
│   │   ├── index.html            # Landing page with project overview
│   │   ├── customers.html        # Customer registration form
│   │   ├── leads.html            # Vehicle enquiry + car image preview
│   │   ├── transactions.html     # Transaction recording + EMI calculator
│   │   ├── dashboard.html        # Live operational metrics
│   │   ├── login.html            # Auth with 5-attempt lockout
│   │   └── register.html         # Account creation
│   └── package.json
├── analytics/                    # Python data pipeline + dashboards
│   ├── src/
│   │   ├── extract.py            # SQLite → pandas DataFrames
│   │   ├── clean.py              # Type coercion, null handling, derived columns
│   │   ├── pipeline.py           # Single-command orchestrator
│   │   └── data_dictionary.py    # Programmatic column profiling
│   ├── notebooks/                # 5 EDA Jupyter notebooks (Q1–Q5)
│   ├── dashboard.py              # Streamlit analytics dashboard
│   └── requirements.txt
├── docs/
│   ├── SPECIFICATION.md          # Locked data spec + schema DDL
│   ├── SECURITY_AUDIT.md         # Phase 6 security audit report
│   └── INSIGHTS_REPORT.md        # Business findings (non-technical)
└── README.md
```

**Dual-codebase rule:** `/app` (Node.js) and `/analytics` (Python) communicate
exclusively through the SQLite database. No cross-imports. No shared runtime.

---

## ⚙️ Technology Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Backend         | Node.js v24 + Express.js                      |
| Database        | SQLite (WAL mode, FK enforcement, Schema v2)  |
| Auth            | bcryptjs + JWT (8h expiry, 5-attempt lockout) |
| Frontend        | Vanilla HTML5 + CSS3 + JavaScript (ES2022)    |
| Analytics       | Python 3.13 + pandas + numpy                  |
| Visualization   | Plotly + Streamlit                            |
| EDA             | Jupyter Notebooks                             |
| Version Control | Git + GitHub (14 commits)                     |
| Exchange Rates  | FEDAI locked (₹93.5 = $1)                     |

---

## 🚀 Setup & Run

### Prerequisites

- Node.js v18+ and npm
- Python 3.10+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/H-Uday/integrated-capstone
cd integrated-capstone
```

### 2. Setup the App (Node.js)

```bash
cd app
npm install
```

Create `.env` file:

```
PORT=3000
NODE_ENV=development
DB_PATH=./cariq.sqlite
JWT_SECRET=cariq_jwt_secret_2026_secure
```

Seed the database:

```bash
node src/seed.js
```

Start the server:

```bash
npm run dev
```

App runs at: `http://localhost:3000`

### 3. Setup Analytics (Python)

```bash
cd ../analytics
python -m venv .venv

# Windows
source .venv/Scripts/activate

# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Run the pipeline:

```bash
python src/pipeline.py
```

Launch Streamlit dashboard:

```bash
streamlit run dashboard.py
```

Dashboard runs at: `http://localhost:8501`

### 4. Launch Jupyter Notebooks

```bash
jupyter notebook
```

Open `notebooks/` — 5 notebooks covering Q1–Q5.

---

## 🌐 API Reference

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`        | Create user account                |
| POST   | `/api/auth/login`           | Login with 5-attempt lockout       |
| POST   | `/api/customers`            | Register a customer                |
| GET    | `/api/customers/:id`        | Get customer by ID                 |
| POST   | `/api/vehicles`             | Add a vehicle                      |
| GET    | `/api/vehicles`             | List vehicles (with filters)       |
| POST   | `/api/leads`                | Log a vehicle enquiry              |
| GET    | `/api/leads/:customerId`    | Get leads for a customer           |
| POST   | `/api/transactions`         | Record a transaction + compute EMI |
| GET    | `/api/transactions/:leadId` | Get transaction by lead            |
| GET    | `/health`                   | Server health check                |

### Query Filters — `GET /api/vehicles`

```
?segment=SUV
?fuel_type=Electric
?min_price=1000000
?max_price=5000000
```

---

## 📊 Database Schema (Schema v2)

```sql
customers    — 170 rows — financial profiles with USD normalization
vehicles     — 26 rows  — global inventory with multi-currency pricing
leads        — 300 rows — enquiry pipeline with status tracking
transactions — 94 rows  — completed sales with EMI computation
users        — auth     — dealer/analyst/admin accounts with bcrypt hashing
```

**Key design decisions:**

- `monthly_income` derived in Python (never stored) — avoids update anomalies
- `emi_amount` stored at transaction time — read-heavy dashboards benefit
- `price_usd_equivalent` computed at insert using FEDAI locked rates
- `lead_id` nullable in transactions — supports walk-in cash sales

---

## 🔍 5 Analytical Questions & Findings

| Q   | Question           | Key Finding                                                              |
| --- | ------------------ | ------------------------------------------------------------------------ |
| Q1  | Affordability Gap  | 55% loan affordability rate; Ultra/Hypercar segment drives rejection     |
| Q2  | Market Penetration | Maruti leads volume; Mercedes leads revenue; India = 80% of transactions |
| Q3  | Inventory Velocity | Hatchback fastest (14.4 days); Sedan slowest (22 days); Feb+May peak     |
| Q4  | Financial Health   | Credit score correlation −0.279; income is stronger predictor            |
| Q5  | Price Sensitivity  | Near-zero sensitivity; income is binding constraint, not price           |

---

## 🔒 Security Features

- All SQL queries use parameterized statements — zero string interpolation
- Input validation on all POST routes (4 validators)
- JWT authentication with 8-hour expiry
- 5-attempt login lockout with 15-minute cooldown
- `.env` secrets never committed (`.gitignore` enforced)
- No raw error stack traces exposed to clients
- CORS enabled for development

---

## 📁 Key Files

| File                             | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `app/src/config/database.js`     | Schema v2 DDL + WAL mode config                         |
| `app/src/seed.js`                | 500+ row realistic seed with FEDAI FX rates             |
| `app/src/utils/emiCalculator.js` | Isolated EMI formula — verified against bank benchmarks |
| `analytics/src/pipeline.py`      | Single-command data pipeline orchestrator               |
| `analytics/dashboard.py`         | 6-page Streamlit analytics dashboard                    |
| `docs/SPECIFICATION.md`          | Day 2 locked spec — all decisions traced here           |
| `docs/SECURITY_AUDIT.md`         | Phase 6 security audit with findings and fixes          |

---

## 👨‍💻 Author

**H-Uday**
15-Day Engineering Capstone Project
Full-Stack Data Analytics System — CarIQ

---

## 📈 Project Timeline

| Day | Phase         | Deliverable                                        |
| --- | ------------- | -------------------------------------------------- |
| 1   | Setup         | Dual-codebase scaffold, environments               |
| 2   | Specification | Schema DDL, 5 analytical questions locked          |
| 3   | App Dev       | Express server, SQLite, customers API              |
| 4   | App Dev       | Vehicles + leads API with JOIN queries             |
| 5   | App Dev       | Transactions API + EMI + 500-row seed              |
| 6   | Pipeline      | Python extract, clean, export CSVs                 |
| 7   | Pipeline      | Schema v2 global expansion, USD normalization      |
| 8   | EDA           | Q1 Affordability + Q2 Market Penetration           |
| 9   | EDA           | Q3 Velocity + Q4 Financial Health + Q5 Sensitivity |
| 10  | Dashboard     | Streamlit 6-page analytics dashboard               |
| 11  | Frontend      | Express frontend — all pages wired to API          |
| 12  | Security      | Audit report, validation fixes, landing page       |
| 13  | Features      | Login system, transactions UI, car images          |
| 14  | Packaging     | README, insights report                            |
| 15  | Defense       | Live demo + presentation                           |
