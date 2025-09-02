/**
 * 🌿 VEGETATION HANDLER - MAIRA 4.0
 * Manejo optimizado de datos NDVI para análisis de vegetación en simulaciones militares
 * Compatible con sistema de mini-tiles para eficiencia en GitHub y rendimiento web
 */

const vegetacionHandler = (function() {
    let tileIndex = null;
    const tileCache = new Map();
    let loadingPromises = new Map(); // Para evitar cargas duplicadas
    
    // Configuración de rutas para mini-tiles
    const VEGETATION_CONFIG = {
        basePath: 'Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/',
        masterIndex: 'vegetation_master_index.json',
        indexSuffix: '_index.json'
    };

    // Configuración de CDN
    const CDN_CONFIG = {
        github: {
            base: 'https://raw.githubusercontent.com/Ehr051/MAIRA/main/',
            active: true
        },
        jsdelivr: {
            base: 'https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/',
            active: false // Como fallback
        }
    };

    /**
     * Carga el índice maestro de vegetación NDVI
     */
    async function cargarIndice() {
        if (tileIndex) return tileIndex; // Ya cargado
        
        console.log("🌿 Iniciando carga de índice maestro de vegetación NDVI...");
        
        try {
            const masterIndexPath = VEGETATION_CONFIG.basePath + VEGETATION_CONFIG.masterIndex;
            const response = await fetch(masterIndexPath);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const masterIndex = await response.json();
            
            // Adaptar estructura para compatibilidad con código existente
            tileIndex = {
                tiles: masterIndex.tiles,
                packages: masterIndex.packages,
                metadata: {
                    data_type: masterIndex.data_type,
                    total_packages: masterIndex.total_packages,
                    total_tiles: masterIndex.total_tiles,
                    version: masterIndex.version
                }
            };
            
            console.log(`🌿 Índice maestro cargado: ${masterIndex.total_tiles} tiles en ${masterIndex.total_packages} paquetes`);
            return tileIndex;
            
        } catch (error) {
            console.error("❌ Error cargando índice maestro de vegetación:", error);
            throw error;
        }
    }

    /**
     * Construye URL del CDN según la configuración
     */
    function construirUrlCDN(archivo) {
        // Priorizar GitHub Direct (inmediato)
        if (CDN_CONFIG.github.active) {
            return CDN_CONFIG.github.base + archivo;
        }
        
        // Fallback a JSDelivr si está activo
        if (CDN_CONFIG.jsdelivr.active) {
            return CDN_CONFIG.jsdelivr.base + archivo;
        }
        
        // Último fallback (no debería llegar aquí)
        return CDN_CONFIG.github.base + archivo;
    }

    function encontrarTileParaPunto(lat, lng) {
        for (const [tileKey, tileInfo] of Object.entries(tileIndex.tiles)) {
            const bounds = tileInfo.bounds; // Nueva estructura con bounds directo
            if (lat <= bounds.north && lat >= bounds.south && lng >= bounds.west && lng <= bounds.east) {
                return tileKey;
            }
        }
        return null;
    }

    async function cargarTile(tileKey) {
        // Verificar caché primero sin log para evitar spam
        if (tileCache.has(tileKey)) {
            return tileCache.get(tileKey);
        }

        console.log(`🌿 Iniciando carga de tile de vegetación: ${tileKey}`);

        if (!tileIndex.tiles[tileKey]) {
            console.warn(`⚠️ No se encontró información para el tile ${tileKey} en el índice`);
            return null;
        }

        const tileInfo = tileIndex.tiles[tileKey];
        const packageName = tileInfo.package;
        
        if (!tileIndex.packages[packageName]) {
            console.error(`❌ No se encontró paquete ${packageName} para el tile ${tileKey}`);
            return null;
        }

        try {
            const packageInfo = tileIndex.packages[packageName];
            const archivoTar = packageInfo.path;
            
            console.log(`🗺️ Tile ${tileKey} en paquete: ${packageName}`);
            console.log(`📦 Buscando en archivo: ${archivoTar}`);

            // Intentar extraer el tile del servidor
            const tileData = await extraerTileDelServidor(tileInfo.filename, archivoTar);
            
            if (tileData) {
                console.log(`✅ Tile ${tileKey} de vegetación cargado exitosamente`);
                tileCache.set(tileKey, tileData);
                return tileData;
            } else {
                console.warn(`⚠️ No se pudo cargar el tile ${tileKey} desde el servidor`);
                return null;
            }

        } catch (error) {
            console.error(`❌ Error cargando tile de vegetación ${tileKey}:`, error);
            return null;
        }
    }

    async function extraerTileDelServidor(filename, archivoTar) {
        try {
            const response = await fetch('/extraer_tile_vegetacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    archivo_tar: archivoTar,
                    tile_filename: filename
                })
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.tile_data) {
                return {
                    data: new Int16Array(data.tile_data.data),
                    width: data.tile_data.width,
                    height: data.tile_data.height,
                    bounds: data.tile_data.bounds
                };
            } else {
                console.error("❌ Error en respuesta del servidor:", data.error);
                return null;
            }

        } catch (error) {
            console.error("❌ Error extrayendo tile del servidor:", error);
            return null;
        }
    }

    /**
     * Obtiene información de vegetación para un punto específico
     */
    async function obtenerVegetacionEnPunto(lat, lng) {
        try {
            await cargarIndice();
            
            const tileKey = encontrarTileParaPunto(lat, lng);
            if (!tileKey) {
                console.warn(`⚠️ No se encontró tile para coordenadas: ${lat}, ${lng}`);
                return null;
            }

            const tile = await cargarTile(tileKey);
            if (!tile) {
                console.error(`❌ No se pudo cargar tile ${tileKey}`);
                return null;
            }

            const bounds = tileIndex.tiles[tileKey].bounds;
            
            // Calcular posición del píxel dentro del tile
            const x = (lng - bounds.west) / (bounds.east - bounds.west);
            const y = (bounds.north - lat) / (bounds.north - bounds.south);
            
            const pixelX = Math.floor(x * tile.width);
            const pixelY = Math.floor(y * tile.height);
            
            if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
                console.warn(`⚠️ Píxel fuera de rango: ${pixelX}, ${pixelY}`);
                return null;
            }

            // Extraer valor NDVI (escalar de entero a flotante)
            const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
            
            return interpretarNDVI(ndviValue);

        } catch (error) {
            console.error("❌ Error obteniendo vegetación en punto:", error);
            return null;
        }
    }

    function interpretarNDVI(ndvi) {
        if (ndvi < 0) return { tipo: 'Agua o nube', altura: 'N/A', densidad: 'N/A' };
        if (ndvi < 0.2) return { tipo: 'Suelo desnudo o urbano', altura: 'Baja', densidad: 'Muy baja' };
        if (ndvi < 0.4) return { tipo: 'Vegetación escasa', altura: 'Baja', densidad: 'Baja' };
        if (ndvi < 0.6) return { tipo: 'Pradera o arbustos', altura: 'Media', densidad: 'Media' };
        if (ndvi < 0.8) return { tipo: 'Bosque mixto', altura: 'Alta', densidad: 'Alta' };
        return { tipo: 'Bosque denso', altura: 'Muy alta', densidad: 'Muy alta' };
    }

    /**
     * Calcula vegetación promedio en un área
     */
    async function calcularVegetacionPromedio(coordenadas) {
        try {
            const muestras = [];
            
            for (const coord of coordenadas) {
                const vegetacion = await obtenerVegetacionEnPunto(coord.lat, coord.lng);
                if (vegetacion) {
                    muestras.push(vegetacion);
                }
            }
            
            if (muestras.length === 0) {
                return null;
            }
            
            // Calcular promedios (simplificado)
            const tiposCount = {};
            muestras.forEach(v => {
                tiposCount[v.tipo] = (tiposCount[v.tipo] || 0) + 1;
            });
            
            const tipoMasComun = Object.keys(tiposCount).reduce((a, b) => 
                tiposCount[a] > tiposCount[b] ? a : b
            );
            
            return {
                tipo: tipoMasComun,
                muestras: muestras.length,
                variedad: Object.keys(tiposCount).length
            };
            
        } catch (error) {
            console.error("❌ Error calculando vegetación promedio:", error);
            return null;
        }
    }

    /**
     * Calcula transitabilidad basada en vegetación y pendiente
     */
    async function calcularTransitabilidad(vegetacion, puntoA, puntoB) {
        let factorVegetacion = 1;
        let factorPendiente = 1;

        // Calcular pendiente de forma async
        const pendientePorcentaje = await calcularPendiente(puntoA, puntoB);

        // Factor de vegetación
        switch (vegetacion.tipo) {
            case 'Suelo desnudo o urbano':
                factorVegetacion = 1;
                break;
            case 'Vegetación escasa':
                factorVegetacion = 0.9;
                break;
            case 'Pradera o arbustos':
                factorVegetacion = 0.75;
                break;
            case 'Bosque mixto':
                factorVegetacion = 0.6;
                break;
            case 'Bosque denso':
                factorVegetacion = 0.4;
                break;
            default:
                factorVegetacion = 0;  // Agua o nube (intransitable)
        }

        // Mapeo de porcentaje de pendiente a un factor de transitabilidad
        if (pendientePorcentaje < 5) {
            factorPendiente = 1; // Llano
        } else if (pendientePorcentaje < 15) {
            factorPendiente = 0.9; // Pendiente leve
        } else if (pendientePorcentaje < 30) {
            factorPendiente = 0.6; // Pendiente moderada
        } else if (pendientePorcentaje < 50) {
            factorPendiente = 0.4; // Pendiente fuerte
        } else if (pendientePorcentaje < 100) {
            factorPendiente = 0.2; // Muy fuerte
        } else {
            factorPendiente = 0; // Intransitable
        }

        return factorVegetacion * factorPendiente;
    }

    /**
     * Calcula pendiente entre dos puntos usando datos de elevación
     */
    async function calcularPendiente(puntoA, puntoB) {
        try {
            // Usar elevationHandler si está disponible
            if (window.elevationHandler) {
                const elevA = await window.elevationHandler.obtenerElevacion(puntoA.lat, puntoA.lng);
                const elevB = await window.elevationHandler.obtenerElevacion(puntoB.lat, puntoB.lng);
                
                if (elevA !== null && elevB !== null) {
                    const distanciaHorizontal = calcularDistancia(puntoA, puntoB);
                    const diferenciaVertical = Math.abs(elevB - elevA);
                    const pendientePorcentaje = (diferenciaVertical / distanciaHorizontal) * 100;
                    return pendientePorcentaje;
                }
            }
            
            // Fallback: asumir terreno llano si no hay datos de elevación
            return 0;
            
        } catch (error) {
            console.warn("⚠️ Error calculando pendiente:", error);
            return 0; // Asumir terreno llano en caso de error
        }
    }

    /**
     * Calcula distancia en metros entre dos puntos geográficos
     */
    function calcularDistancia(puntoA, puntoB) {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = (puntoB.lat - puntoA.lat) * Math.PI / 180;
        const dLng = (puntoB.lng - puntoA.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(puntoA.lat * Math.PI / 180) * Math.cos(puntoB.lat * Math.PI / 180) *
                 Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Función de prueba para verificar funcionamiento
     */
    async function probarVegetacionHandler() {
        console.log("🧪 Iniciando prueba del vegetacionHandler...");
        
        try {
            await cargarIndice();
            console.log("✅ Índice cargado correctamente");
            
            // Probar con coordenadas de Buenos Aires
            const vegetacion = await obtenerVegetacionEnPunto(-34.6118, -58.3960);
            if (vegetacion) {
                console.log("✅ Vegetación obtenida:", vegetacion);
            } else {
                console.log("⚠️ No se pudo obtener vegetación para Buenos Aires");
            }
            
        } catch (error) {
            console.error("❌ Error en prueba:", error);
        }
    }

    // API pública
    return {
        cargarIndice,
        obtenerVegetacionEnPunto,
        calcularVegetacionPromedio,
        calcularTransitabilidad,
        calcularPendiente,
        probarVegetacionHandler
    };
})();

// Hacer disponible globalmente
window.vegetacionHandler = vegetacionHandler;
