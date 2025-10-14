/**
 * ═══════════════════════════════════════════════════════════════════════
 * ELEVATION SERVICE - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Servicio de elevación optimizado con workers
 * Hereda de GeospatialDataService para funcionalidad común
 * 
 * @extends GeospatialDataService
 * @version 2.0.0
 * @author MAIRA Team
 * @date 2025-01-09
 */

class ElevationService extends GeospatialDataService {
    constructor(config = {}) {
        super({
            cacheTimeout: 900000, // 15 minutos (elevación cambia menos)
            maxCacheSize: 300,
            debug: config.debug || false,
            ...config
        });
        
        this.useTIF = config.useTIF !== false;
        this.elevationHandler = null;
        this.tileIndex = null;
        
        // 🚀 NUEVO: Cache de errores para evitar reintentos
        this.failedTiles = new Set();
        this.failedCoordsCache = new Map();
        this.maxRetries = 3;
        this.errorCacheTimeout = 300000; // 5 minutos
        
        this._log('info', '🗻 ElevationService construido');
    }
    
    /**
     * Inicializar servicio de elevación
     */
    async initialize() {
        if (this.initialized) return;
        
        this._log('info', 'Inicializando ElevationService...');
        
        // Inicializar base (workers, cache)
        await super.initialize();
        
        // 🌍 CONFIGURAR SEGÚN ENTORNO (LOCAL vs RENDER)
        if (this.config.isLocal) {
            // 🏠 LOCAL: Intentar usar TIF files directos
            this._log('info', '🏠 Modo LOCAL: Intentando cargar TIF files...');
            
            if (this.useTIF) {
                try {
                    // Verificar si elevationHandler global está disponible
                    if (typeof window.elevationHandler !== 'undefined') {
                        this.elevationHandler = window.elevationHandler;
                        this._log('info', '✅ ElevationHandler TIF conectado (LOCAL)');
                    } else {
                        this._log('warn', '⚠️ ElevationHandler TIF no disponible, usando procedural');
                        this.useTIF = false;
                    }
                    
                    // Cargar índice de tiles si existe
                    if (typeof elevationTileIndex !== 'undefined') {
                        this.tileIndex = elevationTileIndex;
                        this._log('info', `✅ Índice de tiles cargado: ${Object.keys(this.tileIndex).length} tiles`);
                    }
                } catch (error) {
                    this._log('warn', '⚠️ Error conectando TIF handler:', error);
                    this.useTIF = false;
                }
            }
        } else {
            // ☁️ RENDER: Usar API proxy para TIF
            this._log('info', '☁️ Modo RENDER: Configurando API proxy para TIF...');
            
            // En Render, SIEMPRE usar API (no archivos locales)
            this.useAPI = true;
            this.apiBaseURL = '/api/elevation'; // Endpoint en Flask
            this.useTIF = false; // No cargar TIF directamente
            
            this._log('info', `✅ API configurada: ${this.apiBaseURL}`);
        }
        
        this.initialized = true;
        this._log('info', `✅ ElevationService listo (Entorno: ${this.config.isLocal ? 'LOCAL' : 'RENDER'}, TIF: ${this.useTIF}, API: ${this.useAPI || false}, Workers: ${this.config.useWorkers})`);
    }
    
    
    // ═══════════════════════════════════════════════════════════════════
    // IMPLEMENTACIÓN MÉTODOS ABSTRACTOS
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Path al worker de elevación
     */
    getWorkerScriptPath() {
        return 'Client/js/workers/elevation.worker.js';
    }
    
    /**
     * Obtener información del tile para coordenadas
     */
    getTileInfo(lat, lon) {
        // Si tenemos índice TIF, buscar tile correspondiente
        if (this.tileIndex) {
            for (const tileKey in this.tileIndex) {
                const tile = this.tileIndex[tileKey];
                
                if (lat >= tile.bounds.south && lat <= tile.bounds.north &&
                    lon >= tile.bounds.west && lon <= tile.bounds.east) {
                    
                    const provincia = tile.provincia || 'Unknown';
                    const filename = tile.filename || tileKey;
                    
                    // 🏠 LOCAL: usar ruta directa en Client/Libs/
                    // 🚀 RENDER: usar API Flask /api/tiles/elevation/
                    const isRenderEnvironment = window.location.hostname.includes('render.com') || 
                                               window.location.hostname.includes('onrender.com');
                    
                    const url = isRenderEnvironment 
                        ? `/api/tiles/elevation/${provincia}/${filename}`
                        : `Client/Libs/datos_argentina/Altimetria_Legacy/${filename}`;
                    
                    return {
                        key: tileKey,
                        filename: filename,
                        bounds: tile.bounds,
                        url: url,
                        provincia: provincia
                    };
                }
            }
        }
        
        // Fallback: generar tile info procedural
        const tileX = Math.floor((lon + 180) / this.config.resolution);
        const tileY = Math.floor((lat + 90) / this.config.resolution);
        
        return {
            key: `elevation_${tileX}_${tileY}`,
            filename: `elevation_${tileX}_${tileY}.tif`,
            bounds: {
                south: lat - this.config.resolution,
                north: lat + this.config.resolution,
                west: lon - this.config.resolution,
                east: lon + this.config.resolution
            },
            url: null, // Procedural
            procedural: true
        };
    }
    
    /**
     * Procesar datos crudos del tile TIF
     */
    processRawData(rawData, tileInfo) {
        // Si es procedural, generar grid
        if (tileInfo.procedural) {
            return this._generateProceduralGrid(tileInfo.bounds);
        }
        
        // TODO: Implementar parser GeoTIFF real
        // Por ahora, asumir que rawData ya está procesado
        return rawData;
    }
    
