/**
 * MAIRA 4.0 - Sistema de Mapas 3D
 * ================================
 * Integración de Three.js para visualización 3D del terreno
 */

// NOTA: Three.js se carga desde node_modules en planeamiento.html:
// <script src="/node_modules/three/build/three.min.js"></script>
// OrbitControls se carga dinámicamente como módulo ES6

class ThreeDMapService {
    constructor(core = null) {
        this.core = core;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrainMesh = null;
        this.container = null;
        this.isInitialized = false;
        this.animationId = null;
        
        // Configuración desde core o valores por defecto
        this.config = core?.config?.THREEJS || {
            enabled: true,
            renderer: { antialias: true, alpha: true },
            camera: { fov: 60, near: 0.1, far: 10000 },
            terrain: { elevation_scale: 0.001, segments: 512 }
        };
    }

    async initialize(containerId) {
        if (this.isInitialized) {
            console.warn('ThreeD Map ya está inicializado');
            return;
        }

        try {
            // Verificar dependencias
            if (typeof THREE === 'undefined') {
                console.warn('⚠️ Three.js no está disponible. Cargue la librería primero.');
                return false;
            }

            this.container = document.getElementById(containerId);
            if (!this.container) {
                throw new Error(`Container ${containerId} no encontrado`);
            }

            await this.setupScene();
            await this.setupCamera();
            await this.setupRenderer();
            await this.setupControls();
            await this.setupLights();

            this.isInitialized = true;
            this.startRenderLoop();

            console.log('✅ Sistema 3D inicializado correctamente');
            // Solo emit si core está disponible
            if (this.core && typeof this.core.emit === 'function') {
                this.core.emit('threeDInitialized', { service: this });
            }

        } catch (error) {
            console.error('❌ Error inicializando sistema 3D:', error);
            throw error;
        }
    }

