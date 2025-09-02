// Variables globales
let socket;
let usuarioInfo = null;
let elementoInfo = null;
let operacionesActivas = [];
let operacionSeleccionada = null;
let usuariosConectados = [];

// Inicialización cuando el DOM está cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando sala de espera para Gestión de Batalla');
    
    // Conectar con el servidor
    iniciarConexion();
    
    // Configurar eventos de interfaz
    configurarEventos();
    
    // Cargar datos iniciales
    cargarDatosIniciales();
    
    // Inicializar preview SIDC
    inicializarPreviewSIDC();
});



/**
 * Obtiene la URL del servidor
 */
function obtenerURLServidor() {
    if (window.SERVER_URL) {
        return window.SERVER_URL;
    }
    
    const currentHost = window.location.hostname;
    const probablePort = "5000";
    
    return `http://${currentHost}:${probablePort}`;
}

/**
 * Configura los eventos de la interfaz
 */
function configurarEventos() {
    // Botón de crear operación
    document.getElementById('crearOperacion').addEventListener('click', function() {
        document.getElementById('operacionesPanel').style.display = 'none';
        document.getElementById('formCrearOperacion').style.display = 'block';
    });
    
    // Cancelar creación de operación
    document.getElementById('cancelarCrearOperacion').addEventListener('click', function() {
        document.getElementById('formCrearOperacion').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    
    // Enviar formulario de nueva operación
    document.getElementById('nuevaOperacionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        crearNuevaOperacion();
    });
    
    // Cancelar unirse a operación
    document.getElementById('cancelarUnirseOperacion').addEventListener('click', function() {
        document.getElementById('configuracionElemento').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    
    // Enviar formulario de elemento para unirse a operación
    document.getElementById('elementoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        unirseOperacionExistente();
    });
    
    // Botón de unirse a operación desde detalles
    document.getElementById('unirseOperacionExistente').addEventListener('click', function() {
        if (!operacionSeleccionada) {
            mostrarError('No hay operación seleccionada');
            return;
        }
        
        document.getElementById('detallesOperacion').style.display = 'none';
        document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = operacionSeleccionada.nombre;
        document.getElementById('configuracionElemento').style.display = 'block';
    });
    
    // Cerrar detalles de operación
    document.getElementById('cerrarDetallesOperacion').addEventListener('click', function() {
        document.getElementById('detallesOperacion').style.display = 'none';
        document.getElementById('operacionesPanel').style.display = 'block';
    });
    

    
    // Botón para volver al menú principal
    document.getElementById('btnVolver').addEventListener('click', function() {
        window.location.href = '/index.html';
    });
}

/**
 * Carga datos iniciales de localStorage
 */
function cargarDatosIniciales() {
    // Intentar recuperar información de usuario
    const usuarioGuardado = localStorage.getItem('gb_usuario_info');
    if (usuarioGuardado) {
        try {
            usuarioInfo = JSON.parse(usuarioGuardado);
            document.getElementById('idUsuarioActual').textContent = usuarioInfo.id;
            document.getElementById('nombreUsuario').value = usuarioInfo.usuario || '';
        } catch (error) {
            console.error('Error al cargar información del usuario:', error);
        }
    }
}




/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

/**
 * Muestra un mensaje del sistema en el chat
 * @param {string} mensaje - Mensaje del sistema
 */
function mostrarMensajeSistema(mensaje) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-system';
    messageDiv.textContent = mensaje;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Actualiza la lista de operaciones en la interfaz
 */
function actualizarListaOperaciones() {
    const listaOperaciones = document.querySelector('#listaOperaciones .list-group');
    listaOperaciones.innerHTML = '';
    
    if (operacionesActivas.length === 0) {
        const noOperaciones = document.createElement('div');
        noOperaciones.className = 'alert alert-info';
        noOperaciones.textContent = 'No hay operaciones activas. ¡Crea una nueva!';
        listaOperaciones.appendChild(noOperaciones);
        return;
    }
    
    operacionesActivas.forEach(operacion => {
        const operacionItem = document.createElement('div');
        operacionItem.className = 'operation-item';
        operacionItem.innerHTML = `
            <div class="operation-main">
                <div class="operation-name">${operacion.nombre}</div>
                <div class="operation-info">
                    <small>${operacion.participantes || 0} participantes · Creada por ${operacion.creador || 'Desconocido'}</small>
                </div>
            </div>
            <div class="operation-actions">
                <button class="btn btn-sm btn-info btn-details" data-id="${operacion.id}">
                    <i class="fas fa-info-circle"></i> Detalles
                </button>
                <button class="btn btn-sm btn-success btn-join" data-id="${operacion.id}">
                    <i class="fas fa-sign-in-alt"></i> Unirse
                </button>
            </div>
        `;
        
        // Eventos para botones de detalles y unirse
        const btnDetalles = operacionItem.querySelector('.btn-details');
        const btnUnirse = operacionItem.querySelector('.btn-join');
        btnDetalles.addEventListener('click', function() {
            const operacionId = this.getAttribute('data-id');
            const operacion = operacionesActivas.find(op => op.id === operacionId);
            if (operacion) {
                operacionSeleccionada = operacion;
                mostrarDetallesOperacion(operacion);
            }
        });
        
        btnUnirse.addEventListener('click', function() {
            const operacionId = this.getAttribute('data-id');
            const operacion = operacionesActivas.find(op => op.id === operacionId);
            if (operacion) {
                operacionSeleccionada = operacion;
                document.getElementById('operacionesPanel').style.display = 'none';
                document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = operacion.nombre;
                document.getElementById('configuracionElemento').style.display = 'block';
            }
        });
        
        listaOperaciones.appendChild(operacionItem);
    });
}

/**
 * Actualiza la lista de usuarios conectados
 */
function actualizarListaUsuarios() {
    const listaUsuarios = document.getElementById('listaUsuarios');
    listaUsuarios.innerHTML = '';
    
    if (usuariosConectados.length === 0) {
        const noUsuarios = document.createElement('li');
        noUsuarios.className = 'list-group-item text-center';
        noUsuarios.textContent = 'No hay usuarios conectados';
        listaUsuarios.appendChild(noUsuarios);
        return;
    }
    
    usuariosConectados.forEach(usuario => {
        const usuarioItem = document.createElement('li');
        usuarioItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Si el usuario está en una operación, mostrar esa info
        const infoOperacion = usuario.operacion ? 
            ` <span class="badge badge-primary">${usuario.operacion}</span>` : '';
            
        usuarioItem.innerHTML = `
            <div>
                <i class="fas fa-user"></i> ${usuario.nombre}
                ${infoOperacion}
            </div>
            <span class="badge badge-success">Conectado</span>
        `;
        
        listaUsuarios.appendChild(usuarioItem);
    });
}

/**
 * Muestra los detalles de una operación
 * @param {Object} operacion - Datos de la operación
 */
function mostrarDetallesOperacion(operacion) {
    document.getElementById('operacionesPanel').style.display = 'none';
    document.getElementById('detallesOperacion').style.display = 'block';
    
    document.getElementById('tituloDetallesOperacion').textContent = operacion.nombre;
    document.getElementById('descripcionDetallesOperacion').textContent = operacion.descripcion || 'Sin descripción';
    document.getElementById('areaDetallesOperacion').textContent = operacion.area || 'No especificada';
    document.getElementById('participantesDetallesOperacion').textContent = 
        operacion.participantes ? `${operacion.participantes} participantes` : 'Sin participantes';
    
    // Actualizar tabla de elementos
    const tablaElementos = document.getElementById('elementosOperacion');
    tablaElementos.innerHTML = '';
    
    if (!operacion.elementos || operacion.elementos.length === 0) {
        const fila = document.createElement('tr');
        fila.innerHTML = '<td colspan="2" class="text-center">No hay elementos en esta operación</td>';
        tablaElementos.appendChild(fila);
    } else {
        operacion.elementos.forEach(elemento => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${elemento.usuario || 'Desconocido'}</td>
                <td>${elemento.designacion || 'Sin designación'}${elemento.dependencia ? '/' + elemento.dependencia : ''}</td>
            `;
            tablaElementos.appendChild(fila);
        });
    }
}

/**
 * Crea una nueva operación
 */
function crearNuevaOperacion() {
    const nombre = document.getElementById('nombreOperacion').value;
    const descripcion = document.getElementById('descripcionOperacion').value;
    
    if (!nombre) {
        mostrarError('El nombre de la operación es obligatorio');
        return;
    }
    
    // Mostrar indicador de carga
    const botonSubmit = document.querySelector('#nuevaOperacionForm button[type="submit"]');
    if (botonSubmit) {
        const textoOriginal = botonSubmit.innerHTML;
        botonSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        botonSubmit.disabled = true;
        
        // Restaurar después de 10 segundos como máximo
        setTimeout(() => {
            botonSubmit.innerHTML = textoOriginal;
            botonSubmit.disabled = false;
        }, 10000);
    }
    
    // Crear objeto de operación
    const nuevaOperacion = {
        nombre: nombre,
        descripcion: descripcion,
        creador: usuarioInfo ? usuarioInfo.usuario : 'Usuario',
        fechaCreacion: new Date().toISOString()
    };
    
    console.log("Enviando solicitud de creación:", nuevaOperacion);
    
    // Enviar al servidor
    socket.emit('crearOperacionGB', nuevaOperacion, function(respuesta) {
        console.log("Respuesta recibida:", respuesta);
        
        // Restaurar estado del botón
        if (botonSubmit) {
            botonSubmit.innerHTML = 'Crear Operación';
            botonSubmit.disabled = false;
        }
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        mostrarMensajeSistema(`Operación "${nombre}" creada correctamente`);
        
        // Extraer la operación de la respuesta
        let operacionCreada = null;
        if (respuesta && respuesta.operacion) {
            operacionCreada = respuesta.operacion;
        } else {
            // Estructura alternativa de respuesta
            operacionCreada = {
                id: Date.now().toString(),
                nombre: nombre,
                descripcion: descripcion,
                creador: usuarioInfo ? usuarioInfo.usuario : 'Usuario'
            };
        }
        
        // Actualizar variable global
        operacionSeleccionada = operacionCreada;
        
        // Mostrar panel de configuración de elemento
        document.getElementById('formCrearOperacion').style.display = 'none';
        document.getElementById('nombreOperacionSeleccionada').querySelector('span').textContent = nombre;
        document.getElementById('configuracionElemento').style.display = 'block';
    });
}

// Simplificar inicializarPreviewSIDC para un elemento básico predeterminado
// Función actualizada para inicializar el preview con la designación/dependencia a la derecha
function inicializarPreviewSIDC() {
    console.log("Inicializando preview SIDC con elemento básico");
    
    // Referencias a los elementos del formulario
    const designacionInput = document.getElementById('elemento-designacion');
    const dependenciaInput = document.getElementById('elemento-dependencia');
    const previewDiv = document.getElementById('sidc-preview');
    
    if (!previewDiv) {
        console.error("No se encontró el elemento de preview");
        return;
    }
    
    // Definir un SIDC básico predeterminado (Unidad de Infantería Amiga)
    const sidc_basico = "SFGPUCI-----"; // Unidad de Infantería Amiga
    
    // Actualizar preview cuando cambien los campos de texto
    designacionInput.addEventListener('input', actualizarPreview);
    dependenciaInput.addEventListener('input', actualizarPreview);
    
    // Función para actualizar el preview
    function actualizarPreview() {
        if (!window.ms) {
            console.error("milsymbol no disponible para actualizar preview");
            previewDiv.innerHTML = "<p>Cargando biblioteca de símbolos...</p>";
            return;
        }
        
        // Obtener valores
        const designacion = designacionInput.value || '';
        const dependencia = dependenciaInput.value || '';
        
        // Crear y mostrar símbolo
        try {
            const sym = new ms.Symbol(sidc_basico, {
                size: 35,
                // Dejar el campo designación vacío
                uniqueDesignation: "",
                // Colocar tanto designación como dependencia en el campo de higherFormation
                higherFormation: designacion + (dependencia ? '/' + dependencia : '')
            });
            
            previewDiv.innerHTML = sym.asSVG();
            
            // Guardar SIDC para uso posterior
            previewDiv.setAttribute('data-sidc', sidc_basico);
            
            // Añadir texto con SIDC para debug
            const infoDiv = document.createElement('div');
            infoDiv.style.fontSize = '10px';
            infoDiv.style.marginTop = '5px';
            infoDiv.textContent = 'SIDC: ' + sidc_basico + ' (Infantería Amiga)';
            previewDiv.appendChild(infoDiv);
            
            // Añadir nota sobre edición posterior
            const notaDiv = document.createElement('div');
            notaDiv.className = 'alert alert-info mt-2';
            notaDiv.style.fontSize = '12px';
            notaDiv.innerHTML = 'Podrás editar completamente este elemento una vez estés en el mapa.';
            previewDiv.appendChild(notaDiv);
        } catch (error) {
            console.error("Error al generar símbolo:", error);
            previewDiv.innerHTML = "<p>Error al generar símbolo: " + error.message + "</p>";
        }
    }
    
    // Actualizar preview inicial
    setTimeout(actualizarPreview, 500);
    
    // Guardar función para acceso global
    window.actualizarPreview = actualizarPreview;
}

// Funciones auxiliares para añadir campos faltantes
function agregarCampoAfiliacion() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="afiliacion">Afiliación:</label>
        <select id="afiliacion" class="form-control">
            <option value="F">Amigo</option>
            <option value="H">Hostil</option>
            <option value="N">Neutral</option>
            <option value="U">Desconocido</option>
        </select>
    `;
    
    const primeraSeccion = document.querySelector('.form-section');
    const primerCampo = primeraSeccion.querySelector('.form-group');
    primeraSeccion.insertBefore(container, primerCampo);
}

function agregarCampoEstado() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="estado">Estado:</label>
        <select id="estado" class="form-control">
            <option value="P">Presente</option>
            <option value="A">Anticipado/Planeado</option>
        </select>
    `;
    
    const afiliacionGroup = document.getElementById('afiliacion').closest('.form-group');
    afiliacionGroup.parentNode.insertBefore(container, afiliacionGroup.nextSibling);
}

function agregarCampoTipo() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="tipo">Tipo:</label>
        <select id="tipo" class="form-control">
            <!-- Se llenará dinámicamente -->
        </select>
    `;
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup.nextSibling);
}

function agregarCampoCaracteristica() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    container.innerHTML = `
        <label for="caracteristica">Característica:</label>
        <select id="caracteristica" class="form-control">
            <!-- Se llenará dinámicamente -->
        </select>
    `;
    
    const tipoGroup = document.getElementById('tipo').closest('.form-group');
    tipoGroup.parentNode.insertBefore(container, tipoGroup.nextSibling);
}



// Función para crear campo de identidad
function crearCampoIdentidad() {
    // Crear contenedor
    const container = document.createElement('div');
    container.className = 'form-group';
    
    // Crear etiqueta
    const label = document.createElement('label');
    label.textContent = 'Identidad:';
    label.htmlFor = 'elemento-identidad';
    
    // Crear select
    const select = document.createElement('select');
    select.id = 'elemento-identidad';
    select.className = 'form-control';
    
    // Añadir opciones
    const opciones = [
        { value: 'F', text: 'Amigo' },
        { value: 'H', text: 'Hostil' },
        { value: 'N', text: 'Neutral' },
        { value: 'U', text: 'Desconocido' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    // Seleccionar "Amigo" por defecto
    select.value = 'F';
    
    // Agregar elementos al contenedor
    container.appendChild(label);
    container.appendChild(select);
    
    // Insertar antes del campo de arma
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

// Función para crear campo de dimensión de batalla
function crearCampoDimension() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = 'Dimensión:';
    label.htmlFor = 'elemento-dimension';
    
    const select = document.createElement('select');
    select.id = 'elemento-dimension';
    select.className = 'form-control';
    
    const opciones = [
        { value: 'G', text: 'Terrestre' },
        { value: 'A', text: 'Aéreo' },
        { value: 'S', text: 'Superficie (Naval)' },
        { value: 'U', text: 'Submarino' },
        { value: 'P', text: 'Espacio' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    select.value = 'G';
    
    container.appendChild(label);
    container.appendChild(select);
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

// Función para crear campo de estado
function crearCampoEstado() {
    const container = document.createElement('div');
    container.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = 'Estado:';
    label.htmlFor = 'elemento-estado';
    
    const select = document.createElement('select');
    select.id = 'elemento-estado';
    select.className = 'form-control';
    
    const opciones = [
        { value: 'P', text: 'Presente' },
        { value: 'A', text: 'Anticipado/Planeado' }
    ];
    
    opciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op.value;
        option.textContent = op.text;
        select.appendChild(option);
    });
    
    select.value = 'P';
    
    container.appendChild(label);
    container.appendChild(select);
    
    const armaGroup = document.getElementById('elemento-arma').closest('.form-group');
    armaGroup.parentNode.insertBefore(container, armaGroup);
    
    return select;
}

/**
 * Carga opciones de armas desde unidadesMilitares
 * @param {HTMLSelectElement} selectElement - Elemento select a poblar
 */
function cargarOpcionesArmas(selectElement) {
    selectElement.innerHTML = ''; // Limpiar opciones
    
    // Añadir opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar arma...";
    selectElement.appendChild(defaultOption);
    
    // Añadir opciones de armas por categoría
    Object.entries(window.unidadesMilitares).forEach(([categoria, armas]) => {
        // Crear grupo de opciones para esta categoría
        const optgroup = document.createElement('optgroup');
        optgroup.label = categoria;
        
        // Añadir cada arma como una opción
        Object.entries(armas).forEach(([arma, detalles]) => {
            const option = document.createElement('option');
            option.value = detalles.codigo; // Usar el código directamente
            option.textContent = arma;
            option.setAttribute('data-categoria', categoria);
            optgroup.appendChild(option);
        });
        
        selectElement.appendChild(optgroup);
    });
}

/**
 * Carga opciones básicas de armas
 * @param {HTMLSelectElement} selectElement - Elemento select a poblar
 */
function cargarOpcionesBasicas(selectElement) {
    const opcionesBasicas = [
        { value: "CI", text: "Infantería" },
        { value: "CR", text: "Caballería" },
        { value: "CF", text: "Artillería" },
        { value: "CE", text: "Ingenieros" },
        { value: "US", text: "Comunicaciones" }
    ];
    
    // Limpiar opciones existentes
    selectElement.innerHTML = '';
    
    // Añadir opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Seleccionar arma...";
    selectElement.appendChild(defaultOption);
    
    // Añadir opciones básicas
    opcionesBasicas.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.value;
        option.textContent = opcion.text;
        selectElement.appendChild(option);
    });
}

/**
 * Carga el script de unidadesMilitares dinámicamente
 * @returns {Promise} Promesa que se resuelve cuando se carga el script
 */
function cargarScriptUnidadesMilitares() {
    return new Promise((resolve, reject) => {
        if (window.unidadesMilitares) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/Client/js/edicioncompleto.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Carga el script de milsymbol dinámicamente
 * @returns {Promise} Promesa que se resuelve cuando se carga el script
 */
function cargarScriptMilsymbol() {
    return new Promise((resolve, reject) => {
        if (window.ms) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = '/node_modules/milsymbol/dist/milsymbol.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}




/**
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'user_' + Date.now() + Math.random().toString(36).substr(2, 5);
}


function actualizarEstadoConexion(conectado) {
    console.log("Actualizando estado de conexión:", conectado ? "Conectado" : "Desconectado");
    
    // Buscar elementos de indicación de estado
    const indicator = document.getElementById('connection-indicator');
    const statusText = document.getElementById('status-text');
    
    // Si no se encuentran, no emitir error, simplemente registrar e ignorar
    if (!indicator) {
        console.log("Elemento indicator no encontrado");
    } else {
        // Actualizar clase y título según corresponda
        if (conectado) {
            indicator.className = 'connection-indicator connected';
            indicator.title = 'Conectado al servidor';
        } else {
            indicator.className = 'connection-indicator disconnected';
            indicator.title = 'Desconectado del servidor';
        }
    }
    
    if (!statusText) {
        console.log("Elemento status-text no encontrado");
    } else {
        statusText.textContent = conectado ? 'Conectado' : 'Desconectado';
        statusText.className = conectado ? 'text-success' : 'text-danger';
    }
    
    // Actualizar estado global
    window.conectadoAlServidor = conectado;
}

function unirseOperacionExistente() {
    if (!operacionSeleccionada) {
        mostrarError('No hay operación seleccionada');
        return;
    }
    
    console.log("Intentando unirse a operación:", operacionSeleccionada);
    
    // Obtener datos del usuario y elemento
    const usuario = document.getElementById('nombreUsuario').value;
    const designacion = document.getElementById('elemento-designacion').value || "Elemento";
    const dependencia = document.getElementById('elemento-dependencia').value || "";
    
    if (!usuario) {
        mostrarError('El nombre de usuario es obligatorio');
        return;
    }
    
    // SIDC para una unidad de infantería amigable
    const sidc = "SFGPUCI-----";
    
    // Mostrar indicador de carga
    const botonSubmit = document.querySelector('#elementoForm button[type="submit"]');
    if (botonSubmit) {
        const textoOriginal = botonSubmit.innerHTML;
        botonSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniéndose...';
        botonSubmit.disabled = true;
        
        // Restaurar después de 10 segundos como máximo si no hay respuesta
        setTimeout(() => {
            if (botonSubmit.disabled) {
                botonSubmit.innerHTML = textoOriginal;
                botonSubmit.disabled = false;
                mostrarError('No se recibió respuesta del servidor. Intenta nuevamente.');
            }
        }, 10000);
    }
    
    // Crear ID único para usuario y elemento
    const usuarioId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const elementoId = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear info de usuario
    usuarioInfo = {
        id: usuarioId,
        usuario: usuario,
        operacion: operacionSeleccionada.nombre
    };
    
    // Elemento con información básica simplificada
    elementoTrabajo = {
        id: elementoId,
        sidc: sidc,
        designacion: designacion,
        dependencia: dependencia,
        magnitud: "E",
        estado: "operativo"
    };
    
    // Guardar en localStorage
    localStorage.setItem('gb_usuario_info', JSON.stringify(usuarioInfo));
    localStorage.setItem('gb_elemento_info', JSON.stringify(elementoTrabajo));
    localStorage.setItem('gb_operacion_seleccionada', JSON.stringify(operacionSeleccionada));
    
    console.log("Datos a enviar para unirse:", {
        operacion: operacionSeleccionada,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    });
    
    // Enviar al servidor
    socket.emit('unirseOperacion', {
        operacion: operacionSeleccionada.nombre,
        usuario: usuarioInfo,
        elemento: elementoTrabajo
    }, function(respuesta) {
        console.log("Respuesta recibida para unirseOperacion:", respuesta);
        
        // Restaurar estado del botón
        if (botonSubmit) {
            botonSubmit.innerHTML = 'Unirse a la Operación';
            botonSubmit.disabled = false;
        }
        
        if (respuesta && respuesta.error) {
            mostrarError(respuesta.error);
            return;
        }
        
        mostrarMensajeSistema(`Unido correctamente a la operación "${operacionSeleccionada.nombre}"`);
        
        // Redirigir a página de batalla
        // IMPORTANTE: Verificar la ruta correcta en tu entorno
        window.location.href = `/gestionbatalla.html?operacion=${encodeURIComponent(operacionSeleccionada.nombre)}`;
    });
    
    // Si después de 5 segundos no hay respuesta, asumir éxito y redireccionar
    // Esto es un respaldo en caso de que el callback no se ejecute
    setTimeout(() => {
        if (botonSubmit && botonSubmit.disabled) {
            console.log("No se recibió callback, redireccionando de todos modos");
            window.location.href = `/gestionbatalla.html?operacion=${encodeURIComponent(operacionSeleccionada.nombre)}`;
        }
    }, 5000);
}

// Reemplaza la función iniciarConexion con esta versión mejorada
function iniciarConexion() {
    const serverURL = obtenerURLServidor();
    
    // Opciones de socket.io para mejorar la estabilidad de la conexión
    socket = io(serverURL, {
        reconnectionAttempts: 5,
        timeout: 30000,
        transports: ['polling'],  // Solo polling para Render
        upgrade: false  // No intentar upgrade a websocket
    });
    
    // Evento de conexión
    socket.on('connect', function() {
        console.log('Conectado al servidor. ID de socket:', socket.id);
        
        // Llamar al nuevo handler
        onSocketConectado(socket.id);
        
        // Resto del código existente...
        if (operacionSeleccionada) {
            socket.emit('unirse_operacion', {
                operacion: operacionSeleccionada,
                usuario: usuarioInfo
            });
        }
    });
    
    // Evento de desconexión
    socket.on('disconnect', function(reason) {
        console.log('Desconectado del servidor. Razón:', reason);
        mostrarMensajeSistema('Desconectado del servidor: ' + reason);
        actualizarEstadoConexion(false);
    });
    
    // Evento de error
    socket.on('error', function(error) {
        console.error('Error de conexión:', error);
        mostrarError('Error de conexión: ' + error);
    });
    
    // Evento de reconexión
    socket.on('reconnect', function(attemptNumber) {
        console.log('Reconectado al servidor después de', attemptNumber, 'intentos');
        mostrarMensajeSistema('Reconectado al servidor');
        actualizarEstadoConexion(true);
        
        // Volver a solicitar datos
        socket.emit('obtenerOperacionesGB');
        socket.emit('obtenerUsuariosConectados');
    });
    
    // Recibir operaciones
    socket.on('operacionesGB', function(data) {
        console.log('Operaciones recibidas:', data);
        operacionesActivas = data.operaciones || [];
        actualizarListaOperaciones();
    });
    
    // Recibir usuarios conectados
    socket.on('usuariosConectados', function(data) {
        console.log('Usuarios conectados recibidos:', data);
        usuariosConectados = data.usuarios || [];
        actualizarListaUsuarios();
    });
    

    
    // AGREGAR: Ping periódico para mantener la conexión activa
    setInterval(function() {
        if (socket && socket.connected) {
            socket.emit('ping');
        }
    }, 30000); // Cada 30 segundos
}

/**
 * Inicializa MAIRAChat para inicioGB reemplazando el sistema propio
 */
function inicializarMAIRAChatInicioGB() {
    console.log('🔧 Inicializando MAIRAChat para inicioGB (reemplazando chat propio)...');
    
    function intentarInicializarChat() {
        // ✅ CORREGIR: Usar 'socket' global en lugar de 'window.socket'
        const socketDisponible = socket || window.socket || window.clientSocket;
        
        console.log('🔍 Socket encontrado:', !!socketDisponible);
        console.log('🔍 Detalles socket:', {
            socketGlobal: !!socket,
            socketWindow: !!window.socket,
            socketConnected: !!socketDisponible?.connected
        });
        
        if (socketDisponible && window.MAIRAChat) {
            const resultado = window.MAIRAChat.inicializar({ 
                socket: socketDisponible,
                usuario: window.usuarioInfo || window.userName || 'Usuario'
            });
            
            if (resultado) {
                console.log('✅ MAIRAChat inicializado correctamente en inicioGB');
                return true;
            } else {
                console.error('❌ Error al inicializar MAIRAChat');
                return false;
            }
        }
        
        console.warn('⚠️ Socket o MAIRAChat no disponible aún');
        return false;
    }
    
    // Esperar a que esté conectado
    if (window.socket?.connected) {
        console.log('✅ Socket ya conectado, inicializando MAIRAChat inmediatamente');
        setTimeout(() => intentarInicializarChat(), 1000);
    } else {
        console.log('⏳ Esperando conexión del socket...');
        
        // Esperar conexión con reintentos
        let intentos = 0;
        const maxIntentos = 20; // 20 segundos máximo
        
        const intervalo = setInterval(() => {
            intentos++;
            console.log(`🔄 Intento ${intentos}/${maxIntentos} de inicializar MAIRAChat...`);
            
            if (intentarInicializarChat()) {
                clearInterval(intervalo);
                console.log('🎉 MAIRAChat inicializado exitosamente');
            } else if (intentos >= maxIntentos) {
                clearInterval(intervalo);
                console.error('❌ Timeout: No se pudo inicializar MAIRAChat después de 20 intentos');
            }
        }, 1000);
    }
}

/**
 * Hook en la conexión exitosa del socket
 */
function onSocketConectado(socketId) {
    console.log('📡 Socket conectado en inicioGB:', socketId);
    
    // Actualizar estado de conexión (código existente)
    actualizarEstadoConexion('Conectado');
    
    // Inicializar MAIRAChat después de la conexión
    setTimeout(() => {
        inicializarMAIRAChatInicioGB();
    }, 2000); // Dar tiempo a que todo se estabilice
}