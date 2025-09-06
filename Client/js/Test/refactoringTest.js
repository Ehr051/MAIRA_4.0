/**
 * 🧪 SCRIPT DE PRUEBA - Refactorización de herramientasP.js
 * 
 * Verifica que todos los módulos refactorizados funcionen correctamente
 * y mantengan compatibilidad hacia atrás.
 */

class RefactoringTest {
    constructor() {
        this.resultados = [];
        this.errores = [];
        console.log('🧪 RefactoringTest inicializado');
    }

    /**
     * Ejecuta todas las pruebas
     */
    async ejecutarTodasLasPruebas() {
        console.log('🚀 Iniciando pruebas de refactorización...');

        try {
            // Esperar a que se carguen los módulos
            await this.esperarCargaCompleta();

            // Pruebas de carga de módulos
            this.probarCargaModulos();

            // Pruebas de funciones globales
            this.probarFuncionesGlobales();

            // Pruebas de inicialización
            this.probarInicializacion();

            // Pruebas de compatibilidad
            this.probarCompatibilidad();

            // Pruebas de funcionalidad básica
            await this.probarFuncionalidadBasica();

            // Mostrar resultados
            this.mostrarResultados();

        } catch (error) {
            console.error('❌ Error ejecutando pruebas:', error);
            this.errores.push(`Error global: ${error.message}`);
        }
    }

    /**
     * Espera a que se carguen todos los módulos
     */
    esperarCargaCompleta() {
        return new Promise((resolve) => {
            const verificar = () => {
                const modulosRequeridos = [
                    'measurementHandler',
                    'elevationProfileService',
                    'mapInteractionHandler', 
                    'geometryUtils',
                    'mobileOptimizationHandler',
                    'toolsInitializer'
                ];

                const cargados = modulosRequeridos.every(modulo => window[modulo]);
                
                if (cargados) {
                    resolve();
                } else {
                    setTimeout(verificar, 100);
                }
            };

            verificar();
        });
    }

    /**
     * Prueba la carga de módulos
     */
    probarCargaModulos() {
        console.log('📦 Probando carga de módulos...');

        const modulos = {
            'MeasurementHandler': 'window.measurementHandler',
            'ElevationProfileService': 'window.elevationProfileService', 
            'MapInteractionHandler': 'window.mapInteractionHandler',
            'GeometryUtils': 'window.geometryUtils',
            'MobileOptimizationHandler': 'window.mobileOptimizationHandler',
            'ToolsInitializer': 'window.toolsInitializer'
        };

        Object.entries(modulos).forEach(([nombre, path]) => {
            const modulo = this.evaluarPath(path);
            if (modulo) {
                this.resultados.push(`✅ ${nombre} cargado correctamente`);
            } else {
                this.errores.push(`❌ ${nombre} no se pudo cargar`);
            }
        });
    }

    /**
     * Prueba las funciones globales exportadas
     */
    probarFuncionesGlobales() {
        console.log('🌍 Probando funciones globales...');

        const funcionesGlobales = [
            'medirDistancia',
            'addDistancePoint',
            'finalizarMedicion',
            'mostrarGraficoPerfil',
            'calcularDistancia',
            'crearLinea',
            'actualizarLinea',
            'seleccionarElemento',
            'deseleccionarElemento',
            'detectarDispositivoMovil'
        ];

        funcionesGlobales.forEach(func => {
            if (typeof window[func] === 'function') {
                this.resultados.push(`✅ window.${func} disponible`);
            } else {
                this.errores.push(`❌ window.${func} no disponible`);
            }
        });
    }

    /**
     * Prueba la inicialización
     */
    probarInicializacion() {
        console.log('🔧 Probando inicialización...');

        if (window.toolsInitializer) {
            const estado = window.toolsInitializer.obtenerEstado();
            
            if (estado.inicializado) {
                this.resultados.push('✅ ToolsInitializer: Inicialización completada');
            } else {
                this.errores.push('❌ ToolsInitializer: No inicializado');
            }

            // Verificar módulos
            Object.entries(estado.modulos).forEach(([modulo, disponible]) => {
                if (disponible) {
                    this.resultados.push(`✅ Módulo ${modulo}: Disponible`);
                } else {
                    this.errores.push(`❌ Módulo ${modulo}: No disponible`);
                }
            });

            // Verificar funciones
            Object.entries(estado.funciones).forEach(([func, disponible]) => {
                if (disponible) {
                    this.resultados.push(`✅ Función ${func}: Disponible`);
                } else {
                    this.errores.push(`❌ Función ${func}: No disponible`);
                }
            });
        } else {
            this.errores.push('❌ ToolsInitializer no disponible');
        }
    }

    /**
     * Prueba la compatibilidad hacia atrás
     */
    probarCompatibilidad() {
        console.log('🔄 Probando compatibilidad hacia atrás...');

        // Simular event listeners existentes
        const btnMedirDistancia = document.getElementById('btnMedirDistancia');
        if (btnMedirDistancia) {
            // Verificar que el botón responde
            try {
                const evento = new Event('click');
                btnMedirDistancia.dispatchEvent(evento);
                this.resultados.push('✅ Event listener btnMedirDistancia: Funcional');
            } catch (error) {
                this.errores.push(`❌ Event listener btnMedirDistancia: ${error.message}`);
            }
        } else {
            this.resultados.push('ℹ️ btnMedirDistancia no encontrado (normal en algunas páginas)');
        }

        // Verificar mapa de migración
        if (window.HERRAMIENTAS_P_MIGRATION_MAP) {
            this.resultados.push('✅ Mapa de migración: Cargado');
            this.resultados.push(`ℹ️ Módulos creados: ${window.HERRAMIENTAS_P_MIGRATION_MAP.refactorization_info.total_modules_created}`);
        } else {
            this.errores.push('❌ Mapa de migración: No disponible');
        }
    }

