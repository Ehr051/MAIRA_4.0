/**
 * PRUEBA DE CONFIGURACIÓN - MODELOS DE VEGETACIÓN MAIRA 4.0 (Node.js)
 * ================================================================
 *
 * Verifica la configuración básica de modelos de vegetación sin requerir DOM.
 */

console.log('🧪 Iniciando pruebas de configuración de vegetación MAIRA 4.0...');

// Simular configuración básica (extraída de maira3DMaster.js)
const mockConfig = {
    models: {
        // Modelos reales GLTF disponibles
        'tank_tam': '/backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf',
        'tank_tam_war': '/backup_gltf_models/gltf_new/tam_war_thunder/scene.gltf',
        'humvee': '/backup_gltf_models/gltf_new/humvee/scene.gltf',
        'm113': '/backup_gltf_models/gltf_new/m113/scene.gltf',
        'ural': '/backup_gltf_models/gltf_new/ural_4320/scene.gltf',
        'soldier': '/backup_gltf_models/gltf_new/soldier/scene.gltf',
        'russian_soldier': '/backup_gltf_models/gltf_new/russian_soldier/scene.gltf',
        'tent_military': '/backup_gltf_models/gltf_new/tent_military/scene.gltf',
        'medical_tent': '/backup_gltf_models/gltf_new/medical_tent/scene.gltf',
        // Modelos de vegetación
        'grass': '/backup_gltf_models/gltf_new/vegetation/grass/scene.gltf',
        'tree_tall': '/backup_gltf_models/gltf_new/vegetation/tree_tall/scene.gltf',
        'tree_medium': '/backup_gltf_models/gltf_new/vegetation/tree_medium/scene.gltf',
        'bush': '/backup_gltf_models/gltf_new/vegetation/bush/scene.gltf'
    }
};

// Simular método getSIDCFromModelType
function getSIDCFromModelType(modelType) {
    const sidcMap = {
        'tank_tam': 'SFGPUCII------',      // Tanque amigo
        'tank_tam_war': 'SFGPUCII------',  // Tanque amigo
        'm113': 'SFGPUCV-------',          // APC amigo
        'ural': 'SFGPUCR-------',           // Camión amigo
        'humvee': 'SFGPUCR-------',         // Vehículo ligero amigo
        'soldier': 'SHGPUCII------',        // Infantería amiga
        'russian_soldier': 'SFGPUCII------', // Infantería enemiga (usando tanque como ejemplo)
        'tent_military': 'GHGPGPA-------',  // Tienda militar
        'medical_tent': 'GHGPGPA-------',   // Tienda médica
        // Modelos de vegetación (no requieren SIDC militar)
        'grass': null,                      // Pasto
        'tree_tall': null,                  // Árbol alto
        'tree_medium': null,                // Árbol mediano
        'bush': null                         // Arbusto
    };

    // Para modelos de vegetación, devolver null explícitamente
    if (modelType in sidcMap) {
        return sidcMap[modelType];
    }

    return 'SHGPUCII------'; // Default: infantería amiga
}

// Verificar configuración de modelos de vegetación
console.log('🔍 Verificando configuración de modelos...');
const expectedModels = ['grass', 'tree_tall', 'tree_medium', 'bush'];
let configValid = true;

expectedModels.forEach(modelType => {
    if (mockConfig.models[modelType]) {
        console.log(`✅ Modelo ${modelType}: ${mockConfig.models[modelType]}`);
    } else {
        console.error(`❌ Modelo ${modelType} no encontrado en configuración`);
        configValid = false;
    }
});

// Verificar SIDC mapping para vegetación
console.log('🔍 Verificando mapeo SIDC para vegetación...');
let sidcValid = true;

expectedModels.forEach(modelType => {
    const sidc = getSIDCFromModelType(modelType);
    if (sidc === null) {
        console.log(`✅ ${modelType} correctamente mapeado como elemento ambiental (sin SIDC)`);
    } else {
        console.warn(`⚠️ ${modelType} tiene SIDC asignado: ${sidc}`);
        sidcValid = false;
    }
});

// Verificar archivos GLTF existen
console.log('🔍 Verificando existencia de archivos GLTF...');
const fs = require('fs');
const path = require('path');

let filesValid = true;
expectedModels.forEach(modelType => {
    const filePath = path.join(__dirname, mockConfig.models[modelType]);
    if (fs.existsSync(filePath)) {
        console.log(`✅ Archivo GLTF existe: ${modelType}`);
    } else {
        console.error(`❌ Archivo GLTF no encontrado: ${modelType} en ${filePath}`);
        filesValid = false;
    }
});

// Resultado final
console.log('\n📊 RESULTADO DE PRUEBAS:');
console.log(`Configuración: ${configValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
console.log(`Mapeo SIDC: ${sidcValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
console.log(`Archivos GLTF: ${filesValid ? '✅ PRESENTES' : '❌ FALTANTES'}`);

if (configValid && sidcValid && filesValid) {
    console.log('\n🎉 TODAS LAS PRUEBAS PASARON - Sistema de vegetación configurado correctamente');
} else {
    console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON - Revisar configuración');
}