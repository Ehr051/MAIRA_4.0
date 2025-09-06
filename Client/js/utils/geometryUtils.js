/**
 * @fileoverview Utilidades geométricas
 * @version 1.0.0
 * @description Módulo especializado para cálculos geométricos y manipulación de líneas
 * Extraído de herramientasP.js como parte de la refactorización modular
 */

class GeometryUtils {
    constructor() {
        console.log('✅ GeometryUtils inicializado');
    }

    /**
     * Calcula la distancia entre dos puntos geográficos
     */
    calcularDistancia(punto1, punto2) {
        try {
            // Si son coordenadas simples [lon, lat]
            if (Array.isArray(punto1) && Array.isArray(punto2)) {
                const linea = new ol.geom.LineString([punto1, punto2]);
                return ol.sphere.getLength(linea);
            }
            
            // Si son objetos con lat/lon
            if (punto1.lat !== undefined && punto1.lon !== undefined &&
                punto2.lat !== undefined && punto2.lon !== undefined) {
                return this.calcularDistanciaHaversine(punto1, punto2);
            }
            
            // Si son features de OpenLayers
            if (punto1.getGeometry && punto2.getGeometry) {
                const coord1 = punto1.getGeometry().getCoordinates();
                const coord2 = punto2.getGeometry().getCoordinates();
                const linea = new ol.geom.LineString([coord1, coord2]);
                return ol.sphere.getLength(linea);
            }
            
            console.warn('⚠️ Formato de puntos no reconocido para calcular distancia');
            return 0;
            
        } catch (error) {
            console.error('❌ Error calculando distancia:', error);
            return 0;
        }
    }

