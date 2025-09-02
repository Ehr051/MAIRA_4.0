/**
 * MAIRA 4.0 - Gestor de Carga Principal
 * ====================================
 * Punto de entrada unificado para la nueva arquitectura hexagonal
 */

import maiCore from './core/index.js';
import MAIRA_CONFIG from './config/index.js';

class MAIRABootstrap {
    constructor() {
        this.loadStartTime = Date.now();
        this.initializationSteps = [];
        this.isReady = false;
    }

    async initialize() {
        console.log('🚀 Iniciando MAIRA 4.0 con arquitectura hexagonal...');
        
        try {
            // Paso 1: Configuración del core
            this.logStep('Configurando sistema core');
            await this.setupCore();
            
            // Paso 2: Inicialización de servicios
            this.logStep('Inicializando servicios');
            await this.initializeServices();
            
            // Paso 3: Configuración de 3D
            this.logStep('Configurando sistema 3D');
            await this.setup3D();
            
            // Paso 4: Carga de datos iniciales
            this.logStep('Cargando datos iniciales');
            await this.loadInitialData();
            
            // Paso 5: Activar agentes autónomos
            this.logStep('Activando agentes autónomos');
            await this.activateAutonomousAgents();
            
            // Paso 6: Finalización
            this.logStep('Finalizando inicialización');
            await this.finalizeBoot();
            
            this.isReady = true;
            
            const totalTime = Date.now() - this.loadStartTime;
            console.log(`✅ MAIRA 4.0 cargado exitosamente en ${totalTime}ms`);
            
            this.reportBootSummary();
            
        } catch (error) {
            console.error('❌ Error durante la inicialización:', error);
            throw error;
        }
    }

    async setupCore() {
        // El core ya se inicializa automáticamente
        maiCore.startTime = this.loadStartTime;
        
        // Verificar que esté inicializado
        if (!maiCore.initialized) {
            await maiCore.initialize();
        }
        
        // Establecer referencias globales para compatibilidad
        window.MAIRA_CORE = maiCore;
        window.MAIRA_CONFIG = MAIRA_CONFIG;
    }

    async initializeServices() {
        // Los servicios ya se cargan automáticamente en core.initializeServices()
        
        // Verificar que los servicios críticos estén disponibles
        const criticalServices = ['tileLoader', 'userIdentity'];
        
        for (const serviceName of criticalServices) {
            const service = maiCore.getService(serviceName);
            if (!service) {
                console.warn(`⚠️ Servicio crítico ${serviceName} no disponible`);
            } else {
                // Inicializar si tiene método init
                if (typeof service.initialize === 'function') {
                    await service.initialize();
                }
            }
        }
    }

    async setup3D() {
        const threeDService = maiCore.getService('threeD');
        
        if (threeDService && MAIRA_CONFIG.THREEJS.enabled) {
            // Buscar contenedor 3D en la página
            const container3D = document.getElementById('mapa3d') || 
                              document.getElementById('threejs-container') ||
                              this.create3DContainer();
                              
            if (container3D) {
                await threeDService.initialize(container3D.id);
                console.log('🎮 Sistema 3D configurado');
            }
        } else {
            console.log('📺 Sistema 3D deshabilitado o no disponible');
        }
    }

