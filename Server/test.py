#!/usr/bin/env python3
"""
Script para verificar rutas y estructura de archivos del proyecto
"""

import os
import sys
import json
from pathlib import Path

def check_directory_structure(base_dir):
    """Verifica que la estructura de directorios exista"""
    required_dirs = [
        'client/public/image',
        'client/public/favicon',
        'client/src/modules/home',
        'client/src/modules/planning',
        'client/src/modules/warGame',
        'client/src/modules/battleManagement',
        'client/src/modules/organizationChart',
        'client/src/core/config',
        'server/certs/ssl',
        'dist'
    ]
    
    missing_dirs = []
    for dir_path in required_dirs:
        full_path = os.path.join(base_dir, dir_path)
        if not os.path.exists(full_path):
            missing_dirs.append(dir_path)
            # Crear directorios faltantes
            os.makedirs(full_path, exist_ok=True)
            print(f"✓ Creado directorio: {dir_path}")
    
    if missing_dirs:
        print(f"Se crearon {len(missing_dirs)} directorios faltantes")
    else:
        print("✓ Estructura de directorios completa")
    
    return missing_dirs

def check_config_files(base_dir):
    """Verifica que los archivos de configuración existan"""
    config_files = [
        ('.env', False),  # (ruta, es_crítico)
        ('server/config.py', True),
        ('webpack.config.js', True)
    ]
    
    missing_files = []
    for file_path, is_critical in config_files:
        full_path = os.path.join(base_dir, file_path)
        if not os.path.exists(full_path):
            missing_files.append((file_path, is_critical))
            print(f"✗ Falta archivo de configuración: {file_path}")
    
    if not missing_files:
        print("✓ Todos los archivos de configuración están presentes")
    
    critical_missing = [f for f, c in missing_files if c]
    if critical_missing:
        print(f"⚠️  ADVERTENCIA: Faltan {len(critical_missing)} archivos críticos")
    
    return missing_files

def check_ssl_certificates(base_dir):
    """Verifica que los certificados SSL existan"""
    ssl_dir = os.path.join(base_dir, 'server/certs/ssl')
    cert_path = os.path.join(ssl_dir, 'cert.pem')
    key_path = os.path.join(ssl_dir, 'key.pem')
    
    if not os.path.exists(ssl_dir):
        os.makedirs(ssl_dir, exist_ok=True)
        print(f"✓ Creado directorio para certificados SSL: {ssl_dir}")
    
    missing_certs = []
    if not os.path.exists(cert_path):
        missing_certs.append('cert.pem')
    
    if not os.path.exists(key_path):
        missing_certs.append('key.pem')
    
    if missing_certs:
        print(f"⚠️  Faltan certificados SSL: {', '.join(missing_certs)}")
        print("   Para HTTPS se requieren certificados válidos.")
        print("   Puede generar certificados autofirmados con el siguiente comando:")
        print("   openssl req -x509 -newkey rsa:4096 -keyout server/certs/ssl/key.pem -out server/certs/ssl/cert.pem -days 365 -nodes")
    else:
        print("✓ Certificados SSL encontrados")
    
    return missing_certs

def main():
    # Obtener la ruta base del proyecto
    base_dir = os.environ.get('PROJECT_ROOT')
    if not base_dir:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    print(f"Verificando estructura del proyecto en: {base_dir}")
    print("-" * 60)
    
    # Verificar estructura de directorios
    print("\n1. Verificando estructura de directorios:")
    missing_dirs = check_directory_structure(base_dir)
    
    # Verificar archivos de configuración
    print("\n2. Verificando archivos de configuración:")
    missing_configs = check_config_files(base_dir)
    
    # Verificar certificados SSL
    print("\n3. Verificando certificados SSL:")
    missing_certs = check_ssl_certificates(base_dir)
    
    # Resumen
    print("\n" + "=" * 60)
    print("RESUMEN DE LA VERIFICACIÓN:")
    
    if not missing_dirs and not missing_configs and not missing_certs:
        print("✅ Todo en orden. La estructura del proyecto es correcta.")
    else:
        if missing_dirs:
            print(f"- Se crearon {len(missing_dirs)} directorios faltantes")
        
        critical_missing = [f for f, c in missing_configs if c]
        if critical_missing:
            print(f"- ⚠️  Faltan {len(critical_missing)} archivos de configuración críticos")
        
        if missing_certs:
            print(f"- ⚠️  Faltan certificados SSL para HTTPS")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())