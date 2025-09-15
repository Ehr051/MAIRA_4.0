/**
 * MAIRA 4.0 - Sistema de Paneles Integrados
 * Gestor unificado de paneles para planeamiento y juego de guerra
 * Recupera funcionalidades de gestores antiguos con arquitectura moderna
 */

class SistemaPaneles {
    constructor() {
        this.paneles = new Map();
        this.panelActivo = null;
        this.contenedorPrincipal = null;
        this.inicializado = false;
        
        // Estado de los gestores
        this.gestorFases = null;
        this.gestorTurnos = null;
        this.gestorInterfaz = null;
        
        // Configuración de paneles disponibles
        this.configPaneles = {
            'mapa': {
                titulo: 'Mapa Táctico',
                icono: '🗺️',
                clase: 'panel-mapa',
                posicion: 'principal'
            },
            'unidades': {
                titulo: 'Gestión de Unidades',
                icono: '🎖️',
                clase: 'panel-unidades',
                posicion: 'lateral'
            },
            'ordenes': {
                titulo: 'Órdenes de Batalla',
                icono: '📋',
                clase: 'panel-ordenes',
                posicion: 'lateral'
            },
            'comunicaciones': {
                titulo: 'Comunicaciones',
                icono: '📡',
                clase: 'panel-comunicaciones',
                posicion: 'lateral'
            },
            'inteligencia': {
                titulo: 'Inteligencia',
                icono: '🔍',
                clase: 'panel-inteligencia',
                posicion: 'lateral'
            },
            'logistica': {
                titulo: 'Logística',
                icono: '📦',
                clase: 'panel-logistica',
                posicion: 'lateral'
            },
            'vista3d': {
                titulo: 'Vista 3D (Deshabilitado)',
                icono: '🚫',
                clase: 'panel-3d-deshabilitado',
                posicion: 'modal'
            },
            'informes': {
                titulo: 'Informes',
                icono: '📊',
                clase: 'panel-informes',
                posicion: 'lateral'
            }
        };
    }

    /**
     * Inicializa el sistema de paneles
     */
    inicializar(contenedorId) {
        try {
            this.contenedorPrincipal = document.getElementById(contenedorId);
            if (!this.contenedorPrincipal) {
                throw new Error(`Contenedor ${contenedorId} no encontrado`);
            }

            console.log('🎛️ Inicializando Sistema de Paneles...');

            // Crear estructura base
            this.crearEstructuraPaneles();
            
            // Inicializar gestores heredados
            this.inicializarGestores();
            
            // Configurar eventos
            this.configurarEventos();
            
            this.inicializado = true;
            console.log('✅ Sistema de Paneles inicializado');
            
            return true;

        } catch (error) {
            console.error('❌ Error inicializando Sistema de Paneles:', error);
            throw error;
        }
    }

