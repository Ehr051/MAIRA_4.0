// En GestorJuego.js
class GestorJuego extends GestorBase {
    constructor() {
        super();
        this.gestorAcciones = null;
        this.gestorComunicacion = null;
        this.gestorMapa = null;
        this.gestorInterfaz = null;
        this.gestorTurnos = null;
        this.gestorFases = null;
        this.gestorCarga = new GestorCarga();
        this.socket = null;
        this.configuracion = null; // Añadir esta línea

        this.emisorEventos = new EventEmitter();

        this.estado = {
            modoJuego: 'local',
            fase: 'preparacion',
            subfase: 'definicion_sector',
            jugadorActual: null,
            partidaCodigo: null,
            inicializado: false
        };
    }

    async inicializar(configuracion) {
        try {
            console.log('Iniciando GestorJuego con configuración:', configuracion);
            
            // Validar configuración básica
            if (!configuracion) {
                throw new Error('La configuración es requerida');
            }

            // Guardar la configuración
            this.configuracion = configuracion;

            // Asegurarse de que tengamos valores por defecto para todo
            const configCompleta = {
                modoJuego: 'local',
                duracionTurno: 300,
                jugadores: [],
                urlServidor: SERVER_URL,
                centro: [-34.9964963, -64.9672817],
                zoom: 4,
                ...configuracion // Los valores proporcionados sobrescribirán los default
            };

            // Inicializar GestorCarga primero
            await this.gestorCarga.inicializar();
            this.gestorCarga.mostrar('Iniciando juego...');

            // Establecer equipo del jugador
            if (configCompleta.modoJuego === 'local') {
                // En modo local, el primer jugador es el actual inicialmente
                window.userId = configCompleta.jugadores[0].id;
                window.equipoJugador = configCompleta.jugadores[0].equipo;
                console.log('🎮 MODO LOCAL - Jugador inicial asignado:', {
                    userId: window.userId,
                    equipo: window.equipoJugador,
                    jugadores: configCompleta.jugadores.length
                });
            } else {
                // En modo online, buscar por ID del usuario actual
                window.equipoJugador = configCompleta.jugadores.find(j => j.id === window.userId)?.equipo;
                console.log('🌐 MODO ONLINE - Equipo asignado:', window.equipoJugador);
            }

            // Inicializar estado
            this.estado = {
                modoJuego: configCompleta.modoJuego,
                fase: 'preparacion',
                subfase: 'definicion_sector',
                jugadorActual: null,
                inicializado: false,
                equipoJugador: window.equipoJugador
            };

            // Inicializar gestores con la configuración completa
            await this.inicializarGestores(configCompleta);

            // Si tenemos un equipo, actualizar el SIDC
            if (window.equipoJugador) {
                const caracter = window.equipoJugador === 'azul' ? 'F' : 'J';
                if (this.gestorAcciones) {
                    this.gestorAcciones.actualizarSidcPorEquipo(caracter);
                }
            }

            this.gestorCarga.ocultar();
            console.log('GestorJuego inicializado correctamente');

            // Inicializar MAIRAChat después de un delay
            setTimeout(() => {
                inicializarMAIRAChatJuego.call(this);
            }, 2000); // Reducir delay
            return true;

        } catch (error) {
            console.error('Error al inicializar GestorJuego:', error);
            if (this.gestorCarga) {
                this.gestorCarga.ocultar();
            }
            this.manejarErrorInicializacion(error);
            throw error;
        }
    }

validarConfiguracion(config) {
            if (!config) {
                throw new Error('Configuración no proporcionada');
            }
            
            if (!Array.isArray(config.jugadores)) {
                throw new Error('La lista de jugadores es inválida');
            }
            
            if (typeof config.duracionTurno !== 'number' || config.duracionTurno < 30) {
                throw new Error('Duración de turno inválida');
            }
        }
        
configurarEventosCarga() {
            if (!this.gestorCarga) return;
    
            this.gestorCarga.emisorEventos.on('cargaIniciada', (datos) => {
                console.log('Iniciando carga:', datos.mensaje);
            });
    
            this.gestorCarga.emisorEventos.on('progresoActualizado', (datos) => {
                console.log('Progreso de carga:', datos.progreso, datos.tarea);
                const progreso = document.getElementById('progreso');
                if (progreso) {
                    progreso.style.width = `${datos.progreso}%`;
                }
                const loadingText = document.getElementById('loadingText');
                if (loadingText) {
                    loadingText.textContent = datos.tarea;
                }
            });
            
        }

async inicializarGestores(config) {
    console.log('Iniciando inicialización de gestores con config:', config);
    const tareas = [
        { 
            nombre: 'Configurando sistema de turnos...', // Movido más arriba
            gestor: 'GestorTurnos',
            configExtra: {
                jugadores: config.jugadores,
                duracionTurno: config.duracionTurno || 300
            }
        },
        { 
            nombre: 'Inicializando comunicación...', 
            gestor: 'GestorComunicacion',
            configExtra: {
                modoJuego: config.modoJuego,
                urlServidor: SERVER_URL
            }
        },
        
        { 
            nombre: 'Inicializando mapa...', 
            gestor: 'GestorMapa',
            configExtra: {
                centro: config.centro,
                zoom: config.zoom
            }
        },
        { 
            nombre: 'Preparando fases de juego...', 
            gestor: 'GestorFases',
            configExtra: {
                fase: 'preparacion',
                subfase: 'definicion_sector',
                jugadores: config.jugadores
            }
        },
        { 
            nombre: 'Configurando acciones...', 
            gestor: 'GestorAcciones',
            configExtra: {
                modo: config.modoJuego
            }
        },
        { 
            nombre: 'Preparando interfaz...', 
            gestor: 'GestorInterfaz',
            configExtra: {}
        }
    ];

    const totalTareas = tareas.length;
    let tareasCompletadas = 0;

    for (const tarea of tareas) {
        try {
            const progresoInicial = (tareasCompletadas / totalTareas) * 100;
            this.gestorCarga.actualizarProgreso(progresoInicial, tarea.nombre);

            await this.inicializarGestor(tarea.gestor, {
                ...config,
                ...tarea.configExtra,
                gestorJuego: this,
                socket: this.gestorComunicacion?.socket
            });

            tareasCompletadas++;
            const progresoFinal = (tareasCompletadas / totalTareas) * 100;
            this.gestorCarga.actualizarProgreso(progresoFinal, `${tarea.nombre} completado`);

        } catch (error) {
            console.error(`Error al inicializar ${tarea.gestor}:`, error);
            throw error;
        }
    }
}

async inicializarGestor(nombreGestor, config) {
    console.log(`Inicializando ${nombreGestor}...`);
    
    // Verificar que la clase del gestor existe
    if (!window[nombreGestor]) {
        throw new Error(`Gestor ${nombreGestor} no encontrado`);
    }

    try {
        // Crear instancia del gestor
        const gestor = new window[nombreGestor]();
        
        // Guardar referencia al gestor con nombre en camelCase
        const nombrePropiedad = nombreGestor.charAt(0).toLowerCase() + nombreGestor.slice(1);
        this[nombrePropiedad] = gestor;
        
        // Inicializar el gestor
        await gestor.inicializar({
            ...config,
            gestorJuego: this
        });

        console.log(`${nombreGestor} inicializado correctamente`);
        return true;
    } catch (error) {
        console.error(`Error al inicializar ${nombreGestor}:`, error);
        throw error;
    }
}
    
