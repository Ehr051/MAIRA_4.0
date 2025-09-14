/**
 * SISTEMA DE NOTIFICACIONES PUSH/POP - MAIRA 4.0
 * ================================================
 * Reemplaza el errorContainer con un sistema moderno de notificaciones
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 segundos
        this.init();
    }

    init() {
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            console.warn('NotificationContainer no encontrado, creando...');
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Mostrar una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo: 'success', 'warning', 'error', 'info'
     * @param {number} duration - Duración en ms (0 = permanente)
     * @returns {string} ID de la notificación
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        const id = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Limpiar notificaciones excesivas
        this.cleanup();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;
        
        notification.innerHTML = `
            <button class="close-btn" title="Cerrar">&times;</button>
            <div class="message">${message}</div>
        `;
        
        // Event listeners
        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide(id);
        });
        
        // Click en la notificación para cerrarla
        notification.addEventListener('click', () => {
            this.hide(id);
        });
        
        // Agregar al contenedor
        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            timestamp: Date.now(),
            type: type
        });
        
        // Auto-hide si tiene duración
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }
        
        console.log(`📢 Notificación ${type}: ${message}`);
        return id;
    }

    /**
     * Ocultar una notificación específica
     */
    hide(id) {
        const notifData = this.notifications.get(id);
        if (!notifData) return;
        
        const element = notifData.element;
        element.style.animation = 'slideOutNotification 0.3s ease-in forwards';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Limpiar notificaciones excesivas
     */
    cleanup() {
        if (this.notifications.size >= this.maxNotifications) {
            // Eliminar las más antiguas
            const sortedNotifications = Array.from(this.notifications.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = sortedNotifications.slice(0, this.notifications.size - this.maxNotifications + 1);
            toRemove.forEach(([id]) => this.hide(id));
        }
    }

    /**
     * Limpiar todas las notificaciones
     */
    clear() {
        Array.from(this.notifications.keys()).forEach(id => this.hide(id));
    }

    // Métodos de conveniencia
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    error(message, duration = 8000) { // Errores duran más
        return this.show(message, 'error', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Instancia global
window.NotificationSystem = new NotificationSystem();

// Funciones globales para compatibilidad
window.showNotification = (message, type, duration) => {
    return window.NotificationSystem.show(message, type, duration);
};

window.showError = (message, duration) => {
    return window.NotificationSystem.error(message, duration);
};

window.showSuccess = (message, duration) => {
    return window.NotificationSystem.success(message, duration);
};

window.showWarning = (message, duration) => {
    return window.NotificationSystem.warning(message, duration);
};

// Reemplazar el errorContainer para compatibilidad
if (window.mostrarError) {
    const originalMostrarError = window.mostrarError;
    window.mostrarError = function(mensaje) {
        window.NotificationSystem.error(mensaje);
        if (typeof originalMostrarError === 'function') {
            originalMostrarError(mensaje);
        }
    };
}

console.log('✅ Sistema de Notificaciones Push/Pop inicializado');
