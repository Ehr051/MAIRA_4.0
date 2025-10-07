/**
 * Sistema Unificado de Menús Contextuales - MAIRA 4.0
 * Unifica todos los menús contextuales usando la base del menú radial
 * Permite configuraciones específicas por módulo manteniendo consistencia visual
 */

(function(window) {
    'use strict';

    /**
     * Configuraciones de menú por módulo
     * Cada módulo puede tener diferentes opciones pero mantiene la misma estructura
     */
    const MENU_CONFIGURATIONS = {
        // 🎯 Planeamiento - Símbolos, líneas, polígonos
        planeamiento: {
            simbolo: [
                { title: 'Editar', action: 'editarSimbolo', icon: 'fas fa-edit', tooltip: 'Editar símbolo militar' },
                { title: 'Duplicar', action: 'duplicarSimbolo', icon: 'fas fa-copy', tooltip: 'Crear copia del símbolo' },
                { title: 'Rotar', action: 'rotarSimbolo', icon: 'fas fa-redo', tooltip: 'Rotar símbolo' },
                { title: 'Eliminar', action: 'eliminarSimbolo', icon: 'fas fa-trash-alt', tooltip: 'Eliminar símbolo' },
                { title: 'Propiedades', action: 'propiedadesSimbolo', icon: 'fas fa-cog', tooltip: 'Propiedades avanzadas' }
            ],
            linea: [
                { title: 'Editar Puntos', action: 'editarLinea', icon: 'fas fa-edit', tooltip: 'Editar puntos de la línea' },
                { title: 'Agregar Punto', action: 'agregarPunto', icon: 'fas fa-plus', tooltip: 'Agregar punto intermedio' },
                { title: 'Medir', action: 'medirLinea', icon: 'fas fa-ruler', tooltip: 'Medir distancia' },
                { title: 'Estilo', action: 'estiloLinea', icon: 'fas fa-palette', tooltip: 'Cambiar estilo' },
                { title: 'Eliminar', action: 'eliminarLinea', icon: 'fas fa-trash-alt', tooltip: 'Eliminar línea' }
            ],
            poligono: [
                { title: 'Editar Forma', action: 'editarPoligono', icon: 'fas fa-edit', tooltip: 'Editar forma del polígono' },
                { title: 'Medir Área', action: 'medirArea', icon: 'fas fa-crop-alt', tooltip: 'Calcular área' },
                { title: 'Rellenar', action: 'rellenarPoligono', icon: 'fas fa-fill', tooltip: 'Opciones de relleno' },
                { title: 'Convertir', action: 'convertirPoligono', icon: 'fas fa-exchange-alt', tooltip: 'Convertir a otro tipo' },
                { title: 'Eliminar', action: 'eliminarPoligono', icon: 'fas fa-trash-alt', tooltip: 'Eliminar polígono' }
            ],
            mapa: [
                { title: 'Agregar Símbolo', action: 'agregarSimbolo', icon: 'fas fa-plus-circle', tooltip: 'Agregar símbolo militar' },
                { title: 'Dibujar Línea', action: 'dibujarLinea', icon: 'fas fa-minus', tooltip: 'Dibujar línea' },
                { title: 'Dibujar Área', action: 'dibujarArea', icon: 'fas fa-draw-polygon', tooltip: 'Dibujar polígono' },
                { title: 'Medir', action: 'herramientasMedicion', icon: 'fas fa-ruler-combined', tooltip: 'Herramientas de medición' }
            ]
        },

        // ⚔️ Gestión de Batalla - Unidades, órdenes, acciones
        gestionBatalla: {
            unidad: [
                { title: 'Órdenes', action: 'darOrdenes', icon: 'fas fa-clipboard-list', tooltip: 'Dar órdenes a la unidad' },
                { title: 'Estado', action: 'verEstado', icon: 'fas fa-info-circle', tooltip: 'Ver estado de la unidad' },
                { title: 'Mover', action: 'moverUnidad', icon: 'fas fa-arrows-alt', tooltip: 'Mover unidad' },
                { title: 'Atacar', action: 'atacarUnidad', icon: 'fas fa-crosshairs', tooltip: 'Atacar enemigo' },
                { title: 'Chat', action: 'chatUnidad', icon: 'fas fa-comment', tooltip: 'Comunicarse con la unidad' }
            ],
            terreno: [
                { title: 'Desplegar', action: 'desplegarUnidad', icon: 'fas fa-parachute-box', tooltip: 'Desplegar unidad aquí' },
                { title: 'Reconocer', action: 'reconocerArea', icon: 'fas fa-eye', tooltip: 'Reconocer área' },
                { title: 'Fortificar', action: 'fortificarPosicion', icon: 'fas fa-shield-alt', tooltip: 'Fortificar posición' },
                { title: 'Medir Distancia', action: 'medirDistancia', icon: 'fas fa-ruler', tooltip: 'Medir distancia' }
            ]
        },

        // 🗺️ Juego de Guerra - Hexágonos, elementos, movimientos
        juegoGuerra: {
            hexagono: [
                { title: 'Info Terreno', action: 'infoTerreno', icon: 'fas fa-info-circle', tooltip: 'Información del terreno' },
                { title: 'Marcar', action: 'marcarHex', icon: 'fas fa-flag', tooltip: 'Marcar/Desmarcar hexágono' },
                { title: 'Mover Aquí', action: 'moverAqui', icon: 'fas fa-location-arrow', tooltip: 'Mover unidad seleccionada' },
                { title: 'Atacar', action: 'atacarPosicion', icon: 'fas fa-bullseye', tooltip: 'Atacar esta posición' }
            ],
            elemento: [
                { title: 'Seleccionar', action: 'seleccionarElemento', icon: 'fas fa-mouse-pointer', tooltip: 'Seleccionar elemento' },
                { title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', tooltip: 'Editar elemento' },
                { title: 'Seguir', action: 'seguirElemento', icon: 'fas fa-crosshairs', tooltip: 'Seguir elemento' },
                { title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' }
            ]
        },

        // 📐 Comandante de Organización - Elementos organizacionales
        comandanteOrganizacion: {
            elemento: [
                { title: 'Editar', action: 'editarCO', icon: 'fas fa-edit', tooltip: 'Editar elemento organizacional' },
                { title: 'Jerarquía', action: 'verJerarquia', icon: 'fas fa-sitemap', tooltip: 'Ver jerarquía organizacional' },
                { title: 'Asignar', action: 'asignarRecursos', icon: 'fas fa-tasks', tooltip: 'Asignar recursos' },
                { title: 'Reportes', action: 'generarReporte', icon: 'fas fa-chart-bar', tooltip: 'Generar reportes' },
                { title: 'Eliminar', action: 'eliminarCO', icon: 'fas fa-trash-alt', tooltip: 'Eliminar elemento' }
            ],
            mapa: [
                { title: 'Crear Unidad', action: 'crearUnidadCO', icon: 'fas fa-plus-square', tooltip: 'Crear nueva unidad' },
                { title: 'Organigrama', action: 'mostrarOrganigrama', icon: 'fas fa-project-diagram', tooltip: 'Mostrar organigrama' },
                { title: 'Análisis', action: 'analizarArea', icon: 'fas fa-search', tooltip: 'Análisis del área' }
            ]
        }
    };

    /**
     * Estilos visuales por módulo
     */
    const MODULE_STYLES = {
        planeamiento: {
            primary: 'rgba(52, 152, 219, 0.8)',    // Azul para planeamiento
            hover: 'rgba(52, 152, 219, 0.9)',
            border: '#3498db'
        },
        gestionBatalla: {
            primary: 'rgba(231, 76, 60, 0.8)',     // Rojo para batalla
            hover: 'rgba(231, 76, 60, 0.9)',
            border: '#e74c3c'
        },
        juegoGuerra: {
            primary: 'rgba(46, 204, 113, 0.8)',    // Verde para juego
            hover: 'rgba(46, 204, 113, 0.9)',
            border: '#2ecc71'
        },
        comandanteOrganizacion: {
            primary: 'rgba(155, 89, 182, 0.8)',    // Púrpura para CO
            hover: 'rgba(155, 89, 182, 0.9)',
            border: '#9b59b6'
        }
    };

    /**
     * Sistema Unificado de Menús Contextuales
     */
    const MenuContextualUnificado = {
        // Propiedades del sistema
        menuActual: null,
        moduloActivo: null,
        elementoSeleccionado: null,
        posicionMenu: { x: 0, y: 0 },
        
        /**
         * Inicializa el sistema de menús unificado
         * @param {Object} opciones - Configuración inicial
         */
        init: function(opciones = {}) {
            this.moduloActivo = opciones.modulo || 'planeamiento';
            this.inicializarEstilos();
            this.configurarEventosGlobales();
            
            console.log(`🎯 Sistema de Menús Contextuales Unificado inicializado para módulo: ${this.moduloActivo}`);
        },

        /**
         * Configura el módulo activo
         * @param {string} modulo - Nombre del módulo ('planeamiento', 'gestionBatalla', etc.)
         */
        setModulo: function(modulo) {
            if (!MENU_CONFIGURATIONS[modulo]) {
                console.warn(`⚠️ Módulo '${modulo}' no encontrado, usando 'planeamiento' por defecto`);
                modulo = 'planeamiento';
            }
            
            this.moduloActivo = modulo;
            console.log(`📋 Módulo cambiado a: ${modulo}`);
        },

        /**
         * Muestra el menú contextual
         * @param {number} x - Posición X del menú
         * @param {number} y - Posición Y del menú
         * @param {string} tipo - Tipo de menú ('simbolo', 'linea', 'poligono', 'mapa', etc.)
         * @param {Object} elemento - Elemento seleccionado (opcional)
         */
        mostrarMenu: function(x, y, tipo, elemento = null) {
            // Ocultar menú anterior si existe
            this.ocultarMenu();

            const configuracion = MENU_CONFIGURATIONS[this.moduloActivo];
            if (!configuracion || !configuracion[tipo]) {
                console.warn(`⚠️ No hay configuración de menú para ${this.moduloActivo}.${tipo}`);
                return;
            }

            this.elementoSeleccionado = elemento;
            this.posicionMenu = { x, y };

            const menuItems = configuracion[tipo];
            const estilos = MODULE_STYLES[this.moduloActivo];

            this.menuActual = this.crearMenuRadial(x, y, menuItems, estilos);
            document.body.appendChild(this.menuActual);

            // Agregar al calco activo si corresponde
            this.agregarACalcoActivo(elemento, tipo);
        },

        /**
         * Crea el elemento SVG del menú radial
         * @param {number} x - Posición X
         * @param {number} y - Posición Y
         * @param {Array} items - Items del menú
         * @param {Object} estilos - Estilos del módulo
         * @returns {HTMLElement} Elemento del menú
         */
        crearMenuRadial: function(x, y, items, estilos) {
            const radius = 80;
            const centerRadius = 20;
            const menuContainer = document.createElement('div');
            
            menuContainer.className = 'menu-contextual-unificado';
            menuContainer.style.cssText = `
                position: absolute;
                left: ${x - radius}px;
                top: ${y - radius}px;
                width: ${radius * 2}px;
                height: ${radius * 2}px;
                z-index: 10000;
                pointer-events: none;
            `;

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', radius * 2);
            svg.setAttribute('height', radius * 2);
            svg.style.pointerEvents = 'auto';

            // Círculo central
            const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            centerCircle.setAttribute('cx', radius);
            centerCircle.setAttribute('cy', radius);
            centerCircle.setAttribute('r', centerRadius);
            centerCircle.setAttribute('fill', estilos.primary);
            centerCircle.setAttribute('stroke', estilos.border);
            centerCircle.setAttribute('stroke-width', '2');
            svg.appendChild(centerCircle);

            // Crear sectores para cada item
            const angleStep = (2 * Math.PI) / items.length;
            
            items.forEach((item, index) => {
                const angle = angleStep * index - Math.PI / 2;
                const sector = this.crearSectorMenu(
                    radius, radius, 
                    centerRadius, radius - 10,
                    angle, angleStep,
                    item, estilos, index
                );
                svg.appendChild(sector);
            });

            menuContainer.appendChild(svg);
            return menuContainer;
        },

        /**
         * Crea un sector individual del menú
         */
        crearSectorMenu: function(centerX, centerY, innerRadius, outerRadius, startAngle, angleSpan, item, estilos, index) {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'sector-menu'); // SVG elements use setAttribute
            group.style.cursor = 'pointer';

            // Calcular puntos del sector
            const endAngle = startAngle + angleSpan;
            const largeArcFlag = angleSpan > Math.PI ? 1 : 0;

            const x1 = centerX + innerRadius * Math.cos(startAngle);
            const y1 = centerY + innerRadius * Math.sin(startAngle);
            const x2 = centerX + outerRadius * Math.cos(startAngle);
            const y2 = centerY + outerRadius * Math.sin(startAngle);
            const x3 = centerX + outerRadius * Math.cos(endAngle);
            const y3 = centerY + outerRadius * Math.sin(endAngle);
            const x4 = centerX + innerRadius * Math.cos(endAngle);
            const y4 = centerY + innerRadius * Math.sin(endAngle);

            const pathData = [
                `M ${x1} ${y1}`,
                `L ${x2} ${y2}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}`,
                `L ${x4} ${y4}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`,
                'Z'
            ].join(' ');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', estilos.primary);
            path.setAttribute('stroke', estilos.border);
            path.setAttribute('stroke-width', '1');

            // Icono del item
            const iconX = centerX + (innerRadius + outerRadius) / 2 * Math.cos(startAngle + angleSpan / 2);
            const iconY = centerY + (innerRadius + outerRadius) / 2 * Math.sin(startAngle + angleSpan / 2);

            const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            iconGroup.innerHTML = `
                <circle cx="${iconX}" cy="${iconY}" r="12" fill="rgba(255,255,255,0.2)" />
                <text x="${iconX}" y="${iconY + 4}" text-anchor="middle" fill="white" font-family="FontAwesome" font-size="14">
                    ${this.getIconUnicode(item.icon)}
                </text>
            `;

            // Eventos del sector
            group.addEventListener('mouseenter', () => {
                path.setAttribute('fill', estilos.hover);
                this.mostrarTooltip(iconX + centerX - 80, iconY + centerY - 80, item.tooltip);
            });

            group.addEventListener('mouseleave', () => {
                path.setAttribute('fill', estilos.primary);
                this.ocultarTooltip();
            });

            group.addEventListener('click', (e) => {
                e.stopPropagation();
                this.ejecutarAccion(item.action, this.elementoSeleccionado);
                this.ocultarMenu();
            });

            group.appendChild(path);
            group.appendChild(iconGroup);

            return group;
        },

        /**
         * Convierte iconos FontAwesome a Unicode
         */
        getIconUnicode: function(iconClass) {
            const iconMap = {
                'fas fa-edit': '\uf044',
                'fas fa-trash-alt': '\uf2ed',
                'fas fa-copy': '\uf0c5',
                'fas fa-redo': '\uf01e',
                'fas fa-cog': '\uf013',
                'fas fa-plus': '\uf067',
                'fas fa-ruler': '\uf545',
                'fas fa-palette': '\uf53f',
                'fas fa-crop-alt': '\uf565',
                'fas fa-fill': '\uf575',
                'fas fa-exchange-alt': '\uf362',
                'fas fa-plus-circle': '\uf055',
                'fas fa-minus': '\uf068',
                'fas fa-draw-polygon': '\uf5ee',
                'fas fa-ruler-combined': '\uf546'
            };
            return iconMap[iconClass] || '\uf059'; // Default question mark
        },

        /**
         * Muestra tooltip
         */
        mostrarTooltip: function(x, y, texto) {
            this.ocultarTooltip();
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-menu-contextual';
            tooltip.textContent = texto;
            tooltip.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 10001;
                pointer-events: none;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
            
            document.body.appendChild(tooltip);
            this.tooltipActual = tooltip;
        },

        /**
         * Oculta tooltip
         */
        ocultarTooltip: function() {
            if (this.tooltipActual) {
                this.tooltipActual.remove();
                this.tooltipActual = null;
            }
        },

        /**
         * Oculta el menú actual
         */
        ocultarMenu: function() {
            if (this.menuActual) {
                this.menuActual.remove();
                this.menuActual = null;
            }
            this.ocultarTooltip();
        },

        /**
         * Ejecuta la acción seleccionada
         * @param {string} accion - Nombre de la acción
         * @param {Object} elemento - Elemento asociado
         */
        ejecutarAccion: function(accion, elemento) {
            console.log(`🎯 Ejecutando acción: ${accion}`, elemento);

            // Dispatch event para que los módulos puedan escuchar
            const evento = new CustomEvent('menuContextualAccion', {
                detail: {
                    accion: accion,
                    elemento: elemento,
                    modulo: this.moduloActivo,
                    posicion: this.posicionMenu
                }
            });
            
            document.dispatchEvent(evento);

            // Ejecutar handler interno si existe
            const handlerName = `handle${accion.charAt(0).toUpperCase() + accion.slice(1)}`;
            if (typeof this[handlerName] === 'function') {
                this[handlerName](elemento);
            }
        },

        /**
         * Agrega elemento al calco activo
         */
        agregarACalcoActivo: function(elemento, tipo) {
            if (!elemento) return;

            // Verificar si hay un calco activo
            if (window.CalcoManager && window.CalcoManager.calcoActivo) {
                console.log(`📝 Agregando ${tipo} al calco activo:`, elemento);
                
                // Aquí se debería llamar a la función para actualizar el calco
                // Esta es la funcionalidad faltante que mencionaste
                if (typeof window.CalcoManager.actualizarElementoEnCalco === 'function') {
                    window.CalcoManager.actualizarElementoEnCalco(elemento);
                }
            }
        },

        /**
         * Configura eventos globales
         */
        configurarEventosGlobales: function() {
            // Cerrar menú al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.menu-contextual-unificado')) {
                    this.ocultarMenu();
                }
            });

            // Cerrar menú con ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.ocultarMenu();
                }
            });
        },

        /**
         * Inicializa estilos CSS
         */
        inicializarEstilos: function() {
            if (document.getElementById('menu-contextual-styles')) return;

            const style = document.createElement('style');
            style.id = 'menu-contextual-styles';
            style.textContent = `
                .menu-contextual-unificado {
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                }
                
                .sector-menu {
                    transition: all 0.2s ease-in-out;
                }
                
                .tooltip-menu-contextual {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    animation: fadeIn 0.2s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            
            document.head.appendChild(style);
        }
    };

    // Exportar al namespace global
    window.MenuContextualUnificado = MenuContextualUnificado;

    console.log('📋 Sistema de Menús Contextuales Unificado cargado');

})(window);