    // En GestorJuego.js
verificarEstadoJuego() {
        const estadoValido = 
            this.gestorFases?.fase &&
            this.gestorTurnos?.jugadorActual &&
            this.gestorMapa?.mapa;
            
        if (!estadoValido) {
            console.error('Estado del juego inválido', {
                fase: this.gestorFases?.fase,
                jugadorActual: this.gestorTurnos?.jugadorActual,
                mapa: !!this.gestorMapa?.mapa
            });
            throw new Error('Estado del juego inválido');
        }
        }
        
        
configurarEventos() {
            try {
                // Verificar que todos los gestores necesarios existen y tienen emisorEventos
                const gestores = {
                    gestorFases: this.gestorFases,
                    gestorTurnos: this.gestorTurnos,
                    gestorAcciones: this.gestorAcciones,
                    gestorMapa: this.gestorMapa,
                    gestorInterfaz: this.gestorInterfaz
                };
        
                for (const [nombre, gestor] of Object.entries(gestores)) {
                    if (!gestor?.emisorEventos) {
                        console.error(`${nombre} no está correctamente inicializado o no tiene emisorEventos`);
                        continue;
                    }
                }
        
                // Eventos de fases y turnos
                if (this.gestorFases?.emisorEventos) {
                    this.gestorFases.emisorEventos.on('faseCambiada', (datos) => {
                        this.manejarCambioFase(datos);
                    });
                }
        
                if (this.gestorTurnos?.emisorEventos) {
                    this.gestorTurnos.emisorEventos.on('cambioTurno', (datos) => {
                        this.manejarCambioTurno(datos);
                    });
                }
        
                // Eventos de acciones
                if (this.gestorAcciones?.emisorEventos) {
                    this.gestorAcciones.emisorEventos.on('accionRegistrada', (accion) => {
                        this.manejarAccionRegistrada(accion);
                    });
                }
        
                // Eventos del mapa
                if (this.gestorMapa?.emisorEventos) {
                    this.gestorMapa.emisorEventos.on('elementoCreado', (elemento) => {
                        this.manejarElementoCreado(elemento);
                    });
                }
        
                // Eventos de comunicación en modo online
                if (this.gestorComunicacion?.emisorEventos) {
                    this.gestorComunicacion.emisorEventos.on('desconexion', () => {
                        this.manejarDesconexion();
                    });
        
                    this.gestorComunicacion.emisorEventos.on('reconexion', () => {
                        this.manejarReconexion();
                    });
                }
        
                // Eventos de interfaz
                if (this.gestorInterfaz?.emisorEventos) {
                    this.gestorInterfaz.emisorEventos.on('accionBoton', (accion) => {
                        this.manejarAccionInterfaz(accion);
                    });
                }
        
                console.log('Eventos configurados correctamente');
        
            } catch (error) {
                console.error('Error al configurar eventos:', error);
                throw new Error('Error al configurar eventos: ' + error.message);
            }
        }

