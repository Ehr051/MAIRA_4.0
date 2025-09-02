/**
 * 🎮 MAIRA CORE ENGINE - SISTEMA PRINCIPAL OPTIMIZADO
 * Motor principal del sistema MAIRA 4.0 con arquitectura profesional
 * Inspirado en Command: Modern Operations y VBS para máximo realismo
 */

class MAIRACore {
    constructor() {
        this.version = '4.0.0';
        this.initialized = false;
        this.modules = new Map();
        this.performance = new PerformanceMonitor();
        this.eventBus = new EventBusOptimizado();
        this.stateManager = new StateManager();
        this.moduleManager = new ModuleManager();
        
        // Referencias juegos profesionales
        this.gameReferences = {
            command_ops: 'Simulación naval/aérea profesional',
            steel_beasts: 'Entrenamiento blindados Ejército',
            vbs: 'Virtual Battlespace militar',
            combat_mission: 'Sistema WEGO (We Go) turnos',
            flashpoint: 'Realismo guerra fría'
        };
        
        console.log('🎮 MAIRA CORE ENGINE 4.0 - INICIANDO...');
        this.initializeCore();
    }

    /**
     * INICIALIZACIÓN CORE SISTEMA
     */
    async initializeCore() {
        console.log('⚡ Inicializando núcleo MAIRA...');
        
        try {
            // FASE 1: Componentes base
            await this.initializeBaseComponents();
            
            // FASE 2: Event system
            await this.initializeEventSystem();
            
            // FASE 3: Module loader
            await this.initializeModuleLoader();
            
            // FASE 4: Performance monitoring
            await this.initializePerformanceMonitoring();
            
            // FASE 5: Estado global
            await this.initializeGlobalState();
            
            this.initialized = true;
            console.log('✅ MAIRA CORE inicializado correctamente');
            
            // Disparar evento sistema listo
            this.eventBus.emit('core:ready', {
                version: this.version,
                timestamp: Date.now(),
                modules_available: this.getAvailableModules()
            });
            
        } catch (error) {
            console.error('❌ Error inicializando MAIRA Core:', error);
            throw error;
        }
    }

    /**
     * COMPONENTES BASE
     */
    async initializeBaseComponents() {
        // Performance Monitor
        this.performance = new PerformanceMonitor({
            trackFPS: true,
            trackMemory: true,
            trackNetwork: true,
            interval: 1000
        });

        // Event Bus Optimizado
        this.eventBus = new EventBusOptimizado({
            maxListeners: 100,
            enableDebug: true,
            enableMetrics: true
        });

        // State Manager
        this.stateManager = new StateManager({
            immutable: true,
            persistToStorage: true,
            compressionEnabled: true
        });

        // Module Manager
        this.moduleManager = new ModuleManager({
            lazyLoading: true,
            cachingEnabled: true,
            dependencyResolution: true
        });
    }

    /**
     * SISTEMA EVENTOS OPTIMIZADO
     */
    async initializeEventSystem() {
        // Eventos core del sistema
        this.eventBus.on('module:load', this.handleModuleLoad.bind(this));
        this.eventBus.on('module:unload', this.handleModuleUnload.bind(this));
        this.eventBus.on('performance:warning', this.handlePerformanceWarning.bind(this));
        this.eventBus.on('error:critical', this.handleCriticalError.bind(this));
        
        // Eventos gaming específicos
        this.eventBus.on('gaming:start', this.handleGamingStart.bind(this));
        this.eventBus.on('gaming:pause', this.handleGamingPause.bind(this));
        this.eventBus.on('gaming:turn', this.handleGamingTurn.bind(this));
        
        console.log('📡 Sistema eventos inicializado');
    }

    /**
     * CARGADOR MÓDULOS INTELIGENTE
     */
    async initializeModuleLoader() {
        // Configurar rutas módulos
        this.moduleManager.registerModulePaths({
            core: '/js/core/',
            gaming: '/js/gaming/',
            tactical: '/js/tactical/',
            tools: '/js/tools/',
            interface: '/js/interface/'
        });

        // Precargar módulos críticos
        const criticalModules = [
            'interface/UIManager',
            'tools/NavigationOptimized',
            'tactical/MapManager'
        ];

        for (const module of criticalModules) {
            await this.loadModule(module);
        }

        console.log('📦 Module loader inicializado');
    }

