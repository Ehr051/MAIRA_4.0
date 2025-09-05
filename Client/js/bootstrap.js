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
            '/Client/js/core/UserIdentity.js'  // ✅ CORREGIDO: está en core/, no common/
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
            '/Client/js/common/MAIRAChat.js',
            '/Client/js/common/indexP.js',        // ✅ toggleMenu se carga aquí
            '/Client/js/common/miradial.js',
            '/Client/js/common/panelMarcha.js',
            '/Client/js/common/mapaP.js',
            '/Client/js/common/simbolosP.js',     // ✅ actualizarSidc y agregarMarcador se cargan aquí
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
                
                // 4. SERVICIOS
                await this.loadCategory('services', LOAD_ORDER.services);
                
                // 5. COMÚN (contiene las funciones globales)
                await this.loadCategory('common', LOAD_ORDER.common);
                
                // 6. HANDLERS
                await this.loadCategory('handlers', LOAD_ORDER.handlers);
                
                // 7. GESTORES (para juegos)
                if (['juego', 'partidas', 'gestionBatalla'].includes(moduleName)) {
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
