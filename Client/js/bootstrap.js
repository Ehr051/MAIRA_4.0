/**
 * 🚀 MAIRA 4.0 - BOOTSTRAP LOADER
 * Sistema de carga unificado siguiendo arquitectura DDD/Hexagonal
 * Un único punto de entrada para todos los módulos
 */

(function() {
    'use strict';

    // 📋 ORDEN DE CARGA SEGÚN DEPENDENCIAS
    const LOAD_ORDER = {
        // 1. CORE FUNDAMENTALES
        core: [
            '/Client/js/common/networkConfig.js',
            '/Client/js/common/UserIdentity.js'
        ],
        
        // 2. UTILIDADES BASE
        utils: [
            '/Client/js/utils/eventemitter.js'
        ],
        
        // 3. INFRAESTRUCTURA DDD
        infrastructure: [
            '/Client/js/infrastructure/terrainAdapter.js'
        ],
        
        // 4. HANDLERS (Carga y gestión de datos especializados)
        handlers: [
            '/Client/js/handlers/elevationHandler.js',
            '/Client/js/handlers/vegetacionhandler.js'
        ],
        
        // 5. SERVICIOS DDD (Hexagonal Architecture)
        services: [
            '/Client/js/services/servicesManager.js',
            '/Client/js/services/transitabilityService.js',
            '/Client/js/services/slopeAnalysisService.js',
            '/Client/js/services/threeDMapService.js',
            '/Client/js/services/combatSystem3DIntegrator.js',
            '/Client/js/services/autonomousAgentService.js'
        ],
        
        // 5. MÓDULOS COMUNES
        common: [
            '/Client/js/common/MAIRAChat.js',
            '/Client/js/common/indexP.js',
            '/Client/js/common/miradial.js',
            '/Client/js/common/panelMarcha.js',
            '/Client/js/common/mapaP.js',
            '/Client/js/common/simbolosP.js',
            '/Client/js/common/herramientasP.js',
            '/Client/js/common/dibujosMCCP.js',
            '/Client/js/common/atajosP.js',
            '/Client/js/common/CalculoMarcha.js',
            '/Client/js/common/graficoMarcha.js',
            '/Client/js/common/edicioncompleto.js',
            '/Client/js/utils/calcosP.js'
        ],
        
        // 6. HANDLERS
        handlers: [
            '/Client/js/common/elevationHandler.js',
            '/Client/js/common/vegetacionhandler.js',
            '/Client/js/handlers/measurement-touch-optimizer.js',
            '/Client/js/ui/mobile-optimizer.js'
        ],
        
        // 7. GESTORES BASE (para juego) - ⚠️ CONSOLIDADO SIN DUPLICADOS
        gestores: [
            '/Client/js/modules/juego/gestorBase.js',
            '/Client/js/modules/juego/gestorComunicacion.js',
            '/Client/js/modules/juego/gestorEventos.js',
            '/Client/js/modules/juego/gestorCarga.js',
            '/Client/js/modules/juego/gestorEstado.js',
            '/Client/js/modules/juego/gestorMapa.js',
            '/Client/js/modules/juego/gestorAcciones.js',
            '/Client/js/modules/juego/gestorInterfaz.js',
            '/Client/js/modules/juego/gestorUnidades.js',
            '/Client/js/modules/juego/gestorFases.js',
            '/Client/js/modules/juego/gestorTurnos.js', // ✅ SOLO EL DE MODULES - NO HANDLERS
            '/Client/js/modules/juego/gestorJuego.js'
        ],
        
        // 8. MÓDULOS ESPECÍFICOS
        modules: {
            juego: [
                '/Client/js/modules/juego/hexgrid.js',
                '/Client/js/modules/juego/combate.js'
            ],
            organizacion: [
                '/Client/js/ui/paneledicionCO.js',
                '/Client/js/modules/organizacion/conexionesCO.js',
                '/Client/js/modules/organizacion/CO.js'
            ],
            planeamiento: [
                // Los archivos comunes ya están cargados en 'common'
                '/Client/js/modules/planeamiento/testPlaneamiento.js'
            ],
            partidas: [
                '/Client/js/common/partidas.js',
                '/Client/js/modules/partidas/iniciarpartida.js',
                '/Client/js/utils/utilsGB.js',
                '/Client/js/modules/gestion/edicionGB.js',
                '/Client/js/modules/gestion/informesGB.js',
                '/Client/js/modules/gestion/elementosGB.js',
                '/Client/js/modules/gestion/gestionBatalla.js',
                '/Client/js/modules/gestion/GB.js'
            ]
        },
        
        // 9. GAMING ENGINE (opcional)
        gaming: [
            '/Client/js/gaming/GameEngine.js',
            '/Client/js/gaming/AIDirector.js'
        ],
        
        // 10. TESTING (si está habilitado)
        testing: [
            '/Client/js/Test/MAIRATestSuite.js',
            '/Client/js/Test/testButtons.js',
            '/Client/js/Test/testPlaneamiento.js',
            '/Client/js/Test/autoTest.js',
            '/Client/js/Test/visualizadorTests.js'
        ]
    };

    class MAIRABootstrap {
        constructor() {
            this.loadedScripts = new Set();
            this.moduleConfig = null;
            this.currentModule = null;
            this.enableTesting = window.location.search.includes('test=true');
        }

        /**
         * 🎯 CARGA MÓDULOS SEGÚN EL CONTEXTO
         */
        async loadForModule(moduleName, additionalModules = []) {
            console.log(`🚀 MAIRA Bootstrap - Iniciando carga para módulo: ${moduleName}`);
            
            try {
                this.currentModule = moduleName;

                // 1. Cargar dependencias base en orden
                await this.loadSequential(LOAD_ORDER.core);
                await this.loadSequential(LOAD_ORDER.utils);
                
                // 2. Cargar infraestructura DDD
                await this.loadSequential(LOAD_ORDER.infrastructure);
                
                // 3. Cargar handlers especializados (datos)
                await this.loadSequential(LOAD_ORDER.handlers);
                
                // 4. Cargar servicios DDD (Hexagonal Architecture)
                await this.loadSequential(LOAD_ORDER.services);
                
                // 5. Cargar módulos comunes
                await this.loadSequential(LOAD_ORDER.common);

                // 6. Cargar según módulo específico
                switch (moduleName) {
                    case 'juego':
                        await this.loadForJuego();
                        break;
                    case 'planeamiento':
                        await this.loadForPlaneamiento();
                        break;
                    case 'organizacion':
                        await this.loadForOrganizacion();
                        break;
                    case 'partidas':
                        await this.loadForPartidas();
                        break;
                }

                // 7. Cargar módulos adicionales si se especifican
                for (const additionalModule of additionalModules) {
                    if (LOAD_ORDER.modules[additionalModule]) {
                        await this.loadSequential(LOAD_ORDER.modules[additionalModule]);
                    }
                }

                // 8. Cargar testing si está habilitado
                if (this.enableTesting) {
                    await this.loadSequential(LOAD_ORDER.testing);
                }

                // 9. Inicializar servicios DDD
                await this.initializeServices();

                console.log(`✅ MAIRA Bootstrap - ${moduleName} cargado completamente`);
                this.notifyLoadComplete(moduleName);

            } catch (error) {
                console.error(`❌ Error en bootstrap para ${moduleName}:`, error);
                throw error;
            }
        }

        /**
         * 🔧 INICIALIZAR SERVICIOS DDD
         */
        async initializeServices() {
            try {
                console.log('🔧 Inicializando servicios DDD...');
                
                if (typeof MAIRAServicesManager !== 'undefined') {
                    const servicesManager = await MAIRAServicesManager.autoInitialize();
                    
                    // Esperar a que todos los servicios estén listos
                    return new Promise((resolve) => {
                        const checkServices = () => {
                            if (servicesManager.initialized) {
                                console.log('✅ Servicios DDD inicializados correctamente');
                                resolve(servicesManager);
                            } else {
                                setTimeout(checkServices, 100);
                            }
                        };
                        checkServices();
                    });
                } else {
                    console.warn('⚠️ MAIRAServicesManager no disponible');
                }
            } catch (error) {
                console.error('❌ Error inicializando servicios DDD:', error);
                // No bloquear la carga si fallan los servicios opcionales
            }
        }

        /**
         * 🎮 CARGA ESPECÍFICA PARA JUEGO
         */
        async loadForJuego() {
            await this.loadSequential(LOAD_ORDER.gestores);
            await this.loadSequential(LOAD_ORDER.modules.juego);
            
            // Gaming engine opcional
            if (window.ENABLE_GAMING_ENGINE) {
                await this.loadSequential(LOAD_ORDER.gaming);
            }
        }

        /**
         * 📋 CARGA ESPECÍFICA PARA PLANEAMIENTO
         */
        async loadForPlaneamiento() {
            await this.loadSequential(LOAD_ORDER.modules.planeamiento);
        }

        /**
         * 👥 CARGA ESPECÍFICA PARA ORGANIZACIÓN
         */
        async loadForOrganizacion() {
            await this.loadSequential(LOAD_ORDER.modules.organizacion);
        }

        /**
         * 🎯 CARGA ESPECÍFICA PARA PARTIDAS
         */
        async loadForPartidas() {
            await this.loadSequential(LOAD_ORDER.modules.partidas);
        }

        /**
         * 📥 CARGA SECUENCIAL DE SCRIPTS
         */
        async loadSequential(scripts) {
            for (const script of scripts) {
                await this.loadScript(script);
            }
        }

        /**
         * 📥 CARGA INDIVIDUAL DE SCRIPT
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                // Evitar cargas duplicadas
                if (this.loadedScripts.has(src)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.async = false; // Mantener orden
                
                script.onload = () => {
                    this.loadedScripts.add(src);
                    console.log(`✅ Cargado: ${src}`);
                    resolve();
                };
                
                script.onerror = () => {
                    console.warn(`⚠️ Error cargando: ${src}`);
                    reject(new Error(`Failed to load script: ${src}`));
                };
                
                document.head.appendChild(script);
            });
        }

        /**
         * 📢 NOTIFICAR CARGA COMPLETA
         */
        notifyLoadComplete(moduleName) {
            // Disparar evento personalizado
            const event = new CustomEvent('mairaBootstrapComplete', {
                detail: {
                    module: moduleName,
                    loadedScripts: Array.from(this.loadedScripts),
                    timestamp: new Date().toISOString()
                }
            });
            
            document.dispatchEvent(event);
            
            // También en namespace global
            if (window.MAIRA) {
                window.MAIRA.bootstrapComplete = true;
                window.MAIRA.currentModule = moduleName;
            }
        }

        /**
         * 🔍 OBTENER ESTADO DE CARGA
         */
        getLoadStatus() {
            return {
                currentModule: this.currentModule,
                loadedScripts: Array.from(this.loadedScripts),
                totalScripts: this.loadedScripts.size,
                testingEnabled: this.enableTesting
            };
        }
    }

    // 🌍 EXPORTAR GLOBALMENTE
    window.MAIRABootstrap = MAIRABootstrap;

    // 🚀 FUNCIÓN DE CARGA CONVENIENTE
    window.loadMAIRAModule = async function(moduleName, additionalModules = []) {
        const bootstrap = new MAIRABootstrap();
        return await bootstrap.loadForModule(moduleName, additionalModules);
    };

    // ✅ EXPORTAR EL BOOTSTRAP GLOBALMENTE
    window.MAIRABootstrap = new MAIRABootstrap();
    
    // También en namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    window.MAIRA.Bootstrap = window.MAIRABootstrap;

    // 🛠️ FUNCIÓN GLOBAL TOGGLEMENU PARA COMPATIBILIDAD
    if (!window.toggleMenu) {
        window.toggleMenu = function(menuId) {
            console.log('� toggleMenu global ejecutado para:', menuId);
            
            // Buscar el elemento
            const elemento = document.getElementById(menuId);
            if (!elemento) {
                console.warn('⚠️ Elemento no encontrado:', menuId);
                return;
            }
            
            // Toggle de la clase collapse/show
            if (elemento.classList.contains('show')) {
                elemento.classList.remove('show');
                elemento.classList.add('collapse');
            } else {
                elemento.classList.remove('collapse');
                elemento.classList.add('show');
            }
        };
    }

    console.log('�🚀 MAIRA Bootstrap - Sistema de carga unificado inicializado');
    console.log('✅ MAIRABootstrap disponible globalmente');
    console.log('🔧 toggleMenu global configurado');

})();
