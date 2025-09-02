// iniciarpartida.js: Interacción con la interfaz y conexión de sockets

let partidaActual = null;
let usuariosConectados = new Map();
let listaAmigos = new Set();
let modoSeleccionado = null;

// ✅ VARIABLES GLOBALES CRÍTICAS
let userId = null;
let userName = null;
let socket = null;

document.addEventListener('DOMContentLoaded', inicializarAplicacion);

function inicializarAplicacion() {
    const userIdStr = localStorage.getItem('userId');
    userId = userIdStr ? parseInt(userIdStr, 10) : null;  // ✅ Convertir a número
    userName = localStorage.getItem('username');
    
    console.log('🔍 Datos del localStorage:');
    console.log('   userId (string):', userIdStr);
    console.log('   userId (convertido):', userId, 'tipo:', typeof userId);
    console.log('   userName:', userName);
    console.log('   isLoggedIn:', localStorage.getItem('isLoggedIn'));
    
    if (!userId || !userName || isNaN(userId)) {
        console.log('❌ Datos de usuario incompletos o inválidos, redirigiendo a index.html');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Datos de usuario válidos, continuando...');
    inicializarSocket();
    inicializarEventListeners();
    inicializarInterfazUsuario();
}

function inicializarEventListeners() {
    document.getElementById('modoJuego').addEventListener('change', cambiarModoJuego);
    document.getElementById('crearPartida').addEventListener('click', mostrarFormularioCrearPartida);
    document.getElementById('unirseAPartida').addEventListener('click', mostrarFormulariounirseAPartida);
    document.getElementById('btnRegresarModo').addEventListener('click', () => window.location.href = 'planeamiento.html');
    document.getElementById('cantidadJugadoresLocal').addEventListener('change', actualizarCantidadJugadoresLocal);
    document.getElementById('continuarConfiguracionJugadores').addEventListener('click', continuarConfiguracionJugadores);
    document.getElementById('volverConfiguracionGeneral').addEventListener('click', volverConfiguracionGeneral);
    document.getElementById('iniciarJuegoLocal').addEventListener('click', iniciarJuegoLocalDesdeUI);
    
    // Listeners para preferencias
    document.getElementById('volumenJuego')?.addEventListener('change', guardarPreferencias);
    document.getElementById('temaOscuro')?.addEventListener('change', cambiarTema);
}

function actualizarInfoUsuario() {
    const nombreElement = document.getElementById('nombreJugadorActual');
    const idElement = document.getElementById('idJugadorActual');
    if (nombreElement && idElement) {
        nombreElement.textContent = userName;
        idElement.textContent = userId;
    }
}

function cambiarModoJuego() {
    modoSeleccionado = document.getElementById('modoJuego').value;
    ocultarTodosLosFormularios();
    document.getElementById(modoSeleccionado === 'local' ? 'modoLocal' : 'modoOnline').style.display = 'block';
}

function mostrarFormularioCrearPartida() {
    ocultarTodosLosFormularios();
    document.getElementById('formCrearPartida').style.display = 'block';
}

function mostrarFormulariounirseAPartida() {
    ocultarTodosLosFormularios();
    document.getElementById('formunirseAPartida').style.display = 'block';
}

function ocultarTodosLosFormularios() {
    ['modoLocal', 'modoOnline', 'formCrearPartida', 'formunirseAPartida', 'salaEspera'].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.style.display = 'none';
    });
}

function actualizarListaUsuarios(data) {
    const listaUsuarios = document.getElementById('listaUsuarios');
    if (listaUsuarios) {
        listaUsuarios.innerHTML = '';
        data.forEach(usuario => {
            if (usuario.id !== userId) {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.textContent = usuario.username;
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-primary btnAgregarAmigo';
                button.textContent = 'Agregar Amigo';
                button.onclick = () => agregarAmigo(usuario.id, usuario.username);
                li.appendChild(button);
                listaUsuarios.appendChild(li);
            }
        });
    }
}

function obtenerListaAmigos() {
    console.log('Solicitando lista de amigos');
    socket.emit('obtenerListaAmigos');
}

function actualizarListaAmigos(amigos) {
    const listaAmigos = document.getElementById('listaAmigos');
    if (listaAmigos) {
        listaAmigos.innerHTML = Array.isArray(amigos) && amigos.length > 0
            ? amigos.map(amigo => crearElementoAmigo(amigo)).join('')
            : '<li class="list-group-item">No tienes amigos en tu lista.</li>';
    } else {
        console.error('Elemento listaAmigos no encontrado');
    }
}

