<!-- # 🚗 CarIQ — Global & India Car Sales + Affordability Intelligence

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

## 🌐 Live Demo

| Service                   | URL                                               |
| ------------------------- | ------------------------------------------------- |
| **Express API + Web App** | https://cariq-app.onrender.com                    |
| **Streamlit Analytics**   | https://cariq-analytics.streamlit.app             |
| **GitHub Repository**     | https://github.com/Uday183020/integrated-capstone |

### Quick API Test

````bash
curl [https://cariq-app.onrender.com/health](https://cariq-app.onrender.com/health)


## 📱 Progressive Web App (PWA)

CarIQ is installable as a native-like app on any device.

### Install on Mobile
1. Open `https://cariq-app.onrender.com` in Chrome (Android) or Safari (iOS)
2. Tap "Add to Home Screen" when prompted
3. CarIQ installs like a native app with offline support

### PWA Features
- ✅ Offline access to all cached pages
- ✅ Install to home screen (Android + iOS)
- ✅ Push notification support
- ✅ Background sync for pending data
- ✅ Cache-first strategy for instant loading
- ✅ Mobile responsive on all screen sizes (320px–2560px)

### Test PWA Status
Visit `/pwa-test.html` to verify all PWA features are active.
### Prerequisites

- Node.js v18+ and npm
- Python 3.10+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/H-Uday/integrated-capstone
cd integrated-capstone
````

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
| 15  | Defense       | Live demo + presentation                           | -->

# 🚗 CarIQ — Global & India Car Sales + Affordability Intelligence

> A production-grade full-stack data analytics system built in 25 days.
> Tracks automotive transactions across 7 countries and matches buyers to vehicles
> they can realistically afford based on income, credit score, and EMI capacity.
> Features ML affordability scoring, ARIMA forecasting, real-time WebSocket
> notifications, PostgreSQL migration, PWA, PDF reports, and an AI chatbot
> powered by the Claude API.

---

## 🌐 Live Demo

| Service                   | URL                                               |
| ------------------------- | ------------------------------------------------- |
| **Express API + Web App** | https://cariq-app.onrender.com                    |
| **Streamlit Analytics**   | https://cariq-analytics.streamlit.app             |
| **GitHub Repository**     | https://github.com/Uday183020/integrated-capstone |

### Quick API Test

```bash
curl https://cariq-app.onrender.com/health
```

---

## 📊 Project at a Glance

| Metric                        | Value                                                     |
| ----------------------------- | --------------------------------------------------------- |
| Customers                     | 171 (150 India + 21 International)                        |
| Vehicles                      | 26 (Maruti Alto ₹3.5L → Bugatti Chiron $3.2M)             |
| Leads                         | 302 across 7 countries                                    |
| Transactions                  | 91 with EMI computation                                   |
| Loan Affordability Rate       | 55%                                                       |
| Countries                     | India, USA, UK, UAE, Germany, Japan, Australia, Singapore |
| Analytical Questions Answered | 8 (Q1–Q8)                                                 |
| Git Commits                   | 28+ clean commits                                         |
| REST API Endpoints            | 15+                                                       |
| Frontend Pages                | 8 HTML pages                                              |
| EDA Notebooks                 | 8 Jupyter notebooks                                       |
| Streamlit Pages               | 9 interactive pages                                       |
| ML Models                     | XGBoost affordability classifier                          |
| Forecasting                   | ARIMA 3-month sales forecast                              |

---

## 🏗️ System Architecture

```
integrated-capstone/
├── app/                              # Node.js + Express operational web application
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js           # SQLite connection, WAL mode, FK enforcement
│   │   │   ├── database.pg.js        # PostgreSQL connection + connection pooling
│   │   │   ├── migrate_to_pg.js      # SQLite → PostgreSQL migration script
│   │   │   ├── db.js                 # Unified DB adapter (sqlite/postgres switch)
│   │   │   └── production.js         # Production readiness checker
│   │   ├── controllers/              # Business logic
│   │   │   ├── customersController.js
│   │   │   ├── vehiclesController.js
│   │   │   ├── leadsController.js
│   │   │   ├── transactionsController.js
│   │   │   ├── authController.js
│   │   │   ├── adminController.js    # Day 21 — user management
│   │   │   ├── alertsController.js   # Day 17 — stale lead detection
│   │   │   ├── reportsController.js  # Day 23 — PDF generation
│   │   │   └── chatbotController.js  # Day 25 — Claude AI chatbot
│   │   ├── middleware/
│   │   │   ├── validate.js           # Input validation
│   │   │   └── authMiddleware.js     # JWT auth + requireRole()
│   │   ├── routes/                   # Express routers
│   │   ├── alerts/                   # Day 17 — dealer alert system
│   │   │   ├── staleLeadDetector.js
│   │   │   ├── emailService.js
│   │   │   └── alertScheduler.js
│   │   ├── reports/                  # Day 23 — PDF report engine
│   │   │   ├── pdfGenerator.js
│   │   │   └── reportData.js
│   │   ├── utils/
│   │   │   ├── emiCalculator.js      # EMI formula (isolated, testable)
│   │   │   └── wsTest.js             # WebSocket test utility
│   │   ├── seed.js                   # 500+ row realistic seed script
│   │   └── index.js                  # Express + Socket.io server
│   ├── public/                       # Frontend — HTML, CSS, JS
│   │   ├── home.html                 # Auth-gated landing (guest vs member)
│   │   ├── customers.html            # Customer registration form
│   │   ├── leads.html                # Vehicle enquiry + car image preview
│   │   ├── transactions.html         # Transaction recording + EMI calculator
│   │   ├── dashboard.html            # Live metrics + WebSocket feed
│   │   ├── login.html                # Auth with 5-attempt lockout
│   │   ├── register.html             # Account creation
│   │   ├── admin.html                # Day 21 — admin control panel
│   │   ├── dealer.html               # Day 21 — dealer workspace
│   │   ├── analyst.html              # Day 21 — analyst hub
│   │   ├── reports.html              # Day 23 — PDF download page
│   │   ├── chatbot.html              # Day 25 — AI chatbot full-screen
│   │   ├── offline.html              # Day 24 — PWA offline page
│   │   ├── pwa-test.html             # Day 24 — PWA status checker
│   │   ├── style.css                 # Dark theme + mobile responsive
│   │   ├── app.js                    # Client-side API calls
│   │   ├── socket-client.js          # Day 22 — WebSocket client
│   │   ├── pwa.js                    # Day 24 — Service worker registration
│   │   ├── chat-fab.js               # Day 25 — Floating AI chat button
│   │   ├── service-worker.js         # Day 24 — Cache-first PWA strategy
│   │   └── manifest.json             # Day 24 — PWA manifest
│   └── package.json
├── analytics/                        # Python data pipeline + dashboards
│   ├── src/
│   │   ├── extract.py                # SQLite → pandas DataFrames
│   │   ├── clean.py                  # Type coercion, null handling, derived columns
│   │   ├── pipeline.py               # Single-command orchestrator
│   │   ├── data_dictionary.py        # Programmatic column profiling
│   │   ├── forecasting.py            # Day 19 — ARIMA sales forecasting
│   │   ├── clv.py                    # Day 19 — Customer Lifetime Value analysis
│   │   ├── chart_generator.py        # Day 23 — matplotlib analytics PDF
│   │   └── ml/                       # Day 16 — XGBoost ML pipeline
│   │       ├── train.py
│   │       ├── predict.py
│   │       └── evaluate.py
│   ├── notebooks/                    # 8 EDA Jupyter notebooks
│   │   ├── 01_affordability_gap.ipynb
│   │   ├── 02_market_penetration.ipynb
│   │   ├── 03_inventory_velocity.ipynb
│   │   ├── 04_customer_financial_health.ipynb
│   │   ├── 05_price_sensitivity.ipynb
│   │   ├── 06_ml_affordability_model.ipynb
│   │   ├── 07_sales_forecasting.ipynb
│   │   └── 08_customer_lifetime_value.ipynb
│   ├── dashboard.py                  # 9-page Streamlit analytics dashboard
│   ├── .streamlit/config.toml        # Streamlit dark theme config
│   └── requirements.txt
├── docs/
│   ├── SPECIFICATION.md              # Locked data spec + schema DDL
│   ├── SECURITY_AUDIT.md             # Phase 6 security audit report
│   ├── INSIGHTS_REPORT.md            # Business findings (non-technical)
│   └── MIGRATION_GUIDE.md            # Day 18 — SQLite → PostgreSQL guide
├── Procfile                          # Railway deployment config
├── railway.json                      # Railway build config
├── render.yaml                       # Render deployment config
└── README.md
```

**Dual-codebase rule:** `/app` (Node.js) and `/analytics` (Python) communicate
exclusively through the SQLite database. No cross-imports. No shared runtime.

---

## ⚙️ Technology Stack

| Layer            | Technology                                                             |
| ---------------- | ---------------------------------------------------------------------- |
| Backend          | Node.js v24 + Express.js                                               |
| Database         | SQLite (WAL mode, FK enforcement, Schema v2) + PostgreSQL (production) |
| Auth             | bcryptjs + JWT (8h expiry, 5-attempt lockout)                          |
| Authorization    | Role-based access control — Admin / Dealer / Analyst                   |
| Frontend         | Vanilla HTML5 + CSS3 + JavaScript (ES2022)                             |
| Real-Time        | Socket.io WebSocket — live lead and transaction notifications          |
| Analytics        | Python 3.13 + pandas + numpy                                           |
| Visualization    | Plotly + Streamlit (9 pages)                                           |
| Machine Learning | XGBoost (affordability classifier)                                     |
| Forecasting      | ARIMA via pmdarima (3-month sales forecast)                            |
| CLV Analysis     | Customer Lifetime Value segmentation                                   |
| EDA              | Jupyter Notebooks (8 notebooks, Q1–Q8)                                 |
| PDF Reports      | PDFKit (Node.js) + matplotlib PdfPages (Python)                        |
| Alerts           | nodemailer + node-cron (stale lead detection)                          |
| AI Chatbot       | Anthropic Claude API (claude-sonnet-4-6)                               |
| PWA              | Service Worker (Cache-First + Network-First), Web App Manifest         |
| Version Control  | Git + GitHub (28+ commits)                                             |
| Deployment       | Render (Express API) + Streamlit Cloud (analytics)                     |
| Exchange Rates   | FEDAI locked (INR=0.0107, ₹93.5 = $1)                                  |

---

## 🚀 Setup & Run

### Prerequisites

- Node.js v18+ and npm
- Python 3.10+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Uday183020/integrated-capstone
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
DB_MODE=sqlite
ALERT_ENABLED=false
ANTHROPIC_API_KEY=your_claude_api_key_here
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

Open `notebooks/` — 8 notebooks covering Q1–Q8.

### 5. Train ML Model (Day 16)

```bash
cd analytics
python src/ml/train.py
```

### 6. Generate Analytics PDF (Day 23)

```bash
python src/chart_generator.py
```

---

## 📱 Progressive Web App (PWA)

CarIQ is installable as a native-like app on any device.

### Install on Mobile

1. Open `https://cariq-app.onrender.com` in Chrome (Android) or Safari (iOS)
2. Tap "Add to Home Screen" when prompted
3. CarIQ installs like a native app with offline support

### PWA Features

- ✅ Offline access to all cached pages
- ✅ Install to home screen (Android + iOS)
- ✅ Push notification support
- ✅ Background sync for pending data
- ✅ Cache-first strategy for instant loading
- ✅ Mobile responsive on all screen sizes (320px–2560px)

### Test PWA Status

Visit `/pwa-test.html` to verify all PWA features are active.

---

## 🤖 AI Chatbot

CarIQ includes a full-screen AI chatbot powered by the Claude API.

### Features

- Answers EMI calculation questions with live formula
- Checks affordability for any customer + vehicle combination
- Explains CarIQ analytical findings (Q1–Q8)
- Recommends vehicles based on budget and segment preference
- Uses live database context — knows actual customer and vehicle counts
- Animated full-screen experience with racing cars, starfield, and neon effects

### Access

- Full screen: `http://localhost:3000/chatbot.html`
- Floating button: Available on every CarIQ page (bottom-right 🤖 button)

### Configure

Add to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

---

## 🌐 API Reference

| Method | Endpoint                    | Description                                 |
| ------ | --------------------------- | ------------------------------------------- |
| POST   | `/api/auth/register`        | Create user account (admin/dealer/analyst)  |
| POST   | `/api/auth/login`           | Login with 5-attempt lockout                |
| GET    | `/api/auth/me`              | Get current user from JWT                   |
| POST   | `/api/customers`            | Register a customer                         |
| GET    | `/api/customers/:id`        | Get customer by ID                          |
| GET    | `/api/customers/count`      | Live customer count                         |
| POST   | `/api/vehicles`             | Add a vehicle                               |
| GET    | `/api/vehicles`             | List vehicles (with filters)                |
| POST   | `/api/leads`                | Log a vehicle enquiry                       |
| GET    | `/api/leads/:customerId`    | Get leads for a customer                    |
| GET    | `/api/leads/count`          | Live lead count                             |
| POST   | `/api/transactions`         | Record a transaction + compute EMI          |
| GET    | `/api/transactions/:leadId` | Get transaction by lead                     |
| GET    | `/api/admin/users`          | List all users (admin only)                 |
| PATCH  | `/api/admin/users/:id/role` | Update user role (admin only)               |
| DELETE | `/api/admin/users/:id`      | Delete user (admin only)                    |
| GET    | `/api/admin/stats`          | System-wide statistics (admin only)         |
| GET    | `/api/alerts/stalled`       | Get stalled leads with benchmark comparison |
| GET    | `/api/alerts/status`        | Alert scheduler status                      |
| GET    | `/api/alerts/benchmarks`    | Segment close-time benchmarks from Q3 EDA   |
| POST   | `/api/alerts/trigger`       | Manually trigger alert check                |
| GET    | `/api/reports/monthly`      | Download branded PDF report                 |
| GET    | `/api/reports/preview`      | Preview report data as JSON                 |
| GET    | `/api/reports/quick-stats`  | Quick system stats                          |
| POST   | `/api/chatbot/chat`         | Send message to Claude AI                   |
| GET    | `/api/chatbot/suggestions`  | Get suggested questions                     |
| GET    | `/health`                   | Server health check with WebSocket status   |

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
customers    — 171 rows — financial profiles with USD normalization
vehicles     — 26 rows  — global inventory with multi-currency pricing
leads        — 302 rows — enquiry pipeline with status tracking
transactions — 91 rows  — completed sales with EMI computation
users        — auth     — dealer/analyst/admin accounts with bcrypt hashing
```

**Key design decisions:**

- `monthly_income` derived in Python (never stored) — avoids update anomalies
- `emi_amount` stored at transaction time — read-heavy dashboards benefit
- `price_usd_equivalent` computed at insert using FEDAI locked rates
- `lead_id` nullable in transactions — supports walk-in cash sales
- `global_sales` stored as CSV only — never in operational database

---

## 🔍 8 Analytical Questions & Findings

| Q   | Question           | Key Finding                                                                        |
| --- | ------------------ | ---------------------------------------------------------------------------------- |
| Q1  | Affordability Gap  | 55% loan affordability rate; Ultra/Hypercar drives rejection; median EMI ratio 30% |
| Q2  | Market Penetration | Maruti leads volume; Mercedes leads revenue ($76K avg); India = 80%                |
| Q3  | Inventory Velocity | Hatchback fastest (14.4 days); Sedan slowest (22 days); Feb+May peak               |
| Q4  | Financial Health   | Credit score correlation −0.279 (WEAK); income is stronger predictor               |
| Q5  | Price Sensitivity  | Near-zero sensitivity; ±10% price = 1 buyer change; income is binding constraint   |
| Q6  | ML Affordability   | XGBoost probability score (0–1) replaces binary 40% rule                           |
| Q7  | Sales Forecast     | ARIMA 3-month forecast with 80% confidence intervals                               |
| Q8  | Customer CLV       | Business owners show highest avg CLV; Pareto distribution                          |

**Most important insight:** A 10% price cut gains 1 buyer. Extending loan tenure to 84 months gains 8–10 buyers. Tenure extension is more effective than price reduction.

---

## 🏦 PostgreSQL Migration (Day 18)

CarIQ supports both SQLite (development) and PostgreSQL (production).

### Switch to PostgreSQL

```bash
# 1. Create database
psql -U postgres -p 5433
CREATE DATABASE cariq_db;
CREATE USER cariq_user WITH PASSWORD 'cariq2026';
GRANT ALL PRIVILEGES ON DATABASE cariq_db TO cariq_user;
\q

# 2. Run migration
cd app
node src/config/migrate_to_pg.js

# 3. Update .env
DB_MODE=postgres
PG_HOST=localhost
PG_PORT=5433
PG_DATABASE=cariq_db
PG_USER=cariq_user
PG_PASSWORD=cariq2026

# 4. Verify
npm run prod:check
```

### Performance Indexes Created

| Index                 | Table        | Column            |
| --------------------- | ------------ | ----------------- |
| idx_leads_customer    | leads        | customer_id       |
| idx_leads_status      | leads        | status            |
| idx_leads_enquiry     | leads        | enquiry_date      |
| idx_transactions_lead | transactions | lead_id           |
| idx_transactions_cust | transactions | customer_id       |
| idx_customers_country | customers    | country           |
| idx_customers_income  | customers    | annual_income_usd |
| idx_vehicles_segment  | vehicles     | segment           |

See `docs/MIGRATION_GUIDE.md` for full instructions.

---

## 👥 Role-Based Access Control (Day 21)

| Role        | Access                                                             | Page           |
| ----------- | ------------------------------------------------------------------ | -------------- |
| **Admin**   | Full system access — user management, all data, all stats          | `admin.html`   |
| **Dealer**  | Operational pages — customers, leads, transactions, EMI calculator | `dealer.html`  |
| **Analyst** | Read-only analytics — dashboard, notebooks, 8 findings summary     | `analyst.html` |

Register with role:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dealer1","email":"dealer@cariq.com","password":"dealer123","role":"dealer"}'
```

---

## ⚡ Real-Time WebSocket Events (Day 22)

Socket.io emits live events to all connected clients:

| Event          | Trigger              | Payload                                  |
| -------------- | -------------------- | ---------------------------------------- |
| `new_customer` | Customer registered  | customer_id, city, state                 |
| `new_lead`     | Lead created         | lead_id, status, dealer_name             |
| `sale_closed`  | Transaction recorded | transaction_id, payment_mode, emi_amount |

The dashboard live feed updates automatically without page refresh.

---

## 🚨 Dealer Alert System (Day 17)

Stale lead detection runs on startup and every hour via node-cron.

### Segment Benchmarks (from Q3 EDA)

| Segment   | Avg Close Time | Alert Threshold |
| --------- | -------------- | --------------- |
| Hatchback | 14.4 days      | 22 days         |
| Sedan     | 22.0 days      | 33 days         |
| SUV       | 15.3 days      | 23 days         |
| MUV       | 16.9 days      | 25 days         |
| EV        | 16.4 days      | 25 days         |
| Luxury    | 15.6 days      | 23 days         |
| Hypercar  | 17.7 days      | 27 days         |

Set `ALERT_ENABLED=true` in `.env` and configure Gmail credentials to send real emails. Runs in LOG-ONLY mode by default.

---

## 📄 PDF Reports (Day 23)

### Monthly Performance Report (Node.js + PDFKit)

5-page branded PDF:

1. Cover page with KPI metrics
2. Executive summary
3. Segment & payment analysis
4. Transaction detail table
5. Stalled leads requiring action

Download:

```bash
curl "http://localhost:3000/api/reports/monthly?year=2026&month=7" \
  --output CarIQ_Report.pdf
```

### Analytics Charts PDF (Python + matplotlib)

6-page visual report with all 5 EDA charts:

```bash
cd analytics && python src/chart_generator.py
```

---

## 🔒 Security Features

- All SQL queries use parameterized statements — zero string interpolation
- Input validation on all POST routes
- JWT authentication with 8-hour expiry
- 5-attempt login lockout with 15-minute cooldown
- Role-based route protection via `requireRole()` middleware
- `.env` secrets never committed (`.gitignore` enforced)
- No raw error stack traces exposed to clients
- CORS restricted to known origins in production
- Security audit score: **47/50 (94%)** — see `docs/SECURITY_AUDIT.md`

---

## 📁 Key Files

| File                                       | Purpose                                        |
| ------------------------------------------ | ---------------------------------------------- |
| `app/src/config/database.js`               | Schema v2 DDL + WAL mode config                |
| `app/src/config/database.pg.js`            | PostgreSQL pool + migrations                   |
| `app/src/config/migrate_to_pg.js`          | Zero-loss SQLite → PostgreSQL migration        |
| `app/src/seed.js`                          | 500+ row realistic seed with FEDAI FX rates    |
| `app/src/utils/emiCalculator.js`           | Isolated EMI formula — bank benchmark verified |
| `app/src/alerts/staleLeadDetector.js`      | Q3 EDA benchmarks applied to live leads        |
| `app/src/reports/pdfGenerator.js`          | 5-page branded PDF with PDFKit                 |
| `app/src/controllers/chatbotController.js` | Claude API + live DB context injection         |
| `app/public/chatbot.html`                  | Mind-blowing full-screen AI chat experience    |
| `app/public/service-worker.js`             | Cache-First + Network-First PWA strategy       |
| `analytics/src/pipeline.py`                | Single-command data pipeline orchestrator      |
| `analytics/src/ml/train.py`                | XGBoost affordability classifier training      |
| `analytics/src/forecasting.py`             | ARIMA sales forecasting with pmdarima          |
| `analytics/src/clv.py`                     | Customer Lifetime Value analysis               |
| `analytics/dashboard.py`                   | 9-page Streamlit analytics dashboard           |
| `docs/SPECIFICATION.md`                    | Day 2 locked spec — all decisions traced here  |
| `docs/SECURITY_AUDIT.md`                   | Security audit with findings and fixes         |
| `docs/MIGRATION_GUIDE.md`                  | SQLite → PostgreSQL step-by-step guide         |

---

## 📈 Complete Project Timeline

| Day | Phase         | Deliverable                                                                  |
| --- | ------------- | ---------------------------------------------------------------------------- |
| 1   | Setup         | Dual-codebase scaffold, environments, .gitignore                             |
| 2   | Specification | Schema DDL, 5 analytical questions locked, SPECIFICATION.md                  |
| 3   | App Dev       | Express server, SQLite, customers API with validation                        |
| 4   | App Dev       | Vehicles + leads API with JOIN queries and filtering                         |
| 5   | App Dev       | Transactions API + EMI formula + 500-row seed script                         |
| 6   | Pipeline      | Python extract, clean, export CSVs, data dictionary                          |
| 7   | Pipeline      | Schema v2 global expansion, USD normalization, 7 countries                   |
| 8   | EDA           | Q1 Affordability Gap + Q2 Market Penetration notebooks                       |
| 9   | EDA           | Q3 Velocity + Q4 Financial Health + Q5 Sensitivity notebooks                 |
| 10  | Dashboard     | Streamlit 6-page analytics dashboard                                         |
| 11  | Frontend      | Express frontend — all pages wired to REST API                               |
| 12  | Security      | Audit report, validation fixes, Luxury/Hypercar enum fix                     |
| 13  | Features      | Login system, 5-attempt lockout, transactions UI, car images                 |
| 14  | Packaging     | Production README, business insights report (5 findings)                     |
| 15  | Defense       | Live dashboard counts, auth-gated home page, live demo                       |
| 16  | **Bonus**     | XGBoost ML affordability model, live predictor, Q6 notebook                  |
| 17  | **Bonus**     | Dealer alert system — stale lead detection, email service, cron scheduler    |
| 18  | **Bonus**     | PostgreSQL migration — 171 customers, 302 leads, 8 performance indexes       |
| 19  | **Bonus**     | ARIMA sales forecasting Q7, Customer Lifetime Value Q8, 2 new notebooks      |
| 20  | **Bonus**     | Cloud deployment — Render (Express API) + Streamlit Cloud (dashboard)        |
| 21  | **Bonus**     | Role-based UI — Admin panel, Dealer workspace, Analyst hub, requireRole()    |
| 22  | **Bonus**     | Socket.io WebSocket — live feed, real-time notifications on all pages        |
| 23  | **Bonus**     | PDF report generation — PDFKit monthly report + matplotlib analytics PDF     |
| 24  | **Bonus**     | Progressive Web App — service worker, offline support, mobile responsive CSS |
| 25  | **Bonus**     | CarIQ AI Chatbot — Claude API, mind-blowing full-screen UI, FAB on all pages |

---

## 🎯 Resume Line

```
Built CarIQ — a 25-day full-stack automotive analytics system:
Node.js REST API (15+ endpoints), Python EDA pipeline (8 analytical questions),
9-page Streamlit dashboard, XGBoost ML model, ARIMA forecasting, JWT auth,
PostgreSQL migration, WebSocket real-time notifications, PWA with offline support,
PDF report generation, AI chatbot (Claude API). Live: cariq-app.onrender.com
```

---

## 👨‍💻 Author

**H-Uday**
25-Day Full-Stack Data Analytics Capstone Project
CarIQ — Global & India Car Sales + Affordability Intelligence

**Live:** https://cariq-app.onrender.com
**Analytics:** https://cariq-analytics.streamlit.app
**GitHub:** https://github.com/H-Uday/integrated-capstone
