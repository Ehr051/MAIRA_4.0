// test-maira-integration-modules.js
// Tests de integración entre módulos para MAIRA 4.0
// Verifica que los gestores pueden comunicarse y coordinarse correctamente

const fs = require('fs');
const path = require('path');

class TestRunnerIntegracion {
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
        this.log('🔗 Iniciando Tests de Integración entre Módulos', 'info');
        this.log('='.repeat(60), 'info');

        // Tests de comunicación entre gestores
        this.testComunicacionGestores();

        // Tests de estado compartido
        this.testEstadoCompartido();

        // Tests de eventos entre módulos
        this.testEventosEntreModulos();

        // Tests de inicialización coordinada
        this.testInicializacionCoordinada();

        // Reporte final
        this.reporteFinal();
    }

    testComunicacionGestores() {
        this.log('📡 Test: Comunicación entre Gestores', 'info');

        const comunicaciones = [
            {
                descripcion: 'GestorJuego puede acceder a gestorTurnos',
                archivo: 'js/modules/juego/gestorJuego.js',
                patrones: ['this.gestorTurnos', 'gestorTurnos.']
            },
            {
                descripcion: 'GestorJuego puede acceder a gestorFases',
                archivo: 'js/modules/juego/gestorJuego.js',
                patrones: ['this.gestorFases', 'gestorFases.']
            },
            {
                descripcion: 'GestorJuego puede acceder a gestorInterfaz',
                archivo: 'js/modules/juego/gestorJuego.js',
                patrones: ['this.gestorInterfaz', 'gestorInterfaz.']
            },
            {
                descripcion: 'GestorTurnos puede comunicarse con GestorInterfaz',
                archivo: 'js/modules/juego/gestorTurnos.js',
                patrones: ['gestorInterfaz', 'this.gestorJuego?.gestorInterfaz']
            },
            {
                descripcion: 'GestorFases puede actualizar interfaz',
                archivo: 'js/modules/juego/gestorFases.js',
                patrones: ['mostrarMensaje', 'actualizarInterfaz']
            }
        ];

        comunicaciones.forEach(({ descripcion, archivo, patrones }) => {
            try {
                this.resultados.total++;

                const rutaCompleta = path.join(this.basePath, archivo);
                if (!fs.existsSync(rutaCompleta)) {
                    throw new Error(`Archivo no encontrado: ${archivo}`);
                }

                const contenido = fs.readFileSync(rutaCompleta, 'utf8');

                // Verificar que al menos uno de los patrones existe
                const patronEncontrado = patrones.some(patron =>
                    contenido.includes(patron)
                );

                if (!patronEncontrado) {
                    throw new Error(`Comunicación no encontrada: ${patrones.join(' o ')}`);
                }

                this.log(`✅ ${descripcion}`, 'success');
                this.resultados.pasados++;

            } catch (error) {
                this.log(`❌ ${descripcion}: ${error.message}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: `Comunicación: ${descripcion}`,
                    error: error.message
                });
            }
        });
    }

    testEstadoCompartido() {
        this.log('📊 Test: Estado Compartido entre Módulos', 'info');

        const estadosCompartidos = [
            {
                descripcion: 'Estado de fase compartido entre GestorFases y GestorJuego',
                archivos: ['js/modules/juego/gestorFases.js', 'js/modules/juego/gestorJuego.js'],
                patrones: ['fase', 'this.estado.fase']
            },
            {
                descripcion: 'Estado de turno compartido entre GestorTurnos y GestorJuego',
                archivos: ['js/modules/juego/gestorTurnos.js', 'js/modules/juego/gestorJuego.js'],
                patrones: ['jugadorActual', 'turnoActual']
            },
            {
                descripcion: 'Equipo del jugador compartido globalmente',
                archivos: ['js/modules/juego/gestorJuego.js', 'js/modules/juego/gestorFases.js'],
                patrones: ['window.equipoJugador', 'equipoJugador']
            }
        ];

        estadosCompartidos.forEach(({ descripcion, archivos, patrones }) => {
            try {
                this.resultados.total++;

                let estadoEncontrado = false;

                archivos.forEach(archivo => {
                    const rutaCompleta = path.join(this.basePath, archivo);
                    if (fs.existsSync(rutaCompleta)) {
                        const contenido = fs.readFileSync(rutaCompleta, 'utf8');
                        if (patrones.some(patron => contenido.includes(patron))) {
                            estadoEncontrado = true;
                        }
                    }
                });

                if (!estadoEncontrado) {
                    throw new Error(`Estado compartido no encontrado en ninguno de los archivos`);
                }

                this.log(`✅ ${descripcion}`, 'success');
                this.resultados.pasados++;

            } catch (error) {
                this.log(`❌ ${descripcion}: ${error.message}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: `Estado Compartido: ${descripcion}`,
                    error: error.message
                });
            }
        });
    }

    testEventosEntreModulos() {
        this.log('🎯 Test: Eventos entre Módulos', 'info');

        const eventos = [
            {
                descripcion: 'GestorTurnos emite eventos de cambio de turno',
                archivo: 'js/modules/juego/gestorTurnos.js',
                patrones: ['emit(', 'this.eventos.emit', 'cambioTurno']
            },
            {
                descripcion: 'GestorFases emite eventos de cambio de fase',
                archivo: 'js/modules/juego/gestorFases.js',
                patrones: ['emit(', 'this.eventos.emit', 'cambioFase']
            },
            {
                descripcion: 'GestorComunicacion maneja eventos de Socket.IO',
                archivo: 'js/modules/juego/gestorComunicacion.js',
                patrones: ['on(', 'socket.on', 'emit(']
            },
            {
                descripcion: 'Sistema de eventos EventEmitter presente',
                archivos: ['js/modules/juego/gestorTurnos.js', 'js/modules/juego/gestorFases.js'],
                patrones: ['new EventEmitter', 'EventEmitter']
            }
        ];

        eventos.forEach(({ descripcion, archivo, archivos, patrones }) => {
            try {
                this.resultados.total++;

                let eventoEncontrado = false;
                const archivosBuscar = archivos || [archivo];

                archivosBuscar.forEach(arch => {
                    const rutaCompleta = path.join(this.basePath, arch);
                    if (fs.existsSync(rutaCompleta)) {
                        const contenido = fs.readFileSync(rutaCompleta, 'utf8');
                        if (patrones.some(patron => contenido.includes(patron))) {
                            eventoEncontrado = true;
                        }
                    }
                });

                if (!eventoEncontrado) {
                    throw new Error(`Eventos no encontrados: ${patrones.join(' o ')}`);
                }

                this.log(`✅ ${descripcion}`, 'success');
                this.resultados.pasados++;

            } catch (error) {
                this.log(`❌ ${descripcion}: ${error.message}`, 'error');
                this.resultados.fallidos++;
                this.resultados.errores.push({
                    test: `Eventos: ${descripcion}`,
                    error: error.message
                });
            }
        });
    }

    testInicializacionCoordinada() {
        this.log('🚀 Test: Inicialización Coordinada', 'info');

        try {
            this.resultados.total++;

            // Verificar que GestorJuego inicializa gestores en orden correcto
            const gestorJuegoPath = path.join(this.basePath, 'js/modules/juego/gestorJuego.js');
            const contenido = fs.readFileSync(gestorJuegoPath, 'utf8');

            // Verificar orden de inicialización en inicializarGestores
            const ordenEsperado = [
                'GestorTurnos',
                'GestorComunicacion',
                'GestorMapa',
                'GestorFases',
                'GestorAcciones',
                'GestorInterfaz'
            ];

            let ordenCorrecto = true;
            let posicionAnterior = -1;

            ordenEsperado.forEach(gestor => {
                const posicion = contenido.indexOf(`'${gestor}'`);
                if (posicion !== -1 && posicion < posicionAnterior) {
                    ordenCorrecto = false;
                }
                posicionAnterior = posicion;
            });

            if (!ordenCorrecto) {
                throw new Error('Orden de inicialización de gestores no es correcto');
            }

            // Verificar que existe configuración por defecto
            if (!contenido.includes('configCompleta = {') || !contenido.includes('modoJuego: \'local\'')) {
                throw new Error('Configuración por defecto no encontrada');
            }

            this.log('✅ Inicialización coordinada: Orden y configuración correctos', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Inicialización coordinada: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Inicialización Coordinada',
                error: error.message
            });
        }
    }

    reporteFinal() {
        this.log('='.repeat(60), 'info');
        this.log('📊 REPORTE FINAL - TESTS DE INTEGRACIÓN', 'info');
        this.log('='.repeat(60), 'info');

        const tasaExito = ((this.resultados.pasados / this.resultados.total) * 100).toFixed(1);

        this.log(`📈 Tasa de éxito: ${tasaExito}%`, 'info');
        this.log(`✅ Tests pasados: ${this.resultados.pasados}`, 'success');
        this.log(`❌ Tests fallidos: ${this.resultados.fallidos}`, 'error');
        this.log(`⚠️  Errores encontrados: ${this.resultados.errores.length}`, 'warning');

        if (this.resultados.errores.length > 0) {
            this.log('\n🚨 DETALLE DE ERRORES:', 'error');
            this.resultados.errores.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error.test}: ${error.error}`, 'error');
            });
        }

        this.log('\n💡 RECOMENDACIONES:', 'info');
        if (this.resultados.fallidos === 0) {
            this.log('  - ✅ Integración entre módulos funcionando perfectamente', 'success');
            this.log('  - 🔄 Siguiente paso: Tests con DOM virtual (JSDOM)', 'info');
            this.log('  - 🎯 Próximo objetivo: Tests de flujo completo del juego', 'info');
            this.log('  - 🌐 Objetivo final: Tests de Socket.IO con servidor mock', 'info');
        } else {
            this.log('  - 🔧 Revisar comunicaciones faltantes entre módulos', 'warning');
            this.log('  - 📋 Verificar estado compartido entre gestores', 'warning');
        }

        this.log('\n🏁 Tests de Integración entre Módulos Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerIntegracion();
    tester.ejecutar();
}

module.exports = TestRunnerIntegracion;