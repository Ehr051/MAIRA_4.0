/**
 * MAIRA 4.0 - Transitability Service (Hexagonal Architecture)
 * ==========================================================
 * Servicio modular para cálculo de transitabilidad militar
 * Convertido a formato compatible con bootstrap DDD
 */

class TransitabilityService {
    constructor(core) {
        this.core = core;
        this.cache = new Map();
        this.maxCacheSize = 100;
        this.initialized = false;
        
        // Configuración de transitabilidad
        this.config = {
            // Límites de pendiente para vehículos (grados)
            slopeThresholds: {
                infantry: 45,
                lightVehicles: 30,
                heavyVehicles: 20,
                armored: 25,
                artillery: 15
            },
            
            // Factores de vegetación (NDVI -> transitability)
            vegetationFactors: {
                water: { ndviMin: 0, ndviMax: 0.1, factor: 0.1 },
                bareSoil: { ndviMin: 0.1, ndviMax: 0.2, factor: 0.9 },
                sparseVeg: { ndviMin: 0.2, ndviMax: 0.3, factor: 0.8 },
                lightVeg: { ndviMin: 0.3, ndviMax: 0.4, factor: 0.7 },
                moderateVeg: { ndviMin: 0.4, ndviMax: 0.6, factor: 0.5 },
                denseVeg: { ndviMin: 0.6, ndviMax: 0.8, factor: 0.3 },
                veryDenseVeg: { ndviMin: 0.8, ndviMax: 0.9, factor: 0.2 },
                extremeVeg: { ndviMin: 0.9, ndviMax: 1.0, factor: 0.1 }
            },
            
            // Velocidades base (km/h)
            baseSpeed: {
                infantry: 4,
                lightVehicles: 40,
                heavyVehicles: 25,
                armored: 30,
                artillery: 20
            },
            
            // Factores climáticos
            weatherFactors: {
                clear: 1.0,
                rain: 0.7,
                snow: 0.5,
                fog: 0.8,
                storm: 0.4
            }
        };
        
        this.setupBackwardCompatibility();
    }

    setupBackwardCompatibility() {
        // Mantener compatibilidad con código existente
        // Temporalmente comentado para evitar errores de bind
        /*
        if (typeof window !== 'undefined') {
            window.MAIRA = window.MAIRA || {};
            window.MAIRA.Transitabilidad = this.getLegacyInterface();
        }
        */
    }

