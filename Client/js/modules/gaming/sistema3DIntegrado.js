/**
 * Sistema 3D Integrado para juegodeguerra.html
 * Maneja la alternancia entre vista 2D (Leaflet) y vista 3D (THREE.js)
 * en el mismo contenedor sin ventanas emergentes.
 */

class Sistema3DIntegrado {
    constructor() {
        this.vistaActiva = '2D'; // '2D' | '3D'
        this.motor3D = null;
        this.mapContainer = null;
        this.vista3DContainer = null;
        this.inicializado = false;
        
        this.datosJuego = {
            unidades: new Map(),
            elementos: [],
            fase: 'preparacion',
            jugadorActual: null
        };
    }

    async inicializar() {
        console.log('🚫 Sistema3DIntegrado DESACTIVADO - Funcionalidades integradas en mapaP.js');
        return true; // ❌ NO INICIALIZAR - Evitar conflictos con mapa único
        
        
        console.log('🎮 Inicializando Sistema 3D Integrado...');
        
        try {
            // Obtener contenedores
            this.mapContainer = document.getElementById('map');
            this.vista3DContainer = document.getElementById('vista3D');
            
            if (!this.mapContainer || !this.vista3DContainer) {
                throw new Error('Contenedores 3D no encontrados');
            }

            // Configurar eventos
            this.configurarEventos();
            
            // Inicializar motor 3D (lazy loading)
            await this.inicializarMotor3D();
            
            this.inicializado = true;
            console.log('✅ Sistema 3D Integrado inicializado correctamente');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Sistema 3D Integrado:', error);
            return false;
        }
        
    }

    configurarEventos() {
        // Botón para cambiar a vista 3D (se puede agregar al sistema de paneles)
        document.addEventListener('click', (event) => {
            if (event.target.id === 'btn3DView' || event.target.closest('#btn3DView')) {
                event.preventDefault();
                this.cambiarAVista3D();
            }
            
            if (event.target.id === 'btn3DToMap' || event.target.closest('#btn3DToMap')) {
                event.preventDefault();
                this.cambiarAVista2D();
            }
        });

        // Escuchar eventos del juego
        document.addEventListener('faseCambiada', (event) => {
            this.datosJuego.fase = event.detail.nuevaFase;
            if (this.motor3D && this.vistaActiva === '3D') {
                this.motor3D.actualizarSegunFase(event.detail.nuevaFase, event.detail.nuevaSubfase);
            }
        });

        document.addEventListener('unidadActualizada', (event) => {
            this.sincronizarUnidad(event.detail);
        });
    }

    async inicializarMotor3D() {
        if (this.motor3D) return;

        console.log('🔧 Inicializando motor 3D...');
        
        // Usar el sistema de juegodeguerra-tactico3d.html adaptado
        this.motor3D = new JuegoGuerra3DIntegrado();
        await this.motor3D.inicializar({
            canvas: document.getElementById('canvas3d'),
            panel: document.getElementById('panel3DIntegrado')
        });

        console.log('✅ Motor 3D inicializado');
    }

    cambiarAVista3D() {
        if (!this.inicializado) {
            console.warn('⚠️ Sistema 3D no inicializado');
            return;
        }

        console.log('🎮 Cambiando a vista 3D...');
        
        // Ocultar mapa 2D
        const map2D = document.getElementById('map');
        if (map2D) {
            map2D.style.display = 'none';
        }
        
        // Mostrar vista 3D
        this.vista3DContainer.style.display = 'block';
        
        // Sincronizar datos del juego
        this.sincronizarDatos3D();
        
        // Ajustar tamaño del canvas
        this.motor3D.redimensionar();
        
        this.vistaActiva = '3D';
        
        // Notificar cambio
        document.dispatchEvent(new CustomEvent('vistaCambiada', {
            detail: { vista: '3D' }
        }));

        console.log('✅ Vista 3D activada');
    }

