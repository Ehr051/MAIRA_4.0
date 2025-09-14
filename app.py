# app_complete.py - Versión completa migrada de MAIRA para Render.com

import os
import sys
import json
import random
import string
import time
import traceback
import subprocess
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, send_file, Response
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix

# Verificación e instalación automática de dependencias Node.js
def verificar_dependencias_nodejs():
    """Verifica e instala TODAS las dependencias Node.js del package.json"""
    print("🔍 Verificando dependencias Node.js...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    node_modules_path = os.path.join(base_dir, 'node_modules')
    package_json_path = os.path.join(base_dir, 'package.json')
    
    # Verificar si existe package.json
    if not os.path.exists(package_json_path):
        print("❌ package.json no encontrado, continuando sin verificar dependencias")
        return
    
    # Leer dependencias del package.json
    try:
        import json
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        todas_dependencias = []
        if 'dependencies' in package_data:
            todas_dependencias.extend(package_data['dependencies'].keys())
        if 'devDependencies' in package_data:
            todas_dependencias.extend(package_data['devDependencies'].keys())
        
        # Dependencias críticas para verificación rápida
        dependencias_criticas = ['jquery', 'bootstrap', 'leaflet', 'jsplumb', 'pako', 'geotiff', 'milsymbol']
        dependencias_faltantes = []
        
        for dep in dependencias_criticas:
            dep_path = os.path.join(node_modules_path, dep)
            if not os.path.exists(dep_path):
                dependencias_faltantes.append(dep)
                print(f"❌ Falta dependencia crítica: {dep}")
            else:
                print(f"✅ Dependencia OK: {dep}")
        
        # Si faltan dependencias críticas o no existe node_modules, instalar TODO
        if dependencias_faltantes or not os.path.exists(node_modules_path):
            print(f"🚀 Instalando TODAS las dependencias del package.json...")
            try:
                # Verificar que npm esté disponible
                result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
                if result.returncode != 0:
                    print("❌ npm no disponible, continuando sin instalar dependencias")
                    return
                
                # Instalar TODAS las dependencias del package.json con resolución de conflictos
                install_commands = [
                    ['npm', 'install', '--legacy-peer-deps', '--no-optional', '--no-audit', '--no-fund']
                ]
                
                for cmd in install_commands:
                    print(f"🔧 Ejecutando: {' '.join(cmd)}")
                    result = subprocess.run(cmd, cwd=base_dir, capture_output=True, text=True, timeout=300)
                    if result.returncode == 0:
                        print("✅ Instalación completa exitosa")
                        print(f"📦 Instaladas {len(todas_dependencias)} dependencias del package.json")
                    else:
                        print(f"⚠️ Error en instalación completa: {result.stderr}")
                
                print("🎉 Instalación de TODAS las dependencias completada")
                
            except subprocess.TimeoutExpired:
                print("⚠️ Timeout en instalación, pero puede haber sido exitosa")
            except Exception as e:
                print(f"❌ Error instalando dependencias: {e}")
        else:
            print("✅ Todas las dependencias críticas Node.js están disponibles")
            
    except Exception as e:
        print(f"❌ Error leyendo package.json: {e}")
        return

# Ejecutar verificación al importar
verificar_dependencias_nodejs()

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
    ping_timeout=300,  # ✅ AUMENTADO: era 120, ahora 5 minutos
    ping_interval=60,  # ✅ AUMENTADO: era 25
    transports=['polling'],  # ✅ FORZAR POLLING en lugar de websocket para Render
    upgrade=False  # ✅ NUEVO: Evitar upgrade a websocket
)

