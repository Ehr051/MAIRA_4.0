/**
 * @fileoverview Script de Testing Exhaustivo MAIRA 4.0
 * @description Simula interacción completa del usuario botón por botón
 * @version 1.0.0
 */

// Configuración del testing
const TEST_CONFIG = {
    timeout: 5000, // Timeout por acción
    delay: 1000,   // Delay entre acciones
    verbose: true, // Logging detallado
    screenshots: false // Capturas de pantalla
};

// Resultados del testing
let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

// Funciones de utilidad para testing
class MAIRATester {
    constructor() {
        this.currentPage = null;
        this.userActions = [];
        this.errors = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;

        if (TEST_CONFIG.verbose) {
            console.log(logMessage);
        }

        this.userActions.push({
            timestamp,
            type,
            message
        });
    }

    async waitForElement(selector, timeout = TEST_CONFIG.timeout) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkElement = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Elemento ${selector} no encontrado en ${timeout}ms`));
                    return;
                }

                setTimeout(checkElement, 100);
            };

            checkElement();
        });
    }

    async clickElement(selector, description = '') {
        try {
            const element = await this.waitForElement(selector);
            this.log(`Click en ${selector}: ${description}`);

            // Verificar que el elemento es clickeable
            if (element.disabled) {
                throw new Error(`Elemento ${selector} está deshabilitado`);
            }

            // Simular click
            element.click();

            // Esperar un poco para que se procese la acción
            await this.delay(TEST_CONFIG.delay);

            testResults.passed++;
            return true;
        } catch (error) {
            this.log(`ERROR: No se pudo hacer click en ${selector}: ${error.message}`, 'error');
            testResults.failed++;
            testResults.errors.push({
                action: `click ${selector}`,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async fillInput(selector, value, description = '') {
        try {
            const element = await this.waitForElement(selector);
            this.log(`Llenando input ${selector} con "${value}": ${description}`);

            // Verificar que es un input
            if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA' && element.tagName !== 'SELECT') {
                throw new Error(`Elemento ${selector} no es un campo de entrada`);
            }

            // Llenar el campo
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));

            await this.delay(500);
            testResults.passed++;
            return true;
        } catch (error) {
            this.log(`ERROR: No se pudo llenar input ${selector}: ${error.message}`, 'error');
            testResults.failed++;
            testResults.errors.push({
                action: `fill ${selector}`,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    async checkFunctionExists(functionName, context = window) {
        try {
            if (typeof context[functionName] === 'function') {
                this.log(`✅ Función ${functionName} existe`);
                testResults.passed++;
                return true;
            } else {
                this.log(`❌ Función ${functionName} no existe`, 'error');
                testResults.failed++;
                testResults.errors.push({
                    action: `check function ${functionName}`,
                    error: 'Función no existe',
                    timestamp: new Date().toISOString()
                });
                return false;
            }
        } catch (error) {
            this.log(`ERROR: Error verificando función ${functionName}: ${error.message}`, 'error');
            testResults.failed++;
            return false;
        }
    }

    async checkElementExists(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                this.log(`✅ Elemento ${selector} existe`);
                testResults.passed++;
                return true;
            } else {
                this.log(`❌ Elemento ${selector} no existe`, 'error');
                testResults.failed++;
                testResults.errors.push({
                    action: `check element ${selector}`,
                    error: 'Elemento no existe',
                    timestamp: new Date().toISOString()
                });
                return false;
            }
        } catch (error) {
            this.log(`ERROR: Error verificando elemento ${selector}: ${error.message}`, 'error');
            testResults.failed++;
            return false;
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Tests específicos por modo
    async testLandingPage() {
        this.log('🧪 Iniciando test del Modo Landing/Home', 'test');

        // Verificar elementos principales
        await this.checkElementExists('#btnComenzar');
        await this.checkElementExists('#seleccionModo');
        await this.checkElementExists('.navbar');

        // Verificar funciones críticas
        await this.checkFunctionExists('toggleMenu');
        await this.checkFunctionExists('initializeMAIRA');

        // Simular navegación por la landing page
        await this.clickElement('#btnComenzar', 'Botón comenzar');

        // Verificar que se muestra el selector de modo
        await this.checkElementExists('#seleccionModo.show');

        this.log('✅ Test Modo Landing completado', 'test');
    }

    async testModoSelector() {
        this.log('🧪 Iniciando test del Selector de Modos', 'test');

        // Verificar opciones de modo
        await this.checkElementExists('[data-modo="planeamiento"]');
        await this.checkElementExists('[data-modo="juegodeguerra"]');
        await this.checkElementExists('[data-modo="gestionbatalla"]');

        // Simular selección de modo planeamiento
        const success = await this.clickElement('[data-modo="planeamiento"]', 'Seleccionar modo planeamiento');
        if (success) {
            // Verificar redirección
            await this.delay(2000);
            if (window.location.pathname.includes('planeamiento')) {
                this.log('✅ Redirección a planeamiento exitosa');
                testResults.passed++;
            } else {
                this.log('❌ Redirección a planeamiento fallida', 'error');
                testResults.failed++;
            }
        }

        this.log('✅ Test Selector de Modos completado', 'test');
    }

    async testModoPlaneamiento() {
        this.log('🧪 Iniciando test del Modo Planeamiento', 'test');

        // Verificar elementos principales del planeamiento
        await this.checkElementExists('#map');
        await this.checkElementExists('#panelMarchaContainer');
        await this.checkElementExists('#perfilElevacionDisplay');

        // Verificar funciones críticas
        await this.checkFunctionExists('inicializarSistemaPlaneamiento');
        await this.checkFunctionExists('mostrarPerfilElevacion');
        await this.checkFunctionExists('PanelMarcha');

        // Simular creación de unidad
        await this.clickElement('#btnAgregarUnidad', 'Agregar unidad');

        // Verificar que se abre el panel de creación
        await this.checkElementExists('.panel-creacion-unidad.show');

        // Simular creación de objetivo
        await this.clickElement('#btnAgregarObjetivo', 'Agregar objetivo');

        // Simular dibujo de ruta
        await this.clickElement('#btnDibujarRuta', 'Dibujar ruta de marcha');

        // Simular mostrar perfil de elevación
        await this.clickElement('#btnPerfilElevacion', 'Mostrar perfil de elevación');

        // Verificar que se abre el panel
        await this.checkElementExists('#perfilElevacionDisplay[style*="display: block"]');

        this.log('✅ Test Modo Planeamiento completado', 'test');
    }

    async testModoJuegoGuerra() {
        this.log('🧪 Iniciando test del Modo Juego de Guerra', 'test');

        // Verificar elementos principales
        await this.checkElementExists('#map');
        await this.checkElementExists('#panelUnidades');
        await this.checkElementExists('#panelFases');

        // Verificar funciones críticas
        await this.checkFunctionExists('inicializarJuegoGuerra');
        await this.checkFunctionExists('gestorJuego');
        await this.checkFunctionExists('gestorAcciones');

        // Simular acciones de juego
        await this.clickElement('.unidad', 'Seleccionar unidad');
        await this.clickElement('#btnMover', 'Mover unidad');
        await this.clickElement('#btnAtacar', 'Atacar');

        this.log('✅ Test Modo Juego de Guerra completado', 'test');
    }

    async testModoGestionBatalla() {
        this.log('🧪 Iniciando test del Modo Gestión de Batalla', 'test');

        // Verificar elementos principales
        await this.checkElementExists('#map');
        await this.checkElementExists('#panelEdicion');
        await this.checkElementExists('#panelComandos');

        // Verificar funciones críticas
        await this.checkFunctionExists('inicializarGestionBatalla');
        await this.checkFunctionExists('mostrarPanelEdicion');
        await this.checkFunctionExists('ejecutarComando');

        // Simular edición
        await this.clickElement('.elemento-mapa', 'Seleccionar elemento');
        await this.clickElement('#btnEditar', 'Editar elemento');

        // Verificar que se abre panel de edición
        await this.checkElementExists('#panelEdicion.show');

        this.log('✅ Test Modo Gestión de Batalla completado', 'test');
    }

    async findOrphanedFunctions() {
        this.log('🔍 Buscando funciones huérfanas y problemas de código', 'analysis');

        // Buscar funciones definidas pero no usadas
        const allFunctions = [];
        const usedFunctions = [];

        // Escanear scripts cargados
        document.querySelectorAll('script').forEach(script => {
            if (script.src) {
                // Script externo - no podemos analizarlo fácilmente
                return;
            }

            const content = script.textContent;
            const functionMatches = content.match(/function\s+(\w+)\s*\(/g);
            if (functionMatches) {
                functionMatches.forEach(match => {
                    const funcName = match.match(/function\s+(\w+)\s*\(/)[1];
                    allFunctions.push(funcName);
                });
            }
        });

        // Buscar llamadas a funciones
        document.querySelectorAll('*').forEach(element => {
            const onclick = element.getAttribute('onclick');
            if (onclick) {
                const funcCalls = onclick.match(/(\w+)\s*\(/g);
                if (funcCalls) {
                    funcCalls.forEach(call => {
                        const funcName = call.match(/(\w+)\s*\(/)[1];
                        usedFunctions.push(funcName);
                    });
                }
            }
        });

        // Comparar
        const orphaned = allFunctions.filter(func => !usedFunctions.includes(func));

        if (orphaned.length > 0) {
            this.log(`⚠️ Funciones potencialmente huérfanas encontradas: ${orphaned.join(', ')}`, 'warning');
            testResults.warnings += orphaned.length;
        } else {
            this.log('✅ No se encontraron funciones huérfanas obvias');
            testResults.passed++;
        }

        this.log('✅ Análisis de funciones huérfanas completado', 'analysis');
    }

    async findDuplicateIDs() {
        this.log('🔍 Buscando IDs duplicados en el DOM', 'analysis');

        const elements = document.querySelectorAll('[id]');
        const idCounts = {};

        elements.forEach(element => {
            const id = element.id;
            idCounts[id] = (idCounts[id] || 0) + 1;
        });

        const duplicates = Object.entries(idCounts)
            .filter(([id, count]) => count > 1)
            .map(([id, count]) => `${id} (${count} veces)`);

        if (duplicates.length > 0) {
            this.log(`❌ IDs duplicados encontrados: ${duplicates.join(', ')}`, 'error');
            testResults.failed += duplicates.length;
            duplicates.forEach(duplicate => {
                testResults.errors.push({
                    action: 'duplicate ID check',
                    error: `ID duplicado: ${duplicate}`,
                    timestamp: new Date().toISOString()
                });
            });
        } else {
            this.log('✅ No se encontraron IDs duplicados');
            testResults.passed++;
        }

        this.log('✅ Análisis de IDs duplicados completado', 'analysis');
    }

    async runFullTest() {
        this.log('🚀 Iniciando Testing Exhaustivo MAIRA 4.0', 'start');

        try {
            // Test 1: Landing Page
            await this.testLandingPage();

            // Test 2: Modo Selector
            await this.testModoSelector();

            // Test 3: Modo Planeamiento
            await this.testModoPlaneamiento();

            // Test 4: Modo Juego de Guerra
            await this.testModoJuegoGuerra();

            // Test 5: Modo Gestión de Batalla
            await this.testModoGestionBatalla();

            // Análisis de código
            await this.findOrphanedFunctions();
            await this.findDuplicateIDs();

        } catch (error) {
            this.log(`💥 Error crítico durante testing: ${error.message}`, 'error');
            testResults.failed++;
            testResults.errors.push({
                action: 'full test',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        // Reporte final
        this.generateReport();
    }

    generateReport() {
        this.log('📊 REPORTE FINAL DE TESTING', 'report');
        this.log(`✅ Tests pasados: ${testResults.passed}`, 'report');
        this.log(`❌ Tests fallados: ${testResults.failed}`, 'report');
        this.log(`⚠️ Advertencias: ${testResults.warnings}`, 'report');

        if (testResults.errors.length > 0) {
            this.log('📋 DETALLE DE ERRORES:', 'report');
            testResults.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.action}: ${error.error}`, 'report');
            });
        }

        const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
        this.log(`🎯 Tasa de éxito: ${successRate}%`, 'report');

        // Guardar resultados en localStorage para análisis posterior
        localStorage.setItem('mairaTestResults', JSON.stringify({
            results: testResults,
            actions: this.userActions,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        }));

        this.log('💾 Resultados guardados en localStorage', 'report');
    }
}

// Función global para iniciar testing
window.runMAIRATesting = async function() {
    const tester = new MAIRATester();
    await tester.runFullTest();
};

// Auto-inicio si estamos en modo testing
if (window.location.search.includes('test=true')) {
    console.log('🔬 Modo testing detectado, iniciando tests automáticos...');
    setTimeout(() => {
        window.runMAIRATesting();
    }, 2000);
}

console.log('🧪 MAIRA Testing Framework cargado. Ejecuta runMAIRATesting() para iniciar.');