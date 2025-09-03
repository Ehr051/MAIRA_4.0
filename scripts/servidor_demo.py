#!/usr/bin/env python3
"""
Servidor HTTP simple para testing de Mini-tiles
Resuelve problemas de CORS para desarrollo local
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Puerto para el servidor
PORT = 8080

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler que permite CORS para desarrollo local"""
    
    def end_headers(self):
        # Agregar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Manejar preflight requests
        self.send_response(200)
        self.end_headers()

def main():
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    os.chdir(project_dir)
    
    print("🚀 SERVIDOR DEMO MINI-TILES v3.0")
    print("=" * 40)
    print(f"📁 Directorio: {os.getcwd()}")
    print(f"🌐 Puerto: {PORT}")
    print(f"🔗 URL Local: http://localhost:{PORT}")
    print(f"🧪 Demo URL: http://localhost:{PORT}/static/demo_minitiles.html")
    print()
    
    # Verificar archivos necesarios
    required_files = [
        'static/demo_minitiles.html',
        'Client/js/mini_tiles_loader.js',
        'mini_tiles_github/master_mini_tiles_index.json'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ ARCHIVOS FALTANTES:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n💡 Asegúrate de ejecutar desde el directorio del proyecto")
        return
    
    print("✅ Todos los archivos necesarios encontrados")
    print()
    
    # Iniciar servidor
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"🎯 Servidor iniciado en http://localhost:{PORT}")
            print("🔧 CORS habilitado para desarrollo local")
            print("🛑 Presiona Ctrl+C para detener")
            print()
            
            # Abrir automáticamente en navegador
            demo_url = f"http://localhost:{PORT}/static/demo_minitiles.html"
            print(f"🌐 Abriendo demo: {demo_url}")
            try:
                webbrowser.open(demo_url)
            except:
                print("⚠️ No se pudo abrir navegador automáticamente")
            
            print()
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por usuario")
    except OSError as e:
        if e.errno == 48:  # Puerto en uso
            print(f"❌ Puerto {PORT} ya está en uso")
            print("💡 Intenta con otro puerto o cierra el proceso existente")
        else:
            print(f"❌ Error iniciando servidor: {e}")

if __name__ == "__main__":
    main()