    /**
     * Calcula distancia usando fórmula de Haversine
     */
    calcularDistanciaHaversine(punto1, punto2) {
        const R = 6371000; // Radio de la Tierra en metros
        const φ1 = punto1.lat * Math.PI / 180;
        const φ2 = punto2.lat * Math.PI / 180;
        const Δφ = (punto2.lat - punto1.lat) * Math.PI / 180;
        const Δλ = (punto2.lon - punto1.lon) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * Crea una línea entre dos puntos
     */
    crearLinea(puntoInicio, puntoFin, propiedades = {}) {
        try {
            const coordenadas = [puntoInicio, puntoFin];
            const geometria = new ol.geom.LineString(coordenadas);
            
            const feature = new ol.Feature({
                geometry: geometria,
                ...propiedades
            });
            
            // Estilo por defecto
            feature.setStyle(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: propiedades.color || '#3388ff',
                    width: propiedades.width || 2
                })
            }));
            
            return feature;
            
        } catch (error) {
            console.error('❌ Error creando línea:', error);
            return null;
        }
    }

    /**
     * Actualiza una línea existente
     */
    actualizarLinea(lineaFeature, nuevasCoordenadas) {
        try {
            if (!lineaFeature) {
                console.warn('⚠️ Feature de línea no proporcionado');
                return false;
            }
            
            const geometria = new ol.geom.LineString(nuevasCoordenadas);
            lineaFeature.setGeometry(geometria);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error actualizando línea:', error);
            return false;
        }
    }

    /**
     * Calcula el centro de un conjunto de puntos
     */
    calcularCentroide(puntos) {
        try {
            if (!puntos || puntos.length === 0) {
                return null;
            }
            
            let sumaX = 0;
            let sumaY = 0;
            
            puntos.forEach(punto => {
                if (Array.isArray(punto)) {
                    sumaX += punto[0];
                    sumaY += punto[1];
                } else if (punto.lat !== undefined && punto.lon !== undefined) {
                    sumaX += punto.lon;
                    sumaY += punto.lat;
                }
            });
            
            return [sumaX / puntos.length, sumaY / puntos.length];
            
        } catch (error) {
            console.error('❌ Error calculando centroide:', error);
            return null;
        }
    }

    /**
     * Calcula el área de un polígono
     */
    calcularArea(coordenadas) {
        try {
            const geometria = new ol.geom.Polygon([coordenadas]);
            return ol.sphere.getArea(geometria);
            
        } catch (error) {
            console.error('❌ Error calculando área:', error);
            return 0;
        }
    }

    /**
     * Calcula el perímetro de un polígono
     */
    calcularPerimetro(coordenadas) {
        try {
            const geometria = new ol.geom.Polygon([coordenadas]);
            return ol.sphere.getLength(geometria);
            
        } catch (error) {
            console.error('❌ Error calculando perímetro:', error);
            return 0;
        }
    }

    /**
     * Simplifica una línea reduciendo puntos
     */
    simplificarLinea(coordenadas, tolerancia = 0.0001) {
        try {
            const geometria = new ol.geom.LineString(coordenadas);
            const geometriaSimplificada = geometria.simplify(tolerancia);
            return geometriaSimplificada.getCoordinates();
            
        } catch (error) {
            console.error('❌ Error simplificando línea:', error);
            return coordenadas;
        }
    }

    /**
     * Interpola puntos a lo largo de una línea
     */
    interpolarPuntosEnLinea(coordenadas, numeroSegmentos = 10) {
        try {
            if (!coordenadas || coordenadas.length < 2) {
                return coordenadas;
            }
            
            const puntosInterpolados = [];
            
            for (let i = 0; i < coordenadas.length - 1; i++) {
                const inicio = coordenadas[i];
                const fin = coordenadas[i + 1];
                
                // Agregar punto de inicio
                puntosInterpolados.push(inicio);
                
                // Interpolar puntos intermedios
                for (let j = 1; j < numeroSegmentos; j++) {
                    const factor = j / numeroSegmentos;
                    const x = inicio[0] + (fin[0] - inicio[0]) * factor;
                    const y = inicio[1] + (fin[1] - inicio[1]) * factor;
                    puntosInterpolados.push([x, y]);
                }
            }
            
            // Agregar último punto
            puntosInterpolados.push(coordenadas[coordenadas.length - 1]);
            
            return puntosInterpolados;
            
        } catch (error) {
            console.error('❌ Error interpolando puntos:', error);
            return coordenadas;
        }
    }

    /**
     * Encuentra el punto más cercano en una línea
     */
    encontrarPuntoMasCercano(coordenadaObjetivo, coordenadasLinea) {
        try {
            let distanciaMinima = Infinity;
            let puntoMasCercano = null;
            let indiceSegmento = -1;
            
            for (let i = 0; i < coordenadasLinea.length - 1; i++) {
                const segmentoInicio = coordenadasLinea[i];
                const segmentoFin = coordenadasLinea[i + 1];
                
                const puntoEnSegmento = this.proyectarPuntoEnSegmento(
                    coordenadaObjetivo, 
                    segmentoInicio, 
                    segmentoFin
                );
                
                const distancia = this.calcularDistancia(coordenadaObjetivo, puntoEnSegmento);
                
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    puntoMasCercano = puntoEnSegmento;
                    indiceSegmento = i;
                }
            }
            
            return {
                punto: puntoMasCercano,
                distancia: distanciaMinima,
                indiceSegmento: indiceSegmento
            };
            
        } catch (error) {
            console.error('❌ Error encontrando punto más cercano:', error);
            return null;
        }
    }

    /**
     * Proyecta un punto sobre un segmento de línea
     */
    proyectarPuntoEnSegmento(punto, segmentoInicio, segmentoFin) {
        const dx = segmentoFin[0] - segmentoInicio[0];
        const dy = segmentoFin[1] - segmentoInicio[1];
        
        if (dx === 0 && dy === 0) {
            return segmentoInicio;
        }
        
        const t = ((punto[0] - segmentoInicio[0]) * dx + (punto[1] - segmentoInicio[1]) * dy) / (dx * dx + dy * dy);
        
        if (t < 0) {
            return segmentoInicio;
        } else if (t > 1) {
            return segmentoFin;
        } else {
            return [
                segmentoInicio[0] + t * dx,
                segmentoInicio[1] + t * dy
            ];
        }
    }

    /**
     * Calcula el bearing (rumbo) entre dos puntos
     */
    calcularBearing(punto1, punto2) {
        try {
            const lat1 = punto1[1] * Math.PI / 180;
            const lat2 = punto2[1] * Math.PI / 180;
            const deltaLon = (punto2[0] - punto1[0]) * Math.PI / 180;
            
            const y = Math.sin(deltaLon) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
            
            const bearing = Math.atan2(y, x) * 180 / Math.PI;
            
            return (bearing + 360) % 360; // Normalizar a 0-360
            
        } catch (error) {
            console.error('❌ Error calculando bearing:', error);
            return 0;
        }
    }

    /**
     * Convierte coordenadas entre sistemas de referencia
     */
    convertirCoordenadas(coordenadas, proyeccionOrigen, proyeccionDestino) {
        try {
            return ol.proj.transform(coordenadas, proyeccionOrigen, proyeccionDestino);
            
        } catch (error) {
            console.error('❌ Error convirtiendo coordenadas:', error);
            return coordenadas;
        }
    }

    /**
     * Formatea coordenadas para mostrar
     */
    formatearCoordenadas(coordenadas, formato = 'decimal') {
        try {
            const [lon, lat] = coordenadas;
            
            switch (formato) {
                case 'dms': // Grados, minutos, segundos
                    return this.convertirADMS(lat, lon);
                case 'utm':
                    return this.convertirAUTM(lat, lon);
                default: // decimal
                    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
            }
            
        } catch (error) {
            console.error('❌ Error formateando coordenadas:', error);
            return 'Coordenadas inválidas';
        }
    }

    /**
     * Convierte coordenadas decimales a DMS
     */
    convertirADMS(lat, lon) {
        const convertirGrado = (decimal) => {
            const abs = Math.abs(decimal);
            const grados = Math.floor(abs);
            const minutos = Math.floor((abs - grados) * 60);
            const segundos = ((abs - grados) * 60 - minutos) * 60;
            return { grados, minutos, segundos: segundos.toFixed(2) };
        };
        
        const latDMS = convertirGrado(lat);
        const lonDMS = convertirGrado(lon);
        
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        
        return `${latDMS.grados}°${latDMS.minutos}'${latDMS.segundos}"${latDir}, ${lonDMS.grados}°${lonDMS.minutos}'${lonDMS.segundos}"${lonDir}`;
    }

    /**
     * Convierte coordenadas a UTM (simplificado)
     */
    convertirAUTM(lat, lon) {
        // Esta es una implementación simplificada
        // Para mayor precisión, usar proj4 o similar
        try {
            const utmCoords = ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
            return `UTM: ${utmCoords[0].toFixed(0)}, ${utmCoords[1].toFixed(0)}`;
        } catch (error) {
            return 'UTM: No disponible';
        }
    }
}

// Crear instancia global
window.geometryUtils = new GeometryUtils();

// Exportar funciones al scope global para compatibilidad
window.calcularDistancia = (punto1, punto2) => window.geometryUtils.calcularDistancia(punto1, punto2);
window.crearLinea = (inicio, fin, props) => window.geometryUtils.crearLinea(inicio, fin, props);
window.actualizarLinea = (linea, coords) => window.geometryUtils.actualizarLinea(linea, coords);

console.log('✅ GeometryUtils cargado y funciones exportadas al scope global');
