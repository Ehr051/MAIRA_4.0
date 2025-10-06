#!/bin/bash
# Script para convertir modelos de vegetación GLTF a GLB
# MAIRA 4.0 - Optimización de modelos 3D

echo "🌳 MAIRA 4.0 - Convertidor Vegetación GLTF → GLB"
echo "================================================"

# Directorios
VEGETATION_DIR="backup_gltf_models/gltf_new/vegetation"
GLTF_TRANSFORM="./node_modules/.bin/gltf-transform"

echo "📁 Directorio: $VEGETATION_DIR"
echo "🔧 Herramienta: $GLTF_TRANSFORM"
echo ""

# Contador
converted=0
failed=0

# Tipos de vegetación
types=("grass" "bush" "tree_medium" "tree_tall")

for veg_type in "${types[@]}"; do
    input_dir="$VEGETATION_DIR/$veg_type"
    input_file="$input_dir/scene.gltf"
    output_file="$input_dir/scene.glb"
    
    if [ -f "$input_file" ]; then
        echo "🔄 Convirtiendo: $veg_type/scene.gltf → scene.glb"
        
        # Convertir GLTF a GLB (binario compacto)
        # La extensión .glb automáticamente produce formato binario
        if "$GLTF_TRANSFORM" copy "$input_file" "$output_file"; then
            # Verificar tamaño
            size_gltf=$(du -h "$input_file" | cut -f1)
            size_glb=$(du -h "$output_file" | cut -f1)
            echo "   ✅ Convertido: $veg_type"
            echo "      GLTF: $size_gltf → GLB: $size_glb"
            ((converted++))
        else
            echo "   ❌ Error convirtiendo: $veg_type"
            ((failed++))
        fi
        echo ""
    else
        echo "⚠️  No encontrado: $input_file"
        ((failed++))
        echo ""
    fi
done

# Resumen
echo "================================"
echo "📊 Resumen:"
echo "   ✅ Convertidos: $converted"
echo "   ❌ Fallidos: $failed"
echo ""

if [ $converted -gt 0 ]; then
    echo "🎉 Conversión completada!"
    echo ""
    echo "Los archivos GLB están en:"
    echo "   backup_gltf_models/gltf_new/vegetation/**/scene.glb"
else
    echo "❌ No se pudo convertir ningún modelo"
fi
