#!/bin/bash

# Script de build customizado para Render
# Fuerza la instalación completa de dependencias Node.js

echo "🚀 MAIRA Build Script - Instalación completa de dependencias"
echo "=================================================="

# Desactivar modo producción para esta instalación
export NPM_CONFIG_PRODUCTION=false
export NODE_ENV=development

echo "📋 Variables de entorno:"
echo "NPM_CONFIG_PRODUCTION: $NPM_CONFIG_PRODUCTION"
echo "NODE_ENV: $NODE_ENV"

# Verificar que npm está disponible
echo "🔧 Verificando herramientas..."
npm --version
node --version

# Instalación completa con todas las dependencias
echo "📦 Instalando todas las dependencias..."
npm install --no-optional --include=dev

# Instalar dependencias críticas específicamente
echo "🎯 Instalando dependencias críticas..."
npm install jquery@3.7.1 bootstrap@4.5.2 leaflet@1.9.4 jsplumb@2.15.6 --force

# Verificar instalación
echo "✅ Verificando instalación..."
for dep in jquery bootstrap leaflet jsplumb; do
    if [ -d "node_modules/$dep" ]; then
        echo "✅ $dep: INSTALADO"
    else
        echo "❌ $dep: FALTA"
    fi
done

echo "🎉 Build script completado"
