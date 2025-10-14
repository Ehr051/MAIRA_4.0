/*
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de análisis de imágenes satelitales con:
 * - LOD (Level of Detail) - No procesar todos los píxeles
 * - Detección de features: caminos, edificios, vegetación, agua
 * - Texturizado del terreno 3D
 * - Mapa de colores para renderizado
 * 
 * NO CALCULA ALTURA - Solo features visuales
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-04
 */

class SatelliteImageAnalyzer {
    constructor(config = {}) {
        this.config = {
            // LOD - Muestreo de píxeles - ✅ OPTIMIZADO para no explotar la PC
            samplingRate: config.samplingRate || 16, // ✅ Aumentado de 8 a 16 (1 de cada 256 píxeles)
            minSamplingRate: 2,
            maxSamplingRate: 50,
            
            // Umbrales de detección de colores (RGB)
            thresholds: {
                // Vegetación (verde) - AJUSTADO para césped/árboles
                vegetation: {
                    minR: 40, maxR: 180,
                    minG: 60, maxG: 220,
                    minB: 30, maxB: 150,
                    minRatio: 1.05
                },
                
                // Caminos (gris/marrón claro) - MÁS RESTRICTIVO
                road: {
                    minR: 100, maxR: 200,
                    minG: 100, maxG: 200,
                    minB: 90, maxB: 190,
                    maxVariance: 25  // RGB similares (gris)
                },
                
                // Edificios (techos) - MÁS RESTRICTIVO
                building: {
                    minR: 120, maxR: 220,
                    minG: 120, maxG: 220,
                    minB: 120, maxB: 220,
                    minVariance: 30  // RGB muy similares (gris claro)
                },
                
                // Agua (azul) - MÁS ESTRICTO
                water: {
                    minR: 0, maxR: 80,
                    minG: 50, maxG: 140,
                    minB: 120, maxB: 255,
                    minRatio: 1.4  // B claramente mayor
                },
                
                // Tierra desnuda (marrón)
                bareSoil: {
                    minR: 120, maxR: 200,
                    minG: 100, maxG: 170,
                    minB: 60, maxB: 130
                }
            },
            
            // Filtros de agrupación
            minClusterSize: 10,  // Mínimo de píxeles para considerar feature
            
            // Texturas
            textureResolution: config.textureResolution || 1024,
            
            ...config
        };
        
        this.imageData = null;
        this.canvas = null;
        this.context = null;
        this.features = {
            vegetation: [],  // Vegetación general (arbustos)
            forest: [],      // Bosques (árboles densos)
            grass: [],       // Césped (verde claro)
            crops: [],       // Cultivos (verde amarillento)
            roads: [],
            buildings: [],
            water: [],
            bareSoil: []
        };
        
        // ✅ OPTIMIZACIÓN: Índice espacial para búsqueda rápida O(log n)
        this.spatialIndex = null;
        
        // ✅ OPTIMIZACIÓN FASE 2: Web Worker para análisis async
        this.worker = null;
        this.useWorker = config.useWorker !== false && config.useWorkers !== false; // 🔥 Verificar ambos flags
        
        // 🔥 FORZAR DESACTIVACIÓN si se especifica explícitamente
        if (config.useWorkers === false || config.useWorker === false) {
            this.useWorker = false;
            console.log('⚡ Workers FORZADAMENTE desactivados en SatelliteImageAnalyzer');
        }
        
        // 🌿 INTEGRACIÓN: VegetationService para datos TIF de NDVI
        this.vegetationService = null;
        this.bounds = null; // Bounds para conversión lat/lon
        
        console.log('🛰️ SatelliteImageAnalyzer inicializado', this.config);
    }
    
    /**
     * 🌿 Configurar VegetationService para usar datos TIF
     * @param {VegetationService} vegetationService - Servicio con datos TIF
     * @param {L.LatLngBounds} bounds - Bounds del mapa
     */
    setVegetationService(vegetationService, bounds) {
        this.vegetationService = vegetationService;
        this.bounds = bounds;
        console.log('🌿 VegetationService conectado al SatelliteImageAnalyzer');
    }
    
    /**
     * Cargar imagen satelital desde URL o Leaflet tile
     */
    async loadImage(source) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Crear canvas para análisis
                this.canvas = document.createElement('canvas');
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                // ✅ willReadFrequently para múltiples lecturas con getImageData
                this.context = this.canvas.getContext('2d', { willReadFrequently: true });
                
                // Dibujar imagen
                this.context.drawImage(img, 0, 0);
                
