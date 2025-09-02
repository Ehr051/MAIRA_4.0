/**
 * conexionesCO.js - Funciones para gestionar conexiones entre elementos
 * Parte del sistema de Cuadro de Organización Militar
 */

// Variables globales relacionadas a conexiones
var enModoConexion = false;
var connectionSource = null;
let initialized = false;
// Agregar variable global para el tipo de conexión
let tipoConexionActual = 'jerarquica';

/**
 * Inicializa las funcionalidades de conexión
 */
function inicializarConexiones() {
    if (initialized) return;
    initialized = true;
    
    console.log('Inicializando sistema de conexiones');
    
    // Agregar botón de conexión si no existe
    agregarBotonesConexion();
    
    // Agregar listener para clicks en elementos
    document.addEventListener('click', function(e) {
        if (!window.enModoConexion) return;
        
        // Buscar el elemento más cercano que sea conectable
        const elemento = e.target.closest('.military-symbol');
        if (elemento) {
            console.log('Click en elemento durante modo conexión:', elemento.id);
            e.stopPropagation(); // Prevenir que el click llegue al canvas
            e.preventDefault();
            manejarClickEnModoConexion(elemento);
        }
    }, true); // Usar capturing para interceptar antes que otros handlers

    // Configurar tecla escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && window.enModoConexion) {
            cancelarModoConexion();
        }
    });
}


function mejorarConexiones() {
    if (!window.jsPlumbInstance) return;

    // Configuración mejorada de jsPlumb
    window.jsPlumbInstance.importDefaults({
        Connector: ["Flowchart", { 
            cornerRadius: 5,
            stub: [30, 30],
            midpoint: 0.5,
            alwaysRespectStubs: true
        }],
        ConnectionsDetachable: false,
        Endpoint: ["Dot", { radius: 5 }],
        EndpointStyle: { 
            fill: "#456",
            stroke: "#456",
            strokeWidth: 1
        },
        PaintStyle: { 
            stroke: "#456",
            strokeWidth: 2,
            outlineStroke: "transparent",
            outlineWidth: 4
        },
        HoverPaintStyle: {
            stroke: "#0d6efd",
            strokeWidth: 3
        },
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                width: 12,
                length: 12,
                foldback: 0.8
            }]
        ]
    });
}
// Asegurarnos de que estas variables sean globales
window.enModoConexion = window.enModoConexion || false;
window.connectionSource = window.connectionSource || null;

/**
 * Inicia el modo de conexión
 */
function iniciarConexion() {
    console.log('Iniciando modo de conexión:', tipoConexionActual);
    
    if (!window.selectedElement) {
        mostrarMensaje('Primero seleccione un elemento para iniciar la conexión.', 'warning');
        return;
    }

    window.enModoConexion = true;
    window.connectionSource = window.selectedElement;
    
    if (window.connectionSource) {
        window.connectionSource.classList.add('connection-source');
        
        // Activar el botón correspondiente
        const btnId = tipoConexionActual === 'jerarquica' ? 'crearConexionBtn' : 'crearCoordinacionBtn';
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.classList.add('active');
        }
        
        document.body.classList.add('modo-conexion');
        
        const msg = tipoConexionActual === 'jerarquica' 
            ? 'Seleccione el elemento subordinado para crear la conexión jerárquica.' 
            : 'Seleccione el elemento para crear la conexión de coordinación.';
        mostrarMensaje(msg, 'info');
    }
}

/**
 * Cancela el modo de conexión
 */
function cancelarModoConexion() {
    console.log("Cancelando modo de conexión");
    
    if (!window.connectionSource) {  // <-- CORREGIDO
        console.warn("No hay elemento origen para cancelar");
        return;
    }
    
    window.connectionSource.classList.remove('connection-source');  // <-- CORREGIDO
    window.connectionSource = null;  // <-- CORREGIDO
    window.enModoConexion = false;  // <-- CORREGIDO
    
    // Desactivar botón de conexión
    var conBtn = document.getElementById('crearConexionBtn');
    if (conBtn) {
        conBtn.classList.remove('active');
        console.log("Botón de conexión desactivado");
    } else {
        console.warn("Botón de conexión no encontrado al desactivar");
    }
    
    // Restaurar cursor
    document.body.classList.remove('modo-conexion');
    
    // Ocultar mensaje de ayuda
    ocultarMensaje();
}