    async limpiarGestores() {
            console.log('Limpiando gestores...');
            for (const nombreGestor of ['gestorMapa', 'gestorAcciones', 'gestorFases', 'gestorTurnos', 'gestorInterfaz']) {
                const gestor = this[nombreGestor];
                if (gestor && typeof gestor.destruir === 'function') {
                    try {
                        await gestor.destruir();
                        console.log(`${nombreGestor} destruido correctamente`);
                    } catch (error) {
                        console.warn(`Error al destruir ${nombreGestor}:`, error);
                    }
                }
            }
        }

    limpiarEventos() {
            const gestores = [
                this.gestorFases,
                this.gestorTurnos,
                this.gestorAcciones,
                this.gestorMapa,
                this.gestorInterfaz,
                this.gestorComunicacion
            ];
        
            for (const gestor of gestores) {
                if (gestor?.emisorEventos?.removeAllListeners) {
                    try {
                        gestor.emisorEventos.removeAllListeners();
                    } catch (error) {
                        console.warn(`Error al limpiar eventos de ${gestor.constructor.name}:`, error);
                    }
                }
            }
        }
        
        

        
    manejarErrorInicializacion(error) {
                console.error('Error de inicialización:', error);
                try {
                    this.limpiarGestores().finally(() => {
                        if (this.gestorInterfaz) {
                            this.gestorInterfaz.mostrarMensaje(
                                'Error al iniciar el juego: ' + error.message,
                                'error'
                            );
                        }
                        this.ocultarPantallaCarga();
                    });
                } catch (cleanupError) {
                    console.error('Error durante la limpieza:', cleanupError);
                    this.ocultarPantallaCarga();
                }
            }
        
        
    manejarErrorInicializacion(error) {
                console.error('Error de inicialización:', error);
                
                // Intentar limpiar cualquier inicialización parcial
                if (this.gestorMapa) this.gestorMapa.destruir();
                if (this.gestorAcciones) this.gestorAcciones.destruir();
                if (this.gestorFases) this.gestorFases.destruir();
                if (this.gestorTurnos) this.gestorTurnos.destruir();
                if (this.gestorInterfaz) this.gestorInterfaz.destruir();
                
                if (this.gestorInterfaz) {
                    this.gestorInterfaz.mostrarMensaje(
                        'Error al iniciar el juego: ' + error.message,
                        'error'
                    );
                }
                this.ocultarPantallaCarga();
            }
        

    async cargarDatosPartida(config) {
            // Cargar datos iniciales
            this.estado.modoJuego = config.modoJuego;
            this.estado.partidaCodigo = config.codigo;

            // Si es modo online, unirse a la partida
            if (this.estado.modoJuego === 'online' && this.gestorComunicacion) {
                await this.gestorComunicacion.unirseAPartida(config.codigo);
            }
        }

        

    manejarCambioFase(datos) {
            console.log('Cambio de fase:', datos);

            // Actualizar estado global
            this.estado.fase = datos.nuevaFase;
            this.estado.subfase = datos.nuevaSubfase;

            // Actualizar interfaces
            this.gestorInterfaz.actualizarPanelFase(datos);
            this.gestorMapa.actualizarSegunFase(datos);
            
            // Notificar al servidor en modo online
            if (this.estado.modoJuego === 'online') {
                this.gestorComunicacion.emitirCambioFase(datos);
            }
        }

    manejarCambioTurno(datos) {
            console.log('Cambio de turno:', datos);

            // Actualizar estado global
            this.estado.jugadorActual = datos.jugadorActual;

            // Actualizar interfaces
            this.gestorInterfaz.actualizarPanelTurno(datos);
            this.gestorMapa.actualizarVisibilidad(datos.jugadorActual);
            
            // Emitir cambio en modo online
            if (this.estado.modoJuego === 'online') {
                this.gestorComunicacion.emitirCambioTurno(datos);
            }
        }

