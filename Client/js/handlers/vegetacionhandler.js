/**
 * 🌿 VEGETATION HANDLER - MAIRA 4.0
 * Manejo optimizado de datos NDVI siguiendo patrón CDN como elevationHandler
 * Compatible con sistema de mini-tiles para eficiencia CDN y rendimiento web
 */

        // 🌿 URLs OPTIMIZADAS PARA CDN GITHUB RELEASES - VEGETACIÓN
        const VEGETATION_GITHUB_RELEASES = [
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_vegetation_index.json',
            'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/'
        ];

        const VEGETATION_FALLBACK_URLS = [
            ...VEGETATION_GITHUB_RELEASES,
            'Client/Libs/datos_argentina/Vegetacion_NDVI_Tiles/',
            '/Client/Libs/datos_argentina/Vegetacion_NDVI_Tiles/',
            './Client/Libs/datos_argentina/Vegetacion_NDVI_Tiles/',
            '../Client/Libs/datos_argentina/Vegetacion_NDVI_Tiles/',
            'https://raw.githubusercontent.com/Ehr051/MAIRA/main/Client/Libs/datos_argentina/Vegetacion_NDVI_Tiles/'
        ];

// URL base para GitHub Releases vegetación
const GITHUB_VEGETATION_BASE = '/api/proxy/github-vegetation';

// Variables globales
let vegetationIndex;
let vegetationIndiceCargado = false;
const vegetationCache = new Map();

// Cargar el índice maestro de vegetación al iniciar
const cargarIndiceVegetacion = new Promise((resolve, reject) => {
    console.log('🌿 Intentando cargar vegetation_master_index.json...');
    
    // Función para intentar cargar desde una URL
    const intentarCarga = async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} para ${url}`);
        }
        return response.json();
    };
    
    // Lista de URLs para intentar
    const urls = [
        `${GITHUB_VEGETATION_BASE}/vegetation_master_index.json`,
        'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/vegetation_master_index.json',
        ...VEGETATION_FALLBACK_URLS.map(url => url.endsWith('/') ? `${url}vegetation_master_index.json` : `${url}/vegetation_master_index.json`)
    ];
    
    // Intentar cargar desde cada URL secuencialmente
    (async () => {
        let lastError = null;
        
        for (const url of urls) {
            try {
                console.log(`🌿 Intentando cargar vegetación desde: ${url}`);
                const data = await intentarCarga(url);
                
                console.log('🎯 Índice vegetación cargado exitosamente desde:', url);
                
                // Validar estructura del índice
                if (data.packages && data.tiles && typeof data.packages === 'object') {
                    console.log('✅ Formato vegetation master index detectado');
                    vegetationIndex = data;
                    vegetationIndiceCargado = true;
                    console.log('Índice de vegetación cargado correctamente.');
                    resolve();
                    return;
                } else {
                    throw new Error('El índice no tiene la estructura esperada (falta packages/tiles).');
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Error cargando vegetación desde ${url}:`, error.message);
                continue;
            }
        }
        
        // Si llegamos aquí, todas las URLs fallaron
        console.error('❌ Error cargando vegetación desde todas las URLs:', lastError);
        reject(lastError);
    })();
});

