"""
forecasting.py
Sales volume forecasting using ARIMA time-series model.

Answers Q6: What will transaction volume look like
in the next 3 months based on historical patterns?

Uses pmdarima auto_arima to automatically select
the best ARIMA parameters (p, d, q).
"""

import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path(__file__).resolve().parents[1] / 'data'


def load_monthly_series() -> pd.Series:
    """Load transactions and aggregate into monthly counts."""
    master = pd.read_csv(DATA_DIR / 'master.csv')
    master['transaction_date'] = pd.to_datetime(master['transaction_date'])

    # Monthly transaction count
    monthly = master.groupby(
        master['transaction_date'].dt.to_period('M')
    ).size().reset_index()
    monthly.columns = ['period', 'count']
    monthly['period'] = monthly['period'].dt.to_timestamp()
    monthly = monthly.sort_values('period').set_index('period')

    print(f"📅 Monthly series: {len(monthly)} months of data")
    print(f"   Range: {monthly.index.min().strftime('%Y-%m')} to "
          f"{monthly.index.max().strftime('%Y-%m')}")
    print(f"   Min: {monthly['count'].min()} | "
          f"Max: {monthly['count'].max()} | "
          f"Mean: {monthly['count'].mean():.1f}")
    return monthly['count']


def fit_arima_model(series: pd.Series):
    """
    Fit ARIMA model using pmdarima auto_arima.
    Auto-selects best (p,d,q) parameters using AIC criterion.
    """
    try:
        from pmdarima import auto_arima

        print("\n🤖 Fitting ARIMA model (auto parameter selection)...")
        model = auto_arima(
            series,
            start_p=0, start_q=0,
            max_p=3,   max_q=3,
            d=None,            # auto-select differencing
            seasonal=False,    # not enough data for seasonal ARIMA
            stepwise=True,
            information_criterion='aic',
            error_action='ignore',
            suppress_warnings=True,
        )
        print(f"   Best ARIMA order: {model.order}")
        print(f"   AIC: {model.aic():.2f}")
        return model, 'arima'

    except Exception as e:
        print(f"   ARIMA failed ({e}), using simple moving average fallback")
        return None, 'moving_average'


def forecast_next_months(series: pd.Series, n_months: int = 3):
    """
    Forecast next n_months of transaction volume.
    Returns forecast values with confidence intervals.
    """
    model, method = fit_arima_model(series)

    if method == 'arima' and model is not None:
        forecast_result = model.predict(
            n_periods=n_months,
            return_conf_int=True,
            alpha=0.20  # 80% confidence interval
        )
        forecast_values = forecast_result[0]
        conf_int        = forecast_result[1]

        lower = conf_int[:, 0]
        upper = conf_int[:, 1]

    else:
        # Fallback: 3-month moving average
        ma3             = series.rolling(3).mean().iloc[-1]
        forecast_values = np.array([ma3] * n_months)
        lower           = forecast_values * 0.7
        upper           = forecast_values * 1.3

    # Build forecast DataFrame
    last_date = series.index[-1]
    future_dates = pd.date_range(
        start=last_date + pd.DateOffset(months=1),
        periods=n_months,
        freq='MS'
    )

    forecast_df = pd.DataFrame({
        'period':          future_dates,
        'forecast':        np.maximum(0, forecast_values).round(1),
        'lower_80':        np.maximum(0, lower).round(1),
        'upper_80':        np.maximum(0, upper).round(1),
        'is_forecast':     True,
    }).set_index('period')

    print(f"\n📈 3-Month Sales Forecast:")
    print(f"   {'Month':<12} {'Forecast':>10} {'Lower 80%':>10} {'Upper 80%':>10}")
    print("   " + "-" * 44)
    for date, row in forecast_df.iterrows():
        print(f"   {date.strftime('%Y-%m'):<12} "
              f"{row['forecast']:>10.1f} "
              f"{row['lower_80']:>10.1f} "
              f"{row['upper_80']:>10.1f}")

    return forecast_df, series, method


def get_seasonality_insights(series: pd.Series) -> dict:
    """Extract seasonality patterns from historical data."""
    df = series.reset_index()
    df.columns = ['period', 'count']
    df['month'] = df['period'].dt.month
    df['year']  = df['period'].dt.year

    month_names = {
        1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
        7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'
    }

    monthly_avg = df.groupby('month')['count'].mean().round(1)
    peak_month  = monthly_avg.idxmax()
    low_month   = monthly_avg.idxmin()

    insights = {
        'peak_month':      month_names[peak_month],
        'peak_avg':        float(monthly_avg[peak_month]),
        'low_month':       month_names[low_month],
        'low_avg':         float(monthly_avg[low_month]),
        'monthly_avg':     {month_names[k]: v for k, v in monthly_avg.items()},
        'overall_mean':    float(series.mean().round(1)),
        'overall_std':     float(series.std().round(1)),
        'trend':           'increasing' if series.iloc[-3:].mean() > series.iloc[:3].mean()
                           else 'decreasing',
    }

    print(f"\n📊 Seasonality Insights:")
    print(f"   Peak month : {insights['peak_month']} (avg {insights['peak_avg']:.1f} txns)")
    print(f"   Low month  : {insights['low_month']} (avg {insights['low_avg']:.1f} txns)")
    print(f"   Overall avg: {insights['overall_mean']:.1f} txns/month")
    print(f"   Trend      : {insights['trend']}")

    return insights


if __name__ == '__main__':
    print("🚗 CarIQ — Sales Forecasting Module")
    print("=" * 50)
    series = load_monthly_series()
    forecast_df, series, method = forecast_next_months(series, n_months=3)
    insights = get_seasonality_insights(series)
    print(f"\n✅ Forecasting complete using method: {method}")