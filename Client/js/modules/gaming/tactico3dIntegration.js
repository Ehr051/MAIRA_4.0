/**
 * 🎮 MAIRA 4.0 - Integración Sistema Táctico 3D
 * 
 * Este módulo permite la integración entre el juego de guerra principal
 * y el sistema táctico 3D corregido con turnos alternados
 */

class Tactico3DIntegration {
    constructor() {
        this.ventana3D = null;
        this.datosCompartidos = null;
        this.estadoSincronizado = true;
        
        console.log('🔗 Tactico3DIntegration inicializado');
        this.inicializarIntegracion();
    }

    inicializarIntegracion() {
        // Escuchar eventos del gestor de fases para sincronización
        this.conectarEventos();
        
        console.log('✅ Tactico3DIntegration inicializado');
    }




    conectarEventos() {
        // Escuchar cambios de fase para habilitar/deshabilitar vista 3D
        if (window.gestorJuego?.gestorFases?.emisorEventos) {
            window.gestorJuego.gestorFases.emisorEventos.on('faseCambiada', (datos) => {
                this.actualizarDisponibilidad3D(datos.nuevaFase, datos.nuevaSubfase);
            });
        }

        // Escuchar eventos de elementos desplegados
        document.addEventListener('elementoDesplegado', (event) => {
            this.sincronizarElementosConVista3D(event.detail);
        });
    }

    actualizarDisponibilidad3D(fase, subfase) {
        // Esta función ya no maneja botones, solo registra cambios de fase
        console.log(`🔄 Fase cambiada: ${fase}/${subfase}`);
    }

    abrirVista3DTactica() {
        console.log('🚀 Abriendo Vista Táctica 3D...');

        // Preparar datos para transferir
        this.datosCompartidos = this.recopilarDatosCombate();

        // Verificar si ya existe una ventana 3D
        if (this.ventana3D && !this.ventana3D.closed) {
            this.ventana3D.focus();
            this.actualizarDatosVentana3D();
            return;
        }

        // Abrir nueva ventana con el sistema 3D
        const url = './juegodeguerra-tactico3d.html';
        const opciones = `
            width=1400,
            height=900,
            scrollbars=no,
            resizable=yes,
            status=no,
            location=no,
            toolbar=no,
            menubar=no
        `.replace(/\s+/g, '');

        this.ventana3D = window.open(url, 'vista3DTactica', opciones);

        // Configurar comunicación con la ventana 3D
        this.configurarComunicacionVentana3D();
    }

    recopilarDatosCombate() {
        const datos = {
            fase: window.gestorJuego?.gestorFases?.fase || 'preparacion',
            subfase: window.gestorJuego?.gestorFases?.subfase || 'definicion_sector',
            jugadorActual: window.gestorJuego?.gestorTurnos?.jugadorActual || 1,
            equipoJugador: window.equipoJugador || 'azul',
            elementos: [],
            configuracion: {
                tiempoPorTurno: 30,
                modoTiempoReal: false
            }
        };

        // Recopilar elementos militares desplegados
        if (window.mapa) {
            window.mapa.eachLayer((layer) => {
                if (layer.options && layer.options.sidc && layer.options.tipo === 'elemento') {
                    datos.elementos.push({
                        id: layer.options.id,
                        nombre: layer.options.nombre || 'Elemento Militar',
                        sidc: layer.options.sidc,
                        posicion: layer.getLatLng(),
                        equipo: layer.options.equipo || this.determinarEquipoPorSIDC(layer.options.sidc),
                        estado: {
                            operacional: true,
                            combustible: 100,
                            municion: 100,
                            daños: 0
                        }
                    });
                }
            });
        }

        // También recopilar de elementos GB si están disponibles
        if (window.elementosGB?.elementos) {
            Object.values(window.elementosGB.elementos).forEach(elemento => {
                if (elemento.sidc) {
                    datos.elementos.push({
                        id: elemento.id,
                        nombre: elemento.nombre || elemento.designacion,
                        sidc: elemento.sidc,
                        posicion: elemento.posicion,
                        equipo: elemento.equipo || this.determinarEquipoPorSIDC(elemento.sidc),
                        estado: elemento.estado || {
                            operacional: true,
                            combustible: 100,
                            municion: 100,
                            daños: 0
                        }
                    });
                }
            });
        }

        console.log(`📊 Datos recopilados: ${datos.elementos.length} elementos militares`);
        return datos;
    }

