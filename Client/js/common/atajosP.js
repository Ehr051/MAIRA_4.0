// atajosP.js - VERSIÓN COMPATIBLE MAC

// ✅ DETECCIÓN DE PLATAFORMA MODERNA (sin deprecated)
function detectarPlataforma() {
    // Método moderno: navigator.userAgentData (Chrome 90+)
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        return navigator.userAgentData.platform.toLowerCase().includes('mac');
    }
    
    // Fallback 1: navigator.userAgent
    if (navigator.userAgent) {
        return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    }
    
    // Fallback 2: detección por características específicas de Mac
    if (navigator.maxTouchPoints !== undefined) {
        // En Mac desktop, maxTouchPoints es 0
        // En dispositivos iOS es > 0
        return navigator.maxTouchPoints === 0 && /Safari/.test(navigator.userAgent);
    }
    
    // Último recurso: asumir PC
    return false;
}

var esMac = detectarPlataforma();
var teclaModificador = esMac ? 'Meta' : 'Ctrl';
var nombreModificador = esMac ? 'Cmd' : 'Ctrl';

// ✅ ATAJOS COMPATIBLES MAC/PC
var atajos = {
    // Operaciones básicas - Compatible Mac/PC
    [teclaModificador + '+Z']: { descripcion: `Deshacer (${nombreModificador}+Z)`, funcion: 'deshacerAccion', categoria: 'edicion' },
    [teclaModificador + '+Y']: { descripcion: `Rehacer (${nombreModificador}+Y)`, funcion: 'rehacerAccion', categoria: 'edicion' },
    [teclaModificador + '+S']: { descripcion: `Guardar calco (${nombreModificador}+S)`, funcion: 'guardarCalco', categoria: 'archivo' },
    [teclaModificador + '+O']: { descripcion: `Abrir calco (${nombreModificador}+O)`, funcion: 'cargarCalco', categoria: 'archivo' },
    [teclaModificador + '+N']: { descripcion: `Nuevo calco (${nombreModificador}+N)`, funcion: 'crearNuevoCalco', categoria: 'archivo' },
    
    // Edición y selección - Compatible Mac/PC
    'DELETE': { descripcion: 'Eliminar elemento seleccionado', funcion: 'eliminarElementoSeleccionado', categoria: 'edicion' },
    'BACKSPACE': { descripcion: 'Eliminar elemento (alternativo)', funcion: 'eliminarElementoSeleccionado', categoria: 'edicion' },
    [teclaModificador + '+C']: { descripcion: `Copiar elemento (${nombreModificador}+C)`, funcion: 'copiarElemento', categoria: 'edicion' },
    [teclaModificador + '+V']: { descripcion: `Pegar elemento (${nombreModificador}+V)`, funcion: 'pegarElemento', categoria: 'edicion' },
    [teclaModificador + '+D']: { descripcion: `Duplicar elemento (${nombreModificador}+D)`, funcion: 'duplicarElemento', categoria: 'edicion' },
    [teclaModificador + '+A']: { descripcion: `Seleccionar todo (${nombreModificador}+A)`, funcion: 'seleccionarTodo', categoria: 'edicion' },
    'ESCAPE': { descripcion: 'Cancelar acción actual', funcion: 'cancelarAccion', categoria: 'navegacion' },
    
    // Herramientas de medición - Compatible Mac/PC
    [teclaModificador + '+M']: { descripcion: `Medir distancia (${nombreModificador}+M)`, funcion: 'iniciarMedicionDistancia', categoria: 'herramientas' },
    [teclaModificador + '+Shift+M']: { descripcion: `Medir área (${nombreModificador}+Shift+M)`, funcion: 'iniciarMedicionArea', categoria: 'herramientas' },
    [teclaModificador + '+E']: { descripcion: `Perfil elevación (${nombreModificador}+E)`, funcion: 'mostrarPerfilElevacion', categoria: 'herramientas' },
    
    // Navegación - Compatible Mac/PC
    [teclaModificador + '+H']: { descripcion: `Ir a inicio (${nombreModificador}+H)`, funcion: 'irAInicio', categoria: 'navegacion' },
    [teclaModificador + '+F']: { descripcion: `Buscar símbolo (${nombreModificador}+F)`, funcion: 'mostrarBusquedaSimbolos', categoria: 'navegacion' },
    [teclaModificador + '+L']: { descripcion: `Buscar lugar (${nombreModificador}+L)`, funcion: 'mostrarBusquedaLugar', categoria: 'navegacion' },
    
    // Zoom y vista - Teclas universales
    'EQUAL': { descripcion: 'Zoom in (+)', funcion: 'zoomIn', categoria: 'vista' },
    'MINUS': { descripcion: 'Zoom out (-)', funcion: 'zoomOut', categoria: 'vista' },
    [teclaModificador + '+0']: { descripcion: `Zoom original (${nombreModificador}+0)`, funcion: 'zoomOriginal', categoria: 'vista' },
    
    // Herramientas de dibujo - Teclas simples
    'P': { descripcion: 'Dibujar polígono (P)', funcion: 'activarPoligono', categoria: 'dibujo' },
    'L': { descripcion: 'Dibujar línea (L)', funcion: 'activarLinea', categoria: 'dibujo' },
    'F': { descripcion: 'Dibujar flecha (F)', funcion: 'activarFlecha', categoria: 'dibujo' },
    'T': { descripcion: 'Agregar texto (T)', funcion: 'activarTexto', categoria: 'dibujo' },
    
    // Ayuda - Teclas universales
    'F1': { descripcion: 'Mostrar ayuda (F1)', funcion: 'mostrarAyudaAtajos', categoria: 'ayuda' },
    [teclaModificador + '+SLASH']: { descripcion: `Atajos rápidos (${nombreModificador}+?)`, funcion: 'mostrarAtajosRapidos', categoria: 'ayuda' }
};

