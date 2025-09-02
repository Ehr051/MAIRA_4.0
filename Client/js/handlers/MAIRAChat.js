/**
 * MAIRAChat - Sistema de chat unificado para MAIRA
 * Reemplaza: chat.js, chatGB.js, gestorChat.js
 * Usa contenedores existentes en cada HTML
 */

window.MAIRAChat = (function() {
    'use strict';
    
    // Variables globales
    let socket = null;
    let usuario = null;
    let modulo = null;
    let contenedores = {};
    let mensajesEnviados = new Set();
    let isInitialized = false;
    
    // CONFIGURACIÓN CORREGIDA según contenedores REALES:
    const CONFIGURACION_MODULOS = {
        'iniciarpartida': {
            contenedorMensajes: '#chatMessages',
            inputMensaje: '#inputChat',
            botonEnviar: '#btnEnviarMensaje',
            eventos: {
                enviar: 'mensajeChat',
                recibir: 'mensajeChat'
            }
        },
        'inicioGB': {  // ✅ AGREGAR ESTE MÓDULO
            contenedorMensajes: '#chatMessages',
            inputMensaje: '#inputChat',
            botonEnviar: '#btnEnviarMensaje',
            eventos: {
                enviar: 'mensajeChat',
                recibir: 'mensajeChat'
            }
        },
        'gestionbatalla': {
            contenedorMensajes: '#chat-messages',
            inputMensaje: '#mensaje-chat',
            botonEnviar: '#enviar-mensaje',
            selectorDestinatario: '#select-destinatario',
            eventos: {
                enviar: 'mensajeChat',
                recibir: 'mensajeChat',
                privado: 'mensajePrivado'
            }
        },
        'juegodeguerra': {
            // ❌ NO TIENE CONTENEDORES - CREAR DINÁMICAMENTE
            crearDinamicamente: true,
            eventos: {
                enviar: 'mensajeJuego',
                recibir: 'mensajeJuego'
            }
        }
    };
    
    /**
     * Inicializa el chat unificado
     */
    function inicializar(config = {}) {
        console.log('🚀 Inicializando MAIRAChat v3.0.0');
        
        // Limpiar inicialización previa
        limpiarSistemasAnteriores();
        
        // Detectar módulo
        modulo = detectarModulo();
        console.log('📱 Módulo detectado:', modulo);
        
        // Configurar referencias
        socket = config.socket;
        usuario = config.usuario;
        
        // ✅ VERIFICAR SI SE DEBE FORZAR CREACIÓN
        if (config.forzarCreacion && modulo === 'juegodeguerra') {
            console.log('🔧 Forzando creación de contenedores para juegodeguerra...');
            const exito = crearContenedoresJuegoDinamicamente();
            if (exito) {
                isInitialized = true;
                configurarEventos();
                if (socket) {
                    configurarSocket();
                    console.log('✅ Socket configurado:', socket.id);
                }
                console.log('✅ MAIRAChat inicializado con creación forzada');
                return true;
            } else {
                console.error('❌ Falló la creación forzada de contenedores');
                return false;
            }
        }
        
        // Encontrar contenedores normalmente
        if (!encontrarContenedores()) {
            console.error('❌ No se pudieron encontrar contenedores necesarios');
            
            // PARA JUEGODEGUERRA: Intentar creación automática
            if (modulo === 'juegodeguerra') {
                console.log('🎮 Creando contenedores dinámicamente para juegodeguerra...');
                const exito = crearContenedoresJuegoDinamicamente();
                if (!exito) {
                    console.error('❌ Falló la creación dinámica de contenedores');
                    return false;
                }
            } else {
                return false;
            }
        }
        
        // Configurar eventos y socket
        configurarEventos();
        if (socket) {
            configurarSocket();
            console.log('✅ Socket configurado:', socket.id);
        }
        
        isInitialized = true;
        console.log('✅ MAIRAChat inicializado correctamente');
        return true;
    }
    
    /**
     * Muestra mensaje local (antes de confirmación)
     */
    function mostrarMensajeLocal(mensaje) {
        console.log('📤 Mostrando mensaje local:', mensaje);
        
        // Asegurar que tenga estado de enviando
        mensaje.estado = 'enviando';
        
        // LLAMAR A mostrarMensaje correctamente
        mostrarMensaje(mensaje, 'enviado');
        
        // Simular progresión de estados
        setTimeout(() => {
            actualizarEstadoMensaje(mensaje.id, 'enviado');
        }, 500);
    }
    
    /**
     * Detecta el módulo actual según la URL
     */
    function detectarModulo() {
        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop().replace('.html', '');
        
        console.log('🔍 Detectando módulo desde:', pathname, 'filename:', filename);
        
        // ✅ MEJORAR DETECCIÓN:
        if (filename === 'iniciarpartida' || pathname.includes('iniciarpartida')) {
            return 'iniciarpartida';
        } else if (filename === 'inicioGB' || pathname.includes('inicioGB')) {
            return 'inicioGB';
        } else if (filename === 'gestionbatalla' || pathname.includes('gestionbatalla')) {
            return 'gestionbatalla';
        } else if (filename === 'juegodeguerra' || pathname.includes('juegodeguerra')) {
            return 'juegodeguerra';
        }
        
        // ✅ FALLBACK MEJORADO POR CONTENIDO:
        if (document.getElementById('chatMessages')) {
            // Distinguir entre iniciarpartida e inicioGB
            if (pathname.includes('inicioGB') || 
                document.querySelector('.operaciones-panel') ||
                document.querySelector('#operacionesPanel') ||
                document.querySelector('.card-header') && 
                document.querySelector('.card-header').textContent.includes('Operaciones')) {
                return 'inicioGB';
            }
            return 'iniciarpartida';
        }
        
        if (document.getElementById('chat-messages')) {
            return 'gestionbatalla';
        }
        
        // ✅ ÚLTIMO FALLBACK - BUSCAR ELEMENTOS ÚNICOS:
        if (document.querySelector('.chat-juego') || 
            window.location.href.includes('juego')) {
            return 'juegodeguerra';
        }
        
        console.warn('⚠️ No se pudo detectar módulo, usando gestionbatalla por defecto');
        return 'gestionbatalla';
    }
    
    /**
     * Encuentra y mapea los contenedores existentes
     */
    function encontrarContenedores() {
        const config = CONFIGURACION_MODULOS[modulo];
        
        // Para juegodeguerra, crear contenedores dinámicamente
        if (config?.crearDinamicamente) {
            return crearContenedoresJuegoDinamicamente();
        }
        
        console.log('🔍 Buscando contenedores para módulo:', modulo);
        console.log('📝 Configuración:', config);
        
        contenedores = {
            mensajes: document.querySelector(config.contenedorMensajes),
            input: document.querySelector(config.inputMensaje),
            botonEnviar: document.querySelector(config.botonEnviar),
            selectorDestinatario: config.selectorDestinatario ? 
                document.querySelector(config.selectorDestinatario) : null,
            selectorDestino: config.selectorDestino ? 
                document.querySelector(config.selectorDestino) : null
        };
        
        console.log('📦 Contenedores encontrados:', contenedores);
        
        // Verificar elementos críticos
        const elementosCriticos = ['mensajes', 'input', 'botonEnviar'];
        const faltantes = elementosCriticos.filter(key => !contenedores[key]);
        
        if (faltantes.length > 0) {
            console.error('❌ Elementos críticos faltantes:', faltantes);
            return false;
        }
        
        console.log('✅ Todos los contenedores encontrados');
        return true;
    }
    
    /**
     * Crea contenedores dinámicamente para juegodeguerra
     */
    function crearContenedoresJuegoDinamicamente() {
        console.log('🎮 Creando contenedores dinámicamente para juegodeguerra');
        
        // Verificar si ya existe
        let chatContainer = document.getElementById('chatJuego');
        if (chatContainer) {
            console.log('🎮 Contenedor ya existe, eliminando para recrear');
            chatContainer.remove();
        }
        
        // Crear contenedor principal
        chatContainer = document.createElement('div');
        chatContainer.id = 'chatJuego';
        chatContainer.className = 'chat-juego';
        
        // HTML con estilos inline para asegurar visibilidad
        chatContainer.innerHTML = `
            <div class="chat-header" style="background: #0281a8; color: white; padding: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0;">
                <span style="font-weight: bold;">💬 Chat del Juego</span>
                <div class="chat-controls" style="display: flex; gap: 10px; align-items: center;">
                    <select id="chatDestino" style="background: #333; color: white; border: none; padding: 2px 6px; border-radius: 3px; font-size: 12px;">
                        <option value="global">🌍 Global</option>
                        <option value="equipo">👥 Mi Equipo</option>
                        ${window.equipoJugador === 'Director' ? '<option value="director">⭐ Director</option>' : ''}
                    </select>
                    <button id="btn-minimizar-chat" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; padding: 0 4px;">−</button>
                </div>
            </div>
            <div class="chat-mensajes" style="height: 200px; overflow-y: auto; padding: 10px; background: rgba(0,0,0,0.7); color: white; border-left: 1px solid #333; border-right: 1px solid #333;"></div>
            <div class="chat-input-area" style="padding: 8px; display: flex; gap: 5px; background: rgba(0,0,0,0.8); border-radius: 0 0 8px 8px;">
                <input type="text" id="chatInputMensaje" placeholder="Escribe un mensaje..." style="flex: 1; background: #333; color: white; border: 1px solid #555; padding: 4px 8px; border-radius: 4px;">
                <button id="btnEnviarChat" style="background: #0281a8; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">Enviar</button>
            </div>
        `;
        
        // Estilos críticos inline
        chatContainer.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 300px !important;
            background: rgba(0, 0, 0, 0.95) !important;
            border: 1px solid #333 !important;
            border-radius: 8px !important;
            z-index: 10000 !important;
            font-family: Arial, sans-serif !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            display: block !important;
            visibility: visible !important;
        `;
        
        // Agregar al DOM
        document.body.appendChild(chatContainer);
        console.log('🎮 Contenedor agregado al DOM');
        
        // Configurar funcionalidad minimizar/maximizar
        const btnMinimizar = chatContainer.querySelector('#btn-minimizar-chat');
        const chatHeader = chatContainer.querySelector('.chat-header');
        const chatMensajes = chatContainer.querySelector('.chat-mensajes');
        const chatInputArea = chatContainer.querySelector('.chat-input-area');
        
        if (btnMinimizar) {
            btnMinimizar.addEventListener('click', function(e) {
                e.stopPropagation();
                const minimizado = chatMensajes.style.display === 'none';
                
                if (minimizado) {
                    // Maximizar
                    chatMensajes.style.display = 'block';
                    chatInputArea.style.display = 'flex';
                    btnMinimizar.textContent = '−';
                } else {
                    // Minimizar
                    chatMensajes.style.display = 'none';
                    chatInputArea.style.display = 'none';
                    btnMinimizar.textContent = '+';
                }
            });
        }
        
        if (chatHeader) {
            chatHeader.addEventListener('click', function() {
                if (chatMensajes.style.display === 'none') {
                    // Restaurar si está minimizado
                    chatMensajes.style.display = 'block';
                    chatInputArea.style.display = 'flex';
                    if (btnMinimizar) btnMinimizar.textContent = '−';
                }
            });
        }
        
        // Actualizar referencias de contenedores
        contenedores = {
            mensajes: chatContainer.querySelector('.chat-mensajes'),
            input: chatContainer.querySelector('#chatInputMensaje'),
            botonEnviar: chatContainer.querySelector('#btnEnviarChat'),
            selectorDestino: chatContainer.querySelector('#chatDestino')
        };
        
        // Verificar que se crearon correctamente
        const todosCreados = Object.values(contenedores).every(c => c !== null);
        
        console.log('✅ Contenedores dinámicos configurados:', {
            creados: todosCreados,
            contenedores: Object.keys(contenedores)
        });
        
        // Agregar mensaje de bienvenida
        if (contenedores.mensajes) {
            const bienvenida = document.createElement('div');
            bienvenida.style.cssText = 'color: #4fc3f7; font-size: 12px; margin-bottom: 5px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;';
            bienvenida.innerHTML = '<strong>💬 Chat iniciado</strong><br>Listo para comunicarte';
            contenedores.mensajes.appendChild(bienvenida);
        }
        
        return todosCreados;
    }
    
    /**
     * Agrega estilos para juegodeguerra
     */
    function agregarEstilosJuegoDeguerra() {
        if (document.getElementById('maira-chat-juego-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'maira-chat-juego-styles';
        style.textContent = `
            .chat-juego {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                max-height: 400px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #333;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                z-index: 1000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .chat-juego.minimizado {
                max-height: 40px;
                overflow: hidden;
            }
            
            .chat-juego .chat-header {
                background: #0281a8;
                color: white;
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 8px 8px 0 0;
                cursor: pointer;
            }
            
            .chat-juego .chat-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .chat-juego .chat-destino {
                background: #333;
                color: white;
                border: none;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 12px;
            }
            
            .chat-juego .btn-minimizar {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
                padding: 0 4px;
            }
            
            .chat-juego .chat-mensajes {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                max-height: 250px;
                min-height: 100px;
                background: rgba(255, 255, 255, 0.05);
            }
            
            .chat-juego .chat-input-area {
                padding: 8px;
                border-top: 1px solid #333;
                display: flex;
                gap: 5px;
                background: rgba(0, 0, 0, 0.8);
            }
            
            .chat-juego #chatInputMensaje {
                flex: 1;
                background: #333;
                color: white;
                border: 1px solid #555;
                padding: 4px 8px;
                border-radius: 4px;
            }
            
            .chat-juego #btnEnviarChat {
                background: #0281a8;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .chat-juego #btnEnviarChat:hover {
                background: #026d8f;
            }
            
            .chat-juego .mensaje {
                margin-bottom: 5px;
                padding: 4px 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                font-size: 12px;
                word-wrap: break-word;
            }
            
            .chat-juego .mensaje-tiempo {
                color: #aaa;
                font-size: 10px;
                margin-right: 5px;
            }
            
            .chat-juego .mensaje-emisor {
                color: #4fc3f7;
                font-weight: bold;
                margin-right: 5px;
            }
            
            .chat-juego .mensaje-contenido {
                color: white;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Configura eventos de la interfaz
     */
    function configurarEventos() {
        console.log('🔧 Configurando eventos para módulo:', modulo);
        
        // Limpiar eventos anteriores CORRECTAMENTE
        if (contenedores.botonEnviar) {
            // Clonar el botón para eliminar todos los event listeners
            const nuevoBoton = contenedores.botonEnviar.cloneNode(true);
            contenedores.botonEnviar.parentNode.replaceChild(nuevoBoton, contenedores.botonEnviar);
            contenedores.botonEnviar = nuevoBoton;
            
            console.log('🔧 Botón enviar clonado:', contenedores.botonEnviar);
        }
        
        if (contenedores.input) {
            const nuevoInput = contenedores.input.cloneNode(true);
            contenedores.input.parentNode.replaceChild(nuevoInput, contenedores.input);
            contenedores.input = nuevoInput;
            
            console.log('🔧 Input clonado:', contenedores.input);
        }
        
        // CONFIGURAR nuevos eventos
        if (contenedores.botonEnviar) {
            contenedores.botonEnviar.addEventListener('click', function(e) {
                console.log('🖱️ Click en botón enviar detectado');
                e.preventDefault();
                e.stopPropagation();
                enviarMensaje();
            });
            console.log('✅ Event listener click configurado en botón');
        }
        
        if (contenedores.input) {
            contenedores.input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('⌨️ Enter detectado en input');
                    e.preventDefault();
                    e.stopPropagation();
                    enviarMensaje();
                }
            });
            console.log('✅ Event listener keypress configurado en input');
        }
        
        // EVENTOS ESPECÍFICOS DE GESTIONBATALLA
        if (modulo === 'gestionbatalla') {
            // Botones de tipo de chat
            const btnGeneral = document.getElementById('btn-chat-general');
            const btnPrivado = document.getElementById('btn-chat-privado');
            const selectorDestinatario = document.getElementById('select-destinatario');
            const divDestinatario = document.getElementById('chat-destinatario');
            
            if (btnGeneral) {
                btnGeneral.addEventListener('click', function() {
                    console.log('🔄 Cambiando a chat general');
                    btnGeneral.classList.add('active');
                    if (btnPrivado) btnPrivado.classList.remove('active');
                    if (divDestinatario) divDestinatario.classList.add('d-none');
                });
            }
            
            if (btnPrivado) {
                btnPrivado.addEventListener('click', function() {
                    console.log('🔄 Cambiando a chat privado');
                    btnPrivado.classList.add('active');
                    if (btnGeneral) btnGeneral.classList.remove('active');
                    if (divDestinatario) divDestinatario.classList.remove('d-none');
                });
            }
            
            console.log('✅ Eventos específicos de gestionbatalla configurados');
        }
        
        console.log('✅ Eventos configurados para módulo:', modulo);
    }
    
    /**
     * Configura eventos del socket
     */
    function configurarSocket() {
        const config = CONFIGURACION_MODULOS[modulo];
        
        // Limpiar listeners anteriores
        socket.off(config.eventos.recibir);
        if (config.eventos.privado) socket.off(config.eventos.privado);
        
        // Configurar nuevos listeners
        socket.on(config.eventos.recibir, recibirMensaje);
        
        if (config.eventos.privado) {
            socket.on(config.eventos.privado, recibirMensajePrivado);
        }
        
        // Eventos específicos por módulo
        switch (modulo) {
            case 'gestionbatalla':
                socket.on('listaElementosGB', actualizarDestinatarios);
                socket.on('elementoConectadoGB', agregarDestinatario);
                socket.on('elementoDesconectadoGB', removerDestinatario);
                break;
        }
        
        console.log('✅ Socket configurado para módulo:', modulo);
    }
    
    /**
     * Envía un mensaje
     */
    function enviarMensaje() {
        if (!contenedores.input || !socket?.connected) {
            console.warn('❌ No se puede enviar mensaje: input o socket no disponible');
            return;
        }
        
        const texto = contenedores.input.value.trim();
        if (!texto) return;
        
        const config = CONFIGURACION_MODULOS[modulo];
        const mensajeId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear objeto mensaje según módulo
        const mensaje = crearObjetoMensaje(texto, mensajeId);
        
        // Agregar a mensajes enviados ANTES de enviar
        mensajesEnviados.add(mensajeId);
        
        // Mostrar localmente primero
        mostrarMensajeLocal(mensaje);
        
        // Enviar al servidor
        const eventoEnvio = determinarEventoEnvio(mensaje);
        socket.emit(eventoEnvio, mensaje);
        
        // Limpiar input
        contenedores.input.value = '';
        contenedores.input.focus();
        
        console.log('📤 Mensaje enviado:', mensajeId);
    }
    
    /**
     * Crea objeto mensaje según el módulo
     */
    function crearObjetoMensaje(texto, mensajeId) {
        const timestamp = new Date().toISOString();
        const baseMessage = {
            id: mensajeId,
            contenido: texto,
            mensaje: texto, // Compatibilidad
            timestamp: timestamp,
            emisor: usuario,
            usuario: typeof usuario === 'object' ? usuario.usuario : usuario
        };
        
        switch (modulo) {
            case 'iniciarpartida':
                return {
                    ...baseMessage,
                    sala: window.partidaActual?.codigo || 'general'
                };
                
            case 'gestionbatalla':
                const esPrivado = document.getElementById('btn-chat-privado')?.classList.contains('active');
                const destinatario = esPrivado ? contenedores.selectorDestinatario?.value : null;
                
                return {
                    ...baseMessage,
                    sala: window.operacionActual || 'general',
                    tipo: esPrivado ? 'privado' : 'global',
                    destinatario: destinatario,
                    emisor: {
                        id: window.usuarioInfo?.id || 'user_unknown',
                        nombre: typeof usuario === 'object' ? usuario.usuario : usuario
                    }
                };
                
            case 'juegodeguerra':
                const destino = contenedores.selectorDestino?.value || 'global';
                return {
                    ...baseMessage,
                    tipo: destino,
                    equipo: window.equipoJugador,
                    partidaId: window.codigoPartida
                };
                
            default:
                return baseMessage;
        }
    }
    
    /**
     * Determina el evento de envío según el mensaje
     */
    function determinarEventoEnvio(mensaje) {
        const config = CONFIGURACION_MODULOS[modulo];
        
        if (modulo === 'gestionbatalla' && mensaje.tipo === 'privado') {
            return config.eventos.privado;
        }
        
        return config.eventos.enviar;
    }
    
    /**
     * Recibe mensajes del servidor
     */
    function recibirMensaje(mensaje) {
        if (!mensaje) return;
        
        console.log('📥 Mensaje recibido:', mensaje);
        
        // **IMPORTANTE**: Verificar si es eco de nuestro propio mensaje
        if (mensaje.id && mensajesEnviados.has(mensaje.id)) {
            console.log('🔄 Eco detectado, ignorando mensaje:', mensaje.id);
            // Solo actualizar estado si es diferente
            if (mensaje.estado) {
                actualizarEstadoMensaje(mensaje.id, mensaje.estado);
            }
            return;
        }
        
        // Verificar si es mensaje propio por emisor
        const esMensajePropio = esMensajeMio(mensaje);
        if (esMensajePropio) {
            console.log('👤 Mensaje propio detectado por emisor, ignorando');
            return;
        }
        
        // Mostrar mensaje
        mostrarMensaje(mensaje, 'recibido');
    }
    
    /**
     * Recibe mensajes privados
     */
    function recibirMensajePrivado(mensaje) {
        console.log('🔒 Mensaje privado recibido:', mensaje);
        
        // Verificar si es eco
        if (mensaje.id && mensajesEnviados.has(mensaje.id)) {
            console.log('🔄 Eco de mensaje privado, ignorando');
            return;
        }
        
        mostrarMensaje(mensaje, 'privado');
    }
    
    /**
     * Verifica si un mensaje es mío
     */
    function esMensajeMio(mensaje) {
        const miNombre = typeof usuario === 'object' ? usuario.usuario : usuario;
        const miId = typeof usuario === 'object' ? usuario.id : null;
        
        // Verificar por ID si está disponible
        if (miId && mensaje.emisor?.id) {
            return mensaje.emisor.id === miId;
        }
        
        // Verificar por nombre
        const emisorNombre = typeof mensaje.emisor === 'object' ? 
            (mensaje.emisor.nombre || mensaje.emisor.usuario) : 
            (mensaje.emisor || mensaje.usuario);
            
        return emisorNombre === miNombre;
    }
    
    /**
     * Actualiza estado de mensaje con indicadores visuales
     */
    function actualizarEstadoMensaje(mensajeId, estado) {
        const mensajeElement = document.getElementById(`msg-${mensajeId}`);
        if (!mensajeElement) return;
        
        let estadoElement = mensajeElement.querySelector('.estado');
        if (!estadoElement) {
            estadoElement = document.createElement('span');
            estadoElement.className = 'estado';
            estadoElement.style.cssText = 'margin-left: 5px; font-size: 12px;';
            mensajeElement.appendChild(estadoElement);
        }
        
        // Convertir array a string si es necesario
        const estadoTexto = Array.isArray(estado) ? estado.join('') : estado;
        
        // Indicadores visuales mejorados
        let icono = '';
        let clase = '';
        let color = '';
        
        switch (estadoTexto) {
            case 'enviando':
                icono = '●'; // Punto amarillo
                clase = 'enviando';
                color = '#ffc107';
                break;
            case 'enviado':
                icono = '✓'; // Check simple
                clase = 'enviado';
                color = '#28a745';
                break;
            case 'entregado':
                icono = '✓✓'; // Doble check
                clase = 'entregado';
                color = '#28a745';
                break;
            case 'leido':
                icono = '✓✓'; // Doble check azul
                clase = 'leido';
                color = '#007bff';
                break;
            default:
                icono = '⏳'; // Esperando
                clase = 'pendiente';
                color = '#6c757d';
        }
        
        estadoElement.innerHTML = icono;
        estadoElement.className = `estado ${clase}`;
        estadoElement.style.color = color;
    }
    
    /**
     * Actualiza destinatarios (para gestionbatalla)
     */
    function actualizarDestinatarios(elementos) {
        if (modulo !== 'gestionbatalla' || !contenedores.selectorDestinatario) return;
        
        const select = contenedores.selectorDestinatario;
        const opciones = Array.from(select.options);
        const opcionesBasicas = opciones.slice(0, 3); // Mantener las primeras 3
        
        // Limpiar opciones de elementos
        select.innerHTML = '';
        opcionesBasicas.forEach(opcion => select.appendChild(opcion));
        
        // Agregar elementos conectados
        Object.values(elementos || {}).forEach(elemento => {
            if (elemento.datos?.usuario !== usuario) {
                const option = document.createElement('option');
                option.value = elemento.datos?.id || elemento.id;
                option.textContent = elemento.datos?.usuario || 'Usuario desconocido';
                select.appendChild(option);
            }
        });
    }
    
    /**
     * Obtiene nombre del destinatario
     */
    function obtenerNombreDestinatario(destinatarioId) {
        if (!destinatarioId || destinatarioId === 'todos') return 'Todos';
        
        const select = contenedores.selectorDestinatario;
        if (!select) return destinatarioId;
        
        const option = select.querySelector(`option[value="${destinatarioId}"]`);
        return option ? option.textContent : destinatarioId;
    }
    
    /**
     * Limpia sistemas de chat anteriores
     */
    function limpiarSistemasAnteriores() {
        // Remover listeners globales anteriores
        ['enviarMensajeChat', 'recibirMensajeChat', 'agregarMensajeChat'].forEach(fn => {
            if (window[fn]) delete window[fn];
        });
        
        // Remover contenedores creados por sistemas anteriores
        ['maira-chat-container', 'panel-chat'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) elemento.remove();
        });
        
        console.log('🧹 Sistemas anteriores limpiados');
    }
    
    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }
    
    /**
     * Muestra un mensaje en el chat - MOVER ESTA FUNCIÓN AQUÍ ADENTRO
     */
    function mostrarMensaje(mensaje, tipo = 'recibido') {
        console.log('💬 [DEBUG] mostrarMensaje:', {
            mensaje: mensaje,
            tipo: tipo,
            modulo: modulo,
            contenedorMensajes: contenedores.mensajes,
            contenedorVisible: contenedores.mensajes?.offsetParent !== null,
            contenedorDisplay: contenedores.mensajes?.style.display,
            contenedorHeight: contenedores.mensajes?.offsetHeight
        });
        
        if (!contenedores.mensajes) {
            console.error('❌ Contenedor de mensajes no disponible');
            return;
        }
        
        // FORZAR VISIBILIDAD si está oculto
        if (contenedores.mensajes.offsetParent === null) {
            console.warn('⚠️ Contenedor no visible, forzando visibilidad');
            contenedores.mensajes.style.display = 'block';
            contenedores.mensajes.style.height = '300px';
            contenedores.mensajes.style.overflow = 'auto';
        }
        
        const div = document.createElement('div');
        div.className = obtenerClaseSegunModulo(tipo);
        div.id = `msg-${mensaje.id}`;
        
        const hora = new Date(mensaje.timestamp || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const emisor = obtenerNombreEmisor(mensaje, tipo);
        const contenido = escapeHTML(mensaje.contenido || mensaje.mensaje || '');
        
        // HTML según módulo
        const htmlMensaje = generarHTMLMensaje(emisor, contenido, hora, tipo, mensaje);
        div.innerHTML = htmlMensaje;
        
        contenedores.mensajes.appendChild(div);
        contenedores.mensajes.scrollTop = contenedores.mensajes.scrollHeight;
        
        console.log('💬 [DEBUG] Mensaje agregado al DOM, total mensajes:', contenedores.mensajes.children.length);
    }
    
    /**
     * Obtiene clase CSS según módulo y tipo
     */
    function obtenerClaseSegunModulo(tipo) {
        const esPropio = tipo === 'enviado';
        
        switch (modulo) {
            case 'iniciarpartida':
            case 'inicioGB':
                return esPropio ? 'mensaje mensaje-propio' : 'mensaje mensaje-recibido';
                
            case 'gestionbatalla':
                return esPropio ? 'message message-usuario' : 'message message-recibido';
                
            case 'juegodeguerra':
                return esPropio ? 'mensaje mensaje-propio' : 'mensaje';
                
            default:
                return 'mensaje';
        }
    }
    
    /**
     * Obtiene nombre del emisor
     */
    function obtenerNombreEmisor(mensaje, tipo) {
        if (tipo === 'enviado') {
            return 'Tú';
        }
        
        // Extraer nombre del emisor
        if (typeof mensaje.emisor === 'object') {
            return mensaje.emisor.nombre || mensaje.emisor.usuario || 'Usuario';
        }
        
        return mensaje.emisor || mensaje.usuario || 'Usuario';
    }
    
    /**
     * Genera HTML del mensaje según módulo
     */
    function generarHTMLMensaje(emisor, contenido, hora, tipo, mensaje) {
        switch (modulo) {
            case 'iniciarpartida':
            case 'inicioGB':
                return `
                    <span class="usuario-chat">${emisor}:</span>
                    <span class="contenido-chat">${contenido}</span>
                    <span class="tiempo-chat">${hora}</span>
                `;
                
            case 'gestionbatalla':
                const esPrivado = mensaje.tipo === 'privado';
                const prefijo = esPrivado ? '🔒 ' : '';
                
                return `
                    <div class="mensaje-header">
                        <strong>${prefijo}${emisor}</strong>
                        <span class="tiempo">${hora}</span>
                    </div>
                    <div class="mensaje-contenido">${contenido}</div>
                `;
                
            case 'juegodeguerra':
                return `
                    <span class="mensaje-tiempo">${hora}</span>
                    <span class="mensaje-emisor">${emisor}:</span>
                    <span class="mensaje-contenido">${contenido}</span>
                `;
                
            default:
                return `<strong>${emisor}:</strong> ${contenido} <small>${hora}</small>`;
        }
    }
    
    // API pública
    return {
        inicializar: inicializar,
        enviar: function(texto) {
            if (contenedores.input) {
                contenedores.input.value = texto;
                enviarMensaje();
            }
        },
        limpiar: function() {
            if (contenedores.mensajes) {
                contenedores.mensajes.innerHTML = '';
            }
        },
        estado: function() {
            return {
                inicializado: isInitialized,
                modulo: modulo,
                socket: !!socket?.connected,
                contenedores: Object.keys(contenedores)
            };
        },
        debug: function() {
            console.log('🔧 Estado MAIRAChat:', {
                inicializado: isInitialized,
                modulo: modulo,
                contenedores: contenedores,
                socket: !!socket?.connected
            });
        },
        test: function() {
            console.log('🧪 Testing MAIRAChat...');
            console.log('📊 Estado:', this.estado());
            
            if (contenedores.mensajes) {
                const testDiv = document.createElement('div');
                testDiv.innerHTML = '<strong>TEST:</strong> Este es un mensaje de prueba';
                testDiv.style.cssText = 'background: yellow; padding: 5px; margin: 5px;';
                contenedores.mensajes.appendChild(testDiv);
                console.log('✅ Mensaje de prueba agregado');
            } else {
                console.error('❌ Contenedor de mensajes no disponible');
            }
        },
        forzarCreacionContenedores: function() {
            console.log('🔧 Forzando creación de contenedores...');
            
            // ✅ DETECTAR MÓDULO SI NO ESTÁ DETECTADO:
            if (!modulo) {
                modulo = detectarModulo();
                console.log('🔍 Módulo detectado en forzado:', modulo);
            }
            
            if (modulo === 'juegodeguerra' || window.location.pathname.includes('juegodeguerra')) {
                const exito = crearContenedoresJuegoDinamicamente();
                if (exito) {
                    isInitialized = true;
                    configurarEventos();
                    console.log('✅ Contenedores creados y configurados exitosamente');
                    return true;
                }
            } else {
                console.warn('⚠️ Módulo no es juegodeguerra:', modulo);
                
                // ✅ INTENTAR ENCONTRAR CONTENEDORES EXISTENTES:
                const encontrado = encontrarContenedores();
                if (encontrado) {
                    isInitialized = true;
                    configurarEventos();
                    console.log('✅ Contenedores encontrados y configurados');
                    return true;
                }
            }
            
            console.error('❌ No se pudieron crear contenedores para módulo:', modulo);
            return false;
        },
        
        // ✅ AGREGAR FUNCIÓN FALTANTE:
        cambiarSala: function(sala) {
            console.log('🔄 Cambiando sala de chat a:', sala);
            if (socket && socket.connected) {
                socket.emit('joinRoom', sala);
                console.log('✅ Sala cambiada a:', sala);
            }
        }
    };

// ✅ AGREGAR dentro del return del API público (línea ~1100):

return {
    inicializar: inicializar,
    enviar: function(texto) {
        if (contenedores.input) {
            contenedores.input.value = texto;
            enviarMensaje();
        }
    },
    limpiar: function() {
        if (contenedores.mensajes) {
            contenedores.mensajes.innerHTML = '';
        }
    },
    estado: function() {
        return {
            inicializado: isInitialized,
            modulo: modulo,
            socket: !!socket?.connected,
            contenedores: Object.keys(contenedores)
        };
    },
    debug: function() {
        console.log('🔧 Estado MAIRAChat:', {
            inicializado: isInitialized,
            modulo: modulo,
            contenedores: contenedores,
            socket: !!socket?.connected
        });
    },
    test: function() {
        console.log('🧪 Testing MAIRAChat...');
        console.log('📊 Estado:', this.estado());
        
        if (contenedores.mensajes) {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = '<strong>TEST:</strong> Este es un mensaje de prueba';
            testDiv.style.cssText = 'background: yellow; padding: 5px; margin: 5px;';
            contenedores.mensajes.appendChild(testDiv);
            console.log('✅ Mensaje de prueba agregado');
        } else {
            console.error('❌ Contenedor de mensajes no disponible');
        }
    },
    forzarCreacionContenedores: function() {
        console.log('🔧 Forzando creación de contenedores...');
        
        if (!modulo) {
            modulo = detectarModulo();
            console.log('🔍 Módulo detectado en forzado:', modulo);
        }
        
        if (modulo === 'juegodeguerra' || window.location.pathname.includes('juegodeguerra')) {
            const exito = crearContenedoresJuegoDinamicamente();
            if (exito) {
                isInitialized = true;
                configurarEventos();
                console.log('✅ Contenedores creados y configurados exitosamente');
                return true;
            }
        } else {
            console.warn('⚠️ Módulo no es juegodeguerra:', modulo);
            
            const encontrado = encontrarContenedores();
            if (encontrado) {
                isInitialized = true;
                configurarEventos();
                console.log('✅ Contenedores encontrados y configurados');
                return true;
            }
        }
        
        console.error('❌ No se pudieron crear contenedores para módulo:', modulo);
        return false;
    },
    
    // ✅ AGREGAR FUNCIÓN FALTANTE:
    cambiarSala: function(sala) {
        console.log('🔄 Cambiando sala de chat a:', sala);
        if (socket && socket.connected) {
            socket.emit('joinRoom', sala);
            console.log('✅ Sala cambiada a:', sala);
            return true;
        } else {
            console.warn('⚠️ Socket no disponible para cambiar sala');
            return false;
        }
    },
    
    // ✅ FUNCIÓN PARA MOSTRAR MENSAJE DESDE EXTERNAL
    mostrarMensaje: function(mensaje, tipo = 'recibido') {
        return mostrarMensaje(mensaje, tipo);
    }
};


})();

// Exportaciones para compatibilidad
window.inicializarChat = function(socket) {
    return window.MAIRAChat.inicializar({ socket: socket });
};

window.enviarMensajeChat = function() {
    return window.MAIRAChat.enviar();
};

// Exportaciones para debug
window.debugMAIRAChat = function() {
    return window.MAIRAChat.debug();
};

window.testMAIRAChat = function() {
    return window.MAIRAChat.test();
};

// REEMPLAZADO POR UNA VERSION MAS SIMPLE
console.log('✅ MAIRAChat v3.0.0 cargado - Esperando inicialización manual');

// ✅ EXPORTAR PARA COMPATIBILIDAD:
window.cambiarSalaChat = function(sala) {
    if (window.MAIRAChat && window.MAIRAChat.cambiarSala) {
        return window.MAIRAChat.cambiarSala(sala);
    } else {
        console.error('❌ MAIRAChat no está inicializado');
        return false;
    }
};