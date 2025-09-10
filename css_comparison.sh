#!/bin/bash

# 🎨 SCRIPT DE ANÁLISIS Y RESTAURACIÓN CSS MAIRA 4.0
# Compara archivos CSS originales con actuales y permite restaurar

echo "🎨 ANÁLISIS CSS MAIRA 4.0"
echo "========================="
echo

# Función para comparar archivos
compare_css() {
    local old_file="$1"
    local new_file="$2"
    local name="$3"
    
    echo "📄 Analizando: $name"
    echo "-------------------"
    
    if [[ ! -f "$old_file" ]]; then
        echo "❌ Archivo original no encontrado: $old_file"
        return
    fi
    
    if [[ ! -f "$new_file" ]]; then
        echo "❌ Archivo actual no encontrado: $new_file"
        return
    fi
    
    local old_size=$(wc -c < "$old_file")
    local new_size=$(wc -c < "$new_file")
    local old_lines=$(wc -l < "$old_file")
    local new_lines=$(wc -l < "$new_file")
    
    echo "📏 Tamaño original: $old_size bytes ($old_lines líneas)"
    echo "📏 Tamaño actual:   $new_size bytes ($new_lines líneas)"
    
    local size_diff=$((new_size - old_size))
    local lines_diff=$((new_lines - old_lines))
    
    if [[ $size_diff -eq 0 ]]; then
        echo "✅ Sin cambios de tamaño"
    elif [[ $size_diff -gt 0 ]]; then
        echo "📈 Incremento: +$size_diff bytes (+$lines_diff líneas)"
    else
        echo "📉 Reducción: $size_diff bytes ($lines_diff líneas)"
    fi
    
    # Verificar si son idénticos
    if diff -q "$old_file" "$new_file" >/dev/null 2>&1; then
        echo "✅ Archivos idénticos"
    else
        echo "⚠️  Archivos diferentes"
        echo "🔍 Primeras diferencias:"
        diff -u "$old_file" "$new_file" | head -20
    fi
    
    echo
}

# Función para crear backup
create_backup() {
    local file="$1"
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [[ -f "$file" ]]; then
        cp "$file" "$backup_file"
        echo "💾 Backup creado: $backup_file"
    fi
}

# Función para restaurar archivo
restore_css() {
    local old_file="$1"
    local new_file="$2"
    local name="$3"
    
    echo "🔄 ¿Restaurar $name desde archivo original? (y/N): "
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        create_backup "$new_file"
        cp "$old_file" "$new_file"
        echo "✅ $name restaurado desde archivo original"
    else
        echo "⏭️  $name no modificado"
    fi
}

# Comparaciones principales
echo "🔍 COMPARANDO ARCHIVOS CSS PRINCIPALES"
echo "======================================"
echo

# CYGMarcha.css
compare_css "viejo/css/CYGMarcha.css" "Client/css/common/CYGMarcha.css" "CYGMarcha.css"

# planeamiento.css  
compare_css "viejo/css/planeamiento.css" "Client/css/common/planeamiento.css" "planeamiento.css"

# graficomarcha.css
compare_css "viejo/css/graficomarcha.css" "Client/css/common/graficomarcha.css" "graficomarcha.css"

# Otros archivos importantes
echo "🔍 VERIFICANDO OTROS ARCHIVOS"
echo "============================="
echo

for css_file in CO GBatalla juegodeguerra hexgrid miradial; do
    old_file="viejo/css/${css_file}.css"
    
    # Buscar archivo actual en diferentes ubicaciones
    new_file=""
    if [[ -f "Client/css/common/${css_file}.css" ]]; then
        new_file="Client/css/common/${css_file}.css"
    elif [[ -f "Client/css/modules/organizacion/${css_file}.css" ]] && [[ "$css_file" == "CO" ]]; then
        new_file="Client/css/modules/organizacion/CO.css"
    elif [[ -f "Client/css/modules/gestionbatalla/${css_file}.css" ]] && [[ "$css_file" == "GBatalla" ]]; then
        new_file="Client/css/modules/gestionbatalla/GBatalla.css"
    elif [[ -f "Client/css/modules/juegodeguerra/${css_file}.css" ]] && [[ "$css_file" == "juegodeguerra" ]]; then
        new_file="Client/css/modules/juegodeguerra/juegodeguerra.css"
    elif [[ -f "Client/css/modules/juegodeguerra/hexgrid.css" ]] && [[ "$css_file" == "hexgrid" ]]; then
        new_file="Client/css/modules/juegodeguerra/hexgrid.css"
    fi
    
    if [[ -n "$new_file" ]]; then
        compare_css "$old_file" "$new_file" "${css_file}.css"
    else
        echo "📄 ${css_file}.css: archivo original existe, actual no encontrado"
        echo "   📁 Original: $old_file"
        echo
    fi
done

echo "💡 RECOMENDACIONES"
echo "=================="
echo
echo "1. 📋 Los archivos con cambios significativos requieren revisión manual"
echo "2. 🔄 Usar 'git diff' para ver cambios específicos línea por línea"
echo "3. 💾 Siempre crear backup antes de restaurar"
echo "4. 🧪 Probar cambios en entorno de desarrollo primero"
echo
echo "🎯 COMANDOS ÚTILES:"
echo "git show HEAD~5:Client/css/common/planeamiento.css > temp_old.css"
echo "diff -u temp_old.css Client/css/common/planeamiento.css"
echo "cp viejo/css/planeamiento.css Client/css/common/planeamiento.css.original"
echo

# Opción interactiva para restaurar
echo "🔄 ¿Deseas restaurar algún archivo? (y/N): "
read -r restore_response

if [[ "$restore_response" =~ ^[Yy]$ ]]; then
    restore_css "viejo/css/CYGMarcha.css" "Client/css/common/CYGMarcha.css" "CYGMarcha.css"
    restore_css "viejo/css/planeamiento.css" "Client/css/common/planeamiento.css" "planeamiento.css"
    restore_css "viejo/css/graficomarcha.css" "Client/css/common/graficomarcha.css" "graficomarcha.css"
fi

echo "✅ Análisis completado"
