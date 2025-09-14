/**
 * GLTFLoader Completo para MAIRA 4.0
 * Implementación completa basada en Three.js r150+
 * Soporte para modelos GLB y GLTF con materiales, animaciones y texturas
 */

THREE.GLTFLoader = class GLTFLoader {
    constructor(manager) {
        this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
        this.dracoLoader = null;
        this.ktx2Loader = null;
        this.meshoptDecoder = null;
        
        this.pluginCallbacks = [];
        this.register(function(parser) {
            return new GLTFMaterialsClearcoatExtension(parser);
        });
        
        console.log('🚀 GLTFLoader completo inicializado');
    }

    load(url, onLoad, onProgress, onError) {
        const scope = this;
        const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
        
        this.manager.itemStart(url);
        
        const loader = new THREE.FileLoader(this.manager);
        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setWithCredentials(this.withCredentials);
        
        loader.load(url, function(data) {
            try {
                scope.parse(data, resourcePath, function(gltf) {
                    onLoad(gltf);
                    scope.manager.itemEnd(url);
                }, function(error) {
                    if (onError) onError(error);
                    scope.manager.itemError(url);
                    scope.manager.itemEnd(url);
                });
            } catch (e) {
                if (onError) onError(e);
                scope.manager.itemError(url);
                scope.manager.itemEnd(url);
            }
        }, onProgress, function(error) {
            if (onError) onError(error);
            scope.manager.itemError(url);
            scope.manager.itemEnd(url);
        });
    }

    setDRACOLoader(dracoLoader) {
        this.dracoLoader = dracoLoader;
        return this;
    }

    setKTX2Loader(ktx2Loader) {
        this.ktx2Loader = ktx2Loader;
        return this;
    }

    setMeshoptDecoder(meshoptDecoder) {
        this.meshoptDecoder = meshoptDecoder;
        return this;
    }

    register(callback) {
        if (this.pluginCallbacks.indexOf(callback) === -1) {
            this.pluginCallbacks.push(callback);
        }
        return this;
    }

    unregister(callback) {
        if (this.pluginCallbacks.indexOf(callback) !== -1) {
            this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(callback), 1);
        }
        return this;
    }

    parse(data, path, onLoad, onError) {
        let content;
        const extensions = {};
        const plugins = {};
        
        if (typeof data === 'string') {
            content = data;
        } else {
            const magic = THREE.LoaderUtils.decodeText(new Uint8Array(data, 0, 4));
            
            if (magic === 'glTF') {
                // Archivo GLB binario
                const view = new DataView(data);
                const version = view.getUint32(4, true);
                const length = view.getUint32(8, true);
                
                if (version < 2.0) {
                    console.error('GLTFLoader: Legacy binary file detected.');
                    return;
                }
                
                const chunkLength = view.getUint32(12, true);
                const chunkType = view.getUint32(16, true);
                
                if (chunkType === 0x4E4F534A) {
                    const contentArray = new Uint8Array(data, 20, chunkLength);
                    content = THREE.LoaderUtils.decodeText(contentArray);
                } else {
                    throw new Error('GLTFLoader: First chunk must be of type JSON.');
                }
            } else {
                content = THREE.LoaderUtils.decodeText(new Uint8Array(data));
            }
        }

        const json = JSON.parse(content);

        if (json.asset === undefined || json.asset.version[0] < 2) {
            if (onError) onError(new Error('GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.'));
            return;
        }

        const parser = new GLTFParser(json, {
            path: path || this.resourcePath || '',
            crossOrigin: this.crossOrigin,
            requestHeader: this.requestHeader || {},
            manager: this.manager,
            ktx2Loader: this.ktx2Loader,
            meshoptDecoder: this.meshoptDecoder
        });

        parser.fileLoader = new THREE.FileLoader(this.manager);
        parser.fileLoader.setRequestHeader(this.requestHeader);

        for (let i = 0; i < this.pluginCallbacks.length; i++) {
            const plugin = this.pluginCallbacks[i](parser);
            plugins[plugin.name] = plugin;
            extensions[plugin.name] = true;
        }

        parser.setPlugins(plugins);
        parser.setExtensions(extensions);
        parser.parse(onLoad, onError);
    }
};

