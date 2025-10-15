/**
 * ═══════════════════════════════════════════════════════════════════════
 * GLTF MODEL LOADER - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de carga y caché de modelos GLTF/GLB
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-04
 */

class GLTFModelLoader {
    constructor() {
        this.loader = null;
        this.cache = new Map();
        this.loadingPromises = new Map();
        
        // Path a modelos GLB directos
        this.basePath = 'Client/assets/models/gbl_new/';
        
        // Mapeo de tipos de vegetación a archivos GLB
        // 🌳 SISTEMA DE DIVERSIDAD: Múltiples modelos para variedad natural
        this.vegetationModels = {
            // ÁRBOLES - VARIEDAD REAL (solo modelos válidos >1MB) ✅
            'trees_low': 'trees_low.glb',          // 2.4MB - Árboles principales ✅
            'arbol': 'arbol.glb',                  // 8.9MB - Árbol alternativo ✅
            'tree_oak': 'AnimatedOak.glb',         // Roble grande (si existe)
            
            // VARIACIONES DE trees_low (mismo modelo, diferentes escalas)
            'trees_low_small': 'trees_low.glb',    // Versión pequeña
            'trees_low_medium': 'trees_low.glb',   // Versión mediana
            'trees_low_large': 'trees_low.glb',    // Versión grande
            
            // VARIACIONES DE arbol.glb
            'arbol_small': 'arbol.glb',            // Versión pequeña
            'arbol_medium': 'arbol.glb',           // Versión mediana
            'arbol_large': 'arbol.glb',            // Versión grande
            
            // FALLBACKS (tree_tall y tree_medium están corruptos - 1KB)
            'tree_tall': 'trees_low.glb',          // Fallback a trees_low
            'tree_medium': 'arbol.glb',            // Fallback a arbol
            'tree': 'trees_low.glb',               // Genérico
            
            // ARBUSTOS ✅
            'bush': 'arbusto.glb',                 // Arbusto principal
            'bush_alt': 'bush.glb',                // Arbusto alternativo
            
            // PASTO ✅
            'grass': 'grass.glb'                   // Pasto bajo
        };
        
        // ✅ Estadísticas de carga para debugging
        this.loadStats = {
            successful: 0,
            failed: 0,
            cached: 0
        };
        
        console.log('🎨 GLTFModelLoader inicializado');
        console.log('📦 Modelos de vegetación disponibles:', Object.keys(this.vegetationModels));
    }

    /**
     * Inicializa el GLTFLoader de THREE.js
     */
    initialize() {
        if (!window.THREE) {
            console.error('❌ THREE.js no está disponible');
            return false;
        }

        if (!window.THREE.GLTFLoader) {
            console.warn('⚠️ GLTFLoader no disponible, intentando cargar...');
            return false;
        }

        this.loader = new THREE.GLTFLoader();
        console.log('✅ GLTFLoader inicializado');
        
        // ✅ Verificar que los modelos de vegetación existan
        this.verifyVegetationModels();
        
        return true;
    }
    
    /**
     * 🔍 Verificar disponibilidad de modelos de vegetación
     */
    async verifyVegetationModels() {
        console.log('🔍 Verificando modelos de vegetación...');
        
        const results = {};
        for (const [type, filename] of Object.entries(this.vegetationModels)) {
            const path = `${this.basePath}${filename}`;
            
            try {
                // Intentar hacer HEAD request para verificar existencia
                const response = await fetch(path, { method: 'HEAD' });
                results[type] = {
                    exists: response.ok,
                    path: path,
                    size: response.headers.get('content-length')
                };
                
                if (response.ok) {
                    const sizeMB = (parseInt(response.headers.get('content-length') || 0) / 1024 / 1024).toFixed(1);
                    console.log(`  ✅ ${type}: ${filename} (${sizeMB}MB)`);
                } else {
                    console.warn(`  ⚠️ ${type}: ${filename} - Status ${response.status}`);
                }
            } catch (error) {
                results[type] = { exists: false, path: path, error: error.message };
                console.warn(`  ❌ ${type}: ${filename} - ${error.message}`);
            }
        }
        
        this.modelVerification = results;
        return results;
    }

