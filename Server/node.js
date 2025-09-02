// node.js (CommonJS Module Version)

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../Server/.env') });

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));

const PORT = process.env.PORT || 3001;

app.use(cors());

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'MAIRA',
    port: process.env.DB_PORT || 3306
};
// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Almacén de partidas activas y usuarios conectados
const partidas = new Map();
const usuariosConectados = new Map();

//#region Definición de la clase GameServer

class GameServer {
    constructor(io, pool) {
        this.io = io;
        this.pool = pool;
        this.partidas = new Map();
        this.usuariosConectados = new Map();
        this.estadisticas = new Map();
    }

    configurarEventos() {
        this.io.on('connection', (socket) => {
            console.log('[SERVER] Nueva conexión:', socket.id);

            // Manejar unión inicial a partida
            socket.on('unirseAPartida', (datos) => {
                const codigo = datos.codigo || datos.partidaCodigo;
                if (!codigo) {
                    socket.emit('error', { mensaje: 'Código de partida no proporcionado' });
                    return;
                }
                
                // Guardar código en el socket para futuras referencias
                socket.partidaCodigo = codigo;
                
                // Unir a las salas correspondientes
                socket.join(codigo);
                if (datos.equipo) {
                    socket.join(`${codigo}_${datos.equipo}`);
                }

                this.manejarUnionPartida(socket, { ...datos, codigo });
            });

            // Manejar eventos de fase
            socket.on('cambioFase', (datos) => {
                const codigo = socket.partidaCodigo;
                if (!codigo) {
                    socket.emit('error', { mensaje: 'No hay partida activa' });
                    return;
                }

                this.manejarCambioFase(socket, { ...datos, partidaCodigo: codigo });
            });

            // Manejar eventos de sector y zonas
            socket.on('sectorConfirmado', (datos) => {
                try {
                    if (!datos.partidaCodigo || !datos.coordenadas) {
                        throw new Error('Datos de sector incompletos');
                    }
            
                    // Emitir a todos los demás en la sala
                    socket.to(datos.partidaCodigo).emit('sectorConfirmado', {
                        coordenadas: datos.coordenadas,
                        bounds: datos.bounds,
                        jugadorId: datos.jugadorId,
                        cambiarFase: datos.cambiarFase,
                        timestamp: new Date().toISOString()
                    });
            
                    console.log('sectorConfirmado propagado:', datos);
                } catch (error) {
                    console.error('Error procesando sector:', error);
                    socket.emit('error', { mensaje: 'Error al procesar sector' });
                }
            });

            socket.on('zonaConfirmada', (datos) => {
                try {
                    console.log('Recibiendo zonaConfirmada:', {
                        partidaCodigo: datos.partidaCodigo,
                        equipo: datos.zona.equipo,
                        jugadorId: datos.jugadorId
                    });
            
                    if (!datos.partidaCodigo || !datos.zona) {
                        throw new Error('Datos incompletos');
                    }
            
                    // Emitir a toda la sala
                    io.in(datos.partidaCodigo).emit('zonaConfirmada', {
                        zona: datos.zona,
                        equipo: datos.zona.equipo,
                        jugadorId: datos.jugadorId,
                        timestamp: new Date().toISOString()
                    });
            
                    console.log('zonaConfirmada emitida a sala:', datos.partidaCodigo);
            
                    // Si es zona azul, cambiar fase
                    if (datos.zona.equipo === 'azul') {
                        io.in(datos.partidaCodigo).emit('cambioFase', {
                            fase: 'preparacion',
                            subfase: 'despliegue',
                            jugadorId: datos.jugadorId,
                            timestamp: new Date().toISOString()
                        });
                    }
            
                } catch (error) {
                    console.error('Error en zonaConfirmada:', error);
                    socket.emit('error', { mensaje: error.message });
                }
            });
            
            // Manejar mensajes del chat
            socket.on('mensajeJuego', (datos) => {
                const codigo = datos.partidaCodigo || socket.partidaCodigo;
                if (!codigo) {
                    socket.emit('error', { mensaje: 'No hay partida activa' });
                    return;
                }

                this.manejarMensajeChat(socket, { ...datos, partidaCodigo: codigo });
            });

            // Manejar desconexión
            socket.on('disconnect', () => {
                if (socket.partidaCodigo) {
                    this.manejarDesconexion(socket);
                }
            });
        });
    }

