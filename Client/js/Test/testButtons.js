/**
 * 🧪 Sistema Unificado de Botones de Test MAIRA
 * 
 * Sistema temporal para verificar funcionalidad en cada modo de empleo
 * Se removerá en la versión de producción final
 */

window.MAIRATestButtons = {
    testModes: {
        'planeamiento': {
            name: 'Test-P',
            icon: '🗺️',
            title: 'Test Planeamiento'
        },
        'juegodeguerra': {
            name: 'Test-JG', 
            icon: '🎮',
            title: 'Test Juego de Guerra'
        },
        'gestionbatalla': {
            name: 'Test-GB',
            icon: '⚔️', 
            title: 'Test Gestión de Batalla'
        },
        'CO': {
            name: 'Test-CO',
            icon: '🎖️',
            title: 'Test Cuadro de Organización'
        },
        'iniciarpartida': {
            name: 'Test-IP',
            icon: '🚀',
            title: 'Test Iniciar Partida'
        },
        'inicioGB': {
            name: 'Test-SOP',
            icon: '🏢',
            title: 'Test Sala de Operaciones'
        },
        'index': {
            name: 'Test-HOME',
            icon: '🏠',
            title: 'Test Página Principal'
        }
    },

    currentMode: null,
    testButton: null,
    resultsPanel: null,
    
    /**
     * Inicializar sistema de botones de test
     */
    init: function() {
        // Detectar modo actual basado en la URL
        this.currentMode = this.detectCurrentMode();
        
        // Solo crear botón si estamos en modo desarrollo o con parámetro test
        if (this.shouldShowTestButton()) {
            this.createTestButton();
            // Mostrar botón después de que cargue la página
            this.scheduleButtonShow();
        }
    },

    /**
     * Detectar modo actual basado en la URL
     */
    detectCurrentMode: function() {
        const path = window.location.pathname.toLowerCase();
        
        if (path.includes('planeamiento')) return 'planeamiento';
        if (path.includes('juegodeguerra')) return 'juegodeguerra';
        if (path.includes('gestionbatalla')) return 'gestionbatalla';
        if (path.includes('co.html')) return 'CO';
        if (path.includes('iniciarpartida')) return 'iniciarpartida';
        if (path.includes('inicioGB')) return 'inicioGB';
        if (path.includes('index') || path === '/' || path === '') return 'index';
        
        return 'general';
    },

    /**
     * Determinar si mostrar el botón de test
     */
    shouldShowTestButton: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const forceTest = urlParams.get('test') === 'true';
        const showButton = urlParams.get('testbutton') !== 'false'; // permitir desactivar
        
        return (isDev || forceTest) && showButton;
    },

    /**
     * Crear botón de test para el modo actual
     */
    createTestButton: function() {
        const modeConfig = this.testModes[this.currentMode] || this.testModes['index'];
        
        // Crear botón
        this.testButton = document.createElement('button');
        this.testButton.className = 'maira-test-button';
        this.testButton.id = 'maira-test-btn';
        this.testButton.innerHTML = modeConfig.icon;
        this.testButton.title = modeConfig.title;
        this.testButton.setAttribute('data-test-name', modeConfig.name);
        
        // Event listener
        this.testButton.onclick = () => this.executeTest();
        
        // Crear panel de resultados
        this.resultsPanel = document.createElement('div');
        this.resultsPanel.className = 'maira-test-results-mini';
        this.resultsPanel.id = 'maira-test-results';
        
        // Agregar al DOM
        document.body.appendChild(this.testButton);
        document.body.appendChild(this.resultsPanel);
        
        console.log(`🧪 Botón de test creado para modo: ${this.currentMode}`);
    },

    /**
     * Programar aparición del botón después de la carga
     */
    scheduleButtonShow: function() {
        // Esperar a que la página termine de cargar
        const showButton = () => {
            if (this.testButton) {
                // Pequeño delay adicional para asegurar que todo esté cargado
                setTimeout(() => {
                    this.testButton.classList.add('show');
                    console.log(`🧪 Botón de test visible para ${this.currentMode}`);
                }, 1000);
            }
        };

        if (document.readyState === 'complete') {
            showButton();
        } else {
            window.addEventListener('load', showButton);
        }

        // También mostrar cuando detectemos que las librerías específicas están cargadas
        this.waitForPageReady(() => {
            showButton();
        });
    },

    /**
     * Esperar a que la página esté completamente lista
     */
    waitForPageReady: function(callback) {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkReady = () => {
            attempts++;
            let isReady = false;
            
            // Verificaciones específicas por modo
            switch(this.currentMode) {
                case 'planeamiento':
                case 'gestionbatalla':
                    isReady = typeof L !== 'undefined'; // Leaflet cargado
                    break;
                case 'juegodeguerra':
                    isReady = typeof L !== 'undefined' && (window.gestorJuego || window.socket);
                    break;
                case 'CO':
                    isReady = document.querySelector('#contenedorCO') !== null;
                    break;
                default:
                    isReady = document.readyState === 'complete';
            }
            
            if (isReady || attempts >= maxAttempts) {
                callback();
            } else {
                setTimeout(checkReady, 500);
            }
        };
        
        checkReady();
    },

    /**
     * Ejecutar test para el modo actual
     */
    executeTest: function() {
        console.log(`🧪 Ejecutando test para modo: ${this.currentMode}`);
        
        // Limpiar resultados anteriores
        this.clearResults();
        
        // Mostrar panel de resultados
        this.showResults();
        
        // Usar la suite MAIRA si está disponible
        if (window.MAIRATestSuite) {
            // Configurar la suite para mostrar resultados en nuestro panel
            this.setupTestSuiteIntegration();
            window.MAIRATestSuite.runAllTests();
        } else {
            // Fallback: ejecutar tests básicos
            this.runBasicTests();
        }
        
        // Vibración en móviles para feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    /**
     * Integrar con MAIRATestSuite para mostrar resultados en nuestro panel
     */
    setupTestSuiteIntegration: function() {
        // Interceptar la función addResult de la suite
        const originalAddResult = window.MAIRATestSuite.addResult;
        
        window.MAIRATestSuite.addResult = (type, message) => {
            // Llamar función original
            originalAddResult.call(window.MAIRATestSuite, type, message);
            
            // Mostrar también en nuestro mini panel
            this.addResult(type, message);
        };
    },

    /**
     * Tests básicos si no está disponible la suite completa
     */
    runBasicTests: function() {
        this.addResult('info', `🧪 Iniciando tests básicos para ${this.currentMode}...`);
        
        // Test jQuery
        if (typeof $ !== 'undefined') {
            this.addResult('success', '✅ jQuery OK');
        } else {
            this.addResult('error', '❌ jQuery faltante');
        }
        
        // Test específico del modo
        switch(this.currentMode) {
            case 'planeamiento':
            case 'gestionbatalla':
                if (typeof L !== 'undefined') {
                    this.addResult('success', '✅ Leaflet OK');
                } else {
                    this.addResult('error', '❌ Leaflet faltante');
                }
                break;
                
            case 'juegodeguerra':
                if (window.socket) {
                    this.addResult('success', '✅ Socket.IO OK');
                } else {
                    this.addResult('warning', '⚠️ Socket.IO no conectado');
                }
                break;
        }
        
        // Test de conectividad
        fetch('/health', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    this.addResult('success', '✅ Servidor OK');
                } else {
                    this.addResult('warning', `⚠️ Servidor: ${response.status}`);
                }
            })
            .catch(() => {
                this.addResult('error', '❌ Error de conexión');
            });
        
        // Resumen después de 2 segundos
        setTimeout(() => {
            this.addResult('info', '📊 Tests básicos completados');
        }, 2000);
    },

    /**
     * Agregar resultado al mini panel
     */
    addResult: function(type, message) {
        if (!this.resultsPanel) return;
        
        const line = document.createElement('div');
        line.className = `test-result-line ${type}`;
        line.textContent = message;
        
        this.resultsPanel.appendChild(line);
        
        // Scroll al final
        this.resultsPanel.scrollTop = this.resultsPanel.scrollHeight;
        
        // Limitar líneas (mantener últimas 15)
        const lines = this.resultsPanel.querySelectorAll('.test-result-line');
        if (lines.length > 15) {
            lines[0].remove();
        }
    },

    /**
     * Mostrar panel de resultados
     */
    showResults: function() {
        if (this.resultsPanel) {
            this.resultsPanel.classList.add('show');
            
            // Auto-ocultar después de 30 segundos
            setTimeout(() => {
                this.hideResults();
            }, 30000);
        }
    },

    /**
     * Ocultar panel de resultados
     */
    hideResults: function() {
        if (this.resultsPanel) {
            this.resultsPanel.classList.remove('show');
        }
    },

    /**
     * Limpiar resultados
     */
    clearResults: function() {
        if (this.resultsPanel) {
            this.resultsPanel.innerHTML = '';
        }
    },

    /**
     * Remover completamente el sistema de test (para producción)
     */
    remove: function() {
        if (this.testButton) {
            this.testButton.remove();
        }
        if (this.resultsPanel) {
            this.resultsPanel.remove();
        }
        
        // Remover CSS
        const testCSS = document.querySelector('link[href*="test-buttons.css"]');
        if (testCSS) {
            testCSS.remove();
        }
        
        console.log('🧪 Sistema de test removido');
    }
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MAIRATestButtons.init();
    });
} else {
    window.MAIRATestButtons.init();
}

// Shortcut para desarrollo: Ctrl+Shift+T
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        if (window.MAIRATestButtons.testButton) {
            window.MAIRATestButtons.executeTest();
        }
    }
});
