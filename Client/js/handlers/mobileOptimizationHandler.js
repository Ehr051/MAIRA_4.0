/**
 * @fileoverview Manejador de optimización móvil
 * @version 1.0.0
 * @description Módulo especializado para optimización en dispositivos móviles
 * Extraído de herramientasP.js como parte de la refactorización modular
 */

class MobileOptimizationHandler {
    constructor() {
        this.esDispositivoMovil = false;
        this.orientacion = 'portrait';
        this.touchIniciado = false;
        this.ultimoToque = null;
        this.gestorToques = null;
        
        this.detectarDispositivo();
        this.inicializarOptimizaciones();
        
        console.log('✅ MobileOptimizationHandler inicializado');
    }

    /**
     * Detecta si es un dispositivo móvil
     */
    detectarDispositivo() {
        // Detectar por user agent
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        
        this.esDispositivoMovil = mobileRegex.test(userAgent.toLowerCase());
        
        // Detectar por características de pantalla
        if (!this.esDispositivoMovil) {
            this.esDispositivoMovil = window.innerWidth <= 768 || 
                                    'ontouchstart' in window || 
                                    navigator.maxTouchPoints > 0;
        }
        
        // Detectar orientación
        this.orientacion = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        console.log(`📱 Dispositivo móvil detectado: ${this.esDispositivoMovil}`);
        console.log(`📐 Orientación: ${this.orientacion}`);
        
        return this.esDispositivoMovil;
    }

    /**
     * Inicializa optimizaciones móviles
     */
    inicializarOptimizaciones() {
        if (!this.esDispositivoMovil) {
            console.log('💻 Dispositivo de escritorio, optimizaciones móviles deshabilitadas');
            return;
        }
        
        console.log('📱 Aplicando optimizaciones móviles...');
        
        // Optimizaciones de interfaz
        this.optimizarInterfaz();
        
        // Gestión de eventos táctiles
        this.configurarEventosTactiles();
        
        // Optimizaciones de rendimiento
        this.aplicarOptimizacionesRendimiento();
        
        // Listener para cambios de orientación
        this.configurarCambioOrientacion();
        
        console.log('✅ Optimizaciones móviles aplicadas');
    }

    /**
     * Optimiza la interfaz para móvil
     */
    optimizarInterfaz() {
        // Agregar meta viewport si no existe
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
        
        // Agregar estilos móviles dinámicos
        this.agregarEstilosMoviles();
        
        // Optimizar controles del mapa
        this.optimizarControlesMapa();
        
        // Ajustar tamaños de botones
        this.ajustarTamañoBotones();
    }

    /**
     * Agrega estilos específicos para móvil
     */
    agregarEstilosMoviles() {
        let estiloMovil = document.getElementById('mobile-optimization-styles');
        
        if (!estiloMovil) {
            estiloMovil = document.createElement('style');
            estiloMovil.id = 'mobile-optimization-styles';
            document.head.appendChild(estiloMovil);
        }
        
        estiloMovil.textContent = `
            /* Optimizaciones móviles dinámicas */
            @media (max-width: 768px) {
                /* Hacer botones más grandes para touch */
                .ol-control button {
                    width: 44px !important;
                    height: 44px !important;
                    font-size: 18px !important;
                }
                
                /* Optimizar paneles laterales */
                .sidebar, .panel {
                    width: 100% !important;
                    height: auto !important;
                    max-height: 50vh !important;
                    overflow-y: auto !important;
                }
                
                /* Mejorar tooltips y popups */
                .tooltip, .popup {
                    font-size: 16px !important;
                    padding: 12px !important;
                    max-width: 90vw !important;
                }
                
                /* Optimizar menús */
                .menu-item {
                    min-height: 44px !important;
                    padding: 12px !important;
                    font-size: 16px !important;
                }
                
                /* Prevenir zoom accidental */
                input, select, textarea {
                    font-size: 16px !important;
                }
                
                /* Optimizar medición de distancia */
                #distancia-medicion {
                    font-size: 16px !important;
                    padding: 15px !important;
                    right: 10px !important;
                    top: 10px !important;
                }
                
                /* Optimizar perfil de elevación */
                #perfil-elevacion-container {
                    left: 5px !important;
                    right: 5px !important;
                    bottom: 5px !important;
                    max-width: calc(100vw - 10px) !important;
                    max-height: 60vh !important;
                }
            }
            
            /* Orientación landscape */
            @media (max-width: 768px) and (orientation: landscape) {
                #perfil-elevacion-container {
                    max-height: 40vh !important;
                }
                
                .sidebar {
                    max-height: 30vh !important;
                }
            }
        `;
    }

