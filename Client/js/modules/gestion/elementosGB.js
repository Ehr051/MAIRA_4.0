/**
 * elementosGB.js
 * Módulo de gestión de elementos en el mapa para Gestión de Batalla en MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de elementos
MAIRA.Elementos = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementoTrabajo = null;
    let elementosConectados = {};
    let elementoSeleccionado = null;
    let marcadorUsuario = null;
    let ultimaPosicion = null;
    let siguiendoElemento = null;
    let seguimientoActivo = false;
    let intervaloSeguimientoElemento = null;
    // Sistema de tracking para elementos
    let trackingActivado = false;
    let trackingIntervalos = {};
    let trackHistorial = {}; // Almacena historial de posiciones

    /**
     * Inicializa el módulo de elementos
     * @param {Object} config - Configuración del módulo
     */
    // Añadir esto al inicio del módulo MAIRA.Elementos, dentro de la función inicializar
    function inicializar(config) {
        console.log("Inicializando módulo de elementos");
        
        // Validar configuración requerida
        if (!config) {
            console.error("No se proporcionó configuración para inicializar el módulo");
            return false;
        }
    
        try {
            // Guardar referencias con validación
            socket = config.socket;
            if (!socket) console.warn("Socket no proporcionado en la configuración");
    
            usuarioInfo = config.usuarioInfo;
            if (!usuarioInfo) console.warn("Información de usuario no proporcionada");
    
            operacionActual = config.operacionActual;
            if (!operacionActual) console.warn("Operación actual no proporcionada");
    
            // NUEVO: Primero intentar cargar elementoTrabajo desde localStorage si existe
            try {
                const elementoTrabajoGuardado = localStorage.getItem('elemento_trabajo');
                if (elementoTrabajoGuardado) {
                    const elementoTrabajoObj = JSON.parse(elementoTrabajoGuardado);
                    console.log("Cargando elementoTrabajo desde localStorage:", elementoTrabajoObj);
                    
                    // Priorizar datos guardados sobre los de configuración
                    elementoTrabajo = {
                        ...(config.elementoTrabajo || {}),
                        ...elementoTrabajoObj
                    };
                    
                    // Actualizar también en la configuración y en MAIRA.GestionBatalla
                    config.elementoTrabajo = elementoTrabajo;
                    if (window.MAIRA && window.MAIRA.GestionBatalla) {
                        window.MAIRA.GestionBatalla.elementoTrabajo = elementoTrabajo;
                    }
                } else {
                    elementoTrabajo = config.elementoTrabajo;
                }
            } catch (e) {
                console.warn("Error al cargar elementoTrabajo desde localStorage:", e);
                elementoTrabajo = config.elementoTrabajo;
            }
            
            ultimaPosicion = config.ultimaPosicion;
            
            // NUEVO: Intentar cargar elementosConectados desde localStorage
            try {
                const elementosGuardados = localStorage.getItem('elementos_conectados');
                if (elementosGuardados) {
                    const elementosParsed = JSON.parse(elementosGuardados);
                    console.log("Cargando elementos desde localStorage:", Object.keys(elementosParsed).length);
                    
                    // Inicializar estructura
                    elementosConectados = {};
                    
                    // Solo cargar los datos, los marcadores se crearán después
                    Object.entries(elementosParsed).forEach(([id, elem]) => {
                        elementosConectados[id] = { 
                            datos: elem.datos,
                            marcador: null 
                        };
                    });
                } else {
                    // Si no hay datos guardados, usar los proporcionados
                    elementosConectados = config.elementosConectados || {};
                }
            } catch (e) {
                console.warn("Error al cargar elementos desde localStorage:", e);
                elementosConectados = config.elementosConectados || {};
            }
    
            // Restaurar estado previo de tracking si existe
            const trackingActivo = localStorage.getItem('tracking_activado') === 'true';
            if (trackingActivo) {
                console.log("Restaurando estado de tracking anterior");
                iniciarTrackingElementos();
            }
    
            // Inicializar componentes en orden
            inicializarInterfazElementos();
            
            // Solicitar lista solo si hay conexión
            if (socket?.connected) {
                solicitarListaElementos();
            } else {
                console.warn("No hay conexión para solicitar lista de elementos");
            }
            
            // Configurar eventos
            configurarEventosElementos();
            
            console.log("Módulo de elementos inicializado exitosamente");
            return true;
    
        } catch (error) {
            console.error("Error al inicializar módulo de elementos:", error);
            return false;
        }
    }
    

    // Añadir en la sección de obtención de opciones de menú
function obtenerOpcionesMenuRadial(elemento) {
    const opciones = [
        {
            title: 'Editar',
            action: 'edit',
            icon: 'fas fa-edit',
            tooltip: 'Editar elemento',
            callback: () => editarElementoGB(elemento)
        },
        {
            title: 'Seguir',
            action: 'follow',
            icon: 'fas fa-crosshairs',
            tooltip: 'Seguir elemento',
            callback: () => iniciarSeguimientoElemento(elemento.options.id)
        },
        {
            title: 'Chat',
            action: 'chat',
            icon: 'fas fa-comment',
            tooltip: 'Chat privado',
            callback: () => iniciarChatPrivado(elemento.options.id)
        },
        {
            title: 'Detalles',
            action: 'details',
            icon: 'fas fa-info-circle',
            tooltip: 'Ver detalles',
            callback: () => mostrarDetallesElemento(elemento.options.id)
        }
    ];

    return opciones;
}

// Añadir esta función para editar elementos desde el menú radial
function editarElementoGB(elemento) {
    console.log("Editando elemento:", elemento);
    
    if (!elemento) {
        console.warn("No hay elemento para editar");
        return;
    }
    
    // Asegurarnos que el elemento seleccionado esté actualizado
    window.elementoSeleccionadoGB = elemento;
    window.elementoSeleccionado = elemento;
    
    // Usar la función correcta según el tipo de elemento
    if (window.editarelementoSeleccionadoGB) {
        window.editarelementoSeleccionadoGB();
    } else if (window.guardarCambiosUnidadGB) {
        if (elemento.options?.sidc) {
            window.mostrarPanelEdicionUnidad(elemento);
        }
    } else {
        console.warn("No se encontró función de edición adecuada");
    }
}

function buscarElementoEnPosicion(latlng) {
    console.log("Buscando elemento en posición:", latlng);
    
    if (!window.mapa) {
        console.error("Mapa no disponible para buscar elementos");
        return null;
    }
    
    let elementoEncontrado = null;
    let distanciaMinima = Infinity;
    const puntoClick = window.mapa.latLngToContainerPoint(latlng);
    const radioDeteccion = 60; // Aumentado a 60 píxeles para ser más permisivo
    
    // Imprimir todos los elementos conectados para diagnóstico
    console.log(`Elementos conectados disponibles: ${Object.keys(elementosConectados).length}`);
    Object.entries(elementosConectados).forEach(([id, elem]) => {
        if (elem.marcador) {
            const pos = elem.marcador.getLatLng();
            console.log(`- Elemento ID: ${id}, posición: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
        }
    });
    
    // Primero buscar en elementos conectados (que es lo más probable)
    Object.values(elementosConectados).forEach(elemento => {
        if (elemento.marcador) {
            try {
                const pos = elemento.marcador.getLatLng();
                const puntoMarcador = window.mapa.latLngToContainerPoint(pos);
                const distancia = puntoClick.distanceTo(puntoMarcador);
                
                console.log(`Elemento ${elemento.datos?.id}, distancia: ${distancia}px`);
                
                if (distancia < radioDeteccion && distancia < distanciaMinima) {
                    elementoEncontrado = elemento.marcador;
                    distanciaMinima = distancia;
                }
            } catch (e) {
                console.error("Error al calcular distancia para elemento:", e);
            }
        }
    });
    
    // Si no se encontró nada, buscar en todas las capas
    if (!elementoEncontrado) {
        console.log("Buscando en calcoActivo...");
        if (window.calcoActivo) {
            window.calcoActivo.eachLayer(function(layer) {
                if (layer instanceof L.Marker) {
                    try {
                        const puntoMarcador = window.mapa.latLngToContainerPoint(layer.getLatLng());
                        const distancia = puntoClick.distanceTo(puntoMarcador);
                        
                        if (distancia < radioDeteccion && distancia < distanciaMinima) {
                            elementoEncontrado = layer;
                            distanciaMinima = distancia;
                        }
                    } catch (e) {
                        console.error("Error al procesar capa en calcoActivo:", e);
                    }
                }
            });
        }
    }
    
    console.log(`[Elementos] Elemento encontrado en (${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}):`, 
                elementoEncontrado, "distancia:", distanciaMinima.toFixed(2) + "px");
    
    return elementoEncontrado;
}
    
    /**
     * Inicializa la interfaz de elementos
     */
    function inicializarInterfazElementos() {
        console.log("Inicializando interfaz de elementos");
        
        // Mejorar la lista de elementos
        mejorarListaElementos();
        
        // Inicializar estilos para elementos
        inicializarEstilosElementos();
        
        console.log("Interfaz de elementos inicializada");
    }
    
    /**
     * Inicializa los estilos para elementos
     */
    function inicializarEstilosElementos() {
        // Verificar si ya existe la hoja de estilos
        if (document.getElementById('estilos-elementos')) {
            return;
        }
        
        // Crear hoja de estilos
        const style = document.createElement('style');
        style.id = 'estilos-elementos';
        style.textContent = `
            /* Estilos para lista de elementos */
            .elemento-item {
                transition: background-color 0.2s;
                border-bottom: 1px solid #eee;
                margin-bottom: 8px;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .elemento-item:hover {
                background-color: #f5f5f5;
            }
            
            .elemento-item.seleccionado {
                background-color: #e3f2fd;
                border-left: 3px solid #2196F3;
            }
            
            .elemento-item.usuario-actual {
                background-color: #e8f5e9;
                border-left: 3px solid #4CAF50;
            }
            
            .elemento-item .elemento-acciones button {
                background: none;
                border: none;
                color: #0281a8;
                padding: 5px;
                margin: 0 3px;
                cursor: pointer;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .elemento-item .elemento-acciones button:hover {
                background-color: rgba(2, 129, 168, 0.1);
            }
            
            .elemento-icon {
                position: relative;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .elemento-status {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 1px solid white;
            }
            
            .elemento-status.online {
                background-color: #4CAF50;
            }
            
            .elemento-status.offline {
                background-color: #9E9E9E;
            }
            
            /* Estilos para marcadores */
            .temp-marker-pin {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: #2196F3;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
            
            /* Estilos para menú contextual */
            .menu-contextual-elemento {
                position: absolute;
                background-color: white;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                padding: 5px 0;
                z-index: 1000;
                min-width: 180px;
            }
            
            .menu-contextual-elemento .menu-item {
                padding: 8px 15px;
                cursor: pointer;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
            }
            
            .menu-contextual-elemento .menu-item:hover {
                background-color: #f5f5f5;
            }
            
            .menu-contextual-elemento .menu-item i {
                margin-right: 8px;
                width: 16px;
                text-align: center;
                color: #555;
            }
            
            /* Estilos para seguimiento activo */
            .siguiendo-elemento {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background-color: rgba(33, 150, 243, 0.9);
                color: white;
                padding: 10px 15px;
                border-radius: 50px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                display: flex;
                align-items: center;
                font-size: 14px;
            }
            
            .siguiendo-elemento i {
                margin-right: 8px;
            }
            
            .siguiendo-elemento button {
                margin-left: 10px;
                background-color: transparent;
                border: none;
                color: white;
                cursor: pointer;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .siguiendo-elemento button:hover {
                background-color: rgba(255,255,255,0.2);
            }
             // Añadir al bloque de estilos existente en inicializarEstilosElementos()

                .elemento-posicion {
                    font-size: 0.8em;
                    color: #666;
                    margin-top: 2px;
                }

                .elemento-item .elemento-info {
                    flex-grow: 1;
                    padding: 0 10px;
                    overflow: hidden;
                }

                .elemento-item .elemento-tiempo {
                    font-size: 0.8em;
                    color: #999;
                }   
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Configura los eventos para el módulo de elementos
     */
        function configurarEventosElementos() {
        console.log("Configurando eventos del módulo de elementos");
        
        // 1. Configurar botones de la interfaz
        configurarBotonesInterfaz();
        
        // 2. Configurar eventos de elementos en el mapa
        configurarEventosElementosMapa();
        
        // 3. Inicializar menú contextual
        inicializarMenuContextual();
        
        // 4. Configurar eventos táctiles para móviles
        configurarEventosTactiles();
        
        console.log("Eventos del módulo de elementos configurados");
    }
    
    function configurarBotonesInterfaz() {
        // Botones de acción para elementos
        const botones = {
            'btn-seguimiento': toggleSeguimiento,
            'btn-centrar': centrarEnPosicion,
            'btn-ver-todos': mostrarTodosElementos,
            'btnBuscarElemento': mostrarModalBusqueda
        };
    
        Object.entries(botones).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
                console.log(`Botón ${id} configurado`);
            }
        });
    
        // Campo de búsqueda de elementos
        const busquedaElemento = document.getElementById('busqueda-elemento');
        if (busquedaElemento) {
            busquedaElemento.addEventListener('input', (e) => buscarElementos(e.target.value));
        }
    }
    
    function configurarEventosElementosMapa() {
        // Eventos para elementos en el mapa
        window.mapa.on('click', function(e) {
            // Ocultar menú contextual si está visible
            const menuContextual = document.getElementById('menu-contextual-elemento');
            if (menuContextual) {
                menuContextual.style.display = 'none';
            }
        });
    
        // Configurar eventos para elementos existentes
        Object.values(elementosConectados).forEach(elemento => {
            if (elemento.marcador) {
                configurarEventosMarcador(elemento.marcador);
            }
        });
    }
    
    function configurarEventosMarcador(marcador) {
        // Click simple para seleccionar
        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            seleccionarElementoGB(this);
        });
    
        // Click derecho para menú radial
        marcador.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            window.elementoSeleccionadoGB = this;
            
            if (window.MiRadial) {
                window.MiRadial.mostrarMenu(
                    e.originalEvent.pageX,
                    e.originalEvent.pageY,
                    'elemento'
                );
            }
        });
    }

function obtenerOpcionesMenuElemento(elemento) {
    const opciones = [
        {
            title: 'Editar',
            action: 'edit',
            icon: 'fas fa-edit',
            tooltip: 'Editar elemento',
            callback: () => editarElementoGB(elemento)
        },
        {
            title: 'Seguir',
            action: 'follow',
            icon: 'fas fa-crosshairs',
            tooltip: 'Seguir elemento',
            callback: () => iniciarSeguimientoElemento(elemento.options.id)
        },
        {
            title: 'Chat',
            action: 'chat',
            icon: 'fas fa-comment',
            tooltip: 'Chat privado',
            callback: () => iniciarChatPrivado(elemento.options.id)
        },
        {
            title: 'Detalles',
            action: 'details',
            icon: 'fas fa-info-circle',
            tooltip: 'Ver detalles',
            callback: () => mostrarDetallesElemento(elemento.options.id)
        }
    ];

    return opciones;
}

function editarElemento(elementoId) {
    const elemento = elementosConectados[elementoId];
    if (!elemento) return;

    if (MAIRA.EdicionGB && typeof MAIRA.EdicionGB.mostrarModalEdicion === 'function') {
        MAIRA.EdicionGB.mostrarModalEdicion(elemento);
    } else {
        console.error('Módulo de edición no disponible');
    }
}



function mostrarMenuRadial(e, elemento) {
    // Asegurarse que el módulo MenuRadial está disponible
    if (!window.MAIRA.MenuRadial) {
        console.error("Módulo MenuRadial no encontrado");
        return;
    }

    const opciones = [
        {
            titulo: 'Seguir',
            icono: 'fa-crosshairs',
            accion: () => iniciarSeguimientoElemento(elemento.options.id)
        },
        {
            titulo: 'Detalles',
            icono: 'fa-info-circle',
            accion: () => mostrarPanelDetalles(elemento)
        },
        {
            titulo: 'Mensaje',
            icono: 'fa-comment',
            accion: () => iniciarChatPrivado(elemento.options.id)
        },
        {
            titulo: 'Centrar',
            icono: 'fa-map-marker-alt',
            accion: () => centrarEnElemento(elemento.options.id)
        }
    ];

    window.MAIRA.MenuRadial.mostrar(e, opciones);
}

function mostrarPanelDetalles(elemento) {
    // Verificar si existe el panel de detalles
    const panelDetalles = document.getElementById('panel-detalles-elemento');
    if (!panelDetalles) return;

    const datos = elementosConectados[elemento.options.id]?.datos;
    if (!datos) return;

    // Actualizar contenido del panel
    panelDetalles.innerHTML = `
        <div class="detalles-cabecera">
            <div class="sidc-preview"></div>
            <h4>${datos.elemento?.designacion || 'Sin designación'}</h4>
        </div>
        <div class="detalles-info">
            <p><strong>Usuario:</strong> ${datos.usuario}</p>
            <p><strong>Dependencia:</strong> ${datos.elemento?.dependencia || 'N/A'}</p>
            <p><strong>Velocidad:</strong> ${datos.posicion?.velocidad?.toFixed(1) || 0} m/s</p>
            <p><strong>Rumbo:</strong> ${datos.posicion?.rumbo?.toFixed(1) || 0}°</p>
            <p><strong>Última actualización:</strong> ${MAIRA.Utils.formatearFecha(datos.timestamp)}</p>
        </div>
        <div class="detalles-acciones">
            <button onclick="MAIRA.Elementos.iniciarSeguimientoElemento('${elemento.options.id}')">
                <i class="fas fa-crosshairs"></i> Seguir
            </button>
            <button onclick="MAIRA.Elementos.iniciarChatPrivado('${elemento.options.id}')">
                <i class="fas fa-comment"></i> Mensaje
            </button>
        </div>
    `;

    // Mostrar panel
    panelDetalles.style.display = 'block';
}
    
    function configurarEventosTactiles() {
        // Para dispositivos móviles
        if ('ontouchstart' in window) {
            Object.values(elementosConectados).forEach(elemento => {
                if (elemento.marcador) {
                    let touchTimeout;
                    let touchStartTime;
                    let hasMoved = false;
    
                    elemento.marcador.on('touchstart', function(e) {
                        touchStartTime = Date.now();
                        hasMoved = false;
                        touchTimeout = setTimeout(() => {
                            if (!hasMoved) {
                                mostrarMenuContextualMarcador(e, this);
                            }
                        }, 500);
                    });
    
                    elemento.marcador.on('touchmove', function() {
                        hasMoved = true;
                        if (touchTimeout) {
                            clearTimeout(touchTimeout);
                        }
                    });
    
                    elemento.marcador.on('touchend', function(e) {
                        if (touchTimeout) {
                            clearTimeout(touchTimeout);
                        }
                        
                        const touchDuration = Date.now() - touchStartTime;
                        if (!hasMoved && touchDuration < 500) {
                            seleccionarElementoGB(this);
                        }
                    });
                }
            });
        }
    }
    
    function mostrarModalBusqueda() {
        const modal = document.getElementById('modalBuscarElemento');
        if (!modal) return;
    
        if (typeof $('#modalBuscarElemento').modal === 'function') {
            $('#modalBuscarElemento').modal('show');
        } else {
            modal.style.display = 'block';
            
            // Añadir botón de cierre si no existe
            if (!modal.querySelector('.close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-btn';
                closeBtn.innerHTML = '&times;';
                closeBtn.onclick = () => modal.style.display = 'none';
                modal.insertBefore(closeBtn, modal.firstChild);
            }
        }
    }
    
    /**
     * Configura los eventos de Socket.io para el módulo de elementos
     * @param {Object} socket - Objeto socket.io
     */


    function configurarEventosSocket(socket) {
        if (!socket) {
            console.warn("Socket no disponible para configurar eventos");
            return false;
        }
        
        console.log("Configurando eventos de socket para elementos");
        
        // Limpiar eventos previos para evitar duplicados
        socket.off('listaElementos');
        socket.off('nuevoElemento');
        socket.off('anunciarElemento');
        socket.off('actualizacionPosicion');
        socket.off('actualizarPosicion');
        socket.off('heartbeat');
        
        // Evento para recibir lista completa de elementos
        socket.on('listaElementos', function(elementos) {
            console.log(`Recibidos ${elementos?.length || 0} elementos del servidor:`, elementos);
            
            if (!elementos || !Array.isArray(elementos)) {
                console.warn("Lista de elementos inválida recibida:", elementos);
                return;
            }
            
            // Inicializar lista con los elementos recibidos
            inicializarListaElementos(elementos);
            
            // Solicitar explícitamente posiciones de todos los usuarios
            socket.emit('solicitarPosiciones', { operacion: operacionActual });
            
            // Actualizar listas de destinatarios
            if (window.MAIRA && window.MAIRA.Chat && typeof window.MAIRA.Chat.actualizarListaDestinatarios === 'function') {
                window.MAIRA.Chat.actualizarListaDestinatarios();
            }
            
            // Verificar si todos los elementos se procesaron correctamente
            console.log(`Elementos conectados después de procesar lista: ${Object.keys(elementosConectados).length}`);
        });
        
        // Eventos para elementos individuales
        socket.on('nuevoElemento', function(elemento) {
            console.log("Nuevo elemento recibido:", elemento);
            
            // Asegurar que el elemento tiene un ID
            if (!elemento || !elemento.id) {
                console.warn("Elemento sin ID recibido:", elemento);
                return;
            }
            
            // Procesar sin filtrar si es o no nuestro propio elemento
            procesarElementosRecibidos(elemento);
        });
        
        socket.on('anunciarElemento', function(elemento) {
            console.log("Elemento anunciado recibido:", elemento);
            
            // Asegurar que el elemento tiene un ID
            if (!elemento || !elemento.id) {
                console.warn("Elemento sin ID recibido:", elemento);
                return;
            }
            
            // Procesar sin filtrar si es o no nuestro propio elemento
            procesarElementosRecibidos(elemento);
        });
        
        // Iniciar envío periódico de heartbeat para mantener elementos activos
        iniciarHeartbeat();
        
        console.log("Eventos de socket para elementos configurados");
        return true;
    }

    function solicitarListaElementos() {
        // Obtener referencias necesarias
        const socket = window.socket;
        const operacionActual = window.MAIRA?.GestionBatalla?.operacionActual;
        const usuarioInfo = window.MAIRA?.GestionBatalla?.usuarioInfo;
        const elementoTrabajo = window.MAIRA?.GestionBatalla?.elementoTrabajo;
        const ultimaPosicion = window.MAIRA?.GestionBatalla?.ultimaPosicion;
    
        if (!socket?.connected || !operacionActual) {
            console.warn("[Elementos] No se puede solicitar lista de elementos: sin conexión o sin operación actual");
            return false;
        }
        
        console.log("[Elementos] Solicitando lista de elementos para la operación:", operacionActual);
        
        // Múltiples eventos para máxima compatibilidad
        socket.emit('solicitarElementos', { 
            operacion: operacionActual,
            solicitante: usuarioInfo?.id
        });
        
        socket.emit('listaElementos', { 
            operacion: operacionActual 
        });
        
        // También forzar anuncio propio
        if (usuarioInfo && elementoTrabajo) {
            const datosPropios = {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: ultimaPosicion,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true
            };
            
            socket.emit('anunciarElemento', datosPropios);
            socket.emit('nuevoElemento', datosPropios);
            
            // Procesar localmente
            if (typeof MAIRA.Elementos.procesarElementosRecibidos === 'function') {
                MAIRA.Elementos.procesarElementosRecibidos(datosPropios);
            }
        }
        
        console.log("[Elementos] Solicitud de lista de elementos enviada");
        return true;
    }
    
    // Hacer disponible globalmente
    window.solicitarListaElementos = solicitarListaElementos;
    
/**
 * Inicia envío periódico de heartbeat para mantener visibilidad
 */
function iniciarHeartbeat() {
    // Limpiar intervalo existente si hay
    if (window.heartbeatInterval) {
        clearInterval(window.heartbeatInterval);
    }
    
    window.heartbeatInterval = setInterval(() => {
        if (socket && socket.connected && usuarioInfo) {
            const datos = {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: ultimaPosicion,
                operacion: operacionActual,
                timestamp: new Date().toISOString(),
                conectado: true
            };
            
            socket.emit('heartbeat', datos);
            
            // También forzar solicitud de lista completa periódicamente
            if (Math.random() < 0.3) { // 30% de probabilidad para reducir tráfico
                socket.emit('solicitarElementos', { 
                    operacion: operacionActual,
                    solicitante: usuarioInfo.id
                });
            }
        }
    }, 5000); // cada 5 segundos
}



/**
 * Sincroniza elementos con todos los módulos
 */
function sincronizarElementos() {
    console.log(`Sincronizando elementos con otros módulos: ${Object.keys(elementosConectados).length} elementos`);
    
    // Asegurar que la referencia global esté actualizada
    window.elementosConectados = elementosConectados;
    
    // Actualizar con GestionBatalla si está disponible
    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
    }
    
    // Notificar al módulo de chat
    if (window.MAIRA && window.MAIRA.Chat && typeof window.MAIRA.Chat.sincronizarElementosChat === 'function') {
        window.MAIRA.Chat.sincronizarElementosChat(elementosConectados);
    }
    
    // Actualizar contador de elementos
    actualizarContadorElementos();
}

/**
 * Función para forzar la sincronización de elementos
 */
function forzarSincronizacionElementos() {
    console.log("Forzando sincronización completa de elementos");
    
    if (!socket || !socket.connected) {
        console.warn("No se puede forzar sincronización sin conexión al servidor");
        return false;
    }
    
    // NUEVO: Limpiar elementos duplicados o inválidos antes de sincronizar
    limpiarElementosDuplicados();
    
    // Solicitar lista completa de elementos
    socket.emit('solicitarElementos', {
        operacion: operacionActual,
        solicitante: usuarioInfo?.id,
        forzar: true
    });
    
    // Anunciar nuestra presencia para que otros nos vean
    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: ultimaPosicion,
        operacion: operacionActual,
        timestamp: new Date().toISOString(),
        conectado: true
    };
    
    // Enviar por múltiples canales para asegurar recepción
    socket.emit('anunciarElemento', datos);
    socket.emit('nuevoElemento', datos);
    socket.emit('heartbeat', datos);
    
    // IMPORTANTE: Enviar explícitamente TODOS los elementos guardados localmente
    // para propagar ediciones a todos los usuarios
    try {
        const elementosGuardados = localStorage.getItem('elementos_conectados');
        if (elementosGuardados) {
            const elementosParsed = JSON.parse(elementosGuardados);
            console.log(`Enviando ${Object.keys(elementosParsed).length} elementos guardados en sincronización forzada`);
            
            Object.values(elementosParsed).forEach(elem => {
                if (elem.datos) {
                    // Enviar por todos los canales disponibles
                    socket.emit('actualizarElemento', elem.datos);
                    socket.emit('nuevoElemento', elem.datos);
                    socket.emit('anunciarElemento', elem.datos);
                    
                    // Si tiene posición, enviar también por canal de posición
                    if (elem.datos.posicion) {
                        socket.emit('actualizarPosicionGB', elem.datos);
                    }
                    
                    console.log(`Enviando elemento ${elem.datos.id} en sincronización forzada`);
                }
            });
        }
    } catch (e) {
        console.error("Error al procesar elementos guardados durante sincronización:", e);
    }
    
    // Enviar mensaje de chat para forzar visibilidad
    const mensaje = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        usuario: 'Sistema',
        mensaje: `${usuarioInfo.usuario} ha forzado sincronización de elementos`,
        tipo: 'sistema',
        sala: operacionActual,
        timestamp: new Date().toISOString(),
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: elementoTrabajo
        }
    };
    
    socket.emit('mensajeChat', mensaje);
    
    // También solicitar posiciones
    socket.emit('solicitarPosiciones', { operacion: operacionActual });
    
    return true;
}

