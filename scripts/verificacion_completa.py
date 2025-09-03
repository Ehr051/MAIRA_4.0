#!/usr/bin/env python3
"""
Verificación Completa del Sistema MAIRA
Verifica que todas las rutas y dependencias funcionen correctamente
"""

import os
import sys
import json
import urllib.request
import time
from pathlib import Path

def verificar_archivo_existe(ruta, descripcion):
    """Verifica que un archivo exista"""
    if os.path.exists(ruta):
        print(f"✅ {descripcion}: {ruta}")
        return True
    else:
        print(f"❌ {descripcion}: {ruta} - NO ENCONTRADO")
        return False

def verificar_mini_tiles():
    """Verifica el sistema mini-tiles"""
    print("\n🔧 VERIFICANDO SISTEMA MINI-TILES:")
    
    archivos_criticos = [
        ("mini_tiles_github/master_mini_tiles_index.json", "Índice Maestro"),
        ("Client/js/mini_tiles_loader.js", "Loader Frontend"),
        ("dev-tools/mini_tiles_loader.js", "Loader Dev-Tools"),
    ]
    
    errores = 0
    for ruta, desc in archivos_criticos:
        if not verificar_archivo_existe(ruta, desc):
            errores += 1
    
    # Verificar índice maestro
    if os.path.exists("mini_tiles_github/master_mini_tiles_index.json"):
        try:
            with open("mini_tiles_github/master_mini_tiles_index.json", 'r') as f:
                index = json.load(f)
            print(f"  📊 Provincias: {index.get('total_provincias', 'N/A')}")
            print(f"  📦 Archivos TAR: {index.get('total_tar_files', 'N/A')}")
            
            # Verificar algunos archivos TAR
            tar_verificados = 0
            for provincia, data in index.get('provincias', {}).items():
                for tar_file in data.get('tar_files', [])[:2]:  # Solo 2 por provincia
                    if os.path.exists(f"mini_tiles_github/{tar_file}"):
                        tar_verificados += 1
                    if tar_verificados >= 5:  # Verificar máximo 5
                        break
                if tar_verificados >= 5:
                    break
            
            print(f"  ✅ Archivos TAR verificados: {tar_verificados}/5 muestras")
            
        except Exception as e:
            print(f"  ❌ Error leyendo índice maestro: {e}")
            errores += 1
    
    return errores

def verificar_html_rutas():
    """Verifica rutas en archivos HTML"""
    print("\n📄 VERIFICANDO RUTAS EN HTML:")
    
    html_files = list(Path("static").glob("*.html"))
    problemas = 0
    
    for html_file in html_files[:5]:  # Solo primeros 5 para no saturar
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Buscar rutas problemáticas
            rutas_problematicas = [
                'src="/Client/',   # Rutas absolutas incorrectas
                'href="/Client/',
                'src="Client/',    # Rutas sin ../
                'href="Client/',
            ]
            
            problemas_archivo = []
            for ruta in rutas_problematicas:
                if ruta in contenido:
                    problemas_archivo.append(ruta)
            
            if problemas_archivo:
                print(f"  ⚠️ {html_file}: {problemas_archivo}")
                problemas += len(problemas_archivo)
            else:
                print(f"  ✅ {html_file}: Rutas correctas")
                
        except Exception as e:
            print(f"  ❌ Error verificando {html_file}: {e}")
            problemas += 1
    
    return problemas

def verificar_dependencias_cdn():
    """Verifica que las dependencias CDN estén disponibles"""
    print("\n🌐 VERIFICANDO DEPENDENCIAS CDN:")
    
    urls_criticas = [
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js",
        "https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js",
        "https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json"
    ]
    
    errores = 0
    for url in urls_criticas:
        try:
            req = urllib.request.Request(url)
            req.get_method = lambda: 'HEAD'
            response = urllib.request.urlopen(req, timeout=10)
            if response.getcode() == 200:
                print(f"  ✅ {url.split('/')[-1]}: Disponible")
            else:
                print(f"  ⚠️ {url.split('/')[-1]}: HTTP {response.getcode()}")
                errores += 1
        except Exception as e:
            print(f"  ❌ {url.split('/')[-1]}: {str(e)[:50]}...")
            errores += 1
    
    return errores

def verificar_servidor_local():
    """Verifica que el servidor local pueda iniciarse"""
    print("\n🌐 VERIFICANDO SERVIDOR LOCAL:")
    
    try:
        # Verificar que el puerto esté libre
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 8080))
        sock.close()
        
        if result == 0:
            print("  ⚠️ Puerto 8080 ocupado - servidor ya ejecutándose")
            return 0
        else:
            print("  ✅ Puerto 8080 disponible")
            
        # Verificar archivos del servidor
        servidor_ok = verificar_archivo_existe("scripts/servidor_demo.py", "Servidor Demo")
        
        if servidor_ok:
            print("  ✅ Servidor listo para ejecutar")
            print("  💡 Ejecuta: python scripts/servidor_demo.py")
            return 0
        else:
            return 1
            
    except Exception as e:
        print(f"  ❌ Error verificando servidor: {e}")
        return 1

def main():
    print("🔍 VERIFICACIÓN COMPLETA DEL SISTEMA MAIRA")
    print("=" * 60)
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print(f"📁 Directorio del proyecto: {project_dir}")
    
    # Ejecutar verificaciones
    total_errores = 0
    
    total_errores += verificar_mini_tiles()
    total_errores += verificar_html_rutas()
    total_errores += verificar_dependencias_cdn()
    total_errores += verificar_servidor_local()
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIÓN:")
    
    if total_errores == 0:
        print("🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("✅ Todas las verificaciones pasaron exitosamente")
        print("🚀 El sistema MAIRA está listo para usar")
        print()
        print("🛠️ COMANDOS PARA EMPEZAR:")
        print("   python scripts/servidor_demo.py        # Servidor de desarrollo")
        print("   python scripts/app.py                  # Aplicación principal")
        print("   python scripts/crear_mini_tiles.py     # Regenerar tiles")
        print()
        return 0
    else:
        print(f"⚠️ SE ENCONTRARON {total_errores} PROBLEMAS")
        print("🔧 Revisa los errores mostrados arriba")
        print("💡 Ejecuta las correcciones necesarias")
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