    manejarAccionRegistrada(accion) {
            console.log('Acción registrada:', accion);

            // Validar acción según fase actual
            if (!this.validarAccionEnFase(accion)) {
                console.warn('Acción no válida en fase actual:', accion);
                return;
            }

            // Procesar acción
            this.procesarAccion(accion);

            // Actualizar interfaces
            this.gestorInterfaz.mostrarMensaje(`Acción realizada: ${accion.tipo}`);
            
            // Sincronizar en modo online
            if (this.estado.modoJuego === 'online') {
                this.gestorComunicacion.emitirAccion(accion);
            }
        }

    validarAccionEnFase(accion) {
            return this.gestorFases.validarAccion(accion, this.estado.fase, this.estado.subfase);
        }

    procesarAccion(accion) {
            switch (accion.tipo) {
                case 'desplegarUnidad':
                    this.gestorMapa.desplegarUnidad(accion.datos);
                    break;
                case 'moverUnidad':
                    this.gestorMapa.moverUnidad(accion.datos);
                    break;
                case 'atacar':
                    this.procesarAtaque(accion.datos);
                    break;
                default:
                    console.warn('Tipo de acción no manejada:', accion.tipo);
            }
        }

    procesarAtaque(datos) {
            // Implementar lógica de ataque
            console.log('Procesando ataque:', datos);
        }

    manejarElementoCreado(elemento) {
            // Registrar el elemento como una acción
            this.gestorAcciones.registrarAccion('crearElemento', {
                tipo: elemento.tipo,
                datos: elemento.datos
            });
        }

    manejarDesconexion() {
            this.gestorInterfaz.mostrarMensaje('Conexión perdida. Intentando reconectar...', 'error');
            this.gestorInterfaz.mostrarIndicadorDesconexion();
        }

    manejarReconexion() {
            this.gestorInterfaz.mostrarMensaje('Conexión restablecida', 'exito');
            this.gestorInterfaz.ocultarIndicadorDesconexion();
            this.sincronizarEstado();
        }

    sincronizarEstado() {
            if (this.estado.modoJuego === 'online' && this.gestorComunicacion) {
                this.gestorComunicacion.solicitarEstadoActual();
            }
        }

    manejarAccionInterfaz(accion) {
            console.log('Acción de interfaz:', accion);

            switch (accion) {
                case 'finalizarTurno':
                    this.gestorTurnos.finalizarTurnoActual();
                    break;
                case 'finalizarFase':
                    this.gestorFases.finalizarFaseActual();
                    break;
                case 'definirSector':
                    this.gestorFases.iniciarDefinicionSector();
                    break;
                default:
                    console.warn('Acción de interfaz no manejada:', accion);
            }
        }

    mostrarPantallaCarga() {
            this.gestorInterfaz?.mostrarCargando('Iniciando juego...');
        }

    ocultarPantallaCarga() {
            this.gestorInterfaz?.ocultarCargando();
        }

        // Métodos públicos para acceso externo
    obtenerEstadoActual() {
            return {
                ...this.estado,
                jugadores: this.gestorTurnos.jugadores,
                turnoActual: this.gestorTurnos.turnoActual,
                tiempoRestante: this.gestorTurnos.tiempoRestante
            };
        }


    // En GestorJuego
    guardarEstado() {
        const estado = {
            fase: this.gestorFases.fase,
            subfase: this.gestorFases.subfase,
            sector: this.gestorFases.sectorJuego,
            zonas: this.gestorFases.zonasDespliegue,
            elementos: this.gestorAcciones.obtenerElementos(),
            timestamp: new Date().toISOString()
        };

        // Guardar en el servidor
        if (this.gestorComunicacion?.socket) {
            this.gestorComunicacion.socket.emit('guardarEstado', {
                partidaCodigo: window.codigoPartida,
                estado
            });
        }

        return estado;
    }

    cargarEstado(estado) {
        if (!estado) return;

        // Restaurar fase y subfase
        this.gestorFases.restaurarEstado(estado.fase, estado.subfase);
        
        // Restaurar sector y zonas
        if (estado.sector) {
            this.gestorFases.actualizarSectorRemoto(estado.sector);
        }
        
        if (estado.zonas) {
            Object.entries(estado.zonas).forEach(([equipo, zona]) => {
                this.gestorFases.actualizarZonaRemota({ equipo, ...zona });
            });
        }

        // Restaurar elementos
        if (estado.elementos) {
            estado.elementos.forEach(elemento => {
                this.gestorAcciones.crearElementoRemoto(elemento);
            });
        }
    }

