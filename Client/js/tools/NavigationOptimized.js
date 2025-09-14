/**
 * NAVIGATION OPTIMIZED - MAIRA 4.0
 * Sistema de navegación optimizada para mapas interactivos
 */

class NavigationOptimized {
    constructor(mapa) {
        this.mapa = mapa;
        this.optimizaciones = {
            panSmoothing: true,
            zoomOptimization: true,
            gestureHandling: true,
            performanceMonitoring: true
        };

        this.inicializar();
        console.log('🧭 Navigation Optimized inicializado');
    }

    inicializar() {
        this.configurarPanSmoothing();
        this.configurarZoomOptimization();
        this.configurarGestureHandling();
        this.configurarPerformanceMonitoring();
    }

    configurarPanSmoothing() {
        if (!this.optimizaciones.panSmoothing) return;

        // Suavizar el paneo del mapa
        this.mapa.on('move', () => {
            // Optimizaciones de paneo
            if (window.performanceOptimizer) {
                window.performanceOptimizer.optimizarRenderizado();
            }
        });
    }

    configurarZoomOptimization() {
        if (!this.optimizaciones.zoomOptimization) return;

        // Optimizar cambios de zoom
        this.mapa.on('zoomstart', () => {
            // Preparar para cambio de zoom
            this.zoomStartTime = Date.now();
        });

        this.mapa.on('zoomend', () => {
            const zoomTime = Date.now() - this.zoomStartTime;
            console.log(`🔍 Zoom completado en ${zoomTime}ms`);

            // Limpiar caché si es necesario
            if (window.performanceOptimizer) {
                window.performanceOptimizer.limpiarCacheInnecesario();
            }
        });
    }

    configurarGestureHandling() {
        if (!this.optimizaciones.gestureHandling) return;

        // Manejar gestos táctiles
        this.mapa.on('touchstart', (e) => {
            this.touchStartTime = Date.now();
            this.touchStartPoint = e.latlng;
        });

        this.mapa.on('touchend', (e) => {
            const touchTime = Date.now() - this.touchStartTime;
            const distance = this.mapa.distance(this.touchStartPoint, e.latlng);

            if (touchTime < 300 && distance < 10) {
                // Tap rápido - seleccionar elemento
                this.handleTap(e.latlng);
            }
        });
    }

    configurarPerformanceMonitoring() {
        if (!this.optimizaciones.performanceMonitoring) return;

        // Monitorear rendimiento de navegación
        setInterval(() => {
            this.monitorPerformance();
        }, 5000);
    }

    handleTap(latlng) {
        // Manejar taps en el mapa
        console.log('👆 Tap detectado en:', latlng);

        // Buscar elementos cercanos
        if (window.sistemaZoomMultiNivel) {
            const elementosCercanos = this.buscarElementosCercanos(latlng);
            if (elementosCercanos.length > 0) {
                // Seleccionar el elemento más cercano
                this.seleccionarElemento(elementosCercanos[0]);
            }
        }
    }

    buscarElementosCercanos(latlng) {
        // Buscar elementos dentro de un radio
        const radio = 100; // metros
        const elementos = [];

        if (window.sistemaZoomMultiNivel && window.sistemaZoomMultiNivel.elementos) {
            window.sistemaZoomMultiNivel.elementos.forEach((elemento, id) => {
                if (elemento.posicion) {
                    const distancia = this.mapa.distance(latlng, elemento.posicion);
                    if (distancia <= radio) {
                        elementos.push({ elemento, distancia });
                    }
                }
            });
        }

        // Ordenar por distancia
        return elementos.sort((a, b) => a.distancia - b.distancia);
    }

    seleccionarElemento(elementoInfo) {
        const elemento = elementoInfo.elemento;

        // Mostrar información del elemento
        if (window.panelUnificado) {
            window.panelUnificado.seleccionarElemento(elemento);
        }

        console.log('🎯 Elemento seleccionado:', elemento.nombre || elemento.tipo);
    }

    monitorPerformance() {
        if (window.performanceOptimizer) {
            const metrics = window.performanceOptimizer.obtenerMetricas();

            // Log de rendimiento de navegación
            if (metrics.fps < 30) {
                console.warn('⚠️ FPS bajo detectado:', metrics.fps);
            }
        }
    }

    // API pública
    optimizarNavegacion() {
        // Forzar optimizaciones
        if (window.performanceOptimizer) {
            window.performanceOptimizer.optimizarTodo();
        }
    }

    desactivarOptimizaciones() {
        this.optimizaciones.panSmoothing = false;
        this.optimizaciones.zoomOptimization = false;
        this.optimizaciones.gestureHandling = false;
        this.optimizaciones.performanceMonitoring = false;
    }

    activarOptimizaciones() {
        this.optimizaciones.panSmoothing = true;
        this.optimizaciones.zoomOptimization = true;
        this.optimizaciones.gestureHandling = true;
        this.optimizaciones.performanceMonitoring = true;

        this.inicializar();
    }
}

// Exportar para uso global
window.NavigationOptimized = NavigationOptimized;
