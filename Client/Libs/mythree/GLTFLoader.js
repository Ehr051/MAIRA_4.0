/**
 * GLTFLoader con soporte completo para archivos binarios GLB
 * Compatible con archivos locales y buffers embebidos
 * Versión corregida con validación robusta
 */

(function() {
    'use strict';
    
    if (typeof THREE === 'undefined') {
        console.error('THREE.js debe cargarse antes que GLTFLoader');
        return;
    }

    THREE.GLTFLoader = function(manager) {
        this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
        this.dracoLoader = null;
        this.ktx2Loader = null;
        this.meshoptDecoder = null;
        this.path = '';
        this.resourcePath = '';
        this.requestHeader = {};
        this.withCredentials = false;
        this.crossOrigin = 'anonymous';
        
        this.pluginCallbacks = [];
        
        console.log('GLTFLoader con soporte binario y validación robusta inicializado');
    };

    THREE.GLTFLoader.prototype = {
        constructor: THREE.GLTFLoader,

        setPath: function(path) {
            this.path = path;
            return this;
        },

        setResourcePath: function(resourcePath) {
            this.resourcePath = resourcePath;
            return this;
        },

        load: function(url, onLoad, onProgress, onError) {
            var scope = this;
            var resourcePath = this.resourcePath || this.extractUrlBase(url);
            
            this.manager.itemStart(url);
            
            var loader = new THREE.FileLoader(this.manager);
            loader.setPath(this.path);
            loader.setResponseType('arraybuffer');
            loader.setRequestHeader(this.requestHeader);
            loader.setWithCredentials(this.withCredentials);
            
            loader.load(url, function(data) {
                try {
                    scope.parse(data, resourcePath, function(gltf) {
                        if (gltf && gltf.scene && gltf.scene.isObject3D) {
                            console.log('GLTF cargado exitosamente');
                            onLoad(gltf);
                        } else {
                            console.error('GLTF cargado pero escena inválida:', gltf);
                            if (onError) onError(new Error('GLTF scene is not valid Object3D'));
                        }
                        scope.manager.itemEnd(url);
                    }, function(error) {
                        console.error('Error en parse GLTF:', error);
                        if (onError) onError(error);
                        scope.manager.itemError(url);
                        scope.manager.itemEnd(url);
                    });
                } catch (e) {
                    console.error('Error crítico en load GLTF:', e);
                    if (onError) onError(e);
                    scope.manager.itemError(url);
                    scope.manager.itemEnd(url);
                }
            }, onProgress, function(error) {
                console.error('Error en FileLoader:', error);
                if (onError) onError(error);
                scope.manager.itemError(url);
                scope.manager.itemEnd(url);
            });
        },

        parse: function(data, path, onLoad, onError) {
            var content;
            var extensions = {};
            var plugins = {};
            
            try {
                if (typeof data === 'string') {
                    content = data;
                } else {
                    var magic = this.decodeText(new Uint8Array(data, 0, 4));
                    
                    if (magic === 'glTF') {
                        // Archivo GLB binario
                        var view = new DataView(data);
                        var version = view.getUint32(4, true);
                        
                        if (version < 2.0) {
                            throw new Error('GLTFLoader: Legacy binary file detected.');
                        }
                        
                        var chunkLength = view.getUint32(12, true);
                        var chunkType = view.getUint32(16, true);
                        
                        if (chunkType === 0x4E4F534A) {
                            var contentArray = new Uint8Array(data, 20, chunkLength);
                            content = this.decodeText(contentArray);
                        } else {
                            throw new Error('GLTFLoader: First chunk must be of type JSON.');
                        }
                    } else {
                        content = this.decodeText(new Uint8Array(data));
                    }
                }

                var json = JSON.parse(content);

                if (!json.asset || json.asset.version[0] < 2) {
                    throw new Error('GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.');
                }

                var parser = new GLTFParser(json, {
                    path: path || this.resourcePath || '',
                    crossOrigin: this.crossOrigin,
                    requestHeader: this.requestHeader || {},
                    manager: this.manager,
                    ktx2Loader: this.ktx2Loader,
                    meshoptDecoder: this.meshoptDecoder,
                    binaryData: data
                });

                parser.fileLoader = new THREE.FileLoader(this.manager);
                parser.fileLoader.setRequestHeader(this.requestHeader);

                parser.parse(onLoad, onError);
                
            } catch (error) {
                console.error('Error en parse inicial:', error);
                if (onError) onError(error);
            }
        },

        decodeText: function(array) {
            if (typeof TextDecoder !== 'undefined') {
                return new TextDecoder().decode(array);
            }
            
            var s = '';
            for (var i = 0, il = array.length; i < il; i++) {
                s += String.fromCharCode(array[i]);
            }
            
            try {
                return decodeURIComponent(escape(s));
            } catch (e) {
                return s;
            }
        },
        
        extractUrlBase: function(url) {
            var index = url.lastIndexOf('/');
            if (index === -1) return './';
            return url.slice(0, index + 1);
        }
    };

    // Parser mejorado con validación robusta
    function GLTFParser(json, options) {
        this.json = json;
        this.options = options;
        this.fileLoader = new THREE.FileLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.plugins = {};
        this.extensions = {};
        
        // Almacenar datos binarios
        this.binaryData = options.binaryData;
        this.binaryChunks = [];
        
        // Procesar chunks binarios si existen
        if (this.binaryData && this.binaryData instanceof ArrayBuffer) {
            this.parseBinaryChunks();
        }
        
        this.scenes = [];
        this.nodes = [];
        this.meshes = [];
        this.materials = [];
        this.textures = [];
        this.images = [];
        this.cameras = [];
        this.animations = [];
        
        console.log('GLTFParser con validación robusta inicializado');
    }

    GLTFParser.prototype = {
        constructor: GLTFParser,

        // Parsear chunks binarios de archivos GLB
        parseBinaryChunks: function() {
            if (!this.binaryData) return;
            
            var view = new DataView(this.binaryData);
            var magic = new Uint8Array(this.binaryData, 0, 4);
            var magicString = String.fromCharCode.apply(null, magic);
            
            if (magicString !== 'glTF') return;
            
            var length = view.getUint32(8, true);
            var offset = 20; // Después del header y primer chunk JSON
            
            // Leer el primer chunk JSON
            var jsonChunkLength = view.getUint32(12, true);
            offset += jsonChunkLength;
            
            // Buscar chunks binarios adicionales
            while (offset < length) {
                var chunkLength = view.getUint32(offset, true);
                var chunkType = view.getUint32(offset + 4, true);
                
                if (chunkType === 0x004E4942) { // 'BIN\0'
                    var chunkData = this.binaryData.slice(offset + 8, offset + 8 + chunkLength);
                    this.binaryChunks.push(chunkData);
                }
                
                offset += 8 + chunkLength;
            }
            
            console.log('Chunks binarios encontrados:', this.binaryChunks.length);
        },

        // Función para validar estructura GLTF antes de procesar
        validateGLTFStructure: function() {
            var json = this.json;
            var issues = [];
            
            // Verificar que existan las secciones básicas
            if (!json.accessors) issues.push('Missing accessors array');
            if (!json.bufferViews) issues.push('Missing bufferViews array');
            if (!json.buffers) issues.push('Missing buffers array');
            
            // Verificar meshes
            if (json.meshes) {
                for (var i = 0; i < json.meshes.length; i++) {
                    var mesh = json.meshes[i];
                    if (!mesh.primitives || mesh.primitives.length === 0) {
                        issues.push('Mesh ' + i + ' has no primitives');
                        continue;
                    }
                    
                    for (var j = 0; j < mesh.primitives.length; j++) {
                        var primitive = mesh.primitives[j];
                        if (!primitive.attributes) {
                            issues.push('Mesh ' + i + ' primitive ' + j + ' has no attributes');
                            continue;
                        }
                        
                        if (primitive.attributes.POSITION === undefined) {
                            issues.push('Mesh ' + i + ' primitive ' + j + ' missing POSITION attribute');
                        }
                        
                        // Verificar que los accessors existen
                        for (var attr in primitive.attributes) {
                            var accessorIndex = primitive.attributes[attr];
                            if (!json.accessors[accessorIndex]) {
                                issues.push('Mesh ' + i + ' primitive ' + j + ' attribute ' + attr + ' references missing accessor ' + accessorIndex);
                            }
                        }
                    }
                }
            }
            
            if (issues.length > 0) {
                console.warn('GLTF Structure Issues:', issues);
                return false;
            }
            
            console.log('GLTF structure validation passed');
            return true;
        },

        parse: function(onLoad, onError) {
            var parser = this;
            var json = this.json;
            
            console.log('Iniciando análisis GLTF con validación robusta...');
            
            if (typeof THREE === 'undefined') {
                onError(new Error('THREE.js not available'));
                return;
            }
            
            var requiredClasses = ['Object3D', 'Group', 'Mesh', 'BufferGeometry', 'MeshStandardMaterial'];
            for (var i = 0; i < requiredClasses.length; i++) {
                var className = requiredClasses[i];
                if (!THREE[className]) {
                    onError(new Error('THREE.' + className + ' not available'));
                    return;
                }
            }
            
            Promise.resolve()
                .then(function() { return parser.loadTextures(); })
                .then(function() { return parser.loadMaterials(); })
                .then(function() { return parser.loadMeshes(); })
                .then(function() { return parser.loadNodes(); })
                .then(function() { return parser.loadScenes(); })
                .then(function() {
                    console.log('Componentes GLTF cargados exitosamente');
                    
                    var scenes = parser.scenes;
                    var scene = scenes[json.scene || 0];
                    var animations = parser.animations;
                    var asset = json.asset;

                    if (!scene || !scene.isObject3D) {
                        throw new Error('La escena principal no es un Object3D válido');
                    }

                    var result = {
                        scene: scene,
                        scenes: scenes,
                        cameras: parser.cameras,
                        animations: animations,
                        asset: asset,
                        parser: parser,
                        userData: {}
                    };

                    onLoad(result);
                })
                .catch(function(error) {
                    console.error('Error en carga GLTF:', error);
                    onError(error);
                });
        },

        loadMaterials: function() {
            var json = this.json;
            var materials = json.materials || [];
            var parser = this;
            
            console.log('Procesando ' + materials.length + ' materiales');
            console.log('Materiales JSON:', materials);
            
            return new Promise(function(resolve) {
                if (materials.length === 0) {
                    parser.materials[0] = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        name: 'DefaultMaterial'
                    });
                    resolve();
                    return;
                }
                
                for (var i = 0; i < materials.length; i++) {
                    try {
                        var materialSpec = materials[i];
                        console.log('Procesando material ' + i + ':', materialSpec);
                        
                        var material = new THREE.MeshStandardMaterial();
                        material.name = materialSpec.name || ('Material_' + i);
                        
                        if (materialSpec.pbrMetallicRoughness) {
                            var pbr = materialSpec.pbrMetallicRoughness;
                            console.log('PBR para material ' + i + ':', pbr);
                            console.log('Texturas disponibles en parser:', parser.textures);
                            
                            if (pbr.baseColorFactor) {
                                material.color.fromArray(pbr.baseColorFactor);
                                if (pbr.baseColorFactor[3] < 1.0) {
                                    material.opacity = pbr.baseColorFactor[3];
                                    material.transparent = true;
                                }
                            }
                            
                            // Asignar textura base color
                            if (pbr.baseColorTexture !== undefined) {
                                console.log('Material ' + i + ' tiene baseColorTexture:', pbr.baseColorTexture);
                                console.log('Textura disponible en parser.textures[' + pbr.baseColorTexture.index + ']:', parser.textures[pbr.baseColorTexture.index]);
                                if (parser.textures[pbr.baseColorTexture.index]) {
                                    material.map = parser.textures[pbr.baseColorTexture.index];
                                    material.needsUpdate = true;
                                    console.log('Textura baseColor asignada al material ' + i);
                                } else {
                                    console.warn('Textura baseColor no encontrada para material ' + i);
                                }
                            }
                            
                            material.metalness = pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1.0;
                            material.roughness = pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 1.0;
                            
                            // Asignar texturas metallic/roughness si existen
                            if (pbr.metallicRoughnessTexture !== undefined && parser.textures[pbr.metallicRoughnessTexture.index]) {
                                material.metalnessMap = parser.textures[pbr.metallicRoughnessTexture.index];
                                material.roughnessMap = parser.textures[pbr.metallicRoughnessTexture.index];
                                material.needsUpdate = true;
                            }
                        }
                        
                        if (materialSpec.alphaMode === 'BLEND') {
                            material.transparent = true;
                        } else if (materialSpec.alphaMode === 'MASK') {
                            material.alphaTest = materialSpec.alphaCutoff !== undefined ? materialSpec.alphaCutoff : 0.5;
                        }
                        
                        if (materialSpec.doubleSided === true) {
                            material.side = THREE.DoubleSide;
                        }
                        
                        parser.materials[i] = material;
                        console.log('Material ' + i + ' creado: ' + material.name);
                    } catch (error) {
                        console.error('Error creando material ' + i + ':', error);
                        parser.materials[i] = new THREE.MeshStandardMaterial({
                            color: 0xff00ff,
                            name: 'ErrorMaterial_' + i
                        });
                    }
                }
                
                resolve();
            });
        },

        loadTextures: function() {
            var json = this.json;
            var textures = json.textures || [];
            var images = json.images || [];
            var parser = this;
            
            console.log('JSON textures:', textures);
            console.log('JSON images:', images);
            
            return new Promise(function(resolve, reject) {
                if (textures.length === 0) {
                    console.log('No hay texturas para cargar');
                    resolve();
                    return;
                }
                if (textures.length === 0) {
                    console.log('No hay texturas para cargar');
                    resolve();
                    return;
                }
                
                console.log('Cargando ' + textures.length + ' texturas...');
                
                var texturePromises = [];
                
                for (var i = 0; i < textures.length; i++) {
                    (function(index) {
                        try {
                            var textureSpec = textures[index];
                            var imageIndex = textureSpec.source;
                            
                            if (imageIndex !== undefined && images[imageIndex]) {
                                var imageSpec = images[imageIndex];
                                
                                // Para GLB, las imágenes están embebidas en el buffer binario
                                if (imageSpec.bufferView !== undefined) {
                                    var bufferView = json.bufferViews[imageSpec.bufferView];
                                    var buffer = json.buffers[bufferView.buffer];
                                    
                                    if (buffer.uri) {
                                        // Si hay URI, es un archivo separado (no GLB embebido)
                                        console.warn('Textura externa no soportada:', buffer.uri);
                                        return;
                                    }
                                    
                                    // Extraer imagen del buffer binario
                                    var offset = bufferView.byteOffset || 0;
                                    var length = bufferView.byteLength;
                                    var imageData = parser.binaryData.slice(offset, offset + length);
                                    
                                    // Crear blob y URL para la imagen
                                    var mimeType = imageSpec.mimeType || 'image/png';
                                    var blob = new Blob([imageData], { type: mimeType });
                                    var imageUrl = URL.createObjectURL(blob);
                                    
                                    // Crear promesa para la carga de textura
                                    var texturePromise = new Promise(function(resolveTexture) {
                                        var textureLoader = new THREE.TextureLoader();
                                        var texture = textureLoader.load(imageUrl, function(loadedTexture) {
                                            loadedTexture.name = textureSpec.name || ('Texture_' + index);
                                            parser.textures[index] = loadedTexture;
                                            parser.images[imageIndex] = imageUrl;
                                            console.log('Textura ' + index + ' cargada exitosamente');
                                            resolveTexture();
                                        }, undefined, function(error) {
                                            console.error('Error cargando textura ' + index + ':', error);
                                            parser.textures[index] = null;
                                            resolveTexture();
                                        });
                                    });
                                    
                                    texturePromises.push(texturePromise);
                                }
                            }
                        } catch (error) {
                            console.error('Error creando textura ' + index + ':', error);
                            parser.textures[index] = null;
                        }
                    })(i);
                }
                
                // Esperar a que todas las texturas se carguen
                Promise.all(texturePromises).then(function() {
                    console.log('Todas las texturas cargadas');
                    resolve();
                }).catch(function(error) {
                    console.error('Error cargando texturas:', error);
                    reject(error);
                });
            });
        },

        loadMeshes: function() {
            var json = this.json;
            var meshes = json.meshes || [];
            var parser = this;
            
            return new Promise(function(resolve, reject) {
                if (meshes.length === 0) {
                    console.log('No hay meshes para cargar');
                    resolve();
                    return;
                }
                
                // Validar estructura antes de procesar
                if (!parser.validateGLTFStructure()) {
                    reject(new Error('GLTF structure validation failed'));
                    return;
                }
                
                console.log('Cargando ' + meshes.length + ' meshes...');
                var processedCount = 0;
                var hasErrors = false;
                
                function processMesh(i) {
                    try {
                        var meshSpec = meshes[i];
                        var group = new THREE.Group();
                        
                        if (!group || !group.isObject3D) {
                            throw new Error('No se pudo crear Group para mesh ' + i);
                        }
                        
                        group.name = meshSpec.name || ('Mesh_' + i);
                        console.log('Procesando mesh ' + i + ': ' + group.name);
                        
                        var primitives = meshSpec.primitives || [];
                        
                        if (primitives.length === 0) {
                            console.warn('Mesh ' + i + ' no tiene primitivos');
                            parser.meshes[i] = group;
                            processedCount++;
                            if (processedCount === meshes.length) {
                                resolve();
                            }
                            return;
                        }
                        
                        var primitivePromises = [];
                        
                        for (var j = 0; j < primitives.length; j++) {
                            (function(primitiveIndex) {
                                var primitive = primitives[primitiveIndex];
                                
                                // Validar primitivo antes de procesarlo
                                console.log('Procesando primitivo ' + primitiveIndex + ':', primitive);
                                if (!primitive.attributes) {
                                    console.error('Primitivo ' + primitiveIndex + ' de mesh ' + i + ' no tiene attributes');
                                    return; // Skip este primitivo
                                }
                                if (primitive.attributes.POSITION === undefined || primitive.attributes.POSITION === null) {
                                    console.error('Primitivo ' + primitiveIndex + ' de mesh ' + i + ' no tiene POSITION en attributes:', primitive.attributes);
                                    return; // Skip este primitivo
                                }
                                
                                console.log('POSITION accessor index:', primitive.attributes.POSITION);
                                
                                // Verificar que el accessor POSITION existe
                                var positionAccessorIndex = primitive.attributes.POSITION;
                                console.log('Verificando accessor POSITION en índice', positionAccessorIndex);
                                console.log('Accessors disponibles:', json.accessors ? json.accessors.length : 'undefined');
                                if (!json.accessors || !json.accessors[positionAccessorIndex]) {
                                    console.error('Accessor POSITION ' + positionAccessorIndex + ' no existe. Accessors:', json.accessors);
                                    return; // Skip este primitivo
                                }
                                console.log('Accessor POSITION encontrado:', json.accessors[positionAccessorIndex]);
                                
                                var geometryPromise = parser.loadGeometry(primitive);
                                
                                primitivePromises.push(
                                    geometryPromise.then(function(geometry) {
                                        var material;
                                        if (primitive.material !== undefined && parser.materials[primitive.material]) {
                                            material = parser.materials[primitive.material];
                                        } else {
                                            material = new THREE.MeshStandardMaterial({
                                                color: 0xcccccc,
                                                name: 'DefaultPrimitiveMaterial_' + i + '_' + primitiveIndex
                                            });
                                        }
                                        
                                        var mesh = new THREE.Mesh(geometry, material);
                                        if (!mesh || !mesh.isObject3D) {
                                            throw new Error('No se pudo crear Mesh para primitivo ' + primitiveIndex);
                                        }
                                        
                                        mesh.name = group.name + '_Primitive_' + primitiveIndex;
                                        group.add(mesh);
                                        
                                        console.log('Primitivo ' + primitiveIndex + ' creado exitosamente');
                                    }).catch(function(error) {
                                        console.error('Error en primitivo ' + primitiveIndex + ' de mesh ' + i + ':', error);
                                        hasErrors = true;
                                        
                                        // Crear geometría fallback
                                        var fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
                                        var fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                                        var fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
                                        fallbackMesh.name = 'ErrorPrimitive_' + i + '_' + primitiveIndex;
                                        group.add(fallbackMesh);
                                    })
                                );
                            })(j);
                        }
                        
                        Promise.all(primitivePromises).then(function() {
                            parser.meshes[i] = group;
                            console.log('Mesh ' + i + ' completado con ' + group.children.length + ' primitivos');
                            
                            processedCount++;
                            if (processedCount === meshes.length) {
                                if (hasErrors) {
                                    console.warn('Carga de meshes completada CON ERRORES. Total: ' + parser.meshes.length);
                                } else {
                                    console.log('Carga de meshes completada exitosamente. Total: ' + parser.meshes.length);
                                }
                                resolve();
                            }
                        }).catch(function(error) {
                            console.error('Error procesando primitivos de mesh ' + i + ':', error);
                            var emptyGroup = new THREE.Group();
                            emptyGroup.name = 'ErrorMesh_' + i;
                            parser.meshes[i] = emptyGroup;
                            
                            processedCount++;
                            if (processedCount === meshes.length) {
                                resolve();
                            }
                        });
                        
                    } catch (error) {
                        console.error('Error cargando mesh ' + i + ':', error);
                        var emptyGroup = new THREE.Group();
                        emptyGroup.name = 'ErrorMesh_' + i;
                        parser.meshes[i] = emptyGroup;
                        
                        processedCount++;
                        if (processedCount === meshes.length) {
                            resolve();
                        }
                    }
                }
                
                for (var i = 0; i < meshes.length; i++) {
                    processMesh(i);
                }
            });
        },

        // loadGeometry mejorado con validación robusta
        loadGeometry: function(primitive) {
            var json = this.json;
            var parser = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    var geometry = new THREE.BufferGeometry();
                    var attributes = primitive.attributes || {};
                    
                    // Verificar que existan atributos
                    if (!attributes || Object.keys(attributes).length === 0) {
                        reject(new Error('Primitive sin atributos'));
                        return;
                    }
                    
                    // Verificar que POSITION existe
                    if (attributes.POSITION === undefined) {
                        console.error('Primitive attributes:', attributes);
                        reject(new Error('Primitive sin atributo POSITION'));
                        return;
                    }
                    
                    // Verificar que el accessor existe
                    if (!json.accessors || !json.accessors[attributes.POSITION]) {
                        reject(new Error('Accessor POSITION no encontrado'));
                        return;
                    }
                    
                    var loadPromises = [];
                    
                    // Cargar posiciones
                    var posAccessor = json.accessors[attributes.POSITION];
                    
                    // Verificar que el bufferView existe
                    if (posAccessor.bufferView === undefined || !json.bufferViews[posAccessor.bufferView]) {
                        reject(new Error('BufferView para POSITION no encontrado'));
                        return;
                    }
                    
                    loadPromises.push(
                        parser.loadBufferView(posAccessor.bufferView).then(function(bufferView) {
                            var componentSize = 4; // Float32
                            var expectedLength = posAccessor.count * 3 * componentSize;
                            
                            if (bufferView.byteLength < expectedLength) {
                                throw new Error('BufferView demasiado pequeño para POSITION');
                            }
                            
                            var posArray = new Float32Array(bufferView, posAccessor.byteOffset || 0, posAccessor.count * 3);
                            geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
                            console.log('POSITION cargado:', posAccessor.count, 'vertices');
                        }).catch(function(error) {
                            throw new Error('Error cargando POSITION: ' + error.message);
                        })
                    );
                    
                    // Cargar normales si existen
                    if (attributes.NORMAL && json.accessors[attributes.NORMAL]) {
                        var normAccessor = json.accessors[attributes.NORMAL];
                        if (normAccessor.bufferView !== undefined && json.bufferViews[normAccessor.bufferView]) {
                            loadPromises.push(
                                parser.loadBufferView(normAccessor.bufferView).then(function(bufferView) {
                                    var normArray = new Float32Array(bufferView, normAccessor.byteOffset || 0, normAccessor.count * 3);
                                    geometry.setAttribute('normal', new THREE.BufferAttribute(normArray, 3));
                                    console.log('NORMAL cargado:', normAccessor.count, 'normales');
                                }).catch(function(error) {
                                    console.warn('Error cargando NORMAL:', error.message);
                                })
                            );
                        }
                    }
                    
                    // Cargar UVs si existen
                    if (attributes.TEXCOORD_0 && json.accessors[attributes.TEXCOORD_0]) {
                        var uvAccessor = json.accessors[attributes.TEXCOORD_0];
                        if (uvAccessor.bufferView !== undefined && json.bufferViews[uvAccessor.bufferView]) {
                            loadPromises.push(
                                parser.loadBufferView(uvAccessor.bufferView).then(function(bufferView) {
                                    var uvArray = new Float32Array(bufferView, uvAccessor.byteOffset || 0, uvAccessor.count * 2);
                                    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
                                    console.log('UV cargado:', uvAccessor.count, 'coordenadas');
                                }).catch(function(error) {
                                    console.warn('Error cargando UV:', error.message);
                                })
                            );
                        }
                    }
                    
                    // Cargar índices si existen
                    if (primitive.indices !== undefined && json.accessors[primitive.indices]) {
                        var indexAccessor = json.accessors[primitive.indices];
                        if (indexAccessor.bufferView !== undefined && json.bufferViews[indexAccessor.bufferView]) {
                            loadPromises.push(
                                parser.loadBufferView(indexAccessor.bufferView).then(function(bufferView) {
                                    var indexArray;
                                    
                                    switch (indexAccessor.componentType) {
                                        case 5121: // UNSIGNED_BYTE
                                            indexArray = new Uint8Array(bufferView, indexAccessor.byteOffset || 0, indexAccessor.count);
                                            break;
                                        case 5123: // UNSIGNED_SHORT
                                            indexArray = new Uint16Array(bufferView, indexAccessor.byteOffset || 0, indexAccessor.count);
                                            break;
                                        case 5125: // UNSIGNED_INT
                                            indexArray = new Uint32Array(bufferView, indexAccessor.byteOffset || 0, indexAccessor.count);
                                            break;
                                        default:
                                            throw new Error('Tipo de índice no soportado: ' + indexAccessor.componentType);
                                    }
                                    
                                    geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));
                                    console.log('INDICES cargado:', indexAccessor.count, 'índices');
                                }).catch(function(error) {
                                    console.warn('Error cargando INDICES:', error.message);
                                })
                            );
                        }
                    }
                    
                    Promise.all(loadPromises).then(function() {
                        // Solo computar normales si no las tenemos
                        if (!attributes.NORMAL) {
                            geometry.computeVertexNormals();
                            console.log('Normales computadas automáticamente');
                        }
                        
                        // Verificar que la geometría es válida
                        var positionAttr = geometry.getAttribute('position');
                        if (!positionAttr || positionAttr.count === 0) {
                            throw new Error('Geometría sin vértices válidos');
                        }
                        
                        console.log('Geometría creada exitosamente con', positionAttr.count, 'vértices');
                        resolve(geometry);
                    }).catch(function(error) {
                        console.error('Error en Promise.all loadGeometry:', error);
                        reject(error);
                    });
                    
                } catch (error) {
                    console.error('Error crítico en loadGeometry:', error);
                    reject(error);
                }
            });
        },

        // loadBufferView con soporte para chunks binarios embebidos
        loadBufferView: function(bufferViewIndex) {
            var json = this.json;
            var parser = this;
            
            return new Promise(function(resolve, reject) {
                if (bufferViewIndex === undefined) {
                    reject(new Error('BufferView index is undefined'));
                    return;
                }
                
                var bufferView = json.bufferViews[bufferViewIndex];
                if (!bufferView) {
                    reject(new Error('BufferView ' + bufferViewIndex + ' not found'));
                    return;
                }
                
                var buffer = json.buffers[bufferView.buffer];
                if (!buffer) {
                    reject(new Error('Buffer ' + bufferView.buffer + ' not found'));
                    return;
                }
                
                // Verificar si tenemos datos binarios embebidos
                if (!buffer.uri && parser.binaryChunks.length > bufferView.buffer) {
                    // Usar chunk binario embebido
                    var binaryChunk = parser.binaryChunks[bufferView.buffer];
                    var result = binaryChunk.slice(bufferView.byteOffset || 0, 
                        (bufferView.byteOffset || 0) + bufferView.byteLength);
                    resolve(result);
                    return;
                }
                
                if (buffer.uri) {
                    var url = parser.resolveURL(buffer.uri, parser.options.path);
                    
                    fetch(url).then(function(response) {
                        if (!response.ok) {
                            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                        }
                        return response.arrayBuffer();
                    }).then(function(arrayBuffer) {
                        var result = arrayBuffer.slice(bufferView.byteOffset || 0, 
                            (bufferView.byteOffset || 0) + bufferView.byteLength);
                        resolve(result);
                    }).catch(function(error) {
                        reject(new Error('Error loading buffer from ' + url + ': ' + error.message));
                    });
                } else {
                    reject(new Error('Buffer sin URI y sin datos binarios embebidos'));
                }
            });
        },

        loadNodes: function() {
            var json = this.json;
            var nodes = json.nodes || [];
            var parser = this;
            
            return new Promise(function(resolve) {
                if (nodes.length === 0) {
                    console.log('No hay nodos para cargar');
                    resolve();
                    return;
                }
                
                console.log('Cargando ' + nodes.length + ' nodos...');
                
                // Crear todos los nodos primero
                for (var i = 0; i < nodes.length; i++) {
                    try {
                        var nodeSpec = nodes[i];
                        var node = new THREE.Object3D();
                        
                        if (!node || !node.isObject3D) {
                            throw new Error('No se pudo crear nodo ' + i);
                        }
                        
                        node.name = nodeSpec.name || ('Node_' + i);
                        
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
                        
                        parser.nodes[i] = node;
                        console.log('Nodo ' + i + ' creado: ' + node.name);
                    } catch (error) {
                        console.error('Error creando nodo ' + i + ':', error);
                        var emptyNode = new THREE.Object3D();
                        emptyNode.name = 'ErrorNode_' + i;
                        parser.nodes[i] = emptyNode;
                    }
                }
                
                // Asignar meshes a los nodos
                for (var i = 0; i < nodes.length; i++) {
                    try {
                        var nodeSpec = nodes[i];
                        var node = parser.nodes[i];
                        
                        if (nodeSpec.mesh !== undefined) {
                            var meshIndex = nodeSpec.mesh;
                            if (meshIndex < parser.meshes.length && parser.meshes[meshIndex]) {
                                var mesh = parser.meshes[meshIndex];
                                if (mesh && mesh.isObject3D) {
                                    node.add(mesh);
                                    console.log('Mesh ' + meshIndex + ' agregado al nodo ' + i);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error asignando contenido al nodo ' + i + ':', error);
                    }
                }
                
                // Construir jerarquía
                for (var i = 0; i < nodes.length; i++) {
                    try {
                        var nodeSpec = nodes[i];
                        var node = parser.nodes[i];
                        
                        if (nodeSpec.children !== undefined) {
                            for (var j = 0; j < nodeSpec.children.length; j++) {
                                var childIndex = nodeSpec.children[j];
                                if (childIndex < parser.nodes.length && parser.nodes[childIndex]) {
                                    var child = parser.nodes[childIndex];
                                    if (child && child.isObject3D) {
                                        node.add(child);
                                        console.log('Nodo hijo ' + childIndex + ' agregado al nodo ' + i);
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error construyendo jerarquía del nodo ' + i + ':', error);
                    }
                }
                
                console.log('Carga de nodos completada. Total: ' + parser.nodes.length);
                resolve();
            });
        },

        loadScenes: function() {
            var json = this.json;
            var scenes = json.scenes || [];
            var parser = this;
            
            return new Promise(function(resolve) {
                if (scenes.length === 0) {
                    console.warn('No hay escenas definidas, creando escena vacía');
                    var emptyScene = new THREE.Group();
                    emptyScene.name = 'EmptyScene';
                    parser.scenes[0] = emptyScene;
                    resolve();
                    return;
                }
                
                console.log('Cargando ' + scenes.length + ' escenas...');
                
                for (var i = 0; i < scenes.length; i++) {
                    try {
                        var sceneSpec = scenes[i];
                        var scene = new THREE.Group();
                        
                        if (!scene || !scene.isObject3D) {
                            throw new Error('No se pudo crear escena ' + i);
                        }
                        
                        scene.name = sceneSpec.name || ('Scene_' + i);
                        console.log('Procesando escena ' + i + ': ' + scene.name);
                        
                        if (sceneSpec.nodes !== undefined && sceneSpec.nodes.length > 0) {
                            console.log('Nodos raíz: ' + sceneSpec.nodes.length);
                            
                            for (var j = 0; j < sceneSpec.nodes.length; j++) {
                                var nodeIndex = sceneSpec.nodes[j];
                                
                                if (nodeIndex < parser.nodes.length && parser.nodes[nodeIndex]) {
                                    var node = parser.nodes[nodeIndex];
                                    if (node && node.isObject3D) {
                                        scene.add(node);
                                        console.log('Nodo ' + nodeIndex + ' agregado a escena ' + i);
                                    }
                                }
                            }
                        }
                        
                        parser.scenes[i] = scene;
                        console.log('Escena ' + i + ' completada con ' + scene.children.length + ' nodos raíz');
                    } catch (error) {
                        console.error('Error cargando escena ' + i + ':', error);
                        var errorScene = new THREE.Group();
                        errorScene.name = 'ErrorScene_' + i;
                        parser.scenes[i] = errorScene;
                    }
                }
                
                console.log('Carga de escenas completada. Total: ' + parser.scenes.length);
                resolve();
            });
        },

        resolveURL: function(url, path) {
            if (typeof url !== 'string' || url === '') {
                return '';
            }
            
            if (/^https?:\/\//i.test(url)) {
                return url;
            }
            
            if (/^data:/i.test(url)) {
                return url;
            }
            
            return (path || '') + url;
        }
    };

    console.log('GLTFLoader con soporte binario completo y validación robusta registrado');

})();