#!/usr/bin/env python3
"""
Sistema unificado de gestión de usuarios y sesiones para MAIRA
"""

from datetime import datetime
import json

class UserManager:
    """Gestor centralizado de usuarios y sesiones"""
    
    def __init__(self):
        self.usuarios_conectados = {}
        self.sesiones_activas = {}
        
    def login_usuario(self, socket_id, user_data):
        """
        Registra un usuario conectado
        user_data debe contener: {'id', 'username', 'email'}
        """
        user_id = user_data.get('id')
        if user_id:
            self.usuarios_conectados[user_id] = {
                'socket_id': socket_id,
                'user_data': user_data,
                'connected_at': datetime.now().isoformat(),
                'last_activity': datetime.now().isoformat()
            }
            self.sesiones_activas[socket_id] = user_id
            
    def logout_usuario(self, socket_id):
        """Desconecta un usuario"""
        if socket_id in self.sesiones_activas:
            user_id = self.sesiones_activas[socket_id]
            if user_id in self.usuarios_conectados:
                del self.usuarios_conectados[user_id]
            del self.sesiones_activas[socket_id]
            
    def get_usuario_por_socket(self, socket_id):
        """Obtiene datos de usuario por socket_id"""
        if socket_id in self.sesiones_activas:
            user_id = self.sesiones_activas[socket_id]
            return self.usuarios_conectados.get(user_id)
        return None
        
    def get_usuario_por_id(self, user_id):
        """Obtiene datos de usuario por user_id"""
        return self.usuarios_conectados.get(user_id)
        
    def actualizar_actividad(self, socket_id):
        """Actualiza última actividad del usuario"""
        if socket_id in self.sesiones_activas:
            user_id = self.sesiones_activas[socket_id]
            if user_id in self.usuarios_conectados:
                self.usuarios_conectados[user_id]['last_activity'] = datetime.now().isoformat()
                
    def get_usuarios_conectados(self):
        """Retorna lista de usuarios conectados"""
        return list(self.usuarios_conectados.values())

class PartidaManager:
    """Gestor centralizado de partidas"""
    
    def __init__(self):
        self.partidas_activas = {}
        self.salas_jugadores = {}
        
    def crear_partida(self, codigo, configuracion, creador_id):
        """Crea una nueva partida"""
        self.partidas_activas[codigo] = {
            'codigo': codigo,
            'configuracion': configuracion,
            'creador_id': creador_id,
            'estado': 'esperando',
            'jugadores': {},
            'fecha_creacion': datetime.now().isoformat()
        }
        
    def unir_jugador(self, codigo, user_id, socket_id):
        """Une un jugador a una partida"""
        if codigo in self.partidas_activas:
            self.partidas_activas[codigo]['jugadores'][user_id] = {
                'socket_id': socket_id,
                'unido_at': datetime.now().isoformat(),
                'listo': False
            }
            if socket_id not in self.salas_jugadores:
                self.salas_jugadores[socket_id] = []
            self.salas_jugadores[socket_id].append(codigo)
            
    def remover_jugador(self, codigo, user_id, socket_id):
        """Remueve un jugador de una partida"""
        if codigo in self.partidas_activas:
            if user_id in self.partidas_activas[codigo]['jugadores']:
                del self.partidas_activas[codigo]['jugadores'][user_id]
        if socket_id in self.salas_jugadores:
            if codigo in self.salas_jugadores[socket_id]:
                self.salas_jugadores[socket_id].remove(codigo)
                
    def get_partida(self, codigo):
        """Obtiene datos de una partida"""
        return self.partidas_activas.get(codigo)
        
    def get_partidas_disponibles(self):
        """Retorna partidas en estado 'esperando'"""
        return [p for p in self.partidas_activas.values() if p['estado'] == 'esperando']

# Instancias globales
user_manager = UserManager()
partida_manager = PartidaManager()
