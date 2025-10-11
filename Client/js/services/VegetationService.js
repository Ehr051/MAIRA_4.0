/**
 * VEGETATION SERVICE - Sistema optimizado de vegetación
 */

class VegetationService extends GeospatialDataService {
    constructor(config = {}) {
        super({
            cacheTimeout: config.cacheTimeout || 600000,
            maxCacheSize: config.maxCacheSize || 500,
            useWorkers: config.useWorkers !== undefined ? config.useWorkers : false,
            workerScript: config.workerScript || 'Client/js/workers/vegetation.worker.js',
            ...config
        });
        
        this.satelliteAnalyzer = null;
        this.vegetationHandler = null;
        
        this.stats = {
            total: 0,
            fromSatellite: 0,
            fromTiles: 0,
            notFound: 0
        };
    }
    
    async initialize(satelliteAnalyzerOrUseTIF, satelliteAnalyzer = null) {
        console.log('🌿 Inicializando VegetationService...');
        
        if (typeof satelliteAnalyzerOrUseTIF === 'object' && satelliteAnalyzerOrUseTIF !== null) {
            this.satelliteAnalyzer = satelliteAnalyzerOrUseTIF;
        } else if (typeof satelliteAnalyzerOrUseTIF === 'boolean') {
            this.satelliteAnalyzer = satelliteAnalyzer;
        }
        
        if (window.vegetationHandler && window.vegetationHandler !== this) {
            this.vegetationHandler = window.vegetationHandler;
            console.log('✅ VegetationHandler legacy encontrado');
        }
        
        await super.initialize();
        
        console.log('✅ VegetationService inicializado');
        return this;
    }
    
    getWorkerScriptPath() {
        return this.config.workerScript;
    }
    
    getTileInfo(lat, lon) {
        return null;
    }
    
    processRawData(rawData, tileInfo) {
        return rawData;
    }
    
    _extractDataFromTile(tileData, lat, lon, tileInfo) {
        return null;
    }
    
    async getData(lat, lon) {
        return await this.getNDVI(lat, lon);
    }
    
    async getNDVI(lat, lon, normX = null, normY = null) {
        this.stats.total++;
        
        if (!this.initialized) {
            return null;
        }
        
        if (this.satelliteAnalyzer && normX !== null && normY !== null) {
            try {
                const result = this.getNDVIFromSatelliteImageSync(normX, normY);
                
                if (result !== null) {
                    this.stats.fromSatellite++;
                    
                    const vegType = result.featureType 
                        ? this.classifyFromFeatureType(result.featureType, result.ndvi)
                        : this.classifyVegetationType(result.ndvi);
                    
                    return { 
                        ndvi: result.ndvi, 
                        vegType, 
                        source: 'satellite', 
                        featureType: result.featureType 
                    };
                }
            } catch (error) {
                console.debug('Error satellite:', error);
            }
        }
        
        if (this.vegetationHandler && typeof this.vegetationHandler.getNDVI === 'function') {
            try {
                const result = await this.vegetationHandler.getNDVI(lat, lon, normX, normY);
                
                if (result) {
                    this.stats.fromTiles++;
                    return {
                        ndvi: result.ndvi || result,
                        vegType: result.vegType || this.classifyVegetationType(result.ndvi || result),
                        source: 'tiles',
                        featureType: null
                    };
                }
            } catch (error) {
                console.debug('Error handler:', error);
            }
        }
        
        this.stats.notFound++;
        return null;
    }
    
    async getVegetationInfo(lat, lon) {
        const ndviResult = await this.getNDVI(lat, lon);
        
        if (!ndviResult || ndviResult.ndvi === null) {
            return {
                ndvi: 0,
                type: 'none',
                density: 0,
                color: '#cccccc'
            };
        }
        
        const ndvi = ndviResult.ndvi;
        const type = ndviResult.vegType || this.classifyVegetationType(ndvi);
        
        return {
            ndvi: ndvi,
            type: type,
            density: Math.round(ndvi * 100),
            color: this.getNDVIColor(ndvi)
        };
    }
    