    cambiarAVista2D() {
        console.log('📋 Cambiando a vista 2D...');
        
        // Ocultar vista 3D
        this.vista3DContainer.style.display = 'none';
        
        // Mostrar mapa 2D
        const map2D = document.getElementById('map');
        if (map2D) {
            map2D.style.display = 'block';
        }
        
        // Redimensionar mapa si es necesario
        if (window.map) {
            setTimeout(() => {
                window.map.invalidateSize();
            }, 100);
        }
        
        this.vistaActiva = '2D';
        
        // Notificar cambio
        document.dispatchEvent(new CustomEvent('vistaCambiada', {
            detail: { vista: '2D' }
        }));

        console.log('✅ Vista 2D activada');
    }

    sincronizarDatos3D() {
        if (!this.motor3D) return;

        console.log('🔄 Sincronizando datos con vista 3D...');

        // Sincronizar unidades SIDC
        if (window.elementosEnJuego && window.elementosEnJuego.length > 0) {
            this.motor3D.procesarElementosSIDC(window.elementosEnJuego);
        }

        // Sincronizar estado del juego
        const estadoJuego = {
            fase: this.datosJuego.fase,
            jugadorActual: this.datosJuego.jugadorActual,
            turnoActual: window.gestorJuego?.gestorTurnos?.turnoActual || 1
        };

        this.motor3D.actualizarEstadoJuego(estadoJuego);
    }

    sincronizarUnidad(datosUnidad) {
        this.datosJuego.unidades.set(datosUnidad.id, datosUnidad);
        
        if (this.motor3D && this.vistaActiva === '3D') {
            this.motor3D.actualizarUnidad(datosUnidad);
        }
    }

    // Métodos de utilidad
    obtenerVistaActiva() {
        return this.vistaActiva;
    }

    estaEnVista3D() {
        return this.vistaActiva === '3D';
    }

    obtenerMotor3D() {
        return this.motor3D;
    }
}

/**
 * Versión integrada del motor 3D adaptada de juegodeguerra-tactico3d.html
 */
class JuegoGuerra3DIntegrado {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.canvas = null;
        this.panel = null;
        
