# Gestión de Dependencias en MAIRA

## 🎯 **Estrategia Híbrida: CDN + Local**

MAIRA utiliza una estrategia híbrida para manejar dependencias que evita los problemas de subir `node_modules` a GitHub:

### ✅ **Ventajas de nuestro enfoque:**

1. **CDN como primario**: Carga rápida y global
2. **node_modules como fallback**: Funciona offline
3. **Dependency Manager automático**: Fallback transparente
4. **Sin subir binarios**: Repository limpio y rápido
5. **Multiplataforma**: Funciona en Windows/Mac/Linux

## 🏗️ **Arquitectura del Sistema**

```
┌─────────────────────────────────────┐
│           MAIRA Frontend            │
├─────────────────────────────────────┤
│      Dependency Manager v1.0       │
├─────────────────┬───────────────────┤
│   CDN (Primary) │ Local (Fallback)  │
├─────────────────┼───────────────────┤
│ ✅ unpkg.com    │ 💾 node_modules   │
│ ✅ jsdelivr.net │ 💾 Client/Libs    │
│ ✅ cdnjs.com    │ 💾 Local files    │
└─────────────────┴───────────────────┘
```

## 📦 **Dependencias Principales**

### Core Libraries
- **Leaflet 1.9.4**: Mapas base
- **D3 7.8.4**: Visualizaciones
- **Milsymbol 2.2.0**: Símbolos militares
- **Socket.IO 4.8.0**: Comunicación tiempo real

### Plugins de Leaflet
- `leaflet-draw`: Herramientas de dibujo
- `leaflet-fullscreen`: Pantalla completa
- `leaflet-control-geocoder`: Búsqueda geográfica
- `leaflet-markercluster`: Agrupación de marcadores
- `leaflet-easybutton`: Botones personalizados

## 🚀 **Configuración Rápida**

### Para Nuevos Desarrolladores

```bash
# 1. Clonar repositorio
git clone https://github.com/Ehr051/MAIRA.git
cd MAIRA

# 2. Ejecutar configuración automática
./setup-maira.sh

# 3. Iniciar servidor de desarrollo
./start-dev.sh
```

### Instalación Manual

```bash
# Instalar dependencias Node.js
npm install

# Instalar dependencias Python
pip install -r requirements.txt

# Verificar configuración
python3 scripts/verificar_rutas.py
```

## 🔧 **Uso del Dependency Manager**

### En HTML

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Cargar Dependency Manager primero -->
    <script src="../Client/js/dependency-manager.js"></script>
</head>
<body>
    <script>
        // Cargar todas las dependencias automáticamente
        async function inicializar() {
            await window.loadMAIRADependencies();
            
            // Ahora todas las librerías están disponibles
            const map = L.map('map').setView([-34.61, -58.39], 10);
            // ... resto del código
        }
        
        inicializar();
    </script>
</body>
</html>
```

### En JavaScript Modules

```javascript
import { DependencyManager } from './Client/js/dependency-manager.js';

const depManager = new DependencyManager();

// Cargar dependencias específicas
await depManager.loadDependencies([
    'leaflet',
    'milsymbol',
    'd3'
]);

// Verificar si están cargadas
if (depManager.isDependencyLoaded('leaflet')) {
    // Usar Leaflet
}
```

## 🌐 **CDN URLs Configuradas**

| Librería | CDN Primary | Fallback Local |
|----------|-------------|----------------|
| Leaflet | unpkg.com/leaflet@1.9.4 | node_modules/leaflet |
| Milsymbol | unpkg.com/milsymbol@2.2.0 | node_modules/milsymbol |
| D3 | unpkg.com/d3@7.8.4 | node_modules/d3 |
| Socket.IO | unpkg.com/socket.io-client@4.8.0 | node_modules/socket.io-client |

## 🛠️ **Configuración Avanzada**

### Agregar Nueva Dependencia

1. **Actualizar package.json**:
```bash
npm install nueva-libreria@1.0.0
```

2. **Agregar al Dependency Manager**:
```javascript
// En Client/js/dependency-manager.js
this.cdnMap = {
    // ... dependencias existentes
    'nueva-libreria': 'https://unpkg.com/nueva-libreria@1.0.0/dist/nueva-libreria.js'
};

