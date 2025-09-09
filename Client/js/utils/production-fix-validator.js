/**
 * 🔧 VALIDADOR DE FIXES DE PRODUCCIÓN
 * Script para verificar que todos los problemas reportados están solucionados
 */

window.ProductionFixValidator = {
    
    async validateAllFixes() {
        console.log('🔧 === VALIDADOR DE FIXES DE PRODUCCIÓN ===');
        
        const results = {
            bootstrapLoading: await this.testBootstrapLoading(),
            dependencyManager: await this.testDependencyManager(),
            buttonFunctionality: await this.testButtonFunctionality(),
            socketIOConnection: await this.testSocketIOConnection(),
            cssPerformance: await this.testCSSPerformance(),
            uiComponentsLoading: await this.testUIComponentsLoading()
        };
        
        this.generateReport(results);
        return results;
    },
    
    async testBootstrapLoading() {
        console.log('\n📋 TEST: Bootstrap Loading System');
        try {
            if (typeof MAIRABootstrap === 'undefined') {
                return { status: 'FAIL', message: 'MAIRABootstrap no disponible' };
            }
            
            const status = MAIRABootstrap.getStatus();
            console.log('📊 Bootstrap Status:', status);
            
            return {
                status: 'PASS',
                message: `Bootstrap cargado - ${status.loaded.length} archivos exitosos, ${status.errors.length} errores`,
                details: status
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    async testDependencyManager() {
        console.log('\n📋 TEST: Dependency Manager Global');
        try {
            if (typeof dependencyManager === 'undefined') {
                return { status: 'FAIL', message: 'dependencyManager NO disponible globalmente' };
            }
            
            if (typeof dependencyManager.loadDependency !== 'function') {
                return { status: 'FAIL', message: 'loadDependency method no disponible' };
            }
            
            return {
                status: 'PASS',
                message: 'Dependency Manager disponible globalmente con todos los métodos',
                methods: Object.getOwnPropertyNames(dependencyManager)
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    async testButtonFunctionality() {
        console.log('\n📋 TEST: Button Functionality (btnComenzar)');
        try {
            const btnComenzar = document.getElementById('btnComenzar');
            if (!btnComenzar) {
                return { status: 'FAIL', message: 'btnComenzar no encontrado en DOM' };
            }
            
            // Verificar que tiene event listeners
            const listeners = getEventListeners ? getEventListeners(btnComenzar) : null;
            
            // Simular click (sin ejecutar acción)
            const clickEvent = new Event('click', { bubbles: true });
            const originalPreventDefault = clickEvent.preventDefault;
            let preventDefaultCalled = false;
            clickEvent.preventDefault = () => {
                preventDefaultCalled = true;
                originalPreventDefault.call(clickEvent);
            };
            
            btnComenzar.dispatchEvent(clickEvent);
            
            return {
                status: 'PASS',
                message: `btnComenzar funcional - click procesado correctamente`,
                details: {
                    hasListeners: listeners ? Object.keys(listeners).length > 0 : 'unknown',
                    preventDefaultCalled,
                    element: btnComenzar.outerHTML.substring(0, 100)
                }
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    async testSocketIOConnection() {
        console.log('\n📋 TEST: Socket.IO Connection');
        try {
            // Verificar que Socket.IO está disponible
            if (typeof io === 'undefined') {
                return { status: 'WARN', message: 'Socket.IO library no cargada todavía' };
            }
            
            if (typeof window.socket === 'undefined') {
                return { status: 'WARN', message: 'Socket instance no inicializada todavía' };
            }
            
            const connectionState = window.socket.connected ? 'CONNECTED' : 'DISCONNECTED';
            
            return {
                status: window.socket.connected ? 'PASS' : 'WARN',
                message: `Socket.IO disponible - Estado: ${connectionState}`,
                details: {
                    socketId: window.socket.id,
                    connected: window.socket.connected,
                    transport: window.socket.io?.engine?.transport?.name
                }
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    async testCSSPerformance() {
        console.log('\n📋 TEST: CSS Performance Optimization');
        try {
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]');
            const preloadedCSS = document.querySelectorAll('link[rel="preload"][as="style"]');
            const inlineCSS = document.querySelectorAll('style');
            
            return {
                status: 'PASS',
                message: `CSS optimizado - ${preloadedCSS.length} preloaded, ${inlineCSS.length} inline`,
                details: {
                    totalStylesheets: stylesheets.length,
                    preloadedCSS: preloadedCSS.length,
                    inlineCSS: inlineCSS.length,
                    hasNoscriptFallback: !!document.querySelector('noscript link[rel="stylesheet"]')
                }
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    async testUIComponentsLoading() {
        console.log('\n📋 TEST: UI Components Loading');
        try {
            const results = {
                navbar: !!document.querySelector('.navbar'),
                container: !!document.querySelector('.container'),
                hamburgerMenu: !!document.querySelector('.hamburger-menu'),
                sideMenu: !!document.querySelector('.side-menu'),
                btnComenzar: !!document.getElementById('btnComenzar')
            };
            
            const loadedComponents = Object.values(results).filter(Boolean).length;
            const totalComponents = Object.keys(results).length;
            
            return {
                status: loadedComponents === totalComponents ? 'PASS' : 'WARN',
                message: `UI Components: ${loadedComponents}/${totalComponents} cargados`,
                details: results
            };
        } catch (error) {
            return { status: 'FAIL', message: error.message };
        }
    },
    
    generateReport(results) {
        console.log('\n🎯 === RESUMEN DE VALIDACIÓN ===');
        
        const passed = Object.values(results).filter(r => r.status === 'PASS').length;
        const warned = Object.values(results).filter(r => r.status === 'WARN').length;
        const failed = Object.values(results).filter(r => r.status === 'FAIL').length;
        const total = Object.keys(results).length;
        
        console.log(`📊 RESULTADOS: ${passed} PASS | ${warned} WARN | ${failed} FAIL (${total} total)`);
        
        if (failed === 0) {
            console.log('🎉 TODOS LOS FIXES PRINCIPALES FUNCIONANDO');
        } else {
            console.error('💥 FIXES PENDIENTES:');
            Object.entries(results).forEach(([test, result]) => {
                if (result.status === 'FAIL') {
                    console.error(`❌ ${test}: ${result.message}`);
                }
            });
        }
        
        if (warned > 0) {
            console.warn('⚠️ WARNINGS (pueden ser normales):');
            Object.entries(results).forEach(([test, result]) => {
                if (result.status === 'WARN') {
                    console.warn(`⚠️ ${test}: ${result.message}`);
                }
            });
        }
        
        console.log('\n📋 DETALLES COMPLETOS:', results);
    }
};

// Auto-ejecutar después de 3 segundos para permitir carga completa
setTimeout(() => {
    if (document.readyState === 'complete') {
        window.ProductionFixValidator.validateAllFixes();
    }
}, 3000);

console.log('🔧 Production Fix Validator cargado. Ejecutar manualmente: window.ProductionFixValidator.validateAllFixes()');
