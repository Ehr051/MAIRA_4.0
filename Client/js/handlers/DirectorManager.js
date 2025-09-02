/**
 * 👨‍✈️ DIRECTOR MANAGER - MAIRA 4.0
 * Sistema roles director/creador/listo para ejercicios
 * Integración total con sistema existente
 */
class DirectorManager {
    constructor() {
        this.roles = {
            esDirector: false,
            esCreador: false, 
            esListo: false
        };
        
        this.ejercicioConfig = null;
        this.participantes = new Map();
        this.directorActual = null;
        this.creadorActual = null;
        
        console.log('👨‍✈️ DirectorManager inicializado');
        this.inicializarSistemaRoles();
    }

    // ===== GESTIÓN ROLES =====
    asignarRolDirector(userId, userName) {
        if (this.directorActual && this.directorActual !== userId) {
            throw new Error('Ya existe un director asignado');
        }
        
        this.roles.esDirector = true;
        this.directorActual = userId;
        
        console.log('👨‍✈️ Director asignado:', userName);
        this.notificarCambioRol('director_asignado', { userId, userName });
        this.habilitarHerramientasDirector();
        
        return true;
    }

    asignarRolCreador(userId, userName) {
        if (this.creadorActual && this.creadorActual !== userId) {
            throw new Error('Ya existe un creador asignado');
        }
        
        this.roles.esCreador = true;
        this.creadorActual = userId;
        
        console.log('🎯 Creador asignado:', userName);
        this.notificarCambioRol('creador_asignado', { userId, userName });
        this.habilitarHerramientasCreador();
        
        return true;
    }

    marcarListo(userId, userName, equipoColor) {
        if (!equipoColor || !['azul', 'rojo'].includes(equipoColor)) {
            throw new Error('Debe especificar equipo: azul o rojo');
        }
        
        this.participantes.set(userId, {
            listo: true,
            nombre: userName,
            equipo: equipoColor,
            timestamp: new Date().toISOString()
        });
        
        console.log('✅ Participante listo:', userName, equipoColor);
        this.actualizarListaParticipantes();
        this.verificarTodosListos();
        
        return true;
    }

    verificarTodosListos() {
        const todosListos = Array.from(this.participantes.values())
            .every(p => p.listo);
            
        const equipoAzul = Array.from(this.participantes.values())
            .filter(p => p.equipo === 'azul').length;
        const equipoRojo = Array.from(this.participantes.values())
            .filter(p => p.equipo === 'rojo').length;
            
        if (todosListos && equipoAzul > 0 && equipoRojo > 0 && this.roles.esDirector) {
            this.notificarSistema('todos_listos_para_combate');
            this.habilitarInicioEjercicio();
        }
    }

    // ===== CONFIGURACIÓN EJERCICIO =====
    configurarEjercicio(config) {
        if (!this.roles.esDirector && !this.roles.esCreador) {
            throw new Error('Solo director o creador pueden configurar ejercicio');
        }
        
        this.ejercicioConfig = {
            nombre: config.nombre || 'Ejercicio MAIRA',
            descripcion: config.descripcion || 'Ejercicio táctico',
            duracionTurno: config.duracionTurno || 60,
            tiempoReal: config.tiempoReal || 'horas',
            participantesMax: config.participantesMax || 6,
            sectorTrabajo: null,
            zonasDespliegue: { azul: null, rojo: null },
            timestamp: new Date().toISOString(),
            configuradoPor: this.roles.esDirector ? this.directorActual : this.creadorActual
        };
        
        console.log('🎯 Ejercicio configurado:', this.ejercicioConfig.nombre);
        this.guardarConfiguracion();
        this.mostrarConfiguracionEjercicio();
        
        return this.ejercicioConfig;
    }

    // ===== INTERFAZ USUARIO =====
    habilitarHerramientasDirector() {
        const herramientasDirector = document.getElementById('herramientas-director');
        if (herramientasDirector) {
            herramientasDirector.style.display = 'block';
        }
        
        this.mostrarControlesDirector();
    }

    mostrarControlesDirector() {
        const controlesHTML = `
            <div id="controles-director" class="controles-director card mt-3">
                <div class="card-header">
                    <h5>🎖️ Controles Director</h5>
                </div>
                <div class="card-body">
                    <button id="definir-sector-btn" class="btn btn-primary btn-sm me-2">
                        📍 Definir Sector Trabajo
                    </button>
                    <button id="zona-azul-btn" class="btn btn-info btn-sm me-2">
                        🔵 Zona Despliegue Azul
                    </button>
                    <button id="zona-rojo-btn" class="btn btn-danger btn-sm me-2">
                        🔴 Zona Despliegue Rojo
                    </button>
                    <button id="iniciar-ejercicio-btn" class="btn btn-success btn-sm" disabled>
                        🚀 Iniciar Ejercicio
                    </button>
                </div>
            </div>
        `;
        
        const container = document.getElementById('contenedor-principal') || document.body;
        container.insertAdjacentHTML('beforeend', controlesHTML);
        
        this.configurarEventosDirector();
    }

