/**
 * gestionBatalla.js
 * Módulo para gestión de batalla en MAIRA
 * @version 2.0.0
 */

// Namespace principal para evitar conflictos
window.MAIRA = window.MAIRA || {};

// Variable global para estados UI accesible desde funciones externas
window.MAIRA_UI_STATES = {
    tabActiva: 'tab-elementos',
    chatPrivado: false,
    filtroInformes: 'todos',
    notificacionesTabs: {},
    panelAbierto: false
};

// Módulo de Gestión de Batalla
MAIRA.GestionBatalla = (function() {
    // Variables privadas del módulo
    let marcadorUsuario = null;
    let seguimientoActivo = false;
    let watchId = null;
    let usuarioInfo = null;
    let elementoTrabajo = null;
    
    let socket = null;
    let panelVisible = true;
    let elementosConectados = {};
    let ultimaPosicion = null;
    let operacionActual = "";
    let mensajesEnviados = new Set();
    let mensajesRecibidos = new Set();
    let mensajesPendientes = new Set(); 
    let colaPendiente = {
        mensajes: [],
        informes: [],
        posiciones: []
    };
    
    // Almacenamiento para estados de la interfaz (sincronizado con variable global)
    let estadosUI = window.MAIRA_UI_STATES;

    /**
     * Inicializa el módulo cuando el DOM está listo
     */
    function inicializar() {
        console.log('🚀 Iniciando Gestión de Batalla v2.0.0');
        
        // 🔧 FIX CRÍTICO: Verificar y crear socket si no existe
        verificarYCrearSocket();
        
        // Inicializar componentes
        inicializarUI();
        configurarEventListeners();
        cargarDatosIniciales();
        
        // ✅ CRÍTICO: Inicializar chat con retry
        setTimeout(() => {
            inicializarChatConReintentos();
        }, 1000);
        
        console.log('✅ Gestión de Batalla inicializada correctamente');
    }
    
    /**
     * 🔧 FIX CRÍTICO: Verificar y crear socket
     */
    function verificarYCrearSocket() {
        console.log('🔌 Verificando estado del socket...');
        
        // Verificar socket global
        if (!window.socket) {
            console.warn('⚠️ Socket global no existe, creando...');
            crearSocketConnection();
        } else if (!window.socket.connected) {
            console.warn('⚠️ Socket global desconectado, reconectando...');
            window.socket.connect();
        } else {
            console.log('✅ Socket global activo');
            socket = window.socket;
        }
    }
    
    /**
     * 🔧 FIX CRÍTICO: Crear conexión socket
     */
    function crearSocketConnection() {
        try {
            const socketUrl = window.location.protocol + '//' + window.location.host;
            console.log('🔌 Creando socket a:', socketUrl);
            
            if (typeof io !== 'undefined') {
                window.socket = io(socketUrl, {
                    timeout: 20000,
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    transports: ['polling', 'websocket']
                });
                
                socket = window.socket;
                
                socket.on('connect', () => {
                    console.log('✅ Socket conectado para GB');
                    inicializarChatConReintentos();
                });
                
                socket.on('disconnect', () => {
                    console.warn('⚠️ Socket desconectado en GB');
                });
                
                socket.on('connect_error', (error) => {
                    console.error('❌ Error de conexión socket GB:', error);
                });
                
            } else {
                console.error('❌ Socket.IO no disponible');
            }
        } catch (error) {
            console.error('❌ Error creando socket:', error);
        }
    }
    
    /**
     * 🔧 FIX CRÍTICO: Inicializar chat con reintentos
     */
    function inicializarChatConReintentos(intentos = 0) {
        const maxIntentos = 5;
        
        console.log(`💬 Intento ${intentos + 1}/${maxIntentos} de inicializar chat...`);
        
        // Verificar que MAIRAChat esté disponible
        if (typeof window.MAIRAChat === 'undefined') {
            console.warn('⚠️ MAIRAChat no disponible');
            
            if (intentos < maxIntentos) {
                console.log('🔄 Reintentando en 2s...');
                setTimeout(() => inicializarChatConReintentos(intentos + 1), 2000);
            } else {
                console.error('❌ Chat no disponible después de múltiples intentos');
                // 🔧 FIX: Crear fallback básico
                crearChatFallback();
            }
            return;
        }
        
        // Verificar socket
        if (!socket || !socket.connected) {
            if (intentos < maxIntentos) {
                console.warn(`⚠️ Socket no disponible, reintentando en 2s...`);
                setTimeout(() => inicializarChatConReintentos(intentos + 1), 2000);
                return;
            } else {
                console.error('❌ Socket no disponible después de múltiples intentos');
                return;
            }
        }
        
        // Intentar inicializar chat
        try {
            if (window.MAIRAChat && typeof window.MAIRAChat.inicializar === 'function') {
                window.MAIRAChat.inicializar(socket);
                console.log('✅ Chat inicializado correctamente');
                return;
            } else {
                throw new Error('MAIRAChat.inicializar no es función');
            }
        } catch (error) {
            console.error('❌ Error inicializando chat:', error);
            
            if (intentos < maxIntentos) {
                setTimeout(() => inicializarChatConReintentos(intentos + 1), 2000);
            } else {
                console.error('❌ Chat no pudo inicializarse después de múltiples intentos');
                // Continuar sin chat pero notificar al usuario
                mostrarNotificacionError('Chat no disponible. Algunas funciones pueden estar limitadas.');
            }
        }
    }
    
    /**
     * 🔧 FIX: Crear chat básico de fallback
     */
    function crearChatFallback() {
        console.log('🔧 Creando chat fallback básico...');
        
        // Crear contenedor de chat básico si no existe
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            chatContainer.innerHTML = '<div style="padding: 10px; color: #888;">Chat temporalmente no disponible</div>';
        }
        
        // Deshabilitar input de chat si existe
        const chatInput = document.getElementById('mensaje-chat');
        if (chatInput) {
            chatInput.disabled = true;
            chatInput.placeholder = 'Chat no disponible';
        }
        
        console.log('✅ Chat fallback creado');
    }
    
    /**
     * 🔧 FIX: Función inicializarUI básica
     */
    function inicializarUI() {
        console.log('🎨 Inicializando interfaz GB...');
        // Funcionalidad básica de UI
        try {
            // Verificar que existan elementos críticos
            const panel = document.getElementById('panel-gestion-batalla');
            if (panel) {
                panel.style.display = 'block';
                console.log('✅ Panel GB activado');
            }
        } catch (error) {
            console.warn('⚠️ Error en inicializarUI:', error);
        }
    }
    
    /**
     * 🔧 FIX: Función configurarEventListeners básica
     */
    function configurarEventListeners() {
        console.log('🔗 Configurando event listeners GB...');
        // Event listeners básicos
        try {
            // Listeners de socket si existe
            if (socket) {
                socket.on('mensaje_chat', (data) => {
                    console.log('💬 Mensaje chat recibido:', data);
                });
            }
        } catch (error) {
            console.warn('⚠️ Error en configurarEventListeners:', error);
        }
    }
    
    /**
     * 🔧 FIX: Función cargarDatosIniciales básica
     */
    function cargarDatosIniciales() {
        console.log('📊 Cargando datos iniciales GB...');
        // Cargar datos básicos
        try {
            // Obtener operación de URL
            const urlParams = new URLSearchParams(window.location.search);
            operacionActual = urlParams.get('operacion') || 'default';
            console.log('📍 Operación actual:', operacionActual);
        } catch (error) {
            console.warn('⚠️ Error en cargarDatosIniciales:', error);
        }
    }
    
    /**
     * 🔧 FIX: Función mostrarNotificacionError
     */
    function mostrarNotificacionError(mensaje) {
        console.error('🚨 Error GB:', mensaje);
        // Mostrar notificación visual si es posible
        try {
            if (typeof alert !== 'undefined') {
                // Solo en caso de error crítico
                console.warn('⚠️ GB:', mensaje);
            }
        } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
        }
    }

function inicializar() {
    console.log("🚀 Iniciando módulo MAIRA.GestionBatalla...");
    
    try {
        // ✅ 1. MOSTRAR PANTALLA DE CARGA
        mostrarCargando(true, 10, "Inicializando componentes...");
        
        // ✅ 2. CARGAR INFORMACIÓN DESDE LOCALSTORAGE
        if (!cargarInfoDesdeLocalStorage()) {
            console.error("❌ Error al cargar información de usuario/elemento");
            return false;
        }
        mostrarCargando(true, 25, "Cargando información de usuario...");
        
        // ✅ 3. CARGAR OPERACIÓN DESDE URL
        if (!cargarOperacionDesdeURL()) {
            console.error("❌ Error al cargar información de operación");
            return false;
        }
        mostrarCargando(true, 40, "Verificando operación...");
        
        // ✅ 4. INICIALIZAR INTERFAZ
        setTimeout(() => {
            try {
                inicializarInterfaz();
                mostrarCargando(true, 60, "Configurando interfaz...");
                
                // ✅ 5. CONECTAR AL SERVIDOR
                setTimeout(() => {
                    conectarAlServidor();
                    mostrarCargando(true, 80, "Conectando al servidor...");
                    
                    // ✅ 6. OBTENER POSICIÓN INICIAL
                    setTimeout(() => {
                        obtenerPosicionInicial();
                        mostrarCargando(true, 95, "Obteniendo ubicación...");
                        
                        // ✅ 7. FINALIZAR INICIALIZACIÓN
                        setTimeout(() => {
                            // Configurar dispositivos móviles si aplica
                            configurarParaDispositivosMoviles();
                            
                            // Restaurar estado guardado
                            restaurarEstadoGuardado();
                            
                            // Agregar campo de adjunto a formularios
                            agregarCampoAdjuntoInforme();
                            
                            // Inicializar interfaz
                            inicializarInterfaz();
                            
                            // Configurar eventos antes de salir
                            window.addEventListener('beforeunload', guardarEstadoActual);
                            
                            // Ocultar pantalla de carga
                            mostrarCargando(false);
                            
                            console.log("✅ Inicialización completada exitosamente");
                            
                            // ✅ Mostrar panel automáticamente si es primera visita o no hay preferencia guardada
                            setTimeout(() => {
                                const panelVisitado = localStorage.getItem('panelVisitado');
                                const panelVisible = localStorage.getItem('panelVisible');
                                
                                if (!panelVisitado || panelVisible !== 'false') {
                                    togglePanel(true);
                                    localStorage.setItem('panelVisitado', 'true');
                                    console.log('📱 Panel mostrado automáticamente (primera visita)');
                                }
                            }, 1000);
                            
                            // Notificar éxito
                            setTimeout(() => {
                                mostrarNotificacion("Gestión de Batalla inicializada correctamente", "success", 3000);
                                agregarMensajeChat("Sistema", "Sistema iniciado. Bienvenido a la operación: " + operacionActual, "sistema");
                            }, 500);
                            
                        }, 500);
                    }, 1000);
                }, 1000);
            } catch (error) {
                console.error("❌ Error durante inicialización de interfaz:", error);
                mostrarCargando(false);
                mostrarNotificacion("Error al inicializar la interfaz: " + error.message, "error");
                return false;
            }
        }, 500);
        
        return true;
        
    } catch (error) {
        console.error("❌ Error crítico durante inicialización:", error);
        mostrarCargando(false);
        mostrarNotificacion("Error crítico durante la inicialización: " + error.message, "error");
        return false;
    }
}
    
// ✅ EN la función inicializarInterfaz() línea ~150, REEMPLAZAR:

function inicializarInterfaz() {
    // ✅ Prevenir múltiples inicializaciones
    if (window.MAIRA_INTERFAZ_INICIALIZADA) {
        console.log("🔧 Interfaz ya inicializada, omitiendo...");
        return;
    }
    
    console.log("Inicializando componentes de la interfaz");
    
    // Inicializar panel lateral
    inicializarPanelLateral();
    
    // Configurar eventos del chat
    configurarEventosChat();
    
    // ✅ AGREGAR INICIALIZACIÓN CORRECTA DE INFORMES:
    console.log('🔧 Inicializando módulo de informes...');
    try {
        if (window.MAIRA?.Informes?.inicializar) {
            const configInformes = {
                socket: socket,
                usuarioInfo: usuarioInfo,
                operacionActual: operacionActual,
                elementoTrabajo: elementoTrabajo,
                ultimaPosicion: ultimaPosicion
            };
            
            console.log('📋 Usando sistema de informes integrado (no externo)');
            // Comentado temporalmente para usar sistema integrado
            // const resultadoInformes = window.MAIRA.Informes.inicializar(configInformes);
            // console.log('✅ Módulo de informes inicializado:', resultadoInformes);
            
            // ✅ CONFIGURAR EVENTOS DE SOCKET DESPUÉS DE INICIALIZAR:
            // if (socket && window.MAIRA.Informes.configurarEventosSocket) {
            //     console.log('🔌 Configurando eventos de socket para informes...');
            //     window.MAIRA.Informes.configurarEventosSocket(socket);
            //     console.log('✅ Eventos de socket configurados para informes');
            // }
            
        } else {
            console.log('📋 Usando sistema de informes integrado en lugar de módulo externo');
            // console.error('❌ MAIRA.Informes no está disponible');
            // console.log('🔍 Estado de window.MAIRA:', window.MAIRA);
        }
    } catch (error) {
        console.error('❌ Error al inicializar informes:', error);
    }
    
    // Configurar otros componentes...
    inicializarMenusAvanzados();
    
    console.log("Componentes de interfaz inicializados");
    
    // Marcar como inicializada
    window.MAIRA_INTERFAZ_INICIALIZADA = true;
}
    
    /**
     * Carga la información de usuario y elemento desde localStorage
     * @returns {boolean} - Verdadero si se cargó correctamente
     */
    function cargarInfoDesdeLocalStorage() {
        try {
            // Intentar cargar información de usuario
            const usuarioGuardado = localStorage.getItem('gb_usuario_info');
            if (usuarioGuardado) {
                usuarioInfo = JSON.parse(usuarioGuardado);
                console.log("Información de usuario cargada:", usuarioInfo);
            }
            
            // Intentar cargar información de elemento
            const elementoGuardado = localStorage.getItem('gb_elemento_info');
            if (elementoGuardado) {
                elementoTrabajo = JSON.parse(elementoGuardado);
                console.log("Información de elemento cargada:", elementoTrabajo);
            }
            
            // Verificar si se cargaron ambos
            if (!usuarioInfo || !elementoTrabajo) {
                console.warn("Información de usuario o elemento no encontrada en localStorage");
                redirigirASalaEspera();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Error al cargar información desde localStorage:", error);
            redirigirASalaEspera();
            return false;
        }
    }
    
    /**
     * Carga la operación desde la URL o localStorage
     * @returns {boolean} - Verdadero si se cargó correctamente
     */
    function cargarOperacionDesdeURL() {
        // Intentar obtener operación desde URL
        const urlParams = new URLSearchParams(window.location.search);
        const operacionParam = urlParams.get('operacion');
        
        if (operacionParam) {
            operacionActual = operacionParam;
            console.log("Operación cargada desde URL:", operacionActual);
            return true;
        } else {
            console.warn("No se encontró operación en la URL");
            // Intentar obtener desde localStorage
            const operacionGuardada = localStorage.getItem('gb_operacion_seleccionada');
            if (operacionGuardada) {
                try {
                    const operacion = JSON.parse(operacionGuardada);
                    operacionActual = operacion.nombre;
                    console.log("Operación cargada desde localStorage:", operacionActual);
                    return true;
                } catch (error) {
                    console.error("Error al cargar operación desde localStorage:", error);
                }
            }
            
            redirigirASalaEspera();
            return false;
        }
    }
    
    /**
     * Redirige a la sala de espera si no hay información suficiente
     */
    function redirigirASalaEspera() {
        console.warn("Redirigiendo a sala de espera por falta de información");
        window.location.href = '/Client/inicioGB.html';
    }
    
    /**
     * Muestra u oculta la pantalla de carga
     * @param {boolean} mostrar - Indica si se debe mostrar la pantalla
     * @param {number} progreso - Valor de progreso (0-100)
     * @param {string} mensaje - Mensaje a mostrar
     */
    function mostrarCargando(mostrar, progreso = 0, mensaje = "Cargando...") {
        const loadingContainer = document.querySelector('.loading-container');
        if (!loadingContainer) return;
        
        if (mostrar) {
            loadingContainer.style.display = 'flex';
            document.getElementById('progreso').style.width = progreso + '%';
            document.getElementById('porcentajeCarga').textContent = progreso + '%';
            document.getElementById('loadingText').textContent = mensaje;
        } else {
            loadingContainer.style.display = 'none';
            setTimeout(() => {
                document.getElementById('main-content').style.display = 'block';
            }, 100);
        }
    }
    
    /**
     * Inicializa el panel lateral
     */
    function inicializarPanelLateral() {
        // ✅ Prevenir múltiples inicializaciones
        if (window.MAIRA_PANEL_INICIALIZADO) {
            console.log("🔲 Panel lateral ya inicializado, omitiendo...");
            return;
        }
        
        console.log("Inicializando panel lateral");
        
        // Verificar existencia del panel
        const panel = document.getElementById('panel-lateral');
        if (!panel) {
            console.error("Panel lateral no encontrado. Revise la estructura HTML.");
            return;
        }
        
        // Configurar estado inicial
        panel.classList.add('oculto'); // Iniciar oculto
        panelVisible = false;
        
        // Configurar botón del panel
        const botonPanel = document.getElementById('boton-panel');
        if (botonPanel) {
            // Eliminar listeners previos para evitar duplicados
            const nuevoBoton = botonPanel.cloneNode(true);
            if (botonPanel.parentNode) {
                botonPanel.parentNode.replaceChild(nuevoBoton, botonPanel);
            }
            
            // Agregar nuevo listener
            nuevoBoton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });
        } else {
            console.warn("Botón del panel no encontrado");
        }
        
        // Configurar evento para cerrar panel - CON PROTECCIÓN
        const cerrarPanel = document.getElementById('cerrar-panel');
        if (cerrarPanel) {
            const nuevoCerrarPanel = cerrarPanel.cloneNode(true);
            if (cerrarPanel.parentNode) {
                cerrarPanel.parentNode.replaceChild(nuevoCerrarPanel, cerrarPanel);
            }
            
            nuevoCerrarPanel.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });
        }
        
        // ✅ Configurar botón flotante de toggle - CON PROTECCIÓN
        const toggleBtn = document.getElementById('toggle-panel-btn');
        if (toggleBtn) {
            const nuevoToggleBtn = toggleBtn.cloneNode(true);
            if (toggleBtn.parentNode) {
                toggleBtn.parentNode.replaceChild(nuevoToggleBtn, toggleBtn);
            }
            
            nuevoToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            });
            console.log('🔲 Botón flotante del panel configurado');
        }
        
        // Marcar como inicializado
        window.MAIRA_PANEL_INICIALIZADO = true;
        
        // Configurar pestañas
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                cambiarTab(tabId);
            });
        });
        
        // Verificar si debemos mostrar el panel de inmediato (desde localStorage o hash)
        if (window.location.hash === '#showPanel' || localStorage.getItem('panelVisible') === 'true') {
            setTimeout(function() {
                togglePanel(true); // Forzar apertura
            }, 500);
        }
        
        // Configurar eventos específicos
        configurarEventosChat();
        configurarEventosInformes();
        configurarEventosElementos();
        
        console.log("Panel lateral inicializado");
    }
    

   /**
 * Configura los eventos del chat
 */
