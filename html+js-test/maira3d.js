/**
 * MAIRA 4.0 - Sistema de Visor 3D
 * Versión modularizada y separada
 */

// Namespace principal para evitar conflictos globales
window.MAIRA = (function() {
    'use strict';

    // Variables globales del sistema
    let scene, camera, renderer, controls;
    let terrain = null;
    let placedModels = [];
    let selectedObject = null;
    let currentModelPath = null;
    let currentModelName = null;
    let currentModelScale = 1.0;
    let raycaster, mouse;
    let ambientLight, directionalLight;
    let folderFiles = new Map();
    let loadedModels = new Map();
    
    // Referencias a elementos DOM
    let statusDiv, selectionInfo;
    
    // Materiales predefinidos
    const materialTypes = {
        default: () => new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.2
        }),
        metal: () => new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.1,
            metalness: 0.9
        }),
        vehicle: () => new THREE.MeshStandardMaterial({ 
            color: 0x4a5d23,
            roughness: 0.6,
            metalness: 0.3
        }),
        soldier: () => new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        })
    };
    
    // Funciones utilitarias
    function updateStatus(message, type = 'info') {
        if (statusDiv) {
            statusDiv.innerHTML = `[${type.toUpperCase()}] ${message}`;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    function updateSelectionInfo() {
        if (!selectionInfo) return;
        
        if (selectedObject) {
            const pos = selectedObject.position;
            const rot = selectedObject.rotation;
            const scale = selectedObject.scale;
            selectionInfo.innerHTML = `
                <strong>${selectedObject.userData.name || 'Objeto'}</strong><br>
                Pos: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})<br>
                Rot: (${(rot.x * 180/Math.PI).toFixed(1)}°, ${(rot.y * 180/Math.PI).toFixed(1)}°, ${(rot.z * 180/Math.PI).toFixed(1)}°)<br>
                Scale: ${scale.x.toFixed(2)}
            `;
        } else {
            selectionInfo.innerHTML = 'Ningún objeto seleccionado<br>Click en un modelo para seleccionarlo';
        }
    }
    
    // Función de inicialización principal
    function initSystem() {
        updateStatus('Verificando componentes...');
        
        // Verificar dependencias
        if (typeof THREE === 'undefined') {
            updateStatus('ERROR: THREE.js no disponible', 'error');
            return false;
        }
        
        // Obtener referencias DOM
        statusDiv = document.getElementById('status');
        selectionInfo = document.getElementById('selection-info');
        
        updateStatus('Inicializando escena 3D mejorada...', 'success');
        
        // Configurar escena
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Configurar cámara
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.set(50, 30, 50);
        
        // Configurar renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.physicallyCorrectLights = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        document.body.appendChild(renderer.domElement);
        
        // Configurar controles
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.target.set(0, 0, 0);
            controls.maxPolarAngle = Math.PI * 0.48;
        }
        
        // Configurar iluminación
        setupLighting();
        
        // Configurar raycaster para interacciones
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        
        // Configurar eventos
        setupEventListeners();
        
        // Crear terreno inicial
        createTerrain();
        
        // Iniciar loop de animación
        animate();
        
        updateStatus('MAIRA 4.0 Sistema Operativo - LISTO', 'success');
        updateSelectionInfo();
        
        return true;
    }
    
    function setupLighting() {
        // Luz ambiente
        ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        // Luz direccional principal
        directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.bias = -0.0001;
        scene.add(directionalLight);
        
        // Luz de relleno
        const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
        fillLight.position.set(-50, 50, -50);
        scene.add(fillLight);
        
        // Luz hemisférica
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a5f3a, 0.4);
        scene.add(hemiLight);
    }
    
    function createTerrain() {
        if (terrain) {
            scene.remove(terrain);
        }
        
        const terrainGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        const vertices = terrainGeometry.attributes.position.array;
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            const distance = Math.sqrt(x * x + z * z) * 0.01;
            vertices[i + 2] = Math.sin(distance) * 3 + Math.random() * 2 - 1;
        }
        
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        
        const terrainMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3a5f3a,
            wireframe: false
        });
        
        terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        terrain.name = 'terrain';
        terrain.userData = { selectable: false };
        
        scene.add(terrain);
        updateStatus('Terreno creado con variaciones', 'success');
    }
    
    function clearTerrain() {
        if (terrain) {
            scene.remove(terrain);
            terrain = null;
            updateStatus('Terreno eliminado', 'success');
        }
    }
    
    function loadModel(path, name, scale = 1.0) {
        currentModelPath = path;
        currentModelName = name;
        currentModelScale = scale;
        updateStatus(`Modelo ${name} seleccionado. Click en el terreno para colocar.`, 'success');
        
        // Actualizar UI
        document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
        if (window.event && window.event.target) {
            window.event.target.classList.add('active');
        }
    }
    
    function placeModelAtPosition(position, path = currentModelPath, name = currentModelName, scale = currentModelScale) {
        if (!path && !currentModelPath) return;
        
        if (path === 'folder_model' || currentModelPath === 'folder_model') {
            placeModelFromFolder(position, name || currentModelName);
            return;
        }
        
        updateStatus(`Cargando ${name}...`);
        
        const loader = new THREE.GLTFLoader();
        
        loader.load(path, 
            function(gltf) {
                const model = gltf.scene;
                
                model.position.copy(position);
                model.position.y += 0.5;
                model.scale.setScalar(scale);
                
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        if (!child.material.map) {
                            if (name.toLowerCase().includes('tank') || name.toLowerCase().includes('m113')) {
                                child.material = materialTypes.vehicle();
                            } else if (name.toLowerCase().includes('soldier') || name.toLowerCase().includes('soldado')) {
                                child.material = materialTypes.soldier();
                            } else if (name.toLowerCase().includes('humvee')) {
                                child.material = materialTypes.metal();
                            } else {
                                child.material = materialTypes.default();
                            }
                        }
                    }
                });
                
                model.userData = {
                    name: name,
                    path: path,
                    placedAt: new Date().toISOString(),
                    selectable: true,
                    type: 'model'
                };
                
                scene.add(model);
                placedModels.push(model);
                
                updateStatus(`${name} colocado exitosamente`, 'success');
                
                // Limpiar selección
                currentModelPath = null;
                currentModelName = null;
                document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
            },
            function(progress) {
                const percent = (progress.loaded / progress.total * 100).toFixed(1);
                updateStatus(`Cargando ${name}... ${percent}%`);
            },
            function(error) {
                console.error('Error cargando modelo:', error);
                updateStatus(`Error cargando ${name}`, 'error');
                
                // Crear modelo de respaldo
                const geometry = new THREE.BoxGeometry(2, 2, 2);
                const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const fallback = new THREE.Mesh(geometry, material);
                fallback.position.copy(position);
                fallback.position.y += 1;
                fallback.castShadow = true;
                fallback.receiveShadow = true;
                fallback.userData = {
                    name: `Error_${name}`,
                    selectable: true,
                    type: 'error'
                };
                scene.add(fallback);
                placedModels.push(fallback);
            }
        );
    }
    
    function setupEventListeners() {
        // Eventos del mouse
        renderer.domElement.addEventListener('click', onMouseClick, false);
        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        
        // Evento de redimensionamiento
        window.addEventListener('resize', onWindowResize, false);
        
        // Eventos del teclado
        window.addEventListener('keydown', (event) => {
            if (!selectedObject) return;
            
            switch(event.key) {
                case 'Delete':
                case 'Backspace':
                    deleteSelected();
                    break;
                case 'ArrowUp':
                    moveSelected('up');
                    break;
                case 'ArrowDown':
                    moveSelected('down');
                    break;
                case 'ArrowLeft':
                    moveSelected('left');
                    break;
                case 'ArrowRight':
                    moveSelected('right');
                    break;
                case 'q':
                    rotateSelected('y', 0.1);
                    break;
                case 'e':
                    rotateSelected('y', -0.1);
                    break;
                case '+':
                case '=':
                    scaleSelected(1.1);
                    break;
                case '-':
                    scaleSelected(0.9);
                    break;
            }
        });
    }
    
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    function onMouseClick(event) {
        raycaster.setFromCamera(mouse, camera);
        
        const selectableObjects = placedModels.filter(obj => obj.userData.selectable);
        const intersects = raycaster.intersectObjects(selectableObjects, true);
        
        if (intersects.length > 0) {
            let clickedObject = intersects[0].object;
            while (clickedObject.parent && !placedModels.includes(clickedObject)) {
                clickedObject = clickedObject.parent;
            }
            
            if (placedModels.includes(clickedObject)) {
                selectObject(clickedObject);
                return;
            }
        }
        
        if (currentModelPath && terrain) {
            const terrainIntersects = raycaster.intersectObject(terrain);
            if (terrainIntersects.length > 0) {
                const position = terrainIntersects[0].point;
                placeModelAtPosition(position);
            }
        } else {
            selectObject(null);
        }
    }
    
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function selectObject(object) {
        if (selectedObject && selectedObject.userData.originalColor) {
            selectedObject.traverse(child => {
                if (child.isMesh && child.userData.originalColor) {
                    child.material.emissive.copy(child.userData.originalColor);
                }
            });
        }
        
        selectedObject = object;
        
        if (selectedObject) {
            selectedObject.traverse(child => {
                if (child.isMesh) {
                    child.userData.originalColor = child.material.emissive.clone();
                    child.material.emissive.setHex(0x444444);
                }
            });
        }
        
        updateSelectionInfo();
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls) {
            controls.update();
        }
        
        renderer.render(scene, camera);
    }
    
    // Funciones auxiliares privadas
    function addModelButton(name, url, scale, type) {
        const section = document.getElementById('loaded-models-section');
        const grid = document.getElementById('loaded-models-grid');
        
        if (section && grid) {
            section.style.display = 'block';
            
            const button = document.createElement('button');
            button.className = 'model-btn';
            button.textContent = name;
            button.onclick = () => {
                if (type === 'folder_model') {
                    loadModelFromLoadedFolder(name);
                } else {
                    MAIRA.loadModel(url, name, scale);
                }
            };
            
            grid.appendChild(button);
        }
    }
    
    function loadModelFromLoadedFolder(modelName) {
        const modelData = loadedModels.get(modelName);
        if (!modelData || modelData.type !== 'folder_model') return;
        
        currentModelName = modelName;
        currentModelScale = modelData.scale;
        currentModelPath = 'folder_model';
        
        updateStatus(`Modelo ${modelName} seleccionado. Click en el terreno para colocar.`, 'success');
        
        document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
        if (window.event && window.event.target) {
            window.event.target.classList.add('active');
        }
    }
    
    function placeModelFromFolder(position, modelName) {
        const modelData = loadedModels.get(modelName);
        if (!modelData || modelData.type !== 'folder_model') {
            updateStatus(`Error: Modelo ${modelName} no encontrado`, 'error');
            return;
        }
        
        updateStatus(`Cargando ${modelName} desde carpeta...`);
        
        const manager = new THREE.LoadingManager();
        
        manager.setURLModifier((url) => {
            if (url.startsWith('blob:')) {
                return url;
            }
            
            const gltfPath = modelData.gltfFile.webkitRelativePath;
            const basePath = gltfPath.substring(0, gltfPath.lastIndexOf('/') + 1);
            const fullPath = basePath + url;
            
            const file = folderFiles.get(fullPath);
            if (file) {
                const blobUrl = URL.createObjectURL(file);
                console.log(`Resolviendo: ${url} -> ${fullPath} -> ${blobUrl}`);
                return blobUrl;
            }
            
            const texturesPath = basePath + 'textures/' + url;
            const textureFile = folderFiles.get(texturesPath);
            if (textureFile) {
                const blobUrl = URL.createObjectURL(textureFile);
                console.log(`Resolviendo en textures: ${url} -> ${texturesPath} -> ${blobUrl}`);
                return blobUrl;
            }
            
            for (let [path, file] of folderFiles) {
                if (path.endsWith('/' + url) || path.endsWith(url)) {
                    const blobUrl = URL.createObjectURL(file);
                    console.log(`Resolviendo por nombre: ${url} -> ${path} -> ${blobUrl}`);
                    return blobUrl;
                }
            }
            
            console.warn(`Archivo no encontrado: ${url} (buscado en ${fullPath})`);
            return url;
        });
        
        const loader = new THREE.GLTFLoader(manager);
        const gltfUrl = URL.createObjectURL(modelData.gltfFile);
        
        loader.load(gltfUrl,
            function(gltf) {
                const model = gltf.scene;
                
                model.position.copy(position);
                model.position.y += 0.5;
                
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxDimension = Math.max(size.x, size.y, size.z);
                
                if (maxDimension > 10) {
                    const scale = 10 / maxDimension;
                    model.scale.setScalar(scale);
                } else if (maxDimension < 1) {
                    const scale = 2 / maxDimension;
                    model.scale.setScalar(scale);
                }
                
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                model.userData = {
                    name: modelName,
                    path: gltfUrl,
                    placedAt: new Date().toISOString(),
                    selectable: true,
                    type: 'folder_model',
                    originalData: modelData
                };
                
                scene.add(model);
                placedModels.push(model);
                
                updateStatus(`${modelName} colocado exitosamente`, 'success');
                
                currentModelPath = null;
                currentModelName = null;
                document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
            },
            function(progress) {
                const percent = (progress.loaded / progress.total * 100).toFixed(1);
                updateStatus(`Cargando ${modelName}... ${percent}%`);
            },
            function(error) {
                console.error('Error cargando modelo desde carpeta:', error);
                updateStatus(`Error cargando ${modelName} desde carpeta`, 'error');
                
                const geometry = new THREE.BoxGeometry(2, 2, 2);
                const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const fallback = new THREE.Mesh(geometry, material);
                fallback.position.copy(position);
                fallback.position.y += 1;
                fallback.castShadow = true;
                fallback.receiveShadow = true;
                fallback.userData = {
                    name: `Error_${modelName}`,
                    selectable: true,
                    type: 'error'
                };
                scene.add(fallback);
                placedModels.push(fallback);
            }
        );
    }
    
    // Funciones de manipulación de objetos
    function moveSelected(direction) {
        if (!selectedObject) return;
        
        const distance = 2;
        switch(direction) {
            case 'up': selectedObject.position.z -= distance; break;
            case 'down': selectedObject.position.z += distance; break;
            case 'left': selectedObject.position.x -= distance; break;
            case 'right': selectedObject.position.x += distance; break;
        }
        updateSelectionInfo();
    }
    
    function rotateSelected(axis, angle) {
        if (!selectedObject) return;
        selectedObject.rotation[axis] += angle;
        updateSelectionInfo();
    }
    
    function scaleSelected(factor) {
        if (!selectedObject) return;
        selectedObject.scale.multiplyScalar(factor);
        updateSelectionInfo();
    }
    
    function deleteSelected() {
        if (!selectedObject) return;
        
        scene.remove(selectedObject);
        const index = placedModels.indexOf(selectedObject);
        if (index > -1) {
            placedModels.splice(index, 1);
        }
        
        updateStatus(`${selectedObject.userData.name} eliminado`, 'success');
        selectedObject = null;
        updateSelectionInfo();
    }
    
    // Función de espera para librerías
    function waitForLibraries() {
        if (typeof THREE !== 'undefined' && 
            typeof THREE.GLTFLoader !== 'undefined' && 
            typeof THREE.OrbitControls !== 'undefined') {
            
            console.log('Todas las librerías cargadas, inicializando sistema...');
            initSystem();
        } else {
            console.log('Esperando librerías...');
            setTimeout(waitForLibraries, 100);
        }
    }
    
    // API pública
    return {
        // Funciones de inicialización
        init: waitForLibraries,
        
        // Funciones de terreno
        createTerrain: createTerrain,
        clearTerrain: clearTerrain,
        
        // Funciones de modelos
        loadModel: loadModel,
        loadSelectedFiles: function(files) {
            for (let file of files) {
                if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
                    const fileName = file.name.split('.')[0];
                    const url = URL.createObjectURL(file);
                    
                    loadedModels.set(fileName, {
                        name: fileName,
                        url: url,
                        type: 'single_file',
                        scale: 1.0
                    });
                    
                    addModelButton(fileName, url, 1.0, 'single_file');
                }
            }
        },
        loadFolder: function(files) {
            folderFiles.clear();
            const folderInfo = document.getElementById('folder-info');
            
            const modelFolders = new Map();
            
            for (let file of files) {
                const relativePath = file.webkitRelativePath;
                const pathParts = relativePath.split('/');
                
                if (pathParts.length >= 2) {
                    const modelFolder = pathParts[pathParts.length - 2];
                    const fileName = file.name.toLowerCase();
                    
                    if (!modelFolders.has(modelFolder)) {
                        modelFolders.set(modelFolder, {
                            gltf: null,
                            bin: null,
                            textures: [],
                            allFiles: []
                        });
                    }
                    
                    const folder = modelFolders.get(modelFolder);
                    folder.allFiles.push(file);
                    
                    if (fileName.endsWith('.gltf')) {
                        folder.gltf = file;
                    } else if (fileName.endsWith('.glb')) {
                        folder.gltf = file;
                    } else if (fileName.endsWith('.bin')) {
                        folder.bin = file;
                    } else if (fileName.match(/\.(jpg|jpeg|png|bmp|tga|hdr|exr)$/)) {
                        folder.textures.push(file);
                    }
                    
                    folderFiles.set(relativePath, file);
                }
            }
            
            let validModels = 0;
            for (let [folderName, folder] of modelFolders) {
                if (folder.gltf) {
                    validModels++;
                    
                    const modelData = {
                        name: folderName,
                        gltfFile: folder.gltf,
                        binFile: folder.bin,
                        textures: folder.textures,
                        allFiles: folder.allFiles,
                        type: 'folder_model',
                        scale: 1.0
                    };
                    
                    loadedModels.set(folderName, modelData);
                    addModelButton(folderName, null, 1.0, 'folder_model');
                }
            }
            
            if (folderInfo) {
                folderInfo.innerHTML = `
                    Encontrados: ${validModels} modelos válidos en ${modelFolders.size} carpetas
                `;
            }
            
            updateStatus(`Directorio procesado: ${validModels} modelos encontrados`, 'success');
        },
        loadAllModelsInFolder: function() {
            const modelPaths = [
                'client/assets/models/gbl_new/humvee.glb',
                'client/assets/models/gbl_new/m113.glb',
                'client/assets/models/gbl_new/tam_tank.glb',
                'client/assets/models/gbl_new/a_solider_poin_weapon.glb'
            ];
            
            modelPaths.forEach((path, index) => {
                setTimeout(() => {
                    const name = path.split('/').pop().split('.')[0];
                    placeModelAtPosition(
                        new THREE.Vector3((index - 2) * 15, 0, 0),
                        path,
                        name,
                        index < 2 ? 1.0 : 0.5
                    );
                }, index * 500);
            });
        },
        clearLoadedModels: function() {
            loadedModels.clear();
            folderFiles.clear();
            
            const section = document.getElementById('loaded-models-section');
            const grid = document.getElementById('loaded-models-grid');
            
            if (grid) grid.innerHTML = '';
            if (section) section.style.display = 'none';
            
            updateStatus('Lista de modelos cargados limpiada', 'success');
        },
        
        // Funciones de iluminación
        updateAmbientLight: function(value) {
            if (ambientLight) {
                ambientLight.intensity = parseFloat(value);
                const ambientValueEl = document.getElementById('ambientValue');
                if (ambientValueEl) ambientValueEl.textContent = value;
            }
        },
        updateDirectionalLight: function(value) {
            if (directionalLight) {
                directionalLight.intensity = parseFloat(value);
                const directionalValueEl = document.getElementById('directionalValue');
                if (directionalValueEl) directionalValueEl.textContent = value;
            }
        },
        resetLighting: function() {
            const ambientSlider = document.getElementById('ambientSlider');
            const directionalSlider = document.getElementById('directionalSlider');
            
            if (ambientSlider) ambientSlider.value = 0.6;
            if (directionalSlider) directionalSlider.value = 1.0;
            
            MAIRA.updateAmbientLight(0.6);
            MAIRA.updateDirectionalLight(1.0);
        },
        
        // Funciones de transformación
        moveSelected: moveSelected,
        rotateSelected: rotateSelected,
        scaleSelected: scaleSelected,
        deleteSelected: deleteSelected,
        
        // Funciones de herramientas
        loadTestCube: function() {
            const geometry = new THREE.BoxGeometry(5, 5, 5);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                roughness: 0.7,
                metalness: 0.3
            });
            const cube = new THREE.Mesh(geometry, material);
            
            cube.position.set(
                (Math.random() - 0.5) * 50,
                2.5,
                (Math.random() - 0.5) * 50
            );
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.name = 'TestCube_' + Date.now();
            cube.userData = { 
                name: 'Cubo de Prueba',
                selectable: true,
                type: 'test'
            };
            
            scene.add(cube);
            placedModels.push(cube);
            
            updateStatus('Cubo de prueba agregado', 'success');
        },
        clearAllModels: function() {
            placedModels.forEach(model => {
                scene.remove(model);
            });
            placedModels = [];
            selectedObject = null;
            updateSelectionInfo();
            updateStatus('Todos los modelos eliminados', 'success');
        },
        resetCamera: function() {
            if (camera) {
                camera.position.set(50, 30, 50);
            }
            if (controls) {
                controls.target.set(0, 0, 0);
                controls.update();
            }
            updateStatus('Cámara restablecida', 'success');
        },
        exportScene: function() {
            const sceneData = {
                timestamp: new Date().toISOString(),
                models: placedModels.map(model => ({
                    name: model.userData.name,
                    position: model.position.toArray(),
                    rotation: model.rotation.toArray(),
                    scale: model.scale.toArray(),
                    path: model.userData.path
                }))
            };
            
            const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'maira_scene.json';
            a.click();
            URL.revokeObjectURL(url);
            
            updateStatus('Escena exportada', 'success');
        },
        
        // Funciones adicionales para compatibilidad
        loadModelFromURL: function(url, name, scale) {
            const position = new THREE.Vector3(
                (Math.random() - 0.5) * 50,
                0,
                (Math.random() - 0.5) * 50
            );
            placeModelAtPosition(position, url, name, scale);
        },
        
        // Getters para debug/información
        getScene: function() { return scene; },
        getCamera: function() { return camera; },
        getRenderer: function() { return renderer; },
        getControls: function() { return controls; },
        getPlacedModels: function() { return placedModels; },
        getSelectedObject: function() { return selectedObject; },
        
        // Utilidades de estado
        isInitialized: function() {
            return !!(scene && camera && renderer);
        },
        
        getSystemInfo: function() {
            return {
                initialized: this.isInitialized(),
                modelsCount: placedModels.length,
                selectedObject: selectedObject ? selectedObject.userData.name : null,
                terrainExists: !!terrain,
                lightsCount: scene ? scene.children.filter(child => child.isLight).length : 0
            };
        }
    };

})();

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM cargado, iniciando MAIRA...');
        MAIRA.init();
    });
} else {
    console.log('DOM ya listo, iniciando MAIRA...');
    MAIRA.init();
}

// Exponer MAIRA globalmente para debugging en consola
window.MAIRA = MAIRA;

console.log('MAIRA 4.0 - Sistema de Visor 3D cargado y listo para inicializar');