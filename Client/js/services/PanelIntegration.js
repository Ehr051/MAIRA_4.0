/**
 * 🎯 MAIRA 4.0 - Panel Integration
 * Integra DeploymentService con el panel de edición de elementos
 * Maneja los clicks de "Guardar Cambios" y botones de despliegue
 * 
 * @author MAIRA Team
 * @version 4.0.0
 * @since 2025-01-09
 */

class PanelIntegration {
    constructor() {
        this.currentElement = null;
        this.isEditMode = false;
        this.debugMode = true;
        
        this.initializeEventListeners();
        this.log('🎯 PanelIntegration iniciado');
    }

    /**
     * 🎧 Configurar event listeners
     */
    initializeEventListeners() {
        // Listener para cuando se abre el panel de edición
        document.addEventListener('panel.edit.opened', (event) => {
            this.handlePanelOpened(event.detail);
        });

        // Listener para el botón "Guardar Cambios"
        document.addEventListener('click', (event) => {
            if (event.target.matches('#save-changes-btn, .save-changes-btn')) {
                this.handleSaveChanges(event);
            }
        });

        // Listener para botones de despliegue
        document.addEventListener('click', (event) => {
            if (event.target.matches('.deploy-btn')) {
                this.handleDeployment(event);
            }
            
            if (event.target.matches('.redeploy-btn')) {
                this.handleRedeployment(event);
            }
        });

        this.log('✅ Event listeners configurados');
    }

    /**
     * 🎮 Manejar apertura del panel de edición
     */
    handlePanelOpened(elementData) {
        try {
            this.currentElement = elementData;
            this.isEditMode = true;
            
            this.log(`📝 Panel abierto para elemento: ${elementData.name}`);
            
            // Cargar datos militares del elemento
            this.loadMilitaryDataForElement(elementData);
            
            // Agregar sistema de órdenes militares
            this.addMilitaryOrdersSystem(elementData);
            
            // Agregar botones de despliegue si corresponde
            this.addDeploymentButtons(elementData);
            
        } catch (error) {
            console.error('❌ Error manejando apertura del panel:', error);
        }
    }

    /**
     * ⚔️ Agregar sistema de órdenes militares
     */
    addMilitaryOrdersSystem(elementData) {
        try {
            // Buscar o crear contenedor de órdenes
            let ordersContainer = document.getElementById('military-orders-container');
            
            if (!ordersContainer) {
                // Buscar panel de edición
                const panelContainer = document.querySelector('.panel-content, .edit-panel, #panel-edicion');
                
                if (panelContainer) {
                    ordersContainer = document.createElement('div');
                    ordersContainer.id = 'military-orders-container';
                    ordersContainer.className = 'military-orders-section';
                    
                    ordersContainer.innerHTML = `
                        <div class="orders-header">
                            <h3>⚔️ Órdenes Militares</h3>
                        </div>
                        <div class="orders-menu" id="orders-menu">
                            <!-- Las órdenes se cargarán dinámicamente -->
                        </div>
                    `;
                    
                    panelContainer.appendChild(ordersContainer);
                }
            }
            
            // Generar órdenes basadas en el tipo de elemento
            this.generateOrdersForElement(elementData);
            
        } catch (error) {
            console.error('❌ Error agregando sistema de órdenes:', error);
        }
    }

    /**
     * 📋 Generar órdenes específicas para el tipo de elemento
     */
    generateOrdersForElement(elementData) {
        const ordersMenu = document.getElementById('orders-menu');
        if (!ordersMenu) return;

        // Determinar tipo de unidad basado en SIDC o nombre
        const unitType = this.determineUnitType(elementData);
        
        // Órdenes comunes para todas las unidades
        const commonOrders = [
            { id: 'move', name: 'Marchar', icon: '🚶', action: 'moveUnit' },
            { id: 'halt', name: 'Alto', icon: '✋', action: 'haltUnit' },
            { id: 'deploy', name: 'Desplegar', icon: '🔀', action: 'deployUnit' },
            { id: 'withdraw', name: 'Replegar', icon: '↩️', action: 'withdrawUnit' }
        ];

        // Órdenes específicas por tipo de unidad
        const specificOrders = this.getSpecificOrdersForUnitType(unitType);
        
        // Combinar órdenes
        const allOrders = [...commonOrders, ...specificOrders];
        
        // Crear botones de órdenes
        ordersMenu.innerHTML = allOrders.map(order => `
            <button class="order-btn" data-order="${order.id}" data-action="${order.action}">
                <span class="order-icon">${order.icon}</span>
                <span class="order-name">${order.name}</span>
            </button>
        `).join('');
        
        // Agregar event listeners
        this.attachOrdersEventListeners();
    }

