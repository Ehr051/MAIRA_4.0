/**
 * MAIRA 4.0 - Core Module System
 * ==============================
 * Sistema central de módulos siguiendo arquitectura hexagonal
 */

class MAIRACore {
    constructor() {
        this.modules = new Map();
        this.services = new Map();
        this.handlers = new Map();
        this.workers = new Map();
        this.initialized = false;
        
        // Estado global del sistema
        this.state = {
            currentGame: null,
            currentUser: null,
            mapInstance: null,
            threejsInstance: null,
            websocketConnection: null
        };
        
        // Event emitter para comunicación entre módulos
        this.events = new EventTarget();
    }

    // Registro de módulos
    registerModule(name, moduleInstance) {
        if (this.modules.has(name)) {
            console.warn(`Módulo ${name} ya está registrado, reemplazando...`);
        }
        
        this.modules.set(name, moduleInstance);
        
        // Si el módulo tiene método init, lo ejecutamos
        if (typeof moduleInstance.init === 'function') {
            moduleInstance.init(this);
        }
        
        this.emit('moduleRegistered', { name, module: moduleInstance });
        return this;
    }

    // Registro de servicios
    registerService(name, serviceInstance) {
        this.services.set(name, serviceInstance);
        this.emit('serviceRegistered', { name, service: serviceInstance });
        return this;
    }

    // Registro de handlers
    registerHandler(name, handlerInstance) {
        this.handlers.set(name, handlerInstance);
        this.emit('handlerRegistered', { name, handler: handlerInstance });
        return this;
    }

    // Registro de workers
    registerWorker(name, workerInstance) {
        this.workers.set(name, workerInstance);
        this.emit('workerRegistered', { name, worker: workerInstance });
        return this;
    }

    // Obtener módulo
    getModule(name) {
        return this.modules.get(name);
    }

    // Obtener servicio
    getService(name) {
        return this.services.get(name);
    }

    // Obtener handler
    getHandler(name) {
        return this.handlers.get(name);
    }

    // Obtener worker
    getWorker(name) {
        return this.workers.get(name);
    }

    // Emitir eventos
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.events.dispatchEvent(event);
    }

    // Escuchar eventos
    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
        return this;
    }

    // Remover listeners
    off(eventName, callback) {
        this.events.removeEventListener(eventName, callback);
        return this;
    }

    // Inicialización del sistema
    async initialize() {
        if (this.initialized) {
            console.warn('MAIRA Core ya está inicializado');
            return;
        }

        console.log('🚀 Inicializando MAIRA 4.0 Core...');

        try {
            // Inicializar configuración
            await this.initializeConfig();
            
            // Inicializar servicios básicos
            await this.initializeServices();
            
            // Inicializar handlers
            await this.initializeHandlers();
            
            // Inicializar workers
            await this.initializeWorkers();
            
            // Inicializar módulos
            await this.initializeModules();

            this.initialized = true;
            this.emit('coreInitialized');
            
            console.log('✅ MAIRA 4.0 Core inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando MAIRA Core:', error);
            throw error;
        }
    }

    async initializeConfig() {
        // Cargar configuración desde config/index.js
        const configModule = await import('../config/index.js');
        this.config = configModule.default;
    }

    async initializeServices() {
        // Cargar servicios principales automáticamente
        try {
            // Tile Loader Service
            const { TileLoaderService } = await import('../utils/mini_tiles_loader.js');
            this.registerService('tileLoader', new TileLoaderService(this));
            
            // 3D Map Service
            const { ThreeDMapService } = await import('../services/threeDMapService.js');
            this.registerService('threeD', new ThreeDMapService(this));
            
            // Transitability Service
            const { TransitabilityService } = await import('../services/transitabilityService.js');
            this.registerService('transitability', new TransitabilityService(this));
            
            // Slope Analysis Service
            const { SlopeAnalysisService } = await import('../services/slopeAnalysisService.js');
            this.registerService('slopeAnalysis', new SlopeAnalysisService(this));
            
            // Autonomous Agent Service
            const { AutonomousAgentService } = await import('../services/autonomousAgentService.js');
            this.registerService('autonomousAgent', new AutonomousAgentService(this));
            
            // User Identity Service (ya cargado como módulo core)
            const UserIdentityService = await import('./UserIdentity.js');
            this.registerService('userIdentity', new UserIdentityService.default(this));
            
            console.log('📡 Servicios inicializados automáticamente');
            
        } catch (error) {
            console.error('Error cargando servicios:', error);
            console.log('📡 Servicios se cargarán dinámicamente según necesidad');
        }
    }

    async initializeHandlers() {
        // Los handlers se cargarán dinámicamente
        console.log('🎛️ Handlers listos para carga dinámica');
    }

    async initializeWorkers() {
        // Los workers se cargarán según necesidad
        console.log('⚙️ Workers preparados');
    }

    async initializeModules() {
        // Los módulos se cargarán según necesidad
        console.log('🧩 Módulos preparados para carga dinámica');
    }

    // Método para cargar dinámicamente handlers
    async loadHandler(handlerName) {
        if (this.handlers.has(handlerName)) {
            return this.handlers.get(handlerName);
        }

        try {
            const handlerModule = await import(`../handlers/${handlerName}.js`);
            const handlerInstance = new handlerModule.default(this);
            this.registerHandler(handlerName, handlerInstance);
            return handlerInstance;
        } catch (error) {
            console.error(`Error cargando handler ${handlerName}:`, error);
            throw error;
        }
    }

    // Método para cargar dinámicamente workers
    async loadWorker(workerName) {
        if (this.workers.has(workerName)) {
            return this.workers.get(workerName);
        }

        try {
            const worker = new Worker(`/Client/js/workers/${workerName}.js`);
            this.registerWorker(workerName, worker);
            return worker;
        } catch (error) {
            console.error(`Error cargando worker ${workerName}:`, error);
            throw error;
        }
    }

    // Cleanup
    destroy() {
        // Limpiar workers
        this.workers.forEach(worker => {
            if (worker.terminate) worker.terminate();
        });

        // Limpiar módulos
        this.modules.forEach(module => {
            if (module.destroy) module.destroy();
        });

        // Limpiar estado
        this.modules.clear();
        this.services.clear();
        this.handlers.clear();
        this.workers.clear();
        
        this.initialized = false;
        console.log('🧹 MAIRA Core limpiado');
    }
}

// Instancia global del core
const maiCore = new MAIRACore();

// Backward compatibility con MAIRA global
if (typeof window !== 'undefined') {
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Core = maiCore;
    
    // Auto-inicialización cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => maiCore.initialize());
    } else {
        maiCore.initialize();
    }
}

export default maiCore;
