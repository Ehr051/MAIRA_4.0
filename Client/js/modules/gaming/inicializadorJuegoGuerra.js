/**
 * 🚀 INICIALIZADOR PRINCIPAL JUEGO DE GUERRA
 * Extrae toda la lógica de inicialización del HTML
 */

class InicializadorJuegoGuerra {
    constructor() {
        this.configuracionPartida = null;
        this.dependenciasCargadas = false;
        this.sistemasInicializados = false;
    }
    
    async inicializar() {
        console.log('🚀 MAIRA 4.0 - Iniciando Juego de Guerra (Modo Directo)...');
        console.log('🎯 Panel Unificado + Sistema Zoom Multi-Nivel (Total War Style)');
        
        // Verificar dependencias críticas
        if (!this.verificarDependencias()) {
            console.error('❌ Dependencias críticas no cargadas');
            return false;
        }
        
        try {
            // Obtener configuración de partida
            this.configuracionPartida = this.obtenerConfiguracionPartida();
            console.log('📋 Configuración de partida:', this.configuracionPartida);
            
            // Inicializar sistemas paso a paso
            await this.inicializarUserIdentity();
            await this.inicializarGameEngine();
            await this.inicializarGestorJuego();
            await this.inicializarMapaLeaflet();
            await this.configurarVista3D();
            await this.configurarEventos();
            
            this.sistemasInicializados = true;
            console.log('✅ Inicialización completa exitosa');
            
            return true;
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            this.mostrarErrorInicializacion(error);
            return false;
        }
    }
    
    verificarDependencias() {
        const dependencias = [
            { nombre: 'jQuery', variable: '$' },
            { nombre: 'Leaflet', variable: 'L' },
            { nombre: 'Milsymbol', variable: 'ms' }
        ];
        
        for (const dep of dependencias) {
            if (typeof window[dep.variable] === 'undefined') {
                console.error(`❌ ${dep.nombre} no cargado`);
                return false;
            }
        }
        
        this.dependenciasCargadas = true;
        console.log('✅ Todas las dependencias verificadas');
        return true;
    }
    
    obtenerConfiguracionPartida() {
        try {
            // Intentar obtener configuración desde localStorage
            const config = localStorage.getItem('configuracionPartida');
            if (config) {
                return JSON.parse(config);
            }
            
            // Configuración por defecto - Argentina
            return {
                modo: 'juego_guerra',
                jugadores: 2,
                escenario: 'default',
                duracionTurno: 300000, // 5 minutos
                mapaCentro: [-34.6037, -58.3816], // Buenos Aires, Argentina
                zoomInicial: 13
            };
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo configuración, usando defaults:', error);
            return {
                modo: 'juego_guerra',
                jugadores: 2,
                escenario: 'default',
                duracionTurno: 300000,
                mapaCentro: [-34.6037, -58.3816], // Buenos Aires, Argentina
                zoomInicial: 13
            };
        }
    }
    
