# 🏗️ ARQUITECTURA DE INTEGRACIÓN 2D/3D - MAIRA 4.0

**Fecha:** 8 de octubre de 2025  
**Estado:** En Desarrollo  
**Versión:** 1.0.0

---

## 📋 RESUMEN EJECUTIVO

MAIRA es un **sistema híbrido táctico** que combina:
- **Planeamiento 2D** (sin turnos, solo visualización MCC/MCCF/elementos)
- **Juego de Guerra 2D** (turnos, fases, órdenes estratégicas)
- **Combate 3D** (detalle táctico, terreno real, vegetación, altimetría)

### 🎯 Principio Fundamental:
> "El usuario puede ENTRAR y SALIR del 3D en cualquier momento. Las órdenes dadas en 3D se ejecutan en 2D. Las órdenes dadas en 2D se visualizan en 3D."

---

## 🗂️ ARQUITECTURA DE ARCHIVOS

### **Archivos Principales (NO TOCAR sin análisis previo):**

| Archivo | Función | Estado |
|---------|---------|--------|
| `planeamiento.html` | Visualización MCC/MCCF/elementos SIN turnos | ✅ Funcional |
| `juegodeguerra.html` | Sistema turnos/fases + órdenes estratégicas | ⚠️ Panel Integrado roto |
| `gestionbatalla.html` | Gestión de combate | ⚠️ Por revisar |
| `inicioGB.html` | Inicio Gestión Batalla | ⚠️ Por revisar |
| `iniciarpartida.html` | Configuración turnos/tiempos/equipos | ✅ Funcional |
| `CO.html` | ❌ NO TOCAR |
| `index.html` | ❌ NO TOCAR |

### **Test de Integración (Desarrollo actual):**

| Archivo | Función | Estado |
|---------|---------|--------|
| `test-terrain-from-map.html` | Prototipo 3D independiente | 🚧 En desarrollo |

---

## 🔄 FLUJO DE INTEGRACIÓN 2D ↔ 3D

### **CASO 1: Planeamiento**
```
1. Usuario abre planeamiento.html
2. Selecciona área de mapa (bounds)
3. Carga MCC, MCCF, elementos con SIDC
4. Click "Entrar 3D" → test-terrain-from-map.html
   ├─ Recibe: bounds, MCC[], MCCF[], elementos[]
   ├─ Genera: terreno 3D + vegetación + altimetría
   └─ Renderiza: elementos 3D según SIDC + coordenadas
5. Usuario sale de 3D → vuelve a planeamiento.html
```

### **CASO 2: Juego de Guerra - Fase Preparación/Despliegue**
```
1. Usuario configura turnos en iniciarpartida.html
   ├─ Duración turno: X minutos
   ├─ Jugadores por equipo: Y
   └─ Equipos: Azul vs Rojo
2. Fase Preparación/Despliegue (2D)
3. Click "Iniciar Turnos"
4. Usuario puede entrar/salir 3D en cualquier momento
```

### **CASO 3: Juego de Guerra - Durante Turno (FLUJO CRÍTICO)**
```
JUGADOR 1 (Equipo Azul) - Turno 1:
├─ 1. Elemento A toma contacto enemigo
├─ 2. Usuario entra 3D → test-terrain-from-map.html
│   ├─ Recibe: estado actual 2D (posiciones, órdenes pendientes)
│   ├─ Usuario da órdenes DETALLADAS en 3D:
│   │   ├─ Waypoints considerando vegetación
│   │   ├─ Posiciones considerando altimetría
│   │   └─ Ordenes de fuego con LOS real
│   └─ Órdenes se ENCOLAN en gestorOrdenes global
├─ 3. Usuario sale de 3D (vuelve a 2D)
├─ 4. Usuario da órdenes a Elemento B en 2D
├─ 5. Usuario da órdenes a Elemento C en 2D
└─ 6. Usuario click "Finalizar Turno"

SISTEMA (Cambio de Turno):
├─ 1. Si hay JUGADOR 2 (Equipo Azul):
│   ├─ JUGADOR 2 imparte órdenes a SUS elementos
│   └─ No puede tocar elementos de JUGADOR 1
├─ 2. Todos jugadores Azul terminaron → Cambio Equipo
└─ 3. gestorOrdenes EJECUTA todas órdenes Azules:
    ├─ Animaciones 2D (si usuario en 2D)
    ├─ Animaciones 3D (si usuario en 3D)
    └─ Actualización de estado sincronizada

JUGADOR 1 (Equipo Rojo) - Turno 1:
└─ Mismo flujo...
```

---

## 🛠️ COMPONENTES NECESARIOS

### **1. gestorOrdenes (ÚNICO - Híbrido 2D/3D)**

**Ubicación:** `Client/js/modules/shared/gestorOrdenes.js` (A CREAR)

