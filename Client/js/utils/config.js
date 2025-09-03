// Configuración de MAIRA para producción en Render
window.MAIRA_CONFIG = {
    // URLs del servidor (se configuran automáticamente)
    SERVER_URL: window.location.hostname.includes('localhost') 
        ? 'http://localhost:10000'
        : window.location.origin,
    
    // Configuración de Socket.IO
    SOCKET_CONFIG: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
    },
    
    // Configuración del mapa
    MAP_CONFIG: {
        center: [-34.6037, -58.3816], // Buenos Aires por defecto
        zoom: 10,
        maxZoom: 18,
        minZoom: 3
    },
    
    // Configuración de la aplicación
    APP_CONFIG: {
        version: '1.4.1',
        environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
        debug: window.location.hostname.includes('localhost'),
        autoConnect: true,
        enableGeolocation: true
    }
};

// Función para obtener la URL del servidor
window.getServerUrl = function() {
    return window.MAIRA_CONFIG.SERVER_URL;
};

// Inicialización automática cuando está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 MAIRA Frontend configurado para:', window.MAIRA_CONFIG.APP_CONFIG.environment);
    console.log('📡 Servidor:', window.MAIRA_CONFIG.SERVER_URL);
    
    // Verificar conexión con el servidor
    if (window.MAIRA_CONFIG.APP_CONFIG.autoConnect) {
        fetch(window.MAIRA_CONFIG.SERVER_URL + '/health')
            .then(response => response.json())
            .then(data => {
                console.log('✅ Servidor disponible:', data);
            })
            .catch(error => {
                console.warn('⚠️ Servidor no disponible:', error);
            });
    }
});
