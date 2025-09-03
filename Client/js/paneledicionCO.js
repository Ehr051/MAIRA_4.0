/**
 * paneledicionCO.js - Funciones para la edición de elementos en el cuadro de organización
 * Parte del sistema de Cuadro de Organización Militar
 */

/* Variables globales */
var panelEdicionActual = null;

/**
 * Estructura SIDC completa (15 posiciones):
 * Pos 1: Esquema de codificación (S)
 * Pos 2: Identidad (F,H,U,N,etc)
 * Pos 3: Dimensión batalla (P,A,G,S,U)
 * Pos 4: Estado (P,A)
 * Pos 5: Función ID 1 (U=Unidad)
 * Pos 6: Función ID 2 (C=Combate)
 * Pos 7: Función ID 3 (I,R,F=Inf,Cab,Art)
 * Pos 8: -
 * Pos 9-10: Modificadores (VA,HE,etc)
 * Pos 11-15: ---
 */
const unidadesMilitares = {
    "Armas": {
        "Infantería": {
            codigo: "UCI",
            tipos: {
                "a Pie": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UCI---
                        "Paracaidista": "A",         // S-G-UCIA--
                        "De Montaña": "O",           // S-G-UCIO--
                        "De Asalto Aéreo": "S",      // S-G-UCIS--
                        "Naval": "N",                // S-G-UCIN--  
                    }
                },
                "Motorizada": {
                    codigo: "M",
                    caracteristicas: {
                        "--": ""                     // S-G-UCIM--
                    }
                },
                "Mecanizada": {
                    codigo: "Z",
                    caracteristicas: {
                        "--": ""
                    }
                }
            }
        },
        "Caballería": {
            codigo: "UCR",
            tipos: {
                "Exploración": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UCR---
                        "Paracaidista": "A",         // S-G-UCRA--
                        "De Montaña": "O"            // S-G-UCRO--
                    }
                },
                "Blindada": {
                    codigo: "VA",                    // S-G-UCRVA-
                    caracteristicas: {
                        "--": ""
                    }
                }
            }
        },
        "Artillería": {
            codigo: "UCF",
            tipos: {
                "Campaña": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UCF---
                        "De Montaña": "O",           // S-G-UCFO--
                        "Autopropulsada": "HE",      // S-G-UCFHE-
                        "Cohetes": "R"               // S-G-UCFR--
                    }
                },
                "Antiaérea": {
                    codigo: "AD",
                    caracteristicas: {
                        "--": "",                    // S-G-UCDM--
                        "Misiles": "M",              // S-G-UCDML-
                        "Autopropulsada": "HE"       // S-G-UCDH--
                    }
                }
            }
        },
        "Ingenieros": {
            codigo: "UCE",
            tipos: {
                "Combate": {
                    codigo: "C",
                    caracteristicas: {
                        "--": "",                    // S-G-UCE---
                        "De Montaña": "O",           // S-G-UCEO--
                        "Paracaidista": "A",   
                        "Mecanizado": "Z",           // S-G-UCEZ--
                        "Asalto Aéreo": "S"          // S-G-UCES--
                    }
                },
                "Construcción": {
                    codigo: "N",                     // Construction
                    caracteristicas: {
                        "--": ""                     // S-G-UCEN--
                    }
                }
            }
        },
        "Defensa Antiaérea": {
            codigo: "UCD",
            tipos: {
                "Misiles": {
                    codigo: "M",
                    caracteristicas: {
                        "--": "",                    // S-G-UCDM--
                        "Ligero": "L",               // S-G-UCDML-
                        "Pesado": "H"                // S-G-UCDMH-
                    }
                },
                "Cañones": {
                    codigo: "G",
                    caracteristicas: {
                        "--": ""                     // S-G-UCDG--
                    }
                }
            }
        }
    },
    "Servicios": {
        "Sanidad": {  // S-G-USM---
            codigo: "USM",
            tipos: {
                "General": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-USM---
                        "Veterinaria": "V",          // S-G-USMV--
                        "Dental": "D",               // S-G-USMD--
                        "Psicológico": "P"           // S-G-USMP--
                    }
                }
            }
        },
        "Abastecimiento": {  // S-G-USS---
            codigo: "USS",
            tipos: {
                "General": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-USS---
                        "Clase I": "1",              // S-G-USS1--
                        "Clase II": "2",             // S-G-USS2--
                        "Clase III": "3",            // S-G-USS3--
                        "Clase V": "5"               // S-G-USS5--
                    }
                }
            }
        },
        "Transporte": {  // S-G-UST---
            codigo: "UST", 
            tipos: {
                "General": {
                    codigo: "",
                    caracteristicas: {
                        "--": "",                    // S-G-UST---
                        "Motorizado": "M",           // S-G-USTMO-
                        "Ferroviario": "R",          // S-G-USTR--
                        "Naval": "S",                // S-G-USTS--
                        "Aéreo": "A"                 // S-G-USTA--
                    }
                }
            }
        }
    }
};

