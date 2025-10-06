/**
 * PRUEBA DE INTEGRACIÓN - MODELOS DE VEGETACIÓN MAIRA 4.0
 * =======================================================
 *
 * Verifica que los modelos de vegetación se integren correctamente
 * con el sistema 3D MAIRA.
 */

console.log('🧪 Iniciando pruebas de vegetación MAIRA 4.0...');

// Verificar que MAIRA3DMaster esté disponible
if (typeof MAIRA3DMaster === 'undefined') {
    console.error('❌ MAIRA3DMaster no está disponible');
} else {
    console.log('✅ MAIRA3DMaster encontrado');

    // Crear instancia de prueba
    const maira3d = new MAIRA3DMaster();

    // Verificar configuración de modelos de vegetación
    console.log('🔍 Verificando configuración de modelos...');
    const expectedModels = ['grass', 'tree_tall', 'tree_medium', 'bush'];

    expectedModels.forEach(modelType => {
        if (maira3d.config.models[modelType]) {
            console.log(`✅ Modelo ${modelType}: ${maira3d.config.models[modelType]}`);
        } else {
            console.error(`❌ Modelo ${modelType} no encontrado en configuración`);
        }
    });

    // Verificar métodos de vegetación
    console.log('🔍 Verificando métodos de vegetación...');
    const expectedMethods = ['addVegetation', 'clearVegetation', 'addTestVegetation'];

    expectedMethods.forEach(methodName => {
        if (typeof maira3d[methodName] === 'function') {
            console.log(`✅ Método ${methodName} disponible`);
        } else {
            console.error(`❌ Método ${methodName} no encontrado`);
        }
    });

    // Verificar SIDC mapping para vegetación
    console.log('🔍 Verificando mapeo SIDC para vegetación...');
    expectedModels.forEach(modelType => {
        const sidc = maira3d.getSIDCFromModelType(modelType);
        if (sidc === null) {
            console.log(`✅ ${modelType} correctamente mapeado como elemento ambiental (sin SIDC)`);
        } else {
            console.warn(`⚠️ ${modelType} tiene SIDC asignado: ${sidc}`);
        }
    });

    console.log('🎉 Pruebas de configuración completadas');
}

// Función para probar carga de modelos (requiere inicialización completa)
async function testVegetationLoading() {
    if (!window.maira3dInstance) {
        console.warn('⚠️ Instancia MAIRA 3D no inicializada para pruebas de carga');
        return;
    }

    console.log('🌱 Probando carga de modelos de vegetación...');

    const testData = {
        id: 'test_grass',
        type: 'grass',
        lat: -34.6037,
        lng: -58.3816,
        scale: 1,
        rotation: 0
    };

    try {
        const vegetation = await window.maira3dInstance.addVegetation(testData);
        if (vegetation) {
            console.log('✅ Modelo de vegetación cargado exitosamente');
        } else {
            console.error('❌ Error cargando modelo de vegetación');
        }
    } catch (error) {
        console.error('❌ Excepción al cargar vegetación:', error);
    }
}

// Exponer función de prueba global
window.testVegetationIntegration = testVegetationLoading;

console.log('📋 Para probar la carga de modelos, ejecuta: testVegetationIntegration()');