    /**
     * Prueba funcionalidad básica
     */
    async probarFuncionalidadBasica() {
        console.log('⚙️ Probando funcionalidad básica...');

        // Prueba de cálculo de distancia
        try {
            const punto1 = [-58.3816, -34.6037]; // Buenos Aires
            const punto2 = [-58.3976, -34.6118]; // Punto cercano

            const distancia = window.calcularDistancia(punto1, punto2);
            if (distancia > 0) {
                this.resultados.push(`✅ Cálculo de distancia: ${(distancia/1000).toFixed(2)} km`);
            } else {
                this.errores.push('❌ Cálculo de distancia: Resultado inválido');
            }
        } catch (error) {
            this.errores.push(`❌ Cálculo de distancia: ${error.message}`);
        }

        // Prueba de detección móvil
        try {
            const esMovil = window.detectarDispositivoMovil();
            this.resultados.push(`✅ Detección móvil: ${esMovil ? 'Móvil' : 'Escritorio'}`);
        } catch (error) {
            this.errores.push(`❌ Detección móvil: ${error.message}`);
        }

        // Prueba de geometría
        try {
            const linea = window.crearLinea([0, 0], [1, 1], { color: '#test' });
            if (linea) {
                this.resultados.push('✅ Creación de línea: Exitosa');
            } else {
                this.errores.push('❌ Creación de línea: Falló');
            }
        } catch (error) {
            this.errores.push(`❌ Creación de línea: ${error.message}`);
        }
    }

    /**
     * Evaluación segura de paths
     */
    evaluarPath(path) {
        try {
            return eval(path);
        } catch (error) {
            return null;
        }
    }

    /**
     * Muestra los resultados de las pruebas
     */
    mostrarResultados() {
        console.log('\n📊 RESULTADOS DE PRUEBAS DE REFACTORIZACIÓN');
        console.log('='.repeat(50));

        console.log(`\n✅ ÉXITOS (${this.resultados.length}):`);
        this.resultados.forEach(resultado => console.log(resultado));

        if (this.errores.length > 0) {
            console.log(`\n❌ ERRORES (${this.errores.length}):`);
            this.errores.forEach(error => console.log(error));
        }

        const porcentajeExito = Math.round(
            (this.resultados.length / (this.resultados.length + this.errores.length)) * 100
        );

        console.log(`\n📈 PORCENTAJE DE ÉXITO: ${porcentajeExito}%`);
        console.log('='.repeat(50));

        // Mostrar en DOM si es posible
        this.mostrarResultadosEnDOM(porcentajeExito);
    }

    /**
     * Muestra resultados en el DOM
     */
    mostrarResultadosEnDOM(porcentajeExito) {
        try {
            let panel = document.getElementById('refactoring-test-results');
            
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'refactoring-test-results';
                panel.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    background: white;
                    border: 2px solid ${porcentajeExito >= 90 ? '#28a745' : porcentajeExito >= 70 ? '#ffc107' : '#dc3545'};
                    border-radius: 8px;
                    padding: 15px;
                    z-index: 10000;
                    font-family: monospace;
                    font-size: 12px;
                    max-width: 400px;
                    max-height: 300px;
                    overflow-y: auto;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(panel);
            }

            panel.innerHTML = `
                <h4 style="margin: 0 0 10px 0; color: ${porcentajeExito >= 90 ? '#28a745' : '#dc3545'}">
                    🧪 Test Refactorización: ${porcentajeExito}%
                </h4>
                <div style="margin-bottom: 10px;">
                    <strong>✅ Éxitos:</strong> ${this.resultados.length}<br>
                    <strong>❌ Errores:</strong> ${this.errores.length}
                </div>
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    cursor: pointer;
                ">×</button>
                <details>
                    <summary>Ver detalles</summary>
                    <div style="font-size: 10px; margin-top: 10px;">
                        ${this.resultados.concat(this.errores).map(item => `<div>${item}</div>`).join('')}
                    </div>
                </details>
            `;

            // Auto-remover después de 10 segundos si todo está bien
            if (porcentajeExito >= 90) {
                setTimeout(() => {
                    if (panel.parentElement) {
                        panel.remove();
                    }
                }, 10000);
            }

        } catch (error) {
            console.log('ℹ️ No se pudo mostrar resultados en DOM:', error.message);
        }
    }
}

// Auto-ejecutar las pruebas cuando se carga el script
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const test = new RefactoringTest();
        await test.ejecutarTodasLasPruebas();
    }, 2000); // Esperar 2 segundos para que todo se cargue
});

// Exportar para uso manual
window.RefactoringTest = RefactoringTest;

console.log('🧪 Script de pruebas de refactorización cargado');
