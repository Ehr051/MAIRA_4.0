/**
 * MAIRA 4.0 - Configuración Central del Sistema
 * ============================================
 * Configuración centralizada para todo el sistema MAIRA
 */

// ✅ CONFIGURACIÓN CORREGIDA CON RUTAS REALES
window.MAIRA_CONFIG = {
    // Configuración de recursos locales (rutas verificadas)
    PATHS: {
        tiles: {
            elevation: '/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/',  // ✅ CORREGIDO
            vegetation: '/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/', // ✅ VERIFICADO
            // transitability: NO DISPONIBLE en este proyecto
        },
        libs: '/Client/Libs/',
        assets: '/Client/assets/',
        uploads: '/Client/uploads/'
    },

    // Configuración de mapas y tiles
    MAP: {
        default_zoom: 6,
        min_zoom: 5,
        max_zoom: 18,
        center: [-34.6118, -58.3960], // Buenos Aires
        tile_size: 256,
        chunk_size: 2, // Para subdivisión de tiles
        max_cache_size: 50 // MB
    },

    // Configuración de 3D
    THREEJS: {
        enabled: true,
        renderer: {
            antialias: true,
            alpha: true,
            logarithmicDepthBuffer: true
        },
        camera: {
            fov: 60,
            near: 0.1,
            far: 10000
        },
        lights: {
            ambient: 0x404040,
            directional: 0xffffff
        },
        terrain: {
            elevation_scale: 0.001,
            texture_resolution: 512,
            segments: 512
        }
    },

    // Configuración de combate y simulación
    COMBAT: {
        fog_of_war: {
            enabled: true,
            visibility_range: 5000, // metros
            update_interval: 1000 // ms
        },
        movement: {
            update_interval: 500,
            pathfinding_precision: 10
        },
        logistics: {
            fuel_consumption_rate: 1.0,
            ammo_consumption_rate: 1.0,
            supply_range: 50000
        }
    },

    // Configuración de red y performance
    NETWORK: {
        websocket_url: window.location.protocol === 'https:' ? 'wss://' : 'ws://' + window.location.host,
        reconnect_attempts: 5,
        reconnect_delay: 3000,
        timeout: 30000
    },

    PERFORMANCE: {
        max_units_rendered: 1000,
        lod_distances: [1000, 5000, 15000],
        chunk_loading_distance: 3,
        garbage_collection_interval: 60000
    },

    // Configuración de debugging
    DEBUG: {
        enabled: window.location.hostname === 'localhost',
        log_level: 'info', // error, warn, info, debug
        performance_monitoring: true,
        show_debug_panel: true
    }
};

// Configuración dinámica basada en el entorno
if (typeof window !== 'undefined') {
    // Ajustar rutas según entorno
    const isLocalhost = window.location.hostname === 'localhost';
    const isDevelopment = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    
    // En desarrollo local mantener rutas relativas
    // En producción también usar rutas relativas (servidor Flask las sirve)
    console.log(`🌍 Entorno detectado: ${isLocalhost ? 'Local' : 'Producción'}`);
}

// ✅ CONFIGURACIÓN CARGADA
console.log('✅ MAIRA_CONFIG cargado con rutas verificadas:', window.MAIRA_CONFIG.PATHS);
