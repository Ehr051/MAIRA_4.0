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
            
            // Extraer geometry y material del primer mesh
            let geometry = null;
            let material = null;
            
            model.traverse((child) => {
                if (child.isMesh && !geometry) {
                    geometry = child.geometry.clone();
                    material = child.material.clone();
                }
            });
            
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
                    hasGeometry: !!modelData.geometry,
                    hasMaterial: !!modelData.material,
                    vertexCount: modelData.geometry?.attributes?.position?.count || 0
                });
                
                // Crear InstancedMesh
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
