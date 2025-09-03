// elevationHandler.js - Sistema de elevación MAIRA 4.0 con GitHub Releases

// URL base para GitHub Releases mini-tiles v4.0
const GITHUB_RELEASES_BASE = 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0';

// URLs de fallback para mini-tiles de altimetría
const MINI_TILES_FALLBACK_URLS = [
    `${GITHUB_RELEASES_BASE}/maira_altimetria_tiles.tar.gz`,
    'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/',
    'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/'
];

// Configuración para el proxy de GitHub si está disponible
const USE_PROXY = true;
const PROXY_BASE = '/api/proxy/github';

class ElevationHandler {
    constructor() {
        this.cache = new Map();
        this.tileIndex = null;
        this.config = {
            maxCacheSize: 1000,
            cacheTimeout: 300000, // 5 minutos
            tileSize: 256,
            resolution: 0.0002777778 // ~30m en grados
        };
        
        this.loadTileIndex();
    }

    async loadTileIndex() {
        try {
            // Intentar cargar el índice de tiles
            const indexUrl = `${GITHUB_RELEASES_BASE}/altimetria_master_index.json`;
            const response = await fetch(indexUrl);
            
            if (response.ok) {
                this.tileIndex = await response.json();
                console.log('🗺️ Índice de tiles de altimetría cargado');
            } else {
                console.warn('⚠️ No se pudo cargar el índice de tiles, usando sistema de fallback');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando índice de tiles:', error);
        }
    }

    async getElevation(lat, lon) {
        const key = `${lat.toFixed(6)}_${lon.toFixed(6)}`;
        
        // Verificar cache
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const elevation = await this.fetchElevationData(lat, lon);
            
            // Gestión de cache
            if (this.cache.size >= this.config.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(key, {
                data: elevation,
                timestamp: Date.now()
            });
            
            return elevation;
        } catch (error) {
            console.error('❌ Error obteniendo elevación:', error);
            return null;
        }
    }

    async fetchElevationData(lat, lon) {
        try {
            // Determinar qué tile necesitamos
            const tileInfo = this.getTileForCoordinates(lat, lon);
            
            if (!tileInfo) {
                throw new Error('No se encontró tile para las coordenadas especificadas');
            }

            // Cargar el tile
            const tileData = await this.loadTile(tileInfo);
            
            if (!tileData) {
                throw new Error('No se pudo cargar el tile de elevación');
            }

            // Extraer elevación específica del tile
            return this.extractElevationFromTile(tileData, lat, lon, tileInfo);
            
        } catch (error) {
            console.error('❌ Error en fetchElevationData:', error);
            return null;
        }
    }

    getTileForCoordinates(lat, lon) {
        // Si tenemos índice, usarlo
        if (this.tileIndex && this.tileIndex.tiles) {
            for (const tile of this.tileIndex.tiles) {
                if (lat >= tile.bounds.south && lat <= tile.bounds.north &&
                    lon >= tile.bounds.west && lon <= tile.bounds.east) {
                    return tile;
                }
            }
        }

        // Sistema de fallback: generar nombre de tile basado en coordenadas
        const region = this.getRegionForCoordinates(lat, lon);
        const tileX = Math.floor((lon + 180) / this.config.resolution);
        const tileY = Math.floor((lat + 90) / this.config.resolution);
        
        return {
            filename: `${region}_tile_${tileX}_${tileY}.tif`,
            region: region,
            bounds: {
                south: lat - this.config.resolution,
                north: lat + this.config.resolution,
                west: lon - this.config.resolution,
                east: lon + this.config.resolution
            }
        };
    }

    getRegionForCoordinates(lat, lon) {
        // Determinar región argentina basada en coordenadas
        if (lat >= -30 && lat <= -20) {
            return 'norte';
        } else if (lat >= -40 && lat < -30) {
            return 'centro_norte';
        } else if (lat >= -45 && lat < -40) {
            return 'centro';
        } else if (lat >= -50 && lat < -45) {
            return 'patagonia';
        } else if (lat < -50) {
            return 'sur';
        }
        return 'centro'; // fallback
    }

    async loadTile(tileInfo) {
        const cacheKey = `tile_${tileInfo.filename}`;
        
        // Verificar cache de tiles
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.data;
            }
        }

        // URLs a intentar en orden
        const urls = [
            // Proxy interno si está disponible
            ...(USE_PROXY ? [`${PROXY_BASE}/${tileInfo.filename}`] : []),
            
            // GitHub Release directo
            `${GITHUB_RELEASES_BASE}/${tileInfo.filename}`,
            
            // Fallbacks
            ...MINI_TILES_FALLBACK_URLS.map(base => `${base}/${tileInfo.region}/${tileInfo.filename}`)
        ];

        for (const url of urls) {
            try {
                console.log(`🔍 Intentando cargar tile desde: ${url}`);
                
                const response = await fetch(url);
                if (response.ok) {
                    const tileData = await response.arrayBuffer();
                    
                    // Cache del tile
                    this.cache.set(cacheKey, {
                        data: tileData,
                        timestamp: Date.now()
                    });
                    
                    console.log(`✅ Tile cargado exitosamente desde: ${url}`);
                    return tileData;
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando desde ${url}:`, error);
                continue;
            }
        }

        throw new Error(`No se pudo cargar el tile: ${tileInfo.filename}`);
    }

    extractElevationFromTile(tileData, lat, lon, tileInfo) {
        try {
            // Para archivos TIFF, necesitaríamos una librería específica
            // Por ahora, implementar un parser básico o usar aproximación
            
            // Calcular posición relativa dentro del tile
            const relativeX = (lon - tileInfo.bounds.west) / (tileInfo.bounds.east - tileInfo.bounds.west);
            const relativeY = (lat - tileInfo.bounds.south) / (tileInfo.bounds.north - tileInfo.bounds.south);
            
            // Para tiles TIFF reales, usar una librería como geotiff.js
            // Por ahora, simulación básica basada en posición
            const mockElevation = Math.sin(lat * 0.1) * Math.cos(lon * 0.1) * 1000 + 500;
            
            return Math.max(0, mockElevation);
            
        } catch (error) {
            console.error('❌ Error extrayendo elevación del tile:', error);
            return null;
        }
    }

    // Método para precargar tiles de una región
    async preloadRegion(region) {
        if (!this.tileIndex) {
            console.warn('⚠️ No hay índice de tiles disponible para precarga');
            return;
        }

        const regionTiles = this.tileIndex.tiles.filter(tile => tile.region === region);
        
        console.log(`🔄 Precargando ${regionTiles.length} tiles de la región: ${region}`);
        
        for (const tile of regionTiles) {
            try {
                await this.loadTile(tile);
            } catch (error) {
                console.warn(`⚠️ Error precargando tile ${tile.filename}:`, error);
            }
        }
        
        console.log(`✅ Precarga de región ${region} completada`);
    }

    // Estadísticas de cache
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.maxCacheSize,
            hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
        };
    }

    // Limpiar cache
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache de elevación limpiado');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ElevationHandler = ElevationHandler;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevationHandler;
}
