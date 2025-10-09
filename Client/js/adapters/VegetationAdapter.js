/**
 * VEGETATION ADAPTER - MAIRA 4.0
 * Adapter de compatibilidad para vegetationHandler legacy
 * 
 * Mantiene la API pública original de vegetationHandler
 * mientras usa el nuevo VegetationService optimizado por dentro
 * 
 * @version 1.0.0
 * @date 2025-01-09
 * @author MAIRA Team
 * 
 * PROPÓSITO:
 * - Permitir migración gradual sin romper código existente
 * - Mantener 100% compatibilidad con APIs legacy
 * - Habilitar workers y optimizaciones por dentro
 * 
 * APIs MANTENIDAS:
 * - getVegetationInfo(lat, lon)
 * - getNDVI(lat, lon, normX, normY)
 * - getTileForCoordinates(lat, lon)
 * - clearCache()
 * - cargarDatosVegetacion(bounds)
 * - cargarSubTileVegetacion(subTile)
 * - calcularSubTilesVegetacion(bounds)
 */

class VegetationAdapter {
    constructor(vegetationService) {
        if (!vegetationService) {
            throw new Error('VegetationAdapter requiere un VegetationService');
        }
        
        this.service = vegetationService;
        this.initialized = false;
        
        console.log('✅ VegetationAdapter creado (wrapping VegetationService optimizado)');
    }
    
    /**
     * Inicializar el adapter
     */
    async initialize(satelliteAnalyzer = null) {
        if (this.initialized) return;
        
        // Inicializar service con satellite analyzer
        if (!this.service.initialized) {
            await this.service.initialize(satelliteAnalyzer);
        }
        
        this.initialized = true;
        console.log('✅ VegetationAdapter inicializado');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // APIs LEGACY MANTENIDAS (CalculoMarcha, miradial, etc.)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * ✅ LEGACY API: Obtener información de vegetación
     * Usado en: CalculoMarcha.js línea 180, miradial.js líneas 1132, 1582
     */
    async getVegetationInfo(lat, lon) {
        return await this.service.getVegetationInfo(lat, lon);
    }
    
    /**
     * ✅ LEGACY API: Obtener NDVI
     * Usado en: TerrainGenerator3D.js líneas 316-319
     * IMPORTANTE: Mantiene firma de 4 parámetros (normX, normY opcionales)
     */
    async getNDVI(lat, lon, normX = null, normY = null) {
        return await this.service.getNDVI(lat, lon, normX, normY);
    }
    
    /**
     * ✅ LEGACY API: Obtener tile para coordenadas
     * Usado internamente por vegetationHandler
     */
    getTileForCoordinates(lat, lon) {
        return this.service.getTileInfo(lat, lon);
    }
    
    /**
     * ✅ LEGACY API: Limpiar cache
     * Usado en: performanceOptimizer.js línea 486
     */
    clearCache() {
        this.service.clearCache();
        console.log('🗑️ Cache de vegetación limpiado');
    }
    
    /**
     * ✅ LEGACY API: Cargar datos de vegetación para bounds
     * Usado en: vegetacionHandler.js
     */
    async cargarDatosVegetacion(bounds) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Pre-cargar datos para el área especificada
        if (bounds && bounds.south && bounds.north && bounds.west && bounds.east) {
            console.log('🌿 Cargando datos vegetación para bounds:', bounds);
            // TODO: Pre-cargar tiles del área (opcional)
        }
        
        return { success: true, tiles: 0 };
    }
    
    /**
     * ✅ LEGACY API: Cargar sub-tile de vegetación
     * Usado en: vegetacionHandler.js línea 575
     */
    async cargarSubTileVegetacion(subTile) {
        if (!subTile || !subTile.bounds) {
            console.warn('⚠️ cargarSubTileVegetacion: subTile inválido');
            return null;
        }
        
        const { bounds } = subTile;
        const centerLat = (bounds.south + bounds.north) / 2;
        const centerLon = (bounds.west + bounds.east) / 2;
        
        // Obtener vegetación del centro del sub-tile
        const vegInfo = await this.getVegetationInfo(centerLat, centerLon);
        
        return {
            ...subTile,
            vegetation: vegInfo,
            loaded: true
        };
    }
    
    /**
     * ✅ LEGACY API: Calcular sub-tiles de vegetación
     * Usado en: vegetacionHandler.js línea 576
     */
    calcularSubTilesVegetacion(bounds, resolution = 0.01) {
        if (!bounds || !bounds.south || !bounds.north || !bounds.west || !bounds.east) {
            console.warn('⚠️ calcularSubTilesVegetacion: bounds inválidos');
            return [];
        }
        
        const subTiles = [];
        const latStep = resolution;
        const lonStep = resolution;
        
        for (let lat = bounds.south; lat < bounds.north; lat += latStep) {
            for (let lon = bounds.west; lon < bounds.east; lon += lonStep) {
                subTiles.push({
                    bounds: {
                        south: lat,
                        north: Math.min(lat + latStep, bounds.north),
                        west: lon,
                        east: Math.min(lon + lonStep, bounds.east)
                    },
                    subX: Math.floor((lon - bounds.west) / lonStep),
                    subY: Math.floor((lat - bounds.south) / latStep),
                    loaded: false
                });
            }
        }
        
        console.log(`🌿 Calculados ${subTiles.length} sub-tiles de vegetación`);
        return subTiles;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES Y COMPATIBILIDAD
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Clasificar tipo de vegetación (acceso directo)
     */
    classifyVegetationType(ndvi) {
        return this.service.classifyVegetationType(ndvi);
    }
    
    /**
     * Obtener densidad de vegetación (acceso directo)
     */
    getVegetationDensity(ndvi) {
        return this.service.getVegetationDensity(ndvi);
    }
    
    /**
     * Obtener color NDVI (acceso directo)
     */
    getNDVIColor(ndvi) {
        return this.service.getNDVIColor(ndvi);
    }
    
    /**
     * Get stats (acceso directo para debugging)
     */
    getStats() {
        return this.service.getStats();
    }
    
    /**
     * Get cache stats (acceso directo para debugging)
     */
    getCacheStats() {
        return this.service.getCacheStats();
    }
}

// Exportar para Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetationAdapter;
}

// Registrar globalmente para uso en navegador
if (typeof window !== 'undefined') {
    window.VegetationAdapter = VegetationAdapter;
}