    /**
     * MONITOREO PERFORMANCE
     */
    async initializePerformanceMonitoring() {
        this.performance.start();
        
        // Configurar alertas performance
        this.performance.setThresholds({
            fps: { min: 30, target: 60 },
            memory: { max: 100 * 1024 * 1024 }, // 100MB
            loadTime: { max: 1000 } // 1 segundo
        });

        this.performance.on('threshold:exceeded', (metric, value) => {
            this.eventBus.emit('performance:warning', { metric, value });
        });

        console.log('📊 Performance monitoring activo');
    }

    /**
     * ESTADO GLOBAL
     */
    async initializeGlobalState() {
        // Estado inicial del sistema
        const initialState = {
            app: {
                version: this.version,
                mode: 'tactical', // tactical, gaming, planning
                user: null,
                session: null
            },
            
            ui: {
                theme: 'military-dark',
                language: 'es',
                sidebar: { visible: true, collapsed: false },
                notifications: { enabled: true, position: 'top-right' }
            },
            
            map: {
                center: [-34.6118, -58.3960], // Buenos Aires default
                zoom: 10,
                layers: new Set(['base', 'military']),
                drawing: { active: false, tool: null }
            },
            
            gaming: {
                active: false,
                session: null,
                phase: null,
                turn: 0,
                players: new Map()
            },
            
            performance: {
                enabled: true,
                metrics: new Map(),
                alerts: []
            }
        };

        await this.stateManager.initialize(initialState);
        console.log('🗄️ Estado global inicializado');
    }