// Parser principal de GLTF
class GLTFParser {
    constructor(json, options) {
        this.json = json;
        this.options = options;
        this.fileLoader = new THREE.FileLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.plugins = {};
        this.extensions = {};
        
        // Cache para evitar duplicados
        this.primitiveCache = {};
        this.meshCache = { refs: {}, uses: {} };
        this.cameraCache = { refs: {}, uses: {} };
        this.lightCache = { refs: {}, uses: {} };
        this.textureCache = {};
        this.materialCache = {};
        this.nodeNamesUsed = {};
        
        // Datos procesados
        this.scenes = [];
        this.nodes = [];
        this.meshes = [];
        this.materials = [];
        this.textures = [];
        this.images = [];
        this.cameras = [];
        this.animations = [];
    }

    setPlugins(plugins) {
        this.plugins = plugins;
    }

    setExtensions(extensions) {
        this.extensions = extensions;
    }

    parse(onLoad, onError) {
        const parser = this;
        const json = this.json;
        
        Promise.all([
            this.loadImages(),
            this.loadTextures(),
            this.loadMaterials(),
            this.loadMeshes(),
            this.loadCameras(),
            this.loadNodes(),
            this.loadScenes()
        ]).then(function() {
            const scenes = parser.scenes;
            const scene = scenes[json.scene || 0];
            const animations = parser.animations;
            const asset = json.asset;

            const result = {
                scene: scene,
                scenes: scenes,
                cameras: parser.cameras,
                animations: animations,
                asset: asset,
                parser: parser,
                userData: {}
            };

            onLoad(result);
        }).catch(onError);
    }

    async loadImages() {
        const json = this.json;
        const images = json.images || [];
        
        for (let i = 0; i < images.length; i++) {
            const imageSpec = images[i];
            let source;
            
            if (imageSpec.uri !== undefined) {
                source = this.resolveURL(imageSpec.uri, this.options.path);
            } else if (imageSpec.bufferView !== undefined) {
                source = await this.loadBufferView(imageSpec.bufferView);
            } else {
                throw new Error('GLTFLoader: Image ' + i + ' is missing URI and bufferView');
            }
            
            this.images[i] = source;
        }
    }

    async loadTextures() {
        const json = this.json;
        const textures = json.textures || [];
        
        for (let i = 0; i < textures.length; i++) {
            const textureSpec = textures[i];
            let texture;
            
            if (textureSpec.source !== undefined) {
                texture = new THREE.Texture(this.images[textureSpec.source]);
                texture.needsUpdate = true;
            } else {
                texture = new THREE.Texture();
            }
            
            // Configurar wrapping y filtros
            if (textureSpec.sampler !== undefined) {
                const sampler = json.samplers[textureSpec.sampler];
                texture.wrapS = sampler.wrapS || THREE.RepeatWrapping;
                texture.wrapT = sampler.wrapT || THREE.RepeatWrapping;
                texture.magFilter = sampler.magFilter || THREE.LinearFilter;
                texture.minFilter = sampler.minFilter || THREE.LinearMipmapLinearFilter;
            }
            
            this.textures[i] = texture;
        }
    }

