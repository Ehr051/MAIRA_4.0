#!/usr/bin/env python3
"""
Script de migración de estructura MySQL original a PostgreSQL
Agrega campos faltantes y migra datos de MAIRA.json
"""

import psycopg2
import json
import os
from dotenv import load_dotenv

load_dotenv()

def migrar_estructura_vehicles():
    """Agrega campos de movilidad faltantes a tabla vehicles"""
    
    campos_movilidad = [
        "ADD COLUMN IF NOT EXISTS capacity_personal INTEGER",
        "ADD COLUMN IF NOT EXISTS cargo_capacity VARCHAR(50)", 
        "ADD COLUMN IF NOT EXISTS supplementary_tank NUMERIC(10,2)",
        "ADD COLUMN IF NOT EXISTS autonomy_without_supplement NUMERIC(10,2)",
        "ADD COLUMN IF NOT EXISTS autonomy_with_supplement NUMERIC(10,2)",
        "ADD COLUMN IF NOT EXISTS mobility_road NUMERIC(3,2) DEFAULT 1.00",
        "ADD COLUMN IF NOT EXISTS mobility_offroad NUMERIC(3,2) DEFAULT 0.80",
        "ADD COLUMN IF NOT EXISTS mobility_forest NUMERIC(3,2) DEFAULT 0.60", 
        "ADD COLUMN IF NOT EXISTS mobility_mountain NUMERIC(3,2) DEFAULT 0.70",
        "ADD COLUMN IF NOT EXISTS mobility_urban NUMERIC(3,2) DEFAULT 0.80",
        "ADD COLUMN IF NOT EXISTS mobility_desert NUMERIC(3,2) DEFAULT 0.90",
        "ADD COLUMN IF NOT EXISTS mobility_snow NUMERIC(3,2) DEFAULT 0.60",
        "ADD COLUMN IF NOT EXISTS mobility_swamp NUMERIC(3,2) DEFAULT 0.30"
    ]
    
    return campos_movilidad

def migrar_estructura_armamento():
    """Agrega campos de efectividad faltantes a tabla armamento"""
    
    campos_efectividad = [
        "ADD COLUMN IF NOT EXISTS cadencia_de_tiro INTEGER",
        "ADD COLUMN IF NOT EXISTS municion_calibre VARCHAR(20)",
        "ADD COLUMN IF NOT EXISTS municion_tipoA VARCHAR(50)",
        "ADD COLUMN IF NOT EXISTS municion_tipoB VARCHAR(50)", 
        "ADD COLUMN IF NOT EXISTS municion_tipoC VARCHAR(50)",
        "ADD COLUMN IF NOT EXISTS municion_tipoD VARCHAR(50)",
        "ADD COLUMN IF NOT EXISTS capacidad_cargador INTEGER",
        "ADD COLUMN IF NOT EXISTS cantidad_cargadores INTEGER",
        "ADD COLUMN IF NOT EXISTS dano_contra TEXT",
        "ADD COLUMN IF NOT EXISTS radio_accion INTEGER",
        "ADD COLUMN IF NOT EXISTS efectivo_contra TEXT"
    ]
    
    return campos_efectividad

def crear_tabla_animals():
    """Crea tabla animals que falta en PostgreSQL"""
    
    sql_animals = """
    CREATE TABLE IF NOT EXISTS animals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        capacity_personal INTEGER,
        cargo_capacity VARCHAR(50),
        mobility_road NUMERIC(3,2) DEFAULT 1.00,
        mobility_offroad NUMERIC(3,2) DEFAULT 0.80,
        mobility_forest NUMERIC(3,2) DEFAULT 0.60,
        mobility_mountain NUMERIC(3,2) DEFAULT 0.70,
        mobility_urban NUMERIC(3,2) DEFAULT 0.80,
        mobility_desert NUMERIC(3,2) DEFAULT 0.90,
        mobility_snow NUMERIC(3,2) DEFAULT 0.60,
        mobility_swamp NUMERIC(3,2) DEFAULT 0.30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    return sql_animals

def ejecutar_migracion():
    """Ejecuta toda la migración"""
    
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        print("🚀 INICIANDO MIGRACIÓN DE ESTRUCTURA...")
        
        # 1. Migrar vehicles
        print("📊 Migrando estructura de vehicles...")
        for campo in migrar_estructura_vehicles():
            try:
                cur.execute(f"ALTER TABLE vehicles {campo};")
                print(f"  ✅ {campo}")
            except Exception as e:
                print(f"  ⚠️ {campo}: {e}")
        
        # 2. Migrar armamento  
        print("🔫 Migrando estructura de armamento...")
        for campo in migrar_estructura_armamento():
            try:
                cur.execute(f"ALTER TABLE armamento {campo};")
                print(f"  ✅ {campo}")
            except Exception as e:
                print(f"  ⚠️ {campo}: {e}")
        
        # 3. Crear tabla animals
        print("🐎 Creando tabla animals...")
        cur.execute(crear_tabla_animals())
        print("  ✅ Tabla animals creada")
        
        conn.commit()
        print("🎉 MIGRACIÓN DE ESTRUCTURA COMPLETADA")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    ejecutar_migracion()
