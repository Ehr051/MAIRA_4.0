/**
 * ═══════════════════════════════════════════════════════════════════════
 * VEGETATION INSTANCER - MAIRA 4.0
 * ═══════════════════════════════════════════════════════════════════════
 * Sistema de instanciación de vegetación con THREE.InstancedMesh
 * 
 * Mejora crítica:
 * - SIN instancing: 100 árboles = 100 meshes × 81MB = 8.1GB 💥
 * - CON instancing: 100 árboles = 1 mesh × 81MB = 81MB ✅
 * 
 * Reducción: 100x menos memoria
 * 
 * @version 1.0.0
 * @author MAIRA Team
 * @date 2025-10-05
 */

class VegetationInstancer {
    constructor(scene, modelLoader) {
        this.scene = scene;
        this.modelLoader = modelLoader;
        
        // Mapa de modelos cargados por tipo
        // { 'tree_tall': { geometry, material, instances: [] } }
        this.modelCache = new Map();
        
        // Instanced meshes por tipo
        // { 'tree_tall': InstancedMesh }
        this.instancedMeshes = new Map();
        
        // Contador de instancias por tipo
        this.instanceCounts = new Map();
        
        console.log('🌳 VegetationInstancer inicializado');
    }
    
    /**
     * Cargar modelo base (una sola vez por tipo)
     * @param {string} modelType - Tipo de modelo ('tree_tall', 'bush', etc.)
     * @returns {Promise<Object>} { geometry, material }
     */
    async loadModelBase(modelType) {
        // Si ya está cargado, retornar del cache
        if (this.modelCache.has(modelType)) {
            return this.modelCache.get(modelType);
        }
        
        console.log(`📦 Cargando modelo base: ${modelType}...`);
        
        try {
            // Usar GLTFModelLoader existente
            const model = await this.modelLoader.loadModel(modelType);
            
            if (!model) {
                throw new Error(`Modelo ${modelType} no encontrado`);
            }
            
            // Extraer geometry y material del modelo
            // ✅ CORRECCIÓN: Combinar TODOS los meshes, no solo el primero
            // Los árboles tienen múltiples partes (tronco, ramas, hojas)
            const meshes = [];
            const materials = [];
            
            model.traverse((child) => {
                if (child.isMesh) {
                    meshes.push(child);
                    // Guardar material único
                    if (!materials.includes(child.material)) {
                        materials.push(child.material);
                    }
                }
            });
            
            console.log(`🔍 Modelo ${modelType} tiene ${meshes.length} meshes y ${materials.length} materiales`);
            
            if (meshes.length === 0) {
                throw new Error(`No se encontraron meshes en ${modelType}`);
            }
            
            let geometry, material;
            
            if (meshes.length === 1) {
                // Un solo mesh - usar directamente
                geometry = meshes[0].geometry.clone();
                material = meshes[0].material.clone();
                console.log(`✅ Usando mesh único (${geometry.attributes.position.count} vértices)`);
            } else {
                // 🔥 FIX CRÍTICO: Múltiples meshes con diferentes materiales (tronco + follaje)
                // NO fusionar - usar el modelo completo como Group
                console.warn(`⚠️ Modelo ${modelType} tiene ${meshes.length} meshes - NO fusionar para preservar materiales`);
                console.warn(`   Usando modelo completo (Group) en lugar de InstancedMesh`);
                console.warn(`   Materiales: ${materials.map(m => m.name || 'unnamed').join(', ')}`);
                
                // Guardar el modelo completo sin fusionar
                const modelData = {
                    model: model.clone(),
                    meshes: meshes.length,
                    materials: materials.length,
                    useGroup: true // Flag para NO usar InstancedMesh
                };
                
                this.modelCache.set(modelType, modelData);
                return modelData;
                
                // ✅ FORZAR CARGA DE TEXTURAS: Verificar y configurar correctamente
                if (material) {
                    console.log(`🎨 Configurando material para ${modelType}...`);
                    
                    // Forzar actualización del material
                    material.needsUpdate = true;
                    
                    // Verificar si tiene mapa de textura
                    if (material.map) {
                        console.log(`  ✅ BaseColor texture encontrada`);
                        material.map.needsUpdate = true;
                        // Asegurar que la textura use el encoding correcto
                        material.map.encoding = THREE.sRGBEncoding;
                    } else {
                        console.warn(`  ⚠️ Sin baseColor texture - Aplicando color fallback`);
                        // Color verde oscuro para vegetación sin textura
                        material.color = new THREE.Color(0x2d5016);
                    }
                    
                    // Verificar normal map
                    if (material.normalMap) {
                        console.log(`  ✅ Normal map encontrada`);
                        material.normalMap.needsUpdate = true;
                    }
                    
                    // Verificar metallic/roughness
                    if (material.metalnessMap || material.roughnessMap) {
                        console.log(`  ✅ Metalness/Roughness maps encontradas`);
                        if (material.metalnessMap) material.metalnessMap.needsUpdate = true;
                        if (material.roughnessMap) material.roughnessMap.needsUpdate = true;
                    }
                    
                    // Configurar propiedades del material para mejor visualización
                    material.side = THREE.FrontSide;  // O DoubleSide si es necesario
                    material.transparent = false;
                    material.opacity = 1.0;
                    
                    console.log(`  📊 Material type: ${material.type}, Has map: ${!!material.map}`);
                }
            }
            
            if (!geometry || !material) {
                throw new Error(`No se pudo extraer geometry/material de ${modelType}`);
            }
            
            // Guardar en cache
            const modelData = { geometry, material, instances: [] };
            this.modelCache.set(modelType, modelData);
            
            console.log(`✅ Modelo base cargado: ${modelType}`);
            return modelData;
            
        } catch (error) {
            console.error(`❌ Error cargando modelo ${modelType}:`, error);
            return null;
        }
    }
    
