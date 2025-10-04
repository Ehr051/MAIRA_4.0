# 📁 Archivos Obsoletos - Sistema 3D MAIRA

Esta carpeta contiene archivos que quedaron fuera de uso después de la **consolidación del Sistema 3D Maestro Unificado**.

## 📋 Archivos Movidos

### 🔧 Sistemas 3D Anteriores (Consolidados)
- `maira3DSystem.js` - Sistema 3D anterior, reemplazado por `maira3DMaster.js`
- `maira3DIntegration.js` - Sistema de integración anterior, funcionalidad integrada en el maestro

### 🧪 Tests Antiguos (Reemplazados)
- `test-sistema-3d-completo.html` - Test anterior, reemplazado por `test-sistema-3d-maestro-completo.html`
- `test-tactico3d-simple.html` - Test simple antiguo, funcionalidad integrada en tests maestros
- `test_3d.html` - Test básico antiguo, reemplazado por tests exhaustivos

### 🔄 Backups y Versiones Debug
- `test_integrado_debug_backup.js` - Backup del archivo de debug, versión de desarrollo

## 🎯 Razón de la Consolidación

Después de unificar **6+ sistemas 3D fragmentados** en un **sistema maestro único**, estos archivos contenían:
- Código duplicado
- Funcionalidades obsoletas
- Tests redundantes
- Versiones de desarrollo no necesarias

## 📖 Sistema Actual

El sistema 3D actual está compuesto por:
- `maira3DMaster.js` - Sistema maestro unificado
- Componentes del ecosistema en `js/modules/gaming/`
- Tests unificados en `html+js-test/`

## ⚠️ Importante

**NO BORRAR** esta carpeta inmediatamente. Mantener como backup por al menos 30 días en caso de que se necesite recuperar alguna funcionalidad específica.

---
*Generado automáticamente durante la consolidación del Sistema 3D Maestro - Octubre 2025*