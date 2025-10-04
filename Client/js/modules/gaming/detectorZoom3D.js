/**
 * 🔍 DETECTOR DE ZOOM 3D
 * Detecta cuando el usuario hace zoom muy alto y sugiere cambiar a vista 3D
 */

class DetectorZoom3D {
    constructor(map) {
        this.map = map;
        this.umbralZoom = 14; // Zoom nivel donde se sugiere 3D (bajado para mayor accesibilidad)
        this.modalMostrado = false;
        this.ultimaVezPreguntado = 0;
        this.intervaloPreguntas = 15000; // 15 segundos entre preguntas (reducido)
        
        this.inicializar();
    }
    
    inicializar() {
        if (!this.map) {
            console.warn('⚠️ DetectorZoom3D: Mapa no disponible');
            return;
        }
        
        // Escuchar eventos de zoom
        this.map.on('zoomend', () => {
            this.verificarZoom();
        });
        
        console.log('🔍 DetectorZoom3D inicializado - Umbral:', this.umbralZoom);
    }
    
    verificarZoom() {
        const zoomActual = this.map.getZoom();
        const ahora = Date.now();
        
        // Si el zoom es alto y no hemos preguntado recientemente
        if (zoomActual >= this.umbralZoom && 
            !this.modalMostrado && 
            (ahora - this.ultimaVezPreguntado) > this.intervaloPreguntas) {
            
            this.mostrarSugerencia3D();
        }
    }
    
    mostrarSugerencia3D() {
        if (this.modalMostrado) return;
        
        this.modalMostrado = true;
        this.ultimaVezPreguntado = Date.now();
        
        // Crear modal elegante
        const modal = this.crearModal();
        document.body.appendChild(modal);
        
        // Mostrar con animación
        setTimeout(() => {
            modal.classList.add('visible');
        }, 100);
    }
    
    crearModal() {
        const modal = document.createElement('div');
        modal.className = 'zoom-3d-modal';
        modal.innerHTML = `
            <div class="zoom-3d-overlay">
                <div class="zoom-3d-dialog">
                    <div class="zoom-3d-header">
                        <i class="fas fa-cube"></i>
                        <h3>Vista 3D Recomendada</h3>
                    </div>
                    <div class="zoom-3d-body">
                        <p>Has hecho zoom muy cerca del terreno.</p>
                        <p><strong>¿Deseas cambiar a la vista 3D</strong> para una mejor experiencia táctica?</p>
                    </div>
                    <div class="zoom-3d-footer">
                        <button class="btn-cancelar" onclick="this.closest('.zoom-3d-modal').remove(); window.detectorZoom3D.modalMostrado = false;">
                            <i class="fas fa-times"></i> No, gracias
                        </button>
                        <button class="btn-confirmar" onclick="this.closest('.zoom-3d-modal').remove(); window.detectorZoom3D.activarVista3D();">
                            <i class="fas fa-cube"></i> Sí, cambiar a 3D
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar estilos
        if (!document.getElementById('zoom-3d-styles')) {
            const styles = document.createElement('style');
            styles.id = 'zoom-3d-styles';
            styles.textContent = `
                .zoom-3d-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .zoom-3d-modal.visible {
                    opacity: 1;
                    visibility: visible;
                }
                
                .zoom-3d-overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(3px);
                }
                
                .zoom-3d-dialog {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #4a90c2;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    max-width: 450px;
                    margin: 20px;
                    overflow: hidden;
                    transform: scale(0.8);
                    transition: transform 0.3s ease;
                }
                
                .zoom-3d-modal.visible .zoom-3d-dialog {
                    transform: scale(1);
                }
                
