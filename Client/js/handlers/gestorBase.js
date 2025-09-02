// En GestorBase.js
class GestorBase {
    constructor() {
        this.emisorEventos = new EventEmitter();
        this.suscripciones = new Map();
    }

    // Método de logging centralizado
    log(mensaje, datos = null, tipo = 'info') {
        const prefix = `[${this.constructor.name}][${tipo.toUpperCase()}]`;
        if (datos) {
            console.log(prefix, mensaje, datos);
        } else {
            console.log(prefix, mensaje);
        }
    }

    suscribirse(evento, manejador) {
        if (!this.suscripciones.has(evento)) {
            this.suscripciones.set(evento, []);
        }
        this.suscripciones.get(evento).push(manejador);
        this.emisorEventos.on(evento, manejador);
    }

    destruir() {
        this.suscripciones.forEach((manejadores, evento) => {
            manejadores.forEach(manejador => {
                this.emisorEventos.off(evento, manejador);
            });
        });
        this.suscripciones.clear();
    }
}

window.GestorBase = GestorBase;