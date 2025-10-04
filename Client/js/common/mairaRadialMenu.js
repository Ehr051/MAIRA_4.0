/**
 * MAIRA 4.0 - Sistema de Menú Radial Unificado (MIRADIAL)
 * Reemplaza todos los context menus con menús radiales interactivos
 */

class MAIRARadialMenu {
    constructor() {
        console.log('🎯 Inicializando MAIRA Radial Menu System');

        this.isVisible = false;
        this.menuElement = null;
        this.tooltipElement = null;
        this.currentContext = 'terreno';
        this.currentMode = 'planeamiento'; // planeamiento, juegodeguerra
        this.selectedElement = null;
        this.actionCallback = null;
        this.centerX = 0;
        this.centerY = 0;

        this.init();
        this.setupEventListeners();
    }

    init() {
        // Crear contenedor principal del menú radial
        this.menuElement = document.createElement('div');
        this.menuElement.id = 'maira-radial-menu';
        this.menuElement.className = 'maira-radial-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s ease;
            display: none;
        `;

        // Crear tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'maira-radial-tooltip';
        this.tooltipElement.className = 'maira-radial-tooltip';
        this.tooltipElement.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10001;
            opacity: 0;
            transition: opacity 0.2s ease;
            white-space: nowrap;
            display: none;
        `;

        document.body.appendChild(this.menuElement);
        document.body.appendChild(this.tooltipElement);

        console.log('✅ MAIRA Radial Menu inicializado');
    }