                // Obtener datos de píxeles
                this.imageData = this.context.getImageData(0, 0, img.width, img.height);
                
                console.log(`✅ Imagen satelital cargada: ${img.width}x${img.height}`);
                resolve(this.imageData);
            };
            
            img.onerror = (error) => {
                console.error('❌ Error cargando imagen satelital:', error);
                reject(error);
            };
            
            img.src = source;
        });
    }
    
    /**
     * ⚡ MÉTODO SÍNCRONO: Sin Workers, procesamiento directo
     */
    analyzeImageSync(options = {}) {
        if (!this.imageData) {
            throw new Error('No hay imagen cargada. Llama a loadImage() primero.');
        }
        
        console.log('⚡ Análisis síncrono (sin Workers)...');
        const startTime = performance.now();
        
        const samplingRate = options.samplingRate || this.config.samplingRate;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const data = this.imageData.data;
        
        // Reset features
        this.features = {
            vegetation: [],
            forest: [],
            grass: [],
            crops: [],
            roads: [],
            buildings: [],
            water: [],
            bareSoil: []
        };
        
        let sampledPixels = 0;
        let stats = {
            vegetation: 0,
            roads: 0,
            buildings: 0,
            water: 0,
            bareSoil: 0
        };
        
        // Procesamiento directo (sin Workers)
        for (let y = 0; y < height; y += samplingRate) {
            for (let x = 0; x < width; x += samplingRate) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // Clasificar píxel (síncrono)
                const featureType = this.classifyPixelSync(r, g, b, x, y);
                
                if (featureType) {
                    this.features[featureType].push({
                        x: x,
                        y: y,
                        color: { r, g, b },
                        normX: x / width,
                        normY: y / height
                    });
                    stats[featureType]++;
                }
                
                sampledPixels++;
            }
        }
        
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        console.log(`✅ Análisis síncrono completado en ${timeMs}ms`);
        console.log(`📊 Vegetación: ${stats.vegetation}, Caminos: ${stats.roads}, Edificios: ${stats.buildings}`);
        
        return {
            stats: {
                timeMs: parseFloat(timeMs),
                sampledPixels,
                totalPixels: width * height,
                coverage: (sampledPixels / (width * height) * 100).toFixed(1) + '%',
                ...stats
            },
            features: this.features
        };
    }

    /**
     * ✅ FASE 2: Analizar imagen con Web Worker (async, no bloquea UI)
     */
    async analyzeImageAsync(options = {}) {
        if (!this.imageData) {
            throw new Error('No hay imagen cargada. Llama a loadImage() primero.');
        }
        
        // Si worker no disponible o deshabilitado, usar método síncrono
        if (!this.useWorker || typeof Worker === 'undefined' || options.useWorkers === false) {
            console.warn('⚠️ Workers deshabilitados, usando análisis síncrono');
            return this.analyzeImageSync(options);
        }
        
        return new Promise((resolve, reject) => {
            console.log('🔄 Analizando imagen satelital con Worker (background)...');
            const startTime = performance.now();
            
            // Crear worker si no existe
            if (!this.worker) {
                this.worker = new Worker('Client/js/workers/analyzeImageWorker.js');
            }
            
            // Handler de mensajes del worker
            const messageHandler = (e) => {
                const { type, payload } = e.data;
                
                switch (type) {
                    case 'WORKER_READY':
                        console.log('✅ Worker listo');
                        break;
                        
                    case 'ANALYZE_COMPLETE':
                        // Aplicar resultados
                        this.features = payload.features;
                        
                        // Recrear índice espacial en hilo principal
                        if (window.SpatialHashGrid) {
                            const width = this.imageData.width;
                            const height = this.imageData.height;
                            this.spatialIndex = new SpatialHashGrid(width, height, 32);
                            
                            Object.values(this.features).forEach(featureArray => {
                                featureArray.forEach(f => this.spatialIndex.insert(f));
                            });
                        }
                        
                        const endTime = performance.now();
                        const totalTime = (endTime - startTime).toFixed(2);
                        
                        console.log(`✅ Análisis completado en ${totalTime}ms (worker: ${payload.stats.timeMs}ms)`);
                        console.log(`📊 Píxeles analizados: ${payload.stats.sampledPixels.toLocaleString()} / ${payload.stats.totalPixels.toLocaleString()} (${payload.stats.coverage}%)`);
                        console.log(`🌿 Vegetación: ${payload.stats.vegetation} puntos`);
                        console.log(`🛣️ Caminos: ${payload.stats.roads} puntos`);
                        console.log(`🏢 Edificios: ${payload.stats.buildings} puntos`);
                        console.log(`💧 Agua: ${payload.stats.water} puntos`);
                        console.log(`🟤 Tierra: ${payload.stats.bareSoil} puntos`);
                        
                        if (this.spatialIndex) {
                            const stats = this.spatialIndex.getStats();
                            console.log(`📐 Índice espacial: ${stats.totalFeatures} features en ${stats.activeCells} celdas`);
                        }
                        
                        // Limpiar listener
                        this.worker.removeEventListener('message', messageHandler);
                        
                        resolve(payload);
                        break;
                        
                    case 'ERROR':
                        console.error('❌ Error en worker:', payload.message);
                        this.worker.removeEventListener('message', messageHandler);
                        reject(new Error(payload.message));
                        break;
                }
            };
            
            this.worker.addEventListener('message', messageHandler);
            
            // Enviar trabajo al worker
            this.worker.postMessage({
                type: 'ANALYZE_IMAGE',
                payload: {
                    imageData: {
                        width: this.imageData.width,
                        height: this.imageData.height,
                        data: this.imageData.data
                    },
                    config: {
                        samplingRate: options.samplingRate || this.config.samplingRate,
                        thresholds: this.config.thresholds
                    }
                }
            });
        });
    }
    
    /**
     * Analizar imagen con LOD (no todos los píxeles) - SÍNCRONO
     */
    async analyzeImage(options = {}) {
        if (!this.imageData) {
            throw new Error('No hay imagen cargada. Llama a loadImage() primero.');
        }
        
        console.log('🔍 Analizando imagen satelital con LOD...');
        const startTime = performance.now();
        
        const samplingRate = options.samplingRate || this.config.samplingRate;
        const width = this.imageData.width;
        const height = this.imageData.height;
        const data = this.imageData.data;
        
        // Reset features
        this.features = {
            vegetation: [],  // Vegetación general (arbustos)
            forest: [],      // Bosques (árboles densos)
            grass: [],       // Césped (verde claro)
            crops: [],       // Cultivos (verde amarillento)
            roads: [],
            buildings: [],
            water: [],
            bareSoil: []
        };
        
        // Muestreo con LOD - saltar píxeles
        let sampledPixels = 0;
        for (let y = 0; y < height; y += samplingRate) {
            for (let x = 0; x < width; x += samplingRate) {
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // Clasificar píxel (pasar coordenadas para consultar TIF)
                const featureType = await this.classifyPixel(r, g, b, x, y);
                
                if (featureType) {
                    this.features[featureType].push({
                        x: x,
                        y: y,
                        color: { r, g, b },
                        // Normalizar a [0, 1]
                        normX: x / width,
                        normY: y / height
                    });
                }
                
                sampledPixels++;
            }
        }
        
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        const totalPixels = width * height;
        const coverage = (sampledPixels / totalPixels * 100).toFixed(2);
        
        console.log(`✅ Análisis completado en ${timeMs}ms`);
        console.log(`📊 Píxeles analizados: ${sampledPixels.toLocaleString()} / ${totalPixels.toLocaleString()} (${coverage}%)`);
        console.log(`🌲 Bosques: ${this.features.forest.length} puntos`);
        console.log(`🌿 Vegetación: ${this.features.vegetation.length} puntos`);
        console.log(`🌾 Cultivos: ${this.features.crops.length} puntos`);
        console.log(`🟩 Césped: ${this.features.grass.length} puntos`);
        console.log(`🛣️ Caminos: ${this.features.roads.length} puntos`);
        console.log(`🏢 Edificios: ${this.features.buildings.length} puntos`);
        console.log(`💧 Agua: ${this.features.water.length} puntos`);
        console.log(`🟤 Tierra: ${this.features.bareSoil.length} puntos`);
        
        // ✅ OPTIMIZACIÓN: Crear índice espacial para búsqueda rápida
        if (window.SpatialHashGrid) {
            const indexStartTime = performance.now();
            this.spatialIndex = new SpatialHashGrid(width, height, 32);
            
            // Insertar todas las features
            Object.values(this.features).forEach(featureArray => {
                featureArray.forEach(f => this.spatialIndex.insert(f));
            });
            
            const indexTime = (performance.now() - indexStartTime).toFixed(2);
            const stats = this.spatialIndex.getStats();
            console.log(`📐 Índice espacial creado en ${indexTime}ms - ${stats.totalFeatures} features en ${stats.activeCells} celdas`);
        }
        
        // Log de debug: mostrar algunos píxeles verdes detectados
        if (this.features.vegetation.length > 0) {
            const sample = this.features.vegetation[0];
            console.log(`   ✅ Verde detectado ejemplo: RGB(${sample.r}, ${sample.g}, ${sample.b}) ratio=${(sample.g/(sample.r+1)).toFixed(2)}`);
        } else {
            console.warn(`   ⚠️ NO se detectó vegetación. Revisando umbrales...`);
            console.log(`   Umbrales vegetación:`, this.config.thresholds.vegetation);
            
            // DEBUG: Analizar muestra de píxeles para ver colores reales
            console.log(`   🔍 DEBUG: Muestreando primeros 100 píxeles...`);
            let greenish = 0;
            let grassLike = 0;
            for (let i = 0; i < Math.min(100, sampledPixels); i++) {
                const y = Math.floor(i / 10) * samplingRate;
                const x = (i % 10) * samplingRate;
                const index = (y * width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // Verificar si es césped
                const isGrass = (
                    Math.abs(r - g) < 50 &&
                    Math.abs(g - b) < 50 &&
                    g > r && g > b &&
                    g >= 70 && g <= 200 &&
                    r >= 50 && r <= 180 &&
                    b >= 50 && b <= 180
                );
                
                if (isGrass) {
                    grassLike++;
                    if (grassLike <= 3) {
                        console.log(`     ✅ CÉSPED en (${x},${y}): RGB(${r},${g},${b}) - diff R-G:${Math.abs(r-g)} G-B:${Math.abs(g-b)}`);
                    }
                }
                
                if (g > r && g > b) {
                    greenish++;
                    if (greenish <= 3 && !isGrass) {
                        console.log(`     Píxel verdoso en (${x},${y}): RGB(${r},${g},${b}) - ¿Por qué NO pasó?`);
                        // Verificar cada condición
                        const th = this.config.thresholds.vegetation;
                        console.log(`       G en rango [${th.minG}-${th.maxG}]: ${g >= th.minG && g <= th.maxG}`);
                        console.log(`       R en rango [${th.minR}-${th.maxR}]: ${r >= th.minR && r <= th.maxR}`);
                        console.log(`       B en rango [${th.minB}-${th.maxB}]: ${b >= th.minB && b <= th.maxB}`);
                        console.log(`       G>R && G>B: ${g > r && g > b}, ratio: ${(g/(r+1)).toFixed(2)}`);
                    }
                }
            }
            console.log(`   📊 De 100 píxeles muestreados: ${greenish} verdosos, ${grassLike} tipo césped`);
        }
        
        return {
            features: this.features,
            stats: {
                totalPixels: totalPixels,
                sampledPixels: sampledPixels,
                coverage: parseFloat(coverage),
                timeMs: parseFloat(timeMs),
                dimensions: { width, height }
            }
        };
    }
    
    /**
     * Crear canvas de debug con píxeles clasificados en colores
     */
    createDebugCanvas() {
        if (!this.imageData) {
            console.warn('⚠️ No hay imageData para debug');
            return null;
        }
        
        const debugCanvas = document.createElement('canvas');
        debugCanvas.width = this.imageData.width;
        debugCanvas.height = this.imageData.height;
        const debugCtx = debugCanvas.getContext('2d');
        const debugImageData = debugCtx.createImageData(this.imageData.width, this.imageData.height);
        
        const data = this.imageData.data;
        const debugData = debugImageData.data;
        
        // Colores de clasificación
        const colors = {
            vegetation: [0, 255, 0],      // Verde brillante
            roads: [128, 128, 128],       // Gris
            buildings: [255, 0, 0],       // Rojo
            water: [0, 0, 255],           // Azul
            bareSoil: [139, 69, 19],      // Marrón
            unclassified: [50, 50, 50]    // Gris oscuro
        };
        
        for (let y = 0; y < this.imageData.height; y++) {
            for (let x = 0; x < this.imageData.width; x++) {
                const index = (y * this.imageData.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                // Clasificar píxel
                const featureType = this.classifyPixel(r, g, b);
                
                // Pintar con color de clasificación
                const color = featureType ? colors[featureType] : colors.unclassified;
                debugData[index] = color[0];
                debugData[index + 1] = color[1];
                debugData[index + 2] = color[2];
                debugData[index + 3] = 255;
            }
        }
        
        debugCtx.putImageData(debugImageData, 0, 0);
        console.log('🎨 Canvas de debug creado - Verde=vegetación, Gris=caminos, Rojo=edificios, Azul=agua');
        
        return debugCanvas;
    }
    
    /**
     * ⚡ Clasificar píxel SÍNCRONO - SIMPLIFICADO SOLO ÁRBOLES
     */
    classifyPixelSync(r, g, b, x = null, y = null) {
        // 🌳 ULTRA SIMPLIFICADO: Solo detectar árboles como 'forest'
        // Usar la misma lógica que classifyVegetationType pero síncrono
        
        // Verificar que sea verde
        const isGreen = g > r && g > b;
        if (!isGreen) return null;
        
        // Calcular dominancia de verde MUY permisiva
        const hasStrongGreenDominance = (g - r) >= 1 && (g - b) >= 0; // MUY permisivo
        const totalBrightness = r + g + b;
        
        // 🌲 SOLO BOSQUE (forest) - Verde MUY MUY oscuro (ultra-restrictivo)
        // Solo árboles en las zonas más oscuras posibles
        if (
            g >= 4 && g <= 70 &&        // 🔥 Verde MUY restrictivo (reducido de 120 a 70)
            r >= 0 && r <= 50 &&        // 🔥 Rojo ultra-restrictivo (reducido de 80 a 50)
            b >= 0 && b <= 40 &&        // 🔥 Azul ultra-restrictivo (reducido de 60 a 40)
            hasStrongGreenDominance &&  // Verde MUY dominante
            totalBrightness <= 160      // 🔥 Brillo ultra-restrictivo (reducido de 300 a 160)
        ) {
            return 'forest'; // ✅ FOREST en lugar de vegetation
        }
        
        return null; // No clasificado como árbol
    }

    /**
     * Clasificar píxel según su color RGB - SIMPLIFICADO SOLO ÁRBOLES
     */
    async classifyPixel(r, g, b, x = null, y = null) {
        // 🌳 SIMPLIFICADO: Solo detectar árboles (vegetation y forest)
        // Resto de features no se renderizan (density: 0.0)
        
        const vegResult = await this.classifyVegetationType(r, g, b, null, x, y);
        if (vegResult) {
            return vegResult; // 'forest' o 'vegetation' únicamente
        }
        
        return null; // No clasificado como árbol
    }
    
    /**
     * 🌳 Clasificar tipo de vegetación SIMPLIFICADO - Solo árboles
     * @param {number} r - Rojo (0-255)
     * @param {number} g - Verde (0-255)
     * @param {number} b - Azul (0-255)
     * @param {number} threshold - Umbral (no usado actualmente)
     * @param {number} x - Coordenada X en píxeles (opcional, para TIF)
     * @param {number} y - Coordenada Y en píxeles (opcional, para TIF)
     * @returns {'forest'|'vegetation'|null}
     */
    async classifyVegetationType(r, g, b, threshold, x = null, y = null) {
        // 🌳 ULTRA SIMPLIFICADO: Solo árboles en verde MUY oscuro
        // Eliminamos vegetation, grass y crops completamente
        
        // Verificar que sea verde
        const isGreen = g > r && g > b;
        if (!isGreen) return null;
        
        // Calcular dominancia de verde MUY permisiva
        const hasStrongGreenDominance = (g - r) >= 1 && (g - b) >= 0; // MUY permisivo
        const totalBrightness = r + g + b;
        
        // � TIPO 1: BOSQUE (forest) - Verde oscuro
        // Solo árboles en las zonas más oscuras
        if (
            g >= 4 && g <= 70 &&        // 🔥 Verde MUY restrictivo (reducido de 120 a 70)
            r >= 0 && r <= 50 &&        // 🔥 Rojo ultra-restrictivo (reducido de 80 a 50)
            b >= 0 && b <= 40 &&        // 🔥 Azul ultra-restrictivo (reducido de 60 a 40)
            hasStrongGreenDominance &&  // Verde MUY dominante
            totalBrightness <= 160      // 🔥 Brillo ultra-restrictivo (reducido de 300 a 160)
        ) {
            return 'forest';
        }
        
        return null; // No es vegetación detectable (solo forest ahora)
    }
    
    /**
     * Detectar vegetación (verde predominante) - DEPRECATED, usar classifyVegetationType
     */
/**
 * Detectar vegetación (verde predominante)
 * ✅ MEJORADO: Detecta césped (verde pálido) y árboles (verde oscuro)
 */
    isVegetation(r, g, b, threshold) {
        // DEBUG temporal
        if (!this._vegCheckCount) this._vegCheckCount = 0;
        this._vegCheckCount++;
        
        // CASO 1: Césped - RGB similares pero G ligeramente mayor
        // PRIORIDAD: Evaluar ANTES de los rangos threshold
        const diffRG = Math.abs(r - g);
        const diffGB = Math.abs(g - b);
        const isGMayor = g > r && g > b;
        const gInRange = g >= 70 && g <= 200;
        const rInRange = r >= 50 && r <= 180;
        const bInRange = b >= 50 && b <= 180;
        
        const isGrassLike = (
            diffRG < 50 &&      // Diferencia pequeña R-G
            diffGB < 50 &&      // Diferencia pequeña G-B  
            isGMayor &&         // G es el mayor (aunque sea poco)
            gInRange &&         // Verde medio-claro (césped típico)
            rInRange &&         // Rango R razonable
            bInRange            // Rango B razonable
        );
        
        // DEBUG: Mostrar primeros 3 que cumplan condiciones parciales
        if (this._vegCheckCount <= 100 && (diffRG < 50 && diffGB < 50)) {
            if (!this._grassCandidates) this._grassCandidates = 0;
            this._grassCandidates++;
            if (this._grassCandidates <= 5) {
                console.log(`🔍 Candidato césped RGB(${r},${g},${b}): diffRG=${diffRG}, diffGB=${diffGB}, g>r=${g>r}, g>b=${g>b}, gRange=${gInRange}, isGrass=${isGrassLike}`);
            }
        }
        
        if (isGrassLike) {
            return true; // ✅ Césped detectado sin verificar threshold
        }
        
        // Para verde oscuro/brillante: verificar rangos threshold
        if (g < threshold.minG || g > threshold.maxG) return false;
        if (r < threshold.minR || r > threshold.maxR) return false;
        if (b < threshold.minB || b > threshold.maxB) return false;
        
        // CASO 2: Verde oscuro - árboles, arboledas
        const isDarkGreen = (
            g > r * 1.15 &&  // G claramente mayor que R
            g > b * 1.15 &&  // G claramente mayor que B
            g >= 80          // Verde suficiente
        );
        
        // CASO 3: Verde brillante - vegetación densa
        const isBrightGreen = (
            g >= 150 &&      // Verde intenso
            g > r + 30 &&    // Mucho más verde que rojo
            g > b + 20       // Más verde que azul
        );
        
        return isDarkGreen || isBrightGreen;
    }
    
    /**
     * Detectar caminos (gris/marrón uniforme)
     */
    isRoad(r, g, b, threshold) {
        if (r < threshold.minR || r > threshold.maxR) return false;
        if (g < threshold.minG || g > threshold.maxG) return false;
        if (b < threshold.minB || b > threshold.maxB) return false;
        
        // Poca variación entre RGB (color uniforme)
        const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        return variance <= threshold.maxVariance;
    }
    
    /**
     * Detectar edificios (gris muy uniforme, techos)
     */
    isBuilding(r, g, b, threshold) {
        if (r < threshold.minR || r > threshold.maxR) return false;
        if (g < threshold.minG || g > threshold.maxG) return false;
        if (b < threshold.minB || b > threshold.maxB) return false;
        
        // Muy poca variación (techos uniformes)
        const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
        return variance <= threshold.minVariance;
    }
    
    /**
     * Detectar agua (azul predominante)
     */
    isWater(r, g, b, threshold) {
        if (b < threshold.minB || b > threshold.maxB) return false;
        if (r < threshold.minR || r > threshold.maxR) return false;
        if (g < threshold.minG || g > threshold.maxG) return false;
        
        // Azul debe ser dominante
        const ratio = b / (g + 1);
        return ratio >= threshold.minRatio;
    }
    
    /**
     * Detectar tierra desnuda (marrón)
     */
    isBareSoil(r, g, b, threshold) {
        if (r < threshold.minR || r > threshold.maxR) return false;
        if (g < threshold.minG || g > threshold.maxG) return false;
        if (b < threshold.minB || b > threshold.maxB) return false;
        
        return true;
    }
    
    /**
     * Crear textura THREE.js desde imagen satelital
     */
    createTexture() {
        if (!this.canvas) {
            throw new Error('No hay imagen cargada');
        }
        
        if (!window.THREE) {
            throw new Error('THREE.js no disponible');
        }
        
        // Verificar que canvas tenga contenido
        // ✅ willReadFrequently ya configurado en this.context
        const ctx = this.context || this.canvas.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, Math.min(10, this.canvas.width), Math.min(10, this.canvas.height));
        let hasContent = false;
        for (let i = 0; i < imgData.data.length; i += 4) {
            if (imgData.data[i] !== 0 || imgData.data[i+1] !== 0 || imgData.data[i+2] !== 0) {
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            console.error('❌ Canvas está vacío (todo negro)');
            return null;
        }
        
        // DEBUG: Mostrar muestra de colores del canvas
        console.log(`📊 Canvas sample (primeros 5 píxeles): 
            [0]: RGB(${imgData.data[0]},${imgData.data[1]},${imgData.data[2]})
            [1]: RGB(${imgData.data[4]},${imgData.data[5]},${imgData.data[6]})
            [2]: RGB(${imgData.data[8]},${imgData.data[9]},${imgData.data[10]})
            [3]: RGB(${imgData.data[12]},${imgData.data[13]},${imgData.data[14]})
            [4]: RGB(${imgData.data[16]},${imgData.data[17]},${imgData.data[18]})`);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // 🎨 FIX: Configurar colorSpace correcto para THREE.js r150+
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true; // Forzar actualización
        
        console.log(`✅ Textura THREE.js creada desde imagen satelital ${this.canvas.width}x${this.canvas.height}`);
        return texture;
    }
    
    /**
     * Aplicar textura al terreno 3D
     */
    applyTextureToTerrain(terrainMesh) {
        if (!terrainMesh) {
            throw new Error('terrainMesh no válido');
        }
        
        const texture = this.createTexture();
        
        // Aplicar textura al material
        if (terrainMesh.material) {
            terrainMesh.material.map = texture;
            terrainMesh.material.needsUpdate = true;
            console.log('✅ Textura aplicada al terreno');
        }
        
        return texture;
    }
    
    /**
     * Obtener mapa de densidad de features
     */
    getFeatureDensityMap(featureType, gridResolution = 20) {
        const features = this.features[featureType];
        if (!features || features.length === 0) {
            return null;
        }
        
        // Crear grid de densidad
        const densityMap = Array(gridResolution).fill(0).map(() => 
            Array(gridResolution).fill(0)
        );
        
        // Contar features por celda
        features.forEach(feature => {
            const gridX = Math.floor(feature.normX * gridResolution);
            const gridY = Math.floor(feature.normY * gridResolution);
            
            if (gridX < gridResolution && gridY < gridResolution) {
                densityMap[gridY][gridX]++;
            }
        });
        
        return densityMap;
    }
    
    /**
     * Convertir coordenadas de imagen a coordenadas del terreno 3D
     */
    imageToTerrainCoords(imageX, imageY, terrainSize, bounds) {
        const normX = imageX / this.imageData.width;
        const normY = imageY / this.imageData.height;
        
        return {
            x: (normX - 0.5) * terrainSize,
            y: 0, // Se ajustará con elevación
            z: (normY - 0.5) * terrainSize
        };
    }
    
    /**
     * Detectar caminos usando análisis de conectividad
     */
    detectRoadPaths() {
        if (this.features.roads.length === 0) {
            return [];
        }
        
        console.log('🛣️ Detectando caminos conectados...');
        
        // Agrupar píxeles cercanos en caminos
        const roadPaths = [];
        const visited = new Set();
        const maxDistance = this.config.samplingRate * 2; // Distancia máxima entre píxeles del mismo camino
        
        this.features.roads.forEach((pixel, index) => {
            if (visited.has(index)) return;
            
            const path = [pixel];
            visited.add(index);
            
            // Buscar píxeles conectados
            this.features.roads.forEach((otherPixel, otherIndex) => {
                if (visited.has(otherIndex)) return;
                
                const distance = Math.sqrt(
                    Math.pow(pixel.x - otherPixel.x, 2) + 
                    Math.pow(pixel.y - otherPixel.y, 2)
                );
                
                if (distance <= maxDistance) {
                    path.push(otherPixel);
                    visited.add(otherIndex);
                }
            });
            
            if (path.length >= this.config.minClusterSize) {
                roadPaths.push(path);
            }
        });
        
        console.log(`✅ Detectados ${roadPaths.length} caminos`);
        return roadPaths;
    }
    
    /**
     * Detectar clusters de edificios
     */
    detectBuildingClusters() {
        if (this.features.buildings.length === 0) {
            return [];
        }
        
        console.log('🏢 Detectando clusters de edificios...');
        
        // Similar a detectRoadPaths pero para edificios
        const clusters = [];
        const visited = new Set();
        const maxDistance = this.config.samplingRate * 3;
        
        this.features.buildings.forEach((pixel, index) => {
            if (visited.has(index)) return;
            
            const cluster = [pixel];
            visited.add(index);
            
            this.features.buildings.forEach((otherPixel, otherIndex) => {
                if (visited.has(otherIndex)) return;
                
                const distance = Math.sqrt(
                    Math.pow(pixel.x - otherPixel.x, 2) + 
                    Math.pow(pixel.y - otherPixel.y, 2)
                );
                
                if (distance <= maxDistance) {
                    cluster.push(otherPixel);
                    visited.add(otherIndex);
                }
            });
            
            if (cluster.length >= this.config.minClusterSize) {
                clusters.push(cluster);
            }
        });
        
        console.log(`✅ Detectados ${clusters.length} clusters de edificios`);
        return clusters;
    }
    
    /**
     * Generar visualización de features para debug
     */
    createDebugVisualization() {
        if (!this.canvas || !this.context) {
            throw new Error('No hay canvas disponible');
        }
        
        const debugCanvas = document.createElement('canvas');
        debugCanvas.width = this.canvas.width;
        debugCanvas.height = this.canvas.height;
        const ctx = debugCanvas.getContext('2d');
        
        // Copiar imagen original
        ctx.drawImage(this.canvas, 0, 0);
        
        // Dibujar features con colores
        const colors = {
            vegetation: 'rgba(0, 255, 0, 0.5)',
            roads: 'rgba(255, 255, 0, 0.5)',
            buildings: 'rgba(255, 0, 0, 0.5)',
            water: 'rgba(0, 0, 255, 0.5)',
            bareSoil: 'rgba(139, 69, 19, 0.5)'
        };
        
        Object.keys(this.features).forEach(featureType => {
            ctx.fillStyle = colors[featureType] || 'rgba(255, 255, 255, 0.5)';
            
            this.features[featureType].forEach(pixel => {
                ctx.fillRect(pixel.x, pixel.y, this.config.samplingRate, this.config.samplingRate);
            });
        });
        
        return debugCanvas;
    }
    
    /**
     * Exportar resultados para integración con TerrainGenerator3D
     */
    exportForTerrain() {
        return {
            features: this.features,
            texture: this.canvas ? this.createTexture() : null,
            densityMaps: {
                vegetation: this.getFeatureDensityMap('vegetation', 20),
                roads: this.getFeatureDensityMap('roads', 20),
                buildings: this.getFeatureDensityMap('buildings', 20),
                water: this.getFeatureDensityMap('water', 20)
            },
            roadPaths: this.detectRoadPaths(),
            buildingClusters: this.detectBuildingClusters()
        };
    }
    
    /**
     * Obtener lista plana de todas las features detectadas
     * Formato: [{ type: 'road', x, y, color }, ...]
     */
    getFeatures() {
        const allFeatures = [];
        
        for (const [type, points] of Object.entries(this.features)) {
            points.forEach(point => {
                // Convertir RGB a hex si existe
                let colorHex = this.getDefaultColor(type);
                if (point.color && point.color.r !== undefined) {
                    colorHex = (point.color.r << 16) | (point.color.g << 8) | point.color.b;
                }
                
                allFeatures.push({
                    type: type,
                    x: point.x,
                    y: point.y,
                    color: colorHex,
                    intensity: point.intensity || 1.0
                });
            });
        }
        
        return allFeatures;
    }
    
    /**
     * Obtener color por defecto según tipo de feature
     */
    getDefaultColor(type) {
        const colors = {
            vegetation: 0x7cbc4b,
            road: 0x555555,
            building: 0x808080,
            water: 0x0066cc,
            bareSoil: 0xb8860b
        };
        return colors[type] || 0xcccccc;
    }
    
    /**
     * Limpiar recursos
     */
    clear() {
        this.imageData = null;
        this.canvas = null;
        this.context = null;
        this.features = {
            vegetation: [],  // Vegetación general (arbustos)
            forest: [],      // Bosques (árboles densos)
            grass: [],       // Césped (verde claro)
            crops: [],       // Cultivos (verde amarillento)
            roads: [],
            buildings: [],
            water: [],
            bareSoil: []
        };
        
        console.log('🧹 SatelliteImageAnalyzer limpiado');
    }
    
    /**
     * ✅ FASE 2: Destruir worker cuando no se necesite
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            console.log('🗑️ Worker terminado');
        }
        
        // Limpiar también recursos regulares
        this.clear();
    }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
    window.SatelliteImageAnalyzer = SatelliteImageAnalyzer;
    console.log('✅ SatelliteImageAnalyzer registrado globalmente');
}
