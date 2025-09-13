# 🎮 MAIRA 4.0 - ROADMAP DE FUNCIONALIDADES PENDIENTES

## 📋 ESTADO ACTUAL (Commit: 18f3a419)

### ✅ **IMPLEMENTADO**
- [x] Panel de información dinámico para elementos
- [x] Sistema HUD profesional con controles H/ESC
- [x] Zoom multi-nivel básico (estructura)
- [x] CSS militar profesional
- [x] Integración menú radial

### ❌ **PROBLEMAS CRÍTICOS IDENTIFICADOS**
- [ ] **Partidas Online**: Creación y unión no funciona
- [ ] **ThreeD Service**: No funciona correctamente para combates 3D
- [ ] **Hexágonos**: Problema con fill celeste recurrente
- [ ] **Flujo de fases**: Combate no inicia automáticamente

---

## 🚀 FUNCIONALIDADES CRÍTICAS PENDIENTES

### 1. **SISTEMA ZOOM MULTI-NIVEL COMPLETO** 🔍
**Inspirado en Total War II/III**

#### **NIVEL ESTRATÉGICO (Zoom 5-8)**
- [ ] **Estandartes ondulantes reales** con animación CSS/canvas
- [ ] **Colores por equipo** (azul, rojo, verde, amarillo)
- [ ] **Información de efectivos** en tiempo real
- [ ] **Símbolos de formación** (División, Brigada, Regimiento)
- [ ] **Líneas de comunicación** entre unidades
- [ ] **Zonas de control** y fronteras

#### **NIVEL TÁCTICO (Zoom 9-12)**
- [ ] **Símbolos MilSymbol** mejorados con:
  - [ ] Barras de vida dinámicas
  - [ ] Indicadores de munición
  - [ ] Estado de combustible
  - [ ] Moral de la tropa
- [ ] **Formaciones tácticas** visuales
- [ ] **Alcance de armas** mostrado
- [ ] **Líneas de visión** y fog of war
- [ ] **Efectos de terreno** en movimiento

#### **NIVEL OPERACIONAL (Zoom 13-18)**
- [ ] **Modelos 3D reales** de vehículos:
  - [ ] Tanques TAM, Leopard 2A4
  - [ ] Vehículos M-113, VCLC
  - [ ] Artillería CITER, OTO Melara
  - [ ] Helicópteros Bell 212, MD-500
  - [ ] Infantería con equipamiento
- [ ] **Sombras dinámicas** según hora del día
- [ ] **Efectos de partículas**: polvo, humo, explosiones
- [ ] **Animaciones de movimiento** realistas
- [ ] **Indicadores 3D flotantes** de estado

---

### 2. **SISTEMA THREEJS PARA COMBATES 3D** 🎯
**PROBLEMA CRÍTICO IDENTIFICADO**

#### **Implementación Necesaria**
- [ ] **Scene Manager** centralizado
- [ ] **Loader de modelos** .glb/.obj optimizado
- [ ] **Sistema de iluminación** dinámico
- [ ] **Cámaras múltiples**: 
  - [ ] Vista aérea
  - [ ] Vista FPS
  - [ ] Vista de seguimiento
- [ ] **Physics Engine** para colisiones
- [ ] **Terrain Integration** con Leaflet

#### **Modelos 3D Requeridos**
```
/assets/models/3d/
├── vehiculos/
│   ├── tam_puma.glb          # Tanque principal argentino
│   ├── m113_falcon.glb       # Transporte blindado
│   ├── vlcc_guard.glb        # Vehículo de combate
│   └── unimog_transport.glb  # Transporte logístico
├── artilleria/
│   ├── citer_155mm.glb       # Obús autopropulsado
│   ├── oto_melara.glb        # Cañón remolcado
│   └── mortar_120mm.glb      # Mortero pesado
├── aeronaves/
│   ├── bell212_transport.glb # Helicóptero transporte
│   ├── md500_recon.glb       # Helicóptero reconocimiento
│   └── pucar_attack.glb      # Avión de ataque
└── personal/
    ├── soldado_base.glb      # Infantería básica
    ├── comandante.glb        # Oficial
    └── especialista.glb      # Tropas especiales
```

---

### 3. **EFECTOS DE BATALLA AVANZADOS** 💥

#### **Sistema de Partículas**
- [ ] **Explosiones** (artillería, tanques)
- [ ] **Humo y fuego** persistente
- [ ] **Polvo de movimiento** de vehículos
- [ ] **Trazas de balas** y proyectiles
- [ ] **Efectos de clima**: lluvia, niebla

#### **Audio Dinámico**
- [ ] **Sonidos por zoom level**:
  - [ ] Estratégico: Música ambiental, radio
  - [ ] Táctico: Motores, órdenes
  - [ ] Operacional: Sonidos de combate detallados
- [ ] **Audio 3D posicional**
- [ ] **Efectos Doppler** para vehículos
- [ ] **Radio communications** entre unidades

---

### 4. **IA DE COMPORTAMIENTO** 🤖

#### **Comportamiento de Unidades**
- [ ] **Pathfinding A*** optimizado
- [ ] **Formaciones automáticas** según terreno
- [ ] **Respuesta a amenazas** autónoma
- [ ] **Reagrupamiento** después de combate
- [ ] **Búsqueda de cobertura** inteligente

#### **IA Director**
- [ ] **Análisis de batalla** en tiempo real
- [ ] **Sugerencias tácticas** al jugador
- [ ] **Predicción de movimientos** enemigos
- [ ] **Optimización logística** automática

---

