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
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix

# Importaciones pesadas bajo demanda
def lazy_import_psycopg2():
    """Importar psycopg2 solo cuando se necesite"""
    global psycopg2, RealDictCursor
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2, RealDictCursor

def lazy_import_bcrypt():
    """Importar bcrypt solo cuando se necesite"""
    global bcrypt
    import bcrypt
    return bcrypt

def lazy_import_tarfile():
    """Importar tarfile solo cuando se necesite"""
    global tarfile, traceback
    import tarfile
    import traceback
    return tarfile, traceback

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
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configuración de SocketIO optimizada para Render.com
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    logger=True, 
    engineio_logger=True,
    ping_timeout=120,  # ✅ AUMENTADO: era 60
    ping_interval=60,  # ✅ AUMENTADO: era 25
    transports=['polling'],  # ✅ FORZAR POLLING en lugar de websocket para Render
    upgrade=False  # ✅ NUEVO: Evitar upgrade a websocket
)

# Configuración de la base de datos PostgreSQL
def get_db_connection():
    try:
        # Lazy import de psycopg2 solo cuando se necesite
        psycopg2, RealDictCursor = lazy_import_psycopg2()
        
        # Priorizar DATABASE_URL (para producción en Render)
        DATABASE_URL = os.environ.get('DATABASE_URL')
        print(f"🔍 DATABASE_URL presente: {'SÍ' if DATABASE_URL else 'NO'}")
        
        if DATABASE_URL:
            # Mostrar parte de la URL sin exponer credenciales completas
            url_preview = DATABASE_URL[:30] + "..." + DATABASE_URL[-15:] if len(DATABASE_URL) > 45 else DATABASE_URL
            print(f"🔗 Conectando con DATABASE_URL: {url_preview}")
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            print("✅ Conexión exitosa a PostgreSQL via DATABASE_URL")
            return conn
        
        # Fallback para desarrollo local con variables individuales
        host = os.environ.get('DB_HOST', 'localhost')
        database = os.environ.get('DB_NAME', 'maira_db')
        user = os.environ.get('DB_USER', 'postgres')
        password = os.environ.get('DB_PASSWORD', '')
        port = os.environ.get('DB_PORT', '5432')
        
        print(f"🔗 Intentando conexión local: {user}@{host}:{port}/{database}")
        
        if not password:
            print("⚠️ DB_PASSWORD no está configurado para conexión local")
            return None
            
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=password,
            port=port,
            cursor_factory=RealDictCursor
        )
        print("✅ Conexión exitosa a PostgreSQL via credenciales individuales")
        return conn
        
    except psycopg2.OperationalError as e:
        print(f"❌ Error de conexión PostgreSQL: {e}")
        print(f"💡 Asegúrate de configurar DATABASE_URL en Render o las variables DB_* localmente")
        return None
    except psycopg2.Error as e:
        print(f"❌ Error de PostgreSQL: {e}")
        return None
    except Exception as e:
        print(f"❌ Error general conectando a PostgreSQL: {e}")
        return None

# Rutas básicas
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        # Intentar servir desde static/ primero para archivos HTML
        if path.endswith('.html'):
            return send_from_directory('static', path)
        # Para otros archivos, intentar desde la raíz
        return send_from_directory('.', path)
    except:
        # Si falla, servir index.html desde static/
        return send_from_directory('static', 'index.html')

# ✅ NUEVAS: Rutas de archivos faltantes
@app.route('/Client/uploads/<path:filename>')
def serve_uploads(filename):
    """Servir archivos de uploads"""
    uploads_dir = os.path.join('.', 'Client', 'uploads')
    return send_from_directory(uploads_dir, filename)

@app.route('/Client/audio/<path:filename>')
def serve_audio(filename):
    """Servir archivos de audio"""
    audio_dir = os.path.join('.', 'Client', 'audio')
    return send_from_directory(audio_dir, filename)

@app.route('/Client/<path:path>')
def serve_client_files(path):
    """Servir archivos estáticos del cliente"""
    client_dir = os.path.join('.', 'Client')
    return send_from_directory(client_dir, path)

@app.route('/health')
def health_check():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

