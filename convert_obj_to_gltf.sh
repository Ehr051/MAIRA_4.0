#!/bin/bash

# Script para convertir modelos OBJ a GLTF usando obj2gltf
# Procesa los modelos militares de Tripo Studio

MODELS_DIR="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/assets/models"

echo "🔄 Instalando obj2gltf para conversión OBJ → GLTF..."

# Instalar obj2gltf globalmente
npm install -g obj2gltf

echo ""
echo "🚗 Convirtiendo modelos militares OBJ → GLTF..."

# Función para convertir OBJ a GLTF
convert_obj_to_gltf() {
    local model_name=$1
    local model_dir="$MODELS_DIR/$model_name"
    
    if [ -d "$model_dir" ]; then
        echo "🔄 Procesando: $model_name"
        
        # Buscar archivo OBJ
        obj_file=$(find "$model_dir" -name "*.obj" -type f | head -1)
        
        if [ -n "$obj_file" ]; then
            echo "   📄 OBJ encontrado: $(basename "$obj_file")"
            
            # Convertir a GLTF
            gltf_output="$model_dir/model.gltf"
            
            echo "   🔄 Convirtiendo a GLTF..."
            obj2gltf -i "$obj_file" -o "$gltf_output"
            
            if [ -f "$gltf_output" ]; then
                echo "   ✅ Conversión exitosa"
                
                # Verificar archivos generados
                bin_files=$(find "$model_dir" -name "*.bin" -type f | wc -l)
                texture_files=$(find "$model_dir" -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -type f | wc -l)
                
                echo "   📊 Archivos generados:"
                echo "      - GLTF: model.gltf"
                echo "      - BIN files: $bin_files"
                echo "      - Texturas: $texture_files"
            else
                echo "   ❌ Error en la conversión"
            fi
        else
            echo "   ⚠️  No se encontró archivo OBJ"
        fi
        echo ""
    fi
}

# Convertir cada modelo militar
convert_obj_to_gltf "SK105"
convert_obj_to_gltf "VCTP" 
convert_obj_to_gltf "palmaria"

echo "🎉 Conversión completada!"
echo ""
echo "📊 Resumen de modelos disponibles:"

for model_dir in "$MODELS_DIR"/*/; do
    if [ -d "$model_dir" ]; then
        model_name=$(basename "$model_dir")
        gltf_file=$(find "$model_dir" -name "*.gltf" -type f | head -1)
        
        if [ -n "$gltf_file" ]; then
            if [[ "$model_name" =~ ^(SK105|VCTP|palmaria)$ ]]; then
                echo "🚗 $model_name (militar)"
            else
                echo "🌳 $model_name (vegetación)"
            fi
        fi
    fi
done

echo ""
echo "🚀 ¡Todos los modelos listos para MAIRA!"
