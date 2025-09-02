// partidas.js: Maneja las partidas, tanto la creación como la unión, así como el manejo de jugadores y estados

let socket;
let userId, userName;
let partidasInicializadas = false;
let intervalActualizacion = null;

function inicializarPartidas(socketInstance) {
    // Evitar múltiples inicializaciones
    if (partidasInicializadas) {
        console.log('⚠️ Partidas ya inicializadas, saltando...');
        return;
    }
    socket = socketInstance;
    
    // Eventos básicos de partida
    socket.on('partidaCreada', manejarPartidaCreada);
    socket.on('listaPartidas', manejarPartidasDisponibles);
    socket.on('partidasDisponibles', manejarPartidasDisponibles); // Compatibilidad
    socket.on('jugadorSalio', manejarJugadorSalio);
    socket.on('partidaCancelada', manejarPartidaCancelada);
    socket.on('jugadorListoActualizado', manejarJugadorListoActualizado);
    socket.on('errorPartida', manejarErrorPartida);

    // Manejo de inicio de partida
    socket.on('partidaIniciada', function(datosPartida) {
        console.log('Partida iniciada, redirigiendo con datos:', datosPartida);
        if (datosPartida && datosPartida.codigo) {
            localStorage.setItem('datosPartida', JSON.stringify(datosPartida));
            window.location.href = `juegodeguerra.html?codigo=${datosPartida.codigo}`;
        } else {
            console.error('Datos de partida inválidos:', datosPartida);
            mostrarError('Error al iniciar la partida: datos inválidos');
        }
    });

    // Manejo de equipos
    socket.on('equipoJugadorActualizado', function(data) {
        console.log('Equipo del jugador actualizado:', data);
        if (data && data.jugadores) {
            actualizarListaJugadoresSala(data.jugadores);
        } else {
            console.error('Datos de jugadores inválidos:', data);
        }
    });

    socket.on('jugadorActualizado', function(data) {
        console.log('Jugador actualizado:', data);
        if (partidaActual && partidaActual.codigo === data.codigo) {
            actualizarListaJugadoresSala(data.jugadores);
            
            // Verificar si todos están listos para habilitar botón de inicio
            if (partidaActual.configuracion.creadorId === userId) {
                const todosListos = data.jugadores.every(j => j.listo && j.equipo !== 'sin_equipo');
                const btnIniciarPartida = document.getElementById('btnIniciarPartida');
                if (btnIniciarPartida) {
                    btnIniciarPartida.disabled = !todosListos;
                }
            }
        }
    });

    // Manejo de unión a partida
    socket.on('unionExitosa', function(datosPartida) {
        ocultarIndicadorCarga();
        console.log("Unido a la partida con éxito", datosPartida);
        if (datosPartida) {
            partidaActual = datosPartida;
            mostrarSalaEspera(datosPartida);
            // Iniciar actualización automática de la sala
            iniciarActualizacionSalaEspera();
        }
    });

    socket.on('errorUnirseAPartida', function(error) {
        ocultarIndicadorCarga();
        console.error('Error al unirse a la partida:', error);
        mostrarError(error.mensaje || 'Error al unirse a la partida');
    });

    // Actualización de equipo de jugador (servidor a cliente)
    socket.on('actualizarEquipoJugador', function(data) {
        console.log('Recibida actualización de equipo:', data);
        if (partidaActual && data.codigo === partidaActual.codigo) {
            const jugadorIndex = partidaActual.jugadores.findIndex(j => j.id === data.userId);
            if (jugadorIndex !== -1) {
                partidaActual.jugadores[jugadorIndex].equipo = data.equipo;
                actualizarListaJugadoresSala(partidaActual.jugadores);
            }
        }
    });

    socket.on('actualizarSalaDeEspera', (data) => {
        console.log('Recibida actualización de sala:', data);
        if (data && data.jugadores) {
            actualizarListaJugadoresSala(data.jugadores);
            
            // Actualizar estado del botón de inicio si es necesario
            if (partidaActual && partidaActual.configuracion.creadorId === userId) {
                const btnIniciarPartida = document.getElementById('btnIniciarPartida');
                if (btnIniciarPartida) {
                    btnIniciarPartida.disabled = !data.todosListos;
                }
            }
        }
    });
    // Inicializar event listeners y actualizaciones automáticas
    inicializarEventListenersPartidas();
    iniciarActualizacionAutomatica();
    
    // Marcar como inicializado
    partidasInicializadas = true;
    console.log('✅ Partidas inicializadas correctamente');
}