    configurarEventosDirector() {
        document.getElementById('definir-sector-btn')?.addEventListener('click', () => {
            this.iniciarDefinicionSector();
        });
        
        document.getElementById('zona-azul-btn')?.addEventListener('click', () => {
            this.iniciarDefinicionZonaAzul();
        });
        
        document.getElementById('zona-rojo-btn')?.addEventListener('click', () => {
            this.iniciarDefinicionZonaRojo();
        });
        
        document.getElementById('iniciar-ejercicio-btn')?.addEventListener('click', () => {
            this.iniciarEjercicio();
        });
    }

    // ===== INTEGRACIÓN CON MAPA =====
    iniciarDefinicionSector() {
        if (!window.map) {
            alert('❌ Mapa no disponible');
            return;
        }
        
        alert('📍 Haga clic en el mapa para definir esquinas del sector trabajo');
        this.modoDefinicionSector = true;
        this.puntosSelector = [];
        
        window.map.getContainer().style.cursor = 'crosshair';
        
        this.listenerSector = (e) => this.capturarPuntoSector(e);
        window.map.on('click', this.listenerSector);
    }

    capturarPuntoSector(e) {
        this.puntosSelector.push(e.latlng);
        
        L.marker(e.latlng, {
            icon: L.divIcon({
                className: 'sector-marker',
                html: '📍',
                iconSize: [20, 20]
            })
        }).addTo(window.map);
        
        console.log('📍 Punto sector capturado:', e.latlng);
        
        if (this.puntosSelector.length >= 2) {
            this.finalizarDefinicionSector();
        }
    }

    finalizarDefinicionSector() {
        if (this.puntosSelector.length < 2) return;
        
        const bounds = L.latLngBounds(this.puntosSelector);
        
        const sector = L.rectangle(bounds, {
            color: '#ff7800',
            weight: 3,
            fillOpacity: 0.1
        }).addTo(window.map);
        
        if (window.MAIRA && window.MAIRA.SectorManager) {
            window.MAIRA.SectorManager.definirSectorTrabajo(bounds.toBBoxString(), {
                esDirector: true,
                id: this.directorActual
            });
        }
        
        this.limpiarModoDefinicion();
        alert('✅ Sector trabajo definido correctamente');
    }

    limpiarModoDefinicion() {
        this.modoDefinicionSector = false;
        this.puntosSelector = [];
        
        if (window.map) {
            window.map.getContainer().style.cursor = '';
            window.map.off('click', this.listenerSector);
        }
    }

    // ===== NOTIFICACIONES =====
    notificarCambioRol(tipo, data) {
        if (window.MAIRA && window.MAIRA.EventBus) {
            window.MAIRA.EventBus.emit('director_role_change', {
                tipo: tipo,
                data: data,
                timestamp: new Date().toISOString()
            });
        }
        
        this.mostrarNotificacion(`${tipo}: ${data.userName}`, 'success');
    }