// Función para limpiar elementos duplicados
function limpiarElementosDuplicados() {
    console.log("🧹 Limpiando elementos duplicados o inválidos");
    
    // 1. Identificar IDs de usuarios existentes
    const idsUsuarios = new Set();
    const elementosAEliminar = [];
    
    // Primer paso: recopilar IDs de usuarios válidos
    Object.entries(elementosConectados).forEach(([id, elem]) => {
        // Verificar si es un ID de usuario (user_) vs un ID de elemento (elemento_)
        if (id.startsWith('user_')) {
            idsUsuarios.add(id);
        }
    });
    
    console.log(`🔍 Identificados ${idsUsuarios.size} IDs de usuarios únicos`);
    
    // 2. Buscar elementos con IDs similares (posibles duplicados)
    Object.entries(elementosConectados).forEach(([id, elem]) => {
        // Si es un ID de elemento y no de usuario
        if (id.startsWith('elemento_')) {
            // Extraer el ID base del usuario
            const match = id.match(/elemento_(\d+)_/);
            if (match && match[1]) {
                const idBase = match[1];
                
                // Buscar si existe un usuario con este ID base
                let tieneUsuarioCorrespondiente = false;
                idsUsuarios.forEach(idUsuario => {
                    if (idUsuario.includes(idBase)) {
                        tieneUsuarioCorrespondiente = true;
                    }
                });
                
                // Si hay un usuario correspondiente, marcar para eliminación
                if (tieneUsuarioCorrespondiente) {
                    elementosAEliminar.push(id);
                }
            }
        }
        
        // También verificar si el elemento es válido (tiene datos)
        if (!elem || !elem.datos) {
            elementosAEliminar.push(id);
        }
    });
    
    // 3. Eliminar elementos duplicados o inválidos
    elementosAEliminar.forEach(id => {
        console.log(`🗑️ Eliminando elemento duplicado/inválido: ${id}`);
        
        // Eliminar del mapa si tiene marcador
        if (elementosConectados[id]?.marcador && window.mapa) {
            try {
                window.mapa.removeLayer(elementosConectados[id].marcador);
            } catch (e) {
                console.warn(`Error al eliminar marcador de ${id}:`, e);
            }
        }
        
        // Eliminar de la estructura
        delete elementosConectados[id];
        
        // Eliminar de la lista visual
        const elementoItem = document.querySelector(`.elemento-item[data-id="${id}"]`);
        if (elementoItem) {
            elementoItem.remove();
        }
    });
    
    // 4. Actualizar localStorage con la lista limpia
    guardarElementosEnLocalStorage();
    
    console.log(`✅ Limpieza completada: eliminados ${elementosAEliminar.length} elementos`);
    
    return elementosAEliminar.length;
}

// Exponer la función forzar sincronización globalmente para llamarla desde consola
window.forzarSincronizacionElementos = forzarSincronizacionElementos;


function procesarElementosRecibidos(elemento) {
    console.log("Procesando elemento recibido:", elemento);
    
    // Si es un array, procesar cada elemento
    if (Array.isArray(elemento)) {
        elemento.forEach(elem => procesarElementosRecibidos(elem));
        return;
    }
    
    // Si no tiene ID, no podemos procesarlo
    if (!elemento || !elemento.id) {
        console.warn("Elemento sin ID válido ignorado");
        return null;
    }
    
    // NUEVO: Verificar si hay datos guardados localmente
    let elementoGuardadoLocal = null;
    try {
        const elementosGuardados = localStorage.getItem('elementos_conectados');
        if (elementosGuardados) {
            const elementosParsed = JSON.parse(elementosGuardados);
            if (elementosParsed[elemento.id] && elementosParsed[elemento.id].datos) {
                elementoGuardadoLocal = elementosParsed[elemento.id].datos;
                console.log(`Encontrado elemento guardado localmente para: ${elemento.id}`);
            }
        }
    } catch (e) {
        console.warn(`Error al buscar datos locales del elemento ${elemento.id}:`, e);
    }
    
    // Verificar si ya existe
    const elementoExistente = elementosConectados[elemento.id];
    
    if (elementoExistente) {
        // NUEVO: Preservar datos importantes del elemento guardado localmente
        if (elementoGuardadoLocal) {
            // Si hay cambios locales, mantenerlos
            elemento.sidc = elementoGuardadoLocal.sidc || elemento.sidc;
            elemento.designacion = elementoGuardadoLocal.designacion || elemento.designacion;
            elemento.dependencia = elementoGuardadoLocal.dependencia || elemento.dependencia;
            elemento.magnitud = elementoGuardadoLocal.magnitud || elemento.magnitud;
            
            // También actualizar elemento.elemento
            if (elemento.elemento) {
                elemento.elemento.sidc = elemento.sidc;
                elemento.elemento.designacion = elemento.designacion;
                elemento.elemento.dependencia = elemento.dependencia;
                elemento.elemento.magnitud = elemento.magnitud;
            }
            
            console.log(`Preservados datos locales para elemento ${elemento.id}`);
        }
        
        // Actualizar datos
        elementosConectados[elemento.id].datos = {
            ...elementoExistente.datos,
            ...elemento,
            posicion: elemento.posicion || elementoExistente.datos.posicion
        };
        
        // Actualizar marcador si existe
        if (elementoExistente.marcador && elemento.posicion) {
            try {
                elementoExistente.marcador.setLatLng([elemento.posicion.lat, elemento.posicion.lng]);
                console.log(`Posición de marcador actualizada: ${elemento.posicion.lat}, ${elemento.posicion.lng}`);
                
                // Si hay cambio de SIDC, actualizar icono
                if (elemento.sidc && elemento.sidc !== elementoExistente.marcador.options.sidc) {
                    actualizarIconoMarcador(elementoExistente.marcador, elemento);
                }
            } catch (e) {
                console.error(`Error al actualizar posición de marcador ${elemento.id}:`, e);
            }
        }
        // Crear marcador si no existe pero tenemos posición
        else if (!elementoExistente.marcador && elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
            elementosConectados[elemento.id].marcador = crearMarcadorElemento(elemento);
        }
        
        // Actualizar en lista visual
        actualizarElementoEnLista(elemento);
    } 
    // Elemento nuevo
    else {
        // Si hay datos guardados localmente, mezclarlos con los recibidos
        if (elementoGuardadoLocal) {
            // Mantener los datos guardados para los campos importantes
            elemento.sidc = elementoGuardadoLocal.sidc || elemento.sidc;
            elemento.designacion = elementoGuardadoLocal.designacion || elemento.designacion;
            elemento.dependencia = elementoGuardadoLocal.dependencia || elemento.dependencia;
            elemento.magnitud = elementoGuardadoLocal.magnitud || elemento.magnitud;
            
            // Actualizar también elemento.elemento
            if (elemento.elemento) {
                elemento.elemento.sidc = elemento.sidc;
                elemento.elemento.designacion = elemento.designacion;
                elemento.elemento.dependencia = elemento.dependencia;
                elemento.elemento.magnitud = elemento.magnitud;
            }
            
            console.log(`Aplicados datos locales al nuevo elemento ${elemento.id}`);
        }
        
        // Guardar en estructura
        elementosConectados[elemento.id] = {
            datos: elemento,
            marcador: null
        };
        
        // Crear marcador si tiene posición
        if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
            elementosConectados[elemento.id].marcador = crearMarcadorElemento(elemento);
        }
        
        // Agregar a lista visual
        agregarElementoALista(elemento);
    }
    
    // NUEVO: Guardar en localStorage para persistencia
    guardarElementosEnLocalStorage();
    
    // Sincronizar con referencias globales
    window.elementosConectados = elementosConectados;
    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
    }
    
    // Sincronizar con otros módulos
    sincronizarElementos();
    
    // Actualizar destinatarios de chat si está disponible
    if (MAIRA.Chat && typeof MAIRA.Chat.actualizarListaDestinatarios === 'function') {
        MAIRA.Chat.actualizarListaDestinatarios();
    }
    
    return elementosConectados[elemento.id];
}

