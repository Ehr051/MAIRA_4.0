#!/bin/bash

# 🌳 DESCARGA DE MODELOS 3D ALTERNATIVOS - MAIRA 4.0
# ===================================================
# Descarga modelos 3D alternativos (árboles, arbustos, pasto) desde fuentes públicas

echo "🌳 MAIRA 4.0 - Descarga de Modelos 3D Alternativos"
echo "=================================================="

# Crear directorios
mkdir -p Client/assets/models/alternatives/trees
mkdir -p Client/assets/models/alternatives/bushes
mkdir -p Client/assets/models/alternatives/grass
cd Client/assets/models/alternatives

echo "📁 Directorio: $(pwd)"
echo ""

# Función para descargar archivo
download_model() {
    local url="$1"
    local filename="$2"
    local description="$3"
    local category="$4"

    echo "⬇️  Descargando: $description"
    echo "   📂 Archivo: $filename"
    echo "   📁 Categoría: $category"
    echo "   🔗 URL: $url"

    if command -v curl &> /dev/null; then
        curl -L -o "$filename" "$url" --progress-bar
    elif command -v wget &> /dev/null; then
        wget -O "$filename" "$url"
    else
        echo "❌ Error: curl o wget no disponible"
        return 1
    fi

    if [ -f "$filename" ] && [ -s "$filename" ]; then
        echo "   ✅ Descargado exitosamente"
        echo "   📊 Tamaño: $(du -h "$filename" | cut -f1)"
    else
        echo "   ❌ Error en la descarga o archivo vacío"
        rm -f "$filename" 2>/dev/null
    fi
    echo ""
}

echo "🚀 INICIANDO DESCARGA DE MODELOS ALTERNATIVOS"
echo "============================================="
echo ""

# ÁRBOLES
echo "🌲 DESCARGANDO ÁRBOLES..."
echo ""

cd trees

# Árboles desde fuentes públicas
download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Tree/glTF/Tree.gltf" \
    "tree_sample.gltf" \
    "Árbol de muestra (GLTF Sample Models)" \
    "trees"

download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Tree/glTF/Tree.bin" \
    "tree_sample.bin" \
    "Binario del árbol de muestra" \
    "trees"

# Más árboles de fuentes alternativas
download_model \
    "https://www.mixamo.com/models/tree-oak" \
    "oak_tree.fbx" \
    "Árbol de roble (Mixamo - requiere conversión)" \
    "trees"

cd ..

# ARBUSTOS
echo "🌿 DESCARGANDO ARBUSTOS..."
echo ""

cd bushes

# Arbustos desde fuentes públicas
download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Bush/glTF/Bush.gltf" \
    "bush_sample.gltf" \
    "Arbusto de muestra (GLTF Sample Models)" \
    "bushes"

download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Bush/glTF/Bush.bin" \
    "bush_sample.bin" \
    "Binario del arbusto de muestra" \
    "bushes"

cd ..

# PASTO/HIERBA
echo "🌱 DESCARGANDO PASTO Y HIERBA..."
echo ""

cd grass

# Modelos de pasto
download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Grass/glTF/Grass.gltf" \
    "grass_sample.gltf" \
    "Pasto de muestra (GLTF Sample Models)" \
    "grass"

download_model \
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Grass/glTF/Grass.bin" \
    "grass_sample.bin" \
    "Binario del pasto de muestra" \
    "grass"

cd ..

echo "🔄 CREANDO MODELOS PROCEDURALES DE RESPALDO"
echo "==========================================="

# Crear modelos procedurales simples como respaldo
cat > create_fallback_models.js << 'EOF'
// Script Node.js para crear modelos 3D procedurales simples
const fs = require('fs');
const path = require('path');

console.log('🔧 Creando modelos procedurales de respaldo...');

