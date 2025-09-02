# Configuración de Gunicorn para Render.com
# Optimizada para Socket.IO y aplicaciones Flask pesadas
# Fix: Python 3.13 + gevent compatibility

import os
import multiprocessing

# Configuración del servidor
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"
workers = 1  # Solo 1 worker para evitar problemas de sesión con Socket.IO
worker_class = "sync"  # Worker estándar compatible con todas las versiones
worker_connections = 100

# Timeouts críticos (incrementados para evitar worker timeouts)
timeout = 120  # 2 minutos en lugar de 30 segundos
keepalive = 30
graceful_timeout = 60

# Configuración de memoria y procesos
max_requests = 500
max_requests_jitter = 50
preload_app = True

# Logs
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" in %(D)sµs'

# Configuración específica para Socket.IO
worker_tmp_dir = "/dev/shm"  # Usar memoria compartida si está disponible

# Configuración de señales para Socket.IO
def on_starting(server):
    server.log.info("🚀 MAIRA Server starting with Socket.IO support...")

def on_reload(server):
    server.log.info("🔄 MAIRA Server reloading...")

def when_ready(server):
    server.log.info("✅ MAIRA Server ready to accept connections")

def worker_abort(worker):
    worker.log.info(f"⚠️  Worker {worker.pid} aborted - Socket.IO sessions may be lost")
