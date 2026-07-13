# CarIQ — Business Insights Report
**Prepared by:** H-Uday
**Project:** Global & India Car Sales + Affordability Intelligence
**Date:** Day 14 of 15-Day Engineering Capstone

---

## Executive Summary

CarIQ analysed 94 completed automotive transactions across 7 countries,
170 customer profiles, and 26 vehicles ranging from the Maruti Alto (₹3.5L)
to the Bugatti Chiron ($3.2M). The system answers 5 critical business
questions that inform pricing strategy, market targeting, dealer operations,
and lending policy.

**The single most important finding:** Income level is the binding constraint
on car affordability — not credit score, and not vehicle price.
A ±10% price change moves the eligible buyer pool by at most 1 customer.
Extending loan tenure from 60 to 84 months is a more effective lever
than price reduction.

---

## Q1 — Affordability Gap Analysis

**Question:** What % of customers were matched within their EMI budget?

### Finding
- **55% of loan transactions** fall within the RBI standard 40%
  EMI-to-income threshold
- **45% of buyers are stretching** beyond the safe lending boundary
- The **Ultra ($150K+) segment** drives the highest rejection rate —
  Hypercar buyers require a separate high-net-worth lending model
- **Median EMI/income ratio is 30%** — the core mid-market customer
  base is being matched appropriately

### Business Recommendation
CarIQ should implement a **pre-emptive 35% threshold flag** — alerting
dealers when a customer's projected EMI exceeds 35% of monthly income,
before the formal 40% rejection threshold is hit. This reduces pipeline
waste and improves conversion rates.

Hypercar segment (5 vehicles, $245K–$3.2M) should be **excluded from
standard affordability scoring** and routed to a dedicated high-net-worth
relationship model.

---

## Q2 — Market Penetration by Region & Brand

**Question:** Which brands dominate by region, and how does India compare globally?

### Finding
- **Maruti Suzuki leads by volume** — 20 transactions, confirming
  dominant domestic market penetration
- **Mercedes-Benz leads by revenue** — $76,793 average ticket size
  vs Maruti's $9,924 — luxury brands punch above their weight in revenue
- **India accounts for 80% of all transactions** (75/94) across
  10 states
- **Germany generates the highest international revenue** — $3.34M
  from 5 transactions, driven by Hypercar pricing
- **Maharashtra, Karnataka, and Telangana** lead India state-level
  penetration — consistent with India's automotive consumption geography

### Business Recommendation
CarIQ should build **separate lead-scoring models** for:
1. India domestic — volume-driven, budget/mid segment focus
2. International high-net-worth — revenue-driven, Luxury/Hypercar focus

A **market-specific vehicle inventory layer** is needed — international
customers should see regionally available vehicles, not Indian market cars.

---

## Q3 — Inventory Velocity & Transaction Timing

**Question:** What is the average time-to-close per segment, and which months peak?

### Finding
- **Hatchback closes fastest** at 14.4 days average — simple financing,
  high buyer intent, low negotiation complexity
- **Sedan closes slowest** at 22.0 days — longer comparison cycles,
  more feature negotiation
- **Hypercar closes in 17.7 days** — faster than Sedan despite extreme
  prices, reflecting cash-heavy buyers with no financing complexity
- **February and May are peak months** — each recording 10 transactions,
  suggesting pre-summer and post-budget buying cycles
- **September is the quietest month** with only 4 transactions

### Business Recommendation
Dealers should **auto-escalate stalled leads** based on segment benchmarks:
- Sedan leads open beyond **33 days** (1.5× avg) → dealer follow-up alert
- SUV leads open beyond **23 days** → dealer follow-up alert
- Hatchback leads open beyond **22 days** → dealer follow-up alert

Marketing campaigns should be concentrated in **January–February** and
**April–May** to capture peak buying intent cycles.

---

## Q4 — Customer Financial Health Distribution

**Question:** Does credit score predict EMI affordability?

### Finding
- **Credit score is a weak predictor** — correlation of −0.279 between
  credit score and affordability ratio
- **Income is the stronger predictor** — the $60–120K USD annual income
  band achieves 85.7% affordability vs 15.4% for the under $10K band
- **Average credit score is 742** (Good band) — customer base is
  generally creditworthy
- **$300K+ income paradox** — ultra-high income customers show lower
  affordability due to Hypercar purchases inflating EMI ratios

### Business Recommendation
CarIQ's affordability scoring model should weight factors as:
- **Monthly income: 60%** — primary driver of EMI sustainability
- **Credit score: 40%** — secondary risk indicator

The **$60–120K USD annual income band** is the optimal target segment
for loan product marketing — highest affordability rate at 85.7%.

---

## Q5 — Price vs Affordability Sensitivity

**Question:** How does a ±10% price change affect the eligible buyer pool?

### Finding
- **Near-zero price sensitivity** — a ±10% price change moves the
  eligible buyer pool by at most 1 customer (33 → 34 at −10%)
- **Every segment shows identical eligibility** across all three
  scenarios except Hatchback (+1 buyer at −10%)
- **The binding constraint is income, not price** — customers are
  either comfortably within the 40% threshold or far beyond it
- A 10% reduction on a $3.2M Bugatti ($320K saving) is still
  insufficient to bring any customer's EMI within the threshold

### Business Recommendation
**Price reduction is the wrong lever** for CarIQ's affordability problem.
More effective interventions ranked by impact:

1. **Extend loan tenure** from 60 to 84 months — reduces monthly EMI
   by ~15–20% without changing vehicle price
2. **Target the $60–120K income segment** — already at 85.7% affordability
3. **Increase down-payment requirements** for Ultra segment — reduces
   loan principal and EMI proportionally
4. **Price promotions** — only effective for customers already near the
   40% boundary, estimated at fewer than 5 customers in current dataset

---

## Overall Strategic Recommendations

| Priority | Recommendation | Impact |
|---|---|---|
| 1 | Implement 35% pre-emptive EMI flag in lead scoring | Reduces pipeline waste |
| 2 | Build separate HNW lending model for Hypercar/Luxury | Unlocks $150K+ segment |
| 3 | Weight income 60% vs credit score 40% in affordability model | More accurate approvals |
| 4 | Auto-escalate stalled leads beyond segment benchmarks | Improves conversion rate |
| 5 | Concentrate marketing in Feb + May peak months | Higher ROI on campaigns |
| 6 | Extend loan tenure offerings to 84 months | Expands eligible buyer pool |
| 7 | Build market-specific vehicle inventory layers | Fixes intl data quality |

---

## Data Limitations & Caveats

- Sample size: 94 transactions, 170 customers — directional insights only
- International sample: 19 transactions — insufficient for statistical models
- Credit scores and income were seeded with realistic distributions but
  are not real customer data
- Exchange rates locked at FEDAI rates as of Day 7 — will drift over time
- Seasonal patterns require 3+ years of data for reliable trend detection

---
*Report generated from CarIQ Analytics Pipeline v2*
*Data extracted: analytics/data/master.csv — 94 rows × 40 columns*
