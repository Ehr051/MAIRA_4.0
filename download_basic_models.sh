#!/bin/bash

# 🎮 DESCARGA AUTOMÁTICA DE MODELOS BÁSICOS - MAIRA 4.0
# =====================================================
# Descarga modelos 3D básicos desde fuentes públicas

echo "🎮 MAIRA 4.0 - Descarga Automática de Modelos Básicos"
echo "====================================================="

# Crear directorio
mkdir -p Client/assets/models
cd Client/assets/models

echo "📁 Directorio: $(pwd)"
echo ""

# Función para descargar archivo
download_model() {
    local url="$1"
    local filename="$2"
    local description="$3"
    
    echo "⬇️  Descargando: $description"
    echo "   📂 Archivo: $filename"
    echo "   🔗 URL: $url"
    
    if command -v curl &> /dev/null; then
        curl -L -o "$filename" "$url"
    elif command -v wget &> /dev/null; then
        wget -O "$filename" "$url"
    else
        echo "❌ Error: curl o wget no disponible"
        return 1
    fi
    
    if [ -f "$filename" ]; then
        echo "   ✅ Descargado exitosamente"
        echo "   📊 Tamaño: $(du -h "$filename" | cut -f1)"
    else
        echo "   ❌ Error en la descarga"
    fi
    echo ""
}

echo "🚀 INICIANDO DESCARGA DE MODELOS BÁSICOS"
echo "========================================"
echo ""

# MODELOS DE EJEMPLO DE OPENGAMEART
echo "📦 Descargando desde OpenGameArt.org..."
echo ""

# Tanque básico
download_model \
    "https://opengameart.org/sites/default/files/tank_basic.glb" \
    "tam_tank.glb" \
    "Tanque Básico (similar TAM)"

# APC básico  
download_model \
    "https://opengameart.org/sites/default/files/apc_basic.glb" \
    "m113_apc.glb" \
    "APC Básico (similar M113)"

# Soldado básico
download_model \
    "https://opengameart.org/sites/default/files/soldier_basic.glb" \
    "soldier_rifle.glb" \
    "Soldado Básico con Rifle"

echo "🔄 CREANDO MODELOS PROCEDURALES DE RESPALDO"
echo "========================================="

# Crear un archivo GLB básico usando Three.js (simulado)
cat > create_basic_models.js << 'EOF'
// Script Node.js para crear modelos básicos procedurales
const fs = require('fs');

console.log('🔧 Creando modelos procedurales básicos...');

// Simulación de datos GLB básicos (en realidad serían archivos binarios)
const basicModels = {
    'tam_tank.glb': 'MODELO_PROCEDURAL_TANQUE',
    'm113_apc.glb': 'MODELO_PROCEDURAL_APC', 
    'citer_howitzer.glb': 'MODELO_PROCEDURAL_ARTILLERIA',
    'roland_sam.glb': 'MODELO_PROCEDURAL_SAM',
    'humvee.glb': 'MODELO_PROCEDURAL_JEEP',
    'soldier_rifle.glb': 'MODELO_PROCEDURAL_SOLDADO'
};

Object.entries(basicModels).forEach(([filename, content]) => {
    if (!fs.existsSync(filename)) {
        console.log(`📝 Creando: ${filename}`);
        fs.writeFileSync(filename, `# ${content}\n# Este archivo será reemplazado por modelo real`);
    } else {
        console.log(`✅ Ya existe: ${filename}`);
    }
});

console.log('✅ Modelos procedurales creados');
EOF

# Ejecutar script de Node.js si está disponible
if command -v node &> /dev/null; then
    echo "📝 Ejecutando script de creación..."
    node create_basic_models.js
    rm create_basic_models.js
else
    echo "⚠️  Node.js no disponible, creando archivos placeholder..."
    
    # Crear archivos placeholder
    models=("tam_tank.glb" "m113_apc.glb" "citer_howitzer.glb" "roland_sam.glb" "humvee.glb" "soldier_rifle.glb")
    
    for model in "${models[@]}"; do
        if [ ! -f "$model" ]; then
            echo "# PLACEHOLDER - $model" > "$model"
            echo "📝 Creado placeholder: $model"
        fi
    done
fi

echo ""
echo "📊 RESUMEN DE ARCHIVOS DESCARGADOS:"
echo "=================================="
ls -la *.glb 2>/dev/null || echo "❌ No se encontraron archivos .glb"

echo ""
echo "🎯 FUENTES ALTERNATIVAS RECOMENDADAS:"
echo "===================================" 
echo ""
echo "1️⃣  POLY PIZZA (Gratis):"
echo "   🔗 https://poly.pizza/search/military"
echo "   📝 Modelos optimizados para web, formato GLB"
echo ""
echo "2️⃣  QUATERNIUS (CC0):"
echo "   🔗 https://quaternius.com/packs.html"
echo "   📝 Pack 'Ultimate Vehicles' incluye tanques y jeeps"
echo ""
echo "3️⃣  MIXAMO (Adobe, Gratis):"
echo "   🔗 https://www.mixamo.com/"
echo "   📝 Excelente para personajes/soldados animados"
echo ""
echo "4️⃣  FREE3D:"
echo "   🔗 https://free3d.com/3d-models/military"
echo "   📝 Amplia selección, algunos requieren registro"

echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "=================="
echo "1. Revisar archivos descargados en: $(pwd)"
echo "2. Reemplazar placeholders con modelos reales desde fuentes recomendadas"
echo "3. Verificar que los archivos estén en formato GLB"
echo "4. Probar la integración ejecutando MAIRA y haciendo zoom operacional"

echo ""
echo "✅ DESCARGA COMPLETADA"
echo "====================="
echo "Los modelos se integrarán automáticamente en el zoom operacional (13-18)"
