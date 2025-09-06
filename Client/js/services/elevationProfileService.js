/**
 * @fileoverview Servicio de perfiles de elevación
 * @version 1.0.0
 * @description Módulo especializado para procesamiento y visualización de perfiles de elevación
 * Extraído de herramientasP.js como parte de la refactorización modular
 */

class ElevationProfileService {
    constructor() {
        this.datosElevacion = [];
        this.graficoActivo = null;
        this.contenedorGrafico = null;
        
        console.log('✅ ElevationProfileService inicializado');
    }

    /**
     * Muestra el gráfico de perfil de elevación
     */
    async mostrarGraficoPerfil(puntos, distanciaTotal) {
        try {
            console.log('📊 Iniciando generación de perfil de elevación...');
            
            // Procesar datos de elevación
            const datosElevacion = await this.procesarElevacionSinWorker(puntos);
            
            if (!datosElevacion || datosElevacion.length === 0) {
                console.warn('⚠️ No se pudieron obtener datos de elevación');
                return;
            }
            
            // Crear el gráfico
            this.dibujarGraficoPerfil(datosElevacion, distanciaTotal);
            
        } catch (error) {
            console.error('❌ Error al mostrar perfil de elevación:', error);
        }
    }

    /**
     * Procesa los datos de elevación sin web worker
     */
    async procesarElevacionSinWorker(puntos) {
        try {
            console.log('🔄 Procesando elevación sin worker...');
            
            if (!puntos || puntos.length === 0) {
                throw new Error('No hay puntos para procesar');
            }
            
            // Interpolar puntos si es necesario
            const puntosInterpolados = this.interpolarpuntos(puntos, 100);
            
            // Obtener elevaciones
            const datosElevacion = [];
            let distanciaAcumulada = 0;
            
            for (let i = 0; i < puntosInterpolados.length; i++) {
                const punto = puntosInterpolados[i];
                
                // Calcular distancia acumulada
                if (i > 0) {
                    const distanciaSegmento = this.calcularDistancia(
                        puntosInterpolados[i-1],
                        punto
                    );
                    distanciaAcumulada += distanciaSegmento;
                }
                
                // Obtener elevación
                const elevacion = await this.obtenerElevacion(punto.lat, punto.lon);
                
                datosElevacion.push({
                    lat: punto.lat,
                    lon: punto.lon,
                    elevacion: elevacion || 0,
                    distancia: distanciaAcumulada / 1000 // Convertir a km
                });
            }
            
            this.datosElevacion = datosElevacion;
            console.log(`✅ Procesados ${datosElevacion.length} puntos de elevación`);
            
            return datosElevacion;
            
        } catch (error) {
            console.error('❌ Error procesando elevación:', error);
            return [];
        }
    }

    /**
     * Interpola puntos entre los dados
     */
    interpolarpuntos(puntos, numeroSegmentos = 100) {
        if (!puntos || puntos.length < 2) return puntos;
        
        const puntosInterpolados = [];
        
        for (let i = 0; i < puntos.length - 1; i++) {
            const puntoInicio = puntos[i];
            const puntoFin = puntos[i + 1];
            
            // Agregar punto de inicio
            puntosInterpolados.push(puntoInicio);
            
            // Interpolar entre puntos
            const segmentos = Math.floor(numeroSegmentos / (puntos.length - 1));
            
            for (let j = 1; j < segmentos; j++) {
                const factor = j / segmentos;
                
                const lat = puntoInicio.lat + (puntoFin.lat - puntoInicio.lat) * factor;
                const lon = puntoInicio.lon + (puntoFin.lon - puntoInicio.lon) * factor;
                
                puntosInterpolados.push({ lat, lon });
            }
        }
        
        // Agregar último punto
        puntosInterpolados.push(puntos[puntos.length - 1]);
        
        return puntosInterpolados;
    }