this.localFallbacks = {
    // ... fallbacks existentes
    'nueva-libreria': '/node_modules/nueva-libreria/dist/nueva-libreria.js'
};
```

3. **Usar en el código**:
```javascript
await window.dependencyManager.loadDependency('nueva-libreria');
```

### Configurar Dependencias Personalizadas

```javascript
const customManager = new DependencyManager();

// Agregar CDN personalizado
customManager.cdnMap['mi-libreria'] = 'https://mi-cdn.com/mi-libreria.js';

// Cargar
await customManager.loadDependency('mi-libreria');
```

## 🧪 **Testing y Verificación**

### Scripts de Verificación

```bash
# Verificar todas las rutas
python3 scripts/verificar_rutas.py

# Test de URLs y conectividad
python3 scripts/test_urls.py

# Test completo del sistema
./run-tests.sh
```

### Test Manual en Browser

1. Abrir: `http://localhost:8000/static/template-dependency-manager.html`
2. Presionar "Inicializar MAIRA"
3. Verificar que todas las dependencias se cargan correctamente
4. Probar funcionalidades: Milsymbol, Geocoder, etc.

## 🚨 **Troubleshooting**

### Problema: Dependencias no cargan

```javascript
// Verificar estado
console.log(window.dependencyManager.getStats());

// Forzar recarga
window.dependencyManager.loadedDependencies.clear();
await window.loadMAIRADependencies();
```

### Problema: CDN bloqueado

```javascript
// Verificar si hay fallback local
const stats = window.dependencyManager.getStats();
console.log('Local fallbacks disponibles:', stats);

// Probar carga manual
await window.dependencyManager.loadFromUrl('/node_modules/leaflet/dist/leaflet.js', 'script');
```

### Problema: Versiones incompatibles

1. Verificar `package.json` vs CDN URLs
2. Actualizar versiones en `dependency-manager.js`
3. Ejecutar `npm update`

## 📈 **Rendimiento**

### Optimizaciones Implementadas

- **Carga paralela**: Múltiples dependencias simultáneas
- **Cache inteligente**: Evita recargas innecesarias
- **Fallback automático**: Sin intervención manual
- **CDN geográfico**: Distribución global

### Métricas Esperadas

- **Carga inicial**: < 3 segundos
- **Fallback tiempo**: < 500ms por dependencia
- **Cache hit ratio**: > 95% en uso normal

## 🔄 **Actualización de Dependencias**

### Proceso Recomendado

1. **Actualizar package.json**:
```bash
npm update
npm audit fix
```

2. **Actualizar CDN URLs** en `dependency-manager.js`

3. **Probar compatibilidad**:
```bash
./run-tests.sh
```

4. **Commit cambios**:
```bash
git add package.json package-lock.json Client/js/dependency-manager.js
git commit -m "📦 Actualizar dependencias a versión X.Y.Z"
```

## 🎯 **Best Practices**

### ✅ **Hacer**

- Usar CDN para librerías estables
- Mantener `package-lock.json` en el repo
- Probar ambos modos (CDN + local)
- Documentar nuevas dependencias

### ❌ **No hacer**

- Subir `node_modules` a Git
- Hardcodear URLs de CDN
- Mezclar versiones diferentes
- Ignorar `package-lock.json`

## 📚 **Referencias**

- [npm Best Practices](https://docs.npmjs.com/cli/v8/configuring-npm/package-lock-json)
- [unpkg CDN](https://unpkg.com/)
- [jsDelivr CDN](https://www.jsdelivr.com/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

---

**Última actualización**: Enero 2025  
**Versión Dependency Manager**: v1.0  
**Estado**: Producción
