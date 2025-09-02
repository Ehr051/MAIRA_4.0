/**
 * 🚀 PERFORMANCE OPTIMIZER - MAIRA 4.0
 * Optimizaciones de rendimiento para el sistema MAIRA
 * Mejora carga, memoria y procesamiento general
 */

class PerformanceOptimizer {
    constructor() {
        this.initialized = false;
        this.metrics = new Map();
        this.observers = new Map();
        
        // Configuración de optimización
        this.config = {
            // Cache inteligente
            cache: {
                maxSize: 1000,
                ttl: 300000, // 5 minutos
                enableCompression: true
            },
            
            // Lazy loading
            lazyLoading: {
                enabled: true,
                threshold: 0.1,
                rootMargin: '50px'
            },
            
            // Debounce/throttle
            timing: {
                resize: 250,
                scroll: 16,
                input: 300,
                network: 100
            },
            
            // Memoria
            memory: {
                gcInterval: 600000, // 10 minutos
                maxHeapSize: 100 * 1024 * 1024 // 100MB
            }
        };
        
        console.log('🚀 PerformanceOptimizer inicializado');
    }
    
    /**
     * Inicializar optimizaciones
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Aplicar optimizaciones DOM
            this.optimizarDOM();
            
            // Configurar lazy loading
            this.configurarLazyLoading();
            
            // Optimizar red
            this.optimizarRed();
            
            // Configurar monitoreo
            this.configurarMonitoreo();
            
            // Gestión de memoria
            this.configurarGestionMemoria();
            
            // Optimizaciones específicas de Leaflet
            this.optimizarLeaflet();
            
            this.initialized = true;
            console.log('✅ PerformanceOptimizer inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando PerformanceOptimizer:', error);
            throw error;
        }
    }
    
    /**
     * Optimizar DOM
     */
    optimizarDOM() {
        // Optimizar eventos delegados
        this.setupEventDelegation();
        
        // CSS containment para mejor rendering
        this.aplicarContainment();
        
        // Optimizar animaciones
        this.optimizarAnimaciones();
    }
    
    /**
     * Configurar delegación de eventos
     */
    setupEventDelegation() {
        // Delegación para botones
        document.addEventListener('click', this.debounce((e) => {
            if (e.target.matches('button, .btn, [role="button"]')) {
                this.handleButtonClick(e);
            }
        }, this.config.timing.input));
        
        // Delegación para inputs
        document.addEventListener('input', this.debounce((e) => {
            if (e.target.matches('input, textarea, select')) {
                this.handleInputChange(e);
            }
        }, this.config.timing.input));
    }
    
