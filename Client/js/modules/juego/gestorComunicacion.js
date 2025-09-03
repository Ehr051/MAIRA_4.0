class GestorComunicacion extends GestorBase {
    constructor() {
        super();
        this.socket = null;
        this.conectado = false;
        this.intentosReconexion = 0;
        this.maxIntentosReconexion = 5;
        this.tiempoReconexion = 1000;
        this.configuracion = {
            urlServidor: SERVER_URL,
            opciones: {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            }
        };
        this.emisorEventos = new EventEmitter();
        // Obtener y guardar el código de partida al inicio
        this.codigoPartida = this.obtenerCodigoPartida();
        this.log(`Código de partida obtenido: ${this.codigoPartida}`);
    }

        async inicializar(config) {
            this.log('Iniciando GestorComunicacion', config);
            
            try {
                // Guardar referencia al gestorJuego
                this.gestorJuego = config.gestorJuego;
    
                // Inicializar solo si es modo online
                if (config.modoJuego === 'online') {
                    // Verificar código de partida
                    if (!this.codigoPartida) {
                        throw new Error('No hay código de partida disponible');
                    }

                    // Conectar socket
                    await this.conectarSocket(config.urlServidor || this.configuracion.urlServidor);                    // Configurar eventos
                    this.configurarEventosSocket();
                    
                    this.log('GestorComunicacion inicializado correctamente');
                } else {
                    this.log('Modo offline - Skip inicialización de socket');
                }
    
                return true;
            } catch (error) {
                this.log('Error al inicializar:', error, 'error');
                throw error;
            }
        }
    

    obtenerCodigoPartida() {
        const codigo = window.codigoPartida || 
                      sessionStorage.getItem('codigoPartida') ||
                      new URLSearchParams(window.location.search).get('codigo');
        
        if (codigo) {
            // Guardar en todos los lugares necesarios
            window.codigoPartida = codigo;
            sessionStorage.setItem('codigoPartida', codigo);
            this.log(`Código de partida guardado: ${codigo}`);
        }
        
        return codigo;
    }

    async conectarSocket(urlServidor) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.codigoPartida) {
                    throw new Error('No hay código de partida disponible');
                }

                this.log(`Conectando a servidor: ${urlServidor}`);
                this.log('Estado actual:', {
                    userId: window.userId,
                    codigoPartida: this.codigoPartida,
                    equipoJugador: window.equipoJugador
                });

                this.socket = io(urlServidor, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 10,
                    timeout: 30000,
                    transports: ['polling'],  // Solo polling para Render
                    upgrade: false,  // No intentar upgrade a websocket
                    query: {
                        userId: window.userId,
                        partidaCodigo: this.codigoPartida // Usar consistentemente partidaCodigo
                    }
                });

                this.socket.on('connect', () => {
                    this.log('Conectado al servidor:', this.socket.id);
                    this.conectado = true;
                    this.intentosReconexion = 0;

                    // Unirse a la partida
                    this.socket.emit('unirseAPartida', {
                        codigo: this.codigoPartida,
                        userId: window.userId,
                        username: window.userName,
                        equipo: window.equipoJugador
                    });

                    resolve(this.socket);
                });

                this.socket.on('connect_error', (error) => {
                    this.log('Error de conexión:', error, 'error');
                    reject(error);
                });

            } catch (error) {
                this.log('Error al crear conexión:', error, 'error');
                reject(error);
            }
        });
    }


