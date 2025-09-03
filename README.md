# MAIRA 4.0 - Sistema de Entrenamiento Militar Argentino

## 🚀 REPOSITORIO OFICIAL MAIRA 4.0

Arquitectura limpia y organizada para las Fuerzas Armadas Argentinas.

### ✅ Estado: MIGRACIÓN COMPLETADA

- ✅ Directorios organizados
- ✅ Archivos migrados desde MAIRA legacy  
- ✅ Arquitectura hexagonal/DDD implementada
- ✅ Minitiles geográficos organizados
- ✅ Sistema de release para datos pesados

## �️ **DATOS GEOGRÁFICOS**

Los datos geográficos (minitiles de altimetría y vegetación) se distribuyen por separado via **GitHub Release** para mantener el repositorio liviano.

### 📥 **Descarga Automática:**
```bash
python3 download_release_data.py
```

### 📦 **Descarga Manual:**
1. Ve a [Releases](https://github.com/Ehr051/MAIRA_4.0/releases/tag/v4.0)
2. Descarga:
   - `maira_altimetria_tiles.tar.gz` (145MB)
   - `maira_vegetacion_tiles.tar.gz` (1GB)
3. Extrae en `Client/Libs/datos_argentina/`

### 📊 **Datos Incluidos:**
- **Altimetría**: 9,501 minitiles (5 regiones de Argentina)
- **Vegetación**: 17 batches de datos NDVI
- **Total**: ~1.2GB de datos geográficos
