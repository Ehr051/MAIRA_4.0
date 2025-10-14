/**
 * ═══════════════════════════════════════════════════════════════════════
 * GEOSPATIAL DATA SERVICE - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Clase base abstracta para servicios de datos geoespaciales
 * Proporciona funcionalidad común para:
 * - Cache de tiles
 * - Worker pool management
 * - Carga de tiles en background
 * - Procesamiento batch
 * 
 * @abstract
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-01-09
 */

class GeospatialDataService {
    constructor(config = {}) {
        if (this.constructor === GeospatialDataService) {
            throw new Error('GeospatialDataService es abstracta - usar ElevationService o VegetationService');
        }
        
        // 🌍 DETECCIÓN AUTOMÁTICA DE ENTORNO
        this.isLocal = this._detectEnvironment();
        
        this.config = {
            // Cache
            cacheEnabled: config.cacheEnabled !== false,
            maxCacheSize: config.maxCacheSize || 500,
            cacheTimeout: config.cacheTimeout || 600000, // 10 minutos
            
            // Workers
            useWorkers: config.useWorkers !== false && typeof Worker !== 'undefined',
            maxWorkers: config.maxWorkers || navigator.hardwareConcurrency || 4,
            workerTimeout: config.workerTimeout || 30000, // 30 segundos
            
            // Tiles
            tileSize: config.tileSize || 256,
            resolution: config.resolution || 0.0002777778, // ~30m
            
            // 🌍 RUTAS DUAL: LOCAL vs RENDER
            isLocal: this.isLocal,
            
            // Debug
            debug: config.debug || false,
            ...config
        };
        
        // Cache de tiles
        this.cache = new Map();
        
        // Worker pool
        this.workerPool = [];
        this.workerQueue = [];
        this.activeWorkers = 0;
        
        // Estadísticas
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            tilesLoaded: 0,
            workerCalls: 0,
            errors: 0,
            totalLoadTime: 0,
            
            getHitRate() {
                const total = this.cacheHits + this.cacheMisses;
                return total > 0 ? ((this.cacheHits / total) * 100).toFixed(1) : 0;
            },
            
            getAvgLoadTime() {
                return this.tilesLoaded > 0 
                    ? (this.totalLoadTime / this.tilesLoaded).toFixed(0) 
                    : 0;
            },
            
            reset() {
                this.cacheHits = 0;
                this.cacheMisses = 0;
                this.tilesLoaded = 0;
                this.workerCalls = 0;
                this.errors = 0;
                this.totalLoadTime = 0;
            }
        };
        
        this.initialized = false;
        
        this._log('info', `${this.constructor.name} inicializado`, this.config);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MÉTODOS ABSTRACTOS (deben implementarse en clases hijas)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener nombre del worker script
     * @abstract
     * @returns {string} Path al worker
     */
    getWorkerScriptPath() {
        throw new Error('getWorkerScriptPath() debe implementarse en clase hija');
    }
    
    /**
     * Obtener datos para un punto específico
     * @abstract
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Promise<any>}
     */
    async getData(lat, lon) {
        throw new Error('getData() debe implementarse en clase hija');
    }
    
    /**
     * Procesar datos crudos del tile
     * @abstract
     * @param {ArrayBuffer|Object} rawData - Datos del tile
     * @param {Object} tileInfo - Información del tile
     * @returns {any} Datos procesados
     */
    processRawData(rawData, tileInfo) {
        throw new Error('processRawData() debe implementarse en clase hija');
    }
    
    /**
     * Obtener información del tile para coordenadas
     * @abstract
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @returns {Object} Info del tile {filename, bounds, url, etc}
     */
    getTileInfo(lat, lon) {
        throw new Error('getTileInfo() debe implementarse en clase hija');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // CACHE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener datos del cache
     * @param {string} key - Clave del cache
     * @returns {any|null} Datos cacheados o null
     */
    _getCached(key) {
        if (!this.config.cacheEnabled) return null;
        
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.stats.cacheMisses++;
            return null;
        }
        
        // Verificar timeout
        if (Date.now() - cached.timestamp > this.config.cacheTimeout) {
            this.cache.delete(key);
            this.stats.cacheMisses++;
            return null;
        }
        
        this.stats.cacheHits++;
        return cached.data;
    }
    
    /**
     * Guardar en cache
     * @param {string} key - Clave
     * @param {any} data - Datos a cachear
     */
    _setCache(key, data) {
        if (!this.config.cacheEnabled) return;
        
        // LRU: eliminar item más viejo si cache lleno
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Limpiar cache completo
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this._log('info', `Cache limpiado: ${size} items eliminados`);
    }
    
