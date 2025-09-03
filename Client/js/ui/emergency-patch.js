/**
 * Parche de Emergencia para Producción MAIRA
 * Corrige problemas críticos en https://maira-3e76.onrender.com/
 * 
 * Debe cargarse ANTES que otros scripts
 */

// 🚨 CORRECCIÓN CRÍTICA DE URLS
console.log('🚨 APLICANDO PARCHE DE EMERGENCIA MAIRA');

// Interceptar fetch para corregir URLs problemáticas
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    let correctedUrl = url;
    
    // Corregir versiones incorrectas de tiles
    if (typeof url === 'string') {
        if (url.includes('tiles-v1.0') || url.includes('tiles-v2.0')) {
            correctedUrl = url.replace(/tiles-v[0-9]+\.[0-9]+/, 'tiles-v3.0');
            console.log(`🔧 URL corregida: ${url} -> ${correctedUrl}`);
        }
    }
    
    return originalFetch.call(this, correctedUrl, options);
};

// 🔧 CONFIGURACIÓN FORZADA DE MINI-TILES
window.MAIRA_EMERGENCY_CONFIG = {
    tiles: {
        baseUrls: [
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
            'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'
        ],
        masterIndex: 'master_mini_tiles_index.json'
    },
    
    dependencies: {
        milsymbol: 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js',
        geocoder: 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js'
    }
};

// 🔧 FORZAR CARGA DE MILSYMBOL SI NO ESTÁ DISPONIBLE
if (typeof ms === 'undefined') {
    console.log('🔧 Cargando milsymbol de emergencia...');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/milsymbol@2.1.1/dist/milsymbol.js';
    script.async = false;
    document.head.appendChild(script);
}

// 🔧 VERIFICAR GEOCODER
document.addEventListener('DOMContentLoaded', function() {
    if (typeof L === 'undefined' || !L.Control.Geocoder) {
        console.log('🔧 Cargando geocoder de emergencia...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.js';
        document.head.appendChild(script);
    }
});

// 🔧 SOBRESCRIBIR CONFIGURACIÓN DE ELEVACIÓN
window.addEventListener('load', function() {
    // Esperar un poco para que otros scripts se carguen
    setTimeout(function() {
        // Si existe el handler de elevación, corregir sus URLs
        if (window.elevationHandler && window.elevationHandler.baseUrls) {
            console.log('🔧 Corrigiendo URLs de elevación...');
            window.elevationHandler.baseUrls = [
                'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
                'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'
            ];
        }
        
        // Si existe mini-tiles loader, corregir URLs
        if (window.miniTilesLoader && window.miniTilesLoader.baseUrls) {
            console.log('🔧 Corrigiendo URLs de mini-tiles...');
            window.miniTilesLoader.baseUrls = [
                'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',
                'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'
            ];
        }
        
        console.log('✅ Parche de emergencia aplicado');
    }, 1000);
});

// 🔧 FUNCIÓN DE VERIFICACIÓN PARA DEBUG
window.verificarEstadoMAIRA = function() {
    console.log('🔍 ESTADO ACTUAL DE MAIRA:');
    console.log('milsymbol:', typeof ms !== 'undefined' ? '✅' : '❌');
    console.log('geocoder:', typeof L !== 'undefined' && L.Control && L.Control.Geocoder ? '✅' : '❌');
    console.log('miniTilesLoader:', typeof window.miniTilesLoader !== 'undefined' ? '✅' : '❌');
    console.log('elevationHandler:', typeof window.elevationHandler !== 'undefined' ? '✅' : '❌');
    
    if (window.miniTilesLoader) {
        console.log('URLs mini-tiles:', window.miniTilesLoader.baseUrls);
    }
};

console.log('🚀 Parche de emergencia MAIRA cargado. Ejecuta verificarEstadoMAIRA() para debug.');