@app.route('/api/debug/tables')
def debug_tables():
    """Debug endpoint para verificar tablas de la base de datos"""
    try:
        psycopg2, RealDictCursor = lazy_import_psycopg2()
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "No database connection"}), 500
        
        cursor = conn.cursor()
        
        # Listar todas las tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        # Verificar tabla partidas específicamente
        partidas_exists = 'partidas' in tables
        
        result = {
            "tables": tables,
            "partidas_table_exists": partidas_exists,
            "total_tables": len(tables)
        }
        
        # Si existe tabla partidas, obtener su estructura
        if partidas_exists:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'partidas' 
                ORDER BY ordinal_position;
            """)
            partidas_structure = cursor.fetchall()
            result["partidas_structure"] = partidas_structure
            
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM partidas;")
            result["partidas_count"] = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Debug error: {str(e)}"}), 500

@app.route('/api/proxy/github/<path:file_path>')
def proxy_github_file(file_path):
    """Proxy para archivos de GitHub Release para evitar CORS"""
    import requests
    
    try:
        # URL base del release v4.0 
        base_url = 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/'
        github_url = base_url + file_path
        
        # Hacer la request al archivo de GitHub
        response = requests.get(github_url, stream=True)
        
        if response.status_code == 200:
            # Determinar el content-type basado en la extensión
            content_type = 'application/octet-stream'
            if file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.tar.gz'):
                content_type = 'application/gzip'
            elif file_path.endswith('.tif'):
                content_type = 'image/tiff'
            
            # Agregar headers CORS
            headers = {
                'Content-Type': content_type,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
            
            return response.content, 200, headers
        else:
            return jsonify({"error": f"File not found: {file_path}"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Proxy error: {str(e)}"}), 500

@app.route('/api/extract-tile', methods=['POST'])
def extract_tile():
    """Endpoint para extraer un tile específico desde un archivo TAR.GZ"""
    try:
        data = request.json
        provincia = data.get('provincia')
        tile_filename = data.get('tile_filename')
        tar_filename = data.get('tar_filename')
        
        if not all([provincia, tile_filename, tar_filename]):
            return jsonify({"success": False, "message": "Faltan parámetros requeridos"}), 400
        
        # Construir rutas
        base_path = f"mini_tiles_github/{provincia}"
        tar_path = os.path.join(base_path, tar_filename)
        tiles_dir = os.path.join(base_path, "tiles")
        output_path = os.path.join(tiles_dir, tile_filename)
        
        # Verificar si el tile ya está extraído
        if os.path.exists(output_path):
            return jsonify({"success": True, "message": "Tile ya disponible", "path": f"/{output_path}"})
        
        # Crear directorio de tiles si no existe
        os.makedirs(tiles_dir, exist_ok=True)
        
        # Verificar que el archivo TAR.GZ existe
        if not os.path.exists(tar_path):
            return jsonify({"success": False, "message": f"Archivo TAR.GZ no encontrado: {tar_path}"}), 404
        
        # Extraer el tile específico
        tarfile_lib, traceback_lib = lazy_import_tarfile()
        with tarfile_lib.open(tar_path, 'r:gz') as tar:
            try:
                tar.extract(tile_filename, tiles_dir)
                return jsonify({
                    "success": True, 
                    "message": "Tile extraído exitosamente",
                    "path": f"/{output_path}"
                })
            except KeyError:
                return jsonify({"success": False, "message": f"Tile {tile_filename} no encontrado en {tar_filename}"}), 404
    
    except Exception as e:
        return jsonify({"success": False, "message": f"Error extrayendo tile: {str(e)}"}), 500

@app.route('/extraer_tile_vegetacion', methods=['POST'])
def extraer_tile_vegetacion():
    """Extraer un tile específico de vegetación desde archivos TAR.GZ del CDN"""
    try:
        data = request.json
        archivo_tar = data.get('archivo_tar')
        tile_filename = data.get('tile_filename')
        
        if not archivo_tar or not tile_filename:
            return jsonify({"success": False, "message": "Parámetros requeridos: archivo_tar, tile_filename"}), 400
        
        # Construir rutas
        base_path = "https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/"
        tar_url = base_path + archivo_tar
        tiles_dir = os.path.join("tiles", "vegetacion")
        output_path = os.path.join(tiles_dir, tile_filename)
        local_tar_path = os.path.join("temp_extract", archivo_tar)
        
        print(f"🌿 Solicitando tile de vegetación: {tile_filename} desde {archivo_tar}")
        
        # Verificar si el tile ya está extraído
        if os.path.exists(output_path):
            return jsonify({"success": True, "message": "Tile de vegetación ya disponible", "path": f"/{output_path}"})
        
        # Crear directorios si no existen
        os.makedirs(tiles_dir, exist_ok=True)
        os.makedirs("temp_extract", exist_ok=True)
        
        # Descargar el archivo TAR.GZ si no existe localmente
        if not os.path.exists(local_tar_path):
            print(f"📥 Descargando archivo TAR: {tar_url}")
            import urllib.request
            urllib.request.urlretrieve(tar_url, local_tar_path)
        
        # Extraer el tile específico de vegetación
        tarfile_lib, traceback_lib = lazy_import_tarfile()
        with tarfile_lib.open(local_tar_path, 'r:gz') as tar:
            try:
                tar.extract(tile_filename, tiles_dir)
                return jsonify({
                    "success": True, 
                    "message": "Tile de vegetación extraído exitosamente",
                    "path": f"/{output_path}"
                })
            except KeyError:
                return jsonify({"success": False, "message": f"Tile de vegetación {tile_filename} no encontrado en {archivo_tar}"}), 404
    
    except Exception as e:
        print(f"❌ Error extrayendo tile de vegetación: {str(e)}")
        return jsonify({"success": False, "message": f"Error extrayendo tile de vegetación: {str(e)}"}), 500

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

        if user and lazy_import_bcrypt().checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
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
            
            bcrypt_lib = lazy_import_bcrypt()
            hashed_password = bcrypt_lib.hashpw(password.encode('utf-8'), bcrypt_lib.gensalt())
            
            cursor.execute(
                "INSERT INTO usuarios (username, password, email, unidad, is_online) VALUES (%s, %s, %s, %s, %s)",
                (username, hashed_password.decode('utf-8'), email, unidad, 0)
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
        print("🔄 [DEBUG] Iniciando actualización de lista operaciones GB")
        
        conn = get_db_connection()
        if conn is None:
            print("❌ [DEBUG] No se pudo obtener conexión BD en actualizar_lista_operaciones_gb")
            return
        
        cursor = conn.cursor()
        
        query = """
            SELECT p.*, u.username as creador_username 
            FROM partidas p 
            LEFT JOIN usuarios_partida up ON p.id = up.partida_id AND up.esCreador = true 
            LEFT JOIN usuarios u ON up.usuario_id = u.id 
            WHERE p.configuracion::text LIKE '%"tipo":"gestion_batalla"%' 
            AND p.estado IN ('preparacion', 'en_curso')
            ORDER BY p.fecha_creacion DESC
        """
        
        print(f"📋 [DEBUG] Ejecutando query: {query}")
        cursor.execute(query)
        
        operaciones_db = cursor.fetchall()
        print(f"📊 [DEBUG] Encontradas {len(operaciones_db)} operaciones GB en BD")
        
        operaciones_disponibles = []
        
        for i, operacion in enumerate(operaciones_db):
            print(f"🔍 [DEBUG] Procesando operación {i+1}/{len(operaciones_db)}: {operacion['codigo']}")
            
            # Obtener participantes de la operación
            cursor.execute("""
                SELECT u.id, u.username, up.equipo 
                FROM usuarios_partida up 
                JOIN usuarios u ON up.usuario_id = u.id 
                WHERE up.partida_id = %s
            """, (operacion['id'],))
            
            participantes = cursor.fetchall()
            print(f"👥 [DEBUG] Operación {operacion['codigo']} tiene {len(participantes)} participantes")
            
            try:
                configuracion = json.loads(operacion['configuracion']) if operacion['configuracion'] else {}
                print(f"⚙️ [DEBUG] Configuración parseada para {operacion['codigo']}: {configuracion}")
            except json.JSONDecodeError as e:
                print(f"❌ [DEBUG] Error parseando configuración JSON para {operacion['codigo']}: {e}")
                configuracion = {}
            
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
            
            print(f"📦 [DEBUG] Operación info creada: {json.dumps(operacion_info, indent=2)}")
            operaciones_disponibles.append(operacion_info)
        
        # Emitir a todos los usuarios conectados
        print(f"📡 [DEBUG] Emitiendo lista de {len(operaciones_disponibles)} operaciones GB")
        socketio.emit('operacionesGB', {'operaciones': operaciones_disponibles})
        print("✅ [DEBUG] Lista operaciones GB emitida exitosamente")
        
    except Exception as e:
        print(f"❌ [DEBUG] Error actualizando lista de operaciones GB: {e}")
        print(f"📊 [DEBUG] Tipo de error: {type(e).__name__}")
        print(f"📄 [DEBUG] Detalles del error: {str(e)}")
    finally:
        if conn:
            cursor.close()
            conn.close()
            print("🔌 [DEBUG] Conexión BD cerrada en actualizar_lista_operaciones_gb")

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
                cursor.execute("UPDATE usuarios SET is_online = 0 WHERE id = %s", (user_id,))
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
        
        print(f"🔐 LOGIN - Usuario registrado: {username} (ID: {user_id}, SID: {request.sid})")
        print(f"🔐 LOGIN - user_sid_map actualizado: {user_sid_map}")
        
        # Marcar usuario como online en la base de datos
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("UPDATE usuarios SET is_online = 1 WHERE id = %s", (user_id,))
                conn.commit()
            except Exception as e:
                print(f"Error actualizando estado online: {e}")
            finally:
                cursor.close()
                conn.close()
        
        print(f"Usuario {username} (ID: {user_id}) ha hecho login")
        
        # ✅ NUEVO: Unir automáticamente al lobby general
        join_room('general', sid=request.sid)
        print(f"🏠 Usuario {username} unido a sala general")
        
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
    print(f"🎮 CREAR PARTIDA - Datos recibidos: {data}")
    print(f"🎮 CREAR PARTIDA - SID: {request.sid}")
    print(f"🎮 CREAR PARTIDA - User ID: {user_sid_map.get(request.sid)}")
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
            
            # ✅ NUEVO: También unir a sala de chat de la partida
            join_room(f"chat_{codigo_partida}", sid=request.sid)
            print(f"💬 Usuario {creador_id} unido a chat: chat_{codigo_partida}")
            
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
    """Envía la lista de partidas disponibles al cliente específico"""
    try:
        print(f"📋 Cliente {request.sid} solicitó lista de partidas disponibles")
        print(f"🔍 user_sid_map completo: {user_sid_map}")
        print(f"🔍 usuarios_conectados: {list(usuarios_conectados.keys())}")
        
        # Verificar si el usuario está autenticado
        user_id = user_sid_map.get(request.sid)
        if not user_id:
            print(f"❌ Usuario {request.sid} no está autenticado en user_sid_map")
            print(f"❌ SIDs disponibles en user_sid_map: {list(user_sid_map.keys())}")
            emit('errorObtenerPartidas', {'mensaje': 'Usuario no autenticado'})
            return
        
        print(f"✅ Usuario autenticado: {user_id}")
        
        # Obtener partidas directamente para este cliente
        conn = get_db_connection()
        if conn is None:
            emit('errorObtenerPartidas', {'mensaje': 'Error de conexión a la base de datos'})
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
        
        # Emitir solo al cliente que lo solicita (como en serverhttps.py)
        print(f"📡 Emitiendo lista de {len(partidas_disponibles)} partidas al cliente {request.sid}")
        emit('listaPartidas', partidas_disponibles, room=request.sid)
        print("✅ Lista de partidas enviada al cliente")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error obteniendo partidas disponibles: {e}")
        import traceback
        traceback.print_exc()
        emit('errorObtenerPartidas', {'mensaje': 'Error al obtener partidas'})

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
            
            # ✅ NUEVO: También unir a sala de chat de la partida
            join_room(f"chat_{codigo_partida}", sid=request.sid)
            print(f"💬 Usuario {user_id} unido a chat: chat_{codigo_partida}")
            
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
        
        print(f"📨 Chat recibido - Usuario: {user_id}, Sala: {sala}, Mensaje: {mensaje[:50]}...")
        
        if not user_id or not mensaje:
            print("❌ Chat rechazado - Falta user_id o mensaje")
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
        print(f"📤 Emitiendo 'nuevoMensajeChat' a sala '{sala}' desde {username}")
        socketio.emit('nuevoMensajeChat', mensaje_data, room=sala)
        
    except Exception as e:
        print(f"❌ Error manejando mensaje de chat: {e}")
        import traceback
        traceback.print_exc()

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
        print("🎖️ [DEBUG] Iniciando creación de operación GB")
        print(f"📥 [DEBUG] Datos recibidos del frontend: {json.dumps(data, indent=2)}")
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        creador = data.get('creador', 'Desconocido')
        
        print(f"🔍 [DEBUG] Datos extraídos - Nombre: '{nombre}', Descripción: '{descripcion}', Creador: '{creador}'")
        
        if not nombre:
            print("❌ [DEBUG] Error: Nombre de operación faltante")
            emit('error', {'mensaje': 'Nombre de operación requerido'})
            return

        codigo_operacion = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        estado = 'preparacion'
        fecha_creacion = datetime.now()
        
        print(f"🏷️ [DEBUG] Código generado: {codigo_operacion}, Estado: {estado}")

        conn = get_db_connection()
        if conn is None:
            print("❌ [DEBUG] Error: No se pudo establecer conexión con la base de datos")
            emit('error', {'mensaje': 'Error de conexión a la base de datos'})
            return

        try:
            cursor = conn.cursor()
            print("🗄️ [DEBUG] Insertando operación GB en base de datos")
            
            # Usar la tabla partidas con un tipo específico para GB
            configuracion_gb = {
                'tipo': 'gestion_batalla',
                'nombre': nombre,
                'descripcion': descripcion,
                'area': data.get('area', ''),
                'creador': creador
            }
            
            print(f"📝 [DEBUG] Configuración GB a insertar: {json.dumps(configuracion_gb, indent=2)}")
            
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (codigo_operacion, json.dumps(configuracion_gb), estado, fecha_creacion))
            
            operacion_id = cursor.fetchone()['id']
            print(f"✅ [DEBUG] Operación insertada con ID: {operacion_id}")

            creador_id = user_sid_map.get(request.sid)
            print(f"👤 [DEBUG] Creador ID obtenido: {creador_id}")
            
            if creador_id:
                # Insertar al creador como director de operación
                cursor.execute("""
                    INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                    VALUES (%s, %s, 'director', false, true)
                """, (operacion_id, creador_id))
                print("✅ [DEBUG] Creador insertado como director")
            else:
                print("⚠️ [DEBUG] No se pudo obtener ID del creador")
            
            conn.commit()
            print("✅ [DEBUG] Transacción confirmada exitosamente")

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
            
            print(f"📤 [DEBUG] Datos de operación a enviar: {json.dumps(operacion, indent=2)}")

            # Unir a sala específica de la operación
            join_room(f"gb_{codigo_operacion}", sid=request.sid)
            print(f"🏠 [DEBUG] Usuario unido a sala: gb_{codigo_operacion}")
            
            print(f"📤 [DEBUG] Emitiendo 'operacionGBCreada' con datos: {operacion}")
            emit('operacionGBCreada', {'operacion': operacion})
            
            # Actualizar lista global de operaciones
            print("🔄 [DEBUG] Actualizando lista global de operaciones")
            actualizar_lista_operaciones_gb()
            
            print(f"🎖️ [DEBUG] Operación GB creada exitosamente: {codigo_operacion}")

        except Exception as e:
            conn.rollback()
            print(f"❌ [DEBUG] Error en la base de datos al crear operación GB: {e}")
            print(f"📊 [DEBUG] Tipo de error: {type(e).__name__}")
            print(f"📄 [DEBUG] Detalles del error: {str(e)}")
            emit('error', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            print("🔌 [DEBUG] Conexión a BD cerrada")

    except Exception as e:
        print(f"❌ [DEBUG] Error general al crear operación GB: {e}")
        print(f"📊 [DEBUG] Tipo de error: {type(e).__name__}")
        print(f"📄 [DEBUG] Detalles del error: {str(e)}")
        emit('error', {'mensaje': f'Error interno: {str(e)}'})

@socketio.on('obtenerOperacionesGB')
def obtener_operaciones_gb(data=None):
    """Envía la lista de operaciones GB disponibles al cliente"""
    try:
        print("📋 Solicitando lista de operaciones GB")
        actualizar_lista_operaciones_gb()
    except Exception as e:
        print(f"❌ Error obteniendo operaciones GB: {e}")
        emit('operacionesGB', {'operaciones': []})  # Enviar lista vacía en caso de error

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
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        jugador_id = data.get('jugadorId') or user_sid_map.get(request.sid)
        
        if not codigo_partida or not jugador_id:
            print("❌ Datos incompletos en jugadorListoDespliegue")
            return
        
        print(f"🎯 Jugador {jugador_id} listo para despliegue en partida {codigo_partida}")
        
        # Emitir a toda la sala de la partida
        socketio.emit('jugadorListoDespliegue', {
            'jugador_id': jugador_id,
            'jugador': obtener_username(jugador_id),
            'partida_codigo': codigo_partida,
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'listo': True
        }, room=codigo_partida)
        
        print(f"✅ Estado de despliegue actualizado para {obtener_username(jugador_id)}")
        
    except Exception as e:
        print(f"❌ Error en jugadorListoDespliegue: {e}")
        emit('error', {'mensaje': 'Error procesando estado de despliegue'})

@socketio.on('cargarElementos')
def cargar_elementos(data):
    try:
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not usuario_id:
            emit('error', {'mensaje': 'Usuario no autenticado'})
            return
        
        # En una implementación real, cargarías desde la base de datos
        # Por ahora, simulamos elementos vacíos
        elementos_guardados = []
        
        emit('elementosActualizados', {
            'elementos': elementos_guardados,
            'usuario_id': usuario_id,
            'timestamp': datetime.now().isoformat()
        })
        
        print(f"📥 Elementos cargados para usuario {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error cargando elementos: {e}")
        emit('error', {'mensaje': 'Error cargando elementos'})

@socketio.on('actualizarPosicion')
def actualizar_posicion_elemento(data):
    try:
        elemento_id = data.get('elemento_id')
        nueva_posicion = data.get('posicion')
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not all([elemento_id, nueva_posicion, usuario_id]):
            emit('error', {'mensaje': 'Datos incompletos para actualizar posición'})
            return
        
        # Emitir actualización a otros usuarios en la misma sala
        emit('posicionActualizada', {
            'elemento_id': elemento_id,
            'posicion': nueva_posicion,
            'usuario_id': usuario_id,
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }, broadcast=True, include_self=False)
        
        print(f"📍 Posición actualizada - Elemento: {elemento_id}, Usuario: {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error actualizando posición: {e}")
        emit('error', {'mensaje': 'Error actualizando posición'})

@socketio.on('eliminarElemento')
def eliminar_elemento(data):
    try:
        elemento_id = data.get('elemento_id')
        usuario_id = data.get('usuario_id') or user_sid_map.get(request.sid)
        
        if not all([elemento_id, usuario_id]):
            emit('error', {'mensaje': 'Datos incompletos para eliminar elemento'})
            return
        
        # Emitir eliminación a todos los usuarios
        emit('elementoEliminado', {
            'elemento_id': elemento_id,
            'usuario_id': usuario_id,
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }, broadcast=True)
        
        print(f"🗑️ Elemento eliminado - ID: {elemento_id}, Usuario: {usuario_id}")
        
    except Exception as e:
        print(f"❌ Error eliminando elemento: {e}")
        emit('error', {'mensaje': 'Error eliminando elemento'})

@socketio.on('finalizarDespliegue')
def finalizar_despliegue(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en finalizarDespliegue")
            return
        
        print(f"🎯 Finalizando despliegue en partida {codigo_partida}")
        
        # Emitir a toda la sala
        socketio.emit('despliegueCompleto', {
            'partida_codigo': codigo_partida,
            'siguiente_fase': 'combate',
            'timestamp': datetime.now().isoformat(),
            'mensaje': 'Despliegue finalizado. Iniciando combate...'
        }, room=codigo_partida)
        
        print(f"✅ Despliegue finalizado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error finalizando despliegue: {e}")
        emit('error', {'mensaje': 'Error finalizando despliegue'})

@socketio.on('cambioTurno')
def cambio_turno(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        turno_actual = data.get('turno')
        jugador_actual = data.get('jugador')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en cambioTurno")
            return
        
        print(f"🔄 Cambio de turno en partida {codigo_partida} - Turno {turno_actual}")
        
        socketio.emit('turnoActualizado', {
            'partida_codigo': codigo_partida,
            'turno': turno_actual,
            'jugador_actual': jugador_actual,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"✅ Turno actualizado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error en cambio de turno: {e}")
        emit('error', {'mensaje': 'Error en cambio de turno'})

@socketio.on('iniciarCombate')
def iniciar_combate(data):
    try:
        codigo_partida = data.get('partidaCodigo') or data.get('codigo')
        
        if not codigo_partida:
            print("❌ Código de partida faltante en iniciarCombate")
            return
        
        print(f"⚔️ Iniciando combate en partida {codigo_partida}")
        
        # Emitir inicio de combate a toda la sala
        socketio.emit('combateIniciado', {
            'partida_codigo': codigo_partida,
            'fase': 'combate',
            'turno': 1,
            'timestamp': datetime.now().isoformat(),
            'mensaje': 'Combate iniciado. Comenzando turnos...'
        }, room=codigo_partida)
        
        # También emitir evento para actualizar la interfaz de turnos
        socketio.emit('iniciarTurnos', {
            'partida_codigo': codigo_partida,
            'turno_inicial': 1,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        print(f"✅ Combate iniciado en partida {codigo_partida}")
        
    except Exception as e:
        print(f"❌ Error iniciando combate: {e}")
        emit('error', {'mensaje': 'Error iniciando combate'})

# ✅ FUNCIONALIDAD DE UPLOADS - Faltante de serverhttps.py

# ==============================================
# 🎮 ENDPOINTS HTTP CRÍTICOS - SISTEMA PARTIDAS
# ==============================================

@app.route('/api/crear_partida', methods=['POST'])
def api_crear_partida():
    """
    Endpoint HTTP para crear partida - Equivalente al socket event
    """
    try:
        print("🎮 API CREAR PARTIDA - Iniciando...")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Datos faltantes'}), 400
            
        configuracion = data.get('configuracion')
        if not configuracion:
            return jsonify({'error': 'Configuración de partida faltante'}), 400

        codigo_partida = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        estado = 'esperando'
        fecha_creacion = datetime.now()

        # Convertir la configuración a formato JSON
        configuracion_json = json.dumps(configuracion)

        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Insertar partida
            cursor.execute("""
                INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion, jugadores_actuales)
                VALUES (%s, %s, %s, %s, %s) RETURNING id
            """, (codigo_partida, configuracion_json, estado, fecha_creacion, 0))
            
            partida_id = cursor.fetchone()['id']
            conn.commit()

            resultado = {
                'success': True,
                'partida': {
                    'id': partida_id,
                    'codigo': codigo_partida,
                    'configuracion': configuracion,
                    'estado': estado,
                    'fecha_creacion': fecha_creacion.isoformat()
                }
            }
            
            print(f"✅ Partida creada exitosamente: {codigo_partida}")
            return jsonify(resultado), 201
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error creando partida: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

@app.route('/api/partidas_disponibles', methods=['GET'])
def api_partidas_disponibles():
    """
    Obtener lista de partidas disponibles
    """
    try:
        print("📋 API PARTIDAS DISPONIBLES...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT p.id, p.codigo, p.estado, p.configuracion, p.fecha_creacion,
                       p.jugadores_actuales
                FROM partidas p
                WHERE p.estado = 'esperando'
                ORDER BY p.fecha_creacion DESC
                LIMIT 20;
            """)
            
            partidas = []
            for row in cursor.fetchall():
                # Manejar configuracion JSON que puede estar corrupta
                configuracion = {}
                if row['configuracion']:
                    try:
                        configuracion = json.loads(row['configuracion'])
                    except (json.JSONDecodeError, TypeError):
                        configuracion = {'nombre': 'Partida sin nombre', 'corrupta': True}
                
                partidas.append({
                    'id': row['id'],
                    'codigo': row['codigo'],
                    'estado': row['estado'],
                    'configuracion': configuracion,
                    'fecha_creacion': row['fecha_creacion'].isoformat() if row['fecha_creacion'] else None,
                    'jugadores_actuales': row['jugadores_actuales'] or 0
                })
            
            print(f"✅ Encontradas {len(partidas)} partidas disponibles")
            return jsonify({
                'success': True,
                'partidas': partidas,
                'total': len(partidas)
            })
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error obteniendo partidas: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