// ✅ EVENT LISTENER COMPATIBLE MAC
document.addEventListener('keydown', function(e) {
    // Validar contexto - no procesar si hay elementos activos
    if (debeIgnorarAtajo(e)) {
        return;
    }

    var tecla = construirTeclaCompatible(e);
    
    if (atajos[tecla]) {
        e.preventDefault();
        ejecutarAtajo(atajos[tecla]);
    }
});

// ✅ FUNCIÓN DE VALIDACIÓN MEJORADA
function debeIgnorarAtajo(e) {
    // Ignorar si hay elementos de entrada activos
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.contentEditable === 'true') {
        return true;
    }
    
    // Ignorar si hay modales activos
    if (document.querySelector('.modal.show, .popup.active, .leaflet-popup')) {
        return true;
    }
    
    // Ignorar si se está editando texto en el mapa
    if (document.querySelector('.leaflet-editing')) {
        return true;
    }
    
    // En Mac, ignorar algunos atajos del sistema
    if (esMac && e.metaKey) {
        // Permitir solo nuestros atajos específicos
        var teclasPermitidas = ['Z', 'Y', 'S', 'O', 'N', 'C', 'V', 'D', 'A', 'M', 'E', 'H', 'F', 'L', '0', '/'];
        if (!teclasPermitidas.includes(e.key.toUpperCase())) {
            return true;
        }
    }
    
    return false;
}

// ✅ CONSTRUCTOR DE TECLAS COMPATIBLE MAC
function construirTeclaCompatible(e) {
    var tecla = '';
    
    // Usar la tecla correcta según la plataforma
    if ((esMac && e.metaKey) || (!esMac && e.ctrlKey)) {
        tecla += teclaModificador + '+';
    }
    
    if (e.shiftKey) tecla += 'Shift+';
    if (e.altKey) tecla += 'Alt+';
    
    // Manejo especial para teclas problemáticas
    var key = e.key.toUpperCase();
    
    // Correcciones específicas para Mac
    if (esMac) {
        if (key === '+' || e.code === 'Equal') key = 'EQUAL';
        if (key === '/' || e.code === 'Slash') key = 'SLASH';
    } else {
        if (key === '+') key = 'EQUAL';
        if (key === '?') key = 'SLASH';
    }
    
    // Normalizar Delete/Backspace
    if (key === 'DELETE' || key === 'BACKSPACE') {
        key = e.code === 'Backspace' ? 'BACKSPACE' : 'DELETE';
    }
    
    tecla += key;
    return tecla;
}