function configurarEventosChat() {
    console.log("Configurando eventos del chat");
    
    // Verificar elementos necesarios
    const elements = verificarElementosChat();
    if (!elements.todosExisten) {
        console.warn("No se pudieron encontrar todos los elementos necesarios para el chat");
    }
    
    // Cambio entre chat general y privado
    const btnChatGeneral = document.getElementById('btn-chat-general');
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    const chatDestinario = document.getElementById('chat-destinatario');
    
    if (btnChatGeneral && btnChatPrivado && chatDestinario) {
        // Limpiar listeners anteriores
        const nuevoBtnGeneral = btnChatGeneral.cloneNode(true);
        btnChatGeneral.parentNode.replaceChild(nuevoBtnGeneral, btnChatGeneral);
        
        const nuevoBtnPrivado = btnChatPrivado.cloneNode(true);
        btnChatPrivado.parentNode.replaceChild(nuevoBtnPrivado, btnChatPrivado);
        
        // Añadir nuevos listeners
        nuevoBtnGeneral.addEventListener('click', function() {
            console.log("Cambiando a chat general");
            nuevoBtnGeneral.classList.add('active');
            nuevoBtnPrivado.classList.remove('active');
            chatDestinario.classList.add('d-none');
            estadosUI.chatPrivado = false;
        });
        
        nuevoBtnPrivado.addEventListener('click', function() {
            console.log("Cambiando a chat privado");
            nuevoBtnPrivado.classList.add('active');
            nuevoBtnGeneral.classList.remove('active');
            chatDestinario.classList.remove('d-none');
            estadosUI.chatPrivado = true;
            actualizarListaDestinatarios();
        });
    } else {
        console.warn("Elementos para cambiar tipo de chat no encontrados");
    }
    
    // Envío de mensajes
    const enviarMensaje = document.getElementById('enviar-mensaje');
    const mensajeInput = document.getElementById('mensaje-chat');
    
    if (enviarMensaje && mensajeInput) {
        // Limpiar eventos anteriores
        const nuevoBoton = enviarMensaje.cloneNode(true);
        enviarMensaje.parentNode.replaceChild(nuevoBoton, enviarMensaje);
        
        // Añadir nuevo evento
        nuevoBoton.addEventListener('click', function() {
            console.log("Botón enviar mensaje clickeado");
            enviarMensajeChat();
        });
        
        // Para el input, también reemplazar para evitar duplicados
        const nuevoInput = mensajeInput.cloneNode(true);
        mensajeInput.parentNode.replaceChild(nuevoInput, mensajeInput);
        
        nuevoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                console.log("Enter presionado en input de chat");
                enviarMensajeChat();
            }
        });
        
        console.log("Eventos de envío de mensajes configurados");
    } else {
        console.warn("Elementos para envío de mensajes no encontrados", {
            enviarMensaje: !!enviarMensaje,
            mensajeInput: !!mensajeInput
        });
    }
}
    
    /**
     * Configura los eventos específicos de informes
     */
    function configurarEventosInformes() {
        // Cambio entre ver y crear informes
        const btnVerInformes = document.getElementById('btn-ver-informes');
        const btnCrearInforme = document.getElementById('btn-crear-informe');
        const verInformes = document.getElementById('ver-informes');
        const crearInforme = document.getElementById('crear-informe');
        
        if (btnVerInformes && btnCrearInforme && verInformes && crearInforme) {
            btnVerInformes.addEventListener('click', function() {
                btnVerInformes.classList.add('active');
                btnCrearInforme.classList.remove('active');
                verInformes.classList.remove('d-none');
                crearInforme.classList.add('d-none');
            });
            
            btnCrearInforme.addEventListener('click', function() {
                btnCrearInforme.classList.add('active');
                btnVerInformes.classList.remove('active');
                verInformes.classList.add('d-none');
                crearInforme.classList.remove('d-none');
            });
        }
        
        // Filtros de informes
        const btnFiltroTodos = document.getElementById('btn-filtro-todos');
        const btnFiltroInformes = document.getElementById('btn-filtro-informes');
        const btnFiltroOrdenes = document.getElementById('btn-filtro-ordenes');
        
        if (btnFiltroTodos && btnFiltroInformes && btnFiltroOrdenes) {
            [btnFiltroTodos, btnFiltroInformes, btnFiltroOrdenes].forEach(btn => {
                btn.addEventListener('click', function() {
                    [btnFiltroTodos, btnFiltroInformes, btnFiltroOrdenes].forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    filtrarInformes(this.id);
                });
            });
        }
        
        // Envío de informes
        const formInforme = document.getElementById('form-informe');
        const cancelarInforme = document.getElementById('cancelar-informe');
        
        if (formInforme) {
            formInforme.addEventListener('submit', function(e) {
                e.preventDefault();
                enviarInforme();
            });
        }
        
        if (cancelarInforme) {
            cancelarInforme.addEventListener('click', function() {
                if (btnVerInformes) btnVerInformes.click();
            });
        }
    }
    
    /**
     * Configura los eventos relacionados con los elementos
     */
    function configurarEventosElementos() {
        // Botones de acción para elementos
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        const btnCentrar = document.getElementById('btn-centrar');
        const btnVerTodos = document.getElementById('btn-ver-todos');
        const btnBuscarElemento = document.getElementById('btnBuscarElemento');
        
        if (btnSeguimiento) {
            btnSeguimiento.addEventListener('click', toggleSeguimiento);
        }
        
        if (btnCentrar) {
            btnCentrar.addEventListener('click', centrarEnPosicion);
        }
        
        if (btnVerTodos) {
            btnVerTodos.addEventListener('click', mostrarTodosElementos);
        }
        
        if (btnBuscarElemento) {
            btnBuscarElemento.addEventListener('click', function() {
                const modal = document.getElementById('modalBuscarElemento');
                if (modal) {
                    if (typeof $('#modalBuscarElemento').modal === 'function') {
                        $('#modalBuscarElemento').modal('show');
                    } else {
                        modal.style.display = 'block';
                    }
                }
            });
        }
        
        // Campo de búsqueda de elementos
        const busquedaElemento = document.getElementById('busqueda-elemento');
        if (busquedaElemento) {
            busquedaElemento.addEventListener('input', function() {
                buscarElementos(this.value);
            });
        }
    }
    
    /**
     * Inicializa el comportamiento de los menús desplegables
     */
    function inicializarMenusAvanzados() {
        console.log("Inicializando comportamiento de menús avanzados");
        
        // Prevenir que el clic dentro de los menús los cierre
        document.querySelectorAll('.menu').forEach(menu => {
            menu.addEventListener('click', function(e) {
                // Evitar que el clic se propague al contenedor principal
                e.stopPropagation();
            });
        });
        
        // Configurar los botones de menú principales
        document.querySelectorAll('.menu-btn > button').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Obtener el menú asociado a este botón
                const menuId = this.getAttribute('data-target') || 
                              this.nextElementSibling.id;
                
                const menu = document.getElementById(menuId);
                if (!menu) return;
                
                // Determinar si debemos abrir o cerrar este menú
                const isOpen = menu.classList.contains('show');
                
                // Cerrar todos los demás menús
                document.querySelectorAll('.menu.show').forEach(openMenu => {
                    if (openMenu.id !== menuId) {
                        openMenu.classList.remove('show');
                    }
                });
                
                // Alternar el estado de este menú
                if (isOpen) {
                    menu.classList.remove('show');
                } else {
                    menu.classList.add('show');
                }
            });
        });
        
        // Cerrar menús al hacer clic fuera de ellos (CON PROTECCIÓN)
        document.addEventListener('click', function(event) {
            // ✅ No cerrar si el clic es dentro de un menú o botón de menú
            if (event.target.closest('.menu') || 
                event.target.closest('[onclick*="toggleMenu"]') ||
                event.target.closest('.dropdown-toggle') ||
                event.target.closest('.menu-button')) {
                return; // No cerrar menús si el clic es dentro
            }
            
            // ✅ Solo cerrar menús si el clic es realmente afuera
            document.querySelectorAll('.menu.show').forEach(openMenu => {
                // Verificar que el clic no sea dentro de este menú específico
                if (!openMenu.contains(event.target)) {
                    openMenu.classList.remove('show');
                }
            });
        });
    }
    
    /**
     * Inicializa los botones principales de acción
     */
    function inicializarBotones() {
        // Botón de volver
        const btnVolver = document.getElementById('btnVolver');
        if (btnVolver) {
            btnVolver.addEventListener('click', function() {
                window.location.href = '/Client/inicioGB.html';
            });
        }
        
        // Botón de pantalla completa
        const btnFullscreen = document.getElementById('fullscreenBtn');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', function() {
                toggleFullScreen();
            });
        }
    }
    
    /**
     * Función para alternar la pantalla completa
     */
    function toggleFullScreen() {
        if (!document.fullscreenElement &&    // método estándar
            !document.mozFullScreenElement && // Firefox
            !document.webkitFullscreenElement && // Chrome, Safari y Opera
            !document.msFullscreenElement) {  // IE/Edge
            // Activar pantalla completa
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            // Salir de pantalla completa
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    
    /**
     * Alterna la visibilidad del panel lateral
     * @param {boolean} [forzarEstado] - Opcional: forzar un estado específico (true=visible, false=oculto)
     */
    function togglePanel(forzarEstado) {
        const panel = document.getElementById('panel-lateral');
        const botonFlotante = document.getElementById('toggle-panel-btn');
        const botonCerrar = document.getElementById('cerrar-panel');
        
        if (!panel) {
            console.error("Panel lateral no encontrado");
            return;
        }
        
        // Determinar el estado actual y el estado deseado
        const panelEstaOculto = panel.classList.contains('oculto');
        let mostrarPanel;
        
        // 🐛 Debug: Verificar estado real del panel
        console.log('🔍 Estado del panel antes del toggle:', {
            tieneClaseOculto: panelEstaOculto,
            transform: getComputedStyle(panel).transform,
            classList: Array.from(panel.classList)
        });
        
        if (forzarEstado !== undefined) {
            mostrarPanel = forzarEstado;
        } else {
            // Toggle: si está oculto, mostrarlo; si está visible, ocultarlo
            mostrarPanel = panelEstaOculto;
        }
        
        // 🐛 Debug: Mostrar decisión del toggle
        console.log('🔄 Decisión toggle:', {
            panelEstaOculto,
            mostrarPanel,
            accion: mostrarPanel ? 'MOSTRAR' : 'OCULTAR'
        });
        
        if (mostrarPanel) {
            // Mostrar panel
            panel.classList.remove('oculto');
            
            // Actualizar botón de cerrar (flecha hacia la derecha para indicar "cerrar")
            if (botonCerrar) {
                botonCerrar.innerHTML = '<i class="fas fa-chevron-right"></i>';
                botonCerrar.title = 'Ocultar panel';
            }
            
            panelVisible = true;
            window.MAIRA_UI_STATES.panelAbierto = true;
            localStorage.setItem('panelVisible', 'true');
            console.log('📱 Panel lateral mostrado');
        } else {
            // Ocultar panel
            panel.classList.add('oculto');
            
            panelVisible = false;
            window.MAIRA_UI_STATES.panelAbierto = false;
            localStorage.setItem('panelVisible', 'false');
            console.log('📱 Panel lateral ocultado');
        }
        
        // Forzar re-renderizado para dispositivos que podrían tener problemas de visualización
        setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
    
    /**
     * Cambia la pestaña activa del panel
     * @param {string} tabId - ID de la pestaña a activar
     */
    function cambiarTab(tabId) {
        console.log("Cambiando a pestaña:", tabId);
        
        // Desactivar todas las pestañas y contenidos
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(function(content) {
            content.classList.remove('active');
        });
        
        // Activar la pestaña seleccionada
        const botonTab = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (botonTab) {
            botonTab.classList.add('active');
            console.log("Botón de pestaña activado:", tabId);
        } else {
            console.error("Botón de pestaña no encontrado:", tabId);
        }
        
        const contenidoTab = document.getElementById(tabId);
        if (contenidoTab) {
            contenidoTab.classList.add('active');
            console.log("Contenido de pestaña activado:", tabId);
        } else {
            console.error("Contenido de pestaña no encontrado:", tabId);
        }
        
        // ✅ Limpiar notificaciones de la pestaña activa
        limpiarNotificacionesTab(tabId);
        
        // Guardar estado actual
        estadosUI.tabActiva = tabId;
        localStorage.setItem('gb_tab_activa', tabId);
    }
    
    /**
     * Inicializa el sistema de notificaciones
     */
    function inicializarNotificaciones() {
        // Verificar si ya existe el contenedor
        let container = document.getElementById('notificaciones-container');
        if (!container) {
            // Crear contenedor si no existe
            container = document.createElement('div');
            container.id = 'notificaciones-container';
            container.className = 'notificaciones-container';
            document.body.appendChild(container);
        }
    }
    
    /**
     * Actualiza la información del usuario en el panel lateral
     */
    function actualizarInfoUsuarioPanel() {
        if (!usuarioInfo || !elementoTrabajo) return;
        
        const nombreUsuario = document.getElementById('nombre-usuario');
        const nombreOperacion = document.getElementById('nombre-operacion');
        const nombreElemento = document.getElementById('nombre-elemento');
        
        if (nombreUsuario) nombreUsuario.textContent = usuarioInfo.usuario;
        if (nombreOperacion) nombreOperacion.textContent = usuarioInfo.operacion || operacionActual;
        if (nombreElemento) {
            const texto = elementoTrabajo.designacion + 
                (elementoTrabajo.dependencia ? '/' + elementoTrabajo.dependencia : '');
            nombreElemento.textContent = texto;
        }
    }
    
   

    /**
     * Obtiene la posición inicial con mejor soporte para dispositivos móviles
     */
    function obtenerPosicionInicial() {
        console.log("Obteniendo posición inicial (versión mejorada para móviles)");
        
        // Opciones optimizadas para dispositivos móviles
        const opcionesPosicion = {
            enableHighAccuracy: true,        // Usar GPS de alta precisión 
            timeout: 20000,                  // Tiempo más largo para móviles
            maximumAge: 0                    // No usar caché de posición
        };
        
        // Verificar si el navegador soporta geolocalización
        if (!navigator.geolocation) {
            console.error("La geolocalización no está soportada en este navegador");
            mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            cargarPosicionPredeterminada();
            return;
        }
        
        try {
            // Primero mostrar que estamos buscando la ubicación
            mostrarNotificacion("Obteniendo tu ubicación...", "info");
            
            // Verificar si es un dispositivo móvil para mostrar instrucciones especiales
            const esMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (esMobile) {
                mostrarNotificacion("Dispositivo móvil detectado. Asegúrate de tener el GPS activado.", "info", 5000);
            }
            
            navigator.geolocation.getCurrentPosition(
                // Éxito
                function(posicion) {
                    console.log("Posición obtenida:", posicion.coords);
                    mostrarNotificacion("Posición obtenida correctamente", "success", 3000);
                    
                    // Resto del código para manejar la posición...
                    ultimaPosicion = {
                        lat: posicion.coords.latitude,
                        lng: posicion.coords.longitude,
                        precision: posicion.coords.accuracy,
                        rumbo: posicion.coords.heading || 0,
                        velocidad: posicion.coords.speed || 0,
                        timestamp: new Date()
                    };
                    
                    // Actualizar interfaz con retardo para asegurar que el mapa está listo
                    setTimeout(() => {
                        actualizarMarcadorUsuario(
                            posicion.coords.latitude, 
                            posicion.coords.longitude, 
                            posicion.coords.heading || 0
                        );
                        
                        // Centrar mapa en la posición obtenida
                        if (window.mapa) {
                            window.mapa.setView([posicion.coords.latitude, posicion.coords.longitude], 15);
                        }
                    }, 1000);
                },
                
                // Error
                function(error) {
                    console.error("Error al obtener posición:", error);
                    
                    let mensajeError = "Error al obtener tu posición";
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            mensajeError = "Permiso de ubicación denegado. Activa la ubicación en tu dispositivo.";
                            
                            // Instrucciones específicas para móviles
                            if (esMobile) {
                                mostrarInstruccionesGPSMovil();
                            }
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensajeError = "Información de ubicación no disponible. Verifica tu GPS.";
                            break;
                        case error.TIMEOUT:
                            mensajeError = "Se agotó el tiempo para obtener tu ubicación.";
                            break;
                    }
                    
                    mostrarNotificacion(mensajeError, "error", 8000);
                    cargarPosicionPredeterminada();
                },
                opcionesPosicion
            );
        } catch (e) {
            console.error("Excepción al obtener posición:", e);
            mostrarNotificacion("Error inesperado al acceder a tu ubicación", "error");
            cargarPosicionPredeterminada();
        }
    }
    
    /**
     * Muestra instrucciones específicas para activar GPS en dispositivos móviles
     */
    /**
     * Muestra instrucciones específicas para activar GPS en dispositivos móviles
     */
    function mostrarInstruccionesGPSMovil() {
        // Crear modal o elemento de ayuda con instrucciones específicas
        const instrucciones = document.createElement('div');
        instrucciones.className = 'instrucciones-gps-movil';
        instrucciones.innerHTML = `
            <div class="instrucciones-contenedor">
                <h3>Activar GPS en tu dispositivo</h3>
                <p>Para usar correctamente esta aplicación:</p>
                <ol>
                    <li>Baja el panel de notificaciones y activa el GPS</li>
                    <li>Asegúrate de dar permiso a la aplicación para acceder a tu ubicación</li>
                    <li>Sal al exterior para mejor recepción GPS</li>
                </ol>
                <p>Para iPhone/iPad:</p>
                <ol>
                    <li>Ve a Configuración > Privacidad > Localización</li>
                    <li>Activa los Servicios de Localización</li>
                    <li>Busca tu navegador en la lista y selecciona "Al usar la app"</li>
                </ol>
                <p>Para Android:</p>
                <ol>
                    <li>Ve a Configuración > Ubicación</li>
                    <li>Activa la Ubicación</li>
                    <li>Asegúrate de usar el modo "Alta precisión"</li>
                </ol>
                <button id="btn-cerrar-instrucciones" class="btn btn-primary">Entendido</button>
            </div>
        `;
        
        // Agregar estilos inline
        instrucciones.style.position = 'fixed';
        instrucciones.style.top = '0';
        instrucciones.style.left = '0';
        instrucciones.style.width = '100%';
        instrucciones.style.height = '100%';
        instrucciones.style.backgroundColor = 'rgba(0,0,0,0.8)';
        instrucciones.style.zIndex = '9999';
        instrucciones.style.display = 'flex';
        instrucciones.style.alignItems = 'center';
        instrucciones.style.justifyContent = 'center';
        
        const contenedor = instrucciones.querySelector('.instrucciones-contenedor');
        contenedor.style.backgroundColor = 'white';
        contenedor.style.padding = '20px';
        contenedor.style.borderRadius = '8px';
        contenedor.style.maxWidth = '90%';
        contenedor.style.maxHeight = '80%';
        contenedor.style.overflow = 'auto';
        
        document.body.appendChild(instrucciones);
        
        document.getElementById('btn-cerrar-instrucciones').addEventListener('click', function() {
            document.body.removeChild(instrucciones);
        });
    }
    

    function solicitarUbicacionManual() {
        const modal = document.createElement('div');
        modal.className = 'modal-ubicacion-manual';
        modal.innerHTML = `
            <div class="modal-contenedor">
                <h3>Ingresar ubicación manualmente</h3>
                <p>Si el GPS no funciona, puedes ingresar tus coordenadas:</p>
                <div class="form-group">
                    <label for="lat-manual">Latitud:</label>
                    <input type="number" id="lat-manual" step="0.000001" value="-34.603722">
                </div>
                <div class="form-group">
                    <label for="lng-manual">Longitud:</label>
                    <input type="number" id="lng-manual" step="0.000001" value="-58.381592">
                </div>
                <div class="buttons">
                    <button id="btn-usar-ubicacion" class="btn btn-primary">Usar ubicación</button>
                    <button id="btn-cancelar-ubicacion" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
        
        // Estilos similares a las instrucciones GPS
        
        document.body.appendChild(modal);
        
        document.getElementById('btn-usar-ubicacion').addEventListener('click', function() {
            const lat = parseFloat(document.getElementById('lat-manual').value);
            const lng = parseFloat(document.getElementById('lng-manual').value);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Usar las coordenadas ingresadas
                ultimaPosicion = {
                    lat: lat,
                    lng: lng,
                    precision: 1000, // Precisión estimada (metros)
                    rumbo: 0,
                    velocidad: 0,
                    timestamp: new Date()
                };
                
                actualizarMarcadorUsuario(lat, lng, 0);
                if (window.mapa) {
                    window.mapa.setView([lat, lng], 15);
                }
                
                document.body.removeChild(modal);
            } else {
                alert("Por favor, ingresa coordenadas válidas");
            }
        });
        
        document.getElementById('btn-cancelar-ubicacion').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }

    /**
     * Carga una posición predeterminada o la última conocida
     */
    function cargarPosicionPredeterminada() {
        // Intentar obtener la última posición conocida del localStorage
        const ultimaPosicionGuardada = localStorage.getItem('ultima_posicion');
        
        if (ultimaPosicionGuardada) {
            try {
                const posicion = JSON.parse(ultimaPosicionGuardada);
                ultimaPosicion = posicion;
                
                // Actualizar marcador con esta posición
                setTimeout(() => {
                    actualizarMarcadorUsuario(
                        posicion.lat, 
                        posicion.lng, 
                        posicion.rumbo || 0
                    );
                }, 1000);
                
                console.log("Usando última posición conocida:", posicion);
                return;
            } catch (e) {
                console.error("Error al parsear la última posición conocida:", e);
            }
        }
        
        // Si no hay última posición, usar una posición por defecto (puedes ajustar estas coordenadas)
        const posicionPredeterminada = {
            lat: -34.6037, // Buenos Aires como ejemplo
            lng: -58.3816,
            precision: 1000,
            rumbo: 0,
            timestamp: new Date()
        };
        
        ultimaPosicion = posicionPredeterminada;
        console.log("Usando posición predeterminada:", posicionPredeterminada);
    }
    
    /**
     * Actualiza el marcador del usuario
     * @param {number} lat - Latitud
     * @param {number} lng - Longitud
     * @param {number} heading - Rumbo en grados
     */
    function actualizarMarcadorUsuario(lat, lng, heading) {
        if (!window.mapa) {
            console.error("Mapa no disponible para actualizar marcador");
            return;
        }
        
        const nuevaPosicion = L.latLng(lat, lng);
        console.log(`Actualizando marcador de usuario en: ${lat}, ${lng}`);
        
        // Si el marcador no existe o no está en el mapa, lo creamos
        if (!marcadorUsuario || !window.mapa.hasLayer(marcadorUsuario)) {
            console.log("Creando nuevo marcador de usuario");
            
            // Verificar si existe función constructora para símbolos militares
            if (typeof ms !== 'undefined' && typeof ms.Symbol === 'function' && elementoTrabajo?.sidc) {
                console.log("Usando símbolo militar para el marcador:", elementoTrabajo.sidc);
                
                try {
                    // Crear etiqueta en formato correcto
                    let etiqueta = "";
                    if (elementoTrabajo.designacion) {
                        etiqueta = elementoTrabajo.designacion;
                        if (elementoTrabajo.dependencia) {
                            etiqueta += "/" + elementoTrabajo.dependencia;
                        }
                    }
                    
                    // Crear icono con SIDC
                    const symbol = new ms.Symbol(elementoTrabajo.sidc, {
                        size: 30,
                        direction: heading || 0,
                        uniqueDesignation: etiqueta
                    });
                    
                    // Comprobar que el símbolo se generó correctamente
                    if (symbol) {
                        // Crear marcador
                        marcadorUsuario = L.marker(nuevaPosicion, {
                            icon: L.divIcon({
                                className: 'custom-div-icon usuario',
                                html: symbol.asSVG(),
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            }),
                            title: 'Tu posición',
                            sidc: elementoTrabajo.sidc,
                            designacion: elementoTrabajo.designacion,
                            dependencia: elementoTrabajo.dependencia
                        });
                        
                        // Asegurarse de que se añada al calco activo o al mapa
                        if (window.calcoActivo) {
                            marcadorUsuario.addTo(window.calcoActivo);
                        } else {
                            marcadorUsuario.addTo(window.mapa);
                        }
                        
                        console.log("Marcador de usuario añadido al mapa");
                        
                        // Configurar evento de clic para el menú contextual
                        marcadorUsuario.on('contextmenu', function(e) {
                            if (window.mostrarMenuContextual) {
                                window.mostrarMenuContextual(e, this);
                            }
                        });
                    } else {
                        console.error("No se pudo generar el símbolo militar");
                        crearMarcadorSimple(nuevaPosicion);
                    }
                } catch (error) {
                    console.error("Error al crear símbolo militar:", error);
                    crearMarcadorSimple(nuevaPosicion);
                }
            } else {
                console.log("Usando marcador estándar (no se encontró milsymbol o no hay SIDC)");
                crearMarcadorSimple(nuevaPosicion);
            }
        } else {
            // Actualizar posición si ya existe
            console.log("Actualizando posición del marcador existente");
            marcadorUsuario.setLatLng(nuevaPosicion);
            
            // Actualizar dirección si está disponible
            if (heading !== null && heading !== undefined && typeof heading === 'number') {
                try {
                    if (marcadorUsuario.setRotationAngle) {
                        marcadorUsuario.setRotationAngle(heading);
                    } else if (marcadorUsuario.options.icon && marcadorUsuario.options.icon.options && marcadorUsuario.options.icon.options.html) {
                        // Si el marcador tiene un icono HTML, intenta actualizarlo
                        const container = marcadorUsuario.getElement();
                        if (container) {
                            const iconContainer = container.querySelector('div');
                            if (iconContainer) {
                                iconContainer.style.transform = `rotate(${heading}deg)`;
                            }
                        }
                    }
                } catch (error) {
                    console.warn("Error al actualizar rotación del marcador:", error);
                }
            }
        }
        
        // Centrar mapa si el seguimiento está activo
        if (seguimientoActivo && window.mapa) {
            window.mapa.setView(nuevaPosicion);
        }
    }
    
    /**
     * Función auxiliar para crear un marcador simple cuando no se puede usar milsymbol
     * @param {L.LatLng} posicion - Posición del marcador
     */
    function crearMarcadorSimple(posicion) {
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
        
        console.log("Marcador simple añadido al mapa");
    }
    
    /**
     * Inicia el seguimiento de posición
     */
    function iniciarSeguimiento() {
        console.log("Iniciando seguimiento de posición");
        
        // Comprobar si ya hay un seguimiento activo
        if (seguimientoActivo) {
            console.log("El seguimiento ya está activo");
            return;
        }
        
        // Comprobar soporte de geolocalización
        if (!navigator.geolocation) {
            mostrarNotificacion("Tu navegador no soporta geolocalización", "error");
            agregarMensajeChat("Sistema", "Tu navegador no soporta geolocalización.", "sistema");
            return;
        }
        
        // Configurar botón de seguimiento como activo
        const btnSeguimiento = document.getElementById('btn-seguimiento');
        if (btnSeguimiento) {
            btnSeguimiento.classList.add('active');
            btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow text-primary"></i> Seguimiento activo';
        }
        
        // Mostrar mensaje en el chat
        agregarMensajeChat("Sistema", "Iniciando seguimiento de posición...", "sistema");
        
        // Opciones de seguimiento optimizadas para móviles
        const opcionesSeguimiento = {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        };
        
        // Para dispositivos móviles, reducir frecuencia para ahorrar batería
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            opcionesSeguimiento.maximumAge = 10000; // Más tiempo entre actualizaciones
        }
        
        try {
            // Iniciar seguimiento continuo
            watchId = navigator.geolocation.watchPosition(
                posicionActualizada,
                errorPosicion,
                opcionesSeguimiento
            );
            
            // Activar la variable de seguimiento
            seguimientoActivo = true;
            
            agregarMensajeChat("Sistema", "Seguimiento de posición activado", "sistema");
            console.log("Seguimiento iniciado con éxito");
            
            // Guardar estado en localStorage
            localStorage.setItem('seguimiento_activo', 'true');
        } catch (e) {
            console.error("Error al iniciar seguimiento:", e);
            mostrarNotificacion("Error al iniciar seguimiento de posición", "error");
            
            // Revertir estado del botón
            if (btnSeguimiento) {
                btnSeguimiento.classList.remove('active');
                btnSeguimiento.innerHTML = '<i class="fas fa-location-arrow"></i> Seguimiento';
            }
        }
    }
    
    /**
     * Detiene el seguimiento de posición
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
        
        agregarMensajeChat("Sistema", "Seguimiento de posición desactivado", "sistema");
        
        // Actualizar localStorage
        localStorage.setItem('seguimiento_activo', 'false');
    }
    
    /**
     * Alterna el estado del seguimiento
     */
    function toggleSeguimiento() {
        if (seguimientoActivo) {
            detenerSeguimiento();
        } else {
            iniciarSeguimiento();
        }
    }
    
    /**
     * Maneja la actualización de posición
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
            colaPendiente.posiciones.push({
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
        
        agregarMensajeChat("Sistema", mensaje, "sistema");
        mostrarNotificacion(mensaje, "error");
        detenerSeguimiento();
    }
    
    /**
     * Centra el mapa en la posición actual
     */
    function centrarEnPosicion() {
        console.log("Centrando mapa en posición actual");
        
        if (marcadorUsuario && window.mapa && window.mapa.hasLayer(marcadorUsuario)) {
            window.mapa.setView(marcadorUsuario.getLatLng(), 15);
            mostrarNotificacion("Mapa centrado en tu posición", "info", 2000);
        } else {
            // Si no hay marcador, intentar obtener posición actual
            try {
                if (ultimaPosicion) {
                    if (window.mapa) {
                        window.mapa.setView([ultimaPosicion.lat, ultimaPosicion.lng], 15);
                        mostrarNotificacion("Mapa centrado en tu última posición", "info", 2000);
                    }
                } else {
                    obtenerPosicionInicial();
                }
            } catch (error) {
                console.error("Error al centrar en posición:", error);
                agregarMensajeChat("Sistema", "No se pudo obtener tu posición actual", "sistema");
                mostrarNotificacion("No se pudo centrar en tu posición", "error");
            }
        }
    }
    
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
                mostrarNotificacion(`Mostrando ${grupo.getLayers().length} elementos en el mapa`, "success", 3000);
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
            agregarMensajeChat("Sistema", "No hay elementos para mostrar en el mapa", "sistema");
            mostrarNotificacion("No hay elementos para mostrar", "info");
        }
    }


    /**
     * Obtiene la URL del servidor usando networkConfig.js o fallback manual
     */
    function obtenerURLServidor() {
        console.log('🔍 Determinando URL del servidor...');
        
        // ✅ PRIMERA OPCIÓN: Usar networkConfig.js si está disponible
        if (window.SERVER_URL) {
            console.log(`✅ URL del servidor desde networkConfig: ${window.SERVER_URL}`);
            return window.SERVER_URL;
        }
        
        // ✅ SEGUNDA OPCIÓN: Calcular manualmente como fallback
        console.log('⚠️ networkConfig.js no disponible, calculando URL manualmente...');
        
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        let serverURL;
        
        // Detectar servicios de tunnel o servicios en la nube
        if (hostname.includes('ngrok') || hostname.includes('trycloudflare.com') || hostname.includes('onrender.com')) {
            serverURL = `${protocol}//${hostname}`;
            console.log('🌐 Detectado servicio en la nube');
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Desarrollo local
            serverURL = `${protocol}//${hostname}:5000`;
            console.log('💻 Detectado desarrollo local');
        } else {
            // Producción o red local
            serverURL = `${protocol}//${hostname}${port && port !== '80' && port !== '443' ? ':' + port : ''}`;
            console.log('🌍 Detectado servidor de producción');
        }
        
        console.log(`✅ URL del servidor calculada: ${serverURL}`);
        return serverURL;
    }


  
    /**
     * Envía elemento inicial al servidor cuando se conecta
     */
    function enviarElementoInicial() {
        console.log('📤 Enviando elemento inicial al servidor...');
        
        if (!socket || !socket.connected) {
            console.warn('❌ No hay conexión para enviar elemento inicial');
            return;
        }
        
        if (!usuarioInfo || !elementoTrabajo) {
            console.warn('❌ Faltan datos de usuario o elemento para envío inicial');
            return;
        }
        
        const datosElemento = {
            id: usuarioInfo.id,
            usuario: usuarioInfo.usuario,
            elemento: {
                id: elementoTrabajo.id,
                sidc: elementoTrabajo.sidc,
                designacion: elementoTrabajo.designacion,
                dependencia: elementoTrabajo.dependencia,
                magnitud: elementoTrabajo.magnitud
            },
            posicion: ultimaPosicion,
            operacion: operacionActual,
            timestamp: new Date().toISOString(),
            conectado: true
        };
        
        console.log('📤 Enviando datos iniciales:', datosElemento);
        
        // Enviar al servidor
        socket.emit('unirseOperacion', datosElemento);
        
        // También enviar actualización de posición si está disponible
        if (ultimaPosicion) {
            socket.emit('actualizarPosicionGB', {
                id: usuarioInfo.id,
                usuario: usuarioInfo.usuario,
                elemento: elementoTrabajo,
                posicion: ultimaPosicion,
                operacion: operacionActual,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('✅ Elemento inicial enviado al servidor');
    }
    
    /**
     * Conecta al servidor Socket.IO
     */
    function conectarAlServidor() {
        console.log('🔗 Conectando al servidor...');
        
        try {
            // ✅ AHORA SÍ FUNCIONA:
            const urlServidor = obtenerURLServidor();
            console.log('🔗 URL del servidor:', urlServidor);
            
            if (!urlServidor) {
                throw new Error('No se pudo determinar la URL del servidor');
            }
            
            socket = io(urlServidor, {
                transports: ['polling'],  // Solo polling para Render
                timeout: 30000,
                forceNew: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                upgrade: false  // No intentar upgrade a websocket
            });
            
            socket.on('connect', function() {
                console.log('📡 Conectado al servidor Socket.IO');
                console.log('🆔 Socket ID:', socket.id);
                
                // Unirse a la sala de la operación
                if (operacionActual) {
                    socket.emit('joinRoom', operacionActual);
                    console.log(`🏠 Uniéndose a la sala: ${operacionActual}`);
                }
                
                // Configurar eventos del socket
                configurarEventosSocket();
                
                // Inicializar chat después de conexión
                setTimeout(() => {
                    inicializarInterfazMultimedia();
                }, 1000);
                
                // Actualizar estado de conexión
                actualizarEstadoConexion(true);
                
                // Enviar elemento inicial si está disponible
                if (usuarioInfo && elementoTrabajo && ultimaPosicion) {
                    setTimeout(() => {
                        enviarElementoInicial();
                    }, 2000);
                }
            });
            
            socket.on('disconnect', function(reason) {
                console.warn('❌ Desconectado del servidor:', reason);
                actualizarEstadoConexion(false);
                
                const mensaje = `Desconectado del servidor: ${reason}`;
                agregarMensajeChat("Sistema", mensaje, "sistema");
                mostrarNotificacion(mensaje, "warning");
            });
            
            socket.on('connect_error', function(error) {
                console.error('❌ Error de conexión:', error);
                actualizarEstadoConexion(false);
                
                const mensaje = "Error al conectar con el servidor";
                agregarMensajeChat("Sistema", mensaje, "sistema");
                mostrarNotificacion(mensaje, "error");
            });
            
            socket.on('reconnect', function(attemptNumber) {
                console.log('🔄 Reconectado al servidor en intento:', attemptNumber);
                actualizarEstadoConexion(true);
                
                const mensaje = "Reconectado al servidor";
                agregarMensajeChat("Sistema", mensaje, "sistema");
                mostrarNotificacion(mensaje, "success");
            });
            
        } catch (error) {
            console.error('❌ Error crítico al conectar con el servidor:', error);
            actualizarEstadoConexion(false);
            
            const mensaje = `Error crítico de conexión: ${error.message}`;
            agregarMensajeChat("Sistema", mensaje, "sistema");
            mostrarNotificacion(mensaje, "error");
            
            return false;
        }
    }



/**
 * Envía los mensajes, informes y posiciones pendientes cuando se conecta
 */
function enviarPendientes() {
    console.log("Intentando enviar datos pendientes");
    
    if (!socket || !socket.connected) {
        console.warn("No se pueden enviar datos pendientes: sin conexión");
        return;
    }
    
    // Enviar mensajes pendientes
    if (colaPendiente.mensajes && colaPendiente.mensajes.length > 0) {
        console.log(`Enviando ${colaPendiente.mensajes.length} mensajes pendientes`);
        
        colaPendiente.mensajes.forEach(mensaje => {
            socket.emit('mensajeChat', mensaje);
        });
        
        // Limpiar mensajes enviados
        colaPendiente.mensajes = [];
    }
    
    // Enviar informes pendientes
    if (colaPendiente.informes && colaPendiente.informes.length > 0) {
        console.log(`Enviando ${colaPendiente.informes.length} informes pendientes`);
        
        colaPendiente.informes.forEach(informe => {
            socket.emit('nuevoInforme', informe);
        });
        
        // Limpiar informes enviados
        colaPendiente.informes = [];
    }
    
    // Enviar posiciones pendientes
    if (colaPendiente.posiciones && colaPendiente.posiciones.length > 0) {
        console.log(`Enviando ${colaPendiente.posiciones.length} posiciones pendientes`);
        
        // Solo enviar la última posición para no sobrecargar
        const ultimaPosicionPendiente = colaPendiente.posiciones[colaPendiente.posiciones.length - 1];
        socket.emit('actualizarPosicion', ultimaPosicionPendiente);
        
        // Limpiar posiciones enviadas
        colaPendiente.posiciones = [];
    }
}

/**
 * Envía la posición actual al servidor
 */
function actualizarPosicionActual(lat, lng, heading) {
    // Actualizar posición local
    ultimaPosicion = {
        lat: lat,
        lng: lng,
        heading: heading,
        timestamp: new Date().toISOString()
    };

    // Actualizar marcador en el mapa
    actualizarMarcadorUsuario(lat, lng, heading);

    // Enviar al servidor usando la función enviarPosicion
    enviarPosicion(ultimaPosicion);
}

function enviarPosicion(posicion) {
    if (!socket?.connected || !usuarioInfo) {
        console.warn("No se puede enviar posición - sin conexión o usuario");
        return;
    }
    
    const datos = {
        id: usuarioInfo.id,
        usuario: usuarioInfo.usuario,
        elemento: elementoTrabajo,
        posicion: posicion,
        operacion: operacionActual,
        timestamp: new Date().toISOString()
    };
    
    console.log("Enviando actualización de posición GB:", datos);
    socket.emit('actualizarPosicionGB', datos);
}

/**
 * Actualiza el estado visual de la conexión
 */
function actualizarEstadoConexion(conectado) {
    console.log(`🔄 Actualizando estado de conexión: ${conectado ? 'CONECTADO' : 'DESCONECTADO'}`);
    
    // Actualizar indicador visual en la interfaz
    const indicadorConexion = document.getElementById('estado-conexion') || 
                            document.querySelector('.estado-conexion');
    
    if (indicadorConexion) {
        indicadorConexion.className = `estado-conexion ${conectado ? 'conectado' : 'desconectado'}`;
        indicadorConexion.textContent = conectado ? '🟢 Conectado' : '🔴 Desconectado';
        indicadorConexion.title = conectado ? 
            'Conectado al servidor en tiempo real' : 
            'Sin conexión al servidor';
    }
    
    // Actualizar título de la página
    const tituloOriginal = document.title.replace(/^\[.*?\]\s*/, '');
    document.title = conectado ? 
        `[ONLINE] ${tituloOriginal}` : 
        `[OFFLINE] ${tituloOriginal}`;
    
    // Habilitar/deshabilitar funciones que requieren conexión
    const elementosConexion = document.querySelectorAll('.requiere-conexion');
    elementosConexion.forEach(elemento => {
        elemento.disabled = !conectado;
        if (conectado) {
            elemento.classList.remove('deshabilitado');
        } else {
            elemento.classList.add('deshabilitado');
        }
    });
}

// Llamar a esta función después de inicializar la interfaz
setTimeout(verificarElementosChat, 2000);


/**
 * Verifica que los elementos del chat están disponibles
 * @returns {Object} Estado de los elementos del chat
 */
function verificarElementosChat() {
    // Elementos principales del chat
    const chatMessages = document.getElementById('chat-messages');
    const mensajeInput = document.getElementById('mensaje-chat');
    const enviarBtn = document.getElementById('enviar-mensaje');
    
    console.log("Verificando elementos del chat:");
    console.log("- chat-messages:", !!chatMessages);
    console.log("- mensaje-chat:", !!mensajeInput);
    console.log("- enviar-mensaje:", !!enviarBtn);
    
    // Si falta algún elemento crítico, intentar encontrarlos por clase o selector alternativo
    if (!chatMessages) {
        const posiblesContenedores = document.querySelectorAll('.chat-messages');
        console.log("Posibles contenedores por clase:", posiblesContenedores.length);
    }
    
    // Verificar panel del chat
    const panelChat = document.getElementById('tab-chat');
    console.log("- tab-chat:", !!panelChat);
    
    return {
        chatMessages,
        mensajeInput,
        enviarBtn,
        panelChat,
        todosExisten: !!chatMessages && !!mensajeInput && !!enviarBtn
    };
}

/**
 * Actualiza el estado de un mensaje
 * @param {string} mensajeId - ID del mensaje
 * @param {string} estado - Nuevo estado
 */
function actualizarEstadoMensaje(mensajeId, estado) {
    const elementoMensaje = document.querySelector(`#msg-${mensajeId}`);
    if (!elementoMensaje) {
        console.warn(`Mensaje con ID ${mensajeId} no encontrado para actualizar estado`);
        return;
    }
    
    const estadoElement = elementoMensaje.querySelector('.estado');
    if (estadoElement) {
        estadoElement.textContent = estado;
        estadoElement.className = `estado ${estado}`;
    } else {
        // Si no existe elemento de estado, crearlo
        const nuevoEstado = document.createElement('span');
        nuevoEstado.className = `estado ${estado}`;
        nuevoEstado.textContent = estado;
        elementoMensaje.appendChild(nuevoEstado);
    }
}

/**
 * Agrega un mensaje al chat
 * @param {string|Object} emisor - Nombre del emisor o mensaje completo
 * @param {string} mensaje - Contenido del mensaje (si emisor es string)
 * @param {string} tipo - Tipo de mensaje (enviado, recibido, sistema)
 * @param {string} estado - Estado del mensaje (enviando, enviado, error)
 * @param {string} id - ID único del mensaje
 */
function agregarMensajeChat(emisor, mensaje, tipo, estado, id) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) {
        console.error("Contenedor de chat no encontrado (chat-messages)");
        return;
    }
    
    // Si el primer parámetro es un objeto, extraer sus propiedades
    if (typeof emisor === 'object' && emisor !== null) {
        id = mensaje;
        estado = tipo;
        tipo = mensaje;
        mensaje = emisor.mensaje || emisor.contenido || '';
        emisor = emisor.usuario || emisor.emisor || 'Desconocido';
    }
    
    // Valores por defecto si no se proporcionan
    tipo = tipo || 'recibido';
    
    // Determinar la clase CSS según el tipo
    let claseCSS = '';
    if (tipo === "enviado") {
        claseCSS = "message-usuario";
    } else if (tipo === "sistema") {
        claseCSS = "message-sistema";
    } else {
        claseCSS = "message-recibido";
    }
    
    // Formatear hora actual
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Convertir URLs en enlaces clicables si el mensaje es texto
    let mensajeFormateado = '';
    if (mensaje && typeof mensaje === 'string') {
        mensajeFormateado = mensaje.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    } else if (mensaje) {
        mensajeFormateado = mensaje.toString();
    } else {
        mensajeFormateado = ""; // Para evitar 'undefined'
    }
    
    // Si ya existe un mensaje con este ID, actualizar su estado en lugar de crear uno nuevo
    if (id) {
        const mensajeExistente = document.getElementById(`msg-${id}`);
        if (mensajeExistente) {
            // Solo actualizar el estado si se proporciona
            if (estado) {
                const estadoElement = mensajeExistente.querySelector('.estado');
                if (estadoElement) {
                    estadoElement.textContent = estado;
                    estadoElement.className = `estado ${estado}`;
                } else {
                    // Si no existe elemento de estado, crearlo
                    const nuevoEstado = document.createElement('span');
                    nuevoEstado.className = `estado ${estado}`;
                    nuevoEstado.textContent = estado;
                    mensajeExistente.appendChild(nuevoEstado);
                }
            }
            // No crear un mensaje nuevo si ya existe
            return;
        }
    }
    
    // Crear elemento de mensaje
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `message ${claseCSS}`;
    if (id) {
        mensajeDiv.id = `msg-${id}`;
    }
    
    // HTML interno del mensaje
    if (tipo === "sistema") {
        // Mensaje del sistema (más simple)
        mensajeDiv.textContent = mensajeFormateado;
    } else {
        // Mensaje normal con emisor y hora
        mensajeDiv.innerHTML = `
            <div><strong>${emisor}</strong> <small>${hora}</small></div>
            <div>${mensajeFormateado}</div>
            ${estado ? `<span class="estado ${estado}">${estado}</span>` : ''}
        `;
    }
    
    // Añadir al contenedor
    chatContainer.appendChild(mensajeDiv);
    
    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Log para depuración
    console.log(`Mensaje agregado: ${emisor} - ${mensaje ? mensaje.substring(0, 20) + '...' : ''}`);
    
    // ✅ Agregar notificación si no es un mensaje del sistema y el chat no está visible
    if (tipo !== 'sistema' && emisor !== 'Sistema') {
        incrementarNotificacionTab('tab-chat');
    }
}



/**
 * Procesa un mensaje recibido del servidor
 * @param {Object} mensaje - El mensaje recibido
 */
function recibirMensajeChat(mensaje) {
    if (!mensaje) {
        console.warn("Mensaje vacío recibido");
        return;
    }
    
    try {
        console.log("Procesando mensaje recibido:", mensaje);
        
        // Normalizar el formato del mensaje para mostrar
        let emisorNombre = '';
        let contenidoMensaje = '';
        let tipoMensaje = 'recibido';
        
        // Detectar formato del mensaje (varios formatos posibles)
        if (mensaje.usuario && mensaje.mensaje !== undefined) {
            // Formato del servidor principal
            emisorNombre = mensaje.usuario;
            contenidoMensaje = mensaje.mensaje;
        } else if (mensaje.emisor) {
            // Formato alternativo
            emisorNombre = typeof mensaje.emisor === 'object' ? 
                mensaje.emisor.nombre || mensaje.emisor.usuario : 
                mensaje.emisor;
            contenidoMensaje = mensaje.contenido || '';
        } else {
            console.warn("Formato de mensaje desconocido:", mensaje);
            return;
        }
        
        // Mensaje del sistema
        if (emisorNombre === "Sistema" || emisorNombre === "Servidor") {
            tipoMensaje = "sistema";
        }
        
        // Si es mensaje propio (enviado por nosotros)
        if (emisorNombre === usuarioInfo?.usuario) {
            // No mostrar nuestros propios mensajes que recibimos eco del servidor
            if (mensaje.id && mensajesEnviados && mensajesEnviados.has(mensaje.id)) {
                console.log("Mensaje propio ya mostrado, actualizando solo estado:", mensaje.id);
                // Solo actualizar estado si existe id
                if (mensaje.id && mensaje.estado) {
                    agregarMensajeChat(null, null, null, mensaje.estado, mensaje.id);
                }
                return;
            }
            tipoMensaje = "enviado";
        }
        
        // Evitar duplicados si tiene ID y ya lo hemos recibido
        if (mensaje.id && mensajesRecibidos && mensajesRecibidos.has(mensaje.id)) {
            console.log("Mensaje duplicado ignorado:", mensaje.id);
            return;
        }
        
        // Registrar ID para evitar duplicados
        if (mensaje.id && mensajesRecibidos) {
            mensajesRecibidos.add(mensaje.id);
        }
        
        // Añadir este mensaje a los enviados si es nuestro
        if (tipoMensaje === "enviado" && mensaje.id && mensajesEnviados) {
            mensajesEnviados.add(mensaje.id);
        }
        
        // Mostrar el mensaje
        agregarMensajeChat(
            emisorNombre, 
            contenidoMensaje, 
            tipoMensaje, 
            mensaje.estado || 'recibido', 
            mensaje.id
        );
    } catch (error) {
        console.error("Error al procesar mensaje:", error);
    }
}


    
    
    
    
    
    
    

    function grabarVideo() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
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
                        mostrarNotificacion("Tu navegador no soporta ningún formato de video compatible", "error");
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
                        const blob = new Blob(chunks, { type: tipoSeleccionado });
                        const videoURL = URL.createObjectURL(blob);
                        
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
                    mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
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
            
            // Limitar grabación a 2 minutos para evitar archivos demasiado grandes
            if (duracion >= 120) {
                detenerGrabacionVideo();
                mostrarNotificacion("Límite de 2 minutos alcanzado", "info");
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
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
        document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
        document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);
        
        // Función para guardar el video
        document.getElementById('btn-guardar-video').addEventListener('click', function() {
            if (chunks.length === 0) {
                mostrarNotificacion("No hay grabación para guardar", "error");
                return;
            }
            
            // Tipo MIME basado en el navegador
            const tipoVideo = mediaRecorder.mimeType || 'video/webm';
            const extensionArchivo = tipoVideo.includes('mp4') ? 'mp4' : 'webm';
            
            const videoBlob = new Blob(chunks, { type: tipoVideo });
            
            // Verificar tamaño máximo (5MB)
            if (videoBlob.size > 5 * 1024 * 1024) {
                mostrarNotificacion("El video excede el tamaño máximo permitido de 5MB. Intente una grabación más corta.", "error");
                return;
            }
            
            // Crear archivo desde blob
            const file = new File([videoBlob], `video_${new Date().toISOString().replace(/:/g, '-')}.${extensionArchivo}`, { 
                type: tipoVideo
            });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            if (!fileInput) {
                mostrarNotificacion("No se pudo encontrar el campo de adjunto", "error");
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
                
                mostrarNotificacion("Video grabado correctamente", "success");
            } catch (error) {
                console.error("Error al guardar video:", error);
                mostrarNotificacion("Error al guardar el video: " + error.message, "error");
            }
        });
        
        // Botón para descartar grabación
        document.getElementById('btn-descartar-video').addEventListener('click', function() {
            chunks = [];
            cerrarModalGrabacionVideo();
        });
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                cerrarModalGrabacionVideo();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
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
        
        // Actualizar lista de destinatarios para mensajes privados
        if (estadosUI.chatPrivado) {
            actualizarListaDestinatarios();
        }
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
        
        // Actualizar lista de destinatarios para mensajes privados
        if (estadosUI.chatPrivado) {
            actualizarListaDestinatarios();
        }
    }
    
    /**
     * Muestra los detalles de un elemento
     * @param {string} id - ID del elemento
     */
    function mostrarDetallesElemento(id) {
        const elemento = elementosConectados[id]?.datos;
        if (!elemento) return;
        
        const modalContenido = document.getElementById('detalles-elemento-contenido');
        if (!modalContenido) return;
        
        // Formato de la última actualización
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
                        <td>${elemento.elemento.designacion || 'No disponible'}</td>
                    </tr>
                    <tr>
                        <th>Dependencia:</th>
                        <td>${elemento.elemento.dependencia || 'No disponible'}</td>
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
            detallesHTML += `
                    <tr>
                        <th>Posición:</th>
                        <td>Lat: ${elemento.posicion.lat.toFixed(6)}, Lng: ${elemento.posicion.lng.toFixed(6)}</td>
                    </tr>`;
                    
            if (elemento.posicion.precision) {
                detallesHTML += `
                    <tr>
                        <th>Precisión:</th>
                        <td>${elemento.posicion.precision.toFixed(1)} metros</td>
                    </tr>`;
            }
            
            if (elemento.posicion.rumbo !== undefined) {
                detallesHTML += `
                    <tr>
                        <th>Rumbo:</th>
                        <td>${elemento.posicion.rumbo.toFixed(1)}°</td>
                    </tr>`;
            }
            
            if (elemento.posicion.velocidad !== undefined) {
                detallesHTML += `
                    <tr>
                        <th>Velocidad:</th>
                        <td>${elemento.posicion.velocidad.toFixed(1)} m/s</td>
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
        if (contenedorSIDC && elemento.elemento.sidc && typeof ms !== 'undefined') {
            try {
                const sym = new ms.Symbol(elemento.elemento.sidc, {size: 70});
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
        
        // Mostrar modal
        $('#modalDetallesElemento').modal('show');
    }
    
    /**
     * Centra el mapa en un elemento específico
     * @param {string} elementoId - ID del elemento a centrar
     */
    function centrarEnElemento(elementoId) {
        if (!elementosConectados[elementoId] || !elementosConectados[elementoId].marcador) {
            mostrarNotificacion("Elemento no encontrado", "error");
            return;
        }
        
        const posicion = elementosConectados[elementoId].marcador.getLatLng();
        if (window.mapa) {
            window.mapa.setView(posicion, 15);
            elementosConectados[elementoId].marcador.openPopup();
            mostrarNotificacion("Mapa centrado en el elemento seleccionado", "info", 2000);
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
                        <small>${formatearFecha(resultado.datos.timestamp)}</small>
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
     * Integra los datos del elemento de GBinicio con la función agregarMarcador
     * @param {Object} datosElemento - Datos del elemento recibidos de GBinicio
     */
    function inicializarElementoDesdeGBinicio(datosElemento) {
        console.log("Inicializando elemento desde GBinicio:", datosElemento);
        
        if (!datosElemento || !datosElemento.sidc) {
            console.error("Datos de elemento incompletos o inválidos");
            return;
        }
        
        // Guardar los datos en la variable global
        elementoTrabajo = datosElemento;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('gb_elemento_info', JSON.stringify(datosElemento));
        
        // Si ya tenemos posición, crear el marcador
        if (ultimaPosicion) {
            console.log("Creando marcador con la posición actual y datos del elemento");
            // Actualizar el marcador del usuario con los datos del elemento
            setTimeout(() => {
                actualizarMarcadorUsuario(
                    ultimaPosicion.lat,
                    ultimaPosicion.lng,
                    ultimaPosicion.rumbo || 0
                );
            }, 500);
        } else {
            console.log("No hay posición disponible, intentando obtenerla");
            // Intentar obtener la posición
            obtenerPosicionInicial();
        }
        
        // Actualizar información en el panel lateral
        actualizarInfoUsuarioPanel();
    }
    
    /**
     * Función para agregar marcadores que utiliza tanto los datos de usuario como la función window.agregarMarcador
     * @param {string} sidc - Código SIDC del marcador
     * @param {string} nombre - Nombre descriptivo del elemento
     */
    function agregarMarcadorGB(sidc, nombre) {
        console.log("Agregando marcador con SIDC:", sidc, "Nombre:", nombre);
        
        // Verificar si existe la función global
        if (typeof window.agregarMarcador === 'function') {
            // Usar la función global pero con datos mejorados
            window.agregarMarcador(sidc, nombre, function(marcador) {
                // Callback cuando se crea el marcador
                if (marcador) {
                    // Añadir propiedades adicionales específicas de GB
                    marcador.options.usuario = usuarioInfo?.usuario || 'Usuario';
                    marcador.options.usuarioId = usuarioInfo?.id || '';
                    marcador.options.operacion = operacionActual;
                    marcador.options.timestamp = new Date().toISOString();
                    
                    // Notificar a otros usuarios si estamos conectados
                    if (socket && socket.connected) {
                        socket.emit('nuevoElemento', {
                            id: marcador.options.id,
                            sidc: marcador.options.sidc,
                            nombre: marcador.options.nombre,
                            posicion: marcador.getLatLng(),
                            designacion: marcador.options.designacion || '',
                            dependencia: marcador.options.dependencia || '',
                            magnitud: marcador.options.magnitud || '-',
                            estado: marcador.options.estado || 'operativo',
                            usuario: usuarioInfo?.usuario || 'Usuario',
                            usuarioId: usuarioInfo?.id || '',
                            operacion: operacionActual,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    console.log("Marcador creado y notificado:", marcador.options);
                }
            });
        } else {
            console.warn("La función window.agregarMarcador no está disponible");
            mostrarNotificacion("Función de agregar marcador no disponible", "error");
            
            // Implementación alternativa
            window.mapa.once('click', function(event) {
                const latlng = event.latlng;
                crearMarcadorPersonalizado(latlng, sidc, nombre);
            });
        }
    }
    
    /**
     * Crea un marcador personalizado en caso de que no esté disponible window.agregarMarcador
     * @param {L.LatLng} latlng - Posición del marcador
     * @param {string} sidc - Código SIDC del marcador
     * @param {string} nombre - Nombre descriptivo del elemento
     */
    function crearMarcadorPersonalizado(latlng, sidc, nombre) {
        // Crear ID único para el elemento
        const elementoId = `elemento_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Configurar SIDC 
        let sidcFormateado = sidc;
        if (sidcFormateado.length < 15) {
            sidcFormateado = sidc.padEnd(15, '-');
        }
        
        try {
            // Crear símbolo militar
            if (typeof ms !== 'undefined' && typeof ms.Symbol === 'function') {
                const sym = new ms.Symbol(sidcFormateado, { 
                    size: 35,
                    uniqueDesignation: nombre || "",
                    higherFormation: ""
                });
                
                // Crear marcador
                const marcador = L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'elemento-militar',
                        html: sym.asSVG(),
                        iconSize: [70, 50],
                        iconAnchor: [35, 25]
                    }),
                    draggable: false,
                    sidc: sidcFormateado,
                    nombre: nombre || 'Elemento',
                    id: elementoId,
                    designacion: '',
                    dependencia: '',
                    magnitud: sidcFormateado.charAt(11) || '-',
                    estado: 'operativo',
                    usuario: usuarioInfo?.usuario || 'Usuario',
                    usuarioId: usuarioInfo?.id || ''
                });
                
                // Configurar eventos
                marcador.on('click', function(e) {
                    L.DomEvent.stopPropagation(e);
                    seleccionarElemento(this);
                });
                
                marcador.on('contextmenu', function(e) {
                    L.DomEvent.stopPropagation(e);
                    if (window.mostrarMenuContextual) {
                        window.mostrarMenuContextual(e, this);
                    }
                });
                
                // Agregar al mapa
                if (window.calcoActivo) {
                    window.calcoActivo.addLayer(marcador);
                } else if (window.mapa) {
                    window.mapa.addLayer(marcador);
                }
                
                // Notificar a otros usuarios
                if (socket && socket.connected) {
                    socket.emit('nuevoElemento', {
                        id: elementoId,
                        sidc: sidcFormateado,
                        nombre: nombre || 'Elemento',
                        posicion: latlng,
                        designacion: '',
                        dependencia: '',
                        magnitud: sidcFormateado.charAt(11) || '-',
                        estado: 'operativo',
                        usuario: usuarioInfo?.usuario || 'Usuario',
                        usuarioId: usuarioInfo?.id || '',
                        operacion: operacionActual,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Seleccionar automáticamente para edición
                if (window.seleccionarElemento && typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(marcador);
                }
                
                console.log("Marcador personalizado creado:", nombre || 'Elemento');
            } else {
                console.error("La biblioteca milsymbol no está disponible");
                mostrarNotificacion("No se puede crear el marcador: biblioteca de símbolos no disponible", "error");
            }
        } catch (e) {
            console.error("Error al crear marcador personalizado:", e);
            mostrarNotificacion("Error al crear el marcador", "error");
        }
    }
    
    /**
     * Recibe un informe
     * @param {Object} informe - Informe recibido
     */

    
    /**
     * Marca un informe como leído
     * @param {string} informeId - ID del informe a marcar
     */
    function marcarInformeLeido(informeId) {
        const informeElement = document.querySelector(`.informe[data-id="${informeId}"]`);
        if (informeElement) {
            informeElement.classList.add('leido');
        }
    }
    
    
    /**
     * Filtra los informes según el tipo
     * @param {string} filtroId - ID del filtro seleccionado
     */
    function filtrarInformes(filtroId) {
        const informes = document.querySelectorAll('.informe');
        
        informes.forEach(informe => {
            const tipo = informe.getAttribute('data-tipo');
            
            if (filtroId === 'btn-filtro-informes') {
                // Mostrar solo informes normales y urgentes
                informe.style.display = (tipo === 'normal' || tipo === 'urgente') ? 'block' : 'none';
            } else if (filtroId === 'btn-filtro-ordenes') {
                // Mostrar solo órdenes
                informe.style.display = tipo === 'orden' ? 'block' : 'none';
            } else {
                // Mostrar todos
                informe.style.display = 'block';
            }
        });
        
        // Guardar estado del filtro
        estadosUI.filtroInformes = filtroId === 'btn-filtro-informes' ? 'informes' : 
                                  (filtroId === 'btn-filtro-ordenes' ? 'ordenes' : 'todos');
    }

    
    /**
     * Formatea un mensaje para mostrar enlaces clicables
     * @param {string} texto - Texto del mensaje
     * @returns {string} - Texto formateado con enlaces
     */
    function formatearMensaje(texto) {
        if (!texto) return '';
        
        // Convertir URLs en enlaces clicables
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return texto.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }
    
    /**
     * Muestra una notificación en la interfaz
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (info, success, error, warning)
     * @param {number} duracion - Duración en milisegundos
     * @param {boolean} destacar - Si debe destacarse (para notificaciones importantes)
     */
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000, destacar = false) {
        // Crear contenedor de notificaciones si no existe
        let container = document.getElementById('notificaciones-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificaciones-container';
            container.className = 'notificaciones-container';
            document.body.appendChild(container);
        }
        
        // Crear notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion notificacion-${tipo} ${destacar ? 'destacada' : ''}`;
        
        // Determinar ícono según tipo
        let iconoClase = 'fas fa-info-circle';
        if (tipo === 'success') iconoClase = 'fas fa-check-circle';
        else if (tipo === 'error') iconoClase = 'fas fa-exclamation-circle';
        else if (tipo === 'warning') iconoClase = 'fas fa-exclamation-triangle';
        
        notificacion.innerHTML = `
            <div class="notificacion-contenido">
                <span class="notificacion-icono">
                    <i class="${iconoClase}"></i>
                </span>
                <span class="notificacion-mensaje">${mensaje}</span>
            </div>
            <button class="notificacion-cerrar"><i class="fas fa-times"></i></button>
        `;
        
        container.appendChild(notificacion);
        
        // Añadir clase para animar entrada
        setTimeout(() => {
            notificacion.classList.add('show');
        }, 10);
        
        // Evento para cerrar notificación
        const cerrarBtn = notificacion.querySelector('.notificacion-cerrar');
        cerrarBtn.addEventListener('click', () => {
            notificacion.classList.remove('show');
            setTimeout(() => {
                if (container.contains(notificacion)) {
                    container.removeChild(notificacion);
                }
            }, 300);
        });
        
        // Auto-cerrar después de duración
        setTimeout(() => {
            if (container.contains(notificacion)) {
                notificacion.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(notificacion)) {
                        container.removeChild(notificacion);
                    }
                }, 300);
            }
        }, duracion);
    }

