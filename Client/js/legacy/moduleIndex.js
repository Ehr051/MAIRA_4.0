/**
 * MAIRA 4.0 - Índice de Módulos
 * Mapeo centralizado de todos los módulos del sistema
 */

// Configuración de rutas de módulos
window.MAIRA_MODULES = {
    // Core modules
    core: {
        hexgrid: '/Client/js/handlers/hexgrid.js',
        planeamiento: '/Client/js/handlers/planeamiento.js',
        gestorMapa: '/Client/js/handlers/gestorMapa.js',
        gestorAcciones: '/Client/js/handlers/gestorAcciones.js'
    },
    
    // Services
    services: {
        transitability: '/Client/js/services/transitabilityService.js',
        userIdentity: '/Client/js/core/UserIdentity.js'
    },
    
    // Components
    components: {
        securityManager: '/Client/components/SecurityManager.js',
        performanceMonitor: '/Client/components/PerformanceMonitor.js',
        gamingDirector: '/Client/components/AdvancedGamingDirector.js'
    },
    
    // Utilities
    utils: {
        networkConfig: '/Client/js/networkConfig.js',
        config: '/Client/js/config.js'
    }
};

// Helper function para cargar módulos
window.loadModule = function(category, moduleName) {
    const modulePath = window.MAIRA_MODULES[category]?.[moduleName];
    if (!modulePath) {
        console.error(`Módulo no encontrado: ${category}.${moduleName}`);
        return null;
    }
    
    // Si ya está cargado, retornar
    if (window[moduleName]) {
        return window[moduleName];
    }
    
    // Cargar dinámicamente
    const script = document.createElement('script');
    script.src = modulePath;
    script.async = false;
    document.head.appendChild(script);
    
    return new Promise((resolve, reject) => {
        script.onload = () => resolve(window[moduleName]);
        script.onerror = reject;
    });
};

console.log('📋 Índice de módulos MAIRA 4.0 cargado');