// ✅ EJECUTOR DE ATAJOS CON NOTIFICACIONES MAC
function ejecutarAtajo(atajo) {
    try {
        if (typeof window[atajo.funcion] === 'function') {
            console.log(`Ejecutando atajo: ${atajo.descripcion}`);
            window[atajo.funcion]();
            
            // Notificación específica para Mac
            if (window.mostrarNotificacion) {
                mostrarNotificacion(`✓ ${atajo.descripcion}`, 'success', 2000);
            }
        } else {
            console.warn(`Función '${atajo.funcion}' no encontrada para: ${atajo.descripcion}`);
            if (window.mostrarNotificacion) {
                mostrarNotificacion(`⚠ Función no disponible: ${atajo.descripcion}`, 'warning');
            }
        }
    } catch (error) {
        console.error(`Error ejecutando atajo '${atajo.descripcion}':`, error);
        if (window.mostrarNotificacion) {
            mostrarNotificacion(`❌ Error en atajo: ${atajo.descripcion}`, 'error');
        }
    }
}

// ✅ SISTEMA DE HISTORIAL (sin cambios - compatible ambas plataformas)
var historialAcciones = [];
var indiceHistorial = -1;
var maxHistorial = 50;

function agregarAccionHistorial(accion, datos) {
    if (indiceHistorial < historialAcciones.length - 1) {
        historialAcciones = historialAcciones.slice(0, indiceHistorial + 1);
    }
    
    historialAcciones.push({
        accion: accion,
        datos: datos,
        timestamp: Date.now()
    });
    
    if (historialAcciones.length > maxHistorial) {
        historialAcciones.shift();
    } else {
        indiceHistorial++;
    }
}

// ✅ FUNCIONES MEJORADAS COMPATIBLES MAC
function deshacerAccion() {
    if (indiceHistorial >= 0) {
        var accion = historialAcciones[indiceHistorial];
        console.log('Deshaciendo:', accion.accion);
        
        switch (accion.accion) {
            case 'agregar_elemento':
                if (accion.datos.elemento && accion.datos.capa) {
                    accion.datos.capa.removeLayer(accion.datos.elemento);
                }
                break;
            case 'eliminar_elemento':
                if (accion.datos.elemento && accion.datos.capa) {
                    accion.datos.capa.addLayer(accion.datos.elemento);
                }
                break;
        }
        
        indiceHistorial--;
        if (window.mostrarNotificacion) {
            mostrarNotificacion('↶ Acción deshecha', 'success');
        }
    } else {
        if (window.mostrarNotificacion) {
            mostrarNotificacion('ℹ No hay acciones para deshacer', 'info');
        }
    }
}

function rehacerAccion() {
    if (indiceHistorial < historialAcciones.length - 1) {
        indiceHistorial++;
        var accion = historialAcciones[indiceHistorial];
        console.log('Rehaciendo:', accion.accion);
        
        switch (accion.accion) {
            case 'agregar_elemento':
                if (accion.datos.elemento && accion.datos.capa) {
                    accion.datos.capa.addLayer(accion.datos.elemento);
                }
                break;
            case 'eliminar_elemento':
                if (accion.datos.elemento && accion.datos.capa) {
                    accion.datos.capa.removeLayer(accion.datos.elemento);
                }
                break;
        }
        
        if (window.mostrarNotificacion) {
            mostrarNotificacion('↷ Acción rehecha', 'success');
        }
    } else {
        if (window.mostrarNotificacion) {
            mostrarNotificacion('ℹ No hay acciones para rehacer', 'info');
        }
    }
}

// ✅ FUNCIONES ADICIONALES IMPLEMENTADAS
function duplicarElemento() {
    if (window.elementoSeleccionado) {
        var elementoOriginal = window.elementoSeleccionado;
        var offset = 0.001; // Pequeño desplazamiento para ver la copia
        
        var nuevoElemento;
        if (elementoOriginal instanceof L.Marker) {
            var newLatLng = L.latLng(
                elementoOriginal.getLatLng().lat + offset,
                elementoOriginal.getLatLng().lng + offset
            );
            nuevoElemento = L.marker(newLatLng, {
                ...elementoOriginal.options,
                nombre: (elementoOriginal.options.nombre || 'Elemento') + ' (copia)'
            });
        }
        
        if (nuevoElemento && window.calcoActivo) {
            window.calcoActivo.addLayer(nuevoElemento);
            agregarAccionHistorial('agregar_elemento', {
                elemento: nuevoElemento,
                capa: window.calcoActivo
            });
            if (window.mostrarNotificacion) {
                mostrarNotificacion('📋 Elemento duplicado', 'success');
            }
        }
    } else {
        if (window.mostrarNotificacion) {
            mostrarNotificacion('⚠ No hay elemento seleccionado', 'warning');
        }
    }
}