### 5. **SISTEMA DE COMBATE AVANZADO** ⚔️

#### **Mecánicas de Combate**
- [ ] **Sistema de daño realista**:
  - [ ] Penetración de blindaje
  - [ ] Daño por áreas
  - [ ] Efectos críticos
- [ ] **Línea de visión** 3D
- [ ] **Alcance efectivo** por arma
- [ ] **Factores ambientales**:
  - [ ] Visibilidad por clima
  - [ ] Efectos de terreno
  - [ ] Hora del día

#### **Logística Avanzada**
- [ ] **Cadena de suministro** visual
- [ ] **Depósitos de munición** destructibles
- [ ] **Reabastecimiento** automático/manual
- [ ] **Reparaciones de campaña**
- [ ] **Evacuación de heridos**

---

### 6. **MULTIJUGADOR TIEMPO REAL MEJORADO** 🌐

#### **Sistema de Sincronización**
- [ ] **Estado compartido** optimizado
- [ ] **Predicción de lag** y compensación
- [ ] **Reconexión automática**
- [ ] **Espectadores** y replay system

#### **Comunicación Entre Jugadores**
- [ ] **Chat por equipos** mejorado
- [ ] **Marcadores en mapa** compartidos
- [ ] **Planes tácticos** colaborativos
- [ ] **Voz over IP** integrada

---

### 7. **SISTEMA DE MAPAS AVANZADO** 🗺️

#### **Terreno Dinámico**
- [ ] **Destrucción de terreno** por artillería
- [ ] **Cráteres persistentes**
- [ ] **Caminos dinámicos** creados por vehículos
- [ ] **Efectos estacionales** en vegetación

#### **Capas de Información**
- [ ] **Mapas topográficos** reales de Argentina
- [ ] **Datos meteorológicos** en tiempo real
- [ ] **Infraestructura crítica**: puentes, túneles
- [ ] **Poblaciones civiles** y refugiados

---

### 8. **INTERFACE DE USUARIO AVANZADA** 🖥️

#### **HUD Contextual**
- [ ] **Información adaptativa** según zoom
- [ ] **Alertas inteligentes** priorizadas
- [ ] **Shortcuts customizables**
- [ ] **Dashboard de comandante**

#### **Controles Avanzados**
- [ ] **Gestos multitouch** para tablets
- [ ] **Controles por voz** básicos
- [ ] **Eye tracking** (experimental)
- [ ] **Realidad aumentada** para móviles

---

## 🎯 REFERENCIAS DE JUEGOS PARA INSPIRACIÓN

### **Total War Series**
- ✅ Sistema de zoom multi-nivel
- ✅ Estandartes y formaciones
- ✅ Combate táctico detallado

### **Command Ops 2**
- ✅ Interface militar profesional
- ✅ Sistema de órdenes realista
- ✅ Fog of war avanzado

### **Steel Beasts Professional**
- ✅ Simulación de vehículos realista
- ✅ Balística avanzada
- ✅ Entrenamiento militar

### **Combat Mission**
- ✅ Combate por turnos realista
- ✅ Efectos de terreno detallados
- ✅ Moral y fatiga de tropas

### **Wargame: Red Dragon**
- ✅ Variedad de unidades modernas
- ✅ Sistema de suministros
- ✅ Combate aéreo integrado

---

## ⏰ CRONOGRAMA SUGERIDO

### **FASE 1: CRÍTICA (1-2 semanas)**
1. ✅ Arreglar partidas online
2. ✅ Solucionar ThreeJS service
3. ✅ Implementar estandartes básicos
4. ✅ Modelos 3D básicos funcionando

### **FASE 2: COMBATE (3-4 semanas)**
1. Sistema de combate avanzado
2. Efectos de batalla
3. IA básica de comportamiento
4. Audio dinámico

### **FASE 3: POLISH (2-3 semanas)**
1. Optimización de rendimiento
2. UI/UX refinamiento
3. Testing extensivo
4. Documentación completa

---

## 🔧 RECURSOS TÉCNICOS NECESARIOS

### **Librerías Adicionales**
```json
{
  "three": "^0.158.0",
  "cannon-es": "^0.20.0",
  "howler": "^2.2.3",
  "stats.js": "^0.17.0",
  "dat.gui": "^0.7.9",
  "tween.js": "^20.0.0"
}
```

### **Servicios Externos**
- **CDN para modelos 3D**: AWS S3 o similar
- **Audio Assets**: Freesound.org, Zapsplat
- **Mapas satelitales**: Mapbox, Google Maps
- **Weather API**: OpenWeatherMap

### **Hardware Mínimo**
- **GPU**: Compatibilidad WebGL 2.0
- **RAM**: 8GB mínimo, 16GB recomendado
- **CPU**: Multi-core para physics
- **Conexión**: 10Mbps para multijugador

---

## 🎖️ OBJETIVOS DE CALIDAD

### **Performance**
- [ ] 60 FPS constantes en nivel operacional
- [ ] < 100ms latencia en multijugador
- [ ] < 5s tiempo de carga inicial

### **Realismo**
- [ ] Balística basada en datos reales
- [ ] Formaciones doctrinarias argentinas
- [ ] Terreno geográficamente exacto

### **Usabilidad**
- [ ] Curva de aprendizaje progresiva
- [ ] Tutorial interactivo completo
- [ ] Accesibilidad para discapacitados

---

**Actualizado**: 13 de septiembre de 2025  
**Próxima revisión**: Al completar Fase 1  
**Responsable**: Sistema de desarrollo MAIRA 4.0
