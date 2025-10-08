/**
 * ═══════════════════════════════════════════════════════════════════════
 * TERRAIN GENERATOR 3D - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de generación de terreno 3D basado en:
 * - Muestreo de puntos con heightmap (DEM)
 * - Valores NDVI para vegetación
 * - Interpolación de superficie
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-04
 */

class TerrainGenerator3D {
    constructor(config = {}) {
        this.config = {
            // Resolución del terreno
            resolution: config.resolution || 50, // Puntos por lado
            minResolution: 20,
            maxResolution: 500,
            
            // Escala vertical (exageración)
            verticalScale: config.verticalScale || 2.0,
            
            // Tamaño en metros
            realWorldSize: config.realWorldSize || 1000, // 1km por defecto
            
            // Vegetación - ✅ ULTRA OPTIMIZADO para no explotar la PC
            vegetationDensity: config.vegetationDensity || 0.005, // ✅ 0.5% (antes 5%) = ~50-100 árboles max
            vegetationMinNDVI: config.vegetationMinNDVI || 0.35,  // ✅ Aumentado de 0.2 a 0.35 (filtrar césped débil)
            
            // Colores del terreno según altura
            colorMap: config.colorMap || {
                water: 0x0066cc,      // < 0m
                beach: 0xf4e7b8,      // 0-2m
                grass: 0x7cbc4b,      // 2-50m
                forest: 0x2d5016,     // 50-100m
                mountain: 0x8b7355,   // 100-200m
                snow: 0xffffff        // > 200m
            },
            
            // Umbrales de vegetación NDVI
            ndviThresholds: {
                grass: { min: 0.2, max: 0.4 },
                bush: { min: 0.4, max: 0.6 },
                tree_medium: { min: 0.6, max: 0.75 },
                tree_tall: { min: 0.75, max: 1.0 }
            }
        };
        
        this.terrainMesh = null;
        this.vegetationObjects = [];
        this.pointGrid = null;
        this.bounds = null;
        this.satelliteAnalyzer = null; // Analyzer de imagen satelital
        this.modelLoader = null; // Loader de modelos GLTF
        this.vegetationInstancer = null; // Instancer para vegetación
        this.useInstancing = config.useInstancing !== false; // Default: true
        
        // 🚀 OPTIMIZACIÓN: Caché de geometrías y materiales
        this.geometryCache = new Map(); // { 'bush': geometry }
        this.materialCache = new Map(); // { 'bush': material }
        
        // 📊 Estadísticas de caché
        this.cacheStats = {
            hits: 0,
            misses: 0,
            getTotalAccesses() {
                return this.hits + this.misses;
            },
            getHitRate() {
                const total = this.getTotalAccesses();
                return total > 0 ? ((this.hits / total) * 100).toFixed(1) : 0;
            }
        };
        
        this.initialized = false;
        
        console.log('🏔️ TerrainGenerator3D inicializado', this.config);
    }
    
    /**
     * 🔧 Validar y corregir offset Y para modelos de vegetación
     * @param {string} type - Tipo de vegetación
     * @param {number} calculatedOffset - Offset calculado del bounding box
     * @param {number} modelHeight - Altura total del modelo
     * @returns {number} Offset validado
     */
    validateModelYOffset(type, calculatedOffset, modelHeight) {
        // Offsets manuales como fallback para modelos problemáticos
        const manualOffsets = {
            'grass': 0.05,         // Pasto muy pequeño, casi a nivel
            'bush': 0.2,           // Arbustos bajos
            'tree_tall': 0,        // Árboles altos bien modelados
            'tree_medium': 0,      // Árboles medianos bien modelados  
            'tree': 0              // Árboles genéricos bien modelados
        };
        
        // Validar si el offset es sospechoso
        if (modelHeight < 0.05 || calculatedOffset < -1 || calculatedOffset > 15) {
            const fallback = manualOffsets[type] !== undefined ? manualOffsets[type] : 0.2;
            console.warn(`⚠️ Offset inválido para '${type}': ${calculatedOffset.toFixed(2)}m (altura=${modelHeight.toFixed(2)}m), usando fallback=${fallback}`);
            return fallback;
        }
        
        return calculatedOffset;
    }
    
    /**
     * Inicializar con handlers necesarios
     */
    initialize(heightmapHandler, vegetationHandler, maira3DSystem, satelliteAnalyzer = null) {
        this.heightmapHandler = heightmapHandler;
        this.vegetationHandler = vegetationHandler;
        this.maira3DSystem = maira3DSystem;
        this.satelliteAnalyzer = satelliteAnalyzer; // Opcional
        
        // Inicializar loader de modelos GLTF
        if (window.GLTFModelLoader) {
            this.modelLoader = new GLTFModelLoader();
            this.modelLoader.initialize();
            console.log('✅ GLTFModelLoader inicializado');
            
            // ✅ FASE 2: Inicializar VegetationInstancer
            if (window.VegetationInstancer && this.useInstancing) {
                // Necesitamos la escena de maira3DSystem
                const scene = this.maira3DSystem?.scene;
                if (scene) {
                    this.vegetationInstancer = new VegetationInstancer(scene, this.modelLoader);
                    console.log('✅ VegetationInstancer inicializado (modo: INSTANCING)');
                } else {
                    console.warn('⚠️ No se pudo inicializar VegetationInstancer (scene no disponible)');
                    this.useInstancing = false;
                }
            } else if (!this.useInstancing) {
                console.log('ℹ️ Instancing deshabilitado (modo: meshes individuales)');
            }
        } else {
            console.warn('⚠️ GLTFModelLoader no disponible - usando geometrías procedurales');
        }
        
        if (!this.heightmapHandler) {
            console.warn('⚠️ HeightmapHandler no disponible - usando alturas planas');
        }
        
        if (!this.vegetationHandler) {
            console.warn('⚠️ VegetationHandler no disponible - vegetación deshabilitada');
        }
        
        if (!this.satelliteAnalyzer) {
            console.warn('⚠️ SatelliteAnalyzer no disponible - textura procedural');
        }
        
        this.initialized = true;
        console.log('✅ TerrainGenerator3D inicializado con handlers');
    }
    
    /**
     * Generar terreno 3D desde bounds de Leaflet
     */
    async generateTerrain(bounds, options = {}) {
        if (!this.initialized) {
            throw new Error('TerrainGenerator3D no inicializado - llama a initialize() primero');
        }
        
        console.log('🏗️ Generando terreno 3D...', bounds);
        
        // ✅ CALCULAR TAMAÑO REAL EN METROS usando Haversine
        const realDimensions = this.calculateRealWorldDimensions(bounds);
        console.log(`📏 Dimensiones reales: ${realDimensions.widthMeters.toFixed(0)}m x ${realDimensions.heightMeters.toFixed(0)}m`);
        
        // 🔥 Guardar dimensiones reales (no forzar cuadrado)
        this.config.realWorldWidth = realDimensions.widthMeters;
        this.config.realWorldHeight = realDimensions.heightMeters;
        this.config.realWorldSize = Math.max(realDimensions.widthMeters, realDimensions.heightMeters); // Para referencia
        this.bounds = bounds;
        
        // Aplicar opciones
        const resolution = options.resolution || this.config.resolution;
        const includeVegetation = options.includeVegetation !== false;
        
        try {
            // Paso 1: Generar grid de puntos
            const points = await this.generatePointGrid(bounds, resolution);
            console.log(`✅ Grid generado: ${points.length} puntos`);
            
            // DEBUG: Verificar estructura de puntos
            if (points.length > 0) {
                const firstPoint = points[0];
                console.log(`📊 Estructura de punto: normX=${firstPoint.normX}, normY=${firstPoint.normY}, x=${firstPoint.x}, y=${firstPoint.y}`);
            }
            
            // Paso 2: Obtener datos de elevación y vegetación
            const enrichedPoints = await this.enrichPointsWithData(points);
            console.log(`✅ Puntos enriquecidos con elevación y NDVI`);
            
            // Paso 3: Crear malla de terreno
            this.terrainMesh = this.createTerrainMesh(enrichedPoints, resolution);
            console.log('✅ Malla de terreno creada');
            
            // Paso 4: Agregar vegetación
            if (includeVegetation && this.vegetationHandler) {
                await this.addVegetationLayer(enrichedPoints);
                console.log(`✅ Vegetación agregada: ${this.vegetationObjects.length} objetos`);
            }
            
            // Paso 5: Agregar caminos 3D desde SatelliteAnalyzer
            const roads = [];
            if (this.satelliteAnalyzer && options.includeRoads !== false) {
                const roadObjects = this.addRoadsLayer();
                roads.push(...roadObjects);
                console.log(`✅ Caminos agregados: ${roadObjects.length} segmentos`);
            }
            
            // Paso 6: Agregar edificios 3D desde SatelliteAnalyzer
            const buildings = [];
            // TEMPORALMENTE DESACTIVADO - Causan confusión visual
            /*
            if (this.satelliteAnalyzer && options.includeBuildings !== false) {
                const buildingObjects = this.addBuildingsLayer();
                buildings.push(...buildingObjects);
                console.log(`✅ Edificios agregados: ${buildingObjects.length} cubos`);
            }
            */
            console.log(`⚠️ Edificios desactivados temporalmente`);
            
            // Paso 7: Agregar agua 3D desde SatelliteAnalyzer
            const water = [];
            // TEMPORALMENTE DESACTIVADO - Simplificar vista
            /*
            if (this.satelliteAnalyzer && options.includeWater !== false) {
                const waterObjects = this.addWaterLayer();
                water.push(...waterObjects);
                console.log(`✅ Agua agregada: ${waterObjects.length} planos`);
            }
            */
            console.log(`⚠️ Agua desactivada temporalmente`);
            
            return {
                terrain: this.terrainMesh,
                vegetation: this.vegetationObjects,
                roads: roads,
                buildings: buildings,
                water: water,
                points: enrichedPoints,
                stats: this.calculateStats(enrichedPoints)
            };
            
        } catch (error) {
            console.error('❌ Error generando terreno:', error);
            throw error;
        }
    }
    