    finalizarPartida() {
            console.log('Finalizando partida...');

            // Detener todos los procesos activos
            this.gestorTurnos.detenerReloj();
            
            // Limpiar el mapa
            this.gestorMapa.limpiarCalco();
            
            // Notificar al servidor en modo online
            if (this.estado.modoJuego === 'online') {
                this.gestorComunicacion.finalizarPartida();
            }

            // Mostrar resumen final
            this.gestorInterfaz.mostrarResumenPartida(this.obtenerEstadoActual());
        }

        destruir() {
            console.log('Destruyendo GestorJuego...');
            
            try {
                // Limpiar eventos primero
                this.limpiarEventos();
                
                // Luego destruir gestores
                this.limpiarGestores();
                
                // Limpiar estado
                this.estado = {
                    modoJuego: 'local',
                    fase: 'preparacion',
                    subfase: 'definicion_sector',
                    jugadorActual: null,
                    partidaCodigo: null,
                    inicializado: false
                };
                if (this.gestorCarga) {
                    this.gestorCarga.destruir();
                }
            } catch (error) {
                console.error('Error al destruir GestorJuego:', error);
            }
        }
        obtenerEstadoActual() {
            console.log('Estado actual:', {
                equipoJugador: window.equipoJugador,
                jugadores: this.gestorTurnos?.jugadores,
                fase: this.gestorFases?.fase,
                subfase: this.gestorFases?.subfase,
                configuracion: this.configuracion
            });
        
            return {
                equipoJugador: window.equipoJugador,
                jugadores: this.gestorTurnos?.jugadores || [],
                fase: this.gestorFases?.fase || 'preparacion',
                subfase: this.gestorFases?.subfase || 'definicion_sector',
                turnoActual: this.gestorTurnos?.turnoActual || 1,
                jugadorActual: this.gestorTurnos?.obtenerJugadorActual(),
                configuracion: this.configuracion
            };
        }
        
    }

/**
 * Inicializa MAIRAChat automáticamente para juegodeguerra
 */
