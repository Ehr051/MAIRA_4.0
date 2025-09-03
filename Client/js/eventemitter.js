(function (global) {
    function EventEmitter() {
        this.events = {};
    }

    EventEmitter.prototype.on = function (event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        console.log(`[EventEmitter] Listener registrado para evento: ${event}`);
    };

    EventEmitter.prototype.emit = function (event, data) {
        if (this.events[event]) {
            console.log(`[EventEmitter] Emitiendo evento: ${event}`, data);
            this.events[event].forEach(listener => listener(data));
        } else {
            console.warn(`[EventEmitter] No hay listeners registrados para el evento: ${event}`);
        }
    };

    EventEmitter.prototype.off = function (event, listener) {
        if (!this.events[event]) return;
        const index = this.events[event].indexOf(listener);
        if (index > -1) {
            this.events[event].splice(index, 1);
            console.log(`[EventEmitter] Listener eliminado para evento: ${event}`);
        }
    };

    global.EventEmitter = EventEmitter;
})(window);
