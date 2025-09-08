// 🤖 @javascript-pro Solution for MAIRA Panel Toggle Issues
// Solución para eventos duplicados y race conditions

class PanelManager {
    constructor() {
        this.isToggling = false;
        this.debounceTimeout = null;
        this.eventListeners = new Map();
    }

    // Debounced toggle para prevenir llamadas múltiples
    debouncedToggle = (forceState) => {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        this.debounceTimeout = setTimeout(() => {
            this.togglePanel(forceState);
        }, 50); // 50ms debounce
    }

    // Toggle mejorado con race condition prevention
    async togglePanel(forzarEstado) {
        if (this.isToggling) {
            console.log('🚫 Toggle en progreso, ignorando llamada duplicada');
            return;
        }

        this.isToggling = true;
        
        try {
            const panel = document.getElementById('panel-lateral');
            const botonFlotante = document.getElementById('toggle-panel-btn');
            const botonCerrar = document.getElementById('cerrar-panel');

            if (!panel) {
                console.error("Panel lateral no encontrado");
                return;
            }

            // Usar requestAnimationFrame para sincronizar con el render cycle
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    const panelEstaOculto = panel.classList.contains('oculto');
                    const mostrarPanel = forzarEstado !== undefined ? forzarEstado : panelEstaOculto;

                    if (mostrarPanel) {
                        panel.classList.remove('oculto');
                        if (botonCerrar) {
                            botonCerrar.innerHTML = '<i class="fas fa-chevron-right"></i>';
                            botonCerrar.title = 'Ocultar panel';
                        }
                        window.MAIRA_UI_STATES.panelAbierto = true;
                        localStorage.setItem('panelVisible', 'true');
                        console.log('📱 Panel lateral mostrado');
                    } else {
                        panel.classList.add('oculto');
                        window.MAIRA_UI_STATES.panelAbierto = false;
                        localStorage.setItem('panelVisible', 'false');
                        console.log('📱 Panel lateral ocultado');
                    }

                    // Trigger resize event asíncrono
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 100);

                    resolve();
                });
            });
        } catch (error) {
            console.error('Error en togglePanel:', error);
        } finally {
            this.isToggling = false;
        }
    }

    // Event listener management mejorado
    addEventListenerOnce(element, event, handler, key) {
        // Remover listener previo si existe
        if (this.eventListeners.has(key)) {
            const { element: prevElement, event: prevEvent, handler: prevHandler } = this.eventListeners.get(key);
            prevElement.removeEventListener(prevEvent, prevHandler);
        }

        // Agregar nuevo listener
        element.addEventListener(event, handler);
        this.eventListeners.set(key, { element, event, handler });
    }

    // Cleanup method
    cleanup() {
        // Limpiar todos los event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners.clear();

        // Limpiar timeouts
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }

    // Configurar eventos con cleanup automático
    setupEvents() {
        const cerrarPanel = document.getElementById('cerrar-panel');
        const toggleBtn = document.getElementById('toggle-panel-btn');

        if (cerrarPanel) {
            this.addEventListenerOnce(
                cerrarPanel,
                'click',
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 Click en botón cerrar (debounced)');
                    this.debouncedToggle();
                },
                'cerrar-panel-click'
            );
        }

        if (toggleBtn) {
            this.addEventListenerOnce(
                toggleBtn,
                'click',
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔵 Click en botón flotante (debounced)');
                    this.debouncedToggle();
                },
                'toggle-btn-click'
            );
        }
    }
}

// Singleton pattern para evitar múltiples instancias
window.MAIRA_PANEL_MANAGER = window.MAIRA_PANEL_MANAGER || new PanelManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelManager;
}
