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
        }
    };
    /**
     * Definición de items para cada tipo de menú
     * Incluye títulos, acciones, iconos y tooltips
     */
    const MENU_ITEMS = {
        terreno: [
            { title: 'Info Terreno', action: 'terrainInfo', icon: 'fas fa-info-circle', tooltip: 'Ver información del terreno' },
            { title: 'Marcar', action: 'toggleMark', icon: 'fas fa-flag', tooltip: 'Marcar/Desmarcar este hexágono' },
            { title: 'Cerrar', action: 'close', icon: 'fas fa-times', tooltip: 'Cerrar menú' }
        ],
        preparacion: [
            { title: 'Editar', action: 'edit', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
            { title: 'Eliminar', action: 'delete', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' }
        ],
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
        },
            gb: {
                elemento: [
                    { 
                        title: 'Editar',
                        action: 'editarGB',
                        icon: 'fas fa-edit',
                        tooltip: 'Editar elemento' 
                    },
                    { 
                        title: 'Seguir',
                        action: 'seguirGB',
                        icon: 'fas fa-crosshairs',
                        tooltip: 'Seguir elemento'
                    },
                    { 
                        title: 'Chat',
                        action: 'chatGB',
                        icon: 'fas fa-comment',
                        tooltip: 'Chat privado'
                    }
                ],
                mapa: [
                    {
                        title: 'Agregar',
                        action: 'agregarGB',
                        icon: 'fas fa-plus',
                        tooltip: 'Agregar elemento'
                    },
                    {
                        title: 'Centrar',
                        action: 'centrarGB',
                        icon: 'fas fa-crosshairs',
                        tooltip: 'Centrar mapa'
                    }
                ]
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
            


            this.map = map;
            this.setFaseJuego('preparacion');
            
            // Configurar eventos básicos
            map.on('dblclick', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                
                // Verificar si hay un elemento en la posición
                const elemento = this.buscarElementoEnPosicion(e.latlng);
                if (elemento) {
                    window.elementoSeleccionado = elemento;
                    const point = map.latLngToContainerPoint(e.latlng);
                    this.mostrarMenu(point.x, point.y, 'elemento');
                    return;
                }
                
                // Si no hay elemento, verificar hexágono
                if (window.HexGrid) {
                    const hexagono = window.HexGrid.getHexagonAt(e.latlng);
                    if (hexagono) {
                        this.selectedHex = hexagono;
                        const point = map.latLngToContainerPoint(e.latlng);
                        this.mostrarMenu(point.x, point.y, 'terreno');
                    }
                }
            });

            // Limpiar el menú al hacer clic en el mapa
            this.map.on('click', () => this.hideMenu());

            this.initStyles();
            console.log('MiRadial inicializado');
            
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
            
            // Verificar si hay un elemento seleccionado
            if (window.elementoSeleccionado) {
                const bounds = this.getElementBounds(window.elementoSeleccionado);
                if (bounds && this.isPointInBounds(latlng, bounds)) {
                    // El elemento ya está seleccionado, solo mostrar el menú
                    const point = this.map.latLngToContainerPoint(latlng);
                    this.mostrarMenu(point.x, point.y, 'elemento');
                    return;
                } else {
                    // Si el clic no fue en el elemento seleccionado, deseleccionar
                    deseleccionarElemento(window.elementoSeleccionado);
                }
            }
        
            // Si no hay elemento seleccionado, verificar hexágono
            const hexagono = window.HexGrid?.getHexagonAt(latlng);
            if (hexagono) {
                this.selectedHex = hexagono;
                const point = this.map.latLngToContainerPoint(latlng);
                this.mostrarMenu(point.x, point.y, 'terreno');
                
                if (this.selectedHex.polygon) {
                    this.highlightHex(this.selectedHex.polygon);
                }
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
            path.setAttribute("fill", MENU_STYLES[tipo].normal);

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
                path.setAttribute("fill", MENU_STYLES[tipo].hover);
            });

            g.addEventListener("mouseout", () => {
                path.setAttribute("fill", MENU_STYLES[tipo].normal);
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
  
            switch(action) {
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
         * Marca o desmarca un hexágono seleccionado
         */
        marcarHexagono: function() {
            if (this.selectedHex && this.selectedHex.polygon) {
                console.log('Toggle marcado de hexágono:', this.selectedHex);
                const hexId = `${this.selectedHex.hex.q},${this.selectedHex.hex.r}`;
                
                if (this.markedHexagons.has(hexId)) {
                    // Desmarcar el hexágono quitando la clase CSS `hex-marked`
                    const svgElement = this.selectedHex.polygon._path;
                    svgElement.classList.remove('hex-marked');
                    this.markedHexagons.delete(hexId);
                } else {
                    // Marcar el hexágono agregando la clase CSS `hex-marked`
                    const svgElement = this.selectedHex.polygon._path;
                    svgElement.classList.add('hex-marked');
                    this.markedHexagons.add(hexId);
                }
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
                const vegetaciones = await Promise.all(corners.map(async punto => {
                    const veg = await window.vegetacionHandler.obtenerVegetacionEnPunto(punto.lat, punto.lng);
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
                this.previousHighlight.getElement().classList.remove('hex-with-element', 'hex-selected', 'hex-marked');
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
                    svgElement.classList.add('hex-with-element'); // Hexágono con elemento
                    console.log('Clase "hex-with-element" aplicada al hexágono con elemento seleccionado');
                } else {
                    svgElement.classList.add('hex-selected'); // Hexágono seleccionado pero vacío
                    console.log('Clase "hex-selected" aplicada al hexágono vacío');
                }
            } else {
                svgElement.classList.add('hex-selected'); // Hexágono seleccionado sin elemento
                console.log('Clase "hex-selected" aplicada (no hay elemento seleccionado)');
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
            
            if (!this.map) return null;
            
            const puntoClick = this.map.latLngToContainerPoint(latlng);
            const radioDeteccion = 20; // píxeles
            
            if (window.calcoActivo) {
                window.calcoActivo.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        // Convertir posición del marcador a coordenadas de pantalla
                        const puntoMarcador = this.map.latLngToContainerPoint(layer.getLatLng());
                        
                        // Calcular distancia en píxeles
                        const distancia = puntoClick.distanceTo(puntoMarcador);
                        
                        // Actualizar elemento más cercano si está dentro del radio
                        if (distancia < radioDeteccion && distancia < distanciaMinima) {
                            elementoEncontrado = layer;
                            distanciaMinima = distancia;
                        }
                    }
                });
            }
            
            console.log('[MiRadial] Elemento encontrado:', elementoEncontrado, 'distancia:', distanciaMinima);
            return elementoEncontrado;
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