function manejarClickEnModoConexion(elemento) {
    if (!elemento) return;
    console.log("Manejando clic en modo conexión:", elemento.id);

    // Si no hay origen seleccionado, establecer como origen
    if (!window.connectionSource) {
        window.connectionSource = elemento;
        window.connectionSource.classList.add('connection-source');
        mostrarMensaje('Ahora seleccione el elemento destino para completar la conexión.', 'info');
        return;
    }

    // Si ya tenemos origen y es diferente al destino
    if (window.connectionSource && window.connectionSource !== elemento) {
        try {
            console.log('Creando conexión de', window.connectionSource.id, 'a', elemento.id);
            var conexion = crearConexion(window.connectionSource, elemento);
            
            if (conexion) {
                mostrarMensaje('Conexión creada correctamente', 'success');
                // Registrar la acción
                if (window.registrarAccion) {
                    window.registrarAccion({
                        tipo: 'conectar',
                        sourceId: window.connectionSource.id,
                        targetId: elemento.id
                    });
                }
            } else {
                mostrarMensaje('Error al crear la conexión', 'error');
                // Aquí deberíamos usar el fallback
                conexion = crearConexionVisual(window.connectionSource, elemento, 'jerarquica');
            }
        } catch (error) {
            console.error('Error al crear conexión:', error);
            mostrarMensaje('Error al crear la conexión', 'error');
            // Aquí también deberíamos usar el fallback
            crearConexionVisual(window.connectionSource, elemento, 'jerarquica');
        }
        
        // Limpiar estado después de intentar crear la conexión
        cancelarModoConexion();
    } else if (window.connectionSource === elemento) {
        // Click en el mismo elemento: cancelar
        cancelarModoConexion();
        mostrarMensaje('Conexión cancelada', 'warning');
    }
}
/**
 * Agrega un botón para crear conexiones en la barra de herramientas
 */
function agregarBotonesConexion() {
    var botonesSecundarios = document.getElementById('botones-secundarios');
    if (!botonesSecundarios) return;
    
    // Botón para conexión jerárquica
    if (!document.getElementById('crearConexionBtn')) {
        var conexionBtn = document.createElement('button');
        conexionBtn.id = 'crearConexionBtn';
        conexionBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        conexionBtn.title = 'Crear conexión jerárquica';
        
        conexionBtn.addEventListener('click', function() {
            if (enModoConexion && tipoConexionActual === 'jerarquica') {
                cancelarModoConexion();
            } else {
                tipoConexionActual = 'jerarquica';
                iniciarConexion();
            }
        });
        
        botonesSecundarios.appendChild(conexionBtn);
    }
    
    // Botón para conexión de coordinación
    if (!document.getElementById('crearCoordinacionBtn')) {
        var coordBtn = document.createElement('button');
        coordBtn.id = 'crearCoordinacionBtn';
        coordBtn.innerHTML = '<i class="fas fa-arrows-alt-h"></i>';
        coordBtn.title = 'Crear conexión de coordinación';
        
        coordBtn.addEventListener('click', function() {
            if (enModoConexion && tipoConexionActual === 'coordinacion') {
                cancelarModoConexion();
            } else {
                tipoConexionActual = 'coordinacion';
                iniciarConexion();
            }
        });
        
        botonesSecundarios.appendChild(coordBtn);
    }
}

function obtenerNivel(elemento) {
    const conexiones = window.jsPlumbInstance.getAllConnections();
    const padres = conexiones.filter(c => c.targetId === elemento.id);
    
    if (padres.length === 0) {
        return 0; // Es elemento raíz
    }
    
    return Math.max(...padres.map(c => 
        obtenerNivel(document.getElementById(c.sourceId))
    )) + 1;
}

