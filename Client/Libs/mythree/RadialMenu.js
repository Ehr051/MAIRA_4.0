/**
 * MAIRA 4.0 - Menú Radial Interactivo Mejorado para 3D
 * Sistema de órdenes radial para unidades 3D basado en MAIRARadialMenu
 */

class RadialMenu {
    constructor() {
        console.log('🏗️ Constructor RadialMenu 3D llamado');

        this.isVisible = false;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 80; // Aumentado para mejor UX
        this.selectedUnit = null;
        this.targetPosition = null;
        this.menuElement = null;
        this.tooltipElement = null;
        this.currentContext = 'terreno'; // terreno, unidad, elemento
        this.currentMode = 'juegoGuerra'; // juegoGuerra, planeamiento, etc.
        this.actionCallback = null; // Callback para manejar acciones
        this.selectedElement = null; // Elemento seleccionado
        this.justShown = false; // Flag para evitar ocultar inmediatamente después de mostrar

        this.initialize();
        this.addStyles();
        this.setupEventListeners();
    }

    initialize() {
        // Crear contenedor principal del menú
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'maira-radial-menu-3d';
        this.menuElement.style.cssText = `
            position: fixed;
            z-index: 10001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            display: none;
        `;

        // Crear elemento de tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'maira-radial-tooltip';
        this.tooltipElement.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            z-index: 10002;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            white-space: nowrap;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: none;
        `;

        document.body.appendChild(this.menuElement);
        document.body.appendChild(this.tooltipElement);

        console.log('✅ MAIRA Radial Menu 3D inicializado');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .maira-radial-menu-3d {
                position: fixed;
                z-index: 10001;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                display: none;
            }

            .maira-radial-item {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 55px;
                height: 55px;
                margin-left: -27.5px;
                margin-top: -27.5px;
                border-radius: 50%;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                pointer-events: auto;
                transition: all 0.2s ease;
                transform-origin: center;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.3);
                font-size: 20px;
            }

            .maira-radial-item:hover {
                transform: scale(1.1) !important;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
                border-color: rgba(255, 255, 255, 0.6);
            }

            .maira-radial-item:active {
                transform: scale(0.95) !important;
            }

            .maira-radial-tooltip {
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                z-index: 10002;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                white-space: nowrap;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Manejar clics fuera del menú para ocultarlo
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.menuElement.contains(e.target)) {
                this.hide();
            }
        });

        // Manejar movimiento del mouse para tooltips
        document.addEventListener('mousemove', (e) => {
            if (this.isVisible) {
                this.updateTooltipPosition(e.clientX, e.clientY);
            }
        });
    }

    // Definición de menús según contexto y modo
    getMenuDefinition(context, mode = this.currentMode) {
        const menus = {
            juegoGuerra: {
                terreno: [
                    { id: 'infoTerrenoJG', title: 'Info Terreno', action: 'infoTerrenoJG', icon: 'fas fa-info-circle', color: '#4CAF50' },
                    { id: 'marcarObjetivo', title: 'Marcar Objetivo', action: 'marcarObjetivo', icon: 'fas fa-bullseye', color: '#FF9800' },
                    { id: 'moverAqui', title: 'Mover Aquí', action: 'moverAqui', icon: 'fas fa-arrows-alt', color: '#2196F3' },
                    { id: 'close', title: 'Cerrar', action: 'close', icon: 'fas fa-times', color: '#9E9E9E' }
                ],
                unidad: [
                    { id: 'infoUnidad', title: 'Información', action: 'infoUnidad', icon: 'fas fa-info-circle', color: '#4CAF50' },
                    { id: 'moverUnidad', title: 'Mover', action: 'moverUnidad', icon: 'fas fa-arrows-alt', color: '#2196F3' },
                    { id: 'atacarCon', title: 'Atacar', action: 'atacarCon', icon: 'fas fa-crosshairs', color: '#F44336' },
                    { id: 'defenderCon', title: 'Defender', action: 'defenderCon', icon: 'fas fa-shield-alt', color: '#9C27B0' },
                    { id: 'reagrupar', title: 'Reagrupar', action: 'reagrupar', icon: 'fas fa-users', color: '#FF9800' },
                    { id: 'darOrdenes', title: 'Órdenes', action: 'darOrdenes', icon: 'fas fa-list-ul', color: '#607D8B' }
                ],
                elemento: [
                    { id: 'infoElemento', title: 'Información', action: 'infoElemento', icon: 'fas fa-info-circle', color: '#4CAF50' },
                    { id: 'editarElemento', title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', color: '#2196F3' },
                    { id: 'eliminarElemento', title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', color: '#F44336' }
                ]
            },
            planeamiento: {
                terreno: [
                    { id: 'agregarUnidad', title: 'Agregar Unidad', action: 'agregarUnidad', icon: 'fas fa-plus-circle', color: '#4CAF50' },
                    { id: 'agregarElemento', title: 'Agregar Elemento', action: 'agregarElemento', icon: 'fas fa-draw-polygon', color: '#2196F3' },
                    { id: 'infoTerreno', title: 'Info Terreno', action: 'infoTerreno', icon: 'fas fa-info-circle', color: '#FF9800' },
                    { id: 'close', title: 'Cerrar', action: 'close', icon: 'fas fa-times', color: '#9E9E9E' }
                ],
                unidad: [
                    { id: 'editarUnidad', title: 'Editar', action: 'editarUnidad', icon: 'fas fa-edit', color: '#2196F3' },
                    { id: 'moverUnidad', title: 'Mover', action: 'moverUnidad', icon: 'fas fa-arrows-alt', color: '#4CAF50' },
                    { id: 'eliminarUnidad', title: 'Eliminar', action: 'eliminarUnidad', icon: 'fas fa-trash-alt', color: '#F44336' },
                    { id: 'duplicarUnidad', title: 'Duplicar', action: 'duplicarUnidad', icon: 'fas fa-copy', color: '#FF9800' }
                ],
                elemento: [
                    { id: 'editarElemento', title: 'Editar', action: 'editarElemento', icon: 'fas fa-edit', color: '#2196F3' },
                    { id: 'eliminarElemento', title: 'Eliminar', action: 'eliminarElemento', icon: 'fas fa-trash-alt', color: '#F44336' },
                    { id: 'duplicarElemento', title: 'Duplicar', action: 'duplicarElemento', icon: 'fas fa-copy', color: '#FF9800' }
                ]
            }
        };

        return menus[mode]?.[context] || [];
    }

    // Mostrar el menú radial en una posición específica
    show(x, y, context = 'terreno', element = null) {
        console.log(`🎯 Mostrando menú radial 3D en (${x}, ${y}) - Contexto: ${context}`);

        this.centerX = x;
        this.centerY = y;
        this.currentContext = context;
        this.selectedElement = element;

        // Marcar que acabamos de mostrar el menú para evitar ocultar inmediatamente
        this.justShown = true;
        setTimeout(() => {
            this.justShown = false;
        }, 300);

        // Obtener definición del menú
        const menuItems = this.getMenuDefinition(context);

        // Limpiar menú anterior
        this.menuElement.innerHTML = '';

        // Calcular posiciones radiales
        const radius = this.radius;
        const angleStep = (2 * Math.PI) / menuItems.length;

        menuItems.forEach((item, index) => {
            const angle = index * angleStep - Math.PI / 2; // Empezar desde arriba
            const itemX = Math.cos(angle) * radius;
            const itemY = Math.sin(angle) * radius;

            const menuItem = document.createElement('div');
            menuItem.className = 'maira-radial-item';
            menuItem.dataset.action = item.action;
            menuItem.dataset.tooltip = item.title;
            menuItem.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 55px;
                height: 55px;
                margin-left: -27.5px;
                margin-top: -27.5px;
                border-radius: 50%;
                background: ${item.color};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                pointer-events: auto;
                transition: all 0.2s ease;
                transform: translate(${itemX}px, ${itemY}px) scale(0);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(255, 255, 255, 0.3);
            `;

            menuItem.innerHTML = `<i class="${item.icon}" style="font-size: 20px;"></i>`;

            // Event listeners
            menuItem.addEventListener('mouseenter', () => {
                this.showTooltip(item.title, x + itemX, y + itemY);
            });

            menuItem.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeAction(item.action, element);
            });

            this.menuElement.appendChild(menuItem);
        });

        // Posicionar y mostrar menú
        this.menuElement.style.left = `${x - radius}px`;
        this.menuElement.style.top = `${y - radius}px`;
        this.menuElement.style.width = `${radius * 2}px`;
        this.menuElement.style.height = `${radius * 2}px`;
        this.menuElement.style.display = 'block';
        this.menuElement.style.pointerEvents = 'auto';

        // Animar entrada
        setTimeout(() => {
            this.menuElement.style.opacity = '1';
            const items = this.menuElement.querySelectorAll('.maira-radial-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.transform = item.style.transform.replace('scale(0)', 'scale(1)');
                }, index * 50);
            });
        }, 10);

        this.isVisible = true;
        console.log(`✅ Menú radial 3D mostrado con ${menuItems.length} opciones`);
    }

    // Ocultar el menú radial
    hide() {
        if (!this.isVisible) return;

        console.log('🎭 Ocultando menú radial 3D...');

        this.hideTooltip();

        if (this.menuElement) {
            this.menuElement.style.opacity = '0';
            this.menuElement.style.pointerEvents = 'none';
            setTimeout(() => {
                this.menuElement.style.display = 'none';
                this.menuElement.innerHTML = ''; // Limpiar contenido
            }, 200);
        }

        this.isVisible = false;
    }

    // Configurar callback para acciones
    setActionCallback(callback) {
        this.actionCallback = callback;
    }

    // Ejecutar acción
    executeAction(action, element) {
        console.log(`🎯 Ejecutando acción 3D: ${action}`, element);

        if (this.actionCallback) {
            this.actionCallback(action, element, this.currentContext);
        }

        this.hide();
    }

    // Mostrar tooltip
    showTooltip(text, x, y) {
        if (!this.tooltipElement) return;

        this.tooltipElement.textContent = text;
        this.tooltipElement.style.left = `${x + 10}px`;
        this.tooltipElement.style.top = `${y - 10}px`;
        this.tooltipElement.style.display = 'block';

        setTimeout(() => {
            this.tooltipElement.style.opacity = '1';
        }, 10);
    }

    // Ocultar tooltip
    hideTooltip() {
        if (!this.tooltipElement) return;

        this.tooltipElement.style.opacity = '0';
        setTimeout(() => {
            this.tooltipElement.style.display = 'none';
        }, 200);
    }

    // Actualizar posición del tooltip
    updateTooltipPosition(mouseX, mouseY) {
        if (!this.tooltipElement || this.tooltipElement.style.display === 'none') return;

        this.tooltipElement.style.left = `${mouseX + 15}px`;
        this.tooltipElement.style.top = `${mouseY - 25}px`;
    }

    // Configurar modo (juegoGuerra, planeamiento)
    setMode(mode) {
        this.currentMode = mode;
        console.log(`🔄 Modo del menú radial 3D cambiado a: ${mode}`);
    }

    // Método de compatibilidad con la API anterior
    mostrarMenu(x, y, context) {
        this.show(x, y, context);
    }
}

// Hacer disponible globalmente
window.RadialMenu = RadialMenu;
window.MiRadial = new RadialMenu();

console.log('🎯 MAIRA Radial Menu 3D cargado y disponible como window.MiRadial');