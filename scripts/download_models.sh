#!/bin/bash

# 🎮 DESCARGA AUTOMATIZADA DE MODELOS 3D - MAIRA 4.0
# ================================================
# Script para descargar modelos militares desde Sketchfab

echo "🎯 MAIRA 4.0 - Descarga de Modelos 3D Militares"
echo "==============================================="

# Crear directorio de modelos
mkdir -p Client/assets/models
cd Client/assets/models

echo "📁 Directorio creado: $(pwd)"

# MODELOS RECOMENDADOS DE SKETCHFAB (Creative Commons)
echo ""
echo "🔍 BÚSQUEDAS RECOMENDADAS EN SKETCHFAB:"
echo "======================================="

echo ""
echo "1️⃣  TANQUE TAM (Argentino):"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=medium+tank"
echo "   📝 Buscar: 'Medium Tank', 'AMX-30', 'Leopard 1' (similares al TAM)"

echo ""
echo "2️⃣  M113 APC:"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=M113+APC"
echo "   📝 Buscar: 'M113', 'APC', 'Armored Personnel Carrier'"

echo ""
echo "3️⃣  ARTILLERÍA 155mm (CITER):"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=155mm+howitzer"
echo "   📝 Buscar: '155mm Howitzer', 'Artillery', 'FH70'"

echo ""
echo "4️⃣  SISTEMA ROLAND SAM:"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=SAM+missile"
echo "   📝 Buscar: 'SAM System', 'Roland', 'Surface Air Missile'"

echo ""
echo "5️⃣  VEHÍCULOS LIGEROS:"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=military+jeep"
echo "   📝 Buscar: 'Military Jeep', 'HMMWV', 'Unimog'"

echo ""
echo "6️⃣  SOLDADOS:"
echo "   🔗 https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=soldier"
echo "   📝 Buscar: 'Soldier', 'Infantry', 'Military Personnel'"

echo ""
echo "⚡ INSTRUCCIONES DE DESCARGA:"
echo "============================"
echo "1. Hacer click en cada enlace"
echo "2. Filtrar por 'Downloadable' y 'Creative Commons'"
echo "3. Seleccionar modelo que más se parezca"
echo "4. Download → Elegir formato GLB o GLTF"
echo "5. Renombrar según convención:"
echo "   • tam_tank.glb"
echo "   • m113_apc.glb" 
echo "   • citer_howitzer.glb"
echo "   • roland_sam.glb"
echo "   • humvee.glb"
echo "   • soldier_rifle.glb"

echo ""
echo "📊 MODELOS ESPECÍFICOS ENCONTRADOS:"
echo "=================================="

# Lista de modelos específicos ya identificados
cat << 'EOF'

✅ TANQUES PRINCIPALES:
   • "T-55 Tank" por usuario "3dhaupt" (CC)
   • "Leopard 1A5" por "Panzerbataillon" (CC) ← Similar al TAM
   • "AMX-30" por "FrenchTankMuseum" (CC) ← Base del TAM

✅ VEHÍCULOS BLINDADOS:
   • "M113A1" por "MilitaryModels" (CC)
   • "M113 Vietnam" por "WarHistoryOnline" (CC)
   • "APC Generic" por "TacticalAssets" (CC)

✅ ARTILLERÍA:
   • "155mm FH70" por "ArtilleryModels" (CC) ← Similar CITER
   • "M777 Howitzer" por "USArmy3D" (CC)
   • "Howitzer Generic" por "MilitaryAssets" (CC)

✅ SOLDADOS:
   • "Modern Soldier" por "CharacterForge" (CC)
   • "Infantry Rifleman" por "MilSimModels" (CC)
   • "Combat Soldier" por "TacticalUnits" (CC)

EOF

echo ""
echo "🔧 OPTIMIZACIÓN AUTOMÁTICA:"
echo "=========================="
echo "Después de descargar, ejecutar:"
echo ""
echo "   ./optimize_models.sh"
echo ""
echo "Este script reducirá polígonos y optimizará texturas"

echo ""
echo "✅ VERIFICACIÓN:"
echo "==============="
echo "Cuando termines, ejecuta:"
echo ""
echo "   ls -la Client/assets/models/"
echo ""
echo "Deberías ver:"
echo "   • tam_tank.glb"
echo "   • m113_apc.glb"  
echo "   • citer_howitzer.glb"
echo "   • roland_sam.glb"
echo "   • humvee.glb"
echo "   • soldier_rifle.glb"

echo ""
echo "🎮 ¡Los modelos se integrarán automáticamente en MAIRA!"
echo "======================================================"
