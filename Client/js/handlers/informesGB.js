/**
 * informesGB.js
 * Módulo de informes para Gestión de Batalla en MAIRA
 * @version 1.0.0
 */

// Namespace principal
window.MAIRA = window.MAIRA || {};

// Módulo de informes
MAIRA.Informes = (function() {
    // Variables privadas
    let socket = null;
    let usuarioInfo = null;
    let operacionActual = "";
    let elementoTrabajo = null;
    let ultimaPosicion = null;
    let informesRecibidos = {};
    let informesEnviados = {};
    let filtroActual = 'todos';


/**
 * Inicializa el módulo de informes
 * @param {Object} config - Configuración del módulo
 */
function inicializar(config) {
    console.log("Inicializando módulo de documentos");
    
    // Guardar referencias
    socket = config.socket;
    usuarioInfo = config.usuarioInfo;
    operacionActual = config.operacionActual;
    elementoTrabajo = config.elementoTrabajo;
    ultimaPosicion = config.ultimaPosicion;
    
    // Crear la estructura completa de la pestaña Documentos
    crearEstructuraTabDocumentos();
    
    // Inicializar componentes UI
    inicializarInterfazDocumentos();
    
    // Configurar eventos
    verificarEventosInformes(); // Cambiar de configurarEventosDocumentos a verificarEventosInformes
    
    // Cargar documentos guardados en localStorage
    cargarInformesGuardados();
    
    // Mensaje de inicialización
    console.log("Módulo de documentos inicializado");
}
    
/**
 * Configura los eventos de socket relacionados con informes
 * @param {object} socket - Objeto de conexión socket.io
 */
/**
 * Configura los eventos de socket relacionados con informes
 * @param {object} socket - Objeto de conexión socket.io
 */
function configurarEventosSocket(socket) {
    if (!socket) {
        console.error("Socket no disponible para configurar eventos de informes");
        return;
    }
    
    console.log("Configurando eventos de socket para informes");
    
    // Desconectar eventos anteriores para evitar duplicados
    socket.off('nuevoInforme');
    socket.off('informeLeido');
    socket.off('informeMarcadoLeido');
    
    // Evento para recibir un nuevo informe
    socket.on('nuevoInforme', function(informe) {
        console.log("Informe recibido:", informe);
        recibirInforme(informe);
    });
    
    // Eventos de confirmación de lectura
    socket.on('informeLeido', function(data) {
        console.log("Informe marcado como leído:", data);
        marcarInformeLeido(data.informeId);
    });
    
    socket.on('informeMarcadoLeido', function(data) {
        console.log("Confirmación de informe leído recibida:", data);
        marcarInformeLeido(data.informeId);
    });
    
    console.log("Eventos de socket para informes configurados");
}


    // Verificar los eventos de click en los botones de informes
    function verificarEventosInformes() {
        const btnVerInformes = document.getElementById('btn-ver-informes');
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        
        if (btnVerInformes) {
            console.log("Configurando evento para btn-ver-informes");
            // Eliminar eventos anteriores para evitar duplicados
            btnVerInformes.replaceWith(btnVerInformes.cloneNode(true));
            const newBtnVerInformes = document.getElementById('btn-ver-informes');
            
            // Actualizar texto para consistencia
            newBtnVerInformes.textContent = 'Ver Documentos';
            
            newBtnVerInformes.addEventListener('click', function() {
                console.log("Botón Ver Documentos clickeado");
                
                // Desactivar ambos botones
                document.querySelectorAll('.informes-botones button').forEach(b => b.classList.remove('active'));
                
                // Activar este botón
                this.classList.add('active');
                
                // Mostrar la lista y ocultar el formulario
                const verInformes = document.getElementById('ver-informes');
                const crearInforme = document.getElementById('crear-informe');
                
                if (verInformes) verInformes.classList.remove('d-none');
                if (crearInforme) crearInforme.classList.add('d-none');
                
                // Actualizar la lista de informes
                actualizarListaInformes();
            });
        }
        
        if (btnCrearInforme) {
            console.log("Configurando evento para btn-crear-informe");
            // Eliminar eventos anteriores para evitar duplicados
            btnCrearInforme.replaceWith(btnCrearInforme.cloneNode(true));
            const newBtnCrearInforme = document.getElementById('btn-crear-informe');
            
            // Cambiar texto si es necesario
            newBtnCrearInforme.textContent = 'Crear Documento';
            
            newBtnCrearInforme.addEventListener('click', function() {
                console.log("Botón Crear Documento clickeado");
                
                // Desactivar ambos botones
                document.querySelectorAll('.informes-botones button').forEach(b => b.classList.remove('active'));
                
                // Activar este botón
                this.classList.add('active');
                
                // Ocultar la lista y mostrar el formulario
                const verInformes = document.getElementById('ver-informes');
                const crearInforme = document.getElementById('crear-informe');
                
                if (verInformes) verInformes.classList.add('d-none');
                if (crearInforme) crearInforme.classList.remove('d-none');
                
                // Asegurarse de que el formulario esté correctamente configurado
                actualizarHTMLCreacionDocumentos();
                configurarEventosCambioTipoDocumento();
            });
        }
        
        // Configurar eventos para los formularios
        const formularios = document.querySelectorAll('#form-informe, #formulario-informe form, #formulario-orden form');
        formularios.forEach(form => {
            if (form) {
                // Limpiar eventos anteriores
                const nuevoForm = form.cloneNode(true);
                form.parentNode.replaceChild(nuevoForm, form);
                
                // Añadir evento submit
                nuevoForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    enviarDocumento();
                });
                
                // Configurar botón cancelar
                const btnCancelar = nuevoForm.querySelector('button[type="button"], #cancelar-informe');
                if (btnCancelar) {
                    btnCancelar.addEventListener('click', function() {
                        // Volver a la lista
                        const btnVerInformes = document.getElementById('btn-ver-informes');
                        if (btnVerInformes) {
                            btnVerInformes.click();
                        }
                        
                        // Limpiar formulario
                        nuevoForm.reset();
                    });
                }
            }
        });
        
        // Configurar eventos de tipos de documento
        configurarEventosCambioTipoDocumento();
    }



/**
 * Actualiza la lista de informes en la interfaz
 */
function actualizarListaInformes() {
    console.log("Actualizando lista de informes");
    
    const listaInformes = document.getElementById('lista-informes');
    if (!listaInformes) {
        console.error("Lista de informes no encontrada");
        return;
    }
    
    // Limpiar lista actual
    listaInformes.innerHTML = '';
    
    // Obtener todos los informes
    const todosInformes = obtenerInformes(filtroActual);
    
    if (todosInformes.length === 0) {
        // Mostrar mensaje si no hay informes
        listaInformes.innerHTML = `
            <div class="no-informes p-3 text-center">
                <i class="fas fa-inbox fa-2x mb-2 text-muted"></i>
                <p>No hay documentos para mostrar</p>
            </div>
        `;
        return;
    }
    
    // Agregar cada informe a la lista
    todosInformes.forEach(informe => {
        agregarInforme(informe);
    });
    
    console.log(`Actualizados ${todosInformes.length} informes en la interfaz`);
}


/**
 * Carga informes guardados del localStorage
 */
function cargarInformesGuardados() {
    console.log("Cargando informes guardados del localStorage");
    
    // Cargar informes enviados
    try {
        const informesEnviadosGuardados = localStorage.getItem('gb_informes_enviados');
        if (informesEnviadosGuardados) {
            const listaEnviados = JSON.parse(informesEnviadosGuardados);
            
            // Convertir a formato objeto con ID como clave
            listaEnviados.forEach(informe => {
                if (informe && informe.id) {
                    informesEnviados[informe.id] = informe;
                    
                    // Agregar a la interfaz
                    agregarInforme(informe);
                }
            });
            
            console.log(`Cargados ${listaEnviados.length} informes enviados`);
        }
    } catch (error) {
        console.error("Error al cargar informes enviados:", error);
    }
    
    // Cargar informes recibidos
    try {
        const informesRecibidosGuardados = localStorage.getItem('gb_informes_recibidos');
        if (informesRecibidosGuardados) {
            const listaRecibidos = JSON.parse(informesRecibidosGuardados);
            
            // Convertir a formato objeto con ID como clave
            listaRecibidos.forEach(informe => {
                if (informe && informe.id) {
                    informesRecibidos[informe.id] = informe;
                    
                    // Agregar a la interfaz
                    agregarInforme(informe);
                }
            });
            
            console.log(`Cargados ${listaRecibidos.length} informes recibidos`);
        }
    } catch (error) {
        console.error("Error al cargar informes recibidos:", error);
    }
}

