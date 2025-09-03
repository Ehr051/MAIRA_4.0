/**
 * Mini-tiles Loader v3.0 para MAIRA
 * Carga inteligente de tiles desde GitHub Release tiles-v3.0
 */

class MiniTilesLoader {
    constructor() {
                // URLs de fallback para disponibilidad
        this.baseUrls = [
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/',     // GitHub Release (archivos sueltos) - PRINCIPAL
            '../../mini_tiles_github/',                                           // Local dev con estructura (para testing)
            'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/mini_tiles_github/'   // CDN (backup, con estructura)
        ];
        
        this.masterIndex = null;
        this.provinciaIndices = new Map();
        this.tileCache = new Map();
        this.loadingPromises = new Map();
        
        console.log('🔧 Mini-tiles Loader v3.0 inicializado');
    }

    /**
     * Inicializa el loader cargando el índice maestro
     */
    async initialize() {
        if (this.masterIndex) return;
        
        console.log('📋 Cargando índice maestro de mini-tiles...');
        
        try {
            const response = await this.fetchWithFallback('master_mini_tiles_index.json');
            this.masterIndex = await response.json();
            
            console.log(`✅ Índice maestro cargado: ${this.masterIndex.total_provincias} provincias, ${this.masterIndex.total_tar_files} archivos TAR`);
        } catch (error) {
            console.error('❌ Error cargando índice maestro:', error);
            throw error;
        }
    }