```javascript
class GestorOrdenes {
    constructor() {
        this.ordenesPendientes = {
            'equipoAzul': [],
            'equipoRojo': []
        };
        this.modo = '2D'; // '2D' o '3D'
    }
    
    /**
     * Agregar orden desde 2D o 3D
     * @param {Object} orden - { unidadId, tipo: 'mover'|'atacar', params, origen: '2D'|'3D' }
     */
    agregarOrden(equipo, orden) {
        orden.timestamp = Date.now();
        orden.turno = gestorTurnos.getTurnoActual();
        this.ordenesPendientes[equipo].push(orden);
    }
    
    /**
     * Ejecutar todas órdenes al cambio de turno
     */
    ejecutarOrdenes(equipo) {
        const ordenes = this.ordenesPendientes[equipo];
        ordenes.forEach(orden => {
            if (this.modo === '2D') {
                this.ejecutarEn2D(orden);
            } else {
                this.ejecutarEn3D(orden);
            }
        });
        this.ordenesPendientes[equipo] = [];
    }
    
    /**
     * Sincronizar estado 2D → 3D
     */
    sincronizar2Dto3D(elementos2D) {
        // Convertir posiciones Leaflet a Three.js
        // Aplicar altimetría real
        // Renderizar con modelos 3D
    }
    
    /**
     * Sincronizar estado 3D → 2D
     */
    sincronizar3Dto2D(elementos3D) {
        // Convertir posiciones Three.js a Leaflet
        // Actualizar marcadores 2D
    }
}

window.gestorOrdenes = new GestorOrdenes();
```

### **2. Protocolo de Comunicación 2D ↔ 3D**

**Método 1: localStorage + Events (Sin servidor)**
```javascript
// Desde 2D a 3D
const estado2D = {
    bounds: { north, south, east, west },
    elementos: [{ id, sidc, lat, lon, propiedades }],
    mcc: [{ tipo, coordenadas, estilo }],
    turnoActual: 5,
    equipoActivo: 'azul',
    ordenesPendientes: gestorOrdenes.getOrdenesPendientes()
};
localStorage.setItem('maira_estado_2d', JSON.stringify(estado2D));
window.open('test-terrain-from-map.html', 'maira3d');

// Desde 3D a 2D (al cerrar)
window.addEventListener('beforeunload', () => {
    const estado3D = {
        elementosActualizados: [{ id, position, rotation }],
        ordenesNuevas: [{ unidadId, tipo, params }]
    };
    localStorage.setItem('maira_estado_3d', JSON.stringify(estado3D));
});
```

**Método 2: postMessage (Más robusto)**
```javascript
// En 2D
const ventana3D = window.open('test-terrain-from-map.html');
ventana3D.postMessage({
    tipo: 'INIT_3D',
    payload: estado2D
}, '*');

// En 3D
window.addEventListener('message', (event) => {
    if (event.data.tipo === 'INIT_3D') {
        cargarEstado2D(event.data.payload);
    }
});
```

### **3. Sincronización SIDC → Modelos 3D**

**Ubicación:** `Client/js/modules/shared/sidcToModel3D.js` (A CREAR)

```javascript
const SIDC_TO_MODEL = {
    // Infantería
    'SFGPUCII---': { model: 'soldier', scale: 1.0 },
    'SFGPUCIM---': { model: 'soldier_ru', scale: 0.001 },
    
    // Blindados
    'SFGPUCTA---': { model: 'tam', scale: 1.0 },
    'SFGPUCTR---': { model: 'm113', scale: 0.0018 },
    
    // Vehículos
    'SFGPUCVJ---': { model: 'jeep', scale: 1.0 }
};

function getModelFromSIDC(sidc) {
    return SIDC_TO_MODEL[sidc] || { model: 'soldier', scale: 1.0 };
}
```

---

## 🔧 GESTORES EXISTENTES (2D)

### **Estado Actual:**

| Gestor | Ubicación | Estado | Acción |
|--------|-----------|--------|--------|
| `gestorTurnos.js` | `Client/js/modules/juego/` | ⚠️ 2D only, no testeado | Revisar logs consola |
| `gestorFases.js` | `Client/js/modules/juego/` | ⚠️ 2D only, no testeado | Revisar logs consola |
| `gestorAcciones.js` | `Client/js/modules/juego/` | ⚠️ 2D only, no testeado | NO usar en 3D |
| `gestorInterfaz.js` | `Client/js/modules/juego/` | ❌ ROTO (Panel Integrado) | Fix clicks mapa + botones |

### **Problema Panel Integrado:**
- ✅ ANTES: Clicks en mapa funcionaban (marcar sector, zonas despliegue)
- ❌ AHORA: Clicks no responden
- ✅ Consola: Cambios de fase se logean pero UI no actualiza
- ❌ Botones: No se habilitan/deshabilitan según fase

**Causa probable:** Event listeners Leaflet conflicto con Panel Integrado

**Solución:** Usuario traerá archivos ANTES Panel Integrado para comparar

---

## 📦 DATOS NECESARIOS (2D → 3D)

