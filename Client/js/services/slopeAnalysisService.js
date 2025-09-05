/**
 * MAIRA 4.0 - Slope Analysis Service (Hexagonal Architecture)
 * =========        try {
            // Configurar worker si está disponible
            this.setupWorker();
            
            this.initialized = true;
            console.log('✅ SlopeAnalysisService inicializado');
            
            this.core.emit('slopeAnalysisInitialized');
            
        } catch (error) {
            console.error('❌ Error inicializando SlopeAnalysisService:', error);
            throw error;
        }====================================
 * Servicio modular para análisis de pendientes del terreno
 * Convertido a formato compatible con bootstrap DDD
 */

class SlopeAnalysisService {
    constructor(core) {
        this.core = core;
        this.cache = new Map();
        this.maxCacheSize = 200;
        this.initialized = false;
        this.worker = null;
        
        // Configuración de análisis de pendiente
        this.config = {
            // Radio de análisis (metros)
            analysisRadius: {
                fine: 50,      // Análisis local
                medium: 100,   // Análisis regional
                wide: 250      // Análisis amplio
            },
            
            // Clasificación de pendientes (grados)
            classifications: {
                flat: { min: 0, max: 2, color: '#00ff00', description: 'Terreno plano' },
                gentle: { min: 2, max: 5, color: '#7fff00', description: 'Pendiente suave' },
                moderate: { min: 5, max: 10, color: '#ffff00', description: 'Pendiente moderada' },
                steep: { min: 10, max: 20, color: '#ff7f00', description: 'Pendiente pronunciada' },
                verysteep: { min: 20, max: 35, color: '#ff4500', description: 'Pendiente empinada' },
                extreme: { min: 35, max: 90, color: '#ff0000', description: 'Pendiente extrema' }
            },
            
            // Precisión de cálculo
            precision: {
                coordinates: 6,    // decimales lat/lng
                slope: 2,         // decimales grados
                direction: 1      // decimales grados
            },
            
            // Algoritmos disponibles
            algorithms: {
                simple: 'Diferencias finitas simples',
                sobel: 'Operador Sobel',
                horn: 'Método de Horn',
                zevenbergen: 'Zevenbergen & Thorne'
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
            window.MAIRA.Pendiente = this.getLegacyInterface();
        }
        */
    }

    getLegacyInterface() {
        return {
            initialize: this.initialize.bind(this),
            calcularPendiente: this.calculateSlope.bind(this),
            // ✅ NUEVA: Procesar perfiles de elevación con pendientes
            calcularPendientesPerfil: this.calculateElevationProfileSlopes.bind(this),
            analizarArea: this.analyzeArea.bind(this),
            obtenerDireccion: this.getSlopeDirection.bind(this),
            clasificarPendiente: this.classifySlope.bind(this),
            generarMapaPendientes: this.generateSlopeMap.bind(this),
            limpiarCache: this.clearCache.bind(this)
        };
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Inicializar worker para cálculos intensivos
            await this.setupWorker();
            
            this.initialized = true;
            console.log('✅ SlopeAnalysisService inicializado');
            
            this.core.emit('slopeAnalysisInitialized');
            
        } catch (error) {
            console.error('❌ Error inicializando SlopeAnalysisService:', error);
            throw error;
        }
    }

    async setupWorker() {
        try {
            // Usar worker si está disponible
            this.worker = await this.core.loadWorker('slope.worker');
            console.log('✅ Worker de pendientes inicializado');
        } catch (error) {
            console.warn('⚠️ Worker de pendientes no disponible, usando procesamiento principal');
        }
    }

