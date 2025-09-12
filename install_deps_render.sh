#!/bin/bash
# Script de instalación de dependencias Node.js para Render
# Maneja conflictos de versiones automáticamente

echo "🚀 MAIRA 4.0 - Instalación de dependencias Node.js"
echo "================================================="

# Verificar que npm esté disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible"
    exit 1
fi

echo "📦 Versión npm: $(npm --version)"
echo "📦 Versión node: $(node --version)"

# Configurar npm para resolver conflictos
echo "🔧 Configurando npm para resolver conflictos de dependencias..."
npm config set legacy-peer-deps true
npm config set audit false
npm config set fund false
npm config set progress false
npm config set loglevel error

# Limpiar caché si existe
if [ -d "node_modules" ]; then
    echo "🧹 Limpiando instalación anterior..."
    rm -rf node_modules package-lock.json
fi

# Instalar dependencias con resolución de conflictos
echo "📥 Instalando dependencias con --legacy-peer-deps..."
npm install --legacy-peer-deps --no-optional --no-audit --no-fund

# Verificar instalación crítica
echo "🔍 Verificando dependencias críticas..."
CRITICAL_DEPS=("jquery" "bootstrap" "leaflet" "jsplumb" "pako" "geotiff" "milsymbol" "d3")
MISSING=()

for dep in "${CRITICAL_DEPS[@]}"; do
    if [ ! -d "node_modules/$dep" ]; then
        MISSING+=("$dep")
        echo "❌ Falta: $dep"
    else
        echo "✅ OK: $dep"
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "⚠️  Instalando dependencias faltantes individualmente..."
    for dep in "${MISSING[@]}"; do
        echo "📦 Instalando $dep..."
        npm install "$dep" --legacy-peer-deps --no-audit --save
    done
fi

echo "🎉 Instalación de dependencias Node.js completada"
echo "📊 Total paquetes instalados: $(ls node_modules | wc -l)"
