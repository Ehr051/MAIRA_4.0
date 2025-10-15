/**
 * 🌍 MAIRA 3D Terrain Generator - Módulo Principal
 * 
 * Este módulo se integra en la interfaz principal de MAIRA
 * Simplificado para uso real sin controles de testing
 */

class MAIRA3DTerrainModule {
    constructor(options = {}) {
        this.config = {
            // Valores por defecto optimizados
            defaultVerticalScale: 3.0,
            defaultVegetationDensity: 0.25,
            defaultResolution: 60,
            defaultTerrainSize: 1500,
            
            // Configuración de activación automática
            autoActivateZoom: 17, // Se activa automáticamente a zoom 17+
            
            // IDs de elementos DOM
            mapContainerId: 'map',
            buttonContainerId: 'map-controls',
            modalId: 'terrain-3d-modal',
            canvasContainerId: 'terrain-3d-canvas',
            
            ...options
        };
        
        this.isActive = false;
        this.currentTerrain = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.init();
    }
    
    /**
     * Inicializar el módulo
     */
    init() {
        this.createButton();
        this.createModal();
        this.setupMapEvents();
        console.log('✅ MAIRA 3D Terrain Module inicializado');
    }
    
    /**
     * Crear botón "Vista 3D" en la interfaz
     */
    createButton() {
        const buttonContainer = document.getElementById(this.config.buttonContainerId);
        if (!buttonContainer) {
            console.warn('⚠️ Contenedor de botones no encontrado:', this.config.buttonContainerId);
            return;
        }
        
        const button = document.createElement('button');
        button.id = 'vista-3d-btn';
        button.className = 'maira-3d-button';
        button.innerHTML = `
            <i class="fas fa-cube"></i>
            <span>Vista 3D</span>
        `;
        button.style.display = 'none'; // Oculto por defecto
        button.addEventListener('click', () => this.showModal());
        
        buttonContainer.appendChild(button);
        this.button = button;
    }
    
    /**
     * Crear modal simplificado
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = this.config.modalId;
        modal.className = 'maira-3d-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-mountain"></i> Generar Vista 3D</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="control-group">
                        <label>Exageración de Altura</label>
                        <input type="range" id="verticalScale3D" min="0.5" max="5" value="${this.config.defaultVerticalScale}" step="0.1">
                        <span class="value-display">${this.config.defaultVerticalScale}x</span>
                    </div>
                    
                    <div class="control-group">
                        <label>Densidad de Vegetación</label>
                        <input type="range" id="vegetationDensity3D" min="0" max="1" value="${this.config.defaultVegetationDensity}" step="0.05">
                        <span class="value-display">${Math.round(this.config.defaultVegetationDensity * 100)}%</span>
                    </div>
                    
                    <div class="control-group">
                        <label>Resolución del Terreno</label>
                        <input type="range" id="resolution3D" min="20" max="100" value="${this.config.defaultResolution}" step="10">
                        <span class="value-display">${this.config.defaultResolution}x${this.config.defaultResolution}</span>
                    </div>
                    
                    <div class="control-group">
                        <label>Tamaño del Área</label>
                        <input type="range" id="terrainSize3D" min="500" max="3000" value="${this.config.defaultTerrainSize}" step="100">
                        <span class="value-display">${this.config.defaultTerrainSize}m</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel">Cancelar</button>
                    <button class="btn-generate">🚀 Generar Vista 3D</button>
                </div>
            </div>
            <div class="modal-backdrop"></div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        this.setupModalEvents();
    }
    
    /**
     * Configurar eventos del mapa
     */
    setupMapEvents() {
        if (typeof L === 'undefined' || !window.mapa) {
            console.warn('⚠️ Leaflet o mapa no disponible');
            return;
        }
        
        // Activar botón según zoom
        window.mapa.on('zoomend', () => {
            const zoom = window.mapa.getZoom();
            if (zoom >= this.config.autoActivateZoom) {
                this.showButton();
            } else {
                this.hideButton();
            }
        });
    }
    
