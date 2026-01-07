# dashboard/services/integration_service.py
"""
Servicio de Integración - VERSIÓN CORREGIDA
Sin dependencia de dashboard.utils
"""

import logging
import pyodbc
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


def get_sql_server_connection():
    """
    Crea conexión a SQL Server sin depender de dashboard.utils
    """
    try:
        # Detectar driver disponible
        drivers = [d for d in pyodbc.drivers() if 'SQL Server' in d]
        if not drivers:
            raise Exception("No se encontró ningún driver ODBC de SQL Server")
        
        driver = drivers[0]
        
        # Configuración
        server = getattr(settings, 'SQLSERVER_HOST', '100.126.28.123')
        port = getattr(settings, 'SQLSERVER_PORT', '9500')
        database = 'DB_Ventas'
        
        # Intentar con autenticación de Windows primero
        logger.info(f"Intentando conexión con Windows Auth a {server}:{port}")
        conn_str = (
            f"DRIVER={{{driver}}};"
            f"SERVER={server},{port};"
            f"DATABASE={database};"
            f"Trusted_Connection=yes;"
            f"TrustServerCertificate=yes;"
            f"Encrypt=yes;"
        )
        
        try:
            connection = pyodbc.connect(conn_str, timeout=10)
            logger.info("✅ Conexión exitosa con Windows Auth")
            return connection
        except pyodbc.Error as e:
            logger.warning(f"⚠️ Windows Auth falló, intentando SQL Auth: {e}")
        
        # Si falla Windows Auth, intentar con SQL Auth
        username = getattr(settings, 'SQLSERVER_USER', None)
        password = getattr(settings, 'SQLSERVER_PASSWORD', None)
        
        if username and password:
            conn_str = (
                f"DRIVER={{{driver}}};"
                f"SERVER={server},{port};"
                f"DATABASE={database};"
                f"UID={username};"
                f"PWD={password};"
                f"TrustServerCertificate=yes;"
                f"Encrypt=yes;"
            )
            connection = pyodbc.connect(conn_str, timeout=10)
            logger.info("✅ Conexión exitosa con SQL Auth")
            return connection
        
        raise Exception("No se pudo conectar: ni Windows Auth ni SQL Auth funcionaron")
        
    except Exception as e:
        logger.error(f"❌ Error conectando a SQL Server: {str(e)}")
        raise


class IntegrationService:
    """
    Servicio para integrar datos de diferentes fuentes
    """
    
    def get_ventas_by_date_range(
        self,
        fecha_inicio: str,
        fecha_fin: str,
        filtros: Optional[Dict] = None
    ) -> pd.DataFrame:
        """
        Obtiene ventas en un rango de fechas
        """
        try:
            conn = get_sql_server_connection()
            
            query = """
            SELECT
                v.ID_TRANSACCION,
                CAST(v.FECHA_VENTA AS DATE) as FECHA,
                v.TIPO_VENTA,
                v.TELEFONO,
                v.CEDULA,
                r.ID_TRANSACCION as R5_ID
            FROM tb_seller_v9 v
            LEFT JOIN tb_R5 r
                ON v.ID_TRANSACCION = r.ID_TRANSACCION
                OR (v.TELEFONO = r.TELEFONO AND v.TELEFONO IS NOT NULL)
                OR (v.CEDULA = r.CEDULA AND v.CEDULA IS NOT NULL)
            WHERE CAST(v.FECHA_VENTA AS DATE) BETWEEN ? AND ?
            """
            
            # Agregar filtros adicionales
            if filtros and filtros.get('tipo_venta'):
                query += f" AND v.TIPO_VENTA = '{filtros['tipo_venta']}'"
            
            df = pd.read_sql(query, conn, params=(fecha_inicio, fecha_fin))
            conn.close()
            
            logger.info(f"✅ Obtenidas {len(df)} ventas entre {fecha_inicio} y {fecha_fin}")
            return df
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo ventas: {str(e)}")
            raise
    
    def get_trafico_ga4(
        self,
        fecha_inicio: str,
        fecha_fin: str
    ) -> pd.DataFrame:
        """
        Obtiene tráfico de GA4 en un rango de fechas
        """
        try:
            conn = get_sql_server_connection()
            
            query = """
            SELECT
                CAST(date AS DATE) as fecha,
                SUM(sessions) as sesiones,
                SUM(totalUsers) as usuarios
            FROM tb_trafico_ga4
            WHERE CAST(date AS DATE) BETWEEN ? AND ?
            GROUP BY CAST(date AS DATE)
            ORDER BY CAST(date AS DATE)
            """
            
            df = pd.read_sql(query, conn, params=(fecha_inicio, fecha_fin))
            conn.close()
            
            logger.info(f"✅ Obtenido tráfico GA4 entre {fecha_inicio} y {fecha_fin}")
            return df
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo tráfico GA4: {str(e)}")
            raise


# Instancia global del servicio
integration_service = IntegrationService()