    notificarSistema(evento) {
        if (window.MAIRA && window.MAIRA.EventBus) {
            window.MAIRA.EventBus.emit('sistema_evento', {
                evento: evento,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('🔔 Evento sistema:', evento);
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notifHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.getElementById('notificaciones') || document.body;
        container.insertAdjacentHTML('afterbegin', notifHTML);
        
        setTimeout(() => {
            const notif = container.querySelector('.alert');
            if (notif) notif.remove();
        }, 5000);
    }

    // ===== INTEGRACIÓN FORMULARIOS =====
    integrarConFormularios() {
        const formCrearPartida = document.getElementById('formCrearPartida');
        if (formCrearPartida) {
            this.añadirRolesAFormulario(formCrearPartida);
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.id === 'formCrearPartida') {
                        this.añadirRolesAFormulario(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    añadirRolesAFormulario(formulario) {
        const rolesHTML = `
            <div class="director-controls mb-3">
                <h5>🎖️ Roles del Ejercicio</h5>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="serDirector">
                    <label class="form-check-label" for="serDirector">
                        👨‍✈️ Ser Director del Ejercicio
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="serCreador">
                    <label class="form-check-label" for="serCreador">
                        🎯 Ser Creador del Ejercicio
                    </label>
                </div>
                <div class="form-group mt-3">
                    <label for="equipoSelector">Equipo:</label>
                    <select class="form-control" id="equipoSelector">
                        <option value="">Seleccionar equipo...</option>
                        <option value="azul">🔵 Equipo Azul</option>
                        <option value="rojo">🔴 Equipo Rojo</option>
                    </select>
                </div>
                <button type="button" id="marcarListo" class="btn btn-success mt-2">
                    ✅ Marcar Listo
                </button>
            </div>
        `;
        
        formulario.insertAdjacentHTML('afterbegin', rolesHTML);
        this.configurarEventosFormulario();
    }

    configurarEventosFormulario() {
        document.getElementById('serDirector')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                const userId = this.generarUserId();
                const userName = prompt('Nombre del Director:') || 'Director';
                this.asignarRolDirector(userId, userName);
            }
        });
        
        document.getElementById('serCreador')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                const userId = this.generarUserId();
                const userName = prompt('Nombre del Creador:') || 'Creador';
                this.asignarRolCreador(userId, userName);
            }
        });
        
        document.getElementById('marcarListo')?.addEventListener('click', () => {
            const equipo = document.getElementById('equipoSelector')?.value;
            if (!equipo) {
                alert('❌ Debe seleccionar un equipo');
                return;
            }
            
            const userId = this.generarUserId();
            const userName = prompt('Su nombre:') || 'Participante';
            this.marcarListo(userId, userName, equipo);
        });
    }

    generarUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== PERSISTENCIA =====
    guardarConfiguracion() {
        const config = {
            ejercicio: this.ejercicioConfig,
            roles: this.roles,
            participantes: Array.from(this.participantes.entries()),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('maira_ejercicio_config', JSON.stringify(config));
        console.log('💾 Configuración guardada');
    }

    cargarConfiguracion() {
        try {
            const configString = localStorage.getItem('maira_ejercicio_config');
            if (configString) {
                const config = JSON.parse(configString);
                this.ejercicioConfig = config.ejercicio;
                this.roles = config.roles || this.roles;
                this.participantes = new Map(config.participantes || []);
                
                console.log('📂 Configuración cargada');
                return true;
            }
        } catch (error) {
            console.error('❌ Error cargando configuración:', error);
        }
        return false;
    }

    // ===== INICIALIZACIÓN =====
    inicializarSistemaRoles() {
        this.cargarConfiguracion();
        this.configurarIntegracionIniciarPartida();
        console.log('⚙️ Sistema roles inicializado');
    }

    configurarIntegracionIniciarPartida() {
        window.MAIRA_DirectorManager = this;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.integrarConFormularios();
            });
        } else {
            this.integrarConFormularios();
        }
    }

    habilitarInicioEjercicio() {
        const botonIniciar = document.getElementById('iniciar-ejercicio-btn');
        if (botonIniciar) {
            botonIniciar.disabled = false;
            botonIniciar.classList.add('btn-success');
            botonIniciar.textContent = '🚀 ¡Iniciar Ejercicio!';
        }
    }

    iniciarEjercicio() {
        if (!this.verificarPrerrequisitos()) return;
        
        console.log('🚀 Iniciando ejercicio...');
        
        if (window.MAIRA) {
            if (window.MAIRA.NieblaGuerraEngine) {
                window.MAIRA.NieblaGuerraEngine.activarNieblaGuerra();
            }
            if (window.MAIRA.EstadisticasManager) {
                window.MAIRA.EstadisticasManager.iniciarEjercicio();
            }
        }
        
        this.notificarSistema('ejercicio_iniciado');
        
        if (window.location.pathname.includes('iniciarpartida') && window.irAJuego) {
            window.irAJuego();
        }
        
        alert('🚀 ¡Ejercicio iniciado correctamente!');
    }

    verificarPrerrequisitos() {
        if (!this.roles.esDirector) {
            alert('❌ Se requiere un director para iniciar');
            return false;
        }
        
        const equipoAzul = Array.from(this.participantes.values())
            .filter(p => p.equipo === 'azul').length;
        const equipoRojo = Array.from(this.participantes.values())
            .filter(p => p.equipo === 'rojo').length;
            
        if (equipoAzul === 0 || equipoRojo === 0) {
            alert('❌ Se requieren participantes en ambos equipos');
            return false;
        }
        
        return true;
    }
}

// Inicialización automática
if (typeof window !== 'undefined') {
    window.MAIRA = window.MAIRA || {};
    window.MAIRA.DirectorManager = new DirectorManager();
    
    console.log('👨‍✈️ DirectorManager cargado y disponible');
}

// Export para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectorManager;
}
