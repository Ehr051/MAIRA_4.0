/**
 * @fileoverview Inicializador de herramientas refactorizadas
 * @version 1.0.0
 * @description Inicializa todos los event listeners y conexiones entre módulos refactorizados
 * Reemplaza la inicialización que estaba en herramientasP.js
 */

class ToolsInitializer {
    constructor() {
        this.modulosInicializados = false;
        console.log('✅ ToolsInitializer creado');
    }

    /**
     * Inicializa todos los módulos y sus event listeners
     */
    async inicializar() {
        if (this.modulosInicializados) {
            console.log('⚠️ Módulos ya inicializados');
            return;
        }

        console.log('🚀 Inicializando herramientas refactorizadas...');

        try {
            // Esperar a que el DOM esté listo
            await this.esperarDOM();

            // Esperar a que los módulos estén cargados
            await this.esperarModulos();

            // Inicializar event listeners de cada módulo
            this.inicializarEventListeners();

            // Configurar interacciones entre módulos
            this.configurarInteracciones();

            // Verificar funcionalidad
            this.verificarFuncionalidad();

            this.modulosInicializados = true;
            console.log('✅ Herramientas refactorizadas inicializadas correctamente');

        } catch (error) {
            console.error('❌ Error inicializando herramientas:', error);
        }
    }

