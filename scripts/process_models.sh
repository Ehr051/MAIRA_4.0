#!/bin/bash

# Script para procesar modelos 3D de Sketchfab
# Descomprime ZIPs de GLTF, organiza la estructura y limpia archivos temporales

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
        
        # Buscar archivos GLTF en la estructura descomprimida
        gltf_files=$(find "$TEMP_DIR/$filename" -name "*.gltf" -type f)
        
        if [ -n "$gltf_files" ]; then
            echo "   ✅ Archivo GLTF encontrado"
            
            # Mover todo el contenido al directorio del modelo
            cp -r "$TEMP_DIR/$filename"/* "$model_dir/"
            
            # Buscar y mostrar archivos principales
            gltf_file=$(find "$model_dir" -name "*.gltf" -type f | head -1)
            bin_files=$(find "$model_dir" -name "*.bin" -type f | wc -l)
            texture_files=$(find "$model_dir" -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" -type f | wc -l)
            
            echo "   📄 GLTF: $(basename "$gltf_file")"
            echo "   🗂️  BIN files: $bin_files"
            echo "   🖼️  Texturas: $texture_files"
        else
            echo "   ⚠️  No se encontró archivo GLTF"
            # Listar contenido para debug
            echo "   📋 Contenido:"
            find "$TEMP_DIR/$filename" -type f | head -5
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
echo "📊 Estructura final:"
ls -la "$MODELS_DIR" | grep "^d" | grep -v "^\.$\|^\.\.%" | wc -l | xargs echo "   Directorios de modelos:"

echo ""
echo "🌳 Modelos de vegetación procesados:"
for model_dir in "$MODELS_DIR"/*/; do
    if [ -d "$model_dir" ]; then
        model_name=$(basename "$model_dir")
        gltf_file=$(find "$model_dir" -name "*.gltf" -type f | head -1)
        if [ -n "$gltf_file" ]; then
            echo "   ✅ $model_name"
        fi
    fi
done

echo ""
echo "🚀 ¡Modelos listos para usar en MAIRA!"
