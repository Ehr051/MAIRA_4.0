// vegetacionHandler.js - Sistema de vegetación MAIRA 4.0 con extracción dinámica desde GitHub Releases


// Configuración para directorio estático en Render

class VegetacionHandler {
    constructor() {
        this.cache = new Map();
        this.vegetationIndex = null;
        this.config = {
            maxCacheSize: 500,
            cacheTimeout: 600000, // 10 minutos (vegetación cambia menos)
            tileSize: 256,
            resolution: 0.0002777778 // ~30m en grados
        };
        
        // 🌍 Detectar entorno automáticamente
        this.isLocal = this._detectEnvironment();
        
        this.loadVegetationIndex();
    }

    _detectEnvironment() {
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || 
                           hostname === '127.0.0.1' || 
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname.includes('local');
        const isRender = hostname.includes('onrender.com');
        
        console.log(`🌍 VegetacionHandler entorno: ${isLocalhost ? 'LOCAL' : isRender ? 'RENDER' : 'OTRO'}`);
        return isLocalhost;
    }

    async loadVegetationIndex() {
        try {
            // 🌍 Seleccionar URLs según entorno
            const indexUrls = this.isLocal ? [
                // 🏠 LOCAL: Solo rutas locales
                'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                '../Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                '/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                './Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json'
            ] : [
                // ☁️ RENDER: Solo GitHub proxy
                '/api/proxy/github/Vegetacion_Mini_Tiles/vegetation_master_index.json'
            ];
            
            for (const indexUrl of indexUrls) {
                try {
                    console.log(`🌿 Intentando cargar índice de vegetación desde: ${indexUrl}`);
                    const response = await fetch(indexUrl);
                    
                    if (response.ok) {
                        this.vegetationIndex = await response.json();
                        console.log('✅ Índice de vegetación cargado desde:', indexUrl.includes('Client/') ? 'archivos locales' : 'GitHub releases');
                        return;
                    }
                } catch (error) {
                    console.warn(`⚠️ Error cargando desde ${indexUrl}:`, error.message);
                    continue;
                }
            }
            
            console.warn('⚠️ No se pudo cargar el índice de vegetación desde ninguna fuente');
        } catch (error) {
            console.warn('⚠️ Error general cargando índice de vegetación:', error);
        }
    }

    async getNDVI(lat, lon) {
        const key = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
        
        // Verificar cache
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const ndvi = await this.fetchNDVIData(lat, lon);
            
            // Gestión de cache
            if (this.cache.size >= this.config.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(key, {
                data: ndvi,
                timestamp: Date.now()
            });
            
            return ndvi;
        } catch (error) {
            console.error('❌ Error obteniendo NDVI:', error);
            return null;
        }
    }

    async fetchNDVIData(lat, lon) {
        try {
            // Determinar qué tile necesitamos
            const tileInfo = this.getTileForCoordinates(lat, lon);
            
            if (!tileInfo) {
                throw new Error('No se encontró tile de vegetación para las coordenadas especificadas');
            }

            // Cargar el tile
            const tileData = await this.loadTile(tileInfo);
            
            if (!tileData) {
                throw new Error('No se pudo cargar el tile de vegetación');
            }

            // Extraer NDVI específico del tile
            return this.extractNDVIFromTile(tileData, lat, lon, tileInfo);
            
        } catch (error) {
            console.error('❌ Error en fetchNDVIData:', error);
            return null;
        }
    }

    getTileForCoordinates(lat, lon) {
        // Si tenemos índice, usarlo
        if (this.vegetationIndex && this.vegetationIndex.batches) {
            for (const batch of this.vegetationIndex.batches) {
                if (batch.tiles) {
                    for (const tile of batch.tiles) {
                        if (lat >= tile.bounds.south && lat <= tile.bounds.north &&
                            lon >= tile.bounds.west && lon <= tile.bounds.east) {
                            return {
                                ...tile,
                                batch: batch.name
                            };
                        }
                    }
                }
            }
        }

        // Sistema de fallback: generar nombre de tile basado en coordenadas
        const batchNumber = this.getBatchForCoordinates(lat, lon);
        const tileX = Math.floor((lon + 180) / this.config.resolution);
        const tileY = Math.floor((lat + 90) / this.config.resolution);
        
        return {
            filename: `vegetation_ndvi_${tileX}_${tileY}.tif`,
            batch: `vegetation_ndvi_batch_${batchNumber.toString().padStart(2, '0')}`,
            bounds: {
                south: lat - this.config.resolution,
                north: lat + this.config.resolution,
                west: lon - this.config.resolution,
                east: lon + this.config.resolution
            }
        };
    }