    /**
     * Espera a que el DOM esté completamente cargado
     */
    esperarDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
                window.addEventListener('load', resolve);
            }
        });
    }

    /**
     * Espera a que todos los módulos necesarios estén cargados
     */
    esperarModulos() {
        return new Promise((resolve) => {
            const verificarModulos = () => {
                const modulosRequeridos = [
                    'measurementHandler',
                    'elevationProfileService', 
                    'mapInteractionHandler',
                    'geometryUtils',
                    'mobileOptimizationHandler'
                ];

                const modulosDisponibles = modulosRequeridos.every(modulo => 
                    window[modulo] !== undefined
                );

                if (modulosDisponibles) {
                    console.log('✅ Todos los módulos cargados');
                    resolve();
                } else {
                    console.log('⏳ Esperando módulos...');
                    setTimeout(verificarModulos, 100);
                }
            };

            verificarModulos();
        });
    }

    /**
     * Inicializa los event listeners de todos los módulos
     */
    inicializarEventListeners() {
        console.log('🔗 Inicializando event listeners...');

        // Event listeners del measurement handler
        if (window.measurementHandler) {
            window.measurementHandler.inicializarEventListeners();
        }

        // Event listeners del map interaction handler
        if (window.mapInteractionHandler) {
            window.mapInteractionHandler.inicializarEventListeners();
        }

        // Event listeners generales de la aplicación
        this.inicializarEventListenersGenerales();

        console.log('✅ Event listeners inicializados');
    }

    /**
     * Inicializa event listeners generales
     */
    inicializarEventListenersGenerales() {
        // Event listener para el botón de medir distancia (compatibilidad con código existente)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btnMedirDistancia' || e.target.closest('#btnMedirDistancia')) {
                e.preventDefault();
                if (window.medirDistancia) {
                    window.medirDistancia();
                } else {
                    console.warn('⚠️ Función medirDistancia no disponible');
                }
            }
        });

        // Event listener para teclas de escape (finalizar medición)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (window.measurementHandler && window.measurementHandler.mediendoDistancia) {
                    window.finalizarMedicion();
                }
                if (window.mapInteractionHandler && window.mapInteractionHandler.hayElementoSeleccionado()) {
                    window.deseleccionarElemento();
                }
            }
        });

        // Event listener para double-click en el mapa (finalizar medición)
        if (window.map) {
            window.map.on('dblclick', (evt) => {
                if (window.measurementHandler && window.measurementHandler.mediendoDistancia) {
                    evt.preventDefault();
                    window.finalizarMedicion();
                }
            });
        }
    }

    /**
     * Configura las interacciones entre módulos
     */
    configurarInteracciones() {
        console.log('🔄 Configurando interacciones entre módulos...');

        // Configurar la conexión entre measurement y elevation profile
        if (window.measurementHandler && window.elevationProfileService) {
            // Override del método mostrarPerfilElevacion para usar el servicio correcto
            const originalMostrarPerfil = window.measurementHandler.mostrarPerfilElevacion;
            
            window.measurementHandler.mostrarPerfilElevacion = function() {
                if (this.puntosMedicion.length >= 2) {
                    const puntos = this.puntosMedicion.map((coord, index) => ({
                        lat: coord[1],
                        lon: coord[0],
                        index: index
                    }));
                    
                    window.elevationProfileService.mostrarGraficoPerfil(puntos, this.distanciaTotal);
                }
            };
        }

        // Configurar la integración con el elevation handler existente
        this.configurarIntegracionElevacion();

        console.log('✅ Interacciones configuradas');
    }

    /**
     * Configura la integración con el elevation handler existente
     */
    configurarIntegracionElevacion() {
        // Conectar el elevation profile service con el elevation handler
        if (window.elevationProfileService && window.elevationHandler) {
            // Override del método de obtener elevación para usar el handler existente
            window.elevationProfileService.obtenerElevacion = async function(lat, lon) {
                try {
                    if (window.elevationHandler && window.elevationHandler.obtenerElevacion) {
                        return await window.elevationHandler.obtenerElevacion(lat, lon);
                    }
                    return 0;
                } catch (error) {
                    console.warn('⚠️ Error obteniendo elevación:', error);
                    return 0;
                }
            };
        }
    }

    /**
     * Verifica que toda la funcionalidad esté disponible
     */
    verificarFuncionalidad() {
        console.log('🔍 Verificando funcionalidad...');

        const funcionesRequeridas = [
            'medirDistancia',
            'addDistancePoint', 
            'finalizarMedicion',
            'seleccionarElemento',
            'deseleccionarElemento',
            'mostrarGraficoPerfil',
            'calcularDistancia'
        ];

        const funcionesDisponibles = funcionesRequeridas.filter(func => 
            typeof window[func] === 'function'
        );

        const funcionesFaltantes = funcionesRequeridas.filter(func => 
            typeof window[func] !== 'function'
        );

        console.log(`✅ Funciones disponibles (${funcionesDisponibles.length}/${funcionesRequeridas.length}):`, funcionesDisponibles);
        
        if (funcionesFaltantes.length > 0) {
            console.warn('⚠️ Funciones faltantes:', funcionesFaltantes);
        }

        // Verificar módulos de handlers
        const modulosHandler = [
            'measurementHandler',
            'elevationProfileService',
            'mapInteractionHandler',
            'geometryUtils',
            'mobileOptimizationHandler'
        ];

        const modulosActivos = modulosHandler.filter(modulo => window[modulo]);
        console.log(`✅ Módulos activos (${modulosActivos.length}/${modulosHandler.length}):`, modulosActivos);

        // Verificar compatibilidad móvil
        if (window.mobileOptimizationHandler) {
            const infoDispositivo = window.mobileOptimizationHandler.obtenerInfoDispositivo();
            console.log('📱 Info del dispositivo:', infoDispositivo);
        }
    }

    /**
     * Reinicializa los módulos si es necesario
     */
    reinicializar() {
        console.log('🔄 Reinicializando herramientas...');
        this.modulosInicializados = false;
        this.inicializar();
    }

    /**
     * Obtiene el estado de inicialización
     */
    obtenerEstado() {
        return {
            inicializado: this.modulosInicializados,
            modulos: {
                measurementHandler: !!window.measurementHandler,
                elevationProfileService: !!window.elevationProfileService,
                mapInteractionHandler: !!window.mapInteractionHandler,
                geometryUtils: !!window.geometryUtils,
                mobileOptimizationHandler: !!window.mobileOptimizationHandler
            },
            funciones: {
                medirDistancia: typeof window.medirDistancia === 'function',
                seleccionarElemento: typeof window.seleccionarElemento === 'function',
                mostrarGraficoPerfil: typeof window.mostrarGraficoPerfil === 'function'
            }
        };
    }
}

// Crear instancia global
window.toolsInitializer = new ToolsInitializer();

// Auto-inicializar cuando se carga el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toolsInitializer.inicializar();
    });
} else {
    // DOM ya está listo, inicializar inmediatamente
    setTimeout(() => {
        window.toolsInitializer.inicializar();
    }, 100);
}

console.log('✅ ToolsInitializer cargado - auto-inicialización programada');