// EN informesGB.js línea ~200 - CORREGIR ID DE PESTAÑA:
function crearEstructuraTabDocumentos() {
    console.log("Creando estructura de la pestaña de documentos");
    
    // ✅ USAR ID CORRECTO QUE COINCIDA CON EL HTML:
    let tabContent = document.getElementById('tab-informes'); // ✅ CAMBIAR DE 'tab-Documentos' a 'tab-informes'
    
    if (!tabContent) {
        console.error("❌ No se encontró tab-informes");
        
        // ✅ CREAR DINÁMICAMENTE SI NO EXISTE:
        const tabContainer = document.querySelector('.tab-content');
        if (tabContainer) {
            tabContent = document.createElement('div');
            tabContent.id = 'tab-informes';
            tabContent.className = 'tab-content-item';
            tabContainer.appendChild(tabContent);
            console.log('✅ tab-informes creado dinámicamente');
        } else {
            console.error("❌ No se encontró contenedor de pestañas");
            return;
        }
    }
    
    // ✅ VERIFICAR QUE NO ESTÉ YA INICIALIZADO:
    if (tabContent.querySelector('#lista-documentos')) {
        console.log('⚠️ Estructura de documentos ya existe');
        return;
    }

    // ✅ CREAR CONTENIDO COMPLETO:
    tabContent.innerHTML = `
        <!-- Cabecera con controles -->
        <div class="documentos-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas fa-file-alt"></i> Documentos e Informes
                </h5>
                <div class="documentos-controles">
                    <select id="filtro-documentos" class="form-control form-control-sm d-inline-block w-auto mr-2">
                        <option value="todos">Todos</option>
                        <option value="informes">Solo Informes</option>
                        <option value="mensajes">Solo Mensajes</option>
                        <option value="multimedia">Con Adjuntos</option>
                    </select>
                    <button id="btn-nuevo-informe" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus"></i> Nuevo
                    </button>
                </div>
            </div>
        </div>

        <!-- Lista de documentos -->
        <div id="lista-documentos" class="lista-documentos">
            <!-- Los documentos se cargarán aquí dinámicamente -->
        </div>

        <!-- Formulario para nuevo informe -->
        <div id="formulario-informe" class="formulario-informe mt-4" style="display: none;">
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">Nuevo Informe</h6>
                </div>
                <div class="card-body">
                    <form id="form-crear-informe">
                        <div class="form-group">
                            <label for="titulo-informe">Título:</label>
                            <input type="text" id="titulo-informe" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contenido-informe">Contenido:</label>
                            <textarea id="contenido-informe" class="form-control" rows="4" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="destinatario-informe">Destinatario:</label>
                            <select id="destinatario-informe" class="form-control">
                                <option value="todos">Todos los participantes</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="adjunto-informe">Adjunto (opcional):</label>
                            <input type="file" id="adjunto-informe" class="form-control-file" 
                                   accept="image/*,audio/*,video/*,.pdf,.doc,.docx">
                        </div>
                        
                        <div class="form-group">
                            <div class="btn-group">
                                <button type="button" id="btn-foto-informe" class="btn btn-outline-secondary">
                                    <i class="fas fa-camera"></i> Foto
                                </button>
                                <button type="button" id="btn-audio-informe" class="btn btn-outline-secondary">
                                    <i class="fas fa-microphone"></i> Audio
                                </button>
                                <button type="button" id="btn-video-informe" class="btn btn-outline-secondary">
                                    <i class="fas fa-video"></i> Video
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group text-right">
                            <button type="button" id="btn-cancelar-informe" class="btn btn-secondary mr-2">
                                Cancelar
                            </button>
                            <button type="submit" id="btn-enviar-informe" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> Enviar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    console.log("✅ Estructura de documentos creada correctamente");
}


function actualizarSelectorTipoDocumento() {
    // Ocultar los selectores originales ya que usaremos los botones
    const selectorTipoInforme = document.querySelector('#formulario-informe #tipo-informe');
    if (selectorTipoInforme) {
        selectorTipoInforme.style.display = 'none'; // Ocultar visualmente
        // Pero mantener las opciones para los valores internos
        selectorTipoInforme.innerHTML = `
            <option value="exploracion">Informe de Exploración</option>
            <option value="reconocimiento">Informe de Reconocimiento</option>
            <option value="situacion">Informe de Situación</option>
            <option value="otro">Otro tipo de Informe</option>
        `;
    }
    
    const selectorTipoOrden = document.querySelector('#formulario-orden #tipo-informe');
    if (selectorTipoOrden) {
        selectorTipoOrden.style.display = 'none'; // Ocultar visualmente
        // Pero mantener las opciones para los valores internos
        selectorTipoOrden.innerHTML = `
            <option value="operaciones">Orden de Operaciones (Completa)</option>
            <option value="parcial">Orden Parcial</option>
            <option value="mision">Orden Tipo Misión</option>
            <option value="otra">Otro tipo de Orden</option>
        `;
    }
    
    // Ocultar también las etiquetas
    const labelTipoInforme = document.querySelector('#formulario-informe label[for="tipo-informe"]');
    if (labelTipoInforme) {
        labelTipoInforme.style.display = 'none';
    }
    
    const labelTipoOrden = document.querySelector('#formulario-orden label[for="tipo-informe"]');
    if (labelTipoOrden) {
        labelTipoOrden.style.display = 'none';
    }
}

function actualizarHTMLCreacionDocumentos() {
    const contenedorCrearInforme = document.getElementById('crear-informe');
    if (!contenedorCrearInforme) {
        console.error("Contenedor de crear informe no encontrado");
        return;
    }
    
    // Verificar si ya se ha modificado
    if (document.getElementById('formulario-documento')) {
        // Ya está actualizado, solo actualizar la lista de destinatarios
        actualizarListaDestinatariosDocumento();
        return;
    }
    
    // Guardar el formulario original
    const formOriginal = contenedorCrearInforme.querySelector('form');
    if (!formOriginal) {
        console.error("Formulario de informe no encontrado");
        return;
    }
    
    // Crear nueva estructura simplificada
    contenedorCrearInforme.innerHTML = `
        <form id="formulario-documento" class="mb-3">
            <div class="form-group mb-3">
                <label for="tipo-documento">Tipo de documento:</label>
                <select id="tipo-documento" class="form-control" required>
                    <option value="">Seleccionar tipo...</option>
                    <optgroup label="Informes">
                        <option value="exploracion">Informe de Exploración</option>
                        <option value="reconocimiento">Informe de Reconocimiento</option>
                        <option value="situacion">Informe de Situación</option>
                        <option value="otro">Otro tipo de Informe</option>
                    </optgroup>
                    <optgroup label="Órdenes">
                        <option value="operaciones">Orden de Operaciones (Completa)</option>
                        <option value="parcial">Orden Parcial</option>
                        <option value="mision">Orden Tipo Misión</option>
                        <option value="otra">Otro tipo de Orden</option>
                    </optgroup>
                </select>
            </div>
            
            <div class="form-group mb-3">
                <label for="prioridad-documento">Prioridad:</label>
                <select id="prioridad-documento" class="form-control" required>
                    <option value="normal">Normal</option>
                    <option value="urgente">URGENTE</option>
                </select>
            </div>
            
            <div class="form-group mb-3">
                <label>Destinatarios:</label>
                <div class="destinatarios-opciones mb-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="destino-todos" value="todos">
                        <label class="form-check-label" for="destino-todos">Todos</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="checkbox" id="destino-comando" value="comando">
                        <label class="form-check-label" for="destino-comando">Comando/Central</label>
                    </div>
                </div>
                
                <div class="usuarios-container">
                    <p class="mb-1"><small>Usuarios específicos:</small></p>
                    <div id="lista-destinatarios-documento" class="lista-destinatarios">
                        <!-- Aquí se añaden los destinatarios dinámicamente -->
                    </div>
                </div>
                
                <!-- Campo oculto para almacenar los IDs de destinatarios -->
                <input type="hidden" id="destinatarios-seleccionados" name="destinatarios-seleccionados" value="">
            </div>
            
            <div class="form-group mb-3">
                <label for="asunto-informe">Asunto:</label>
                <input type="text" id="asunto-informe" class="form-control" required>
            </div>
            
            <div class="form-group mb-3">
                <label for="contenido-informe">Contenido:</label>
                <textarea id="contenido-informe" class="form-control" rows="6" required></textarea>
            </div>
            
            <div id="adjunto-container" class="form-group mb-3">
                <label for="adjunto-informe">Adjuntar archivo:</label>
                <div class="d-flex justify-content-between">
                    <input type="file" id="adjunto-informe" class="form-control" style="width: 75%;">
                    <div class="d-flex">
                        <button type="button" id="btn-foto-informe" class="btn btn-sm btn-outline-primary ml-2" title="Tomar foto">
                            <i class="fas fa-camera"></i>
                        </button>
                        <button type="button" id="btn-audio-informe" class="btn btn-sm btn-outline-primary ml-2" title="Grabar audio">
                            <i class="fas fa-microphone"></i>
                        </button>
                        <button type="button" id="btn-video-informe" class="btn btn-sm btn-outline-primary ml-2" title="Grabar video">
                            <i class="fas fa-video"></i>
                        </button>
                    </div>
                </div>
                <div id="preview-adjunto" style="margin-top: 10px; display: none;"></div>
                <small class="form-text text-muted">Tamaño máximo: 5MB</small>
            </div>
            
            <div class="form-buttons">
                <button type="submit" class="btn btn-primary">Enviar</button>
                <button type="button" id="cancelar-informe" class="btn btn-secondary">Cancelar</button>
            </div>
        </form>
    `;
    
    // Agregar estilos para la lista de destinatarios
    const style = document.createElement('style');
    style.textContent = `
        .lista-destinatarios {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            min-height: 40px;
        }
        
        .destinatario-item {
            background-color: #e9ecef;
            border-radius: 16px;
            padding: 4px 12px;
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .destinatario-item .remover-destinatario {
            margin-left: 8px;
            cursor: pointer;
            color: #dc3545;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: rgba(220, 53, 69, 0.1);
            font-size: 10px;
            transition: all 0.2s;
        }
        
        .destinatario-item .remover-destinatario:hover {
            background: rgba(220, 53, 69, 0.2);
        }
    `;
    document.head.appendChild(style);
    
    // Configurar eventos
    const formulario = document.getElementById('formulario-documento');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            enviarDocumento();
        });
    }
    
    const btnCancelar = document.getElementById('cancelar-informe');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            const btnVerInformes = document.getElementById('btn-ver-informes');
            if (btnVerInformes) {
                btnVerInformes.click();
            }
        });
    }
    
    // Configurar eventos para checkboxes de destinatarios
    const destinoTodos = document.getElementById('destino-todos');
    const destinoComando = document.getElementById('destino-comando');
    
    if (destinoTodos) {
        destinoTodos.addEventListener('change', function() {
            if (this.checked) {
                // Si se selecciona "Todos", desactivar los demás
                if (destinoComando) destinoComando.checked = false;
                document.getElementById('lista-destinatarios-documento').innerHTML = '';
                actualizarDestinatariosSeleccionados();
            }
        });
    }
    
    if (destinoComando) {
        destinoComando.addEventListener('change', function() {
            if (this.checked) {
                // Si se selecciona "Comando", desactivar "Todos"
                if (destinoTodos) destinoTodos.checked = false;
                actualizarDestinatariosSeleccionados();
            }
        });
    }
    
    // Configurar eventos para adjuntos
    const inputAdjunto = document.getElementById('adjunto-informe');
    if (inputAdjunto) {
        inputAdjunto.addEventListener('change', previewAdjunto);
    }
    
    const btnFoto = document.getElementById('btn-foto-informe');
    if (btnFoto) {
        btnFoto.addEventListener('click', capturarFoto);
    }
    
    const btnAudio = document.getElementById('btn-audio-informe');
    if (btnAudio) {
        btnAudio.addEventListener('click', grabarAudio);
    }
    
    const btnVideo = document.getElementById('btn-video-informe');
    if (btnVideo) {
        btnVideo.addEventListener('click', grabarVideo);
    }
    
    // Actualizar lista de destinatarios disponibles
    actualizarListaDestinatariosDocumento();
    
    console.log("Formulario de documento actualizado con selector de múltiples destinatarios");
}

/**
 * Actualiza la lista de destinatarios en el formulario de documento
 */
function actualizarListaDestinatariosDocumento() {
    // Obtener contenedor de la lista
    const listaDestinatarios = document.getElementById('lista-destinatarios-documento');
    if (!listaDestinatarios) return;
    
    // Limpiar lista actual
    while (listaDestinatarios.firstChild) {
        listaDestinatarios.removeChild(listaDestinatarios.firstChild);
    }
    
    // Obtener elementos conectados
    const elementosConectados = {};
    if (window.MAIRA.Elementos && window.MAIRA.Elementos.obtenerElementosConectados) {
        Object.assign(elementosConectados, window.MAIRA.Elementos.obtenerElementosConectados());
    } else if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
        Object.assign(elementosConectados, window.MAIRA.GestionBatalla.elementosConectados);
    }
    
    // Verificar que haya elementos
    if (Object.keys(elementosConectados).length === 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'text-muted';
        mensaje.style.fontSize = '13px';
        mensaje.textContent = 'No hay usuarios conectados en este momento.';
        listaDestinatarios.appendChild(mensaje);
        return;
    }
    
    // Crear lista de destinatarios
    Object.entries(elementosConectados).forEach(([id, datos]) => {
        // No incluir al usuario actual
        if (id === usuarioInfo?.id) return;
        
        const usuario = datos.usuario || (datos.datos?.usuario);
        if (!usuario) return;
        
        // Crear elemento para el destinatario
        const destinatarioItem = document.createElement('div');
        destinatarioItem.className = 'destinatario-item destinatario-checkbox';
        destinatarioItem.setAttribute('data-id', id);
        
        // Obtener información adicional del elemento (designación/dependencia)
        let infoElemento = '';
        const elemento = datos.elemento || datos.datos?.elemento;
        if (elemento) {
            if (elemento.designacion) {
                infoElemento = elemento.designacion;
                if (elemento.dependencia) {
                    infoElemento += '/' + elemento.dependencia;
                }
            }
        }
        
        // Checkbox para seleccionar
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `destinatario-${id}`;
        checkbox.value = id;
        checkbox.className = 'mr-2';
        checkbox.style.marginRight = '5px';
        
        // Label con el nombre de usuario y su elemento
        const label = document.createElement('label');
        label.htmlFor = `destinatario-${id}`;
        label.innerHTML = usuario + (infoElemento ? ` <small>(${infoElemento})</small>` : '');
        label.style.marginBottom = '0';
        label.style.cursor = 'pointer';
        
        destinatarioItem.appendChild(checkbox);
        destinatarioItem.appendChild(label);
        listaDestinatarios.appendChild(destinatarioItem);
        
        // Evento al seleccionar/deseleccionar
        checkbox.addEventListener('change', function() {
            // Si se selecciona un destinatario específico, desmarcar "Todos"
            if (this.checked) {
                const destinoTodos = document.getElementById('destino-todos');
                if (destinoTodos) destinoTodos.checked = false;
            }
            
            actualizarDestinatariosSeleccionados();
        });
    });
}

/**
 * Actualiza el campo oculto con los destinatarios seleccionados
 */
function actualizarDestinatariosSeleccionados() {
    const campoDestinatarios = document.getElementById('destinatarios-seleccionados');
    if (!campoDestinatarios) return;
    
    const destinatarios = [];
    
    // Verificar si se seleccionó "Todos"
    const destinoTodos = document.getElementById('destino-todos');
    if (destinoTodos && destinoTodos.checked) {
        destinatarios.push('todos');
    } 
    // Verificar si se seleccionó "Comando"
    const destinoComando = document.getElementById('destino-comando');
    if (destinoComando && destinoComando.checked) {
        destinatarios.push('comando');
    }
    
    // Verificar usuarios específicos seleccionados
    const checkboxes = document.querySelectorAll('.destinatario-checkbox input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        destinatarios.push(checkbox.value);
    });
    
    // Actualizar campo oculto
    campoDestinatarios.value = destinatarios.join(',');
}

function configurarEventosCambioTipoDocumento() {
    // Evento para cambio entre Informe y Orden
    const tipoDocumentoRadios = document.querySelectorAll('input[name="tipo-documento"]');
    tipoDocumentoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const tipoDocumento = this.value;
            
            // Ocultar todos los formularios
            document.querySelectorAll('.tipo-documento-form').forEach(form => {
                form.classList.add('d-none');
                form.classList.remove('active');
            });
            
            // Mostrar el formulario seleccionado
            const formSeleccionado = document.getElementById(`formulario-${tipoDocumento}`);
            if (formSeleccionado) {
                formSeleccionado.classList.remove('d-none');
                formSeleccionado.classList.add('active');
                
                // Actualizar el selector de tipo según el formulario seleccionado
                const tipoInformeSelector = formSeleccionado.querySelector('#tipo-informe');
                if (tipoInformeSelector) {
                    // Actualizar opciones según sea informe u orden
                    if (tipoDocumento === 'informe') {
                        tipoInformeSelector.innerHTML = `
                            <option value="exploracion">Informe de Exploración</option>
                            <option value="reconocimiento">Informe de Reconocimiento</option>
                            <option value="situacion">Informe de Situación</option>
                            <option value="otro">Otro tipo de Informe</option>
                        `;
                    } else if (tipoDocumento === 'orden') {
                        tipoInformeSelector.innerHTML = `
                            <option value="operaciones">Orden de Operaciones (Completa)</option>
                            <option value="parcial">Orden Parcial</option>
                            <option value="mision">Orden Tipo Misión</option>
                            <option value="otra">Otro tipo de Orden</option>
                        `;
                    }
                }
            }
        });
    });
    
    // Evento para cambio de prioridad de documento
    const prioridadRadios = document.querySelectorAll('input[name="prioridad-documento"], input[name="prioridad-documento-orden"]');
    prioridadRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const prioridad = this.value;
            const tipoForm = this.closest('.tipo-documento-form').id;
            const tipoDocumento = tipoForm === 'formulario-informe' ? 'informe' : 'orden';
            
            // Actualizar el campo oculto de prioridad correspondiente
            const prioridadCampo = document.getElementById(`prioridad-${tipoDocumento}`);
            if (prioridadCampo) {
                prioridadCampo.value = prioridad;
            }
        });
    });
}

function enviarDocumento() {
    console.log("Preparando envío de documento");
    
    // Obtener el formulario
    const formulario = document.getElementById('formulario-documento');
    if (!formulario) {
        MAIRA.Utils.mostrarNotificacion("Formulario no encontrado", "error");
        return;
    }
    
    // Obtener datos del formulario
    const tipoDocumentoSelect = document.getElementById('tipo-documento');
    const prioridadSelect = document.getElementById('prioridad-documento');
    const destinatariosField = document.getElementById('destinatarios-seleccionados');
    const asuntoInput = document.getElementById('asunto-informe');
    const contenidoInput = document.getElementById('contenido-informe');
    const archivoAdjunto = document.getElementById('adjunto-informe');
    
    if (!tipoDocumentoSelect || !prioridadSelect || !destinatariosField || !asuntoInput || !contenidoInput) {
        MAIRA.Utils.mostrarNotificacion("Error: elementos del formulario no encontrados", "error");
        return;
    }
    
    const tipo = tipoDocumentoSelect.value;
    const prioridad = prioridadSelect.value;
    const destinatariosStr = destinatariosField.value;
    const asunto = asuntoInput.value.trim();
    const contenido = contenidoInput.value.trim();
    
    // Verificaciones básicas
    if (!tipo) {
        MAIRA.Utils.mostrarNotificacion("Debes seleccionar un tipo de documento", "error");
        return;
    }
    
    if (!asunto || !contenido) {
        MAIRA.Utils.mostrarNotificacion("Debes completar asunto y contenido del documento", "error");
        return;
    }
    
    // Comprobar si se ha seleccionado algún destinatario
    if (!destinatariosStr) {
        // Verificar si los checkboxes individualmente están marcados
        const destinoTodos = document.getElementById('destino-todos');
        const destinoComando = document.getElementById('destino-comando');
        const checkboxesUsuarios = document.querySelectorAll('.destinatario-checkbox input[type="checkbox"]:checked');
        
        if ((!destinoTodos || !destinoTodos.checked) && 
            (!destinoComando || !destinoComando.checked) && 
            checkboxesUsuarios.length === 0) {
            
            MAIRA.Utils.mostrarNotificacion("Debes seleccionar al menos un destinatario", "error");
            return;
        }
        
        // Actualizar el campo de destinatarios si está vacío pero hay selecciones
        actualizarDestinatariosSeleccionados();
    }
    
    // Verificar si tenemos la información del usuario
    if (!usuarioInfo || !elementoTrabajo) {
        if (typeof MAIRA.Chat !== 'undefined' && MAIRA.Chat.agregarMensajeChat) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
        }
        MAIRA.Utils.mostrarNotificacion("No se ha iniciado sesión correctamente", "error");
        return;
    }
    
    // Determinar categoría (informe u orden)
    let categoriaDocumento = 'informe';
    if (tipo === 'operaciones' || tipo === 'parcial' || tipo === 'mision' || tipo === 'otra') {
        categoriaDocumento = 'orden';
    }
    
    // Obtener destinatarios
    const destinatarios = destinatariosStr.split(',').filter(Boolean);
    
    // Mostrar indicador de carga
    mostrarCargandoEnvio(true);
    
    // Procesar el envío del documento para cada destinatario o para todos/comando
    if (destinatarios.includes('todos')) {
        // Enviar a todos los participantes
        enviarDocumentoUnico('todos', tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto);
    } else if (destinatarios.includes('comando')) {
        // Enviar al comando
        enviarDocumentoUnico('comando', tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto);
    } else if (destinatarios.length > 0) {
        // Si hay múltiples destinatarios específicos, enviar un documento para cada uno
        let documentosEnviados = 0;
        let documentosFallidos = 0;
        
        // Si son muchos destinatarios, mostrar un mensaje
        if (destinatarios.length > 3) {
            MAIRA.Utils.mostrarNotificacion(`Enviando documento a ${destinatarios.length} destinatarios...`, "info");
        }
        
        // Función para procesar el siguiente destinatario
        const procesarSiguienteDestinatario = (index) => {
            if (index >= destinatarios.length) {
                // Todos los documentos han sido procesados
                if (documentosFallidos > 0) {
                    MAIRA.Utils.mostrarNotificacion(`Enviados ${documentosEnviados} documentos con ${documentosFallidos} fallos`, "warning");
                } else {
                    MAIRA.Utils.mostrarNotificacion(`Documento enviado a ${documentosEnviados} destinatarios`, "success");
                }
                
                // Limpiar formulario
                limpiarFormularioDocumento();
                mostrarCargandoEnvio(false);
                return;
            }
            
            const destinatario = destinatarios[index];
            enviarDocumentoUnico(
                destinatario, 
                tipo, 
                categoriaDocumento, 
                prioridad, 
                asunto, 
                contenido, 
                (index === 0 ? archivoAdjunto : null), // Solo adjuntar el archivo al primer destinatario para evitar duplicados
                (exito) => {
                    // Callback para el resultado
                    if (exito) {
                        documentosEnviados++;
                    } else {
                        documentosFallidos++;
                    }
                    
                    // Procesar el siguiente
                    procesarSiguienteDestinatario(index + 1);
                }
            );
        };
        
        // Iniciar el procesamiento
        procesarSiguienteDestinatario(0);
    } else {
        MAIRA.Utils.mostrarNotificacion("Debes seleccionar al menos un destinatario", "error");
        mostrarCargandoEnvio(false);
    }
}

/**
 * Muestra u oculta el indicador de carga para el envío de documentos
 * @param {boolean} mostrar - Si se debe mostrar el indicador
 */
function mostrarCargandoEnvio(mostrar) {
    // Botones de enviar en todos los formularios posibles
    const botones = document.querySelectorAll('#formulario-documento button[type="submit"]');

    botones.forEach(boton => {
        if (mostrar) {
            // Guardar texto original y mostrar spinner
            boton.setAttribute('data-original-text', boton.innerHTML);
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            boton.disabled = true;
        } else {
            // Restaurar texto original
            const textoOriginal = boton.getAttribute('data-original-text') || 'Enviar';
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
        }
    });
}

/**
 * Envía un documento a un destinatario específico
 * @param {string} destinatario - ID del destinatario o 'todos'/'comando'
 * @param {string} tipo - Tipo de documento
 * @param {string} categoriaDocumento - Categoría ('informe' u 'orden')
 * @param {string} prioridad - Prioridad ('normal' o 'urgente')
 * @param {string} asunto - Asunto del documento
 * @param {string} contenido - Contenido del documento
 * @param {HTMLInputElement|null} archivoAdjunto - Elemento de input para el archivo adjunto
 * @param {Function|null} callback - Función de callback con el resultado (true/false)
 */
function enviarDocumentoUnico(destinatario, tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto, callback) {
    // Crear ID único
    const documentoId = typeof MAIRA.Utils !== 'undefined' && MAIRA.Utils.generarId ? 
        MAIRA.Utils.generarId() : 
        'doc_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    
    // Crear objeto del documento
    const documento = {
        id: documentoId,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: elementoTrabajo
        },
        destinatario: destinatario,
        tipo: tipo,
        categoriaDocumento: categoriaDocumento,
        prioridad: prioridad,
        asunto: asunto,
        contenido: contenido,
        leido: false,
        posicion: ultimaPosicion ? { 
            lat: ultimaPosicion.lat, 
            lng: ultimaPosicion.lng,
            precision: ultimaPosicion.precision,
            rumbo: ultimaPosicion.rumbo || 0
        } : null,
        timestamp: new Date().toISOString(),
        operacion: operacionActual,
        tieneAdjunto: false,
        adjunto: null
    };

    // Procesar archivo adjunto si existe
    if (archivoAdjunto && archivoAdjunto.files && archivoAdjunto.files.length > 0) {
        const archivo = archivoAdjunto.files[0];
        
        // Verificar tamaño máximo
        if (archivo.size > 5 * 1024 * 1024) {
            MAIRA.Utils.mostrarNotificacion("El archivo adjunto excede el tamaño máximo permitido (5MB)", "error");
            if (callback) callback(false);
            return;
        }
        
        // Procesar archivo
        procesarArchivoAdjunto(documento, archivo)
            .then(documentoConAdjunto => {
                finalizarEnvioDocumento(documentoConAdjunto, callback);
            })
            .catch(error => {
                console.error("Error al procesar archivo adjunto:", error);
                MAIRA.Utils.mostrarNotificacion("Error al procesar archivo adjunto: " + error.message, "error");
                if (callback) callback(false);
            });
    } else {
        // No hay archivo adjunto, continuar directamente
        finalizarEnvioDocumento(documento, callback);
    }
}

/**
 * Finaliza el envío de un documento
 * @param {Object} documento - Documento a enviar
 * @param {Function|null} callback - Función de callback con el resultado (true/false)
 */
function finalizarEnvioDocumento(documento, callback) {
    console.log("Finalizando envío de documento:", documento);

    // Enviar al servidor si estamos conectados
    if (socket && socket.connected) {
        // Emitir evento con timeout para manejar errores de envío
        let timeoutId = setTimeout(() => {
            MAIRA.Utils.mostrarNotificacion("Tiempo de espera agotado al enviar el documento. Guardado localmente.", "warning");
            
            // Guardar en memoria
            informesEnviados[documento.id] = documento;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Agregar a la interfaz
            agregarInforme(documento);
            
            if (callback) callback(false);
        }, 10000); // 10 segundos de timeout
        
        socket.emit('nuevoInforme', documento, function(respuesta) {
            // Limpiar timeout ya que recibimos respuesta
            clearTimeout(timeoutId);
            
            console.log("Respuesta del servidor al enviar documento:", respuesta);
            
            if (respuesta && respuesta.error) {
                MAIRA.Utils.mostrarNotificacion("Error al enviar documento: " + respuesta.error, "error");
                
                // Guardar en memoria
                informesEnviados[documento.id] = documento;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Agregar a la interfaz
                agregarInforme(documento);
                
                if (callback) callback(false);
                return;
            }
            
            // Guardar en memoria
            informesEnviados[documento.id] = documento;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Añadir a la interfaz
            agregarInforme(documento);
            
            // Notificar envío exitoso
            const tipoTexto = documento.categoriaDocumento === 'orden' ? "Orden" : "Informe";
            const prioridadTexto = documento.prioridad === 'urgente' ? "URGENTE" : "";
            const mensajeExito = `${tipoTexto} ${prioridadTexto} "${documento.asunto}" enviado correctamente`;
            
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                MAIRA.Chat.agregarMensajeChat("Sistema", mensajeExito, "sistema");
            }
            
            MAIRA.Utils.mostrarNotificacion(mensajeExito, "success");
            
            if (callback) callback(true);
        });
    } else {
        // No hay conexión, guardar localmente
        
        // Marcar como pendiente
        documento.pendiente = true;
        
        // Guardar en memoria
        informesEnviados[documento.id] = documento;
        
        // Guardar en localStorage
        guardarInformesLocalmente();
        
        // Añadir a la interfaz local
        agregarInforme(documento);
        
        // Notificar guardado para envío posterior
        MAIRA.Utils.mostrarNotificacion(`Documento guardado para envío posterior`, "info");
        
        if (callback) callback(false);
    }
}

function enviarDocumento() {
    console.log("Preparando envío de documento");
    
    // Obtener el formulario
    const formulario = document.getElementById('formulario-documento');
    if (!formulario) {
        MAIRA.Utils.mostrarNotificacion("Formulario no encontrado", "error");
        return;
    }
    
    // Obtener datos del formulario
    const tipoDocumentoSelect = document.getElementById('tipo-documento');
    const prioridadSelect = document.getElementById('prioridad-documento');
    const destinatariosField = document.getElementById('destinatarios-seleccionados');
    const asuntoInput = document.getElementById('asunto-informe');
    const contenidoInput = document.getElementById('contenido-informe');
    const archivoAdjunto = document.getElementById('adjunto-informe');
    
    if (!tipoDocumentoSelect || !prioridadSelect || !destinatariosField || !asuntoInput || !contenidoInput) {
        MAIRA.Utils.mostrarNotificacion("Error: elementos del formulario no encontrados", "error");
        return;
    }
    
    const tipo = tipoDocumentoSelect.value;
    const prioridad = prioridadSelect.value;
    const destinatariosStr = destinatariosField.value;
    const asunto = asuntoInput.value.trim();
    const contenido = contenidoInput.value.trim();
    
    // Verificaciones básicas
    if (!tipo) {
        MAIRA.Utils.mostrarNotificacion("Debes seleccionar un tipo de documento", "error");
        return;
    }
    
    if (!asunto || !contenido) {
        MAIRA.Utils.mostrarNotificacion("Debes completar asunto y contenido del documento", "error");
        return;
    }
    
    // Comprobar si se ha seleccionado algún destinatario
    if (!destinatariosStr) {
        // Verificar si los checkboxes individualmente están marcados
        const destinoTodos = document.getElementById('destino-todos');
        const destinoComando = document.getElementById('destino-comando');
        const checkboxesUsuarios = document.querySelectorAll('.destinatario-checkbox input[type="checkbox"]:checked');
        
        if ((!destinoTodos || !destinoTodos.checked) && 
            (!destinoComando || !destinoComando.checked) && 
            checkboxesUsuarios.length === 0) {
            
            MAIRA.Utils.mostrarNotificacion("Debes seleccionar al menos un destinatario", "error");
            return;
        }
        
        // Actualizar el campo de destinatarios si está vacío pero hay selecciones
        actualizarDestinatariosSeleccionados();
    }
    
    // Verificar si tenemos la información del usuario
    if (!usuarioInfo || !elementoTrabajo) {
        if (typeof MAIRA.Chat !== 'undefined' && MAIRA.Chat.agregarMensajeChat) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
        }
        MAIRA.Utils.mostrarNotificacion("No se ha iniciado sesión correctamente", "error");
        return;
    }
    
    // Determinar categoría (informe u orden)
    let categoriaDocumento = 'informe';
    if (tipo === 'operaciones' || tipo === 'parcial' || tipo === 'mision' || tipo === 'otra') {
        categoriaDocumento = 'orden';
    }
    
    // Obtener destinatarios
    const destinatarios = destinatariosStr.split(',').filter(Boolean);
    
    // Mostrar indicador de carga
    mostrarCargandoEnvio(true);
    
    // Procesar el envío del documento para cada destinatario o para todos/comando
    if (destinatarios.includes('todos')) {
        // Enviar a todos los participantes
        enviarDocumentoUnico('todos', tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto);
    } else if (destinatarios.includes('comando')) {
        // Enviar al comando
        enviarDocumentoUnico('comando', tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto);
    } else if (destinatarios.length > 0) {
        // Si hay múltiples destinatarios específicos, enviar un documento para cada uno
        let documentosEnviados = 0;
        let documentosFallidos = 0;
        
        // Si son muchos destinatarios, mostrar un mensaje
        if (destinatarios.length > 3) {
            MAIRA.Utils.mostrarNotificacion(`Enviando documento a ${destinatarios.length} destinatarios...`, "info");
        }
        
        // Función para procesar el siguiente destinatario
        const procesarSiguienteDestinatario = (index) => {
            if (index >= destinatarios.length) {
                // Todos los documentos han sido procesados
                if (documentosFallidos > 0) {
                    MAIRA.Utils.mostrarNotificacion(`Enviados ${documentosEnviados} documentos con ${documentosFallidos} fallos`, "warning");
                } else {
                    MAIRA.Utils.mostrarNotificacion(`Documento enviado a ${documentosEnviados} destinatarios`, "success");
                }
                
                // Limpiar formulario
                limpiarFormularioDocumento();
                mostrarCargandoEnvio(false);
                return;
            }
            
            const destinatario = destinatarios[index];
            enviarDocumentoUnico(
                destinatario, 
                tipo, 
                categoriaDocumento, 
                prioridad, 
                asunto, 
                contenido, 
                (index === 0 ? archivoAdjunto : null), // Solo adjuntar el archivo al primer destinatario para evitar duplicados
                (exito) => {
                    // Callback para el resultado
                    if (exito) {
                        documentosEnviados++;
                    } else {
                        documentosFallidos++;
                    }
                    
                    // Procesar el siguiente
                    procesarSiguienteDestinatario(index + 1);
                }
            );
        };
        
        // Iniciar el procesamiento
        procesarSiguienteDestinatario(0);
    } else {
        MAIRA.Utils.mostrarNotificacion("Debes seleccionar al menos un destinatario", "error");
        mostrarCargandoEnvio(false);
    }
}

/**
 * Envía un documento a un destinatario específico
 * @param {string} destinatario - ID del destinatario o 'todos'/'comando'
 * @param {string} tipo - Tipo de documento
 * @param {string} categoriaDocumento - Categoría ('informe' u 'orden')
 * @param {string} prioridad - Prioridad ('normal' o 'urgente')
 * @param {string} asunto - Asunto del documento
 * @param {string} contenido - Contenido del documento
 * @param {HTMLInputElement|null} archivoAdjunto - Elemento de input para el archivo adjunto
 * @param {Function|null} callback - Función de callback con el resultado (true/false)
 */
function enviarDocumentoUnico(destinatario, tipo, categoriaDocumento, prioridad, asunto, contenido, archivoAdjunto, callback) {
    // Crear ID único
    const documentoId = typeof MAIRA.Utils !== 'undefined' && MAIRA.Utils.generarId ? 
        MAIRA.Utils.generarId() : 
        'doc_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    
    // Crear objeto del documento
    const documento = {
        id: documentoId,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: elementoTrabajo
        },
        destinatario: destinatario,
        tipo: tipo,
        categoriaDocumento: categoriaDocumento,
        prioridad: prioridad,
        asunto: asunto,
        contenido: contenido,
        leido: false,
        posicion: ultimaPosicion ? { 
            lat: ultimaPosicion.lat, 
            lng: ultimaPosicion.lng,
            precision: ultimaPosicion.precision,
            rumbo: ultimaPosicion.rumbo || 0
        } : null,
        timestamp: new Date().toISOString(),
        operacion: operacionActual,
        tieneAdjunto: false,
        adjunto: null
    };

    // Procesar archivo adjunto si existe
    if (archivoAdjunto && archivoAdjunto.files && archivoAdjunto.files.length > 0) {
        const archivo = archivoAdjunto.files[0];
        
        // Verificar tamaño máximo
        if (archivo.size > 5 * 1024 * 1024) {
            MAIRA.Utils.mostrarNotificacion("El archivo adjunto excede el tamaño máximo permitido (5MB)", "error");
            if (callback) callback(false);
            return;
        }
        
        // Procesar archivo
        procesarArchivoAdjunto(documento, archivo)
            .then(documentoConAdjunto => {
                finalizarEnvioDocumento(documentoConAdjunto, callback);
            })
            .catch(error => {
                console.error("Error al procesar archivo adjunto:", error);
                MAIRA.Utils.mostrarNotificacion("Error al procesar archivo adjunto: " + error.message, "error");
                if (callback) callback(false);
            });
    } else {
        // No hay archivo adjunto, continuar directamente
        finalizarEnvioDocumento(documento, callback);
    }
}

/**
 * Finaliza el envío de un documento
 * @param {Object} documento - Documento a enviar
 * @param {Function|null} callback - Función de callback con el resultado (true/false)
 */
function finalizarEnvioDocumento(documento, callback) {
    console.log("Finalizando envío de documento:", documento);

    // Enviar al servidor si estamos conectados
    if (socket && socket.connected) {
        // Emitir evento con timeout para manejar errores de envío
        let timeoutId = setTimeout(() => {
            MAIRA.Utils.mostrarNotificacion("Tiempo de espera agotado al enviar el documento. Guardado localmente.", "warning");
            
            // Guardar en memoria
            informesEnviados[documento.id] = documento;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Agregar a la interfaz
            agregarInforme(documento);
            
            if (callback) callback(false);
        }, 10000); // 10 segundos de timeout
        
        socket.emit('nuevoInforme', documento, function(respuesta) {
            // Limpiar timeout ya que recibimos respuesta
            clearTimeout(timeoutId);
            
            console.log("Respuesta del servidor al enviar documento:", respuesta);
            
            if (respuesta && respuesta.error) {
                MAIRA.Utils.mostrarNotificacion("Error al enviar documento: " + respuesta.error, "error");
                
                // Guardar en memoria
                informesEnviados[documento.id] = documento;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Agregar a la interfaz
                agregarInforme(documento);
                
                if (callback) callback(false);
                return;
            }
            
            // Guardar en memoria
            informesEnviados[documento.id] = documento;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Añadir a la interfaz
            agregarInforme(documento);
            
            // Notificar envío exitoso
            const tipoTexto = documento.categoriaDocumento === 'orden' ? "Orden" : "Informe";
            const prioridadTexto = documento.prioridad === 'urgente' ? "URGENTE" : "";
            const mensajeExito = `${tipoTexto} ${prioridadTexto} "${documento.asunto}" enviado correctamente`;
            
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                MAIRA.Chat.agregarMensajeChat("Sistema", mensajeExito, "sistema");
            }
            
            MAIRA.Utils.mostrarNotificacion(mensajeExito, "success");
            
            if (callback) callback(true);
        });
    } else {
        // No hay conexión, guardar localmente
        
        // Marcar como pendiente
        documento.pendiente = true;
        
        // Guardar en memoria
        informesEnviados[documento.id] = documento;
        
        // Guardar en localStorage
        guardarInformesLocalmente();
        
        // Añadir a la interfaz local
        agregarInforme(documento);
        
        // Notificar guardado para envío posterior
        MAIRA.Utils.mostrarNotificacion(`Documento guardado para envío posterior`, "info");
        
        if (callback) callback(false);
    }
}

/**
 * Limpia el formulario de documentos
 */
function limpiarFormularioDocumento() {
    // Limpiar formulario
    const formulario = document.getElementById('formulario-documento');
    if (formulario) {
        formulario.reset();
        
        // Limpiar selecciones específicas
        document.querySelectorAll('.destinatario-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Limpiar campo oculto de destinatarios
        const campoDestinatarios = document.getElementById('destinatarios-seleccionados');
        if (campoDestinatarios) {
            campoDestinatarios.value = '';
        }
    }
    
    // Si hay previsualizaciones de adjuntos, limpiarlas
    const previewAdjunto = document.getElementById('preview-adjunto');
    if (previewAdjunto) {
        previewAdjunto.innerHTML = '';
        previewAdjunto.style.display = 'none';
    }
    
    // Volver a la vista de lista de documentos
    const btnVerInformes = document.getElementById('btn-ver-informes');
    if (btnVerInformes) {
        btnVerInformes.click();
    }
}

/**
 * Filtra los documentos según el tipo seleccionado
 * @param {string} filtro - Filtro a aplicar ('todos', 'informes', 'ordenes', etc.)
 */
function filtrarInformes(filtro) {
    const documentos = document.querySelectorAll('.informe');
    
    // Guardar filtro actual
    filtroActual = filtro;
    
    documentos.forEach(documento => {
        const categoria = documento.getAttribute('data-categoria');
        const esImportante = documento.classList.contains('importante');
        const esArchivado = documento.classList.contains('archivado');
        
        let mostrar = false;
        
        switch(filtro) {
            case 'informes':
                // Mostrar solo informes no archivados
                mostrar = (categoria === 'informe') && !esArchivado;
                break;
            case 'ordenes':
                // Mostrar solo órdenes no archivadas
                mostrar = (categoria === 'orden') && !esArchivado;
                break;
            case 'importantes':
                // Mostrar solo importantes no archivados
                mostrar = esImportante && !esArchivado;
                break;
            case 'archivados':
                // Mostrar solo archivados
                mostrar = esArchivado;
                break;
            default:
                // Mostrar todos menos archivados
                mostrar = !esArchivado;
        }
        
        documento.style.display = mostrar ? 'block' : 'none';
    });
}

function agregarInforme(documento) {
    const listaInformes = document.getElementById('lista-informes');
    if (!listaInformes) {
        console.error("Lista de documentos no encontrada");
        return;
    }

    // Verificar si ya existe el documento en la lista
    const documentoExistente = document.querySelector(`.informe[data-id="${documento.id}"]`);
    if (documentoExistente) {
        console.log(`El documento ya existe en la lista, no se duplica: ${documento.id}`);
        return;
    }

    const esPropio = documento.emisor.id === (usuarioInfo ? usuarioInfo.id : null);

    // Determinar clase CSS según el tipo y prioridad
    let claseCSS = "";
    let iconoTipo = '<i class="fas fa-file-alt"></i>';

    if (documento.prioridad === "urgente") {
        claseCSS += " informe-urgente";
    }

    if (documento.categoriaDocumento === "orden") {
        claseCSS += " orden";
        iconoTipo = '<i class="fas fa-tasks"></i>';
    }

    // Agregar clase para informes propios
    if (esPropio) {
        claseCSS += " propio";
    }

    // Agregar clases para importante/archivado si las tiene
    if (documento.importante) {
        claseCSS += " importante";
    }

    if (documento.archivado) {
        claseCSS += " archivado";
    }

    // Formato de fecha más legible
    const fecha = MAIRA.Utils.formatearFecha(documento.timestamp);

    // Preparar información sobre destinatario/remitente
    let infoRemitente = "";
    if (esPropio) {
        // Si es propio, mostrar a quién se envió
        let destinatarioNombre = "Desconocido";
        
        if (documento.destinatario === "todos") {
            destinatarioNombre = "Todos";
        } else if (documento.destinatario === "comando") {
            destinatarioNombre = "Comando/Central";
        } else if (documento.destinatario && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados && window.MAIRA.GestionBatalla.elementosConectados[documento.destinatario]?.datos?.usuario) {
            destinatarioNombre = window.MAIRA.GestionBatalla.elementosConectados[documento.destinatario].datos.usuario;
        }
        
        infoRemitente = `Enviado a: ${destinatarioNombre}`;
    } else {
        // Si no es propio, mostrar quién lo envió
        let elementoInfo = "";
        if (documento.emisor.elemento) {
            if (documento.emisor.elemento.designacion) {
                elementoInfo = documento.emisor.elemento.designacion;
                if (documento.emisor.elemento.dependencia) {
                    elementoInfo += "/" + documento.emisor.elemento.dependencia;
                }
            }
        }
        
        infoRemitente = `De: ${documento.emisor.nombre}${elementoInfo ? ` (${elementoInfo})` : ''}`;
    }

    // Información sobre adjunto
    let adjuntoHTML = '';
    if (documento.tieneAdjunto && documento.adjunto) {
        const tipoArchivo = documento.adjunto.tipo || 'application/octet-stream';
        let iconoAdjunto = 'fa-file';
        
        // Determinar icono según tipo de archivo
        if (tipoArchivo.startsWith('image/')) {
            iconoAdjunto = 'fa-file-image';
        } else if (tipoArchivo.startsWith('audio/')) {
            iconoAdjunto = 'fa-file-audio';
        } else if (tipoArchivo.startsWith('video/')) {
            iconoAdjunto = 'fa-file-video';
        } else if (tipoArchivo.includes('pdf')) {
            iconoAdjunto = 'fa-file-pdf';
        } else if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) {
            iconoAdjunto = 'fa-file-word';
        } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) {
            iconoAdjunto = 'fa-file-excel';
        } else if (tipoArchivo.includes('zip') || tipoArchivo.includes('compressed')) {
            iconoAdjunto = 'fa-file-archive';
        }
        
        adjuntoHTML = `
            <div class="informe-adjunto">
                <i class="fas ${iconoAdjunto}"></i> 
                <a href="#" class="ver-adjunto" data-id="${documento.id}">
                    ${documento.adjunto.nombre} (${MAIRA.Utils.formatearTamaño(documento.adjunto.tamaño)})
                </a>
            </div>
        `;
    }

    // Checkbox for selection (Gmail style)
    const checkboxHTML = `
        <div class="informe-checkbox-container">
            <input type="checkbox" class="informe-checkbox" title="Seleccionar">
        </div>
    `;

    // Action buttons 
    const accionesHTML = `
        <div class="informe-acciones">
            <button class="btn-responder" data-id="${documento.id}" title="Responder">
                <i class="fas fa-reply"></i>
            </button>
            ${!esPropio ? `
            <button class="btn-marcar-leido" data-id="${documento.id}" title="Marcar como leído">
                <i class="fas fa-check"></i>
            </button>` : ''}
            <button class="btn-archivar" data-id="${documento.id}" title="Archivar">
                <i class="fas fa-archive"></i>
            </button>
            <button class="btn-importante" data-id="${documento.id}" title="${documento.importante ? 'Desmarcar importante' : 'Marcar importante'}">
                <i class="fas fa-star" ${documento.importante ? 'style="color:gold"' : ''}></i>
            </button>
        </div>
    `;

    // Priority indicator
    const prioridadHTML = documento.prioridad === 'urgente' ? 
        `<span class="documento-prioridad urgente">URGENTE</span>` : '';

    // Create document HTML element
    const documentoHTML = `
        <div class="informe ${claseCSS}" data-id="${documento.id}" data-tipo="${documento.tipo}" data-categoria="${documento.categoriaDocumento}" data-prioridad="${documento.prioridad}" style="${documento.archivado && filtroActual !== 'archivados' ? 'display:none;' : ''}">
            ${checkboxHTML}
            <div class="informe-header">
                <div class="informe-tipo">${iconoTipo}</div>
                <div class="informe-titulo">
                    <strong>${documento.asunto}</strong> ${prioridadHTML}
                    <small>${fecha}</small>
                </div>
                ${accionesHTML}
            </div>
            
            <div class="informe-remitente">${infoRemitente}</div>
            
            <div class="informe-contenido mt-2">${documento.contenido}</div>
            
            ${adjuntoHTML}
            
            ${documento.posicion ? `
            <div class="informe-acciones mt-2">
                <button class="btn-ubicacion" data-lat="${documento.posicion.lat}" data-lng="${documento.posicion.lng}">
                    <i class="fas fa-map-marker-alt"></i> Ver ubicación
                </button>
            </div>` : ''}
        </div>
    `;

    // Add to the beginning of the list
    listaInformes.insertAdjacentHTML('afterbegin', documentoHTML);

    // Configure events for the new document
    configurarEventosDocumento(documento.id);
    
    // Apply special styling for urgent documents
    if (documento.prioridad === 'urgente') {
        const elementoDocumento = document.querySelector(`.informe[data-id="${documento.id}"]`);
        if (elementoDocumento) {
            // Add class for blinking animation
            elementoDocumento.classList.add('urgente-parpadeo');
            
            // Apply red background and white text styling
            elementoDocumento.style.backgroundColor = '#ffebee';
            elementoDocumento.style.borderLeftColor = '#f44336';
            elementoDocumento.style.borderLeftWidth = '4px';
        }
    }
}




function prepararRespuestaDocumento(documentoId) {
// Obtener documento original
const documentoElement = document.querySelector(`.informe[data-id="${documentoId}"]`);
if (!documentoElement) return;

// Obtener datos básicos
const asuntoOriginal = documentoElement.querySelector('.informe-titulo strong').textContent;
const remitente = documentoElement.querySelector('.informe-remitente').textContent.replace('De:', '').trim();
const categoriaOriginal = documentoElement.getAttribute('data-categoria');

// Cambiar a la pestaña de crear documento
const btnCrearInforme = document.getElementById('btn-crear-informe');
if (btnCrearInforme) {
    btnCrearInforme.click();
}

// Seleccionar el tipo de documento correcto (informe u orden)
const radioCategoriaInforme = document.querySelector(`input[name="tipo-documento"][value="${categoriaOriginal || 'informe'}"]`);
if (radioCategoriaInforme) {
    radioCategoriaInforme.checked = true;
    
    // Disparar evento change manualmente
    const event = new Event('change');
    radioCategoriaInforme.dispatchEvent(event);
}

// Preparar formulario de respuesta
let formulario;
if (categoriaOriginal === 'orden') {
    formulario = document.querySelector('#formulario-orden form');
} else {
    formulario = document.querySelector('#formulario-informe form');
}

if (!formulario) {
    formulario = document.getElementById('form-informe');
}

if (formulario) {
    const tipoInforme = formulario.querySelector('#tipo-informe');
    const asuntoInforme = formulario.querySelector('#asunto-informe');
    const contenidoInforme = formulario.querySelector('#contenido-informe');
    const destinatarioInforme = formulario.querySelector('#destinatario-informe');
    
    if (tipoInforme && asuntoInforme && contenidoInforme && destinatarioInforme) {
        // Verificar si el documento original es de otro usuario para responder
        const esPropio = documentoElement.classList.contains('propio');
        
        if (!esPropio) {
            // Si no es propio, responder al emisor original
            // Buscar el ID del emisor
            let emisorId = null;
            
            // Buscar en los informes recibidos
            if (informesRecibidos[documentoId]) {
                emisorId = informesRecibidos[documentoId].emisor.id;
            } else {
                // Buscar en los elementos conectados
                if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
                    Object.entries(window.MAIRA.GestionBatalla.elementosConectados).forEach(([id, datos]) => {
                        if (datos.datos && datos.datos.usuario && datos.datos.usuario === remitente) {
                            emisorId = id;
                        }
                    });
                }
            }
            
            if (emisorId) {
                destinatarioInforme.value = emisorId;
            }
        }
        
        // Preparar asunto como respuesta
        if (!asuntoOriginal.startsWith('Re:')) {
            asuntoInforme.value = 'Re: ' + asuntoOriginal;
        } else {
            asuntoInforme.value = asuntoOriginal;
        }
        
        // Añadir cita del mensaje original
        const contenidoOriginal = documentoElement.querySelector('.informe-contenido').innerHTML;
        contenidoInforme.value = '\n\n-------- Documento Original --------\n' + 
            contenidoOriginal.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
        
        // Enfocar al inicio para que el usuario escriba su respuesta
        contenidoInforme.setSelectionRange(0, 0);
        contenidoInforme.focus();
    }
}
}

/**
 * Archiva un documento
 * @param {string} documentoId - ID del documento a archivar
 */
function archivarDocumento(documentoId) {
    const documentoElement = document.querySelector(`.informe[data-id="${documentoId}"]`);
    if (!documentoElement) return;

    // Marcar como archivado visualmente
    documentoElement.classList.add('archivado');

    // Si el filtro actual no es 'archivados', ocultarlo
    if (filtroActual !== 'archivados') {
        documentoElement.style.display = 'none';
    }

    // Actualizar en memoria
    if (informesRecibidos[documentoId]) {
        informesRecibidos[documentoId].archivado = true;
    } else if (informesEnviados[documentoId]) {
        informesEnviados[documentoId].archivado = true;
    }

    // Guardar cambios en localStorage
    guardarInformesLocalmente();

    // Notificar al usuario
    MAIRA.Utils.mostrarNotificacion("Documento archivado correctamente", "success");
}

/**
 * Toggle importante para un documento
 * @param {string} documentoId - ID del documento
 */
function toggleImportanteDocumento(documentoId) {
    const documentoElement = document.querySelector(`.informe[data-id="${documentoId}"]`);
    if (!documentoElement) return;

    // Determinar si está marcado como importante
    const esImportante = documentoElement.classList.contains('importante');

    // Cambiar estado
    if (esImportante) {
        documentoElement.classList.remove('importante');
        
        // Cambiar icono de estrella
        const iconoEstrella = documentoElement.querySelector('.btn-importante i');
        if (iconoEstrella) {
            iconoEstrella.style.color = '';
        }
        
        // Notificar
        MAIRA.Utils.mostrarNotificacion("Documento desmarcado como importante", "info");
    } else {
        documentoElement.classList.add('importante');
        
        // Cambiar icono de estrella
        const iconoEstrella = documentoElement.querySelector('.btn-importante i');
        if (iconoEstrella) {
            iconoEstrella.style.color = 'gold';
        }
        
        // Notificar
        MAIRA.Utils.mostrarNotificacion("Documento marcado como importante", "success");
    }

    // Actualizar en memoria
    if (informesRecibidos[documentoId]) {
        informesRecibidos[documentoId].importante = !esImportante;
    } else if (informesEnviados[documentoId]) {
        informesEnviados[documentoId].importante = !esImportante;
    }

    // Guardar cambios en localStorage
    guardarInformesLocalmente();
}

// Estilos CSS para los documentos urgentes (parpadeo)
function inicializarEstilosDocumentos() {
// Verificar si ya existe el estilo
if (document.getElementById('estilos-documentos-urgentes')) {
    return;
}

const style = document.createElement('style');
style.id = 'estilos-documentos-urgentes';
style.textContent = `
    /* Estilo para documentos urgentes */
    .informe.urgente-parpadeo {
        animation: parpadeoUrgente 2s infinite;
    }
    
    @keyframes parpadeoUrgente {
        0%, 100% { border-left-color: #f44336; }
        50% { border-left-color: #ff8a80; }
    }
    
    /* Estilos para la etiqueta de urgencia */
    .documento-prioridad.urgente {
        background-color: #f44336;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
        margin-left: 8px;
        animation: parpadeoTextoUrgente 1s infinite;
    }
    
    @keyframes parpadeoTextoUrgente {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;

document.head.appendChild(style);
}

// Agregar esta función como parte de la inicialización
function verificarEventosDocumentos() {
const btnVerInformes = document.getElementById('btn-ver-informes');
const btnCrearInforme = document.getElementById('btn-crear-informe');

if (btnVerInformes) {
    console.log("Configurando evento para btn-ver-informes");
    // Eliminar eventos anteriores para evitar duplicados
    btnVerInformes.replaceWith(btnVerInformes.cloneNode(true));
    const newBtnVerInformes = document.getElementById('btn-ver-informes');
    
    // Actualizar texto
    newBtnVerInformes.textContent = 'Ver Documentos';
    
    newBtnVerInformes.addEventListener('click', function() {
        console.log("Botón Ver Documentos clickeado");
        
        // Desactivar ambos botones
        document.querySelectorAll('.informes-botones button').forEach(b => b.classList.remove('active'));
        
        // Activar este botón
        this.classList.add('active');
        
        // Mostrar la lista y ocultar el formulario
        const verInformes = document.getElementById('ver-informes');
        const crearInforme = document.getElementById('crear-informe');
        
        if (verInformes) verInformes.classList.remove('d-none');
        if (crearInforme) crearInforme.classList.add('d-none');
    });
}

if (btnCrearInforme) {
    console.log("Configurando evento para btn-crear-informe");
    // Eliminar eventos anteriores para evitar duplicados
    btnCrearInforme.replaceWith(btnCrearInforme.cloneNode(true));
    const newBtnCrearInforme = document.getElementById('btn-crear-informe');
       
       // Actualizar texto
       newBtnCrearInforme.textContent = 'Crear Documento';
       
       newBtnCrearInforme.addEventListener('click', function() {
           console.log("Botón Crear Documento clickeado");
           
           // Desactivar ambos botones
           document.querySelectorAll('.informes-botones button').forEach(b => b.classList.remove('active'));
           
           // Activar este botón
           this.classList.add('active');
           
           // Ocultar la lista y mostrar el formulario
           const verInformes = document.getElementById('ver-informes');
           const crearInforme = document.getElementById('crear-informe');
           
           if (verInformes) verInformes.classList.add('d-none');
           if (crearInforme) crearInforme.classList.remove('d-none');
       });
   }
   
   // Configurar evento submit para los formularios
   const formularios = document.querySelectorAll('#form-informe, #formulario-informe form, #formulario-orden form');
   formularios.forEach(form => {
       if (form) {
           form.addEventListener('submit', function(e) {
               e.preventDefault();
               enviarDocumento();
           });
           
           // Botón cancelar
           const btnCancelar = form.querySelector('button[type="button"], #cancelar-informe');
           if (btnCancelar) {
               btnCancelar.addEventListener('click', function() {
                   // Volver a la lista
                   const btnVerInformes = document.getElementById('btn-ver-informes');
                   if (btnVerInformes) {
                       btnVerInformes.click();
                   }
                   
                   // Limpiar formulario
                   form.reset();
               });
           }
       }
   });
}



function agregarFiltrosMejorados() {
   const filtrosContainer = document.querySelector('.filtro-informes');
   
   if (!filtrosContainer) {
       // Si no existe el contenedor, crearlo
       const contenedor = document.createElement('div');
       contenedor.className = 'filtro-informes';
       
       contenedor.innerHTML = `
           <button id="btn-filtro-todos" class="active">Todos</button>
           <button id="btn-filtro-informes">Informes</button>
           <button id="btn-filtro-ordenes">Órdenes</button>
           <button id="btn-filtro-importantes">Importantes</button>
           <button id="btn-filtro-archivados">Archivados</button>
       `;
       
       // Buscar el lugar donde insertar
       const listaInformes = document.getElementById('lista-informes');
       if (listaInformes) {
           listaInformes.parentNode.insertBefore(contenedor, listaInformes);
           
           // Configurar eventos
           const buttons = contenedor.querySelectorAll('button');
           buttons.forEach(btn => {
               btn.addEventListener('click', function() {
                   // Quitar clase activa de todos los botones
                   buttons.forEach(b => b.classList.remove('active'));
                   
                   // Agregar clase activa a este botón
                   this.classList.add('active');
                   
                   // Determinar filtro
                   let filtro = 'todos';
                   if (this.id === 'btn-filtro-informes') filtro = 'informes';
                   else if (this.id === 'btn-filtro-ordenes') filtro = 'ordenes';
                   else if (this.id === 'btn-filtro-importantes') filtro = 'importantes';
                   else if (this.id === 'btn-filtro-archivados') filtro = 'archivados';
                   
                   // Aplicar filtro
                   filtrarInformes(filtro);
               });
           });
       }
   } else {
       // Asegurarnos de que tenga todos los botones necesarios
       if (!document.getElementById('btn-filtro-importantes')) {
           const btnImportantes = document.createElement('button');
           btnImportantes.id = 'btn-filtro-importantes';
           btnImportantes.textContent = 'Importantes';
           filtrosContainer.appendChild(btnImportantes);
       }
       
       if (!document.getElementById('btn-filtro-archivados')) {
           const btnArchivados = document.createElement('button');
           btnArchivados.id = 'btn-filtro-archivados';
           btnArchivados.textContent = 'Archivados';
           filtrosContainer.appendChild(btnArchivados);
       }
       
       // Configurar eventos para todos los botones
       const buttons = filtrosContainer.querySelectorAll('button');
       buttons.forEach(btn => {
           btn.addEventListener('click', function() {
               // Quitar clase activa
               buttons.forEach(b => b.classList.remove('active'));
               
               // Agregar clase activa a este botón
               this.classList.add('active');
               
               // Determinar filtro
               let filtro = 'todos';
               if (this.id === 'btn-filtro-informes') filtro = 'informes';
               else if (this.id === 'btn-filtro-ordenes') filtro = 'ordenes';
               else if (this.id === 'btn-filtro-importantes') filtro = 'importantes';
               else if (this.id === 'btn-filtro-archivados') filtro = 'archivados';
               
               // Aplicar filtro
               filtrarInformes(filtro);
           });
       });
   }
}

function inicializarInterfazDocumentos() {
    console.log("Inicializando interfaz de documentos");
    
    // Inicializar estilos para documentos, incluyendo documentos urgentes
    inicializarEstilosInformes();
    inicializarEstilosDocumentos();
    
    // Obtener referencia a los elementos
    const listaInformes = document.getElementById('lista-informes');
    const btnVerInformes = document.getElementById('btn-ver-informes');
    const btnCrearInforme = document.getElementById('btn-crear-informe');
    
    // Configurar menú contextual vs radial
    const configurarTipoMenu = () => {
        // Verificar si tenemos soporte para menú radial
        const esPantallaTactil = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const esDispositivoMovil = window.innerWidth <= 768;
        
        if (esPantallaTactil || esDispositivoMovil) {
            // Configurar menú radial para dispositivos táctiles
            if (window.configurarMenuRadial) {
                window.configurarMenuRadial();
                console.log('✅ Menú radial configurado para dispositivo táctil');
            }
        } else {
            // Configurar menú contextual para dispositivos desktop
            if (window.configurarMenuContextual) {
                window.configurarMenuContextual();
                console.log('✅ Menú contextual configurado para desktop');
            }
        }
    
    // Llamar después de inicializar otros componentes
    setTimeout(configurarTipoMenu, 1000);

    // Limpiar lista de documentos si existe
    if (listaInformes) {
        listaInformes.innerHTML = '';
    }
    
    // Actualizar HTML para la estructura mejorada de creación de documentos
    actualizarHTMLCreacionDocumentos();
    
    // Agregar filtros mejorados
    agregarFiltrosMejorados();
    
    // Verificar eventos de botones
    verificarEventosInformes();
    
    if (window.MAIRA?.Informes?.inicializar) {
        console.log('🔧 Inicializando módulo de informes...');
        try {
            window.MAIRA.Informes.inicializar({
                socket: socket,
                usuarioInfo: usuarioInfo,
                operacionActual: operacionActual,
                elementoTrabajo: elementoTrabajo,
                ultimaPosicion: ultimaPosicion
            });
            console.log('✅ Módulo de informes inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar informes:', error);
        }
    } else {
        console.warn('⚠️ Módulo MAIRA.Informes no disponible');
    }
    
    console.log("Componentes de interfaz inicializados");
}
    
    // Cargar documentos guardados con retraso para asegurar que todo esté inicializado
    setTimeout(cargarInformesGuardados, 500);
}




    /**
     * Actualiza el HTML del panel de informes para incorporar nuevas funcionalidades
     */
    function actualizarHTML_Informes() {
        // 1. Actualizar el formulario de crear informe para incluir adjuntos
        const formInforme = document.getElementById('form-informe');
        if (formInforme) {
            // Verificar si ya tiene el campo de adjunto
            if (!document.getElementById('adjunto-container')) {
                // Crear el contenedor para adjunto
                const adjuntoContainer = document.createElement('div');
                adjuntoContainer.id = 'adjunto-container';
                adjuntoContainer.className = 'form-group mt-3';
                
                // Campo de archivo con botones para multimedia
                adjuntoContainer.innerHTML = `
                    <label for="adjunto-informe">Adjuntar archivo:</label>
                    <div class="d-flex justify-content-between">
                        <input type="file" id="adjunto-informe" class="form-control" style="width: 75%;">
                        <div class="d-flex">
                            <button type="button" id="btn-foto-informe" class="btn-foto-informe ml-2" title="Tomar foto">
                                <i class="fas fa-camera"></i>
                            </button>
                            <button type="button" id="btn-audio-informe" class="btn-audio-informe ml-2" title="Grabar audio">
                                <i class="fas fa-microphone"></i>
                            </button>
                            <button type="button" id="btn-video-informe" class="btn-video-informe ml-2" title="Grabar video">
                                <i class="fas fa-video"></i>
                            </button>
                        </div>
                    </div>
                    <div id="preview-adjunto" style="margin-top: 10px; display: none;"></div>
                    <small class="form-text text-muted">Tamaño máximo: 5MB</small>
                `;
                
                // Insertar antes del botón de envío
                const formButtons = formInforme.querySelector('.form-buttons') || formInforme.querySelector('button[type="submit"]').parentNode;
                formInforme.insertBefore(adjuntoContainer, formButtons);
                
                // Configurar eventos
                setTimeout(() => {
                    if (document.getElementById('adjunto-informe')) {
                        document.getElementById('adjunto-informe').addEventListener('change', previewAdjunto);
                    }
                    if (document.getElementById('btn-foto-informe')) {
                        document.getElementById('btn-foto-informe').addEventListener('click', capturarFoto);
                    }
                    if (document.getElementById('btn-audio-informe')) {
                        document.getElementById('btn-audio-informe').addEventListener('click', grabarAudio);
                    }
                    if (document.getElementById('btn-video-informe')) {
                        document.getElementById('btn-video-informe').addEventListener('click', grabarVideo);
                    }
                }, 500);
            }
        }
        
        // 2. Mejorar el selector de destinatarios
        const destinatarioInforme = document.getElementById('destinatario-informe');
        if (destinatarioInforme) {
            // Añadir clases para mejor estilo
            destinatarioInforme.className = 'form-control custom-select';
            
            // Añadir opciones base si está vacío
            if (destinatarioInforme.options.length <= 1) {
                destinatarioInforme.innerHTML = `
                    <option value="">Seleccionar destinatario...</option>
                    <option value="todos">Todos los participantes</option>
                    <option value="comando">Comando/Central</option>
                    <option disabled>───────────────</option>
                `;
                
                // Actualizar con elementos conectados
                setTimeout(actualizarSelectorDestinatariosInforme, 500);
            }
        }
        
        // 3. Mejorar selector de tipo de informe
        const tipoInforme = document.getElementById('tipo-informe');
        if (tipoInforme) {
            // Añadir clases para mejor estilo
            tipoInforme.className = 'form-control custom-select';
            
            // Asegurar que tiene todas las opciones
            if (tipoInforme.options.length < 3) {
                tipoInforme.innerHTML = `
                    <option value="normal">Informe Normal</option>
                    <option value="urgente">Informe URGENTE</option>
                    <option value="orden">ORDEN</option>
                `;
            }
        }
        
        // 4. Agregar botones de acciones en la lista de informes
        const headerListaInformes = document.querySelector('.informes-header');
        if (!headerListaInformes) {
            const listaInformes = document.getElementById('lista-informes');
            if (listaInformes && !document.getElementById('informes-header')) {
                // Crear header con acciones
                const header = document.createElement('div');
                header.id = 'informes-header';
                header.className = 'informes-header d-flex justify-content-between align-items-center mb-3';
                header.innerHTML = `
                    <div>
                        <h5 class="m-0">Informes</h5>
                    </div>
                    <div class="informes-acciones">
                        <button id="btn-exportar-informes" class="btn btn-sm btn-outline-secondary mr-2" title="Exportar informes">
                            <i class="fas fa-file-export"></i>
                        </button>
                        <button id="btn-buscar-informes" class="btn btn-sm btn-outline-secondary" title="Buscar en informes">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                `;
                
                // Insertar antes de la lista
                listaInformes.parentNode.insertBefore(header, listaInformes);
                
                // Configurar eventos
                setTimeout(() => {
                    const btnExportar = document.getElementById('btn-exportar-informes');
                    const btnBuscar = document.getElementById('btn-buscar-informes');
                    
                    if (btnExportar) {
                        btnExportar.addEventListener('click', exportarInformes);
                    }
                    
                    if (btnBuscar) {
                        btnBuscar.addEventListener('click', function() {
                            // Mostrar/ocultar buscador
                            const buscador = document.getElementById('buscador-informes');
                            if (buscador) {
                                buscador.style.display = buscador.style.display === 'none' ? 'block' : 'none';
                                if (buscador.style.display === 'block') {
                                    buscador.querySelector('input').focus();
                                }
                            } else {
                                crearBuscadorInformes();
                            }
                        });
                    }
                }, 500);
            }
        }
    }
    
    /**
     * Crea un buscador de informes
     */
    function crearBuscadorInformes() {
        const header = document.getElementById('informes-header');
        if (!header) return;
        
        const buscador = document.createElement('div');
        buscador.id = 'buscador-informes';
        buscador.className = 'buscador-informes mt-2 mb-3';
        buscador.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control form-control-sm" placeholder="Buscar en informes...">
                <div class="input-group-append">
                    <button class="btn btn-sm btn-outline-secondary" type="button" id="btn-cerrar-buscador">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        header.parentNode.insertBefore(buscador, header.nextSibling);
        
        // Configurar eventos
        const input = buscador.querySelector('input');
        input.addEventListener('input', function() {
            buscarInformes(this.value);
        });
        
        document.getElementById('btn-cerrar-buscador').addEventListener('click', function() {
            buscador.style.display = 'none';
            buscarInformes(''); // Limpiar búsqueda
        });
        
        // Enfocar input
        input.focus();
    }
    
    /**
     * Busca texto en los informes
     * @param {string} texto - Texto a buscar
     */
    function buscarInformes(texto) {
        const informes = document.querySelectorAll('.informe');
        if (!informes.length) return;
        
        const busqueda = texto.toLowerCase().trim();
        let encontrados = 0;
        
        informes.forEach(informe => {
            // Solo buscar en informes que cumplan con el filtro actual
            if ((filtroActual === 'todos') || 
                (filtroActual === 'informes' && !informe.classList.contains('orden')) ||
                (filtroActual === 'ordenes' && informe.classList.contains('orden'))) {
                
                const asunto = informe.querySelector('.informe-titulo')?.textContent?.toLowerCase() || '';
                const contenido = informe.querySelector('.informe-contenido')?.textContent?.toLowerCase() || '';
                const remitente = informe.querySelector('.informe-remitente')?.textContent?.toLowerCase() || '';
                
                if (busqueda === '' || asunto.includes(busqueda) || contenido.includes(busqueda) || remitente.includes(busqueda)) {
                    informe.style.display = 'block';
                    encontrados++;
                    
                    // Resaltar coincidencias si hay texto de búsqueda
                    if (busqueda !== '') {
                        resaltarCoincidencias(informe, busqueda);
                    } else {
                        // Quitar resaltado si la búsqueda está vacía
                        quitarResaltado(informe);
                    }
                } else {
                    informe.style.display = 'none';
                }
            }
        });
        
        // Mostrar mensaje si no hay resultados
        const mensajeNoResultados = document.getElementById('no-resultados-informes');
        if (encontrados === 0 && busqueda !== '') {
            if (!mensajeNoResultados) {
                const mensaje = document.createElement('div');
                mensaje.id = 'no-resultados-informes';
                mensaje.className = 'alert alert-info';
                mensaje.textContent = `No se encontraron informes que coincidan con "${texto}"`;
                
                const listaInformes = document.getElementById('lista-informes');
                if (listaInformes) {
                    listaInformes.parentNode.insertBefore(mensaje, listaInformes);
                }
            }
        } else if (mensajeNoResultados) {
            mensajeNoResultados.remove();
        }
    }
    
    /**
     * Resalta coincidencias de búsqueda en un informe
     * @param {HTMLElement} informe - Elemento del informe
     * @param {string} texto - Texto a resaltar
     */
    function resaltarCoincidencias(informe, texto) {
        // Quitar resaltados previos
        quitarResaltado(informe);
        
        // Función para resaltar texto en un elemento
        function resaltarEnElemento(elemento) {
            if (!elemento || !elemento.textContent) return;
            
            const contenido = elemento.innerHTML;
            const regex = new RegExp(`(${texto})`, 'gi');
            elemento.innerHTML = contenido.replace(regex, '<mark>$1</mark>');
        }
        
        // Resaltar en título
        resaltarEnElemento(informe.querySelector('.informe-titulo strong'));
        
        // Resaltar en contenido
        resaltarEnElemento(informe.querySelector('.informe-contenido'));
        
        // Resaltar en remitente
        resaltarEnElemento(informe.querySelector('.informe-remitente'));
    }
    
    /**
     * Quita el resaltado de búsqueda de un informe
     * @param {HTMLElement} informe - Elemento del informe
     */
    function quitarResaltado(informe) {
        // Función para quitar resaltados en un elemento
        function quitarResaltadoEnElemento(elemento) {
            if (!elemento) return;
            
            // Guardar texto original
            const texto = elemento.textContent;
            
            // Verificar si hay resaltados
            if (elemento.querySelector('mark')) {
                // Restaurar texto original sin resaltados
                elemento.textContent = texto;
            }
        }
        
        // Quitar de los distintos elementos
        quitarResaltadoEnElemento(informe.querySelector('.informe-titulo strong'));
        quitarResaltadoEnElemento(informe.querySelector('.informe-contenido'));
        quitarResaltadoEnElemento(informe.querySelector('.informe-remitente'));
    }
    
   /**
 * Inicializa los estilos para informes
 */
function inicializarEstilosInformes() {
    // Verificar si ya existe la hoja de estilos
    if (document.getElementById('estilos-informes')) {
        return;
    }
    
    // Crear hoja de estilos
    const style = document.createElement('style');
    style.id = 'estilos-informes';
    style.textContent = `
        /* Estilos para informes */
        .informe {
            transition: transform 0.2s;
            margin-bottom: 15px;
            border-radius: 8px;
            padding: 12px 12px 12px 40px; /* Espacio para checkbox */
            background-color: #f8f9fa;
            border-left: 4px solid #6c757d;
            position: relative;
        }
        
        .informe:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .informe .informe-acciones button {
            background: none;
            border: none;
            padding: 5px 8px;
            margin: 0 2px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .informe .informe-acciones button:hover {
            background-color: rgba(0,0,0,0.05);
        }
        
        .informe.informe-urgente {
            border-left: 4px solid #f44336;
            background-color: #fff8f8;
        }
        
        .informe.orden {
            border-left: 4px solid #ff9800;
            background-color: #fffaf4;
        }
        
        .informe.leido {
            opacity: 0.8;
        }
        
        .informe.propio {
            background-color: #f5f9ff;
            border-left: 4px solid #0288d1;
        }
        
        /* Estilos para informes importantes */
        .informe.importante {
            box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.5);
        }
        
        .informe.importante .btn-importante .fa-star {
            color: gold !important;
        }
        
        /* Estilos para informes archivados */
        .informe.archivado {
            opacity: 0.7;
            background-color: #f0f0f0;
        }
        
        /* Estilos para adjuntos en informes */
        .informe-adjunto {
            margin-top: 10px;
            padding: 8px 12px;
            background-color: #f0f2f5;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .informe-adjunto i {
            font-size: 18px;
            color: #555;
        }
        
        .ver-adjunto {
            color: #0281a8;
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 200px;
            display: inline-block;
        }
        
        .ver-adjunto:hover {
            text-decoration: underline;
        }
        
        /* Estilo para el checkbox de selección */
        .informe-checkbox-container {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
        }
        
        .informe-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        /* Botones multimedia */
        .btn-foto-informe,
        .btn-audio-informe,
        .btn-video-informe {
            background: none;
            border: 1px solid #ddd;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-foto-informe:hover,
        .btn-audio-informe:hover,
        .btn-video-informe:hover {
            transform: scale(1.1);
            background-color: #f5f5f5;
        }
        
        /* Buscador de informes */
        .buscador-informes {
            margin-bottom: 10px;
        }
        
        /* Filtros */
        .filtros-informes {
            display: flex;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .filtros-informes button {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .filtros-informes button.active {
            background-color: #e3f2fd;
            border-color: #90caf9;
            font-weight: bold;
        }
        
        .filtros-informes button:hover {
            background-color: #e9ecef;
        }
        
        /* Acciones globales para informes */
        .informes-acciones-globales {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 8px 12px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        
        .informes-acciones-globales .btn-group {
            display: flex;
            gap: 5px;
        }
        
        /* Selector de todos los informes */
        #seleccionar-todos-informes {
            margin-right: 5px;
        }
    `;
    
    document.head.appendChild(style);
}
    

/**
 * Configura eventos para un documento recién agregado
 * @param {string} documentoId - ID del documento
 */
function configurarEventosDocumento(documentoId) {
    // Botón de ver ubicación
    const btnUbicacion = document.querySelector(`.informe[data-id="${documentoId}"] .btn-ubicacion`);
    if (btnUbicacion) {
        btnUbicacion.addEventListener('click', function() {
            const lat = parseFloat(this.getAttribute('data-lat'));
            const lng = parseFloat(this.getAttribute('data-lng'));
            
            if (isNaN(lat) || isNaN(lng)) {
                MAIRA.Utils.mostrarNotificacion("Coordenadas inválidas", "error");
                return;
            }
            
            if (window.mapa) {
                window.mapa.setView([lat, lng], 15);
                
                // Crear un marcador temporal
                const tempMarker = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'custom-div-icon temp-marker',
                        html: '<div class="temp-marker-pin"></div>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    })
                }).addTo(window.mapa);
                
                // Añadir popup con información
                tempMarker.bindPopup(`<strong>Ubicación del documento</strong><br>${document.querySelector(`.informe[data-id="${documentoId}"] .informe-titulo strong`).textContent}`).openPopup();
                
                // Eliminar el marcador después de 30 segundos
                setTimeout(() => {
                    if (window.mapa && window.mapa.hasLayer(tempMarker)) {
                        window.mapa.removeLayer(tempMarker);
                    }
                }, 30000);
            }
        });
    }
    
    // Botón para marcar como leído
    const btnMarcarLeido = document.querySelector(`.informe[data-id="${documentoId}"] .btn-marcar-leido`);
    if (btnMarcarLeido) {
        btnMarcarLeido.addEventListener('click', function() {
            if (socket && socket.connected) {
                socket.emit('informeLeido', { informeId: documentoId });
                
                // Marcar visualmente como leído
                document.querySelector(`.informe[data-id="${documentoId}"]`).classList.add('leido');
                this.style.display = 'none'; // Ocultar botón
            }
        });
    }
    
    // Botón para responder
    const btnResponder = document.querySelector(`.informe[data-id="${documentoId}"] .btn-responder`);
    if (btnResponder) {
        btnResponder.addEventListener('click', function() {
            prepararRespuestaDocumento(documentoId);
        });
    }
    
    // Botón para archivar
    const btnArchivar = document.querySelector(`.informe[data-id="${documentoId}"] .btn-archivar`);
    if (btnArchivar) {
        btnArchivar.addEventListener('click', function() {
            archivarDocumento(documentoId);
        });
    }
    
    // Botón para marcar como importante
    const btnImportante = document.querySelector(`.informe[data-id="${documentoId}"] .btn-importante`);
    if (btnImportante) {
        btnImportante.addEventListener('click', function() {
            toggleImportanteDocumento(documentoId);
        });
    }
    
    // Checkbox para selección
    const checkbox = document.querySelector(`.informe[data-id="${documentoId}"] .informe-checkbox`);
    if (checkbox) {
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que el clic se propague al documento
        });
    }
    
    // Enlace para ver adjunto
    const verAdjunto = document.querySelector(`.informe[data-id="${documentoId}"] .ver-adjunto`);
    if (verAdjunto) {
        verAdjunto.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarAdjuntoDocumento(documentoId);
        });
    }
    
    // Hacer que el documento completo sea interactivo
    const documento = document.querySelector(`.informe[data-id="${documentoId}"]`);
    if (documento) {
        documento.addEventListener('click', function(e) {
            // Solo abrir el documento si el clic no fue en un botón o checkbox
            if (!e.target.closest('button') && !e.target.closest('input[type="checkbox"]') && !e.target.closest('a')) {
                mostrarDetallesDocumento(documentoId);
            }
        });
    }
}

