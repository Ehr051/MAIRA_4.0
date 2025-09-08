/**
 * 🚗 TRANSITABILIDAD HANDLER - MAIRA 4.0
 * Módulo especializado para cálculo de transitabilidad militar
 * Integra datos de elevación, vegetación y pendiente para análisis táctico
 */

class TransitabilidadHandler {
    constructor() {
        this.initialized = false;
        this.cache = new Map();
        this.maxCacheSize = 100;
        
        // Configuración de transitabilidad
        this.config = {
            // Límites de pendiente para vehículos (grados)
            pendienteLimites: {
                infanteria: 45,
                vehiculosLigeros: 30,
                vehiculosPesados: 20,
                blindados: 25,
                artilleria: 15
            },
            
            // Factores de vegetación
            vegetacionFactores: {
                'Agua/Nieve': 0.1,
                'Suelo desnudo/Roca': 0.9,
                'Vegetación muy escasa': 0.8,
                'Vegetación escasa': 0.7,
                'Vegetación moderada': 0.5,
                'Vegetación densa': 0.3,
                'Vegetación muy densa': 0.2,
                'Vegetación extrema': 0.1
            },
            
            // Velocidades base (km/h)
            velocidadesBase: {
                infanteria: 4,
                vehiculosLigeros: 40,
                vehiculosPesados: 25,
                blindados: 30,
                artilleria: 20
            }
        };
        
        console.log('🚗 TransitabilidadHandler inicializado');
    }
    
