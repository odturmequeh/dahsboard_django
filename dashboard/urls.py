from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/metrics/', views.ga4_dashboard_metrics, name="ga4_dashboard_metrics"),
    path("dashboard/daily-metrics/", views.ga4_dashboard_daily_metrics),
    path("dashboard/load-time-hourly/", views.ga4_load_time_by_device_and_hour, name="ga4_load_time_by_device_and_hour"),
    path('dashboard/funnel-data/', views.ga4_funnel_data, name='ga4_funnel_data'),
    #path("dashboard/page-resources/", views.ga4_page_resources, name="ga4_resources_data"),
    path('dashboard/click_relation/', views.ga4_click_relation, name='click_relation_data'),
    path('dashboard/click_detail/<str:elemento>/', views.ga4_click_detail, name='click_detail_data'),
    path("dashboard/user_click_flow/", views.ga4_click_flow, name="user_click_flow"),  
    path("dashboard/genia-summary/", views.ga4_genia_summary, name="ga4_dashboard_summary"),
    path("dashboard/genia-daily-chart/", views.ga4_genia_ingresos_por_dia, name="ga4_dashboard_daily-chart"),
    path('dashboard/resources/general/', views.ga4_resources_general, name='ga4_resources_general'),
    path('dashboard/resources/hourly/', views.ga4_resources_hourly, name='ga4_resources_hourly'),
    path('dashboard/resources/daily/', views.ga4_resources_daily, name='ga4_resources_daily'),

   

]
