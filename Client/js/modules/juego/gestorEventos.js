// gestorEventos.js

class GestorEventos {
    constructor() {
        // Mapa para almacenar todos los eventos registrados
        this.mapaEventos = new Map();
        
        // Registro de eventos disparados (para debugging)
        this.historialEventos = [];
        
        // Límite del historial de eventos
        this.limiteHistorial = 100;
        
        // Eventos del sistema
        this.eventosBase = {
            // Eventos de fase y turno
            'cambioFase': [],
            'cambioSubfase': [],
            'cambioTurno': [],
            'finTurno': [],
            
            // Eventos de jugadores
            'jugadorListo': [],
            'jugadorConectado': [],
            'jugadorDesconectado': [],
            
            // Eventos de acciones
            'accionRegistrada': [],
            'accionDeshecha': [],
            'accionCompletada': [],
            
            // Eventos de mapa
            'elementoCreado': [],
            'elementoEliminado': [],
            'elementoModificado': [],
            'elementoSeleccionado': [],
            
            // Eventos de interfaz
            'botonPresionado': [],
            'interfazActualizada': [],
            'mensajeMostrado': [],
            
            // Eventos de comunicación
            'conexionEstablecida': [],
            'conexionPerdida': [],
            'mensajeRecibido': [],
            'mensajeEnviado': [],
            
            // Eventos de estado
            'estadoActualizado': [],
            'estadoSincronizado': [],
            'errorEstado': []
        };
    }

    inicializar() {
        console.log('Inicializando GestorEventos...');
        
        // Inicializar el mapa de eventos con los eventos base
        Object.keys(this.eventosBase).forEach(tipoEvento => {
            this.mapaEventos.set(tipoEvento, new Set());
        });

        // Configurar manejo de errores global
        this.configurarManejoErrores();

        console.log('GestorEventos inicializado');
        return true;
    }

    on(tipoEvento, manejador) {
        if (!this.mapaEventos.has(tipoEvento)) {
            this.mapaEventos.set(tipoEvento, new Set());
        }

        this.mapaEventos.get(tipoEvento).add(manejador);
        console.log(`Manejador registrado para evento: ${tipoEvento}`);
    }

    off(tipoEvento, manejador) {
        if (this.mapaEventos.has(tipoEvento)) {
            this.mapaEventos.get(tipoEvento).delete(manejador);
            console.log(`Manejador eliminado para evento: ${tipoEvento}`);
        }
    }

    emitir(tipoEvento, datos = {}) {
        console.log(`Emitiendo evento: ${tipoEvento}`, datos);

        // Registrar en el historial
        this.registrarEvento(tipoEvento, datos);

        // Si el evento no existe, crear un nuevo conjunto
        if (!this.mapaEventos.has(tipoEvento)) {
            console.warn(`Tipo de evento no registrado: ${tipoEvento}`);
            this.mapaEventos.set(tipoEvento, new Set());
        }

        // Notificar a todos los manejadores
        const manejadores = this.mapaEventos.get(tipoEvento);
        manejadores.forEach(manejador => {
            try {
                manejador(datos);
            } catch (error) {
                console.error(`Error en manejador de evento ${tipoEvento}:`, error);
                this.manejarErrorEvento(error, tipoEvento, datos);
            }
        });
    }

    emitirAsincrono(tipoEvento, datos = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.emitir(tipoEvento, datos);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    registrarEvento(tipo, datos) {
        const evento = {
            tipo,
            datos,
            timestamp: new Date().toISOString()
        };

        this.historialEventos.unshift(evento);

        // Mantener el límite del historial
        if (this.historialEventos.length > this.limiteHistorial) {
            this.historialEventos.pop();
        }
    }

    obtenerHistorial(filtro = null) {
        if (!filtro) return this.historialEventos;

        return this.historialEventos.filter(evento => {
            if (typeof filtro === 'string') {
                return evento.tipo === filtro;
            }
            if (typeof filtro === 'function') {
                return filtro(evento);
            }
            return true;
        });
    }

    limpiarHistorial() {
        this.historialEventos = [];
        console.log('Historial de eventos limpiado');
    }

    configurarManejoErrores() {
        // Manejador global de errores para eventos
        window.addEventListener('unhandledrejection', (evento) => {
            console.error('Error no manejado en promesa:', evento.reason);
            this.emitir('errorSistema', {
                tipo: 'promesaNoManejada',
                error: evento.reason
            });
        });

        window.addEventListener('error', (evento) => {
            console.error('Error global:', evento.error);
            this.emitir('errorSistema', {
                tipo: 'errorGlobal',
                error: evento.error
            });
        });
    }

    manejarErrorEvento(error, tipoEvento, datos) {
        const errorInfo = {
            mensaje: error.message,
            tipoEvento,
            datos,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        // Emitir evento de error
        this.emitir('errorEvento', errorInfo);

        // Registrar en el historial
        this.registrarEvento('errorEvento', errorInfo);
    }

    // Métodos de utilidad para eventos comunes
    notificarCambioFase(fase, subfase) {
        this.emitir('cambioFase', { fase, subfase });
    }

    notificarCambioTurno(jugador, turno) {
        this.emitir('cambioTurno', { jugador, turno });
    }

    notificarAccion(accion) {
        this.emitir('accionRegistrada', accion);
    }

    notificarEstado(estado) {
        this.emitir('estadoActualizado', estado);
    }

    notificarError(error) {
        this.emitir('errorSistema', {
            mensaje: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    // Métodos para debugging
    imprimirEstadisticasEventos() {
        const estadisticas = {};
        this.mapaEventos.forEach((manejadores, tipo) => {
            estadisticas[tipo] = {
                manejadores: manejadores.size,
                vecesEmitido: this.historialEventos.filter(e => e.tipo === tipo).length
            };
        });
        console.table(estadisticas);
    }

    obtenerEventosRecientes(cantidad = 10) {
        return this.historialEventos.slice(0, cantidad);
    }

    // Método para limpiar todos los manejadores
    limpiarEventos() {
        this.mapaEventos.clear();
        Object.keys(this.eventosBase).forEach(tipoEvento => {
            this.mapaEventos.set(tipoEvento, new Set());
        });
        console.log('Todos los manejadores de eventos han sido eliminados');
    }

    destruir() {
        // Limpiar todos los manejadores
        this.limpiarEventos();
        
        // Limpiar historial
        this.limpiarHistorial();
        
        // Eliminar referencias
        this.mapaEventos = null;
        this.historialEventos = null;
        
        console.log('GestorEventos destruido');
    }
}

// Exportar la clase
window.GestorEventos = GestorEventos;