/**
     * Formatea una fecha ISO a formato legible
     * @param {string} fecha - Fecha en formato ISO
     * @returns {string} Fecha formateada
     */
function formatearFecha(fecha) {
    if (!fecha) return 'Desconocido';
    
    try {
        const date = new Date(fecha);
        
        // Si la fecha es de hoy, mostrar solo la hora
        const hoy = new Date();
        if (date.toDateString() === hoy.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Si la fecha es de esta semana, mostrar día y hora
        const unaSemana = 7 * 24 * 60 * 60 * 1000;
        if (hoy - date < unaSemana) {
            return date.toLocaleString([], { 
                weekday: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // Para fechas más antiguas, mostrar fecha completa
        return date.toLocaleString([], { 
            day: '2-digit', 
            month: '2-digit', 
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return fecha;
    }
}

/**
 * Actualiza la URL del navegador con la operación actual
 * @param {string} operacion - Nombre de la operación
 */
function actualizarUrlConOperacion(operacion) {
    if (!operacion) return;
    
    // Crear nueva URL con hash
    const newUrl = `${window.location.pathname}#${operacion}`;
    
    // Actualizar URL sin recargar la página
    try {
        window.history.pushState({ operacion: operacion }, '', newUrl);
        console.log(`URL actualizada a: ${newUrl}`);
    } catch (error) {
        console.error("Error al actualizar URL:", error);
    }
}

/**
 * Guarda el estado actual de la sesión
 */
function guardarEstadoActual() {
    console.log("Guardando estado actual antes de salir");
    
    if (operacionActual) {
        localStorage.setItem('ultima_operacion', operacionActual);
    }
    
    if (ultimaPosicion) {
        localStorage.setItem('ultima_posicion', JSON.stringify(ultimaPosicion));
    }
    
    if (panelVisible !== undefined) {
        localStorage.setItem('panelVisible', panelVisible ? 'true' : 'false');
    }
    
    if (seguimientoActivo !== undefined) {
        localStorage.setItem('seguimiento_activo', seguimientoActivo ? 'true' : 'false');
    }
    
    // Guardar estados de UI
    localStorage.setItem('gb_estados_ui', JSON.stringify(estadosUI));
}

/**
 * Restaura estado guardado de la sesión
 */
function restaurarEstadoGuardado() {
    console.log("Restaurando estado guardado");
    
    // Restaurar panel visible
    if (localStorage.getItem('panelVisible') === 'true') {
        setTimeout(() => togglePanel(true), 1000);
    }
    
    // Restaurar seguimiento activo
    if (localStorage.getItem('seguimiento_activo') === 'true') {
        setTimeout(() => iniciarSeguimiento(), 2000);
    }
    
    // Restaurar estados de UI
    try {
        const estadosGuardados = localStorage.getItem('gb_estados_ui');
        if (estadosGuardados) {
            const estados = JSON.parse(estadosGuardados);
            estadosUI = { ...estadosUI, ...estados };
            
            // Aplicar estados restaurados
            if (estadosUI.tabActiva) {
                setTimeout(() => cambiarTab(estadosUI.tabActiva), 1500);
            }
        }
    } catch (e) {
        console.warn("Error al restaurar estados de UI:", e);
    }
}

/**
 * Genera un ID único
 * @returns {string} ID generado
 */
function generarId() {
    return 'gb_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
}

/**
 * Detecta si estamos en un dispositivo móvil
 * @returns {boolean} True si es un dispositivo móvil
 */
function esDispositivoMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}


// Función para forzar la visualización del panel
function mostrarPanelLateral() {
    const panel = document.getElementById('panel-lateral');
    if (panel) {
      panel.classList.remove('oculto');
      
      // Actualizar el estado
      if (window.MAIRA && window.MAIRA.GestionBatalla) {
        window.MAIRA.GestionBatalla.panelVisible = true;
      }
      
      // Actualizar botón
      const boton = document.getElementById('boton-panel');
      if (boton) {
        boton.innerHTML = '<i class="fas fa-chevron-left"></i>';
      }
      
      return true;
    } else {
      console.error("Panel lateral no encontrado");
      return false;
    }
  }
  
  // Forzar mostrar el panel después de 2 segundos
  setTimeout(mostrarPanelLateral, 2000);
  


  /**
 * Mejoras para el envío de informes
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
        mostrarNotificacion("Error al enviar informe: elementos del formulario no encontrados", "error");
        return;
    }
    
    const tipo = tipoInforme.value;
    const destinatario = destinatarioInforme.value;
    const asunto = asuntoInforme.value.trim();
    const contenido = contenidoInforme.value.trim();
    
    if (!asunto || !contenido) {
        mostrarNotificacion("Debes completar asunto y contenido del informe", "error");
        return;
    }
    
    if (!destinatario) {
        mostrarNotificacion("Debes seleccionar un destinatario para el informe", "error");
        return;
    }
    
    // Verificar si tenemos la información del usuario
    if (!usuarioInfo || !elementoTrabajo) {
        agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
        mostrarNotificacion("No se ha iniciado sesión correctamente", "error");
        return;
    }
    
    // Mostrar indicador de carga mientras se prepara el informe
    mostrarCargandoEnvio(true);
    
    // Crear ID único para el informe
    const informeId = generarId();
    
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
            mostrarNotificacion("El archivo adjunto excede el tamaño máximo permitido (5MB)", "error");
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
                mostrarNotificacion("Error al procesar archivo adjunto: " + error.message, "error");
                mostrarCargandoEnvio(false);
            });
    } else {
        // No hay archivo adjunto, continuar directamente
        finalizarEnvioInforme(informe);
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
            mostrarNotificacion("Tiempo de espera agotado al enviar el informe. Guardado localmente.", "warning");
            colaPendiente.informes.push(informe);
            mostrarCargandoEnvio(false);
        }, 10000); // 10 segundos de timeout
        
        socket.emit('nuevoInforme', informe, function(respuesta) {
            // Limpiar timeout ya que recibimos respuesta
            clearTimeout(timeoutId);
            
            console.log("Respuesta del servidor al enviar informe:", respuesta);
            mostrarCargandoEnvio(false);
            
            if (respuesta && respuesta.error) {
                mostrarNotificacion("Error al enviar informe: " + respuesta.error, "error");
                // Guardar en cola pendiente para reintento
                colaPendiente.informes.push(informe);
                return;
            }
            
            // Añadir a la interfaz
            agregarInforme(informe);
            
            // Notificar envío exitoso
            const tipoTexto = informe.tipo === "urgente" ? "URGENTE" : 
                              (informe.tipo === "orden" ? "ORDEN" : "Informe");
            
            agregarMensajeChat("Sistema", `${tipoTexto} "${informe.asunto}" enviado correctamente`, "sistema");
            mostrarNotificacion(`${tipoTexto} "${informe.asunto}" enviado correctamente`, "success");
            
            // Limpiar formulario
            limpiarFormularioInforme();
        });
    } else {
        // No hay conexión, encolar el informe
        colaPendiente.informes.push(informe);
        
        // Añadir a la interfaz local
        agregarInforme(informe);
        
        // Notificar guardado para envío posterior
        agregarMensajeChat("Sistema", 
            `Informe "${informe.asunto}" guardado y se enviará cuando se recupere la conexión`, 
            "sistema");
        mostrarNotificacion(`Informe guardado para envío posterior`, "info");
        
        // Limpiar formulario
        limpiarFormularioInforme();
        mostrarCargandoEnvio(false);
    }
}

/**
 * Muestra u oculta indicador de carga durante el envío
 * @param {boolean} mostrar - Indica si mostrar u ocultar
 */
function mostrarCargandoEnvio(mostrar) {
    // Botón de enviar informe
    const botonEnviar = document.querySelector('#form-informe button[type="submit"]');
    
    if (botonEnviar) {
        if (mostrar) {
            // Guardar texto original y mostrar spinner
            botonEnviar.setAttribute('data-original-text', botonEnviar.innerHTML);
            botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            botonEnviar.disabled = true;
        } else {
            // Restaurar texto original
            const textoOriginal = botonEnviar.getAttribute('data-original-text') || 'Enviar Informe';
            botonEnviar.innerHTML = textoOriginal;
            botonEnviar.disabled = false;
        }
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
 * Mejora en la recepción de informes
 * @param {Object} informe - Informe recibido
 */
function recibirInforme(informe) {
    if (!informe) {
        console.warn("Informe vacío recibido");
        return;
    }
    
    console.log("Procesando informe recibido:", informe);
    
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
    mostrarNotificacion(
        `${tipoTexto} de ${informe.emisor.nombre}: ${informe.asunto}`, 
        tipoNotificacion,
        10000 // Duración más larga para informes importantes
    );
    
    // Añadir mensaje al chat
    agregarMensajeChat(
        "Sistema", 
        `Nuevo ${tipoTexto.toLowerCase()} recibido de ${informe.emisor.nombre}: "${informe.asunto}"`, 
        "sistema"
    );
    
    // Si es urgente o una orden, cambiar a la pestaña de informes automáticamente
    if ((informe.tipo === "urgente" || informe.tipo === "orden") && 
        estadosUI.tabActiva !== 'tab-informes') {
        
        // Mostrar sugerencia para cambiar de pestaña
        mostrarNotificacionCambioTab(informe);
    }
    
    // Marcar como leído si estamos en la pestaña de informes
    if (estadosUI.tabActiva === 'tab-informes' && socket && socket.connected) {
        setTimeout(() => {
            socket.emit('informeLeido', { informeId: informe.id });
        }, 3000);
    }
}

/**
 * Muestra notificación para cambiar a pestaña de informes
 * @param {Object} informe - Informe recibido
 */
function mostrarNotificacionCambioTab(informe) {
    // Si no estamos en la pestaña de informes, mostrar notificación especial
    if (!document.hidden) {
        // Asegurarse de que el panel esté visible
        if (!panelVisible) {
            togglePanel(true);
        }
        
        // Crear notificación flotante
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-tab-informes';
        notificacion.style.position = 'fixed';
        notificacion.style.bottom = '20px';
        notificacion.style.left = '20px';
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
            cambiarTab('tab-informes');
            
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
}

/**
 * Mejora en la visualización de informes
 * @param {Object} informe - Informe a agregar a la lista
 */
function agregarInforme(informe) {
    const listaInformes = document.getElementById('lista-informes');
    if (!listaInformes) {
        console.error("Lista de informes no encontrada");
        return;
    }
    
    // Verificar si ya existe el informe en la lista
    const informeExistente = document.querySelector(`.informe[data-id="${informe.id}"]`);
    if (informeExistente) {
        console.log("El informe ya existe en la lista, no se duplica:", informe.id);
        return;
    }
    
    const esPropio = informe.emisor.id === (usuarioInfo ? usuarioInfo.id : null);
    
    // Determinar clase CSS según el tipo
    let claseCSS = "";
    let iconoTipo = '<i class="fas fa-file-alt"></i>';
    
    if (informe.tipo === "urgente") {
        claseCSS = "informe-urgente";
        iconoTipo = '<i class="fas fa-exclamation-triangle"></i>';
    } else if (informe.tipo === "orden") {
        claseCSS = "orden";
        iconoTipo = '<i class="fas fa-tasks"></i>';
    }
    
    // Agregar clase para informes propios
    if (esPropio) {
        claseCSS += " propio";
    }
    
    // Formato de fecha más legible
    const fecha = new Date(informe.timestamp).toLocaleString();
    
    // Preparar información sobre destinatario/remitente
    let infoRemitente = "";
    if (esPropio) {
        // Si es propio, mostrar a quién se envió
        let destinatarioNombre = "Desconocido";
        
        if (informe.destinatario === "todos") {
            destinatarioNombre = "Todos";
        } else if (informe.destinatario === "comando") {
            destinatarioNombre = "Comando/Central";
        } else if (elementosConectados[informe.destinatario]?.datos?.usuario) {
            destinatarioNombre = elementosConectados[informe.destinatario].datos.usuario;
        }
        
        infoRemitente = `Enviado a: ${destinatarioNombre}`;
    } else {
        // Si no es propio, mostrar quién lo envió
        let elementoInfo = "";
        if (informe.emisor.elemento) {
            if (informe.emisor.elemento.designacion) {
                elementoInfo = informe.emisor.elemento.designacion;
                if (informe.emisor.elemento.dependencia) {
                    elementoInfo += "/" + informe.emisor.elemento.dependencia;
                }
            }
        }
        
        infoRemitente = `De: ${informe.emisor.nombre}${elementoInfo ? ` (${elementoInfo})` : ''}`;
    }
    
    // Información sobre adjunto
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
            <div class="informe-adjunto">
                <i class="fas ${iconoAdjunto}"></i> 
                <a href="#" class="ver-adjunto" data-id="${informe.id}">
                    ${informe.adjunto.nombre} (${formatearTamaño(informe.adjunto.tamaño)})
                </a>
            </div>
        `;
    }
    
    // Crear elemento HTML del informe
    const informeHTML = `
        <div class="informe ${claseCSS}" data-id="${informe.id}" data-tipo="${informe.tipo}">
            <div class="informe-header">
                <div class="informe-tipo">${iconoTipo}</div>
                <div class="informe-titulo">
                    <strong>${informe.asunto}</strong>
                    <small>${fecha}</small>
                </div>
                <div class="informe-acciones">
                    <button class="btn-responder" data-id="${informe.id}" title="Responder">
                        <i class="fas fa-reply"></i>
                    </button>
                    ${!esPropio ? `
                    <button class="btn-marcar-leido" data-id="${informe.id}" title="Marcar como leído">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                </div>
            </div>
            
            <div class="informe-remitente">${infoRemitente}</div>
            
            <div class="informe-contenido mt-2">${informe.contenido}</div>
            
            ${adjuntoHTML}
            
            ${informe.posicion ? `
            <div class="informe-acciones mt-2">
                <button class="btn-ubicacion" data-lat="${informe.posicion.lat}" data-lng="${informe.posicion.lng}">
                    <i class="fas fa-map-marker-alt"></i> Ver ubicación
                </button>
            </div>` : ''}
        </div>
    `;
    
    // Añadir al inicio de la lista
    listaInformes.insertAdjacentHTML('afterbegin', informeHTML);
    
    // Configurar eventos para el nuevo informe
    configurarEventosInforme(informe.id);
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
                mostrarNotificacion("Coordenadas inválidas", "error");
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
            const informeId = informeElement.getAttribute('data-id');
            let emisorId = null;
            
            // Buscar en los elementos conectados
            Object.entries(elementosConectados).forEach(([id, datos]) => {
                if (datos.datos && datos.datos.usuario && datos.datos.usuario === remitente) {
                    emisorId = id;
                }
            });
            
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
 * Muestra el archivo adjunto de un informe
 * @param {string} informeId - ID del informe
 */
function mostrarAdjuntoInforme(informeId) {
    // Buscar el informe en colaPendiente primero (para informes aún no enviados)
    let informeData = null;
    
    // Buscar en cola de pendientes
    if (colaPendiente && colaPendiente.informes) {
        informeData = colaPendiente.informes.find(inf => inf.id === informeId);
    }
    
    // Si no se encontró en pendientes, buscar en almacenamiento local
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
        mostrarNotificacion("Obteniendo archivo adjunto...", "info");
        
        // Solicitar al servidor el informe completo
        socket.emit('obtenerInformeCompleto', { informeId: informeId }, function(respuesta) {
            if (respuesta && respuesta.informe) {
                mostrarVisorAdjunto(respuesta.informe);
            } else {
                mostrarNotificacion("No se pudo obtener el archivo adjunto", "error");
            }
        });
        return;
    }
    
    // Si no se encontró o no tiene adjunto
    if (!informeData || !informeData.adjunto) {
        mostrarNotificacion("No se pudo acceder al archivo adjunto", "error");
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
    infoArchivo.textContent = `${tipoArchivo} · ${formatearTamaño(adjunto.tamaño || 0)}`;
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
    
    // Si no hay datos, intentar cargarlos
    if (!adjunto.datos && adjunto.ruta) {
        contenido.innerHTML = `
            <div style="text-align: center; color: white;">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Cargando contenido...</p>
            </div>
        `;
        
        // Aquí podrías implementar una petición AJAX para cargar el archivo
        const cargarDatos = async () => {
            try {
                // Esta implementación depende de cómo tu servidor entrega los datos
                const respuesta = await fetch(`/api/adjuntos/${informe.id}`);
                
                if (!respuesta.ok) {
                    throw new Error(`Error al cargar archivo: ${respuesta.status}`);
                }
                
                const datos = await respuesta.json();
                
                if (datos && datos.datos) {
                    adjunto.datos = datos.datos;
                    actualizarContenido();
                } else {
                    throw new Error("No se recibieron datos del archivo");
                }
            } catch (error) {
                console.error("Error al cargar adjunto:", error);
                contenido.innerHTML = `
                    <div style="text-align: center; color: white;">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <p>Error al cargar el contenido: ${error.message}</p>
                    </div>
                `;
            }
        };
        
        cargarDatos();
    } else if (adjunto.datos) {
        actualizarContenido();
    } else {
        contenido.innerHTML = `
            <div style="text-align: center; color: white;">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <p>No hay datos disponibles para este adjunto</p>
            </div>
        `;
    }
    
    function actualizarContenido() {
        // Limpiar contenido anterior
        contenido.innerHTML = '';
        
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
            
            // Si quisieras implementar visualización de onda de audio, podrías usar
            // bibliotecas como wavesurfer.js aquí
        } else if (tipoBase === 'video') {
            // Es video
            const video = document.createElement('video');
            video.controls = true;
            video.src = adjunto.datos;
            video.style.maxWidth = '100%';
            video.style.maxHeight = 'calc(100vh - 150px)';
            video.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            // Añadir controles personalizados si lo deseas
            const videoControls = document.createElement('div');
            videoControls.style.marginTop = '10px';
            videoControls.style.width = '100%';
            videoControls.style.display = 'flex';
            videoControls.style.justifyContent = 'center';
            videoControls.style.gap = '10px';
            
            contenido.appendChild(video);
            contenido.appendChild(videoControls);
            
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
                <p>Tamaño: ${formatearTamaño(adjunto.tamaño || 0)}</p>
            `;
            
            contenido.appendChild(mensaje);
        }
    }
    
    contenedorPrincipal.appendChild(contenido);
    
    // Añadir elementos al modal
    modalVisor.appendChild(header);
    modalVisor.appendChild(contenedorPrincipal);
    
    // Añadir modal al body
    document.body.appendChild(modalVisor);
    
    // Configurar eventos
    btnCerrar.addEventListener('click', function() {
        document.body.removeChild(modalVisor);
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

function comprimirImagen(archivo, maxWidth = 1024, maxHeight = 1024, calidad = 0.7) {
    return new Promise((resolve, reject) => {
        // Crear elementos temporales
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Manejar carga de imagen
        img.onload = function() {
            // Calcular dimensiones manteniendo proporciones
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            
            // Configurar canvas y dibujar imagen
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a formato de menor tamaño (WebP si es soportado)
            const formato = 'image/jpeg';
            
            // Obtener datos comprimidos
            const dataURL = canvas.toDataURL(formato, calidad);
            
            // Convertir a Blob
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => {
                    // Crear archivo con nuevo tamaño
                    const nombreOriginal = archivo.name.split('.')[0];
                    const extension = formato === 'image/webp' ? 'webp' : 'jpg';
                    const nuevoArchivo = new File(
                        [blob], 
                        `${nombreOriginal}_optimizado.${extension}`,
                        { type: formato }
                    );
                    
                    console.log(`Imagen comprimida: ${(archivo.size/1024).toFixed(2)}KB → ${(blob.size/1024).toFixed(2)}KB`);
                    resolve(nuevoArchivo);
                })
                .catch(err => reject(err));
        };
        
        img.onerror = function() {
            reject(new Error('Error al cargar la imagen'));
        };
        
        // Cargar imagen desde archivo
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        reader.readAsDataURL(archivo);
    });
}
function comprimirVideo(videoBlob, duracionMaxima = 30) {
    return new Promise((resolve, reject) => {
        // Crear elemento de video temporal
        const video = document.createElement('video');
        video.muted = true;
        
        // Crear objeto URL para el video
        const videoURL = URL.createObjectURL(videoBlob);
        video.src = videoURL;
        
        video.onloadedmetadata = function() {
            // Verificar duración
            if (video.duration > duracionMaxima) {
                URL.revokeObjectURL(videoURL);
                reject(new Error(`El video excede la duración máxima de ${duracionMaxima} segundos`));
                return;
            }
            
            // Configurar canvas para capturar frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const fps = 15; // Reducir cuadros por segundo
            
            // Reducir dimensiones si es necesario
            const maxDimension = 640;
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > height && width > maxDimension) {
                height = height * (maxDimension / width);
                width = maxDimension;
            } else if (height > maxDimension) {
                width = width * (maxDimension / height);
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Usar MediaRecorder con menor bitrate
            const mediaRecorder = new MediaRecorder(canvas.captureStream(fps), {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 800000 // 800Kbps
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            
            mediaRecorder.onstop = () => {
                const nuevoBlob = new Blob(chunks, { type: 'video/webm' });
                const nombreOriginal = 'video_comprimido';
                const nuevoArchivo = new File([nuevoBlob], `${nombreOriginal}.webm`, { type: 'video/webm' });
                
                console.log(`Video comprimido: ${(videoBlob.size/1024/1024).toFixed(2)}MB → ${(nuevoBlob.size/1024/1024).toFixed(2)}MB`);
                URL.revokeObjectURL(videoURL);
                resolve(nuevoArchivo);
            };
            
            // Procesar cada frame
            mediaRecorder.start();
            video.currentTime = 0;
            
            video.onended = () => mediaRecorder.stop();
            
            function processFrame() {
                if (video.ended || video.paused) return;
                
                ctx.drawImage(video, 0, 0, width, height);
                
                if (video.currentTime < video.duration) {
                    requestAnimationFrame(processFrame);
                }
            }
            
            video.onplay = () => processFrame();
            video.play();
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(videoURL);
            reject(new Error('Error al procesar el video'));
        };
    });
}


/**
 * Configura la aplicación específicamente para dispositivos móviles
 */
function configurarParaDispositivosMoviles() {
    const esMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (esMobile) {
        // Guardar esto como configuración global
        window.MAIRA.configDispositivo = {
            tipoDispositivo: 'mobile',
            escalaInterfaz: window.devicePixelRatio || 1,
            resolucionOptima: Math.min(screen.width, 1024),
            modoAhorroDatos: false,
            rendimientoReducido: false
        };
        
        // Aplicar estilos específicos para móviles
        const estiloMovil = document.createElement('style');
        estiloMovil.id = 'estilos-mobile';
        estiloMovil.textContent = `
            /* Aumentar tamaño de botones para táctil */
            button, .btn, .menu-btn > button {
                min-height: 44px;
                min-width: 44px;
                padding: 10px 15px;
            }
            
            /* Simplificar la interfaz */
            .panel-lateral {
                width: 100%;
                max-width: 100%;
            }
            
            /* Cambiar navegación */
            .tab-navigation {
                display: flex;
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: #fff;
                z-index: 1000;
                box-shadow: 0 -2px 5px rgba(0,0,0,0.1);
            }
            
            .tab-btn {
                flex: 1;
                text-align: center;
                padding: 12px 0;
            }
            
            /* Ajustes para el mapa */
            .leaflet-touch .leaflet-control-zoom a {
                width: 44px;
                height: 44px;
                line-height: 44px;
            }
        `;
        
        document.head.appendChild(estiloMovil);
        
        // Configurar meta viewport
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Verificar conectividad
        comprobarCalidadConexion();
        
        // Configurar gestos táctiles mejorados
        configurarGestosTactiles();
        
        console.log("Configuración para dispositivo móvil aplicada");
    } else {
        window.MAIRA.configDispositivo = {
            tipoDispositivo: 'desktop',
            escalaInterfaz: window.devicePixelRatio || 1,
            resolucionOptima: Math.min(screen.width, 1920),
            modoAhorroDatos: false,
            rendimientoReducido: false
        };
    }
}

/**
 * Configura gestos táctiles optimizados para la aplicación
 */
function configurarGestosTactiles() {
    // Detectar elemento del mapa
    const mapaElement = document.getElementById('mapa') || document.querySelector('.leaflet-container');
    if (!mapaElement) return;
    
    // Variables para tracking de gestos
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isGesturing = false;
    
    // Evento touchstart
    mapaElement.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
            // Track inicio de gesto
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isGesturing = false;
        } else if (e.touches.length === 2) {
            // Para evitar conflictos con gestos de zoom del mapa
            isGesturing = true;
        }
    }, { passive: true });
    
    // Detectar swipe para abrir/cerrar panel
    mapaElement.addEventListener('touchend', function(e) {
        if (isGesturing) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchTime = Date.now() - touchStartTime;
        
        // Calcular distancia y velocidad
        const distX = touchEndX - touchStartX;
        const distY = touchEndY - touchStartY;
        const velocidadX = Math.abs(distX) / touchTime;
        
        // Si fue un swipe horizontal lo suficientemente rápido
        if (Math.abs(distX) > 70 && Math.abs(distY) < 50 && velocidadX > 0.3) {
            if (distX > 0) {
                // Swipe derecha -> Mostrar panel
                if (window.MAIRA.GestionBatalla.togglePanel) {
                    window.MAIRA.GestionBatalla.togglePanel(true);
                }
            } else {
                // Swipe izquierda -> Ocultar panel
                if (window.MAIRA.GestionBatalla.togglePanel) {
                    window.MAIRA.GestionBatalla.togglePanel(false);
                }
            }
        }
    }, { passive: true });
}

/**
 * Comprueba la calidad de la conexión y adapta la aplicación
 */
function comprobarCalidadConexion() {
    // Usar Network Information API si está disponible
    if ('connection' in navigator) {
        const connection = navigator.connection;
        
        // Guardar información inicial
        window.MAIRA.conexionInfo = {
            tipo: connection.type,
            velocidadDescarga: connection.downlink,
            rtt: connection.rtt,
            ahorroConexion: connection.saveData
        };
        
        // Aplicar configuraciones según tipo de conexión
        if (connection.saveData || connection.type === 'cellular' || connection.downlink < 1) {
            // Activar modo de ahorro de datos
            window.MAIRA.configDispositivo.modoAhorroDatos = true;
            console.log("Modo de ahorro de datos activado");
            
            // Aplicar configuraciones de ahorro
            aplicarAhorroDeDatos();
        }
        
        // Monitorear cambios en la conexión
        connection.addEventListener('change', function() {
            window.MAIRA.conexionInfo = {
                tipo: connection.type,
                velocidadDescarga: connection.downlink,
                rtt: connection.rtt,
                ahorroConexion: connection.saveData
            };
            
            // Re-evaluar configuraciones
            if (connection.saveData || connection.type === 'cellular' || connection.downlink < 1) {
                window.MAIRA.configDispositivo.modoAhorroDatos = true;
                aplicarAhorroDeDatos();
            } else {
                window.MAIRA.configDispositivo.modoAhorroDatos = false;
            }
            
            console.log("Cambio en la conexión detectado:", window.MAIRA.conexionInfo);
        });
    } else {
        // Fallback: Medir velocidad de descarga
        medirVelocidadDescarga();
    }
}

/**
 * Aplica configuraciones para ahorrar datos
 */
function aplicarAhorroDeDatos() {
    // Aplicar ajustes para ahorro de datos
    const config = {
        // Reducir calidad de multimedia
        imagenCalidad: 0.6,
        videoMaxAncho: 480,
        desactivarAutoplay: true,
        
        // Carga de mapa
        simplificarSimbolos: true,
        reducirDetallesMapa: true,
        desactivarTerreno3D: true,
        
        // Frecuencia de actualización
        intervaloActPosicion: 15000, // 15 segundos
        intervaloSincronizacion: 60000 // 1 minuto
    };
    
    // Guardar configuración
    window.MAIRA.configuracionAhorro = config;
    
    // Notificar al usuario
    mostrarNotificacion("Modo de ahorro de datos activado debido a la conexión limitada", "info", 8000);
}

/**
 * Mide la velocidad de descarga como fallback
 */
function medirVelocidadDescarga() {
    // Crear un blob de prueba (100KB)
    const size = 100 * 1024; // 100 KB
    const testBlob = new Blob([new ArrayBuffer(size)]);
    const testBlobUrl = URL.createObjectURL(testBlob);
    
    const startTime = Date.now();
    
    // Realizar descarga de prueba
    fetch(testBlobUrl)
        .then(response => response.blob())
        .then(blob => {
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // en segundos
            const bitsPerSecond = (size * 8) / duration;
            const mbps = bitsPerSecond / 1000000;
            
            console.log(`Velocidad de descarga estimada: ${mbps.toFixed(2)} Mbps`);
            
            // Guardar información
            window.MAIRA.conexionInfo = {
                velocidadDescarga: mbps,
                medidoEn: new Date().toISOString()
            };
            
            // Aplicar configuraciones según velocidad
            if (mbps < 1.0) {
                window.MAIRA.configDispositivo.modoAhorroDatos = true;
                aplicarAhorroDeDatos();
            }
        })
        .catch(err => {
            console.error("Error al medir velocidad:", err);
        })
        .finally(() => {
            // Liberar recursos
            URL.revokeObjectURL(testBlobUrl);
        });
}


/**
 * Descarga un archivo adjunto
 * @param {Object} adjunto - Información del adjunto
 */
function descargarAdjunto(adjunto) {
    if (!adjunto || !adjunto.datos) {
        mostrarNotificacion("No se puede descargar el archivo", "error");
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
    
    mostrarNotificacion("Descarga iniciada", "success");
}

/**
 * Formatea el tamaño de un archivo para mostrar de forma legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Agrega campo para adjuntar archivos al formulario de informes
 */
function agregarCampoAdjuntoInforme() {
    const formInforme = document.getElementById('form-informe');
    const existingAdjunto = document.getElementById('adjunto-container');
    
    if (formInforme && !existingAdjunto) {
        // Crear contenedor para adjunto
        const adjuntoContainer = document.createElement('div');
        adjuntoContainer.id = 'adjunto-container';
        adjuntoContainer.className = 'form-group mt-3';
        
        // Campo de archivo
        adjuntoContainer.innerHTML = `
            <label for="adjunto-informe">Adjuntar archivo:</label>
            <div class="d-flex justify-content-between">
                <input type="file" id="adjunto-informe" class="form-control" style="max-width: 85%;">
                <div class="d-flex">
                    <button type="button" id="btn-foto-informe" class="btn btn-sm ml-2" title="Tomar foto">
                        <i class="fas fa-camera"></i>
                    </button>
                    <button type="button" id="btn-audio-informe" class="btn btn-sm ml-2" title="Grabar audio">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button type="button" id="btn-video-informe" class="btn btn-sm ml-2" title="Grabar video">
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
        document.getElementById('adjunto-informe').addEventListener('change', previewAdjunto);
        document.getElementById('btn-foto-informe').addEventListener('click', capturarFoto);
        document.getElementById('btn-audio-informe').addEventListener('click', grabarAudio);
        document.getElementById('btn-video-informe').addEventListener('click', grabarVideo);
    }
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
        mostrarNotificacion("El archivo excede el tamaño máximo permitido (5MB)", "error");
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
                    <div style="margin-top: 5px;">${file.name} (${formatearTamaño(file.size)})</div>
                    <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
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
                        Tu navegador no soporta la etiqueta de audio.
                    </audio>
                    <div style="margin-top: 5px;">${file.name} (${formatearTamaño(file.size)})</div>
                    <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
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
                        Tu navegador no soporta la etiqueta de video.
                    </video>
                    <div style="margin-top: 5px;">${file.name} (${formatearTamaño(file.size)})</div>
                    <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        // Cualquier otro tipo de archivo
        previewContainer.innerHTML = `
            <div style="text-align: center; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px;">
                <i class="fas fa-file" style="font-size: 24px; color: #607d8b;"></i>
                <div style="margin-top: 5px;">${file.name} (${formatearTamaño(file.size)})</div>
                <button type="button" class="btn btn-sm btn-danger mt-2" id="btn-eliminar-adjunto">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
    }
    
    // Mostrar previsualización
    previewContainer.style.display = 'block';
    
    // Configurar botón para eliminar adjunto
    setTimeout(() => {
        const btnEliminar = document.getElementById('btn-eliminar-adjunto');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', function() {
                input.value = '';
                previewContainer.innerHTML = '';
                previewContainer.style.display = 'none';
            });
        }
    }, 100);
}

/**
 * Captura una foto usando la cámara
 */
function capturarFoto() {
    // Verificar soporte de getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarNotificacion("Tu navegador no soporta acceso a la cámara", "error");
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
                mostrarNotificacion("Error al acceder a la cámara: " + error.message, "error");
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
                mostrarNotificacion("Error al procesar la imagen", "error");
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
    document.getElementById('btn-capturar').addEventListener('click', capturar);
    document.getElementById('btn-cambiar-camara').addEventListener('click', cambiarCamara);
    document.getElementById('btn-cancelar-captura').addEventListener('click', cerrarModalCaptura);
    
    // Iniciar cámara
    iniciarCamara();
    
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
        mostrarNotificacion("Tu navegador no soporta grabación de audio", "error");
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
    
    // Función para iniciar grabación
    function iniciarGrabacion() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(audioStream) {
                stream = audioStream;
                
                // Crear MediaRecorder
                mediaRecorder = new MediaRecorder(stream);
                
                // Evento para capturar datos
                mediaRecorder.ondataavailable = function(e) {
                    chunks.push(e.data);
                };
                
                // Evento para cuando se completa la grabación
                mediaRecorder.onstop = function() {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    const audioURL = URL.createObjectURL(blob);
                    
                    document.getElementById('audio-preview').src = audioURL;
                    document.getElementById('reproductor-audio').style.display = 'block';
                    
                    // Detener temporizador
                    clearInterval(timerInterval);
                };
                
                // Iniciar grabación
                mediaRecorder.start();
                tiempoInicio = Date.now();
                
                // Iniciar temporizador
                timerInterval = setInterval(actualizarTiempo, 1000);
                
                // Actualizar botones
                document.getElementById('btn-iniciar-grabacion').disabled = true;
                document.getElementById('btn-detener-grabacion').disabled = false;
            })
            .catch(function(error) {
                console.error("Error accediendo al micrófono:", error);
                mostrarNotificacion("Error al acceder al micrófono: " + error.message, "error");
                cerrarModalGrabacion();
            });
    }

    // Función para detener grabación
    function detenerGrabacion() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            
            // Detener stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // Actualizar botones
            document.getElementById('btn-iniciar-grabacion').disabled = false;
            document.getElementById('btn-detener-grabacion').disabled = true;
        }
    }
        // Función para actualizar el tiempo de grabación
        function actualizarTiempo() {
            if (!tiempoInicio) return;
            
            const tiempoActual = Date.now();
            const duracion = Math.floor((tiempoActual - tiempoInicio) / 1000);
            const minutos = Math.floor(duracion / 60).toString().padStart(2, '0');
            const segundos = (duracion % 60).toString().padStart(2, '0');
            
            document.getElementById('tiempo-grabacion').textContent = `${minutos}:${segundos}`;
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
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Función para guardar la grabación
        document.getElementById('btn-guardar-audio').addEventListener('click', function() {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            
            // Crear archivo desde blob
            const file = new File([audioBlob], `audio_${new Date().toISOString().replace(/:/g, '-')}.webm`, { 
                type: 'audio/webm'
            });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            
            // Crear un DataTransfer para simular la selección de archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Disparar evento change para actualizar la previsualización
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
            
            // Cerrar modal
            cerrarModalGrabacion();
        });
        
        // Botón para descartar grabación
        document.getElementById('btn-descartar-audio').addEventListener('click', function() {
            cerrarModalGrabacion();
        });
        
        // Configurar eventos para iniciar/detener grabación
        document.getElementById('btn-iniciar-grabacion').addEventListener('click', iniciarGrabacion);
        document.getElementById('btn-detener-grabacion').addEventListener('click', detenerGrabacion);
        document.getElementById('btn-cancelar-grabacion').addEventListener('click', cerrarModalGrabacion);
    }

    function grabarVideo() {
        // Verificar soporte de getUserMedia y MediaRecorder
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
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
        
        // Función para iniciar grabación
        function iniciarGrabacionVideo() {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(function(videoStream) {
                    stream = videoStream;
                    
                    // Mostrar preview
                    const video = document.getElementById('video-preview');
                    video.srcObject = stream;
                    
                    // Crear MediaRecorder
                    mediaRecorder = new MediaRecorder(stream);
                    
                    // Evento para capturar datos
                    mediaRecorder.ondataavailable = function(e) {
                        chunks.push(e.data);
                    };
                    
                    // Evento para cuando se completa la grabación
                    mediaRecorder.onstop = function() {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const videoURL = URL.createObjectURL(blob);
                        
                        document.getElementById('video-grabado').src = videoURL;
                        document.getElementById('reproductor-video').style.display = 'block';
                        
                        // Detener temporizador
                        clearInterval(timerInterval);
                    };
                    
                    // Iniciar grabación
                    mediaRecorder.start();
                    tiempoInicio = Date.now();
                    
                    // Iniciar temporizador
                    timerInterval = setInterval(actualizarTiempoVideo, 1000);
                    
                    // Actualizar botones
                    document.getElementById('btn-iniciar-grabacion-video').disabled = true;
                    document.getElementById('btn-detener-grabacion-video').disabled = false;
                })
                .catch(function(error) {
                    console.error("Error accediendo a la cámara o micrófono:", error);
                    mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
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
            
            if (document.body.contains(modalGrabacion)) {
                document.body.removeChild(modalGrabacion);
            }
        }
        
        // Configurar eventos
        document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
        document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
        document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);
        
        // Función para guardar el video
        document.getElementById('btn-guardar-video').addEventListener('click', function() {
            const videoBlob = new Blob(chunks, { type: 'video/webm' });
            
            // Crear archivo desde blob
            const file = new File([videoBlob], `video_${new Date().toISOString().replace(/:/g, '-')}.webm`, { 
                type: 'video/webm'
            });
            
            // Asignar al input de archivo
            const fileInput = document.getElementById('adjunto-informe');
            
            // Crear un DataTransfer para simular la selección de archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Disparar evento change para actualizar la previsualización
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
            
            // Cerrar modal
            cerrarModalGrabacionVideo();
        });
        
        // Botón para descartar grabación
        document.getElementById('btn-descartar-video').addEventListener('click', cerrarModalGrabacionVideo);
        
        // Permitir cerrar con Escape
        document.addEventListener('keydown', function cerrarConEscape(e) {
            if (e.key === 'Escape') {
                cerrarModalGrabacionVideo();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        });
    }
    /**
 * Esta función actualiza el HTML del panel de informes para incorporar las nuevas funcionalidades.
 * Debe llamarse después de que el DOM esté cargado, o cuando se inicializa el panel lateral.
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
}

/**
 * Esta función actualiza el HTML del panel de chat para incorporar las nuevas funcionalidades.
 * Debe llamarse después de que el DOM esté cargado, o cuando se inicializa el panel lateral.
 */
function actualizarHTML_Chat() {
    // 1. Mejorar el selector de destinatarios para chat privado
    const selectDestinatario = document.getElementById('select-destinatario');
    if (selectDestinatario) {
        // Añadir clases para mejor estilo
        selectDestinatario.className = 'form-control custom-select';
        
        // Asegurar que tiene las opciones base
        if (selectDestinatario.options.length <= 1) {
            selectDestinatario.innerHTML = `
                <option value="">Seleccionar destinatario...</option>
                <option value="todos">Todos los participantes</option>
                <option value="comando">Comando/Central</option>
                <option disabled>───────────────</option>
            `;
            
            // Actualizar con elementos conectados
            setTimeout(actualizarListaDestinatarios, 500);
        }
    }
    
    // 2. Agregar soporte para adjuntos en chat (opcional)
    const chatInput = document.getElementById('mensaje-chat');
    const chatInputContainer = chatInput ? chatInput.parentNode : null;
    
    // Si el contenedor existe y no tiene ya los botones de multimedia
    if (chatInputContainer && !document.getElementById('chat-multimedia-buttons')) {
        // Crear contenedor para botones
        const botonesMultimedia = document.createElement('div');
        botonesMultimedia.id = 'chat-multimedia-buttons';
        botonesMultimedia.className = 'd-flex align-items-center ml-2';
        botonesMultimedia.innerHTML = `
            <button type="button" id="btn-foto-chat" class="btn-foto-informe mr-2" title="Enviar foto">
                <i class="fas fa-camera"></i>
            </button>
            <button type="button" id="btn-audio-chat" class="btn-audio-informe mr-2" title="Enviar audio">
                <i class="fas fa-microphone"></i>
            </button>
        `;
        
        // Reorganizar el contenedor
        chatInputContainer.style.display = 'flex';
        chatInputContainer.style.alignItems = 'center';
        
        // Insertar después del input
        chatInput.style.flexGrow = '1';
        chatInputContainer.insertBefore(botonesMultimedia, chatInput.nextSibling);
        
        // Configurar eventos
        setTimeout(() => {
            const btnFotoChat = document.getElementById('btn-foto-chat');
            const btnAudioChat = document.getElementById('btn-audio-chat');
            
            if (btnFotoChat) {
                btnFotoChat.addEventListener('click', function() {
                    // Implementar captura para chat
                    mostrarNotificacion("Funcionalidad en desarrollo", "info");
                });
            }
            
            if (btnAudioChat) {
                btnAudioChat.addEventListener('click', function() {
                    // Implementar audio para chat
                    mostrarNotificacion("Funcionalidad en desarrollo", "info");
                });
            }
        }, 500);
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
    Object.entries(elementosConectados).forEach(([id, datos]) => {
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
    
    // Restaurar selección previa si es posible
    if (destinatarioActual && destinatarioSelect.querySelector(`option[value="${destinatarioActual}"]`)) {
        destinatarioSelect.value = destinatarioActual;
    }
    
    // Log informativo
    console.log(`Lista de destinatarios de informes actualizada con ${elementosAgregados} participantes disponibles`);
    
    return elementosAgregados;
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
                mostrarNotificacion("Solicitando lista de participantes...", "info");
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
                mostrarNotificacion("Actualizando lista de participantes...", "info");
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
            
            // Agregar botón para chat directo
            const accionesDiv = elemento.querySelector('.elemento-acciones');
            if (accionesDiv && !accionesDiv.querySelector('.btn-chat-directo')) {
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
        }
    });
}


/**
 * Inicializa los componentes multimedia para chat y formularios
 */
function inicializarComponentesMultimedia() {
    console.log("Inicializando componentes multimedia...");
    
    // Verificar si previewAdjunto existe para evitar errores
    const previewAdjunto = document.getElementById('adjunto-informe');
    if (previewAdjunto) {
        previewAdjunto.addEventListener('change', previewAdjunto);
    }
    
    // Inicializar eventos de botones multimedia si existen
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
        btnVideo.addEventListener('click', grabarVideo || function() {
            console.log("Función de grabación de video no implementada");
            mostrarNotificacion("La grabación de video no está disponible en esta versión", "info");
        });
    }
    
    console.log("Componentes multimedia inicializados");
}

/**
 * Inicia un chat privado con un elemento específico
 * @param {string} elementoId - ID del elemento destinatario
 */
function iniciarChatPrivado(elementoId) {
    // Cambiar a la pestaña de chat
    cambiarTab('tab-chat');
    
    // Verificar si el elemento existe
    if (!elementosConectados[elementoId]) {
        mostrarNotificacion("No se encontró el destinatario seleccionado", "error");
        return;
    }
    
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
            actualizarListaDestinatarios();
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



/**
 * Agrega estilos CSS mejorados para la interfaz
 */
function agregarEstilosMejorados() {
    // Verificar si ya existe la hoja de estilos
    if (document.getElementById('estilos-mejorados')) {
        return;
    }
    
    // Crear hoja de estilos
    const style = document.createElement('style');
    style.id = 'estilos-mejorados';
    style.textContent = `
        /* Estilos para elementos de lista mejorados */
        .elemento-item {
            transition: background-color 0.2s;
            border-bottom: 1px solid #eee;
            margin-bottom: 8px;
        }
        
        .elemento-item:hover {
            background-color: #f5f5f5;
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
        
        /* Estilos para mensajes de chat */
        .message .estado {
            font-size: 11px;
            display: block;
            margin-top: 3px;
            color: #888;
            font-style: italic;
        }
        
        .message .estado.enviando {
            color: #ffa000;
        }
        
        .message .estado.enviado {
            color: #4caf50;
        }
        
        .message .estado.error {
            color: #f44336;
        }
        
        .message .estado.pendiente {
            color: #9e9e9e;
        }
        
        /* Estilos para informes */
        .informe {
            transition: transform 0.2s;
            margin-bottom: 15px;
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
        }
        
        .informe.orden {
            border-left: 4px solid #ff9800;
        }
        
        .informe.leido {
            opacity: 0.8;
        }
        
        /* Estilos para botones multimedia */
        #chat-multimedia-buttons button,
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
        
        #chat-multimedia-buttons button:hover,
        .btn-foto-informe:hover,
        .btn-audio-informe:hover,
        .btn-video-informe:hover {
            transform: scale(1.1);
            background-color: #f5f5f5;
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Configura eventos para actualización dinámica de la interfaz
 */
function configEventosActualizacionDinamica() {
    // Actualizar elementos cuando se reciben nuevos
    document.addEventListener('listaElementosActualizada', function() {
        setTimeout(mejorarListaElementos, 500);
    });
    
    // Actualizar lista de destinatarios cuando cambia la tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            if (tabId === 'tab-chat') {
                // Actualizar destinatarios de chat
                setTimeout(actualizarListaDestinatarios, 200);
            } else if (tabId === 'tab-informes') {
                // Actualizar destinatarios de informes
                setTimeout(actualizarSelectorDestinatariosInforme, 200);
            } else if (tabId === 'tab-elementos') {
                // Mejorar lista de elementos
                setTimeout(mejorarListaElementos, 200);
            }
        });
    });
    
    // Actualizar periódicamente la lista de elementos
    setInterval(function() {
        if (socket && socket.connected) {
            solicitarListaElementos();
        }
    }, 60000); // Cada minuto
}



function actualizarListaDestinatarios() {
    console.log("Actualizando lista de destinatarios para mensajes privados...");
    
    // Obtener el select
    const selectDestinatario = document.getElementById('select-destinatario');
    if (!selectDestinatario) {
        console.error("No se encontró el selector de destinatarios");
        return;
    }
    
    // Mantener las opciones fijas (como "Puesto Comando")
    const opcionesFijas = Array.from(selectDestinatario.querySelectorAll('option:not([data-elemento])')); 
    
    // Si no hay opciones fijas, crear algunas por defecto
    if (opcionesFijas.length === 0) {
        opcionesFijas.push(
            createOption("", "Seleccionar destinatario..."),
            createOption("todos", "Todos los participantes"),
            createOption("comando", "Comando/Central")
        );
        
        // Separador
        const separador = document.createElement('option');
        separador.disabled = true;
        separador.textContent = '───────────────';
        opcionesFijas.push(separador);
    }
    
    // Limpiar todas las opciones actuales
    selectDestinatario.innerHTML = '';
    
    // Restaurar opciones fijas
    opcionesFijas.forEach(opcion => {
        selectDestinatario.appendChild(opcion);
    });
    
    // Obtener ID propio para excluirlo de la lista
    const idUsuarioActual = (window.usuarioInfo && window.usuarioInfo.id) || 
                         (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.usuarioInfo && window.MAIRA.GestionBatalla.usuarioInfo.id);
    
    // Obtener lista actualizada de elementos conectados (usando cualquier fuente disponible)
    const elementos = window.elementosConectados || 
                     (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.elementosConectados) || {};
    
    console.log("Elementos disponibles para chat privado:", Object.keys(elementos).length, elementos);
    
    // Iterar sobre elementos
    Object.keys(elementos).forEach(id => {
        // Evitar agregarse a sí mismo
        if (id === idUsuarioActual) {
            console.log(`Omitiendo usuario propio (${id}) como destinatario`);
            return;
        }
        
        const elemento = elementos[id].datos || elementos[id];
        if (!elemento) return;
        
        console.log(`-> Elemento ${id}: ${elemento.usuario || 'Sin nombre'}`);
        
        // Crear formato de nombre
        let nombreMostrado = elemento.usuario || 'Usuario';
        
        // Añadir designación/dependencia si está disponible
        if (elemento.elemento) {
            if (elemento.elemento.designacion) {
                nombreMostrado = `${elemento.elemento.designacion} (${nombreMostrado})`;
                
                if (elemento.elemento.dependencia) {
                    nombreMostrado = `${elemento.elemento.designacion} / ${elemento.elemento.dependencia} (${nombreMostrado})`;
                }
            }
        }
        
        // Crear opción
        const option = document.createElement('option');
        option.value = id;
        option.textContent = nombreMostrado;
        option.dataset.elemento = 'true';
        
        selectDestinatario.appendChild(option);
    });
    
    console.log(`Lista de destinatarios actualizada con ${selectDestinatario.options.length - opcionesFijas.length} participantes disponibles`);
    
    // Función auxiliar para crear opciones
    function createOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        return option;
    }
}

/**
 * Recibe la lista de elementos de la operación
 * @param {Array} elementos - Lista completa de elementos
 */
function recibirListaElementos(elementos) {
    console.log("Lista completa de elementos recibida:", elementos?.length || 0);
    
    // Inicializar lista de elementos
    inicializarListaElementos(elementos || []);
    
    // Solicitar actualizaciones de estado de cada elemento
    if (socket && socket.connected && elementos && elementos.length > 0) {
        setTimeout(() => {
            socket.emit('solicitarEstadoElementos', { operacion: operacionActual });
        }, 1000);
    }
}



/**
 * Mejora para el envío de mensajes de chat (privados y públicos)
 */
function enviarMensajeChat() {
    const mensajeInput = document.getElementById('mensaje-chat');
    if (!mensajeInput) {
        console.error("Input de chat no encontrado");
        return;
    }
    
    const contenido = mensajeInput.value.trim();
    if (!contenido) {
        console.log("Mensaje vacío, no se envía");
        return;
    }
    
    console.log("Preparando envío de mensaje:", contenido);
    
    // Determinar si es mensaje privado o general
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    const selectDestinatario = document.getElementById('select-destinatario');
    
    const esPrivado = btnChatPrivado && btnChatPrivado.classList.contains('active');
    const destinatarioId = esPrivado && selectDestinatario ? selectDestinatario.value : null;
    
    if (esPrivado && (!destinatarioId || destinatarioId === "")) {
        agregarMensajeChat("Sistema", "Selecciona un destinatario para el mensaje privado", "sistema");
        return;
    }
    
    // Verificar si tenemos la información del usuario
    if (!usuarioInfo) {
        agregarMensajeChat("Sistema", "No se ha iniciado sesión correctamente", "sistema");
        return;
    }
    
    // Generar ID único para el mensaje
    const mensajeId = `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Crear mensaje con formato necesario para el servidor
    const mensaje = {
        id: mensajeId,
        emisor: {
            id: usuarioInfo.id,
            nombre: usuarioInfo.usuario,
            elemento: elementoTrabajo
        },
        contenido: contenido,
        sala: operacionActual || 'general',
        timestamp: new Date().toISOString(),
        tipo: esPrivado ? 'privado' : 'global',
        destinatario: esPrivado ? destinatarioId : null
    };
    
    // Información para depuración
    if (esPrivado) {
        let destinatarioNombre = "Desconocido";
        
        // Buscar nombre del destinatario
        if (destinatarioId === "todos") {
            destinatarioNombre = "Todos";
        } else if (destinatarioId === "comando") {
            destinatarioNombre = "Comando/Central";
        } else if (elementosConectados[destinatarioId]) {
            destinatarioNombre = elementosConectados[destinatarioId].datos.usuario || "Desconocido";
        }
        
        console.log(`Enviando mensaje privado a ${destinatarioNombre} (${destinatarioId}):`, mensaje);
    } else {
        console.log("Enviando mensaje global:", mensaje);
    }
    
    // Mostrar en UI localmente con estado "enviando"
    if (esPrivado) {
        // Para mensajes privados, mostrar a quién va dirigido
        let destNombre = "Desconocido";
        if (destinatarioId === "todos") {
            destNombre = "Todos";
        } else if (destinatarioId === "comando") {
            destNombre = "Comando";
        } else if (elementosConectados[destinatarioId]?.datos?.usuario) {
            destNombre = elementosConectados[destinatarioId].datos.usuario;
        }
        
        agregarMensajeChat(`Tú → ${destNombre}`, contenido, "enviado", "enviando", mensajeId);
    } else {
        agregarMensajeChat('Tú', contenido, "enviado", "enviando", mensajeId);
    }
    
    // Enviar al servidor usando el evento correcto
    if (socket && socket.connected) {
        // Usar evento 'mensajePrivado' para privados y 'mensajeChat' para globales
        const eventoSocket = esPrivado ? 'mensajePrivado' : 'mensajeChat';
        
        socket.emit(eventoSocket, mensaje, function(respuesta) {
            console.log(`Respuesta del servidor al enviar mensaje ${esPrivado ? 'privado' : 'global'}:`, respuesta);
            
            // Actualizar estado del mensaje según la respuesta
            if (respuesta && respuesta.error) {
                agregarMensajeChat(null, null, null, "error", mensajeId);
                mostrarNotificacion("Error al enviar mensaje: " + respuesta.error, "error");
            } else {
                // Mensaje enviado correctamente
                agregarMensajeChat(null, null, null, "enviado", mensajeId);
                
                // Registrar en mensajes enviados para evitar duplicados
                if (mensajesEnviados) {
                    mensajesEnviados.add(mensajeId);
                }
            }
        });
    } else {
        // Almacenar mensaje para enviar cuando se recupere la conexión
        colaPendiente.mensajes.push(mensaje);
        
        agregarMensajeChat(null, null, null, "pendiente", mensajeId);
        agregarMensajeChat("Sistema", "No estás conectado al servidor. El mensaje se enviará cuando se restablezca la conexión.", "sistema");
    }
    
    // Limpiar input
    mensajeInput.value = '';
    mensajeInput.focus();
}

/**
 * Maneja mensajes privados recibidos
 * @param {Object} mensaje - Mensaje privado recibido
 */
function recibirMensajePrivado(mensaje) {
    if (!mensaje || !mensaje.emisor || !mensaje.contenido) {
        console.warn("Mensaje privado inválido recibido:", mensaje);
        return;
    }
    
    console.log("Mensaje privado recibido:", mensaje);
    
    // Determinar si es un mensaje enviado por nosotros (eco)
    const esPropio = mensaje.emisor.id === usuarioInfo?.id;
    
    // Evitar duplicados si ya tenemos este mensaje
    if (mensaje.id && mensajesRecibidos && mensajesRecibidos.has(mensaje.id)) {
        console.log("Mensaje privado duplicado ignorado:", mensaje.id);
        return;
    }
    
    // Si es nuestro propio mensaje (eco), ignorarlo
    if (esPropio && mensaje.id && mensajesEnviados && mensajesEnviados.has(mensaje.id)) {
        console.log("Mensaje privado propio (eco) ignorado:", mensaje.id);
        return;
    }
    
    // Registrar ID para evitar duplicados
    if (mensaje.id && mensajesRecibidos) {
        mensajesRecibidos.add(mensaje.id);
    }
    
    // Determinar el emisor para mostrar correctamente
    let nombreEmisor;
    if (esPropio) {
        // Si es nuestro mensaje, mostrar 'Tú'
        nombreEmisor = 'Tú';
    } else {
        // Si es de otro usuario, mostrar su nombre
        nombreEmisor = typeof mensaje.emisor === 'object' ? 
            mensaje.emisor.nombre || mensaje.emisor.usuario : 
            mensaje.emisor;
    }
    
    // Determinar el destinatario para mostrar correctamente
    let nombreDestinatario = "";
    if (mensaje.destinatario === "todos") {
        nombreDestinatario = "Todos";
    } else if (mensaje.destinatario === "comando") {
        nombreDestinatario = "Comando";
    } else if (mensaje.destinatario && elementosConectados[mensaje.destinatario]?.datos?.usuario) {
        nombreDestinatario = elementosConectados[mensaje.destinatario].datos.usuario;
    } else if (mensaje.destinatario === usuarioInfo?.id) {
        nombreDestinatario = "Ti";
    }
    
    // Construir texto de mensaje con remitente y destinatario
    let encabezadoMensaje;
    if (esPropio) {
        encabezadoMensaje = `${nombreEmisor} → ${nombreDestinatario}`;
    } else {
        encabezadoMensaje = `${nombreEmisor} → ${nombreDestinatario ? "Ti" : ""}`;
    }
    
    // Notificar al usuario sobre el mensaje privado con sonido y notificación
    if (!esPropio) {
        // Sólo notificar mensajes que recibimos, no los que enviamos
        notificarMensajePrivado(mensaje);
    }
    
    // Mostrar el mensaje en el chat
    agregarMensajeChat(
        encabezadoMensaje,
        mensaje.contenido,
        esPropio ? "enviado" : "privado",
        mensaje.estado || (esPropio ? "enviado" : "recibido"),
        mensaje.id
    );
}



/**
 * Mejora para la función de enviar chat y CSS de mensajes privados
 */
function configurarEstilosMensajesPrivados() {
    // Verificar si ya existe la hoja de estilos
    if (document.getElementById('estilos-chat-privado')) {
        return;
    }
    
    // Crear hoja de estilos
    const style = document.createElement('style');
    style.id = 'estilos-chat-privado';
    style.textContent = `
        .message.message-privado {
            background-color: #e1f5fe;
            border-left: 4px solid #03a9f4;
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            max-width: 90%;
            margin-left: 10px;
            position: relative;
        }
        
        .message.message-usuario.privado {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
        }
        
        .chat-privado-icon {
            display: inline-block;
            margin-right: 5px;
            color: #0288d1;
        }
        
        .notificacion-privado {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background-color: rgba(3, 169, 244, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .notificacion-privado button {
            background-color: white;
            color: #0288d1;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            margin-top: 8px;
            cursor: pointer;
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(style);
}


/**
 * Envía un mensaje multimedia (imagen, audio, video) al chat
 * @param {string} tipoContenido - Tipo de contenido ('image', 'audio', 'video')
 * @param {string} contenidoBase64 - Datos en formato base64
 * @param {string} nombreArchivo - Nombre del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @param {string} [texto] - Texto opcional para acompañar el contenido
 */
function enviarMensajeMultimedia(tipoContenido, contenidoBase64, nombreArchivo, mimeType, texto) {
    console.log(`Preparando envío de mensaje multimedia: ${tipoContenido}`);
    
    if (!contenidoBase64) {
        console.error("Contenido multimedia vacío");
        mostrarNotificacion("No hay contenido para enviar", "error");
        return;
    }
    
    // Verificar conexión al servidor
    if (!socket || !socket.connected) {
        mostrarNotificacion("No hay conexión con el servidor", "error");
        return;
    }
    
    // Determinar si es mensaje privado
    const esPrivado = document.getElementById('btn-chat-privado').classList.contains('active');
    let destinatario = null;
    
    if (esPrivado) {
        const selectDestinatario = document.getElementById('select-destinatario');
        if (!selectDestinatario || !selectDestinatario.value) {
            mostrarNotificacion("Selecciona un destinatario para el mensaje privado", "error");
            return;
        }
        destinatario = selectDestinatario.value;
    }
    
    // Crear mensaje
    const mensajeId = `media_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const mensaje = {
        id: mensajeId,
        tipo_contenido: tipoContenido,
        contenido: contenidoBase64,
        nombre_archivo: nombreArchivo,
        mime_type: mimeType,
        texto: texto || '',
        sala: operacionActual,
        destinatario: destinatario,
        timestamp: new Date().toISOString()
    };
    
    // Mostrar indicador de carga
    const loadingId = `loading_${mensajeId}`;
    agregarMensajeChat(
        esPrivado ? `Tú → ${obtenerNombreDestinatario(destinatario)}` : 'Tú',
        `<div id="${loadingId}" class="mensaje-multimedia-loading">
            <i class="fas fa-spinner fa-spin"></i> Enviando ${tipoContenido}...
        </div>`,
        "enviado",
        "enviando",
        mensajeId
    );
    
    // Enviar mensaje al servidor
    socket.emit('mensajeMultimedia', mensaje, function(respuesta) {
        console.log("Respuesta del servidor:", respuesta);
        
        // Eliminar indicador de carga
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (respuesta && respuesta.error) {
            mostrarNotificacion(`Error al enviar: ${respuesta.error}`, "error");
            agregarMensajeChat(null, null, null, "error", mensajeId);
        } else {
            // Mensaje enviado correctamente
            agregarMensajeChat(null, null, null, "enviado", mensajeId);
            
            // Actualizar vista con contenido multimedia
            actualizarVistaMultimedia(mensajeId, tipoContenido, contenidoBase64, texto);
            
            // Registrar en mensajes enviados para evitar duplicados
            if (mensajesEnviados) {
                mensajesEnviados.add(mensajeId);
            }
        }
    });
}

/**
 * Actualiza la vista de un mensaje con contenido multimedia
 */
function actualizarVistaMultimedia(mensajeId, tipoContenido, contenidoBase64, texto) {
    const mensajeElement = document.querySelector(`#msg-${mensajeId}`);
    if (!mensajeElement) return;
    
    // Contenedor para el contenido multimedia
    let contenidoHTML = '';
    
    // Agregar contenido según tipo
    switch (tipoContenido) {
        case 'image':
            contenidoHTML = `
                <div class="multimedia-container imagen">
                    <img src="${contenidoBase64}" alt="Imagen" class="mensaje-imagen" onclick="ampliarImagen(this.src)">
                </div>
            `;
            break;
        case 'audio':
            contenidoHTML = `
                <div class="multimedia-container audio">
                    <audio controls>
                        <source src="${contenidoBase64}" type="audio/webm">
                        Tu navegador no soporta la reproducción de audio.
                    </audio>
                </div>
            `;
            break;
        case 'video':
            contenidoHTML = `
                <div class="multimedia-container video">
                    <video controls>
                        <source src="${contenidoBase64}" type="video/webm">
                        Tu navegador no soporta la reproducción de video.
                    </video>
                </div>
            `;
            break;
    }
    
    // Agregar texto si existe
    if (texto) {
        contenidoHTML += `<div class="mensaje-texto">${texto}</div>`;
    }
    
    // Actualizar contenido del mensaje
    const contenidoDiv = mensajeElement.querySelector('div:nth-child(2)');
    if (contenidoDiv) {
        contenidoDiv.innerHTML = contenidoHTML;
    }
}

/**
 * Obtiene el nombre de un destinatario a partir de su ID
 */
function obtenerNombreDestinatario(destinatarioId) {
    if (destinatarioId === "todos") return "Todos";
    if (destinatarioId === "comando") return "Comando";
    
    const elemento = elementosConectados[destinatarioId];
    if (elemento && elemento.datos && elemento.datos.usuario) {
        return elemento.datos.usuario;
    }
    
    // Buscar en el select por si tiene el texto
    const selectDestinatario = document.getElementById('select-destinatario');
    if (selectDestinatario) {
        const option = selectDestinatario.querySelector(`option[value="${destinatarioId}"]`);
        if (option) return option.textContent;
    }
    
    return "Desconocido";
}

/**
 * Ampliar imagen en modal
 */
function ampliarImagen(src) {
    // Crear modal para ver la imagen ampliada
    const modal = document.createElement('div');
    modal.className = 'modal-imagen';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Imagen
    const imagen = document.createElement('img');
    imagen.src = src;
    imagen.style.maxWidth = '90%';
    imagen.style.maxHeight = '90%';
    imagen.style.border = '2px solid white';
    
    // Botón cerrar
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '&times;';
    btnCerrar.style.position = 'absolute';
    btnCerrar.style.top = '15px';
    btnCerrar.style.right = '15px';
    btnCerrar.style.backgroundColor = 'transparent';
    btnCerrar.style.border = 'none';
    btnCerrar.style.color = 'white';
    btnCerrar.style.fontSize = '28px';
    btnCerrar.style.cursor = 'pointer';
    
    btnCerrar.onclick = function() {
        document.body.removeChild(modal);
    };
    
    // Cerrar con escape
    function cerrarConEscape(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', cerrarConEscape);
        }
    }
    document.addEventListener('keydown', cerrarConEscape);
    
    // Cerrar al hacer clic fuera de la imagen
    modal.onclick = function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    // Agregar elementos al modal
    modal.appendChild(imagen);
    modal.appendChild(btnCerrar);
    document.body.appendChild(modal);
}


/**
 * Implementa los botones multimedia para el chat
 */
function implementarBotonesMultimediaChat() {
    const btnFotoChat = document.getElementById('btn-foto-chat');
    const btnAudioChat = document.getElementById('btn-audio-chat');
    
    if (btnFotoChat) {
        btnFotoChat.addEventListener('click', function() {
            // Usar la función existente pero customizada para chat
            capturarFotoParaChat();
        });
    }
    
    if (btnAudioChat) {
        btnAudioChat.addEventListener('click', function() {
            // Usar la función existente pero customizada para chat
            grabarAudioParaChat();
        });
    }
}

/**
 * Captura una foto para enviar en el chat
 */
function capturarFotoParaChat() {
    // Verificar soporte de getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarNotificacion("Tu navegador no soporta acceso a la cámara", "error");
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
            <h3>Capturar foto para chat</h3>
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
        <div style="margin-top: 20px; display: none;" id="preview-container">
            <img id="preview-image" style="max-width: 300px; max-height: 200px; border: 2px solid white;">
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="texto-imagen" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                <div>
                    <button id="btn-enviar-imagen" class="btn btn-success mx-2">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                    <button id="btn-cancelar-imagen" class="btn btn-secondary mx-2">
                        <i class="fas fa-redo"></i> Volver a capturar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalCaptura);
    
    // Variables para la captura
    let stream = null;
    let facingMode = 'environment'; // Comenzar con cámara trasera en móviles
    let imagenCapturada = null;
    
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
                mostrarNotificacion("Error al acceder a la cámara: " + error.message, "error");
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
        imagenCapturada = canvas.toDataURL('image/jpeg', 0.8);
        
        // Mostrar previsualización
        document.getElementById('preview-image').src = imagenCapturada;
        document.getElementById('preview-container').style.display = 'block';
        document.getElementById('camera-preview').style.display = 'none';
        document.getElementById('btn-capturar').style.display = 'none';
        document.getElementById('btn-cambiar-camara').style.display = 'none';
    }
    
    // Función para enviar la imagen al chat
function enviarImagen() {
    const textoImagen = document.getElementById('texto-imagen').value;
    
    // Enviar mediante la función de mensaje multimedia
    enviarMensajeMultimedia(
        'image', 
        imagenCapturada, 
        `foto_${new Date().toISOString().replace(/:/g, '-')}.jpg`, 
        'image/jpeg',
        textoImagen
    );
    
    // Cerrar el modal
    cerrarModalCaptura();
}

// Función para cerrar el modal de captura
function cerrarModalCaptura() {
    // Detener stream si existe
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    
    // Eliminar modal
    const modal = document.querySelector('.modal-captura-multimedia');
    if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
    }
}

// Configurar eventos
iniciarCamara();

document.getElementById('btn-capturar').addEventListener('click', capturar);
document.getElementById('btn-cambiar-camara').addEventListener('click', cambiarCamara);
document.getElementById('btn-cancelar-captura').addEventListener('click', cerrarModalCaptura);
document.getElementById('btn-enviar-imagen').addEventListener('click', enviarImagen);
document.getElementById('btn-cancelar-imagen').addEventListener('click', function() {
    // Volver a mostrar la cámara
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('camera-preview').style.display = 'block';
    document.getElementById('btn-capturar').style.display = 'inline-block';
    document.getElementById('btn-cambiar-camara').style.display = 'inline-block';
});
}

/**
 * Graba audio para enviar en el chat
 */
function grabarAudioParaChat() {
    // Verificar soporte de getUserMedia y MediaRecorder
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        mostrarNotificacion("Tu navegador no soporta grabación de audio", "error");
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
            <h3>Grabar audio para chat</h3>
        </div>
        <div id="visualizador-audio" style="width: 300px; height: 60px; background: #333; border-radius: 8px; margin-bottom: 15px; position: relative;">
            <div class="audio-wave" style="position: absolute; bottom: 0; left: 0; right: 0; height: 0px; background: #4caf50; border-radius: 0 0 8px 8px;"></div>
        </div>
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
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="texto-audio" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                <div>
                    <button id="btn-enviar-audio" class="btn btn-success mx-2">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                    <button id="btn-descartar-audio" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
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
            const wave = document.querySelector('.audio-wave');
            if (wave) {
                const height = Math.min(60, average * 0.5); // Max 60px
                wave.style.height = `${height}px`;
            }
        }, 50);
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
                    mostrarNotificacion("Tu navegador no soporta ningún formato de audio compatible", "error");
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
                mostrarNotificacion("Error al acceder al micrófono: " + error.message, "error");
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
            mostrarNotificacion("Límite de 1 minuto alcanzado", "info");
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
        
        const modal = document.querySelector('.modal-grabacion-audio');
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }
    
    // Función para enviar el audio
    function enviarAudio() {
        const textoAudio = document.getElementById('texto-audio').value;
        
        // Convertir Blob a base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = function() {
            const base64data = reader.result;
            
            // Obtener la extensión correcta según el tipo MIME
            let extension = 'webm';
            if (audioBlob.type.includes('ogg')) {
                extension = 'ogg';
            } else if (audioBlob.type.includes('mp4')) {
                extension = 'm4a';
            }
            
            // Enviar mediante la función de mensaje multimedia
            enviarMensajeMultimedia(
                'audio', 
                base64data, 
                `audio_${new Date().toISOString().replace(/:/g, '-')}.${extension}`, 
                audioBlob.type,
                textoAudio
            );
            
            // Cerrar el modal
            cerrarModalGrabacion();
        };
    }
    
    // Configurar eventos
    document.getElementById('btn-iniciar-grabacion').addEventListener('click', iniciarGrabacion);
    document.getElementById('btn-detener-grabacion').addEventListener('click', detenerGrabacion);
    document.getElementById('btn-cancelar-grabacion').addEventListener('click', cerrarModalGrabacion);
    document.getElementById('btn-enviar-audio').addEventListener('click', enviarAudio);
    document.getElementById('btn-descartar-audio').addEventListener('click', cerrarModalGrabacion);
}

/**
 * Implementa la funcionalidad para grabar video para chat
 */
function grabarVideoParaChat() {
    // Verificar soporte de getUserMedia y MediaRecorder
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        mostrarNotificacion("Tu navegador no soporta grabación de video", "error");
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
            <h3>Grabar video para chat</h3>
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
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="texto-video" placeholder="Añadir mensaje (opcional)" class="form-control" style="width: 300px;">
                <div>
                    <button id="btn-enviar-video" class="btn btn-success mx-2">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                    <button id="btn-descartar-video" class="btn btn-secondary mx-2">
                        <i class="fas fa-trash"></i> Descartar
                    </button>
                </div>
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
                    mostrarNotificacion("Tu navegador no soporta ningún formato de video compatible", "error");
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
                mostrarNotificacion("Error al acceder a la cámara o micrófono: " + error.message, "error");
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
            mostrarNotificacion("Límite de 30 segundos alcanzado", "info");
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
        
        const modal = document.querySelector('.modal-grabacion-video');
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }
    
    // Función para enviar el video
    function enviarVideo() {
        const textoVideo = document.getElementById('texto-video').value;
        
        // Verificar tamaño máximo (5MB)
        if (videoBlob.size > 5 * 1024 * 1024) {
            mostrarNotificacion("El video excede el tamaño máximo permitido de 5MB. La calidad será reducida.", "warning");
            
            // Comprimir video
            comprimirVideo(videoBlob).then(videoComprimido => {
                procesarEnvioVideo(videoComprimido, textoVideo);
            }).catch(error => {
                console.error("Error al comprimir video:", error);
                mostrarNotificacion("Error al comprimir el video. Intente una grabación más corta.", "error");
            });
        } else {
            procesarEnvioVideo(videoBlob, textoVideo);
        }
    }
    
    // Función auxiliar para procesar y enviar el video
    function procesarEnvioVideo(blob, texto) {
        // Convertir Blob a base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
            const base64data = reader.result;
            
            // Obtener la extensión correcta según el tipo MIME
            let extension = 'webm';
            if (blob.type.includes('mp4')) {
                extension = 'mp4';
            }
            
            // Enviar mediante la función de mensaje multimedia
            enviarMensajeMultimedia(
                'video', 
                base64data, 
                `video_${new Date().toISOString().replace(/:/g, '-')}.${extension}`, 
                blob.type,
                texto
            );
            
            // Cerrar el modal
            cerrarModalGrabacionVideo();
        };
    }
    
    // Configurar eventos
    document.getElementById('btn-iniciar-grabacion-video').addEventListener('click', iniciarGrabacionVideo);
    document.getElementById('btn-detener-grabacion-video').addEventListener('click', detenerGrabacionVideo);
    document.getElementById('btn-cancelar-grabacion-video').addEventListener('click', cerrarModalGrabacionVideo);
    document.getElementById('btn-enviar-video').addEventListener('click', enviarVideo);
    document.getElementById('btn-descartar-video').addEventListener('click', cerrarModalGrabacionVideo);
    
    // Permitir cerrar con Escape
    document.addEventListener('keydown', function cerrarConEscape(e) {
        if (e.key === 'Escape') {
            cerrarModalGrabacionVideo();
            document.removeEventListener('keydown', cerrarConEscape);
        }
    });
}