emitirEvento(nombre, datos) {
    if (!this.verificarEstadoConexion()) {
        this.log('No se puede emitir evento: sin conexión', null, 'error');
        return false;
    }

    const datosCompletos = {
        ...datos,
        partidaCodigo: this.codigoPartida,
        timestamp: new Date().toISOString()
    };

    this.log(`Emitiendo ${nombre}:`, datosCompletos);
    
    try {
        this.socket.emit(nombre, datosCompletos);
        return true;
    } catch (error) {
        this.log(`Error al emitir evento ${nombre}:`, error, 'error');
        this.notificarError(error);
        return false;
    }
}


        /**
         * Solicita el estado inicial de la partida al servidor
         * @returns {boolean} true si se envió la solicitud, false si no hay conexión
         */
        solicitarEstadoInicial() {
            if (!this.verificarEstadoConexion()) {
                this.log('No se puede solicitar estado: sin conexión', null, 'warn');
                return false;
            }
    
            this.log('Solicitando estado inicial de partida');
            
            this.emitirEvento('solicitarEstado', {
                codigo: this.codigoPartida,
                userId: window.userId,
                equipoJugador: window.equipoJugador,
                timestamp: new Date().toISOString()
            });
    
            return true;
        }
    
        /**
         * Solicita actualización de estado completo
         * @returns {boolean} true si se envió la solicitud, false si no hay conexión
         */
        solicitarActualizacionEstado() {
            if (!this.verificarEstadoConexion()) {
                return false;
            }
    
            this.log('Solicitando actualización de estado');
            
            return this.emitirEvento('solicitarActualizacionEstado', {
                userId: window.userId,
                equipoJugador: window.equipoJugador
            });
        }
    
        /**
         * Procesa el estado recibido del servidor
         * @param {Object} estado Estado recibido
         */
        procesarEstadoRecibido(estado) {
            this.log('Procesando estado recibido:', estado);
    
            try {
                // Actualizar fase y subfase
                if (estado.fase && estado.subfase) {
                    this.gestorJuego?.gestorFases?.cambiarFase(estado.fase, estado.subfase);
                }
    
                // Actualizar sector
                if (estado.sector) {
                    this.gestorJuego?.gestorFases?.actualizarSectorRemoto(estado.sector);
                }
    
                // Actualizar zonas
                if (estado.zonas) {
                    Object.entries(estado.zonas).forEach(([equipo, zona]) => {
                        if (zona) {
                            this.gestorJuego?.gestorFases?.actualizarZonaRemota({
                                equipo,
                                ...zona
                            });
                        }
                    });
                }
    
                // Actualizar elementos
                if (estado.elementos) {
                    estado.elementos.forEach(elemento => {
                        this.gestorJuego?.gestorAcciones?.crearElementoRemoto(elemento);
                    });
                }
    
                this.log('Estado procesado correctamente');
                this.emisorEventos.emit('estadoProcesado', { timestamp: new Date().toISOString() });
    
            } catch (error) {
                this.log('Error procesando estado:', error, 'error');
                this.notificarError(error);
            }
        }
    
        /**
         * Verifica si el estado recibido es más reciente que el actual
         * @param {Object} estadoNuevo Estado recibido
         * @returns {boolean} true si el estado es más reciente
         */
        esEstadoMasReciente(estadoNuevo) {
            if (!estadoNuevo.timestamp) return false;
            
            const timestampActual = this.gestorJuego?.gestorFases?.timestamp || 0;
            const timestampNuevo = new Date(estadoNuevo.timestamp).getTime();
            
            return timestampNuevo > timestampActual;
        }
    

    // Método helper para verificar estado
    verificarEstadoConexion() {
        if (!this.socket?.connected) {
            this.log('Socket no conectado', 'error');
            return false;
        }
        if (!this.codigoPartida) {
            this.log('Código de partida no disponible', 'error');
            return false;
        }
        return true;
    }

    // Modificar los métodos existentes para usar emitirEvento
    emitirCambioFase(datos) {
        return this.emitirEvento('cambioFase', datos);
    }

    emitirSectorDefinido(sector) {
        return this.emitirEvento('sectorConfirmado', {
            sector,
            jugadorId: window.userId
        });
    }

    sincronizarChat(mensaje) {
        return this.emitirEvento('mensajeChat', mensaje);
    }

