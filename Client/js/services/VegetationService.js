/**
 * ═══════════════════════════════════════════════════════════════════════
 * VEGETATION SERVICE - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Servicio de vegetación optimizado con workers
 * Hereda de GeospatialDataService para funcionalidad común
 * 
 * @extends GeospatialDataService
 * @version 2.0.0
 * @author MAIRA Team
 * @date 2025-01-09
 */

class VegetationService extends GeospatialDataService {
    constructor(config = {}) {
        super({
            cacheTimeout: 600000, // 10 minutos
            maxCacheSize: 500,
            debug: config.debug || false,
            ...config
        });
        
        this.satelliteAnalyzer = null;
        this.vegetationHandler = null;
        this.stats = {
            ...this.stats,
            fromSatellite: 0,
            fromTiles: 0,
            notFound: 0
        };
        
        this._log('info', '🌿 VegetationService construido');
    }
    
    /**
     * Inicializar servicio
     * @param {object} satelliteAnalyzer - Analizador satelital (REQUERIDO)
     * @param {boolean} useTiles - Usar tiles NDVI (opcional, fallback a satellite)
     */
    async initialize(satelliteAnalyzer = null, useTiles = false) {
        if (this.initialized) return;
        
        this._log('info', 'Inicializando VegetationService...');
        
        // Inicializar base (workers, cache)
        await super.initialize();
        
        this.satelliteAnalyzer = satelliteAnalyzer;
        
        if (!satelliteAnalyzer) {
            this._log('warn', '⚠️ VegetationService sin SatelliteAnalyzer - vegetación limitada');
        } else {
            this._log('info', '✅ SatelliteAnalyzer conectado');
        }
        
        // Conectar con vegetation handler global si existe
        if (useTiles && typeof window.vegetationHandler !== 'undefined') {
            this.vegetationHandler = window.vegetationHandler;
            this._log('info', '✅ VegetationHandler tiles conectado');
        }
        
        this.initialized = true;
        this._log('info', `✅ VegetationService listo (Satellite: ${!!satelliteAnalyzer}, Tiles: ${!!this.vegetationHandler}, Workers: ${this.config.useWorkers})`);
    }
    
    
    // ═══════════════════════════════════════════════════════════════════
    // IMPLEMENTACIÓN MÉTODOS ABSTRACTOS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Path al worker de vegetación
     */
    getWorkerScriptPath() {
        return 'Client/js/workers/vegetation.worker.js';
    }
    
    /**
     * Obtener información del tile NDVI para coordenadas
     */
    getTileInfo(lat, lon) {
        // Si tenemos vegetation handler, usarlo
        if (this.vegetationHandler) {
            return this.vegetationHandler.getTileForCoordinates(lat, lon);
        }
        
        // Fallback: generar tile info basado en coordenadas
        const tileX = Math.floor((lon + 180) / this.config.resolution);
        const tileY = Math.floor((lat + 90) / this.config.resolution);
        
        return {
            key: `vegetation_${tileX}_${tileY}`,
            filename: `vegetation_ndvi_${tileX}_${tileY}.tif`,
            bounds: {
                south: lat - this.config.resolution,
                north: lat + this.config.resolution,
                west: lon - this.config.resolution,
                east: lon + this.config.resolution
            },
            url: null, // Satellite fallback
            satellite: true
        };
    }
    
    /**
     * Procesar datos crudos del tile NDVI
     */
    processRawData(rawData, tileInfo) {
        // Si es satellite fallback, no hay datos de tile
        if (tileInfo.satellite) {
            return null;
        }
        
        // TODO: Implementar parser GeoTIFF NDVI real
        // Por ahora, asumir que rawData ya está procesado
        return rawData;
    }
    
    /**
     * Extraer NDVI específico de tile cargado
     */
    _extractDataFromTile(tileData, lat, lon, tileInfo) {
        if (!tileData || tileInfo.satellite) {
            // Fallback a satellite analyzer
            return this.getNDVIFromSatelliteImage(lat, lon);
        }
        
        // Interpolación bilinear en grid NDVI
        const bounds = tileInfo.bounds;
        const width = tileData.width || 256;
        const height = tileData.height || 256;
        
        // Normalizar coordenadas
        const normX = (lon - bounds.west) / (bounds.east - bounds.west);
        const normY = (lat - bounds.south) / (bounds.north - bounds.south);
        
        const pixelX = Math.floor(normX * (width - 1));
        const pixelY = Math.floor(normY * (height - 1));
        
        // Validar bounds
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
            return null;
        }
        
