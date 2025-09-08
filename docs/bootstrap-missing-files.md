📋 **ANÁLISIS: Archivos JS NO cargados en bootstrap.js**

## 🚫 ARCHIVOS QUE NO ESTÁN EN NINGÚN MÓDULO DEL BOOTSTRAP

### 📁 HANDLERS (no cargados)
- ❌ `/Client/js/handlers/performanceOptimizer.js` 
- ❌ `/Client/js/handlers/EventBus.js`
- ❌ `/Client/js/handlers/pendienteHandler.js` 
- ❌ `/Client/js/handlers/transitabilidadHandler.js`

### 📁 MODULES (específicos no cargados)
- ❌ `/Client/js/modules/juego/gestorTurnos.js` (duplicado en handlers?)
- ❌ `/Client/js/modules/juego/juegodeguerra.js` (script principal juego?)
- ❌ `/Client/js/modules/gestion/GB.js` (¿qué es esto?)
- ❌ `/Client/js/modules/planeamiento/testPlaneamiento.js` (duplicado?)
- ❌ `/Client/js/modules/planeamiento/planeamiento.js` (script principal?)

### 📁 COMMON (no cargados)
- ❌ `/Client/js/common/unidades.js`
- ❌ `/Client/js/common/partidas.js`
- ❌ `/Client/js/common/leaflet.pattern.js`
- ❌ `/Client/js/common/elevation.worker.js` (worker duplicado?)

### 📁 UTILS (no cargados) 
- ❌ `/Client/js/utils/config.js`
- ❌ `/Client/js/utils/validacion.js`
- ❌ `/Client/js/utils/mini_tiles_loader.js`

### 📁 CORE (no cargados)
- ❌ `/Client/js/core/index.js` (ES6 module?)
- ❌ `/Client/js/core/moduleLoader.js`
- ❌ `/Client/js/core/MAIRACore.js`

### 📁 CONFIG
- ❌ `/Client/js/config/mairaConfig.js`

### 📁 GAMING (no todos cargados)
- ❌ `/Client/js/gaming/FogOfWar.js`

### 📁 UI (no todos cargados)
- ❌ `/Client/js/ui/emergency-patch.js`
- ❌ `/Client/js/ui/panelManager.js`

### 📁 FIXES (no cargados)
- ❌ `/Client/js/fixes/performance-emergency.js`
- ❌ `/Client/js/fixes/gb-patches.js`

### 📁 LEGACY (propósito = no cargar)
- 🗂️ `/Client/js/legacy/` (archivos obsoletos)

### 📁 EXAMPLES (no necesarios en producción)
- 🗂️ `/Client/js/examples/`

### 📁 WORKERS (especiales)
- ❌ `/Client/js/workers/vegetation.worker.js`
- ❌ `/Client/js/workers/elevation.worker.js`

### 📁 GESTURE CONTROL (cargado externamente)
- ❌ `/Client/js/gesture-control-web.js` (se carga directo en HTML)

---

## ❓ PREGUNTAS PARA CLASIFICAR:

1. **¿Dónde van estos handlers?** 
   - performanceOptimizer.js
   - EventBus.js  
   - pendienteHandler.js
   - transitabilidadHandler.js

2. **¿Estos modules son scripts principales?**
   - juegodeguerra.js
   - planeamiento.js
   - GB.js

3. **¿Estos utils son necesarios globalmente?**
   - config.js
   - validacion.js  
   - mini_tiles_loader.js

4. **¿Estos common deben ser globales?**
   - unidades.js
   - partidas.js

5. **¿Estos core son necesarios?**
   - index.js (ES6?)
   - moduleLoader.js
   - MAIRACore.js