    /**
     * Mostrar botón Vista 3D
     */
    showButton() {
        if (this.button) {
            this.button.style.display = 'flex';
        }
    }
    
    /**
     * Ocultar botón Vista 3D
     */
    hideButton() {
        if (this.button) {
            this.button.style.display = 'none';
        }
    }
    
    /**
     * Mostrar modal de configuración
     */
    showModal() {
        if (this.modal) {
            this.modal.classList.add('active');
        }
    }
    
    /**
     * Ocultar modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    }
    
    /**
     * Configurar eventos del modal
     */
    setupModalEvents() {
        if (!this.modal) return;
        
        // Cerrar modal
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
        this.modal.querySelector('.btn-cancel').addEventListener('click', () => this.hideModal());
        this.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.hideModal());
        
        // Generar vista 3D
        this.modal.querySelector('.btn-generate').addEventListener('click', () => {
            this.generateTerrain3D();
        });
        
        // Actualizar valores en tiempo real
        this.setupValueUpdaters();
    }
    
    /**
     * Configurar actualizadores de valores
     */
    setupValueUpdaters() {
        const updaters = [
            { id: 'verticalScale3D', suffix: 'x' },
            { id: 'vegetationDensity3D', suffix: '%', multiplier: 100 },
            { id: 'resolution3D', suffix: '', format: (v) => `${v}x${v}` },
            { id: 'terrainSize3D', suffix: 'm' }
        ];
        
        updaters.forEach(({ id, suffix, multiplier = 1, format }) => {
            const input = document.getElementById(id);
            const display = input?.nextElementSibling;
            
            if (input && display) {
                input.addEventListener('input', () => {
                    const value = parseFloat(input.value);
                    const displayValue = format ? format(value) : Math.round(value * multiplier) + suffix;
                    display.textContent = displayValue;
                });
            }
        });
    }
    
    /**
     * Generar terreno 3D con configuración actual
     */
    async generateTerrain3D() {
        try {
            // Obtener valores del modal
            const config = this.getModalValues();
            
            // Ocultar modal y mostrar carga
            this.hideModal();
            this.showLoadingModal();
            
            // Generar terreno usando el sistema existente
            await this.createTerrain3D(config);
            
            // Ocultar modal de carga
            this.hideLoadingModal();
            
        } catch (error) {
            console.error('❌ Error generando terreno 3D:', error);
            this.hideLoadingModal();
            this.showError('Error generando el terreno 3D. Intenta nuevamente.');
        }
    }
    
    /**
     * Obtener valores del modal
     */
    getModalValues() {
        return {
            verticalScale: parseFloat(document.getElementById('verticalScale3D')?.value || this.config.defaultVerticalScale),
            vegetationDensity: parseFloat(document.getElementById('vegetationDensity3D')?.value || this.config.defaultVegetationDensity),
            resolution: parseInt(document.getElementById('resolution3D')?.value || this.config.defaultResolution),
            terrainSize: parseInt(document.getElementById('terrainSize3D')?.value || this.config.defaultTerrainSize)
        };
    }
    
    /**
     * Crear terreno 3D (implementación pendiente)
     */
    async createTerrain3D(config) {
        // TODO: Integrar con TerrainGenerator3D existente
        console.log('🏗️ Creando terreno 3D con configuración:', config);
        
        // Por ahora, simular proceso
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    /**
     * Mostrar modal de carga
     */
    showLoadingModal() {
        // TODO: Implementar modal de carga con progreso
        console.log('🔄 Mostrando modal de carga...');
    }
    
    /**
     * Ocultar modal de carga
     */
    hideLoadingModal() {
        console.log('✅ Ocultando modal de carga...');
    }
    
    /**
     * Mostrar error
     */
    showError(message) {
        alert(message); // TODO: Implementar notificación más elegante
    }
}

// Exportar para uso global
window.MAIRA3DTerrainModule = MAIRA3DTerrainModule;