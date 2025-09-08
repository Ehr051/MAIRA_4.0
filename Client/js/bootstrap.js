/**
 * 🚀 MAIRA 4.0 - BOOTSTRAP LOADER (LIMPIO)
 * Sistema de carga unificado siguiendo arquitectura DDD/Hexagonal
 * Un único punto de entrada para todos los módulos
 */

(function() {
    'use strict';

    // 📋 ORDEN DE CARGA SEGÚN DEPENDENCIAS
    const LOAD_ORDER = {
        // 1. CORE FUNDAMENTALES - Solo archivos que realmente existen
        core: [
            '/Client/js/core/UserIdentity.js',         // ✅ EXISTE: gestión de identidad
            '/Client/js/utils/sessionManager.js'       // ✅ EXISTE: gestión de sesión
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
            '/Client/js/handlers/measurementHandler.js',    // Medición de distancia (último - depende de otros)
            
            // ✅ GAMING Y DIRECTOR
            '/Client/js/handlers/DirectorManager.js'        // Sistema roles director/creador
        ],
        
        // 7. GESTORES BASE (para juego) - ⚠️ ORDEN CRÍTICO
        gestores: [
            '/Client/js/modules/juego/gestorBase.js',       // ✅ PRIMERO - Base de todos los gestores
            '/Client/js/modules/juego/gestorEventos.js',    // ✅ SEGUNDO - Sistema de eventos
            '/Client/js/modules/juego/gestorEstado.js',     // ✅ TERCERO - Gestión de estado
            '/Client/js/modules/juego/gestorComunicacion.js', // ✅ Comunicación
            '/Client/js/modules/juego/gestorCarga.js',      // ✅ Carga de datos
            '/Client/js/modules/juego/gestorMapa.js',       // ✅ Gestión del mapa
            '/Client/js/modules/juego/gestorInterfaz.js',   // ✅ Interfaz de usuario
            '/Client/js/modules/juego/gestorAcciones.js',   // ✅ Acciones del juego
            '/Client/js/modules/juego/gestorUnidades.js',   // ✅ Gestión de unidades
            '/Client/js/modules/juego/gestorFases.js',      // ✅ Fases del juego
            '/Client/js/handlers/gestorTurnos.js',          // ✅ Sistema de turnos (compartido)
            '/Client/js/modules/juego/gestorJuego.js'       // ✅ ÚLTIMO - Coordina todos
        ],
        
        // 8. MÓDULOS ESPECÍFICOS - Basado en análisis HTML real + funcionalidades 4.0
        modules: {
            // 🏠 INDEX/HOME - Scripts exactos del viejo/static/index.html
            home: [
                '/Client/js/utils/config.js',              // ✅ config.js según original
                '/Client/js/ui/landing3d.js',              // ✅ CORREGIDO: movido de handlers/ a ui/ en DDD
                '/Client/js/ui/carrusel.js',               // ✅ carrusel.js según original
                '/Client/js/utils/validacion.js'           // ✅ validacion.js según original
                // ❌ NO index.js - no existe en original
            ],
            
            // 📋 PLANEAMIENTO - Sin chat + Tests + funcionalidades 4.0 + herramientas completas
            planeamiento: [
                '/Client/js/common/indexP.js',             // ✅ PRIMERO - Script principal de planeamiento
                '/Client/js/Test/autoTest.js',
                '/Client/js/Test/visualizadorTests.js',
                '/Client/js/Test/testPlaneamiento.js'
                // ✅ Las herramientas refactorizadas se cargan automáticamente en handlers
                // ✅ toolsInitializer.js ya está en common y se auto-inicializa
            ],
            
            // 🏗️ CO/ORGANIZACIÓN - Sin chat, orden crítico + funcionalidades 4.0
            organizacion: [
                '/Client/js/ui/paneledicionCO.js',         // ✅ SEGUNDO - Panel edición
                '/Client/js/modules/organizacion/conexionesCO.js', // ✅ TERCERO - Conexiones
                '/Client/js/modules/organizacion/CO.js'    // ✅ ÚLTIMO - Lógica principal
            ],
            
            // 🎯 INICIAR PARTIDA - Scripts exactos del viejo/static/iniciarpartida.html
            partidas: [
                '/Client/js/common/partidas.js',           // ✅ partidas.js según original
                '/Client/js/modules/partidas/iniciarpartida.js' // ✅ iniciarpartida.js según original
            ],
            
            // 🎮 JUEGO DE GUERRA - Solo gestores y componentes base
            juegodeguerra: [
                '/Client/js/modules/juego/hexgrid.js',     // ✅ Grid hexagonal
                '/Client/js/modules/juego/combate.js',     // ✅ Sistema de combate
                // ✅ Los gestores se cargan automáticamente en la categoría 'gestores'
                '/Client/js/gaming/GameEngine.js',         // ✅ Motor de juego avanzado
                '/Client/js/gaming/AIDirector.js'          // ✅ Director de IA
            ],
            
            // 🏢 INICIO GB - Con chat
            inicioGB: [
                '/Client/js/modules/gestion/inicioGBhandler.js'
            ],
            
            // ⚔️ GESTIÓN BATALLA - Con chat + funcionalidades 4.0 completas
            gestionbatalla: [
                '/Client/js/utils/utilsGB.js',             // ✅ Específico GB según análisis
                '/Client/js/modules/gestion/edicionGB.js',
                '/Client/js/modules/gestion/informesGB.js',
                '/Client/js/modules/gestion/elementosGB.js',
                '/Client/js/modules/gestion/gestionBatalla.js', // ✅ Script principal según análisis
                // ✅ Funcionalidades 4.0 agregadas:
                '/Client/js/gaming/AIDirector.js',         // ✅ 4.0: Director de IA para GB
                '/Client/js/services/combatSystem3DIntegrator.js', // ✅ 4.0: Integración 3D
                '/Client/js/services/autonomousAgentService.js'    // ✅ 4.0: Agentes autónomos
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
                
                // 7. GESTORES (solo para módulos de JUEGO, NO planeamiento)
                if (['juegodeguerra', 'gestionbatalla'].includes(moduleName)) {
                    await this.loadCategory('gestores', LOAD_ORDER.gestores);
                    console.log(`✅ Gestores cargados para ${moduleName}`);
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
                // 🏠 INDEX/HOME - Solo básicos SIN CHAT (confirmado con viejo/static/index.html)
                'home': [
                    '/Client/js/common/networkConfig.js'
                    // ❌ NO MAIRAChat.js - index.html original NO tiene chat
                ],
                
                // 🎯 INICIAR PARTIDA - Básicos + Chat (confirmado con viejo/static)
                'partidas': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/MAIRAChat.js'        // ✅ iniciarpartida.html SÍ tiene chat
                ],
                
                // 🎮 JUEGO DE GUERRA - Sin utilsJDG.js que NO existe + Chat (confirmado con viejo/static)
                'juegodeguerra': [
                    '/Client/js/common/networkConfig.js',
                    // ❌ NO utilsJDG.js - este archivo NO existe en el sistema
                    '/Client/js/common/MAIRAChat.js'        // ✅ juegodeguerra.html SÍ tiene chat
                ],
                
                // 🏢 INICIO GB - Básicos + Chat (confirmado con viejo/static)
                'inicioGB': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/MAIRAChat.js'        // ✅ inicioGB.html SÍ tiene chat
                ],
                
                // ⚔️ GESTIÓN BATALLA - Suite completa + Chat (confirmado con viejo/static)
                'gestionbatalla': [
                    '/Client/js/common/networkConfig.js',
                    '/Client/js/common/MAIRAChat.js',       // ✅ gestionbatalla.html SÍ tiene chat
                    '/Client/js/common/indexP.js',
                    '/Client/js/common/mapaP.js',
                    '/Client/js/common/simbolosP.js',
                    '/Client/js/common/herramientasP.js',
                    '/Client/js/common/dibujosMCCP.js',
                    '/Client/js/common/atajosP.js',
                    '/Client/js/common/CalculoMarcha.js',
                    '/Client/js/common/graficoMarcha.js',
                    '/Client/js/common/panelMarcha.js',
                    '/Client/js/common/miradial.js',
                    '/Client/js/utils/calcosP.js'
                    // ❌ NO incluir edicioncompleto.js (comentado en gestionbatalla.html)
                ],
                
                // 📋 PLANEAMIENTO - Suite completa SIN CHAT + CON edicioncompleto.js (confirmado con viejo/static)
                'planeamiento': [
                    '/Client/js/common/networkConfig.js',
                    // ❌ NO incluir MAIRAChat.js - planeamiento.html original NO tiene chat
                    '/Client/js/common/indexP.js',
                    '/Client/js/common/mapaP.js',
                    '/Client/js/common/simbolosP.js',
                    '/Client/js/common/herramientasP.js',
                    '/Client/js/common/dibujosMCCP.js',
                    '/Client/js/common/atajosP.js',
                    '/Client/js/common/CalculoMarcha.js',
                    '/Client/js/common/graficoMarcha.js',
                    '/Client/js/common/panelMarcha.js',
                    '/Client/js/common/edicioncompleto.js', // ✅ Solo en planeamiento
                    '/Client/js/utils/calcosP.js',
                    '/Client/js/common/migrationMap.js',
                    '/Client/js/common/toolsInitializer.js'
                ],
                
                // 🏗️ CO (COMANDOS Y ORGANIZACIÓN) - Solo básicos SIN CHAT (confirmado con viejo/static)
                'organizacion': [
                    '/Client/js/common/networkConfig.js',
                    // ❌ NO incluir MAIRAChat.js - CO.html original NO tiene chat
                    '/Client/js/common/miradial.js'         // ✅ PRIMERO - Base para menús radiales
                ]
            };
            
            const common = commonByModule[moduleName] || LOAD_ORDER.common;
            await this.loadFiles(common);
            console.log(`✅ Common cargado para ${moduleName}:`, common.length);
        }
        
        async loadHandlersForModule(moduleName) {
            const handlersByModule = {
                // 🏠 HOME - Solo dependency manager para librerías externas
                'home': [
                    '/Client/js/handlers/dependency-manager.js'  // ✅ CRÍTICO: Dependency manager para cargar Leaflet/etc
                ],
                
                // 📋 PLANEAMIENTO - Handlers completos según planeamiento.html
                'planeamiento': [
                    '/Client/js/handlers/dependency-manager.js', // ✅ CRÍTICO: Dependency manager primero
                    '/Client/js/handlers/elevationHandler.js',   // ✅ CRÍTICO: elevation.worker.js + elevationHandler.js
                    '/Client/js/handlers/vegetacionhandler.js',  // ✅ CRÍTICO: vegetacionhandler.js
                    '/Client/js/workers/elevation.worker.js',    // ✅ Workers de elevación
                    '/Client/js/utils/geometryUtils.js',
                    '/Client/js/handlers/mobileOptimizationHandler.js',
                    '/Client/js/handlers/mapInteractionHandler.js',
                    '/Client/js/services/elevationProfileService.js',
                    '/Client/js/handlers/measurementHandler.js'
                ],
                
                // ⚔️ GESTIÓN BATALLA - Mismos handlers críticos que planeamiento
                'gestionbatalla': [
                    '/Client/js/handlers/dependency-manager.js', // ✅ CRÍTICO: Dependency manager primero
                    '/Client/js/handlers/elevationHandler.js',   // ✅ CRÍTICO: igual que planeamiento
                    '/Client/js/handlers/vegetacionhandler.js',  // ✅ CRÍTICO: igual que planeamiento
                    '/Client/js/workers/elevation.worker.js',    // ✅ Workers de elevación
                    '/Client/js/utils/geometryUtils.js',
                    '/Client/js/handlers/mobileOptimizationHandler.js',
                    '/Client/js/handlers/mapInteractionHandler.js',
                    '/Client/js/services/elevationProfileService.js',
                    '/Client/js/handlers/measurementHandler.js'
                ],
                
                // 🎮 JUEGO DE GUERRA - Handlers básicos de terreno
                'juegodeguerra': [
                    '/Client/js/handlers/dependency-manager.js',
                    '/Client/js/handlers/elevationHandler.js',
                    '/Client/js/handlers/vegetacionhandler.js',
                    '/Client/js/workers/elevation.worker.js'
                ],
                
                // 🏗️ ORGANIZACIÓN - Solo dependency manager
                'organizacion': [
                    '/Client/js/handlers/dependency-manager.js' // ✅ CRÍTICO: Dependency manager primero
                ],
                
                // 🎯 PARTIDAS - Solo dependency manager para socket.io
                'partidas': [
                    '/Client/js/handlers/dependency-manager.js'
                ],
                
                // 🏢 INICIO GB - Solo dependency manager 
                'inicioGB': [
                    '/Client/js/handlers/dependency-manager.js'
                ]
            };
            
            const handlers = handlersByModule[moduleName] || ['/Client/js/handlers/dependency-manager.js'];
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
