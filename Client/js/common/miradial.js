/**
 * MiRadial - Sistema de menú radial para interacción con el mapa
 * Maneja la interacción con hexágonos y unidades, proporcionando menús contextuales
 * según la fase del juego y el tipo de elemento seleccionado.
 */
(function(window) {
    'use strict';

    /**
     * Estilos visuales para los diferentes tipos de menú
     * Define colores y estados para terreno y elementos
     */
    
    const MENU_STYLES = {
        terreno: {
            normal: 'rgba(139, 69, 19, 0.8)',  // marrón
            hover: 'rgba(160, 82, 45, 0.9)'    // marrón más claro
        },
        elemento: {
            normal: 'rgba(128, 128, 128, 0.8)', // gris
            hover: 'rgba(169, 169, 169, 0.9)'   // gris más claro
        },
        mapa: {
            normal: 'rgba(0, 128, 255, 0.8)',   // azul
            hover: 'rgba(64, 160, 255, 0.9)'    // azul más claro
        },
        simboloMilitar: {
            normal: 'rgba(0, 100, 0, 0.8)',     // verde militar
            hover: 'rgba(0, 150, 0, 0.9)'       // verde más claro
        },
        elementoTactico: {
            normal: 'rgba(100, 0, 100, 0.8)',   // púrpura táctico
            hover: 'rgba(150, 0, 150, 0.9)'     // púrpura más claro
        }
    };
    /**
     * Definición de items para cada tipo de menú
     * Sistema unificado para todos los modos y tipos de elementos
     */
    const MENU_ITEMS = {
        // Menú para terreno básico
        terreno: [
            { title: 'Info Terreno', action: 'terrainInfo', icon: 'fas fa-info-circle', tooltip: 'Ver información del terreno' },
            { title: 'Marcar', action: 'toggleMark', icon: 'fas fa-flag', tooltip: 'Marcar/Desmarcar este hexágono' },
            { title: 'Cerrar', action: 'close', icon: 'fas fa-times', tooltip: 'Cerrar menú' }
        ],

        // MODO PLANEAMIENTO
        planeamiento: {
            // Para elementos básicos (puntos, líneas, polígonos)
            elemento: [
                { title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
                { title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' },
                { title: 'Propiedades', action: 'propiedadesElemento', icon: 'fas fa-cog', tooltip: 'Ver/editar propiedades' }
            ],
            // Para líneas de medición específicamente
            lineaMedicion: [
                { title: 'Editar', action: 'editarMedicion', icon: 'fas fa-edit', tooltip: 'Editar medición' },
                { title: 'Eliminar', action: 'eliminarMedicion', icon: 'fas fa-trash-alt', tooltip: 'Eliminar medición' },
                { title: 'Mostrar Perfil', action: 'mostrarPerfil', icon: 'fas fa-chart-line', tooltip: 'Mostrar perfil de elevación' },
                { title: 'Propiedades', action: 'propiedadesMedicion', icon: 'fas fa-ruler', tooltip: 'Ver propiedades de medición' }
            ],
            // Para polígonos de área
            poligonoArea: [
                { title: 'Editar', action: 'editarPoligono', icon: 'fas fa-edit', tooltip: 'Editar polígono' },
                { title: 'Eliminar', action: 'eliminarPoligono', icon: 'fas fa-trash-alt', tooltip: 'Eliminar polígono' },
                { title: 'Calcular Área', action: 'calcularArea', icon: 'fas fa-calculator', tooltip: 'Calcular área' },
                { title: 'Estadísticas', action: 'estadisticasArea', icon: 'fas fa-chart-bar', tooltip: 'Ver estadísticas del área' }
            ],
            // Para símbolos militares
            simboloMilitar: [
                { title: 'Editar', action: 'editarSimbolo', icon: 'fas fa-edit', tooltip: 'Editar símbolo' },
                { title: 'Eliminar', action: 'eliminarSimbolo', icon: 'fas fa-trash-alt', tooltip: 'Eliminar símbolo' },
                { title: 'Cambiar Tipo', action: 'cambiarTipoSimbolo', icon: 'fas fa-exchange-alt', tooltip: 'Cambiar tipo de símbolo' },
                { title: 'Propiedades', action: 'propiedadesSimbolo', icon: 'fas fa-info-circle', tooltip: 'Ver/editar propiedades' },
                { title: 'Duplicar', action: 'duplicarSimbolo', icon: 'fas fa-copy', tooltip: 'Duplicar símbolo' }
            ]
        },

        // MODO JUEGO DE GUERRA (más complejo)
        juegoGuerra: {
            // Menú para terreno en juego de guerra
            terreno: [
                { title: 'Info Terreno', action: 'infoTerrenoJG', icon: 'fas fa-info-circle', tooltip: 'Ver información del terreno' },
                { title: 'Marcar Objetivo', action: 'marcarObjetivo', icon: 'fas fa-bullseye', tooltip: 'Marcar como objetivo' },
                { title: 'Mover Aquí', action: 'moverAqui', icon: 'fas fa-arrows-alt', tooltip: 'Mover unidad seleccionada aquí' },
                { title: 'Cerrar', action: 'close', icon: 'fas fa-times', tooltip: 'Cerrar menú' }
            ],
            // Para unidades propias
            unidadPropia: [
                { title: 'Información', action: 'infoUnidad', icon: 'fas fa-info-circle', tooltip: 'Ver información de la unidad' },
                { title: 'Mover', action: 'moverUnidad', icon: 'fas fa-arrows-alt', tooltip: 'Mover unidad' },
                { title: 'Atacar', action: 'atacarCon', icon: 'fas fa-crosshairs', tooltip: 'Atacar con esta unidad' },
                { title: 'Defender', action: 'defenderCon', icon: 'fas fa-shield-alt', tooltip: 'Posición defensiva' },
                { title: 'Reagrupar', action: 'reagrupar', icon: 'fas fa-users', tooltip: 'Reagrupar unidad' },
                { title: 'Órdenes', action: 'darOrdenes', icon: 'fas fa-list-ul', tooltip: 'Dar órdenes específicas' }
            ],
            // Para unidades enemigas
            unidadEnemiga: [
                { title: 'Información', action: 'infoEnemigo', icon: 'fas fa-info-circle', tooltip: 'Ver información disponible' },
                { title: 'Atacar', action: 'atacarEnemigo', icon: 'fas fa-crosshairs', tooltip: 'Atacar esta unidad' },
                { title: 'Observar', action: 'observarEnemigo', icon: 'fas fa-eye', tooltip: 'Mantener bajo observación' },
                { title: 'Reportar', action: 'reportarEnemigo', icon: 'fas fa-exclamation-triangle', tooltip: 'Reportar contacto' }
            ],
            // Para elementos tácticos
            elementoTactico: [
                { title: 'Información', action: 'infoElemento', icon: 'fas fa-info-circle', tooltip: 'Ver información' },
                { title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
                { title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' },
                { title: 'Usar', action: 'usarElemento', icon: 'fas fa-hand-pointer', tooltip: 'Usar/activar elemento' }
            ]
        },

        // MODO GESTIÓN DE BATALLA
        gestionBatalla: {
            // Para elementos/unidades en GB
            elemento: [
                { 
                    title: 'Información',
                    action: 'informacionGB',
                    icon: 'fas fa-info-circle',
                    tooltip: 'Ver información completa' 
                },
                { 
                    title: 'Centrar',
                    action: 'centrarGB',
                    icon: 'fas fa-crosshairs',
                    tooltip: 'Centrar en elemento'
                },
                { 
                    title: 'Seguir',
                    action: 'trackingGB',
                    icon: 'fas fa-satellite',
                    tooltip: 'Activar seguimiento'
                },
                { 
                    title: 'Mensaje',
                    action: 'enviarMensajeGB',
                    icon: 'fas fa-envelope',
                    tooltip: 'Enviar mensaje'
                },
                { 
                    title: 'Editar',
                    action: 'editarGB',
                    icon: 'fas fa-edit',
                    tooltip: 'Editar elemento' 
                }
            ],
            // Para el mapa en GB
            mapa: [
                {
                    title: 'Agregar',
                    action: 'agregarElementoGB',
                    icon: 'fas fa-plus',
                    tooltip: 'Agregar nuevo elemento'
                },
                {
                    title: 'Centrar',
                    action: 'centrarMapaGB',
                    icon: 'fas fa-compass',
                    tooltip: 'Centrar mapa'
                },
                {
                    title: 'Medir',
                    action: 'medirDistanciaGB',
                    icon: 'fas fa-ruler',
                    tooltip: 'Medir distancia'
                }
            ]
        },

        // MODO CO (Comandante de Operaciones)
        co: {
            // Para elementos organizacionales
            elementoOrganizacional: [
                { title: 'Editar', action: 'editarCO', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
                { title: 'Eliminar', action: 'eliminarCO', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' },
                { title: 'Información', action: 'informacionCO', icon: 'fas fa-info-circle', tooltip: 'Ver información' },
                { title: 'Jerarquía', action: 'verJerarquia', icon: 'fas fa-sitemap', tooltip: 'Ver jerarquía organizacional' }
            ]
        },

        // MODO PREPARACIÓN (fase preparatoria del juego)
        preparacion: [
            { title: 'Editar', action: 'edit', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
            { title: 'Eliminar', action: 'delete', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' }
        ],

        // MODO COMBATE (con submenús complejos para ingenieros)
        combate: {
            ingeniero: {
                contramovilidad: [
                    { title: 'Mina Antitanque', action: 'minaTanque', icon: 'fas fa-bullseye', tooltip: 'Colocar mina antitanque' },
                    { title: 'Mina Antipersonal', action: 'minaPersonal', icon: 'fas fa-user-slash', tooltip: 'Colocar mina antipersonal' },
                    { title: 'Zanja', action: 'zanja', icon: 'fas fa-grip-lines', tooltip: 'Cavar zanja' },
                    { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver al menú anterior' }
                ],
                movilidad: [
                    { title: 'Mejorar Camino', action: 'mejorarCamino', icon: 'fas fa-road', tooltip: 'Mejorar estado del camino' },
                    { title: 'Instalar Puente', action: 'instalarPuente', icon: 'fas fa-archway', tooltip: 'Instalar puente' },
                    { title: 'Volver', action: 'back', icon: 'fas fa-arrow-left', tooltip: 'Volver al menú anterior' }
                ]
            }
        }
    };

    const MiRadial = {
        // Propiedades del sistema
        menuElement: null,           // Elemento DOM del menú actual
        map: null,                   // Referencia al mapa
        selectedHex: null,           // Hexágono seleccionado actualmente
        faseJuego: 'preparacion',    // Fase actual del juego
        previousHighlight: null,     // Referencia al último hexágono resaltado
        markedHexagons: new Set(),   // Conjunto de hexágonos marcados
        menuHistory: [],             // Historial de navegación del menú

        /**
         * Inicializa el sistema de menú radial
         * @param {L.Map} map - Instancia del mapa de Leaflet
         */
        // En miradial.js, modifica el método init
        init: function(map) {
            if (!map) {
                console.error('Se requiere un mapa válido para inicializar MiRadial');
                return;
            }
            
            // Validar que es una instancia de Leaflet
            if (!map.on || typeof map.on !== 'function') {
                console.error('El objeto map no es una instancia válida de Leaflet:', map);
                return;
            }

            this.map = map;
            this.setFaseJuego('preparacion');
            
            // Configurar eventos básicos
            map.on('dblclick', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                
                // Verificar si hay un elemento en la posición
                const elemento = this.buscarElementoEnPosicion(e.latlng);
                if (elemento) {
                    const point = map.latLngToContainerPoint(e.latlng);
                    this.mostrarMenuContextualPara(elemento, point.x, point.y);
                    return;
                }
                
                // Si no hay elemento, verificar hexágono
                if (window.HexGrid) {
                    // MODO HEXAGONAL (Juego de Guerra)
                    const hexagono = window.HexGrid.getHexagonAt(e.latlng);
                    if (hexagono) {
                        this.selectedHex = hexagono;

                        // ✅ MARCAR HEXÁGONO VISUALMENTE (funcionalidad original restaurada)
                        this.toggleHexagonoMarcado(hexagono);

                        console.log('🔸 Hexágono seleccionado por doble click:', e.latlng);

                        // Opcional: mostrar menú contextual
                        // const point = map.latLngToContainerPoint(e.latlng);
                        // this.mostrarMenu(point.x, point.y, 'terreno');
                    }
                } else {
                    // MODO LIBRE (Planeamiento) - mostrar menú de terreno siempre
                    this.selectedHex = null;
                    this.selectedPosition = e.latlng; // Guardar posición para info de terreno
                    const point = map.latLngToContainerPoint(e.latlng);
                    this.mostrarMenu(point.x, point.y, 'terreno');
                }
            });

            // Limpiar el menú al hacer clic en el mapa
            this.map.on('click', () => this.hideMenu());

            this.initStyles();
            console.log('MiRadial inicializado');
            
        },

        /**
         * Alias para init - compatibilidad con código existente
         */
        inicializar: function(map, modo) {
            console.log('🎯 MiRadial.inicializar llamado con:', map, modo);
            return this.init(map);
        },

        /**
         * Inicializa los estilos CSS necesarios para el menú radial
         */
        initStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .radial-menu {
                    position: absolute;
                    z-index: 1000;
                }
                .sector {
                    cursor: pointer;
                    transition: all 0.2s ease-in-out;
                }
                .sector:hover path {
                    fill-opacity: 1;
                }
                .sector foreignObject {
                    pointer-events: none;
                }
                .sector foreignObject i {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    color: white;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                .tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1001;
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Establece la fase actual del juego y actualiza los listeners
         * @param {string} fase - Fase del juego ('preparacion' o 'combate')
         */
        setFaseJuego: function(fase) {
            console.log('Cambiando fase a:', fase);
            this.faseJuego = fase;
            this.updateEventListeners();
        },

        /**
         * Actualiza los event listeners según la fase del juego
         */
        updateEventListeners: function() {
            if (this.map) {
                this.map.off('dblclick');
                this.map.on('dblclick', this.onDoubleClick.bind(this));
            }
        },

        /**
         * Maneja el evento de doble clic en el mapa
         * @param {L.MouseEvent} e - Evento de doble clic
         */
        onDoubleClick: function(e) {
            e.originalEvent.preventDefault();
            e.originalEvent.stopPropagation();
            
            const latlng = e.latlng;
            const point = this.map.latLngToContainerPoint(latlng);
            
            // ✅ PRIORIDAD 1: Verificar si hay un elemento en la posición del clic
            const elementoEnPosicion = this.buscarElementoEnPosicion(latlng);
            if (elementoEnPosicion) {
                console.log('🎯 MiRadial: Elemento encontrado en posición, mostrando menú');
                // Seleccionar el elemento encontrado
                if (typeof window.seleccionarElemento === 'function') {
                    window.seleccionarElemento(elementoEnPosicion);
                } else {
                    window.elementoSeleccionado = elementoEnPosicion;
                }
                // Mostrar menú de elemento
                this.mostrarMenu(point.x, point.y, 'elemento');
                return;
            }
            
            // PRIORIDAD 2: Verificar si hay un elemento ya seleccionado
            if (window.elementoSeleccionado) {
                const bounds = this.getElementBounds(window.elementoSeleccionado);
                if (bounds && this.isPointInBounds(latlng, bounds)) {
                    // El elemento ya está seleccionado, solo mostrar el menú
                    console.log('🎯 MiRadial: Elemento seleccionado en posición, mostrando menú');
                    this.mostrarMenu(point.x, point.y, 'elemento');
                    return;
                } else {
                    // Si el clic no fue en el elemento seleccionado, deseleccionar
                    if (typeof window.deseleccionarElemento === 'function') {
                        window.deseleccionarElemento(window.elementoSeleccionado);
                    } else {
                        window.elementoSeleccionado = null;
                    }
                }
            }
        
            // PRIORIDAD 3: Si no hay elemento, verificar hexágono o mostrar menú de terreno
            console.log('🎯 MiRadial: No hay elemento, verificando hexágono');
            const hexagono = window.HexGrid?.getHexagonAt(latlng);
            if (hexagono) {
                this.selectedHex = hexagono;
                console.log('🎯 MiRadial: Hexágono encontrado, mostrando menú de terreno');
                this.mostrarMenu(point.x, point.y, 'terreno');
                
                if (this.selectedHex.polygon) {
                    this.highlightHex(this.selectedHex.polygon);
                }
            } else {
                // Fallback: mostrar menú de terreno general incluso sin hexágono
                console.log('🎯 MiRadial: Sin hexágono, mostrando menú de terreno general');
                this.selectedHex = { latlng: latlng }; // Crear hexágono virtual
                this.mostrarMenu(point.x, point.y, 'terreno');
            }
        },

            getElementBounds: function(elemento) {
                if (!elemento) return null;
            
                try {
                    if (elemento instanceof L.Marker) {
                        const pos = elemento.getLatLng();
                                    // Aumentar el área de detección para marcadores
                        return L.latLngBounds(
                            [pos.lat - 0.0005, pos.lng - 0.0005],
                            [pos.lat + 0.0005, pos.lng + 0.0005]
                        );
                    } else if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
                        return elemento.getBounds();
                    }
                } catch (error) {
                    console.error('Error al obtener bounds del elemento:', error);
                }
                return null;
            },
            
            isPointInBounds: function(point, bounds) {
                if (!bounds || !point) return false;
                try {
                    if (point.lat && point.lng) {
                        return bounds.contains(point);
                    }
                } catch (error) {
                    console.error('Error al verificar punto en bounds:', error);
                }
                return false;
            },
            
            setFaseJuego: function(fase) {
                console.log('Cambiando fase a:', fase);
                this.faseJuego = fase;
                // No hacemos más cambios para mantener el comportamiento existente
            },

        createMenuSVG: function(items, tipo) {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "radial-menu");
            svg.setAttribute("width", "200");
            svg.setAttribute("height", "200");

            const angleStep = 360 / items.length;
            items.forEach((item, index) => {
                const startAngle = index * angleStep;
                const endAngle = (index + 1) * angleStep;
                const sector = this.createSector(startAngle, endAngle, item, tipo);
                svg.appendChild(sector);
            });

            return svg;
        },

        /**
         * Crea un sector del menú radial
         * @param {number} startAngle - Ángulo inicial del sector
         * @param {number} endAngle - Ángulo final del sector
         * @param {Object} item - Información del item del menú
         * @param {string} tipo - Tipo de menú
         * @returns {SVGElement} Elemento g del sector
         */
        createSector: function(startAngle, endAngle, item, tipo) {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", "sector");
            
            // Crear path del sector
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const radius = 80;
            const innerRadius = 30;
            path.setAttribute("d", this.describeArc(100, 100, innerRadius, radius, startAngle, endAngle));
            
            // Validar que el tipo existe en MENU_STYLES
            const estilo = MENU_STYLES[tipo] || MENU_STYLES.elemento;
            path.setAttribute("fill", estilo.normal);

            // Crear contenedor para el ícono
            const textPoint = this.polarToCartesian(100, 100, 55, (startAngle + endAngle) / 2);
            const iconContainer = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
            iconContainer.setAttribute("x", textPoint.x - 10);
            iconContainer.setAttribute("y", textPoint.y - 10);
            iconContainer.setAttribute("width", "20");
            iconContainer.setAttribute("height", "20");

            // Crear el ícono
            const icon = document.createElement("i");
            icon.className = item.icon;
            icon.style.fontSize = "16px";

            iconContainer.appendChild(icon);
            g.appendChild(path);
            g.appendChild(iconContainer);

            // Crear tooltip
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = item.tooltip;
            g.appendChild(title);

            // Eventos
            g.addEventListener("click", (e) => {
                e.stopPropagation();
                console.log('Click en sector:', item.title);
                this.handleMenuClick(item.action, item.submenu);
            });

            g.addEventListener("mouseover", () => {
                path.setAttribute("fill", estilo.hover);
            });

            g.addEventListener("mouseout", () => {
                path.setAttribute("fill", estilo.normal);
            });

            return g;
        },

        /**
         * Convierte coordenadas polares a cartesianas
         * @param {number} centerX - Centro X
         * @param {number} centerY - Centro Y
         * @param {number} radius - Radio
         * @param {number} angleInDegrees - Ángulo en grados
         * @returns {Object} Coordenadas {x, y}
         */
        polarToCartesian: function(centerX, centerY, radius, angleInDegrees) {
            const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
            };
        },

        /**
         * Describe un arco para crear el sector del menú
         * @param {number} x - Centro X
         * @param {number} y - Centro Y
         * @param {number} innerRadius - Radio interno
         * @param {number} outerRadius - Radio externo
         * @param {number} startAngle - Ángulo inicial
         * @param {number} endAngle - Ángulo final
         * @returns {string} Comando path SVG
         */
        describeArc: function(x, y, innerRadius, outerRadius, startAngle, endAngle) {
            const start = this.polarToCartesian(x, y, outerRadius, endAngle);
            const end = this.polarToCartesian(x, y, outerRadius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            const innerStart = this.polarToCartesian(x, y, innerRadius, endAngle);
            const innerEnd = this.polarToCartesian(x, y, innerRadius, startAngle);

            return [
                "M", start.x, start.y,
                "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
                "L", innerEnd.x, innerEnd.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
                "Z"
            ].join(" ");
        },

        /**
         * Obtiene los items del menú según el tipo y fase actual
         * @param {string} tipo - Tipo de menú ('terreno' o 'elemento')
         * @returns {Array} Array de items del menú
         */
        // Reemplazar la función getMenuItems
        getMenuItems: function(tipo) {
            // Si estamos en modo GB
            if (window.MAIRA?.modoGB) {
                if (tipo === 'elemento') {
                    return MENU_ITEMS.gb.elemento || [];
                } else if (tipo === 'mapa') {
                    return MENU_ITEMS.gb.mapa || [];
                }
            }

            // Resto de la función para el modo juego de guerra...
            if (tipo === 'terreno') {
                const hexId = this.selectedHex ? 
                    `${this.selectedHex.hex.q},${this.selectedHex.hex.r}` : null;
                const isMarked = hexId && this.markedHexagons.has(hexId);
                
                return [
                    { title: 'Info Terreno', action: 'terrainInfo', icon: 'fas fa-info-circle', tooltip: 'Ver información del terreno' },
                    { 
                        title: isMarked ? 'Desmarcar' : 'Marcar', 
                        action: 'toggleMark', 
                        icon: 'fas fa-flag', 
                        tooltip: isMarked ? 'Desmarcar hexágono' : 'Marcar hexágono'
                    },
                    { title: 'Cerrar', action: 'close', icon: 'fas fa-times', tooltip: 'Cerrar menú' }
                ];
            }
            
            if (this.faseJuego === 'preparacion') {
                return MENU_ITEMS.preparacion;
            } else if (window.elementoSeleccionado) {
                // Determinar tipo de unidad y retornar menú correspondiente
                return this.getCombatMenuItems(window.elementoSeleccionado);
            }
            
            return [];
        },

        /**
         * Obtiene los items del menú de combate según el tipo de unidad
         * @param {L.Marker} unidad - Unidad seleccionada
         * @returns {Array} Array de items del menú
         */
        getCombatMenuItems: function(unidad) {
            if (unidad.options.tipo === 'ingeniero') {
                return [
                    { 
                        title: 'Contramovilidad', 
                        action: 'submenu', 
                        submenu: 'contramovilidad',
                        icon: 'fas fa-ban', 
                        tooltip: 'Acciones de contramovilidad' 
                    },
                    { 
                        title: 'Movilidad', 
                        action: 'submenu', 
                        submenu: 'movilidad',
                        icon: 'fas fa-road', 
                        tooltip: 'Acciones de movilidad' 
                    },
                    { 
                        title: 'Volver', 
                        action: 'back', 
                        icon: 'fas fa-arrow-left', 
                        tooltip: 'Volver al menú anterior' 
                    }
                ];
            }
            
            // Obtener acciones disponibles para la unidad
            return window.acciones.obtenerAccionesDisponibles(unidad)
                .map(accion => ({
                    title: accion.nombre,
                    action: accion.id,
                    icon: accion.icon || 'fas fa-circle',
                    tooltip: accion.descripcion
                }));
        },

        /**
         * Muestra el menú radial en la posición especificada
         * @param {number} x - Posición X en pantalla
         * @param {number} y - Posición Y en pantalla
         * @param {string} tipo - Tipo de menú a mostrar
         */
        
        
        mostrarMenu: function(x, y, tipo) {
            console.log('4. MiRadial.mostrarMenu llamado:', {
                x, y, tipo,
                selectedUnit: this.selectedUnit,
                selectedHex: this.selectedHex
            });
            
            if (!this.map) return;
            this.hideMenu();
            const menuTipo = tipo === 'unidad' ? 'elemento' : tipo;
            const menuItems = this.getMenuItems(menuTipo);

            if (menuItems.length === 0) return;

            this.menuElement = this.createMenuSVG(menuItems, menuTipo);
            
            // IMPORTANTE: Guardar referencia al tipo de menú
            this.currentMenuType = menuTipo;

            // Si se ha seleccionado una unidad, muestra el menú en sus coordenadas
            if (this.selectedUnit) {
                const { lat, lng } = this.selectedUnit.getLatLng();
                const punto = this.map.latLngToContainerPoint([lat, lng]);
                this.positionMenu(punto.x, punto.y);
            } else {
                // Si no hay unidad seleccionada, usa las coordenadas del clic
                this.positionMenu(x, y);
            }

            document.body.appendChild(this.menuElement);
        }, 

        /**
         * Maneja los clics en las opciones del menú
         * @param {string} action - Acción a ejecutar
         * @param {string} submenu - Submenu a mostrar (opcional)
         */



handleMenuClick: function(action, submenu) {
    console.log('Acción seleccionada:', action);
    
    // Si estamos en modo GB
    if (window.MAIRA?.modoGB) {
        switch(action) {
            case 'editarGB':
                console.log("Ejecutando editarElementoSeleccionado");
                if (window.elementoSeleccionadoGB || window.elementoSeleccionado) {
                    // Asegurar que ambas referencias estén sincronizadas
                    if (!window.elementoSeleccionadoGB) window.elementoSeleccionadoGB = window.elementoSeleccionado;
                    if (!window.elementoSeleccionado) window.elementoSeleccionado = window.elementoSeleccionadoGB;
                    
                    // Verificar si la función existe
                    if (typeof window.editarelementoSeleccionadoGB === 'function') {
                        window.editarelementoSeleccionadoGB();
                    } else if (typeof window.editarElementoSeleccionado === 'function') {
                        window.editarElementoSeleccionado();
                    } else {
                        console.error("Función de edición no encontrada");
                    }
                } else {
                    console.error("No hay elemento seleccionado para editar");
                }
                break;
            case 'seguirGB':
                console.log("Iniciando seguimiento de elemento");
                if (window.MAIRA.Elementos?.iniciarSeguimientoElemento) {
                    window.MAIRA.Elementos.iniciarSeguimientoElemento(window.elementoSeleccionadoGB?.options?.id);
                }
                break;
            case 'chatGB':
                console.log("Iniciando chat privado");
                if (window.MAIRA.Chat?.iniciarChatPrivado) {
                    window.MAIRA.Chat.iniciarChatPrivado(window.elementoSeleccionadoGB?.options?.id);
                }
                break;
            case 'agregarGB':
                console.log("Ejecutando agregarMarcadorGB");
                if (window.agregarMarcadorGB) {
                    window.agregarMarcadorGB();
                }
                break;
            case 'centrarGB':
                console.log("Ejecutando centrarEnPosicion");
                if (window.MAIRA.Elementos?.centrarEnPosicion) {
                    window.MAIRA.Elementos.centrarEnPosicion();
                } else if (window.centrarEnPosicion) {
                    window.centrarEnPosicion();
                }
                break;
        }
        
        this.hideMenu();
        return;
    }
    
    // Manejar acciones específicas de elementos
    switch(action) {
        // === ACCIONES PARA SÍMBOLOS MILITARES ===
        case 'editarSimbolo':
            if (window.elementoSeleccionado && typeof window.editarElementoSeleccionado === 'function') {
                window.editarElementoSeleccionado();
            }
            break;
        case 'eliminarSimbolo':
            if (window.elementoSeleccionado && typeof window.eliminarElementoSeleccionado === 'function') {
                window.eliminarElementoSeleccionado(window.elementoSeleccionado);
                window.elementoSeleccionado = null;
            }
            break;
        case 'cambiarTipoSimbolo':
            if (window.elementoSeleccionado && typeof window.mostrarSelectorSimbolos === 'function') {
                window.mostrarSelectorSimbolos(window.elementoSeleccionado);
            }
            break;
        case 'propiedadesSimbolo':
            if (window.elementoSeleccionado && typeof window.mostrarPropiedadesElemento === 'function') {
                window.mostrarPropiedadesElemento(window.elementoSeleccionado);
            }
            break;
        case 'duplicarSimbolo':
            if (window.elementoSeleccionado && typeof window.duplicarElemento === 'function') {
                window.duplicarElemento(window.elementoSeleccionado);
            }
            break;
            
        // === ACCIONES PARA MEDICIONES ===
        case 'editarMedicion':
            if (window.elementoSeleccionado && typeof window.editarElementoSeleccionado === 'function') {
                window.editarElementoSeleccionado();
            }
            break;
        case 'eliminarMedicion':
            if (window.elementoSeleccionado && window.mapa) {
                if (window.calcoActivo) {
                    window.calcoActivo.removeLayer(window.elementoSeleccionado);
                } else {
                    window.mapa.removeLayer(window.elementoSeleccionado);
                }
                window.elementoSeleccionado = null;
                if (typeof window.actualizarElementosCalco === 'function') {
                    window.actualizarElementosCalco();
                }
            }
            break;
        case 'mostrarPerfil':
            if (window.elementoSeleccionado && typeof window.mostrarPerfilElevacion === 'function') {
                window.mostrarPerfilElevacion(window.elementoSeleccionado);
            }
            break;
        case 'propiedadesMedicion':
            if (window.elementoSeleccionado) {
                const distancia = window.elementoSeleccionado.options.distancia || 
                               this.calcularDistanciaLinea(window.elementoSeleccionado);
                alert(`Distancia: ${distancia} metros`);
            }
            break;
            
        // === ACCIONES PARA POLÍGONOS DE ÁREA ===
        case 'editarPoligono':
            if (window.elementoSeleccionado && typeof window.editarPoligono === 'function') {
                window.editarPoligono(window.elementoSeleccionado);
            }
            break;
        case 'eliminarPoligono':
            if (window.elementoSeleccionado && window.mapa) {
                if (window.calcoActivo) {
                    window.calcoActivo.removeLayer(window.elementoSeleccionado);
                } else {
                    window.mapa.removeLayer(window.elementoSeleccionado);
                }
                window.elementoSeleccionado = null;
                if (typeof window.actualizarElementosCalco === 'function') {
                    window.actualizarElementosCalco();
                }
            }
            break;
        case 'calcularArea':
            if (window.elementoSeleccionado && typeof window.calcularAreaPoligono === 'function') {
                const area = window.calcularAreaPoligono(window.elementoSeleccionado);
                alert(`Área: ${area} metros cuadrados`);
            }
            break;
        case 'estadisticasArea':
            if (window.elementoSeleccionado && typeof window.mostrarEstadisticasArea === 'function') {
                window.mostrarEstadisticasArea(window.elementoSeleccionado);
            }
            break;
            
        // === ACCIONES PARA ELEMENTOS TÁCTICOS ===
        case 'editarElemento':
            if (window.elementoSeleccionado && typeof window.editarElementoSeleccionado === 'function') {
                window.editarElementoSeleccionado();
            }
            break;
        case 'eliminarElemento':
            if (window.elementoSeleccionado && typeof window.eliminarElementoSeleccionado === 'function') {
                window.eliminarElementoSeleccionado(window.elementoSeleccionado);
                window.elementoSeleccionado = null;
            }
            break;
        case 'propiedadesElemento':
            if (window.elementoSeleccionado && typeof window.mostrarPropiedadesElemento === 'function') {
                window.mostrarPropiedadesElemento(window.elementoSeleccionado);
            }
            break;
            
        // === ACCIONES DE TERRENO (compatible con hexágonos y modo libre) ===
        case 'infoTerrenoJG':
            if (window.HexGrid && this.selectedHex && typeof window.mostrarInfoTerrenoJG === 'function') {
                // MODO HEXAGONAL: usar función específica de juego de guerra
                window.mostrarInfoTerrenoJG(this.selectedHex);
            } else if (this.selectedPosition || this.selectedHex) {
                // MODO LIBRE O FALLBACK: mostrar información genérica de terreno
                const position = this.selectedPosition || (this.selectedHex ? this.selectedHex.center : null);
                if (position) {
                    this.mostrarInfoTerrenoGenerico(position);
                }
            }
            break;
        case 'marcarObjetivo':
            if (this.selectedHex && typeof window.marcarObjetivo === 'function') {
                window.marcarObjetivo(this.selectedHex);
            }
            break;
        case 'moverAqui':
            if (this.selectedHex && window.elementoSeleccionado && typeof window.moverUnidadA === 'function') {
                window.moverUnidadA(window.elementoSeleccionado, this.selectedHex);
            }
            break;
        case 'infoUnidad':
            // Usar el nuevo panel unificado para mostrar información
            if (window.elementoSeleccionado) {
                if (window.mostrarInformacionElemento) {
                    window.mostrarInformacionElemento(window.elementoSeleccionado);
                } else if (typeof window.mostrarInfoUnidad === 'function') {
                    // Fallback al sistema anterior
                    window.mostrarInfoUnidad(window.elementoSeleccionado);
                }
            }
            break;
        case 'infoElemento':
            // Manejo genérico para cualquier elemento
            if (window.elementoSeleccionado) {
                if (window.mostrarInformacionElemento) {
                    window.mostrarInformacionElemento(window.elementoSeleccionado);
                } else {
                    console.warn('Panel unificado no disponible para mostrar información');
                }
            }
            break;
        case 'moverUnidad':
            if (window.elementoSeleccionado && typeof window.iniciarMovimientoUnidad === 'function') {
                window.iniciarMovimientoUnidad(window.elementoSeleccionado);
            }
            break;
        case 'atacarCon':
            if (window.elementoSeleccionado && typeof window.iniciarAtaque === 'function') {
                window.iniciarAtaque(window.elementoSeleccionado);
            }
            break;
        case 'defenderCon':
            if (window.elementoSeleccionado && typeof window.establecerDefensa === 'function') {
                window.establecerDefensa(window.elementoSeleccionado);
            }
            break;
        case 'close':
            break; // Solo cerrar el menú
            
        // === ACCIONES EXISTENTES (COMPATIBILIDAD) ===
                case 'terrainInfo':
                    this.showTerrainInfo();
                    break;
                case 'toggleMark':
                    this.marcarHexagono();
                    break;
                case 'edit':
                    window.editarElementoSeleccionado();
                    break;
                case 'delete':
                    window.eliminarElementoSeleccionado(window.elementoSeleccionado);
                    window.elementoSeleccionado = null;
                    break;
                case 'identify':
                    if (window.elementoSeleccionado?.options?.sidc) {
                            if (esUnidad(window.elementoSeleccionado.options.sidc)) {
                                mostrarPanelEdicionUnidad(window.elementoSeleccionado);
                            } else if (esEquipo(window.elementoSeleccionado.options.sidc)) {
                                mostrarPanelEdicionEquipo(window.elementoSeleccionado);
                            }
                        }
                    break;    
                case 'submenu':
                    if (submenu && MENU_ITEMS.combate.ingeniero[submenu]) {
                        this.showSubmenu(submenu);
                        return; // No ocultar el menú
                    }
                    break;
                case 'back':
                    this.showPreviousMenu();
                    return; // No ocultar el menú
                default:
                    if (this.faseJuego === 'combate' && window.acciones) {
                        window.acciones.ejecutarAccion(action, window.elementoSeleccionado);
                    }
            }

            this.hideMenu();
        },

        /**
         * Calcula la distancia de una línea en metros
         * @param {L.Polyline} linea - Línea a medir
         * @returns {number} Distancia en metros
         */
        calcularDistanciaLinea: function(linea) {
            if (!linea || !linea.getLatLngs) return 0;
            
            const puntos = linea.getLatLngs();
            let distanciaTotal = 0;
            
            for (let i = 1; i < puntos.length; i++) {
                distanciaTotal += puntos[i-1].distanceTo(puntos[i]);
            }
            
            return Math.round(distanciaTotal);
        },

        /**
         * Muestra un submenú del menú radial
         * @param {string} submenuName - Nombre del submenú a mostrar
         */
        showSubmenu: function(submenuName) {
            if (!this.menuElement) return;
            
            const currentMenu = {
                items: this.getMenuItems(this.currentMenuType),
                type: this.currentMenuType
            };
            this.menuHistory.push(currentMenu);
            
            const submenuItems = MENU_ITEMS.combate.ingeniero[submenuName];
            const point = this.getMenuPosition();
            this.mostrarMenu(point.x, point.y, submenuItems);
        },

        /**
         * Vuelve al menú anterior
         */
        showPreviousMenu: function() {
            if (this.menuHistory.length === 0) {
                this.hideMenu();
                return;
            }

            const previousMenu = this.menuHistory.pop();
            const point = this.getMenuPosition();
            this.mostrarMenu(point.x, point.y, previousMenu.type);
        },

        /**
         * ✅ TOGGLE HEXÁGONO MARCADO - Funcionalidad original restaurada
         */
        toggleHexagonoMarcado: function(hexagono) {
            if (hexagono) {
                const oldSelectedHex = this.selectedHex;
                this.selectedHex = hexagono;
                this.marcarHexagono();
                this.selectedHex = oldSelectedHex;
            }
        },

        /**
         * Marca o desmarca un hexágono seleccionado
         */
        marcarHexagono: function() {
            if (this.selectedHex && this.selectedHex.polygon && this.selectedHex.polygon._path) {
                console.log('Toggle marcado de hexágono:', this.selectedHex);
                const hexId = `${this.selectedHex.hex.q},${this.selectedHex.hex.r}`;
                const svgElement = this.selectedHex.polygon._path;
                
                if (!svgElement.classList) {
                    console.warn('⚠️ Elemento SVG sin classList:', svgElement);
                    return;
                }
                
                if (this.markedHexagons.has(hexId)) {
                    // Desmarcar el hexágono quitando la clase CSS `hex-marked`
                    svgElement.classList.remove('hex-marked');
                    this.markedHexagons.delete(hexId);
                } else {
                    // Marcar el hexágono agregando la clase CSS `hex-marked`
                    svgElement.classList.add('hex-marked');
                    this.markedHexagons.add(hexId);
                }
            } else {
                console.warn('⚠️ No se puede marcar hexágono - elementos faltantes:', {
                    selectedHex: !!this.selectedHex,
                    polygon: !!(this.selectedHex && this.selectedHex.polygon),
                    path: !!(this.selectedHex && this.selectedHex.polygon && this.selectedHex.polygon._path)
                });
            }
        },

        /**
         * Muestra la información del terreno en un popup
         */
        showTerrainInfo: function() {
            if (!this.selectedHex) {
                console.warn("No hay hexágono seleccionado");
                return;
            }
        
            try {
                console.log('Procesando hexágono:', this.selectedHex);
                const center = this.selectedHex.center;
                const corners = window.HexGrid.getHexCorners(center);
                
                // Crear el contenido del popup
                const content = `
                    <div class="terrain-info">
                        <h3>Información del Hexágono</h3>
                        <p>Centro: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</p>
                        <p>Área: ${this.calcularAreaHexagono(corners).toFixed(2)} km²</p>
                        <p id="elevacion">Elevación: Calculando...</p>
                        <p id="vegetacion">Vegetación: Calculando...</p>
                    </div>
                `;

                // Mostrar el popup
                const popup = L.popup({
                    maxWidth: 300,
                    className: 'terrain-popup'
                })
                .setLatLng(center)
                .setContent(content)
                .openOn(this.map);

                // Obtener y procesar información de vegetación
                this.processVegetationInfo(corners, popup);
                
                // Calcular y mostrar elevaciones
                this.processElevationInfo(corners, popup);
                
            } catch (error) {
                console.error('Error al mostrar información del terreno:', error);
            }
        },

        /**
         * Procesa y muestra la información de vegetación
         * @param {Array} corners - Esquinas del hexágono
         * @param {L.Popup} popup - Popup donde mostrar la información
         */
        processVegetationInfo: async function(corners, popup) {
            try {
                if (!window.vegetationHandler || typeof window.vegetationHandler.getVegetationInfo !== 'function') {
                    console.warn('⚠️ vegetationHandler no disponible');
                    return;
                }
                
                const vegetaciones = await Promise.all(corners.map(async punto => {
                    const veg = await window.vegetationHandler.getVegetationInfo(punto.lat, punto.lng);
                    console.log(`Vegetación en ${punto.lat.toFixed(4)}, ${punto.lng.toFixed(4)}:`, veg);
                    return veg;
                }));

                const vegetacionesValidas = vegetaciones.filter(v => v !== null);
                if (vegetacionesValidas.length > 0) {
                    const tiposVegetacion = vegetacionesValidas.reduce((acc, veg) => {
                        acc[veg.tipo] = (acc[veg.tipo] || 0) + 1;
                        return acc;
                    }, {});
                    
                    console.log('Tipos de vegetación encontrados:', tiposVegetacion);
                    const tipoMasComun = Object.entries(tiposVegetacion)
                        .sort((a, b) => b[1] - a[1])[0][0];

                    const vegetacionElement = popup.getElement().querySelector('#vegetacion');
                    if (vegetacionElement) {
                        vegetacionElement.textContent = `Vegetación predominante: ${tipoMasComun}`;
                    }
                }
            } catch (error) {
                console.error('Error procesando información de vegetación:', error);
            }
        },

        /**
 * Procesa y muestra la información de elevación
 * @param {Array} corners - Esquinas del hexágono
 * @param {L.Popup} popup - Popup donde mostrar la información
 */
processElevationInfo: async function (corners, popup) {
    try {
        // Obtener elevaciones usando Promise.all para esperar que todas las promesas se resuelvan
        const elevaciones = await Promise.all(
            corners.map(async (punto) => {
                console.log(`Obteniendo elevación para punto (${punto.lat}, ${punto.lng})`);
                const elevacion = await window.elevationHandler.obtenerElevacion(punto.lat, punto.lng);
                console.log(`Elevación obtenida: ${elevacion}m`);
                return elevacion;
            })
        );

        // Filtrar elevaciones válidas
        const elevacionesValidas = elevaciones.filter((e) => e !== null && e !== undefined);
        if (elevacionesValidas.length > 0) {
            // Calcular la elevación promedio
            const elevacionPromedio = elevacionesValidas.reduce((sum, e) => sum + e, 0) / elevacionesValidas.length;

            // Actualizar el contenido del popup con la elevación promedio
            const elevacionElement = popup.getElement().querySelector('#elevacion');
            if (elevacionElement) {
                elevacionElement.textContent = `Elevación promedio: ${elevacionPromedio.toFixed(2)}m`;
            }
            console.log(`Elevación promedio calculada: ${elevacionPromedio.toFixed(2)}m`);
        } else {
            console.warn('No se pudieron obtener elevaciones válidas para este hexágono');
        }
    } catch (error) {
        console.error('Error procesando información de elevación:', error);
    }
},


        /**
         * Resalta visualmente un hexágono
         * @param {L.Polygon} polygon - Polígono del hexágono a resaltar
         */
        highlightHex: function(polygon) {
            // Remover clases previas antes de aplicar nuevos estilos
            if (this.previousHighlight) {
                const element = this.previousHighlight.getElement();
                if (element && element.classList) {
                    element.classList.remove('hex-with-element', 'hex-selected', 'hex-marked');
                }
                this.previousHighlight.setStyle({
                    color: '#666',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.1
                });
            }
        
            // Obtener el elemento SVG del polígono y verificar si se encuentra
            const svgElement = polygon.getElement();
            if (!svgElement) {
                console.error('No se pudo obtener el elemento SVG del polígono para resaltar');
                return;
            }
        
            // Verificar si el elemento seleccionado está en el hexágono actual
            if (window.elementoSeleccionado && window.HexGrid) {
                const hexagonAtElement = window.HexGrid.getHexagonAt(window.elementoSeleccionado.getLatLng());
                if (hexagonAtElement && hexagonAtElement.polygon === polygon) {
                    if (svgElement.classList) {
                        svgElement.classList.add('hex-with-element'); // Hexágono con elemento
                        console.log('Clase "hex-with-element" aplicada al hexágono con elemento seleccionado');
                    }
                } else {
                    if (svgElement.classList) {
                        svgElement.classList.add('hex-selected'); // Hexágono seleccionado pero vacío
                        console.log('Clase "hex-selected" aplicada al hexágono vacío');
                    }
                }
            } else {
                if (svgElement.classList) {
                    svgElement.classList.add('hex-selected'); // Hexágono seleccionado sin elemento
                    console.log('Clase "hex-selected" aplicada (no hay elemento seleccionado)');
                }
            }
        
            // Guardar el hexágono actual como el resaltado
            this.previousHighlight = polygon;
        },
        
        /**
         * Calcula el área de un hexágono
         * @param {Array} corners - Esquinas del hexágono
         * @returns {number} Área en kilómetros cuadrados
         */

        calcularAreaHexagono: function(corners) {
            let area = 0;
            for (let i = 0; i < corners.length; i++) {
                let j = (i + 1) % corners.length;
                area += corners[i].lng * corners[j].lat;
                area -= corners[j].lng * corners[i].lat;
            }
            area = Math.abs(area) * 111.319 * 111.319 * Math.cos(corners[0].lat * Math.PI / 180) / 2;
            return area;
        },
        
        /**
         * Posiciona el menú en las coordenadas especificadas
         * @param {number} x - Coordenada X
         * @param {number} y - Coordenada Y
         */

        positionMenu: function(x, y) {
            if (!this.menuElement) return;
            
            this.menuElement.style.position = 'absolute';
            this.menuElement.style.left = `${x -110 }px`;
            this.menuElement.style.top = `${y - 60}px`;
        },

        /**
         * Obtiene la posición actual del menú
         * @returns {Object} Coordenadas {x, y} del menú
         */
        getMenuPosition: function() {
            if (!this.menuElement) return { x: 0, y: 0 };
            
            const rect = this.menuElement.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        },

        // En MiRadial, antes de configurarModoGB
        buscarElementoEnPosicion: function(latlng) {
            let elementoEncontrado = null;
            let distanciaMinima = Infinity;
            
            if (!this.map || !latlng) return null;
            
            const puntoClick = this.map.latLngToContainerPoint(latlng);
            if (!puntoClick) return null;
            const radioDeteccion = 20; // píxeles
            
            // 🔍 BUSCAR PRIORITARIAMENTE EN CALCO ACTIVO
            let capasABuscar = [];
            
            // PRIORIDAD 1: Calco activo (elementos del jugador actual)
            if (window.calcoActivo && window.calcoActivo.eachLayer) {
                capasABuscar.push(window.calcoActivo);
            }
            
            // PRIORIDAD 2: Líneas de medición (si existen)
            if (window.grupoMedicion && window.grupoMedicion.eachLayer) {
                capasABuscar.push(window.grupoMedicion);
            }
            
            // PRIORIDAD 3: Otros elementos solo si no hay nada en el calco activo
            const otrasCapas = [
                window.elementosLayer,
                window.polylineGroup,
                window.polygonGroup
            ].filter(capa => capa && capa.eachLayer);
            
            // Buscar en capas prioritarias primero
            capasABuscar.forEach(capa => {
                capa.eachLayer((layer) => {
                    let distancia = Infinity;
                    
                    if (layer instanceof L.Marker && layer.getLatLng) {
                        // Para marcadores: distancia al punto
                        const latLng = layer.getLatLng();
                        if (latLng && latLng.lat !== undefined && latLng.lng !== undefined) {
                            const puntoMarcador = this.map.latLngToContainerPoint(latLng);
                            distancia = puntoClick.distanceTo(puntoMarcador);
                        }
                    } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                        // Para polígonos/líneas: verificar si el punto está cerca
                        try {
                            const bounds = layer.getBounds();
                            const puntoSuroeste = this.map.latLngToContainerPoint(bounds.getSouthWest());
                            const puntoNoreste = this.map.latLngToContainerPoint(bounds.getNorthEast());
                            
                            // Calcular distancia aproximada al centro del elemento
                            const centroX = (puntoSuroeste.x + puntoNoreste.x) / 2;
                            const centroY = (puntoSuroeste.y + puntoNoreste.y) / 2;
                            const centro = { x: centroX, y: centroY };
                            
                            distancia = Math.sqrt(
                                Math.pow(puntoClick.x - centro.x, 2) + 
                                Math.pow(puntoClick.y - centro.y, 2)
                            );
                        } catch (e) {
                            console.warn('[MiRadial] Error calculando distancia para elemento:', e);
                        }
                    }
                    
                    // Actualizar elemento más cercano si está dentro del radio
                    if (distancia < radioDeteccion && distancia < distanciaMinima) {
                        elementoEncontrado = layer;
                        distanciaMinima = distancia;
                    }
                });
            });
            
            // Si no encontramos nada en capas prioritarias, buscar en otras capas
            if (!elementoEncontrado) {
                otrasCapas.forEach(capa => {
                    capa.eachLayer((layer) => {
                        let distancia = Infinity;
                        
                        if (layer instanceof L.Marker) {
                            const puntoMarcador = this.map.latLngToContainerPoint(layer.getLatLng());
                            distancia = puntoClick.distanceTo(puntoMarcador);
                        } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
                            try {
                                const bounds = layer.getBounds();
                                const puntoSuroeste = this.map.latLngToContainerPoint(bounds.getSouthWest());
                                const puntoNoreste = this.map.latLngToContainerPoint(bounds.getNorthEast());
                                
                                const centroX = (puntoSuroeste.x + puntoNoreste.x) / 2;
                                const centroY = (puntoSuroeste.y + puntoNoreste.y) / 2;
                                const centro = { x: centroX, y: centroY };
                                
                                distancia = Math.sqrt(
                                    Math.pow(puntoClick.x - centro.x, 2) + 
                                    Math.pow(puntoClick.y - centro.y, 2)
                                );
                            } catch (e) {
                                console.warn('[MiRadial] Error calculando distancia para elemento:', e);
                            }
                        }
                        
                        if (distancia < radioDeteccion && distancia < distanciaMinima) {
                            elementoEncontrado = layer;
                            distanciaMinima = distancia;
                        }
                    });
                });
            }
            
            console.log('[MiRadial] Elemento encontrado:', elementoEncontrado, 'distancia:', distanciaMinima);
            return elementoEncontrado;
        },

        /**
         * Detecta automáticamente el tipo de elemento para mostrar el menú apropiado
         * @param {Object} elemento - Elemento de Leaflet
         * @returns {string} - Tipo de elemento detectado
         */
        detectarTipoElemento: function(elemento) {
            if (!elemento) return 'terreno';
            
            // Símbolo militar (MilSymbol)
            if (elemento.options && elemento.options.sidc) {
                return 'simboloMilitar';
            }
            
            // Medición (tiene propiedades de distancia)
            if (elemento instanceof L.Polyline && 
                (elemento.options.tipoElemento === 'lineaMedicion' || 
                 elemento.options.distancia || 
                 elemento.options.nombre && elemento.options.nombre.includes('Medición'))) {
                return 'medicion';
            }
            
            // Polígono de área
            if (elemento instanceof L.Polygon && 
                (elemento.options.tipoElemento === 'poligonoArea' || 
                 elemento.options.area ||
                 elemento.options.nombre && elemento.options.nombre.includes('Área'))) {
                return 'poligonoArea';
            }
            
            // Elemento táctico genérico
            if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
                return 'elementoTactico';
            }
            
            // Marcador genérico
            if (elemento instanceof L.Marker) {
                return 'marcadorGenerico';
            }
            
            return 'elemento';
        },

        /**
         * Muestra el menú contextual apropiado basado en el elemento
         * @param {Object} elemento - Elemento seleccionado
         * @param {number} x - Coordenada X del clic
         * @param {number} y - Coordenada Y del clic
         */
        mostrarMenuContextualPara: function(elemento, x, y) {
            const tipoElemento = this.detectarTipoElemento(elemento);
            const modo = this.faseJuego === 'gb' ? 'juegoGuerra' : 'planeamiento';
            
            console.log(`[MiRadial] Mostrando menú para tipo: ${tipoElemento}, modo: ${modo}`);
            
            // Verificar que existen las configuraciones del menú
            if (!MENU_ITEMS || !MENU_ITEMS[modo]) {
                console.error(`[MiRadial] ❌ Configuración de menú no encontrada para modo: ${modo}`);
                console.log('[MiRadial] MENU_ITEMS disponibles:', Object.keys(MENU_ITEMS || {}));
                return;
            }
            
            // Obtener opciones del menú
            let opciones = MENU_ITEMS[modo][tipoElemento] || MENU_ITEMS[modo]['elemento'] || [];
            
            if (opciones.length === 0) {
                console.warn(`No hay opciones de menú para tipo: ${tipoElemento} en modo: ${modo}`);
                return;
            }
            
            // Guardar elemento seleccionado
            window.elementoSeleccionado = elemento;
            
            // Mostrar menú
            this.mostrarMenu(x, y, tipoElemento, opciones);
        },

        configurarModoGB: function() {
            // Prevenir menú contextual del sistema en todo el mapa
            this.map.getContainer().addEventListener('contextmenu', function(e) {
                e.preventDefault();
                e.stopPropagation();
            });
        
            // Usar el menú radial GB por defecto
            this.faseJuego = 'gb';
        },

        /**
         * Oculta el menú radial y limpia los tooltips
         */
        hideMenu: function() {
            if (this.menuElement && this.menuElement.parentNode) {
                this.menuElement.parentNode.removeChild(this.menuElement);
            }
            this.menuElement = null;
            this.menuHistory = [];
            
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        },

        /**
         * Muestra información genérica de terreno (compatible con hexágonos y modo libre)
         * @param {Object} position - Posición {lat, lng} o hexágono con center
         */
        mostrarInfoTerrenoGenerico: async function(position) {
            try {
                console.log('[MiRadial] 🌍 Mostrando información de terreno genérico para:', position);
                
                const latlng = position.center ? position.center : position;
                if (!latlng || !latlng.lat || !latlng.lng) {
                    console.error('[MiRadial] ❌ Posición inválida para información de terreno');
                    return;
                }

                // Crear contenido del popup
                let content = `
                    <div class="info-terreno-popup">
                        <h4>🌍 Información del Terreno</h4>
                        <div class="terreno-coords">
                            <strong>Coordenadas:</strong><br>
                            Lat: ${latlng.lat.toFixed(6)}<br>
                            Lng: ${latlng.lng.toFixed(6)}
                        </div>
                        <div id="elevacion-info">
                            <strong>Elevación:</strong> <span id="elevacion">Cargando...</span>
                        </div>
                        <div id="vegetacion-info">
                            <strong>Vegetación:</strong> <span id="vegetacion">Cargando...</span>
                        </div>
                `;

                // Si hay hexágono, mostrar información adicional
                if (window.HexGrid && this.selectedHex) {
                    content += `
                        <div class="hex-info">
                            <strong>Hexágono:</strong> ${this.selectedHex.id || 'ID no disponible'}
                        </div>
                    `;
                }

                content += `</div>`;

                // Mostrar popup
                const popup = L.popup({
                    maxWidth: 300,
                    className: 'terreno-info-popup'
                })
                .setLatLng(latlng)
                .setContent(content)
                .openOn(this.map);

                // Obtener información de elevación
                if (window.elevationHandler && typeof window.elevationHandler.obtenerElevacion === 'function') {
                    try {
                        const elevacion = await window.elevationHandler.obtenerElevacion(latlng.lat, latlng.lng);
                        const elevacionElement = popup.getElement().querySelector('#elevacion');
                        if (elevacionElement) {
                            elevacionElement.textContent = `${elevacion}m`;
                        }
                    } catch (error) {
                        console.warn('[MiRadial] ⚠️ Error obteniendo elevación:', error);
                        const elevacionElement = popup.getElement().querySelector('#elevacion');
                        if (elevacionElement) {
                            elevacionElement.textContent = 'No disponible';
                        }
                    }
                }

                // Obtener información de vegetación
                if (window.vegetationHandler && typeof window.vegetationHandler.getVegetationInfo === 'function') {
                    try {
                        const vegetacion = await window.vegetationHandler.getVegetationInfo(latlng.lat, latlng.lng);
                        const vegetacionElement = popup.getElement().querySelector('#vegetacion');
                        if (vegetacionElement) {
                            vegetacionElement.textContent = vegetacion ? vegetacion.tipo : 'No disponible';
                        }
                    } catch (error) {
                        console.warn('[MiRadial] ⚠️ Error obteniendo vegetación:', error);
                        const vegetacionElement = popup.getElement().querySelector('#vegetacion');
                        if (vegetacionElement) {
                            vegetacionElement.textContent = 'No disponible';
                        }
                    }
                }

                console.log('[MiRadial] ✅ Información de terreno mostrada correctamente');

            } catch (error) {
                console.error('[MiRadial] ❌ Error mostrando información de terreno:', error);
            }
        }

        
    };

    // Exponer MiRadial globalmente
    window.MiRadial = MiRadial;

})(window);

// Al final del archivo - AGREGAR:
window.MAIRA = window.MAIRA || {};
window.MAIRA.MenuRadial = {
    init: MiRadial.init.bind(MiRadial),
    mostrar: MiRadial.mostrarMenu.bind(MiRadial),
    ocultar: MiRadial.hideMenu.bind(MiRadial),
    configurarGB: MiRadial.configurarModoGB.bind(MiRadial)
};