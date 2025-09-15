/**
 * 🎮 MAIRA 4.0 - Gestor de Vista 3D Unificado
 * Funciones para activar/desactivar la vista 3D en todos los modos
 */

async function toggleVista3DModular() {
    try {
        if (!window.sistema3D) {
            console.log('🎮 Inicializando Vista 3D modular...');
            
            // Crear contenedor flotante para la vista 3D
            let container = document.getElementById('vista3DContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'vista3DContainer';
                container.style.cssText = `
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 400px;
                    height: 320px;
                    background: #001133;
                    border: 2px solid #00ff00;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 20px rgba(0,255,0,0.3);
                `;
                
                container.innerHTML = `
                    <div style="padding: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: #00ff00; margin: 0; font-family: 'Courier New', monospace;">🎮 Vista 3D</h4>
                            <button onclick="cerrarVista3DModular()" style="background: rgba(255,0,0,0.2); border: 1px solid #ff6666; color: #ff6666; padding: 4px 8px; border-radius: 4px; cursor: pointer;">✕</button>
                        </div>
                        <canvas id="canvas-3d-flotante" width="380" height="260" style="border-radius: 4px; background: #000;"></canvas>
                        <div style="margin-top: 8px; font-size: 11px; color: #aaa; text-align: center;">
                            <span>🔄 Arrastrar para rotar • 🔍 Scroll para zoom • ESC para salir</span>
                        </div>
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
            await inicializarSistema3D('canvas-3d-flotante', {
                iluminacion: {
                    ambiente: { intensidad: 1.2 },
                    direccional: { intensidad: 1.5 }
                }
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
    const container = document.getElementById('vista3DContainer');
    if (container) {
        container.remove();
    }
    
    if (window.sistema3D) {
        window.sistema3D.limpiarEscena();
        window.sistema3D = null;
    }
    
    const btnVista3D = document.getElementById('btnVista3D');
    if (btnVista3D) {
        btnVista3D.innerHTML = '<i class="fas fa-cube"></i> Vista 3D';
    }
    
    console.log('🔒 Vista 3D modular cerrada');
};

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
window.inicializarSistema3D = inicializarSistema3D;

console.log('✅ Vista3DManager cargado - funciones disponibles globalmente');
