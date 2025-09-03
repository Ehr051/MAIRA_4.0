/**
 * 🧪 MAIRA Test Suite - Sistema de Testing Completo
 * Versión: 1.0.0
 * 
 * Tests automatizados para verificar funcionalidad en cada modo de empleo
 */

window.MAIRATestSuite = {
    version: '1.0.0',
    enabled: false,
    results: {},
    
    // Configuración de tests
    config: {
        autoRun: false,
        showUI: true,
        logLevel: 'info', // 'error', 'warn', 'info', 'debug'
        timeoutMs: 5000
    },
    
    /**
     * Inicializar suite de tests
     */
    init: function() {
        console.log('🧪 MAIRA Test Suite v' + this.version + ' - Inicializando...');
        
        // Habilitar tests en desarrollo o con parámetro
        this.enabled = this.shouldEnable();
        
        if (this.enabled) {
            this.createTestUI();
            this.log('info', 'Tests habilitados - UI disponible');
            
            if (this.config.autoRun) {
                this.runAllTests();
            }
        }
    },
    
    /**
     * Determinar si los tests deben estar habilitados
     */
    shouldEnable: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const forceTest = urlParams.get('test') === 'true';
        const autoRun = urlParams.get('autotest') === 'true';
        
        if (autoRun) this.config.autoRun = true;
        
        return isDev || forceTest;
    },
    
    /**
     * Crear interfaz de usuario para tests
     */
    createTestUI: function() {
        if (!this.config.showUI) return;
        
        // Crear panel de tests
        const testPanel = document.createElement('div');
        testPanel.id = 'maira-test-panel';
        testPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            max-height: 400px;
            overflow-y: auto;
            border: 2px solid #00ff00;
        `;
        
        testPanel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #00ff00;">
                🧪 MAIRA Test Suite v${this.version}
            </div>
            <div style="margin-bottom: 10px;">
                <button id="run-all-tests" style="margin-right: 5px; padding: 5px 10px; background: #00aa00; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    ▶️ Ejecutar Todos
                </button>
                <button id="clear-tests" style="margin-right: 5px; padding: 5px 10px; background: #aa0000; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    🗑️ Limpiar
                </button>
                <button id="hide-tests" style="padding: 5px 10px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer;">
                    👁️ Ocultar
                </button>
            </div>
            <div id="test-results" style="border-top: 1px solid #333; padding-top: 10px;">
                <div style="color: #888;">Listo para ejecutar tests...</div>
            </div>
        `;
        
        document.body.appendChild(testPanel);
        
        // Event listeners
        document.getElementById('run-all-tests').onclick = () => this.runAllTests();
        document.getElementById('clear-tests').onclick = () => this.clearResults();
        document.getElementById('hide-tests').onclick = () => this.toggleUI();
    },
    
    /**
     * Logging con niveles
     */
    log: function(level, message) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const configLevel = levels[this.config.logLevel] || 2;
        
        if (levels[level] <= configLevel) {
            const prefix = {
                error: '❌',
                warn: '⚠️',
                info: 'ℹ️',
                debug: '🔍'
            };
            console.log(`${prefix[level]} [MAIRA Tests] ${message}`);
        }
    },
    
    /**
     * Ejecutar todos los tests
     */
    runAllTests: function() {
        this.log('info', 'Iniciando ejecución de todos los tests...');
        this.clearResults();
        
        const tests = [
            this.testBasicFunctionality,
            this.testPageSpecific,
            this.testNetworkConnectivity,
            this.testJavaScriptErrors,
            this.testUIElements
        ];
        
        let completed = 0;
        const total = tests.length;
        
        tests.forEach((test, index) => {
            setTimeout(() => {
                try {
                    test.call(this);
                    completed++;
                    if (completed === total) {
                        this.showSummary();
                    }
                } catch (error) {
                    this.addResult('error', `Test ${index + 1} falló: ${error.message}`);
                    completed++;
                    if (completed === total) {
                        this.showSummary();
                    }
                }
            }, index * 500); // Espaciar tests
        });
    },
    
    /**
     * Test de funcionalidad básica
     */
    testBasicFunctionality: function() {
        this.log('info', 'Ejecutando tests de funcionalidad básica...');
        
        // Test jQuery
        if (typeof $ !== 'undefined') {
            this.addResult('success', '✅ jQuery cargado correctamente');
        } else {
            this.addResult('error', '❌ jQuery no encontrado');
        }
        
        // Test Socket.IO
        if (typeof io !== 'undefined') {
            this.addResult('success', '✅ Socket.IO disponible');
        } else {
            this.addResult('warning', '⚠️ Socket.IO no encontrado (normal en algunas páginas)');
        }
        
        // Test Leaflet (para páginas con mapas)
        if (typeof L !== 'undefined') {
            this.addResult('success', '✅ Leaflet (mapas) cargado');
        } else {
            this.addResult('info', 'ℹ️ Leaflet no presente (normal en páginas sin mapas)');
        }
    },
    
    /**
     * Test específico según la página actual
     */
    testPageSpecific: function() {
        const page = window.location.pathname;
        this.log('info', `Ejecutando tests específicos para: ${page}`);
        
        if (page.includes('planeamiento')) {
            this.testPlaneamientoMode();
        } else if (page.includes('juegodeguerra')) {
            this.testJuegoGuerraMode();
        } else if (page.includes('gestionbatalla')) {
            this.testGestionBatallaMode();
        } else if (page.includes('CO.html')) {
            this.testCOMode();
        } else if (page.includes('iniciar')) {
            this.testIniciarPartidaMode();
        } else {
            this.testGeneralMode();
        }
    },
    
    /**
     * Tests específicos para modo Planeamiento
     */
    testPlaneamientoMode: function() {
        this.addResult('info', '🗺️ Testing Modo Planeamiento...');
        
        // Verificar mapa
        if (window.map) {
            this.addResult('success', '✅ Mapa inicializado');
        } else {
            this.addResult('error', '❌ Mapa no inicializado');
        }
        
        // Verificar herramientas de dibujo
        if (typeof window.herramientasP !== 'undefined') {
            this.addResult('success', '✅ Herramientas de planeamiento cargadas');
        }
        
        // Verificar símbolos militares
        if (typeof ms !== 'undefined') {
            this.addResult('success', '✅ Librería de símbolos militares disponible');
        }
    },
    
    /**
     * Tests específicos para Juego de Guerra
     */
    testJuegoGuerraMode: function() {
        this.addResult('info', '🎮 Testing Modo Juego de Guerra...');
        
        // Verificar gestores del juego
        const gestores = ['gestorJuego', 'gestorMapa', 'gestorUnidades', 'gestorTurnos'];
        gestores.forEach(gestor => {
            if (window[gestor]) {
                this.addResult('success', `✅ ${gestor} inicializado`);
            } else {
                this.addResult('warning', `⚠️ ${gestor} no encontrado`);
            }
        });
        
        // Verificar conexión Socket.IO
        if (window.socket && window.socket.connected) {
            this.addResult('success', '✅ Conexión Socket.IO activa');
        } else {
            this.addResult('warning', '⚠️ Socket.IO no conectado');
        }
    },
    
    /**
     * Tests para Gestión de Batalla
     */
    testGestionBatallaMode: function() {
        this.addResult('info', '⚔️ Testing Modo Gestión de Batalla...');
        
        // Verificar elementos específicos de GB
        if (window.gestionBatalla) {
            this.addResult('success', '✅ Sistema de gestión de batalla activo');
        }
    },
    
    /**
     * Tests para CO (Comando y Control)
     */
    testCOMode: function() {
        this.addResult('info', '🎖️ Testing Modo CO...');
        
        // Tests específicos para CO
        if (document.querySelector('#contenedorCO')) {
            this.addResult('success', '✅ Interfaz CO detectada');
        }
    },
    
    /**
     * Tests para Iniciar Partida
     */
    testIniciarPartidaMode: function() {
        this.addResult('info', '🚀 Testing Iniciar Partida...');
        
        // Verificar formularios y conexión
        const forms = document.querySelectorAll('form');
        if (forms.length > 0) {
            this.addResult('success', `✅ ${forms.length} formulario(s) encontrado(s)`);
        }
    },
    
    /**
     * Tests generales (index, etc.)
     */
    testGeneralMode: function() {
        this.addResult('info', '🏠 Testing Página General...');
        
        // Verificar elementos comunes
        if (document.querySelector('nav') || document.querySelector('.navbar')) {
            this.addResult('success', '✅ Navegación detectada');
        }
    },
    
    /**
     * Test de conectividad de red
     */
    testNetworkConnectivity: function() {
        this.log('info', 'Testing conectividad de red...');
        
        // Test básico de conectividad
        if (navigator.onLine) {
            this.addResult('success', '✅ Conectividad de red activa');
            
            // Test ping al servidor
            fetch('/health', { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        this.addResult('success', '✅ Servidor responde correctamente');
                    } else {
                        this.addResult('warning', `⚠️ Servidor responde con código: ${response.status}`);
                    }
                })
                .catch(error => {
                    this.addResult('error', `❌ Error de conexión: ${error.message}`);
                });
        } else {
            this.addResult('error', '❌ Sin conectividad de red');
        }
    },
    
    /**
     * Verificar errores JavaScript
     */
    testJavaScriptErrors: function() {
        this.log('info', 'Verificando errores JavaScript...');
        
        // Capturar errores globales
        let errorCount = 0;
        const originalError = window.onerror;
        
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            errorCount++;
            this.addResult('error', `❌ JS Error: ${msg} (${url}:${lineNo})`);
            
            if (originalError) {
                originalError(msg, url, lineNo, columnNo, error);
            }
        };
        
        setTimeout(() => {
            if (errorCount === 0) {
                this.addResult('success', '✅ No se detectaron errores JavaScript');
            } else {
                this.addResult('warning', `⚠️ Se detectaron ${errorCount} errores JavaScript`);
            }
            window.onerror = originalError;
        }, 2000);
    },
    
    /**
     * Test de elementos UI críticos
     */
    testUIElements: function() {
        this.log('info', 'Verificando elementos UI críticos...');
        
        // Verificar que no hay referencias rotas de imágenes
        const images = document.querySelectorAll('img');
        let brokenImages = 0;
        
        images.forEach(img => {
            if (!img.complete || img.naturalHeight === 0) {
                brokenImages++;
            }
        });
        
        if (brokenImages === 0) {
            this.addResult('success', `✅ Todas las imágenes (${images.length}) cargan correctamente`);
        } else {
            this.addResult('warning', `⚠️ ${brokenImages} de ${images.length} imágenes no cargan`);
        }
        
        // Verificar CSS críticos
        const criticalCSS = document.querySelectorAll('link[rel="stylesheet"]');
        this.addResult('info', `ℹ️ ${criticalCSS.length} hojas de estilo cargadas`);
    },
    
    /**
     * Agregar resultado de test
     */
    addResult: function(type, message) {
        this.results[Date.now()] = { type, message, timestamp: new Date() };
        this.updateUI();
    },
    
    /**
     * Actualizar UI con resultados
     */
    updateUI: function() {
        const resultsDiv = document.getElementById('test-results');
        if (!resultsDiv) return;
        
        const results = Object.values(this.results);
        const latest = results.slice(-10); // Mostrar últimos 10
        
        resultsDiv.innerHTML = latest.map(result => {
            const colors = {
                success: '#00ff00',
                error: '#ff0000',
                warning: '#ffaa00',
                info: '#00aaff'
            };
            
            return `<div style="color: ${colors[result.type] || '#fff'}; margin: 2px 0; font-size: 11px;">
                ${result.message}
            </div>`;
        }).join('');
    },
    
    /**
     * Mostrar resumen final
     */
    showSummary: function() {
        const results = Object.values(this.results);
        const summary = {
            success: results.filter(r => r.type === 'success').length,
            error: results.filter(r => r.type === 'error').length,
            warning: results.filter(r => r.type === 'warning').length,
            info: results.filter(r => r.type === 'info').length
        };
        
        const totalTests = summary.success + summary.error + summary.warning;
        const passRate = totalTests > 0 ? Math.round((summary.success / totalTests) * 100) : 0;
        
        this.addResult('info', '═══════════════════════════');
        this.addResult('info', `📊 RESUMEN: ${passRate}% tests pasados`);
        this.addResult('info', `✅ Éxitos: ${summary.success}`);
        if (summary.warning > 0) this.addResult('info', `⚠️ Advertencias: ${summary.warning}`);
        if (summary.error > 0) this.addResult('info', `❌ Errores: ${summary.error}`);
        this.addResult('info', '═══════════════════════════');
        
        this.log('info', `Tests completados - ${passRate}% success rate`);
    },
    
    /**
     * Limpiar resultados
     */
    clearResults: function() {
        this.results = {};
        this.updateUI();
    },
    
    /**
     * Toggle UI visibility
     */
    toggleUI: function() {
        const panel = document.getElementById('maira-test-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MAIRATestSuite.init());
} else {
    window.MAIRATestSuite.init();
}