    async setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 10000);
    }

    async setupCamera() {
        const { fov, near, far } = this.config.camera;
        const aspect = this.container.clientWidth / this.container.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 1000, 1000);
        this.camera.lookAt(0, 0, 0);
    }

    async setupRenderer() {
        const { antialias, alpha } = this.config.renderer;
        
        this.renderer = new THREE.WebGLRenderer({ antialias, alpha });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Handle resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    async setupControls() {
        try {
            // Verificar que Three.js esté disponible
            if (typeof THREE === 'undefined') {
                console.warn('⚠️ Three.js no está disponible');
                return;
            }

            // Cargar OrbitControls con múltiples fallbacks
            const orbitControlsLoaded = await this.loadOrbitControls();
            
            if (window.THREE && window.THREE.OrbitControls) {
                try {
                    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                    this.controls.enableDamping = true;
                    this.controls.dampingFactor = 0.05;
                    this.controls.maxPolarAngle = Math.PI / 2;
                    this.controls.minDistance = 100;
                    this.controls.maxDistance = 5000;
                    
                    if (orbitControlsLoaded) {
                        console.log('✅ OrbitControls completamente funcional');
                    } else {
                        console.log('🔄 OrbitControls usando fallback funcional');
                    }
                } catch (controlsError) {
                    console.warn('⚠️ Error inicializando OrbitControls:', controlsError);
                    this.controls = null;
                }
            } else {
                console.warn('⚠️ OrbitControls no disponible - sistema 3D limitado');
                this.controls = null;
            }
        } catch (error) {
            console.warn('⚠️ Error cargando sistema 3D:', error);
            console.warn('⚠️ Continuando con funcionalidad limitada');
            this.controls = null;
        }
    }

    async loadOrbitControls() {
        try {
            // Verificar si ya existe OrbitControls
            if (window.OrbitControls && typeof window.OrbitControls === 'function') {
                console.log('✅ OrbitControls ya cargado, reutilizando');
                return window.OrbitControls;
            }
            
            // Método 1: Cargar nuestro OrbitControls personalizado de Libs
            try {
                await this.loadScriptDynamically('../../Libs/three-controls/OrbitControls.js');
                if (window.OrbitControls) {
                    console.log('✅ MAIRA OrbitControls personalizado cargado');
                    return window.OrbitControls;
                }
            } catch (libError) {
                console.warn('⚠️ No se pudo cargar MAIRA OrbitControls:', libError.message);
            }
            
            // Método 2: Intentar cargar como ES6 module (backup)
            try {
                const { OrbitControls } = await import('/node_modules/three/examples/jsm/controls/OrbitControls.js');
                console.log('✅ OrbitControls estándar cargado como ES6 module');
                return OrbitControls;
            } catch (importError) {
                console.warn('⚠️ No se pudo cargar OrbitControls estándar:', importError.message);
            }
            
            // Método 3: Fallback funcional
            console.log('🔧 Usando OrbitControls fallback funcional');
            return this.createOrbitControlsFallback();
            
        } catch (error) {
            console.warn('⚠️ Error en loadOrbitControls:', error);
            return this.createOrbitControlsFallback();
        }
    }

    /**
     * Cargar script dinámicamente
     */
    loadScriptDynamically(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Crear fallback funcional de OrbitControls
     */
    createOrbitControlsFallback() {
        if (!window.THREE) return;
        
        window.THREE.OrbitControls = function(camera, domElement) {
            this.object = camera;
            this.domElement = domElement || document;
            this.enabled = true;
            this.enableDamping = true;
            this.dampingFactor = 0.05;
            this.enableZoom = true;
            this.minDistance = 0;
            this.maxDistance = Infinity;
            this.minPolarAngle = 0;
            this.maxPolarAngle = Math.PI;
            
            let isMouseDown = false;
            let mouseX = 0, mouseY = 0;
            let phi = 0, theta = 0;
            let distance = 100;
            
            // Event listeners básicos
            this.domElement.addEventListener('mousedown', (e) => {
                if (!this.enabled) return;
                isMouseDown = true;
                mouseX = e.clientX;
                mouseY = e.clientY;
            });
            
            this.domElement.addEventListener('mousemove', (e) => {
                if (!this.enabled || !isMouseDown) return;
                
                const deltaX = e.clientX - mouseX;
                const deltaY = e.clientY - mouseY;
                
                theta += deltaX * 0.01;
                phi += deltaY * 0.01;
                phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
                
                this.updateCameraPosition();
                
                mouseX = e.clientX;
                mouseY = e.clientY;
            });
            
            this.domElement.addEventListener('mouseup', () => {
                isMouseDown = false;
            });
            
            this.domElement.addEventListener('wheel', (e) => {
                if (!this.enabled || !this.enableZoom) return;
                e.preventDefault();
                
                distance += e.deltaY * 0.1;
                distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
                this.updateCameraPosition();
            });
            
            this.updateCameraPosition = () => {
                const x = distance * Math.sin(phi) * Math.cos(theta);
                const y = distance * Math.cos(phi);
                const z = distance * Math.sin(phi) * Math.sin(theta);
                
                this.object.position.set(x, y, z);
                this.object.lookAt(0, 0, 0);
            };
            
            // Métodos públicos
            this.update = () => {
                if (this.enableDamping) {
                    // Aplicar damping muy básico
                }
            };
            
            this.dispose = () => {
                this.domElement.removeEventListener('mousedown', null);
                this.domElement.removeEventListener('mousemove', null);
                this.domElement.removeEventListener('mouseup', null);
                this.domElement.removeEventListener('wheel', null);
            };
            
            // Inicializar posición
            this.updateCameraPosition();
        };
        
        console.log('🔄 OrbitControls fallback funcional creado');
    }

    async setupLights() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Luz direccional (sol)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1000, 1000, 500);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 500;
        directionalLight.shadow.camera.far = 4000;
        directionalLight.shadow.camera.left = -2000;
        directionalLight.shadow.camera.right = 2000;
        directionalLight.shadow.camera.top = 2000;
        directionalLight.shadow.camera.bottom = -2000;
        
        this.scene.add(directionalLight);
    }

    async loadTerrain(elevationData, vegetationData, bounds) {
        try {
            console.log('🏔️ Generando terreno 3D...');

            // Crear geometría del terreno
            const geometry = await this.createTerrainGeometry(elevationData, bounds);
            
            // Crear material con textura de vegetación
            const material = await this.createTerrainMaterial(vegetationData);
            
            // Crear mesh del terreno
            if (this.terrainMesh) {
                this.scene.remove(this.terrainMesh);
                this.terrainMesh.geometry.dispose();
                this.terrainMesh.material.dispose();
            }

            this.terrainMesh = new THREE.Mesh(geometry, material);
            this.terrainMesh.receiveShadow = true;
            this.scene.add(this.terrainMesh);

            console.log('✅ Terreno 3D cargado');
            // Solo emit si core está disponible y tiene la función emit
            if (this.core && typeof this.core.emit === 'function') {
                this.core.emit('terrainLoaded', { mesh: this.terrainMesh });
            }

        } catch (error) {
            console.error('❌ Error cargando terreno 3D:', error);
            throw error;
        }
    }

    async createTerrainGeometry(elevationData, bounds) {
        const { segments, elevation_scale } = this.config.terrain;
        const geometry = new THREE.PlaneGeometry(
            bounds.width || 1000,
            bounds.height || 1000,
            segments,
            segments
        );

        // Aplicar datos de elevación
        const vertices = geometry.attributes.position;
        
        if (elevationData && elevationData.data) {
            const heightData = elevationData.data;
            const dataWidth = elevationData.width || Math.sqrt(heightData.length);
            
            for (let i = 0; i < vertices.count; i++) {
                const x = i % (segments + 1);
                const y = Math.floor(i / (segments + 1));
                
                // Mapear coordenadas de vértice a datos de elevación
                const dataX = Math.floor((x / segments) * dataWidth);
                const dataY = Math.floor((y / segments) * dataWidth);
                const dataIndex = dataY * dataWidth + dataX;
                
                if (dataIndex < heightData.length) {
                    const elevation = heightData[dataIndex] * elevation_scale;
                    vertices.setZ(i, elevation);
                }
            }
        }

        vertices.needsUpdate = true;
        geometry.computeVertexNormals();
        
        return geometry;
    }

    async createTerrainMaterial(vegetationData) {
        let texture = null;

        if (vegetationData && vegetationData.data) {
            // Crear textura desde datos NDVI
            texture = this.createVegetationTexture(vegetationData);
        } else {
            // Textura por defecto
            texture = new THREE.DataTexture(
                new Uint8Array([100, 150, 50, 255]), // Verde por defecto
                1, 1,
                THREE.RGBAFormat
            );
        }

        const material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        return material;
    }

    createVegetationTexture(vegetationData) {
        const { data, width, height } = vegetationData;
        const textureData = new Uint8Array(width * height * 4);

        for (let i = 0; i < data.length; i++) {
            const ndvi = data[i] / 255; // Normalizar NDVI
            const pixelIndex = i * 4;

            // Colorear según NDVI (verde más intenso = más vegetación)
            textureData[pixelIndex] = Math.floor(50 + ndvi * 100);     // R
            textureData[pixelIndex + 1] = Math.floor(100 + ndvi * 155); // G
            textureData[pixelIndex + 2] = Math.floor(50 + ndvi * 50);   // B
            textureData[pixelIndex + 3] = 255;                          // A
        }

        const texture = new THREE.DataTexture(
            textureData,
            width, height,
            THREE.RGBAFormat
        );
        
        texture.needsUpdate = true;
        return texture;
    }

    addUnit(position, type = 'tank') {
        const geometry = this.getUnitGeometry(type);
        const material = this.getUnitMaterial(type);
        
        const unit = new THREE.Mesh(geometry, material);
        unit.position.set(position.x, position.y + 10, position.z); // +10 para elevarlo sobre el terreno
        unit.castShadow = true;
        
        this.scene.add(unit);
        return unit;
    }

    getUnitGeometry(type) {
        switch (type) {
            case 'tank':
                return new THREE.BoxGeometry(20, 10, 30);
            case 'infantry':
                return new THREE.CylinderGeometry(3, 3, 10);
            case 'helicopter':
                return new THREE.ConeGeometry(8, 15);
            default:
                return new THREE.BoxGeometry(10, 10, 10);
        }
    }

    getUnitMaterial(type) {
        const colors = {
            tank: 0x2d5016,      // Verde militar
            infantry: 0x8B4513,   // Marrón
            helicopter: 0x696969  // Gris
        };
        
        return new THREE.MeshLambertMaterial({ 
            color: colors[type] || 0x808080 
        });
    }

    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            if (this.controls) {
                this.controls.update();
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    toggleWireframe() {
        if (this.terrainMesh) {
            this.terrainMesh.material.wireframe = !this.terrainMesh.material.wireframe;
        }
    }

    setCameraPosition(x, y, z) {
        if (this.camera) {
            this.camera.position.set(x, y, z);
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        if (this.renderer) {
            this.renderer.dispose();
            if (this.container && this.renderer.domElement) {
                this.container.removeChild(this.renderer.domElement);
            }
        }

        if (this.terrainMesh) {
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
        }

        window.removeEventListener('resize', this.onWindowResize.bind(this));

        this.isInitialized = false;
        console.log('🧹 Sistema 3D limpiado');
    }

    getStats() {
        return {
            initialized: this.isInitialized,
            triangles: this.renderer ? this.renderer.info.render.triangles : 0,
            calls: this.renderer ? this.renderer.info.render.calls : 0,
            memory: this.renderer ? this.renderer.info.memory : {}
        };
    }
}

// Instancia global del servicio 3D
let threeDMapInstance = null;
let is3DActive = false;

/**
 * Función global para alternar vista 3D
 */
function toggleVista3D() {
    console.log('🎮 Toggle Vista 3D solicitado');
    
    if (!window.THREE) {
        console.warn('⚠️ Three.js no está disponible. Cargando desde CDN...');
        loadThreeJS().then(() => {
            toggleVista3D();
        });
        return;
    }
    
    if (!is3DActive) {
        activarVista3D();
    } else {
        desactivarVista3D();
    }
}

/**
 * Activar vista 3D
 */
function activarVista3D() {
    try {
        console.log('🚀 Activando vista 3D...');
        
        // Crear contenedor 3D si no existe
        let container3D = document.getElementById('vista3d-container');
        if (!container3D) {
            container3D = document.createElement('div');
            container3D.id = 'vista3d-container';
            container3D.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 9999;
                display: flex;
                flex-direction: column;
            `;
            
            // Botón de cerrar
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕ Cerrar Vista 3D';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 10px 20px;
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                z-index: 10000;
            `;
            closeBtn.onclick = desactivarVista3D;
            container3D.appendChild(closeBtn);
            
            // Contenedor del canvas 3D
            const canvas3D = document.createElement('div');
            canvas3D.id = 'canvas3d';
            canvas3D.style.cssText = `
                flex: 1;
                width: 100%;
                height: 100%;
                background: #87CEEB;
                border: 2px solid #333;
                min-height: 400px;
            `;
            container3D.appendChild(canvas3D);
            
            document.body.appendChild(container3D);
        }
        
        // Inicializar servicio 3D
        if (!threeDMapInstance) {
            threeDMapInstance = new ThreeDMapService(); // Sin core para uso independiente
        }
        
        // Inicializar vista 3D
        threeDMapInstance.initialize('canvas3d').then(() => {
            console.log('✅ Vista 3D activada');
            
            // 🔍 DEBUG: Mostrar información del container
            const container = document.getElementById('canvas3d');
            console.log('🔍 DEBUG Container:', container);
            console.log('🔍 DEBUG Renderer size:', threeDMapInstance.renderer.getSize(new THREE.Vector2()));
            console.log('🔍 DEBUG Camera position:', threeDMapInstance.camera.position);
            
            is3DActive = true;
            
            // Generar terreno básico si no hay datos
            const basicElevationData = generateBasicTerrain();
            threeDMapInstance.loadTerrain(basicElevationData, null, {
                width: 1000,
                height: 1000
            });
            
            // 🔧 FORZAR RENDER INICIAL
            setTimeout(() => {
                console.log('🔧 Forzado render inicial');
                if (threeDMapInstance && threeDMapInstance.renderer && threeDMapInstance.scene && threeDMapInstance.camera) {
                    threeDMapInstance.renderer.render(threeDMapInstance.scene, threeDMapInstance.camera);
                } else {
                    console.warn('⚠️ No se puede hacer render: instancia incompleta');
                }
            }, 100);
            
        }).catch(error => {
            console.error('❌ Error activando vista 3D:', error);
            alert('Error al activar vista 3D. Verifique que Three.js esté cargado.');
        });
        
    } catch (error) {
        console.error('❌ Error en activarVista3D:', error);
    }
}

/**
 * Desactivar vista 3D
 */
function desactivarVista3D() {
    console.log('🔄 Desactivando vista 3D...');
    
    const container = document.getElementById('vista3d-container');
    if (container) {
        container.remove();
    }
    
    if (threeDMapInstance) {
        threeDMapInstance.destroy();
    }
    
    is3DActive = false;
    console.log('✅ Vista 3D desactivada');
}

/**
 * Generar datos básicos de terreno para prueba
 */
function generateBasicTerrain() {
    const size = 256;
    const data = new Float32Array(size * size);
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const x = (i / size) * 2 - 1;
            const y = (j / size) * 2 - 1;
            const distance = Math.sqrt(x * x + y * y);
            data[i * size + j] = Math.max(0, 100 * (1 - distance)) + Math.random() * 20;
        }
    }
    
    return {
        data: data,
        width: size,
        height: size
    };
}

/**
 * Cargar Three.js desde CDN
 */
function loadThreeJS() {
    return new Promise((resolve, reject) => {
        // Three.js ya se carga desde node_modules en planeamiento.html
        if (window.THREE) {
            console.log('✅ Three.js ya está disponible desde node_modules');
            resolve();
            return;
        }
        
        // Si por alguna razón Three.js no está disponible, esperar un poco y reintentar
        console.log('⏳ Esperando que Three.js se cargue desde node_modules...');
        setTimeout(() => {
            if (window.THREE) {
                console.log('✅ Three.js ahora está disponible');
                resolve();
            } else {
                console.error('❌ Three.js no se pudo cargar desde node_modules');
                reject(new Error('Three.js no disponible'));
            }
        }, 1000);
    });
}

// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.ThreeDMapService = ThreeDMapService;
    window.toggleVista3D = toggleVista3D;
    window.activarVista3D = activarVista3D;
    window.desactivarVista3D = desactivarVista3D;
    
    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.ThreeDMap = ThreeDMapService;
    
    console.log('✅ ThreeDMapService registrado en MAIRA.Services.ThreeDMap');
    console.log('✅ Función toggleVista3D disponible globalmente');
}

// export default ThreeDMapService; // Comentado para evitar error de export
