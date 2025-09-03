#!/usr/bin/env python3
"""
LIMPIEZA RADICAL MAIRA
Elimina TODOS los archivos innecesarios y deja solo lo esencial
"""

import os
import shutil
from pathlib import Path

def main():
    print("🚨 LIMPIEZA RADICAL DEL REPOSITORIO MAIRA")
    print("=" * 60)
    print("⚠️  ADVERTENCIA: Esta operación eliminará MUCHOS archivos")
    print("💾 Asegúrate de tener backup si hay algo importante")
    print()
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print(f"📁 Directorio del proyecto: {project_dir}")
    
    # ARCHIVOS Y CARPETAS QUE DEBEN MANTENERSE
    mantener = {
        # Archivos esenciales en raíz
        'README.md',
        'LICENSE', 
        'package.json',
        'package-lock.json',
        'requirements.txt',
        'runtime.txt',
        '.gitignore',
        '.gitattributes',
        '.env.example',
        'site.webmanifest',
        
        # Carpetas principales
        'Client/',
        'Server/',
        'scripts/',
        'static/',
        'mini_tiles_github/',
        'docs/',
        'tools/',
        'ssl/',
        'external_storage/',
        'uploads/',
        'indices/',
        'tiles_por_provincias/',
        
        # Sistema
        '.git/',
        '.vscode/',
        '.venv/',
        'node_modules/',
        '__pycache__/',
    }
    
    # ARCHIVOS A ELIMINAR (todos los que están sueltos en raíz)
    archivos_eliminar = []
    
    for item in os.listdir('.'):
        # Saltar carpetas ocultas y las que queremos mantener
        if item.startswith('.') or item in mantener:
            continue
            
        ruta = Path(item)
        
        # Si es archivo suelto en raíz, marcarlo para eliminar
        if ruta.is_file():
            # Excepciones específicas que SÍ queremos mantener
            if item in mantener:
                continue
                
            archivos_eliminar.append(item)
    
    # Mostrar lo que se va a eliminar
    print(f"\n📋 ARCHIVOS A ELIMINAR ({len(archivos_eliminar)}):")
    for archivo in sorted(archivos_eliminar)[:20]:  # Solo mostrar primeros 20
        print(f"  🗑️  {archivo}")
    
    if len(archivos_eliminar) > 20:
        print(f"  ... y {len(archivos_eliminar) - 20} archivos más")
    
    print(f"\n✅ ESTRUCTURA FINAL:")
    for item in sorted(mantener):
        if os.path.exists(item):
            print(f"  📁 {item}")
    
    # Confirmación
    print(f"\n⚠️  Se eliminarán {len(archivos_eliminar)} archivos")
    confirmar = input("¿Continuar? (escribe 'SI ELIMINAR' para confirmar): ")
    
    if confirmar != "SI ELIMINAR":
        print("❌ Operación cancelada")
        return 1
    
    # EJECUTAR LIMPIEZA
    print(f"\n🧹 INICIANDO LIMPIEZA...")
    eliminados = 0
    errores = 0
    
    for archivo in archivos_eliminar:
        try:
            if os.path.isfile(archivo):
                os.remove(archivo)
                print(f"  🗑️  {archivo}")
                eliminados += 1
            elif os.path.isdir(archivo):
                shutil.rmtree(archivo)
                print(f"  🗑️  {archivo}/ (directorio)")
                eliminados += 1
        except Exception as e:
            print(f"  ❌ Error eliminando {archivo}: {e}")
            errores += 1
    
    # Resumen
    print(f"\n" + "=" * 60)
    print(f"📊 LIMPIEZA COMPLETADA:")
    print(f"  🗑️  Archivos eliminados: {eliminados}")
    print(f"  ❌ Errores: {errores}")
    print(f"  ✅ Archivos mantenidos: {len([x for x in mantener if os.path.exists(x)])}")
    
    if eliminados > 0:
        print(f"\n🎯 PRÓXIMOS PASOS:")
        print(f"1. Verificar que todo funciona:")
        print(f"   python scripts/servidor_demo.py")
        print(f"2. Hacer commit de la limpieza:")
        print(f"   git add .")
        print(f"   git commit -m '🧹 LIMPIEZA RADICAL: Repositorio limpio y organizado'")
        print(f"   git push")
        print(f"3. Verificar en GitHub que solo quedan archivos esenciales")
        
        return 0
    else:
        print(f"\n➡️ No se eliminaron archivos")
        return 1

if __name__ == "__main__":
    import sys
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n🛑 Limpieza cancelada por usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante limpieza: {e}")
        sys.exit(1)