    /**
     * Crea la estructura HTML base de los paneles
     */
    crearEstructuraPaneles() {
        this.contenedorPrincipal.innerHTML = `
            <!-- Barra de herramientas superior -->
            <div id="barra-herramientas" class="barra-herramientas">
                <div class="grupo-herramientas grupo-navegacion">
                    <button class="btn-herramienta" data-panel="mapa" title="Mapa Táctico">
                        🗺️ <span class="texto-btn">Mapa</span>
                    </button>
                    <button class="btn-herramienta" data-panel="vista3d" title="Vista 3D">
                        🎮 <span class="texto-btn">3D</span>
                    </button>
                </div>
                
                <div class="grupo-herramientas grupo-gestion">
                    <button class="btn-herramienta" data-panel="unidades" title="Gestión de Unidades">
                        🎖️ <span class="texto-btn">Unidades</span>
                    </button>
                    <button class="btn-herramienta" data-panel="ordenes" title="Órdenes de Batalla">
                        📋 <span class="texto-btn">Órdenes</span>
                    </button>
                    <button class="btn-herramienta" data-panel="comunicaciones" title="Comunicaciones">
                        📡 <span class="texto-btn">Com</span>
                    </button>
                </div>
                
                <div class="grupo-herramientas grupo-analisis">
                    <button class="btn-herramienta" data-panel="inteligencia" title="Inteligencia">
                        🔍 <span class="texto-btn">Intel</span>
                    </button>
                    <button class="btn-herramienta" data-panel="logistica" title="Logística">
                        📦 <span class="texto-btn">Log</span>
                    </button>
                    <button class="btn-herramienta" data-panel="informes" title="Informes">
                        📊 <span class="texto-btn">Info</span>
                    </button>
                </div>

                <div class="grupo-herramientas grupo-sistema">
                    <div class="indicador-fase" id="indicador-fase">
                        <span class="fase-actual">Preparación</span>
                        <span class="turno-actual">Turno 1</span>
                    </div>
                    <button class="btn-herramienta btn-siguiente-fase" id="btn-siguiente-fase" title="Siguiente Fase">
                        ⏭️ <span class="texto-btn">Siguiente</span>
                    </button>
                </div>
            </div>

            <!-- Área principal de trabajo -->
            <div id="area-trabajo" class="area-trabajo">
                <!-- Panel principal (mapa/3D) -->
                <div id="panel-principal" class="panel-principal">
                    <div id="contenido-principal" class="contenido-principal">
                        <!-- Aquí se carga el contenido principal -->
                    </div>
                </div>

                <!-- Panel lateral derecho -->
                <div id="panel-lateral" class="panel-lateral">
                    <div id="contenido-lateral" class="contenido-lateral">
                        <!-- Aquí se cargan los paneles laterales -->
                    </div>
                </div>
            </div>

            <!-- Modal para paneles especiales -->
            <div id="modal-panel" class="modal-panel">
                <div class="modal-contenido">
                    <div class="modal-header">
                        <h3 id="modal-titulo">Panel</h3>
                        <button class="btn-cerrar-modal" id="btn-cerrar-modal">✕</button>
                    </div>
                    <div id="modal-body" class="modal-body">
                        <!-- Contenido del modal -->
                    </div>
                </div>
            </div>

            <!-- Panel de notificaciones -->
            <div id="panel-notificaciones" class="panel-notificaciones">
                <!-- Las notificaciones aparecen aquí -->
            </div>
        `;

        // Aplicar estilos CSS
        this.aplicarEstilos();
    }

