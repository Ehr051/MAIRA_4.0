// acciones.js

function moverUnidad(unidad, destino) {
    if (window.turnos.esJugadorActual(unidad.options.jugador)) {
        console.log(`Moviendo unidad ${unidad.options.nombre} a ${destino}`);
        unidad.setLatLng(destino);
        
        if (modoJuego === 'online') {
            socket.emit('moverUnidad', { unidadId: unidad.options.id, destino });
        }
    } else {
        console.log('No es el turno del jugador para mover esta unidad');
    }
}

function iniciarAtaque(unidadAtacante, objetivo) {
    if (window.turnos.esJugadorActual(unidadAtacante.options.jugador)) {
        console.log(`Unidad ${unidadAtacante.options.nombre} atacando a ${objetivo.options.nombre}`);
        
        if (modoJuego === 'online') {
            socket.emit('iniciarAtaque', { atacanteId: unidadAtacante.options.id, objetivoId: objetivo.options.id });
        }
    } else {
        console.log('No es el turno del jugador para atacar con esta unidad');
    }
}

function finalizarPartida() {
    console.log("Partida finalizada");
    if (modoJuego === 'online') {
        socket.emit('finalizarPartida');
    }
}

function defenderConElementoSeleccionado() {
    if (window.elementoSeleccionado && typeof defenderConElemento === 'function') {
        defenderConElemento(window.elementoSeleccionado);
    } else {
        console.error("No se puede defender con el elemento. Elemento seleccionado o función de defensa no disponible.");
    }
}

function desplegarUnidadBlindada() {
    console.log("Desplegando unidad blindada:", window.elementoSeleccionado);
    // Implementar lógica para desplegar unidad blindada
}

function reagruparUnidadBlindada() {
    console.log("Reagrupando unidad blindada:", window.elementoSeleccionado);
    // Implementar lógica para reagrupar unidad blindada
}

// Exportar funciones para ser usadas en otros módulos
window.acciones = {
    moverUnidad,
    iniciarAtaque,
    finalizarPartida,
    defenderConElementoSeleccionado,
    desplegarUnidadBlindada,
    reagruparUnidadBlindada
};