/**
 * Muestra los detalles de un documento en un modal
 * @param {string} documentoId - ID del documento
 */
function mostrarDetallesDocumento(documentoId) {
    // Buscar datos del documento
    const documento = buscarInformePorId(documentoId);
    if (!documento) {
        MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el documento", "error");
        return;
    }
    
    // Crear modal para ver los detalles
    const modal = document.createElement('div');
    modal.className = 'modal-detalles-documento';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Contenido del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '800px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';
    
    // Determinar el título según el tipo
    let tipoTexto = "Informe";
    let claseHeader = "";
    
    if (documento.prioridad === "urgente") {
        claseHeader = "text-danger";
    }
    
    if (documento.categoriaDocumento === "orden") {
        tipoTexto = "Orden";
        if (documento.prioridad !== "urgente") {
            claseHeader = "text-warning";
        }
    }
    
    // Formatear fecha
    const fecha = MAIRA.Utils.formatearFecha ? 
        MAIRA.Utils.formatearFecha(documento.timestamp) : 
        new Date(documento.timestamp).toLocaleString();
    
    // Información del emisor
    let infoEmisor = "";
    if (documento.emisor.elemento) {
        if (documento.emisor.elemento.designacion) {
            infoEmisor = documento.emisor.elemento.designacion;
            if (documento.emisor.elemento.dependencia) {
                infoEmisor += "/" + documento.emisor.elemento.dependencia;
            }
        }
    }
    
    // Información del destinatario
    let infoDestinatario = "";
    if (documento.destinatario === "todos") {
        infoDestinatario = "Todos los participantes";
    } else if (documento.destinatario === "comando") {
        infoDestinatario = "Comando/Central";
    } else if (typeof documento.destinatario === 'string') {
        // Buscar nombre del destinatario
        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            const elemento = window.MAIRA.GestionBatalla.elementosConectados[documento.destinatario];
            if (elemento && elemento.datos) {
                infoDestinatario = elemento.datos.usuario || "Desconocido";
                
                // Agregar info del elemento si disponible
                if (elemento.datos.elemento && elemento.datos.elemento.designacion) {
                    infoDestinatario += ` (${elemento.datos.elemento.designacion}`;
                    if (elemento.datos.elemento.dependencia) {
                        infoDestinatario += `/${elemento.datos.elemento.dependencia}`;
                    }
                    infoDestinatario += ")";
                }
            } else {
                infoDestinatario = "Usuario desconocido";
            }
        } else {
            infoDestinatario = "Destinatario específico";
        }
    }
    
    // Información de adjunto
    let adjuntoHTML = '';
    if (documento.tieneAdjunto && documento.adjunto) {
        const tipoArchivo = documento.adjunto.tipo || 'application/octet-stream';
        let iconoAdjunto = 'fa-file';
        
        // Determinar icono según tipo de archivo
        if (tipoArchivo.startsWith('image/')) {
            iconoAdjunto = 'fa-file-image';
        } else if (tipoArchivo.startsWith('audio/')) {
            iconoAdjunto = 'fa-file-audio';
        } else if (tipoArchivo.startsWith('video/')) {
            iconoAdjunto = 'fa-file-video';
        } else if (tipoArchivo.includes('pdf')) {
            iconoAdjunto = 'fa-file-pdf';
        } else if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) {
            iconoAdjunto = 'fa-file-word';
        } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) {
            iconoAdjunto = 'fa-file-excel';
        } else if (tipoArchivo.includes('zip') || tipoArchivo.includes('compressed')) {
            iconoAdjunto = 'fa-file-archive';
        }
        
        adjuntoHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0">Archivo Adjunto</h5>
                </div>
                <div class="card-body d-flex align-items-center">
                    <i class="fas ${iconoAdjunto} fa-2x mr-3"></i>
                    <div>
                        <div>${documento.adjunto.nombre}</div>
                        <div class="text-muted">${MAIRA.Utils.formatearTamaño ? MAIRA.Utils.formatearTamaño(documento.adjunto.tamaño) : (Math.round(documento.adjunto.tamaño / 1024) + ' KB')}</div>
                    </div>
                    <button class="btn btn-primary ml-auto" onclick="MAIRA.Informes.mostrarAdjuntoDocumento('${documento.id}')">
                        Ver Adjunto
                    </button>
                </div>
            </div>
        `;
    }
    
    // Información de posición
    let posicionHTML = '';
    if (documento.posicion && documento.posicion.lat && documento.posicion.lng) {
        posicionHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0">Ubicación</h5>
                </div>
                <div class="card-body">
                    <p>El documento incluye una ubicación geográfica.</p>
                    <button class="btn btn-info" onclick="MAIRA.Informes.centrarEnPosicionDocumento('${documento.id}')">
                        <i class="fas fa-map-marker-alt"></i> Ver en el mapa
                    </button>
                </div>
            </div>
        `;
    }
    
    // HTML del modal
    modalContent.innerHTML = `
        <div class="modal-header ${claseHeader}">
            <h4>${documento.prioridad === 'urgente' ? 'URGENTE: ' : ''}${tipoTexto}: ${documento.asunto}</h4>
            <button type="button" class="close" aria-label="Cerrar">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>De:</strong> ${documento.emisor.nombre} ${infoEmisor ? `(${infoEmisor})` : ''}
                </div>
                <div class="col-md-6">
                    <strong>Para:</strong> ${infoDestinatario}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Fecha:</strong> ${fecha}
                </div>
                <div class="col-md-6">
                    <strong>Estado:</strong> 
                    <span class="badge ${documento.leido ? 'badge-success' : 'badge-warning'}">
                        ${documento.leido ? 'Leído' : 'No leído'}
                    </span>
                    ${documento.importante ? '<span class="badge badge-warning ml-2">Importante</span>' : ''}
                    ${documento.archivado ? '<span class="badge badge-secondary ml-2">Archivado</span>' : ''}
                </div>
            </div>
            <div class="contenido-documento p-3 border rounded bg-light">
                ${documento.contenido.replace(/\n/g, '<br>')}
            </div>
            ${adjuntoHTML}
            ${posicionHTML}
        </div>
        <div class="modal-footer">
            <div class="btn-group mr-auto">
                <button class="btn btn-outline-secondary btn-sm" onclick="MAIRA.Informes.prepararRespuestaDocumento('${documento.id}')">
                    <i class="fas fa-reply"></i> Responder
                </button>
                ${!documento.archivado ? `
                <button class="btn btn-outline-secondary btn-sm" onclick="MAIRA.Informes.archivarDocumento('${documento.id}'); document.querySelector('.modal-detalles-documento .close').click()">
                    <i class="fas fa-archive"></i> Archivar
                </button>` : ''}
                <button class="btn btn-outline-${documento.importante ? 'warning' : 'secondary'} btn-sm" onclick="MAIRA.Informes.toggleImportanteDocumento('${documento.id}')">
                    <i class="fas fa-star"></i> ${documento.importante ? 'Quitar importancia' : 'Marcar importante'}
                </button>
            </div>
            <button class="btn btn-primary" onclick="document.querySelector('.modal-detalles-documento .close').click()">
                Cerrar
            </button>
        </div>
    `;
    
    // Agregar modal al DOM
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Configurar evento para cerrar
    const btnCerrar = modal.querySelector('.close');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }
    
    // Permitir cerrar con Escape
    document.addEventListener('keydown', function cerrarConEscape(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', cerrarConEscape);
        }
    });
    
    // Si el documento no está leído, marcarlo ahora
    if (!documento.leido && socket && socket.connected && documento.emisor.id !== usuarioInfo?.id) {
        socket.emit('informeLeido', { informeId: documento.id });
        
        // Actualizar visualmente
        const documentoElement = document.querySelector(`.informe[data-id="${documento.id}"]`);
        if (documentoElement) {
            documentoElement.classList.add('leido');
        }
        
        // Actualizar en memoria
        documento.leido = true;
        guardarInformesLocalmente();
    }
}