    /**
     * Aplica los estilos CSS del sistema de paneles
     */
    aplicarEstilos() {
        if (document.getElementById('estilos-paneles')) return;

        const estilos = document.createElement('style');
        estilos.id = 'estilos-paneles';
        estilos.textContent = `
            /* Sistema de Paneles MAIRA 4.0 */
            .barra-herramientas {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                border-bottom: 2px solid #00ff00;
                padding: 8px 16px;
                box-shadow: 0 2px 10px rgba(0,255,0,0.3);
                position: relative;
                z-index: 1000;
            }

            .grupo-herramientas {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .btn-herramienta {
                background: rgba(0,255,0,0.1);
                border: 1px solid rgba(0,255,0,0.3);
                color: #00ff00;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .btn-herramienta:hover {
                background: rgba(0,255,0,0.2);
                border-color: #00ff00;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,255,0,0.4);
            }

            .btn-herramienta.activo {
                background: rgba(0,255,0,0.3);
                border-color: #00ff00;
                box-shadow: 0 0 10px rgba(0,255,0,0.5);
            }

            .indicador-fase {
                background: rgba(0,100,255,0.1);
                border: 1px solid rgba(0,100,255,0.3);
                border-radius: 6px;
                padding: 8px 12px;
                color: #00aaff;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                text-align: center;
            }

            .fase-actual {
                display: block;
                font-weight: bold;
            }

            .turno-actual {
                display: block;
                opacity: 0.8;
                font-size: 10px;
            }

            .area-trabajo {
                display: flex;
                height: calc(100vh - 60px);
                background: #000;
            }

            .panel-principal {
                flex: 1;
                background: #111;
                border-right: 1px solid #333;
                position: relative;
            }

            .contenido-principal {
                width: 100%;
                height: 100%;
                position: relative;
            }

            .panel-lateral {
                width: 350px;
                background: #1a1a1a;
                border-left: 1px solid #333;
                display: flex;
                flex-direction: column;
            }

            .contenido-lateral {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }

            .modal-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.8);
                z-index: 2000;
                display: none;
                align-items: center;
                justify-content: center;
            }

            .modal-contenido {
                background: #1a1a1a;
                border: 2px solid #00ff00;
                border-radius: 10px;
                width: 90vw;
                height: 80vh;
                max-width: 1200px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 30px rgba(0,255,0,0.5);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid #333;
                background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
            }

            .modal-header h3 {
                color: #00ff00;
                margin: 0;
                font-family: 'Courier New', monospace;
            }

            .btn-cerrar-modal {
                background: rgba(255,0,0,0.2);
                border: 1px solid rgba(255,0,0,0.5);
                color: #ff6666;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
            }

            .btn-cerrar-modal:hover {
                background: rgba(255,0,0,0.4);
                transform: scale(1.1);
            }

            .modal-body {
                flex: 1;
                padding: 16px;
                overflow: auto;
            }

            .panel-notificaciones {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 1500;
                max-width: 350px;
            }

            .notificacion {
                background: rgba(0,255,0,0.1);
                border: 1px solid rgba(0,255,0,0.3);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                animation: notificacionEntrada 0.3s ease-out;
            }

            .notificacion.error {
                background: rgba(255,0,0,0.1);
                border-color: rgba(255,0,0,0.3);
                color: #ff6666;
            }

            .notificacion.warning {
                background: rgba(255,255,0,0.1);
                border-color: rgba(255,255,0,0.3);
                color: #ffff66;
            }

            @keyframes notificacionEntrada {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* Responsive */
            @media (max-width: 1024px) {
                .panel-lateral {
                    width: 300px;
                }
                
                .texto-btn {
                    display: none;
                }
            }

            @media (max-width: 768px) {
                .grupo-herramientas {
                    gap: 4px;
                }
                
                .btn-herramienta {
                    padding: 6px 8px;
                }
                
                .panel-lateral {
                    position: absolute;
                    right: -300px;
                    transition: right 0.3s ease;
                    z-index: 1100;
                }
                
                .panel-lateral.activo {
                    right: 0;
                }
            }
        `;
        
        document.head.appendChild(estilos);
    }

    /**
     * Inicializar gestores heredados del sistema anterior
     */
    inicializarGestores() {
        // Gestor de Fases (heredado)
        this.gestorFases = {
            faseActual: 'preparacion',
            fases: ['preparacion', 'reconocimiento', 'avance', 'contacto', 'combate', 'consolidacion'],
            
            siguienteFase() {
                const indiceActual = this.fases.indexOf(this.faseActual);
                if (indiceActual < this.fases.length - 1) {
                    this.faseActual = this.fases[indiceActual + 1];
                    this.actualizarIndicador();
                    return true;
                }
                return false;
            },
            
            actualizarIndicador() {
                const indicador = document.querySelector('.fase-actual');
                if (indicador) {
                    indicador.textContent = this.faseActual.charAt(0).toUpperCase() + this.faseActual.slice(1);
                }
            }
        };

        // Gestor de Turnos (heredado)
        this.gestorTurnos = {
            turnoActual: 1,
            maxTurnos: 20,
            
            siguienteTurno() {
                if (this.turnoActual < this.maxTurnos) {
                    this.turnoActual++;
                    this.actualizarIndicador();
                    return true;
                }
                return false;
            },
            
            actualizarIndicador() {
                const indicador = document.querySelector('.turno-actual');
                if (indicador) {
                    indicador.textContent = `Turno ${this.turnoActual}`;
                }
            }
        };

        // Gestor de Interfaz (heredado y mejorado)
        this.gestorInterfaz = {
            panelSistema: this,
            
            mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
                this.panelSistema.mostrarNotificacion(mensaje, tipo, duracion);
            },
            
            cambiarPanel(panelId) {
                this.panelSistema.activarPanel(panelId);
            },
            
            togglePanelLateral() {
                const lateral = document.getElementById('panel-lateral');
                lateral.classList.toggle('activo');
            }
        };

