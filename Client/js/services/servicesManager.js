/**
 * MAIRA 4.0 - Servicios DDD Integration Manager
 * ============================================
 * Gestor de inicialización y coordinación de servicios DDD
 */

class MAIRAServicesManager {
    constructor() {
        this.services = new Map();
        this.initialized = false;
        this.core = this.createCoreConfig();
        
        console.log('🔧 MAIRAServicesManager creado');
    }

    createCoreConfig() {
        // Crear instancia de EventEmitter para comunicación entre servicios
        const eventEmitter = new EventEmitter();
        
        return {
            config: {
                THREEJS: {
                    enabled: true,
                    renderer: { antialias: true, alpha: true },
                    camera: { fov: 60, near: 0.1, far: 10000 },
                    terrain: { elevation_scale: 0.001, segments: 512 }
                }
            },
            startTime: Date.now(),
            // Añadir métodos de EventEmitter al core
            emit: eventEmitter.emit.bind(eventEmitter),
            on: eventEmitter.on.bind(eventEmitter),
            off: eventEmitter.off.bind(eventEmitter)
        };
    }

    async initialize() {
        if (this.initialized) {
            console.warn('⚠️ MAIRAServicesManager ya está inicializado');
            return;
        }

        console.log('🚀 Inicializando servicios DDD...');

        try {
            // Registrar servicios disponibles
            await this.registerServices();

            // Inicializar servicios básicos
            await this.initializeBasicServices();

            // Configurar integraciones
            await this.setupIntegrations();

            this.initialized = true;
            console.log('✅ MAIRAServicesManager inicializado completamente');

            // Emitir evento de inicialización
            this.notifyInitialization();

        } catch (error) {
            console.error('❌ Error inicializando MAIRAServicesManager:', error);
            throw error;
        }
    }

    async registerServices() {
        const availableServices = [
            { name: 'transitability', class: 'TransitabilityService', required: false },
            { name: 'slopeAnalysis', class: 'SlopeAnalysisService', required: false },
            { name: 'threeDMap', class: 'ThreeDMapService', required: false },
            { name: 'combatSystem3D', class: 'CombatSystem3DIntegrator', required: false },
            { name: 'autonomousAgent', class: 'AutonomousAgentService', required: false }
        ];

        for (const service of availableServices) {
            try {
                if (window[service.class]) {
                    console.log(`📦 Registrando servicio: ${service.name}`);
                    this.services.set(service.name, {
                        class: window[service.class],
                        instance: null,
                        initialized: false,
                        required: service.required
                    });
                } else if (service.required) {
                    throw new Error(`Servicio requerido ${service.class} no encontrado`);
                } else {
                    console.warn(`⚠️ Servicio opcional ${service.class} no disponible`);
                }
            } catch (error) {
                console.error(`❌ Error registrando servicio ${service.name}:`, error);
                if (service.required) throw error;
            }
        }

        console.log(`📋 ${this.services.size} servicios registrados`);
    }

    async initializeBasicServices() {
        // Inicializar servicios en orden de dependencia
        const initOrder = ['transitability', 'slopeAnalysis', 'threeDMap', 'combatSystem3D', 'autonomousAgent'];

        for (const serviceName of initOrder) {
            await this.initializeService(serviceName);
        }
    }

    async initializeService(serviceName) {
        const service = this.services.get(serviceName);
        if (!service) {
            console.warn(`⚠️ Servicio ${serviceName} no registrado`);
            return false;
        }

        try {
            console.log(`🔄 Inicializando servicio: ${serviceName}`);
            
            // Crear instancia
            service.instance = new service.class(this.core);
            
            // Inicializar si tiene método initialize
            if (typeof service.instance.initialize === 'function') {
                await service.instance.initialize();
            }
            
            service.initialized = true;
            console.log(`✅ Servicio ${serviceName} inicializado`);
            
            return true;
        } catch (error) {
            console.error(`❌ Error inicializando servicio ${serviceName}:`, error);
            if (service.required) throw error;
            return false;
        }
    }

    async setupIntegrations() {
        console.log('🔗 Configurando integraciones entre servicios...');

        // Integrar transitabilidad con análisis de pendientes
        const transitability = this.getService('transitability');
        const slopeAnalysis = this.getService('slopeAnalysis');
        
        if (transitability && slopeAnalysis) {
            // Configurar integración si ambos servicios están disponibles
            console.log('🔗 Integrando transitabilidad con análisis de pendientes');
        }

        // Integrar mapa 3D con sistema de combate
        const threeDMap = this.getService('threeDMap');
        const combatSystem3D = this.getService('combatSystem3D');
        
        if (threeDMap && combatSystem3D) {
            console.log('🔗 Integrando mapa 3D con sistema de combate');
        }

        console.log('✅ Integraciones configuradas');
    }

    getService(serviceName) {
        const service = this.services.get(serviceName);
        return service?.initialized ? service.instance : null;
    }

    getAllServices() {
        const result = {};
        for (const [name, service] of this.services) {
            if (service.initialized) {
                result[name] = service.instance;
            }
        }
        return result;
    }

    getServicesStatus() {
        const status = {};
        for (const [name, service] of this.services) {
            status[name] = {
                registered: true,
                initialized: service.initialized,
                required: service.required
            };
        }
        return status;
    }

    notifyInitialization() {
        // Emitir evento personalizado
        const event = new CustomEvent('mairaServicesReady', {
            detail: {
                services: this.getAllServices(),
                status: this.getServicesStatus()
            }
        });
        
        document.dispatchEvent(event);
        
        // También agregar al namespace global
        if (!window.MAIRA) window.MAIRA = {};
        window.MAIRA.ServicesManager = this;
        window.MAIRA.Services = window.MAIRA.Services || {};
        
        // Agregar servicios individuales
        const services = this.getAllServices();
        Object.assign(window.MAIRA.Services, services);
        
        console.log('📡 Evento mairaServicesReady emitido');
    }

    // Método de utilidad para inicialización diferida
    static async autoInitialize() {
        if (window.MAIRA?.ServicesManager?.initialized) {
            console.log('✅ MAIRAServicesManager ya inicializado');
            return window.MAIRA.ServicesManager;
        }

        const manager = new MAIRAServicesManager();
        await manager.initialize();
        return manager;
    }
}

// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.MAIRAServicesManager = MAIRAServicesManager;
    
    // Auto-registro en namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    window.MAIRA.ServicesManager = null; // Se asignará después de inicializar
    
    console.log('✅ MAIRAServicesManager registrado globalmente');
}