// Configuración de eventos de socket
configurarEventosSocket() {
    if (!this.socket) return;

    const eventHandlers = {
        'sectorConfirmado': (datos) => {
            this.log('sectorConfirmado recibido:', datos, 'debug');
            if (datos.jugadorId === window.userId) return;

            try {
                const exito = this.gestorJuego?.gestorFases?.actualizarSectorRemoto({
                    coordenadas: datos.coordenadas,
                    bounds: datos.bounds
                });

                if (exito && datos.cambiarFase) {
                    this.gestorJuego?.gestorFases?.cambiarFase('preparacion', 'definicion_zonas');
                    this.gestorJuego?.gestorFases?.actualizarBotonesFase();
                    this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();

                    // Actualizar estado global
                    this.gestorJuego?.gestorEstado?.actualizarEstado({
                        fase: 'preparacion',
                        subfase: 'definicion_zonas',
                        sector: datos
                    });
                }
            } catch (error) {
                this.log('Error procesando sectorConfirmado:', error, 'error');
            }
        },

        'cambioFase': (datos) => {
            this.log('cambioFase recibido:', datos);
            if (datos.jugadorId === window.userId) return;

            try {
                this.gestorJuego?.gestorFases?.cambiarFase(datos.fase, datos.subfase);

                if (datos.fase === 'preparacion' && datos.subfase === 'definicion_zonas') {
                    const esDirector = this.gestorJuego?.gestorFases?.esDirector(window.userId);
                    const mensaje = esDirector ? 
                        'Define la zona de despliegue del equipo rojo' : 
                        'El director está definiendo las zonas de despliegue';
                    this.gestorJuego?.gestorFases?.mostrarMensajeAyuda(mensaje);
                }

                this.gestorJuego?.gestorFases?.actualizarBotonesFase();
                this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
                
                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstado({
                    fase: datos.fase,
                    subfase: datos.subfase
                });
            } catch (error) {
                this.log('Error procesando cambio de fase:', error, 'error');
            }
        },

        'zonaConfirmada': (datos) => {
            this.log('zonaConfirmada recibido:', datos, 'debug');
            if (datos.jugadorId === window.userId) return;

            try {
                const equipo = datos.zona.equipo;
                
                if (this.gestorJuego?.gestorFases?.zonasLayers[equipo]) {
                    this.gestorJuego.gestorFases.zonasLayers[equipo].remove();
                    this.gestorJuego.gestorFases.zonasLayers[equipo] = null;
                }

                const exito = this.gestorJuego?.gestorFases?.actualizarZonaRemota({
                    equipo,
                    coordenadas: datos.zona.coordenadas,
                    bounds: datos.zona.bounds,
                    estilo: datos.zona.estilo
                });

                if (exito) {
                    if (datos.zona.equipo === 'rojo') {
                        this.gestorJuego?.gestorFases?.habilitarZonaAzul();
                    }
                    this.gestorJuego?.gestorFases?.actualizarBotonesFase();
                    this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();

                    // Actualizar estado global
                    this.gestorJuego?.gestorEstado?.actualizarEstado({
                        zonasDespliegue: {
                            ...this.gestorJuego?.gestorEstado?.estado.zonasDespliegue,
                            [equipo]: datos.zona
                        }
                    });
                }
            } catch (error) {
                this.log('Error procesando zonaConfirmada:', error, 'error');
            }
        },

        'inicioDespliegue': (datos) => {
            this.log('inicioDespliegue recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorFases?.cambiarFase('preparacion', 'despliegue');
                this.gestorJuego?.gestorFases?.limpiarInterfazAnterior();
                this.gestorJuego?.gestorFases?.actualizarInterfazDespliegue();
                this.gestorJuego?.gestorAcciones?.actualizarPermisosSegunFase('preparacion', 'despliegue');

                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstado({
                    fase: 'preparacion',
                    subfase: 'despliegue'
                });
            }
        },

        'jugadorListo': (datos) => {
            this.log('jugadorListo recibido:', datos);
            if (datos.jugadorId === window.userId) return;

            try {
                this.gestorJuego?.gestorTurnos?.manejarJugadorListo(datos);

                if (this.gestorJuego?.gestorFases?.todosJugadoresListos()) {
                    this.gestorJuego?.gestorFases?.iniciarFaseCombate();
                }

                this.gestorJuego?.gestorFases?.actualizarBotonesFase();
                this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();

                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstadoJugador(datos.jugadorId, { listo: true });
            } catch (error) {
                this.log('Error procesando jugadorListo:', error, 'error');
            }
        },

        'iniciarCombate': (datos) => {
            this.log('iniciarCombate recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorFases?.cambiarFase('combate', 'movimiento');
                this.gestorJuego?.gestorTurnos?.iniciarTurnos();
                this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();

                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstado({
                    fase: 'combate',
                    subfase: 'movimiento'
                });
            }
        },

        'elementoCreado': (datos) => {
            this.log('elementoCreado recibido:', datos);
            if (datos.jugadorId === window.userId) return;

            try {
                const exito = this.gestorJuego?.gestorAcciones?.crearElementoRemoto(datos);
                if (exito) {
                    this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
                    // Actualizar estado global
                    this.gestorJuego?.gestorEstado?.agregarElemento(datos);
                }
            } catch (error) {
                this.log('Error procesando elementoCreado:', error, 'error');
            }
        },

        'guardarElemento': (datos) => {
            this.log('guardarElemento recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.guardarElementoRemoto(datos);
                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstado({
                    elementos: new Map([...this.gestorJuego?.gestorEstado?.estado.elementos])

                        .set(datos.id, { ...datos })
                });
            }
        },

        'elementoMovido': (datos) => {
            this.log('elementoMovido recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.moverElementoRemoto(datos);
                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.actualizarEstado({
                    elementos: new Map([...this.gestorJuego?.gestorEstado?.estado.elementos])
                        .set(datos.id, { ...datos })
                });
            }
        },

        'elementoEliminado': (datos) => {
            this.log('elementoEliminado recibido:', datos);
            if (datos.jugadorId !== window.userId) {
                this.gestorJuego?.gestorAcciones?.eliminarElementoRemoto(datos);
                // Actualizar estado global
                this.gestorJuego?.gestorEstado?.eliminarElemento(datos.id);
            }
        },

        'estadoPartida': (datos) => {
            this.log('Estado de partida recibido:', datos);
            
            try {
                // Verificar timestamp del estado
                if (this.gestorJuego?.gestorEstado?.esEstadoMasReciente(datos)) {
                    if (datos.fase && datos.subfase) {
                        this.gestorJuego?.gestorFases?.cambiarFase(datos.fase, datos.subfase);
                    }

                    if (datos.sector) {
                        this.gestorJuego?.gestorFases?.actualizarSectorRemoto(datos.sector);
                    }

                    if (datos.zonas) {
                        Object.entries(datos.zonas).forEach(([equipo, zona]) => {
                            const esDirector = this.gestorJuego?.gestorFases?.esDirector(window.userId);
                            if (esDirector || equipo === window.equipoJugador) {
                                this.gestorJuego?.gestorFases?.actualizarZonaRemota({
                                    equipo,
                                    ...zona
                                });
                            }
                        });
                    }

                    // Actualizar estado global
                    this.gestorJuego?.gestorEstado?.actualizarEstado(datos);
                    this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
                }
            } catch (error) {
                this.log('Error procesando estado:', error, 'error');
            }
        },

        'mensajeJuego': (mensaje) => {
            this.log('mensajeJuego recibido:', mensaje);
            this.emisorEventos.emit('mensajeJuego', mensaje);
        },

        'cambioTurno': (datos) => {
            this.log('cambioTurno recibido:', datos);
            this.emisorEventos.emit('cambioTurno', datos);
            // Actualizar estado global
            this.gestorJuego?.gestorEstado?.actualizarTurno(datos);
        },

        // Eventos de conexión
        'connect': () => {
            this.log('Conexión establecida');
            this.conectado = true;
            this.intentosReconexion = 0;
            this.emisorEventos.emit('conexionEstablecida');
            // Solicitar estado actual al conectar
            this.solicitarEstadoInicial();
        },

        'disconnect': () => {
            this.log('Desconexión detectada', null, 'warn');
            this.conectado = false;
            this.emisorEventos.emit('desconexion');
            // Guardar estado actual antes de desconectar
            this.gestorJuego?.gestorEstado?.guardarEstado();
        },

        'reconnect': (attemptNumber) => {
            this.log(`Reconexión exitosa, intento: ${attemptNumber}`);
            this.conectado = true;
            this.intentosReconexion = 0;
            this.emisorEventos.emit('reconexion', attemptNumber);
            // Recuperar estado después de reconectar
            this.gestorJuego?.gestorEstado?.recuperarEstado();
        },

        'error': (error) => {
            this.log('Error de socket:', error, 'error');
            this.emisorEventos.emit('error', error);
        }
    };

    // Registrar todos los handlers
    Object.entries(eventHandlers).forEach(([evento, handler]) => {
        this.log(`Registrando handler para evento: ${evento}`);
        this.socket.on(evento, handler);
    });
}