function crearElementoAmigo(amigo) {
    return `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            ${amigo.username}
            <button class="btn btn-sm btn-danger" onclick="eliminarAmigo('${amigo.id}')">Eliminar</button>
        </li>
    `;
}

function agregarAmigo(amigoId, amigoNombre) {
    socket.emit('agregarAmigo', { amigoId: amigoId });
    console.log(`Intentando agregar amigo: ${amigoNombre} (ID: ${amigoId})`);
}

function eliminarAmigo(amigoId) {
    socket.emit('eliminarAmigo', { amigoId: amigoId });
}

function manejarAmigoAgregado(data) {
    console.log(`Amigo agregado: ${data.amigoNombre}`);
    obtenerListaAmigos();
    mostrarMensaje(`Amigo ${data.amigoNombre} agregado con éxito`);
}

function manejarAmigoEliminado(data) {
    obtenerListaAmigos();
    mostrarMensaje(`Amigo eliminado con éxito.`);
}

function manejarErrorEliminarAmigo(data) {
    mostrarError(data.mensaje);
}

function cargarDatosIniciales() {
    obtenerListaAmigos();
    obtenerPartidasDisponibles();
}

function guardarPreferencias() {
    const volumen = document.getElementById('volumenJuego').value;
    const temaOscuro = document.getElementById('temaOscuro').checked;
    
    localStorage.setItem('preferencias', JSON.stringify({ volumen, temaOscuro }));
    mostrarMensaje('Preferencias guardadas correctamente.');
}

function cargarPreferencias() {
    const preferencias = JSON.parse(localStorage.getItem('preferencias')) || {};
    if (preferencias.volumen) {
        document.getElementById('volumenJuego').value = preferencias.volumen;
    }
    if (preferencias.temaOscuro !== undefined) {
        document.getElementById('temaOscuro').checked = preferencias.temaOscuro;
        aplicarTema(preferencias.temaOscuro);
    }
}

function cambiarTema(event) {
    aplicarTema(event.target.checked);
    guardarPreferencias();
}

function aplicarTema(esOscuro) {
    document.body.classList.toggle('tema-oscuro', esOscuro);
}

function reconectarAlJuego() {
    if (partidaActual) {
        socket.emit('reconectarPartida', { userId, codigoPartida: partidaActual.codigo });
    }
}

function mostrarMensaje(mensaje) {
    mostrarNotificacion(mensaje, 'mensajeContainer');
}

function mostrarNotificacion(mensaje, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = mensaje;
        container.style.display = 'block';
        setTimeout(() => { container.style.display = 'none'; }, 5000);
    }
}

function actualizarCantidadJugadoresLocal() {
    let cantidadJugadores = parseInt(this.value, 10);
    actualizarListaJugadoresLocal(Math.max(2, cantidadJugadores));
}

function continuarConfiguracionJugadores() {
    if (validarConfiguracionGeneral()) {
        document.getElementById('configuracionGeneralLocal').style.display = 'none';
        document.getElementById('configuracionJugadoresLocal').style.display = 'block';
        actualizarListaJugadoresLocal();
    }
}

function volverConfiguracionGeneral() {
    document.getElementById('configuracionJugadoresLocal').style.display = 'none';
    document.getElementById('configuracionGeneralLocal').style.display = 'block';
}

function iniciarJuegoLocalDesdeUI() {
    if (validarConfiguracionJugadores()) {
        const configuracion = recopilarConfiguracionPartida();
        localStorage.setItem('configuracionPartidaLocal', JSON.stringify(configuracion));
        window.location.href = 'juegodeguerra.html';
    }
}

function validarConfiguracionGeneral() {
    const nombrePartida = document.getElementById('nombrePartidaLocal').value.trim();
    const duracionPartida = parseInt(document.getElementById('duracionPartidaLocal').value);
    const duracionTurno = parseInt(document.getElementById('duracionTurnoLocal').value);
    const objetivo = document.getElementById('objetivoPartidaLocal').value.trim();

    if (!nombrePartida) {
        mostrarError('Por favor, ingrese un nombre para la partida.');
        return false;
    }

    if (isNaN(duracionPartida) || duracionPartida < 30 || duracionPartida > 240) {
        mostrarError('La duración de la partida debe ser entre 30 y 240 minutos.');
        return false;
    }

    if (isNaN(duracionTurno) || duracionTurno < 1 || duracionTurno > 30) {
        mostrarError('La duración del turno debe ser entre 1 y 30 minutos.');
        return false;
    }

    if (!objetivo) {
        mostrarError('Por favor, ingrese un objetivo para la partida.');
        return false;
    }

    return true;
}

