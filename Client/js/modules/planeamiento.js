/**
 * MAIRA 4.0 - Módulo de Planeamiento Militar
 * Funciones extraídas de planeamiento.html para arquitectura modular
 */

class SistemaPlaneamiento {
    constructor() {
        this.configuracion = {
            unidades: new Map(),
            objetivos: new Map(),
            zonasOperacion: new Map(),
            restricciones: new Map()
        };
        
        this.modoActual = 'navegacion'; // navegacion, seleccion, movimiento, combate
        this.herramientaActiva = null;
        this.elementoSeleccionado = null;
        
        this.inicializado = false;
    }

    /**
     * Inicializa el sistema de planeamiento
     */
    inicializar() {
        try {
            console.log('🎯 Inicializando Sistema de Planeamiento...');
            
            this.configurarEventos();
            this.cargarConfiguracionInicial();
            
            this.inicializado = true;
            console.log('✅ Sistema de Planeamiento inicializado');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Sistema de Planeamiento:', error);
            throw error;
        }
    }

    /**
     * Configura eventos del sistema de planeamiento
     */
    configurarEventos() {
        // Eventos de teclado para planeamiento
        document.addEventListener('keydown', (e) => {
            this.manejarTeclado(e);
        });

        // Eventos de mouse para selección
        document.addEventListener('click', (e) => {
            this.manejarClick(e);
        });

        // Eventos de herramientas de planeamiento
        this.configurarHerramientasPlaneamiento();
    }