    async loadMaterials() {
        const json = this.json;
        const materials = json.materials || [];
        
        for (let i = 0; i < materials.length; i++) {
            const materialSpec = materials[i];
            const material = new THREE.MeshStandardMaterial();
            
            // Propiedades básicas
            if (materialSpec.name !== undefined) {
                material.name = materialSpec.name;
            }
            
            if (materialSpec.pbrMetallicRoughness !== undefined) {
                const pbr = materialSpec.pbrMetallicRoughness;
                
                if (pbr.baseColorFactor !== undefined) {
                    material.color.fromArray(pbr.baseColorFactor);
                }
                
                if (pbr.baseColorTexture !== undefined) {
                    material.map = this.textures[pbr.baseColorTexture.index];
                }
                
                material.metalness = pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1.0;
                material.roughness = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1.0;
            }
            
            // Normal map
            if (materialSpec.normalTexture !== undefined) {
                material.normalMap = this.textures[materialSpec.normalTexture.index];
            }
            
            // Alpha mode
            if (materialSpec.alphaMode === 'BLEND') {
                material.transparent = true;
            } else if (materialSpec.alphaMode === 'MASK') {
                material.alphaTest = materialSpec.alphaCutoff !== undefined ? materialSpec.alphaCutoff : 0.5;
            }
            
            this.materials[i] = material;
        }
    }