    getNDVIFromSatelliteImageSync(normX, normY) {
        if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.features) {
            return null;
        }
        
        try {
            const features = this.satelliteAnalyzer.features;
            
            if (this.satelliteAnalyzer.spatialIndex) {
                const bbox = [normX, normY, normX, normY];
                const nearbyIndices = this.satelliteAnalyzer.spatialIndex.search(bbox);
                
                for (const idx of nearbyIndices) {
                    const feature = features[idx];
                    if (this.isPointInFeature(normX, normY, feature)) {
                        const ndvi = this.featureTypeToNDVI(feature.properties.type);
                        return {
                            ndvi: ndvi,
                            featureType: feature.properties.type
                        };
                    }
                }
            } else {
                for (const feature of features) {
                    if (this.isPointInFeature(normX, normY, feature)) {
                        const ndvi = this.featureTypeToNDVI(feature.properties.type);
                        return {
                            ndvi: ndvi,
                            featureType: feature.properties.type
                        };
                    }
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }
    
    isPointInFeature(x, y, feature) {
        if (!feature || !feature.geometry || !feature.geometry.coordinates) {
            return false;
        }
        
        const coords = feature.geometry.coordinates;
        
        if (feature.geometry.type === 'Polygon') {
            return this.pointInPolygon(x, y, coords[0]);
        } else if (feature.geometry.type === 'MultiPolygon') {
            for (const polygon of coords) {
                if (this.pointInPolygon(x, y, polygon[0])) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    pointInPolygon(x, y, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0];
            const yi = polygon[i][1];
            const xj = polygon[j][0];
            const yj = polygon[j][1];
            
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    featureTypeToNDVI(featureType) {
        const mappings = {
            'forest': 0.70,
            'dense_vegetation': 0.65,
            'vegetation': 0.50,
            'grass': 0.35,
            'sparse_vegetation': 0.25,
            'bare_soil': 0.10,
            'water': -0.20,
            'urban': 0.15
        };
        
        return mappings[featureType] || 0.30;
    }
    
    classifyFromFeatureType(featureType, ndvi) {
        if (featureType === 'forest' || featureType === 'dense_vegetation') {
            return 'tree_tall';
        } else if (featureType === 'vegetation') {
            return ndvi > 0.6 ? 'tree_medium' : 'bush';
        } else if (featureType === 'grass' || featureType === 'sparse_vegetation') {
            return 'grass';
        }
        
        return null;
    }
    
    classifyVegetationType(ndvi) {
        if (ndvi > 0.7) return 'tree_tall';
        if (ndvi > 0.5) return 'tree_medium';
        if (ndvi > 0.3) return 'bush';
        if (ndvi > 0.15) return 'grass';
        return null;
    }
    
    getNDVIColor(ndvi) {
        if (ndvi > 0.7) return '#004d00';
        if (ndvi > 0.5) return '#006600';
        if (ndvi > 0.3) return '#339933';
        if (ndvi > 0.15) return '#66cc66';
        return '#cccccc';
    }
    
    getCacheStats() {
        return {
            size: this.cache ? this.cache.size : 0,
            hits: this.stats.fromSatellite + this.stats.fromTiles,
            misses: this.stats.notFound,
            hitRate: this.stats.total > 0 ? (((this.stats.fromSatellite + this.stats.fromTiles) / this.stats.total) * 100).toFixed(1) : 0,
            ...this.stats
        };
    }
    
    getStats() {
        return {
            ...this.stats,
            percentages: {
                satellite: this.stats.total > 0 ? ((this.stats.fromSatellite / this.stats.total) * 100).toFixed(1) : 0,
                tiles: this.stats.total > 0 ? ((this.stats.fromTiles / this.stats.total) * 100).toFixed(1) : 0,
                notFound: this.stats.total > 0 ? ((this.stats.notFound / this.stats.total) * 100).toFixed(1) : 0
            }
        };
    }
    
    resetStats() {
        this.stats = { total: 0, fromSatellite: 0, fromTiles: 0, notFound: 0 };
    }
}

if (typeof window !== 'undefined') {
    window.VegetationService = VegetationService;
}
