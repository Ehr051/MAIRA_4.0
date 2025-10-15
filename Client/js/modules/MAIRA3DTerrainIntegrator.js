/**
 * 🔗 Integrador MAIRA 3D Terrain
 * 
 * Este archivo conecta el módulo simplificado con el sistema completo existente
 * Extrae la funcionalidad principal sin toda la UI de testing
 */

class MAIRA3DTerrainIntegrator {
    constructor(terrainModule) {
        this.module = terrainModule;
        this.terrainGenerator = null;
        this.satelliteAnalyzer = null;
        this.currentBounds = null;
        this.currentZoom = null;
        
        this.init();
    }
    
    async init() {
        // Esperar a que los servicios estén listos
        await this.waitForServices();
        
        // Inicializar generadores
        this.initGenerators();
        
        console.log('✅ MAIRA 3D Terrain Integrator inicializado');
    }
    
    /**
     * Esperar servicios MAIRA
     */
    async waitForServices() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.TerrainGenerator3D && window.SatelliteImageAnalyzer && window.L && window.mapa) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    /**
     * Esperar servicios geoespaciales
     */
    async waitForGeospatialServices() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.elevationService && window.vegetationService && window.elevationHandler && window.vegetationHandler) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    /**
     * Inicializar generadores
     */
    async initGenerators() {
        // Crear instancias de los generadores
        this.terrainGenerator = new TerrainGenerator3D();
        this.satelliteAnalyzer = new SatelliteImageAnalyzer();
        
        // Esperar servicios geoespaciales
        await this.waitForGeospatialServices();
        
        // Inicializar TerrainGenerator3D con servicios
        await this.initializeTerrainGenerator();
        
        // Exponer método de generación al módulo
        this.module.createTerrain3D = (config) => this.generateTerrain(config);
    }
    
    /**
     * Inicializar TerrainGenerator3D con servicios
     */
    async initializeTerrainGenerator() {
        try {
            // Crear sistema 3D (se inicializará cuando se cree la escena)
            const maira3DSystem = {
                scene: null, // Se asignará cuando se inicialice Three.js
                camera: null,
                renderer: null,
                controls: null
            };
            
            // Inicializar TerrainGenerator3D
            await this.terrainGenerator.initialize(
                window.elevationHandler,   // elevationHandler (adapter)
                window.vegetationHandler,  // vegetationHandler (adapter)
                maira3DSystem,             // maira3DSystem
                this.satelliteAnalyzer     // satelliteAnalyzer
            );
            
            console.log('✅ TerrainGenerator3D inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando TerrainGenerator3D:', error);
            throw error;
        }
    }
    
    /**
     * Generar terreno 3D - Método principal
     */
    async generateTerrain(config) {
        console.log('🏗️ Iniciando generación de terreno 3D:', config);
        
        try {
            // 1. Capturar vista actual del mapa
            const mapCapture = await this.captureCurrentMapView();
            
            // 2. Analizar imagen satelital
            const analysisResult = await this.analyzeMapCapture(mapCapture, config);
            
            // 3. Generar terreno 3D
            const terrain = await this.create3DTerrain(analysisResult, config);
            
            // 4. Configurar vista 3D
            this.setup3DView(terrain);
            
            return terrain;
            
        } catch (error) {
            console.error('❌ Error en generación de terreno:', error);
            throw error;
        }
    }
    
    /**
     * Capturar vista actual del mapa
     */
    async captureCurrentMapView() {
        if (!window.mapa) {
            throw new Error('Mapa no disponible');
        }
        
        const bounds = window.mapa.getBounds();
        const zoom = window.mapa.getZoom();
        const center = window.mapa.getCenter();
        
        this.currentBounds = bounds;
        this.currentZoom = zoom;
        
        console.log('📸 Capturando mapa - Zoom:', zoom, 'Centro:', center);
        
        // Usar leaflet-image si está disponible
        if (window.leafletImage) {
            return new Promise((resolve, reject) => {
                leafletImage(window.mapa, (err, canvas) => {
                    if (err) reject(err);
                    else resolve({
                        canvas: canvas,
                        bounds: bounds,
                        zoom: zoom,
                        center: center
                    });
                });
            });
        } else {
            // Fallback: usar html2canvas o método alternativo
            throw new Error('leaflet-image no disponible');
        }
    }
    
    /**
     * Analizar captura del mapa
     */
    async analyzeMapCapture(mapCapture, config) {
        console.log('🔍 Analizando imagen satelital...');
        
        if (!this.satelliteAnalyzer) {
            throw new Error('SatelliteImageAnalyzer no inicializado');
        }
        
        // Configurar analizador
        this.satelliteAnalyzer.useTIF = true; // Siempre usar TIF
        this.satelliteAnalyzer.vegetationDensity = config.vegetationDensity;
        
        // Analizar imagen
        const analysisResult = await this.satelliteAnalyzer.analyzeImage(
            mapCapture.canvas,
            {
                lod: this.calculateOptimalLOD(config.resolution),
                useTIF: true
            }
        );
        
        console.log('📊 Análisis completado:', analysisResult);
        return analysisResult;
    }
    
    /**
     * Crear terreno 3D
     */
    async create3DTerrain(analysisResult, config) {
        console.log('🏔️ Generando geometría 3D...');
        
        if (!this.terrainGenerator) {
            throw new Error('TerrainGenerator3D no inicializado');
        }
        
        // Configurar generador
        this.terrainGenerator.resolution = config.resolution;
        this.terrainGenerator.verticalScale = config.verticalScale;
        this.terrainGenerator.terrainSize = config.terrainSize;
        this.terrainGenerator.vegetationDensity = config.vegetationDensity;
        
        // Generar terreno usando bounds del mapa
        const terrain = await this.terrainGenerator.generateTerrain(
            this.currentBounds,
            {
                includeVegetation: true,
                includeRoads: true,
                includeBuildings: true,
                includeWater: true,
                mapZoom: this.currentZoom,
                useTIF: true,
                optimized: true
            }
        );
        
        console.log('✅ Terreno 3D generado:', terrain);
        return terrain;
    }
    
    /**
     * Configurar vista 3D
     */
    setup3DView(terrain) {
        console.log('🎮 Configurando vista 3D...');
        
        // Inicializar Three.js si no existe
        if (!window.scene || !window.camera || !window.renderer) {
            this.initThreeJS();
        }
        
        // Actualizar sistema 3D en el generador
        this.update3DSystem(window.scene, window.camera, window.renderer, window.controls);
        
        // Activar modo pantalla completa 3D
        this.enter3DMode();
        
        // Posicionar cámara óptimamente
        this.positionCamera(terrain);
        
        // Configurar controles 3D mínimos
        this.setup3DControls();
    }
    
    /**
     * Activar modo 3D
     */
    enter3DMode() {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.classList.add('fullscreen-3d');
        }
        
        // Mostrar canvas 3D
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.style.display = 'block';
        }
    }
    
    /**
     * Posicionar cámara según terreno
     */
    positionCamera(terrain) {
        if (!terrain || !window.camera) return;
        
        const box = new THREE.Box3().setFromObject(terrain);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Calcular altura óptima según zoom
        let cameraHeight;
        if (this.currentZoom >= 18) {
            cameraHeight = size.y * 0.8;
        } else if (this.currentZoom >= 16) {
            cameraHeight = size.y * 1.5;
        } else {
            cameraHeight = size.y * 2.5;
        }
        
        // Posicionar cámara
        window.camera.position.set(
            center.x + size.x * 0.7,
            cameraHeight,
            center.z + size.z * 0.7
        );
        
        window.camera.lookAt(center);
        
        if (window.controls) {
            window.controls.target.copy(center);
            window.controls.update();
        }
    }
    
    /**
     * Configurar controles 3D mínimos
     */
    setup3DControls() {
        // Crear barra de controles si no existe
        let controlsContainer = document.getElementById('terrain-3d-controls');
        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'terrain-3d-controls';
            controlsContainer.className = 'maira-3d-controls';
            controlsContainer.innerHTML = `
                <button id="lighting-control" title="Alternar iluminación">
                    <i class="fas fa-sun"></i> Luz
                </button>
                <button id="wireframe-control" title="Alternar wireframe">
                    <i class="fas fa-cube"></i> Mesh
                </button>
                <button id="exit-3d-control" title="Salir de vista 3D">
                    <i class="fas fa-times"></i> Salir
                </button>
            `;
            
            document.body.appendChild(controlsContainer);
            
            // Configurar eventos
            this.setupControlEvents(controlsContainer);
        }
    }
    
    /**
     * Configurar eventos de controles
     */
    setupControlEvents(container) {
        // Control de iluminación
        container.querySelector('#lighting-control')?.addEventListener('click', () => {
            this.toggleLighting();
        });
        
        // Control de wireframe
        container.querySelector('#wireframe-control')?.addEventListener('click', () => {
            this.toggleWireframe();
        });
        
        // Salir de vista 3D
        container.querySelector('#exit-3d-control')?.addEventListener('click', () => {
            this.exit3DMode();
        });
    }
    
    /**
     * Alternar iluminación
     */
    toggleLighting() {
        if (!window.scene) return;
        
        const lights = window.scene.children.filter(child => 
            child instanceof THREE.Light && !(child instanceof THREE.AmbientLight)
        );
        
        lights.forEach(light => {
            light.visible = !light.visible;
        });
        
        console.log('💡 Iluminación alternada');
    }
    
    /**
     * Alternar wireframe
     */
    toggleWireframe() {
        if (!window.scene) return;
        
        window.scene.traverse((child) => {
            if (child.material && child.material.wireframe !== undefined) {
                child.material.wireframe = !child.material.wireframe;
            }
        });
        
        console.log('🔲 Wireframe alternado');
    }
    
    /**
     * Salir del modo 3D
     */
    exit3DMode() {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.classList.remove('fullscreen-3d');
        }
        
        // Ocultar controles 3D
        const controls = document.getElementById('terrain-3d-controls');
        if (controls) {
            controls.remove();
        }
        
        console.log('🔙 Saliendo del modo 3D');
    }
    
    /**
     * Calcular LOD óptimo según resolución
     */
    calculateOptimalLOD(resolution) {
        if (resolution >= 80) return 4;
        if (resolution >= 60) return 6;
        if (resolution >= 40) return 8;
        return 10;
    }
    
    /**
     * Actualizar sistema 3D cuando la escena esté disponible
     */
    update3DSystem(scene, camera, renderer, controls) {
        if (this.terrainGenerator && this.terrainGenerator.maira3DSystem) {
            this.terrainGenerator.maira3DSystem.scene = scene;
            this.terrainGenerator.maira3DSystem.camera = camera;
            this.terrainGenerator.maira3DSystem.renderer = renderer;
            this.terrainGenerator.maira3DSystem.controls = controls;
            
            // Intentar inicializar VegetationInstancer ahora que tenemos escena
            this.terrainGenerator.initializeVegetationInstancer();
            
            console.log('✅ Sistema 3D actualizado en TerrainGenerator3D');
        }
    }
    
    /**
     * Inicializar Three.js si no existe
     */
    initThreeJS() {
        console.log('🎮 Inicializando Three.js...');
        
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.error('❌ Canvas container no encontrado');
            return;
        }
        
        // Escena
        window.scene = new THREE.Scene();
        window.scene.background = new THREE.Color(0x87CEEB);
        
        // Cámara
        window.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            50000
        );
        window.camera.position.set(800, 600, 800);
        window.camera.lookAt(0, 0, 0);
        
        // Renderer
        window.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        window.renderer.setSize(container.clientWidth, container.clientHeight);
        window.renderer.shadowMap.enabled = true;
        
        // Configuración de color para THREE.js r150+
        if (window.renderer.outputColorSpace) {
            window.renderer.outputColorSpace = THREE.SRGBColorSpace;
        }
        if (window.renderer.toneMapping) {
            window.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            window.renderer.toneMappingExposure = 1.0;
        }
        
        container.appendChild(window.renderer.domElement);
        
        // Iluminación
        const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
        window.scene.add(ambientLight);
        
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.6);
        hemisphereLight.position.set(0, 500, 0);
        window.scene.add(hemisphereLight);
        
        const sunLight = new THREE.DirectionalLight(0xffffee, 2.5);
        sunLight.position.set(1000, 1000, 500);
        sunLight.castShadow = true;
        window.scene.add(sunLight);
        
        // Controles
        if (window.THREE.OrbitControls) {
            window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
            window.controls.enableDamping = true;
            window.controls.dampingFactor = 0.05;
            window.controls.maxPolarAngle = Math.PI / 2;
        }
        
        // Loop de renderizado
        const animate = () => {
            requestAnimationFrame(animate);
            if (window.controls) window.controls.update();
            if (window.renderer && window.scene && window.camera) {
                window.renderer.render(window.scene, window.camera);
            }
        };
        animate();
        
        console.log('✅ Three.js inicializado');
    }
}

// Exportar
window.MAIRA3DTerrainIntegrator = MAIRA3DTerrainIntegrator;