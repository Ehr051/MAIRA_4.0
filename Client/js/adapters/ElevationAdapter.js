/**
 * ELEVATION ADAPTER - MAIRA 4.0
 * Adapter de compatibilidad para elevationHandler legacy
 * 
 * Mantiene la API pública original de elevationHandler
 * mientras usa el nuevo ElevationService optimizado por dentro
 * 
 * @version 1.0.0
 * @date 2025-01-09
 * @author MAIRA Team
 * 
 * PROPÓSITO:
 * - Permitir migración gradual sin romper código existente
 * - Mantener 100% compatibilidad con APIs legacy
 * - Habilitar workers y optimizaciones por dentro
 * 
 * APIs MANTENIDAS:
 * - obtenerElevacion(lat, lon)
 * - getElevation(lat, lon)
 * - getElevationAtPosition(lat, lon)
 * - calcularPerfilElevacion(puntos)
 * - cargarIndiceTiles()
 * - inicializarDatosElevacion(bounds)
 * - cargarDatosElevacion()
 * - obtenerEstadoSistema()
 * - clearCache()
 */

class ElevationAdapter {
    constructor(elevationService) {
        if (!elevationService) {
            throw new Error('ElevationAdapter requiere un ElevationService');
        }
        
        this.service = elevationService;
        this.initialized = false;
        
        console.log('✅ ElevationAdapter creado (wrapping ElevationService optimizado)');
    }
    
    /**
     * Inicializar el adapter
     */
    async initialize() {
        if (this.initialized) return;
        
        // El service ya debe estar inicializado
        if (!this.service.initialized) {
            await this.service.initialize();
        }
        
        this.initialized = true;
        console.log('✅ ElevationAdapter inicializado');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // APIs LEGACY MANTENIDAS (CalculoMarcha, combatSystem3D, etc.)
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * ✅ LEGACY API: Obtener elevación
     * Usado en: CalculoMarcha.js línea 178
     */
    async obtenerElevacion(lat, lon) {
        return await this.service.getElevation(lat, lon);
    }
    
    /**
     * ✅ LEGACY API: Get elevation (alias inglés)
     * Usado en: pendienteHandler.js línea 198
     */
    async getElevation(lat, lon) {
        return await this.service.getElevation(lat, lon);
    }
    
    /**
     * ✅ LEGACY API: Get elevation at position
     * Usado en: combatSystem3DIntegrator.js línea 437
     */
    async getElevationAtPosition(lat, lon) {
        return await this.service.getElevation(lat, lon);
    }
    
    /**
     * ✅ LEGACY API: Calcular perfil de elevación para ruta
     * Usado en: elevationHandler.js línea 944+, múltiples archivos
     */
    async calcularPerfilElevacion(puntos) {
        if (!puntos || !Array.isArray(puntos) || puntos.length === 0) {
            console.warn('⚠️ calcularPerfilElevacion: puntos inválidos');
            return [];
        }
        
        // Convertir puntos a formato correcto
        const coords = puntos.map(p => ({
            lat: p.lat || p.latitude || p[0],
            lon: p.lon || p.lng || p.longitude || p[1]
        }));
        
        // Usar batch optimizado del service
        const elevations = await this.service.getElevationsBatch(coords);
        
        // Formatear resultado compatible con API original
        return elevations.map((elev, index) => ({
            lat: coords[index].lat,
            lon: coords[index].lon,
            elevation: elev.elevation,
            distancia: index > 0 ? this._calcularDistancia(
                coords[index-1].lat, coords[index-1].lon,
                coords[index].lat, coords[index].lon
            ) : 0
        }));
    }
    
    /**
     * ✅ LEGACY API: Cargar índice de tiles
     * Usado en: indexP.js línea 29
     */
    async cargarIndiceTiles() {
        // El nuevo service carga el índice automáticamente en initialize()
        if (!this.initialized) {
            await this.initialize();
        }
        console.log('✅ Índice de tiles cargado (via ElevationService)');
        return { success: true, message: 'Índice cargado' };
    }
    
    /**
     * ✅ LEGACY API: Inicializar datos de elevación con bounds
     * Usado en: indexP.js línea 46
     */
    async inicializarDatosElevacion(bounds) {
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Pre-cargar tiles para el área especificada
        if (bounds && bounds.south && bounds.north && bounds.west && bounds.east) {
            console.log('📍 Inicializando datos elevación para bounds:', bounds);
            // TODO: Pre-cargar tiles del área (opcional)
        }
        
        return { success: true, tiles: 0 };
    }
    
    /**
     * ✅ LEGACY API: Cargar datos de elevación
     * Usado en: indexP.js línea 105
     */
    async cargarDatosElevacion() {
        if (!this.initialized) {
            await this.initialize();
        }
        
        return { 
            success: true, 
            message: 'Datos cargados via ElevationService',
            tiles: this.service.cache?.size || 0
        };
    }
    
    /**
     * ✅ LEGACY API: Obtener estado del sistema
     * Usado en: indexP.js líneas 109, 121, 127
     */
    obtenerEstadoSistema() {
        const stats = this.service.getStats();
        
        return {
            initialized: this.initialized,
            tilesLoaded: stats.tilesLoaded,
            cacheSize: stats.cacheHits + stats.cacheMisses,
            cacheHits: stats.cacheHits,
            cacheMisses: stats.cacheMisses,
            workerCalls: stats.workerCalls,
            errors: stats.errors,
            usingWorkers: this.service.config.useWorkers
        };
    }
    
    /**
     * ✅ LEGACY API: Limpiar cache
     * Usado en: performanceOptimizer.js línea 479
     */
    clearCache() {
        this.service.clearCache();
        console.log('🗑️ Cache de elevación limpiado');
    }
    
    /**
     * ✅ LEGACY API: Mostrar perfil de línea (para UI)
     * Usado en: elementosGB.js línea 4288
     */
    async mostrarPerfilLinea(puntos, titulo = 'Perfil de Elevación') {
        const perfil = await this.calcularPerfilElevacion(puntos);
        
        if (!perfil || perfil.length === 0) {
            console.warn('⚠️ No se pudo generar perfil de elevación');
            return;
        }
        
        // Delegar a sistema de visualización (si existe)
        if (window.elevationProfileService && window.elevationProfileService.mostrarPerfil) {
            window.elevationProfileService.mostrarPerfil(perfil, titulo);
        } else {
            console.log('📊 Perfil de elevación:', perfil);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Calcular distancia entre dos puntos (Haversine)
     */
    _calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radio Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Get stats (acceso directo para debugging)
     */
    getStats() {
        return this.service.getStats();
    }
}

// Exportar para Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElevationAdapter;
}

// Registrar globalmente para uso en navegador
if (typeof window !== 'undefined') {
    window.ElevationAdapter = ElevationAdapter;
}
