# config.py - versión compatible con ngrok
import socket
import os

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))  # Conectar a DNS de Google
        IP = s.getsockname()[0]
        s.close()
        return IP
    except Exception as e:
        print(f"Error obteniendo IP: {e}")
        return 'localhost'

SERVER_PORT = 5000
SERVER_IP = get_local_ip()

# Verificar si estamos en un entorno de ngrok (puedes añadir una variable de entorno)
USING_NGROK = os.getenv('USING_NGROK', 'false').lower() == 'true'
USING_CLOUDFLARE = os.getenv('USING_CLOUDFLARE', 'false').lower() == 'true'
CLOUDFLARE_URL = os.getenv('CLOUDFLARE_URL', '')

if USING_CLOUDFLARE and CLOUDFLARE_URL:
    SERVER_URL = CLOUDFLARE_URL
    CLIENT_URL = CLOUDFLARE_URL
elif USING_NGROK:
    # Si usas ngrok, obtendrías la URL completa de una variable de entorno
    NGROK_URL = os.getenv('NGROK_URL', '')
    if NGROK_URL:
        SERVER_URL = NGROK_URL
        CLIENT_URL = NGROK_URL
    else:
        # Si no hay URL de ngrok, usar la configuración normal
        SERVER_URL = f'http://{SERVER_IP}:{SERVER_PORT}'
        CLIENT_URL = SERVER_URL
else:

    # Configuración normal (no ngrok)
    SERVER_URL = f'http://{SERVER_IP}:{SERVER_PORT}'
    CLIENT_URL = SERVER_URL