    /**
     * Calcula la pendiente en un punto específico
     */
    async calculateSlope(lat, lon, algorithm = 'horn', radius = 'medium') {
        const cacheKey = `slope_${lat}_${lon}_${algorithm}_${radius}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Obtener datos de elevación del área
            const elevationData = await this.getElevationData(lat, lon, radius);
            
            if (!elevationData) {
                return this.getDefaultSlope();
            }
            
            // Calcular pendiente usando algoritmo especificado
            const slopeData = await this.computeSlope(elevationData, algorithm);
            
            const result = {
                slope: slopeData.slope,
                direction: slopeData.direction,
                classification: this.classifySlope(slopeData.slope),
                algorithm: algorithm,
                coordinates: { lat, lon },
                timestamp: Date.now()
            };
            
            // Agregar al cache
            this.addToCache(cacheKey, result);
            
            return result;
            
        } catch (error) {
            console.error('Error calculando pendiente:', error);
            return this.getDefaultSlope();
        }
    }

    async getElevationData(lat, lon, radius) {
        // Obtener datos de elevación a través del tile loader
        const tileLoader = this.core.getService('tileLoader');
        if (!tileLoader) return null;

        try {
            const tileId = this.coordinatesToTileId(lat, lon);
            const elevationTile = await tileLoader.loadTile('elevation', tileId);
            
            // Extraer ventana de datos según el radio
            return this.extractWindow(elevationTile, lat, lon, radius);
            
        } catch (error) {
            console.error('Error obteniendo datos de elevación:', error);
            return null;
        }
    }

    extractWindow(elevationTile, centerLat, centerLon, radius) {
        if (!elevationTile || !elevationTile.data) return null;

        const radiusMeters = this.config.analysisRadius[radius] || 100;
        const { data, width, height, bounds } = elevationTile;
        
        // Calcular ventana de extracción (simplificado)
        const windowSize = Math.min(width, height, Math.floor(radiusMeters / 10)); // Aproximación
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        const window = {
            data: [],
            width: windowSize,
            height: windowSize,
            cellSize: 10 // metros por celda
        };
        
        // Extraer datos de la ventana
        for (let y = 0; y < windowSize; y++) {
            for (let x = 0; x < windowSize; x++) {
                const srcX = centerX - Math.floor(windowSize / 2) + x;
                const srcY = centerY - Math.floor(windowSize / 2) + y;
                
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    window.data.push(data[srcY * width + srcX]);
                } else {
                    window.data.push(0); // Valor por defecto
                }
            }
        }
        
        return window;
    }

    async computeSlope(elevationData, algorithm) {
        const { data, width, height, cellSize } = elevationData;
        
        if (this.worker && data.length > 1000) {
            // Usar worker para datasets grandes
            return this.computeSlopeWithWorker(elevationData, algorithm);
        }
        
        // Procesamiento en hilo principal
        return this.computeSlopeMainThread(elevationData, algorithm);
    }

    async computeSlopeWithWorker(elevationData, algorithm) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Worker timeout'));
            }, 10000);

            this.worker.onmessage = (e) => {
                clearTimeout(timeout);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data.result);
                }
            };

            this.worker.postMessage({
                type: 'calculateSlope',
                data: elevationData,
                algorithm: algorithm
            });
        });
    }

    computeSlopeMainThread(elevationData, algorithm) {
        const { data, width, height, cellSize } = elevationData;
        
        switch (algorithm) {
            case 'horn':
                return this.hornMethod(data, width, height, cellSize);
            case 'sobel':
                return this.sobelMethod(data, width, height, cellSize);
            case 'zevenbergen':
                return this.zevenbergenMethod(data, width, height, cellSize);
            default:
                return this.simpleMethod(data, width, height, cellSize);
        }
    }

    hornMethod(data, width, height, cellSize) {
        // Implementación del método de Horn para cálculo de pendiente
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        if (centerX === 0 || centerY === 0 || centerX >= width - 1 || centerY >= height - 1) {
            return { slope: 0, direction: 0 };
        }
        
        // Obtener valores de las 8 celdas vecinas
        const z1 = data[(centerY - 1) * width + (centerX - 1)]; // noroeste
        const z2 = data[(centerY - 1) * width + centerX];       // norte
        const z3 = data[(centerY - 1) * width + (centerX + 1)]; // noreste
        const z4 = data[centerY * width + (centerX - 1)];       // oeste
        const z5 = data[centerY * width + centerX];             // centro
        const z6 = data[centerY * width + (centerX + 1)];       // este
        const z7 = data[(centerY + 1) * width + (centerX - 1)]; // suroeste
        const z8 = data[(centerY + 1) * width + centerX];       // sur
        const z9 = data[(centerY + 1) * width + (centerX + 1)]; // sureste
        
        // Cálculo de gradientes
        const dzdx = ((z3 + 2*z6 + z9) - (z1 + 2*z4 + z7)) / (8 * cellSize);
        const dzdy = ((z7 + 2*z8 + z9) - (z1 + 2*z2 + z3)) / (8 * cellSize);
        
        // Pendiente en radianes
        const slopeRad = Math.atan(Math.sqrt(dzdx*dzdx + dzdy*dzdy));
        
        // Dirección en radianes (aspecto)
        let directionRad = Math.atan2(dzdy, -dzdx);
        if (directionRad < 0) directionRad += 2 * Math.PI;
        
        return {
            slope: this.radiansToDegrees(slopeRad),
            direction: this.radiansToDegrees(directionRad)
        };
    }

    sobelMethod(data, width, height, cellSize) {
        // Implementación del operador Sobel
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        if (centerX === 0 || centerY === 0 || centerX >= width - 1 || centerY >= height - 1) {
            return { slope: 0, direction: 0 };
        }
        
        // Kernels de Sobel
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
        
        let gx = 0, gy = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const value = data[(centerY + dy) * width + (centerX + dx)];
                gx += value * sobelX[dy + 1][dx + 1];
                gy += value * sobelY[dy + 1][dx + 1];
            }
        }
        
        gx /= cellSize;
        gy /= cellSize;
        
        const magnitude = Math.sqrt(gx*gx + gy*gy);
        const slopeRad = Math.atan(magnitude);
        
        let directionRad = Math.atan2(gy, -gx);
        if (directionRad < 0) directionRad += 2 * Math.PI;
        
        return {
            slope: this.radiansToDegrees(slopeRad),
            direction: this.radiansToDegrees(directionRad)
        };
    }

    simpleMethod(data, width, height, cellSize) {
        // Método simple de diferencias finitas
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        
        if (centerX === 0 || centerY === 0 || centerX >= width - 1 || centerY >= height - 1) {
            return { slope: 0, direction: 0 };
        }
        
        const east = data[centerY * width + (centerX + 1)];
        const west = data[centerY * width + (centerX - 1)];
        const north = data[(centerY - 1) * width + centerX];
        const south = data[(centerY + 1) * width + centerX];
        
        const dzdx = (east - west) / (2 * cellSize);
        const dzdy = (south - north) / (2 * cellSize);
        
        const slopeRad = Math.atan(Math.sqrt(dzdx*dzdx + dzdy*dzdy));
        
        let directionRad = Math.atan2(dzdy, -dzdx);
        if (directionRad < 0) directionRad += 2 * Math.PI;
        
        return {
            slope: this.radiansToDegrees(slopeRad),
            direction: this.radiansToDegrees(directionRad)
        };
    }

    zevenbergenMethod(data, width, height, cellSize) {
        // Método de Zevenbergen & Thorne (simplificado)
        return this.hornMethod(data, width, height, cellSize);
    }

    radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    classifySlope(slopeDegrees) {
        for (const [key, classification] of Object.entries(this.config.classifications)) {
            if (slopeDegrees >= classification.min && slopeDegrees < classification.max) {
                return {
                    type: key,
                    description: classification.description,
                    color: classification.color,
                    range: `${classification.min}-${classification.max}°`
                };
            }
        }
        
        return {
            type: 'extreme',
            description: 'Pendiente extrema',
            color: '#ff0000',
            range: '>35°'
        };
    }

    coordinatesToTileId(lat, lon) {
        // Conversión simple - mejorar según sistema de tiles usado
        const tileX = Math.floor((lon + 180) / 360 * 256);
        const tileY = Math.floor((90 - lat) / 180 * 256);
        return `${tileX}_${tileY}`;
    }

    getDefaultSlope() {
        return {
            slope: 0,
            direction: 0,
            classification: this.classifySlope(0),
            algorithm: 'default',
            coordinates: { lat: 0, lon: 0 },
            timestamp: Date.now()
        };
    }

    /**
     * Analiza un área completa
     */
    async analyzeArea(bounds, resolution = 'medium') {
        const { north, south, east, west } = bounds;
        const results = [];
        
        // Calcular grid de puntos según resolución
        const gridSize = this.getGridSize(resolution);
        const latStep = (north - south) / gridSize;
        const lonStep = (east - west) / gridSize;
        
        for (let i = 0; i <= gridSize; i++) {
            for (let j = 0; j <= gridSize; j++) {
                const lat = south + i * latStep;
                const lon = west + j * lonStep;
                
                const slopeData = await this.calculateSlope(lat, lon);
                results.push({
                    lat, lon,
                    ...slopeData
                });
            }
        }
        
        return {
            bounds,
            resolution,
            gridSize,
            points: results,
            statistics: this.calculateStatistics(results)
        };
    }

    getGridSize(resolution) {
        const sizes = { low: 10, medium: 20, high: 50 };
        return sizes[resolution] || sizes.medium;
    }

    calculateStatistics(results) {
        const slopes = results.map(r => r.slope);
        return {
            min: Math.min(...slopes),
            max: Math.max(...slopes),
            average: slopes.reduce((sum, s) => sum + s, 0) / slopes.length,
            median: slopes.sort()[Math.floor(slopes.length / 2)]
        };
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
        console.log('🧹 Cache de pendientes limpiado');
    }

    /**
     * 🎯 NUEVA FUNCIÓN: Calcular pendientes para perfil de elevación
     * Función específica para procesar datos que vienen del elevationHandler
     * @param {Array} elevationProfile - Array con datos: {distancia, elevation, lat, lng}
     * @returns {Array} - Mismo array pero con pendientes calculadas
     */
    calculateElevationProfileSlopes(elevationProfile) {
        console.log('📊 SlopeAnalysisService: Calculando pendientes de perfil...');
        
        if (!Array.isArray(elevationProfile) || elevationProfile.length < 2) {
            console.warn('⚠️ Perfil de elevación insuficiente para calcular pendientes');
            return elevationProfile;
        }

        // Clonar para no modificar original
        const resultado = elevationProfile.map(punto => ({ ...punto }));

        // Calcular pendientes entre puntos consecutivos
        for (let i = 1; i < resultado.length; i++) {
            const actual = resultado[i];
            const anterior = resultado[i - 1];
            
            const distanciaParcial = actual.distancia - anterior.distancia;
            const elevacionParcial = actual.elevation - anterior.elevation;
            
            if (distanciaParcial > 0) {
                // Calcular pendiente como porcentaje
                actual.pendiente = (elevacionParcial / distanciaParcial) * 100;
                
                // Limitar pendientes extremas
                if (Math.abs(actual.pendiente) > 100) {
                    actual.pendiente = Math.sign(actual.pendiente) * 100;
                }
                
                // Clasificar la pendiente
                actual.clasificacionPendiente = this.classifySlope(Math.abs(actual.pendiente));
                
            } else {
                actual.pendiente = 0;
                actual.clasificacionPendiente = 'plano';
            }
        }

        // El primer punto no tiene pendiente
        resultado[0].pendiente = 0;
        resultado[0].clasificacionPendiente = 'plano';

        console.log(`✅ Pendientes calculadas para ${resultado.length} puntos`);
        return resultado;
    }

    getStats() {
        return {
            initialized: this.initialized,
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            algorithmsAvailable: Object.keys(this.config.algorithms)
        };
    }
}

// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.SlopeAnalysisService = SlopeAnalysisService;
    
    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.SlopeAnalysis = SlopeAnalysisService;
    
    console.log('✅ SlopeAnalysisService registrado en MAIRA.Services.SlopeAnalysis');
}