    /**
     * Fetch con fallback a múltiples URLs
     */
    async fetchWithFallback(filename) {
        let lastError;
        
        for (let i = 0; i < this.baseUrls.length; i++) {
            const url = this.baseUrls[i] + filename;
            
            try {
                console.log(`🔄 Intentando cargar: ${url}`);
                const response = await fetch(url);
                
                if (response.ok) {
                    console.log(`✅ Carga exitosa desde: ${this.baseUrls[i]}`);
                    
                    // Verificar que sea JSON válido
                    const text = await response.text();
                    console.log(`📄 Contenido recibido (primeros 100 chars): ${text.substring(0, 100)}`);
                    
                    try {
                        const json = JSON.parse(text);
                        return { json: () => Promise.resolve(json) };
                    } catch (jsonError) {
                        console.error(`❌ Error parsing JSON: ${jsonError.message}`);
                        console.error(`📄 Contenido completo: ${text}`);
                        throw new Error(`Invalid JSON: ${jsonError.message}`);
                    }
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
            } catch (error) {
                lastError = error;
                console.log(`⚠️ Fallo en ${this.baseUrls[i]}: ${error.message}`);
                
                if (i < this.baseUrls.length - 1) {
                    console.log(`🔄 Probando siguiente URL...`);
                }
            }
        }
        
        throw new Error(`Falló carga de ${filename} desde todas las URLs. Último error: ${lastError.message}`);
    }

    /**
     * Obtiene el tile para coordenadas específicas
     */
    async getTile(lat, lon, tipo = 'altimetria') {
        await this.initialize();
        
        // Encontrar provincia para estas coordenadas
        const provincia = this.getProvinciaForCoordinate(lat, lon);
        if (!provincia) {
            console.warn(`⚠️ No se encontró provincia para ${lat}, ${lon}`);
            return null;
        }

        // Cargar índice de la provincia si no está cargado
        if (!this.provinciaIndices.has(provincia)) {
            await this.loadProvinciaIndex(provincia);
        }

        // Buscar el tile específico
        const tile = await this.findTileInProvincia(provincia, lat, lon);
        if (!tile) {
            console.warn(`⚠️ No se encontró tile para ${lat}, ${lon} en ${provincia}`);
            return null;
        }

        // Cargar el tile desde el TAR
        return this.loadTileFromTar(provincia, tile);
    }

    /**
     * Determina la provincia basada en coordenadas (simplificado)
     */
    getProvinciaForCoordinate(lat, lon) {
        // Mapeo aproximado de coordenadas a provincias
        if (lat < -45) return 'sur';           // Tierra del Fuego, Santa Cruz
        if (lat < -35) return 'patagonia';     // Patagonia
        if (lat < -29) return 'centro';        // Centro
        if (lat < -24) return 'centro_norte';  // Centro-Norte
        return 'norte';                        // Norte argentino
    }

    /**
     * Carga el índice de una provincia específica
     */
    async loadProvinciaIndex(provincia) {
        const filename = `${provincia}_mini_tiles_index.json`;
        
        try {
            console.log(`📄 Cargando índice de ${provincia}...`);
            const response = await this.fetchWithFallback(filename);
            const index = await response.json();
            
            this.provinciaIndices.set(provincia, index);
            console.log(`✅ Índice de ${provincia} cargado: ${index.total_tiles} tiles`);
        } catch (error) {
            console.error(`❌ Error cargando índice de ${provincia}:`, error);
            throw error;
        }
    }

    /**
     * Encuentra el tile específico dentro de una provincia
     */
    async findTileInProvincia(provincia, lat, lon) {
        const provinciaIndex = this.provinciaIndices.get(provincia);
        if (!provinciaIndex) return null;

        // Buscar tile que contenga las coordenadas
        for (const [tileId, tileData] of Object.entries(provinciaIndex.tiles)) {
            const bounds = tileData.bounds;
            
            if (lat >= bounds.south && lat <= bounds.north &&
                lon >= bounds.west && lon <= bounds.east) {
                return tileData;
            }
        }

        return null;
    }

    /**
     * Carga un tile específico desde su archivo TAR
     */
    async loadTileFromTar(provincia, tileData) {
        const cacheKey = `${provincia}_${tileData.id}`;
        
        // Verificar cache
        if (this.tileCache.has(cacheKey)) {
            return this.tileCache.get(cacheKey);
        }

        // Verificar si ya está cargando
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Crear promesa de carga
        const loadPromise = this.loadTileFromTarInternal(provincia, tileData, cacheKey);
        this.loadingPromises.set(cacheKey, loadPromise);

        try {
            const result = await loadPromise;
            this.tileCache.set(cacheKey, result);
            return result;
        } finally {
            this.loadingPromises.delete(cacheKey);
        }
    }

    /**
     * Carga interna del tile desde TAR
     */
    async loadTileFromTarInternal(provincia, tileData, cacheKey) {
        try {
            console.log(`📦 Cargando ${tileData.filename} desde ${tileData.tar_file}...`);
            
            // Descargar archivo TAR - NOTA: archivos están sueltos en GitHub Release
            const tarResponse = await this.fetchWithFallback(tileData.tar_file);
            const tarBuffer = await tarResponse.arrayBuffer();
            
            // Extraer el TIF específico del TAR usando una librería de TAR
            // Por ahora, simplificamos retornando la URL del TAR
            const tarUrl = tarResponse.url;
            
            console.log(`✅ Tile ${tileData.id} cargado exitosamente`);
            
            return {
                id: tileData.id,
                bounds: tileData.bounds,
                tarUrl: tarUrl,
                filename: tileData.filename,
                provincia: provincia
            };
            
        } catch (error) {
            console.error(`❌ Error cargando tile ${tileData.id}:`, error);
            throw error;
        }
    }

    /**
     * Pre-carga tiles de una región específica
     */
    async preloadRegion(bounds) {
        console.log('🔄 Pre-cargando región...', bounds);
        
        const { north, south, east, west } = bounds;
        const promises = [];

        // Pre-cargar tiles en paralelo para la región
        for (let lat = south; lat <= north; lat += 0.5) {
            for (let lon = west; lon <= east; lon += 0.5) {
                promises.push(this.getTile(lat, lon).catch(err => null));
            }
        }

        const results = await Promise.all(promises);
        const loadedCount = results.filter(r => r !== null).length;
        
        console.log(`✅ Pre-carga completada: ${loadedCount} tiles cargados`);
        return loadedCount;
    }

    /**
     * Limpia la cache de tiles
     */
    clearCache() {
        this.tileCache.clear();
        this.loadingPromises.clear();
        console.log('🧹 Cache de tiles limpiada');
    }

    /**
     * Obtiene estadísticas del loader
     */
    getStats() {
        return {
            masterIndexLoaded: !!this.masterIndex,
            provinciaIndicesLoaded: this.provinciaIndices.size,
            tilesInCache: this.tileCache.size,
            activeLoading: this.loadingPromises.size,
            totalProvincias: this.masterIndex?.total_provincias || 0,
            totalTarFiles: this.masterIndex?.total_tar_files || 0
        };
    }
}

// Instancia global
window.miniTilesLoader = new MiniTilesLoader();

// Función de conveniencia para uso directo
window.getTile = async (lat, lon, tipo = 'altimetria') => {
    return window.miniTilesLoader.getTile(lat, lon, tipo);
};

console.log('🚀 Mini-tiles Loader v3.0 disponible globalmente');

// Export para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniTilesLoader;
}