    /**
     * Optimiza controles del mapa para móvil
     */
    optimizarControlesMapa() {
        if (!window.map) return;
        
        // Ajustar zoom por defecto para móvil
        const view = window.map.getView();
        if (view) {
            const currentZoom = view.getZoom();
            if (currentZoom > 15) {
                view.setZoom(Math.min(currentZoom, 15));
            }
        }
        
        // Configurar interacciones optimizadas para touch
        const interactions = window.map.getInteractions();
        interactions.forEach(interaction => {
            if (interaction instanceof ol.interaction.PinchZoom) {
                interaction.set('duration', 200);
            }
        });
    }

    /**
     * Ajusta el tamaño de botones para touch
     */
    ajustarTamañoBotones() {
        const botones = document.querySelectorAll('button, .btn, .control-button');
        
        botones.forEach(boton => {
            const estilos = window.getComputedStyle(boton);
            const ancho = parseInt(estilos.width);
            const alto = parseInt(estilos.height);
            
            // Asegurar tamaño mínimo de 44px (recomendación Apple/Google)
            if (ancho < 44) {
                boton.style.minWidth = '44px';
            }
            if (alto < 44) {
                boton.style.minHeight = '44px';
            }
        });
    }

    /**
     * Configura eventos táctiles específicos
     */
    configurarEventosTactiles() {
        // Prevenir zoom doble tap en el mapa
        if (window.map && window.map.getViewport()) {
            const viewport = window.map.getViewport();
            
            let ultimoTap = 0;
            viewport.addEventListener('touchend', (e) => {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - ultimoTap;
                
                if (tapLength < 500 && tapLength > 0) {
                    // Doble tap detectado - prevenir zoom
                    e.preventDefault();
                }
                ultimoTap = currentTime;
            });
        }
        
        // Gestor de toques para medición
        this.configurarToquesPersonalizados();
        
        // Prevenir scroll elástico
        this.prevenirScrollElastico();
    }

