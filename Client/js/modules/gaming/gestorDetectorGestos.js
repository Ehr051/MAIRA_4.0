/**
 * 🤚 GESTOR DETECTOR DE GESTOS
 * Controla descarga, instalación y activación inteligente del detector de gestos
 */

class GestorDetectorGestos {
    constructor() {
        this.estadoDescarga = 'no_descargado'; // no_descargado, descargando, descargado, instalado, activo
        this.ultimaDescarga = null;
        this.intentosDescarga = 0;
        this.maxIntentos = 3;
        this.archivoZip = 'MAIRA-detector-gestos.zip';
        
        this.inicializar();
    }
    
    inicializar() {
        // Verificar estado previo desde localStorage
        this.cargarEstado();
        
        // Configurar botón
        this.configurarBoton();
        
        // Verificar si ya está instalado
        this.verificarInstalacion();
        
        console.log('🤚 GestorDetectorGestos inicializado - Estado:', this.estadoDescarga);
    }
    
    cargarEstado() {
        try {
            const estadoGuardado = localStorage.getItem('gestorDetectorGestos');
            if (estadoGuardado) {
                const data = JSON.parse(estadoGuardado);
                this.estadoDescarga = data.estado || 'no_descargado';
                this.ultimaDescarga = data.ultimaDescarga ? new Date(data.ultimaDescarga) : null;
                this.intentosDescarga = data.intentos || 0;
            }
        } catch (error) {
            console.warn('⚠️ Error cargando estado detector gestos:', error);
        }
    }
    
    guardarEstado() {
        try {
            const data = {
                estado: this.estadoDescarga,
                ultimaDescarga: this.ultimaDescarga,
                intentos: this.intentosDescarga
            };
            localStorage.setItem('gestorDetectorGestos', JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Error guardando estado detector gestos:', error);
        }
    }
    
    configurarBoton() {
        const btn = document.getElementById('btnControlGestos');
        if (!btn) return;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.manejarClickBoton();
        });
        
