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

# 5. Verificar que node_modules estará disponible para Flask
echo "🔍 Verificando accesibilidad de node_modules para Flask..."
ls -la node_modules/ | head -10
echo "📁 Total directorios en node_modules: $(ls -1 node_modules/ | wc -l)"

# 6. Verificar archivos específicos que usan los HTML
echo "🔍 Verificando archivos específicos requeridos por HTML..."
echo "Font Awesome:"
ls -la node_modules/@fortawesome/fontawesome-free/css/all.min.css || echo "❌ Font Awesome CSS no encontrado"
echo "MGRS:"
ls -la node_modules/mgrs/ || echo "❌ MGRS no encontrado"  
echo "Milsymbol:"
ls -la node_modules/milsymbol/dist/milsymbol.js || echo "❌ Milsymbol no encontrado"
echo "Three.js:"
ls -la node_modules/three/build/three.min.js || echo "❌ Three.js no encontrado"
echo "Three OrbitControls:"
ls -la node_modules/three-orbitcontrols/ || echo "❌ Three OrbitControls no encontrado"

# 7. Verificación completa de dependencias
echo "🔍 Ejecutando verificación completa de dependencias..."
python3 verify_dependencies.py

echo "✅ Build completado - node_modules verificado y dependencies confirmadas"