// Función auxiliar para actualización automática
function iniciarActualizacionAutomatica() {
    // Evitar múltiples intervalos
    if (intervalActualizacion) {
        clearInterval(intervalActualizacion);
    }
    
    // Actualizar lista de partidas cada 5 segundos
    intervalActualizacion = setInterval(obtenerPartidasDisponibles, 5000);
    console.log('⏰ Actualización automática iniciada (cada 5s)');
}

// Función auxiliar para actualización de sala de espera
function iniciarActualizacionSalaEspera() {
    if (partidaActual) {
        // Actualizar estado de sala cada 3 segundos
        const intervalId = setInterval(() => {
            if (!partidaActual) {
                clearInterval(intervalId);
                return;
            }
            socket.emit('obtenerEstadoSala', { codigo: partidaActual.codigo });
        }, 3000);
    }
}

function inicializarEventListenersPartidas() {
    // Validar que los elementos existan antes de agregar listeners
    const btnCrearPartidaConfirmar = document.getElementById('btnCrearPartidaConfirmar');
    if (btnCrearPartidaConfirmar) {
        btnCrearPartidaConfirmar.addEventListener('click', crearPartida);
    } else {
        console.warn('⚠️ btnCrearPartidaConfirmar no encontrado');
    }
    
    const btnListoJugador = document.getElementById('btnListoJugador');
    if (btnListoJugador) {
        btnListoJugador.addEventListener('click', marcarJugadorListo);
    }
    
    const btnIniciarPartida = document.getElementById('btnIniciarPartida');
    if (btnIniciarPartida) {
        btnIniciarPartida.addEventListener('click', iniciarPartida);
    }
    
    const btnSalirSalaEspera = document.getElementById('btnSalirSalaEspera');
    if (btnSalirSalaEspera) {
        btnSalirSalaEspera.addEventListener('click', salirSalaEspera);
    } else {
        console.warn('⚠️ btnSalirSalaEspera no encontrado');
    }
    
    const btnCancelarPartida = document.getElementById('btnCancelarPartida');
    if (btnCancelarPartida) {
        btnCancelarPartida.addEventListener('click', cancelarPartida);
    }
    
    const btnUnirseAPartidaConfirmar = document.getElementById('btnunirseAPartidaConfirmar');
    if (btnUnirseAPartidaConfirmar) {
        btnUnirseAPartidaConfirmar.addEventListener('click', function(e) {
            e.preventDefault();
            const codigoInput = document.getElementById('codigoUnirse');
            if (codigoInput) {
                const codigo = codigoInput.value;
                unirseAPartida(codigo);
            } else {
                console.error('Elemento codigoUnirse no encontrado');
                mostrarError('Error al obtener el código de la partida');
            }
        });
    } else {
        console.warn('⚠️ btnunirseAPartidaConfirmar no encontrado');
    }
}

function unirseAPartida(codigo) {
    console.log('🎯 Función unirseAPartida llamada con código:', codigo);
    
    if (typeof codigo !== 'string' || codigo.length === 0) {
        console.error('❌ El código de partida no es válido:', codigo);
        mostrarError('Código de partida no válido');
        return;
    }

    console.log('✅ Intentando unirse a la partida con código:', codigo);
    mostrarIndicadorCarga();

    // Si ya estamos en la partida con el mismo código, redirigimos a la sala de espera
    if (partidaActual && partidaActual.codigo === codigo) {
        console.log('ℹ️ Ya estás en esta partida, mostrando sala de espera');
        mostrarSalaEspera(partidaActual);
        ocultarIndicadorCarga();
        return;
    }

    // Si ya estamos en otra partida, salimos de la partida actual antes de unirnos a otra
    if (partidaActual) {
        console.log('🔄 Ya estás en una partida. Saliendo de la partida actual antes de unirse a otra.');
        socket.emit('salirPartida', { codigo: partidaActual.codigo }, () => {
            partidaActual = null; // Limpiar la partida actual antes de unirse a la nueva
            emitirUnirseAPartida(codigo);
        });
    } else {
        emitirUnirseAPartida(codigo);
    }
}

