// ...existing code...
// ...existing code...
    /**
     * MAIRA 4.0 - Adaptador de Vista 3D
     * Clase principal para el sistema de visualización 3D
     */
    class MAIRA3DViewAdapter {
    /**
     * Dibuja una flecha ancha desde el modelo seleccionado hasta el destino
     * @param {THREE.Vector3} destino
     */
    drawMoveArrow(destino) {
        if (!this.selectedObject) return;
        // Eliminar flecha anterior si existe
        if (this.selectedObject.userData.moveArrow) {
            this.scene.remove(this.selectedObject.userData.moveArrow);
            this.selectedObject.userData.moveArrow = null;
        }
        const origen = this.selectedObject.position.clone();
        const dir = new THREE.Vector3().subVectors(destino, origen).normalize();
        const length = origen.distanceTo(destino);
        // Crear geometría de flecha ancha
        const arrowGeometry = new THREE.CylinderGeometry(0.3, 0.6, length, 16, 1, true);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x2196f3, transparent: true, opacity: 0.7 });
        const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrowMesh.position.copy(origen).addScaledVector(dir, length / 2);
        arrowMesh.lookAt(destino);
        arrowMesh.rotateX(Math.PI / 2);
        arrowMesh.name = 'moveArrow';
        this.scene.add(arrowMesh);
        this.selectedObject.userData.moveArrow = arrowMesh;
    }
        /**
         * Constructor de la clase MAIRA3DViewAdapter
         */
        constructor() {
            // ...existing code...
            // Definición de materiales para modelos
            this.materialTypes = {
                vehicle: () => new THREE.MeshStandardMaterial({ color: 0x556b2f, metalness: 0.6, roughness: 0.4 }),
                soldier: () => new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.2, roughness: 0.8 }),
                metal: () => new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 1.0, roughness: 0.2 }),
                default: () => new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.3, roughness: 0.7 })
            };
            // Inicializar arrays para modelos y unidades
            this.placedModels = [];
            this.units = [];
            this.selectedUnits = []; // Array para selección múltiple
            this.folderFiles = new Map(); // Mapa para archivos cargados desde directorios
            this.loadedModels = new Map(); // Mapa para modelos cargados
            // Inicializar mapa de órdenes
            this.orders = new Map();
            // Inicializar arrays para visuales de órdenes
            this.orderLines = [];
            this.waypoints = [];
            // Tipo de unidad (amigo/enemigo)
            this.unitType = 'amigo';
            
            // Datos militares para sistema de combate avanzado
            this.militaryData = null;
            this.unitTypes = {
                'infanteria': { health: 10, armor: 0, weapons: ['FAL'], effectiveAgainst: ['infanteria', 'vehiculo_ligero'] },
                'tanque': { health: 100, armor: 50, weapons: ['SK 105', 'TAM'], effectiveAgainst: ['tanque', 'vehiculo_ligero', 'fortificacion'] },
                'vehiculo_ligero': { health: 30, armor: 10, weapons: ['FAL', 'ametralladora'], effectiveAgainst: ['infanteria'] },
                'artilleria': { health: 20, armor: 5, weapons: ['Mortero 120 mm', 'Mortero 81 mm'], effectiveAgainst: ['infanteria', 'fortificacion'] }
            };
        }

        /**
         * Convierte una posición 3D del mundo a coordenadas de pantalla (canvas)
         * @param {THREE.Vector3} worldPos
         * @returns {{x: number, y: number}}
         */
        worldToScreen(worldPos) {
            if (!this.camera || !this.renderer) return { x: 0, y: 0 };
            const vector = worldPos.clone();
            vector.project(this.camera);
            const widthHalf = this.renderer.domElement.width / 2;
            const heightHalf = this.renderer.domElement.height / 2;
            return {
                x: (vector.x * widthHalf) + widthHalf,
                y: -(vector.y * heightHalf) + heightHalf
            };
        }
    // ...existing code...

    // Método de inicialización principal
    /**
     * Inicializa el sistema MAIRA 3D completo
     * @returns {boolean} true si la inicialización fue exitosa
     */
    init() {
        console.log('=== INIT METHOD CALLED ===');
        console.log('🔥🔥 DEBUGGING INIT - VERSION 2025-09-27 🔴🔴🔴');
        console.log('🚀 INICIANDO MAIRA3DViewAdapter.init()...');

        try {
            // Inicializar elementos DOM
            this.statusDiv = document.getElementById('status');
            this.selectionInfo = document.getElementById('selection-info');
            console.log('📋 Elementos DOM inicializados:', this.statusDiv, this.selectionInfo);

            // Inicializar Three.js
            console.log('🎨 Llamando initThreeJS...');
            this.initThreeJS();
            console.log('✅ initThreeJS completado');

            console.log('💡 Llamando initLighting...');
            this.initLighting();
            console.log('✅ initLighting completado');

            console.log('🎮 Llamando initControls...');
            this.initControls();
            console.log('✅ initControls completado');

            console.log('🎧 Llamando setupEventListeners...');
            this.setupEventListeners();
            console.log('✅ setupEventListeners completado');

            // Inicializar menú radial
            console.log('🔧 Llamando initRadialMenu...');
            try {
                this.initRadialMenu();
                console.log('✅ initRadialMenu completado, radialMenu:', this.radialMenu);
            } catch (error) {
                console.error('❌ ERROR en initRadialMenu:', error);
                this.radialMenu = null;
            }

            // Crear terreno inicial
            this.createTerrain('plano');

            // Iniciar loop de animación
            this.animate();

            // Cargar datos militares para sistema de combate
            this.loadMilitaryData();

            this.updateStatus('MAIRA 3D inicializado correctamente', 'success');
            console.log('🎉 MAIRA3DViewAdapter inicializado completamente');
        } catch (error) {
            console.error('❌ Error en init():', error);
            console.error('❌ Stack trace:', error.stack);
        }
    }

    initThreeJS() {
        console.log('🎨 INICIANDO initThreeJS...');

        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Cielo azul

        // Crear cámara
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(120, 100, 120); // Más lejos para ver el plano completo
    this.camera.lookAt(0, 0, 0);
        
        console.log('📷 Cámara creada en posición:', this.camera.position);
        console.log('📷 Cámara mirando hacia:', this.camera.getWorldDirection(new THREE.Vector3()));

        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Agregar canvas al DOM
        const container = document.body;
        console.log('🎨 Intentando agregar canvas a:', container, 'body children:', document.body.children.length);
        container.appendChild(this.renderer.domElement);
        
        // Configurar estilos del canvas
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1';
        
        console.log('🎨 Canvas agregado exitosamente, body children ahora:', document.body.children.length);
        console.log('🎨 Canvas dimensions:', this.renderer.domElement.width, this.renderer.domElement.height);
        console.log('🎨 Canvas bounding rect:', this.renderer.domElement.getBoundingClientRect());

        // Verificar que el canvas sea clickeable
        console.log('🎨 Canvas pointer events:', window.getComputedStyle(this.renderer.domElement).pointerEvents);
        console.log('🎨 Canvas visibility:', window.getComputedStyle(this.renderer.domElement).visibility);
        console.log('🎨 Canvas display:', window.getComputedStyle(this.renderer.domElement).display);
        console.log('🎨 Canvas z-index:', window.getComputedStyle(this.renderer.domElement).zIndex);

        // Verificar elementos que podrían estar encima
        const allElements = document.querySelectorAll('*');
        console.log('🎨 Total elements in DOM:', allElements.length);
        const elementsWithHighZIndex = Array.from(allElements).filter(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex);
            return zIndex > 0;
        });
        console.log('🎨 Elements with z-index > 0:', elementsWithHighZIndex.map(el => `${el.tagName}.${el.className} (z-index: ${window.getComputedStyle(el).zIndex})`));

        // Test event listener directo en canvas
        this.renderer.domElement.addEventListener('dblclick', (event) => {
            console.log('🎯 CANVAS DOBLE CLICK DIRECTO:', event.clientX, event.clientY);
            event.preventDefault();
            event.stopPropagation();
            this.onDoubleClick(event);
        });

        // Test event listener en body
        document.body.addEventListener('dblclick', (event) => {
            console.log('📄 BODY DOBLE CLICK:', event.target.tagName, event.clientX, event.clientY);
        });

        // Test básico de eventos
        this.renderer.domElement.addEventListener('click', (event) => {
            console.log('🖱️ CANVAS CLICK NORMAL:', event.clientX, event.clientY);
        });

        // Inicializar raycaster para selección
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        console.log('🎨 Three.js inicializado completamente');
    }

    initLighting() {
        // Luz ambiente
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);

        // Luz direccional (sol)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directionalLight.position.set(50, 50, 25);
        this.directionalLight.castShadow = true;

        // Configurar sombras
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;

        this.scene.add(this.directionalLight);

        console.log('Iluminación inicializada');
    }

    // Método para cambiar tipo de mapa
    setMapType(mapType) {
        console.log('🗺️ Cambiando tipo de mapa a:', mapType);
        this.createTerrain(mapType);
        this.updateStatus(`Tipo de mapa cambiado a: ${mapType}`, 'info');
    }

    // Métodos de control de iluminación
    updateAmbientLight(intensity) {
        if (this.ambientLight) {
            this.ambientLight.intensity = parseFloat(intensity);
            document.getElementById('ambientValue').textContent = intensity;
            console.log('💡 Intensidad luz ambiente actualizada:', intensity);
        }
    }

    updateDirectionalLight(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = parseFloat(intensity);
            document.getElementById('directionalValue').textContent = intensity;
            console.log('💡 Intensidad luz direccional actualizada:', intensity);
        }
    }

    resetLighting() {
        this.updateAmbientLight(0.6);
        this.updateDirectionalLight(1.0);
        document.getElementById('ambientSlider').value = 0.6;
        document.getElementById('directionalSlider').value = 1.0;
        console.log('💡 Iluminación restablecida a valores por defecto');
    }

    initControls() {
        // Controles de órbita
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Deshabilitar doble click en OrbitControls para permitir menú radial
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        // Nota: OrbitControls no tiene una opción directa para deshabilitar dblclick,
        // pero podemos manejar el evento antes que ellos

        console.log('Controles inicializados');
    }

    setupEventListeners() {
        console.log('🎧 Configurando event listeners...');
        console.log('🎧 Canvas element:', this.renderer.domElement);

        // Limpiar event listeners previos para evitar duplicados
        this.renderer.domElement.removeEventListener('click', this.onMouseClick);
        this.renderer.domElement.removeEventListener('contextmenu', this.onRightClick);
        this.renderer.domElement.removeEventListener('dblclick', this.onDoubleClick);

        // Event listeners principales
        this.renderer.domElement.addEventListener('click', (event) => {
            console.log('🖱️ Click detectado en canvas');
            this.onMouseClick(event);
        });

        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            console.log('🖱️ Right click detectado en canvas');
            event.preventDefault();
            this.onRightClick(event);
        });

        this.renderer.domElement.addEventListener('dblclick', (event) => {
            console.log('🎯 Doble click detectado en canvas');
            event.preventDefault();
            this.onDoubleClick(event);
        });

        // Controles de teclado
        document.addEventListener('keydown', (event) => this.onKeyDown(event));

        // Resize
        window.addEventListener('resize', () => this.onWindowResize());

        console.log('✅ Event listeners configurados correctamente');
    }

    initRadialMenu() {
        console.log('🔧 INICIANDO initRadialMenu()...');
        console.log('🔧 RadialMenu class disponible:', typeof RadialMenu);
        
        try {
            // Verificar que RadialMenu existe
            if (typeof RadialMenu === 'undefined') {
                throw new Error('RadialMenu class no está disponible');
            }
            
            // Inicializar menú radial usando la clase RadialMenu
            this.radialMenu = new RadialMenu();
            console.log('📦 Instancia RadialMenu creada:', this.radialMenu);

            // Configurar el callback para manejar acciones del menú
            this.radialMenu.setActionCallback((action) => {
                console.log('🎯 Acción del menú radial ejecutada:', action);
                this.handleRadialMenuOption(action);
            });

            console.log('✅ Menú radial inicializado completamente');
        } catch (error) {
            console.error('❌ ERROR al inicializar menú radial:', error);
            this.radialMenu = null;
        }
    }    // Manejadores de eventos
    onMouseClick(event) {
        console.log('🖱️ MOUSE CLICK DETECTADO - Posición:', event.clientX, event.clientY);
        console.log('📊 Estado actual - pendingOrder:', this.pendingOrder, 'currentModelPath:', this.currentModelPath, 'selectedObject:', this.selectedObject ? this.selectedObject.userData.name : 'ninguno');

        if (this.pendingOrder) {
            console.log('📋 Procesando orden pendiente...');
            this.processPendingOrder(event);
            return;
        }

        // Verificar si hay un modelo seleccionado para colocar
        if (this.currentModelPath) {
            console.log('🎯 Intentando colocar modelo:', this.currentModelName, 'en posición del click');
            
            // Verificar cooldown de colocación
            const now = Date.now();
            if (now - this.lastPlacementTime < this.placementCooldown) {
                console.log('⏳ Cooldown de colocación activo, ignorando click');
                return;
            }
            
            // Calcular posición del click en el terreno
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            console.log('📍 Coordenadas normalizadas del mouse:', this.mouse.x, this.mouse.y);

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.terrain);

            console.log('🔍 Intersecciones con terreno:', intersects.length);

            if (intersects.length > 0) {
                const position = intersects[0].point;
                console.log('📍 Posición de colocación calculada:', position.x, position.y, position.z);
                
                // Marcar que estamos colocando un modelo
                this.isPlacingModel = true;
                this.lastPlacementTime = now;
                
                this.placeModelAtPosition(position, this.currentModelPath, this.currentModelName, this.currentModelScale);
                console.log('✅ Modelo colocado exitosamente');
                return;
            } else {
                console.log('❌ No se encontró intersección con el terreno');
                this.updateStatus('No se puede colocar el modelo aquí', 'error');
                return;
            }
        }

        // Lógica existente de selección
        console.log('🎯 Procesando selección de unidades...');
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        console.log('🔍 Intersecciones encontradas para selección:', intersects.length);

        for (let intersect of intersects) {
            console.log('🔍 Objeto intersectado:', intersect.object.name, intersect.object.userData);
            if (intersect.object.userData.isUnit) {
                console.log('🎖️ Unidad seleccionada:', intersect.object.userData.unitName);
                
                // Usar el root del modelo para selección, no el mesh individual
                const unitToSelect = intersect.object.userData.unitRoot || intersect.object;
                
                // Determinar si es selección múltiple (Shift presionado)
                const isMultiSelect = event.shiftKey;
                
                // Si ya está seleccionado y es selección múltiple, deseleccionar esta unidad
                if (isMultiSelect && this.selectedUnits.includes(unitToSelect)) {
                    console.log('📭 Deseleccionando unidad específica (selección múltiple)');
                    this.deselectObject(unitToSelect);
                    return;
                }
                
                // Si ya está seleccionado y NO es selección múltiple, deseleccionar todo
                if (!isMultiSelect && this.selectedObject === unitToSelect) {
                    console.log('📭 Deseleccionando unidad ya seleccionada');
                    this.deselectObject();
                    // También deseleccionar modelo actual si existe
                    if (this.currentModelPath) {
                        console.log('📭 Deseleccionando modelo actual');
                        this.currentModelPath = null;
                        this.currentModelName = null;
                        this.currentModelScale = 1.0;
                        this.updateStatus('Modo colocación cancelado', 'info');
                    }
                    return;
                }
                
                this.selectObject(unitToSelect, isMultiSelect);
                return;
            }
        }

        // Si no se hizo click en una unidad, deseleccionar
        console.log('📭 Deseleccionando - no se clickeó en unidad');
        this.deselectObject();
        
        // También deseleccionar modelo actual si existe
        if (this.currentModelPath) {
            console.log('📭 Deseleccionando modelo actual');
            this.currentModelPath = null;
            this.currentModelName = null;
            this.currentModelScale = 1.0;
            this.updateStatus('Modo colocación cancelado', 'info');
        }
    }

    onRightClick(event) {
        console.log('🖱️ Right click detectado - mostrando menú radial');
        event.preventDefault();
        
        // Detectar qué se clickeó usando raycasting
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        let clickedObject = null;
        let clickedTerrain = false;

        // Buscar el primer objeto intersectado que sea relevante
        for (const intersect of intersects) {
            if (intersect.object.userData.type === 'terrain' || intersect.object === this.terrain) {
                clickedTerrain = true;
                console.log('🌍 Right click en terreno detectado');
                break;
            } else if (intersect.object.userData.type === 'unit' || intersect.object.userData.isUnit) {
                clickedObject = intersect.object;
                console.log('🎖️ Right click en unidad detectado:', intersect.object.userData.name);
                break;
            }
        }

        if (clickedTerrain) {
            // Click derecho en terreno
            this.showRadialMenu(event.clientX, event.clientY, 'terrain');
            console.log('🎯 Menú radial: terreno clickeado con right click');
        } else if (clickedObject) {
            // Click derecho en unidad
            this.selectObject(clickedObject);

            // Determinar si es unidad propia o enemiga basada en facción
            const isOwnUnit = clickedObject.userData.faction !== 'enemigo';
            const context = isOwnUnit ? 'unidadPropia' : 'unidadEnemiga';

            this.radialMenu.setContext(context, 'juegoGuerra');
            this.radialMenu.show(event.clientX, event.clientY, context);
            console.log(`🎯 Menú radial: unidad clickeada con right click (${context})`);
        } else {
            // Click derecho en espacio vacío
            this.showRadialMenu(event.clientX, event.clientY, 'terrain');
            console.log('🎯 Menú radial: espacio vacío clickeado con right click');
        }
    }

    onDoubleClick(event) {
        console.log('🎯 DOBLE CLICK DETECTADO en posición:', event.clientX, event.clientY);

        event.preventDefault();

        // Detectar qué se clickeó usando raycasting
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        console.log('📍 Mouse coordinates normalizadas:', this.mouse.x, this.mouse.y);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        console.log('🔍 Intersecciones encontradas:', intersects.length);

        let clickedObject = null;
        let clickedTerrain = false;
        let intersectionPoint = null;

        // Buscar el primer objeto intersectado que sea relevante
        for (const intersect of intersects) {
            console.log('🔍 Objeto intersectado:', intersect.object.name, intersect.object.userData);

            if (intersect.object.userData.type === 'terrain' || intersect.object === this.terrain) {
                clickedTerrain = true;
                intersectionPoint = intersect.point;
                console.log('🌍 Click en terreno detectado');
                break;
            } else if (intersect.object.userData.type === 'unit' || intersect.object.userData.isUnit) {
                clickedObject = intersect.object;
                intersectionPoint = intersect.point;
                console.log('🎖️ Click en unidad detectado:', intersect.object.userData.name);
                break;
            }
        }

        // Configurar contexto del menú radial
        console.log('🎯 Configurando menú radial - Terreno:', clickedTerrain, 'Objeto:', clickedObject ? clickedObject.userData.name : 'ninguno');
        console.log('🎯 Coordenadas del evento:', event.clientX, event.clientY);

        if (clickedTerrain) {
            // Click en terreno
            this.radialMenu.setContext('terreno', 'juegoGuerra');
            this.radialMenu.show(event.clientX, event.clientY, 'terreno');
            console.log('🎯 Menú radial: terreno clickeado');
        } else if (clickedObject) {
            // Click en unidad
            this.selectObject(clickedObject);

            // Determinar si es unidad propia o enemiga basada en facción
            const isOwnUnit = clickedObject.userData.faction !== 'enemigo';
            const context = isOwnUnit ? 'unidadPropia' : 'unidadEnemiga';

            this.radialMenu.setContext(context, 'juegoGuerra');
            this.radialMenu.show(event.clientX, event.clientY, context);
            console.log(`🎯 Menú radial: unidad clickeada (${context})`);
        } else {
            // Click en espacio vacío - mostrar menú de terreno por defecto
            this.radialMenu.setContext('terreno', 'juegoGuerra');
            this.radialMenu.show(event.clientX, event.clientY, 'terreno');
            console.log('🎯 Menú radial: espacio vacío clickeado');
        }
    }

    onKeyDown(event) {
        // Manejar pending orders primero
        if (this.pendingOrder) {
            switch (event.key.toLowerCase()) {
                case 'enter':
                case ' ':
                    if (this.pendingOrder.type === 'move' && this.pendingOrder.waypoints.length > 0) {
                        // Finalizar ruta de movimiento
                        this.giveMoveOrder(this.pendingOrder.unit, this.pendingOrder.waypoints);
                        this.updateStatus(`${this.pendingOrder.unit.userData.name} siguiendo ruta con ${this.pendingOrder.waypoints.length} puntos`, 'success');
                        this.pendingOrder = null;
                        if (this.radialMenu) this.radialMenu.hide();
                        event.preventDefault();
                        return;
                    }
                    break;
                case 'escape':
                    // Cancelar pending order
                    this.pendingOrder = null;
                    this.updateStatus('Operación cancelada', 'warning');
                    if (this.radialMenu) this.radialMenu.hide();
                    event.preventDefault();
                    return;
                    break;
            }
        }

        if (!this.selectedObject) return;

        const moveSpeed = 1;
        const rotateSpeed = 0.1;

        switch (event.key.toLowerCase()) {
            case 'w':
                this.selectedObject.position.z -= moveSpeed;
                break;
            case 's':
                this.selectedObject.position.z += moveSpeed;
                break;
            case 'a':
                this.selectedObject.position.x -= moveSpeed;
                break;
            case 'd':
                this.selectedObject.position.x += moveSpeed;
                break;
            case 'q':
                this.selectedObject.rotation.y += rotateSpeed;
                break;
            case 'e':
                this.selectedObject.rotation.y -= rotateSpeed;
                break;
            case 'delete':
            case 'backspace':
                this.deleteSelected();
                break;
        }

        this.updateSelectionInfo();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Métodos de selección y manipulación
    selectObject(object, multiSelect = false) {
        console.log('🎯 selectObject llamado para:', object.userData.name, 'multiSelect:', multiSelect);
        
        // Si no es selección múltiple, deseleccionar todo
        if (!multiSelect) {
            console.log('📭 Deseleccionando todo antes de nueva selección');
            this.deselectAll();
            this.selectedUnits = [];
        }            // Verificar si el objeto ya está seleccionado
            const isAlreadySelected = this.selectedUnits.includes(object);

            if (multiSelect && isAlreadySelected) {
                // Deseleccionar si ya estaba seleccionado
                this.deselectObject(object);
                this.selectedUnits = this.selectedUnits.filter(unit => unit !== object);
            } else {
                // Seleccionar el objeto
                this.selectedUnits.push(object);
                this.selectedObject = object; // Mantener compatibilidad con código existente
                this.unitType = object.userData && object.userData.faction ? object.userData.faction : 'amigo';

                object.userData.isUnit = true;

                // Agregar a array de unidades si no está
                if (!this.units.includes(object)) {
                    this.units.push(object);
                }

                // Visual feedback de selección
                if (object.material) {
                    object.userData.originalMaterial = object.material;
                    object.material = object.material.clone();
                    object.material.emissive = new THREE.Color(0x004400);
                }

                // Crear anillo de selección
                this.createSelectionRing(object);
            }

            // Actualizar info de selección
            this.updateSelectionInfo();
            if (this.selectedUnits.length === 1) {
                this.updateStatus(`${object.userData.name} seleccionado`, 'info');
            } else {
                this.updateStatus(`${this.selectedUnits.length} unidades seleccionadas`, 'info');
            }
        }

    deselectObject(unit = null) {
        if (unit) {
            // Deseleccionar una unidad específica
            const index = this.selectedUnits.indexOf(unit);
            if (index > -1) {
                this.selectedUnits.splice(index, 1);
            }
            
            // Eliminar anillo/círculo de selección si existe
            if (unit.userData && unit.userData.selectionCircle) {
                unit.remove(unit.userData.selectionCircle);
                unit.userData.selectionCircle = null;
            }
            
            // Restaurar color original del material
            if (unit.userData && unit.userData.originalMaterial) {
                unit.material = unit.userData.originalMaterial;
                unit.userData.originalMaterial = null;
            }
            
            // Restaurar colores emisivos
            unit.traverse(child => {
                if (child.isMesh && child.userData && child.userData.originalEmissive) {
                    child.material.emissive.copy(child.userData.originalEmissive);
                    child.userData.originalEmissive = null;
                }
            });
        } else {
            // Deseleccionar todas las unidades (comportamiento original)
            this.selectedUnits.forEach(selectedUnit => {
                // Eliminar anillo/círculo de selección si existe
                if (selectedUnit.userData && selectedUnit.userData.selectionCircle) {
                    selectedUnit.remove(selectedUnit.userData.selectionCircle);
                    selectedUnit.userData.selectionCircle = null;
                }
                
                // Restaurar material original
                if (selectedUnit.userData && selectedUnit.userData.originalMaterial) {
                    selectedUnit.material = selectedUnit.userData.originalMaterial;
                    selectedUnit.userData.originalMaterial = null;
                }
                
                // Restaurar colores emisivos
                selectedUnit.traverse(child => {
                    if (child.isMesh && child.userData && child.userData.originalEmissive) {
                        child.material.emissive.copy(child.userData.originalEmissive);
                        child.userData.originalEmissive = null;
                    }
                });
            });
            this.selectedUnits = [];
            this.selectedObject = null;
        }
        
        // Ocultar menú radial si está visible y no hay unidades seleccionadas
        if (this.selectedUnits.length === 0 && this.radialMenu && this.radialMenu.isVisible) {
            this.radialMenu.hide();
        }
        this.updateSelectionInfo();
    }

    deselectAll() {
        this.deselectObject(); // Llama a deselectObject sin parámetros para deseleccionar todo
    }

    createSelectionRing(object) {
        console.log('🎯 Creando anillo de selección para:', object.userData.name);
        
        // Eliminar anillo anterior si existe
        if (object.userData.selectionCircle) {
            console.log('🗑️ Eliminando anillo anterior');
            object.remove(object.userData.selectionCircle);
            object.userData.selectionCircle = null;
        }

        // Crear geometría del anillo de selección
        const ringGeometry = new THREE.RingGeometry(1.2, 1.4, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        selectionRing.rotation.x = -Math.PI / 2; // Rotar para que esté plano en el suelo

        // Calcular la posición Y del anillo basada en el bounding box del objeto
        const bbox = new THREE.Box3().setFromObject(object);
        const objectBottom = bbox.min.y;

        // Posicionar el anillo ligeramente por encima de la base del objeto
        // para que sea visible incluso si el objeto está elevado
        selectionRing.position.y = objectBottom - 0.1; // 0.1 unidades por debajo de la base del objeto

        // Agregar al objeto
        object.add(selectionRing);
        object.userData.selectionCircle = selectionRing;

        console.log('✅ Anillo de selección creado y agregado');

        // Animación del anillo (opcional)
        this.animateSelectionRing(selectionRing);
    }

    animateSelectionRing(ring) {
        if (!ring) return;
        
        const animate = () => {
            ring.rotation.z += 0.02;
            if (ring.parent && ring.parent.userData && ring.parent.userData.selectionCircle) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }

    clearSelectionRings() {
        // Limpiar anillos de selección de todas las unidades seleccionadas
        this.selectedUnits.forEach(unit => {
            if (unit.userData && unit.userData.selectionCircle) {
                unit.remove(unit.userData.selectionCircle);
                unit.userData.selectionCircle = null;
            }
        });
    }

    showRadialMenu(x, y, context = 'terrain') {
        console.log('📱 showRadialMenu llamado con coordenadas:', x, y, 'contexto:', context);
        console.log('📱 radialMenu instance:', this.radialMenu);
        
        if (this.radialMenu) {
            console.log('📱 Llamando radialMenu.show()...');
            this.radialMenu.show(x, y, context);
            console.log('✅ radialMenu.show() completado');
        } else {
            console.log('❌ ERROR: radialMenu no está inicializado');
        }
    }

    // ===== SISTEMA DE COMBATE AVANZADO =====

    async loadMilitaryData() {
        try {
            console.log('📊 Cargando datos militares...');
            const response = await fetch('/Client/data/military_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.militaryData = await response.json();
            console.log('✅ Datos militares cargados:', this.militaryData.armamento.length, 'armas');
            
            // Inicializar propiedades de combate para unidades existentes
            this.initializeUnitCombatProperties();
        } catch (error) {
            console.error('❌ Error cargando datos militares:', error);
            // Usar datos por defecto si falla la carga
            this.militaryData = { armamento: [] };
        }
    }

    initializeUnitCombatProperties() {
        // Inicializar propiedades de combate para todas las unidades existentes
        this.units.forEach(unit => {
            this.initializeCombatProperties(unit);
        });
    }

    initializeCombatProperties(unit) {
        if (!unit.userData) unit.userData = {};
        
        // Determinar tipo de unidad basado en el modelo o nombre
        const unitType = this.determineUnitType(unit);
        
        // Asignar propiedades de combate
        const typeData = this.unitTypes[unitType] || this.unitTypes.infanteria;
        unit.userData.maxHealth = typeData.health;
        unit.userData.currentHealth = typeData.health;
        unit.userData.armor = typeData.armor;
        unit.userData.unitType = unitType;
        unit.userData.weapons = typeData.weapons;
        unit.userData.effectiveAgainst = typeData.effectiveAgainst;
        unit.userData.damageTaken = 0; // Contador de impactos
        
        // Propiedades de munición
        unit.userData.maxAmmo = 100; // munición por defecto
        unit.userData.currentAmmo = 100;
        
        console.log(`🛡️ Unidad ${unit.userData.name} inicializada: ${unitType}, HP: ${unit.userData.currentHealth}`);
    }

    determineUnitType(unit) {
        const name = unit.userData.name || unit.name || '';
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('tam') || lowerName.includes('tanque') || lowerName.includes('sk105')) {
            return 'tanque';
        } else if (lowerName.includes('soldado') || lowerName.includes('infanteria') || lowerName.includes('tirador')) {
            return 'infanteria';
        } else if (lowerName.includes('vehiculo') || lowerName.includes('ligero') || lowerName.includes('auto')) {
            return 'vehiculo_ligero';
        } else if (lowerName.includes('mortero') || lowerName.includes('artilleria')) {
            return 'artilleria';
        }
        
        return 'infanteria'; // Por defecto
    }

    getWeaponData(weaponName) {
        if (!this.militaryData || !this.militaryData.armamento) return null;
        
        return this.militaryData.armamento.find(weapon => 
            weapon.nombre.toLowerCase().includes(weaponName.toLowerCase())
        );
    }

    calculateAttackDamage(attacker, target, distance, weaponType = 'primary') {
        const attackerType = attacker.userData.unitType;
        const targetType = target.userData.unitType;
        
        // Obtener datos del arma
        const weaponData = this.getWeaponData(attacker.userData.weapons[0]);
        if (!weaponData) {
            // Daño por defecto si no hay datos del arma
            return { damage: 10, hit: true, weapon: 'default' };
        }

        // Calcular precisión basada en distancia
        const effectiveRange = parseInt(weaponData.alcance_efectivo) || 1000;
        const maxRange = parseInt(weaponData.alcance_maximo) || 2000;
        
        let accuracy = 1.0;
        if (distance > effectiveRange) {
            // Reducir precisión linealmente hasta el alcance máximo
            const rangeDiff = maxRange - effectiveRange;
            const distanceOver = distance - effectiveRange;
            accuracy = Math.max(0.1, 1.0 - (distanceOver / rangeDiff));
        }
        
        // Verificar si el arma es efectiva contra el tipo de objetivo
        const effectiveAgainst = weaponData.efectivo_contra || '';
        const isEffective = effectiveAgainst.toLowerCase().includes(targetType.toLowerCase());
        
        if (!isEffective && targetType === 'tanque' && attackerType !== 'tanque') {
            // Infantería no puede dañar tanques a menos que sea AT
            return { damage: 0, hit: false, weapon: weaponData.nombre, reason: 'ineffective' };
        }

        // Calcular daño base
        let baseDamage = 0;
        switch (weaponData.tipo) {
            case 'Tanque':
                baseDamage = targetType === 'tanque' ? 80 : targetType === 'vehiculo_ligero' ? 50 : 30;
                break;
            case 'Fusil':
                baseDamage = targetType === 'infanteria' ? 15 : targetType === 'vehiculo_ligero' ? 5 : 0;
                break;
            case 'Mortero':
                baseDamage = 25; // Daño de área
                break;
            default:
                baseDamage = 10;
        }

        // Aplicar precisión
        const hit = Math.random() < accuracy;
        const actualDamage = hit ? Math.floor(baseDamage * (0.8 + Math.random() * 0.4)) : 0; // ±20% variación
        
        return {
            damage: actualDamage,
            hit: hit,
            weapon: weaponData.nombre,
            accuracy: accuracy,
            effective: isEffective
        };
    }

    applyDamage(target, damage, attacker) {
        if (!target.userData) return;
        
        // Aplicar reducción de armadura
        const armor = target.userData.armor || 0;
        const actualDamage = Math.max(1, damage - armor);
        
        // Aplicar daño
        target.userData.currentHealth -= actualDamage;
        target.userData.damageTaken += 1;
        
        // Efectos visuales de daño
        this.showDamageEffect(target, actualDamage);
        
        // Verificar si la unidad está destruida
        if (target.userData.currentHealth <= 0 || target.userData.damageTaken >= 3) {
            this.destroyUnit(target);
        } else {
            // Actualizar barra de vida si existe
            this.updateUnitHealthBar(target);
        }
        
        console.log(`💥 ${target.userData.name} recibió ${actualDamage} daño (${target.userData.currentHealth}/${target.userData.maxHealth} HP)`);
        
        return actualDamage;
    }

    showDamageEffect(unit, damage) {
        // Flash de color rojo
        unit.traverse(child => {
            if (child.isMesh && child.material) {
                const originalColor = child.material.color.clone();
                child.material.color.setHex(0xff0000);
                
                setTimeout(() => {
                    if (child.material) {
                        child.material.color.copy(originalColor);
                    }
                }, 200);
            }
        });
        
        // Texto flotante de daño
        this.showDamageText(unit.position.clone(), damage);
        
        // Efecto de escala (sacudida)
        const originalScale = unit.scale.clone();
        unit.scale.multiplyScalar(1.2);
        
        setTimeout(() => {
            unit.scale.copy(originalScale);
        }, 150);
    }

    destroyUnit(unit) {
        console.log(`💀 Unidad ${unit.userData.name} destruida!`);
        
        // Efectos de destrucción
        this.showDestructionEffect(unit);
        
        // Remover del array de unidades
        const unitIndex = this.units.indexOf(unit);
        if (unitIndex > -1) {
            this.units.splice(unitIndex, 1);
        }
        
        // Remover de seleccionados si estaba seleccionado
        const selectedIndex = this.selectedUnits.indexOf(unit);
        if (selectedIndex > -1) {
            this.selectedUnits.splice(selectedIndex, 1);
        }
        
        // Remover de la escena después de un delay para mostrar efectos
        setTimeout(() => {
            if (unit.parent) {
                unit.parent.remove(unit);
            }
        }, 2000);
        
        this.updateSelectionInfo();
        this.updateStatus(`Unidad ${unit.userData.name} destruida!`, 'warning');
    }

    showDestructionEffect(unit) {
        // Crear efecto de explosión simple
        const explosionGeometry = new THREE.SphereGeometry(2, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4500,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(unit.position);
        explosion.position.y += 1;
        
        this.scene.add(explosion);
        
        // Animación de explosión
        let scale = 1;
        const animate = () => {
            scale += 0.1;
            explosion.scale.setScalar(scale);
            explosion.material.opacity -= 0.02;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
            }
        };
        animate();
    }

    updateUnitHealthBar(unit) {
        // Actualizar barra de vida en el modal si está abierto
        const healthBar = document.getElementById('unit-health-bar');
        if (healthBar && unit === this.selectedObject) {
            const healthPercent = (unit.userData.currentHealth / unit.userData.maxHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            
            if (healthPercent > 60) {
                healthBar.style.backgroundColor = '#4CAF50'; // Verde
            } else if (healthPercent > 30) {
                healthBar.style.backgroundColor = '#FF9800'; // Naranja
            } else {
                healthBar.style.backgroundColor = '#F44336'; // Rojo
            }
        }
    }


    changeSelectedUnitFaction(faction) {
        if (this.selectedObject && this.selectedObject.userData) {
            this.selectedObject.userData.faction = faction;
            this.unitType = faction;
            
            // Actualizar visuales
            this.deselectObject();
            this.selectObject(this.selectedObject);
            
            this.updateStatus(`Unidad cambiada a ${faction}`, 'info');
        }
    }

    // Sistema de órdenes
    giveMoveOrder(unit, targetPosition) {
        // Manejar diferentes formatos de targetPosition
        let waypoints = [];
        if (Array.isArray(targetPosition)) {
            // Si es un array de waypoints
            waypoints = targetPosition;
        } else if (targetPosition && typeof targetPosition === 'object') {
            // Si es un solo punto (Vector3 u objeto con x,y,z)
            waypoints = [targetPosition];
        } else {
            console.error('❌ targetPosition inválido:', targetPosition);
            return;
        }

        // Crear orden de movimiento
        const order = {
            type: 'move',
            waypoints: waypoints,
            currentWaypoint: 0,
            timestamp: Date.now(),
            status: 'active'
        };

        // Asignar orden a la unidad
        unit.userData.orders = [order];

        // Actualizar visuales
        this.updateOrderVisual(unit);

        console.log(`📍 Orden de movimiento asignada a ${unit.userData.name}:`, waypoints);
    }

    processPendingOrder(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        switch (this.pendingOrder.type) {
            case 'move':
                // Click simple en terreno ejecuta movimiento inmediato
                const terrainIntersects = this.raycaster.intersectObject(this.terrain);
                if (terrainIntersects.length > 0) {
                    const point = terrainIntersects[0].point;
                    this.giveMoveOrder(this.pendingOrder.unit, [point]);
                    this.updateStatus(`${this.pendingOrder.unit.userData.name} moviéndose al punto seleccionado`, 'success');
                    this.clearSelectionRings(); // Limpiar anillos después de dar orden
                    this.pendingOrder = null;
                    if (this.radialMenu) this.radialMenu.hide();
                } else {
                    this.updateStatus('Haz click en el terreno para mover la unidad', 'info');
                }
                break;

            case 'attack':
                // Buscar si se hizo click en una unidad enemiga
                const targetIntersects = this.raycaster.intersectObjects(this.scene.children, true);
                let target = null;
                for (let intersect of targetIntersects) {
                    if (intersect.object.userData.isUnit && intersect.object !== this.pendingOrder.unit) {
                        target = intersect.object.userData.unitRoot || intersect.object;
                        break;
                    }
                }

                if (target) {
                    // Ejecutar ataque inmediato
                    this.giveAttackOrder(this.pendingOrder.unit, target);
                    this.updateStatus(`${this.pendingOrder.unit.userData.name} atacando a ${target.userData.name}`, 'warning');
                    this.clearSelectionRings(); // Limpiar anillos después de dar orden

                    // Dibujar círculo de visión si existe la función
                    if (typeof this.drawVisionCircle === 'function') {
                        this.drawVisionCircle(target.position);
                    }

                    this.pendingOrder = null;
                    if (this.radialMenu) this.radialMenu.hide();
                } else {
                    // Si no se hizo click en unidad, verificar terreno para movimiento de ataque
                    const terrainIntersects = this.raycaster.intersectObject(this.terrain);
                    if (terrainIntersects.length > 0) {
                        const point = terrainIntersects[0].point;
                        this.giveMoveOrder(this.pendingOrder.unit, [point]);
                        this.updateStatus(`${this.pendingOrder.unit.userData.name} moviéndose a posición de ataque`, 'info');
                        this.pendingOrder = null;
                        if (this.radialMenu) this.radialMenu.hide();
                    } else {
                        this.updateStatus('Haz click en una unidad enemiga para atacar o en terreno para mover', 'info');
                    }
                }
                break;

            case 'patrol':
                const patrolIntersects = this.raycaster.intersectObject(this.terrain);
                if (patrolIntersects.length > 0) {
                    const point = patrolIntersects[0].point;
                    this.pendingOrder.points.push(point);
                    this.updateStatus(`Punto ${this.pendingOrder.points.length} agregado a patrulla`, 'info');
                }
                break;
        }
    }

    giveAttackOrder(unit, target, attackPoint = null) {
        const order = {
            type: 'attack',
            target: target,
            attackPoint: attackPoint,
            timestamp: Date.now(),
            status: 'active'
        };

        unit.userData.orders = [order];
        this.updateOrderVisual(unit);
    }

    givePatrolOrder(unit, points) {
        const order = {
            type: 'patrol',
            points: points,
            currentPoint: 0,
            timestamp: Date.now()
        };

        unit.userData.orders = [order];
        this.updateOrderVisual(unit);
    }

    giveDefendOrder(unit, position) {
        const order = {
            type: 'defend',
            target: position,
            timestamp: Date.now(),
            status: 'active'
        };

        unit.userData.orders = [order];
        this.updateOrderVisual(unit);

        // Visual feedback - escudo azul
        if (unit.material) {
            unit.userData.originalMaterial = unit.material;
            unit.material = unit.material.clone();
            unit.material.emissive = new THREE.Color(0x0080ff); // Azul para defender

            // Restaurar después de 3 segundos
            setTimeout(() => {
                if (unit.userData.originalMaterial) {
                    unit.material = unit.userData.originalMaterial;
                }
            }, 3000);
        }

        this.updateStatus(`${unit.userData.name} asumiendo posición defensiva`, 'info');

        // Ocultar menú después de la acción
        setTimeout(() => {
            if (this.radialMenu) this.radialMenu.hide();
        }, 1000);
    }

    clearOrders(unit) {
        unit.userData.orders = [];
        this.updateOrderVisual(unit);
    }

    updateOrderVisual(unit) {
        const unitId = unit.uuid;
        
        // Limpiar línea anterior
        const existingLine = this.orderLines.find(l => l.userData.unitId === unitId);
        if (existingLine) {
            this.scene.remove(existingLine);
            this.orderLines = this.orderLines.filter(l => l !== existingLine);
        }

        // Crear nueva línea si hay órdenes
        if (unit.userData.orders && unit.userData.orders.length > 0) {
            const order = unit.userData.orders[0];
            let targetPoint = null;

            switch (order.type) {
                case 'move':
                case 'defend':
                    targetPoint = order.target;
                    break;
                case 'attack':
                    targetPoint = order.target.position;
                    break;
                case 'patrol':
                    targetPoint = order.points[order.currentPoint];
                    break;
            }

            if (targetPoint) {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array([
                    unit.position.x, unit.position.y + 1, unit.position.z,
                    targetPoint.x, targetPoint.y + 1, targetPoint.z
                ]);
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

                const material = new THREE.LineBasicMaterial({ 
                    color: order.type === 'attack' ? 0xff0000 : 0x00ff00,
                    linewidth: 3
                });
                const line = new THREE.Line(geometry, material);
                line.userData.unitId = unitId;
                
                this.scene.add(line);
                this.orderLines.push(line);
            }
        }
    }

    assignUnitProperties(model, name) {
        const nameLower = name.toLowerCase();

        // Asignar tipo de unidad basado en el nombre
        if (nameLower.includes('m113') || nameLower.includes('apc') || nameLower.includes('vehicle')) {
            model.userData.unitType = 'Vehículo Blindado';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 50;
            model.userData.maxAmmo = 50;
        } else if (nameLower.includes('soldier') || nameLower.includes('infantry') || nameLower.includes('troop')) {
            model.userData.unitType = 'Infantería';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 30;
            model.userData.maxAmmo = 30;
        } else if (nameLower.includes('tank') || nameLower.includes('leopard') || nameLower.includes('abrams')) {
            model.userData.unitType = 'Tanque';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 40;
            model.userData.maxAmmo = 40;
        } else {
            model.userData.unitType = 'Unidad Desconocida';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 'N/A';
            model.userData.maxAmmo = 'N/A';
        }

        // Determinar si es amigo o enemigo desde el UI
        const typeRadio = document.querySelector('input[name="unitType"]:checked');
        if (typeRadio) {
            model.userData.faction = typeRadio.value; // 'amigo' o 'enemigo'
        } else {
            model.userData.faction = 'amigo'; // por defecto amigo
        }

        // Propiedades comunes
        model.userData.name = name;
        model.userData.orders = [];
        model.userData.isUnit = true;

        // Agregar a array de unidades
        this.units.push(model);

        console.log(`Unidad ${name} asignada como ${model.userData.unitType} (${model.userData.faction})`);
    }

    // Funciones utilitarias
    updateStatus(message, type = 'info') {
        if (this.statusDiv) {
            this.statusDiv.innerHTML = `[${type.toUpperCase()}] ${message}`;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    updateSelectionInfo() {
        if (!this.selectionInfo) return;

        if (this.selectedObject) {
            const pos = this.selectedObject.position;
            const rot = this.selectedObject.rotation;
            const scale = this.selectedObject.scale;
            const unitType = this.selectedObject.userData.unitType || 'Desconocido';
            const unitName = this.selectedObject.userData.name || 'Sin nombre';
            const health = this.selectedObject.userData.health || 100;
            const ammo = this.selectedObject.userData.ammo || 'N/A';
            const faction = this.selectedObject.userData.faction || 'amigo';

            // Validar que pos es un objeto Vector3
            let posStr = '(N/A)';
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
                posStr = `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`;
            }

            // Validar que activeOrder.target es Vector3
            const unitOrders = this.orders.get(this.selectedObject.uuid) || [];
            const activeOrder = unitOrders.find(order => order.status === 'active');
            let orderInfo = '';
            if (activeOrder && activeOrder.target && typeof activeOrder.target.x === 'number' && typeof activeOrder.target.z === 'number') {
                orderInfo = `<span style="color: #00ff00;">Orden: Mover a (${activeOrder.target.x.toFixed(1)}, ${activeOrder.target.z.toFixed(1)})</span><br>`;
            }

            this.selectionInfo.innerHTML = `
                <div style="border: 2px solid #00ff00; padding: 8px; background: rgba(0,255,0,0.1); border-radius: 4px;">
                    <strong style="color: #00ff00;">${unitName}</strong><br>
                    <span style="color: #cccccc;">Tipo: ${unitType}</span><br>
                    <span style="color: ${faction === 'enemigo' ? '#ff6666' : '#6666ff'};">Facción: ${faction.toUpperCase()}</span><br>
                    <span style="color: #cccccc;">Pos: ${posStr}</span><br>
                    <span style="color: #cccccc;">Rot: (${(rot.y * 180/Math.PI).toFixed(1)}°)</span><br>
                    <span style="color: #ff6666;">Salud: ${health}%</span><br>
                    <span style="color: #6666ff;">Munición: ${ammo}</span><br>
                    ${orderInfo}
                    <span style="color: #ffff66; font-size: 12px;">WASD: mover | Q/E: rotar | Click derecho: orden de movimiento</span>
                </div>
            `;
        } else {
            this.selectionInfo.innerHTML = `
                <div style="border: 1px solid #666666; padding: 8px; background: rgba(100,100,100,0.1); border-radius: 4px;">
                    Ningún objeto seleccionado<br>
                    <span style="color: #cccccc; font-size: 12px;">Click en un modelo para seleccionarlo | Click derecho en terreno para dar órdenes</span>
                </div>
            `;
        }
    }

    // Mostrar información detallada de la unidad
    showUnitInfo(unit) {
        if (!unit) return;

        const modal = document.getElementById('unit-info-modal');
        const title = document.getElementById('unit-info-title');
        const content = document.getElementById('unit-info-content');

        if (!modal || !title || !content) {
            console.warn('Modal de información de unidad no encontrado');
            return;
        }

        // Obtener datos de la unidad
        const unitData = unit.userData;
        const name = unitData.name || 'Sin nombre';
        const unitType = unitData.unitType || 'Desconocido';
        const faction = unitData.faction || 'amigo';
        const health = unitData.health || 100;
        const maxHealth = unitData.maxHealth || 100;
        const ammo = unitData.currentAmmo !== undefined ? unitData.currentAmmo : (unitData.ammo || 0);
        const maxAmmo = unitData.maxAmmo || 100;
        const position = unit.position;

        // Actualizar título
        title.textContent = `Información: ${name}`;

        // Crear contenido del modal
        content.innerHTML = `
            <div class="unit-stat">
                <span class="unit-stat-label">Tipo:</span>
                <span class="unit-stat-value">${unitType}</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Facción:</span>
                <span class="unit-stat-value" style="color: ${faction === 'enemigo' ? '#ff6666' : '#6666ff'};">${faction.toUpperCase()}</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Salud:</span>
                <span class="unit-stat-value">${health}/${maxHealth}</span>
            </div>
            <div class="health-bar">
                <div class="health-fill ${health < 30 ? 'low' : ''}" style="width: ${(health / maxHealth) * 100}%"></div>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Munición:</span>
                <span class="unit-stat-value">${ammo}/${maxAmmo}</span>
            </div>
            <div class="ammo-bar">
                <div class="ammo-fill" style="width: ${typeof ammo === 'number' ? (ammo / maxAmmo) * 100 : 100}%"></div>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Posición:</span>
                <span class="unit-stat-value">(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Rotación:</span>
                <span class="unit-stat-value">${(unit.rotation.y * 180 / Math.PI).toFixed(1)}°</span>
            </div>
            ${unitData.orders && unitData.orders.length > 0 ?
                `<div class="unit-stat">
                    <span class="unit-stat-label">Orden actual:</span>
                    <span class="unit-stat-value">${unitData.orders[0].type.toUpperCase()}</span>
                </div>` : ''
            }
        `;

        // Mostrar modal
        modal.style.display = 'block';

        // Configurar cierre del modal
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // Cerrar al hacer click fuera del modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        this.updateStatus(`Información de ${name} mostrada`, 'info');
    }

    showEnemyInfo(unit) {
        if (!unit) return;

        const modal = document.getElementById('unit-info-modal');
        const title = document.getElementById('unit-info-title');
        const content = document.getElementById('unit-info-content');

        if (!modal || !title || !content) {
            console.warn('Modal de información de unidad no encontrado');
            return;
        }

        // Obtener datos de la unidad enemiga (información limitada)
        const unitData = unit.userData;
        const name = unitData.name || 'Unidad Desconocida';
        const unitType = unitData.unitType || 'Desconocido';
        const faction = unitData.faction || 'enemigo';
        const health = unitData.health || 100;
        const maxHealth = unitData.maxHealth || 100;
        const position = unit.position;

        // Actualizar título
        title.textContent = `Información Enemiga: ${name}`;

        // Crear contenido del modal con información limitada
        content.innerHTML = `
            <div class="unit-stat">
                <span class="unit-stat-label">Tipo estimado:</span>
                <span class="unit-stat-value">${unitType}</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Facción:</span>
                <span class="unit-stat-value" style="color: #ff6666;">ENEMIGA</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Estado aproximado:</span>
                <span class="unit-stat-value">${health > 70 ? 'Operativo' : health > 30 ? 'Dañado' : 'Crítico'}</span>
            </div>
            <div class="health-bar">
                <div class="health-fill ${health < 30 ? 'low' : ''}" style="width: ${(health / maxHealth) * 100}%"></div>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Posición aproximada:</span>
                <span class="unit-stat-value">(${position.x.toFixed(0)}, ${position.z.toFixed(0)})</span>
            </div>
            <div class="unit-stat">
                <span class="unit-stat-label">Rotación:</span>
                <span class="unit-stat-value">${(unit.rotation.y * 180 / Math.PI).toFixed(1)}°</span>
            </div>
            <div class="enemy-info-notice">
                <small style="color: #ff6666; font-style: italic;">
                    ℹ️ Información limitada disponible para unidades enemigas
                </small>
            </div>
        `;

        // Mostrar modal
        modal.style.display = 'block';

        // Configurar cierre del modal
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }

        // Cerrar al hacer click fuera del modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        this.updateStatus(`Información enemiga de ${name} mostrada`, 'info');
    }

    /**
     * Crea un terreno procedural con el tipo especificado
     * @param {string} mapType - Tipo de terreno: 'plano', 'colinas', 'montanas', 'desierto'
     */
    createTerrain(mapType = 'plano') {
        console.log('🏔️ Creando terreno tipo:', mapType);
        
        if (this.terrain) {
            console.log('🗑️ Removiendo terreno anterior de la escena...');
            this.scene.remove(this.terrain);
            console.log('✅ Terreno anterior removido');
        } else {
            console.log('ℹ️ No hay terreno anterior que remover');
        }

    const terrainGeometry = new THREE.PlaneGeometry(120, 120, 24, 24); // Plano más grande y más subdivisiones
        const vertices = terrainGeometry.attributes.position.array;
        
        // Configurar color y altura según el tipo de mapa
        let color = 0x3a5f3a; // Verde por defecto
        let heightMultiplier = 3;
        let baseHeight = 0;
        
        switch (mapType) {
            case 'plano':
                color = 0x228B22; // Verde bosque en lugar de azul
                heightMultiplier = 0.2;
                baseHeight = 0;
                break;
            case 'colinas':
                color = 0x228B22; // Verde bosque brillante
                heightMultiplier = 8.0; // Mucho más alto para probar relieve
                baseHeight = 0;
                break;
            case 'montanas':
                color = 0x2F4F4F; // Gris oscuro verdoso
                heightMultiplier = 20.0; // Mucho más alto para probar relieve
                baseHeight = 0.5;
                break;
            case 'desierto':
                color = 0xFFD700; // Oro brillante
                heightMultiplier = 4.0; // Mucho más alto para probar relieve
                baseHeight = 0;
                break;
        }

        // Generar relieve según el tipo de mapa
        if (mapType === 'plano') {
            // Para plano, no modificar vértices
        } else {
            // Algoritmo de relieve suave basado en ruido
            const roughness = 0.15 * heightMultiplier;
            const base = baseHeight;
            const noise = (x, z, frequency = 1, amplitude = 1) => {
                return (Math.sin(x * frequency * 0.01) * Math.cos(z * frequency * 0.01) +
                       Math.sin(x * frequency * 0.02 + 1) * Math.cos(z * frequency * 0.02 + 1) * 0.5 +
                       Math.sin(x * frequency * 0.04 + 2) * Math.cos(z * frequency * 0.04 + 2) * 0.25) * amplitude;
            };

            for (let i = 0; i < vertices.length; i += 3) {
                const x = vertices[i];
                const z = vertices[i + 1];
                const distance = Math.sqrt(x * x + z * z) * 0.01;
                vertices[i + 2] = Math.sin(distance) * heightMultiplier + Math.random() * 2 - 1;
            }
        }
        
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();

        // Log de los primeros vértices y rango Y para depuración
        let debugVerts = [];
        let minY = Infinity, maxY = -Infinity;
        for (let i = 0; i < Math.min(vertices.length, 30); i += 3) {
            debugVerts.push({x: vertices[i], y: vertices[i+1], z: vertices[i+2]});
            if (vertices[i+1] < minY) minY = vertices[i+1];
            if (vertices[i+1] > maxY) maxY = vertices[i+1];
        }
        console.log('🔎 Primeros vértices del terreno:', debugVerts);
        console.log('📊 Rango de altura Y:', minY, maxY);

        const terrainMaterial = new THREE.MeshLambertMaterial({
            color: color,
            transparent: false,
            wireframe: false,
            side: THREE.DoubleSide
        });

        this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        this.terrain.rotation.x = -Math.PI / 2; // Rotar para que esté horizontal en XZ
        this.terrain.position.set(0, 0, 0); // Asegurar posición en origen
        this.terrain.scale.set(1, 1, 1); // Asegurar escala normal
        this.terrain.receiveShadow = true;
        this.terrain.name = 'terrain';
        this.terrain.userData = { type: 'terrain', selectable: true };

        console.log('🌍 Terreno mesh creado con color:', '#' + color.toString(16).padStart(6, '0'), 'tipo:', mapType);
        console.log('📍 Posición del terreno:', this.terrain.position);
        console.log('🔄 Rotación del terreno:', this.terrain.rotation);
        console.log('🎨 Material del terreno:', this.terrain.material);
        console.log('📐 Dimensiones del terreno:', this.terrain.geometry.parameters);

        this.scene.add(this.terrain);
        console.log('✅ Terreno agregado a la escena. Hijos de la escena:', this.scene.children.length);
        
        this.updateStatus(`Terreno ${mapType} creado`, 'success');
        console.log('🏔️ Terreno creado exitosamente');
    }

    clearTerrain() {
        if (this.terrain) {
            this.scene.remove(this.terrain);
            this.terrain = null;
            this.updateStatus('Terreno eliminado', 'success');
        }
    }

    loadModel(path, name, scale = 1.0) {
        this.currentModelPath = path;
        this.currentModelName = name;
        this.currentModelScale = scale;
        this.updateStatus(`Modelo ${name} seleccionado. Click en el terreno para colocar.`, 'success');

        // Actualizar UI
        document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
        if (window.event && window.event.target) {
            window.event.target.classList.add('active');
        }
    }

    placeModelAtPosition(position, path = this.currentModelPath, name = this.currentModelName, scale = this.currentModelScale) {
        if (!path && !this.currentModelPath) return;

        if (path === 'folder_model' || this.currentModelPath === 'folder_model') {
            this.placeModelFromFolder(position, name || this.currentModelName);
            return;
        }

        this.updateStatus(`Cargando ${name}...`);

        const loader = new THREE.GLTFLoader();

        loader.load(path,
            (gltf) => {
                const model = gltf.scene;

                model.position.copy(position);
                model.position.y += 2;
                model.scale.setScalar(scale);

                // Sanitizar geometrías para eliminar NaN
                model.traverse((child) => {
                    if (child.isMesh && child.geometry && child.geometry.attributes.position) {
                        const positions = child.geometry.attributes.position.array;
                        for (let i = 0; i < positions.length; i++) {
                            if (isNaN(positions[i])) {
                                positions[i] = 0;
                            }
                        }
                        child.geometry.attributes.position.needsUpdate = true;
                    }
                });

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Asignar propiedades de unidad a cada mesh para selección
                        child.userData.isUnit = true;
                        child.userData.unitName = name;
                        child.userData.unitRoot = model;
                        child.userData.selectable = true;

                        if (!child.material.map) {
                            if (name.toLowerCase().includes('tank') || name.toLowerCase().includes('m113')) {
                                child.material = this.materialTypes.vehicle();
                            } else if (name.toLowerCase().includes('soldier') || name.toLowerCase().includes('soldado')) {
                                child.material = this.materialTypes.soldier();
                            } else if (name.toLowerCase().includes('humvee')) {
                                child.material = this.materialTypes.metal();
                            } else {
                                child.material = this.materialTypes.default();
                            }
                        }
                    }
                });

                // Leer tipo de unidad desde el radio button
                const typeRadio = document.querySelector('input[name="unitType"]:checked');
                const unitType = typeRadio ? typeRadio.value : 'amigo';
                model.userData = {
                    name: name,
                    path: path,
                    placedAt: new Date().toISOString(),
                    selectable: true,
                    type: 'model',
                    isUnit: true,
                    unitType: unitType
                };

                // Agregar propiedades específicas de unidad
                this.assignUnitProperties(model, name);

                this.scene.add(model);
                this.placedModels.push(model);

                this.updateStatus(`${name} colocado exitosamente`, 'success');

                // Limpiar selección y modo colocación
                this.currentModelPath = null;
                this.currentModelName = null;
                this.currentModelScale = 1.0;
                document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
                this.isPlacingModel = false;
                // Deseleccionar objeto si estaba en modo colocación
                this.selectedObject = null;
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(1);
                this.updateStatus(`Cargando ${name}... ${percent}%`);
            },
            (error) => {
                console.error('Error cargando modelo:', error);
                this.updateStatus(`Error cargando ${name}`, 'error');

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
                    type: 'error',
                    isUnit: true
                };
                // Agregar propiedades específicas de unidad al fallback
                this.assignUnitProperties(fallback, name);
                
                this.scene.add(fallback);
                this.placedModels.push(fallback);
                
                // Resetear flag de colocación
                this.isPlacingModel = false;
            }
        );
    }

    assignUnitProperties(model, name) {
        const nameLower = name.toLowerCase();

        if (nameLower.includes('m113') || nameLower.includes('apc')) {
            model.userData.unitType = 'Vehículo Blindado';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 200;
            model.userData.maxAmmo = 200;
            model.userData.speed = 45; // km/h
            model.userData.armor = 'Medio';
        } else if (nameLower.includes('tam') || nameLower.includes('tank')) {
            model.userData.unitType = 'Tanque';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 40;
            model.userData.maxAmmo = 40;
            model.userData.speed = 65;
            model.userData.armor = 'Pesado';
        } else if (nameLower.includes('humvee') || nameLower.includes('jeep')) {
            model.userData.unitType = 'Vehículo Ligero';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 100;
            model.userData.maxAmmo = 100;
            model.userData.speed = 80;
            model.userData.armor = 'Ligero';
        } else if (nameLower.includes('soldier') || nameLower.includes('soldado') || nameLower.includes('fsb') || nameLower.includes('operator')) {
            model.userData.unitType = 'Infantería';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 30;
            model.userData.maxAmmo = 30;
            model.userData.speed = 5; // km/h (velocidad de marcha)
            model.userData.armor = 'Ninguno';
        } else {
            model.userData.unitType = 'Unidad Desconocida';
            model.userData.health = 100;
            model.userData.maxHealth = 100;
            model.userData.ammo = 'N/A';
            model.userData.speed = 0;
            model.userData.armor = 'Desconocido';
        }

        // Determinar si es amigo o enemigo desde el UI
        const typeRadio = document.querySelector('input[name="unitType"]:checked');
        if (typeRadio) {
            model.userData.faction = typeRadio.value; // 'amigo' o 'enemigo'
        } else {
            model.userData.faction = 'amigo'; // por defecto amigo
        }

        // Propiedades comunes
        model.userData.name = name;
        model.userData.orders = [];
        model.userData.isUnit = true;

        // Agregar a array de unidades
        this.units.push(model);

        console.log(`Unidad ${name} asignada como ${model.userData.unitType} (${model.userData.faction})`);
    }



    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }



    onDoubleClick(event) {
        console.log('🎯 DOBLE CLICK DETECTADO en posición:', event.clientX, event.clientY);
        event.preventDefault();

        // Calcular coordenadas del mouse para raycasting
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.camera);

        // Verificar si se hizo click en el terreno
        const terrainIntersects = this.raycaster.intersectObject(this.terrain);

        if (terrainIntersects.length > 0) {
            console.log('🎯 Doble click en terreno detectado');
            
            // Si hay un modelo seleccionado, colocarlo primero
            if (this.currentModelPath) {
                const position = terrainIntersects[0].point;
                console.log('📦 Colocando modelo seleccionado en posición:', position);
                this.placeModelAtPosition(position);
            }
            
            // Mostrar menú radial para terreno
            this.showRadialMenu(event.clientX, event.clientY, 'terrain');
            return;
        }

        // Verificar si se hizo click en un modelo
        const modelIntersects = this.raycaster.intersectObjects(this.scene.children, true);

        for (const intersect of modelIntersects) {
            if (intersect.object.userData && (intersect.object.userData.isUnit || intersect.object.userData.type === 'model')) {
                console.log('🎯 Doble click en modelo detectado:', intersect.object);
                // Si es una unidad, seleccionar el root del modelo
                if (intersect.object.userData.unitRoot) {
                    this.selectedObject = intersect.object.userData.unitRoot;
                } else {
                    this.selectedObject = intersect.object;
                }
                this.showRadialMenu(event.clientX, event.clientY, 'model');
                return;
            }
        }

        console.log('🎯 Doble click en área vacía - no se muestra menú');
        this.updateStatus('Haz doble click en el terreno o en un modelo', 'info');
    }

    onRightClick(event) {
        if (this.pendingOrder && this.pendingOrder.type === 'patrol' && this.pendingOrder.points.length > 0) {
            // Finalizar patrulla
            this.givePatrolOrder(this.pendingOrder.unit, this.pendingOrder.points);
            this.updateStatus(`${this.pendingOrder.unit.userData.name} comenzando patrulla con ${this.pendingOrder.points.length} puntos`, 'success');
            this.pendingOrder = null;
            return;
        }

        // Lógica existente de movimiento
        if (this.selectedObject) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.terrain);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.giveMoveOrder(this.selectedObject, point);
                this.clearSelectionRings(); // Limpiar anillos después de dar orden
                this.updateStatus(`${this.selectedObject.userData.name} moviéndose`, 'success');
            }
        }
    }

    givePatrolOrder(unit, points) {
        const order = {
            type: 'patrol',
            points: points,
            currentPoint: 0,
            timestamp: Date.now()
        };

        unit.userData.orders = [order];
        this.updateOrderVisual(unit);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown(event) {
        if (!this.selectedObject) return;

        const moveSpeed = 0.5;
        const rotateSpeed = 0.1;

        switch(event.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                this.deleteSelected();
                break;
            case 'w':
            case 'arrowup':
                this.moveSelected(0, 0, -moveSpeed);
                break;
            case 's':
            case 'arrowdown':
                this.moveSelected(0, 0, moveSpeed);
                break;
            case 'a':
            case 'arrowleft':
                this.moveSelected(-moveSpeed, 0, 0);
                break;
            case 'd':
            case 'arrowright':
                this.moveSelected(moveSpeed, 0, 0);
                break;
            case 'q':
                this.rotateSelected('y', rotateSpeed);
                break;
            case 'e':
                this.rotateSelected('y', -rotateSpeed);
                break;
            case '+':
            case '=':
                this.scaleSelected(1.1);
                break;
            case '-':
                this.scaleSelected(0.9);
                break;
            case 'r':
                // Reset rotation
                this.selectedObject.rotation.set(0, 0, 0);
                this.updateSelectionInfo();
                break;
        }
    }


    selectObject(object) {
        // Limpiar selección anterior
        if (this.selectedObject) {
            this.selectedObject.traverse(child => {
                if (child.userData && child.userData.selectionCircle) {
                    child.remove(child.userData.selectionCircle);
                    child.userData.selectionCircle = null;
                }
                if (child.userData && child.userData.visionCircle) {
                    child.remove(child.userData.visionCircle);
                    child.userData.visionCircle = null;
                }
                if (child.userData && child.userData.moveArrow) {
                    this.scene.remove(child.userData.moveArrow);
                    child.userData.moveArrow = null;
                }
                if (child.isMesh && child.userData.originalEmissive) {
                    child.material.emissive.copy(child.userData.originalEmissive);
                }
            });
        }

        this.selectedObject = object;

        if (this.selectedObject) {
            // Determinar si es amigo o enemigo
            this.unitType = this.selectedObject.userData.faction || 'amigo';
            // Crear anillo de selección debajo del objeto (solo uno)
            let bbox = new THREE.Box3().setFromObject(this.selectedObject);
            let size = bbox.getSize(new THREE.Vector3());
            let radius = Math.max(size.x, size.z) * 0.6 || 1.5;
            const ringGeometry = new THREE.RingGeometry(radius * 0.8, radius, 48);
            // Azul para amigo, rojo para enemigo
            const color = this.unitType === 'enemigo' ? 0xff2222 : 0x2196f3;
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            });
            const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
            selectionRing.rotation.x = -Math.PI / 2;
            selectionRing.position.set(0, bbox.min.y - this.selectedObject.position.y - 0.01, 0);
            selectionRing.renderOrder = 999;
            selectionRing.name = 'selectionRing';
            this.selectedObject.add(selectionRing);
            this.selectedObject.userData.selectionCircle = selectionRing;

            this.selectedObject.traverse(child => {
                if (child.isMesh && child.material) {
                    if (!child.userData.originalEmissive && child.material.emissive) {
                        child.userData.originalEmissive = child.material.emissive.clone();
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x444444);
                    }
                }
            });
            // Mostrar menú radial según tipo
            if (this.radialMenu) {
                const screenPos = this.worldToScreen(this.selectedObject.position);
                let context = this.unitType === 'enemigo' ? 'unidadEnemiga' : 'unidadPropia';
                this.radialMenu.setContext(context, 'juegoGuerra');
                this.radialMenu.show(screenPos.x, screenPos.y, context);
            }
        }

        this.updateSelectionInfo();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Calcular delta time para animaciones
        const currentTime = performance.now();
        const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
        this.lastTime = currentTime;

        if (this.controls) {
            this.controls.update();
        }

        // Procesar órdenes activas
        this.processOrders(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }

    // Funciones de manipulación de objetos
    moveSelected(deltaX, deltaY, deltaZ) {
        if (!this.selectedObject) return;

        this.selectedObject.position.x += deltaX;
        this.selectedObject.position.y += deltaY;
        this.selectedObject.position.z += deltaZ;

        this.updateSelectionInfo();
    }

    rotateSelected(axis, angle) {
        if (!this.selectedObject) return;
        this.selectedObject.rotation[axis] += angle;
        this.updateSelectionInfo();
    }

    scaleSelected(factor) {
        if (!this.selectedObject) return;
        this.selectedObject.scale.multiplyScalar(factor);
        this.updateSelectionInfo();
    }

    deleteSelected() {
        if (!this.selectedObject) return;

        this.scene.remove(this.selectedObject);
        const index = this.placedModels.indexOf(this.selectedObject);
        if (index > -1) {
            this.placedModels.splice(index, 1);
        }

        // Limpiar órdenes del objeto eliminado
        this.clearOrders(this.selectedObject);

        this.updateStatus(`${this.selectedObject.userData.name} eliminado`, 'success');
        this.selectedObject = null;
        this.updateSelectionInfo();
    }



    clearOrders(unit) {
        const unitId = unit.uuid;
        this.orders.delete(unitId);
        this.clearOrderVisuals(unit);
    }

    processOrders(deltaTime) {
        // Procesar órdenes de todas las unidades
        this.units.forEach(unit => {
            if (!unit.userData.orders || unit.userData.orders.length === 0) return;

            const currentOrder = unit.userData.orders[0];
            console.log(`📋 Procesando orden para ${unit.userData.name}:`, currentOrder.type, currentOrder.status);

            switch (currentOrder.type) {
                case 'move':
                    if (currentOrder.status === 'active') {
                        this.processMoveOrder(unit, currentOrder, deltaTime);
                    }
                    break;
                case 'attack':
                    if (currentOrder.status === 'active') {
                        console.log(`🎯 Procesando ataque de ${unit.userData.name} a ${currentOrder.target?.userData?.name}`);
                        this.processAttackOrder(unit, currentOrder, deltaTime);
                    }
                    break;
                case 'defend':
                    if (currentOrder.status === 'active') {
                        this.processDefendOrder(unit, currentOrder, deltaTime);
                    }
                    break;
                case 'patrol':
                    if (currentOrder.status === 'active') {
                        this.processPatrolOrder(unit, currentOrder, deltaTime);
                    }
                    break;
                case 'observe':
                    if (currentOrder.status === 'active') {
                        this.processObserveOrder(unit, currentOrder, deltaTime);
                    }
                    break;
                // Otras órdenes avanzadas pueden procesarse aquí cuando sea necesario
            }
        });
    }

    processMoveOrder(unit, order, deltaTime = 0.016) {
        const moveSpeed = 15.0; // Unidades por segundo (aumentado para movimiento más realista)
        let target;

        // Determinar el objetivo actual
        if (order.waypoints && order.waypoints.length > 0) {
            // Movimiento con waypoints
            target = order.waypoints[order.currentWaypoint];
            if (!target) {
                // No hay más waypoints
                order.status = 'completed';
                this.updateOrderVisual(unit);
                this.updateStatus(`${unit.userData.name} completó la ruta`, 'success');
                return;
            }
        } else if (order.target) {
            // Movimiento simple
            target = order.target;
        } else {
            // No hay objetivo
            order.status = 'completed';
            return;
        }

        const direction = new THREE.Vector3()
            .subVectors(target, unit.position)
            .normalize();

        const distance = unit.position.distanceTo(target);

        if (distance > 0.1) {
            // Mover hacia el objetivo
            unit.position.addScaledVector(direction, moveSpeed * deltaTime);

            // Rotar hacia la dirección de movimiento
            const targetRotation = Math.atan2(direction.x, direction.z);
            unit.rotation.y = targetRotation;
        } else {
            // Llegó al waypoint actual
            if (order.waypoints && order.waypoints.length > 0) {
                // Pasar al siguiente waypoint
                order.currentWaypoint++;
                if (order.currentWaypoint >= order.waypoints.length) {
                    // Ruta completada
                    order.status = 'completed';
                    this.updateOrderVisual(unit);
                    this.updateStatus(`${unit.userData.name} completó la ruta`, 'success');
                } else {
                    // Continuar con el siguiente waypoint
                    this.updateStatus(`${unit.userData.name} llegando a punto ${order.currentWaypoint}/${order.waypoints.length}`, 'info');
                }
            } else {
                // Movimiento simple completado
                order.status = 'completed';
                this.updateOrderVisual(unit);
                this.updateStatus(`${unit.userData.name} llegó al destino`, 'success');
            }
        }
    }

    processAttackOrder(unit, order, deltaTime = 0.016) {
        if (!order.target) return;

        // Calcular distancia al objetivo
        const distance = unit.position.distanceTo(order.target.position);
        
        // Obtener rango de ataque del arma
        const weaponData = this.getWeaponData(unit.userData.weapons ? unit.userData.weapons[0] : 'FAL');
        const attackRange = weaponData ? parseInt(weaponData.alcance_maximo) || 2000 : 100; // Convertir a unidades del juego
        
        // Convertir de metros a unidades del juego (aproximadamente 1 unidad = 10 metros)
        const attackRangeUnits = attackRange / 10;

        // Si hay un punto de ataque específico, moverse hacia él primero
        let targetPosition = order.target.position;
        if (order.attackPoint) {
            targetPosition = order.attackPoint;
        }

        if (distance > attackRangeUnits) {
            // Moverse hacia el objetivo o punto de ataque
            const direction = new THREE.Vector3()
                .subVectors(targetPosition, unit.position)
                .normalize();

            unit.position.addScaledVector(direction, 3.0 * deltaTime); // Velocidad de aproximación

            // Rotar hacia el objetivo
            const targetRotation = Math.atan2(direction.x, direction.z);
            unit.rotation.y = targetRotation;
        } else {
            // En rango de ataque - verificar si estamos en posición de ataque correcta
            if (order.attackPoint) {
                // Ya estamos en el punto de ataque, ahora apuntar al objetivo real
                const directionToTarget = new THREE.Vector3()
                    .subVectors(order.target.position, unit.position)
                    .normalize();
                const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
                unit.rotation.y = targetRotation;
            }

            // Ejecutar ataque usando el nuevo sistema de combate
            if (!order.lastAttack || Date.now() - order.lastAttack > 2000) { // Ataque cada 2 segundos
                order.lastAttack = Date.now();

                // Verificar munición antes de atacar
                const currentAmmo = unit.userData.municion || 0;
                if (currentAmmo <= 0) {
                    this.updateStatus(`🚫 ${unit.userData.name} sin munición!`, 'error');
                    return;
                }

                // Calcular daño usando el sistema avanzado
                const attackResult = this.calculateAttackDamage(unit, order.target, distance * 10, 'primary'); // Convertir distancia de vuelta a metros
                
                if (attackResult.hit) {
                    // Consumir munición
                    unit.userData.municion = Math.max(0, currentAmmo - 1);
                    
                    // Aplicar daño al objetivo
                    const actualDamage = this.applyDamage(order.target, attackResult.damage, unit);
                    
                    this.updateStatus(`💥 ${unit.userData.name} atacó a ${order.target.userData.name} con ${attackResult.weapon} (${actualDamage} daño, ${unit.userData.municion} munición)`, 'warning');
                    
                    // Visual feedback de ataque en el atacante
                    if (unit.material) {
                        const originalEmissive = unit.material.emissive.clone();
                        unit.material.emissive.setHex(0xff0000);

                        setTimeout(() => {
                            unit.material.emissive.copy(originalEmissive);
                        }, 200);
                    }
                    
                    // Actualizar panel de info si la unidad está seleccionada
                    if (this.selectedObject === order.target) {
                        this.updateSelectionInfo();
                    }
                } else {
                    // Fallo del ataque
                    const reason = attackResult.reason || 'fallo';
                    this.updateStatus(`❌ ${unit.userData.name} falló el ataque a ${order.target.userData.name} (${reason})`, 'info');
                    
                    // Consumir munición igual (tiro fallido)
                    unit.userData.currentAmmo = currentAmmo - 1;
                }
            }
        }
    }

    processDefendOrder(unit, order, deltaTime) {
        // En modo defensivo, la unidad se mantiene en posición
        // Podríamos agregar lógica de rotación para vigilar amenazas cercanas
        const vigilanceRange = 15.0;

        // Buscar enemigos cercanos
        let nearestEnemy = null;
        let nearestDistance = vigilanceRange;

        this.units.forEach(otherUnit => {
            if (otherUnit !== unit && otherUnit.userData.faction === 'enemigo') {
                const distance = unit.position.distanceTo(otherUnit.position);
                if (distance < nearestDistance) {
                    nearestEnemy = otherUnit;
                    nearestDistance = distance;
                }
            }
        });

        if (nearestEnemy) {
            // Apuntar hacia el enemigo más cercano
            const direction = new THREE.Vector3()
                .subVectors(nearestEnemy.position, unit.position)
                .normalize();

            const targetRotation = Math.atan2(direction.x, direction.z);
            unit.rotation.y = THREE.MathUtils.lerp(unit.rotation.y, targetRotation, 0.05); // Rotación suave
        }
    }

    processPatrolOrder(unit, order, deltaTime) {
        if (!order.points || order.points.length === 0) return;

        const currentPoint = order.points[order.currentPoint || 0];
        if (!currentPoint) return;

        const distance = unit.position.distanceTo(currentPoint);

        if (distance > 0.5) {
            // Mover hacia el punto actual
            const direction = new THREE.Vector3()
                .subVectors(currentPoint, unit.position)
                .normalize();

            unit.position.addScaledVector(direction, 3.0 * deltaTime);

            // Rotar hacia la dirección de movimiento
            const targetRotation = Math.atan2(direction.x, direction.z);
            unit.rotation.y = targetRotation;
        } else {
            // Llegó al punto, pasar al siguiente
            order.currentPoint = (order.currentPoint + 1) % order.points.length;
        }
    }

    processObserveOrder(unit, order, deltaTime) {
        if (!order.target) return;

        // Mantener distancia óptima de observación
        const optimalDistance = 12.0;
        const distance = unit.position.distanceTo(order.target.position);

        if (Math.abs(distance - optimalDistance) > 1.0) {
            // Ajustar distancia
            const direction = new THREE.Vector3()
                .subVectors(order.target.position, unit.position)
                .normalize();

            if (distance > optimalDistance) {
                // Acercarse
                unit.position.addScaledVector(direction, 2.0 * deltaTime);
            } else {
                // Alejarse
                unit.position.addScaledVector(direction, -2.0 * deltaTime);
            }
        }

        // Apuntar hacia el objetivo observado
        const direction = new THREE.Vector3()
            .subVectors(order.target.position, unit.position)
            .normalize();

        const targetRotation = Math.atan2(direction.x, direction.z);
        unit.rotation.y = THREE.MathUtils.lerp(unit.rotation.y, targetRotation, 0.03); // Rotación suave
    }

    handleRadialMenuOption(action) {
        console.log(`🎯 Ejecutando acción del menú radial: ${action}`);

        // NO ocultar automáticamente el menú - dejar que el usuario lo cierre manualmente
        // if (this.radialMenu) {
        //     this.radialMenu.hide();
        // }

        switch (action) {
            // === ACCIONES PARA TERRENO ===
            case 'infoTerrenoJG':
                this.showTerrainInfo();
                // Después de mostrar info, ocultar el menú
                setTimeout(() => {
                    if (this.radialMenu) this.radialMenu.hide();
                }, 2000); // Dar tiempo para leer la info
                break;

            case 'marcarObjetivo':
                this.marcarObjetivo();
                // Marcar objetivo es una acción inmediata, ocultar menú
                setTimeout(() => {
                    if (this.radialMenu) this.radialMenu.hide();
                }, 500);
                break;

            case 'moverAqui':
                if (this.selectedObject) {
                    this.pendingOrder = {
                        type: 'move',
                        unit: this.selectedObject
                    };
                    this.updateStatus('Haz click en el terreno para mover la unidad', 'info');
                    // Mantener menú visible hasta que se complete la acción
                } else {
                    this.updateStatus('Selecciona una unidad primero', 'warning');
                    setTimeout(() => {
                        if (this.radialMenu) this.radialMenu.hide();
                    }, 1000);
                }
                break;

            // === ACCIONES PARA UNIDADES PROPIAS ===
            case 'infoUnidad':
                this.showUnitInfo(this.selectedObject);
                break;

            case 'moverUnidad':
                this.pendingOrder = {
                    type: 'move',
                    unit: this.selectedObject
                };
                this.updateStatus('Haz click en el terreno para mover la unidad', 'info');
                break;

            case 'atacarCon':
                this.pendingOrder = {
                    type: 'attack',
                    unit: this.selectedObject
                };
                this.updateStatus('Haz click en una unidad enemiga para atacar', 'warning');
                break;

            case 'defenderCon':
                if (this.selectedObject) {
                    this.giveDefendOrder(this.selectedObject, this.selectedObject.position.clone());
                }
                break;

            case 'reagrupar':
                this.reagruparUnidad(this.selectedObject);
                break;

            case 'darOrdenes':
                this.showAdvancedOrdersMenu(this.selectedObject);
                break;

            // === ACCIONES PARA UNIDADES ENEMIGAS ===
            case 'infoEnemigo':
                this.showEnemyInfo(this.selectedObject);
                break;

            case 'atacarEnemigo':
                this.pendingOrder = { type: 'attack', unit: this.selectedObject };
                this.updateStatus('Haz click en una unidad enemiga para atacar', 'warning');
                break;

            case 'observarEnemigo':
                this.observarEnemigo(this.selectedObject);
                break;

            case 'reportarEnemigo':
                this.reportarEnemigo(this.selectedObject);
                break;

            // === ACCIONES PARA ELEMENTOS TÁCTICOS ===
            case 'infoElemento':
                this.showElementInfo(this.selectedObject);
                break;

            case 'editarElemento':
                this.editarElemento(this.selectedObject);
                break;

            case 'eliminarElemento':
                this.eliminarElemento(this.selectedObject);
                break;

            case 'usarElemento':
                this.usarElemento(this.selectedObject);
                break;

            // === ACCIONES DE PLANEAMIENTO ===
            case 'infoTerreno':
                this.showTerrainInfo();
                break;

            case 'marcar':
                this.marcarTerreno();
                break;

            case 'editarElemento':
                this.editarElemento(this.selectedObject);
                break;

            case 'eliminarElemento':
                this.eliminarElemento(this.selectedObject);
                break;

            case 'propiedadesElemento':
                this.showElementProperties(this.selectedObject);
                break;

            case 'editarSimbolo':
                this.editarSimbolo(this.selectedObject);
                break;

            case 'eliminarSimbolo':
                this.eliminarSimbolo(this.selectedObject);
                break;

            case 'cambiarTipoSimbolo':
                this.cambiarTipoSimbolo(this.selectedObject);
                break;

            case 'propiedadesSimbolo':
                this.showSimboloProperties(this.selectedObject);
                break;

            case 'duplicarSimbolo':
                this.duplicarSimbolo(this.selectedObject);
                break;

            // === ACCIÓN GENÉRICA ===
            case 'close':
                if (this.radialMenu) {
                    this.radialMenu.hide();
                }
                break;

            default:
                console.warn(`Acción no implementada: ${action}`);
                this.updateStatus(`Acción "${action}" no implementada aún`, 'warning');
        }
    }

    giveDefendOrder(unit, position) {
        const order = {
            type: 'defend',
            target: position,
            timestamp: Date.now()
        };

        unit.userData.orders = [order];
        this.updateOrderVisual(unit);
        this.updateStatus(`${unit.userData.name} defendiendo posición`, 'success');
    }

    clearOrders(unit) {
        unit.userData.orders = [];
        this.updateOrderVisual(unit);
    }




    loadTestCube() {
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

        this.scene.add(cube);
        this.placedModels.push(cube);

        this.updateStatus('Cubo de prueba agregado', 'success');
    }

    clearAllModels() {
        this.placedModels.forEach(model => {
            this.scene.remove(model);
        });
        this.placedModels = [];
        this.selectedObject = null;
        this.updateSelectionInfo();
        this.updateStatus('Todos los modelos eliminados', 'success');
    }

    resetCamera() {
        if (this.camera) {
            this.camera.position.set(0, 50, 0);
        }
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
        this.updateStatus('Cámara restablecida', 'success');
    }

    exportScene() {
        const sceneData = {
            timestamp: new Date().toISOString(),
            models: this.placedModels.map(model => ({
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

        this.updateStatus('Escena exportada', 'success');
    }

    showDamageText(position, damage) {
        // Crear elemento DOM para el texto de daño
        const damageDiv = document.createElement('div');
        damageDiv.textContent = damage;
        damageDiv.style.position = 'absolute';
        damageDiv.style.color = '#ff0000';
        damageDiv.style.fontSize = '24px';
        damageDiv.style.fontWeight = 'bold';
        damageDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
        damageDiv.style.pointerEvents = 'none';
        damageDiv.style.zIndex = '1000';
        damageDiv.style.userSelect = 'none';

        // Convertir posición 3D a pantalla
        const screenPos = this.worldToScreen(position);
        damageDiv.style.left = screenPos.x + 'px';
        damageDiv.style.top = screenPos.y + 'px';

        document.body.appendChild(damageDiv);

        // Animar el texto flotando hacia arriba
        let opacity = 1;
        let yOffset = 0;
        const animate = () => {
            yOffset -= 2;
            opacity -= 0.02;
            damageDiv.style.top = (screenPos.y + yOffset) + 'px';
            damageDiv.style.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                document.body.removeChild(damageDiv);
            }
        };
        animate();
    }

    clearLoadedModels() {
        this.loadedModels.clear();
        this.folderFiles.clear();

        const section = document.getElementById('loaded-models-section');
        const grid = document.getElementById('loaded-models-grid');

        if (grid) grid.innerHTML = '';
        if (section) section.style.display = 'none';

        this.updateStatus('Lista de modelos cargados limpiada', 'success');
    }

    // Método para integración de mapas
    /**
     * Cambia el tipo de mapa/terreno actual
     * @param {string} mapType - Tipo de terreno: 'plano', 'colinas', 'montanas', 'desierto'
     */
    setMapType(mapType) {
        this.currentMapType = mapType;
        this.createTerrain(mapType);
        this.updateStatus(`Tipo de mapa cambiado a: ${mapType}`, 'info');
    }

    // Métodos para actualizar iluminación
    /**
     * Actualiza la intensidad de la luz ambiente
     * @param {string|number} intensity - Nueva intensidad (0-2)
     */
    updateAmbientLight(intensity) {
        if (this.ambientLight) {
            this.ambientLight.intensity = parseFloat(intensity);
            document.getElementById('ambientValue').textContent = intensity;
            this.updateStatus(`Intensidad ambiente cambiada a: ${intensity}`, 'info');
        }
    }

    /**
     * Actualiza la intensidad de la luz direccional
     * @param {string|number} intensity - Nueva intensidad (0-3)
     */
    updateDirectionalLight(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = parseFloat(intensity);
            document.getElementById('directionalValue').textContent = intensity;
            this.updateStatus(`Intensidad direccional cambiada a: ${intensity}`, 'info');
        }
    }

    // Métodos auxiliares para compatibilidad
    placeModelFromFolder(position, modelName) {
        // Implementación simplificada
        this.updateStatus(`Función placeModelFromFolder no implementada para ${modelName}`, 'warning');
    }

    // Sistema de procesamiento de órdenes
    processOrders() {
        if (!Array.isArray(this.units) || this.units.length === 0) {
            // No hay unidades, no procesar nada
            // console.log('[processOrders] No hay unidades activas');
            return;
        }
        this.units.forEach(unit => {
            if (!unit || !unit.userData) return;
            const orders = Array.isArray(unit.userData.orders) ? unit.userData.orders : [];
            if (orders.length > 0) {
                const order = orders[0];
                switch (order.type) {
                    case 'move':
                        this.processMoveOrder(unit, order);
                        break;
                    case 'attack':
                        this.processAttackOrder(unit, order);
                        break;
                    case 'defend':
                        this.processDefendOrder(unit, order);
                        break;
                    case 'patrol':
                        this.processPatrolOrder(unit, order);
                        break;
                }
            }
        });
    }

    // Funciones para carga de archivos y directorios
    loadSelectedFiles(files) {
        if (!files || files.length === 0) {
            this.updateStatus('No se seleccionaron archivos', 'warning');
            return;
        }

        Array.from(files).forEach(file => {
            if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
                const url = URL.createObjectURL(file);
                const modelName = file.name.replace(/\.(glb|gltf)$/i, '');
                this.loadModel(url, modelName, 1.0);
                this.updateStatus(`Cargando ${file.name}...`, 'info');
            }
        });
    }

    loadFolder(files) {
        if (!files || files.length === 0) {
            this.updateStatus('No se encontraron archivos en el directorio', 'warning');
            return;
        }

        // Limpiar archivos anteriores
        this.folderFiles.clear();
        
        // Procesar archivos del directorio
        const gltfFiles = Array.from(files).filter(file => 
            file.name.endsWith('.glb') || file.name.endsWith('.gltf')
        );

        if (gltfFiles.length === 0) {
            this.updateStatus('No se encontraron archivos GLTF/GLB en el directorio', 'warning');
            return;
        }

        this.updateStatus(`Encontrados ${gltfFiles.length} modelos GLTF/GLB. Procesando...`, 'info');

        // Cargar todos los modelos
        gltfFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            const modelName = file.name.replace(/\.(glb|gltf)$/i, '');
            
            // Almacenar referencia para la lista
            this.folderFiles.set(modelName, {
                url: url,
                file: file,
                path: file.webkitRelativePath || file.name
            });
            
            // Cargar el modelo
            this.loadModel(url, modelName, 1.0);
        });

        // Mostrar sección de modelos cargados
        this.updateLoadedModelsList();
        this.updateStatus(`Cargados ${gltfFiles.length} modelos desde directorio`, 'success');
    }

    loadAllModelsInFolder() {
        // Cargar modelos predefinidos desde directorios conocidos
        const modelDirs = [
            '../Client/assets/models/gbl_new/',
            '../Client/assets/models/gltf_new/',
            'models-3d/'
        ];

        this.updateStatus('Buscando modelos predefinidos...', 'info');

        // Por ahora, cargar algunos modelos conocidos
        const knownModels = [
            { path: '../Client/assets/models/gbl_new/humvee.glb', name: 'Humvee', scale: 5.0 },
            { path: '../Client/assets/models/gbl_new/m113.glb', name: 'M113', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/tam_tank.glb', name: 'TAM Tank', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/tam_2c_war_thunder.glb', name: 'TAM 2C', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/tam_2ip_war_thunder.glb', name: 'TAM 2IP', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/a_solider_poin_weapon.glb', name: 'Soldado', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/russian_soldier.glb', name: 'Soldado Ruso', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/fsb_operator.glb', name: 'FSB Operator', scale: 2.0 },
            { path: '../Client/assets/models/gbl_new/low_poly_humvee_vehicle.glb', name: 'Low Poly Humvee', scale: 5.0 }
        ];

        knownModels.forEach(model => {
            this.loadModel(model.path, model.name, model.scale);
        });

        this.updateStatus(`Cargando ${knownModels.length} modelos predefinidos...`, 'info');
    }

    updateLoadedModelsList() {
        const section = document.getElementById('loaded-models-section');
        const grid = document.getElementById('loaded-models-grid');
        
        if (this.folderFiles.size === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        grid.innerHTML = '';

        this.folderFiles.forEach((data, modelName) => {
            const button = document.createElement('button');
            button.className = 'model-btn';
            button.textContent = modelName;
            button.onclick = () => {
                // Colocar el modelo en la escena
                this.placeModelFromFolder(this.getRandomPosition(), modelName);
            };
            grid.appendChild(button);
        });
    }

    placeModelFromFolder(position, modelName) {
        const modelData = this.folderFiles.get(modelName);
        if (!modelData) {
            this.updateStatus(`Modelo ${modelName} no encontrado`, 'error');
            return;
        }

        // Crear una nueva instancia del modelo
        const loader = new THREE.GLTFLoader();
        loader.load(modelData.url, (gltf) => {
            const model = gltf.scene;
            
            // Configurar el modelo
            model.position.copy(position);
            model.scale.setScalar(1.0);
            
            // Agregar metadatos
            model.userData = {
                name: modelName,
                type: 'model',
                isUnit: false,
                originalScale: 1.0
            };

            // Agregar a la escena
            this.scene.add(model);
            
            // Agregar a la lista de objetos si es necesario
            if (!this.sceneObjects.includes(model)) {
                this.sceneObjects.push(model);
            }

            this.updateStatus(`Modelo ${modelName} colocado en la escena`, 'success');
        }, 
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            this.updateStatus(`Cargando ${modelName}: ${percent}%`, 'info');
        },
        (error) => {
            this.updateStatus(`Error cargando ${modelName}: ${error.message}`, 'error');
        });
    }

    getRandomPosition() {
        // Generar posición aleatoria en un área de 200x200 unidades
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        return new THREE.Vector3(x, 0, z);
    }

    // Loop de animación
    animate() {
        requestAnimationFrame(() => this.animate());

        // Procesar órdenes de unidades
        this.processOrders();

        // Actualizar controles
        if (this.controls) {
            this.controls.update();
        }

        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
    }

    // Mostrar marcador de waypoint
    showWaypointMarker(position, index) {
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        marker.position.y = 0.5;
        marker.name = `waypoint-${index}`;

        // Agregar número del waypoint
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 255, 0, 0.8)';
        context.fillRect(0, 0, 64, 64);
        context.fillStyle = 'white';
        context.font = 'bold 32px Arial';
        context.textAlign = 'center';
        context.fillText(index.toString(), 32, 42);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 1, 0);
        sprite.scale.set(1, 1, 1);
        marker.add(sprite);

        this.scene.add(marker);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            this.scene.remove(marker);
        }, 10000);
    }
}


// Exponer la clase globalmente
window.MAIRA3DViewAdapter = MAIRA3DViewAdapter;

console.log('MAIRA3DViewAdapter cargado y listo');

// Inicialización automática removida - se maneja desde el HTML
