// networkConfig.js
// Versión simplificada compatible con el código existente

// Detectar automáticamente protocolo y host
var currentHost = window.location.hostname;
var currentProtocol = window.location.protocol;

// Variables globales para ser usadas en toda la aplicación
var SERVER_URL, CLIENT_URL;

// ⏱️ CONFIGURACIÓN DE TIMEOUTS (aumentados para servidores lentos)
window.MAIRA_TIMEOUTS = {
    connection: 30000,    // 30 segundos (antes: 10s)
    response: 60000,      // 60 segundos (antes: 30s)  
    socket: 120000        // 2 minutos (antes: 60s)
};

// Si estamos en un dominio ngrok, tunnel o Render, NO añadir puerto
if (currentHost.includes('ngrok') || currentHost.includes('trycloudflare.com') || currentHost.includes('onrender.com')) {
    SERVER_URL = `${currentProtocol}//${currentHost}`;
    CLIENT_URL = `${currentProtocol}//${currentHost}`;
    console.log("Detectado servicio en la nube: usando configuración optimizada");

} else {
    // URLs locales con puertos específicos
    SERVER_URL = `${currentProtocol}//${currentHost}:5000`;
    CLIENT_URL = `${currentProtocol}//${currentHost}:8080`;
}

// Log de las URLs configuradas
console.log("URLs configuradas:", {
    SERVER_URL: SERVER_URL,
    CLIENT_URL: CLIENT_URL
});

// Asegurar que las variables están disponibles globalmente
window.SERVER_URL = SERVER_URL;
window.CLIENT_URL = CLIENT_URL;