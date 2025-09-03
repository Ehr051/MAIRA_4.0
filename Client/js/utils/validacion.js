// Configuración de la URL base de la API
const isLocalDevelopment = false; // Cambia esto a true para desarrollo local
const API_BASE_URL = window.getServerUrl ? window.getServerUrl() : (SERVER_URL || 'http://localhost:5000');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');

    // Inicializar todos los event listeners
    inicializarEventListeners();
});

function inicializarEventListeners() {
    // Botones de inicio
    const btnLogin = document.getElementById('btnLogin');
    const btnCrearUsuario = document.getElementById('btnCrearUsuario');

    // Formularios
    const loginForm = document.getElementById('formLogin');
    const crearUsuarioForm = document.getElementById('formCrearUsuario');

    // Botones de cierre
    const cerrarLogin = document.getElementById('cerrarLogin');
    const cerrarCrearUsuario = document.getElementById('cerrarCrearUsuario');

    // Botón de recuperar contraseña
    const btnRecuperarContrasena = document.getElementById('btnRecuperarContrasena');

    // Botones de selección de modo
    const btnModoPlaneamiento = document.getElementById('btnModoPlaneamiento');
    const btnModoJuegoGuerra = document.getElementById('btnModoJuegoGuerra');

    // Event listeners para mostrar/ocultar formularios
    if (btnLogin) btnLogin.addEventListener('click', () => mostrarFormulario('loginForm'));
    if (btnCrearUsuario) btnCrearUsuario.addEventListener('click', () => mostrarFormulario('crearUsuarioForm'));
    if (cerrarLogin) cerrarLogin.addEventListener('click', () => ocultarFormulario('loginForm'));
    if (cerrarCrearUsuario) cerrarCrearUsuario.addEventListener('click', () => ocultarFormulario('crearUsuarioForm'));

    // Event listeners para envío de formularios
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (crearUsuarioForm) crearUsuarioForm.addEventListener('submit', handleCrearUsuario);

    // Event listener para recuperar contraseña
    if (btnRecuperarContrasena) btnRecuperarContrasena.addEventListener('click', handleRecuperarContrasena);

    // Event listeners para selección de modo
    if (btnModoPlaneamiento) {
        btnModoPlaneamiento.addEventListener('click', () => {
            window.location.href = 'planeamiento.html';
        });
    }
    if (btnModoJuegoGuerra) {
        btnModoJuegoGuerra.addEventListener('click', () => {
            window.location.href = 'iniciarpartida.html';
        });
    }

    console.log('Event listeners added');
}

// Mostrar el formulario correspondiente
function mostrarFormulario(formularioId) {
    ocultarTodosLosFormularios();
    document.getElementById(formularioId).style.display = 'block';
}

// Ocultar formulario
function ocultarFormulario(formularioId) {
    const formulario = document.getElementById(formularioId);
    if (formulario) {
        formulario.style.display = 'none';
    }
}

// Ocultar todos los formularios
function ocultarTodosLosFormularios() {
    ['loginForm', 'crearUsuarioForm', 'seleccionModo'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.style.display = 'none';
    });
}

// Mostrar errores
function mostrarError(elementId, mensaje) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = mensaje;
        errorElement.style.display = 'block';
    }
}

// Limpiar errores
function limpiarError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Manejo de inicio de sesión
async function handleLogin(event) {
    event.preventDefault();
    console.log('Iniciando sesión');
    const username = document.getElementById('usuario').value;
    const password = document.getElementById('contrasena').value;

    if (!username || !password) {
        mostrarError('errorLogin', 'Por favor, complete todos los campos');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            limpiarError('errorLogin');
            // Guardar información del usuario
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', username);
            localStorage.setItem('isLoggedIn', 'true');
            // Usar la función de landing3d.js para mostrar selección de modo con animación
            if (window.mostrarSeleccionModo) {
                window.mostrarSeleccionModo();
            } else {
                ocultarTodosLosFormularios();
                mostrarFormulario('seleccionModo');
            }
        } else {
            mostrarError('errorLogin', data.message || 'Error en el inicio de sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('errorLogin', 'Error en la conexión');
    }
}

// Manejo de la creación de usuarios
async function handleCrearUsuario(event) {
    event.preventDefault();
    console.log('Creando usuario');
    const newUsername = document.getElementById('nuevoUsuario').value;
    const newPassword = document.getElementById('nuevaContrasena').value;
    const email = document.getElementById('correo').value;
    const confirmarEmail = document.getElementById('confirmarCorreo').value;
    const unidad = document.getElementById('unidad').value;

    if (!newUsername || !newPassword || !email || !confirmarEmail || !unidad) {
        mostrarError('errorCrearUsuario', 'Por favor, complete todos los campos');
        return;
    }

    if (email !== confirmarEmail) {
        mostrarError('errorCrearUsuario', 'Los correos electrónicos no coinciden');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/crear-usuario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: newUsername, password: newPassword, email, unidad }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Usuario creado exitosamente');
            if (document.querySelector('.container.active')) {
                // Si estamos en la interfaz 3D, solo cambiamos de formulario
                ocultarFormulario('crearUsuarioForm');
                mostrarFormulario('loginForm');
            } else {
                // En la interfaz antigua
                ocultarTodosLosFormularios();
                mostrarFormulario('loginForm');
            }
        } else {
            mostrarError('errorCrearUsuario', data.message || 'Error al crear usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('errorCrearUsuario', 'Error en la conexión');
    }
}

// Manejo de recuperación de contraseñas
async function handleRecuperarContrasena(event) {
    event.preventDefault();
    console.log('Recuperando contraseña');
    const email = document.getElementById('usuario').value;

    if (!email) {
        mostrarError('errorLogin', 'Por favor, ingrese su correo electrónico');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/recuperar-contrasena`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert('Se ha enviado un correo con instrucciones para recuperar tu contraseña');
        } else {
            mostrarError('errorLogin', data.message || 'Error al procesar la solicitud');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('errorLogin', 'Error en la conexión');
    }
}

window.mostrarError = mostrarError;