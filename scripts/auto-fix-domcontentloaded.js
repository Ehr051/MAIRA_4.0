#!/usr/bin/env node

/**
 * 🔧 CORRECCIÓN AUTOMÁTICA - DOMContentLoaded
 * 
 * Script para corregir automáticamente los archivos con DOMContentLoaded
 * aplicando el patrón de verificación de readyState
 */

const fs = require('fs');
const path = require('path');

// ARCHIVOS YA CORREGIDOS - NO TOCAR
const FIXED_FILES = [
    'landing3d.js',
    'validacion.js', 
    'carrusel.js',
    'config.js',
    'terrainAdapter.js',
    'iniciarpartida.js',
    'indexP.js'
];

// PATRONES A BUSCAR Y REEMPLAZAR
const PATTERNS = [
    {
        old: /document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{/g,
        new: (match, filename) => `
// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando ${filename} (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')});
} else {
    console.log("✅ DOM ya cargado, inicializando ${filename} inmediatamente");
    initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}();
}

function initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}() {
    console.log('🚀 Ejecutando inicialización de ${filename}');`
    },
    {
        old: /document\.addEventListener\('DOMContentLoaded',\s*async\s*function\(\)\s*\{/g,
        new: (match, filename) => `
// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando ${filename} (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')});
} else {
    console.log("✅ DOM ya cargado, inicializando ${filename} inmediatamente");
    initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}();
}

async function initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}() {
    console.log('🚀 Ejecutando inicialización de ${filename}');`
    },
    {
        old: /document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/g,
        new: (match, filename) => `
// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando ${filename} (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')});
} else {
    console.log("✅ DOM ya cargado, inicializando ${filename} inmediatamente");
    initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}();
}

function initialize${filename.replace('.js', '').replace(/[^a-zA-Z0-9]/g, '')}() {
    console.log('🚀 Ejecutando inicialización de ${filename}');`
    }
];

function fixFile(filePath) {
    const filename = path.basename(filePath);
    
    // Verificar si ya está corregido
    if (FIXED_FILES.some(fixed => filename.includes(fixed))) {
        console.log(`⏭️ SALTANDO ${filePath} - ya está corregido`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let wasModified = false;
        
        // Aplicar cada patrón
        for (const pattern of PATTERNS) {
            if (pattern.old.test(content)) {
                content = content.replace(pattern.old, pattern.new('', filename));
                wasModified = true;
                console.log(`✅ CORRIGIENDO ${filePath} - Patrón aplicado`);
            }
        }
        
        if (wasModified) {
            // Escribir el archivo corregido
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`💾 GUARDADO ${filePath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`❌ ERROR procesando ${filePath}:`, error.message);
    }
    
    return false;
}

function scanAndFix(dir) {
    let fixedCount = 0;
    
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
                        if (fixFile(fullPath)) {
                            fixedCount++;
                        }
                    }
                } catch (err) {
                    // Ignorar archivos que no se pueden leer
                }
            }
        }
    }
    
    scanDir(dir);
    return fixedCount;
}

// EJECUTAR CORRECCIÓN
console.log('🔧 INICIANDO CORRECCIÓN AUTOMÁTICA DE DOMContentLoaded...\n');

const fixedCount = scanAndFix('./Client');

console.log(`\n📊 RESUMEN:`);
console.log(`Archivos corregidos: ${fixedCount}`);
console.log(`\n⚠️ NOTA: Revisa manualmente los archivos corregidos para verificar que:`);
console.log(`1. Las funciones se cierren correctamente (}) no });`);
console.log(`2. Los nombres de función generados sean válidos`);
console.log(`3. No haya conflictos de nombres`);
console.log(`\n🚀 Ejecuta 'git diff' para ver los cambios aplicados`);

module.exports = { fixFile, scanAndFix };
