// test-maira-flujo-completo.js
// Tests de flujo completo del juego MAIRA 4.0
// Simula escenarios completos de juego usando DOM virtual

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Configurar JSDOM para simular el navegador
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>MAIRA Test</title>
</head>
<body>
    <div id="map"></div>
    <div id="sistemaPanelesContainer">
        <div class="mensajes-sistema"></div>
        <div class="panel-estado"></div>
    </div>
    <div id="panel-fases"></div>
    <div id="btn-confirmar-sector"></div>
    <div id="panel-inferior"></div>
</body>
</html>
`, {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Variables globales que usan los gestores
global.userId = 'jugador1';
global.equipoJugador = 'azul';
global.DEBUG_MODE = false;
global.SERVER_URL = 'http://localhost:5000';

// Mock de EventEmitter
global.EventEmitter = class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(...args));
        }
    }
};

// Mock de Socket.IO
global.io = function() {
    return {
        on: function() {},
        emit: function() {},
        connect: function() { return this; },
        disconnect: function() {}
    };
};

class TestRunnerFlujoCompleto {
    constructor() {
        this.resultados = {
            total: 0,
            pasados: 0,
            fallidos: 0,
            errores: []
        };
        this.basePath = path.join(__dirname, 'Client');
        this.gestores = {};
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
        this.log('🎮 Iniciando Tests de Flujo Completo del Juego', 'info');
        this.log('='.repeat(60), 'info');

        // Cargar gestores en el DOM virtual
        this.cargarGestores();

        // Test de inicialización completa
        await this.testInicializacionCompleta();

        // Test de flujo de preparación
        this.testFlujoPreparacion();

        // Test de cambio de turnos
        this.testCambioTurnos();

        // Test de cambio de fases
        this.testCambioFases();

        // Reporte final
        this.reporteFinal();
    }

    cargarGestores() {
        this.log('📦 Cargando gestores en DOM virtual...', 'info');

        try {
            // Cargar GestorBase primero
            const gestorBasePath = path.join(this.basePath, 'js/modules/juego/gestorBase.js');
            const gestorBaseCode = fs.readFileSync(gestorBasePath, 'utf8');
            eval(gestorBaseCode);

            // Cargar gestores principales
            const gestores = [
                'gestorJuego',
                'gestorTurnos',
                'gestorFases',
                'gestorInterfaz',
                'gestorComunicacion'
            ];

            gestores.forEach(nombre => {
                const ruta = path.join(this.basePath, `js/modules/juego/${nombre}.js`);
                if (fs.existsSync(ruta)) {
                    const code = fs.readFileSync(ruta, 'utf8');
                    eval(code);
                    this.log(`✅ ${nombre} cargado`, 'success');
                }
            });

        } catch (error) {
            this.log(`❌ Error cargando gestores: ${error.message}`, 'error');
        }
    }

    async testInicializacionCompleta() {
        this.log('🚀 Test: Inicialización Completa del Juego', 'info');

        try {
            this.resultados.total++;

            // Configuración de prueba
            const configPrueba = {
                modoJuego: 'local',
                duracionTurno: 300,
                jugadores: [
                    { id: 'jugador1', nombre: 'Jugador Azul', equipo: 'azul' },
                    { id: 'jugador2', nombre: 'Jugador Rojo', equipo: 'rojo' }
                ],
                centro: [-34.9964963, -64.9672817],
                zoom: 4
            };

            // Inicializar GestorJuego
            if (typeof window.GestorJuego !== 'undefined') {
                this.gestores.juego = new window.GestorJuego();

                // Mock del método gestorCarga
                this.gestores.juego.gestorCarga = {
                    inicializar: () => Promise.resolve(),
                    mostrar: () => {},
                    ocultar: () => {}
                };

                // Inicializar el juego
                await this.gestores.juego.inicializar(configPrueba);

                // Verificar que se inicializaron los gestores
                if (!this.gestores.juego.gestorTurnos) {
                    throw new Error('gestorTurnos no se inicializó');
                }
                if (!this.gestores.juego.gestorFases) {
                    throw new Error('gestorFases no se inicializó');
                }
                if (!this.gestores.juego.gestorInterfaz) {
                    throw new Error('gestorInterfaz no se inicializó');
                }

                this.log('✅ Inicialización completa: Todos los gestores inicializados', 'success');
                this.resultados.pasados++;
            } else {
                throw new Error('GestorJuego no está disponible');
            }

        } catch (error) {
            this.log(`❌ Inicialización completa: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Inicialización Completa',
                error: error.message
            });
        }
    }

    testFlujoPreparacion() {
        this.log('🎯 Test: Flujo de Preparación', 'info');

        try {
            this.resultados.total++;

            if (!this.gestores.juego) {
                throw new Error('Juego no inicializado');
            }

            // Verificar estado inicial
            const estado = this.gestores.juego.estado;
            if (estado.fase !== 'preparacion') {
                throw new Error(`Fase inicial incorrecta: ${estado.fase}`);
            }
            if (estado.subfase !== 'definicion_sector') {
                throw new Error(`Subfase inicial incorrecta: ${estado.subfase}`);
            }

            // Verificar que gestorTurnos tiene jugadores
            if (!this.gestores.juego.gestorTurnos.jugadores ||
                this.gestores.juego.gestorTurnos.jugadores.length !== 2) {
                throw new Error('Jugadores no inicializados correctamente');
            }

            this.log('✅ Flujo de preparación: Estado inicial correcto', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Flujo de preparación: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Flujo de Preparación',
                error: error.message
            });
        }
    }

    testCambioTurnos() {
        this.log('🔄 Test: Cambio de Turnos', 'info');

        try {
            this.resultados.total++;

            if (!this.gestores.juego || !this.gestores.juego.gestorTurnos) {
                throw new Error('Gestores no inicializados');
            }

            const gestorTurnos = this.gestores.juego.gestorTurnos;

            // Estado inicial
            const turnoInicial = gestorTurnos.turnoActual;
            const jugadorInicial = gestorTurnos.jugadorActualIndex;

            // Simular cambio de turno
            gestorTurnos.cambiarTurno();

            // Verificar que cambió
            if (gestorTurnos.turnoActual === turnoInicial &&
                gestorTurnos.jugadorActualIndex === jugadorInicial) {
                throw new Error('El turno no cambió');
            }

            this.log('✅ Cambio de turnos: Turno avanzó correctamente', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Cambio de turnos: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Cambio de Turnos',
                error: error.message
            });
        }
    }

    testCambioFases() {
        this.log('📊 Test: Cambio de Fases', 'info');

        try {
            this.resultados.total++;

            if (!this.gestores.juego || !this.gestores.juego.gestorFases) {
                throw new Error('Gestores no inicializados');
            }

            const gestorFases = this.gestores.juego.gestorFases;

            // Verificar fase inicial
            if (gestorFases.fase !== 'preparacion') {
                throw new Error(`Fase inicial incorrecta: ${gestorFases.fase}`);
            }

            // Simular confirmación de sector (cambio a definición de zonas)
            if (typeof gestorFases.confirmarSector === 'function') {
                gestorFases.confirmarSector();
            }

            // Verificar que cambió la subfase
            if (gestorFases.subfase === 'definicion_sector') {
                throw new Error('La subfase no cambió después de confirmar sector');
            }

            this.log('✅ Cambio de fases: Fase avanzó correctamente', 'success');
            this.resultados.pasados++;

        } catch (error) {
            this.log(`❌ Cambio de fases: ${error.message}`, 'error');
            this.resultados.fallidos++;
            this.resultados.errores.push({
                test: 'Cambio de Fases',
                error: error.message
            });
        }
    }

    reporteFinal() {
        this.log('='.repeat(60), 'info');
        this.log('📊 REPORTE FINAL - TESTS DE FLUJO COMPLETO', 'info');
        this.log('='.repeat(60), 'info');

        const tasaExito = this.resultados.total > 0 ?
            ((this.resultados.pasados / this.resultados.total) * 100).toFixed(1) : '0.0';

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
            this.log('  - ✅ Flujo completo del juego funcionando perfectamente', 'success');
            this.log('  - 🔄 Siguiente paso: Tests de Socket.IO con servidor mock', 'info');
            this.log('  - 🎯 Sistema listo para pruebas de usuario final', 'info');
            this.log('  - 🌐 Cobertura de testing completa: Estructural → Integración → Funcional', 'info');
        } else {
            this.log('  - 🔧 Revisar inicialización de gestores en entorno de prueba', 'warning');
            this.log('  - 📋 Verificar dependencias de DOM en tests', 'warning');
            this.log('  - 🐛 Posibles problemas con mocks de JSDOM', 'warning');
        }

        this.log('\n🏁 Tests de Flujo Completo Completados', 'info');
    }
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
    const tester = new TestRunnerFlujoCompleto();
    tester.ejecutar().catch(error => {
        console.error('Error ejecutando tests:', error);
    });
}

module.exports = TestRunnerFlujoCompleto;