                .zoom-3d-header {
                    background: linear-gradient(135deg, #4a90c2, #2d5a87);
                    color: white;
                    padding: 20px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                
                .zoom-3d-header i {
                    font-size: 24px;
                    animation: pulse 2s infinite;
                }
                
                .zoom-3d-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .zoom-3d-body {
                    padding: 25px;
                    color: #e0e0e0;
                    text-align: center;
                    line-height: 1.6;
                }
                
                .zoom-3d-body p {
                    margin: 0 0 10px 0;
                }
                
                .zoom-3d-footer {
                    padding: 20px;
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .zoom-3d-footer button {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-cancelar {
                    background: rgba(255, 255, 255, 0.1);
                    color: #ccc;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .btn-cancelar:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }
                
                .btn-confirmar {
                    background: linear-gradient(135deg, #4a90c2, #2d5a87);
                    color: white;
                    box-shadow: 0 4px 15px rgba(74, 144, 194, 0.3);
                }
                
                .btn-confirmar:hover {
                    background: linear-gradient(135deg, #5ba0d2, #3d6a97);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(74, 144, 194, 0.4);
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        return modal;
    }
    
    activarVista3D() {
        console.log('🚀 Activando vista 3D...');
        
        // Prioridad 1: Sistema MAIRA 3D Master unificado
        if (window.maira3DSystem && typeof window.maira3DSystem.cambiarAVista3D === 'function') {
            try {
                window.maira3DSystem.cambiarAVista3D();
                console.log('✅ Sistema MAIRA 3D Master activado');
                return;
            } catch (error) {
                console.warn('⚠️ Error activando Sistema MAIRA 3D Master:', error);
            }
        }
        
        // Prioridad 2: Visor Mapa 3D Mejorado instanciado
        if (window.visorMapa3DMejorado && typeof window.visorMapa3DMejorado.cambiarAVista3D === 'function') {
            try {
                window.visorMapa3DMejorado.cambiarAVista3D();
                console.log('✅ Visor Mapa 3D Mejorado activado');
                return;
            } catch (error) {
                console.warn('⚠️ Error activando Visor Mapa 3D Mejorado:', error);
            }
        }
        
        // Prioridad 3: Crear nueva instancia si las clases están disponibles
        if (typeof VisorMapa3DMejorado !== 'undefined') {
            try {
                const visor3D = new VisorMapa3DMejorado('map');
                if (typeof visor3D.initialize === 'function') {
                    visor3D.initialize();
                } else if (typeof visor3D.cambiarAVista3D === 'function') {
                    visor3D.cambiarAVista3D();
                }
                console.log('✅ Nueva instancia Visor 3D creada y activada');
                return;
            } catch (error) {
                console.warn('⚠️ Error creando nueva instancia Visor 3D:', error);
            }
        }
        
        // Prioridad 4: Funciones legacy
        if (window.abrirVistaExtendida3D && typeof window.abrirVistaExtendida3D === 'function') {
            try {
                window.abrirVistaExtendida3D();
                console.log('✅ Vista 3D extendida legacy activada');
                return;
            } catch (error) {
                console.warn('⚠️ Error activando vista 3D extendida legacy:', error);
            }
        }
        
        // Fallback: modal informativo
        console.warn('⚠️ No se encontraron sistemas 3D disponibles');
        this.mostrarModalFallback3D();
    }
    
    mostrarModalFallback3D() {
        const modal = document.createElement('div');
        modal.className = 'zoom-3d-modal';
        modal.innerHTML = `
            <div class="zoom-3d-overlay">
                <div class="zoom-3d-dialog">
                    <div class="zoom-3d-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Vista 3D No Disponible</h3>
                    </div>
                    <div class="zoom-3d-body">
                        <p>El sistema 3D no está disponible en este momento.</p>
                        <p>Asegúrate de que todos los scripts 3D estén cargados correctamente.</p>
                    </div>
                    <div class="zoom-3d-footer">
                        <button class="btn-cancelar" onclick="this.closest('.zoom-3d-modal').remove(); window.detectorZoom3D.modalMostrado = false;">
                            <i class="fas fa-times"></i> Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => {
            modal.classList.add('visible');
        }, 100);
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                this.modalMostrado = false;
            }
        }, 5000);
    }
    
    // Método para ajustar umbral dinámicamente
    configurarUmbral(nuevoUmbral) {
        this.umbralZoom = nuevoUmbral;
        console.log('🔍 Umbral de zoom 3D actualizado a:', nuevoUmbral);
    }
    
    // Destructor
    destruir() {
        if (this.map) {
            this.map.off('zoomend');
        }
        
        // Limpiar estilos
        const styles = document.getElementById('zoom-3d-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('🔍 DetectorZoom3D destruido');
    }
}

// Exportar para uso global
window.DetectorZoom3D = DetectorZoom3D;

// Auto-inicialización si hay mapa disponible
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el mapa esté disponible
    const esperarMapa = () => {
        // Verificar tanto window.mapa como window.map para compatibilidad
        const mapaInstance = window.mapa || window.map;
        if (mapaInstance) {
            window.detectorZoom3D = new DetectorZoom3D(mapaInstance);
            console.log('✅ DetectorZoom3D auto-inicializado con mapa:', mapaInstance ? 'encontrado' : 'no encontrado');
        } else {
            console.log('🔍 Esperando mapa... intento en 1s');
            setTimeout(esperarMapa, 1000);
        }
    };
    
    setTimeout(esperarMapa, 2000); // Dar tiempo a que se cargue el mapa
});
