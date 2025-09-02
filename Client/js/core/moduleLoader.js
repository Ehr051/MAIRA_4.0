/**
 * 🏗️ CORE MODULE LOADER - MAIRA 4.0
 * Sistema de carga optimizada con arquitectura hexagonal
 * Carga módulos en orden de dependencias y optimiza rendimiento
 */

class CoreModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.dependencies = new Map();
        this.performanceMetrics = {
            startTime: performance.now(),
            loadTimes: {},
            errors: []
        };
        
        this.setupDependencies();
    }
    
    setupDependencies() {
        // Definir dependencias entre módulos
        this.dependencies.set('utils', []);
        this.dependencies.set('common', ['utils']);
        this.dependencies.set('handlers', ['common', 'utils']);
        this.dependencies.set('workers', ['handlers', 'common']);
        this.dependencies.set('modules', ['handlers', 'workers', 'common']);
    }
    
    async loadModuleCategory(category) {
        if (this.loadedModules.has(category)) {
            return true;
        }
        
        if (this.loadingPromises.has(category)) {
            return this.loadingPromises.get(category);
        }
        
        const loadPromise = this._loadCategoryModules(category);
        this.loadingPromises.set(category, loadPromise);
        
        try {
            await loadPromise;
            this.loadedModules.add(category);
            console.log(`✅ ${category} modules loaded successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Error loading ${category} modules:`, error);
            this.performanceMetrics.errors.push({ category, error: error.message });
            return false;
        }
    }
    
    async _loadCategoryModules(category) {
        const startTime = performance.now();
        
        // Cargar dependencias primero
        const deps = this.dependencies.get(category) || [];
        for (const dep of deps) {
            await this.loadModuleCategory(dep);
        }
        
        // Cargar módulos de la categoría
        const modules = this._getModulesForCategory(category);
        const loadPromises = modules.map(module => this._loadScript(module.path));
        
        await Promise.all(loadPromises);
        
        const loadTime = performance.now() - startTime;
        this.performanceMetrics.loadTimes[category] = loadTime;
        
        console.log(`⚡ ${category} loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    _getModulesForCategory(category) {
        const moduleMap = {
            utils: [
                { path: 'Client/js/utils/mathUtils.js', name: 'Math Utilities' },
                { path: 'Client/js/utils/geoUtils.js', name: 'Geographic Utilities' },
                { path: 'Client/js/utils/cacheUtils.js', name: 'Cache Utilities' }
            ],
            common: [
                { path: 'Client/js/common/config.js', name: 'Configuration' },
                { path: 'Client/js/common/constants.js', name: 'Constants' },
                { path: 'Client/js/common/events.js', name: 'Event System' }
            ],
            handlers: [
                { path: 'Client/js/handlers/elevationHandler.js', name: 'Elevation Handler' },
                { path: 'Client/js/handlers/vegetacionhandler.js', name: 'Vegetation Handler' }
            ],
            workers: [
                { path: 'Client/js/workers/elevation.worker.js', name: 'Elevation Worker' },
                { path: 'Client/js/workers/vegetation.worker.js', name: 'Vegetation Worker' }
            ],
            modules: [
                { path: 'Client/js/modules/map3d.js', name: '3D Map Module' },
                { path: 'Client/js/modules/transitabilidad.js', name: 'Transitability Module' }
            ]
        };
        
        return moduleMap[category] || [];
    }
    
    async _loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }
    
    async initializeMAIRA() {
        console.log('🚀 Initializing MAIRA 4.0 Core System...');
        
        try {
            // Cargar en orden de dependencias
            await this.loadModuleCategory('utils');
            await this.loadModuleCategory('common');
            await this.loadModuleCategory('handlers');
            await this.loadModuleCategory('workers');
            await this.loadModuleCategory('modules');
            
            // Inicializar sistema MAIRA
            await this._initializeMAIRAComponents();
            
            const totalTime = performance.now() - this.performanceMetrics.startTime;
            console.log(`🎉 MAIRA 4.0 initialized successfully in ${totalTime.toFixed(2)}ms`);
            
            this._reportPerformanceMetrics();
            
        } catch (error) {
            console.error('💥 MAIRA initialization failed:', error);
            throw error;
        }
    }
    
    async _initializeMAIRAComponents() {
        // Inicializar componentes en orden
        if (window.MAIRA) {
            if (window.MAIRA.Elevacion?.inicializar) {
                await window.MAIRA.Elevacion.inicializar();
            }
            
            if (window.MAIRA.Vegetacion?.inicializar) {
                await window.MAIRA.Vegetacion.inicializar();
            }
            
            if (window.MAIRA.Map3D?.inicializar) {
                await window.MAIRA.Map3D.inicializar();
            }
        }
    }
    
    _reportPerformanceMetrics() {
        console.group('📊 MAIRA Performance Report');
        console.log('Load Times by Category:');
        Object.entries(this.performanceMetrics.loadTimes).forEach(([category, time]) => {
            console.log(`  ${category}: ${time.toFixed(2)}ms`);
        });
        
        if (this.performanceMetrics.errors.length > 0) {
            console.warn('Errors encountered:', this.performanceMetrics.errors);
        }
        console.groupEnd();
    }
    
    getSystemStatus() {
        return {
            loadedModules: Array.from(this.loadedModules),
            loadTimes: this.performanceMetrics.loadTimes,
            errors: this.performanceMetrics.errors,
            totalInitTime: performance.now() - this.performanceMetrics.startTime
        };
    }
}

// Instancia global del loader
window.MAIRACore = new CoreModuleLoader();

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.MAIRACore.initializeMAIRA();
        console.log('🎯 MAIRA 4.0 ready for operations');
        
        // Disparar evento personalizado para notificar que MAIRA está listo
        window.dispatchEvent(new CustomEvent('MAIRAReady', {
            detail: window.MAIRACore.getSystemStatus()
        }));
        
    } catch (error) {
        console.error('🚨 MAIRA initialization failed:', error);
        
        // Disparar evento de error
        window.dispatchEvent(new CustomEvent('MAIRAError', {
            detail: { error: error.message, stack: error.stack }
        }));
    }
});

console.log('🏗️ MAIRA Core Module Loader initialized');