    /**
     * Configura las herramientas específicas de planeamiento
     */
    configurarHerramientasPlaneamiento() {
        const herramientas = {
            'crear-unidad': () => this.activarCreacionUnidad(),
            'crear-objetivo': () => this.activarCreacionObjetivo(),
            'trazar-ruta': () => this.activarTrazadoRuta(),
            'zona-operacion': () => this.activarZonaOperacion(),
            'restriccion': () => this.activarRestriccion(),
            'medir-distancia': () => this.activarMedicion(),
            'borrar-elemento': () => this.activarBorrado()
        };

        Object.entries(herramientas).forEach(([id, funcion]) => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.addEventListener('click', funcion);
            }
        });
    }

    /**
     * Maneja eventos de teclado para planeamiento
     */
    manejarTeclado(evento) {
        if (!this.inicializado) return;

        switch (evento.key) {
            case 'Escape':
                this.cancelarOperacionActual();
                break;
            case 'Delete':
                this.eliminarElementoSeleccionado();
                break;
            case 'u':
                if (evento.ctrlKey) {
                    this.activarCreacionUnidad();
                    evento.preventDefault();
                }
                break;
            case 'o':
                if (evento.ctrlKey) {
                    this.activarCreacionObjetivo();
                    evento.preventDefault();
                }
                break;
            case 'r':
                if (evento.ctrlKey) {
                    this.activarTrazadoRuta();
                    evento.preventDefault();
                }
                break;
            case 'm':
                if (evento.ctrlKey) {
                    this.activarMedicion();
                    evento.preventDefault();
                }
                break;
        }
    }

    /**
     * Maneja eventos de click para selección
     */
    manejarClick(evento) {
        if (!this.inicializado) return;

        const elemento = evento.target.closest('.elemento-planeamiento');
        
        if (elemento) {
            this.seleccionarElemento(elemento);
        } else {
            this.deseleccionarTodo();
        }
    }

    /**
     * Activa el modo de creación de unidades
     */
    activarCreacionUnidad() {
        this.modoActual = 'creacion-unidad';
        this.herramientaActiva = 'crear-unidad';
        
        this.mostrarPanelCreacionUnidad();
        this.cambiarCursor('crosshair');
        
        console.log('🎖️ Modo creación de unidad activado');
    }

    /**
     * Muestra el panel de creación de unidades
     */
    mostrarPanelCreacionUnidad() {
        const panel = this.crearPanelTemporal('Crear Nueva Unidad', `
            <div class="formulario-unidad">
                <div class="campo-formulario">
                    <label>Tipo de Unidad:</label>
                    <select id="tipo-unidad">
                        <option value="tanque">Tanque</option>
                        <option value="infanteria">Infantería</option>
                        <option value="artilleria">Artillería</option>
                        <option value="reconocimiento">Reconocimiento</option>
                        <option value="logistica">Logística</option>
                        <option value="comando">Comando</option>
                    </select>
                </div>
                
                <div class="campo-formulario">
                    <label>Designación:</label>
                    <input type="text" id="designacion-unidad" placeholder="Ej: 1º Escuadrón">
                </div>
                
                <div class="campo-formulario">
                    <label>Efectivos:</label>
                    <input type="number" id="efectivos-unidad" min="1" max="1000" value="30">
                </div>
                
                <div class="campo-formulario">
                    <label>Símbolo SIDC:</label>
                    <select id="sidc-unidad">
                        <option value="SFGPEWMH--MTIF-">Tanque Amigo</option>
                        <option value="SFGPEWMI--MTIF-">Infantería Amiga</option>
                        <option value="SFGPEWMF--MTIF-">Artillería Amiga</option>
                        <option value="SFGPEWMR--MTIF-">Reconocimiento Amigo</option>
                    </select>
                </div>
                
                <div class="acciones-panel">
                    <button onclick="confirmarCreacionUnidad()" class="btn-confirmar">✅ Crear</button>
                    <button onclick="cancelarCreacionUnidad()" class="btn-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `);
    }

    /**
     * Confirma la creación de una nueva unidad
     */
    confirmarCreacionUnidad() {
        const datos = {
            tipo: document.getElementById('tipo-unidad')?.value,
            designacion: document.getElementById('designacion-unidad')?.value,
            efectivos: document.getElementById('efectivos-unidad')?.value,
            sidc: document.getElementById('sidc-unidad')?.value
        };

        if (!datos.designacion) {
            alert('Por favor ingresa una designación para la unidad');
            return;
        }

        // Esperar click en mapa para posicionar
        this.esperarPosicionamiento(datos);
        this.cerrarPanelTemporal();
    }

    /**
     * Espera que el usuario haga click para posicionar elemento
     */
    esperarPosicionamiento(datos) {
        const manejarPosicionamiento = (evento) => {
            const rect = evento.target.getBoundingClientRect();
            const x = evento.clientX - rect.left;
            const y = evento.clientY - rect.top;

            this.crearUnidadEnPosicion(datos, { x, y });
            
            document.removeEventListener('click', manejarPosicionamiento);
            this.modoActual = 'navegacion';
            this.cambiarCursor('default');
        };

        document.addEventListener('click', manejarPosicionamiento);
    }

    /**
     * Crea una unidad en la posición especificada
     */
    crearUnidadEnPosicion(datos, posicion) {
        const id = `unidad_${Date.now()}`;
        
        const unidad = {
            id,
            tipo: datos.tipo,
            designacion: datos.designacion,
            efectivos: parseInt(datos.efectivos),
            sidc: datos.sidc,
            posicion,
            estado: 'operativa',
            combustible: 100,
            municion: 100,
            moral: 100
        };

        this.configuracion.unidades.set(id, unidad);
        this.renderizarUnidad(unidad);
        
        console.log(`✅ Unidad creada: ${datos.designacion} en (${posicion.x}, ${posicion.y})`);
    }

    /**
     * Renderiza una unidad en el mapa
     */
    renderizarUnidad(unidad) {
        const elemento = document.createElement('div');
        elemento.className = 'elemento-planeamiento unidad-militar';
        elemento.id = unidad.id;
        elemento.style.left = `${unidad.posicion.x}px`;
        elemento.style.top = `${unidad.posicion.y}px`;
        
        elemento.innerHTML = `
            <div class="simbolo-unidad" data-sidc="${unidad.sidc}">
                ${this.obtenerSimboloUnidad(unidad.tipo)}
            </div>
            <div class="etiqueta-unidad">
                <div class="designacion">${unidad.designacion}</div>
                <div class="estado">
                    <span class="efectivos">${unidad.efectivos}</span>
                    <span class="combustible">${unidad.combustible}%</span>
                </div>
            </div>
        `;

        // Hacer la unidad arrastrable
        this.hacerArrastrable(elemento);
        
        // Agregar al contenedor del mapa
        const contenedorMapa = document.getElementById('mapa-canvas') || document.body;
        contenedorMapa.appendChild(elemento);
    }

    /**
     * Obtiene el símbolo visual para un tipo de unidad
     */
    obtenerSimboloUnidad(tipo) {
        const simbolos = {
            'tanque': '🛡️',
            'infanteria': '🎖️',
            'artilleria': '💥',
            'reconocimiento': '🔍',
            'logistica': '📦',
            'comando': '⭐'
        };
        
        return simbolos[tipo] || '🎖️';
    }

    /**
     * Hace un elemento arrastrable
     */
    hacerArrastrable(elemento) {
        let arrastrando = false;
        let offsetX = 0;
        let offsetY = 0;

        elemento.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Click izquierdo
                arrastrando = true;
                offsetX = e.clientX - elemento.offsetLeft;
                offsetY = e.clientY - elemento.offsetTop;
                elemento.style.zIndex = '1000';
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (arrastrando) {
                elemento.style.left = `${e.clientX - offsetX}px`;
                elemento.style.top = `${e.clientY - offsetY}px`;
                
                // Actualizar posición en datos
                const unidad = this.configuracion.unidades.get(elemento.id);
                if (unidad) {
                    unidad.posicion.x = e.clientX - offsetX;
                    unidad.posicion.y = e.clientY - offsetY;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (arrastrando) {
                arrastrando = false;
                elemento.style.zIndex = '';
            }
        });
    }

    /**
     * Activa la creación de objetivos
     */
    activarCreacionObjetivo() {
        this.modoActual = 'creacion-objetivo';
        this.herramientaActiva = 'crear-objetivo';
        
        this.mostrarPanelCreacionObjetivo();
        this.cambiarCursor('crosshair');
        
        console.log('🎯 Modo creación de objetivo activado');
    }

    /**
     * Muestra el panel de creación de objetivos
     */
    mostrarPanelCreacionObjetivo() {
        const panel = this.crearPanelTemporal('Crear Nuevo Objetivo', `
            <div class="formulario-objetivo">
                <div class="campo-formulario">
                    <label>Tipo de Objetivo:</label>
                    <select id="tipo-objetivo">
                        <option value="principal">Objetivo Principal</option>
                        <option value="secundario">Objetivo Secundario</option>
                        <option value="oportunidad">Objetivo de Oportunidad</option>
                        <option value="amenaza">Amenaza Identificada</option>
                    </select>
                </div>
                
                <div class="campo-formulario">
                    <label>Descripción:</label>
                    <input type="text" id="descripcion-objetivo" placeholder="Descripción del objetivo">
                </div>
                
                <div class="campo-formulario">
                    <label>Prioridad:</label>
                    <select id="prioridad-objetivo">
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                    </select>
                </div>
                
                <div class="acciones-panel">
                    <button onclick="confirmarCreacionObjetivo()" class="btn-confirmar">✅ Crear</button>
                    <button onclick="cancelarCreacionObjetivo()" class="btn-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `);
    }

    /**
     * Activa el trazado de rutas
     */
    activarTrazadoRuta() {
        this.modoActual = 'trazado-ruta';
        this.herramientaActiva = 'trazar-ruta';
        
        this.puntosRuta = [];
        this.cambiarCursor('crosshair');
        
        console.log('🛤️ Modo trazado de ruta activado');
    }

    /**
     * Activa la medición de distancias
     */
    activarMedicion() {
        this.modoActual = 'medicion';
        this.herramientaActiva = 'medir-distancia';
        
        this.puntosMedicion = [];
        this.cambiarCursor('crosshair');
        
        console.log('📏 Modo medición activado');
    }

    /**
     * Cancela la operación actual
     */
    cancelarOperacionActual() {
        this.modoActual = 'navegacion';
        this.herramientaActiva = null;
        this.cambiarCursor('default');
        this.cerrarPanelTemporal();
        
        // Limpiar datos temporales
        this.puntosRuta = [];
        this.puntosMedicion = [];
        
        console.log('⏹️ Operación cancelada');
    }

    /**
     * Selecciona un elemento del mapa
     */
    seleccionarElemento(elemento) {
        // Deseleccionar elementos anteriores
        this.deseleccionarTodo();
        
        // Seleccionar nuevo elemento
        elemento.classList.add('seleccionado');
        this.elementoSeleccionado = elemento;
        
        // Mostrar panel de propiedades
        this.mostrarPropiedadesElemento(elemento);
    }

    /**
     * Deselecciona todos los elementos
     */
    deseleccionarTodo() {
        document.querySelectorAll('.elemento-planeamiento.seleccionado').forEach(el => {
            el.classList.remove('seleccionado');
        });
        
        this.elementoSeleccionado = null;
        this.cerrarPanelPropiedades();
    }
    
    /**
     * Cierra el panel de propiedades/edición
     */
    cerrarPanelPropiedades() {
        // Cerrar paneles de edición si están abiertos
        const panelesEdicion = [
            'panelEdicionEquipo',
            'panelEdicionPersonal',
            'panelEdicionUnidad',
            'panelEdicionObjetivo'
        ];
        
        panelesEdicion.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
        
        console.log('🗂️ Paneles de propiedades cerrados');
    }

    /**
     * Elimina el elemento seleccionado
     */
    eliminarElementoSeleccionado() {
        if (!this.elementoSeleccionado) return;
        
        const id = this.elementoSeleccionado.id;
        
        // Confirmar eliminación
        if (confirm('¿Estás seguro de eliminar este elemento?')) {
            // Remover de datos
            this.configuracion.unidades.delete(id);
            this.configuracion.objetivos.delete(id);
            
            // Remover del DOM
            this.elementoSeleccionado.remove();
            this.elementoSeleccionado = null;
            
            console.log(`🗑️ Elemento ${id} eliminado`);
        }
    }

    /**
     * Crea un panel temporal
     */
    crearPanelTemporal(titulo, contenido) {
        // Remover panel anterior si existe
        this.cerrarPanelTemporal();
        
        const panel = document.createElement('div');
        panel.id = 'panel-temporal-planeamiento';
        panel.className = 'panel-temporal';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>${titulo}</h3>
                <button class="btn-cerrar" onclick="sistemaPl.cerrarPanelTemporal()">✕</button>
            </div>
            <div class="panel-body">
                ${contenido}
            </div>
        `;
        
        document.body.appendChild(panel);
        return panel;
    }

    /**
     * Cierra el panel temporal
     */
    cerrarPanelTemporal() {
        const panel = document.getElementById('panel-temporal-planeamiento');
        if (panel) {
            panel.remove();
        }
    }

    /**
     * Cambia el cursor
     */
    cambiarCursor(tipo) {
        document.body.style.cursor = tipo;
    }

    /**
     * Carga configuración inicial
     */
    cargarConfiguracionInicial() {
        // Cargar datos guardados o configuración por defecto
        this.aplicarEstilosPlaneamiento();
    }

    /**
     * Aplica estilos específicos del planeamiento
     */
    aplicarEstilosPlaneamiento() {
        if (document.getElementById('estilos-planeamiento')) return;

        const estilos = document.createElement('style');
        estilos.id = 'estilos-planeamiento';
        estilos.textContent = `
            /* Estilos del Sistema de Planeamiento */
            .elemento-planeamiento {
                position: absolute;
                user-select: none;
                cursor: pointer;
                z-index: 100;
                transition: all 0.2s ease;
            }

            .elemento-planeamiento:hover {
                transform: scale(1.1);
                z-index: 200;
            }

            .elemento-planeamiento.seleccionado {
                box-shadow: 0 0 10px #00ff00;
                border: 2px solid #00ff00;
                border-radius: 4px;
            }

            .unidad-militar {
                background: rgba(0,255,0,0.1);
                border: 1px solid rgba(0,255,0,0.3);
                border-radius: 6px;
                padding: 4px;
                min-width: 80px;
                text-align: center;
            }

            .simbolo-unidad {
                font-size: 24px;
                margin-bottom: 2px;
            }

            .etiqueta-unidad {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                color: #00ff00;
            }

            .designacion {
                font-weight: bold;
                margin-bottom: 1px;
            }

            .estado {
                display: flex;
                justify-content: space-between;
                font-size: 8px;
                opacity: 0.8;
            }

            .panel-temporal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a1a;
                border: 2px solid #00ff00;
                border-radius: 8px;
                z-index: 2000;
                min-width: 300px;
                box-shadow: 0 0 20px rgba(0,255,0,0.5);
            }

            .panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: linear-gradient(135deg, #2d2d2d, #1a1a1a);
                border-bottom: 1px solid #333;
            }

            .panel-header h3 {
                color: #00ff00;
                margin: 0;
                font-family: 'Courier New', monospace;
            }

            .btn-cerrar {
                background: rgba(255,0,0,0.2);
                border: 1px solid rgba(255,0,0,0.5);
                color: #ff6666;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
            }

            .panel-body {
                padding: 16px;
            }

            .formulario-unidad,
            .formulario-objetivo {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .campo-formulario {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .campo-formulario label {
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                font-weight: bold;
            }

            .campo-formulario input,
            .campo-formulario select {
                background: rgba(0,255,0,0.1);
                border: 1px solid rgba(0,255,0,0.3);
                color: #00ff00;
                padding: 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
            }

            .acciones-panel {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-top: 16px;
            }

            .btn-confirmar,
            .btn-cancelar {
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            }

            .btn-confirmar {
                background: rgba(0,255,0,0.2);
                border: 1px solid rgba(0,255,0,0.5);
                color: #00ff00;
            }

            .btn-cancelar {
                background: rgba(255,0,0,0.2);
                border: 1px solid rgba(255,0,0,0.5);
                color: #ff6666;
            }

            .btn-confirmar:hover,
            .btn-cancelar:hover {
                transform: scale(1.05);
                opacity: 0.9;
            }
        `;
        
        document.head.appendChild(estilos);
    }

    /**
     * Exporta la configuración actual
     */
    exportarConfiguracion() {
        return {
            unidades: Object.fromEntries(this.configuracion.unidades),
            objetivos: Object.fromEntries(this.configuracion.objetivos),
            zonasOperacion: Object.fromEntries(this.configuracion.zonasOperacion),
            restricciones: Object.fromEntries(this.configuracion.restricciones)
        };
    }

    /**
     * Importa una configuración
     */
    importarConfiguracion(datos) {
        if (datos.unidades) {
            this.configuracion.unidades = new Map(Object.entries(datos.unidades));
        }
        if (datos.objetivos) {
            this.configuracion.objetivos = new Map(Object.entries(datos.objetivos));
        }
        // ... resto de datos
        
        this.renderizarTodoElMapa();
    }

    /**
     * Obtiene el estado actual del sistema
     */
    obtenerEstado() {
        return {
            inicializado: this.inicializado,
            modoActual: this.modoActual,
            herramientaActiva: this.herramientaActiva,
            elementoSeleccionado: this.elementoSeleccionado?.id || null,
            totalUnidades: this.configuracion.unidades.size,
            totalObjetivos: this.configuracion.objetivos.size
        };
    }
}

// Funciones globales de planeamiento (retrocompatibilidad)
window.SistemaPlaneamiento = SistemaPlaneamiento;
window.sistemaPl = null;

window.inicializarSistemaPlaneamiento = function() {
    try {
        if (window.sistemaPl) {
            console.log('Sistema de planeamiento ya inicializado');
            return window.sistemaPl;
        }
        
        window.sistemaPl = new SistemaPlaneamiento();
        window.sistemaPl.inicializar();
        
        return window.sistemaPl;
    } catch (error) {
        console.error('❌ Error inicializando sistema de planeamiento:', error);
        throw error;
    }
};

// Funciones específicas extraídas del HTML
window.confirmarCreacionUnidad = function() {
    if (window.sistemaPl) {
        window.sistemaPl.confirmarCreacionUnidad();
    }
};

window.cancelarCreacionUnidad = function() {
    if (window.sistemaPl) {
        window.sistemaPl.cancelarOperacionActual();
    }
};

window.confirmarCreacionObjetivo = function() {
    const datos = {
        tipo: document.getElementById('tipo-objetivo')?.value,
        descripcion: document.getElementById('descripcion-objetivo')?.value,
        prioridad: document.getElementById('prioridad-objetivo')?.value
    };

    if (!datos.descripcion) {
        alert('Por favor ingresa una descripción para el objetivo');
        return;
    }

    // Implementar creación de objetivo
    console.log('🎯 Creando objetivo:', datos);
    window.sistemaPl?.cerrarPanelTemporal();
};

window.cancelarCreacionObjetivo = function() {
    if (window.sistemaPl) {
        window.sistemaPl.cancelarOperacionActual();
    }
};

console.log('✅ Sistema de Planeamiento modular cargado');
