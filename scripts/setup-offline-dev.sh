#!/bin/bash
# Script para configurar desarrollo offline local
# NO ES PARA PRODUCCIÓN - solo para desarrollo sin internet

echo "🔧 Configurando MAIRA 4.0 para desarrollo offline..."

# Crear directorio para librerías offline
mkdir -p ./public/libs

# Copiar librerías críticas desde node_modules a public
echo "📦 Copiando librerías críticas..."

# jQuery y Bootstrap (UI básico)
cp -r ./node_modules/jquery/dist ./public/libs/jquery
cp -r ./node_modules/bootstrap/dist ./public/libs/bootstrap
cp -r ./node_modules/@fortawesome/fontawesome-free ./public/libs/fontawesome

# Leaflet ecosystem (mapas)
cp -r ./node_modules/leaflet/dist ./public/libs/leaflet
cp -r ./node_modules/leaflet-draw/dist ./public/libs/leaflet-draw
cp -r ./node_modules/leaflet-control-geocoder/dist ./public/libs/leaflet-geocoder

# Análisis y visualización
cp -r ./node_modules/d3/dist ./public/libs/d3
cp -r ./node_modules/jspdf/dist ./public/libs/jspdf
cp -r ./node_modules/html2canvas/dist ./public/libs/html2canvas

# Símbolos militares
cp -r ./node_modules/milsymbol/dist ./public/libs/milsymbol

echo "✅ Configuración offline completada en ./public/libs/"
echo "💡 Para producción en Render, usa las rutas /node_modules/ normales"
echo "💡 Para desarrollo offline, cambia las rutas a /public/libs/"
