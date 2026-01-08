# dashboard/views_pospago_optimized.py
"""
Views optimizadas de Pospago - COMPLETO CON CORTES
Endpoints individuales para carga progresiva en frontend
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
import logging

from dashboard.services.pospago_service import pospago_service_optimized

logger = logging.getLogger(__name__)


@api_view(['GET'])
def metas_objetivos(request):
    """
    Endpoint: Metas y Objetivos con proyecciones
    GET /api/pospago/metas-objetivos/?anio=2025&mes=12
    
    Retorna:
    - Metas del mes
    - Ejecución actual
    - Cumplimiento %
    - Proyección de cierre
    - Productividad diaria
    - Días hábiles (diferentes para migra vs porta/ln)
    """
    try:
        anio = int(request.GET.get('anio', datetime.now().year))
        mes = int(request.GET.get('mes', datetime.now().month))
        
        logger.info(f"📊 [Endpoint] Metas: {anio}-{mes:02d}")
        
        data = pospago_service_optimized.get_metas_objetivos(anio, mes)
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en metas: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def cierre_dia_anterior(request):
    """
    Endpoint: Cierre del día anterior
    GET /api/pospago/cierre-dia-anterior/
    
    Retorna:
    - Cantadas (ecommerce)
    - Activadas (R5)
    - Tasa de activación
    - Comparativos vs semana y mes anterior
    """
    try:
        logger.info("📊 [Endpoint] Cierre día anterior")
        
        data = pospago_service_optimized.get_cierre_dia_anterior()
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en cierre: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def cortes_dia_hoy(request):
    """
    Endpoint: Cortes del día actual por franjas horarias
    GET /api/pospago/cortes-dia-hoy/
    
    Retorna:
    - Cortes por franja horaria (00-10, 10-12, 12-14, 14-16, 16-24)
    - Totales del día
    """
    try:
        logger.info("📊 [Endpoint] Cortes del día")
        
        data = pospago_service_optimized.get_cortes_dia_hoy()
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en cortes: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False, 'cortes_por_franja': []}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def evolucion_ventas(request):
    """
    Endpoint: Evolución diaria de ventas
    GET /api/pospago/evolucion-ventas/?anio=2025&mes=12
    
    Retorna:
    - Activadas (R5) por día
    - Cantadas (V9) por día
    - Metas diarias
    - Promedios del periodo
    """
    try:
        anio = int(request.GET.get('anio', datetime.now().year))
        mes = int(request.GET.get('mes', datetime.now().month))
        
        logger.info(f"📊 [Endpoint] Evolución: {anio}-{mes:02d}")
        
        data = pospago_service_optimized.get_evolucion_ventas(anio, mes)
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en evolución: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False, 'datos_diarios': []}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def desglose_semanal(request):
    """
    Endpoint: Desglose por semanas
    GET /api/pospago/desglose-semanal/?anio=2025&mes=12
    
    Retorna:
    - Datos por semana
    - Total del mes
    """
    try:
        anio = int(request.GET.get('anio', datetime.now().year))
        mes = int(request.GET.get('mes', datetime.now().month))
        
        logger.info(f"📊 [Endpoint] Desglose: {anio}-{mes:02d}")
        
        data = pospago_service_optimized.get_desglose_semanal(anio, mes)
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en desglose: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False, 'semanas': []}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def mapa_calor(request):
    """
    Endpoint: Mapa de calor
    GET /api/pospago/mapa-calor/?anio=2025&mes=12
    
    Retorna:
    - Datos del mapa (semana x día)
    - Resumen (mejor semana, mejor día)
    """
    try:
        anio = int(request.GET.get('anio', datetime.now().year))
        mes = int(request.GET.get('mes', datetime.now().month))
        
        logger.info(f"📊 [Endpoint] Mapa: {anio}-{mes:02d}")
        
        data = pospago_service_optimized.get_mapa_calor(anio, mes)
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en mapa: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False, 'datos': []}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def comparativo_cantadas_activadas(request):
    """
    Endpoint: Comparativo cantadas vs activadas
    GET /api/pospago/comparativo/?anio=2025&mes=12
    
    Retorna:
    - Cantadas, activadas y tasa por tipo de venta
    """
    try:
        anio = int(request.GET.get('anio', datetime.now().year))
        mes = int(request.GET.get('mes', datetime.now().month))
        
        logger.info(f"📊 [Endpoint] Comparativo: {anio}-{mes:02d}")
        
        data = pospago_service_optimized.get_comparativo_cantadas_activadas(anio, mes)
        
        return Response({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ [Endpoint] Error en comparativo: {str(e)}")
        return Response({
            'success': False,
            'error': str(e),
            'data': {'tiene_datos': False, 'comparativo': []}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)