// Función para cargar datos de vegetación
async function cargarDatosVegetacion(bounds) {
    if (!vegetationIndiceCargado) {
        console.warn('Esperando a que el índice de vegetación se cargue.');
        await cargarIndiceVegetacion;
    }

    if (!vegetationIndex) {
        console.warn('El índice de vegetación no se ha cargado aún.');
        return null;
    }

    try {
        // Buscar el tile que corresponde a la región especificada
        const tile = await buscarTileVegetacionCorrespondiente(bounds);

        if (!tile) {
            console.warn('No se encontró un tile de vegetación correspondiente a la región especificada.');
            return null;
        }

        console.log(`🌿 Tile vegetación encontrado: ${tile.name} (paquete: ${tile.package})`);
        
        // Construir URLs para intentar cargar el tile
        const packageInfo = vegetationIndex.packages[tile.package];
        if (!packageInfo) {
            console.error(`❌ No se encontró información del paquete ${tile.package}`);
            return null;
        }

        // URLs a intentar en orden de preferencia
        const urlsToTry = [
            `Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${packageInfo.path}`,
            `https://cdn.jsdelivr.net/gh/Ehr051/MAIRA@main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${packageInfo.path}`,
            `https://raw.githubusercontent.com/Ehr051/MAIRA/main/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/${packageInfo.path}`
        ];
        
        // Intentar extraer el tile del paquete TAR.GZ
        for (const tarUrl of urlsToTry) {
            try {
                console.log(`🌿 Intentando extraer tile desde: ${tarUrl}`);
                const tileData = await extractVegetationTileFromTar(tarUrl, tile.filename);
                if (tileData) {
                    console.log(`✅ Tile vegetación cargado exitosamente desde: ${tarUrl}`);
                    return tileData;
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando vegetación desde ${tarUrl}:`, error.message);
                continue;
            }
        }
        
        console.error(`❌ No se pudo cargar el tile de vegetación desde ninguna URL para ${tile.name}`);
        return null;
        
    } catch (error) {
        console.error('Error al cargar datos de vegetación:', error);
        return null;
    }
}

// Función para extraer tile de vegetación desde TAR.GZ
async function extractVegetationTileFromTar(tarUrl, tileFilename) {
    try {
        // Por ahora, usar endpoint del servidor para extracción
        const response = await fetch('/extraer_tile_vegetacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                archivo_tar: tarUrl,
                tile_filename: tileFilename
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
        console.error("❌ Error extrayendo tile de vegetación:", error);
        return null;
    }
}

// Función para buscar el tile correspondiente en el índice de vegetación
async function buscarTileVegetacionCorrespondiente(bounds) {
    if (!vegetationIndex || !vegetationIndex.tiles) {
        return null;
    }
    
    // Buscar en tiles de vegetación
    for (const [tileKey, tileInfo] of Object.entries(vegetationIndex.tiles)) {
        if (!tileInfo.bounds) {
            continue;
        }
        
        const { north, south, east, west } = tileInfo.bounds;

        if (
            bounds.north <= north &&
            bounds.south >= south &&
            bounds.east <= east &&
            bounds.west >= west
        ) {
            console.log(`🎯 Tile vegetación encontrado: ${tileKey}`);
            return {
                name: tileKey,
                filename: tileInfo.filename,
                package: tileInfo.package,
                bounds: tileInfo.bounds,
                size: tileInfo.size,
                original_tile: tileInfo.original_tile
            };
        }
    }
    
    console.log(`❌ No se encontró tile de vegetación para bounds:`, bounds);
    return null;
}

// Función para obtener vegetación en un punto específico
async function obtenerVegetacionEnPunto(lat, lng) {
    try {
        if (!vegetationIndiceCargado) {
            await cargarIndiceVegetacion;
        }
        
        const bounds = { north: lat, south: lat, east: lng, west: lng };
        const tileData = await cargarDatosVegetacion(bounds);
        
        if (!tileData) {
            console.warn(`No se pudieron cargar los datos de vegetación para lat=${lat}, lng=${lng}`);
            return null;
        }

        const { data, width, height, bounds: tileBounds } = tileData;
        
        // Calcular posición del píxel dentro del tile
        const x = (lng - tileBounds.west) / (tileBounds.east - tileBounds.west);
        const y = (tileBounds.north - lat) / (tileBounds.north - tileBounds.south);
        
        const pixelX = Math.floor(x * width);
        const pixelY = Math.floor(y * height);
        
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) {
            console.warn(`⚠️ Píxel fuera de rango: ${pixelX}, ${pixelY}`);
            return null;
        }

        // Extraer valor NDVI (escalar de entero a flotante)
        const ndviValue = data[pixelY * width + pixelX] / 10000;
        
        return interpretarNDVI(ndviValue);

    } catch (error) {
        console.error("❌ Error obteniendo vegetación en punto:", error);
        return null;
    }
}

// Función para interpretar valores NDVI
function interpretarNDVI(ndvi) {
    if (ndvi < 0) return { tipo: 'Agua o nube', altura: 'N/A', densidad: 'N/A' };
    if (ndvi < 0.2) return { tipo: 'Suelo desnudo o urbano', altura: 'Baja', densidad: 'Muy baja' };
    if (ndvi < 0.4) return { tipo: 'Vegetación escasa', altura: 'Baja', densidad: 'Baja' };
    if (ndvi < 0.6) return { tipo: 'Pradera o arbustos', altura: 'Media', densidad: 'Media' };
    if (ndvi < 0.8) return { tipo: 'Bosque mixto', altura: 'Alta', densidad: 'Alta' };
    return { tipo: 'Bosque denso', altura: 'Muy alta', densidad: 'Muy alta' };
}

// Función para calcular vegetación promedio en un área
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
        
        // Calcular promedios
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

// Función para calcular transitabilidad (separar más tarde en módulo independiente)
async function calcularTransitabilidad(vegetacion, puntoA, puntoB) {
    let factorVegetacion = 1;
    let factorPendiente = 1;

    // Calcular pendiente usando elevationHandler
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

    // Factor de pendiente
    if (pendientePorcentaje < 5) {
        factorPendiente = 1;
    } else if (pendientePorcentaje < 15) {
        factorPendiente = 0.9;
    } else if (pendientePorcentaje < 30) {
        factorPendiente = 0.6;
    } else if (pendientePorcentaje < 50) {
        factorPendiente = 0.4;
    } else if (pendientePorcentaje < 100) {
        factorPendiente = 0.2;
    } else {
        factorPendiente = 0;
    }

    return factorVegetacion * factorPendiente;
}

// Función para calcular pendiente (separar más tarde en módulo independiente)
async function calcularPendiente(puntoA, puntoB) {
    try {
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
        
        return 0; // Asumir terreno llano si no hay datos
        
    } catch (error) {
        console.warn("⚠️ Error calculando pendiente:", error);
        return 0;
    }
}

// Función auxiliar para calcular distancia
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

// Función de prueba
async function probarVegetacionHandler() {
    console.log("🧪 Iniciando prueba del vegetacionHandler...");
    
    try {
        await cargarIndiceVegetacion;
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

// Función para obtener estado del sistema
function obtenerEstadoSistema() {
    return {
        indiceCargado: !!vegetationIndiceCargado,
        vegetationIndex: vegetationIndex ? 'Cargado' : 'No cargado',
    };
}

// Exponer funciones necesarias en el objeto global
window.vegetacionHandler = {
    cargarDatosVegetacion,
    obtenerVegetacionEnPunto,
    calcularVegetacionPromedio,
    calcularTransitabilidad,
    calcularPendiente,
    probarVegetacionHandler,
    obtenerEstadoSistema
};

// ✅ ESTRUCTURA MAIRA PARA VEGETACIÓN (siguiendo patrón elevación)
window.MAIRA = window.MAIRA || {};
window.MAIRA.Vegetacion = {
    instancia: window.vegetacionHandler,
    
    // ✅ API PRINCIPAL
    inicializar: async function() {
        try {
            await cargarIndiceVegetacion;
            console.log('✅ MAIRA.Vegetacion inicializado');
            return true;
        } catch (error) {
            console.warn('⚠️ Error inicializando MAIRA.Vegetacion:', error);
            return false;
        }
    },
    
    analisis: {
        // ✅ OBTENER VEGETACIÓN INDIVIDUAL
        punto: async function(lat, lng) {
            return await window.vegetacionHandler.obtenerVegetacionEnPunto(lat, lng);
        },
        
        // ✅ ANÁLISIS DE ÁREA
        area: async function(coordenadas) {
            return await window.vegetacionHandler.calcularVegetacionPromedio(coordenadas);
        },
        
        // ✅ TRANSITABILIDAD
        transitabilidad: async function(vegetacion, puntoA, puntoB) {
            return await window.vegetacionHandler.calcularTransitabilidad(vegetacion, puntoA, puntoB);
        }
    },
    
    utilidades: {
        // ✅ INFORMACIÓN DEL SISTEMA
        info: function() {
            const estado = window.vegetacionHandler.obtenerEstadoSistema();
            return {
                version: '1.0.0',
                estado: estado,
                ndviRange: [-1.0, 1.0]
            };
        }
    },
    
    integracion: {
        // ✅ CONECTAR CON ELEVACIÓN
        conectarConElevacion: function() {
            if (window.MAIRA?.Elevacion) {
                console.log('🔗 Vegetación integrada con Elevación');
                return true;
            }
            return false;
        }
    },
    
    version: '1.0.0'
};

// ✅ AUTO-INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.MAIRA.Vegetacion.inicializar();
        
        // Conectar con otros módulos
        setTimeout(() => {
            window.MAIRA.Vegetacion.integracion.conectarConElevacion();
        }, 1500);
        
    } catch (error) {
        console.warn('⚠️ Error inicializando MAIRA.Vegetacion:', error);
    }
});

console.log('🌿 VegetationHandler v2.0 cargado - Compatible con patrón CDN');
