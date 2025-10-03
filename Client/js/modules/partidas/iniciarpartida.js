// iniciarpartida.js: Interacción con la interfaz y conexión de sockets

let partidaActual = null;
let usuariosConectados = new Map();
let listaAmigos = new Set();
let modoSeleccionado = null;
let socket = null;
let userId = null;
let userName = null;

// 🎯 EJECUTAR INMEDIATAMENTE - El DOM ya está cargado cuando el bootstrap llega aquí
console.log('🚀 Inicializando iniciarpartida (ejecución inmediata)');

// Verificar si el DOM está listo, si no esperar
if (document.readyState === 'loading') {
    console.log("⏳ DOM aún cargando, esperando...");
    document.addEventListener('DOMContentLoaded', inicializarAplicacion);
} else {
    console.log("✅ DOM ya cargado, inicializando iniciarpartida inmediatamente");
    inicializarAplicacion();
}

// Función auxiliar para generar ID de usuario
function generateUserId() {
    return Math.floor(Math.random() * 10000) + 1;
}

function inicializarAplicacion() {
    console.log('🚀 Ejecutando inicialización de iniciarpartida');
    
    // Verificar si MAIRA.UserIdentity está disponible
    if (!window.MAIRA || !window.MAIRA.UserIdentity) {
        console.warn('⚠️ MAIRA.UserIdentity no disponible, usando datos de localStorage');
        userId = localStorage.getItem('userId') || generateUserId();
        userName = localStorage.getItem('username') || 'Usuario';
        console.log('📝 Usuario fallback:', { userId, userName });
        return;
    }
    
    // Usar UserIdentity como fuente principal (coherencia en todo MAIRA)
    const userData = MAIRA.UserIdentity.obtenerUsuario();
    
    if (userData && userData.id) {
        userId = userData.id;
        userName = userData.nombre;
        
        // Sincronizar con localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', userName);
        
        console.log('📊 Usuario cargado desde UserIdentity:', { id: userId, nombre: userName });
    } else {
        // Fallback a localStorage
        userId = localStorage.getItem('userId');
        userName = localStorage.getItem('username');
    }
    
    if (!userId || !userName) {
        console.error('❌ No se pudieron obtener datos de usuario');
        window.location.href = 'index.html';
        return;
    }
    
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
    
    // ✅ Event listener para formulario crear partida online
    const formCrearPartida = document.querySelector('#formCrearPartida form');
    if (formCrearPartida) {
        formCrearPartida.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevenir recarga de página
            crearPartidaOnline();
        });
    }
    
    // ✅ Event listener alternativo para el botón directamente
    const btnCrearPartidaConfirmar = document.getElementById('btnCrearPartidaConfirmar');
    if (btnCrearPartidaConfirmar) {
        btnCrearPartidaConfirmar.addEventListener('click', function(e) {
            e.preventDefault(); // Prevenir submit del formulario
            crearPartidaOnline();
        });
    }
    
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

function iniciarJuegoLocal(configuracion) {
    console.log('🏠 Iniciando juego local con configuración:', configuracion);
    localStorage.setItem('configuracionPartidaLocal', JSON.stringify(configuracion));
    window.location.href = 'juegodeguerra.html';
}

