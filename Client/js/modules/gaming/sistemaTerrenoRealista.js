/**
 * Sistema de Terreno Realista MAIRA 4.0
 * Integra datos TIF de elevación y vegetación con Three.js para generar terrenos 3D realistas
 * Usa los mismos datos que el sistema de cálculos de marcha y perfiles de elevación
 */

class SistemaTerrenoRealista {
    constructor(sistema3DMaster) {
        this.sistema3DMaster = sistema3DMaster;
        this.elevationHandler = null;
        this.vegetationHandler = null;
        this.terrenoMesh = null;
        this.vegetacionMeshes = [];
        this.cacheTerrenos = new Map();
        this.cacheSubTiles = new Map(); // 🚀 Cache para sub-tiles

        // Configuración del terreno
        this.config = {
            tileSize: 256, // Tamaño de tile en pixels
            resolution: 30, // Resolución en metros por pixel
            alturaExageracion: 2.0, // Factor de exageración vertical
            maxCacheTerrenos: 10, // Máximo terrenos en cache
            vegetacionDensidad: 0.3, // Densidad de vegetación (0-1)
            lodLevels: 4, // Niveles de detalle

            // 🚀 OPTIMIZACIÓN: Sistema de sub-tiles
            subTileSize: 64, // Tamaño de sub-tile en pixels (256/4 = 64)
            maxSubTiles: 32, // Máximo sub-tiles a cargar simultáneamente
            tileSubdivision: 4, // Dividir cada tile en 4x4 = 16 sub-tiles
            preloadAdjacent: true, // Precargar tiles adyacentes
            adaptiveResolution: true // Ajustar resolución según distancia
        };

        this.init();
    }

    async init() {
        console.log('🏔️ Inicializando Sistema de Terreno Realista...');

        try {
            // Cargar handlers existentes
            await this.cargarElevationHandler();
            await this.cargarVegetationHandler();

            console.log('✅ Sistema de Terreno Realista inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Sistema de Terreno Realista:', error);
        }
    }

