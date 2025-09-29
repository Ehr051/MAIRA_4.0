/**
 * MAIRA 4.0 - Menú Radial Interactivo Mejorado
 * Sistema de órdenes radial para unidades 3D basado en miradial.js
 */

class RadialMenu {
    constructor() {
        console.log('🏗️ Constructor RadialMenu llamado');

        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 50;
        this.selectedUnit = null;
        this.targetPosition = null;
        this.menuElement = null;
        this.tooltip = null;
        this.currentContext = 'terreno'; // terreno, unidadPropia, unidadEnemiga, elementoTactico
        this.currentMode = 'juegoGuerra'; // juegoGuerra, planeamiento, etc.
        this.actionCallback = null; // Callback para manejar acciones
        this.justShown = false; // Flag para evitar ocultar inmediatamente después de mostrar

        // Definición de menús según contexto (basado en miradial.js)
        this.menuDefinitions = {
            // MODO JUEGO DE GUERRA
            juegoGuerra: {
                terrain: [
                    { id: 'infoTerrenoJG', title: 'Info Terreno', action: 'infoTerrenoJG', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver información del terreno' },
                    { id: 'marcarObjetivo', title: 'Marcar Objetivo', action: 'marcarObjetivo', icon: 'fas fa-bullseye', color: '#FF9800', tooltip: 'Marcar como objetivo' },
                    { id: 'moverAqui', title: 'Mover Aquí', action: 'moverAqui', icon: 'fas fa-arrows-alt', color: '#2196F3', tooltip: 'Mover unidad seleccionada aquí' },
                    { id: 'close', title: 'Cerrar', action: 'close', icon: 'fas fa-times', color: '#9E9E9E', tooltip: 'Cerrar menú' }
                ],
                unidadPropia: [
                    { id: 'infoUnidad', title: 'Información', action: 'infoUnidad', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver información de la unidad' },
                    { id: 'moverUnidad', title: 'Mover', action: 'moverUnidad', icon: 'fas fa-arrows-alt', color: '#2196F3', tooltip: 'Mover unidad' },
                    { id: 'atacarCon', title: 'Atacar', action: 'atacarCon', icon: 'fas fa-crosshairs', color: '#F44336', tooltip: 'Atacar con esta unidad' },
                    { id: 'defenderCon', title: 'Defender', action: 'defenderCon', icon: 'fas fa-shield-alt', color: '#9C27B0', tooltip: 'Posición defensiva' },
                    { id: 'reagrupar', title: 'Reagrupar', action: 'reagrupar', icon: 'fas fa-users', color: '#FF9800', tooltip: 'Reagrupar unidad' },
                    { id: 'darOrdenes', title: 'Órdenes', action: 'darOrdenes', icon: 'fas fa-list-ul', color: '#607D8B', tooltip: 'Dar órdenes específicas' }
                ],
                unidadEnemiga: [
                    { id: 'infoEnemigo', title: 'Información', action: 'infoEnemigo', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver información disponible' },
                    { id: 'atacarEnemigo', title: 'Atacar', action: 'atacarEnemigo', icon: 'fas fa-crosshairs', color: '#F44336', tooltip: 'Atacar esta unidad' },
                    { id: 'observarEnemigo', title: 'Observar', action: 'observarEnemigo', icon: 'fas fa-eye', color: '#FF9800', tooltip: 'Mantener bajo observación' },
                    { id: 'reportarEnemigo', title: 'Reportar', action: 'reportarEnemigo', icon: 'fas fa-exclamation-triangle', color: '#9C27B0', tooltip: 'Reportar contacto' }
                ],
                elementoTactico: [
                    { id: 'infoElemento', title: 'Información', action: 'infoElemento', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver información' },
                    { id: 'editarElemento', title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', color: '#2196F3', tooltip: 'Editar elemento' },
                    { id: 'eliminarElemento', title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', color: '#F44336', tooltip: 'Eliminar elemento' },
                    { id: 'usarElemento', title: 'Usar', action: 'usarElemento', icon: 'fas fa-hand-pointer', color: '#FF9800', tooltip: 'Usar/activar elemento' }
                ]
            },

            // MODO PLANEAMIENTO
            planeamiento: {
                terreno: [
                    { id: 'infoTerreno', title: 'Info Terreno', action: 'infoTerreno', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver información del terreno' },
                    { id: 'marcar', title: 'Marcar', action: 'marcar', icon: 'fas fa-flag', color: '#FF9800', tooltip: 'Marcar/Desmarcar este punto' },
                    { id: 'close', title: 'Cerrar', action: 'close', icon: 'fas fa-times', color: '#9E9E9E', tooltip: 'Cerrar menú' }
                ],
                elemento: [
                    { id: 'editarElemento', title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', color: '#2196F3', tooltip: 'Editar elemento' },
                    { id: 'eliminarElemento', title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', color: '#F44336', tooltip: 'Eliminar elemento' },
                    { id: 'propiedadesElemento', title: 'Propiedades', action: 'propiedadesElemento', icon: 'fas fa-cog', color: '#9C27B0', tooltip: 'Ver/editar propiedades' }
                ],
                simboloMilitar: [
                    { id: 'editarSimbolo', title: 'Editar', action: 'editarSimbolo', icon: 'fas fa-edit', color: '#2196F3', tooltip: 'Editar símbolo' },
                    { id: 'eliminarSimbolo', title: 'Eliminar', action: 'eliminarSimbolo', icon: 'fas fa-trash-alt', color: '#F44336', tooltip: 'Eliminar símbolo' },
                    { id: 'cambiarTipoSimbolo', title: 'Cambiar Tipo', action: 'cambiarTipoSimbolo', icon: 'fas fa-exchange-alt', color: '#FF9800', tooltip: 'Cambiar tipo de símbolo' },
                    { id: 'propiedadesSimbolo', title: 'Propiedades', action: 'propiedadesSimbolo', icon: 'fas fa-info-circle', color: '#4CAF50', tooltip: 'Ver/editar propiedades' },
                    { id: 'duplicarSimbolo', title: 'Duplicar', action: 'duplicarSimbolo', icon: 'fas fa-copy', color: '#607D8B', tooltip: 'Duplicar símbolo' }
                ]
            }
        };

        this.init();
    }

    init() {
        console.log('🔧 Inicializando RadialMenu...');

        // Crear elemento del menú radial
        this.createMenuElement();

        // Event listeners
        document.addEventListener('click', this.onDocumentClick.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));

        // Agregar estilos CSS
        this.addStyles();

        console.log('✅ RadialMenu inicializado completamente');
    }

    createMenuElement() {
        console.log('📦 Creando elemento del menú radial...');

        // Crear contenedor principal
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'radial-menu-3d';
        this.menuElement.style.width = `${this.radius * 2}px`;
        this.menuElement.style.height = `${this.radius * 2}px`;
        this.menuElement.style.position = 'fixed';
        this.menuElement.style.zIndex = '10000';
        this.menuElement.style.pointerEvents = 'none';
        this.menuElement.style.opacity = '0';
        this.menuElement.style.transition = 'opacity 0.2s ease';
        this.menuElement.style.display = 'none';
        this.menuElement.style.border = 'none'; // Sin borde de debug

        document.body.appendChild(this.menuElement);
        console.log('✅ Elemento del menú radial creado y agregado al DOM');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .radial-menu-3d {
                position: fixed;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                display: none;
            }

            .radial-menu-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1001;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    }

    // === MÉTODOS PÚBLICOS PARA LA NUEVA API ===

    // Configurar el contexto del menú (terreno, unidadPropia, etc.)
    setContext(context, mode = 'juegoGuerra') {
        this.currentContext = context;
        this.currentMode = mode;
        console.log(`🎨 Menú radial contexto configurado: ${context}, modo: ${mode}`);
    }

    // Configurar callback para manejar acciones
    setActionCallback(callback) {
        this.actionCallback = callback;
        console.log('🔗 Callback de acción configurado:', typeof callback);
    }

    // Mostrar el menú radial en una posición específica
    show(x, y, context = null) {
        console.log(`📱 Mostrando menú radial en (${x}, ${y}), contexto:`, context);

        if (context) {
            this.setContext(context);
        }

        this.centerX = x;
        this.centerY = y;

        // Marcar que acabamos de mostrar el menú para evitar ocultar inmediatamente
        this.justShown = true;
        // Aumentar el tiempo para evitar ocultamiento prematuro
        setTimeout(() => {
            this.justShown = false;
            console.log('🎯 Flag justShown reseteado - menú puede ocultarse ahora');
        }, 300); // Aumentado de 50ms a 300ms

        // Crear elementos del menú
        this.createMenuItems();

        // Posicionar y mostrar
        this.menuElement.style.left = `${x - this.radius}px`;
        this.menuElement.style.top = `${y - this.radius}px`;
        this.menuElement.style.display = 'block';
        this.menuElement.style.opacity = '1';
        this.menuElement.style.pointerEvents = 'auto';

        console.log(`✅ Menú radial mostrado en (${x}, ${y}) con contexto ${this.currentContext}`);
        console.log('📍 Elemento del menú:', this.menuElement);
        console.log('📍 Estilos del menú:', {
            left: this.menuElement.style.left,
            top: this.menuElement.style.top,
            display: this.menuElement.style.display,
            opacity: this.menuElement.style.opacity,
            pointerEvents: this.menuElement.style.pointerEvents,
            zIndex: this.menuElement.style.zIndex
        });
        console.log('📍 Hijos del menú:', this.menuElement.children.length);

        this.isVisible = true;
    }

    // Ocultar el menú radial
    hide() {
        if (!this.isVisible) {
            console.log('🎭 Menú ya está oculto');
            return;
        }

        console.log('🎭 Ocultando menú radial...');

        if (this.menuElement) {
            this.menuElement.style.opacity = '0';
            this.menuElement.style.pointerEvents = 'none';
            setTimeout(() => {
                this.menuElement.style.display = 'none';
            }, 200);
        }

        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
        }

        // Resetear flags
        this.isVisible = false;
        this.justShown = false;

        console.log('✅ Menú radial ocultado completamente');
    }

    // Crear elementos del menú basado en el contexto actual
    createMenuItems() {
        console.log(`🏗️ Creando elementos del menú para contexto: ${this.currentContext}, modo: ${this.currentMode}`);

        if (!this.menuElement) {
            console.error('❌ No hay menuElement creado');
            return;
        }

        // Limpiar elementos anteriores
        this.menuElement.innerHTML = '';

        // Obtener definición del menú para el contexto actual
        const menuDef = this.menuDefinitions[this.currentMode]?.[this.currentContext];
        if (!menuDef) {
            console.warn(`⚠️ No se encontró definición de menú para modo: ${this.currentMode}, contexto: ${this.currentContext}`);
            console.log('Modos disponibles:', Object.keys(this.menuDefinitions));
            console.log('Contextos disponibles para', this.currentMode, ':', Object.keys(this.menuDefinitions[this.currentMode] || {}));
            return;
        }

        console.log(`📋 Creando ${menuDef.length} elementos del menú`);

        const itemCount = menuDef.length;
        const angleStep = (Math.PI * 2) / itemCount;

        menuDef.forEach((item, index) => {
            console.log(`🔘 Creando elemento ${index + 1}: ${item.title} (${item.action})`);

            const angle = angleStep * index - Math.PI / 2; // Empezar desde arriba
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;

            const menuItem = document.createElement('div');
            menuItem.className = 'radial-menu-item';
            menuItem.style.position = 'absolute';
            menuItem.style.left = `${this.radius + x - 25}px`;
            menuItem.style.top = `${this.radius + y - 25}px`;
            menuItem.style.width = '50px';
            menuItem.style.height = '50px';
            menuItem.style.borderRadius = '50%';
            menuItem.style.backgroundColor = item.color;
            menuItem.style.border = '2px solid #fff';
            menuItem.style.cursor = 'pointer';
            menuItem.style.display = 'flex';
            menuItem.style.alignItems = 'center';
            menuItem.style.justifyContent = 'center';
            menuItem.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            menuItem.style.transition = 'all 0.2s ease';
            menuItem.style.color = '#fff';
            menuItem.style.fontSize = '18px';

            // Icono FontAwesome
            menuItem.innerHTML = `<i class="${item.icon}"></i>`;

            // Tooltip
            menuItem.title = item.tooltip;

            // Event listeners
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.transform = 'scale(1.1)';
                menuItem.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
                this.showTooltip(item.title, menuItem);
            });

            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.transform = 'scale(1)';
                menuItem.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                this.hideTooltip();
            });

            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`🖱️ Opción del menú clickeada: ${item.action}`);
                if (this.actionCallback) {
                    console.log('🔄 Ejecutando callback con acción:', item.action);
                    this.actionCallback(item.action);
                } else {
                    console.error('❌ No hay callback configurado');
                }
                this.hide();
            });

            this.menuElement.appendChild(menuItem);
        });

        console.log('✅ Elementos del menú creados');
    }

