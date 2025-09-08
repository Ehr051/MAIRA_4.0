#!/usr/bin/env python3
"""
Integración del Detector de Proyección Automático con DetectorGestos
================================================================

Mejora el detector de gestos con:
1. Detección automática de proyección en modo mesa
2. Calibración automática inteligente
3. Fallback a calibración manual
4. Optimización continua de la transformación

Autor: Sistema MAIRA  
Versión: 1.0
"""

import cv2
import numpy as np
import logging
from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass
import time

from detector_proyeccion_auto import DetectorProyeccionAutomatico, EsquinasProyeccion

logger = logging.getLogger(__name__)

@dataclass
class ConfiguracionProyeccion:
    """Configuración específica para detección de proyección"""
    # Detección automática
    intentos_maximos_deteccion: int = 10
    confianza_minima: float = 0.7
    tiempo_estabilizacion: float = 2.0
    
    # Optimización continua
    recalibracion_automatica: bool = True
    intervalo_recalibracion: float = 30.0  # segundos
    
    # Fallback manual
    permitir_calibracion_manual: bool = True
    mostrar_ayuda_calibracion: bool = True

class DetectorGestosConProyeccion:
    """
    Detector de gestos mejorado con detección automática de proyección
    """
    
    def __init__(self, modo: str = "mesa"):
        # Inicializar detector base (importaríamos DetectorGestos aquí)
        self.modo = modo
        
        # Detector de proyección automático
        self.detector_proyeccion = DetectorProyeccionAutomatico()
        self.config_proyeccion = ConfiguracionProyeccion()
        
        # Estado de calibración
        self.proyeccion_detectada = False
        self.calibracion_automatica_exitosa = False
        self.esquinas_actuales: Optional[EsquinasProyeccion] = None
        self.matriz_transformacion: Optional[np.ndarray] = None
        
        # Para recalibración automática
        self.ultimo_tiempo_calibracion = 0
        self.contador_fallos_deteccion = 0
        
        logger.info(f"DetectorGestosConProyeccion inicializado en modo: {modo}")
    
    def inicializar_proyeccion(self, cap: cv2.VideoCapture) -> bool:
        """
        Inicializa la detección de proyección automáticamente
        
        Args:
            cap: Objeto VideoCapture de OpenCV
            
        Returns:
            True si se configuró correctamente, False si necesita calibración manual
        """
        if self.modo != "mesa":
            logger.info("Modo pantalla: no necesita detección de proyección")
            return True
            
        logger.info("🔍 Iniciando detección automática de proyección...")
        print("\n" + "="*60)
        print("🎯 DETECCIÓN AUTOMÁTICA DE PROYECCIÓN")
        print("="*60)
        print("📋 Instrucciones:")
        print("   1. Asegúrate de que la proyección esté encendida")
        print("   2. Proyecta una imagen con bordes claros")
        print("   3. Mantén la cámara estable")
        print("   4. El sistema detectará automáticamente los límites")
        print("\n⏳ Iniciando detección en 3 segundos...")
        
        # Dar tiempo al usuario para prepararse
        for i in range(3, 0, -1):
            print(f"   {i}...")
            time.sleep(1)
        
        print("\n🔍 Detectando proyección...")
        
        # Intentar detección automática
        for intento in range(self.config_proyeccion.intentos_maximos_deteccion):
            ret, frame = cap.read()
            if not ret:
                logger.error("No se puede leer de la cámara")
                return False
            
            # Mostrar frame actual para feedback visual
            cv2.imshow('Detección Automática - Presiona ESC para cancelar', frame)
            
            # Intentar detectar proyección
            exito, esquinas = self.detector_proyeccion.detectar_proyeccion(
                frame, mostrar_debug=True
            )
            
            if exito and self.detector_proyeccion.confianza_deteccion >= self.config_proyeccion.confianza_minima:
                print(f"\n✅ Proyección detectada exitosamente!")
                print(f"   Confianza: {self.detector_proyeccion.confianza_deteccion:.2f}")
                print(f"   Intento: {intento + 1}/{self.config_proyeccion.intentos_maximos_deteccion}")
                
                # Estabilizar detección
                if self._estabilizar_deteccion(cap, esquinas):
                    self.esquinas_actuales = esquinas
                    self.proyeccion_detectada = True
                    self.calibracion_automatica_exitosa = True
                    self.ultimo_tiempo_calibracion = time.time()
                    
                    # Calcular transformación
                    self._calcular_transformacion()
                    
                    print("🎯 Calibración automática completada!")
                    print("\n" + "="*60)
                    return True
            
            # Mostrar progreso
            if intento % 3 == 0:
                print(f"   Intento {intento + 1}/{self.config_proyeccion.intentos_maximos_deteccion}...")
            
            # Verificar si el usuario quiere cancelar
            key = cv2.waitKey(100) & 0xFF
            if key == 27:  # ESC
                print("\n❌ Detección cancelada por el usuario")
                break
        
        cv2.destroyAllWindows()
        
        # Si falló la detección automática
        print("\n⚠️  No se pudo detectar automáticamente la proyección")
        
        if self.config_proyeccion.permitir_calibracion_manual:
            print("🔧 Iniciando calibración manual...")
            return self._calibracion_manual_fallback(cap)
        else:
            logger.error("Calibración manual desactivada. No se puede continuar.")
            return False
    
    def _estabilizar_deteccion(self, cap: cv2.VideoCapture, 
                              esquinas_iniciales: EsquinasProyeccion) -> bool:
        """
        Verifica que la detección sea estable durante varios frames
        """
        print("🔄 Estabilizando detección...")
        frames_estables = 0
        frames_necesarios = int(self.config_proyeccion.tiempo_estabilizacion * 10)  # 10 FPS aprox
        
        for i in range(frames_necesarios):
            ret, frame = cap.read()
            if not ret:
                return False
            
            exito, esquinas = self.detector_proyeccion.detectar_proyeccion(frame)
            
            if exito and self._esquinas_similares(esquinas_iniciales, esquinas):
                frames_estables += 1
            else:
                # Reiniciar contador si cambia mucho
                frames_estables = 0
                
            # Mostrar progreso
            if i % 5 == 0:
                progreso = (i / frames_necesarios) * 100
                print(f"   Estabilidad: {progreso:.0f}% ({frames_estables}/{frames_necesarios} frames estables)")
            
            time.sleep(0.1)
        
        exito_estabilizacion = frames_estables >= frames_necesarios * 0.8  # 80% de frames estables
        
        if exito_estabilizacion:
            print("✅ Detección estabilizada correctamente")
        else:
            print("❌ Detección inestable, necesita calibración manual")
            
        return exito_estabilizacion
    
    def _esquinas_similares(self, esquinas1: EsquinasProyeccion, 
                           esquinas2: EsquinasProyeccion, tolerancia: float = 20.0) -> bool:
        """
        Verifica si dos conjuntos de esquinas son similares
        """
        puntos1 = esquinas1.as_array()
        puntos2 = esquinas2.as_array()
        
        distancias = np.linalg.norm(puntos1 - puntos2, axis=1)
        return np.all(distancias < tolerancia)
    
    def _calcular_transformacion(self):
        """
        Calcula la matriz de transformación perspectiva
        """
        if self.esquinas_actuales is None:
            raise ValueError("No hay esquinas detectadas")
        
        # Usar resolución típica para mapeo (configurable)
        ancho_destino = 1920
        alto_destino = 1080
        
        self.matriz_transformacion = self.detector_proyeccion.calcular_transformacion(
            ancho_destino, alto_destino
        )
        
        logger.info("Matriz de transformación calculada correctamente")
    
    def _calibracion_manual_fallback(self, cap: cv2.VideoCapture) -> bool:
        """
        Sistema de calibración manual como fallback
        """
        if not self.config_proyeccion.mostrar_ayuda_calibracion:
            return False
            
        print("\n" + "="*60)
        print("🔧 CALIBRACIÓN MANUAL")
        print("="*60)
        print("📋 Instrucciones para calibración manual:")
        print("   1. Haz clic en las 4 esquinas de la proyección")
        print("   2. Orden: Superior-Izquierda → Superior-Derecha → Inferior-Derecha → Inferior-Izquierda")
        print("   3. Presiona ENTER cuando termines")
        print("   4. Presiona ESC para cancelar")
        print("\n👆 Haz clic en la primera esquina (Superior-Izquierda)...")
        
        esquinas_manuales = []
        
        def click_callback(event, x, y, flags, param):
            if event == cv2.EVENT_LBUTTONDOWN and len(esquinas_manuales) < 4:
                esquinas_manuales.append((x, y))
                nombres = ["Superior-Izquierda", "Superior-Derecha", "Inferior-Derecha", "Inferior-Izquierda"]
                print(f"✅ Esquina {len(esquinas_manuales)}: {nombres[len(esquinas_manuales)-1]} = ({x}, {y})")
                
                if len(esquinas_manuales) < 4:
                    print(f"👆 Haz clic en la esquina {len(esquinas_manuales)+1}: {nombres[len(esquinas_manuales)]}")
                else:
                    print("✅ Todas las esquinas marcadas. Presiona ENTER para confirmar.")
        
        cv2.namedWindow('Calibración Manual')
        cv2.setMouseCallback('Calibración Manual', click_callback)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Dibujar esquinas ya marcadas
            frame_display = frame.copy()
            for i, (x, y) in enumerate(esquinas_manuales):
                cv2.circle(frame_display, (x, y), 10, (0, 255, 0), -1)
                cv2.putText(frame_display, str(i+1), (x+15, y), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Conectar esquinas con líneas si hay suficientes
            if len(esquinas_manuales) > 1:
                for i in range(len(esquinas_manuales)):
                    start = esquinas_manuales[i]
                    end = esquinas_manuales[(i+1) % len(esquinas_manuales)]
                    if i < len(esquinas_manuales) - 1 or len(esquinas_manuales) == 4:
                        cv2.line(frame_display, start, end, (255, 0, 0), 2)
            
            cv2.imshow('Calibración Manual', frame_display)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 13 and len(esquinas_manuales) == 4:  # ENTER
                # Crear objeto EsquinasProyeccion
                self.esquinas_actuales = EsquinasProyeccion(
                    superior_izquierda=esquinas_manuales[0],
                    superior_derecha=esquinas_manuales[1], 
                    inferior_derecha=esquinas_manuales[2],
                    inferior_izquierda=esquinas_manuales[3]
                )
                
                self.proyeccion_detectada = True
                self.calibracion_automatica_exitosa = False  # Manual
                self._calcular_transformacion()
                
                print("✅ Calibración manual completada!")
                print("="*60)
                cv2.destroyAllWindows()
                return True
                
            elif key == 27:  # ESC
                print("❌ Calibración manual cancelada")
                cv2.destroyAllWindows()
                return False
        
        cv2.destroyAllWindows()
        return False
    
    def transformar_coordenadas_gesto(self, x: float, y: float) -> Tuple[float, float]:
        """
        Transforma coordenadas de gestos según el modo
        
        Args:
            x, y: Coordenadas del gesto en el frame de la cámara
            
        Returns:
            Coordenadas transformadas para el sistema
        """
        if self.modo == "pantalla":
            # En modo pantalla, usar transformación directa
            # (aquí iría la lógica del detector original)
            return x, y
            
        elif self.modo == "mesa" and self.matriz_transformacion is not None:
            # En modo mesa, usar transformación perspectiva
            return self.detector_proyeccion.transformar_coordenadas(x, y)
        else:
            logger.warning("No hay transformación configurada para modo mesa")
            return x, y
    
    def verificar_recalibracion(self, cap: cv2.VideoCapture) -> bool:
        """
        Verifica si es necesario recalibrar automáticamente
        """
        if not self.config_proyeccion.recalibracion_automatica:
            return True
            
        tiempo_actual = time.time()
        if tiempo_actual - self.ultimo_tiempo_calibracion < self.config_proyeccion.intervalo_recalibracion:
            return True
            
        # Intentar detectar si la proyección sigue siendo válida
        ret, frame = cap.read()
        if not ret:
            return False
            
        exito, esquinas = self.detector_proyeccion.detectar_proyeccion(frame)
        
        if exito and self.esquinas_actuales and self._esquinas_similares(self.esquinas_actuales, esquinas):
            # Proyección sigue siendo válida
            self.ultimo_tiempo_calibracion = tiempo_actual
            return True
        else:
            # Proyección cambió, necesita recalibración
            logger.warning("Proyección cambió, iniciando recalibración automática...")
            return self.inicializar_proyeccion(cap)
    
    def obtener_estado_calibracion(self) -> Dict[str, Any]:
        """
        Obtiene el estado actual de la calibración
        """
        return {
            'modo': self.modo,
            'proyeccion_detectada': self.proyeccion_detectada,
            'calibracion_automatica': self.calibracion_automatica_exitosa,
            'esquinas': self.esquinas_actuales.__dict__ if self.esquinas_actuales else None,
            'confianza_deteccion': self.detector_proyeccion.confianza_deteccion,
            'ultimo_tiempo_calibracion': self.ultimo_tiempo_calibracion
        }

# Ejemplo de uso integrado
if __name__ == "__main__":
    detector = DetectorGestosConProyeccion("mesa")
    cap = cv2.VideoCapture(0)
    
    # Inicializar proyección
    if detector.inicializar_proyeccion(cap):
        print("🎯 Sistema listo para detectar gestos!")
        
        # Loop principal de detección de gestos
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Verificar recalibración periódica
            detector.verificar_recalibracion(cap)
            
            # Aquí iría la lógica de detección de gestos
            # usando detector.transformar_coordenadas_gesto()
            
            cv2.imshow('Detección de Gestos', frame)
            
            if cv2.waitKey(1) & 0xFF == 27:  # ESC
                break
    else:
        print("❌ No se pudo configurar la proyección")
    
    cap.release()
    cv2.destroyAllWindows()
