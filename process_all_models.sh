#!/bin/bash

# Script mejorado para procesar modelos 3D
# Procesa GLTF (Sketchfab) y convierte OBJ (Tripo Studio) a GLTF

MODELS_DIR="/Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Client/assets/models"
TEMP_DIR="$MODELS_DIR/temp_extract"

echo "🌟 Iniciando procesamiento de modelos 3D..."
echo "📁 Directorio de modelos: $MODELS_DIR"

# Crear directorio temporal
mkdir -p "$TEMP_DIR"

# Contar archivos ZIP
ZIP_COUNT=$(ls "$MODELS_DIR"/*.zip 2>/dev/null | wc -l)
echo "📦 Archivos ZIP encontrados: $ZIP_COUNT"

if [ $ZIP_COUNT -eq 0 ]; then
    echo "❌ No se encontraron archivos ZIP para procesar"
    rmdir "$TEMP_DIR" 2>/dev/null
    exit 1
fi

# Procesar cada archivo ZIP
for zip_file in "$MODELS_DIR"/*.zip; do
    if [ -f "$zip_file" ]; then
        filename=$(basename "$zip_file" .zip)
        echo ""
        echo "🔄 Procesando: $filename"
        
        # Crear directorio para este modelo
        model_dir="$MODELS_DIR/$filename"
        mkdir -p "$model_dir"
        
        # Descomprimir
        echo "   📂 Descomprimiendo..."
        unzip -q "$zip_file" -d "$TEMP_DIR/$filename"
        
        # Buscar archivos GLTF primero
        gltf_files=$(find "$TEMP_DIR/$filename" -name "*.gltf" -type f)
        
        if [ -n "$gltf_files" ]; then
            echo "   ✅ Archivo GLTF encontrado (Sketchfab)"
            
            # Mover todo el contenido al directorio del modelo
            cp -r "$TEMP_DIR/$filename"/* "$model_dir/"
            
            # Mostrar información
            gltf_file=$(find "$model_dir" -name "*.gltf" -type f | head -1)
            bin_files=$(find "$model_dir" -name "*.bin" -type f | wc -l)
            texture_files=$(find "$model_dir" -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -type f | wc -l)
            
            echo "   📄 GLTF: $(basename "$gltf_file")"
            echo "   🗂️  BIN files: $bin_files"
            echo "   🖼️  Texturas: $texture_files"
            
        else
            # Buscar archivos OBJ (Tripo Studio)
            obj_files=$(find "$TEMP_DIR/$filename" -name "*.obj" -type f)
            
            if [ -n "$obj_files" ]; then
                echo "   🚗 Archivo OBJ encontrado (Tripo Studio)"
                
                # Mover archivos originales
                cp -r "$TEMP_DIR/$filename"/* "$model_dir/"
                
                # Convertir OBJ a GLTF
                obj_file=$(find "$model_dir" -name "*.obj" -type f | head -1)
                gltf_output="$model_dir/model.gltf"
                
                echo "   📄 OBJ: $(basename "$obj_file")"
                echo "   🔄 Convirtiendo OBJ → GLTF..."
                
                # Usar obj2gltf para la conversión
                if obj2gltf -i "$obj_file" -o "$gltf_output"; then
                    echo "   ✅ Conversión exitosa"
                    
                    # Verificar archivos generados
                    bin_files=$(find "$model_dir" -name "*.bin" -type f | wc -l)
                    texture_files=$(find "$model_dir" -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -type f | wc -l)
                    mtl_files=$(find "$model_dir" -name "*.mtl" -type f | wc -l)
                    
                    echo "   📊 Resultado:"
                    echo "      - GLTF: model.gltf"
                    echo "      - BIN files: $bin_files"  
                    echo "      - Texturas: $texture_files"
                    echo "      - MTL files: $mtl_files"
                else
                    echo "   ❌ Error en la conversión OBJ → GLTF"
                fi
            else
                echo "   ⚠️  No se encontraron archivos GLTF ni OBJ"
                # Listar contenido para debug
                echo "   📋 Contenido encontrado:"
                find "$TEMP_DIR/$filename" -type f | head -5
            fi
        fi
        
        # Limpiar directorio temporal de este modelo
        rm -rf "$TEMP_DIR/$filename"
        
        # Eliminar archivo ZIP
        echo "   🗑️  Eliminando ZIP original"
        rm -f "$zip_file"
    fi
done

# Limpiar directorio temporal
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Procesamiento completado!"
echo ""
echo "📊 Resumen final de modelos:"

military_count=0
vegetation_count=0
obstacle_count=0

for model_dir in "$MODELS_DIR"/*/; do
    if [ -d "$model_dir" ]; then
        model_name=$(basename "$model_dir")
        gltf_file=$(find "$model_dir" -name "*.gltf" -type f | head -1)
        
        if [ -n "$gltf_file" ]; then
            # Clasificar modelos
            if [[ "$model_name" =~ ^(sk105|vctp|palmaria)$ ]]; then
                echo "🚗 $model_name (militar)"
                ((military_count++))
            elif [[ "$model_name" =~ (arbol|arbusto|pasto) ]]; then
                echo "🌳 $model_name (vegetación)"
                ((vegetation_count++))
            elif [[ "$model_name" =~ (obstacle|dragon|wire|antitanque) ]]; then
                echo "🚧 $model_name (obstáculo)"
                ((obstacle_count++))
            else
                echo "📦 $model_name (otro)"
            fi
        fi
    fi
done

echo ""
echo "📈 Estadísticas:"
echo "   🚗 Vehículos militares: $military_count"
echo "   🌳 Vegetación: $vegetation_count"  
echo "   🚧 Obstáculos: $obstacle_count"
echo ""
echo "🚀 ¡Todos los modelos listos para MAIRA!"