    /**
     * CARGA MÓDULOS BAJO DEMANDA
     */
    async loadModule(moduleName) {
        if (this.modules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        console.log(`📦 Cargando módulo: ${moduleName}`);
        
        const startTime = performance.now();
        
        try {
            const module = await this.moduleManager.load(moduleName);
            
            // Registrar módulo
            this.modules.set(moduleName, module);
            
            // Métricas carga
            const loadTime = performance.now() - startTime;
            this.performance.recordMetric('moduleLoad', {
                name: moduleName,
                time: loadTime
            });

            // Evento módulo cargado
            this.eventBus.emit('module:loaded', {
                name: moduleName,
                loadTime: loadTime
            });

            console.log(`✅ Módulo ${moduleName} cargado en ${loadTime.toFixed(2)}ms`);
            return module;
            
        } catch (error) {
            console.error(`❌ Error cargando módulo ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * GESTIÓN MODOS SISTEMA
     */
    async switchMode(newMode) {
        const currentMode = this.stateManager.getState('app.mode');
        
        if (currentMode === newMode) {
            return;
        }

        console.log(`🔄 Cambiando modo: ${currentMode} → ${newMode}`);
        
        // Descargar módulos del modo anterior
        await this.unloadModeModules(currentMode);
        
        // Cargar módulos del nuevo modo
        await this.loadModeModules(newMode);
        
        // Actualizar estado
        this.stateManager.setState('app.mode', newMode);
        
        // Evento cambio modo
        this.eventBus.emit('mode:changed', {
            from: currentMode,
            to: newMode,
            timestamp: Date.now()
        });
    }

    /**
     * CARGA MÓDULOS POR MODO
     */
    async loadModeModules(mode) {
        const modulesByMode = {
            tactical: [
                'tactical/PlanningEngine',
                'tactical/SymbolManager',
                'tactical/CoordinateSystem'
            ],
            gaming: [
                'gaming/GameEngine',
                'gaming/AIDirector',
                'gaming/FogOfWar',
                'gaming/TurnManager',
                'gaming/LogisticsSystem',
                'gaming/MovementSystem',
                'gaming/StatisticsEngine'
            ],
            planning: [
                'tactical/PlanningEngine',
                'tools/MeasurementTools',
                'tools/DrawingTools'
            ]
        };

        const modules = modulesByMode[mode] || [];
        
        for (const module of modules) {
            await this.loadModule(module);
        }
    }

    /**
     * DESCARGA MÓDULOS
     */
    async unloadModeModules(mode) {
        const modulesByMode = {
            tactical: ['tactical/PlanningEngine', 'tactical/SymbolManager'],
            gaming: ['gaming/GameEngine', 'gaming/AIDirector', 'gaming/FogOfWar'],
            planning: ['tactical/PlanningEngine', 'tools/MeasurementTools']
        };

        const modules = modulesByMode[mode] || [];
        
        for (const module of modules) {
            if (this.modules.has(module)) {
                this.modules.delete(module);
                this.eventBus.emit('module:unloaded', { name: module });
            }
        }
    }

    /**
     * HANDLERS EVENTOS
     */
    handleModuleLoad(event) {
        console.log(`📦 Módulo cargado: ${event.name} (${event.loadTime}ms)`);
    }

    handleModuleUnload(event) {
        console.log(`📤 Módulo descargado: ${event.name}`);
    }

    handlePerformanceWarning(event) {
        console.warn(`⚠️ Performance warning: ${event.metric} = ${event.value}`);
        
        // Acciones automáticas optimización
        if (event.metric === 'memory' && event.value > 80 * 1024 * 1024) {
            this.optimizeMemoryUsage();
        }
    }

    handleCriticalError(event) {
        console.error(`🚨 Error crítico:`, event);
        // Implementar recovery automático
    }

    handleGamingStart(event) {
        console.log('🎮 Iniciando modo Gaming');
        this.switchMode('gaming');
    }

    handleGamingPause(event) {
        console.log('⏸️ Gaming pausado');
    }

    handleGamingTurn(event) {
        console.log(`🎯 Turno ${event.turn} - Fase: ${event.phase}`);
    }

    /**
     * OPTIMIZACIÓN AUTOMÁTICA
     */
    optimizeMemoryUsage() {
        console.log('🧹 Optimizando uso memoria...');
        
        // Limpiar cache módulos no usados
        this.moduleManager.clearUnusedCache();
        
        // Forzar garbage collection si está disponible
        if (window.gc) {
            window.gc();
        }
        
        // Limpiar eventos antiguos
        this.eventBus.cleanup();
        
        console.log('✅ Optimización memoria completada');
    }

    /**
     * API PÚBLICA
     */
    getModule(name) {
        return this.modules.get(name);
    }

    getState(path) {
        return this.stateManager.getState(path);
    }

    setState(path, value) {
        return this.stateManager.setState(path, value);
    }

    on(event, handler) {
        return this.eventBus.on(event, handler);
    }

    emit(event, data) {
        return this.eventBus.emit(event, data);
    }

    getPerformanceMetrics() {
        return this.performance.getMetrics();
    }

    getAvailableModules() {
        return Array.from(this.modules.keys());
    }

    isInitialized() {
        return this.initialized;
    }

    getVersion() {
        return this.version;
    }
}

/**
 * CLASES AUXILIARES OPTIMIZADAS
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.metrics = new Map();
        this.thresholds = new Map();
        this.listeners = new Map();
        this.interval = null;
        this.lastFrame = performance.now();
        this.frameCount = 0;
    }

    get defaultOptions() {
        return {
            trackFPS: true,
            trackMemory: true,
            trackNetwork: true,
            interval: 1000
        };
    }

    start() {
        if (this.interval) return;
        
        this.interval = setInterval(() => {
            this.collectMetrics();
        }, this.options.interval);
        
        // RAF para FPS
        if (this.options.trackFPS) {
            this.startFPSTracking();
        }
    }

    startFPSTracking() {
        const trackFrame = () => {
            this.frameCount++;
            requestAnimationFrame(trackFrame);
        };
        requestAnimationFrame(trackFrame);
        
        setInterval(() => {
            const fps = this.frameCount;
            this.frameCount = 0;
            this.recordMetric('fps', fps);
            this.checkThreshold('fps', fps);
        }, 1000);
    }

    collectMetrics() {
        // Memoria
        if (this.options.trackMemory && performance.memory) {
            const memory = performance.memory.usedJSHeapSize;
            this.recordMetric('memory', memory);
            this.checkThreshold('memory', memory);
        }

        // Network timing
        if (this.options.trackNetwork) {
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const nav = entries[0];
                this.recordMetric('loadTime', nav.loadEventEnd - nav.navigationStart);
            }
        }
    }

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const values = this.metrics.get(name);
        values.push({ timestamp: Date.now(), value });
        
        // Mantener solo últimos 100 valores
        if (values.length > 100) {
            values.shift();
        }
    }

    setThresholds(thresholds) {
        for (const [metric, threshold] of Object.entries(thresholds)) {
            this.thresholds.set(metric, threshold);
        }
    }

    checkThreshold(metric, value) {
        const threshold = this.thresholds.get(metric);
        if (!threshold) return;
        
        let exceeded = false;
        
        if (threshold.min && value < threshold.min) exceeded = true;
        if (threshold.max && value > threshold.max) exceeded = true;
        
        if (exceeded) {
            this.emit('threshold:exceeded', metric, value);
        }
    }

    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    emit(event, ...args) {
        const handlers = this.listeners.get(event) || [];
        handlers.forEach(handler => handler(...args));
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}

class EventBusOptimizado {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.listeners = new Map();
        this.onceListeners = new Map();
        this.metrics = new Map();
    }

    get defaultOptions() {
        return {
            maxListeners: 50,
            enableDebug: false,
            enableMetrics: false
        };
    }

    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const handlers = this.listeners.get(event);
        
        // Verificar límite listeners
        if (handlers.length >= this.options.maxListeners) {
            console.warn(`EventBus: Límite listeners alcanzado para evento '${event}'`);
            return;
        }
        
        handlers.push(handler);
        
        if (this.options.enableDebug) {
            console.log(`EventBus: Listener agregado para '${event}' (total: ${handlers.length})`);
        }
    }

    once(event, handler) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, []);
        }
        
        this.onceListeners.get(event).push(handler);
    }

    emit(event, data) {
        const startTime = performance.now();
        
        // Listeners normales
        const handlers = this.listeners.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`EventBus: Error en handler para '${event}':`, error);
            }
        });
        
        // Listeners once
        const onceHandlers = this.onceListeners.get(event) || [];
        onceHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`EventBus: Error en once handler para '${event}':`, error);
            }
        });
        
        // Limpiar once handlers
        if (onceHandlers.length > 0) {
            this.onceListeners.delete(event);
        }
        
        // Métricas
        if (this.options.enableMetrics) {
            const duration = performance.now() - startTime;
            this.recordEventMetric(event, duration);
        }
        
        if (this.options.enableDebug) {
            console.log(`EventBus: Evento '${event}' emitido a ${handlers.length + onceHandlers.length} listeners`);
        }
    }

    off(event, handler) {
        const handlers = this.listeners.get(event) || [];
        const index = handlers.indexOf(handler);
        
        if (index > -1) {
            handlers.splice(index, 1);
            if (handlers.length === 0) {
                this.listeners.delete(event);
            }
        }
    }

    cleanup() {
        // Limpiar listeners huérfanos
        let cleaned = 0;
        
        for (const [event, handlers] of this.listeners) {
            const filtered = handlers.filter(handler => handler && typeof handler === 'function');
            if (filtered.length !== handlers.length) {
                if (filtered.length === 0) {
                    this.listeners.delete(event);
                } else {
                    this.listeners.set(event, filtered);
                }
                cleaned++;
            }
        }
        
        console.log(`EventBus: Limpieza completada (${cleaned} eventos procesados)`);
    }

    recordEventMetric(event, duration) {
        if (!this.metrics.has(event)) {
            this.metrics.set(event, { count: 0, totalTime: 0, avgTime: 0 });
        }
        
        const metric = this.metrics.get(event);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

class StateManager {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.state = {};
        this.history = [];
        this.listeners = new Map();
        this.initialized = false;
    }

    get defaultOptions() {
        return {
            immutable: true,
            persistToStorage: false,
            compressionEnabled: false,
            maxHistory: 50
        };
    }

    async initialize(initialState) {
        this.state = this.options.immutable ? 
            this.deepFreeze(structuredClone(initialState)) : 
            initialState;
        
        this.initialized = true;
        
        if (this.options.persistToStorage) {
            await this.loadFromStorage();
        }
    }

    getState(path) {
        if (!path) return this.state;
        
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    setState(path, value) {
        if (!this.initialized) {
            throw new Error('StateManager no inicializado');
        }

        const oldState = this.options.immutable ? 
            structuredClone(this.state) : 
            { ...this.state };
        
        const newState = this.setValueAtPath(
            this.options.immutable ? structuredClone(this.state) : this.state,
            path,
            value
        );
        
        this.state = this.options.immutable ? 
            this.deepFreeze(newState) : 
            newState;
        
        // Historial
        this.addToHistory(oldState);
        
        // Notificar cambios
        this.notifyListeners(path, value, oldState);
        
        // Persistir
        if (this.options.persistToStorage) {
            this.saveToStorage();
        }
    }

    setValueAtPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        
        target[lastKey] = value;
        return obj;
    }

    subscribe(path, listener) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        
        this.listeners.get(path).push(listener);
        
        return () => this.unsubscribe(path, listener);
    }

    unsubscribe(path, listener) {
        const listeners = this.listeners.get(path) || [];
        const index = listeners.indexOf(listener);
        
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    notifyListeners(path, newValue, oldState) {
        // Notificar listeners exactos
        const exactListeners = this.listeners.get(path) || [];
        exactListeners.forEach(listener => {
            listener(newValue, this.getValueAtPath(oldState, path));
        });
        
        // Notificar listeners padre
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            const parentListeners = this.listeners.get(parentPath) || [];
            
            parentListeners.forEach(listener => {
                listener(
                    this.getState(parentPath),
                    this.getValueAtPath(oldState, parentPath)
                );
            });
        }
    }

    getValueAtPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    addToHistory(state) {
        this.history.push({
            state: structuredClone(state),
            timestamp: Date.now()
        });
        
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0) return false;
        
        const previous = this.history.pop();
        this.state = this.options.immutable ? 
            this.deepFreeze(previous.state) : 
            previous.state;
        
        return true;
    }

    deepFreeze(obj) {
        Object.getOwnPropertyNames(obj).forEach(name => {
            const value = obj[name];
            if (value && typeof value === 'object') {
                this.deepFreeze(value);
            }
        });
        
        return Object.freeze(obj);
    }

    async saveToStorage() {
        if (!this.options.persistToStorage) return;
        
        try {
            const data = this.options.compressionEnabled ? 
                this.compress(JSON.stringify(this.state)) : 
                JSON.stringify(this.state);
            
            localStorage.setItem('maira_state', data);
        } catch (error) {
            console.error('Error guardando estado:', error);
        }
    }

    async loadFromStorage() {
        if (!this.options.persistToStorage) return;
        
        try {
            const data = localStorage.getItem('maira_state');
            if (!data) return;
            
            const state = this.options.compressionEnabled ? 
                JSON.parse(this.decompress(data)) : 
                JSON.parse(data);
            
            this.state = this.options.immutable ? 
                this.deepFreeze(state) : 
                state;
                
        } catch (error) {
            console.error('Error cargando estado:', error);
        }
    }

    compress(str) {
        // Implementación simple compresión
        return btoa(str);
    }

    decompress(str) {
        return atob(str);
    }
}

class ModuleManager {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
        this.modules = new Map();
        this.cache = new Map();
        this.dependencies = new Map();
        this.paths = new Map();
    }

    get defaultOptions() {
        return {
            lazyLoading: true,
            cachingEnabled: true,
            dependencyResolution: true,
            timeoutMs: 10000
        };
    }

    registerModulePaths(paths) {
        for (const [namespace, path] of Object.entries(paths)) {
            this.paths.set(namespace, path);
        }
    }

    async load(moduleName) {
        // Check cache primero
        if (this.options.cachingEnabled && this.cache.has(moduleName)) {
            return this.cache.get(moduleName);
        }

        // Resolver dependencias
        if (this.options.dependencyResolution) {
            await this.resolveDependencies(moduleName);
        }

        const moduleUrl = this.resolveModuleUrl(moduleName);
        
        try {
            const module = await this.loadModuleFromUrl(moduleUrl);
            
            // Cache módulo
            if (this.options.cachingEnabled) {
                this.cache.set(moduleName, module);
            }
            
            return module;
            
        } catch (error) {
            console.error(`Error cargando módulo ${moduleName}:`, error);
            throw error;
        }
    }

    resolveModuleUrl(moduleName) {
        const [namespace, ...pathParts] = moduleName.split('/');
        const basePath = this.paths.get(namespace) || '/js/';
        return `${basePath}${pathParts.join('/')}.js`;
    }

    async loadModuleFromUrl(url) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout cargando módulo: ${url}`));
            }, this.options.timeoutMs);

