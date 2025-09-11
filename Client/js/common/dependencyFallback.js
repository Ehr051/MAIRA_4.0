/**
 * 🔧 DEPENDENCY FALLBACK SYSTEM - MAIRA 4.0
 * Sistema automático de fallback de dependencias
 * Si node_modules no está disponible, carga desde CDN
 */

(function() {
    'use strict';
    
    console.log('🔧 Iniciando sistema de fallback de dependencias...');
    
    // Configuración de fallbacks CDN
    const CDN_FALLBACKS = {
        // Font Awesome
        '/node_modules/@fortawesome/fontawesome-free/css/all.min.css': 
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        
        // Leaflet
        '/node_modules/leaflet/dist/leaflet.css': 
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        '/node_modules/leaflet/dist/leaflet.js': 
            'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        
        // Bootstrap
        '/node_modules/bootstrap/dist/css/bootstrap.min.css': 
            'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
        '/node_modules/bootstrap/dist/js/bootstrap.min.js': 
            'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
        
        // jQuery
        '/node_modules/jquery/dist/jquery.min.js': 
            'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js',
        
        // Three.js
        '/node_modules/three/build/three.min.js': 
            'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
        
        // Milsymbol
        '/node_modules/milsymbol/dist/milsymbol.js': 
            'https://cdn.jsdelivr.net/npm/milsymbol@2.2.0/dist/milsymbol.js',
        
        // PDF Libraries
        '/node_modules/jspdf/dist/jspdf.umd.min.js': 
            'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        '/node_modules/html2canvas/dist/html2canvas.min.js': 
            'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
    };
    
    /**
     * Verificar si un recurso está disponible
     */
    function checkResourceAvailable(url) {
        return fetch(url, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }
    
    /**
     * Crear elemento de fallback
     */
    function createFallbackElement(originalUrl, fallbackUrl, type) {
        console.log(`🔄 Creando fallback: ${originalUrl} → ${fallbackUrl}`);
        
        let element;
        if (type === 'css') {
            element = document.createElement('link');
            element.rel = 'stylesheet';
            element.href = fallbackUrl;
        } else if (type === 'js') {
            element = document.createElement('script');
            element.src = fallbackUrl;
        }
        
        if (element) {
            element.onload = () => console.log(`✅ Fallback cargado: ${fallbackUrl}`);
            element.onerror = () => console.error(`❌ Fallback falló: ${fallbackUrl}`);
            document.head.appendChild(element);
        }
    }
    
    /**
     * Procesar elementos existentes que pueden necesitar fallback
     */
    function processExistingElements() {
        // Procesar CSS links
        const cssLinks = document.querySelectorAll('link[href*="/node_modules/"]');
        cssLinks.forEach(async (link) => {
            const originalHref = link.href;
            const isAvailable = await checkResourceAvailable(originalHref);
            
            if (!isAvailable && CDN_FALLBACKS[originalHref]) {
                console.log(`🔄 CSS no disponible: ${originalHref}`);
                createFallbackElement(originalHref, CDN_FALLBACKS[originalHref], 'css');
            }
        });
        
        // Procesar JS scripts
        const jsScripts = document.querySelectorAll('script[src*="/node_modules/"]');
        jsScripts.forEach(async (script) => {
            const originalSrc = script.src;
            const isAvailable = await checkResourceAvailable(originalSrc);
            
            if (!isAvailable && CDN_FALLBACKS[originalSrc]) {
                console.log(`🔄 JS no disponible: ${originalSrc}`);
                createFallbackElement(originalSrc, CDN_FALLBACKS[originalSrc], 'js');
            }
        });
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processExistingElements);
    } else {
        processExistingElements();
    }
    
    // Exportar funciones para uso manual
    window.MAIRA_FALLBACK = {
        checkResourceAvailable,
        createFallbackElement,
        CDN_FALLBACKS
    };
    
    console.log('✅ Sistema de fallback de dependencias inicializado');
})();
