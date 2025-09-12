#!/bin/bash

echo "🔄 Extrayendo TIF files de elevación..."

# Función para extraer archivos tar.gz
extract_region() {
    local region=$1
    local base_path="Client/Libs/datos_argentina/Altimetria_Mini_Tiles/$region"
    
    echo "📂 Procesando región: $region"
    
    # Crear directorio de extracción si no existe
    mkdir -p "$base_path/extracted"
    
    # Contar archivos tar.gz
    local tar_count=$(ls $base_path/*.tar.gz 2>/dev/null | wc -l)
    echo "   Encontrados $tar_count archivos tar.gz"
    
    if [ $tar_count -eq 0 ]; then
        echo "   ⚠️ No se encontraron archivos tar.gz en $region"
        return
    fi
    
    # Extraer cada archivo tar.gz
    for tar_file in $base_path/*.tar.gz; do
        if [ -f "$tar_file" ]; then
            echo "   🔄 Extrayendo $(basename $tar_file)..."
            tar -xzf "$tar_file" -C "$base_path/extracted/" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "   ✅ Extraído exitosamente"
            else
                echo "   ❌ Error extrayendo $(basename $tar_file)"
            fi
        fi
    done
    
    # Contar TIF files extraídos
    local tif_count=$(find "$base_path/extracted" -name "*.tif" 2>/dev/null | wc -l)
    echo "   🎯 Total TIF files extraídos: $tif_count"
}

# Extraer cada región
for region in norte centro centro_norte sur patagonia; do
    extract_region $region
done

echo "✅ Extracción completada!"
echo ""
echo "📊 Resumen final:"
for region in norte centro centro_norte sur patagonia; do
    tif_count=$(find "Client/Libs/datos_argentina/Altimetria_Mini_Tiles/$region/extracted" -name "*.tif" 2>/dev/null | wc -l)
    echo "   $region: $tif_count TIF files"
done