// Añadir función para actualizar ícono de marcador
function actualizarIconoMarcador(marcador, datos) {
    if (!marcador || !datos) return;
    
    try {
        // Obtener el SIDC correcto
        const sidc = datos.sidc || (datos.elemento && datos.elemento.sidc) || 'SFGPUCI-----';
        
        // Crear símbolo militar
        const sym = new ms.Symbol(sidc, {
            size: 35,
            direction: datos.posicion?.rumbo || 0,
            uniqueDesignation: datos.designacion || datos.nombre || ''
        });
        
        // Actualizar icono
        marcador.setIcon(L.divIcon({
            className: 'elemento-militar',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        }));
        
        // Actualizar opciones
        marcador.options.sidc = sidc;
        
        // Forzar no arrastrable
        if (marcador.dragging) {
            marcador.dragging.disable();
        }
        marcador.options.draggable = false;
        
        return true;
    } catch (error) {
        console.error("Error al actualizar ícono del marcador:", error);
        return false;
    }
}

function actualizarElementoEnLista(elemento) {
    if (!elemento || !elemento.id) return;
    
    console.log(`Actualizando elemento en lista visual: ${elemento.id}`);
    
    const elementoItem = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
    if (!elementoItem) {
        console.log(`Elemento con ID ${elemento.id} no encontrado en lista, creándolo...`);
        agregarElementoALista(elemento);
        return;
    }
    
    // Obtener referencias a los elementos a actualizar
    const nombreElement = elementoItem.querySelector('.elemento-nombre');
    const usuarioElement = elementoItem.querySelector('.elemento-usuario');
    const iconElement = elementoItem.querySelector('.sidc-preview');
    const statusElement = elementoItem.querySelector('.elemento-status');
    const tiempoElement = elementoItem.querySelector('.elemento-tiempo');
    
    // Actualizar nombre/designación
    if (nombreElement) {
        const designacion = (elemento.elemento && elemento.elemento.designacion) || 
                         elemento.designacion || 
                         '';
        const dependencia = (elemento.elemento && elemento.elemento.dependencia) || 
                         elemento.dependencia || 
                         '';
        
        nombreElement.textContent = designacion || (dependencia ? `/${dependencia}` : '') || 'Sin nombre';
    }
    
    // Actualizar usuario
    if (usuarioElement) {
        usuarioElement.textContent = elemento.usuario || 'Usuario';
    }
    
    // Actualizar tiempo
    if (tiempoElement) {
        tiempoElement.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Actualizar estado (conectado/desconectado)
    if (statusElement) {
        statusElement.className = `elemento-status ${elemento.conectado ? 'online' : 'offline'}`;
    }
    
    // Actualizar icono/sidc - Parte más importante
    if (iconElement && typeof ms !== 'undefined') {
        const sidc = (elemento.elemento && elemento.elemento.sidc) || 
                  elemento.sidc || 
                  'SFGPUCI-----';
        try {
            const sym = new ms.Symbol(sidc, {size: 20});
            iconElement.innerHTML = sym.asSVG();
            console.log(`✅ Icono actualizado para elemento ${elemento.id} con SIDC ${sidc}`);
        } catch (e) {
            console.warn(`Error al generar símbolo para elemento ${elemento.id}:`, e);
        }
    }
    
    console.log(`Elemento ${elemento.id} actualizado en la lista visual`);
}

// Corrección en iniciarSeguimiento para evitar errores en dispositivos móviles
function iniciarSeguimiento() {
    console.log("Iniciando seguimiento de posición");
    
    // Comprobar si ya hay un seguimiento activo
    if (seguimientoActivo) {
        console.log("El seguimiento ya está activo");
        return;
    }
    
    // Comprobar soporte de geolocalización
    if (!navigator.geolocation) {
        if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
        } else {
            alert("Tu navegador no soporta geolocalización");
        }
        return;
    }
    
    // Configurar botón de seguimiento como activo
    const btnSeguimiento = document.getElementById('btn-seguimiento');
    if (btnSeguimiento) {
        btnSeguimiento.classList.add('active');
        btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow text-primary"></i> Seguimiento activo';
    }
    
    // Opciones de seguimiento optimizadas
    const opcionesSeguimiento = {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000
    };
    
    try {
        // Iniciar seguimiento continuo
        watchId = navigator.geolocation.watchPosition(
            posicionActualizada,
            errorPosicion,
            opcionesSeguimiento
        );
        
        // Activar la variable de seguimiento
        seguimientoActivo = true;
        
        // Agregar intervalo adicional para envío periódico si no existe
        if (!window.intervaloPosicion) {
            window.intervaloPosicion = setInterval(function() {
                if (socket && socket.connected && ultimaPosicion) {
                    // Usar la función más segura
                    enviarPosicionActual();
                }
            }, 20000); // Cada 20 segundos
        }
        
        // Guardar estado en localStorage
        localStorage.setItem('seguimiento_activo', 'true');
        
        console.log("Seguimiento iniciado con éxito");
    } catch (e) {
        console.error("Error al iniciar seguimiento:", e);
        if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
            MAIRA.Utils.mostrarNotificacion("Error al iniciar seguimiento de posición", "error");
        }
        
        // Revertir estado del botón
        if (btnSeguimiento) {
            btnSeguimiento.classList.remove('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
        }
    }
}

// Función segura para enviar posición actual
function enviarPosicionActual() {
    if (!socket?.connected || !usuarioInfo) return;
    
    // Obtener el elemento propio desde elementosConectados para tener datos actualizados
    const elementoPropio = elementosConectados[usuarioInfo.id];
    const elementoActualizado = elementoPropio?.datos || elementoTrabajo;
    
    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoActualizado, // Usar datos posiblemente actualizados
        posicion: ultimaPosicion,
        sidc: elementoActualizado.sidc, // Incluir SIDC explícitamente
        operacion: operacionActual,
        timestamp: new Date().toISOString(),
        conectado: true
    };
    
    socket.emit('actualizarPosicionGB', datos);
    socket.emit('nuevoElemento', datos);
    socket.emit('anunciarElemento', datos);
}






// Función auxiliar para actualizar elemento visual
// Agregar o mejorar en elementosGB.js
function actualizarElementoVisual(elementoId, nuevosDatos) {
    console.log(`Actualizando elemento visual: ${elementoId}`);
    
    if (!elementoId) return false;
    
    // Obtener elemento de la estructura de datos
    const elementoData = window.elementosConectados[elementoId];
    if (!elementoData) {
        console.warn(`Elemento ${elementoId} no encontrado en la lista`);
        return false;
    }
    
    // Si se proporcionan nuevos datos, actualizarlos
    if (nuevosDatos) {
        elementoData.datos = {...elementoData.datos, ...nuevosDatos};
    }
    
    // Actualizar marcador en el mapa
    if (elementoData.marcador) {
        // Si cambió el SIDC, actualizar el icono
        if (nuevosDatos && nuevosDatos.sidc && nuevosDatos.sidc !== elementoData.marcador.options.sidc) {
            try {
                const sym = new ms.Symbol(nuevosDatos.sidc, {
                    size: 35,
                    uniqueDesignation: nuevosDatos.designacion || elementoData.datos.designacion
                });
                
                const icon = L.divIcon({
                    className: 'elemento-militar',
                    html: sym.asSVG(),
                    iconSize: [70, 50],
                    iconAnchor: [35, 25]
                });
                
                elementoData.marcador.setIcon(icon);
                elementoData.marcador.options.sidc = nuevosDatos.sidc;
            } catch (e) {
                console.error(`Error al actualizar icono para ${elementoId}:`, e);
            }
        }
        
        // Si cambió la posición, actualizar en el mapa
        if (nuevosDatos && nuevosDatos.posicion) {
            elementoData.marcador.setLatLng([
                nuevosDatos.posicion.lat, 
                nuevosDatos.posicion.lng
            ]);
        }
    }
    
    // Actualizar en la lista visual
    const elementoItem = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    if (elementoItem) {
        // Actualizar nombre
        const nombreElemento = elementoItem.querySelector('.nombre-elemento');
        if (nombreElemento) {
            const designacion = elementoData.datos.designacion || '';
            const dependencia = elementoData.datos.dependencia || '';
            const texto = (designacion && dependencia) ? 
                          `${designacion}/${dependencia}` : 
                          (designacion || dependencia);
            
            nombreElemento.textContent = texto || elementoData.datos.usuario;
        }
        
        // Actualizar icono si hay un cambio de SIDC
        if (nuevosDatos && nuevosDatos.sidc) {
            const iconoLista = elementoItem.querySelector('.icono-elemento');
            if (iconoLista) {
                try {
                    const sym = new ms.Symbol(nuevosDatos.sidc, {
                        size: 20,
                        uniqueDesignation: ''
                    });
                    
                    iconoLista.innerHTML = sym.asSVG();
                } catch (e) {
                    console.error(`Error al actualizar icono de lista para ${elementoId}:`, e);
                }
            }
        }
    }
    
    return true;
}