    async inicializarUserIdentity() {
        if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity) {
            try {
                await MAIRA.UserIdentity.initialize();
                console.log('✅ UserIdentity inicializado');
            } catch (error) {
                console.warn('⚠️ Error inicializando UserIdentity:', error);
            }
        }
    }
    
    async inicializarGameEngine() {
        if (typeof GameEngine !== 'undefined') {
            try {
                window.gameEngine = new GameEngine();
                if (this.configuracionPartida) {
                    await window.gameEngine.setupGame(this.configuracionPartida);
                }
                console.log('✅ GameEngine inicializado');
            } catch (error) {
                console.warn('⚠️ Error inicializando GameEngine:', error);
            }
        }
    }
    
    async inicializarGestorJuego() {
        if (typeof GestorJuego !== 'undefined') {
            try {
                window.gestorJuego = new GestorJuego();
                if (this.configuracionPartida) {
                    await window.gestorJuego.configurar(this.configuracionPartida);
                }
                console.log('✅ GestorJuego inicializado');
            } catch (error) {
                console.warn('⚠️ Error inicializando GestorJuego:', error);
            }
        }
    }
    
    async inicializarMapaLeaflet() {
        try {
            // Configurar mapa principal - Buenos Aires, Argentina
            // ❌ ELIMINAR CREACIÓN DE MAPA DUPLICADO
            // Usar el mapa existente de mapaP.js
            console.log('🗺️ Esperando mapa base de mapaP.js...');
            
            // Esperar a que window.mapa esté disponible
            const esperarMapa = () => {
                return new Promise((resolve) => {
                    if (window.mapa && window.mapa.getCenter) {
                        console.log('✅ Mapa base encontrado, usando existente');
                        window.map = window.mapa; // Alias para compatibilidad
                        resolve();
                    } else {
                        setTimeout(() => esperarMapa().then(resolve), 100);
                    }
                });
            };
            
            await esperarMapa();
            
            // Agregar capa base
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(window.map);
            
            console.log('✅ Mapa Leaflet inicializado');
            
        } catch (error) {
            console.error('❌ Error inicializando mapa:', error);
        }
    }
    
    async configurarVista3D() {
        try {
            // Inicializar sistema 3D integrado mejorado
            if (typeof Sistema3DIntegrado !== 'undefined') {
                window.sistema3DIntegrado = new Sistema3DIntegrado('mapContainer');
                console.log('✅ Sistema 3D integrado configurado');
            }
            
            // Inicializar Visor Mapa 3D Mejorado (basado en test_mapa3d.html)
            if (typeof VisorMapa3DMejorado !== 'undefined') {
                window.visorMapa3DMejorado = new VisorMapa3DMejorado('mapContainer');
                console.log('✅ Visor Mapa 3D Mejorado configurado');
            }
            
            // Configurar funcionalidades mejoradas
            this.configurarControladores3D();
            
            // Configurar detección de hash para vista 3D
            if (window.location.hash === '#vista3d' || window.location.hash === '#activar3D') {
                setTimeout(() => {
                    this.activarSistema3DOptimo();
                }, 2000);
            }
            
        } catch (error) {
            console.warn('⚠️ Error configurando vista 3D:', error);
        }
    }
    
    activarSistema3DOptimo() {
        // Priorizar el visor mejorado si está disponible
        if (window.visorMapa3DMejorado) {
            console.log('🗺️ Activando Visor Mapa 3D Mejorado');
            window.visorMapa3DMejorado.cambiarAVista3D();
        } else if (window.sistema3DIntegrado) {
            console.log('🎮 Activando Sistema 3D Integrado');
            window.sistema3DIntegrado.cambiarAVista3D();
        }
    }
    
    configurarControladores3D() {
        // Funciones mejoradas compatibles con ambos sistemas 3D
        window.funciones3DMejoradas = {
            resetCamera: () => {
                if (window.visorMapa3DMejorado) {
                    window.visorMapa3DMejorado.resetCamera();
                } else if (window.sistema3DIntegrado?.camera && window.sistema3DIntegrado?.controls) {
                    window.sistema3DIntegrado.camera.position.set(0, 2000, 2000);
                    window.sistema3DIntegrado.camera.lookAt(0, 0, 0);
                    if (window.sistema3DIntegrado.controls.reset) {
                        window.sistema3DIntegrado.controls.reset();
                    }
                    console.log('📷 Cámara 3D reseteada');
                }
            },
            
            toggleWireframe: () => {
                if (window.visorMapa3DMejorado) {
                    window.visorMapa3DMejorado.toggleWireframe();
                } else if (window.sistema3DIntegrado?.terrain?.material) {
                    const material = window.sistema3DIntegrado.terrain.material;
                    material.wireframe = !material.wireframe;
                    console.log(`🕸️ Wireframe ${material.wireframe ? 'activado' : 'desactivado'}`);
                }
            },
            
            toggleGrid: () => {
                if (window.visorMapa3DMejorado) {
                    window.visorMapa3DMejorado.toggleGrid();
                } else if (window.sistema3DIntegrado?.gridHelper) {
                    const grid = window.sistema3DIntegrado.gridHelper;
                    grid.visible = !grid.visible;
                    console.log(`🔲 Grid ${grid.visible ? 'activado' : 'desactivado'}`);
                }
            },
            
            captureScreenshot: () => {
                if (window.visorMapa3DMejorado) {
                    window.visorMapa3DMejorado.captureScreenshot();
                } else if (window.sistema3DIntegrado?.renderer) {
                    const canvas = window.sistema3DIntegrado.renderer.domElement;
                    const link = document.createElement('a');
                    link.download = `maira_screenshot_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    console.log('📸 Screenshot capturado');
                }
            },
            
            regenerateTerrain: () => {
                if (window.visorMapa3DMejorado) {
                    window.visorMapa3DMejorado.regenerateTerrain();
                    console.log('🔄 Regenerando terreno mejorado');
                } else {
                    console.log('⚠️ Regeneración de terreno solo disponible en Visor Mejorado');
                }
            }
        };
        
        console.log('✅ Controladores 3D mejorados configurados');
    }
    
    async configurarEventos() {
        // Configurar eventos de botones 3D
        this.configurarEventosVista3D();
        
        // Configurar eventos de fases de juego
        this.configurarEventosFases();
        
        // Configurar eventos de paneles
        this.configurarEventosPaneles();
        
        console.log('✅ Eventos configurados');
    }
    
    configurarEventosVista3D() {
        const btn3D = document.getElementById('btn3DView');
        if (btn3D) {
            btn3D.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof toggleVista3DModular === 'function') {
                    toggleVista3DModular();
                } else if (typeof activarVista3D === 'function') {
                    activarVista3D();
                } else if (window.sistema3DIntegrado) {
                    window.sistema3DIntegrado.cambiarAVista3D();
                }
            });
        }
    }
    
    configurarEventosFases() {
        document.addEventListener('faseCambiada', (event) => {
            const { nuevaFase, nuevaSubfase } = event.detail;
            this.actualizarBotonesControlJuego(nuevaFase, nuevaSubfase);
        });
        
        // Actualizar botones después de inicialización
        setTimeout(() => {
            if (window.gestorJuego?.gestorFases) {
                const fase = window.gestorJuego.gestorFases.fase;
                const subfase = window.gestorJuego.gestorFases.subfase;
                this.actualizarBotonesControlJuego(fase, subfase);
            }
        }, 2000);
    }
    
    configurarEventosPaneles() {
        // Integrar sistemas de paneles existentes
        setTimeout(() => {
            try {
                this.integrarSistemasPaneles();
            } catch (error) {
                console.error('❌ Error integrando sistemas de paneles:', error);
            }
        }, 1500);
    }
    
    integrarSistemasPaneles() {
        // Lógica de integración de paneles
        if (typeof inicializarSistemaPaneles === 'function') {
            inicializarSistemaPaneles();
        }
        
        if (typeof configurarPanelesUnificados === 'function') {
            configurarPanelesUnificados();
        }
        
        console.log('✅ Sistemas de paneles integrados');
    }
    
    actualizarBotonesControlJuego(fase, subfase) {
        // Actualizar interfaz según fase del juego
        const botones = document.querySelectorAll('.btn-control-juego');
        botones.forEach(btn => {
            if (btn.dataset.fase && btn.dataset.fase !== fase) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'block';
            }
        });
    }
    
    mostrarErrorInicializacion(error) {
        const mensaje = `
            <div class="alert alert-danger" role="alert">
                <h4>❌ Error de Inicialización</h4>
                <p>No se pudo inicializar completamente el Juego de Guerra:</p>
                <pre>${error.message}</pre>
                <button class="btn btn-warning" onclick="location.reload()">
                    🔄 Reintentar
                </button>
            </div>
        `;
        
        const container = document.getElementById('mapContainer') || document.body;
        container.innerHTML = mensaje;
    }
    
    // Método para reinicializar si es necesario
    async reinicializar() {
        this.sistemasInicializados = false;
        this.dependenciasCargadas = false;
        return await this.inicializar();
    }
}

// Exportar para uso global
window.InicializadorJuegoGuerra = InicializadorJuegoGuerra;

// Auto-inicialización DESHABILITADA - Usando mapaP.js como sistema principal
// document.addEventListener('DOMContentLoaded', async function() {
//     window.inicializadorJG = new InicializadorJuegoGuerra();
//     await window.inicializadorJG.inicializar();
// });

console.log('📦 InicializadorJuegoGuerra cargado - Auto-inicialización deshabilitada');