/**
 * Inicializa los selectores de unidades en el panel de edición
 */
function inicializarSelectores() {
    const armaSelect = document.getElementById('arma');
    if (armaSelect) {
        armaSelect.innerHTML = '';
        Object.entries(unidadesMilitares).forEach(([categoria, armas]) => {
            // Crear grupo de opciones para cada categoría
            const optgroup = document.createElement('optgroup');
            optgroup.label = categoria;
            
            Object.keys(armas).forEach(arma => {
                let option = document.createElement('option');
                option.value = `${categoria}|${arma}`;
                option.textContent = arma;
                optgroup.appendChild(option);
            });
            
            armaSelect.appendChild(optgroup);
        });
    }
}

/**
 * Actualiza las opciones del selector de tipos según el arma seleccionada
 * @param {string} categoriaArma - String con formato "Categoria|Arma"
 */
function actualizarTipos(categoriaArma) {
    const [categoria, arma] = categoriaArma.split('|');
    const tipoSelect = document.getElementById('tipo');
    tipoSelect.innerHTML = '';
    const tipos = unidadesMilitares[categoria][arma].tipos;
    Object.keys(tipos).forEach(tipo => {
        let option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        tipoSelect.appendChild(option);
    });
    actualizarCaracteristicas(categoriaArma, Object.keys(tipos)[0]);
}

/**
 * Actualiza las opciones del selector de características según el tipo seleccionado
 * @param {string} categoriaArma - String con formato "Categoria|Arma"
 * @param {string} tipo - Tipo de unidad seleccionado
 */
function actualizarCaracteristicas(categoriaArma, tipo) {
    const [categoria, arma] = categoriaArma.split('|');
    const caracteristicaSelect = document.getElementById('caracteristica');
    caracteristicaSelect.innerHTML = '';
    const caracteristicas = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas;
    Object.keys(caracteristicas).forEach(caract => {
        let option = document.createElement('option');
        option.value = caract;
        option.textContent = caract;
        caracteristicaSelect.appendChild(option);
    });
}

/**
 * Centra un panel en la pantalla
 * @param {Object} panel - Elemento DOM del panel
 */
function centrarPanel(panel) {
    panel.style.position = 'fixed';
    panel.style.top = '50%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.zIndex = '1000';
}

/**
 * Muestra el panel de edición de unidad y carga los datos del elemento seleccionado
 * @param {Object} elemento - Elemento DOM de la unidad a editar
 */
