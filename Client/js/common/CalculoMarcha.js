// CalculoMarcha.js
var CalculoMarchaController = function() {
    this.estado = {
        inicializado: false,
        rutaMarcha: {
            puntos: [],
            distanciaTotal: 0,
            perfilElevacion: null,
            vegetacion: null,
            pi: null,
            pt: null
        },
        series: [],
        puntosControl: [],
        altosMarcha: {
            intervalo: 45,
            duracion: 10,
            inicio: 0
        },
        horaH: new Date(new Date().setHours(0, 0, 0, 0)) // Establecer 00:00 como hora por defecto
    };

    this.factores = {
        pendiente: {
            subida: [
                { limite: 1, factor: 1.01 },
                { limite: 2, factor: 1.02 },
                { limite: 3, factor: 1.03 },
                { limite: 4, factor: 1.04 },
                { limite: 5, factor: 1.05 },
                { limite: 6, factor: 1.07 },
                { limite: 7, factor: 1.09 },
                { limite: 8, factor: 1.11 },
                { limite: 9, factor: 1.13 },
                { limite: 10, factor: 1.15 },
                { limite: 11, factor: 1.18 },
                { limite: 12, factor: 1.21 },
                { limite: 13, factor: 1.24 },
                { limite: 14, factor: 1.27 },
                { limite: 15, factor: 1.3 },
                { limite: 16, factor: 1.34 },
                { limite: 17, factor: 1.38 },
                { limite: 18, factor: 1.42 },
                { limite: 19, factor: 1.46 },
                { limite: 20, factor: 1.5 },
                { limite: 21, factor: 1.55 },
                { limite: 22, factor: 1.6 },
                { limite: 23, factor: 1.65 },
                { limite: 24, factor: 1.7 },
                { limite: 25, factor: 1.75 },
                { limite: 26, factor: 1.81 },
                { limite: 27, factor: 1.87 },
                { limite: 28, factor: 1.93 },
                { limite: 29, factor: 1.99 },
                { limite: 30, factor: 2.05 },
                { limite: 31, factor: 2.12 },
                { limite: 32, factor: 2.19 },
                { limite: 33, factor: 2.26 },
                { limite: 34, factor: 2.33 },
                { limite: 35, factor: 2.4 },
                { limite: 36, factor: 2.48 },
                { limite: 37, factor: 2.56 },
                { limite: 38, factor: 2.64 },
                { limite: 39, factor: 2.72 },
                { limite: 40, factor: 0 }  // Intransitable
            ],
            bajada: [
                { limite: 1, factor: 0.99 },
                { limite: 2, factor: 0.98 },
                { limite: 3, factor: 0.97 },
                { limite: 4, factor: 0.96 },
                { limite: 5, factor: 0.95 },
                { limite: 6, factor: 0.94 },
                { limite: 7, factor: 0.93 },
                { limite: 8, factor: 0.92 },
                { limite: 9, factor: 0.91 },
                { limite: 10, factor: 0.90 },
                { limite: 11, factor: 0.89 },
                { limite: 12, factor: 0.88 },
                { limite: 13, factor: 0.87 },
                { limite: 14, factor: 0.86 },
                { limite: 15, factor: 0.85 },
                { limite: 16, factor: 0.84 },
                { limite: 17, factor: 0.83 },
                { limite: 18, factor: 0.82 },
                { limite: 19, factor: 0.81 },
                { limite: 20, factor: 0.80 },
                { limite: 21, factor: 0.79 },
                { limite: 22, factor: 0.78 },
                { limite: 23, factor: 0.77 },
                { limite: 24, factor: 0.76 },
                { limite: 25, factor: 0.75 },
                { limite: 26, factor: 0.74 },
                { limite: 27, factor: 0.73 },
                { limite: 28, factor: 0.72 },
                { limite: 29, factor: 0.71 },
                { limite: 30, factor: 0.70 },
                { limite: 31, factor: 0.69 },
                { limite: 32, factor: 0.68 },
                { limite: 33, factor: 0.67 },
                { limite: 34, factor: 0.66 },
                { limite: 35, factor: 0.65 },
                { limite: 36, factor: 0.64 },
                { limite: 37, factor: 0.63 },
                { limite: 38, factor: 0.62 },
                { limite: 39, factor: 0.61 },
                { limite: 40, factor: 0 }  // Intransitable
            ]
        },
        vegetacion: {
            'Suelo desnudo o urbano': 1.0,
            'Vegetación escasa': 1.05,
            'Pradera o arbustos': 1.1,
            'Bosque poco denso': 1.5,
            'Bosque denso': 0,  // Intransitable
            'Agua o nube': 0    // Intransitable
        }
    };
    
};

CalculoMarchaController.prototype.validarDatosElevacion = function(punto) {
    return punto && 
           typeof punto.elevation === 'number' && 
           !isNaN(punto.elevation) && 
           isFinite(punto.elevation);
};

CalculoMarchaController.prototype.verificarCalidadDatos = function(puntos) {
    var total = puntos.length;
    var validos = 0;
    var saltosAnormales = 0;
    var maxDiferencia = 0;
    
    for (var i = 1; i < puntos.length; i++) {
        if (this.validarDatosElevacion(puntos[i])) {
            validos++;
            
            if (this.validarDatosElevacion(puntos[i-1])) {
                var diferencia = Math.abs(puntos[i].elevation - puntos[i-1].elevation);
                maxDiferencia = Math.max(maxDiferencia, diferencia);
                
                if (diferencia > 50) {
                    saltosAnormales++;
                    console.warn('Salto anormal de elevación detectado entre puntos:', {
                        punto1: puntos[i-1],
                        punto2: puntos[i],
                        diferencia: diferencia
                    });
                }
            }
        }
    }

    return {
        totalPuntos: total,
        puntosValidos: validos,
        porcentajeValidos: (validos / total) * 100,
        saltosAnormales: saltosAnormales,
        maxDiferencia: maxDiferencia
    };
};



