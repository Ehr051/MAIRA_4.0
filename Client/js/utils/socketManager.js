/**
 * 📡 Socket Manager - Gestión Robusta de Conexiones Socket.IO
 * 
 * Wrapper centralizado para socket.io con:
 * - Reconexión automática inteligente
 * - Error handling completo
 * - Feedback visual de estados
 * - Heartbeat/keepalive
 * - Logs de debug
 * 
 * Uso:
 * ```javascript
 * const socketMgr = new SocketManager({
 *     serverUrl: window.location.origin,
 *     onConnect: () => console.log('Conectado!'),
 *     onDisconnect: () => console.log('Desconectado'),
 *     debug: true
 * });
 * 
 * socketMgr.connect();
 * socketMgr.emit('evento', datos);
 * socketMgr.on('respuesta', callback);
 * ```
 * 
 * @author MAIRA Team
 * @version 1.0.0
 * @date 2025-10-05
 */

class SocketManager {
    constructor(options = {}) {
        // Configuración
        this.config = {
            serverUrl: options.serverUrl || window.location.origin,
            reconnection: options.reconnection !== undefined ? options.reconnection : true,
            reconnectionAttempts: options.reconnectionAttempts || 5,
            reconnectionDelay: options.reconnectionDelay || 1000,
            reconnectionDelayMax: options.reconnectionDelayMax || 5000,
            timeout: options.timeout || 10000,
            transports: options.transports || ['websocket', 'polling'],
            autoConnect: options.autoConnect !== undefined ? options.autoConnect : false,
            debug: options.debug !== undefined ? options.debug : false,
            heartbeatInterval: options.heartbeatInterval || 30000, // 30 segundos
            showNotifications: options.showNotifications !== undefined ? options.showNotifications : true
        };

        // Callbacks
        this.callbacks = {
            onConnect: options.onConnect || null,
            onDisconnect: options.onDisconnect || null,
            onReconnect: options.onReconnect || null,
            onError: options.onError || null,
            onReconnectAttempt: options.onReconnectAttempt || null,
            onReconnectFailed: options.onReconnectFailed || null
        };

        // Estado
        this.state = {
            connected: false,
            reconnecting: false,
            attemptNumber: 0,
            lastDisconnectReason: null,
            connectTime: null,
            disconnectTime: null
        };

        // Socket instance
        this.socket = null;

        // Heartbeat timer
        this.heartbeatTimer = null;

        // Event listeners storage
        this.eventListeners = new Map();

        // Auto-connect si está habilitado
        if (this.config.autoConnect) {
            this.connect();
        }
    }

    /**
     * 🔌 Conectar al servidor
     */
    connect() {
        if (this.socket && this.socket.connected) {
            this._log('⚠️ Ya está conectado');
            return;
        }

        this._log('🔌 Conectando a', this.config.serverUrl);

        // Crear socket con configuración robusta
        this.socket = io(this.config.serverUrl, {
            reconnection: this.config.reconnection,
            reconnectionAttempts: this.config.reconnectionAttempts,
            reconnectionDelay: this.config.reconnectionDelay,
            reconnectionDelayMax: this.config.reconnectionDelayMax,
            timeout: this.config.timeout,
            transports: this.config.transports,
            autoConnect: false // Controlamos manualmente
        });

        // Registrar event handlers
        this._setupEventHandlers();

        // Conectar
        this.socket.connect();
    }

    /**
     * 🔌 Desconectar del servidor
     */
    disconnect() {
        if (!this.socket) {
            this._log('⚠️ No hay conexión para desconectar');
            return;
        }

        this._log('🔌 Desconectando...');
        this._stopHeartbeat();
        this.socket.disconnect();
        this.socket = null;
        this.state.connected = false;
    }

