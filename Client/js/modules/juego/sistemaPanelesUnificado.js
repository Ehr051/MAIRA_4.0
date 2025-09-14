/**
 * Sistema de Paneles Unificado - MAIRA 4.0
 * Centraliza y organiza toda la interfaz de juego
 */

class SistemaPanelesUnificado {
    constructor() {
        this.paneles = {
            superior: null,
            lateral: null,
            inferior: null,
            derecho: null,
            notificaciones: null
        };
        
        this.estado = {
            fase: 'preparacion',
            subfase: 'definicion_sector',
            turno: 1,
            jugadorActual: null,
            elementos: {},
            notificaciones: []
        };
        
        this.configuracion = {
            autoOcultar: true,
            animaciones: true,
            posicionPersistente: true
        };
        
        this.inicializar();
    }
    
    inicializar() {
        console.log('[SistemaPaneles] 🎨 Inicializando sistema de paneles unificado');
        
        this.crearEstructuraHTML();
        this.configurarEventos();
        this.cargarConfiguracion();
        this.integrarConGestores();
        
        console.log('[SistemaPaneles] ✅ Sistema de paneles inicializado');
    }
    
    integrarConGestores() {
        // Esperar a que se inicialicen los gestores
        setTimeout(() => {
            if (window.gestorJuego) {
                console.log('[SistemaPaneles] 🔗 Integrando con gestores existentes');
                
                // Integrar con gestorInterfaz
                if (window.gestorJuego.gestorInterfaz) {
                    this.gestorInterfaz = window.gestorJuego.gestorInterfaz;
                    console.log('[SistemaPaneles] ✅ Integrado con gestorInterfaz');
                }
                
                // Integrar con gestorFases
                if (window.gestorJuego.gestorFases) {
                    this.gestorFases = window.gestorJuego.gestorFases;
                    this.actualizarEstadoFase();
                    console.log('[SistemaPaneles] ✅ Integrado con gestorFases');
                }
                
                // Integrar con gestorTurnos
                if (window.gestorJuego.gestorTurnos) {
                    this.gestorTurnos = window.gestorJuego.gestorTurnos;
                    this.actualizarEstadoTurno();
                    console.log('[SistemaPaneles] ✅ Integrado con gestorTurnos');
                }
                
                // Escuchar eventos de los gestores
                this.configurarEventosGestores();
            }
        }, 2000);
    }
    
    crearEstructuraHTML() {
        // Verificar si ya existe el contenedor para evitar duplicados
        let contenedor = document.getElementById('sistemaPanelesUnificado');
        if (contenedor) {
            console.log('[SistemaPaneles] ⚠️ Sistema ya existe, limpiando...');
            contenedor.remove();
        }
        
        // Usar el contenedor existente en el HTML o crear uno nuevo
        contenedor = document.getElementById('sistemaPanelesContainer');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'sistemaPanelesContainer';
            contenedor.className = 'sistema-paneles-container';
            document.body.appendChild(contenedor);
        }
        
        // Limpiar contenido previo
        contenedor.innerHTML = '';
        
        // Crear el sistema de paneles dentro del contenedor
        const sistemaPaneles = document.createElement('div');
        sistemaPaneles.id = 'sistemaPanelesUnificado';
        sistemaPaneles.className = 'sistema-paneles-unificado';
        
        // Barra superior
        sistemaPaneles.appendChild(this.crearBarraSuperior());
        
        // Panel lateral izquierdo
        sistemaPaneles.appendChild(this.crearPanelLateral());
        
        // Barra inferior
        sistemaPaneles.appendChild(this.crearBarraInferior());
        
        // Sistema de notificaciones
        sistemaPaneles.appendChild(this.crearSistemaNotificaciones());
        
        // Botón HUD toggle (fuera del sistema de paneles)
        const hudToggle = document.createElement('button');
        hudToggle.className = 'hud-toggle';
        hudToggle.textContent = 'HUD ON/OFF';
        hudToggle.onclick = () => this.alternarHUD();
        