CalculoMarchaController.prototype.inicializarDatos = function() {
    var self = this;
    
    if (!window.elementoSeleccionado || !(window.elementoSeleccionado instanceof L.Polyline)) {
        throw new Error('Debe seleccionar una ruta para realizar el cálculo');
    }

    var puntosBase = window.elementoSeleccionado.getLatLngs();
    var puntosInterpolados = window.interpolarPuntosRuta(puntosBase);

    return Promise.all(puntosInterpolados.map(function(punto) {
        return Promise.all([
            window.elevationHandler.obtenerElevacion(punto.lat, punto.lng),
            window.vegetacionHandler.obtenerVegetacionEnPunto(punto.lat, punto.lng)
        ]).then(function(resultados) {
            return {
                lat: punto.lat,
                lng: punto.lng,
                elevation: resultados[0],
                vegetacion: resultados[1]
            };
        });
    })).then(function(puntosConDatos) {
        // Interpolar puntos faltantes
        var puntosCompletos = self.interpolarPuntosFaltantes(puntosConDatos);
        
        // Verificar calidad de datos
        var estadisticasCalidad = self.verificarCalidadDatos(puntosCompletos);
        console.log('Estadísticas de calidad de datos:', estadisticasCalidad);

        if (estadisticasCalidad.porcentajeValidos < 80) {
            console.warn('Advertencia: Baja calidad de datos de elevación incluso después de interpolación');
        }

        self.estado.rutaMarcha.puntos = self.calcularDatosRuta(puntosCompletos);
        self.estado.rutaMarcha.distanciaTotal = self.estado.rutaMarcha.puntos[self.estado.rutaMarcha.puntos.length - 1].distanciaAcumulada;
        self.estado.inicializado = true;

        return true;
    });
};

CalculoMarchaController.prototype.obtenerPuntosControl = function() {
    var self = this;  // Guardar referencia a this
    
    // Obtener los elementos del panel
    var puntosControlList = document.querySelectorAll('.punto-control.pc');
    var puntosControl = Array.from(puntosControlList).map(function(pcElement) {
        // Obtener el texto de coordenadas
        var coordInfo = pcElement.textContent.trim();
        var matches = coordInfo.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
        if (!matches) {
            console.warn("No se pudieron extraer coordenadas de:", coordInfo);
            return null;
        }

        const lat = parseFloat(matches[1]);
        const lng = parseFloat(matches[2]);

        // Determinar si es PI, PT o PC normal
        let numero, tipo;
        if (pcElement.classList.contains('pi')) {
            numero = 'Punto Inicial';
            tipo = 'PI';
        } else if (pcElement.classList.contains('pt')) {
            numero = 'Punto Terminal';
            tipo = 'PT';
        } else {
            numero = pcElement.querySelector('.pc-numero')?.value || '';
            tipo = 'PC';
        }

        // Calcular la distancia sobre la ruta
        const proyeccion = self.encontrarPuntoEnRuta({lat, lng});  // Usar self en lugar de this

        return {
            numero: numero,
            tipo: tipo,
            lat: lat,
            lng: lng,
            puntoProyectado: proyeccion.punto,
            distanciaAcumulada: proyeccion.distancia,
            distanciaAlPunto: proyeccion.distanciaAlPunto,
            tiempo: 0
        };
    }).filter(pc => pc !== null);

    // Ordenar los puntos por distancia, pero manteniendo PI primero y PT último
    puntosControl.sort((a, b) => {
        if (a.tipo === 'PI') return -1;
        if (b.tipo === 'PI') return 1;
        if (a.tipo === 'PT') return 1;
        if (b.tipo === 'PT') return -1;
        return a.distanciaAcumulada - b.distanciaAcumulada;
    });

    return puntosControl;
};

CalculoMarchaController.prototype.proyectarPuntoEnSegmento = function(punto, p1, p2) {
    // Vector del segmento
    var dx = p2.lng - p1.lng;
    var dy = p2.lat - p1.lat;

    // Si el segmento es un punto, retornar p1
    if (dx === 0 && dy === 0) {
        return p1;
    }

    // Calcular el parámetro de la proyección
    var t = ((punto.lng - p1.lng) * dx + (punto.lat - p1.lat) * dy) / 
            (dx * dx + dy * dy);

    // Limitar t entre 0 y 1 para mantener el punto dentro del segmento
    var tLimitado = Math.max(0, Math.min(1, t));

    // Calcular el punto proyectado
    return L.latLng(
        p1.lat + tLimitado * dy,
        p1.lng + tLimitado * dx
    );
};


CalculoMarchaController.prototype.calcularDatosRuta = function(puntos) {
    var distanciaAcumulada = 0;
    var puntosConDatos = [];

    for (var i = 0; i < puntos.length; i++) {
        var puntoActual = puntos[i];
        var puntoAnterior = i > 0 ? puntos[i - 1] : null;

        var datosExtras = {
            pendiente: 0,
            distanciaSegmento: 0,
            distanciaAcumulada: distanciaAcumulada,
            elevation: puntoActual.elevation || 0,
            vegetacion: puntoActual.vegetacion
        };

        if (puntoAnterior && this.validarDatosElevacion(puntoActual) && 
            this.validarDatosElevacion(puntoAnterior)) {
            
            datosExtras.distanciaSegmento = L.latLng(puntoAnterior.lat, puntoAnterior.lng)
                .distanceTo(L.latLng(puntoActual.lat, puntoActual.lng));
            
            distanciaAcumulada += datosExtras.distanciaSegmento;
            datosExtras.distanciaAcumulada = distanciaAcumulada;

            var diferenciaElevacion = puntoActual.elevation - puntoAnterior.elevation;
            datosExtras.pendiente = datosExtras.distanciaSegmento > 0 ? 
                (diferenciaElevacion / datosExtras.distanciaSegmento) * 100 : 0;

            // Datos para debug
            datosExtras.debug = {
                diferenciaElevacion: diferenciaElevacion,
                elevacionAnterior: puntoAnterior.elevation,
                elevacionActual: puntoActual.elevation
            };
        }

        puntosConDatos.push({
            lat: puntoActual.lat,
            lng: puntoActual.lng,
            elevation: puntoActual.elevation,
            vegetacion: puntoActual.vegetacion,
            pendiente: datosExtras.pendiente,
            distanciaSegmento: datosExtras.distanciaSegmento,
            distanciaAcumulada: datosExtras.distanciaAcumulada,
            debug: datosExtras.debug
        });
    }

    // Logging de resultados
    var stats = {
        totalPuntos: puntosConDatos.length,
        distanciaTotal: distanciaAcumulada,
        pendienteMaxima: Math.max.apply(null, puntosConDatos.map(function(p) { return p.pendiente; })),
        pendienteMinima: Math.min.apply(null, puntosConDatos.map(function(p) { return p.pendiente; }))
    };
    
    console.log('Estadísticas de la ruta:', stats);
    return puntosConDatos;
};


