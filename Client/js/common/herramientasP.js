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

    // ✅ FUNCIONES YA DEFINIDAS GLOBALMENTE POR MÓDULOS ESPECIALIZADOS
    // Las siguientes funciones están disponibles globalmente:
    // - medirDistancia() en measurementHandler.js
    // - addDistancePoint() en measurementHandler.js  
    // - finalizarMedicion() en measurementHandler.js
    // - mostrarPerfilElevacion() en measurementHandler.js
    // - seleccionarElemento() y deseleccionarElemento() definidas más abajo

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
        
        try {
            // Deseleccionar elemento anterior si existe
            if (window.elementoSeleccionado && window.elementoSeleccionado !== elemento) {
                window.deseleccionarElemento();
            }
            
            // Guardar estilo original solo la primera vez para elementos Leaflet
            if (elemento.setStyle && !elemento.originalStyle && !elemento._editedStyle) {
                elemento.originalStyle = {
                    color: elemento.options.color || '#3388ff',
                    weight: elemento.options.weight || 3,
                    opacity: elemento.options.opacity || 1,
                    fillOpacity: elemento.options.fillOpacity || 0.2,
                    dashArray: elemento.options.dashArray || null
                };
                console.log('💾 Estilo original guardado:', elemento.originalStyle);
            }
            
            // Aplicar estilo de selección para elementos Leaflet
            if (elemento.setStyle) {
                let colorActual = '#3388ff';
                let pesoActual = 3;
                let dashArrayActual = null;
                
                if (elemento._editedStyle) {
                    colorActual = elemento._editedStyle.color;
                    pesoActual = elemento._editedStyle.weight;
                    dashArrayActual = elemento._editedStyle.dashArray;
                } else if (elemento.originalStyle) {
                    colorActual = elemento.originalStyle.color;
                    pesoActual = elemento.originalStyle.weight;
                    dashArrayActual = elemento.originalStyle.dashArray;
                }
                
                // Estilo de selección (más grueso, mais visible)
                elemento.setStyle({
                    color: colorActual,
                    weight: pesoActual + 2, // Más grueso
                    opacity: 1,
                    dashArray: dashArrayActual
                });
                
                console.log(`🎨 Estilo de selección aplicado - Color: ${colorActual}, Peso: ${pesoActual + 2}`);
            }
            
            // Para elementos DOM regulares
            if (elemento.classList) {
                elemento.classList.add('elemento-seleccionado');
            }
            
            // Guardar elemento seleccionado globalmente
            window.elementoSeleccionado = elemento;
            
            console.log('✅ Elemento seleccionado correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error seleccionando elemento:', error);
            return false;
        }
    };

    window.deseleccionarElemento = function() {
        console.log('🎯 Deseleccionando elementos');
        
        try {
            // Deseleccionar elementos DOM
            const seleccionados = document.querySelectorAll('.elemento-seleccionado');
            seleccionados.forEach(el => el.classList.remove('elemento-seleccionado'));
            
            // Restaurar estilo original para elemento Leaflet seleccionado
            if (window.elementoSeleccionado && window.elementoSeleccionado.setStyle) {
                const elemento = window.elementoSeleccionado;
                
                if (elemento._editedStyle) {
                    // Si tiene estilo editado, usar ese
                    elemento.setStyle(elemento._editedStyle);
                    console.log('🎨 Estilo editado restaurado');
                } else if (elemento.originalStyle) {
                    // Si no, usar el original
                    elemento.setStyle(elemento.originalStyle);
                    console.log('🎨 Estilo original restaurado');
                } else {
                    // Fallback: estilo por defecto
                    elemento.setStyle({
                        color: '#3388ff',
                        weight: 3,
                        opacity: 1,
                        dashArray: null
                    });
                    console.log('🎨 Estilo por defecto restaurado');
                }
            }
            
            window.elementoSeleccionado = null;
            
            console.log('✅ Elementos deseleccionados correctamente');
            return true;
            
        } catch (error) {
            console.error('❌ Error deseleccionando elementos:', error);
            window.elementoSeleccionado = null;
            return false;
        }
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

    // ✅ FUNCIÓN CRÍTICA PERDIDA: interpolarPuntosRuta 
    // Función necesaria para CalculoMarcha.js - interpola puntos en una ruta
    window.interpolarPuntosRuta = function(puntosBase, numeroSegmentos = 10) {
        try {
            if (!puntosBase || puntosBase.length < 2) {
                console.warn('⚠️ interpolarPuntosRuta: No hay suficientes puntos para interpolar');
                return puntosBase || [];
            }

            console.log('🔄 Interpolando ruta con', puntosBase.length, 'puntos base');
            
            const puntosInterpolados = [];
            
            for (let i = 0; i < puntosBase.length - 1; i++) {
                const puntoInicio = puntosBase[i];
                const puntoFin = puntosBase[i + 1];
                
                // Agregar punto de inicio
                puntosInterpolados.push({
                    lat: puntoInicio.lat,
                    lng: puntoInicio.lng
                });
                
                // Interpolar puntos intermedios entre cada par de puntos
                for (let j = 1; j < numeroSegmentos; j++) {
                    const factor = j / numeroSegmentos;
                    const lat = puntoInicio.lat + (puntoFin.lat - puntoInicio.lat) * factor;
                    const lng = puntoInicio.lng + (puntoFin.lng - puntoInicio.lng) * factor;
                    
                    puntosInterpolados.push({
                        lat: lat,
                        lng: lng
                    });
                }
            }
            
            // Agregar último punto
            const ultimoPunto = puntosBase[puntosBase.length - 1];
            puntosInterpolados.push({
                lat: ultimoPunto.lat,
                lng: ultimoPunto.lng
            });
            
            console.log('✅ Ruta interpolada:', puntosInterpolados.length, 'puntos totales');
            return puntosInterpolados;
            
        } catch (error) {
            console.error('❌ Error en interpolarPuntosRuta:', error);
            return puntosBase || [];
        }
    };

    console.log("✅ herramientasP.js stub cargado - funcionalidad en módulos especializados");
    console.log("✅ interpolarPuntosRuta restaurada para CalculoMarcha.js");
})();