        // Agregar al contenedor
        contenedor.appendChild(sistemaPaneles);
        contenedor.appendChild(hudToggle);
        
        // Guardar referencias
        this.paneles.superior = document.getElementById('barraSuperior');
        this.paneles.lateral = document.getElementById('panelLateralIzquierdo');
        this.paneles.inferior = document.getElementById('barraInferior');
        this.paneles.notificaciones = document.getElementById('sistemaNotificaciones');
    }
    
    crearBarraSuperior() {
        const barra = document.createElement('div');
        barra.id = 'barraSuperior';
        barra.className = 'barra-superior';
        
        // Datos iniciales reales
        const faseInicial = this.estado.fase || 'Inicializando';
        const turnoInicial = this.estado.turno || 0;
        const jugadorInicial = this.estado.jugadorActual?.nombre || 'Esperando';
        
        barra.innerHTML = `
            <div class="estado-juego">
                <span class="fase-actual">Fase: <span id="faseActual">${faseInicial}</span></span>
                <span class="turno-actual">Turno: <span id="turnoActual">${turnoInicial > 0 ? turnoInicial : '-'}</span></span>
                <span class="jugador-actual">Jugador: <span id="jugadorActual">${jugadorInicial}</span></span>
            </div>
            <div class="controles-rapidos">
                <button class="btn-control-rapido" onclick="window.sistemaPanelesUnificado?.alternarPanel('lateral')" title="Panel Principal">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        `;
        
        return barra;
    }
    
    crearPanelLateral() {
        const panel = document.createElement('div');
        panel.id = 'panelLateralIzquierdo';
        panel.className = 'panel-lateral-izquierdo oculto';  // Inicia oculto
        
        panel.innerHTML = `
            <div class="panel-header">
                <span>Control de Juego</span>
                <button onclick="window.sistemaPanelesUnificado?.alternarPanel('lateral')" class="btn-cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="panel-content">
                <h3>🎮 MAIRA 4.0</h3>
                <p>Sistema de guerra táctico</p>
                <p><strong>Estado:</strong> Iniciando sistema...</p>
                <div class="controles-iniciales">
                    <button class="btn-iniciar" onclick="window.location.reload()">
                        🔄 Reiniciar Sistema
                    </button>
                </div>
            </div>
        `;
        
        return panel;
    }
    
    crearBarraInferior() {
        const barra = document.createElement('div');
        barra.id = 'barraInferior';
        barra.className = 'barra-inferior';
        
        barra.innerHTML = `
            <div class="elementos-jugadores" id="elementosJugadores">
                <!-- Los elementos se actualizan dinámicamente -->
            </div>
        `;
        
        return barra;
    }
    
    crearSistemaNotificaciones() {
        const sistema = document.createElement('div');
        sistema.id = 'sistemaNotificaciones';
        sistema.className = 'notificaciones';
        return sistema;
    }
    
    // === ACTUALIZACIÓN DE DATOS REALES ===
    
    actualizarBarraSuperior(barra) {
        // Obtener datos reales del gestorJuego
        const gestorJuego = window.gestorJuego;
        const datosReales = this.obtenerDatosJuego();
        
        barra.innerHTML = `
            <div class="estado-juego-real">
                <div class="fase-info">
                    <span class="fase-label">FASE:</span>
                    <span class="fase-valor" id="faseActual">${datosReales.fase}</span>
                </div>
                <div class="turno-info">
                    <span class="turno-label">TURNO:</span>
                    <span class="turno-valor" id="turnoActual">${datosReales.turno}</span>
                    <span class="tiempo-restante" id="tiempoRestante">${datosReales.tiempoRestante}</span>
                </div>
                <div class="jugador-info">
                    <span class="jugador-label">JUGADOR:</span>
                    <span class="jugador-valor" id="jugadorActual">${datosReales.jugadorActual}</span>
                </div>
                <div class="estado-conexion">
                    <i class="fas fa-circle" style="color: ${datosReales.conectado ? '#4caf50' : '#f44336'};"></i>
                    <span>${datosReales.conectado ? 'Online' : 'Offline'}</span>
                </div>
            </div>
            <div class="controles-principales">
                <button class="btn-panel-toggle" onclick="window.sistemaPaneles?.alternarPanel('lateral')" title="Panel de Control">
                    <i class="fas fa-gamepad"></i>
                </button>
                <button class="btn-fase-siguiente" onclick="window.sistemaPaneles?.siguienteFase()" title="Siguiente Fase">
                    <i class="fas fa-forward"></i>
                </button>
            </div>
        `;
        
        // Configurar actualización automática cada segundo
        if (!this.intervaloActualizacion) {
            this.intervaloActualizacion = setInterval(() => {
                this.actualizarDatosEnTiempoReal();
            }, 1000);
        }
    }
    
    obtenerDatosJuego() {
        const gestorJuego = window.gestorJuego;
        const gestorFases = gestorJuego?.gestorFases;
        const gestorTurnos = gestorJuego?.gestorTurnos;
        const gestorComunicacion = gestorJuego?.gestorComunicacion;
        
        return {
            fase: gestorFases?.fase || 'Preparación',
            subfase: gestorFases?.subfase || 'definicion_sector',
            turno: gestorTurnos?.turnoActual || 1,
            tiempoRestante: this.formatearTiempo(gestorTurnos?.tiempoRestante || 300),
            jugadorActual: gestorTurnos?.jugadorActual?.nombre || 'Sistema',
            conectado: gestorComunicacion?.socket?.connected || false,
            partida: window.codigoPartida || 'Local',
            elementos: this.contarElementosDesplegados()
        };
    }
    
    formatearTiempo(segundos) {
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    
    contarElementosDesplegados() {
        let elementos = 0;
        if (window.mapa && window.mapa.eachLayer) {
            window.mapa.eachLayer((layer) => {
                if (layer.options && layer.options.tipo === 'elemento') {
                    elementos++;
                }
            });
        }
        return elementos;
    }
    
    actualizarDatosEnTiempoReal() {
        const datos = this.obtenerDatosJuego();
        
        // Actualizar elementos específicos
        const faseActual = document.getElementById('faseActual');
        const turnoActual = document.getElementById('turnoActual');
        const tiempoRestante = document.getElementById('tiempoRestante');
        const jugadorActual = document.getElementById('jugadorActual');
        
        if (faseActual) faseActual.textContent = datos.fase;
        if (turnoActual) turnoActual.textContent = datos.turno;
        if (tiempoRestante) tiempoRestante.textContent = datos.tiempoRestante;
        if (jugadorActual) jugadorActual.textContent = datos.jugadorActual;
        
        // Actualizar estado interno
        Object.assign(this.estado, datos);
    }
    
    siguienteFase() {
        const gestorJuego = window.gestorJuego;
        if (gestorJuego?.gestorFases) {
            gestorJuego.gestorFases.siguienteFase();
            this.mostrarNotificacion('Avanzando a la siguiente fase...', 'info');
        }
    }

    // === MÉTODOS DE ACTUALIZACIÓN ===
    
    actualizarEstado(nuevoEstado) {
        console.log('[SistemaPaneles] 🔄 Actualizando estado:', nuevoEstado);
        
        // Actualizar estado interno
        Object.assign(this.estado, nuevoEstado);
        
        // Actualizar barra superior
        this.actualizarBarraSuperior();
        
        // Actualizar controles de fase
        this.actualizarControlesFase();
        
        // Actualizar elementos de jugadores
        this.actualizarElementosJugadores();
    }
    
    actualizarBarraSuperior() {
        const faseEl = document.getElementById('faseActual');
        const turnoEl = document.getElementById('turnoActual');
        const jugadorEl = document.getElementById('jugadorActual');
        
        if (faseEl) faseEl.textContent = this.estado.fase || 'Preparación';
        if (turnoEl) turnoEl.textContent = this.estado.turno || '-';
        if (jugadorEl) {
            const jugador = this.estado.jugadorActual;
            jugadorEl.textContent = jugador?.nombre || jugador?.username || '-';
        }
    }
    
    actualizarControlesFase() {
        const contenedor = document.getElementById('controlesFase');
        if (!contenedor) return;
        
        let controles = '';
        
        switch (this.estado.fase) {
            case 'preparacion':
                controles = this.generarControlesPreparacion();
                break;
            case 'combate':
                controles = this.generarControlesCombate();
                break;
            default:
                controles = '<p>Fase no reconocida</p>';
        }
        
        contenedor.innerHTML = `
            <h3>Controles - ${this.estado.fase}</h3>
            ${controles}
        `;
    }
    
    generarControlesPreparacion() {
        const { subfase } = this.estado;
        const esDirector = window.gestorJuego?.gestorFases?.esDirector?.(window.userId);
        
        let controles = '';
        
        switch (subfase) {
            case 'definicion_sector':
                if (esDirector) {
                    controles = `
                        <button class="btn-control" onclick="window.gestorJuego?.gestorFases?.confirmarSector()">
                            <i class="fas fa-map"></i> Confirmar Sector
                        </button>
                    `;
                } else {
                    controles = '<p>El director está definiendo el sector...</p>';
                }
                break;
                
            case 'definicion_zonas':
                if (esDirector) {
                    controles = `
                        <button class="btn-control" onclick="window.gestorJuego?.gestorFases?.definirZonaRoja()">
                            <i class="fas fa-square" style="color: #f44336;"></i> Definir Zona Roja
                        </button>
                        <button class="btn-control" onclick="window.gestorJuego?.gestorFases?.definirZonaAzul()">
                            <i class="fas fa-square" style="color: #2196F3;"></i> Definir Zona Azul
                        </button>
                    `;
                } else {
                    controles = '<p>El director está definiendo las zonas...</p>';
                }
                break;
                
            case 'despliegue':
                controles = `
                    <button class="btn-control" onclick="window.gestorJuego?.gestorTurnos?.finalizarTurno()">
                        <i class="fas fa-check"></i> Finalizar Despliegue
                    </button>
                    <button class="btn-control" onclick="sistemaPaneles.mostrarAyudaDespliegue()">
                        <i class="fas fa-question-circle"></i> Ayuda
                    </button>
                `;
                break;
        }
        
        return controles;
    }
    
    generarControlesCombate() {
        const esmiTurno = this.estado.jugadorActual?.id === window.userId;
        
        return `
            <button class="btn-control ${!esmiTurno ? 'disabled' : ''}" 
                    onclick="window.gestorJuego?.gestorTurnos?.finalizarTurno()"
                    ${!esmiTurno ? 'disabled' : ''}>
                <i class="fas fa-forward"></i> Finalizar Turno
            </button>
            <button class="btn-control" onclick="sistemaPaneles.mostrarEstadoCombate()">
                <i class="fas fa-info-circle"></i> Estado del Combate
            </button>
            <button class="btn-control peligro" onclick="sistemaPaneles.mostrarMenuRetirada()">
                <i class="fas fa-flag"></i> Rendirse
            </button>
        `;
    }
    
    actualizarElementosJugadores() {
        const contenedor = document.getElementById('elementosJugadores');
        if (!contenedor) return;
        
        // Obtener elementos del mapa
        this.obtenerElementosDelMapa();
        
        let html = '';
        
        // Agrupar elementos por jugador
        const elementosPorJugador = {};
        
        Object.values(this.estado.elementos).forEach(elemento => {
            const jugadorId = elemento.jugadorId || elemento.propietario;
            if (!elementosPorJugador[jugadorId]) {
                elementosPorJugador[jugadorId] = [];
            }
            elementosPorJugador[jugadorId].push(elemento);
        });
        
        // Generar HTML para cada jugador
        Object.entries(elementosPorJugador).forEach(([jugadorId, elementos]) => {
            const esPropio = jugadorId === window.userId;
            const jugador = this.obtenerInfoJugador(jugadorId);
            
            html += `
                <div class="elemento-jugador ${esPropio ? 'propio' : 'enemigo'}">
                    <div class="elemento-header">
                        <span class="elemento-nombre">${jugador.nombre}</span>
                        <span class="elemento-equipo">${jugador.equipo}</span>
                    </div>
                    <div class="elemento-info">
                        ${elementos.length} elemento${elementos.length !== 1 ? 's' : ''}
                        ${elementos.map(e => e.designacion || e.tipo).join(', ').substring(0, 30)}${elementos.length > 3 ? '...' : ''}
                    </div>
                </div>
            `;
        });
        
        contenedor.innerHTML = html || '<div class="elemento-jugador">No hay elementos desplegados</div>';
    }
    
    obtenerElementosDelMapa() {
        this.estado.elementos = {};
        
        if (window.mapa || window.map) {
            const mapa = window.mapa || window.map;
            
            mapa.eachLayer(layer => {
                if (layer.options && (layer.options.tipo || layer.options.id)) {
                    this.estado.elementos[layer.options.id || Date.now()] = {
                        id: layer.options.id,
                        tipo: layer.options.tipo,
                        designacion: layer.options.designacion,
                        jugadorId: layer.options.jugadorId || layer.options.propietario,
                        equipo: layer.options.equipo,
                        magnitud: layer.options.magnitud
                    };
                }
            });
        }
    }
    
    obtenerInfoJugador(jugadorId) {
        // Intentar obtener del gestorTurnos
        if (window.gestorJuego?.gestorTurnos?.jugadores) {
            const jugador = window.gestorJuego.gestorTurnos.jugadores.find(j => j.id === jugadorId);
            if (jugador) return jugador;
        }
        
        // Fallback
        return {
            id: jugadorId,
            nombre: `Jugador ${jugadorId}`,
            equipo: 'Desconocido'
        };
    }
    
    // === MÉTODOS DE INTERACCIÓN ===
    
    alternarPanel(tipo) {
        const panel = this.paneles[tipo];
        if (!panel) return;
        
        panel.classList.toggle('oculto');
        
        // Guardar estado
        if (this.configuracion.posicionPersistente) {
            localStorage.setItem(`panel_${tipo}_visible`, !panel.classList.contains('oculto'));
        }
    }
    
    mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.innerHTML = `
            <div>${mensaje}</div>
            <button onclick="this.parentElement.remove()" class="btn-cerrar-notif">×</button>
        `;
        
        this.paneles.notificaciones.appendChild(notificacion);
        
        // Auto-remover
        if (duracion > 0) {
            setTimeout(() => {
                if (notificacion.parentElement) {
                    notificacion.remove();
                }
            }, duracion);
        }
    }
    
    activarHerramienta(herramienta) {
        // Desactivar todas las herramientas
        document.querySelectorAll('.btn-panel-derecho').forEach(btn => {
            btn.classList.remove('activo');
        });
        
        // Activar la seleccionada
        const boton = document.querySelector(`[data-herramienta="${herramienta}"]`);
        if (boton) {
            boton.classList.add('activo');
        }
        
        // Ejecutar acción de la herramienta
        switch (herramienta) {
            case 'zoom':
                this.mostrarControlesZoom();
                break;
            case 'medicion':
                this.activarMedicion();
                break;
            case 'capas':
                this.mostrarControlCapas();
                break;
            case 'configuracion':
                this.mostrarConfiguracion();
                break;
        }
    }
    
    // === MÉTODOS AUXILIARES ===
    
    configurarEventos() {
        // Escuchar eventos de teclado
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    this.alternarPanel('lateral');
                    break;
                case 'Tab':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.alternarPanel('inferior');
                    }
                    break;
            }
        });
        
        // Escuchar eventos del juego
        document.addEventListener('faseCambiada', (e) => {
            this.actualizarEstado({
                fase: e.detail.nuevaFase,
                subfase: e.detail.nuevaSubfase
            });
        });
        
        document.addEventListener('turnoActualizado', (e) => {
            this.actualizarEstado({
                turno: e.detail.turno,
                jugadorActual: e.detail.jugadorActual
            });
        });
    }
    
    cargarConfiguracion() {
        // Cargar configuración guardada
        const configGuardada = localStorage.getItem('sistemaPaneles_config');
        if (configGuardada) {
            Object.assign(this.configuracion, JSON.parse(configGuardada));
        }
        
        // Aplicar estados de paneles guardados
        Object.keys(this.paneles).forEach(tipo => {
            const visible = localStorage.getItem(`panel_${tipo}_visible`);
            if (visible !== null) {
                const panel = this.paneles[tipo];
                if (panel) {
                    panel.classList.toggle('oculto', visible === 'false');
                }
            }
        });
    }
    
    guardarConfiguracion() {
        localStorage.setItem('sistemaPaneles_config', JSON.stringify(this.configuracion));
    }
    
    // === MÉTODOS DE HERRAMIENTAS ===
    
    mostrarControlesZoom() {
        this.mostrarNotificacion('Controles de zoom activados', 'info');
    }
    
    activarMedicion() {
        if (window.medirDistancia) {
            window.medirDistancia();
            this.mostrarNotificacion('Herramienta de medición activada', 'success');
        }
    }
    
    mostrarControlCapas() {
        this.mostrarNotificacion('Control de capas - Funcionalidad en desarrollo', 'info');
    }
    
    mostrarConfiguracion() {
        this.mostrarNotificacion('Configuración - Funcionalidad en desarrollo', 'info');
    }
    
    // === ALTERNAR HUD ===
    alternarHUD() {
        const sistema = document.getElementById('sistemaPanelesUnificado');
        
        if (sistema) {
            sistema.classList.toggle('hud-oculto');
            const visible = !sistema.classList.contains('hud-oculto');
            this.mostrarNotificacion(`HUD ${visible ? 'Activado' : 'Desactivado'}`, 'info');
        }
    }
    
    mostrarAyudaDespliegue() {
        this.mostrarNotificacion('Despliega tus unidades en la zona asignada y presiona "Finalizar Despliegue"', 'info', 10000);
    }
    
    mostrarEstadoCombate() {
        const info = `
            Fase: ${this.estado.fase}<br>
            Turno: ${this.estado.turno}<br>
            Jugador Actual: ${this.estado.jugadorActual?.nombre || 'N/A'}
        `;
        this.mostrarNotificacion(info, 'info', 8000);
    }
    
    // === INTEGRACIÓN CON GESTORES ===
    configurarEventosGestores() {
        // Escuchar cambios de fase
        document.addEventListener('faseCambiada', (event) => {
            console.log('[SistemaPaneles] 📥 Fase cambiada:', event.detail);
            this.actualizarEstadoFase();
        });
        
        // Escuchar cambios de turno
        document.addEventListener('turnoCambiado', (event) => {
            console.log('[SistemaPaneles] 📥 Turno cambiado:', event.detail);
            this.actualizarEstadoTurno();
        });
        
        // Escuchar cambios de interfaz
        document.addEventListener('interfazActualizada', (event) => {
            console.log('[SistemaPaneles] 📥 Interfaz actualizada:', event.detail);
            this.sincronizarConInterfaz();
        });
    }
    
    actualizarEstadoFase() {
        if (this.gestorFases) {
            const faseActual = this.gestorFases.fase || 'Desconocida';
            const subfaseActual = this.gestorFases.subfase || '';
            
            this.estado.fase = faseActual;
            this.estado.subfase = subfaseActual;
            
            // Actualizar UI
            const faseElement = document.getElementById('faseActual');
            if (faseElement) {
                faseElement.textContent = `${faseActual}${subfaseActual ? ' - ' + subfaseActual : ''}`;
            }
            
            // Actualizar contenido del panel según la fase
            this.actualizarContenidoPorFase(faseActual, subfaseActual);
        }
    }
    
    actualizarEstadoTurno() {
        if (this.gestorTurnos) {
            const turnoActual = this.gestorTurnos.turnoActual || 0;
            const jugadorActual = this.gestorTurnos.jugadorActual;
            
            this.estado.turno = turnoActual;
            this.estado.jugadorActual = jugadorActual;
            
            // Actualizar UI
            const turnoElement = document.getElementById('turnoActual');
            if (turnoElement) {
                turnoElement.textContent = turnoActual > 0 ? turnoActual : '-';
            }
            
            const jugadorElement = document.getElementById('jugadorActual');
            if (jugadorElement) {
                jugadorElement.textContent = jugadorActual?.nombre || '-';
            }
        }
    }
    
    actualizarContenidoPorFase(fase, subfase) {
        const contenido = this.paneles.lateral?.querySelector('.panel-content');
        if (!contenido) return;
        
        let htmlContenido = '';
        
        switch (fase) {
            case 'preparacion':
                if (subfase === 'definicion_sector') {
                    htmlContenido = `
                        <h3>🎯 Definición de Sector</h3>
                        <p>Define el sector de operaciones para la partida.</p>
                        <div class="controles-fase">
                            <button class="btn-fase" onclick="window.gestorJuego?.gestorFases?.siguienteFase()">
                                Continuar
                            </button>
                        </div>
                    `;
                } else if (subfase === 'despliegue') {
                    htmlContenido = `
                        <h3>🪖 Despliegue de Fuerzas</h3>
                        <p>Despliega tus unidades en el sector asignado.</p>
                        <div class="controles-fase">
                            <button class="btn-fase" onclick="window.gestorJuego?.gestorFases?.finalizarDespliegue()">
                                Finalizar Despliegue
                            </button>
                        </div>
                    `;
                }
                break;
                
            case 'combate':
                htmlContenido = `
                    <h3>⚔️ Fase de Combate</h3>
                    <p>Turno ${this.estado.turno}</p>
                    <p>Jugador: ${this.estado.jugadorActual?.nombre || 'N/A'}</p>
                    <div class="controles-fase">
                        <button class="btn-fase" onclick="window.gestorJuego?.gestorTurnos?.finalizarTurno()">
                            Finalizar Turno
                        </button>
                    </div>
                `;
                break;
                
            default:
                htmlContenido = `
                    <h3>🎮 MAIRA 4.0</h3>
                    <p>Sistema de guerra táctico</p>
                    <p>Fase: ${fase}</p>
                    ${subfase ? `<p>Subfase: ${subfase}</p>` : ''}
                `;
        }
        
        contenido.innerHTML = htmlContenido;
    }
    
    sincronizarConInterfaz() {
        // Sincronizar con el gestorInterfaz existente
        if (this.gestorInterfaz && this.gestorInterfaz.contenedores) {
            // Ocultar el panel del gestorInterfaz para evitar duplicación
            const panelInterfaz = this.gestorInterfaz.contenedores.panelEstado;
            if (panelInterfaz) {
                panelInterfaz.style.display = 'none';
                console.log('[SistemaPaneles] 🔗 Panel de interfaz original ocultado');
            }
        }
    }
}

// Inicializar el sistema cuando se carga la página
window.sistemaPaneles = null;

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaPaneles = new SistemaPanelesUnificado();
    console.log('✅ Sistema de Paneles Unificado inicializado globalmente');
});

// Exportar para uso externo
window.SistemaPanelesUnificado = SistemaPanelesUnificado;