CalculoMarchaController.prototype.calcularFactorTerreno = function(pendiente, vegetacion) {
    // ✅ FACTOR DE PENDIENTE (MANEJADO AQUÍ)
    var factorPendiente = 1.0;
    var pendienteAbs = Math.abs(pendiente);
    var factores = pendiente >= 0 ? this.factores.pendiente.subida : this.factores.pendiente.bajada;

    for (var i = 0; i < factores.length; i++) {
        if (pendienteAbs > factores[i].limite) {
            factorPendiente = factores[i].factor;
        }
    }

    // ✅ FACTOR DE VEGETACIÓN (DELEGADO A MÓDULO DE VEGETACIÓN)
    var factorVegetacion = 1.0;
    if (vegetacion && window.MAIRA?.Vegetacion?.transitabilidad?.obtenerFactor) {
        factorVegetacion = window.MAIRA.Vegetacion.transitabilidad.obtenerFactor(vegetacion.tipo);
    } else if (vegetacion && this.factores.vegetacion[vegetacion.tipo]) {
        // Fallback a tabla local
        factorVegetacion = this.factores.vegetacion[vegetacion.tipo];
    }

    return factorPendiente * factorVegetacion;
};







CalculoMarchaController.prototype.obtenerSeriesYColumnas = function() {
    var seriesContainer = document.getElementById('seriesContainer');
    if (!seriesContainer) return [];

    var series = [];
    var seriesElements = seriesContainer.getElementsByClassName('serie-item');

    for (var i = 0; i < seriesElements.length; i++) {
        var serieElement = seriesElements[i];
        var serie = {
            nombre: serieElement.querySelector('.serie-nombre').value,
            intervaloAnterior: parseInt(serieElement.querySelector('.intervalo-input').value) || 0,
            columnas: []
        };

        var columnasElements = serieElement.getElementsByClassName('columna-item');
        for (var j = 0; j < columnasElements.length; j++) {
            var columnaElement = columnasElements[j];
            serie.columnas.push({
                nombre: columnaElement.querySelector('.columna-nombre').value,
                vehiculos: parseInt(columnaElement.querySelector('.vehiculos-input').value),
                distanciaIntervehicular: parseInt(columnaElement.querySelector('.distancia-input').value),
                velocidadMarcha: parseInt(columnaElement.querySelector('.velocidad-input').value),
                intervaloSiguiente: parseInt(columnaElement.querySelector('.intervalo-columnas-input')?.value) || 0
            });
        }

        series.push(serie);
    }

    return series;
};

// Agregar al CalculoMarchaController.prototype

CalculoMarchaController.prototype.generarHTMLResultados = function(resultados) {
    var html = [
        '<div class="calculo-marcha-resultados">',
        '    <div class="resumen-general">',
        '        <h3>Resumen General</h3>',
        '        <table class="tabla-resumen">',
        '            <tr>',
        '                <th>Distancia Total:</th>',
        '                <td>' + (resultados.distanciaTotal/1000).toFixed(2) + ' km</td>',
        '            </tr>',
        '            <tr>',
        '                <th>Tiempo Total:</th>',
        '                <td>' + this.formatearTiempo(resultados.tiempoTotal) + '</td>',
        '            </tr>',
        '        </table>',
        '    </div>',
        this.generarHTMLSeries(resultados.series),
        this.generarHTMLPuntosControl(resultados),
        '    <button id="exportarResultados" class="btn-exportar">',
        '        Exportar Resultados',
        '    </button>',
        '</div>'
    ].join('\n');

    return html;
};

CalculoMarchaController.prototype.generarHTMLSeries = function(series) {
    var self = this;
    return series.map(function(serie) {
        return [
            '<div class="serie-resultados">',
            '    <h3>' + serie.nombre + '</h3>',
            '    <div class="serie-info">',
            '        <span>Inicio: ' + self.formatearTiempo(serie.tiempoInicio) + '</span>',
            '        <span>Tiempo Total: ' + self.formatearTiempo(serie.tiempoTotal) + '</span>',
            '    </div>',
            '    <table class="tabla-columnas">',
            '        <thead>',
            '            <tr>',
            '                <th>Columna</th>',
            '                <th>Tiempo Movimiento</th>',
            '                <th>Tiempo Altos</th>',
            '                <th>Tiempo Total</th>',
            '                <th>Velocidad Promedio</th>',
            '                <th>Detalles</th>',
            '            </tr>',
            '        </thead>',
            '        <tbody>',
            self.generarHTMLColumnas(serie.columnas),
            '        </tbody>',
            '    </table>',
            '</div>'
        ].join('\n');
    }).join('\n');
};

CalculoMarchaController.prototype.generarHTMLColumnas = function(columnas) {
    var self = this;
    return columnas.map(function(columna) {
        // Asegurarnos de que tenemos un valor de velocidad promedio
        const velocidadPromedio = columna.velocidadPromedio || 0;
        
        return [
            '<tr>',
            '    <td>' + columna.nombre + '</td>',
            '    <td>' + self.formatearTiempo(columna.tiempoMovimiento) + '</td>',
            '    <td>' + self.formatearTiempo(columna.tiempoAltos) + '</td>',
            '    <td>' + self.formatearTiempo(columna.tiempoTotal) + '</td>',
            '    <td>' + velocidadPromedio.toFixed(1) + ' km/h</td>',
            '    <td>',
            '        <button class="btn-detalles" data-columna-id="' + columna.nombre + '">',
            '            Ver detalles',
            '        </button>',
            '    </td>',
            '</tr>'
        ].join('\n');
    }).join('\n');
};