    /**
     * Obtiene la elevación de un punto
     */
    async obtenerElevacion(lat, lon) {
        try {
            // Usar el servicio de elevación configurado
            if (window.elevationHandler && window.elevationHandler.obtenerElevacion) {
                return await window.elevationHandler.obtenerElevacion(lat, lon);
            }
            
            // Fallback a servicio externo si está disponible
            const response = await fetch(
                `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
            );
            
            if (response.ok) {
                const data = await response.json();
                return data.results[0]?.elevation || 0;
            }
            
            return 0;
            
        } catch (error) {
            console.warn('⚠️ Error obteniendo elevación:', error);
            return 0;
        }
    }

    /**
     * Dibuja el gráfico de perfil usando D3.js
     */
    dibujarGraficoPerfil(datos, distanciaTotal) {
        try {
            console.log('🎨 Dibujando gráfico de perfil...');
            
            // Crear o limpiar contenedor
            this.crearContenedorGrafico();
            
            // Configuración del gráfico
            const margin = { top: 20, right: 30, bottom: 50, left: 60 };
            const width = 800 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;
            
            // Limpiar contenido anterior
            d3.select('#perfil-elevacion-chart').selectAll('*').remove();
            
            // Crear SVG
            const svg = d3.select('#perfil-elevacion-chart')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom);
                
            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
            
            // Escalas
            const xScale = d3.scaleLinear()
                .domain(d3.extent(datos, d => d.distancia))
                .range([0, width]);
                
            const yScale = d3.scaleLinear()
                .domain(d3.extent(datos, d => d.elevacion))
                .range([height, 0]);
            
            // Línea del perfil
            const line = d3.line()
                .x(d => xScale(d.distancia))
                .y(d => yScale(d.elevacion))
                .curve(d3.curveMonotoneX);
            
            // Área bajo la curva
            const area = d3.area()
                .x(d => xScale(d.distancia))
                .y0(height)
                .y1(d => yScale(d.elevacion))
                .curve(d3.curveMonotoneX);
            
            // Dibujar área
            g.append('path')
                .datum(datos)
                .attr('fill', 'rgba(70, 130, 180, 0.3)')
                .attr('d', area);
            
            // Dibujar línea
            g.append('path')
                .datum(datos)
                .attr('fill', 'none')
                .attr('stroke', '#4682b4')
                .attr('stroke-width', 2)
                .attr('d', line);
            
            // Ejes
            g.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(xScale))
                .append('text')
                .attr('x', width / 2)
                .attr('y', 40)
                .attr('fill', 'black')
                .style('text-anchor', 'middle')
                .text('Distancia (km)');
            
            g.append('g')
                .call(d3.axisLeft(yScale))
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', -40)
                .attr('x', -height / 2)
                .attr('fill', 'black')
                .style('text-anchor', 'middle')
                .text('Elevación (m)');
            
            // Título
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('font-weight', 'bold')
                .text('Perfil de Elevación');
            
            // Agregar interactividad
            this.agregarInteractividadCompleta(g, datos, xScale, yScale, width, height);
            
            // Mostrar estadísticas
            this.mostrarEstadisticas(datos, distanciaTotal);
            
            console.log('✅ Gráfico de perfil dibujado correctamente');
            
        } catch (error) {
            console.error('❌ Error dibujando gráfico:', error);
        }
    }

    /**
     * Crea el contenedor del gráfico
     */
    crearContenedorGrafico() {
        // Buscar contenedor existente
        let contenedor = document.getElementById('perfil-elevacion-container');
        
        if (!contenedor) {
            // Crear contenedor
            contenedor = document.createElement('div');
            contenedor.id = 'perfil-elevacion-container';
            contenedor.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: white;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 20px;
                z-index: 1000;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                max-width: 850px;
                max-height: 500px;
                overflow: auto;
            `;
            
            // Crear header con botón cerrar
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            `;
            
            const titulo = document.createElement('h3');
            titulo.textContent = 'Perfil de Elevación';
            titulo.style.margin = '0';
            
            const btnCerrar = document.createElement('button');
            btnCerrar.textContent = '×';
            btnCerrar.style.cssText = `
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
            `;
            
            btnCerrar.onclick = () => this.cerrarGrafico();
            
            header.appendChild(titulo);
            header.appendChild(btnCerrar);
            contenedor.appendChild(header);
            
            // Crear área del gráfico
            const chartArea = document.createElement('div');
            chartArea.id = 'perfil-elevacion-chart';
            contenedor.appendChild(chartArea);
            
            // Crear área de estadísticas
            const statsArea = document.createElement('div');
            statsArea.id = 'perfil-elevacion-stats';
            statsArea.style.cssText = `
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #eee;
                font-size: 14px;
            `;
            contenedor.appendChild(statsArea);
            
            document.body.appendChild(contenedor);
        }
        
        this.contenedorGrafico = contenedor;
    }

    /**
     * Agrega interactividad al gráfico
     */
    agregarInteractividadCompleta(g, datos, xScale, yScale, width, height) {
        // Crear línea vertical para seguimiento
        const verticalGuide = g.append('line')
            .attr('class', 'vertical-guide')
            .attr('y1', 0)
            .attr('y2', height)
            .style('stroke', 'red')
            .style('stroke-width', 1)
            .style('opacity', 0);

        // Crear tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'elevation-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('display', 'none');

        // Área invisible para capturar eventos del mouse
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mousemove', function(event) {
                const [mouseX] = d3.pointer(event);
                const distancia = xScale.invert(mouseX);
                
                // Encontrar punto más cercano
                const bisect = d3.bisector(d => d.distancia).left;
                const index = bisect(datos, distancia, 1);
                const a = datos[index - 1];
                const b = datos[index];
                
                if (!a && !b) return;
                
                const punto = !b || (a && distancia - a.distancia < b.distancia - distancia) ? a : b;
                
                if (punto) {
                    // Actualizar línea vertical
                    verticalGuide
                        .attr('x1', xScale(punto.distancia))
                        .attr('x2', xScale(punto.distancia))
                        .style('opacity', 1);
                    
                    // Actualizar tooltip
                    tooltip
                        .style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(`
                            <strong>Distancia:</strong> ${punto.distancia.toFixed(2)} km<br>
                            <strong>Elevación:</strong> ${punto.elevacion.toFixed(0)} m<br>
                            <strong>Coordenadas:</strong> ${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}
                        `);
                }
            })
            .on('mouseleave', function() {
                verticalGuide.style('opacity', 0);
                tooltip.style('display', 'none');
            });
    }

    /**
     * Muestra estadísticas del perfil
     */
    mostrarEstadisticas(datos, distanciaTotal) {
        const elevaciones = datos.map(d => d.elevacion);
        const elevacionMin = Math.min(...elevaciones);
        const elevacionMax = Math.max(...elevaciones);
        const desnivel = elevacionMax - elevacionMin;
        
        const statsContainer = document.getElementById('perfil-elevacion-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Distancia Total:</strong><br>
                        ${(distanciaTotal / 1000).toFixed(2)} km
                    </div>
                    <div>
                        <strong>Elevación Mínima:</strong><br>
                        ${elevacionMin.toFixed(0)} m
                    </div>
                    <div>
                        <strong>Elevación Máxima:</strong><br>
                        ${elevacionMax.toFixed(0)} m
                    </div>
                    <div>
                        <strong>Desnivel Total:</strong><br>
                        ${desnivel.toFixed(0)} m
                    </div>
                </div>
            `;
        }
    }

    /**
     * Cierra el gráfico
     */
    cerrarGrafico() {
        if (this.contenedorGrafico) {
            this.contenedorGrafico.remove();
            this.contenedorGrafico = null;
        }
        
        // Limpiar tooltips
        d3.selectAll('.elevation-tooltip').remove();
    }

    /**
     * Calcula la distancia entre dos puntos
     */
    calcularDistancia(punto1, punto2) {
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
}

// Crear instancia global
window.elevationProfileService = new ElevationProfileService();

// Exportar funciones al scope global para compatibilidad
window.mostrarGraficoPerfil = (puntos, distanciaTotal) => 
    window.elevationProfileService.mostrarGraficoPerfil(puntos, distanciaTotal);
window.dibujarGraficoPerfil = (datos, distanciaTotal) => 
    window.elevationProfileService.dibujarGraficoPerfil(datos, distanciaTotal);
window.procesarElevacionSinWorker = (puntos) => 
    window.elevationProfileService.procesarElevacionSinWorker(puntos);
window.interpolarpuntos = (puntos, segmentos) => 
    window.elevationProfileService.interpolarpuntos(puntos, segmentos);
window.agregarInteractividadCompleta = (g, datos, xScale, yScale, width, height) => 
    window.elevationProfileService.agregarInteractividadCompleta(g, datos, xScale, yScale, width, height);

console.log('✅ ElevationProfileService cargado y funciones exportadas al scope global');