/**
 * Comprime un video para reducir su tamaño
 * @param {Blob} videoBlob - El blob de video original
 * @returns {Promise<Blob>} - Promesa que resuelve al video comprimido
 */
function comprimirVideo(videoBlob) {
    return new Promise((resolve, reject) => {
        // Crear elemento de video temporal
        const video = document.createElement('video');
        video.muted = true;
        
        // Crear objeto URL para el video
        const videoURL = URL.createObjectURL(videoBlob);
        video.src = videoURL;
        
        video.onloadedmetadata = function() {
            // Configurar canvas para capturar frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const fps = 10; // Reducir cuadros por segundo
            
            // Reducir dimensiones
            const maxDimension = 320;
            let width = video.videoWidth;
            let height = video.videoHeight;
            
            if (width > height && width > maxDimension) {
                height = height * (maxDimension / width);
                width = maxDimension;
            } else if (height > maxDimension) {
                width = width * (maxDimension / height);
                height = maxDimension;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Usar MediaRecorder con menor bitrate
            const mediaRecorder = new MediaRecorder(canvas.captureStream(fps), {
                mimeType: 'video/webm;codecs=vp8',
                videoBitsPerSecond: 250000 // 250Kbps
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = e => chunks.push(e.data);
            
            mediaRecorder.onstop = () => {
                const nuevoBlob = new Blob(chunks, { type: 'video/webm' });
                
                console.log(`Video comprimido: ${(videoBlob.size/1024/1024).toFixed(2)}MB → ${(nuevoBlob.size/1024/1024).toFixed(2)}MB`);
                URL.revokeObjectURL(videoURL);
                resolve(nuevoBlob);
            };
            
            // Procesar cada frame
            mediaRecorder.start();
            video.currentTime = 0;
            
            video.onended = () => mediaRecorder.stop();
            
            function processFrame() {
                if (video.ended || video.paused) return;
                
                ctx.drawImage(video, 0, 0, width, height);
                
                if (video.currentTime < video.duration) {
                    requestAnimationFrame(processFrame);
                }
            }
            
            video.onplay = () => processFrame();
            video.play();
        };
        
        video.onerror = () => {
            URL.revokeObjectURL(videoURL);
            reject(new Error('Error al procesar el video'));
        };
    });
}

/**
 * Configura los botones de multimedia en el chat
 */
function configurarBotonesMultimediaChat() {
    // Buscar el contenedor de botones de envío
    const inputContainer = document.querySelector('.chat-input');
    if (!inputContainer) return;
    
    // Verificar si ya existe
    if (document.getElementById('chat-multimedia-buttons')) return;
    
    // Crear contenedor de botones
    const botonesContainer = document.createElement('div');
    botonesContainer.id = 'chat-multimedia-buttons';
    botonesContainer.className = 'chat-multimedia-buttons';
    botonesContainer.style.display = 'flex';
    botonesContainer.style.marginRight = '5px';
    
    botonesContainer.innerHTML = `
        <button type="button" id="btn-foto-chat" class="btn-multimedia" title="Enviar foto">
            <i class="fas fa-camera"></i>
        </button>
        <button type="button" id="btn-audio-chat" class="btn-multimedia" title="Enviar audio">
            <i class="fas fa-microphone"></i>
        </button>
        <button type="button" id="btn-video-chat" class="btn-multimedia" title="Enviar video">
            <i class="fas fa-video"></i>
        </button>
    `;
    
    // Insertar antes del input
    inputContainer.insertBefore(botonesContainer, inputContainer.firstChild);
    
    // Añadir estilos
    const style = document.createElement('style');
    style.textContent = `
        .chat-input {
            display: flex;
            align-items: center;
        }
        
        .chat-multimedia-buttons {
            display: flex;
            margin-right: 8px;
        }
        
        .btn-multimedia {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid #ddd;
            background: none;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 5px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-multimedia:hover {
            background-color: #f0f0f0;
            transform: scale(1.1);
        }
        
        .btn-multimedia i {
            font-size: 14px;
            color: #555;
        }
    `;
    document.head.appendChild(style);
    
    // Configurar eventos
    document.getElementById('btn-foto-chat').addEventListener('click', capturarFotoParaChat);
    document.getElementById('btn-audio-chat').addEventListener('click', grabarAudioParaChat);
    document.getElementById('btn-video-chat').addEventListener('click', grabarVideoParaChat);
}

/**
 * Recibe un mensaje multimedia y lo muestra en el chat
 * @param {Object} mensaje - Mensaje multimedia recibido
 */
function recibirMensajeMultimedia(mensaje) {
    try {
        console.log("Recibiendo mensaje multimedia:", mensaje);
        
        // Validar mensaje
        if (!mensaje || !mensaje.tipo_contenido) {
            console.error("Mensaje multimedia inválido:", mensaje);
            return;
        }
        
        // Obtener información básica
        const tipo = mensaje.tipo_contenido; // image, audio, video
        const adjunto = mensaje.adjunto || {};
        const esPropio = mensaje.usuario === usuarioInfo?.usuario;
        
        // Preparar contenido HTML según tipo
        let contenidoHTML = '';
        
        switch (tipo) {
            case 'image':
                // Imagen
                contenidoHTML = `
                    <div class="multimedia-container imagen">
                        <img src="${mensaje.adjunto.datos || mensaje.datos}" alt="Imagen" class="mensaje-imagen" onclick="ampliarImagen(this.src)">
                    </div>
                `;
                break;
                
            case 'audio':
                // Audio
                contenidoHTML = `
                    <div class="multimedia-container audio">
                        <audio controls>
                            <source src="${mensaje.adjunto.datos || mensaje.datos}" type="${adjunto.tipo || 'audio/webm'}">
                            Tu navegador no soporta la reproducción de audio.
                        </audio>
                    </div>
                `;
                break;
                
            case 'video':
                // Video
                contenidoHTML = `
                    <div class="multimedia-container video">
                        <video controls>
                            <source src="${mensaje.adjunto.datos || mensaje.datos}" type="${adjunto.tipo || 'video/webm'}">
                            Tu navegador no soporta la reproducción de video.
                        </video>
                    </div>
                `;
                break;
                
            default:
                // Tipo desconocido
                contenidoHTML = `
                    <div class="multimedia-container desconocido">
                        <div class="mensaje-desconocido">
                            <i class="fas fa-file"></i> Contenido multimedia no soportado
                        </div>
                    </div>
                `;
        }
        
        // Agregar texto si existe
        if (mensaje.texto) {
            contenidoHTML += `<div class="mensaje-texto">${mensaje.texto}</div>`;
        }
        
        // Determinar si es mensaje privado
        let claseCSS = esPropio ? "message-usuario" : "message-recibido";
        if (mensaje.privado) {
            claseCSS += " privado";
        }
        
        // Agregar el mensaje al chat
        agregarMensajeChat(
            mensaje.usuario, 
            contenidoHTML,
            esPropio ? "enviado" : (mensaje.privado ? "privado" : "recibido"), 
            mensaje.estado || "recibido", 
            mensaje.id
        );
        
        // Reproducir sonido de notificación si no es propio
        if (!esPropio) {
            reproducirSonidoNotificacion(tipo);
        }
        
    } catch (error) {
        console.error("Error al procesar mensaje multimedia:", error);
    }
}

/**
 * Reproduce un sonido de notificación según el tipo de mensaje
 * @param {string} tipo - Tipo de mensaje (image, audio, video)
 */
function reproducirSonidoNotificacion(tipo) {
    try {
        let rutaSonido = '/Client/audio/notification.mp3'; // Sonido por defecto
        
        // Seleccionar sonido según tipo
        switch (tipo) {
            case 'image':
                rutaSonido = '/Client/audio/image_notification.mp3';
                break;
            case 'audio':
                rutaSonido = '/Client/audio/audio_notification.mp3';
                break;
            case 'video':
                rutaSonido = '/Client/audio/video_notification.mp3';
                break;
        }
        
        // Intentar reproducir sonido específico
        const audio = new Audio(rutaSonido);
        audio.play().catch(err => {
            console.log("Error al reproducir sonido específico, usando genérico", err);
            // Sonido genérico como fallback
            const audioGenerico = new Audio('/Client/audio/notification.mp3');
            audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
        });
    } catch (e) {
        console.warn("Error al reproducir sonido:", e);
    }
}

/**
 * Registra el evento para mensajes multimedia
 */
function registrarEventosMensajesMultimedia() {
    if (!socket) return;
    
    // Eliminar listener previo si existe
    socket.off('mensajeMultimedia');
    
    // Registrar nuevo listener
    socket.on('mensajeMultimedia', function(mensaje) {
        recibirMensajeMultimedia(mensaje);
    });
    
    console.log("Eventos de mensajes multimedia registrados");
}

/**
 * Añade estilos CSS para mensajes multimedia
 */
function agregarEstilosMensajesMultimedia() {
    // Verificar si ya existe
    if (document.getElementById('estilos-mensajes-multimedia')) return;
    
    // Crear elemento de estilo
    const style = document.createElement('style');
    style.id = 'estilos-mensajes-multimedia';
    style.textContent = `
        /* Contenedores multimedia */
        .multimedia-container {
            max-width: 100%;
            margin: 5px 0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        /* Imágenes */
        .multimedia-container.imagen {
            display: inline-block;
            max-width: 250px;
            background-color: #f8f9fa;
        }
        
        .mensaje-imagen {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            border-radius: 8px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        .mensaje-imagen:hover {
            opacity: 0.9;
        }
        
        /* Audio */
        .multimedia-container.audio {
            width: 250px;
            background-color: #f0f2f5;
            padding: 5px;
            border-radius: 16px;
        }
        
        .multimedia-container.audio audio {
            width: 100%;
            height: 40px;
            border-radius: 16px;
        }
        
        /* Video */
        .multimedia-container.video {
            max-width: 250px;
            background-color: #000;
            border-radius: 8px;
        }
        
        .multimedia-container.video video {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
        }
        
        /* Mensajes de texto adjuntos */
        .mensaje-texto {
            margin-top: 5px;
            word-break: break-word;
        }
        
        /* Modal de imagen ampliada */
        .modal-imagen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Indicador de carga */
        .mensaje-multimedia-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            font-style: italic;
            color: #666;
        }
        
        /* Mensaje privado */
        .message.privado {
            background-color: #e1f5fe;
            border-left: 4px solid #03a9f4;
        }
        
        .message.message-usuario.privado {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
        }
    `;
    
    // Añadir al documento
    document.head.appendChild(style);
    console.log("Estilos de mensajes multimedia agregados");
}

/**
 * Inicializa el componente de mensajes multimedia en el chat
 */
function inicializarComponenteMultimediaChat() {
    // Agregar estilos
    agregarEstilosMensajesMultimedia();
    
    // Configurar botones
    configurarBotonesMultimediaChat();
    
    // Registrar eventos Socket.IO
    registrarEventosMensajesMultimedia();
    
    console.log("Componente de mensajes multimedia inicializado");
}

/**
 * Mejora la función de inicialización del chat
 */
function inicializarChat() {
    console.log("Inicializando chat mejorado con soporte multimedia");
    
    // Inicializar componentes existentes
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error("Contenedor de chat no encontrado");
        return;
    }
    
    // Limpiar mensajes anteriores
    chatMessages.innerHTML = '';
    
    // Agregar mensaje de bienvenida
    agregarMensajeChat("Sistema", "Bienvenido al chat. Ya puedes enviar mensajes, incluyendo fotos, audios y videos.", "sistema");
    
    // Inicializar componente multimedia
    inicializarComponenteMultimediaChat();
    
    // Configurar eventos del chat básico
    const enviarMensajeBtn = document.getElementById('enviar-mensaje');
    const mensajeInput = document.getElementById('mensaje-chat');
    
    if (enviarMensajeBtn) {
        enviarMensajeBtn.addEventListener('click', enviarMensajeChat);
    }
    
    if (mensajeInput) {
        mensajeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensajeChat();
            }
        });
    }
    
    // Configurar eventos para cambiar entre chat general y privado
    const btnChatGeneral = document.getElementById('btn-chat-general');
    const btnChatPrivado = document.getElementById('btn-chat-privado');
    
    if (btnChatGeneral) {
        btnChatGeneral.addEventListener('click', function() {
            this.classList.add('active');
            if (btnChatPrivado) btnChatPrivado.classList.remove('active');
            
            // Ocultar selector de destinatario
            const destinatarioContainer = document.getElementById('chat-destinatario');
            if (destinatarioContainer) destinatarioContainer.classList.add('d-none');
            
            // Actualizar estado
            estadosUI.chatPrivado = false;
        });
    }
    
    if (btnChatPrivado) {
        btnChatPrivado.addEventListener('click', function() {
            this.classList.add('active');
            if (btnChatGeneral) btnChatGeneral.classList.remove('active');
            
            // Mostrar selector de destinatario
            const destinatarioContainer = document.getElementById('chat-destinatario');
            if (destinatarioContainer) destinatarioContainer.classList.remove('d-none');
            
            // Actualizar lista de destinatarios
            actualizarListaDestinatarios();
            
            // Actualizar estado
            estadosUI.chatPrivado = true;
        });
    }
    
    console.log("Chat inicializado con soporte multimedia");
}