/**
 * Muestra el archivo adjunto de un documento
 * @param {string} documentoId - ID del documento
 */
function mostrarAdjuntoDocumento(documentoId) {
    // Buscar el documento en registros existentes
    let documentoData = buscarInformePorId(documentoId);
    
    // Si no se encontró o no tiene adjunto
    if (!documentoData || !documentoData.adjunto) {
        MAIRA.Utils.mostrarNotificacion("No se pudo acceder al archivo adjunto", "error");
        return;
    }
    
    // Mostrar el visor de adjuntos
    mostrarVisorAdjunto(documentoData);
}

/**
 * Muestra un visor para el archivo adjunto
 * @param {Object} documento - Documento con el adjunto
 */
function mostrarVisorAdjunto(documento) {
    if (!documento || !documento.adjunto) return;
    
    const adjunto = documento.adjunto;
    const tipoArchivo = adjunto.tipo || 'application/octet-stream';
    const tipoBase = tipoArchivo.split('/')[0];  // image, video, audio, etc.
    
    // Crear modal para visualizar el adjunto
    const modalVisor = document.createElement('div');
    modalVisor.className = 'modal-visor-adjunto';
    modalVisor.style.position = 'fixed';
    modalVisor.style.top = '0';
    modalVisor.style.left = '0';
    modalVisor.style.width = '100%';
    modalVisor.style.height = '100%';
    modalVisor.style.backgroundColor = 'rgba(0,0,0,0.85)';
    modalVisor.style.zIndex = '10000';
    modalVisor.style.display = 'flex';
    modalVisor.style.flexDirection = 'column';
    
    // Cabecera con información y botones
    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.padding = '15px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.backgroundColor = 'rgba(0,0,0,0.7)';
    header.style.color = 'white';
    
    // Nombre del archivo e información
    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.flexDirection = 'column';
    
    const nombreArchivo = document.createElement('h3');
    nombreArchivo.textContent = adjunto.nombre;
    nombreArchivo.style.margin = '0';
    nombreArchivo.style.padding = '0';
    nombreArchivo.style.fontSize = '18px';
    
    const infoArchivo = document.createElement('span');
    infoArchivo.textContent = `${tipoArchivo} · ${MAIRA.Utils.formatearTamaño ? MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0) : (Math.round(adjunto.tamaño / 1024) + ' KB')}`;
    infoArchivo.style.fontSize = '12px';
    infoArchivo.style.opacity = '0.8';

    infoContainer.appendChild(nombreArchivo);
    infoContainer.appendChild(infoArchivo);

    // Botones de acción
    const botones = document.createElement('div');

    // Botón para descargar
    const btnDescargar = document.createElement('button');
    btnDescargar.innerHTML = '<i class="fas fa-download"></i> Descargar';
    btnDescargar.style.marginRight = '10px';
    btnDescargar.style.padding = '8px 15px';
    btnDescargar.style.backgroundColor = '#4caf50';
    btnDescargar.style.color = 'white';
    btnDescargar.style.border = 'none';
    btnDescargar.style.borderRadius = '4px';
    btnDescargar.style.cursor = 'pointer';

    // Botón para cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '<i class="fas fa-times"></i>';
    btnCerrar.style.padding = '8px 15px';
    btnCerrar.style.backgroundColor = '#f44336';
    btnCerrar.style.color = 'white';
    btnCerrar.style.border = 'none';
    btnCerrar.style.borderRadius = '4px';
    btnCerrar.style.cursor = 'pointer';

    botones.appendChild(btnDescargar);
    botones.appendChild(btnCerrar);

    header.appendChild(infoContainer);
    header.appendChild(botones);

    // Contenedor principal para el contenido
    const contenedorPrincipal = document.createElement('div');
    contenedorPrincipal.style.flex = '1';
    contenedorPrincipal.style.display = 'flex';
    contenedorPrincipal.style.alignItems = 'center';
    contenedorPrincipal.style.justifyContent = 'center';
    contenedorPrincipal.style.overflow = 'auto';
    contenedorPrincipal.style.padding = '20px';

    // Contenido según tipo de archivo
    const contenido = document.createElement('div');
    contenido.style.maxWidth = '90%';
    contenido.style.maxHeight = 'calc(100% - 40px)';
    contenido.style.display = 'flex';
    contenido.style.flexDirection = 'column';
    contenido.style.alignItems = 'center';
    contenido.style.justifyContent = 'center';

    // Preparar contenido en base al tipo
    if (tipoBase === 'image') {
        // Es una imagen
        const imagen = document.createElement('img');
        imagen.src = adjunto.datos;
        imagen.style.maxWidth = '100%';
        imagen.style.maxHeight = 'calc(100vh - 120px)';
        imagen.style.objectFit = 'contain';
        imagen.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        
        // Añadir controles de zoom
        const controles = document.createElement('div');
        controles.style.marginTop = '10px';
        controles.style.display = 'flex';
        controles.style.gap = '10px';
        
        const btnZoomIn = document.createElement('button');
        btnZoomIn.innerHTML = '<i class="fas fa-search-plus"></i>';
        btnZoomIn.style.padding = '5px 10px';
        btnZoomIn.style.backgroundColor = '#555';
        btnZoomIn.style.color = 'white';
        btnZoomIn.style.border = 'none';
        btnZoomIn.style.borderRadius = '4px';
        
        const btnZoomOut = document.createElement('button');
        btnZoomOut.innerHTML = '<i class="fas fa-search-minus"></i>';
        btnZoomOut.style.padding = '5px 10px';
        btnZoomOut.style.backgroundColor = '#555';
        btnZoomOut.style.color = 'white';
        btnZoomOut.style.border = 'none';
        btnZoomOut.style.borderRadius = '4px';
        
        const btnRotate = document.createElement('button');
        btnRotate.innerHTML = '<i class="fas fa-redo"></i>';
        btnRotate.style.padding = '5px 10px';
        btnRotate.style.backgroundColor = '#555';
        btnRotate.style.color = 'white';
        btnRotate.style.border = 'none';
        btnRotate.style.borderRadius = '4px';
        
        controles.appendChild(btnZoomIn);
        controles.appendChild(btnZoomOut);
        controles.appendChild(btnRotate);
        
        // Variables para zoom y rotación
        let zoomLevel = 1;
        let rotation = 0;
        
        btnZoomIn.addEventListener('click', () => {
            zoomLevel = Math.min(zoomLevel + 0.25, 3);
            imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
        });
        
        btnZoomOut.addEventListener('click', () => {
            zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
            imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
        });
        
        btnRotate.addEventListener('click', () => {
            rotation = (rotation + 90) % 360;
            imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
        });
        
        contenido.appendChild(imagen);
        contenido.appendChild(controles);
    } else if (tipoBase === 'audio') {
        // Es audio
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = adjunto.datos;
        audio.style.width = '100%';
        audio.style.minWidth = '300px';
        
        // Añadir elemento de visualización de onda de audio
        const waveformContainer = document.createElement('div');
        waveformContainer.style.width = '100%';
        waveformContainer.style.height = '60px';
        waveformContainer.style.backgroundColor = '#f0f0f0';
        waveformContainer.style.borderRadius = '4px';
        waveformContainer.style.marginTop = '10px';
        
        contenido.appendChild(audio);
        contenido.appendChild(waveformContainer);
    } else if (tipoBase === 'video') {
        // Es video
        const video = document.createElement('video');
        video.controls = true;
        video.src = adjunto.datos;
        video.style.maxWidth = '100%';
        video.style.maxHeight = 'calc(100vh - 150px)';
        video.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        
        // Añadir controles personalizados si lo deseas
        const videoControles = document.createElement('div');
        videoControles.style.marginTop = '10px';
        videoControles.style.width = '100%';
        videoControles.style.display = 'flex';
        videoControles.style.justifyContent = 'center';
        videoControles.style.gap = '10px';
        
        contenido.appendChild(video);
        contenido.appendChild(videoControles);
        
        // Reproducir automáticamente
        setTimeout(() => {
            video.play().catch(err => {
                console.log("Reproducción automática bloqueada por el navegador:", err);
            });
        }, 100);
    } else {
        // Tipo no soportado para visualización directa
        const mensaje = document.createElement('div');
        mensaje.style.padding = '30px';
        mensaje.style.backgroundColor = 'white';
        mensaje.style.borderRadius = '8px';
        mensaje.style.textAlign = 'center';
        
        mensaje.innerHTML = `
            <i class="fas fa-file" style="font-size: 48px; color: #607d8b; margin-bottom: 20px;"></i>
            <h3>Tipo de archivo no soportado para visualización</h3>
            <p>Utilice el botón de descarga para guardar el archivo.</p>
            <p>Tipo: ${tipoArchivo}</p>
            <p>Tamaño: ${MAIRA.Utils.formatearTamaño ? MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0) : (Math.round(adjunto.tamaño / 1024) + ' KB')}</p>
        `;
        
        contenido.appendChild(mensaje);
    }

    contenedorPrincipal.appendChild(contenido);

    // Añadir elementos al modal
    modalVisor.appendChild(header);
    modalVisor.appendChild(contenedorPrincipal);

    // Añadir modal al body
    document.body.appendChild(modalVisor);

    // Configurar eventos
    btnCerrar.addEventListener('click', function() {
        if (document.body.contains(modalVisor)) {
            document.body.removeChild(modalVisor);
        }
    });

    btnDescargar.addEventListener('click', function() {
        descargarAdjunto(adjunto);
    });

    // Permitir cerrar con Escape
    document.addEventListener('keydown', function cerrarConEscape(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modalVisor)) {
                document.body.removeChild(modalVisor);
            }
            document.removeEventListener('keydown', cerrarConEscape);
        }
    });
    }