    async cargarElevationHandler() {
        try {
            // Intentar cargar el elevationHandler existente
            if (window.elevationHandler) {
                this.elevationHandler = window.elevationHandler;
                console.log('✅ ElevationHandler existente conectado');
            } else {
                // Cargar dinámicamente si no existe
                await this.cargarScript('../Client/js/handlers/elevationHandler.js');
                this.elevationHandler = window.elevationHandler;
                console.log('✅ ElevationHandler cargado dinámicamente');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo cargar ElevationHandler:', error);
        }
    }

    async cargarVegetationHandler() {
        try {
            // Intentar cargar el vegetationHandler existente
            if (window.vegetationHandler) {
                this.vegetationHandler = window.vegetationHandler;
                console.log('✅ VegetationHandler existente conectado');
            } else {
                // Cargar dinámicamente si no existe
                await this.cargarScript('../Client/js/handlers/vegetacionhandler.js');
                this.vegetationHandler = window.vegetationHandler;
                console.log('✅ VegetationHandler cargado dinámicamente');
            }
        } catch (error) {
            console.warn('⚠️ No se pudo cargar VegetationHandler:', error);
        }
    }

    async cargarScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Genera terreno 3D realista basado en datos TIF de elevación
     * OPTIMIZADO: Solo renderiza lo visible en el viewport actual
     * @param {Object} bounds - Límites geográficos {north, south, east, west}
     * @param {Object} opciones - Opciones de generación
     */
    async generarTerrenoRealista(bounds, opciones = {}) {
        // 🚀 OPTIMIZACIÓN: Limitar bounds al viewport visible
        const boundsOptimizados = this.optimizarBoundsParaViewport(bounds, opciones);

        const cacheKey = `${boundsOptimizados.north}_${boundsOptimizados.south}_${boundsOptimizados.east}_${boundsOptimizados.west}_${opciones.lod ? 'lod' : 'no-lod'}`;

        // Verificar cache
        if (this.cacheTerrenos.has(cacheKey)) {
            console.log('✅ Terreno cargado desde cache');
            return this.cacheTerrenos.get(cacheKey);
        }

        console.log('🏔️ Generando terreno realista optimizado...');
        console.log(`📐 Bounds originales: N${bounds.north.toFixed(3)} S${bounds.south.toFixed(3)} E${bounds.east.toFixed(3)} W${bounds.west.toFixed(3)}`);
        console.log(`🎯 Bounds optimizados: N${boundsOptimizados.north.toFixed(3)} S${boundsOptimizados.south.toFixed(3)} E${boundsOptimizados.east.toFixed(3)} W${boundsOptimizados.west.toFixed(3)}`);

        try {
            // Obtener tiles de elevación necesarios (optimizado)
            const tilesElevacion = await this.obtenerTilesElevacionOptimizado(boundsOptimizados);

            if (tilesElevacion.length === 0) {
                console.warn('⚠️ No se encontraron tiles de elevación para el área');
                return this.generarTerrenoFallback(boundsOptimizados);
            }

            console.log(`🗺️ Procesando ${tilesElevacion.length} tiles de elevación`);

            // Procesar datos de elevación con optimizaciones
            const datosTerreno = await this.procesarDatosElevacionOptimizado(tilesElevacion, boundsOptimizados, opciones);

            // Crear geometría Three.js optimizada
            const geometria = this.crearGeometriaTerrenoOptimizada(datosTerreno, opciones);

            // Crear material del terreno
            const material = this.crearMaterialTerreno(datosTerreno);

            // Crear mesh del terreno
            const terrenoMesh = new THREE.Mesh(geometria, material);
            terrenoMesh.receiveShadow = true;
            terrenoMesh.castShadow = true;

            // Posicionar el terreno
            this.posicionarTerreno(terrenoMesh, boundsOptimizados);

            // Aplicar LOD avanzado si está habilitado
            if (opciones.lod) {
                this.aplicarLODInteligente(terrenoMesh, datosTerreno, opciones);
            }

            // Generar vegetación optimizada
            if (opciones.vegetacion && opciones.vegetacionDensidad > 0) {
                await this.generarVegetacionTerrenoOptimizada(boundsOptimizados, datosTerreno, opciones);
            }

            // Cachear el terreno
            this.cacheTerreno(cacheKey, terrenoMesh);

            console.log('✅ Terreno realista optimizado generado');
            console.log(`📊 Estadísticas: ${datosTerreno.width}x${datosTerreno.height} vertices, ${tilesElevacion.length} tiles`);

            return terrenoMesh;

        } catch (error) {
            console.error('❌ Error generando terreno realista:', error);
            return this.generarTerrenoFallback(boundsOptimizados);
        }
    }

    /**
     * OPTIMIZACIÓN: Limita los bounds al viewport visible para evitar renderizar áreas grandes
     */
    optimizarBoundsParaViewport(bounds, opciones = {}) {
        // Calcular el área de los bounds originales
        const areaOriginal = (bounds.north - bounds.south) * (bounds.east - bounds.west);

        // Limitar el área máxima visible (ej: 100km² para buena performance)
        const areaMaxima = opciones.areaMaxima || 100; // km²
        const areaActual = areaOriginal * 111 * 111; // Convertir grados a km² aproximado

        if (areaActual <= areaMaxima) {
            return bounds; // Ya está optimizado
        }

        // Calcular factor de reducción
        const factorReduccion = Math.sqrt(areaMaxima / areaActual);

        // Calcular centro
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;

        // Calcular nuevos bounds centrados y reducidos
        const halfLat = (bounds.north - bounds.south) / 2 * factorReduccion;
        const halfLng = (bounds.east - bounds.west) / 2 * factorReduccion;

        return {
            north: centerLat + halfLat,
            south: centerLat - halfLat,
            east: centerLng + halfLng,
            west: centerLng - halfLng
        };
    }

    /**
     * 🚀 OPTIMIZACIÓN: Sistema de sub-tiles para carga granular
     * Divide tiles grandes en sub-tiles más pequeños para mejor performance
     */
    async obtenerTilesElevacionOptimizado(bounds) {
        if (!this.elevationHandler) {
            console.warn('⚠️ ElevationHandler no disponible');
            return [];
        }

        try {
            // Calcular sub-tiles necesarios (más granulares)
            const subTiles = this.calcularSubTilesNecesarios(bounds);

            console.log(`🎯 Calculando ${subTiles.length} sub-tiles necesarios para bounds optimizados`);

            // Limitar número máximo de sub-tiles para performance
            const maxSubTiles = this.config.maxSubTiles || 32;
            const subTilesLimitados = subTiles.slice(0, maxSubTiles);

            if (subTiles.length > maxSubTiles) {
                console.warn(`⚠️ Limitando de ${subTiles.length} a ${maxSubTiles} sub-tiles para performance`);
            }

            const subTilesData = [];
            let subTilesCargados = 0;

            // Cargar sub-tiles con concurrencia optimizada
            const concurrenciaMaxima = 6; // Más concurrencia para sub-tiles pequeños
            for (let i = 0; i < subTilesLimitados.length; i += concurrenciaMaxima) {
                const batch = subTilesLimitados.slice(i, i + concurrenciaMaxima);
                const promises = batch.map(async (subTile) => {
                    try {
                        const subTileData = await this.cargarSubTileElevacion(subTile);
                        if (subTileData) {
                            subTilesCargados++;
                            return subTileData;
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error cargando sub-tile ${subTile.parentTile}_${subTile.subX}_${subTile.subY}:`, error);
                    }
                    return null;
                });

                const batchResults = await Promise.all(promises);
                subTilesData.push(...batchResults.filter(subTile => subTile !== null));
            }

            console.log(`✅ ${subTilesCargados} sub-tiles de elevación cargados`);
            return subTilesData;

        } catch (error) {
            console.error('❌ Error obteniendo sub-tiles de elevación:', error);
            return [];
        }
    }

    /**
     * 🚀 Calcular sub-tiles necesarios (división granular)
     */
    calcularSubTilesNecesarios(bounds) {
        const subTiles = [];
        const subdivision = this.config.tileSubdivision || 4; // 4x4 = 16 sub-tiles por tile

        // Calcular tiles padre primero
        const tilesPadre = this.calcularTilesNecesariosOptimizado(bounds);

        // Para cada tile padre, generar sub-tiles
        for (const tilePadre of tilesPadre) {
            const subTileSizeDegrees = (tilePadre.bounds.north - tilePadre.bounds.south) / subdivision;
            const subTileSizeLngDegrees = (tilePadre.bounds.east - tilePadre.bounds.west) / subdivision;

            for (let subY = 0; subY < subdivision; subY++) {
                for (let subX = 0; subX < subdivision; subX++) {
                    const subTileBounds = {
                        north: tilePadre.bounds.south + (subY + 1) * subTileSizeDegrees,
                        south: tilePadre.bounds.south + subY * subTileSizeDegrees,
                        east: tilePadre.bounds.west + (subX + 1) * subTileSizeLngDegrees,
                        west: tilePadre.bounds.west + subX * subTileSizeLngDegrees
                    };

                    // Solo incluir sub-tiles que intersecten con bounds objetivo
                    if (this.boundsIntersectan(subTileBounds, bounds)) {
                        subTiles.push({
                            parentTile: `${tilePadre.x}_${tilePadre.y}_${tilePadre.z}`,
                            subX: subX,
                            subY: subY,
                            bounds: subTileBounds,
                            tilePadre: tilePadre
                        });
                    }
                }
            }
        }

        return subTiles;
    }

    /**
     * 🚀 Cargar un sub-tile específico de elevación
     */
    async cargarSubTileElevacion(subTile) {
        // Intentar cargar desde cache primero
        const cacheKey = `${subTile.parentTile}_${subTile.subX}_${subTile.subY}`;
        if (this.cacheSubTiles && this.cacheSubTiles.has(cacheKey)) {
            return this.cacheSubTiles.get(cacheKey);
        }

        try {
            // Cargar datos de elevación directamente para los bounds del sub-tile
            const elevationData = await this.elevationHandler.cargarDatosElevacion(subTile.bounds);

            if (!elevationData || !elevationData.elevations) {
                return null;
            }

            // Los datos ya están en el formato correcto para el sub-tile
            const subTileData = {
                elevations: elevationData.elevations,
                bounds: subTile.bounds,
                width: elevationData.width || 64, // Asumir tamaño estándar de sub-tile
                height: elevationData.height || 64
            };

            // Cachear el sub-tile
            if (!this.cacheSubTiles) {
                this.cacheSubTiles = new Map();
            }
            this.cacheSubTiles.set(cacheKey, subTileData);

            return subTileData;

        } catch (error) {
            console.warn(`⚠️ Error cargando sub-tile ${cacheKey}:`, error);
            return null;
        }
    }

    /**
     * 🚀 Extraer datos de sub-tile del tile padre
     */
    extraerSubTileDeTilePadre(tilePadreData, subTile) {
        const subdivision = this.config.tileSubdivision || 4;
        const tileSize = this.config.tileSize || 256;
        const subTileSize = tileSize / subdivision; // 64 pixels para subdivision=4

        const elevations = tilePadreData.elevations;
        const subTileElevations = [];

        // Calcular offsets para el sub-tile dentro del tile padre
        const offsetY = subTile.subY * subTileSize;
        const offsetX = subTile.subX * subTileSize;

        // Extraer la porción correspondiente
        for (let y = 0; y < subTileSize; y++) {
            for (let x = 0; x < subTileSize; x++) {
                const padreIndex = (offsetY + y) * tileSize + (offsetX + x);
                if (padreIndex < elevations.length) {
                    subTileElevations.push(elevations[padreIndex]);
                } else {
                    subTileElevations.push(0); // Valor por defecto
                }
            }
        }

        return {
            ...subTile,
            data: {
                elevations: subTileElevations,
                width: subTileSize,
                height: subTileSize,
                bounds: subTile.bounds
            }
        };
    }

    /**
     * Verificar si dos bounds se intersectan
     */
    boundsIntersectan(bounds1, bounds2) {
        return !(bounds1.west > bounds2.east ||
                 bounds1.east < bounds2.west ||
                 bounds1.south > bounds2.north ||
                 bounds1.north < bounds2.south);
    }

    /**
     * OPTIMIZACIÓN: Calcular tiles necesarios de forma más inteligente
     */
    calcularTilesNecesariosOptimizado(bounds) {
        // Usar el sistema de tiles real de MAIRA
        const tiles = [];

        // Calcular tiles basados en el sistema de coordenadas real
        // Ajustar según el zoom level apropiado
        const zoomLevel = this.calcularZoomLevelOptimo(bounds);
        const tileSizeDegrees = 360 / Math.pow(2, zoomLevel); // Tamaño de tile en grados

        const minLat = Math.floor(bounds.south / tileSizeDegrees) * tileSizeDegrees;
        const maxLat = Math.ceil(bounds.north / tileSizeDegrees) * tileSizeDegrees;
        const minLng = Math.floor(bounds.west / tileSizeDegrees) * tileSizeDegrees;
        const maxLng = Math.ceil(bounds.east / tileSizeDegrees) * tileSizeDegrees;

        for (let lat = minLat; lat < maxLat; lat += tileSizeDegrees) {
            for (let lng = minLng; lng < maxLng; lng += tileSizeDegrees) {
                tiles.push({
                    x: Math.floor((lng + 180) / tileSizeDegrees),
                    y: Math.floor((90 - lat) / tileSizeDegrees),
                    z: zoomLevel,
                    bounds: {
                        north: lat + tileSizeDegrees,
                        south: lat,
                        east: lng + tileSizeDegrees,
                        west: lng
                    }
                });
            }
        }

        return tiles;
    }

    /**
     * OPTIMIZACIÓN: Calcular nivel de zoom óptimo basado en el área
     */
    calcularZoomLevelOptimo(bounds) {
        const areaKm2 = this.calcularAreaKm2(bounds);

        // Zoom levels basados en área:
        // Área grande → zoom bajo (menos detalle, mejor performance)
        // Área pequeña → zoom alto (más detalle)
        if (areaKm2 > 1000) return 8;      // Área muy grande
        if (areaKm2 > 100) return 10;      // Área grande
        if (areaKm2 > 10) return 12;       // Área mediana
        return 14;                         // Área pequeña (máximo detalle)
    }

    /**
     * Calcular área en km² de los bounds
     */
    calcularAreaKm2(bounds) {
        const latDistance = (bounds.north - bounds.south) * 111; // km
        const avgLat = (bounds.north + bounds.south) / 2;
        const lngDistance = (bounds.east - bounds.west) * 111 * Math.cos(avgLat * Math.PI / 180); // km
        return latDistance * lngDistance;
    }

    /**
     * OPTIMIZACIÓN: Procesar datos de elevación de sub-tiles
     */
    async procesarDatosElevacionOptimizado(subTiles, bounds, opciones) {
        const datosProcesados = {
            width: 128,  // Mantener resolución base
            height: 128,
            elevations: [],
            bounds: bounds,
            subTiles: subTiles.length
        };

        // Procesar elevaciones de sub-tiles de forma optimizada
        const elevationsMap = new Map();

        // Consolidar datos de todos los sub-tiles en una malla unificada
        for (const subTile of subTiles) {
            if (subTile.data && subTile.data.elevations) {
                // Aquí iría la lógica para combinar sub-tiles en una malla unificada
                // Por simplicidad, concatenamos las elevaciones
                datosProcesados.elevations.push(...subTile.data.elevations);
            }
        }

        // Limitar y normalizar elevaciones si es necesario
        const maxElevations = datosProcesados.width * datosProcesados.height;
        if (datosProcesados.elevations.length > maxElevations) {
            // Subsample para reducir resolución
            datosProcesados.elevations = this.subsampleElevations(
                datosProcesados.elevations,
                datosProcesados.width,
                datosProcesados.height
            );
        } else if (datosProcesados.elevations.length < maxElevations) {
            // Rellenar con ceros si no hay suficientes datos
            while (datosProcesados.elevations.length < maxElevations) {
                datosProcesados.elevations.push(0);
            }
        }

        // Calcular estadísticas
        if (datosProcesados.elevations.length > 0) {
            const elevations = datosProcesados.elevations.filter(e => e !== undefined && e !== null);
            if (elevations.length > 0) {
                const min = Math.min(...elevations);
                const max = Math.max(...elevations);

                datosProcesados.minElevation = min;
                datosProcesados.maxElevation = max;
                datosProcesados.elevationRange = max - min;
            }
        }

        return datosProcesados;
    }

    /**
     * OPTIMIZACIÓN: Subsampling de elevaciones para reducir resolución
     */
    subsampleElevations(elevations, targetWidth, targetHeight) {
        const subsampled = [];
        const originalWidth = Math.sqrt(elevations.length);
        const stepX = originalWidth / targetWidth;
        const stepY = originalWidth / targetHeight;

        for (let y = 0; y < targetHeight; y++) {
            for (let x = 0; x < targetWidth; x++) {
                const originalX = Math.floor(x * stepX);
                const originalY = Math.floor(y * stepY);
                const index = originalY * originalWidth + originalX;

                if (index < elevations.length) {
                    subsampled.push(elevations[index]);
                } else {
                    subsampled.push(0);
                }
            }
        }

        return subsampled;
    }

    /**
     * OPTIMIZACIÓN: Crear geometría de terreno optimizada
     */
    crearGeometriaTerrenoOptimizada(datosTerreno, opciones) {
        const width = datosTerreno.width;
        const height = datosTerreno.height;
        const elevations = datosTerreno.elevations;

        // Usar segmentos reducidos para mejor performance
        const widthSegments = opciones.lod ? Math.min(width - 1, 64) : width - 1;
        const heightSegments = opciones.lod ? Math.min(height - 1, 64) : height - 1;

        const geometry = new THREE.PlaneGeometry(
            width * this.config.resolution,
            height * this.config.resolution,
            widthSegments,
            heightSegments
        );

        // Aplicar elevaciones de forma optimizada
        const vertices = geometry.attributes.position.array;
        const vertexCount = vertices.length / 3;

        for (let i = 0; i < vertexCount; i++) {
            const x = i % (widthSegments + 1);
            const y = Math.floor(i / (widthSegments + 1));

            // Mapear coordenadas del plano a coordenadas del array de elevaciones
            const elevationX = Math.floor((x / widthSegments) * (width - 1));
            const elevationY = Math.floor((y / heightSegments) * (height - 1));

            if (elevations && elevations[elevationY * width + elevationX] !== undefined) {
                const exageracion = opciones.alturaExageracion || this.config.alturaExageracion;
                vertices[i * 3 + 2] = elevations[elevationY * width + elevationX] * exageracion;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * OPTIMIZACIÓN: LOD inteligente basado en distancia y importancia
     */
    aplicarLODInteligente(mesh, datosTerreno, opciones) {
        // Implementar LOD basado en chunks del terreno
        console.log('📊 LOD inteligente aplicado (optimizado)');

        // Aquí iría la lógica de LOD avanzado:
        // - Dividir terreno en chunks
        // - Calcular distancia desde cámara
        // - Aplicar diferentes niveles de detalle
        // - Usar frustum culling

        // Simplificado para esta implementación
        if (mesh.geometry) {
            mesh.geometry.computeBoundingSphere();
        }
    }

    /**
     * OPTIMIZACIÓN: Generar vegetación de forma optimizada
     */
    async generarVegetacionTerrenoOptimizada(bounds, datosTerreno, opciones) {
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible para vegetación');
            return;
        }

        console.log('🌿 Generando vegetación procedural optimizada...');

        try {
            // Obtener datos de vegetación de forma optimizada
            const datosVegetacion = await this.obtenerDatosVegetacionOptimizado(bounds);

            // Crear instancias de vegetación optimizadas
            const vegetacionMesh = await this.crearInstanciasVegetacionOptimizada(datosVegetacion, datosTerreno, opciones);

            if (vegetacionMesh) {
                this.vegetacionMeshes.push(vegetacionMesh);
                // Agregar a escena del sistema maestro
                if (this.sistema3DMaster && this.sistema3DMaster.escena) {
                    this.sistema3DMaster.escena.add(vegetacionMesh);
                }
            }

        } catch (error) {
            console.error('❌ Error generando vegetación optimizada:', error);
        }
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener datos de vegetación con SUB-TILES
     */
    async obtenerDatosVegetacionOptimizado(bounds) {
        // Lógica optimizada para obtener vegetación solo donde es necesario
        const datosVegetacion = {
            areas: []
        };

        // 🚀 NUEVO: Calcular SUB-TILES de vegetación necesarios
        const subTiles = this.calcularSubTilesVegetacion(bounds);

        console.log(`🌿 Calculando ${subTiles.length} sub-tiles de vegetación necesarios`);

        // Limitar concurrencia para performance (vegetación es menos crítica)
        const concurrenciaMaxima = 3; // Menos que elevación
        for (let i = 0; i < subTiles.length; i += concurrenciaMaxima) {
            const batch = subTiles.slice(i, i + concurrenciaMaxima);
            const promises = batch.map(async (subTile) => {
                try {
                    const subTileData = await this.cargarSubTileVegetacion(subTile);
                    if (subTileData) {
                        return subTileData;
                    }
                } catch (error) {
                    console.warn(`⚠️ Error cargando sub-tile vegetación ${subTile.parentTile}_${subTile.subX}_${subTile.subY}:`, error);
                }
                return null;
            });

            const batchResults = await Promise.all(promises);
            datosVegetacion.areas.push(...batchResults.filter(area => area !== null));
        }

        return datosVegetacion;
    }

    /**
     * 🚀 Calcular sub-tiles de vegetación (misma lógica que elevación)
     */
    calcularSubTilesVegetacion(bounds) {
        const subTiles = [];
        const subdivision = this.config.tileSubdivision || 4; // Misma subdivisión que elevación

        // Calcular tiles padre de vegetación (más grandes que elevación)
        const tilesPadre = this.calcularTilesVegetacionOptimizado(bounds);

        // Para cada tile padre, generar sub-tiles
        for (const tilePadre of tilesPadre) {
            // Convertir coordenadas del tile padre a bounds geográficos
            const tileSizeDegrees = 0.02; // Mismo tamaño que antes
            const tileBounds = {
                north: (tilePadre.y + 1) * tileSizeDegrees - 90, // Ajuste para coordenadas
                south: tilePadre.y * tileSizeDegrees - 90,
                east: (tilePadre.x + 1) * tileSizeDegrees - 180,
                west: tilePadre.x * tileSizeDegrees - 180
            };

            const subTileSizeDegrees = tileSizeDegrees / subdivision;

            for (let subY = 0; subY < subdivision; subY++) {
                for (let subX = 0; subX < subdivision; subX++) {
                    const subTileBounds = {
                        north: tileBounds.south + (subY + 1) * subTileSizeDegrees,
                        south: tileBounds.south + subY * subTileSizeDegrees,
                        east: tileBounds.west + (subX + 1) * subTileSizeDegrees,
                        west: tileBounds.west + subX * subTileSizeDegrees
                    };

                    // Solo incluir sub-tiles que intersecten con bounds objetivo
                    if (this.boundsIntersectan(subTileBounds, bounds)) {
                        subTiles.push({
                            parentTile: `${tilePadre.x}_${tilePadre.y}`,
                            subX: subX,
                            subY: subY,
                            bounds: subTileBounds,
                            tilePadre: tilePadre
                        });
                    }
                }
            }
        }

        return subTiles;
    }

    /**
     * 🚀 Cargar un sub-tile específico de vegetación
     */
    async cargarSubTileVegetacion(subTile) {
        // Intentar cargar desde cache primero
        const cacheKey = `veg_${subTile.parentTile}_${subTile.subX}_${subTile.subY}`;
        if (this.cacheSubTiles && this.cacheSubTiles.has(cacheKey)) {
            return this.cacheSubTiles.get(cacheKey);
        }

        try {
            // Para vegetación, usamos una aproximación diferente:
            // Muestreamos puntos NDVI dentro del sub-tile
            const subTileData = await this.cargarDatosVegetacionSubTile(subTile);

            if (!subTileData) {
                return null;
            }

            // Cachear el sub-tile de vegetación
            if (!this.cacheSubTiles) {
                this.cacheSubTiles = new Map();
            }
            this.cacheSubTiles.set(cacheKey, subTileData);

            return subTileData;

        } catch (error) {
            console.warn(`⚠️ Error cargando sub-tile vegetación ${cacheKey}:`, error);
            return null;
        }
    }

    /**
     * 🚀 Cargar datos de vegetación para un sub-tile mediante muestreo optimizado
     */
    async cargarDatosVegetacionSubTile(subTile) {
        if (!this.vegetationHandler || !this.vegetationHandler.getNDVI) {
            console.warn('⚠️ VegetationHandler no disponible para sub-tile');
            return null;
        }

        try {
            const bounds = subTile.bounds;
            const sampleSize = 4; // Reducir a 4x4 = 16 puntos para mejor performance
            const ndvi = [];

            // Calcular espaciado entre muestras
            const latStep = (bounds.north - bounds.south) / (sampleSize - 1);
            const lngStep = (bounds.east - bounds.west) / (sampleSize - 1);

            // Muestrear puntos NDVI en paralelo para mejor performance
            const promises = [];
            for (let y = 0; y < sampleSize; y++) {
                for (let x = 0; x < sampleSize; x++) {
                    const lat = bounds.south + y * latStep;
                    const lng = bounds.west + x * lngStep;
                    promises.push(
                        this.vegetationHandler.getNDVI(lat, lng)
                            .catch(error => {
                                console.warn(`⚠️ Error NDVI ${lat},${lng}:`, error);
                                return 0; // Valor por defecto
                            })
                    );
                }
            }

            // Esperar todos los resultados en paralelo
            const results = await Promise.all(promises);

            // Organizar en matriz 2D
            for (let i = 0; i < results.length; i++) {
                ndvi.push(results[i] !== null ? results[i] : 0);
            }

            return {
                ndvi: ndvi,
                bounds: bounds,
                width: sampleSize,
                height: sampleSize
            };

        } catch (error) {
            console.warn('⚠️ Error cargando datos de vegetación para sub-tile:', error);
            return null;
        }
    }

    /**
     * 🚀 Extraer datos de sub-tile del tile padre de vegetación
     */
    extraerSubTileDeTileVegetacion(tilePadreData, subTile) {
        const subdivision = this.config.tileSubdivision || 4;
        const tileSize = 256; // Asumir tamaño estándar de tile de vegetación
        const subTileSize = tileSize / subdivision;

        const ndvi = tilePadreData.ndvi;
        const subTileNdvi = [];

        // Calcular offsets para el sub-tile dentro del tile padre
        const offsetY = subTile.subY * subTileSize;
        const offsetX = subTile.subX * subTileSize;

        // Extraer la porción correspondiente
        for (let y = 0; y < subTileSize; y++) {
            for (let x = 0; x < subTileSize; x++) {
                const padreIndex = (offsetY + y) * tileSize + (offsetX + x);
                if (padreIndex < ndvi.length) {
                    subTileNdvi.push(ndvi[padreIndex]);
                } else {
                    subTileNdvi.push(0); // Valor por defecto
                }
            }
        }

        // Calcular NDVI promedio del sub-tile
        const avgNdvi = subTileNdvi.reduce((sum, val) => sum + val, 0) / subTileNdvi.length;

        return {
            ...subTile,
            ndvi: avgNdvi,
            tipo: this.clasificarVegetacion(avgNdvi)
        };
    }

    /**
     * OPTIMIZACIÓN: Calcular tiles de vegetación de forma optimizada
     */
    calcularTilesVegetacionOptimizado(bounds) {
        // Tiles más grandes para vegetación (menos resolución)
        const tiles = [];
        const tileSize = 0.02; // Tiles más grandes que para elevación

        const minLat = Math.floor(bounds.south / tileSize);
        const maxLat = Math.ceil(bounds.north / tileSize);
        const minLng = Math.floor(bounds.west / tileSize);
        const maxLng = Math.ceil(bounds.east / tileSize);

        // Limitar número de tiles de vegetación
        const maxVegetationTiles = 8;
        let tileCount = 0;

        for (let lat = minLat; lat <= maxLat && tileCount < maxVegetationTiles; lat++) {
            for (let lng = minLng; lng <= maxLng && tileCount < maxVegetationTiles; lng++) {
                tiles.push({ x: lng, y: lat });
                tileCount++;
            }
        }

        return tiles;
    }

    /**
     * OPTIMIZACIÓN: Crear instancias de vegetación optimizadas
     */
    async crearInstanciasVegetacionOptimizada(datosVegetacion, datosTerreno, opciones) {
        const densidad = opciones.vegetacionDensidad || this.config.vegetacionDensidad;
        const maxInstancias = Math.floor(datosVegetacion.areas.length * densidad * 100);

        if (maxInstancias === 0) return null;

        const instancedMesh = new THREE.InstancedMesh(
            this.crearGeometriaArbolOptimizada(),
            this.crearMaterialArbol(),
            maxInstancias
        );

        let instanceIndex = 0;

        for (const area of datosVegetacion.areas) {
            if (instanceIndex >= maxInstancias) break;

            // Solo crear vegetación si el área lo requiere
            if (area.tipo === 'desierto' || Math.random() > densidad) continue;

            // Número reducido de instancias por área
            const numInstancias = Math.min(Math.floor(Math.random() * 3) + 1, maxInstancias - instanceIndex);

            for (let i = 0; i < numInstancias && instanceIndex < maxInstancias; i++) {
                const matrix = new THREE.Matrix4();

                // Posición aleatoria dentro del área (optimizada)
                const x = (area.x + Math.random()) * 500; // Escala reducida
                const z = (area.y + Math.random()) * 500;

                // Altura basada en terreno (simplificada)
                const y = this.obtenerAlturaTerrenoOptimizada(x, z, datosTerreno);

                matrix.setPosition(x, y, z);

                // Escala aleatoria (reducida para performance)
                const scale = 0.3 + Math.random() * 0.3;
                matrix.scale(new THREE.Vector3(scale, scale, scale));

                // Rotación aleatoria
                matrix.multiply(new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2));

                instancedMesh.setMatrixAt(instanceIndex, matrix);
                instanceIndex++;
            }
        }

        // Ajustar count real
        instancedMesh.count = instanceIndex;
        instancedMesh.instanceMatrix.needsUpdate = true;

        console.log(`🌿 ${instanceIndex} instancias de vegetación creadas (optimizado)`);
        return instancedMesh;
    }

    /**
     * OPTIMIZACIÓN: Geometría de árbol simplificada
     */
    crearGeometriaArbolOptimizada() {
        // Geometría aún más simple para mejor performance
        return new THREE.ConeGeometry(0.2, 1, 6); // Menos segmentos
    }

    /**
     * OPTIMIZACIÓN: Obtener altura de terreno de forma simplificada
     */
    obtenerAlturaTerrenoOptimizada(x, z, datosTerreno) {
        // Versión simplificada que no requiere interpolación compleja
        if (!datosTerreno.elevations || datosTerreno.elevations.length === 0) return 0;

        // Conversión simplificada de coordenadas
        const localX = Math.floor((x / 500) * datosTerreno.width);
        const localZ = Math.floor((z / 500) * datosTerreno.height);

        const index = Math.max(0, Math.min(
            datosTerreno.elevations.length - 1,
            localZ * datosTerreno.width + localX
        ));

        return (datosTerreno.elevations[index] || 0) * (this.config.alturaExageracion || 2.0);
    }    async obtenerTilesElevacion(bounds) {
        if (!this.elevationHandler) {
            console.warn('⚠️ ElevationHandler no disponible');
            return [];
        }

        try {
            // Calcular qué tiles necesitamos basados en bounds
            const tiles = this.calcularTilesNecesarios(bounds);

            const tilesData = [];
            for (const tile of tiles) {
                try {
                    const tileData = await this.elevationHandler.getElevationTile(tile.x, tile.y, tile.z);
                    if (tileData) {
                        tilesData.push({
                            ...tile,
                            data: tileData
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Error cargando tile ${tile.x}_${tile.y}:`, error);
                }
            }

            return tilesData;
        } catch (error) {
            console.error('❌ Error obteniendo tiles de elevación:', error);
            return [];
        }
    }

    calcularTilesNecesarios(bounds) {
        // Calcular tiles necesarios basados en bounds geográficos
        // Esto depende del sistema de coordenadas que usan los tiles
        const tiles = [];

        // Lógica simplificada - necesitarías adaptar esto a tu sistema de tiles
        const tileSize = 0.01; // Ajustar según tu sistema de tiles

        const minLat = Math.floor(bounds.south / tileSize);
        const maxLat = Math.ceil(bounds.north / tileSize);
        const minLng = Math.floor(bounds.west / tileSize);
        const maxLng = Math.ceil(bounds.east / tileSize);

        for (let lat = minLat; lat <= maxLat; lat++) {
            for (let lng = minLng; lng <= maxLng; lng++) {
                tiles.push({
                    x: lng,
                    y: lat,
                    z: 10 // Nivel de zoom
                });
            }
        }

        return tiles;
    }

    async procesarDatosElevacion(tiles, bounds) {
        // Procesar datos TIF de elevación para crear un terreno unificado
        const datosProcesados = {
            width: 256, // Ajustar según tus tiles
            height: 256,
            elevations: [],
            bounds: bounds
        };

        // Combinar datos de múltiples tiles
        for (const tile of tiles) {
            if (tile.data && tile.data.elevations) {
                datosProcesados.elevations.push(...tile.data.elevations);
            }
        }

        // Normalizar y procesar elevaciones
        if (datosProcesados.elevations.length > 0) {
            const elevations = datosProcesados.elevations;
            const min = Math.min(...elevations);
            const max = Math.max(...elevations);

            datosProcesados.minElevation = min;
            datosProcesados.maxElevation = max;
            datosProcesados.elevationRange = max - min;
        }

        return datosProcesados;
    }

    crearGeometriaTerreno(datosTerreno, opciones) {
        const width = datosTerreno.width;
        const height = datosTerreno.height;
        const elevations = datosTerreno.elevations;

        const geometry = new THREE.PlaneGeometry(
            width * this.config.resolution,
            height * this.config.resolution,
            width - 1,
            height - 1
        );

        // Aplicar elevaciones a los vértices
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = Math.floor((i / 3) % width);
            const y = Math.floor((i / 3) / width);

            if (elevations && elevations[y * width + x] !== undefined) {
                vertices[i + 2] = elevations[y * width + x] * this.config.alturaExageracion;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        return geometry;
    }

    crearMaterialTerreno(datosTerreno) {
        // Crear material con texturas basadas en elevación
        const material = new THREE.MeshLambertMaterial({
            color: 0x8B7355, // Color base tierra
            transparent: false
        });

        // Podrías agregar texturas basadas en elevación
        // material.map = this.generarTexturaTerreno(datosTerreno);

        return material;
    }

    posicionarTerreno(mesh, bounds) {
        // Posicionar el terreno en coordenadas geográficas
        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;

        // Convertir coordenadas geográficas a coordenadas 3D
        // Esto depende de tu sistema de proyección
        mesh.position.set(centerLng * 1000, 0, centerLat * 1000);
        mesh.rotation.x = -Math.PI / 2; // Terreno horizontal
    }

    async generarVegetacionTerreno(bounds, datosTerreno) {
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible para vegetación');
            return;
        }

        console.log('🌿 Generando vegetación procedural...');

        try {
            // Obtener datos de vegetación para el área
            const datosVegetacion = await this.obtenerDatosVegetacion(bounds);

            // Generar instancias de vegetación
            const vegetacionMesh = await this.crearInstanciasVegetacion(datosVegetacion, datosTerreno);

            if (vegetacionMesh) {
                this.vegetacionMeshes.push(vegetacionMesh);
                this.sistema3DMaster.escena.add(vegetacionMesh);
            }

        } catch (error) {
            console.error('❌ Error generando vegetación:', error);
        }
    }

    async obtenerDatosVegetacion(bounds) {
        // Obtener datos de vegetación NDVI para el área
        const datosVegetacion = {
            areas: []
        };

        // Dividir el área en tiles de vegetación
        const tiles = this.calcularTilesVegetacion(bounds);

        for (const tile of tiles) {
            try {
                const tileData = await this.vegetationHandler.getVegetationTile(tile.x, tile.y);
                if (tileData) {
                    datosVegetacion.areas.push({
                        ...tile,
                        ndvi: tileData.ndvi,
                        tipo: this.clasificarVegetacion(tileData.ndvi)
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando vegetación tile ${tile.x}_${tile.y}:`, error);
            }
        }

        return datosVegetacion;
    }

    calcularTilesVegetacion(bounds) {
        // Calcular tiles de vegetación necesarios
        // Similar a calcularTilesNecesarios pero para vegetación
        const tiles = [];
        const tileSize = 0.005; // Tiles más pequeños para vegetación

        const minLat = Math.floor(bounds.south / tileSize);
        const maxLat = Math.ceil(bounds.north / tileSize);
        const minLng = Math.floor(bounds.west / tileSize);
        const maxLng = Math.ceil(bounds.east / tileSize);

        for (let lat = minLat; lat <= maxLat; lat++) {
            for (let lng = minLng; lng <= maxLng; lng++) {
                tiles.push({ x: lng, y: lat });
            }
        }

        return tiles;
    }

    clasificarVegetacion(ndvi) {
        // Clasificar tipo de vegetación basado en NDVI
        if (ndvi > 0.6) return 'bosque_denso';
        if (ndvi > 0.4) return 'bosque';
        if (ndvi > 0.2) return 'arbustos';
        if (ndvi > 0.1) return 'pasto';
        return 'desierto';
    }

    async crearInstanciasVegetacion(datosVegetacion, datosTerreno) {
        const instancedMesh = new THREE.InstancedMesh(
            this.crearGeometriaArbol(),
            this.crearMaterialArbol(),
            datosVegetacion.areas.length * 10 // Estimación de instancias
        );

        let instanceIndex = 0;

        for (const area of datosVegetacion.areas) {
            if (Math.random() > this.config.vegetacionDensidad) continue;

            // Crear múltiples instancias por área
            const numInstancias = Math.floor(Math.random() * 5) + 1;

            for (let i = 0; i < numInstancias; i++) {
                const matrix = new THREE.Matrix4();

                // Posición aleatoria dentro del área
                const x = (area.x + Math.random()) * 1000;
                const z = (area.y + Math.random()) * 1000;

                // Altura basada en terreno
                const y = this.obtenerAlturaTerreno(x, z, datosTerreno);

                matrix.setPosition(x, y, z);

                // Escala aleatoria
                const scale = 0.5 + Math.random() * 0.5;
                matrix.scale(new THREE.Vector3(scale, scale, scale));

                // Rotación aleatoria
                matrix.multiply(new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2));

                instancedMesh.setMatrixAt(instanceIndex, matrix);
                instanceIndex++;
            }
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    crearGeometriaArbol() {
        // Geometría simple de árbol (cono)
        return new THREE.ConeGeometry(0.5, 2, 8);
    }

    crearMaterialArbol() {
        return new THREE.MeshLambertMaterial({ color: 0x228B22 });
    }

    obtenerAlturaTerreno(x, z, datosTerreno) {
        // Obtener altura del terreno en una posición específica
        // Esto es una simplificación - necesitarías interpolación bilinear
        if (!datosTerreno.elevations) return 0;

        const localX = Math.floor(x / this.config.resolution);
        const localZ = Math.floor(z / this.config.resolution);

        const index = localZ * datosTerreno.width + localX;
        return datosTerreno.elevations[index] || 0;
    }

    generarTerrenoFallback(bounds) {
        console.log('🏔️ Generando terreno fallback (plano)...');

        // Terreno plano como fallback
        const geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
        const material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;

        return mesh;
    }

    cacheTerreno(key, mesh) {
        // Mantener cache limitado
        if (this.cacheTerrenos.size >= this.config.maxCacheTerrenos) {
            const firstKey = this.cacheTerrenos.keys().next().value;
            this.cacheTerrenos.delete(firstKey);
        }

        this.cacheTerrenos.set(key, mesh);
    }

    aplicarLOD(mesh, datosTerreno) {
        // Implementar Level of Detail para terrenos grandes
        // Esto es avanzado - simplificado por ahora
        console.log('📊 LOD aplicado (simplificado)');
    }

    /**
     * Integra el terreno con el sistema 3D maestro
     */
    integrarConSistema3D() {
        if (this.sistema3DMaster && this.sistema3DMaster.agregarTerrenoRealista) {
            this.sistema3DMaster.agregarTerrenoRealista(this);
            console.log('✅ Sistema de Terreno Realista integrado con MAIRA3DMaster');
        }
    }

    /**
     * Actualiza el terreno cuando cambian los bounds del mapa
     */
    actualizarTerreno(bounds) {
        // Limpiar terreno anterior
        this.limpiarTerreno();

        // Generar nuevo terreno
        this.generarTerrenoRealista(bounds, {
            vegetacion: true,
            lod: true
        }).then(terreno => {
            if (terreno && this.sistema3DMaster && this.sistema3DMaster.escena) {
                this.sistema3DMaster.escena.add(terreno);
                this.terrenoMesh = terreno;
            }
        });
    }

    limpiarTerreno() {
        if (this.terrenoMesh && this.sistema3DMaster && this.sistema3DMaster.escena) {
            this.sistema3DMaster.escena.remove(this.terrenoMesh);
            this.terrenoMesh.geometry.dispose();
            this.terrenoMesh.material.dispose();
            this.terrenoMesh = null;
        }

        // Limpiar vegetación
        this.vegetacionMeshes.forEach(mesh => {
            if (this.sistema3DMaster && this.sistema3DMaster.escena) {
                this.sistema3DMaster.escena.remove(mesh);
            }
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.vegetacionMeshes = [];

        // 🚀 Limpiar cache de sub-tiles
        this.limpiarCacheSubTiles();
    }

    /**
     * Obtiene elevación en un punto específico (para posicionar unidades)
     */
    async obtenerElevacion(lat, lng) {
        if (!this.elevationHandler) return 0;

        try {
            return await this.elevationHandler.getElevation(lat, lng);
        } catch (error) {
            console.warn('⚠️ Error obteniendo elevación:', error);
            return 0;
        }
    }

    /**
     * OPTIMIZACIÓN: Cache inteligente con límite de tamaño
     */
    cacheTerreno(key, terrenoMesh) {
        if (!this.config.cacheEnabled) return;

        // Limpiar cache si excede el límite
        if (this.cacheTerrenos.size >= this.config.maxCacheTerrenos) {
            const firstKey = this.cacheTerrenos.keys().next().value;
            const oldTerreno = this.cacheTerrenos.get(firstKey);
            if (oldTerreno && oldTerreno.parent) {
                oldTerreno.parent.remove(oldTerreno);
            }
            this.cacheTerrenos.delete(firstKey);
            console.log('🗑️ Terreno antiguo removido del cache');
        }

        this.cacheTerrenos.set(key, terrenoMesh);
        console.log(`💾 Terreno cacheado (${this.cacheTerrenos.size}/${this.config.maxCacheTerrenos})`);
    }

    /**
     * OPTIMIZACIÓN: Limpiar cache cuando cambia el área
     */
    limpiarCacheTerrenos() {
        for (const [key, terreno] of this.cacheTerrenos) {
            if (terreno && terreno.parent) {
                terreno.parent.remove(terreno);
            }
        }
        this.cacheTerrenos.clear();
        console.log('🧹 Cache de terrenos limpiado');
    }

    /**
     * 🚀 OPTIMIZACIÓN: Obtener estadísticas de performance mejoradas
     */
    obtenerEstadisticasPerformance() {
        const stats = {
            terrenosEnCache: this.cacheTerrenos ? this.cacheTerrenos.size : 0,
            subTilesElevacionEnCache: this.contarSubTilesPorTipo('elev'),
            subTilesVegetacionEnCache: this.contarSubTilesPorTipo('veg'),
            vegetacionInstancias: this.vegetacionMeshes ? this.vegetacionMeshes.reduce((total, mesh) => total + (mesh.count || 0), 0) : 0,
            memoriaEstimada: this.calcularMemoriaEstimada(),
            tiempoPromedioGeneracion: this.calcularTiempoPromedioGeneracion(),
            subdivisionTiles: this.config.tileSubdivision || 4,
            maxSubTiles: this.config.maxSubTiles || 32
        };

        console.log('📊 Estadísticas de Performance del Terreno (Sub-Tiles Completo):', stats);
        return stats;
    }

    /**
     * 🚀 Contar sub-tiles por tipo (elevación vs vegetación)
     */
    contarSubTilesPorTipo(tipo) {
        if (!this.cacheSubTiles) return 0;

        let count = 0;
        for (const key of this.cacheSubTiles.keys()) {
            if (tipo === 'elev' && !key.startsWith('veg_')) {
                count++;
            } else if (tipo === 'veg' && key.startsWith('veg_')) {
                count++;
            }
        }
        return count;
    }

    /**
     * 🚀 Limpiar cache de sub-tiles para liberar memoria
     */
    limpiarCacheSubTiles() {
        if (this.cacheSubTiles) {
            this.cacheSubTiles.clear();
            console.log('🧹 Cache de sub-tiles limpiado');
        }
    }

    /**
     * 🚀 Optimización avanzada: Precargar sub-tiles adyacentes
     */
    async precargarSubTilesAdyacentes(subTileActual) {
        if (!this.config.preloadAdjacent) return;

        const adyacentes = this.calcularSubTilesAdyacentes(subTileActual);

        // Precargar en background con baja prioridad
        setTimeout(async () => {
            for (const adyacente of adyacentes.slice(0, 4)) { // Máximo 4 adyacentes
                try {
                    await this.cargarSubTileElevacion(adyacente);
                } catch (error) {
                    // Silenciar errores de precarga
                }
            }
        }, 1000); // Esperar 1 segundo antes de precargar
    }

    /**
     * Calcular sub-tiles adyacentes para precarga
     */
    calcularSubTilesAdyacentes(subTile) {
        const adyacentes = [];
        const subdivision = this.config.tileSubdivision || 4;

        // Generar posiciones adyacentes
        const posicionesAdyacentes = [
            { subX: subTile.subX - 1, subY: subTile.subY },     // Izquierda
            { subX: subTile.subX + 1, subY: subTile.subY },     // Derecha
            { subX: subTile.subX, subY: subTile.subY - 1 },     // Arriba
            { subX: subTile.subX, subY: subTile.subY + 1 },     // Abajo
            { subX: subTile.subX - 1, subY: subTile.subY - 1 }, // Diagonal
            { subX: subTile.subX + 1, subY: subTile.subY + 1 }  // Diagonal
        ];

        for (const pos of posicionesAdyacentes) {
            if (pos.subX >= 0 && pos.subX < subdivision &&
                pos.subY >= 0 && pos.subY < subdivision) {

                adyacentes.push({
                    ...subTile,
                    subX: pos.subX,
                    subY: pos.subY
                });
            }
        }

        return adyacentes;
    }

    /**
     * Calcular memoria estimada usada por el sistema
     */
    calcularMemoriaEstimada() {
        const terrenos = this.cacheTerrenos.size;
        const vegetacion = this.vegetacionMeshes.length;
        // Estimación aproximada: 1MB por terreno + 0.5MB por mesh de vegetación
        return (terrenos * 1 + vegetacion * 0.5).toFixed(1) + ' MB';
    }

    /**
     * Calcular tiempo promedio de generación (simulado)
     */
    calcularTiempoPromedioGeneracion() {
        // En una implementación real, mediríamos los tiempos de generación
        // Por ahora devolvemos un estimado basado en configuración
        const baseTime = 500; // ms base
        const tileMultiplier = this.config.maxTiles * 50; // ms por tile
        const vegetationMultiplier = this.config.vegetacionDensidad * 200; // ms por densidad

        return (baseTime + tileMultiplier + vegetationMultiplier) + ' ms';
    }
}

// Exportar para uso global
window.SistemaTerrenoRealista = SistemaTerrenoRealista;