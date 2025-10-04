# Configuración OPTIMA de Gunicorn para MAIRA 4.0
# Optimizada para alto rendimiento y Socket.IO

import os
import multiprocessing

# Número de CPUs disponibles
cpu_count = multiprocessing.cpu_count()

# Configuración del servidor OPTIMIZADA
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# WORKERS OPTIMIZADOS: Usar CPU count pero máximo 4 para evitar sobrecarga
workers = min(cpu_count, 4)

# WORKER CLASS OPTIMO: gthread para async operations (sin dependencias externas)
worker_class = "gthread"

# Conexiones por worker aumentadas
worker_connections = 1000

# Timeouts optimizados para planeamiento
timeout = 300  # 5 minutos para operaciones pesadas de planeamiento
keepalive = 65
graceful_timeout = 30

# Configuración de memoria y procesos OPTIMIZADA
max_requests = 1000  # Más requests antes de restart
max_requests_jitter = 50

# PRELOAD: Cargar app antes de fork para mejor rendimiento
preload_app = True

# THREADING: Habilitar threads para mejor concurrencia
threads = 4

# Logs optimizados
accesslog = "-"
errorlog = "-"
loglevel = "warning"  # Menos verbose para mejor rendimiento
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s in %(D)sµs'

# Configuración específica para Socket.IO de alto rendimiento
worker_tmp_dir = "/dev/shm"  # Memoria compartida si disponible

# Configuración avanzada para gthread
worker_int_class = 'gthread'
max_requests_per_child = 1000

# Configuración de señales OPTIMIZADA
def on_starting(server):
    server.log.info(f"🚀 MAIRA Server starting with {workers} workers (gthread)...")

def on_reload(server):
    server.log.info("🔄 MAIRA Server reloading...")

def when_ready(server):
    server.log.info("✅ MAIRA Server ready - Optimizado para planeamiento")

def worker_abort(worker):
    worker.log.warning(f"⚠️  Worker {worker.pid} aborted")

def worker_int(worker):
    worker.log.info(f"🔄 Worker {worker.pid} graceful shutdown")