// Asegurarnos de que está en el objeto MAIRA.Elementos
if (window.MAIRA && window.MAIRA.Elementos) {
    window.MAIRA.Elementos.actualizarElementoVisual = actualizarElementoVisual;
}


    /**
     * Mejora en la inicialización de la lista de elementos
     * @param {Array} elementos - Lista de elementos conectados
     */
    function inicializarListaElementos(elementos) {
        console.log("Inicializando lista de elementos:", elementos?.length || 0);
        
        // Cargar datos guardados en localStorage para preservarlos
        let datosGuardadosLocalmente = {};
        try {
            const elementosGuardados = localStorage.getItem('elementos_conectados');
            if (elementosGuardados) {
                const elementosParsed = JSON.parse(elementosGuardados);
                datosGuardadosLocalmente = elementosParsed;
            }
        } catch (e) {
            console.warn("Error al cargar elementos guardados:", e);
        }
        
        // Limpiar lista visual actual
        const listaElementosDiv = document.getElementById('lista-elementos');
        if (listaElementosDiv) {
            listaElementosDiv.innerHTML = '';
        }
        
        // Mantener elementos actuales que no estén en la nueva lista para preservar cambios locales
        const elementosActuales = {...elementosConectados};
        
        // Añadir cada elemento
        if (elementos && Array.isArray(elementos) && elementos.length > 0) {
            elementos.forEach(elemento => {
                if (!elemento || !elemento.id) return;
                
                // Verificar si hay datos guardados localmente para este elemento
                const datosLocales = datosGuardadosLocalmente[elemento.id]?.datos;
                
                // Mezclar datos recibidos con datos locales si existen
                if (datosLocales) {
                    // Preservar datos importantes
                    elemento.sidc = datosLocales.sidc || elemento.sidc;
                    elemento.designacion = datosLocales.designacion || elemento.designacion;
                    elemento.dependencia = datosLocales.dependencia || elemento.dependencia;
                    elemento.magnitud = datosLocales.magnitud || elemento.magnitud;
                    
                    // Actualizar también elemento.elemento
                    if (elemento.elemento) {
                        elemento.elemento.sidc = elemento.sidc;
                        elemento.elemento.designacion = elemento.designacion;
                        elemento.elemento.dependencia = elemento.dependencia;
                        elemento.elemento.magnitud = elemento.magnitud;
                    }
                }
                
                // Evitar duplicados y reemplazar datos existentes
                if (elementosConectados[elemento.id]) {
                    // Preservar marcador
                    const marcadorExistente = elementosConectados[elemento.id].marcador;
                    
                    // Preservar datos locales importantes
                    const datosExistentes = elementosConectados[elemento.id].datos;
                    if (datosExistentes) {
                        // No sobrescribir datos editados localmente
                        elemento.sidc = datosExistentes.sidc || elemento.sidc;
                        elemento.designacion = datosExistentes.designacion || elemento.designacion;
                        elemento.dependencia = datosExistentes.dependencia || elemento.dependencia;
                        elemento.magnitud = datosExistentes.magnitud || elemento.magnitud;
                        
                        // Actualizar también elemento.elemento
                        if (elemento.elemento) {
                            elemento.elemento.sidc = elemento.sidc;
                            elemento.elemento.designacion = elemento.designacion;
                            elemento.elemento.dependencia = elemento.dependencia;
                            elemento.elemento.magnitud = elemento.magnitud;
                        }
                    }
                    
                    // Actualizar datos
                    elementosConectados[elemento.id] = {
                        datos: elemento,
                        marcador: marcadorExistente
                    };
                    
                    // Actualizar marcador si tiene posición pero no marcador
                    if (!marcadorExistente && elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
                        crearMarcadorElemento(elemento);
                    }
                } else {
                    // Añadir nuevo elemento
                    elementosConectados[elemento.id] = {
                        datos: elemento,
                        marcador: null
                    };
                    
                    // Crear marcador si tiene posición
                    if (elemento.posicion && elemento.posicion.lat && elemento.posicion.lng) {
                        crearMarcadorElemento(elemento);
                    }
                }
                
                // Añadir a la interfaz visual
                agregarElementoALista(elemento);
            });
        }
        
        // NUEVO: Preservar elementos que solo existen localmente
        Object.entries(elementosActuales).forEach(([id, elemento]) => {
            if (!elementosConectados[id]) {
                console.log(`Preservando elemento local: ${id}`);
                elementosConectados[id] = elemento;
                if (elemento.datos) {
                    agregarElementoALista(elemento.datos);
                }
            }
        });
        
        // NUEVO: Guardar en localStorage para persistencia
        try {
            const elementosParaGuardar = {};
            Object.entries(elementosConectados).forEach(([id, elem]) => {
                elementosParaGuardar[id] = { datos: elem.datos };
            });
            localStorage.setItem('elementos_conectados', JSON.stringify(elementosParaGuardar));
        } catch (e) {
            console.error("Error al guardar elementos en localStorage:", e);
        }
        
        // Actualizar contador
        actualizarContadorElementos();
        
        // Sincronizar con otros módulos
        sincronizarElementos();
        
        console.log(`Lista de elementos inicializada con ${Object.keys(elementosConectados).length} elementos`);
    }
    
    function actualizarPosicionElemento(datos) {
        if (!datos || !datos.id || !datos.posicion) {
            console.warn("⚠️ Datos de posición incompletos:", datos);
            return;
        }
        
        console.log(`🔄 ACTUALIZANDO POSICIÓN: ${datos.id} → [${datos.posicion.lat}, ${datos.posicion.lng}]`);
        
        // Verificar que el elemento existe en nuestra estructura
        if (!elementosConectados[datos.id]) {
            console.warn(`⚠️ Elemento ${datos.id} no encontrado en elementosConectados`);
            return;
        }
        
        // Guardar posición anterior para verificar
        const posAnterior = elementosConectados[datos.id].datos.posicion;
        console.log(`ℹ️ Posición anterior: ${posAnterior?.lat || 'N/A'}, ${posAnterior?.lng || 'N/A'}`);
        
        // Actualizar la posición en la estructura de datos
        elementosConectados[datos.id].datos.posicion = datos.posicion;
        
        // Actualizar el marcador en el mapa si existe
        if (elementosConectados[datos.id].marcador) {
            const marcador = elementosConectados[datos.id].marcador;
            
            try {
                // Verificar si el marcador está en el mapa
                const estaEnMapa = window.mapa.hasLayer(marcador);
                console.log(`ℹ️ Marcador ${datos.id} está en el mapa: ${estaEnMapa ? 'Sí' : 'No'}`);
                
                if (!estaEnMapa) {
                    console.log(`🔄 Añadiendo marcador ${datos.id} al mapa`);
                    window.mapa.addLayer(marcador);
                }
                
                // Actualizar la posición del marcador
                const nuevaPos = [datos.posicion.lat, datos.posicion.lng];
                console.log(`🔄 Estableciendo posición de marcador ${datos.id} a:`, nuevaPos);
                marcador.setLatLng(nuevaPos);
                
                // Verificar posición después de la actualización
                const posActual = marcador.getLatLng();
                console.log(`✅ Posición actual del marcador: ${posActual.lat}, ${posActual.lng}`);
                
                // Si tiene info de rumbo, actualizar la rotación
                if (datos.posicion.rumbo !== undefined) {
                    console.log(`🔄 Actualizando rumbo a: ${datos.posicion.rumbo}°`);
                    actualizarRotacionMarcador(marcador, datos.posicion.rumbo);
                }
            } catch (e) {
                console.error(`❌ ERROR al actualizar marcador ${datos.id}:`, e);
                
                // Intentar recrear el marcador en caso de error
                console.log(`🔄 Intentando recrear marcador para ${datos.id}`);
                try {
                    if (window.mapa.hasLayer(marcador)) {
                        window.mapa.removeLayer(marcador);
                    }
                    elementosConectados[datos.id].marcador = crearMarcadorElemento(elementosConectados[datos.id].datos);
                    console.log(`✅ Marcador recreado exitosamente`);
                } catch (err) {
                    console.error(`❌ Error al recrear marcador:`, err);
                }
            }
        } else {
            console.log(`ℹ️ Elemento ${datos.id} no tiene marcador, creando uno nuevo`);
            try {
                elementosConectados[datos.id].marcador = crearMarcadorElemento(elementosConectados[datos.id].datos);
                if (elementosConectados[datos.id].marcador) {
                    console.log(`✅ Marcador creado exitosamente para ${datos.id}`);
                } else {
                    console.warn(`⚠️ No se pudo crear el marcador para ${datos.id}`);
                }
            } catch (e) {
                console.error(`❌ Error al crear marcador:`, e);
            }
        }
        
        // Actualizar información en la lista visual
        try {
            actualizarInfoPosicionEnLista(datos.id, datos.posicion);
            console.log(`✅ Información visual actualizada para ${datos.id}`);
        } catch (e) {
            console.error(`❌ Error al actualizar información visual:`, e);
        }
        
        // NUEVO: Guardar en localStorage también
        guardarElementosEnLocalStorage();
        
        // NUEVO: Propagar el elemento completo a todos los usuarios
        // Este es el cambio clave para que los usuarios que se conectan tarde reciban los elementos
        try {
            if (socket && socket.connected) {
                // Obtener los datos completos del elemento
                const elementoCompleto = elementosConectados[datos.id].datos;
                
                // Enviar elemento completo, no solo la posición
                socket.emit('actualizarElemento', elementoCompleto);
                socket.emit('nuevoElemento', elementoCompleto);
                socket.emit('anunciarElemento', elementoCompleto);
                
                console.log(`✅ Elemento completo propagado al actualizar posición: ${datos.id}`);
            }
        } catch (e) {
            console.error(`❌ Error al propagar elemento completo:`, e);
        }
        
        // Sincronizar referencias
        window.elementosConectados = elementosConectados;
    }
    
    function actualizarRotacionMarcador(marcador, rumbo) {
        if (!marcador || !rumbo) return;
        try {
            // Actualizar la rotación del marcador
            const icono = marcador.getIcon();
            if (icono && icono.options) {
                icono.options.rotationAngle = rumbo;
                icono.options.className = `elemento-militar rotated-${rumbo}`;
                marcador.setIcon(icono);
                console.log(`✅ Rotación del marcador actualizada a: ${rumbo}°`);
            }
        } catch (e) {
            console.error(`❌ Error al actualizar rotación del marcador:`, e);
        }
    }
    window.actualizarRotacionMarcador = actualizarRotacionMarcador;

    function limpiarElementosDuplicados() {
        console.log("🧹 Limpiando elementos duplicados o inválidos");
        
        // Paso 1: Mapear usuarios únicos
        const usuariosUnicos = {};
        const elementosAEliminar = [];
        
        // Primera pasada: identificar usuarios únicos y su mejor ID
        Object.entries(elementosConectados).forEach(([id, elem]) => {
            if (!elem.datos || !elem.datos.usuario) return;
            
            const usuario = elem.datos.usuario;
            
            // Si no tenemos este usuario registrado, o este ID es mejor
            if (!usuariosUnicos[usuario] || 
                (id.startsWith('user_') && !usuariosUnicos[usuario].startsWith('user_'))) {
                usuariosUnicos[usuario] = id;
            }
        });
        
        console.log(`🔍 Identificados ${Object.keys(usuariosUnicos).length} usuarios únicos`);
        
        // Segunda pasada: marcar para eliminación todos excepto el mejor
        Object.entries(elementosConectados).forEach(([id, elem]) => {
            if (!elem.datos || !elem.datos.usuario) {
                elementosAEliminar.push(id); // Eliminar elementos sin datos
                return;
            }
            
            const usuario = elem.datos.usuario;
            if (usuariosUnicos[usuario] && id !== usuariosUnicos[usuario]) {
                elementosAEliminar.push(id);
            }
        });
        
        // Tercera pasada: eliminar efectivamente
        elementosAEliminar.forEach(id => {
            console.log(`🗑️ Eliminando elemento duplicado/inválido: ${id}`);
            
            // Eliminar del mapa si tiene marcador
            if (elementosConectados[id]?.marcador && window.mapa) {
                try {
                    window.mapa.removeLayer(elementosConectados[id].marcador);
                } catch (e) {
                    console.warn(`Error al eliminar marcador de ${id}:`, e);
                }
            }
            
            // Eliminar de la estructura
            delete elementosConectados[id];
            
            // Eliminar de la lista visual
            const elementoItem = document.querySelector(`.elemento-item[data-id="${id}"]`);
            if (elementoItem) {
                elementoItem.remove();
            }
        });
        
        // Actualizar localStorage con la lista limpia
        guardarElementosEnLocalStorage();
        
        console.log(`✅ Limpieza completada: eliminados ${elementosAEliminar.length} elementos`);
        
        return elementosAEliminar.length;
    }

    window.limpiarElementosDuplicados = limpiarElementosDuplicados;
    

    function configurarEventoReconexion() {
        if (socket) {
            socket.on('connect', function() {
                console.log("📡 Reconectado al servidor, sincronizando elementos");
                
                // Primero cargar y crear marcadores desde localStorage
                cargarYCrearMarcadoresDesdeLocalStorage();
                
                // Esperar un momento para que la conexión se estabilice
                setTimeout(() => {
                    // Limpiar duplicados
                    limpiarElementosDuplicados();
                    
                    // Forzar sincronización completa
                    if (typeof forzarSincronizacionElementos === 'function') {
                        forzarSincronizacionElementos();
                    }
                }, 1000);
            });
        }
    }
    /**
     * Esta función mejora la lista de elementos conectados para mostrar más información
     * y permitir interacción directa con cada elemento.
     */
    function mejorarListaElementos() {
        const listaElementos = document.getElementById('lista-elementos');
        if (!listaElementos) return;
        
        // Si no hay elementos, mostrar mensaje
        if (listaElementos.children.length === 0) {
            listaElementos.innerHTML = `
                <div class="no-elementos text-center p-3">
                    <i class="fas fa-users" style="font-size: 32px; color: #ccc;"></i>
                    <p class="mt-2">No hay participantes conectados en esta operación</p>
                    <button id="btn-actualizar-elementos" class="btn btn-sm btn-outline-primary mt-2">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                </div>
            `;
            
            // Configurar botón para actualizar
            const btnActualizar = document.getElementById('btn-actualizar-elementos');
            if (btnActualizar) {
                btnActualizar.addEventListener('click', function() {
                    solicitarListaElementos();
                    MAIRA.Utils.mostrarNotificacion("Solicitando lista de participantes...", "info");
                });
            }
        } else {
            // Agregar botón de actualizar en la parte superior
            if (!document.getElementById('header-lista-elementos')) {
                // Crear cabecera con título y botón de actualizar
                const headerLista = document.createElement('div');
                headerLista.id = 'header-lista-elementos';
                headerLista.className = 'd-flex justify-content-between align-items-center p-2 bg-light';
                headerLista.innerHTML = `
                    <h6 class="m-0">Participantes (${listaElementos.children.length})</h6>
                    <button id="btn-actualizar-lista" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-sync"></i>
                    </button>
                `;
                
                // Insertar al inicio de la lista
                listaElementos.parentNode.insertBefore(headerLista, listaElementos);
                
                // Configurar evento
                document.getElementById('btn-actualizar-lista').addEventListener('click', function() {
                    solicitarListaElementos();
                    MAIRA.Utils.mostrarNotificacion("Actualizando lista de participantes...", "info");
                });
            } else {
                // Actualizar contador si ya existe el header
                const contadorElementos = document.querySelector('#header-lista-elementos h6');
                if (contadorElementos) {
                    contadorElementos.textContent = `Participantes (${listaElementos.children.length})`;
                }
            }
        }
        
        // Mejorar cada elemento de la lista si no están mejorados
        document.querySelectorAll('.elemento-item').forEach(elemento => {
            // Verificar si ya tiene la clase mejorado
            if (!elemento.classList.contains('mejorado')) {
                // Agregar clase para no repetir
                elemento.classList.add('mejorado');
                
                // Obtener ID del elemento
                const elementoId = elemento.getAttribute('data-id');
                
                // Agregar botón para chat directo si existe módulo de chat
                const accionesDiv = elemento.querySelector('.elemento-acciones');
                if (accionesDiv && window.MAIRA.Chat && !accionesDiv.querySelector('.btn-chat-directo')) {
                    const btnChat = document.createElement('button');
                    btnChat.title = "Chat directo";
                    btnChat.innerHTML = '<i class="fas fa-comment"></i>';
                    btnChat.className = 'btn-chat-directo';
                    
                    // Evento para abrir chat privado con este elemento
                    btnChat.addEventListener('click', function(e) {
                        e.stopPropagation();
                        iniciarChatPrivado(elementoId);
                    });
                    
                    // Añadir antes del primer botón existente
                    accionesDiv.insertBefore(btnChat, accionesDiv.firstChild);
                }
                
                // Mejorar comportamiento del elemento (clic para ver detalle)
                elemento.addEventListener('click', function() {
                    mostrarDetallesElemento(elementoId);
                });
                
                // Añadir estilo de cursor para indicar que es clickeable
                elemento.style.cursor = 'pointer';
                
                // Añadir menú contextual
                elemento.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    mostrarMenuContextualElemento(e, elementoId);
                });
            }
        });
    }
    
    /**
     * Inicia un chat privado con un elemento específico
     * @param {string} elementoId - ID del elemento destinatario
     */
    function iniciarChatPrivado(elementoId) {
        if (!window.MAIRA.Chat) {
            console.warn("Módulo de chat no está disponible");
            return;
        }
        
        // Cambiar a la pestaña de chat
        const btnTabChat = document.querySelector('.tab-btn[data-tab="tab-chat"]');
        if (btnTabChat) {
            btnTabChat.click();
        }
        
        // Verificar si el elemento existe
        if (!elementosConectados[elementoId]) {
            MAIRA.Utils.mostrarNotificacion("No se encontró el destinatario seleccionado", "error");
            return;
        }
        
        // Iniciar chat privado
        if (typeof window.MAIRA.Chat.iniciarChatPrivado === 'function') {
            window.MAIRA.Chat.iniciarChatPrivado(elementoId);
        } else {
            // Implementación alternativa
            // Cambiar a modo chat privado
            const btnChatPrivado = document.getElementById('btn-chat-privado');
            if (btnChatPrivado) {
                btnChatPrivado.click();
            }
            
            // Seleccionar destinatario
            const selectDestinatario = document.getElementById('select-destinatario');
            if (selectDestinatario) {
                selectDestinatario.value = elementoId;
                
                // Si no existe la opción, actualizar la lista de destinatarios
                if (!selectDestinatario.value) {
                    if (typeof window.MAIRA.Chat.actualizarListaDestinatarios === 'function') {
                        window.MAIRA.Chat.actualizarListaDestinatarios();
                    }
                    setTimeout(() => {
                        selectDestinatario.value = elementoId;
                    }, 500);
                }
            }
            
            // Enfocar el campo de mensaje
            const mensajeInput = document.getElementById('mensaje-chat');
            if (mensajeInput) {
                mensajeInput.focus();
            }
        }
    }
    
    /**
     * Agrega un elemento a la lista del panel
     * @param {Object} elemento - Datos del elemento
     */
    function agregarElementoALista(elemento) {
        if (!elemento || !elemento.id) {
            console.error('No se puede agregar elemento sin ID a la lista');
            return;
        }
        
        console.log(`Añadiendo elemento a lista visual: ${elemento.id} - ${elemento.usuario || 'Sin nombre'}`);
        
        const listaContenedor = document.getElementById('lista-elementos');
        if (!listaContenedor) {
            console.error('No se encontró el contenedor de la lista de elementos (#lista-elementos)');
            return;
        }
        
        // Evitar duplicados
        const elementoExistente = document.querySelector(`.elemento-item[data-id="${elemento.id}"]`);
        if (elementoExistente) {
            console.log(`Elemento con ID ${elemento.id} ya existe en la lista visual, actualizando...`);
            actualizarElementoEnLista(elemento);
            return;
        }
        
        // Determinar si es el usuario actual
        const idUsuarioActual = 
            (window.usuarioInfo && window.usuarioInfo.id) || 
            (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.usuarioInfo && window.MAIRA.GestionBatalla.usuarioInfo.id);
        
        const esUsuarioActual = elemento.id === idUsuarioActual;
        
        // Generar HTML del elemento
        const sidc = (elemento.elemento && elemento.elemento.sidc) || elemento.sidc || 'SFGPUCI-----';
        let symbolHtml = '';
        
        try {
            if (typeof ms !== 'undefined') {
                const sym = new ms.Symbol(sidc, {size: 20});
                symbolHtml = sym.asSVG();
            }
        } catch (e) {
            console.warn(`Error al generar símbolo para elemento ${elemento.id}:`, e);
            symbolHtml = '<div style="width:20px;height:20px;background:#ccc;border-radius:50%;"></div>';
        }
        
        const elementoHTML = `
            <div class="elemento-item ${esUsuarioActual ? 'usuario-actual' : ''}" data-id="${elemento.id}">
                <div class="elemento-icon">
                    <div class="sidc-preview">${symbolHtml}</div>
                    <span class="elemento-status ${elemento.conectado ? 'online' : 'offline'}"></span>
                </div>
                <div class="elemento-info">
                    <div class="elemento-nombre">${(elemento.elemento && elemento.elemento.designacion) || elemento.designacion || elemento.nombre || 'Sin nombre'}</div>
                    <div class="elemento-usuario">${elemento.usuario || 'Usuario'}</div>
                    <div class="elemento-tiempo">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <div class="elemento-acciones">
                    <button title="Ver detalles" class="btn-detalles">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button title="Centrar en mapa" class="btn-centrar">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                    <button title="Mostrar recorrido" class="btn-tracking">
                        <i class="fas fa-route"></i>
                    </button>
                    <button title="Perfil elevación recorrido" class="btn-tracking-elevation">
                        <i class="fas fa-chart-line"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Agregar a la lista
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = elementoHTML.trim();
        const elementoItem = tempDiv.firstChild;
        listaContenedor.appendChild(elementoItem);
        
        // Configurar eventos de botones
        const btnDetalles = elementoItem.querySelector('.btn-detalles');
        if (btnDetalles) {
            btnDetalles.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof mostrarDetallesElemento === 'function') {
                    mostrarDetallesElemento(elemento.id);
                }
            });
        }
        
        const btnCentrar = elementoItem.querySelector('.btn-centrar');
        if (btnCentrar) {
            btnCentrar.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof centrarEnElemento === 'function') {
                    centrarEnElemento(elemento.id);
                }
            });
        }
        
        const btnTracking = elementoItem.querySelector('.btn-tracking');
        if (btnTracking) {
            btnTracking.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof iniciarTrackingElemento === 'function') {
                    iniciarTrackingElemento(elemento.id);
                }
            });
        }

        const btnTrackingElevation = elementoItem.querySelector('.btn-tracking-elevation');
        if (btnTrackingElevation) {
            btnTrackingElevation.addEventListener('click', function(e) {
                e.stopPropagation();
                mostrarPerfilElevacionRecorrido(elemento.id);
            });
        }
        
        // Hacer clic en el elemento para seleccionarlo
        elementoItem.addEventListener('click', function() {
            if (typeof seleccionarElementoGB === 'function') {
                seleccionarElementoGB(elementosConectados[elemento.id]?.marcador);
            }
        });
        
        console.log(`Elemento con ID ${elemento.id} agregado a la lista visual`);
        
        // Actualizar contador
        actualizarContadorElementos();
    }
    
    /**
     * Actualiza la lista de elementos
     * @param {Object} elemento - Datos del nuevo elemento
     */
    function actualizarListaElementos(elemento) {
        if (!elemento || !elemento.id) return;
        
        // Añadir a nuestra estructura de datos
        elementosConectados[elemento.id] = {
            datos: elemento,
            marcador: null
        };
        
        // Añadir a la lista visual
        agregarElementoALista(elemento);
        
        // Crear marcador en el mapa
        crearMarcadorElemento(elemento);
        
        // Mejorar la lista de elementos
        mejorarListaElementos();
        
        // Actualizar contador en la cabecera
        actualizarContadorElementos();
    }
    
    /**
     * Elimina un elemento de la lista y del mapa
     * @param {string} id - ID del elemento a eliminar
     */
    function eliminarElementoLista(id) {
        if (!id) return;
        
        // Eliminar marcador del mapa
        if (elementosConectados[id]?.marcador && window.mapa) {
            try {
                window.mapa.removeLayer(elementosConectados[id].marcador);
            } catch (e) {
                console.warn("Error al eliminar marcador del mapa:", e);
            }
        }
        
        // Eliminar elemento de la lista
        const elementoItem = document.querySelector(`.elemento-item[data-id="${id}"]`);
        if (elementoItem) {
            elementoItem.remove();
        }
        
        // Eliminar de nuestro registro
        delete elementosConectados[id];
        
        // Actualizar contador en la cabecera
        actualizarContadorElementos();
        
        // Si estaba siguiendo este elemento, detener seguimiento
        if (siguiendoElemento === id) {
            detenerSeguimientoElemento();
        }
    }
    
    /**
     * Actualiza el contador de elementos en la cabecera
     */
    function actualizarContadorElementos() {
        // Buscar elementos donde mostrar el contador
        const contadorElementos = document.querySelector('#header-lista-elementos h6');
        const listaElementos = document.getElementById('lista-elementos');
        
        if (!listaElementos) {
            console.error("No se encontró el contenedor de lista de elementos");
            return;
        }
        
        // Contar elementos en la lista
        const elementosEnLista = listaElementos.querySelectorAll('.elemento-item').length;
        
        // Si no hay cabecera, crearla
        if (!contadorElementos) {
            // Crear cabecera si no existe
            const headerLista = document.createElement('div');
            headerLista.id = 'header-lista-elementos';
            headerLista.className = 'd-flex justify-content-between align-items-center p-2 bg-light';
            headerLista.innerHTML = `
                <h6 class="m-0">Participantes (${elementosEnLista})</h6>
                <button id="btn-actualizar-lista" class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-sync"></i>
                </button>
            `;
            
            // Insertar al inicio del contenedor padre
            if (listaElementos.parentNode) {
                listaElementos.parentNode.insertBefore(headerLista, listaElementos);
                
                // Configurar evento del botón de actualizar
                const btnActualizar = headerLista.querySelector('#btn-actualizar-lista');
                if (btnActualizar) {
                    btnActualizar.addEventListener('click', function() {
                        if (typeof solicitarListaElementos === 'function') {
                            solicitarListaElementos();
                        }
                        
                        if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
                            MAIRA.Utils.mostrarNotificacion("Actualizando lista de participantes...", "info");
                        }
                    });
                }
            }
        } else {
            // Actualizar texto del contador existente
            contadorElementos.textContent = `Participantes (${elementosEnLista})`;
        }
        
        console.log(`Contador actualizado: ${elementosEnLista} participantes en la lista`);
        
        // Si la lista está vacía y no hay mensaje, mostrar uno
        if (elementosEnLista === 0 && !listaElementos.querySelector('.no-elementos')) {
            listaElementos.innerHTML = `
                <div class="no-elementos text-center p-3">
                    <i class="fas fa-users" style="font-size: 32px; color: #ccc;"></i>
                    <p class="mt-2">No hay participantes conectados en esta operación</p>
                    <button id="btn-actualizar-elementos" class="btn btn-sm btn-outline-primary mt-2">
                        <i class="fas fa-sync"></i> Actualizar
                    </button>
                </div>
            `;
            
            // Configurar botón para actualizar
            const btnActualizar = listaElementos.querySelector('#btn-actualizar-elementos');
            if (btnActualizar) {
                btnActualizar.addEventListener('click', function() {
                    if (typeof solicitarListaElementos === 'function') {
                        solicitarListaElementos();
                    }
                    
                    if (typeof MAIRA.Utils.mostrarNotificacion === 'function') {
                        MAIRA.Utils.mostrarNotificacion("Solicitando lista de participantes...", "info");
                    }
                });
            }
        }
    }
    
    /**
     * Actualiza la posición de un elemento en el mapa
     * @param {Object} data - Datos de posición
     */
    

    // Exponer las funciones necesarias en el API público
    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.actualizarElementoConectado = actualizarElementoConectado;
    } else {
        console.warn("MAIRA.GestionBatalla no disponible para asignar actualizarElementoConectado");
        // Make sure this function is available globally as a fallback
        window.actualizarElementoConectado = actualizarElementoConectado;
    }

    if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
    } else {
        // Como fallback, hacerlo disponible globalmente
        window.elementosConectados = elementosConectados;
        console.warn("MAIRA.GestionBatalla no disponible para asignar elementosConectados");
    }
    /**
     * Crea un marcador para el elemento en el mapa
     * @param {Object} elemento - Datos del elemento
     * @returns {L.Marker} - Marcador creado
     */
    function crearMarcadorElemento(elemento) {
        if (!elemento) {
            console.error("No se proporcionaron datos para crear marcador");
            return null;
        }
        
        // Si no hay posición válida, registrar pero no crear marcador
        if (!elemento.posicion || !elemento.posicion.lat || !elemento.posicion.lng) {
            console.log(`Elemento sin posición válida: ${elemento.id}. Se agregará a la lista sin marcador.`);
            return null;
        }
        
        console.log("Creando marcador para elemento:", elemento);
        
        try {
            // Preparar SIDC
            let sidc = 'SFGPUCI-----'; // Default
            if (elemento.elemento && elemento.elemento.sidc) {
                sidc = elemento.elemento.sidc;
            } else if (elemento.sidc) {
                sidc = elemento.sidc;
            }
            
            // Crear símbolo militar
            const sym = new ms.Symbol(sidc, {
                size: 35,
                direction: elemento.posicion.rumbo || 0,
                uniqueDesignation: elemento.elemento?.designacion || elemento.designacion || elemento.nombre || elemento.usuario || ''
            });
            
            // Crear icono
            const icon = L.divIcon({
                className: 'elemento-militar',
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            });
            
            // Opciones del marcador
            const opciones = {
                draggable: false,
                sidc: sidc,
                nombre: elemento.nombre || elemento.usuario || '',
                id: elemento.id,
                designacion: (elemento.elemento && elemento.elemento.designacion) || elemento.designacion || '',
                dependencia: (elemento.elemento && elemento.elemento.dependencia) || elemento.dependencia || '',
                magnitud: (elemento.elemento && elemento.elemento.magnitud) || elemento.magnitud || '-',
                estado: elemento.estado || 'operativo',
                usuario: elemento.usuario || '',
                jugador: elemento.id || '',
                icon: icon,
                isElementoMilitar: true  // Añadir una marca para identificar fácilmente
            };
            
            // Crear marcador
            const marcador = L.marker([elemento.posicion.lat, elemento.posicion.lng], opciones);
            
            // Añadir al mapa
            if (window.mapa) {
                window.mapa.addLayer(marcador);
            }
            
            // Configurar eventos
            marcador.on('click', function(e) {
                L.DomEvent.stopPropagation(e);
                console.log("Click en elemento:", this.options.id);
                if (typeof window.seleccionarElementoGB === 'function') {
                    window.seleccionarElementoGB(this);
                } else if (typeof seleccionarElementoGB === 'function') {
                    seleccionarElementoGB(this);
                }
            });
            
            marcador.on('contextmenu', function(e) {
                L.DomEvent.stopPropagation(e);
                console.log("Click derecho en elemento:", this.options.id);
                window.elementoSeleccionadoGB = this;
                window.elementoSeleccionado = this;
                if (window.MiRadial && typeof window.MiRadial.mostrarMenu === 'function') {
                    window.MiRadial.mostrarMenu(
                        e.originalEvent.pageX,
                        e.originalEvent.pageY,
                        'elemento',
                        this
                    );
                }
            });
            
            // Actualizar referencia
            if (!elementosConectados[elemento.id]) {
                elementosConectados[elemento.id] = { 
                    datos: elemento, 
                    marcador: marcador 
                };
            } else {
                elementosConectados[elemento.id].marcador = marcador;
            }
            
            // Guardar en window para fácil acceso
            if (!window.elementosConectados) {
                window.elementosConectados = {};
            }
            window.elementosConectados[elemento.id] = elementosConectados[elemento.id];
            
            console.log(`Marcador creado exitosamente para: ${elemento.id} (${elemento.usuario || 'Sin nombre'})`);
            return marcador;
            
        } catch (e) {
            console.error("Error al crear marcador para elemento:", e);
            return null;
        }
    }
        
    /**
     * Función auxiliar para crear un marcador simple cuando no se puede usar milsymbol
     * @param {L.LatLng} posicion - Posición del marcador
     */
    function crearMarcadorUsuarioSimple(posicion) {
        marcadorUsuario = L.marker(posicion, {
            icon: L.divIcon({
                className: 'custom-div-icon usuario',
                html: '<div style="background-color:#0281a8;width:20px;height:20px;border-radius:50%;border:2px solid white;"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            }),
            title: 'Tu posición'
        });
        
        if (window.calcoActivo) {
            marcadorUsuario.addTo(window.calcoActivo);
        } else {
            marcadorUsuario.addTo(window.mapa);
        }
        
        // Configurar evento de clic para el menú contextual
        marcadorUsuario.on('contextmenu', function(e) {
            mostrarMenuContextualMarcador(e, 'usuario');
        });
        
        console.log("Marcador simple añadido al mapa");
    }
    
    
    /**
     * Detiene el seguimiento de posición del usuario
     */
    function detenerSeguimiento() {
        console.log("Deteniendo seguimiento de posición");
        
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        seguimientoActivo = false;
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.remove('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
        }
        
        MAIRA.Utils.agregarMensajeChat("Sistema", "Seguimiento de posición desactivado", "sistema");
        
        // Actualizar localStorage
        localStorage.setItem('seguimiento_activo', 'false');
    }
    
    /**
     * Alterna el estado del seguimiento de posición del usuario
     */
    function toggleSeguimiento() {
        if (seguimientoActivo) {
            detenerSeguimiento();
        } else {
            iniciarSeguimiento();
        }
    }
    
    /**
     * Maneja la actualización de posición del usuario
     * @param {GeolocationPosition} posicion - Objeto de posición del navegador
     */
    function posicionActualizada(posicion) {
        console.log("Posición actualizada:", posicion.coords);
        
        const { latitude, longitude, accuracy, heading, speed } = posicion.coords;
        
        // Guardar información de la última posición
        ultimaPosicion = {
            lat: latitude,
            lng: longitude,
            precision: accuracy,
            rumbo: heading || 0,
            velocidad: speed || 0,
            timestamp: new Date()
        };
        
        // Guardar en localStorage
        localStorage.setItem('ultima_posicion', JSON.stringify(ultimaPosicion));
        
        // Actualizar posición en el mapa
        actualizarMarcadorUsuario(latitude, longitude, heading);
        
        // Enviar posición al servidor si estamos conectados
        if (socket && socket.connected && usuarioInfo) {
            socket.emit('actualizarPosicion', {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: {
                    lat: latitude,
                    lng: longitude,
                    precision: accuracy,
                    rumbo: heading || 0,
                    velocidad: speed || 0
                },
                timestamp: new Date().toISOString()
            });
        } else if (usuarioInfo) {
            // Almacenar posición para enviar cuando se conecte
            if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.colaPendiente) {
                window.MAIRA.GestionBatalla.colaPendiente.posiciones.push({
                    id: usuarioInfo.id,
                    usuario: usuarioInfo.usuario,
                    elemento: elementoTrabajo,
                    posicion: {
                        lat: latitude,
                        lng: longitude,
                        precision: accuracy,
                        rumbo: heading || 0,
                        velocidad: speed || 0
                    },
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * Maneja errores de geolocalización
     * @param {GeolocationPositionError} error - Error de geolocalización
     */
    function errorPosicion(error) {
        console.error("Error de geolocalización:", error);
        
        let mensaje = "Error al obtener posición";
        switch (error.code) {
            case error.PERMISSION_DENIED:
                mensaje = "Permiso de geolocalización denegado";
                break;
            case error.POSITION_UNAVAILABLE:
                mensaje = "Información de posición no disponible";
                break;
            case error.TIMEOUT:
                mensaje = "Tiempo de espera agotado para obtener posición";
                break;
        }
        
        MAIRA.Utils.agregarMensajeChat("Sistema", mensaje, "sistema");
        MAIRA.Utils.mostrarNotificacion(mensaje, "error");
        detenerSeguimiento();
    }
    
    /**
     * Centra el mapa en la posición actual del usuario
     */
    function centrarEnPosicion() {
        console.log("Centrando mapa en posición actual");
        
        if (marcadorUsuario && window.mapa && window.mapa.hasLayer(marcadorUsuario)) {
            window.mapa.setView(marcadorUsuario.getLatLng(), 15);
            MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu posición", "info", 2000);
        } else {
            // Si no hay marcador, intentar obtener posición actual
            try {
                if (ultimaPosicion) {
                    if (window.mapa) {
                        window.mapa.setView([ultimaPosicion.lat, ultimaPosicion.lng], 15);
                        MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu última posición", "info", 2000);
                    }
                } else {
                    // Intentar obtener posición actual
                    if (navigator.geolocation) {
                        MAIRA.Utils.mostrarNotificacion("Obteniendo tu ubicación...", "info");
                        navigator.geolocation.getCurrentPosition(
                            function(posicion) {
                                window.mapa.setView([posicion.coords.latitude, posicion.coords.longitude], 15);
                                MAIRA.Utils.mostrarNotificacion("Mapa centrado en tu posición", "success", 2000);
                            },
                            function(error) {
                                console.error("Error al obtener posición:", error);
                                MAIRA.Utils.mostrarNotificacion("No se pudo obtener tu posición", "error");
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                    } else {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
                    }
                }
            } catch (error) {
                console.error("Error al centrar en posición:", error);
                MAIRA.Utils.agregarMensajeChat("Sistema", "No se pudo obtener tu posición actual", "sistema");
                MAIRA.Utils.mostrarNotificacion("No se pudo centrar en tu posición", "error");
            }
        }
    }
    
    /**
     * Centra el mapa en un elemento específico
     * @param {string} elementoId - ID del elemento a centrar
     */
    function centrarEnElemento(elementoId) {
        if (!elementosConectados[elementoId] || !elementosConectados[elementoId].marcador) {
            MAIRA.Utils.mostrarNotificacion("Elemento no encontrado", "error");
            return;
        }
        
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        if (window.mapa) {
            window.mapa.setView(posicion, 15);
            elementosConectados[elementoId].marcador.openPopup();
            MAIRA.Utils.mostrarNotificacion("Mapa centrado en el elemento seleccionado", "info", 2000);
        }
    }
    
    /**
     * Inicia el seguimiento de un elemento en el mapa
     * @param {string} elementoId - ID del elemento a seguir
     */
function iniciarSeguimientoElemento(elementoId) {
    console.log(`Iniciando seguimiento del elemento: ${elementoId}`);
    
    if (!elementosConectados[elementoId]) {
        MAIRA.Utils.mostrarNotificacion("Elemento no encontrado", "error");
        return;
    }
    
    // Si ya estamos siguiendo este elemento, no hacer nada
    if (siguiendoElemento === elementoId) {
        console.log("Ya estamos siguiendo este elemento");
        return;
    }
    
    // Si estábamos siguiendo otro elemento, detener ese seguimiento
    if (siguiendoElemento) {
        detenerSeguimientoElemento();
    }
    
    // Guardar elemento a seguir
    siguiendoElemento = elementoId;
    
    // Centrar inmediatamente si hay marcador
    if (elementosConectados[elementoId].marcador) {
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        window.mapa.setView(posicion, 15);
        
        // Opcional: abrir popup con información
        const marcador = elementosConectados[elementoId].marcador;
        if (marcador.getPopup()) {
            marcador.openPopup();
        } else {
            const datos = elementosConectados[elementoId].datos;
            const popup = L.popup()
                .setContent(`
                    <div class="popup-seguimiento">
                        <strong>${datos.usuario || 'Elemento'}</strong>
                        <div>${datos.elemento?.designacion || ''}</div>
                    </div>
                `);
            marcador.bindPopup(popup).openPopup();
        }
    }
    
    // Mostrar indicador visual de seguimiento
    mostrarIndicadorSeguimiento(elementoId);
    
    // Notificar
    const nombreElemento = elementosConectados[elementoId].datos.usuario || 
                          elementosConectados[elementoId].datos.elemento?.designacion || 
                          'Elemento';
    MAIRA.Utils.mostrarNotificacion(`Siguiendo a ${nombreElemento}`, "info");
    
    // Iniciar intervalo para comprobar actualizaciones
    if (intervaloSeguimientoElemento) {
        clearInterval(intervaloSeguimientoElemento);
    }
    
    intervaloSeguimientoElemento = setInterval(function() {
        if (!siguiendoElemento) {
            clearInterval(intervaloSeguimientoElemento);
            intervaloSeguimientoElemento = null;
            return;
        }
        
        const elemento = elementosConectados[siguiendoElemento];
        if (elemento && elemento.marcador) {
            const posicion = elemento.marcador.getLatLng();
            window.mapa.setView(posicion, window.mapa.getZoom());
        }
    }, 2000); // Comprobar cada 2 segundos
}

// Función auxiliar para mostrar indicador visual
function mostrarIndicadorSeguimiento(elementoId) {
    // Eliminar indicador previo si existe
    ocultarIndicadorSeguimiento();
    
    // Obtener datos del elemento
    const elemento = elementosConectados[elementoId]?.datos;
    if (!elemento) return;
    
    // Crear indicador
    const indicador = document.createElement('div');
    indicador.id = 'indicador-seguimiento';
    indicador.className = 'siguiendo-elemento';
    
    const nombreElemento = elemento.usuario || elemento.elemento?.designacion || 'Elemento';
    
    indicador.innerHTML = `
        <i class="fas fa-crosshairs"></i>
        <span>Siguiendo a ${nombreElemento}</span>
        <button id="btn-detener-seguimiento" title="Detener seguimiento">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos básicos
    indicador.style.position = 'fixed';
    indicador.style.bottom = '20px';
    indicador.style.left = '20px';
    indicador.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
    indicador.style.color = 'white';
    indicador.style.padding = '10px 15px';
    indicador.style.borderRadius = '50px';
    indicador.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    indicador.style.zIndex = '1000';
    indicador.style.display = 'flex';
    indicador.style.alignItems = 'center';
    indicador.style.fontSize = '14px';
    
    // Añadir al DOM
    document.body.appendChild(indicador);
    
    // Configurar evento para detener seguimiento
    document.getElementById('btn-detener-seguimiento').addEventListener('click', detenerSeguimientoElemento);
}

