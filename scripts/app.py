# app_complete.py - Versión completa migrada de MAIRA para Render.com

import os
import sys
import json
import random
import string
import time
import traceback
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix

# Variables globales
usuarios_conectados = {}  
operaciones_batalla = {}
informes_db = {}
adjuntos_info = {}
partidas = {}
user_sid_map = {}
user_id_sid_map = {} 

# Configuración de Flask
app = Flask(__name__, static_folder='.')
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuración de SocketIO
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=True, 
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=['polling', 'websocket']
)

# Configuración de la base de datos PostgreSQL
def get_db_connection():
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        else:
            conn = psycopg2.connect(
                host=os.environ.get('DB_HOST', 'localhost'),
                database=os.environ.get('DB_NAME', 'maira_db'),
                user=os.environ.get('DB_USER', 'postgres'),
                password=os.environ.get('DB_PASSWORD', ''),
                port=os.environ.get('DB_PORT', '5432'),
                cursor_factory=RealDictCursor
            )
        print("✅ Conexión exitosa a PostgreSQL")
        return conn
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        return None

# Rutas básicas
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('.', path)
    except:
        return send_from_directory('.', 'index.html')

@app.route('/health')
def health_check():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

# API Routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Usuario y contraseña son requeridos"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE username = %s", (username,))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({
                "success": True,
                "message": "Login exitoso",
                "user_id": user['id'],
                "username": user['username']
            })
        else:
            return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"}), 401
    except Exception as e:
        print("Error durante el login:", e)
        return jsonify({"success": False, "message": "Error de servidor", "error": str(e)}), 500
    finally:
        if conn:
            cursor.close()
            conn.close()

