/**
 * Test básico para planeamiento
 * TODO: Implementar tests unitarios completos
 */

console.log('🧪 Test de Planeamiento - Modo desarrollo');

// Placeholder para tests futuros
window.testPlaneamiento = {
    init: function() {
        console.log('Tests de planeamiento inicializados');
    },
    
    runBasicTests: function() {
        console.log('Ejecutando tests básicos...');
        return true;
    }
};

// Auto-inicializar en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.testPlaneamiento.init();
}
