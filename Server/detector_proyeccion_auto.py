#!/usr/bin/env python3
"""
Sistema de Reconocimiento Automático de Proyección
================================================

Detecta automáticamente los límites de una proyección en mesa
usando análisis de bordes y detección de contornos.

Características:
- Detección automática de rectángulo de proyección
- Calibración automática de esquinas
- Fallback a calibración manual si es necesario
- Optimización de transformación perspectiva

Autor: Sistema MAIRA
Versión: 1.0
"""

import cv2
import numpy as np
import logging
import time
from typing import Tuple, List, Optional, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class EsquinasProyeccion:
    """Coordenadas de las 4 esquinas de la proyección"""
    superior_izquierda: Tuple[int, int]
    superior_derecha: Tuple[int, int] 
    inferior_derecha: Tuple[int, int]
    inferior_izquierda: Tuple[int, int]
    
    def as_array(self) -> np.ndarray:
        """Convierte a array NumPy para cv2.getPerspectiveTransform"""
        return np.array([
            self.superior_izquierda,
            self.superior_derecha, 
            self.inferior_derecha,
            self.inferior_izquierda
        ], dtype=np.float32)

class DetectorProyeccionAutomatico:
    """
    Detecta automáticamente los límites de una proyección en mesa
    """
    
    def __init__(self):
        self.esquinas_detectadas: Optional[EsquinasProyeccion] = None
        self.confianza_deteccion: float = 0.0
        self.matriz_transformacion: Optional[np.ndarray] = None
        
        # Parámetros de detección
        self.min_area_proyeccion = 50000  # Área mínima del rectángulo
        self.umbral_canny_bajo = 50
        self.umbral_canny_alto = 150
        self.epsilon_aproximacion = 0.02  # Para aproximar contorno a rectángulo
        
    def detectar_proyeccion(self, frame: np.ndarray, 
                          mostrar_debug: bool = False) -> Tuple[bool, Optional[EsquinasProyeccion]]:
        """
        Detecta automáticamente los límites de la proyección
        
        Args:
            frame: Frame de la cámara
            mostrar_debug: Si mostrar ventanas de debug
            
        Returns:
            (deteccion_exitosa, esquinas_detectadas)
        """
        try:
            # 1. Preprocesamiento
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # 2. Detección de bordes
            edges = cv2.Canny(blurred, self.umbral_canny_bajo, self.umbral_canny_alto)
            
            # 3. Dilatación para conectar bordes
            kernel = np.ones((3, 3), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=2)
            
            # 4. Encontrar contornos
            contornos, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # 5. Filtrar contornos por área
            contornos_grandes = [c for c in contornos if cv2.contourArea(c) > self.min_area_proyeccion]
            
            if not contornos_grandes:
                logger.warning("No se encontraron contornos suficientemente grandes")
                return False, None
                
            # 6. Encontrar el contorno más rectangular
            mejor_contorno = None
            mejor_puntuacion = 0
            
            for contorno in contornos_grandes:
                # Aproximar contorno a polígono
                epsilon = self.epsilon_aproximacion * cv2.arcLength(contorno, True)
                approx = cv2.approxPolyDP(contorno, epsilon, True)
                
                # Buscar rectángulos (4 vértices)
                if len(approx) == 4:
                    # Calcular puntuación basada en área y regularidad
                    area = cv2.contourArea(contorno)
                    perimetro = cv2.arcLength(contorno, True)
                    regularidad = 4 * np.pi * area / (perimetro * perimetro)  # Círculo perfecto = 1
                    
                    puntuacion = area * regularidad
                    
                    if puntuacion > mejor_puntuacion:
                        mejor_puntuacion = puntuacion
                        mejor_contorno = approx
            
            if mejor_contorno is None:
                logger.warning("No se detectó un rectángulo válido")
                return False, None
                
            # 7. Ordenar esquinas en orden: TL, TR, BR, BL
            esquinas = self._ordenar_esquinas(mejor_contorno.reshape(4, 2))
            
            # 8. Validar que las esquinas formen un rectángulo razonable
            if not self._validar_rectangulo(esquinas):
                logger.warning("El rectángulo detectado no es válido")
                return False, None
                
            # 9. Crear objeto EsquinasProyeccion
            esquinas_obj = EsquinasProyeccion(
                superior_izquierda=tuple(esquinas[0]),
                superior_derecha=tuple(esquinas[1]),
                inferior_derecha=tuple(esquinas[2]),
                inferior_izquierda=tuple(esquinas[3])
            )
            
            # 10. Calcular confianza
            self.confianza_deteccion = min(mejor_puntuacion / 100000, 1.0)
            
            # 11. Mostrar debug si es necesario
            if mostrar_debug:
                self._mostrar_debug(frame, edges, mejor_contorno, esquinas)
                
            self.esquinas_detectadas = esquinas_obj
            logger.info(f"Proyección detectada con confianza: {self.confianza_deteccion:.2f}")
            
            return True, esquinas_obj
            
        except Exception as e:
            logger.error(f"Error en detección automática: {e}")
            return False, None
    
    def _ordenar_esquinas(self, puntos: np.ndarray) -> np.ndarray:
        """
        Ordena las esquinas en el orden: TL, TR, BR, BL
        """
        # Ordenar por suma de coordenadas (x + y)
        suma = puntos.sum(axis=1)
        diff = np.diff(puntos, axis=1)
        
        # Top-left: menor suma
        tl = puntos[np.argmin(suma)]
        
        # Bottom-right: mayor suma  
        br = puntos[np.argmax(suma)]
        
        # Top-right: menor diferencia (x - y)
        tr = puntos[np.argmin(diff)]
        
        # Bottom-left: mayor diferencia (x - y)
        bl = puntos[np.argmax(diff)]
        
        return np.array([tl, tr, br, bl], dtype=np.float32)
    
    def _validar_rectangulo(self, esquinas: np.ndarray) -> bool:
        """
        Valida que las esquinas formen un rectángulo razonable
        """
        try:
            # Calcular las 4 longitudes de los lados
            lado1 = np.linalg.norm(esquinas[1] - esquinas[0])  # top
            lado2 = np.linalg.norm(esquinas[2] - esquinas[1])  # right  
            lado3 = np.linalg.norm(esquinas[3] - esquinas[2])  # bottom
            lado4 = np.linalg.norm(esquinas[0] - esquinas[3])  # left
            
            # Los lados opuestos deben ser similares
            ratio_horizontal = max(lado1, lado3) / min(lado1, lado3)
            ratio_vertical = max(lado2, lado4) / min(lado2, lado4)
            
            # Tolerancia: lados opuestos no deben diferir más del 20%
            if ratio_horizontal > 1.2 or ratio_vertical > 1.2:
                return False
                
            # El rectángulo debe tener un aspect ratio razonable (no muy aplastado)
            aspecto = max(lado1, lado2) / min(lado1, lado2) 
            if aspecto > 3.0:  # No más de 3:1
                return False
                
            return True
            
        except Exception:
            return False
    
    def _mostrar_debug(self, frame: np.ndarray, edges: np.ndarray, 
                      contorno: np.ndarray, esquinas: np.ndarray):
        """
        Muestra ventanas de debug con la detección
        """
        # Frame con contorno detectado
        debug_frame = frame.copy()
        cv2.drawContours(debug_frame, [contorno], -1, (0, 255, 0), 3)
        
        # Marcar esquinas
        for i, esquina in enumerate(esquinas):
            cv2.circle(debug_frame, tuple(esquina.astype(int)), 10, (0, 0, 255), -1)
            cv2.putText(debug_frame, str(i), tuple(esquina.astype(int)), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Mostrar ventanas
        cv2.imshow('Detección Automática', debug_frame)
        cv2.imshow('Bordes', edges)
    
    def calcular_transformacion(self, ancho_objetivo: int, alto_objetivo: int) -> np.ndarray:
        """
        Calcula la matriz de transformación perspectiva
        
        Args:
            ancho_objetivo: Ancho de la región destino en píxeles
            alto_objetivo: Alto de la región destino en píxeles
            
        Returns:
            Matriz de transformación perspectiva
        """
        if self.esquinas_detectadas is None:
            raise ValueError("No hay esquinas detectadas. Ejecutar detectar_proyeccion() primero.")
            
        # Puntos de destino (rectángulo perfecto)
        dst_points = np.array([
            [0, 0],
            [ancho_objetivo, 0],
            [ancho_objetivo, alto_objetivo],
            [0, alto_objetivo]
        ], dtype=np.float32)
        
        # Calcular transformación perspectiva
        src_points = self.esquinas_detectadas.as_array()
        self.matriz_transformacion = cv2.getPerspectiveTransform(src_points, dst_points)
        
        logger.info("Matriz de transformación calculada")
        return self.matriz_transformacion
    
    def transformar_coordenadas(self, x: float, y: float) -> Tuple[float, float]:
        """
        Transforma coordenadas de la cámara a coordenadas de pantalla
        
        Args:
            x, y: Coordenadas en el frame de la cámara
            
        Returns:
            Coordenadas transformadas (x_pantalla, y_pantalla)
        """
        if self.matriz_transformacion is None:
            raise ValueError("No hay matriz de transformación. Ejecutar calcular_transformacion() primero.")
            
        # Aplicar transformación perspectiva
        punto = np.array([[[x, y]]], dtype=np.float32)
        punto_transformado = cv2.perspectiveTransform(punto, self.matriz_transformacion)
        
        return float(punto_transformado[0][0][0]), float(punto_transformado[0][0][1])

# Ejemplo de uso
if __name__ == "__main__":
    detector = DetectorProyeccionAutomatico()
    cap = cv2.VideoCapture(0)
    
    print("Presiona ESPACIO para detectar proyección, ESC para salir")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Mostrar frame actual
        cv2.imshow('Cámara', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord(' '):  # ESPACIO para detectar
            print("Detectando proyección...")
            exito, esquinas = detector.detectar_proyeccion(frame, mostrar_debug=True)
            
            if exito:
                print(f"✅ Proyección detectada con confianza: {detector.confianza_deteccion:.2f}")
                print(f"Esquinas: {esquinas}")
                
                # Calcular transformación para pantalla 1920x1080
                matriz = detector.calcular_transformacion(1920, 1080)
                print("Transformación calculada. Sistema listo para usar.")
            else:
                print("❌ No se pudo detectar la proyección automáticamente")
                print("Sugerencia: Usar calibración manual")
                
        elif key == 27:  # ESC
            break
    
    cap.release()
    cv2.destroyAllWindows()