    /**
     * Inicializar el handler
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Verificar que los handlers de elevación y vegetación estén disponibles
            if (typeof window.elevationHandler === 'undefined') {
                console.warn('⚠️ ElevationHandler no disponible');
            }
            
            if (typeof window.vegetationHandler === 'undefined') {
                console.warn('⚠️ VegetationHandler no disponible');
            }
            
            this.initialized = true;
            console.log('✅ TransitabilidadHandler inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando TransitabilidadHandler:', error);
            throw error;
        }
    }
    
    /**
     * Calcular transitabilidad para una coordenada específica
     */
    async calcularTransitabilidad(lat, lng, tipoUnidad = 'infanteria') {
        if (!this.initialized) {
            await this.initialize();
        }
        
        const cacheKey = `${lat}_${lng}_${tipoUnidad}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Obtener datos base
            const [elevationData, vegetationData, pendienteData] = await Promise.all([
                this.obtenerElevacion(lat, lng),
                this.obtenerVegetacion(lat, lng),
                this.obtenerPendiente(lat, lng)
            ]);
            
            // Calcular factores de transitabilidad
            const factores = this.calcularFactores(elevationData, vegetationData, pendienteData, tipoUnidad);
            
            // Calcular transitabilidad final
            const resultado = this.calcularTransitabilidadFinal(factores, tipoUnidad);
            
            // Guardar en cache
            this.guardarEnCache(cacheKey, resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error calculando transitabilidad:', error);
            return this.crearResultadoError(error.message);
        }
    }
    
    /**
     * Obtener datos de elevación
     */
    async obtenerElevacion(lat, lng) {
        try {
            if (window.elevationHandler && typeof window.elevationHandler.getElevation === 'function') {
                return await window.elevationHandler.getElevation(lat, lng);
            }
            
            // Fallback si no está disponible
            return { elevation: null, error: 'ElevationHandler no disponible' };
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo elevación:', error);
            return { elevation: null, error: error.message };
        }
    }
    
    /**
     * Obtener datos de vegetación
     */
    async obtenerVegetacion(lat, lng) {
        try {
            if (window.vegetationHandler && typeof window.vegetationHandler.getVegetation === 'function') {
                return await window.vegetationHandler.getVegetation(lat, lng);
            }
            
            // Fallback si no está disponible
            return { ndvi: null, vegetationLevel: 'Sin datos', error: 'VegetationHandler no disponible' };
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo vegetación:', error);
            return { ndvi: null, vegetationLevel: 'Sin datos', error: error.message };
        }
    }
    
    /**
     * Obtener datos de pendiente
     */
    async obtenerPendiente(lat, lng) {
        try {
            if (window.pendienteHandler && typeof window.pendienteHandler.getPendiente === 'function') {
                return await window.pendienteHandler.getPendiente(lat, lng);
            }
            
            // Calcular pendiente aproximada usando elevación cercana
            return await this.calcularPendienteAproximada(lat, lng);
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo pendiente:', error);
            return { pendiente: 0, error: error.message };
        }
    }
    
    /**
     * Calcular pendiente aproximada
     */
    async calcularPendienteAproximada(lat, lng) {
        try {
            const delta = 0.001; // ~100m
            
            const elevaciones = await Promise.all([
                this.obtenerElevacion(lat, lng),
                this.obtenerElevacion(lat + delta, lng),
                this.obtenerElevacion(lat - delta, lng),
                this.obtenerElevacion(lat, lng + delta),
                this.obtenerElevacion(lat, lng - delta)
            ]);
            
            if (!elevaciones.every(e => e.elevation !== null)) {
                return { pendiente: 0, error: 'Datos de elevación insuficientes' };
            }
            
            const [centro, norte, sur, este, oeste] = elevaciones.map(e => e.elevation);
            
            const deltaX = (este - oeste) / (2 * delta * 111000); // metros por grado
            const deltaY = (norte - sur) / (2 * delta * 111000);
            
            const pendienteRadianes = Math.atan(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const pendienteGrados = pendienteRadianes * (180 / Math.PI);
            
            return {
                pendiente: Math.round(pendienteGrados * 100) / 100,
                direccion: Math.atan2(deltaY, deltaX) * (180 / Math.PI)
            };
            
        } catch (error) {
            console.warn('⚠️ Error calculando pendiente aproximada:', error);
            return { pendiente: 0, error: error.message };
        }
    }
    
    /**
     * Calcular factores de transitabilidad
     */
    calcularFactores(elevationData, vegetationData, pendienteData, tipoUnidad) {
        const factores = {
            pendiente: 1.0,
            vegetacion: 1.0,
            terreno: 1.0,
            total: 1.0
        };
        
        // Factor de pendiente
        if (pendienteData.pendiente !== null) {
            const pendienteLimite = this.config.pendienteLimites[tipoUnidad] || 30;
            if (pendienteData.pendiente > pendienteLimite) {
                factores.pendiente = 0.1; // Prácticamente intransitable
            } else {
                factores.pendiente = Math.max(0.1, 1 - (pendienteData.pendiente / pendienteLimite) * 0.8);
            }
        }
        
        // Factor de vegetación
        if (vegetationData.vegetationLevel && vegetationData.vegetationLevel !== 'Sin datos') {
            factores.vegetacion = this.config.vegetacionFactores[vegetationData.vegetationLevel] || 0.5;
        }
        
        // Factor de terreno (basado en elevación y tipo de suelo)
        if (elevationData.elevation !== null) {
            // Terrenos altos más difíciles para vehículos pesados
            if (tipoUnidad === 'vehiculosPesados' || tipoUnidad === 'artilleria') {
                if (elevationData.elevation > 3000) {
                    factores.terreno = 0.6;
                } else if (elevationData.elevation > 2000) {
                    factores.terreno = 0.8;
                }
            }
        }
        
        // Factor total
        factores.total = factores.pendiente * factores.vegetacion * factores.terreno;
        
        return factores;
    }
    
    /**
     * Calcular transitabilidad final
     */
    calcularTransitabilidadFinal(factores, tipoUnidad) {
        const velocidadBase = this.config.velocidadesBase[tipoUnidad] || 20;
        const velocidadEfectiva = velocidadBase * factores.total;
        
        // Clasificar transitabilidad
        let clasificacion;
        if (factores.total >= 0.8) {
            clasificacion = 'Excelente';
        } else if (factores.total >= 0.6) {
            clasificacion = 'Buena';
        } else if (factores.total >= 0.4) {
            clasificacion = 'Regular';
        } else if (factores.total >= 0.2) {
            clasificacion = 'Difícil';
        } else {
            clasificacion = 'Muy difícil';
        }
        
        return {
            success: true,
            tipoUnidad,
            clasificacion,
            factores,
            velocidadBase,
            velocidadEfectiva: Math.round(velocidadEfectiva * 100) / 100,
            factorTotal: Math.round(factores.total * 1000) / 1000,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Crear resultado de error
     */
    crearResultadoError(errorMessage) {
        return {
            success: false,
            error: errorMessage,
            clasificacion: 'Error',
            factores: { total: 0 },
            velocidadEfectiva: 0,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Guardar en cache
     */
    guardarEnCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, data);
    }
    
    /**
     * Limpiar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache de transitabilidad limpiado');
    }
    
    /**
     * Obtener estadísticas del cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            usage: (this.cache.size / this.maxCacheSize * 100).toFixed(1) + '%'
        };
    }
    
    /**
     * Calcular transitabilidad para área
     */
    async calcularTransitabilidadArea(coordenadas, tipoUnidad = 'infanteria') {
        const resultados = [];
        
        for (const coord of coordenadas) {
            try {
                const resultado = await this.calcularTransitabilidad(coord.lat, coord.lng, tipoUnidad);
                resultados.push({
                    ...resultado,
                    coordenada: coord
                });
            } catch (error) {
                resultados.push({
                    ...this.crearResultadoError(error.message),
                    coordenada: coord
                });
            }
        }
        
        return {
            success: true,
            tipoUnidad,
            resultados,
            resumen: this.generarResumenArea(resultados)
        };
    }
    
    /**
     * Generar resumen de área
     */
    generarResumenArea(resultados) {
        const total = resultados.length;
        const exitosos = resultados.filter(r => r.success).length;
        
        const clasificaciones = {};
        resultados.forEach(r => {
            if (r.success) {
                clasificaciones[r.clasificacion] = (clasificaciones[r.clasificacion] || 0) + 1;
            }
        });
        
        const velocidadPromedio = resultados
            .filter(r => r.success && r.velocidadEfectiva)
            .reduce((sum, r, _, arr) => sum + r.velocidadEfectiva / arr.length, 0);
        
        return {
            total,
            exitosos,
            errorCount: total - exitosos,
            clasificaciones,
            velocidadPromedio: Math.round(velocidadPromedio * 100) / 100
        };
    }
}

// Crear instancia global
window.transitabilidadHandler = new TransitabilidadHandler();

// Exportar funciones críticas al scope global
window.analizarTransitabilidad = (puntos, tipoVehiculo) => window.transitabilidadHandler.analizarTransitabilidad(puntos, tipoVehiculo);
window.calcularRutaOptima = (inicio, fin, opciones) => window.transitabilidadHandler.calcularRutaOptima(inicio, fin, opciones);
window.evaluarPuntoTransitabilidad = (lat, lng, vehiculo) => window.transitabilidadHandler.evaluarPuntoTransitabilidad(lat, lng, vehiculo);
window.obtenerFactorTransitabilidad = (elevacion, vegetacion, pendiente, vehiculo) => 
    window.transitabilidadHandler.obtenerFactorTransitabilidad(elevacion, vegetacion, pendiente, vehiculo);

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.transitabilidadHandler.initialize();
    });
} else {
    window.transitabilidadHandler.initialize();
}

console.log('🚗 TransitabilidadHandler cargado y funciones exportadas al scope global');
