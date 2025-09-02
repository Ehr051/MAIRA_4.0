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
                    const indexPath = `${VEGETATION_CONFIG.basePath}${region}/${region}${VEGETATION_CONFIG.indexSuffix}`;
                    console.log(`🌿 Cargando índice: ${region} desde ${indexPath}`);
                    
                    const response = await fetch(indexPath);
                    if (!response.ok) {
                        console.warn(`⚠️ Región ${region} no disponible: ${response.status}`);
                        continue;
                    }
                    
                    const regionIndex = await response.json();
                    
                    // Combinar tiles del índice regional
                    if (regionIndex.tiles) {
                        Object.assign(indicesCombinados.tiles, regionIndex.tiles);
                        indicesCombinados.metadata.regions_loaded.push(region);
                    }
                    
                    console.log(`✅ Región ${region} cargada: ${Object.keys(regionIndex.tiles || {}).length} tiles`);
                    
                } catch (error) {
                    console.warn(`⚠️ Error cargando región ${region}:`, error);
                }
            }
            
            tileIndex = indicesCombinados;
            
            const totalTiles = Object.keys(tileIndex.tiles).length;
            const regionsLoaded = tileIndex.metadata.regions_loaded.length;
            
            console.log(`✅ Índices de vegetación cargados correctamente`);
            console.log(`📊 Total tiles NDVI: ${totalTiles}`);
            console.log(`🗺️ Regiones disponibles: ${tileIndex.metadata.regions_loaded.join(', ')}`);
            
            return tileIndex;
            
        } catch (error) {
            console.error("❌ Error crítico cargando índices de vegetación:", error);
            tileIndex = { tiles: {}, metadata: { regions_loaded: [] } };
            return tileIndex;
        }
    }

    async function obtenerUrlOptima(archivo) {
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

    function determinarRegionPorTile(tileKey) {
        // Lógica para determinar la región basada en el tileKey
        // Esto necesitará ser ajustado según la estructura real de tus tiles
        if (tileKey.includes('centro_norte') || tileKey.match(/tile_[0-9]+_[0-9]+/) && parseInt(tileKey.split('_')[1]) < 15) {
            return 'centro_norte';
        } else if (tileKey.includes('centro') || tileKey.match(/tile_[0-9]+_[0-9]+/) && parseInt(tileKey.split('_')[1]) < 20) {
            return 'centro';
        } else if (tileKey.includes('norte') || tileKey.match(/tile_[0-9]+_[0-9]+/) && parseInt(tileKey.split('_')[1]) < 10) {
            return 'norte';
        } else if (tileKey.includes('sur') || tileKey.match(/tile_[0-9]+_[0-9]+/) && parseInt(tileKey.split('_')[1]) > 25) {
            return 'sur';
        } else {
            return 'patagonia';
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

            const result = await response.json();
            
            if (result.success) {
                // Cargar el archivo extraído
                const tileResponse = await fetch(result.path);
                const arrayBuffer = await tileResponse.arrayBuffer();
                const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
                const image = await tiff.getImage();
                const tileData = await image.readRasters();

                return {
                    data: tileData[0],
                    bounds: result.bounds || {},
                    width: image.getWidth(),
                    height: image.getHeight()
                };
            } else {
                console.error('Error del servidor:', result.message);
                return null;
            }

        } catch (error) {
            console.error('Error extrayendo tile del servidor:', error);
            return null;
        }
    }

    async function obtenerVegetacionEnPunto(lat, lng) {
        if (!tileIndex) {
            await cargarIndice();
        }

        const tileKey = encontrarTileParaPunto(lat, lng);
        if (!tileKey) {
            console.warn(`No se encontró un tile para el punto (${lat}, ${lng})`);
            return null;
        }

        // Solo log si el tile no está en caché
        if (!tileCache.has(tileKey)) {
            console.log(`Tile encontrado para lat: ${lat}, lng: ${lng}. Tile: ${tileKey}`);
        }

        const tile = await cargarTile(tileKey);
        if (!tile) {
            console.warn(`No se pudo obtener información para el punto (${lat}, ${lng})`);
            return null;
        }

        const pixelX = Math.floor((lng - tile.bounds.west) / (tile.bounds.east - tile.bounds.west) * tile.width);
        const pixelY = Math.floor((tile.bounds.north - lat) / (tile.bounds.north - tile.bounds.south) * tile.height);

        // Solo log detalles de píxel para tiles nuevos
        if (!tileCache.has(tileKey)) {
            console.log(`Píxel calculado: X = ${pixelX}, Y = ${pixelY}`);
        }

        if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
            console.error(`Índices de píxel fuera de rango: X = ${pixelX}, Y = ${pixelY}`);
            return null;
        }

        const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
        
        // Solo log valores NDVI para tiles nuevos
        if (!tileCache.has(tileKey)) {
            console.log(`Valor NDVI calculado: ${ndviValue}`);
        }

        return interpretarNDVI(ndviValue);
    }

    function interpretarNDVI(ndvi) {
        if (ndvi < 0) return { tipo: 'Agua o nube', altura: 'N/A', densidad: 'N/A' };
        if (ndvi < 0.2) return { tipo: 'Suelo desnudo o urbano', altura: 'Baja', densidad: 'Muy baja' };
        if (ndvi < 0.4) return { tipo: 'Vegetación escasa', altura: 'Baja', densidad: 'Baja' };
        if (ndvi < 0.6) return { tipo: 'Pradera o arbustos', altura: 'Media', densidad: 'Media' };
        if (ndvi < 0.8) return { tipo: 'Bosque poco denso', altura: 'Alta', densidad: 'Media' };
        return { tipo: 'Bosque denso', altura: 'Alta', densidad: 'Alta' };
    }

    async function cargarDatosVeg() {
        await cargarIndice();
        console.log("Datos de vegetación cargados");
    }

    async function probarVegetacionHandler() {
        await cargarIndice();
        
        const puntosPrueba = [
            {lat: -34.6037, lng: -58.3816},  // Buenos Aires
            {lat: -31.4201, lng: -64.1888},  // Córdoba
            {lat: -32.8908, lng: -68.8272},  // Mendoza
            {lat: -54.8019, lng: -68.3030},  // Ushuaia
            {lat: -25.2867, lng: -57.3333},  // Asunción (fuera de Argentina)
        ];

        for (let punto of puntosPrueba) {
            console.log(`Probando punto: ${punto.lat}, ${punto.lng}`);
            const resultado = await obtenerVegetacionEnPunto(punto.lat, punto.lng);
            console.log(`Vegetación en ${punto.lat}, ${punto.lng}:`, resultado);
        }
    }
        async function calcularVegetacionPromedio(poligono) {
            if (!tileIndex) {
                await cargarIndice();
            }
    
            let sumaNDVI = 0;
            let puntosTotales = 0;
    
            for (let i = 0; i < poligono.length; i++) {
                const punto = poligono[i];
                const tileKey = encontrarTileParaPunto(punto.lat, punto.lng);
                
                if (!tileKey) {
                    console.warn(`No se encontró un tile para el punto (${punto.lat}, ${punto.lng})`);
                    continue;
                }
    
                const tile = await cargarTile(tileKey);
                if (!tile) {
                    console.warn(`No se pudo obtener información para el punto (${punto.lat}, ${punto.lng})`);
                    continue;
                }
    
                const pixelX = Math.floor((punto.lng - tile.bounds.west) / (tile.bounds.east - tile.bounds.west) * tile.width);
                const pixelY = Math.floor((tile.bounds.north - punto.lat) / (tile.bounds.north - tile.bounds.south) * tile.height);
    
                if (pixelX < 0 || pixelX >= tile.width || pixelY < 0 || pixelY >= tile.height) {
                    console.error(`Índices de píxel fuera de rango: X = ${pixelX}, Y = ${pixelY}`);
                    continue;
                }
    
                const ndviValue = tile.data[pixelY * tile.width + pixelX] / 10000;
                sumaNDVI += ndviValue;
                puntosTotales++;
            }
    
            if (puntosTotales === 0) {
                return null;
            }
    
            const ndviPromedio = sumaNDVI / puntosTotales;
            return interpretarNDVI(ndviPromedio);
        }
    
        // Función interna para calcular pendiente usando elevationHandler si está disponible
        async function calcularPendiente(puntoA, puntoB) {
            let elevacionA = puntoA.elevation;
            let elevacionB = puntoB.elevation;
            
            // ✅ USAR elevationHandler.obtenerElevacion si está disponible
            if (window.elevationHandler && window.elevationHandler.obtenerElevacion) {
                try {
                    if (!elevacionA) {
                        elevacionA = await window.elevationHandler.obtenerElevacion(puntoA.lat, puntoA.lng);
                    }
                    if (!elevacionB) {
                        elevacionB = await window.elevationHandler.obtenerElevacion(puntoB.lat, puntoB.lng);
                    }
                } catch (error) {
                    console.warn('Error obteniendo elevaciones:', error);
                }
            }
            
            // Si no hay elevaciones, retornar 0 (terreno plano)
            if (!elevacionA || !elevacionB) {
                console.warn('Elevaciones no disponibles para cálculo de pendiente');
                return 0;
            }
            
            // Calcular distancia horizontal usando Leaflet
            const distanciaHorizontal = L.latLng(puntoA.lat, puntoA.lng).distanceTo(L.latLng(puntoB.lat, puntoB.lng));
            
            if (distanciaHorizontal === 0) {
                return 0; // Mismo punto
            }
            
            const diferenciaElevacion = Math.abs(elevacionB - elevacionA);
            const pendientePorcentaje = (diferenciaElevacion / distanciaHorizontal) * 100;
            
            console.log(`Pendiente calculada: ${pendientePorcentaje.toFixed(2)}% (Δh: ${diferenciaElevacion}m, d: ${distanciaHorizontal.toFixed(0)}m)`);
            
            return pendientePorcentaje;
        }

        // ✅ MODIFICAR calcularTransitabilidad para usar función async:
        async function calcularTransitabilidad(vegetacion, puntoA, puntoB) {
            let factorVegetacion = 1;
            let factorPendiente = 1;

            // ✅ CALCULAR PENDIENTE DE FORMA ASYNC
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
                case 'Bosque poco denso':
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
        
        
    
        return {
            cargarIndice,
            obtenerVegetacionEnPunto,
            calcularVegetacionPromedio,
            calcularTransitabilidad,    // ✅ AHORA ES ASYNC
            calcularPendiente,          // ✅ NUEVA FUNCIÓN
            probarVegetacionHandler,
            cargarDatosVeg
        };
    })();
    
    window.vegetacionHandler = vegetacionHandler;
    window.vegetacionHandler.calcularTransitabilidad = vegetacionHandler.calcularTransitabilidad;

        // ✅ AGREGAR AL FINAL DEL ARCHIVO:
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Vegetacion = {
        instancia: window.vegetacionHandler,
        
        // ✅ API PRINCIPAL
        inicializar: async function() {
            await this.instancia.cargarDatosVeg();
            console.log('✅ MAIRA.Vegetacion inicializado');
            return true;
        },
        
        analisis: {
            // ✅ ANÁLISIS INDIVIDUAL
            punto: async function(lat, lng) {
                return await this.instancia.obtenerVegetacionEnPunto(lat, lng);
            },
            
            // ✅ ANÁLISIS MÚLTIPLE
            ruta: async function(puntos) {
                const resultados = [];
                for (const punto of puntos) {
                    try {
                        const vegetacion = await this.analisis.punto(punto.lat, punto.lng);
                        resultados.push({
                            coordenadas: { lat: punto.lat, lng: punto.lng },
                            vegetacion: vegetacion,
                            distancia: punto.distanciaAcumulada || 0
                        });
                    } catch (error) {
                        console.warn(`Error analizando punto ${punto.lat}, ${punto.lng}:`, error);
                        resultados.push({
                            coordenadas: { lat: punto.lat, lng: punto.lng },
                            vegetacion: null,
                            error: error.message
                        });
                    }
                }
                return resultados;
            },
            
            // ✅ ANÁLISIS ÁREA
            poligono: async function(poligono) {
                return await this.instancia.calcularVegetacionPromedio(poligono);
            }
        },
        
        transitabilidad: {
            // ✅ CALCULAR FACTOR TRANSITABILIDAD (AHORA ASYNC)
            calcular: async function(vegetacion, puntoA, puntoB) {
                return await window.MAIRA.Vegetacion.instancia.calcularTransitabilidad(vegetacion, puntoA, puntoB);
            },
            
            // ✅ NUEVA: Calcular pendiente con elevationHandler
            calcularPendiente: async function(puntoA, puntoB) {
                return await window.MAIRA.Vegetacion.instancia.calcularPendiente(puntoA, puntoB);
            },
            
            // ✅ NUEVA: Análisis completo de ruta con elevaciones reales
            analizarRuta: async function(puntos) {
                const analisis = [];
                
                for (let i = 0; i < puntos.length - 1; i++) {
                    const puntoA = puntos[i];
                    const puntoB = puntos[i + 1];
                    
                    try {
                        // Obtener vegetación
                        const vegA = await window.MAIRA.Vegetacion.analisis.punto(puntoA.lat, puntoA.lng);
                        const vegB = await window.MAIRA.Vegetacion.analisis.punto(puntoB.lat, puntoB.lng);
                        
                        // Obtener elevaciones usando elevationHandler
                        let elevA = puntoA.elevation;
                        let elevB = puntoB.elevation;
                        
                        if (window.elevationHandler) {
                            if (!elevA) elevA = await window.elevationHandler.obtenerElevacion(puntoA.lat, puntoA.lng);
                            if (!elevB) elevB = await window.elevationHandler.obtenerElevacion(puntoB.lat, puntoB.lng);
                        }
                        
                        // Calcular transitabilidad con elevaciones reales
                        const transitabilidad = await this.calcular(vegA, 
                            { ...puntoA, elevation: elevA }, 
                            { ...puntoB, elevation: elevB }
                        );
                        
                        // Calcular pendiente
                        const pendiente = await this.calcularPendiente(
                            { ...puntoA, elevation: elevA }, 
                            { ...puntoB, elevation: elevB }
                        );
                        
                        analisis.push({
                            segmento: i + 1,
                            puntoA: { ...puntoA, vegetacion: vegA, elevation: elevA },
                            puntoB: { ...puntoB, vegetacion: vegB, elevation: elevB },
                            transitabilidad: transitabilidad,
                            pendiente: pendiente.toFixed(2) + '%',
                            clasificacion: this.clasificar(transitabilidad),
                            distancia: L.latLng(puntoA.lat, puntoA.lng).distanceTo(L.latLng(puntoB.lat, puntoB.lng))
                        });
                        
                    } catch (error) {
                        console.warn(`Error analizando segmento ${i + 1}:`, error);
                        analisis.push({
                            segmento: i + 1,
                            error: error.message
                        });
                    }
                }
                
                return analisis;
            },
            
            // ✅ OBTENER FACTORES POR TIPO
            obtenerFactor: function(tipoVegetacion) {
                const factores = {
                    'Suelo desnudo o urbano': 1.0,
                    'Vegetación escasa': 0.9,
                    'Pradera o arbustos': 0.75,
                    'Bosque poco denso': 0.6,
                    'Bosque denso': 0.4,
                    'Agua o nube': 0
                };
                return factores[tipoVegetacion] || 0.5;
            },
            
            // ✅ CLASIFICAR TRANSITABILIDAD
            clasificar: function(factor) {
                if (factor >= 0.9) return { nivel: 'Excelente', color: '#00ff00' };
                if (factor >= 0.7) return { nivel: 'Buena', color: '#80ff00' };
                if (factor >= 0.5) return { nivel: 'Regular', color: '#ffff00' };
                if (factor >= 0.3) return { nivel: 'Difícil', color: '#ff8000' };
                if (factor > 0) return { nivel: 'Muy difícil', color: '#ff0000' };
                return { nivel: 'Intransitable', color: '#800000' };
            }
        },
        
        cache: {
            // ✅ GESTIÓN CACHE
            limpiar: function() {
                if (this.instancia.tileCache) {
                    this.instancia.tileCache.clear();
                    console.log('🧹 Cache de vegetación limpiado');
                }
            },
            
            estado: function() {
                const cache = this.instancia.tileCache;
                return {
                    tiles: cache ? cache.size : 0,
                    memoria: cache ? Array.from(cache.values())
                        .reduce((total, tile) => total + (tile.data?.length || 0), 0) : 0
                };
            }
        },
        
        utilidades: {
            // ✅ PRUEBAS Y DIAGNÓSTICO
            probar: async function() {
                await this.instancia.probarVegetacionHandler();
            },
            
            // ✅ INFORMACIÓN SISTEMA
            info: function() {
                return {
                    tilesDisponibles: this.instancia.tileIndex ? 
                        Object.keys(this.instancia.tileIndex.tiles).length : 0,
                    cacheActivo: this.cache.estado(),
                    version: '1.0.0'
                };
            },
            
            // ✅ ESTADÍSTICAS NDVI
            estadisticasNDVI: function(valores) {
                if (!Array.isArray(valores) || valores.length === 0) return null;
                
                const validos = valores.filter(v => v !== null && !isNaN(v));
                if (validos.length === 0) return null;
                
                const suma = validos.reduce((a, b) => a + b, 0);
                const promedio = suma / validos.length;
                const minimo = Math.min(...validos);
                const maximo = Math.max(...validos);
                
                return {
                    promedio: promedio.toFixed(3),
                    minimo: minimo.toFixed(3),
                    maximo: maximo.toFixed(3),
                    muestras: validos.length,
                    cobertura: (validos.length / valores.length * 100).toFixed(1) + '%'
                };
            }
        },
        
        integracion: {
            // ✅ INTEGRACIÓN CORREGIDA CON OTROS MÓDULOS
            conectarConCalculoMarcha: function() {
                // VERIFICAR ESTRUCTURAS CORRECTAS
                if (window.CalculoMarcha && window.CalculoMarcha.factores) {
                    // ✅ USAR LA FUNCIÓN CORRECTA:
                    window.CalculoMarcha.factores.vegetacion = function(tipoVegetacion) {
                        const factores = {
                            'Suelo desnudo o urbano': 1.0,
                            'Vegetación escasa': 1.05,
                            'Pradera o arbustos': 1.1,
                            'Bosque poco denso': 1.5,
                            'Bosque denso': 0,  // Intransitable
                            'Agua o nube': 0    // Intransitable
                        };
                        return factores[tipoVegetacion] || 1.0;
                    };
                    
                    console.log('🔗 Vegetación integrada con CalculoMarcha');
                    return true;
                } else {
                    console.warn('⚠️ CalculoMarcha no disponible o estructura incorrecta');
                    console.log('- CalculoMarcha:', typeof window.CalculoMarcha);
                    console.log('- factores:', typeof window.CalculoMarcha?.factores);
                    return false;
                }
            }
        },
        
        version: '1.0.0'
    };
    
    // ✅ AUTO-INICIALIZACIÓN
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            await window.MAIRA.Vegetacion.inicializar();
            
            // Intentar conectar con otros módulos
            setTimeout(() => {
                window.MAIRA.Vegetacion.integracion.conectarConCalculoMarcha();
            }, 1000);
            
        } catch (error) {
            console.warn('⚠️ Error inicializando MAIRA.Vegetacion:', error);
        }
    });