async function inicializarMAIRAChatJuego() {
    console.log('🔧 Inicializando MAIRAChat para juegodeguerra...');
    
    const intentarInicializarChat = () => {
        // ✅ CORREGIR: Buscar socket en las rutas CORRECTAS usando 'this'
        const socketDisponible = 
            this.gestorComunicacion?.socket ||        // OPCIÓN 1: desde this
            window.gestorJuego?.gestorComunicacion?.socket ||  // OPCIÓN 2: desde window
            this.socket ||                            // OPCIÓN 3: socket directo
            window.socket;                            // OPCIÓN 4: socket global
        
        console.log('🔍 Sockets disponibles:', {
            thisGestorComunicacion: !!this.gestorComunicacion?.socket,
            thisGestorComunicacionConectado: !!this.gestorComunicacion?.socket?.connected,
            thisGestorComunicacionId: this.gestorComunicacion?.socket?.id,
            windowGestorJuego: !!window.gestorJuego?.gestorComunicacion?.socket,
            windowGestorJuegoConectado: !!window.gestorJuego?.gestorComunicacion?.socket?.connected,
            socketSeleccionado: !!socketDisponible,
            socketConectado: !!socketDisponible?.connected,
            socketId: socketDisponible?.id
        });
        
        if (socketDisponible?.connected && window.MAIRAChat) {
            console.log('✅ Socket encontrado y conectado, inicializando MAIRAChat...');
            
            // FORZAR INICIALIZACIÓN CON CREACIÓN DE CONTENEDORES
            const resultado = window.MAIRAChat.inicializar({ 
                socket: socketDisponible,
                usuario: window.usuarioInfo || window.userName || 'Usuario',
                forzarCreacion: true
            });
            
            if (resultado) {
                console.log('✅ MAIRAChat inicializado correctamente en juegodeguerra');
                
                // VERIFICAR Y FORZAR CREACIÓN SI ES NECESARIO
                setTimeout(() => {
                    const estado = window.MAIRAChat.estado();
                    if (!estado.inicializado || estado.contenedores.length === 0) {
                        console.warn('⚠️ MAIRAChat no completamente inicializado, forzando creación...');
                        window.MAIRAChat.forzarCreacionContenedores();
                    } else {
                        console.log('✅ MAIRAChat completamente operativo');
                    }
                }, 1000);
                
                return true;
            }
        }
        
        console.warn('⚠️ Socket no conectado o MAIRAChat no disponible');
        return false;
    };
    
    // VERIFICAR INMEDIATAMENTE si el socket ya está listo
    if (this.gestorComunicacion?.socket?.connected) {
        console.log('✅ Socket gestorComunicacion ya conectado, iniciando inmediatamente');
        setTimeout(() => {
            if (!intentarInicializarChat()) {
                console.log('🔧 Falló inicialización automática, forzando creación manual...');
                if (window.MAIRAChat?.forzarCreacionContenedores) {
                    window.MAIRAChat.forzarCreacionContenedores();
                }
            }
        }, 1000);
        return;
    }
    
    // SI NO ESTÁ LISTO, ESPERAR CON REINTENTOS
    console.log('⏳ Esperando conexión del gestorComunicacion...');
    
    let intentos = 0;
    const maxIntentos = 15; // Reducir intentos porque debería funcionar rápido
    
    const intervalo = setInterval(() => {
        intentos++;
        console.log(`🔄 Intento ${intentos}/${maxIntentos} de inicializar MAIRAChat...`);
        
        if (intentarInicializarChat()) {
            clearInterval(intervalo);
            console.log('🎉 MAIRAChat inicializado exitosamente');
        } else if (intentos >= maxIntentos) {
            clearInterval(intervalo);
            console.error('❌ Timeout: MAIRAChat no se pudo inicializar automáticamente');
            
            // ÚLTIMO RECURSO: Forzar creación manual
            console.log('🔧 Intentando inicialización manual como último recurso...');
            if (window.MAIRAChat?.forzarCreacionContenedores) {
                const exito = window.MAIRAChat.forzarCreacionContenedores();
                if (exito) {
                    console.log('✅ MAIRAChat inicializado manualmente');
                } else {
                    console.error('❌ Falló la inicialización manual de MAIRAChat');
                }
            }
        }
    }, 500); // Reducir intervalo a 500ms
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 1. Intentar recuperar datos de sessionStorage primero
        const datosSession = sessionStorage.getItem('datosPartidaActual');
        let datosPartida, userId, userName;

        console.log('🔍 DEBUG - datosSession existe:', !!datosSession);

        if (datosSession) {
            const datos = JSON.parse(datosSession);
            console.log('📦 Datos recuperados de sessionStorage:', datos);
            console.log('🔍 DEBUG - partidaActual jugadores:', datos.partidaActual?.jugadores?.length);
            datosPartida = datos.partidaActual;
            userId = datos.userId;
            userName = datos.userName;
        } else {
            console.log('📦 No hay datosPartidaActual en sessionStorage, buscando alternativas');
            // 2. Si no hay datos en session, buscar en localStorage
            let datosPartidaStr = localStorage.getItem('datosPartida');
            
            console.log('🔍 DEBUG - datosPartida en localStorage:', !!datosPartidaStr);
            
            if (datosPartidaStr) {
                const datosPartidaTemp = JSON.parse(datosPartidaStr);
                console.log('📦 datosPartida encontrado:', datosPartidaTemp);
                console.log('🔍 DEBUG - jugadores en datosPartida:', datosPartidaTemp.jugadores?.length || 0);
                
                // ✅ VERIFICAR: Si datosPartida no tiene jugadores SUFICIENTES, usar configuracionPartidaLocal
                const configLocalStr = localStorage.getItem('configuracionPartidaLocal');
                let configLocal = null;
                if (configLocalStr) {
                    configLocal = JSON.parse(configLocalStr);
                }
                
                // Si configuracionPartidaLocal tiene MÁS jugadores que datosPartida, usar configLocal
                const jugadoresDataPartida = datosPartidaTemp.jugadores?.length || 0;
                const jugadoresConfigLocal = configLocal?.jugadores?.length || 0;
                
                console.log(`🔍 Comparando jugadores: datosPartida=${jugadoresDataPartida}, configLocal=${jugadoresConfigLocal}`);
                
                if (jugadoresConfigLocal > jugadoresDataPartida && jugadoresConfigLocal > 1) {
                    console.log('✅ FORZANDO uso de configuracionPartidaLocal porque tiene más jugadores');
                    console.log(`📊 datosPartida tenía ${jugadoresDataPartida} jugadores, configLocal tiene ${jugadoresConfigLocal}`);
                    // Usar configuracionPartidaLocal que tiene los jugadores correctos
                    datosPartida = {
                        codigo: 'LOCAL_FALLBACK_' + Date.now(),
                        configuracion: configLocal,
                        modo: 'local',
                        estado: 'iniciada',
                        creadorId: configLocal.jugadores[0]?.id || 'local_player_1',
                        jugadores: configLocal.jugadores
                    };
                    
                    console.log('✅ DEBUG - NUEVO datosPartida creado con', datosPartida.jugadores?.length, 'jugadores');
                    console.log('✅ DEBUG - Jugadores:', datosPartida.jugadores.map(j => ({id: j.id, nombre: j.nombre})));
                    userId = configLocal.jugadores[0]?.id || 'local_player_1';
                    userName = configLocal.jugadores[0]?.nombre || 'Jugador Local';
                    
                    // Limpiar datosPartida corrupto del localStorage para evitar futuros conflictos
                    localStorage.removeItem('datosPartida');
                    console.log('🧹 Limpiado datosPartida corrupto del localStorage');
                } else if (!datosPartidaTemp.jugadores || datosPartidaTemp.jugadores.length === 0) {
                    console.log('⚠️ datosPartida sin jugadores, buscando configuracionPartidaLocal...');
                    if (configLocal) {
                        console.log('🏠 Configuración LOCAL con jugadores encontrada:', configLocal);
                        console.log('🔍 DEBUG - Jugadores en configLocal:', configLocal.jugadores?.length);
                        
                        // Usar configuracionPartidaLocal que tiene los jugadores correctos
                        datosPartida = {
                            codigo: 'LOCAL_FALLBACK_' + Date.now(),
                            configuracion: configLocal,
                            modo: 'local',
                            estado: 'iniciada',
                            creadorId: configLocal.jugadores[0]?.id || 'local_player_1',
                            jugadores: configLocal.jugadores
                        };
                        
                        console.log('✅ DEBUG - Usando configLocal, jugadores:', datosPartida.jugadores?.length);
                        userId = configLocal.jugadores[0]?.id || 'local_player_1';
                        userName = configLocal.jugadores[0]?.nombre || 'Jugador Local';
                    } else {
                        throw new Error('No se encontraron jugadores válidos en configuración local');
                    }
                } else {
                    // datosPartida tiene jugadores válidos
                    datosPartida = datosPartidaTemp;
                    userId = localStorage.getItem('userId');
                    userName = localStorage.getItem('username');
                }
            } else {
                // 3. Si no hay datosPartida, buscar configuracionPartidaLocal (modo local)
                console.log('📦 Buscando configuracionPartidaLocal...');
                const configLocalStr = localStorage.getItem('configuracionPartidaLocal');
                if (configLocalStr) {
                    const configLocal = JSON.parse(configLocalStr);
                    console.log('🏠 Configuración LOCAL recuperada:', configLocal);
                    console.log('🔍 DEBUG - Jugadores en configLocal:', configLocal.jugadores);
                    console.log('🔍 DEBUG - Cantidad de jugadores:', configLocal.jugadores?.length);
                    
                    // Crear estructura compatible con datosPartida
                    datosPartida = {
                        codigo: 'LOCAL_FALLBACK_' + Date.now(),
                        configuracion: configLocal,
                        modo: 'local',
                        estado: 'iniciada',
                        creadorId: configLocal.jugadores[0]?.id || 'local_player_1',
                        jugadores: configLocal.jugadores
                    };
                    
                    console.log('🔍 DEBUG - datosPartida.jugadores creado:', datosPartida.jugadores);
                    
                    // Asignar usuario como el primer jugador
                    userId = configLocal.jugadores[0]?.id || 'local_player_1';
                    userName = configLocal.jugadores[0]?.nombre || 'Jugador Local';
                } else {
                    throw new Error('No se encontraron los datos de la partida');
                }
            }
        }

        console.log('Datos de partida recuperados:', datosPartida);

        // Asegurarse de que datosPartida tenga una estructura válida
        if (!datosPartida.configuracion) {
            datosPartida.configuracion = {};
        }

        // Procesar y validar la duración del turno
        let duracionTurno;
        if (datosPartida.configuracion.duracionTurno) {
            duracionTurno = parseInt(datosPartida.configuracion.duracionTurno);
            if (duracionTurno < 100) { // Asumimos que si es menor a 100 está en minutos
                duracionTurno *= 60;
            }
        } else {
            duracionTurno = 300; // 5 minutos por defecto en segundos
        }

        // Determinar el modo de juego
        const urlParams = new URLSearchParams(window.location.search);
        const codigoPartida = urlParams.get('codigo');
        const modoJuego = codigoPartida ? 'online' : 'local';

        // Crear configuración con valores por defecto y validados
        const configuracion = {
            modoJuego: modoJuego,
            jugadores: datosPartida.jugadores || [],
            duracionTurno: duracionTurno,
            urlServidor: SERVER_URL,
            centro: [-34.9964963, -64.9672817],
            zoom: 4,
            partidaCodigo: codigoPartida,
            configuracionOriginal: datosPartida.configuracion,
            nombrePartida: datosPartida.configuracion.nombrePartida || 'Partida sin nombre',
            objetivoPartida: datosPartida.configuracion.objetivoPartida || 'No definido'
         };

        // 🔍 DEBUG ESPECÍFICO: Rastrear jugadores
        console.log('🔍 DEBUG JUGADORES EN CONFIGURACIÓN:');
        console.log('  datosPartida.jugadores:', datosPartida.jugadores);
        console.log('  configuracion.jugadores:', configuracion.jugadores);
        console.log('  cantidad jugadores:', configuracion.jugadores?.length);

        console.log('Configuración preparada para inicialización:', configuracion);

        // Validar datos críticos
        if (!Array.isArray(configuracion.jugadores) || configuracion.jugadores.length === 0) {
            throw new Error('No hay jugadores definidos en la partida');
        }

        if (!userId || !userName) {
            throw new Error('No se encontraron las credenciales del usuario');
        }

        // Establecer variables globales
        window.userId = userId;
        window.userName = userName;
        window.partidaActual = datosPartida;

        // Inicializar el juego
        window.juego = new GestorJuego();
        await window.juego.inicializar(configuracion);

    } catch (error) {
        console.error('Error al inicializar el juego:', error);
        console.error('Stack:', error.stack);
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = `Error al iniciar el juego: ${error.message}`;
            errorContainer.style.display = 'block';
        }
    }
});