function emitirUnirseAPartida(codigo) {
    console.log('Emitiendo evento unirseAPartida con:', {
        codigo: codigo,
        userId: userId, 
        userName: userName
    });
    
    socket.emit('unirseAPartida', { 
        codigo: codigo,
        userId: userId,
        userName: userName
    });

    // Configurar listeners para manejar respuestas
    socket.once('unidoAPartida', function(datosPartida) {
        ocultarIndicadorCarga();
        console.log("Unido a la partida con éxito:", datosPartida);
        
        // Guardar datos para transición a juegodeguerra.html
        partidaActual = datosPartida;
        
        // Encontrar el equipo del jugador
        const miJugador = datosPartida.jugadores.find(j => j.id === userId);
        const equipoJugador = miJugador ? miJugador.equipo : null;
        
        // Guardar en sessionStorage para mantener durante navegación
        sessionStorage.setItem('datosPartidaActual', JSON.stringify({
            partidaActual: datosPartida,
            userId: userId,
            userName: userName,
            equipoJugador: equipoJugador
        }));
        
        // Mostrar sala de espera
        mostrarSalaEspera(datosPartida);
        
        // Cambiar de sala para el chat
        if (window.cambiarSalaChat) {
            window.cambiarSalaChat(codigo);
        }
    });

    socket.once('errorUnirseAPartida', function(error) {
        ocultarIndicadorCarga();
        console.error('Error al unirse a la partida:', error);
        mostrarError(error.mensaje || 'Error al unirse a la partida');
    });
}



