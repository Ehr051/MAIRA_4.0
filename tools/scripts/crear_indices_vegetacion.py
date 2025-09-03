#!/usr/bin/env python3
"""
Script para crear índices de vegetación compatibles con el CDN
"""

import json
import os

def crear_indices_vegetacion_cdn():
    """Crear archivos de índice de vegetación para el CDN basados en archivos locales"""
    
    base_path = "tiles_por_provincias"
    output_path = "indices"
    
    # Crear directorio de salida si no existe
    os.makedirs(output_path, exist_ok=True)
    
    # Mapeo de archivos locales a archivos de índice CDN
    mapeo_archivos = {
        "vegetacion_centro.json": "centro_mini_tiles_index.json",
        "vegetacion_centro_norte.json": "centro_norte_mini_tiles_index.json", 
        "vegetacion_norte.json": "norte_mini_tiles_index.json",
        "vegetacion_patagonia.json": "patagonia_mini_tiles_index.json",
        "vegetacion_sur.json": "sur_mini_tiles_index.json"
    }
    
    for archivo_local, archivo_cdn in mapeo_archivos.items():
        archivo_path = os.path.join(base_path, archivo_local)
        
        if os.path.exists(archivo_path):
            print(f"🌿 Procesando {archivo_local} -> {archivo_cdn}")
            
            with open(archivo_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # El archivo ya tiene la estructura correcta, solo copiarlo
            output_file = os.path.join(output_path, archivo_cdn)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Creado {archivo_cdn} con {len(data.get('tiles', {}))} tiles")
        else:
            print(f"⚠️ Archivo no encontrado: {archivo_path}")
    
    print("\n🎉 ¡Índices de vegetación creados exitosamente!")
    print("📁 Los archivos están en el directorio 'indices/'")
    print("📋 Próximo paso: subir estos archivos al release de GitHub")

if __name__ == "__main__":
    crear_indices_vegetacion_cdn()