    /**
     * Configura toques personalizados para herramientas
     */
    configurarToquesPersonalizados() {
        document.addEventListener('touchstart', (e) => {
            this.touchIniciado = true;
            this.ultimoToque = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                tiempo: Date.now()
            };
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (this.touchIniciado && this.ultimoToque) {
                const duracion = Date.now() - this.ultimoToque.tiempo;
                
                // Toque largo (más de 800ms)
                if (duracion > 800) {
                    this.manejarToqueLargo(e);
                }
            }
            
            this.touchIniciado = false;
            this.ultimoToque = null;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (this.touchIniciado && this.ultimoToque) {
                const deltaX = Math.abs(e.touches[0].clientX - this.ultimoToque.x);
                const deltaY = Math.abs(e.touches[0].clientY - this.ultimoToque.y);
                
                // Si hay movimiento significativo, no es un toque estacionario
                if (deltaX > 10 || deltaY > 10) {
                    this.touchIniciado = false;
                }
            }
        }, { passive: true });
    }

    /**
     * Maneja toques largos
     */
    manejarToqueLargo(evento) {
        // Vibración si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Mostrar menú contextual o información
        console.log('🔗 Toque largo detectado');
        
        // Aquí se puede agregar funcionalidad específica
        // como mostrar información del elemento en esa ubicación
    }

    /**
     * Previene el scroll elástico en iOS
     */
    prevenirScrollElastico() {
        document.body.addEventListener('touchmove', (e) => {
            // Prevenir scroll solo si no es un elemento scrolleable
            const target = e.target;
            const esScrolleable = target.scrollHeight > target.clientHeight;
            
            if (!esScrolleable) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Configura listener para cambios de orientación
     */
    configurarCambioOrientacion() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.manejarCambioOrientacion();
            }, 100); // Delay para que se complete el cambio
        });
        
        window.addEventListener('resize', () => {
            this.manejarCambioOrientacion();
        });
    }

    /**
     * Maneja cambios de orientación
     */
    manejarCambioOrientacion() {
        const nuevaOrientacion = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        
        if (nuevaOrientacion !== this.orientacion) {
            console.log(`📐 Cambio de orientación: ${this.orientacion} → ${nuevaOrientacion}`);
            this.orientacion = nuevaOrientacion;
            
            // Reajustar mapa
            if (window.map) {
                setTimeout(() => {
                    window.map.updateSize();
                }, 200);
            }
            
            // Reajustar paneles
            this.reajustarPaneles();
            
            // Actualizar estilos
            this.actualizarEstilosOrientacion();
        }
    }

    /**
     * Reajusta paneles después de cambio de orientación
     */
    reajustarPaneles() {
        const perfil = document.getElementById('perfil-elevacion-container');
        if (perfil) {
            if (this.orientacion === 'landscape') {
                perfil.style.maxHeight = '40vh';
            } else {
                perfil.style.maxHeight = '60vh';
            }
        }
        
        const distancia = document.getElementById('distancia-medicion');
        if (distancia) {
            if (this.orientacion === 'landscape') {
                distancia.style.top = '10px';
            } else {
                distancia.style.top = '70px';
            }
        }
    }

    /**
     * Actualiza estilos según orientación
     */
    actualizarEstilosOrientacion() {
        document.body.className = document.body.className.replace(/orientation-\w+/g, '');
        document.body.classList.add(`orientation-${this.orientacion}`);
    }

    /**
     * Aplica optimizaciones de rendimiento
     */
    aplicarOptimizacionesRendimiento() {
        // Reducir calidad de renderizado en móviles
        if (window.map) {
            const layers = window.map.getLayers();
            layers.forEach(layer => {
                if (layer.setRenderOrder) {
                    layer.setRenderOrder(null); // Desactivar ordenamiento complejo
                }
            });
        }
        
        // Throttle de eventos de resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.map) {
                    window.map.updateSize();
                }
            }, 250);
        });
        
        // Optimizar scroll en elementos largos
        this.optimizarScrolling();
    }

    /**
     * Optimiza scrolling para rendimiento
     */
    optimizarScrolling() {
        const elementosScroll = document.querySelectorAll('.scrollable, .list, .menu');
        
        elementosScroll.forEach(elemento => {
            elemento.style.webkitOverflowScrolling = 'touch';
            elemento.style.overflowScrolling = 'touch';
        });
    }

    /**
     * Obtiene información del dispositivo
     */
    obtenerInfoDispositivo() {
        return {
            esMovil: this.esDispositivoMovil,
            orientacion: this.orientacion,
            ancho: window.innerWidth,
            alto: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            soportaTouch: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    }

    /**
     * Verifica si es un dispositivo móvil
     */
    static detectarDispositivoMovil() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
               window.innerWidth <= 768 ||
               'ontouchstart' in window ||
               navigator.maxTouchPoints > 0;
    }
}

// Crear instancia global
window.mobileOptimizationHandler = new MobileOptimizationHandler();

// Exportar función estática para compatibilidad
window.detectarDispositivoMovil = () => MobileOptimizationHandler.detectarDispositivoMovil();

console.log('✅ MobileOptimizationHandler cargado y función exportada al scope global');