/**
 * Descarga un archivo adjunto
 * @param {Object} adjunto - Información del adjunto
 */
function descargarAdjunto(adjunto) {
    if (!adjunto || !adjunto.datos) {
        MAIRA.Utils.mostrarNotificacion("No se puede descargar el archivo", "error");
        return;
    }
    
    // Crear elemento de enlace temporal
    const enlace = document.createElement('a');
    enlace.href = adjunto.datos;
    enlace.download = adjunto.nombre || 'archivo_adjunto';
    
    // Añadir al DOM, simular clic y eliminar
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    
    MAIRA.Utils.mostrarNotificacion("Descarga iniciada", "success");
}

/**
 * Centra el mapa en la posición de un documento
 * @param {string} documentoId - ID del documento
 */
function centrarEnPosicionDocumento(documentoId) {
    // Buscar el documento
    const documento = buscarInformePorId(documentoId);
    if (!documento || !documento.posicion || !documento.posicion.lat || !documento.posicion.lng) {
        MAIRA.Utils.mostrarNotificacion("El documento no tiene coordenadas válidas", "error");
        return;
    }
    
    // Verificar que existe el mapa
    if (!window.mapa) {
        MAIRA.Utils.mostrarNotificacion("El mapa no está disponible", "error");
        return;
    }
    
    // Centrar mapa en la posición
    window.mapa.setView([documento.posicion.lat, documento.posicion.lng], 15);
    
    // Crear un marcador temporal
    const tempMarker = L.marker([documento.posicion.lat, documento.posicion.lng], {
        icon: L.divIcon({
            className: 'custom-div-icon documento-marker',
            html: '<div class="documento-marker-pin"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(window.mapa);
    
    // Añadir popup con información
    tempMarker.bindPopup(`
        <strong>${documento.categoriaDocumento === 'orden' ? 'Orden' : 'Informe'}: ${documento.asunto}</strong>
        <br>
        <small>De: ${documento.emisor.nombre}</small>
        <br>
        <small>Fecha: ${MAIRA.Utils.formatearFecha ? MAIRA.Utils.formatearFecha(documento.timestamp) : new Date(documento.timestamp).toLocaleString()}</small>
    `).openPopup();
    
    // Eliminar el marcador después de 60 segundos
    setTimeout(() => {
        if (window.mapa && window.mapa.hasLayer(tempMarker)) {
            window.mapa.removeLayer(tempMarker);
        }
    }, 60000);
    
    // Si hay un modal abierto, cerrarlo
    const modal = document.querySelector('.modal-detalles-documento');
    if (modal) {
        document.body.removeChild(modal);
    }
}   
    
    /**
     * Configura eventos para un informe recién agregado
     * @param {string} informeId - ID del informe
     */
    function configurarEventosInforme(informeId) {
        // Botón de ver ubicación
        const btnUbicacion = document.querySelector(`.informe[data-id="${informeId}"] .btn-ubicacion`);
        if (btnUbicacion) {
            btnUbicacion.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                
                if (isNaN(lat) || isNaN(lng)) {
                    MAIRA.Utils.mostrarNotificacion("Coordenadas inválidas", "error");
                    return;
                }
                
                if (window.mapa) {
                    window.mapa.setView([lat, lng], 15);
                    
                    // Crear un marcador temporal
                    const tempMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'custom-div-icon temp-marker',
                            html: '<div class="temp-marker-pin"></div>',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(window.mapa);
                    
                    // Añadir popup con información
                    tempMarker.bindPopup(`<strong>Ubicación del informe</strong><br>${document.querySelector(`.informe[data-id="${informeId}"] .informe-titulo strong`).textContent}`).openPopup();
                    
                    // Eliminar el marcador después de 30 segundos
                    setTimeout(() => {
                        if (window.mapa && window.mapa.hasLayer(tempMarker)) {
                            window.mapa.removeLayer(tempMarker);
                        }
                    }, 30000);
                }
            });
        }
        
        // Botón para marcar como leído
        const btnMarcarLeido = document.querySelector(`.informe[data-id="${informeId}"] .btn-marcar-leido`);
        if (btnMarcarLeido) {
            btnMarcarLeido.addEventListener('click', function() {
                if (socket && socket.connected) {
                    socket.emit('informeLeido', { informeId: informeId });
                    
                    // Marcar visualmente como leído
                    document.querySelector(`.informe[data-id="${informeId}"]`).classList.add('leido');
                    this.style.display = 'none'; // Ocultar botón
                }
            });
        }
        
        // Botón para responder
        const btnResponder = document.querySelector(`.informe[data-id="${informeId}"] .btn-responder`);
        if (btnResponder) {
            btnResponder.addEventListener('click', function() {
                prepararRespuestaInforme(informeId);
            });
        }
        
        // Enlace para ver adjunto
        const verAdjunto = document.querySelector(`.informe[data-id="${informeId}"] .ver-adjunto`);
        if (verAdjunto) {
            verAdjunto.addEventListener('click', function(e) {
                e.preventDefault();
                mostrarAdjuntoInforme(informeId);
            });
        }
    }
    
    /**
     * Prepara el formulario para responder a un informe
     * @param {string} informeId - ID del informe a responder
     */
    function prepararRespuestaInforme(informeId) {
        // Obtener informe original
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (!informeElement) return;
        
        // Obtener datos básicos
        const asuntoOriginal = informeElement.querySelector('.informe-titulo strong').textContent;
        const remitente = informeElement.querySelector('.informe-remitente').textContent.replace('De:', '').trim();
        
        // Cambiar a la pestaña de crear informe
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        if (btnCrearInforme) {
            btnCrearInforme.click();
        }
        
        // Preparar formulario de respuesta
        const tipoInforme = document.getElementById('tipo-informe');
        const asuntoInforme = document.getElementById('asunto-informe');
        const contenidoInforme = document.getElementById('contenido-informe');
        const destinatarioInforme = document.getElementById('destinatario-informe');
        
        if (tipoInforme && asuntoInforme && contenidoInforme && destinatarioInforme) {
            // Verificar si el informe original es de otro usuario para responder
            const esPropio = informeElement.classList.contains('propio');
            
            if (!esPropio) {
                // Si no es propio, responder al emisor original
                // Buscar el ID del emisor
                let emisorId = null;
                
                // Buscar en los informes recibidos
                if (informesRecibidos[informeId]) {
                    emisorId = informesRecibidos[informeId].emisor.id;
                } else {
                    // Buscar en los elementos conectados
                    if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
                        Object.entries(window.MAIRA.GestionBatalla.elementosConectados).forEach(([id, datos]) => {
                            if (datos.datos && datos.datos.usuario && datos.datos.usuario === remitente) {
                                emisorId = id;
                            }
                        });
                    }
                }
                
                if (emisorId) {
                    destinatarioInforme.value = emisorId;
                }
            }
            
            // Preparar asunto como respuesta
            if (!asuntoOriginal.startsWith('Re:')) {
                asuntoInforme.value = 'Re: ' + asuntoOriginal;
            } else {
                asuntoInforme.value = asuntoOriginal;
            }
            
            // Añadir cita del mensaje original
            const contenidoOriginal = informeElement.querySelector('.informe-contenido').innerHTML;
            contenidoInforme.value = '\n\n-------- Mensaje Original --------\n' + 
                contenidoOriginal.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
            
            // Enfocar al inicio para que el usuario escriba su respuesta
            contenidoInforme.setSelectionRange(0, 0);
            contenidoInforme.focus();
        }
    }
    

    /**
 * Muestra los detalles de un informe en un modal
 * @param {string} informeId - ID del informe
 */
function mostrarDetallesInforme(informeId) {
    // Buscar datos del informe
    const informe = buscarInformePorId(informeId);
    if (!informe) {
        MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el informe", "error");
        return;
    }
    
    // Crear modal para ver los detalles
    const modal = document.createElement('div');
    modal.className = 'modal-detalles-informe';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Contenido del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    modalContent.style.padding = '20px';
    modalContent.style.maxWidth = '800px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';
    
    // Determinar el título según el tipo
    let tipoTexto = "Informe";
    let claseHeader = "";
    
    if (informe.tipo === "urgente") {
        tipoTexto = "INFORME URGENTE";
        claseHeader = "text-danger";
    } else if (informe.tipo === "orden") {
        tipoTexto = "ORDEN";
        claseHeader = "text-warning";
    }
    
    // Formatear fecha
    const fecha = MAIRA.Utils.formatearFecha(informe.timestamp);
    
    // Información del emisor
    let infoEmisor = "";
    if (informe.emisor.elemento) {
        if (informe.emisor.elemento.designacion) {
            infoEmisor = informe.emisor.elemento.designacion;
            if (informe.emisor.elemento.dependencia) {
                infoEmisor += "/" + informe.emisor.elemento.dependencia;
            }
        }
    }
    
    // Información del destinatario
    let infoDestinatario = "";
    if (informe.destinatario === "todos") {
        infoDestinatario = "Todos los participantes";
    } else if (informe.destinatario === "comando") {
        infoDestinatario = "Comando/Central";
    } else if (typeof informe.destinatario === 'string') {
        // Buscar nombre del destinatario
        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            const elemento = window.MAIRA.GestionBatalla.elementosConectados[informe.destinatario];
            if (elemento && elemento.datos) {
                infoDestinatario = elemento.datos.usuario || "Desconocido";
                
                // Agregar info del elemento si disponible
                if (elemento.datos.elemento && elemento.datos.elemento.designacion) {
                    infoDestinatario += ` (${elemento.datos.elemento.designacion}`;
                    if (elemento.datos.elemento.dependencia) {
                        infoDestinatario += `/${elemento.datos.elemento.dependencia}`;
                    }
                    infoDestinatario += ")";
                }
            } else {
                infoDestinatario = "Usuario desconocido";
            }
        } else {
            infoDestinatario = "Destinatario específico";
        }
    }
    
    // Información de adjunto
    let adjuntoHTML = '';
    if (informe.tieneAdjunto && informe.adjunto) {
        const tipoArchivo = informe.adjunto.tipo || 'application/octet-stream';
        let iconoAdjunto = 'fa-file';
        
        // Determinar icono según tipo de archivo
        if (tipoArchivo.startsWith('image/')) {
            iconoAdjunto = 'fa-file-image';
        } else if (tipoArchivo.startsWith('audio/')) {
            iconoAdjunto = 'fa-file-audio';
        } else if (tipoArchivo.startsWith('video/')) {
            iconoAdjunto = 'fa-file-video';
        } else if (tipoArchivo.includes('pdf')) {
            iconoAdjunto = 'fa-file-pdf';
        } else if (tipoArchivo.includes('word') || tipoArchivo.includes('document')) {
            iconoAdjunto = 'fa-file-word';
        } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('sheet')) {
            iconoAdjunto = 'fa-file-excel';
        } else if (tipoArchivo.includes('zip') || tipoArchivo.includes('compressed')) {
            iconoAdjunto = 'fa-file-archive';
        }
        
        adjuntoHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0">Archivo Adjunto</h5>
                </div>
                <div class="card-body d-flex align-items-center">
                    <i class="fas ${iconoAdjunto} fa-2x mr-3"></i>
                    <div>
                        <div>${informe.adjunto.nombre}</div>
                        <div class="text-muted">${MAIRA.Utils.formatearTamaño(informe.adjunto.tamaño)}</div>
                    </div>
                    <button class="btn btn-primary ml-auto" onclick="MAIRA.Informes.mostrarAdjuntoInforme('${informe.id}')">
                        Ver Adjunto
                    </button>
                </div>
            </div>
        `;
    }
    
    // Información de posición
    let posicionHTML = '';
    if (informe.posicion && informe.posicion.lat && informe.posicion.lng) {
        posicionHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h5 class="mb-0">Ubicación</h5>
                </div>
                <div class="card-body">
                    <p>El informe incluye una ubicación geográfica.</p>
                    <button class="btn btn-info" onclick="MAIRA.Informes.centrarEnPosicionInforme('${informe.id}')">
                        <i class="fas fa-map-marker-alt"></i> Ver en el mapa
                    </button>
                </div>
            </div>
        `;
    }
    
    // HTML del modal
    modalContent.innerHTML = `
        <div class="modal-header ${claseHeader}">
            <h4>${tipoTexto}: ${informe.asunto}</h4>
            <button type="button" class="close" aria-label="Cerrar">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>De:</strong> ${informe.emisor.nombre} ${infoEmisor ? `(${infoEmisor})` : ''}
                </div>
                <div class="col-md-6">
                    <strong>Para:</strong> ${infoDestinatario}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Fecha:</strong> ${fecha}
                </div>
                <div class="col-md-6">
                    <strong>Estado:</strong> 
                    <span class="badge ${informe.leido ? 'badge-success' : 'badge-warning'}">
                        ${informe.leido ? 'Leído' : 'No leído'}
                    </span>
                    ${informe.importante ? '<span class="badge badge-warning ml-2">Importante</span>' : ''}
                    ${informe.archivado ? '<span class="badge badge-secondary ml-2">Archivado</span>' : ''}
                </div>
            </div>
            <div class="contenido-informe p-3 border rounded bg-light">
                ${informe.contenido.replace(/\n/g, '<br>')}
            </div>
            ${adjuntoHTML}
            ${posicionHTML}
        </div>
        <div class="modal-footer">
            <div class="btn-group mr-auto">
                <button class="btn btn-outline-secondary btn-sm" onclick="MAIRA.Informes.prepararRespuestaInforme('${informe.id}')">
                    <i class="fas fa-reply"></i> Responder
                </button>
                ${!informe.archivado ? `
                <button class="btn btn-outline-secondary btn-sm" onclick="MAIRA.Informes.archivarInforme('${informe.id}'); document.querySelector('.modal-detalles-informe .close').click()">
                    <i class="fas fa-archive"></i> Archivar
                </button>` : ''}
                <button class="btn btn-outline-${informe.importante ? 'warning' : 'secondary'} btn-sm" onclick="MAIRA.Informes.toggleImportanteInforme('${informe.id}')">
                    <i class="fas fa-star"></i> ${informe.importante ? 'Quitar importancia' : 'Marcar importante'}
                </button>
            </div>
            <button class="btn btn-primary" onclick="document.querySelector('.modal-detalles-informe .close').click()">
                Cerrar
            </button>
        </div>
    `;
    
    // Agregar modal al DOM
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Configurar evento para cerrar
    const btnCerrar = modal.querySelector('.close');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }
    
    // Permitir cerrar con Escape
    document.addEventListener('keydown', function cerrarConEscape(e) {
        if (e.key === 'Escape') {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', cerrarConEscape);
        }
    });
    
    // Si el informe no está leído, marcarlo ahora
    if (!informe.leido && socket && socket.connected && informe.emisor.id !== usuarioInfo?.id) {
        socket.emit('informeLeido', { informeId: informe.id });
        
        // Actualizar visualmente
        const informeElement = document.querySelector(`.informe[data-id="${informe.id}"]`);
        if (informeElement) {
            informeElement.classList.add('leido');
        }
        
        // Actualizar en memoria
        informe.leido = true;
        guardarInformesLocalmente();
    }
}
/**
 * Centra el mapa en la posición de un informe
 * @param {string} informeId - ID del informe
 */