    /**
     * Limpiar items expirados del cache
     */
    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.cacheTimeout) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this._log('info', `Cache limpiado: ${cleaned} items expirados`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // WORKER POOL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Inicializar worker pool bajo demanda
     */
    async _initWorkerPool() {
        if (!this.config.useWorkers) {
            this._log('warn', 'Workers deshabilitados');
            return;
        }
        
        // 🔥 LAZY LOADING: Solo crear si no existen
        if (this.workerPool.length > 0) {
            this._log('info', 'Worker pool ya existe, reutilizando');
            return;
        }
        
        const workerPath = this.getWorkerScriptPath();
        
        try {
            this._log('info', '🔄 Creando worker pool bajo demanda...');
            
            // Crear workers
            for (let i = 0; i < this.config.maxWorkers; i++) {
                const worker = new Worker(workerPath);
                
                worker.onmessage = (e) => this._handleWorkerMessage(e, i);
                worker.onerror = (e) => this._handleWorkerError(e, i);
                
                this.workerPool.push({
                    worker: worker,
                    busy: false,
                    id: i
                });
            }
            
            this._log('info', `✅ Worker pool creado bajo demanda: ${this.workerPool.length} workers`);
            
        } catch (error) {
            this._log('error', 'Error creando worker pool:', error);
            this.config.useWorkers = false;
            throw error;
        }
    }
    
    /**
     * Obtener worker disponible del pool
     * @returns {Object|null} Worker disponible o null
     */
    _getAvailableWorker() {
        return this.workerPool.find(w => !w.busy) || null;
    }
    
    /**
     * Ejecutar tarea en worker
     * @param {string} type - Tipo de tarea
     * @param {Object} data - Datos para el worker
     * @returns {Promise<any>} Resultado del worker
     */
    async _executeInWorker(type, data) {
        if (!this.config.useWorkers) {
            throw new Error('Workers no disponibles');
        }
        
        // 🔥 LAZY LOADING: Inicializar workers solo cuando se necesiten
        if (this.workerPool.length === 0) {
            this._log('info', '🔄 Inicializando workers bajo demanda...');
            await this._initWorkerPool();
        }
        
        return new Promise((resolve, reject) => {
            const tryExecute = () => {
                const workerWrapper = this._getAvailableWorker();
                
                if (!workerWrapper) {
                    // Queue si no hay workers disponibles
                    this.workerQueue.push({ type, data, resolve, reject });
                    return;
                }
                
                workerWrapper.busy = true;
                this.activeWorkers++;
                this.stats.workerCalls++;
                
                const taskId = `${type}_${Date.now()}_${Math.random()}`;
                
                // Timeout
                const timeout = setTimeout(() => {
                    workerWrapper.busy = false;
                    this.activeWorkers--;
                    this.stats.errors++;
                    reject(new Error(`Worker timeout después de ${this.config.workerTimeout}ms`));
                    this._processQueue();
                }, this.config.workerTimeout);
                
                // Listener temporal para esta tarea
                const messageHandler = (e) => {
                    if (e.data.taskId === taskId) {
                        clearTimeout(timeout);
                        workerWrapper.worker.removeEventListener('message', messageHandler);
                        workerWrapper.busy = false;
                        this.activeWorkers--;
                        
                        if (e.data.error) {
                            this.stats.errors++;
                            reject(new Error(e.data.error));
                        } else {
                            resolve(e.data.result);
                        }
                        
                        this._processQueue();
                    }
                };
                
                workerWrapper.worker.addEventListener('message', messageHandler);
                
                // Enviar tarea al worker
                workerWrapper.worker.postMessage({
                    taskId: taskId,
                    type: type,
                    data: data
                });
            };
            
            tryExecute();
        });
    }
    
    /**
     * Procesar cola de tareas pendientes
     */
    _processQueue() {
        if (this.workerQueue.length === 0) return;
        
        const workerWrapper = this._getAvailableWorker();
        if (!workerWrapper) return;
        
        const task = this.workerQueue.shift();
        
        this._executeInWorker(task.type, task.data)
            .then(task.resolve)
            .catch(task.reject);
    }
    
    /**
     * Manejar mensaje de worker
     */
    _handleWorkerMessage(e, workerId) {
        // Los mensajes específicos se manejan en _executeInWorker
        // Este es un handler global para logs
        if (e.data.log) {
            this._log('debug', `[Worker ${workerId}]`, e.data.log);
        }
    }
    
    /**
     * Manejar error de worker
     */
    _handleWorkerError(e, workerId) {
        this.stats.errors++;
        this._log('error', `Error en worker ${workerId}:`, e.message || 'Error desconocido');
        
        // 🔥 DETECTAR errores críticos y deshabilitar Workers
        const errorMessage = e.message || '';
        const isCriticalError = errorMessage.includes('no se ha podido completar') || 
                               errorMessage.includes('undefined') ||
                               errorMessage.includes('script error');
        
        if (isCriticalError) {
            this._log('error', `🚨 Error crítico en worker ${workerId}, considerando deshabilitar Workers`);
            
            // Si hay muchos errores, deshabilitar Workers automáticamente
            if (this.stats.errors > 5) {
                this._log('error', '🚨 Demasiados errores de Workers, deshabilitando automáticamente');
                this.config.useWorkers = false;
                this._terminateWorkers();
                
                // Notificar a los usuarios del sistema
                if (typeof window !== 'undefined' && window.console) {
                    console.warn('⚠️ MAIRA: Workers deshabilitados automáticamente por errores críticos. Cambiando a procesamiento síncrono.');
                }
            }
        }
    }
    
    /**
     * Terminar todos los workers
     */
    _terminateWorkers() {
        this.workerPool.forEach(w => {
            w.worker.terminate();
        });
        this.workerPool = [];
        this.workerQueue = [];
        this.activeWorkers = 0;
        
        this._log('info', 'Worker pool terminado');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // TILE LOADING (común para todos los servicios)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Cargar tile (con cache y workers)
     * @param {Object} tileInfo - Información del tile
     * @returns {Promise<any>} Datos del tile procesados
     */
    async loadTile(tileInfo) {
        const startTime = Date.now();
        const cacheKey = `tile_${tileInfo.filename || tileInfo.key}`;
        
        // 1. Verificar cache
        const cached = this._getCached(cacheKey);
        if (cached) {
            this._log('debug', `Cache HIT: ${cacheKey}`);
            return cached;
        }
        
        this._log('debug', `Cache MISS: ${cacheKey} - cargando...`);
        
        try {
            let processedData;
            
            // 2. Cargar con worker si disponible
            if (this.config.useWorkers) {
                try {
                    processedData = await this._executeInWorker('LOAD_TILE', tileInfo);
                } catch (workerError) {
                    this._log('warn', 'Worker falló, usando fallback síncrono:', workerError.message);
                    processedData = await this._loadTileSync(tileInfo);
                }
            } else {
                // 3. Fallback síncrono
                processedData = await this._loadTileSync(tileInfo);
            }
            
            // 4. Cachear resultado
            this._setCache(cacheKey, processedData);
            
            // 5. Estadísticas
            const loadTime = Date.now() - startTime;
            this.stats.tilesLoaded++;
            this.stats.totalLoadTime += loadTime;
            
            this._log('debug', `Tile cargado en ${loadTime}ms: ${cacheKey}`);
            
            return processedData;
            
        } catch (error) {
            this.stats.errors++;
            this._log('error', `Error cargando tile ${cacheKey}:`, error);
            throw error;
        }
    }
    
    /**
     * Cargar tile síncrono (fallback sin worker)
     * @param {Object} tileInfo - Info del tile
     * @returns {Promise<any>}
     */
    async _loadTileSync(tileInfo) {
        // Implementación por defecto: fetch + procesar
        const response = await fetch(tileInfo.url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${tileInfo.url}`);
        }
        
        const rawData = await response.arrayBuffer();
        return this.processRawData(rawData, tileInfo);
    }
    
    /**
     * Cargar múltiples tiles en batch (paralelo)
     * @param {Array<Object>} tileInfos - Array de info de tiles
     * @param {Function} progressCallback - Callback para progreso (opcional)
     * @returns {Promise<Array>} Array de tiles cargados
     */
    async loadTilesBatch(tileInfos, progressCallback = null) {
        this._log('info', `Cargando batch de ${tileInfos.length} tiles...`);
        
        const results = [];
        let loaded = 0;
        
        // Cargar en paralelo (máximo maxWorkers a la vez)
        const batchSize = this.config.maxWorkers;
        
        for (let i = 0; i < tileInfos.length; i += batchSize) {
            const batch = tileInfos.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (tileInfo) => {
                try {
                    const data = await this.loadTile(tileInfo);
                    loaded++;
                    
                    if (progressCallback) {
                        progressCallback({
                            loaded: loaded,
                            total: tileInfos.length,
                            percent: (loaded / tileInfos.length * 100).toFixed(1)
                        });
                    }
                    
                    return { success: true, data, tileInfo };
                } catch (error) {
                    this._log('error', `Error en batch tile ${tileInfo.filename}:`, error);
                    return { success: false, error, tileInfo };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        const successCount = results.filter(r => r.success).length;
        this._log('info', `Batch completado: ${successCount}/${tileInfos.length} exitosos`);
        
        return results;
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // BATCH DATA PROCESSING
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener datos para múltiples coordenadas (batch optimizado)
     * @param {Array<{lat, lon}>} coords - Array de coordenadas
     * @param {Function} progressCallback - Callback para progreso
     * @returns {Promise<Array>} Array de resultados
     */
    async getDataBatch(coords, progressCallback = null) {
        this._log('info', `Procesando batch de ${coords.length} coordenadas...`);
        
        // 1. Agrupar coordenadas por tile
        const tileGroups = new Map();
        
        for (const coord of coords) {
            const tileInfo = this.getTileInfo(coord.lat, coord.lon);
            const tileKey = tileInfo.filename || tileInfo.key;
            
            if (!tileGroups.has(tileKey)) {
                tileGroups.set(tileKey, {
                    tileInfo: tileInfo,
                    coords: []
                });
            }
            
            tileGroups.get(tileKey).coords.push(coord);
        }
        
        this._log('debug', `Coordenadas agrupadas en ${tileGroups.size} tiles`);
        
        // 2. Cargar tiles necesarios
        const tileInfos = Array.from(tileGroups.values()).map(g => g.tileInfo);
        const loadedTiles = await this.loadTilesBatch(tileInfos, progressCallback);
        
        // 3. Extraer datos para cada coordenada
        const results = [];
        
        for (const coord of coords) {
            const tileInfo = this.getTileInfo(coord.lat, coord.lon);
            const tileKey = tileInfo.filename || tileInfo.key;
            
            const loadedTile = loadedTiles.find(t => 
                (t.tileInfo.filename || t.tileInfo.key) === tileKey
            );
            
            if (loadedTile && loadedTile.success) {
                const data = this._extractDataFromTile(loadedTile.data, coord.lat, coord.lon, tileInfo);
                results.push({ ...coord, data, success: true });
            } else {
                results.push({ ...coord, data: null, success: false });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        this._log('info', `Batch procesado: ${successCount}/${coords.length} exitosos`);
        
        return results;
    }
    
    /**
     * Extraer dato específico de un tile cargado
     * @abstract (puede sobreescribirse en clase hija)
     * @param {any} tileData - Datos del tile
     * @param {number} lat - Latitud
     * @param {number} lon - Longitud
     * @param {Object} tileInfo - Info del tile
     * @returns {any} Dato extraído
     */
    _extractDataFromTile(tileData, lat, lon, tileInfo) {
        throw new Error('_extractDataFromTile() debe implementarse en clase hija');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Inicializar servicio
     */
    async initialize() {
        if (this.initialized) {
            this._log('warn', 'Servicio ya inicializado');
            return;
        }
        
        this._log('info', 'Inicializando servicio...');
        
        // 🔥 NO inicializar workers automáticamente - lazy loading
        // await this._initWorkerPool(); // ❌ COMENTADO
        this._log('info', '⚡ Workers en modo lazy loading - se crearán cuando se necesiten');
        
        // Limpiar cache expirado periódicamente
        setInterval(() => {
            this.cleanExpiredCache();
        }, 60000); // Cada minuto
        
        this.initialized = true;
        this._log('info', '✅ Servicio inicializado correctamente');
    }
    
    /**
     * Destruir servicio (limpiar recursos)
     */
    destroy() {
        this._log('info', 'Destruyendo servicio...');
        
        this._terminateWorkers();
        this.clearCache();
        this.initialized = false;
        
        this._log('info', '✅ Servicio destruido');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Obtener estadísticas del servicio
     */
    getStats() {
        return {
            service: this.constructor.name,
            cache: {
                size: this.cache.size,
                maxSize: this.config.maxCacheSize,
                hitRate: this.stats.getHitRate() + '%',
                hits: this.stats.cacheHits,
                misses: this.stats.cacheMisses
            },
            workers: {
                enabled: this.config.useWorkers,
                total: this.workerPool.length,
                active: this.activeWorkers,
                queued: this.workerQueue.length,
                calls: this.stats.workerCalls
            },
            performance: {
                tilesLoaded: this.stats.tilesLoaded,
                avgLoadTime: this.stats.getAvgLoadTime() + 'ms',
                totalLoadTime: this.stats.totalLoadTime + 'ms',
                errors: this.stats.errors
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // DETECCIÓN DE ENTORNO
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * 🌍 Detectar si estamos en LOCAL o RENDER
     * @returns {boolean} true si es local, false si es Render
     */
    _detectEnvironment() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname.includes('local');
        
        const isRender = hostname.includes('onrender.com');
        
        console.log(`🌍 Entorno detectado: ${isLocalhost ? 'LOCAL' : isRender ? 'RENDER' : 'OTRO'} (${hostname})`);
        
        return isLocalhost;
    }
    
    /**
     * Logger interno
     */
    _log(level, ...args) {
        if (!this.config.debug && level === 'debug') return;
        
        const prefix = `[${this.constructor.name}]`;
        
        switch (level) {
            case 'error':
                console.error(prefix, ...args);
                break;
            case 'warn':
                console.warn(prefix, ...args);
                break;
            case 'info':
                console.log(prefix, ...args);
                break;
            case 'debug':
                console.debug(prefix, ...args);
                break;
        }
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.GeospatialDataService = GeospatialDataService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeospatialDataService;
}