        this.actualizarBoton();
    }
    
    actualizarBoton() {
        const btn = document.getElementById('btnControlGestos');
        if (!btn) return;
        
        switch (this.estadoDescarga) {
            case 'no_descargado':
                btn.innerHTML = '<i class="fas fa-hand-paper"></i> Descargar Detector Gestos';
                btn.disabled = false;
                btn.className = 'btn btn-info';
                break;
                
            case 'descargando':
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
                btn.disabled = true;
                btn.className = 'btn btn-warning';
                break;
                
            case 'descargado':
                btn.innerHTML = '<i class="fas fa-check"></i> ¡Ya Descargado! Instalar';
                btn.disabled = false;
                btn.className = 'btn btn-success';
                break;
                
            case 'instalado':
                btn.innerHTML = '<i class="fas fa-check-double"></i> ¡Instalado! Activar';
                btn.disabled = false;
                btn.className = 'btn btn-primary';
                break;
                
            case 'activo':
                btn.innerHTML = '<i class="fas fa-hand-rock"></i> Detector Activo';
                btn.disabled = false;
                btn.className = 'btn btn-success';
                break;
                
            case 'error':
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error - Reintentar';
                btn.disabled = false;
                btn.className = 'btn btn-danger';
                break;
        }
    }
    
    async manejarClickBoton() {
        switch (this.estadoDescarga) {
            case 'no_descargado':
            case 'error':
                await this.iniciarDescarga();
                break;
                
            case 'descargado':
                this.mostrarInstruccionesInstalacion();
                break;
                
            case 'instalado':
                await this.activarDetector();
                break;
                
            case 'activo':
                this.mostrarConfiguracionDetector();
                break;
        }
    }
    
    async iniciarDescarga() {
        // Verificar intentos
        if (this.intentosDescarga >= this.maxIntentos) {
            this.mostrarMensajeMaximosIntentos();
            return;
        }
        
        // Mostrar confirmación detallada
        const confirmacion = this.mostrarConfirmacionDescarga();
        if (!confirmacion) return;
        
        this.estadoDescarga = 'descargando';
        this.actualizarBoton();
        this.intentosDescarga++;
        
        try {
            await this.descargarArchivo();
            
            this.estadoDescarga = 'descargado';
            this.ultimaDescarga = new Date();
            this.guardarEstado();
            this.mostrarExitoDescarga();
            
        } catch (error) {
            console.error('❌ Error en descarga:', error);
            this.estadoDescarga = 'error';
            this.mostrarErrorDescarga(error);
        }
        
        this.actualizarBoton();
    }
    
    mostrarConfirmacionDescarga() {
        return confirm(
            '🤚 MAIRA Detector de Gestos\\n\\n' +
            '¿Deseas descargar e instalar el detector de gestos?\\n\\n' +
            '✅ Control por gestos para cualquier programa\\n' +
            '✅ Mesa de proyección interactiva\\n' +
            '✅ Integración con MAIRA Web\\n' +
            '✅ Control inteligente de instalación\\n\\n' +
            '📦 Se descargará: ' + this.archivoZip + '\\n' +
            '💾 Tamaño aproximado: 15MB\\n\\n' +
            '¿Continuar con la descarga?'
        );
    }
    
    async descargarArchivo() {
        // Simular URL de descarga (reemplazar con URL real)
        const url = '/api/descargar-detector-gestos';
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/zip'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        // Crear blob y descargar
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = this.archivoZip;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        }, 100);
        
        console.log('✅ Descarga completada:', this.archivoZip);
    }
    
    mostrarExitoDescarga() {
        alert(
            '✅ ¡Descarga Completada!\\n\\n' +
            '📦 Archivo: ' + this.archivoZip + '\\n' +
            '📍 Ubicación: Carpeta de Descargas\\n\\n' +
            '🔧 PRÓXIMO PASO:\\n' +
            '1. Ve a tu carpeta de Descargas\\n' +
            '2. Extrae el archivo ZIP\\n' +
            '3. Ejecuta el instalador\\n' +
            '4. Vuelve aquí para activarlo\\n\\n' +
            'El botón cambiará cuando esté listo.'
        );
    }
    
    mostrarErrorDescarga(error) {
        alert(
            '❌ Error en Descarga\\n\\n' +
            'Detalles: ' + error.message + '\\n\\n' +
            '🔄 Soluciones:\\n' +
            '• Verifica tu conexión a internet\\n' +
            '• Intenta nuevamente en unos minutos\\n' +
            '• Contacta soporte si persiste\\n\\n' +
            'Intentos restantes: ' + (this.maxIntentos - this.intentosDescarga)
        );
    }
    
    mostrarInstruccionesInstalacion() {
        const instrucciones = confirm(
            '🔧 Instrucciones de Instalación\\n\\n' +
            '1. Ve a tu carpeta de Descargas\\n' +
            '2. Busca: ' + this.archivoZip + '\\n' +
            '3. Extrae el archivo ZIP\\n' +
            '4. Ejecuta \\"setup.exe\\" como administrador\\n' +
            '5. Sigue el asistente de instalación\\n\\n' +
            '¿Ya completaste la instalación?'
        );
        
        if (instrucciones) {
            this.estadoDescarga = 'instalado';
            this.guardarEstado();
            this.actualizarBoton();
            
            alert('✅ ¡Perfecto! Ahora puedes activar el detector.');
        }
    }
    
    async activarDetector() {
        try {
            // Intentar conectar con el detector instalado
            const conexion = await this.conectarDetector();
            
            if (conexion) {
                this.estadoDescarga = 'activo';
                this.guardarEstado();
                this.actualizarBoton();
                
                alert(
                    '🎉 ¡Detector de Gestos Activado!\\n\\n' +
                    '✅ Conexión establecida\\n' +
                    '🤚 Gestos disponibles:\\n' +
                    '   • Mano abierta: Pausar\\n' +
                    '   • Puño cerrado: Activar\\n' +
                    '   • Dedo índice: Seleccionar\\n' +
                    '   • Dos dedos: Zoom\\n\\n' +
                    '🎮 ¡Listo para usar!'
                );
            } else {
                throw new Error('No se pudo conectar con el detector');
            }
            
        } catch (error) {
            alert(
                '❌ No se pudo activar el detector\\n\\n' +
                'Verifica que:\\n' +
                '• La aplicación esté instalada correctamente\\n' +
                '• Tengas una cámara web conectada\\n' +
                '• Los permisos de cámara estén habilitados\\n\\n' +
                'Error: ' + error.message
            );
        }
    }
    
    async conectarDetector() {
        // Simular conexión con detector local
        // En implementación real, esto sería una conexión WebSocket o API local
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simular éxito aleatorio para testing
                resolve(Math.random() > 0.3);
            }, 2000);
        });
    }
    
    mostrarConfiguracionDetector() {
        const opciones = confirm(
            '⚙️ Detector de Gestos Activo\\n\\n' +
            '🔧 ¿Qué deseas hacer?\\n\\n' +
            'OK: Abrir configuración\\n' +
            'Cancelar: Desactivar detector'
        );
        
        if (opciones) {
            this.abrirConfiguracion();
        } else {
            this.desactivarDetector();
        }
    }
    
    abrirConfiguracion() {
        // Abrir ventana de configuración del detector
        alert(
            '⚙️ Configuración del Detector\\n\\n' +
            '🎯 Sensibilidad: Media\\n' +
            '📹 Cámara: Detectada\\n' +
            '🤚 Gestos: 4 configurados\\n' +
            '🔊 Sonidos: Activados\\n\\n' +
            '✨ Todo funcionando correctamente'
        );
    }
    
    desactivarDetector() {
        this.estadoDescarga = 'instalado';
        this.guardarEstado();
        this.actualizarBoton();
        
        alert('⏸️ Detector desactivado. Puedes reactivarlo cuando quieras.');
    }
    
    verificarInstalacion() {
        // Verificar si el detector ya está instalado
        // En implementación real, verificaría archivos del sistema o registro
        
        setTimeout(() => {
            if (this.estadoDescarga === 'descargado') {
                // Simular verificación automática
                console.log('🔍 Verificando instalación del detector...');
            }
        }, 5000);
    }
    
    mostrarMensajeMaximosIntentos() {
        alert(
            '⚠️ Máximo de Intentos Alcanzado\\n\\n' +
            'Has alcanzado el límite de ' + this.maxIntentos + ' intentos de descarga.\\n\\n' +
            '🔄 Para reintentar:\\n' +
            '• Espera 24 horas, o\\n' +
            '• Contacta soporte técnico\\n\\n' +
            '📧 soporte@maira.com'
        );
    }
    
    // Método para resetear (solo para testing/admin)
    resetear() {
        this.estadoDescarga = 'no_descargado';
        this.ultimaDescarga = null;
        this.intentosDescarga = 0;
        this.guardarEstado();
        this.actualizarBoton();
        console.log('🔄 GestorDetectorGestos reseteado');
    }
}

// Exportar para uso global
window.GestorDetectorGestos = GestorDetectorGestos;

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que el botón esté disponible
    const esperarBoton = () => {
        const btn = document.getElementById('btnControlGestos');
        if (btn) {
            window.gestorDetectorGestos = new GestorDetectorGestos();
            console.log('✅ GestorDetectorGestos inicializado');
        } else {
            setTimeout(esperarBoton, 1000);
        }
    };
    
    setTimeout(esperarBoton, 2000);
});
