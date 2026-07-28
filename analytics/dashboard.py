"""
dashboard.py
CarIQ Analytics Dashboard — Streamlit
Single-command launch: streamlit run dashboard.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# ── Page Config ─────────────────────────────────────────────────
st.set_page_config(
    page_title="CarIQ Analytics",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Data Loading ─────────────────────────────────────────────────
DATA_DIR = Path(__file__).resolve().parent / "data"

@st.cache_data
def load_data():
    # On cloud, run pipeline first if CSVs missing
    if not (DATA_DIR / "master.csv").exists():
        st.info("🔄 First run — generating analytics data...")
        import subprocess
        import sys
        pipeline_script = Path(__file__).resolve().parent / "src" / "pipeline.py"
        subprocess.run([sys.executable, str(pipeline_script)], check=True)

    master    = pd.read_csv(DATA_DIR / "master.csv")
    customers = pd.read_csv(DATA_DIR / "customers.csv")
    vehicles  = pd.read_csv(DATA_DIR / "vehicles.csv")
    leads     = pd.read_csv(DATA_DIR / "leads.csv")

    master['transaction_date'] = pd.to_datetime(master['transaction_date'])
    leads['enquiry_date']      = pd.to_datetime(leads['enquiry_date'])

    return master, customers, vehicles, leads

# 🟢 ADD THIS LINE HERE to load the variables into memory!
master, customers, vehicles, leads = load_data()

# Create loans DataFrame for KPI calculations
loans = master[master['payment_mode'] == 'Loan'].copy()
if not loans.empty and 'emi_amount' in loans.columns:
    # 40% monthly income rule check
    monthly_income = (loans['annual_income_usd'] / 12)
    loans['is_affordable'] = (loans['emi_amount'] / 83.0) <= (monthly_income * 0.40)
else:
    loans['is_affordable'] = []

# ── Sidebar ──────────────────────────────────────────────────────
st.sidebar.image(
    "https://img.icons8.com/fluency/96/car.png",
    width=80
)
st.sidebar.title("CarIQ Analytics")
st.sidebar.markdown("**Global & India Car Sales**\n**Affordability Intelligence**")
st.sidebar.divider()

page = st.sidebar.radio(
    "Navigate",
    [
        "📊 Overview",
        "Q1 — Affordability Gap",
        "Q2 — Market Penetration",
        "Q3 — Inventory Velocity",
        "Q4 — Financial Health",
        "Q5 — Price Sensitivity",
        "🤖 ML Affordability Model",
        "📈 Q7 — Sales Forecast",
        "💎 Q8 — Customer CLV",
    ]
)

st.sidebar.divider()
st.sidebar.caption(f"📦 {len(master)} transactions | "
                   f"👥 {len(customers)} customers | "
                   f"🚗 {len(vehicles)} vehicles")

# ── Helper ───────────────────────────────────────────────────────
def metric_row(cols_data):
    cols = st.columns(len(cols_data))
    for col, (label, value, delta) in zip(cols, cols_data):
        col.metric(label, value, delta)

# ... [REST OF YOUR DASHBOARD CODE CONTINUES UNCHANGED] ...

# ════════════════════════════════════════════════════════════════
# PAGE: OVERVIEW
# ════════════════════════════════════════════════════════════════
if page == "📊 Overview":
    st.title("🚗 CarIQ — Analytics Command Center")
    st.markdown("**Global & India Car Sales + Affordability Intelligence**")
    st.divider()

    # KPI Row
    affordable     = int(loans['is_affordable'].sum())
    total_loans    = len(loans)
    afford_rate    = f"{affordable/total_loans*100:.0f}%" if total_loans > 0 else "N/A"
    total_rev_usd  = master['price_usd_equivalent'].sum()
    avg_credit     = customers['credit_score'].mean()
    conversion_rate= f"{len(master)/len(leads)*100:.0f}%"

    metric_row([
        ("Total Transactions",  f"{len(master)}",          "+94 seeded"),
        ("Loan Affordability",  afford_rate,               "EMI ≤ 40% income"),
        ("Total Revenue (USD)", f"${total_rev_usd:,.0f}",  "All segments"),
        ("Lead Conversion",     conversion_rate,           "Leads → Transactions"),
        ("Avg Credit Score",    f"{avg_credit:.0f}",       "Customer base"),
    ])

    st.divider()

    col1, col2 = st.columns(2)

    with col1:
        seg_dist = master['segment'].value_counts().reset_index()
        seg_dist.columns = ['segment', 'count']
        fig = px.pie(
            seg_dist, names='segment', values='count',
            title='Transactions by Vehicle Segment',
            hole=0.4,
            color_discrete_sequence=px.colors.qualitative.Set2
        )
        fig.update_layout(height=350)
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        mode_dist = master['payment_mode'].value_counts().reset_index()
        mode_dist.columns = ['payment_mode', 'count']
        fig2 = px.bar(
            mode_dist, x='payment_mode', y='count',
            color='payment_mode',
            title='Transactions by Payment Mode',
            color_discrete_sequence=px.colors.qualitative.Pastel,
            text='count'
        )
        fig2.update_traces(textposition='outside')
        fig2.update_layout(height=350, showlegend=False)
        st.plotly_chart(fig2, use_container_width=True)

    st.divider()
    col3, col4 = st.columns(2)

    with col3:
        country_dist = master['country'].value_counts().reset_index()
        country_dist.columns = ['country', 'transactions']
        fig3 = px.bar(
            country_dist, x='country', y='transactions',
            color='transactions',
            color_continuous_scale='Blues',
            title='Transactions by Country',
            text='transactions'
        )
        fig3.update_traces(textposition='outside')
        fig3.update_layout(height=350, coloraxis_showscale=False)
        st.plotly_chart(fig3, use_container_width=True)

    with col4:
        emp_dist = customers['employment_type'].value_counts().reset_index()
        emp_dist.columns = ['employment_type', 'count']
        fig4 = px.pie(
            emp_dist, names='employment_type', values='count',
            title='Customer Employment Mix',
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        fig4.update_layout(height=350)
        st.plotly_chart(fig4, use_container_width=True)

# ════════════════════════════════════════════════════════════════
# PAGE: Q1 — AFFORDABILITY GAP
# ════════════════════════════════════════════════════════════════
elif page == "Q1 — Affordability Gap":
    st.title("Q1: Affordability Gap Analysis")
    st.markdown(
        "**Business Question:** What % of customers were matched within "
        "their EMI budget, and which price segments have the highest rejection rate?"
    )
    st.divider()

    affordable  = int(loans['is_affordable'].sum())
    total_loans = len(loans)

    metric_row([
        ("Loan Transactions",    f"{total_loans}",                    ""),
        ("Affordable (≤40%)",    f"{affordable}",                     ""),
        ("Unaffordable (>40%)",  f"{total_loans - affordable}",       ""),
        ("Affordability Rate",   f"{affordable/total_loans*100:.0f}%","EMI ≤ 40% income"),
        ("Median EMI/Income",    f"{loans['affordability_ratio'].median()*100:.0f}%", ""),
    ])

    st.divider()

    seg_aff = loans.groupby('price_segment', observed=True).agg(
        total      = ('is_affordable', 'count'),
        affordable = ('is_affordable', 'sum')
    ).reset_index()
    seg_aff['affordable_pct'] = (
        seg_aff['affordable'] / seg_aff['total'] * 100
    ).round(1)

    col1, col2 = st.columns(2)
    with col1:
        fig1 = px.bar(
            seg_aff, x='price_segment', y='affordable_pct',
            color='affordable_pct',
            color_continuous_scale='RdYlGn',
            range_color=[0, 100],
            title='Affordability Rate by Price Segment',
            text='affordable_pct'
        )
        fig1.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
        fig1.update_layout(
            coloraxis_showscale=False,
            yaxis=dict(range=[0, 120]),
            height=400
        )
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        x_range = np.linspace(
            loans['monthly_income_usd'].min(),
            loans['monthly_income_usd'].max(), 100
        )
        fig2 = px.scatter(
            loans, x='monthly_income_usd', y='emi_amount_usd',
            color='is_affordable',
            color_discrete_map={1: '#2ecc71', 0: '#e74c3c'},
            title='EMI vs Monthly Income (USD)',
            labels={
                'monthly_income_usd': 'Monthly Income (USD)',
                'emi_amount_usd':     'Monthly EMI (USD)'
            }
        )
        fig2.add_trace(go.Scatter(
            x=x_range, y=x_range * 0.40,
            mode='lines',
            line=dict(color='orange', dash='dash', width=2),
            name='40% Threshold'
        ))
        fig2.update_layout(height=400)
        st.plotly_chart(fig2, use_container_width=True)

    st.info(
        "💡 **Key Finding:** 55% of loan transactions are within the 40% "
        "EMI-to-income threshold. The Ultra ($150K+) segment drives the "
        "highest rejection rate — Hypercar buyers require a separate "
        "high-net-worth lending model."
    )

# ════════════════════════════════════════════════════════════════
# PAGE: Q2 — MARKET PENETRATION
# ════════════════════════════════════════════════════════════════
elif page == "Q2 — Market Penetration":
    st.title("Q2: Market Penetration by Region & Brand")
    st.markdown(
        "**Business Question:** Which brands dominate by region, "
        "and how does India compare to global trends?"
    )
    st.divider()

    india   = master[master['country'] == 'India']
    global_ = master[master['country'] != 'India']

    metric_row([
        ("India Transactions",   f"{len(india)}",  "80% of total"),
        ("Intl Transactions",    f"{len(global_)}", "7 countries"),
        ("Total Brands",         f"{master['make'].nunique()}", ""),
        ("Top Brand (Volume)",   master['make'].value_counts().index[0], "by transactions"),
        ("Top Brand (Revenue)",  master.groupby('make')['price_usd_equivalent']
                                       .sum().idxmax(), "by USD revenue"),
    ])

    st.divider()
    col1, col2 = st.columns(2)

    with col1:
        brand_vol = master['make'].value_counts().reset_index()
        brand_vol.columns = ['make', 'transactions']
        fig1 = px.bar(
            brand_vol.head(10), x='make', y='transactions',
            color='transactions',
            color_continuous_scale='Blues',
            title='Top 10 Brands by Transaction Volume',
            text='transactions'
        )
        fig1.update_traces(textposition='outside')
        fig1.update_layout(
            coloraxis_showscale=False,
            xaxis_tickangle=-35,
            height=400
        )
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        brand_rev = master.groupby('make')['price_usd_equivalent'].sum().reset_index()
        brand_rev.columns = ['make', 'revenue_usd']
        brand_rev = brand_rev.sort_values('revenue_usd', ascending=False)
        fig2 = px.pie(
            brand_rev.head(8), names='make', values='revenue_usd',
            title='Revenue Share by Brand (USD)',
            hole=0.4,
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        fig2.update_layout(height=400)
        st.plotly_chart(fig2, use_container_width=True)

    # India state breakdown
    st.subheader("India — State Level Analysis")
    india_state = india.groupby('state').agg(
        transactions=('transaction_id', 'count'),
        revenue_usd =('price_usd_equivalent', 'sum')
    ).reset_index().sort_values('transactions', ascending=False)

    fig3 = px.bar(
        india_state, x='state', y='transactions',
        color='revenue_usd',
        color_continuous_scale='YlOrRd',
        title='India: Transactions by State',
        text='transactions'
    )
    fig3.update_traces(textposition='outside')
    fig3.update_layout(xaxis_tickangle=-35, height=380)
    st.plotly_chart(fig3, use_container_width=True)

    st.info(
        "💡 **Key Finding:** Maruti Suzuki leads by volume (20 transactions). "
        "Mercedes-Benz leads by revenue ($76K avg ticket size). "
        "India accounts for 80% of all transactions."
    )

# ════════════════════════════════════════════════════════════════
# PAGE: Q3 — INVENTORY VELOCITY
# ════════════════════════════════════════════════════════════════
elif page == "Q3 — Inventory Velocity":
    st.title("Q3: Inventory Velocity & Transaction Timing")
    st.markdown(
        "**Business Question:** What is the average time-to-close per "
        "segment, and which months show peak buying patterns?"
    )
    st.divider()

    converted = leads[leads['status'] == 'Converted'][
        ['lead_id', 'enquiry_date']
    ].copy()
    velocity = master.merge(converted, on='lead_id', how='left')
    velocity['days_to_close'] = (
        velocity['transaction_date'] - velocity['enquiry_date']
    ).dt.days

    avg_close  = velocity['days_to_close'].mean()
    has_lead   = velocity['days_to_close'].notna().sum()
    walk_in    = velocity['days_to_close'].isna().sum()

    metric_row([
        ("Avg Days to Close",   f"{avg_close:.1f}d",  "All segments"),
        ("Fastest Segment",     "Hatchback",           "14.4 days avg"),
        ("Slowest Segment",     "Sedan",               "22.0 days avg"),
        ("Peak Month",          "Feb / May",           "10 transactions each"),
        ("Walk-in Sales",       f"{walk_in}",          "No prior lead"),
    ])

    st.divider()
    col1, col2 = st.columns(2)

    with col1:
        seg_vel = velocity.dropna(subset=['days_to_close']).groupby(
            'segment'
        ).agg(avg_days=('days_to_close', 'mean')).reset_index()
        seg_vel['avg_days'] = seg_vel['avg_days'].round(1)
        seg_vel = seg_vel.sort_values('avg_days', ascending=False)

        fig1 = px.bar(
            seg_vel, x='segment', y='avg_days',
            color='avg_days',
            color_continuous_scale='Oranges',
            title='Avg Days-to-Close by Segment',
            text='avg_days'
        )
        fig1.update_traces(texttemplate='%{text:.1f}d', textposition='outside')
        fig1.update_layout(coloraxis_showscale=False, height=400)
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        month_names = {
            1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
            7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'
        }
        peak = master.groupby('tx_month').agg(
            transactions=('transaction_id', 'count')
        ).reset_index()
        peak['month_name'] = peak['tx_month'].map(month_names)

        fig2 = px.bar(
            peak, x='month_name', y='transactions',
            color='transactions',
            color_continuous_scale='Purples',
            title='Monthly Transaction Volume',
            text='transactions'
        )
        fig2.update_traces(textposition='outside')
        fig2.update_layout(coloraxis_showscale=False, height=400)
        st.plotly_chart(fig2, use_container_width=True)

    st.info(
        "💡 **Key Finding:** Hatchback closes fastest (14.4 days) — "
        "simple financing, high intent. Sedan slowest (22 days) — "
        "longer comparison cycles. February and May are peak months."
    )

# ════════════════════════════════════════════════════════════════
# PAGE: Q4 — FINANCIAL HEALTH
# ════════════════════════════════════════════════════════════════
elif page == "Q4 — Financial Health":
    st.title("Q4: Customer Financial Health Distribution")
    st.markdown(
        "**Business Question:** How are customers distributed across income "
        "and credit bands, and does credit score predict EMI approval?"
    )
    st.divider()

    corr = loans[['credit_score','affordability_ratio']].corr().iloc[0,1]

    metric_row([
        ("Total Customers",     f"{len(customers)}",                    ""),
        ("Avg Credit Score",    f"{customers['credit_score'].mean():.0f}", ""),
        ("Avg Income (USD)",    f"${customers['annual_income_usd'].mean():,.0f}", "annual"),
        ("Credit Correlation",  f"{corr:.3f}",                         "weak predictor"),
        ("Best Income Band",    "$60–120K",                            "85.7% affordable"),
    ])

    st.divider()
    col1, col2 = st.columns(2)

    with col1:
        inc_dist = customers['income_segment'].value_counts().reset_index()
        inc_dist.columns = ['income_segment', 'count']
        fig1 = px.bar(
            inc_dist, x='income_segment', y='count',
            color='count',
            color_continuous_scale='Blues',
            title='Customers by Income Segment (USD)',
            text='count'
        )
        fig1.update_traces(textposition='outside')
        fig1.update_layout(coloraxis_showscale=False, height=380)
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        fig2 = px.histogram(
            customers, x='credit_score', nbins=20,
            color_discrete_sequence=['#3498db'],
            title='Credit Score Distribution'
        )
        for score in [550, 650, 750]:
            fig2.add_vline(
                x=score, line_dash='dash',
                line_color='red'
            )
        fig2.update_layout(height=380)
        st.plotly_chart(fig2, use_container_width=True)

    fig3 = px.scatter(
        loans, x='credit_score', y='affordability_ratio',
        color='is_affordable',
        color_discrete_map={1: '#2ecc71', 0: '#e74c3c'},
        size='annual_income_usd',
        title=f'Credit Score vs Affordability Ratio (Correlation: {corr:.3f})',
        labels={
            'credit_score':       'Credit Score',
            'affordability_ratio':'EMI / Monthly Income'
        }
    )
    fig3.add_hline(
        y=0.40, line_dash='dash',
        line_color='orange',
        annotation_text='40% Threshold'
    )
    fig3.update_layout(height=420)
    st.plotly_chart(fig3, use_container_width=True)

    st.info(
        "💡 **Key Finding:** Correlation of -0.279 between credit score and "
        "affordability ratio — credit score is a weak predictor. "
        "Income is the primary driver: $60–120K band achieves 85.7% affordability."
    )

# ════════════════════════════════════════════════════════════════
# PAGE: Q5 — PRICE SENSITIVITY
# ════════════════════════════════════════════════════════════════
elif page == "Q5 — Price Sensitivity":
    st.title("Q5: Price vs Affordability Sensitivity")
    st.markdown(
        "**Business Question:** How does a ±10% change in vehicle price "
        "affect the pool of eligible buyers across income segments?"
    )
    st.divider()

    INR_TO_USD = 0.0107

    def calculate_emi(principal, annual_rate, tenure_months):
        if pd.isna(principal) or pd.isna(annual_rate) or pd.isna(tenure_months):
            return np.nan
        r = annual_rate / 12 / 100
        n = int(tenure_months)
        if r == 0:
            return principal / n
        return round(principal * r * (1 + r)**n / ((1 + r)**n - 1), 2)

    def run_scenario(df, adj, label):
        s = df.copy()
        s['adj_price_usd'] = s['price_usd_equivalent'] * adj
        orig_down = 1 - (s['loan_amount'] / s['final_price_inr']).clip(0,1)
        s['adj_loan_usd'] = s['adj_price_usd'] * (1 - orig_down)
        s['adj_loan_inr'] = s['adj_loan_usd'] / INR_TO_USD
        s['adj_emi_inr']  = s.apply(
            lambda r: calculate_emi(
                r['adj_loan_inr'], r['interest_rate'], r['loan_tenure_months']
            ), axis=1
        )
        s['adj_emi_usd']    = s['adj_emi_inr'] * INR_TO_USD
        s['adj_ratio']      = s['adj_emi_usd'] / s['monthly_income_usd']
        s['adj_affordable'] = (s['adj_ratio'] <= 0.40).astype(int)
        s['scenario']       = label
        return s

    base     = run_scenario(loans, 1.00, 'Baseline (0%)')
    minus_10 = run_scenario(loans, 0.90, 'Price −10%')
    plus_10  = run_scenario(loans, 1.10, 'Price +10%')

    b = int(base['adj_affordable'].sum())
    m = int(minus_10['adj_affordable'].sum())
    p = int(plus_10['adj_affordable'].sum())

    metric_row([
        ("Baseline Eligible",   f"{b}/{len(loans)}",  f"{b/len(loans)*100:.0f}%"),
        ("At −10% Price",       f"{m}/{len(loans)}",  f"{m/len(loans)*100:.0f}%"),
        ("At +10% Price",       f"{p}/{len(loans)}",  f"{p/len(loans)*100:.0f}%"),
        ("Buyer Change −10%",   f"{m-b:+d}",          "vs baseline"),
        ("Buyer Change +10%",   f"{p-b:+d}",          "vs baseline"),
    ])

    st.divider()
    col1, col2 = st.columns(2)

    with col1:
        fig1 = go.Figure(go.Bar(
            x=['Price −10%', 'Baseline (0%)', 'Price +10%'],
            y=[m, b, p],
            marker_color=['#2ecc71', '#3498db', '#e74c3c'],
            text=[m, b, p],
            textposition='outside'
        ))
        fig1.update_layout(
            title='Eligible Buyer Pool by Scenario',
            yaxis=dict(range=[0, len(loans) + 5]),
            height=380
        )
        st.plotly_chart(fig1, use_container_width=True)

    with col2:
        all_s = pd.concat([minus_10, base, plus_10])
        seg_s = all_s.groupby(['scenario','segment']).agg(
            eligible_pct=('adj_affordable', 'mean')
        ).reset_index()
        seg_s['eligible_pct'] = (seg_s['eligible_pct'] * 100).round(1)

        fig2 = px.bar(
            seg_s, x='segment', y='eligible_pct',
            color='scenario',
            barmode='group',
            color_discrete_map={
                'Price −10%':    '#2ecc71',
                'Baseline (0%)': '#3498db',
                'Price +10%':    '#e74c3c'
            },
            title='Eligible % by Segment & Scenario',
            text='eligible_pct'
        )
        fig2.update_traces(texttemplate='%{text:.0f}%', textposition='outside')
        fig2.update_layout(height=380, yaxis=dict(range=[0,130]))
        st.plotly_chart(fig2, use_container_width=True)

    st.info (
        "💡 **Key Finding:** Near-zero price sensitivity — ±10% price change "
        "moves the eligible buyer pool by at most 1 customer. Income is the "
        "binding constraint, not price. Extending loan tenure to 84 months "
        "is a more effective lever than price reduction.")

        # ════════════════════════════════════════════════════════════════
# PAGE: ML AFFORDABILITY MODEL
# ════════════════════════════════════════════════════════════════
elif page == "🤖 ML Affordability Model":
    st.title("🤖 ML Affordability Model")
    st.markdown(
        "**Gradient Boosted Classifier (XGBoost)** — predicts loan affordability "
        "probability instead of using a binary 40% EMI rule."
    )
    st.divider()

    import sys
    sys.path.append(str(Path(__file__).parent / 'src' / 'ml'))

    try:
        from predict import predict_single, get_model_metrics
        from pathlib import Path as _Path

        metrics = get_model_metrics()

        # Model metrics row
        if metrics:
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Model Accuracy",    f"{metrics.get('accuracy', 0)*100:.1f}%")
            col2.metric("ROC-AUC Score",     f"{metrics.get('roc_auc', 0):.4f}" if metrics.get('roc_auc') else "N/A")
            col3.metric("CV Accuracy",       f"{metrics.get('cv_mean_accuracy', 0)*100:.1f}%")
            col4.metric("Training Samples",  str(metrics.get('train_samples', 0)))

        st.divider()

        # Feature importance chart
        if metrics and 'feature_importance' in metrics:
            st.subheader("📊 Feature Importance")
            fi   = metrics['feature_importance']
            fi_df = pd.DataFrame(list(fi.items()), columns=['Feature', 'Importance'])
            fi_df = fi_df.sort_values('Importance', ascending=True)

            fig_fi = px.bar(
                fi_df, x='Importance', y='Feature',
                orientation='h',
                color='Importance',
                color_continuous_scale='Teal',
                title='Which Features Drive Affordability Predictions Most?',
                labels={'Importance': 'Feature Importance Score', 'Feature': ''}
            )
            fig_fi.update_layout(
                height=380,
                coloraxis_showscale=False,
                title_font_size=14
            )
            st.plotly_chart(fig_fi, use_container_width=True)

        st.divider()

        # Live prediction tool
        st.subheader("🎯 Live Affordability Predictor")
        st.markdown("Enter customer and vehicle details to get an ML-powered affordability score:")

        col1, col2 = st.columns(2)
        with col1:
            annual_income = st.number_input("Annual Income (USD)", min_value=1000, max_value=10000000, value=25000, step=1000)
            credit_score  = st.slider("Credit Score", min_value=300, max_value=900, value=720)
            employment    = st.selectbox("Employment Type", ['Salaried', 'Self-Employed', 'Business', 'Retired'])

        with col2:
            vehicle_price  = st.number_input("Vehicle Price (USD)", min_value=1000, max_value=5000000, value=15000, step=1000)
            tenure         = st.selectbox("Loan Tenure (months)", [12, 24, 36, 48, 60, 72, 84], index=4)
            interest_rate  = st.slider("Interest Rate (%)", min_value=6.0, max_value=20.0, value=9.5, step=0.5)
            down_payment   = st.slider("Down Payment (%)", min_value=5, max_value=50, value=20)

        if st.button("🔮 Predict Affordability", type="primary"):
            result = predict_single(
                annual_income_usd   = annual_income,
                credit_score        = credit_score,
                employment_type     = employment,
                price_usd           = vehicle_price,
                loan_tenure_months  = tenure,
                interest_rate       = interest_rate,
                down_payment_pct    = down_payment / 100,
            )

            st.divider()
            prob = result['probability_affordable']

            # Probability gauge
            col1, col2, col3 = st.columns(3)
            col1.metric("ML Probability",   f"{prob*100:.1f}%")
            col2.metric("ML Prediction",    result['ml_prediction'])
            col3.metric("Rule Prediction",  result['rule_prediction'])

            # Risk level
            color = 'green' if prob >= 0.75 else ('orange' if prob >= 0.55 else ('red' if prob >= 0.35 else 'darkred'))
            st.markdown(f"### Risk Level: :{color}[{result['risk_level']}]")

            # Probability bar
            fig_gauge = go.Figure(go.Bar(
                x=[prob * 100],
                y=['Affordability'],
                orientation='h',
                marker_color='#2ecc71' if prob >= 0.55 else '#e74c3c',
                text=[f"{prob*100:.1f}%"],
                textposition='outside',
            ))
            fig_gauge.update_layout(
                xaxis=dict(range=[0, 100], title='Probability Affordable (%)'),
                height=120,
                margin=dict(l=20, r=60, t=20, b=20),
                title='ML Affordability Probability Score'
            )
            st.plotly_chart(fig_gauge, use_container_width=True)

            # Breakdown
            st.markdown("**Loan Breakdown:**")
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Monthly Income", f"${result['monthly_income_usd']:,.0f}")
            col2.metric("Loan Amount",    f"${result['loan_amount_usd']:,.0f}")
            col3.metric("Monthly EMI",    f"${result['emi_usd']:,.0f}")
            col4.metric("EMI/Income",     f"{result['rule_emi_ratio']*100:.1f}%")

            # Agreement
            if result['ml_vs_rule_agreement']:
                st.success("✅ ML model and rule-based system AGREE on this prediction")
            else:
                st.warning("⚠️  ML model and rule-based system DISAGREE — ML considers additional factors")

    except FileNotFoundError:
        st.error("⚠️  ML model not trained yet. Run: python src/ml/train.py")
        st.code("cd analytics && python src/ml/train.py", language='bash')
    except Exception as e:
        st.error(f"Error loading ML model: {e}")
        st.exception(e)


    # ════════════════════════════════════════════════════════════════
# PAGE: Q7 — SALES FORECASTING
# ════════════════════════════════════════════════════════════════
elif page == "📈 Q7 — Sales Forecast":
    st.title("📈 Q7: Sales Volume Forecasting")
    st.markdown(
        "**ARIMA Time-Series Model** — forecasts next 3 months of "
        "transaction volume based on 2024–2026 historical patterns."
    )
    st.divider()

    import sys
    sys.path.append(str(Path(__file__).parent / 'src'))

    try:
        from forecasting import (
            load_monthly_series, forecast_next_months,
            get_seasonality_insights
        )

        series = load_monthly_series()
        forecast_df, series, method = forecast_next_months(series, n_months=3)
        insights = get_seasonality_insights(series)

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Peak Month",    insights['peak_month'])
        col2.metric("Peak Avg Txns", f"{insights['peak_avg']:.1f}")
        col3.metric("Low Month",     insights['low_month'])
        col4.metric("Overall Avg",   f"{insights['overall_mean']:.1f}/month")

        st.divider()

        # Historical + Forecast chart
        hist_df = series.reset_index()
        hist_df.columns = ['period', 'count']

        fore_df = forecast_df.reset_index()

        fig1 = go.Figure()
        fig1.add_trace(go.Scatter(
            x=hist_df['period'], y=hist_df['count'],
            mode='lines+markers', name='Historical',
            line=dict(color='#00d9d9', width=2),
        ))
        if not fore_df.empty:
            fig1.add_trace(go.Scatter(
                x=fore_df['period'], y=fore_df['forecast'],
                mode='lines+markers', name='Forecast',
                line=dict(color='#f39c12', width=2, dash='dash'),
                marker=dict(size=8, symbol='diamond'),
            ))
            fig1.add_trace(go.Scatter(
                x=pd.concat([fore_df['period'], fore_df['period'][::-1]]),
                y=pd.concat([fore_df['upper_80'], fore_df['lower_80'][::-1]]),
                fill='toself',
                fillcolor='rgba(243,156,18,0.15)',
                line=dict(color='rgba(255,255,255,0)'),
                name='80% Confidence Interval',
            ))
        fig1.update_layout(
            title='Monthly Transactions — Historical + 3-Month Forecast',
            height=420, title_font_size=13,
        )
        st.plotly_chart(fig1, use_container_width=True)

        # Seasonality bar
        months = list(insights['monthly_avg'].keys())
        values = list(insights['monthly_avg'].values())
        colors = ['#e74c3c' if m == insights['peak_month']
                  else '#2ecc71' if m == insights['low_month']
                  else '#00d9d9' for m in months]

        fig2 = go.Figure(go.Bar(
            x=months, y=values,
            marker_color=colors,
            text=[f"{v:.1f}" for v in values],
            textposition='outside',
        ))
        fig2.update_layout(
            title='Average Transactions by Month — Seasonality Pattern',
            height=380, title_font_size=13,
        )
        st.plotly_chart(fig2, use_container_width=True)

        st.info(
            f"💡 **Key Finding:** {insights['peak_month']} is the peak buying month "
            f"(avg {insights['peak_avg']:.1f} txns). Trend is {insights['trend']}. "
            f"Plan marketing campaigns in the month BEFORE peak months."
        )

    except Exception as e:
        st.error(f"Forecasting error: {e}")
        st.exception(e)

# ════════════════════════════════════════════════════════════════
# PAGE: Q8 — CUSTOMER LIFETIME VALUE
# ════════════════════════════════════════════════════════════════
elif page == "💎 Q8 — Customer CLV":
    st.title("💎 Q8: Customer Lifetime Value Analysis")
    st.markdown(
        "**CLV = Avg Transaction Value × Purchase Frequency × Customer Lifespan** "
        "— segments customers into High / Medium / Low value tiers."
    )
    st.divider()

    try:
        from clv import load_clv_data, compute_clv, clv_by_segment, clv_by_employment

        master_data, customers_data = load_clv_data()
        clv_df  = compute_clv(master_data, customers_data)
        seg_clv = clv_by_segment(clv_df)
        emp_clv = clv_by_employment(clv_df)

        high   = (clv_df['clv_tier'] == 'High Value').sum()
        medium = (clv_df['clv_tier'] == 'Medium Value').sum()
        low    = (clv_df['clv_tier'] == 'Low Value').sum()

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Avg CLV",       f"${clv_df['clv'].mean():,.0f}")
        col2.metric("High Value",    str(high))
        col3.metric("Medium Value",  str(medium))
        col4.metric("Low Value",     str(low))

        st.divider()
        col1, col2 = st.columns(2)

        with col1:
            tier_counts = clv_df['clv_tier'].value_counts().reset_index()
            tier_counts.columns = ['tier', 'count']
            colors_map = {
                'High Value':   '#2ecc71',
                'Medium Value': '#f39c12',
                'Low Value':    '#e74c3c',
            }
            fig1 = px.pie(
                tier_counts, names='tier', values='count',
                color='tier', color_discrete_map=colors_map,
                title='CLV Tier Distribution', hole=0.4,
            )
            fig1.update_layout(height=360)
            st.plotly_chart(fig1, use_container_width=True)

        with col2:
            seg_clean = seg_clv.dropna(subset=['income_segment'])
            fig2 = px.bar(
                seg_clean,
                x='income_segment', y='avg_clv',
                color='avg_clv', color_continuous_scale='Greens',
                title='Avg CLV by Income Segment',
                text='avg_clv',
            )
            fig2.update_traces(texttemplate='$%{text:,.0f}', textposition='outside')
            fig2.update_layout(height=360, coloraxis_showscale=False)
            st.plotly_chart(fig2, use_container_width=True)

        # Scatter plot
        fig3 = px.scatter(
            clv_df,
            x='annual_income_usd', y='clv',
            color='clv_tier',
            color_discrete_map=colors_map,
            size='transaction_count',
            hover_data=['full_name','country','employment_type'],
            title='CLV vs Annual Income — Customer Value Map',
            labels={
                'annual_income_usd': 'Annual Income (USD)',
                'clv': 'Customer Lifetime Value (USD)',
            },
        )
        fig3.update_layout(height=420)
        st.plotly_chart(fig3, use_container_width=True)

        st.info(
            "💡 **Key Finding:** Business owners and Self-Employed customers "
            "show the highest average CLV. The top 10 customers account for "
            "a disproportionately high share of total revenue. "
            "Implement VIP program for High Value tier."
        )

    except Exception as e:
        st.error(f"CLV error: {e}")
        st.exception(e)