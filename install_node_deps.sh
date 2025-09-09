#!/bin/bash

echo "🚀 FORZANDO INSTALACIÓN DE DEPENDENCIAS NODE.JS"
echo "=================================================="

# Navegamos al directorio correcto
cd /opt/render/project/src 2>/dev/null || cd .

echo "📁 Directorio actual: $(pwd)"
echo "📄 Verificando package.json..."

if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
    
    echo "🔧 Instalando dependencias básicas..."
    npm install --no-optional --force
    
    echo "🎯 Instalando dependencias críticas específicas..."
    npm install jquery@3.7.1 bootstrap@4.5.2 leaflet@1.9.4 jsplumb@2.15.6 --force
    
    echo "🎨 Instalando dependencias de CSS y UI..."
    npm install @fortawesome/fontawesome-free milsymbol chart.js --force
    
    echo "🌐 Instalando dependencias de comunicación..."
    npm install socket.io-client proj4 --force
    
    echo "📊 Instalando dependencias de gráficos y PDF..."
    npm install html2canvas jspdf d3 file-saver fabric --force
    
    echo "🗺️ Instalando plugins de Leaflet..."
    npm install leaflet-draw leaflet-fullscreen leaflet-control-geocoder leaflet-easybutton leaflet.markercluster leaflet-geosearch leaflet-providers leaflet-sidebar-v2 leaflet-geometryutil leaflet-measure leaflet.pattern --force
    
    echo "🎮 Instalando dependencias adicionales..."
    npm install three --force
    
    echo "📋 Verificando instalación..."
    ls -la node_modules/ | head -10
    
    echo "✅ Verificando dependencias críticas..."
    for dep in jquery bootstrap leaflet jsplumb; do
        if [ -d "node_modules/$dep" ]; then
            echo "✅ $dep: INSTALADO"
        else
            echo "❌ $dep: FALTA"
        fi
    done
    
    echo "🎉 INSTALACIÓN COMPLETADA"
else
    echo "❌ package.json no encontrado en $(pwd)"
    find . -name "package.json" -type f 2>/dev/null | head -5
fi