@app.route('/api/unirse_partida', methods=['POST'])
def api_unirse_partida():
    """
    Endpoint HTTP para unirse a una partida
    """
    try:
        print("🚪 API UNIRSE PARTIDA...")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Datos faltantes'}), 400
            
        codigo_partida = data.get('codigo')
        usuario_id = data.get('usuario_id')  # En producción esto vendría del token/sesión
        
        if not codigo_partida:
            return jsonify({'error': 'Código de partida faltante'}), 400
            
        if not usuario_id:
            return jsonify({'error': 'Usuario no identificado'}), 401

        conn = get_db_connection()
        if conn is None:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Verificar que la partida existe y está disponible
            cursor.execute("""
                SELECT id, estado FROM partidas WHERE codigo = %s
            """, (codigo_partida,))
            
            partida = cursor.fetchone()
            if not partida:
                return jsonify({'error': 'Partida no encontrada'}), 404
                
            partida_id, estado = partida
            
            if estado != 'esperando':
                return jsonify({'error': 'La partida ya no está disponible'}), 400
            
            # Verificar si el usuario ya está en la partida
            cursor.execute("""
                SELECT id FROM usuarios_partida 
                WHERE partida_id = %s AND usuario_id = %s
            """, (partida_id, usuario_id))
            
            if cursor.fetchone():
                return jsonify({'error': 'Ya estás en esta partida'}), 400
            
            # Unir al usuario a la partida
            cursor.execute("""
                INSERT INTO usuarios_partida (partida_id, usuario_id, equipo, listo, esCreador)
                VALUES (%s, %s, 'sin_equipo', false, false)
            """, (partida_id, usuario_id))
            
            conn.commit()
            
            resultado = {
                'success': True,
                'mensaje': 'Te has unido a la partida exitosamente',
                'partida': {
                    'id': partida_id,
                    'codigo': codigo_partida,
                    'estado': estado
                }
            }
            
            print(f"✅ Usuario {usuario_id} se unió a partida {codigo_partida}")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        print(f"❌ Error uniéndose a partida: {e}")
        return jsonify({
            'error': 'Error interno del servidor',
            'details': str(e)
        }), 500