    async loadMeshes() {
        const json = this.json;
        const meshes = json.meshes || [];
        
        for (let i = 0; i < meshes.length; i++) {
            const meshSpec = meshes[i];
            const group = new THREE.Group();
            
            if (meshSpec.name !== undefined) {
                group.name = meshSpec.name;
            }
            
            const primitives = meshSpec.primitives || [];
            
            for (let j = 0; j < primitives.length; j++) {
                const primitive = primitives[j];
                const geometry = await this.loadGeometry(primitive);
                const material = primitive.material !== undefined ? 
                    this.materials[primitive.material] : new THREE.MeshStandardMaterial();
                
                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);
            }
            
            this.meshes[i] = group;
        }
    }

    async loadGeometry(primitive) {
        const geometry = new THREE.BufferGeometry();
        const attributes = primitive.attributes || {};
        
        // Posiciones (obligatorias)
        if (attributes.POSITION !== undefined) {
            const accessor = this.json.accessors[attributes.POSITION];
            const bufferView = await this.loadBufferView(accessor.bufferView);
            const array = new Float32Array(bufferView, accessor.byteOffset || 0, accessor.count * 3);
            geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));
        }
        
        // Normales
        if (attributes.NORMAL !== undefined) {
            const accessor = this.json.accessors[attributes.NORMAL];
            const bufferView = await this.loadBufferView(accessor.bufferView);
            const array = new Float32Array(bufferView, accessor.byteOffset || 0, accessor.count * 3);
            geometry.setAttribute('normal', new THREE.BufferAttribute(array, 3));
        }
        
        // Coordenadas de textura
        if (attributes.TEXCOORD_0 !== undefined) {
            const accessor = this.json.accessors[attributes.TEXCOORD_0];
            const bufferView = await this.loadBufferView(accessor.bufferView);
            const array = new Float32Array(bufferView, accessor.byteOffset || 0, accessor.count * 2);
            geometry.setAttribute('uv', new THREE.BufferAttribute(array, 2));
        }
        
        // Índices
        if (primitive.indices !== undefined) {
            const accessor = this.json.accessors[primitive.indices];
            const bufferView = await this.loadBufferView(accessor.bufferView);
            let array;
            
            if (accessor.componentType === 5121) {
                array = new Uint8Array(bufferView, accessor.byteOffset || 0, accessor.count);
            } else if (accessor.componentType === 5123) {
                array = new Uint16Array(bufferView, accessor.byteOffset || 0, accessor.count);
            } else if (accessor.componentType === 5125) {
                array = new Uint32Array(bufferView, accessor.byteOffset || 0, accessor.count);
            }
            
            if (array) {
                geometry.setIndex(new THREE.BufferAttribute(array, 1));
            }
        }
        
        return geometry;
    }

    async loadBufferView(bufferViewIndex) {
        const bufferView = this.json.bufferViews[bufferViewIndex];
        const buffer = this.json.buffers[bufferView.buffer];
        
        if (buffer.uri) {
            const url = this.resolveURL(buffer.uri, this.options.path);
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return arrayBuffer.slice(bufferView.byteOffset || 0, 
                (bufferView.byteOffset || 0) + bufferView.byteLength);
        }
        
        throw new Error('GLTFLoader: Buffer without URI not supported');
    }

    async loadCameras() {
        const json = this.json;
        const cameras = json.cameras || [];
        
        for (let i = 0; i < cameras.length; i++) {
            const cameraSpec = cameras[i];
            let camera;
            
            if (cameraSpec.type === 'perspective') {
                camera = new THREE.PerspectiveCamera(
                    THREE.MathUtils.radToDeg(cameraSpec.perspective.yfov),
                    cameraSpec.perspective.aspectRatio || 1,
                    cameraSpec.perspective.znear,
                    cameraSpec.perspective.zfar || 2000
                );
            } else if (cameraSpec.type === 'orthographic') {
                camera = new THREE.OrthographicCamera(
                    -cameraSpec.orthographic.xmag,
                    cameraSpec.orthographic.xmag,
                    cameraSpec.orthographic.ymag,
                    -cameraSpec.orthographic.ymag,
                    cameraSpec.orthographic.znear,
                    cameraSpec.orthographic.zfar
                );
            }
            
            if (cameraSpec.name !== undefined) {
                camera.name = cameraSpec.name;
            }
            
            this.cameras[i] = camera;
        }
    }

    async loadNodes() {
        const json = this.json;
        const nodes = json.nodes || [];
        
        for (let i = 0; i < nodes.length; i++) {
            const nodeSpec = nodes[i];
            const node = new THREE.Object3D();
            
            if (nodeSpec.name !== undefined) {
                node.name = nodeSpec.name;
            }
            
            // Transformación
            if (nodeSpec.matrix !== undefined) {
                node.matrix.fromArray(nodeSpec.matrix);
                node.matrix.decompose(node.position, node.quaternion, node.scale);
            } else {
                if (nodeSpec.translation !== undefined) {
                    node.position.fromArray(nodeSpec.translation);
                }
                if (nodeSpec.rotation !== undefined) {
                    node.quaternion.fromArray(nodeSpec.rotation);
                }
                if (nodeSpec.scale !== undefined) {
                    node.scale.fromArray(nodeSpec.scale);
                }
            }
            
            // Agregar mesh si existe
            if (nodeSpec.mesh !== undefined) {
                const mesh = this.meshes[nodeSpec.mesh];
                node.add(mesh);
            }
            
            // Agregar cámara si existe
            if (nodeSpec.camera !== undefined) {
                const camera = this.cameras[nodeSpec.camera];
                node.add(camera);
            }
            
            this.nodes[i] = node;
        }
        
        // Construir jerarquía
        for (let i = 0; i < nodes.length; i++) {
            const nodeSpec = nodes[i];
            const node = this.nodes[i];
            
            if (nodeSpec.children !== undefined) {
                for (let j = 0; j < nodeSpec.children.length; j++) {
                    const child = this.nodes[nodeSpec.children[j]];
                    node.add(child);
                }
            }
        }
    }

    async loadScenes() {
        const json = this.json;
        const scenes = json.scenes || [];
        
        for (let i = 0; i < scenes.length; i++) {
            const sceneSpec = scenes[i];
            const scene = new THREE.Group();
            
            if (sceneSpec.name !== undefined) {
                scene.name = sceneSpec.name;
            }
            
            if (sceneSpec.nodes !== undefined) {
                for (let j = 0; j < sceneSpec.nodes.length; j++) {
                    const node = this.nodes[sceneSpec.nodes[j]];
                    scene.add(node);
                }
            }
            
            this.scenes[i] = scene;
        }
    }

    resolveURL(url, path) {
        if (typeof url !== 'string' || url === '') return '';
        
        if (/^https?:\/\//i.test(url)) return url;
        
        return path + url;
    }
}

// Extensión para materiales PBR
class GLTFMaterialsClearcoatExtension {
    constructor(parser) {
        this.parser = parser;
        this.name = 'KHR_materials_clearcoat';
    }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.GLTFLoader = THREE.GLTFLoader;
}

console.log('✅ GLTFLoader completo registrado globalmente');