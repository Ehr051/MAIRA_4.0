/**
 * 🎛️ UI MANAGER - MAIRA 4.0
 * Gestión centralizada de interfaz de usuario
 */

class UIManager {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.activeModals = new Set();
        this.notifications = new Map();
        
        console.log('🎛️ UIManager inicializando...');
    }

    /**
     * INICIALIZACIÓN DEL MANAGER
     */
    async initialize() {
        try {
            console.log('🎛️ Inicializando UIManager...');
            
            // Configurar eventos globales de UI
            this.setupGlobalEvents();
            
            // Inicializar sistema de notificaciones
            this.initializeNotificationSystem();
            
            // Configurar manejo de modales
            this.setupModalSystem();
            
            this.initialized = true;
            console.log('✅ UIManager inicializado correctamente');
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando UIManager:', error);
            throw error;
        }
    }

    /**
     * CONFIGURAR EVENTOS GLOBALES
     */
    setupGlobalEvents() {
        // Escape key para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                this.closeTopModal();
            }
        });

        // Click fuera de modales para cerrar
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeTopModal();
            }
        });

        console.log('🎯 Eventos globales de UI configurados');
    }

    /**
     * SISTEMA DE NOTIFICACIONES
     */
    initializeNotificationSystem() {
        // Crear contenedor de notificaciones si no existe
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        console.log('📢 Sistema de notificaciones inicializado');
    }

    /**
     * MOSTRAR NOTIFICACIÓN
     */
    showNotification(message, type = 'info', duration = 5000) {
        const id = Date.now().toString();
        const notification = document.createElement('div');
        
        const typeStyles = {
            success: 'background: #28a745; color: white;',
            error: 'background: #dc3545; color: white;',
            warning: 'background: #ffc107; color: black;',
            info: 'background: #17a2b8; color: white;'
        };

        notification.style.cssText = `
            ${typeStyles[type] || typeStyles.info}
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer;">×</button>
            </div>
        `;

        const container = document.getElementById('notification-container');
        container.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-remover después de duración especificada
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }

        this.notifications.set(id, notification);
        return id;
    }

    /**
     * REMOVER NOTIFICACIÓN
     */
    removeNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    /**
     * SISTEMA DE MODALES
     */
    setupModalSystem() {
        console.log('🗂️ Sistema de modales configurado');
    }

    /**
     * MOSTRAR MODAL
     */
    showModal(content, options = {}) {
        const modalId = `modal-${Date.now()}`;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'ui-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: ${options.width || '600px'};
            max-height: ${options.height || '80vh'};
            overflow-y: auto;
            position: relative;
        `;

        modalContent.innerHTML = content;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Animar entrada
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);

        this.activeModals.add(modalId);
        return modalId;
    }

    /**
     * CERRAR MODAL SUPERIOR
     */
    closeTopModal() {
        const modals = document.querySelectorAll('.ui-modal');
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            this.closeModal(topModal.id);
        }
    }

    /**
     * CERRAR MODAL ESPECÍFICO
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (modal.parentElement) {
                    modal.parentElement.removeChild(modal);
                }
                this.activeModals.delete(modalId);
            }, 300);
        }
    }

    /**
     * CONFIGURAR LOADING OVERLAY
     */
    showLoadingOverlay(message = 'Cargando...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 18px;
        `;

        overlay.innerHTML = `
            <div style="text-align: center;">
                <div style="margin-bottom: 20px;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
                </div>
                <div>${message}</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(overlay);
    }

    /**
     * OCULTAR LOADING OVERLAY
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Exportar UIManager
window.UIManager = UIManager;

// Para compatibilidad con módulos ES6
export default UIManager;

console.log('🎛️ UIManager cargado correctamente');
