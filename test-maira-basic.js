#!/usr/bin/env node

/**
 * @fileoverview Script de testing básico para MAIRA 4.0
 * @description Ejecuta tests básicos de sintaxis y dependencias
 */

const fs = require('fs');
const path = require('path');

class MAIRABasicTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: []
        };
        this.baseDir = path.resolve(__dirname);
        console.log('Directorio base:', this.baseDir);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
    }

    async checkFileExists(filePath, description = '') {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            if (fs.existsSync(fullPath)) {
                this.log(`✅ Archivo encontrado: ${filePath} ${description}`);
                this.results.passed++;
                return true;
            } else {
                this.log(`❌ Archivo no encontrado: ${filePath} ${description}`, 'error');
                this.results.failed++;
                this.results.errors.push({
                    test: 'file_exists',
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

    async checkSyntax(filePath) {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            if (!fs.existsSync(fullPath)) {
                this.log(`⚠️  Archivo no existe para verificación de sintaxis: ${filePath}`, 'warning');
                this.results.warnings++;
                return false;
            }

            const content = fs.readFileSync(fullPath, 'utf8');

            // Verificación básica de sintaxis JavaScript
            if (filePath.endsWith('.js')) {
                // Contar llaves balanceadas
                const openBraces = (content.match(/\{/g) || []).length;
                const closeBraces = (content.match(/\}/g) || []).length;

                if (openBraces !== closeBraces) {
                    this.log(`❌ Sintaxis incorrecta en ${filePath}: llaves desbalanceadas (${openBraces} abiertas, ${closeBraces} cerradas)`, 'error');
                    this.results.failed++;
                    this.results.errors.push({
                        test: 'syntax',
                        file: filePath,
                        error: `Llaves desbalanceadas: ${openBraces} != ${closeBraces}`
                    });
                    return false;
                }

                // Verificar funciones incompletas
                const functionMatches = content.match(/function\s+\w+\s*\([^)]*$/gm);
                if (functionMatches && functionMatches.length > 0) {
                    this.log(`❌ Función incompleta en ${filePath}`, 'error');
                    this.results.failed++;
                    return false;
                }

                this.log(`✅ Sintaxis correcta en ${filePath}`);
                this.results.passed++;
                return true;
            }

            return true;
        } catch (error) {
            this.log(`❌ Error verificando sintaxis de ${filePath}: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    async checkDuplicateFunctions(filePath) {
        try {
            const fullPath = path.join(this.baseDir, filePath);
            if (!fs.existsSync(fullPath)) {
                return false;
            }

            const content = fs.readFileSync(fullPath, 'utf8');

            // Buscar funciones duplicadas
            const functionRegex = /function\s+(\w+)\s*\(/g;
            const functions = [];
            let match;

            while ((match = functionRegex.exec(content)) !== null) {
                functions.push(match[1]);
            }

            const duplicates = functions.filter((func, index) => functions.indexOf(func) !== index);
            const uniqueDuplicates = [...new Set(duplicates)];

            if (uniqueDuplicates.length > 0) {
                this.log(`❌ Funciones duplicadas en ${filePath}: ${uniqueDuplicates.join(', ')}`, 'error');
                this.results.failed++;
                this.results.errors.push({
                    test: 'duplicate_functions',
                    file: filePath,
                    error: `Funciones duplicadas: ${uniqueDuplicates.join(', ')}`
                });
                return false;
            }

            this.log(`✅ No hay funciones duplicadas en ${filePath}`);
            this.results.passed++;
            return true;
        } catch (error) {
            this.log(`❌ Error verificando funciones duplicadas en ${filePath}: ${error.message}`, 'error');
            this.results.failed++;
            return false;
        }
    }

    async runBasicTests() {
        this.log('🚀 Iniciando tests básicos de MAIRA 4.0');

        // Lista de archivos críticos a verificar
        const criticalFiles = [
            'Client/js/modules/partidas/iniciarpartida.js',
            'Client/js/services/elevationProfileService.js',
            'Client/js/Test/maira-testing-framework.js'
        ];

        // Verificar existencia de archivos
        this.log('📁 Verificando archivos críticos...');
        for (const file of criticalFiles) {
            await this.checkFileExists(file, '(archivo crítico)');
        }

        // Verificar sintaxis
        this.log('🔍 Verificando sintaxis JavaScript...');
        for (const file of criticalFiles) {
            if (file.endsWith('.js')) {
                await this.checkSyntax(file);
            }
        }

        // Verificar funciones duplicadas
        this.log('🔄 Verificando funciones duplicadas...');
        for (const file of criticalFiles) {
            if (file.endsWith('.js')) {
                await this.checkDuplicateFunctions(file);
            }
        }

        // Mostrar resumen
        this.showSummary();
    }

    showSummary() {
        this.log('📊 RESUMEN DE TESTS BÁSICOS');
        this.log(`✅ Pasados: ${this.results.passed}`);
        this.log(`❌ Fallidos: ${this.results.failed}`);
        this.log(`⚠️  Advertencias: ${this.results.warnings}`);

        if (this.results.errors.length > 0) {
            this.log('🔍 DETALLE DE ERRORES:');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.test} en ${error.file}: ${error.error}`, 'error');
            });
        }

        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
        this.log(`📈 Tasa de éxito: ${successRate}%`);
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new MAIRABasicTester();
    tester.runBasicTests().catch(console.error);
}

module.exports = MAIRABasicTester;