function crearPartida(e) {
    e.preventDefault();
    
    console.log('🎮 Validando antes de crear partida...');
    
    // Verificar conexión de socket
    if (!socket || !socket.connected) {
        console.error('❌ Socket no conectado');
        mostrarError('Error: No hay conexión con el servidor. Intentar reconectar.');
        return;
    }
    
    // Verificar datos de usuario usando UserIdentity
    const currentUserId = MAIRA.UserIdentity.getUserId();
    const currentUserName = MAIRA.UserIdentity.getUsername();
    
    if (!currentUserId || !currentUserName) {
        console.error('❌ Datos de usuario no configurados via UserIdentity');
        mostrarError('Error: Datos de usuario no configurados. Redirigir a inicio.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log(`✅ Usuario validado: ${currentUserName} (${currentUserId})`);
    
    // Asegurar variables globales para compatibilidad
    window.userId = currentUserId;
    window.userName = currentUserName;
    
    console.log('✅ Validaciones pasadas, continuando...');
    
    const nombrePartida = document.getElementById('nombrePartida').value;
    const duracionPartida = document.getElementById('duracionPartida').value;
    const duracionTurno = document.getElementById('duracionTurno').value;
    const objetivoPartida = document.getElementById('objetivoPartida').value;
    
    if (!nombrePartida || !duracionPartida || !duracionTurno || !objetivoPartida) {
        mostrarError('Por favor, complete todos los campos');
        return;
    }
    
    const configuracion = {
        nombrePartida,
        duracionPartida,
        duracionTurno,
        objetivoPartida,
        modo: modoSeleccionado,
        creadorId: currentUserId
    };

    if (modoSeleccionado === 'local') {
        iniciarJuegoLocal(configuracion);
    } else {
        console.log('🚀 Enviando crear partida al servidor...');
        socket.emit('crearPartida', { configuracion });
    }
}

function iniciarJuegoLocal(configuracion) {
    // Crear estructura de datos compatible con gestorJuego.js
    const datosPartida = {
        configuracion: configuracion,
        modo: 'local',
        jugadores: [], // Se configurarán en gestorJuego.js
        estado: 'configurando'
    };
    
    console.log('💾 Guardando datos de partida local:', datosPartida);
    localStorage.setItem('datosPartida', JSON.stringify(datosPartida));
    localStorage.setItem('configuracionPartidaLocal', JSON.stringify(configuracion));
    
    window.location.href = 'juegodeguerra.html';
}

function salirSalaEspera() {
    if (partidaActual) {
        console.log('Saliendo de la sala de espera de la partida con código:', partidaActual.codigo);
        socket.emit('salirSalaEspera', { codigo: partidaActual.codigo, userId: userId });
        socket.emit('leaveRoom', partidaActual.codigo);
        socket.emit('joinRoom', 'general');  // Cambiar a sala general
        partidaActual = null;
        mostrarMensaje('Has salido de la sala de espera.');
        ocultarTodosLosFormularios();
        document.getElementById('modoSeleccion').style.display = 'block';
    }
}

function cancelarPartida() {
    if (partidaActual) {
        console.log('Cancelando la partida con código:', partidaActual.codigo);
        mostrarIndicadorCarga(); // Mostrar indicador de carga mientras se cancela la partida
        socket.emit('cancelarPartida', { codigo: partidaActual.codigo });

        socket.once('partidaCancelada', function (data) {
            ocultarIndicadorCarga();
            partidaActual = null;
            mostrarMensaje('La partida ha sido cancelada.');
            ocultarTodosLosFormularios();
            document.getElementById('modoSeleccion').style.display = 'block';
        });

        socket.once('errorCancelarPartida', function (error) {
            ocultarIndicadorCarga();
            console.error('Error al cancelar la partida:', error.mensaje);
            mostrarError(error.mensaje);
        });
    }
    
}

// Modificar la función marcarJugadorListo
function marcarJugadorListo(event) {
    if (!partidaActual) {
        mostrarError('No hay partida activa');
        event.target.checked = !event.target.checked;
        return;
    }

    const estaListo = event.target.checked;
    const tr = event.target.closest('tr');
    const equipoSelect = tr.querySelector('.equipo-select');
    const equipo = equipoSelect ? equipoSelect.value : 'sin_equipo';

    console.log('Actualizando estado jugador:', {
        codigo: partidaActual.codigo,
        userId: userId,
        listo: estaListo,
        equipo: equipo
    });

    socket.emit('actualizarJugador', {
        codigo: partidaActual.codigo,
        userId: userId,
        listo: estaListo,
        equipo: equipo
    });
}

// Modificar la función actualizarEquipoJugador
function actualizarEquipoJugador(event) {
    if (!partidaActual) {
        console.error('No hay partida actual');
        return;
    }

    const nuevoEquipo = event.target.value;
    const tr = event.target.closest('tr');
    const checkboxListo = tr.querySelector('.checkbox-listo');
    const estaListo = checkboxListo ? checkboxListo.checked : false;

    console.log('Actualizando equipo jugador:', {
        codigo: partidaActual.codigo,
        userId: userId,
        equipo: nuevoEquipo,
        listo: estaListo
    });

    socket.emit('actualizarJugador', {
        codigo: partidaActual.codigo,
        userId: userId,
        equipo: nuevoEquipo,
        listo: estaListo
    });
}

// Modificar la función actualizarListaJugadoresSala
function actualizarListaJugadoresSala(jugadores) {
    const listaJugadoresSala = document.getElementById('jugadoresSala')?.querySelector('tbody');
    if (!listaJugadoresSala) {
        console.error('No se encontró la tabla de jugadores');
        return;
    }

    listaJugadoresSala.innerHTML = '';
    jugadores.forEach(jugador => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-user-id', jugador.id);
        const esJugadorActual = jugador.id === userId;
        
        tr.innerHTML = `
            <td>${jugador.username}</td>
            <td>
                <select class="form-control equipo-select" ${esJugadorActual ? '' : 'disabled'}>
                    <option value="sin_equipo" ${jugador.equipo === 'sin_equipo' ? 'selected' : ''}>Sin Equipo</option>
                    <option value="rojo" ${jugador.equipo === 'rojo' ? 'selected' : ''}>Rojo</option>
                    <option value="azul" ${jugador.equipo === 'azul' ? 'selected' : ''}>Azul</option>
                    <option value="Director" ${jugador.equipo === 'Director' ? 'selected' : ''}>Director</option>
                </select>
            </td>
            <td>
                <input type="checkbox" class="checkbox-listo" 
                    ${jugador.listo ? 'checked' : ''} 
                    ${esJugadorActual ? '' : 'disabled'}>
            </td>
        `;
        
        listaJugadoresSala.appendChild(tr);
        
        // Agregar event listeners solo para el jugador actual
        if (esJugadorActual) {
            const equipoSelect = tr.querySelector('.equipo-select');
            const checkboxListo = tr.querySelector('.checkbox-listo');
            
            if (equipoSelect) {
                equipoSelect.addEventListener('change', actualizarEquipoJugador);
            }
            
            if (checkboxListo) {
                checkboxListo.addEventListener('change', marcarJugadorListo);
            }
        }
    });
}

function iniciarPartida() {
    if (!partidaActual) {
        mostrarError('No hay partida activa para iniciar');
        return;
    }

    const configuracion = parseConfiguracionPartida(partidaActual);
    if (configuracion.creadorId !== userId) {
        mostrarError('Solo el creador puede iniciar la partida');
        return;
    }

    const jugadores = Array.from(document.querySelectorAll('#jugadoresSala tbody tr')).map(tr => ({
        id: tr.getAttribute('data-user-id'),
        username: tr.querySelector('td:first-child').textContent,
        equipo: tr.querySelector('select').value,
        listo: tr.querySelector('.checkbox-listo').checked
    }));

    if (!jugadores.every(j => j.equipo !== 'sin_equipo' && j.listo)) {
        mostrarError('Todos los jugadores deben estar listos y tener un equipo asignado');
        return;
    }

    // Guardar datos de jugadores en localStorage
    localStorage.setItem('jugadoresPartida', JSON.stringify(jugadores));

    socket.emit('iniciarPartida', {
        codigo: partidaActual.codigo,
        jugadores: jugadores,
        configuracion: configuracion
    });
}

// Modificar la función manejarPartidaIniciada en iniciarpartida.js
function manejarPartidaIniciada(datosPartida) {
    console.log('Partida iniciada, preparando redirección...', datosPartida);
    
    if (!datosPartida || !datosPartida.codigo) {
        console.error('Datos de partida inválidos:', datosPartida);
        mostrarError('Error al iniciar la partida: datos inválidos');
        return;
    }
    
    try {
        // Encontrar información del jugador actual
        const miJugador = datosPartida.jugadores.find(j => j.id === userId);
        const equipoJugador = miJugador ? miJugador.equipo : null;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('datosPartida', JSON.stringify(datosPartida));
        
        // Guardar en sessionStorage para mejor rendimiento durante la navegación
        const datosSesion = {
            partidaActual: datosPartida,
            userId: userId,
            userName: userName,
            equipoJugador: equipoJugador,
            codigoPartida: datosPartida.codigo
        };
        
        sessionStorage.setItem('datosPartidaActual', JSON.stringify(datosSesion));
        
        console.log('Datos guardados para transición, redirigiendo a juego...');
        
        // Redirigir a la página del juego
        window.location.href = `juegodeguerra.html?codigo=${datosPartida.codigo}`;
    } catch (error) {
        console.error('Error al preparar la redirección:', error);
        mostrarError('Error al iniciar la partida: ' + error.message);
    }
}

function reconectarAPartida() {
    if (partidaActual) {
        console.log('Reconectando a la partida con código:', partidaActual.codigo);
        socket.emit('reconectarAPartida', { codigo: partidaActual.codigo, userId: userId });
        
        // Redirigir a juegodeguerra.html
        window.location.href = `juegodeguerra.html?codigo=${partidaActual.codigo}`;
    } else {
        mostrarError('No hay partida a la que reconectarse.');
    }
}

// Función para manejar la lista de partidas disponibles
function manejarPartidasDisponibles(data) {
    console.log('📋 EVENTO: listaPartidas/partidasDisponibles recibido:', data);
    
    // Manejar ambos formatos: directo (serverhttps.py) o con wrapper (app.py)
    let partidas = [];
    if (Array.isArray(data)) {
        // Formato directo del serverhttps.py
        partidas = data;
    } else if (data && data.partidas) {
        // Formato con wrapper del app.py
        partidas = data.partidas;
    }
    
    console.log(`🎮 Se recibieron ${partidas.length} partidas disponibles`);
    actualizarListaPartidas(partidas);
}

function manejarPartidaCreada(partida) {
    console.log('🎯 EVENTO: partidaCreada recibido:', partida);
    console.log('📋 Datos de la partida:', JSON.stringify(partida, null, 2));
    
    if (!partida || !partida.codigo) {
        console.error('❌ Datos de partida inválidos:', partida);
        mostrarError('Error: Datos de partida inválidos');
        return;
    }
    
    // Verificar que estamos en la página correcta
    if (!window.location.href.includes('iniciarpartida.html')) {
        console.log('🔄 Redirigiendo a iniciarpartida.html...');
        sessionStorage.setItem('partidaPendiente', JSON.stringify(partida));
        window.location.href = `iniciarpartida.html?partida=${partida.codigo}`;
        return;
    }
    
    console.log('✅ Asignando partidaActual y llamando a mostrarSalaEspera...');
    partidaActual = partida;
    
    // Verificar elementos DOM con retry
    function verificarYMostrarSala(reintentos = 3) {
        const salaEspera = document.getElementById('salaEspera');
        const nombrePartidaSala = document.getElementById('nombrePartidaSala');
        const codigoPartidaSala = document.getElementById('codigoPartidaSala');
        
        if (salaEspera && nombrePartidaSala && codigoPartidaSala) {
            console.log('✅ Elementos DOM encontrados, mostrando sala...');
            mostrarSalaEspera(partida);
            console.log('🏁 manejarPartidaCreada completado');
            return;
        }
        
        if (reintentos > 0) {
            console.log(`⏳ Elementos no encontrados, reintentando... (${reintentos} restantes)`);
            setTimeout(() => verificarYMostrarSala(reintentos - 1), 500);
        } else {
            console.error('❌ No se pudieron encontrar elementos DOM después de varios intentos');
            alert('Error: No se puede mostrar la sala de espera. Recargar página.');
        }
    }
    
    verificarYMostrarSala();
}

function manejarUnidoAPartida(partida) {
    partidaActual = partida;
    mostrarSalaEspera(partida);
}

function manejarJugadorSalio(data) {
    if (partidaActual && partidaActual.codigo === data.codigoPartida) {
        actualizarListaJugadoresSala(data.jugadores);
        mostrarMensaje(`${data.nombreJugador} ha salido de la partida.`);
    }
}

function manejarPartidaCancelada(data) {
    console.log('Manejando cancelación de partida:', data);
    if (partidaActual && partidaActual.codigo === data.codigo) {
        // Limpiar estado local
        partidaActual = null;
        
        // Limpiar la sala de espera
        ocultarTodosLosFormularios();
        document.getElementById('modoSeleccion').style.display = 'block';
        
        // Salir de la sala
        socket.emit('leaveRoom', data.codigo);
        socket.emit('joinRoom', 'general');
        
        mostrarMensaje('La partida ha sido cancelada');
        
        // Solicitar actualización de la lista de partidas
        obtenerPartidasDisponibles();
    }
}

function manejarJugadorListoActualizado(data) {
    actualizarListaJugadoresSala(data.jugadores);
    if (data.todosListos && partidaActual.creadorId === userId) {
        document.getElementById('btnIniciarPartida').disabled = false;
    }
}

function manejarEquipoJugadorActualizado(data) {
    actualizarListaJugadoresSala(data.jugadores);
}

function manejarErrorPartida(error) {
    mostrarError(`Error en la partida: ${error.mensaje}`);
}

function invitarAmigo(amigoId) {
    if (partidaActual) {
        socket.emit('invitarAmigo', { amigoId: amigoId, partidaCodigo: partidaActual.codigo });
    } else {
        mostrarError('No hay una partida activa para invitar amigos.');
    }
}

function actualizarEstadoPartida(estado) {
    if (partidaActual) {
        partidaActual.estado = estado;
        actualizarInterfazSegunEstado();
    }
}

function actualizarInterfazSegunEstado() {
    if (!partidaActual) return;

    const btnIniciarPartida = document.getElementById('btnIniciarPartida');
    const btnListoJugador = document.getElementById('btnListoJugador');

    switch (partidaActual.estado) {
        case 'esperando':
            btnIniciarPartida.disabled = true;
            btnListoJugador.disabled = false;
            break;
        case 'listo':
            if (partidaActual.creadorId === userId) {
                btnIniciarPartida.disabled = false;
            }
            btnListoJugador.disabled = true;
            break;
        case 'iniciada':
            btnIniciarPartida.disabled = true;
            btnListoJugador.disabled = true;
            break;
    }
}



function actualizarInfoSalaEspera(configuracion, partida) {
    document.getElementById('nombrePartidaSala').textContent = configuracion.nombrePartida || 'Sin Nombre';
    document.getElementById('codigoPartidaSala').textContent = partida.codigo || 'Sin Código';
}

function mostrarBotonesCreador(esCreador) {
    document.getElementById('btnCancelarPartida').style.display = esCreador ? 'block' : 'none';
    document.getElementById('btnIniciarPartida').style.display = esCreador ? 'block' : 'none';
}

// En partidas.js, mejorar mostrarSalaEspera
function mostrarSalaEspera(partida) {
    console.log('👥 INICIANDO mostrarSalaEspera para partida:', partida.codigo);
    console.log('📄 Estado actual de la página:', window.location.href);
    console.log('🔍 Buscando elementos DOM...');
    
    // Verificar elementos requeridos
    const elementosRequeridos = [
        'salaEspera',
        'nombrePartidaSala', 
        'codigoPartidaSala',
        'jugadoresSala'
    ];
    
    const elementosNoEncontrados = elementosRequeridos.filter(id => !document.getElementById(id));
    
    if (elementosNoEncontrados.length > 0) {
        console.error('❌ Elementos DOM faltantes:', elementosNoEncontrados);
        console.log('📍 URL actual:', window.location.href);
        
        // Intentar redirigir si no estamos en la página correcta
        if (!window.location.href.includes('iniciarpartida.html')) {
            console.log('🔄 Redirigiendo a página correcta...');
            sessionStorage.setItem('partidaPendiente', JSON.stringify(partida));
            window.location.href = `iniciarpartida.html?partida=${partida.codigo}`;
            return;
        }
        
        // Si estamos en la página correcta pero faltan elementos, es un error
        alert(`Error: Elementos DOM faltantes: ${elementosNoEncontrados.join(', ')}`);
        return;
    }
    
    console.log('✅ Todos los elementos DOM presentes, continuando...');
    
    // ✅ CAMBIAR SALA DE CHAT:
    if (window.cambiarSalaChat) {
        const exito = window.cambiarSalaChat(partida.codigo);
        console.log('🔄 Cambio de sala chat:', exito ? 'exitoso' : 'falló');
    } else {
        console.error('❌ Función cambiarSalaChat no disponible');
    }
    
    // Buscar elementos de la sala de espera
    const salaEspera = document.getElementById('salaEspera');
    const nombrePartidaSala = document.getElementById('nombrePartidaSala');
    const codigoPartidaSala = document.getElementById('codigoPartidaSala');
    
    console.log('🪟 Elementos encontrados:');
    console.log('- salaEspera:', salaEspera ? 'SI' : 'NO');
    console.log('- nombrePartidaSala:', nombrePartidaSala ? 'SI' : 'NO');
    console.log('- codigoPartidaSala:', codigoPartidaSala ? 'SI' : 'NO');
    
    if (salaEspera && nombrePartidaSala && codigoPartidaSala) {
        console.log('✅ Configurando sala de espera...');
        
        // Actualizar información de la partida
        nombrePartidaSala.textContent = partida.configuracion?.nombrePartida || 'Partida Sin Nombre';
        codigoPartidaSala.textContent = partida.codigo;
        
        // Ocultar otros elementos y mostrar sala de espera
        ['modoLocal', 'modoOnline', 'formCrearPartida', 'formunirseAPartida'].forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.style.display = 'none';
                console.log(`🙈 Ocultado: ${id}`);
            }
        });
        
        // Mostrar sala de espera
        salaEspera.style.display = 'block';
        console.log('👥 Sala de espera mostrada');
        
        // Actualizar lista de jugadores
        console.log('👥 Actualizando lista de jugadores:', partida.jugadores);
        actualizarListaJugadoresSala(partida.jugadores);
        
        // Mostrar botones según si es creador
        const userId = window.userId || localStorage.getItem('userId');
        const esCreador = partida.jugadores.some(j => j.id == userId && j.esCreador);
        
        const btnIniciar = document.getElementById('btnIniciarPartida');
        const btnCancelar = document.getElementById('btnCancelarPartida');
        
        if (btnIniciar) btnIniciar.style.display = esCreador ? 'block' : 'none';
        if (btnCancelar) btnCancelar.style.display = esCreador ? 'block' : 'none';
        
        console.log('✅ Sala de espera configurada correctamente');
    } else {
        console.error('❌ No se encontraron elementos de sala de espera - revisando página actual...');
        console.log('📍 URL actual:', window.location.href);
        
        // Intentar redirigir a iniciarpartida.html si no estamos ahí
        if (!window.location.href.includes('iniciarpartida.html')) {
            console.log('🔄 Redirigiendo a iniciarpartida.html...');
            sessionStorage.setItem('partidaPendiente', JSON.stringify(partida));
            window.location.href = `iniciarpartida.html?partida=${partida.codigo}`;
        }
    }
    
    console.log('🏁 mostrarSalaEspera completado');
}

