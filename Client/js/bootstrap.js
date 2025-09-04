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
        
        // 3. MÓDULOS COMUNES
        common: [
            '/Client/js/common/MAIRAChat.js',
            '/Client/js/common/indexP.js',
            '/Client/js/common/miradial.js',
            '/Client/js/common/panelMarcha.js'
        ],
        
        // 4. HANDLERS
        handlers: [
            '/Client/js/handlers/elevationHandler.js',
            '/Client/js/common/elevationHandler.js',
            '/Client/js/handlers/vegetacionhandler.js'
        ],
        
        // 5. GESTORES (para juego)
        gestores: [
            '/Client/js/modules/juego/gestorBase.js',
            '/Client/js/modules/juego/gestorComunicacion.js',
            '/Client/js/modules/juego/gestorEventos.js',
            '/Client/js/modules/juego/gestorCarga.js',
            '/Client/js/modules/juego/gestorEstado.js',
            '/Client/js/modules/juego/gestorInterfaz.js',
            '/Client/js/modules/juego/gestorFases.js',
            '/Client/js/modules/juego/gestorJuego.js'
        ],
        
        // 6. MÓDULOS ESPECÍFICOS
        modules: {
            juego: [
                '/Client/js/modules/juego/hexgrid.js',
                '/Client/js/modules/juego/combate.js',
                '/Client/js/modules/juego/gestionBatalla.js'
            ],
            organizacion: [
                '/Client/js/modules/organizacion/CO.js',
                '/Client/js/modules/organizacion/conexionesCO.js'
            ],
            planeamiento: [
                '/Client/js/modules/planeamiento/calcosP.js',
                '/Client/js/modules/planeamiento/simbolosP.js',
                '/Client/js/modules/planeamiento/herramientasP.js',
                '/Client/js/modules/planeamiento/atajosP.js',
                '/Client/js/modules/planeamiento/mapaP.js',
                '/Client/js/modules/planeamiento/graficoMarcha.js'
            ],
            partidas: [
                '/Client/js/modules/partidas/iniciarpartida.js'
            ]
        },
        
        // 7. GAMING ENGINE (opcional)
        gaming: [
            '/Client/js/gaming/GameEngine.js',
            '/Client/js/gaming/AIDirector.js'
        ],
        
        // 8. TESTING (si está habilitado)
        testing: [
            '/Client/js/Test/MAIRATestSuite.js',
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
            console.log(`🚀 MAIRA Bootstrap - Cargando para módulo: ${moduleName}`);
            this.currentModule = moduleName;

            try {
                // 1. Cargar core siempre
                await this.loadSequential(LOAD_ORDER.core);
                await this.loadSequential(LOAD_ORDER.utils);
                await this.loadSequential(LOAD_ORDER.common);

                // 2. Cargar handlers básicos
                await this.loadSequential(LOAD_ORDER.handlers);

                // 3. Cargar según módulo específico
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

                // 4. Cargar módulos adicionales si se especifican
                for (const additionalModule of additionalModules) {
                    if (LOAD_ORDER.modules[additionalModule]) {
                        await this.loadSequential(LOAD_ORDER.modules[additionalModule]);
                    }
                }

                // 5. Cargar testing si está habilitado
                if (this.enableTesting) {
                    await this.loadSequential(LOAD_ORDER.testing);
                }

                console.log(`✅ MAIRA Bootstrap - ${moduleName} cargado completamente`);
                this.notifyLoadComplete(moduleName);

            } catch (error) {
                console.error(`❌ Error en bootstrap para ${moduleName}:`, error);
                throw error;
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

    console.log('🚀 MAIRA Bootstrap - Sistema de carga unificado inicializado');

})();
