#!/usr/bin/env python3
"""
Corrector de Rutas HTML para MAIRA
Corrige todas las rutas en archivos HTML después de la reorganización
"""

import os
import re
import glob
from pathlib import Path

def corregir_rutas_html(archivo_html):
    """Corrige las rutas en un archivo HTML específico"""
    print(f"📝 Procesando: {archivo_html}")
    
    with open(archivo_html, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    contenido_original = contenido
    cambios = 0
    
    # Correcciones específicas para archivos en static/
    correcciones = [
        # Rutas absolutas a Client/ desde static/
        (r'src="/Client/', 'src="../Client/'),
        (r'href="/Client/', 'href="../Client/'),
        
        # Rutas relativas incorrectas a Client/
        (r'src="Client/', 'src="../Client/'),
        (r'href="Client/', 'href="../Client/'),
        
        # Rutas a Server/ desde static/
        (r'src="/Server/', 'src="../Server/'),
        (r'href="/Server/', 'href="../Server/'),
        (r'src="Server/', 'src="../Server/'),
        (r'href="Server/', 'href="../Server/'),
        
        # Rutas a dev-tools/ desde static/
        (r'src="/dev-tools/', 'src="../dev-tools/'),
        (r'href="/dev-tools/', 'href="../dev-tools/'),
        (r'src="dev-tools/', 'src="../dev-tools/'),
        (r'href="dev-tools/', 'href="../dev-tools/'),
        
        # Rutas a scripts/ desde static/
        (r'src="/scripts/', 'src="../scripts/'),
        (r'href="/scripts/', 'href="../scripts/'),
        (r'src="scripts/', 'src="../scripts/'),
        (r'href="scripts/', 'href="../scripts/'),
        
        # URLs internas en JavaScript
        (r"'/Client/", "'../Client/"),
        (r'"/Client/', '"../Client/'),
        (r"'/Server/", "'../Server/"),
        (r'"/Server/', '"../Server/'),
    ]
    
    for patron, reemplazo in correcciones:
        matches = re.findall(patron, contenido)
        if matches:
            print(f"  🔧 {len(matches)} correcciones para: {patron}")
            contenido = re.sub(patron, reemplazo, contenido)
            cambios += len(matches)
    
    # Verificar si hay cambios
    if contenido != contenido_original:
        # Hacer backup
        backup_file = archivo_html + '.backup'
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(contenido_original)
        
        # Escribir archivo corregido
        with open(archivo_html, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print(f"  ✅ {cambios} cambios aplicados (backup: {backup_file})")
        return cambios
    else:
        print(f"  ➡️ No se requieren cambios")
        return 0

def verificar_rutas_especificas(archivo_html):
    """Verifica rutas específicas que podrían estar rotas"""
    with open(archivo_html, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Buscar patrones problemáticos
    patrones_problematicos = [
        r'src="(?!http|https|\.\./)([^"]*\.js)',   # JS sin ruta relativa correcta
        r'href="(?!http|https|\.\./)([^"]*\.css)', # CSS sin ruta relativa correcta
        r'src="\.\/(?!static)',                     # Rutas relativas incorrectas
        r'href="\.\/(?!static)',                    # Rutas relativas incorrectas
    ]
    
    problemas = []
    for patron in patrones_problematicos:
        matches = re.findall(patron, contenido)
        if matches:
            problemas.extend(matches)
    
    if problemas:
        print(f"  ⚠️ Posibles rutas problemáticas encontradas:")
        for problema in set(problemas):
            print(f"    - {problema}")
    
    return problemas

def main():
    print("🔧 CORRECTOR DE RUTAS HTML MAIRA")
    print("=" * 50)
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print(f"📁 Directorio del proyecto: {project_dir}")
    
    # Buscar todos los archivos HTML en static/
    html_files = glob.glob("static/*.html")
    
    if not html_files:
        print("❌ No se encontraron archivos HTML en static/")
        return 1
    
    print(f"\n📄 Archivos HTML encontrados: {len(html_files)}")
    for archivo in html_files:
        print(f"  - {archivo}")
    
    # Procesar cada archivo
    total_cambios = 0
    archivos_modificados = 0
    
    print(f"\n🔧 PROCESANDO ARCHIVOS...")
    
    for archivo in html_files:
        cambios = corregir_rutas_html(archivo)
        if cambios > 0:
            archivos_modificados += 1
            total_cambios += cambios
        
        # Verificar rutas problemáticas restantes
        verificar_rutas_especificas(archivo)
        print()
    
    # Resumen
    print("=" * 50)
    print(f"📊 RESUMEN:")
    print(f"  📄 Archivos procesados: {len(html_files)}")
    print(f"  ✏️ Archivos modificados: {archivos_modificados}")
    print(f"  🔧 Total de cambios: {total_cambios}")
    
    if total_cambios > 0:
        print(f"\n✅ Correcciones aplicadas exitosamente")
        print(f"💾 Backups guardados con extensión .backup")
        print(f"🧪 Verifica que todo funcione correctamente")
    else:
        print(f"\n➡️ No se requirieron correcciones")
    
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
