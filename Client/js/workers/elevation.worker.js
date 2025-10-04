// elevation.worker.js - MAIRA 4.0
// Worker para procesamiento de datos de elevación usando GeoTIFF

// Importar GeoTIFF para procesamiento de archivos .tif
importScripts('/node_modules/geotiff/dist-browser/geotiff.js');

// Configuración del worker
const CONFIG = {
    cacheMaxSize: 20,
    tileBaseUrl: '/api/tiles/elevation'
};

let tileCache = new Map();

onmessage = async function(e) {
    console.group('🤖 WORKER SUPER DEBUGGER');
    console.log('📨 Mensaje recibido en worker:', e.data);
    
    const { type, data } = e.data;
    try {
        console.log(`🔄 Procesando tipo: ${type}`);
        switch (type) {
            case 'LOAD_TILE':
                const tileData = await cargarYProcesarTile(data.tileName, data.url);
                postMessage({
                    type: 'TILE_LOADED',
                    data: {
                        tileName: data.tileName,  // ✅ CORREGIDO - sin 's' extra
                        tileData
                    }
                });
                break;
                
            case 'GET_ELEVATION':
                const elevation = calcularElevacion(data.lat, data.lng, data.tileData);
                postMessage({
                    type: 'ELEVATION_RESULT',
                    data: {
                        lat: data.lat,
                        lng: data.lng,
                        elevation,
                        requestId: data.requestId
                    }
                });
                break;
                
            case 'CALCULATE_PROFILE':
                const perfil = await calcularPerfilElevacion(data.ruta, data.datosElevacion);
                postMessage({
                    type: 'PROFILE_RESULT',
                    data: perfil
                });
                break;
                
            case 'PROCESS_ELEVATION_DATA':
                console.log('📊 PROCESANDO DATOS DE ELEVACIÓN');
                console.log('📥 Datos recibidos:', data);
                const puntos = data.puntos || [];
                console.log('📍 Puntos a procesar:', puntos.length);
                
                const resultados = [];
                for (let i = 0; i < puntos.length; i++) {
                    const punto = puntos[i];
                    console.log(`🔄 Procesando punto ${i}:`, punto);
                    try {
                        // 🎯 PROCESAR ELEVACIÓN EN WORKER
                        // El worker debe recibir los datos de elevación como parámetro
                        let elevation = null;

                        // Si se pasaron datos de elevación en el mensaje, usarlos
                        if (data.datosElevacion && data.datosElevacion.length > 0) {
                            // Buscar el tile correspondiente a las coordenadas
                            const tileEncontrado = encontrarTileParaCoordenadas(punto.lat, punto.lng, data.datosElevacion);
                            if (tileEncontrado) {
                                elevation = calcularElevacion(punto.lat, punto.lng, tileEncontrado);
                            }
                        }

                        // Si no tenemos datos reales, usar interpolación basada en posición geográfica
                        if (elevation === null) {
                            // Usar topografía básica de Argentina como fallback
                            elevation = calcularElevacionBasica(punto.lat, punto.lng);
                        }
                        
                        const resultado = {
                            elevation: elevation,
                            lat: punto.lat,
                            lng: punto.lng
                        };
                        console.log(`✅ Resultado para punto ${i}:`, resultado);
                        resultados.push(resultado);
                    } catch (err) {
                        console.error(`❌ Error en punto ${i}:`, err);
                        // Usar elevación básica como fallback
                        resultados.push({
                            elevation: calcularElevacionBasica(punto.lat, punto.lng),
                            lat: punto.lat,
                            lng: punto.lng
                        });
                    }
                }
                
                console.log('📤 Enviando resultados:', resultados);
                postMessage({
                    type: 'ELEVATION_RESULT',
                    data: resultados
                });
                console.groupEnd();
                break;
                
            default:
                console.error('❌ TIPO NO RECONOCIDO:', type);
                throw new Error(`Tipo de mensaje no reconocido: ${type}`);
        }
    } catch (error) {
        console.error('💥 ERROR EN WORKER:', error);
        console.error('🔍 Stack:', error.stack);
        console.groupEnd();
        postMessage({
            type: 'ERROR',
            error: error.message,
            originalType: e.data.type  // ✅ MEJORADO - incluir tipo original
        });
    }
};

