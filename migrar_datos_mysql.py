#!/usr/bin/env python3
"""
Script para migrar datos desde MAIRA.json (MySQL) a PostgreSQL
"""

import psycopg2
import json
import os
from dotenv import load_dotenv

load_dotenv()

def cargar_json_mysql():
    """Carga datos desde MAIRA.json"""
    
    with open('/Users/mac/Downloads/MAIRA.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extraer tablas
    tablas = {}
    for item in data:
        if item.get('type') == 'table':
            nombre_tabla = item.get('name')
            datos_tabla = item.get('data', [])
            tablas[nombre_tabla] = datos_tabla
    
    return tablas

def migrar_vehicles(cur, datos_vehicles):
    """Migra datos de vehicles"""
    
    print(f"📊 Migrando {len(datos_vehicles)} vehículos...")
    
    # Limpiar tabla actual
    cur.execute("DELETE FROM vehicles;")
    cur.execute("ALTER SEQUENCE vehicles_id_seq RESTART WITH 1;")
    
    for vehicle in datos_vehicles:
        sql = """
        INSERT INTO vehicles (
            name, type, capacity_personal, cargo_capacity, 
            fuel_capacity, supplementary_tank, fuel_consumption,
            autonomy_without_supplement, autonomy_with_supplement,
            mobility_road, mobility_offroad, mobility_forest, 
            mobility_mountain, mobility_urban, mobility_desert,
            mobility_snow, mobility_swamp
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        );
        """
        
        def safe_float(val, default=None):
            """Convierte a float manejando None"""
            if val is None or val == "null":
                return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default
        
        def safe_int(val, default=None):
            """Convierte a int manejando None"""
            if val is None or val == "null":
                return default
            try:
                return int(val)
            except (ValueError, TypeError):
                return default
        
        valores = (
            vehicle.get('name'),
            vehicle.get('type'),
            safe_int(vehicle.get('capacity_personal'), None),
            vehicle.get('cargo_capacity'),
            safe_float(vehicle.get('fuel_capacity'), None),
            safe_float(vehicle.get('supplementary_tank'), None),
            safe_float(vehicle.get('fuel_consumption'), None),
            safe_float(vehicle.get('autonomy_without_supplement'), None),
            safe_float(vehicle.get('autonomy_with_supplement'), None),
            safe_float(vehicle.get('mobility_road'), 1.0),
            safe_float(vehicle.get('mobility_offroad'), 0.8),
            safe_float(vehicle.get('mobility_forest'), 0.6),
            safe_float(vehicle.get('mobility_mountain'), 0.7),
            safe_float(vehicle.get('mobility_urban'), 0.8),
            safe_float(vehicle.get('mobility_desert'), 0.9),
            safe_float(vehicle.get('mobility_snow'), 0.6),
            safe_float(vehicle.get('mobility_swamp'), 0.3)
        )
        
        cur.execute(sql, valores)
        print(f"  ✅ {vehicle.get('name')}")

def migrar_armamento(cur, datos_armamento):
    """Migra datos de armamento"""
    
    print(f"🔫 Migrando {len(datos_armamento)} armamentos...")
    
    # Limpiar tabla actual
    cur.execute("DELETE FROM armamento;")
    cur.execute("ALTER SEQUENCE armamento_id_seq RESTART WITH 1;")
    
    for arma in datos_armamento:
        sql = """
        INSERT INTO armamento (
            nombre, tipo, calibre, alcance_efectivo, alcance_maximo,
            cadencia_de_tiro, peso, municion_calibre, municion_tipoA,
            municion_tipoB, municion_tipoC, municion_tipoD,
            capacidad_cargador, cantidad_cargadores, dano_contra,
            radio_accion, efectivo_contra
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        );
        """
        
        def safe_float(val, default=None):
            """Convierte a float manejando None"""
            if val is None or val == "null":
                return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default
        
        def safe_int(val, default=None):
            """Convierte a int manejando None"""
            if val is None or val == "null":
                return default
            try:
                return int(val)
            except (ValueError, TypeError):
                return default
        
        valores = (
            arma.get('nombre'),
            arma.get('tipo'),
            arma.get('calibre'),
            safe_int(arma.get('alcance_efectivo'), None),
            safe_int(arma.get('alcance_maximo'), None),
            safe_int(arma.get('cadencia_de_tiro'), None),
            safe_float(arma.get('peso'), None),
            arma.get('municion_calibre'),
            arma.get('municion_tipoA'),
            arma.get('municion_tipoB'),
            arma.get('municion_tipoC'),
            arma.get('municion_tipoD'),
            safe_int(arma.get('capacidad_cargador'), None),
            safe_int(arma.get('cantidad_cargadores'), None),
            arma.get('daño_contra'),  # Nota: en JSON es 'daño_contra'
            safe_int(arma.get('radio_accion'), None),
            arma.get('efectivo_contra')
        )
        
        cur.execute(sql, valores)
        print(f"  ✅ {arma.get('nombre')}")

def migrar_animals(cur, datos_animals):
    """Migra datos de animals"""
    
    print(f"🐎 Migrando {len(datos_animals)} animales...")
    
    # Limpiar tabla actual
    cur.execute("DELETE FROM animals;")
    cur.execute("ALTER SEQUENCE animals_id_seq RESTART WITH 1;")
    
    for animal in datos_animals:
        sql = """
        INSERT INTO animals (
            name, type, capacity_personal, cargo_capacity,
            mobility_road, mobility_offroad, mobility_forest,
            mobility_mountain, mobility_urban, mobility_desert,
            mobility_snow, mobility_swamp
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        );
        """
        
        def safe_float(val, default=None):
            """Convierte a float manejando None"""
            if val is None or val == "null":
                return default
            try:
                return float(val)
            except (ValueError, TypeError):
                return default
        
        def safe_int(val, default=None):
            """Convierte a int manejando None"""
            if val is None or val == "null":
                return default
            try:
                return int(val)
            except (ValueError, TypeError):
                return default
        
        valores = (
            animal.get('name'),
            animal.get('type'),
            safe_int(animal.get('capacity_personal'), None),
            animal.get('cargo_capacity'),
            safe_float(animal.get('mobility_road'), 1.0),
            safe_float(animal.get('mobility_offroad'), 0.8),
            safe_float(animal.get('mobility_forest'), 0.6),
            safe_float(animal.get('mobility_mountain'), 0.7),
            safe_float(animal.get('mobility_urban'), 0.8),
            safe_float(animal.get('mobility_desert'), 0.9),
            safe_float(animal.get('mobility_snow'), 0.6),
            safe_float(animal.get('mobility_swamp'), 0.3)
        )
        
        cur.execute(sql, valores)
        print(f"  ✅ {animal.get('name')}")

def ejecutar_migracion_datos():
    """Ejecuta migración completa de datos"""
    
    try:
        # Cargar datos MySQL
        print("📂 Cargando datos desde MAIRA.json...")
        tablas = cargar_json_mysql()
        
        # Conectar a PostgreSQL
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        print("🚀 INICIANDO MIGRACIÓN DE DATOS...")
        
        # Migrar vehicles
        if 'vehicles' in tablas:
            migrar_vehicles(cur, tablas['vehicles'])
        
        # Migrar armamento
        if 'armamento' in tablas:
            migrar_armamento(cur, tablas['armamento'])
        
        # Migrar animals
        if 'animals' in tablas:
            migrar_animals(cur, tablas['animals'])
        
        conn.commit()
        print("🎉 MIGRACIÓN DE DATOS COMPLETADA")
        
        # Verificar resultados
        print("\n📊 VERIFICACIÓN DE RESULTADOS:")
        cur.execute("SELECT COUNT(*) FROM vehicles;")
        print(f"  Vehicles: {cur.fetchone()[0]} registros")
        
        cur.execute("SELECT COUNT(*) FROM armamento;")
        print(f"  Armamento: {cur.fetchone()[0]} registros")
        
        cur.execute("SELECT COUNT(*) FROM animals;")
        print(f"  Animals: {cur.fetchone()[0]} registros")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en migración de datos: {e}")
        conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    ejecutar_migracion_datos()
