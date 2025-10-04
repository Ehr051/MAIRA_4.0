/**
 * MAIRA 4.0 - Integración Completa Sistema 3D
 * ============================================
 * Combina todas las funcionalidades 3D implementadas
 * - Sistema básico de visualización
 * - Modelos GLTF avanzados
 * - Unidades militares realistas
 * - Terreno dinámico
 * - Interacción completa
 */

(function() {
    'use strict';

    // Namespace para integración 3D
    window.MAIRA3DIntegration = {

        // Referencias a sistemas
        basicSystem: null,
        advancedSystem: null,
        gameSystem: null,

        // Estado del sistema
        isInitialized: false,
        activeMode: null, // 'basic', 'advanced', 'game'

        /**
         * Inicializar integración completa
         */
        async initialize() {
            try {
                console.log('🚀 Inicializando integración completa MAIRA 3D...');

                // Verificar dependencias
                await this.checkDependencies();

                // Inicializar sistemas individuales
                await this.initializeBasicSystem();
                await this.initializeAdvancedSystem();
                await this.initializeGameSystem();

                // Configurar comunicación entre sistemas
                this.setupSystemCommunication();

                // Configurar UI unificada
                this.setupUnifiedUI();

                this.isInitialized = true;
                console.log('✅ Integración MAIRA 3D completa inicializada');

                return true;

            } catch (error) {
                console.error('❌ Error en integración 3D:', error);
                return false;
            }
        },

        /**
         * Verificar dependencias
         */
        async checkDependencies() {
            const dependencies = [
                { name: 'THREE', check: () => typeof THREE !== 'undefined' },
                { name: 'jQuery', check: () => typeof $ !== 'undefined' },
                { name: 'Socket.IO', check: () => typeof io !== 'undefined' }
            ];

            const missing = dependencies.filter(dep => !dep.check());

            if (missing.length > 0) {
                throw new Error(`Dependencias faltantes: ${missing.map(d => d.name).join(', ')}`);
            }

            console.log('✅ Todas las dependencias verificadas');
        },

        /**
         * Inicializar sistema básico (maira3d.js)
         */
        async initializeBasicSystem() {
            try {
                if (window.MAIRA && window.MAIRA.initSystem) {
                    this.basicSystem = window.MAIRA;
                    console.log('✅ Sistema básico MAIRA 3D disponible');
                } else {
                    console.warn('⚠️ Sistema básico no disponible, continuando...');
                }
            } catch (error) {
                console.warn('⚠️ Error inicializando sistema básico:', error);
            }
        },

        /**
         * Inicializar sistema avanzado (maira3DSystem.js)
         */
        async initializeAdvancedSystem() {
            try {
                if (window.MAIRA3DSystem) {
                    this.advancedSystem = new window.MAIRA3DSystem();
                    console.log('✅ Sistema avanzado MAIRA 3D disponible');
                } else {
                    console.warn('⚠️ Sistema avanzado no disponible, continuando...');
                }
            } catch (error) {
                console.warn('⚠️ Error inicializando sistema avanzado:', error);
            }
        },

        /**
         * Inicializar sistema de juego
         */
        async initializeGameSystem() {
            try {
                // Buscar funcionalidades de juego de guerra
                if (window.GestorJuego || window.iniciarJuego) {
                    this.gameSystem = {
                        gestor: window.GestorJuego,
                        iniciar: window.iniciarJuego
                    };
                    console.log('✅ Sistema de juego disponible');
                } else {
                    console.warn('⚠️ Sistema de juego no disponible, continuando...');
                }
            } catch (error) {
                console.warn('⚠️ Error inicializando sistema de juego:', error);
            }
        },

        /**
         * Configurar comunicación entre sistemas
         */
        setupSystemCommunication() {
            // Eventos personalizados para comunicación entre sistemas
            window.addEventListener('maira3d-sync', (event) => {
                this.syncSystems(event.detail);
            });

            window.addEventListener('maira3d-unit-added', (event) => {
                this.onUnitAdded(event.detail);
            });

            window.addEventListener('maira3d-mode-changed', (event) => {
                this.onModeChanged(event.detail);
            });

            console.log('✅ Comunicación entre sistemas configurada');
        },

        /**
         * Configurar UI unificada
         */
        setupUnifiedUI() {
            // Crear panel de control unificado
            this.createUnifiedControlPanel();

            // Configurar atajos de teclado
            this.setupKeyboardShortcuts();

            console.log('✅ UI unificada configurada');
        },

        /**
         * Crear panel de control unificado
         */
        createUnifiedControlPanel() {
            const panel = document.createElement('div');
            panel.id = 'maira-3d-control-panel';
            panel.innerHTML = `
                <div class="control-header">
                    <h4>🎮 MAIRA 3D Control</h4>
                    <button id="close-3d-panel">×</button>
                </div>
                <div class="control-modes">
                    <button class="mode-btn" data-mode="basic">Vista Básica</button>
                    <button class="mode-btn" data-mode="advanced">Vista Avanzada</button>
                    <button class="mode-btn" data-mode="game">Modo Juego</button>
                </div>
                <div class="control-options">
                    <label><input type="checkbox" id="show-terrain"> Terreno</label>
                    <label><input type="checkbox" id="show-units" checked> Unidades</label>
                    <label><input type="checkbox" id="show-buildings"> Edificios</label>
                    <label><input type="checkbox" id="realistic-models" checked> Modelos Realistas</label>
                </div>
                <div class="control-actions">
                    <button id="sync-2d-3d">🔄 Sincronizar con 2D</button>
                    <button id="reset-camera">📷 Reset Cámara</button>
                    <button id="export-scene">💾 Exportar Escena</button>
                </div>
            `;

            // Estilos
            panel.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 15px;
                border-radius: 10px;
                z-index: 10000;
                min-width: 250px;
                display: none;
            `;

            document.body.appendChild(panel);

            // Event listeners
            this.setupPanelEventListeners(panel);
        },

        /**
         * Configurar event listeners del panel
         */
        setupPanelEventListeners(panel) {
            // Cerrar panel
            panel.querySelector('#close-3d-panel').addEventListener('click', () => {
                panel.style.display = 'none';
            });

            // Cambiar modos
            panel.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const mode = e.target.dataset.mode;
                    this.changeMode(mode);
                });
            });

            // Opciones
            panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.updateOption(e.target.id, e.target.checked);
                });
            });

            // Acciones
            panel.querySelector('#sync-2d-3d').addEventListener('click', () => {
                this.syncWith2DMap();
            });

            panel.querySelector('#reset-camera').addEventListener('click', () => {
                this.resetCamera();
            });

            panel.querySelector('#export-scene').addEventListener('click', () => {
                this.exportScene();
            });
        },

        /**
         * Configurar atajos de teclado
         */
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (event) => {
                // Solo si no estamos en un input
                if (event.target.tagName === 'INPUT') return;

                switch(event.key.toLowerCase()) {
                    case 'f1':
                        event.preventDefault();
                        this.toggleControlPanel();
                        break;
                    case 'f2':
                        event.preventDefault();
                        this.changeMode('basic');
                        break;
                    case 'f3':
                        event.preventDefault();
                        this.changeMode('advanced');
                        break;
                    case 'f4':
                        event.preventDefault();
                        this.changeMode('game');
                        break;
                    case 'r':
                        if (event.ctrlKey) {
                            event.preventDefault();
                            this.resetCamera();
                        }
                        break;
                    case 's':
                        if (event.ctrlKey) {
                            event.preventDefault();
                            this.syncWith2DMap();
                        }
                        break;
                }
            });

            console.log('✅ Atajos de teclado configurados (F1-F4, Ctrl+R, Ctrl+S)');
        },

        /**
         * Cambiar modo de visualización 3D
         */
        async changeMode(mode) {
            try {
                console.log(`🎮 Cambiando a modo: ${mode}`);

                // Desactivar modo anterior
                if (this.activeMode) {
                    await this.deactivateMode(this.activeMode);
                }

                // Activar nuevo modo
                await this.activateMode(mode);
                this.activeMode = mode;

                // Notificar cambio
                window.dispatchEvent(new CustomEvent('maira3d-mode-changed', {
                    detail: { mode }
                }));

                // Actualizar UI
                this.updateModeButtons(mode);

                console.log(`✅ Modo cambiado a: ${mode}`);

            } catch (error) {
                console.error(`❌ Error cambiando modo ${mode}:`, error);
            }
        },

        /**
         * Activar un modo específico
         */
        async activateMode(mode) {
            switch(mode) {
                case 'basic':
                    if (this.basicSystem && this.basicSystem.initSystem) {
                        await this.basicSystem.initSystem();
                    }
                    break;

                case 'advanced':
                    if (this.advancedSystem && this.advancedSystem.initialize) {
                        const container = this.getOrCreate3DContainer();
                        await this.advancedSystem.initialize(container.id);
                        this.advancedSystem.activate();
                    }
                    break;

                case 'game':
                    if (this.gameSystem && this.gameSystem.iniciar) {
                        this.gameSystem.iniciar();
                    }
                    break;
            }
        },

        /**
         * Desactivar un modo
         */
        async deactivateMode(mode) {
            switch(mode) {
                case 'basic':
                    // El sistema básico no tiene deactivate específico
                    break;

                case 'advanced':
                    if (this.advancedSystem && this.advancedSystem.deactivate) {
                        this.advancedSystem.deactivate();
                    }
                    break;

                case 'game':
                    // Lógica para detener modo juego
                    break;
            }
        },

        /**
         * Obtener o crear contenedor 3D
         */
        getOrCreate3DContainer() {
            let container = document.getElementById('maira-3d-container');

            if (!container) {
                container = document.createElement('div');
                container.id = 'maira-3d-container';
                container.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 9999;
                    display: none;
                `;
                document.body.appendChild(container);
            }

            return container;
        },

        /**
         * Sincronizar con mapa 2D
         */
        syncWith2DMap() {
            try {
                // Obtener elementos del mapa 2D
                let elementos2D = [];

                if (window.obtenerElementosDelMapa) {
                    elementos2D = window.obtenerElementosDelMapa();
                } else if (window.map && window.map.eachLayer) {
                    // Intentar extraer de Leaflet
                    window.map.eachLayer((layer) => {
                        if (layer.options && layer.options.sidc) {
                            elementos2D.push({
                                lat: layer.getLatLng ? layer.getLatLng().lat : 0,
                                lng: layer.getLatLng ? layer.getLatLng().lng : 0,
                                sidc: layer.options.sidc,
                                designacion: layer.options.designacion,
                                afiliacion: layer.options.afiliacion
                            });
                        }
                    });
                }

                // Sincronizar con sistemas 3D
                if (this.advancedSystem && this.advancedSystem.syncWithMap2D) {
                    this.advancedSystem.syncWithMap2D(elementos2D);
                }

                if (this.basicSystem && this.basicSystem.syncWithMap2D) {
                    this.basicSystem.syncWithMap2D(elementos2D);
                }

                console.log(`🔄 Sincronizados ${elementos2D.length} elementos del mapa 2D`);

            } catch (error) {
                console.error('❌ Error sincronizando con mapa 2D:', error);
            }
        },

        /**
         * Reset de cámara
         */
        resetCamera() {
            if (this.advancedSystem && this.advancedSystem.camera) {
                this.advancedSystem.camera.position.set(100, 50, 100);
                if (this.advancedSystem.controls) {
                    this.advancedSystem.controls.reset();
                }
            }

            if (this.basicSystem && this.basicSystem.resetCamera) {
                this.basicSystem.resetCamera();
            }

            console.log('📷 Cámara reseteada');
        },

        /**
         * Exportar escena
         */
        exportScene() {
            try {
                if (this.advancedSystem && this.advancedSystem.scene) {
                    const exporter = new THREE.GLTFExporter();
                    exporter.parse(
                        this.advancedSystem.scene,
                        (result) => {
                            const output = JSON.stringify(result, null, 2);
                            const blob = new Blob([output], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);

                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'maira-3d-scene.gltf';
                            link.click();

                            URL.revokeObjectURL(url);
                        },
                        { binary: false }
                    );
                }

                console.log('💾 Escena exportada');

            } catch (error) {
                console.error('❌ Error exportando escena:', error);
            }
        },

        /**
         * Actualizar botones de modo
         */
        updateModeButtons(activeMode) {
            const buttons = document.querySelectorAll('.mode-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === activeMode);
            });
        },

        /**
         * Actualizar opción
         */
        updateOption(optionId, value) {
            console.log(`⚙️ Opción ${optionId}: ${value}`);

            // Implementar lógica para cada opción
            switch(optionId) {
                case 'show-terrain':
                    this.toggleTerrain(value);
                    break;
                case 'show-units':
                    this.toggleUnits(value);
                    break;
                case 'show-buildings':
                    this.toggleBuildings(value);
                    break;
                case 'realistic-models':
                    this.toggleRealisticModels(value);
                    break;
            }
        },

        /**
         * Toggle panel de control
         */
        toggleControlPanel() {
            const panel = document.getElementById('maira-3d-control-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        },

        // Métodos de sincronización
        syncSystems(data) {
            console.log('🔄 Sincronizando sistemas:', data);
        },

        onUnitAdded(unit) {
            console.log('➕ Unidad agregada:', unit);
        },

        onModeChanged(mode) {
            console.log('🎮 Modo cambiado:', mode);
        },

        // Métodos de toggle (placeholders para implementación futura)
        toggleTerrain(show) { console.log(`🌍 Terreno: ${show}`); },
        toggleUnits(show) { console.log(`👥 Unidades: ${show}`); },
        toggleBuildings(show) { console.log(`🏢 Edificios: ${show}`); },
        toggleRealisticModels(useRealistic) { console.log(`🎨 Modelos realistas: ${useRealistic}`); }
    };

    // Inicialización automática cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MAIRA3DIntegration.initialize();
        });
    } else {
        window.MAIRA3DIntegration.initialize();
    }

    // Exponer globalmente
    window.MAIRA3DIntegration = window.MAIRA3DIntegration;

    console.log('🎯 MAIRA 3D Integration System cargado');

})();