async solicitarEstadoInicial() {
    if (!this.verificarEstadoConexion()) {
        this.log('No se puede solicitar estado: sin conexión', null, 'warn');
        return false;
    }

    this.log('Solicitando estado inicial de partida');
    
    this.emitirEvento('solicitarEstado', {
        codigo: this.codigoPartida,
        userId: window.userId,
        equipoJugador: window.equipoJugador,
        timestamp: new Date().toISOString()
    });

    return true;
}

// Sincronización de elementos y estado
sincronizarElemento(datos) {
    if (datos.creadorId === window.userId) return;

    try {
        const sym = new ms.Symbol(datos.sidc, { size: 35 });
        const marcador = L.marker(datos.posicion, {
            icon: L.divIcon({
                className: `custom-div-icon equipo-${datos.equipo}`,
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            }),
            ...datos
        });

        if (window.calcoActivo) {
            window.calcoActivo.addLayer(marcador);
            this.gestorJuego.gestorAcciones.configurarEventosMarcador(marcador);
        }
    } catch (error) {
        this.log('Error al sincronizar elemento:', error, 'error');
    }
}


sincronizarEstadoCompleto() {
    if (!this.verificarEstadoConexion()) return false;

    const estado = {
        fase: this.gestorJuego.gestorFases.fase,
        subfase: this.gestorJuego.gestorFases.subfase,
        turno: this.gestorJuego.gestorTurnos.turnoActual,
        jugadorActual: this.gestorJuego.gestorTurnos.obtenerJugadorActual(),
        elementos: this.obtenerEstadoElementos()
    };

    return this.emitirEvento('sincronizarEstadoCompleto', estado);
}