    getBatchForCoordinates(lat, lon) {
        // Distribuir en batches basado en coordenadas para optimizar CDN
        const latIndex = Math.floor((lat + 90) / 10); // Dividir en franjas de 10 grados
        const lonIndex = Math.floor((lon + 180) / 20); // Dividir en franjas de 20 grados
        
        return (latIndex * 18 + lonIndex) % 17 + 1; // 17 batches disponibles
    }

    async loadTile(tileInfo) {
        const cacheKey = `vegetation_${tileInfo.filename}`;
        
        // Verificar cache de tiles
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        console.log(`🎯 Cargando ${tileInfo.filename} desde directorio estático Render`);

        // URLs de fallback a intentar en orden - SIN GITHUB CALLBACKS
        const urls = [
            // 🚀 PRIORIDAD: Directorio Render estático
            `/opt/render/project/src/static/tiles/data_argentina/vegetation/${tileInfo.batch}/${tileInfo.filename}`,
            `/static/tiles/data_argentina/vegetation/${tileInfo.batch}/${tileInfo.filename}`,

            // Fallbacks locales con batch
            `Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tileInfo.batch}/${tileInfo.filename}`,
            `../Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tileInfo.batch}/${tileInfo.filename}`,
            `/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tileInfo.batch}/${tileInfo.filename}`,
            `./Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tileInfo.batch}/${tileInfo.filename}`
        ];

        for (const url of urls) {
            try {
                console.log(`🌿 Intentando cargar tile de vegetación desde: ${url}`);
                
                const response = await fetch(url);
                if (response.ok) {
                    const tileData = await response.arrayBuffer();
                    
                    // Cache del tile
                    this.cache.set(cacheKey, {
                        data: tileData,
                        timestamp: Date.now()
                    });
                    
                    console.log(`✅ Tile de vegetación cargado exitosamente desde: ${url}`);
                    return tileData;
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando vegetación desde ${url}:`, error);
                continue;
            }
        }

        throw new Error(`No se pudo cargar el tile de vegetación: ${tileInfo.filename}`);
    }

    extractNDVIFromTile(tileData, lat, lon, tileInfo) {
        try {
            // Para archivos TIFF de NDVI, necesitaríamos una librería específica
            // Por ahora, implementar un parser básico o usar aproximación
            
            // Calcular posición relativa dentro del tile
            const relativeX = (lon - tileInfo.bounds.west) / (tileInfo.bounds.east - tileInfo.bounds.west);
            const relativeY = (lat - tileInfo.bounds.south) / (tileInfo.bounds.north - tileInfo.bounds.south);
            
            // Simulación de NDVI basada en posición geográfica
            // NDVI real va de -1 a 1, donde valores altos indican vegetación densa
            const mockNDVI = Math.sin(lat * 0.2) * Math.cos(lon * 0.15) * 0.8 + 0.1;
            
            // Normalizar entre -1 y 1
            return Math.max(-1, Math.min(1, mockNDVI));
            
        } catch (error) {
            console.error('❌ Error extrayendo NDVI del tile:', error);
            return null;
        }
    }

    // Clasificar tipo de vegetación basado en NDVI
    getVegetationType(ndvi) {
        if (ndvi === null || ndvi === undefined) return 'unknown';
        
        if (ndvi < -0.1) return 'water';          // Agua
        if (ndvi < 0.1) return 'bare_soil';      // Suelo desnudo/urbano
        if (ndvi < 0.3) return 'sparse_vegetation'; // Vegetación escasa
        if (ndvi < 0.6) return 'moderate_vegetation'; // Vegetación moderada
        return 'dense_vegetation';                // Vegetación densa
    }

    // Obtener información completa de vegetación para un punto
    async getVegetationInfo(lat, lon) {
        const ndvi = await this.getNDVI(lat, lon);
        
        if (ndvi === null) {
            return null;
        }

        return {
            ndvi: ndvi,
            type: this.getVegetationType(ndvi),
            density: this.getVegetationDensity(ndvi),
            color: this.getNDVIColor(ndvi)
        };
    }

    getVegetationDensity(ndvi) {
        if (ndvi === null) return 0;
        
        // Convertir NDVI (-1 a 1) a densidad (0 a 100)
        return Math.max(0, Math.min(100, (ndvi + 1) * 50));
    }

    getNDVIColor(ndvi) {
        if (ndvi === null) return '#808080'; // Gris para desconocido
        
        // Escala de colores para NDVI
        if (ndvi < -0.1) return '#0000FF';   // Azul (agua)
        if (ndvi < 0.1) return '#8B4513';   // Marrón (suelo)
        if (ndvi < 0.3) return '#FFFF00';   // Amarillo (vegetación escasa)
        if (ndvi < 0.6) return '#90EE90';   // Verde claro (vegetación moderada)
        return '#006400';                    // Verde oscuro (vegetación densa)
    }

    // Método para precargar tiles de una región
    async preloadBatch(batchNumber) {
        if (!this.vegetationIndex) {
            console.warn('⚠️ No hay índice de vegetación disponible para precarga');
            return;
        }

        const batch = this.vegetationIndex.batches.find(b => b.name.includes(batchNumber.toString().padStart(2, '0')));
        
        if (!batch) {
            console.warn(`⚠️ Batch ${batchNumber} no encontrado`);
            return;
        }

        console.log(`🌿 Precargando ${batch.tiles?.length || 0} tiles del batch: ${batch.name}`);
        
        if (batch.tiles) {
            for (const tile of batch.tiles) {
                try {
                    await this.loadTile({...tile, batch: batch.name});
                } catch (error) {
                    console.warn(`⚠️ Error precargando tile ${tile.filename}:`, error);
                }
            }
        }
        
        console.log(`✅ Precarga del batch ${batch.name} completada`);
    }

    // Estadísticas de cache
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.maxCacheSize,
            types: {
                vegetation: Array.from(this.cache.keys()).filter(k => k.startsWith('vegetation_')).length,
                ndvi: Array.from(this.cache.keys()).filter(k => !k.startsWith('vegetation_')).length
            }
        };
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de vegetación limpiado');
    }


    // Función para extraer un archivo específico de un TAR
    async extractFileFromTar(tarData, targetFilename) {
        try {
            console.log(`🔍 Buscando ${targetFilename} en TAR de vegetación de ${tarData.byteLength} bytes`);
            
            const dataView = new DataView(tarData);
            let offset = 0;
            
            while (offset < tarData.byteLength - 512) {
                // Leer header TAR (512 bytes)
                const nameBytes = new Uint8Array(tarData, offset, 100);
                let filename = '';
                for (let i = 0; i < 100 && nameBytes[i] !== 0; i++) {
                    filename += String.fromCharCode(nameBytes[i]);
                }
                
                // Leer tamaño del archivo (octal en bytes 124-135)
                const sizeBytes = new Uint8Array(tarData, offset + 124, 11);
                let sizeStr = '';
                for (let i = 0; i < 11 && sizeBytes[i] !== 0 && sizeBytes[i] !== 32; i++) {
                    sizeStr += String.fromCharCode(sizeBytes[i]);
                }
                
                const fileSize = parseInt(sizeStr.trim(), 8) || 0;
                offset += 512; // Saltar header
                
                if (filename === targetFilename || filename.endsWith('/' + targetFilename)) {
                    console.log(`✅ Archivo de vegetación encontrado en TAR: ${filename} (${fileSize} bytes)`);
                    return tarData.slice(offset, offset + fileSize);
                }
                
                // Saltar al siguiente archivo (alineado a 512 bytes)
                const paddedSize = Math.ceil(fileSize / 512) * 512;
                offset += paddedSize;
            }
            
            console.warn(`⚠️ Archivo de vegetación ${targetFilename} no encontrado en TAR`);
            return null;
            
        } catch (error) {
            console.error('❌ Error extrayendo de TAR de vegetación:', error);
            return null;
        }
    }

    /**
     * 🚀 Cargar datos de vegetación para un área completa (equivalente a cargarDatosElevacion)
     */
    async cargarDatosVegetacion(bounds) {
        console.log(`🌿 Cargando datos de vegetación para bounds:`, bounds);

        // Encontrar tile que cubre el área
        const tileInfo = this.getTileForBounds(bounds);
        if (!tileInfo) {
            console.warn('⚠️ No se encontró tile de vegetación para el área');
            return null;
        }

        // Cargar tile completo
        const tileData = await this.loadTile(tileInfo);
        if (!tileData) {
            console.warn('⚠️ No se pudo cargar tile de vegetación');
            return null;
        }

        return {
            ndvi: this.extractNDVIFromTile(tileData, bounds),
            bounds: bounds,
            tileInfo: tileInfo
        };
    }

    /**
     * 🔧 Encontrar tile que cubre un área completa
     */
    getTileForBounds(bounds) {
        if (this.vegetationIndex && this.vegetationIndex.batches) {
            for (const batch of this.vegetationIndex.batches) {
                if (batch.tiles) {
                    for (const tile of batch.tiles) {
                        // Verificar si el tile cubre completamente el bounds solicitado
                        if (tile.bounds.north >= bounds.north &&
                            tile.bounds.south <= bounds.south &&
                            tile.bounds.east >= bounds.east &&
                            tile.bounds.west <= bounds.west) {
                            return {
                                ...tile,
                                batch: batch.name
                            };
                        }
                    }
                }
            }
        }

        // Fallback: usar el centro del bounds
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        return this.getTileForCoordinates(centerLat, centerLng);
    }

    /**
     * 🚀 Extraer NDVI para un área completa del tile
     */
    extractNDVIFromTile(tileData, bounds) {
        // Crear una cuadrícula de puntos dentro del bounds
        const sampleSize = 16; // 16x16 = 256 puntos
        const ndvi = [];

        const latStep = (bounds.north - bounds.south) / (sampleSize - 1);
        const lngStep = (bounds.east - bounds.west) / (sampleSize - 1);

        for (let y = 0; y < sampleSize; y++) {
            for (let x = 0; x < sampleSize; x++) {
                const lat = bounds.south + y * latStep;
                const lng = bounds.west + x * lngStep;

                const ndviValue = this.extractNDVIFromTile(tileData, lat, lng, this.getTileForCoordinates(lat, lng));
                ndvi.push(ndviValue !== null ? ndviValue : 0);
            }
        }

        return ndvi;
    }

    /**
     * 🚀 MÉTODOS PARA SISTEMA DE SUB-TILES - VEGETATION HANDLER
     */

    /**
     * Cargar datos de vegetación para un sub-tile específico
     * @param {Object} subTile - Información del sub-tile {bounds, subX, subY, parentTile}
     * @returns {Promise<Object|null>} Datos del sub-tile o null si falla
     */
    async cargarSubTileVegetacion(subTile) {
        try {
            console.log(`🌿 VegetationHandler: Cargando sub-tile ${subTile.subX}_${subTile.subY} para bounds:`, subTile.bounds);

            // Usar el método existente cargarDatosVegetacion con los bounds del sub-tile
            const vegetationData = await this.cargarDatosVegetacion(subTile.bounds);

            if (!vegetationData || !vegetationData.ndvi) {
                console.warn(`⚠️ VegetationHandler: No se pudieron cargar datos para sub-tile ${subTile.subX}_${subTile.subY}`);
                return null;
            }

            // Retornar en el formato esperado por el sistema de sub-tiles
            return {
                ndvi: vegetationData.ndvi,
                bounds: subTile.bounds,
                width: Math.sqrt(vegetationData.ndvi.length), // Asumir cuadrado
                height: Math.sqrt(vegetationData.ndvi.length),
                tileInfo: vegetationData.tileInfo
            };

        } catch (error) {
            console.error(`❌ VegetationHandler: Error cargando sub-tile ${subTile.subX}_${subTile.subY}:`, error);
            return null;
        }
    }

    /**
     * Calcular sub-tiles necesarios para una región de vegetación
     * @param {Object} bounds - Bounds de la región {north, south, east, west}
     * @param {Object} opciones - Opciones de subdivisión {subdivision: 4}
     * @returns {Array} Array de sub-tiles con sus bounds
     */
    calcularSubTilesVegetacion(bounds, opciones = {}) {
        const subdivision = opciones.subdivision || 4; // 4x4 = 16 sub-tiles
        const subTiles = [];

        // Calcular tiles padre (simplificado para vegetation)
        const tileSize = 0.02; // Tiles más grandes para vegetación
        const tilesPadre = [];

        const minLat = Math.floor(bounds.south / tileSize);
        const maxLat = Math.ceil(bounds.north / tileSize);
        const minLng = Math.floor(bounds.west / tileSize);
        const maxLng = Math.ceil(bounds.east / tileSize);

        for (let lat = minLat; lat <= maxLat; lat++) {
            for (let lng = minLng; lng <= maxLng; lng++) {
                const tileBounds = {
                    north: (lat + 1) * tileSize,
                    south: lat * tileSize,
                    east: (lng + 1) * tileSize,
                    west: lng * tileSize
                };

                // Solo incluir tiles que intersecten con bounds objetivo
                if (this.boundsIntersectan(tileBounds, bounds)) {
                    tilesPadre.push({
                        x: lng,
                        y: lat,
                        bounds: tileBounds
                    });
                }
            }
        }

        // Para cada tile padre, generar sub-tiles
        for (const tilePadre of tilesPadre) {
            const subTileSizeDegrees = (tilePadre.bounds.north - tilePadre.bounds.south) / subdivision;
            const subTileSizeLngDegrees = (tilePadre.bounds.east - tilePadre.bounds.west) / subdivision;

            for (let subY = 0; subY < subdivision; subY++) {
                for (let subX = 0; subX < subdivision; subX++) {
                    const subTileBounds = {
                        north: tilePadre.bounds.south + (subY + 1) * subTileSizeDegrees,
                        south: tilePadre.bounds.south + subY * subTileSizeDegrees,
                        east: tilePadre.bounds.west + (subX + 1) * subTileSizeLngDegrees,
                        west: tilePadre.bounds.west + subX * subTileSizeLngDegrees
                    };

                    // Solo incluir sub-tiles que intersecten con bounds objetivo
                    if (this.boundsIntersectan(subTileBounds, bounds)) {
                        subTiles.push({
                            parentTile: `${tilePadre.x}_${tilePadre.y}`,
                            subX: subX,
                            subY: subY,
                            bounds: subTileBounds,
                            tilePadre: tilePadre
                        });
                    }
                }
            }
        }

        console.log(`🌿 VegetationHandler: Calculados ${subTiles.length} sub-tiles de vegetación`);
        return subTiles;
    }

    /**
     * Función auxiliar para verificar intersección de bounds
     */
    boundsIntersectan(bounds1, bounds2) {
        return !(bounds1.west > bounds2.east ||
                 bounds1.east < bounds2.west ||
                 bounds1.south > bounds2.north ||
                 bounds1.north < bounds2.south);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.VegetacionHandler = VegetacionHandler;
    
    // Inicializar automáticamente
    if (!window.vegetationHandler) {
        window.vegetationHandler = new VegetacionHandler();
        window.vegetacionHandler = window.vegetationHandler; // Alias en español para compatibilidad

        // ✅ Agregar métodos adicionales al handler global
        window.vegetationHandler.cargarDatosVegetacion = VegetacionHandler.prototype.cargarDatosVegetacion.bind(window.vegetationHandler);
        window.vegetationHandler.cargarSubTileVegetacion = VegetacionHandler.prototype.cargarSubTileVegetacion.bind(window.vegetationHandler);
        window.vegetationHandler.calcularSubTilesVegetacion = VegetacionHandler.prototype.calcularSubTilesVegetacion.bind(window.vegetationHandler);

        console.log('🌿 VegetationHandler inicializado automáticamente con métodos extendidos');
    }
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetacionHandler;
}
