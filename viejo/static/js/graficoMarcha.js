// GraficoMarchaController.js
function GraficoMarchaController() {
    this.config = {
        margin: { 
            top: 40, 
            right: 150,
            bottom: 70, // Aumentado para las etiquetas rotadas
            left: 70    
        },
        colors: [
            '#2196F3', // Azul
            '#4CAF50', // Verde
            '#F44336', // Rojo
            '#FFC107', // Ámbar
            '#9C27B0'  // Púrpura
        ],
        altura: 600,
        opacidadSerie: 0.3,
        opacidadColumna: 0.7,
        anchoLinea: 2,
        gridColor: '#ddd',
        gridOpacity: 0.3,
        fineGridColor: '#eee',
        fineGridOpacity: 0.2,
        altoColor: '#ff4444',
        leyendaAncho: 120
    };

    this.state = {
        svg: null,
        width: 0,
        height: 0,
        scales: {},
        data: null,
        horaH: null,
        layers: {}
    };
}

GraficoMarchaController.prototype.inicializar = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Contenedor no encontrado:', containerId);
        return;
    }
    
    // Obtener el display-content en lugar de usar el container directamente
    const displayContent = container.querySelector('.display-content');
    if (!displayContent) {
        console.error('Display content no encontrado');
        return;
    }
    
    displayContent.innerHTML = '';

    this.state.width = displayContent.clientWidth - this.config.margin.left - this.config.margin.right;
    this.state.height = displayContent.clientHeight - this.config.margin.top - this.config.margin.bottom;

    this.state.svg = d3.select(displayContent)
        .append('svg')
        .attr('width', this.state.width + this.config.margin.left + this.config.margin.right)
        .attr('height', this.state.height + this.config.margin.top + this.config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

        ['grid', 'series', 'columnas', 'altos', 'puntosControl', 'ejes', 'leyenda', 'tooltip', 'overlay']
        .forEach(layer => {
            this.state.layers[layer] = this.state.svg.append('g')
                .attr('class', `${layer}-layer`);
        });

    this.agregarTooltipMouse();

    const resizeObserver = new ResizeObserver(() => {
        if (this.state.data) {
            this.handleResize();
        }
    });
    
    // Verificar dependencias necesarias
    this.dependencias = this.verificarDependencias();
    
    if (this.dependencias.milsymbol) {
        console.log('✅ milsymbol.js detectado - Símbolos PI/PT militares disponibles');
    }
    
    resizeObserver.observe(displayContent);
};

// Agregar método verificarDependencias
GraficoMarchaController.prototype.verificarDependencias = function() {
    return {
        milsymbol: typeof window.ms !== 'undefined',
        d3: typeof window.d3 !== 'undefined',
        leaflet: typeof window.L !== 'undefined'
    };
};

GraficoMarchaController.prototype.dibujarGrafico = function() {
    if (!this.state.data) {
        console.error('No hay datos para dibujar');
        return;
    }

    this.limpiarGrafico();
    this.dibujarGrid();
    this.dibujarSeries();
    this.dibujarColumnas();
    this.dibujarPuntosControl();
    this.dibujarEjes();
    this.dibujarLeyenda();
};

GraficoMarchaController.prototype.limpiarGrafico = function() {
    Object.values(this.state.layers).forEach(layer => layer.selectAll('*').remove());
};

GraficoMarchaController.prototype.dibujarGrid = function() {
    const gridLayer = this.state.layers.grid;

    // Grid vertical (tiempo) - cada 15 minutos
    const minutosTotal = this.state.data.tiempoTotal;
    const intervaloTicks = minutosTotal > 120 ? 30 : 15;

    const xGrid = d3.axisBottom(this.state.scales.x)
        .ticks(d3.timeMinute.every(intervaloTicks))
        .tickSize(-this.state.height)
        .tickFormat('');

    gridLayer.append('g')
        .attr('class', 'grid x-grid')
        .attr('transform', `translate(0,${this.state.height})`)
        .call(xGrid)
        .style('stroke', this.config.gridColor)
        .style('stroke-opacity', this.config.gridOpacity);

    // Grid horizontal (distancia) - cada kilómetro
    const yGrid = d3.axisLeft(this.state.scales.y)
        .ticks(Math.floor(this.state.data.distanciaTotal / 1000))
        .tickSize(-this.state.width)
        .tickFormat('');

    gridLayer.append('g')
        .attr('class', 'grid y-grid')
        .call(yGrid)
        .style('stroke', this.config.gridColor)
        .style('stroke-opacity', this.config.gridOpacity);

    // Grid fino (milimetrado) opcional
    if (this.state.width <= 1000) { // Solo para gráficos no muy anchos
        const fineGrid = gridLayer.append('g')
            .attr('class', 'fine-grid');

        // Líneas cada 5 minutos
        const minutosTotales = Math.ceil(this.state.data.tiempoTotal);
        for (let minuto = 0; minuto <= minutosTotales; minuto += 5) {
            const tiempo = new Date(this.state.horaH.getTime() + minuto * 60000);
            fineGrid.append('line')
                .attr('x1', this.state.scales.x(tiempo))
                .attr('x2', this.state.scales.x(tiempo))
                .attr('y1', 0)
                .attr('y2', this.state.height)
                .style('stroke', this.config.fineGridColor)
                .style('stroke-opacity', this.config.fineGridOpacity);
        }

        // Líneas cada 0.5 km
        const distanciaMaxKm = this.state.data.distanciaTotal / 1000;
        for (let km = 0; km <= distanciaMaxKm; km += 0.5) {
            fineGrid.append('line')
                .attr('x1', 0)
                .attr('x2', this.state.width)
                .attr('y1', this.state.scales.y(km))
                .attr('y2', this.state.scales.y(km))
                .style('stroke', this.config.fineGridColor)
                .style('stroke-opacity', this.config.fineGridOpacity);
        }
    }
};


