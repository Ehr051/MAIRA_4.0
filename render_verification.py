#!/usr/bin/env python3
"""
Script de verificación para deployment en Render
Verifica que todos los componentes estén listos para producción
"""

import os
import sys
import json
from pathlib import Path

def check_files_exist():
    """Verifica que los archivos esenciales existan"""
    print("🔍 VERIFICANDO ARCHIVOS ESENCIALES...")
    
    essential_files = [
        'app.py',
        'gunicorn.conf.py', 
        'requirements.txt',
        'render.yaml',
        'Client/index.html',
        'Client/CO.html',
        'Client/juegodeguerra.html',
        'Client/iniciarpartida.html',
        'Client/css/common/planeamiento.css',
        'Client/js/common/networkConfig.js'
    ]
    
    missing_files = []
    for file_path in essential_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
            print(f"   ❌ Faltante: {file_path}")
        else:
            print(f"   ✅ Encontrado: {file_path}")
    
    if missing_files:
        print(f"\n⚠️ ARCHIVOS FALTANTES: {len(missing_files)}")
        return False
    
    print("✅ Todos los archivos esenciales están presentes")
    return True

def check_css_structure():
    """Verifica la estructura CSS reorganizada"""
    print("\n🎨 VERIFICANDO ESTRUCTURA CSS...")
    
    css_dirs = [
        'Client/css/common',
        'Client/css/modules',
        'Client/css/legacy'
    ]
    
    for css_dir in css_dirs:
        if os.path.exists(css_dir):
            files = [f for f in os.listdir(css_dir) if f.endswith('.css')]
            print(f"   ✅ {css_dir}: {len(files)} archivos")
        else:
            print(f"   ❌ Faltante: {css_dir}")
            return False
    
    return True

def check_js_structure():
    """Verifica la estructura JS reorganizada"""
    print("\n📱 VERIFICANDO ESTRUCTURA JS...")
    
    js_dirs = [
        'Client/js/common',
        'Client/js/modules', 
        'Client/js/utils',
        'Client/js/ui'
    ]
    
    for js_dir in js_dirs:
        if os.path.exists(js_dir):
            files = [f for f in os.listdir(js_dir) if f.endswith('.js')]
            print(f"   ✅ {js_dir}: {len(files)} archivos")
        else:
            print(f"   ❌ Faltante: {js_dir}")
            return False
    
    return True

def check_database_config():
    """Verifica configuración de base de datos"""
    print("\n🗄️ VERIFICANDO CONFIGURACIÓN DB...")
    
    # Verificar app.py contiene configuración de PostgreSQL
    try:
        with open('app.py', 'r') as f:
            app_content = f.read()
            
        if 'postgresql' in app_content.lower():
            print("   ✅ Configuración PostgreSQL detectada")
        else:
            print("   ⚠️ No se detectó configuración PostgreSQL")
            
        if 'DATABASE_URL' in app_content:
            print("   ✅ Variable DATABASE_URL configurada") 
        else:
            print("   ⚠️ Variable DATABASE_URL no encontrada")
            
    except Exception as e:
        print(f"   ❌ Error leyendo app.py: {e}")
        return False
    
    return True

def check_static_routes():
    """Verifica que las rutas estáticas estén configuradas"""
    print("\n📂 VERIFICANDO RUTAS ESTÁTICAS...")
    
    try:
        with open('app.py', 'r') as f:
            app_content = f.read()
            
        if '/static' in app_content or 'static_folder' in app_content:
            print("   ✅ Rutas estáticas configuradas")
            return True
        else:
            print("   ⚠️ Rutas estáticas no encontradas")
            return False
            
    except Exception as e:
        print(f"   ❌ Error verificando rutas: {e}")
        return False

def generate_render_instructions():
    """Genera instrucciones para configurar en Render"""
    print("\n📋 INSTRUCCIONES PARA RENDER:")
    print("=" * 50)
    
    instructions = """
1. 🌐 CREAR SERVICIO WEB:
   - Ve a dashboard.render.com
   - Click "New +" > "Web Service"
   - Conecta tu repositorio: Ehr051/MAIRA_4.0
   - Configuración:
     * Name: maira-40
     * Branch: main
     * Root Directory: (dejar vacío)
     * Runtime: Python 3
     * Build Command: pip install -r requirements.txt
     * Start Command: gunicorn --config gunicorn.conf.py app:app

2. 🗄️ CREAR BASE DE DATOS:
   - Click "New +" > "PostgreSQL"
   - Configuración:
     * Name: maira-postgres
     * Database Name: maira_db
     * User: maira_user
     * Plan: Starter (gratis)

3. 🔗 CONECTAR BD AL SERVICIO:
   - En tu servicio web > Environment
   - Agregar variable: DATABASE_URL
   - Valor: Copia la "External Database URL" de tu PostgreSQL

4. ⚙️ VARIABLES DE ENTORNO ADICIONALES:
   - SECRET_KEY: [Generar valor aleatorio]
   - JWT_SECRET_KEY: [Generar valor aleatorio]
   - FLASK_ENV: production
   - PORT: 10000

5. 🚀 DEPLOY:
   - Click "Deploy Latest Commit"
   - Monitorear logs para errores
   
6. ✅ VERIFICAR:
   - Accede a tu URL de Render
   - Prueba: /health endpoint
   - Prueba: Cargar CO.html
    """
    
    print(instructions)

def main():
    print("🚀 VERIFICACIÓN PRE-DEPLOYMENT RENDER")
    print("=" * 50)
    
    all_checks = [
        check_files_exist(),
        check_css_structure(), 
        check_js_structure(),
        check_database_config(),
        check_static_routes()
    ]
    
    if all(all_checks):
        print("\n✅ TODOS LOS CHECKS PASARON")
        print("🎯 Proyecto listo para deployment en Render")
        generate_render_instructions()
    else:
        print("\n❌ ALGUNOS CHECKS FALLARON")
        print("🔧 Corrige los errores antes del deployment")
        sys.exit(1)

if __name__ == "__main__":
    main()