### **Desde planeamiento.html:**
```javascript
const datosParaEnviar3D = {
    tipo: 'planeamiento',
    bounds: map.getBounds(),
    mcc: mccLayer.toGeoJSON(),
    mccf: mccfLayer.toGeoJSON(),
    elementos: elementosLayer.toGeoJSON(),
    configuracion: {
        verticalScale: 2.0,
        vegetationDensity: 0.6
    }
};
```

### **Desde juegodeguerra.html:**
```javascript
const datosParaEnviar3D = {
    tipo: 'combate',
    bounds: map.getBounds(),
    turnoActual: gestorTurnos.getTurnoActual(),
    faseActual: gestorFases.getFaseActual(),
    equipoActivo: gestorTurnos.getEquipoActivo(),
    jugadorActivo: gestorTurnos.getJugadorActivo(),
    elementos: elementosLayer.toGeoJSON(), // Con propiedades owner, team
    ordenesPendientes: gestorOrdenes.getOrdenesPendientes(),
    configuracionTurno: {
        duracionMinutos: config.duracionTurno,
        jugadoresPorEquipo: config.jugadoresPorEquipo
    }
};
```

---

## ✅ FIXES COMPLETADOS (test-terrain-from-map.html)

### **1. Sistema Movimiento con Waypoints**
- ✅ Waypoints color VERDE (usuario prefería original)
- ✅ TubeGeometry grosor 0.5m (visible todos navegadores)
- ✅ Fix posición final: `unit.position.copy(finalPos)` al terminar
- ✅ Fix hundimiento: raycasting continuo durante animación
- ✅ Fix sistema turnos: verificación ownership `unit.userData.player`

### **2. Sistema Segmentación Ruta por Turnos**
- ✅ Colores por turno: Verde (T1) → Amarillo (T2) → Rojo (T3) → Violeta (T4+)
- ✅ Cálculo: `distancePerTurn = velocidad × 3600s`
- ✅ Segmentación automática de waypoints que cruzan turnos
- ✅ TubeGeometry multi-color con opacity 0.8

### **3. Fix Árboles sin Follaje (VegetationInstancer)**
- ✅ Problema: fusión de meshes perdía materiales de follaje
- ✅ Solución: `useGroup` flag para modelos multi-mesh
- ✅ NO fusionar, usar Groups completos preservando materiales
- ✅ Forzar `visible=true`, `frustumCulled=false`, fix opacity
- ⏳ **PENDIENTE:** Usuario debe testear visualmente

### **4. Bounding Box Helpers + Logs Ultra-Detallados**
- ✅ BoxHelper amarillo alrededor de cada unidad
- ✅ Logs: visible ANTES/DESPUÉS, frustumCulled, opacity, color
- ✅ Warning materiales transparentes con opacity=0

---

## 🚧 PENDIENTE (Prioridad)

### **ALTA PRIORIDAD:**

1. **Fix Panel Integrado (juegodeguerra.html)**
   - Comparar con versión ANTES Panel Integrado
   - Restaurar clicks mapa (marcar sector, zonas despliegue)
   - Fix botones UI según fase/subfase

2. **Crear gestorOrdenes Unificado**
   - Reemplaza gestorAcciones.js (solo 2D)
   - Maneja órdenes 2D y 3D
   - Ejecuta en cambio de turno
   - Sincroniza estado bidireccional

3. **Testing Visual Árboles + FSB Operator**
   - Usuario debe probar y reportar si follaje se ve
   - FSB Operator completo (41 meshes)

4. **Protocolo Comunicación 2D ↔ 3D**
   - Implementar localStorage + Events
   - Función `sincronizar2Dto3D()`
   - Función `sincronizar3Dto2D()`

### **MEDIA PRIORIDAD:**

5. **Integrar elevationHandler**
   - Conectar `window.elevationHandler` con TerrainGenerator3D
   - Altimetría real desde tiles DEM

6. **Cargar unitModels desde JSON**
   - Eliminar hardcodeo (L536-582)
   - Usar `militaryDataService.loadData()`

7. **Integrar SlopeAnalysis + Transitability**
   - Modificar velocidad según terreno/vegetación
   - Afecta `distancePerTurn` en segmentación ruta

### **BAJA PRIORIDAD:**

8. **Modularizar test-terrain-from-map.html**
   - Extraer waypoints a `waypointManager.js`
   - Extraer movimiento a `movementController.js`
   - Reducir de 3474 líneas

---

## 📝 NOTAS IMPORTANTES

1. **NO crear archivos nuevos sin verificar si ya existen**
2. **NO modificar gestores 2D existentes sin análisis previo**
3. **gestorOrdenes debe ser ÚNICO y compartido 2D/3D**
4. **Sistema 3D independiente HASTA integración completa**
5. **Sincronización bidireccional al entrar/salir 3D**
6. **Órdenes se ejecutan en cambio de turno/equipo**
7. **Múltiples jugadores por equipo: cada uno controla SUS elementos**

---

**Última Actualización:** 8 de octubre de 2025  
**Próxima Revisión:** Después de fix Panel Integrado + testing visual