    /**
     * 📤 Emitir evento al servidor
     * @param {string} eventName - Nombre del evento
     * @param {*} data - Datos a enviar
     * @param {function} callback - Callback opcional (acknowledgment)
     */
    emit(eventName, data, callback) {
        if (!this.socket || !this.state.connected) {
            this._logError('❌ No se puede emitir: No conectado');
            if (this.config.showNotifications) {
                this._showNotification('Sin conexión al servidor', 'error');
            }
            return false;
        }

        this._log(`📤 Emitiendo evento: ${eventName}`, data);

        if (callback) {
            this.socket.emit(eventName, data, callback);
        } else {
            this.socket.emit(eventName, data);
        }

        return true;
    }

    /**
     * 📥 Escuchar evento del servidor
     * @param {string} eventName - Nombre del evento
     * @param {function} handler - Función handler
     */
    on(eventName, handler) {
        if (!this.socket) {
            this._logError('❌ No se puede registrar listener: Socket no inicializado');
            return;
        }

        this._log(`📥 Registrando listener: ${eventName}`);

        // Wrapper para logging
        const wrappedHandler = (...args) => {
            this._log(`📥 Evento recibido: ${eventName}`, args);
            handler(...args);
        };

        // Guardar referencia para poder remover después
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push({ original: handler, wrapped: wrappedHandler });

        this.socket.on(eventName, wrappedHandler);
    }

    /**
     * 🗑️ Remover listener de evento
     * @param {string} eventName - Nombre del evento
     * @param {function} handler - Función handler a remover (opcional, remueve todos si no se especifica)
     */
    off(eventName, handler) {
        if (!this.socket) {
            return;
        }

        if (handler) {
            // Remover listener específico
            const listeners = this.eventListeners.get(eventName) || [];
            const listener = listeners.find(l => l.original === handler);
            if (listener) {
                this.socket.off(eventName, listener.wrapped);
                const index = listeners.indexOf(listener);
                listeners.splice(index, 1);
                this._log(`🗑️ Listener removido: ${eventName}`);
            }
        } else {
            // Remover todos los listeners del evento
            this.socket.off(eventName);
            this.eventListeners.delete(eventName);
            this._log(`🗑️ Todos los listeners removidos: ${eventName}`);
        }
    }

    /**
     * 🔧 Setup de event handlers internos
     * @private
     */
    _setupEventHandlers() {
        // ✅ Conexión exitosa
        this.socket.on('connect', () => {
            this.state.connected = true;
            this.state.reconnecting = false;
            this.state.attemptNumber = 0;
            this.state.connectTime = new Date();
            
            this._log('✅ Conectado al servidor', { sid: this.socket.id });

            if (this.config.showNotifications) {
                this._showNotification('Conectado al servidor', 'success');
            }

            // Iniciar heartbeat
            this._startHeartbeat();

            // Callback
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect(this.socket.id);
            }
        });

        // ❌ Desconexión
        this.socket.on('disconnect', (reason) => {
            this.state.connected = false;
            this.state.lastDisconnectReason = reason;
            this.state.disconnectTime = new Date();

            this._log('❌ Desconectado:', reason);

            // Detener heartbeat
            this._stopHeartbeat();

            // Mensajes específicos según razón
            let message = 'Desconectado del servidor';
            let type = 'warning';

            if (reason === 'io server disconnect') {
                message = 'El servidor cerró la conexión';
                type = 'error';
                // Reconectar manualmente
                setTimeout(() => {
                    if (!this.state.connected) {
                        this._log('🔄 Intentando reconectar...');
                        this.socket.connect();
                    }
                }, 1000);
            } else if (reason === 'transport close') {
                message = 'Conexión perdida';
            } else if (reason === 'ping timeout') {
                message = 'Timeout de conexión';
            }

            if (this.config.showNotifications) {
                this._showNotification(message, type);
            }

            // Callback
            if (this.callbacks.onDisconnect) {
                this.callbacks.onDisconnect(reason);
            }
        });

        // 🔄 Intento de reconexión
        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.state.reconnecting = true;
            this.state.attemptNumber = attemptNumber;

            this._log(`🔄 Intento de reconexión #${attemptNumber}`);

