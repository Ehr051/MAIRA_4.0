/**
 * 🧪 MÓDULO DE TEST PLANEAMIENTO
 * Funciones de prueba para validar funcionalidades del módulo de planeamiento
 */

(function() {
    'use strict';

    /**
     * Ejecuta test completo o rápido de funcionalidades de planeamiento
     * @param {boolean} rapid - Si es true, ejecuta test rápido
     */
    window.ejecutarTestPlaneamiento = function(rapid = false) {
        console.log(rapid ? '⚡ Iniciando Test Rápido Planeamiento' : '🧪 Iniciando Test Completo Planeamiento');
        
        const testResults = {
            timestamp: new Date().toISOString(),
            testType: rapid ? 'rapid' : 'complete',
            results: []
        };

        // 1. TEST BOOTSTRAP LOADING
        testResults.results.push(testBootstrapLoading());
        
        // 2. TEST TOGGLE MENU
        testResults.results.push(testToggleMenu());
        
        // 3. TEST MAPA INITIALIZATION
        testResults.results.push(testMapaInit());
        
        if (!rapid) {
            // 4. TEST SÍMBOLOS (solo en test completo)
            testResults.results.push(testSimbolos());
            
            // 5. TEST NETWORK CONNECTIVITY
            testResults.results.push(testNetworkConnectivity());
        }

        // Mostrar resultados
        displayTestResults(testResults);
        return testResults;
    };

    /**
     * Test de carga del bootstrap
     */
    function testBootstrapLoading() {
        try {
            const hasBootstrap = window.MAIRABootstrap !== undefined;
            const hasLoadFunction = typeof window.loadMAIRAModule === 'function';
            
            return {
                test: 'Bootstrap Loading',
                status: hasBootstrap && hasLoadFunction ? 'PASS' : 'FAIL',
                details: {
                    MAIRABootstrap: hasBootstrap,
                    loadMAIRAModule: hasLoadFunction
                }
            };
        } catch (error) {
            return {
                test: 'Bootstrap Loading',
                status: 'ERROR',
                error: error.message
            };
        }
    }

    /**
     * Test de función toggleMenu
     */
    function testToggleMenu() {
        try {
            const hasToggleMenu = typeof window.toggleMenu === 'function';
            
            if (hasToggleMenu) {
                // Test rápido con elemento que debería existir
                const testElement = document.querySelector('[id*="menu"], [id*="collapse"], [id*="btn"]');
                if (testElement) {
                    // Crear elemento de prueba temporal
                    const testDiv = document.createElement('div');
                    testDiv.id = 'test-menu-toggle';
                    testDiv.style.display = 'none';
                    document.body.appendChild(testDiv);
                    
                    // Ejecutar toggleMenu
                    window.toggleMenu('test-menu-toggle');
                    
                    // Limpiar
                    document.body.removeChild(testDiv);
                }
            }
            
            return {
                test: 'Toggle Menu Function',
                status: hasToggleMenu ? 'PASS' : 'FAIL',
                details: {
                    functionExists: hasToggleMenu
                }
            };
        } catch (error) {
            return {
                test: 'Toggle Menu Function',
                status: 'ERROR',
                error: error.message
            };
        }
    }

    /**
     * Test de inicialización del mapa
     */
    function testMapaInit() {
        try {
            const mapContainer = document.getElementById('map') || 
                                document.getElementById('mapa') || 
                                document.querySelector('.map-container');
            
            const hasMapContainer = mapContainer !== null;
            const hasLeaflet = window.L !== undefined;
            
            return {
                test: 'Mapa Initialization',
                status: hasMapContainer ? 'PASS' : 'WARN',
                details: {
                    mapContainer: hasMapContainer,
                    leafletLoaded: hasLeaflet
                }
            };
        } catch (error) {
            return {
                test: 'Mapa Initialization',
                status: 'ERROR',
                error: error.message
            };
        }
    }

    /**
     * Test de símbolos militares
     */
    function testSimbolos() {
        try {
            const simboloButtons = document.querySelectorAll('[onclick*="agregarSimbolo"], .simbolo-btn');
            const hasSimbolos = simboloButtons.length > 0;
            
            return {
                test: 'Símbolos Militares',
                status: hasSimbolos ? 'PASS' : 'WARN',
                details: {
                    symbolButtons: simboloButtons.length
                }
            };
        } catch (error) {
            return {
                test: 'Símbolos Militares',
                status: 'ERROR',
                error: error.message
            };
        }
    }

    /**
     * Test de conectividad de red
     */
    function testNetworkConnectivity() {
        return new Promise((resolve) => {
            try {
                fetch('/health')
                    .then(response => response.json())
                    .then(data => {
                        resolve({
                            test: 'Network Connectivity',
                            status: data.status === 'healthy' ? 'PASS' : 'FAIL',
                            details: data
                        });
                    })
                    .catch(error => {
                        resolve({
                            test: 'Network Connectivity',
                            status: 'FAIL',
                            error: error.message
                        });
                    });
            } catch (error) {
                resolve({
                    test: 'Network Connectivity',
                    status: 'ERROR',
                    error: error.message
                });
            }
        });
    }

    /**
     * Mostrar resultados de tests
     */
    function displayTestResults(testResults) {
        console.group(`🧪 Resultados Test Planeamiento - ${testResults.testType.toUpperCase()}`);
        
        let passCount = 0;
        let failCount = 0;
        let errorCount = 0;
        let warnCount = 0;

        testResults.results.forEach(result => {
            const emoji = result.status === 'PASS' ? '✅' : 
                         result.status === 'FAIL' ? '❌' : 
                         result.status === 'WARN' ? '⚠️' : '🔥';
            
            console.log(`${emoji} ${result.test}: ${result.status}`);
            
            if (result.details) {
                console.log('  Detalles:', result.details);
            }
            
            if (result.error) {
                console.error('  Error:', result.error);
            }

            switch (result.status) {
                case 'PASS': passCount++; break;
                case 'FAIL': failCount++; break;
                case 'ERROR': errorCount++; break;
                case 'WARN': warnCount++; break;
            }
        });

        console.log(`\n📊 Resumen: ${passCount} ✅ | ${failCount} ❌ | ${warnCount} ⚠️ | ${errorCount} 🔥`);
        console.groupEnd();

        // Mostrar alerta visual
        const message = `Test ${testResults.testType.toUpperCase()} completado:\n` +
                       `✅ Exitosos: ${passCount}\n` +
                       `❌ Fallados: ${failCount}\n` +
                       `⚠️ Advertencias: ${warnCount}\n` +
                       `🔥 Errores: ${errorCount}`;
        
        alert(message);
    }

    console.log('🧪 Módulo Test Planeamiento cargado');

})();
