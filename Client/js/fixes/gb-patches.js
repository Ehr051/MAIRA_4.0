/* ===========================================
   PARCHE PARA HEARTBEAT Y CONEXIÓN GB
   ========================================== */

// 1. Fix para inicialización temprana del heartbeat
function inicializarHeartbeatTemprano() {
    console.log('🫀 Iniciando heartbeat temprano...');
    
    // Asegurar que tenemos datos mínimos de usuario
    const userId = localStorage.getItem('usuario_id') || 
                   (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity && MAIRA.UserIdentity.getUserId()) ||
                   `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const username = localStorage.getItem('usuario_username') || 
                     localStorage.getItem('username') || 
                     'Usuario';

    // Enviar heartbeat inicial
    const heartbeatData = {
        userId: userId,
        username: username,
        timestamp: new Date().toISOString(),
        operacion: new URLSearchParams(window.location.search).get('operacion'),
        status: 'iniciando'
    };

    // Si hay socket, enviar heartbeat
    if (window.socket && window.socket.connected) {
        window.socket.emit('heartbeat', heartbeatData);
        console.log('🫀 Heartbeat inicial enviado:', heartbeatData);
    }
    
    // Configurar heartbeat periódico
    if (window.heartbeatInterval) {
        clearInterval(window.heartbeatInterval);
    }
    
    window.heartbeatInterval = setInterval(() => {
        if (window.socket && window.socket.connected) {
            const currentData = {
                ...heartbeatData,
                timestamp: new Date().toISOString(),
                status: 'activo'
            };
            window.socket.emit('heartbeat', currentData);
            console.log('🫀 Heartbeat enviado');
        }
    }, 30000); // Cada 30 segundos
}

// 2. Fix para el problema de chat sin socket
function verificarYRepararChat() {
    console.log('💬 Verificando estado del chat...');
    
    // Verificar si MAIRAChat está disponible
    if (typeof MAIRAChat === 'undefined') {
        console.error('❌ MAIRAChat no está disponible');
        return false;
    }
    
    // Verificar socket
    if (!window.socket || !window.socket.connected) {
        console.warn('⚠️ Socket no disponible, reintentando conexión...');
        setTimeout(() => {
            if (typeof conectarAlServidor === 'function') {
                conectarAlServidor();
            }
        }, 2000);
        return false;
    }
    
    // Reinicializar chat si es necesario
    try {
        if (window.MAIRAChat && typeof window.MAIRAChat.inicializar === 'function') {
            window.MAIRAChat.inicializar(window.socket);
            console.log('✅ Chat reinicializado');
            return true;
        }
    } catch (error) {
        console.error('❌ Error al reinicializar chat:', error);
    }
    
    return false;
}

// 3. Fix para el problema de vegetación bounds
function patchVegetacionBounds() {
    console.log('🌿 Aplicando parche para vegetación bounds...');
    
    // Override de la función problemática
    if (typeof encontrarTileParaPunto !== 'undefined') {
        const originalEncontrarTileParaPunto = encontrarTileParaPunto;
        
        window.encontrarTileParaPunto = function(lat, lng, indice) {
            try {
                // Verificar que el índice tenga la estructura correcta
                if (!indice || !indice.bounds) {
                    console.warn('⚠️ Índice de vegetación sin bounds, usando fallback');
                    return {
                        tile: null,
                        vegetacion: 'mixto', // Valor por defecto
                        factorVelocidad: 1.0
                    };
                }
                
                return originalEncontrarTileParaPunto(lat, lng, indice);
            } catch (error) {
                console.error('❌ Error en encontrarTileParaPunto:', error);
                return {
                    tile: null,
                    vegetacion: 'mixto',
                    factorVelocidad: 1.0
                };
            }
        };
    }
}

// 4. Función de inicialización del parche
function aplicarPatchesGB() {
    console.log('🔧 Aplicando parches para GB...');
    
    // Aplicar parches
    inicializarHeartbeatTemprano();
    patchVegetacionBounds();
    
    // Verificar chat después de un momento
    setTimeout(() => {
        verificarYRepararChat();
    }, 3000);
    
    // Reintento de chat si falla
    setTimeout(() => {
        if (!verificarYRepararChat()) {
            console.log('🔄 Reintentando configuración de chat...');
            setTimeout(verificarYRepararChat, 5000);
        }
    }, 8000);
}

// 5. Auto-ejecutar cuando se cargue el DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarPatchesGB);
} else {
    aplicarPatchesGB();
}

console.log('🔧 Parches GB cargados correctamente');
