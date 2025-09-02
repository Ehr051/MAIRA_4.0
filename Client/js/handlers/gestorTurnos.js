// gestorTurnos.js

// Constantes para evitar strings mágicos
const FASES = {
    PREPARACION: 'preparacion',
    COMBATE: 'combate'
};

const SUBFASES = {
    DEFINICION_SECTOR: 'definicion_sector',
    DEFINICION_ZONAS: 'definicion_zonas',
    DESPLIEGUE: 'despliegue'
};

const MODOS_JUEGO = {
    LOCAL: 'local',
    ONLINE: 'online'
};

// Logger condicional para optimizar en producción
const logger = {
    debug: (...args) => {
        if (typeof window !== 'undefined' && window.DEBUG_MODE) {
            console.log('[GestorTurnos]', ...args);
        }
    },
    warn: (...args) => console.warn('[GestorTurnos]', ...args),
    error: (...args) => console.error('[GestorTurnos]', ...args),
    info: (...args) => console.log('[GestorTurnos]', ...args)
};

class GestorTurnos extends GestorBase {
    constructor() {
        super();
        this.socket = null; // Agregar esta línea
        this.jugadores = [];
        this.fase = 'preparacion';
        this.subfase = 'definicion_sector';
        this.director = null;
        this.directorTemporal = null;
        this.turnoActual = 1;
        this.jugadorActualIndex = 0;
        this.tiempoRestante = 0;
        this.intervalReloj = null;
        this.eventos = new EventEmitter();
        this.zonasDefinidas = false;
        this.todosListosParaDespliegue = false;
    }

    async inicializar(configuracion) {
        try {
            // Validar configuración
            this.validarConfiguracion(configuracion);
            
            // ✅ GUARDAR CONFIGURACIÓN
            this.configuracion = configuracion;
            
            // ✅ DETECTAR MODO DE JUEGO
            this.modoJuego = configuracion.modoJuego || MODOS_JUEGO.ONLINE;
            console.log('🎮 GestorTurnos inicializado en modo:', this.modoJuego);
            
            // Configurar jugadores
            this.jugadores = configuracion.jugadores;
            this.duracionTurno = configuracion.duracionTurno || 300; // 5 minutos por defecto
            
            // Establecer director
            this.establecerDirector();

            // Inicializar estados de jugadores
            this.inicializarEstadosJugadores();
            
            // Configurar eventos
            this.configurarEventos();

            return true;
        } catch (error) {
            console.error('Error al inicializar GestorTurnos:', error);
            return false;
        }
    }

    validarConfiguracion(config) {
        // Verificar campos mínimos necesarios
        if (!config) {
            throw new Error('La configuración es requerida');
        }
    
        console.log('Validando configuración en GestorTurnos:', config);
    
        // Validar jugadores de forma más flexible
        if (!Array.isArray(config.jugadores)) {
            config.jugadores = [];
        }
    
        // Validar y ajustar duración del turno (en segundos)
        let duracionTurno = parseInt(config.duracionTurno);
        
        if (isNaN(duracionTurno)) {
            duracionTurno = 300; // 5 minutos por defecto en segundos
        } else if (duracionTurno < 30) { // Si es menor a 30 segundos
            duracionTurno = 300; // Usar valor por defecto
        } else if (duracionTurno > 3600) { // Si es mayor a 1 hora
            duracionTurno = 3600; // Limitar a 1 hora
        }
    
        // Actualizar la configuración con el valor validado
        config.duracionTurno = duracionTurno;
    
        console.log('Configuración validada:', config);
        return true;
    }

    establecerDirector() {
        this.director = this.jugadores.find(j => j.rol === 'director');
        this.esDirectorTemporal = !this.director;
        
        if (this.esDirectorTemporal) {
            this.primerJugador = this.jugadores.find(j => j.equipo === 'azul') || this.jugadores[0];
            this.primerJugador.rolTemporal = 'director';
            this.directorTemporalEquipo = this.primerJugador.equipo;
            console.log('Director temporal establecido:', this.primerJugador.nombre);
        }
    }

    inicializarEstadosJugadores() {
        this.jugadores.forEach(jugador => {
            jugador.listo = false;
            jugador.despliegueListo = false;
            jugador.turnosCompletados = 0;
        });
    }

