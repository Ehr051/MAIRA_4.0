/**
 * UserIdentity.js
 * Módulo para gestionar la identidad del usuario de manera consistente en todo el sistema
 * @version 2.0.0 - Adaptado para arquitectura hexagonal
 */

import maiCore from './index.js';

// Módulo de identidad de usuario - Refactorizado para arquitectura hexagonal
class UserIdentityService {
    constructor(core) {
        this.core = core;
        this.userData = null;
        
        // Backward compatibility
        this.setupBackwardCompatibility();
    }

    setupBackwardCompatibility() {
        // Mantener compatibilidad con código existente
        if (typeof window !== 'undefined') {
            window.MAIRA = window.MAIRA || {};
            window.MAIRA.UserIdentity = this.getLegacyInterface();
        }
    }

    getLegacyInterface() {
        return {
            initialize: this.initialize.bind(this),
            loadFromStorage: this.loadFromStorage.bind(this),
            getUserId: this.getUserId.bind(this),
            getUsername: this.getUsername.bind(this),
            getUserData: this.getUserData.bind(this),
            getElementoTrabajo: this.getElementoTrabajo.bind(this),
            isAuthenticated: this.isAuthenticated.bind(this),
            clearUserData: this.clearUserData.bind(this),
            updateUserData: this.updateUserData.bind(this),
            setElementoTrabajo: this.setElementoTrabajo.bind(this),
            getSessionInfo: this.getSessionInfo.bind(this)
        };
    }
    // Datos del usuario almacenados en memoria
    let userData = null;

    /**
     * Inicializa la identidad del usuario con los datos proporcionados
     * @param {string} userId - Identificador único del usuario
     * @param {string} username - Nombre de usuario
     * @param {Object} elementoTrabajo - Datos del elemento asociado al usuario
     * @returns {Object} - Datos del usuario inicializados
     */
    function initialize(userId, username, elementoTrabajo) {
        console.log("Inicializando identidad de usuario:", userId, username);
        
        userData = {
            id: userId,
            username: username,
            loginTime: new Date().toISOString(),
            elementoTrabajo: elementoTrabajo || {}
        };
        
        // Guardar en localStorage para consistencia entre recargas
        localStorage.setItem('usuario_info', JSON.stringify(userData));
        
        // También guardar de forma individual para compatibilidad con código antiguo
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        
        // Si hay elementoTrabajo, guardarlo por separado
        if (elementoTrabajo) {
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
        }
        
        return userData;
    }

    /**
     * Carga los datos del usuario desde el almacenamiento local
     * @returns {Object|null} - Datos del usuario o null si no existen
     */
    function loadFromStorage() {
        if (!userData) {
            try {
                // Intentar cargar desde formato moderno primero
                const storedData = localStorage.getItem('usuario_info');
                if (storedData) {
                    userData = JSON.parse(storedData);
                    console.log("Identidad de usuario cargada desde 'usuario_info'");
                } else {
                    // Intentar con formato antiguo
                    const oldData = localStorage.getItem('gb_usuario_info');
                    if (oldData) {
                        const parsed = JSON.parse(oldData);
                        userData = {
                            id: parsed.id,
                            username: parsed.usuario || parsed.username,
                            loginTime: parsed.loginTime || new Date().toISOString()
                        };
                        console.log("Identidad de usuario cargada desde 'gb_usuario_info'");
                    } else {
                        // Último intento con valores individuales
                        const id = localStorage.getItem('userId');
                        const username = localStorage.getItem('username');
                        if (id && username) {
                            userData = {
                                id: id,
                                username: username,
                                loginTime: new Date().toISOString()
                            };
                            console.log("Identidad de usuario cargada desde valores individuales");
                        } else {
                            console.warn("No se encontró información de usuario en localStorage");
                        }
                    }
                }
                
                // Intentar cargar elementoTrabajo
                try {
                    const elementoTrabajoData = localStorage.getItem('elemento_trabajo');
                    if (elementoTrabajoData && userData) {
                        userData.elementoTrabajo = JSON.parse(elementoTrabajoData);
                    }
                } catch (e) {
                    console.warn("Error al cargar elementoTrabajo:", e);
                }
            } catch (e) {
                console.error("Error al cargar datos de usuario desde localStorage:", e);
                return null;
            }
        }
        
        return userData;
    }