    // Mostrar tooltip
    showTooltip(text, element) {
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'radial-menu-tooltip';
            this.tooltip.style.position = 'fixed';
            this.tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
            this.tooltip.style.color = '#fff';
            this.tooltip.style.padding = '8px 12px';
            this.tooltip.style.borderRadius = '4px';
            this.tooltip.style.fontSize = '12px';
            this.tooltip.style.pointerEvents = 'none';
            this.tooltip.style.zIndex = '10001';
            this.tooltip.style.opacity = '0';
            this.tooltip.style.transition = 'opacity 0.2s ease';
            document.body.appendChild(this.tooltip);
        }

        this.tooltip.textContent = text;
        this.tooltip.style.opacity = '1';

        const rect = element.getBoundingClientRect();
        this.tooltip.style.left = `${rect.right + 10}px`;
        this.tooltip.style.top = `${rect.top}px`;
    }

    // Ocultar tooltip
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
        }
    }

    // === EVENT HANDLERS ===

    onDocumentClick(event) {
        console.log('🖱️ Document click detected en:', event.target.tagName, 'isVisible:', this.isVisible, 'justShown:', this.justShown);

        // Si el menú no está visible, no hacer nada
        if (!this.isVisible) {
            console.log('🎭 Menú no visible, ignorando click');
            return;
        }

        // Si acabamos de mostrar el menú, no ocultar
        if (this.justShown) {
            console.log('🎭 Menú recién mostrado (justShown=true), no ocultar');
            return;
        }

        // Verificar si el click fue dentro del menú
        if (this.menuElement && this.menuElement.contains(event.target)) {
            console.log('🎭 Click dentro del menú, no ocultar');
            return;
        }

        // Verificar si el click fue en un elemento de UI que no debería cerrar el menú
        const isUIElement = event.target.closest('#ui-panel, .control-group, button, input, select, label');
        if (isUIElement) {
            console.log('🎭 Click en elemento UI, no ocultar menú');
            return;
        }

        // Solo ocultar si es un click en el canvas 3D o en espacio vacío
        const isCanvasClick = event.target.tagName === 'CANVAS' || event.target.closest('canvas');
        const isBodyClick = event.target === document.body;

        if (isCanvasClick || isBodyClick) {
            console.log('🎭 Click en canvas o body, ocultando menú');
            this.hide();
        } else {
            console.log('🎭 Click en elemento desconocido, manteniendo menú visible');
        }
    }

    onKeyDown(event) {
        // Ocultar menú con ESC
        if (event.key === 'Escape' && this.isVisible) {
            console.log('🎭 ESC presionado, ocultando menú');
            this.hide();
        }
    }

    onMouseMove(event) {
        // Actualizar posición del tooltip si está visible
        if (this.tooltip && this.tooltip.style.opacity === '1') {
            this.tooltip.style.left = `${event.clientX + 10}px`;
            this.tooltip.style.top = `${event.clientY - 10}px`;
        }
    }
}

// Exponer globalmente
window.RadialMenu = RadialMenu;

console.log('🎯 Menú Radial MAIRA 4.0 cargado completamente - disponible como window.RadialMenu');