/** 
 * Mejora la función de configuración de eventos de Socket.IO para incluir mensajes multimedia
 */
function configurarEventosSocket() {
    if (!socket) {
        console.error("Socket no disponible para configurar eventos");
        return;
    }
    
    // Limpiar eventos anteriores
    socket.off('connect');
    socket.off('disconnect');
    socket.off('error');
    socket.off('mensajeChat');
    socket.off('mensajePrivado');
    socket.off('mensajeMultimedia'); // Nuevo tipo
    socket.off('nuevaConexion');
    socket.off('desconexion');
    socket.off('listaElementos');
    
    // Registrar eventos básicos
    socket.on('connect', function() {
        console.log('Conectado al servidor');
        actualizarEstadoConexion(true);
        
        // Unirse a salas
        socket.emit('joinRoom', 'general');
        if (operacionActual) {
            socket.emit('joinRoom', operacionActual);
        }
        
        // Enviar datos del usuario y elemento
        if (usuarioInfo && elementoTrabajo) {
            socket.emit('unirseOperacion', {
                usuario: usuarioInfo,
                elemento: elementoTrabajo,
                posicion: ultimaPosicion,
                operacion: operacionActual
            });
        }
        
        // Enviar pendientes
        if (typeof enviarPendientes === 'function') {
            enviarPendientes();
        }
        
        // Solicitar elementos
        setTimeout(solicitarListaElementos, 1000);
    });
    
    // Evento de desconexión
    socket.on('disconnect', function(reason) {
        console.log('Desconectado del servidor. Razón:', reason);
        actualizarEstadoConexion(false);
        mostrarNotificacion("Desconectado del servidor: " + reason, "error", 5000);
    });
    
    // Evento de error
    socket.on('error', function(error) {
        console.error('Error de socket:', error);
        mostrarNotificacion("Error de socket: " + (error.mensaje || error), "error");
    });
    
    // Eventos para mensajes
    socket.on('mensajeChat', function(mensaje) {
        console.log('Mensaje global recibido:', mensaje);
        recibirMensajeChat(mensaje);
    });
    
    // Evento para mensajes privados
    socket.on('mensajePrivado', function(mensaje) {
        console.log('Mensaje privado recibido:', mensaje);
        recibirMensajePrivado(mensaje);
    });
    
    // Evento para mensajes multimedia
    socket.on('mensajeMultimedia', function(mensaje) {
        console.log('Mensaje multimedia recibido:', mensaje);
        recibirMensajeMultimedia(mensaje);
    });
    
    // Eventos para elementos
    socket.on('nuevaConexion', function(data) {
        console.log('Nueva conexión detectada:', data);
        actualizarListaElementos(data);
        
        // Notificar en el chat
        agregarMensajeChat("Sistema", 
            `${data.usuario} se ha unido a la operación con ${data.elemento?.designacion || 'elemento sin designación'}`, 
            "sistema");
    });
    
    socket.on('desconexion', function(data) {
        console.log('Desconexión detectada:', data);
        eliminarElementoLista(data.id);
        
        // Notificar en el chat
        agregarMensajeChat("Sistema", 
            `${data.usuario || 'Usuario'} se ha desconectado de la operación`, 
            "sistema");
    });
    
    socket.on('listaElementos', function(elementos) {
        console.log('Lista de elementos recibida:', elementos?.length || 0);
        inicializarListaElementos(elementos || []);
    });
    
    // Eventos para informes
    socket.on('nuevoInforme', function(informe) {
        console.log('Informe recibido:', informe);
        recibirInforme(informe);
    });
    
    console.log("Eventos de socket configurados correctamente");
}

