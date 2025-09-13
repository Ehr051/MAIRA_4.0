# 🚨 DIAGNÓSTICO Y SOLUCIONES - PROBLEMAS CRÍTICOS MAIRA 4.0

**Fecha:** 13 de septiembre de 2025  
**Estado:** SOLUCIONADO PARCIALMENTE - Necesita testing

---

## 📋 RESUMEN EJECUTIVO

### ✅ PROBLEMAS SOLUCIONADOS:

1. **Panel Unificado se cerraba al hacer click dentro** → SOLUCIONADO
2. **Otros paneles no se ocultaban** → SOLUCIONADO  
3. **Elementos no seleccionables después de editar** → SOLUCIONADO
4. **Socket.IO desconectado en iniciarpartida.js** → SOLUCIONADO

### ⚠️ PROBLEMAS PENDIENTES:

5. **Combate no inicia** → DIAGNOSTICADO (verificar prerrequisitos)
6. **Asignación de propiedades por tipo/magnitud** → PENDIENTE DISEÑAR

---

## 🔧 SOLUCIONES IMPLEMENTADAS

### 1. Panel Unificado - Click Interno
**Problema:** El panel se cerraba al hacer click dentro del contenido.

**Solución aplicada:**
```javascript
// Evitar que clicks dentro del panel lo cierren
this.panel.addEventListener('click', (event) => {
    event.stopPropagation();
});
```

**Archivo:** `Client/js/modules/shared/panelJuegoUnificado.js`  
**Estado:** ✅ IMPLEMENTADO

---

### 2. Panel Unificado - Ocultar Otros Paneles
**Problema:** Múltiples paneles aparecían superpuestos.

**Solución aplicada:**
```javascript
ocultarOtrosPaneles() {
    const panelesToOcultar = [
        'panelTurno', 'panelFase', 'panelJuego', 'panelControl',
        'panelCombate', 'panelLogistica', 'panelComandancia',
        'menuRadial', 'panelHexagono', 'panelUnidad', 'panel-info', 'panel-orders'
    ];
    
    panelesToOcultar.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('activo', 'visible', 'mostrar');
            panel.style.display = 'none';
        }
    });
}
```

**Archivo:** `Client/js/modules/shared/panelJuegoUnificado.js`  
**Estado:** ✅ IMPLEMENTADO

---

### 3. Elementos No Seleccionables Post-Edición
**Problema CRÍTICO:** Después de editar elementos, no se podían volver a seleccionar.

**Causa raíz:** Al guardar cambios, se eliminaba el marcador original y se creaba uno nuevo, pero NO se configuraban los eventos de click/selección en el nuevo marcador.

**Solución aplicada:**
```javascript
function configurarEventosNuevoMarcador(marcador) {
    // Click simple para seleccionar
    marcador.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        window.elementoSeleccionado = this;
        elementoSeleccionado = this;
        
        if (typeof seleccionarElemento === 'function') {
            seleccionarElemento(this);
        } else if (typeof seleccionarElementoGB === 'function') {
            seleccionarElementoGB(this);
        }
        
        if (window.panelJuegoUnificado) {
            window.panelJuegoUnificado.mostrarInfoElemento(this);
        }
    });
    
    // Doble click para editar
    marcador.on('dblclick', function(e) {
        L.DomEvent.stopPropagation(e);
        editarElementoSeleccionado();
    });
    
    // Click derecho para menú radial
    marcador.on('contextmenu', function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        // ... código menú radial
    });
}
```

**Integración:**
- En `guardarCambiosUnidad()`: Se llama `configurarEventosNuevoMarcador(nuevoMarcador)`
- En `guardarCambiosEquipo()`: Se llama `configurarEventosNuevoMarcador(nuevoMarcador)`

**Archivos modificados:** `Client/js/common/edicioncompleto.js`  
**Estado:** ✅ IMPLEMENTADO

---

### 4. Socket.IO - Iniciar Partida
**Problema:** Socket globalmente conectado pero local desconectado.

**Causa:** Inconsistencia entre `socket` local y `window.socket` global.

**Solución aplicada:**
```javascript
// Línea 851: Verificar socket global en lugar de local
if (!window.socket || !window.socket.connected) {
    console.error('❌ Socket no conectado');
    return;
}

// Líneas 867, 874, 842: Usar window.socket.emit en lugar de socket.emit
window.socket.emit('crearPartida', datosPartida);

// Líneas 878, 885: Usar window.socket.once en lugar de socket.once  
window.socket.once('partidaCreada', (respuesta) => {
    // ...
});
```