    actualizarSegunFase(fase, subfase) {
        console.log(`[GestorTurnos] Actualizando según fase: ${fase}/${subfase}, modo: ${this.modoJuego}`);
        this.fase = fase;
        this.subfase = subfase;
        
        if (fase === 'preparacion') {
            if (subfase === 'despliegue' && this.modoJuego === MODOS_JUEGO.LOCAL) {
                // ✅ MODO LOCAL: Iniciar turnos para despliegue SIN RELOJ
                console.log('🎮 Modo local: iniciando turnos para despliegue sin límite de tiempo');
                this.modoDespliegue = true;
                this.turnoActual = 1;
                this.jugadorActualIndex = 0;
                // ❌ NO INICIAR RELOJ EN DESPLIEGUE
                this.detenerReloj();
                
                // Emitir evento de inicio de turnos
                this.eventos.emit('inicioTurnos', {
                    turnoActual: this.turnoActual,
                    jugadorActual: this.obtenerJugadorActual(),
                    timestamp: new Date().toISOString()
                });
            } else {
                // Durante otras fases de preparación no hay turnos activos
                this.detenerReloj();
                this.turnoActual = 0; // Indicar que no hay turno activo
                
                if (subfase === 'despliegue') {
                    // En despliegue online todos pueden actuar simultáneamente
                    this.modoDespliegue = true;
                }
            }
        } else if (fase === 'combate') {
            // Iniciar sistema de turnos para fase de combate
            this.modoDespliegue = false;
            this.turnoActual = 1;
            this.iniciarReloj();
        }
        
        this.gestorJuego?.gestorInterfaz?.actualizarInterfazCompleta();
    }

    obtenerJugadorActual() {
        if (this.fase === 'preparacion') {
            if (this.subfase === 'definicion_sector' || this.subfase === 'definicion_zonas') {
                // En definición de sectores/zonas, solo el director puede actuar
                return this.director || this.primerJugador;
            }
            
            // ✅ MODO LOCAL: En despliegue local, SÍ hay jugador actual (turnos)
            if (this.subfase === 'despliegue' && this.modoJuego === MODOS_JUEGO.LOCAL) {
                return this.jugadores[this.jugadorActualIndex] || null;
            }
            
            // En despliegue online no hay jugador "actual", todos pueden actuar
            return null;
        }
        
        // En fase de combate, retornar el jugador del turno actual
        return this.jugadores[this.jugadorActualIndex] || null;
    }

    configurarEventos() {
        if (this.socket) {
            this.socket.on('cambioTurno', (datos) => this.manejarCambioTurnoRemoto(datos));
            this.socket.on('jugadorListoDespliegue', (datos) => this.manejarJugadorListo(datos));
            this.socket.on('iniciarCombate', (datos) => this.manejarInicioCombate(datos));
            this.socket.on('finTurno', (datos) => this.manejarFinTurnoRemoto(datos));
        }
    }

    inicializarTurnos() {
        console.log('🎮 Iniciando sistema de turnos...');
        console.log('🔍 Modo de juego:', this.modoJuego);
        console.log('🔍 Cantidad de jugadores:', this.jugadores.length);
        console.log('🔍 Jugadores:', this.jugadores.map(j => ({id: j.id, nombre: j.nombre, equipo: j.equipo})));
        
        this.turnoActual = 1;
        this.jugadorActualIndex = 0;
        this.tiempoRestante = this.duracionTurno;
        
        const jugadorActual = this.obtenerJugadorActual();
        
        // ✅ MODO LOCAL: Establecer jugador inicial
        if (this.configuracion.modoJuego === MODOS_JUEGO.LOCAL && jugadorActual) {
            window.userId = jugadorActual.id;
            window.equipoJugador = jugadorActual.equipo;
            console.log('🎯 MODO LOCAL - Jugador inicial establecido:', {
                nombre: jugadorActual.nombre,
                userId: window.userId,
                equipo: window.equipoJugador
            });
        }
        
        console.log('🎯 Jugador actual inicial:', jugadorActual);
        
        // Iniciar reloj
        this.iniciarReloj();
        
        // Emitir evento de inicio de turnos
        this.eventos.emit('inicioTurnos', {
            turnoActual: this.turnoActual,
            jugadorActual: this.obtenerJugadorActual(),
            timestamp: new Date().toISOString()
        });
    }
    reiniciarTurnos() {
        this.jugadorActualIndex = 0;
        this.turnoActual = 1;
    }

    iniciarReloj() {
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
        }

        this.tiempoRestante = this.duracionTurno;
        
        this.intervalReloj = setInterval(() => {
            if (this.tiempoRestante > 0) {
                this.tiempoRestante--;
                this.eventos.emit('actualizacionReloj', this.tiempoRestante);
            } else {
                this.finalizarTurnoActual();
            }
        }, 1000);

