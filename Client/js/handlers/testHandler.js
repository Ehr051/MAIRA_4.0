/**
 * 🧪 TEST HANDLER  
 * Módulo para funciones de testing de planeamiento
 * Maneja ejecutarTestPlaneamiento y otras funciones de test
 */

class TestHandler {
    constructor() {
        this.testsRunning = false;
        this.testResults = [];
        console.log('✅ TestHandler inicializado');
    }

    /**
     * Ejecutar test de planeamiento
     * FUNCIÓN REQUERIDA: ejecutarTestPlaneamiento
     */
    ejecutarTestPlaneamiento() {
        try {
            console.log('🧪 Ejecutando test de planeamiento...');
            this.testsRunning = true;

            // Test 1: Verificar mapa
            const test1 = this.testMapa();
            
            // Test 2: Verificar herramientas
            const test2 = this.testHerramientas();
            
            // Test 3: Verificar símbolos
            const test3 = this.testSimbolos();
            
            // Test 4: Verificar elevación
            const test4 = this.testElevacion();

            const results = {
                mapa: test1,
                herramientas: test2,
                simbolos: test3,
                elevacion: test4,
                timestamp: new Date().toISOString()
            };

            this.testResults.push(results);
            this.testsRunning = false;

            console.log('🧪 Test completado:', results);
            
            // Mostrar resultados en consola
            this.mostrarResultados(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Error ejecutando test de planeamiento:', error);
            this.testsRunning = false;
            return { error: error.message };
        }
    }

    /**
     * Test del mapa
     */
    testMapa() {
        const tests = [];
        
        // Test: ¿Existe window.map?
        tests.push({
            name: 'Mapa disponible',
            result: !!window.map,
            details: window.map ? `Tipo: ${typeof window.map}` : 'No disponible'
        });

        // Test: ¿Está inicializado?
        if (window.map) {
            tests.push({
                name: 'Mapa inicializado',
                result: window.map._loaded || false,
                details: window.map._loaded ? 'Cargado' : 'No cargado'
            });

            // Test: ¿Tiene capas?
            const layerCount = Object.keys(window.map._layers || {}).length;
            tests.push({
                name: 'Capas del mapa',
                result: layerCount > 0,
                details: `${layerCount} capas`
            });
        }

        return tests;
    }

    /**
     * Test de herramientas
     */
    testHerramientas() {
        const tests = [];
        
        // Test: Funciones globales
        const globalFunctions = [
            'toggleMenu',
            'actualizarSidc', 
            'agregarMarcador',
            'initializeBuscarLugar'
        ];

        globalFunctions.forEach(func => {
            tests.push({
                name: `Función ${func}`,
                result: typeof window[func] === 'function',
                details: typeof window[func]
            });
        });

        // Test: MAIRA namespace
        tests.push({
            name: 'MAIRA namespace',
            result: !!window.MAIRA,
            details: window.MAIRA ? 'Disponible' : 'No disponible'
        });

        return tests;
    }

    /**
     * Test de símbolos
     */
    testSimbolos() {
        const tests = [];
        
        // Test: milsymbol library
        tests.push({
            name: 'Librería milsymbol',
            result: typeof ms !== 'undefined',
            details: typeof ms !== 'undefined' ? 'Disponible' : 'No disponible'
        });

        // Test: Funciones de símbolos
        const symbolFunctions = ['actualizarSidc', 'agregarMarcador'];
        symbolFunctions.forEach(func => {
            tests.push({
                name: `Función ${func}`,
                result: typeof window[func] === 'function',
                details: typeof window[func]
            });
        });

        return tests;
    }

    /**
     * Test de elevación
     */
    testElevacion() {
        const tests = [];
        
        // Test: MAIRA.Elevacion
        tests.push({
            name: 'MAIRA.Elevacion',
            result: !!(window.MAIRA && window.MAIRA.Elevacion),
            details: window.MAIRA?.Elevacion ? 'Disponible' : 'No disponible'
        });

        // Test: terrainAdapter
        tests.push({
            name: 'terrainAdapter',
            result: !!window.terrainAdapter,
            details: window.terrainAdapter ? 'Disponible' : 'No disponible'
        });

        return tests;
    }

    /**
     * Mostrar resultados en UI
     */
    mostrarResultados(results) {
        const passed = this.countPassed(results);
        const total = this.countTotal(results);
        
        console.log('🧪 === RESULTADOS TEST PLANEAMIENTO ===');
        console.log(`✅ Pasados: ${passed}/${total}`);
        
        Object.keys(results).forEach(category => {
            if (Array.isArray(results[category])) {
                console.log(`\n📂 ${category.toUpperCase()}:`);
                results[category].forEach(test => {
                    const icon = test.result ? '✅' : '❌';
                    console.log(`  ${icon} ${test.name}: ${test.details}`);
                });
            }
        });
        
        // Mostrar en DOM si existe el elemento
        const testOutput = document.getElementById('test-output');
        if (testOutput) {
            testOutput.innerHTML = this.generateHTMLReport(results);
        }
    }

    /**
     * Generar reporte HTML
     */
    generateHTMLReport(results) {
        const passed = this.countPassed(results);
        const total = this.countTotal(results);
        
        let html = `<h3>🧪 Test Planeamiento - ${passed}/${total} Pasados</h3>`;
        
        Object.keys(results).forEach(category => {
            if (Array.isArray(results[category])) {
                html += `<h4>📂 ${category.toUpperCase()}</h4><ul>`;
                results[category].forEach(test => {
                    const icon = test.result ? '✅' : '❌';
                    html += `<li>${icon} <strong>${test.name}</strong>: ${test.details}</li>`;
                });
                html += '</ul>';
            }
        });
        
        return html;
    }

    /**
     * Contar tests pasados
     */
    countPassed(results) {
        let count = 0;
        Object.keys(results).forEach(category => {
            if (Array.isArray(results[category])) {
                count += results[category].filter(test => test.result).length;
            }
        });
        return count;
    }

    /**
     * Contar total de tests
     */
    countTotal(results) {
        let count = 0;
        Object.keys(results).forEach(category => {
            if (Array.isArray(results[category])) {
                count += results[category].length;
            }
        });
        return count;
    }

    /**
     * Obtener últimos resultados
     */
    getLastResults() {
        return this.testResults[this.testResults.length - 1] || null;
    }

    /**
     * Limpiar resultados
     */
    clearResults() {
        this.testResults = [];
        console.log('✅ Resultados de test limpiados');
    }
}

// ✅ CREAR INSTANCIA GLOBAL
const testHandler = new TestHandler();

// ✅ EXPORTAR FUNCIONES GLOBALES PARA COMPATIBILIDAD
window.ejecutarTestPlaneamiento = function() {
    return testHandler.ejecutarTestPlaneamiento();
};

// Alias adicionales
window.runPlaneamientoTest = window.ejecutarTestPlaneamiento;
window.testPlaneamiento = window.ejecutarTestPlaneamiento;

// ✅ EXPORTAR PARA MAIRA NAMESPACE
if (!window.MAIRA) window.MAIRA = {};
if (!window.MAIRA.Handlers) window.MAIRA.Handlers = {};
window.MAIRA.Handlers.Test = testHandler;

console.log('✅ TestHandler cargado - ejecutarTestPlaneamiento disponible globalmente');

// ✅ AUTO-REGISTRO DE EVENT LISTENERS
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Buscar botones de test en el DOM
        const testButtons = document.querySelectorAll('[onclick*="ejecutarTestPlaneamiento"]');
        testButtons.forEach(button => {
            console.log('🔗 Botón de test encontrado:', button);
        });
    });
} else {
    // DOM ya cargado
    const testButtons = document.querySelectorAll('[onclick*="ejecutarTestPlaneamiento"]');
    testButtons.forEach(button => {
        console.log('🔗 Botón de test encontrado:', button);
    });
}