# ==============================================
# 🔧 ENDPOINTS DE DEBUG CRÍTICOS - DIAGNÓSTICO PARTIDAS
# ==============================================

@app.route('/api/debug/db-complete')
def debug_db_complete():
    """
    DEBUG COMPLETO de base de datos - Diagnóstico exhaustivo
    """
    try:
        print("🔍 INICIANDO DEBUG COMPLETO DE BD...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL',
                'solucion': 'Verificar DATABASE_URL en variables de entorno'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # 1. Verificar conexión PostgreSQL primero
            cursor.execute("SELECT version() as version;")
            pg_version = cursor.fetchone()['version']
            
            # 2. Listar todas las tablas existentes
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tablas = [row['table_name'] for row in cursor.fetchall()]
            
            # 3. Verificar estructura de partidas específicamente (solo si existe)
            estructura_partidas = []
            if 'partidas' in tablas:
                try:
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable, column_default
                        FROM information_schema.columns 
                        WHERE table_name = 'partidas'
                        ORDER BY ordinal_position;
                    """)
                    estructura_partidas = [
                        {
                            'columna': row['column_name'],
                            'tipo': row['data_type'], 
                            'nullable': row['is_nullable'],
                            'default': row['column_default']
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    estructura_partidas = f"ERROR obteniendo estructura: {str(e)}"
            
            # 4. Contar registros en partidas (solo si existe)
            count_partidas = "TABLA NO EXISTE"
            if 'partidas' in tablas:
                try:
                    cursor.execute("SELECT COUNT(*) as count FROM partidas;")
                    count_partidas = cursor.fetchone()['count']
                except Exception as e:
                    count_partidas = f"ERROR contando registros: {str(e)}"
            
            # 5. Verificar partidas recientes (solo si existe)
            partidas_recientes = []
            if 'partidas' in tablas:
                try:
                    cursor.execute("""
                        SELECT codigo, estado, fecha_creacion 
                        FROM partidas 
                        ORDER BY fecha_creacion DESC 
                        LIMIT 5;
                    """)
                    partidas_recientes = [
                        {
                            'codigo': row['codigo'],
                            'estado': row['estado'],
                            'fecha': str(row['fecha_creacion'])
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    partidas_recientes = f"ERROR obteniendo partidas: {str(e)}"
            
            # 6. Verificar estructura de usuarios_partida (solo si existe)
            estructura_usuarios_partida = []
            if 'usuarios_partida' in tablas:
                try:
                    cursor.execute("""
                        SELECT column_name, data_type, is_nullable 
                        FROM information_schema.columns 
                        WHERE table_name = 'usuarios_partida'
                        ORDER BY ordinal_position;
                    """)
                    estructura_usuarios_partida = [
                        {
                            'columna': row['column_name'],
                            'tipo': row['data_type'], 
                            'nullable': row['is_nullable']
                        } for row in cursor.fetchall()
                    ]
                except Exception as e:
                    estructura_usuarios_partida = f"ERROR: {str(e)}"
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ DEBUG COMPLETADO',
                'postgres_version': pg_version,
                'total_tablas': len(tablas),
                'tablas_existentes': tablas,
                'analisis_partidas': {
                    'tabla_existe': 'partidas' in tablas,
                    'estructura': estructura_partidas,
                    'total_registros': count_partidas,
                    'registros_recientes': partidas_recientes
                },
                'analisis_usuarios_partida': {
                    'tabla_existe': 'usuarios_partida' in tablas,
                    'estructura': estructura_usuarios_partida
                },
                'otras_tablas': [tabla for tabla in tablas if tabla not in ['partidas', 'usuarios_partida']],
                'flask_config': {
                    'debug': app.debug,
                    'testing': app.testing,
                    'environment': os.environ.get('FLASK_ENV', 'production')
                }
            }
            
            print("✅ DEBUG COMPLETO EXITOSO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR EN DEBUG',
            'error': str(e),
            'tipo': type(e).__name__,
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error en debug completo: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/operaciones-diagnostico')
def debug_operaciones_completo():
    """
    DIAGNÓSTICO COMPLETO OPERACIONES Y PARTIDAS
    Endpoint específico para diagnosticar problemas con operaciones y partidas
    """
    try:
        print("🔍 INICIANDO DIAGNÓSTICO COMPLETO OPERACIONES...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        diagnostico = {
            'timestamp': datetime.now().isoformat(),
            'status': '✅ DIAGNÓSTICO COMPLETO',
            'esquema_bd': {},
            'datos_partidas': {},
            'usuarios_partida': {},
            'operaciones_gb': {},
            'logs_debug': []
        }
        
        try:
            cursor = conn.cursor()
            
            # 1. DIAGNÓSTICO ESQUEMA
            print("📋 Diagnosticando esquema de base de datos...")
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tablas = [row['table_name'] for row in cursor.fetchall()]
            diagnostico['esquema_bd']['tablas'] = tablas
            diagnostico['logs_debug'].append(f"Encontradas {len(tablas)} tablas: {', '.join(tablas)}")
            
            # Estructura tabla partidas
            if 'partidas' in tablas:
                cursor.execute("""
                    SELECT column_name, data_type, is_nullable, column_default 
                    FROM information_schema.columns 
                    WHERE table_name = 'partidas' 
                    ORDER BY ordinal_position
                """)
                diagnostico['esquema_bd']['estructura_partidas'] = [
                    {
                        'columna': col['column_name'],
                        'tipo': col['data_type'],
                        'nulo': col['is_nullable'],
                        'default': col['column_default']
                    } for col in cursor.fetchall()
                ]
            
            # 2. DIAGNÓSTICO DATOS PARTIDAS
            print("📊 Diagnosticando datos de partidas...")
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN configuracion::text LIKE '%"tipo":"gestion_batalla"%' THEN 'Gestión Batalla'
                        WHEN configuracion::text LIKE '%"modo"%' THEN 'Juego Guerra'
                        ELSE 'Otro/Sin clasificar'
                    END as tipo,
                    COUNT(*) as cantidad,
                    STRING_AGG(DISTINCT estado, ', ') as estados
                FROM partidas 
                GROUP BY 1
                ORDER BY cantidad DESC
            """)
            diagnostico['datos_partidas']['distribucion_tipos'] = [
                {
                    'tipo': row['tipo'],
                    'cantidad': row['cantidad'],
                    'estados': row['estados']
                } for row in cursor.fetchall()
            ]
            
            # Partidas recientes
            cursor.execute("""
                SELECT 
                    codigo, 
                    estado,
                    fecha_creacion,
                    LEFT(configuracion::text, 200) as config_preview
                FROM partidas 
                ORDER BY fecha_creacion DESC 
                LIMIT 10
            """)
            diagnostico['datos_partidas']['recientes'] = [
                {
                    'codigo': row['codigo'],
                    'estado': row['estado'],
                    'fecha': row['fecha_creacion'].isoformat() if row['fecha_creacion'] else None,
                    'config_preview': row['config_preview']
                } for row in cursor.fetchall()
            ]
            
            # 3. OPERACIONES GB ESPECÍFICAMENTE
            print("🎖️ Diagnosticando operaciones Gestión Batalla...")
            cursor.execute("""
                SELECT 
                    p.codigo,
                    p.estado,
                    p.fecha_creacion,
                    p.configuracion,
                    COUNT(up.usuario_id) as participantes_count
                FROM partidas p
                LEFT JOIN usuarios_partida up ON p.id = up.partida_id
                WHERE p.configuracion::text LIKE '%"tipo":"gestion_batalla"%'
                GROUP BY p.id, p.codigo, p.estado, p.fecha_creacion, p.configuracion
                ORDER BY p.fecha_creacion DESC
            """)
            operaciones = cursor.fetchall()
            
            diagnostico['operaciones_gb']['total'] = len(operaciones)
            diagnostico['operaciones_gb']['operaciones'] = []
            
            for op in operaciones:
                try:
                    config = json.loads(op['configuracion']) if op['configuracion'] else {}
                except:
                    config = {}
                
                op_info = {
                    'codigo': op['codigo'],
                    'estado': op['estado'],
                    'fecha': op['fecha_creacion'].isoformat() if op['fecha_creacion'] else None,
                    'nombre': config.get('nombre', 'Sin nombre'),
                    'creador': config.get('creador', 'Desconocido'),
                    'participantes': op['participantes_count'],
                    'configuracion_valida': bool(config)
                }
                diagnostico['operaciones_gb']['operaciones'].append(op_info)
            
            # 4. DIAGNÓSTICO USUARIOS_PARTIDA
            print("👥 Diagnosticando usuarios_partida...")
            if 'usuarios_partida' in tablas:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_registros,
                        COUNT(DISTINCT partida_id) as partidas_con_usuarios,
                        COUNT(DISTINCT usuario_id) as usuarios_unicos
                    FROM usuarios_partida
                """)
                stats = cursor.fetchone()
                diagnostico['usuarios_partida']['estadisticas'] = {
                    'total_registros': stats['total_registros'],
                    'partidas_con_usuarios': stats['partidas_con_usuarios'],
                    'usuarios_unicos': stats['usuarios_unicos']
                }
                
                # Distribución por equipo
                cursor.execute("""
                    SELECT equipo, COUNT(*) as cantidad
                    FROM usuarios_partida 
                    GROUP BY equipo 
                    ORDER BY cantidad DESC
                """)
                diagnostico['usuarios_partida']['distribucion_equipos'] = [
                    {'equipo': row['equipo'], 'cantidad': row['cantidad']}
                    for row in cursor.fetchall()
                ]
            
            # 5. TEST DE FUNCIONALIDAD
            print("🧪 Realizando test de funcionalidad...")
            timestamp_test = datetime.now()
            codigo_test = f"DIAG_{int(timestamp_test.timestamp())}"
            
            try:
                # Insertar operación de prueba
                cursor.execute("""
                    INSERT INTO partidas (codigo, configuracion, estado, fecha_creacion)
                    VALUES (%s, %s, %s, %s) RETURNING id
                """, (codigo_test, json.dumps({
                    'tipo': 'gestion_batalla',
                    'nombre': 'Test Diagnóstico',
                    'creador': 'Sistema Debug'
                }), 'preparacion', timestamp_test))
                
                test_id = cursor.fetchone()['id']
                
                # Verificar que se puede recuperar
                cursor.execute("""
                    SELECT * FROM partidas WHERE id = %s
                """, (test_id,))
                
                test_result = cursor.fetchone()
                
                # Limpiar test
                cursor.execute("DELETE FROM partidas WHERE id = %s", (test_id,))
                conn.commit()
                
                diagnostico['test_funcionalidad'] = {
                    'creacion_exitosa': True,
                    'recuperacion_exitosa': bool(test_result),
                    'limpieza_exitosa': True
                }
                
            except Exception as e:
                diagnostico['test_funcionalidad'] = {
                    'error': str(e),
                    'creacion_exitosa': False
                }
                conn.rollback()
            
            diagnostico['logs_debug'].append("✅ Diagnóstico completado exitosamente")
            
        except Exception as e:
            diagnostico['logs_debug'].append(f"❌ Error durante diagnóstico: {e}")
            diagnostico['error'] = str(e)
        finally:
            cursor.close()
            conn.close()
        
        return jsonify(diagnostico)
        
    except Exception as e:
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR GENERAL',
            'error': str(e),
            'logs_debug': [f"Error general: {e}"]
        }), 500
def debug_partidas_system():
    """
    DEBUG ESPECÍFICO del sistema de partidas
    """
    try:
        print("🎮 DIAGNÓSTICO SISTEMA PARTIDAS...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # Verificar si tabla partidas existe y crearla si no
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'partidas'
                ) as exists;
            """)
            tabla_existe = cursor.fetchone()['exists']
            
            if not tabla_existe:
                print("⚠️ TABLA PARTIDAS NO EXISTE - CREANDO...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS partidas (
                        id SERIAL PRIMARY KEY,
                        codigo VARCHAR(20) UNIQUE NOT NULL,
                        estado VARCHAR(20) DEFAULT 'esperando',
                        max_jugadores INTEGER DEFAULT 8,
                        jugadores_unidos INTEGER DEFAULT 0,
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        configuracion JSONB DEFAULT '{}',
                        datos_mapa JSONB DEFAULT '{}'
                    );
                """)
                conn.commit()
                tabla_creada = True
            else:
                tabla_creada = False
            
            # Verificar tabla usuarios_partida
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'usuarios_partida'
                ) as exists;
            """)
            tabla_usuarios_existe = cursor.fetchone()['exists']
            
            if not tabla_usuarios_existe:
                print("⚠️ TABLA USUARIOS_PARTIDA NO EXISTE - CREANDO...")
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS usuarios_partida (
                        id SERIAL PRIMARY KEY,
                        partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                        usuario_id INTEGER NOT NULL,
                        equipo VARCHAR(20) DEFAULT 'sin_equipo',
                        listo BOOLEAN DEFAULT false,
                        esCreador BOOLEAN DEFAULT false,
                        fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(partida_id, usuario_id)
                    );
                """)
                conn.commit()
                tabla_usuarios_creada = True
            else:
                tabla_usuarios_creada = False
            
            # Probar crear una partida de prueba
            codigo_test = f"TEST_{int(time.time())}"
            try:
                cursor.execute("""
                    INSERT INTO partidas (codigo, estado, max_jugadores) 
                    VALUES (%s, %s, %s) 
                    RETURNING id;
                """, (codigo_test, 'esperando', 8))
                partida_test_id = cursor.fetchone()['id']
                conn.commit()
                test_insert = "✅ INSERT EXITOSO"
                
                # Limpiar la partida de prueba
                cursor.execute("DELETE FROM partidas WHERE codigo = %s;", (codigo_test,))
                conn.commit()
                
            except Exception as e:
                test_insert = f"❌ ERROR INSERT: {str(e)}"
                partida_test_id = None
            
            # Verificar estructura final
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
                ORDER BY ordinal_position;
            """)
            columnas = {row[0]: row[1] for row in cursor.fetchall()}
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '🎮 DIAGNÓSTICO PARTIDAS',
                'tabla_partidas': {
                    'existia_antes': tabla_existe,
                    'creada_ahora': tabla_creada,
                    'columnas': columnas,
                    'test_insert': test_insert,
                    'test_id': partida_test_id
                },
                'tabla_usuarios_partida': {
                    'existia_antes': tabla_usuarios_existe,
                    'creada_ahora': tabla_usuarios_creada
                },
                'endpoints_disponibles': [
                    '/api/crear_partida',
                    '/api/unirse_partida',
                    '/api/partidas_disponibles'
                ]
            }
            
            print("✅ DIAGNÓSTICO PARTIDAS COMPLETADO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR DIAGNÓSTICO PARTIDAS',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error diagnóstico partidas: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/test-partida')
def debug_test_partida():
    """
    PRUEBA COMPLETA de crear partida desde cero
    """
    try:
        print("🧪 PRUEBA COMPLETA CREAR PARTIDA...")
        
        # Simular la misma lógica que usar crear_partida
        codigo = f"TEST_{random.randint(1000, 9999)}"
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # Intentar crear partida igual que el endpoint real
            cursor.execute("""
                INSERT INTO partidas (codigo, estado, jugadores_actuales) 
                VALUES (%s, %s, %s) 
                RETURNING id;
            """, (codigo, 'esperando', 0))
            
            partida_id = cursor.fetchone()['id']
            conn.commit()
            
            # Verificar que se creó correctamente
            cursor.execute("SELECT * FROM partidas WHERE codigo = %s;", (codigo,))
            partida_data = cursor.fetchone()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ PRUEBA CREAR PARTIDA EXITOSA',
                'partida_creada': {
                    'id': partida_id,
                    'codigo': codigo,
                    'datos_completos': {
                        'id': partida_data['id'],
                        'codigo': partida_data['codigo'],
                        'estado': partida_data['estado'],
                        'jugadores_actuales': partida_data['jugadores_actuales'],
                        'fecha_creacion': str(partida_data['fecha_creacion'])
                    }
                },
                'siguiente_paso': f"Probar POST a /api/crear_partida con datos reales"
            }
            
            # Limpiar partida de prueba
            cursor.execute("DELETE FROM partidas WHERE codigo = %s;", (codigo,))
            conn.commit()
            
            print(f"✅ PRUEBA EXITOSA - Partida {codigo} creada y eliminada")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR EN PRUEBA',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error en prueba partida: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/fix-schema-partidas', methods=['POST'])
