/**
 * 🧹 MAIRA 4.0 - Limpieza de Paneles 3D
 * Script para eliminar paneles flotantes no deseados y conflictos
 */

function limpiarPanelesFlotantes3D() {
    console.log('🧹 Iniciando limpieza de paneles flotantes 3D...');
    
    // Lista de IDs de paneles que pueden estar causando conflictos
    const panelesConflictivos = [
        'panel-vista-3d',
        'vista3d-panel-floating',
        'tactico-3d-panel',
        'floating-3d-container',
        'btn-vista-3d-tactica'
    ];
    
    let eliminados = 0;
    
    panelesConflictivos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.remove();
            eliminados++;
            console.log(`🗑️ Panel eliminado: ${id}`);
        }
    });
    
    // También buscar por clases comunes
    const clasesConflictivas = [
        '.panel-flotante-3d',
        '.vista-3d-floating',
        '.tactico-panel-float'
    ];
    
    clasesConflictivas.forEach(clase => {
        const elementos = document.querySelectorAll(clase);
        elementos.forEach(elemento => {
            elemento.remove();
            eliminados++;
            console.log(`🗑️ Panel eliminado por clase: ${clase}`);
        });
    });
    
    console.log(`✅ Limpieza completada - ${eliminados} elementos eliminados`);
    return eliminados;
}

// Función para prevenir creación de paneles flotantes
function prevenirPanelesFlotantes() {
    // Observer para detectar nuevos elementos problemáticos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Verificar si es un panel problemático
                        if (node.id && (
                            node.id.includes('panel-vista-3d') ||
                            node.id.includes('tactico-3d-panel') ||
                            node.id.includes('floating-3d')
                        )) {
                            console.warn(`🚫 Panel flotante detectado y eliminado: ${node.id}`);
                            node.remove();
                        }
                        
                        // Verificar clases problemáticas
                        if (node.className && (
                            node.className.includes('panel-flotante-3d') ||
                            node.className.includes('vista-3d-floating')
                        )) {
                            console.warn(`🚫 Panel flotante detectado por clase y eliminado: ${node.className}`);
                            node.remove();
                        }
                    }
                });
            }
        });
    });
    
    // Iniciar observación
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('🛡️ Monitor de paneles flotantes activado');
    return observer;
}

// Ejecutar limpieza al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        limpiarPanelesFlotantes3D();
        prevenirPanelesFlotantes();
    }, 1000);
});

// Función global para limpieza manual
window.limpiarPanelesFlotantes3D = limpiarPanelesFlotantes3D;

console.log('🧹 Sistema de limpieza de paneles 3D cargado');
