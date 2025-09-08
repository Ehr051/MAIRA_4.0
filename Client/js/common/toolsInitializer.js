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
                // ✅ VERIFICAR FUNCIONES GLOBALES QUE SÍ EXISTEN (de herramientasP.js refactorizado)
                const funcionesRequeridas = [
                    'medirDistancia',
                    'addDistancePoint',
                    'finalizarMedicion',
                    'calcularDistancia',
                    'mostrarPerfilElevacion',
                    'seleccionarElemento',
                    'deseleccionarElemento'
                ];

                const funcionesDisponibles = funcionesRequeridas.every(func => 
                    typeof window[func] === 'function'
                );

                if (funcionesDisponibles) {
                    console.log('✅ Todas las funciones de herramientas cargadas');
                    resolve();
                } else {
                    const faltantes = funcionesRequeridas.filter(func => typeof window[func] !== 'function');
                    console.log('⏳ Esperando funciones:', faltantes);
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

        // ✅ VERIFICAR FUNCIONES ANTES DE USAR
        // Event listeners del measurement (si existe)
        if (typeof window.medirDistancia === 'function') {
            console.log('✅ Event listeners de medición disponibles');
        }

        // Event listeners de selección (si existe)
        if (typeof window.seleccionarElemento === 'function') {
            console.log('✅ Event listeners de selección disponibles');
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
                if (window.measuringDistance) {  // ✅ VARIABLE GLOBAL CORRECTA
                    if (typeof window.finalizarMedicion === 'function') {
                        window.finalizarMedicion();
                    }
                }
                if (window.elementoSeleccionado) {  // ✅ VARIABLE GLOBAL CORRECTA
                    if (typeof window.deseleccionarElemento === 'function') {
                        window.deseleccionarElemento();
                    }
                }
            }
        });

        // Event listener para double-click en el mapa (finalizar medición)
        if (window.mapa) {  // ✅ USAR 'mapa' NO 'map'
            window.mapa.on('dblclick', (evt) => {
                if (window.measuringDistance) {  // ✅ VARIABLE GLOBAL CORRECTA
                    evt.preventDefault();
                    if (typeof window.finalizarMedicion === 'function') {
                        window.finalizarMedicion();
                    }
                }
            });
        }
    }

    /**
     * Configura las interacciones entre módulos
     */
    configurarInteracciones() {
        console.log('🔄 Configurando interacciones entre módulos...');

        // ✅ VERIFICAR QUE LAS FUNCIONES EXISTAN ANTES DE CONFIGURAR INTERACCIONES
        if (typeof window.mostrarPerfilElevacion === 'function' && 
            typeof window.mostrarGraficoPerfil === 'function') {
            console.log('✅ Interacciones de perfil de elevación disponibles');
        }

        // Configurar la integración con el elevation handler existente
        this.configurarIntegracionElevacion();

        console.log('✅ Interacciones configuradas');
    }

    /**
     * Configura la integración con el elevation handler existente
     */
    configurarIntegracionElevacion() {
        // ✅ VERIFICAR QUE LOS HANDLERS EXISTAN
        if (window.elevationHandler && typeof window.elevationHandler.obtenerElevacion === 'function') {
            console.log('✅ ElevationHandler disponible para integración');
        } else {
            console.log('⚠️ ElevationHandler no disponible aún');
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
        const funcionesHandler = [
            'medirDistancia',
            'finalizarMedicion', 
            'seleccionarElemento',
            'calcularDistancia',
            'mostrarPerfilElevacion'
        ];

        const funcionesActivas = funcionesHandler.filter(func => typeof window[func] === 'function');
        console.log(`✅ Funciones activas (${funcionesActivas.length}/${funcionesHandler.length}):`, funcionesActivas);

        // Verificar handlers de terreno
        const handlersTerreno = ['elevationHandler', 'vegetacionHandler'];
        const handlersTerrenoActivos = handlersTerreno.filter(handler => window[handler]);
        console.log(`✅ Handlers de terreno activos (${handlersTerrenoActivos.length}/${handlersTerreno.length}):`, handlersTerrenoActivos);

        // Verificar compatibilidad móvil
        if (typeof window.detectarDispositivoMovil === 'function') {
            try {
                const infoDispositivo = window.detectarDispositivoMovil();
                console.log('📱 Info del dispositivo:', infoDispositivo);
            } catch (error) {
                console.log('📱 Detectar dispositivo móvil disponible pero con error:', error.message);
            }
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
            handlers: {
                elevationHandler: !!window.elevationHandler,
                vegetacionHandler: !!window.vegetacionHandler,
                searchHandler: !!window.searchHandler
            },
            funciones: {
                medirDistancia: typeof window.medirDistancia === 'function',
                seleccionarElemento: typeof window.seleccionarElemento === 'function',
                mostrarGraficoPerfil: typeof window.mostrarGraficoPerfil === 'function',
                calcularDistancia: typeof window.calcularDistancia === 'function',
                finalizarMedicion: typeof window.finalizarMedicion === 'function'
            },
            variables: {
                mapa: !!window.mapa,
                calcoActivo: !!window.calcoActivo,
                measuringDistance: !!window.measuringDistance,
                elementoSeleccionado: !!window.elementoSeleccionado
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
