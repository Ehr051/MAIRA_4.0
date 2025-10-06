/**
 * VegetationService - Servicio para obtener NDVI de vegetación
 * ✅ SIMPLIFICADO: Solo usa análisis de imagen satelital
 */
class VegetationService {
    constructor() {
        this.initialized = false;
        this.satelliteAnalyzer = null;
        this.stats = {
            fromSatellite: 0,
            notFound: 0
        };
        
        console.log('🌿 VegetationService inicializado (solo análisis satelital)');
    }
    
    /**
     * Inicializar servicio
     * @param {boolean} useTIF - IGNORADO (ya no se usa TIF)
     * @param {object} satelliteAnalyzer - Analizador satelital (REQUERIDO)
     */
    async initialize(useTIF = false, satelliteAnalyzer = null) {
        this.satelliteAnalyzer = satelliteAnalyzer;
        
        if (!satelliteAnalyzer) {
            console.warn('⚠️ VegetationService sin SatelliteAnalyzer - vegetación deshabilitada');
            this.initialized = false;
            return;
        }
        
        this.initialized = true;
        console.log(`✅ VegetationService listo (Satellite Analyzer: ${!!satelliteAnalyzer})`);
    }
    
    /**
     * ✅ SIMPLIFICADO: Obtener NDVI solo desde análisis de imagen satelital
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @param {number} normX - Coordenada X normalizada (0-1) en el terreno
     * @param {number} normY - Coordenada Y normalizada (0-1) en el terreno
     * @returns {Promise<Object>} { ndvi, vegType, source, featureType } o null
     */
    async getNDVI(lat, lon, normX = null, normY = null) {
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