    setupEventListeners() {
        // Prevenir context menu por defecto en todo el documento
        document.addEventListener('contextmenu', (e) => {
            // Solo prevenir si no estamos en inputs o elementos editables
            if (!this.isEditableElement(e.target)) {
                e.preventDefault();
                return false;
            }
        });

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

    isEditableElement(element) {
        const tagName = element.tagName.toLowerCase();
        const editable = element.contentEditable === 'true';
        const inputTypes = ['input', 'textarea', 'select'];

        return inputTypes.includes(tagName) || editable ||
               element.closest('input, textarea, select, [contenteditable="true"]');
    }

    // Definición de menús según contexto y modo
    getMenuDefinition(context, mode = this.currentMode) {
        const menus = {
            planeamiento: {
                terreno: [
                    { id: 'agregar-unidad', title: 'Agregar Unidad', icon: 'fas fa-plus-circle', color: '#4CAF50', action: 'agregarUnidad' },
                    { id: 'agregar-elemento', title: 'Agregar Elemento', icon: 'fas fa-map-marker-alt', color: '#2196F3', action: 'agregarElemento' },
                    { id: 'info-terreno', title: 'Info Terreno', icon: 'fas fa-info-circle', color: '#FF9800', action: 'infoTerreno' },
                    { id: 'cerrar', title: 'Cerrar', icon: 'fas fa-times', color: '#9E9E9E', action: 'cerrar' }
                ],
                unidad: [
                    { id: 'editar-unidad', title: 'Editar', icon: 'fas fa-edit', color: '#2196F3', action: 'editarUnidad' },
                    { id: 'mover-unidad', title: 'Mover', icon: 'fas fa-arrows-alt', color: '#4CAF50', action: 'moverUnidad' },
                    { id: 'eliminar-unidad', title: 'Eliminar', icon: 'fas fa-trash-alt', color: '#F44336', action: 'eliminarUnidad' },
                    { id: 'info-unidad', title: 'Información', icon: 'fas fa-info-circle', color: '#FF9800', action: 'infoUnidad' }
                ],
                elemento: [
                    { id: 'editar-elemento', title: 'Editar', icon: 'fas fa-edit', color: '#2196F3', action: 'editarElemento' },
                    { id: 'eliminar-elemento', title: 'Eliminar', icon: 'fas fa-trash-alt', color: '#F44336', action: 'eliminarElemento' },
                    { id: 'info-elemento', title: 'Información', icon: 'fas fa-info-circle', color: '#FF9800', action: 'infoElemento' }
                ]
            },
            juegodeguerra: {
                terreno: [
                    { id: 'mover-aqui', title: 'Mover Aquí', icon: 'fas fa-arrows-alt', color: '#4CAF50', action: 'moverAqui' },
                    { id: 'marcar-objetivo', title: 'Marcar Objetivo', icon: 'fas fa-bullseye', color: '#F44336', action: 'marcarObjetivo' },
                    { id: 'info-terreno', title: 'Info Terreno', icon: 'fas fa-info-circle', color: '#FF9800', action: 'infoTerreno' },
                    { id: 'cerrar', title: 'Cerrar', icon: 'fas fa-times', color: '#9E9E9E', action: 'cerrar' }
                ],
                unidadPropia: [
                    { id: 'mover-unidad', title: 'Mover', icon: 'fas fa-arrows-alt', color: '#4CAF50', action: 'moverUnidad' },
                    { id: 'atacar-con', title: 'Atacar', icon: 'fas fa-crosshairs', color: '#F44336', action: 'atacarCon' },
                    { id: 'defender', title: 'Defender', icon: 'fas fa-shield-alt', color: '#9C27B0', action: 'defender' },
                    { id: 'ordenes', title: 'Órdenes', icon: 'fas fa-list-ul', color: '#FF9800', action: 'darOrdenes' },
                    { id: 'info-unidad', title: 'Info', icon: 'fas fa-info-circle', color: '#2196F3', action: 'infoUnidad' }
                ],
                unidadEnemiga: [
                    { id: 'atacar-enemigo', title: 'Atacar', icon: 'fas fa-crosshairs', color: '#F44336', action: 'atacarEnemigo' },
                    { id: 'observar', title: 'Observar', icon: 'fas fa-eye', color: '#FF9800', action: 'observarEnemigo' },
                    { id: 'reportar', title: 'Reportar', icon: 'fas fa-exclamation-triangle', color: '#9C27B0', action: 'reportarEnemigo' },
                    { id: 'info-enemigo', title: 'Info', icon: 'fas fa-info-circle', color: '#2196F3', action: 'infoEnemigo' }
                ],
                elemento: [
                    { id: 'editar-elemento', title: 'Editar', icon: 'fas fa-edit', color: '#2196F3', action: 'editarElemento' },
                    { id: 'eliminar-elemento', title: 'Eliminar', icon: 'fas fa-trash-alt', color: '#F44336', action: 'eliminarElemento' },
                    { id: 'info-elemento', title: 'Info', icon: 'fas fa-info-circle', color: '#FF9800', action: 'infoElemento' }
                ]
            }
        };

        return menus[mode]?.[context] || menus.planeamiento.terreno;
    }

    show(x, y, context = 'terreno', element = null) {
        console.log(`🎯 Mostrando menú radial en (${x}, ${y}) - Contexto: ${context}`);

        this.centerX = x;
        this.centerY = y;
        this.currentContext = context;
        this.selectedElement = element;

        // Obtener definición del menú
        const menuItems = this.getMenuDefinition(context);

        // Limpiar menú anterior
        this.menuElement.innerHTML = '';

        // Calcular posiciones radiales
        const radius = 80;
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
                width: 50px;
                height: 50px;
                margin-left: -25px;
                margin-top: -25px;
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
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.3);
            `;

            menuItem.innerHTML = `<i class="${item.icon}" style="font-size: 18px;"></i>`;

            // Eventos del item
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.transform = `translate(${itemX}px, ${itemY}px) scale(1.1)`;
                this.showTooltip(item.title);
            });

            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.transform = `translate(${itemX}px, ${itemY}px) scale(1)`;
                this.hideTooltip();
            });

            menuItem.addEventListener('click', () => {
                this.executeAction(item.action);
            });

            this.menuElement.appendChild(menuItem);
        });

        // Posicionar y mostrar menú
        this.menuElement.style.left = `${x}px`;
        this.menuElement.style.top = `${y}px`;
        this.menuElement.style.display = 'block';

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
    }

    hide() {
        if (!this.isVisible) return;

        console.log('🎯 Ocultando menú radial');

        this.menuElement.style.opacity = '0';

        setTimeout(() => {
            this.menuElement.style.display = 'none';
            this.hideTooltip();
        }, 200);

        this.isVisible = false;
        this.selectedElement = null;
    }

    showTooltip(text) {
        this.tooltipElement.textContent = text;
        this.tooltipElement.style.display = 'block';
        this.tooltipElement.style.opacity = '1';
    }

    hideTooltip() {
        this.tooltipElement.style.opacity = '0';
        setTimeout(() => {
            this.tooltipElement.style.display = 'none';
        }, 200);
    }

    updateTooltipPosition(x, y) {
        this.tooltipElement.style.left = `${x + 15}px`;
        this.tooltipElement.style.top = `${y - 10}px`;
    }

    executeAction(action) {
        console.log(`🎯 Ejecutando acción: ${action}`);

        if (this.actionCallback) {
            this.actionCallback(action, this.selectedElement, {
                context: this.currentContext,
                mode: this.currentMode,
                position: { x: this.centerX, y: this.centerY }
            });
        }

        this.hide();
    }

    setActionCallback(callback) {
        this.actionCallback = callback;
    }

    setMode(mode) {
        this.currentMode = mode;
        console.log(`🎯 Modo del menú radial cambiado a: ${mode}`);
    }

    // Método para integración con mapaP.js
    integrateWithMap(mapInstance) {
        console.log('🎯 Integrando menú radial con mapa');

        // Reemplazar context menu del mapa
        mapInstance.off('contextmenu');
        mapInstance.on('contextmenu', (e) => {
            const context = this.determineContextFromEvent(e);
            this.show(e.originalEvent.clientX, e.originalEvent.clientY, context);
        });
    }

    // Método para integración con simbolosP.js
    integrateWithSymbols() {
        console.log('🎯 Integrando menú radial con símbolos');

        // Este método será llamado desde simbolosP.js para reemplazar context menus
        window.showRadialMenuForElement = (element, event, context) => {
            this.selectedElement = element;
            this.show(event.clientX, event.clientY, context, element);
        };
    }

    determineContextFromEvent(event) {
        // Lógica para determinar el contexto basado en el evento
        // Por ahora, devolver 'terreno' por defecto
        return 'terreno';
    }
}

// Crear instancia global
window.MAIRARadialMenu = new MAIRARadialMenu();

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MAIRARadialMenu;
}