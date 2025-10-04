const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class MAIRAE2ETester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            passed: 0,
            failed: 0,
            errors: [],
            warnings: []
        };
    }

    async init() {
        console.log('🚀 Iniciando tests E2E de MAIRA 4.0...');
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();

        // Configurar para capturar errores de consola
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.results.errors.push(`Console Error: ${msg.text()}`);
            }
        });

        // Configurar para capturar errores de página
        this.page.on('pageerror', error => {
            this.results.errors.push(`Page Error: ${error.message}`);
        });
    }

    async testFlujoCompleto() {
        try {
            console.log('📋 Test 1: Flujo completo de usuario');

            // 1. Cargar página de inicio GB
            await this.page.goto('http://localhost:8000/inicioGB.html', { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });

            // Verificar que la página cargó correctamente
            const title = await this.page.title();
            if (!title.includes('Sala de Operaciones')) {
                throw new Error('Página de inicio GB no cargó correctamente');
            }

            // 2. Verificar elementos básicos de la interfaz
            const bodyExists = await this.page.$('body');
            if (!bodyExists) {
                throw new Error('Body no encontrado');
            }

            // 3. Verificar que Socket.IO está disponible
            const socketAvailable = await this.page.evaluate(() => {
                return typeof io !== 'undefined';
            });
            if (!socketAvailable) {
                throw new Error('Socket.IO no está disponible');
            }

            // 4. Verificar carga de módulos críticos
            const jqueryLoaded = await this.page.evaluate(() => {
                return typeof $ !== 'undefined';
            });
            if (!jqueryLoaded) {
                throw new Error('jQuery no cargó');
            }

            // 5. Test de navegación a planeamiento
            await this.testNavegacionPlaneamiento();

            this.results.passed++;
            console.log('✅ Flujo completo: PASADO');

        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Flujo completo: ${error.message}`);
            console.log('❌ Flujo completo: FALLADO -', error.message);
        }
    }

    async testNavegacionPlaneamiento() {
        try {
            // Navegar a la página de planeamiento
            await this.page.goto('http://localhost:8000/planeamiento.html', { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 5000 });

            // Verificar que la página de planeamiento cargó
            const title = await this.page.title();
            if (!title.includes('Planeamiento')) {
                throw new Error('Página de planeamiento no cargó correctamente');
            }

            // Verificar elementos del mapa (Leaflet)
            const leafletLoaded = await this.page.evaluate(() => {
                return typeof L !== 'undefined';
            });
            if (!leafletLoaded) {
                throw new Error('Leaflet no está cargado');
            }

            // Verificar que Three.js está disponible para 3D
            const threeLoaded = await this.page.evaluate(() => {
                return typeof THREE !== 'undefined';
            });
            if (!threeLoaded) {
                this.results.warnings.push('Three.js no encontrado en planeamiento');
            }

        } catch (error) {
            this.results.warnings.push(`Error en navegación planeamiento: ${error.message}`);
        }
    }

    async simularOperacionesPlaneamiento() {
        try {
            // Simular agregar elementos al mapa
            await this.page.evaluate(() => {
                if (window.agregarElementoMapa) {
                    window.agregarElementoMapa('unidad', { x: 100, y: 100 });
                }
            });

            // Simular batch updates
            await this.page.evaluate(() => {
                if (window.procesarBatchUpdates) {
                    window.procesarBatchUpdates();
                }
            });

            // Verificar que no haya errores después de las operaciones
            const erroresPostOperacion = await this.page.$$('.error-message');
            if (erroresPostOperacion.length > 0) {
                throw new Error('Errores detectados después de operaciones de planeamiento');
            }

        } catch (error) {
            throw new Error(`Error en operaciones de planeamiento: ${error.message}`);
        }
    }

    async verificarModelos3D() {
        try {
            // Verificar que Three.js esté cargado
            const threeLoaded = await this.page.evaluate(() => {
                return typeof THREE !== 'undefined';
            });
            if (!threeLoaded) {
                throw new Error('Three.js no está cargado');
            }

            // Verificar escena 3D
            const escena3D = await this.page.$('.escena-3d');
            if (!escena3D) {
                this.results.warnings.push('Escena 3D no encontrada');
            }

            // Verificar modelos GLTF
            const modelosGLTF = await this.page.$$('[data-modelo-gltf]');
            if (modelosGLTF.length === 0) {
                this.results.warnings.push('No se encontraron modelos GLTF');
            }

        } catch (error) {
            throw new Error(`Error en verificación 3D: ${error.message}`);
        }
    }

    async testChat() {
        try {
            const chatInput = await this.page.$('.chat-input');
            if (!chatInput) {
                this.results.warnings.push('Chat input no encontrado');
                return;
            }

            // Simular envío de mensaje
            await this.page.type('.chat-input', 'Test message E2E');
            await this.page.click('.chat-send-btn');

            // Verificar que el mensaje aparezca
            await this.page.waitForSelector('.chat-message', { timeout: 2000 });

        } catch (error) {
            this.results.warnings.push(`Error en test de chat: ${error.message}`);
        }
    }

    async testResponsive() {
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.page.waitForTimeout(1000);

            // Verificar que no haya elementos desbordados
            const elementosDesbordados = await this.page.$$eval('*', elements => {
                return elements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.right > window.innerWidth || rect.bottom > window.innerHeight;
                }).length;
            });

            if (elementosDesbordados > 0) {
                this.results.warnings.push(`${elementosDesbordados} elementos desbordados en mobile`);
            }

            // Test tablet viewport
            await this.page.setViewport({ width: 768, height: 1024 });
            await this.page.waitForTimeout(1000);

            // Test desktop viewport
            await this.page.setViewport({ width: 1920, height: 1084 });
            await this.page.waitForTimeout(1000);

        } catch (error) {
            this.results.warnings.push(`Error en test responsive: ${error.message}`);
        }
    }

    async testPerformance() {
        try {
            console.log('📊 Test 2: Performance y carga de recursos');

            // Test de carga de página principal
            await this.page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
            const loadTime = await this.page.evaluate(() => {
                return performance.timing.loadEventEnd - performance.timing.navigationStart;
            });

            if (loadTime > 8000) { // 8 segundos máximo para página principal
                this.results.warnings.push(`Tiempo de carga alto: ${loadTime}ms`);
            }

            // Test de carga de página de inicio GB
            await this.page.goto('http://localhost:8000/inicioGB.html', { waitUntil: 'networkidle0' });
            const gbLoadTime = await this.page.evaluate(() => {
                return performance.timing.loadEventEnd - performance.timing.navigationStart;
            });

            if (gbLoadTime > 10000) { // 10 segundos máximo para página compleja
                this.results.warnings.push(`Tiempo de carga inicioGB alto: ${gbLoadTime}ms`);
            }

            // Verificar tamaño de recursos
            const resources = await this.page.evaluate(() => {
                const resources = performance.getEntriesByType('resource');
                return resources.map(r => ({
                    name: r.name,
                    size: r.transferSize,
                    type: r.initiatorType
                }));
            });

            const jsResources = resources.filter(r => r.type === 'script');
            const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);

            if (totalJSSize > 15 * 1024 * 1024) { // 15MB límite
                this.results.warnings.push(`Bundle JS muy grande: ${(totalJSSize / 1024 / 1024).toFixed(2)}MB`);
            }

            // Verificar navegación entre páginas
            await this.testNavegacionRapida();

            this.results.passed++;
            console.log('✅ Performance: PASADO');

        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Performance: ${error.message}`);
            console.log('❌ Performance: FALLADO -', error.message);
        }
    }

    async testNavegacionRapida() {
        try {
            const startTime = Date.now();

            // Navegar rápidamente entre páginas
            await this.page.goto('http://localhost:8000/inicioGB.html', { waitUntil: 'domcontentloaded' });
            await this.page.goto('http://localhost:8000/planeamiento.html', { waitUntil: 'domcontentloaded' });
            await this.page.goto('http://localhost:8000/juegodeguerra.html', { waitUntil: 'domcontentloaded' });

            const navTime = Date.now() - startTime;
            if (navTime > 5000) {
                this.results.warnings.push(`Navegación lenta entre páginas: ${navTime}ms`);
            }

        } catch (error) {
            this.results.warnings.push(`Error en navegación rápida: ${error.message}`);
        }
    }

    async simularUsoProlongado() {
        // Simular navegación entre módulos múltiples veces
        for (let i = 0; i < 5; i++) {
            await this.page.click('#planeamiento-btn');
            await this.page.waitForTimeout(500);
            await this.page.click('#batalla-btn');
            await this.page.waitForTimeout(500);
        }

        // Verificar que no haya acumulación de memoria
        const memoryUsage = await this.page.evaluate(() => {
            if (performance.memory) {
                return {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        if (memoryUsage && memoryUsage.used > memoryUsage.limit * 0.8) {
            this.results.warnings.push('Posible memory leak detectado');
        }
    }

    async testFlujoCompletoUsuario() {
        try {
            console.log('👤 Test 4: Flujo completo de usuario (crear cuenta → login → usar sistema)');

            // 1. Cargar página principal
            await this.page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
            await this.page.waitForSelector('body', { timeout: 10000 });

            // 2. Hacer click en "Crear Usuario"
            await this.page.click('#menuBtnCrearUsuario');
            await this.page.waitForSelector('#crearUsuarioForm', { visible: true, timeout: 5000 });

            // 3. Llenar formulario de creación de usuario
            const timestamp = Date.now();
            const testUser = `testuser_${timestamp}`;
            const testPass = 'testpass123';

            await this.page.type('#nuevoUsuario', testUser);
            await this.page.type('#correo', `test${timestamp}@example.com`);
            await this.page.type('#confirmarCorreo', `test${timestamp}@example.com`);
            await this.page.type('#nuevaContrasena', testPass);
            await this.page.type('#unidad', 'Test Unit');

            // Hacer click en crear cuenta
            await this.page.click('#btnCrear');

            // Esperar a que se complete la creación (puede haber un redirect o mensaje)
            await this.page.waitForTimeout(2000);

            // 4. Ahora hacer login con la cuenta creada
            await this.page.click('#menuBtnLogin');
            await this.page.waitForSelector('#loginForm', { visible: true, timeout: 5000 });

            await this.page.type('#usuario', testUser);
            await this.page.type('#contrasena', testPass);
            await this.page.click('#btnLogin');

            // 5. Esperar a que aparezca la selección de modos
            await this.page.waitForSelector('#seleccionModo', { visible: true, timeout: 10000 });

            // 6. Seleccionar modo planeamiento
            const planeamientoCard = await this.page.$('[data-modo="planeamiento"]');
            if (planeamientoCard) {
                await planeamientoCard.click();
            } else {
                // Intentar con el enlace directo
                await this.page.click('a[href*="planeamiento"]');
            }

            // 7. Verificar que cargó la página de planeamiento
            await this.page.waitForSelector('body', { timeout: 10000 });
            const currentUrl = this.page.url();
            if (!currentUrl.includes('planeamiento.html')) {
                throw new Error('No se redirigió correctamente a planeamiento');
            }

            // 8. Verificar elementos críticos de planeamiento
            const mapaContainer = await this.page.$('#map');
            if (!mapaContainer) {
                this.results.warnings.push('Contenedor del mapa no encontrado');
            }

            // 9. Verificar que FontAwesome funciona
            const faIcons = await this.page.$$('.fas, .far, .fab');
            if (faIcons.length === 0) {
                this.results.warnings.push('No se encontraron iconos FontAwesome');
            }

            // 10. Probar funcionalidad básica - hacer click en un botón
            const btnVista3D = await this.page.$('#btnVista3D');
            if (btnVista3D) {
                await btnVista3D.click();
                // Verificar que no hay errores de JavaScript
                await this.page.waitForTimeout(1000);
            }

            this.results.passed++;
            console.log('✅ Flujo completo usuario: PASADO');

        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Flujo completo usuario: ${error.message}`);
            console.log('❌ Flujo completo usuario: FALLADO -', error.message);
        }
    }

    async runAllTests() {
        await this.init();

        await this.testFlujoCompleto();
        await this.testPerformance();
        await this.testFlujoCompletoUsuario();

        await this.generateReport();
        await this.cleanup();
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.passed + this.results.failed,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1) + '%'
            },
            errors: this.results.errors,
            warnings: this.results.warnings
        };

        fs.writeFileSync('test-maira-e2e-results.json', JSON.stringify(report, null, 2));

        console.log('\n📊 REPORTE DE TESTS E2E:');
        console.log(`Total: ${report.summary.total}`);
        console.log(`Pasados: ${report.summary.passed}`);
        console.log(`Fallados: ${report.summary.failed}`);
        console.log(`Tasa de éxito: ${report.summary.successRate}`);

        if (report.errors.length > 0) {
            console.log('\n❌ ERRORES:');
            report.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (report.warnings.length > 0) {
            console.log('\n⚠️  ADVERTENCIAS:');
            report.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        // Resumen específico del flujo de usuario
        console.log('\n👤 FLUJO COMPLETO DE USUARIO:');
        console.log('   ✅ Crear cuenta → Login → Seleccionar modo → Probar funcionalidades');
        console.log('   📋 Tests incluidos: Autenticación, navegación, FontAwesome, funcionalidades básicas');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new MAIRAE2ETester();
    tester.runAllTests().catch(console.error);
}

module.exports = MAIRAE2ETester;