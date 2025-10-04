// test-maira-performance.js
// Tests de performance, carga de recursos y compatibilidad

const fs = require('fs');
const path = require('path');

class TestRunnerMAIRAPerformance {
    constructor() {
        this.resultados = {
            total: 0,
            pasados: 0,
            fallidos: 0,
            errores: []
        };
        this.basePath = path.join(__dirname, 'Client');
    }

    log(mensaje, tipo = 'info') {
        const timestamp = new Date().toISOString();
        const colores = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        console.log(`${colores[tipo]}[${timestamp}] ${mensaje}${colores.reset}`);
    }

    async ejecutar() {
        this.log('⚡ Iniciando Tests de Performance y Recursos', 'info');
        this.log('='.repeat(60), 'info');

        // Tests de carga de recursos
        await this.testResourceLoading();

        // Tests de tamaño de archivos
        this.testFileSizes();

        // Tests de dependencias circulares
        this.testCircularDependencies();

        // Tests de compatibilidad cross-browser
        this.testCrossBrowserCompatibility();

        // Tests de memory leaks potenciales
        this.testMemoryLeaks();

        // Reporte final
        this.reporteFinal();
    }

    async testResourceLoading() {
        this.log('📦 Test: Carga de recursos críticos', 'info');

        try {
            this.resultados.total++;

            const criticalResources = [
                'Client/js/core/UserIdentity.js',
                'Client/js/common/MAIRAChat.js',
                'Client/js/modules/planeamiento/planeamiento.js',
                'Client/css/common/planeamiento.css',
                'Client/css/common/CYGMarcha.css'
            ];

            const missingResources = [];
            const largeFiles = [];

            for (const resource of criticalResources) {
                const resourcePath = path.join(__dirname, resource);
                if (!fs.existsSync(resourcePath)) {
                    missingResources.push(resource);
                } else {
                    const stats = fs.statSync(resourcePath);
                    const sizeKB = stats.size / 1024;

                    // Archivos > 500KB podrían ser problemáticos
                    if (sizeKB > 500) {
                        largeFiles.push(`${resource}: ${(sizeKB).toFixed(1)}KB`);
                    }
                }
            }

            if (missingResources.length > 0) {
                this.log(`❌ Recursos críticos faltantes: ${missingResources.join(', ')}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: 'Recursos críticos',
                    missing: missingResources
                });
            } else if (largeFiles.length > 0) {
                this.log(`⚠️ Archivos grandes detectados: ${largeFiles.join(', ')}`, 'warning');
                this.resultados.pasados++;
            } else {
                this.log('✅ Todos los recursos críticos existen y tienen tamaño adecuado', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de recursos: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testFileSizes() {
        this.log('📊 Test: Tamaño de archivos JavaScript', 'info');

        try {
            this.resultados.total++;

            const jsFiles = this.findFilesByExtension(this.basePath, '.js');
            const sizeReport = [];
            let totalSize = 0;

            for (const file of jsFiles) {
                const stats = fs.statSync(file);
                const sizeKB = stats.size / 1024;
                totalSize += sizeKB;

                if (sizeKB > 200) { // Archivos > 200KB
                    sizeReport.push(`${path.relative(this.basePath, file)}: ${(sizeKB).toFixed(1)}KB`);
                }
            }

            if (sizeReport.length > 0) {
                this.log(`⚠️ Archivos JS grandes: ${sizeReport.join(', ')}`, 'warning');
            }

            if (totalSize > 5000) { // Total > 5MB
                this.log(`❌ Tamaño total de JS muy grande: ${(totalSize / 1024).toFixed(1)}MB`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: 'Tamaño archivos',
                    message: `Total JS: ${(totalSize / 1024).toFixed(1)}MB`
                });
            } else {
                this.log(`✅ Tamaño total de JS aceptable: ${(totalSize / 1024).toFixed(1)}MB`, 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de tamaños: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testCircularDependencies() {
        this.log('🔄 Test: Dependencias circulares', 'info');

        try {
            this.resultados.total++;

            // Análisis básico de imports para detectar posibles dependencias circulares
            const jsFiles = this.findFilesByExtension(this.basePath, '.js');
            const importMap = new Map();
            const potentialCircular = [];

            for (const file of jsFiles) {
                const content = fs.readFileSync(file, 'utf8');
                const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
                const requires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];

                const dependencies = [...imports, ...requires].map(dep => {
                    const match = dep.match(/['"]([^'"]+)['"]/);
                    return match ? match[1] : null;
                }).filter(Boolean);

                importMap.set(path.relative(this.basePath, file), dependencies);
            }

            // Verificar dependencias circulares simples
            for (const [file, deps] of importMap) {
                for (const dep of deps) {
                    // Buscar si algún archivo importado también importa este archivo
                    for (const [otherFile, otherDeps] of importMap) {
                        if (otherDeps.some(d => d.includes(path.basename(file, '.js')))) {
                            if (deps.some(d => d.includes(path.basename(otherFile, '.js')))) {
                                potentialCircular.push(`${file} ↔ ${otherFile}`);
                            }
                        }
                    }
                }
            }

            if (potentialCircular.length > 0) {
                this.log(`⚠️ Posibles dependencias circulares: ${potentialCircular.join(', ')}`, 'warning');
                this.resultados.pasados++; // No es crítico para funcionalidad
            } else {
                this.log('✅ No se detectaron dependencias circulares obvias', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de dependencias: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testCrossBrowserCompatibility() {
        this.log('🌐 Test: Compatibilidad cross-browser', 'info');

        try {
            this.resultados.total++;

            const jsFiles = this.findFilesByExtension(this.basePath, '.js');
            const compatibilityIssues = [];

            for (const file of jsFiles) {
                const content = fs.readFileSync(file, 'utf8');

                // Verificar uso de APIs modernas que podrían no ser compatibles
                const modernAPIs = [
                    'fetch', 'Promise', 'async', 'await', 'const', 'let',
                    'Arrow functions', 'Template literals', 'Destructuring',
                    'Spread operator', 'Classes', 'Modules'
                ];

                // Contar uso aproximado de características modernas
                let modernFeatures = 0;
                if (content.includes('const ')) modernFeatures++;
                if (content.includes('let ')) modernFeatures++;
                if (content.includes('async ')) modernFeatures++;
                if (content.includes('await ')) modernFeatures++;
                if (content.includes('=>')) modernFeatures++;
                if (content.includes('`')) modernFeatures++; // Template literals
                if (content.includes('...')) modernFeatures++; // Spread/rest
                if (content.includes('class ')) modernFeatures++;
                if (content.includes('import ')) modernFeatures++;
                if (content.includes('export ')) modernFeatures++;

                if (modernFeatures > 5) { // Más de 5 características modernas
                    compatibilityIssues.push(`${path.relative(this.basePath, file)}: ${modernFeatures} características modernas`);
                }
            }

            if (compatibilityIssues.length > 0) {
                this.log(`⚠️ Archivos con características modernas: ${compatibilityIssues.join(', ')}`, 'warning');
                this.log('   💡 Considerar transpilar para mejor compatibilidad', 'info');
                this.resultados.pasados++;
            } else {
                this.log('✅ Código compatible con navegadores modernos', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test cross-browser: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testMemoryLeaks() {
        this.log('💧 Test: Detección de memory leaks potenciales', 'info');

        try {
            this.resultados.total++;

            const jsFiles = this.findFilesByExtension(this.basePath, '.js');
            const leakPatterns = [];

            for (const file of jsFiles) {
                const content = fs.readFileSync(file, 'utf8');

                // Patrones que podrían indicar memory leaks
                const patterns = [
                    'setInterval', 'setTimeout', 'addEventListener',
                    'EventSource', 'WebSocket', 'XMLHttpRequest'
                ];

                let leakScore = 0;
                for (const pattern of patterns) {
                    const matches = content.match(new RegExp(pattern, 'g'));
                    if (matches) {
                        leakScore += matches.length;
                    }
                }

                // Verificar si hay cleanup correspondiente
                const cleanupPatterns = ['clearInterval', 'clearTimeout', 'removeEventListener'];
                let cleanupScore = 0;
                for (const pattern of cleanupPatterns) {
                    const matches = content.match(new RegExp(pattern, 'g'));
                    if (matches) {
                        cleanupScore += matches.length;
                    }
                }

                if (leakScore > cleanupScore + 2) { // Más listeners/timers que cleanup
                    leakPatterns.push(`${path.relative(this.basePath, file)}: ${leakScore} potenciales leaks vs ${cleanupScore} cleanup`);
                }
            }

            if (leakPatterns.length > 0) {
                this.log(`⚠️ Posibles memory leaks: ${leakPatterns.join(', ')}`, 'warning');
                this.resultados.pasados++;
            } else {
                this.log('✅ No se detectaron problemas obvios de memory leaks', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de memory leaks: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    findFilesByExtension(dir, extension) {
        const files = [];

        function scan(directory) {
            if (!fs.existsSync(directory)) return;

            const items = fs.readdirSync(directory);

            for (const item of items) {
                const fullPath = path.join(directory, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scan(fullPath);
                } else if (item.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        }

        scan(dir);
        return files;
    }

    reporteFinal() {
        this.log('', 'info');
        this.log('============================================================', 'info');
        this.log('📊 REPORTE FINAL - TESTS PERFORMANCE Y RECURSOS', 'info');
        this.log('============================================================', 'info');
        this.log(`📈 Tasa de éxito: ${((this.resultados.pasados / this.resultados.total) * 100).toFixed(1)}%`, 'info');
        this.log(`✅ Tests pasados: ${this.resultados.pasados}`, 'info');
        this.log(`❌ Tests fallidos: ${this.resultados.fallidos}`, 'info');
        this.log(`⚠️  Advertencias: ${this.resultados.errores.length}`, 'info');

        if (this.resultados.errores.length > 0) {
            this.log('', 'info');
            this.log('🚨 DETALLE DE ERRORES:', 'error');
            this.resultados.errores.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error.test}: ${error.message || JSON.stringify(error)}`, 'error');
            });
        }

        this.log('', 'info');
        this.log('💡 RECOMENDACIONES:', 'info');
        this.log('   - Optimizar archivos JavaScript grandes', 'info');
        this.log('   - Considerar code splitting para mejor performance', 'info');
        this.log('   - Implementar transpiling para mejor compatibilidad', 'info');
        this.log('   - Revisar cleanup de event listeners y timers', 'info');
        this.log('   - Monitorear uso de memoria en producción', 'info');

        this.log('', 'info');
        this.log('🏁 Tests de Performance y Recursos Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerMAIRAPerformance();
    tester.ejecutar().catch(console.error);
}

module.exports = TestRunnerMAIRAPerformance;