        // Estado del juego
        this.fase = 'preparacion';
        this.unidades = new Map();
        this.elementos = [];
    }

    async inicializar(config) {
        this.canvas = config.canvas;
        this.panel = config.panel;

        // Configurar escena 3D
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Configurar cámara
        this.camera = new THREE.PerspectiveCamera(60, 
            this.canvas.clientWidth / this.canvas.clientHeight, 
            0.1, 50000);
        this.camera.position.set(0, 1000, 1000);

        // Configurar renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true 
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Configurar controles
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 50;
        this.controls.maxDistance = 5000;

        // Configurar iluminación
        this.configurarIluminacion();

        // Crear terreno básico
        this.crearTerreno();

        // Iniciar bucle de renderizado
        this.iniciarBucleRenderizado();

        // Configurar panel de control
        this.configurarPanelControl();

        console.log('✅ Motor 3D integrado inicializado');
    }

    configurarIluminacion() {
        // Luz ambiental
        const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(luzAmbiental);

        // Luz direccional (sol)
        const luzSol = new THREE.DirectionalLight(0xffffff, 0.8);
        luzSol.position.set(1000, 2000, 1000);
        luzSol.castShadow = true;
        luzSol.shadow.mapSize.width = 2048;
        luzSol.shadow.mapSize.height = 2048;
        this.scene.add(luzSol);
    }

    crearTerreno() {
        // Terreno básico
        const geometriaTerr = new THREE.PlaneGeometry(5000, 5000, 50, 50);
        const materialTerr = new THREE.MeshLambertMaterial({ 
            color: 0x4a5d23,
            wireframe: false 
        });
        
        const terreno = new THREE.Mesh(geometriaTerr, materialTerr);
        terreno.rotation.x = -Math.PI / 2;
        terreno.receiveShadow = true;
        this.scene.add(terreno);
    }

    configurarPanelControl() {
        if (!this.panel) return;

        this.panel.innerHTML = `
            <div class="panel-section">
                <div class="panel-header">🎯 Vista Táctica 3D</div>
                <div class="panel-content">
                    <div class="controles-vista">
                        <button class="btn-control" onclick="window.sistema3DIntegrado.cambiarAVista2D()">📋 Volver a Mapa 2D</button>
                        <button class="btn-control" onclick="this.resetearCamara()">📷 Reset Cámara</button>
                        <button class="btn-control" onclick="this.toggleWireframe()">🕸️ Wireframe</button>
                    </div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="panel-header">📊 Estado del Juego</div>
                <div class="panel-content">
                    <div id="estadoJuego3D">
                        <div>Fase: <span id="faseActual3D">Preparación</span></div>
                        <div>Unidades: <span id="unidadesCount3D">0</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    iniciarBucleRenderizado() {
        const renderizar = () => {
            requestAnimationFrame(renderizar);
            
            if (this.controls) {
                this.controls.update();
            }
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        };
        
        renderizar();
    }

    procesarElementosSIDC(elementos) {
        console.log(`🔄 Procesando ${elementos.length} elementos SIDC en 3D`);
        
        elementos.forEach(elemento => {
            this.crearRepresentacion3D(elemento);
        });
    }

    crearRepresentacion3D(elemento) {
        // Crear representación 3D básica del elemento
        const geometria = new THREE.BoxGeometry(50, 20, 30);
        const material = new THREE.MeshLambertMaterial({ 
            color: elemento.equipo === 'propio' ? 0x0000ff : 0xff0000 
        });
        
        const mesh = new THREE.Mesh(geometria, material);
        
        // Posicionar según coordenadas
        if (elemento.posicion) {
            mesh.position.set(
                elemento.posicion.x || 0,
                10,
                elemento.posicion.z || 0
            );
        }
        
        mesh.userData = {
            id: elemento.id,
            tipo: elemento.tipo,
            elemento: elemento
        };
        
        this.scene.add(mesh);
        this.unidades.set(elemento.id, mesh);
        
        console.log(`➕ Elemento 3D creado: ${elemento.nombre || elemento.id}`);
    }

    actualizarSegunFase(fase, subfase) {
        this.fase = fase;
        console.log(`🎯 Vista 3D actualizando según fase: ${fase}/${subfase}`);
        
        // Actualizar panel
        const faseElement = document.getElementById('faseActual3D');
        if (faseElement) {
            faseElement.textContent = fase;
        }
    }

    actualizarEstadoJuego(estado) {
        this.fase = estado.fase;
        
        // Actualizar contadores
        const unidadesCount = document.getElementById('unidadesCount3D');
        if (unidadesCount) {
            unidadesCount.textContent = this.unidades.size;
        }
    }

    actualizarUnidad(datosUnidad) {
        const mesh = this.unidades.get(datosUnidad.id);
        if (mesh && datosUnidad.posicion) {
            mesh.position.set(
                datosUnidad.posicion.x || mesh.position.x,
                mesh.position.y,
                datosUnidad.posicion.z || mesh.position.z
            );
        }
    }

    redimensionar() {
        if (!this.renderer || !this.camera) return;
        
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    resetearCamara() {
        if (this.camera) {
            this.camera.position.set(0, 1000, 1000);
            this.camera.lookAt(0, 0, 0);
        }
    }

    toggleWireframe() {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                object.material.wireframe = !object.material.wireframe;
            }
        });
    }
}

// Inicialización global
window.sistema3DIntegrado = new Sistema3DIntegrado();

// Auto-inicializar DESHABILITADO - Para evitar conflictos con el mapa principal
// document.addEventListener('DOMContentLoaded', () => {
//     window.sistema3DIntegrado.inicializar().then(() => {
//         // Verificar si debe activar vista 3D automáticamente
//         if (localStorage.getItem('activar3DDirecto') === 'true') {
//             localStorage.removeItem('activar3DDirecto');
//             setTimeout(() => {
//                 console.log('🎮 Auto-activando vista 3D...');
//                 window.sistema3DIntegrado.cambiarAVista3D();
//             }, 2000); // Esperar a que se cargue todo
//         }
//     });
// });

console.log('📦 Sistema3DIntegrado clase cargada - Auto-inicialización deshabilitada');
