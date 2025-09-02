class GestorUnidades {
    constructor() {
        this.unidades = new Map(); // id -> unidad
    }

    agregarUnidad(elemento) {
        console.log('[DEBUG] Agregando unidad:', elemento);
        this.unidades.set(elemento.id, elemento);
    }

    actualizarUnidad(id, datos) {
        console.log('[DEBUG] Actualizando unidad:', id, datos);
        const unidad = this.unidades.get(id);
        if (unidad) {
            Object.assign(unidad.options, datos);
        }
    }

    obtenerUnidadesJugador(jugadorId) {
        return Array.from(this.unidades.values())
            .filter(u => u.jugadorId === jugadorId);
    }

    validarUnidad(id) {
        const unidad = this.unidades.get(id);
        return unidad && 
               unidad.options.magnitud && 
               unidad.options.designacion && 
               unidad.options.dependencia;
    }
}

window.gestorUnidades = new GestorUnidades();