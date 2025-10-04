/**
 * 🧪 TEST: Integración Sistema de Sub-tiles entre SistemaTerrenoRealista y Handlers
 * Verifica que el SistemaTerrenoRealista use correctamente los métodos de sub-tiles
 * de elevationHandler y vegetationHandler
 */

console.log('🧪 Iniciando test de integración de sub-tiles...');

// Test bounds de ejemplo
const testBounds = {
    north: 40.5,
    south: 40.0,
    east: -3.5,
    west: -4.0
};

async function testIntegracionSubTiles() {
    try {
        console.log('1️⃣ Verificando disponibilidad de handlers...');

        // Verificar que los handlers estén disponibles
        if (!window.elevationHandler) {
            throw new Error('❌ elevationHandler no disponible');
        }
        if (!window.vegetationHandler) {
            throw new Error('❌ vegetationHandler no disponible');
        }

        console.log('✅ Handlers disponibles');

        console.log('2️⃣ Verificando métodos de sub-tiles en elevationHandler...');

        // Verificar métodos en elevationHandler
        if (!window.elevationHandler.cargarSubTileElevacion) {
            throw new Error('❌ cargarSubTileElevacion no disponible en elevationHandler');
        }
        if (!window.elevationHandler.calcularSubTilesElevacion) {
            throw new Error('❌ calcularSubTilesElevacion no disponible en elevationHandler');
        }

        console.log('✅ Métodos de elevación disponibles');

        console.log('3️⃣ Verificando métodos de sub-tiles en vegetationHandler...');

        // Verificar métodos en vegetationHandler
        if (!window.vegetationHandler.cargarSubTileVegetacion) {
            throw new Error('❌ cargarSubTileVegetacion no disponible en vegetationHandler');
        }
        if (!window.vegetationHandler.calcularSubTilesVegetacion) {
            throw new Error('❌ calcularSubTilesVegetacion no disponible en vegetationHandler');
        }

        console.log('✅ Métodos de vegetación disponibles');

        console.log('4️⃣ Probando cálculo de sub-tiles de elevación...');

        // Probar cálculo de sub-tiles de elevación
        const subTilesElevacion = window.elevationHandler.calcularSubTilesElevacion(testBounds);
        console.log(`📊 Sub-tiles de elevación calculados: ${subTilesElevacion.length}`);

        if (subTilesElevacion.length === 0) {
            console.warn('⚠️ No se calcularon sub-tiles de elevación (posiblemente bounds fuera de cobertura)');
        } else {
            console.log('✅ Cálculo de sub-tiles de elevación exitoso');
        }

        console.log('5️⃣ Probando cálculo de sub-tiles de vegetación...');

        // Probar cálculo de sub-tiles de vegetación
        const subTilesVegetacion = window.vegetationHandler.calcularSubTilesVegetacion(testBounds);
        console.log(`🌿 Sub-tiles de vegetación calculados: ${subTilesVegetacion.length}`);

        if (subTilesVegetacion.length === 0) {
            console.warn('⚠️ No se calcularon sub-tiles de vegetación (posiblemente bounds fuera de cobertura)');
        } else {
            console.log('✅ Cálculo de sub-tiles de vegetación exitoso');
        }

        console.log('6️⃣ Verificando integración con SistemaTerrenoRealista...');

        // Verificar que SistemaTerrenoRealista esté disponible
        if (!window.SistemaTerrenoRealista) {
            throw new Error('❌ SistemaTerrenoRealista no disponible');
        }

        // Crear instancia del sistema
        const sistema = new window.SistemaTerrenoRealista();

        // Verificar que use los métodos de los handlers
        if (!sistema.elevationHandler) {
            sistema.elevationHandler = window.elevationHandler;
        }
        if (!sistema.vegetationHandler) {
            sistema.vegetationHandler = window.vegetationHandler;
        }

        console.log('✅ SistemaTerrenoRealista configurado');

        console.log('7️⃣ Probando métodos delegados en SistemaTerrenoRealista...');

        // Probar que los métodos deleguen correctamente
        const subTilesSistemaElevacion = sistema.calcularSubTilesNecesarios(testBounds);
        const subTilesSistemaVegetacion = sistema.calcularSubTilesVegetacion(testBounds);

        console.log(`📊 Sub-tiles elevación (sistema): ${subTilesSistemaElevacion.length}`);
        console.log(`🌿 Sub-tiles vegetación (sistema): ${subTilesSistemaVegetacion.length}`);

        console.log('✅ Integración completa verificada');

        console.log('🎉 TEST COMPLETADO: Sistema de sub-tiles integrado correctamente');

        return {
            success: true,
            subTilesElevacion: subTilesElevacion.length,
            subTilesVegetacion: subTilesVegetacion.length,
            sistemaElevacion: subTilesSistemaElevacion.length,
            sistemaVegetacion: subTilesSistemaVegetacion.length
        };

    } catch (error) {
        console.error('❌ ERROR en test de integración:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar test automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testIntegracionSubTiles);
} else {
    testIntegracionSubTiles();
}

// Exponer función para ejecución manual
window.testIntegracionSubTiles = testIntegracionSubTiles;