CalculoMarchaController.prototype.formatearTiempo = function(minutos) {
    if (minutos === undefined || minutos === null) return '0h 0m';
    
    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);
    return `${horas}h ${mins}m`;
};

CalculoMarchaController.prototype.formatearHora = function(tiempoEnMinutos) {
    if (!tiempoEnMinutos && tiempoEnMinutos !== 0) {
        return '--:--';
    }

    if (!this.estado.horaH) {
        console.warn('Hora H no configurada, usando 00:00 por defecto');
        this.estado.horaH = new Date();
        this.estado.horaH.setHours(0, 0, 0, 0);
    }

    const fecha = new Date(this.estado.horaH.getTime() + (tiempoEnMinutos * 60000));
    return fecha.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
};

CalculoMarchaController.prototype.calcularTiempoEnPunto = function(resultados, distancia) {
    let tiempoMinimo = Infinity;

    // Iterar sobre cada serie
    resultados.series.forEach(serie => {
        // Iterar sobre cada columna de la serie
        serie.columnas.forEach(columna => {
            // Encontrar el punto de progresión más cercano a la distancia dada
            let puntoAnterior = null;
            let tiempoEncontrado = null;

            for (let punto of columna.progresion) {
                if (punto.distanciaAcumulada >= distancia) {
                    if (puntoAnterior) {
                        // Interpolar tiempo
                        const fraccion = (distancia - puntoAnterior.distanciaAcumulada) / 
                                       (punto.distanciaAcumulada - puntoAnterior.distanciaAcumulada);
                        tiempoEncontrado = puntoAnterior.tiempoAcumulado + 
                                         (punto.tiempoAcumulado - puntoAnterior.tiempoAcumulado) * fraccion;
                    } else {
                        tiempoEncontrado = punto.tiempoAcumulado;
                    }
                    break;
                }
                puntoAnterior = punto;
            }

            if (tiempoEncontrado !== null && tiempoEncontrado < tiempoMinimo) {
                tiempoMinimo = tiempoEncontrado;
            }
        });
    });

    return tiempoMinimo === Infinity ? 0 : tiempoMinimo;
};

CalculoMarchaController.prototype.calcularHoraLlegadaPC = function(distanciaPC) {
    // Asumimos hora inicial 06:00
    const horaInicio = new Date();
    horaInicio.setHours(6, 0, 0, 0);

    // Encontrar el tiempo que tarda en llegar al PC
    const tiempoHastaPC = this.calcularTiempoHastaDistancia(distanciaPC);
    
    // Convertir minutos a milisegundos y sumar a la hora inicial
    return new Date(horaInicio.getTime() + (tiempoHastaPC * 60 * 1000));
};

CalculoMarchaController.prototype.setHoraH = function(horaString) {
    var [horas, minutos] = horaString.split(':').map(Number);
    var fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);
    this.estado.horaH = fecha;
};


CalculoMarchaController.prototype.mostrarDetallesColumna = function(columnaId) {
    var columna = this.encontrarColumna(columnaId);
    if (!columna) return;

    var modal = document.createElement('div');
    modal.className = 'modal-detalles';
    
    var contenidoModal = [
        '<div class="modal-contenido">',
        '    <h3>Detalles de ' + columna.nombre + '</h3>',
        '    <div class="detalles-scroll">',
        '        <table class="tabla-detalles">',
        '            <thead>',
        '                <tr>',
        '                    <th>Distancia</th>',
        '                    <th>Tiempo</th>',
        '                    <th>Pendiente</th>',
        '                    <th>Factor Terreno</th>',
        '                    <th>Observaciones</th>',
        '                </tr>',
        '            </thead>',
        '            <tbody>',
        columna.progresion.map(function(punto) {
            return [
                '<tr>',
                '    <td>' + (punto.distanciaAcumulada/1000).toFixed(2) + ' km</td>',
                '    <td>' + this.formatearTiempo(punto.tiempoAcumulado) + '</td>',
                '    <td>' + punto.pendiente.toFixed(1) + '%</td>',
                '    <td>' + punto.factorTerreno.toFixed(2) + '</td>',
                '    <td>' + this.generarObservaciones(punto) + '</td>',
                '</tr>'
            ].join('\n');
        }, this).join('\n'),
        '            </tbody>',
        '        </table>',
        '    </div>',
        '    <button class="btn-cerrar">Cerrar</button>',
        '</div>'
    ].join('\n');

    modal.innerHTML = contenidoModal;
    
    modal.querySelector('.btn-cerrar').addEventListener('click', function() {
        modal.remove();
    });

    document.body.appendChild(modal);
};



CalculoMarchaController.prototype.generarObservaciones = function(punto) {
    var observaciones = [];
    
    if (Math.abs(punto.pendiente) > 20) {
        observaciones.push(punto.pendiente > 0 ? 'Pendiente pronunciada ↑' : 'Pendiente pronunciada ↓');
    }
    
    if (punto.factorTerreno > 1.5) {
        observaciones.push('Terreno difícil');
    }

    if (punto.esAlto) {
        observaciones.push('Alto programado');
    }

    return observaciones.join(', ') || '-';
};


CalculoMarchaController.prototype.calcularTiemposPCPorColumna = function(columna, puntoControl, serieIndex, columnaIndex) {
    // Encontrar el punto más cercano en los puntos de progresión de la columna
    const puntoMasCercano = columna.puntos.reduce((mas_cercano, punto) => {
        const distanciaDiferencia = Math.abs(punto.distancia - puntoControl.distanciaAcumulada);
        if (!mas_cercano || distanciaDiferencia < Math.abs(mas_cercano.distancia - puntoControl.distanciaAcumulada)) {
            return punto;
        }
        return mas_cercano;
    });

    if (puntoMasCercano) {
        return {
            tiempoHead: puntoMasCercano.tiempoHead,
            tiempoTail: puntoMasCercano.tiempoTail
        };
    }

    return null;
};



