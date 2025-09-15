/**
 * MAIRA 4.0 - Sistema 3D Modular
 * Sistema de visualización 3D mejorado y unificado
 * Soporta GLB, placeholders y manejo robusto de errores
 */

class Sistema3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.canvas = null;
        this.inicializado = false;
        this.modelosCargados = new Map();
        
                // Configuración de modelos disponibles
        this.modelosConfig = [
            { id: 'tam_tank', nombre: 'TAM Tank', archivo: 'tam_tank.glb', tipo: 'tanque' },
            { id: 'sk105', nombre: 'SK105', archivo: 'sk105.glb', tipo: 'tanque' },
            { id: 'm113_apc', nombre: 'M113 APC', archivo: 'm113_apc.glb', tipo: 'vehiculo' },
            { id: 'humvee', nombre: 'Humvee', archivo: 'humvee.glb', tipo: 'vehiculo' },
            { id: 'soldier_rifle', nombre: 'Soldado Rifle', archivo: 'soldier_rifle.glb', tipo: 'infanteria' },
            { id: 'soldier_antitank', nombre: 'Soldado AT', archivo: 'soldier_antitank.glb', tipo: 'infanteria' },
            { id: 'artillery_cannon', nombre: 'Artillería', archivo: 'artillery_cannon.glb', tipo: 'artilleria' },
            { id: 'soldier_new', nombre: 'Soldado Nuevo GLB', archivo: 'soldier.glb', tipo: 'infanteria' },
            { id: 'soldier_gltf', nombre: 'Soldado GLTF', archivo: 'scene.gltf', tipo: 'infanteria' }
        ];
    }

    /**
     * Inicializa el sistema 3D
     * @param {string} canvasId - ID del canvas donde renderizar
     * @param {Object} opciones - Opciones de configuración
     */
    async inicializar(canvasId, opciones = {}) {
        try {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas con ID "${canvasId}" no encontrado`);
            }

            // Verificar Three.js
            if (!window.THREE) {
                throw new Error('THREE.js no está disponible');
            }

            console.log('🚀 Inicializando Sistema 3D MAIRA...');

            // Crear escena
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(opciones.colorFondo || 0x001122);

            // Crear cámara
            const aspect = this.canvas.width / this.canvas.height;
            this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            this.camera.position.set(
                opciones.camara?.x || 10,
                opciones.camara?.y || 8,
                opciones.camara?.z || 10
            );

            // Crear renderer
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: this.canvas, 
                antialias: true,
                alpha: true
            });
            this.renderer.setSize(this.canvas.width, this.canvas.height);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Configurar iluminación mejorada
            this.configurarIluminacion(opciones.iluminacion);

            // Crear suelo/terreno
            this.crearTerreno(opciones.terreno);

            // Configurar controles
            if (window.THREE.OrbitControls) {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.maxDistance = 100;
                this.controls.minDistance = 2;
            }

            // Iniciar loop de renderizado
            this.iniciarRenderizado();

            this.inicializado = true;
            console.log('✅ Sistema 3D inicializado correctamente');
            
            return true;

        } catch (error) {
            console.error('❌ Error inicializando Sistema 3D:', error);
            throw error;
        }
    }

    /**
     * Configura la iluminación de la escena
     */
    configurarIluminacion(config = {}) {
        // Luz ambiental más brillante
        const ambientLight = new THREE.AmbientLight(
            config.ambiente?.color || 0x404040, 
            config.ambiente?.intensidad || 1.2
        );
        this.scene.add(ambientLight);

        // Luz direccional principal
        const directionalLight = new THREE.DirectionalLight(
            config.direccional?.color || 0xffffff, 
            config.direccional?.intensidad || 1.5
        );
        directionalLight.position.set(20, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        this.scene.add(directionalLight);

        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x6699ff, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);

        // Luz hemisférica para simular luz del cielo
        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x654321, 0.4);
        this.scene.add(hemiLight);
    }

    /**
     * Crea un terreno realista con elevaciones
     */
    crearTerreno() {
        // Crear geometría de terreno con subdivisiones para elevación
        const width = 500;
        const height = 500;
        const widthSegments = 128;
        const heightSegments = 128;
        
        const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
        
        // Aplicar elevaciones simuladas (ruido)
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 2];
            
            // Generar elevación basada en ruido
            const elevation = this.generarElevacion(x, z);
            vertices[i + 1] = elevation;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Material realista con textura base
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x4a7c59,
            wireframe: false,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0;
        plane.receiveShadow = true;
        plane.name = 'terreno';
        
        this.scene.add(plane);
        
        // Añadir grid de referencia
        this.crearGridReferencia();
    }
    
    /**
     * Genera elevación usando ruido simulado
     */
    generarElevacion(x, z) {
        const scale = 0.01;
        const amplitude = 20;
        
        // Ruido simplificado (sin bibliotecas externas)
        const noise1 = Math.sin(x * scale) * Math.cos(z * scale);
        const noise2 = Math.sin(x * scale * 2) * Math.cos(z * scale * 2) * 0.5;
        const noise3 = Math.sin(x * scale * 4) * Math.cos(z * scale * 4) * 0.25;
        
        return (noise1 + noise2 + noise3) * amplitude;
    }
    
    /**
     * Crea un grid de referencia para navegación
     */
    crearGridReferencia() {
        const size = 500;
        const divisions = 50;
        
        const gridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x666666);
        gridHelper.position.y = 0.1;
        gridHelper.name = 'grid';
        
        this.scene.add(gridHelper);
    }    /**
     * Inicia el loop de renderizado
     */
    iniciarRenderizado() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.controls) this.controls.update();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        animate();
    }

    /**
     * Carga un modelo GLB con manejo robusto de errores
     */
    async cargarModelo(modeloId, posicion = { x: 0, y: 0, z: 0 }) {
        return new Promise((resolve, reject) => {
            const modeloConfig = this.modelosConfig.find(m => m.id === modeloId);
            if (!modeloConfig) {
                reject(new Error(`Modelo ${modeloId} no encontrado en configuración`));
                return;
            }

            console.log(`🎯 Cargando modelo: ${modeloConfig.nombre}`);
            console.log(`📁 Archivo configurado: ${modeloConfig.archivo}`);

            // Crear loader personalizado para manejar GLB con buffers embebidos
            let loader;
            try {
                // Intentar crear GLTFLoader - diferentes versiones pueden tener constructores diferentes
                if (THREE.GLTFLoader) {
                    loader = new THREE.GLTFLoader();
                } else {
                    throw new Error('GLTFLoader no disponible');
                }
            } catch (error) {
                console.error('❌ Error creando GLTFLoader:', error);
                reject(new Error('GLTFLoader no disponible o incompatible'));
                return;
            }
            const rutaCompleta = `/Client/assets/models/${modeloConfig.archivo}`;
            
            console.log(`🔗 Ruta completa construida: ${rutaCompleta}`);
            console.log(`🌍 URL final que se intentará cargar: ${new URL(rutaCompleta, window.location.origin).href}`);

            // Cargar GLB como ArrayBuffer para manejar buffers embebidos
            fetch(rutaCompleta)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    console.log(`📥 GLB cargado como ArrayBuffer (${arrayBuffer.byteLength} bytes)`);
                    
                    // Usar GLTFLoader.parse para manejar ArrayBuffer directamente
                    loader.parse(
                        arrayBuffer,
                        '', // base path vacío ya que tenemos el buffer completo
                        (gltf) => {
                            try {
                                if (gltf.scene && gltf.scene.isObject3D) {
                                    // Configurar modelo
                                    const modelo = gltf.scene;
                                    modelo.position.set(posicion.x, posicion.y, posicion.z);
                                    modelo.castShadow = true;
                                    modelo.receiveShadow = true;
                                    modelo.name = `modelo_${modeloId}`;

                                    // Aplicar sombras a todos los meshes
                                    modelo.traverse((child) => {
                                        if (child.isMesh) {
                                            child.castShadow = true;
                                            child.receiveShadow = true;
                                        }
                                    });

                                    this.scene.add(modelo);
                                    this.modelosCargados.set(modeloId, modelo);

                                    console.log(`✅ Modelo ${modeloConfig.nombre} cargado exitosamente desde ArrayBuffer`);
                                    resolve(modelo);
                                } else {
                                    throw new Error('Scene inválida en GLB');
                                }
                            } catch (error) {
                                console.error(`❌ Error procesando modelo ${modeloConfig.nombre}:`, error);
                                this.crearPlaceholder(modeloId, posicion);
                                resolve(null);
                            }
                        },
                        (error) => {
                            console.error(`❌ Error parseando GLB ${modeloConfig.nombre}:`, error);
                            // Crear placeholder en caso de error
                            const placeholder = this.crearPlaceholder(modeloId, posicion);
                            resolve(placeholder);
                        }
                    );
                })
                .catch(error => {
                    console.error(`❌ Error cargando ${modeloConfig.nombre}:`, error);
                    // Crear placeholder en caso de error
                    const placeholder = this.crearPlaceholder(modeloId, posicion);
                    resolve(placeholder);
                }
            );
        });
    }

    /**
     * Crea un placeholder cuando falla la carga del modelo
     */
    crearPlaceholder(modeloId, posicion) {
        const modeloConfig = this.modelosConfig.find(m => m.id === modeloId);
        if (!modeloConfig) return null;

        console.log(`📦 Creando placeholder para ${modeloConfig.nombre}`);

        // Crear geometría según tipo
        let geometry;
        switch (modeloConfig.tipo) {
            case 'Tanque':
                geometry = new THREE.BoxGeometry(3, 1.5, 2);
                break;
            case 'Vehículo':
            case 'Transporte':
                geometry = new THREE.BoxGeometry(2.5, 1.2, 1.8);
                break;
            case 'Infantería':
                geometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
                break;
            case 'Artillería':
                geometry = new THREE.CylinderGeometry(0.2, 0.5, 2, 8);
                break;
            default:
                geometry = new THREE.BoxGeometry(2, 1, 2);
        }

        const material = new THREE.MeshPhongMaterial({ 
            color: modeloConfig.color,
            transparent: true,
            opacity: 0.8
        });

        const placeholder = new THREE.Mesh(geometry, material);
        placeholder.position.set(posicion.x, posicion.y + 0.75, posicion.z);
        placeholder.castShadow = true;
        placeholder.receiveShadow = true;
        placeholder.name = `placeholder_${modeloId}`;

        this.scene.add(placeholder);
        this.modelosCargados.set(modeloId, placeholder);

        return placeholder;
    }

    /**
     * Carga múltiples modelos en formación
     */
    async cargarFormacion(modelos) {
        const promesas = modelos.map(({ id, posicion }) => 
            this.cargarModelo(id, posicion).catch(error => {
                console.error(`Error cargando ${id}:`, error);
                return null;
            })
        );

        const resultados = await Promise.all(promesas);
        console.log(`✅ Formación cargada: ${resultados.filter(r => r !== null).length}/${modelos.length} modelos`);
        
        return resultados;
    }
    
    /**
     * Carga una formación táctica completa (estilo Total War)
     */
    async cargarFormacionTactica() {
        const formacionCompleta = [
            // Línea de tanques principales
            { id: 'tam_tank', posicion: { x: -20, y: 0, z: 10 } },
            { id: 'tam_tank', posicion: { x: -10, y: 0, z: 10 } },
            { id: 'tam_tank', posicion: { x: 0, y: 0, z: 10 } },
            { id: 'tam_tank', posicion: { x: 10, y: 0, z: 10 } },
            { id: 'tam_tank', posicion: { x: 20, y: 0, z: 10 } },
            
            // Apoyo de cañones autopropulsados
            { id: 'sk105', posicion: { x: -15, y: 0, z: 20 } },
            { id: 'sk105', posicion: { x: -5, y: 0, z: 20 } },
            { id: 'sk105', posicion: { x: 5, y: 0, z: 20 } },
            { id: 'sk105', posicion: { x: 15, y: 0, z: 20 } },
            
            // Transporte y apoyo
            { id: 'm113', posicion: { x: -25, y: 0, z: 0 } },
            { id: 'm113', posicion: { x: -15, y: 0, z: 0 } },
            { id: 'm113', posicion: { x: 15, y: 0, z: 0 } },
            { id: 'm113', posicion: { x: 25, y: 0, z: 0 } },
            
            // Vehículos de reconocimiento
            { id: 'humvee', posicion: { x: -30, y: 0, z: -10 } },
            { id: 'humvee', posicion: { x: -20, y: 0, z: -10 } },
            { id: 'humvee', posicion: { x: 20, y: 0, z: -10 } },
            { id: 'humvee', posicion: { x: 30, y: 0, z: -10 } },
            
            // Infantería dispersa
            { id: 'soldier_rifle', posicion: { x: -8, y: 0, z: -5 } },
            { id: 'soldier_rifle', posicion: { x: -3, y: 0, z: -5 } },
            { id: 'soldier_rifle', posicion: { x: 3, y: 0, z: -5 } },
            { id: 'soldier_rifle', posicion: { x: 8, y: 0, z: -5 } },
            { id: 'soldier_at', posicion: { x: -12, y: 0, z: -8 } },
            { id: 'soldier_at', posicion: { x: 12, y: 0, z: -8 } },
            
            // Artillería de retaguardia
            { id: 'artillery', posicion: { x: -10, y: 0, z: 40 } },
            { id: 'artillery', posicion: { x: 10, y: 0, z: 40 } }
        ];
        
        return await this.cargarFormacion(formacionCompleta);
    }
    
    /**
     * Configura navegación estilo Total War
     */
    configurarNavegacionTactica() {
        if (!this.controls) return;
        
        // Configurar controles para vista táctica
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        
        // Límites de cámara para vista táctica
        this.controls.minDistance = 10;
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI * 0.8; // No permitir vista desde debajo
        
        // Velocidades ajustadas para navegación táctica
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 1.0;
        this.controls.panSpeed = 0.8;
        
        console.log('🎮 Navegación táctica configurada (estilo Total War)');
    }

    /**
     * Enfoca la cámara en un modelo específico
     */
    enfocarModelo(modeloId) {
        const modelo = this.modelosCargados.get(modeloId);
        if (!modelo || !this.controls) return;

        const posicion = modelo.position.clone();
        this.camera.position.set(posicion.x + 5, posicion.y + 3, posicion.z + 5);
        this.controls.target.copy(posicion);
        this.controls.update();

        console.log(`🎯 Enfocando modelo: ${modeloId}`);
    }

    /**
     * Limpia todos los modelos de la escena
     */
    limpiarModelos() {
        this.modelosCargados.forEach((modelo, id) => {
            this.scene.remove(modelo);
        });
        this.modelosCargados.clear();
        console.log('🧹 Modelos limpiados');
    }
    
    /**
     * Limpia completamente la escena (modelos y terreno)
     */
    limpiarEscena() {
        if (!this.scene) return;
        
        // Remover todos los objetos de la escena
        while(this.scene.children.length > 0) {
            const objeto = this.scene.children[0];
            if (objeto.geometry) objeto.geometry.dispose();
            if (objeto.material) {
                if (Array.isArray(objeto.material)) {
                    objeto.material.forEach(material => material.dispose());
                } else {
                    objeto.material.dispose();
                }
            }
            this.scene.remove(objeto);
        }
        
        this.modelosCargados.clear();
        console.log('🧹 Escena completamente limpiada');
    }

    /**
     * Redimensiona el canvas y la cámara
     */
    redimensionar(width, height) {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Destruye el sistema 3D y libera recursos
     */
    destruir() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        this.limpiarModelos();
        this.inicializado = false;
        console.log('🗑️ Sistema 3D destruido');
    }

    /**
     * Obtiene información del estado actual
     */
    obtenerEstado() {
        return {
            inicializado: this.inicializado,
            modelosCargados: Array.from(this.modelosCargados.keys()),
            posicionCamera: this.camera ? this.camera.position.clone() : null,
            totalModelos: this.modelosCargados.size
        };
    }
    
    /**
     * Prueba las rutas de modelos disponibles
     */
    async probarRutasModelos() {
        console.log('🔍 Probando rutas de modelos GLB...');
        
        const rutasPrueba = [
            '/Client/assets/models/tam_tank.glb',
            'Client/assets/models/tam_tank.glb',
            '/assets/models/tam_tank.glb',
            'assets/models/tam_tank.glb'
        ];
        
        for (const ruta of rutasPrueba) {
            try {
                const response = await fetch(ruta, { method: 'HEAD' });
                console.log(`✅ Ruta válida: ${ruta} (${response.status})`);
                if (response.ok) {
                    console.log(`🎯 RUTA ENCONTRADA: ${ruta}`);
                    return ruta;
                }
            } catch (error) {
                console.log(`❌ Ruta inválida: ${ruta} (${error.message})`);
            }
        }
        
        console.log('⚠️ Ninguna ruta de modelo válida encontrada');
        return null;
    }
}

// Instancia global del sistema 3D
window.Sistema3D = Sistema3D;
window.sistema3D = null;

/**
 * Función de utilidad para inicializar el sistema 3D
 */
window.inicializarSistema3D = async function(canvasId, opciones = {}) {
    try {
        if (window.sistema3D) {
            window.sistema3D.destruir();
        }
        
        window.sistema3D = new Sistema3D();
        await window.sistema3D.inicializar(canvasId, opciones);
        
        return window.sistema3D;
    } catch (error) {
        console.error('❌ Error inicializando sistema 3D:', error);
        throw error;
    }
};

console.log('✅ Sistema 3D modular cargado v2.1 - Ruta GLB corregida a /Client/assets/models/');
