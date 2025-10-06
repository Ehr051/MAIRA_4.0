/**
 * ElevationService - Wrapper para elevation handler con TIF
 * Proporciona interfaz simple para obtener elevaciones reales
 */
class ElevationService {
    constructor() {
        this.initialized = false;
        this.worker = null;
        this.useTIF = false; // Por defecto false hasta que se carguen TIF
        
        console.log('🗻 ElevationService inicializado');
    }
    
    /**
     * Inicializar servicio de elevación
     * @param {boolean} useTIF - Si usar archivos TIF (true) o procedural (false)
     */
    async initialize(useTIF = false) {
        this.useTIF = useTIF;
        
        if (useTIF) {
            try {
                // Verificar si elevationHandler global está disponible
                if (typeof elevationHandlerIndiceCargado !== 'undefined' && elevationHandlerIndiceCargado) {
                    console.log('✅ ElevationHandler TIF disponible');
                    this.initialized = true;
                } else {
                    console.warn('⚠️ ElevationHandler TIF no disponible, usando procedural');
                    this.useTIF = false;
                }
            } catch (error) {
                console.warn('⚠️ Error inicializando TIF:', error);
                this.useTIF = false;
            }
        }
        
        this.initialized = true;
        console.log(`✅ ElevationService listo (TIF: ${this.useTIF})`);
    }
    
    /**
     * Obtener elevación para lat/lon
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Promise<number>} Elevación en metros
     */
    async getElevation(lat, lon) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        if (this.useTIF && typeof getElevationAtLatLon === 'function') {
            try {
                // Usar función global del elevationHandler
                const elevation = await getElevationAtLatLon(lat, lon);
                return elevation !== null ? elevation : this.getProceduralElevation(lat, lon);
            } catch (error) {
                console.debug('Error obteniendo elevación TIF:', error);
                return this.getProceduralElevation(lat, lon);
            }
        }
        
        // Fallback a procedural
        return this.getProceduralElevation(lat, lon);
    }
    
    /**
     * Generar elevación procedural (fallback)
     */
    getProceduralElevation(lat, lon) {
        // Noise simple usando seno para variación realista
        const freq1 = 0.1;
        const freq2 = 0.05;
        
        const noise1 = Math.sin(lat * freq1) * Math.cos(lon * freq1) * 20;
        const noise2 = Math.sin(lat * freq2) * Math.cos(lon * freq2) * 50;
        
        return Math.max(0, noise1 + noise2);
    }
    
    /**
     * Obtener múltiples elevaciones en batch (optimizado)
     */
    async getElevationsBatch(coords) {
        const elevations = [];
        
        // TODO: Implementar batch query real para TIF
        for (const { lat, lon } of coords) {
            elevations.push(await this.getElevation(lat, lon));
        }
        
        return elevations;
    }
    
    /**
     * Verificar si un punto está dentro de cobertura TIF
     */
    isInTIFCoverage(lat, lon) {
        // Argentina aproximadamente
        return lat >= -55 && lat <= -21.5 && lon >= -73.5 && lon <= -53;
    }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.ElevationService = ElevationService;
    console.log('✅ ElevationService registrado globalmente');
}