        // Extraer NDVI del array
        const index = pixelY * width + pixelX;
        const ndvi = tileData.data ? tileData.data[index] : null;
        
        return ndvi !== undefined && !isNaN(ndvi) ? ndvi : null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener NDVI para un punto (implementación getData abstracto)
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Promise<Object>} { ndvi, vegType, source, featureType } o null
     */
    async getData(lat, lon) {
        return await this.getNDVI(lat, lon);
    }
        if (!this.initialized) {
            console.warn('⚠️ VegetationService no inicializado');
            return null;
        }
        
        if (!this.satelliteAnalyzer) {
            console.warn('⚠️ Sin SatelliteAnalyzer');
            return null;
        }
        
        if (normX === null || normY === null) {
            console.warn('⚠️ normX o normY no proporcionados');
            return null;
        }
        
        try {
            // ✅ Obtener NDVI de imagen satelital
            const result = await this.getNDVIFromSatelliteImage(normX, normY);
            
            if (result !== null) {
                this.stats.fromSatellite++;
                
                // Clasificar usando feature type si disponible
                const vegType = result.featureType 
                    ? this.classifyFromFeatureType(result.featureType, result.ndvi)
                    : this.classifyVegetationType(result.ndvi);
                
                // Debug ocasional
                if (Math.random() < 0.005) {
                    console.debug(`🛰️ NDVI=${result.ndvi.toFixed(3)} → ${vegType || 'sin veg'} [${result.featureType}] en (${normX.toFixed(3)}, ${normY.toFixed(3)})`);
                }
                
                return { 
                    ndvi: result.ndvi, 
                    vegType, 
                    source: 'satellite', 
                    featureType: result.featureType 
                };
            }
            
            // No se encontró vegetación en esa posición
            this.stats.notFound++;
            return null;
            
        } catch (error) {
            console.debug('Error obteniendo NDVI de imagen:', error);
            this.stats.notFound++;
            return null;
        }
    }

    /**
     * ✅ Obtener NDVI desde análisis de imagen satelital
     * Usa los píxeles clasificados por SatelliteAnalyzer
     * ⚠️ IMPORTANTE: Considera el aspect ratio real de la imagen
     */
    async getNDVIFromSatelliteImage(normX, normY) {
        if (!this.satelliteAnalyzer) {
            return null;
        }
        
        try {
            // Obtener features del analizador satelital
            const features = this.satelliteAnalyzer.getFeatures();
            
            // ✅ CRÍTICO: Obtener dimensiones REALES del canvas (con aspect ratio correcto)
            const width = this.satelliteAnalyzer.canvas?.width || 512;
            const height = this.satelliteAnalyzer.canvas?.height || 512;
            
            // ✅ FIX: Usar (width - 1) para evitar pixelX = width (fuera de bounds)
            // normX = 1.0 → pixelX = width - 1 (último píxel válido)
            const pixelX = Math.floor(normX * (width - 1));
            const pixelY = Math.floor(normY * (height - 1));
            
            // Debug ocasional para verificar mapeo
            if (Math.random() < 0.001) {
                console.debug(`📍 Mapeo: norm(${normX.toFixed(3)}, ${normY.toFixed(3)}) → pixel(${pixelX}, ${pixelY}) en canvas ${width}x${height}`);
            }
            
            // Validar que las coordenadas estén dentro de la imagen
            if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
                console.debug(`⚠️ Coordenadas fuera de imagen: pixel(${pixelX}, ${pixelY}) en canvas ${width}x${height}`);
                return null;
            }
            
            // ✅ OPTIMIZACIÓN: Usar índice espacial si está disponible (100x más rápido)
            let nearbyFeatures;
            
            if (this.satelliteAnalyzer.spatialIndex) {
                // Búsqueda O(log n) con índice espacial
                nearbyFeatures = this.satelliteAnalyzer.spatialIndex.queryRadius(pixelX, pixelY, 10);
            } else {
                // Fallback: Búsqueda lineal O(n)
                const features = this.satelliteAnalyzer.getFeatures();
                nearbyFeatures = features.filter(f =>
                    Math.abs(f.x - pixelX) < 10 && 
                    Math.abs(f.y - pixelY) < 10
                );
            }
            
            // Buscar feature más cercana
            if (nearbyFeatures.length > 0) {
                // Ordenar por distancia (más cercano primero)
                nearbyFeatures.sort((a, b) => {
                    const distA = Math.abs(a.x - pixelX) + Math.abs(a.y - pixelY);
                    const distB = Math.abs(b.x - pixelX) + Math.abs(b.y - pixelY);
                    return distA - distB;
                });
                
                const nearest = nearbyFeatures[0];
                
                // Si está muy cerca (< 2px), usar ese feature directamente
                if (Math.abs(nearest.x - pixelX) < 2 && Math.abs(nearest.y - pixelY) < 2) {
                    return {
                        ndvi: this.featureTypeToNDVI(nearest.type),
                        featureType: nearest.type
                    };
                }
                
                // Si hay varios features cercanos, promediar NDVI
                const ndvis = nearbyFeatures.map(f => this.featureTypeToNDVI(f.type));
                const avgNdvi = ndvis.reduce((a, b) => a + b, 0) / ndvis.length;
                
                // Encontrar tipo más común
                const typeCounts = {};
                nearbyFeatures.forEach(f => {
                    typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
                });
                const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
                    typeCounts[a] > typeCounts[b] ? a : b
                );
                
                return {
                    ndvi: avgNdvi,
                    featureType: mostCommonType
                };
            }
            
            // No se encontró vegetación en esa área
            return null;
            
        } catch (error) {
            console.debug('Error en getNDVIFromSatelliteImage:', error);
            return null;
        }
    }
    
    /**
     * ✅ Convertir tipo de feature a NDVI estimado
     */
    featureTypeToNDVI(featureType) {
        const ndviMap = {
            'vegetation': 0.60,
            'forest': 0.75,
            'grass': 0.30,
            'crops': 0.65,
            'water': 0.0,
            'roads': 0.1,
            'buildings': 0.15,
            'bare_soil': 0.2,
            'urban': 0.15
        };
        
        return ndviMap[featureType] || 0.3;
    }
    
    /**
     * 🔥 Clasificar tipo de vegetación desde feature type directamente
     */
    classifyFromFeatureType(featureType, ndvi) {
        const typeMap = {
            'grass': 'grass',
            'forest': 'tree_tall',
            'vegetation': 'bush',
            'crops': 'bush',
        };
        
        if (typeMap[featureType]) {
            return typeMap[featureType];
        }
        
        return this.classifyVegetationType(ndvi);
    }
    
    /**
     * Clasificar tipo de vegetación desde NDVI
     */
    classifyVegetationType(ndvi) {
        if (ndvi < 0.15) return null;
        if (ndvi < 0.35) return 'grass';
        if (ndvi < 0.55) return 'bush';
        if (ndvi < 0.70) return 'tree_medium';
        return 'tree_tall';
    }
    
    /**
     * ✅ Obtener estadísticas
     */
    getStats() {
        const total = this.stats.fromSatellite + this.stats.notFound;
        
        return {
            total,
            fromSatellite: this.stats.fromSatellite,
            notFound: this.stats.notFound,
            percentages: {
                satellite: total > 0 ? (this.stats.fromSatellite / total * 100).toFixed(1) : 0,
                notFound: total > 0 ? (this.stats.notFound / total * 100).toFixed(1) : 0
            }
        };
    }
    
    /**
     * ✅ Reset de estadísticas
     */
    resetStats() {
        this.stats = {
            fromSatellite: 0,
            notFound: 0
        };
    }
}

// ✅ Exportar para Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetationService;
}

// ✅ Registrar globalmente para uso en navegador
if (typeof window !== 'undefined') {
    window.VegetationService = VegetationService;
    console.log('✅ VegetationService registrado globalmente');
}