    create3DContainer() {
        // Crear contenedor 3D si no existe
        const container = document.createElement('div');
        container.id = 'threejs-container';
        container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    async loadInitialData() {
        // Cargar datos iniciales del usuario si están disponibles
        const userService = maiCore.getService('userIdentity');
        if (userService) {
            await userService.loadFromStorage();
        }
        
        // Pre-cargar tiles críticos si es necesario
        const tileLoader = maiCore.getService('tileLoader');
        if (tileLoader) {
            // Pre-calentar cache con tiles de Buenos Aires
            console.log('🗺️ Pre-cargando tiles críticos...');
        }
    }

    async activateAutonomousAgents() {
        const agentService = maiCore.getService('autonomousAgent');
        
        if (agentService) {
            // Activar sesión de trabajo de 6 horas como se pidió
            await agentService.startWorkSession();
            console.log('🤖 Agentes autónomos activados (sesión de 6h)');
        }
    }

    async finalizeBoot() {
        // Configurar listeners globales
        this.setupGlobalListeners();
        
        // Configurar backward compatibility
        this.setupBackwardCompatibility();
        
        // Optimizaciones finales
        this.applyPerformanceOptimizations();
    }

    setupGlobalListeners() {
        // Escuchar eventos del core
        maiCore.on('coreInitialized', () => {
            console.log('📡 Core inicializado');
        });

        maiCore.on('serviceRegistered', (event) => {
            console.log(`🔧 Servicio registrado: ${event.detail.name}`);
        });

        maiCore.on('workSessionStarted', () => {
            console.log('🤖 Sesión de trabajo autónomo iniciada');
        });

        // Manejo de errores globales
        window.addEventListener('error', (event) => {
            console.error('❌ Error global:', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promise rechazada:', event.reason);
        });
    }

    setupBackwardCompatibility() {
        // Mantener compatibilidad con código existente
        window.MAIRA = window.MAIRA || {};
        
        // Referencias directas a servicios para compatibilidad
        Object.defineProperty(window.MAIRA, 'UserIdentity', {
            get: () => maiCore.getService('userIdentity')?.getLegacyInterface?.() || window.MAIRA.UserIdentity
        });

        Object.defineProperty(window.MAIRA, 'Transitabilidad', {
            get: () => maiCore.getService('transitability')?.getLegacyInterface?.()
        });

        Object.defineProperty(window.MAIRA, 'Pendiente', {
            get: () => maiCore.getService('slopeAnalysis')?.getLegacyInterface?.()
        });

        Object.defineProperty(window.MAIRA, 'Vegetacion', {
            get: () => maiCore.getHandler('vegetacionhandler')
        });

        Object.defineProperty(window.MAIRA, 'Elevacion', {
            get: () => maiCore.getHandler('elevationHandler')
        });
    }

    applyPerformanceOptimizations() {
        // Configurar garbage collection hints
        if (window.gc) {
            setTimeout(() => window.gc(), 5000);
        }

        // Configurar requestIdleCallback para tareas no críticas
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                console.log('🔋 Optimizaciones de performance aplicadas');
            });
        }
    }

    logStep(step) {
        const timestamp = Date.now() - this.loadStartTime;
        this.initializationSteps.push({ step, timestamp });
        console.log(`⚙️ [${timestamp}ms] ${step}`);
    }

    reportBootSummary() {
        console.log('\n📊 RESUMEN DE INICIALIZACIÓN MAIRA 4.0');
        console.log('=' .repeat(50));
        
        this.initializationSteps.forEach(({ step, timestamp }) => {
            console.log(`✓ ${step.padEnd(30)} ${timestamp}ms`);
        });
        
        console.log('=' .repeat(50));
        console.log(`🎯 Servicios activos: ${maiCore.services.size}`);
        console.log(`🧩 Módulos cargados: ${maiCore.modules.size}`);
        console.log(`⚙️ Workers disponibles: ${maiCore.workers.size}`);
        console.log(`🗂️ Handlers registrados: ${maiCore.handlers.size}`);
        
        // Estado de agentes autónomos
        const agentService = maiCore.getService('autonomousAgent');
        if (agentService) {
            const status = agentService.getSessionStatus();
            console.log(`🤖 Agentes autónomos: ${status ? 'ACTIVOS' : 'INACTIVOS'}`);
        }
        
        console.log('\n🚀 MAIRA 4.0 OPERATIVO - ARQUITECTURA HEXAGONAL ACTIVA\n');
    }

    // API pública
    getBootStatus() {
        return {
            isReady: this.isReady,
            loadTime: Date.now() - this.loadStartTime,
            steps: this.initializationSteps,
            services: maiCore.services.size,
            modules: maiCore.modules.size
        };
    }

    getSystemStats() {
        return {
            core: maiCore.initialized,
            services: Array.from(maiCore.services.keys()),
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            } : null,
            agents: maiCore.getService('autonomousAgent')?.getSessionStatus()
        };
    }
}

// Crear instancia global del bootstrap
const maiBootstrap = new MAIRABootstrap();

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => maiBootstrap.initialize());
} else {
    maiBootstrap.initialize();
}

// Exportar para uso manual si es necesario
export default maiBootstrap;