// Agregar al GraficoMarchaController.prototype
GraficoMarchaController.prototype.handleResize = function() {
    const container = document.getElementById('graficoMarchaPanel');
    const content = container.querySelector('.display-content');
    
    // Actualizar dimensiones
    this.state.width = content.clientWidth - this.config.margin.left - this.config.margin.right;
    this.state.height = content.clientHeight - this.config.margin.top - this.config.margin.bottom;

    // Actualizar el SVG principal
    const svg = this.state.svg.node().parentNode;
    d3.select(svg)
        .attr('width', this.state.width + this.config.margin.left + this.config.margin.right)
        .attr('height', this.state.height + this.config.margin.top + this.config.margin.bottom);

    // Actualizar escalas
    this.state.scales.x = d3.scaleTime()
        .domain([this.state.horaH, new Date(this.state.horaH.getTime() + this.state.data.tiempoTotal * 60000)])
        .range([0, this.state.width]);

    this.state.scales.y = d3.scaleLinear()
        .domain([0, this.state.data.distanciaTotal / 1000])
        .range([this.state.height, 0]);

    // Redibujar el gráfico completo
    this.dibujarGrafico();
};




GraficoMarchaController.prototype.dibujarEjes = function() {
    const ejesLayer = this.state.layers.ejes;

    // Eje X (tiempo) - ajustar intervalo según duración total
    const minutosTotal = this.state.data.tiempoTotal;
    const intervaloTicks = minutosTotal > 120 ? 30 : 15;

    const xAxis = d3.axisBottom(this.state.scales.x)
        .ticks(d3.timeMinute.every(intervaloTicks))
        .tickFormat(d3.timeFormat('%H:%M'));

    const xAxisG = ejesLayer.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${this.state.height})`)
        .call(xAxis);

    // Rotar etiquetas del eje X
    xAxisG.selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    // Eje Y (distancia)
    const yAxis = d3.axisLeft(this.state.scales.y)
        .tickFormat(d => `${d} km`);

    ejesLayer.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Etiquetas de los ejes
    ejesLayer.append('text')
        .attr('class', 'x-label')
        .attr('x', this.state.width / 2)
        .attr('y', this.state.height + 45)
        .style('text-anchor', 'middle')
        .text('Tiempo (HH:MM)');

    ejesLayer.append('text')
        .attr('class', 'y-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -this.state.height / 2)
        .attr('y', -50)
        .style('text-anchor', 'middle')
        .text('Distancia (km)');
};

GraficoMarchaController.prototype.dibujarLeyenda = function() {
    const leyendaLayer = this.state.layers.leyenda
        .attr('transform', `translate(${this.state.width + 10}, 20)`);

    this.state.data.series.forEach((serie, index) => {
        const grupoSerie = leyendaLayer.append('g')
            .attr('transform', `translate(0, ${index * 40})`);

        grupoSerie.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text(serie.nombre)
            .style('font-weight', 'bold');

        serie.columnas.forEach((columna, colIndex) => {
            const grupoColumna = grupoSerie.append('g')
                .attr('transform', `translate(10, ${(colIndex + 1) * 15})`);

            grupoColumna.append('rect')
                .attr('width', 20)
                .attr('height', 10)
                .attr('x', 0)
                .attr('y', -8)
                .style('fill', this.config.colors[index])
                .style('fill-opacity', this.config.opacidadColumna);

            grupoColumna.append('text')
                .attr('x', 25)
                .attr('y', 0)
                .text(columna.nombre)
                .style('font-size', '12px');
        });
    });
};

GraficoMarchaController.prototype.agregarTooltipMouse = function() {
    const self = this;
    
    this.state.layers.overlay.append('rect')
        .attr('width', this.state.width)
        .attr('height', this.state.height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', function(event) {
            const [x, y] = d3.pointer(event);
            const tiempo = self.state.scales.x.invert(x);
            const distancia = self.state.scales.y.invert(y);
            
            self.mostrarTooltipPosicion(event.pageX, event.pageY,
                `Km ${distancia.toFixed(2)} - ${tiempo.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            );
        })
        .on('mouseout', function() {
            self.ocultarTooltip();
        });
};

