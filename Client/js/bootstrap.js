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
            './core/UserIdentity.js',         // ✅ EXISTE: gestión de identidad
            './utils/sessionManager.js'       // ✅ EXISTE: gestión de sesión
            // Nota: core/index.js y config/index.js usan ES6 modules - se cargan por separado
        ],
        
        // 2. UTILIDADES BASE
        utils: [
            './utils/eventemitter.js'
        ],
        
        // 3. INFRAESTRUCTURA DDD
        infrastructure: [
            './infrastructure/terrainAdapter.js'
        ],
        
        // 4. SERVICIOS DDD BÁSICOS (Hexagonal Architecture) - Solo servicios de aplicación web
        services: [
            './services/servicesManager.js',
            './services/transitabilityService.js',    // ✅ GLOBAL: Planeamiento + Juego
            './services/slopeAnalysisService.js',     // ✅ GLOBAL: Análisis terreno
            './services/elevationProfileService.js',  // ✅ GLOBAL: Perfiles elevación
            './services/threeDMapService.js'          // ✅ GLOBAL: Mapas 3D básicos
            // ❌ MOVIDOS ESPECÍFICOS:
            // - combatSystem3DIntegrator.js → SOLO juegodeguerra (simulaciones)
            // ❌ MOVIDOS A TOOLS:
            // - autonomousAgentService.js → tools/development (herramienta DE desarrollo)
        ],
        
        // 5. MÓDULOS COMUNES (INCLUYE LAS FUNCIONES GLOBALES)
        common: [
            './common/networkConfig.js',  // ✅ MOVIDO AQUÍ - es común a todos
            './common/MAIRAChat.js',
            // './common/indexP.js',        // ❌ MOVIDO: Solo para planeamiento, no para landing
            './common/miradial.js',
            './common/panelMarcha.js',
            './common/mapaP.js',
            './common/simbolosP.js',     // ✅ actualizarSidc y agregarMarcador se cargan aquí
            './common/herramientasP.js',  // ✅ REFACTORIZADO: Ahora es stub de compatibilidad
            './common/toolsInitializer.js',  // ✅ NUEVO: Inicializador de herramientas refactorizadas
            './common/dibujosMCCP.js',
            './common/atajosP.js',
            './common/CalculoMarcha.js',
            './common/graficoMarcha.js',
            // ❌ MOVIDO: edicioncompleto.js solo para planeamiento
            './utils/calcosP.js',
            // ✅ AGREGADOS: Archivos que faltaban
            './common/unidades.js',          // ✅ Gestión de unidades
            './common/partidas.js'           // ✅ Gestión de partidas
        ],
        
        // 6. HANDLERS (TERRENO Y OPTIMIZACIÓN) + MÓDULOS REFACTORIZADOS
        handlers: [
            // Dependency Manager PRIMERO - necesario para cargar librerías externas
            './handlers/dependency-manager.js',    // ✅ NUEVO: Gestor de dependencias CDN/node_modules
            
            // Handlers originales de terreno
            './handlers/elevationHandler.js',      // ✅ CORREGIDO: está en handlers/
            './handlers/vegetacionhandler.js',     // ✅ CORREGIDO: está en handlers/
            './workers/elevation.worker.js',       // ✅ CORREGIDO: worker está en workers/
            './handlers/measurement-touch-optimizer.js',
            './ui/mobile-optimizer.js',
            
            // ✅ NUEVOS MÓDULOS REFACTORIZADOS (reemplazando herramientasP.js)
            './utils/geometryUtils.js',            // Utilidades geométricas primero
            './handlers/mobileOptimizationHandler.js',  // Optimización móvil
            './handlers/mapInteractionHandler.js', // Interacciones del mapa
            './services/elevationProfileService.js',   // Servicio de perfiles
            './handlers/measurementHandler.js',    // Medición de distancia (último - depende de otros)
            
            // ✅ GAMING Y DIRECTOR
            './handlers/DirectorManager.js',       // Sistema roles director/creador
            
            // ✅ AGREGADOS: Handlers que estaban faltando
            './handlers/performanceOptimizer.js',  // ✅ Optimización performance
            './handlers/EventBus.js',              // ✅ Bus de eventos
            './handlers/pendienteHandler.js',      // ✅ De herramientasP.js
            './handlers/transitabilidadHandler.js' // ✅ De herramientasP.js
        ],
        
        // 7. GESTORES BASE (para juego) - ⚠️ ORDEN CRÍTICO
        gestores: [
            './modules/juego/gestorBase.js',       // ✅ PRIMERO - Base de todos los gestores
            './modules/juego/gestorEventos.js',    // ✅ SEGUNDO - Sistema de eventos
            './modules/juego/gestorEstado.js',     // ✅ TERCERO - Gestión de estado
            './modules/juego/gestorComunicacion.js', // ✅ Comunicación
            './modules/juego/gestorCarga.js',      // ✅ Carga de datos
            './modules/juego/gestorMapa.js',       // ✅ Gestión del mapa
            './modules/juego/gestorInterfaz.js',   // ✅ Interfaz de usuario
            './modules/juego/gestorAcciones.js',   // ✅ Acciones del juego
            './modules/juego/gestorUnidades.js',   // ✅ Gestión de unidades
            './modules/juego/gestorFases.js',      // ✅ Fases del juego
            './handlers/gestorTurnos.js',          // ✅ Sistema de turnos (compartido)
            './modules/juego/gestorJuego.js'       // ✅ ÚLTIMO - Coordina todos
        ],
        
        // 8. MÓDULOS ESPECÍFICOS - Basado en análisis HTML real + funcionalidades 4.0
        modules: {
            // 🏠 INDEX/HOME - Scripts exactos del viejo/static/index.html
            home: [
                './utils/config.js',              // ✅ config.js según original
                './ui/landing3d.js',              // ✅ CORREGIDO: movido de handlers/ a ui/ en DDD
                './ui/carrusel.js',               // ✅ carrusel.js según original
                './utils/validacion.js'           // ✅ validacion.js según original
                // ❌ NO index.js - no existe en original
            ],
            
            // 📋 PLANEAMIENTO - Herramientas COMPLETAS + Tests + servicios básicos + script principal
            planeamiento: [
                './common/indexP.js',             // ✅ PRIMERO - Script principal de planeamiento
                './modules/planeamiento/planeamiento.js', // ✅ AGREGADO: Script base planeamiento
                './Test/autoTest.js',
                './Test/visualizadorTests.js',
                './Test/testPlaneamiento.js',
                './handlers/searchHandler.js',    // ✅ Búsqueda de lugares  
                './handlers/testHandler.js',      // ✅ Testing automatizado
                './workers/vegetation.worker.js'  // ✅ AGREGADO: Worker vegetación
                // ✅ Las herramientas refactorizadas se cargan automáticamente en handlers
                // ✅ toolsInitializer.js ya está en common y se auto-inicializa
                // ✅ USA: transitabilityService, slopeAnalysisService, elevationProfileService, threeDMapService
                // ❌ NO USA: combatSystem3DIntegrator (solo simulaciones), autonomousAgentService (tools)
            ],
            
            // 🏗️ CO/ORGANIZACIÓN - ESPECÍFICO: Sin herramientas de mapa, solo organización
            organizacion: [
                './ui/paneledicionCO.js',         // ✅ Panel edición
                './modules/organizacion/conexionesCO.js', // ✅ Conexiones
                './modules/organizacion/CO.js'    // ✅ Lógica principal
                // ❌ NO NECESITA: herramientas, medición, perfiles, etc.
                // ❌ NO NECESITA: servicios de combate o agentes autónomos
            ],
            
            // 🎯 INICIAR PARTIDA - Scripts exactos del viejo/static/iniciarpartida.html
            partidas: [
                './modules/partidas/iniciarpartida.js', // ✅ iniciarpartida.js según original
                './utils/config.js',              // ✅ AGREGADO: Config para producción
                './utils/validacion.js'           // ✅ AGREGADO: Validación usuarios DB
            ],
            
            // 🎮 JUEGO DE GUERRA - Solo gestores, combate y servicios específicos de simulación
            juegodeguerra: [
                './modules/juego/hexgrid.js',     // ✅ Grid hexagonal
                './modules/juego/combate.js',     // ✅ Sistema de combate
                // ✅ Los gestores se cargan automáticamente en la categoría 'gestores'
                './gaming/GameEngine.js',         // ✅ Motor de juego avanzado
                './gaming/AIDirector.js',         // ✅ Director de IA
                './services/combatSystem3DIntegrator.js',  // ✅ ESPECÍFICO: Integración 3D combate SOLO SIMULACIONES
                './gaming/FogOfWar.js'            // ✅ AGREGADO: Niebla de guerra
            ],
            
            // 🏢 INICIO GB - Con chat
            inicioGB: [
                './modules/gestion/inicioGBhandler.js'
            ],
            
            // ⚔️ GESTIÓN BATALLA - Seguimiento de operaciones en tiempo real (NO simulaciones)
            gestionbatalla: [
                './utils/utilsGB.js',             // ✅ Específico GB según análisis
                './modules/gestion/edicionGB.js',
                './modules/gestion/informesGB.js',
                './modules/gestion/elementosGB.js',
                './modules/gestion/gestionBatalla.js',
                './gaming/AIDirector.js'          // ✅ Director de IA para seguimiento
            ]
        },
        
        // 9. GAMING ENGINE (opcional)
        gaming: [
            './gaming/GameEngine.js',
            './gaming/AIDirector.js'
        ],
        
        // 10. TESTING (si está habilitado)
        testing: [
            './Test/MAIRATestSuite.js',
            './Test/testButtons.js',
            './Test/testPlaneamiento.js',
            './Test/autoTest.js',
            './Test/visualizadorTests.js'
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
                // 0. DEPENDENCY MANAGER PRIMERO (crítico para Socket.IO y otras librerías)
                console.log('📦 Cargando Dependency Manager...');
                await this.loadFile('./handlers/dependency-manager.js');
                console.log('✅ Dependency Manager cargado');
                
                // 🔗 VERIFICAR QUE SE EXPUSO GLOBALMENTE
                if (typeof window.dependencyManager === 'undefined') {
                    console.warn('⚠️ Dependency Manager no disponible globalmente, reintentando...');
                    // Pequeña pausa para permitir que el script se ejecute completamente
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (typeof window.dependencyManager === 'undefined') {
                        console.error('❌ Dependency Manager falló al exponerse globalmente');
                    } else {
                        console.log('✅ Dependency Manager ahora disponible globalmente');
                    }
                }
                
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
                
                // 6.5. UI (para módulos que requieren interfaz específica)
                if (['home', 'index'].includes(moduleName)) {
                    await this.loadCategory('ui', LOAD_ORDER.ui);
                    console.log(`✅ UI cargada para ${moduleName}`);
                }
                
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
                    './services/servicesManager.js',
                    './services/transitabilityService.js', 
                    './services/slopeAnalysisService.js',
                    './services/elevationProfileService.js'
                ],
                'gestionBatalla': [
                    './services/servicesManager.js',
                    './services/combatSystem3DIntegrator.js',
                    './services/elevationProfileService.js'
                ],
                'juego': LOAD_ORDER.services, // Juego necesita todos
                'organizacion': [
                    './services/servicesManager.js'
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
                    './common/networkConfig.js'
                    // ❌ NO MAIRAChat.js - index.html original NO tiene chat
                ],
                
                // 🎯 INICIAR PARTIDA - Básicos + Chat (confirmado con viejo/static)
                'partidas': [
                    './common/networkConfig.js',
                    './common/MAIRAChat.js'        // ✅ iniciarpartida.html SÍ tiene chat
                ],
                
                // 🎮 JUEGO DE GUERRA - Sin utilsJDG.js que NO existe + Chat (confirmado con viejo/static)
                'juegodeguerra': [
                    './common/networkConfig.js',
                    // ❌ NO utilsJDG.js - este archivo NO existe en el sistema
                    './common/MAIRAChat.js',       // ✅ juegodeguerra.html SÍ tiene chat
                    './utils/calcosP.js'           // ✅ AGREGADO: Gestión de calcos necesaria para mapas
                ],
                
                // 🏢 INICIO GB - Básicos + Chat (confirmado con viejo/static)
                'inicioGB': [
                    './common/networkConfig.js',
                    './common/MAIRAChat.js'        // ✅ inicioGB.html SÍ tiene chat
                ],
                
                // ⚔️ GESTIÓN BATALLA - Suite completa + Chat (confirmado con viejo/static)
                'gestionbatalla': [
                    './common/networkConfig.js',
                    './common/MAIRAChat.js',       // ✅ gestionbatalla.html SÍ tiene chat
                    './common/indexP.js',
                    './common/mapaP.js',
                    './common/simbolosP.js',
                    './common/herramientasP.js',
                    './common/dibujosMCCP.js',
                    './common/atajosP.js',
                    './common/CalculoMarcha.js',
                    './common/graficoMarcha.js',
                    './common/panelMarcha.js',
                    './common/miradial.js',
                    './utils/calcosP.js'
                    // ❌ NO incluir edicioncompleto.js (comentado en gestionbatalla.html)
                ],
                
                // 📋 PLANEAMIENTO - Suite completa SIN CHAT + CON edicioncompleto.js (confirmado con viejo/static)
                'planeamiento': [
                    './common/networkConfig.js',
                    // ❌ NO incluir MAIRAChat.js - planeamiento.html original NO tiene chat
                    './common/indexP.js',
                    './common/mapaP.js',
                    './common/simbolosP.js',
                    './common/herramientasP.js',
                    './common/dibujosMCCP.js',
                    './common/atajosP.js',
                    './common/CalculoMarcha.js',
                    './common/graficoMarcha.js',
                    './common/panelMarcha.js',
                    './common/edicioncompleto.js', // ✅ Solo en planeamiento
                    './utils/calcosP.js',
                    './common/toolsInitializer.js'
                ],
                
                // 🏗️ CO (COMANDOS Y ORGANIZACIÓN) - Solo básicos SIN CHAT (confirmado con viejo/static)
                'organizacion': [
                    './common/networkConfig.js',
                    // ❌ NO incluir MAIRAChat.js - CO.html original NO tiene chat
                    './common/miradial.js'         // ✅ PRIMERO - Base para menús radiales
                ]
            };
            
            const common = commonByModule[moduleName] || LOAD_ORDER.common;
            await this.loadFiles(common);
            console.log(`✅ Common cargado para ${moduleName}:`, common.length);
        }
        
        async loadHandlersForModule(moduleName) {
            const handlersByModule = {
                // 🏠 HOME - Handlers adicionales (dependency manager ya cargado)
                'home': [
                    // dependency-manager.js YA CARGADO en loadForModule
                ],
                
                // 📋 PLANEAMIENTO - Handlers completos según planeamiento.html
                'planeamiento': [
                    // dependency-manager.js YA CARGADO en loadForModule
                    './handlers/elevationHandler.js',   // ✅ CRÍTICO: elevation.worker.js + elevationHandler.js
                    './handlers/vegetacionhandler.js',  // ✅ CRÍTICO: vegetacionhandler.js
                    './workers/elevation.worker.js',    // ✅ Workers de elevación
                    './utils/geometryUtils.js',
                    './handlers/mobileOptimizationHandler.js',
                    './handlers/mapInteractionHandler.js',
                    './services/elevationProfileService.js',
                    './handlers/measurementHandler.js',
                    './handlers/searchHandler.js',     // ✅ NUEVO: Búsqueda de lugares (initializeBuscarLugar)
                    './handlers/testHandler.js'        // ✅ NUEVO: Testing (ejecutarTestPlaneamiento)
                ],
                
                // ⚔️ GESTIÓN BATALLA - Mismos handlers críticos que planeamiento
                'gestionbatalla': [
                    // dependency-manager.js YA CARGADO en loadForModule
                    './handlers/elevationHandler.js',   // ✅ CRÍTICO: igual que planeamiento
                    './handlers/vegetacionhandler.js',  // ✅ CRÍTICO: igual que planeamiento
                    './workers/elevation.worker.js',    // ✅ Workers de elevación
                    './workers/vegetation.worker.js',   // ✅ AGREGADO: Worker vegetación
                    './utils/geometryUtils.js',
                    './handlers/mobileOptimizationHandler.js',
                    './handlers/mapInteractionHandler.js',
                    './services/elevationProfileService.js',
                    './handlers/measurementHandler.js'
                ],
                
                // 🎮 JUEGO DE GUERRA - Handlers básicos de terreno
                'juegodeguerra': [
                    // dependency-manager.js YA CARGADO en loadForModule
                    './handlers/elevationHandler.js',
                    './handlers/vegetacionhandler.js',
                    './workers/elevation.worker.js',
                    './workers/vegetation.worker.js'    // ✅ AGREGADO: Worker vegetación
                ],
                
                // 🏗️ ORGANIZACIÓN - Solo dependency manager
                'organizacion': [
                    // dependency-manager.js YA CARGADO en loadForModule
                ],
                
                // 🎯 PARTIDAS - Solo dependency manager para socket.io
                'partidas': [
                    // dependency-manager.js YA CARGADO en loadForModule
                ],
                
                // 🏢 INICIO GB - Solo dependency manager 
                'inicioGB': [
                    // dependency-manager.js YA CARGADO en loadForModule
                ]
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
    
    // 🎯 DISPARAR EVENTO PERSONALIZADO CUANDO BOOTSTRAP ESTÁ LISTO
    const bootstrapReadyEvent = new CustomEvent('MAIRABootstrapReady', {
        detail: { 
            bootstrap: window.MAIRABootstrap,
            timestamp: Date.now()
        }
    });
    document.dispatchEvent(bootstrapReadyEvent);
    console.log('📡 Evento MAIRABootstrapReady disparado');

})();