// Manejo de conexión y reconexión
manejarReconexion() {
    if (this.intentosReconexion >= this.maxIntentosReconexion) {
        this.emisorEventos.emit('errorReconexion');
        return;
    }

    this.intentosReconexion++;
    const tiempoEspera = this.calcularTiempoEspera();
    
    setTimeout(() => {
        this.conectarSocket(this.configuracion.urlServidor)
            .catch(() => this.manejarReconexion());
    }, tiempoEspera);
}

calcularTiempoEspera() {
    return this.tiempoReconexion * Math.pow(2, this.intentosReconexion - 1);
}

// Métodos de ayuda
obtenerEstadoElementos() {
    const elementos = [];
    this.gestorJuego?.gestorMapa?.calcoActivo?.eachLayer(layer => {
        if (layer.options?.id) {
            elementos.push({
                id: layer.options.id,
                tipo: layer.options.tipo,
                posicion: layer instanceof L.Marker ? layer.getLatLng() : layer.getBounds(),
                propiedades: { ...layer.options }
            });
        }
    });
    return elementos;
}

notificarError(error) {
    const errorData = {
        mensaje: error.message,
        tipo: error.name,
        timestamp: new Date().toISOString()
    };
    
    this.emisorEventos.emit('error', errorData);
    if (this.verificarEstadoConexion()) {
        this.emitirEvento('error', errorData);
    }
}

destruir() {
    this.log('Destruyendo GestorComunicacion');
    this.desconectar();
    super.destruir();
}
// Métodos de emisión específicos
emitirNuevoElemento(elemento) {
    return this.emitirEvento('elementoCreado', {
        id: elemento.options.id,
        sidc: elemento.options.sidc,
        nombre: elemento.options.nombre,
        posicion: elemento.getLatLng(),
        equipo: elemento.options.equipo,
        creadorId: window.userId
    });
}

emitirCambioTurno(datos) {
    return this.emitirEvento('cambioTurno', datos);
}

emitirAccionJuego(accion) {
    return this.emitirEvento('accionJuego', accion);
}

// Métodos de sincronización
sincronizarEstado() {
    return this.emitirEvento('sincronizarEstado', {
        jugadorId: window.userId
    });
}

sincronizarAccion(accion) {
    return this.emitirEvento('accionJuego', {
        ...accion,
        jugadorId: window.userId
    });
}

// Métodos de manejo de estado
manejarConexionPerdida() {
    this.conectado = false;
    this.intentarReconexion();
    this.emisorEventos.emit('conexionPerdida');
}

intentarReconexion() {
    if (this.intentosReconexion >= this.maxIntentosReconexion) {
        this.emisorEventos.emit('reconexionFallida');
        return;
    }
    
    this.intentosReconexion++;
    setTimeout(() => this.conectarSocket(this.configuracion.urlServidor), this.calcularTiempoEspera());
}

// Métodos de utilidad
log(mensaje, datos, tipo = 'info') {
    const prefix = `[GestorComunicacion][${tipo.toUpperCase()}]`;
    if (datos) {
        console.log(prefix, mensaje, datos);
    } else {
        console.log(prefix, mensaje);
    }
}

enviarMensaje(mensaje) {
    // Implementar lógica para enviar el mensaje a todos los usuarios conectados
    this.socket.emit('mensaje', mensaje);
}

recibirMensaje() {
    this.socket.on('mensaje', (mensaje) => {
        switch (mensaje.tipo) {
            case 'confirmacionZona':
                this.gestorFases.actualizarZona(mensaje.color, mensaje.zona);
                break;
            // Manejar otros tipos de mensajes
        }
    });
}

}

window.GestorComunicacion = GestorComunicacion;