    /**
     * 🏷️ Determinar tipo de unidad
     */
    determineUnitType(elementData) {
        // Basado en SIDC o nombre del elemento
        const sidc = elementData.sidc || elementData.SIDC || '';
        const name = (elementData.name || '').toLowerCase();
        
        if (sidc.includes('120100') || name.includes('tanque') || name.includes('blindado')) {
            return 'armored';
        } else if (sidc.includes('120600') || name.includes('artilleria') || name.includes('artill')) {
            return 'artillery';
        } else if (sidc.includes('120500') || name.includes('ingenier')) {
            return 'engineer';
        } else if (sidc.includes('120800') || name.includes('comunicac')) {
            return 'communication';
        } else if (sidc.includes('120200') || name.includes('infanteria')) {
            return 'infantry';
        } else if (sidc.includes('120300') || name.includes('reconocimiento')) {
            return 'reconnaissance';
        }
        
        return 'generic';
    }

    /**
     * 🎯 Obtener órdenes específicas por tipo de unidad
     */
    getSpecificOrdersForUnitType(unitType) {
        const ordersByType = {
            armored: [
                { id: 'attack', name: 'Atacar', icon: '⚔️', action: 'attackTarget' },
                { id: 'defend', name: 'Defender', icon: '🛡️', action: 'defendPosition' },
                { id: 'advance', name: 'Avanzar', icon: '➡️', action: 'advancePosition' },
                { id: 'cover', name: 'Cubrir', icon: '🎯', action: 'coverSector' }
            ],
            artillery: [
                { id: 'fire_mission', name: 'Misión de Fuego', icon: '💥', action: 'fireMission' },
                { id: 'adjust_fire', name: 'Ajustar Fuego', icon: '🎯', action: 'adjustFire' },
                { id: 'cease_fire', name: 'Cesar Fuego', icon: '🚫', action: 'ceaseFire' },
                { id: 'displace', name: 'Desplazar', icon: '📍', action: 'displacePosition' }
            ],
            engineer: [
                { id: 'construct', name: 'Construir', icon: '🏗️', action: 'constructObstacle' },
                { id: 'demolish', name: 'Demoler', icon: '💣', action: 'demolishObstacle' },
                { id: 'repair', name: 'Reparar', icon: '🔧', action: 'repairEquipment' },
                { id: 'clear_route', name: 'Despejar Ruta', icon: '🛤️', action: 'clearRoute' }
            ],
            communication: [
                { id: 'establish_comms', name: 'Establecer Red', icon: '📡', action: 'establishNetwork' },
                { id: 'relay', name: 'Retransmitir', icon: '📶', action: 'relaySignal' },
                { id: 'install_antenna', name: 'Instalar Antena', icon: '📻', action: 'installAntenna' },
                { id: 'comm_check', name: 'Chequeo Radio', icon: '🔊', action: 'communicationCheck' }
            ],
            infantry: [
                { id: 'assault', name: 'Asaltar', icon: '🏃', action: 'assaultPosition' },
                { id: 'defend', name: 'Defender', icon: '🛡️', action: 'defendPosition' },
                { id: 'patrol', name: 'Patrullar', icon: '👁️', action: 'patrolArea' },
                { id: 'occupy', name: 'Ocupar', icon: '🏠', action: 'occupyPosition' }
            ],
            reconnaissance: [
                { id: 'observe', name: 'Observar', icon: '👁️', action: 'observeArea' },
                { id: 'report', name: 'Reportar', icon: '📋', action: 'reportStatus' },
                { id: 'infiltrate', name: 'Infiltrar', icon: '🥷', action: 'infiltrateArea' },
                { id: 'screen', name: 'Cubrir', icon: '🔍', action: 'screenMovement' }
            ],
            generic: [
                { id: 'support', name: 'Apoyar', icon: '🤝', action: 'supportUnit' },
                { id: 'maintain', name: 'Mantener', icon: '⚙️', action: 'maintainPosition' }
            ]
        };
        
        return ordersByType[unitType] || ordersByType.generic;
    }

