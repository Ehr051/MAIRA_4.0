/**
 * sessionManager.js
 * Módulo unificado para gestionar sesiones en el sistema de Gestión de Batalla
 */

// Namespace global
window.MAIRA = window.MAIRA || {};

// Módulo para gestión de sesiones
MAIRA.SessionManager = (function() {
    // Constantes para keys en localStorage
    const KEYS = {
        USER_INFO: 'gb_usuario_info',
        ELEMENTO_INFO: 'gb_elemento_info',
        OPERACION_SELECCIONADA: 'gb_operacion_seleccionada',
        ELEMENTOS_CONECTADOS: 'elementos_conectados',
        ELEMENTOS_CONECTADOS_PREFIX: 'elementos_conectados_',
        ULTIMA_POSICION: 'ultima_posicion',
        SEGUIMIENTO_ACTIVO: 'seguimiento_activo',
        TRACKING_ACTIVADO: 'tracking_activado',
        EN_OPERACION: 'en_operacion_gb'
    };

    // Variables internas
    let _socket = null;
    
    /**
     * Guarda información del usuario en localStorage
     * @param {Object} userData - Datos del usuario
     * @returns {boolean} - Éxito de la operación
     */
    function saveUserInfo(userData) {
        if (!userData || !userData.id) {
            console.error("Datos de usuario inválidos para guardar");
            return false;
        }
        
        try {
            localStorage.setItem(KEYS.USER_INFO, JSON.stringify(userData));
            return true;
        } catch (e) {
            console.error("Error al guardar información de usuario:", e);
            return false;
        }
    }
    
    /**
     * Carga información del usuario desde localStorage
     * @returns {Object|null} - Datos del usuario o null si no existe
     */
    function loadUserInfo() {
        try {
            const userData = localStorage.getItem(KEYS.USER_INFO);
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error("Error al cargar información de usuario:", e);
            return null;
        }
    }
    
    /**
     * Guarda información del elemento de trabajo en localStorage
     * @param {Object} elementoData - Datos del elemento
     * @returns {boolean} - Éxito de la operación
     */
    function saveElementoInfo(elementoData) {
        if (!elementoData) {
            console.error("Datos de elemento inválidos para guardar");
            return false;
        }
        
        try {
            localStorage.setItem(KEYS.ELEMENTO_INFO, JSON.stringify(elementoData));
            return true;
        } catch (e) {
            console.error("Error al guardar información de elemento:", e);
            return false;
        }
    }
    
    /**
     * Carga información del elemento de trabajo desde localStorage
     * @returns {Object|null} - Datos del elemento o null si no existe
     */
    function loadElementoInfo() {
        try {
            const elementoData = localStorage.getItem(KEYS.ELEMENTO_INFO);
            return elementoData ? JSON.parse(elementoData) : null;
        } catch (e) {
            console.error("Error al cargar información de elemento:", e);
            return null;
        }
    }
    
    /**
     * Guarda información de la operación seleccionada
     * @param {Object} operacionData - Datos de la operación
     * @returns {boolean} - Éxito de la operación
     */
    function saveOperacionInfo(operacionData) {
        if (!operacionData || !operacionData.nombre) {
            console.error("Datos de operación inválidos para guardar");
            return false;
        }
        
        try {
            localStorage.setItem(KEYS.OPERACION_SELECCIONADA, JSON.stringify(operacionData));
            localStorage.setItem(KEYS.EN_OPERACION, 'true');
            return true;
        } catch (e) {
            console.error("Error al guardar información de operación:", e);
            return false;
        }
    }
    
    /**
     * Carga información de la operación seleccionada
     * @returns {Object|null} - Datos de la operación o null si no existe
     */
    function loadOperacionInfo() {
        try {
            const operacionData = localStorage.getItem(KEYS.OPERACION_SELECCIONADA);
            return operacionData ? JSON.parse(operacionData) : null;
        } catch (e) {
            console.error("Error al cargar información de operación:", e);
            return null;
        }
    }
    
    /**
     * Guarda elementos conectados para una operación específica
     * @param {string} nombreOperacion - Nombre de la operación
     * @param {Object} elementos - Objeto con los elementos conectados
     * @returns {boolean} - Éxito de la operación
     */
    function saveElementosConectados(nombreOperacion, elementos) {
        if (!nombreOperacion || !elementos) {
            console.error("Nombre de operación o elementos inválidos");
            return false;
        }
        
        try {
            // Convertir elementos a formato compatible con localStorage
            // (eliminando referencias circulares, como los marcadores)
            const elementosLimpios = {};
            
            Object.entries(elementos).forEach(([id, elem]) => {
                // Solo guardar los datos, no el marcador
                if (elem && elem.datos) {
                    elementosLimpios[id] = { datos: elem.datos };
                }
            });
            
            // Guardar con la clave específica de la operación
            localStorage.setItem(
                `${KEYS.ELEMENTOS_CONECTADOS_PREFIX}${nombreOperacion}`, 
                JSON.stringify(elementosLimpios)
            );
            
            // También guardar en la clave general para compatibilidad
            localStorage.setItem(KEYS.ELEMENTOS_CONECTADOS, JSON.stringify(elementosLimpios));
            
            return true;
        } catch (e) {
            console.error("Error al guardar elementos conectados:", e);
            return false;
        }
    }
    
    /**
     * Carga elementos conectados para una operación específica
     * @param {string} nombreOperacion - Nombre de la operación
     * @returns {Object|null} - Objeto con los elementos conectados o null si no existe
     */
    function loadElementosConectados(nombreOperacion) {
        if (!nombreOperacion) {
            console.error("Nombre de operación inválido");
            return null;
        }
        
        try {
            // Primero intentar con la clave específica de la operación
            let elementosData = localStorage.getItem(`${KEYS.ELEMENTOS_CONECTADOS_PREFIX}${nombreOperacion}`);
            
            // Si no existe, intentar con la clave general
            if (!elementosData) {
                elementosData = localStorage.getItem(KEYS.ELEMENTOS_CONECTADOS);
            }
            
            return elementosData ? JSON.parse(elementosData) : null;
        } catch (e) {
            console.error("Error al cargar elementos conectados:", e);
            return null;
        }
    }
    
    /**
     * Verifica si hay datos persistentes de una operación
     * @returns {boolean} - True si hay una operación en curso
     */
    function verificarOperacionActiva() {
        const enOperacion = localStorage.getItem(KEYS.EN_OPERACION) === 'true';
        const operacionInfo = loadOperacionInfo();
        const usuarioInfo = loadUserInfo();
        
        return enOperacion && operacionInfo && usuarioInfo;
    }
    
    /**
     * Limpia datos de un usuario al salir de una operación
     * @param {string} nombreOperacion - Nombre de la operación a limpiar
     * @returns {boolean} - Éxito de la operación
     */
    function limpiarDatosOperacion(nombreOperacion) {
        try {
            if (nombreOperacion) {
                // Eliminar datos específicos de esta operación
                localStorage.removeItem(`${KEYS.ELEMENTOS_CONECTADOS_PREFIX}${nombreOperacion}`);
                
                // Verificar si es la operación actual para limpiar datos relacionados
                const operacionActual = loadOperacionInfo();
                if (operacionActual && operacionActual.nombre === nombreOperacion) {
                    localStorage.removeItem(KEYS.OPERACION_SELECCIONADA);
                    localStorage.setItem(KEYS.EN_OPERACION, 'false');
                }
            }
            
            return true;
        } catch (e) {
            console.error("Error al limpiar datos de operación:", e);
            return false;
        }
    }
    
    /**
     * Limpia todos los datos relacionados con GB
     * @returns {boolean} - Éxito de la operación
     */
    function limpiarTodosDatosGB() {
        try {
            // Lista de prefijos de claves que deben limpiarse
            const prefijosGB = [
                'elementos_conectados_',
                'tracking_',
                'gb_'
            ];
            
            // Recorrer todas las claves de localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const clave = localStorage.key(i);
                
                // Verificar si la clave comienza con alguno de los prefijos
                if (prefijosGB.some(prefijo => clave.startsWith(prefijo))) {
                    localStorage.removeItem(clave);
                }
            }
            
            // También eliminar otras claves específicas
            const clavesEspecificas = [
                'ultima_posicion',
                'seguimiento_activo',
                'tracking_activado',
                'elemento_trabajo',
                'en_operacion_gb',
                'elementos_conectados'
            ];
            
            clavesEspecificas.forEach(clave => {
                localStorage.removeItem(clave);
            });
            
            return true;
        } catch (e) {
            console.error("Error al limpiar todos los datos GB:", e);
            return false;
        }
    }
    
    /**
     * Conecta al socket.io y establece eventos básicos
     * @param {string} serverURL - URL del servidor
     * @returns {Promise} - Promesa que resuelve con el socket conectado
     */
    function connectSocket(serverURL) {
        return new Promise((resolve, reject) => {
            try {
                // Si no se proporciona URL, usar la URL actual
                const socketURL = serverURL || window.location.origin;
                
                // Actualizar conexión actual si existe
                if (_socket && _socket.connected) {
                    resolve(_socket);
                    return;
                }
                
                // Configuración optimizada para Socket.IO
                _socket = io(socketURL, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 10,
                    timeout: 30000,
                    transports: ['polling'],  // Solo polling para Render
                    upgrade: false  // No intentar upgrade a websocket
                });
                
                // Configurar eventos básicos
                _socket.on('connect', () => {
                    console.log("📡 Socket conectado. ID:", _socket.id);
                    resolve(_socket);
                });
                
                _socket.on('connect_error', (error) => {
                    console.error("Error de conexión del socket:", error);
                    reject(error);
                });
                
                _socket.on('disconnect', (reason) => {
                    console.log("Socket desconectado. Razón:", reason);
                });
                
            } catch (error) {
                console.error("Error al crear conexión socket:", error);
                reject(error);
            }
        });
    }
    
    /**
     * Obtiene el socket actual o crea uno nuevo
     * @returns {Object|null} - Socket o null si no hay conexión
     */
    function getSocket() {
        return _socket;
    }
    
    /**
     * Registra un usuario en una operación de batalla
     * @param {Object} userData - Datos del usuario
     * @param {Object} operacionData - Datos de la operación
     * @param {Object} elementoData - Datos del elemento
     * @returns {Promise} - Promesa que resuelve con el resultado de la operación
     */
    function registerUserInOperation(userData, operacionData, elementoData) {
        return new Promise((resolve, reject) => {
            if (!_socket || !_socket.connected) {
                reject(new Error("No hay conexión de socket disponible"));
                return;
            }
            
            if (!userData || !operacionData || !elementoData) {
                reject(new Error("Datos incompletos para registrar usuario en operación"));
                return;
            }
            
            // Preparar datos para enviar
            const dataToSend = {
                operacion: operacionData.nombre,
                usuario: userData,
                elemento: elementoData
            };
            
            // Enviar al servidor
            _socket.emit('unirseOperacion', dataToSend, function(response) {
                if (response && response.error) {
                    reject(new Error(response.error));
                    return;
                }
                
                // Guardar datos en localStorage
                saveUserInfo(userData);
                saveElementoInfo(elementoData);
                saveOperacionInfo(operacionData);
                
                resolve(response);
            });
        });
    }
    
    /**
     * Crea una nueva operación y registra al usuario como creador
     * @param {Object} operacionData - Datos de la nueva operación
     * @param {Object} userData - Datos del usuario creador
     * @param {Object} elementoData - Datos del elemento del creador
     * @returns {Promise} - Promesa que resuelve con el resultado de la operación
     */
    function createOperation(operacionData, userData, elementoData) {
        return new Promise((resolve, reject) => {
            if (!_socket || !_socket.connected) {
                reject(new Error("No hay conexión de socket disponible"));
                return;
            }
            
            if (!operacionData || !operacionData.nombre) {
                reject(new Error("Nombre de operación requerido"));
                return;
            }
            
            // Asegurar que la operación tiene creador
            operacionData.creador = userData.usuario || 'Usuario';
            
            // Enviar al servidor
            _socket.emit('crearOperacionGB', operacionData, function(response) {
                if (response && response.error) {
                    reject(new Error(response.error));
                    return;
                }
                
                // Extraer información de la operación creada
                const nuevaOperacion = response.operacion || {
                    id: Date.now().toString(),
                    nombre: operacionData.nombre,
                    descripcion: operacionData.descripcion,
                    creador: operacionData.creador
                };
                
                // Guardar datos en localStorage
                saveUserInfo(userData);
                saveElementoInfo(elementoData);
                saveOperacionInfo(nuevaOperacion);
                
                resolve(nuevaOperacion);
            });
        });
    }
    
    /**
     * Sale de una operación actual
     * @returns {Promise} - Promesa que resuelve cuando se completa la operación
     */
    function leaveOperation() {
        return new Promise((resolve, reject) => {
            try {
                const operacionActual = loadOperacionInfo();
                
                if (!operacionActual) {
                    resolve({success: false, message: "No hay operación activa"});
                    return;
                }
                
                const nombreOperacion = operacionActual.nombre;
                
                // Notificar al servidor solo si hay conexión
                if (_socket && _socket.connected) {
                    const userData = loadUserInfo();
                    
                    if (userData && userData.id) {
                        _socket.emit('salirOperacionGB', {
                            operacion: nombreOperacion,
                            usuario: userData.id,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
                
                // Limpiar datos de localStorage
                limpiarDatosOperacion(nombreOperacion);
                
                resolve({success: true, message: "Operación abandonada con éxito"});
            } catch (error) {
                console.error("Error al salir de operación:", error);
                
                // Intentar limpiar datos de todas formas
                limpiarTodosDatosGB();
                
                reject(error);
            }
        });
    }

    // API pública del módulo
    return {
        // Constantes
        KEYS,
        
        // Gestión de datos en localStorage
        saveUserInfo,
        loadUserInfo,
        saveElementoInfo,
        loadElementoInfo,
        saveOperacionInfo,
        loadOperacionInfo,
        saveElementosConectados,
        loadElementosConectados,
        verificarOperacionActiva,
        limpiarDatosOperacion,
        limpiarTodosDatosGB,
        
        // Gestión de conexión
        connectSocket,
        getSocket,
        
        // Operaciones
        registerUserInOperation,
        createOperation,
        leaveOperation
    };
})();

// Exponer globalmente
window.MAIRA.SessionManager = window.MAIRA.SessionManager;
