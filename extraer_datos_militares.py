#!/usr/bin/env python3
"""
Extractor de datos militares desde MAIRA.json para crear estructura JSON modular
Separa datos sensibles militares de datos de aplicación
"""

import json
import os
from datetime import datetime

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

def extraer_datos_militares():
    """Extrae solo datos militares sensibles"""
    
    tablas = cargar_json_mysql()
    
    # Tablas militares a extraer
    tablas_militares = [
        'armamento',
        'armamento_municion', 
        'municiones',
        'vehicles',
        'animals',
        'unidades',
        'roles_combate',
        'unidades_armamento',
        'unidades_roles',
        'unidades_vehiculos',
        'vehiculos_municion'
    ]
    
    datos_militares = {
        "metadata": {
            "version": "1.0.0",
            "extracted_date": datetime.now().isoformat(),
            "source": "MySQL_MAIRA_Original",
            "classification": "RESERVADO",
            "description": "Datos militares estáticos - Argentina"
        }
    }
    
    # Extraer cada tabla militar
    for tabla in tablas_militares:
        if tabla in tablas:
            datos_militares[tabla] = tablas[tabla]
            print(f"✅ Extraída {tabla}: {len(tablas[tabla])} registros")
        else:
            datos_militares[tabla] = []
            print(f"⚠️ {tabla}: No encontrada, creando vacía")
    
    return datos_militares

def procesar_armamento_municion(datos_militares):
    """Procesa y completa datos de armamento-munición basado en tu descripción"""
    
    # Datos que mencionaste: pistola 13x3, FAL 20x5, FAP 20x6, MAG valijines 250
    municiones_por_arma = {
        "Browning HP": {
            "capacidad_cargador": 13,
            "cantidad_cargadores": 3,
            "total_municiones": 39,
            "tipo_carga": "cargadores",
            "observaciones": "Pistola estándar"
        },
        "FAL": {
            "capacidad_cargador": 20,
            "cantidad_cargadores": 5,
            "total_municiones": 100,
            "tipo_carga": "cargadores",
            "observaciones": "Fusil principal infantería"
        },
        "FAP": {
            "capacidad_cargador": 20,
            "cantidad_cargadores": 6,
            "total_municiones": 120,
            "tipo_carga": "cargadores",
            "observaciones": "Fusil ametrallador pesado"
        },
        "MAG": {
            "capacidad_cargador": 250,
            "cantidad_cargadores": 4,
            "total_municiones": 1000,
            "tipo_carga": "valijines",
            "observaciones": "Ametralladora propósito general - valijines de 250 disparos"
        },
        "MG74": {
            "capacidad_cargador": 250,
            "cantidad_cargadores": 4,
            "total_municiones": 1000,
            "tipo_carga": "valijines",
            "observaciones": "Ametralladora propósito general - valijines de 250 disparos"
        }
    }
    
    # Actualizar datos de armamento con municiones
    for arma in datos_militares['armamento']:
        nombre_arma = arma.get('nombre')
        if nombre_arma in municiones_por_arma:
            arma.update(municiones_por_arma[nombre_arma])
            print(f"  🔫 {nombre_arma}: {arma['total_municiones']} disparos")
    
    return datos_militares

def crear_estructura_jerarquica():
    """Crea estructura jerárquica basada en magnitudes SIDC"""
    
    return {
        "magnitudes": {
            "E": {
                "name": "Equipo",
                "personnel_min": 3,
                "personnel_max": 8,
                "subordinates": [],
                "typical_roles": ["Tirador", "Jefe de Equipo", "Apoyo"]
            },
            "G": {
                "name": "Grupo", 
                "personnel_min": 8,
                "personnel_max": 15,
                "subordinates": ["E"],
                "typical_roles": ["Jefe de Grupo", "Tiradores", "Apoyo", "Comunicaciones"]
            },
            "S": {
                "name": "Sección",
                "personnel_min": 15,
                "personnel_max": 30,
                "subordinates": ["G"],
                "typical_roles": ["Jefe de Sección", "Grupos de Tiradores", "Grupo de Apoyo"]
            },
            "SU": {
                "name": "Subunidad",
                "personnel_min": 80,
                "personnel_max": 150,
                "subordinates": ["S"],
                "typical_roles": ["Comandante", "Secciones", "Puesto Comando", "Logística"]
            },
            "U": {
                "name": "Unidad",
                "personnel_min": 400,
                "personnel_max": 800,
                "subordinates": ["SU"],
                "typical_roles": ["Comandante", "Subunidades", "Estado Mayor", "Servicios"]
            }
        }
    }

def guardar_datos_militares():
    """Guarda todos los datos militares en JSON"""
    
    print("🚀 EXTRAYENDO DATOS MILITARES...")
    
    # Extraer datos base
    datos_militares = extraer_datos_militares()
    
    # Procesar municiones
    print("\n🔫 PROCESANDO ARMAMENTO Y MUNICIONES...")
    datos_militares = procesar_armamento_municion(datos_militares)
    
    # Agregar estructura jerárquica
    print("\n📊 CREANDO ESTRUCTURA JERÁRQUICA...")
    datos_militares["jerarquia_militar"] = crear_estructura_jerarquica()
    
    # Crear directorio
    os.makedirs('/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/data', exist_ok=True)
    
    # Guardar archivo principal
    archivo_militar = '/Users/mac/Documents/GitHub/MAIRA-4.0/MAIRA-4.0/Client/data/military_data.json'
    with open(archivo_militar, 'w', encoding='utf-8') as f:
        json.dump(datos_militares, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ DATOS MILITARES GUARDADOS EN: {archivo_militar}")
    print(f"📋 Tamaño del archivo: {os.path.getsize(archivo_militar) / 1024:.1f} KB")
    
    return archivo_militar

if __name__ == "__main__":
    guardar_datos_militares()