// Modificar la función existente actualizarListaPartidas para manejar posibles errores
function actualizarListaPartidas(partidas) {
    console.log('📝 Actualizando lista de partidas:', partidas);
    
    // ✅ VALIDAR ENTRADA:
    if (!partidas) {
        console.warn('⚠️ Lista de partidas undefined, ignorando actualización');
        return;
    }
    
    if (!Array.isArray(partidas)) {
        console.error('❌ La lista de partidas no es un array:', partidas);
        console.log('Tipo recibido:', typeof partidas);
        return;
    }
    
    const tablaBody = document.querySelector('#tablaPartidas tbody');
    if (!tablaBody) {
        console.error('❌ No se encontró tabla de partidas');
        return;
    }
    
    // Limpiar tabla
    tablaBody.innerHTML = '';
    
    // ✅ AGREGAR CADA PARTIDA:
    partidas.forEach(partida => {
        if (partida && partida.codigo) { // Validar partida individual
            const fila = crearFilaPartida(partida);
            tablaBody.appendChild(fila);
        } else {
            console.warn('⚠️ Partida inválida ignorada:', partida);
        }
    });
    
    console.log(`✅ Lista actualizada con ${partidas.length} partidas`);
}

function mostrarIndicadorCarga() {
    const indicador = document.getElementById('indicadorCarga');
    if (indicador) {
        indicador.style.display = 'block';
    }
}

