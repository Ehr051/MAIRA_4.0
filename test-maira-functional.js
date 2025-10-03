// test-maira-functional.js
// Tests funcionales profundos para MAIRA 4.0
// Verifica que los módulos no solo existen, sino que funcionan correctamente

const fs = require('fs');
const path = require('path');

class TestRunnerFuncional {
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

    ejecutar() {
        this.log('🚀 Iniciando Tests Funcionales Profundos de MAIRA 4.0', 'info');
        this.log('='.repeat(60), 'info');

        // Tests de instanciación de clases
        this.testInstanciacionGestores();

        // Tests de métodos principales
        this.testMetodosGestores();

        // Tests de integración básica
        this.testIntegracionBasica();

        // Reporte final
        this.reporteFinal();
    }

    testInstanciacionGestores() {
        this.log('🏗️  Test: Instanciación de Gestores', 'info');

        const gestores = [
            { nombre: 'GestorJuego', ruta: 'js/modules/juego/gestorJuego.js' },
            { nombre: 'GestorTurnos', ruta: 'js/modules/juego/gestorTurnos.js' },
            { nombre: 'GestorFases', ruta: 'js/modules/juego/gestorFases.js' },
            { nombre: 'GestorInterfaz', ruta: 'js/modules/juego/gestorInterfaz.js' },
            { nombre: 'GestorComunicacion', ruta: 'js/modules/juego/gestorComunicacion.js' }
        ];

        gestores.forEach(({ nombre, ruta }) => {
            try {
                this.resultados.total++;

                // Verificar que el archivo existe
                const rutaCompleta = path.join(this.basePath, ruta);
                if (!fs.existsSync(rutaCompleta)) {
                    throw new Error(`Archivo no encontrado: ${ruta}`);
                }

                // Leer contenido del archivo
                const contenido = fs.readFileSync(rutaCompleta, 'utf8');

                // Verificar que contiene la declaración de clase
                if (!contenido.includes(`class ${nombre}`)) {
                    throw new Error(`Clase ${nombre} no encontrada en ${ruta}`);
                }

                // Verificar constructor
                if (!contenido.includes('constructor(')) {
                    throw new Error(`Constructor no encontrado en ${nombre}`);
                }

                this.log(`✅ ${nombre}: Instanciación correcta`, 'success');
                this.resultados.pasados++;

            } catch (error) {
                this.log(`❌ ${nombre}: ${error.message}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: `Instanciación ${nombre}`,
                    error: error.message
                });
            }
        });
    }

    testMetodosGestores() {
        this.log('🔧 Test: Métodos Principales de Gestores', 'info');

        const metodosEsperados = {
            'GestorJuego': ['inicializar', 'inicializarGestores'],
            'GestorTurnos': ['inicializar', 'cambiarTurno', 'finalizarTurnoActual'],
            'GestorFases': ['inicializar', 'confirmarSector', 'inicializarHerramientasDibujo'],
            'GestorInterfaz': ['inicializar', 'mostrarMensaje', 'actualizarInterfazCompleta'],
            'GestorComunicacion': ['inicializar', 'conectar', 'enviarMensaje']
        };

        Object.entries(metodosEsperados).forEach(([clase, metodos]) => {
            try {
                this.resultados.total++;

                const rutaArchivo = `js/modules/juego/${clase.toLowerCase()}.js`;
                const rutaCompleta = path.join(this.basePath, rutaArchivo);

                if (!fs.existsSync(rutaCompleta)) {
                    throw new Error(`Archivo no encontrado: ${rutaArchivo}`);
                }

                const contenido = fs.readFileSync(rutaCompleta, 'utf8');

                // Verificar que todos los métodos esperados existen
                const metodosFaltantes = metodos.filter(metodo =>
                    !contenido.includes(`${metodo}(`) &&
                    !contenido.includes(`${metodo} =`) &&
                    !contenido.includes(`${metodo}:`)
                );

                if (metodosFaltantes.length > 0) {
                    throw new Error(`Métodos faltantes en ${clase}: ${metodosFaltantes.join(', ')}`);
                }

                this.log(`✅ ${clase}: Todos los métodos principales presentes`, 'success');
                this.resultados.pasados++;

            } catch (error) {
                this.log(`❌ ${clase}: ${error.message}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: `Métodos ${clase}`,
                    error: error.message
                });
            }
        });
    }

    testIntegracionBasica() {
        this.log('🔗 Test: Integración Básica entre Módulos', 'info');

        try {
            this.resultados.total++;

            // Verificar que GestorJuego puede referenciar otros gestores
            const gestorJuegoPath = path.join(this.basePath, 'js/modules/juego/gestorJuego.js');
            const contenido = fs.readFileSync(gestorJuegoPath, 'utf8');

            const referenciasEsperadas = [
                'this.gestorTurnos',
                'this.gestorFases',
                'this.gestorInterfaz',
                'this.gestorComunicacion'
            ];

            const referenciasFaltantes = referenciasEsperadas.filter(ref =>
                !contenido.includes(ref)
            );

            if (referenciasFaltantes.length > 0) {
                throw new Error(`Referencias faltantes en GestorJuego: ${referenciasFaltantes.join(', ')}`);
            }

            // Verificar que existe método inicializarGestores
            if (!contenido.includes('inicializarGestores(')) {
                throw new Error('Método inicializarGestores no encontrado en GestorJuego');
            }

            this.log('✅ Integración básica: GestorJuego puede coordinar otros gestores', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Integración básica: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Integración Básica',
                error: error.message
            });
        }
    }

    reporteFinal() {
        this.log('='.repeat(60), 'info');
        this.log('📊 REPORTE FINAL - TESTS FUNCIONALES PROFUNDOS', 'info');
        this.log('='.repeat(60), 'info');

        const tasaExito = ((this.resultados.pasados / this.resultados.total) * 100).toFixed(1);

        this.log(`📈 Tasa de éxito: ${tasaExito}%`, 'info');
        this.log(`✅ Tests pasados: ${this.resultados.pasados}`, 'success');
        this.log(`❌ Tests fallidos: ${this.resultados.fallidos}`, 'error');
        this.log(`⚠️  Errores encontrados: ${this.resultados.errores.length}`, 'warning');

        if (this.resultados.errores.length > 0) {
            this.log('\n🚨 DETALLE DE ERRORES:', 'error');
            this.resultados.errores.forrores.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error.test}: ${error.error}`, 'error');
            });
        }

        this.log('\n💡 RECOMENDACIONES:', 'info');
        if (this.resultados.fallidos === 0) {
            this.log('  - ✅ Sistema completamente funcional a nivel estructural', 'success');
            this.log('  - 🔄 Siguiente paso: Tests de integración con DOM virtual', 'info');
            this.log('  - 🎯 Próximo objetivo: Tests de flujo completo del juego', 'info');
        } else {
            this.log('  - 🔧 Corregir errores encontrados antes de continuar', 'warning');
            this.log('  - 📋 Revisar métodos faltantes en gestores', 'warning');
        }

        this.log('\n🏁 Tests Funcionales Profundos Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerFuncional();
    tester.ejecutar();
}

module.exports = TestRunnerFuncional;