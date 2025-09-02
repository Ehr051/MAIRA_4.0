/**
 * 📐 PENDIENTE HANDLER - MAIRA 4.0
 * Módulo especializado para cálculo de pendientes del terreno
 * Utiliza datos de elevación para análisis topográfico militar
 */

class PendienteHandler {
    constructor() {
        this.initialized = false;
        this.cache = new Map();
        this.maxCacheSize = 200;
        this.worker = null;
        
        // Configuración de análisis de pendiente
        this.config = {
            // Radio de análisis (metros)
            radioAnalisis: {
                fino: 50,      // Análisis local
                medio: 100,    // Análisis regional
                amplio: 250    // Análisis amplio
            },
            
            // Clasificación de pendientes (grados)
            clasificaciones: {
                plano: { min: 0, max: 2, color: '#00ff00' },
                suave: { min: 2, max: 5, color: '#7fff00' },
                moderado: { min: 5, max: 10, color: '#ffff00' },
                pronunciado: { min: 10, max: 20, color: '#ff7f00' },
                empinado: { min: 20, max: 35, color: '#ff4500' },
                extremo: { min: 35, max: 90, color: '#ff0000' }
            },
            
            // Precisión de cálculo
            precision: {
                coordenadas: 6,    // decimales lat/lng
                pendiente: 2,      // decimales grados
                direccion: 1       // decimales grados
            }
        };
        
        console.log('📐 PendienteHandler inicializado');
    }
    
    /**
     * Inicializar el handler
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Verificar que el elevationHandler esté disponible
            if (typeof window.elevationHandler === 'undefined') {
                console.warn('⚠️ ElevationHandler no disponible - funcionalidad limitada');
            }
            
            // Inicializar worker si está disponible
            this.initializeWorker();
            
            this.initialized = true;
            console.log('✅ PendienteHandler inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando PendienteHandler:', error);
            throw error;
        }
    }
    
    /**
     * Inicializar worker para cálculos paralelos
     */
    initializeWorker() {
        try {
            // Por ahora sin worker, usar cálculo directo
            // En futuras versiones se puede implementar pendiente.worker.js
            console.log('📐 Usando cálculo directo de pendientes (sin worker)');
        } catch (error) {
            console.warn('⚠️ No se pudo inicializar worker de pendientes:', error);
        }
    }
    
