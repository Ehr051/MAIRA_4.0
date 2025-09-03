#!/usr/bin/env python3
"""
Corrector de Producción MAIRA
Corrige problemas específicos encontrados en https://maira-3e76.onrender.com/
"""

import os
import re
import glob
from pathlib import Path

def corregir_dependencias_cdn():
    """Asegura que milsymbol y geocoder usen CDN"""
    print("🔧 CORRIGIENDO DEPENDENCIAS CDN")
    
    # Buscar archivos HTML que puedan necesitar corrección
    archivos_html = glob.glob("**/*.html", recursive=True)
    
    correcciones = 0
    for archivo in archivos_html:
        if 'node_modules' in archivo or '.git' in archivo:
            continue
            
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Asegurar milsymbol desde CDN
            if 'milsymbol' in contenido.lower():
                # Reemplazar cualquier referencia local por CDN
                contenido = re.sub(
                    r'src=["\'][^"\']*milsymbol[^"\']*["\']',
                    'src="https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js"',
                    contenido
                )
                
            # Asegurar geocoder desde CDN
            if 'geocoder' in contenido.lower():
                contenido = re.sub(
                    r'src=["\'][^"\']*geocoder[^"\']*["\']',
                    'src="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js"',
                    contenido
                )
                
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"  ✅ Corregido: {archivo}")
                correcciones += 1
                
        except Exception as e:
            print(f"  ❌ Error en {archivo}: {e}")
    
    return correcciones

def corregir_github_release_version():
    """Corrige referencias al release incorrecto tiles-v1.0 -> tiles-v3.0"""
    print("\n🔧 CORRIGIENDO VERSIÓN DE GITHUB RELEASE")
    
    archivos_js = glob.glob("**/*.js", recursive=True)
    correcciones = 0
    
    for archivo in archivos_js:
        if 'node_modules' in archivo or '.git' in archivo:
            continue
            
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir versión del release
            contenido = contenido.replace('tiles-v1.0', 'tiles-v3.0')
            contenido = contenido.replace('tiles-v2.0', 'tiles-v3.0')
            
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"  ✅ Corregido: {archivo}")
                correcciones += 1
                
        except Exception as e:
            print(f"  ❌ Error en {archivo}: {e}")
    
    return correcciones

def corregir_elevacion_handler():
    """Corrige el elevationHandler para usar el sistema correcto"""
    print("\n🔧 CORRIGIENDO ELEVATION HANDLER")
    
    # Buscar elevationHandler.js
    elevation_files = glob.glob("**/elevationHandler.js", recursive=True)
    
    if not elevation_files:
        print("  ❌ No se encontró elevationHandler.js")
        return 0
    
    for archivo in elevation_files:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Verificar si necesita corrección
            if 'tiles-v3.0' not in contenido:
                # Corregir URLs del sistema de tiles
                contenido = re.sub(
                    r'tiles-v[0-9]+\.[0-9]+',
                    'tiles-v3.0',
                    contenido
                )
                
                # Asegurar que use las URLs correctas
                if 'baseUrls' in contenido or 'github.com/Ehr051/MAIRA' in contenido:
                    contenido = re.sub(
                        r'github\.com/Ehr051/MAIRA/releases/download/tiles-v[^/]+/',
                        'github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
                        contenido
                    )
                
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                
                print(f"  ✅ Corregido: {archivo}")
                return 1
            else:
                print(f"  ➡️ Ya actualizado: {archivo}")
                return 0
                
        except Exception as e:
            print(f"  ❌ Error en {archivo}: {e}")
            return 0

def crear_config_produccion():
    """Crea archivo de configuración específico para producción"""
    print("\n🔧 CREANDO CONFIGURACIÓN DE PRODUCCIÓN")
    
    config_content = """// Configuración específica para producción MAIRA
// Auto-generado por corrector_produccion.py

window.MAIRA_PRODUCTION_CONFIG = {
    // URLs corregidas para mini-tiles v3.0
    TILES_BASE_URLS: [
        'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
        'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'
    ],
    
    // CDN para dependencias críticas
    CDN_DEPENDENCIES: {
        milsymbol: 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js',
        geocoder: 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js',
        leaflet: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        d3: 'https://d3js.org/d3.v7.min.js'
    },
    
    // Configuración de CORS
    CORS_ENABLED: true,
    
    // Timeout para requests
    REQUEST_TIMEOUT: 30000,
    
    // Reintentos automáticos
    MAX_RETRIES: 3
};

// Auto-aplicar configuración
console.log('🚀 Configuración de producción MAIRA cargada');
"""
    
    config_path = "Client/js/production-config.js"
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(config_content)
    
    print(f"  ✅ Creado: {config_path}")
    return 1

def verificar_archivos_criticos():
    """Verifica que los archivos críticos existan"""
    print("\n🔍 VERIFICANDO ARCHIVOS CRÍTICOS")
    
    archivos_criticos = [
        "mini_tiles_github/master_mini_tiles_index.json",
        "Client/js/mini_tiles_loader.js",
        "Client/js/elevationHandler.js",
    ]
    
    faltantes = []
    for archivo in archivos_criticos:
        if os.path.exists(archivo):
            print(f"  ✅ {archivo}")
        else:
            print(f"  ❌ FALTANTE: {archivo}")
            faltantes.append(archivo)
    
    return len(faltantes) == 0

def main():
    print("🚨 CORRECTOR DE PRODUCCIÓN MAIRA")
    print("=" * 60)
    print("🎯 Objetivo: Corregir https://maira-3e76.onrender.com/")
    print("=" * 60)
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print(f"📁 Directorio del proyecto: {project_dir}")
    
    total_correcciones = 0
    
    # Ejecutar correcciones
    total_correcciones += corregir_dependencias_cdn()
    total_correcciones += corregir_github_release_version()
    total_correcciones += corregir_elevacion_handler()
    total_correcciones += crear_config_produccion()
    
    # Verificar estado final
    archivos_ok = verificar_archivos_criticos()
    
    # Resumen
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE CORRECCIONES:")
    print(f"  🔧 Total de correcciones aplicadas: {total_correcciones}")
    print(f"  📄 Archivos críticos: {'✅ OK' if archivos_ok else '❌ FALTANTES'}")
    
    if total_correcciones > 0:
        print("\n🎯 ACCIONES REQUERIDAS:")
        print("1. 📤 Commit y push los cambios:")
        print("   git add .")
        print("   git commit -m '🚨 Corrección urgente producción - tiles v3.0 + CDN'")
        print("   git push")
        print()
        print("2. 🔄 Redeploy en Render:")
        print("   - El deploy automático debería activarse")
        print("   - O hacer redeploy manual desde el dashboard")
        print()
        print("3. 🧪 Verificar en producción:")
        print("   - Abrir https://maira-3e76.onrender.com/")
        print("   - Probar perfil de elevación")
        print("   - Verificar que milsymbol y geocoder carguen")
        
        return 0
    else:
        print("\n➡️ No se requirieron correcciones")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