function cancelarAccion() {
    if (window.modoCreacion) {
        window.modoCreacion = false;
        if (window.mapa) {
            window.mapa.off('click');
        }
        if (window.mostrarNotificacion) {
            mostrarNotificacion('✖ Acción cancelada', 'info');
        }
    }
    
    // Cerrar paneles
    var paneles = document.querySelectorAll('.panel-edicion.show, .popup.active');
    paneles.forEach(function(panel) {
        panel.style.display = 'none';
        panel.classList.remove('show', 'active');
    });
}

// ✅ AYUDA MEJORADA CON INFORMACIÓN DE PLATAFORMA
function mostrarAyudaAtajos() {
    var ayuda = `ATAJOS DE TECLADO - ${esMac ? 'macOS' : 'Windows/Linux'}\n\n`;
    
    var categorias = {
        'archivo': '📁 ARCHIVO',
        'edicion': '✏️ EDICIÓN', 
        'herramientas': '🔧 HERRAMIENTAS',
        'navegacion': '🧭 NAVEGACIÓN',
        'vista': '👁️ VISTA',
        'dibujo': '🎨 DIBUJO',
        'ayuda': '❓ AYUDA'
    };
    
    for (var categoria in categorias) {
        var hayEnCategoria = false;
        var seccion = `${categorias[categoria]}:\n`;
        
        for (var atajo in atajos) {
            if (atajos[atajo].categoria === categoria) {
                seccion += `  ${atajos[atajo].descripcion}\n`;
                hayEnCategoria = true;
            }
        }
        
        if (hayEnCategoria) {
            ayuda += seccion + '\n';
        }
    }
    
    ayuda += `\n💡 Optimizado para ${esMac ? 'macOS' : 'Windows/Linux'}`;
    ayuda += `\n🖱️ Algunos atajos pueden variar según el navegador`;
    
    alert(ayuda);
}

// ✅ EXPORTACIONES GLOBALES
window.deshacerAccion = deshacerAccion;
window.rehacerAccion = rehacerAccion;
window.duplicarElemento = duplicarElemento;
window.cancelarAccion = cancelarAccion;
window.mostrarAyudaAtajos = mostrarAyudaAtajos;
window.agregarAccionHistorial = agregarAccionHistorial;

// Mantener funciones existentes mejoradas
window.copiarElemento = function() {
    if (window.elementoSeleccionado) {
        window.elementoCopiado = window.elementoSeleccionado;
        if (window.mostrarNotificacion) {
            mostrarNotificacion('📋 Elemento copiado', 'success');
        }
    } else {
        if (window.mostrarNotificacion) {
            mostrarNotificacion('⚠ No hay elemento seleccionado', 'warning');
        }
    }
};

window.pegarElemento = function() {
    if (window.elementoCopiado && window.calcoActivo) {
        // Implementación mejorada de pegado
        duplicarElemento();
    } else {
        if (window.mostrarNotificacion) {
            mostrarNotificacion('⚠ No hay elemento para pegar', 'warning');
        }
    }
};

// ✅ ESTRUCTURA MAIRA COMPATIBLE
window.MAIRA = window.MAIRA || {};
window.MAIRA.Atajos = {
    plataforma: esMac ? 'macOS' : 'Windows/Linux',
    teclaModificador: teclaModificador,
    nombreModificador: nombreModificador,
    ejecutar: ejecutarAtajo,
    agregar: function(tecla, descripcion, funcion, categoria) {
        atajos[tecla] = { descripcion, funcion, categoria: categoria || 'otros' };
    },
    remover: function(tecla) {
        delete atajos[tecla];
    },
    listar: function() {
        return atajos;
    },
    historial: {
        agregar: agregarAccionHistorial,
        deshacer: deshacerAccion,
        rehacer: rehacerAccion,
        limpiar: function() {
            historialAcciones = [];
            indiceHistorial = -1;
        }
    },
    compatibilidad: {
        esMac: esMac,
        soportaNotificaciones: typeof window.mostrarNotificacion === 'function',
        version: '2.0.0'
    }
};

console.log(`MAIRA Atajos inicializado para ${esMac ? 'macOS' : 'Windows/Linux'} - ${Object.keys(atajos).length} atajos disponibles`);