/**
 * INICIALIZADOR DE MODELOS 3D - MAIRA 4.0
 * =======================================
 * Carga e inicializa automáticamente el sistema de modelos 3D
 * Se ejecuta cuando se detecta zoom operacional
 */

class InicializadorModelos3D {
    constructor() {
        this.modelosPreCargados = false;
        this.escenaGlobal = null;
        this.rendererGlobal = null;
        
        console.log('🚀 Inicializador de Modelos 3D cargado');
        this.configurarEventos();
    }

    configurarEventos() {
        // Escuchar cambios de zoom para pre-cargar modelos
        document.addEventListener('cambioNivelZoom', (evento) => {
            const { nivelNuevo } = evento.detail;
            
            if (nivelNuevo === 'operacional' && !this.modelosPreCargados) {
                this.preCargarModelos3D();
            }
        });

        // Auto-inicializar cuando Three.js esté disponible
        this.verificarThreeJS();
    }

    verificarThreeJS() {
        if (typeof THREE !== 'undefined') {
            this.inicializar();
        } else {
            // Intentar cada 500ms hasta que Three.js esté disponible
            setTimeout(() => this.verificarThreeJS(), 500);
        }
    }

    async inicializar() {
        try {
            console.log('🎮 Inicializando sistema de modelos 3D...');
            
            // Inicializar generador de modelos
            if (!window.generadorModelos3D) {
                await this.cargarGeneradorModelos();
            }
            
            // Configurar escena global para optimización
            this.configurarEscenaGlobal();
            
            // Marcar como inicializado
            this.modelosPreCargados = true;
            
            console.log('✅ Sistema de modelos 3D inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar modelos 3D:', error);
        }
    }

    async cargarGeneradorModelos() {
        return new Promise((resolve) => {
            if (window.inicializarGeneradorModelos3D) {
                window.generadorModelos3D = window.inicializarGeneradorModelos3D();
                resolve();
            } else {
                // Cargar el script si no está disponible
                const script = document.createElement('script');
                script.src = '/Client/js/modules/shared/generadorModelos3D.js';
                script.onload = () => {
                    window.generadorModelos3D = window.inicializarGeneradorModelos3D();
                    resolve();
                };
                document.head.appendChild(script);
            }
        });
    }

    configurarEscenaGlobal() {
        // Escena reutilizable para optimización de rendimiento
        this.escenaGlobal = new THREE.Scene();
        
        // Renderer global con configuración optimizada
        this.rendererGlobal = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
        });
        
        // Configuración de rendimiento
        this.rendererGlobal.shadowMap.enabled = true;
        this.rendererGlobal.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Pool de cámaras reutilizables
        this.poolCamaras = this.crearPoolCamaras();
        
        console.log('🎯 Escena global 3D configurada');
    }

    crearPoolCamaras() {
        const pool = [];
        for (let i = 0; i < 10; i++) {
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 0, 0);
            pool.push(camera);
        }
        return pool;
    }

    preCargarModelos3D() {
        console.log('⏳ Pre-cargando modelos 3D para optimización...');
        
        const tiposModelos = ['tanque', 'mecanizado', 'artilleria', 'infanteria', 'camion'];
        
        // Pre-cargar todos los tipos de modelos
        tiposModelos.forEach(tipo => {
            try {
                const modelo = window.generadorModelos3D.obtenerModelo(tipo);
                console.log(`✅ Modelo ${tipo} pre-cargado`);
            } catch (error) {
                console.warn(`⚠️ Error pre-cargando modelo ${tipo}:`, error);
            }
        });
        
        this.modelosPreCargados = true;
        console.log('🚀 Todos los modelos 3D pre-cargados exitosamente');
    }

    // API para obtener modelos optimizados
    obtenerModeloOptimizado(tipo, opciones = {}) {
        if (!this.modelosPreCargados) {
            console.warn('⚠️ Modelos no pre-cargados, inicializando...');
            this.preCargarModelos3D();
        }

        const modelo = window.generadorModelos3D.obtenerModelo(tipo);
        
        // Aplicar optimizaciones según opciones
        if (opciones.nivel_detalle) {
            this.aplicarNivelDetalle(modelo, opciones.nivel_detalle);
        }
        
        if (opciones.sombras) {
            this.habilitarSombras(modelo);
        }
        
        return modelo;
    }

    aplicarNivelDetalle(modelo, nivel) {
        // Ajustar nivel de detalle según la distancia/zoom
        switch(nivel) {
            case 'bajo':
                // Reducir geometría para mejor rendimiento
                modelo.traverse((child) => {
                    if (child.isMesh && child.geometry) {
                        // Simplificar geometría si es necesario
                        child.material.wireframe = false;
                    }
                });
                break;
            case 'alto':
                // Máximo detalle
                modelo.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                break;
        }
    }

    habilitarSombras(modelo) {
        modelo.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    // Limpieza de recursos
    limpiarRecursos() {
        if (this.rendererGlobal) {
            this.rendererGlobal.dispose();
        }
        
        if (this.escenaGlobal) {
            this.escenaGlobal.clear();
        }
        
        console.log('🧹 Recursos de modelos 3D limpiados');
    }
}

// Auto-inicialización
let inicializadorModelos3D;

// Función de inicialización global
window.inicializarSistemaModelos3D = () => {
    if (!inicializadorModelos3D) {
        inicializadorModelos3D = new InicializadorModelos3D();
        window.inicializadorModelos3D = inicializadorModelos3D;
    }
    return inicializadorModelos3D;
};

// Inicializar automáticamente al cargar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM cargado, inicializando sistema de modelos 3D...');
    window.inicializarSistemaModelos3D();
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InicializadorModelos3D;
}
