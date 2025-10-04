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

            // Cargar OrbitControls con script tag dinámico
            await this.loadOrbitControls();
            
            if (window.THREE && window.THREE.OrbitControls) {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxPolarAngle = Math.PI / 2;
                this.controls.minDistance = 100;
                this.controls.maxDistance = 5000;
                
                console.log('✅ OrbitControls cargado desde node_modules');
            } else {
                console.warn('⚠️ OrbitControls no disponible después de cargar');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando OrbitControls:', error);
            console.warn('⚠️ Continuando sin controles avanzados');
        }
    }

    async loadOrbitControls() {
        try {
            // OrbitControls ahora se carga directamente en HTML
            // Verificar disponibilidad global
            if (window.THREE && window.THREE.OrbitControls) {
                console.log('✅ OrbitControls disponible desde HTML');
                return;
            }
            
            // Verificar si three-orbitcontrols está disponible globalmente
            if (typeof OrbitControls !== 'undefined') {
                window.THREE.OrbitControls = OrbitControls;
                console.log('✅ OrbitControls configurado desde three-orbitcontrols');
                return;
            }
            
            // Fallback si no está disponible
            console.warn('⚠️ OrbitControls no disponible, creando fallback básico');
            this.createOrbitControlsFallback();
            
        } catch (error) {
            console.warn('⚠️ Error en loadOrbitControls:', error);
            this.createOrbitControlsFallback();
        }
    }

    /**
     * Crear fallback básico de OrbitControls
     */
    createOrbitControlsFallback() {
        if (!window.THREE) return;
        
        window.THREE.OrbitControls = function(camera, domElement) {
            this.object = camera;
            this.domElement = domElement;
            this.enabled = true;
            this.enableDamping = true;
            this.dampingFactor = 0.05;
            this.enableZoom = true;
            this.minDistance = 0;
            this.maxDistance = Infinity;
            this.minPolarAngle = 0;
            this.maxPolarAngle = Math.PI;
            
            // Métodos básicos
            this.update = function() { /* mock */ };
            this.dispose = function() { /* mock */ };
        };
        
        console.log('🔄 OrbitControls fallback creado');
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

    /**
     * Agregar unidad militar desde datos SIDC
     * @param {Object} elementData - Datos del elemento (lat, lng, sidc, etc.)
     */
    addMilitaryUnit(elementData) {
        try {
            const { lat, lng, sidc, designacion, afiliacion } = elementData;

            // Convertir coordenadas lat/lng a posición en el terreno 3D
            const position = this.convertLatLngTo3D(lat, lng);

            // Determinar tipo de unidad desde SIDC
            const unitType = this.getUnitTypeFromSIDC(sidc);

            // Crear geometría y material según el tipo
            const geometry = this.getUnitGeometry(unitType);
            const material = this.getUnitMaterial(unitType, afiliacion);

            const unit = new THREE.Mesh(geometry, material);
            unit.position.set(position.x, position.y + 10, position.z);
            unit.castShadow = true;

            // Agregar metadata
            unit.userData = {
                sidc: sidc,
                designacion: designacion,
                afiliacion: afiliacion,
                tipo: unitType,
                originalElement: elementData
            };

            // Agregar texto con designación si existe
            if (designacion) {
                this.addUnitLabel(unit, designacion);
            }

            this.scene.add(unit);
            console.log(`✅ Unidad militar agregada: ${designacion || unitType} en 3D`);
            return unit;
        } catch (error) {
            console.error('❌ Error agregando unidad militar:', error);
            return null;
        }
    }

    /**
     * Convertir coordenadas lat/lng a posición 3D
     */
    convertLatLngTo3D(lat, lng) {
        // Esta es una conversión básica - se puede mejorar según el sistema de coordenadas
        const x = lng * 1000; // Escalado básico
        const z = -lat * 1000; // Invertir Y para Three.js
        const y = 0; // Altura base, se puede calcular desde terreno

        return { x, y, z };
    }

    /**
     * Determinar tipo de unidad desde código SIDC
     */
    getUnitTypeFromSIDC(sidc) {
        if (!sidc || sidc.length < 10) return 'unknown';

        const symbolSet = sidc.substring(4, 6);
        const entity = sidc.substring(8, 10);

        // Mapeo básico de códigos SIDC a tipos 3D
        if (symbolSet === '10') { // Land units
            switch(entity) {
                case '11': return 'infantry';
                case '12': return 'tank';
                case '13': return 'artillery';
                case '05': return 'helicopter';
                default: return 'infantry';
            }
        }

        return 'unknown';
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

    getUnitMaterial(type, afiliacion = 'F') {
        // Colores base por tipo
        const baseColors = {
            tank: 0x2d5016,      // Verde militar
            infantry: 0x8B4513,   // Marrón
            helicopter: 0x696969, // Gris
            artillery: 0x4a4a4a,  // Gris oscuro
            unknown: 0x808080     // Gris neutro
        };

        // Modificar color según afiliación NATO
        let color = baseColors[type] || baseColors.unknown;

        switch(afiliacion) {
            case 'F': // Friend (Azul)
                color = this.modifyColorForAffiliation(color, 'blue');
                break;
            case 'H': // Hostile (Rojo)
            case 'J': // Hostile/Enemy
                color = this.modifyColorForAffiliation(color, 'red');
                break;
            case 'N': // Neutral (Verde)
                color = this.modifyColorForAffiliation(color, 'green');
                break;
            case 'U': // Unknown (Amarillo)
            case '-': // Unknown
                color = this.modifyColorForAffiliation(color, 'yellow');
                break;
        }

        return new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
    }

    /**
     * Modificar color base según afiliación
     */
    modifyColorForAffiliation(baseColor, affiliation) {
        switch(affiliation) {
            case 'blue':
                return 0x0066cc; // Azul NATO
            case 'red':
                return 0xcc0000; // Rojo NATO
            case 'green':
                return 0x00cc66; // Verde NATO
            case 'yellow':
                return 0xcccc00; // Amarillo NATO
            default:
                return baseColor;
        }
    }

    /**
     * Agregar etiqueta de texto a una unidad
     */
    addUnitLabel(unit, text) {
        try {
            // Crear canvas para el texto
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Configurar canvas
            canvas.width = 256;
            canvas.height = 64;

            // Configurar texto
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.fillStyle = 'white';
            context.font = 'bold 24px Arial';
            context.textAlign = 'center';
            context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);

            // Crear textura desde canvas
            const texture = new THREE.CanvasTexture(canvas);

            // Crear sprite para el texto
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);

            // Posicionar encima de la unidad
            sprite.position.copy(unit.position);
            sprite.position.y += 30;
            sprite.scale.set(50, 12.5, 1);

            // Agregar al grupo de la unidad
            if (!unit.userData.labelGroup) {
                unit.userData.labelGroup = new THREE.Group();
                this.scene.add(unit.userData.labelGroup);
            }

            unit.userData.labelGroup.add(sprite);
            unit.userData.label = sprite;

        } catch (error) {
            console.warn('⚠️ Error creando etiqueta:', error);
        }
    }

    /**
     * Limpiar todas las unidades militares de la escena
     */
    clearMilitaryUnits() {
        if (!this.scene) return;

        const unitsToRemove = [];

        this.scene.traverse(child => {
            if (child.userData && child.userData.tipo) {
                // Es una unidad militar
                unitsToRemove.push(child);
            }
            if (child.userData && child.userData.labelGroup) {
                // Es un grupo de etiquetas
                unitsToRemove.push(child.userData.labelGroup);
            }
        });

        unitsToRemove.forEach(unit => {
            this.scene.remove(unit);
            if (unit.geometry) unit.geometry.dispose();
            if (unit.material) unit.material.dispose();
        });

        console.log(`🧹 ${unitsToRemove.length} unidades militares removidas de la escena 3D`);
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

    /**
     * Renderizar un frame manualmente
     */
    render() {
        if (!this.renderer || !this.scene || !this.camera) {
            console.warn('Sistema 3D no inicializado completamente para renderizar');
            return;
        }
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
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
 * Sincronizar elementos del mapa 2D con la vista 3D
 */
function sincronizarElementosMapa() {
    if (!threeDMapInstance || !threeDMapInstance.isInitialized) {
        console.warn('⚠️ Sistema 3D no inicializado para sincronización');
        return;
    }

    try {
        // Limpiar unidades existentes
        threeDMapInstance.clearMilitaryUnits();

        // Obtener elementos del mapa 2D
        const elementos = obtenerElementosDelMapa();

        let unidadesAgregadas = 0;

        elementos.forEach(elemento => {
            if (elemento.lat && elemento.lng) {
                const unidad3D = threeDMapInstance.addMilitaryUnit({
                    lat: elemento.lat,
                    lng: elemento.lng,
                    sidc: elemento.sidc || elemento.SIDC,
                    designacion: elemento.designacion || elemento.nombre,
                    afiliacion: elemento.afiliacion || 'F'
                });

                if (unidad3D) {
                    unidadesAgregadas++;
                }
            }
        });

        console.log(`✅ Sincronización 3D completada: ${unidadesAgregadas} unidades agregadas`);

    } catch (error) {
        console.error('❌ Error sincronizando elementos:', error);
    }
}

/**
 * Obtener elementos del mapa 2D (adaptable según el sistema)
 */
function obtenerElementosDelMapa() {
    const elementos = [];

    try {
        // Método 1: Buscar en window.elementos (sistema común)
        if (window.elementos && Array.isArray(window.elementos)) {
            elementos.push(...window.elementos);
        }

        // Método 2: Buscar en capas de Leaflet
        if (window.mapa && window.mapa.eachLayer) {
            window.mapa.eachLayer(layer => {
                if (layer.elemento && layer.elemento.lat && layer.elemento.lng) {
                    elementos.push(layer.elemento);
                } else if (layer.getLatLng && layer.options && layer.options.sidc) {
                    const latlng = layer.getLatLng();
                    elementos.push({
                        lat: latlng.lat,
                        lng: latlng.lng,
                        sidc: layer.options.sidc,
                        designacion: layer.options.designacion,
                        afiliacion: layer.options.afiliacion
                    });
                }
            });
        }

        // Método 3: Buscar en arrays específicos del sistema
        ['equipos', 'unidades', 'marcadores'].forEach(arrayName => {
            if (window[arrayName] && Array.isArray(window[arrayName])) {
                elementos.push(...window[arrayName]);
            }
        });

        console.log(`🔍 Elementos encontrados para 3D: ${elementos.length}`);
        return elementos;

    } catch (error) {
        console.error('❌ Error obteniendo elementos del mapa:', error);
        return [];
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
        threeDMapInstance.initialize('canvas3d').then(async () => {
            console.log('✅ Vista 3D activada');
            
            // 🔍 DEBUG: Mostrar información del container
            const container = document.getElementById('canvas3d');
            console.log('🔍 DEBUG Container:', container);
            console.log('🔍 DEBUG Renderer size:', threeDMapInstance.renderer.getSize(new THREE.Vector2()));
            console.log('🔍 DEBUG Camera position:', threeDMapInstance.camera.position);
            
            is3DActive = true;

            // Generar terreno usando datos reales de elevación
            try {
                console.log('🗻 Generando terreno con datos reales de elevación...');
                const realElevationData = await generateRealTerrain();

                if (realElevationData && realElevationData.data) {
                    console.log('✅ Terreno real cargado exitosamente');
                    threeDMapInstance.loadTerrain(realElevationData.data, null, {
                        width: realElevationData.width,
                        height: realElevationData.height
                    });
                } else {
                    console.warn('⚠️ No se pudieron cargar datos reales, usando terreno plano');
                    const dummyElevationData = new Float32Array(256 * 256).fill(0);
                    threeDMapInstance.loadTerrain(dummyElevationData, null, {
                        width: 256,
                        height: 256
                    });
                }
            } catch (error) {
                console.error('❌ Error cargando terreno real:', error);
                console.log('🔄 Fallback a terreno plano');
                const dummyElevationData = new Float32Array(256 * 256).fill(0);
                threeDMapInstance.loadTerrain(dummyElevationData, null, {
                    width: 256,
                    height: 256
                });
            }
            
            // 🔧 FORZAR RENDER INICIAL
            setTimeout(() => {
                console.log('🔧 Forzado render inicial');
                threeDMapInstance.render();

                // ✅ SINCRONIZAR SÍMBOLOS MILITARES AUTOMÁTICAMENTE
                console.log('🎖️ Sincronizando símbolos militares del mapa...');
                sincronizarElementosMapa();
            }, 500);
            
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
 * Generar datos reales de terreno usando ElevationHandlerRender
 */
async function generateRealTerrain() {
    const size = 256;
    const data = new Float32Array(size * size);

    try {
        // Obtener bounds del mapa actual
        const mapBounds = window.map ? window.map.getBounds() : null;
        let bounds;

        if (mapBounds) {
            bounds = {
                north: mapBounds.getNorth(),
                south: mapBounds.getSouth(),
                east: mapBounds.getEast(),
                west: mapBounds.getWest()
            };
        } else {
            // Buenos Aires por defecto
            bounds = {
                north: -34.5,
                south: -34.7,
                east: -58.3,
                west: -58.5
            };
        }

        console.log('🗻 Generando terreno real para bounds:', bounds);

        // Verificar si tenemos el handler de elevación
        if (!window.getElevation && !window.elevationHandler) {
            console.warn('⚠️ Handler de elevación no disponible, usando terreno sintético');
            return generateBasicTerrain();
        }

        const elevationHandler = window.ElevationHandler || window.elevationHandler || { getElevation: window.getElevation };
        const latStep = (bounds.north - bounds.south) / size;
        const lonStep = (bounds.east - bounds.west) / size;

        // Generar grid de elevaciones reales
        const promises = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const lat = bounds.south + (i * latStep);
                const lon = bounds.west + (j * lonStep);
                promises.push(elevationHandler.getElevation(lat, lon));
            }
        }

        // Resolver todas las elevaciones
        const elevations = await Promise.all(promises);

        // Llenar el array de datos
        for (let i = 0; i < size * size; i++) {
            data[i] = elevations[i] || 0;
        }

        console.log('✅ Terreno real generado con datos de elevación');
        console.log(`📊 Elevación min: ${Math.min(...data)}m, max: ${Math.max(...data)}m`);

        return {
            data: data,
            width: size,
            height: size
        };

    } catch (error) {
        console.error('❌ Error generando terreno real:', error);
        console.log('🔄 Fallback a terreno sintético');
        return generateBasicTerrain();
    }
}

/**
 * Generar datos básicos de terreno para prueba (fallback)
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

    // ✅ NUEVAS FUNCIONES DE INTEGRACIÓN DE SÍMBOLOS
    window.sincronizarElementosMapa = sincronizarElementosMapa;
    window.obtenerElementosDelMapa = obtenerElementosDelMapa;

    // Integración con namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    if (!window.MAIRA.Services) window.MAIRA.Services = {};
    window.MAIRA.Services.ThreeDMap = ThreeDMapService;

    console.log('✅ ThreeDMapService registrado en MAIRA.Services.ThreeDMap');
    console.log('✅ Función toggleVista3D disponible globalmente');
    console.log('✅ Funciones de sincronización de símbolos disponibles globalmente');
}

// export default ThreeDMapService; // Comentado para evitar error de export