    /**
     * Carga un modelo GLTF y lo cachea
     * @param {string} modelName - Nombre del modelo (tree_tall, tree_medium, bush, grass)
     * @param {string} category - Categoría del modelo (vegetation, vehicles, etc)
     * @returns {Promise<THREE.Group>}
     */
    async loadModel(modelName, category = 'vegetation') {
        const cacheKey = `${category}/${modelName}`;
        
        // Si ya está cacheado, devolver copia
        if (this.cache.has(cacheKey)) {
            this.loadStats.cached++;
            console.debug(`♻️ Usando modelo cacheado: ${cacheKey}`);
            return this.cloneModel(this.cache.get(cacheKey));
        }

        // Si ya se está cargando, esperar a la promesa existente
        if (this.loadingPromises.has(cacheKey)) {
            console.debug(`⏳ Esperando carga en progreso: ${cacheKey}`);
            return this.loadingPromises.get(cacheKey).then(model => this.cloneModel(model));
        }

        // Inicializar loader si no existe
        if (!this.loader) {
            const initialized = this.initialize();
            if (!initialized) {
                console.error(`❌ No se pudo inicializar GLTFLoader para ${cacheKey}`);
                this.loadStats.failed++;
                return this.createFallbackModel(modelName);
            }
        }

        // Crear promesa de carga
        const loadPromise = new Promise((resolve, reject) => {
            // Obtener nombre del archivo GLB desde el mapeo
            let glbFile;
            if (category === 'vegetation' && this.vegetationModels[modelName]) {
                glbFile = this.vegetationModels[modelName];
                console.log(`🎯 Modelo '${modelName}' mapeado a archivo: '${glbFile}'`);
            } else {
                glbFile = `${modelName}.glb`;
                console.log(`🎯 Modelo '${modelName}' usando nombre directo: '${glbFile}'`);
            }
            
            const path = `${this.basePath}${glbFile}`;
            console.log(`📦 Cargando modelo GLB desde: ${path}`);
            
            // Cargar GLB directo
            this.loader.load(
                path,
                (gltf) => {
                    this.loadStats.successful++;
                    
                    // Obtener tamaño del modelo y analizar materiales/texturas
                    let vertexCount = 0;
                    let meshCount = 0;
                    let materialsWithTextures = 0;
                    
                    gltf.scene.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;
                            if (child.geometry) {
                                vertexCount += child.geometry.attributes.position?.count || 0;
                            }
                            
                            // 🔍 DIAGNÓSTICO DE TEXTURAS + COLORES POR DEFECTO
                            if (child.material) {
                                const hasMap = !!child.material.map;
                                const hasColor = child.material.color ? `#${child.material.color.getHexString()}` : 'none';
                                
                                if (hasMap) {
                                    materialsWithTextures++;
                                    console.log(`  🎨 Mesh "${child.name || 'unnamed'}": texture=${hasMap}, color=${hasColor}`);
                                    
                                    if (child.material.map.image) {
                                        console.log(`    📸 Texture: ${child.material.map.image.width}x${child.material.map.image.height}px`);
                                    }
                                } else {
                                    // ✅ NO HAY TEXTURA: Aplicar colores por defecto según nombre
                                    const meshNameLower = (child.name || '').toLowerCase();
                                    
                                    if (meshNameLower.includes('trunk') || meshNameLower.includes('tronco') || meshNameLower.includes('stem')) {
                                        // Tronco: marrón
                                        child.material.color.setHex(0x6B4423); // Marrón oscuro
                                        console.log(`  🟤 Mesh "${child.name || 'unnamed'}": SIN texture → color MARRÓN (tronco)`);
                                    } else if (meshNameLower.includes('leaf') || meshNameLower.includes('leaves') || meshNameLower.includes('foliage') || 
                                              meshNameLower.includes('hoja') || meshNameLower.includes('copa')) {
                                        // Follaje: verde
                                        child.material.color.setHex(0x2D5016); // Verde oscuro
                                        console.log(`  🟢 Mesh "${child.name || 'unnamed'}": SIN texture → color VERDE (follaje)`);
                                    } else {
                                        // Indefinido: verde medio por defecto (probablemente árbol)
                                        child.material.color.setHex(0x4A7C59); // Verde medio
                                        console.log(`  🟢 Mesh "${child.name || 'unnamed'}": SIN texture → color VERDE medio (default)`);
                                    }
                                    
                                    child.material.needsUpdate = true;
                                }
                            }
                        }
                    });
                    
                    console.log(`✅ Modelo cargado: ${cacheKey} (${glbFile})`);
                    console.log(`   📊 ${meshCount} meshes, ${vertexCount.toLocaleString()} vértices`);
                    console.log(`   🎨 ${materialsWithTextures}/${meshCount} meshes con texturas`);
                    if (materialsWithTextures < meshCount) {
                        console.log(`   🎨 ${meshCount - materialsWithTextures} meshes usan colores por defecto (marrón/verde)`);
                    }
                    
                    const model = gltf.scene;
                    
                    // Configurar sombras
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Cachear modelo
                    this.cache.set(cacheKey, model);
                    this.loadingPromises.delete(cacheKey);
                    
                    resolve(model);
                },
                (xhr) => {
                    const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
                    if (xhr.loaded === xhr.total && percent === '100') {
                        console.debug(`📊 Modelo ${cacheKey}: 100% cargado (${(xhr.total / 1024 / 1024).toFixed(1)}MB)`);
                    }
                },
                (error) => {
                    this.loadStats.failed++;
                    console.error(`❌ Error cargando GLB desde ${path}:`);
                    console.error(`   Tipo: ${error.type || 'unknown'}`);
                    console.error(`   Mensaje: ${error.message || error}`);
                    console.error(`   Stack:`, error.stack);
                    console.warn(`⚠️ Usando modelo procedural para ${modelName}`);
                    this.loadingPromises.delete(cacheKey);
                    
                    // Devolver modelo fallback procedural
                    const fallback = this.createFallbackModel(modelName);
                    this.cache.set(cacheKey, fallback);
                    resolve(fallback);
                }
            );
        });

        this.loadingPromises.set(cacheKey, loadPromise);
        return loadPromise.then(model => this.cloneModel(model));
    }

    /**
     * Clona un modelo cacheado SIN clonar materiales
     * ✅ CRÍTICO: Compartir materiales/texturas para evitar pérdida de colores
     * @param {THREE.Group} model - Modelo original
     * @returns {THREE.Group} - Copia del modelo
     */
    cloneModel(model) {
        const clone = model.clone();
        
        // ✅ NO clonar materiales - compartirlos directamente
        // Esto preserva las texturas originales del GLB
        clone.traverse((child) => {
            if (child.isMesh && child.material) {
                // ✅ COMPARTIR material (no clonar) - preserva texturas
                // Las instancias usan el mismo material = más eficiente + colores correctos
                child.material = child.material; // Explícito: NO hacer clone()
                
                // Asegurar que las sombras están activadas
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        return clone;
    }

    /**
     * Crea un modelo procedural de fallback si GLTF falla
     * @param {string} modelName - Tipo de modelo
     * @returns {THREE.Group}
     */
    createFallbackModel(modelName) {
        const group = new THREE.Group();
        
        switch(modelName) {
            case 'grass':
                // Pasto - cilindro verde claro
                const grassGeo = new THREE.CylinderGeometry(0.1, 0.2, 0.5, 4);
                const grassMat = new THREE.MeshStandardMaterial({ 
                    color: 0x7cbc4b,
                    roughness: 0.8
                });
                const grass = new THREE.Mesh(grassGeo, grassMat);
                grass.castShadow = true;
                grass.receiveShadow = true;
                group.add(grass);
                break;
                
            case 'bush':
                // Arbusto - esfera verde oscuro
                const bushGeo = new THREE.SphereGeometry(0.5, 8, 8);
                const bushMat = new THREE.MeshStandardMaterial({ 
                    color: 0x4a7c59,
                    roughness: 0.9
                });
                const bush = new THREE.Mesh(bushGeo, bushMat);
                bush.position.y = 0.5;
                bush.castShadow = true;
                bush.receiveShadow = true;
                group.add(bush);
                break;
                
            case 'tree_medium':
                // Árbol mediano
                const trunkMedGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
                const trunkMedMat = new THREE.MeshStandardMaterial({ 
                    color: 0x8b4513,
                    roughness: 0.8
                });
                const trunkMed = new THREE.Mesh(trunkMedGeo, trunkMedMat);
                trunkMed.position.y = 1;
                trunkMed.castShadow = true;
                trunkMed.receiveShadow = true;
                
                const leavesMedGeo = new THREE.ConeGeometry(1.5, 3, 8);
                const leavesMedMat = new THREE.MeshStandardMaterial({ 
                    color: 0x2d5016,
                    roughness: 0.9
                });
                const leavesMed = new THREE.Mesh(leavesMedGeo, leavesMedMat);
                leavesMed.position.y = 3.5;
                leavesMed.castShadow = true;
                leavesMed.receiveShadow = true;
                
                group.add(trunkMed);
                group.add(leavesMed);
                break;
                
            case 'tree_tall':
                // Árbol alto
                const trunkTallGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 8);
                const trunkTallMat = new THREE.MeshStandardMaterial({ 
                    color: 0x654321,
                    roughness: 0.8
                });
                const trunkTall = new THREE.Mesh(trunkTallGeo, trunkTallMat);
                trunkTall.position.y = 2;
                trunkTall.castShadow = true;
                trunkTall.receiveShadow = true;
                
                const leavesTallGeo = new THREE.ConeGeometry(2, 5, 8);
                const leavesTallMat = new THREE.MeshStandardMaterial({ 
                    color: 0x1a3409,
                    roughness: 0.9
                });
                const leavesTall = new THREE.Mesh(leavesTallGeo, leavesTallMat);
                leavesTall.position.y = 6;
                leavesTall.castShadow = true;
                leavesTall.receiveShadow = true;
                
                group.add(trunkTall);
                group.add(leavesTall);
                break;
        }
        
        return group;
    }

    /**
     * Precarga todos los modelos de vegetación
     * @returns {Promise<void>}
     */
    async preloadVegetation() {
        console.log('🌳 Precargando modelos de vegetación...');
        
        const models = ['grass', 'bush', 'tree_medium', 'tree_tall'];
        const promises = models.map(name => this.loadModel(name, 'vegetation'));
        
        await Promise.all(promises);
        
        console.log('✅ Modelos de vegetación precargados');
    }

    /**
     * Limpia el caché
     */
    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
        console.log('🧹 Caché de modelos limpiado');
    }

    /**
     * ✅ Obtener estadísticas de carga
     */
    getStats() {
        return {
            ...this.loadStats,
            cached: this.cache.size,
            types: Array.from(this.cache.keys())
        };
    }

    /**
     * ✅ Mostrar resumen de estadísticas
     */
    logStats() {
        console.log('📊 Estadísticas GLTFModelLoader:');
        console.log(`   ✅ Cargas exitosas: ${this.loadStats.successful}`);
        console.log(`   ❌ Cargas fallidas: ${this.loadStats.failed}`);
        console.log(`   ♻️ Modelos en caché: ${this.cache.size}`);
        if (this.cache.size > 0) {
            console.log(`   📦 Tipos cacheados: ${Array.from(this.cache.keys()).join(', ')}`);
        }
    }

    /**
     * Obtiene estadísticas del caché
     * @returns {Object}
     */
    getCacheStats() {
        return {
            cached: this.cache.size,
            loading: this.loadingPromises.size,
            models: Array.from(this.cache.keys())
        };
    }
}

// Registro global
window.GLTFModelLoader = GLTFModelLoader;
console.log('✅ GLTFModelLoader registrado globalmente');