    /**
     * Extraer elevación específica de tile cargado
     */
    _extractDataFromTile(tileData, lat, lon, tileInfo) {
        if (tileInfo.procedural) {
            return this.getProceduralElevation(lat, lon);
        }
        
        // Interpolación bilinear en grid de elevación
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
        
        // Extraer elevación del array
        const index = pixelY * width + pixelX;
        const elevation = tileData.data ? tileData.data[index] : null;
        
        return elevation !== undefined && !isNaN(elevation) ? elevation : null;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // API PÚBLICA
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener elevación para un punto (implementación getData abstracto)
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Promise<number>} Elevación en metros
     */
    async getData(lat, lon) {
        return await this.getElevation(lat, lon);
    }
    
    /**
     * Obtener elevación para lat/lon (alias de getData)
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Promise<number>} Elevación en metros
     */
    async getElevation(lat, lon) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Cache key específico
        const cacheKey = `elev_${lat.toFixed(6)}_${lon.toFixed(6)}`;
        const cached = this._getCached(cacheKey);
        
        if (cached !== null) {
            return cached;
        }
        
        // 🚀 NUEVO: Verificar cache de errores
        const errorKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
        const failedCoord = this.failedCoordsCache.get(errorKey);
        if (failedCoord && (Date.now() - failedCoord.timestamp) < this.errorCacheTimeout) {
            // Esta coordenada falló recientemente, usar procedural directamente
            const elevation = this.getProceduralElevation(lat, lon);
            this._setCache(cacheKey, elevation);
            return elevation;
        }
        
        let elevation = null;
        
        // 🌍 MODO RENDER: Usar API
        if (this.useAPI) {
            try {
                const response = await fetch(`${this.apiBaseURL}?lat=${lat}&lon=${lon}`);
                if (response.ok) {
                    const data = await response.json();
                    elevation = data.elevation;
                    
                    if (elevation !== null && !isNaN(elevation)) {
                        this._setCache(cacheKey, elevation);
                        return elevation;
                    }
                }
            } catch (error) {
                this._log('warn', `⚠️ Error API elevación: ${error.message}`);
            }
        }
        
        // 🏠 MODO LOCAL: Intentar con TIF handler si disponible
        if (this.useTIF && this.elevationHandler) {
            try {
                elevation = await this.elevationHandler.obtenerElevacion(lat, lon);
                
                if (elevation !== null && !isNaN(elevation)) {
                    this._setCache(cacheKey, elevation);
                    return elevation;
                }
            } catch (error) {
                // 🚀 NUEVO: Marcar coordenada como fallida
                this.failedCoordsCache.set(errorKey, {
                    timestamp: Date.now(),
                    retries: (failedCoord?.retries || 0) + 1
                });
                
                this._log('debug', `Error TIF lat:${lat.toFixed(4)}, lon:${lon.toFixed(4)}: ${error.message}`);
            }
        }
        
        // Fallback a procedural
        elevation = this.getProceduralElevation(lat, lon);
        this._setCache(cacheKey, elevation);
        
        return elevation;
    }
    
    /**
     * Obtener elevaciones en batch (optimizado con workers)
     * @param {Array<{lat, lon}>} coords - Array de coordenadas
     * @param {Function} progressCallback - Callback para progreso
     * @returns {Promise<Array<{lat, lon, elevation}>>}
     */
    async getElevationsBatch(coords, progressCallback = null) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        this._log('info', `🏔️ Obteniendo elevación para ${coords.length} puntos en batch...`);
        
        const results = await this.getDataBatch(coords, progressCallback);
        
        return results.map(r => ({
            lat: r.lat,
            lon: r.lon,
            elevation: r.success ? r.data : this.getProceduralElevation(r.lat, r.lon)
        }));
    }
    
    
    // ═══════════════════════════════════════════════════════════════════
    // PROCEDURAL ELEVATION (FALLBACK)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Generar elevación procedural (fallback sin TIF)
     */
    getProceduralElevation(lat, lon) {
        // Ruido multi-octava para variación realista
        const freq1 = 0.1;
        const freq2 = 0.05;
        const freq3 = 0.02;
        
        const noise1 = Math.sin(lat * freq1) * Math.cos(lon * freq1) * 20;
        const noise2 = Math.sin(lat * freq2) * Math.cos(lon * freq2) * 50;
        const noise3 = Math.sin(lat * freq3) * Math.cos(lon * freq3) * 100;
        
        // Argentina: elevación promedio más alta en oeste (Andes)
        const longitudeFactor = Math.max(0, (lon + 70) / 20); // Mayor cerca de Andes
        const andesBonus = longitudeFactor * 1000;
        
        return Math.max(0, noise1 + noise2 + noise3 + andesBonus);
    }
    
    /**
     * Generar grid procedural para un tile
     */
    _generateProceduralGrid(bounds) {
        const width = 256;
        const height = 256;
        const data = new Float32Array(width * height);
        
        const latStep = (bounds.north - bounds.south) / (height - 1);
        const lonStep = (bounds.east - bounds.west) / (width - 1);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const lat = bounds.south + y * latStep;
                const lon = bounds.west + x * lonStep;
                
                data[y * width + x] = this.getProceduralElevation(lat, lon);
            }
        }
        
        return { width, height, data, bounds };
    }
    
    /**
     * Verificar si un punto está dentro de cobertura TIF
     */
    isInTIFCoverage(lat, lon) {
        // Argentina aproximadamente
        return lat >= -55 && lat <= -21.5 && lon >= -73.5 && lon <= -53;
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.ElevationService = ElevationService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevationService;
}