CalculoMarchaController.prototype.calcularAltosColumna = function(columna, tiempoInicio) {
    const altos = [];
    const intervaloAlto = this.estado.altosMarcha.intervalo; // ej: 30 min
    const duracionAlto = this.estado.altosMarcha.duracion;   // ej: 10 min
    const velocidad = columna.velocidadMarcha;               // ej: 60 km/h

    // Calcular los tiempos de alto desde el inicio de la columna
    let tiempoParaAlto = intervaloAlto;
    let distanciaRecorrida = 0;

    while (tiempoParaAlto <= this.calcularTiempoTotal(columna)) {
        // Calcular dónde estará la columna en ese tiempo
        distanciaRecorrida = (tiempoParaAlto / 60) * velocidad;

        altos.push({
            tiempo: tiempoInicio + tiempoParaAlto,
            distancia: distanciaRecorrida,
            duracion: duracionAlto
        });

        tiempoParaAlto += intervaloAlto;
    }

    return altos;
};

CalculoMarchaController.prototype.encontrarColumna = function(columnaId) {
    var columnaEncontrada = null;
    
    this.estado.series.some(function(serie) {
        return serie.columnas.some(function(columna) {
            if (columna.nombre === columnaId) {
                columnaEncontrada = columna;
                return true;
            }
            return false;
        });
    });
    
    return columnaEncontrada;
};

CalculoMarchaController.prototype.mostrarResultados = function(resultados) {
    // Mostrar el panel principal si está oculto
    var panelPrincipal = document.getElementById('calculoMarchaPanel');
    if (panelPrincipal) {
        panelPrincipal.style.display = 'block';
    }

    // Insertar contenido en el div específico
    var container = document.getElementById('calculoMarchaContent');
    if (!container) {
        console.error('No se encontró el contenedor de contenido calculoMarchaContent');
        return;
    }

    container.innerHTML = this.generarHTMLResultados(resultados);
    

    // Inicializar controles de display
    this.inicializarControlesDisplay();
};

CalculoMarchaController.prototype.inicializarControlesDisplay = function() {
    var self = this;
    var panel = document.getElementById('calculoMarchaPanel');
    if (!panel) return;

    // Botón guardar
    var btnSave = panel.querySelector('.btn-save');
    if (btnSave) {
        btnSave.onclick = function() {
            self.exportarResultados();
        };
    }

};



CalculoMarchaController.prototype.inicializarControlesPanel = function() {
    var panel = document.getElementById('calculoMarchaPanel');
    if (!panel) return;

    // Inicializar botón guardar
    var btnSave = panel.querySelector('.btn-save');
    if (btnSave) {
        btnSave.onclick = function() {
            self.exportarResultados();
        };
    }

    // Inicializar botón imprimir
    var btnPrint = panel.querySelector('.btn-print');
    if (btnPrint) {
        btnPrint.onclick = function() {
            window.print();
        };
    }
};


CalculoMarchaController.prototype.calcularDistanciaPC = function(pc, rutaPuntos) {
    let puntoMasCercano = rutaPuntos[0];
    let distanciaMinima = Infinity;

    rutaPuntos.forEach(function(punto) {
        let distancia = L.latLng(pc.lat, pc.lng).distanceTo(L.latLng(punto.lat, punto.lng));
        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            puntoMasCercano = punto;
        }
    });

    return {
        punto: puntoMasCercano,
        distancia: distanciaMinima
    };
};

CalculoMarchaController.prototype.calcularTiemposPC = function() {
    var self = this;
    this.estado.puntosControl.forEach(function(pc) {
        var resultadoPC = self.calcularDistanciaPC(pc, self.estado.rutaMarcha.puntos);
        pc.distanciaAcumulada = resultadoPC.punto.distanciaAcumulada;
        pc.tiempoEstimado = resultadoPC.punto.tiempoAcumulado;
    });
};


// Modificar la función que procesa los puntos de control
CalculoMarchaController.prototype.procesarPuntosControl = function() {
    var puntosControlDOM = document.querySelectorAll('.punto-control.pc');
    this.estado.puntosControl = [];

    puntosControlDOM.forEach((pcElement, index) => {
        var coordsText = pcElement.querySelector('.coord-info').textContent;
        var coords = coordsText.match(/-?\d+\.\d+/g).map(Number);
        
        var proyeccion = this.encontrarPuntoEnRuta({
            lat: coords[0],
            lng: coords[1]
        });

        this.estado.puntosControl.push({
            numero: index + 1,
            lat: coords[0],
            lng: coords[1],
            puntoProyectado: proyeccion.punto,
            distanciaAcumulada: proyeccion.distancia,
            distanciaAlPunto: proyeccion.distanciaAlPunto,
            tiempo: 0 // tiempo de alto en el PC
        });
    });

    // Ordenar por distancia acumulada
    this.estado.puntosControl.sort((a, b) => a.distanciaAcumulada - b.distanciaAcumulada);
};


CalculoMarchaController.prototype.calcularDistanciaEnRuta = function(punto) {
    // Encontrar el punto más cercano en la ruta
    var distanciaMinima = Infinity;
    var distanciaAcumulada = 0;
    var puntoMasCercano = null;

    for (var i = 0; i < this.estado.rutaMarcha.puntos.length - 1; i++) {
        var p1 = this.estado.rutaMarcha.puntos[i];
        var p2 = this.estado.rutaMarcha.puntos[i + 1];
        
        // Calcular proyección del punto sobre el segmento
        var proyeccion = this.proyectarPuntoEnSegmento(punto, p1, p2);
        var distancia = L.latLng(punto.lat, punto.lng).distanceTo(L.latLng(proyeccion.lat, proyeccion.lng));
        
        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            puntoMasCercano = proyeccion;
            distanciaAcumulada = p1.distanciaAcumulada + 
                L.latLng(p1.lat, p1.lng).distanceTo(L.latLng(proyeccion.lat, proyeccion.lng));
        }
    }

    return distanciaAcumulada;
};


