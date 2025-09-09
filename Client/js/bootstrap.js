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
         * 🎯 CARGA ESPECÍFICA POR MÓDULO - UNIFICADA CON loadForSpecificModule
         */
        async loadForModule(moduleName) {
            console.log(`🎯 Carga UNIFICADA para módulo: ${moduleName}`);
            
            try {
                // Usar la función unificada de carga selectiva
                const filesToLoad = window.MAIRABootstrap.loadForSpecificModule(moduleName);
                
                console.log(`📦 Archivos a cargar para ${moduleName}:`, filesToLoad.length);
                
                // Cargar todos los archivos en orden
                await this.loadFiles(filesToLoad);
                
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
    
    // 🎯 FUNCIÓN DE CARGA SELECTIVA REAL - CARGA COMPLETA SEGÚN PÁGINA
    window.MAIRABootstrap.loadForSpecificModule = function(pageName) {
        console.log(`🎯 Carga selectiva COMPLETA para: ${pageName}`);
        
        // 📋 CONFIGURACIÓN DE CSS POR PÁGINA
        const pageCSS = {
            'planeamiento': [
                'Client/css/planeamiento.css',
                'Client/css/hexgrid.css',
                'Client/css/responsive-fixes.css'
            ],
            'CO': [
                'Client/css/CO.css',
                'Client/css/responsive-fixes.css'
            ],
            'juegodeguerra': [
                'Client/css/juegodeguerra.css',
                'Client/css/hexgrid.css',
                'Client/css/GBatalla.css',
                'Client/css/responsive-fixes.css'
            ],
            'inicioGB': [
                'Client/css/inicioGB.css',
                'Client/css/responsive-fixes.css'
            ],
            'gestionbatalla': [
                'Client/css/GBatalla.css',
                'Client/css/responsive-fixes.css'
            ],
            'index': [
                'Client/css/style.css',
                'Client/css/carrusel.css',
                'Client/css/responsive-fixes.css'
            ]
        };

        // 📋 DEPENDENCIAS EXTERNAS SEGÚN PÁGINA
        const pageDependencies = {
            'planeamiento': ['jquery', 'leaflet', 'proj4', 'bootstrap'],
            'CO': ['jquery', 'leaflet', 'proj4'],
            'juegodeguerra': ['jquery', 'leaflet', 'proj4', 'threejs'],
            'inicioGB': ['jquery', 'bootstrap'],
            'gestionbatalla': ['jquery', 'leaflet', 'proj4'],
            'index': ['jquery', 'bootstrap']
        };

        // 1️⃣ CARGAR CSS ESPECÍFICO DE LA PÁGINA
        const cssFiles = pageCSS[pageName] || pageCSS['index'];
        cssFiles.forEach(cssFile => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssFile;
            document.head.appendChild(link);
            console.log(`🎨 CSS cargado: ${cssFile}`);
        });

        // 2️⃣ CARGAR DEPENDENCIAS EXTERNAS
        const dependencies = pageDependencies[pageName] || [];
        dependencies.forEach(dep => {
            if (dep === 'jquery' && !window.$) {
                this.loadJQuery();
            } else if (dep === 'leaflet' && !window.L) {
                this.loadLeaflet();
            } else if (dep === 'proj4' && !window.proj4) {
                this.loadProj4();
            }
        });

        // 3️⃣ CONSTRUIR LISTA DE ARCHIVOS JS SEGÚN PÁGINA
        const filesByCategory = [];
        
        // SIEMPRE cargar archivos base
        filesByCategory.push(...LOAD_ORDER.core);
        filesByCategory.push(...LOAD_ORDER.utils);
        filesByCategory.push(...LOAD_ORDER.infrastructure);
        filesByCategory.push(...LOAD_ORDER.services);
        
        // Cargar archivos common (sin MAIRAChat para ciertas páginas)
        const commonFiles = [...LOAD_ORDER.common];
        if (pageName === 'planeamiento') {
            // Remover chat para planeamiento
            const chatIndex = commonFiles.indexOf('./common/MAIRAChat.js');
            if (chatIndex > -1) commonFiles.splice(chatIndex, 1);
        }
        filesByCategory.push(...commonFiles);
        
        // Cargar handlers
        filesByCategory.push(...LOAD_ORDER.handlers);
        
        // Cargar gestores solo para módulos de juego
        if (['juegodeguerra', 'gestionbatalla'].includes(pageName)) {
            filesByCategory.push(...LOAD_ORDER.gestores);
        }
        
        // Cargar módulos específicos de la página
        if (LOAD_ORDER.modules[pageName]) {
            filesByCategory.push(...LOAD_ORDER.modules[pageName]);
        }

        // 4️⃣ CARGAR GAMING ENGINE si es necesario
        if (['juegodeguerra', 'gestionbatalla'].includes(pageName)) {
            filesByCategory.push(...LOAD_ORDER.gaming);
        }

        console.log(`📦 Cargando ${filesByCategory.length} archivos para ${pageName}:`, filesByCategory);
        return filesByCategory;
    };

    // 🎯 FUNCIONES DE CARGA DE DEPENDENCIAS
    window.MAIRABootstrap.loadJQuery = function() {
        if (!window.$) {
            const script = document.createElement('script');
            script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            script.onload = () => console.log('✅ jQuery cargado');
            document.head.appendChild(script);
        }
    };

    window.MAIRABootstrap.loadLeaflet = function() {
        if (!window.L) {
            // CSS primero
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            
            // JS después
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => console.log('✅ Leaflet cargado');
            document.head.appendChild(script);
        }
    };

    window.MAIRABootstrap.loadProj4 = function() {
        if (!window.proj4) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/proj4@2.9.0/dist/proj4.js';
            script.onload = () => console.log('✅ Proj4 cargado');
            document.head.appendChild(script);
        }
    };

    // 🎯 CARGA SELECTIVA INTELIGENTE
    window.MAIRABootstrap.loadSelectiveModules = function() {
        const pathname = window.location.pathname;
        const page = pathname.includes('planeamiento') ? 'planeamiento' :
                    pathname.includes('CO') ? 'CO' :
                    pathname.includes('juegodeguerra') ? 'juegodeguerra' :
                    pathname.includes('inicioGB') ? 'inicioGB' :
                    pathname.includes('gestionbatalla') ? 'gestionbatalla' : 'index';
        
        console.log(`🔍 Página detectada: ${page} (URL: ${pathname})`);
        return this.loadForSpecificModule(page);
    };

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