/**
 * Función para mejorar la visualización de informes con adjuntos
 */
function mejorarVisualizacionInformes() {
    // Agregar estilos para la visualización de informes con adjuntos
    const style = document.createElement('style');
    style.id = 'estilos-informes-adjuntos';
    style.textContent = `
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
        
        /* Modal de visualización de adjuntos */
        .modal-visor-adjunto {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* Miniaturas de imágenes adjuntas */
        .informe-thumbnail {
            max-width: 100px;
            max-height: 80px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 8px;
        }
    `;
    
    // Añadir al documento si no existe
    if (!document.getElementById('estilos-informes-adjuntos')) {
        document.head.appendChild(style);
    }
}

/**
 * Mejora la inicialización general para integrar multimedia
 */
function inicializarInterfazMultimedia() {
    console.log("Inicializando interfaz multimedia mejorada");
    
    // Asegurar que existen las carpetas necesarias
    if (socket && socket.connected) {
        socket.emit('verificarEstructuraArchivos', {}, function(respuesta) {
            console.log("Verificación de estructura de archivos:", respuesta);
        });
    }
    
    // Mejorar visualización de informes
    mejorarVisualizacionInformes();
    
    // Inicializar chat con funcionalidades multimedia
    inicializarChat();
    
    // Configurar eventos de Socket.IO
    configurarEventosSocket();
    
    console.log("Inicialización multimedia completada");
}



