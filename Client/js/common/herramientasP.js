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

    // 📊 INFORMACIÓN DE DEBUG
    window.herramientasPInfo = {
        estado: "REFACTORIZADO",
        version: "4.0-modular",
        modulos_creados: 6,
        lineas_originales: 3154,
        lineas_actuales: "~1800 distribuidas"
    };

    // 🔗 REDIRECCIONAMIENTO A MÓDULOS ESPECIALIZADOS
    window.medirDistancia = function() {
        if (window.measurementHandler) {
            return window.measurementHandler.medirDistancia.apply(this, arguments);
        }
        console.warn("measurementHandler no disponible");
    };

    window.addDistancePoint = function() {
        if (window.measurementHandler) {
            return window.measurementHandler.addDistancePoint.apply(this, arguments);
        }
        console.warn("measurementHandler no disponible");
    };

    window.finalizarMedicion = function() {
        if (window.measurementHandler) {
            return window.measurementHandler.finalizarMedicion.apply(this, arguments);
        }
        console.warn("measurementHandler no disponible");
    };

    window.mostrarGraficoPerfil = function() {
        if (window.elevationProfileService) {
            return window.elevationProfileService.mostrarGraficoPerfil.apply(this, arguments);
        }
        console.warn("elevationProfileService no disponible");
    };

    window.mostrarPerfilElevacion = function() {
        if (window.elevationProfileService) {
            return window.elevationProfileService.mostrarPerfilElevacion.apply(this, arguments);
        }
        console.warn("elevationProfileService no disponible");
    };

    window.mostrarCuadriculas = function() {
        if (window.mapInteractionHandler) {
            return window.mapInteractionHandler.mostrarCuadriculas.apply(this, arguments);
        }
        console.warn("mapInteractionHandler no disponible");
    };

    window.calcularDistancia = function() {
        if (window.geometryUtils) {
            return window.geometryUtils.calcularDistancia.apply(this, arguments);
        }
        console.warn("geometryUtils no disponible");
    };

    // Funciones básicas de UI que son necesarias para compatibilidad
    window.toggleMenu = function(menuId) {
        console.log('🔧 Intentando alternar menú:', menuId);
        
        const menu = document.getElementById(menuId);
        if (!menu) {
            console.warn(`⚠️ Menú '${menuId}' no encontrado`);
            return false;
        }
        
        menu.classList.toggle('show');
        
        const esVisible = menu.classList.contains('show');
        console.log(`✅ Menú '${menuId}' ${esVisible ? 'mostrado' : 'ocultado'}`);
        
        return true;
    };

    window.seleccionarElemento = function(elemento) {
        console.log('🎯 Seleccionando elemento:', elemento);
        
        if (!elemento) {
            console.warn('⚠️ Elemento no válido para seleccionar');
            return false;
        }
        
        const seleccionados = document.querySelectorAll('.elemento-seleccionado');
        seleccionados.forEach(el => el.classList.remove('elemento-seleccionado'));
        
        if (elemento.classList) {
            elemento.classList.add('elemento-seleccionado');
        }
        
        window.elementoSeleccionado = elemento;
        console.log('✅ Elemento seleccionado');
        return true;
    };

    window.deseleccionarElemento = function() {
        console.log('🎯 Deseleccionando elementos');
        
        const seleccionados = document.querySelectorAll('.elemento-seleccionado');
        seleccionados.forEach(el => el.classList.remove('elemento-seleccionado'));
        
        window.elementoSeleccionado = null;
        
        console.log('✅ Elementos deseleccionados');
        return true;
    };

    // Variables globales para compatibilidad
    window.measuringDistance = false;
    window.elementoSeleccionado = null;

    // Función global para obtener propietario según contexto
    window.obtenerJugadorPropietario = function() {
        // Detectar contexto automáticamente
        const esModoPlaneamiento = window.location.pathname.includes('planeamiento') || 
                                 document.title.includes('Planeamiento') ||
                                 !window.gestorTurnos;
        
        if (esModoPlaneamiento) {
            // En modo planeamiento, usar siempre el usuario de sesión
            console.log('🎯 Modo planeamiento detectado - usando usuario de sesión');
            return window.MAIRA?.UserIdentity?.getUserId() || 
                   localStorage.getItem('userId') || 
                   'planner_user';
        } else {
            // En modo juego de guerra, usar el gestor de turnos
            console.log('⚔️ Modo juego de guerra detectado - usando gestor de turnos');
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
                return window.gestorTurnos.obtenerJugadorPropietario();
            }
            return window.userId || 'player_1';
        }
    };

    // MAIRA UserIdentity stub para compatibilidad temporal
    if (!window.MAIRA) {
        window.MAIRA = {};
    }
    
    if (!window.MAIRA.UserIdentity) {
        window.MAIRA.UserIdentity = {
            isAuthenticated: function() {
                return localStorage.getItem('userId') !== null || true; // Siempre autenticado para planeamiento
            },
            getUserId: function() {
                return localStorage.getItem('userId') || 'planner_' + Date.now();
            },
            getUsername: function() {
                return localStorage.getItem('username') || 'Planificador';
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

    // MAIRA.Utils stub para notificaciones
    if (!window.MAIRA.Utils) {
        window.MAIRA.Utils = {
            mostrarNotificacion: function(mensaje, tipo) {
                console.log(`[${tipo?.toUpperCase() || 'INFO'}] ${mensaje}`);
                if (tipo === 'error') {
                    console.error(mensaje);
                } else {
                    console.info(mensaje);
                }
            }
        };
        console.log('✅ MAIRA.Utils stub inicializado');
    }

    console.log("✅ herramientasP.js stub cargado - funcionalidad en módulos especializados");
})();
