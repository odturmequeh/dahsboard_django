# dashboard/services/pospago_service_optimized.py
"""
Servicio optimizado de Pospago - COMPLETO CON CORTES
- Fix de fechas (format_date)
- Debug JSON automático
- Endpoint de cortes incluido
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging
import pyodbc
import pandas as pd
import json
import os

from dashboard.sql_queries.pospago_queries import (
    QUERY_METAS_OBJETIVOS,
    QUERY_CIERRE_DIA_ANTERIOR,
    QUERY_CORTES_DIA_HOY,
    QUERY_EVOLUCION_VENTAS,
    QUERY_DESGLOSE_SEMANAL,
    QUERY_MAPA_CALOR,
    QUERY_MAPA_CALOR_RESUMEN,
    QUERY_COMPARATIVO_CANTADAS_ACTIVADAS
)

logger = logging.getLogger(__name__)

# Directorio para guardar JSONs de debug
DEBUG_DIR = os.path.join(os.path.dirname(__file__), '..', 'debug_jsons')
os.makedirs(DEBUG_DIR, exist_ok=True)


# def #save_debug_json(name: str, data: Any):
#     """Guarda JSON para debug"""
#     try:
#         filepath = os.path.join(DEBUG_DIR, f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
#         with open(filepath, 'w', encoding='utf-8') as f:
#             json.dump(data, f, indent=2, ensure_ascii=False, default=str)
#         logger.info(f"💾 JSON guardado: {filepath}")
#     except Exception as e:
#         logger.error(f"❌ Error guardando JSON: {e}")


def format_date(value) -> str:
    """Convierte fecha a string YYYY-MM-DD"""
    if pd.isna(value):
        return None
    if isinstance(value, str):
        return value[:10]  # Tomar solo YYYY-MM-DD
    if hasattr(value, 'strftime'):
        return value.strftime('%Y-%m-%d')
    return str(value)[:10]


def get_sql_server_connection():
    """Crea conexión a SQL Server"""
    try:
        drivers = [d for d in pyodbc.drivers() if 'SQL Server' in d]
        if not drivers:
            raise Exception("No se encontró driver ODBC de SQL Server")
        
        conn_str = (
            f"DRIVER={{{drivers[0]}}};"
            f"SERVER=100.126.28.123,9500;"
            f"DATABASE=DB_Ventas;"
            f"UID=usr_admin;"
            f"PWD=An4l1t1c$_01;"
        )
        
        return pyodbc.connect(conn_str, timeout=30)
    except Exception as e:
        logger.error(f"❌ Error conectando a SQL Server: {e}")
        raise


def execute_query(query: str, params: tuple = None) -> pd.DataFrame:
    """Ejecuta query y retorna DataFrame"""
    conn = None
    try:
        conn = get_sql_server_connection()
        df = pd.read_sql(query, conn, params=params) if params else pd.read_sql(query, conn)
        logger.info(f"✅ Query ejecutada: {len(df)} filas")
        return df
    except Exception as e:
        logger.error(f"❌ Error ejecutando query: {e}")
        raise
    finally:
        if conn:
            conn.close()


class PospagoServiceOptimized:
    """Servicio optimizado usando vistas de SQL Server - COMPLETO"""
    
    def get_metas_objetivos(self, anio: int, mes: int) -> Dict[str, Any]:
        """Obtiene metas, ejecución, cumplimiento y proyecciones"""
        try:
            logger.info(f"📊 Obteniendo metas: {anio}-{mes:02d}")
            
            df = execute_query(QUERY_METAS_OBJETIVOS, params=(anio, mes))
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': f'No hay datos para {anio}-{mes:02d}'
                }
                #save_debug_json('metas_EMPTY', result)
                return result
            
            row = df.iloc[0]
            
            result = {
                'tiene_datos': True,
                'anio': int(row['anio']),
                'mes': int(row['mes']),
                'dias_habiles': {
                    'migra': {
                        'transcurridos': float(row['dias_transcurridos_migra']),
                        'totales': float(row['dias_totales_migra'])
                    },
                    'porta': {
                        'transcurridos': float(row['dias_transcurridos_porta']),
                        'totales': float(row['dias_totales_porta'])
                    }
                },
                'total': {
                    'meta': float(row['meta_total']),
                    'ejecucion': float(row['ejec_total']),
                    'cumplimiento': float(row['cumpl_total']),
                    'proyeccion': float(row['proy_total']),
                    'cumpl_proyeccion': float(row['cumpl_proy_total']),
                    'productividad_diaria': float(row['prod_diaria_total'])
                },
                'migracion': {
                    'meta': float(row['meta_total_migra']),
                    'ejecucion': float(row['ejec_total_migra']),
                    'cumplimiento': float(row['cumpl_total_migra']),
                    'proyeccion': float(row['proy_total_migra']),
                    'cumpl_proyeccion': float(row['cumpl_proy_total_migra']),
                    'productividad_diaria': float(row['prod_diaria_total_migra'])
                },
                'portabilidad': {
                    'meta': float(row['meta_total_porta']),
                    'ejecucion': float(row['ejec_total_porta']),
                    'cumplimiento': float(row['cumpl_total_porta']),
                    'proyeccion': float(row['proy_total_porta']),
                    'cumpl_proyeccion': float(row['cumpl_proy_total_porta']),
                    'productividad_diaria': float(row['prod_diaria_total_porta'])
                },
                'porta_ecommerce': {
                    'meta': float(row['meta_porta_ecomm']),
                    'ejecucion': float(row['ejec_porta_ecomm']),
                    'cumplimiento': float(row['cumpl_porta_ecomm']),
                    'proyeccion': float(row['proy_porta_ecomm']),
                    'cumpl_proyeccion': float(row['cumpl_proy_porta_ecomm']),
                    'productividad_diaria': float(row['prod_diaria_porta_ecomm'])
                },
                'ctw': {
                    'meta': float(row['meta_ctw']),
                    'ejecucion': float(row['ejec_ctw']),
                    'cumplimiento': float(row['cumpl_ctw']),
                    'proyeccion': float(row['proy_ctw']),
                    'cumpl_proyeccion': float(row['cumpl_proy_ctw']),
                    'productividad_diaria': float(row['prod_diaria_ctw'])
                },
                'linea_nueva': {
                    'meta': float(row['meta_ln']),
                    'ejecucion': float(row['ejec_ln']),
                    'cumplimiento': float(row['cumpl_ln']),
                    'proyeccion': float(row['proy_ln']),
                    'cumpl_proyeccion': float(row['cumpl_proy_ln']),
                    'productividad_diaria': float(row['prod_diaria_ln'])
                }
            }
            
            #save_debug_json('metas', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_metas_objetivos: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_cierre_dia_anterior(self) -> Dict[str, Any]:
        """Obtiene cierre del día anterior con comparativos"""
        try:
            logger.info("📊 Obteniendo cierre día anterior")
            
            df = execute_query(QUERY_CIERRE_DIA_ANTERIOR)
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': 'No hay datos del día anterior'
                }
                #save_debug_json('cierre_EMPTY', result)
                return result
            
            row = df.iloc[0]
            
            result = {
                'tiene_datos': True,
                'fecha': format_date(row['fecha']),
                'cantadas': {
                    'total': int(row['cantadas_total']),
                    'migraciones': int(row['migra_cantadas']),
                    'portabilidades': int(row['porta_cantadas']),
                    'linea_nueva': int(row['ln_cantadas'])
                },
                'activadas': {
                    'total': int(row['activadas_total']),
                    'migraciones': int(row['migra_activadas']),
                    'portabilidades_total': int(row['porta_activadas']),
                    'porta_ecommerce': int(row['porta_ecomm_activadas']),
                    'ctw': int(row['ctw_activadas']),
                    'linea_nueva': int(row['ln_activadas'])
                },
                'tasa_activacion': float(row['tasa_activacion']),
                'comparativos': {
                    'semana_anterior': {
                        'activadas': int(row['activadas_semana_ant']),
                        'variacion_pct': float(row['var_semana_ant'])
                    },
                    'mes_anterior': {
                        'activadas': int(row['activadas_mes_ant']),
                        'variacion_pct': float(row['var_mes_ant'])
                    }
                }
            }
            
            #save_debug_json('cierre', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_cierre_dia_anterior: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_cortes_dia_hoy(self) -> Dict[str, Any]:
        """Obtiene cortes del día actual por franjas horarias"""
        try:
            logger.info("📊 Obteniendo cortes del día")
            
            df = execute_query(QUERY_CORTES_DIA_HOY)
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': 'No hay cortes del día actual'
                }
                #save_debug_json('cortes_EMPTY', result)
                return result
            
            cortes_por_franja = []
            for _, row in df.iterrows():
                cortes_por_franja.append({
                    'franja': row['corte'],
                    'cantadas': int(row['cantadas_franja']),
                    'migraciones': int(row['migra_franja']),
                    'portabilidades': int(row['porta_franja']),
                    'linea_nueva': int(row['ln_franja']),
                    'total': int(row['cantadas_franja'])
                })
            
            # Calcular totales
            total_cantadas = sum(c['cantadas'] for c in cortes_por_franja)
            total_migra = sum(c['migraciones'] for c in cortes_por_franja)
            total_porta = sum(c['portabilidades'] for c in cortes_por_franja)
            total_ln = sum(c['linea_nueva'] for c in cortes_por_franja)
            
            result = {
                'tiene_datos': True,
                'fecha': datetime.now().strftime('%Y-%m-%d'),
                'cortes_por_franja': cortes_por_franja,
                'totales': {
                    'cantadas': total_cantadas,
                    'migraciones': total_migra,
                    'portabilidades': total_porta,
                    'linea_nueva': total_ln
                }
            }
            
            #save_debug_json('cortes', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_cortes_dia_hoy: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_evolucion_ventas(self, anio: int, mes: int) -> Dict[str, Any]:
        """Obtiene evolución diaria de ventas"""
        try:
            logger.info(f"📊 Obteniendo evolución: {anio}-{mes:02d}")
            
            # Query necesita 7 parámetros (anio, mes repetidos)
            df = execute_query(QUERY_EVOLUCION_VENTAS, 
                             params=(anio, mes, anio, mes, anio, mes, anio, mes))
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': f'No hay datos para {anio}-{mes:02d}'
                }
                #save_debug_json('evolucion_EMPTY', result)
                return result
            
            datos_diarios = []
            for _, row in df.iterrows():
                datos_diarios.append({
                    'fecha': format_date(row['fecha']),
                    'r5': {
                        'total': int(row['R5_total']),
                        'migraciones': int(row['R5_migra']),
                        'portabilidades': int(row['R5_porta']),
                        'ctw': int(row['R5_ctw']),
                        'linea_nueva': int(row['R5_ln'])
                    },
                    'v9': {
                        'total': int(row['V9_total']),
                        'migraciones': int(row['V9_migra']),
                        'portabilidades': int(row['V9_porta'])
                    },
                    'metas_diarias': {
                        'total': float(row['meta_diaria_total']),
                        'migraciones': float(row['meta_diaria_migra']),
                        'portabilidades': float(row['meta_diaria_porta']),
                        'linea_nueva': float(row['meta_diaria_ln'])
                    }
                })
            
            promedios = {
                'r5': float(df.iloc[0]['promedio_r5']),
                'v9': float(df.iloc[0]['promedio_v9']),
                'meta': float(df.iloc[0]['promedio_meta'])
            }
            
            result = {
                'tiene_datos': True,
                'datos_diarios': datos_diarios,
                'promedios': promedios
            }
            
            #save_debug_json('evolucion', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_evolucion_ventas: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_desglose_semanal(self, anio: int, mes: int) -> Dict[str, Any]:
        """Obtiene desglose por semana CON cumplimiento"""
        try:
            logger.info(f"📊 Obteniendo desglose semanal: {anio}-{mes:02d}")
            
            # Query necesita 6 parámetros (anio, mes repetidos)
            df = execute_query(QUERY_DESGLOSE_SEMANAL, params=(anio, mes, anio, mes, anio, mes))
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': f'No hay datos para {anio}-{mes:02d}'
                }
                #save_debug_json('desglose_EMPTY', result)
                return result
            
            semanas = []
            for _, row in df.iterrows():
                semanas.append({
                    'numero_semana': int(row['semana']),
                    'fecha_inicio': format_date(row['fecha_inicio']),
                    'fecha_fin': format_date(row['fecha_fin']),
                    'migraciones': int(row['migraciones']),
                    'portabilidades_total': int(row['portabilidades_total']),
                    'porta_ecommerce': int(row['porta_ecommerce']),
                    'ctw': int(row['ctw']),
                    'linea_nueva': int(row['linea_nueva']),
                    'total': int(row['total']),
                    'dias_semana': int(row['dias_semana']),
                    'meta_semana': float(row['meta_semana']),
                    'cumplimiento': float(row['cumplimiento'])  # ← Ahora viene del backend
                })
            
            total_mes = sum(s['total'] for s in semanas)
            
            result = {
                'tiene_datos': True,
                'semanas': semanas,
                'total_mes': total_mes
            }
            
            #save_debug_json('desglose', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_desglose_semanal: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_mapa_calor(self, anio: int, mes: int) -> Dict[str, Any]:
        """Obtiene mapa de calor y resumen"""
        try:
            logger.info(f"📊 Obteniendo mapa de calor: {anio}-{mes:02d}")
            
            df_mapa = execute_query(QUERY_MAPA_CALOR, params=(anio, mes))
            df_resumen = execute_query(QUERY_MAPA_CALOR_RESUMEN, params=(anio, mes))
            
            if df_mapa.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': f'No hay datos para {anio}-{mes:02d}'
                }
                #save_debug_json('mapa_EMPTY', result)
                return result
            
            datos = []
            for _, row in df_mapa.iterrows():
                datos.append({
                    'semana_mes': int(row['semana_mes']),
                    'dia_semana_num': int(row['dia_semana_num']),
                    'dia_semana': row['dia_semana'],
                    'cantidad': int(row['cantidad'])
                })
            
            resumen = {}
            if not df_resumen.empty:
                row_resumen = df_resumen.iloc[0]
                resumen = {
                    'mejor_semana': row_resumen['mejor_semana'],
                    'mejor_dia': row_resumen['mejor_dia'],
                    'total': int(row_resumen['total_R5'])
                }
            
            result = {
                'tiene_datos': True,
                'datos': datos,
                'resumen': resumen
            }
            
            #save_debug_json('mapa', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_mapa_calor: {e}")
            return {'tiene_datos': False, 'error': str(e)}
    
    def get_comparativo_cantadas_activadas(self, anio: int, mes: int) -> Dict[str, Any]:
        """Obtiene comparativo cantadas vs activadas"""
        try:
            logger.info(f"📊 Obteniendo comparativo: {anio}-{mes:02d}")
            
            df = execute_query(QUERY_COMPARATIVO_CANTADAS_ACTIVADAS, 
                             params=(anio, mes, anio, mes, anio, mes, anio, mes, anio, mes, anio, mes))
            
            if df.empty:
                result = {
                    'tiene_datos': False,
                    'mensaje': f'No hay datos para {anio}-{mes:02d}'
                }
                #save_debug_json('comparativo_EMPTY', result)
                return result
            
            comparativo = []
            for _, row in df.iterrows():
                comparativo.append({
                    'tipo': row['tipo'],
                    'cantadas': int(row['cantadas']),
                    'activadas': int(row['activadas']),
                    'tasa_activacion': float(row['tasa_activacion'])
                })
            
            result = {
                'tiene_datos': True,
                'comparativo': comparativo
            }
            
            #save_debug_json('comparativo', result)
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en get_comparativo_cantadas_activadas: {e}")
            return {'tiene_datos': False, 'error': str(e)}



# Instancia singleton
pospago_service_optimized = PospagoServiceOptimized()