    /**
     * 🎮 Agregar event listeners para órdenes
     */
    attachOrdersEventListeners() {
        const orderButtons = document.querySelectorAll('.order-btn');
        
        orderButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const orderId = button.dataset.order;
                const action = button.dataset.action;
                
                this.executeOrder(orderId, action, this.currentElement);
            });
        });
    }

    /**
     * ⚡ Ejecutar orden militar
     */
    async executeOrder(orderId, action, elementData) {
        try {
            this.log(`⚔️ Ejecutando orden: ${orderId} para ${elementData.name}`);
            
            switch (action) {
                case 'deployUnit':
                    await this.handleDeployment(elementData);
                    break;
                    
                case 'moveUnit':
                    this.showMoveOrderDialog(elementData);
                    break;
                    
                case 'attackTarget':
                    this.showAttackOrderDialog(elementData);
                    break;
                    
                case 'defendPosition':
                    this.showDefendOrderDialog(elementData);
                    break;
                    
                case 'fireMission':
                    this.showFireMissionDialog(elementData);
                    break;
                    
                case 'establishNetwork':
                    this.showCommunicationDialog(elementData);
                    break;
                    
                default:
                    this.showGenericOrderDialog(orderId, elementData);
            }
            
        } catch (error) {
            console.error(`❌ Error ejecutando orden ${orderId}:`, error);
        }
    }

    /**
     * 💾 Manejar click en "Guardar Cambios"
     */
    async handleSaveChanges(event) {
        try {
            event.preventDefault();
            
            if (!this.currentElement) {
                throw new Error('No hay elemento seleccionado');
            }

            this.log(`💾 Guardando cambios para: ${this.currentElement.name}`);
            
            // 1. Recopilar datos del formulario
            const formData = this.collectFormData();
            
            // 2. Cargar datos militares desde military_data.json
            const militaryData = await this.loadMilitaryAttributes(formData);
            
            // 3. Combinar datos del formulario con datos militares
            const enrichedData = this.enrichElementData(formData, militaryData);
            
            // 4. Actualizar elemento en el juego
            await this.updateGameElement(enrichedData);
            
            // 5. Mostrar confirmación
            this.showSaveConfirmation(enrichedData);
            
            this.log(`✅ Cambios guardados exitosamente`);
            
        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            this.showError('Error al guardar cambios: ' + error.message);
        }
    }

    /**
     * 🪖 Cargar atributos militares desde military_data.json
     */
    async loadMilitaryAttributes(formData) {
        try {
            // Usar MilitaryDataService para obtener datos
            const militaryData = await MilitaryDataService.loadData();
            
            // Buscar datos específicos del elemento
            const unitData = this.findUnitData(militaryData, formData);
            const weaponData = this.findWeaponData(militaryData, formData);
            const vehicleData = this.findVehicleData(militaryData, formData);
            
            return {
                unit: unitData,
                weapons: weaponData,
                vehicles: vehicleData,
                metadata: {
                    loadedAt: new Date().toISOString(),
                    source: 'military_data.json'
                }
            };
            
        } catch (error) {
            console.error('❌ Error cargando datos militares:', error);
            return null;
        }
    }

    /**
     * 🔍 Buscar datos de unidad en military_data.json
     */
    findUnitData(militaryData, formData) {
        if (!militaryData.unidades) return null;
        
        // Buscar por nombre o código SIDC
        return militaryData.unidades.find(unit => 
            unit.name === formData.name ||
            unit.codigo === formData.sidc_code ||
            unit.name.toLowerCase().includes(formData.name.toLowerCase())
        );
    }

    /**
     * 🔫 Buscar datos de armamento
     */
    findWeaponData(militaryData, formData) {
        if (!militaryData.armamento) return [];
        
        // Buscar armamento relacionado con el tipo de unidad
        return militaryData.armamento.filter(weapon => {
            // Lógica para asociar armamento con tipo de unidad
            return weapon.tipo_unidad === formData.unit_type ||
                   weapon.especialidad === formData.specialty;
        });
    }

    /**
     * 🚗 Buscar datos de vehículos
     */
    findVehicleData(militaryData, formData) {
        if (!militaryData.vehicles) return [];
        
        return militaryData.vehicles.filter(vehicle => {
            return vehicle.tipo_unidad === formData.unit_type ||
                   vehicle.especialidad === formData.specialty;
        });
    }

    /**
     * 🔗 Enriquecer datos del elemento con información militar
     */
    enrichElementData(formData, militaryData) {
        const enriched = { ...formData };
        
        if (militaryData?.unit) {
            // Agregar datos de personal
            enriched.personnel = {
                total: militaryData.unit.personal,
                officers: militaryData.unit.oficiales || 0,
                enlisted: militaryData.unit.personal - (militaryData.unit.oficiales || 0)
            };
            
            // Agregar capacidades
            enriched.capabilities = {
                mobility: militaryData.unit.movilidad || 'foot',
                firepower: militaryData.unit.poder_fuego || 'light',
                protection: militaryData.unit.proteccion || 'none'
            };
        }
        
        // Agregar armamento
        if (militaryData?.weapons) {
            enriched.weapons = militaryData.weapons.map(weapon => ({
                name: weapon.name,
                type: weapon.tipo,
                ammunition: weapon.municion,
                range: weapon.alcance,
                count: weapon.cantidad || 1
            }));
        }
        
        // Agregar vehículos
        if (militaryData?.vehicles) {
            enriched.vehicles = militaryData.vehicles.map(vehicle => ({
                name: vehicle.name,
                type: vehicle.tipo,
                crew: vehicle.tripulacion,
                passengers: vehicle.pasajeros,
                mobility: vehicle.movilidad_terreno
            }));
        }
        
        // Agregar metadatos
        enriched.military_metadata = {
            data_source: 'military_data.json',
            enriched_at: new Date().toISOString(),
            has_military_data: !!militaryData
        };
        
        return enriched;
    }

    /**
     * 📋 Recopilar datos del formulario actual
     */
    collectFormData() {
        const form = document.querySelector('#element-edit-form, .element-edit-form');
        if (!form) {
            throw new Error('Formulario de edición no encontrado');
        }

        const formData = new FormData(form);
        const data = {};
        
        // Convertir FormData a objeto regular
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Agregar datos del elemento actual
        data.id = this.currentElement.id;
        data.name = data.name || this.currentElement.name;
        data.sidc_code = data.sidc_code || this.currentElement.sidc_code;
        
        return data;
    }

    /**
     * 🎮 Actualizar elemento en el juego
     */
    async updateGameElement(elementData) {
        try {
            // Actualizar en el manejador de elementos
            if (window.gameHandler?.updateElement) {
                await window.gameHandler.updateElement(elementData);
            }
            
            // Actualizar en el mapa
            if (window.mapHandler?.updateElement) {
                await window.mapHandler.updateElement(elementData);
            }
            
            // Actualizar en el sistema de unidades
            if (window.unitHandler?.updateUnit) {
                await window.unitHandler.updateUnit(elementData);
            }
            
            // 🔧 CORREGIR: Actualizar lista de elementos del calco activo
            if (typeof window.actualizarElementosCalco === 'function') {
                window.actualizarElementosCalco();
                console.log('✅ Lista de elementos del calco actualizada después de editar elemento');
            }
            
            // Emitir evento de actualización
            this.emitElementUpdated(elementData);
            
        } catch (error) {
            console.error('❌ Error actualizando elemento en el juego:', error);
            throw error;
        }
    }

    /**
     * 🚀 Manejar despliegue de elemento
     */
    async handleDeployment(event) {
        try {
            event.preventDefault();
            
            if (!this.currentElement) {
                throw new Error('No hay elemento seleccionado para desplegar');
            }
            
            // Obtener tipo de despliegue del botón
            const deployType = event.target.dataset.deployType || 'auto';
            
            this.log(`🚀 Desplegando ${this.currentElement.name} (tipo: ${deployType})`);
            
            // Usar DeploymentService
            const result = await DeploymentService.deployElement(this.currentElement.id, deployType);
            
            if (result.success) {
                this.showDeploymentSuccess(result);
                this.updateDeploymentButtons(true);
            } else {
                this.showError('Error en despliegue: ' + result.error);
            }
            
        } catch (error) {
            console.error('❌ Error en despliegue:', error);
            this.showError('Error al desplegar: ' + error.message);
        }
    }

    /**
     * 📦 Manejar repliegue de elemento
     */
    async handleRedeployment(event) {
        try {
            event.preventDefault();
            
            if (!this.currentElement) {
                throw new Error('No hay elemento seleccionado para replegar');
            }
            
            this.log(`📦 Replegando ${this.currentElement.name}`);
            
            const result = await DeploymentService.redeployElement(this.currentElement.id);
            
            if (result.success) {
                this.showRedeploymentSuccess();
                this.updateDeploymentButtons(false);
            } else {
                this.showError('Error en repliegue: ' + result.error);
            }
            
        } catch (error) {
            console.error('❌ Error en repliegue:', error);
            this.showError('Error al replegar: ' + error.message);
        }
    }

    /**
     * 🔘 Agregar botones de despliegue al panel
     */
    addDeploymentButtons(elementData) {
        const panel = document.querySelector('#element-edit-panel, .element-edit-panel');
        if (!panel) return;
        
        // Verificar si ya existen los botones
        if (panel.querySelector('.deployment-controls')) return;
        
        const deploymentHTML = `
            <div class="deployment-controls mt-3">
                <h6><i class="fas fa-expand-arrows-alt"></i> Control de Despliegue</h6>
                <div class="btn-group w-100" role="group">
                    <button type="button" class="btn btn-success deploy-btn" data-deploy-type="auto">
                        <i class="fas fa-share-alt"></i> Desplegar
                    </button>
                    <button type="button" class="btn btn-warning redeploy-btn" style="display: none;">
                        <i class="fas fa-share-alt fa-rotate-180"></i> Replegar
                    </button>
                </div>
                <small class="text-muted d-block mt-1">
                    Divide/agrupa este elemento según su organización táctica
                </small>
            </div>
        `;
        
        // Agregar al final del panel
        panel.insertAdjacentHTML('beforeend', deploymentHTML);
    }

    /**
     * 🔄 Actualizar estado de botones de despliegue
     */
    updateDeploymentButtons(deployed) {
        const deployBtn = document.querySelector('.deploy-btn');
        const redeployBtn = document.querySelector('.redeploy-btn');
        
        if (deployBtn && redeployBtn) {
            if (deployed) {
                deployBtn.style.display = 'none';
                redeployBtn.style.display = 'block';
            } else {
                deployBtn.style.display = 'block';
                redeployBtn.style.display = 'none';
            }
        }
    }

    /**
     * 🎉 Mostrar confirmaciones y errores
     */
    showSaveConfirmation(elementData) {
        const message = `
            ✅ Elemento "${elementData.name}" actualizado exitosamente
            ${elementData.military_metadata?.has_military_data ? '🪖 Datos militares cargados' : ''}
        `;
        
        this.showNotification(message, 'success');
    }

    showDeploymentSuccess(result) {
        const message = `🚀 Elemento desplegado en ${result.children.length} unidades`;
        this.showNotification(message, 'success');
    }

    showRedeploymentSuccess() {
        const message = '📦 Elemento replegado exitosamente';
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Integrar con sistema de notificaciones existente
        if (window.NotificationService) {
            window.NotificationService.show(message, type);
        } else {
            // Fallback: alert simple
            alert(message);
        }
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * 📡 Emitir eventos
     */
    emitElementUpdated(elementData) {
        if (window.EventBus) {
            window.EventBus.emit('element.updated', elementData);
        }
        
        // Evento personalizado para otros sistemas
        document.dispatchEvent(new CustomEvent('element.enriched', {
            detail: elementData
        }));
    }

    /**
     * 🛠️ Utilidades
     */
    log(message) {
        if (this.debugMode) {
            console.log(`[PanelIntegration] ${message}`);
        }
    }

    /**
     * 📊 Estado del sistema
     */
    getStatus() {
        return {
            currentElement: this.currentElement?.name || 'ninguno',
            isEditMode: this.isEditMode,
            deploymentService: !!window.DeploymentService,
            militaryDataService: !!window.MilitaryDataService
        };
    }
}

// 🌍 Crear instancia global
window.PanelIntegration = new PanelIntegration();

// 📡 Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelIntegration;
}
