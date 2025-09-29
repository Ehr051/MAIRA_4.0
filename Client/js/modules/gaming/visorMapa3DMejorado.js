/**
 * VISOR MAPA 3D MEJORADO - MAIRA 4.0
 * Integra las mejores características del test_mapa3d.html con el sistema principal
 */

class VisorMapa3DMejorado {
    constructor(containerId = 'map') {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.terrain = null;
        this.gridHelper = null;
        this.stats = null;
        
        // Configuración inicial - Buenos Aires, Argentina (se actualizará con coordenadas reales del mapa)
        this.currentLat = -34.61315;
        this.currentLng = -58.37723;
        this.currentZoom = 12;
        this.mapRadius = 2; // km
        this.mapDetail = 512;
        this.heightScale = 2.0;
        this.mapSource = 'osm';
        
        // Estado
        this.isInitialized = false;
        this.isLoading = false;
        this.terrainGenerated = false;
        this.leafletMap = null; // Referencia al mapa de Leaflet
        
        console.log('🗺️ VisorMapa3DMejorado creado');
    }
    
    async initialize() {
        try {
            if (this.isInitialized) {
                console.log('⚠️ Visor 3D ya inicializado');
                return;
            }
            
            console.log('🚀 Inicializando Visor Mapa 3D Mejorado...');
            
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                throw new Error(`Container ${this.containerId} no encontrado`);
            }
            
            // Verificar THREE.js
            if (typeof THREE === 'undefined') {
                throw new Error('THREE.js no está disponible');
            }
            
            // Obtener coordenadas actuales del mapa Leaflet
            await this.sincronizarConMapaLeaflet();
            
            await this.setupScene();
            await this.setupRenderer();
            await this.setupCamera();
            await this.setupControls();
            await this.setupLighting();
            await this.setupGrid();
            await this.setupUI();
            
            // Generar terreno con coordenadas reales
            await this.generateTerrain();
            
            // Iniciar animación
            this.animate();
            
            this.isInitialized = true;
            console.log('✅ Visor Mapa 3D Mejorado inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Visor 3D:', error);
            throw error;
        }
    }
    
    async sincronizarConMapaLeaflet() {
        // Buscar el mapa de Leaflet activo
        this.leafletMap = window.map || window.mapa || null;
        
        if (this.leafletMap && this.leafletMap.getCenter) {
            const center = this.leafletMap.getCenter();
            const zoom = this.leafletMap.getZoom();
            
            this.currentLat = center.lat;
            this.currentLng = center.lng;
            this.currentZoom = zoom;
            
            // Ajustar radio de mapa según el zoom
            if (zoom >= 16) {
                this.mapRadius = 1; // 1 km para zoom alto
            } else if (zoom >= 14) {
                this.mapRadius = 2; // 2 km para zoom medio-alto
            } else if (zoom >= 12) {
                this.mapRadius = 5; // 5 km para zoom medio
            } else {
                this.mapRadius = 10; // 10 km para zoom bajo
            }
            
            console.log(`🗺️ Coordenadas sincronizadas: ${this.currentLat.toFixed(4)}, ${this.currentLng.toFixed(4)} (Zoom: ${this.currentZoom}, Radio: ${this.mapRadius}km)`);
        } else {
            console.warn('⚠️ No se encontró mapa de Leaflet, usando coordenadas por defecto');
        }
    }
    
    async setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Azul cielo
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 8000);
        console.log('✅ Escena 3D configurada');
    }
    
    async setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1);
        
        // Limpiar container y agregar renderer
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);
        
        console.log('✅ Renderer 3D configurado');
    }
    
    async setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 20000);
        this.camera.position.set(0, 2000, 2000);
        this.camera.lookAt(0, 0, 0);
        console.log('✅ Cámara 3D configurada');
    }
    
    async setupControls() {
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2.1; // Evitar ir bajo tierra
            this.controls.minDistance = 100;
            this.controls.maxDistance = 10000;
            console.log('✅ Controles OrbitControls configurados');
        } else {
            console.warn('⚠️ OrbitControls no disponible');
        }
    }
    
    async setupLighting() {
        // Luz ambiental
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Luz del sol
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(1000, 2000, 500);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 5000;
        sunLight.shadow.camera.left = -2000;
        sunLight.shadow.camera.right = 2000;
        sunLight.shadow.camera.top = 2000;
        sunLight.shadow.camera.bottom = -2000;
        this.scene.add(sunLight);
        
        // Luz hemisférica
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.3);
        this.scene.add(hemisphereLight);
        
        console.log('✅ Iluminación 3D configurada');
    }
    
    async setupGrid() {
        // Grilla de referencia (cada cuadro = 100m)
        const gridSize = 10000; // 10km
        const divisions = 100; // 100m por división
        this.gridHelper = new THREE.GridHelper(gridSize, divisions, 0x00ff00, 0x004400);
        this.gridHelper.position.y = -10;
        this.scene.add(this.gridHelper);
        console.log('✅ Grilla de referencia configurada');
    }
    
    async setupUI() {
        // Crear panel de controles 3D
        const controlsHTML = `
            <div id="controls3D" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 1000;
                min-width: 200px;
            ">
                <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">🗺️ CONTROLES 3D</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">
                    <button onclick="window.visorMapa3D.resetCamera()" style="padding: 5px; background: #001100; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px; cursor: pointer; font-size: 10px;">📷 Reset</button>
                    <button onclick="window.visorMapa3D.toggleWireframe()" style="padding: 5px; background: #001100; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px; cursor: pointer; font-size: 10px;">🕸️ Wire</button>
                    <button onclick="window.visorMapa3D.toggleGrid()" style="padding: 5px; background: #001100; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px; cursor: pointer; font-size: 10px;">📐 Grid</button>
                    <button onclick="window.visorMapa3D.captureScreenshot()" style="padding: 5px; background: #001100; color: #00ff00; border: 1px solid #00ff00; border-radius: 3px; cursor: pointer; font-size: 10px;">📸 Foto</button>
                </div>
                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 3px;">Altura: <span id="heightScaleValue">${this.heightScale}</span></label>
                    <input type="range" id="heightScale" min="0.1" max="10" step="0.1" value="${this.heightScale}" 
                           onchange="window.visorMapa3D.updateHeightScale(this.value)" 
                           style="width: 100%; accent-color: #00ff00;">
                </div>
                <div style="margin-bottom: 8px;">
                    <label style="display: block; margin-bottom: 3px;">Detalle: <span id="mapDetailValue">${this.mapDetail}</span></label>
                    <input type="range" id="mapDetail" min="256" max="1024" step="128" value="${this.mapDetail}" 
                           onchange="window.visorMapa3D.updateMapDetail(this.value)" 
                           style="width: 100%; accent-color: #00ff00;">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 10px;">
                    <button onclick="window.visorMapa3D.regenerateTerrain()" style="
                        padding: 6px; 
                        background: #002200; 
                        color: #00ff00; 
                        border: 1px solid #00ff00; 
                        border-radius: 3px; 
                        cursor: pointer; 
                        font-size: 10px;
                    ">🔄 Regenerar</button>
                    <button onclick="window.visorMapa3D.actualizarDesdeMapaLeaflet()" style="
                        padding: 6px; 
                        background: #000022; 
                        color: #00ffff; 
                        border: 1px solid #00ffff; 
                        border-radius: 3px; 
                        cursor: pointer; 
                        font-size: 10px;
                    ">🗺️ Sincronizar</button>
                </div>
                <div id="stats3D" style="font-size: 10px; line-height: 1.3; color: #00ffff;">
                    <div>Coordenadas: <span id="coordenadas">${this.currentLat.toFixed(4)}, ${this.currentLng.toFixed(4)}</span></div>
                    <div>Zoom: <span id="zoomLevel">${this.currentZoom}</span> | Radio: <span id="radioKm">${this.mapRadius}km</span></div>
                    <div>Triángulos: <span id="triangleCount">0</span></div>
                    <div>FPS: <span id="fpsCount">0</span></div>
                </div>
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', controlsHTML);
        console.log('✅ UI de controles 3D configurada');
    }
    
    async generateTerrain() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('🏔️ Generando terreno 3D...');
        
        try {
            // Remover terreno anterior
            if (this.terrain) {
                this.scene.remove(this.terrain);
                this.terrain.geometry.dispose();
                if (this.terrain.material.map) {
                    this.terrain.material.map.dispose();
                }
                this.terrain.material.dispose();
            }
            
            // Generar geometría
            const geometry = new THREE.PlaneGeometry(
                this.mapRadius * 2000, // km a metros
                this.mapRadius * 2000,
                this.mapDetail - 1,
                this.mapDetail - 1
            );
            
            // Generar heightmap
            this.generateHeightmap(geometry);
            
            // Cargar textura real del mapa
            const texture = await this.loadRealMapTexture();
            
            // Crear material
            const material = new THREE.MeshLambertMaterial({
                map: texture,
                wireframe: false
            });
            
            // Crear terreno
            this.terrain = new THREE.Mesh(geometry, material);
            this.terrain.rotation.x = -Math.PI / 2;
            this.terrain.receiveShadow = true;
            this.scene.add(this.terrain);
            
            this.terrainGenerated = true;
            this.updateStats();
            
            console.log('✅ Terreno 3D generado correctamente');
            
        } catch (error) {
            console.error('❌ Error generando terreno:', error);
        } finally {
            this.isLoading = false;
        }
    }
    
    generateHeightmap(geometry) {
        const vertices = geometry.attributes.position.array;
        
        // Parámetros basados en ubicación geográfica
        const latFactor = Math.abs(this.currentLat) / 90; // 0-1 basado en latitud
        const baseElevation = this.getBaseElevationForLocation();
        
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            
            // Coordenadas normalizadas (basadas en ubicación real)
            const normalizedX = x + this.currentLng * 1000;
            const normalizedZ = z + this.currentLat * 1000;
            
            // Generar altura con múltiples octavas de ruido geográfico
            let height = baseElevation;
            
            // Octava principal - terreno grande
            height += Math.sin(normalizedX * 0.0001) * Math.cos(normalizedZ * 0.0001) * 300 * latFactor;
            
            // Octava secundaria - colinas
            height += Math.sin(normalizedX * 0.0005) * Math.cos(normalizedZ * 0.0005) * 150;
            
            // Octava terciaria - detalles del terreno
            height += Math.sin(normalizedX * 0.002) * Math.cos(normalizedZ * 0.002) * 50;
            
            // Octava fina - rugosidad
            height += Math.sin(normalizedX * 0.008) * Math.cos(normalizedZ * 0.008) * 15;
            
            // Ruido superficial
            height += (Math.random() - 0.5) * 8;
            
            // Evitar alturas negativas extremas (simular nivel del mar)
            height = Math.max(height, -20);
            
            // Aplicar escala configurada por usuario
            vertices[i + 2] = height * this.heightScale;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    }
    
    getBaseElevationForLocation() {
        // Estimación básica de elevación según coordenadas
        // (En una implementación real, esto vendría de un servicio de elevación)
        
        const lat = Math.abs(this.currentLat);
        const lng = Math.abs(this.currentLng);
        
        // Zonas montañosas conocidas (simplificado)
        if ((lat > 25 && lat < 50 && lng > 70 && lng < 120) || // Himalaya/Alpes/Rockies aproximado
            (lat > 10 && lat < 40 && lng > 60 && lng < 90)) {   // Otras cadenas montañosas
            return 200; // Elevación base alta
        } else if (lat < 10 || (lng > 100 && lng < 140)) { // Zonas tropicales/costeras
            return 10;  // Elevación base baja
        } else {
            return 50;  // Elevación base media
        }
    }
    
    async loadRealMapTexture() {
        return new Promise((resolve, reject) => {
            console.log('🗺️ Cargando textura de mapa real...');
            
            // Crear canvas compuesto con múltiples tiles
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            
            // Calcular tiles necesarios para cubrir el área
            const tilesPerSide = 4; // 4x4 grid de tiles
            const tileSize = canvas.width / tilesPerSide;
            const zoomLevel = Math.min(Math.max(this.currentZoom, 10), 18);
            
            // Convertir lat/lng a tile coordinates
            const lat_rad = this.currentLat * Math.PI / 180;
            const n = Math.pow(2, zoomLevel);
            const centerX = Math.floor((this.currentLng + 180) / 360 * n);
            const centerY = Math.floor((1 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2 * n);
            
            let tilesLoaded = 0;
            const totalTiles = tilesPerSide * tilesPerSide;
            
            // Función para cargar un tile individual
            const loadTile = (tileX, tileY, canvasX, canvasY) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    ctx.drawImage(img, canvasX, canvasY, tileSize, tileSize);
                    tilesLoaded++;
                    
                    if (tilesLoaded === totalTiles) {
                        // Agregar grid militar sobre el mapa real
                        this.addMilitaryGrid(ctx, canvas.width, canvas.height);
                        
                        const texture = new THREE.CanvasTexture(canvas);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.LinearFilter;
                        
                        console.log('✅ Textura de mapa real cargada');
                        resolve(texture);
                    }
                };
                
                img.onerror = () => {
                    // Fallback: usar tile sintético si falla la carga
                    this.drawSyntheticTile(ctx, canvasX, canvasY, tileSize);
                    tilesLoaded++;
                    
                    if (tilesLoaded === totalTiles) {
                        this.addMilitaryGrid(ctx, canvas.width, canvas.height);
                        
                        const texture = new THREE.CanvasTexture(canvas);
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        texture.minFilter = THREE.LinearFilter;
                        
                        console.log('✅ Textura sintética generada como fallback');
                        resolve(texture);
                    }
                };
                
                // URL del tile (OpenStreetMap)
                img.src = `https://tile.openstreetmap.org/${zoomLevel}/${tileX}/${tileY}.png`;
            };
            
            // Cargar grid de tiles
            for (let x = 0; x < tilesPerSide; x++) {
                for (let y = 0; y < tilesPerSide; y++) {
                    const tileX = centerX - Math.floor(tilesPerSide/2) + x;
                    const tileY = centerY - Math.floor(tilesPerSide/2) + y;
                    const canvasX = x * tileSize;
                    const canvasY = y * tileSize;
                    
                    loadTile(tileX, tileY, canvasX, canvasY);
                }
            }
        });
    }
    
    drawSyntheticTile(ctx, x, y, size) {
        // Fondo base (verde terreno)
        ctx.fillStyle = '#4a5d23';
        ctx.fillRect(x, y, size, size);
        
        // Agregar características aleatorias
        for (let i = 0; i < 10; i++) {
            const randomX = x + Math.random() * size;
            const randomY = y + Math.random() * size;
            const radius = Math.random() * size * 0.1 + 3;
            
            if (Math.random() > 0.5) {
                // Bosques
                ctx.fillStyle = '#2d3d0f';
                ctx.beginPath();
                ctx.arc(randomX, randomY, radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Campos
                ctx.fillStyle = '#6b7c32';
                ctx.fillRect(randomX - radius/2, randomY - radius/2, radius, radius);
            }
        }
    }
    
    addMilitaryGrid(ctx, width, height) {
        // Grid militar semi-transparente
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.lineWidth = 1;
        const gridSize = 64; // Más grande para mejor visibilidad
        
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Coordenadas en las esquinas
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(`${this.currentLat.toFixed(4)}, ${this.currentLng.toFixed(4)}`, 10, 20);
        ctx.fillText(`Zoom: ${this.currentZoom}`, 10, height - 10);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
        
        // Actualizar stats cada segundo
        if (Date.now() % 1000 < 16) {
            this.updateStats();
        }
    }
    
    updateStats() {
        if (!this.terrain) return;
        
        const triangles = this.terrain.geometry.attributes.position.count / 3;
        const fpsElement = document.getElementById('fpsCount');
        const triangleElement = document.getElementById('triangleCount');
        const coordenadasElement = document.getElementById('coordenadas');
        const zoomElement = document.getElementById('zoomLevel');
        const radioElement = document.getElementById('radioKm');
        
        if (triangleElement) {
            triangleElement.textContent = Math.floor(triangles).toLocaleString();
        }
        
        if (coordenadasElement) {
            coordenadasElement.textContent = `${this.currentLat.toFixed(4)}, ${this.currentLng.toFixed(4)}`;
        }
        
        if (zoomElement) {
            zoomElement.textContent = this.currentZoom;
        }
        
        if (radioElement) {
            radioElement.textContent = `${this.mapRadius}km`;
        }
        
        // FPS aproximado
        if (fpsElement) {
            fpsElement.textContent = '60'; // Simplificado
        }
    }
    
    // === MÉTODOS PÚBLICOS DE CONTROL ===
    
    resetCamera() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 2000, 2000);
            this.camera.lookAt(0, 0, 0);
            if (this.controls.reset) {
                this.controls.reset();
            }
            console.log('📷 Cámara 3D reseteada');
        }
    }
    
    toggleWireframe() {
        if (this.terrain && this.terrain.material) {
            this.terrain.material.wireframe = !this.terrain.material.wireframe;
            console.log(`🕸️ Wireframe ${this.terrain.material.wireframe ? 'activado' : 'desactivado'}`);
        }
    }
    
    toggleGrid() {
        if (this.gridHelper) {
            this.gridHelper.visible = !this.gridHelper.visible;
            console.log(`📐 Grid ${this.gridHelper.visible ? 'activado' : 'desactivado'}`);
        }
    }
    
    captureScreenshot() {
        if (this.renderer) {
            const canvas = this.renderer.domElement;
            const link = document.createElement('a');
            link.download = `maira_3d_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.png`;
            link.href = canvas.toDataURL();
            link.click();
            console.log('📸 Screenshot 3D capturado');
        }
    }
    
    updateHeightScale(value) {
        this.heightScale = parseFloat(value);
        document.getElementById('heightScaleValue').textContent = this.heightScale.toFixed(1);
    }
    
    updateMapDetail(value) {
        this.mapDetail = parseInt(value);
        document.getElementById('mapDetailValue').textContent = this.mapDetail;
    }
    
    async regenerateTerrain() {
        console.log('🔄 Regenerando terreno 3D...');
        // Resincronizar con mapa de Leaflet antes de regenerar
        await this.sincronizarConMapaLeaflet();
        await this.generateTerrain();
    }
    
    async actualizarDesdeMapaLeaflet() {
        if (!this.isInitialized) return;
        
        console.log('🔄 Actualizando vista 3D desde mapa Leaflet...');
        await this.sincronizarConMapaLeaflet();
        await this.generateTerrain();
    }
    
    // === INTEGRACIÓN CON SISTEMA PRINCIPAL ===
    
    cambiarAVista3D() {
        if (!this.isInitialized) {
            this.initialize().then(() => {
                this.mostrarVisor();
            });
        } else {
            this.mostrarVisor();
        }
    }
    
    cambiarAVista2D() {
        this.ocultarVisor();
    }
    
    mostrarVisor() {
        if (this.container) {
            this.container.style.display = 'block';
            this.container.style.position = 'relative';
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            
            // Redimensionar renderer
            if (this.renderer) {
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            }
            
            // Actualizar aspect ratio de cámara
            if (this.camera) {
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
            }
            
            // Configurar listeners del mapa de Leaflet para actualizaciones automáticas
            this.configurarListenersMapaLeaflet();
            
            console.log('✅ Visor 3D mostrado');
        }
    }
    
    configurarListenersMapaLeaflet() {
        if (this.leafletMap && this.leafletMap.on) {
            // Listener para movimientos del mapa
            this.leafletMap.on('moveend', () => {
                console.log('🗺️ Mapa movido, sincronizando vista 3D...');
                // Debounce para evitar actualizaciones excesivas
                clearTimeout(this.syncTimeout);
                this.syncTimeout = setTimeout(() => {
                    this.actualizarDesdeMapaLeaflet();
                }, 1000);
            });
            
            // Listener para cambios de zoom
            this.leafletMap.on('zoomend', () => {
                console.log('🔍 Zoom cambiado, sincronizando vista 3D...');
                clearTimeout(this.syncTimeout);
                this.syncTimeout = setTimeout(() => {
                    this.actualizarDesdeMapaLeaflet();
                }, 800);
            });
            
            console.log('✅ Listeners del mapa Leaflet configurados');
        } else {
            console.warn('⚠️ No se pudo configurar listeners - mapa Leaflet no disponible');
        }
    }
    
    ocultarVisor() {
        if (this.container) {
            this.container.style.display = 'none';
            console.log('✅ Visor 3D ocultado');
        }
    }
    
    destroy() {
        // Limpiar listeners del mapa
        if (this.leafletMap && this.leafletMap.off) {
            this.leafletMap.off('moveend');
            this.leafletMap.off('zoomend');
        }
        
        // Limpiar timeouts
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        // Limpiar recursos 3D
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.terrain) {
            this.terrain.geometry.dispose();
            if (this.terrain.material.map) {
                this.terrain.material.map.dispose();
            }
            this.terrain.material.dispose();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        console.log('🗑️ Visor 3D destruido completamente');
    }
}