GraficoMarchaController.prototype.mostrarTooltipPosicion = function(x, y, texto) {
    const tooltipLayer = this.state.layers.tooltip;
    tooltipLayer.selectAll('*').remove();
    
    // Calcular información adicional en esa posición
    const tiempo = this.state.scales.x.invert(x);
    const distanciaKm = this.state.scales.y.invert(y);
    
    // Buscar columnas en esa posición
    let columnasEnPosicion = [];
    if (this.state.data && this.state.data.series) {
        this.state.data.series.forEach(serie => {
            serie.columnas.forEach(columna => {
                const puntoEncontrado = columna.puntos.find(p => 
                    Math.abs(p.distancia/1000 - distanciaKm) < 0.1
                );
                if (puntoEncontrado) {
                    columnasEnPosicion.push({
                        serie: serie.nombre,
                        columna: columna.nombre,
                        velocidad: columna.velocidadMarcha
                    });
                }
            });
        });
    }
    
    const tooltip = tooltipLayer.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${Math.min(x + 10, this.state.width - 200)},${Math.max(y - 80, 10)})`);

    const ancho = 180;
    const alto = 60 + (columnasEnPosicion.length * 15);
    
    tooltip.append('rect')
        .attr('width', ancho)
        .attr('height', alto)
        .attr('fill', 'rgba(255,255,255,0.95)')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('rx', 8)
        .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.1))');

    // Información básica
    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 18)
        .text(`Km ${distanciaKm.toFixed(2)}`)
        .style('font-weight', 'bold')
        .style('font-size', '14px');

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 35)
        .text(`${this.formatearHora((tiempo.getTime() - this.state.horaH.getTime()) / 60000)}`)
        .style('font-size', '12px')
        .style('fill', '#666');

    // Columnas en posición
    columnasEnPosicion.forEach((col, index) => {
        tooltip.append('text')
            .attr('x', 10)
            .attr('y', 50 + (index * 15))
            .text(`${col.serie}-${col.columna}: ${col.velocidad}km/h`)
            .style('font-size', '11px')
            .style('fill', '#444');
    });
};

// 1. Mantenemos el procesamiento de datos pero ajustamos las escalas
GraficoMarchaController.prototype.procesarDatos = function(resultados) {
    if (!resultados || !resultados.series || !resultados.distanciaTotal) {
        console.error('Datos inválidos:', resultados);
        return;
    }

    this.state.data = resultados;
    this.state.horaH = window.CalculoMarcha.estado.horaH || new Date();

    // Calculamos el dominio de tiempo total
    const tiempoFinal = this.state.horaH.getTime() + resultados.tiempoTotal * 60000;

    this.state.scales.x = d3.scaleTime()
        .domain([this.state.horaH, new Date(tiempoFinal)])
        .range([0, this.state.width]);

    this.state.scales.y = d3.scaleLinear()
        .domain([0, resultados.distanciaTotal / 1000])
        .range([this.state.height, 0]);
};

// 2. La función principal de dibujo de columnas
GraficoMarchaController.prototype.dibujarColumnas = function() {
    const columnasLayer = this.state.layers.columnas;
    
    this.state.data.series.forEach((serie, serieIndex) => {
        serie.columnas.forEach((columna, columnaIndex) => {
            // Crear las líneas de borde head y tail
            const lineHead = d3.line()
                .x(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoHead * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            const lineTail = d3.line()
                .x(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoTail * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            // Área entre las líneas head y tail
            const area = d3.area()
                .x0(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoHead * 60000)))
                .x1(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoTail * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            // Dibujar el área principal de la columna
            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-area serie-${serieIndex}-columna-${columnaIndex}`)
                .attr('d', area)
                .style('fill', this.config.colors[serieIndex])
                .style('fill-opacity', this.config.opacidadColumna);

            // Dibujar las líneas de contorno
            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-borde head`)
                .attr('d', lineHead)
                .style('stroke', this.config.colors[serieIndex])
                .style('stroke-width', 1)
                .style('fill', 'none');

            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-borde tail`)
                .attr('d', lineTail)
                .style('stroke', this.config.colors[serieIndex])
                .style('stroke-width', 1)
                .style('fill', 'none');

            
        });
    });
};

