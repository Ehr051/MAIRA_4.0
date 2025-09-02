/**
 * 🌿 VEGETATION WORKER - MAIRA 4.0
 * Worker dedicado para procesamiento de datos NDVI de vegetación
 * Sigue el patrón de elevation.worker.js para consistencia arquitectónica
 */

importScripts('/Client/Libs/geotiff.js');

// Cache de datos de vegetación en el worker
const vegetationCache = new Map();

// Configuración de vegetación
const VEGETATION_CONFIG = {
    cacheMaxSize: 50,
    noDataValue: -9999,
    scaleFactor: 10000,
    ndviRange: [-1, 1]
};

// URLs de fallback para mini-tiles
const VEGETATION_URLS = [
    'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
    'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/'
];

/**
 * Procesar datos NDVI desde GeoTIFF
 */
async function procesarNDVI(arrayBuffer, coords) {
    try {
        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const data = await image.readRasters();
        
        const geoKeys = image.getGeoKeys();
        const pixelScale = image.getFileDirectory().ModelPixelScale;
        const tiePoint = image.getFileDirectory().ModelTiepoint;
        
        // Verificar formato de datos
        if (!pixelScale || !tiePoint) {
            throw new Error('GeoTIFF sin información georeferencial válida');
        }
        
        const width = image.getWidth();
        const height = image.getHeight();
        
        // Calcular coordenadas del pixel
        const pixelX = Math.floor((coords.lng - tiePoint[3]) / pixelScale[0]);
        const pixelY = Math.floor((tiePoint[4] - coords.lat) / pixelScale[1]);
        
        // Verificar límites
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
            return {
                success: false,
                error: 'Coordenadas fuera del rango del tile',
                ndvi: null,
                vegetationLevel: 'Sin datos'
            };
        }
        
        // Obtener valor NDVI crudo
        const index = pixelY * width + pixelX;
        let ndviRaw = data[0][index];
        
        // Verificar no-data
        if (ndviRaw === VEGETATION_CONFIG.noDataValue || ndviRaw === null || ndviRaw === undefined) {
            return {
                success: true,
                ndvi: null,
                vegetationLevel: 'Sin datos',
                raw: ndviRaw
            };
        }
        
        // Convertir a NDVI real (escala -1 a 1)
        const ndvi = ndviRaw / VEGETATION_CONFIG.scaleFactor;
        
        // Clasificar vegetación según NDVI
        const vegetationLevel = clasificarVegetacion(ndvi);
        
        return {
            success: true,
            ndvi: Math.round(ndvi * 1000) / 1000, // 3 decimales
            vegetationLevel,
            raw: ndviRaw,
            coordinates: { lat: coords.lat, lng: coords.lng },
            pixel: { x: pixelX, y: pixelY }
        };
        
    } catch (error) {
        console.error('❌ Error procesando NDVI:', error);
        return {
            success: false,
            error: error.message,
            ndvi: null,
            vegetationLevel: 'Error'
        };
    }
}

/**
 * Clasificar vegetación según valor NDVI
 */
function clasificarVegetacion(ndvi) {
    if (ndvi === null || ndvi === undefined) return 'Sin datos';
    
    if (ndvi < -0.1) return 'Agua/Nieve';
    if (ndvi < 0.1) return 'Suelo desnudo/Roca';
    if (ndvi < 0.2) return 'Vegetación muy escasa';
    if (ndvi < 0.3) return 'Vegetación escasa';
    if (ndvi < 0.4) return 'Vegetación moderada';
    if (ndvi < 0.5) return 'Vegetación densa';
    if (ndvi < 0.7) return 'Vegetación muy densa';
    return 'Vegetación extrema';
}

/**
 * Cargar tile de vegetación
 */
async function cargarTileVegetacion(tileUrl) {
    // Verificar cache
    if (vegetationCache.has(tileUrl)) {
        return vegetationCache.get(tileUrl);
    }
    
    // Limpiar cache si está lleno
    if (vegetationCache.size >= VEGETATION_CONFIG.cacheMaxSize) {
        const firstKey = vegetationCache.keys().next().value;
        vegetationCache.delete(firstKey);
    }
    
    try {
        // Intentar cargar desde múltiples URLs
        let arrayBuffer = null;
        let lastError = null;
        
        for (const baseUrl of VEGETATION_URLS) {
            const fullUrl = tileUrl.startsWith('http') ? tileUrl : `${baseUrl}${tileUrl}`;
            
            try {
                const response = await fetch(fullUrl);
                if (response.ok) {
                    arrayBuffer = await response.arrayBuffer();
                    break;
                }
            } catch (error) {
                lastError = error;
                continue;
            }
        }
        
        if (!arrayBuffer) {
            throw lastError || new Error('No se pudo cargar el tile desde ninguna URL');
        }
        
        // Cachear resultado
        vegetationCache.set(tileUrl, arrayBuffer);
        return arrayBuffer;
        
    } catch (error) {
        console.error(`❌ Error cargando tile ${tileUrl}:`, error);
        throw error;
    }
}

/**
 * Manejador principal de mensajes del worker
 */
self.onmessage = async function(e) {
    const { id, type, coords, tileUrl } = e.data;
    
    try {
        switch (type) {
            case 'getVegetation':
                const arrayBuffer = await cargarTileVegetacion(tileUrl);
                const resultado = await procesarNDVI(arrayBuffer, coords);
                
                self.postMessage({
                    id,
                    success: true,
                    data: resultado
                });
                break;
                
            case 'clearCache':
                vegetationCache.clear();
                self.postMessage({
                    id,
                    success: true,
                    message: 'Cache de vegetación limpiado'
                });
                break;
                
            case 'getCacheInfo':
                self.postMessage({
                    id,
                    success: true,
                    data: {
                        size: vegetationCache.size,
                        maxSize: VEGETATION_CONFIG.cacheMaxSize,
                        keys: Array.from(vegetationCache.keys())
                    }
                });
                break;
                
            default:
                throw new Error(`Tipo de operación no reconocido: ${type}`);
        }
        
    } catch (error) {
        console.error('❌ Error en vegetation worker:', error);
        self.postMessage({
            id,
            success: false,
            error: error.message
        });
    }
};

// Mensaje de inicialización
console.log('🌿 Vegetation Worker inicializado correctamente');
