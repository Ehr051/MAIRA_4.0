// panelMarcha.js - ES5
// Sistema de gestión del panel de cálculo y gráfico de marcha

(function(window) {
    'use strict';

    // Constantes para SIDC
    var SIDC = {
        PI: 'GFGPGPP---',  // Punto Inicial
        PT: 'GFGPGPE---'   // Punto Terminal
    };

    var PanelMarcha = {
        init: function() {
            this.createDynamicHTML();
            this.attachButtonListeners();
            console.log("Panel inicializado");
        },

        createDynamicHTML: function() {
            var panelContainer = document.getElementById('panelMarchaContainer');
            if (!panelContainer) {
                console.error("Panel container no encontrado");
                return;
            }

            panelContainer.innerHTML = [
                '<div class="panel1">',
                '    <div class="header">',
                '        <h2>Cálculo y Gráfico de Marcha</h2>',
                '        <button id="cerrarPanelMarcha" class="btn-cerrar">×</button>',
                '    </div>',
                
                '        <div class="panel-control">',
                '            <div class="panel-header">',
                '                <h3>Control de Marcha</h3>',
                '            </div>',
                '',
                '            <div id="rutaControl">',
                '                <h4>Ruta de Marcha</h4>',
                '                <button id="btnDibujarRuta" class="btn-action">',
                '                    Dibujar Camino de Marcha',
                '                </button>',
                '            </div>',
                '',
                '            <div id="puntosControlSection">',
                '                <h4>Puntos de Control</h4>',
                '                <button id="btnAgregarPuntoControl" class="btn-action">',
                '                    Agregar Punto de Control',
                '                </button>',
                '                <div id="puntosControlList" class="puntos-list">',
                '                </div>',
                '            </div>',
                '        </div>',
                '',
                '    <div id="panelSeriesContent" class="content">',
                '        <div class="panel-series">',
                '            <div class="panel-header">',
                '                <h3>Series de Marcha</h3>',
                '                <button id="btnAgregarSerie" class="btn-agregar">+ Serie</button>',
                '            </div>',
                '            <div id="seriesContainer" class="series-list">',
                '            </div>',
                '        </div>',
                '',
                '           <div class="panel-control">',
                '            <div class="panel-header">',
                '                <h3>Control de Marcha</h3>',
                '            </div>',
                '            <div id="configAltos">',
                '                <h4>Configuración de Altos</h4>',
                '                <div class="campo-config">',
                '                    <label>Intervalo entre altos (min):</label>',
                '                    <input type="number" id="intervaloAltos" value="45" min="1">',
                '                </div>',
                '                <div class="campo-config">',
                '                    <label>Duración del alto (min):</label>',
                '                    <input type="number" id="duracionAltos" value="10" min="1">',
                '                </div>',
                '                <div class="campo-config">',
                '                    <label>Inicio desde H (min):</label>',
                '                    <input type="number" id="inicioAltos" value="0" min="0">',
                '                </div>',
                '            </div>',
                '',
                '            <div id="botonCalculo">',
                '                <button id="btnCalcularMarcha" class="btn-primary">',
                '                    Calcular Marcha',
                '                </button>',
                '            </div>',
                '            <div id="botonGrafico">',
                '                <button id="btnGraficoMarcha" class="btn-primary">',
                '                    Ver Grafico de Marcha',
                '                </button>',
                '            </div>',
                '            <div id="botonPerfil">',
                '                <button id="btnPerfilElevacion" class="btn-primary">',
                '                    Ver Perfil de elevacion',
                '                </button>',
                '            </div>',
                '        </div>',
                '    </div>',
                '',
                '    <!-- Panel de Resultados de Cálculo -->',
                '    <div id="calculoMarchaPanel" class="sub-panel" style="display: none;">',
                '        <div class="panel-header">',
                '            <h3>Resultados del Cálculo de Marcha</h3>',
                '            <div class="header-buttons">',
                '                <button id="btnFullscreenCalculo" class="btn-icon">⛶</button>',
                '                <button id="btnSaveCalculo" class="btn-icon">💾</button>',
                '                <button id="btnPrintCalculo" class="btn-icon">🖨</button>',
                '                <button id="cerrarPanelCalculo" class="btn-cerrar">×</button>',
                '            </div>',
                '        </div>',
                '        <div id="calculoMarchaContent" class="display-content">',
                '            <!-- Los resultados del cálculo se insertarán aquí -->',
                '        </div>',
                '    </div>',
                '',
                '</div>'
            ].join('\n');
        },

        createSerieHTML: function(numSerie) {
            return [
                '<div class="serie-item">',
                '    <div class="serie-header">',
                '        <div class="serie-info">',
                '            <input type="text" class="serie-nombre" value="Serie ' + numSerie + '">',
                '            <div class="intervalo-serie">',
                '                <label>Intervalo con serie anterior (min):</label>',
                '                <input type="number" class="intervalo-input" value="15" min="0">',
                '            </div>',
                '        </div>',
                '        <button class="btn-eliminar-serie">×</button>', // Mueve el botón de eliminar cerca del nombre
                '    </div>',
                '    <div class="serie-controls">',
                '        <button class="btn-agregar-columna">+ Columna</button>',
                '    </div>',
                '    <div class="columnas-container">',
                '    </div>',
                '</div>'
            ].join('\n');
        },
        
        createColumnaHTML: function(numColumna, esUltima) {
            var html = [
                '<div class="columna-item">',
                '    <div class="columna-header">',
                '        <input type="text" class="columna-nombre" value="Columna ' + numColumna + '">',
                '        <button class="btn-eliminar-columna">×</button>',
                '    </div>',
                '    <div class="columna-content">',
                '        <div class="campo-config">',
                '            <label>Vehículos:</label>',
                '            <input type="number" class="vehiculos-input" value="10" min="1">',
                '        </div>',
                '        <div class="campo-config">',
                '            <label>Distancia intervehicular (m):</label>',
                '            <input type="number" class="distancia-input" value="100" min="0">',
                '        </div>',
                '        <div class="campo-config">',
                '            <label>Velocidad de marcha (km/h):</label>',
                '            <input type="number" class="velocidad-input" value="40" min="1">',
                '        </div>'
            ];
        
            if (!esUltima) {
                html.push(
                    '    <div class="intervalo-columnas">',
                    '        <label>Intervalo con siguiente columna (min):</label>',
                    '        <input type="number" class="intervalo-columnas-input" value="5" min="0">',
                    '    </div>'
                );
            }
        
            html.push('</div>');
            return html.join('\n');
        },
        

        createPuntoControlHTML: function(numero, lat, lng) {
            return [
                '<div class="punto-control pc" data-distancia="0">',
                '    <span>PC</span>',
                '    <input type="text" class="pc-numero" value="' + numero + '">',
                '    <span class="coord-info">(' + lat.toFixed(6) + ', ' + lng.toFixed(6) + ')</span>',
                '    <input type="text" class="pc-descripcion" placeholder="Descripción">',
                '    <input type="color" class="color-pc" value="#2196F3">',
                '</div>'
            ].join('\n');
        },

        toggleFullscreen: function(panelId) {
            const panel = typeof panelId === 'string' ? 
                document.getElementById(panelId) : panelId;
        
            if (!panel) {
                console.warn('Panel no encontrado');
                return;
            }
        
            panel.classList.toggle('fullscreen');
        
            // Manejar redimensionamiento específico según el tipo de panel
            switch(panel.id) {
                case 'graficoMarchaPanel':
                    // Actualizar gráfico de marcha
                    if (window.graficoMarchaController) {
                        window.graficoMarchaController.handleResize();
                    }
                    break;
        
                case 'perfilElevacionDisplay':
                    const svgContainer = panel.querySelector('.svg-container');
                    if (svgContainer) {
                        // Forzar actualización del SVG
                        const svg = d3.select(svgContainer).select('svg');
                        const g = svg.select('g');
                        const margin = { top: 20, right: 30, bottom: 30, left: 50 };
        
                        // Obtener elementos existentes
                        const x = d3.scaleLinear();
                        const y = d3.scaleLinear();
                        const area = d3.area()
                            .x(d => x(d.distanciaAcumulada))
                            .y1(d => y(d.elevation));
                        const line = d3.line()
                            .x(d => x(d.distanciaAcumulada))
                            .y(d => y(d.elevation));
        
                        const mouseArea = g.select('rect');
                        const horizontalGuide = g.select('.mouse-guide-horizontal');
                        const verticalGuide = g.select('.mouse-guide-vertical');
        
                        // Actualizar dimensiones
                        const width = svgContainer.clientWidth - margin.left - margin.right;
                        const height = svgContainer.clientHeight - margin.top - margin.bottom;
        
                        svg.attr('width', width + margin.left + margin.right)
                           .attr('height', height + margin.top + margin.bottom);
        
                        g.attr('transform', `translate(${margin.left},${margin.top})`);
        
                        mouseArea.attr('width', width)
                                .attr('height', height);
        
                        horizontalGuide.attr('x2', width);
                        verticalGuide.attr('y2', height);
        
                        // Actualizar escalas y ejes
                        const xAxis = d3.axisBottom(x);
                        const yAxis = d3.axisLeft(y);
        
                        g.select('.x-axis')
                            .attr('transform', `translate(0,${height})`)
                            .call(xAxis);
        
                        g.select('.y-axis')
                            .call(yAxis);
        
                        // Actualizar área y línea si hay datos
                        const areaPath = g.select('.elevation-area');
                        const linePath = g.select('.elevation-line');
                        if (areaPath.node() && linePath.node()) {
                            area.y0(height);
                            areaPath.attr('d', area);
                            linePath.attr('d', line);
                        }
                    }
                    break;
        
                case 'calculoMarchaPanel':
                    // Actualizar layout de cálculo
                    const content = panel.querySelector('.display-content');
                    if (content) {
                        content.style.height = panel.classList.contains('fullscreen') ? 
                            'calc(100vh - var(--header-height))' : '';
                    }
                    break;
            }
        },

        attachButtonListeners: function() {
            var self = this;
        
            // Botones principales
            this.attachElementListener('btnDibujarRuta', 'click', function() {
                self.medirDistanciaConMarcadores();
            });
        
            this.attachElementListener('btnAgregarSerie', 'click', function() {
                self.agregarSerie();
            });
        
            this.attachElementListener('btnAgregarPuntoControl', 'click', function() {
                self.activarAgregarPuntoControl();
            });
        
            this.attachElementListener('btnCalcularMarcha', 'click', function() {
                console.log('Click en btnCalcularMarcha');
                
                // Debugging: mostrar estado de líneas
                console.log('🔍 Estado de líneas:', window.lineas);
                console.log('🔍 Elemento seleccionado:', window.elementoSeleccionado);
                
                // Verificar si hay una línea dibujada disponible
                if (!window.elementoSeleccionado || !(window.elementoSeleccionado instanceof L.Polyline)) {
                    // Buscar la última línea dibujada
                    var ultimaLinea = null;
                    if (window.lineas && window.lineaActual) {
                        ultimaLinea = window.lineas[window.lineaActual];
                    } else if (window.lineas) {
                        // Buscar la línea más reciente
                        var keys = Object.keys(window.lineas);
                        if (keys.length > 0) {
                            var ultimaKey = keys[keys.length - 1];
                            ultimaLinea = window.lineas[ultimaKey];
                        }
                    }
                    
                    if (ultimaLinea && ultimaLinea.polyline) {
                        console.log('📍 Seleccionando línea para cálculo:', ultimaLinea.nombre);
                        window.elementoSeleccionado = ultimaLinea.polyline;
                        if (typeof seleccionarElemento === 'function') {
                            seleccionarElemento(ultimaLinea.polyline);
                        }
                    } else {
                        alert('Debe dibujar una ruta primero usando "Dibujar Camino de Marcha"');
                        return;
                    }
                }
                
                // Ejecutar cálculo y mostrar resultados
                window.CalculoMarcha.calcular()
                    .then(function(resultados) {
                        console.log('✅ Cálculo completado:', resultados);
                        // El método mostrarResultados ya se llama internamente en CalculoMarcha.calcular()
                        // pero asegurémonos de que el panel esté visible
                        var panel = document.getElementById('calculoMarchaPanel');
                        if (panel) {
                            panel.style.display = 'block';
                        }
                    })
                    .catch(function(error) {
                        console.error('❌ Error en cálculo:', error);
                        alert('Error en el cálculo de marcha: ' + error.message);
                    });
            });

            this.attachElementListener('btnPerfilElevacion', 'click', function() {
                console.log('Click en btnCalcularMarcha');
                window.mostrarPerfilElevacion();
            });

            this.attachElementListener('cerrarPanelMarcha', 'click', function() {
                self.cerrarPanel('panelMarchaContainer');
            });

            this.attachElementListener('btnGraficoMarcha', 'click', function() {
                try {
                    if (typeof window.GraficoMarchaController !== 'function') {
                        console.error('GraficoMarchaController no está definido');
                        return;
                    }
            
                    var panelGrafico = document.getElementById('graficoMarchaPanel');
                    if (!panelGrafico) {
                        console.error('No se encontró el panel del gráfico de marcha');
                        return;
                    }
                    
                    panelGrafico.style.display = 'block';
                    
                    if (!window.CalculoMarcha.estado.inicializado || 
                        !window.CalculoMarcha.estado.rutaMarcha.puntos.length) {
                        console.warn('No hay datos de ruta calculados. Ejecute el cálculo primero.');
                        return;
                    }
            
                    // Obtener resultados y crear el gráfico
                    window.CalculoMarcha.calcular().then(function(resultados) {
                        console.log('Resultados calculados:', resultados);
                        
                        var graficoController = new window.GraficoMarchaController();
                        
                        // Inicializar el gráfico en el contenedor
                        graficoController.inicializar('graficoMarchaPanel');
                        
                        // Procesar y cargar los datos
                        graficoController.procesarDatos(resultados);
                        
                        // Dibujar el gráfico
                        graficoController.dibujarGrafico();
                    }).catch(function(error) {
                        console.error('Error al calcular resultados:', error);
                    });
            
                } catch (error) {
                    console.error('Error al generar el gráfico de marcha:', error);
                }
            });
        
            // Botones específicos de cada panel
            // Perfil de Elevación
            this.attachElementListener('elevation-close-button', 'click', function() {
                self.cerrarPanel('perfilElevacionDisplay');
            });
            this.attachElementListener('btnFullscreenElevation', 'click', function() {
                PanelMarcha.toggleFullscreen('perfilElevacionDisplay');
            });
            this.attachElementListener('btnSaveElevation', 'click', function() {
                guardarDatos('perfilElevacionDisplay');
            });
            this.attachElementListener('btnPrintElevation', 'click', function() {
                imprimirPanel('perfilElevacionDisplay');
            });
        
            // Gráfico de Marcha
            this.attachElementListener('cerrarPanelGrafico', 'click', function() {
                self.cerrarPanel('graficoMarchaPanel');
            });
            this.attachElementListener('btnFullscreenGrafico', 'click', function() {
                PanelMarcha.toggleFullscreen('graficoMarchaPanel');
            });
            this.attachElementListener('btnSaveGrafico', 'click', function() {
                guardarDatos('graficoMarchaPanel');
            });
            this.attachElementListener('btnPrintGrafico', 'click', function() {
                imprimirPanel('graficoMarchaPanel');
            });
        
            // Cálculo de Marcha
            this.attachElementListener('cerrarPanelCalculo', 'click', function() {
                self.cerrarPanel('calculoMarchaPanel');
            });
            this.attachElementListener('btnFullscreenCalculo', 'click', function() {
                PanelMarcha.toggleFullscreen('calculoMarchaPanel');
            });
            this.attachElementListener('btnSaveCalculo', 'click', function() {
                guardarDatos('calculoMarchaPanel');
            });
            this.attachElementListener('btnPrintCalculo', 'click', function() {
                imprimirPanel('calculoMarchaPanel');
            });
        
            // Validar inputs numéricos en el panel
            var inputs = document.querySelectorAll('input[type="number"]');
            Array.prototype.forEach.call(inputs, function(input) {
                input.addEventListener('change', function() {
                    if (this.value < parseInt(this.min)) {
                        this.value = this.min;
                    }
                });
            });
        },
        

        attachElementListener: function(elementId, eventType, handler) {
            var element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(eventType, handler);
            } else {
                console.warn('Elemento ' + elementId + ' no encontrado');
            }
        },

        medirDistanciaConMarcadores: function() {
            console.log("🎯 INICIANDO MEDICIÓN DE MARCHA - Única función autorizada para crear PI/PT");
            var self = this;

            // ✅ CONFIGURAR MODO MARCHA PARA SÍMBOLOS PI/PT (ÚNICA FUNCIÓN AUTORIZADA)
            window.modoMarcha = true;
            window.funcionMedicionActiva = "medirDistanciaConMarcadores"; // ✅ IDENTIFICAR FUNCIÓN ACTIVA
            console.log("🎖️ MODO MARCHA ACTIVADO - Se crearán símbolos PI/PT automáticamente");
            console.log("🔒 Esta es la ÚNICA función que debe activar modo marcha");
            console.log("🔖 Función activa:", window.funcionMedicionActiva);
            
            // Configurar event listeners especiales para marcha
            this.configurarEventListenersMarcha();
            
            // Verificar que tenemos las funciones de medición disponibles
            if (typeof window.medirDistancia === 'function') {
                console.log("📏 Usando sistema de medición global EN MODO MARCHA");
                window.medirDistancia();
                return;
            }
            
            // Si no está disponible el sistema global, usar measurementHandler
            if (typeof window.measurementHandler !== 'undefined' && window.measurementHandler) {
                console.log("📏 Usando measurementHandler EN MODO MARCHA");
                window.measurementHandler.medirDistancia();
                return;
            }
            
            // Fallback manual
            console.log("📏 Iniciando medición manual");
            
            if (window.measuringDistance) {
                if (typeof window.finalizarMedicion === 'function') {
                    window.finalizarMedicion();
                } else if (window.measurementHandler && window.measurementHandler.finalizarMedicion) {
                    window.measurementHandler.finalizarMedicion();
                }
            } else {
                // Iniciar medición
                window.measuringDistance = true;
                if (window.mapa) {
                    window.mapa.getContainer().style.cursor = 'crosshair';
                    console.log("🎯 Cursor cambiado a crosshair");
                    
                    // Verificar si tenemos función crearLinea
                    if (typeof window.crearLinea === 'function') {
                        window.lineaActual = window.crearLinea();
                    } else if (window.measurementHandler && window.measurementHandler.crearLinea) {
                        window.lineaActual = window.measurementHandler.crearLinea();
                    }
                    
                    console.log("✅ Medición iniciada - haz clic en el mapa para comenzar");
                    
                    // Configurar event listeners
                    if (typeof window.addDistancePoint === 'function') {
                        window.mapa.on('click', window.addDistancePoint);
                    }
                    if (typeof window.actualizarDistanciaProvisional === 'function') {
                        window.mapa.on('mousemove', window.actualizarDistanciaProvisional);
                    }
                } else {
                    console.error("❌ No hay mapa disponible");
                }
            }
        },

        // ✅ NUEVA FUNCIÓN: Configurar eventos especiales para modo marcha
        configurarEventListenersMarcha: function() {
            var self = this;
            console.log("🎖️ Configurando event listeners especiales para modo marcha");
            
            // Interceptar el primer y último punto para PI/PT
            var originalAddDistancePoint = window.addDistancePoint;
            window.contadorPuntosMarcha = 0;
            
            window.addDistancePoint = function(e) {
                // Llamar la función original
                if (originalAddDistancePoint) {
                    originalAddDistancePoint(e);
                }
                
                // Agregar símbolos PI/PT según el contexto
                window.contadorPuntosMarcha++;
                var latlng = e.latlng;
                
                if (window.contadorPuntosMarcha === 1) {
                    // Primer punto: crear PI
                    console.log("🎖️ Creando símbolo PI en primer punto de marcha");
                    self.crearSimboloPIPT(latlng, 'PI');
                }
                
                // El PT se crea al finalizar la medición
            };
            
            // Interceptar finalización para crear PT
            var originalFinalizarMedicion = window.finalizarMedicion;
            window.finalizarMedicion = function() {
                // Crear PT en el último punto si hay puntos
                if (window.contadorPuntosMarcha > 0 && window.measurementHandler && window.measurementHandler.lineaActual) {
                    var linea = window.measurementHandler.lineas[window.measurementHandler.lineaActual];
                    if (linea && linea.polyline) {
                        var puntos = linea.polyline.getLatLngs();
                        if (puntos.length > 0) {
                            var ultimoPunto = puntos[puntos.length - 1];
                            console.log("🎖️ Creando símbolo PT en último punto de marcha");
                            self.crearSimboloPIPT(ultimoPunto, 'PT');
                        }
                    }
                }
                
                // Llamar función original
                if (originalFinalizarMedicion) {
                    originalFinalizarMedicion();
                }
                
                // Limpiar modo marcha
                window.modoMarcha = false;
                window.contadorPuntosMarcha = 0;
                console.log("🎖️ Modo marcha finalizado");
            };
        },

        // ✅ NUEVA FUNCIÓN: Crear símbolos PI/PT usando milsymbol.js
        crearSimboloPIPT: function(latlng, tipo) {
            console.log("🎖️ Creando símbolo militar", tipo, "en coordenadas:", latlng);
            
            // ✅ USAR EXACTAMENTE EL MISMO CÓDIGO QUE simbolosP.js
            if (typeof window.ms === 'undefined') {
                console.warn("milsymbol.js no disponible, usando marcador simple para", tipo);
                // Fallback con marcador simple
                var marker = L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'simple-militar-marker',
                        html: `<div style="background: black; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 12px;">${tipo}</div>`,
                        iconSize: [30, 20],
                        iconAnchor: [15, 10]
                    })
                });
                
                if (window.mapa) {
                    marker.addTo(window.mapa);
                }
                return marker;
            }
            
            // ✅ CONFIGURACIÓN IDÉNTICA A simbolosP.js
            var sidc = 'GFGPGPP---'; // Mismo SIDC que simbolosP.js
            
            var symbol = new ms.Symbol(sidc, {
                size: 35,                      // ✅ Mismo tamaño que simbolosP.js
                uniqueDesignation: tipo,       // "PI" o "PT" en el símbolo
                infoFields: false,             // ✅ Mismo que simbolosP.js
                colorMode: "Light",            // ✅ Mismo que simbolosP.js
                fill: true,                    // ✅ Mismo que simbolosP.js
                monoColor: "black"             // ✅ NEGRO como simbolosP.js
            });
            
            // ✅ CREAR MARCADOR CON CONFIGURACIÓN CORRECTA DE POSICIONAMIENTO
            var icon = L.divIcon({
                html: symbol.asSVG(),
                iconSize: [35, 35],
                iconAnchor: [20, 40],  // ✅ CONFIGURACIÓN CORREGIDA para posicionamiento correcto
                className: 'military-symbol-marker ' + tipo.toLowerCase()
            });
            
            var marker = L.marker(latlng, {
                icon: icon,
                draggable: false,
                tipo: tipo,
                sidc: sidc
            });
            
            // ✅ AGREGAR AL MAPA Y A LA LISTA DE PUNTOS DE CONTROL
            if (window.mapa) {
                marker.addTo(window.mapa);
            }
            
            // Agregar automáticamente a la lista de puntos de control
            this.agregarPuntoControlAutomatico(latlng.lat, latlng.lng, tipo);
            
            console.log("✅ Símbolo", tipo, "creado correctamente");
            return marker;
        },

        // ✅ NUEVA FUNCIÓN: Agregar PI/PT a lista de puntos de control automáticamente
        agregarPuntoControlAutomatico: function(lat, lng, tipo) {
            var puntosControlList = document.getElementById('puntosControlList');
            if (!puntosControlList) {
                console.warn("Lista de puntos de control no encontrada");
                return;
            }
            
            // Crear elemento de punto de control especial para PI/PT
            var puntoHTML = [
                '<div class="punto-control pc ' + tipo.toLowerCase() + '" data-distancia="0">',
                '    <span class="tipo-punto">' + tipo + '</span>',
                '    <span class="coord-info">(' + lat.toFixed(6) + ', ' + lng.toFixed(6) + ')</span>',
                '    <input type="text" class="pc-descripcion" placeholder="' + (tipo === 'PI' ? 'Punto Inicial' : 'Punto Terminal') + '">',
                '    <input type="color" class="color-pc" value="' + (tipo === 'PI' ? '#FF0000' : '#0000FF') + '">',
                '</div>'
            ].join('\n');
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = puntoHTML;
            var puntoElement = tempDiv.firstElementChild;
            
            if (tipo === 'PI') {
                // PI va al principio
                puntosControlList.insertBefore(puntoElement, puntosControlList.firstChild);
            } else {
                // PT va al final
                puntosControlList.appendChild(puntoElement);
            }
            
            console.log("✅ Punto de control", tipo, "agregado automáticamente a la lista");
        },

        agregarSerie: function() {
            var container = document.getElementById('seriesContainer');
            if (!container) return;

            var numSerie = container.children.length + 1;
            var serieHTML = this.createSerieHTML(numSerie);
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = serieHTML;
            var serieElement = tempDiv.firstElementChild;
            
            this.attachSerieListeners(serieElement);
            container.appendChild(serieElement);

            // Agregar primera columna automáticamente
            this.agregarColumna(serieElement.querySelector('.columnas-container'));
        },

        agregarColumna: function(columnasContainer) {
            if (!columnasContainer) return;
            
            var numColumna = columnasContainer.children.length + 1;
            var esUltima = true;
            
            var columnaHTML = this.createColumnaHTML(numColumna, esUltima);
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = columnaHTML;
            var columnaElement = tempDiv.firstElementChild;
            
            this.attachColumnaListeners(columnaElement);
            columnasContainer.appendChild(columnaElement);

            // Actualizar intervalos
            this.actualizarIntervalosColumnas(columnasContainer);
        },

        actualizarIntervalosColumnas: function(container) {
            var columnas = container.getElementsByClassName('columna-item');
            var last = columnas.length - 1;

            Array.prototype.forEach.call(columnas, function(columna, index) {
                var intervaloDiv = columna.querySelector('.intervalo-columnas');

                // Remover intervalo si existe
                if (intervaloDiv) {
                    intervaloDiv.parentNode.removeChild(intervaloDiv);
                }

                // Agregar intervalo si no es la última columna
                if (index < last) {
                    var nuevoIntervalo = document.createElement('div');
                    nuevoIntervalo.className = 'intervalo-columnas';
                    nuevoIntervalo.innerHTML = [
                        '<label>Intervalo con siguiente columna (min):</label>',
                        '<input type="number" class="intervalo-columnas-input" value="5" min="0">'
                    ].join('');
                    columna.appendChild(nuevoIntervalo);
                }
            });
        },

        attachSerieListeners: function(serieElement) {
            var self = this;
            var btnAgregarColumna = serieElement.querySelector('.btn-agregar-columna');
            var btnEliminarSerie = serieElement.querySelector('.btn-eliminar-serie');
            var columnasContainer = serieElement.querySelector('.columnas-container');

            if (btnAgregarColumna) {
                btnAgregarColumna.addEventListener('click', function() {
                    self.agregarColumna(columnasContainer);
                });
            }

            if (btnEliminarSerie) {
                btnEliminarSerie.addEventListener('click', function() {
                    serieElement.parentNode.removeChild(serieElement);
                });
            }
        },

        attachColumnaListeners: function(columnaElement) {
            var self = this;
            var btnEliminar = columnaElement.querySelector('.btn-eliminar-columna');
            
            if (btnEliminar) {
                btnEliminar.addEventListener('click', function() {
                    var container = columnaElement.parentElement;
                    columnaElement.parentNode.removeChild(columnaElement);
                    self.actualizarIntervalosColumnas(container);
                });
            }
        },



        activarAgregarPuntoControl: function() {
            console.log("Modo para agregar punto de control activado");
            var self = this;
            // No deseleccionar la ruta al agregar puntos de control
            window.mapa.once('click', function(e) {
                self.agregarPuntoControl(e.latlng.lat, e.latlng.lng);
            });
        },

        agregarPuntoControl: function(lat, lng) {
            var self = this;
            var container = document.getElementById('puntosControlList');
            if (!container) return;

            var pcCount = container.children.length + 1;
            
            // Crear elemento en el panel
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.createPuntoControlHTML(pcCount, lat, lng);
            var pcElement = tempDiv.firstElementChild;

            // Crear marcador en el calco activo
            var marcador = L.divIcon({
                className: 'marcador-pc',
                html: '<div class="pc-circle">' + pcCount + '</div>',
                iconSize: [35, 35],
                iconAnchor: [20, 20]
            });

            var marker = L.marker([lat, lng], {
                icon: marcador,
                draggable: true
            }).addTo(window.calcoActivo);

            // Vincular elemento y marcador
            pcElement.marker = marker;
            marker.pcElement = pcElement;

            // Actualizar número del marcador cuando cambie en el panel
            var inputNumero = pcElement.querySelector('.pc-numero');
            if (inputNumero) {
                inputNumero.addEventListener('change', function() {
                    var circle = marker.getElement().querySelector('.pc-circle');
                    if (circle) {
                        circle.textContent = this.value;
                    }
                });
            }

            // Actualizar color del marcador
            var inputColor = pcElement.querySelector('.color-pc');
            if (inputColor) {
                inputColor.addEventListener('change', function() {
                    var circle = marker.getElement().querySelector('.pc-circle');
                    if (circle) {
                        circle.style.backgroundColor = this.value;
                    }
                });
            }

            // Actualizar al arrastrar
            marker.on('dragend', function(e) {
                var newLatLng = e.target.getLatLng();
                var coordSpan = pcElement.querySelector('.coord-info');
                if (coordSpan) {
                    coordSpan.textContent = '(' + newLatLng.lat.toFixed(6) + ', ' + 
                                        newLatLng.lng.toFixed(6) + ')';
                }
            });

            // Agregar al panel
            container.appendChild(pcElement);
        },

         cerrarPanel: function (panelId) {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            } else {
                console.warn(`Panel con ID ${panelId} no encontrado`);
            }
        },

        
        calcularTiempoConAltos: function(tiempoBase, altos) {
            var tiempoExtra = 0;
            for (var i = 0; i < altos.length; i++) {
                if (tiempoBase > altos[i].tiempo) {
                    tiempoExtra += altos[i].duracion;
                }
            }
            return tiempoBase + tiempoExtra;
        },
        

        guardarDatos: function (panelId) {
            console.log(`Guardando datos del panel: ${panelId}`);
            // Implementa la lógica de guardado aquí
        },

        addEventListenerCompatible:function (element, event, handler) {
            if (element.addEventListener) {
                element.addEventListener(event, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + event, handler);
            }
        }
    };
    function imprimirPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
    
        const printWindow = window.open('', '_blank');
        const content = panel.querySelector('.display-content');
        const title = panel.querySelector('h3')?.textContent || 'Impresión';
    
        // Clonar SVG si existe
        let svgContent = '';
        const svg = content.querySelector('svg');
        if (svg) {
            const clonedSvg = svg.cloneNode(true);
            
            // Obtener todos los estilos computados
            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .filter(rule => rule.selectorText && 
                                (rule.selectorText.includes('svg') ||
                                 rule.selectorText.includes('axis') ||
                                 rule.selectorText.includes('elevation') ||
                                 rule.selectorText.includes('path')))
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');
    
            // Establecer dimensiones para impresión
            clonedSvg.setAttribute('width', '100%');
            clonedSvg.setAttribute('height', '800px');
            clonedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            svgContent = `
                <style>${styles}</style>
                <div style="width: 100%; height: 800px; background: var(--color-bg);">
                    ${clonedSvg.outerHTML}
                </div>
            `;
        }
    
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    :root {
                        --color-bg: rgba(56, 78, 85, 0.95);
                        --color-primary: #0281a8;
                    }
                    @page {
                        size: landscape;
                        margin: 1cm;
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        background: white;
                    }
                    svg {
                        background: var(--color-bg);
                        max-width: 100% !important;
                        height: 800px !important;
                    }
                    .axis text { fill: white !important; }
                    .axis path, .axis line { stroke: white !important; }
                    .elevation-area { fill: rgba(33, 150, 243, 0.3) !important; }
                    .elevation-line { 
                        stroke: #2196F3 !important;
                        stroke-width: 2.5 !important;
                    }
                </style>
            </head>
            <body>
                <h2>${title}</h2>
                <div class="display-content">
                    ${svgContent || content.innerHTML}
                </div>
            </body>
            </html>
        `);
    
        printWindow.document.close();
        
        // Esperar a que los estilos y SVG se carguen
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    }

    
    // Exportar al objeto global
    window.PanelMarcha = PanelMarcha;

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        window.PanelMarcha.init();
    });

})(window);

