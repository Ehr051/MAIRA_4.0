// test-maira-css.js
// Tests específicos para detectar conflictos y problemas de CSS

const fs = require('fs');
const path = require('path');

class TestRunnerMAIRACSS {
    constructor() {
        this.resultados = {
            total: 0,
            pasados: 0,
            fallidos: 0,
            errores: []
        };
        this.basePath = path.join(__dirname, 'Client', 'css');
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
        this.log('🎨 Iniciando Tests de CSS y Compatibilidad', 'info');
        this.log('='.repeat(60), 'info');

        // Tests de conflictos de z-index
        await this.testZIndexConflicts();

        // Tests de uso excesivo de !important
        this.testImportantUsage();

        // Tests de carga de CSS
        this.testCSSLoading();

        // Tests de compatibilidad responsive
        this.testResponsiveDesign();

        // Tests de conflictos entre módulos
        this.testModuleConflicts();

        // Reporte final
        this.reporteFinal();
    }

    async testZIndexConflicts() {
        this.log('📚 Test: Conflictos de z-index', 'info');

        try {
            this.resultados.total++;

            const zIndexValues = [];
            const conflicts = [];

            // Buscar todos los archivos CSS
            const cssFiles = this.findCSSFiles(this.basePath);

            for (const file of cssFiles) {
                const content = fs.readFileSync(file, 'utf8');
                const zIndexMatches = content.match(/z-index:\s*(\d+|-\d+)/g);

                if (zIndexMatches) {
                    zIndexMatches.forEach(match => {
                        const value = parseInt(match.replace('z-index:', '').trim());
                        zIndexValues.push({
                            file: path.relative(this.basePath, file),
                            value: value,
                            line: this.getLineNumber(content, match)
                        });
                    });
                }
            }

            // Detectar valores duplicados altos (>1000)
            const highValues = zIndexValues.filter(item => item.value > 1000);
            const duplicates = highValues.filter((item, index, arr) =>
                arr.findIndex(other => other.value === item.value) !== index
            );

            if (duplicates.length > 0) {
                conflicts.push(`Valores z-index duplicados altos: ${duplicates.map(d => `${d.value} (${d.file}:${d.line})`).join(', ')}`);
            }

            // Verificar jerarquía lógica
            const sortedValues = [...new Set(zIndexValues.map(item => item.value))].sort((a, b) => a - b);
            if (sortedValues.length > 20) { // Si hay más de 20 valores diferentes, puede haber confusión
                conflicts.push(`Demasiados valores z-index diferentes (${sortedValues.length}), considerar consolidar`);
            }

            if (conflicts.length === 0) {
                this.log('✅ No se encontraron conflictos críticos de z-index', 'success');
                this.resultados.pasados++;
            } else {
                this.log(`❌ Conflictos de z-index encontrados: ${conflicts.join('; ')}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: 'Conflictos z-index',
                    conflicts: conflicts
                });
            }

        } catch (error) {
            this.log(`❌ Error en test de z-index: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testImportantUsage() {
        this.log('❗ Test: Uso excesivo de !important', 'info');

        try {
            this.resultados.total++;

            const importantUsage = [];
            const cssFiles = this.findCSSFiles(this.basePath);

            for (const file of cssFiles) {
                const content = fs.readFileSync(file, 'utf8');
                const importantMatches = content.match(/!important/g);

                if (importantMatches && importantMatches.length > 0) {
                    importantUsage.push({
                        file: path.relative(this.basePath, file),
                        count: importantMatches.length
                    });
                }
            }

            const totalImportant = importantUsage.reduce((sum, item) => sum + item.count, 0);
            const highUsage = importantUsage.filter(item => item.count > 10);

            if (highUsage.length > 0) {
                this.log(`⚠️ Archivos con uso excesivo de !important: ${highUsage.map(h => `${h.file} (${h.count})`).join(', ')}`, 'warning');
            }

            if (totalImportant > 50) { // Umbral razonable
                this.log(`❌ Uso excesivo total de !important (${totalImportant}), considerar refactorizar CSS`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: 'Uso !important',
                    message: `Total !important: ${totalImportant}`
                });
            } else {
                this.log(`✅ Uso de !important dentro de límites (${totalImportant})`, 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de !important: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testCSSLoading() {
        this.log('📦 Test: Carga de archivos CSS', 'info');

        try {
            this.resultados.total++;

            const htmlFiles = [
                'Client/index.html',
                'Client/planeamiento.html',
                'Client/juegodeguerra.html',
                'Client/gestionbatalla.html',
                'Client/iniciarpartida.html'
            ];

            const missingCSS = [];
            const duplicateCSS = [];

            for (const htmlFile of htmlFiles) {
                const htmlPath = path.join(__dirname, htmlFile);
                if (!fs.existsSync(htmlPath)) continue;

                const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                const cssLinks = htmlContent.match(/href="([^"]*\.css)"/g) || [];

                const cssFiles = cssLinks.map(link => {
                    const href = link.match(/href="([^"]*\.css)"/)[1];
                    return href.startsWith('/') ? href.substring(1) : href;
                });

                // Verificar archivos faltantes
                for (const cssFile of cssFiles) {
                    const cssPath = path.join(__dirname, cssFile);
                    if (!fs.existsSync(cssPath)) {
                        missingCSS.push(`${cssFile} (referenciado en ${htmlFile})`);
                    }
                }

                // Verificar duplicados
                const uniqueCSS = [...new Set(cssFiles)];
                if (uniqueCSS.length !== cssFiles.length) {
                    const duplicates = cssFiles.filter((item, index) => cssFiles.indexOf(item) !== index);
                    duplicateCSS.push(`${htmlFile}: ${[...new Set(duplicates)].join(', ')}`);
                }
            }

            if (missingCSS.length > 0) {
                this.log(`❌ Archivos CSS faltantes: ${missingCSS.join(', ')}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: 'CSS faltantes',
                    files: missingCSS
                });
            } else if (duplicateCSS.length > 0) {
                this.log(`⚠️ CSS duplicados encontrados: ${duplicateCSS.join('; ')}`, 'warning');
                this.resultados.pasados++; // No es crítico pero se reporta
            } else {
                this.log('✅ Todos los archivos CSS existen y no hay duplicados críticos', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de carga CSS: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testResponsiveDesign() {
        this.log('📱 Test: Diseño responsive', 'info');

        try {
            this.resultados.total++;

            const cssFiles = this.findCSSFiles(this.basePath);
            let hasResponsive = false;
            let responsiveFiles = [];

            for (const file of cssFiles) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('@media')) {
                    hasResponsive = true;
                    responsiveFiles.push(path.relative(this.basePath, file));
                }
            }

            if (hasResponsive) {
                this.log(`✅ Diseño responsive detectado en: ${responsiveFiles.join(', ')}`, 'success');
                this.resultados.pasados++;
            } else {
                this.log('⚠️ No se detectó diseño responsive (@media queries)', 'warning');
                this.resultados.pasados++; // No es crítico para funcionalidad básica
            }

        } catch (error) {
            this.log(`❌ Error en test responsive: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    testModuleConflicts() {
        this.log('🔄 Test: Conflictos entre módulos CSS', 'info');

        try {
            this.resultados.total++;

            const moduleDirs = [
                'modules/gestionbatalla',
                'modules/juegodeguerra',
                'modules/planeamiento',
                'modules/iniciarpartida',
                'common'
            ];

            const conflicts = [];

            for (const moduleDir of moduleDirs) {
                const modulePath = path.join(this.basePath, moduleDir);
                if (!fs.existsSync(modulePath)) continue;

                const cssFiles = this.findCSSFiles(modulePath);

                for (const cssFile of cssFiles) {
                    const content = fs.readFileSync(cssFile, 'utf8');

                    // Buscar selectores que podrían conflictuar
                    const globalSelectors = content.match(/\b(body|html|\*|div|span|p|h[1-6]|ul|ol|li|table|tr|td|th)\b\s*\{/g);
                    if (globalSelectors && globalSelectors.length > 5) { // Más de 5 selectores globales
                        conflicts.push(`${path.relative(this.basePath, cssFile)}: ${globalSelectors.length} selectores globales`);
                    }
                }
            }

            if (conflicts.length > 0) {
                this.log(`⚠️ Posibles conflictos entre módulos: ${conflicts.join('; ')}`, 'warning');
                this.resultados.pasados++; // Advertencia, no error crítico
            } else {
                this.log('✅ No se detectaron conflictos críticos entre módulos CSS', 'success');
                this.resultados.pasados++;
            }

        } catch (error) {
            this.log(`❌ Error en test de conflictos: ${error.message}`, 'error');
            this.resultados.fallidos++;
        }
    }

    findCSSFiles(dir) {
        const files = [];

        function scan(directory) {
            const items = fs.readdirSync(directory);

            for (const item of items) {
                const fullPath = path.join(directory, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    scan(fullPath);
                } else if (item.endsWith('.css')) {
                    files.push(fullPath);
                }
            }
        }

        scan(dir);
        return files;
    }

    getLineNumber(content, searchString) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i + 1;
            }
        }
        return 0;
    }

    reporteFinal() {
        this.log('', 'info');
        this.log('============================================================', 'info');
        this.log('📊 REPORTE FINAL - TESTS CSS Y COMPATIBILIDAD', 'info');
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
        this.log('   - Revisar conflictos de z-index identificados', 'info');
        this.log('   - Considerar reducir uso de !important', 'info');
        this.log('   - Verificar carga correcta de CSS en producción', 'info');
        this.log('   - Probar responsive design en diferentes dispositivos', 'info');

        this.log('', 'info');
        this.log('🏁 Tests de CSS y Compatibilidad Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerMAIRACSS();
    tester.ejecutar().catch(console.error);
}

module.exports = TestRunnerMAIRACSS;