# ✅ CRÍTICO: Ruta específica para socket.io client
@app.route('/socket.io/socket.io.js')
def serve_socketio_js():
    """Servir socket.io client library"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        socketio_path = os.path.join(base_dir, 'node_modules', 'socket.io', 'client-dist', 'socket.io.min.js')
        
        if os.path.exists(socketio_path):
            return send_from_directory(
                os.path.join(base_dir, 'node_modules', 'socket.io', 'client-dist'), 
                'socket.io.min.js',
                mimetype='application/javascript'
            )
        else:
            # Fallback a CDN si no existe local
            from flask import redirect
            return redirect('https://cdn.socket.io/4.6.1/socket.io.min.js', code=302)
    except Exception as e:
        print(f"❌ Error sirviendo socket.io: {e}")
        # Fallback a CDN
        from flask import redirect
        return redirect('https://cdn.socket.io/4.6.1/socket.io.min.js', code=302)

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
            print("⚠️ DB_PASSWORD no está configurado - intentando sin password para desarrollo")
            # En lugar de fallar, intentar conectar sin password (desarrollo local)
            try:
                conn = psycopg2.connect(
                    host=host,
                    database=database,
                    user=user,
                    port=port,
                    cursor_factory=RealDictCursor
                )
                print("✅ Conexión exitosa sin password (desarrollo)")
                return conn
            except:
                print("❌ Falló conexión sin password - DATABASE_URL requerido para producción")
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
    return send_from_directory('Client', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    print(f"🔍 DEBUG: Solicitud para archivo: {path}")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"🔍 DEBUG: Base directory: {base_dir}")
    
    try:
        # Intentar servir desde Client/ primero para archivos HTML
        if path.endswith('.html'):
            client_path = os.path.join(base_dir, 'Client', path)
            print(f"🔍 DEBUG: Buscando HTML en: {client_path}")
            print(f"🔍 DEBUG: ¿Existe archivo?: {os.path.exists(client_path)}")
            return send_from_directory('Client', path)
        # Para otros archivos, intentar desde la raíz
        full_path = os.path.join(base_dir, path)
        print(f"🔍 DEBUG: Buscando archivo en: {full_path}")
        print(f"🔍 DEBUG: ¿Existe archivo?: {os.path.exists(full_path)}")
        return send_from_directory('.', path)
    except Exception as e:
        print(f"❌ DEBUG: Error sirviendo {path}: {e}")
        # Si falla, servir index.html desde Client/
        return send_from_directory('Client', 'index.html')

# ✅ CRÍTICO: Rutas específicas para modelos 3D
@app.route('/Client/assets/models/<path:filename>')
@app.route('/assets/models/<path:filename>')  # Ruta adicional sin Client/
def serve_models(filename):
    """Servir archivos de modelos 3D GLB/GLTF con content-type correcto"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(base_dir, 'Client', 'assets', 'models')
        
        print(f"🎮 Sirviendo modelo 3D: {filename}")
        print(f"🔍 Directorio modelos: {models_dir}")
        print(f"🔍 ¿Existe archivo?: {os.path.exists(os.path.join(models_dir, filename))}")
        
        if not os.path.exists(models_dir):
            print(f"❌ Directorio de modelos no encontrado: {models_dir}")
            return "Directorio de modelos no encontrado", 404
            
        file_path = os.path.join(models_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Modelo no encontrado: {file_path}")
            return "Modelo no encontrado", 404
            
        # Configurar content-type correcto para archivos GLB/GLTF
        if filename.endswith('.glb'):
            content_type = 'model/gltf-binary'
        elif filename.endswith('.gltf'):
            content_type = 'model/gltf+json'
        else:
            content_type = 'application/octet-stream'
            
        response = send_from_directory(models_dir, filename)
        response.headers['Content-Type'] = content_type
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
        
        print(f"✅ Modelo servido correctamente: {filename} ({content_type})")
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo modelo {filename}: {e}")
        return f"Error cargando modelo: {str(e)}", 500

# ✅ CRÍTICO: Rutas específicas para assets generales
@app.route('/Client/assets/<path:filename>')
def serve_assets(filename):
    """Servir archivos de assets (imágenes, sonidos, etc.)"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        assets_dir = os.path.join(base_dir, 'Client', 'assets')
        
        print(f"📁 Sirviendo asset: {filename}")
        
        if not os.path.exists(assets_dir):
            print(f"❌ Directorio de assets no encontrado: {assets_dir}")
            return "Directorio de assets no encontrado", 404
            
        response = send_from_directory(assets_dir, filename)
        response.headers['Cache-Control'] = 'public, max-age=1800'  # Cache por 30 minutos
        
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo asset {filename}: {e}")
        return f"Error cargando asset: {str(e)}", 500

# ✅ CRÍTICO: Rutas específicas para node_modules (CDN local)
@app.route('/node_modules/<path:filename>')
def serve_node_modules(filename):
    """Servir archivos de node_modules con content-type correcto"""
    from flask import Response
    try:
        # Usar la ruta absoluta del directorio del script
        base_dir = os.path.dirname(os.path.abspath(__file__))
        node_modules_dir = os.path.join(base_dir, 'node_modules')
        
        print(f"🔍 Buscando node_modules en: {node_modules_dir}")
        print(f"🔍 Archivo solicitado: {filename}")
        print(f"🔍 ¿Existe directorio?: {os.path.exists(node_modules_dir)}")
        
        if not os.path.exists(node_modules_dir):
            print(f"❌ node_modules no encontrado en: {node_modules_dir}")
            # Intentar rutas alternativas
            alternate_paths = [
                '/opt/render/project/src/node_modules',  # Ruta típica de Render
                os.path.join(os.getcwd(), 'node_modules'),  # Working directory
                '/app/node_modules'  # Ruta Docker típica
            ]
            for alt_path in alternate_paths:
                if os.path.exists(alt_path):
                    print(f"✅ node_modules encontrado en ruta alternativa: {alt_path}")
                    node_modules_dir = alt_path
                    break
            else:
                # Ninguna ruta funcionó
                error_msg = f"node_modules not found. Tried: {[node_modules_dir] + alternate_paths}"
                print(f"❌ {error_msg}")
                if filename.endswith('.js'):
                    return f"console.error('{error_msg}');", 404, {'Content-Type': 'application/javascript'}
                else:
                    return f"/* {error_msg} */", 404, {'Content-Type': 'text/css'}
        
        file_path = os.path.join(node_modules_dir, filename)
        print(f"🔍 Ruta completa del archivo: {file_path}")
        print(f"🔍 ¿Existe archivo?: {os.path.exists(file_path)}")
        
        response = send_from_directory(node_modules_dir, filename)
        
        # Configurar content-type según extensión
        if filename.endswith('.js'):
            response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        elif filename.endswith('.css'):
            response.headers['Content-Type'] = 'text/css; charset=utf-8'
        elif filename.endswith('.map'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        
        response.headers['Cache-Control'] = 'public, max-age=31536000'  # Cache por 1 año
        print(f"✅ Archivo servido exitosamente: {filename}")
        return response
    except Exception as e:
        print(f"❌ Error sirviendo node_modules {filename}: {e}")
        traceback.print_exc()
        if filename.endswith('.js'):
            return f"console.error('Error loading {filename}: {e}');", 500, {'Content-Type': 'application/javascript'}
        else:
            return f"/* Error loading {filename}: {e} */", 500, {'Content-Type': 'text/css'}

# �️ CRÍTICO: Rutas específicas para tiles de altimetría locales
@app.route('/Client/Libs/datos_argentina/Altimetria_Mini_Tiles/<path:filename>')
def serve_altimetria_tiles(filename):
    """Servir tiles de altimetría locales con headers optimizados"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')
        
        print(f"🗺️ Sirviendo tile altimetría: {filename}")
        print(f"🗺️ Desde directorio: {tiles_dir}")
        
        if not os.path.exists(tiles_dir):
            print(f"❌ Directorio de tiles no encontrado: {tiles_dir}")
            return jsonify({'error': 'Tiles directory not found'}), 404
        
        file_path = os.path.join(tiles_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Archivo de tile no encontrado: {file_path}")
            return jsonify({'error': f'Tile file not found: {filename}'}), 404
        
        response = send_from_directory(tiles_dir, filename)
        
        # Headers optimizados para tiles
        if filename.endswith('.json'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        elif filename.endswith('.tar.gz'):
            response.headers['Content-Type'] = 'application/gzip'
        elif filename.endswith('.tiff') or filename.endswith('.tif'):
            response.headers['Content-Type'] = 'image/tiff'
        
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        print(f"✅ Tile servido exitosamente: {filename}")
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo tile altimetría {filename}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/<path:filename>')
def serve_vegetacion_tiles(filename):
    """Servir tiles de vegetación locales con headers optimizados"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_dir = os.path.join(base_dir, 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
        
        print(f"🌿 Sirviendo tile vegetación: {filename}")
        print(f"🌿 Desde directorio: {tiles_dir}")
        
        if not os.path.exists(tiles_dir):
            print(f"❌ Directorio de tiles vegetación no encontrado: {tiles_dir}")
            return jsonify({'error': 'Vegetation tiles directory not found'}), 404
        
        file_path = os.path.join(tiles_dir, filename)
        if not os.path.exists(file_path):
            print(f"❌ Archivo de tile vegetación no encontrado: {file_path}")
            return jsonify({'error': f'Vegetation tile file not found: {filename}'}), 404
        
        response = send_from_directory(tiles_dir, filename)
        
        # Headers optimizados para tiles de vegetación
        if filename.endswith('.json'):
            response.headers['Content-Type'] = 'application/json; charset=utf-8'
        elif filename.endswith('.tar.gz'):
            response.headers['Content-Type'] = 'application/gzip'
        elif filename.endswith('.tiff') or filename.endswith('.tif'):
            response.headers['Content-Type'] = 'image/tiff'
        
        response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache por 1 hora
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        print(f"✅ Tile vegetación servido exitosamente: {filename}")
        return response
        
    except Exception as e:
        print(f"❌ Error sirviendo tile vegetación {filename}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 📊 ENDPOINT: Diagnóstico completo de tiles
@app.route('/api/tiles/diagnostic')
def tiles_diagnostic():
    """Endpoint para diagnosticar el estado completo del sistema de tiles"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Verificar directorios
        altimetria_dir = os.path.join(base_dir, 'Client', 'Libs', 'datos_argentina', 'Altimetria_Mini_Tiles')
        vegetacion_dir = os.path.join(base_dir, 'Client', 'Libs', 'datos_argentina', 'Vegetacion_Mini_Tiles')
        
        diagnostic = {
            'timestamp': datetime.now().isoformat(),
            'base_directory': base_dir,
            'altimetria': {
                'directory': altimetria_dir,
                'exists': os.path.exists(altimetria_dir),
                'files': []
            },
            'vegetacion': {
                'directory': vegetacion_dir,
                'exists': os.path.exists(vegetacion_dir),
                'files': []
            }
        }
        
        # Listar archivos de altimetría
        if os.path.exists(altimetria_dir):
            for item in os.listdir(altimetria_dir):
                item_path = os.path.join(altimetria_dir, item)
                diagnostic['altimetria']['files'].append({
                    'name': item,
                    'is_directory': os.path.isdir(item_path),
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else None
                })
        
        # Listar archivos de vegetación
        if os.path.exists(vegetacion_dir):
            for item in os.listdir(vegetacion_dir):
                item_path = os.path.join(vegetacion_dir, item)
                diagnostic['vegetacion']['files'].append({
                    'name': item,
                    'is_directory': os.path.isdir(item_path),
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else None
                })
        
        return jsonify(diagnostic)
        
    except Exception as e:
        print(f"❌ Error en diagnóstico de tiles: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 🗺️ SISTEMA DE DESCARGA Y CACHE DE TILES
def descargar_tile(url, path_local):
    """Descargar un tile y guardarlo localmente"""
    try:
        import requests
        os.makedirs(os.path.dirname(path_local), exist_ok=True)
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        with open(path_local, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Tile descargado: {path_local}")
        return True
    except Exception as e:
        print(f"❌ Error descargando tile {url}: {e}")
        return False

@app.route('/tiles/<provider>/<int:z>/<int:x>/<int:y>.<ext>')
def proxy_tile(provider, z, x, y, ext):
    """Proxy/Cache para tiles de mapas - evita problemas de CORS"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_cache_dir = os.path.join(base_dir, 'static', 'tiles', provider)
        tile_filename = f"{z}_{x}_{y}.{ext}"
        tile_path = os.path.join(tiles_cache_dir, tile_filename)
        
        # URLs de providers
        tile_urls = {
            'osm': f'https://tile.openstreetmap.org/{z}/{x}/{y}.{ext}',
            'satellite': f'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            'terrain': f'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.{ext}',
            'cartodb': f'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.{ext}'
        }
        
        # Verificar si el tile ya existe en cache
        if os.path.exists(tile_path):
            print(f"🎯 Sirviendo tile desde cache: {tile_filename}")
            return send_from_directory(tiles_cache_dir, tile_filename)
        
        # Si no existe, intentar descargarlo
        if provider in tile_urls:
            tile_url = tile_urls[provider]
            
            if descargar_tile(tile_url, tile_path):
                response = send_from_directory(tiles_cache_dir, tile_filename)
                response.headers['Cache-Control'] = 'public, max-age=86400'  # Cache 24h
                response.headers['Access-Control-Allow-Origin'] = '*'
                return response
        
        # Si falla la descarga, devolver error
        return jsonify({'error': f'Tile no disponible: {provider}/{z}/{x}/{y}.{ext}'}), 404
        
    except Exception as e:
        print(f"❌ Error en proxy de tiles: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tiles/clean_cache')
def clean_tiles_cache():
    """Limpiar cache de tiles descargados"""
    try:
        import shutil
        base_dir = os.path.dirname(os.path.abspath(__file__))
        tiles_cache_dir = os.path.join(base_dir, 'static', 'tiles')
        
        if os.path.exists(tiles_cache_dir):
            shutil.rmtree(tiles_cache_dir)
            print("🧹 Cache de tiles limpiado")
            return jsonify({'message': 'Cache de tiles limpiado exitosamente'})
        else:
            return jsonify({'message': 'No hay cache para limpiar'})
            
    except Exception as e:
        print(f"❌ Error limpiando cache: {e}")
        return jsonify({'error': str(e)}), 500

# �🔍 RUTA DE DEBUG: Verificar estado de node_modules
@app.route('/debug/node_modules')
def debug_node_modules_status():
    """Endpoint para diagnosticar el estado de node_modules en el servidor"""
    try:
        import subprocess
        import sys
        
        result = subprocess.run([sys.executable, 'debug_node_modules.py'], 
                              capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))
        
        output = result.stdout
        error = result.stderr
        
        html_output = f"""
        <html>
        <head><title>Debug node_modules</title></head>
        <body>
        <h1>🔍 Diagnóstico de node_modules</h1>
        <h2>Output:</h2>
        <pre>{output}</pre>
        {f'<h2>Errors:</h2><pre>{error}</pre>' if error else ''}
        <hr>
        <p>Timestamp: {datetime.now()}</p>
        </body>
        </html>
        """
        return html_output
    except Exception as e:
        return f"Error ejecutando diagnóstico: {e}", 500

# 🔧 RUTA DE FIX: Forzar instalación de dependencias Node.js
@app.route('/debug/install_dependencies')
def force_install_dependencies():
    """Endpoint para forzar la instalación de dependencias Node.js"""
    try:
        import subprocess
        import sys
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        html_output = f"""
        <html>
        <head><title>Instalación Dependencias Node.js</title></head>
        <body>
        <h1>🚀 Forzando Instalación de Dependencias Node.js</h1>
        <p>Directorio: {base_dir}</p>
        <h2>Proceso de Instalación:</h2>
        <pre>
"""
        
        # Lista de comandos a ejecutar
        comandos = [
            ['npm', '--version'],
            ['node', '--version'],
            ['npm', 'install', '--no-optional', '--production=false'],
            ['npm', 'install', 'jquery@3.7.1', '--force'],
            ['npm', 'install', 'bootstrap@4.5.2', '--force'],
            ['npm', 'install', 'leaflet@1.9.4', '--force'],
            ['npm', 'install', 'jsplumb@2.15.6', '--force'],
            ['npm', 'install', '@fortawesome/fontawesome-free', '--force'],
            ['npm', 'install', 'socket.io-client', '--force'],
            ['npm', 'install', 'chart.js', '--force']
        ]
        
        for i, cmd in enumerate(comandos, 1):
            try:
                print(f"🔧 [{i}/{len(comandos)}] Ejecutando: {' '.join(cmd)}")
                html_output += f"[{i}/{len(comandos)}] Ejecutando: {' '.join(cmd)}\n"
                
                result = subprocess.run(
                    cmd, 
                    cwd=base_dir, 
                    capture_output=True, 
                    text=True, 
                    timeout=120
                )
                
                if result.returncode == 0:
                    html_output += f"✅ ÉXITO: {cmd[0]}\n"
                    if result.stdout.strip():
                        html_output += f"Output: {result.stdout[:500]}...\n"
                else:
                    html_output += f"❌ ERROR: {cmd[0]}\n"
                    if result.stderr.strip():
                        html_output += f"Error: {result.stderr[:500]}...\n"
                        
                html_output += "---\n"
                
            except subprocess.TimeoutExpired:
                html_output += f"⏰ TIMEOUT: {' '.join(cmd)}\n---\n"
            except Exception as e:
                html_output += f"❌ EXCEPCIÓN: {' '.join(cmd)} - {e}\n---\n"
        
        # Verificar instalación final
        html_output += "\n🔍 VERIFICACIÓN FINAL:\n"
        node_modules_path = os.path.join(base_dir, 'node_modules')
        
        if os.path.exists(node_modules_path):
            deps_criticas = ['jquery', 'bootstrap', 'leaflet', 'jsplumb']
            for dep in deps_criticas:
                dep_path = os.path.join(node_modules_path, dep)
                if os.path.exists(dep_path):
                    html_output += f"✅ {dep}: INSTALADO\n"
                else:
                    html_output += f"❌ {dep}: FALTA\n"
        else:
            html_output += "❌ node_modules no existe\n"
        
        html_output += f"""
        </pre>
        <hr>
        <p>Timestamp: {datetime.now()}</p>
        <p><a href="/debug/node_modules">📋 Ver Diagnóstico</a></p>
        </body>
        </html>
        """
        
        return html_output
        
    except Exception as e:
        return f"""
        <html>
        <head><title>Error Instalación</title></head>
        <body>
        <h1>❌ Error en Instalación</h1>
        <pre>{str(e)}</pre>
        <p><a href="/debug/node_modules">📋 Ver Diagnóstico</a></p>
        </body>
        </html>
        """, 500

# ✅ CRÍTICO: Rutas específicas para JavaScript
@app.route('/Client/js/<path:filename>')
def serve_javascript(filename):
    """Servir archivos JavaScript con content-type correcto"""
    from flask import Response
    try:
        js_dir = os.path.join('.', 'Client', 'js')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS {filename}: {e}")
        return f"console.error('Error loading {filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

# ✅ NUEVO: Rutas relativas para JavaScript (sin /Client prefix)
@app.route('/js/<path:filename>')
def serve_javascript_relative(filename):
    """Servir archivos JavaScript con rutas relativas"""
    from flask import Response
    try:
        js_dir = os.path.join('.', 'Client', 'js')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS relativo {filename}: {e}")
        return f"console.error('Error loading {filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

# ✅ CRÍTICO: Rutas específicas para carpetas JS que usa el frontend HTML directo
@app.route('/js/common/<path:filename>')
def serve_js_common(filename):
    """Servir archivos JavaScript de js/common/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'common')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS common {filename}: {e}")
        return f"console.error('Error loading js/common/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/js/core/<path:filename>')
def serve_js_core_direct(filename):
    """Servir archivos JavaScript de js/core/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'core')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS core {filename}: {e}")
        return f"console.error('Error loading js/core/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/js/utils/<path:filename>')
def serve_js_utils_direct(filename):
    """Servir archivos JavaScript de js/utils/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'utils')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS utils {filename}: {e}")
        return f"console.error('Error loading js/utils/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/js/modules/<path:filename>')
def serve_js_modules_direct(filename):
    """Servir archivos JavaScript de js/modules/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'modules')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo JS modules {filename}: {e}")
        return f"console.error('Error loading js/modules/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

# ✅ CRÍTICO: Rutas específicas para carpetas JS que usa Bootstrap
@app.route('/core/<path:filename>')
def serve_core_js(filename):
    """Servir archivos JavaScript de core/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'core')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo core JS {filename}: {e}")
        return f"console.error('Error loading core/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/utils/<path:filename>')
def serve_utils_js(filename):
    """Servir archivos JavaScript de utils/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'utils')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo utils JS {filename}: {e}")
        return f"console.error('Error loading utils/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/infrastructure/<path:filename>')
def serve_infrastructure_js(filename):
    """Servir archivos JavaScript de infrastructure/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'infrastructure')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo infrastructure JS {filename}: {e}")
        return f"console.error('Error loading infrastructure/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/services/<path:filename>')
def serve_services_js(filename):
    """Servir archivos JavaScript de services/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'services')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo services JS {filename}: {e}")
        return f"console.error('Error loading services/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/common/<path:filename>')
def serve_common_js(filename):
    """Servir archivos JavaScript de common/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'common')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo common JS {filename}: {e}")
        return f"console.error('Error loading common/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/handlers/<path:filename>')
