/**
 * 🎯 EJEMPLO DE USO - ARQUITECTURA SEPARADA
 * =======================================
 * Demuestra cómo usar handlers y services correctamente separados
 */

// ✅ EJEMPLO 1: Obtener perfil de elevación CON pendientes
async function obtenerPerfilElevacionCompleto(ruta) {
    console.log('🎯 Ejemplo: Perfil elevación con análisis de pendientes');
    
    try {
        // 1. HANDLER: Solo obtiene datos de elevación
        const elevationHandler = window.MAIRA?.Handlers?.Elevation;
        const datosElevacion = await elevationHandler.procesarRutaElevacion(ruta);
        
        console.log('📊 Datos de elevación obtenidos:', datosElevacion.length, 'puntos');
        
        // 2. SERVICE: Calcula pendientes usando los datos del handler
        const slopeService = window.MAIRA?.Services?.SlopeAnalysis;
        const perfilConPendientes = slopeService.calculateElevationProfileSlopes(datosElevacion);
        
        console.log('📈 Pendientes calculadas:', perfilConPendientes.length, 'puntos');
        
        return {
            datos: perfilConPendientes,
            resumen: {
                puntos: perfilConPendientes.length,
                pendienteMaxima: Math.max(...perfilConPendientes.map(p => Math.abs(p.pendiente || 0))),
                pendientePromedio: perfilConPendientes.reduce((sum, p) => sum + Math.abs(p.pendiente || 0), 0) / perfilConPendientes.length
            }
        };
        
    } catch (error) {
        console.error('❌ Error en perfil de elevación:', error);
        throw error;
    }
}

// ✅ EJEMPLO 2: Análisis de transitabilidad integral
async function analizarTransitabilidadRuta(ruta, tipoVehiculo = 'infantry') {
    console.log('🎯 Ejemplo: Análisis integral de transitabilidad');
    
    try {
        // 1. HANDLERS: Obtener datos base
        const elevationHandler = window.MAIRA?.Handlers?.Elevation;
        const vegetacionHandler = window.MAIRA?.Handlers?.Vegetacion;
        
        const [datosElevacion, datosVegetacion] = await Promise.all([
            elevationHandler.procesarRutaElevacion(ruta),
            vegetacionHandler.obtenerVegetacionRuta(ruta)
        ]);
        
        // 2. SERVICES: Análisis especializados
        const slopeService = window.MAIRA?.Services?.SlopeAnalysis;
        const transitService = window.MAIRA?.Services?.Transitability;
        
        // Calcular pendientes
        const datosConPendientes = slopeService.calculateElevationProfileSlopes(datosElevacion);
        
        // Análisis integral de transitabilidad
        const analisisTransit = await transitService.analyze({
            elevation: datosConPendientes,
            vegetation: datosVegetacion,
            vehicleType: tipoVehiculo,
            weather: 'clear' // Podría venir de weatherHandler
        });
        
        return {
            ruta: datosConPendientes,
            vegetacion: datosVegetacion,
            transitabilidad: analisisTransit,
            recomendaciones: transitService.getRecommendations(analisisTransit)
        };
        
    } catch (error) {
        console.error('❌ Error en análisis de transitabilidad:', error);
        throw error;
    }
}

// ✅ EJEMPLO 3: Análisis de pendiente en un punto específico
async function analizarPendientePunto(lat, lng) {
    console.log('🎯 Ejemplo: Análisis de pendiente en punto específico');
    
    try {
        // Solo necesitamos el service de pendientes
        const slopeService = window.MAIRA?.Services?.SlopeAnalysis;
        
        const analisisPendiente = await slopeService.calculateSlope(lat, lng, 'horn', 'medium');
        
        return {
            coordenadas: { lat, lng },
            pendiente: analisisPendiente.slope,
            direccion: analisisPendiente.direction,
            clasificacion: analisisPendiente.classification,
            algoritmo: analisisPendiente.algorithm
        };
        
    } catch (error) {
        console.error('❌ Error en análisis de pendiente:', error);
        throw error;
    }
}

// 🔄 EXPORTAR EJEMPLOS
if (typeof window !== 'undefined') {
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.Examples = {
        obtenerPerfilElevacionCompleto,
        analizarTransitabilidadRuta,
        analizarPendientePunto
    };
    
    console.log('✅ Ejemplos de arquitectura separada disponibles en MAIRA.Examples');
}

/**
 * 📋 RESUMEN DE SEPARACIÓN:
 * 
 * HANDLERS (Solo datos):
 * ├── elevationHandler.js → Obtener/cachear elevaciones
 * └── vegetacionHandler.js → Obtener/cachear vegetación
 * 
 * SERVICES (Análisis):
 * ├── slopeAnalysisService.js → Calcular pendientes y análisis
 * └── transitabilityService.js → Análisis integral transitabilidad
 * 
 * FLUJO:
 * 1. Handler obtiene datos RAW
 * 2. Service procesa y analiza
 * 3. Resultado final combinado
 */
