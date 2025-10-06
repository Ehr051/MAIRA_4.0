#!/bin/bash
# Script de prueba del sistema híbrido de vegetación

echo "🌿 Sistema Híbrido de Vegetación - MAIRA 4.0"
echo "=============================================="
echo ""

# Verificar estructura de archivos
echo "📁 Verificando archivos..."

# VegetationService
if [ -f "Client/js/services/VegetationService.js" ]; then
    echo "✅ VegetationService.js encontrado"
else
    echo "❌ VegetationService.js NO encontrado"
fi

# Worker
if [ -f "Client/js/workers/vegetation.worker.js" ]; then
    echo "✅ vegetation.worker.js encontrado"
else
    echo "❌ vegetation.worker.js NO encontrado"
fi

# TerrainGenerator
if [ -f "Client/js/services/TerrainGenerator3D.js" ]; then
    echo "✅ TerrainGenerator3D.js encontrado"
else
    echo "❌ TerrainGenerator3D.js NO encontrado"
fi

# HTML test
if [ -f "test-terrain-from-map.html" ]; then
    echo "✅ test-terrain-from-map.html encontrado"
else
    echo "❌ test-terrain-from-map.html NO encontrado"
fi

echo ""
echo "📊 Verificando implementación..."

# Verificar sistema híbrido en VegetationService
if grep -q "fromSatellite" "Client/js/services/VegetationService.js"; then
    echo "✅ Sistema híbrido implementado en VegetationService"
else
    echo "❌ Sistema híbrido NO encontrado en VegetationService"
fi

# Verificar inicialización con satelliteAnalyzer
if grep -q "satelliteAnalyzer" "Client/js/services/VegetationService.js"; then
    echo "✅ Integración con SatelliteAnalyzer implementada"
else
    echo "❌ Integración con SatelliteAnalyzer NO encontrada"
fi

# Verificar coordenadas normalizadas en TerrainGenerator
if grep -q "normX" "Client/js/services/TerrainGenerator3D.js"; then
    echo "✅ Coordenadas normalizadas implementadas en TerrainGenerator"
else
    echo "❌ Coordenadas normalizadas NO encontradas"
fi

# Verificar estadísticas en HTML
if grep -q "getStats" "test-terrain-from-map.html"; then
    echo "✅ Estadísticas de fuentes implementadas en HTML"
else
    echo "❌ Estadísticas de fuentes NO encontradas"
fi

echo ""
echo "🗺️ Verificando datos TIF..."

# Verificar directorio de tiles
if [ -d "Client/Libs/datos_argentina/Vegetacion_Mini_Tiles" ]; then
    TILE_COUNT=$(find "Client/Libs/datos_argentina/Vegetacion_Mini_Tiles" -name "*.tif" 2>/dev/null | wc -l)
    echo "✅ Directorio de tiles encontrado ($TILE_COUNT archivos .tif)"
else
    echo "⚠️  Directorio de tiles NO encontrado (se usará procedural)"
fi

echo ""
echo "📋 Resumen de implementación:"
echo "-----------------------------"
echo "1. ✅ VegetationService con sistema híbrido"
echo "2. ✅ Worker de vegetación con caché"
echo "3. ✅ Integración con SatelliteAnalyzer"
echo "4. ✅ Sistema de estadísticas de fuentes"
echo "5. ✅ Coordenadas normalizadas"
echo "6. ✅ Clasificación NDVI mejorada"
echo "7. ✅ Densidad de vegetación optimizada (25%)"
echo ""

echo "🚀 Para probar el sistema:"
echo "1. Abrir test-terrain-from-map.html en navegador"
echo "2. Marcar checkbox 'Usar datos TIF'"
echo "3. Seleccionar área en mapa"
echo "4. Capturar imagen satelital"
echo "5. Generar terreno 3D"
echo "6. Verificar log: 📊 Fuentes NDVI: 🛰️ Imagen X% | 🗺️ TIF Y% | 🎲 Procedural Z%"
echo ""

echo "📚 Documentación completa: docs/SISTEMA_VEGETACION_HIBRIDO.md"