function crearConexion(origen, destino) {
    if (tipoConexionActual === 'jerarquica') {
        const nivelOrigen = obtenerNivel(origen);
        const nivelDestino = obtenerNivel(destino);
        
        // Si es conexión al primer nivel (desde nivel 0 a nivel 1)
        if (nivelOrigen === 0 && nivelDestino <= 1) {
            return window.jsPlumbInstance.connect({
                source: origen.id,
                target: destino.id,
                anchors: ["Bottom", "Top"],  // Conexión vertical directa
                connector: ["Flowchart", { 
                    cornerRadius: 5,
                    stub: [30, 30],
                    midpoint: 0.5,
                    alwaysRespectStubs: true
                }],
                paintStyle: { 
                    stroke: "#456",
                    strokeWidth: 2
                },
                overlays: [
                    ["Arrow", {
                        location: 1,
                        width: 12,
                        length: 12,
                        foldback: 0.8
                    }]
                ]
            });
        } else {
            // Para niveles superiores, entrada por la izquierda
            return window.jsPlumbInstance.connect({
                source: origen.id,
                target: destino.id,
                anchors: ["Bottom", "Left"],  // Sale abajo, entra izquierda
                connector: ["Flowchart", { 
                    cornerRadius: 5,
                    stub: [30, 30],
                    midpoint: 0.5,
                    alwaysRespectStubs: true
                }],
                paintStyle: { 
                    stroke: "#456",
                    strokeWidth: 2
                },
                overlays: [
                    ["Arrow", {
                        location: 1,
                        width: 12,
                        length: 12,
                        foldback: 0.8
                    }]
                ]
            });
        }
    } else {
        // Conexión de coordinación sin cambios
        return window.jsPlumbInstance.connect({
            source: origen.id,
            target: destino.id,
            anchors: ["Right", "Left"],
            connector: ["Flowchart", { 
                cornerRadius: 5,
                stub: [30, 30]
            }],
            paintStyle: { 
                stroke: "#456",
                strokeWidth: 2,
                dashstyle: "2 2"
            }
        });
    }
}

function crearConexionJerarquica(origen, destinos) {
    if (!window.jsPlumbInstance) return;

    // 1. Crear línea vertical principal (bus)
    const origenRect = origen.getBoundingClientRect();
    
    // Calcular punto medio horizontal entre todos los destinos
    const xDestinos = destinos.map(d => {
        const rect = d.getBoundingClientRect();
        return rect.left + (rect.width / 2);
    });
    const xPromedio = xDestinos.reduce((a, b) => a + b) / destinos.length;

    // Encontrar el destino más bajo para la línea vertical
    const destinoMasBajo = destinos.reduce((prev, curr) => {
        const rectPrev = prev.getBoundingClientRect();
        const rectCurr = curr.getBoundingClientRect();
        return rectCurr.top > rectPrev.top ? curr : prev;
    });

    // Crear línea vertical única desde el origen hasta el punto más bajo
    const lineaPrincipal = window.jsPlumbInstance.connect({
        source: origen.id,
        target: destinoMasBajo.id,
        connector: ["Flowchart", { 
            stub: [30, 30],
            alwaysRespectStubs: true,
            gap: 0,
            midpoint: 0.5
        }],
        anchors: [
            "Bottom",
            [[xPromedio, destinoMasBajo.getBoundingClientRect().top], "Top"]
        ],
        endpoint: "Blank",
        paintStyle: { 
            stroke: "#456",
            strokeWidth: 2
        },
        overlays: [] // Sin flechas en la línea principal
    });

    // 2. Crear pequeñas líneas horizontales desde la línea principal a cada destino
    destinos.forEach(destino => {
        const destinoRect = destino.getBoundingClientRect();
        const puntoConexion = {
            left: xPromedio,
            top: destinoRect.top
        };

        window.jsPlumbInstance.connect({
            source: origen.id,
            target: destino.id,
            connector: ["Flowchart", {
                stub: [0, 0],
                alwaysRespectStubs: true,
                cornerRadius: 5
            }],
            anchors: [
                [[puntoConexion.left, puntoConexion.top], "Left"],
                "Top"
            ],
            endpoint: "Blank",
            paintStyle: { 
                stroke: "#456",
                strokeWidth: 2
            },
            overlays: [
                ["Arrow", { 
                    location: 1,
                    width: 10,
                    length: 10,
                    foldback: 0.7
                }]
            ]
        });
    });

    return {
        lineaPrincipal: lineaPrincipal,
        conexionesHijos: destinos.map(d => d.id)
    };
}

