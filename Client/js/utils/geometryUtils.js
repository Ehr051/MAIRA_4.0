/**
 * @fileoverview Utilidades geométricas - VERSIÓN LEAFLET
 * @version 2.0.0
 * @description Módulo especializado para cálculos geométricos y manipulación de líneas con Leaflet
 * Convertido de OpenLayers a Leaflet para compatibilidad con el sistema original
 */

class GeometryUtils {
    constructor() {
        console.log('✅ GeometryUtils inicializado con Leaflet');
    }

    /**
     * Calcula la distancia entre dos puntos geográficos usando Leaflet
     */
    calcularDistancia(punto1, punto2) {
        try {
            // Si es una polyline de Leaflet, usar su función de distancia
            if (punto1 instanceof L.Polyline) {
                const coords = punto1.getLatLngs();
                let distanciaTotal = 0;
                for (let i = 1; i < coords.length; i++) {
                    distanciaTotal += L.latLng(coords[i-1]).distanceTo(L.latLng(coords[i]));
                }
                return distanciaTotal;
            }
            
            // Si son coordenadas simples [lat, lon] o [lon, lat]
            if (Array.isArray(punto1) && Array.isArray(punto2)) {
                // Asumir formato [lat, lon] para Leaflet
                const latlng1 = L.latLng(punto1[0], punto1[1]);
                const latlng2 = L.latLng(punto2[0], punto2[1]);
                return latlng1.distanceTo(latlng2);
            }
            
            // Si son objetos con lat/lon
            if (punto1.lat !== undefined && punto1.lng !== undefined &&
                punto2.lat !== undefined && punto2.lng !== undefined) {
                return L.latLng(punto1).distanceTo(L.latLng(punto2));
            }
            
            // Si son objetos con lat/lon (lon alternativo)
            if (punto1.lat !== undefined && punto1.lon !== undefined &&
                punto2.lat !== undefined && punto2.lon !== undefined) {
                return this.calcularDistanciaHaversine(punto1, punto2);
            }
            
            // Si son LatLng de Leaflet
            if (punto1.lat !== undefined && punto1.lng !== undefined &&
                punto2.lat !== undefined && punto2.lng !== undefined) {
                return punto1.distanceTo(punto2);
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
     * Crea una línea entre dos puntos usando Leaflet
     */
    crearLinea(puntoInicio, puntoFin, propiedades = {}) {
        try {
            // Convertir puntos a formato LatLng de Leaflet
            let latLng1, latLng2;
            
            if (Array.isArray(puntoInicio)) {
                latLng1 = L.latLng(puntoInicio[0], puntoInicio[1]);
            } else {
                latLng1 = L.latLng(puntoInicio);
            }
            
            if (Array.isArray(puntoFin)) {
                latLng2 = L.latLng(puntoFin[0], puntoFin[1]);
            } else {
                latLng2 = L.latLng(puntoFin);
            }
            
            const coordenadas = [latLng1, latLng2];
            
            // Crear polyline de Leaflet
            const linea = L.polyline(coordenadas, {
                color: propiedades.color || '#3388ff',
                weight: propiedades.width || 2,
                opacity: propiedades.opacity || 1,
                ...propiedades
            });
            
            return linea;
            
        } catch (error) {
            console.error('❌ Error creando línea:', error);
            return null;
        }
    }

    /**
     * Actualiza una línea existente de Leaflet
     */
    actualizarLinea(lineaLeaflet, nuevasCoordenadas) {
        try {
            if (!lineaLeaflet || !lineaLeaflet.setLatLngs) {
                console.warn('⚠️ Polyline de Leaflet no proporcionado');
                return false;
            }
            
            // Convertir coordenadas a LatLng si es necesario
            const latLngs = nuevasCoordenadas.map(coord => {
                if (Array.isArray(coord)) {
                    return L.latLng(coord[0], coord[1]);
                }
                return L.latLng(coord);
            });
            
            lineaLeaflet.setLatLngs(latLngs);
            
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
     * Calcula el área de un polígono usando Leaflet
     */
    calcularArea(coordenadas) {
        try {
            // Convertir a LatLng si es necesario
            const latLngs = coordenadas.map(coord => {
                if (Array.isArray(coord)) {
                    return L.latLng(coord[0], coord[1]);
                }
                return L.latLng(coord);
            });
            
            // Usar algoritmo de Shoelace para calcular área en metros cuadrados
            return this.calcularAreaShoelace(latLngs);
            
        } catch (error) {
            console.error('❌ Error calculando área:', error);
            return 0;
        }
    }

    /**
     * Calcula el perímetro de un polígono usando Leaflet
     */
    calcularPerimetro(coordenadas) {
        try {
            let perimetro = 0;
            
            for (let i = 0; i < coordenadas.length - 1; i++) {
                const punto1 = Array.isArray(coordenadas[i]) ? 
                    L.latLng(coordenadas[i][0], coordenadas[i][1]) : 
                    L.latLng(coordenadas[i]);
                const punto2 = Array.isArray(coordenadas[i + 1]) ? 
                    L.latLng(coordenadas[i + 1][0], coordenadas[i + 1][1]) : 
                    L.latLng(coordenadas[i + 1]);
                
                perimetro += punto1.distanceTo(punto2);
            }
            
            // Cerrar el polígono si no está cerrado
            if (coordenadas.length > 2) {
                const primero = Array.isArray(coordenadas[0]) ? 
                    L.latLng(coordenadas[0][0], coordenadas[0][1]) : 
                    L.latLng(coordenadas[0]);
                const ultimo = Array.isArray(coordenadas[coordenadas.length - 1]) ? 
                    L.latLng(coordenadas[coordenadas.length - 1][0], coordenadas[coordenadas.length - 1][1]) : 
                    L.latLng(coordenadas[coordenadas.length - 1]);
                
                perimetro += ultimo.distanceTo(primero);
            }
            
            return perimetro;
            
        } catch (error) {
            console.error('❌ Error calculando perímetro:', error);
            return 0;
        }
    }

    /**
     * Calcula área usando algoritmo Shoelace para coordenadas geográficas
     */
    calcularAreaShoelace(latLngs) {
        if (latLngs.length < 3) return 0;
        
        const R = 6371000; // Radio de la Tierra en metros
        let area = 0;
        
        for (let i = 0; i < latLngs.length; i++) {
            const j = (i + 1) % latLngs.length;
            const lat1 = latLngs[i].lat * Math.PI / 180;
            const lat2 = latLngs[j].lat * Math.PI / 180;
            const lng1 = latLngs[i].lng * Math.PI / 180;
            const lng2 = latLngs[j].lng * Math.PI / 180;
            
            area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
        }
        
        area = Math.abs(area) * R * R / 2;
        return area;
    }

    /**
     * Simplifica una línea reduciendo puntos (implementación básica)
     */
    simplificarLinea(coordenadas, tolerancia = 0.0001) {
        try {
            // Implementación básica de simplificación Douglas-Peucker
            if (coordenadas.length <= 2) return coordenadas;
            
            return this.douglasPeucker(coordenadas, tolerancia);
            
        } catch (error) {
            console.error('❌ Error simplificando línea:', error);
            return coordenadas;
        }
    }

    /**
     * Algoritmo Douglas-Peucker para simplificación de líneas
     */
    douglasPeucker(puntos, tolerancia) {
        if (puntos.length <= 2) return puntos;
        
        // Encontrar el punto con mayor distancia a la línea formada por el primer y último punto
        let distanciaMaxima = 0;
        let indiceMaximo = 0;
        
        for (let i = 1; i < puntos.length - 1; i++) {
            const distancia = this.distanciaPuntoALinea(puntos[i], puntos[0], puntos[puntos.length - 1]);
            if (distancia > distanciaMaxima) {
                distanciaMaxima = distancia;
                indiceMaximo = i;
            }
        }
        
        // Si la distancia máxima es mayor que la tolerancia, dividir recursivamente
        if (distanciaMaxima > tolerancia) {
            const resultados1 = this.douglasPeucker(puntos.slice(0, indiceMaximo + 1), tolerancia);
            const resultados2 = this.douglasPeucker(puntos.slice(indiceMaximo), tolerancia);
            
            return resultados1.slice(0, -1).concat(resultados2);
        } else {
            return [puntos[0], puntos[puntos.length - 1]];
        }
    }

    /**
     * Calcula la distancia de un punto a una línea
     */
    distanciaPuntoALinea(punto, lineaInicio, lineaFin) {
        const A = lineaFin[1] - lineaInicio[1];
        const B = lineaInicio[0] - lineaFin[0];
        const C = lineaFin[0] * lineaInicio[1] - lineaInicio[0] * lineaFin[1];
        
        return Math.abs(A * punto[0] + B * punto[1] + C) / Math.sqrt(A * A + B * B);
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
     * Convierte coordenadas entre sistemas de referencia (simplificado para Leaflet)
     */
    convertirCoordenadas(coordenadas, proyeccionOrigen, proyeccionDestino) {
        try {
            // Para Leaflet, la mayoría de conversiones son transparentes
            // Esta función se mantiene para compatibilidad
            console.warn('⚠️ Conversión de coordenadas: Leaflet maneja esto automáticamente en la mayoría de casos');
            return coordenadas;
            
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
     * Convierte coordenadas a UTM (simplificado sin OpenLayers)
     */
    convertirAUTM(lat, lon) {
        // Implementación simplificada sin OpenLayers
        // Para mayor precisión, se puede integrar con proj4js en el futuro
        try {
            // Calcular zona UTM
            const zona = Math.floor((lon + 180) / 6) + 1;
            const hemisferio = lat >= 0 ? 'N' : 'S';
            
            return `UTM ${zona}${hemisferio}: Requiere proj4js para conversión exacta`;
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

console.log('✅ GeometryUtils con Leaflet cargado y funciones exportadas al scope global');
