/**
 * MAIRA 4.0 - Sistema 3D Unificado
 * ================================
 * Integración completa de Three.js para visualización 3D
 * Combina funcionalidades de planeamiento, juego de guerra y modelos 3D
 */

class MAIRA3DSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrain = null;
        this.militaryUnits = new Map();
        this.models = new Map();
        this.isInitialized = false;
        this.isActive = false;
        this.container = null;

        // Configuración
        this.config = {
            terrain: {
                elevationScale: 0.001,
                segments: 256,
                size: 1000
            },
            camera: {
                fov: 60,
                near: 0.1,
                far: 10000,
                position: { x: 100, y: 50, z: 100 }
            },
            lighting: {
                ambient: { color: 0x404040, intensity: 0.6 },
                directional: { color: 0xffffff, intensity: 1.0, position: { x: 100, y: 100, z: 50 } }
            }
        };

        // Modelos disponibles
        this.availableModels = {
            'tank': '/backup_gltf_models/gltf_new/tam2c_3d_model/scene.gltf',
            'humvee': '/backup_gltf_models/gltf_new/humvee/scene.gltf',
            'soldier': '/backup_gltf_models/gltf_new/soldier/scene.gltf',
            'm113': '/backup_gltf_models/gltf_new/m113/scene.gltf',
            'ural': '/backup_gltf_models/gltf_new/ural_4320/scene.gltf',
            'tent': '/backup_gltf_models/gltf_new/tent_military/scene.gltf',
            'medical_tent': '/backup_gltf_models/gltf_new/medical_tent/scene.gltf'
        };
    }

    /**
     * Inicializar el sistema 3D
     */
    async initialize(containerId) {
        try {
            console.log('🚀 Inicializando MAIRA 3D System...');

            // Verificar Three.js
            if (typeof THREE === 'undefined') {
                await this.loadThreeJS();
            }

            // Obtener contenedor
            this.container = document.getElementById(containerId);
            if (!this.container) {
                throw new Error(`Contenedor ${containerId} no encontrado`);
            }

            // Crear escena
            await this.createScene();

            // Configurar iluminación
            this.setupLighting();

            // Crear terreno base
            await this.createTerrain();

            // Configurar controles
            this.setupControls();

            // Configurar eventos
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ MAIRA 3D System inicializado correctamente');

            return true;

        } catch (error) {
            console.error('❌ Error inicializando MAIRA 3D System:', error);
            return false;
        }
    }

    /**
     * Cargar Three.js dinámicamente
     */
    async loadThreeJS() {
        return new Promise((resolve, reject) => {
            if (window.THREE) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/node_modules/three/build/three.min.js';
            script.onload = () => {
                console.log('✅ Three.js cargado');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Error cargando Three.js');
                reject(new Error('Failed to load Three.js'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Crear escena 3D
     */
    async createScene() {
        // Escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);

        // Cámara
        this.camera = new THREE.PerspectiveCamera(
            this.config.camera.fov,
            this.container.clientWidth / this.container.clientHeight,
            this.config.camera.near,
            this.config.camera.far
        );
        this.camera.position.set(
            this.config.camera.position.x,
            this.config.camera.position.y,
            this.config.camera.position.z
        );

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Agregar canvas al contenedor
        this.container.appendChild(this.renderer.domElement);

        // Iniciar render loop
        this.startRenderLoop();
    }

    /**
     * Configurar iluminación
     */
    setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(
            this.config.lighting.ambient.color,
            this.config.lighting.ambient.intensity
        );
        this.scene.add(ambientLight);

        // Luz direccional
        const directionalLight = new THREE.DirectionalLight(
            this.config.lighting.directional.color,
            this.config.lighting.directional.intensity
        );
        directionalLight.position.set(
            this.config.lighting.directional.position.x,
            this.config.lighting.directional.position.y,
            this.config.lighting.directional.position.z
        );
        directionalLight.castShadow = true;

        // Configurar sombras
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -500;
        directionalLight.shadow.camera.right = 500;
        directionalLight.shadow.camera.top = 500;
        directionalLight.shadow.camera.bottom = -500;

        this.scene.add(directionalLight);
    }

    /**
     * Crear terreno base
     */
    async createTerrain() {
        const geometry = new THREE.PlaneGeometry(
            this.config.terrain.size,
            this.config.terrain.size,
            this.config.terrain.segments,
            this.config.terrain.segments
        );

        // Crear elevación procedural simple
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            vertices[i + 1] = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            color: 0x4a7c59,
            transparent: true,
            opacity: 0.8
        });

        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;

        this.scene.add(this.terrain);
    }

    /**
     * Configurar controles de cámara
     */
    setupControls() {
        // Cargar OrbitControls dinámicamente
        this.loadOrbitControls().then(() => {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 1000;
        });
    }

    /**
     * Cargar OrbitControls
     */
    async loadOrbitControls() {
        return new Promise((resolve) => {
            if (window.THREE.OrbitControls) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/node_modules/three/examples/js/controls/OrbitControls.js';
            script.onload = resolve;
            script.onerror = resolve; // Continuar aunque falle
            document.head.appendChild(script);
        });
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => {
            if (!this.camera || !this.renderer) return;

            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });

        // Click para selección
        this.renderer.domElement.addEventListener('click', (event) => {
            this.handleClick(event);
        });
    }

    /**
     * Iniciar loop de renderizado
     */
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            if (this.controls) {
                this.controls.update();
            }

            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    /**
     * Manejar clicks en la escena
     */
    handleClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, this.camera);

        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.selectObject(clickedObject);
        }
    }

    /**
     * Seleccionar objeto
     */
    selectObject(object) {
        // Remover selección anterior
        this.scene.children.forEach(child => {
            if (child.userData.isSelected) {
                child.material.emissive.setHex(0x000000);
                child.userData.isSelected = false;
            }
        });

        // Seleccionar nuevo objeto
        if (object && object.userData.selectable) {
            object.material.emissive.setHex(0x444444);
            object.userData.isSelected = true;
            console.log('📋 Objeto seleccionado:', object.userData);
        }
    }

    /**
     * Agregar unidad militar
     */
    async addMilitaryUnit(options) {
        const { lat, lng, sidc, designacion, afiliacion } = options;

        try {
            // Convertir coordenadas a posición 3D
            const position = this.latLngToPosition(lat, lng);

            // Crear modelo 3D
            const unitMesh = await this.createUnitMesh(sidc, afiliacion);

            unitMesh.position.copy(position);
            unitMesh.userData = {
                type: 'military_unit',
                sidc,
                designacion,
                afiliacion,
                lat,
                lng,
                selectable: true
            };

            this.scene.add(unitMesh);
            this.militaryUnits.set(designacion, unitMesh);

            return unitMesh;

        } catch (error) {
            console.error('❌ Error agregando unidad militar:', error);
            return null;
        }
    }

    /**
     * Crear mesh para unidad militar
     */
    async createUnitMesh(sidc, afiliacion) {
        // Determinar tipo de unidad basado en SIDC
        const unitType = this.getUnitTypeFromSIDC(sidc);

        // Intentar cargar modelo 3D real
        try {
            const model = await this.loadModel(unitType, { x: 0, y: 0, z: 0 });
            if (model) {
                // Aplicar color según afiliación
                model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.color = new THREE.Color(afiliacion === 'F' ? 0x0000ff : 0xff0000);
                            });
                        } else {
                            child.material.color = new THREE.Color(afiliacion === 'F' ? 0x0000ff : 0xff0000);
                        }
                    }
                });
                return model;
            }
        } catch (error) {
            console.warn(`⚠️ Error cargando modelo 3D ${unitType}, usando geometría básica:`, error);
        }

        // Fallback: Geometría básica
        const geometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        const material = new THREE.MeshLambertMaterial({
            color: afiliacion === 'F' ? 0x0000ff : 0xff0000
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    /**
     * Determinar tipo de unidad desde SIDC
     */
    getUnitTypeFromSIDC(sidc) {
        if (!sidc) return 'soldier';

        // Lógica básica para mapear SIDC a tipos de modelo
        const sidcStr = sidc.toString();

        if (sidcStr.includes('T') || sidcStr.includes('tank')) return 'tank';
        if (sidcStr.includes('W') || sidcStr.includes('armored')) return 'm113';
        if (sidcStr.includes('M') || sidcStr.includes('motorized')) return 'humvee';
        if (sidcStr.includes('U') || sidcStr.includes('truck')) return 'ural';

        return 'soldier'; // Default
    }

    /**
     * Convertir lat/lng a posición 3D
     */
    latLngToPosition(lat, lng) {
        // Conversión simple (ajustar según el sistema de coordenadas del mapa)
        const x = (lng - this.centerLng || 0) * 111320 * Math.cos(lat * Math.PI / 180);
        const z = (lat - this.centerLat || 0) * 111320;

        return new THREE.Vector3(x, 0, z);
    }

    /**
     * Cargar modelo GLTF
     */
    async loadModel(modelName, position = { x: 0, y: 0, z: 0 }) {
        const modelPath = this.availableModels[modelName];
        if (!modelPath) {
            console.warn(`⚠️ Modelo ${modelName} no encontrado`);
            return null;
        }

        try {
            // Cargar GLTF Loader dinámicamente
            await this.loadGLTFLoader();

            const loader = new THREE.GLTFLoader();
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    modelPath,
                    resolve,
                    undefined,
                    reject
                );
            });

            const model = gltf.scene;
            model.position.set(position.x, position.y, position.z);
            model.userData = {
                type: 'model',
                name: modelName,
                selectable: true
            };

            // Configurar sombras
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(model);
            this.models.set(modelName, model);

            return model;

        } catch (error) {
            console.error(`❌ Error cargando modelo ${modelName}:`, error);
            return null;
        }
    }

    /**
     * Cargar GLTF Loader
     */
    async loadGLTFLoader() {
        return new Promise((resolve) => {
            if (window.THREE.GLTFLoader) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/node_modules/three/examples/js/loaders/GLTFLoader.js';
            script.onload = resolve;
            script.onerror = resolve;
            document.head.appendChild(script);
        });
    }

    /**
     * Activar vista 3D
     */
    activate() {
        if (!this.isInitialized) {
            console.warn('⚠️ Sistema 3D no inicializado');
            return false;
        }

        if (this.container) {
            this.container.style.display = 'block';
        }

        this.isActive = true;
        console.log('🎮 Vista 3D activada');
        return true;
    }

    /**
     * Desactivar vista 3D
     */
    deactivate() {
        if (this.container) {
            this.container.style.display = 'none';
        }

        this.isActive = false;
        console.log('🎮 Vista 3D desactivada');
    }

    /**
     * Limpiar escena
     */
    clear() {
        // Limpiar unidades militares
        this.militaryUnits.forEach(unit => {
            this.scene.remove(unit);
        });
        this.militaryUnits.clear();

        // Limpiar modelos
        this.models.forEach(model => {
            this.scene.remove(model);
        });
        this.models.clear();
    }

    /**
     * Sincronizar con mapa 2D
     */
    syncWithMap2D(elements) {
        this.clear();

        elements.forEach(element => {
            if (element.lat && element.lng) {
                this.addMilitaryUnit({
                    lat: element.lat,
                    lng: element.lng,
                    sidc: element.sidc || element.SIDC,
                    designacion: element.designacion || element.nombre,
                    afiliacion: element.afiliacion || 'F'
                });
            }
        });
    }
}

// Exportar para uso global
window.MAIRA3DSystem = MAIRA3DSystem;

// Función global para compatibilidad
window.toggleVista3D = function() {
    if (!window.maira3DSystem) {
        // Inicializar sistema 3D
        const container = document.getElementById('vista3d-container') ||
                         document.createElement('div');
        container.id = 'vista3d-container';
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

        if (!document.body.contains(container)) {
            document.body.appendChild(container);
        }

        window.maira3DSystem = new MAIRA3DSystem();
        window.maira3DSystem.initialize('vista3d-container').then(() => {
            window.maira3DSystem.activate();
        });
    } else {
        if (window.maira3DSystem.isActive) {
            window.maira3DSystem.deactivate();
        } else {
            window.maira3DSystem.activate();
        }
    }
};

console.log('🎯 MAIRA 3D System cargado');