function reordenarConexiones() {
    const elementos = document.querySelectorAll('.military-symbol');
    elementos.forEach(elemento => {
        const conexiones = window.jsPlumbInstance.getConnections({ source: elemento.id });
        if (conexiones.length > 1) {
            const destinos = conexiones
                .map(c => document.getElementById(c.targetId))
                .filter(el => el); // Filtrar elementos nulos
            
            // Eliminar conexiones existentes
            conexiones.forEach(c => window.jsPlumbInstance.deleteConnection(c));
            
            // Recrear como grupo
            crearConexionJerarquica(elemento, destinos);
        }
    });
}

// Función de respaldo para crear una conexión visual cuando jsPlumb falla
function crearConexionVisual(origen, destino, tipoConexion) {
    console.log("Creando conexión visual alternativa");
    
    // Crear una línea visual directa entre los elementos
    var conexionDiv = document.createElement('div');
    conexionDiv.className = 'conexion-visual';
    conexionDiv.style.position = 'absolute';
    conexionDiv.style.zIndex = '5';
    conexionDiv.style.pointerEvents = 'none';
    
    // Añadir al canvas
    if (window.canvas) {
        window.canvas.appendChild(conexionDiv);
    } else {
        document.body.appendChild(conexionDiv);
    }
    
    // Actualizar la posición de la línea
    actualizarConexionVisual(conexionDiv, origen, destino, tipoConexion);
    
    // Registrar la conexión visual para actualizaciones
    if (!window.conexionesVisuales) {
        window.conexionesVisuales = [];
    }
    
    window.conexionesVisuales.push({
        elemento: conexionDiv,
        origen: origen,
        destino: destino,
        tipo: tipoConexion
    });
    
    return { element: conexionDiv }; // Devolver un objeto para simular conexión
}

// Actualizar la posición de una conexión visual
function actualizarConexionVisual(conexionDiv, origen, destino, tipoConexion) {
    // Obtener posiciones
    var origenRect = origen.getBoundingClientRect();
    var destinoRect = destino.getBoundingClientRect();
    var canvasRect = window.canvas ? window.canvas.getBoundingClientRect() : { top: 0, left: 0 };
    
    // Calcular puntos de inicio y fin
    var startX, startY, endX, endY;
    
    if (tipoConexion === 'jerarquica') {
        // Conexión jerárquica (subordinación): desde abajo del origen hasta arriba del destino
        startX = origenRect.left + origenRect.width / 2 - canvasRect.left;
        startY = origenRect.bottom - canvasRect.top;
        endX = destinoRect.left + destinoRect.width / 2 - canvasRect.left;
        endY = destinoRect.top - canvasRect.top;
    } else {
        // Conexión de coordinación: desde la derecha del origen hasta la izquierda del destino
        startX = origenRect.right - canvasRect.left;
        startY = origenRect.top + origenRect.height / 2 - canvasRect.top;
        endX = destinoRect.left - canvasRect.left;
        endY = destinoRect.top + destinoRect.height / 2 - canvasRect.top;
    }
    
    // Calcular longitud y ángulo
    var length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    var angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    // Aplicar estilos
    conexionDiv.style.width = length + 'px';
    conexionDiv.style.height = '2px';
    conexionDiv.style.backgroundColor = '#456';
    conexionDiv.style.position = 'absolute';
    conexionDiv.style.left = startX + 'px';
    conexionDiv.style.top = startY + 'px';
    conexionDiv.style.transformOrigin = '0 0';
    conexionDiv.style.transform = 'rotate(' + angle + 'deg)';
    
    // Estilo para coordinación (línea discontinua)
    if (tipoConexion !== 'jerarquica') {
        conexionDiv.style.borderTop = '2px dashed #456';
        conexionDiv.style.backgroundColor = 'transparent';
    }
    
    // Añadir flecha para conexión jerárquica
    if (tipoConexion === 'jerarquica') {
        var arrowDiv = document.createElement('div');
        arrowDiv.className = 'conexion-flecha';
        arrowDiv.style.position = 'absolute';
        arrowDiv.style.right = '-6px';
        arrowDiv.style.top = '-4px';
        arrowDiv.style.width = '0';
        arrowDiv.style.height = '0';
        arrowDiv.style.borderTop = '4px solid transparent';
        arrowDiv.style.borderBottom = '4px solid transparent';
        arrowDiv.style.borderLeft = '8px solid #456';
        
        // Eliminar flechas anteriores
        var flechasAnteriores = conexionDiv.querySelectorAll('.conexion-flecha');
        flechasAnteriores.forEach(function(flecha) {
            conexionDiv.removeChild(flecha);
        });
        
        conexionDiv.appendChild(arrowDiv);
    }
}