CalculoMarchaController.prototype.calcular = function() {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        try {
            // Obtener datos del panel
            self.estado.series = self.obtenerSeriesYColumnas();
            
            // Si no hay series configuradas, crear una serie por defecto
            if (self.estado.series.length === 0) {
                console.log('🔧 No hay series configuradas, creando serie por defecto');
                self.estado.series = [{
                    nombre: 'Serie 1',
                    intervaloAnterior: 0,
                    columnas: [{
                        nombre: 'Columna 1',
                        vehiculos: 10,
                        distanciaIntervehicular: 50,
                        velocidadMarcha: 25,
                        intervaloSiguiente: 0
                    }]
                }];
            }
            
            self.estado.puntosControl = self.obtenerPuntosControl(); // Obtener PCs primero
            
            self.estado.altosMarcha = {
                intervalo: parseInt(document.getElementById('intervaloAltos').value) || 45,
                duracion: parseInt(document.getElementById('duracionAltos').value) || 10,
                inicio: parseInt(document.getElementById('inicioAltos').value) || 0
            };

            // Realizar cálculos
            if (!self.estado.inicializado) {
                self.inicializarDatos()
                    .then(function() {
                        console.log('🔍 DESPUÉS DE INICIALIZAR - Estado:', self.estado);
                        
                        self.calcularTiemposPC();
                        var resultados = self.calcularMarcha();
                        self.mostrarResultados(resultados);
                        resolve(resultados);
                    })
                    .catch(reject);
            } else {
                console.log('🔍 YA INICIALIZADO - Estado:', self.estado);
                self.calcularTiemposPC();
                var resultados = self.calcularMarcha();
                self.mostrarResultados(resultados);
                resolve(resultados);
            }
        } catch (error) {
            console.error("Error en cálculo:", error);
            reject(error);
        }
    });
};

// 1. Función para calcular tiempos de columna
CalculoMarchaController.prototype.calcularTiemposColumna = function(columna, tiempoInicio) {
    if (!this.estado.inicializado || !this.estado.rutaMarcha.puntos.length) {
        throw new Error('Datos de ruta no inicializados');
    }

    // Calcular profundidad temporal de la columna
    const profundidadTemporal = ((columna.vehiculos - 1) * columna.distanciaIntervehicular / 1000) / 
                               columna.velocidadMarcha * 60;

    // Preparar resultados
    const resultados = {
        nombre: columna.nombre,
        tiempoInicio: tiempoInicio,
        vehiculos: columna.vehiculos,
        velocidadMarcha: columna.velocidadMarcha,
        profundidadTemporal: profundidadTemporal,
        puntos: [],
        altos: [],
        tiempoMovimiento: 0,
        tiempoAltos: 0
    };

    let tiempoAcumulado = 0;
    let distanciaAcumulada = 0;
    let tiempoAltosAcumulado = 0;
    let proximoAlto = tiempoInicio + this.estado.altosMarcha.intervalo;
    let velocidadPromedio = 0;
    let contadorSegmentos = 0;

    // Procesar cada punto de la ruta
    this.estado.rutaMarcha.puntos.forEach((punto, index) => {
        const factorTerreno = this.calcularFactorTerreno(punto.pendiente, punto.vegetacion);
        const velocidadAjustada = columna.velocidadMarcha / factorTerreno;
        
        velocidadPromedio += velocidadAjustada;
        contadorSegmentos++;

        if (index === 0) {
            resultados.puntos.push({
                distancia: punto.distanciaAcumulada,
                tiempoHead: tiempoInicio,
                tiempoTail: tiempoInicio + profundidadTemporal,
                factorTerreno: factorTerreno,
                velocidadAjustada: velocidadAjustada,
                esAlto: false
            });
            return;
        }

        const tiempoSegmento = (punto.distanciaSegmento / 1000) / velocidadAjustada * 60;
        const tiempoHastaAqui = tiempoInicio + tiempoAcumulado + tiempoSegmento;

        // Verificar si hay un alto en este segmento
        if (proximoAlto <= tiempoHastaAqui) {
            // Tiempo real del alto incluyendo altos anteriores
            const tiempoRealAlto = proximoAlto + tiempoAltosAcumulado;
            
            // Calcular la distancia exacta del alto
            const tiempoDesdeUltimoSegmento = proximoAlto - (tiempoInicio + tiempoAcumulado);
            const distanciaDesdeUltimoSegmento = (tiempoDesdeUltimoSegmento / 60) * velocidadAjustada * 1000;
            const distanciaAlto = distanciaAcumulada + distanciaDesdeUltimoSegmento;

            // Punto antes del alto
            resultados.puntos.push({
                distancia: distanciaAlto,
                tiempoHead: tiempoRealAlto,
                tiempoTail: tiempoRealAlto + profundidadTemporal,
                factorTerreno: factorTerreno,
                velocidadAjustada: velocidadAjustada,
                esAlto: false
            });

            // Registrar el alto
            resultados.altos.push({
                tiempo: tiempoRealAlto,
                duracion: this.estado.altosMarcha.duracion,
                distancia: distanciaAlto
            });

            // Punto después del alto
            resultados.puntos.push({
                distancia: distanciaAlto,
                tiempoHead: tiempoRealAlto + this.estado.altosMarcha.duracion,
                tiempoTail: tiempoRealAlto + this.estado.altosMarcha.duracion + profundidadTemporal,
                factorTerreno: factorTerreno,
                velocidadAjustada: velocidadAjustada,
                esAlto: false
            });

            tiempoAltosAcumulado += this.estado.altosMarcha.duracion;
            proximoAlto += this.estado.altosMarcha.intervalo;
        }

        // Punto normal con tiempo ajustado por altos
        resultados.puntos.push({
            distancia: punto.distanciaAcumulada,
            tiempoHead: tiempoHastaAqui + tiempoAltosAcumulado,
            tiempoTail: tiempoHastaAqui + tiempoAltosAcumulado + profundidadTemporal,
            factorTerreno: factorTerreno,
            velocidadAjustada: velocidadAjustada,
            esAlto: false
        });

        tiempoAcumulado += tiempoSegmento;
        distanciaAcumulada = punto.distanciaAcumulada;
    });

    resultados.tiempoMovimiento = tiempoAcumulado;
    resultados.tiempoAltos = tiempoAltosAcumulado;
    resultados.tiempoTotal = tiempoAcumulado + tiempoAltosAcumulado;
    resultados.velocidadPromedio = velocidadPromedio / contadorSegmentos;

    return resultados;
};