function centrarEnPosicionInforme(informeId) {
    // Buscar el informe
    const informe = buscarInformePorId(informeId);
    if (!informe || !informe.posicion || !informe.posicion.lat || !informe.posicion.lng) {
        MAIRA.Utils.mostrarNotificacion("El informe no tiene coordenadas válidas", "error");
        return;
    }
    
    // Verificar que existe el mapa
    if (!window.mapa) {
        MAIRA.Utils.mostrarNotificacion("El mapa no está disponible", "error");
        return;
    }
    
    // Centrar mapa en la posición
    window.mapa.setView([informe.posicion.lat, informe.posicion.lng], 15);
    
    // Crear un marcador temporal
    const tempMarker = L.marker([informe.posicion.lat, informe.posicion.lng], {
        icon: L.divIcon({
            className: 'custom-div-icon informe-marker',
            html: '<div class="informe-marker-pin"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(window.mapa);
    
    // Añadir popup con información
    tempMarker.bindPopup(`
        <strong>Informe: ${informe.asunto}</strong>
        <br>
        <small>De: ${informe.emisor.nombre}</small>
        <br>
        <small>Fecha: ${MAIRA.Utils.formatearFecha(informe.timestamp)}</small>
    `).openPopup();
    
    // Eliminar el marcador después de 60 segundos
    setTimeout(() => {
        if (window.mapa && window.mapa.hasLayer(tempMarker)) {
            window.mapa.removeLayer(tempMarker);
        }
    }, 60000);
    
    // Si hay un modal abierto, cerrarlo
    const modal = document.querySelector('.modal-detalles-informe');
    if (modal) {
        document.body.removeChild(modal);
    }
}
    /**
     * Muestra el archivo adjunto de un informe
     * @param {string} informeId - ID del informe
     */
    function mostrarAdjuntoInforme(informeId) {
        // Buscar el informe en registros existentes
        let informeData = null;
        
        // Buscar en informes recibidos
        if (informesRecibidos[informeId]) {
            informeData = informesRecibidos[informeId];
        } 
        // Buscar en informes enviados
        else if (informesEnviados[informeId]) {
            informeData = informesEnviados[informeId];
        }
        
        // Si no se encuentra en memoria, buscar en el almacenamiento local
        if (!informeData) {
            // Intentar recuperar de localStorage si está disponible
            const informesGuardados = localStorage.getItem('gb_informes_recibidos');
            if (informesGuardados) {
                try {
                    const informes = JSON.parse(informesGuardados);
                    informeData = informes.find(inf => inf.id === informeId);
                } catch (error) {
                    console.error("Error al recuperar informes del almacenamiento local:", error);
                }
            }
        }
        
        // Si aún no se encontró, solicitar al servidor
        if (!informeData && socket && socket.connected) {
            // Mostrar cargando
            MAIRA.Utils.mostrarNotificacion("Obteniendo archivo adjunto...", "info");
            
            // Solicitar al servidor el informe completo
            socket.emit('obtenerInformeCompleto', { informeId: informeId }, function(respuesta) {
                if (respuesta && respuesta.informe) {
                    mostrarVisorAdjunto(respuesta.informe);
                } else {
                    MAIRA.Utils.mostrarNotificacion("No se pudo obtener el archivo adjunto", "error");
                }
            });
            return;
        }
        
        // Si no se encontró o no tiene adjunto
        if (!informeData || !informeData.adjunto) {
            MAIRA.Utils.mostrarNotificacion("No se pudo acceder al archivo adjunto", "error");
            return;
        }
        
        // Mostrar el visor de adjuntos
        mostrarVisorAdjunto(informeData);
    }
    
    /**
     * Muestra un visor para el archivo adjunto
     * @param {Object} informe - Informe con el adjunto
     */
    function mostrarVisorAdjunto(informe) {
        if (!informe || !informe.adjunto) return;
        
        const adjunto = informe.adjunto;
        const tipoArchivo = adjunto.tipo || 'application/octet-stream';
        const tipoBase = tipoArchivo.split('/')[0];  // image, video, audio, etc.
        
        // Crear modal para visualizar el adjunto
        const modalVisor = document.createElement('div');
        modalVisor.className = 'modal-visor-adjunto';
        modalVisor.style.position = 'fixed';
        modalVisor.style.top = '0';
        modalVisor.style.left = '0';
        modalVisor.style.width = '100%';
        modalVisor.style.height = '100%';
        modalVisor.style.backgroundColor = 'rgba(0,0,0,0.85)';
        modalVisor.style.zIndex = '10000';
        modalVisor.style.display = 'flex';
        modalVisor.style.flexDirection = 'column';
        
        // Cabecera con información y botones
        const header = document.createElement('div');
        header.style.width = '100%';
        header.style.padding = '15px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.backgroundColor = 'rgba(0,0,0,0.7)';
        header.style.color = 'white';
        
        // Nombre del archivo e información
        const infoContainer = document.createElement('div');
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        
        const nombreArchivo = document.createElement('h3');
        nombreArchivo.textContent = adjunto.nombre;
        nombreArchivo.style.margin = '0';
        nombreArchivo.style.padding = '0';
        nombreArchivo.style.fontSize = '18px';
        
        const infoArchivo = document.createElement('span');
        infoArchivo.textContent = `${tipoArchivo} · ${MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0)}`;
        infoArchivo.style.fontSize = '12px';
        infoArchivo.style.opacity = '0.8';
        
        infoContainer.appendChild(nombreArchivo);
        infoContainer.appendChild(infoArchivo);
        
        // Botones de acción
        const botones = document.createElement('div');
        
        // Botón para descargar
        const btnDescargar = document.createElement('button');
        btnDescargar.innerHTML = '<i class="fas fa-download"></i> Descargar';
        btnDescargar.style.marginRight = '10px';
        btnDescargar.style.padding = '8px 15px';
        btnDescargar.style.backgroundColor = '#4caf50';
        btnDescargar.style.color = 'white';
        btnDescargar.style.border = 'none';
        btnDescargar.style.borderRadius = '4px';
        btnDescargar.style.cursor = 'pointer';
        
        // Botón para cerrar
        const btnCerrar = document.createElement('button');
        btnCerrar.innerHTML = '<i class="fas fa-times"></i>';
        btnCerrar.style.padding = '8px 15px';
        btnCerrar.style.backgroundColor = '#f44336';
        btnCerrar.style.color = 'white';
        btnCerrar.style.border = 'none';
        btnCerrar.style.borderRadius = '4px';
        btnCerrar.style.cursor = 'pointer';
        
        botones.appendChild(btnDescargar);
        botones.appendChild(btnCerrar);
        
        header.appendChild(infoContainer);
        header.appendChild(botones);
        
        // Contenedor principal para el contenido
        const contenedorPrincipal = document.createElement('div');
        contenedorPrincipal.style.flex = '1';
        contenedorPrincipal.style.display = 'flex';
        contenedorPrincipal.style.alignItems = 'center';
        contenedorPrincipal.style.justifyContent = 'center';
        contenedorPrincipal.style.overflow = 'auto';
        contenedorPrincipal.style.padding = '20px';
        
        // Contenido según tipo de archivo
        const contenido = document.createElement('div');
        contenido.style.maxWidth = '90%';
        contenido.style.maxHeight = 'calc(100% - 40px)';
        contenido.style.display = 'flex';
        contenido.style.flexDirection = 'column';
        contenido.style.alignItems = 'center';
        contenido.style.justifyContent = 'center';
        
        // Preparar contenido en base al tipo
        if (tipoBase === 'image') {
            // Es una imagen
            const imagen = document.createElement('img');
            imagen.src = adjunto.datos;
            imagen.style.maxWidth = '100%';
            imagen.style.maxHeight = 'calc(100vh - 120px)';
            imagen.style.objectFit = 'contain';
            imagen.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            // Añadir controles de zoom
            const controles = document.createElement('div');
            controles.style.marginTop = '10px';
            controles.style.display = 'flex';
            controles.style.gap = '10px';
            
            const btnZoomIn = document.createElement('button');
            btnZoomIn.innerHTML = '<i class="fas fa-search-plus"></i>';
            btnZoomIn.style.padding = '5px 10px';
            btnZoomIn.style.backgroundColor = '#555';
            btnZoomIn.style.color = 'white';
            btnZoomIn.style.border = 'none';
            btnZoomIn.style.borderRadius = '4px';
            
            const btnZoomOut = document.createElement('button');
            btnZoomOut.innerHTML = '<i class="fas fa-search-minus"></i>';
            btnZoomOut.style.padding = '5px 10px';
            btnZoomOut.style.backgroundColor = '#555';
            btnZoomOut.style.color = 'white';
            btnZoomOut.style.border = 'none';
            btnZoomOut.style.borderRadius = '4px';
            
            const btnRotate = document.createElement('button');
            btnRotate.innerHTML = '<i class="fas fa-redo"></i>';
            btnRotate.style.padding = '5px 10px';
            btnRotate.style.backgroundColor = '#555';
            btnRotate.style.color = 'white';
            btnRotate.style.border = 'none';
            btnRotate.style.borderRadius = '4px';
            
            controles.appendChild(btnZoomIn);
            controles.appendChild(btnZoomOut);
            controles.appendChild(btnRotate);
            
            // Variables para zoom y rotación
            let zoomLevel = 1;
            let rotation = 0;
            
            btnZoomIn.addEventListener('click', () => {
                zoomLevel = Math.min(zoomLevel + 0.25, 3);
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            btnZoomOut.addEventListener('click', () => {
                zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            btnRotate.addEventListener('click', () => {
                rotation = (rotation + 90) % 360;
                imagen.style.transform = `scale(${zoomLevel}) rotate(${rotation}deg)`;
            });
            
            contenido.appendChild(imagen);
            contenido.appendChild(controles);
        } else if (tipoBase === 'audio') {
            // Es audio
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = adjunto.datos;
            audio.style.width = '100%';
            audio.style.minWidth = '300px';
            
            // Añadir elemento de visualización de onda de audio
            const waveformContainer = document.createElement('div');
            waveformContainer.style.width = '100%';
            waveformContainer.style.height = '60px';
            waveformContainer.style.backgroundColor = '#f0f0f0';
            waveformContainer.style.borderRadius = '4px';
            waveformContainer.style.marginTop = '10px';
            
            contenido.appendChild(audio);
            contenido.appendChild(waveformContainer);
        } else if (tipoBase === 'video') {
            // Es video
            const video = document.createElement('video');
            video.controls = true;
            video.src = adjunto.datos;
            video.style.maxWidth = '100%';
            video.style.maxHeight = 'calc(100vh - 150px)';
            video.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            // Añadir controles personalizados si lo deseas
            const videoControles = document.createElement('div');
            videoControles.style.marginTop = '10px';
            videoControles.style.width = '100%';
            videoControles.style.display = 'flex';
            videoControles.style.justifyContent = 'center';
            videoControles.style.gap = '10px';
            
            contenido.appendChild(video);
            contenido.appendChild(videoControles);
            
            // Reproducir automáticamente
            setTimeout(() => {
                video.play().catch(err => {
                    console.log("Reproducción automática bloqueada por el navegador:", err);
                });
            }, 100);
        } else {
            // Tipo no soportado para visualización directa
            const mensaje = document.createElement('div');
            mensaje.style.padding = '30px';
            mensaje.style.backgroundColor = 'white';
            mensaje.style.borderRadius = '8px';
            mensaje.style.textAlign = 'center';
            
            mensaje.innerHTML = `
                <i class="fas fa-file" style="font-size: 48px; color: #607d8b; margin-bottom: 20px;"></i>
                <h3>Tipo de archivo no soportado para visualización</h3>
                <p>Utilice el botón de descarga para guardar el archivo.</p>
                <p>Tipo: ${tipoArchivo}</p>
                <p>Tamaño: ${MAIRA.Utils.formatearTamaño(adjunto.tamaño || 0)}</p>
            `;
            
            contenido.appendChild(mensaje);
        }
        
        contenedorPrincipal.appendChild(contenido);
        
        // Añadir elementos al modal
        modalVisor.appendChild(header);
        modalVisor.appendChild(contenedorPrincipal);
        
        // Añadir modal al body
        document.body.appendChild(modalVisor);
        
        // Configurar eventos
        btnCerrar.addEventListener('click', function() {
            if (document.body.contains(modalVisor)) {
                document.body.removeChild(modalVisor);
            }
        });
        
        btnDescargar.addEventListener('click', function() {
            descargarAdjunto(adjunto);
        });
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                if (document.body.contains(modalVisor)) {
                    document.body.removeChild(modalVisor);
                }
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    

    /**
     * Muestra una previsualización del archivo adjunto seleccionado
     */
    function previewAdjunto() {
        const input = document.getElementById('adjunto-informe');
        const previewContainer = document.getElementById('preview-adjunto');
        
        if (!input || !previewContainer) return;
        
        // Limpiar previsualización anterior
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        
        if (!input.files || input.files.length === 0) return;
        
        const file = input.files[0];
        
        // Verificar tamaño máximo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            MAIRA.Utils.mostrarNotificacion("El archivo excede el tamaño máximo permitido (5MB)", "error");
            input.value = '';
            return;
        }
        
        // Mostrar previsualización según tipo de archivo
        if (file.type.startsWith('image/')) {
            // Previsualización de imagen
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <img src="${e.target.result}" style="max-width: 100%; max-height: 200px;">
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('audio/')) {
            // Previsualización de audio
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <audio controls style="width: 100%;">
                            <source src="${e.target.result}" type="${file.type}">
                            Tu navegador no soporta la reproducción de audio.
                        </audio>
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            // Previsualización de video
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <div style="text-align: center; margin-bottom: 10px;">
                        <video controls style="max-width: 100%; max-height: 200px;">
                            <source src="${e.target.result}" type="${file.type}">
                            Tu navegador no soporta la reproducción de video.
                        </video>
                        <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                        <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                `;
                previewContainer.style.display = 'block';
                
                // Configurar evento de eliminar
                document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                    input.value = '';
                    previewContainer.innerHTML = '';
                    previewContainer.style.display = 'none';
                });
            };
            reader.readAsDataURL(file);
        } else {
            // Cualquier otro tipo de archivo
            previewContainer.innerHTML = `
                <div style="text-align: center; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                    <i class="fas fa-file" style="font-size: 24px; color: #607d8b;"></i>
                    <div style="margin-top: 5px;">${file.name} (${MAIRA.Utils.formatearTamaño(file.size)})</div>
                    <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                        <i class="fas fa-trash"></i> Eliminarbutton>
                    </div>
                </div>
            `;
            previewContainer.style.display = 'block';
            
            // Configurar evento de eliminar
            document.getElementById('btn-eliminar-adjunto').addEventListener('click', function() {
                input.value = '';
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
            });
        }
    }
    
    /**
     * Captura una foto usando la cámara
     */
    function capturarFoto() {
        // Verificar soporte de getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta acceso a la cámara", "error");
            return;
        }
        
        // Crear elementos para la captura
        const modalCaptura = document.createElement('div');
        modalCaptura.className = 'modal-captura-multimedia';
        modalCaptura.style.position = 'fixed';
        modalCaptura.style.top = '0';
        modalCaptura.style.left = '0';
        modalCaptura.style.width = '100%';
        modalCaptura.style.height = '100%';
        modalCaptura.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalCaptura.style.zIndex = '10000';
        modalCaptura.style.display = 'flex';
        modalCaptura.style.flexDirection = 'column';
        modalCaptura.style.alignItems = 'center';
        modalCaptura.style.justifyContent = 'center';
        
        modalCaptura.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Capturar foto</h3>
            </div>
            <video id="camera-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay></video>
            <canvas id="photo-canvas" style="display: none;"></canvas>
            <div style="margin-top: 20px;">
                <button id="btn-capturar" class="btn btn-primary mx-2">
                    <i class="fas fa-camera"></i> Capturar
                </button>
                <button id="btn-cambiar-camara" class="btn btn-info mx-2">
                    <i class="fas fa-sync"></i> Cambiar cámara
                </button>
                <button id="btn-cancelar-captura" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
        
        document.body.appendChild(modalCaptura);
        
        // Variables para la captura
        let stream = null;
        let facingMode = 'environment'; // Comenzar con cámara trasera en móviles
        
        // Función para iniciar la cámara
        function iniciarCamara() {
            const constraints = {
                video: {
                    facingMode: facingMode
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    const video = document.getElementById('camera-preview');
                    video.srcObject = stream;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara: " + error.message, "error");
                    cerrarModalCaptura();
                });
        }
        
        // Función para cambiar de cámara
        function cambiarCamara() {
            if (stream) {
                // Detener stream actual
                stream.getTracks().forEach(track => track.stop());
                
                // Cambiar modo
                facingMode = facingMode === 'user' ? 'environment' : 'user';
                
                // Reiniciar cámara
                iniciarCamara();
            }
        }
        
        // Función para capturar foto
        function capturar() {
            const video = document.getElementById('camera-preview');
            const canvas = document.getElementById('photo-canvas');
            
            // Configurar canvas con dimensiones del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dibujar frame actual del video en el canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convertir a data URL (formato JPEG)
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Detener stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Cerrar modal
            cerrarModalCaptura();
            
            // Crear archivo desde dataURL
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `foto_${new Date().toISOString().replace(/:/g, '-')}.jpg`, { type: 'image/jpeg' });
                    
                    // Asignar al input de archivo y disparar evento change
                    const fileInput = document.getElementById('adjunto-informe');
                    
                    // Crear un DataTransfer para simular la selección de archivo
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                    
                    // Disparar evento change para actualizar la previsualización
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                })
                .catch(error => {
                    console.error("Error procesando la imagen:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al procesar la imagen", "error");
                });
        }
        
        // Función para cerrar el modal
        function cerrarModalCaptura() {
            // Detener stream si existe
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Eliminar modal
            if (document.body.contains(modalCaptura)) {
                document.body.removeChild(modalCaptura);
            }
        }
        
        // Configurar eventos
        iniciarCamara();
        
        document.getElementById('btn-capturar').addEventListener('click', capturar);
        document.getElementById('btn-cambiar-camara').addEventListener('click', cambiarCamara);
        document.getElementById('btn-cancelar-captura').addEventListener('click', cerrarModalCaptura);
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                cerrarModalCaptura();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    
    /**
     * Graba audio usando el micrófono
     */
    function grabarAudio() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de audio", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-audio';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar audio</h3>
            </div>
            <div id="visualizador-audio" style="width: 300px; height: 60px; background: #333; border-radius: 8px; margin-bottom: 15px;"></div>
            <div id="tiempo-grabacion" style="font-size: 24px; color: white; margin-bottom: 20px;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion" class="btn btn-primary mx-2">
                    <i class="fas fa-microphone"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-audio" style="margin-top: 20px; display: none;">
                <audio id="audio-preview" controls style="width: 300px;"></audio>
                <div style="margin-top: 10px;">
                    <button id="btn-guardar-audio" class="btn btn-success mx-2">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button id="btn-descartar-audio" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let audioURL = null;
        let audioBlob = null;
        let visualizerInterval = null;
        
        // Función para actualizar el visualizador de audio
        function actualizarVisualizador() {
            if (!stream) return;
            
            // Crear un analizador de audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Actualizar visualizador
            visualizerInterval = setInterval(() => {
                if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                    clearInterval(visualizerInterval);
                    return;
                }
                
                analyser.getByteFrequencyData(dataArray);
                
                // Calcular volumen promedio
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                
                // Actualizar visualizador
                const visualizer = document.getElementById('visualizador-audio');
                if (visualizer) {
                    // Crear representación visual de la onda de audio
                    let barHTML = '';
                    for (let i = 0; i < bufferLength; i++) {
                        const barHeight = Math.max(2, dataArray[i] / 2); // Escalar para que se vea bien
                        barHTML += `<div style="width: 2px; height: ${barHeight}px; background: #4CAF50; margin: 0 1px;"></div>`;
                    }
                    visualizer.innerHTML = `<div style="display: flex; align-items: flex-end; justify-content: center; height: 100%;">${barHTML}</div>`;
                }
            }, 100);
        }
        
        // Función para iniciar grabación
        function iniciarGrabacion() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(function(audioStream) {
                    stream = audioStream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'audio/webm',
                        'audio/ogg',
                        'audio/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de audio compatible", "error");
                        cerrarModalGrabacion();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        chunks.push(e.data);
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        audioBlob = new Blob(chunks, { type: tipoSeleccionado });
                        audioURL = URL.createObjectURL(audioBlob);
                        
                        const audioPreview = document.getElementById('audio-preview');
                        audioPreview.src = audioURL;
                        audioPreview.style.display = 'block';
                        
                        document.getElementById('reproductor-audio').style.display = 'block';
                        document.getElementById('visualizador-audio').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(100); // Guardar en fragmentos de 100ms
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempo, 1000);
                    
                    // Iniciar visualizador
                    actualizarVisualizador();
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion').disabled = true;
                    document.getElementById('btn-detener-grabacion').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo al micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder al micrófono: " + error.message, "error");
                    cerrarModalGrabacion();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 60 segundos
            if (duracion >= 60) {
                detenerGrabacion();
                MAIRA.Utils.mostrarNotificacion("Límite de 1 minuto alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion').disabled = false;
                document.getElementById('btn-detener-grabacion').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacion() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (visualizerInterval) {
                clearInterval(visualizerInterval);
            }
            
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para guardar el audio
        function guardarAudio() {
            // Convertir Blob a File
            const file = new File([audioBlob], `audio_${new Date().toISOString().replace(/:/g, '-')}.webm`, { type: audioBlob.type });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            if (!fileInput) {
                MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el campo de adjunto", "error");
                return;
            }
            
            try {
                // Crear un DataTransfer para simular la selección de archivo
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Disparar evento change para actualizar la previsualización
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                
                // Cerrar modal
                cerrarModalGrabacion();
                
                MAIRA.Utils.mostrarNotificacion("Audio grabado correctamente", "success");
            } catch (error) {
                console.error("Error al guardar audio:", error);
                MAIRA.Utils.mostrarNotificacion("Error al guardar el audio: " + error.message, "error");
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion').addEventListener('click', iniciarGrabacion);
        document.getElementById('btn-detener-grabacion').addEventListener('click', detenerGrabacion);
        document.getElementById('btn-cancelar-grabacion').addEventListener('click', cerrarModalGrabacion);
        document.getElementById('btn-guardar-audio').addEventListener('click', guardarAudio);
        document.getElementById('btn-descartar-audio').addEventListener('click', cerrarModalGrabacion);
    }
    
    /**
     * Graba video usando la cámara
     */
    function grabarVideo() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
            return;
        }
        
        // Crear elementos para la grabación
        const modalGrabacion = document.createElement('div');
        modalGrabacion.className = 'modal-grabacion-video';
        modalGrabacion.style.position = 'fixed';
        modalGrabacion.style.top = '0';
        modalGrabacion.style.left = '0';
        modalGrabacion.style.width = '100%';
        modalGrabacion.style.height = '100%';
        modalGrabacion.style.backgroundColor = 'rgba(0,0,0,0.9)';
        modalGrabacion.style.zIndex = '10000';
        modalGrabacion.style.display = 'flex';
        modalGrabacion.style.flexDirection = 'column';
        modalGrabacion.style.alignItems = 'center';
        modalGrabacion.style.justifyContent = 'center';
        
        modalGrabacion.innerHTML = `
            <div style="text-align: center; color: white; margin-bottom: 15px;">
                <h3>Grabar video</h3>
            </div>
            <video id="video-preview" style="max-width: 90%; max-height: 60vh; background: #000; border: 3px solid #fff;" autoplay muted></video>
            <div id="tiempo-grabacion-video" style="font-size: 24px; color: white; margin: 10px 0;">00:00</div>
            <div>
                <button id="btn-iniciar-grabacion-video" class="btn btn-primary mx-2">
                    <i class="fas fa-video"></i> Iniciar grabación
                </button>
                <button id="btn-detener-grabacion-video" class="btn btn-warning mx-2" disabled>
                    <i class="fas fa-stop"></i> Detener
                </button>
                <button id="btn-cancelar-grabacion-video" class="btn btn-danger mx-2">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <div id="reproductor-video" style="margin-top: 20px; display: none;">
                <video id="video-grabado" controls style="max-width: 300px; max-height: 200px;"></video>
                <div style="margin-top: 10px;">
                    <button id="btn-guardar-video" class="btn btn-success mx-2">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button id="btn-descartar-video" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalGrabacion);
        
        // Variables para la grabación
        let stream = null;
        let mediaRecorder = null;
        let chunks = [];
        let tiempoInicio = null;
        let timerInterval = null;
        let videoURL = null;
        let videoBlob = null;
        
        // Función para iniciar grabación
        function iniciarGrabacionVideo() {
            const constraints = {
                audio: true,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(videoStream) {
                    stream = videoStream;
                    
                    // Mostrar preview
                    const video = document.getElementById('video-preview');
                    video.srcObject = stream;
                    
                    // Crear MediaRecorder con mejor tipo de MIME
                    const tiposMIME = [
                        'video/webm;codecs=vp9,opus',
                        'video/webm;codecs=vp8,opus',
                        'video/webm',
                        'video/mp4'
                    ];
                    
                    let tipoSeleccionado = '';
                    for (const tipo of tiposMIME) {
                        if (MediaRecorder.isTypeSupported(tipo)) {
                            tipoSeleccionado = tipo;
                            break;
                        }
                    }
                    
                    if (!tipoSeleccionado) {
                        MAIRA.Utils.mostrarNotificacion("Tu navegador no soporta ningún formato de video compatible", "error");
                        cerrarModalGrabacionVideo();
                        return;
                    }
                    
                    mediaRecorder = new MediaRecorder(stream, { mimeType: tipoSeleccionado });
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        if (e.data.size > 0) {
                            chunks.push(e.data);
                        }
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        videoBlob = new Blob(chunks, { type: tipoSeleccionado });
                        videoURL = URL.createObjectURL(videoBlob);
                        
                        const videoGrabado = document.getElementById('video-grabado');
                        videoGrabado.src = videoURL;
                        videoGrabado.style.display = 'block';
                        
                        document.getElementById('reproductor-video').style.display = 'block';
                        document.getElementById('video-preview').style.display = 'none';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start(1000); // Guardar en fragmentos de 1 segundo
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempoVideo, 1000);
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion-video').disabled = true;
                    document.getElementById('btn-detener-grabacion-video').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara o micrófono:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
                    cerrarModalGrabacionVideo();
                });
        }
        
        // Función para actualizar el tiempo de grabación
        function actualizarTiempoVideo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion-video').textContent = `${minutos}:${segundos}`;
            
            // Limitar grabación a 30 segundos para evitar archivos demasiado grandes
            if (duracion >= 30) {
                detenerGrabacionVideo();
                MAIRA.Utils.mostrarNotificacion("Límite de 30 segundos alcanzado", "info");
            }
        }
        
        // Función para detener grabación
        function detenerGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                
                // Detener preview
                const video = document.getElementById('video-preview');
                video.pause();
                video.style.display = 'none';
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion-video').disabled = false;
                document.getElementById('btn-detener-grabacion-video').disabled = true;
            }
        }
        
        // Función para cerrar el modal de grabación
        function cerrarModalGrabacionVideo() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para guardar el video
        function guardarVideo() {
            // Verificar tamaño máximo (5MB)
            if (videoBlob.size > 5 * 1024 * 1024) {
                MAIRA.Utils.mostrarNotificacion("El video excede el tamaño máximo permitido de 5MB. La calidad será reducida.", "warning");
                
                // Comprimir video
                MAIRA.Utils.comprimirVideo(videoBlob).then(videoComprimido => {
                    procesarEnvioVideo(videoComprimido);
                }).catch(error => {
                    console.error("Error al comprimir video:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al comprimir el video. Intente una grabación más corta.", "error");
                });
            } else {
                procesarEnvioVideo(videoBlob);
            }
        }
        
        // Función auxiliar para procesar y guardar el video
        function procesarEnvioVideo(blob) {
            // Convertir Blob a File
            const file = new File([blob], `video_${new Date().toISOString().replace(/:/g, '-')}.webm`, { type: blob.type });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            if (!fileInput) {
                MAIRA.Utils.mostrarNotificacion("No se pudo encontrar el campo de adjunto", "error");
                return;
            }
            
            try {
                // Crear un DataTransfer para simular la selección de archivo
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                
                // Disparar evento change para actualizar la previsualización
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                
                // Cerrar modal
                cerrarModalGrabacionVideo();
                
                MAIRA.Utils.mostrarNotificacion("Video grabado correctamente", "success");
            } catch (error) {
                console.error("Error al guardar video:", error);
                MAIRA.Utils.mostrarNotificacion("Error al guardar el video: " + error.message, "error");
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
        document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
        document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);document.getElementById('btn-guardar-video').addEventListener('click', guardarVideo);
        document.getElementById('btn-descartar-video').addEventListener('click', cerrarModalGrabacionVideo);
    }
    
    /**
     * Mejora en el envío de informes
     */
    function enviarInforme() {
        console.log("Preparando envío de informe");
        
        // Obtener datos del formulario
        const tipoInforme = document.getElementById('tipo-informe');
        const destinatarioInforme = document.getElementById('destinatario-informe');
        const asuntoInforme = document.getElementById('asunto-informe');
        const contenidoInforme = document.getElementById('contenido-informe');
        const archivoAdjunto = document.getElementById('adjunto-informe');
        
        if (!tipoInforme || !destinatarioInforme || !asuntoInforme || !contenidoInforme) {
            MAIRA.Utils.mostrarNotificacion("Error al enviar informe: elementos del formulario no encontrados", "error");
            return;
        }
        
        const tipo = tipoInforme.value;
        const destinatario = destinatarioInforme.value;
        const asunto = asuntoInforme.value.trim();
        const contenido = contenidoInforme.value.trim();
        
        if (!asunto || !contenido) {
            MAIRA.Utils.mostrarNotificacion("Debes completar asunto y contenido del informe", "error");
            return;
        }
        
        if (!destinatario) {
            MAIRA.Utils.mostrarNotificacion("Debes seleccionar un destinatario para el informe", "error");
            return;
        }
        
        // Verificar si tenemos la información del usuario
        if (!usuarioInfo || !elementoTrabajo) {
            MAIRA.Chat.agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
            MAIRA.Utils.mostrarNotificacion("No se ha iniciado sesión correctamente", "error");
            return;
        }
        
        // Mostrar indicador de carga mientras se prepara el informe
        mostrarCargandoEnvio(true);
        
        // Crear ID único para el informe
        const informeId = MAIRA.Utils.generarId();
        
        // Crear objeto de informe básico
        const informe = {
            id: informeId,
            emisor: {
                id: usuarioInfo.id,
                nombre: usuarioInfo.usuario,
                elemento: elementoTrabajo
            },
            destinatario: destinatario,
            tipo: tipo,
            asunto: asunto,
            contenido: contenido,
            leido: false,
            posicion: ultimaPosicion ? { 
                lat: ultimaPosicion.lat, 
                lng: ultimaPosicion.lng,
                precision: ultimaPosicion.precision,
                rumbo: ultimaPosicion.rumbo || 0
            } : null,
            timestamp: new Date().toISOString(),
            operacion: operacionActual,
            tieneAdjunto: false,
            adjunto: null
        };
        
        // Verificar si hay archivo adjunto
        if (archivoAdjunto && archivoAdjunto.files && archivoAdjunto.files.length > 0) {
            const archivo = archivoAdjunto.files[0];
            
            // Verificar tamaño máximo (5MB)
            if (archivo.size > 5 * 1024 * 1024) {
                MAIRA.Utils.mostrarNotificacion("El archivo adjunto excede el tamaño máximo permitido (5MB)", "error");
                mostrarCargandoEnvio(false);
                return;
            }
            
            // Procesar archivo
            procesarArchivoAdjunto(informe, archivo)
                .then(informeConAdjunto => {
                    finalizarEnvioInforme(informeConAdjunto);
                })
                .catch(error => {
                    console.error("Error al procesar archivo adjunto:", error);
                    MAIRA.Utils.mostrarNotificacion("Error al procesar archivo adjunto: " + error.message, "error");
                    mostrarCargandoEnvio(false);
                });
        } else {
            // No hay archivo adjunto, continuar directamente
            finalizarEnvioInforme(informe);
            // Cerrar el modal de informe
            cerrarModalNuevoInforme();
        }
    }
    
    // Verificar que esta función existe, si no, crearla:
function cerrarModalNuevoInforme() {
    const modalInforme = document.getElementById('modal-nuevo-informe');
    if (modalInforme) {
        // Ocultar modal
        modalInforme.style.display = 'none';
        
        // Limpiar campos
        const inputAsunto = document.getElementById('informe-asunto');
        const inputContenido = document.getElementById('informe-contenido');
        
        if (inputAsunto) inputAsunto.value = '';
        if (inputContenido) inputContenido.value = '';
        
        // Limpiar adjuntos si hay
        const contenedorAdjuntos = document.getElementById('informe-adjuntos-preview');
        if (contenedorAdjuntos) contenedorAdjuntos.innerHTML = '';
    }
}

    /**
     * Procesa un archivo adjunto para un informe
     * @param {Object} informe - Informe al que se adjuntará el archivo
     * @param {File} archivo - Archivo a adjuntar
     * @returns {Promise<Object>} Promesa que resuelve al informe con el archivo adjunto
     */
    function procesarArchivoAdjunto(informe, archivo) {
        return new Promise((resolve, reject) => {
            try {
                // Crear un FileReader para leer el archivo como Data URL
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        // Datos del archivo en formato Data URL
                        const datosArchivo = e.target.result;
                        
                        // Crear objeto adjunto con información del archivo
                        const adjunto = {
                            nombre: archivo.name,
                            tipo: archivo.type,
                            tamaño: archivo.size,
                            datos: datosArchivo,
                            timestamp: new Date().toISOString()
                        };
                        
                        // Actualizar informe con información del adjunto
                        informe.tieneAdjunto = true;
                        informe.adjunto = adjunto;
                        
                        // Resolver con el informe actualizado
                        resolve(informe);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error("Error al leer el archivo"));
                };
                
                // Leer el archivo como Data URL
                reader.readAsDataURL(archivo);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Finaliza el envío del informe
     * @param {Object} informe - Informe a enviar
     */
    function finalizarEnvioInforme(informe) {
        console.log("Finalizando envío de informe:", informe);
        
        // Enviar al servidor si estamos conectados
        if (socket && socket.connected) {
            // Emitir evento con timeout para manejar errores de envío
            let timeoutId = setTimeout(() => {
                MAIRA.Utils.mostrarNotificacion("Tiempo de espera agotado al enviar el informe. Guardado localmente.", "warning");
                
                // Guardar en memoria
                informesEnviados[informe.id] = informe;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Agregar a la interfaz
                agregarInforme(informe);
                
                // Ocultar cargando
                mostrarCargandoEnvio(false);
            }, 10000); // 10 segundos de timeout
            
            socket.emit('nuevoInforme', informe, function(respuesta) {
                // Limpiar timeout ya que recibimos respuesta
                clearTimeout(timeoutId);
                
                console.log("Respuesta del servidor al enviar informe:", respuesta);
                mostrarCargandoEnvio(false);
                
                if (respuesta && respuesta.error) {
                    MAIRA.Utils.mostrarNotificacion("Error al enviar informe: " + respuesta.error, "error");
                    
                    // Guardar en memoria
                    informesEnviados[informe.id] = informe;
                    
                    // Guardar en localStorage
                    guardarInformesLocalmente();
                    
                    // Agregar a la interfaz
                    agregarInforme(informe);
                    
                    return;
                }
                
                // Guardar en memoria
                informesEnviados[informe.id] = informe;
                
                // Guardar en localStorage
                guardarInformesLocalmente();
                
                // Añadir a la interfaz
                agregarInforme(informe);
                
                // Notificar envío exitoso
                const tipoTexto = informe.tipo === "urgente" ? "URGENTE" : 
                                  (informe.tipo === "orden" ? "ORDEN" : "Informe");
                
                MAIRA.Chat.agregarMensajeChat("Sistema", `${tipoTexto} "${informe.asunto}" enviado correctamente`, "sistema");
                MAIRA.Utils.mostrarNotificacion(`${tipoTexto} "${informe.asunto}" enviado correctamente`, "success");
                
                // Limpiar formulario
                limpiarFormularioInforme();
            });
        } else {
            // No hay conexión, guardar localmente
            
            // Guardar en memoria
            informesEnviados[informe.id] = informe;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
            
            // Añadir a la interfaz local
            agregarInforme(informe);
            
            // Notificar guardado para envío posterior
            if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
                MAIRA.Chat.agregarMensajeChat("Sistema", `Nuevo informe de ${emisor.nombre || emisor}`, "sistema");
            } else {
                console.log(`Nuevo informe de ${emisor.nombre || emisor}`);
            }
            MAIRA.Utils.mostrarNotificacion(`Informe guardado para envío posterior`, "info");
            
            // Limpiar formulario
            limpiarFormularioInforme();
            mostrarCargandoEnvio(false);
        }
    }
    
    /**
     * Guarda los informes en localStorage
     */
    function guardarInformesLocalmente() {
        // Guardar informes enviados
        try {
            localStorage.setItem('gb_informes_enviados', JSON.stringify(Object.values(informesEnviados)));
            console.log(`Guardados ${Object.keys(informesEnviados).length} informes enviados en localStorage`);
        } catch (error) {
            console.error("Error al guardar informes enviados en localStorage:", error);
        }
        
        // Guardar informes recibidos
        try {
            localStorage.setItem('gb_informes_recibidos', JSON.stringify(Object.values(informesRecibidos)));
            console.log(`Guardados ${Object.keys(informesRecibidos).length} informes recibidos en localStorage`);
        } catch (error) {
            console.error("Error al guardar informes recibidos en localStorage:", error);
        }
    }
    
    /**
     * Limpia el formulario de informes
     */
    function limpiarFormularioInforme() {
        const formInforme = document.getElementById('form-informe');
        if (formInforme) {
            formInforme.reset();
        }
        
        // Si hay previsualizaciones de adjuntos, limpiarlas
        const previewAdjunto = document.getElementById('preview-adjunto');
        if (previewAdjunto) {
            previewAdjunto.innerHTML = '';
            previewAdjunto.style.display = 'none';
        }
        
        // Volver a la vista de informes
        const btnVerInformes = document.getElementById('btn-ver-informes');
        if (btnVerInformes) {
            btnVerInformes.click();
        }
    }
    

    /**
     * Actualiza el selector de destinatarios para informes
     */
    function actualizarSelectorDestinatariosInforme() {
        const destinatarioSelect = document.getElementById('destinatario-informe');
        if (!destinatarioSelect) {
            console.error("Selector de destinatario no encontrado");
            return;
        }
        
        console.log("Actualizando lista de destinatarios para informes");
        
        // Guardar opción seleccionada actualmente si existe
        const destinatarioActual = destinatarioSelect.value;
        
        // Limpiar opciones actuales
        destinatarioSelect.innerHTML = '';
        
        // Opción predeterminada
        const optionDefault = document.createElement('option');
        optionDefault.value = "";
        optionDefault.textContent = "Seleccionar destinatario...";
        destinatarioSelect.appendChild(optionDefault);
        
        // Opción para todos (broadcast)
        const optionTodos = document.createElement('option');
        optionTodos.value = "todos";
        optionTodos.textContent = "Todos los participantes";
        destinatarioSelect.appendChild(optionTodos);
        
        // Agregar opción para Comando/Central
        const optionComando = document.createElement('option');
        optionComando.value = "comando";
        optionComando.textContent = "Comando/Central";
        destinatarioSelect.appendChild(optionComando);
        
        // Separador visual
        const optionSeparator = document.createElement('option');
        optionSeparator.disabled = true;
        optionSeparator.textContent = "───────────────";
        destinatarioSelect.appendChild(optionSeparator);
        
        // Contador de elementos añadidos
        let elementosAgregados = 0;
        
        // Añadir opciones para cada elemento conectado
        // Usar los elementos de GestionBatalla si están disponibles
        if (window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) {
            Object.entries(window.MAIRA.GestionBatalla.elementosConectados).forEach(([id, datos]) => {
                // No incluir al usuario actual en la lista
                if (id !== usuarioInfo?.id) {
                    const elemento = datos.datos;
                    if (elemento && elemento.usuario) {
                        const option = document.createElement('option');
                        option.value = id;
                        
                        // Texto informativo con usuario y elemento
                        let textoElemento = "";
                        if (elemento.elemento) {
                            if (elemento.elemento.designacion) {
                                textoElemento = elemento.elemento.designacion;
                                if (elemento.elemento.dependencia) {
                                    textoElemento += "/" + elemento.elemento.dependencia;
                                }
                            }
                        }
                        
                        option.textContent = elemento.usuario + (textoElemento ? ` (${textoElemento})` : '');
                        destinatarioSelect.appendChild(option);
                        elementosAgregados++;
                    }
                }
            });
        }
        
        // Restaurar selección previa si es posible
        if (destinatarioActual && destinatarioSelect.querySelector(`option[value="${destinatarioActual}"]`)) {
            destinatarioSelect.value = destinatarioActual;
        }
        
        // Log informativo
        console.log(`Lista de destinatarios de informes actualizada con ${elementosAgregados} participantes disponibles`);
        
        return elementosAgregados;
    }
    

/**
 * Recibe un informe
 * @param {Object} informe - Informe recibido
 */
function recibirInforme(informe) {
    if (!informe) {
        console.warn("Informe vacío recibido");
        return;
    }
    
    console.log("Procesando informe recibido:", informe);
    
    // Verificar si ya tenemos este informe
    if (informesRecibidos[informe.id]) {
        console.log("Informe ya recibido anteriormente:", informe.id);
        return;
    }
    
    // Guardar en memoria
    informesRecibidos[informe.id] = informe;
    
    // Guardar en localStorage
    guardarInformesLocalmente();
    
    // Añadir a la interfaz
    agregarInforme(informe);
    
    // Notificar llegada de informe
    let tipoTexto = "";
    let tipoNotificacion = "info";
    
    switch (informe.tipo) {
        case "urgente":
            tipoTexto = "INFORME URGENTE";
            tipoNotificacion = "error";
            break;
        case "orden":
            tipoTexto = "ORDEN";
            tipoNotificacion = "warning";
            break;
        default:
            tipoTexto = "Informe";
            tipoNotificacion = "info";
    }
    
    // Reproducir sonido según el tipo de informe
    try {
        let rutaSonido = '/Client/audio/notification.mp3'; // Sonido por defecto
        
        if (informe.tipo === "urgente") {
            rutaSonido = '/Client/audio/alert_urgente.mp3';
        } else if (informe.tipo === "orden") {
            rutaSonido = '/Client/audio/alert_orden.mp3';
        }
        
        const audio = new Audio(rutaSonido);
        audio.play().catch(err => {
            console.log("Error al reproducir sonido, intentando con sonido genérico", err);
            // Sonido genérico como fallback
            const audioGenerico = new Audio('/Client/audio/notification.mp3');
            audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
        });
    } catch (e) {
        console.warn("Error al reproducir sonido:", e);
    }
    
    // Mostrar notificación
    MAIRA.Utils.mostrarNotificacion(
        `${tipoTexto} de ${informe.emisor.nombre}: ${informe.asunto}`, 
        tipoNotificacion,
        10000 // Duración más larga para informes importantes
    );
    
    // Añadir mensaje al chat - CORREGIDO: Usar MAIRA.Chat en lugar de MAIRA.Utils
    if (MAIRA.Chat && typeof MAIRA.Chat.agregarMensajeChat === 'function') {
        MAIRA.Chat.agregarMensajeChat(
            "Sistema", 
            `Nuevo ${tipoTexto.toLowerCase()} recibido de ${informe.emisor.nombre}: "${informe.asunto}"`, 
            "sistema"
        );
    } else {
        console.warn("No se pudo agregar mensaje al chat - MAIRA.Chat.agregarMensajeChat no disponible");
    }
    
    // Si es urgente o una orden, mostrar notificación especial
    if (informe.tipo === "urgente" || informe.tipo === "orden") {
        // Verificar si estamos en la pestaña de informes
        const tabInformes = document.getElementById('tab-informes');
        if (tabInformes && !tabInformes.classList.contains('active')) {
            mostrarNotificacionInformeImportante(informe);
        }
    }
    
    // Marcar como leído si estamos en la pestaña de informes
    const tabInformes = document.getElementById('tab-informes');
    if (tabInformes && tabInformes.classList.contains('active') && socket && socket.connected) {
        setTimeout(() => {
            socket.emit('informeLeido', { informeId: informe.id });
        }, 3000);
    }
}
    
    /**
     * Muestra una notificación especial para informes importantes
     * @param {Object} informe - Informe recibido
     */
function mostrarNotificacionInformeImportante(informe) {
        // Crear notificación flotante
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-informe-importante';
        notificacion.style.position = 'fixed';
        notificacion.style.bottom = '20px';
        notificacion.style.right = '20px';
        notificacion.style.backgroundColor = informe.tipo === 'urgente' ? '#f44336' : '#ff9800';
        notificacion.style.color = 'white';
        notificacion.style.padding = '15px';
        notificacion.style.borderRadius = '8px';
        notificacion.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notificacion.style.zIndex = '10000';
        
        // Icono según tipo
        const icono = informe.tipo === 'urgente' ? 'fa-exclamation-triangle' : 'fa-clipboard-list';
        
        notificacion.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 8px;">
                <i class="fas ${icono}"></i> 
                ${informe.tipo === 'urgente' ? 'INFORME URGENTE' : 'ORDEN'} recibido
            </div>
            <div style="margin-bottom: 10px;">
                De: ${informe.emisor.nombre} - "${informe.asunto}"
            </div>
            <button id="btn-ir-informes" style="background-color: white; color: #333; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Ver informes
            </button>
        `;
        
        document.body.appendChild(notificacion);
        
        document.getElementById('btn-ir-informes').addEventListener('click', function() {
            // Cambiar a pestaña de informes
            const btnTabInformes = document.querySelector('.tab-btn[data-tab="tab-informes"]');
            if (btnTabInformes) {
                btnTabInformes.click();
            }
            
            // Marcar como leído
            if (socket && socket.connected) {
                socket.emit('informeLeido', { informeId: informe.id });
            }
            
            // Eliminar notificación
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        });
        
        // Auto ocultar después de 15 segundos para informes urgentes
        const tiempoOcultar = informe.tipo === 'urgente' ? 15000 : 10000;
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, tiempoOcultar);
    }
    
    /**
     * Marca un informe como leído
     * @param {string} informeId - ID del informe a marcar
     */
    function marcarInformeLeido(informeId) {
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.classList.add('leido');
            
            // Ocultar botón de marcar como leído si existe
            const btnMarcarLeido = informeElement.querySelector('.btn-marcar-leido');
            if (btnMarcarLeido) {
                btnMarcarLeido.style.display = 'none';
            }
        }
        
        // Actualizar en memoria si tenemos el informe
        if (informesRecibidos[informeId]) {
            informesRecibidos[informeId].leido = true;
            
            // Guardar en localStorage
            guardarInformesLocalmente();
        }
    }
    
    /**
     * Exporta los informes a un archivo
     * @param {string} formato - Formato de exportación ('txt', 'json', 'html')
     */
    function exportarInformes(formato = 'html') {
        const listaInformes = document.querySelectorAll('.informe');
        if (!listaInformes.length) {
            MAIRA.Utils.mostrarNotificacion("No hay informes para exportar", "warning");
            return;
        }
        
        // Aplicar filtro actual
        const informesFiltrados = Array.from(listaInformes).filter(informe => {
            if (filtroActual === 'todos') {
                return true;
            } else if (filtroActual === 'informes') {
                return informe.getAttribute('data-tipo') !== 'orden';
            } else if (filtroActual === 'ordenes') {
                return informe.getAttribute('data-tipo') === 'orden';
            }
            return true;
        });
        
        if (!informesFiltrados.length) {
            MAIRA.Utils.mostrarNotificacion("No hay informes que cumplan con el filtro actual", "warning");
            return;
        }
        
        let contenido = '';
        let nombreArchivo = `informes_${operacionActual}_${new Date().toISOString().slice(0, 10)}.${formato}`;
        let tipoMIME = 'text/plain';
        
        switch (formato) {
            case 'txt':
                contenido = `=== INFORMES - OPERACIÓN ${operacionActual.toUpperCase()} ===\n`;
                contenido += `Fecha de exportación: ${new Date().toLocaleString()}\n\n`;
                
                informesFiltrados.forEach(informe => {
                    const tipo = informe.getAttribute('data-tipo');
                    const tipoTexto = tipo === 'urgente' ? 'URGENTE' : (tipo === 'orden' ? 'ORDEN' : 'Normal');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenidoInforme = informe.querySelector('.informe-contenido').textContent;
                    
                    contenido += `====================\n`;
                    contenido += `TIPO: ${tipoTexto}\n`;
                    contenido += `ASUNTO: ${asunto}\n`;
                    contenido += `FECHA: ${fecha}\n`;
                    contenido += `${remitente}\n\n`;
                    contenido += `${contenidoInforme}\n\n`;
                });
                break;
                
            case 'json':
                const informesJSON = informesFiltrados.map(informe => {
                    const id = informe.getAttribute('data-id');
                    const tipo = informe.getAttribute('data-tipo');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenido = informe.querySelector('.informe-contenido').textContent;
                    const leido = informe.classList.contains('leido');
                    
                    // Verificar si hay datos completos en memoria
                    let datosCompletos = null;
                    if (informesRecibidos[id]) {
                        datosCompletos = informesRecibidos[id];
                    } else if (informesEnviados[id]) {
                        datosCompletos = informesEnviados[id];
                    }
                    
                    if (datosCompletos) {
                        return datosCompletos;
                    } else {
                        // Datos básicos extraídos del DOM
                        return {
                            id,
                            tipo,
                            asunto,
                            fecha,
                            remitente,
                            contenido,
                            leido
                        };
                    }
                });
                
                contenido = JSON.stringify(informesJSON, null, 2);
                tipoMIME = 'application/json';
                break;
                
            case 'html':
            default:
                contenido = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informes - Operación ${operacionActual}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .informe { border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; padding: 15px; }
        .informe-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .informe-urgente { border-left: 5px solid #f44336; }
        .informe-orden { border-left: 5px solid #ff9800; }
        .informe-normal { border-left: 5px solid #2196F3; }
        .fecha { color: #666; font-size: 0.9em; }
        .remitente { font-style: italic; margin-bottom: 10px; }
        .contenido { white-space: pre-line; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Informes - Operación ${operacionActual}</h1>
        <p>Fecha de exportación: ${new Date().toLocaleString()}</p>
    </div>
    <div class="informes">`;
                
                informesFiltrados.forEach(informe => {
                    const id = informe.getAttribute('data-id');
                    const tipo = informe.getAttribute('data-tipo');
                    const tipoTexto = tipo === 'urgente' ? 'URGENTE' : (tipo === 'orden' ? 'ORDEN' : 'Normal');
                    const tipoClase = tipo === 'urgente' ? 'informe-urgente' : (tipo === 'orden' ? 'informe-orden' : 'informe-normal');
                    const asunto = informe.querySelector('.informe-titulo strong').textContent;
                    const fecha = informe.querySelector('.informe-titulo small').textContent;
                    const remitente = informe.querySelector('.informe-remitente').textContent;
                    const contenidoInforme = informe.querySelector('.informe-contenido').textContent;
                    
                    contenido += `
        <div class="informe ${tipoClase}" id="informe-${id}">
            <div class="informe-header">
                <h2>${asunto}</h2>
                <span class="tipo">${tipoTexto}</span>
            </div>
            <div class="fecha">${fecha}</div>
            <div class="remitente">${remitente}</div>
            <div class="contenido">${contenidoInforme}</div>
        </div>`;
                });
                
                contenido += `
    </div>
</body>
</html>`;
                tipoMIME = 'text/html';
                break;
        }
        
        // Crear y descargar el archivo
        const blob = new Blob([contenido], { type: tipoMIME });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        MAIRA.Utils.mostrarNotificacion(`Informes exportados a ${formato.toUpperCase()}`, "success");
    }
    
    /**
     * Verifica si hay informes pendientes de enviar cuando se recupera la conexión
     */
    function enviarInformesPendientes() {
        if (!socket || !socket.connected) {
            console.warn("No se pueden enviar informes pendientes: sin conexión");
            return;
        }
        
        // Buscar informes pendientes (los que tienen id pero no se han confirmado por el servidor)
        const informesPendientes = Object.values(informesEnviados).filter(informe => {
            return informe.pendiente === true;
        });
        
        if (informesPendientes.length === 0) {
            console.log("No hay informes pendientes de envío");
            return;
        }
        
        console.log(`Enviando ${informesPendientes.length} informes pendientes`);
        
        // Enviar cada informe
        informesPendientes.forEach(informe => {
            socket.emit('nuevoInforme', informe, function(respuesta) {
                if (respuesta && respuesta.error) {
                    console.error("Error al enviar informe pendiente:", respuesta.error);
                } else {
                    // Marcar como enviado (no pendiente)
                    if (informesEnviados[informe.id]) {
                        informesEnviados[informe.id].pendiente = false;
                        
                        // Actualizar en localStorage
                        guardarInformesLocalmente();
                    }
                    
                    console.log(`Informe pendiente enviado correctamente: ${informe.id}`);
                }
            });
        });
        
        MAIRA.Utils.mostrarNotificacion(`Enviando ${informesPendientes.length} informes pendientes`, "info");
    }
    
    /**
     * Elimina un informe de la lista y de la memoria
     * @param {string} informeId - ID del informe a eliminar
     */
    function eliminarInforme(informeId) {
        // Eliminar de la lista
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.remove();
        }
        
        // Eliminar de la memoria
        if (informesRecibidos[informeId]) {
            delete informesRecibidos[informeId];
        }
        
        if (informesEnviados[informeId]) {
            delete informesEnviados[informeId];
        }
        
        // Actualizar en localStorage
        guardarInformesLocalmente();
        
        console.log(`Informe ${informeId} eliminado`);
    }
    
    /**
     * Limpia todos los informes
     * @param {string} tipo - Tipo de informes a limpiar ('todos', 'recibidos', 'enviados')
     */
    function limpiarInformes(tipo = 'todos') {
        // Limpiar interfaz según filtro y tipo
        const informes = document.querySelectorAll('.informe');
        
        informes.forEach(informe => {
            const id = informe.getAttribute('data-id');
            const esPropio = informe.classList.contains('propio');
            
            if (tipo === 'todos' || 
                (tipo === 'recibidos' && !esPropio) || 
                (tipo === 'enviados' && esPropio)) {
                
                informe.remove();
                
                // Eliminar de la memoria
                if (esPropio && informesEnviados[id]) {
                    delete informesEnviados[id];
                } else if (!esPropio && informesRecibidos[id]) {
                    delete informesRecibidos[id];
                }
            }
        });
        
        // Actualizar en localStorage
        guardarInformesLocalmente();
        
        console.log(`Informes ${tipo} limpiados`);
        MAIRA.Utils.mostrarNotificacion(`Informes ${tipo} limpiados`, "success");
    }
    
    /**
     * Busca un informe por su ID
     * @param {string} informeId - ID del informe a buscar
     * @returns {Object|null} - Informe encontrado o null
     */
    function buscarInformePorId(informeId) {
        // Buscar en informes recibidos
        if (informesRecibidos[informeId]) {
            return informesRecibidos[informeId];
        }
        
        // Buscar en informes enviados
        if (informesEnviados[informeId]) {
            return informesEnviados[informeId];
        }
        
        return null;
    }
    
    /**
     * Obtiene todos los informes
     * @param {string} tipo - Tipo de informes ('todos', 'recibidos', 'enviados')
     * @param {string} filtroTipo - Filtro por tipo de informe ('todos', 'informes', 'ordenes')
     * @returns {Array} - Array de informes
     */
    function obtenerInformes(tipo = 'todos', filtroTipo = 'todos') {
        let resultado = [];
        
        // Recolectar según tipo
        if (tipo === 'todos' || tipo === 'recibidos') {
            resultado = resultado.concat(Object.values(informesRecibidos));
        }
        
        if (tipo === 'todos' || tipo === 'enviados') {
            resultado = resultado.concat(Object.values(informesEnviados));
        }
        
        // Filtrar por tipo de informe
        if (filtroTipo !== 'todos') {
            if (filtroTipo === 'informes') {
                resultado = resultado.filter(inf => inf.tipo !== 'orden');
            } else if (filtroTipo === 'ordenes') {
                resultado = resultado.filter(inf => inf.tipo === 'orden');
            }
        }
        
        // Ordenar por fecha (más recientes primero)
        resultado.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return resultado;
    }
    
    /**
     * Obtiene estadísticas sobre los informes
     * @returns {Object} - Estadísticas de informes
     */
    function obtenerEstadisticasInformes() {
        const recibidos = Object.values(informesRecibidos);
        const enviados = Object.values(informesEnviados);
        
        const estadisticas = {
            total: recibidos.length + enviados.length,
            recibidos: {
                total: recibidos.length,
                leidos: recibidos.filter(inf => inf.leido).length,
                noLeidos: recibidos.filter(inf => !inf.leido).length,
                normales: recibidos.filter(inf => inf.tipo !== 'urgente' && inf.tipo !== 'orden').length,
                urgentes: recibidos.filter(inf => inf.tipo === 'urgente').length,
                ordenes: recibidos.filter(inf => inf.tipo === 'orden').length
            },
            enviados: {
                total: enviados.length,
                normales: enviados.filter(inf => inf.tipo !== 'urgente' && inf.tipo !== 'orden').length,
                urgentes: enviados.filter(inf => inf.tipo === 'urgente').length,
                ordenes: enviados.filter(inf => inf.tipo === 'orden').length,
                pendientes: enviados.filter(inf => inf.pendiente).length
            }
        };
        
        return estadisticas;
    }
    

return {
    // Funciones principales
    inicializar: inicializar,
    configurarEventosSocket: configurarEventosSocket,
    
    // ✅ EXPORTAR FUNCIÓN PRINCIPAL:
    enviarDocumento: enviarDocumento, // ESTA ES LA FUNCIÓN QUE FALTA
    enviarInforme: enviarDocumento, // Alias para compatibilidad
    
    // Funciones de gestión de documentos
    crearEstructuraTabDocumentos: crearEstructuraTabDocumentos,
    inicializarInterfazDocumentos: inicializarInterfazDocumentos,
    verificarEventosInformes: verificarEventosInformes,
    actualizarListaInformes: actualizarListaInformes,
    
    // Funciones de gestión
    agregarInforme: agregarInforme,
    marcarInformeLeido: marcarInformeLeido,
    eliminarInforme: eliminarInforme,
    limpiarInformes: limpiarInformes,
    enviarInformesPendientes: enviarInformesPendientes,
    mostrarCargandoEnvio: mostrarCargandoEnvio,
    
    // Funciones de interfaz
    mostrarDetallesDocumento: mostrarDetallesDocumento,
    centrarEnPosicionDocumento: centrarEnPosicionDocumento,
    prepararRespuestaDocumento: prepararRespuestaDocumento,
    archivarDocumento: archivarDocumento,
    toggleImportanteDocumento: toggleImportanteDocumento,
    
    // Utilidades
    actualizarSelectorDestinatariosInforme: actualizarSelectorDestinatariosInforme,
    filtrarInformes: filtrarInformes,
    exportarInformes: exportarInformes,
    
    // Funciones de búsqueda y consulta
    buscarInformes: buscarInformes,
    buscarInformePorId: buscarInformePorId,
    obtenerInformes: obtenerInformes,
    obtenerEstadisticasInformes: obtenerEstadisticasInformes
};

console.log('✅ informesGB.js exportado correctamente');
})();

// Registrar como módulo global
window.MAIRA.Informes = window.MAIRA.Informes || MAIRA.Informes;

// ✅ AGREGAR al final del archivo:

// ===== EXPORTAR PARA COMPATIBILIDAD =====
window.MAIRA = window.MAIRA || {};
window.MAIRA.Informes = window.MAIRA.Informes || MAIRA.Informes;

// Funciones globales para compatibilidad
window.enviarInforme = function() {
    if (MAIRA.Informes?.enviarInforme) {
        return MAIRA.Informes.enviarInforme();
    }
    console.warn('⚠️ MAIRA.Informes no disponible');
};

window.recibirInforme = function(informe) {
    if (MAIRA.Informes?.recibirInforme) {
        return MAIRA.Informes.recibirInforme(informe);
    }
    console.warn('⚠️ MAIRA.Informes no disponible');
};

window.agregarInforme = function(informe) {
    if (MAIRA.Informes?.agregarInforme) {
        return MAIRA.Informes.agregarInforme(informe);
    }
    console.warn('⚠️ MAIRA.Informes no disponible');
};

console.log('✅ informesGB.js exportado correctamente');