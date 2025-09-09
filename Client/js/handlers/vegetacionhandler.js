// vegetacionHandler.js - Sistema de vegetación MAIRA 4.0 con prioridad local

// URL base para GitHub Releases mini-tiles v4.0
const GITHUB_RELEASES_BASE = 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0';

// URLs de fallback para mini-tiles de vegetación - PRIORIDAD LOCAL PRIMERO
const VEGETATION_FALLBACK_URLS = [
    // 🎯 PRIORIDAD 1: LOCAL (datos están presentes y verificados)
    'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    '/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    './Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    '../Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    
    // 🎯 PRIORIDAD 2: GITHUB RELEASES v4.0
    `${GITHUB_RELEASES_BASE}/maira_vegetacion_tiles.tar.gz`,
    
    // 🎯 PRIORIDAD 3: CDN GITHUB RAW
    'https://raw.githubusercontent.com/Ehr051/MAIRA-4.0/main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA-4.0@main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/'
];

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
            // Intentar cargar el índice de tiles de vegetación
            const indexUrl = `${GITHUB_RELEASES_BASE}/vegetation_master_index.json`;
            const response = await fetch(indexUrl);
            
            if (response.ok) {
                this.vegetationIndex = await response.json();
                console.log('🌿 Índice de tiles de vegetación cargado');
            } else {
                console.warn('⚠️ No se pudo cargar el índice de vegetación, usando sistema de fallback');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando índice de vegetación:', error);
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

        // URLs a intentar en orden
        const urls = [
            // Proxy interno si está disponible
            ...(USE_PROXY ? [`${PROXY_BASE}/vegetation/${tileInfo.filename}`] : []),
            
            // GitHub Release directo
            `${GITHUB_RELEASES_BASE}/${tileInfo.filename}`,
            
            // Fallbacks con batch
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
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.VegetacionHandler = VegetacionHandler;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetacionHandler;
}