def fix_schema_partidas():
    """
    FIX CRÍTICO: Arreglar esquema tabla partidas para compatibilidad
    """
    try:
        print("🔧 INICIANDO FIX ESQUEMA TABLA PARTIDAS...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            cambios_realizados = []
            
            # 1. Verificar columnas existentes
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
            """)
            columnas_existentes = [row['column_name'] for row in cursor.fetchall()]
            
            # 2. Agregar max_jugadores si no existe
            if 'max_jugadores' not in columnas_existentes:
                cursor.execute("""
                    ALTER TABLE partidas 
                    ADD COLUMN max_jugadores INTEGER DEFAULT 8
                """)
                cambios_realizados.append("✅ Agregada columna max_jugadores")
            else:
                cambios_realizados.append("ℹ️ Columna max_jugadores ya existe")
            
            # 3. Agregar jugadores_unidos si no existe
            if 'jugadores_unidos' not in columnas_existentes:
                cursor.execute("""
                    ALTER TABLE partidas 
                    ADD COLUMN jugadores_unidos INTEGER DEFAULT 0
                """)
                cambios_realizados.append("✅ Agregada columna jugadores_unidos")
            else:
                cambios_realizados.append("ℹ️ Columna jugadores_unidos ya existe")
            
            # 4. Actualizar jugadores_unidos basado en datos reales
            cursor.execute("""
                UPDATE partidas SET jugadores_unidos = (
                    SELECT COUNT(*) 
                    FROM usuarios_partida up 
                    WHERE up.partida_id = partidas.id
                )
            """)
            filas_actualizadas = cursor.rowcount
            cambios_realizados.append(f"✅ Actualizadas {filas_actualizadas} filas en jugadores_unidos")
            
            # 5. Establecer max_jugadores por defecto
            cursor.execute("""
                UPDATE partidas SET max_jugadores = 8 
                WHERE max_jugadores IS NULL
            """)
            filas_max = cursor.rowcount
            cambios_realizados.append(f"✅ Establecido max_jugadores en {filas_max} filas")
            
            # 6. Verificar estructura final
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'partidas'
                ORDER BY ordinal_position
            """)
            estructura_final = [
                {
                    'columna': row['column_name'],
                    'tipo': row['data_type'],
                    'nullable': row['is_nullable'],
                    'default': row['column_default']
                } for row in cursor.fetchall()
            ]
            
            conn.commit()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ ESQUEMA REPARADO',
                'cambios_realizados': cambios_realizados,
                'estructura_final': estructura_final,
                'siguiente_paso': 'Probar endpoints de partidas'
            }
            
            print("✅ ESQUEMA TABLA PARTIDAS REPARADO")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR REPARANDO ESQUEMA',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error reparando esquema: {e}")
        return jsonify(error_info), 500