function iniciarJuegoLocalDesdeUI() {
    if (validarConfiguracionJugadores()) {
        const configuracion = recopilarConfiguracionPartida();
        iniciarJuegoLocal(configuracion);
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
            id: `local_player_${index + 1}`, // ✅ ASIGNAR ID ÚNICO PARA MODO LOCAL
            nombre: jugadorElement.querySelector('input[type="text"]').value.trim(),
            username: jugadorElement.querySelector('input[type="text"]').value.trim(), // Alias para compatibilidad
            equipo: jugadorElement.querySelector('select').value,
            ia: jugadorElement.querySelector('input[type="checkbox"]').checked,
            esLocal: true // ✅ MARCAR COMO JUGADOR LOCAL
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

function unirseAPartida(codigo) {
    console.log('🎯 Función unirseAPartida llamada con código:', codigo);
    
    // Si no se proporciona código, obtenerlo del formulario
    if (!codigo) {
        codigo = document.getElementById('codigoPartida')?.value?.trim();
    }
    
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
    // Verificar que SERVER_URL esté disponible
    const serverUrl = window.SERVER_URL || 'http://localhost:5000';
    console.log('Conectando al servidor:', serverUrl);
    
    try {
        // ✅ OBTENER DATOS DEL USUARIO DESDE USERIDENTITY (MÁS CONFIABLE)
        let userInfo = null;
        let token = null;
        
        // Intentar obtener desde UserIdentity primero
        if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity && MAIRA.UserIdentity.estaAutenticado()) {
            const userData = MAIRA.UserIdentity.obtenerUsuario();
            userInfo = {
                id: userData.id,
                username: userData.nombre,
                token: localStorage.getItem('authToken')
            };
            token = userInfo.token;
            console.log('🔧 Usando datos de UserIdentity:', userInfo);
        } else {
            // Fallback a localStorage
            userInfo = JSON.parse(localStorage.getItem('usuario_info') || '{}');
            token = userInfo.token || localStorage.getItem('authToken');
            console.log('🔧 Usando datos de localStorage:', userInfo);
        }
        
        // ✅ Verificar que socket.io esté disponible
        if (typeof io === 'undefined') {
            console.error('❌ Socket.IO no está disponible. Verifique que el script se esté cargando correctamente.');
            mostrarError('Error de conexión: Socket.IO no disponible');
            return;
        }
        
        socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],  // ✅ Habilitar websockets + polling fallback
            timeout: 30000,
            forceNew: true,
            upgrade: true,  // ✅ Permitir upgrade a websocket para mejor rendimiento
            auth: {
                token: token,
                userId: userInfo.id,
                username: userInfo.username
            }
        });

        socket.on('connect', function() {
            console.log('Conectado al servidor');
            console.log('Socket ID:', socket.id);
            
            // ✅ ENVIAR AUTENTICACIÓN INMEDIATAMENTE DESPUÉS DE CONECTAR
            // Re-obtener datos más actualizados en caso de que hayan cambiado
            let currentUserInfo = userInfo;
            if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity && MAIRA.UserIdentity.estaAutenticado()) {
                const userData = MAIRA.UserIdentity.obtenerUsuario();
                currentUserInfo = {
                    id: userData.id,
                    username: userData.nombre
                };
            }
            
            if (currentUserInfo && currentUserInfo.id) {
                console.log('🚀 Enviando autenticación:', {
                    user_id: currentUserInfo.id,
                    username: currentUserInfo.username
                });
                socket.emit('login', {
                    user_id: currentUserInfo.id,      // ✅ CORREGIDO: snake_case
                    username: currentUserInfo.username
                });
            } else {
                console.error('❌ No se puede autenticar - datos de usuario no disponibles:', {
                    userInfo: currentUserInfo,
                    hasId: !!currentUserInfo?.id
                });
            }
            
            // ✅ EXPONER SOCKET GLOBALMENTE
            window.socket = socket;
            console.log('🌐 Socket expuesto globalmente');
            
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
        
        // ✅ LISTENER PARA RESPUESTA DE AUTENTICACIÓN
        socket.on('loginResponse', function(response) {
            console.log('🔐 Respuesta de autenticación:', response);
            if (response.success) {
                console.log('✅ Login exitoso');
            } else {
                console.error('❌ Login fallido:', response.message);
            }
        });
        
        // ✅ LISTENER PARA CONFIRMACIÓN DE LOGIN (ALTERNATIVO)
        socket.on('login_success', function(data) {
            console.log('✅ Login exitoso (confirmación):', data);
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
        
        // ✅ EXPONER SOCKET GLOBALMENTE PARA DEBUG
        window.socket = socket;
        
    } catch (error) {
        console.error('Error al inicializar socket:', error);
        mostrarError('Error de conexión con el servidor');
    }
}


// EN iniciarpartida.js - AGREGAR función faltante antes de las exportaciones:




function manejarConexion() {
    console.log('Conectado al servidor');
    socket.emit('login', { user_id: userId, username: userName });

    // Solicitar listas después de conectarse al servidor
    console.log('Solicitando listas después de conectarse');
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
    let currentUserId, currentUserName;
    
    if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity && MAIRA.UserIdentity.isAuthenticated()) {
        currentUserId = MAIRA.UserIdentity.getUserId();
        currentUserName = MAIRA.UserIdentity.getUsername();
    } else {
        // Fallback a variables globales
        currentUserId = userId;
        currentUserName = userName;
    }
    
    if (!currentUserId || !currentUserName) {
        console.error('❌ Datos de usuario no configurados');
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

function crearPartidaOnline() {
    console.log('🎮 Creando partida online...');
    
    // Verificar conexión de socket
    if (!socket || !socket.connected) {
        console.error('❌ Socket no conectado');
        alert('Error: No hay conexión con el servidor. Inténtalo de nuevo.');
        return;
    }
    
    // Obtener datos del formulario
    const nombrePartida = document.getElementById('nombrePartida').value.trim();
    const duracionPartida = parseInt(document.getElementById('duracionPartida').value);
    const duracionTurno = parseInt(document.getElementById('duracionTurno').value);
    const objetivoPartida = document.getElementById('objetivoPartida').value.trim();
    
    // Validar campos
    if (!nombrePartida || !duracionPartida || !duracionTurno || !objetivoPartida) {
        alert('Por favor, complete todos los campos');
        return;
    }
    
    if (duracionPartida <= 0 || duracionTurno <= 0) {
        alert('La duración de la partida y del turno deben ser mayor a 0');
        return;
    }
    
    // Obtener datos de usuario
    let currentUserId, currentUserName;
    
    if (typeof MAIRA !== 'undefined' && MAIRA.UserIdentity && MAIRA.UserIdentity.isAuthenticated()) {
        currentUserId = MAIRA.UserIdentity.getUserId();
        currentUserName = MAIRA.UserIdentity.getUsername();
    } else {
        // Fallback a localStorage
        currentUserId = localStorage.getItem('userId');
        currentUserName = localStorage.getItem('username');
    }
    
    if (!currentUserId || !currentUserName) {
        console.error('❌ Datos de usuario no configurados');
        alert('Error: Datos de usuario no configurados. Redirigiendo a inicio.');
        window.location.href = 'index.html';
        return;
    }
    
    console.log(`✅ Usuario validado: ${currentUserName} (${currentUserId})`);
    
    const configuracion = {
        nombrePartida,
        duracionPartida,
        duracionTurno,
        objetivoPartida,
        modo: modoSeleccionado || 'online',
        creadorId: currentUserId
    };
    
    console.log('🚀 Enviando crear partida al servidor...');
    console.log('🔍 DEBUG - Socket conectado:', socket.connected);
    console.log('🔍 DEBUG - Socket ID:', socket.id);
    console.log('🔍 DEBUG - Configuración a enviar:', configuracion);
    
    // Configurar listeners para respuesta del servidor
    socket.once('partidaCreada', function(datosPartida) {
        clearTimeout(timeoutId); // ✅ Limpiar timeout al recibir respuesta
        console.log('✅ Partida creada exitosamente:', datosPartida);
        partidaActual = datosPartida;
        
        // Limpiar formulario
        limpiarFormularioCrearPartida();
        
        // Mostrar sala de espera
        mostrarSalaEspera(datosPartida);
        
        // Cambiar de sala para el chat si existe la función
        if (window.cambiarSalaChat) {
            window.cambiarSalaChat(datosPartida.codigo);
        }
    });
    
    socket.once('errorCrearPartida', function(error) {
        clearTimeout(timeoutId); // ✅ Limpiar timeout al recibir error
        console.error('❌ Error al crear partida:', error);
        alert(error.mensaje || 'Error al crear la partida');
    });
    
    // ✅ TIMEOUT DE SEGURIDAD para detectar si servidor no responde
    const timeoutId = setTimeout(() => {
        console.warn('⏰ TIMEOUT: El servidor no respondió en 10 segundos');
        console.log('🔍 DEBUG - Estado del socket después de timeout:', {
            connected: socket.connected,
            id: socket.id,
            readyState: socket.io?.readyState
        });
        alert('El servidor está tardando en responder. Por favor, inténtalo de nuevo.');
    }, 10000);
    
    // ✅ TIMEOUT MANEJADO EN EL LISTENER PRINCIPAL - NO DUPLICAR LISTENERS
    
    // Emitir evento para crear partida
    console.log('📤 Emitiendo evento crearPartida...');
    socket.emit('crearPartida', { configuracion });
    console.log('📤 Evento emitido, esperando respuesta...');
}

function mostrarSalaEspera(datosPartida) {
    console.log('📋 Mostrando sala de espera para partida:', datosPartida);
    
    // Ocultar todos los formularios
    ocultarTodosLosFormularios();
    
    // Mostrar sala de espera
    const salaEspera = document.getElementById('salaEspera');
    if (salaEspera) {
        salaEspera.style.display = 'block';
        
        // Actualizar información de la partida
        const nombrePartidaSala = document.getElementById('nombrePartidaSala');
        const codigoPartidaSala = document.getElementById('codigoPartidaSala');
        
        if (nombrePartidaSala) nombrePartidaSala.textContent = datosPartida.configuracion.nombrePartida;
        if (codigoPartidaSala) codigoPartidaSala.textContent = datosPartida.codigo;
        
        // Actualizar lista de jugadores
        if (datosPartida.jugadores) {
            actualizarListaJugadoresSala(datosPartida.jugadores);
        }
        
        // Mostrar botones del creador si es el creador
        const currentUserId = MAIRA?.UserIdentity?.getUserId() || localStorage.getItem('userId');
        const esCreador = datosPartida.creadorId === currentUserId;
        
        const btnIniciarPartida = document.getElementById('btnIniciarPartida');
        const btnCancelarPartida = document.getElementById('btnCancelarPartida');
        
        if (btnIniciarPartida) btnIniciarPartida.style.display = esCreador ? 'block' : 'none';
        if (btnCancelarPartida) btnCancelarPartida.style.display = esCreador ? 'block' : 'none';
    }
}

function actualizarListaJugadoresSala(jugadores) {
    const tbody = document.querySelector('#jugadoresSala tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    jugadores.forEach(jugador => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${jugador.username || jugador.nombre}</td>
            <td><span class="badge badge-${jugador.equipo === 'rojo' ? 'danger' : 'primary'}">${jugador.equipo}</span></td>
            <td>${jugador.listo ? '<span class="text-success">✓ Listo</span>' : '<span class="text-warning">⏳ Esperando</span>'}</td>
        `;
        tbody.appendChild(tr);
    });
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
// ✅ FUNCIONES AUXILIARES FALTANTES
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
    console.error('❌ Error:', mensaje);
    alert(mensaje); // Por ahora usar alert, después se puede mejorar con modal
}

// ✅ EXPORTACIONES GLOBALES
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
window.crearPartida = crearPartida;
window.crearPartidaOnline = crearPartidaOnline;
window.iniciarJuegoLocal = iniciarJuegoLocal;
window.mostrarSalaEspera = mostrarSalaEspera;
window.actualizarListaJugadoresSala = actualizarListaJugadoresSala;

// Función para inicializar el chat
window.inicializarChat = function(socketInstance) {
    try {
        console.log('💬 Inicializando chat en iniciarpartida...');
        
        if (typeof MAIRAChat !== 'undefined') {
            const exito = MAIRAChat.inicializar({
                socket: socketInstance,
                usuario: userName || 'Usuario',
                modulo: 'iniciarpartida'
            });
            
            if (exito) {
                console.log('✅ Chat inicializado correctamente en iniciarpartida');
                return true;
            } else {
                console.warn('⚠️ Falló inicialización del chat en iniciarpartida');
                return false;
            }
        } else {
            console.error('❌ MAIRAChat no disponible en iniciarpartida');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al inicializar chat en iniciarpartida:', error);
        return false;
    }
};

// Inicialización cuando se carga la página
window.onload = function() {
    inicializarInterfazUsuario();
};