// Función para detener el seguimiento de un elemento
function detenerSeguimientoElemento() {
    if (!siguiendoElemento) return;
    
    console.log("Deteniendo seguimiento de elemento");
    
    // Limpiar intervalo
    if (intervaloSeguimientoElemento) {
        clearInterval(intervaloSeguimientoElemento);
        intervaloSeguimientoElemento = null;
    }
    
    // Limpiar variable
    siguiendoElemento = null;
    
    // Ocultar indicador
    ocultarIndicadorSeguimiento();
    
    // Notificar
    MAIRA.Utils.mostrarNotificacion("Seguimiento finalizado", "info");
}

// Función para ocultar el indicador
function ocultarIndicadorSeguimiento() {
    const indicador = document.getElementById('indicador-seguimiento');
    if (indicador) {
        document.body.removeChild(indicador);
    }
}
    
   
    
    /**
     * Muestra un indicador visual del elemento que se está siguiendo
     * @param {string} elementoId - ID del elemento que se está siguiendo
     */
    function mostrarIndicadorSeguimiento(elementoId) {
        // Ocultar indicador existente si lo hay
        ocultarIndicadorSeguimiento();
        
        // Obtener datos del elemento
        const elemento = elementosConectados[elementoId]?.datos;
        if (!elemento) return;
        
        // Crear indicador
        const indicador = document.createElement('div');
        indicador.id = 'indicador-seguimiento';
        indicador.className = 'siguiendo-elemento';
        indicador.innerHTML = `
            <i class="fas fa-crosshairs"></i>
            <span>Siguiendo a ${elemento.usuario} (${elemento.elemento?.designacion || 'Sin designación'})</span>
            <button id="btn-detener-seguimiento" title="Detener seguimiento">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Añadir al DOM
        document.body.appendChild(indicador);
        
        // Configurar evento para detener seguimiento
        document.getElementById('btn-detener-seguimiento').addEventListener('click', detenerSeguimientoElemento);
    }
    
        // ✅ CORREGIR al final del archivo (líneas ~2315-2325):
    
    // Función para conectar con MAIRA.GestionBatalla cuando esté disponible
    function conectarConGestionBatalla() {
        let intentos = 0;
        const maxIntentos = 50;
        
        const verificar = () => {
            if (window.MAIRA?.GestionBatalla || window.inicializarGestionBatalla) {
                console.log('✅ gestionBatalla.js detectado, integrando funciones...');
                
                // Asignar funciones si no existen
                if (window.MAIRA?.GestionBatalla && !window.MAIRA.GestionBatalla.actualizarElementoConectado) {
                    window.MAIRA.GestionBatalla.actualizarElementoConectado = actualizarElementoConectado;
                }
                
                if (window.MAIRA?.GestionBatalla && !window.MAIRA.GestionBatalla.elementosConectados) {
                    window.MAIRA.GestionBatalla.elementosConectados = elementosConectados;
                }
                
                // También asegurar referencias globales
                if (!window.actualizarElementoConectado) {
                    window.actualizarElementoConectado = actualizarElementoConectado;
                }
                
                if (!window.elementosConectados) {
                    window.elementosConectados = elementosConectados;
                }
                
                console.log('✅ Funciones de elementosGB integradas correctamente');
                return true;
            }
            
            intentos++;
            if (intentos < maxIntentos) {
                setTimeout(verificar, 100);
            } else {
                console.error('❌ No se pudo conectar elementosGB con MAIRA.GestionBatalla después de 50 intentos');
            }
            
            return false;
        };
        
        // Verificar inmediatamente y luego con retraso
        if (!verificar()) {
            setTimeout(verificar, 500);
        }
    }
    
    // Ejecutar conexión
    conectarConGestionBatalla();
    
    // ✅ EXPORTAR FUNCIONES CRÍTICAS GLOBALMENTE:
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Elementos = window.MAIRA.Elementos || MAIRA.Elementos;
    
    // También hacer disponibles las funciones críticas globalmente
    window.solicitarListaElementos = solicitarListaElementos;
    window.actualizarElementoConectado = actualizarElementoConectado;
    window.procesarElementosRecibidos = function(elemento) {
        if (MAIRA.Elementos?.procesarElementosRecibidos) {
            return MAIRA.Elementos.procesarElementosRecibidos(elemento);
        }
    };
    
    console.log('✅ elementosGB.js exportado correctamente');
    
    /**
     * Muestra todos los elementos en el mapa
     */
    function mostrarTodosElementos() {
        console.log("Mostrando todos los elementos en el mapa");
        
        if (!window.mapa) {
            console.error("Mapa no disponible");
            return;
        }
        
        // Crear un grupo con todos los marcadores
        const grupo = new L.featureGroup();
        
        // Añadir marcador del usuario
        if (marcadorUsuario && window.mapa.hasLayer(marcadorUsuario)) {
            grupo.addLayer(marcadorUsuario);
            console.log("Marcador del usuario añadido al grupo");
        } else if (ultimaPosicion) {
            console.log("Creando marcador de usuario a partir de última posición conocida");
            actualizarMarcadorUsuario(ultimaPosicion.lat, ultimaPosicion.lng, ultimaPosicion.rumbo);
            if (marcadorUsuario) {
                grupo.addLayer(marcadorUsuario);
            }
        }
        
        // Añadir marcadores de otros elementos
        let elementosAñadidos = 0;
        
        if (elementosConectados && Object.keys(elementosConectados).length > 0) {
            Object.values(elementosConectados).forEach(elem => {
                if (elem.marcador) {
                    grupo.addLayer(elem.marcador);
                    elementosAñadidos++;
                    console.log(`Elemento añadido al grupo: ${elem.datos?.elemento?.designacion || 'Sin designación'}`);
                } else if (elem.datos && elem.datos.posicion) {
                    console.log("Elemento sin marcador pero con posición, creando marcador:", elem.datos);
                    crearMarcadorElemento(elem.datos);
                    if (elem.marcador) {
                        grupo.addLayer(elem.marcador);
                        elementosAñadidos++;
                    }
                }
            });
        } else {
            console.log("No hay elementos conectados para mostrar");
        }
        
        console.log(`Total de elementos añadidos al grupo: ${elementosAñadidos}`);
        
        // Si hay elementos, ajustar el mapa para mostrarlos todos
        if (grupo.getLayers().length > 0) {
            try {
                const bounds = grupo.getBounds();
                console.log("Ajustando vista a los límites:", bounds);
                window.mapa.fitBounds(bounds, { 
                    padding: [50, 50],
                    maxZoom: 15
                });
                MAIRA.Utils.mostrarNotificacion(`Mostrando ${grupo.getLayers().length} elementos en el mapa`, "success", 3000);
            } catch (error) {
                console.error("Error al ajustar vista:", error);
                
                // Si hay un error con los límites, intentar centrar en el primer elemento
                if (marcadorUsuario) {
                    window.mapa.setView(marcadorUsuario.getLatLng(), 13);
                } else if (Object.values(elementosConectados).length > 0) {
                    const primerElemento = Object.values(elementosConectados)[0];
                    if (primerElemento.marcador) {
                        window.mapa.setView(primerElemento.marcador.getLatLng(), 13);
                    } else if (primerElemento.datos && primerElemento.datos.posicion) {
                        window.mapa.setView([
                            primerElemento.datos.posicion.lat,
                            primerElemento.datos.posicion.lng
                        ], 13);
                    }
                }
            }
        } else {
            console.log("No hay elementos para mostrar en el mapa");
            MAIRA.Utils.agregarMensajeChat("Sistema", "No hay elementos para mostrar en el mapa", "sistema");
            MAIRA.Utils.mostrarNotificacion("No hay elementos para mostrar", "info");
        }
    }
    
    /**
     * Busca elementos según el texto ingresado
     * @param {string} texto - Texto para buscar
     */
    function buscarElementos(texto) {
        const resultadosDiv = document.getElementById('resultados-busqueda-elementos');
        if (!resultadosDiv) return;
        
        // Limpiar resultados anteriores
        resultadosDiv.innerHTML = '';
        
        if (!texto.trim()) return;
        
        const textoBusqueda = texto.toLowerCase();
        const resultados = [];
        
        // Buscar en elementos conectados
        Object.entries(elementosConectados).forEach(([id, datos]) => {
            if (!datos.datos || !datos.datos.elemento) return;
            
            const elemento = datos.datos.elemento;
            const usuario = datos.datos.usuario;
            
            if ((elemento.designacion && elemento.designacion.toLowerCase().includes(textoBusqueda)) || 
                (elemento.dependencia && elemento.dependencia.toLowerCase().includes(textoBusqueda)) || 
                (usuario && usuario.toLowerCase().includes(textoBusqueda))) {
                
                resultados.push({
                    id: id,
                    datos: datos.datos
                });
            }
        });
        
        // Si hay marcador propio y coincide con la búsqueda, agregarlo
        if (marcadorUsuario && usuarioInfo) {
            const designacion = elementoTrabajo.designacion || '';
            const dependencia = elementoTrabajo.dependencia || '';
            
            if (designacion.toLowerCase().includes(textoBusqueda) || 
                dependencia.toLowerCase().includes(textoBusqueda) || 
                usuarioInfo.usuario.toLowerCase().includes(textoBusqueda)) {
                
                resultados.unshift({
                    id: 'usuario-actual',
                    datos: {
                        elemento: {
                            designacion: designacion,
                            dependencia: dependencia
                        },
                        usuario: usuarioInfo.usuario,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }
        
        // Mostrar resultados
        if (resultados.length > 0) {
            resultados.forEach(resultado => {
                const elementoItem = document.createElement('a');
                elementoItem.href = '#';
                elementoItem.className = 'list-group-item list-group-item-action';
                elementoItem.setAttribute('data-id', resultado.id);
                
                elementoItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${resultado.datos.elemento.designacion || 'Sin designación'}</h6>
                            <p class="mb-1">${resultado.datos.usuario}</p>
                        </div>
                        <small>${MAIRA.Utils.formatearFecha(resultado.datos.timestamp)}</small>
                    </div>
                `;
                
                elementoItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    const elementoId = this.getAttribute('data-id');
                    
                    if (elementoId === 'usuario-actual') {
                        centrarEnPosicion();
                    } else {
                        centrarEnElemento(elementoId);
                    }
                    
                    // Cerrar modal
                    if (typeof $('#modalBuscarElemento').modal === 'function') {
                        $('#modalBuscarElemento').modal('hide');
                    } else {
                        document.getElementById('modalBuscarElemento').style.display = 'none';
                    }
                });
                
                resultadosDiv.appendChild(elementoItem);
            });
        } else {
            const noResultados = document.createElement('div');
            noResultados.className = 'list-group-item';
            noResultados.textContent = 'No se encontraron elementos';
            resultadosDiv.appendChild(noResultados);
        }
    }
    
    /**
     * Muestra los detalles de un elemento
     * @param {string} id - ID del elemento
     */
    function mostrarDetallesElemento(id) {
        const elemento = elementosConectados[id]?.datos;
        if (!elemento) {
            console.error("No se encontró elemento con ID:", id);
            return;
        }
        
        // Si estamos usando Bootstrap, mostrar en un modal
        const modalContenido = document.getElementById('detalles-elemento-contenido');
        if (modalContenido) {
            // Formatear fecha de última actualización
            const ultimaActualizacion = elemento.timestamp ? 
                new Date(elemento.timestamp).toLocaleString() : 'No disponible';
            
            // Crear HTML con los detalles
            let detallesHTML = `
                <div class="detalles-elemento">
                    <div class="sidc-preview-grande"></div>
                    <table class="tabla-detalles">
                        <tr>
                            <th>Usuario:</th>
                            <td>${elemento.usuario || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Designación:</th>
                            <td>${(elemento.elemento?.designacion || elemento.designacion) || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Dependencia:</th>
                            <td>${(elemento.elemento?.dependencia || elemento.dependencia) || 'No disponible'}</td>
                        </tr>
                        <tr>
                            <th>Estado:</th>
                            <td>${elemento.conectado ? 'Conectado' : 'Desconectado'}</td>
                        </tr>
                        <tr>
                            <th>Última actualización:</th>
                            <td>${ultimaActualizacion}</td>
                        </tr>
            `;
            
            // Añadir datos de posición si están disponibles
            if (elemento.posicion) {
                try {
                    detallesHTML += `
                        <tr>
                            <th>Posición:</th>
                            <td>Lat: ${(elemento.posicion.lat || 0).toFixed(6)}, Lng: ${(elemento.posicion.lng || 0).toFixed(6)}</td>
                        </tr>`;
                        
                    if (elemento.posicion.precision !== undefined) {
                        detallesHTML += `
                            <tr>
                                <th>Precisión:</th>
                                <td>${(elemento.posicion.precision || 0).toFixed(1)} metros</td>
                            </tr>`;
                    }
                    
                    if (elemento.posicion.rumbo !== undefined) {
                        detallesHTML += `
                            <tr>
                                <th>Rumbo:</th>
                                <td>${(elemento.posicion.rumbo || 0).toFixed(1)}°</td>
                            </tr>`;
                    }
                    
                    if (elemento.posicion.velocidad !== undefined) {
                        detallesHTML += `
                            <tr>
                                <th>Velocidad:</th>
                                <td>${(elemento.posicion.velocidad || 0).toFixed(1)} m/s</td>
                            </tr>`;
                    }
                } catch (e) {
                    console.error("Error al mostrar detalles de posición:", e);
                    detallesHTML += `
                        <tr>
                            <th>Posición:</th>
                            <td>Error al mostrar datos de posición</td>
                        </tr>`;
                }
            }
            
            detallesHTML += `
                    </table>
                </div>
            `;
            
            modalContenido.innerHTML = detallesHTML;
            
            // Mostrar el símbolo SIDC
            const contenedorSIDC = modalContenido.querySelector('.sidc-preview-grande');
            const sidc = elemento.elemento?.sidc || elemento.sidc || 'SFGPUCI-----';
            
            if (contenedorSIDC && typeof ms !== 'undefined') {
                try {
                    const sym = new ms.Symbol(sidc, {size: 70});
                    contenedorSIDC.innerHTML = sym.asSVG();
                } catch (e) {
                    console.warn("Error al generar símbolo para detalles:", e);
                    contenedorSIDC.innerHTML = '<div style="width:70px;height:70px;background:#888;border-radius:50%;"></div>';
                }
            }
            
            // Configurar el botón para centrar en el mapa
            const btnCentrar = document.getElementById('btn-centrar-elemento');
            if (btnCentrar) {
                btnCentrar.onclick = function() {
                    centrarEnElemento(id);
                    $('#modalDetallesElemento').modal('hide');
                };
            }
            
            // Agregar botón de seguimiento
            const botonesModal = modalContenido.parentNode.querySelector('.modal-footer');
            if (botonesModal) {
                // Verificar si ya existe el botón
                let btnSeguir = botonesModal.querySelector('#btn-seguir-elemento');
                if (!btnSeguir) {
                    btnSeguir = document.createElement('button');
                    btnSeguir.id = 'btn-seguir-elemento';
                    btnSeguir.className = 'btn btn-info';
                    btnSeguir.innerHTML = '<i class="fas fa-crosshairs"></i> Seguir este elemento';
                    botonesModal.insertBefore(btnSeguir, botonesModal.firstChild);
                }
                
                btnSeguir.onclick = function() {
                    iniciarSeguimientoElemento(id);
                    $('#modalDetallesElemento').modal('hide');
                };
            }
            
            // Agregar botón de tracking si existe esa funcionalidad
            if (botonesModal && typeof iniciarTrackingElemento === 'function') {
                // Verificar si ya existe el botón
                let btnTrack = botonesModal.querySelector('#btn-track-elemento');
                if (!btnTrack) {
                    btnTrack = document.createElement('button');
                    btnTrack.id = 'btn-track-elemento';
                    btnTrack.className = 'btn btn-warning';
                    btnTrack.innerHTML = '<i class="fas fa-route"></i> Mostrar recorrido';
                    botonesModal.insertBefore(btnTrack, botonesModal.firstChild);
                }
                
                btnTrack.onclick = function() {
                    iniciarTrackingElemento(id);
                    $('#modalDetallesElemento').modal('hide');
                };
            }
            
            // Agregar botón de chat si el módulo está disponible
            if (window.MAIRA && window.MAIRA.Chat) {
                const botonesModal = modalContenido.parentNode.querySelector('.modal-footer');
                if (botonesModal) {
                    // Verificar si ya existe el botón
                    let btnChat = botonesModal.querySelector('#btn-chat-elemento');
                    if (!btnChat) {
                        btnChat = document.createElement('button');
                        btnChat.id = 'btn-chat-elemento';
                        btnChat.className = 'btn btn-primary';
                        btnChat.innerHTML = '<i class="fas fa-comment"></i> Chat privado';
                        botonesModal.insertBefore(btnChat, botonesModal.firstChild);
                    }
                    
                    btnChat.onclick = function() {
                        iniciarChatPrivado(id);
                        $('#modalDetallesElemento').modal('hide');
                    };
                }
            }
            
            // Mostrar modal
            $('#modalDetallesElemento').modal('show');
        } else {
            // Implementación alternativa si no está disponible Bootstrap
            MAIRA.Utils.mostrarNotificacion(`Elemento: ${(elemento.elemento?.designacion || elemento.designacion) || 'Sin designación'} (${elemento.usuario})`, "info");
            centrarEnElemento(id);
        }
    }
    

    /**
     * Configura los eventos para el mapa
     */
        function configurarEventosMapa() {
        window.mapa.on('contextmenu', function(e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
    
            const opciones = [
                {
                    title: 'Agregar Elemento',
                    action: 'add',
                    icon: 'fas fa-plus',
                    tooltip: 'Agregar nuevo elemento',
                    callback: () => agregarElementoGB(e.latlng)
                },
                {
                    title: 'Centrar Mapa',
                    action: 'center',
                    icon: 'fas fa-crosshairs',
                    tooltip: 'Centrar en esta posición',
                    callback: () => centrarEnPosicion(e.latlng)
                }
            ];
    
            if (window.MiRadial) {
                window.MiRadial.mostrarMenu(
                    e.originalEvent.pageX,
                    e.originalEvent.pageY,
                    'mapa',
                    opciones
                );
            }
        });
    }
    
    /**
     * Inicializa el menú contextual para elementos y marcadores
     */
    function inicializarMenuContextual() {
        // Verificar si ya existe
        if (document.getElementById('menu-contextual-elemento')) return;
        
        // Crear elemento para el menú contextual
        const menu = document.createElement('div');
        menu.id = 'menu-contextual-elemento';
        menu.className = 'menu-contextual-elemento';
        menu.style.display = 'none';
        
        // Añadir al DOM
        document.body.appendChild(menu);
        
        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', function() {
            menu.style.display = 'none';
        });
        
        // Cerrar menú al hacer scroll
        window.addEventListener('scroll', function() {
            menu.style.display = 'none';
        });
    }
    
    /**
     * Muestra el menú contextual para un elemento de la lista
     * @param {Event} e - Evento de clic derecho
     * @param {string} elementoId - ID del elemento
     */
    function mostrarMenuContextualElemento(e, elementoId) {
        e.preventDefault();
        e.stopPropagation();
        
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Obtener datos del elemento
        const elemento = elementosConectados[elementoId]?.datos;
        if (!elemento) return;
        
        // Configurar opciones del menú
        menu.innerHTML = `
            <div class="menu-item" data-action="centrar" data-id="${elementoId}">
                <i class="fas fa-crosshairs"></i> Centrar en mapa
            </div>
            <div class="menu-item" data-action="seguir" data-id="${elementoId}">
                <i class="fas fa-location-arrow"></i> Seguir este elemento
            </div>
            <div class="menu-item" data-action="detalles" data-id="${elementoId}">
                <i class="fas fa-info-circle"></i> Ver detalles
            </div>
            ${window.MAIRA.Chat ? `
            <div class="menu-item" data-action="chat" data-id="${elementoId}">
                <i class="fas fa-comment"></i> Chat privado
            </div>
            ` : ''}
        `;
        
        // Posicionar menú
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                const id = this.getAttribute('data-id');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar':
                        centrarEnElemento(id);
                        break;
                    case 'seguir':
                        iniciarSeguimientoElemento(id);
                        break;
                    case 'detalles':
                        mostrarDetallesElemento(id);
                        break;
                    case 'chat':
                        if (window.MAIRA.Chat) {
                            iniciarChatPrivado(id);
                        }
                        break;
                }
            });
        });
    }
    
    /**
     * Muestra el menú contextual para un marcador en el mapa
     * @param {Event} e - Evento de clic derecho
     * @param {string} elementoId - ID del elemento o 'usuario' para el marcador del usuario
     */
    function mostrarMenuContextualMarcador(e, elementoId) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Determinar opciones según si es marcador de usuario u otro elemento
        if (elementoId === 'usuario') {
            menu.innerHTML = `
                <div class="menu-item" data-action="centrar-usuario">
                    <i class="fas fa-crosshairs"></i> Centrar en mi posición
                </div>
                <div class="menu-item" data-action="seguimiento">
                    <i class="fas fa-location-arrow"></i> ${seguimientoActivo ? 'Detener seguimiento' : 'Iniciar seguimiento'}
                </div>
            `;
        } else {
            const elemento = elementosConectados[elementoId]?.datos;
            if (!elemento) return;
            
            menu.innerHTML = `
                <div class="menu-item" data-action="centrar" data-id="${elementoId}">
                    <i class="fas fa-crosshairs"></i> Centrar en mapa
                </div>
                <div class="menu-item" data-action="seguir" data-id="${elementoId}">
                    <i class="fas fa-location-arrow"></i> Seguir este elemento
                </div>
                <div class="menu-item" data-action="detalles" data-id="${elementoId}">
                    <i class="fas fa-info-circle"></i> Ver detalles
                </div>
                ${window.MAIRA.Chat ? `
                <div class="menu-item" data-action="chat" data-id="${elementoId}">
                    <i class="fas fa-comment"></i> Chat privado
                </div>
                ` : ''}
            `;
        }
        
        // Posicionar menú
        const containerPoint = e.containerPoint;
        const containerPos = e.target._container.getBoundingClientRect();
        
        menu.style.left = `${containerPos.left + containerPoint.x}px`;
        menu.style.top = `${containerPos.top + containerPoint.y}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                const id = this.getAttribute('data-id');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar-usuario':
                        centrarEnPosicion();
                        break;
                    case 'seguimiento':
                        toggleSeguimiento();
                        break;
                    case 'centrar':
                        centrarEnElemento(id);
                        break;
                    case 'seguir':
                        iniciarSeguimientoElemento(id);
                        break;
                    case 'detalles':
                        mostrarDetallesElemento(id);
                        break;
                    case 'chat':
                        if (window.MAIRA.Chat) {
                            iniciarChatPrivado(id);
                        }
                        break;
                }
            });
        });
    }
    
    /**
     * Muestra el menú contextual para el mapa
     * @param {Event} e - Evento de clic derecho
     */
    function mostrarMenuContextualMapa(e) {
        // Obtener el menú
        const menu = document.getElementById('menu-contextual-elemento');
        if (!menu) return;
        
        // Configurar opciones del menú
        menu.innerHTML = `
            <div class="menu-item" data-action="centrar-usuario">
                <i class="fas fa-crosshairs"></i> Centrar en mi posición
            </div>
            <div class="menu-item" data-action="seguimiento">
                <i class="fas fa-location-arrow"></i> ${seguimientoActivo ? 'Detener seguimiento' : 'Iniciar seguimiento'}
            </div>
            <div class="menu-item" data-action="mostrar-todos">
                <i class="fas fa-users"></i> Mostrar todos los elementos
            </div>
            ${window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.agregarMarcadorGB ? `
            <div class="menu-item" data-action="agregar-marcador">
                <i class="fas fa-map-marker-alt"></i> Agregar marcador
            </div>
            ` : ''}
        `;
        
        // Obtener coordenadas del clic
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        // Guardar coordenadas en atributos de datos
        menu.setAttribute('data-lat', lat);
        menu.setAttribute('data-lng', lng);
        
        // Posicionar menú
        menu.style.left = `${e.originalEvent.pageX}px`;
        menu.style.top = `${e.originalEvent.pageY}px`;
        menu.style.display = 'block';
        
        // Configurar eventos de las opciones
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const accion = this.getAttribute('data-action');
                
                menu.style.display = 'none';
                
                switch (accion) {
                    case 'centrar-usuario':
                        centrarEnPosicion();
                        break;
                    case 'seguimiento':
                        toggleSeguimiento();
                        break;
                    case 'mostrar-todos':
                        mostrarTodosElementos();
                        break;
                    case 'agregar-marcador':
                        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.agregarMarcadorGB) {
                            // Obtener coordenadas del clic
                            const lat = parseFloat(menu.getAttribute('data-lat'));
                            const lng = parseFloat(menu.getAttribute('data-lng'));
                            
                            // Abrir selector de marcador en esa posición
                            MAIRA.Utils.mostrarNotificacion("Seleccione el tipo de marcador a agregar", "info");
                            
                            // Simulación de clic en esa posición
                            const evento = {
                                latlng: L.latLng(lat, lng)
                            };
                            
                            // Ejecutar función de agregar marcador
                            window.mapa.fire('click', evento);
                        }
                        break;
                }
            });
        });
    }
    

    
    /**
     * Obtiene todos los elementos conectados
     * @returns {Object} - Objeto con todos los elementos conectados
     */
    function obtenerElementosConectados() {
        console.log("obtenerElementosConectados llamado, devolviendo:", elementosConectados);
        return elementosConectados;
    }
    function actualizarElementoConectado(datosElemento, marcador) {
        console.log("🔄 Actualizando elemento local:", datosElemento.id);
        
        // Si no existe el objeto elementosConectados, crearlo
        if (!window.elementosConectados) {
            window.elementosConectados = {};
        }
        
        // Si el elemento no existe, añadirlo
        if (!window.elementosConectados[datosElemento.id]) {
            window.elementosConectados[datosElemento.id] = {
                datos: datosElemento,
                marcador: marcador
            };
            console.log(`✅ Nuevo elemento añadido a elementosConectados: ${datosElemento.id}`);
        } else {
            // Si existe, actualizar los datos manteniendo el marcador
            const elementoActualizado = {
                ...window.elementosConectados[datosElemento.id].datos,
                ...datosElemento,
                elemento: {
                    ...(window.elementosConectados[datosElemento.id].datos?.elemento || {}),
                    ...(datosElemento.elemento || {})
                }
            };
            
            window.elementosConectados[datosElemento.id].datos = elementoActualizado;
            
            // Si el marcador es diferente, reemplazarlo
            if (window.elementosConectados[datosElemento.id].marcador !== marcador) {
                // Eliminar marcador anterior del mapa
                const marcadorAnterior = window.elementosConectados[datosElemento.id].marcador;
                if (marcadorAnterior && window.mapa) {
                    if (window.mapa.hasLayer(marcadorAnterior)) {
                        window.mapa.removeLayer(marcadorAnterior);
                        console.log(`🔄 Marcador anterior eliminado del mapa`);
                    }
                }
                
                window.elementosConectados[datosElemento.id].marcador = marcador;
                console.log(`✅ Marcador actualizado para elemento: ${datosElemento.id}`);
            }
        }
        
        // NUEVO: Guardar cambios en localStorage para mayor persistencia
        try {
            const elementosParaGuardar = {};
            
            // Solo guardar los datos, no los marcadores (no son serializables)
            Object.entries(window.elementosConectados).forEach(([id, elem]) => {
                elementosParaGuardar[id] = { datos: elem.datos };
            });
            
            localStorage.setItem('elementos_conectados', JSON.stringify(elementosParaGuardar));
            console.log("✅ Elementos conectados guardados en localStorage");
        } catch (e) {
            console.error("❌ Error al guardar elementos en localStorage:", e);
        }
        
        // Sincronizar con MAIRA.GestionBatalla
        if (window.MAIRA && window.MAIRA.GestionBatalla) {
            window.MAIRA.GestionBatalla.elementosConectados = window.elementosConectados;
        }
        
        // Si existe la función para actualizar la lista visual, usarla
        if (typeof window.MAIRA?.Elementos?.actualizarElementoVisual === 'function') {
            try {
                window.MAIRA.Elementos.actualizarElementoVisual(datosElemento.id);
                console.log(`✅ Interfaz visual actualizada para elemento: ${datosElemento.id}`);
            } catch (e) {
                console.error(`❌ Error al actualizar interfaz visual:`, e);
            }
        }
    }
    
    /**
     * Obtiene un elemento por su ID
     * @param {string} elementoId - ID del elemento
     * @returns {Object|null} - Datos del elemento o null si no existe
     */
    function obtenerElementoPorId(elementoId) {
        return elementosConectados[elementoId]?.datos || null;
    }

// Función de diagnóstico para listar todos los elementos conectados
function mostrarDiagnosticoElementos() {
    console.group("===== DIAGNÓSTICO DE ELEMENTOS CONECTADOS =====");
    console.log(`Total de elementos registrados: ${Object.keys(elementosConectados).length}`);
    
    Object.entries(elementosConectados).forEach(([id, elem]) => {
        console.group(`Elemento ID: ${id}`);
        console.log("Datos:", elem.datos);
        console.log("Marcador presente:", !!elem.marcador);
        console.log("Usuario:", elem.datos?.usuario || 'N/A');
        console.log("Designación:", elem.datos?.elemento?.designacion || 'N/A');
        console.log("Posición:", elem.datos?.posicion ? `Lat: ${elem.datos.posicion.lat}, Lng: ${elem.datos.posicion.lng}` : 'Sin posición');
        console.log("Elemento visual en DOM:", !!document.querySelector(`.elemento-item[data-id="${id}"]`));
        console.groupEnd();
    });
    
    console.log("===== ELEMENTOS VISUALES EN DOM =====");
    const elementosVisuales = document.querySelectorAll('.elemento-item');
    console.log(`Total elementos en DOM: ${elementosVisuales.length}`);
    
    elementosVisuales.forEach(elemento => {
        const elementoId = elemento.getAttribute('data-id');
        console.log(`Elemento visual ID: ${elementoId}, Existe en datos: ${!!elementosConectados[elementoId]}`);
    });
    
    console.groupEnd();
    
    // También verificar destinatarios del chat
    if (document.getElementById('select-destinatario')) {
        console.group("===== DESTINATARIOS DE CHAT =====");
        const options = document.getElementById('select-destinatario').options;
        console.log(`Total opciones en select: ${options.length}`);
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].disabled) continue;
            console.log(`Opción ${i}: Valor=${options[i].value}, Texto=${options[i].textContent}`);
        }
        console.groupEnd();
    }
    
    return "Diagnóstico completado - Ver consola para detalles";
}




// Variables globales para tracking
const trackingConfig = {
    activado: false,
    historial: {}, // {elementoId: {puntos: [], linea: L.polyline}}
    intervalos: {}, // {elementoId: intervalId}
    seguidos: {},  // {elementoId: boolean}
    colores: [
        '#FF5733', '#33FF57', '#3357FF', '#F033FF', 
        '#FF33F0', '#33FFF0', '#F0FF33', '#9533FF'
    ]
};

function iniciarTrackingElemento(elementoId) {
    if (!elementosConectados[elementoId]) {
        console.warn(`No se puede iniciar tracking: elemento ${elementoId} no encontrado`);
        return;
    }

    console.log(`Iniciando tracking para elemento ${elementoId}`);

    const elemento = elementosConectados[elementoId];
    if (!elemento.datos.posicion) {
        console.warn(`Elemento ${elementoId} sin posición inicial`);
        return;
    }

    // Inicializar tracking para este elemento
    const colorIndex = Math.abs(elementoId.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0)) % trackingConfig.colores.length;

    trackingConfig.historial[elementoId] = {
        puntos: [[elemento.datos.posicion.lat, elemento.datos.posicion.lng]],
        linea: L.polyline([[elemento.datos.posicion.lat, elemento.datos.posicion.lng]], {
            color: trackingConfig.colores[colorIndex],
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 10'
        }).addTo(window.mapa)
    };

    // Marcar como seguido
    trackingConfig.seguidos[elementoId] = true;

    // Actualizar UI
    actualizarUITracking(elementoId, true);

    // Notificar
    MAIRA.Utils.mostrarNotificacion(`Tracking iniciado para ${elemento.datos.usuario}`, "info");
}

function actualizarTrackingElemento(elementoId, nuevaPosicion) {
    if (!trackingConfig.historial[elementoId]) return;

    const tracking = trackingConfig.historial[elementoId];
    tracking.puntos.push([nuevaPosicion.lat, nuevaPosicion.lng]);
    tracking.linea.setLatLngs(tracking.puntos);

    // Si está siendo seguido, centrar mapa
    if (trackingConfig.seguidos[elementoId]) {
        window.mapa.setView([nuevaPosicion.lat, nuevaPosicion.lng]);
    }
}

function detenerTrackingElemento(elementoId) {
    if (!trackingConfig.historial[elementoId]) return;

    // Limpiar línea del mapa
    if (trackingConfig.historial[elementoId].linea) {
        window.mapa.removeLayer(trackingConfig.historial[elementoId].linea);
    }

    // Limpiar datos
    delete trackingConfig.historial[elementoId];
    delete trackingConfig.seguidos[elementoId];

    // Actualizar UI
    actualizarUITracking(elementoId, false);

    // Notificar
    const elemento = elementosConectados[elementoId];
    if (elemento) {
        MAIRA.Utils.mostrarNotificacion(`Tracking detenido para ${elemento.datos.usuario}`, "info");
    }
}

function actualizarUITracking(elementoId, activo) {
    const btnTracking = document.querySelector(`.elemento-item[data-id="${elementoId}"] .btn-tracking`);
    if (btnTracking) {
        if (activo) {
            btnTracking.classList.add('active');
            btnTracking.title = 'Detener tracking';
        } else {
            btnTracking.classList.remove('active');
            btnTracking.title = 'Iniciar tracking';
        }
    }
}

// Función para limpiar todo el sistema de tracking
function limpiarSistemaTracking() {
    Object.keys(trackingConfig.historial).forEach(elementoId => {
        detenerTrackingElemento(elementoId);
    });
    
    trackingConfig.activado = false;
    trackingConfig.historial = {};
    trackingConfig.seguidos = {};
    
    // Limpiar intervalos
    Object.values(trackingConfig.intervalos).forEach(intervalo => {
        clearInterval(intervalo);
    });
    trackingConfig.intervalos = {};
}






function iniciarTrackingElementos() {
    if (trackingActivado) return;
    
    trackingActivado = true;
    
    // Iniciar tracking para cada elemento conectado
    Object.keys(elementosConectados).forEach(id => {
        iniciarTrackingElemento(id);
    });
    
    // Mostrar notificación
    MAIRA.Utils.mostrarNotificacion("Tracking de elementos activado", "info");
    
    // Guardar preferencia
    localStorage.setItem('tracking_activado', 'true');
    
    console.log("Sistema de tracking de elementos iniciado");
}

function detenerTrackingElementos() {
    if (!trackingActivado) return;
    
    trackingActivado = false;
    
    // Detener intervalos
    Object.keys(trackingIntervalos).forEach(id => {
        clearInterval(trackingIntervalos[id]);
        delete trackingIntervalos[id];
    });
    
    // Limpiar líneas de tracking (opcional)
    Object.keys(trackHistorial).forEach(id => {
        if (trackHistorial[id].linea && window.mapa.hasLayer(trackHistorial[id].linea)) {
            window.mapa.removeLayer(trackHistorial[id].linea);
        }
    });
    
    // Mostrar notificación
    MAIRA.Utils.mostrarNotificacion("Tracking de elementos desactivado", "info");
    
    // Guardar preferencia
    localStorage.setItem('tracking_activado', 'false');
    
    console.log("Sistema de tracking de elementos detenido");
}

    // Añadir al final de GB.js, fuera de cualquier función
// ✅ NO SOBRESCRIBIR - Usar delegación inteligente
window.editarElementoSeleccionadoGB = function() {
    console.log("🔧 [DEBUG] editarElementoSeleccionadoGB (específico GB) llamada");
    console.log("🔧 [DEBUG] elementoSeleccionadoGB:", window.elementoSeleccionadoGB);
    console.log("🔧 [DEBUG] elementoSeleccionado:", window.elementoSeleccionado);
    
    if (!window.elementoSeleccionadoGB && !window.elementoSeleccionado) {
        console.warn("🔧 [DEBUG] No hay elemento seleccionado");
        return;
    }
    
    // Sincronizar variables de elemento seleccionado
    if (window.elementoSeleccionadoGB && !window.elementoSeleccionado) {
        window.elementoSeleccionado = window.elementoSeleccionadoGB;
        console.log("🔧 [DEBUG] Sincronizando elementoSeleccionado con elementoSeleccionadoGB");
    }
    
    // Usar la función original de edicioncompleto.js si está disponible
    console.log("🔧 [DEBUG] editarElementoSeleccionadoOriginal disponible:", typeof window.editarElementoSeleccionadoOriginal);
    console.log("🔧 [DEBUG] editarelementoSeleccionadoGB disponible:", typeof window.editarelementoSeleccionadoGB);
    
    if (typeof window.editarElementoSeleccionadoOriginal === 'function') {
        console.log("🔧 [DEBUG] Llamando a editarElementoSeleccionadoOriginal");
        window.editarElementoSeleccionadoOriginal();
    } else if (window.editarelementoSeleccionadoGB) {
        console.log("🔧 [DEBUG] Llamando a editarelementoSeleccionadoGB");
        window.editarelementoSeleccionadoGB();
    } else {
        console.warn("🔧 [DEBUG] Función de edición no disponible");
    }
};

// ✅ DELEGACIÓN INTELIGENTE - Solo si estamos en modo GB
if (window.location.pathname.includes('gestionbatalla.html')) {
    console.log("🏗️ Configurando delegación GB para editarElementoSeleccionado");
    
    // Guardar función original si existe
    if (window.editarElementoSeleccionado && !window.editarElementoSeleccionadoOriginalGB) {
        window.editarElementoSeleccionadoOriginalGB = window.editarElementoSeleccionado;
        console.log("💾 Función original de edición preservada para GB");
    }
    
    // Sobrescribir SOLO en modo GB con delegación inteligente
    window.editarElementoSeleccionado = function() {
        console.log("🎯 [GB] Delegando editarElementoSeleccionado a función GB");
        window.editarElementoSeleccionadoGB();
    };
}

/**
 * Actualiza la información de posición en la lista visual
 * @param {string} elementoId - ID del elemento
 * @param {Object} posicion - Datos de posición {lat, lng, rumbo, velocidad}
 */
function actualizarInfoPosicionEnLista(elementoId, posicion) {
    if (!elementoId || !posicion) return;

    const elementoItem = document.querySelector(`.elemento-item[data-id="${elementoId}"]`);
    if (!elementoItem) return;

    // Buscar o crear contenedor de info de posición
    let infoPos = elementoItem.querySelector('.elemento-posicion');
    if (!infoPos) {
        infoPos = document.createElement('div');
        infoPos.className = 'elemento-posicion small text-muted';
        elementoItem.querySelector('.elemento-info')?.appendChild(infoPos);
    }

    // Formatear información de posición
    let infoTexto = `${posicion.lat.toFixed(6)}, ${posicion.lng.toFixed(6)}`;
    
    if (posicion.rumbo !== undefined) {
        infoTexto += ` | ${posicion.rumbo.toFixed(1)}°`;
    }
    
    if (posicion.velocidad !== undefined) {
        infoTexto += ` | ${(posicion.velocidad * 3.6).toFixed(1)} km/h`;
    }

    infoPos.textContent = infoTexto;

    // Actualizar tiempo de última actualización
    const tiempoElement = elementoItem.querySelector('.elemento-tiempo');
    if (tiempoElement) {
        tiempoElement.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Si el elemento está siendo seguido, actualizar su tracking
    if (trackingConfig?.historial[elementoId]) {
        actualizarTrackingElemento(elementoId, posicion);
    }
}

function editarelementoSeleccionadoGB() {
    if (!window.elementoSeleccionadoGB) return;
    
    console.log("Editando elemento seleccionado:", window.elementoSeleccionadoGB);
    
    if (window.elementoSeleccionadoGB instanceof L.Marker) {
        if (window.elementoSeleccionadoGB.options && window.elementoSeleccionadoGB.options.sidc) {
            if (window.esUnidad && window.esUnidad(window.elementoSeleccionadoGB.options.sidc)) {
                window.mostrarPanelEdicionUnidad(window.elementoSeleccionadoGB);
            } else if (window.esEquipo && window.esEquipo(window.elementoSeleccionadoGB.options.sidc)) {
                window.mostrarPanelEdicionEquipo(window.elementoSeleccionadoGB);
            } else {
                // Elementos sin SIDC específico
                if (window.mostrarPanelEdicionMCC) {
                    window.mostrarPanelEdicionMCC(window.elementoSeleccionadoGB, 'elemento');
                }
            }
        }
    } else if (window.elementoSeleccionadoGB instanceof L.Polyline || window.elementoSeleccionadoGB instanceof L.Polygon) {
        if (window.mostrarPanelEdicionMCC && window.determinarTipoMCC) {
            window.mostrarPanelEdicionMCC(window.elementoSeleccionadoGB, window.determinarTipoMCC(window.elementoSeleccionadoGB));
        }
    } else if (window.elementoSeleccionadoGB instanceof L.Path) {
        if (window.mostrarPanelEdicionLinea) {
            window.mostrarPanelEdicionLinea(window.elementoSeleccionadoGB);
        }
    }
}


// Exponer para uso desde consola
window.forzarSincronizacionElementos = forzarSincronizacionElementos;
window.buscarElementoEnPosicion = buscarElementoEnPosicion;
    
// Exponer la función para uso en la consola
window.diagnosticoElementos = mostrarDiagnosticoElementos;
// Exponer funciones globalmente
window.agregarElementoALista = agregarElementoALista;

return {

    actualizarInfoPosicionEnLista,

    // Funciones principales
    inicializar,
    configurarEventosSocket,
    configurarEventosMapa,
    crearMarcadorElemento,
    solicitarListaElementos,
    // Gestión de elementos
    agregarElementoALista,
    actualizarListaElementos,
    actualizarPosicionElemento,
    actualizarElementoConectado,
    actualizarElementoEnLista,
    procesarElementosRecibidos,
    inicializarListaElementos,
    editarElemento,
    configurarEventosMarcador,

    // Navegación
    centrarEnPosicion,
    centrarEnElemento,
    mostrarTodosElementos,
    solicitarListaElementos,

    // Seguimiento
    iniciarSeguimiento,
    detenerSeguimiento,
    toggleSeguimiento,
    
    // Tracking
    iniciarTrackingElemento,
    detenerTrackingElemento,
    actualizarTrackingElemento,
    limpiarSistemaTracking,

    // Acceso a datos
    obtenerElementosConectados: function() { return elementosConectados; },
    obtenerElementoPorId,
    
    // Diagnóstico
    diagnosticoElementos: mostrarDiagnosticoElementos,
    forzarSincronizacion: forzarSincronizacionElementos

};
})();

// Registrar como módulo global
window.MAIRA.Elementos = window.MAIRA.Elementos || MAIRA.Elementos;

window.seleccionarElementoGB = function(elemento) {
    if (window.MAIRA?.Elementos?.seleccionarElementoGB) {
        return window.MAIRA.Elementos.seleccionarElementoGB(elemento);
    } else {
        console.log("[Elementos] Seleccionando elemento:", elemento.options?.id || elemento.id);
        
        // Eliminar selección previa si existe
        if (window.elementoSeleccionadoGB) {
            const prevElemIcon = window.elementoSeleccionadoGB._icon;
            if (prevElemIcon) {
                prevElemIcon.classList.remove('seleccionado');
            }
        }
        
        // Establecer nuevo elemento seleccionado y marcar visualmente
        window.elementoSeleccionadoGB = elemento;
        window.elementoSeleccionado = elemento;
        
        if (elemento && elemento._icon) {
            elemento._icon.classList.add('seleccionado');
        }
        
        return elemento;
    }
};

function actualizarElementoModificado(datosElemento) {
    console.log("Actualizando elemento modificado recibido del servidor:", datosElemento);
    
    if (!datosElemento || !datosElemento.id) {
        console.error("Datos de elemento inválidos o sin ID");
        return false;
    }
    
    // Verificar si el elemento existe en la estructura
    if (elementosConectados[datosElemento.id]) {
        const elementoExistente = elementosConectados[datosElemento.id];
        
        // 1. Eliminar marcador anterior del mapa si existe
        if (elementoExistente.marcador) {
            console.log(`Eliminando marcador anterior para ${datosElemento.id}`);
            if (window.calcoActivo && window.calcoActivo.hasLayer(elementoExistente.marcador)) {
                window.calcoActivo.removeLayer(elementoExistente.marcador);
            } else if (window.mapa && window.mapa.hasLayer(elementoExistente.marcador)) {
                window.mapa.removeLayer(elementoExistente.marcador);
            }
        }
        
        // 2. Actualizar datos del elemento
        elementoExistente.datos = datosElemento;
        
        // 3. Crear nuevo marcador con los datos actualizados
        elementoExistente.marcador = crearMarcadorElemento(datosElemento);
        
        // 4. Actualizar elemento en la lista visual
        actualizarElementoEnLista(datosElemento);
        
        console.log(`Elemento ${datosElemento.id} actualizado correctamente`);
        return true;
    } else {
        // Si el elemento no existe, agregarlo normalmente
        console.log(`Elemento ${datosElemento.id} no encontrado, agregando como nuevo`);
        procesarElementosRecibidos(datosElemento);
        return true;
    }
}

window.MAIRA.Elementos.actualizarElementoModificado = actualizarElementoModificado;


// Al final del módulo, añadir esta función
function testEnviarActualizacionPosicion() {
    if (!socket || !socket.connected || !usuarioInfo || !ultimaPosicion) {
        console.warn("❌ No se puede enviar prueba de posición - datos incompletos");
        return false;
    }
    
    const datosPrueba = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: {
            lat: ultimaPosicion.lat + (Math.random() * 0.001 - 0.0005), // pequeña variación
            lng: ultimaPosicion.lng + (Math.random() * 0.001 - 0.0005), // pequeña variación
            precision: ultimaPosicion.precision,
            rumbo: ultimaPosicion.rumbo,
            velocidad: ultimaPosicion.velocidad
        },
        operacion: operacionActual,
        timestamp: new Date().toISOString(),
        conectado: true,
        prueba: true
    };
    
    console.log("🧪 Enviando prueba de actualización de posición:", datosPrueba);
    socket.emit('actualizarPosicionGB', datosPrueba);
    socket.emit('anunciarElemento', datosPrueba);
    
    // Registrar evento en caso de confirmación
    socket.once('elementoRecibido', (confirmacion) => {
        console.log("✅ Prueba de posición confirmada por el servidor:", confirmacion);
    });
    
    return true;
}

// Exponer función para pruebas
window.testPosicion = testEnviarActualizacionPosicion;

/**
 * Muestra el perfil de elevación del recorrido de un elemento
 * @param {string} elementoId - ID del elemento a analizar
 */
function mostrarPerfilElevacionRecorrido(elementoId) {
    console.log(`Generando perfil de elevación para elemento ${elementoId}`);
    
    // Verificar que el elemento tenga tracking activo
    if (!trackingConfig.historial[elementoId]) {
        MAIRA.Utils.mostrarNotificacion(`Elemento ${elementoId} no tiene recorrido registrado`, "warning");
        return;
    }
    
    const tracking = trackingConfig.historial[elementoId];
    const puntos = tracking.puntos;
    
    if (puntos.length < 2) {
        MAIRA.Utils.mostrarNotificacion("El recorrido necesita al menos 2 puntos", "warning");
        return;
    }
    
    // Crear línea temporal para el perfil
    const lineaRecorrido = L.polyline(puntos, {
        color: tracking.linea.options.color,
        weight: 5,
        opacity: 1
    });
    
    // Usar measurementHandler si está disponible para mostrar perfil
    if (typeof window.mostrarPerfilElevacion === 'function') {
        // Simular evento de línea para usar el sistema existente
        const elemento = elementosConectados[elementoId];
        const usuario = elemento?.datos?.usuario || `Elemento ${elementoId}`;
        
        window.mostrarPerfilElevacion(lineaRecorrido, {
            titulo: `Perfil Elevación - Recorrido de ${usuario}`,
            puntos: puntos,
            distancia: calcularDistanciaRecorrido(puntos)
        });
        
        MAIRA.Utils.mostrarNotificacion(`Perfil de elevación generado para ${usuario}`, "success");
    } else if (typeof window.elevationHandler !== 'undefined') {
        // Usar elevationHandler directamente
        window.elevationHandler.mostrarPerfilLinea(puntos, `Recorrido ${elementoId}`)
            .then(() => {
                MAIRA.Utils.mostrarNotificacion("Perfil de elevación mostrado", "success");
            })
            .catch(error => {
                console.error("Error generando perfil:", error);
                MAIRA.Utils.mostrarNotificacion("Error al generar perfil de elevación", "error");
            });
    } else {
        // Fallback: mostrar información básica
        const distancia = calcularDistanciaRecorrido(puntos);
        const elemento = elementosConectados[elementoId];
        const usuario = elemento?.datos?.usuario || `Elemento ${elementoId}`;
        
        const mensaje = `
            <h5>Recorrido de ${usuario}</h5>
            <p><strong>Puntos registrados:</strong> ${puntos.length}</p>
            <p><strong>Distancia aproximada:</strong> ${distancia.toFixed(2)} km</p>
            <p><strong>Tiempo de tracking:</strong> ${calcularTiempoRecorrido(elementoId)}</p>
        `;
        
        // Crear modal básico
        mostrarModalRecorrido(mensaje, tracking.linea.options.color);
    }
}

/**
 * Calcula la distancia total del recorrido
 */
function calcularDistanciaRecorrido(puntos) {
    let distanciaTotal = 0;
    for (let i = 1; i < puntos.length; i++) {
        const punto1 = L.latLng(puntos[i-1][0], puntos[i-1][1]);
        const punto2 = L.latLng(puntos[i][0], puntos[i][1]);
        distanciaTotal += punto1.distanceTo(punto2);
    }
    return distanciaTotal / 1000; // Convertir a kilómetros
}

/**
 * Calcula el tiempo aproximado de recorrido
 */
function calcularTiempoRecorrido(elementoId) {
    if (!trackingConfig.historial[elementoId]) return "Desconocido";
    
    const tracking = trackingConfig.historial[elementoId];
    if (tracking.puntos.length < 2) return "Menos de 1 minuto";
    
    // Estimar basado en número de puntos y frecuencia de heartbeat (30s)
    const minutos = Math.floor((tracking.puntos.length * 0.5)); // 30 segundos por punto
    return `Aproximadamente ${minutos} minutos`;
}

/**
 * Modal básico para mostrar información del recorrido
 */
function mostrarModalRecorrido(contenido, color) {
    const modal = document.createElement('div');
    modal.className = 'modal-recorrido-gb';
    modal.innerHTML = `
        <div class="modal-content" style="border-left: 4px solid ${color}">
            <span class="close-modal">&times;</span>
            ${contenido}
            <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                Cerrar
            </button>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.querySelector('.modal-content').style.cssText = `
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Cerrar con X
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    
    document.body.appendChild(modal);
}