    determinarEquipoPorSIDC(sidc) {
        if (!sidc || sidc.length < 2) return 'neutral';
        
        const afiliacion = sidc[1];
        switch(afiliacion) {
            case 'F': return 'azul';    // Friendly
            case 'H': return 'rojo';    // Hostile
            case 'N': return 'neutral'; // Neutral
            case 'U': return 'neutral'; // Unknown
            default: return 'neutral';
        }
    }

    configurarComunicacionVentana3D() {
        // Esperar a que la ventana 3D se cargue
        const checkLoad = setInterval(() => {
            if (this.ventana3D && this.ventana3D.document && this.ventana3D.document.readyState === 'complete') {
                clearInterval(checkLoad);
                
                // Transferir datos a la ventana 3D
                setTimeout(() => {
                    this.transferirDatosAVentana3D();
                }, 1000);
            }
        }, 100);

        // Escuchar mensajes de la ventana 3D
        window.addEventListener('message', (event) => {
            if (event.source === this.ventana3D) {
                this.procesarMensajeVentana3D(event.data);
            }
        });
    }

    transferirDatosAVentana3D() {
        if (this.ventana3D && this.ventana3D.juegoGuerra3D) {
            console.log('📤 Transfiriendo datos a vista 3D...');
            
            // Enviar datos mediante postMessage
            this.ventana3D.postMessage({
                tipo: 'INICIALIZAR_COMBATE',
                datos: this.datosCompartidos
            }, '*');
        }
    }

    actualizarDatosVentana3D() {
        this.datosCompartidos = this.recopilarDatosCombate();
        
        if (this.ventana3D && !this.ventana3D.closed) {
            this.ventana3D.postMessage({
                tipo: 'ACTUALIZAR_DATOS',
                datos: this.datosCompartidos
            }, '*');
        }
    }

    procesarMensajeVentana3D(mensaje) {
        switch(mensaje.tipo) {
            case 'ORDENES_COMPLETADAS':
                this.sincronizarOrdenesDesdeVista3D(mensaje.ordenes);
                break;
            case 'CAMBIO_POSICION':
                this.actualizarPosicionEnMapa2D(mensaje.elemento, mensaje.nuevaPosicion);
                break;
            case 'SOLICITUD_AVANZAR_TURNO':
                this.avanzarTurnoEnJuegoPrincipal();
                break;
            case 'VISTA_CERRADA':
                this.limpiarReferenciasVentana3D();
                break;
        }
    }

    sincronizarOrdenesDesdeVista3D(ordenes) {
        console.log('🔄 Sincronizando órdenes desde vista 3D...');
        
        // Aplicar órdenes al sistema principal si es necesario
        ordenes.forEach(orden => {
            this.aplicarOrdenEnSistemaPrincipal(orden);
        });
    }

    actualizarPosicionEnMapa2D(elementoId, nuevaPosicion) {
        // Actualizar posición en el mapa 2D
        if (window.mapa) {
            window.mapa.eachLayer((layer) => {
                if (layer.options && layer.options.id === elementoId) {
                    layer.setLatLng(nuevaPosicion);
                }
            });
        }
    }

    avanzarTurnoEnJuegoPrincipal() {
        // Avanzar turno en el juego principal si es apropiado
        if (window.gestorJuego?.gestorTurnos?.avanzarTurno) {
            window.gestorJuego.gestorTurnos.avanzarTurno();
        }
    }

    aplicarOrdenEnSistemaPrincipal(orden) {
        // Aplicar orden específica al sistema principal
        console.log(`📋 Aplicando orden: ${orden.tipo} para ${orden.elementoId}`);
        
        // Aquí se pueden implementar efectos en el mapa 2D
        // como mostrar rutas de movimiento, indicadores de estado, etc.
    }

    limpiarReferenciasVentana3D() {
        this.ventana3D = null;
        console.log('🔌 Referencia a ventana 3D limpiada');
    }

    // Método público para cerrar la vista 3D
    cerrarVista3D() {
        if (this.ventana3D && !this.ventana3D.closed) {
            this.ventana3D.close();
        }
        this.limpiarReferenciasVentana3D();
    }
}

// Inicializar automáticamente DESHABILITADO - Para evitar conflictos con el mapa principal
// if (typeof window !== 'undefined' && window.document) {
//     window.addEventListener('DOMContentLoaded', () => {
//         // Verificar que estamos en el contexto correcto
//         if (document.title.includes('Juego de Guerra') || 
//             document.querySelector('#mapa') || 
//             window.gestorJuego) {
//             
//             window.tactico3DIntegration = new Tactico3DIntegration();
//             console.log('🎮 Integración Táctico 3D lista');
//         }
//     });
// }

console.log('📦 Tactico3DIntegration clase cargada - Auto-inicialización deshabilitada');

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tactico3DIntegration;
}
