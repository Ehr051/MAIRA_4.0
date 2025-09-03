// chat.js: Contiene toda la lógica relacionada con el chat


let salaActual = 'lobby';

function inicializarChat(socketInstance) {
    socket = socketInstance;
    
    socket.on('nuevoMensajeChat', recibirMensajeChat);  // ✅ CORREGIDO: era 'mensajeChat'
    socket.on('historialChat', cargarHistorialChat);
    socket.on('errorChat', manejarErrorChat);
    socket.on('salaActualizada', manejarSalaActualizada);
    socket.on('enviarMensajeGeneral', (mensaje) => {
        socket.broadcast.to('general').emit('mensajeGeneralRecibido', mensaje);
    });

    socket.on('enviarMensajeSalaEspera', (mensaje) => {
        socket.broadcast.to(`salaEspera_${partidaActual.codigo}`).emit('mensajeRecibido', mensaje);
    });

    // ✅ FUNCIONES NUEVAS: Para eventos faltantes de serverhttps.py
    function enviarMensajePrivado(destinatarioId, mensaje) {
        if (socket && socket.connected) {
            socket.emit('mensajePrivado', {
                remitente_id: userId,
                destinatario_id: destinatarioId,
                mensaje: mensaje,
                timestamp: new Date().toISOString()
            });
            console.log(`📧 Mensaje privado enviado a usuario ${destinatarioId}`);
        }
    }

    function finalizarTurno(data = {}) {
        if (socket && socket.connected && partidaActual) {
            const turnoData = {
                partida_codigo: partidaActual.codigo,
                usuario_id: userId,
                ...data
            };
            socket.emit('finTurno', turnoData);
            console.log('🔚 Turno finalizado:', turnoData);
        }
    }

    function solicitarElementos(operacion, tipoElemento = 'all') {
        if (socket && socket.connected) {
            socket.emit('solicitarElementos', {
                operacion: operacion,
                tipo_elemento: tipoElemento,
                usuario_id: userId,
                timestamp: new Date().toISOString()
            });
            console.log(`📋 Solicitando elementos para operación: ${operacion}`);
        }
    }

    // Listeners para los nuevos eventos
    socket.on('mensajePrivadoRecibido', function(data) {
        console.log('📧 Mensaje privado recibido:', data);
        mostrarMensajePrivado(data);
    });

    socket.on('turnoFinalizado', function(data) {
        console.log('🔚 Turno finalizado por:', data);
        manejarFinTurno(data);
    });

    socket.on('elementosSolicitados', function(data) {
        console.log('📋 Elementos solicitados:', data);
        manejarElementosSolicitados(data);
    });

    inicializarEventListenersChat();
}

function inicializarEventListenersChat() {
    document.getElementById("btnEnviarMensaje").addEventListener("click", enviarMensajeChat);
    document.getElementById("inputChat").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            enviarMensajeChat();
        }
    });
}

function crearElementoMensaje(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'mensaje-chat';
    if (data.usuario === userName) {
        messageElement.classList.add('mensaje-propio');
    }
    messageElement.innerHTML = `
        <span class="usuario-chat">${data.usuario}:</span>
        <span class="contenido-chat">${escapeHTML(data.mensaje)}</span>
        <span class="tiempo-chat">${new Date().toLocaleTimeString()}</span>
    `;
    return messageElement;
}

function cambiarSalaChat(sala) {
    if (sala !== salaActual) {
        console.log(`💬 Cambiando de sala: ${salaActual} → ${sala}`);
        socket.emit('cambiarSala', { salaAnterior: salaActual, salaNueva: sala });
        salaActual = sala;
        limpiarChat();
        // Opcional: solicitar historial de la nueva sala
        // socket.emit('obtenerHistorialChat', { sala: salaActual });
    }
}

// ✅ NUEVA: Función para cambiar automáticamente cuando se une/crea partida
function cambiarAChatPartida(codigoPartida) {
    const nuevaSala = `chat_${codigoPartida}`;
    cambiarSalaChat(nuevaSala);
}

// ✅ NUEVA: Función para volver al chat general
function volverAChatGeneral() {
    cambiarSalaChat('general');
}

function limpiarChat() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
}

function cargarHistorialChat(historial) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && Array.isArray(historial)) {
        historial.forEach(mensaje => {
            const messageElement = crearElementoMensaje(mensaje);
            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function manejarErrorChat(error) {
    console.error('Error en el chat:', error);
    mostrarMensajeError('Hubo un error en el chat. Por favor, intenta de nuevo.');
}

function mostrarMensajeError(mensaje) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-chat';
    errorElement.textContent = mensaje;
    document.getElementById('chatContainer').prepend(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function manejarSalaActualizada(data) {
    console.log(`Cambiado a la sala: ${data.sala}`);
    limpiarChat();
    salaActual = data.sala;
}

function actualizarInterfazChat() {
    // Actualizar la interfaz del chat según el estado actual
    const chatContainer = document.getElementById('chatContainer');
    if (chatContainer) {
        chatContainer.style.display = partidaActual ? 'block' : 'none';
    }
}
function enviarMensajeChat() {
    const inputChat = document.getElementById('inputChat');
    const mensaje = inputChat.value.trim();
    if (mensaje) {
        // ✅ CORREGIDO: Usar sala de chat específica si hay partida activa
        let sala = 'general';
        if (partidaActual && partidaActual.codigo) {
            sala = `chat_${partidaActual.codigo}`;
        }
        
        console.log(`📨 Enviando mensaje a sala: ${sala}`);
        socket.emit('mensajeChat', { usuario: userName, mensaje, sala });
        inputChat.value = '';
    }
}

function recibirMensajeChat(data) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const messageElement = crearElementoMensaje(data);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Asegúrate de que esta función esté siendo llamada cuando se recibe un mensaje

window.inicializarChat = inicializarChat;
window.enviarMensajeChat = enviarMensajeChat;
window.cambiarSalaChat = cambiarSalaChat;
window.cambiarAChatPartida = cambiarAChatPartida;  // ✅ NUEVO
window.volverAChatGeneral = volverAChatGeneral;    // ✅ NUEVO
window.actualizarInterfazChat = actualizarInterfazChat;
window.inicializarEventListenersChat = inicializarEventListenersChat;
window.crearElementoMensaje = crearElementoMensaje;
window.limpiarChat = limpiarChat;
window.cargarHistorialChat = cargarHistorialChat;
window.manejarErrorChat = manejarErrorChat;
window.mostrarMensajeError = mostrarMensajeError;
window.escapeHTML = escapeHTML;
window.manejarSalaActualizada = manejarSalaActualizada;
window.recibirMensajeChat = recibirMensajeChat;