    /**
     * Agregar múltiples instancias
     * @param {Array} instances - Array de { type, position, scale, rotation }
     * @returns {Promise<Array>} Array de InstancedMesh creados
     */
    async addInstances(instances) {
        console.log(`🎨 VegetationInstancer.addInstances() llamado con ${instances.length} instancias`);
        
        if (!instances || instances.length === 0) {
            console.warn('⚠️ No hay instancias para agregar');
            return [];
        }
        
        const startTime = performance.now();
        
        // Agrupar instancias por tipo
        const instancesByType = new Map();
        
        instances.forEach(inst => {
            if (!instancesByType.has(inst.type)) {
                instancesByType.set(inst.type, []);
            }
            instancesByType.get(inst.type).push(inst);
        });
        
        console.log(`📊 Tipos de vegetación encontrados:`, Array.from(instancesByType.keys()));
        console.log(`📊 Instancias por tipo:`, Array.from(instancesByType.entries()).map(([type, insts]) => `${type}=${insts.length}`).join(', '));
        
        const createdMeshes = [];
        
        // Crear InstancedMesh para cada tipo
        for (const [modelType, typeInstances] of instancesByType.entries()) {
            console.log(`🔧 Procesando tipo: ${modelType} con ${typeInstances.length} instancias...`);
            
            try {
                // Cargar modelo base
                console.log(`📦 Cargando modelo base: ${modelType}...`);
                const modelData = await this.loadModelBase(modelType);
                
                if (!modelData) {
                    console.warn(`⚠️ Saltando ${modelType} (modelo no disponible)`);
                    continue;
                }
                
                console.log(`✅ Modelo ${modelType} cargado:`, {
                    useGroup: modelData.useGroup || false,
                    hasGeometry: !!modelData.geometry,
                    hasMaterial: !!modelData.material,
                    hasModel: !!modelData.model,
                    meshes: modelData.meshes,
                    materials: modelData.materials,
                    vertexCount: modelData.geometry?.attributes?.position?.count || 0
                });
                
                // 🔥 FIX CRÍTICO: Si tiene múltiples meshes/materiales, NO usar InstancedMesh
                if (modelData.useGroup) {
                    console.log(`🌳 Usando Groups individuales para preservar materiales (${modelData.materials} materiales)`);
                    
                    // Crear un Group por cada instancia
                    typeInstances.forEach((inst, index) => {
                        const instanceGroup = modelData.model.clone();
                        
                        // Configurar posición, rotación, escala
                        instanceGroup.position.set(
                            inst.position.x || 0,
                            inst.position.y || 0,
                            inst.position.z || 0
                        );
                        
                        instanceGroup.rotation.y = inst.rotation || 0;
                        
                        const scaleValue = inst.scale || 1.0;
                        instanceGroup.scale.set(scaleValue, scaleValue, scaleValue);
                        
                        // 🔥 FORZAR VISIBILIDAD de TODOS los meshes
                        instanceGroup.traverse((child) => {
                            if (child.isMesh) {
                                child.visible = true;
                                child.frustumCulled = false;
                                child.castShadow = true;
                                child.receiveShadow = true;
                                
                                // Verificar material
                                if (child.material) {
                                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                                    materials.forEach(mat => {
                                        mat.needsUpdate = true;
                                        mat.side = THREE.DoubleSide;
                                        mat.visible = true;
                                        
                                        // Fix opacity
                                        if (mat.transparent && mat.opacity < 0.1) {
                                            mat.opacity = 1.0;
                                            mat.transparent = false;
                                        }
                                    });
                                }
                            }
                        });
                        
                        instanceGroup.userData.vegetationType = modelType;
                        instanceGroup.userData.isVegetation = true;
                        
                        this.scene.add(instanceGroup);
                        createdMeshes.push(instanceGroup);
                    });
                    
                    console.log(`✅ ${typeInstances.length} Groups creados para ${modelType}`);
                    continue; // Saltar a la siguiente iteración
                }
                
                // Crear InstancedMesh (solo si useGroup = false)
                const instancedMesh = new THREE.InstancedMesh(
                    modelData.geometry,
                    modelData.material,
                    typeInstances.length
                );
                
                // Configurar matriz de transformación para cada instancia
                const matrix = new THREE.Matrix4();
                const position = new THREE.Vector3();
                const rotation = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                
                typeInstances.forEach((inst, index) => {
                    // Posición
                    position.set(
                        inst.position.x || 0,
                        inst.position.y || 0,
                        inst.position.z || 0
                    );
                    
                    // Rotación (Y-axis)
                    rotation.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0),
                        inst.rotation || 0
                    );
                    
                    // Escala
                    const scaleValue = inst.scale || 1.0;
                    scale.set(scaleValue, scaleValue, scaleValue);
                    
                    // Componer matriz
                    matrix.compose(position, rotation, scale);
                    
                    // Aplicar a instancia
                    instancedMesh.setMatrixAt(index, matrix);
                });
                
                // Marcar para actualización
                instancedMesh.instanceMatrix.needsUpdate = true;
                
                // Habilitar frustum culling por instancia (mejor performance)
                instancedMesh.frustumCulled = true;
                
                // Metadata
                instancedMesh.userData.vegetationType = modelType;
                instancedMesh.userData.instanceCount = typeInstances.length;
                
                // Agregar a escena
                this.scene.add(instancedMesh);
                
                // Guardar referencia
                this.instancedMeshes.set(modelType, instancedMesh);
                this.instanceCounts.set(modelType, typeInstances.length);
                
                createdMeshes.push(instancedMesh);
                
                console.log(`✅ InstancedMesh creado: ${modelType} × ${typeInstances.length}`);
                
            } catch (error) {
                console.error(`❌ Error creando InstancedMesh para ${modelType}:`, error);
            }
        }
        
        const endTime = performance.now();
        const timeMs = (endTime - startTime).toFixed(2);
        
        console.log(`✅ ${createdMeshes.length} InstancedMeshes creados en ${timeMs}ms`);
        console.log(`📊 Total instancias: ${instances.length}`);
        
        return createdMeshes;
    }
    
    /**
     * Obtener estadísticas de memoria e instancias
     */
    getStats() {
        const stats = {
            types: this.instancedMeshes.size,
            totalInstances: 0,
            byType: {}
        };
        
        this.instanceCounts.forEach((count, type) => {
            stats.totalInstances += count;
            stats.byType[type] = count;
        });
        
        return stats;
    }
    
    /**
     * Limpiar todas las instancias
     */
    clear() {
        this.instancedMeshes.forEach((mesh, type) => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            console.log(`🗑️ InstancedMesh removido: ${type}`);
        });
        
        this.instancedMeshes.clear();
        this.instanceCounts.clear();
        
        console.log('🧹 VegetationInstancer limpiado');
    }
    
    /**
     * Remover tipo específico
     */
    removeType(modelType) {
        if (this.instancedMeshes.has(modelType)) {
            const mesh = this.instancedMeshes.get(modelType);
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            
            this.instancedMeshes.delete(modelType);
            this.instanceCounts.delete(modelType);
            
            console.log(`🗑️ Tipo removido: ${modelType}`);
        }
    }
}

// Exportar para Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VegetationInstancer;
}

// Registrar globalmente para uso en navegador
if (typeof window !== 'undefined') {
    window.VegetationInstancer = VegetationInstancer;
    console.log('✅ VegetationInstancer registrado globalmente');
}