function validarConfiguracionJugadores() {
    const jugadores = document.querySelectorAll('#jugadoresLocal tbody tr');
    const nombresJugadores = new Set();

    for (let i = 0; i < jugadores.length; i++) {
        const nombreJugador = jugadores[i].querySelector('input[type="text"]').value.trim();
        if (!nombreJugador) {
            mostrarError(`Por favor, ingrese un nombre para el Jugador ${i + 1}.`);
            return false;
        }
        if (nombresJugadores.has(nombreJugador)) {
            mostrarError(`El nombre "${nombreJugador}" está duplicado. Por favor, use nombres únicos.`);
            return false;
        }
        nombresJugadores.add(nombreJugador);
    }

    return true;
}

function recopilarConfiguracionPartida() {
    const configuracion = {
        nombrePartida: document.getElementById('nombrePartidaLocal').value.trim(),
        duracionPartida: parseInt(document.getElementById('duracionPartidaLocal').value),
        duracionTurno: parseInt(document.getElementById('duracionTurnoLocal').value),
        objetivoPartida: document.getElementById('objetivoPartidaLocal').value.trim(),
        cantidadJugadores: parseInt(document.getElementById('cantidadJugadoresLocal').value),
        jugadores: []
    };

    const jugadoresElements = document.querySelectorAll('#jugadoresLocal tbody tr');
    jugadoresElements.forEach((jugadorElement, index) => {
        configuracion.jugadores.push({
            nombre: jugadorElement.querySelector('input[type="text"]').value.trim(),
            equipo: jugadorElement.querySelector('select').value,
            ia: jugadorElement.querySelector('input[type="checkbox"]').checked
        });
    });

    return configuracion;
}

