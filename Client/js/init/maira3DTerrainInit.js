/**
 * 🚀 Inicializador MAIRA 3D Terrain - Integración Real
 * 
 * Este archivo se incluye en la página principal de MAIRA para activar
 * la funcionalidad de Vista 3D de manera integrada y no intrusiva
 */

(function() {
    'use strict';
    
    // Configuración para integración en MAIRA real
    const MAIRA_3D_CONFIG = {
        // IDs de elementos DOM en la interfaz principal
        mapContainerId: 'map',
        buttonContainerId: 'map-controls', // Donde se coloca el botón Vista 3D
        
        // Configuración de activación
        autoActivateZoom: 17, // Zoom mínimo para mostrar botón
        
        // Valores optimizados por defecto (basados en testing)
        defaultVerticalScale: 3.0,    // Óptimo para visualización
        defaultVegetationDensity: 0.25, // Balance rendimiento/realismo
        defaultResolution: 60,        // Óptimo para la mayoría de casos
        defaultTerrainSize: 1500,     // Área adecuada para análisis táctico
        
        // Configuración de rendimiento (con fallbacks por errores de workers)
        enableWorkers: false,  // ❌ DESACTIVADO: Workers con errores
        enableTIF: true,
        enableCache: true,
        
        // Timeouts para evitar bloqueos
        analysisTimeout: 60000, // 1 minuto máximo para análisis
        generationTimeout: 120000 // 2 minutos máximo para generación
    };
    
    let terrainModule = null;
    let integrator = null;
    
    /**
     * Inicializar el sistema cuando todo esté listo
     */
    function initMaira3DTerrain() {
        console.log('🌍 Inicializando MAIRA 3D Terrain...');
        
        // Verificar que estamos en la página correcta
        if (!document.getElementById(MAIRA_3D_CONFIG.mapContainerId)) {
            console.log('📍 Mapa no encontrado, omitiendo inicialización 3D');
            return;
        }
        
        // Verificar dependencias mínimas
        if (!window.L || !window.THREE) {
            console.warn('⚠️ Dependencias no disponibles para MAIRA 3D');
            return;
        }
        
        try {
            // Crear módulo principal
            terrainModule = new MAIRA3DTerrainModule(MAIRA_3D_CONFIG);
            
            // Crear integrador
            integrator = new MAIRA3DTerrainIntegrator(terrainModule);
            
            console.log('✅ MAIRA 3D Terrain inicializado correctamente');
            
            // Notificar que el sistema está listo
            document.dispatchEvent(new CustomEvent('maira3DReady', {
                detail: { module: terrainModule, integrator: integrator }
            }));
            
        } catch (error) {
            console.error('❌ Error inicializando MAIRA 3D:', error);
        }
    }
    
    /**
     * Esperar a que las dependencias estén listas
     */
    function waitForDependencies() {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        const check = () => {
            attempts++;
            
            const hasLeaflet = typeof L !== 'undefined';
            const hasThree = typeof THREE !== 'undefined';
            const hasMap = window.mapa || document.getElementById(MAIRA_3D_CONFIG.mapContainerId);
            const hasServices = window.TerrainGenerator3D && window.SatelliteImageAnalyzer;
            
            if (hasLeaflet && hasThree && hasMap && hasServices) {
                // Todo listo, inicializar
                setTimeout(initMaira3DTerrain, 100);
            } else if (attempts < maxAttempts) {
                // Seguir esperando
                setTimeout(check, 100);
            } else {
                console.warn('⚠️ Timeout esperando dependencias MAIRA 3D');
            }
        };
        
        check();
    }
    
    /**
     * Función global para activar manualmente la vista 3D
     */
    window.activarVista3D = function() {
        if (terrainModule) {
            terrainModule.showModal();
        } else {
            console.warn('⚠️ Sistema 3D no inicializado');
        }
    };
    
    /**
     * Función global para verificar disponibilidad
     */
    window.isVista3DAvailable = function() {
        return !!(terrainModule && integrator);
    };
    
    /**
     * Función global para obtener configuración actual
     */
    window.getVista3DConfig = function() {
        return MAIRA_3D_CONFIG;
    };
    
    // Inicialización automática
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
    
    // También escuchar evento personalizado si MAIRA usa carga dinámica
    document.addEventListener('mairaSystemReady', waitForDependencies);
    
    console.log('📦 MAIRA 3D Terrain Initializer cargado');
    
})();