    /**
     * Obtiene el ID del usuario de forma consistente
     * @returns {string|null} - ID del usuario o null si no existe
     */
    function getUserId() {
        const info = loadFromStorage();
        return info ? info.id : null;
    }

    /**
     * Obtiene el nombre del usuario de forma consistente
     * @returns {string} - Nombre del usuario o "Usuario" si no existe
     */
    function getUsername() {
        const info = loadFromStorage();
        return info ? (info.username || "Usuario") : "Usuario";
    }

    /**
     * Obtiene el elemento de trabajo del usuario
     * @returns {Object|null} - Datos del elemento de trabajo o null si no existe
     */
    function getElementoTrabajo() {
        const info = loadFromStorage();
        
        // Si no hay elementoTrabajo en el objeto de usuario, intentar cargarlo directamente
        if (info && !info.elementoTrabajo) {
            try {
                const elementoTrabajoData = localStorage.getItem('elemento_trabajo');
                if (elementoTrabajoData) {
                    info.elementoTrabajo = JSON.parse(elementoTrabajoData);
                    
                    // Actualizar el objeto almacenado
                    userData = info;
                }
            } catch (e) {
                console.warn("Error al cargar elementoTrabajo:", e);
            }
        }
        
        return info && info.elementoTrabajo ? info.elementoTrabajo : null;
    }

    /**
     * Actualiza el elemento de trabajo del usuario
     * @param {Object} elementoTrabajo - Nuevos datos del elemento de trabajo
     * @returns {Object} - Datos actualizados del usuario
     */
    function updateElementoTrabajo(elementoTrabajo) {
        if (!elementoTrabajo) return userData;
        
        // Cargar datos actuales
        loadFromStorage();
        
        if (userData) {
            // Actualizar elementoTrabajo
            userData.elementoTrabajo = elementoTrabajo;
            
            // Guardar en localStorage
            localStorage.setItem('usuario_info', JSON.stringify(userData));
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
            
            console.log("ElementoTrabajo actualizado:", elementoTrabajo);
        }
        
        return userData;
    }

    /**
     * Aplica la identidad del usuario a un objeto de datos
     * @param {Object} datos - Objeto al que aplicar la identidad
     * @returns {Object} - Objeto con la identidad aplicada
     */
    function applyToData(datos) {
        if (!datos) return {};
        
        const info = loadFromStorage();
        if (!info) return datos;
        
        // Aplicar datos de identidad al objeto
        datos.id = datos.id || info.id;
        datos.usuario = datos.usuario || info.username;
        datos.usuarioId = datos.usuarioId || info.id;
        datos.jugadorId = datos.jugadorId || info.id;
        
        // Aplicar datos de elemento si existen
        if (info.elementoTrabajo) {
            datos.elemento = datos.elemento || info.elementoTrabajo;
            
            // Asegurar que el SIDC, designación, etc. estén disponibles directamente
            if (info.elementoTrabajo.sidc && !datos.sidc) {
                datos.sidc = info.elementoTrabajo.sidc;
            }
            
            if (info.elementoTrabajo.designacion && !datos.designacion) {
                datos.designacion = info.elementoTrabajo.designacion;
            }
            
            if (info.elementoTrabajo.dependencia && !datos.dependencia) {
                datos.dependencia = info.elementoTrabajo.dependencia;
            }
            
            if (info.elementoTrabajo.magnitud && !datos.magnitud) {
                datos.magnitud = info.elementoTrabajo.magnitud;
            }
        }
        
        return datos;
    }

    // API público
    return {
        initialize,
        loadFromStorage,
        getUserId,
        getUsername,
        getElementoTrabajo,
        updateElementoTrabajo,
        applyToData
    };
})();

// Inicializar automáticamente
document.addEventListener("DOMContentLoaded", function() {
    MAIRA.UserIdentity.loadFromStorage();
    console.log("Módulo UserIdentity inicializado automáticamente");
});

// Exponer globalmente para compatibilidad
window.UserIdentity = MAIRA.UserIdentity;