function mostrarPanelEdicionUnidad(elemento) {
    console.log("Mostrando panel de edición de unidad");
    
    // Obtener el panel de edición
    var panel = document.getElementById('panelEdicionUnidad');
    if (!panel) {
        console.error("Panel de edición de unidad no encontrado");
        return;
    }
    
    // Asegurar que el panel sea visible
    panel.style.display = 'block';
    panel.classList.add('show');
    document.body.classList.add('panel-open');
    
    // Inicializar los selectores si no se han inicializado aún
    inicializarSelectores();
    
    // Limpiar los campos para empezar con valores en blanco
    document.getElementById('designacion').value = '';
    document.getElementById('dependencia').value = '';
    
    // Resetear selectores a valores por defecto
    if (document.getElementById('afiliacion')) {
        document.getElementById('afiliacion').value = 'F';
    }
    
    if (document.getElementById('estado')) {
        document.getElementById('estado').value = 'P';
    }
    
    if (document.getElementById('magnitud')) {
        document.getElementById('magnitud').value = '-';
    }
    
    // Desmarcar checkboxes
    if (document.getElementById('puestoComando')) {
        document.getElementById('puestoComando').checked = false;
    }
    
    if (document.getElementById('fuerzaTarea')) {
        document.getElementById('fuerzaTarea').checked = false;
    }
    
    // Resetear el display de SIDC
    if (document.getElementById('sidcDisplay')) {
        document.getElementById('sidcDisplay').innerHTML = '';
    }
    
    // Cargar los datos del elemento en el panel
    if (elemento && elemento.getAttribute) {
        var sidc = elemento.getAttribute('data-sidc');
        console.log("Cargando SIDC:", sidc);
        
        var label = elemento.querySelector('.symbol-label');
        var labelText = label ? label.textContent : '';
        
        // Separar designación/dependencia
        if (labelText) {
            var partes = labelText.split('/');
            var designacion = partes[0] || '';
            var dependencia = partes[1] || '';
            
            // Cargar valores en los campos
            document.getElementById('designacion').value = designacion.trim();
            document.getElementById('dependencia').value = dependencia.trim();
        }
        
        // Cargar datos de SIDC
        if (sidc) {
            var afiliacionSelect = document.getElementById('afiliacion');
            if (afiliacionSelect && sidc.length >= 2) {
                afiliacionSelect.value = sidc.charAt(1) || 'F';
            }
            
            var estadoSelect = document.getElementById('estado');
            if (estadoSelect && sidc.length >= 4) {
                estadoSelect.value = sidc.charAt(3) || 'P';
            }
            
            var magnitudSelect = document.getElementById('magnitud');
            if (magnitudSelect && sidc.length >= 12) {
                magnitudSelect.value = sidc.charAt(11) || '-';
            }
            
            var puestoComandoCheck = document.getElementById('puestoComando');
            if (puestoComandoCheck && sidc.length >= 11) {
                puestoComandoCheck.checked = ['A', 'D'].includes(sidc.charAt(10));
            }
            
            var fuerzaTareaCheck = document.getElementById('fuerzaTarea');
            if (fuerzaTareaCheck && sidc.length >= 11) {
                fuerzaTareaCheck.checked = ['E', 'D'].includes(sidc.charAt(10));
            }
            
            // Determinar tipo de unidad y seleccionar los valores en cascada
            var tipoUnidad = determinarTipoUnidad(sidc);
            if (tipoUnidad.categoria && tipoUnidad.arma) {
                var armaSelect = document.getElementById('arma');
                if (armaSelect) {
                    armaSelect.value = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
                    actualizarTipos(`${tipoUnidad.categoria}|${tipoUnidad.arma}`);
                    
                    if (tipoUnidad.tipo) {
                        var tipoSelect = document.getElementById('tipo');
                        if (tipoSelect) {
                            tipoSelect.value = tipoUnidad.tipo;
                            actualizarCaracteristicas(`${tipoUnidad.categoria}|${tipoUnidad.arma}`, tipoUnidad.tipo);
                            
                            if (tipoUnidad.caracteristica) {
                                var caracteristicaSelect = document.getElementById('caracteristica');
                                if (caracteristicaSelect) {
                                    caracteristicaSelect.value = tipoUnidad.caracteristica;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Actualizar preview
    actualizarPreviewSimbolo();
    
    // Configurar botón de guardar cambios
    var guardarBtn = document.getElementById('guardarCambiosUnidad');
    if (guardarBtn) {
        guardarBtn.onclick = function() {
            guardarCambiosUnidad(!window.selectedElement);
        };
    }
    
    var cerrarBtn = document.getElementById('cerrarPanelEdicionUnidad');
    if (cerrarBtn) {
        cerrarBtn.onclick = function() {
            cerrarPanelEdicion('panelEdicionUnidad');
        };
    }
    
    // Guardar referencia al panel actual
    panelEdicionActual = panel;
    
    // Asegurarse de que las pestañas estén configuradas
    configurarTabsPanel();
}


/* Editar elemento seleccionado */
function editarElementoSeleccionado() {
    if (!window.selectedElement) return;
    
    // Mostrar panel de edición adecuado según tipo de elemento
    var sidc = window.selectedElement.getAttribute('data-sidc');
    if (!sidc) return;
    
    // Determinar tipo de elemento usando las funciones auxiliares
    if (window.esEquipo && window.esEquipo(sidc)) {
        // Es un equipo, usar la función de edición de equipo si está disponible
        if (window.mostrarPanelEdicionEquipo) {
            window.mostrarPanelEdicionEquipo(window.selectedElement);
        } else {
            console.warn("Función mostrarPanelEdicionEquipo no encontrada");
            // Usar el panel de unidad como fallback
            if (window.mostrarPanelEdicionUnidad) {
                window.mostrarPanelEdicionUnidad(window.selectedElement);
            } else {
                mostrarPanelEdicionUnidad(window.selectedElement);
            }
        }
    } else if (window.esUnidad && window.esUnidad(sidc)) {
        // Es una unidad, usar la función de edición de unidad
        if (window.mostrarPanelEdicionUnidad) {
            window.mostrarPanelEdicionUnidad(window.selectedElement);
        } else {
            mostrarPanelEdicionUnidad(window.selectedElement);
        }
    } else {
        // Si no se puede determinar, usar el panel de unidad por defecto
        if (window.mostrarPanelEdicionUnidad) {
            window.mostrarPanelEdicionUnidad(window.selectedElement);
        } else {
            mostrarPanelEdicionUnidad(window.selectedElement);
        }
    }
}


/**
 * Determina si un elemento es un equipo basado en su SIDC
 * @param {string} sidc - Código SIDC del elemento
 * @returns {boolean} - true si es un equipo, false si no
 */
function esEquipo(sidc) {
    return sidc && sidc.length >= 5 && sidc.charAt(4) === 'E';
}

/**
 * Determina si un elemento es una unidad basado en su SIDC
 * @param {string} sidc - Código SIDC del elemento
 * @returns {boolean} - true si es una unidad, false si no
 */
function esUnidad(sidc) {
    return sidc && sidc.length >= 5 && sidc.charAt(4) === 'U';
}

/**
 * Configura las pestañas del panel de edición
 */
function configurarTabsPanel() {
    var tabs = document.querySelectorAll('#panelEdicionUnidad .tab button');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // Desactivar todas las pestañas
            tabs.forEach(function(t) {
                t.classList.remove('active');
            });
            
            // Activar esta pestaña
            this.classList.add('active');
            
            // Ocultar todos los contenidos
            var tabContents = document.querySelectorAll('#panelEdicionUnidad .tabcontent');
            tabContents.forEach(function(content) {
                content.style.display = 'none';
            });
            
            // Mostrar el contenido de la pestaña seleccionada
            var tabName = this.getAttribute('data-tab');
            var tabContent = document.getElementById(tabName);
            if (tabContent) {
                tabContent.style.display = 'block';
            }
        });
    });
    
    // Activar la primera pestaña por defecto
    if (tabs.length > 0) {
        tabs[0].click();
    }
}


/**
 * Muestra el panel de edición de equipo y carga los datos del elemento seleccionado
 * @param {Object} elemento - Elemento DOM del equipo a editar
 */
function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    
    // Obtener el panel de edición
    var panel = document.getElementById('panelEdicionEquipo');
    if (!panel) {
        console.error("Panel de edición de equipo no encontrado");
        // Si no existe un panel específico para equipos, usar el de unidades como fallback
        mostrarPanelEdicionUnidad(elemento);
        return;
    }
    
    // Mostrar el panel
    panel.style.display = 'block';
    panel.classList.add('show');
    document.body.classList.add('panel-open');
    
    // Limpiar y cargar los datos del elemento en el panel
    if (elemento && elemento.getAttribute) {
        var sidc = elemento.getAttribute('data-sidc');
        var label = elemento.querySelector('.symbol-label');
        var labelText = label ? label.textContent : '';
        
        // Separar designación/asignación
        var designacion = '';
        var asignacion = '';
        if (labelText) {
            var partes = labelText.split('/');
            designacion = partes[0] || '';
            asignacion = partes[1] || '';
        }
        
        // Cargar valores en los campos si existen
        if (document.getElementById('designacionEquipo')) {
            document.getElementById('designacionEquipo').value = designacion.trim();
        }
        
        if (document.getElementById('asignacionEquipo')) {
            document.getElementById('asignacionEquipo').value = asignacion.trim();
        }
        
        // Cargar datos de SIDC
        if (sidc && sidc.length >= 2 && document.getElementById('afiliacionEquipo')) {
            document.getElementById('afiliacionEquipo').value = sidc.charAt(1);
        }
        
        // Cargar más datos específicos de equipos aquí, según sea necesario
    }
    
    // Actualizar preview si existe la función
    if (window.actualizarPreviewSimboloEquipo) {
        window.actualizarPreviewSimboloEquipo();
    }
    
    // Configurar botones
    var guardarBtn = document.getElementById('guardarCambiosEquipo');
    if (guardarBtn) {
        guardarBtn.onclick = function() {
            guardarCambiosEquipo(window.selectedElement);
        };
    }
    
    var cerrarBtn = document.getElementById('cerrarPanelEdicionEquipo');
    if (cerrarBtn) {
        cerrarBtn.onclick = function() {
            cerrarPanelEdicion('panelEdicionEquipo');
        };
    }
    
    // Guardar referencia al panel actual
    panelEdicionActual = panel;
}

/**
 * Función auxiliar para actualizar la vista previa del símbolo de equipo
 */
function actualizarPreviewSimboloEquipo() {
    if (!window.selectedElement) return;
    
    var sidc = window.selectedElement.getAttribute('data-sidc');
    if (!sidc) return;
    
    // Actualizar afiliación si existe el selector
    var afiliacionSelect = document.getElementById('afiliacionEquipo');
    if (afiliacionSelect) {
        sidc = sidc.substr(0, 1) + afiliacionSelect.value + sidc.substr(2);
    }
    
    // Mostrar preview si existe el contenedor
    var previewContainer = document.getElementById('previewEquipo');
    if (!previewContainer) return;
    
    try {
        var sym = new ms.Symbol(sidc, {size: 40});
        previewContainer.innerHTML = sym.asSVG();
        
        // Mostrar código SIDC
        var sidcText = document.createElement('div');
        sidcText.className = 'sidc-text';
        sidcText.textContent = sidc;
        previewContainer.appendChild(sidcText);
        
        // Mostrar designación y asignación
        var designacion = document.getElementById('designacionEquipo')?.value || '';
        var asignacion = document.getElementById('asignacionEquipo')?.value || '';

        if (designacion || asignacion) {
            var texto = document.createElement('div');
            texto.style = 'margin-top: 5px; font-weight: bold;';
            texto.textContent = designacion + (asignacion ? '/' + asignacion : '');
            previewContainer.appendChild(texto);
        }
    } catch (error) {
        console.error("Error al actualizar preview del símbolo de equipo:", error);
        previewContainer.innerHTML = '<div class="error">Error al generar símbolo</div>';
    }
}

/**
 * Guarda los cambios de un equipo editado
 * @param {Object} elemento - Elemento DOM del equipo editado
 */
function guardarCambiosEquipo(elemento) {
    if (!elemento) return;

    // Obtener valores del panel
    var designacion = document.getElementById('designacionEquipo')?.value || '';
    var asignacion = document.getElementById('asignacionEquipo')?.value || '';
    var afiliacion = document.getElementById('afiliacionEquipo')?.value || 'F';
    
    // Guardar estado anterior para deshacer
    var sidc = elemento.getAttribute('data-sidc');
    var label = elemento.querySelector('.symbol-label');
    var labelText = label ? label.textContent : '';
    
    var accion = {
        tipo: 'editar',
        id: elemento.id,
        valorAnterior: {
            sidc: sidc,
            label: labelText
        }
    };
    
    // Actualizar SIDC - solo cambiamos la afiliación (pos 2)
    var nuevoSidc = sidc.substr(0, 1) + afiliacion + sidc.substr(2);
    elemento.setAttribute('data-sidc', nuevoSidc);
    
    // Actualizar símbolo visual
    var symbolContainer = elemento.querySelector('.symbol-container');
    if (symbolContainer) {
        try {
            var symbol = new ms.Symbol(nuevoSidc, { size: 45, standard: 'APP6', fill: true });
            symbolContainer.innerHTML = symbol.asSVG();
        } catch (error) {
            console.error("Error al actualizar símbolo visual:", error);
        }
    }
    
    // Actualizar etiqueta
    if (label) {
        var nuevoLabel = designacion;
        if (asignacion) {
            nuevoLabel += '/' + asignacion;
        }
        label.textContent = nuevoLabel;
    }
    
    // Guardar el nuevo estado para deshacer
    accion.valorNuevo = {
        sidc: nuevoSidc,
        label: label ? label.textContent : ''
    };
    
    // Registrar acción para deshacer si está disponible
    if (window.registrarAccion) {
        window.registrarAccion(accion);
        if (window.actualizarBotonesHistorial) {
            window.actualizarBotonesHistorial();
        }
    }
    
    // Actualizar conexiones si es necesario
    if (window.jsPlumbInstance) {
        if (typeof window.jsPlumbInstance.revalidate === 'function') {
            window.jsPlumbInstance.revalidate(elemento.id);
        } else if (typeof window.jsPlumbInstance.repaint === 'function') {
            window.jsPlumbInstance.repaint(elemento.id);
        } else {
            console.warn("No se puede revalidar el elemento:", elemento.id);
        }
    }
    
    // Cerrar panel
    cerrarPanelEdicion('panelEdicionEquipo');
}


/**
 * Determina el tipo de unidad a partir del SIDC
 * @param {string} sidc - Código SIDC de la unidad
 * @returns {Object} - Objeto con categoría, arma, tipo y característica
 */
function determinarTipoUnidad(sidc) {
    const codigoUnidad = sidc.substr(4, 6);
    for (const [categoria, armas] of Object.entries(unidadesMilitares)) {
        for (const [arma, detalles] of Object.entries(armas)) {
            if (codigoUnidad.startsWith(detalles.codigo)) {
                const restoCodigo = codigoUnidad.substr(detalles.codigo.length);
                for (const [tipo, tipoDetalles] of Object.entries(detalles.tipos)) {
                    if (restoCodigo.startsWith(tipoDetalles.codigo)) {
                        const caracteristica = restoCodigo.substr(tipoDetalles.codigo.length, 1);
                        for (const [caract, caractCodigo] of Object.entries(tipoDetalles.caracteristicas)) {
                            if (caractCodigo === caracteristica) {
                                return { categoria, arma, tipo, caracteristica: caract };
                            }
                        }
                        return { categoria, arma, tipo, caracteristica: "--" };
                    }
                }
                return { categoria, arma, tipo: Object.keys(detalles.tipos)[0], caracteristica: "--" };
            }
        }
    }
    return { categoria: "Armas", arma: "Infantería", tipo: "a Pie", caracteristica: "--" };
}

/**
 * Obtiene el SIDC actual basado en las selecciones del panel
 * @returns {string} - Código SIDC actualizado
 */
function obtenerSIDCActual() {
    if (!window.selectedElement || !window.selectedElement.getAttribute) return '';

    let sidc = window.selectedElement.getAttribute('data-sidc');
    const afiliacion = document.getElementById('afiliacion').value;
    const estado = document.getElementById('estado').value;
    const [categoria, arma] = document.getElementById('arma').value.split('|');
    const tipo = document.getElementById('tipo').value;
    const caracteristica = document.getElementById('caracteristica').value;
    const magnitud = document.getElementById('magnitud').value;

    const codigoArma = unidadesMilitares[categoria][arma].codigo;
    const codigoTipo = unidadesMilitares[categoria][arma].tipos[tipo].codigo;
    const codigoCaracteristica = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas[caracteristica];

    let centroParte = (codigoArma + codigoTipo + codigoCaracteristica).padEnd(6, '-');
    sidc = sidc.substr(0, 1) + afiliacion + sidc.substr(2, 1) + estado + centroParte;

    let modificador = '-';
    if (document.getElementById('puestoComando').checked && document.getElementById('fuerzaTarea').checked) {
        modificador = 'D';
    } else if (document.getElementById('puestoComando').checked) {
        modificador = 'A';
    } else if (document.getElementById('fuerzaTarea').checked) {
        modificador = 'E';
    }
    
    // Colocar el modificador y la magnitud en las posiciones correctas
    sidc = sidc.substr(0, 10) + modificador + magnitud + sidc.substr(12);

    return sidc.padEnd(15, '-').substr(0, 15);
}

/**
 * Actualiza la vista previa del símbolo en el panel de edición
 */
function actualizarPreviewSimbolo() {
    const sidc = obtenerSIDCActual();
    if (!sidc) return;
    
    const sidcDisplay = document.getElementById('sidcDisplay');
    if (!sidcDisplay) return;
    
    try {
        const sym = new ms.Symbol(sidc, {size: 40});
        sidcDisplay.innerHTML = sym.asSVG();
        
        // Mostrar código SIDC
        const sidcText = document.createElement('div');
        sidcText.className = 'sidc-text';
        sidcText.textContent = sidc;
        sidcDisplay.appendChild(sidcText);
        
        // Mostrar designación y dependencia
        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;

        if (designacion || dependencia) {
            const texto = document.createElement('div');
            texto.style = 'margin-top: 5px; font-weight: bold;';
            texto.textContent = designacion + (dependencia ? '/' + dependencia : '');
            sidcDisplay.appendChild(texto);
        }
    } catch (error) {
        console.error("Error al actualizar preview del símbolo:", error);
        sidcDisplay.innerHTML = '<div class="error">Error al generar símbolo</div>';
    }
}

/**
 * Cierra el panel de edición
 * @param {string} panelId - ID del panel a cerrar
 */
function cerrarPanelEdicion(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('show');
        document.body.classList.remove('panel-open');
        panelEdicionActual = null;
    }
}

/**
 * Guarda los cambios de una unidad editada
 * @param {Object} elemento - Elemento DOM de la unidad editada
 */
function guardarCambiosUnidad(elemento) {
    if (!elemento) return;

    // Obtener valores del panel
    const designacion = document.getElementById('designacion').value;
    const dependencia = document.getElementById('dependencia').value;
    
    // Guardar estado anterior para deshacer
    const sidc = elemento.getAttribute('data-sidc');
    const label = elemento.querySelector('.symbol-label');
    const labelText = label ? label.textContent : '';
    
    const accion = {
        tipo: 'editar',
        id: elemento.id,
        valorAnterior: {
            sidc: sidc,
            label: labelText
        }
    };
    
    // Obtener el nuevo SIDC
    const nuevoSidc = obtenerSIDCActual();
    elemento.setAttribute('data-sidc', nuevoSidc);
    
    // Actualizar símbolo visual
    const symbolContainer = elemento.querySelector('.symbol-container');
    if (symbolContainer) {
        try {
            const symbol = new ms.Symbol(nuevoSidc, { size: 40, standard: 'APP6', fill: true });
            symbolContainer.innerHTML = symbol.asSVG();
        } catch (error) {
            console.error("Error al actualizar símbolo visual:", error);
        }
    }
    
    // Actualizar etiqueta
    if (label) {
        let nuevoLabel = designacion;
        if (dependencia) {
            nuevoLabel += '/' + dependencia;
        }
        label.textContent = nuevoLabel;
    }
    
    // Guardar el nuevo estado para deshacer
    accion.valorNuevo = {
        sidc: nuevoSidc,
        label: label ? label.textContent : ''
    };
    
    // Registrar acción para deshacer si está disponible
    if (window.registrarAccion) {
        window.registrarAccion(accion);
        if (window.actualizarBotonesHistorial) {
            window.actualizarBotonesHistorial();
        }
    }
    
    // Actualizar conexiones si es necesario
    if (window.jsPlumbInstance) {
        if (typeof window.jsPlumbInstance.revalidate === 'function') {
            window.jsPlumbInstance.revalidate(elemento.id);
        } else if (typeof window.jsPlumbInstance.repaint === 'function') {
            window.jsPlumbInstance.repaint(elemento.id);
        } else {
            console.warn("No se puede revalidar el elemento:", elemento.id);
        }
    }
    
    // Cerrar panel
    cerrarPanelEdicion('panelEdicionUnidad');
}

/**
 * Configura todos los eventos del panel de edición
 */
function inicializarEventosPanelEdicion() {
    // Configurar eventos para los selectores y pestañas
    configurarTabsPanel();
    
    // Configurar el selector de arma
    const armaSelect = document.getElementById('arma');
    if (armaSelect) {
        armaSelect.addEventListener('change', function() {
            actualizarTipos(this.value);
            actualizarPreviewSimbolo();
        });
    }
    
    // Configurar el selector de tipo
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            actualizarCaracteristicas(document.getElementById('arma').value, this.value);
            actualizarPreviewSimbolo();
        });
    }
    
    // Configurar todos los campos para actualizar la vista previa
    const campos = ['afiliacion', 'estado', 'caracteristica', 'magnitud', 'designacion', 'dependencia'];
    campos.forEach(function(id) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('input', actualizarPreviewSimbolo);
        }
    });
    
    // Configurar checkboxes
    const checkboxes = ['puestoComando', 'fuerzaTarea'];
    checkboxes.forEach(function(id) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', actualizarPreviewSimbolo);
        }
    });
    
    // Agregar botones de panel si no existen
    agregarBotonesPanelEdicion();
}

