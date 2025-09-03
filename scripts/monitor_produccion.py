#!/usr/bin/env python3
"""
Monitor de Estado MAIRA Producción
Verifica que los cambios de emergencia estén funcionando
"""

try:
    import requests
except ImportError:
    print("❌ Error: 'requests' no está instalado. Instalar con: pip install requests")
    exit(1)

import json
import time
from urllib.parse import urljoin

def verificar_url(url, descripcion):
    """Verifica que una URL responda correctamente"""
    try:
        response = requests.head(url, timeout=10)
        if response.status_code == 200:
            print(f"  ✅ {descripcion}: OK")
            return True
        else:
            print(f"  ⚠️ {descripcion}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ {descripcion}: {str(e)[:50]}...")
        return False

def verificar_tiles_v3():
    """Verifica que el sistema tiles v3.0 esté funcionando"""
    print("\n🔧 VERIFICANDO SISTEMA TILES V3.0:")
    
    urls_criticas = [
        ("https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json", "Índice Maestro"),
        ("https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/centro_mini_tiles_index.json", "Índice Centro"),
        ("https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/norte_mini_tiles_index.json", "Índice Norte"),
    ]
    
    exitos = 0
    for url, desc in urls_criticas:
        if verificar_url(url, desc):
            exitos += 1
    
    return exitos == len(urls_criticas)

def verificar_dependencias_cdn():
    """Verifica que las dependencias CDN estén disponibles"""
    print("\n🌐 VERIFICANDO DEPENDENCIAS CDN:")
    
    dependencias = [
        ("https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js", "milsymbol"),
        ("https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js", "geocoder"),
        ("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leaflet"),
        ("https://d3js.org/d3.v7.min.js", "d3.js"),
    ]
    
    exitos = 0
    for url, desc in dependencias:
        if verificar_url(url, desc):
            exitos += 1
    
    return exitos == len(dependencias)

def verificar_aplicacion_produccion():
    """Verifica que la aplicación en Render esté funcionando"""
    print("\n🚀 VERIFICANDO APLICACIÓN EN PRODUCCIÓN:")
    
    base_url = "https://maira-3e76.onrender.com"
    
    endpoints = [
        ("/", "Página Principal"),
        ("/static/planeamiento.html", "Módulo Planeamiento"),
        ("/static/juegodeguerra.html", "Módulo Juego de Guerra"),
        ("/Client/js/emergency-patch.js", "Parche de Emergencia"),
    ]
    
    exitos = 0
    for endpoint, desc in endpoints:
        url = urljoin(base_url, endpoint)
        if verificar_url(url, desc):
            exitos += 1
    
    return exitos == len(endpoints)

def main():
    print("🔍 MONITOR DE ESTADO MAIRA PRODUCCIÓN")
    print("=" * 60)
    print("🎯 Verificando correcciones aplicadas")
    print("📅 Timestamp:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    
    # Ejecutar verificaciones
    tiles_ok = verificar_tiles_v3()
    cdn_ok = verificar_dependencias_cdn()
    app_ok = verificar_aplicacion_produccion()
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE VERIFICACIÓN:")
    print(f"  🔧 Sistema Tiles v3.0: {'✅ OK' if tiles_ok else '❌ FALLO'}")
    print(f"  🌐 Dependencias CDN: {'✅ OK' if cdn_ok else '❌ FALLO'}")
    print(f"  🚀 Aplicación Producción: {'✅ OK' if app_ok else '❌ FALLO'}")
    
    if tiles_ok and cdn_ok and app_ok:
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("✅ Todas las correcciones aplicadas exitosamente")
        print("🌐 La aplicación debería funcionar correctamente")
        print()
        print("🧪 PRÓXIMOS PASOS:")
        print("1. Abrir https://maira-3e76.onrender.com/static/planeamiento.html")
        print("2. Abrir consola del navegador")
        print("3. Ejecutar: verificarEstadoMAIRA()")
        print("4. Probar perfil de elevación")
        print("5. Verificar que milsymbol y geocoder funcionen")
        return 0
    else:
        print("\n⚠️ ALGUNOS SISTEMAS AÚN TIENEN PROBLEMAS")
        print("🔄 Espera unos minutos para que Render termine el deploy")
        print("🔧 Si persisten los problemas, revisa los logs de Render")
        return 1

if __name__ == "__main__":
    import sys
    
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n🛑 Verificación cancelada por usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante verificación: {e}")
        sys.exit(1)
