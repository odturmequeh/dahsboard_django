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
    path('dashboard/embudo_migra/', views.ga4_migracion_view_item_list, name='item_list'),
    path('dashboard/ga4_migracion_view_alert/', views.ga4_migracion_view_alert, name='view_alert'),
    path('dashboard/sesiones-vs-compras-comparacion/', views.sesiones_vs_compras_comparacion_view, name='sesiones_vs_compras_comparacion'),
    path('dashboard/traffic-channel-summary/', views.traffic_channel_summary_view, name='traffic_channel_summary_view'),
    path('dashboard/ga4-traffic-detail-summary/', views.ga4_traffic_detail_summary_view, name='ga4_traffic_detail_summary_view'),

   

]
