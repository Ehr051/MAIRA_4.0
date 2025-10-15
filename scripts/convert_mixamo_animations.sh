#!/bin/bash

# 🎬 Script para convertir animaciones FBX de Mixamo a GLB
# Combina múltiples animaciones FBX en un solo GLB

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
BLENDER="/Applications/Blender.app/Contents/MacOS/Blender"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIXAMO_DIR="$SCRIPT_DIR/mixamo_animations"
OUTPUT_DIR="$SCRIPT_DIR/Client/assets/models/gbl_new"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎬 Mixamo → MAIRA GLB Converter     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar Blender
if [ ! -f "$BLENDER" ]; then
    echo -e "${RED}❌ Error: Blender no encontrado${NC}"
    exit 1
fi

# Verificar directorio de Mixamo
if [ ! -d "$MIXAMO_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directorio de animaciones no existe: $MIXAMO_DIR${NC}"
    echo -e "${BLUE}📁 Creando directorio...${NC}"
    mkdir -p "$MIXAMO_DIR"
    echo ""
    echo -e "${YELLOW}Por favor, coloca las animaciones FBX descargadas de Mixamo en:${NC}"
    echo -e "   $MIXAMO_DIR"
    echo ""
    echo -e "${BLUE}Estructura sugerida:${NC}"
    echo -e "   mixamo_animations/"
    echo -e "   ├── soldier_argentine_idle.fbx      ${GREEN}(With Skin)${NC}"
    echo -e "   ├── soldier_argentine_walk.fbx      ${YELLOW}(Without Skin)${NC}"
    echo -e "   ├── soldier_argentine_shoot.fbx     ${YELLOW}(Without Skin)${NC}"
    echo -e "   ├── soldier_argentine_death.fbx     ${YELLOW}(Without Skin)${NC}"
    echo -e "   ├── soldier_russian_idle.fbx        ${GREEN}(With Skin)${NC}"
    echo -e "   └── ..."
    echo ""
    exit 0
fi

# Verificar que hay archivos FBX
FBX_COUNT=$(find "$MIXAMO_DIR" -name "*.fbx" | wc -l)
if [ "$FBX_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No se encontraron archivos FBX en $MIXAMO_DIR${NC}"
    echo -e "${YELLOW}Descarga animaciones de Mixamo primero${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Encontrados $FBX_COUNT archivos FBX${NC}"
echo ""

# Agrupar por personaje (asumiendo nombres como soldier_argentine_idle.fbx)
echo -e "${BLUE}📋 Agrupando animaciones por personaje...${NC}"

declare -A CHARACTER_ANIMS

for fbx in "$MIXAMO_DIR"/*.fbx; do
    filename=$(basename "$fbx" .fbx)
    
    # Extraer nombre del personaje (todo antes del último _)
    character=$(echo "$filename" | rev | cut -d'_' -f2- | rev)
    
    if [ -z "${CHARACTER_ANIMS[$character]}" ]; then
        CHARACTER_ANIMS[$character]="$fbx"
    else
        CHARACTER_ANIMS[$character]="${CHARACTER_ANIMS[$character]}|$fbx"
    fi
done

# Mostrar grupos
echo ""
for character in "${!CHARACTER_ANIMS[@]}"; do
    IFS='|' read -ra ANIMS <<< "${CHARACTER_ANIMS[$character]}"
    echo -e "${GREEN}👤 $character${NC} (${#ANIMS[@]} animaciones)"
    for anim in "${ANIMS[@]}"; do
        echo "   • $(basename "$anim")"
    done
    echo ""
done

# Preguntar si continuar
echo -e "${YELLOW}¿Convertir todos estos personajes? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelado por el usuario${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Iniciando conversión...${NC}"
echo ""

# Procesar cada personaje
for character in "${!CHARACTER_ANIMS[@]}"; do
    IFS='|' read -ra ANIMS <<< "${CHARACTER_ANIMS[$character]}"
    OUTPUT_GLB="$OUTPUT_DIR/${character}_animated.glb"
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🎬 Procesando: $character${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Usar la primera animación (debería ser "With Skin")
    FIRST_FBX="${ANIMS[0]}"
    
    echo -e "${BLUE}📥 Base: $(basename "$FIRST_FBX")${NC}"
    
    # Convertir a GLB
    "$BLENDER" --background --python "$SCRIPT_DIR/convert_mixamo_to_glb.py" -- "$FIRST_FBX" "$OUTPUT_GLB"
    
    if [ $? -eq 0 ]; then
        SIZE=$(du -h "$OUTPUT_GLB" | cut -f1)
        echo -e "${GREEN}✅ Convertido: ${character}_animated.glb ($SIZE)${NC}"
        
        # Si hay múltiples animaciones, sugerir combinarlas
        if [ ${#ANIMS[@]} -gt 1 ]; then
            echo -e "${YELLOW}⚠️  Múltiples animaciones detectadas${NC}"
            echo -e "${BLUE}   Para combinarlas en un solo GLB, usa Blender manualmente${NC}"
            echo -e "${BLUE}   o importa cada GLB separado en THREE.js${NC}"
        fi
    else
        echo -e "${RED}❌ Error al convertir $character${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Conversión completada             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Archivos GLB generados en:${NC}"
echo -e "   $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}🔍 Verificar animaciones con:${NC}"
echo -e "   ${BLUE}npx gltf-transform inspect $OUTPUT_DIR/soldier_argentine_animated.glb${NC}"
echo ""
echo -e "${GREEN}🎮 Próximo paso: Integrar en test-terrain-from-map.html${NC}"
echo -e "   Actualizar paths en unitModels:"
echo -e "   ${BLUE}'soldier': {${NC}"
echo -e "   ${BLUE}  path: 'Client/assets/models/gbl_new/soldier_argentine_animated.glb',${NC}"
echo -e "   ${BLUE}  ...${NC}"
echo -e "   ${BLUE}}${NC}"
echo ""