def serve_handlers_js(filename):
    """Servir archivos JavaScript de handlers/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'handlers')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo handlers JS {filename}: {e}")
        return f"console.error('Error loading handlers/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/modules/<path:filename>')
def serve_modules_js(filename):
    """Servir archivos JavaScript de modules/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'modules')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo modules JS {filename}: {e}")
        return f"console.error('Error loading modules/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/ui/<path:filename>')
def serve_ui_js(filename):
    """Servir archivos JavaScript de ui/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'ui')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo ui JS {filename}: {e}")
        return f"console.error('Error loading ui/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/workers/<path:filename>')
def serve_workers_js(filename):
    """Servir archivos JavaScript de workers/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'workers')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo workers JS {filename}: {e}")
        return f"console.error('Error loading workers/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

@app.route('/Test/<path:filename>')
def serve_test_js(filename):
    """Servir archivos JavaScript de Test/"""
    try:
        js_dir = os.path.join('.', 'Client', 'js', 'Test')
        response = send_from_directory(js_dir, filename)
        response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo Test JS {filename}: {e}")
        return f"console.error('Error loading Test/{filename}: {e}');", 500, {'Content-Type': 'application/javascript'}

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

# ✅ NUEVAS: Rutas relativas para archivos estáticos
@app.route('/css/<path:filename>')
def serve_css_relative(filename):
    """Servir archivos CSS con rutas relativas"""
    try:
        css_dir = os.path.join('.', 'Client', 'css')
        response = send_from_directory(css_dir, filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo CSS relativo {filename}: {e}")
        return f"/* Error loading {filename}: {e} */", 404, {'Content-Type': 'text/css'}

# ✅ CRÍTICO: Rutas específicas para carpetas CSS que usa el frontend
@app.route('/css/common/<path:filename>')
def serve_css_common(filename):
    """Servir archivos CSS de common/"""
    try:
        css_dir = os.path.join('.', 'Client', 'css', 'common')
        response = send_from_directory(css_dir, filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo CSS common {filename}: {e}")
        return f"/* Error loading common/{filename}: {e} */", 404, {'Content-Type': 'text/css'}

@app.route('/css/modules/<path:filename>')
def serve_css_modules(filename):
    """Servir archivos CSS de modules/"""
    try:
        css_dir = os.path.join('.', 'Client', 'css', 'modules')
        response = send_from_directory(css_dir, filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo CSS modules {filename}: {e}")
        return f"/* Error loading modules/{filename}: {e} */", 404, {'Content-Type': 'text/css'}

@app.route('/css/legacy/<path:filename>')
def serve_css_legacy(filename):
    """Servir archivos CSS de legacy/"""
    try:
        css_dir = os.path.join('.', 'Client', 'css', 'legacy')
        response = send_from_directory(css_dir, filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo CSS legacy {filename}: {e}")
        return f"/* Error loading legacy/{filename}: {e} */", 404, {'Content-Type': 'text/css'}

@app.route('/css/fixes/<path:filename>')
def serve_css_fixes(filename):
    """Servir archivos CSS de fixes/"""
    try:
        css_dir = os.path.join('.', 'Client', 'css', 'fixes')
        response = send_from_directory(css_dir, filename)
        response.headers['Content-Type'] = 'text/css; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo CSS fixes {filename}: {e}")
        return f"/* Error loading fixes/{filename}: {e} */", 404, {'Content-Type': 'text/css'}

@app.route('/image/<path:filename>')
def serve_images_relative(filename):
    """Servir archivos de imagen con rutas relativas"""
    try:
        image_dir = os.path.join('.', 'Client', 'image')
        return send_from_directory(image_dir, filename)
    except Exception as e:
        print(f"❌ Error sirviendo imagen relativa {filename}: {e}")
        return f"Image not found: {filename}", 404

@app.route('/Libs/<path:filename>')
def serve_libs_relative(filename):
    """Servir librerías con rutas relativas"""
    try:
        libs_dir = os.path.join('.', 'Client', 'Libs')
        response = send_from_directory(libs_dir, filename)
        if filename.endswith('.js'):
            response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        print(f"❌ Error sirviendo lib relativa {filename}: {e}")
        if filename.endswith('.js'):
            return f"console.error('Error loading {filename}: {e}');", 404, {'Content-Type': 'application/javascript'}
        return f"Library not found: {filename}", 404

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
        base_url = 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/'
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
    """Endpoint para obtener tiles desde GitHub Releases - CORREGIDO"""
    try:
        data = request.json
        provincia = data.get('provincia')
        tile_filename = data.get('tile_filename')
        
        if not all([provincia, tile_filename]):
            return jsonify({"success": False, "message": "Faltan parámetros requeridos"}), 400
        
        # ✅ CORREGIDO: Responder que el tile debe cargarse desde GitHub Releases
        # Los datos están en releases, no en archivos locales
        github_url = f"https://github.com/Ehr051/MAIRA-4.0/releases/download/tiles-data/{provincia}/{tile_filename}"
        
        return jsonify({
            "success": True, 
            "message": "Usar GitHub Releases",
            "github_url": github_url,
            "path": f"/{provincia}/{tile_filename}"
        })
        
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
        base_path = "https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/"
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
                cursor.execute("UPDATE usuarios SET is_online = %s WHERE id = %s", (False, user_id))
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
                cursor.execute("UPDATE usuarios SET is_online = %s WHERE id = %s", (True, user_id))
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
                VALUES (%s, %s, %s, %s, %s)
            """, (partida_id, creador_id, 'sin_equipo', False, True))
            
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
                VALUES (%s, %s, %s, %s, %s)
            """, (partida['id'], user_id, 'sin_equipo', False, False))
            
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
    codigo_partida = data.get('partidaCodigo') or sala
    
    # Actualizar estadísticas
    actualizar_estadisticas(codigo_partida, 'sectorConfirmado')
    
    emit('sectorConfirmado', data, room=sala)

@socketio.on('estadoActual')
def estado_actual(data):
    emit('estadoActual', data)

@socketio.on('unidadDesplegada')
def unidad_desplegada(data):
    sala = data.get('sala', 'general')
    emit('unidadDesplegada', data, room=sala)

@socketio.on('crearOperacionGB')
def crear_operacion_gb(data, callback=None):
    try:
        print("🎖️ [DEBUG] Iniciando creación de operación GB")
        print(f"📥 [DEBUG] Datos recibidos del frontend: {json.dumps(data, indent=2)}")
        print(f"📞 [DEBUG] Callback recibido: {callback is not None}")
        
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        creador = data.get('creador', 'Desconocido')
        
        print(f"🔍 [DEBUG] Datos extraídos - Nombre: '{nombre}', Descripción: '{descripcion}', Creador: '{creador}'")
        
        if not nombre:
            print("❌ [DEBUG] Error: Nombre de operación faltante")
            if callback:
                callback({'error': 'Nombre de operación requerido'})
            else:
                emit('error', {'mensaje': 'Nombre de operación requerido'})
            return

        codigo_operacion = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        estado = 'preparacion'
        fecha_creacion = datetime.now()
        
        print(f"🏷️ [DEBUG] Código generado: {codigo_operacion}, Estado: {estado}")

        conn = get_db_connection()
        if conn is None:
            print("❌ [DEBUG] Error: No se pudo establecer conexión con la base de datos")
            if callback:
                callback({'error': 'Error de conexión a la base de datos'})
            else:
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
                    VALUES (%s, %s, %s, %s, %s)
                """, (operacion_id, creador_id, 'director', False, True))
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
            
            # Responder al callback si existe
            if callback:
                print("📞 [DEBUG] Respondiendo vía callback")
                callback({'operacion': operacion})
            else:
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
            if callback:
                callback({'error': f'Error en la base de datos: {str(e)}'})
            else:
                emit('error', {'mensaje': f'Error en la base de datos: {str(e)}'})
        finally:
            cursor.close()
            conn.close()
            print("🔌 [DEBUG] Conexión a BD cerrada")

    except Exception as e:
        print(f"❌ [DEBUG] Error general al crear operación GB: {e}")
        print(f"📊 [DEBUG] Tipo de error: {type(e).__name__}")
        print(f"📄 [DEBUG] Detalles del error: {str(e)}")
        if callback:
            callback({'error': f'Error interno: {str(e)}'})
        else:
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
                VALUES (%s, %s, %s, %s, %s)
            """, (operacion['id'], user_id, equipo, False, False))
            
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
    codigo_partida = data.get('partidaCodigo') or sala
    
    # Actualizar estadísticas
    actualizar_estadisticas(codigo_partida, 'cambioFase')
    
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
                VALUES (%s, %s, %s, %s, %s)
            """, (partida_id, usuario_id, 'sin_equipo', False, False))
            
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


# ==========================================
# CONFIGURACIÓN DE INICIO
# ==========================================

# ================================
# DESCARGA E INSTALACIÓN DEL DETECTOR DE GESTOS
# ================================

@app.route('/api/download-gesture-detector')
def download_gesture_detector():
    """Descargar el detector de gestos para instalación local"""
    try:
        import zipfile
        import io
        from flask import send_file
        
        # Crear archivo ZIP en memoria
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Agregar detectorGestos.py
            detector_path = os.path.join('Server', 'detectorGestos.py')
            if os.path.exists(detector_path):
                zip_file.write(detector_path, 'detectorGestos.py')
            
            # Agregar requirements con dependencias por SO
            requirements = """# MAIRA Detector de Gestos - Dependencias
                opencv-python>=4.5.0
                mediapipe>=0.8.0
                numpy>=1.20.0
                pyautogui>=0.9.52
                websockets>=10.0
                requests>=2.25.0

                # Dependencias adicionales para Windows (opcional)
                # pywin32>=227
                # winshell>=0.6

                # Dependencias adicionales para macOS (opcional)  
                # pyobjc>=7.0

                # Dependencias adicionales para Linux (opcional)
                # python-xlib>=0.29"""
            zip_file.writestr('requirements.txt', requirements)
            
            # Agregar launcher básico
            launcher = create_simple_launcher()
            zip_file.writestr('maira_gestos.py', launcher)
            
            # Agregar archivos de inicio por sistema operativo
            # Archivo .bat para Windows
            bat_content = '''@echo off
echo ========================================
echo    MAIRA Detector de Gestos - Windows
echo ========================================
cd /d "%~dp0"
python maira_gestos.py
pause'''
            zip_file.writestr('iniciar_gestos.bat', bat_content)
            
            # Archivo .sh para macOS/Linux
            sh_content = '''#!/bin/bash
echo "========================================"
echo "   MAIRA Detector de Gestos - Unix"
echo "========================================"
cd "$(dirname "$0")"
python3 maira_gestos.py
read -p "Presiona ENTER para continuar..."'''
            zip_file.writestr('iniciar_gestos.sh', sh_content)
            
            # Agregar README actualizado
            readme = """# MAIRA Detector de Gestos

## 🚀 Instalación Rápida:

### Windows:
1. Ejecuta: iniciar_gestos.bat
2. Si no funciona: pip install -r requirements.txt && python maira_gestos.py

### macOS/Linux:
1. Ejecuta: chmod +x iniciar_gestos.sh && ./iniciar_gestos.sh
2. Si no funciona: pip3 install -r requirements.txt && python3 maira_gestos.py

## 🎮 Modos Disponibles:
- **Pantalla**: Control directo del escritorio
- **Mesa**: Con detección automática de área de proyección
- **Web**: Conectar con MAIRA online

## 🔧 Modo Mesa (Nuevo):
- Detección automática del área de proyección
- Recuadro verde muestra el área activa
- Solo procesa gestos dentro del área
- Mapeo automático a coordenadas de pantalla"""
            zip_file.writestr('README.txt', readme)
        
        zip_buffer.seek(0)
        
        return send_file(
            io.BytesIO(zip_buffer.read()),
            mimetype='application/zip',
            as_attachment=True,
            download_name='MAIRA_Detector_Gestos.zip'
        )
        
    except Exception as e:
        print(f"Error generando descarga: {e}")
        return jsonify({'error': str(e)}), 500

def create_simple_launcher():
    """Crear launcher simplificado para el detector de gestos"""
    return '''#!/usr/bin/env python3
import sys
import os
import webbrowser
import platform
import subprocess
from pathlib import Path

# Agregar directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("🤚 MAIRA Detector de Gestos")
print("=" * 50)

# Importar detector de gestos
try:
    from detectorGestos import DetectorGestos
except ImportError:
    print("❌ Error: No se pudo importar detectorGestos.py")
    print("📦 Instalando dependencias...")
    deps = ['opencv-python', 'mediapipe', 'numpy', 'pyautogui', 'websockets', 'requests']
    for dep in deps:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
            print(f"✅ {dep} instalado")
        except:
            print(f"❌ Error instalando {dep}")
    
    try:
        from detectorGestos import DetectorGestos
    except ImportError:
        print("❌ No se pudo cargar el detector después de instalar dependencias")
        input("Presiona ENTER para salir...")
        sys.exit(1)

def main():
    print("\\n¿Cómo quieres usar el detector?\\n")
    print("1️⃣  Control de pantalla (para cualquier programa)")
    print("2️⃣  Mesa de proyección (para presentaciones)")  
    print("3️⃣  Conectar con MAIRA Web")
    print("0️⃣  Salir")
    print("\\n" + "-"*50)
    
    choice = input("\\nSelecciona una opción (0-3): ").strip()
    
    if choice == "1":
        print("\\n🖥️ Iniciando control de pantalla...")
        detector = DetectorGestos(modo="pantalla")
        detector.iniciar()
    elif choice == "2":
        print("\\n📽️ Iniciando modo mesa...")
        detector = DetectorGestos(modo="mesa")  
        detector.iniciar()
    elif choice == "3":
        print("\\n🌐 Conectando con MAIRA Web...")
        webbrowser.open("https://maira-production.onrender.com")
        print("\\n📋 Instrucciones:")
        print("   1. Espera a que MAIRA cargue")
        print("   2. Haz click en 'Control por Gestos' 🤚")
        print("   3. Regresa aquí cuando esté activado")
        input("\\nPresiona ENTER cuando hayas activado gestos en MAIRA...")
        detector = DetectorGestos(modo="pantalla")
        detector.iniciar()
    elif choice == "0":
        print("\\n👋 ¡Hasta luego!")
    else:
        print("\\n❌ Opción no válida")
        input("Presiona ENTER para intentar nuevamente...")
        main()

if __name__ == "__main__":
    main()
'''

# ==========================================
# RUTAS PARA SERVIR CSS PERSONALIZADOS
# ==========================================
@app.route('/Client/css/<path:filename>')
def serve_css(filename):
    """Servir archivos CSS personalizados"""
    try:
        css_path = os.path.join(app.root_path, 'Client', 'css', filename)
        print(f"🎨 Sirviendo CSS: {css_path}")
        
        if os.path.exists(css_path):
            return send_file(css_path, mimetype='text/css')
        else:
            print(f"❌ CSS no encontrado: {css_path}")
            return f"/* CSS no encontrado: {filename} */", 404
    except Exception as e:
        print(f"❌ Error sirviendo CSS {filename}: {str(e)}")
        return f"/* Error cargando CSS: {str(e)} */", 500

# =============================================
# EVENTOS FALTANTES MIGRADOS DE SERVERHTTPS.PY
# =============================================

@socketio.on('asignarDirectorTemporal')
def handle_asignar_director_temporal(data):
    """Asigna director temporal para partidas"""
    try:
        codigo_partida = data.get('partidaCodigo')
        jugador_id = data.get('jugadorId')
        
        if not codigo_partida or not jugador_id:
            emit('error', {'mensaje': 'Datos incompletos para asignar director'})
            return
            
        print(f"📋 Asignando director temporal: {jugador_id} en partida {codigo_partida}")
        
        # Emitir a toda la partida
        emit('directorAsignado', {
            'director': jugador_id,
            'temporal': True,
            'partidaCodigo': codigo_partida,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error en asignarDirectorTemporal: {e}")
        emit('error', {'mensaje': f'Error al asignar director: {str(e)}'})

@socketio.on('finTurno')
def handle_fin_turno(datos):
    """Maneja la finalización de turnos"""
    try:
        partidaCodigo = datos.get('partidaCodigo')
        jugadorId = datos.get('jugadorId')
        
        if not partidaCodigo:
            emit('error', {'mensaje': 'Código de partida faltante en finTurno'})
            return
            
        print(f"🏁 Fin de turno: {jugadorId} en partida {partidaCodigo}")
        
        # Emitir a todos los jugadores de la partida
        emit('finTurno', {
            **datos,
            'timestamp': datetime.now().isoformat()
        }, room=partidaCodigo)
        
    except Exception as e:
        print(f"❌ Error en finTurno: {e}")
        emit('error', {'mensaje': f'Error al finalizar turno: {str(e)}'}) 

@socketio.on('salirSalaEspera')
def handle_salir_sala_espera(data):
    """Permite salir de la sala de espera"""
    try:
        codigo_partida = data.get('codigo')
        usuario_id = data.get('userId')
        
        if not codigo_partida or not usuario_id:
            emit('error', {'mensaje': 'Datos incompletos para salir de sala'})
            return
            
        print(f"🚪 Jugador {usuario_id} saliendo de sala de espera: {codigo_partida}")
        
        # Emitir a la partida que el jugador salió
        emit('jugadorSalio', {
            'userId': usuario_id,
            'codigo': codigo_partida,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
        # Confirmar al jugador
        emit('salaEsperaAbandonada', {
            'codigo': codigo_partida,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error en salirSalaEspera: {e}")
        emit('error', {'mensaje': f'Error al salir de sala: {str(e)}'})

@socketio.on('reconectarAPartida')
def handle_reconectar_partida(data):
    """Permite reconectar a una partida existente"""
    try:
        codigo_partida = data.get('codigo')
        usuario_id = data.get('userId')
        
        if not codigo_partida or not usuario_id:
            emit('error', {'mensaje': 'Datos incompletos para reconexión'})
            return
            
        print(f"🔄 Reconectando jugador {usuario_id} a partida {codigo_partida}")
        
        # Unir a la sala de la partida
        join_room(codigo_partida)
        
        # Emitir reconexión exitosa
        emit('reconexionExitosa', {
            'codigo': codigo_partida,
            'userId': usuario_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar a otros jugadores
        emit('jugadorReconectado', {
            'userId': usuario_id,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida, skip_sid=request.sid)
        
    except Exception as e:
        print(f"❌ Error en reconectarAPartida: {e}")
        emit('error', {'mensaje': f'Error al reconectar: {str(e)}'})

@socketio.on('zonaDespliegueDefinida')
def handle_zona_despliegue_definida(data):
    """Maneja la definición de zonas de despliegue"""
    try:
        codigo_partida = data.get('partidaCodigo')
        zona = data.get('zona')
        
        if not codigo_partida or not zona:
            emit('error', {'mensaje': 'Datos incompletos para zona de despliegue'})
            return
            
        print(f"🎯 Zona de despliegue definida en partida {codigo_partida}")
        
        # Emitir a toda la partida
        emit('zonaDespliegueDefinida', {
            **data,
            'timestamp': datetime.now().isoformat()
        }, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error en zonaDespliegueDefinida: {e}")
        emit('error', {'mensaje': f'Error al definir zona: {str(e)}'})

@socketio.on('mensajeMultimedia')
def handle_mensaje_multimedia(data):
    """Maneja mensajes multimedia (imágenes, audio, video)"""
    try:
        partida_codigo = data.get('partidaCodigo')
        tipo_multimedia = data.get('tipo')
        
        if not partida_codigo:
            emit('error', {'mensaje': 'Código de partida faltante para multimedia'})
            return
            
        print(f"🎨 Mensaje multimedia ({tipo_multimedia}) en partida {partida_codigo}")
        
        # Emitir a toda la partida
        emit('mensajeMultimedia', {
            **data,
            'timestamp': datetime.now().isoformat()
        }, room=partida_codigo)
        
    except Exception as e:
        print(f"❌ Error en mensajeMultimedia: {e}")
        emit('error', {'mensaje': f'Error al enviar multimedia: {str(e)}'})

@socketio.on('cambiarSala')
def handle_cambiar_sala(data):
    """Permite cambiar de sala de chat"""
    try:
        nueva_sala = data.get('sala')
        
        if not nueva_sala:
            emit('error', {'mensaje': 'Nombre de sala faltante'})
            return
            
        print(f"🔄 Cambiando a sala: {nueva_sala}")
        
        # Dejar salas anteriores (excepto la del propio socket)
        for room in request.sid:
            if room != request.sid:
                leave_room(room)
        
        # Unirse a nueva sala
        join_room(nueva_sala)
        
        emit('salaActualizada', {
            'sala': nueva_sala,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error en cambiarSala: {e}")
        emit('error', {'mensaje': f'Error al cambiar sala: {str(e)}'})

# =============================================
# SISTEMA DE ESTADÍSTICAS PERDIDO - MIGRADO DE NODE.JS
# =============================================

# Variables globales para estadísticas
estadisticas_partidas = {}

def inicializar_estadisticas(codigo_partida):
    """Inicializa estadísticas para una partida nueva"""
    if codigo_partida not in estadisticas_partidas:
        estadisticas_partidas[codigo_partida] = {
            'conexiones': 0,
            'cambiosFase': 0,
            'elementosCreados': 0,
            'elementosMovidos': 0,
            'elementosEliminados': 0,
            'sectoresConfirmados': 0,
            'zonasConfirmadas': 0,
            'mensajesChat': 0,
            'cambiosTurno': 0,
            'finesTurno': 0,
            'jugadoresListos': 0,
            'errores': 0,
            'ultimoEvento': None,
            'inicioPartida': datetime.now().isoformat()
        }

def actualizar_estadisticas(codigo_partida, tipo_evento):
    """Actualiza estadísticas de una partida"""
    try:
        if not codigo_partida:
            print('[ERROR] Código de partida no proporcionado para estadísticas')
            return
            
        # Inicializar si no existe
        inicializar_estadisticas(codigo_partida)
        
        stats = estadisticas_partidas[codigo_partida]
        
        # Actualizar contador según tipo de evento
        if tipo_evento == 'conexion':
            stats['conexiones'] += 1
        elif tipo_evento == 'cambioFase':
            stats['cambiosFase'] += 1
        elif tipo_evento == 'elementoCreado':
            stats['elementosCreados'] += 1
        elif tipo_evento == 'elementoMovido':
            stats['elementosMovidos'] += 1
        elif tipo_evento == 'elementoEliminado':
            stats['elementosEliminados'] += 1
        elif tipo_evento == 'sectorConfirmado':
            stats['sectoresConfirmados'] += 1
        elif tipo_evento == 'zonaConfirmada':
            stats['zonasConfirmadas'] += 1
        elif tipo_evento == 'mensajeChat':
            stats['mensajesChat'] += 1
        elif tipo_evento == 'cambioTurno':
            stats['cambiosTurno'] += 1
        elif tipo_evento == 'finTurno':
            stats['finesTurno'] += 1
        elif tipo_evento == 'jugadorListo':
            stats['jugadoresListos'] += 1
        elif tipo_evento == 'error':
            stats['errores'] += 1
        else:
            print(f'[WARN] Tipo de evento desconocido: {tipo_evento}')
            return
            
        # Actualizar último evento
        stats['ultimoEvento'] = {
            'tipo': tipo_evento,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f'[STATS] {codigo_partida}: {tipo_evento} -> {stats[tipo_evento.replace("o", "os") if tipo_evento.endswith("o") else tipo_evento + "s"]}')
        
    except Exception as e:
        print(f'[ERROR] Error actualizando estadísticas: {e}')

def limpiar_partida_inactiva(codigo_partida):
    """Limpia partidas inactivas y sus estadísticas"""
    try:
        if codigo_partida in estadisticas_partidas:
            del estadisticas_partidas[codigo_partida]
            print(f'[CLEAN] Estadísticas limpiadas para partida: {codigo_partida}')
    except Exception as e:
        print(f'[ERROR] Error limpiando partida: {e}')

@socketio.on('obtenerEstadisticasPartida')
def handle_obtener_estadisticas(data):
    """Obtiene estadísticas de una partida específica"""
    try:
        codigo_partida = data.get('codigo')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida faltante'})
            return
            
        stats = estadisticas_partidas.get(codigo_partida, {})
        
        emit('estadisticasPartida', {
            'codigo': codigo_partida,
            'estadisticas': stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        emit('error', {'mensaje': f'Error al obtener estadísticas: {str(e)}'})

# =============================================
# FUNCIÓN AUXILIAR - NORMALIZACIÓN DE IDs
# =============================================

def normalizar_ids(data):
    """
    Normaliza IDs entre formatos cliente (userId, jugadorId) y servidor (user_id, jugador_id)
    """
    normalized = data.copy() if isinstance(data, dict) else {}
    
    # Mapeo de normalización
    id_mappings = [
        ('userId', 'user_id'),
        ('jugadorId', 'jugador_id'),
        ('amigoId', 'amigo_id'),
        ('usuarioId', 'usuario_id'),
        ('elementoId', 'elemento_id'),
        ('atacanteId', 'atacante_id'),
        ('objetivoId', 'objetivo_id')
    ]
    
    # Aplicar normalizaciones
    for client_key, server_key in id_mappings:
        if client_key in normalized:
            normalized[server_key] = normalized[client_key]
            # Mantener ambos para compatibilidad
            
        # También el caso inverso para compatibilidad completa
        if server_key in normalized and client_key not in normalized:
            normalized[client_key] = normalized[server_key]
    
    return normalized

# =============================================
# EVENTOS CRÍTICOS FALTANTES - GAMING/ACCIONES
# =============================================

@socketio.on('accionJuego')
def manejar_accion_juego(data):
    """Maneja acciones de juego en tiempo real"""
    try:
        # Normalizar IDs para compatibilidad cliente-servidor
        data = normalizar_ids(data)
        
        codigo_partida = data.get('codigo')
        jugador_id = data.get('jugadorId') or data.get('jugador_id')
        accion = data.get('accion')
        
        if not all([codigo_partida, jugador_id, accion]):
            emit('error', {'mensaje': 'Datos de acción incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'accion_juego', {
            'jugador_id': jugador_id,
            'tipo_accion': accion.get('tipo'),
            'timestamp': datetime.now().isoformat()
        })
        
        # Retransmitir a otros jugadores en la partida
        emit('accionJuegoRealizada', data, room=codigo_partida, include_self=False)
        emit('accionConfirmada', {'exito': True}, room=request.sid)
        
    except Exception as e:
        print(f"❌ Error en acción de juego: {e}")
        emit('error', {'mensaje': f'Error procesando acción: {str(e)}'})

@socketio.on('moverElemento')
def manejar_mover_elemento(data):
    """Maneja movimiento de elementos en el mapa"""
    try:
        codigo_partida = data.get('codigo')
        elemento_id = data.get('elementoId')
        nueva_posicion = data.get('posicion')
        jugador_id = data.get('jugadorId')
        
        if not all([codigo_partida, elemento_id, nueva_posicion]):
            emit('error', {'mensaje': 'Datos de movimiento incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'elemento_movido', {
            'elemento_id': elemento_id,
            'jugador_id': jugador_id,
            'posicion': nueva_posicion,
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar movimiento a todos los jugadores
        emit('elementoMovido', data, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error moviendo elemento: {e}")
        emit('error', {'mensaje': f'Error al mover elemento: {str(e)}'})

@socketio.on('elementoEquipo')
def manejar_elemento_equipo(data):
    """Maneja elementos específicos del equipo"""
    try:
        codigo_partida = data.get('codigo')
        equipo = data.get('equipo')
        elemento = data.get('elemento')
        
        if not all([codigo_partida, equipo, elemento]):
            emit('error', {'mensaje': 'Datos de elemento de equipo incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'elemento_equipo', {
            'equipo': equipo,
            'elemento_id': elemento.get('id'),
            'timestamp': datetime.now().isoformat()
        })
        
        # Enviar solo al equipo específico
        emit('elementoEquipoActualizado', data, room=f'equipo_{equipo}')
        
    except Exception as e:
        print(f"❌ Error con elemento de equipo: {e}")
        emit('error', {'mensaje': f'Error procesando elemento de equipo: {str(e)}'})

@socketio.on('elementoGlobal')
def manejar_elemento_global(data):
    """Maneja elementos globales visibles para todos"""
    try:
        codigo_partida = data.get('codigo')
        elemento = data.get('elemento')
        
        if not all([codigo_partida, elemento]):
            emit('error', {'mensaje': 'Datos de elemento global incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'elemento_global', {
            'elemento_id': elemento.get('id'),
            'tipo': elemento.get('tipo'),
            'timestamp': datetime.now().isoformat()
        })
        
        # Enviar a todos en la partida
        emit('elementoGlobalActualizado', data, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error con elemento global: {e}")
        emit('error', {'mensaje': f'Error procesando elemento global: {str(e)}'})

@socketio.on('iniciarAtaque')
def manejar_iniciar_ataque(data):
    """Maneja inicio de ataques en combate"""
    try:
        codigo_partida = data.get('codigo')
        atacante_id = data.get('atacanteId')
        objetivo_id = data.get('objetivoId')
        jugador_id = data.get('jugadorId')
        
        if not all([codigo_partida, atacante_id, objetivo_id]):
            emit('error', {'mensaje': 'Datos de ataque incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'ataque_iniciado', {
            'atacante_id': atacante_id,
            'objetivo_id': objetivo_id,
            'jugador_id': jugador_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar inicio de ataque
        emit('ataqueIniciado', data, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error iniciando ataque: {e}")
        emit('error', {'mensaje': f'Error al iniciar ataque: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - GESTIÓN DE ESTADOS
# =============================================

@socketio.on('guardarEstado')
def manejar_guardar_estado(data):
    """Guarda el estado actual del juego"""
    try:
        # Normalizar IDs para compatibilidad cliente-servidor
        data = normalizar_ids(data)
        
        codigo_partida = data.get('codigo')
        estado = data.get('estado')
        jugador_id = data.get('jugadorId') or data.get('jugador_id')
        
        if not all([codigo_partida, estado]):
            emit('error', {'mensaje': 'Datos de estado incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'estado_guardado', {
            'jugador_id': jugador_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Confirmar guardado
        emit('estadoGuardado', {'exito': True, 'timestamp': datetime.now().isoformat()})
        
    except Exception as e:
        print(f"❌ Error guardando estado: {e}")
        emit('error', {'mensaje': f'Error al guardar estado: {str(e)}'})

@socketio.on('solicitarEstado')
def manejar_solicitar_estado(data):
    """Solicita el estado actual del juego"""
    try:
        codigo_partida = data.get('codigo')
        jugador_id = data.get('jugadorId')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida faltante'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'estado_solicitado', {
            'jugador_id': jugador_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Enviar estado actual (simulado)
        emit('estadoActualizado', {
            'codigo': codigo_partida,
            'estado': 'activa',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error solicitando estado: {e}")
        emit('error', {'mensaje': f'Error al solicitar estado: {str(e)}'})

@socketio.on('solicitarEstadoPartida')
def manejar_solicitar_estado_partida(data):
    """Solicita estado específico de la partida"""
    try:
        codigo_partida = data.get('codigo')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida faltante'})
            return
        
        # Enviar estado de partida
        emit('estadoPartidaActual', {
            'codigo': codigo_partida,
            'estado': 'en_curso',
            'fase': 'combate',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error solicitando estado de partida: {e}")
        emit('error', {'mensaje': f'Error al solicitar estado de partida: {str(e)}'})

@socketio.on('obtenerInfoJugador')
def manejar_obtener_info_jugador(data):
    """Obtiene información del jugador"""
    try:
        # Normalizar IDs para compatibilidad cliente-servidor  
        data = normalizar_ids(data)
        
        jugador_id = data.get('jugadorId') or data.get('jugador_id')
        codigo_partida = data.get('codigo')
        
        if not jugador_id:
            emit('error', {'mensaje': 'ID de jugador faltante'})
            return
        
        # Simular información del jugador
        emit('infoJugadorActual', {
            'jugadorId': jugador_id,
            'codigo': codigo_partida,
            'estado': 'conectado',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo info de jugador: {e}")
        emit('error', {'mensaje': f'Error al obtener información del jugador: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - ELEMENTOS/POSICIONES
# =============================================

@socketio.on('actualizarElemento')
def manejar_actualizar_elemento(data):
    """Actualiza un elemento específico"""
    try:
        codigo_partida = data.get('codigo')
        elemento = data.get('elemento')
        
        if not all([codigo_partida, elemento]):
            emit('error', {'mensaje': 'Datos de elemento incompletos'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'elemento_actualizado', {
            'elemento_id': elemento.get('id'),
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar actualización
        emit('elementoActualizado', data, room=codigo_partida)
        
    except Exception as e:
        print(f"❌ Error actualizando elemento: {e}")
        emit('error', {'mensaje': f'Error al actualizar elemento: {str(e)}'})

@socketio.on('solicitarElementos')
def manejar_solicitar_elementos(data):
    """Solicita lista de elementos"""
    try:
        codigo_partida = data.get('codigo')
        operacion = data.get('operacion')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida faltante'})
            return
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'elementos_solicitados', {
            'operacion': operacion,
            'timestamp': datetime.now().isoformat()
        })
        
        # Enviar lista de elementos (simulada)
        emit('elementosDisponibles', {
            'codigo': codigo_partida,
            'elementos': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error solicitando elementos: {e}")
        emit('error', {'mensaje': f'Error al solicitar elementos: {str(e)}'})

@socketio.on('solicitarPosiciones')
def manejar_solicitar_posiciones(data):
    """Solicita posiciones de elementos"""
    try:
        operacion = data.get('operacion')
        codigo_partida = data.get('codigo')
        
        if not operacion:
            emit('error', {'mensaje': 'Operación faltante'})
            return
        
        # Enviar posiciones actuales
        emit('posicionesActuales', {
            'operacion': operacion,
            'posiciones': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error solicitando posiciones: {e}")
        emit('error', {'mensaje': f'Error al solicitar posiciones: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - CHAT/COMUNICACIÓN
# =============================================

@socketio.on('mensaje')
def manejar_mensaje_general(data):
    """Maneja mensajes generales"""
    try:
        mensaje = data.get('mensaje')
        usuario = data.get('usuario')
        sala = data.get('sala', 'general')
        
        if not mensaje:
            emit('error', {'mensaje': 'Mensaje vacío'})
            return
        
        # Enviar mensaje a la sala
        mensaje_completo = {
            'usuario': usuario,
            'mensaje': mensaje,
            'timestamp': datetime.now().isoformat(),
            'sala': sala
        }
        
        emit('mensajeRecibido', mensaje_completo, room=sala)
        
    except Exception as e:
        print(f"❌ Error enviando mensaje: {e}")
        emit('error', {'mensaje': f'Error al enviar mensaje: {str(e)}'})

@socketio.on('mensajePrivado')
def manejar_mensaje_privado(data):
    """Maneja mensajes privados entre jugadores"""
    try:
        destinatario = data.get('destinatario')
        mensaje = data.get('mensaje')
        remitente = data.get('remitente')
        
        if not all([destinatario, mensaje, remitente]):
            emit('error', {'mensaje': 'Datos de mensaje privado incompletos'})
            return
        
        # Enviar mensaje privado
        mensaje_privado = {
            'remitente': remitente,
            'mensaje': mensaje,
            'timestamp': datetime.now().isoformat(),
            'tipo': 'privado'
        }
        
        # Enviar al destinatario (usando socketID si está disponible)
        emit('mensajePrivadoRecibido', mensaje_privado, room=destinatario)
        
    except Exception as e:
        print(f"❌ Error enviando mensaje privado: {e}")
        emit('error', {'mensaje': f'Error al enviar mensaje privado: {str(e)}'})

@socketio.on('obtenerHistorialChat')
def manejar_obtener_historial_chat(data):
    """Obtiene historial de chat de una sala"""
    try:
        sala = data.get('sala', 'general')
        
        # Enviar historial (simulado)
        emit('historialChat', {
            'sala': sala,
            'mensajes': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo historial de chat: {e}")
        emit('error', {'mensaje': f'Error al obtener historial: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - AMIGOS/SOCIAL
# =============================================

@socketio.on('agregarAmigo')
def manejar_agregar_amigo(data):
    """Agrega un amigo a la lista"""
    try:
        amigo_id = data.get('amigoId')
        usuario_id = data.get('usuarioId')
        
        if not amigo_id:
            emit('error', {'mensaje': 'ID de amigo faltante'})
            return
        
        # Confirmar adición de amigo
        emit('amigoAgregado', {
            'amigoId': amigo_id,
            'exito': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error agregando amigo: {e}")
        emit('error', {'mensaje': f'Error al agregar amigo: {str(e)}'})

@socketio.on('eliminarAmigo')
def manejar_eliminar_amigo(data):
    """Elimina un amigo de la lista"""
    try:
        amigo_id = data.get('amigoId')
        usuario_id = data.get('usuarioId')
        
        if not amigo_id:
            emit('error', {'mensaje': 'ID de amigo faltante'})
            return
        
        # Confirmar eliminación de amigo
        emit('amigoEliminado', {
            'amigoId': amigo_id,
            'exito': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error eliminando amigo: {e}")
        emit('error', {'mensaje': f'Error al eliminar amigo: {str(e)}'})

@socketio.on('obtenerListaAmigos')
def manejar_obtener_lista_amigos():
    """Obtiene la lista de amigos del usuario"""
    try:
        # Enviar lista de amigos (simulada)
        emit('listaAmigos', {
            'amigos': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo lista de amigos: {e}")
        emit('error', {'mensaje': f'Error al obtener lista de amigos: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - PARTIDAS/SALA
# =============================================

@socketio.on('salirPartida')
def manejar_salir_partida(data):
    """Maneja salida de jugador de partida"""
    try:
        codigo_partida = data.get('codigo')
        usuario_id = data.get('userId')
        
        if not codigo_partida:
            emit('error', {'mensaje': 'Código de partida faltante'})
            return
        
        # Salir de la sala de la partida
        leave_room(codigo_partida)
        
        # Actualizar estadísticas
        actualizar_estadisticas(codigo_partida, 'jugador_salio', {
            'usuario_id': usuario_id,
            'timestamp': datetime.now().isoformat()
        })
        
        # Notificar a otros jugadores
        emit('jugadorSalio', {'userId': usuario_id}, room=codigo_partida, include_self=False)
        emit('salidaConfirmada', {'exito': True})
        
    except Exception as e:
        print(f"❌ Error saliendo de partida: {e}")
        emit('error', {'mensaje': f'Error al salir de partida: {str(e)}'})

@socketio.on('reconectarPartida')
def manejar_reconectar_partida(data):
    """Maneja reconexión a partida (alternativa a reconectarAPartida)"""
    try:
        codigo_partida = data.get('codigoPartida')
        usuario_id = data.get('userId')
        
        if not all([codigo_partida, usuario_id]):
            emit('error', {'mensaje': 'Datos de reconexión incompletos'})
            return
        
        # Unirse a la sala de la partida
        join_room(codigo_partida)
        
        emit('reconexionExitosa', {
            'codigo': codigo_partida,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error reconectando a partida: {e}")
        emit('error', {'mensaje': f'Error al reconectar: {str(e)}'})

@socketio.on('obtenerEstadoSala')
def manejar_obtener_estado_sala(data):
    """Obtiene el estado actual de una sala"""
    try:
        codigo = data.get('codigo')
        
        if not codigo:
            emit('error', {'mensaje': 'Código de sala faltante'})
            return
        
        emit('estadoSalaActual', {
            'codigo': codigo,
            'estado': 'activa',
            'jugadores': 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo estado de sala: {e}")
        emit('error', {'mensaje': f'Error al obtener estado de sala: {str(e)}'})

@socketio.on('invitarAmigo')
def manejar_invitar_amigo(data):
    """Invita un amigo a una partida"""
    try:
        amigo_id = data.get('amigoId')
        partida_codigo = data.get('partidaCodigo')
        
        if not all([amigo_id, partida_codigo]):
            emit('error', {'mensaje': 'Datos de invitación incompletos'})
            return
        
        # Enviar invitación
        emit('invitacionRecibida', {
            'partidaCodigo': partida_codigo,
            'timestamp': datetime.now().isoformat()
        }, room=amigo_id)
        
        emit('invitacionEnviada', {'exito': True})
        
    except Exception as e:
        print(f"❌ Error invitando amigo: {e}")
        emit('error', {'mensaje': f'Error al invitar amigo: {str(e)}'})

@socketio.on('obtenerTiempoServidor')
def manejar_obtener_tiempo_servidor(data):
    """Obtiene tiempo del servidor para sincronización"""
    try:
        codigo = data.get('codigo')
        
        emit('tiempoServidor', {
            'timestamp': datetime.now().isoformat(),
            'codigo': codigo
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo tiempo del servidor: {e}")
        emit('error', {'mensaje': f'Error al obtener tiempo: {str(e)}'})

@socketio.on('finalizarPartida')
def manejar_finalizar_partida():
    """Finaliza una partida completamente"""
    try:
        emit('partidaFinalizada', {
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error finalizando partida: {e}")
        emit('error', {'mensaje': f'Error al finalizar partida: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - OPERACIONES GB
# =============================================

@socketio.on('unirseOperacion')
def manejar_unirse_operacion(data):
    """Une a un jugador a una operación específica"""
    try:
        operacion = data.get('operacion')
        usuario_id = data.get('usuarioId')
        
        if not operacion:
            emit('error', {'mensaje': 'Operación faltante'})
            return
        
        # Unirse a la sala de la operación
        join_room(operacion)
        
        emit('operacionUnida', {
            'operacion': operacion,
            'exito': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error uniéndose a operación: {e}")
        emit('error', {'mensaje': f'Error al unirse a operación: {str(e)}'})

@socketio.on('salirOperacionGB')
def manejar_salir_operacion_gb(data):
    """Sale de una operación GB"""
    try:
        operacion = data.get('operacion')
        usuario_id = data.get('usuarioId')
        
        if not operacion:
            emit('error', {'mensaje': 'Operación faltante'})
            return
        
        # Salir de la sala de la operación
        leave_room(operacion)
        
        emit('operacionAbandonada', {
            'operacion': operacion,
            'exito': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error saliendo de operación GB: {e}")
        emit('error', {'mensaje': f'Error al salir de operación: {str(e)}'})

@socketio.on('solicitarEstadoElementos')
def manejar_solicitar_estado_elementos(data):
    """Solicita estado de elementos en una operación"""
    try:
        operacion = data.get('operacion')
        
        if not operacion:
            emit('error', {'mensaje': 'Operación faltante'})
            return
        
        emit('estadoElementosActual', {
            'operacion': operacion,
            'elementos': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error solicitando estado de elementos: {e}")
        emit('error', {'mensaje': f'Error al solicitar estado: {str(e)}'})

# =============================================
# EVENTOS CRÍTICOS FALTANTES - ROOMS/CONECTIVIDAD
# =============================================

@socketio.on('joinRoom')
def manejar_join_room(data):
    """Une a un usuario a una sala específica"""
    try:
        if isinstance(data, str):
            sala = data
        else:
            sala = data.get('sala') or data
        
        if sala:
            join_room(sala)
            emit('salaUnida', {'sala': sala})
        
    except Exception as e:
        print(f"❌ Error uniéndose a sala: {e}")
        emit('error', {'mensaje': f'Error al unirse a sala: {str(e)}'})

@socketio.on('leaveRoom')
def manejar_leave_room(data):
    """Sale de una sala específica"""
    try:
        if isinstance(data, str):
            sala = data
        else:
            sala = data.get('sala') or data
        
        if sala:
            leave_room(sala)
            emit('salaAbandonada', {'sala': sala})
        
    except Exception as e:
        print(f"❌ Error saliendo de sala: {e}")
        emit('error', {'mensaje': f'Error al salir de sala: {str(e)}'})

@socketio.on('heartbeat')
def manejar_heartbeat(data):
    """Maneja heartbeat para mantener conexión"""
    try:
        emit('heartbeatResponse', {
            'timestamp': datetime.now().isoformat(),
            'data': data
        })
        
    except Exception as e:
        print(f"❌ Error en heartbeat: {e}")

@socketio.on('ping')
def manejar_ping():
    """Responde a ping básico"""
    try:
        emit('pong', {'timestamp': datetime.now().isoformat()})
        
    except Exception as e:
        print(f"❌ Error en ping: {e}")

# =============================================
# EVENTOS CRÍTICOS FALTANTES - OTROS SISTEMAS
# =============================================

@socketio.on('listaElementos')
def manejar_lista_elementos(data):
    """Maneja solicitud de lista de elementos"""
    try:
        operacion = data.get('operacion')
        
        emit('elementosListados', {
            'operacion': operacion,
            'elementos': [],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error listando elementos: {e}")
        emit('error', {'mensaje': f'Error al listar elementos: {str(e)}'})

@socketio.on('obtenerUsuariosConectados')
def manejar_obtener_usuarios_conectados():
    """Obtiene lista de usuarios conectados"""
    try:
        emit('usuariosConectados', {
            'usuarios': [],
            'count': 0,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo usuarios conectados: {e}")
        emit('error', {'mensaje': f'Error al obtener usuarios: {str(e)}'})

@socketio.on('verificarEstructuraArchivos')
def manejar_verificar_estructura_archivos(data):
    """Verifica estructura de archivos del sistema"""
    try:
        emit('estructuraArchivos', {
            'verificado': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Error verificando estructura: {e}")
        emit('error', {'mensaje': f'Error al verificar estructura: {str(e)}'})

@socketio.on('unirse_operacion')
def manejar_unirse_operacion_alt(data):
    """Variante alternativa de unirseOperacion"""
    try:
        # Redirigir al handler principal
        manejar_unirse_operacion(data)
        
    except Exception as e:
        print(f"❌ Error en unirse_operacion: {e}")
        emit('error', {'mensaje': f'Error al unirse: {str(e)}'})

@app.route('/debug/css')
def debug_css():
    """Debug: listar todos los archivos CSS disponibles"""
    css_files = []
    css_dir = os.path.join(app.root_path, 'Client', 'css')
    
    for root, dirs, files in os.walk(css_dir):
        for file in files:
            if file.endswith('.css'):
                rel_path = os.path.relpath(os.path.join(root, file), css_dir)
                css_files.append(rel_path)
    
    return {
        'css_directory': css_dir,
        'css_files': css_files,
        'total_files': len(css_files)
    }

# 🧪 RUTA ESPECÍFICA PARA TEST DE TILES
@app.route('/test_tiles_v4.html')
def serve_test_tiles():
    """Servir página de test de tiles v4.0"""
    return send_from_directory('.', 'test_tiles_v4.html')

# 🚀 PROXY PARA GITHUB RELEASES v4.0 - SOLUCIÓN CORS
@app.route('/api/github-proxy/<path:asset_name>')
def github_proxy(asset_name):
    """Proxy para descargar assets de GitHub Release v4.0 sin problemas de CORS"""
    try:
        # URL base del release v4.0
        base_url = 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/'
        github_url = f"{base_url}{asset_name}"
        
        print(f"🔄 Proxy descargando: {github_url}")
        
        # Headers para simular navegador
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        # Descargar desde GitHub
        response = requests.get(github_url, headers=headers, timeout=30)
        
        if not response.ok:
            print(f"❌ Error descargando {asset_name}: {response.status_code}")
            return jsonify({'error': f'GitHub returned {response.status_code}'}), response.status_code
        
        # Determinar content-type
        content_type = 'application/octet-stream'
        if asset_name.endswith('.json'):
            content_type = 'application/json'
        elif asset_name.endswith('.tar.gz'):
            content_type = 'application/gzip'
        
        # Crear response Flask con headers CORS
        flask_response = Response(response.content, content_type=content_type)
        flask_response.headers['Access-Control-Allow-Origin'] = '*'
        flask_response.headers['Cache-Control'] = 'public, max-age=3600'
        
        print(f"✅ Proxy sirvió: {asset_name} ({content_type})")
        return flask_response
        
    except Exception as e:
        print(f"❌ Error en GitHub proxy para {asset_name}: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# 🗺️ SERVIR TILES COMO ARCHIVOS ESTÁTICOS EN RENDER
@app.route('/tiles/data_argentina/<path:filename>')
def serve_static_tiles(filename):
    """Servir tiles como archivos estáticos desde directorio público"""
    tiles_dir = os.path.join(app.root_path, 'static', 'tiles', 'data_argentina')
    
    # Verificar si el archivo existe localmente
    local_file = os.path.join(tiles_dir, filename)
    if os.path.exists(local_file):
        return send_from_directory(tiles_dir, filename)
    
    # Si no existe, redirigir al proxy de GitHub
    return github_proxy(filename)

@app.route('/tiles/altimetria/<path:filename>')
def serve_altimetria_static(filename):
    """Servir tiles de altimetría como archivos estáticos"""
    return serve_static_tiles(f"altimetria/{filename}")

@app.route('/tiles/vegetacion/<path:filename>')
def serve_vegetacion_static(filename):
    """Servir tiles de vegetación como archivos estáticos"""
    return serve_static_tiles(f"vegetacion/{filename}")

# Configurar directorio estático para tiles en Render
def setup_static_tiles_directory():
    """Configurar directorio estático para tiles"""
    print("🗂️ Configurando directorio estático para tiles...")
    
    static_tiles_dir = os.path.join(app.root_path, 'static', 'tiles', 'data_argentina')
    os.makedirs(static_tiles_dir, exist_ok=True)
    
    # Crear enlaces simbólicos si estamos en desarrollo
    if not os.environ.get('RENDER'):
        print("� Creando enlaces simbólicos para desarrollo local")
        
        # Crear estructura básica
        subdirs = ['altimetria', 'vegetacion', 'indices']
        for subdir in subdirs:
            os.makedirs(os.path.join(static_tiles_dir, subdir), exist_ok=True)
    
    print(f"📁 Directorio tiles configurado: {static_tiles_dir}")

# Ejecutar configuración de tiles estáticos
setup_static_tiles_directory()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Iniciando MAIRA 4.0 en puerto {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
