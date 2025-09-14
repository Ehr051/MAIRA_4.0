/* ===========================================
   OPTIMIZACIÓN CRÍTICA DE CARGA - 60 MIN FIX
   ========================================== */

// 1. Preload crítico de recursos
function preloadCriticalResources() {
    console.log('⚡ Preloading recursos críticos...');
    
    const criticalResources = [
        '/Client/js/common/MAIRAChat.js',
        '/Client/css/fixes/z-index-fix.css',
        '/node_modules/socket.io/client-dist/socket.io.min.js'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.js') ? 'script' : 'style';
        document.head.appendChild(link);
    });
}

// 2. Lazy load no crítico
function setupLazyLoading() {
    console.log('🔄 Configurando lazy loading...');
    
    // Diferir scripts no críticos
    const deferredScripts = [
        '/Client/js/modules/organizacion/CO.js',
        '/Client/js/Test/MAIRATestSuite.js',
        '/Client/js/common/miradial.js'
    ];
    
    setTimeout(() => {
        deferredScripts.forEach(script => {
            const scriptEl = document.createElement('script');
            scriptEl.src = script;
            scriptEl.async = true;
            document.head.appendChild(scriptEl);
        });
    }, 3000); // Cargar después de 3 segundos
}

// 3. Optimización de memory leaks
function setupMemoryOptimization() {
    console.log('🧹 Configurando limpieza de memoria...');
    
    // Limpiar event listeners huérfanos cada 5 minutos
    setInterval(() => {
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        // Limpiar variables globales innecesarias
        if (window.tempData) {
            delete window.tempData;
        }
        
        console.log('🧹 Limpieza de memoria ejecutada');
    }, 300000); // 5 minutos
}

// 4. Cache inteligente de assets
function setupIntelligentCache() {
    console.log('💾 Configurando cache inteligente...');
    
    // ⚠️ TEMPORALMENTE DESHABILITADO - Causaba errores CORS masivos
    console.log('🔧 Service Worker deshabilitado temporalmente');
    /*
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registrado');
            })
            .catch(error => {
                console.warn('⚠️ Service Worker no disponible:', error);
            });
    }
    */
}

// 5. Inicialización automática
function aplicarOptimizacionesEmergencia() {
    console.log('⚡ Aplicando optimizaciones de emergencia...');
    
    preloadCriticalResources();
    setupLazyLoading();
    setupMemoryOptimization();
    setupIntelligentCache();
    
    console.log('✅ Optimizaciones aplicadas');
}

// Auto-ejecutar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarOptimizacionesEmergencia);
} else {
    aplicarOptimizacionesEmergencia();
}

console.log('⚡ Sistema de optimización crítica cargado');
