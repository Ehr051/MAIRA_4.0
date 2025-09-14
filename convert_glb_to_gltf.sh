#!/bin/bash
# Script para convertir todos los GLB a GLTF separado
# MAIRA 4.0 - Conversión masiva de modelos 3D

echo "🎯 MAIRA 4.0 - Convertidor GLB a GLTF"
echo "=================================="

# Directorio de modelos
MODELS_DIR="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/assets/models"
GLTF_TRANSFORM="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/node_modules/.bin/gltf-transform"

# Crear directorio para GLTF convertidos
mkdir -p "$MODELS_DIR/gltf_converted"

echo "📁 Directorio de modelos: $MODELS_DIR"
echo "🔧 Herramienta: $GLTF_TRANSFORM"
echo ""

# Contador
converted=0
failed=0

# Convertir todos los GLB
for glb_file in "$MODELS_DIR"/*.glb; do
    if [ -f "$glb_file" ]; then
        # Obtener nombre base sin extensión
        basename=$(basename "$glb_file" .glb)
        
        # Ruta de salida
        output_dir="$MODELS_DIR/gltf_converted/$basename"
        output_file="$output_dir/$basename.gltf"
        
        echo "🔄 Convirtiendo: $basename.glb"
        
        # Crear directorio de salida
        mkdir -p "$output_dir"
        
        # Convertir GLB a GLTF (formato separado automático cuando se usa .gltf)
        if "$GLTF_TRANSFORM" copy "$glb_file" "$output_file"; then
            echo "   ✅ Convertido: $output_file"
            ((converted++))
        else
            echo "   ❌ Error convirtiendo: $basename.glb"
            ((failed++))
        fi
        
        echo ""
    fi
done

echo "🏁 Conversión completada:"
echo "   ✅ Convertidos: $converted"
echo "   ❌ Fallidos: $failed"
echo ""
echo "📂 Archivos GLTF en: $MODELS_DIR/gltf_converted/"
echo ""
echo "🎯 Para usar los modelos convertidos, actualiza las rutas en tu configuración:"
echo "   Ejemplo: 'gltf_converted/soldier/soldier.gltf'"