// Función para actualizar todas las conexiones visuales (llamar cuando se mueven elementos)
function actualizarTodasLasConexionesVisuales() {
    if (!window.conexionesVisuales) return;
    
    window.conexionesVisuales.forEach(function(conexion) {
        actualizarConexionVisual(
            conexion.elemento,
            conexion.origen,
            conexion.destino,
            conexion.tipo
        );
    });
}

/**
 * Determina el tipo de conexión basado en los elementos
 * @param {Object} origen - Elemento DOM de origen
 * @param {Object} destino - Elemento DOM de destino
 * @returns {string} - Tipo de conexión ('jerarquica' o 'coordinacion')
 */
function determinarTipoConexion(origen, destino) {
    const nivelOrigen = obtenerNivel(origen);
    const nivelDestino = obtenerNivel(destino);
    
    // Si están al mismo nivel, es coordinación
    if (nivelOrigen === nivelDestino) {
        return 'coordinacion';
    }
    
    // Si el destino está en el siguiente nivel inmediato
    if (nivelDestino === nivelOrigen + 1) {
        return 'jerarquica-directa';
    }
    
    // Para cualquier otro caso (niveles superiores)
    return 'jerarquica-multinivel';
}

function obtenerNivel(elemento) {
    // Encontrar todas las conexiones donde este elemento es destino
    const conexiones = window.jsPlumbInstance.getAllConnections();
    const padres = conexiones.filter(c => c.targetId === elemento.id);
    
    if (padres.length === 0) {
        return 0; // Es elemento raíz
    }
    
    // Recursivamente obtener el nivel más alto del padre + 1
    return Math.max(...padres.map(c => 
        obtenerNivel(document.getElementById(c.sourceId))
    )) + 1;
}

/**
 * Muestra un mensaje de ayuda temporal
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo de mensaje ('info', 'warning', 'error', 'success')
 */
function mostrarMensaje(mensaje, tipo) {
    tipo = tipo || 'info';
    var msgContainer = document.getElementById('mensaje-temporal');
    
    if (!msgContainer) {
        msgContainer = document.createElement('div');
        msgContainer.id = 'mensaje-temporal';
        msgContainer.className = 'mensaje-temporal';
        document.body.appendChild(msgContainer);
    }
    
    // Asignar clase según el tipo
    msgContainer.className = 'mensaje-temporal mensaje-' + tipo;
    
    // Establecer texto y mostrar
    msgContainer.textContent = mensaje;
    msgContainer.style.display = 'block';
    
    // Auto-ocultarse después de 3 segundos
    clearTimeout(window.mensajeTimeout);
    window.mensajeTimeout = setTimeout(function() {
        ocultarMensaje();
    }, 3000);
}

/**
 * Oculta el mensaje temporal
 */
function ocultarMensaje() {
    var msgContainer = document.getElementById('mensaje-temporal');
    if (msgContainer) {
        msgContainer.style.display = 'none';
    }
}

// Exportar funciones para uso en CO.js
window.inicializarConexiones = inicializarConexiones;
window.iniciarConexion = iniciarConexion;
window.manejarClickEnModoConexion = manejarClickEnModoConexion;
window.cancelarModoConexion = cancelarModoConexion;
window.mostrarMensaje = mostrarMensaje;
window.ocultarMensaje = ocultarMensaje;
window.crearConexion = crearConexion;
window.crearConexionVisual = crearConexionVisual;
window.actualizarConexionVisual = actualizarConexionVisual;
window.actualizarTodasLasConexionesVisuales = actualizarTodasLasConexionesVisuales;