@app.route('/api/debug/fix-json-configuracion', methods=['POST'])
def fix_json_configuracion():
    """
    FIX CRÍTICO: Limpiar datos JSON corruptos en columna configuracion
    """
    try:
        print("🧹 INICIANDO LIMPIEZA JSON CONFIGURACIÓN...")
        
        conn = get_db_connection()
        if conn is None:
            return jsonify({
                'timestamp': datetime.now().isoformat(),
                'status': '❌ ERROR CONEXIÓN BD',
                'error': 'No se pudo establecer conexión con PostgreSQL'
            }), 500
        
        try:
            cursor = conn.cursor()
            
            # 1. Verificar registros con configuracion problemática
            cursor.execute("""
                SELECT id, codigo, configuracion 
                FROM partidas 
                WHERE configuracion IS NOT NULL 
                ORDER BY fecha_creacion DESC 
                LIMIT 20
            """)
            
            registros = cursor.fetchall()
            problemas_encontrados = []
            registros_limpiados = 0
            
            for registro in registros:
                partida_id = registro['id']
                codigo = registro['codigo']
                config = registro['configuracion']
                
                # Verificar si el JSON es válido
                try:
                    if config:
                        json.loads(config)
                    # Si llegamos aquí, el JSON es válido
                    problemas_encontrados.append(f"✅ Partida {codigo}: JSON válido")
                except (json.JSONDecodeError, TypeError):
                    # JSON inválido, establecer configuración por defecto
                    config_default = json.dumps({
                        "nombre": f"Partida {codigo}",
                        "max_jugadores": 8,
                        "tipo_juego": "estrategia",
                        "mapa": "default",
                        "duracion_turno": 60
                    })
                    
                    cursor.execute("""
                        UPDATE partidas 
                        SET configuracion = %s 
                        WHERE id = %s
                    """, (config_default, partida_id))
                    
                    registros_limpiados += 1
                    problemas_encontrados.append(f"🔧 Partida {codigo}: JSON reparado")
            
            # 2. Establecer configuración por defecto para registros NULL
            cursor.execute("""
                UPDATE partidas 
                SET configuracion = %s 
                WHERE configuracion IS NULL
            """, (json.dumps({"nombre": "Partida sin configuración", "max_jugadores": 8}),))
            
            registros_null = cursor.rowcount
            
            conn.commit()
            
            resultado = {
                'timestamp': datetime.now().isoformat(),
                'status': '✅ JSON CONFIGURACIÓN LIMPIADO',
                'registros_analizados': len(registros),
                'registros_reparados': registros_limpiados,
                'registros_null_actualizados': registros_null,
                'detalles': problemas_encontrados,
                'siguiente_paso': 'Probar endpoints de partidas'
            }
            
            print(f"✅ JSON CONFIGURACIÓN LIMPIADO: {registros_limpiados} reparados, {registros_null} null actualizados")
            return jsonify(resultado)
            
        finally:
            conn.close()
            
    except Exception as e:
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'status': '❌ ERROR LIMPIANDO JSON',
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f"❌ Error limpiando JSON: {e}")
        return jsonify(error_info), 500
