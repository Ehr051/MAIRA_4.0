/**
 * @fileoverview Configuración de dependencias MAIRA 4.0
 * @version 1.0.0
 * @description Sistema unificado de carga de dependencias basado en el viejo/CO.html funcional
 */

// ✅ CONFIGURACIÓN DE DEPENDENCIAS REALES
const MAIRA_DEPENDENCIES = {
    // 🎨 CSS LIBRARIES (CDN prioritario)
    css: [
        {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
            fallback: 'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
            critical: true
        },
        {
            url: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
            fallback: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
            critical: true
        },
        {
            url: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
            fallback: 'node_modules/leaflet/dist/leaflet.css',
            critical: true
        }
    ],

    // 🔧 CORE JAVASCRIPT LIBRARIES (orden crítico)
    coreJS: [
        {
            url: 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',
            fallback: 'node_modules/jquery/dist/jquery.min.js',
            critical: true,
            order: 1
        },
        {
            url: 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
            fallback: 'node_modules/bootstrap/dist/js/bootstrap.min.js',
            critical: true,
            order: 2,
            requires: ['jquery']
        },
        {
            url: 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
            fallback: 'node_modules/leaflet/dist/leaflet.js',
            critical: true,
            order: 3
        }
    ],

    // 📊 SPECIALIZED LIBRARIES 
    specialized: [
        'node_modules/jspdf/dist/jspdf.umd.min.js',
        'node_modules/html2canvas/dist/html2canvas.min.js',
        'node_modules/milsymbol/dist/milsymbol.js',
        'node_modules/socket.io/client-dist/socket.io.min.js'
    ],

    // 🗺️ LEAFLET PLUGINS (verificados que existen)
    leafletPlugins: [
        'node_modules/leaflet-draw/dist/leaflet.draw.js',
        'node_modules/leaflet-control-geocoder/dist/Control.Geocoder.js',
        'node_modules/@raruto/leaflet-elevation/dist/leaflet-elevation.js',
        'node_modules/leaflet-fullscreen/dist/leaflet.fullscreen.js',
        'node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.min.js',
        'node_modules/leaflet-measure/dist/leaflet-measure.js',
        'node_modules/leaflet-easybutton/src/easy-button.js'
    ],

    // 🏗️ MAIRA CORE (solo los que SÍ existen)
    mairaCore: [
        'js/core/UserIdentity.js',
        'js/core/MAIRACore.js',
        'js/handlers/EventBus.js'
    ],

    // 🎮 MAIRA GAMING (verificados)
    mairaGaming: [
        'js/gaming/GameEngine.js',
        'js/gaming/Turn.js',
        'js/gaming/FogOfWar.js'
    ],

    // 🔧 MAIRA HANDLERS (verificados)
    mairaHandlers: [
        'js/handlers/measurementHandler.js',
        'js/handlers/edicioncompleto.js'
    ],

    // 🔬 MAIRA SERVICES (verificados)
    mairaServices: [
        'js/services/elevationProfileService.js',
        'js/services/transitabilityService.js',
        'js/services/slopeAnalysisService.js'
    ]
};

// ✅ FUNCIÓN DE CARGA INTELIGENTE
function loadMAIRADependencies(modules = []) {
    console.log('🚀 Iniciando carga de dependencias MAIRA...');
    
    const loadPromises = [];
    
    // 🎨 Cargar CSS crítico
    if (modules.includes('css') || modules.length === 0) {
        MAIRA_DEPENDENCIES.css.forEach(css => {
            loadCSS(css.url, css.fallback);
        });
    }
    
    // 🔧 Cargar JS en orden
    if (modules.includes('core') || modules.length === 0) {
        loadPromises.push(loadJSSequentially(MAIRA_DEPENDENCIES.coreJS));
    }
    
    // 📦 Cargar módulos específicos
    modules.forEach(module => {
        if (MAIRA_DEPENDENCIES[module]) {
            if (Array.isArray(MAIRA_DEPENDENCIES[module])) {
                MAIRA_DEPENDENCIES[module].forEach(script => {
                    loadPromises.push(loadScript(script));
                });
            }
        }
    });
    
    return Promise.all(loadPromises);
}

// 🔧 UTILIDADES DE CARGA
function loadCSS(url, fallback) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    
    if (fallback) {
        link.onerror = function() {
            console.warn(`⚠️ CDN CSS falló, usando fallback: ${fallback}`);
            this.href = fallback;
        };
    }
    
    document.head.appendChild(link);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log(`✅ Cargado: ${src}`);
            resolve(src);
        };
        script.onerror = () => {
            console.error(`❌ Error cargando: ${src}`);
            reject(new Error(`Failed to load ${src}`));
        };
        document.head.appendChild(script);
    });
}

function loadJSSequentially(scripts) {
    return scripts
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .reduce((promise, script) => {
            return promise.then(() => {
                const src = script.url || script.fallback || script;
                return loadScript(src);
            });
        }, Promise.resolve());
}

// 🌍 EXPORTAR GLOBALMENTE
window.MAIRA_DEPENDENCIES = MAIRA_DEPENDENCIES;
window.loadMAIRADependencies = loadMAIRADependencies;

console.log('✅ Sistema de dependencias MAIRA configurado');
