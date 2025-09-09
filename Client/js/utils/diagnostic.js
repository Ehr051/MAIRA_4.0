// 🔍 MAIRA Bootstrap Diagnostic Tool
// Para debuggear el sistema de carga paso a paso

console.log('🔍 INICIANDO DIAGNÓSTICO MAIRA BOOTSTRAP...');

// Test 1: Verificar disponibilidad de bootstrap
function testBootstrapAvailability() {
    console.log('\n📋 TEST 1: Disponibilidad de Bootstrap');
    console.log('typeof MAIRABootstrap:', typeof MAIRABootstrap);
    console.log('window.MAIRABootstrap:', typeof window.MAIRABootstrap);
    console.log('window.MAIRA:', typeof window.MAIRA);
    console.log('window.MAIRA.Bootstrap:', typeof window.MAIRA?.Bootstrap);
    
    if (typeof MAIRABootstrap !== 'undefined') {
        console.log('✅ MAIRABootstrap disponible');
        console.log('🔍 Métodos disponibles:', Object.getOwnPropertyNames(MAIRABootstrap));
        return true;
    } else {
        console.error('❌ MAIRABootstrap NO disponible');
        return false;
    }
}

// Test 2: Verificar primer archivo de carga
async function testFirstFile() {
    console.log('\n📋 TEST 2: Carga del primer archivo');
    
    try {
        const response = await fetch('./core/UserIdentity.js');
        console.log('📄 UserIdentity.js - Status:', response.status);
        console.log('📄 UserIdentity.js - Headers:', response.headers.get('content-type'));
        
        if (response.ok) {
            const content = await response.text();
            console.log('📄 UserIdentity.js - Primeras líneas:', content.substring(0, 100) + '...');
            
            // Verificar si es HTML (error 404 disfrazado)
            if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
                console.error('❌ PROBLEMA: Recibiendo HTML en lugar de JS');
                return false;
            } else {
                console.log('✅ Archivo JS válido recibido');
                return true;
            }
        } else {
            console.error('❌ Error al cargar UserIdentity.js:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de red cargando UserIdentity.js:', error);
        return false;
    }
}

// Test 3: Intentar carga manual del bootstrap
async function testManualBootstrap() {
    console.log('\n📋 TEST 3: Carga manual paso a paso');
    
    if (typeof MAIRABootstrap === 'undefined') {
        console.error('❌ No se puede hacer test manual - bootstrap no disponible');
        return false;
    }
    
    try {
        console.log('🚀 Intentando cargar módulo home...');
        const startTime = Date.now();
        
        await MAIRABootstrap.loadForModule('home');
        
        const endTime = Date.now();
        console.log(`✅ Módulo home cargado en ${endTime - startTime}ms`);
        
        // Verificar estado
        const status = MAIRABootstrap.getStatus();
        console.log('📊 Estado final:', status);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en carga manual:', error);
        console.error('📊 Stack trace:', error.stack);
        
        // Obtener estado de errores
        if (MAIRABootstrap.getStatus) {
            const status = MAIRABootstrap.getStatus();
            console.error('📊 Estado con errores:', status);
        }
        
        return false;
    }
}

// Test 4: Verificar dependency manager
function testDependencyManager() {
    console.log('\n📋 TEST 4: Dependency Manager');
    console.log('typeof dependencyManager:', typeof dependencyManager);
    console.log('typeof DependencyManager:', typeof DependencyManager);
    
    if (typeof dependencyManager !== 'undefined') {
        console.log('✅ dependencyManager disponible');
        console.log('🔍 Métodos:', Object.getOwnPropertyNames(dependencyManager));
        return true;
    } else {
        console.error('❌ dependencyManager NO disponible');
        return false;
    }
}

// Test 5: Verificar rutas de servidor
async function testServerRoutes() {
    console.log('\n📋 TEST 5: Rutas del servidor');
    
    const testPaths = [
        './core/UserIdentity.js',
        './utils/sessionManager.js',
        './handlers/dependency-manager.js',
        './common/MAIRAChat.js'
    ];
    
    for (const path of testPaths) {
        try {
            const response = await fetch(path);
            const status = response.status;
            const contentType = response.headers.get('content-type');
            
            console.log(`📄 ${path} - Status: ${status}, Type: ${contentType}`);
            
            if (status === 200 && contentType && contentType.includes('javascript')) {
                console.log(`✅ ${path} - OK`);
            } else {
                console.error(`❌ ${path} - PROBLEMA`);
                if (status === 200) {
                    const snippet = await response.text();
                    console.error(`📄 Contenido problemático: ${snippet.substring(0, 50)}...`);
                }
            }
        } catch (error) {
            console.error(`❌ ${path} - Error de red:`, error.message);
        }
    }
}

// Ejecutar todos los tests
async function runAllTests() {
    console.log('🔍 EJECUTANDO BATERÍA COMPLETA DE TESTS...');
    
    const results = {
        bootstrap: testBootstrapAvailability(),
        firstFile: await testFirstFile(),
        dependencyManager: testDependencyManager(),
        serverRoutes: await testServerRoutes(),
        manualBootstrap: false
    };
    
    if (results.bootstrap) {
        results.manualBootstrap = await testManualBootstrap();
    }
    
    console.log('\n🎯 RESUMEN DE RESULTADOS:');
    console.log('📊 Tests:', results);
    
    // Diagnóstico final
    if (Object.values(results).every(result => result === true)) {
        console.log('🎉 TODOS LOS TESTS PASARON - El sistema debería funcionar');
    } else {
        console.error('💥 ALGUNOS TESTS FALLARON - Problemas identificados');
        
        // Sugerencias específicas
        if (!results.bootstrap) {
            console.error('🔧 SOLUCIÓN: Verificar carga de bootstrap.js');
        }
        if (!results.firstFile) {
            console.error('🔧 SOLUCIÓN: Verificar rutas de archivos JS en servidor');
        }
        if (!results.dependencyManager) {
            console.error('🔧 SOLUCIÓN: Verificar carga de dependency-manager.js');
        }
        if (!results.manualBootstrap) {
            console.error('🔧 SOLUCIÓN: Revisar orden de carga de módulos');
        }
    }
    
    return results;
}

// Auto-ejecutar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Exportar para uso manual
window.MAIRADiagnostic = {
    runAllTests,
    testBootstrapAvailability,
    testFirstFile,
    testManualBootstrap,
    testDependencyManager,
    testServerRoutes
};

console.log('🔍 Herramienta de diagnóstico cargada. Usa window.MAIRADiagnostic para tests manuales.');