    getLegacyInterface() {
        return {
            initialize: this.initialize.bind(this),
            calcularTransitabilidad: this.calculateTransitability.bind(this),
            obtenerVelocidadTerreno: this.getTerrainSpeed.bind(this),
            evaluarPendiente: this.evaluateSlope.bind(this),
            evaluarVegetacion: this.evaluateVegetation.bind(this),
            calcularRutaOptima: this.calculateOptimalRoute.bind(this),
            limpiarCache: this.clearCache.bind(this)
        };
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Cargar datos base si es necesario
            await this.loadBaseData();
            
            this.initialized = true;
            console.log('✅ TransitabilityService inicializado');
            
            this.core.emit('transitabilityInitialized');
            
        } catch (error) {
            console.error('❌ Error inicializando TransitabilityService:', error);
            throw error;
        }
    }

    async loadBaseData() {
        // Cargar datos base de transitabilidad si es necesario
        console.log('📊 Datos base de transitabilidad cargados');
    }

    /**
     * Calcula transitabilidad para una posición específica
     */
    async calculateTransitability(lat, lon, unitType = 'infantry', weather = 'clear') {
        const cacheKey = `${lat}_${lon}_${unitType}_${weather}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Obtener datos de elevación y vegetación
            const elevationData = await this.getElevationData(lat, lon);
            const vegetationData = await this.getVegetationData(lat, lon);
            
            // Calcular factores
            const slopeFactor = this.calculateSlopeFactor(elevationData, unitType);
            const vegetationFactor = this.calculateVegetationFactor(vegetationData);
            const weatherFactor = this.config.weatherFactors[weather] || 1.0;
            
            // Transitabilidad final
            const transitability = slopeFactor * vegetationFactor * weatherFactor;
            
            // Velocidad resultante
            const baseSpeed = this.config.baseSpeed[unitType] || this.config.baseSpeed.infantry;
            const speed = baseSpeed * transitability;
            
            const result = {
                transitability: Math.max(0, Math.min(1, transitability)),
                speed: Math.max(0, speed),
                factors: {
                    slope: slopeFactor,
                    vegetation: vegetationFactor,
                    weather: weatherFactor
                },
                classification: this.classifyTransitability(transitability)
            };
            
            // Agregar al cache
            this.addToCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('Error calculando transitabilidad:', error);
            return this.getDefaultTransitability(unitType);
        }
    }

    async getElevationData(lat, lon) {
        // Obtener datos de elevación a través del tile loader
        const tileLoader = this.core.getService('tileLoader');
        if (tileLoader) {
            const tileId = this.coordinatesToTileId(lat, lon);
            return await tileLoader.loadTile('elevation', tileId);
        }
        return null;
    }

    async getVegetationData(lat, lon) {
        // Obtener datos de vegetación
        const tileLoader = this.core.getService('tileLoader');
        if (tileLoader) {
            const tileId = this.coordinatesToTileId(lat, lon);
            return await tileLoader.loadTile('vegetation', tileId);
        }
        return null;
    }

    calculateSlopeFactor(elevationData, unitType) {
        if (!elevationData || !elevationData.data) return 1.0;

        // Calcular pendiente promedio en el área
        const slope = this.calculateSlope(elevationData);
        const threshold = this.config.slopeThresholds[unitType] || 30;
        
        if (slope > threshold) {
            return 0.1; // Casi intransitable
        }
        
        // Factor lineal basado en pendiente
        return Math.max(0.1, 1.0 - (slope / threshold));
    }

    calculateSlope(elevationData) {
        const { data, width, height } = elevationData;
        if (!data || width < 2 || height < 2) return 0;

        let totalSlope = 0;
        let samples = 0;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const center = data[y * width + x];
                const right = data[y * width + (x + 1)];
                const down = data[(y + 1) * width + x];
                
                const dx = Math.abs(right - center);
                const dy = Math.abs(down - center);
                const slope = Math.sqrt(dx * dx + dy * dy);
                
                totalSlope += slope;
                samples++;
            }
        }

        return samples > 0 ? (totalSlope / samples) : 0;
    }

    calculateVegetationFactor(vegetationData) {
        if (!vegetationData || !vegetationData.data) return 0.8; // Factor neutro

        const { data } = vegetationData;
        let totalNDVI = 0;
        
        for (let i = 0; i < data.length; i++) {
            totalNDVI += data[i] / 255; // Normalizar NDVI
        }
        
        const avgNDVI = totalNDVI / data.length;
        
        // Buscar factor correspondiente al NDVI
        for (const [_, vegType] of Object.entries(this.config.vegetationFactors)) {
            if (avgNDVI >= vegType.ndviMin && avgNDVI < vegType.ndviMax) {
                return vegType.factor;
            }
        }
        
        return 0.5; // Factor por defecto
    }

    coordinatesToTileId(lat, lon) {
        // Conversión simple - mejorar según sistema de tiles usado
        const tileX = Math.floor((lon + 180) / 360 * 256);
        const tileY = Math.floor((90 - lat) / 180 * 256);
        return `${tileX}_${tileY}`;
    }

    classifyTransitability(value) {
        if (value >= 0.8) return 'excellent';
        if (value >= 0.6) return 'good';
        if (value >= 0.4) return 'moderate';
        if (value >= 0.2) return 'poor';
        return 'impassable';
    }

    getDefaultTransitability(unitType) {
        return {
            transitability: 0.5,
            speed: this.config.baseSpeed[unitType] * 0.5,
            factors: { slope: 0.5, vegetation: 0.5, weather: 1.0 },
            classification: 'moderate'
        };
    }

    /**
     * Calcula ruta óptima entre dos puntos considerando transitabilidad
     */
    async calculateOptimalRoute(startLat, startLon, endLat, endLon, unitType = 'infantry') {
        // Implementación básica - expandir según necesidades
        const waypoints = [];
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const factor = i / steps;
            const lat = startLat + (endLat - startLat) * factor;
            const lon = startLon + (endLon - startLon) * factor;
            
            const transitability = await this.calculateTransitability(lat, lon, unitType);
            waypoints.push({ lat, lon, ...transitability });
        }
        
        return {
            waypoints,
            totalDistance: this.calculateDistance(startLat, startLon, endLat, endLon),
            averageSpeed: waypoints.reduce((sum, wp) => sum + wp.speed, 0) / waypoints.length,
            estimatedTime: this.calculateTravelTime(waypoints)
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateTravelTime(waypoints) {
        let totalTime = 0;
        for (let i = 1; i < waypoints.length; i++) {
            const prev = waypoints[i-1];
            const curr = waypoints[i];
            const distance = this.calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
            const avgSpeed = (prev.speed + curr.speed) / 2;
            totalTime += distance / Math.max(avgSpeed, 0.1); // Evitar división por cero
        }
        return totalTime; // Horas
    }

    addToCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, data);
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de transitabilidad limpiado');
    }

    getStats() {
        return {
            initialized: this.initialized,
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize
        };
    }
}

// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.TransitabilityService = TransitabilityService;
    
    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.Transitability = TransitabilityService;
    
    console.log('✅ TransitabilityService registrado en MAIRA.Services.Transitability');
}
