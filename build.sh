#!/bin/bash
set -e

echo "🚀 MAIRA 4.0 - Build Script"
echo "=========================="

# 1. Instalar dependencias Python
echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

# 2. Verificar Node.js
echo "🔍 Verificando Node.js..."
node --version
npm --version

# 3. Instalar dependencias Node.js
echo "📦 Instalando dependencias Node.js..."
npm install --production=false --verbose

# 4. Verificar instalaciones críticas
echo "🔍 Verificando instalaciones críticas..."
echo "Bootstrap:"
ls -la node_modules/bootstrap/dist/css/bootstrap.min.css || echo "❌ Bootstrap CSS no encontrado"
echo "jQuery:"
ls -la node_modules/jquery/dist/jquery.min.js || echo "❌ jQuery no encontrado"
echo "Leaflet:"
ls -la node_modules/leaflet/dist/leaflet.js || echo "❌ Leaflet no encontrado"

echo "✅ Build completado"