            if (this.config.showNotifications && attemptNumber === 1) {
                this._showNotification('Intentando reconectar...', 'info');
            }

            // Callback
            if (this.callbacks.onReconnectAttempt) {
                this.callbacks.onReconnectAttempt(attemptNumber);
            }
        });

        // ✅ Reconexión exitosa
        this.socket.on('reconnect', (attemptNumber) => {
            this.state.reconnecting = false;
            this.state.attemptNumber = 0;

            this._log(`✅ Reconectado exitosamente después de ${attemptNumber} intentos`);

            if (this.config.showNotifications) {
                this._showNotification('Reconectado al servidor', 'success');
            }

            // Callback
            if (this.callbacks.onReconnect) {
                this.callbacks.onReconnect(attemptNumber);
            }
        });

        // ❌ Reconexión fallida
        this.socket.on('reconnect_failed', () => {
            this.state.reconnecting = false;

            this._logError('❌ Reconexión fallida: Se agotaron los intentos');

            if (this.config.showNotifications) {
                this._showNotification('No se pudo reconectar al servidor', 'error');
            }

            // Callback
            if (this.callbacks.onReconnectFailed) {
                this.callbacks.onReconnectFailed();
            }
        });

        // ⚠️ Error de conexión
        this.socket.on('connect_error', (error) => {
            this._logError('⚠️ Error de conexión:', error.message);

            // Callback
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        });

        // ⚠️ Error genérico
        this.socket.on('error', (error) => {
            this._logError('⚠️ Error:', error);

            // Callback
            if (this.callbacks.onError) {
                this.callbacks.onError(error);
            }
        });

        // 🏓 Pong (respuesta a heartbeat)
        this.socket.on('pong', (latency) => {
            this._log(`🏓 Pong recibido (latencia: ${latency}ms)`);
        });
    }

    /**
     * 💓 Iniciar heartbeat
     * @private
     */
    _startHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        this.heartbeatTimer = setInterval(() => {
            if (this.socket && this.state.connected) {
                const start = Date.now();
                this.socket.emit('ping', () => {
                    const latency = Date.now() - start;
                    this._log(`💓 Heartbeat (latencia: ${latency}ms)`);
                });
            }
        }, this.config.heartbeatInterval);

        this._log('💓 Heartbeat iniciado');
    }

    /**
     * 💔 Detener heartbeat
     * @private
     */
    _stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
            this._log('💔 Heartbeat detenido');
        }
    }

    /**
     * 📊 Obtener estado de conexión
     */
    getState() {
        return {
            ...this.state,
            socketId: this.socket?.id || null,
            uptime: this.state.connectTime ? Date.now() - this.state.connectTime.getTime() : 0
        };
    }

    /**
     * 🔍 Verificar si está conectado
     */
    isConnected() {
        return this.socket && this.socket.connected && this.state.connected;
    }

    /**
     * 🔍 Verificar si está reconectando
     */
    isReconnecting() {
        return this.state.reconnecting;
    }

    /**
     * 📝 Log de debug
     * @private
     */
    _log(...args) {
        if (this.config.debug) {
            console.log('[SocketManager]', ...args);
        }
    }

    /**
     * ❌ Log de error
     * @private
     */
    _logError(...args) {
        console.error('[SocketManager]', ...args);
    }

    /**
     * 🔔 Mostrar notificación
     * @private
     */
    _showNotification(message, type = 'info') {
        // Verificar si existe sistema de notificaciones global
        if (typeof window.mostrarNotificacion === 'function') {
            window.mostrarNotificacion(message, type);
        } else if (typeof window.toastr !== 'undefined') {
            // Fallback a toastr si está disponible
            window.toastr[type](message);
        } else {
            // Fallback a alert básico (solo para errores críticos)
            if (type === 'error') {
                console.error(message);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocketManager;
}

// Hacer disponible globalmente
window.SocketManager = SocketManager;

console.log('📡 SocketManager v1.0.0 cargado');
