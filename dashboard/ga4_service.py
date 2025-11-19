from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, Dimension, RunReportRequest
import os

PROPERTY_ID = os.getenv("GA4_PROPERTY_ID")  # Lo agregaremos luego al .env

def get_daily_users():
    client = BetaAnalyticsDataClient()

    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name="activeUsers")],
        dimensions=[Dimension(name="date")],
        date_ranges=[DateRange(start_date="7daysAgo", end_date="today")],
    )

    response = client.run_report(request)

    # Convertimos la respuesta en un JSON limpio
    results = []
    for row in response.rows:
        results.append({
            "date": row.dimension_values[0].value,
            "active_users": row.metric_values[0].value
        })

    return results
