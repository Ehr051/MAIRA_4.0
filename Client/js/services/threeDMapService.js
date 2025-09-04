/**
 * MAIRA 4.0 - Sistema de Mapas 3D
 * ================================
 * Integración de Three.js para visualización 3D del terreno
 * Convertido a formato compatible con bootstrap DDD
 */

// NOTA: Para usar Three.js, debe estar cargado previamente
// <script src="https://cdn.skypack.dev/three@0.144.0"></script>
// <script src="https://cdn.skypack.dev/three@0.144.0/examples/jsm/controls/OrbitControls.js"></script>

class ThreeDMapService {
    constructor(core) {
        this.core = core;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrainMesh = null;
        this.container = null;
        this.isInitialized = false;
        this.animationId = null;
        
        // Configuración desde core
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
            this.core.emit('threeDInitialized', { service: this });

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
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 5000;
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
            this.core.emit('terrainLoaded', { mesh: this.terrainMesh });

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

// Exportar para sistema MAIRA
if (typeof window !== 'undefined') {
    window.ThreeDMapService = ThreeDMapService;
    
    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.ThreeDMap = ThreeDMapService;
    
    console.log('✅ ThreeDMapService registrado en MAIRA.Services.ThreeDMap');
}

export default ThreeDMapService;
