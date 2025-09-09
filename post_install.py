#!/usr/bin/env python3
"""
Script de post-instalación para instalar dependencias Node.js
Se ejecuta automáticamente después de instalar requirements.txt
"""

import os
import subprocess
import sys

def log(message):
    print(f"🔧 [POST-INSTALL] {message}")

def run_command(command, cwd=None):
    """Ejecuta un comando y retorna True si es exitoso"""
    try:
        log(f"Ejecutando: {command}")
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            cwd=cwd
        )
        
        if result.returncode == 0:
            log(f"✅ Éxito: {command}")
            if result.stdout.strip():
                print(result.stdout)
            return True
        else:
            log(f"❌ Error en: {command}")
            if result.stderr.strip():
                print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        log(f"❌ Excepción ejecutando {command}: {e}")
        return False

def main():
    log("Iniciando instalación de dependencias Node.js para MAIRA")
    
    # Detectar directorio de trabajo
    current_dir = os.getcwd()
    log(f"Directorio actual: {current_dir}")
    
    # Buscar package.json
    package_json_path = None
    for path in [
        os.path.join(current_dir, "package.json"),
        os.path.join(current_dir, "..", "package.json"),
        "/opt/render/project/src/package.json"
    ]:
        if os.path.exists(path):
            package_json_path = path
            break
    
    if not package_json_path:
        log("❌ No se encontró package.json, saltando instalación Node.js")
        return
    
    work_dir = os.path.dirname(package_json_path)
    log(f"✅ package.json encontrado en: {work_dir}")
    
    # Verificar que Node.js esté disponible
    if not run_command("node --version"):
        log("❌ Node.js no disponible, saltando instalación")
        return
    
    if not run_command("npm --version"):
        log("❌ npm no disponible, saltando instalación")
        return
    
    # Instalar dependencias
    log("🚀 Instalando dependencias Node.js...")
    
    # Instalación básica
    run_command("npm install --no-optional --production=false", cwd=work_dir)
    
    # Dependencias críticas específicas
    critical_deps = [
        "jquery@3.7.1",
        "bootstrap@4.5.2", 
        "leaflet@1.9.4",
        "jsplumb@2.15.6",
        "@fortawesome/fontawesome-free",
        "socket.io-client",
        "chart.js"
    ]
    
    for dep in critical_deps:
        run_command(f"npm install {dep} --force", cwd=work_dir)
    
    # Verificación final
    log("📋 Verificando instalación...")
    node_modules_path = os.path.join(work_dir, "node_modules")
    if os.path.exists(node_modules_path):
        dirs = os.listdir(node_modules_path)
        log(f"✅ node_modules contiene {len(dirs)} paquetes")
        
        for dep in ["jquery", "bootstrap", "leaflet", "jsplumb"]:
            if dep in dirs:
                log(f"✅ {dep}: INSTALADO")
            else:
                log(f"❌ {dep}: FALTA")
    else:
        log("❌ node_modules no existe")
    
    log("🎉 Post-instalación Node.js completada")

if __name__ == "__main__":
    main()