    /**
     * Generar grid uniforme de puntos
     */
    generatePointGrid(bounds, resolution) {
        const points = [];
        
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        
        const latStep = (north - south) / resolution;
        const lonStep = (east - west) / resolution;
        
        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const lat = south + (i * latStep);
                const lon = west + (j * lonStep);
                
                points.push({
                    lat: lat,
                    lon: lon,
                    gridX: j,
                    gridY: i,
                    // ✅ CRÍTICO: Agregar coordenadas normalizadas para UVs
                    normX: j / resolution,  // 0 a 1 en X
                    normY: i / resolution   // 0 a 1 en Y
                });
            }
        }
        
        return points;
    }
    
    /**
     * Enriquecer puntos con datos de elevación y NDVI
     */
    async enrichPointsWithData(points) {
        const enriched = [];
        
        for (const point of points) {
            // Obtener elevación
            let elevation = 0;
            if (this.heightmapHandler && typeof this.heightmapHandler.getElevation === 'function') {
                try {
                    elevation = await this.heightmapHandler.getElevation(point.lat, point.lon);
                } catch (error) {
                    // Si falla, usar altura aleatoria pequeña
                    elevation = Math.random() * 5;
                }
            } else {
                // Generar terreno procedural simple si no hay heightmap
                elevation = this.generateProceduralHeight(point.lat, point.lon);
            }
            
            // ✅ Obtener NDVI con coordenadas normalizadas para análisis satelital
            let ndvi = 0;
            let vegetationType = null;
            let featureType = null;
            
            if (this.vegetationHandler && typeof this.vegetationHandler.getNDVI === 'function') {
                try {
                    // Pasar normX y normY para análisis de imagen satelital
                    const result = await this.vegetationHandler.getNDVI(
                        point.lat, 
                        point.lon,
                        point.normX,  // Coordenada normalizada X (0-1)
                        point.normY   // Coordenada normalizada Y (0-1)
                    );
                    
                    // 🔥 Manejar tanto objeto { ndvi, vegType } como número simple
                    if (typeof result === 'object' && result !== null) {
                        ndvi = result.ndvi;
                        vegetationType = result.vegType || this.ndviToVegetationType(ndvi);
                        featureType = result.featureType;
                    } else {
                        // Fallback: resultado numérico directo
                        ndvi = result;
                        vegetationType = this.ndviToVegetationType(ndvi);
                    }
                } catch (error) {
                    // NDVI aleatorio si falla
                    ndvi = Math.random() * 0.8;
                    vegetationType = this.ndviToVegetationType(ndvi);
                }
            } else {
                // NDVI procedural
                ndvi = this.generateProceduralNDVI(point.lat, point.lon, elevation);
                vegetationType = this.ndviToVegetationType(ndvi);
            }
            
            enriched.push({
                ...point,
                elevation: elevation,
                ndvi: ndvi,
                vegetationType: vegetationType,
                featureType: featureType
            });
        }
        
        return enriched;
    }
    
    /**
     * Crear malla de terreno 3D
     */
    createTerrainMesh(points, resolution) {
        if (!window.THREE) {
            throw new Error('THREE.js no disponible');
        }
        
        // 🔥 Usar dimensiones reales en lugar de cuadrado
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        
        // Crear geometría con aspect ratio correcto
        const geometry = new THREE.PlaneGeometry(
            width,      // Ancho real
            height,     // Alto real
            resolution,
            resolution
        );
        
        // Aplicar alturas a los vértices
        const vertices = geometry.attributes.position.array;
        const colors = [];
        
        // ✅ CRÍTICO: Crear UVs para mapear textura satelital
        const uvs = [];
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const vertexIndex = i * 3;
            
            // Aplicar altura con escala vertical
            vertices[vertexIndex + 2] = point.elevation * this.config.verticalScale;
            
            // Aplicar color según altura
            const color = this.getColorByElevation(point.elevation);
            colors.push(color.r, color.g, color.b);
            
            // ✅ NUEVO: Calcular UVs normalizados (0-1)
            // PlaneGeometry estándar: U=X, V=Y (antes de rotación del mesh)
            uvs.push(point.normX, 1 - point.normY); // Invertir V para textura
        }
        
        // Agregar colores a la geometría
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // ✅ NUEVO: Agregar UVs para textura satelital
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        console.log(`✅ UVs creados: ${uvs.length / 2} coordenadas`);
        if (uvs.length >= 2) {
            console.log(`📊 UV Sample - First: [${uvs[0].toFixed(3)}, ${uvs[1].toFixed(3)}], Last: [${uvs[uvs.length-2].toFixed(3)}, ${uvs[uvs.length-1].toFixed(3)}]`);
        }
        
        // Recalcular normales para iluminación correcta
        geometry.computeVertexNormals();
        
        // Crear textura satelital primero (si está disponible)
        let satelliteTexture = null;
        if (this.satelliteAnalyzer && this.satelliteAnalyzer.canvas) {
            try {
                satelliteTexture = this.satelliteAnalyzer.createTexture();
                console.log('✅ Textura satelital creada desde analyzer');
            } catch (error) {
                console.warn('⚠️ Error creando textura satelital:', error);
            }
        }
        
        // Material con textura o colores de vértice
        const material = new THREE.MeshStandardMaterial({
            map: satelliteTexture,
            vertexColors: !satelliteTexture, // Solo si no hay textura satelital
            side: THREE.DoubleSide,
            flatShading: false,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Crear mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Rotar para que sea horizontal
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        if (satelliteTexture) {
            // ✅ FORZAR actualización después de rotación
            satelliteTexture.needsUpdate = true;
            material.needsUpdate = true;
            console.log('✅ Textura satelital aplicada al terreno');
        } else {
            console.log('⚠️ Usando colores de vértice (sin textura satelital)');
        }
        
        return mesh;
    }
    
    /**
     * Agregar capa de vegetación
     */
    async addVegetationLayer(points) {
        if (!window.THREE) {
            console.warn('⚠️ THREE.js no disponible - vegetación omitida');
            return;
        }
        
        // ✅ NUEVO: Sistema basado en regiones (si está disponible)
        if (window.RegionDetector && window.SmartVegetationDistributor && this.satelliteAnalyzer) {
            console.log('🎯 Usando sistema basado en FEATURES AGRUPADOS (nueva generación)');
            return await this.addVegetationByRegions();
        }
        
        // ✅ FALLBACK: Sistema basado en grid (compatibilidad)
        console.log('📍 Usando sistema basado en GRID (modo legacy)');
        return await this.addVegetationByGrid(points);
    }
    
    /**
     * ✅ NUEVO: Sistema basado en regiones (preciso y eficiente)
     */
    async addVegetationByRegions() {
        console.log('🗺️ Iniciando sistema basado en features agrupados...');
        
        try {
            // Obtener datos de imagen y features
            const imageData = this.satelliteAnalyzer.imageData;
            const features = this.satelliteAnalyzer.getFeatures();
            
            if (!imageData || !features || features.length === 0) {
                console.warn('⚠️ No hay datos de imagen satelital - vegetación omitida');
                return [];
            }
            
            console.log(`📊 Features disponibles: ${features.length}`);
            
            // ✅ ESTRATEGIA ALTERNATIVA: Usar features directamente
            // En lugar de detectar regiones (que falla con sampling disperso),
            // agrupar features por tipo y distribuir alrededor de ellos
            
            const featuresByType = this.groupFeaturesByType(features);
            console.log(`📊 Features agrupados:`, Object.keys(featuresByType).map(k => `${k}=${featuresByType[k].length}`).join(', '));
            
            // Generar instancias desde features agrupados
            const instances = this.createInstancesFromFeatures(featuresByType, imageData);
            
            console.log(`✅ ${instances.length} instancias preparadas desde features`);
            
            if (instances.length === 0) {
                console.warn('⚠️ No se generaron instancias - usando fallback');
                return [];
            }
            
            // Paso 3: Convertir instancias a objetos 3D
            const vegetationObjects = await this.createVegetationFromInstances(instances);
            
            console.log(`✅ ${vegetationObjects.length} objetos 3D creados`);
            
            return vegetationObjects;
            
        } catch (error) {
            console.error('❌ Error en sistema basado en regiones:', error);
            console.warn('⚠️ Fallback a sistema basado en grid');
            return await this.addVegetationByGrid([]);
        }
    }
    
    /**
     * Agrupar features por tipo
     */
    groupFeaturesByType(features) {
        const grouped = {};
        
        features.forEach(feature => {
            if (!grouped[feature.type]) {
                grouped[feature.type] = [];
            }
            grouped[feature.type].push(feature);
        });
        
        return grouped;
    }
    
    /**
     * Crear instancias de vegetación desde features agrupados
     */
    createInstancesFromFeatures(featuresByType, imageData) {
        const instances = [];
        const width = imageData.width;
        const height = imageData.height;
        
        console.log(`🎨 createInstancesFromFeatures - imageData: ${width}×${height}`);
        
        // � ESCALA FIJA REALISTA: Árboles de 4-6 metros (sin factor dinámico)
        // Los árboles deben medir siempre lo mismo independiente del zoom
        
        console.log(`📐 Escala FIJA realista: árboles 0.04-0.06m (modelo MUY grande)`);
        
        // Configuración de densidad por tipo
        const densityConfig = {
            'vegetation': { 
                density: 3.00,          // 90% - Densidad alta para vegetación detectada
                type: 'tree_tall',      // Usa arbol.glb
                scale: [0.04, 0.08],    // 🌳 0.04-0.06 (modelo arbol.glb es GIGANTE)
                priority: 2
            },
            'forest': { 
                density: 0.30,          // 30% para bosques densos
                type: 'tree_tall',      // Usa arbol.glb
                scale: [0.05, 0.08],    // 🌲 0.05-0.08 metros para bosques
                priority: 1
            },
            'grass': { 
                density: 0.00,          // ❌ DESACTIVADO - Quedaba horrible
                type: 'grass', 
                scale: [0.0005, 0.001], 
                priority: 3
            },
            'crops': { 
                density: 0.00,          // 0% - DESACTIVADO
                type: 'bush', 
                scale: [0.6, 1.0],
                priority: 2
            }
        };
        
        console.log(`📊 Configuración de densidad:`, Object.fromEntries(
            Object.entries(densityConfig).map(([k, v]) => [k, `${(v.density * 100).toFixed(0)}%`])
        ));
        // Contador de instancias por tipo
        const instanceCounts = {};
        
        // Para cada tipo relevante
        for (const [featureType, features] of Object.entries(featuresByType)) {
            const config = densityConfig[featureType];
            if (!config) {
                console.log(`⏭️ Ignorando tipo no vegetal: '${featureType}'`);
                continue;
            }
            
            console.log(`🌿 Procesando ${features.length} features de tipo '${featureType}' (densidad: ${(config.density * 100).toFixed(0)}%, tipo 3D: '${config.type}')...`);
            
            let createdCount = 0;
            
            // Para cada feature, crear una o más instancias
            features.forEach((feature, idx) => {
                // Decidir si colocar instancia (probabilidad = density)
                if (Math.random() > config.density) return;
                
                createdCount++;
                
                // Debug para primeros 3 features
                if (idx < 3) {
                    console.log(`  📍 Feature ${idx}: pixel(${feature.x}, ${feature.y}) → tipo: ${config.type}`);
                }
                
                // Convertir píxel a coordenadas normalizadas
                const normX = feature.x / width;
                const normY = feature.y / height;
                
                // 🚀 FIX CRÍTICO: Usar directamente imageToTerrainCoords() en lugar de lat/lon
                // Esto evita doble conversión y garantiza consistencia
                const pos3D = this.imageToTerrainCoords(feature.x, feature.y);
                
                // Agregar variación de posición (jitter)
                const jitter = 2.0; // 2m de variación en coordenadas 3D
                pos3D.x += (Math.random() - 0.5) * jitter;
                pos3D.z += (Math.random() - 0.5) * jitter;
                
                // Crear instancia con posición 3D directa
                instances.push({
                    type: config.type,
                    position: pos3D, // Vector3 directo en lugar de lat/lon
                    scale: config.scale[0] + Math.random() * (config.scale[1] - config.scale[0]),
                    rotation: Math.random() * Math.PI * 2
                });
            });
            
            // Resumen por tipo procesado
            instanceCounts[config.type] = (instanceCounts[config.type] || 0) + createdCount;
            console.log(`  ✅ Creadas ${createdCount}/${features.length} instancias de '${config.type}' (${(createdCount / features.length * 100).toFixed(1)}%)`);
        }
        
        console.log(`📊 Resumen de instancias creadas:`, instanceCounts);
        console.log(`🎯 Total de instancias: ${instances.length}`);
        
        return instances;
    }
    
    /**
     * Crear objetos 3D desde instancias preparadas
     */
    async createVegetationFromInstances(instances) {
        console.log(`🌳 Creando ${instances.length} objetos 3D desde instancias...`);
        
        // 🚀 FIX v3: Las instancias ya tienen position como Vector3
        // SOLO configurar Y al nivel del terreno, el offset se aplica después
        const instancesWith3D = instances.map(inst => {
            const position = inst.position.clone(); // Ya es Vector3 desde imageToTerrainCoords
            
            // Obtener elevación en esa posición
            const terrainHeight = this.getHeightAt(position.x, position.z);
            
            // 🔧 FIX v4: Ajustes manuales por tipo para compensar pivots extraños
            const manualOffsets = {
                'grass': -0.3,       // Pasto: bajar 30cm (suele flotar)
                'bush': 0,           // Arbustos: nivel correcto
                'tree_tall': 0,      // Árboles: nivel correcto
                'tree_medium': 0,    // Árboles: nivel correcto
                'tree': 0            // Árboles: nivel correcto
            };
            
            const offset = manualOffsets[inst.type] || 0;
            position.y = terrainHeight + offset;
            
            return {
                ...inst,
                position: position
            };
        });
        
        // Filtrar instancias fuera del terreno
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        const validInstances = instancesWith3D.filter(inst => {
            return Math.abs(inst.position.x) <= halfWidth && Math.abs(inst.position.z) <= halfHeight;
        });
        
        const rejected = instancesWith3D.length - validInstances.length;
        if (rejected > 0) {
            console.warn(`⚠️ ${rejected} instancias fuera de terreno fueron rechazadas`);
        }
        
        console.log(`📍 ${validInstances.length} instancias válidas dentro del terreno`);
        
        // 🚀 PRIORIDAD: Usar InstancedMesh directo para máxima velocidad
        // Agrupar por tipo de vegetación
        const instancesByType = {};
        validInstances.forEach(inst => {
            if (!instancesByType[inst.type]) {
                instancesByType[inst.type] = [];
            }
            instancesByType[inst.type].push(inst);
        });
        
        console.log(`🌳 Tipos de vegetación: ${Object.keys(instancesByType).join(', ')}`);
        console.log(`📊 Distribución:`, Object.entries(instancesByType).map(([type, insts]) => 
            `${type}=${insts.length}`).join(', '));
        
        // Crear InstancedMesh para cada tipo
        const meshes = [];
        
        for (const [type, instances] of Object.entries(instancesByType)) {
            console.log(`🎨 Creando InstancedMesh para ${instances.length} instancias de '${type}'...`);
            
            try {
                const instancedMesh = await this.createInstancedVegetation(type, instances);
                if (instancedMesh) {
                    // 🏷️ Marcar el mesh con su tipo para filtrado
                    instancedMesh.userData.vegetationType = type;
                    meshes.push(instancedMesh);
                    console.log(`  ✅ InstancedMesh creado: ${instances.length} instancias de tipo '${type}'`);
                }
            } catch (error) {
                console.warn(`  ⚠️ Error creando InstancedMesh para ${type}, usando meshes individuales:`, error);
                
                // Fallback: meshes individuales
                for (const inst of instances) {
                    const vegObject = await this.createVegetationObject(
                        inst.type,
                        inst.position,
                        inst.scale
                    );
                    
                    if (vegObject) {
                        vegObject.rotation.y = inst.rotation;
                        vegObject.userData.vegetationType = inst.type; // 🏷️ Marcar tipo
                        meshes.push(vegObject);
                    }
                }
            }
        }
        
        this.vegetationObjects = meshes;
        return meshes;
    }
    
    /**
     * ✅ LEGACY: Sistema basado en grid (mantener para compatibilidad)
     */
    async addVegetationByGrid(points) {
        if (!window.THREE) {
            console.warn('⚠️ THREE.js no disponible - vegetación omitida');
            return;
        }
        
        // ✅ VALIDAR BOUNDS: Verificar que this.bounds esté disponible
        if (!this.bounds) {
            console.warn('⚠️ Bounds no disponibles - vegetación omitida');
            return;
        }
        
        const north = this.bounds.getNorth();
        const south = this.bounds.getSouth();
        const east = this.bounds.getEast();
        const west = this.bounds.getWest();
        
        // Filtrar puntos con vegetación suficiente Y dentro de bounds
        const vegetationPoints = points.filter(p => {
            // ✅ VALIDACIÓN 1: NDVI y densidad
            if (p.ndvi < this.config.vegetationMinNDVI || Math.random() >= this.config.vegetationDensity) {
                return false;
            }
            
            // ✅ VALIDACIÓN 2: Punto dentro de bounds geográficos
            if (p.lat < south || p.lat > north || p.lon < west || p.lon > east) {
                console.debug(`⚠️ Punto fuera de bounds: lat=${p.lat}, lon=${p.lon}`);
                return false;
            }
            
            return true;
        });
        
        console.log(`🌿 Agregando vegetación a ${vegetationPoints.length} puntos (validados dentro de bounds)...`);
        
        // 🔍 DEBUG: Verificar estado del sistema
        console.log(`🔍 DEBUG Vegetación:`, {
            instancer: !!this.vegetationInstancer,
            useInstancing: this.useInstancing,
            modelLoader: !!this.modelLoader,
            scene: !!this.maira3DSystem?.scene
        });
        
        // ✅ FASE 2: Usar instancing si está disponible
        if (this.vegetationInstancer && this.useInstancing) {
            console.log('📍 Usando modo INSTANCING');
            return await this.addVegetationWithInstancing(vegetationPoints);
        } else {
            console.log('📍 Usando modo MESHES INDIVIDUALES (fallback)');
            return await this.addVegetationIndividual(vegetationPoints);
        }
    }
    
    /**
     * ✅ FASE 2: Agregar vegetación con InstancedMesh (100x menos memoria)
     */
    async addVegetationWithInstancing(vegetationPoints) {
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        console.log(`🎨 Preparando instancias - Terreno: ${width.toFixed(0)}m × ${height.toFixed(0)}m (±${halfWidth.toFixed(0)}m × ±${halfHeight.toFixed(0)}m)`);
        
        // Preparar instancias agrupadas por tipo
        const instances = [];
        let rejectedCount = 0;
        
        for (const point of vegetationPoints) {
            try {
                // Convertir lat/lon a coordenadas 3D
                const position = this.latLonToLocal(point.lat, point.lon);
                const treeScale = this.getVegetationScale(point.vegetationType, point.ndvi);
                
                // 🎯 RAYCASTING: Detectar altura REAL del terreno en esta posición
                // Los árboles siguen flotando porque elevationData no coincide con el mesh generado
                // Usar raycaster para obtener la altura exacta donde el mesh toca el suelo
                let terrainHeight = point.elevation * this.config.verticalScale;
                
                if (this.terrain) {
                    const raycaster = new THREE.Raycaster();
                    const rayOrigin = new THREE.Vector3(position.x, 1000, position.z); // Empezar desde arriba
                    const rayDirection = new THREE.Vector3(0, -1, 0); // Dirección hacia abajo
                    raycaster.set(rayOrigin, rayDirection);
                    
                    const intersects = raycaster.intersectObject(this.terrain, true);
                    if (intersects.length > 0) {
                        terrainHeight = intersects[0].point.y; // Altura EXACTA del mesh
                    }
                }
                
                // Posicionar árbol EN el suelo (no bajo tierra)
                position.y = terrainHeight;
                
                // ✅ CORRECCIÓN PIVOTE: Modelo arbol.glb tiene pivote centrado
                // Necesitamos bajar el modelo para que la base toque position.y
                // Altura del modelo ~100 unidades GLB, escalado → altura final
                const modelHeight = 100; // Altura original del modelo en unidades GLB
                const scaledHeight = modelHeight * treeScale;
                const pivotOffset = -(scaledHeight * 0.5); // Bajar 50% para centrar base en suelo
                position.y += pivotOffset;
                
                // Debug: Log primeros 5 árboles
                if (vegetationPoints.indexOf(point) < 5) {
                    console.log(`🌳 Árbol ${vegetationPoints.indexOf(point) + 1}: terrainHeight=${terrainHeight.toFixed(2)}m, scale=${treeScale.toFixed(3)}, scaledHeight=${scaledHeight.toFixed(2)}m, pivotOffset=${pivotOffset.toFixed(2)}m, finalY=${position.y.toFixed(2)}m`);
                }
                
                // ✅ VALIDACIÓN 3: Posición 3D dentro del terreno (con dimensiones rectangulares)
                if (Math.abs(position.x) > halfWidth || Math.abs(position.z) > halfHeight) {
                    rejectedCount++;
                    if (rejectedCount <= 5) { // Solo mostrar primeros 5
                        console.warn(`⚠️ Posición 3D fuera de terreno: x=${position.x.toFixed(2)} (límite ±${halfWidth.toFixed(0)}), z=${position.z.toFixed(2)} (límite ±${halfHeight.toFixed(0)})`);
                    }
                    continue;
                }
                
                // ✅ MEZCLA DE TIPOS DE ÁRBOLES: Alternar entre alto, mediano y Oak
                // Esto crea variedad visual más realista
                let treeType = point.vegetationType;
                
                // Si es un árbol, mezclar tipos aleatoriamente
                if (treeType === 'tree_tall' || treeType === 'tree_medium' || treeType === 'tree_oak') {
                    const random = Math.random();
                    if (random < 0.50) {
                        treeType = 'tree_tall';    // 50% árboles altos (arbol.glb)
                    } else if (random < 0.85) {
                        treeType = 'tree_medium';  // 35% árboles medianos (trees_low.glb)
                    } else {
                        treeType = 'tree_oak';     // 15% Oak animado (variedad)
                    }
                }
                
                // Agregar a lista de instancias
                instances.push({
                    type: treeType,  // Usar tipo mezclado
                    position: position.clone(),
                    scale: treeScale,
                    rotation: Math.random() * Math.PI * 2 // Rotación aleatoria Y
                });
                
            } catch (error) {
                console.debug('Error preparando instancia:', error);
            }
        }
        
        if (rejectedCount > 0) {
            console.warn(`⚠️ Total rechazados por estar fuera de terreno: ${rejectedCount}/${vegetationPoints.length}`);
        }
        
        console.log(`🎨 Creando InstancedMeshes para ${instances.length} instancias (rechazados: ${rejectedCount})...`);
        
        // Crear instanced meshes
        const meshes = await this.vegetationInstancer.addInstances(instances);
        
        // Guardar referencias (para compatibilidad)
        this.vegetationObjects = meshes;
        
        // Mostrar estadísticas
        const stats = this.vegetationInstancer.getStats();
        console.log(`✅ Vegetación instanciada: ${stats.totalInstances} instancias en ${stats.types} tipos`);
        console.log(`📊 Por tipo:`, stats.byType);
        
        return meshes;
    }
    
    /**
     * Agregar vegetación con meshes individuales (fallback)
     */
    async addVegetationIndividual(vegetationPoints) {
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        console.log(`🌲 Creando meshes individuales - Terreno: ${width.toFixed(0)}m × ${height.toFixed(0)}m`);
        
        let addedCount = 0;
        let rejectedCount = 0;
        
        for (const point of vegetationPoints) {
            try {
                // Convertir lat/lon a coordenadas 3D
                const position = this.latLonToLocal(point.lat, point.lon);
                position.y = point.elevation * this.config.verticalScale;
                
                // ✅ VALIDACIÓN 3: Posición 3D dentro del terreno (con dimensiones rectangulares)
                if (Math.abs(position.x) > halfWidth || Math.abs(position.z) > halfHeight) {
                    rejectedCount++;
                    if (rejectedCount <= 5) { // Solo mostrar primeros 5
                        console.warn(`⚠️ [Individual] Posición 3D fuera de terreno: x=${position.x.toFixed(2)} (límite ±${halfWidth.toFixed(0)}), z=${position.z.toFixed(2)} (límite ±${halfHeight.toFixed(0)})`);
                    }
                    continue;
                }
                
                // Crear objeto 3D de vegetación (ahora es async)
                const vegObject = await this.createVegetationObject(
                    point.vegetationType,
                    position,
                    this.getVegetationScale(point.vegetationType, point.ndvi)
                );
                
                if (vegObject) {
                    this.vegetationObjects.push(vegObject);
                    addedCount++;
                }
                
            } catch (error) {
                // Ignorar errores individuales
                console.debug('Error agregando vegetación:', error);
            }
        }
        
        console.log(`✅ Meshes individuales creados: ${addedCount}/${vegetationPoints.length} (rechazados: ${rejectedCount})`);
        
        return this.vegetationObjects;
        
        // ✅ RESUMEN: Mostrar estadísticas de carga de modelos
        if (this.modelLoader && this.modelLoader.loadStats) {
            const stats = this.modelLoader.loadStats;
            console.log(`� Estadísticas de modelos GLTF: Exitosos=${stats.successful}, Fallidos=${stats.failed}, Cacheados=${stats.cached}`);
        }
    }
    
    /**
     * 🚀 Crear InstancedMesh para múltiples instancias del mismo tipo
     * @param {string} type - Tipo de vegetación (bush, tree_tall, grass, etc.)
     * @param {Array} instances - Array de instancias {position, scale, rotation}
     * @returns {Promise<THREE.InstancedMesh>}
     */
    async createInstancedVegetation(type, instances) {
        const count = instances.length;
        
        // 🚀 OPTIMIZACIÓN: Verificar caché primero
        let geometry = this.geometryCache.get(type);
        let material = this.materialCache.get(type);
        let modelYOffset = this.modelYOffsetCache?.get(type) || 0;
        
        if (!geometry || !material) {
            // ⚠️ Cache miss - cargar modelo
            this.cacheStats.misses++;
            
            // 1. Cargar el modelo base si no está en caché
            let baseModel;
            try {
                baseModel = await this.modelLoader.loadModel(type, 'vegetation');
                
                // 2. Extraer geometría y material del modelo GLTF
                baseModel.traverse((child) => {
                    if (child.isMesh && !geometry) {
                        geometry = child.geometry;
                        material = child.material;
                    }
                });
                
                if (!geometry || !material) {
                    throw new Error(`No se encontró geometría/material en modelo ${type}`);
                }
                
                // 🎨 FIX: Clonar material y asegurar que tenga color
                material = material.clone();
                
                // Si el material no tiene textura, asignar color por tipo
                if (!material.map) {
                    const colorsByType = {
                        'grass': 0x7cbc4b,        // Verde césped
                        'bush': 0x4a7c59,         // Verde arbusto
                        'tree_tall': 0x2d5016,    // Verde oscuro árboles
                        'tree_medium': 0x3a6b1f,  // Verde medio árboles
                        'tree': 0x3a6b1f          // Verde árboles general
                    };
                    material.color.setHex(colorsByType[type] || 0x4a7c59);
                    console.log(`🎨 Material sin textura - asignado color para '${type}'`);
                }
                
                // Calcular offset Y para que BASE del modelo toque el suelo
                geometry.computeBoundingBox();
                const bbox = geometry.boundingBox;
                modelYOffset = -bbox.min.y;
                
                // 🌱 AJUSTE ESPECIAL: Césped debe estar pegado al suelo
                if (type === 'grass') {
                    modelYOffset = 0; // Forzar que esté exactamente sobre el suelo
                    console.log(`🌱 Césped: offset forzado a 0 (pegado al suelo)`);
                } else {
                    console.log(`📐 Modelo '${type}': bbox.min.y=${bbox.min.y.toFixed(2)}, offset=${modelYOffset.toFixed(2)}`);
                }
                
                // �🚀 OPTIMIZACIÓN: Cachear para reutilizar
                this.geometryCache.set(type, geometry);
                this.materialCache.set(type, material);
                if (!this.modelYOffsetCache) this.modelYOffsetCache = new Map();
                this.modelYOffsetCache.set(type, modelYOffset);
                console.log(`💾 Geometría de '${type}' cacheada para reutilización`);
                
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar modelo para ${type}, usando geometría procedural`);
                
                // Fallback a geometría procedural
                geometry = this.getProceduralGeometry(type);
                material = this.getProceduralMaterial(type);
                
                // Geometría procedural ya está correctamente centrada
                modelYOffset = 0;
                
                // Cachear geometría procedural también
                this.geometryCache.set(type, geometry);
                this.materialCache.set(type, material);
                if (!this.modelYOffsetCache) this.modelYOffsetCache = new Map();
                this.modelYOffsetCache.set(type, modelYOffset);
            }
        } else {
            // ✅ Cache hit - reutilizar geometría
            this.cacheStats.hits++;
            const hitRate = this.cacheStats.getHitRate();
            console.log(`♻️ Reutilizando geometría cacheada de '${type}' (Cache hit rate: ${hitRate}%)`);
        }
        
        // 3. Crear InstancedMesh con geometría cacheada
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;
        
        // 4. Configurar matrices de transformación para cada instancia (con offset Y)
        this.setInstanceMatrices(instancedMesh, instances, modelYOffset);
        
        return instancedMesh;
    }
    
    /**
     * 🎨 Configurar matrices de transformación para InstancedMesh
     */
    setInstanceMatrices(instancedMesh, instances, modelYOffset = 0) {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const rotation = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        
        instances.forEach((inst, i) => {
            position.copy(inst.position);
            
            // 🔧 FIX: Aplicar offset Y para que BASE del modelo toque el suelo
            position.y += modelYOffset;
            
            rotation.set(0, inst.rotation, 0);
            quaternion.setFromEuler(rotation);
            scale.set(inst.scale, inst.scale, inst.scale);
            
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
        });
        
        instancedMesh.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * 🔷 Obtener geometría procedural según tipo
     * 🔧 FIX: Todas las geometrías se trasladan para que su base esté en Y=0
     */
    getProceduralGeometry(type) {
        let geometry;
        
        switch(type) {
            case 'grass':
                geometry = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 4);
                geometry.translate(0, 0.25, 0); // Elevar mitad de altura (0.5/2)
                break;
            case 'bush':
                geometry = new THREE.SphereGeometry(0.5, 8, 8);
                geometry.translate(0, 0.5, 0); // Elevar radio completo
                break;
            case 'tree_tall':
            case 'tree_medium':
            case 'tree_oak':
            case 'tree':
                geometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
                geometry.translate(0, 1.5, 0); // Elevar mitad de altura (3/2)
                break;
            default:
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                geometry.translate(0, 0.25, 0); // Elevar mitad de altura
                break;
        }
        
        return geometry;
    }
    
    /**
     * 🎨 Obtener material procedural según tipo
     */
    getProceduralMaterial(type) {
        const colors = {
            'grass': 0x7cbc4b,
            'bush': 0x4a7c59,
            'tree_tall': 0x2d5016,
            'tree_medium': 0x3a6b1f,
            'tree_oak': 0x4a7c2d,
            'tree': 0x3a6b1f
        };
        
        return new THREE.MeshStandardMaterial({ 
            color: colors[type] || 0x4a7c59,
            roughness: 0.8,
            metalness: 0.1
        });
    }
    
    /**
     * Crear objeto 3D de vegetación (GLTF o procedural)
     * @param {string} type - Tipo de vegetación
     * @param {THREE.Vector3} position - Posición
     * @param {number} scale - Escala
     * @returns {Promise<THREE.Object3D>}
     */
    async createVegetationObject(type, position, scale) {
        // Intentar cargar modelo GLTF primero
        if (this.modelLoader) {
            try {
                const model = await this.modelLoader.loadModel(type, 'vegetation');
                
                // 🔧 FIX: Calcular bounding box para ajustar posición Y
                const bbox = new THREE.Box3().setFromObject(model);
                const modelYOffset = -bbox.min.y; // Elevar para que base toque el suelo
                
                model.position.copy(position);
                model.position.y += modelYOffset; // Aplicar offset
                model.scale.set(scale, scale, scale);
                
                return model;
            } catch (error) {
                // ✅ Solo mostrar warning en modo debug
                console.debug(`⚠️ Error cargando modelo para ${type}:`, error.message);
            }
        }
        
        // Fallback a geometrías procedurales
        return this.createProceduralVegetation(type, position, scale);
    }

    /**
     * Crear vegetación procedural (fallback)
     */
    createProceduralVegetation(type, position, scale) {
        let geometry, material, mesh;
        
        switch(type) {
            case 'grass':
                // Pasto - pequeño cilindro verde
                geometry = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 4);
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x7cbc4b,
                    roughness: 0.9
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.scale.set(scale, scale * 0.5, scale);
                break;
                
            case 'bush':
                // Arbusto - esfera verde oscuro
                geometry = new THREE.SphereGeometry(0.5, 6, 6);
                material = new THREE.MeshStandardMaterial({ 
                    color: 0x4a7c59,
                    roughness: 0.8
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.scale.set(scale, scale, scale);
                break;
                
            case 'tree_medium':
                // Árbol mediano - cono + cilindro
                const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
                const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                
                const leavesGeo = new THREE.ConeGeometry(1.5, 3, 6);
                const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.y = 2.5;
                
                mesh = new THREE.Group();
                mesh.add(trunk);
                mesh.add(leaves);
                mesh.scale.set(scale, scale, scale);
                break;
                
            case 'tree_tall':
                // Árbol alto - más grande
                const tallTrunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
                const tallTrunkMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
                const tallTrunk = new THREE.Mesh(tallTrunkGeo, tallTrunkMat);
                
                const tallLeavesGeo = new THREE.ConeGeometry(2, 5, 8);
                const tallLeavesMat = new THREE.MeshStandardMaterial({ color: 0x1a3409 });
                const tallLeaves = new THREE.Mesh(tallLeavesGeo, tallLeavesMat);
                tallLeaves.position.y = 4.5;
                
                mesh = new THREE.Group();
                mesh.add(tallTrunk);
                mesh.add(tallLeaves);
                mesh.scale.set(scale, scale, scale);
                break;
                
            default:
                return null;
        }
        
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }
    
    /**
     * Convertir NDVI a tipo de vegetación
     */
    ndviToVegetationType(ndvi) {
        const thresholds = this.config.ndviThresholds;
        
        if (ndvi >= thresholds.tree_tall.min && ndvi <= thresholds.tree_tall.max) {
            return 'tree_tall';
        }
        if (ndvi >= thresholds.tree_medium.min && ndvi <= thresholds.tree_medium.max) {
            return 'tree_medium';
        }
        if (ndvi >= thresholds.bush.min && ndvi <= thresholds.bush.max) {
            return 'bush';
        }
        if (ndvi >= thresholds.grass.min && ndvi <= thresholds.grass.max) {
            return 'grass';
        }
        
        return null; // Sin vegetación
    }
    
    /**
     * Obtener escala de vegetación según tipo y NDVI
     */
    getVegetationScale(type, ndvi) {
        // ✅ ESCALAS REDUCIDAS - Los modelos GLB son muy grandes
        const baseScales = {
            grass: 0.02,        // Muy pequeño (césped)
            bush: 0.05,         // Pequeño (arbusto)
            tree_medium: 0.08,  // Mediano (árbol bajo)
            tree_tall: 0.12     // Grande (árbol alto)
        };
        
        const base = baseScales[type] || 0.05;
        const variance = 0.3; // ±30%
        
        return base * (1 + (Math.random() - 0.5) * variance);
    }
    
    /**
     * Convertir lat/lon a coordenadas locales 3D
     * ✅ Con validación de bounds y clamping
     */
    latLonToLocal(lat, lon) {
        if (!this.bounds) {
            console.warn('⚠️ latLonToLocal llamado sin bounds');
            return new THREE.Vector3(0, 0, 0);
        }
        
        const north = this.bounds.getNorth();
        const south = this.bounds.getSouth();
        const east = this.bounds.getEast();
        const west = this.bounds.getWest();
        
        // Normalizar a rango [0, 1]
        const x = (lon - west) / (east - west);
        const z = (lat - south) / (north - south);
        
        // ✅ FIX CRÍTICO: Usar dimensiones reales (rectangulares) en lugar de cuadrado
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        
        // Calcular posición centrada con dimensiones correctas
        const posX = (x - 0.5) * width;
        const posZ = (z - 0.5) * height;
        
        return new THREE.Vector3(posX, 0, posZ);
    }
    
    /**
     * Obtener color según elevación
     */
    getColorByElevation(elevation) {
        const colorMap = this.config.colorMap;
        
        let hexColor;
        if (elevation < 0) hexColor = colorMap.water;
        else if (elevation < 2) hexColor = colorMap.beach;
        else if (elevation < 50) hexColor = colorMap.grass;
        else if (elevation < 100) hexColor = colorMap.forest;
        else if (elevation < 200) hexColor = colorMap.mountain;
        else hexColor = colorMap.snow;
        
        return new THREE.Color(hexColor);
    }
    
    /**
     * Generar altura procedural (fallback)
     */
    generateProceduralHeight(lat, lon) {
        // Noise simple usando seno
        const freq1 = 0.1;
        const freq2 = 0.05;
        
        const noise1 = Math.sin(lat * freq1) * Math.cos(lon * freq1) * 20;
        const noise2 = Math.sin(lat * freq2) * Math.cos(lon * freq2) * 50;
        
        return Math.max(0, noise1 + noise2);
    }
    
    /**
     * Generar NDVI procedural (fallback)
     */
    generateProceduralNDVI(lat, lon, elevation) {
        // Vegetación más densa en elevaciones medias
        if (elevation < 5 || elevation > 150) {
            return Math.random() * 0.3; // Baja vegetación
        }
        
        return 0.4 + Math.random() * 0.5; // Vegetación media-alta
    }
    
    /**
     * Calcular estadísticas del terreno
     */
    calculateStats(points) {
        const elevations = points.map(p => p.elevation);
        const ndvis = points.map(p => p.ndvi);
        
        return {
            points: points.length,
            elevation: {
                min: Math.min(...elevations),
                max: Math.max(...elevations),
                avg: elevations.reduce((a, b) => a + b, 0) / elevations.length
            },
            ndvi: {
                min: Math.min(...ndvis),
                max: Math.max(...ndvis),
                avg: ndvis.reduce((a, b) => a + b, 0) / ndvis.length
            },
            vegetation: {
                total: this.vegetationObjects.length,
                density: (this.vegetationObjects.length / points.length) * 100
            },
            // ✅ Agregar dimensiones reales calculadas con Haversine
            realDimensions: this.bounds ? this.calculateRealWorldDimensions(this.bounds) : null
        };
    }
    
    /**
     * Agregar capa de caminos 3D
     * Usa datos detectados por SatelliteAnalyzer
     */
    addRoadsLayer() {
        if (!this.satelliteAnalyzer || !window.THREE) {
            return [];
        }
        
        const roadObjects = [];
        const features = this.satelliteAnalyzer.getFeatures();
        const roadPoints = features.filter(f => f.type === 'roads'); // ✅ CORREGIDO: 'roads' plural
        
        console.log(`🛣️ Puntos de caminos detectados: ${roadPoints.length}`);
        
        if (roadPoints.length === 0) {
            return [];
        }
        
        // Agrupar puntos cercanos en segmentos de camino
        const segments = this.groupRoadSegments(roadPoints);
        
        segments.forEach((segment, idx) => {
            if (segment.length < 2) return;
            
            // Crear geometría de línea
            const points = segment.map(p => {
                const pos = this.imageToTerrainCoords(p.x, p.y);
                // Elevar ligeramente sobre el terreno
                pos.y = this.getHeightAt(pos.x, pos.z) + 0.5;
                return new THREE.Vector3(pos.x, pos.y, pos.z);
            });
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: 0x555555,
                linewidth: 3
            });
            const line = new THREE.Line(geometry, material);
            line.name = `road_${idx}`;
            
            roadObjects.push(line);
        });
        
        return roadObjects;
    }
    
    /**
     * Agrupar puntos de caminos en segmentos conectados
     */
    groupRoadSegments(roadPoints, maxDistance = 150) {
        const segments = [];
        const used = new Set();
        
        for (let i = 0; i < roadPoints.length; i++) {
            if (used.has(i)) continue;
            
            const segment = [roadPoints[i]];
            used.add(i);
            
            // Buscar puntos cercanos
            let changed = true;
            while (changed && segment.length < 100) {
                changed = false;
                const last = segment[segment.length - 1];
                
                for (let j = 0; j < roadPoints.length; j++) {
                    if (used.has(j)) continue;
                    
                    const dist = Math.hypot(
                        roadPoints[j].x - last.x,
                        roadPoints[j].y - last.y
                    );
                    
                    if (dist < maxDistance) {
                        segment.push(roadPoints[j]);
                        used.add(j);
                        changed = true;
                        break;
                    }
                }
            }
            
            if (segment.length >= 2) {
                segments.push(segment);
            }
        }
        
        return segments;
    }
    
    /**
     * Agregar capa de agua 3D
     * Renderiza planos azules semi-transparentes
     */
    addWaterLayer() {
        if (!this.satelliteAnalyzer || !window.THREE) {
            console.warn('⚠️ SatelliteAnalyzer o THREE.js no disponible');
            return [];
        }
        
        const features = this.satelliteAnalyzer.getFeatures();
        const waterPoints = features.filter(f => f.type === 'water');
        
        console.log(`💧 Agua: detectados ${waterPoints.length} puntos`);
        
        if (waterPoints.length === 0) {
            return [];
        }
        
        // Agrupar puntos de agua en clusters
        const clusters = this.clusterBuildings(waterPoints); // Reutilizamos método de clustering
        const waterObjects = [];
        
        clusters.forEach((cluster, idx) => {
            // Calcular centro y tamaño del cluster
            const center = this.calculateClusterCenter(cluster);
            const size = this.calculateClusterSize(cluster);
            
            // Validar que center tenga valores válidos
            if (!center || isNaN(center.x) || isNaN(center.y)) {
                console.warn(`⚠️ Centro de cluster de agua inválido:`, center);
                return;
            }
            
            // Convertir a coordenadas 3D
            const pos = this.imageToTerrainCoords(center.x, center.y);
            
            // Validar posición 3D
            if (isNaN(pos.x) || isNaN(pos.z)) {
                console.warn(`⚠️ Posición 3D de agua inválida:`, pos);
                return;
            }
            
            // 🔥 Obtener elevación promedio del cluster para posicionar agua al nivel del terreno
            const avgElevation = cluster.reduce((sum, pt) => sum + (pt.elevation || 0), 0) / cluster.length;
            const terrainHeight = avgElevation * this.verticalScale; // Escalar igual que el terreno
            
            // Crear plano horizontal de agua
            const width = Math.max(size.width * 5, 5);
            const depth = Math.max(size.depth * 5, 5); // ✅ CORRECTO: usar size.depth
            
            // Validar dimensiones
            if (isNaN(width) || isNaN(depth) || width <= 0 || depth <= 0) {
                console.warn(`⚠️ Dimensiones de agua inválidas: width=${width}, depth=${depth}`);
                return;
            }
            
            const geometry = new THREE.PlaneGeometry(width, depth);
            
            // Material azul semi-transparente
            const material = new THREE.MeshStandardMaterial({
                color: 0x1E90FF,  // Azul dodger
                transparent: true,
                opacity: 0.6,
                roughness: 0.1,   // Superficie lisa
                metalness: 0.3,
                side: THREE.DoubleSide
            });
            
            const water = new THREE.Mesh(geometry, material);
            
            // Posicionar ligeramente sobre el terreno (nivel del agua)
            water.rotation.x = -Math.PI / 2; // Horizontal
            water.position.set(pos.x, terrainHeight + 0.2, pos.z);
            water.receiveShadow = true;
            
            water.userData = {
                type: 'water',
                clusterId: idx,
                pointCount: cluster.length
            };
            
            waterObjects.push(water);
            console.log(`  💧 Agua ${idx + 1}: ${cluster.length} puntos, pos(${pos.x.toFixed(1)}, ${terrainHeight.toFixed(1)}, ${pos.z.toFixed(1)})`);
        });
        
        return waterObjects;
    }
    
    /**
     * Agregar capa de edificios 3D
     * Usa datos detectados por SatelliteAnalyzer
     */
    addBuildingsLayer() {
        if (!this.satelliteAnalyzer || !window.THREE) {
            return [];
        }
        
        const buildingObjects = [];
        const features = this.satelliteAnalyzer.getFeatures();
        const buildingPoints = features.filter(f => f.type === 'buildings'); // ✅ CORREGIDO: 'buildings' plural
        
        console.log(`🏢 Puntos de edificios detectados: ${buildingPoints.length}`);
        
        if (buildingPoints.length === 0) {
            return [];
        }
        
        // Agrupar edificios cercanos en clusters
        const clusters = this.clusterBuildings(buildingPoints);
        
        clusters.forEach((cluster, idx) => {
            // Calcular centro y tamaño del cluster
            const center = this.calculateClusterCenter(cluster);
            const size = this.calculateClusterSize(cluster);
            
            // Validar que center tenga valores válidos
            if (!center || isNaN(center.x) || isNaN(center.y)) {
                console.warn(`⚠️ Centro de cluster de edificio inválido:`, center);
                return;
            }
            
            // Convertir a coordenadas 3D
            const pos = this.imageToTerrainCoords(center.x, center.y);
            
            // ✅ VALIDAR: Edificio dentro del terreno
            const terrainWidth = this.config.realWorldWidth || this.config.realWorldSize;
            const terrainDepth = this.config.realWorldHeight || this.config.realWorldSize;
            const halfWidth = terrainWidth / 2;
            const halfDepth = terrainDepth / 2;
            
            if (Math.abs(pos.x) > halfWidth || Math.abs(pos.z) > halfDepth) {
                console.warn(`⚠️ Edificio fuera de terreno: x=${pos.x.toFixed(2)} (límite ±${halfWidth.toFixed(0)}), z=${pos.z.toFixed(2)} (límite ±${halfDepth.toFixed(0)})`);
                return;
            }
            
            // Validar posición 3D
            if (isNaN(pos.x) || isNaN(pos.z)) {
                console.warn(`⚠️ Posición 3D de edificio inválida:`, pos);
                return;
            }
            
            // 🏢 Calcular altura basada en área del cluster (edificios grandes = más altos)
            const area = cluster.length; // Proxy del área
            const baseHeight = 8; // Altura mínima
            const height = baseHeight + Math.sqrt(area) * 2; // Altura proporcional a √área
            
            // 🎨 Extraer color real de la imagen en el centro del edificio
            const imageData = this.satelliteAnalyzer.imageData;
            const pixelX = Math.floor(center.x);
            const pixelY = Math.floor(center.y);
            const pixelIndex = (pixelY * imageData.width + pixelX) * 4;
            const r = imageData.data[pixelIndex] || 128;
            const g = imageData.data[pixelIndex + 1] || 128;
            const b = imageData.data[pixelIndex + 2] || 128;
            const color = (r << 16) | (g << 8) | b;
            
            // Obtener elevación del terreno
            const terrainHeight = this.getHeightAt(pos.x, pos.z);
            
            // 📦 Crear geometría realista basada en dimensiones del cluster
            const width = Math.max(3, size.width * 2);  // Mínimo 3m, escala reducida
            const depth = Math.max(3, size.depth * 2);
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({ 
                color: color,
                roughness: 0.9,
                metalness: 0.1,
                flatShading: false
            });
            const building = new THREE.Mesh(geometry, material);
            
            // Posicionar: base en terreno, elevar por mitad de altura
            building.position.set(pos.x, terrainHeight + height / 2, pos.z);
            building.castShadow = true;
            building.receiveShadow = true;
            building.name = `building_${idx}`;
            
            buildingObjects.push(building);
        });
        
        return buildingObjects;
    }
    
    /**
     * Agrupar edificios en clusters
     */
    clusterBuildings(buildingPoints, maxDistance = 30) {
        const clusters = [];
        const used = new Set();
        
        for (let i = 0; i < buildingPoints.length; i++) {
            if (used.has(i)) continue;
            
            const cluster = [buildingPoints[i]];
            used.add(i);
            
            // Buscar puntos cercanos
            for (let j = i + 1; j < buildingPoints.length; j++) {
                if (used.has(j)) continue;
                
                const dist = Math.hypot(
                    buildingPoints[j].x - buildingPoints[i].x,
                    buildingPoints[j].y - buildingPoints[i].y
                );
                
                if (dist < maxDistance) {
                    cluster.push(buildingPoints[j]);
                    used.add(j);
                }
            }
            
            clusters.push(cluster);
        }
        
        return clusters;
    }
    
    /**
     * Calcular centro de un cluster
     */
    calculateClusterCenter(cluster) {
        const sumX = cluster.reduce((sum, p) => sum + p.x, 0);
        const sumY = cluster.reduce((sum, p) => sum + p.y, 0);
        return {
            x: sumX / cluster.length,
            y: sumY / cluster.length
        };
    }
    
    /**
     * Calcular tamaño de un cluster
     */
    calculateClusterSize(cluster) {
        const xs = cluster.map(p => p.x);
        const ys = cluster.map(p => p.y);
        return {
            width: Math.max(...xs) - Math.min(...xs) + 5,
            depth: Math.max(...ys) - Math.min(...ys) + 5
        };
    }
    
    /**
     * Convertir coordenadas de imagen a coordenadas 3D del terreno
     */
    imageToTerrainCoords(imgX, imgY) {
        if (!this.satelliteAnalyzer || !this.satelliteAnalyzer.imageData) {
            console.warn('⚠️ No hay imageData disponible');
            return new THREE.Vector3(0, 0, 0);
        }
        
        const imageWidth = this.satelliteAnalyzer.imageData.width;
        const imageHeight = this.satelliteAnalyzer.imageData.height;
        
        // Normalizar coordenadas de imagen (0-1)
        const normX = imgX / imageWidth;
        const normY = imgY / imageHeight;
        
        // ✅ FIX: Usar dimensiones rectangulares reales
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const height = this.config.realWorldHeight || this.config.realWorldSize;
        
        // Mapear a coordenadas del terreno con dimensiones correctas
        const x = (normX - 0.5) * width;
        const z = (normY - 0.5) * height;
        
        return new THREE.Vector3(x, 0, z);
    }
    
    /**
     * Obtener altura del terreno en una posición X,Z con interpolación bilineal
     */
    getHeightAt(x, z) {
        // ✅ MÉTODO MEJORADO: Interpolación bilineal con dimensiones rectangulares
        if (!this.terrainMesh || !this.terrainMesh.geometry) {
            console.warn('⚠️ terrainMesh no disponible, retornando 0');
            return 0;
        }
        
        const geometry = this.terrainMesh.geometry;
        const positions = geometry.attributes.position.array;
        
        // 🚀 FIX: Usar dimensiones reales (rectangulares)
        const width = this.config.realWorldWidth || this.config.realWorldSize;
        const depth = this.config.realWorldHeight || this.config.realWorldSize;
        const resolution = this.config.resolution;
        
        // Convertir coordenadas mundiales a coordenadas normalizadas [0, 1]
        const normX = (x + width/2) / width;
        const normZ = (z + depth/2) / depth;
        
        // ✅ Validar límites y retornar 0 si está fuera
        if (normX < 0 || normX > 1 || normZ < 0 || normZ > 1) {
            return 0;
        }
        
        // Convertir a índices del grid
        const gridX = normX * resolution;
        const gridZ = normZ * resolution;
        
        // Obtener índices de los 4 vértices cercanos
        const x0 = Math.floor(gridX);
        const z0 = Math.floor(gridZ);
        const x1 = Math.min(x0 + 1, resolution);
        const z1 = Math.min(z0 + 1, resolution);
        
        // Factores de interpolación
        const fx = gridX - x0;
        const fz = gridZ - z0;
        
        // Obtener alturas de los 4 vértices (índice Y en positions)
        const getHeight = (gx, gz) => {
            const idx = (gz * (resolution + 1) + gx) * 3;
            // ✅ Verificar que el índice sea válido
            if (idx + 2 >= positions.length) return 0;
            return positions[idx + 2] || 0; // Z component es la altura
        };
        
        const h00 = getHeight(x0, z0);
        const h10 = getHeight(x1, z0);
        const h01 = getHeight(x0, z1);
        const h11 = getHeight(x1, z1);
        
        // Interpolación bilineal
        const h0 = h00 * (1 - fx) + h10 * fx;
        const h1 = h01 * (1 - fx) + h11 * fx;
        const height = h0 * (1 - fz) + h1 * fz;
        
        // ✅ Asegurar que retorna un número válido
        return isNaN(height) ? 0 : height;
    }
    
    /**
     * Limpiar terreno generado
     */
    clear() {
        if (this.terrainMesh) {
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
            this.terrainMesh = null;
        }
        
        // Limpiar vegetación (meshes individuales o InstancedMeshes)
        this.vegetationObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            // InstancedMeshes tienen matrices que no necesitan dispose
        });
        this.vegetationObjects = [];
        
        // Limpiar InstancedMeshes si existen
        if (this.vegetationInstancer) {
            this.vegetationInstancer.clear();
        }
        
        // 🚀 OPTIMIZACIÓN: NO limpiar geometryCache ni materialCache
        // Mantener en memoria para reutilizar en próxima generación
        // Solo limpiar si se llama clearCache() explícitamente
        
        // ✅ NO limpiar la caché de modelos fallidos (es útil entre generaciones)
        // this.failedModelCache.clear();
        // this.modelLoadAttempts.clear();
        
        console.log('🧹 Terreno limpiado (caché de geometrías preservado)');
        
        // Mostrar estadísticas de caché si hay datos
        if (this.geometryCache.size > 0) {
            this.getCacheStats();
        }
    }
    
    /**
     * 🗑️ Limpiar caché de geometrías y materiales
     * Usar solo cuando se cambia de escenario completamente
     */
    clearCache() {
        // Dispose de geometrías cacheadas
        for (const [type, geometry] of this.geometryCache) {
            geometry.dispose();
            console.log(`🗑️ Geometría de '${type}' eliminada del caché`);
        }
        this.geometryCache.clear();
        
        // Dispose de materiales cacheados
        for (const [type, material] of this.materialCache) {
            material.dispose();
            console.log(`🗑️ Material de '${type}' eliminado del caché`);
        }
        this.materialCache.clear();
        
        console.log('🧹 Caché de geometrías completamente limpiado');
    }
    
    /**
     * 📊 Obtener estadísticas de caché
     */
    getCacheStats() {
        const stats = {
            geometries: this.geometryCache.size,
            materials: this.materialCache.size,
            types: Array.from(this.geometryCache.keys()),
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            hitRate: this.cacheStats.getHitRate() + '%',
            totalAccesses: this.cacheStats.getTotalAccesses()
        };
        
        console.log('📊 Estadísticas de caché de geometrías:');
        console.log(`   Tipos cacheados: ${stats.types.join(', ')}`);
        console.log(`   Cache hits: ${stats.hits}, misses: ${stats.misses}`);
        console.log(`   Hit rate: ${stats.hitRate}`);
        
        return stats;
    }
    
    /**
     * Actualizar configuración
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Configuración actualizada', this.config);
    }
    
    /**
     * ✅ CALCULAR DIMENSIONES REALES DEL TERRENO EN METROS
     * Usa fórmula de Haversine para distancia geodésica
     */
    calculateRealWorldDimensions(bounds) {
        const north = bounds.getNorth();
        const south = bounds.getSouth();
        const east = bounds.getEast();
        const west = bounds.getWest();
        
        // Ancho (distancia este-oeste en el centro)
        const centerLat = (north + south) / 2;
        const widthMeters = this.haversineDistance(centerLat, west, centerLat, east);
        
        // Alto (distancia norte-sur)
        const centerLon = (east + west) / 2;
        const heightMeters = this.haversineDistance(north, centerLon, south, centerLon);
        
        return { widthMeters, heightMeters };
    }
    
    /**
     * Fórmula de Haversine para calcular distancia entre dos puntos geográficos
     * @returns {number} Distancia en metros
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.TerrainGenerator3D = TerrainGenerator3D;
    console.log('✅ TerrainGenerator3D registrado globalmente');
}
