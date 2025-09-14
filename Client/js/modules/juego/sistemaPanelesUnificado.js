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
        
        console.log('[SistemaPaneles] ✅ Sistema de paneles inicializado');
    }
    
    crearEstructuraHTML() {
        // Crear contenedor principal
        const contenedor = document.createElement('div');
        contenedor.id = 'sistemaPanelesUnificado';
        contenedor.className = 'sistema-paneles-unificado';
        
        // Barra superior
        contenedor.appendChild(this.crearBarraSuperior());
        
        // Panel lateral izquierdo
        contenedor.appendChild(this.crearPanelLateral());
        
        // Barra inferior
        contenedor.appendChild(this.crearBarraInferior());
        
        // Panel derecho (herramientas)
        contenedor.appendChild(this.crearPanelDerecho());
        
        // Sistema de notificaciones
        contenedor.appendChild(this.crearSistemaNotificaciones());
        
        // Agregar al body
        document.body.appendChild(contenedor);
        
        // Guardar referencias
        this.paneles.superior = document.getElementById('barraSuperior');
        this.paneles.lateral = document.getElementById('panelLateralIzquierdo');
        this.paneles.inferior = document.getElementById('barraInferior');
        this.paneles.derecho = document.getElementById('panelLateralDerecho');
        this.paneles.notificaciones = document.getElementById('sistemaNotificaciones');
    }
    
    crearBarraSuperior() {
        const barra = document.createElement('div');
        barra.id = 'barraSuperior';
        barra.className = 'barra-superior';
        
        barra.innerHTML = `
            <div class="estado-juego">
                <span class="fase-actual">Fase: <span id="faseActual">Preparación</span></span>
                <span class="turno-actual">Turno: <span id="turnoActual">-</span></span>
                <span class="jugador-actual">Jugador: <span id="jugadorActual">-</span></span>
            </div>
            <div class="controles-rapidos">
                <button class="btn-control-rapido" onclick="sistemaPaneles.alternarPanel('lateral')" title="Panel Principal">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        `;
        
        return barra;
    }
    
    crearPanelLateral() {
        const panel = document.createElement('div');
        panel.id = 'panelLateralIzquierdo';
        panel.className = 'panel-lateral-izquierdo';
        
        panel.innerHTML = `
            <div class="panel-header">
                <span>Control de Juego</span>
                <button onclick="sistemaPaneles.alternarPanel('lateral')" class="btn-cerrar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="panel-content">
                <div id="controlesFase" class="controles-fase">
                    <!-- Los controles se actualizan dinámicamente -->
                </div>
                <div id="infoJugadores" class="info-jugadores">
                    <!-- Información de jugadores -->
                </div>
                <div id="estadisticas" class="estadisticas">
                    <!-- Estadísticas del juego -->
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
    
    crearPanelDerecho() {
        const panel = document.createElement('div');
        panel.id = 'panelLateralDerecho';
        panel.className = 'panel-lateral-derecho';
        
        const herramientas = [
            { id: 'zoom', icon: 'fa-search-plus', title: 'Controles de Zoom' },
            { id: 'medicion', icon: 'fa-ruler', title: 'Herramientas de Medición' },
            { id: 'capas', icon: 'fa-layer-group', title: 'Control de Capas' },
            { id: 'configuracion', icon: 'fa-cog', title: 'Configuración' }
        ];
        
        const botones = herramientas.map(herramienta => `
            <button class="btn-panel-derecho" 
                    data-herramienta="${herramienta.id}"
                    title="${herramienta.title}"
                    onclick="sistemaPaneles.activarHerramienta('${herramienta.id}')">
                <i class="fas ${herramienta.icon}"></i>
            </button>
        `).join('');
        
        panel.innerHTML = botones;
        return panel;
    }
    
    crearSistemaNotificaciones() {
        const sistema = document.createElement('div');
        sistema.id = 'sistemaNotificaciones';
        sistema.className = 'notificaciones';
        return sistema;
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
        this.mostrarNotificacion('Panel de configuración - Funcionalidad en desarrollo', 'info');
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
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaPaneles = new SistemaPanelesUnificado();
    console.log('✅ Sistema de Paneles Unificado inicializado globalmente');
});

// Exportar para uso externo
window.SistemaPanelesUnificado = SistemaPanelesUnificado;