        console.log('✅ Gestores heredados inicializados');
    }

    /**
     * Configurar eventos del sistema
     */
    configurarEventos() {
        // Eventos de botones de herramientas
        document.querySelectorAll('[data-panel]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panelId = e.currentTarget.dataset.panel;
                this.activarPanel(panelId);
            });
        });

        // Evento siguiente fase
        const btnSiguienteFase = document.getElementById('btn-siguiente-fase');
        if (btnSiguienteFase) {
            btnSiguienteFase.addEventListener('click', () => {
                if (this.gestorFases.siguienteFase()) {
                    this.mostrarNotificacion(`Avanzando a fase: ${this.gestorFases.faseActual}`, 'info');
                } else {
                    this.mostrarNotificacion('Ya estás en la fase final', 'warning');
                }
            });
        }

        // Evento cerrar modal
        const btnCerrarModal = document.getElementById('btn-cerrar-modal');
        if (btnCerrarModal) {
            btnCerrarModal.addEventListener('click', () => {
                this.cerrarModal();
            });
        }

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panelActivo === 'modal') {
                this.cerrarModal();
            }
        });

        console.log('✅ Eventos configurados');
    }

    /**
     * Activa un panel específico
     */
    activarPanel(panelId) {
        if (!this.configPaneles[panelId]) {
            console.error(`Panel ${panelId} no encontrado`);
            return;
        }

        const config = this.configPaneles[panelId];
        
        // Actualizar botones activos
        document.querySelectorAll('.btn-herramienta').forEach(btn => {
            btn.classList.remove('activo');
        });
        document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('activo');

        // Mostrar panel según su posición
        switch (config.posicion) {
            case 'principal':
                this.mostrarPanelPrincipal(panelId);
                break;
            case 'lateral':
                this.mostrarPanelLateral(panelId);
                break;
            case 'modal':
                this.mostrarPanelModal(panelId);
                break;
        }

        this.panelActivo = panelId;
        console.log(`✅ Panel activado: ${config.titulo}`);
    }

    /**
     * Muestra contenido en el panel principal
     */
    mostrarPanelPrincipal(panelId) {
        const contenido = document.getElementById('contenido-principal');
        
        switch (panelId) {
            case 'mapa':
                contenido.innerHTML = `
                    <div class="panel-mapa-tactico">
                        <h2>🗺️ Mapa Táctico</h2>
                        <div id="mapa-canvas" class="mapa-canvas">
                            <!-- Aquí se carga el mapa hexagonal -->
                        </div>
                    </div>
                `;
                // Cargar mapa hexagonal
                this.cargarMapaHexagonal();
                break;
        }
    }

    /**
     * Muestra contenido en el panel lateral
     */
    mostrarPanelLateral(panelId) {
        const contenido = document.getElementById('contenido-lateral');
        const config = this.configPaneles[panelId];
        
        contenido.innerHTML = `
            <div class="panel-lateral-contenido">
                <h3>${config.icono} ${config.titulo}</h3>
                <div id="contenido-${panelId}" class="contenido-panel">
                    ${this.generarContenidoPanel(panelId)}
                </div>
            </div>
        `;
    }

    /**
     * Muestra panel en modal
     */
    mostrarPanelModal(panelId) {
        const modal = document.getElementById('modal-panel');
        const titulo = document.getElementById('modal-titulo');
        const body = document.getElementById('modal-body');
        const config = this.configPaneles[panelId];
        
        titulo.textContent = `${config.icono} ${config.titulo}`;
        body.innerHTML = this.generarContenidoPanel(panelId);
        
        modal.style.display = 'flex';
        this.panelActivo = 'modal';
    }

    /**
     * Cierra el modal activo
     */
    cerrarModal() {
        const modal = document.getElementById('modal-panel');
        modal.style.display = 'none';
        this.panelActivo = null;
        
        // Limpiar botones activos
        document.querySelectorAll('.btn-herramienta').forEach(btn => {
            btn.classList.remove('activo');
        });
    }

    /**
     * Genera contenido específico para cada panel
     */
    generarContenidoPanel(panelId) {
        switch (panelId) {
            case 'unidades':
                return `
                    <div class="seccion-unidades">
                        <div class="filtros-unidades">
                            <button class="btn-filtro activo" data-tipo="todas">Todas</button>
                            <button class="btn-filtro" data-tipo="tanques">Tanques</button>
                            <button class="btn-filtro" data-tipo="infanteria">Infantería</button>
                            <button class="btn-filtro" data-tipo="artilleria">Artillería</button>
                        </div>
                        <div class="lista-unidades" id="lista-unidades">
                            <!-- Lista de unidades se genera dinámicamente -->
                        </div>
                        <div class="acciones-unidades">
                            <button class="btn-accion" onclick="crearNuevaUnidad()">➕ Nueva Unidad</button>
                            <button class="btn-accion" onclick="importarUnidades()">📁 Importar</button>
                        </div>
                    </div>
                `;
                
            case 'ordenes':
                return `
                    <div class="seccion-ordenes">
                        <div class="crear-orden">
                            <select id="tipo-orden">
                                <option value="movimiento">Movimiento</option>
                                <option value="ataque">Ataque</option>
                                <option value="defensa">Defensa</option>
                                <option value="reconocimiento">Reconocimiento</option>
                            </select>
                            <button class="btn-crear-orden">📋 Crear Orden</button>
                        </div>
                        <div class="lista-ordenes" id="lista-ordenes">
                            <!-- Órdenes activas -->
                        </div>
                    </div>
                `;
                
            case 'comunicaciones':
                return `
                    <div class="seccion-comunicaciones">
                        <div class="canal-radio">
                            <h4>📡 Canal Principal</h4>
                            <div class="mensajes-radio" id="mensajes-radio">
                                <!-- Mensajes de radio -->
                            </div>
                            <div class="enviar-mensaje">
                                <input type="text" id="input-mensaje" placeholder="Escribir mensaje...">
                                <button onclick="enviarMensaje()">Enviar</button>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'inteligencia':
                return `
                    <div class="seccion-inteligencia">
                        <div class="reporte-intel">
                            <h4>🔍 Situación Enemiga</h4>
                            <div class="mapa-situacion">
                                <!-- Mini mapa de situación -->
                            </div>
                            <div class="alertas-intel">
                                <div class="alerta">⚠️ Movimiento enemigo detectado</div>
                                <div class="alerta">📊 Concentración de fuerzas en sector norte</div>
                            </div>
                        </div>
                    </div>
                `;
                
            case 'logistica':
                return `
                    <div class="seccion-logistica">
                        <div class="recursos">
                            <div class="recurso">
                                <span class="icono">⛽</span>
                                <span class="nombre">Combustible</span>
                                <span class="cantidad">75%</span>
                            </div>
                            <div class="recurso">
                                <span class="icono">💥</span>
                                <span class="nombre">Munición</span>
                                <span class="cantidad">68%</span>
                            </div>
                            <div class="recurso">
                                <span class="icono">🔧</span>
                                <span class="nombre">Repuestos</span>
                                <span class="cantidad">82%</span>
                            </div>
                        </div>
                        <div class="suministros">
                            <button class="btn-suministro">📦 Solicitar Suministros</button>
                            <button class="btn-suministro">🚚 Estado de Convoyes</button>
                        </div>
                    </div>
                `;
                
            case 'vista3d':
                return `
                    <div class="vista-3d-container-deshabilitada" style="text-align: center; padding: 40px; color: #666;">
                        <h3>🚫 Vista 3D Deshabilitada</h3>
                        <p>La Vista 3D ahora se activa desde:</p>
                        <ul style="text-align: left; max-width: 300px; margin: 0 auto;">
                            <li>🔍 <strong>Zoom alto en el mapa</strong> - Se sugiere automáticamente</li>
                            <li>🎮 <strong>Menú herramientas</strong> - Botón Vista 3D unificado</li>
                            <li>⌨️ <strong>Detector de zoom</strong> - Al acercarse mucho al terreno</li>
                        </ul>
                        <p style="margin-top: 20px; font-style: italic;">Esta implementación en panel está obsoleta para evitar conflictos.</p>
                    </div>
                `;
                
            case 'informes':
                return `
                    <div class="seccion-informes">
                        <div class="tipos-informe">
                            <button class="btn-informe" onclick="generarInformeSituacion()">📋 Situación</button>
                            <button class="btn-informe" onclick="generarInformeLogistico()">📦 Logístico</button>
                            <button class="btn-informe" onclick="generarInformeBajas()">⚕️ Bajas</button>
                        </div>
                        <div class="contenido-informe" id="contenido-informe">
                            <p>Selecciona un tipo de informe para generar</p>
                        </div>
                    </div>
                `;
                
            default:
                return `<p>Contenido del panel ${panelId} en desarrollo...</p>`;
        }
    }

    /**
     * Muestra una notificación
     */
    mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        const contenedor = document.getElementById('panel-notificaciones');
        
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        contenedor.appendChild(notificacion);
        
        // Auto-remover después de la duración especificada
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, duracion);
    }

    /**
     * Carga el mapa hexagonal en el panel principal
     */
    cargarMapaHexagonal() {
        // Esta función se conectará con el sistema de mapa hexagonal existente
        const canvas = document.getElementById('mapa-canvas');
        if (canvas) {
            canvas.innerHTML = '<p>🗺️ Cargando mapa hexagonal...</p>';
            // Aquí se integrará con el sistema de hexágonos existente
        }
    }

    /**
     * Obtiene el estado actual del sistema
     */
    obtenerEstado() {
        return {
            inicializado: this.inicializado,
            panelActivo: this.panelActivo,
            faseActual: this.gestorFases?.faseActual,
            turnoActual: this.gestorTurnos?.turnoActual,
            panelesDisponibles: Object.keys(this.configPaneles)
        };
    }
}

// Funciones globales para retrocompatibilidad
window.SistemaPaneles = SistemaPaneles;
window.sistemaPaneles = null;

window.inicializarSistemaPaneles = function(contenedorId) {
    try {
        if (window.sistemaPaneles) {
            console.log('Sistema de paneles ya inicializado');
            return window.sistemaPaneles;
        }
        
        window.sistemaPaneles = new SistemaPaneles();
        window.sistemaPaneles.inicializar(contenedorId);
        
        return window.sistemaPaneles;
    } catch (error) {
        console.error('❌ Error inicializando sistema de paneles:', error);
        throw error;
    }
};

// Funciones específicas para la vista 3D (conecta con sistema3d.js)
window.iniciarVista3D = async function() {
    try {
        if (!window.sistema3D) {
            await window.inicializarSistema3D('canvas-3d-modal', {
                iluminacion: {
                    ambiente: { intensidad: 1.2 },
                    direccional: { intensidad: 1.5 }
                }
            });
        }
        window.sistemaPaneles?.mostrarNotificacion('✅ Vista 3D inicializada', 'info');
    } catch (error) {
        window.sistemaPaneles?.mostrarNotificacion('❌ Error iniciando vista 3D', 'error');
    }
};

window.cargarFormacionCompleta = async function() {
    if (!window.sistema3D) {
        window.sistemaPaneles?.mostrarNotificacion('⚠️ Inicia la vista 3D primero', 'warning');
        return;
    }
    
    const formacion = [
        { id: 'tam_tank', posicion: { x: 0, y: 0, z: 0 } },
        { id: 'tam_2c', posicion: { x: 5, y: 0, z: 0 } },
        { id: 'sk105', posicion: { x: -5, y: 0, z: 0 } },
        { id: 'm113', posicion: { x: 0, y: 0, z: 5 } },
        { id: 'humvee', posicion: { x: 3, y: 0, z: 3 } }
    ];
    
    await window.sistema3D.cargarFormacion(formacion);
    window.sistemaPaneles?.mostrarNotificacion('🎖️ Formación cargada', 'info');
};

window.limpiarEscena3D = function() {
    if (window.sistema3D) {
        window.sistema3D.limpiarModelos();
        window.sistemaPaneles?.mostrarNotificacion('🧹 Escena limpiada', 'info');
    }
};

console.log('✅ Sistema de Paneles modular cargado');