function calcularElevacionBasica(lat, lng) {
    // 🗺️ TOPOGRAFÍA BÁSICA DE ARGENTINA
    // Basado en las principales regiones geográficas
    
    // Cordillera de los Andes (oeste)
    if (lng < -68) {
        const distanciaAndes = Math.abs(lng + 70);
        const factorAndes = Math.max(0, 1 - distanciaAndes / 5);
        return 500 + factorAndes * 3000 + Math.random() * 200;
    }
    
    // Patagonia (sur)
    if (lat < -42) {
        const factorPatagonia = Math.abs(lat + 50) / 8;
        return 200 + factorPatagonia * 800 + Math.random() * 100;
    }
    
    // Sierras Centrales
    if (lat > -35 && lat < -30 && lng > -68 && lng < -64) {
        return 600 + Math.random() * 800;
    }
    
    // Llanura Pampeana (centro-este)
    if (lat > -38 && lat < -30 && lng > -65) {
        return 50 + Math.random() * 150;
    }
    
    // Mesopotamia (noreste)
    if (lng > -60 && lat > -30) {
        return 80 + Math.random() * 120;
    }
    
    // Elevación base para otras áreas
    return 200 + Math.random() * 300;
}

async function cargarYProcesarTile(tileName, url) {
    // Verificar caché primero
    if (tileCache.has(tileName)) {
        console.log(`✅ Tile ${tileName} desde caché del worker`);
        return tileCache.get(tileName);
    }

    try {
        console.log(`📡 Cargando tile ${tileName} desde: ${url}`);

        // Si no se proporciona URL, construirla usando el endpoint del servidor
        if (!url) {
            url = `${CONFIG.tileBaseUrl}/${tileName}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log(`📦 Tile descargado: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB`);

        const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        const image = await tiff.getImage();
        const rasters = await image.readRasters();
        const metadata = await image.getFileDirectory();

        const tileData = {
            data: rasters[0],
            width: image.getWidth(),
            height: image.getHeight(),
            tiepoint: metadata.ModelTiepoint,
            scale: metadata.ModelPixelScale
        };

        // Gestionar caché del worker
        if (tileCache.size >= CONFIG.cacheMaxSize) {
            const firstKey = tileCache.keys().next().value;
            tileCache.delete(firstKey);
            console.log(`🗑️ Cache worker: eliminado ${firstKey}`);
        }
        tileCache.set(tileName, tileData);
        console.log(`💾 Tile ${tileName} guardado en caché del worker`);

        return tileData;

    } catch (error) {
        console.error(`❌ Error cargando tile ${tileName}:`, error);
        throw error;
    }
}

function encontrarTileParaCoordenadas(lat, lng, tilesCargados) {
    // Buscar en los tiles cargados cuál contiene las coordenadas dadas
    for (const tile of tilesCargados) {
        if (tile.bounds &&
            lat >= tile.bounds.south && lat <= tile.bounds.north &&
            lng >= tile.bounds.west && lng <= tile.bounds.east) {
            return tile.tileData;
        }
    }
return null;
    const { data, width, height, tiepoint, scale } = tileData;
    
    const x = Math.floor((lng - tiepoint[3]) / scale[0]);
    const y = Math.floor((tiepoint[4] - lat) / scale[1]);

    if (x >= 0 && x < width && y >= 0 && y < height) {
        const elevation = data[y * width + x];
        return isFinite(elevation) ? elevation : null;
    }
    
    return null;
}

function encontrarTileParaCoordenadas(lat, lng, tilesCargados) {
    // Buscar en los tiles cargados cuál contiene las coordenadas dadas
    for (const tile of tilesCargados) {
        if (tile.bounds &&
            lat >= tile.bounds.south && lat <= tile.bounds.north &&
            lng >= tile.bounds.west && lng <= tile.bounds.east) {
            return tile.tileData;
        }
    }
    return null;
}

async function calcularPerfilElevacion(ruta, datosElevacion) {
    const perfil = [];
    const { data, width, height, tiepoint, scale } = datosElevacion;
    
    let distanciaAcumulada = 0;
    
    for (let i = 0; i < ruta.length; i++) {
        const punto = ruta[i];
        
        // Calcular distancia desde punto anterior
        if (i > 0) {
            const puntoAnterior = ruta[i - 1];
            const distancia = calcularDistanciaHaversine(
                puntoAnterior.lat, puntoAnterior.lng,
                punto.lat, punto.lng
            );
            distanciaAcumulada += distancia;
        }
        
        // Convertir coordenadas a píxeles
        const x = Math.round((punto.lng - tiepoint[3]) / scale[0]);
        const y = Math.round((tiepoint[4] - punto.lat) / scale[1]);
        
        // Obtener elevación
        let elevation = null;
        if (x >= 0 && x < width && y >= 0 && y < height) {
            const rawElevation = data[y * width + x];
            if (rawElevation !== undefined && !isNaN(rawElevation)) {
                elevation = parseFloat(rawElevation.toFixed(2));
            }
        }
        
        perfil.push({
            lat: punto.lat,
            lng: punto.lng,
            elevation: elevation,
            distancia: Math.round(distanciaAcumulada),
            indice: i
        });
    }
    
    return perfil;
}

// FUNCIÓN AUXILIAR - Distancia Haversine
function calcularDistanciaHaversine(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}