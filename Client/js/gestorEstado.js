class GestorEstado extends GestorBase {
    constructor() {
        super();
        // Estado inicial del juego
        this.estado = {
            // Estado general
            modo: 'local',
            fase: 'preparacion',
            subfase: 'definicion_sector',
            inicializado: false,
            timestamp: null,
            
            // Información de partida
            partidaId: null,
            codigoPartida: null,
            
            // Jugadores y turnos
            jugadores: [],
            jugadorActual: null,
            turnoActual: 1,
            tiempoRestante: 0,
            
            // Director
            director: null,
            directorTemporal: null,
            
            // Elementos del juego
            sector: null,
            zonasDespliegue: {
                azul: null,
                rojo: null
            },
            
            // Unidades y elementos
            unidades: new Map(),
            elementos: new Map(),
            
            // Estado de la interfaz
            interfaz: {
                menuActivo: null,
                elementoSeleccionado: null,
                herramientaActiva: null
            }
        };

        // Historial de cambios para deshacer/rehacer
        this.historial = [];
        this.posicionHistorial = -1;
        this.maxHistorial = 50;

        // Configuración de autoguardado
        this.autoGuardadoIntervalo = null;
        this.tiempoAutoGuardado = 30000; // 30 segundos
    }

    async inicializar(configuracion) {
        console.log('Inicializando GestorEstado...');
        
        try {
            // Cargar estado inicial o recuperar estado guardado
            await this.cargarEstadoInicial(configuracion);

            // Configurar eventos y autoguardado
            this.configurarEventos();
            this.iniciarAutoGuardado();
            this.configurarRecuperacion();

            // Marcar como inicializado
            this.estado.inicializado = true;
            this.estado.timestamp = new Date().toISOString();

            console.log('GestorEstado inicializado correctamente');
            return true;
        } catch (error) {
            console.error('Error al inicializar GestorEstado:', error);
            throw error;
        }
    }

    async cargarEstadoInicial(configuracion) {
        // Intentar recuperar estado guardado primero
        const estadoRecuperado = await this.recuperarEstado();
        
        if (estadoRecuperado) {
            console.log('Estado recuperado:', estadoRecuperado);
            await this.aplicarEstadoRecuperado(estadoRecuperado);
        } else {
            // Si no hay estado guardado, establecer estado inicial
            this.validarConfiguracion(configuracion);
            this.establecerEstadoInicial(configuracion);
        }
    }

    validarConfiguracion(config) {
        const camposRequeridos = ['modo', 'jugadores'];
        const faltantes = camposRequeridos.filter(campo => !config[campo]);
        
        if (faltantes.length > 0) {
            throw new Error(`Configuración incompleta. Faltan: ${faltantes.join(', ')}`);
        }
    }

    establecerEstadoInicial(config) {
        // Estado básico
        this.estado.modo = config.modo;
        this.estado.partidaId = config.partidaId;
        this.estado.codigoPartida = config.codigoPartida;

        // Configurar jugadores
        this.estado.jugadores = config.jugadores.map(jugador => ({
            ...jugador,
            listo: false,
            conectado: true,
            turnosCompletados: 0
        }));

        // Establecer director
        this.establecerDirector();

        // Guardar el estado inicial en el historial
        this.guardarEnHistorial('estadoInicial');
    }

    configurarEventos() {
        // Eventos de fase y turno
        this.emisorEventos.on('cambioFase', (datos) => {
            this.actualizarFase(datos);
            this.guardarEstado(); // Guardar después de cambios importantes
        });

        this.emisorEventos.on('cambioTurno', (datos) => {
            this.actualizarTurno(datos);
            this.guardarEstado();
        });

        // Eventos de jugadores
        this.emisorEventos.on('jugadorConectado', (datos) => {
            this.actualizarEstadoJugador(datos.jugadorId, { conectado: true });
        });

        this.emisorEventos.on('jugadorDesconectado', (datos) => {
            this.actualizarEstadoJugador(datos.jugadorId, { conectado: false });
        });

        // Eventos de elementos
        this.emisorEventos.on('elementoCreado', (datos) => {
            this.agregarElemento(datos);
            this.guardarEstado();
        });

        this.emisorEventos.on('elementoEliminado', (datos) => {
            this.eliminarElemento(datos.id);
            this.guardarEstado();
        });
    }

    iniciarAutoGuardado() {
        if (this.autoGuardadoIntervalo) {
            clearInterval(this.autoGuardadoIntervalo);
        }

        this.autoGuardadoIntervalo = setInterval(() => {
            this.guardarEstado();
        }, this.tiempoAutoGuardado);
    }

    configurarRecuperacion() {
        // Guardar estado antes de cerrar/recargar
        window.addEventListener('beforeunload', () => {
            this.guardarEstado();
        });

        // Configurar recuperación en reconexión
        if (this.gestorJuego?.gestorComunicacion?.socket) {
            this.gestorJuego.gestorComunicacion.socket.on('reconnect', async () => {
                console.log('Reconectado, recuperando estado...');
                await this.recuperarEstado();
            });
        }
    }

    async recuperarEstado() {
        try {
            // 1. Intentar obtener del servidor
            const estadoServidor = await this.obtenerEstadoServidor();
            if (estadoServidor) return estadoServidor;

            // 2. Intentar obtener de localStorage
            const estadoLocal = this.obtenerEstadoLocal();
            if (estadoLocal) return estadoLocal;

            return null;
        } catch (error) {
            console.error('Error recuperando estado:', error);
            return null;
        }
    }

    obtenerEstadoLocal() {
        try {
            const key = `partida_${this.estado.codigoPartida}`;
            const estadoGuardado = localStorage.getItem(key);
            if (estadoGuardado) {
                return JSON.parse(estadoGuardado);
            }
            return null;
        } catch (error) {
            console.error('Error obteniendo estado local:', error);
            return null;
        }
    }

    async obtenerEstadoServidor() {
        return new Promise((resolve) => {
            const socket = this.gestorJuego?.gestorComunicacion?.socket;
            if (!socket?.connected) {
                return resolve(null);
            }

            const timeout = setTimeout(() => resolve(null), 5000);

            socket.emit('solicitarEstado', {
                codigoPartida: this.estado.codigoPartida,
                userId: window.userId
            });

            socket.once('estadoActual', (estado) => {
                clearTimeout(timeout);
                resolve(estado);
            });
        });
    }

    async guardarEstado() {
        console.log('Guardando estado...');

        const estadoGuardado = {
            ...this.obtenerEstadoActual(),
            timestamp: new Date().toISOString()
        };

        try {
            // Guardar en localStorage
            const key = `partida_${this.estado.codigoPartida}`;
            localStorage.setItem(key, JSON.stringify(estadoGuardado));

            // Guardar en servidor
            if (this.gestorJuego?.gestorComunicacion?.socket?.connected) {
                this.gestorJuego.gestorComunicacion.socket.emit('guardarEstado', {
                    codigoPartida: this.estado.codigoPartida,
                    estado: estadoGuardado
                });
            }

            console.log('Estado guardado correctamente');
            return true;
        } catch (error) {
            console.error('Error guardando estado:', error);
            return false;
        }
    }

    async aplicarEstadoRecuperado(estadoRecuperado) {
        console.log('Aplicando estado recuperado...');

        try {
            // Actualizar estado base
            this.estado = {
                ...this.estado,
                ...estadoRecuperado,
                timestamp: new Date().toISOString()
            };

            // Actualizar fase y subfase
            if (this.gestorJuego?.gestorFases) {
                await this.gestorJuego.gestorFases.cambiarFase(
                    estadoRecuperado.fase,
                    estadoRecuperado.subfase
                );
            }

            // Restaurar sector
            if (estadoRecuperado.sector) {
                await this.gestorJuego?.gestorFases?.actualizarSectorRemoto(
                    estadoRecuperado.sector
                );
            }

            // Restaurar zonas
            if (estadoRecuperado.zonasDespliegue) {
                for (const [equipo, zona] of Object.entries(estadoRecuperado.zonasDespliegue)) {
                    if (zona) {
                        await this.gestorJuego?.gestorFases?.actualizarZonaRemota({
                            equipo,
                            ...zona
                        });
                    }
                }
            }

            // Restaurar elementos
            if (estadoRecuperado.elementos) {
                for (const elemento of estadoRecuperado.elementos.values()) {
                    await this.gestorJuego?.gestorAcciones?.crearElementoRemoto(elemento);
                }
            }

            console.log('Estado recuperado aplicado correctamente');
            return true;
        } catch (error) {
            console.error('Error aplicando estado recuperado:', error);
            return false;
        }
    }

    // Métodos de actualización de estado
    actualizarEstado(actualizacion, fuente = 'local') {
        console.log(`Actualizando estado (${fuente}):`, actualizacion);

        const estadoAnterior = this.obtenerEstadoActual();
        let estadoNuevo = {};

        try {
            estadoNuevo = this.fusionarEstados(this.estado, actualizacion);
            this.validarEstado(estadoNuevo);
            this.estado = estadoNuevo;
            this.guardarEnHistorial(fuente);

            this.emisorEventos.emit('estadoActualizado', {
                anterior: estadoAnterior,
                actual: this.obtenerEstadoActual(),
                fuente
            });

            return true;
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.emisorEventos.emit('errorEstado', {
                error,
                estadoAnterior,
                actualizacion
            });
            return false;
        }
    }


    actualizarFase(datos) {
        this.actualizarEstado({
            fase: datos.fase,
            subfase: datos.subfase
        }, 'cambioFase');
    }

    actualizarTurno(datos) {
        this.actualizarEstado({
            jugadorActual: datos.jugador,
            turnoActual: datos.turno,
            tiempoRestante: datos.tiempoRestante
        }, 'cambioTurno');
    }

    actualizarEstadoJugador(jugadorId, actualizacion) {
        const jugadores = [...this.estado.jugadores];
        const index = jugadores.findIndex(j => j.id === jugadorId);
        
        if (index !== -1) {
            jugadores[index] = { ...jugadores[index], ...actualizacion };
            this.actualizarEstado({ jugadores }, 'actualizacionJugador');
        }
    }

    // Gestión de elementos del juego
    agregarElemento(elemento) {
        const elementos = new Map(this.estado.elementos);
        elementos.set(elemento.id, elemento);
        
        this.actualizarEstado({
            elementos
        }, 'elementoCreado');
    }

    eliminarElemento(elementoId) {
        const elementos = new Map(this.estado.elementos);
        elementos.delete(elementoId);
        
        this.actualizarEstado({
            elementos
        }, 'elementoEliminado');
    }

    // Gestión del historial
    guardarEnHistorial(tipo) {
        // Crear entrada de historial
        const entrada = {
            tipo,
            estado: JSON.parse(JSON.stringify(this.estado)), // Copia profunda
            timestamp: new Date().toISOString()
        };

        // Eliminar entradas futuras si estamos en medio del historial
        if (this.posicionHistorial < this.historial.length - 1) {
            this.historial = this.historial.slice(0, this.posicionHistorial + 1);
        }

        // Agregar nueva entrada
        this.historial.push(entrada);
        this.posicionHistorial++;

        // Mantener límite de historial
        if (this.historial.length > this.maxHistorial) {
            this.historial.shift();
            this.posicionHistorial--;
        }
    }

    deshacer() {
        if (this.posicionHistorial > 0) {
            this.posicionHistorial--;
            const estadoAnterior = this.historial[this.posicionHistorial].estado;
            this.estado = JSON.parse(JSON.stringify(estadoAnterior));
            
            this.emisorEventos.emit('estadoDeshecho', {
                estado: this.obtenerEstadoActual(),
                posicionHistorial: this.posicionHistorial
            });
            
            return true;
        }
        return false;
    }

    rehacer() {
        if (this.posicionHistorial < this.historial.length - 1) {
            this.posicionHistorial++;
            const estadoSiguiente = this.historial[this.posicionHistorial].estado;
            this.estado = JSON.parse(JSON.stringify(estadoSiguiente));
            
            this.emisorEventos.emit('estadoRehecho', {
                estado: this.obtenerEstadoActual(),
                posicionHistorial: this.posicionHistorial
            });
            
            return true;
        }
        return false;
    }

    // Métodos de consulta
    obtenerEstadoActual() {
        return JSON.parse(JSON.stringify(this.estado));
    }

    obtenerJugadorActual() {
        return this.estado.jugadorActual;
    }

    obtenerJugadores() {
        return [...this.estado.jugadores];
    }

    obtenerDirector() {
        return this.estado.director || this.estado.directorTemporal;
    }

    obtenerElementos() {
        return new Map(this.estado.elementos);
    }

    // Métodos de persistencia
    guardarEstado() {
        try {
            const estadoSerializado = JSON.stringify({
                estado: this.estado,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('estadoJuego', estadoSerializado);
            return true;
        } catch (error) {
            console.error('Error al guardar estado:', error);
            return false;
        }
    }

    cargarEstado() {
        try {
            const estadoGuardado = localStorage.getItem('estadoJuego');
            if (estadoGuardado) {
                const { estado, timestamp } = JSON.parse(estadoGuardado);
                this.actualizarEstado(estado, 'cargaLocal');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error al cargar estado:', error);
            return false;
        }
    }

    // Limpieza y destrucción
    limpiarEstado() {
        this.estado = {
            modo: 'local',
            fase: 'preparacion',
            subfase: 'definicion_sector',
            inicializado: false,
            timestamp: null,
            jugadores: [],
            elementos: new Map()
        };
        
        this.historial = [];
        this.posicionHistorial = -1;
    }

    // [Resto de métodos existentes se mantienen igual]
    // actualizarFase(), actualizarTurno(), etc...

    destruir() {
        // Detener autoguardado
        if (this.autoGuardadoIntervalo) {
            clearInterval(this.autoGuardadoIntervalo);
        }
        
        // Guardar estado final
        this.guardarEstado();
        
        // Limpiar eventos
        window.removeEventListener('beforeunload', this.guardarEstado);
        this.emisorEventos.removeAllListeners();
        
        // Limpiar estado
        this.limpiarEstado();
        
        console.log('GestorEstado destruido');
    }
}
window.GestorEstado = GestorEstado;