async function cargarDatosPartida() {
    // Intentar recuperar datos de sessionStorage primero
    const datosSession = sessionStorage.getItem('datosPartidaActual');
    if (datosSession) {
        const datos = JSON.parse(datosSession);
        sessionStorage.removeItem('datosPartidaActual');
        return datos.partidaActual;
    }

    // Si no hay datos en session, usar localStorage
    const datosPartidaStr = localStorage.getItem('datosPartida');
    if (!datosPartidaStr) {
        throw new Error('No se encontraron los datos de la partida');
    }
    return JSON.parse(datosPartidaStr);
}

function setVariablesGlobales(datosPartida) {
    window.userId = localStorage.getItem('userId');
    window.userName = localStorage.getItem('username');
    window.partidaActual = datosPartida;
    window.configuracionPartida = datosPartida.configuracion;
    window.jugadoresPartida = datosPartida.jugadores;
    window.estadoPartida = datosPartida.estado || 'iniciada';

    if (!window.userId || !window.userName) {
        throw new Error('No se encontraron las credenciales del usuario');
    }
}

function prepararConfiguracion(datosPartida) {
    if (!datosPartida?.configuracion) {
        console.warn('Usando configuración por defecto');
        return {
            modo: 'local',
            duracionTurno: [],
            jugadores: [],
            modoJuego: 'local'
        };
    }

    return {
        ...datosPartida.configuracion,
        jugadores: datosPartida.jugadores || [],
        modoJuego: datosPartida.configuracion.modo || 'local',
        codigoPartida: datosPartida.codigo
    };
}