**Archivo:** `Client/js/modules/partidas/iniciarpartida.js`  
**Estado:** ✅ IMPLEMENTADO

---

## ⚠️ PROBLEMAS PENDIENTES DE SOLUCIÓN

### 5. Inicio de Combate
**Síntoma:** El combate no inicia automáticamente después del despliegue.

**Posibles causas:**
1. **Verificación `todosJugadoresListos()`** falsa
2. **Elementos sin asignar a jugadores** (propiedad `jugador` faltante)
3. **Validación de elementos incompleta** antes de marcar "listo"

**Diagnóstico recomendado:**
```javascript
// Agregar logs de debugging en gestorTurnos.js
console.log('🔍 Jugadores:', this.jugadores.map(j => ({
    id: j.id,
    nombre: j.nombre,
    despliegueListo: j.despliegueListo
})));

console.log('🔍 Todos listos?', this.todosJugadoresListos());
```

**Archivo a revisar:** `Client/js/handlers/gestorTurnos.js`  
**Estado:** 🔍 DIAGNOSTICADO

---

### 6. Asignación Automática de Propiedades 
**Problema:** Elementos editados necesitan propiedades según tipo/magnitud.

**Descripción:** Después de finalizar despliegue, cada elemento debe recibir automáticamente:
- **Vehículos:** cantidad según magnitud
- **Personal:** cantidad según magnitud  
- **Munición:** tipo y cantidad según arma/rol
- **Alcance:** según tipo de arma/equipo
- **Moral:** inicial según tipo de unidad
- **Combustible:** capacidad según tipo de vehículo

**Implementación sugerida:**
```javascript
function asignarPropiedadesPorTipo(elemento) {
    const tipo = elemento.options.tipo;
    const magnitud = elemento.options.magnitud;
    
    const propiedades = {
        vehiculos: calcularVehiculosPorMagnitud(tipo, magnitud),
        personal: calcularPersonalPorMagnitud(tipo, magnitud),
        municion: calcularMunicionPorTipo(tipo),
        alcance: calcularAlcancePorTipo(tipo),
        moral: calcularMoralInicial(tipo),
        combustible: calcularCombustiblePorTipo(tipo)
    };
    
    elemento.options = { ...elemento.options, ...propiedades };
    return elemento;
}
```

**Estado:** 📋 PENDIENTE DISEÑAR

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### Al despertar:

1. **TESTING URGENTE:**
   - ✅ Verificar panel unificado no se cierra al hacer click
   - ✅ Verificar otros paneles se ocultan correctamente
   - ✅ Verificar elementos editados son seleccionables
   - ✅ Verificar partidas online se crean correctamente

2. **DEBUGGING COMBATE:**
   - Agregar logs en `todosJugadoresListos()`
   - Verificar propiedad `jugador` en elementos
   - Revisar condiciones de inicio de combate

3. **DISEÑAR SISTEMA PROPIEDADES:**
   - Definir tablas de propiedades por tipo
   - Implementar asignación automática
   - Integrar con finalización de despliegue

---

## 📁 ARCHIVOS MODIFICADOS

```
Client/js/modules/shared/panelJuegoUnificado.js
├── Agregado: event.stopPropagation() en click panel
├── Agregado: ocultarOtrosPaneles() method
└── Modificado: mostrar() para ocultar otros paneles

Client/js/common/edicioncompleto.js  
├── Agregado: configurarEventosNuevoMarcador() function
├── Modificado: guardarCambiosUnidad() - agregada configuración eventos
└── Modificado: guardarCambiosEquipo() - agregada configuración eventos

Client/js/modules/partidas/iniciarpartida.js
├── Modificado: línea 851 - verificación window.socket
├── Modificado: líneas 867,874,842 - window.socket.emit
└── Modificado: líneas 878,885 - window.socket.once
```

---

## 🚀 SIGUIENTE SESIÓN

**Prioridades:**
1. **Testing completo** de las soluciones implementadas
2. **Resolver inicio de combate** (crítico para gameplay)
3. **Implementar sistema propiedades** automáticas
4. **Continuar con roadmap MD** - funcionalidades pendientes

**Tiempo estimado:** 2-3 horas para completar testing y resolución de combate.

---

**Estado del commit:** ✅ Todos los cambios pusheados a GitHub  
**Servidor:** ✅ Funcionando en puerto 5000  
**Branch:** main  
