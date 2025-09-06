/**
 * 🚀 MAIRA 4.0 - BOOTSTRAP LOADER (LIMPIO)
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
            '/Client/js/core/UserIdentity.js'       // ✅ CORREGIDO: está en core/, no common/
            // Nota: core/index.js y config/index.js usan ES6 modules - se cargan por separado
        ],
        
        // 2. UTILIDADES BASE
        utils: [
            '/Client/js/utils/eventemitter.js'
        ],
        
        // 3. INFRAESTRUCTURA DDD
        infrastructure: [
            '/Client/js/infrastructure/terrainAdapter.js'
        ],
        
        // 4. SERVICIOS DDD (Hexagonal Architecture)
        services: [
            '/Client/js/services/servicesManager.js',
            '/Client/js/services/transitabilityService.js',
            '/Client/js/services/slopeAnalysisService.js',
            '/Client/js/services/threeDMapService.js',
            '/Client/js/services/combatSystem3DIntegrator.js',
            '/Client/js/services/autonomousAgentService.js'
        ],
        
        // 5. MÓDULOS COMUNES (INCLUYE LAS FUNCIONES GLOBALES)
        common: [
            '/Client/js/common/networkConfig.js',  // ✅ MOVIDO AQUÍ - es común a todos
            '/Client/js/common/MAIRAChat.js',
            // '/Client/js/common/indexP.js',        // ❌ MOVIDO: Solo para planeamiento, no para landing
            '/Client/js/common/miradial.js',
            '/Client/js/common/panelMarcha.js',
            '/Client/js/common/mapaP.js',
            '/Client/js/common/simbolosP.js',     // ✅ actualizarSidc y agregarMarcador se cargan aquí
            '/Client/js/common/herramientasP.js',  // ✅ REFACTORIZADO: Ahora es stub de compatibilidad
            // '/Client/js/common/herramientasP.js',  // ❌ REFACTORIZADO: Reemplazado por módulos especializados
            '/Client/js/common/migrationMap.js',      // 📋 NUEVO: Documentación de la refactorización
            '/Client/js/common/toolsInitializer.js',  // ✅ NUEVO: Inicializador de herramientas refactorizadas
            '/Client/js/common/dibujosMCCP.js',
            '/Client/js/common/atajosP.js',
            '/Client/js/common/CalculoMarcha.js',
            '/Client/js/common/graficoMarcha.js',
            '/Client/js/common/edicioncompleto.js',
            '/Client/js/utils/calcosP.js'
        ],
        
        // 6. HANDLERS (TERRENO Y OPTIMIZACIÓN) + MÓDULOS REFACTORIZADOS
        handlers: [
            // Dependency Manager PRIMERO - necesario para cargar librerías externas
            '/Client/js/handlers/dependency-manager.js',    // ✅ NUEVO: Gestor de dependencias CDN/node_modules
            
            // Handlers originales de terreno
            '/Client/js/handlers/elevationHandler.js',      // ✅ CORREGIDO: está en handlers/
            '/Client/js/handlers/vegetacionhandler.js',     // ✅ CORREGIDO: está en handlers/
            '/Client/js/workers/elevation.worker.js',       // ✅ CORREGIDO: worker está en workers/
            '/Client/js/handlers/measurement-touch-optimizer.js',
            '/Client/js/ui/mobile-optimizer.js',
            
            // ✅ NUEVOS MÓDULOS REFACTORIZADOS (reemplazando herramientasP.js)
            '/Client/js/utils/geometryUtils.js',            // Utilidades geométricas primero
            '/Client/js/handlers/mobileOptimizationHandler.js',  // Optimización móvil
            '/Client/js/handlers/mapInteractionHandler.js', // Interacciones del mapa
            '/Client/js/services/elevationProfileService.js',   // Servicio de perfiles
            '/Client/js/handlers/measurementHandler.js'     // Medición de distancia (último - depende de otros)
        ],
        
        // 7. GESTORES BASE (para juego) - ⚠️ ORDEN CRÍTICO
        gestores: [
            '/Client/js/utils/eventemitter.js',             // ✅ PRIMERO - Base de eventos
            '/Client/js/handlers/gestorBase.js',            // ✅ SEGUNDO - Hereda de EventEmitter
            '/Client/js/handlers/gestorComunicacion.js',
            '/Client/js/handlers/gestorEventos.js',
            '/Client/js/handlers/gestorCarga.js',
            '/Client/js/handlers/gestorEstado.js',
            '/Client/js/handlers/gestorMapa.js',
            '/Client/js/handlers/gestorAcciones.js',
            '/Client/js/handlers/gestorInterfaz.js',
            '/Client/js/handlers/gestorUnidades.js',
            '/Client/js/handlers/gestorFases.js',
            '/Client/js/handlers/gestorTurnos.js',
            '/Client/js/handlers/gestorJuego.js'            // ✅ ÚLTIMO - Coordina todos
        ],
        
        // 8. MÓDULOS ESPECÍFICOS
        modules: {
            // HOME/LANDING PAGE
            home: [
                '/Client/js/utils/config.js',
                '/Client/js/handlers/landing3d.js',
                '/Client/js/ui/carrusel.js',
                '/Client/js/utils/validacion.js'
            ],
            
            // PLANEAMIENTO TÁCTICO (CON TODOS LOS JS)
            planeamiento: [
                '/Client/js/Test/testPlaneamiento.js',
                '/Client/js/Test/autoTest.js',
                '/Client/js/Test/visualizadorTests.js'
            ],
            
            // COMANDOS Y ORGANIZACIÓN
            organizacion: [
                '/Client/js/ui/paneledicionCO.js',
                '/Client/js/modules/organizacion/conexionesCO.js',
                '/Client/js/modules/organizacion/CO.js'
            ],
            
            // JUEGO DE GUERRA (CON GESTORES Y HEXGRID)
            juego: [
                '/Client/js/modules/juego/hexgrid.js',
                '/Client/js/modules/juego/combate.js'
                // ✅ Los gestores se cargan en la sección 'gestores'
            ],
            
            // INICIO GESTIÓN DE BATALLA
            inicioGB: [
                '/Client/js/modules/gestion/inicioGBhandler.js'
            ],
            
            // PARTIDAS Y GESTIÓN DE BATALLA (COMPLETO)
            partidas: [
                '/Client/js/common/partidas.js',
                '/Client/js/modules/partidas/iniciarpartida.js',
                '/Client/js/utils/utilsGB.js',
                '/Client/js/modules/gestion/edicionGB.js',
                '/Client/js/modules/gestion/informesGB.js',
                '/Client/js/modules/gestion/elementosGB.js',
                '/Client/js/modules/gestion/gestionBatalla.js',  // ✅ ANTES que GB.js
                '/Client/js/modules/gestion/GB.js'               // ✅ Solo wrapper
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

    /**
     * 🏗️ CLASE BOOTSTRAP PRINCIPAL
     */
    class MAIRABootstrap {
        constructor() {
            this.loadedFiles = new Set();
            this.loadingPromises = new Map();
            this.errorFiles = new Set();
            
            console.log('🏗️ MAIRABootstrap inicializado');
        }

        /**
         * Cargar un archivo JavaScript individual
         */
        async loadFile(filePath) {
            if (this.loadedFiles.has(filePath)) {
                return Promise.resolve();
            }

            if (this.loadingPromises.has(filePath)) {
                return this.loadingPromises.get(filePath);
            }

            const promise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = filePath;
                script.type = 'text/javascript';
                
                script.onload = () => {
                    this.loadedFiles.add(filePath);
                    console.log(`✅ Cargado: ${filePath}`);
                    resolve();
                };
                
                script.onerror = (error) => {
                    this.errorFiles.add(filePath);
                    console.error(`❌ Error cargando: ${filePath}`, error);
                    reject(new Error(`Failed to load ${filePath}`));
                };
                
                document.head.appendChild(script);
            });

            this.loadingPromises.set(filePath, promise);
            return promise;
        }

        /**
         * Cargar múltiples archivos en paralelo
         */
        async loadFiles(filePaths) {
            if (!Array.isArray(filePaths)) {
                throw new Error('filePaths debe ser un array');
            }

            const promises = filePaths.map(path => 
                this.loadFile(path).catch(error => {
                    console.warn(`⚠️ Error opcional en ${path}:`, error);
                    return null; // Continuar con otros archivos
                })
            );

            await Promise.allSettled(promises);
        }

        /**
         * Cargar en secuencia por categorías
         */
        async loadCategory(categoryName, files) {
            console.log(`📂 Cargando categoría: ${categoryName}`);
            
            if (Array.isArray(files)) {
                await this.loadFiles(files);
            } else if (typeof files === 'object') {
                // Es un objeto con subcategorías
                for (const [subCat, subFiles] of Object.entries(files)) {
                    console.log(`📂 Subcategoría: ${categoryName}.${subCat}`);
                    await this.loadFiles(subFiles);
                }
            }
            
            console.log(`✅ Categoría completada: ${categoryName}`);
        }

        /**
         * 🎯 CARGA ESPECÍFICA POR MÓDULO
         */
        async loadForModule(moduleName) {
            console.log(`🎯 Cargando para módulo: ${moduleName}`);
            
            try {
                // 1. CORE (siempre necesario)
                await this.loadCategory('core', LOAD_ORDER.core);
                
                // 2. UTILS (siempre necesario)
                await this.loadCategory('utils', LOAD_ORDER.utils);
                
                // 3. INFRAESTRUCTURA
                await this.loadCategory('infrastructure', LOAD_ORDER.infrastructure);
                
                // 4. SERVICIOS (solo los necesarios por módulo)
                await this.loadServicesForModule(moduleName);
                
                // 5. COMÚN (contiene las funciones globales básicas)
                await this.loadCommonForModule(moduleName);
                
                // 6. HANDLERS (solo los necesarios por módulo)
                await this.loadHandlersForModule(moduleName);
                
                // 7. GESTORES (solo para módulos que los necesitan)
                if (['juego', 'partidas', 'gestionBatalla', 'planeamiento'].includes(moduleName)) {
                    await this.loadCategory('gestores', LOAD_ORDER.gestores);
                }
                
                // 8. MÓDULOS ESPECÍFICOS
                if (LOAD_ORDER.modules[moduleName]) {
                    await this.loadCategory(`modules.${moduleName}`, LOAD_ORDER.modules[moduleName]);
                }
                
                // 9. GAMING (si es necesario)
                if (['juego', 'partidas'].includes(moduleName)) {
                    await this.loadCategory('gaming', LOAD_ORDER.gaming);
                }
                
                // 10. TESTING (solo en desarrollo)
                if (window.location.hostname === 'localhost' || window.location.href.includes('test')) {
                    await this.loadCategory('testing', LOAD_ORDER.testing);
                }
                
                console.log(`🎉 MÓDULO ${moduleName.toUpperCase()} CARGADO COMPLETAMENTE`);
                console.log(`📊 Archivos cargados: ${this.loadedFiles.size}`);
                console.log(`❌ Archivos con error: ${this.errorFiles.size}`);
                
            } catch (error) {
                console.error(`💥 Error crítico cargando módulo ${moduleName}:`, error);
                throw error;
            }
        }

        /**
         * 📊 INFORMACIÓN DE ESTADO
         */
        getStatus() {
            return {
                loaded: Array.from(this.loadedFiles),
                errors: Array.from(this.errorFiles),
                total: this.loadedFiles.size + this.errorFiles.size
            };
        }

        // 🎯 MÉTODOS DE CARGA SELECTIVA POR MÓDULO
        
        async loadServicesForModule(moduleName) {
            const servicesByModule = {
                'home': [], // Home no necesita servicios pesados
                'planeamiento': [
                    '/Client/js/services/servicesManager.js',
                    '/Client/js/services/transitabilityService.js', 
                    '/Client/js/services/slopeAnalysisService.js',
                    '/Client/js/services/elevationProfileService.js'
                ],
                'gestionBatalla': [
                    '/Client/js/services/servicesManager.js',
                    '/Client/js/services/combatSystem3DIntegrator.js',
                    '/Client/js/services/elevationProfileService.js'
                ],
                'juego': LOAD_ORDER.services, // Juego necesita todos
                'organizacion': [
                    '/Client/js/services/servicesManager.js'
                ]
            };
            
            const services = servicesByModule[moduleName] || [];
            if (services.length > 0) {
                await this.loadFiles(services);
                console.log(`✅ Servicios cargados para ${moduleName}:`, services.length);
            }
        }
        
        async loadCommonForModule(moduleName) {
            const commonByModule = {
                'home': [
                    '/Client/js/common/networkConfig.js'
                    // ❌ REMOVIDO: indexP.js no es necesario para landing page
                ],
                'planeamiento': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/indexP.js',
                    '/Client/js/common/mapaP.js',
                    '/Client/js/common/simbolosP.js',
                    '/Client/js/common/herramientasP.js',
                    '/Client/js/common/migrationMap.js',
                    '/Client/js/common/toolsInitializer.js',
                    '/Client/js/common/dibujosMCCP.js'
                ],
                'gestionBatalla': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/indexP.js',
                    '/Client/js/common/mapaP.js',
                    '/Client/js/common/simbolosP.js',
                    '/Client/js/common/herramientasP.js',
                    '/Client/js/common/migrationMap.js',
                    '/Client/js/common/toolsInitializer.js'
                ],
                'organizacion': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/indexP.js'
                ]
            };
            
            const common = commonByModule[moduleName] || LOAD_ORDER.common;
            await this.loadFiles(common);
            console.log(`✅ Common cargado para ${moduleName}:`, common.length);
        }
        
        async loadHandlersForModule(moduleName) {
            const handlersByModule = {
                'home': [
                    '/Client/js/handlers/dependency-manager.js'  // ✅ CRÍTICO: Dependency manager para cargar Leaflet/etc
                ],
                'planeamiento': [
                    '/Client/js/handlers/dependency-manager.js', // ✅ CRÍTICO: Dependency manager primero
                    '/Client/js/utils/geometryUtils.js',
                    '/Client/js/handlers/mobileOptimizationHandler.js',
                    '/Client/js/handlers/mapInteractionHandler.js',
                    '/Client/js/handlers/measurementHandler.js',
                    '/Client/js/handlers/elevationHandler.js'
                ],
                'gestionBatalla': [
                    '/Client/js/handlers/dependency-manager.js', // ✅ CRÍTICO: Dependency manager primero
                    '/Client/js/utils/geometryUtils.js',
                    '/Client/js/handlers/mobileOptimizationHandler.js',
                    '/Client/js/handlers/mapInteractionHandler.js',
                    '/Client/js/handlers/elevationHandler.js',
                    '/Client/js/handlers/edicionGB.js'
                ],
                'organizacion': [
                    '/Client/js/handlers/dependency-manager.js', // ✅ CRÍTICO: Dependency manager primero
                    '/Client/js/handlers/CO.js'
                ],
                'juego': LOAD_ORDER.handlers // Juego necesita todos
            };
            
            const handlers = handlersByModule[moduleName] || [];
            if (handlers.length > 0) {
                await this.loadFiles(handlers);
                console.log(`✅ Handlers cargados para ${moduleName}:`, handlers.length);
            }
        }
    }

    // ✅ EXPORTAR EL BOOTSTRAP GLOBALMENTE
    window.MAIRABootstrap = new MAIRABootstrap();
    
    // También en namespace MAIRA
    if (!window.MAIRA) window.MAIRA = {};
    window.MAIRA.Bootstrap = window.MAIRABootstrap;

    // 🔍 FUNCIONES GLOBALES SE CARGAN DESDE SUS MÓDULOS RESPECTIVOS
    // - toggleMenu: se carga desde /Client/js/common/indexP.js
    // - actualizarSidc: se carga desde /Client/js/common/simbolosP.js  
    // - agregarMarcador: se carga desde /Client/js/common/simbolosP.js

    console.log('🚀 MAIRA Bootstrap - Sistema de carga unificado inicializado');
    console.log('✅ MAIRABootstrap disponible globalmente');
    console.log('🔍 Funciones globales (toggleMenu, actualizarSidc, agregarMarcador) se cargan desde sus módulos respectivos');

})();
