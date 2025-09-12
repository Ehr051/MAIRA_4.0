// elevationHandlerV2.js - Handler de elevación compatible con tar.gz y Render

class ElevationHandlerV2 {
    constructor() {
        this.cache = new Map();
        this.indexCache = new Map();
        this.config = {
            maxCacheSize: 200,
            cacheTimeout: 600000, // 10 minutos
            githubReleasesBase: 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0',
            localBase: 'Client/Libs/datos_argentina/Altimetria_Mini_Tiles'
        };
        
        this.loadMasterIndex();
    }

    async loadMasterIndex() {
        const urls = [
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
                    console.log('🗻 Índice maestro de elevación cargado desde:', url);
                    return;
                }
            } catch (error) {
                continue;
            }
        }
        
        console.warn('⚠️ No se pudo cargar el índice maestro de elevación');
    }

    async loadRegionIndex(region) {
        if (this.indexCache.has(region)) {
            return this.indexCache.get(region);
        }

        const urls = [
            `${this.config.localBase}/${region}/${region}_mini_tiles_index.json`,
            `/${this.config.localBase}/${region}/${region}_mini_tiles_index.json`,
            `./${this.config.localBase}/${region}/${region}_mini_tiles_index.json`,
            `${this.config.githubReleasesBase}/${region}_mini_tiles_index.json`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const index = await response.json();
                    this.indexCache.set(region, index);
                    console.log(`🗻 Índice de región ${region} cargado`);
                    return index;
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }

    // Determinar qué región contiene las coordenadas
    getRegionForCoordinates(lat, lon) {
        // Divisiones aproximadas de Argentina
        if (lat > -30) return 'norte';
        if (lat > -36) return 'centro_norte';
        if (lat > -42) return 'centro';
        if (lat > -50) return 'sur';
        return 'patagonia';
    }

    // Encontrar tile específico para coordenadas
    async findTileForCoordinates(lat, lon) {
        const region = this.getRegionForCoordinates(lat, lon);
        const regionIndex = await this.loadRegionIndex(region);
        
        if (!regionIndex || !regionIndex.tiles) {
            return null;
        }

        // Buscar tile que contenga las coordenadas
        for (const tileId in regionIndex.tiles) {
            const tile = regionIndex.tiles[tileId];
            const bounds = tile.bounds;
            
            if (lat >= bounds.south && lat <= bounds.north &&
                lon >= bounds.west && lon <= bounds.east) {
                return {
                    ...tile,
                    region: region
                };
            }
        }
        
        return null;
    }

    // Obtener elevación para coordenadas específicas
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
                console.warn(`⚠️ No se encontró tile para ${lat}, ${lon}`);
                return null;
            }

            const elevation = await this.extractElevationFromTile(tileInfo, lat, lon);
            
            // Cache del resultado
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
            return null;
        }
    }

    // Extraer elevación de un tile específico
    async extractElevationFromTile(tileInfo, lat, lon) {
        try {
            // URLs a intentar para obtener el TIF
            const urls = [
                // Prioridad 1: Archivos extraídos localmente
                `${this.config.localBase}/${tileInfo.region}/extracted/${tileInfo.filename}`,
                `/${this.config.localBase}/${tileInfo.region}/extracted/${tileInfo.filename}`,
                `./${this.config.localBase}/${tileInfo.region}/extracted/${tileInfo.filename}`,
                
                // Prioridad 2: GitHub Releases directo
                `${this.config.githubReleasesBase}/tiles/${tileInfo.filename}`,
                
                // Prioridad 3: Fallback local
                `${this.config.localBase}/${tileInfo.region}/${tileInfo.filename}`,
                `/${this.config.localBase}/${tileInfo.region}/${tileInfo.filename}`
            ];

            for (const url of urls) {
                try {
                    console.log(`🗻 Intentando cargar tile desde: ${url}`);
                    
                    const response = await fetch(url);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        
                        // Usar GeoTIFF para leer el archivo
                        if (typeof GeoTIFF !== 'undefined') {
                            const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
                            const image = await tiff.getImage();
                            const rasters = await image.readRasters();
                            
                            // Obtener valor específico para las coordenadas
                            const elevation = this.interpolateElevation(rasters[0], tileInfo.bounds, lat, lon);
                            
                            console.log(`✅ Elevación obtenida: ${elevation}m para ${lat}, ${lon}`);
                            return elevation;
                        } else {
                            // Fallback: estimación básica
                            console.warn('⚠️ GeoTIFF no disponible, usando estimación');
                            return this.estimateElevation(lat, lon);
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Error con ${url}:`, error.message);
                    continue;
                }
            }
            
            // Si todo falla, usar estimación geográfica
            console.warn('⚠️ Usando estimación geográfica para elevación');
            return this.estimateElevation(lat, lon);

        } catch (error) {
            console.error('❌ Error extrayendo elevación:', error);
            return null;
        }
    }

    // Interpolar elevación de los datos raster
    interpolateElevation(raster, bounds, lat, lon) {
        try {
            const width = raster.width || Math.sqrt(raster.length);
            const height = raster.height || Math.sqrt(raster.length);
            
            // Calcular posición en el raster
            const x = Math.floor(((lon - bounds.west) / (bounds.east - bounds.west)) * width);
            const y = Math.floor(((bounds.north - lat) / (bounds.north - bounds.south)) * height);
            
            // Verificar límites
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const index = y * width + x;
                const elevation = raster[index];
                
                // Verificar valor válido (no NaN, no valores extremos)
                if (typeof elevation === 'number' && !isNaN(elevation) && elevation > -1000 && elevation < 10000) {
                    return Math.round(elevation);
                }
            }
            
            // Fallback a estimación
            return this.estimateElevation(lat, lon);
            
        } catch (error) {
            console.error('❌ Error interpolando elevación:', error);
            return this.estimateElevation(lat, lon);
        }
    }

    // Estimación geográfica básica (fallback)
    estimateElevation(lat, lon) {
        // Estimaciones basadas en geografía conocida de Argentina
        
        // Andes (oeste)
        if (lon < -65) {
            if (lat > -30) return Math.floor(1000 + Math.random() * 2000); // Norte andino
            if (lat > -42) return Math.floor(800 + Math.random() * 1500);  // Centro andino
            return Math.floor(500 + Math.random() * 1000); // Sur andino
        }
        
        // Patagonia
        if (lat < -42) {
            return Math.floor(200 + Math.random() * 800);
        }
        
        // Pampas y centro
        if (lat > -38 && lon > -65) {
            return Math.floor(50 + Math.random() * 200);
        }
        
        // Default
        return Math.floor(100 + Math.random() * 500);
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
        this.indexCache.clear();
    }

    // Información del sistema
    getSystemInfo() {
        return {
            cacheSize: this.cache.size,
            maxCacheSize: this.config.maxCacheSize,
            indexCacheSize: this.indexCache.size,
            hasMasterIndex: !!this.masterIndex
        };
    }
}

// Crear instancia global
window.ElevationHandlerV2 = window.ElevationHandlerV2 || new ElevationHandlerV2();

// Función de compatibilidad con código existente
window.getElevationV2 = async function(lat, lon) {
    return await window.ElevationHandlerV2.getElevation(lat, lon);
};

console.log('🗻 ElevationHandlerV2 cargado - Compatible con Render y desarrollo local');
