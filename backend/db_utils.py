# dashboard/utils/db_utils.py
"""
Utilidades para manejar conexiones y consultas a SQL Server
"""

import pyodbc
import pandas as pd
from typing import Dict, List, Any, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SQLServerConnection:
    """
    Clase para manejar conexiones a SQL Server de manera segura
    """
    
    def __init__(self, database_alias='ventas_db'):
        """
        Inicializa la conexión
        
        Args:
            database_alias: 'ventas_db' o 'whatsapp_db'
        """
        self.database_alias = database_alias
        self.connection = None
        self.cursor = None
    
    def __enter__(self):
        """Método para usar con 'with' statement"""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Cierra la conexión automáticamente"""
        self.close()
    
    def connect(self):
        """Establece la conexión a SQL Server"""
        try:
            db_settings = settings.DATABASES.get(self.database_alias)
            
            if not db_settings:
                raise ValueError(f"Database alias '{self.database_alias}' no encontrado en settings")
            
            # Construir cadena de conexión
            conn_str = (
                f"DRIVER={{{db_settings['OPTIONS']['driver']}}};"
                f"SERVER={db_settings['HOST']},{db_settings['PORT']};"
                f"DATABASE={db_settings['NAME']};"
                f"UID={db_settings['USER']};"
                f"PWD={db_settings['PASSWORD']};"
                f"{db_settings['OPTIONS']['extra_params']}"
            )
            
            self.connection = pyodbc.connect(conn_str, timeout=30)
            self.cursor = self.connection.cursor()
            
            logger.info(f"✅ Conexión exitosa a {self.database_alias}")
            
        except Exception as e:
            logger.error(f"❌ Error conectando a {self.database_alias}: {str(e)}")
            raise
    
    def close(self):
        """Cierra la conexión"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            logger.info(f"🔒 Conexión cerrada: {self.database_alias}")
    
    def execute_query(self, query: str, params: tuple = None) -> List[tuple]:
        """
        Ejecuta una query y retorna los resultados
        
        Args:
            query: SQL query
            params: Parámetros para la query (opcional)
        
        Returns:
            Lista de tuplas con los resultados
        """
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            
            results = self.cursor.fetchall()
            return results
            
        except Exception as e:
            logger.error(f"❌ Error ejecutando query: {str(e)}")
            logger.error(f"Query: {query}")
            raise
    
    def execute_query_to_df(self, query: str, params: tuple = None) -> pd.DataFrame:
        """
        Ejecuta una query y retorna un DataFrame de pandas
        
        Args:
            query: SQL query
            params: Parámetros para la query (opcional)
        
        Returns:
            DataFrame con los resultados
        """
        try:
            if params:
                df = pd.read_sql(query, self.connection, params=params)
            else:
                df = pd.read_sql(query, self.connection)
            
            return df
            
        except Exception as e:
            logger.error(f"❌ Error ejecutando query a DataFrame: {str(e)}")
            logger.error(f"Query: {query}")
            raise
    
    def get_table_columns(self, table_name: str, schema: str = 'dbo') -> List[Dict[str, Any]]:
        """
        Obtiene las columnas de una tabla
        
        Args:
            table_name: Nombre de la tabla
            schema: Schema de la tabla (default: 'dbo')
        
        Returns:
            Lista de diccionarios con información de las columnas
        """
        query = """
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        """
        
        results = self.execute_query(query, (schema, table_name))
        
        columns = []
        for row in results:
            columns.append({
                'name': row[0],
                'type': row[1],
                'max_length': row[2],
                'nullable': row[3] == 'YES'
            })
        
        return columns


def get_ventas_connection():
    """Helper para obtener conexión a DB_Ventas"""
    return SQLServerConnection('ventas_db')


def get_whatsapp_connection():
    """Helper para obtener conexión a DB_Whatsapp"""
    return SQLServerConnection('whatsapp_db')


def test_connection(database_alias: str = 'ventas_db') -> Dict[str, Any]:
    """
    Prueba la conexión a una base de datos
    
    Args:
        database_alias: 'ventas_db' o 'whatsapp_db'
    
    Returns:
        Diccionario con el resultado de la prueba
    """
    result = {
        'success': False,
        'database': database_alias,
        'message': '',
        'tables': []
    }
    
    try:
        with SQLServerConnection(database_alias) as conn:
            # Obtener versión de SQL Server
            version_query = "SELECT @@VERSION"
            version = conn.execute_query(version_query)[0][0]
            
            # Obtener lista de tablas
            tables_query = """
                SELECT TABLE_SCHEMA, TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_TYPE = 'BASE TABLE'
                ORDER BY TABLE_SCHEMA, TABLE_NAME
            """
            tables = conn.execute_query(tables_query)
            
            result['success'] = True
            result['message'] = 'Conexión exitosa'
            result['version'] = version[:100]
            result['tables'] = [f"{schema}.{table}" for schema, table in tables]
            
    except Exception as e:
        result['message'] = f'Error: {str(e)}'
    
    return result