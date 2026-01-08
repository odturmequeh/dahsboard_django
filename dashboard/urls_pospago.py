# dashboard/urls_pospago.py
"""
URLs optimizadas para Pospago - COMPLETO CON CORTES
7 endpoints individuales para carga progresiva
"""

from django.urls import path
import dashboard.views_pospago as views_pospago_optimized

app_name = 'pospago'

urlpatterns = [
    # Endpoint 1: Metas y Objetivos
    path('metas-objetivos/', 
         views_pospago_optimized.metas_objetivos, 
         name='metas_objetivos'),
    
    # Endpoint 2: Cierre Día Anterior
    path('cierre-dia-anterior/', 
         views_pospago_optimized.cierre_dia_anterior, 
         name='cierre_dia_anterior'),
    
    # Endpoint 3: Cortes del Día Actual (NUEVO)
    path('cortes-dia-hoy/', 
         views_pospago_optimized.cortes_dia_hoy, 
         name='cortes_dia_hoy'),
    
    # Endpoint 4: Evolución Diaria
    path('evolucion-ventas/', 
         views_pospago_optimized.evolucion_ventas, 
         name='evolucion_ventas'),
    
    # Endpoint 5: Desglose Semanal
    path('desglose-semanal/', 
         views_pospago_optimized.desglose_semanal, 
         name='desglose_semanal'),
    
    # Endpoint 6: Mapa de Calor
    path('mapa-calor/', 
         views_pospago_optimized.mapa_calor, 
         name='mapa_calor'),
    
    # Endpoint 7: Comparativo Cantadas vs Activadas
    path('comparativo/', 
         views_pospago_optimized.comparativo_cantadas_activadas, 
         name='comparativo'),
]