// 2. Función para calcular tiempo de inicio de serie
CalculoMarchaController.prototype.calcularTiempoInicioSerie = function(serieIndex) {
    if (serieIndex === 0) return 0;
    
    // Obtener la serie anterior
    const serieAnterior = this.estado.series[serieIndex - 1];
    const ultimaColumna = serieAnterior.columnas[serieAnterior.columnas.length - 1];
    
    // El tiempo de inicio es cuando el último vehículo de la última columna 
    // de la serie anterior pasa por el PI más el intervalo entre series
    const tiempoUltimoVehiculoPI = ultimaColumna.puntos[0].tiempoTail;
    const intervaloEntreSeries = this.estado.series[serieIndex].intervaloAnterior || 0;
    
    return tiempoUltimoVehiculoPI + intervaloEntreSeries;
};

// 3. Función principal de cálculo de marcha
CalculoMarchaController.prototype.calcularMarcha = function() {
    if (!this.estado.inicializado) {
        throw new Error('Debe inicializar los datos antes de calcular');
    }

    if (!this.estado.rutaMarcha || !this.estado.rutaMarcha.puntos) {
        throw new Error('No hay datos de ruta para calcular la marcha');
    }

    const resultados = {
        distanciaTotal: this.estado.rutaMarcha.distanciaTotal,
        tiempoTotal: 0,
        series: []
    };

    // Procesar cada serie
    this.estado.series.forEach((serie, indexSerie) => {
        let tiempoInicioSerie = 0;
        
        // Si no es la primera serie, necesitamos los resultados de la anterior
        if (indexSerie > 0) {
            const serieAnterior = resultados.series[indexSerie - 1];
            const ultimaColumnaSerie = serieAnterior.columnas[serieAnterior.columnas.length - 1];
            // El tiempo de inicio es cuando el último vehículo de la última columna 
            // de la serie anterior pasa por el PI más el intervalo entre series
            tiempoInicioSerie = ultimaColumnaSerie.puntos[0].tiempoTail + 
                               (serie.intervaloAnterior || 0);
        }
        
        const tiemposSerie = {
            nombre: serie.nombre,
            tiempoInicio: tiempoInicioSerie,
            columnas: [],
            puntos: [], // Puntos de la serie completa
            tiempoTotal: 0
        };

        let tiempoInicioColumna = tiempoInicioSerie;
        
        // Procesar cada columna
        serie.columnas.forEach((columna, indexColumna) => {
            // Calcular tiempos de la columna
            const tiemposColumna = this.calcularTiemposColumna(columna, tiempoInicioColumna);
            tiemposSerie.columnas.push(tiemposColumna);

            // Para la siguiente columna
            if (indexColumna < serie.columnas.length - 1) {
                tiempoInicioColumna = tiemposColumna.puntos[0].tiempoTail + 
                                    (columna.intervaloSiguiente || 0);
            }

            // Actualizar puntos de la serie
            if (indexColumna === 0) {
                // Primera columna define el head de la serie
                tiemposSerie.puntos = tiemposColumna.puntos.map(p => ({
                    ...p,
                    tiempoSerieHead: p.tiempoHead
                }));
            }
            if (indexColumna === serie.columnas.length - 1) {
                // Última columna define el tail de la serie
                tiemposSerie.puntos.forEach((p, i) => {
                    p.tiempoSerieTail = tiemposColumna.puntos[i].tiempoTail;
                });
            }
        });

        // Calcular tiempo total de la serie
        tiemposSerie.tiempoTotal = tiemposSerie.puntos[tiemposSerie.puntos.length - 1].tiempoSerieTail - 
                                  tiemposSerie.tiempoInicio;

        resultados.series.push(tiemposSerie);
    });

    // Calcular tiempo total de la marcha
    const ultimaSerie = resultados.series[resultados.series.length - 1];
    resultados.tiempoTotal = ultimaSerie.puntos[ultimaSerie.puntos.length - 1].tiempoSerieTail;

    return resultados;
};

CalculoMarchaController.prototype.generarHTMLPuntosControl = function(resultados) {
    if (!this.estado.puntosControl || !this.estado.puntosControl.length) {
        return '<div class="puntos-control-resumen"><h3>No hay Puntos de Control definidos</h3></div>';
    }

    var html = [
        '<div class="puntos-control-resumen">',
        '    <h3>Puntos de Control y Altos</h3>',
        '    <table class="tabla-pc">',
        '        <thead>',
        '            <tr>',
        '                <th>Columna</th>',
        '                <th>Evento</th>',
        '                <th>Distancia</th>',
        '                <th>Hora</th>',
        '            </tr>',
        '        </thead>',
        '        <tbody>'
    ];

    // Para cada serie y columna, crear una lista ordenada de eventos
    resultados.series.forEach((serie, serieIndex) => {
        serie.columnas.forEach((columna, columnaIndex) => {
            const eventos = [];

            // Agregar PCs
            this.estado.puntosControl.forEach(pc => {
                const tiemposPC = this.calcularTiemposPCPorColumna(columna, pc, serieIndex, columnaIndex);
                if (tiemposPC) {
                    eventos.push({
                        tipo: 'PC',
                        nombre: pc.tipo === 'PC' ? `PC ${pc.numero}` : pc.tipo,
                        distancia: pc.distanciaAcumulada,
                        tiempo: tiemposPC.tiempoHead,
                        tiempoTail: tiemposPC.tiempoTail
                    });
                }
            });

            // Agregar altos de marcha
            columna.altos.forEach(alto => {
                eventos.push({
                    tipo: 'Alto',
                    nombre: 'Alto de Marcha',
                    distancia: alto.distancia,
                    tiempo: alto.tiempo,
                    tiempoTail: alto.tiempo + alto.duracion,
                    duracion: alto.duracion
                });
            });

            // Ordenar eventos por tiempo
            eventos.sort((a, b) => a.tiempo - b.tiempo);

            // Agregar encabezado de columna
            html.push(
                '            <tr class="columna-header">',
                '                <td colspan="4"><strong>' + serie.nombre + ' - ' + columna.nombre + '</strong></td>',
                '            </tr>'
            );

            // Generar filas para cada evento
            eventos.forEach(evento => {
                const distanciaKm = (evento.distancia / 1000).toFixed(2);
                const claseEvento = evento.tipo === 'Alto' ? 'alto-marcha' : 'punto-control';
                
                html.push(
                    '            <tr class="' + claseEvento + '">',
                    '                <td></td>',
                    '                <td>' + evento.nombre + '</td>',
                    '                <td>' + distanciaKm + ' km</td>',
                    '                <td>' + this.formatearHora(evento.tiempo) + 
                    (evento.tipo === 'PC' ? 
                        ' - ' + this.formatearHora(evento.tiempoTail) :
                        ' (' + evento.duracion + ' min)') + '</td>',
                    '            </tr>'
                );
            });

            // Agregar separador entre columnas
            html.push(
                '            <tr class="separador">',
                '                <td colspan="4"></td>',
                '            </tr>'
            );
        });
    });

    html.push(
        '        </tbody>',
        '    </table>',
        '</div>'
    );

    return html.join('\n');
};


