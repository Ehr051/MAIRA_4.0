// elevationHandlerRender.js - Handler optimizado para Render usando GitHub Releases

class ElevationHandlerRender {
    constructor() {
        this.cache = new Map();
        this.tarCache = new Map();
        this.indexCache = new Map();
        this.config = {
            maxCacheSize: 100,
            maxTarCacheSize: 5, // Máximo 5 tar.gz en memoria
            cacheTimeout: 600000, // 10 minutos
            
            // URLs para diferentes entornos
            githubReleasesBase: 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0',
            localBase: 'Client/Libs/datos_argentina/Altimetria_Mini_Tiles',
            
            // Detectar si estamos en Render
            isRenderEnvironment: window.location.hostname.includes('render.com') || 
                                window.location.hostname.includes('onrender.com')
        };
        
        console.log(`🌍 Entorno detectado: ${this.config.isRenderEnvironment ? 'Render (Producción)' : 'Local/Desarrollo'}`);
        this.loadMasterIndex();
    }

    async loadMasterIndex() {
        const urls = this.config.isRenderEnvironment ? [
            // En Render: usar GitHub Releases primero
            `${this.config.githubReleasesBase}/master_mini_tiles_index.json`,
            `${this.config.localBase}/master_mini_tiles_index.json`,
            `/${this.config.localBase}/master_mini_tiles_index.json`
        ] : [
            // En desarrollo: usar archivos locales primero
            `${this.config.localBase}/master_mini_tiles_index.json`,
            `/${this.config.localBase}/master_mini_tiles_index.json`,
            `./${this.config.localBase}/master_mini_tiles_index.json`,
            `${this.config.githubReleasesBase}/master_mini_tiles_index.json`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    this.masterIndex = await response.json();
                    console.log('🗻 Índice maestro cargado desde:', url);
                    return;
                }
            } catch (error) {
                continue;
            }
        }
        
        console.warn('⚠️ No se pudo cargar el índice maestro');
    }

    async loadRegionIndex(region) {
        if (this.indexCache.has(region)) {
            return this.indexCache.get(region);
        }

        const urls = this.config.isRenderEnvironment ? [
            // Render: GitHub Releases
            `${this.config.githubReleasesBase}/${region}_mini_tiles_index.json`,
            `${this.config.localBase}/${region}/${region}_mini_tiles_index.json`
        ] : [
            // Desarrollo: Local
            `${this.config.localBase}/${region}/${region}_mini_tiles_index.json`,
            `/${this.config.localBase}/${region}/${region}_mini_tiles_index.json`,
            `${this.config.githubReleasesBase}/${region}_mini_tiles_index.json`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const index = await response.json();
                    this.indexCache.set(region, index);
                    console.log(`🗻 Índice de ${region} cargado desde:`, url);
                    return index;
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }

    // Obtener TIF específico de un tar.gz
    async extractTifFromTar(region, tarFile, tifFilename) {
        const tarKey = `${region}_${tarFile}`;
        
        // Verificar cache de tar
        let tarData;
        if (this.tarCache.has(tarKey)) {
            const cached = this.tarCache.get(tarKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                tarData = cached.data;
            }
        }

        if (!tarData) {
            // Descargar tar.gz
            const tarUrls = this.config.isRenderEnvironment ? [
                `${this.config.githubReleasesBase}/${region}_${tarFile}`,
                `${this.config.localBase}/${region}/${tarFile}`
            ] : [
                `${this.config.localBase}/${region}/${tarFile}`,
                `/${this.config.localBase}/${region}/${tarFile}`,
                `${this.config.githubReleasesBase}/${region}_${tarFile}`
            ];

            for (const tarUrl of tarUrls) {
                try {
                    console.log(`📦 Descargando tar.gz: ${tarUrl}`);
                    const response = await fetch(tarUrl);
                    if (response.ok) {
                        tarData = await response.arrayBuffer();
                        
                        // Cache del tar (limpiar si excede límite)
                        if (this.tarCache.size >= this.config.maxTarCacheSize) {
                            const firstKey = this.tarCache.keys().next().value;
                            this.tarCache.delete(firstKey);
                        }
                        
                        this.tarCache.set(tarKey, {
                            data: tarData,
                            timestamp: Date.now()
                        });
                        
                        console.log(`✅ Tar.gz descargado: ${(tarData.byteLength / 1024 / 1024).toFixed(1)}MB`);
                        break;
                    }
                } catch (error) {
                    console.warn(`⚠️ Error descargando ${tarUrl}:`, error.message);
                    continue;
                }
            }
        }

        if (!tarData) {
            throw new Error(`No se pudo descargar tar.gz para ${region}/${tarFile}`);
        }

        // Extraer TIF específico del tar.gz usando una implementación simple
        return await this.extractFileFromTarBuffer(tarData, tifFilename);
    }

    // Implementación simplificada de extracción TAR
    async extractFileFromTarBuffer(tarBuffer, targetFilename) {
        try {
            const dataView = new DataView(tarBuffer);
            let offset = 0;
            
            while (offset < tarBuffer.byteLength - 512) {
                // Leer header TAR (512 bytes)
                const nameBytes = new Uint8Array(tarBuffer, offset, 100);
                let filename = '';
                for (let i = 0; i < 100 && nameBytes[i] !== 0; i++) {
                    filename += String.fromCharCode(nameBytes[i]);
                }
                
                // Leer tamaño del archivo (posición 124-135, formato octal)
                const sizeBytes = new Uint8Array(tarBuffer, offset + 124, 11);
                let sizeStr = '';
                for (let i = 0; i < 11 && sizeBytes[i] !== 0 && sizeBytes[i] !== 32; i++) {
                    sizeStr += String.fromCharCode(sizeBytes[i]);
                }
                
                const fileSize = parseInt(sizeStr.trim(), 8) || 0;
                offset += 512; // Saltar header
                
                if (filename.trim() === targetFilename || filename.endsWith(`/${targetFilename}`)) {
                    console.log(`✅ TIF encontrado en TAR: ${filename} (${fileSize} bytes)`);
                    return tarBuffer.slice(offset, offset + fileSize);
                }
                
                // Saltar al siguiente archivo (alineado a 512 bytes)
                const paddedSize = Math.ceil(fileSize / 512) * 512;
                offset += paddedSize;
            }
            
            throw new Error(`TIF ${targetFilename} no encontrado en TAR`);
            
        } catch (error) {
            console.error('❌ Error extrayendo de TAR:', error);
            throw error;
        }
    }

    // Determinar región para coordenadas
    getRegionForCoordinates(lat, lon) {
        if (lat > -30) return 'norte';
        if (lat > -36) return 'centro_norte';  
        if (lat > -42) return 'centro';
        if (lat > -50) return 'sur';
        return 'patagonia';
    }

    // Encontrar tile específico
    async findTileForCoordinates(lat, lon) {
        const region = this.getRegionForCoordinates(lat, lon);
        const regionIndex = await this.loadRegionIndex(region);
        
        if (!regionIndex?.tiles) {
            return null;
        }

        for (const tileId in regionIndex.tiles) {
            const tile = regionIndex.tiles[tileId];
            const bounds = tile.bounds;
            
            if (lat >= bounds.south && lat <= bounds.north &&
                lon >= bounds.west && lon <= bounds.east) {
                return { ...tile, region };
            }
        }
        
        return null;
    }

    // Obtener elevación principal
    async getElevation(lat, lon) {
        const cacheKey = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const tileInfo = await this.findTileForCoordinates(lat, lon);
            if (!tileInfo) {
                console.warn(`⚠️ No tile found for ${lat}, ${lon}`);
                return this.estimateElevation(lat, lon);
            }

            // Intentar obtener TIF del tar.gz
            let tifData = null;
            if (tileInfo.tar_file) {
                try {
                    tifData = await this.extractTifFromTar(tileInfo.region, tileInfo.tar_file, tileInfo.filename);
                } catch (error) {
                    console.warn(`⚠️ Error extrayendo TIF: ${error.message}`);
                }
            }

            let elevation;
            if (tifData && typeof GeoTIFF !== 'undefined') {
                // Procesar TIF real
                const tiff = await GeoTIFF.fromArrayBuffer(tifData);
                const image = await tiff.getImage();
                const rasters = await image.readRasters();
                elevation = this.interpolateElevation(rasters[0], tileInfo.bounds, lat, lon);
                console.log(`✅ Elevación real: ${elevation}m`);
            } else {
                // Fallback a estimación
                elevation = this.estimateElevation(lat, lon);
                console.log(`📊 Elevación estimada: ${elevation}m`);
            }

            // Cache resultado
            if (this.cache.size >= this.config.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(cacheKey, {
                data: elevation,
                timestamp: Date.now()
            });

            return elevation;

        } catch (error) {
            console.error('❌ Error obteniendo elevación:', error);
            return this.estimateElevation(lat, lon);
        }
    }

    // Interpolar elevación del raster
    interpolateElevation(raster, bounds, lat, lon) {
        try {
            const width = Math.sqrt(raster.length);
            const height = width;
            
            const x = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * width);
            const y = Math.floor(((bounds.north - lat) / (bounds.north - bounds.south)) * height);
            
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const index = y * width + x;
                const elevation = raster[index];
                
                if (typeof elevation === 'number' && !isNaN(elevation) && elevation > -1000 && elevation < 10000) {
                    return Math.round(elevation);
                }
            }
            
            return this.estimateElevation(bounds.south + (bounds.north - bounds.south) / 2, 
                                        bounds.west + (bounds.east - bounds.west) / 2);
            
        } catch (error) {
            console.error('❌ Error interpolando:', error);
            return this.estimateElevation(lat, lon);
        }
    }

    // Estimación geográfica (fallback)
    estimateElevation(lat, lon) {
        // Andes occidentales
        if (lon < -65) {
            if (lat > -30) return Math.floor(1000 + Math.random() * 2000);
            if (lat > -42) return Math.floor(800 + Math.random() * 1500);
            return Math.floor(500 + Math.random() * 1000);
        }
        
        // Patagonia
        if (lat < -42) return Math.floor(200 + Math.random() * 800);
        
        // Pampas
        if (lat > -38 && lon > -65) return Math.floor(50 + Math.random() * 200);
        
        return Math.floor(100 + Math.random() * 500);
    }

    // Información del sistema
    getSystemInfo() {
        return {
            environment: this.config.isRenderEnvironment ? 'Render' : 'Local',
            cacheSize: this.cache.size,
            tarCacheSize: this.tarCache.size,
            indexCacheSize: this.indexCache.size,
            hasMasterIndex: !!this.masterIndex
        };
    }
}

// Instancia global
window.ElevationHandlerRender = window.ElevationHandlerRender || new ElevationHandlerRender();

// Función de compatibilidad
window.getElevationRender = async function(lat, lon) {
    return await window.ElevationHandlerRender.getElevation(lat, lon);
};

console.log('🚀 ElevationHandlerRender cargado - Optimizado para GitHub Releases y Render');