        this.eventos.emit('inicioCuentaRegresiva', this.tiempoRestante);
    }

    detenerReloj() {
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
            this.intervalReloj = null;
        }
    }

    cambiarTurno() {
        console.log('[GestorTurnos] 🔄 === CAMBIAR TURNO ===');
        
        // Guardar estado del jugador actual
        const jugadorActual = this.obtenerJugadorActual();
        console.log('[GestorTurnos] 👤 Jugador actual antes del cambio:', {
            nombre: jugadorActual?.nombre,
            index: this.jugadorActualIndex,
            turnosCompletados: jugadorActual?.turnosCompletados
        });
        
        if (jugadorActual) {
            jugadorActual.turnosCompletados++;
            console.log('[GestorTurnos] ✅ Incrementado turnosCompletados a:', jugadorActual.turnosCompletados);
        }

        // Avanzar al siguiente jugador
        const siguienteIndex = this.obtenerSiguienteJugadorIndex();
        console.log('[GestorTurnos] ➡️ Cambiando índice de jugador:', {
            anterior: this.jugadorActualIndex,
            siguiente: siguienteIndex
        });
        
        this.jugadorActualIndex = siguienteIndex;
        this.tiempoRestante = this.duracionTurno;

        // ✅ MODO LOCAL: Actualizar window.userId y window.equipoJugador
        if (this.configuracion.modoJuego === MODOS_JUEGO.LOCAL) {
            const nuevoJugadorActual = this.obtenerJugadorActual();
            if (nuevoJugadorActual) {
                console.log('[GestorTurnos] 🏠 MODO LOCAL - Actualizando variables globales:', {
                    anterior: {
                        userId: window.userId,
                        equipo: window.equipoJugador,
                        nombre: jugadorActual?.nombre
                    },
                    nuevo: {
                        userId: nuevoJugadorActual.id,
                        equipo: nuevoJugadorActual.equipo,
                        nombre: nuevoJugadorActual.nombre
                    }
                });
                
                window.userId = nuevoJugadorActual.id;
                window.equipoJugador = nuevoJugadorActual.equipo;
            }
        }

        // Si volvemos al primer jugador, incrementar el número de turno
        if (this.jugadorActualIndex === 0) {
            this.turnoActual++;
            console.log('[GestorTurnos] 🔄 Nuevo ciclo - Turno incrementado a:', this.turnoActual);
        }

        // Emitir evento de cambio de turno
        this.eventos.emit('cambioTurno', {
            jugadorAnterior: jugadorActual,
            jugadorActual: this.obtenerJugadorActual(),
            turno: this.turnoActual,
            timestamp: new Date().toISOString()
        });

        // ✅ Solo iniciar reloj en fase de combate
        if (this.fase === 'combate') {
            this.iniciarReloj();
        } else {
            console.log('🕐 Reloj no iniciado: fase de despliegue');
        }
    }

    obtenerSiguienteJugadorIndex() {
        console.log('[GestorTurnos] 🔍 Calculando siguiente jugador desde index:', this.jugadorActualIndex);
        
        let siguienteIndex = (this.jugadorActualIndex + 1) % this.jugadores.length;
        console.log('[GestorTurnos] ➡️ Índice calculado:', siguienteIndex);

        // Saltar al director si existe y no es su turno específico
        let saltosDirector = 0;
        while (this.director && this.esDirector(this.jugadores[siguienteIndex].id)) {
            console.log('[GestorTurnos] ⏭️ Saltando director en índice:', siguienteIndex);
            siguienteIndex = (siguienteIndex + 1) % this.jugadores.length;
            saltosDirector++;
            
            // Evitar bucle infinito
            if (saltosDirector > this.jugadores.length) {
                console.warn('[GestorTurnos] ⚠️ Bucle infinito evitado en obtenerSiguienteJugadorIndex');
                break;
            }
        }

        console.log('[GestorTurnos] ✅ Siguiente jugador será índice:', siguienteIndex, 'nombre:', this.jugadores[siguienteIndex]?.nombre);
        return siguienteIndex;
    }

    pasarTurno() {
        console.log('[GestorTurnos] 🔄 === INICIO PASAR TURNO ===');
        console.log('[GestorTurnos] 📊 Estado antes del cambio:', {
            jugadorActualIndex: this.jugadorActualIndex,
            totalJugadores: this.jugadores.length,
            jugadorActual: this.obtenerJugadorActual()?.nombre,
            turnoActual: this.turnoActual,
            fase: this.fase,
            subfase: this.subfase
        });
        
        // Cambiar al siguiente jugador
        this.cambiarTurno();
        
        console.log('[GestorTurnos] 📊 Estado después del cambio:', {
            jugadorActualIndex: this.jugadorActualIndex,
            jugadorActual: this.obtenerJugadorActual()?.nombre,
            turnoActual: this.turnoActual
        });
        
        // Actualizar interfaz
        const jugadorActual = this.obtenerJugadorActual();
        if (this.gestorJuego?.gestorInterfaz?.actualizarPanelTurno) {
            console.log('[GestorTurnos] 🖥️ Actualizando panel de turno...');
            this.gestorJuego.gestorInterfaz.actualizarPanelTurno({
                jugadorActual: jugadorActual,
                turno: this.turnoActual,
                fase: this.fase,
                subfase: this.subfase
            });
        }
        
        // Mostrar mensaje de cambio de turno
        if (jugadorActual && this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            console.log('[GestorTurnos] 💬 Mostrando mensaje de cambio de turno...');
            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                `Turno de ${jugadorActual.nombre} (${jugadorActual.equipo})`,
                'info',
                3000
            );
        }
        
        console.log('[GestorTurnos] ✅ === FIN PASAR TURNO ===');
    }

    iniciarFaseCombate() {
        console.log('[GestorTurnos] 🔥 Iniciando fase de combate...');
        
        // Cambiar fase
        this.fase = 'combate';
        this.subfase = 'movimiento';
        this.modoDespliegue = false;
        
        // Reiniciar turnos para combate
        this.turnoActual = 1;
        this.jugadorActualIndex = 0;
        
        // Emitir evento de cambio de fase
        this.eventos.emit('cambioFase', {
            fase: this.fase,
            subfase: this.subfase,
            jugadorActual: this.obtenerJugadorActual(),
            timestamp: new Date().toISOString()
        });
        
        // Iniciar reloj para combate
        this.iniciarReloj();
        
        // Mostrar mensaje
        if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            this.gestorJuego.gestorInterfaz.mostrarMensaje(
                '🔥 ¡Fase de combate iniciada!',
                'success',
                5000
            );
        }
    }

    finalizarTurnoActual(forzado = false) {
        const jugadorActual = this.obtenerJugadorActual();
        
        if (!jugadorActual) {
            console.error('No se pudo obtener el jugador actual');
            return;
        }

        // Emitir evento de fin de turno
        this.eventos.emit('finTurno', {
            jugador: jugadorActual,
            turno: this.turnoActual,
            forzado: forzado,
            timestamp: new Date().toISOString()
        });

        // ✅ VERIFICAR MODO DE JUEGO
        if (this.modoJuego === MODOS_JUEGO.ONLINE && this.socket) {
            // Modo online: notificar al servidor
            this.socket.emit('finTurno', {
                jugadorId: jugadorActual.id,
                turno: this.turnoActual,
                forzado: forzado
            });
            console.log('🌐 Fin de turno enviado al servidor');
        } else {
            // Modo local: cambiar turno directamente
            console.log('🏠 Modo local: cambiando turno directamente');
            this.cambiarTurno();
        }
    }

    marcarJugadorListo() {
        try {
            // 2. Verificar fase correcta
            if (this.fase !== FASES.PREPARACION || this.subfase !== SUBFASES.DESPLIEGUE) {
                console.warn('[GestorTurnos] No se puede marcar como listo: fase incorrecta');
                console.warn(`[GestorTurnos] Fase actual: ${this.fase}, Subfase: ${this.subfase}`);
                return false;
            }
            
            // 3. Obtener jugador actual correcto
            const jugadorActual = this.obtenerJugadorActual();
            if (!jugadorActual) {
                console.error('[GestorTurnos] No se encontró jugador actual');
                return false;
            }
            
            console.log(`[GestorTurnos] Marcando jugador como listo: ${jugadorActual.nombre} (${jugadorActual.id})`);
            
            // 4. En modo local: verificar elementos pero permitir continuar si no hay elementos aún
            if (this.configuracion.modoJuego === MODOS_JUEGO.LOCAL) {
                console.log('🏠 Modo local: verificando elementos...');
                const tieneElementos = this.verificarElementosAntesDeEnviarListo();
                if (!tieneElementos) {
                    console.log('🏠 Modo local: sin elementos, pero permitiendo continuar');
                    // En modo local, permitir marcar como listo incluso sin elementos
                }
            } else {
                // 4. En modo online: verificar elementos antes de continuar (obligatorio)
                if (!this.verificarElementosAntesDeEnviarListo()) {
                    console.warn('No hay elementos válidos para enviar al servidor');
                    if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                        this.gestorJuego.gestorInterfaz.mostrarMensaje(
                            'Debe desplegar al menos un elemento antes de marcar como listo',
                            'error'
                        );
                    }
                    return false;
                }
            }
            
            // 5. Marcar jugador como listo
            jugadorActual.listo = true;
            jugadorActual.despliegueListo = true;
            
            console.log(`✅ Jugador ${jugadorActual.nombre} marcado como listo`);
            
            // 6. En modo online: enviar al servidor
            if (this.configuracion.modoJuego !== MODOS_JUEGO.LOCAL) {
                if (this.gestorJuego?.gestorComunicacion?.socket) {
                    console.log('[GestorTurnos] Enviando estado listo al servidor');
                    this.gestorJuego.gestorComunicacion.socket.emit('jugadorListoDespliegue', {
                        jugadorId: jugadorActual.id,
                        partidaCodigo: window.codigoPartida,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.warn('[GestorTurnos] No hay conexión al servidor disponible');
                }
            } else {
                console.log('🏠 Modo local: no enviando al servidor');
            }
            
            // 7. Actualizar interfaz
            const btnListo = document.getElementById('btn-listo-despliegue');
            if (btnListo) {
                btnListo.disabled = true;
                btnListo.textContent = 'Listo ✓';
                // Verificar que classList existe antes de usarlo
                if (btnListo.classList) {
                    btnListo.classList.add('btn-success');
                }
            }
            
            // 8. En modo local: manejar flujo automático
            if (this.configuracion.modoJuego === MODOS_JUEGO.LOCAL) {
                console.log('[GestorTurnos] 🏠 Modo local: verificando si pasar al siguiente turno');
                console.log('[GestorTurnos] 📊 Estado actual:', {
                    jugadorActualIndex: this.jugadorActualIndex,
                    totalJugadores: this.jugadores.length,
                    jugadorActual: jugadorActual.nombre,
                    jugadoresListos: this.jugadores.map(j => ({ nombre: j.nombre, listo: j.listo }))
                });
                
                // Verificar si todos están listos o es el último jugador
                const todosListos = this.jugadores.every(j => j.listo);
                const esUltimoJugador = this.jugadorActualIndex === (this.jugadores.length - 1);
                
                console.log('[GestorTurnos] 🔍 Verificaciones:', {
                    todosListos,
                    esUltimoJugador,
                    siguienteAccion: todosListos ? 'iniciar combate' : esUltimoJugador ? 'iniciar combate' : 'pasar turno'
                });
                
                if (todosListos) {
                    console.log('[GestorTurnos] ✅ Todos los jugadores listos, iniciando combate');
                    setTimeout(() => this.iniciarFaseCombate(), 1000);
                } else if (esUltimoJugador) {
                    console.log('[GestorTurnos] 🏁 Último jugador completado, iniciando combate');
                    setTimeout(() => this.iniciarFaseCombate(), 1000);
                } else {
                    console.log('[GestorTurnos] ➡️ Pasando al siguiente turno');
                    setTimeout(() => {
                        console.log('[GestorTurnos] 🔄 Ejecutando pasarTurno()...');
                        this.pasarTurno();
                    }, 500);
                }
            }
            
            // 9. Emitir evento para notificar el cambio
            this.emitir('jugadorListo', {
                jugador: jugadorActual,
                todosListos: this.jugadores.every(j => j.listo),
                timestamp: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('[GestorTurnos] Error al marcar jugador como listo:', error);
            if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                this.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Error al marcar como listo: ' + (error.message || 'Error desconocido'),
                    'error'
                );
            }
            return false;
        }
    }
    
    verificarElementosAntesDeEnviarListo() {
        const jugadorId = window.userId;
        if (!jugadorId) {
            console.error('[GestorTurnos] No hay ID de jugador disponible');
            return false;
        }
        
        // Verificar que calcoActivo existe
        if (!window.calcoActivo) {
            console.warn('[GestorTurnos] No hay calco activo disponible');
            return false;
        }
        
        // Obtener y mostrar todos los elementos
        const elementos = [];
        const todosLosElementos = [];
        
        if (window.calcoActivo) {
            window.calcoActivo.eachLayer(layer => {
                // Guardar todos los elementos para debug
                todosLosElementos.push({
                    id: layer.options?.id,
                    tipo: layer.options?.tipo,
                    jugador: layer.options?.jugador,
                    jugadorId: layer.options?.jugadorId,
                    propietario: layer.options?.propietario,
                    equipo: layer.options?.equipo,
                    todas_opciones: layer.options
                });
                
                // Verificar múltiples propiedades que podrían contener el ID del jugador
                if (layer.options && 
                    (layer.options.jugadorId === jugadorId || 
                     layer.options.jugador === jugadorId ||
                     layer.options.propietario === jugadorId)) {
                    elementos.push(layer);
                }
            });
        }
        
        console.group(`[Diagnóstico] Elementos para jugador ${jugadorId} antes de marcar como listo`);
        console.log(`Total elementos en mapa: ${todosLosElementos.length}`);
        console.log(`Elementos del jugador: ${elementos.length}`);
        console.log('Todos los elementos en el mapa:', todosLosElementos);
        
        elementos.forEach((elem, i) => {
            const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
            console.log(`Elemento #${i+1} del jugador:`, {
                id: elem.options?.id,
                tipo: elem.options?.tipo,
                designacion: elem.options?.designacion,
                dependencia: elem.options?.dependencia,
                magnitud: elem.options?.magnitud,
                sidc: elem.options?.sidc,
                jugador: elem.options?.jugador,
                jugadorId: elem.options?.jugadorId,
                propietario: elem.options?.propietario,
                esEquipo
            });
        });
        
        console.groupEnd();
        return elementos.length > 0;
    }
    
    esJugadorActual(jugadorId) {
        const jugadorActual = this.obtenerJugadorActual();
        return jugadorActual && jugadorActual.id === jugadorId;
    }

    esDirector(jugadorId) {
        // Verificar director real
        if (this.director && this.director.id === jugadorId) {
            return true;
        }
        
        // Verificar director temporal (en modo local sin director designado)
        if (this.esDirectorTemporal && this.primerJugador && this.primerJugador.id === jugadorId) {
            return true;
        }
        
        return false;
    }

    puedeActuar(jugadorId) {
        // En fase de preparación todos pueden actuar en su turno
        if (this.fase === 'preparacion') {
            return true;
        }

        // En fase de combate solo el jugador actual puede actuar
        return this.esJugadorActual(jugadorId);
    }

    // Manejadores de eventos remotos (SOLO PARA MODO ONLINE)
    manejarCambioTurnoRemoto(datos) {
        // Solo procesar si estamos en modo online
        if (this.modoJuego !== MODOS_JUEGO.ONLINE) {
            console.warn('[GestorTurnos] Ignorando cambio de turno remoto en modo local');
            return;
        }
        
        console.log('[GestorTurnos] 🌐 Procesando cambio de turno remoto:', datos);
        
        this.jugadorActualIndex = this.jugadores.findIndex(j => j.id === datos.jugadorActualId);
        
        if (this.jugadorActualIndex === -1) {
            console.error('[GestorTurnos] Jugador no encontrado:', datos.jugadorActualId);
            return;
        }
        
        // Actualizar turno actual si viene en los datos
        if (datos.turno) {
            this.turnoActual = datos.turno;
        }
        
        // Emitir evento local para actualizar interfaz
        this.eventos.emit('cambioTurno', {
            jugadorActual: this.obtenerJugadorActual(),
            turno: this.turnoActual,
            remoto: true,
            timestamp: new Date().toISOString()
        });
    }

    manejarJugadorListoDespliegue(datos) {
        const jugador = this.jugadores.find(j => j.id === datos.jugadorId);
        if (!jugador) return;
        
        // Marcar jugador como listo
        jugador.despliegueListo = true;
        
        // Emitir evento local
        this.eventos.emit('jugadorListoDespliegue', datos);
    
        // Verificar si todos están listos para iniciar combate
        if (this.todosJugadoresListos() && 
            (this.esDirector(window.userId) || 
            (this.esDirectorTemporal && this.primerJugador.id === window.userId))) {
            
            this.gestorJuego?.gestorComunicacion?.socket.emit('iniciarCombate', {
                partidaCodigo: window.codigoPartida,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    todosJugadoresListos() {
        if (this.configuracion.modoJuego === MODOS_JUEGO.LOCAL) {
            // En modo local, verificar si todos han tenido su turno y marcado listo
            return this.jugadores.every(j => j.despliegueListo);
        } else {
            // En modo online, verificar normalmente
            return this.jugadores.every(j => j.despliegueListo);
        }
    }

    manejarFinTurnoRemoto(datos) {
        // Solo procesar si coincide con el turno actual
        if (datos.turno === this.turnoActual) {
            this.cambiarTurno();
        }
    }

    obtenerEstadoTurnos() {
        return {
            fase: this.fase,
            subfase: this.subfase,
            turnoActual: this.turnoActual,
            jugadorActualIndex: this.jugadorActualIndex,
            tiempoRestante: this.tiempoRestante,
            jugadores: this.jugadores.map(j => ({
                id: j.id,
                nombre: j.nombre,
                equipo: j.equipo,
                listo: j.listo,
                turnosCompletados: j.turnosCompletados
            }))
        };
    }

    destruir() {
        // Limpiar interval del reloj
        if (this.intervalReloj) {
            clearInterval(this.intervalReloj);
            this.intervalReloj = null;
        }

        // Limpiar eventos del socket
        if (this.socket) {
            this.socket.off('cambioTurno');
            this.socket.off('jugadorListo');
            this.socket.off('finTurno');
        }

        // Llamar al destruir del padre
        super.destruir();
    }

    // ✅ FUNCIÓN CRÍTICA FALTANTE: iniciarFaseCombate()
    iniciarFaseCombate() {
        console.log('[GestorFases] 🎯 INICIANDO FASE DE COMBATE');
        
        try {
            // 1. Cambiar fase del juego
            this.fase = 'combate';
            this.subfase = 'movimiento';
            this.turnoActual = 1;
            this.jugadorActualIndex = 0;
            
            // 2. Notificar a gestorFases el cambio de fase
            if (this.gestorJuego?.gestorFases?.cambiarFase) {
                console.log('[GestorFases] Notificando cambio a fase de combate');
                this.gestorJuego.gestorFases.cambiarFase('combate', 'movimiento');
            }
            
            // 3. Actualizar interfaz
            this.actualizarInterfazFase();
            
            // 4. Emitir al servidor
            if (this.gestorJuego?.gestorComunicacion?.socket) {
                console.log('[GestorFases] Enviando iniciarCombate al servidor');
                this.gestorJuego.gestorComunicacion.socket.emit('iniciarCombate', {
                    partidaCodigo: window.codigoPartida,
                    fase: 'combate',
                    turno: this.turnoActual,
                    timestamp: new Date().toISOString()
                });
            }
            
            // 5. Iniciar sistema de turnos
            this.iniciarTurnos();
            
            console.log('[GestorFases] ✅ Fase de combate iniciada exitosamente');
            
        } catch (error) {
            console.error('[GestorFases] ❌ Error iniciando fase de combate:', error);
        }
    }

    // ✅ FUNCIÓN CRÍTICA: iniciarTurnos()
    iniciarTurnos() {
        console.log('[GestorTurnos] 🎮 INICIANDO SISTEMA DE TURNOS');
        
        try {
            // 1. Configurar primer turno
            this.turnoActual = 1;
            this.jugadorActualIndex = 0;
            this.tiempoRestante = this.duracionTurno; // Usar la duración configurada
            
            // 2. Actualizar interfaz
            this.actualizarInterfazTurno();
            
            // 3. Mostrar mensaje de inicio
            if (this.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                this.gestorJuego.gestorInterfaz.mostrarMensaje(
                    `¡Combate iniciado! Turno ${this.turnoActual} - ${this.obtenerJugadorActual()?.nombre || 'Jugador'}`,
                    'info'
                );
            }
            
            // 4. Iniciar reloj de combate
            this.iniciarReloj();
            
            console.log('[GestorTurnos] ✅ Sistema de turnos iniciado');
            
        } catch (error) {
            console.error('[GestorTurnos] ❌ Error iniciando turnos:', error);
        }
    }

    // ✅ FUNCIÓN: actualizarInterfazFase()
    actualizarInterfazFase() {
        try {
            // Actualizar indicador de fase
            const indicadorFase = document.getElementById('indicador-fase');
            if (indicadorFase) {
                indicadorFase.textContent = `Fase: ${this.fase.toUpperCase()}`;
                indicadorFase.className = `indicador-fase fase-${this.fase}`;
            }
            
            // Ocultar botones de despliegue
            const botonesDespliegue = document.querySelectorAll('.btn-despliegue');
            botonesDespliegue.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Mostrar controles de combate
            const controlesCombate = document.getElementById('controles-combate');
            if (controlesCombate) {
                controlesCombate.style.display = 'block';
            }
            
            console.log('[GestorFases] Interfaz actualizada para fase:', this.fase);
            
        } catch (error) {
            console.error('[GestorFases] Error actualizando interfaz:', error);
        }
    }

    // ✅ FUNCIÓN: actualizarInterfazTurno()
    actualizarInterfazTurno() {
        try {
            const jugadorActual = this.obtenerJugadorActual();
            
            // Actualizar indicador de turno
            const indicadorTurno = document.getElementById('indicador-turno');
            if (indicadorTurno) {
                indicadorTurno.textContent = `Turno ${this.turnoActual} - ${jugadorActual?.username || 'Desconocido'}`;
            }
            
            // Actualizar timer
            const timer = document.getElementById('timer-turno');
            if (timer) {
                timer.textContent = this.formatearTiempo(this.tiempoRestante);
            }
            
            // Habilitar/deshabilitar controles según el jugador
            const esmiTurno = this.esJugadorActual(window.userId);
            const botonesAccion = document.querySelectorAll('.btn-accion');
            botonesAccion.forEach(btn => {
                btn.disabled = !esmiTurno;
            });
            
            console.log('[GestorTurnos] Interfaz actualizada - Turno:', this.turnoActual, 'Jugador:', jugadorActual?.username);
            
        } catch (error) {
            console.error('[GestorTurnos] Error actualizando interfaz de turno:', error);
        }
    }

    // ✅ FUNCIÓN: iniciarTimer()
    iniciarTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.tiempoRestante--;
            
            // Actualizar display del timer
            const timer = document.getElementById('timer-turno');
            if (timer) {
                timer.textContent = this.formatearTiempo(this.tiempoRestante);
            }
            
            // Si se acaba el tiempo, cambiar turno automáticamente
            if (this.tiempoRestante <= 0) {
                console.log('[GestorTurnos] ⏰ Tiempo agotado, cambiando turno automáticamente');
                this.cambiarTurno();
            }
        }, 1000);
    }

    // ✅ FUNCIÓN: formatearTiempo()
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos}:${segs.toString().padStart(2, '0')}`;
    }

    // ✅ MÉTODO FALTANTE: validarElementosJugador()
    validarElementosJugador(jugadorId) {
        try {
            // Buscar elementos del jugador en el mapa
            const elementos = [];
            
            if (window.mapa && window.mapa.eachLayer) {
                window.mapa.eachLayer(layer => {
                    if (layer.options && (
                        layer.options.jugadorId === jugadorId ||
                        layer.options.propietario === jugadorId ||
                        (window.equipoJugador && layer.options.equipo === window.equipoJugador)
                    )) {
                        elementos.push(layer);
                    }
                });
            }

            console.log(`[Diagnóstico] Elementos para jugador ${jugadorId} antes de marcar como listo`);
            console.log('Total elementos:', elementos.length);
            
            if (elementos.length === 0) {
                console.warn('[GestorTurnos] No hay elementos desplegados para el jugador');
                return false;
            }

            // Verificar que cada elemento tenga datos completos
            for (let i = 0; i < elementos.length; i++) {
                const elem = elementos[i];
                const datos = elem.options;
                
                console.log(`Elemento #${i + 1}:`, {
                    id: datos.id,
                    tipo: datos.tipo || datos.nombre,
                    designacion: datos.designacion,
                    dependencia: datos.dependencia,
                    magnitud: datos.magnitud,
                    equipo: datos.equipo
                });

                if (!datos.tipo && !datos.nombre) {
                    console.warn('[GestorTurnos] Elemento sin tipo:', datos);
                    return false;
                }
                
                // ✅ VALIDACIÓN REQUERIDA: tipo, designación, magnitud, y propietario
                
                // 1. Verificar que tenga TIPO definido
                if (!datos.tipo && !datos.nombre) {
                    console.warn('[GestorTurnos] Elemento sin tipo:', datos);
                    return false;
                }
                
                // 2. Verificar que tenga DESIGNACIÓN
                if (!datos.designacion || datos.designacion.trim() === '') {
                    console.warn('[GestorTurnos] Elemento sin designación:', datos);
                    return false;
                }
                
                // 3. Verificar que tenga MAGNITUD
                if (!datos.magnitud || datos.magnitud.trim() === '') {
                    console.warn('[GestorTurnos] Elemento sin magnitud:', datos);
                    return false;
                }
                
                // 4. Verificar que tenga PROPIETARIO asignado
                if (!datos.jugador && !datos.jugadorId && !datos.propietario) {
                    console.warn('[GestorTurnos] Elemento sin propietario:', datos);
                    return false;
                }
                
                console.log('[GestorTurnos] ✅ Elemento válido - tiene tipo, designación, magnitud y propietario');
                
                // Validación adicional para modo online
                if (this.configuracion.modoJuego !== 'local') {
                    if (!datos.dependencia || datos.dependencia.trim() === '') {
                        console.warn('[GestorTurnos] Elemento sin dependencia (requerida en modo online):', datos);
                        return false;
                    }
                }
            }

            console.log('[GestorTurnos] ✅ Todos los elementos validados correctamente');
            return true;
            
        } catch (error) {
            console.error('[GestorTurnos] Error validando elementos:', error);
            return false;
        }
    }

    // Método para obtener el ID del jugador que debe poseer los elementos
    obtenerJugadorPropietario() {
        if (this.modoJuego === MODOS_JUEGO.LOCAL) {
            // En modo local, usar el jugador del turno actual
            const jugadorActual = this.obtenerJugadorActual();
            return jugadorActual?.id || jugadorActual;
        } else {
            // En modo online, usar el userId normal
            return window.userId;
        }
    }
}

// Exportar la clase
window.GestorTurnos = GestorTurnos;