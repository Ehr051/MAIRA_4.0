/**
 * 🔔 EVENT BUS - MAIRA 4.0
 * Sistema eventos centralizado para comunicación componentes
 */
class EventBus {
    constructor() {
        this.events = new Map();
        console.log('🔔 EventBus inicializado');
    }

    // Registrar listener
    on(eventName, callback) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        this.events.get(eventName).push(callback);
    }

    // Remover listener
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const callbacks = this.events.get(eventName);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Emitir evento
    emit(eventName, data) {
        if (this.events.has(eventName)) {
            this.events.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Error en evento', eventName, error);
                }
            });
        }
        
        console.log('📡 Evento emitido:', eventName, data);
    }

    // Listener una vez
    once(eventName, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(eventName, onceWrapper);
        };
        this.on(eventName, onceWrapper);
    }

    // Listar eventos
    listEvents() {
        return Array.from(this.events.keys());
    }

    // Limpiar todos los eventos
    clear() {
        this.events.clear();
        console.log('🧹 EventBus limpiado');
    }
}

// Singleton global
if (typeof window !== 'undefined') {
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.EventBus = new EventBus();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventBus;
}
