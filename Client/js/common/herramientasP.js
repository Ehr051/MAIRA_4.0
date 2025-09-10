/**
 * 🔄 MAIRA 4.0 - herramientasP.js STUB (Refactorizado)
 * 
 * ⚠️ IMPORTANTE: Este archivo ha sido refactorizado en módulos especializados
 * 
 * ANTES: Monolito de 3154 líneas (120KB)
 * AHORA: Módulos especializados con mejor arquitectura DDD/Hexagonal
 * 
 * 📋 MIGRACIÓN COMPLETA:
 * • MeasurementHandler        → /Client/js/handlers/measurementHandler.js
 * • ElevationProfileService   → /Client/js/services/elevationProfileService.js  
 * • MapInteractionHandler     → /Client/js/handlers/mapInteractionHandler.js
 * • GeometryUtils            → /Client/js/utils/geometryUtils.js
 * • MobileOptimizationHandler → /Client/js/handlers/mobileOptimizationHandler.js
 * • ToolsInitializer         → /Client/js/common/toolsInitializer.js
 * 
 * 🔗 COMPATIBILIDAD: Todas las funciones globales se mantienen mediante redirección
 * 📊 BENEFICIOS: Mejor testabilidad, mantenibilidad y separación de responsabilidades
 */

(function() {
    "use strict";

    console.log("🔄 herramientasP.js REFACTORIZADO");
    console.log("📦 Funcionalidad distribuida en 6 módulos especializados");
    console.log("🔍 Ver migrationMap.js para detalles completos");

    // 📊 INFORMACIÓN DE DEBUG
    window.herramientasPInfo = {
        estado: "REFACTORIZADO",
        version: "4.0-modular",
        modulos_creados: 6,
        lineas_originales: 3154,
        lineas_actuales: "~1800 distribuidas"
    };

    // 🔗 FUNCIONES GLOBALES CRÍTICAS (Implementación directa)
    window.medirDistancia = function() {
        console.log('📏 Iniciando medición de distancia (versión original restaurada)');
        
        if (!window.mapa) {
            console.error('❌ Mapa no disponible');
            return;
        }
        
        // Estado de medición global
        if (!window.medicionState) {
            window.medicionState = {
                activa: false,
                puntos: [],
                linea: null,
                marcadores: []
            };
        }
        
        const state = window.medicionState;
        
        if (state.activa) {
            // Finalizar medición actual
            console.log('🛑 Finalizando medición');
            window.finalizarMedicion();
            return;
        }
        
        // Iniciar nueva medición
        state.activa = true;
        window.measuringDistance = true; // Variable global para toolsInitializer
        state.puntos = [];
        state.marcadores = [];
        
        // Crear polyline
        state.linea = L.polyline([], {
            color: 'red',
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 10'
        }).addTo(window.mapa);
        
        // Configurar eventos de click
        window.mapa.on('click', window.onMapClick);
        window.mapa.on('dblclick', window.onMapDoubleClick);
        
        // Cambiar cursor
        window.mapa.getContainer().style.cursor = 'crosshair';
        
        // Mostrar display de medición (usando elemento HTML existente)
        window.mostrarDisplayMedicion();
        
        console.log('✅ Medición iniciada - Click para agregar puntos, doble-click para finalizar');
    };

    // Función de click en mapa
    window.onMapClick = function(e) {
        const state = window.medicionState;
        if (!state.activa) return;
        
        console.log('📍 Punto agregado:', e.latlng);
        
        // Agregar punto
        state.puntos.push(e.latlng);
        
        // Crear marcador
        const marcador = L.circleMarker(e.latlng, {
            radius: 5,
            color: 'red',
            fillColor: 'red',
            fillOpacity: 0.8
        }).addTo(window.mapa);
        
        state.marcadores.push(marcador);
        
        // Actualizar línea
        state.linea.setLatLngs(state.puntos);
        
        // Calcular distancia
        let distanciaTotal = 0;
        for (let i = 1; i < state.puntos.length; i++) {
            distanciaTotal += state.puntos[i-1].distanceTo(state.puntos[i]);
        }
        
        // Actualizar display
        window.actualizarDisplayMedicion(distanciaTotal);
    };
    
    // Función de doble click
    window.onMapDoubleClick = function(e) {
        console.log('⏹️ Doble click - Finalizando medición');
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        window.finalizarMedicion();
    };

    window.finalizarMedicion = function() {
        const state = window.medicionState;
        if (!state || !state.activa) return;
        
        console.log('🏁 Medición finalizada');
        
        // Remover eventos
        window.mapa.off('click', window.onMapClick);
        window.mapa.off('dblclick', window.onMapDoubleClick);
        
        // Restaurar cursor
        window.mapa.getContainer().style.cursor = '';
        
        // Ocultar display
        if (state.display) {
            state.display.remove();
            state.display = null;
        }
        
        // Limpiar estado (mantener línea y marcadores en el mapa)
        state.activa = false;
        
        console.log('✅ Medición completada');
    };

    window.addDistancePoint = function() {
        if (window.measurementHandler) {
            return window.measurementHandler.addDistancePoint.apply(this, arguments);
        }
        console.warn("measurementHandler no disponible");
    };

    // Función mostrarPerfilElevacion para compatibilidad
    window.mostrarPerfilElevacion = function() {
        console.log('📊 Mostrando perfil de elevación');
        if (window.elevationProfileService) {
            return window.elevationProfileService.mostrarPerfilElevacion.apply(this, arguments);
        }
        console.warn("elevationProfileService no disponible");
    };

    // Función deseleccionarElemento para compatibilidad
    window.deseleccionarElemento = function() {
        console.log('🎯 Deseleccionando elementos');
        
        const seleccionados = document.querySelectorAll('.elemento-seleccionado');
        seleccionados.forEach(el => el.classList.remove('elemento-seleccionado'));
        
        // Limpiar variable global
        window.elementoSeleccionado = null;
        
        console.log('✅ Elementos deseleccionados');
        return true;
    };

    // Mostrar display de medición (usar elemento HTML existente)
    window.mostrarDisplayMedicion = function() {
        const displayElement = document.getElementById('medicionDistancia');
        if (displayElement) {
            displayElement.style.display = 'flex';
            window.actualizarDisplayMedicion(0);
            
            // Configurar botón de cerrar si existe
            const cerrarBtn = document.getElementById('cerrarMedicion');
            if (cerrarBtn) {
                cerrarBtn.onclick = function() {
                    window.finalizarMedicion();
                };
            }
        } else {
            console.warn('⚠️ Elemento #medicionDistancia no encontrado en HTML');
        }
    };
    
    // Actualizar display de medición (usar elemento HTML existente)
    window.actualizarDisplayMedicion = function(distancia) {
        const textoElement = document.getElementById('textoMedicion');
        if (textoElement) {
            if (distancia >= 1000) {
                textoElement.textContent = `Distancia: ${(distancia / 1000).toFixed(2)} km`;
            } else {
                textoElement.textContent = `Distancia: ${distancia.toFixed(0)} m`;
            }
        }
    };

    window.finalizarMedicion = function() {
        const state = window.medicionState;
        if (!state || !state.activa) return;
        
        console.log('🏁 Medición finalizada');
        
        // Remover eventos
        window.mapa.off('click', window.onMapClick);
        window.mapa.off('dblclick', window.onMapDoubleClick);
        
        // Restaurar cursor
        window.mapa.getContainer().style.cursor = '';
        
        // Ocultar display (usar elemento HTML existente)
        const displayElement = document.getElementById('medicionDistancia');
        if (displayElement) {
            displayElement.style.display = 'none';
        }
        
        // Limpiar estado (mantener línea y marcadores en el mapa)
        state.activa = false;
        window.measuringDistance = false; // Variable global para toolsInitializer
        
        console.log('✅ Medición completada');
    };

    window.mostrarGraficoPerfil = function() {
        if (window.elevationProfileService) {
            return window.elevationProfileService.mostrarGraficoPerfil.apply(this, arguments);
        }
        console.warn("elevationProfileService no disponible");
    };

    // Función de cuadrículas restaurada
    window.mostrarCuadriculas = function() {
        console.log('🔲 Mostrando cuadrículas (versión original restaurada)');
        
        if (!window.mapa) {
            console.error('❌ Mapa no disponible');
            return;
        }
        
        // Remover cuadrículas existentes
        if (window.gridLayer) {
            window.mapa.removeLayer(window.gridLayer);
            window.gridLayer = null;
            console.log('🔲 Cuadrículas ocultadas');
            return;
        }
        
        // Crear nueva capa de cuadrículas
        window.gridLayer = L.layerGroup();
        
        const bounds = window.mapa.getBounds();
        const zoom = window.mapa.getZoom();
        
        // Calcular espaciado según zoom
        let spacing = 0.1; // grados
        if (zoom > 10) spacing = 0.05;
        if (zoom > 12) spacing = 0.01;
        if (zoom > 15) spacing = 0.005;
        if (zoom > 17) spacing = 0.001;
        
        console.log(`🔲 Zoom: ${zoom}, Espaciado: ${spacing} grados`);
        
        // Crear líneas horizontales
        for (let lat = Math.floor(bounds.getSouth() / spacing) * spacing; lat <= bounds.getNorth(); lat += spacing) {
            const line = L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], {
                color: '#0281a8',
                weight: 1,
                opacity: 0.6,
                interactive: false
            });
            window.gridLayer.addLayer(line);
        }
        
        // Crear líneas verticales
        for (let lng = Math.floor(bounds.getWest() / spacing) * spacing; lng <= bounds.getEast(); lng += spacing) {
            const line = L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], {
                color: '#0281a8',
                weight: 1,
                opacity: 0.6,
                interactive: false
            });
            window.gridLayer.addLayer(line);
        }
        
        window.gridLayer.addTo(window.mapa);
        console.log('✅ Cuadrículas mostradas');
    };

    window.calcularDistancia = function() {
        if (window.geometryUtils) {
            return window.geometryUtils.calcularDistancia.apply(this, arguments);
        }
        console.warn("geometryUtils no disponible");
    };

    // Función toggleMenu para compatibilidad
    window.toggleMenu = function(menuId) {
        console.log('🔧 Intentando alternar menú:', menuId);
        
        const menu = document.getElementById(menuId);
        if (!menu) {
            console.warn(`⚠️ Menú '${menuId}' no encontrado`);
            return false;
        }
        
        // Método simple y compatible
        menu.classList.toggle('show');
        
        const esVisible = menu.classList.contains('show');
        console.log(`✅ Menú '${menuId}' ${esVisible ? 'mostrado' : 'ocultado'}`);
        
        return true;
    };

    // Función seleccionarElemento para compatibilidad
    window.seleccionarElemento = function(elemento) {
        console.log('🎯 Seleccionando elemento:', elemento);
        
        if (!elemento) {
            console.warn('⚠️ Elemento no válido para seleccionar');
            return false;
        }
        
        // Remover selección anterior
        const seleccionados = document.querySelectorAll('.elemento-seleccionado');
        seleccionados.forEach(el => el.classList.remove('elemento-seleccionado'));
        
        // Agregar selección al nuevo elemento
        if (elemento.classList) {
            elemento.classList.add('elemento-seleccionado');
        }
        
        console.log('✅ Elemento seleccionado');
        return true;
    };

    // MAIRA UserIdentity stub para compatibilidad temporal
    if (!window.MAIRA) {
        window.MAIRA = {};
    }
    
    if (!window.MAIRA.UserIdentity) {
        window.MAIRA.UserIdentity = {
            isAuthenticated: function() {
                return localStorage.getItem('userId') !== null;
            },
            getUserId: function() {
                return localStorage.getItem('userId') || 'user_' + Date.now();
            },
            getUsername: function() {
                return localStorage.getItem('username') || 'Usuario';
            },
            getUserData: function() {
                return {
                    id: this.getUserId(),
                    username: this.getUsername(),
                    isAuthenticated: this.isAuthenticated()
                };
            }
        };
        console.log('✅ UserIdentity stub inicializado');
    }

    // gestorTurnos stub para compatibilidad temporal
    if (!window.gestorTurnos) {
        window.gestorTurnos = {
            obtenerJugadorPropietario: function() {
                // Devolver el ID del usuario actual
                if (window.MAIRA && window.MAIRA.UserIdentity) {
                    return window.MAIRA.UserIdentity.getUserId();
                }
                return localStorage.getItem('userId') || 'player_1';
            }
        };
        console.log('✅ gestorTurnos stub inicializado');
    }

    // MAIRA.Utils stub para notificaciones
    if (!window.MAIRA.Utils) {
        window.MAIRA.Utils = {
            mostrarNotificacion: function(mensaje, tipo) {
                console.log(`[${tipo?.toUpperCase() || 'INFO'}] ${mensaje}`);
                // Mostrar una alerta simple por ahora
                if (tipo === 'error') {
                    alert(`Error: ${mensaje}`);
                }
            }
        };
        console.log('✅ MAIRA.Utils stub inicializado');
    }

    // Funciones para optimización de rendimiento
    window.clearCache = function() {
        console.log('🧹 Limpiando cache...');
        // Stub básico para clearCache
        if (window.caches) {
            caches.keys().then(function(names) {
                names.forEach(function(name) {
                    caches.delete(name);
                });
            });
        }
        console.log('✅ Cache limpiado');
    };

    // Variables globales para compatibilidad
    window.measuringDistance = false;
    window.elementoSeleccionado = null;

    console.log("✅ herramientasP.js stub cargado - funcionalidad en módulos especializados");
})();