function ocultarIndicadorCarga() {
    const indicador = document.getElementById('indicadorCarga');
    if (indicador) {
        indicador.style.display = 'none';
    }
}


function mostrarError(mensaje) {
    console.error('Error:', mensaje);  // Añade esto para logging
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = mensaje;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

function parseConfiguracionPartida(partida) {
    try {
        return typeof partida.configuracion === 'string' ? JSON.parse(partida.configuracion) : partida.configuracion;
    } catch (e) {
        console.error('Error al parsear la configuración:', e);
        return {};
    }
}

function validarCodigoPartida(codigo) {
    const regex = /^[a-zA-Z0-9]{6}$/;
    return regex.test(codigo);
}


// En partidas.js
function actualizarJugador(event) {
    if (!partidaActual) {
        console.error('No hay partida actual');
        return;
    }

    const tr = event.target.closest('tr');
    const checkboxListo = tr.querySelector('.checkbox-listo');
    const equipoSelect = tr.querySelector('.equipo-select');

    // No permitir marcar listo sin equipo asignado
    if (equipoSelect.value === 'sin_equipo' && checkboxListo.checked) {
        checkboxListo.checked = false;
        mostrarError('Debe seleccionar un equipo antes de marcarse como listo');
        return;
    }

    // Deshabilitar cambio de equipo si está listo
    if (checkboxListo.checked) {
        equipoSelect.disabled = true;
    } else {
        equipoSelect.disabled = false;
    }

    socket.emit('actualizarJugador', {
        codigo: partidaActual.codigo,
        userId: userId,
        equipo: equipoSelect.value,
        listo: checkboxListo.checked
    });
}

// Función para guardar configuración local de forma persistente
function guardarConfiguracionLocal(configuracion) {
    try {
        const datosGuardado = {
            configuracion: configuracion,
            timestamp: Date.now(),
            jugadores: configuracion.jugadores.map(j => ({
                ...j,
                equipoOriginal: j.equipo // Guardar equipo original
            }))
        };
        localStorage.setItem('configuracionPartidaLocal', JSON.stringify(datosGuardado));
        
        // También guardar en sessionStorage para mantener durante la redirección
        sessionStorage.setItem('datosPartidaActual', JSON.stringify({
            ...datosGuardado,
            userId: window.userId,
            userName: window.userName
        }));
        
        return true;
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        return false;
    }
}

//  funciones necesarias exportadas
window.unirseAPartida = unirseAPartida;
window.mostrarError = mostrarError;
window.actualizarListaPartidas = actualizarListaPartidas;
window.manejarPartidasDisponibles = manejarPartidasDisponibles;
window.parseConfiguracionPartida = parseConfiguracionPartida;
window.actualizarInfoSalaEspera = actualizarInfoSalaEspera;
window.mostrarBotonesCreador = mostrarBotonesCreador;
window.mostrarSalaEspera = mostrarSalaEspera;
window.inicializarPartidas = inicializarPartidas;
window.crearPartida = crearPartida;
window.salirSalaEspera = salirSalaEspera;
window.cancelarPartida = cancelarPartida;
window.marcarJugadorListo = marcarJugadorListo;
window.actualizarEquipoJugador = actualizarEquipoJugador;
window.iniciarPartida = iniciarPartida;
window.invitarAmigo = invitarAmigo;
window.actualizarEstadoPartida = actualizarEstadoPartida;
window.inicializarEventListenersPartidas = inicializarEventListenersPartidas;
window.iniciarJuegoLocal = iniciarJuegoLocal;
window.reconectarAPartida = reconectarAPartida;
window.manejarPartidaCreada = manejarPartidaCreada;
window.manejarUnidoAPartida = manejarUnidoAPartida;
window.manejarJugadorSalio = manejarJugadorSalio;
window.manejarPartidaCancelada = manejarPartidaCancelada;
window.manejarJugadorListoActualizado = manejarJugadorListoActualizado;
window.manejarEquipoJugadorActualizado = manejarEquipoJugadorActualizado;
window.manejarPartidaIniciada = manejarPartidaIniciada;
window.manejarErrorPartida = manejarErrorPartida;
window.actualizarListaJugadoresSala = actualizarListaJugadoresSala;
window.actualizarInterfazSegunEstado = actualizarInterfazSegunEstado;
window.mostrarIndicadorCarga = mostrarIndicadorCarga;
window.ocultarIndicadorCarga = ocultarIndicadorCarga;
window.validarCodigoPartida = validarCodigoPartida;