#!/usr/bin/env python3
"""
test_sqlserver_connection.py
Script para probar la conexión a SQL Server

Uso:
    python test_sqlserver_connection.py
"""

import pyodbc
import sys
from datetime import datetime

# Configuración de conexión
SQLSERVER_CONFIG = {
    'server': '100.126.28.123,9500',  # Formato: host,puerto
    'user': 'usr_admin',
    'password': 'An4l1t1c$_01',
    'databases': ['DB_Ventas', 'DB_Whatsapp']
}

def test_connection(database_name):
    """
    Prueba la conexión a una base de datos específica de SQL Server
    """
    print(f"\n{'='*60}")
    print(f"🔍 Probando conexión a: {database_name}")
    print(f"{'='*60}")
    
    try:
        # Construcción de la cadena de conexión
        conn_str = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={SQLSERVER_CONFIG['server']};"
            f"DATABASE={database_name};"
            f"UID={SQLSERVER_CONFIG['user']};"
            f"PWD={SQLSERVER_CONFIG['password']};"
            f"TrustServerCertificate=yes;"
            f"Encrypt=yes;"
        )
        
        print(f"⏳ Conectando a {database_name}...")
        
        # Intentar conexión
        conn = pyodbc.connect(conn_str, timeout=10)
        cursor = conn.cursor()
        
        print(f"✅ Conexión exitosa a {database_name}!")
        
        # Probar una consulta simple
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        print(f"\n📌 Versión de SQL Server:")
        print(f"   {version[:100]}...")
        
        # Listar tablas disponibles
        print(f"\n📋 Listando tablas en {database_name}:")
        cursor.execute("""
            SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)
        
        tables = cursor.fetchall()
        if tables:
            print(f"   Total de tablas: {len(tables)}\n")
            for idx, (schema, table_name, table_type) in enumerate(tables[:20], 1):
                print(f"   {idx}. [{schema}].[{table_name}]")
            
            if len(tables) > 20:
                print(f"   ... y {len(tables) - 20} tablas más")
        else:
            print("   ⚠️  No se encontraron tablas")
        
        # Buscar tablas específicas mencionadas
        print(f"\n🔎 Buscando tablas específicas:")
        tables_to_find = ['sellerV9', 'sellerV9Cortes', 'R5']
        
        for table in tables_to_find:
            cursor.execute("""
                SELECT TABLE_SCHEMA, TABLE_NAME
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME LIKE ?
            """, f'%{table}%')
            
            found = cursor.fetchall()
            if found:
                print(f"   ✅ Encontrada(s) tabla(s) similar(es) a '{table}':")
                for schema, tname in found:
                    print(f"      - [{schema}].[{tname}]")
            else:
                print(f"   ❌ No se encontró tabla similar a '{table}'")
        
        cursor.close()
        conn.close()
        
        return True
        
    except pyodbc.Error as e:
        print(f"❌ Error de conexión a {database_name}:")
        print(f"   {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado:")
        print(f"   {str(e)}")
        return False

def main():
    """
    Función principal
    """
    print(f"\n🚀 INICIANDO PRUEBA DE CONEXIÓN SQL SERVER")
    print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n📊 Configuración:")
    print(f"   Servidor: {SQLSERVER_CONFIG['server']}")
    print(f"   Usuario: {SQLSERVER_CONFIG['user']}")
    print(f"   Bases de datos: {', '.join(SQLSERVER_CONFIG['databases'])}")
    
    results = {}
    
    # Probar cada base de datos
    for db in SQLSERVER_CONFIG['databases']:
        results[db] = test_connection(db)
    
    # Resumen
    print(f"\n{'='*60}")
    print(f"📊 RESUMEN DE CONEXIONES")
    print(f"{'='*60}")
    
    for db, success in results.items():
        status = "✅ EXITOSA" if success else "❌ FALLIDA"
        print(f"   {db}: {status}")
    
    # Código de salida
    all_success = all(results.values())
    if all_success:
        print(f"\n✅ Todas las conexiones fueron exitosas!")
        sys.exit(0)
    else:
        print(f"\n⚠️  Algunas conexiones fallaron. Revisa los errores arriba.")
        sys.exit(1)

if __name__ == "__main__":
    main()