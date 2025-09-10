#!/usr/bin/env python3
"""
🔍 EXPLORADOR DE BASE DE DATOS MAIRA
Conecta a la DB en línea y muestra estructura y contenido de tablas militares
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

def connect_to_db():
    """Conecta a la base de datos usando las mismas credenciales que app.py"""
    try:
        # Priorizar DATABASE_URL (producción)
        DATABASE_URL = os.environ.get('DATABASE_URL')
        
        if DATABASE_URL:
            print(f"🔗 Conectando via DATABASE_URL...")
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            print("✅ Conexión exitosa!")
            return conn
        
        # Fallback local
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            database=os.environ.get('DB_NAME', 'maira_db'),
            user=os.environ.get('DB_USER', 'postgres'),
            password=os.environ.get('DB_PASSWORD', ''),
            port=os.environ.get('DB_PORT', '5432'),
            cursor_factory=RealDictCursor
        )
        print("✅ Conexión local exitosa!")
        return conn
        
    except Exception as e:
        print(f"❌ Error conectando: {e}")
        return None

def list_tables(cursor):
    """Lista todas las tablas de la base de datos"""
    print("\n📋 TABLAS DISPONIBLES:")
    print("=" * 50)
    
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    for table in tables:
        print(f"📄 {table['table_name']}")
    
    return [table['table_name'] for table in tables]

def describe_table(cursor, table_name):
    """Muestra estructura de una tabla"""
    print(f"\n🏗️ ESTRUCTURA DE {table_name.upper()}:")
    print("=" * 60)
    
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    
    columns = cursor.fetchall()
    for col in columns:
        nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
        default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
        print(f"  📌 {col['column_name']:<20} {col['data_type']:<15} {nullable}{default}")

def show_table_content(cursor, table_name, limit=5):
    """Muestra contenido de una tabla (limitado)"""
    print(f"\n📊 CONTENIDO DE {table_name.upper()} (primeros {limit} registros):")
    print("=" * 80)
    
    try:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT %s", (limit,))
        rows = cursor.fetchall()
        
        if not rows:
            print("  📭 Tabla vacía")
            return
        
        # Mostrar encabezados
        headers = list(rows[0].keys())
        print("  " + " | ".join(f"{h:<15}" for h in headers))
        print("  " + "-" * (len(headers) * 17))
        
        # Mostrar datos
        for row in rows:
            values = [str(row[h])[:15] if row[h] is not None else "NULL" for h in headers]
            print("  " + " | ".join(f"{v:<15}" for v in values))
            
    except Exception as e:
        print(f"  ❌ Error leyendo tabla: {e}")

def explore_military_tables(cursor):
    """Explora tablas específicas para transitabilidad militar"""
    
    military_tables = [
        'armamento', 'municiones', 'vehicles', 'unidades', 
        'unidades_vehiculos', 'vehiculos_municion'
    ]
    
    print("\n🎖️ ANÁLISIS DE TABLAS MILITARES PARA TRANSITABILIDAD")
    print("=" * 70)
    
    for table in military_tables:
        try:
            # Verificar si existe
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = %s
                );
            """, (table,))
            
            exists = cursor.fetchone()['exists']
            
            if exists:
                print(f"\n✅ {table.upper()}")
                describe_table(cursor, table)
                show_table_content(cursor, table, 3)
            else:
                print(f"\n❌ {table.upper()} - NO EXISTE")
                
        except Exception as e:
            print(f"\n⚠️ {table.upper()} - ERROR: {e}")

def main():
    """Función principal"""
    print("🔍 EXPLORADOR DE BASE DE DATOS MAIRA v1.0")
    print("Analizando estructura para implementar transitabilidad...")
    
    # Conectar
    conn = connect_to_db()
    if not conn:
        print("❌ No se pudo conectar a la base de datos")
        sys.exit(1)
    
    try:
        cursor = conn.cursor()
        
        # Listar todas las tablas
        all_tables = list_tables(cursor)
        
        # Analizar tablas militares específicas
        explore_military_tables(cursor)
        
        print(f"\n✅ Exploración completada. Total de tablas: {len(all_tables)}")
        
    except Exception as e:
        print(f"❌ Error durante exploración: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
