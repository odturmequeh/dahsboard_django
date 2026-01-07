# database_config.py
# Configuración de conexiones a SQL Server
# Ubicar este archivo en la carpeta backend/ junto a settings.py

import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de SQL Server
SQL_SERVER_CONFIG = {
    'ventas': {
        'ENGINE': 'mssql',
        'NAME': 'DB_Ventas',
        'USER': os.getenv('SQLSERVER_USER'),
        'PASSWORD': os.getenv('SQLSERVER_PASSWORD'),
        'HOST': os.getenv('SQLSERVER_HOST'),
        'PORT': os.getenv('SQLSERVER_PORT'),
        'OPTIONS': {
            'driver':  'ODBC Driver 17 for SQL Server', 
            'extra_params': 'TrustServerCertificate=yes;'
        },
    },
    'whatsapp': {
        'ENGINE': 'mssql',
        'NAME': 'DB_Whatsapp',
        'USER': os.getenv('SQLSERVER_USER'),
        'PASSWORD': os.getenv('SQLSERVER_PASSWORD'),
        'HOST': os.getenv('SQLSERVER_HOST'),
        'PORT': os.getenv('SQLSERVER_PORT'),
        'OPTIONS': {
            'driver':  'ODBC Driver 17 for SQL Server', 
            'extra_params': 'TrustServerCertificate=yes;'
        },
    }
}

# Función para obtener la configuración de base de datos
def get_database_config():
    """
    Retorna la configuración completa de bases de datos para settings.py
    Incluye SQLite (default) y las dos bases de SQL Server
    """
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    return {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        },
        'ventas_db': SQL_SERVER_CONFIG['ventas'],
        'whatsapp_db': SQL_SERVER_CONFIG['whatsapp'],
    }