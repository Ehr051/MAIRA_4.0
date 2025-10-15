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
        // ✅ CONFIGURACIÓN FUNCIONANDO: Usar trees_low.glb que funciona perfecto manual
        this.vegetationModels = {
            // ÁRBOLES BUENOS ✅ (USAR EL MODELO QUE FUNCIONA PERFECTO EN MANUAL)
            'tree_tall': 'trees_low.glb',          // ✅ MISMO QUE MANUAL: trees_low.glb con escala 0.02
            'tree_medium': 'trees_low.glb',        // ✅ MISMO QUE MANUAL: trees_low.glb con escala 0.02
            'tree_oak': 'AnimatedOak.glb',         // 81MB - Oak animado ✅
            'tree': 'trees_low.glb',               // 2.4MB - Árbol genérico ✅
            
            // ARBUSTOS BUENOS ✅
            'bush': 'arbusto.glb',                 // 44MB - Arbusto ✅
            
            // PASTO BUENO ✅
            'grass': 'grass.glb'                   // 🔥 PRUEBA: grass.glb en lugar de simple_grass_chunks.glb
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
                    
                    // Obtener tamaño del modelo
                    let vertexCount = 0;
                    let meshCount = 0;
                    gltf.scene.traverse((child) => {
                        if (child.isMesh) {
                            meshCount++;
                            if (child.geometry) {
                                vertexCount += child.geometry.attributes.position?.count || 0;
                            }
                        }
                    });
                    
                    console.log(`✅ Modelo cargado: ${cacheKey} (${glbFile}) - ${meshCount} meshes, ${vertexCount.toLocaleString()} vértices`);
                    
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
     * Clona un modelo cacheado
     * @param {THREE.Group} model - Modelo original
     * @returns {THREE.Group} - Copia del modelo
     */
    cloneModel(model) {
        const clone = model.clone();
        
        // ✅ Clonar materiales pero MANTENER texturas (no clonarlas)
        clone.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clonar material pero compartir texturas (más eficiente y evita grises)
                const materialClone = child.material.clone();
                
                // ✅ CRÍTICO: Asegurar que las texturas se mantienen
                if (child.material.map) {
                    materialClone.map = child.material.map; // Compartir textura (no clonar)
                    materialClone.map.needsUpdate = false; // Ya está cargada
                }
                if (child.material.normalMap) {
                    materialClone.normalMap = child.material.normalMap;
                }
                if (child.material.roughnessMap) {
                    materialClone.roughnessMap = child.material.roughnessMap;
                }
                if (child.material.metalnessMap) {
                    materialClone.metalnessMap = child.material.metalnessMap;
                }
                if (child.material.aoMap) {
                    materialClone.aoMap = child.material.aoMap;
                }
                
                // Forzar actualización del material
                materialClone.needsUpdate = true;
                
                child.material = materialClone;
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