    /**
     * Obtener pendiente en una coordenada específica
     */
    async getPendiente(lat, lng, tipoAnalisis = 'medio') {
        if (!this.initialized) {
            await this.initialize();
        }
        
        const cacheKey = `${lat}_${lng}_${tipoAnalisis}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const resultado = await this.calcularPendiente(lat, lng, tipoAnalisis);
            
            // Guardar en cache
            this.guardarEnCache(cacheKey, resultado);
            
            return resultado;
            
        } catch (error) {
            console.error('❌ Error obteniendo pendiente:', error);
            return this.crearResultadoError(error.message);
        }
    }
    
    /**
     * Calcular pendiente usando método de gradiente
     */
    async calcularPendiente(lat, lng, tipoAnalisis) {
        const radio = this.config.radioAnalisis[tipoAnalisis] || 100;
        const deltaGrados = this.metrosAGrados(radio);
        
        try {
            // Obtener elevaciones en patrón de cruz
            const puntos = await this.obtenerElevacionesPuntos(lat, lng, deltaGrados);
            
            if (!puntos.centro.success) {
                throw new Error('No se pudo obtener elevación del punto central');
            }
            
            // Calcular gradiente
            const gradiente = this.calcularGradiente(puntos, deltaGrados);
            
            // Calcular pendiente y dirección
            const pendienteRadianes = Math.atan(Math.sqrt(gradiente.dx * gradiente.dx + gradiente.dy * gradiente.dy));
            const pendienteGrados = pendienteRadianes * (180 / Math.PI);
            
            const direccionRadianes = Math.atan2(gradiente.dy, gradiente.dx);
            let direccionGrados = direccionRadianes * (180 / Math.PI);
            
            // Normalizar dirección (0-360°)
            if (direccionGrados < 0) direccionGrados += 360;
            
            // Clasificar pendiente
            const clasificacion = this.clasificarPendiente(pendienteGrados);
            
            return {
                success: true,
                lat: this.redondear(lat, this.config.precision.coordenadas),
                lng: this.redondear(lng, this.config.precision.coordenadas),
                pendiente: this.redondear(pendienteGrados, this.config.precision.pendiente),
                direccion: this.redondear(direccionGrados, this.config.precision.direccion),
                clasificacion,
                tipoAnalisis,
                radio,
                elevacionCentro: puntos.centro.elevation,
                gradiente: {
                    dx: this.redondear(gradiente.dx, 6),
                    dy: this.redondear(gradiente.dy, 6)
                },
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error calculando pendiente:', error);
            return this.crearResultadoError(error.message);
        }
    }
    
    /**
     * Obtener elevaciones en puntos circundantes
     */
    async obtenerElevacionesPuntos(lat, lng, delta) {
        const promesas = {
            centro: this.obtenerElevacion(lat, lng),
            norte: this.obtenerElevacion(lat + delta, lng),
            sur: this.obtenerElevacion(lat - delta, lng),
            este: this.obtenerElevacion(lat, lng + delta),
            oeste: this.obtenerElevacion(lat, lng - delta)
        };
        
        const resultados = await Promise.allSettled(Object.values(promesas));
        const keys = Object.keys(promesas);
        
        const puntos = {};
        resultados.forEach((resultado, index) => {
            const key = keys[index];
            if (resultado.status === 'fulfilled') {
                puntos[key] = resultado.value;
            } else {
                puntos[key] = { success: false, error: resultado.reason.message };
            }
        });
        
        return puntos;
    }
    
    /**
     * Obtener elevación usando elevationHandler
     */
    async obtenerElevacion(lat, lng) {
        try {
            if (window.elevationHandler && typeof window.elevationHandler.getElevation === 'function') {
                const resultado = await window.elevationHandler.getElevation(lat, lng);
                
                if (resultado && resultado.elevation !== null && resultado.elevation !== undefined) {
                    return {
                        success: true,
                        elevation: resultado.elevation,
                        lat,
                        lng
                    };
                }
            }
            
            throw new Error('ElevationHandler no disponible o sin datos');
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                lat,
                lng
            };
        }
    }
    
    /**
     * Calcular gradiente usando diferencias finitas
     */
    calcularGradiente(puntos, delta) {
        // Usar diferencias centrales si están disponibles
        let dx = 0, dy = 0;
        
        if (puntos.este.success && puntos.oeste.success) {
            dx = (puntos.este.elevation - puntos.oeste.elevation) / (2 * this.gradosAMetros(delta));
        } else if (puntos.este.success && puntos.centro.success) {
            dx = (puntos.este.elevation - puntos.centro.elevation) / this.gradosAMetros(delta);
        } else if (puntos.centro.success && puntos.oeste.success) {
            dx = (puntos.centro.elevation - puntos.oeste.elevation) / this.gradosAMetros(delta);
        }
        
        if (puntos.norte.success && puntos.sur.success) {
            dy = (puntos.norte.elevation - puntos.sur.elevation) / (2 * this.gradosAMetros(delta));
        } else if (puntos.norte.success && puntos.centro.success) {
            dy = (puntos.norte.elevation - puntos.centro.elevation) / this.gradosAMetros(delta);
        } else if (puntos.centro.success && puntos.sur.success) {
            dy = (puntos.centro.elevation - puntos.sur.elevation) / this.gradosAMetros(delta);
        }
        
        return { dx, dy };
    }
    
    /**
     * Clasificar pendiente según rangos configurados
     */
    clasificarPendiente(pendienteGrados) {
        for (const [tipo, rango] of Object.entries(this.config.clasificaciones)) {
            if (pendienteGrados >= rango.min && pendienteGrados < rango.max) {
                return {
                    tipo,
                    descripcion: this.getDescripcionClasificacion(tipo),
                    color: rango.color,
                    rango: `${rango.min}°-${rango.max}°`
                };
            }
        }
        
        // Caso extremo (>90°)
        return {
            tipo: 'extremo',
            descripcion: 'Pendiente extrema',
            color: '#ff0000',
            rango: '>35°'
        };
    }
    
    /**
     * Obtener descripción de clasificación
     */
    getDescripcionClasificacion(tipo) {
        const descripciones = {
            plano: 'Terreno plano - ideal para movimiento',
            suave: 'Pendiente suave - buena transitabilidad',
            moderado: 'Pendiente moderada - cuidado vehicular',
            pronunciado: 'Pendiente pronunciada - limitación vehicular',
            empinado: 'Pendiente empinada - solo infantería',
            extremo: 'Pendiente extrema - intransitable'
        };
        
        return descripciones[tipo] || 'Clasificación desconocida';
    }
    
    /**
     * Convertir metros a grados (aproximado)
     */
    metrosAGrados(metros) {
        return metros / 111000; // ~111km por grado
    }
    
    /**
     * Convertir grados a metros (aproximado)
     */
    gradosAMetros(grados) {
        return grados * 111000; // ~111km por grado
    }
    
    /**
     * Redondear número
     */
    redondear(numero, decimales) {
        const factor = Math.pow(10, decimales);
        return Math.round(numero * factor) / factor;
    }
    
    /**
     * Crear resultado de error
     */
    crearResultadoError(errorMessage) {
        return {
            success: false,
            error: errorMessage,
            pendiente: null,
            direccion: null,
            clasificacion: {
                tipo: 'error',
                descripcion: 'Error en cálculo',
                color: '#808080'
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Guardar en cache
     */
    guardarEnCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, data);
    }
    
    /**
     * Limpiar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache de pendientes limpiado');
    }
    
    /**
     * Obtener estadísticas del cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            usage: (this.cache.size / this.maxCacheSize * 100).toFixed(1) + '%'
        };
    }
    
    /**
     * Analizar pendientes en área
     */
    async analizarArea(coordenadas, tipoAnalisis = 'medio') {
        const resultados = [];
        
        for (const coord of coordenadas) {
            try {
                const resultado = await this.getPendiente(coord.lat, coord.lng, tipoAnalisis);
                resultados.push({
                    ...resultado,
                    coordenada: coord
                });
            } catch (error) {
                resultados.push({
                    ...this.crearResultadoError(error.message),
                    coordenada: coord
                });
            }
        }
        
        return {
            success: true,
            tipoAnalisis,
            resultados,
            estadisticas: this.generarEstadisticasArea(resultados)
        };
    }
    
    /**
     * Generar estadísticas de área
     */
    generarEstadisticasArea(resultados) {
        const exitosos = resultados.filter(r => r.success && r.pendiente !== null);
        
        if (exitosos.length === 0) {
            return {
                total: resultados.length,
                exitosos: 0,
                pendientePromedio: null,
                pendienteMaxima: null,
                pendienteMinima: null,
                clasificaciones: {}
            };
        }
        
        const pendientes = exitosos.map(r => r.pendiente);
        const clasificaciones = {};
        
        exitosos.forEach(r => {
            const tipo = r.clasificacion.tipo;
            clasificaciones[tipo] = (clasificaciones[tipo] || 0) + 1;
        });
        
        return {
            total: resultados.length,
            exitosos: exitosos.length,
            pendientePromedio: this.redondear(
                pendientes.reduce((sum, p) => sum + p, 0) / pendientes.length, 
                this.config.precision.pendiente
            ),
            pendienteMaxima: this.redondear(Math.max(...pendientes), this.config.precision.pendiente),
            pendienteMinima: this.redondear(Math.min(...pendientes), this.config.precision.pendiente),
            clasificaciones
        };
    }
    
    /**
     * Generar perfil de elevación entre dos puntos
     */
    async generarPerfil(latInicio, lngInicio, latFin, lngFin, numPuntos = 20) {
        const perfil = [];
        
        for (let i = 0; i <= numPuntos; i++) {
            const factor = i / numPuntos;
            const lat = latInicio + (latFin - latInicio) * factor;
            const lng = lngInicio + (lngFin - lngInicio) * factor;
            
            try {
                const pendiente = await this.getPendiente(lat, lng, 'fino');
                const distancia = this.calcularDistancia(latInicio, lngInicio, lat, lng);
                
                perfil.push({
                    punto: i,
                    lat: this.redondear(lat, this.config.precision.coordenadas),
                    lng: this.redondear(lng, this.config.precision.coordenadas),
                    distancia: this.redondear(distancia, 0),
                    elevacion: pendiente.success ? pendiente.elevacionCentro : null,
                    pendiente: pendiente.success ? pendiente.pendiente : null,
                    clasificacion: pendiente.success ? pendiente.clasificacion.tipo : 'error'
                });
                
            } catch (error) {
                perfil.push({
                    punto: i,
                    lat: this.redondear(lat, this.config.precision.coordenadas),
                    lng: this.redondear(lng, this.config.precision.coordenadas),
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            inicio: { lat: latInicio, lng: lngInicio },
            fin: { lat: latFin, lng: lngFin },
            perfil,
            distanciaTotal: this.calcularDistancia(latInicio, lngInicio, latFin, lngFin)
        };
    }
    
    /**
     * Calcular distancia entre dos puntos (metros)
     */
    calcularDistancia(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Radio terrestre en metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

// Crear instancia global
window.pendienteHandler = new PendienteHandler();

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pendienteHandler.initialize();
    });
} else {
    window.pendienteHandler.initialize();
}

console.log('📐 PendienteHandler módulo cargado');
