/**
 * SOLUCIONES CRÍTICAS - MAIRA 4.0
 * ================================
 * Parches inmediatos para resolver problemas identificados
 */

console.log('🔧 Aplicando parches críticos MAIRA 4.0...');

// ========================================
// 1. PARCHE USERIDENTITY - INICIARPARTIDA
// ========================================

// Interceptar errores de UserIdentity y crear fallback
(function() {
    window.MAIRAPatches = window.MAIRAPatches || {};
    
    // Asegurar que MAIRA.UserIdentity esté disponible
    if (!window.MAIRA) {
        window.MAIRA = {};
    }
    
    if (!window.MAIRA.UserIdentity) {
        console.warn('🔧 PARCHE: Creando UserIdentity fallback');
        
        window.MAIRA.UserIdentity = {
            getUserData: function() {
                return {
                    id: localStorage.getItem('userId') || 'user_' + Date.now(),
                    nombre: localStorage.getItem('username') || 'Usuario',
                    username: localStorage.getItem('username') || 'Usuario'
                };
            },
            getUserId: function() {
                return localStorage.getItem('userId') || 'user_' + Date.now();
            },
            getUsername: function() {
                return localStorage.getItem('username') || 'Usuario';
            },
            initialize: function(userId, username) {
                localStorage.setItem('userId', userId);
                localStorage.setItem('username', username);
                return { id: userId, nombre: username };
            }
        };
    }
    
    console.log('✅ PARCHE: UserIdentity fallback instalado');
})();

// ========================================
// 2. PARCHE THREEJS - ORBITCONTROLS
// ========================================

// Asegurar OrbitControls disponible para ThreeD
(function() {
    if (typeof window !== 'undefined') {
        // Esperar a que Three.js esté disponible
        const checkThreeJS = () => {
            if (window.THREE && typeof OrbitControls !== 'undefined') {
                window.THREE.OrbitControls = OrbitControls;
                console.log('✅ PARCHE: OrbitControls configurado correctamente');
                return true;
            }
            return false;
        };
        
        // Intentar inmediatamente
        if (!checkThreeJS()) {
            // Si no está disponible, intentar después de cargar
            setTimeout(() => {
                if (!checkThreeJS()) {
                    console.warn('⚠️ PARCHE: OrbitControls no disponible después de timeout');
                }
            }, 2000);
        }
    }
})();

// ========================================
// 3. PARCHE SOCKET.IO - EVENTOS PARTIDA
// ========================================

// Interceptar problemas de eventos socket.io
(function() {
    if (typeof window !== 'undefined') {
        window.MAIRAPatches.socketEventFix = function(socket) {
            if (!socket) return;
            
            // Wrapper para crear_partida
            const originalEmit = socket.emit;
            socket.emit = function(event, data, callback) {
                if (event === 'crear_partida') {
                    console.log('🔧 PARCHE: Interceptando crear_partida:', data);
                    
                    // Asegurar que los datos estén en el formato correcto
                    const fixedData = {
                        user_id: data.userId || data.user_id,
                        username: data.username || data.userName || 'Usuario',
                        configuracion: data.configuracion || {},
                        ...data
                    };
                    
                    console.log('🔧 PARCHE: Datos corregidos:', fixedData);
                    return originalEmit.call(this, event, fixedData, callback);
                }
                
                return originalEmit.call(this, event, data, callback);
            };
            
            console.log('✅ PARCHE: Socket.IO eventos corregidos');
        };
    }
})();

// ========================================
// 4. PARCHE FLUJO COMBATE
// ========================================

// Función para forzar inicio de combate (debug)
window.MAIRAPatches.forzarInicioCombate = function() {
    console.log('🔧 PARCHE: Forzando inicio de combate...');
    
    try {
        // Intentar diferentes formas de iniciar combate
        if (window.gestorTurnos && typeof window.gestorTurnos.iniciarCombate === 'function') {
            window.gestorTurnos.iniciarCombate();
            console.log('✅ PARCHE: Combate iniciado via gestorTurnos');
            return true;
        }
        
        if (window.gestorFases && typeof window.gestorFases.cambiarFase === 'function') {
            window.gestorFases.cambiarFase('combate');
            console.log('✅ PARCHE: Fase cambiada a combate via gestorFases');
            return true;
        }
        
        // Emitir evento manual
        document.dispatchEvent(new CustomEvent('iniciarCombate', {
            detail: { 
                fase: 'combate',
                timestamp: Date.now()
            }
        }));
        console.log('✅ PARCHE: Evento iniciarCombate disparado manualmente');
        return true;
        
    } catch (error) {
        console.error('❌ PARCHE: Error forzando combate:', error);
        return false;
    }
};

// ========================================
// 5. PARCHE HEXÁGONOS CELESTES
// ========================================

// Función para arreglar hexágonos celestes
window.MAIRAPatches.arreglarHexagonosCelestes = function() {
    console.log('🔧 PARCHE: Arreglando hexágonos celestes...');
    
    try {
        // Buscar elementos con fill celeste y corregirlos
        const elements = document.querySelectorAll('path[fill="#3498db"], path[fill="rgb(52, 152, 219)"]');
        elements.forEach(el => {
            el.setAttribute('fill', 'none');
            el.setAttribute('fill-opacity', '0');
        });
        
        // También corregir via CSS
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-interactive[fill="#3498db"],
            .leaflet-interactive[fill="rgb(52, 152, 219)"] {
                fill: none !important;
                fill-opacity: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ PARCHE: Hexágonos celestes corregidos');
        return true;
        
    } catch (error) {
        console.error('❌ PARCHE: Error corrigiendo hexágonos:', error);
        return false;
    }
};

// ========================================
// 6. AUTO-APLICAR PARCHES EN CARGA
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 PARCHES: Auto-aplicando correcciones...');
    
    // Aplicar parche de hexágonos después de un delay
    setTimeout(() => {
        window.MAIRAPatches.arreglarHexagonosCelestes();
    }, 3000);
    
    // Aplicar parche de socket si está disponible
    if (window.socket) {
        window.MAIRAPatches.socketEventFix(window.socket);
    }
    
    console.log('✅ PARCHES: Aplicación automática completada');
});

console.log('✅ Parches críticos MAIRA 4.0 cargados');
