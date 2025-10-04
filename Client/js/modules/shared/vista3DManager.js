/**
 * 🎮 MAIRA 4.0 - Gestor de Vista 3D Unificado
 * Funciones para activar/desactivar la vista 3D en todos los modos
 */

async function toggleVista3DModular() {
    try {
        if (!window.sistema3D) {
            console.log('🎮 Inicializando Vista 3D FULLSCREEN...');
            
            // Crear contenedor FULLSCREEN para la vista 3D
            let container = document.getElementById('vista3DContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'vista3DContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #001133;
                    z-index: 10000;
                    display: flex;
                    flex-direction: column;
                `;
                
                container.innerHTML = `
                    <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; gap: 10px; align-items: center;">
                        <h4 style="color: #00ff00; margin: 0; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">🎮 Vista 3D - Representación del Mapa</h4>
                        <button onclick="cerrarVista3DModular()" style="background: rgba(255,0,0,0.8); border: 1px solid #ff6666; color: #fff; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">✕ Salir del 3D</button>
                    </div>
                    <canvas id="canvas-3d-flotante" width="100%" height="100%" style="width: 100%; height: 100%; background: #87CEEB;"></canvas>
                    <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 14px; color: #00ff00; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); z-index: 10001;">
                        <span>🔄 Arrastrar para rotar • 🔍 Scroll para zoom • ESC para salir • Esta vista representa el área donde está viendo el usuario en el mapa</span>
                    </div>
                `;
                
                document.body.appendChild(container);
                
                // Agregar event listener para ESC
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && document.getElementById('vista3DContainer')) {
                        cerrarVista3DModular();
                    }
                });
            }
            
            // Inicializar sistema 3D modular
            // Calcular terreno basado en la vista actual del mapa 2D
            const terrenoOpciones = calcularTerrenoDesdeMapa();
            await inicializarSistema3D('canvas-3d-flotante', {
                iluminacion: {
                    ambiente: { intensidad: 1.2 },
                    direccional: { intensidad: 1.5 }
                },
                terreno: terrenoOpciones
            });
            
            // Cargar algunos modelos de ejemplo
            try {
                // Determinar qué tipo de modelos cargar según el modo
                const esJuegoGuerra = window.location.pathname.includes('juegodeguerra');
                const esGestionBatalla = window.location.pathname.includes('gestionbatalla');
                
                if (esJuegoGuerra || esGestionBatalla) {
                    // Cargar formación táctica completa para modos de combate
                    await window.sistema3D.cargarFormacionTactica();
                    
                    // Configurar navegación para combate
                    window.sistema3D.configurarNavegacionTactica();
                    
                    console.log('✅ Vista 3D táctica activada con formación de combate');
                } else {
                    // Modo planeamiento - formación básica
                    await window.sistema3D.cargarFormacionTactica();
                    
                    // Configurar navegación para planeamiento
                    window.sistema3D.configurarNavegacionTactica();
                    
                    console.log('✅ Vista 3D de planeamiento activada');
                }
                
            } catch (error) {
                console.warn('⚠️ Error cargando formación táctica, usando placeholders básicos');
                
                // Fallback a modelos básicos
                const modelosBasicos = [
                    { id: 'tam_tank', posicion: { x: 0, y: 0, z: 0 } },
                    { id: 'sk105', posicion: { x: 5, y: 0, z: 0 } },
                    { id: 'm113', posicion: { x: -5, y: 0, z: 0 } }
                ];
                
                await window.sistema3D.cargarFormacion(modelosBasicos);
                console.log('✅ Vista 3D con modelos básicos activada');
            }
            
        } else {
            // Ya está activa, cerrar
            cerrarVista3DModular();
        }
        
    } catch (error) {
        console.error('❌ Error en vista 3D modular:', error);
        
        // Mostrar modal de error más elegante
        const modalError = document.createElement('div');
        modalError.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        modalError.innerHTML = `
            <div style="background: #1a1a2e; border: 2px solid #ff6666; border-radius: 10px; padding: 20px; max-width: 400px; text-align: center;">
                <h3 style="color: #ff6666; margin-top: 0;">❌ Error Vista 3D</h3>
                <p style="color: #fff; margin: 15px 0;">${error.message}</p>
                <button onclick="this.closest('div').remove()" style="background: #ff6666; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(modalError);
    }
}

window.cerrarVista3DModular = function() {
    console.log('🔄 Cerrando Vista 3D fullscreen...');
    
    const container = document.getElementById('vista3DContainer');
    if (container) {
        container.remove();
        console.log('✅ Contenedor Vista 3D eliminado');
    }
    
    // Limpiar sistema 3D
    if (window.sistema3D) {
        if (typeof window.sistema3D.destruir === 'function') {
            window.sistema3D.destruir();
        }
        window.sistema3D = null;
        console.log('✅ Sistema 3D limpiado');
    }
    
    // Actualizar botón si existe
    const btnVista3D = document.getElementById('btnVista3D');
    if (btnVista3D) {
        btnVista3D.innerHTML = '<i class="fas fa-cube"></i> Vista 3D';
    }
    
    // Limpiar cualquier panel flotante residual
    if (typeof window.limpiarPanelesFlotantes3D === 'function') {
        window.limpiarPanelesFlotantes3D();
    }
    
    console.log('🔒 Vista 3D modular cerrada completamente - Regreso al mapa 2D');
};

// Función para calcular opciones de terreno basadas en la vista actual del mapa 2D
function calcularTerrenoDesdeMapa() {
    try {
        if (!window.mapa) {
            console.warn('Mapa no disponible, usando terreno por defecto');
            return { width: 1000, height: 1000 };
        }

        const bounds = window.mapa.getBounds();
        const zoom = window.mapa.getZoom();
        const center = window.mapa.getCenter();

        // Calcular el tamaño del terreno basado en el zoom
        // A mayor zoom, menor área visible, por lo tanto menor terreno
        const baseSize = 10000; // 10km base
        const zoomFactor = Math.pow(2, 13 - zoom); // Zoom 13 es el punto de referencia
        const terrainSize = Math.max(500, Math.min(5000, baseSize * zoomFactor));

        console.log(`🗺️ Terreno 3D calculado - Zoom: ${zoom}, Tamaño: ${terrainSize}m, Centro: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);

        return {
            width: terrainSize,
            height: terrainSize,
            center: center,
            zoom: zoom,
            bounds: bounds
        };
    } catch (error) {
        console.error('Error calculando terreno desde mapa:', error);
        return { width: 1000, height: 1000 };
    }
}

// Función para inicializar el sistema 3D si no está disponible
async function inicializarSistema3D(canvasId, opciones = {}) {
    try {
        // Verificar que Sistema3D esté disponible
        if (typeof Sistema3D === 'undefined') {
            throw new Error('Clase Sistema3D no disponible - verifique que sistema3d.js esté cargado');
        }
        
        // Crear instancia
        window.sistema3D = new Sistema3D();
        
        // Inicializar
        await window.sistema3D.inicializar(canvasId, opciones);
        
        console.log('✅ Sistema 3D inicializado correctamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando sistema 3D:', error);
        throw error;
    }
}

// Exportar funciones globalmente
window.toggleVista3DModular = toggleVista3DModular;
window.calcularTerrenoDesdeMapa = calcularTerrenoDesdeMapa;
window.inicializarSistema3D = inicializarSistema3D;

console.log('✅ Vista3DManager cargado - funciones disponibles globalmente');
