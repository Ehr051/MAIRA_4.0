#!/bin/bash

# 🔄 Script para convertir todos los GLTF a GLB
# Convierte modelos de backup_gltf_models/ y los coloca en gbl_new/

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/backup_gltf_models"
OUTPUT_DIR="$SCRIPT_DIR/Client/assets/models/gbl_new"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔄 GLTF → GLB Batch Converter        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar que existe directorio fuente
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Directorio fuente no existe: $SOURCE_DIR${NC}"
    exit 1
fi

# Verificar gltf-transform
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx no está instalado (necesario para gltf-transform)${NC}"
    echo -e "${YELLOW}Instala Node.js desde: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ gltf-transform disponible${NC}"
echo -e "${BLUE}📂 Fuente: $SOURCE_DIR${NC}"
echo -e "${BLUE}📤 Destino: $OUTPUT_DIR${NC}"
echo ""

# Buscar todos los archivos GLTF
GLTF_FILES=$(find "$SOURCE_DIR" -name "*.gltf" 2>/dev/null)

if [ -z "$GLTF_FILES" ]; then
    echo -e "${YELLOW}⚠️  No se encontraron archivos .gltf en $SOURCE_DIR${NC}"
    exit 0
fi

# Contar archivos
FILE_COUNT=$(echo "$GLTF_FILES" | wc -l | tr -d ' ')
echo -e "${GREEN}📋 Encontrados $FILE_COUNT archivos GLTF${NC}"
echo ""

# Confirmar
echo -e "${YELLOW}¿Convertir todos los archivos? (y/n)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Cancelado por el usuario${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Iniciando conversión...${NC}"
echo ""

# Contadores
SUCCESS=0
FAILED=0

# Procesar cada archivo
while IFS= read -r gltf_file; do
    # Extraer nombre de la carpeta padre (el nombre real del modelo)
    parent_dir=$(basename "$(dirname "$gltf_file")")
    
    # Si el archivo es scene.gltf, usar nombre de carpeta padre
    filename=$(basename "$gltf_file" .gltf)
    if [ "$filename" = "scene" ]; then
        model_name="$parent_dir"
    else
        model_name="$filename"
    fi
    
    output_file="$OUTPUT_DIR/${model_name}.glb"
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🔧 Procesando: $model_name${NC}"
    echo -e "${BLUE}   Fuente: $gltf_file${NC}"
    
    # Verificar si ya existe
    if [ -f "$output_file" ]; then
        echo -e "${YELLOW}⚠️  Ya existe: ${model_name}.glb${NC}"
        echo -e "   ${BLUE}¿Sobrescribir? (y/n)${NC}"
        read -r overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}   Saltando...${NC}"
            echo ""
            continue
        fi
    fi
    
    # Convertir con gltf-transform
    echo -e "${BLUE}   📦 Convirtiendo GLTF → GLB...${NC}"
    
    if npx gltf-transform copy "$gltf_file" "$output_file" 2>&1; then
        if [ -f "$output_file" ]; then
            SIZE=$(du -h "$output_file" | cut -f1)
            echo -e "${GREEN}   ✅ Convertido: ${model_name}.glb ($SIZE)${NC}"
            
            # Verificar contenido
            echo -e "${BLUE}   🔍 Verificando...${NC}"
            npx gltf-transform inspect "$output_file" 2>/dev/null | grep -E "meshes|materials|textures" | head -3
            
            ((SUCCESS++))
        else
            echo -e "${RED}   ❌ Error: Archivo no creado${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}   ❌ Error en conversión${NC}"
        ((FAILED++))
    fi
    
    echo ""
    
done <<< "$GLTF_FILES"

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Conversión completada             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Estadísticas:${NC}"
echo -e "   ${GREEN}✅ Exitosos: $SUCCESS${NC}"
echo -e "   ${RED}❌ Fallidos: $FAILED${NC}"
echo -e "   ${BLUE}📁 Directorio: $OUTPUT_DIR${NC}"
echo ""

if [ $SUCCESS -gt 0 ]; then
    echo -e "${GREEN}🎉 Archivos GLB listos para usar en MAIRA${NC}"
    echo ""
    echo -e "${YELLOW}📝 Próximos pasos:${NC}"
    echo -e "1. Verificar modelos en: $OUTPUT_DIR"
    echo -e "2. Actualizar paths en unitModels si es necesario"
    echo -e "3. Testing en http://127.0.0.1:5000/test-terrain-from-map.html"
fi

echo ""