function actualizarListaJugadoresLocal() {
    const cantidadJugadores = parseInt(document.getElementById('cantidadJugadoresLocal').value);
    const tbody = document.querySelector('#jugadoresLocal tbody');
    tbody.innerHTML = '';
    for (let i = 1; i <= cantidadJugadores; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>Jugador ${i}</td>
            <td><input type="text" class="form-control" placeholder="Nombre"></td>
            <td>
                <select class="form-control">
                    <option value="rojo">Rojo</option>
                    <option value="azul">Azul</option>
                </select>
            </td>
            <td><input type="checkbox"></td>
        `;
        tbody.appendChild(tr);
    }
}

function manejarInvitacionRecibida(data) {
    const { invitador, codigoPartida } = data;
    if (confirm(`${invitador} te ha invitado a unirte a su partida. ¿Deseas aceptar?`)) {
        socket.emit('unirseAPartida', { codigo: codigoPartida });
    }
}



function limpiarFormularioCrearPartida() {
    document.getElementById('nombrePartida').value = '';
    document.getElementById('duracionPartida').value = '';
    document.getElementById('duracionTurno').value = '';
    document.getElementById('objetivoPartida').value = '';
}

// Función para manejar la actualización de la sala de espera
function actualizarSalaDeEspera(partida) {
    if (partidaActual && partidaActual.codigo === partida.codigo) {
        actualizarListaJugadoresSala(partida.jugadores);
    }
}


function iniciarJuego(data) {
    console.log('Iniciando juego con los datos de la partida:', data);
    if (partidaActual) {
        window.location.href = `juegodeguerra.html?codigo=${partidaActual.codigo}`;
    } else {
        mostrarError('Error al iniciar el juego, no se encuentra la partida.');
    }
}


async function inicializarSocket() {
    console.log('Conectando al servidor:', SERVER_URL);
    
    try {
        socket = io(SERVER_URL, {
            transports: ['polling'],  // Solo polling para Render
            timeout: 30000,
            forceNew: true,
            upgrade: false  // No intentar upgrade a websocket
        });

        socket.on('connect', function() {
            console.log('Conectado al servidor');
            console.log('Socket ID:', socket.id);
            
            // ✅ CORREGIR LLAMADA:
            if (window.inicializarChat) {
                const resultado = window.inicializarChat(socket);
                console.log('✅ Chat inicializado:', resultado);
            } else {
                console.error('❌ Función inicializarChat no encontrada');
            }
            
            console.log('Solicitando listas después de conectarse');
            obtenerListaAmigos();  // ✅ CORREGIR: era solicitarListaAmigos()
            obtenerPartidasDisponibles();
        });
        
        socket.on('disconnect', () => mostrarError('Se ha perdido la conexión con el servidor. Intentando reconectar...'));
        socket.on('reconnect', manejarReconexion);
        socket.on('connect_error', manejarErrorConexion);

        // Manejar la respuesta del servidor con la lista de partidas disponibles
        socket.on('listaPartidas', function(partidas) {
            console.log('Lista de partidas disponibles recibida:', partidas);
            
            // ✅ VALIDAR Y ACTUALIZAR:
            if (Array.isArray(partidas)) {
                actualizarListaPartidas(partidas);
            } else {
                console.error('❌ Lista de partidas inválida recibida:', partidas);
            }
        });

        // Manejar lista de partidas actualizada cada vez que haya un cambio
        socket.on('listaPartidasActualizada', function(partidas) {
            console.log('Lista de partidas actualizada recibida:', partidas);
            
            // ✅ VALIDAR ANTES DE ACTUALIZAR:
            if (Array.isArray(partidas)) {
                actualizarListaPartidas(partidas);
            } else if (partidas === undefined || partidas === null) {
                console.warn('⚠️ Actualización de partidas vacía, manteniendo lista actual');
            } else {
                console.error('❌ Actualización de partidas inválida:', partidas);
            }
        });
        
        // Eventos específicos del juego
        socket.on('usuariosConectados', actualizarListaUsuarios);
        socket.on('amigoAgregado', manejarAmigoAgregado);
        socket.on('amigoEliminado', manejarAmigoEliminado);
        socket.on('errorEliminarAmigo', manejarErrorEliminarAmigo);
        socket.on('listaAmigos', actualizarListaAmigos);
        socket.on('invitacionRecibida', manejarInvitacionRecibida);
        
        // ✅ REMOVIDO DUPLICADO: socket.on('partidaCreada') ya está manejado en partidas.js
        
        socket.on('partidaIniciada', function(datosPartida) {
        console.log('Recibidos datos de partida iniciada:', datosPartida);
        
        if (!datosPartida || !datosPartida.jugadores) {
            console.error('Datos de partida inválidos:', datosPartida);
            mostrarError('Error al iniciar partida: datos inválidos');
            return;
        }

        // Guardar datos importantes en localStorage
        localStorage.setItem('partidaActual', JSON.stringify({
            codigo: datosPartida.codigo,
            jugadores: datosPartida.jugadores,
            equipoJugador: datosPartida.jugadores.find(j => j.id === userId)?.equipo
        }));

        // Verificar y establecer director si es necesario
        const jugadoresAzules = datosPartida.jugadores.filter(j => j.equipo === 'azul');
        if (jugadoresAzules.length > 0 && !datosPartida.director) {
            const primerJugadorAzul = jugadoresAzules[0];
            if (primerJugadorAzul.id === userId) {
                console.log('Asignado como director temporal');
                socket.emit('asignarDirectorTemporal', {
                    jugadorId: userId,
                    partidaCodigo: datosPartida.codigo
                });
            }
        }

        console.log('Redirigiendo a juego de guerra...');
        window.location.href = `juegodeguerra.html?codigo=${datosPartida.codigo}`;
    });

        // Agregar evento para director asignado
        socket.on('directorAsignado', function(datos) {
            console.log('Director asignado:', datos);
            if (datos.director === userId) {
                console.log('Soy el director temporal');
            }
        });



        socket.on('errorCreacionPartida', function(error) {
            mostrarError(error.mensaje);
        });
        
        socket.on('equipoJugadorActualizado', function(data) {
            console.log('Equipo del jugador actualizado:', data);
            if (data.jugadores && Array.isArray(data.jugadores)) {
                actualizarListaJugadoresSala(data.jugadores);
            } else {
                console.error('Error: La lista de jugadores es inválida o no se recibió correctamente.');
            }
        });
        
        socket.on('unidoAPartida', function(datosPartida) {
            console.log("Unido a la partida con éxito:", datosPartida);
        
            if (!datosPartida.configuracion) {
                console.error("Configuración no definida:", datosPartida);
                mostrarError("No se ha podido obtener la configuración de la partida.");
                return;
            }
        
            partidaActual = datosPartida;
            mostrarSalaEspera(partidaActual);
        });
        

        // ✅ ASEGURAR CIERRE CORRECTO:
        socket.on('error', function(error) {
            console.error('Error de socket:', error);
            mostrarError('Error de conexión: ' + error.message);
        });
        
    } catch (error) {
        console.error('Error al inicializar socket:', error);
        mostrarError('Error de conexión con el servidor');
    }
}


// EN iniciarpartida.js - AGREGAR función faltante antes de las exportaciones:




function manejarConexion() {
    console.log('✅ Conectado al servidor');
    console.log('🔍 Variables antes del login:');
    console.log('   userId (variable):', userId, 'tipo:', typeof userId);
    console.log('   userName (variable):', userName, 'tipo:', typeof userName);
    console.log('   localStorage userId:', localStorage.getItem('userId'));
    console.log('   localStorage username:', localStorage.getItem('username'));
    
    // ✅ CRÍTICO: Enviar con el formato que espera el backend
    const loginData = { 
        user_id: userId,    // Backend espera 'user_id'
        username: userName  // Backend espera 'username'
    };
    
    console.log('🔐 Enviando login con data:', JSON.stringify(loginData));
    socket.emit('login', loginData);

    // Solicitar listas después de conectarse al servidor
    console.log('📡 Solicitando listas después de conectarse');
    obtenerListaAmigos();
    obtenerPartidasDisponibles();
}


function manejarReconexion() {
    mostrarMensaje('Reconectado al servidor.');
    if (partidaActual) {
        reconectarAlJuego();
    }
}

function manejarErrorConexion(error) {
    console.error('Error de conexión:', error);
    mostrarError('Error de conexión con el servidor. Por favor, intenta de nuevo más tarde.');
}



function inicializarInterfazUsuario() {
    actualizarInfoUsuario();
    ocultarTodosLosFormularios();
    document.getElementById('modoSeleccion').style.display = 'block';
    actualizarListaJugadoresLocal(2);  // Inicializar con 2 jugadores
}

function obtenerPartidasDisponibles() {
    if (socket && socket.connected) {
        console.log('Solicitando lista de partidas disponibles');
        socket.emit('obtenerPartidasDisponibles');
    } else {
        console.error('El socket no está conectado. No se puede solicitar la lista de partidas disponibles.');
    }
}

// Exportar funciones necesarias
window.obtenerListaAmigos = obtenerListaAmigos;
window.agregarAmigo = agregarAmigo;
window.eliminarAmigo = eliminarAmigo;
window.guardarPreferencias = guardarPreferencias;
window.cargarPreferencias = cargarPreferencias;
window.aplicarTema = aplicarTema;
window.mostrarMensaje = mostrarMensaje;
window.iniciarJuego = iniciarJuego;
window.actualizarSalaDeEspera = actualizarSalaDeEspera;
window.limpiarFormularioCrearPartida = limpiarFormularioCrearPartida;
window.manejarInvitacionRecibida = manejarInvitacionRecibida;
window.inicializarAplicacion = inicializarAplicacion;
window.inicializarSocket = inicializarSocket;
window.manejarReconexion = manejarReconexion;
window.manejarErrorConexion = manejarErrorConexion;
window.inicializarEventListeners = inicializarEventListeners;
window.inicializarInterfazUsuario = inicializarInterfazUsuario;
window.actualizarInfoUsuario = actualizarInfoUsuario;
window.cambiarModoJuego = cambiarModoJuego;
window.mostrarFormularioCrearPartida = mostrarFormularioCrearPartida;
window.obtenerPartidasDisponibles = obtenerPartidasDisponibles;
window.mostrarFormulariounirseAPartida = mostrarFormulariounirseAPartida;
window.ocultarTodosLosFormularios = ocultarTodosLosFormularios;
window.actualizarListaUsuarios = actualizarListaUsuarios;
window.actualizarListaAmigos = actualizarListaAmigos;
window.crearElementoAmigo = crearElementoAmigo;
window.manejarAmigoAgregado = manejarAmigoAgregado;
window.manejarAmigoEliminado = manejarAmigoEliminado;
window.manejarErrorEliminarAmigo = manejarErrorEliminarAmigo;
window.cargarDatosIniciales = cargarDatosIniciales;
window.cambiarTema = cambiarTema;
window.reconectarAlJuego = reconectarAlJuego;
window.mostrarNotificacion = mostrarNotificacion;
window.actualizarCantidadJugadoresLocal = actualizarCantidadJugadoresLocal;
window.continuarConfiguracionJugadores = continuarConfiguracionJugadores;
window.volverConfiguracionGeneral = volverConfiguracionGeneral;
window.iniciarJuegoLocalDesdeUI = iniciarJuegoLocalDesdeUI;
window.validarConfiguracionGeneral = validarConfiguracionGeneral;
window.validarConfiguracionJugadores = validarConfiguracionJugadores;
window.recopilarConfiguracionPartida = recopilarConfiguracionPartida;
window.actualizarListaJugadoresLocal = actualizarListaJugadoresLocal;
window.manejarConexion = manejarConexion;
window.unirseAPartida = unirseAPartida;

// Inicialización cuando se carga la página
window.onload = function() {
    inicializarInterfazUsuario();
};