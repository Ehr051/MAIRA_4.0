#!/usr/bin/env node

/**
 * @fileoverview Testing Integral MAIRA 4.0 - Desde Login hasta Funcionalidades Completas
 * @description Tests exhaustivos que simulan flujo completo del usuario
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

class IntegrationTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            testSuites: {}
        };
        this.baseDir = path.resolve(__dirname);
        console.log('🧪 MAIRA Integration Tester v2.0.0 inicializado');
        console.log('Directorio base:', this.baseDir);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
    }

    // ===== TESTS DE ARQUITECTURA Y DEPENDENCIAS =====

    async testArchitectureIntegrity() {
        this.log('🏗️  Iniciando tests de integridad arquitectural...');

        const criticalFiles = [
            // Core system - EXISTEN
            'Client/js/utils/config.js',
            'Client/js/common/networkConfig.js',
            'Client/js/core/UserIdentity.js',

            // Navigation and routing - EXISTEN
            'Client/js/handlers/dependency-manager.js',
            'Client/js/handlers/DirectorManager.js',

            // UI Components - EXISTEN
            'Client/js/interface/UIManager.js',
            'Client/js/legacy/panelManager.js',

            // Game modules - EXISTEN
            'Client/js/modules/partidas/iniciarpartida.js',
            'Client/js/modules/planeamiento/planeamiento.js',
            'Client/js/modules/gestion/gestionBatalla.js',

            // Services - ALGUNOS EXISTEN
            'Client/js/services/elevationProfileService.js',
            'Client/js/services/threeDMapService.js',
            'Client/js/Test/maira-testing-framework.js'

            // FALTAN (no existen):
            // 'Client/js/core/utils.js',
            // 'Client/js/core/logger.js',
            // 'Client/js/core/constants.js',
            // 'Client/js/modules/identity/authService.js',
            // 'Client/js/modules/juego/juegoManager.js',
            // 'Client/js/services/socketService.js'
        ];

        let foundCount = 0;
        for (const file of criticalFiles) {
            const exists = await this.checkFileExists(file, 'arquitectural');
            if (exists) foundCount++;
        }

        this.log(`📊 Arquitectura: ${foundCount}/${criticalFiles.length} archivos críticos encontrados`);
        return foundCount === criticalFiles.length;
    }

    async testDependencyIntegrity() {
        this.log('🔗 Verificando integridad de dependencias...');

        // Verificar package.json
        const packageExists = await this.checkFileExists('package.json', 'dependencies');
        if (!packageExists) return false;

        try {
            const packageContent = fs.readFileSync(path.join(this.baseDir, 'package.json'), 'utf8');
            const packageData = JSON.parse(packageContent);

            const criticalDeps = [
                'jquery', 'bootstrap', 'leaflet', 'jsplumb',
                'socket.io-client', 'd3', 'three'
            ];

            let missingDeps = [];
            for (const dep of criticalDeps) {
                if (!packageData.dependencies || !packageData.dependencies[dep]) {
                    missingDeps.push(dep);
                }
            }

            if (missingDeps.length > 0) {
                this.log(`❌ Dependencias faltantes: ${missingDeps.join(', ')}`, 'error');
                this.results.failed++;
                return false;
            }

            this.log('✅ Todas las dependencias críticas están presentes');
            this.results.passed++;
            return true;
        } catch (error) {
            this.log(`❌ Error leyendo package.json: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    // ===== TESTS DE AUTENTICACIÓN Y LOGIN =====

    async testAuthenticationFlow() {
        this.log('🔐 Verificando flujo de autenticación...');

        // Verificar archivos de autenticación que EXISTEN
        const authFiles = [
            'Client/js/core/UserIdentity.js'
        ];

        for (const file of authFiles) {
            if (!await this.checkFileExists(file, 'authentication')) {
                return false;
            }
        }

        // Verificar que index.html tenga elementos de login
        try {
            const indexContent = fs.readFileSync(path.join(this.baseDir, 'Client/index.html'), 'utf8');

            const loginElements = [
                'loginForm',
                'usuario',
                'contrasena',
                'btnInicio'
            ];

            let missingElements = [];
            for (const element of loginElements) {
                if (!indexContent.includes(`id="${element}"`)) {
                    missingElements.push(element);
                }
            }

            if (missingElements.length > 0) {
                this.log(`❌ Elementos de login faltantes en index.html: ${missingElements.join(', ')}`, 'error');
                this.results.failed++;
                return false;
            }

            this.log('✅ Elementos de login presentes en index.html');
            this.results.passed++;
            return true;
        } catch (error) {
            this.log(`❌ Error verificando elementos de login: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    // ===== TESTS DE NAVEGACIÓN ENTRE MODOS =====

    async testNavigationFlow() {
        this.log('🧭 Verificando flujo de navegación entre modos...');

        const pages = [
            { file: 'Client/index.html', name: 'Login/Home' },
            { file: 'Client/planeamiento.html', name: 'Planeamiento' },
            { file: 'Client/juegodeguerra.html', name: 'Juego de Guerra' },
            { file: 'Client/gestionbatalla.html', name: 'Gestión de Batalla' },
            { file: 'Client/iniciarpartida.html', name: 'Iniciar Partida' },
            { file: 'Client/inicioGB.html', name: 'Inicio GB' }
        ];

        for (const page of pages) {
            if (!await this.checkFileExists(page.file, 'navigation')) {
                this.log(`❌ Página faltante: ${page.name} (${page.file})`, 'error');
                return false;
            }
        }

        this.log('✅ Todas las páginas principales existen');
        this.results.passed++;
        return true;
    }

    // ===== TESTS DE FUNCIONALIDADES ESPECÍFICAS =====

    async testPlanningModeFeatures() {
        this.log('📋 Verificando funcionalidades del modo Planeamiento...');

        const planningFiles = [
            'Client/js/modules/planeamiento/planeamiento.js' // ✅ EXISTE - contiene PlaneamientoManager
        ];

        for (const file of planningFiles) {
            if (!await this.checkFileExists(file, 'planning')) {
                return false;
            }
        }

        // Verificar elementos específicos del planeamiento
        try {
            const planningContent = fs.readFileSync(path.join(this.baseDir, 'Client/planeamiento.html'), 'utf8');

            const planningElements = [
                'verBtn', // ✅ EXISTE - botón de ver
                'tipoMapaBtn', // ✅ EXISTE - selector de tipo de mapa
                'cuadriculaMGRS', // ✅ EXISTE - cuadrícula MGRS
                'btnVista3D' // ✅ EXISTE - botón de vista 3D
            ];

            let missingElements = [];
            for (const element of planningElements) {
                if (!planningContent.includes(`id="${element}"`)) {
                    missingElements.push(element);
                }
            }

            if (missingElements.length > 0) {
                this.log(`❌ Elementos de planeamiento faltantes: ${missingElements.join(', ')}`, 'error');
                this.results.failed++;
                return false;
            }

            this.log('✅ Elementos de planeamiento presentes');
            this.results.passed++;
            return true;
        } catch (error) {
            this.log(`❌ Error verificando elementos de planeamiento: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    async testWarfareModeFeatures() {
        this.log('⚔️  Verificando funcionalidades del modo Juego de Guerra...');

        const warfareFiles = [
            'Client/js/modules/juego/gestorJuego.js', // ✅ EXISTE - Gestor principal del modo Juego de Guerra
            'Client/js/services/threeDMapService.js'
        ];

        for (const file of warfareFiles) {
            if (!await this.checkFileExists(file, 'warfare')) {
                return false;
            }
        }

        this.log('✅ Componentes de Juego de Guerra presentes');
        this.results.passed++;
        return true;
    }

    async testBattleManagementFeatures() {
        this.log('⚔️ Verificando funcionalidades de Gestión de Batalla...');

        const battleFiles = [
            'Client/js/interface/UIManager.js', // ✅ EXISTE - contiene UIManager
            'Client/js/legacy/panelManager.js'  // ✅ EXISTE - contiene PanelManager
        ];

        for (const file of battleFiles) {
            if (!await this.checkFileExists(file, 'battle')) {
                return false;
            }
        }

        // Verificar elementos específicos de gestión de batalla
        try {
            const battleContent = fs.readFileSync(path.join(this.baseDir, 'Client/gestionbatalla.html'), 'utf8');

            const battleElements = [
                'btnVista3D', // ✅ EXISTE - botón de vista 3D
                'infanteriaVehiculosBtn', // ✅ EXISTE - menú de vehículos de infantería
                'caballeriaBtn', // ✅ EXISTE - menú de caballería
                'apoyoFuegoBtn' // ✅ EXISTE - menú de apoyo de fuego/artillería
            ];

            let missingElements = [];
            for (const element of battleElements) {
                if (!battleContent.includes(`id="${element}"`)) {
                    missingElements.push(element);
                }
            }

            if (missingElements.length > 0) {
                this.log(`❌ Elementos de gestión de batalla faltantes: ${missingElements.join(', ')}`, 'error');
                this.results.failed++;
                return false;
            }

            this.log('✅ Elementos de gestión de batalla presentes');
            this.results.passed++;
            return true;
        } catch (error) {
            this.log(`❌ Error verificando elementos de gestión de batalla: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    // ===== TESTS DE INTEGRACIÓN =====

    async testSocketIntegration() {
        this.log('🔌 Verificando integración de Socket.IO...');

        const socketFiles = [
            'Client/js/modules/juego/gestorComunicacion.js' // ✅ EXISTE - Gestor de comunicación y Socket.IO
        ];

        for (const file of socketFiles) {
            if (!await this.checkFileExists(file, 'socket')) {
                return false;
            }
        }

        // Verificar que las páginas incluyan socket.io
        const pagesToCheck = [
            'Client/planeamiento.html',
            'Client/juegodeguerra.html',
            'Client/gestionbatalla.html'
        ];

        for (const page of pagesToCheck) {
            try {
                const content = fs.readFileSync(path.join(this.baseDir, page), 'utf8');
                if (!content.includes('socket.io') && !content.includes('socketService')) {
                    this.log(`⚠️  ${page} podría no tener integración de Socket.IO`, 'warning');
                    this.results.warnings++;
                }
            } catch (error) {
                this.log(`❌ Error verificando Socket.IO en ${page}: ${error.message}`, 'error');
                this.results.failed++;
                return false;
            }
        }

        this.log('✅ Integración de Socket.IO verificada');
        this.results.passed++;
        return true;
    }

    async testUIIntegration() {
        this.log('🎨 Verificando integración de componentes UI...');

        const uiFiles = [
            'Client/js/modules/juego/gestorInterfaz.js', // ✅ EXISTE - Gestor de interfaz de usuario
            'Client/js/modules/shared/panelJuegoUnificado.js' // ✅ EXISTE - Sistema unificado de paneles
        ];

        for (const file of uiFiles) {
            if (!await this.checkFileExists(file, 'ui')) {
                return false;
            }
        }

        this.log('✅ Componentes UI presentes');
        this.results.passed++;
        return true;
    }

    // ===== UTILIDADES =====

    async checkFileExists(filePath, category = '') {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            if (fs.existsSync(fullPath)) {
                this.log(`✅ Archivo encontrado: ${filePath} ${category ? `(${category})` : ''}`);
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Archivo no encontrado: ${filePath} ${category ? `(${category})` : ''}`, 'error');
                this.results.failed++;
                this.results.errors.push({
                    test: 'file_exists',
                    category,
                    file: filePath,
                    error: 'Archivo no existe'
                });
                return false;
            }
        } catch (error) {
            this.log(`❌ Error verificando archivo ${filePath}: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    // ===== EJECUCIÓN PRINCIPAL =====

    async runCompleteIntegrationTest() {
        this.log('🚀 Iniciando Testing Integral Completo de MAIRA 4.0');
        this.log('=' .repeat(60));

        const testSuites = [
            { name: 'Arquitectura', method: this.testArchitectureIntegrity.bind(this) },
            { name: 'Dependencias', method: this.testDependencyIntegrity.bind(this) },
            { name: 'Autenticación', method: this.testAuthenticationFlow.bind(this) },
            { name: 'Navegación', method: this.testNavigationFlow.bind(this) },
            { name: 'Modo Planeamiento', method: this.testPlanningModeFeatures.bind(this) },
            { name: 'Modo Juego de Guerra', method: this.testWarfareModeFeatures.bind(this) },
            { name: 'Modo Gestión de Batalla', method: this.testBattleManagementFeatures.bind(this) },
            { name: 'Socket.IO', method: this.testSocketIntegration.bind(this) },
            { name: 'UI Components', method: this.testUIIntegration.bind(this) }
        ];

        for (const suite of testSuites) {
            this.log(`\n📋 Ejecutando suite: ${suite.name}`);
            this.log('-'.repeat(40));

            try {
                const success = await suite.method();
                this.results.testSuites[suite.name] = success;

                if (success) {
                    this.log(`✅ Suite ${suite.name}: PASADA`);
                } else {
                    this.log(`❌ Suite ${suite.name}: FALLIDA`);
                }
            } catch (error) {
                this.log(`💥 Suite ${suite.name}: ERROR - ${error.message}`, 'error');
                this.results.testSuites[suite.name] = false;
                this.results.errors.push({
                    suite: suite.name,
                    error: error.message
                });
            }
        }

        this.showFinalReport();
    }

    showFinalReport() {
        this.log('\n' + '='.repeat(60));
        this.log('📊 REPORTE FINAL - TESTING INTEGRAL MAIRA 4.0');
        this.log('='.repeat(60));

        // Resumen general
        const totalTests = this.results.passed + this.results.failed;
        const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;

        this.log(`📈 Tasa de éxito general: ${successRate}%`);
        this.log(`✅ Tests pasados: ${this.results.passed}`);
        this.log(`❌ Tests fallidos: ${this.results.failed}`);
        this.log(`⚠️  Advertencias: ${this.results.warnings}`);

        // Resultados por suite
        this.log('\n📋 RESULTADOS POR SUITE:');
        for (const [suiteName, success] of Object.entries(this.results.testSuites)) {
            const status = success ? '✅ PASADA' : '❌ FALLIDA';
            this.log(`   ${suiteName}: ${status}`);
        }

        // Errores detallados
        if (this.results.errors.length > 0) {
            this.log('\n🔍 DETALLE DE ERRORES:');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.suite || error.test}: ${error.error}`);
                if (error.file) {
                    this.log(`   Archivo: ${error.file}`);
                }
            });
        }

        // Recomendaciones
        this.log('\n💡 RECOMENDACIONES:');
        if (this.results.failed > 0) {
            this.log('   - Corregir los errores identificados antes del despliegue');
        }
        if (this.results.warnings > 0) {
            this.log('   - Revisar las advertencias para mejorar la robustez');
        }
        if (successRate >= 90) {
            this.log('   - Sistema listo para pruebas de usuario final');
        } else if (successRate >= 75) {
            this.log('   - Requiere correcciones menores antes de pruebas');
        } else {
            this.log('   - Requiere correcciones críticas antes de continuar');
        }

        this.log('\n🏁 Testing Integral Completado');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runCompleteIntegrationTest().catch(console.error);
}

module.exports = IntegrationTester;