CalculoMarchaController.prototype.encontrarPuntoEnRuta = function(coordenadas) {
    var puntoMasCercano = null;
    var distanciaMinima = Infinity;
    var distanciaAcumulada = 0;
    var distanciaHastaPunto = 0;

    // Asegurarnos de que tenemos puntos en la ruta
    if (!this.estado.rutaMarcha.puntos || this.estado.rutaMarcha.puntos.length < 2) {
        return {
            punto: null,
            distancia: 0,
            distanciaAlPunto: 0
        };
    }

    // Iterar sobre cada segmento de la ruta
    for (var i = 0; i < this.estado.rutaMarcha.puntos.length - 1; i++) {
        var p1 = this.estado.rutaMarcha.puntos[i];
        var p2 = this.estado.rutaMarcha.puntos[i + 1];
        
        // Crear objetos LatLng para los puntos del segmento
        var punto1 = L.latLng(p1.lat, p1.lng);
        var punto2 = L.latLng(p2.lat, p2.lng);
        var puntoRef = L.latLng(coordenadas.lat, coordenadas.lng);

        // Encontrar el punto más cercano en el segmento actual
        var puntoProyectado = this.proyectarPuntoEnSegmento(puntoRef, punto1, punto2);
        var distancia = puntoRef.distanceTo(puntoProyectado);

        if (distancia < distanciaMinima) {
            distanciaMinima = distancia;
            puntoMasCercano = puntoProyectado;
            
            // Calcular la distancia hasta este punto
            distanciaHastaPunto = distanciaAcumulada + 
                punto1.distanceTo(puntoProyectado);
        }

        // Acumular la distancia del segmento
        distanciaAcumulada += punto1.distanceTo(punto2);
    }

    return {
        punto: puntoMasCercano,
        distancia: distanciaHastaPunto,
        distanciaAlPunto: distanciaMinima
    };
};


CalculoMarchaController.prototype.exportarResultados = function() {
    if (!this.ultimosResultados) {
        mostrarNotificacion('No hay resultados para exportar', 'warning');
        return;
    }
    
    try {
        const html = this.generarHTMLResultados(this.ultimosResultados);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const nombreArchivo = `marcha_${new Date().toISOString().slice(0,10)}.html`;
        
        if (window.saveAs) {
            window.saveAs(blob, nombreArchivo);
        } else {
            // Fallback para navegadores sin FileSaver
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        mostrarNotificacion('Resultados exportados correctamente', 'success');
    } catch (error) {
        console.error('Error exportando resultados:', error);
        mostrarNotificacion('Error al exportar resultados', 'error');
    }
};

CalculoMarchaController.prototype.interpolarPuntosFaltantes = function(puntos) {
    const puntosValidos = [];
    
    for (let i = 0; i < puntos.length; i++) {
        if (this.validarDatosElevacion(puntos[i])) {
            puntosValidos.push(puntos[i]);
        } else {
            // Buscar el punto válido anterior más cercano
            let puntoAnterior = null;
            for (let j = i - 1; j >= 0; j--) {
                if (this.validarDatosElevacion(puntos[j])) {
                    puntoAnterior = puntos[j];
                    break;
                }
            }
            
            // Buscar el punto válido siguiente más cercano
            let puntoSiguiente = null;
            for (let j = i + 1; j < puntos.length; j++) {
                if (this.validarDatosElevacion(puntos[j])) {
                    puntoSiguiente = puntos[j];
                    break;
                }
            }

            // Si tenemos ambos puntos, interpolamos
            if (puntoAnterior && puntoSiguiente) {
                const factor = (i - puntos.indexOf(puntoAnterior)) / 
                             (puntos.indexOf(puntoSiguiente) - puntos.indexOf(puntoAnterior));
                
                const puntoInterpolado = {
                    lat: puntos[i].lat,
                    lng: puntos[i].lng,
                    elevation: puntoAnterior.elevation + 
                              (puntoSiguiente.elevation - puntoAnterior.elevation) * factor,
                    vegetacion: puntoAnterior.vegetacion // Usamos la vegetación del punto anterior
                };
                puntosValidos.push(puntoInterpolado);
            } 
            // Si solo tenemos punto anterior, usamos sus valores
            else if (puntoAnterior) {
                puntosValidos.push({
                    ...puntos[i],
                    elevation: puntoAnterior.elevation,
                    vegetacion: puntoAnterior.vegetacion
                });
            }
            // Si solo tenemos punto siguiente, usamos sus valores
            else if (puntoSiguiente) {
                puntosValidos.push({
                    ...puntos[i],
                    elevation: puntoSiguiente.elevation,
                    vegetacion: puntoSiguiente.vegetacion
                });
            }
            // Si no tenemos ningún punto de referencia, usamos valores por defecto
            else {
                puntosValidos.push({
                    ...puntos[i],
                    elevation: 0,
                    vegetacion: { tipo: 'Suelo desnudo o urbano' }
                });
            }
        }
    }
    
    return puntosValidos;
};

// Inicialización global
window.CalculoMarcha = new CalculoMarchaController();

