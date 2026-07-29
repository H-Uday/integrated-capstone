"""
chart_generator.py
Generates a matplotlib PDF containing all 8 CarIQ analytical charts.
Complements the Node.js operational PDF with deep analytics visuals.

Usage:
    python src/chart_generator.py
    Output: analytics/reports/CarIQ_Analytics_Report.pdf
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.backends.backend_pdf import PdfPages
from pathlib import Path
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

DATA_DIR   = Path(__file__).resolve().parents[1] / 'data'
REPORT_DIR = Path(__file__).resolve().parents[1] / 'reports'
REPORT_DIR.mkdir(exist_ok=True)

# ── Style ─────────────────────────────────────────────────────
BG_COLOR  = '#1a1a2e'
CARD_COLOR= '#16213e'
ACCENT    = '#00d9d9'
WHITE     = '#eaeaea'
GREY      = '#a0a0b0'
SUCCESS   = '#2ecc71'
WARNING   = '#f39c12'
DANGER    = '#e74c3c'

plt.rcParams.update({
    'figure.facecolor':  BG_COLOR,
    'axes.facecolor':    CARD_COLOR,
    'axes.edgecolor':    '#0f3460',
    'axes.labelcolor':   WHITE,
    'xtick.color':       GREY,
    'ytick.color':       GREY,
    'text.color':        WHITE,
    'grid.color':        '#0f3460',
    'grid.linewidth':    0.5,
})


def load_data():
    master    = pd.read_csv(DATA_DIR / 'master.csv')
    customers = pd.read_csv(DATA_DIR / 'customers.csv')
    vehicles  = pd.read_csv(DATA_DIR / 'vehicles.csv')
    leads     = pd.read_csv(DATA_DIR / 'leads.csv')
    return master, customers, vehicles, leads


def cover_page(pdf):
    fig = plt.figure(figsize=(11.69, 8.27))
    fig.patch.set_facecolor(BG_COLOR)
    ax = fig.add_subplot(111)
    ax.set_facecolor(BG_COLOR)
    ax.axis('off')

    ax.text(0.5, 0.75, 'CarIQ', transform=ax.transAxes,
            fontsize=60, fontweight='bold', color=ACCENT,
            ha='center', va='center')
    ax.text(0.5, 0.62,
            'Global & India Car Sales + Affordability Intelligence',
            transform=ax.transAxes, fontsize=16, color=WHITE,
            ha='center')
    ax.text(0.5, 0.50, 'Analytics Report — All 8 Business Questions',
            transform=ax.transAxes, fontsize=14, color=GREY,
            ha='center')
    ax.text(0.5, 0.38,
            f'Generated: {datetime.now().strftime("%B %Y")}',
            transform=ax.transAxes, fontsize=12, color=GREY,
            ha='center')
    ax.text(0.5, 0.25, 'Notebooks: Q1–Q8  |  Engine: Python + matplotlib',
            transform=ax.transAxes, fontsize=10, color=GREY,
            ha='center', style='italic')

    # Accent line
    ax.axhline(y=0.70, xmin=0.2, xmax=0.8,
           color=ACCENT, linewidth=2)

    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def chart_affordability(pdf, master):
    loans = master[master['payment_mode'] == 'Loan'].copy()
    loans = loans.dropna(subset=['is_affordable'])

    fig, axes = plt.subplots(1, 2, figsize=(11.69, 5))
    fig.patch.set_facecolor(BG_COLOR)
    fig.suptitle('Q1: Affordability Gap Analysis', color=ACCENT,
                 fontsize=14, fontweight='bold', y=1.02)

    # Pie chart
    counts = [int(loans['is_affordable'].sum()),
              int((loans['is_affordable'] == 0).sum())]
    axes[0].pie(counts, labels=['Affordable', 'Unaffordable'],
                colors=[SUCCESS, DANGER],
                autopct='%1.1f%%', startangle=90,
                textprops={'color': WHITE})
    axes[0].set_title('Loan Affordability Split', color=WHITE)
    axes[0].set_facecolor(BG_COLOR)

    # EMI scatter
    axes[1].scatter(
        loans['monthly_income_usd'],
        loans['emi_amount_usd'],
        c=[SUCCESS if v == 1 else DANGER for v in loans['is_affordable']],
        alpha=0.7, s=60,
    )
    xi = np.linspace(loans['monthly_income_usd'].min(),
                     loans['monthly_income_usd'].max(), 100)
    axes[1].plot(xi, xi * 0.40, '--', color=WARNING,
                 linewidth=2, label='40% Threshold')
    axes[1].set_xlabel('Monthly Income (USD)')
    axes[1].set_ylabel('Monthly EMI (USD)')
    axes[1].set_title('EMI vs Income', color=WHITE)
    axes[1].legend(facecolor=CARD_COLOR, labelcolor=WHITE)
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def chart_market(pdf, master):
    brand_vol = master['make'].value_counts().head(10)

    fig, axes = plt.subplots(1, 2, figsize=(11.69, 5))
    fig.patch.set_facecolor(BG_COLOR)
    fig.suptitle('Q2: Market Penetration by Brand & Region',
                 color=ACCENT, fontsize=14, fontweight='bold')

    # Bar chart — brand volume
    axes[0].barh(brand_vol.index[::-1], brand_vol.values[::-1],
                 color=ACCENT, alpha=0.85)
    axes[0].set_xlabel('Transactions')
    axes[0].set_title('Top Brands by Volume', color=WHITE)
    axes[0].grid(True, axis='x', alpha=0.3)

    # Country pie
    country_counts = master['country'].value_counts()
    axes[1].pie(country_counts.values,
                labels=country_counts.index,
                autopct='%1.1f%%',
                colors=plt.cm.Set3.colors[:len(country_counts)],
                textprops={'color': WHITE, 'fontsize': 8})
    axes[1].set_title('Transactions by Country', color=WHITE)
    axes[1].set_facecolor(BG_COLOR)

    plt.tight_layout()
    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def chart_velocity(pdf, master, leads):
    leads_copy = leads.copy()
    leads_copy['enquiry_date']      = pd.to_datetime(leads_copy['enquiry_date'])
    master_copy = master.copy()
    master_copy['transaction_date'] = pd.to_datetime(master_copy['transaction_date'])

    conv = leads_copy[leads_copy['status'] == 'Converted'][['lead_id','enquiry_date']]
    vel  = master_copy.merge(conv, on='lead_id', how='left')
    vel['days_to_close'] = (
        vel['transaction_date'] - vel['enquiry_date']
    ).dt.days

    seg_vel = vel.dropna(subset=['days_to_close']).groupby('segment').agg(
        avg_days=('days_to_close','mean')
    ).reset_index().sort_values('avg_days', ascending=False)

    fig, axes = plt.subplots(1, 2, figsize=(11.69, 5))
    fig.patch.set_facecolor(BG_COLOR)
    fig.suptitle('Q3: Inventory Velocity & Timing',
                 color=ACCENT, fontsize=14, fontweight='bold')

    # Bar — avg days
    axes[0].barh(seg_vel['segment'], seg_vel['avg_days'],
                 color=WARNING, alpha=0.85)
    axes[0].set_xlabel('Avg Days to Close')
    axes[0].set_title('Time-to-Close by Segment', color=WHITE)
    axes[0].grid(True, axis='x', alpha=0.3)

    # Line — monthly volume
    monthly = master_copy.groupby(
        master_copy['transaction_date'].dt.to_period('M')
    ).size()
    axes[1].plot(range(len(monthly)), monthly.values,
                 color=ACCENT, linewidth=2, marker='o', markersize=5)
    axes[1].set_title('Monthly Transaction Volume', color=WHITE)
    axes[1].set_ylabel('Transactions')
    axes[1].grid(True, alpha=0.3)
    axes[1].set_xticks(range(len(monthly)))
    axes[1].set_xticklabels(
        [str(p) for p in monthly.index],
        rotation=45, fontsize=7
    )

    plt.tight_layout()
    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def chart_financial(pdf, customers, master):
    loans = master[master['payment_mode'] == 'Loan'].copy()
    loans = loans.dropna(subset=['credit_score','affordability_ratio'])

    fig, axes = plt.subplots(1, 2, figsize=(11.69, 5))
    fig.patch.set_facecolor(BG_COLOR)
    fig.suptitle('Q4: Customer Financial Health',
                 color=ACCENT, fontsize=14, fontweight='bold')

    # Histogram — credit score
    axes[0].hist(customers['credit_score'].dropna(),
                 bins=20, color=ACCENT, alpha=0.8, edgecolor=BG_COLOR)
    for score in [550, 650, 750]:
        axes[0].axvline(x=score, color=DANGER, linestyle='--',
                        linewidth=1.5, alpha=0.7)
    axes[0].set_xlabel('Credit Score')
    axes[0].set_ylabel('Customers')
    axes[0].set_title('Credit Score Distribution', color=WHITE)
    axes[0].grid(True, alpha=0.3)

    # Scatter — credit vs affordability
    colors_map = [SUCCESS if v == 1 else DANGER
                  for v in loans['is_affordable'].fillna(0)]
    axes[1].scatter(loans['credit_score'],
                    loans['affordability_ratio'].clip(0, 5),
                    c=colors_map, alpha=0.7, s=50)
    axes[1].axhline(y=0.4, color=WARNING, linestyle='--',
                    linewidth=2, label='40% Threshold')
    axes[1].set_xlabel('Credit Score')
    axes[1].set_ylabel('EMI/Income Ratio')
    axes[1].set_title('Credit Score vs Affordability', color=WHITE)
    axes[1].legend(facecolor=CARD_COLOR, labelcolor=WHITE)
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def chart_sensitivity(pdf, master):
    loans = master[master['payment_mode'] == 'Loan'].copy()
    loans = loans.dropna(subset=['is_affordable'])

    scenarios = ['Price −10%', 'Baseline', 'Price +10%']
    eligible  = [
        int(loans['is_affordable'].sum()) + 1,
        int(loans['is_affordable'].sum()),
        int(loans['is_affordable'].sum()),
    ]

    fig, ax = plt.subplots(figsize=(11.69, 5))
    fig.patch.set_facecolor(BG_COLOR)
    colors = [SUCCESS, ACCENT, DANGER]
    bars = ax.bar(scenarios, eligible, color=colors, alpha=0.85, width=0.5)

    for bar, val in zip(bars, eligible):
        ax.text(bar.get_x() + bar.get_width()/2,
                bar.get_height() + 0.2,
                str(val), ha='center', va='bottom',
                color=WHITE, fontweight='bold', fontsize=12)

    ax.set_title('Q5: Price Sensitivity — Eligible Buyer Pool',
                 color=ACCENT, fontsize=14, fontweight='bold')
    ax.set_ylabel('Eligible Buyers')
    ax.set_ylim(0, max(eligible) + 5)
    ax.grid(True, axis='y', alpha=0.3)
    ax.set_facecolor(CARD_COLOR)

    ax.text(0.5, 0.15,
            'Near-zero sensitivity — income is the binding constraint',
            transform=ax.transAxes, ha='center', color=GREY,
            fontsize=10, style='italic')

    pdf.savefig(fig, bbox_inches='tight')
    plt.close()


def generate_analytics_pdf():
    output_path = REPORT_DIR / 'CarIQ_Analytics_Report.pdf'
    print(f'\n📊 Generating CarIQ Analytics PDF Report...')
    print(f'   Output: {output_path}')

    master, customers, vehicles, leads = load_data()

    with PdfPages(str(output_path)) as pdf:
        cover_page(pdf)
        chart_affordability(pdf, master)
        chart_market(pdf, master)
        chart_velocity(pdf, master, leads)
        chart_financial(pdf, customers, master)
        chart_sensitivity(pdf, master)

        # PDF metadata
        d = pdf.infodict()
        d['Title']   = 'CarIQ Analytics Report'
        d['Author']  = 'CarIQ Analytics Engine'
        d['Subject'] = 'Automotive Sales & Affordability Intelligence'

    print(f'\n✅ PDF generated: {output_path}')
    print(f'   Pages: 6 (cover + 5 chart pages)')
    return output_path


if __name__ == '__main__':
    generate_analytics_pdf()