#!/usr/bin/env python3
"""
Script para ejecutar via endpoint en Render para crear tablas
"""

from flask import Flask, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__)

@app.route('/setup/tables')
def setup_tables():
    """Endpoint para crear las tablas necesarias"""
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            return jsonify({"error": "DATABASE_URL no configurado"}), 500
            
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        cursor = conn.cursor()
        
        results = {"status": "success", "operations": []}
        
        # Crear tabla usuarios
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                unidad VARCHAR(100),
                is_online BOOLEAN DEFAULT false,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        results["operations"].append("Tabla usuarios creada/verificada")
        
        # Crear tabla partidas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS partidas (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(10) UNIQUE NOT NULL,
                configuracion JSONB,
                estado VARCHAR(20) DEFAULT 'esperando',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_finalizacion TIMESTAMP
            );
        """)
        results["operations"].append("Tabla partidas creada/verificada")
        
        # Crear tabla usuarios_partida
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios_partida (
                id SERIAL PRIMARY KEY,
                partida_id INTEGER REFERENCES partidas(id) ON DELETE CASCADE,
                usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                equipo VARCHAR(50) DEFAULT 'sin_equipo',
                listo BOOLEAN DEFAULT false,
                esCreador BOOLEAN DEFAULT false,
                fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(partida_id, usuario_id)
            );
        """)
        results["operations"].append("Tabla usuarios_partida creada/verificada")
        
        # Crear índices
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_partidas_codigo ON partidas(codigo);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_partida_partida ON usuarios_partida(partida_id);")
        results["operations"].append("Índices creados/verificados")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        results["message"] = "Tablas configuradas exitosamente"
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