/**
 * Agrega botones al panel de edición si no existen
 */
function agregarBotonesPanelEdicion() {
    const panel = document.getElementById('panelEdicionUnidad');
    if (!panel) return;
    
    // Verificar si ya existen los botones
    if (panel.querySelector('.panel-buttons')) return;
    
    // Crear contenedor de botones
    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'panel-buttons';
    
    // Botón guardar
    const guardarBtn = document.createElement('button');
    guardarBtn.id = 'guardarCambiosUnidad';
    guardarBtn.textContent = 'Guardar Cambios';
    guardarBtn.className = 'btn-guardar';
    
    // Botón cancelar
    const cancelarBtn = document.createElement('button');
    cancelarBtn.id = 'cerrarPanelEdicionUnidad';
    cancelarBtn.textContent = 'Cancelar';
    cancelarBtn.className = 'btn-cancelar';
    
    // Agregar botones al contenedor
    botonesDiv.appendChild(guardarBtn);
    botonesDiv.appendChild(cancelarBtn);
    
    // Agregar contenedor al panel
    panel.appendChild(botonesDiv);
    
    // Configurar eventos
    guardarBtn.addEventListener('click', function() {
        guardarCambiosUnidad(window.selectedElement);
    });
    
    cancelarBtn.addEventListener('click', function() {
        cerrarPanelEdicion('panelEdicionUnidad');
    });
}

// Inicializar cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventosPanelEdicion();
});

// Exportar funciones para uso en CO.js
window.mostrarPanelEdicionUnidad = mostrarPanelEdicionUnidad;
window.cerrarPanelEdicion = cerrarPanelEdicion;
window.actualizarPreviewSimbolo = actualizarPreviewSimbolo;
window.guardarCambiosUnidad = guardarCambiosUnidad;
window.inicializarSelectores = inicializarSelectores;
window.mostrarPanelEdicionEquipo = mostrarPanelEdicionEquipo;
window.actualizarPreviewSimboloEquipo = actualizarPreviewSimboloEquipo;
window.guardarCambiosEquipo = guardarCambiosEquipo;
window.editarElementoSeleccionado = editarElementoSeleccionado;
window.determinarTipoUnidad = determinarTipoUnidad;
window.inicializarEventosPanelEdicion = inicializarEventosPanelEdicion;
