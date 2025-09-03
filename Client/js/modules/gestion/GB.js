// ✅ REEMPLAZAR TODO EL CONTENIDO DE GB.js CON ESTO:

console.log("📋 GB.js ahora es un wrapper simplificado...");

// ✅ WRAPPER SIMPLE SIN RECURSIÓN:
window.MAIRA = window.MAIRA || {};

// ✅ SOLO EXPONER VARIABLES GLOBALES - NO FUNCIONES:
Object.defineProperty(window, 'elementosConectados', {
    get: function() { 
        return window.MAIRA?.GestionBatalla?.elementosConectados || {}; 
    }
});

Object.defineProperty(window, 'usuarioInfo', {
    get: function() { 
        return window.MAIRA?.GestionBatalla?.usuarioInfo || null; 
    }
});

Object.defineProperty(window, 'elementoTrabajo', {
    get: function() { 
        return window.MAIRA?.GestionBatalla?.elementoTrabajo || null; 
    }
});

Object.defineProperty(window, 'operacionActual', {
    get: function() { 
        return window.MAIRA?.GestionBatalla?.operacionActual || ''; 
    }
});

Object.defineProperty(window, 'socket', {
    get: function() { 
        return window.MAIRA?.GestionBatalla?.socket || null; 
    }
});

// ✅ SIMPLIFICAR GB.js para que NO cause recursión:

function inicializar() {
    console.log("🔄 GB.js redirigiendo a gestionBatalla.js...");
    
    // ✅ VERIFICAR QUE EL MÓDULO ESTÉ DISPONIBLE:
    if (window.MAIRA && window.MAIRA.GestionBatalla && 
        typeof window.MAIRA.GestionBatalla.inicializar === 'function') {
        
        console.log("✅ Módulo MAIRA.GestionBatalla disponible, iniciando...");
        return window.MAIRA.GestionBatalla.inicializar();
        
    } else {
        console.error("❌ MAIRA.GestionBatalla no está disponible");
        
        // ✅ ESPERAR UN POCO Y REINTENTAR
        setTimeout(() => {
            if (window.MAIRA?.GestionBatalla?.inicializar) {
                console.log("🔄 Reintentando inicialización...");
                window.MAIRA.GestionBatalla.inicializar();
            } else {
                console.error("❌ Módulo MAIRA.GestionBatalla no se cargó correctamente");
            }
        }, 1000);
        
        return false;
    }
}

// ✅ EXPORTAR SOLO LA FUNCIÓN INICIALIZAR:
window.inicializar = inicializar;

console.log("✅ GB.js cargado como wrapper simplificado");