            import(url)
                .then(module => {
                    clearTimeout(timeout);
                    resolve(module);
                })
                .catch(error => {
                    clearTimeout(timeout);
                    reject(error);
                });
        });
    }

    async resolveDependencies(moduleName) {
        const deps = this.dependencies.get(moduleName) || [];
        
        for (const dep of deps) {
            if (!this.cache.has(dep)) {
                await this.load(dep);
            }
        }
    }

    registerDependency(moduleName, dependencies) {
        this.dependencies.set(moduleName, Array.isArray(dependencies) ? dependencies : [dependencies]);
    }

    clearUnusedCache() {
        // Implementar lógica para limpiar cache no usado
        const oneHourAgo = Date.now() - 3600000;
        
        for (const [name, module] of this.cache) {
            if (module.lastAccessed && module.lastAccessed < oneHourAgo) {
                this.cache.delete(name);
            }
        }
    }

    getCacheSize() {
        return this.cache.size;
    }

    getCachedModules() {
        return Array.from(this.cache.keys());
    }
}

// INICIALIZAR MAIRA CORE GLOBAL
window.MAIRACore = MAIRACore;

// AUTO-INICIALIZACIÓN CUANDO DOM ESTÁ LISTO
document.addEventListener('DOMContentLoaded', () => {
    window.MAIRA = new MAIRACore();
});

console.log('🎮 MAIRA Core Engine 4.0 - Módulo cargado');
