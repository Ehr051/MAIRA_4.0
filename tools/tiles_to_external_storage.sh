#!/bin/bash
# tiles_to_external_storage.sh
# Script para migrar tiles a almacenamiento externo

echo "🗄️ MAIRA - Migración de Tiles a Almacenamiento Externo"
echo "=================================================="

# Verificar tamaños
echo "📊 Análisis de datos actuales:"
echo "- Altimetría: $(du -sh Client/Libs/datos_argentina/Altimetria/ | cut -f1)"
echo "- Vegetación: $(du -sh Client/Libs/datos_argentina/Vegetacion/ | cut -f1)"
echo "- Total: $(du -sh Client/Libs/datos_argentina/ | cut -f1)"
echo "- Archivos TIF: $(find Client/Libs/datos_argentina/ -name "*.tif" | wc -l | tr -d ' ')"

# Crear estructura para almacenamiento externo
echo ""
echo "🏗️ Creando estructura para almacenamiento externo..."

mkdir -p external_storage/tiles/altimetria
mkdir -p external_storage/tiles/vegetacion
mkdir -p external_storage/indices

# Copiar índices (pequeños)
echo "📋 Copiando índices JSON..."
cp Client/Libs/datos_argentina/Altimetria/index_tiles_altimetria.json external_storage/indices/ 2>/dev/null || echo "⚠️ Índice altimetría no encontrado"
cp Client/Libs/datos_argentina/Vegetacion/vegetacion_tile_index.json external_storage/indices/ 2>/dev/null || echo "⚠️ Índice vegetación no encontrado"

# Crear manifest de archivos TIF
echo "📝 Creando manifest de archivos TIF..."
find Client/Libs/datos_argentina/ -name "*.tif" -type f > external_storage/tiles_manifest.txt

# Crear archivo ZIP para tiles de altimetría (si no es muy grande)
echo "🗜️ Comprimiendo datos de altimetría..."
if [ $(du -s Client/Libs/datos_argentina/Altimetria/ | cut -f1) -lt 1048576 ]; then
    cd Client/Libs/datos_argentina/
    tar -czf ../../../external_storage/altimetria_tiles.tar.gz Altimetria/
    cd ../../../
    echo "✅ Altimetría comprimida en altimetria_tiles.tar.gz"
else
    echo "⚠️ Altimetría muy grande para comprimir localmente"
fi

# Crear configuración para URLs externas
echo "⚙️ Creando configuración para URLs externas..."

cat > external_storage/tiles_config.json << 'EOF'
{
  "version": "1.0",
  "created": "",
  "external_storage": {
    "provider": "pending_selection",
    "base_url": "https://placeholder.com/maira-tiles",
    "endpoints": {
      "altimetria": {
        "index": "/indices/index_tiles_altimetria.json",
        "tiles": "/altimetria/"
      },
      "vegetacion": {
        "index": "/indices/vegetacion_tile_index.json", 
        "tiles": "/vegetacion/"
      }
    }
  },
  "fallback": {
    "use_local": false,
    "cache_enabled": true
  },
  "statistics": {
    "total_size_gb": 0,
    "altimetria_files": 0,
    "vegetacion_files": 0,
    "total_files": 0
  }
}
EOF

# Actualizar estadísticas en el config
TOTAL_SIZE=$(du -s Client/Libs/datos_argentina/ | cut -f1)
TOTAL_SIZE_GB=$(echo "scale=2; $TOTAL_SIZE/1024/1024" | bc)
ALT_FILES=$(find Client/Libs/datos_argentina/Altimetria/ -name "*.tif" | wc -l | tr -d ' ')
VEG_FILES=$(find Client/Libs/datos_argentina/Vegetacion/ -name "*.tif" -o -name "*.json" | wc -l | tr -d ' ')
TOTAL_FILES=$(find Client/Libs/datos_argentina/ -name "*.tif" -o -name "*.json" | wc -l | tr -d ' ')

# Usar sed para actualizar el JSON (compatible con macOS)
sed -i '' "s/\"created\": \"\"/\"created\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"/g" external_storage/tiles_config.json
sed -i '' "s/\"total_size_gb\": 0/\"total_size_gb\": $TOTAL_SIZE_GB/g" external_storage/tiles_config.json
sed -i '' "s/\"altimetria_files\": 0/\"altimetria_files\": $ALT_FILES/g" external_storage/tiles_config.json
sed -i '' "s/\"vegetacion_files\": 0/\"vegetacion_files\": $VEG_FILES/g" external_storage/tiles_config.json
sed -i '' "s/\"total_files\": 0/\"total_files\": $TOTAL_FILES/g" external_storage/tiles_config.json

echo ""
echo "📊 Estadísticas finales:"
echo "- Tamaño total: ${TOTAL_SIZE_GB}GB"
echo "- Archivos altimetría: $ALT_FILES"
echo "- Archivos vegetación: $VEG_FILES"
echo "- Total archivos: $TOTAL_FILES"

echo ""
echo "✅ Preparación completada. Archivos en external_storage/"
echo "🎯 Próximos pasos:"
echo "   1. Elegir proveedor de almacenamiento (AWS S3, Google Cloud, etc.)"
echo "   2. Subir archivos al proveedor elegido"
echo "   3. Actualizar tiles_config.json con URLs reales"
echo "   4. Modificar handlers JS para usar URLs externas"

ls -la external_storage/
