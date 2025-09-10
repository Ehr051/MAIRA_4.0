/**
 * 🪖 MAIRA 4.0 - Deployment Service
 * Maneja el despliegue dinámico de unidades militares
 * Sistemas: E→G→S→SU→U y viceversa
 * 
 * @author MAIRA Team
 * @version 4.0.0
 * @since 2025-01-09
 */

class DeploymentService {
    constructor() {
        this.deployedElements = new Map(); // ID -> DeploymentInfo
        this.parentChildRelations = new Map(); // ParentID -> [ChildIDs]
        this.debugMode = true;
        
        this.log('🚀 DeploymentService iniciado');
    }

    /**
     * 🎯 DESPLEGAR: Divide una unidad en sus componentes
     */
    async deployElement(elementId, deploymentType = 'auto') {
        try {
            this.log(`🎯 Desplegando elemento ${elementId} (tipo: ${deploymentType})`);
            
            // 1. Obtener datos del elemento
            const elementData = await this.getElementData(elementId);
            if (!elementData) {
                throw new Error(`Elemento ${elementId} no encontrado`);
            }

            // 2. Determinar tipo de despliegue
            const deployment = await this.calculateDeployment(elementData, deploymentType);
            if (!deployment || deployment.children.length === 0) {
                throw new Error(`No se puede desplegar ${elementData.name}: Sin componentes definidos`);
            }

            // 3. Crear elementos hijos en el mapa
            const childElements = await this.createChildElements(elementData, deployment);

            // 4. Registrar relación padre-hijos
            this.registerDeployment(elementId, childElements);

            // 5. Actualizar interfaz
            await this.updateGameInterface(elementId, childElements, 'deploy');

            this.log(`✅ Elemento ${elementData.name} desplegado en ${childElements.length} unidades`);
            
            return {
                parentId: elementId,
                children: childElements,
                deploymentType: deployment.type,
                success: true
            };

        } catch (error) {
            console.error('❌ Error en despliegue:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 📦 REPLEGAR: Agrupa elementos hijos en su padre
     */
    async redeployElement(parentId) {
        try {
            this.log(`📦 Replegando elemento ${parentId}`);
            
            // 1. Verificar que existe el despliegue
            if (!this.parentChildRelations.has(parentId)) {
                throw new Error(`Elemento ${parentId} no está desplegado`);
            }

            const childIds = this.parentChildRelations.get(parentId);
            
            // 2. Eliminar elementos hijos del mapa
            await this.removeChildElements(childIds);

            // 3. Restaurar elemento padre
            await this.restoreParentElement(parentId);

            // 4. Limpiar registros
            this.unregisterDeployment(parentId);

            // 5. Actualizar interfaz
            await this.updateGameInterface(parentId, [], 'redeploy');

            this.log(`✅ Elemento ${parentId} replegado`);
            
            return { success: true };

        } catch (error) {
            console.error('❌ Error en repliegue:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 📊 Calcular despliegue según tipo de unidad
     */
    async calculateDeployment(elementData, deploymentType) {
        try {
            // Obtener datos militares del MilitaryDataService
            const militaryData = await MilitaryDataService.loadData();
            
            // Buscar unidad en los datos
            const unitData = militaryData.unidades.find(u => 
                u.name === elementData.name || 
                u.codigo === elementData.sidc_code
            );

            if (!unitData) {
                this.log(`⚠️ Unidad ${elementData.name} no encontrada en datos militares`);
                return this.getDefaultDeployment(elementData);
            }

            // Determinar despliegue según magnitud SIDC
            const magnitude = this.extractMagnitude(elementData.sidc_code);
            
            switch (magnitude) {
                case 'U': // Unidad → Subunidades
                    return this.calculateUnitDeployment(unitData);
                    
                case 'SU': // Subunidad → Secciones
                    return this.calculateSubunitDeployment(unitData);
                    
                case 'S': // Sección → Grupos
                    return this.calculateSectionDeployment(unitData);
                    
                case 'G': // Grupo → Elementos individuales
                    return this.calculateGroupDeployment(unitData);
                    
                default:
                    this.log(`⚠️ Magnitud ${magnitude} no soportada para despliegue`);
                    return null;
            }

        } catch (error) {
            console.error('❌ Error calculando despliegue:', error);
            return this.getDefaultDeployment(elementData);
        }
    }

    /**
     * 🏗️ Crear elementos hijos en posiciones tácticas
     */
    async createChildElements(parentData, deployment) {
        const childElements = [];
        const basePosition = parentData.position || { lat: 0, lng: 0 };
        
        for (let i = 0; i < deployment.children.length; i++) {
            const childSpec = deployment.children[i];
            
            // Calcular posición táctica
            const position = this.calculateTacticalPosition(basePosition, i, deployment.children.length);
            
            // Crear elemento hijo
            const childElement = {
                id: this.generateChildId(parentData.id, i),
                parentId: parentData.id,
                name: childSpec.name,
                sidc_code: childSpec.sidc_code,
                position: position,
                personnel: childSpec.personnel,
                equipment: childSpec.equipment,
                ammunition: childSpec.ammunition,
                status: 'active',
                deploymentIndex: i,
                created: new Date().toISOString()
            };

            // Agregar al mapa del juego
            await this.addElementToMap(childElement);
            
            childElements.push(childElement);
        }

        return childElements;
    }

    /**
     * 📍 Calcular posición táctica para despliegue
     */
    calculateTacticalPosition(basePos, index, total) {
        // Distribución táctica en formación
        const spacing = 0.001; // ~100m en grados
        const angle = (360 / total) * index; // Distribución circular
        
        // Para formaciones pequeñas, usar línea
        if (total <= 3) {
            return {
                lat: basePos.lat + (index - total/2) * spacing,
                lng: basePos.lng
            };
        }
        
        // Para formaciones grandes, usar círculo
        const radians = (angle * Math.PI) / 180;
        return {
            lat: basePos.lat + Math.cos(radians) * spacing,
            lng: basePos.lng + Math.sin(radians) * spacing
        };
    }

    /**
     * 🪖 Despliegues específicos por tipo de unidad
     */
    calculateUnitDeployment(unitData) {
        // Unidad se despliega en Subunidades
        const subunits = Math.floor(unitData.personal / 100) || 3; // Default 3 subunidades
        
        return {
            type: 'unit_to_subunits',
            children: Array.from({length: subunits}, (_, i) => ({
                name: `${unitData.name} - SU${i+1}`,
                sidc_code: this.changeMagnitude(unitData.codigo, 'SU'),
                personnel: Math.floor(unitData.personal / subunits),
                equipment: this.distributeEquipment(unitData.equipamiento, subunits),
                ammunition: this.distributeAmmunition(unitData.municion, subunits)
            }))
        };
    }

    calculateSectionDeployment(unitData) {
        // Sección se despliega en Grupos (típicamente 3)
        return {
            type: 'section_to_groups',
            children: [
                {
                    name: `${unitData.name} - G1`,
                    sidc_code: this.changeMagnitude(unitData.codigo, 'G'),
                    personnel: Math.floor(unitData.personal / 3),
                    equipment: this.distributeEquipment(unitData.equipamiento, 3),
                    ammunition: this.distributeAmmunition(unitData.municion, 3)
                },
                {
                    name: `${unitData.name} - G2`,
                    sidc_code: this.changeMagnitude(unitData.codigo, 'G'),
                    personnel: Math.floor(unitData.personal / 3),
                    equipment: this.distributeEquipment(unitData.equipamiento, 3),
                    ammunition: this.distributeAmmunition(unitData.municion, 3)
                },
                {
                    name: `${unitData.name} - G3`,
                    sidc_code: this.changeMagnitude(unitData.codigo, 'G'),
                    personnel: Math.ceil(unitData.personal / 3), // Resto al último grupo
                    equipment: this.distributeEquipment(unitData.equipamiento, 3),
                    ammunition: this.distributeAmmunition(unitData.municion, 3)
                }
            ]
        };
    }

    /**
     * 🔀 Utilidades SIDC
     */
    extractMagnitude(sidc) {
        if (!sidc || sidc.length < 10) return 'U';
        return sidc.charAt(9); // Posición 10 en SIDC (0-indexed)
    }

    changeMagnitude(sidc, newMagnitude) {
        if (!sidc || sidc.length < 10) return sidc;
        return sidc.substring(0, 9) + newMagnitude + sidc.substring(10);
    }

    /**
     * 📦 Distribución de recursos
     */
    distributeEquipment(equipment, parts) {
        if (!equipment) return {};
        
        const distributed = {};
        for (const [key, value] of Object.entries(equipment)) {
            distributed[key] = Math.floor(value / parts);
        }
        return distributed;
    }

    distributeAmmunition(ammunition, parts) {
        if (!ammunition) return {};
        
        const distributed = {};
        for (const [key, value] of Object.entries(ammunition)) {
            distributed[key] = Math.floor(value / parts);
        }
        return distributed;
    }

    /**
     * 🗺️ Integración con mapa del juego
     */
    async addElementToMap(element) {
        try {
            // Integrar con el sistema de mapas existente
            if (window.mapHandler && window.mapHandler.addElement) {
                await window.mapHandler.addElement(element);
            }
            
            // Integrar con el sistema de unidades
            if (window.unitHandler && window.unitHandler.createUnit) {
                await window.unitHandler.createUnit(element);
            }
            
            this.log(`📍 Elemento ${element.name} añadido al mapa`);
            
        } catch (error) {
            console.error('❌ Error añadiendo elemento al mapa:', error);
        }
    }

    /**
     * 🗃️ Registro y gestión de relaciones
     */
    registerDeployment(parentId, children) {
        const childIds = children.map(c => c.id);
        this.parentChildRelations.set(parentId, childIds);
        
        // Registrar cada hijo con su padre
        children.forEach(child => {
            this.deployedElements.set(child.id, {
                parentId: parentId,
                element: child,
                deployedAt: new Date()
            });
        });
    }

    unregisterDeployment(parentId) {
        if (this.parentChildRelations.has(parentId)) {
            const childIds = this.parentChildRelations.get(parentId);
            
            // Limpiar registros de hijos
            childIds.forEach(childId => {
                this.deployedElements.delete(childId);
            });
            
            // Limpiar relación padre-hijos
            this.parentChildRelations.delete(parentId);
        }
    }

    /**
     * 🔧 Utilidades
     */
    generateChildId(parentId, index) {
        return `${parentId}_child_${index}_${Date.now()}`;
    }

    async getElementData(elementId) {
        // Integrar con el sistema de elementos existente
        if (window.gameHandler && window.gameHandler.getElement) {
            return await window.gameHandler.getElement(elementId);
        }
        
        // Fallback: crear datos de prueba
        return {
            id: elementId,
            name: `Elemento ${elementId}`,
            sidc_code: 'SFGPUCIS--G----',
            position: { lat: -34.6037, lng: -58.3816 }
        };
    }

    log(message) {
        if (this.debugMode) {
            console.log(`[DeploymentService] ${message}`);
        }
    }

    /**
     * 🎮 Integración con interfaz del juego
     */
    async updateGameInterface(elementId, children, action) {
        try {
            // Actualizar panel de información
            if (window.interfaceHandler && window.interfaceHandler.updateElementInfo) {
                await window.interfaceHandler.updateElementInfo(elementId, {
                    action: action,
                    children: children
                });
            }
            
            // Emitir evento para otros sistemas
            if (window.EventBus) {
                window.EventBus.emit('element.deployment.changed', {
                    elementId,
                    children,
                    action
                });
            }
            
        } catch (error) {
            console.error('❌ Error actualizando interfaz:', error);
        }
    }

    /**
     * 📊 Estado del servicio
     */
    getDeploymentStatus() {
        return {
            totalDeployments: this.parentChildRelations.size,
            totalDeployedElements: this.deployedElements.size,
            activeRelations: Array.from(this.parentChildRelations.entries()).map(([parent, children]) => ({
                parent,
                childrenCount: children.length
            }))
        };
    }
}

// 🌍 Crear instancia global
window.DeploymentService = new DeploymentService();

// 📡 Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeploymentService;
}