    /**
     * Aplicar CSS containment
     */
    aplicarContainment() {
        const style = document.createElement('style');
        style.textContent = `
            .map-container { contain: layout style; }
            .sidebar { contain: layout; }
            .modal { contain: layout style; }
            .panel { contain: layout; }
            .grid-item { contain: layout style; }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Optimizar animaciones
     */
    optimizarAnimaciones() {
        // Preferir transform sobre top/left
        const style = document.createElement('style');
        style.textContent = `
            .animate-transform {
                will-change: transform;
                transform: translateZ(0);
            }
            
            .animate-opacity {
                will-change: opacity;
            }
            
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Configurar lazy loading
     */
    configurarLazyLoading() {
        if (!this.config.lazyLoading.enabled || !('IntersectionObserver' in window)) {
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.cargarElementoLazy(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.config.lazyLoading.threshold,
            rootMargin: this.config.lazyLoading.rootMargin
        });
        
        this.observers.set('lazyLoad', observer);
        
        // Observar elementos lazy
        document.querySelectorAll('[data-lazy]').forEach(el => {
            observer.observe(el);
        });
    }
    
    /**
     * Cargar elemento lazy
     */
    cargarElementoLazy(element) {
        const src = element.dataset.lazy;
        const type = element.dataset.lazyType || 'image';
        
        switch (type) {
            case 'image':
                if (element.tagName === 'IMG') {
                    element.src = src;
                }
                break;
                
            case 'script':
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                document.head.appendChild(script);
                break;
                
            case 'style':
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = src;
                document.head.appendChild(link);
                break;
        }
        
        element.removeAttribute('data-lazy');
        element.removeAttribute('data-lazy-type');
    }
    
    /**
     * Optimizar red
     */
    optimizarRed() {
        // Preconnect a dominios importantes
        this.preconnect([
            'https://cdn.jsdelivr.net',
            'https://api.github.com',
            'https://cdnjs.cloudflare.com'
        ]);
        
        // Configurar service worker si está disponible
        this.configurarServiceWorker();
        
        // Optimizar fetch requests
        this.optimizarFetch();
    }
    
    /**
     * Preconnect a dominios
     */
    preconnect(domains) {
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            document.head.appendChild(link);
        });
    }
    
    /**
     * Configurar service worker
     */
    configurarServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('🔧 Service Worker registrado:', registration);
                })
                .catch(error => {
                    console.warn('⚠️ Error registrando Service Worker:', error);
                });
        }
    }
    
    /**
     * Optimizar fetch
     */
    optimizarFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Agregar cache headers por defecto
            const optimizedOptions = {
                ...options,
                headers: {
                    'Cache-Control': 'max-age=300',
                    ...options.headers
                }
            };
            
            return originalFetch(url, optimizedOptions);
        };
    }
    
    /**
     * Configurar monitoreo
     */
    configurarMonitoreo() {
        // Performance Observer
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.procesarMetrica(entry);
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            this.observers.set('performance', observer);
        }
        
        // Memory monitoring
        this.monitorearMemoria();
        
        // FPS monitoring
        this.monitorearFPS();
    }
    
    /**
     * Procesar métrica de rendimiento
     */
    procesarMetrica(entry) {
        const key = `${entry.entryType}_${entry.name}`;
        
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        
        const metricas = this.metrics.get(key);
        metricas.push({
            value: entry.duration || entry.transferSize,
            timestamp: Date.now()
        });
        
        // Mantener solo últimas 100 métricas
        if (metricas.length > 100) {
            metricas.shift();
        }
        
        // Alertar si hay problemas de rendimiento
        this.detectarProblemasRendimiento(entry);
    }
    
    /**
     * Detectar problemas de rendimiento
     */
    detectarProblemasRendimiento(entry) {
        // Recursos lentos
        if (entry.entryType === 'resource' && entry.duration > 5000) {
            console.warn(`⚠️ Recurso lento detectado: ${entry.name} (${entry.duration}ms)`);
        }
        
        // Navegación lenta
        if (entry.entryType === 'navigation' && entry.domContentLoadedEventEnd > 3000) {
            console.warn(`⚠️ Carga DOM lenta: ${entry.domContentLoadedEventEnd}ms`);
        }
    }
    
    /**
     * Monitorear memoria
     */
    monitorearMemoria() {
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                
                if (memInfo.usedJSHeapSize > this.config.memory.maxHeapSize) {
                    console.warn('⚠️ Uso de memoria alto:', {
                        used: (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
                        total: (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
                        limit: (memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
                    });
                    
                    this.forzarGarbageCollection();
                }
            }, 30000); // Cada 30 segundos
        }
    }
    
    /**
     * Monitorear FPS
     */
    monitorearFPS() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = (currentTime) => {
            frames++;
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn(`⚠️ FPS bajo detectado: ${fps}`);
                }
                
                frames = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * Configurar gestión de memoria
     */
    configurarGestionMemoria() {
        // Limpiar caches periódicamente
        setInterval(() => {
            this.limpiarCaches();
        }, this.config.memory.gcInterval);
        
        // Limpiar al cambiar de página
        window.addEventListener('beforeunload', () => {
            this.limpiarTodo();
        });
    }
    
    /**
     * Forzar garbage collection
     */
    forzarGarbageCollection() {
        // Limpiar references circulares
        this.limpiarReferenciasCirculares();
        
        // Sugerir GC si está disponible
        if (window.gc) {
            window.gc();
        }
    }
    
    /**
     * Limpiar referencias circulares
     */
    limpiarReferenciasCirculares() {
        // Limpiar event listeners huérfanos
        document.querySelectorAll('*').forEach(el => {
            if (el._leaflet_events) {
                delete el._leaflet_events;
            }
        });
    }
    
    /**
     * Optimizar Leaflet específicamente
     */
    optimizarLeaflet() {
        if (typeof L === 'undefined') return;
        
        // Configuraciones optimizadas para Leaflet
        L.Map.addInitHook(function() {
            // Reducir redraws innecesarios
            this.options.preferCanvas = true;
            this.options.updateWhenZooming = false;
            this.options.updateWhenIdle = true;
            
            // Optimizar tiles
            this.options.updateInterval = 150;
            this.options.keepBuffer = 2;
            this.options.maxZoom = 18;
        });
        
        // Optimizar markers
        if (L.Marker) {
            L.Marker.addInitHook(function() {
                this.options.riseOnHover = false;
                this.options.riseOffset = 0;
            });
        }
    }
    
    /**
     * Limpiar caches
     */
    limpiarCaches() {
        // Limpiar cache de elevación
        if (window.elevationHandler) {
            window.elevationHandler.clearCache();
        }
        
        // Limpiar cache de vegetación
        if (window.vegetationHandler) {
            window.vegetationHandler.clearCache();
        }
        
        // Limpiar cache de transitabilidad
        if (window.transitabilidadHandler) {
            window.transitabilidadHandler.clearCache();
        }
        
        // Limpiar cache de pendiente
        if (window.pendienteHandler) {
            window.pendienteHandler.clearCache();
        }
        
        console.log('🗑️ Caches limpiados');
    }
    
    /**
     * Limpiar todo
     */
    limpiarTodo() {
        this.limpiarCaches();
        this.observers.forEach(observer => observer.disconnect());
        this.metrics.clear();
        console.log('🧹 Limpieza completa realizada');
    }
    
    /**
     * Debounce utility
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle utility
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Obtener métricas de rendimiento
     */
    getMetricas() {
        const resumen = {};
        
        this.metrics.forEach((values, key) => {
            if (values.length > 0) {
                const recent = values.slice(-10);
                resumen[key] = {
                    count: values.length,
                    average: recent.reduce((sum, v) => sum + v.value, 0) / recent.length,
                    min: Math.min(...recent.map(v => v.value)),
                    max: Math.max(...recent.map(v => v.value))
                };
            }
        });
        
        return resumen;
    }
    
    /**
     * Manejar click de botón
     */
    handleButtonClick(event) {
        // Prevenir doble click
        if (event.target.disabled) return;
        
        event.target.disabled = true;
        setTimeout(() => {
            event.target.disabled = false;
        }, 300);
    }
    
    /**
     * Manejar cambio de input
     */
    handleInputChange(event) {
        // Aquí se pueden agregar validaciones optimizadas
        console.log(`Input changed: ${event.target.name || event.target.id}`);
    }
}

// Crear instancia global
window.performanceOptimizer = new PerformanceOptimizer();

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceOptimizer.initialize();
    });
} else {
    window.performanceOptimizer.initialize();
}

console.log('🚀 PerformanceOptimizer módulo cargado');