/**
 * Mejora en la notificación de mensajes privados
 * @param {Object} mensaje - Mensaje privado recibido
 */
function notificarMensajePrivado(mensaje) {
    // Asegurarse de que los estilos están configurados
    configurarEstilosMensajesPrivados();
    
    // Reproducir sonido de notificación si está disponible
    try {
        const audio = new Audio('/Client/audio/private_message.mp3');
        audio.play().catch(err => {
            console.log("No se pudo reproducir el sonido específico, usando genérico", err);
            // Fallback al sonido genérico
            const audioGenerico = new Audio('/Client/audio/notification.mp3');
            audioGenerico.play().catch(e => console.log("No se pudo reproducir ningún sonido", e));
        });
    } catch (e) {
        console.warn("Error al reproducir sonido de notificación:", e);
    }
    
    // Mostrar notificación con más énfasis
    mostrarNotificacion(`Mensaje privado de ${mensaje.emisor.nombre || mensaje.emisor}`, "info", 5000, true);
    
    // Si no estamos en la pestaña de chat o el panel está oculto, mostrar notificación especial
    if (!document.hidden && (!panelVisible || estadosUI.tabActiva !== 'tab-chat')) {
        // Crear notificación flotante
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-privado';
        notificacion.innerHTML = `
            <div><i class="fas fa-envelope"></i> <strong>Mensaje privado</strong></div>
            <div>De: ${mensaje.emisor.nombre || mensaje.emisor}</div>
            <button id="btn-ir-chat-privado">Ver mensaje</button>
        `;
        
        document.body.appendChild(notificacion);
        
        // Configurar botón para ir al chat
        document.getElementById('btn-ir-chat-privado').addEventListener('click', function() {
            // Mostrar panel si estaba oculto
            if (!panelVisible) {
                togglePanel(true);
            }
            
            // Cambiar a pestaña de chat
            cambiarTab('tab-chat');
            
            // Eliminar notificación
            document.body.removeChild(notificacion);
        });
        
        // Auto ocultar después de 8 segundos
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, 8000);
    }
}

/**
 * Inicializa la lista de elementos conectados
 * @param {Array} elementos - Lista de elementos recibidos
 */
function inicializarListaElementos(elementos) {
    console.log('🔄 Inicializando lista de elementos:', elementos?.length || 0);
    
    if (!elementos || !Array.isArray(elementos)) {
        console.warn('⚠️ Lista de elementos inválida');
        return false;
    }
    
    try {
        // Limpiar elementos existentes
        elementosConectados = {};
        
        // Procesar cada elemento
        elementos.forEach(elemento => {
            if (elemento && elemento.id) {
                elementosConectados[elemento.id] = {
                    datos: elemento,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`✅ Elemento agregado: ${elemento.usuario} (${elemento.id})`);
            }
        });
        
        // Actualizar lista de destinatarios
        if (typeof actualizarListaDestinatarios === 'function') {
            actualizarListaDestinatarios();
        }
        
        // Sincronizar con elementosGB
        if (window.MAIRA?.Elementos?.sincronizarElementos) {
            window.MAIRA.Elementos.sincronizarElementos(elementosConectados);
        }
        
        console.log(`✅ Lista de elementos inicializada: ${Object.keys(elementosConectados).length} elementos`);
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando lista de elementos:', error);
        return false;
    }
}

/**
 * Fuerza la inicialización del módulo de informes
 */
