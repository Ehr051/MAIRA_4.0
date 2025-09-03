/**
 * MAIRA System Loader
 * Carga todos los componentes del sistema de forma secuencial y optimizada
 * Este archivo debe ser incluido en las plantillas HTML principales
 */

(function() {
    'use strict';

    // Configuración del sistema
    const MAIRA_CONFIG = {
        version: '2.0.0',
        debug: true,
        components: [
            // Orden de carga optimizado por dependencias
            '/components/MemoryManager.js',
            '/components/SecurityManager.js', 
            '/components/ErrorRecoveryManager.js',
            '/components/PerformanceMonitor.js',
            '/components/ModularArchitect.js',
            '/components/GamingMechanicsManager.js',
            '/components/IntegrationSystem.js' // Último, coordina todo
        ],
        loadTimeout: 30000, // 30 segundos timeout
        retryAttempts: 3
    };

    // Estado del cargador
    let loadState = {
        loaded: [],
        failed: [],
        loading: false,
        startTime: null
    };

    /**
     * Inicializa el sistema MAIRA
     */
    async function initializeMairaSystem() {
        if (loadState.loading) {
            console.warn('[MairaLoader] Sistema ya está cargando...');
            return;
        }

        console.log('[MairaLoader] Iniciando carga del sistema MAIRA v' + MAIRA_CONFIG.version);
        
        loadState.loading = true;
        loadState.startTime = Date.now();

        // Crear namespace global
        window.MAIRA = window.MAIRA || {
            version: MAIRA_CONFIG.version,
            loaded: false,
            debug: MAIRA_CONFIG.debug
        };

        try {
            // Cargar componentes secuencialmente
            await loadComponents();
            
            // Verificar que todos los componentes estén disponibles
            await verifyComponents();
            
            // Marcar como completamente cargado
            window.MAIRA.loaded = true;
            
            const loadTime = Date.now() - loadState.startTime;
            console.log(`[MairaLoader] ✅ Sistema MAIRA cargado completamente en ${loadTime}ms`);
            
            // Emitir evento global de sistema listo
            dispatchSystemEvent('maira_system_loaded', {
                version: MAIRA_CONFIG.version,
                loadTime: loadTime,
                components: loadState.loaded
            });

        } catch (error) {
            console.error('[MairaLoader] ❌ Error cargando sistema MAIRA:', error);
            
            // Intentar carga parcial
            await attemptPartialLoad();
            
            dispatchSystemEvent('maira_system_error', {
                error: error.message,
                loaded: loadState.loaded,
                failed: loadState.failed
            });
        } finally {
            loadState.loading = false;
        }
    }

    /**
     * Carga todos los componentes en orden
     */
    async function loadComponents() {
        for (const componentPath of MAIRA_CONFIG.components) {
            await loadComponent(componentPath);
        }
    }

    /**
     * Carga un componente específico
     */
    async function loadComponent(componentPath) {
        const componentName = extractComponentName(componentPath);
        
        console.log(`[MairaLoader] Cargando ${componentName}...`);

        for (let attempt = 1; attempt <= MAIRA_CONFIG.retryAttempts; attempt++) {
            try {
                await loadScript(componentPath);
                
                // Verificar que el componente se haya cargado correctamente
                await waitForComponent(componentName);
                
                loadState.loaded.push(componentName);
                console.log(`[MairaLoader] ✅ ${componentName} cargado`);
                
                return; // Éxito, salir del loop de reintentos
                
            } catch (error) {
                console.warn(`[MairaLoader] ⚠️ Intento ${attempt}/${MAIRA_CONFIG.retryAttempts} falló para ${componentName}:`, error.message);
                
                if (attempt === MAIRA_CONFIG.retryAttempts) {
                    loadState.failed.push({
                        component: componentName,
                        path: componentPath,
                        error: error.message
                    });
                    
                    // Si es un componente crítico, lanzar error
                    if (isCriticalComponent(componentName)) {
                        throw new Error(`Componente crítico ${componentName} no se pudo cargar`);
                    }
                    
                    console.error(`[MairaLoader] ❌ ${componentName} falló después de ${MAIRA_CONFIG.retryAttempts} intentos`);
                } else {
                    // Esperar antes del siguiente intento
                    await delay(1000 * attempt);
                }
            }
        }
    }

    /**
     * Carga un script de forma asíncrona
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            // Timeout de carga
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout cargando ${src}`));
            }, MAIRA_CONFIG.loadTimeout);

            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };

            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Error cargando script ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Espera a que un componente esté disponible
     */
    async function waitForComponent(componentName) {
        const maxWait = 5000; // 5 segundos
        const checkInterval = 100; // 100ms
        let elapsed = 0;

        while (elapsed < maxWait) {
            if (window.MAIRA && window.MAIRA[componentName]) {
                return; // Componente encontrado
            }
            
            await delay(checkInterval);
            elapsed += checkInterval;
        }

        throw new Error(`Componente ${componentName} no se inicializó en ${maxWait}ms`);
    }

    /**
     * Verifica que todos los componentes críticos estén disponibles
     */
    async function verifyComponents() {
        const criticalComponents = [
            'MemoryManager',
            'SecurityManager',
            'ErrorRecoveryManager',
            'IntegrationSystem'
        ];

        const missing = [];
        
        for (const componentName of criticalComponents) {
            if (!window.MAIRA || !window.MAIRA[componentName]) {
                missing.push(componentName);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Componentes críticos faltantes: ${missing.join(', ')}`);
        }

        console.log('[MairaLoader] ✅ Todos los componentes críticos verificados');
    }

    /**
     * Intenta carga parcial si hay errores
     */
    async function attemptPartialLoad() {
        console.log('[MairaLoader] Intentando carga parcial del sistema...');

        // Verificar componentes mínimos
        const minimalComponents = ['MemoryManager', 'SecurityManager'];
        let minimalLoaded = true;

        for (const componentName of minimalComponents) {
            if (!window.MAIRA || !window.MAIRA[componentName]) {
                minimalLoaded = false;
                break;
            }
        }

        if (minimalLoaded) {
            console.log('[MairaLoader] ⚠️ Sistema en modo parcial - funcionalidad limitada');
            window.MAIRA.partialMode = true;
            
            dispatchSystemEvent('maira_partial_load', {
                loaded: loadState.loaded,
                failed: loadState.failed
            });
        } else {
            console.error('[MairaLoader] ❌ No se pudieron cargar componentes mínimos');
            throw new Error('Fallo crítico del sistema');
        }
    }

    /**
     * Utilidades auxiliares
     */
    function extractComponentName(path) {
        return path.split('/').pop().replace('.js', '');
    }

    function isCriticalComponent(componentName) {
        const criticalComponents = [
            'MemoryManager',
            'SecurityManager', 
            'ErrorRecoveryManager',
            'IntegrationSystem'
        ];
        return criticalComponents.includes(componentName);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function dispatchSystemEvent(eventType, data) {
        const event = new CustomEvent(eventType, { 
            detail: { ...data, timestamp: Date.now() } 
        });
        window.dispatchEvent(event);
        
        if (MAIRA_CONFIG.debug) {
            console.log(`[MairaLoader] 📡 Evento: ${eventType}`, data);
        }
    }

    /**
     * API pública del cargador
     */
    window.MairaLoader = {
        // Estado del sistema
        getLoadState: () => ({ ...loadState }),
        
        // Reinicializar sistema
        reinitialize: async () => {
            console.log('[MairaLoader] Reinicializando sistema...');
            loadState = { loaded: [], failed: [], loading: false, startTime: null };
            await initializeMairaSystem();
        },
        
        // Verificar si está listo
        isReady: () => window.MAIRA && window.MAIRA.loaded === true,
        
        // Obtener información del sistema
        getSystemInfo: () => ({
            version: MAIRA_CONFIG.version,
            loaded: window.MAIRA?.loaded || false,
            partialMode: window.MAIRA?.partialMode || false,
            components: loadState.loaded,
            failed: loadState.failed
        })
    };

    /**
     * Auto-inicialización
     */
    function autoInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeMairaSystem);
        } else {
            // DOM ya está listo
            setTimeout(initializeMairaSystem, 100);
        }
    }

    // Inicializar inmediatamente
    autoInitialize();

    // Exportar para uso manual si es necesario
    window.initializeMairaSystem = initializeMairaSystem;

    console.log('[MairaLoader] 🚀 Cargador MAIRA inicializado');

})();