// 3. La función de dibujo de series
GraficoMarchaController.prototype.dibujarSeries = function() {
    const seriesLayer = this.state.layers.series;

    this.state.data.series.forEach((serie, serieIndex) => {
        // Área de la serie usando tiempoSerieHead y tiempoSerieTail
        const area = d3.area()
            .x0(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoSerieHead * 60000)))
            .x1(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoSerieTail * 60000)))
            .y(d => this.state.scales.y(d.distancia / 1000))
            .curve(d3.curveLinear);

        seriesLayer.append('path')
            .datum(serie.puntos)
            .attr('class', `serie-area serie-${serieIndex}`)
            .attr('d', area)
            .style('fill', this.config.colors[serieIndex])
            .style('fill-opacity', this.config.opacidadSerie)
            .style('stroke', this.config.colors[serieIndex])
            .style('stroke-opacity', 0.5)
            .style('stroke-width', 1);
    });
};

// ✅ AGREGAR EXPORTACIÓN SVG/PNG
GraficoMarchaController.prototype.exportarSVG = function() {
    if (!this.state.svg) {
        console.warn('No hay gráfico para exportar');
        return;
    }
    
    const svgElement = this.state.svg.node().parentNode;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const nombreArchivo = `grafico_marcha_${new Date().toISOString().slice(0,10)}.svg`;
    
    if (window.saveAs) {
        window.saveAs(blob, nombreArchivo);
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    if (window.mostrarNotificacion) {
        mostrarNotificacion('Gráfico SVG exportado correctamente', 'success');
    }
};

GraficoMarchaController.prototype.exportarPNG = function() {
    if (!this.state.svg) {
        console.warn('No hay gráfico para exportar');
        return;
    }
    
    const svgElement = this.state.svg.node().parentNode;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    
    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(function(blob) {
            const nombreArchivo = `grafico_marcha_${new Date().toISOString().slice(0,10)}.png`;
            
            if (window.saveAs) {
                window.saveAs(blob, nombreArchivo);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = nombreArchivo;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
            
            if (window.mostrarNotificacion) {
                mostrarNotificacion('Gráfico PNG exportado correctamente', 'success');
            }
        });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};




GraficoMarchaController.prototype.habilitarZoomPan = function() {
    const self = this;
    
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on('zoom', function(event) {
            const { transform } = event;
            
            // Actualizar escalas con la transformación
            const nuevaEscalaX = transform.rescaleX(self.state.scales.x);
            const nuevaEscalaY = transform.rescaleY(self.state.scales.y);
            
            // Redibujar ejes con nuevas escalas
            self.state.layers.ejes.selectAll('.x-axis')
                .call(d3.axisBottom(nuevaEscalaX)
                    .tickFormat(d3.timeFormat('%H:%M')));
                    
            self.state.layers.ejes.selectAll('.y-axis')
                .call(d3.axisLeft(nuevaEscalaY)
                    .tickFormat(d => `${d} km`));
            
            // Transformar todas las capas gráficas
            self.state.layers.series.attr('transform', transform);
            self.state.layers.columnas.attr('transform', transform);
            self.state.layers.grid.attr('transform', transform);
            self.state.layers.puntosControl.attr('transform', transform);
        });
    
    this.state.svg.call(zoom);
    
    // Botón reset zoom
    if (window.mostrarNotificacion) {
        mostrarNotificacion('Zoom/Pan habilitado. Doble clic para resetear.', 'info', 3000);
    }
    
    this.state.svg.on('dblclick.zoom', function() {
        self.state.svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
        );
    });
};


GraficoMarchaController.prototype.formatearTiempo = function(minutos) {
    if (isNaN(minutos) || minutos < 0) return '00:00';
    
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

GraficoMarchaController.prototype.formatearHora = function(minutosDesdeInicio) {
    if (!this.state.horaH || isNaN(minutosDesdeInicio)) return '00:00';
    
    const horaCalculada = new Date(this.state.horaH.getTime() + minutosDesdeInicio * 60000);
    return horaCalculada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
};


// 4. Mejorar el tooltip para mostrar más información
GraficoMarchaController.prototype.mostrarTooltipColumna = function(event, columna, serie) {
    const tooltipLayer = this.state.layers.tooltip;
    tooltipLayer.selectAll('*').remove();
    
    const tooltip = tooltipLayer.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${event.pageX - 280},${event.pageY - 120})`);

    tooltip.append('rect')
        .attr('width', 250)
        .attr('height', 120)
        .attr('fill', 'white')
        .attr('stroke', '#ccc')
        .attr('rx', 5);

    // Agregar más información
    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .text(`${serie.nombre} - ${columna.nombre}`)
        .style('font-weight', 'bold');

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .text(`Velocidad: ${columna.velocidadMarcha} km/h`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 60)
        .text(`Vehículos: ${columna.vehiculos}`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 80)
        .text(`Distancia interv.: ${columna.distanciaIntervehicular}m`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 100)
        .text(`Tiempo total: ${this.formatearTiempo(columna.tiempoTotal)}`);
};

GraficoMarchaController.prototype.ocultarTooltip = function() {
    this.state.layers.tooltip.selectAll('*').remove();
};

// Exportar al objeto global
window.GraficoMarchaController = GraficoMarchaController;


// ✅ AGREGAR AL FINAL DEL ARCHIVO:
window.MAIRA = window.MAIRA || {};
window.MAIRA.GraficoMarcha = {
    instancia: null,
    crear: function(containerId) {
        this.instancia = new GraficoMarchaController();
        this.instancia.inicializar(containerId);
        return this.instancia;
    },
    configuracion: {
        colores: {
            obtener: function() { return window.GraficoMarchaController.prototype.config.colors; },
            establecer: function(colores) { 
                if (this.instancia) this.instancia.config.colors = colores; 
            }
        },
        opacidad: {
            serie: function(valor) { 
                if (this.instancia) this.instancia.config.opacidadSerie = valor; 
            },
            columna: function(valor) { 
                if (this.instancia) this.instancia.config.opacidadColumna = valor; 
            }
        }
    },
    utilidades: {
        exportarSVG: function() { 
            if (this.instancia) return this.instancia.exportarSVG(); 
        },
        exportarPNG: function() { 
            if (this.instancia) return this.instancia.exportarPNG(); 
        },
        obtenerDatos: function() { 
            if (this.instancia) return this.instancia.state.data; 
        }
    },
    version: '1.0.0'
};

// ✅ REEMPLAZAR la función dibujarPuntosControl existente en graficoMarcha.js:
GraficoMarchaController.prototype.dibujarPuntosControl = function() {
    const pcLayer = this.state.layers.puntosControl;
    const puntosControl = window.CalculoMarcha?.estado?.puntosControl;

    if (!puntosControl || !puntosControl.length) return;

    puntosControl.forEach(pc => {
        if (!pc || isNaN(pc.distanciaAcumulada)) return;

        const yPosition = this.state.scales.y(pc.distanciaAcumulada / 1000);
        
        // ✅ USAR SÍMBOLOS REALES SOLO PARA PI Y PT
        if (pc.tipo === 'PI' || pc.tipo === 'PT') {
            this.dibujarSimboloMilitar(pcLayer, pc, yPosition);
        } else {
            // Mantener implementación actual para PC
            this.dibujarPuntoControlGenerico(pcLayer, pc, yPosition);
        }
    });
};

// ✅ NUEVA FUNCIÓN: Dibujar símbolos militares PI/PT usando milsymbol.js
GraficoMarchaController.prototype.dibujarSimboloMilitar = function(layer, pc, yPosition) {
    // Verificar que milsymbol.js esté disponible
    if (typeof window.ms === 'undefined') {
        console.warn('milsymbol.js no disponible, usando fallback para', pc.tipo);
        this.dibujarPuntoControlGenerico(layer, pc, yPosition);
        return;
    }

    // ✅ USAR EXACTAMENTE LA MISMA CONFIGURACIÓN QUE simbolosP.js
    const sidc = 'GFGPGPP---'; // Mismo SIDC que en simbolosP.js
    
    // Crear símbolo usando milsymbol con configuración idéntica a simbolosP.js
    const symbol = new ms.Symbol(sidc, {
        size: 25,                    // Tamaño reducido para el gráfico
        uniqueDesignation: pc.tipo,  // "PI" o "PT" en el centro
        infoFields: false,           // ✅ Mismo que simbolosP.js
        colorMode: "Light",          // ✅ Mismo que simbolosP.js
        fill: true,                  // ✅ Mismo que simbolosP.js
        monoColor: "black"           // ✅ NEGRO como en simbolosP.js
    });

    // Obtener SVG del símbolo
    const svgContent = symbol.asSVG();
    
    // ✅ USAR CONFIGURACIÓN DE COLORES CONSISTENTE CON simbolosP.js
    const configuracion = this.obtenerConfiguracionConsistente(pc.tipo);
    
    // Línea de referencia con configuración consistente
    layer.append('line')
        .attr('class', `pc-line-${pc.tipo}`)
        .attr('x1', 0)
        .attr('x2', this.state.width)
        .attr('y1', yPosition)
        .attr('y2', yPosition)
        .style('stroke', configuracion.colorLinea)
        .style('stroke-opacity', configuracion.opacidadLinea)
        .style('stroke-dasharray', configuracion.dashArray)
        .style('stroke-width', configuracion.anchoLinea);

    // ✅ INSERTAR SÍMBOLO SVG REAL
    const grupoSimbolo = layer.append('g')
        .attr('class', `pc-symbol-${pc.tipo}`)
        .attr('transform', `translate(-40, ${yPosition - 12})`);

    // ✅ FONDO CONFIGURABLE (como PC genéricos)
    if (configuracion.mostrarFondo) {
        grupoSimbolo.append('rect')
            .attr('x', -2)
            .attr('y', -2)
            .attr('width', 29)
            .attr('height', 29)
            .attr('rx', 3)
            .style('fill', configuracion.colorFondo)
            .style('fill-opacity', configuracion.opacidadFondo)
            .style('stroke', configuracion.colorBorde)
            .style('stroke-width', configuracion.anchoBorde)
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
    }

    // Insertar el SVG del símbolo militar (siempre negro como simbolosP.js)
    grupoSimbolo.append('g')
        .attr('transform', 'translate(0, 0)')
        .html(svgContent);

    // Etiqueta con configuración consistente
    const etiqueta = layer.append('g')
        .attr('class', `pc-label-${pc.tipo}`)
        .attr('transform', `translate(-8, ${yPosition})`);

    const textoEtiqueta = `${pc.tipo}: ${pc.nombre || configuracion.nombreCompleto}`;
    
    const textElement = etiqueta.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', configuracion.colorTexto)
        .text(textoEtiqueta);

    // Fondo de la etiqueta
    const bbox = textElement.node().getBBox();
    etiqueta.insert('rect', 'text')
        .attr('x', bbox.x - 3)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 6)
        .attr('height', bbox.height + 2)
        .attr('rx', 3)
        .style('fill', configuracion.colorFondoEtiqueta)
        .style('fill-opacity', configuracion.opacidadFondoEtiqueta)
        .style('stroke', configuracion.colorBordeEtiqueta)
        .style('stroke-width', 1);

    // ✅ TOOLTIP ESPECÍFICO PARA PI/PT
    grupoSimbolo
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
            this.mostrarTooltipPIPT(event, pc, configuracion);
        })
        .on('mouseout', () => {
            this.ocultarTooltip();
        });
};

// ✅ NUEVA FUNCIÓN: Configuración consistente con simbolosP.js
GraficoMarchaController.prototype.obtenerConfiguracionConsistente = function(tipo) {
    // Configuración base que replica simbolosP.js
    const configuracionBase = {
        // ✅ SÍMBOLO SIEMPRE NEGRO (como simbolosP.js - monoColor: "black")
        colorSimbolo: 'black',
        
        // ✅ CONFIGURACIÓN DE LÍNEAS
        colorLinea: 'black',           // Negro como el símbolo
        opacidadLinea: 0.6,
        anchoLinea: 2,
        
        // ✅ CONFIGURACIÓN DE TEXTO
        colorTexto: 'black',           // Negro consistente
        
        // ✅ CONFIGURACIÓN DE FONDOS (modificable como PC)
        mostrarFondo: true,            // Configurable
        colorFondo: 'rgba(255,255,255,0.9)',      // Blanco semi-transparente
        opacidadFondo: 0.9,
        colorBorde: 'black',           // Borde negro
        anchoBorde: 1,
        
        // ✅ CONFIGURACIÓN DE ETIQUETAS
        colorFondoEtiqueta: 'rgba(255,255,255,0.95)',
        opacidadFondoEtiqueta: 0.95,
        colorBordeEtiqueta: 'black'
    };

    // Configuraciones específicas por tipo
    const configuracionesTipo = {
        'PI': {
            ...configuracionBase,
            nombreCompleto: 'Punto Inicial',
            dashArray: '8,4',          // Patrón distintivo para PI
            simbolo: '🔴'              // Para referencia visual
        },
        'PT': {
            ...configuracionBase,
            nombreCompleto: 'Punto Terminal',
            dashArray: '6,3',          // Patrón distintivo para PT
            simbolo: '🏁'              // Para referencia visual
        }
    };

    return configuracionesTipo[tipo] || configuracionBase;
};

// ✅ ACTUALIZAR tooltip para usar configuración consistente
GraficoMarchaController.prototype.mostrarTooltipPIPT = function(event, pc, configuracion) {
    const tooltipLayer = this.state.layers.tooltip;
    tooltipLayer.selectAll('*').remove();
    
    const [x, y] = d3.pointer(event);
    
    const tooltip = tooltipLayer.append('g')
        .attr('class', 'tooltip-pi-pt')
        .attr('transform', `translate(${Math.min(x + 20, this.state.width - 260)},${Math.max(y - 100, 10)})`);

    const ancho = 240;
    const alto = 100;
    
    // Fondo del tooltip con color consistente
    tooltip.append('rect')
        .attr('width', ancho)
        .attr('height', alto)
        .attr('fill', 'rgba(255,255,255,0.98)')
        .attr('stroke', configuracion.colorLinea)    // ✅ Negro consistente
        .attr('stroke-width', 2)
        .attr('rx', 8)
        .style('filter', 'drop-shadow(3px 3px 6px rgba(0,0,0,0.2))');

    // Título con símbolo visual
    tooltip.append('text')
        .attr('x', 15)
        .attr('y', 20)
        .text(`${configuracion.simbolo} ${configuracion.nombreCompleto}`)
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .style('fill', configuracion.colorTexto);   // ✅ Negro consistente

    // Información del punto
    tooltip.append('text')
        .attr('x', 15)
        .attr('y', 40)
        .text(`${pc.tipo}: ${pc.nombre || configuracion.nombreCompleto}`)
        .style('font-size', '12px')
        .style('fill', '#333');

    // Distancia
    tooltip.append('text')
        .attr('x', 15)
        .attr('y', 58)
        .text(`Distancia: ${(pc.distanciaAcumulada / 1000).toFixed(2)} km`)
        .style('font-size', '11px')
        .style('fill', '#666');

    // Tiempo estimado (si está disponible)
    if (pc.tiempoLlegada !== undefined) {
        const horaLlegada = new Date(this.state.horaH.getTime() + pc.tiempoLlegada * 60000);
        tooltip.append('text')
            .attr('x', 15)
            .attr('y', 76)
            .text(`Hora: ${horaLlegada.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}`)
            .style('font-size', '11px')
            .style('fill', configuracion.colorTexto)  // ✅ Negro consistente
            .style('font-weight', 'bold');
    }
};

// ✅ FUNCIÓN FALTANTE: Dibujar puntos de control genéricos (PC)
GraficoMarchaController.prototype.dibujarPuntoControlGenerico = function(layer, pc, yPosition) {
    // Configuración para PC genéricos
    const configuracion = {
        colorLinea: '#666',
        colorTexto: '#333',
        colorFondo: 'rgba(255,255,255,0.9)',
        colorBorde: '#ccc'
    };

    // Línea horizontal del PC
    layer.append('line')
        .attr('class', `pc-line-${pc.numero || 'generico'}`)
        .attr('x1', 0)
        .attr('y1', yPosition)
        .attr('x2', this.state.width - this.state.margin.right)
        .attr('y2', yPosition)
        .style('stroke', configuracion.colorLinea)
        .style('stroke-width', 1)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.7);

    // Círculo marcador
    const grupo = layer.append('g')
        .attr('class', `pc-marker-${pc.numero || 'generico'}`)
        .attr('transform', `translate(-20, ${yPosition})`);

    grupo.append('circle')
        .attr('r', 8)
        .style('fill', configuracion.colorFondo)
        .style('stroke', configuracion.colorLinea)
        .style('stroke-width', 2);

    // Texto del PC
    grupo.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.32em')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', configuracion.colorTexto)
        .text(pc.numero || 'PC');

    // Etiqueta
    const etiqueta = layer.append('g')
        .attr('class', `pc-label-${pc.numero || 'generico'}`)
        .attr('transform', `translate(-8, ${yPosition})`);

    const textoEtiqueta = pc.nombre || `PC ${pc.numero || ''}`;
    
    const textElement = etiqueta.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .attr('text-anchor', 'end')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', configuracion.colorTexto)
        .text(textoEtiqueta);

    // Fondo de la etiqueta
    const bbox = textElement.node().getBBox();
    etiqueta.insert('rect', 'text')
        .attr('x', bbox.x - 3)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 6)
        .attr('height', bbox.height + 2)
        .attr('rx', 3)
        .style('fill', configuracion.colorFondo)
        .style('fill-opacity', 0.8)
        .style('stroke', configuracion.colorBorde)
        .style('stroke-width', 1);

    // Tooltip básico
    grupo
        .style('cursor', 'pointer')
        .on('mouseover', (event) => {
            this.mostrarTooltipPC(event, pc);
        })
        .on('mouseout', () => {
            this.ocultarTooltip();
        });
};

// Tooltip básico para PC genéricos
GraficoMarchaController.prototype.mostrarTooltipPC = function(event, pc) {
    this.ocultarTooltip();
    
    const [x, y] = d3.pointer(event, this.state.container.node());
    
    const tooltip = this.state.container.append('g')
        .attr('class', 'tooltip-pc')
        .attr('transform', `translate(${Math.min(x + 20, this.state.width - 200)},${Math.max(y - 80, 10)})`);

    const ancho = 180;
    const alto = 80;
    
    // Fondo del tooltip
    tooltip.append('rect')
        .attr('width', ancho)
        .attr('height', alto)
        .attr('fill', 'rgba(255,255,255,0.98)')
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
        .attr('rx', 6)
        .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))');

    // Título
    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 18)
        .text(pc.nombre || `Punto de Control ${pc.numero || ''}`)
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .style('fill', '#333');

    // Distancia
    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 38)
        .text(`Distancia: ${(pc.distanciaAcumulada / 1000).toFixed(2)} km`)
        .style('font-size', '11px')
        .style('fill', '#666');

    // Tiempo estimado si existe
    if (pc.tiempoEstimado !== undefined) {
        tooltip.append('text')
            .attr('x', 10)
            .attr('y', 58)
            .text(`Tiempo estimado: ${pc.tiempoEstimado.toFixed(1)} min`)
            .style('font-size', '11px')
            .style('fill', '#666');
    }
};

// ✅ AGREGAR función para configurar fondos dinámicamente
GraficoMarchaController.prototype.configurarFondosSimbolos = function(mostrarFondo = true, colorFondo = 'rgba(255,255,255,0.9)') {
    // Actualizar configuración interna
    this.configuracionSimbolos = this.configuracionSimbolos || {};
    this.configuracionSimbolos.mostrarFondo = mostrarFondo;
    this.configuracionSimbolos.colorFondo = colorFondo;
    
    // Re-dibujar símbolos si hay datos
    if (this.state.data) {
        this.state.layers.puntosControl.selectAll('*').remove();
        this.dibujarPuntosControl();
    }
    
    console.log(`🎨 Fondos de símbolos PI/PT ${mostrarFondo ? 'habilitados' : 'deshabilitados'}`);
};

// ✅ ACTUALIZAR la estructura MAIRA existente:
window.MAIRA.GraficoMarcha = {
    instancia: null,
    crear: function(containerId) {
        this.instancia = new GraficoMarchaController();
        this.instancia.inicializar(containerId);
        return this.instancia;
    },
    configuracion: {
        colores: {
            obtener: function() { return this.instancia?.config.colors || []; },
            establecer: function(colores) { 
                if (this.instancia) this.instancia.config.colors = colores; 
            }
        },
        opacidad: {
            serie: function(valor) { 
                if (this.instancia) this.instancia.config.opacidadSerie = valor; 
            },
            columna: function(valor) { 
                if (this.instancia) this.instancia.config.opacidadColumna = valor; 
            }
        },
        // ✅ NUEVA: Configuración específica para símbolos militares
        simbolosMilitares: {
            habilitados: function() {
                return this.instancia?.dependencias?.milsymbol || false;
            },
            verificar: function() {
                if (this.instancia) {
                    return this.instancia.verificarDependencias();
                }
                return {};
            },
            // ✅ NUEVA: Configurar fondos como PC
            configurarFondos: function(mostrar = true, color = 'rgba(255,255,255,0.9)') {
                if (this.instancia) {
                    this.instancia.configurarFondosSimbolos(mostrar, color);
                }
            },
            // ✅ NUEVA: Obtener configuración actual
            obtenerConfiguracion: function(tipo) {
                if (this.instancia) {
                    return this.instancia.obtenerConfiguracionConsistente(tipo);
                }
                return null;
            }
        }
    },
    utilidades: {
        exportarSVG: function() { 
            if (this.instancia) return this.instancia.exportarSVG(); 
        },
        exportarPNG: function() { 
            if (this.instancia) return this.instancia.exportarPNG(); 
        },
        obtenerDatos: function() { 
            if (this.instancia) return this.instancia.state.data; 
        }
    },
    integracion: {
        // ✅ VERIFICAR símbolos militares disponibles
        simbolosDisponibles: function() {
            return !!(typeof window.ms !== 'undefined');
        },
        // ✅ RE-DIBUJAR símbolos si cambia la configuración
        actualizarSimbolos: function() {
            if (this.instancia && this.instancia.state.data) {
                this.instancia.state.layers.puntosControl.selectAll('*').remove();
                this.instancia.dibujarPuntosControl();
                console.log('🔄 Símbolos PI/PT actualizados');
            }
        }
    },
    version: '1.1.0'
};

// ✅ VERIFICACIÓN AUTOMÁTICA al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.MAIRA?.GraficoMarcha?.integracion?.simbolosDisponibles()) {
            console.log('🎯 Símbolos militares PI/PT listos para usar en gráficos');
        }
    }, 1000);
});