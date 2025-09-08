#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE CORRECCIÓN MASIVA - DOMContentLoaded
 * 
 * PROBLEMA: Todos los archivos JS que usan DOMContentLoaded fallan cuando son 
 * cargados por el bootstrap, porque el evento ya se disparó.
 * 
 * SOLUCIÓN: Reemplazar patrón DOMContentLoaded con verificación de readyState
 * 
 * USO: node scripts/fix-domcontentloaded.js
 */

const fs = require('fs');
const path = require('path');

// PATRÓN A BUSCAR
const PATTERN_OLD = `document.addEventListener('DOMContentLoaded', function() {`;
const PATTERN_OLD_ARROW = `document.addEventListener('DOMContentLoaded', () => {`;
const PATTERN_OLD_ASYNC = `document.addEventListener('DOMContentLoaded', async function() {`;

// PATRÓN DE REEMPLAZO
const PATTERN_NEW = `
// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando [FILENAME] (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', initialize[FILENAME]);
} else {
    console.log("✅ DOM ya cargado, inicializando [FILENAME] inmediatamente");
    initialize[FILENAME]();
}

function initialize[FILENAME]() {
    console.log('🚀 Ejecutando inicialización de [FILENAME]');
`;

// ARCHIVOS CRÍTICOS QUE YA ESTÁN CORREGIDOS
const FIXED_FILES = [
    'landing3d.js',
    'validacion.js', 
    'carrusel.js',
    'config.js',
    'terrainAdapter.js'
];

// ARCHIVOS QUE NECESITAN CORRECCIÓN PRIORITARIA (según bootstrap)
const PRIORITY_FILES = [
    // Módulos específicos que se cargan en diferentes páginas
    '/Client/js/modules/partidas/iniciarpartida.js',
    '/Client/js/handlers/validacion.js', // Hay dos validacion.js
    '/Client/js/handlers/carrusel.js',   // Hay dos carrusel.js
    
    // Handlers críticos
    '/Client/js/handlers/mapaP.js',
    '/Client/js/handlers/simbolosP.js',
    '/Client/js/handlers/herramientasP.js',
    '/Client/js/handlers/indexP.js',
    '/Client/js/handlers/elevationHandler.js',
    '/Client/js/handlers/vegetacionhandler.js',
    
    // Módulos de organización
    '/Client/js/handlers/CO.js',
    '/Client/js/handlers/paneledicionCO.js',
    
    // Gestión de batalla
    '/Client/js/handlers/gestionBatalla.js',
    '/Client/js/handlers/edicionGB.js',
    '/Client/js/handlers/inicioGBhandler.js'
];

function scanForDOMContentLoaded(dir) {
    const results = [];
    
    function scanDir(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
            const fullPath = path.join(currentDir, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                scanDir(fullPath);
            } else if (file.endsWith('.js')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    if (content.includes('DOMContentLoaded')) {
                        const relativePath = path.relative(process.cwd(), fullPath);
                        const isFixed = FIXED_FILES.some(fixed => relativePath.includes(fixed));
                        const isPriority = PRIORITY_FILES.some(priority => relativePath.includes(priority));
                        
                        results.push({
                            file: relativePath,
                            isFixed,
                            isPriority
                        });
                    }
                } catch (err) {
                    // Ignorar archivos que no se pueden leer
                }
            }
        }
    }
    
    scanDir(dir);
    return results;
}

console.log('🔍 ESCANEANDO ARCHIVOS CON DOMContentLoaded...\n');

const results = scanForDOMContentLoaded('./Client');

console.log('📊 RESUMEN:');
console.log(`Total archivos encontrados: ${results.length}`);
console.log(`Archivos ya corregidos: ${results.filter(r => r.isFixed).length}`);
console.log(`Archivos prioritarios pendientes: ${results.filter(r => r.isPriority && !r.isFixed).length}`);
console.log(`Otros archivos pendientes: ${results.filter(r => !r.isPriority && !r.isFixed).length}\n`);

console.log('✅ ARCHIVOS YA CORREGIDOS:');
results.filter(r => r.isFixed).forEach(r => {
    console.log(`  ✅ ${r.file}`);
});

console.log('\n🚨 ARCHIVOS PRIORITARIOS PENDIENTES:');
results.filter(r => r.isPriority && !r.isFixed).forEach(r => {
    console.log(`  🚨 ${r.file}`);
});

console.log('\n⚠️ OTROS ARCHIVOS PENDIENTES:');
results.filter(r => !r.isPriority && !r.isFixed).forEach(r => {
    console.log(`  ⚠️ ${r.file}`);
});

console.log('\n🔧 PRÓXIMOS PASOS:');
console.log('1. Corregir archivos prioritarios que se cargan en bootstrap');
console.log('2. Usar el patrón de verificación de document.readyState');
console.log('3. Probar cada módulo después de la corrección');
console.log('4. Actualizar este script con archivos corregidos');

module.exports = { scanForDOMContentLoaded, PRIORITY_FILES, FIXED_FILES };
