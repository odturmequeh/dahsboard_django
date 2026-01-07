"""
Script para listar columnas REALES de las tablas
Ejecutar: python check_columns.py
"""

import pyodbc

print("🔍 VERIFICANDO COLUMNAS DE LAS TABLAS")
print("=" * 80)

try:
    # Detectar driver
    drivers = [d for d in pyodbc.drivers() if 'SQL Server' in d]
    driver = drivers[0]
    
    # Conectar con SQL Auth
    conn_str = (
        f"DRIVER={{{driver}}};"
        f"SERVER=100.126.28.123,9500;"
        f"DATABASE=DB_Ventas;"
        f"UID=usr_admin;"
        f"PWD=An4l1t1c$_01;"
    )
    
    print("📡 Conectando a DB_Ventas...")
    conn = pyodbc.connect(conn_str, timeout=10)
    cursor = conn.cursor()
    print("✅ Conexión exitosa\n")
    
    # Tablas a verificar
    tablas = [
        'tb_seller_v9',
        'tb_R5', 
        'tb_trafico_ga4',
        'tb_calendario',
        'tb_presupuesto_fijo_movil'
    ]
    
    for tabla in tablas:
        print(f"\n{'='*80}")
        print(f"📋 TABLA: {tabla}")
        print(f"{'='*80}")
        
        try:
            # Listar columnas
            cursor.execute(f"""
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    CHARACTER_MAXIMUM_LENGTH,
                    IS_NULLABLE
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = '{tabla}'
                ORDER BY ORDINAL_POSITION
            """)
            
            columnas = cursor.fetchall()
            
            if columnas:
                print(f"\n✅ Total de columnas: {len(columnas)}\n")
                print(f"{'N°':<4} {'NOMBRE COLUMNA':<40} {'TIPO':<15} {'LARGO':<10} {'NULL':<5}")
                print("-" * 80)
                
                for i, col in enumerate(columnas, 1):
                    nombre, tipo, largo, nullable = col
                    largo_str = str(largo) if largo else '-'
                    print(f"{i:<4} {nombre:<40} {tipo:<15} {largo_str:<10} {nullable:<5}")
                    
                # Mostrar primeras 3 filas de datos
                print(f"\n📊 PRIMERAS 3 FILAS DE DATOS:")
                print("-" * 80)
                
                cursor.execute(f"SELECT TOP 3 * FROM {tabla}")
                rows = cursor.fetchall()
                
                if rows:
                    # Mostrar nombres de columnas
                    col_names = [desc[0] for desc in cursor.description]
                    print(" | ".join(col_names[:5]))  # Primeras 5 columnas
                    print("-" * 80)
                    
                    for row in rows:
                        valores = [str(v)[:20] if v is not None else 'NULL' for v in row[:5]]
                        print(" | ".join(valores))
                else:
                    print("⚠️ La tabla no tiene datos")
                    
            else:
                print(f"❌ Tabla '{tabla}' no existe o no tiene columnas")
                
        except Exception as e:
            print(f"❌ Error con tabla '{tabla}': {str(e)}")
    
    conn.close()
    
    print("\n" + "=" * 80)
    print("✅ ANÁLISIS COMPLETADO")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ Error: {e}")