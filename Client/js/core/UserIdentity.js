/**
 * UserIdentity.js
 * Módulo para gestionar la identidad del usuario de manera consistente en todo el sistema
 * @version 2.0.0 - Adaptado para arquitectura hexagonal
 */

// ✅ CORREGIDO: No usar import en script regular
// import maiCore from './index.js';

// Módulo de identidad de usuario - Refactorizado para arquitectura hexagonal
class UserIdentityService {
    constructor(core) {
        this.core = core || window.MAIRA;
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

    /**
     * Inicializa la identidad del usuario con los datos proporcionados
     * @param {string} userId - Identificador único del usuario
     * @param {string} username - Nombre de usuario
     * @param {Object} elementoTrabajo - Datos del elemento asociado al usuario
     * @returns {Object} - Datos del usuario inicializados
     */
    initialize(userId, username, elementoTrabajo) {
        console.log("Inicializando identidad de usuario:", userId, username);
        
        this.userData = {
            id: userId,
            username: username,
            loginTime: new Date().toISOString(),
            elementoTrabajo: elementoTrabajo || {}
        };
        
        // Guardar en localStorage para consistencia entre recargas
        localStorage.setItem('usuario_info', JSON.stringify(this.userData));
        
        // También guardar de forma individual para compatibilidad con código antiguo
        localStorage.setItem('userId', userId);
        localStorage.setItem('username', username);
        
        // Si hay elementoTrabajo, guardarlo por separado
        if (elementoTrabajo) {
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
        }
        
        // Emitir evento para notificar otros módulos
        this.core.emit('userAuthenticated', this.userData);
        
        return this.userData;
    }

    /**
     * Carga los datos del usuario desde el almacenamiento local
     * @returns {Object|null} - Datos del usuario o null si no existen
     */
    loadFromStorage() {
        try {
            const storedData = localStorage.getItem('usuario_info');
            if (storedData) {
                this.userData = JSON.parse(storedData);
                console.log("Datos de usuario cargados desde storage:", this.userData);
                return this.userData;
            }
            
            // Intentar cargar desde formato antiguo
            const userId = localStorage.getItem('userId');
            const username = localStorage.getItem('username');
            
            if (userId && username) {
                const elementoTrabajoStr = localStorage.getItem('elemento_trabajo');
                const elementoTrabajo = elementoTrabajoStr ? JSON.parse(elementoTrabajoStr) : {};
                
                this.userData = {
                    id: userId,
                    username: username,
                    loginTime: new Date().toISOString(),
                    elementoTrabajo: elementoTrabajo
                };
                
                // Actualizar al nuevo formato
                localStorage.setItem('usuario_info', JSON.stringify(this.userData));
                
                return this.userData;
            }
            
        } catch (error) {
            console.error('Error cargando datos de usuario desde storage:', error);
        }
        
        return null;
    }

    /**
     * Obtiene el ID del usuario
     * @returns {string|null} - ID del usuario o null si no está autenticado
     */
    getUserId() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        return this.userData ? this.userData.id : null;
    }

    /**
     * Obtiene el nombre de usuario
     * @returns {string|null} - Nombre de usuario o null si no está autenticado
     */
    getUsername() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        return this.userData ? this.userData.username : null;
    }

    /**
     * Obtiene todos los datos del usuario
     * @returns {Object|null} - Datos completos del usuario o null
     */
    getUserData() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        return this.userData;
    }

    /**
     * Obtiene los datos del elemento de trabajo asociado al usuario
     * @returns {Object|null} - Datos del elemento de trabajo o null
     */
    getElementoTrabajo() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        return this.userData ? this.userData.elementoTrabajo : null;
    }

    /**
     * Verifica si el usuario está autenticado
     * @returns {boolean} - true si está autenticado, false en caso contrario
     */
    isAuthenticated() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        return this.userData !== null && this.userData.id && this.userData.username;
    }

    /**
     * Limpia todos los datos del usuario (logout)
     */
    clearUserData() {
        this.userData = null;
        
        // Limpiar localStorage
        localStorage.removeItem('usuario_info');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('elemento_trabajo');
        
        console.log("Datos de usuario limpiados");
        
        // Emitir evento de logout
        this.core.emit('userLogout');
    }

    /**
     * Actualiza los datos del usuario
     * @param {Object} newData - Nuevos datos para actualizar
     */
    updateUserData(newData) {
        if (!this.userData) {
            this.loadFromStorage();
        }
        
        if (this.userData) {
            this.userData = { ...this.userData, ...newData };
            localStorage.setItem('usuario_info', JSON.stringify(this.userData));
            
            // Emitir evento de actualización
            this.core.emit('userDataUpdated', this.userData);
        }
    }

    /**
     * Establece el elemento de trabajo del usuario
     * @param {Object} elementoTrabajo - Datos del elemento de trabajo
     */
    setElementoTrabajo(elementoTrabajo) {
        if (!this.userData) {
            this.loadFromStorage();
        }
        
        if (this.userData) {
            this.userData.elementoTrabajo = elementoTrabajo;
            localStorage.setItem('usuario_info', JSON.stringify(this.userData));
            localStorage.setItem('elemento_trabajo', JSON.stringify(elementoTrabajo));
            
            console.log("Elemento de trabajo actualizado:", elementoTrabajo);
            
            // Emitir evento
            this.core.emit('elementoTrabajoUpdated', elementoTrabajo);
        }
    }

    /**
     * Obtiene información de la sesión
     * @returns {Object} - Información de la sesión
     */
    getSessionInfo() {
        if (!this.userData) {
            this.loadFromStorage();
        }
        
        if (this.userData) {
            return {
                isAuthenticated: true,
                userId: this.userData.id,
                username: this.userData.username,
                loginTime: this.userData.loginTime,
                sessionDuration: Date.now() - new Date(this.userData.loginTime).getTime()
            };
        }
        
        return {
            isAuthenticated: false,
            userId: null,
            username: null,
            loginTime: null,
            sessionDuration: 0
        };
    }
}

// Registrar el servicio en el core cuando esté disponible
if (typeof maiCore !== 'undefined') {
    maiCore.registerService('userIdentity', new UserIdentityService(maiCore));
}

export default UserIdentityService;