    // Método auxiliar para verificar partida
    obtenerPartida(socket, codigo) {
        const partidaCodigo = codigo || socket.partidaCodigo;
        if (!partidaCodigo) {
            socket.emit('error', { mensaje: 'Código de partida no disponible' });
            return null;
        }

        const partida = this.partidas.get(partidaCodigo);
        if (!partida) {
            socket.emit('error', { mensaje: 'Partida no encontrada' });
            return null;
        }

        return partida;
    }

    // Método para emitir eventos de forma segura
    emitirAPartida(codigo, evento, datos) {
        if (!codigo) {
            console.error('[SERVER] Intento de emitir sin código de partida');
            return;
        }

        console.log(`[SERVER] Emitiendo ${evento} a partida ${codigo}:`, datos);
        this.io.to(codigo).emit(evento, {
            ...datos,
            timestamp: new Date().toISOString()
        });
    }

    
    //#region Manejar unirse a partida y desconexión

    manejarUnionPartida(socket, datos) {
        const { codigo } = datos;
        
        if (!codigo) {
            socket.emit('error', { mensaje: 'Código de partida no proporcionado' });
            return;
        }

        console.log(`[SERVER] Jugador ${socket.id} uniéndose a partida ${codigo}`);

        // Crear o recuperar la partida
        let partida = this.partidas.get(codigo);
        if (!partida) {
            partida = this.crearNuevaPartida(codigo);
            this.partidas.set(codigo, partida);
        }

        // Unir al socket a las salas necesarias
        socket.join(codigo);
        if (datos.equipo) {
            socket.join(`${codigo}_${datos.equipo}`);
        }

        // Guardar referencia al código en el socket
        socket.partidaCodigo = codigo;

        // Notificar unión exitosa
        socket.emit('unionExitosa', {
            codigo,
            estado: partida.estado,
            timestamp: new Date().toISOString()
        });

        // Propagar a otros jugadores
        socket.to(codigo).emit('jugadorUnido', {
            ...datos,
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    }

    crearNuevaPartida(codigo) {
        return {
            codigo,
            estado: {
                fase: 'preparacion',
                subfase: 'definicion_sector',
                timestamp: new Date().toISOString()
            },
            jugadores: new Map(),
            elementos: new Map()
        };
    }

    // Agregar métodos de utilidad para manejo de código
    verificarPartida(socket, codigo) {
        if (!codigo) {
            socket.emit('error', { mensaje: 'Código de partida no proporcionado' });
            return null;
        }

        const partida = this.partidas.get(codigo);
        if (!partida) {
            socket.emit('error', { mensaje: 'Partida no encontrada' });
            return null;
        }

        return partida;
    }

    // Método para manejar mensajes del chat de forma segura
    manejarMensajeChat(socket, datos) {
        const codigo = datos.partidaCodigo || socket.partidaCodigo;
        const partida = this.verificarPartida(socket, codigo);
        if (!partida) return;

        const mensajeCompleto = {
            ...datos,
            timestamp: new Date().toISOString()
        };

        if (datos.tipo === 'equipo') {
            // Enviar solo al equipo correspondiente
            socket.to(`${codigo}_${datos.equipo}`).emit('mensajeJuego', mensajeCompleto);
        } else {
            // Enviar a toda la partida
            socket.to(codigo).emit('mensajeJuego', mensajeCompleto);
        }

        this.actualizarEstadisticas(codigo, 'mensajeChat');
    }

    enviarEstadoPartida(socket, datos) {
        const { codigo } = datos;
        const partida = this.partidas.get(codigo);

        if (!partida) {
            socket.emit('error', { mensaje: 'Partida no encontrada' });
            return;
        }

        // Verificar si hay director y está conectado
        if (partida.director) {
            const directorSocket = this.io.sockets.sockets.get(partida.director.socketId);
            if (directorSocket) {
                // Solicitar estado actual al director
                directorSocket.emit('solicitarEstadoDirector', {
                    solicitanteId: socket.id,
                    timestamp: new Date().toISOString()
                });
                return;
            }
        }

        // Si no hay director o no está conectado, enviar estado almacenado
        socket.emit('estadoPartida', {
            ...partida.estado,
            timestamp: new Date().toISOString()
        });
    }

    propagarCambioFase(socket, datos) {
        const { codigo, fase, subfase } = datos;
        const partida = this.partidas.get(codigo);

        if (!partida) return;

        // Validar que el emisor sea el director
        const jugador = Array.from(partida.jugadores.entries())
            .find(([_, j]) => j.socketId === socket.id);

        if (!jugador || !jugador[1].esDirector) {
            socket.emit('error', { mensaje: 'No autorizado para cambiar fase' });
            return;
        }

        // Actualizar estado
        partida.estado.fase = fase;
        partida.estado.subfase = subfase;
        partida.estado.timestamp = new Date().toISOString();

        // Propagar a todos los jugadores
        this.io.to(codigo).emit('cambioFase', {
            ...datos,
            timestamp: partida.estado.timestamp
        });

        // Actualizar estadísticas
        this.actualizarEstadisticas(codigo, 'cambioFase');
    }

    manejarDesconexion(socket) {
        console.log('[SERVER] Desconexión:', socket.id);
        this.partidas.forEach((partida, codigo) => {
            partida.jugadores.forEach((jugador, userId) => {
                if (jugador.socketId === socket.id) {
                    partida.jugadores.delete(userId);
                    this.actualizarEstadisticas(codigo, 'desconexion');

                    // Si era director, limpiar referencia
                    if (partida.director?.socketId === socket.id) {
                        partida.director = null;
                    }

                    // Notificar a otros jugadores
                    this.io.to(codigo).emit('jugadorDesconectado', {
                        userId,
                        timestamp: new Date().toISOString()
                    });

                    // Verificar si la partida quedó vacía
                    if (partida.jugadores.size === 0) {
                        this.limpiarPartidaInactiva(codigo);
                    }
                }
            });
        });
    }

    enviarEstadoPartida(socket, datos) {
        const { partidaCodigo } = datos;
        
        // Verificar si la partida existe
        if (!this.partidas.has(partidaCodigo)) {
            socket.emit('error', { 
                mensaje: 'Partida no encontrada',
                codigo: partidaCodigo
            });
            return;
        }
    
        const partida = this.partidas.get(partidaCodigo);
        
        // Enviar estado almacenado
        socket.emit('estadoPartida', {
            ...partida.estado,
            timestamp: new Date().toISOString()
        });
    }

    manejarMensajeChat(socket, datos) {
        const { partidaCodigo } = datos;
        
        // Validar existencia de partida
        if (!this.partidas.has(partidaCodigo)) return;

        // Agregar timestamp
        const mensajeConTimestamp = {
            ...datos,
            timestamp: new Date().toISOString()
        };

        // Emitir según tipo de mensaje
        if (datos.tipo === 'equipo') {
            socket.to(`${partidaCodigo}_${datos.equipo}`).emit('mensajeJuego', mensajeConTimestamp);
        } else {
            socket.to(partidaCodigo).emit('mensajeJuego', mensajeConTimestamp);
        }

        this.actualizarEstadisticas(partidaCodigo, 'mensajeChat');
    }
    limpiarPartidaInactiva(codigo) {
        const partida = this.partidas.get(codigo);
        if (!partida) return;

        // Si no hay jugadores, limpiar la partida
        if (partida.jugadores.size === 0) {
            this.partidas.delete(codigo);
            console.log('[SERVER] Limpiando partida inactiva:', codigo);
        }

        this.partidas.delete(codigo);
        this.estadisticas.delete(codigo);
    }

//#region  Manejo de eventos de partida
manejarEstadoDirector(socket, datos) {
    const { partidaCodigo, estado } = datos;
    const partida = this.partidas.get(partidaCodigo);
    
    if (!partida) return;

    // Verificar que el emisor sea el director
    if (partida.director?.socketId !== socket.id) {
        socket.emit('error', { mensaje: 'No autorizado para actualizar estado' });
        return;
    }

    // Actualizar estado
    partida.estado = {
        ...estado,
        timestamp: new Date().toISOString()
        };
    }


manejarCambioFase(socket, datos) {
    const { codigo, fase, subfase } = datos;
    const partida = this.partidas.get(codigo);

    if (!partida) return;

    // Validar que el emisor sea el director
    const jugador = partida.jugadores.get(socket.id);

    if (!jugador || !jugador.esDirector) {
        socket.emit('error', { mensaje: 'No autorizado para cambiar fase' });
        return;
    }

    // Actualizar estado
    partida.estado.fase = fase;
    partida.estado.subfase = subfase;
    partida.estado.timestamp = new Date().toISOString();

    // Propagar a todos los jugadores
    this.io.to(codigo).emit('cambioFase', {
        ...datos,
        timestamp: partida.estado.timestamp
    });
}

manejarConfirmacionSector(socket, datos) {
    try {
        const codigo = datos.partidaCodigo;
        
        // Validar datos
        if (!datos.bounds || !datos.coordenadas) {
            throw new Error('Datos de sector incompletos');
        }

        // Emitir a todos los demás en la sala
        socket.to(codigo).emit('sectorConfirmado', datos);

        console.log('sectorConfirmado emitido:', datos);
    } catch (error) {
        console.error('Error manejando confirmación de sector:', error);
        socket.emit('error', { mensaje: 'Error al procesar sector' });
    }
}

manejarConfirmacionZona(socket, datos) {
    const { codigo, zona } = datos;
    const partida = this.partidas.get(codigo);

    if (!partida) return;

    if (!partida.estado.zonas) {
        partida.estado.zonas = {};
    }
    partida.estado.zonas[zona.equipo] = zona;

    socket.to(codigo).emit('zonaConfirmada', {
        ...datos,
        timestamp: new Date().toISOString()
    });
}

manejarElementoCreado(socket, datos) {
    const { codigo, elemento } = datos;
    const partida = this.partidas.get(codigo);

    if (!partida) return;

    if (!partida.estado.elementos) {
        partida.estado.elementos = new Map();
    }
    partida.estado.elementos.set(elemento.id, elemento);

    socket.to(codigo).emit('elementoCreado', {
        ...datos,
        timestamp: new Date().toISOString()
    });
}

manejarElementoMovido(socket, datos) {
    const { codigo, elementoId, nuevaPosicion } = datos;
    const partida = this.partidas.get(codigo);

    if (!partida) return;

    const elemento = partida.estado.elementos.get(elementoId);
    if (elemento) {
        elemento.posicion = nuevaPosicion;

        socket.to(codigo).emit('elementoMovido', {
            ...datos,
            timestamp: new Date().toISOString()
        });
    }
}

manejarElementoEliminado(socket, datos) {
    const { codigo, elementoId } = datos;
    const partida = this.partidas.get(codigo);

    if (!partida) return;

    partida.estado.elementos.delete(elementoId);

    socket.to(codigo).emit('elementoEliminado', {
        ...datos,
        timestamp: new Date().toISOString()
    });
}

//#region Manejo de turnos y estado del juego

manejarCambioTurno(socket, datos) {
        const { partidaCodigo, jugadorActual } = datos;
        const partida = this.partidas.get(partidaCodigo);

    if (!partida) return;

    // Actualizar estado
    partida.estado.jugadorActual = jugadorActual;
    partida.estado.timestamp = new Date().toISOString();

    // Propagar a todos
        this.io.to(partidaCodigo).emit('cambioTurno', {
        ...datos,
        timestamp: partida.estado.timestamp
    });

        this.actualizarEstadisticas(partidaCodigo, 'cambioTurno');
}

manejarFinTurno(socket, datos) {
        const { partidaCodigo, jugadorId } = datos;
        const partida = this.partidas.get(partidaCodigo);

    if (!partida) return;

    // Propagar fin de turno
        this.io.to(partidaCodigo).emit('finTurno', {
        ...datos,
        timestamp: new Date().toISOString()
    });

        this.actualizarEstadisticas(partidaCodigo, 'finTurno');
}

manejarJugadorListo(socket, datos) {
        const { partidaCodigo, jugadorId, equipo } = datos;
        const partida = this.partidas.get(partidaCodigo);

    if (!partida) return;

        // Marcar jugador como listo
        const jugador = partida.jugadores.get(jugadorId);
    if (jugador) {
        if (tipo === 'sala') {
            jugador.listoSala = true;
        } else if (tipo === 'despliegue') {
            jugador.listoDespliegue = true;
        }

        jugador.timestamp = new Date().toISOString();
    }

    // Emitir estado del jugador a la partida
    this.io.to(codigo).emit('jugadorListo', {
        jugadoId,
        tipo,
        timestamp: jugador.timestamp
    });

    // Verificar si todos los jugadores están listos para continuar con la siguiente fase
    this.verificarTodosListos(partidaCodigo, tipo);
}

verificarTodosListos(partidaCodigo, tipo) {
    const todosListos = Array.from(partida.jugadores.values()).every((jugador) => {
        if (tipo === 'sala') {
            return jugador.listoSala;
        } else if (tipo === 'despliegue') {
            return jugador.listoDespliegue;
        }
        return false;
    });

    if (todosListos) {
        if (tipo === 'sala') {
            this.io.to(partidaCodigo).emit('todosListosSala', {
                timestamp: new Date().toISOString()
            });
        } else if (tipo === 'despliegue') {
            this.io.to(partidaCodigo).emit('todosListosDespliegue', {
                timestamp: new Date().toISOString()
            });
        }
    }
}

actualizarEstadisticas(codigo, evento) {
    try {
        // Verificar código válido
        if (!codigo) {
            console.error('[SERVER] Código de partida no proporcionado para estadísticas');
            return;
        }

        // Inicializar estadísticas si no existen
        if (!this.estadisticas.has(codigo)) {
            this.estadisticas.set(codigo, {
                conexiones: 0,
                cambiosFase: 0,
                elementosCreados: 0,
                elementosMovidos: 0,
                elementosEliminados: 0,
                sectoresConfirmados: 0,
                zonasConfirmadas: 0,
                mensajesChat: 0,
                cambiosTurno: 0,
                finesTurno: 0,
                jugadoresListos: 0,
                errores: 0,
                ultimoEvento: null,
                inicioPartida: new Date().toISOString()
            });
        }

        // Obtener estadísticas actuales
        const stats = this.estadisticas.get(codigo);
        
        // Actualizar contador según el tipo de evento
        switch (evento) {
            case 'conexion':
                stats.conexiones++;
                break;
            case 'cambioFase':
                stats.cambiosFase++;
                break;
            case 'elementoCreado':
                stats.elementosCreados++;
                break;
            case 'elementoMovido':
                stats.elementosMovidos++;
                break;
            case 'elementoEliminado':
                stats.elementosEliminados++;
                break;
            case 'sectorConfirmado':
                stats.sectoresConfirmados++;
                break;
            case 'zonaConfirmada':
                stats.zonasConfirmadas++;
                break;
            case 'mensajeChat':
                stats.mensajesChat++;
                break;
            case 'cambioTurno':
                stats.cambiosTurno++;
                break;
            case 'finTurno':
                stats.finesTurno++;
                break;
            case 'jugadorListo':
                stats.jugadoresListos++;
                break;
            case 'error':
                stats.errores++;
                break;
            default:
                console.warn(`[SERVER] Tipo de evento desconocido: ${evento}`);
                return;
        }

        // Actualizar último evento
        stats.ultimoEvento = {
            tipo: evento,
            timestamp: new Date().toISOString()
        };

        // Actualizar estadísticas en el Map
        this.estadisticas.set(codigo, stats);

        // Registrar para debugging
        console.log('[SERVER] Estadísticas partida:', codigo, {
            ...stats,
            duracion: this.calcularDuracionPartida(stats.inicioPartida)
        });
    } catch (error) {
        console.error('[SERVER] Error actualizando estadísticas:', error);
    }
}

// Método auxiliar para calcular duración
calcularDuracionPartida(inicioPartida) {
    const inicio = new Date(inicioPartida);
    const ahora = new Date();
    const duracionMs = ahora - inicio;
    const duracionMinutos = Math.floor(duracionMs / 60000);
    return `${duracionMinutos} minutos`;
}
}
// #region Inicialización del servidor

// Crear instancia de GameServer y inicializar el servidor
const gameServer = new GameServer(io, pool);

async function inicializarServidor() {
    try {
        // Iniciar cualquier lógica adicional del servidor (como cargar partidas activas)
        console.log('Inicializando GameServer...');
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al inicializar servidor:', error);
        process.exit(1);
    }
}



inicializarServidor();