@app.route('/api/crear-usuario', methods=['POST'])
def crear_usuario():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        unidad = data.get('unidad')

        if not all([username, password, email, unidad]):
            return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400

        conn = get_db_connection()
        if conn is None:
            return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

        try:
            cursor = conn.cursor()
            
            # Verificar si el usuario ya existe
            cursor.execute("SELECT id FROM usuarios WHERE username = %s OR email = %s", (username, email))
            existing = cursor.fetchone()
            
            if existing:
                return jsonify({"success": False, "message": "El nombre de usuario o correo ya está en uso"}), 400
            
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            cursor.execute(
                "INSERT INTO usuarios (username, password, email, unidad, is_online) VALUES (%s, %s, %s, %s, %s)",
                (username, hashed_password.decode('utf-8'), email, unidad, False)
            )
            
            conn.commit()
            
            return jsonify({
                "success": True,
                "message": "Usuario creado exitosamente"
            })
            
        except Exception as e:
            conn.rollback()
            print(f"Error en la base de datos: {e}")
            return jsonify({"success": False, "message": "Error al crear usuario", "error": str(e)}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al crear usuario: {e}")
        return jsonify({"success": False, "message": "Error de servidor", "error": str(e)}), 500

# Funciones auxiliares
def obtener_username(user_id):
    """Obtiene el username de un usuario por su ID"""
    if not user_id:
        return "Usuario desconocido"
    
    conn = get_db_connection()
    if conn is None:
        return "Usuario desconocido"
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT username FROM usuarios WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        return result['username'] if result else "Usuario desconocido"
    except Exception as e:
        print(f"Error obteniendo username: {e}")
        return "Usuario desconocido"
    finally:
        if conn:
            cursor.close()
            conn.close()

def actualizar_lista_operaciones_gb():
    """Actualiza la lista de operaciones GB disponibles para todos los usuarios"""
    try:
        conn = get_db_connection()
        if conn is None:
            return
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.esCreador = true 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.configuracion::text LIKE '%"tipo":"gestion_batalla"%' 
            AND p.estado IN ('preparacion', 'en_curso')
            ORDER BY p.fecha_creacion DESC
        """)
        
        operaciones_db = cursor.fetchall()
        operaciones_disponibles = []
        
        for operacion in operaciones_db:
            # Obtener participantes de la operación
            cursor.execute("""
                SELECT u.id, u.username, up.equipo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (operacion['id'],))
            
            participantes = cursor.fetchall()
            configuracion = json.loads(operacion['configuracion']) if operacion['configuracion'] else {}
            
            operacion_info = {
                'id': operacion['id'],
                'codigo': operacion['codigo'],
                'nombre': configuracion.get('nombre', 'Operación Sin Nombre'),
                'descripcion': configuracion.get('descripcion', ''),
                'creador': configuracion.get('creador', 'Desconocido'),
                'estado': operacion['estado'],
                'fecha_creacion': operacion['fecha_creacion'].isoformat() if operacion['fecha_creacion'] else None,
                'participantes': len(participantes),
                'elementos': [{'usuario': p['username'], 'equipo': p['equipo']} for p in participantes]
            }
            operaciones_disponibles.append(operacion_info)
        
        # Emitir a todos los usuarios conectados
        print(f"📡 Emitiendo lista de {len(operaciones_disponibles)} operaciones GB")
        socketio.emit('operacionesGB', {'operaciones': operaciones_disponibles})
        
    except Exception as e:
        print(f"❌ Error actualizando lista de operaciones GB: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

def actualizar_lista_partidas():
    """Actualiza la lista de partidas disponibles para todos los usuarios"""
    try:
        conn = get_db_connection()
        if conn is None:
            return
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.esCreador = true 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.estado IN ('esperando', 'en_curso')
            ORDER BY p.fecha_creacion DESC
        """)
        
        partidas_db = cursor.fetchall()
        partidas_disponibles = []
        
        for partida in partidas_db:
            # Obtener jugadores de la partida
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (partida['id'],))
            
            jugadores = cursor.fetchall()
            
            partida_info = {
                'id': partida['id'],
                'codigo': partida['codigo'],
                'configuracion': json.loads(partida['configuracion']) if partida['configuracion'] else {},
                'estado': partida['estado'],
                'fecha_creacion': partida['fecha_creacion'].isoformat() if partida['fecha_creacion'] else None,
                'creador_username': partida['creador_username'],
                'jugadores': [dict(j) for j in jugadores],
                'jugadores_count': len(jugadores)
            }
            partidas_disponibles.append(partida_info)
        
        # Emitir a todos los usuarios conectados
        socketio.emit('partidasDisponibles', {'partidas': partidas_disponibles})
        
    except Exception as e:
        print(f"Error actualizando lista de partidas: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

# SocketIO Events
@socketio.on('connect')
def handle_connect():
    print(f"Cliente conectado: {request.sid}")
    emit('conectado', {'mensaje': 'Conectado al servidor'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Cliente desconectado: {request.sid}")
    
    # Limpiar datos del usuario
    user_id = user_sid_map.get(request.sid)
    if user_id:
        # Marcar usuario como desconectado en la base de datos
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("UPDATE usuarios SET is_online = false WHERE id = %s", (user_id,))
                conn.commit()
            except Exception as e:
                print(f"Error actualizando estado offline: {e}")
            finally:
                cursor.close()
                conn.close()
        
        # Limpiar mapas
        if user_id in user_id_sid_map:
            del user_id_sid_map[user_id]
        del user_sid_map[request.sid]
        
        # Limpiar de usuarios conectados
        if user_id in usuarios_conectados:
            del usuarios_conectados[user_id]

@socketio.on('login')
def handle_login(data):
    try:
        user_id = data.get('user_id')
        username = data.get('username')
        
        if not user_id or not username:
            emit('loginError', {'mensaje': 'Datos de login incompletos'})
            return
        
        # Registrar usuario en mapas de seguimiento
        user_sid_map[request.sid] = user_id
        user_id_sid_map[user_id] = request.sid
        usuarios_conectados[user_id] = {
            'username': username,
            'sid': request.sid,
            'fecha_conexion': datetime.now()
        }
        
        # Marcar usuario como online en la base de datos
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("UPDATE usuarios SET is_online = true WHERE id = %s", (user_id,))
                conn.commit()
            except Exception as e:
                print(f"Error actualizando estado online: {e}")
            finally:
                cursor.close()
                conn.close()
        
        print(f"Usuario {username} (ID: {user_id}) ha hecho login")
        emit('loginExitoso', {
            'user_id': user_id,
            'username': username,
            'mensaje': 'Login exitoso via SocketIO'
        })
        
        # Enviar lista de partidas disponibles
        actualizar_lista_partidas()
        
    except Exception as e:
        print(f"Error en login SocketIO: {e}")
        emit('loginError', {'mensaje': 'Error interno del servidor'})

@socketio.on('crearPartida')
def crear_partida(data):
    try:
        print("Iniciando creación de partida con datos:", data)
        configuracion = data.get('configuracion')
        if not configuracion:
            print("Error: Configuración de partida faltante")
            emit('errorCrearPartida', {'mensaje': 'Configuración de partida faltante'})
            return

        codigo_partida = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        estado = 'esperando'
        fecha_creacion = datetime.now()

        # Convertir la configuración a formato JSON
        configuracion_json = json.dumps(configuracion)

        conn = get_db_connection()
        if conn is None:
            print("Error: No se pudo establecer conexión con la base de datos")
            emit('errorCrearPartida', {'mensaje': 'Error de conexión a la base de datos'})
            return

        try:
            cursor = conn.cursor()
            print("Insertando datos en la tabla partidas")
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (codigo_partida, configuracion_json, estado, fecha_creacion))
            
            partida_id = cursor.fetchone()['id']

            print("Insertando creador como primer jugador")
            creador_id = user_sid_map.get(request.sid)
            if creador_id is None:
                print("Error: No se encontró el ID del creador")
                emit('errorCrearPartida', {'mensaje': 'Error al obtener el ID del creador'})
                return

            # Insertar al creador en la tabla `usuarios_partida` con `esCreador` = true
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                VALUES (%s, %s, 'sin_equipo', false, true)
            """, (partida_id, creador_id))
            
            conn.commit()
            print("Commit realizado con éxito")

            partida = {
                'id': partida_id,
                'codigo': codigo_partida,
                'configuracion': configuracion,
                'estado': estado,
                'fecha_creacion': fecha_creacion.isoformat(),
                'jugadores': [{
                    'id': creador_id,
                    'username': obtener_username(creador_id),
                    'equipo': 'sin_equipo',
                    'listo': False
                }]
            }

            join_room(codigo_partida, sid=request.sid)
            print(f"🏠 Usuario {creador_id} unido a sala: {codigo_partida}")
            
            print(f"📤 Emitiendo evento 'partidaCreada' con datos: {partida}")
            emit('partidaCreada', partida)
            
            print(f"📋 Actualizando lista de partidas globales...")
            actualizar_lista_partidas()
            
            print(f"✅ Partida creada exitosamente: {codigo_partida}")
            print(f"🎯 Usuario debería recibir evento 'partidaCreada' ahora")

        except Exception as e:
            conn.rollback()
            print(f"Error en la base de datos al crear partida: {e}")
            emit('errorCrearPartida', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Error general al crear partida: {e}")
        emit('errorCrearPartida', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('obtenerPartidasDisponibles')
def obtener_partidas_disponibles():
    """Envía la lista de partidas disponibles al cliente"""
    try:
        actualizar_lista_partidas()
    except Exception as e:
        print(f"Error obteniendo partidas disponibles: {e}")
        emit('error', {'mensaje': 'Error al obtener partidas'})

@socketio.on('unirseAPartida')
def unirse_a_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorUnirse', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorUnirse', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorUnirse', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la partida existe y está en estado esperando
            cursor.execute("SELECT * FROM partidas WHERE codigo = %s", (codigo_partida,))
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorUnirse', {'mensaje': 'Partida no encontrada'})
                return
            
            if partida['estado'] != 'esperando':
                emit('errorUnirse', {'mensaje': 'La partida ya no está disponible'})
                return
            
            # Verificar que el usuario no esté ya en la partida
            cursor.execute("""
                SELECT * FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (partida['id'], user_id))
            
            if cursor.fetchone():
                emit('errorUnirse', {'mensaje': 'Ya estás en esta partida'})
                return
            
            # Verificar límite de jugadores
            configuracion = json.loads(partida['configuracion'])
            max_jugadores = configuracion.get('maxJugadores', 8)
            
            cursor.execute("""
                SELECT COUNT(*) as count FROM usuarios_partida 
                WHERE partida_id = %s
            """, (partida['id'],))
            
            jugadores_actuales = cursor.fetchone()['count']
            
            if jugadores_actuales >= max_jugadores:
                emit('errorUnirse', {'mensaje': 'La partida está llena'})
                return
            
            # Agregar usuario a la partida
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                VALUES (%s, %s, 'sin_equipo', false, false)
            """, (partida['id'], user_id))
            
            conn.commit()
            
            # Unir al usuario a la sala
            join_room(codigo_partida, sid=request.sid)
            
            # Obtener información actualizada de la partida
            cursor.execute("""
                SELECT u.id, u.username, up.equipo, up.listo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (partida['id'],))
            
            jugadores = cursor.fetchall()
            
            partida_info = {
                'id': partida['id'],
                'codigo': codigo_partida,
                'configuracion': configuracion,
                'estado': partida['estado'],
                'jugadores': [dict(j) for j in jugadores]
            }
            
            # Notificar a todos en la sala que un jugador se unió
            socketio.emit('jugadorSeUnio', {
                'jugador': {
                    'id': user_id,
                    'username': obtener_username(user_id),
                    'equipo': 'sin_equipo',
                    'listo': False
                },
                'partida': partida_info
            }, room=codigo_partida)
            
            # Confirmar al jugador que se unió
            emit('unidoAPartida', partida_info)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al unirse a partida: {e}")
            emit('errorUnirse', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al unirse a partida: {e}")
        emit('errorUnirse', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('iniciarPartida')
def iniciar_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorIniciar', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorIniciar', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorIniciar', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que el usuario es el creador
            cursor.execute("""
                SELECT p.* FROM partidas p
                JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.codigo = %s AND up.usuario_id = %s AND up.esCreador = true
            """, (codigo_partida, user_id))
            
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorIniciar', {'mensaje': 'Solo el creador puede iniciar la partida'})
                return
            
            if partida['estado'] != 'esperando':
                emit('errorIniciar', {'mensaje': 'La partida ya fue iniciada'})
                return
            
            # Actualizar estado de la partida
            cursor.execute("""
                UPDATE partidas SET estado = 'en_curso' WHERE id = %s
            """, (partida['id'],))
            
            conn.commit()
            
            # Notificar a todos en la sala que la partida ha iniciado
            socketio.emit('partidaIniciada', {
                'codigo': codigo_partida,
                'mensaje': 'La partida ha comenzado'
            }, room=codigo_partida)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al iniciar partida: {e}")
            emit('errorIniciar', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al iniciar partida: {e}")
        emit('errorIniciar', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('mensajeChat')
def handle_mensaje_chat(data):
    try:
        mensaje = data.get('mensaje')
        sala = data.get('sala', 'general')
        user_id = user_sid_map.get(request.sid)
        
        if not user_id or not mensaje:
            return
        
        username = obtener_username(user_id)
        
        mensaje_data = {
            'id': str(random.randint(1000, 9999)),
            'usuario_id': user_id,
            'username': username,
            'mensaje': mensaje,
            'timestamp': datetime.now().isoformat(),
            'sala': sala
        }
        
        # Emitir mensaje a la sala
        socketio.emit('nuevoMensajeChat', mensaje_data, room=sala)
        
    except Exception as e:
        print(f"Error manejando mensaje de chat: {e}")

@socketio.on('mensajeJuego')
def handle_mensaje_juego(data):
    """Compatibilidad con mensajeJuego"""
    handle_mensaje_chat(data)

@socketio.on('cancelarPartida')
def cancelar_partida(data):
    try:
        codigo_partida = data.get('codigo')
        if not codigo_partida:
            emit('errorCancelar', {'mensaje': 'Código de partida requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('errorCancelar', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('errorCancelar', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que el usuario es el creador
            cursor.execute("""
                SELECT p.* FROM partidas p
                JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.codigo = %s AND up.usuario_id = %s AND up.esCreador = true
            """, (codigo_partida, user_id))
            
            partida = cursor.fetchone()
            
            if not partida:
                emit('errorCancelar', {'mensaje': 'Solo el creador puede cancelar la partida'})
                return
            
            # Eliminar partida y relaciones
            cursor.execute("DELETE FROM usuarios_partida WHERE partida_id = %s", (partida['id'],))
            cursor.execute("DELETE FROM partidas WHERE id = %s", (partida['id'],))
            
            conn.commit()
            
            # Notificar a todos en la sala que la partida fue cancelada
            socketio.emit('partidaCancelada', {
                'codigo': codigo_partida,
                'mensaje': 'La partida ha sido cancelada'
            }, room=codigo_partida)
            
            # Actualizar lista global
            actualizar_lista_partidas()
            
        except Exception as e:
            conn.rollback()
            print(f"Error en base de datos al cancelar partida: {e}")
            emit('errorCancelar', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Error al cancelar partida: {e}")
        emit('errorCancelar', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('actualizarEstadoGB')
def actualizar_estado_gb(data):
    try:
        operacion = data.get('operacion')
        estado = data.get('estado')
        
        if operacion and estado:
            # Guardar en memoria
            if operacion not in operaciones_batalla:
                operaciones_batalla[operacion] = {}
            operaciones_batalla[operacion].update(estado)
            
            # Emitir actualización
            emit('estadoActualizadoGB', data, room=operacion)
    except Exception as e:
        print(f"Error actualizando estado GB: {e}")

# Eventos adicionales básicos para mantener funcionalidad mínima
@socketio.on('expulsarJugador')
def expulsar_jugador(data):
    emit('jugadorExpulsado', data, room=data.get('sala', 'general'))

@socketio.on('unirseAPartidaJuego')
def unirse_a_partida_juego(data):
    sala = data.get('sala')
    if sala:
        join_room(sala)
        emit('unidoAPartidaJuego', {'sala': sala})

@socketio.on('enviarInvitacion')
def enviar_invitacion(data):
    destinatario_id = data.get('destinatario_id')
    if destinatario_id and destinatario_id in user_id_sid_map:
        socketio.emit('invitacionRecibida', data, room=user_id_sid_map[destinatario_id])

@socketio.on('elementoConectado')
def elemento_conectado(data):
    emit('elementoConectado', data, broadcast=True)

@socketio.on('actualizarPosicionGB')
def actualizar_posicion_gb(data):
    sala = data.get('sala', 'general')
    emit('posicionActualizadaGB', data, room=sala)

@socketio.on('anunciarElemento')
def anunciar_elemento(data):
    sala = data.get('sala', 'general')
    emit('elementoAnunciado', data, room=sala)

@socketio.on('nuevoElemento')
def nuevo_elemento(data):
    sala = data.get('sala', 'general')
    emit('elementoCreado', data, room=sala)

@socketio.on('nuevoInforme')
def nuevo_informe(data):
    sala = data.get('sala', 'general')
    emit('informeCreado', data, room=sala)

@socketio.on('informeLeido')
def informe_leido(data):
    sala = data.get('sala', 'general')
    emit('informeLeido', data, room=sala)

@socketio.on('obtenerInformeCompleto')
def obtener_informe_completo(data):
    # Implementación básica
    emit('informeCompleto', data)

@socketio.on('actualizarJugador')
def actualizar_jugador(data):
    sala = data.get('sala', 'general')
    emit('jugadorActualizado', data, room=sala)

@socketio.on('sectorConfirmado')
def sector_confirmado(data):
    sala = data.get('sala', 'general')
    emit('sectorConfirmado', data, room=sala)

@socketio.on('estadoActual')
def estado_actual(data):
    emit('estadoActual', data)

@socketio.on('unidadDesplegada')
def unidad_desplegada(data):
    sala = data.get('sala', 'general')
    emit('unidadDesplegada', data, room=sala)

@socketio.on('crearOperacionGB')
def crear_operacion_gb(data):
    try:
        print("🎖️ Iniciando creación de operación GB con datos:", data)
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        creador = data.get('creador', 'Desconocido')
        
        if not nombre:
            print("Error: Nombre de operación faltante")
            emit('error', {'mensaje': 'Nombre de operación requerido'})
            return

        codigo_operacion = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        estado = 'preparacion'
        fecha_creacion = datetime.now()

        conn = get_db_connection()
        if conn is None:
            print("Error: No se pudo establecer conexión con la base de datos")
            emit('error', {'mensaje': 'Error de conexión a la base de datos'})
            return

        try:
            cursor = conn.cursor()
            print("🗄️ Insertando operación GB en base de datos")
            
            # Usar la tabla partidas con un tipo específico para GB
            configuracion_gb = {
                'tipo': 'gestion_batalla',
                'nombre': nombre,
                'descripcion': descripcion,
                'area': data.get('area', ''),
                'creador': creador
            }
            
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (codigo_operacion, json.dumps(configuracion_gb), estado, fecha_creacion))
            
            operacion_id = cursor.fetchone()['id']

            creador_id = user_sid_map.get(request.sid)
            if creador_id:
                # Insertar al creador como director de operación
                cursor.execute("""
                    INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                    VALUES (%s, %s, 'director', false, true)
                """, (operacion_id, creador_id))
            
            conn.commit()
            print("✅ Operación GB creada exitosamente")

            operacion = {
                'id': operacion_id,
                'codigo': codigo_operacion,
                'nombre': nombre,
                'descripcion': descripcion,
                'creador': creador,
                'estado': estado,
                'fecha_creacion': fecha_creacion.isoformat(),
                'participantes': 1,
                'elementos': []
            }

            # Unir a sala específica de la operación
            join_room(f"gb_{codigo_operacion}", sid=request.sid)
            
            print(f"📤 Emitiendo 'operacionGBCreada' con datos: {operacion}")
            emit('operacionGBCreada', {'operacion': operacion})
            
            # Actualizar lista global de operaciones
            actualizar_lista_operaciones_gb()
            
            print(f"🎖️ Operación GB creada exitosamente: {codigo_operacion}")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error en la base de datos al crear operación GB: {e}")
            emit('error', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"❌ Error general al crear operación GB: {e}")
        emit('error', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('obtenerOperacionesGB')
def obtener_operaciones_gb(data=None):
    """Envía la lista de operaciones GB disponibles al cliente"""
    try:
        print("📋 Solicitando lista de operaciones GB")
        actualizar_lista_operaciones_gb()
    except Exception as e:
        print(f"❌ Error obteniendo operaciones GB: {e}")
        emit('error', {'mensaje': 'Error al obtener operaciones'})

@socketio.on('unirseOperacionGB')
def unirse_operacion_gb(data):
    try:
        codigo_operacion = data.get('codigo')
        elemento_info = data.get('elemento', {})
        
        if not codigo_operacion:
            emit('error', {'mensaje': 'Código de operación requerido'})
            return
        
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        conn = get_db_connection()
        if conn is None:
            emit('error', {'mensaje': 'Error de conexión a la base de datos'})
            return
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la operación existe
            cursor.execute("""
                SELECT * FROM partidas 
                WHERE codigo = %s AND configuracion::text LIKE '%"tipo":"gestion_batalla"%'
            """, (codigo_operacion,))
            operacion = cursor.fetchone()
            
            if not operacion:
                emit('error', {'mensaje': 'Operación no encontrada'})
                return
            
            if operacion['estado'] not in ['preparacion', 'en_curso']:
                emit('error', {'mensaje': 'La operación ya no está disponible'})
                return
            
            # Verificar que el usuario no esté ya en la operación
            cursor.execute("""
                SELECT * FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (operacion['id'], user_id))
            
            if cursor.fetchone():
                emit('error', {'mensaje': 'Ya estás en esta operación'})
                return
            
            # Agregar usuario a la operación
            equipo = elemento_info.get('designacion', 'elemento')
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                VALUES (%s, %s, %s, false, false)
            """, (operacion['id'], user_id, equipo))
            
            conn.commit()
            
            # Unir al usuario a la sala
            join_room(f"gb_{codigo_operacion}", sid=request.sid)
            
            # Notificar éxito
            emit('unidoOperacionGB', {
                'codigo': codigo_operacion,
                'operacion': operacion['id'],
                'elemento': elemento_info
            })
            
            # Notificar a todos en la operación
            socketio.emit('nuevoElementoOperacion', {
                'usuario': obtener_username(user_id),
                'elemento': elemento_info,
                'operacion': codigo_operacion
            }, room=f"gb_{codigo_operacion}")
            
            # Actualizar lista global
            actualizar_lista_operaciones_gb()
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error en base de datos al unirse a operación GB: {e}")
            emit('error', {'mensaje': f'Error de base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Error al unirse a operación GB: {e}")
        emit('error', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('registrarOperacion')
def registrar_operacion(data):
    sala = data.get('sala', 'general')
    emit('operacionRegistrada', data, room=sala)

@socketio.on('zonaConfirmada')
def zona_confirmada(data):
    sala = data.get('sala', 'general')
    emit('zonaConfirmada', data, room=sala)

@socketio.on('cambioFase')
def cambio_fase(data):
    sala = data.get('sala', 'general')
    emit('faseActualizada', data, room=sala)

@socketio.on('inicioDespliegue')
def inicio_despliegue(data):
    sala = data.get('sala', 'general')
    emit('despliegueIniciado', data, room=sala)

@socketio.on('guardarElemento')
def guardar_elemento(data):
    emit('elementoGuardado', data)

@socketio.on('jugadorListo')
def jugador_listo(data):
    sala = data.get('sala', 'general')
    emit('jugadorListo', data, room=sala)

@socketio.on('jugadorListoDespliegue')
def jugador_listo_despliegue(data):
    sala = data.get('sala', 'general')
    emit('jugadorListoDespliegue', data, room=sala)

@socketio.on('salirSalaEspera')
def salir_sala_espera(data):
    codigo_partida = data.get('codigo')
    if codigo_partida:
        leave_room(codigo_partida)
        emit('salioDeSalaEspera', {'codigo': codigo_partida})

@socketio.on('reconectarAPartida')
def reconectar_a_partida(data):
    codigo_partida = data.get('codigo')
    if codigo_partida:
        join_room(codigo_partida)
        emit('reconectadoAPartida', {'codigo': codigo_partida})

@socketio.on('cambiarSala')
def cambiar_sala(data):
    sala_anterior = data.get('salaAnterior')
    sala_nueva = data.get('salaNueva')
    
    if sala_anterior:
        leave_room(sala_anterior)
    if sala_nueva:
        join_room(sala_nueva)
        
    emit('salaActualizada', {'sala': sala_nueva})

@socketio.on('obtenerListaAmigos')
def obtener_lista_amigos(data):
    # Implementación básica
    emit('listaAmigos', {'amigos': []})

@socketio.on('agregarAmigo')
def agregar_amigo(data):
    emit('amigoAgregado', data)

@socketio.on('actualizarEquipoJugador')
def actualizar_equipo_jugador(data):
    sala = data.get('sala', 'general')
    emit('equipoJugadorActualizado', data, room=sala)

@socketio.on('asignarDirectorTemporal')
def asignar_director_temporal(data):
    sala = data.get('sala', 'general')
    emit('directorTemporalAsignado', data, room=sala)

@socketio.on('obtenerInfoJugador')
def obtener_info_jugador(data):
    user_id = data.get('user_id')
    if user_id:
        username = obtener_username(user_id)
        emit('infoJugador', {'user_id': user_id, 'username': username})

@socketio.on('eliminarAmigo')
def eliminar_amigo(data):
    emit('amigoEliminado', data)

@socketio.on('joinRoom')
def join_room_handler(data):
    sala = data.get('room')
    if sala:
        join_room(sala)
        emit('joinedRoom', {'room': sala})

@socketio.on('sectorDefinido')
def sector_definido(data):
    sala = data.get('sala', 'general')
    emit('sectorDefinido', data, room=sala)

@socketio.on('mensajeMultimedia')
def mensaje_multimedia(data):
    sala = data.get('sala', 'general')
    emit('mensajeMultimedia', data, room=sala)

@socketio.on('zonaDespliegueDefinida')
def zona_despliegue_definida(data):
    sala = data.get('sala', 'general')
    emit('zonaDespliegueDefinida', data, room=sala)

@socketio.on('iniciarCombate')
def iniciar_combate(data):
    sala = data.get('sala', 'general')
    emit('combateIniciado', data, room=sala)

@socketio.on('cambioTurno')
def cambio_turno(data):
    sala = data.get('sala', 'general')
    emit('turnoActualizado', data, room=sala)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"🚀 Iniciando MAIRA en puerto {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
