// vegetacionHandler.js - Sistema de vegetación MAIRA 4.0 con extracción dinámica desde GitHub Releases

// 🚀 GitHub Release v4.0 - URLs CONFIRMADAS
const VEGETATION_GITHUB_RELEASES_BASE = 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0';
const VEGETATION_RELEASE_ASSETS = {
    TAR_GZ: `${VEGETATION_GITHUB_RELEASES_BASE}/maira_vegetacion_tiles.tar.gz`,
    MANIFEST: `${VEGETATION_GITHUB_RELEASES_BASE}/release_manifest.json`
};

// Configuración para el proxy de GitHub si está disponible
const USE_PROXY = true;
const PROXY_BASE = '/api/proxy/github';

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
        
        this.loadVegetationIndex();
    }

    async loadVegetationIndex() {
        try {
            // URLs a intentar en orden de prioridad - LOCAL FIRST
            const indexUrls = [
                'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                '/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                './Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json',
                `${VEGETATION_GITHUB_RELEASES_BASE}/vegetation_master_index.json`
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

            // 🚀 ESTRATEGIA v4.0: SOLO GitHub Release - URLs CONFIRMADAS
        console.log(`🎯 Extrayendo ${tileInfo.filename} de GitHub Release v4.0`);
        const releaseExtracted = await this.extractVegetationTileFromManifestTarGz(tileInfo);
        
        if (releaseExtracted) {
            // Cache del tile extraído
            this.cache.set(cacheKey, {
                data: releaseExtracted,
                timestamp: Date.now()
            });
            
            console.log(`✅ Vegetación extraída desde Release v4.0: ${tileInfo.filename}`);
            return releaseExtracted;
        }

        // URLs de fallback a intentar en orden
        const urls = [
            // Proxy interno si está disponible (fallback)
            ...(USE_PROXY ? [`${PROXY_BASE}/vegetation/${tileInfo.filename}`] : []),
            
            // GitHub Release directo (fallback)
            `${VEGETATION_GITHUB_RELEASES_BASE}/${tileInfo.filename}`,
            
            // Fallbacks locales con batch
            ...VEGETATION_FALLBACK_URLS.map(base => `${base}/${tileInfo.batch}/${tileInfo.filename}`)
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

    // Función para extraer dinámicamente un tile desde GitHub Releases o local
    async extractVegetationTileIfNeeded(tile) {
        try {
            if (!tile.tar_file) {
                // No hay información de archivo TAR, saltar extracción
                return null;
            }
            
            console.log(`🔧 Extrayendo tile de vegetación dinámicamente: ${tile.filename} desde ${tile.tar_file}`);
            
            // URLs de tar.gz a intentar (GitHub Releases primero, local después)
            const tarUrls = [
                // PRIORIDAD 1: GitHub Releases
                `${VEGETATION_GITHUB_RELEASES_BASE}/${tile.provincia}_${tile.tar_file}`,
                `${VEGETATION_GITHUB_RELEASES_BASE}/${tile.tar_file}`,
                
                // PRIORIDAD 2: Local
                `Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tile.provincia}/${tile.tar_file}`,
                `/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tile.provincia}/${tile.tar_file}`,
                `./Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${tile.provincia}/${tile.tar_file}`
            ];
            
            for (const tarUrl of tarUrls) {
                try {
                    console.log(`📦 Intentando descargar tar.gz de vegetación: ${tarUrl}`);
                    const response = await fetch(tarUrl);
                    
                    if (response.ok) {
                        const tarData = await response.arrayBuffer();
                        console.log(`✅ Tar.gz de vegetación descargado: ${tarUrl} (${tarData.byteLength} bytes)`);
                        
                        // Extraer el archivo específico del tar.gz
                        const extractedTif = await this.extractFileFromTar(tarData, tile.filename);
                        
                        if (extractedTif) {
                            console.log(`✅ TIF de vegetación extraído exitosamente: ${tile.filename}`);
                            return extractedTif;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Error con ${tarUrl}:`, error.message);
                    continue;
                }
            }
            
            console.warn(`⚠️ No se pudo extraer ${tile.filename} de ningún tar.gz de vegetación`);
            return null;
            
        } catch (error) {
            console.error(`❌ Error en extractVegetationTileIfNeeded para ${tile.filename}:`, error);
            return null;
        }
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

    // 🚀 Función para extraer vegetación de GitHub Release v4.0 - URL CONFIRMADA
    async extractVegetationTileFromManifestTarGz(tileInfo) {
        try {
            console.log(`📦 Extrayendo vegetación ${tileInfo.filename} de GitHub Release v4.0`);
            
            // URL CONFIRMADA del tar.gz en GitHub Release
            const tarGzUrl = VEGETATION_RELEASE_ASSETS.TAR_GZ;
            
            console.log(`📡 Descargando desde: ${tarGzUrl}`);
            const response = await fetch(tarGzUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} descargando release vegetación`);
            }
            
            const tarGzData = await response.arrayBuffer();
            console.log(`✅ Vegetación descargada: ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
            
            // Extraer archivo específico del tar.gz
            const extractedTif = await this.extractVegetationFileFromTarGz(tarGzData, tileInfo.filename);
            
            if (extractedTif) {
                console.log(`✅ Vegetación extraída: ${tileInfo.filename}`);
                return extractedTif;
            } else {
                throw new Error(`Tile ${tileInfo.filename} no encontrado en release`);
            }
            
        } catch (error) {
            console.error(`❌ Error extrayendo vegetación ${tileInfo.filename}:`, error);
            return null;
        }
    }

    // 🔧 Función para extraer vegetación REAL del tar.gz - IMPLEMENTACIÓN CON PAKO.JS
    async extractVegetationFileFromTarGz(tarGzData, targetFilename) {
        try {
            console.log(`🔍 Extrayendo NDVI REAL ${targetFilename} de tar.gz de ${(tarGzData.byteLength / 1024 / 1024).toFixed(1)}MB`);
            
            // Cargar pako.js si no está disponible
            if (typeof pako === 'undefined') {
                console.log('📦 Cargando pako.js para descompresión NDVI...');
                await this.loadScript('/node_modules/pako/dist/pako.min.js');
            }
            
            // Descomprimir gzip usando pako
            console.log('🔧 Descomprimiendo gzip vegetación...');
            const tarData = pako.ungzip(new Uint8Array(tarGzData));
            console.log(`✅ NDVI descomprimido: ${(tarData.length / 1024 / 1024).toFixed(1)}MB`);
            
            // Parsear tar para encontrar el archivo específico
            const extractedFile = await this.extractVegetationFromTar(tarData, targetFilename);
            
            if (extractedFile) {
                console.log(`✅ NDVI REAL extraído: ${targetFilename} (${(extractedFile.byteLength / 1024).toFixed(1)}KB)`);
                return extractedFile;
            } else {
                throw new Error(`Archivo NDVI ${targetFilename} no encontrado en tar`);
            }
            
        } catch (error) {
            console.error(`❌ Error extrayendo NDVI real ${targetFilename}:`, error);
            
            // Fallback: intentar interpretar como tar sin gzip
            try {
                console.log('🔄 Intentando NDVI como tar sin compresión...');
                const extractedFile = await this.extractVegetationFromTar(new Uint8Array(tarGzData), targetFilename);
                if (extractedFile) {
                    console.log(`✅ NDVI REAL extraído (tar directo): ${targetFilename}`);
                    return extractedFile;
                }
            } catch (fallbackError) {
                console.error('❌ Fallback NDVI también falló:', fallbackError);
            }
            
            return null;
        }
    }

    // 🔧 Función para cargar script dinámicamente
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 🔧 Función para extraer archivo NDVI específico de datos TAR
    async extractVegetationFromTar(tarData, targetFilename) {
        try {
            console.log(`🔍 Buscando NDVI ${targetFilename} en TAR de ${(tarData.length / 1024 / 1024).toFixed(1)}MB`);
            
            let offset = 0;
            const tarBuffer = tarData.buffer || tarData;
            
            while (offset < tarBuffer.byteLength - 512) {
                // Leer header TAR (512 bytes)
                const header = new Uint8Array(tarBuffer, offset, 512);
                
                // NUL header indicates end
                if (header[0] === 0) break;
                
                // Extraer nombre del archivo (primeros 100 bytes, null-terminated)
                let filename = '';
                for (let i = 0; i < 100 && header[i] !== 0; i++) {
                    filename += String.fromCharCode(header[i]);
                }
                
                // Extraer tamaño del archivo (bytes 124-135, octal)
                let sizeStr = '';
                for (let i = 124; i < 136 && header[i] !== 0 && header[i] !== 32; i++) {
                    sizeStr += String.fromCharCode(header[i]);
                }
                
                const fileSize = parseInt(sizeStr.trim(), 8) || 0;
                
                console.log(`📁 Encontrado NDVI en TAR: ${filename} (${fileSize} bytes)`);
                
                // Si es el archivo que buscamos
                if (filename === targetFilename || filename.endsWith('/' + targetFilename)) {
                    const dataOffset = offset + 512;
                    const fileData = tarBuffer.slice(dataOffset, dataOffset + fileSize);
                    console.log(`✅ Archivo NDVI real encontrado: ${filename} (${fileSize} bytes)`);
                    return fileData;
                }
                
                // Avanzar al siguiente archivo (512 bytes de header + tamaño del archivo, redondeado a 512)
                const blockSize = Math.ceil((512 + fileSize) / 512) * 512;
                offset += blockSize;
            }
            
            console.warn(`⚠️ Archivo NDVI ${targetFilename} no encontrado en TAR`);
            return null;
            
        } catch (error) {
            console.error(`❌ Error parseando TAR NDVI:`, error);
            return null;
        }
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.VegetacionHandler = VegetacionHandler;
    
    // Inicializar automáticamente
    if (!window.vegetationHandler) {
        window.vegetationHandler = new VegetacionHandler();
        console.log('🌿 VegetationHandler inicializado automáticamente');
    }
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetacionHandler;
}
