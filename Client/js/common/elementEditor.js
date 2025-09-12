/**
 * MAIRA 4.0 - Edición de Elementos
 * =================================
 * Funciones para editar elementos seleccionados: líneas, símbolos, textos
 */

(function() {
    'use strict';

    /**
     * Función principal para editar elemento seleccionado
     */
    function editarElementoSeleccionado(elemento = null) {
        console.log('🖊️ Iniciando edición de elemento seleccionado');
        
        // Usar elemento pasado por parámetro o el globalmente seleccionado
        const elementoAEditar = elemento || window.elementoSeleccionado;
        
        if (!elementoAEditar) {
            console.warn('⚠️ No hay elemento seleccionado para editar');
            mostrarNotificacion('Debe seleccionar un elemento para editar', 'warning');
            return false;
        }

        console.log('🎯 Editando elemento:', elementoAEditar);

        // Determinar tipo de elemento y abrir el panel correspondiente
        if (elementoAEditar instanceof L.Polyline) {
            return editarLinea(elementoAEditar);
        } else if (elementoAEditar instanceof L.Marker) {
            return editarMarcador(elementoAEditar);
        } else if (elementoAEditar instanceof L.Polygon) {
            return editarPoligono(elementoAEditar);
        } else if (elementoAEditar instanceof L.Rectangle) {
            return editarRectangulo(elementoAEditar);
        } else if (elementoAEditar instanceof L.Circle) {
            return editarCirculo(elementoAEditar);
        } else {
            console.warn('⚠️ Tipo de elemento no soportado para edición:', elementoAEditar);
            mostrarNotificacion('Tipo de elemento no soportado para edición', 'warning');
            return false;
        }
    }

    /**
     * Editar línea (polyline) - MCC, MCFF, rutas, etc.
     */
    function editarLinea(linea) {
        console.log('📏 Editando línea/polyline');
        
        try {
            // 1. Habilitar edición visual
            if (window.hacerLineaEditable && typeof window.hacerLineaEditable === 'function') {
                window.hacerLineaEditable(linea);
            }
            
            // 2. Abrir panel de propiedades
            abrirPanelPropiedadesLinea(linea);
            
            // 3. Mostrar información de ayuda
            mostrarNotificacion('Línea en modo edición. Arrastra los puntos para modificar.', 'info');
            
            return true;
        } catch (error) {
            console.error('❌ Error editando línea:', error);
            mostrarNotificacion('Error editando línea: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Abrir panel de propiedades para línea
     */
    function abrirPanelPropiedadesLinea(linea) {
        // Remover panel existente si existe
        const panelExistente = document.getElementById('panelPropiedadesLinea');
        if (panelExistente) {
            panelExistente.remove();
        }

        // Obtener propiedades actuales
        const opciones = linea.options || {};
        const nombre = opciones.nombre || opciones.title || 'Línea sin nombre';
        const color = opciones.color || '#ff0000';
        const peso = opciones.weight || 3;
        const opacidad = opciones.opacity || 1;
        const dashArray = opciones.dashArray || '';
        
        // Calcular distancia
        let distancia = 0;
        if (linea.getLatLngs && typeof linea.getLatLngs === 'function') {
            const latlngs = linea.getLatLngs();
            for (let i = 1; i < latlngs.length; i++) {
                distancia += latlngs[i-1].distanceTo(latlngs[i]);
            }
        }

        // Crear panel
        const panel = document.createElement('div');
        panel.id = 'panelPropiedadesLinea';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        panel.innerHTML = `
            <div style="background: #f8f9fa; padding: 12px; border-bottom: 1px solid #ddd; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin: 0; color: #333;">🖊️ Editar Línea</h4>
                <button onclick="cerrarPanelPropiedades()" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✕</button>
            </div>
            <div style="padding: 16px;">
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Nombre:</label>
                    <input type="text" id="nombreLinea" value="${nombre}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Color:</label>
                    <input type="color" id="colorLinea" value="${color}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Grosor:</label>
                    <input type="range" id="pesoLinea" min="1" max="10" value="${peso}" style="width: 100%;">
                    <span id="pesoValor">${peso}px</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Opacidad:</label>
                    <input type="range" id="opacidadLinea" min="0" max="1" step="0.1" value="${opacidad}" style="width: 100%;">
                    <span id="opacidadValor">${Math.round(opacidad * 100)}%</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 4px; font-weight: bold;">Estilo de línea:</label>
                    <select id="estiloLinea" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="" ${!dashArray ? 'selected' : ''}>Sólida</option>
                        <option value="5, 5" ${dashArray === '5, 5' ? 'selected' : ''}>Punteada</option>
                        <option value="10, 5" ${dashArray === '10, 5' ? 'selected' : ''}>Rayada</option>
                        <option value="15, 10, 5, 10" ${dashArray === '15, 10, 5, 10' ? 'selected' : ''}>Punto-Raya</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 16px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    <strong>📏 Distancia:</strong> ${distancia.toFixed(2)} metros
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <button onclick="aplicarCambiosLinea()" style="flex: 1; background: #28a745; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">✅ Aplicar</button>
                    <button onclick="cancelarEdicionLinea()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">❌ Cancelar</button>
                </div>
                
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button onclick="eliminarLinea()" style="flex: 1; background: #dc3545; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">🗑️ Eliminar</button>
                    <button onclick="duplicarLinea()" style="flex: 1; background: #17a2b8; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">📋 Duplicar</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Configurar event listeners para actualización en tiempo real
        configurarEventListenersPanelLinea(linea);
        
        // Guardar referencia de la línea siendo editada
        window.lineaEnEdicion = linea;
        
        console.log('✅ Panel de propiedades de línea abierto');
    }

    /**
     * Configurar event listeners del panel de línea
     */
    function configurarEventListenersPanelLinea(linea) {
        // Actualización en tiempo real del grosor
        const pesoSlider = document.getElementById('pesoLinea');
        const pesoValor = document.getElementById('pesoValor');
        if (pesoSlider && pesoValor) {
            pesoSlider.addEventListener('input', function() {
                const peso = parseInt(this.value);
                pesoValor.textContent = peso + 'px';
                linea.setStyle({ weight: peso });
            });
        }

        // Actualización en tiempo real de la opacidad
        const opacidadSlider = document.getElementById('opacidadLinea');
        const opacidadValor = document.getElementById('opacidadValor');
        if (opacidadSlider && opacidadValor) {
            opacidadSlider.addEventListener('input', function() {
                const opacidad = parseFloat(this.value);
                opacidadValor.textContent = Math.round(opacidad * 100) + '%';
                linea.setStyle({ opacity: opacidad });
            });
        }

        // Actualización en tiempo real del color
        const colorPicker = document.getElementById('colorLinea');
        if (colorPicker) {
            colorPicker.addEventListener('input', function() {
                linea.setStyle({ color: this.value });
            });
        }

        // Actualización del estilo de línea
        const estiloSelect = document.getElementById('estiloLinea');
        if (estiloSelect) {
            estiloSelect.addEventListener('change', function() {
                const dashArray = this.value || null;
                linea.setStyle({ dashArray: dashArray });
            });
        }
    }

    /**
     * Aplicar cambios a la línea
     */
    function aplicarCambiosLinea() {
        const linea = window.lineaEnEdicion;
        if (!linea) return;

        try {
            const nombre = document.getElementById('nombreLinea').value;
            const color = document.getElementById('colorLinea').value;
            const peso = parseInt(document.getElementById('pesoLinea').value);
            const opacidad = parseFloat(document.getElementById('opacidadLinea').value);
            const dashArray = document.getElementById('estiloLinea').value || null;

            // Aplicar estilos
            linea.setStyle({
                color: color,
                weight: peso,
                opacity: opacidad,
                dashArray: dashArray
            });

            // Actualizar propiedades
            if (linea.options) {
                linea.options.nombre = nombre;
                linea.options.title = nombre;
            }

            // Actualizar tooltip si existe
            if (linea.getTooltip()) {
                linea.setTooltipContent(nombre);
            } else {
                linea.bindTooltip(nombre);
            }

            mostrarNotificacion('✅ Cambios aplicados correctamente', 'success');
            cerrarPanelPropiedades();

        } catch (error) {
            console.error('❌ Error aplicando cambios:', error);
            mostrarNotificacion('Error aplicando cambios: ' + error.message, 'error');
        }
    }

    /**
     * Cancelar edición de línea
     */
    function cancelarEdicionLinea() {
        const linea = window.lineaEnEdicion;
        if (linea && window.deshabilitarEdicionLinea) {
            window.deshabilitarEdicionLinea(linea);
        }
        cerrarPanelPropiedades();
        mostrarNotificacion('Edición cancelada', 'info');
    }

    /**
     * Eliminar línea
     */
    function eliminarLinea() {
        const linea = window.lineaEnEdicion;
        if (!linea) return;

        if (confirm('¿Está seguro de que desea eliminar esta línea?')) {
            try {
                // Remover del mapa
                if (linea.remove) {
                    linea.remove();
                } else if (linea._map && linea._map.removeLayer) {
                    linea._map.removeLayer(linea);
                }

                // Limpiar referencias
                if (window.elementoSeleccionado === linea) {
                    window.elementoSeleccionado = null;
                }

                // Remover de measurementHandler si existe
                if (window.measurementHandler && window.measurementHandler.lineas) {
                    for (let [lineId, lineData] of Object.entries(window.measurementHandler.lineas)) {
                        if (lineData.polyline === linea) {
                            delete window.measurementHandler.lineas[lineId];
                            break;
                        }
                    }
                }

                cerrarPanelPropiedades();
                mostrarNotificacion('✅ Línea eliminada', 'success');

            } catch (error) {
                console.error('❌ Error eliminando línea:', error);
                mostrarNotificacion('Error eliminando línea: ' + error.message, 'error');
            }
        }
    }

    /**
     * Duplicar línea
     */
    function duplicarLinea() {
        const linea = window.lineaEnEdicion;
        if (!linea) return;

        try {
            const latlngs = linea.getLatLngs();
            const opciones = { ...linea.options };
            
            // Modificar nombre para la copia
            const nombreOriginal = opciones.nombre || 'Línea';
            opciones.nombre = nombreOriginal + ' (Copia)';

            // Desplazar ligeramente la copia
            const latlngsDesplazados = latlngs.map(latlng => 
                L.latLng(latlng.lat + 0.001, latlng.lng + 0.001)
            );

            // Crear nueva línea
            const mapa = window.mapa || window.map || (linea._map);
            if (mapa) {
                const nuevaLinea = L.polyline(latlngsDesplazados, opciones).addTo(mapa);
                
                // Agregar eventos básicos
                if (window.seleccionarElemento) {
                    nuevaLinea.on('click', function() {
                        window.seleccionarElemento(this);
                    });
                }

                mostrarNotificacion('✅ Línea duplicada', 'success');
            }

        } catch (error) {
            console.error('❌ Error duplicando línea:', error);
            mostrarNotificacion('Error duplicando línea: ' + error.message, 'error');
        }
    }

    /**
     * Cerrar panel de propiedades
     */
    function cerrarPanelPropiedades() {
        const panel = document.getElementById('panelPropiedadesLinea');
        if (panel) {
            panel.remove();
        }
        
        // Deshabilitar edición si está activa
        if (window.lineaEnEdicion && window.deshabilitarEdicionLinea) {
            window.deshabilitarEdicionLinea(window.lineaEnEdicion);
        }
        
        window.lineaEnEdicion = null;
    }

    /**
     * Editar marcador
     */
    function editarMarcador(marcador) {
        console.log('📍 Editando marcador');
        mostrarNotificacion('Funcionalidad de edición de marcadores en desarrollo', 'info');
        return true;
    }

    /**
     * Editar polígono
     */
    function editarPoligono(poligono) {
        console.log('⬜ Editando polígono');
        mostrarNotificacion('Funcionalidad de edición de polígonos en desarrollo', 'info');
        return true;
    }

    /**
     * Editar rectángulo
     */
    function editarRectangulo(rectangulo) {
        console.log('▬ Editando rectángulo');
        mostrarNotificacion('Funcionalidad de edición de rectángulos en desarrollo', 'info');
        return true;
    }

    /**
     * Editar círculo
     */
    function editarCirculo(circulo) {
        console.log('⭕ Editando círculo');
        mostrarNotificacion('Funcionalidad de edición de círculos en desarrollo', 'info');
        return true;
    }

    /**
     * Mostrar notificación
     */
    function mostrarNotificacion(mensaje, tipo = 'info') {
        console.log(`[INFO] ${mensaje}`);
        
        if (window.MAIRA?.Utils?.mostrarNotificacion) {
            window.MAIRA.Utils.mostrarNotificacion(mensaje, tipo);
        } else {
            // Fallback simple
            const tipoIcon = {
                'success': '✅',
                'warning': '⚠️', 
                'error': '❌',
                'info': 'ℹ️'
            };
            alert(`${tipoIcon[tipo] || 'ℹ️'} ${mensaje}`);
        }
    }

    // Exportar funciones globales
    window.editarElementoSeleccionado = editarElementoSeleccionado;
    window.aplicarCambiosLinea = aplicarCambiosLinea;
    window.cancelarEdicionLinea = cancelarEdicionLinea;
    window.eliminarLinea = eliminarLinea;
    window.duplicarLinea = duplicarLinea;
    window.cerrarPanelPropiedades = cerrarPanelPropiedades;

    console.log('✅ Editor de elementos cargado - editarElementoSeleccionado disponible');

})();