// Función para crear un modelo GLTF simple
function createSimpleGLTF(name, geometry, color = 0x00ff00) {
    const gltf = {
        asset: { version: "2.0" },
        scenes: [{ nodes: [0] }],
        nodes: [{
            mesh: 0,
            translation: [0, 0, 0],
            rotation: [0, 0, 0, 1],
            scale: [1, 1, 1]
        }],
        meshes: [{
            primitives: [{
                attributes: {
                    POSITION: 0,
                    NORMAL: 1
                },
                indices: 2,
                material: 0
            }]
        }],
        buffers: [{
            uri: `${name}.bin`,
            byteLength: 0 // Se calculará después
        }],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 0 }, // positions
            { buffer: 0, byteOffset: 0, byteLength: 0 }, // normals
            { buffer: 0, byteOffset: 0, byteLength: 0 }  // indices
        ],
        accessors: [
            { bufferView: 0, componentType: 5126, count: 0, type: "VEC3", min: [0,0,0], max: [1,1,1] },
            { bufferView: 1, componentType: 5126, count: 0, type: "VEC3" },
            { bufferView: 2, componentType: 5123, count: 0, type: "SCALAR" }
        ],
        materials: [{
            pbrMetallicRoughness: {
                baseColorFactor: [0.0, 1.0, 0.0, 1.0],
                metallicFactor: 0.0,
                roughnessFactor: 1.0
            }
        }]
    };

    // Crear geometría básica según el tipo
    let positions, normals, indices;

    switch(geometry) {
        case 'tree':
            // Árbol simple (cono)
            positions = new Float32Array([
                0, 2, 0,   // top
                -0.5, 0, 0.5,  // base
                0.5, 0, 0.5,
                0.5, 0, -0.5,
                -0.5, 0, -0.5
            ]);
            normals = new Float32Array([
                0, 1, 0,
                -0.5, 0, 0.5,
                0.5, 0, 0.5,
                0.5, 0, -0.5,
                -0.5, 0, -0.5
            ]);
            indices = new Uint16Array([
                0, 1, 2,
                0, 2, 3,
                0, 3, 4,
                0, 4, 1,
                1, 3, 2,
                1, 4, 3
            ]);
            break;

        case 'bush':
            // Arbusto simple (esfera)
            positions = new Float32Array([
                0, 0.5, 0,    // top
                -0.3, 0, 0.3, // base points
                0.3, 0, 0.3,
                0.3, 0, -0.3,
                -0.3, 0, -0.3
            ]);
            normals = new Float32Array([
                0, 1, 0,
                -0.3, 0, 0.3,
                0.3, 0, 0.3,
                0.3, 0, -0.3,
                -0.3, 0, -0.3
            ]);
            indices = new Uint16Array([
                0, 1, 2,
                0, 2, 3,
                0, 3, 4,
                0, 4, 1
            ]);
            break;

        case 'grass':
        default:
            // Pasto simple (plano)
            positions = new Float32Array([
                -0.5, 0, 0,
                0.5, 0, 0,
                0, 1, 0
            ]);
            normals = new Float32Array([
                0, 0, 1,
                0, 0, 1,
                0, 0, 1
            ]);
            indices = new Uint16Array([0, 1, 2]);
            break;
    }

    // Actualizar GLTF con datos reales
    gltf.accessors[0].count = positions.length / 3;
    gltf.accessors[1].count = normals.length / 3;
    gltf.accessors[2].count = indices.length;

    // Calcular bounding box
    let min = [Infinity, Infinity, Infinity];
    let max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < positions.length; i += 3) {
        min[0] = Math.min(min[0], positions[i]);
        min[1] = Math.min(min[1], positions[i+1]);
        min[2] = Math.min(min[2], positions[i+2]);
        max[0] = Math.max(max[0], positions[i]);
        max[1] = Math.max(max[1], positions[i+1]);
        max[2] = Math.max(max[2], positions[i+2]);
    }
    gltf.accessors[0].min = min;
    gltf.accessors[0].max = max;

    // Crear buffer binario
    const buffer = new ArrayBuffer(positions.byteLength + normals.byteLength + indices.byteLength);
    new Float32Array(buffer, 0, positions.length).set(positions);
    new Float32Array(buffer, positions.byteLength, normals.length).set(normals);
    new Uint16Array(buffer, positions.byteLength + normals.byteLength, indices.length).set(indices);

    gltf.buffers[0].byteLength = buffer.byteLength;
    gltf.bufferViews[0].byteLength = positions.byteLength;
    gltf.bufferViews[1].byteOffset = positions.byteLength;
    gltf.bufferViews[1].byteLength = normals.byteLength;
    gltf.bufferViews[2].byteOffset = positions.byteLength + normals.byteLength;
    gltf.bufferViews[2].byteLength = indices.byteLength;

    return { gltf, buffer };
}

// Crear modelos procedurales
const models = [
    { name: 'tree_fallback', geometry: 'tree', dir: 'trees' },
    { name: 'bush_fallback', geometry: 'bush', dir: 'bushes' },
    { name: 'grass_fallback', geometry: 'grass', dir: 'grass' }
];

models.forEach(({ name, geometry, dir }) => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const gltfPath = path.join(dirPath, `${name}.gltf`);
    const binPath = path.join(dirPath, `${name}.bin`);

    if (!fs.existsSync(gltfPath)) {
        console.log(`📝 Creando modelo procedural: ${name}`);

        const { gltf, buffer } = createSimpleGLTF(name, geometry);

        fs.writeFileSync(gltfPath, JSON.stringify(gltf, null, 2));
        fs.writeFileSync(binPath, Buffer.from(buffer));

        console.log(`   ✅ Creado: ${gltfPath}`);
        console.log(`   ✅ Creado: ${binPath}`);
    } else {
        console.log(`✅ Ya existe: ${name}`);
    }
});

console.log('✅ Modelos procedurales de respaldo creados');
EOF

echo "🔧 Ejecutando script de modelos procedurales..."
node create_fallback_models.js

echo ""
echo "📋 RESUMEN DE DESCARGA"
echo "======================"
echo "Modelos descargados en Client/assets/models/alternatives/"
echo ""
echo "🌲 Árboles: $(ls -1 trees/ 2>/dev/null | wc -l) archivos"
echo "🌿 Arbustos: $(ls -1 bushes/ 2>/dev/null | wc -l) archivos"  
echo "🌱 Pasto: $(ls -1 grass/ 2>/dev/null | wc -l) archivos"
echo ""
echo "💡 NOTAS:"
echo "   - Los modelos GLTF pueden requerir conversión para compatibilidad"
echo "   - Los modelos procedurales sirven como respaldo"
echo "   - Verifica las licencias de uso de los modelos descargados"
echo ""
echo "✅ DESCARGA COMPLETADA"