async function gestionarPartidaOnline(datosPartida) {
    const codigoPartida = new URLSearchParams(window.location.search).get('codigo');
    if (!codigoPartida) throw new Error('Código de partida no encontrado');

    const jugadorActual = await obtenerJugadorActual(datosPartida, codigoPartida);
    window.equipoJugador = jugadorActual.equipo;

    // Unirse a las salas necesarias
    const socket = window.juego.gestorComunicacion?.socket;
    if (socket) {
        socket.emit('unirseAPartidaJuego', {
            codigo: codigoPartida,
            userId: window.userId,
            username: window.userName,
            equipo: window.equipoJugador
        });
        socket.emit('joinRoom', codigoPartida);
        socket.emit('joinRoom', `equipo_${window.equipoJugador}`);
        socket.emit('obtenerTiempoServidor', { codigo: codigoPartida });
    }
}



function validarDespliegueUnidad() {
    // Validar fase
    if (window.gestorJuego.gestorFases.fase !== 'preparacion' || 
        window.gestorJuego.gestorFases.subfase !== 'despliegue') {
        window.gestorJuego.gestorInterfaz.mostrarMensaje('Solo se pueden agregar unidades en la fase de despliegue', 'error');
        return false;
    }

    // Validar equipo
    if (!window.equipoJugador) {
        window.gestorJuego.gestorInterfaz.mostrarMensaje('Debes tener un equipo asignado para desplegar unidades', 'error');
        return false;
    }

    return true;
}

async function obtenerJugadorActual(datosPartida, codigoPartida) {
    let jugadorActual = datosPartida.jugadores?.find(j => j.id.toString() === window.userId.toString());
    
    if (!jugadorActual) {
        console.log('Solicitando información del jugador al servidor...');
        jugadorActual = await new Promise((resolve, reject) => {
            const socket = window.juego.gestorComunicacion?.socket;
            if (!socket) reject(new Error('No hay conexión con el servidor'));

            socket.emit('obtenerInfoJugador', {
                codigo: codigoPartida,
                userId: window.userId
            });

            socket.once('infoJugador', resolve);
            socket.once('error', reject);
            setTimeout(() => reject(new Error('Tiempo de espera agotado')), 10000);
        });
    }
    
    return jugadorActual;
}

function mostrarError(error) {
    console.error(error);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = `Error al iniciar el juego: ${error.message}`;
        errorContainer.style.display = 'block';
    }
}