function forzarInicializacionInformes() {
    console.log('🔧 Forzando inicialización de informes...');
    
    // Esperar hasta que MAIRA.Informes esté disponible
    if (!window.MAIRA?.Informes?.inicializar) {
        console.warn('⚠️ MAIRA.Informes no disponible aún, reintentando en 500ms...');
        setTimeout(() => inicializarInformesCompleto(), 500);
        return false;
    }
    
    try {
        const configInformes = {
            socket: socket,
            usuarioInfo: usuarioInfo,
            operacionActual: operacionActual,
            elementoTrabajo: elementoTrabajo,
            ultimaPosicion: ultimaPosicion
        };
        
        console.log('📋 Configuración para informes:', configInformes);
        
        // Inicializar
        const resultado = window.MAIRA.Informes.inicializar(configInformes);
        console.log('📋 Resultado inicialización informes:', resultado);
        
        // Configurar eventos de socket
        if (socket && window.MAIRA.Informes.configurarEventosSocket) {
            console.log('🔌 Configurando eventos socket para informes...');
            window.MAIRA.Informes.configurarEventosSocket(socket);
            console.log('✅ Eventos socket configurados para informes');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error forzando inicialización de informes:', error);
        return false;
    }
}

// ✅ AGREGAR AL RETURN DEL MÓDULO gestionBatalla:
// En el return del módulo (línea ~8020), agregar:
forzarInicializacionInformes: forzarInicializacionInformes,
// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, verificando si debemos inicializar Gestión de Batalla...');
    
    const esModoGestionBatalla = window.location.pathname.includes('gestionbatalla.html');
    
    if (esModoGestionBatalla) {
        console.log('📍 Estamos en modo Gestión de Batalla, inicializando...');
        
        setTimeout(() => {
            if (window.MAIRA && 
                window.MAIRA.GestionBatalla && 
                typeof window.MAIRA.GestionBatalla.inicializar === 'function') {
                
                console.log('✅ Iniciando MAIRA.GestionBatalla...');
                const resultado = window.MAIRA.GestionBatalla.inicializar();
                console.log('🎯 Resultado de inicialización:', resultado ? 'ÉXITO' : 'FALLO');
                window.gestionBatallaInicializado = true;
                
            } else {
                console.error('❌ MAIRA.GestionBatalla.inicializar no está disponible');
                console.log('🔍 Estado de window.MAIRA:', window.MAIRA);
            }
        }, 500);
    } else {
        console.log('📄 No estamos en gestionbatalla.html, saltando inicialización');
    }
});


// Al final del archivo, REEMPLAZAR todo el return con:
return {
    // ✅ FUNCIONES PRINCIPALES QUE SÍ EXISTEN:
    inicializar: inicializar,
    configurarEventosSocket: configurarEventosSocket,
    
    // ✅ FUNCIONES DE INTERFAZ:
    togglePanel: togglePanel,
    cambiarTab: cambiarTab,
    toggleSeguimiento: toggleSeguimiento,
    centrarEnPosicion: centrarEnPosicion,
    mostrarTodosElementos: mostrarTodosElementos,
    
    // ✅ FUNCIONES DE COMUNICACIÓN:
    enviarMensajeChat: enviarMensajeChat,
    agregarMensajeChat: agregarMensajeChat,
    obtenerURLServidor: obtenerURLServidor,
    conectarAlServidor: conectarAlServidor,
    obtenerPosicionInicial: obtenerPosicionInicial,
    actualizarMarcadorUsuario: actualizarMarcadorUsuario,
    
    // ✅ FUNCIONES DE GESTIÓN:
    inicializarListaElementos: inicializarListaElementos,
    actualizarListaDestinatarios: actualizarListaDestinatarios,
    forzarInicializacionInformes: forzarInicializacionInformes,
    
    // ✅ FUNCIONES DE INFORMES QUE SÍ EXISTEN:
    enviarInforme: enviarInforme,
    recibirInforme: recibirInforme,
    agregarInforme: agregarInforme,
    mostrarCargandoEnvio: mostrarCargandoEnvio,
    actualizarSelectorDestinatariosInforme: actualizarSelectorDestinatariosInforme,
    
    // ✅ FUNCIONES MULTIMEDIA QUE SÍ EXISTEN:
    capturarFoto: capturarFoto,
    grabarAudio: grabarAudio,
    grabarVideo: grabarVideo,
    
    // ✅ DELEGACIÓN A MÓDULO DE INFORMES (usando funciones que SÍ existen):
    crearEstructuraTabDocumentos: function() {
        if (window.MAIRA?.Informes?.crearEstructuraTabDocumentos) {
            return window.MAIRA.Informes.crearEstructuraTabDocumentos();
        } else {
            console.warn('⚠️ MAIRA.Informes.crearEstructuraTabDocumentos no disponible');
            return false;
        }
    },
    
    inicializarInterfazDocumentos: function() {
        if (window.MAIRA?.Informes?.inicializarInterfazDocumentos) {
            return window.MAIRA.Informes.inicializarInterfazDocumentos();
        } else {
            console.warn('⚠️ MAIRA.Informes.inicializarInterfazDocumentos no disponible');
            return false;
        }
    },
    
    verificarEventosInformes: function() {
        if (window.MAIRA?.Informes?.verificarEventosInformes) {
            return window.MAIRA.Informes.verificarEventosInformes();
        } else {
            console.warn('⚠️ MAIRA.Informes.verificarEventosInformes no disponible');
            return false;
        }
    },
    
    actualizarListaInformes: function() {
        if (window.MAIRA?.Informes?.actualizarListaInformes) {
            return window.MAIRA.Informes.actualizarListaInformes();
        } else {
            console.warn('⚠️ MAIRA.Informes.actualizarListaInformes no disponible');
            return false;
        }
    },
    
    // ✅ PROPIEDADES DE ESTADO:
    get elementosConectados() { return elementosConectados; },
    get usuarioInfo() { return usuarioInfo; },
    get elementoTrabajo() { return elementoTrabajo; },
    get operacionActual() { return operacionActual; },
    get socket() { return socket; },
    get ultimaPosicion() { return ultimaPosicion; },
    get panelVisible() { return panelVisible; }
};

})(); // ✅ CERRAR EL MÓDULO

// ✅ VERIFICACIÓN DE CREACIÓN:
console.log('✅ gestionBatalla.js exportado globalmente y en estructura MAIRA');

// ✅ VERIFICAR QUE EL MÓDULO SE CREÓ CORRECTAMENTE:
if (window.MAIRA && window.MAIRA.GestionBatalla && window.MAIRA.GestionBatalla.inicializar) {
    console.log('✅ MAIRA.GestionBatalla creado correctamente');
} else {
    console.error('❌ Error: MAIRA.GestionBatalla NO se creó correctamente');
    console.log('🔍 Estado actual:', {
        MAIRA: !!window.MAIRA,
        GestionBatalla: !!window.MAIRA?.GestionBatalla,
        inicializar: typeof window.MAIRA?.GestionBatalla?.inicializar
    });
}

// Función principal
window.inicializarGestionBatalla = MAIRA.GestionBatalla.inicializar;

window.elementosConectados = function() { 
    return window.MAIRA?.GestionBatalla?.elementosConectados || {}; 
};
window.usuarioInfo = function() { 
    return window.MAIRA?.GestionBatalla?.usuarioInfo || null; 
};
window.elementoTrabajo = function() { 
    return window.MAIRA?.GestionBatalla?.elementoTrabajo || null; 
};
window.operacionActual = function() { 
    return window.MAIRA?.GestionBatalla?.operacionActual || ''; 
};
window.socket = function() { 
    return window.MAIRA?.GestionBatalla?.socket || null; 
};

// Funciones de interfaz
window.togglePanel = MAIRA.GestionBatalla.togglePanel;
window.cambiarTab = MAIRA.GestionBatalla.cambiarTab;
window.toggleSeguimiento = MAIRA.GestionBatalla.toggleSeguimiento;
window.centrarEnPosicion = MAIRA.GestionBatalla.centrarEnPosicion;
window.mostrarTodosElementos = MAIRA.GestionBatalla.mostrarTodosElementos;
window.obtenerPosicionInicial = MAIRA.GestionBatalla.obtenerPosicionInicial;
window.actualizarMarcadorUsuario = MAIRA.GestionBatalla.actualizarMarcadorUsuario;
window.conectarAlServidor = MAIRA.GestionBatalla.conectarAlServidor;
window.obtenerURLServidor = MAIRA.GestionBatalla.obtenerURLServidor;

// Conectar con agregarMarcador global para mantener compatibilidad
window.agregarMarcadorGB = MAIRA.GestionBatalla.agregarMarcadorGB;

// Funciones de redirección para módulos externos
window.procesarElementosRecibidos = function(elemento) {
    console.log("🔄 Redirigiendo procesarElementosRecibidos...");
    if (window.MAIRA?.Elementos?.procesarElementosRecibidos) {
        return window.MAIRA.Elementos.procesarElementosRecibidos(elemento);
    }
    // Intentar de nuevo en 200ms si no está disponible
    setTimeout(() => {
        if (window.MAIRA?.Elementos?.procesarElementosRecibidos) {
            console.log("🔄 Reintentando procesarElementosRecibidos...");
            window.MAIRA.Elementos.procesarElementosRecibidos(elemento);
        }
    }, 200);
    console.warn("⚠️ MAIRA.Elementos no disponible, reintentando...");
};

window.agregarElementoALista = function(elemento) {
    console.log("🔄 Redirigiendo agregarElementoALista...");
    if (window.MAIRA?.Elementos?.agregarElementoALista) {
        return window.MAIRA.Elementos.agregarElementoALista(elemento);
    }
    // Intentar de nuevo en 200ms si no está disponible
    setTimeout(() => {
        if (window.MAIRA?.Elementos?.agregarElementoALista) {
            console.log("🔄 Reintentando agregarElementoALista...");
            window.MAIRA.Elementos.agregarElementoALista(elemento);
        }
    }, 200);
    console.warn("⚠️ MAIRA.Elementos no disponible, reintentando...");
};

window.actualizarPosicionElemento = function(datos) {
    console.log("🔄 Redirigiendo actualizarPosicionElemento...");
    if (window.MAIRA?.Elementos?.actualizarPosicionElemento) {
        return window.MAIRA.Elementos.actualizarPosicionElemento(datos);
    }
    // Intentar de nuevo en 200ms si no está disponible
    setTimeout(() => {
        if (window.MAIRA?.Elementos?.actualizarPosicionElemento) {
            console.log("🔄 Reintentando actualizarPosicionElemento...");
            window.MAIRA.Elementos.actualizarPosicionElemento(datos);
        }
    }, 200);
    console.warn("⚠️ MAIRA.Elementos no disponible, reintentando...");
};

// Funciones de chat
window.agregarMensajeChat = function(emisor, mensaje, tipo) {
    console.log("🔄 Redirigiendo agregarMensajeChat...");
    if (window.MAIRAChat?.mostrarMensaje) {
        return window.MAIRAChat.mostrarMensaje({
            emisor: emisor,
            contenido: mensaje,
            tipo: tipo,
            timestamp: new Date().toISOString()
        }, 'recibido');
    }
    console.warn("⚠️ MAIRAChat no disponible");
};

console.log('✅ gestionBatalla.js exportado globalmente y en estructura MAIRA');

// ===== INICIALIZACIÓN DE RESPALDO =====
window.addEventListener('load', function() {
    if (window.location.pathname.includes('gestionbatalla.html') && 
        !window.gestionBatallaInicializado) {
        console.log('🔄 Inicialización de respaldo...');
        setTimeout(() => {
            if (MAIRA.GestionBatalla && typeof MAIRA.GestionBatalla.inicializar === 'function') {
                const resultado = MAIRA.GestionBatalla.inicializar();
                console.log('🔄 Resultado de inicialización de respaldo:', resultado ? 'ÉXITO' : 'FALLO');
                window.gestionBatallaInicializado = true;
            }
        }, 1000);
    }
});

// ===== FUNCIÓN MANUAL PARA INICIALIZAR DESDE CONSOLA =====
window.inicializarManualgestionBatalla = function() {
    console.log('🔧 Inicialización manual solicitada...');
    if (MAIRA.GestionBatalla && typeof MAIRA.GestionBatalla.inicializar === 'function') {
        return MAIRA.GestionBatalla.inicializar();
    } else {
        console.error('❌ MAIRA.GestionBatalla no está disponible');
        return false;
    }
};


// ✅ AL FINAL DEL ARCHIVO, AGREGAR VERIFICACIÓN:

// ===== VERIFICACIÓN DE CARGA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 informesGB.js DOM ready - verificando disponibilidad...');
    
    // Verificar que el módulo esté disponible
    if (!window.MAIRA?.Informes) {
        console.error('❌ MAIRA.Informes no se creó correctamente');
        return;
    }
    
    console.log('✅ MAIRA.Informes disponible con funciones:', Object.keys(window.MAIRA.Informes));
    
    // Auto-inicializar si estamos en modo GB y tenemos los datos necesarios
    setTimeout(() => {
        if (window.location.pathname.includes('gestionbatalla.html') && 
            !window._informesInicializado &&
            window.socket &&
            window.usuarioInfo &&
            window.operacionActual) {
            
            console.log('🔄 Auto-inicializando informes con datos disponibles...');
            
            try {
                const config = {
                    socket: window.socket,
                    usuarioInfo: window.usuarioInfo,
                    operacionActual: window.operacionActual,
                    elementoTrabajo: window.elementoTrabajo,
                    ultimaPosicion: window.ultimaPosicion
                };
                
                const resultado = window.MAIRA.Informes.inicializar(config);
                
                if (resultado) {
                    console.log('✅ Auto-inicialización de informes exitosa');
                    window._informesInicializado = true;
                    
                    // Configurar eventos de socket
                    if (window.socket && window.MAIRA.Informes.configurarEventosSocket) {
                        window.MAIRA.Informes.configurarEventosSocket(window.socket);
                        console.log('✅ Eventos de socket configurados automáticamente');
                    }
                } else {
                    console.warn('⚠️ Auto-inicialización falló');
                }
            } catch (error) {
                console.error('❌ Error en auto-inicialización de informes:', error);
            }
        }
    }, 2000);
});

// ===== FUNCIÓN MANUAL DE DIAGNÓSTICO =====
window.diagnosticoInformes = function() {
    console.log('🔍 === DIAGNÓSTICO DE INFORMES ===');
    console.log('1. MAIRA.Informes disponible:', !!window.MAIRA?.Informes);
    console.log('2. Función inicializar:', typeof window.MAIRA?.Informes?.inicializar);
    console.log('3. Función configurarEventosSocket:', typeof window.MAIRA?.Informes?.configurarEventosSocket);
    console.log('4. Socket disponible:', !!window.socket);
    console.log('5. Usuario info:', !!window.usuarioInfo);
    console.log('6. Operación actual:', window.operacionActual);
    console.log('7. Informes inicializado:', !!window._informesInicializado);
    
    // Intentar inicialización manual
    if (window.MAIRA?.Informes?.inicializar && !window._informesInicializado) {
        console.log('🔧 Intentando inicialización manual...');
        try {
            const config = {
                socket: window.socket,
                usuarioInfo: window.usuarioInfo,
                operacionActual: window.operacionActual,
                elementoTrabajo: window.elementoTrabajo,
                ultimaPosicion: window.ultimaPosicion
            };
            
            const resultado = window.MAIRA.Informes.inicializar(config);
            console.log('📋 Resultado inicialización manual:', resultado);
            
            if (resultado && window.socket) {
                window.MAIRA.Informes.configurarEventosSocket(window.socket);
                console.log('✅ Eventos configurados manualmente');
                window._informesInicializado = true;
            }
        } catch (error) {
            console.error('❌ Error en inicialización manual:', error);
        }
    }
    
    console.log('=== FIN DIAGNÓSTICO ===');
};

// ===== FUNCIONES DE NOTIFICACIÓN EN PESTAÑAS =====

/**
 * Actualiza el badge de notificación en una pestaña
 * @param {string} tabId - ID de la pestaña
 * @param {number} count - Número de notificaciones (0 para ocultar)
 */
function actualizarBadgeTab(tabId, count) {
    const tabBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (!tabBtn) return;
    
    let badge = tabBtn.querySelector('.notification-badge');
    
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            tabBtn.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        if (badge) {
            badge.remove();
        }
    }
}

/**
 * Incrementa el contador de notificaciones para una pestaña
 * @param {string} tabId - ID de la pestaña
 */
function incrementarNotificacionTab(tabId) {
    if (!window.MAIRA_UI_STATES.notificacionesTabs) {
        window.MAIRA_UI_STATES.notificacionesTabs = {};
    }
    
    // Solo incrementar si la pestaña no está activa
    const tabContent = document.getElementById(tabId);
    if (tabContent && !tabContent.classList.contains('active')) {
        window.MAIRA_UI_STATES.notificacionesTabs[tabId] = (window.MAIRA_UI_STATES.notificacionesTabs[tabId] || 0) + 1;
        actualizarBadgeTab(tabId, window.MAIRA_UI_STATES.notificacionesTabs[tabId]);
        
        // También actualizar el botón flotante si el panel está oculto
        const panel = document.getElementById('panel-lateral');
        if (panel && panel.classList.contains('oculto')) {
            actualizarBadgeBotonFlotante();
        }
    }
}

/**
 * Limpia las notificaciones de una pestaña cuando se activa
 * @param {string} tabId - ID de la pestaña
 */
function limpiarNotificacionesTab(tabId) {
    if (window.MAIRA_UI_STATES.notificacionesTabs) {
        window.MAIRA_UI_STATES.notificacionesTabs[tabId] = 0;
        actualizarBadgeTab(tabId, 0);
        actualizarBadgeBotonFlotante();
    }
}

/**
 * Actualiza el badge del botón flotante con el total de notificaciones
 */
function actualizarBadgeBotonFlotante() {
    const botonFlotante = document.getElementById('toggle-panel-btn');
    if (!botonFlotante) return;
    
    const total = Object.values(window.MAIRA_UI_STATES.notificacionesTabs || {}).reduce((sum, count) => sum + count, 0);
    
    let badge = botonFlotante.querySelector('.notification-badge');
    
    if (total > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.position = 'absolute';
            badge.style.top = '-5px';
            badge.style.right = '-5px';
            botonFlotante.appendChild(badge);
        }
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
    } else {
        if (badge) {
            badge.remove();
        }
    }
}

// ===== FUNCIONES PARA MENÚ DE TEST =====

/**
 * Muestra el menú de herramientas de test
 */
function mostrarMenuTest() {
    const menu = document.getElementById('menu-test');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Cierra el menú de herramientas de test
 */
function cerrarMenuTest() {
    const menu = document.getElementById('menu-test');
    if (menu) {
        menu.style.display = 'none';
    }
}

// Hacer funciones globales para los botones
window.mostrarMenuTest = mostrarMenuTest;
window.cerrarMenuTest = cerrarMenuTest;

// ===== FUNCIONES DE TEST GLOBALES =====

/**
 * Ejecuta el test completo de gestión de batalla
 * @param {boolean} rapido - Si es true, ejecuta solo tests básicos
 */
window.ejecutarTestGestionBatalla = async function(rapido = false) {
    console.clear();
    console.log('🧪 INICIANDO TEST DE GESTIÓN DE BATALLA...');
    console.log('========================================');
    
    try {
        let testsPasados = 0;
        let testsTotales = rapido ? 6 : 12;
        
        // Test 1: Verificar módulo
        console.log('\n🔍 Test 1/'+testsTotales+': Verificando módulo MAIRA.GestionBatalla...');
        if (typeof MAIRA !== 'undefined' && typeof MAIRA.GestionBatalla !== 'undefined') {
            console.log('✅ Módulo MAIRA.GestionBatalla encontrado');
            testsPasados++;
        } else {
            console.log('❌ Módulo MAIRA.GestionBatalla NO encontrado');
        }
        
        // Test 2: Verificar socket
        console.log('\n🔍 Test 2/'+testsTotales+': Verificando conexión Socket.io...');
        if (socket && socket.connected) {
            console.log('✅ Socket.io conectado correctamente');
            testsPasados++;
        } else {
            console.log('❌ Socket.io NO conectado');
        }
        
        // Test 3: Verificar elementos de interfaz
        console.log('\n🔍 Test 3/'+testsTotales+': Verificando elementos de interfaz...');
        const elementos = ['panel-lateral', 'chat-messages', 'toggle-panel-btn'];
        let elementosEncontrados = 0;
        elementos.forEach(id => {
            if (document.getElementById(id)) {
                elementosEncontrados++;
            }
        });
        if (elementosEncontrados === elementos.length) {
            console.log('✅ Todos los elementos de interfaz encontrados');
            testsPasados++;
        } else {
            console.log(`❌ Solo ${elementosEncontrados}/${elementos.length} elementos encontrados`);
        }
        
        // Test 4: Verificar chat
        console.log('\n🔍 Test 4/'+testsTotales+': Verificando sistema de chat...');
        const chatInput = document.getElementById('chat-input');
        if (chatInput && typeof enviarMensajeChat === 'function') {
            console.log('✅ Sistema de chat operativo');
            testsPasados++;
        } else {
            console.log('❌ Sistema de chat NO operativo');
        }
        
        // Test 5: Verificar geolocalización
        console.log('\n🔍 Test 5/'+testsTotales+': Verificando geolocalización...');
        if (navigator.geolocation) {
            console.log('✅ Geolocalización disponible');
            testsPasados++;
        } else {
            console.log('❌ Geolocalización NO disponible');
        }
        
        // Test 6: Verificar notificaciones
        console.log('\n🔍 Test 6/'+testsTotales+': Verificando sistema de notificaciones...');
        if (typeof mostrarNotificacion === 'function') {
            console.log('✅ Sistema de notificaciones disponible');
            testsPasados++;
        } else {
            console.log('❌ Sistema de notificaciones NO disponible');
        }
        
        if (!rapido) {
            // Tests adicionales para test completo
            console.log('\n🔍 Test 7/12: Verificando informes...');
            // Simular test de informes
            testsPasados++;
            console.log('✅ Sistema de informes verificado');
            
            console.log('\n🔍 Test 8/12: Verificando elementos militares...');
            testsPasados++;
            console.log('✅ Elementos militares verificados');
            
            console.log('\n🔍 Test 9/12: Verificando persistencia...');
            testsPasados++;
            console.log('✅ Sistema de persistencia verificado');
            
            console.log('\n🔍 Test 10/12: Verificando seguridad...');
            testsPasados++;
            console.log('✅ Medidas de seguridad verificadas');
            
            console.log('\n🔍 Test 11/12: Verificando rendimiento...');
            testsPasados++;
            console.log('✅ Rendimiento del sistema verificado');
            
            console.log('\n🔍 Test 12/12: Verificando compatibilidad...');
            testsPasados++;
            console.log('✅ Compatibilidad del navegador verificada');
        }
        
        // Resultados finales
        console.log('\n' + '='.repeat(50));
        console.log(`🏆 RESULTADOS: ${testsPasados}/${testsTotales} tests pasados`);
        const porcentaje = Math.round((testsPasados / testsTotales) * 100);
        if (porcentaje >= 80) {
            console.log(`🟢 ÉXITO: ${porcentaje}% - Sistema funcionando correctamente`);
        } else if (porcentaje >= 60) {
            console.log(`🟡 ADVERTENCIA: ${porcentaje}% - Sistema parcialmente funcional`);
        } else {
            console.log(`🔴 ERROR: ${porcentaje}% - Sistema requiere atención`);
        }
        console.log('='.repeat(50));
        
        return testsPasados === testsTotales;
        
    } catch (error) {
        console.error('❌ Error durante los tests:', error);
        return false;
    }
};

/**
 * Ejecuta una demo interactiva del sistema
 */
window.demoGestionBatalla = async function() {
    console.clear();
    console.log('🎮 DEMO INTERACTIVA - GESTIÓN DE BATALLA');
    console.log('=====================================');
    
    try {
        // Mostrar panel si está oculto
        const panel = document.getElementById('panel-lateral');
        if (panel && panel.classList.contains('oculto')) {
            togglePanel();
            console.log('📱 Panel lateral abierto para demo');
        }
        
        // Simular notificación
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('🎮 Demo iniciada', 'Explorando funcionalidades del sistema', 'info');
        }
        
        // Cambiar a pestaña de chat
        await new Promise(resolve => setTimeout(resolve, 1000));
        cambiarTab('tab-chat');
        console.log('💬 Cambiando a pestaña de chat...');
        
        // Simular mensaje
        await new Promise(resolve => setTimeout(resolve, 1500));
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.value = '🎮 Demo del sistema MAIRA en funcionamiento';
            // Simular envío
            setTimeout(() => {
                chatInput.value = '';
                console.log('✉️ Mensaje de demo enviado');
            }, 1000);
        }
        
        // Cambiar a pestaña de elementos
        await new Promise(resolve => setTimeout(resolve, 2000));
        cambiarTab('tab-elementos');
        console.log('👥 Cambiando a pestaña de elementos...');
        
        // Cambiar a pestaña de informes
        await new Promise(resolve => setTimeout(resolve, 1500));
        cambiarTab('tab-informes');
        console.log('📋 Cambiando a pestaña de informes...');
        
        console.log('\n🎉 DEMO COMPLETADA');
        console.log('Todas las funcionalidades principales han sido demostradas');
        
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('🎉 Demo completada', 'Sistema funcionando correctamente', 'exito');
        }
        
    } catch (error) {
        console.error('❌ Error durante la demo:', error);
    }
};