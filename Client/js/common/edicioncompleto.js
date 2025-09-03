// Namespace específico para edicioncompleto
window.MAIRA = window.MAIRA || {};
window.MAIRA.EdicionCompleto = window.MAIRA.EdicionCompleto || {};
let panelEdicionActualCompleto = null;

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
                        "Paracaidista": "A",     // S-G-UCIA--
                        "De Montaña": "O",          // S-G-UCIO--
                        "De Asalto Aéreo": "S",     // S-G-UCIS--
                        "Naval": "N",        // S-G-UCIN--  
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
                        "--":""
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
                        "Paracaidista": "A",     // S-G-UCRA--
                        "De Montaña": "O"           // S-G-UCRO--
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
                        "De Montaña": "O",          // S-G-UCFO--
                        "Autopropulsada": "HE",     // S-G-UCFHE-
                        "Cohetes": "R"              // S-G-UCFR--
                    }
                },
                "Antiaérea": {
                    codigo: "AD",
                    caracteristicas: {
                        "--": "",                    // S-G-UCDM--
                        "Misiles": "M",             // S-G-UCDML-
                        "Autopropulsada": "HE"      // S-G-UCDH--
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
                        "De Montaña": "O",          // S-G-UCEO--
                        "Paracaidista": "A",   
                        "Mecanizado": "Z",          // S-G-UCEZ--
                        "Asalto Aéreo": "S"         // S-G-UCES--
                    }
                },
                "Construcción": {
                    codigo: "N",                    // Construction
                    caracteristicas: {
                        "--": ""                    // S-G-UCEN--
                    }
                }
            }
        },
        "Comunicaciones": {
                    codigo: "UUS",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUS---
                                "Área": "A",               // S-G-UUSA--
                                "Radio": "R",              // S-G-UUSR--
                                "Centro": "C",             // S-G-UUSC--
                                "Satélite": "RS",           // S-G-UUSRS-
                                "Soporte": "S"              // S-G-UUSS--
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
                        "Ligero": "L",              // S-G-UCDML-
                        "Pesado": "H"               // S-G-UCDMH-
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
                            "Veterinaria": "V",         // S-G-USMV--
                            "Dental": "D",              // S-G-USMD--
                            "Psicológico": "P"          // S-G-USMP--
                        }
                    },
                }
            },
            
            "Abastecimiento": {  // S-G-USS---
                codigo: "USS",
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-USS---
                            "Clase I": "1",             // S-G-USS1--
                            "Clase II": "2",            // S-G-USS2--
                            "Clase III": "3",           // S-G-USS3--
                            "Clase V": "5"              // S-G-USS5--
                        }
                    },
                    
                }
            },
            "Transporte": {  // S-G-UST---
                codigo: "UST", 
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-UST---
                            "Motorizado": "M",          // S-G-USTMO-
                            "Ferroviario": "R",         // S-G-USTR--
                            "Naval": "S",               // S-G-USTS--
                            "Aéreo": "A"                // S-G-USTA--
                        }
                    }
                }
            },
            "Personal": {  // S-G-USA---
                codigo: "USA",
                tipos: {
                    "General": {
                        codigo: "",
                        caracteristicas: {
                            "--": "",                    // S-G-USA---
                            "Teatro": "T",               // S-G-USAT--
                            "Postal": "O",              // S-G-USAO--
                            "Mortuorio": "M",           // S-G-USAM--
                            "Religioso": "R"            // S-G-USAR--
                        }
                    }
                }
            },
            "Inteligencia": {
                codigo: "UUM",
                tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUM---
                                "Señales": "S",             // S-G-UUMS--
                                "Guerra Electrónica": "SE",  // S-G-UUMSE-
                                "Contrainteligencia": "C",   // S-G-UUMC--
                                "Radar": "RG",              // S-G-UUMRG-
                                "Meteorológica": "MO"       // S-G-UUMMO-
                            }
                        }
                    }
                },    
                "QBN": {  // Nuclear, Biológico, Químico
                    codigo: "UUA",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUA---
                                "Químico": "C",             // S-G-UUAC--
                                "Nuclear": "N",             // S-G-UUAN--
                                "Biológico": "B",           // S-G-UUAB--
                                "Descontaminación": "D"     // S-G-UUAD--
                            }
                        }
                    }
                },    
                "Policía Militar": {
                    codigo: "UUL",
                    tipos: {
                        "General": {
                            codigo: "",
                            caracteristicas: {
                                "--": "",                    // S-G-UUL---
                                "Criminal": "C",            // S-G-UULC--
                                "Seguridad": "S"            // S-G-UULS--
                            }
                        }
                    }
                },
                
                    "Topográfico": {
                        codigo: "UUT",
                        tipos: {
                            "General": {
                                codigo: "",
                                caracteristicas: {
                                    "--": "",                    // S-G-UUT---
                                    "Teatro": "T",               // S-G-UUTT--
                                    "Cuerpo": "C"               // S-G-UUTC--
                                }
                            }
                        }
                    }
                
            }
        
    };


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

// ✅ FUNCIÓN CERRAR TODOS LOS PANELES QUE FALTABA:
function cerrarTodosPaneles() {
    const paneles = ['panelEdicionLinea', 'panelEdicionUnidad', 'panelEdicionEquipo', 'panelEdicionMCC'];
    paneles.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
            panel.classList.remove('show');
        }
    });
    console.log('🗂️ Todos los paneles de edición cerrados');
}

function mostrarPanelEdicion(panelId) {
    console.log(`Intentando mostrar panel: ${panelId}`);
    cerrarTodosPaneles();
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
        panel.classList.add('show');
        console.log(`Panel ${panelId} mostrado`);
        
        // Log de estilos específicos
        const styles = window.getComputedStyle(panel);
        console.log(`Estilos de ${panelId}:`, {
            display: styles.display,
            position: styles.position,
            top: styles.top,
            right: styles.right,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor,
            visibility: styles.visibility,
            opacity: styles.opacity
        });
    } else {
        console.error(`Panel ${panelId} no encontrado`);
    }
}

function mostrarPanelEdicionUnidad(elemento) {
    console.log("📋 [DEBUG] mostrarPanelEdicionUnidad llamada con:", elemento);
    
    console.log("Mostrando panel de edición de unidad");
    mostrarPanelEdicion('panelEdicionUnidad');
    
    if (elemento?.options?.sidc) {
        const sidc = elemento.options.sidc;
        const tipoUnidad = determinarTipoUnidad(sidc);
        
        document.getElementById('afiliacion').value = sidc.charAt(1);
        document.getElementById('estado').value = sidc.charAt(3);
        
        if (tipoUnidad.categoria && tipoUnidad.arma) {
            document.getElementById('arma').value = `${tipoUnidad.categoria}|${tipoUnidad.arma}`;
            actualizarTipos(`${tipoUnidad.categoria}|${tipoUnidad.arma}`);
            document.getElementById('tipo').value = tipoUnidad.tipo;
            actualizarCaracteristicas(`${tipoUnidad.categoria}|${tipoUnidad.arma}`, tipoUnidad.tipo);
            document.getElementById('caracteristica').value = tipoUnidad.caracteristica;
        }
        
        document.getElementById('magnitud').value = sidc.charAt(11) || '-';
        document.getElementById('puestoComando').checked = ['A', 'D'].includes(sidc.charAt(10));
        document.getElementById('fuerzaTarea').checked = ['E', 'D'].includes(sidc.charAt(10));
        document.getElementById('designacion').value = elemento.options.designacion || '';
        document.getElementById('dependencia').value = elemento.options.dependencia || '';
    }
    
    actualizarPreviewSimbolo();
}

function mostrarPanelEdicionEquipo(elemento) {
    console.log("Mostrando panel de edición de equipo");
    mostrarPanelEdicion('panelEdicionEquipo');
    
    if (elemento?.options?.sidc) {
        document.getElementById('afiliacionEquipo').value = elemento.options.sidc.charAt(1);
        document.getElementById('designacionEquipo').value = elemento.options.designacion || '';
        document.getElementById('asignacionEquipo').value = elemento.options.dependencia || '';
    }
    
    actualizarPreviewSimboloEquipo();
}


function actualizarCampoSIDC(id, valor) {
    const campo = document.getElementById(id);
    if (campo) campo.value = valor || '';
}

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
                        return { categoria, arma, tipo, caracteristica: "Normal" };
                    }
                }
                return { categoria, arma, tipo: "Básica", caracteristica: "Normal" };
            }
        }
    }
    return { categoria: "Desconocido", arma: "Desconocido", tipo: "Desconocido", caracteristica: "Desconocido" };
}

function obtenerSIDCActual() {
    if (!elementoSeleccionado?.options?.sidc) return '';

    let sidc = elementoSeleccionado.options.sidc;
    const afiliacion = document.getElementById('afiliacion').value;
    const estado = document.getElementById('estado').value;
    const [categoria, arma] = document.getElementById('arma').value.split('|');
    const tipo = document.getElementById('tipo').value;
    const caracteristica = document.getElementById('caracteristica').value;
    const magnitud = document.getElementById('magnitud').value;

    console.log("Construyendo SIDC:", {
        sidc_original: sidc,
        afiliacion,
        estado,
        categoria,
        arma,
        tipo,
        caracteristica,
        magnitud
    });

    const codigoArma = unidadesMilitares[categoria][arma].codigo;
    const codigoTipo = unidadesMilitares[categoria][arma].tipos[tipo].codigo;
    const codigoCaracteristica = unidadesMilitares[categoria][arma].tipos[tipo].caracteristicas[caracteristica];

    let centroParte = (codigoArma + codigoTipo + codigoCaracteristica).padEnd(6, '-');
    sidc = sidc.substr(0, 1) + afiliacion + sidc.substr(2, 1) + estado + centroParte;

    let modificador = '-';
    if (document.getElementById('puestoComando').checked && document.getElementById('fuerzaTarea').checked) {
        modificador = 'B';
    } else if (document.getElementById('puestoComando').checked) {
        modificador = 'A';
    } else if (document.getElementById('fuerzaTarea').checked) {
        modificador = 'E';
    }
    
    console.log("SIDC intermedio:", sidc, "Modificador:", modificador, "Magnitud:", magnitud);
    
    // Colocar el modificador y la magnitud en las posiciones correctas
    sidc = sidc.substr(0, 10) + modificador + magnitud + sidc.substr(12);
    
    console.log("SIDC final:", sidc);

    return sidc.padEnd(15, '-').substr(0, 15);
}

function actualizarPreviewSimbolo() {
    const sidc = obtenerSIDCActual();
    const sym = new ms.Symbol(sidc, {size: 30});
    const sidcDisplay = document.getElementById('sidcDisplay');
    if (sidcDisplay) {
        sidcDisplay.innerHTML = sym.asSVG();
        sidcDisplay.innerHTML += '<br>SIDC: ' + sidc;

        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;

        if (designacion || dependencia) {
            const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
            texto.setAttribute("x", "35");
            texto.setAttribute("y", "35");
            texto.setAttribute("fill", "black");
            texto.textContent = designacion + (dependencia ? '/' + dependencia : '');
            sidcDisplay.appendChild(texto);
        }
    }
}


function cerrarPanelEdicion(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('show');
        console.log(`Panel ${panelId} cerrado`);
    } else {
        console.error(`Panel ${panelId} no encontrado al intentar cerrar`);
    }
}

function inicializarSelectores() {
    const armaSelect = document.getElementById('arma');
    if (armaSelect) {
        armaSelect.innerHTML = '';
        Object.entries(unidadesMilitares).forEach(([categoria, armas]) => {
            Object.keys(armas).forEach(arma => {
                let option = document.createElement('option');
                option.value = `${categoria}|${arma}`;
                option.textContent = arma;
                armaSelect.appendChild(option);
            });
        });
    }
}

function actualizarEtiquetaUnidad(elemento) {
    if (!elemento?.options) return;

    // Remover etiqueta existente
    if (elemento.etiquetaPersonalizada) {
        calcoActivo.removeLayer(elemento.etiquetaPersonalizada);
        elemento.etiquetaPersonalizada = null;
    }

    // Construir etiqueta con formato correcto
    const designacion = elemento.options.designacion || '';
    const dependencia = elemento.options.dependencia || '';
    let etiqueta = '';
    
    if (designacion && dependencia) {
        etiqueta = `${designacion}/${dependencia}`;
    } else if (designacion) {
        etiqueta = designacion;
    } else if (dependencia) {
        etiqueta = dependencia;
    }

    // No crear etiqueta si no hay texto
    if (!etiqueta.trim()) return;

    // Añadir estado reforzado/disminuido
    if (elemento.options.estado) {
        if (elemento.options.estado === 'reforzado') etiqueta += ' (+)';
        if (elemento.options.estado === 'disminuido') etiqueta += ' (-)';
    }

    // En lugar de crear un marcador separado, añadimos la etiqueta directamente al div icon
    // Para futuras manipulaciones, guardaremos referencia al texto original
    elemento.etiquetaTexto = etiqueta;
    
    // Función que actualiza la posición de la etiqueta basada en el zoom actual
    const actualizarPosicionEtiqueta = function() {
        if (!elemento || !elemento._icon) return;
        
        // Crear o actualizar el div de etiqueta
        let etiquetaDiv = elemento._icon.querySelector('.etiqueta-unidad');
        if (!etiquetaDiv) {
            etiquetaDiv = document.createElement('div');
            etiquetaDiv.className = 'etiqueta-unidad';
            etiquetaDiv.style = `
                position: absolute;
                bottom: -10px;
                right: -5px;
                color: black;
                font-weight: bold;
                white-space: nowrap;
                text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
                pointer-events: none;
                z-index: 1000;
            `;
            elemento._icon.appendChild(etiquetaDiv);
        }
        
        etiquetaDiv.textContent = elemento.etiquetaTexto;
    };
    
    // Aplicar inicialmente
    actualizarPosicionEtiqueta();
    
    // Actualizar cuando cambie el zoom
    elemento.off('add'); // Remover eventos previos
    elemento.on('add', actualizarPosicionEtiqueta);
    
    window.mapa.off('zoomend', actualizarPosicionEtiqueta);
    window.mapa.on('zoomend', actualizarPosicionEtiqueta);
}

function actualizarEtiquetaEquipo(elemento) {
    // Reutilizar la misma lógica para unidades y equipos
    actualizarEtiquetaUnidad(elemento);
}

function validarDatosElemento(designacion, dependencia) {
    return designacion?.trim() && dependencia?.trim();
}

function obtenerTipoDeElemento(sidc) {
    // Asegurarse de que el SIDC tiene al menos 15 caracteres
    if (!sidc || sidc.length < 15) {
        console.warn(`SIDC inválido o demasiado corto: ${sidc}`);
        return "desconocido";
    }

    try {
        // Extraer código (ejemplo: UCI, UCR, etc)
        // Asumimos que el código comienza en la posición 4 y tiene 3 caracteres
        const codigo = sidc.substring(4, 7);
        
        // Para equipos, la lógica puede ser diferente
        if (sidc.charAt(4) === 'E') {
            // Manejar equipos especialmente
            const codigoEquipo = sidc.substring(5, 7);
            
            // Mapeo de códigos de equipo a tipos
            const tiposEquipo = {
                'VA': 'vehiculo_armado',
                'VC': 'vehiculo_combate',
                'VU': 'vehiculo_utilitario',
                'AI': 'aeronave',
                'AH': 'helicoptero',
                // Añadir más mapeos según sea necesario
            };
            
            return tiposEquipo[codigoEquipo] || 'equipo_general';
        }
        
        // Buscar en unidadesMilitares
        for (const categoria in unidadesMilitares) {
            for (const arma in unidadesMilitares[categoria]) {
                if (unidadesMilitares[categoria][arma].codigo === codigo) {
                    return arma.toLowerCase();
                }
            }
        }
        
        // Si llegamos aquí y no encontramos un tipo, verificar códigos específicos
        switch(codigo) {
            case 'UCI':
                return 'infanteria';
            case 'UCR':
                return 'caballeria';
            case 'UCF':
                return 'artilleria';
            case 'UCE':
                return 'ingenieros';
            case 'UCD':
                return 'defensa_antiaerea';
            case 'UUS':
                return 'comunicaciones';
            case 'USM':
                return 'sanidad';
            case 'USS':
                return 'abastecimiento';
            case 'UST':
                return 'transporte';
            case 'USA':
                return 'personal';
            case 'UUM':
                return 'inteligencia';
            case 'UUA':
                return 'qbn';
            case 'UUL':
                return 'policia_militar';
            case 'UUT':
                return 'topografico';
            default:
                console.warn(`Código de unidad no reconocido: ${codigo} en SIDC: ${sidc}`);
                return "unidad_general";
        }
    } catch (error) {
        console.error(`Error al obtener tipo de elemento con SIDC: ${sidc}`, error);
        return "unidad_general";
    }
}

function actualizarPreviewSimboloEquipo() {
    const sidc = obtenerSIDCActualEquipo();
    const sym = new ms.Symbol(sidc, {size: 30});
    const sidcDisplay = document.getElementById('sidcDisplayEquipo');
    if (sidcDisplay) {
        sidcDisplay.innerHTML = sym.asSVG();
    }
}

function obtenerSIDCActualEquipo() {
    if (!elementoSeleccionado?.options?.sidc) return '';
    let sidc = elementoSeleccionado.options.sidc;
    sidc = sidc.substr(0, 1) + document.getElementById('afiliacionEquipo').value + sidc.substr(2);
    return sidc;
}


function actualizarEstiloElemento() {
    if (!elementoSeleccionado) return;

    var color = document.getElementById('colorLinea').value;
    var ancho = parseInt(document.getElementById('anchoLinea').value);
    var tipo = document.getElementById('tipoLinea').value;

    console.log('💾 Guardando cambios:', { color, ancho, tipo });

    const nuevoEstilo = {
        color: color,
        weight: ancho,
        opacity: 1,
        dashArray: tipo === 'dashed' ? '5, 5' : null
    };

    console.log('💾 Guardando nuevo estilo completo:', nuevoEstilo);

    // ✅ GUARDAR EL ESTILO EDITADO EN EL ELEMENTO:
    elementoSeleccionado._editedStyle = { ...nuevoEstilo };
    
    // ✅ TAMBIÉN GUARDAR COMO PROPIEDADES DIRECTAS PARA COMPATIBILIDAD:
    elementoSeleccionado.color = color;
    elementoSeleccionado.ancho = ancho;
    elementoSeleccionado.tipo = tipo; // ✅ CRUCIAL: Guardar el tipo tal como viene del selector

    // ✅ APLICAR ESTILO MANTENIENDO COLOR EDITADO + GROSOR DE SELECCIÓN:
    const estiloConSeleccion = {
        ...nuevoEstilo,
        weight: ancho + 3 // Solo aumentar grosor para indicar selección
    };

    if (elementoSeleccionado instanceof L.Path) {
        elementoSeleccionado.setStyle(estiloConSeleccion);
    } else if (elementoSeleccionado.polyline) {
        elementoSeleccionado.polyline.setStyle(estiloConSeleccion);
        elementoSeleccionado.polyline._editedStyle = { ...nuevoEstilo };
        elementoSeleccionado.polyline.color = color;
        elementoSeleccionado.polyline.ancho = ancho;
        elementoSeleccionado.polyline.tipo = tipo; // ✅ También para polylines
    }

    console.log('✅ Estilo actualizado y guardado. Propiedades del elemento:', {
        _editedStyle: elementoSeleccionado._editedStyle,
        color: elementoSeleccionado.color,
        ancho: elementoSeleccionado.ancho,
        tipo: elementoSeleccionado.tipo
    });

    if (elementoSeleccionado.id) {
        actualizarLinea(elementoSeleccionado.id);
    }
}


function actualizarIconoUnidad(elemento) {
    if (!elemento || !elemento.options) {
        console.warn('Elemento no válido para actualizar ícono');
        return;
    }

    const sym = new ms.Symbol(elemento.options.sidc, {
        size: 35,
        uniqueDesignation: elemento.options.designacion || ''
    });

    const icon = L.divIcon({
        className: `custom-div-icon equipo-${elemento.options.equipo}`,
        html: sym.asSVG(),
        iconSize: [70, 50],
        iconAnchor: [35, 25]
    });

    elemento.setIcon(icon);
}



function guardarCambiosUnidad() {
    console.log("Intentando guardar cambios de unidad");
    
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    try {
        // Obtener el SIDC actualizado con todos los cambios
        const nuevoSidc = obtenerSIDCActual();
        console.log("SIDC generado:", nuevoSidc);
        
        const designacion = document.getElementById('designacion').value;
        const dependencia = document.getElementById('dependencia').value;
        const tipo = obtenerTipoDeElemento(nuevoSidc);
        const magnitud = document.getElementById('magnitud').value;
        const esEquipoActual = esEquipo(nuevoSidc);
        
        // Validar campos requeridos: tipo, designación, magnitud, y propietario
        if (!tipo || tipo.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: El elemento debe tener un tipo definido", "error");
            }
            console.error('Validación fallida: falta tipo');
            return false;
        }
        
        if (!designacion || designacion.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar una designación para el elemento", "error");
            }
            console.error('Validación fallida: falta designación');
            return false;
        }
        
        if (!esEquipoActual && (!magnitud || magnitud.trim() === '')) {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar la magnitud del elemento", "error");
            }
            console.error('Validación fallida: falta magnitud');
            return false;
        }
        
        // Definir jugadorElemento antes de usarlo
        const jugadorElemento = elementoSeleccionado.options.jugador || window.userId;
        
        if (!jugadorElemento) {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: El elemento debe tener un propietario asignado", "error");
            }
            console.error('Validación fallida: falta propietario');
            return false;
        }
        
        console.log('✅ Validación completa - elemento tiene tipo, designación, magnitud y propietario');

        // Guardar la posición actual y el ID
        const posicionActual = elementoSeleccionado.getLatLng();
        const idElemento = elementoSeleccionado.options.id;
        const equipoElemento = elementoSeleccionado.options.equipo || window.equipoJugador;
        
        // Eliminar el marcador actual del calco
        window.calcoActivo.removeLayer(elementoSeleccionado);
        
        // Crear un nuevo símbolo con el SIDC actualizado
        const sym = new ms.Symbol(nuevoSidc, { size: 35 });
        
        // Crear un nuevo icono
        const icon = L.divIcon({
            className: `custom-div-icon equipo-${equipoElemento}`,
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });
        
        // Crear un nuevo marcador con todas las propiedades actualizadas
        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            magnitud: !esEquipoActual ? magnitud : undefined,
            equipo: equipoElemento,
            jugador: jugadorElemento
        });
        
        // Añadir el nuevo marcador al calco
        nuevoMarcador.addTo(window.calcoActivo);
        
        // Actualizar etiqueta
        actualizarEtiquetaUnidad(nuevoMarcador);
        
        // Actualizar referencia al elemento seleccionado
        elementoSeleccionado = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;
        
        // Cerrar panel
        cerrarPanelEdicion('panelEdicionUnidad');
        
        // Enviar al servidor
        console.log("Enviando elemento actualizado al servidor");
        const enviado = enviarElementoAlServidor(nuevoMarcador);
        
        if (enviado) {
            // Notificar éxito
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Cambios guardados correctamente", "success");
            }
        }

        return enviado;
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        return false;
    }
}

function guardarCambiosEquipo() {
    if (!elementoSeleccionado) {
        console.warn('No hay elemento seleccionado para guardar cambios');
        return false;
    }

    try {
        const nuevoSidc = obtenerSIDCActualEquipo();
        const designacion = document.getElementById('designacionEquipo').value;
        const dependencia = document.getElementById('asignacionEquipo').value;
        
        // Validar campos requeridos para equipos: tipo, designación, y propietario
        // (Los equipos no requieren magnitud)
        
        if (!designacion || designacion.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar una designación para el equipo", "error");
            } else if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Designación es obligatoria para equipos',
                    'error'
                );
            } else {
                alert('Designación es obligatoria para equipos');
            }
            return false;
        }
        
        if (!dependencia || dependencia.trim() === '') {
            if (window.MAIRA?.Utils?.mostrarNotificacion) {
                window.MAIRA.Utils.mostrarNotificacion("Error: Debe ingresar la dependencia/asignación para el equipo", "error");
            } else if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'Asignación es obligatoria para equipos',
                    'error'
                );
            } else {
                alert('Asignación es obligatoria para equipos');
            }
            return false;
        }
        
        // Obtener tipo de equipo
        const tipo = obtenerTipoDeElemento(nuevoSidc);
        if (!tipo) {
            if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
                window.gestorJuego.gestorInterfaz.mostrarMensaje(
                    'No se pudo determinar el tipo de equipo',
                    'error'
                );
            } else {
                alert('No se pudo determinar el tipo de equipo');
            }
            return false;
        }

        // Guardar posición actual e ID
        const posicionActual = elementoSeleccionado.getLatLng();
        const idElemento = elementoSeleccionado.options.id;
        const equipoElemento = window.equipoJugador;
        
        // Eliminar el elemento actual del calco
        window.calcoActivo.removeLayer(elementoSeleccionado);

        // Crear nuevo símbolo
        const sym = new ms.Symbol(nuevoSidc, {
            size: 35,
        });

        // Crear nuevo icono
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: sym.asSVG(),
            iconSize: [70, 50],
            iconAnchor: [35, 25]
        });

        // Crear nuevo marcador con todas las propiedades
        // Función auxiliar para obtener el jugador propietario correcto
        function obtenerJugadorPropietario() {
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
                return window.gestorTurnos.obtenerJugadorPropietario();
            }
            return window.userId;
        }

        const nuevoMarcador = L.marker(posicionActual, {
            icon: icon,
            draggable: true,
            id: idElemento,
            sidc: nuevoSidc,
            tipo: tipo,
            designacion: designacion,
            dependencia: dependencia,
            equipoJugador: equipoElemento,
            jugadorId: obtenerJugadorPropietario()
        });
        
        // Añadir el nuevo marcador al calco
        nuevoMarcador.addTo(window.calcoActivo);
        
        // Actualizar etiqueta
        actualizarEtiquetaEquipo(nuevoMarcador);
        
        // Actualizar referencia al elemento seleccionado
        elementoSeleccionado = nuevoMarcador;
        window.elementoSeleccionado = nuevoMarcador;

        // Cerrar panel
        cerrarPanelEdicion('panelEdicionEquipo');
        
        // Enviar al servidor
        console.log("Enviando equipo actualizado al servidor");
        const enviado = enviarElementoAlServidor(nuevoMarcador);
        console.log("Resultado de envío de equipo:", enviado);
        
        // Actualizar botón listo si es necesario
        window.gestorJuego?.gestorFases?.actualizarBotonListo?.();
        
        return true;
    } catch (error) {
        console.error('Error al guardar cambios de equipo:', error);
        
        if (window.gestorJuego?.gestorInterfaz?.mostrarMensaje) {
            window.gestorJuego.gestorInterfaz.mostrarMensaje(
                'Error al guardar cambios: ' + (error.message || 'Error desconocido'),
                'error'
            );
        } else {
            alert('Error al guardar cambios: ' + (error.message || 'Error desconocido'));
        }
        
        return false;
    }
}

function enviarElementoAlServidor(elemento) {
    try {
        // Modificar para usar el socket correcto desde MAIRA.GestionBatalla
        const socket = window.MAIRA?.GestionBatalla?.getSocket?.() || window.socket;
        
        if (!socket?.connected) {
            console.error('[EdicionCompleto] Socket no conectado');
            return false;
        }

        // Función auxiliar para obtener el jugador propietario correcto
        function obtenerJugadorPropietario() {
            if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
                return window.gestorTurnos.obtenerJugadorPropietario();
            }
            return window.userId;
        }

        const datosElemento = {
            id: elemento.options.id,
            tipo: elemento.options.tipo,
            sidc: elemento.options.sidc,
            designacion: elemento.options.designacion,
            dependencia: elemento.options.dependencia,
            magnitud: elemento.options.magnitud,
            coordenadas: elemento.getLatLng(),
            equipo: window.equipoJugador,
            jugadorId: obtenerJugadorPropietario(),
            operacion: window.MAIRA?.GestionBatalla?.operacionActual || window.operacionActual
        };

        // Emitir por múltiples canales para asegurar compatibilidad
        socket.emit('guardarElemento', datosElemento);
        socket.emit('actualizarElemento', datosElemento);
        socket.emit('nuevoElemento', datosElemento);

        return true;
    } catch (error) {
        console.error('[EdicionCompleto] Error:', error);
        return false;
    }
}

function mostrarPanelEdicionMCC(elemento, tipo) {
    console.log("Mostrando panel de edición MCC para tipo:", tipo);
    mostrarPanelEdicion('panelEdicionMCC');
    
    let panel = document.getElementById('panelEdicionMCC');
    if (!panel) {
        console.error('Panel de edición MCC no encontrado');
        return;
    }

    // Eliminar cualquier textoAsociado existente y quedarse solo con textoMarcador
    if (elemento.textoAsociado && elemento.textoMarcador) {
        console.log("Eliminando textoAsociado duplicado antes de editar");
        calcoActivo.removeLayer(elemento.textoAsociado);
        elemento.textoAsociado = null;
    }

    // Obtener el texto actual del elemento
    let textoMCC = '';
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            textoMCC = divTexto.textContent;
        }
    } else if (elemento.textoAsociado && elemento.textoAsociado._icon) {
        const divTexto = elemento.textoAsociado._icon.querySelector('div');
        if (divTexto) {
            textoMCC = divTexto.textContent;
        }
    } else {
        textoMCC = elemento.options.nombre || elemento.nombre || '';
    }
    
    document.getElementById('textoMCC').value = textoMCC;

    // Cargar propiedades actuales
    document.getElementById('colorMCC').value = elemento.options.color || '#000000';
    document.getElementById('anchoMCC').value = elemento.options.weight || 3;
    document.getElementById('tipoLineaMCC').value = elemento.options.dashArray ? 'dashed' : 'solid';

    // Mostrar/ocultar opciones de relleno según el tipo
    if (tipo === 'poligono') {
        document.getElementById('rellenoMCC').style.display = 'block';
        let tipoRelleno = determinarTipoRelleno(elemento);
        document.getElementById('tipoRellenoMCC').value = tipoRelleno;
        document.getElementById('colorRellenoMCC').value = elemento.options.fillColor || '#ffffff';
    } else {
        document.getElementById('rellenoMCC').style.display = 'none';
    }

    document.getElementById('guardarCambiosMCC').onclick = function() {
        guardarCambiosMCC(elemento, tipo);
    };
}

function guardarCambiosMCC(elemento, tipo) {
    let nuevoTexto = document.getElementById('textoMCC').value;
    let nuevoColor = document.getElementById('colorMCC').value;
    let nuevoAncho = parseInt(document.getElementById('anchoMCC').value);
    let nuevoTipoLinea = document.getElementById('tipoLineaMCC').value;

    // Actualizar propiedades del elemento
    elemento.setStyle({
        color: nuevoColor,
        weight: nuevoAncho,
        dashArray: nuevoTipoLinea === 'dashed' ? '5,5' : null
    });

    if (tipo === 'poligono') {
        let nuevoRelleno = document.getElementById('tipoRellenoMCC').value;
        let nuevoColorRelleno = document.getElementById('colorRellenoMCC').value;
        aplicarRelleno(elemento, nuevoRelleno, nuevoColorRelleno);
    }

    // Actualizar directamente el textoMarcador si existe
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            // Actualizar también las propiedades
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
        }
    } 
    // Si no existe textoMarcador pero sí textoAsociado, eliminarlo y crear textoMarcador
    else if (elemento.textoAsociado) {
        calcoActivo.removeLayer(elemento.textoAsociado);
        elemento.textoAsociado = null;
        
        // Crear nuevo textoMarcador con las propiedades correctas
        let posicion;
        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            const latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }
        
        elemento.textoMarcador = L.marker(posicion, {
            icon: L.divIcon({
                className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                html: `<div style="color: black;">${nuevoTexto}</div>`,
                iconSize: [100, 20]
            }),
            draggable: true,
            interactive: true
        }).addTo(calcoActivo);
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
    }
    // Si no existe ninguno, crear textoMarcador
    else if (nuevoTexto.trim() !== '') {
        let posicion;
        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            const latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }
        
        elemento.textoMarcador = L.marker(posicion, {
            icon: L.divIcon({
                className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                html: `<div style="color: black;">${nuevoTexto}</div>`,
                iconSize: [100, 20]
            }),
            draggable: true,
            interactive: true
        }).addTo(calcoActivo);
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
    }

    cerrarPanelEdicion('panelEdicionMCC');
    console.log('Cambios MCC guardados');
    
    // ✅ ACTUALIZAR SOLO textoMarcador (NO TOOLTIP):
    if (elemento.textoMarcador && nuevoTexto && nuevoTexto.trim() !== '') {
        // Actualizar textoMarcador existente
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            elemento.options.texto = nuevoTexto;
            elemento.texto = nuevoTexto;
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            console.log(`✅ textoMarcador actualizado: "${nuevoTexto}"`);
        }
    } else if ((!elemento.textoMarcador || !nuevoTexto || nuevoTexto.trim() === '')) {
        // Eliminar textoMarcador si no hay texto
        if (elemento.textoMarcador) {
            calcoActivo.removeLayer(elemento.textoMarcador);
            elemento.textoMarcador = null;
            console.log(`🗑️ textoMarcador eliminado`);
        }
        elemento.options.texto = null;
        elemento.texto = null;
        elemento.options.nombre = null;
        elemento.nombre = null;
    } else if (nuevoTexto && nuevoTexto.trim() !== '' && !elemento.textoMarcador) {
        // Crear nuevo textoMarcador
        let posicion;
        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            const latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }
        
        elemento.textoMarcador = L.marker(posicion, {
            icon: L.divIcon({
                className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                html: `<div style="color: black;">${nuevoTexto}</div>`,
                iconSize: [100, 20]
            }),
            draggable: true,
            interactive: true
        }).addTo(calcoActivo);
        
        // ✅ EVENTOS CRÍTICOS PARA EL textoMarcador:
        elemento.textoMarcador.on('click', function(e) {
            console.log('🎯 Click en textoMarcador - seleccionando elemento padre');
            seleccionarElemento(elemento);
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('dblclick', function(e) {
            console.log('🎯 Doble click en textoMarcador - editando elemento padre');
            if (typeof editarElementoSeleccionado === 'function') {
                window.elementoSeleccionado = elemento;
                editarElementoSeleccionado();
            }
            e.originalEvent.stopPropagation();
        });
        
        elemento.textoMarcador.on('contextmenu', function(e) {
            console.log('🎯 Click derecho en textoMarcador - menú contextual del elemento padre');
            window.elementoSeleccionado = elemento;
            seleccionarElemento(elemento);
            // Permitir que el menú contextual se propague
        });
        
        // ✅ REFERENCIA BIDIRECCIONAL:
        elemento.textoMarcador.elementoPadre = elemento;
    }
}


/**
 * Muestra el panel de edición de línea
 * @param {Object} elemento - El elemento de línea a editar
 */
function mostrarPanelEdicionLinea(elemento) {
    mostrarPanelEdicion('panelEdicionLinea');
    console.log("Mostrando panel de edición de línea para:", elemento);
    var panel = document.getElementById('panelEdicionLinea');
    if (!panel) {
        console.error('Panel de edición de línea no encontrado');
        return;
    }

    panel.style.display = 'block';
    elementoSeleccionado = elemento;
    
    // Detectar nombre actual examinando todas las posibles fuentes
    let nombreActual = '';
    
    // Prioridad 1: Verificar textoMarcador
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            nombreActual = divTexto.textContent;
            console.log("Nombre obtenido de textoMarcador:", nombreActual);
        }
    }
    
    // Prioridad 2: Verificar textoAsociado
    if (!nombreActual && elemento.textoAsociado) {
        if (elemento.textoAsociado._icon) {
            const divTexto = elemento.textoAsociado._icon.querySelector('div');
            if (divTexto) {
                nombreActual = divTexto.textContent;
                console.log("Nombre obtenido de textoAsociado:", nombreActual);
            }
        }
    }
    
    // Prioridad 3: Verificar propiedades del elemento
    if (!nombreActual) {
        nombreActual = elemento.options?.nombre || elemento.nombre || '';
        console.log("Nombre obtenido de propiedades:", nombreActual);
    }

    document.getElementById('nombreLinea').value = nombreActual;
    document.getElementById('colorLinea').value = elemento.options?.color || elemento.color || '#3388ff';
    document.getElementById('anchoLinea').value = elemento.options?.weight || elemento.ancho || 3;
    document.getElementById('tipoLinea').value = (elemento.options?.dashArray || elemento.tipo === 'dashed') ? 'dashed' : 'solid';
}

function guardarCambiosLinea() {
    if (!elementoSeleccionado) return;
    
    // Obtener los nuevos valores
    const nuevoNombre = document.getElementById('nombreLinea').value;
    const nuevoColor = document.getElementById('colorLinea').value;
    const nuevoAncho = parseInt(document.getElementById('anchoLinea').value);
    const nuevoDashArray = document.getElementById('tipoLinea').value === 'dashed' ? '5, 5' : null;
    
    console.log("Guardando cambios, nuevo nombre:", nuevoNombre);
    
    // Actualizar propiedades del elemento
    elementoSeleccionado.options = elementoSeleccionado.options || {};
    elementoSeleccionado.options.nombre = nuevoNombre;
    elementoSeleccionado.options.color = nuevoColor;
    elementoSeleccionado.options.weight = nuevoAncho;
    elementoSeleccionado.options.dashArray = nuevoDashArray;
    
    // También actualizar propiedades directas
    elementoSeleccionado.nombre = nuevoNombre;
    elementoSeleccionado.color = nuevoColor;
    elementoSeleccionado.ancho = nuevoAncho;
    elementoSeleccionado.tipo = document.getElementById('tipoLinea').value;
    
    // Aplicar estilo visual
    elementoSeleccionado.setStyle({
        color: nuevoColor,
        weight: nuevoAncho,
        dashArray: nuevoDashArray
    });
    
    // IMPORTANTE: Actualizar SOLO el textoMarcador existente, NO llamar a actualizarTextoElemento
    if (elementoSeleccionado.textoMarcador && elementoSeleccionado.textoMarcador._icon) {
        const divTexto = elementoSeleccionado.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            console.log("Actualizando texto directamente:", nuevoNombre);
            divTexto.textContent = nuevoNombre;
        }
    }
    
    // Eliminar cualquier textoAsociado que pudiera existir
    if (elementoSeleccionado.textoAsociado) {
        console.log("Eliminando textoAsociado duplicado");
        try {
            calcoActivo.removeLayer(elementoSeleccionado.textoAsociado);
            elementoSeleccionado.textoAsociado = null;
        } catch (e) {
            console.error("Error al eliminar textoAsociado:", e);
        }
    }
    
    cerrarPanelEdicion('panelEdicionLinea');
}

function crearNuevoTextoMarcador(elemento, texto) {
    // Calcular posición adecuada
    let posicion;
    if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento instanceof L.Polyline) {
        const latlngs = elemento.getLatLngs();
        posicion = latlngs[Math.floor(latlngs.length / 2)];
    } else {
        posicion = elemento.getLatLng();
    }
    
    // Crear el marcador con la clase correcta
    elemento.textoMarcador = L.marker(posicion, {
        icon: L.divIcon({
            className: elemento instanceof L.Polygon ? 'texto-poligono' : 'texto-linea',
            html: `<div style="color: black;">${texto}</div>`,
            iconSize: [100, 20]
        }),
        draggable: true,
        interactive: true
    }).addTo(window.calcoActivo);
    
    console.log("Nuevo textoMarcador creado:", elemento.textoMarcador);
    
    // Configurar eventos para mantener sincronización
    if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
        elemento.on('edit', function() {
            if (this.textoMarcador) {
                let nuevaPos;
                if (this instanceof L.Polygon) {
                    nuevaPos = this.getBounds().getCenter();
                } else {
                    const pts = this.getLatLngs();
                    nuevaPos = pts[Math.floor(pts.length / 2)];
                }
                this.textoMarcador.setLatLng(nuevaPos);
            }
        });
    }
    
    return elemento.textoMarcador;
}

function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    console.log(`Actualizando texto de ${tipo} a "${nuevoTexto}"`);
    
    // 1. Eliminar textoAsociado si existe (para evitar duplicados)
    if (elemento.textoAsociado) {
        console.log("Eliminando textoAsociado existente");
        calcoActivo.removeLayer(elemento.textoAsociado);
        elemento.textoAsociado = null;
    }
    
    // 2. Verificar si existe un textoMarcador y actualizarlo
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        console.log("Actualizando textoMarcador existente");
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            return; // Terminamos aquí
        }
    }
    
    // 3. Si no existe textoMarcador, creamos uno nuevo
    if (nuevoTexto.trim() !== '') {
        console.log("Creando nuevo textoMarcador");
        let posicion;
        
        if (tipo === 'poligono') {
            posicion = elemento.getBounds().getCenter();
        } else if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            const latlngs = elemento.getLatLngs();
            posicion = latlngs[Math.floor(latlngs.length / 2)];
        } else {
            posicion = elemento.getLatLng();
        }
        
        // Crear textoMarcador en lugar de textoAsociado
        elemento.textoMarcador = L.marker(posicion, {
            icon: L.divIcon({
                className: tipo === 'poligono' ? 'texto-poligono' : 'texto-linea',
                html: `<div style="color: black;">${nuevoTexto}</div>`,
                iconSize: [100, 20]
            }),
            draggable: true,
            interactive: true
        }).addTo(calcoActivo);
        
        // Configurar eventos para mantener el texto en la línea/polígono
        if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha' || tipo === 'poligono') {
            elemento.on('edit', function() {
                if (this.textoMarcador) {
                    let nuevaPosicion;
                    if (this instanceof L.Polygon) {
                        nuevaPosicion = this.getBounds().getCenter();
                    } else if (this instanceof L.Polyline) {
                        const latlngs = this.getLatLngs();
                        nuevaPosicion = latlngs[Math.floor(latlngs.length / 2)];
                    }
                    this.textoMarcador.setLatLng(nuevaPosicion);
                }
            });
        }
    }
    
    // Actualizar el nombre del elemento
    elemento.options.nombre = nuevoTexto;
    elemento.nombre = nuevoTexto;
}

/**
 * Crea un textoMarcador para el elemento
 * @param {Object} elemento - El elemento al que se asociará el textoMarcador
 * @param {string} texto - El texto a mostrar
 */
function crearTextoMarcador(elemento, texto) {
    // Determinar la posición según el tipo de elemento
    let posicion;
    if (elemento instanceof L.Polygon) {
        posicion = elemento.getBounds().getCenter();
    } else if (elemento instanceof L.Polyline || elemento._latlngs) {
        const latlngs = elemento.getLatLngs();
        posicion = latlngs[Math.floor(latlngs.length / 2)];
    } else {
        posicion = window.mapa.getCenter();
    }
    
    // Determinar la clase CSS correcta
    let claseCss = 'texto-linea';
    if (elemento instanceof L.Polygon) {
        claseCss = 'texto-poligono';
    }
    
    // Crear el marcador con las propiedades correctas
    const textoMarcador = L.marker(posicion, {
        icon: L.divIcon({
            className: claseCss,
            html: `<div style="color: black;">${texto}</div>`,
            iconSize: [100, 20]
        }),
        draggable: true,
        interactive: true
    }).addTo(calcoActivo || window.mapa);
    
    // Asignar al elemento
    elemento.textoMarcador = textoMarcador;
    
    console.log(`Creado nuevo textoMarcador con clase ${claseCss} y texto "${texto}"`);
    return textoMarcador;
}

/**
 * Versión modificada de actualizarTextoElemento que respeta textoMarcador
 * @param {Object} elemento - El elemento cuyo texto se actualizará
 * @param {string} nuevoTexto - El nuevo texto
 * @param {string} tipo - El tipo de elemento ('linea', 'poligono', etc.)
 */
function actualizarTextoElemento(elemento, nuevoTexto, tipo) {
    // Verificar si ya existe un textoMarcador y actualizarlo
    if (elemento.textoMarcador && elemento.textoMarcador._icon) {
        const divTexto = elemento.textoMarcador._icon.querySelector('div');
        if (divTexto) {
            divTexto.textContent = nuevoTexto;
            // Actualizar el nombre del elemento
            elemento.options.nombre = nuevoTexto;
            elemento.nombre = nuevoTexto;
            return; // Terminamos aquí si actualizamos el textoMarcador
        }
    }
    
    // Si no hay textoMarcador, continuar con la lógica original
    // Eliminar el texto asociado existente si lo hay
    if (elemento.textoAsociado) {
        calcoActivo.removeLayer(elemento.textoAsociado);
    }

    if (nuevoTexto.trim() !== '') {
        let posicion, draggable, dragConstraint;

        if (tipo === 'poligono' || tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha') {
            let latlngs = elemento.getLatLngs();
            posicion = tipo === 'poligono' ? elemento.getBounds().getCenter() : latlngs[Math.floor(latlngs.length / 2)];
            draggable = true;
            dragConstraint = function(latlng) {
                return elemento.closestLayerPoint(latlng);
            };
        } else {
            posicion = elemento.getLatLng();
            draggable = false;
        }

        elemento.textoAsociado = L.marker(posicion, {
            icon: L.divIcon({
                className: 'texto-elemento',
                html: `<div style="color: black; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;">${nuevoTexto}</div>`,
                iconSize: [100, 40],
                iconAnchor: [50, 20]
            }),
            draggable: draggable
        }).addTo(calcoActivo);

        if (draggable) {
            elemento.textoAsociado.on('drag', function(e) {
                if (dragConstraint) {
                    let closestPoint = dragConstraint(e.latlng);
                    e.target.setLatLng(mapa.layerPointToLatLng(closestPoint));
                }
            });
        }

        // Para todos los tipos, actualizar la posición del texto cuando el elemento se mueve
        elemento.on('move', function() {
            actualizarPosicionTexto(elemento);
        });

        // Para polilíneas y polígonos, actualizar cuando se editan
        if (tipo === 'linea' || tipo === 'flecha' || tipo === 'flechaAncha' || tipo === 'poligono') {
            elemento.on('edit', function() {
                actualizarPosicionTexto(elemento);
            });
        }
    }

    // Actualizar el nombre del elemento
    elemento.options.nombre = nuevoTexto;
    elemento.nombre = nuevoTexto;
}

function actualizarPosicionTexto(elemento) {
    if (elemento.textoAsociado) {
        let nuevaPosicion;
        if (elemento instanceof L.Polyline || elemento instanceof L.Polygon) {
            let latlngs = elemento.getLatLngs();
            nuevaPosicion = elemento instanceof L.Polygon ? 
                elemento.getBounds().getCenter() : 
                latlngs[Math.floor(latlngs.length / 2)];
        } else {
            nuevaPosicion = elemento.getLatLng();
        }
        elemento.textoAsociado.setLatLng(nuevaPosicion);
    }
}

function determinarTipoRelleno(elemento) {
    if (elemento.options.fillPattern) {
        if (elemento.options.fillPattern instanceof L.StripePattern) return 'diagonal';
        // Añadir más condiciones para otros tipos de patrones
    }
    return elemento.options.fillOpacity > 0 ? 'solid' : 'none';
}

function obtenerPatronRelleno(tipoRelleno, color) {
    switch(tipoRelleno) {
        case 'diagonal':
            // Patrón de líneas diagonales
            return new L.StripePattern({
                color: color,
                weight: 2,
                spaceWeight: 4,
                angle: 45
            });
            
        case 'rombos':
            // Patrón de rombos (dos patrones diagonales superpuestos)
            return {
                tipo: 'compuesto',
                patrones: [
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 45
                    }),
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: -45
                    })
                ]
            };
            
        case 'cuadros':
            // Patrón de cuadrícula (dos patrones rectos superpuestos)
            return {
                tipo: 'compuesto',
                patrones: [
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 0  // Horizontal
                    }),
                    new L.StripePattern({
                        color: color,
                        weight: 2,
                        spaceWeight: 6,
                        angle: 90  // Vertical
                    })
                ]
            };
            
        case 'puntos':
            // Creamos un patrón de puntos real utilizando un patrón SVG
            const dotPattern = new L.PatternCircle({
                x: 5,
                y: 5,
                radius: 2,
                fill: true,
                color: color,
                fillColor: color,
                fillOpacity: 1.0,
                weight: 0
            });
            
            // Creamos un contenedor para los puntos
            const pattern = new L.Pattern({
                width: 10,
                height: 10
            });
            
            // Agregamos el círculo al patrón
            pattern.addShape(dotPattern);
            
            return pattern;
            
        default:
            return null;
    }
}

function aplicarRelleno(elemento, tipoRelleno, color) {
    // Limpiar patrones anteriores
    if (elemento._capasSecundarias) {
        elemento._capasSecundarias.forEach(capa => {
            if (window.calcoActivo && window.calcoActivo.hasLayer(capa)) {
                window.calcoActivo.removeLayer(capa);
            } else if (window.mapa && window.mapa.hasLayer(capa)) {
                window.mapa.removeLayer(capa);
            }
        });
        elemento._capasSecundarias = null;
    }
    
    // Si hay algún patrón aplicado al elemento, eliminarlo
    if (elemento.options.fillPattern && elemento.options.fillPattern._removeShapes) {
        window.mapa.removePattern(elemento.options.fillPattern);
    }
    
    switch(tipoRelleno) {
        case 'none':
            elemento.setStyle({fillOpacity: 0, fillPattern: null});
            break;
            
        case 'solid':
            elemento.setStyle({
                fillOpacity: 0.2, 
                fillColor: color, 
                fillPattern: null
            });
            break;
            
        case 'rombos':
        case 'cuadros':
            const patronCompuesto = obtenerPatronRelleno(tipoRelleno, color);
            if (patronCompuesto && patronCompuesto.tipo === 'compuesto') {
                // Añadir patrones al mapa
                patronCompuesto.patrones.forEach(patron => {
                    patron.addTo(window.mapa);
                });
                
                // Aplicar el primer patrón al elemento principal
                elemento.setStyle({
                    fillPattern: patronCompuesto.patrones[0],
                    fillOpacity: 0.7
                });
                
                // Crear un duplicado del polígono para el segundo patrón
                const coords = elemento.getLatLngs();
                const segundaLayer = L.polygon(coords, {
                    fillPattern: patronCompuesto.patrones[1],
                    fillOpacity: 0.7,
                    color: 'transparent', // Sin borde
                    weight: 0
                }).addTo(window.calcoActivo || window.mapa);
                
                // Guardar referencia para poder eliminarlo después
                elemento._capasSecundarias = [segundaLayer];
            }
            break;
            
        case 'puntos':
            const patronPuntos = obtenerPatronRelleno(tipoRelleno, color);
            if (patronPuntos) {
                // Añadir el patrón al mapa
                patronPuntos.addTo(window.mapa);
                
                // Aplicar el patrón directamente al elemento
                elemento.setStyle({
                    fillPattern: patronPuntos,
                    fillOpacity: 1
                });
            }
            break;
            
        default:
            // Para diagonal y otros patrones simples
            let patron = obtenerPatronRelleno(tipoRelleno, color);
            if (patron && patron.addTo) {
                patron.addTo(window.mapa);
                elemento.setStyle({
                    fillPattern: patron,
                    fillOpacity: 1
                });
            }
            break;
    }
}

function initializeTabs() {
    var tabs = document.querySelectorAll('.tablinks');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function(event) {
            openTab(event, this.getAttribute('data-tab'));
        });
    });
    // Abrir la primera pestaña por defecto
    if (tabs.length > 0) {
        openTab({ currentTarget: tabs[0] }, tabs[0].getAttribute('data-tab'));
    }
}

function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}


// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectores();

    document.getElementById('arma').addEventListener('change', function() {
        actualizarTipos(this.value);
    });

    document.getElementById('tipo').addEventListener('change', function() {
        actualizarCaracteristicas(document.getElementById('arma').value, this.value);
    });

    ['afiliacion', 'estado', 'arma', 'tipo', 'caracteristica', 'magnitud', 'puestoComando', 'fuerzaTarea', 'reforzado', 'disminuido', 'designacion', 'dependencia'].forEach(function(id) {
        document.getElementById(id).addEventListener('change', actualizarPreviewSimbolo);
    });

    document.getElementById('guardarCambiosUnidad').addEventListener('click', guardarCambiosUnidad);
    document.getElementById('guardarCambiosEquipo').addEventListener('click', guardarCambiosEquipo);
    document.getElementById('guardarCambiosLinea').addEventListener('click', guardarCambiosLinea);

    // Añadir listeners para los botones de cerrar paneles
    ['panelEdicionUnidad', 'panelEdicionEquipo', 'panelEdicionLinea', 'panelEdicionMCC'].forEach(function(panelId) {
        var cerrarBtn = document.getElementById('cerrar' + panelId.charAt(0).toUpperCase() + panelId.slice(1));
        if (cerrarBtn) {
            cerrarBtn.addEventListener('click', function() {
                cerrarPanelEdicion(panelId);
            });
        }
    });
});

function editarElementoSeleccionado() {
    console.log("🎯 [DEBUG] editarElementoSeleccionado (original) llamada");
    console.log("🎯 [DEBUG] elementoSeleccionado:", elementoSeleccionado);
    
    if (!elementoSeleccionado) {
        console.warn("🎯 [DEBUG] No hay elementoSeleccionado");
        return;
    }

    console.log("🎯 [DEBUG] Tipo de elemento:", elementoSeleccionado.constructor.name);
    console.log("🎯 [DEBUG] Es marker:", elementoSeleccionado instanceof L.Marker);
    
    if (elementoSeleccionado instanceof L.Marker) {
        console.log("🎯 [DEBUG] options:", elementoSeleccionado.options);
        console.log("🎯 [DEBUG] sidc:", elementoSeleccionado.options.sidc);
        
        if (elementoSeleccionado.options.sidc) {
            console.log("🎯 [DEBUG] Verificando tipo de SIDC...");
            if (esEquipo(elementoSeleccionado.options.sidc)) {
                console.log("🎯 [DEBUG] Es equipo, mostrando panel equipo");
                mostrarPanelEdicionEquipo(elementoSeleccionado);
            } else if (esUnidad(elementoSeleccionado.options.sidc)) {
                console.log("🎯 [DEBUG] Es unidad, mostrando panel unidad");
                mostrarPanelEdicionUnidad(elementoSeleccionado);
            } else {
                console.log("🎯 [DEBUG] Elemento especial");
                mostrarPanelEdicionElementoEspecial(elementoSeleccionado);
            }
        } else {
            console.log("🎯 [DEBUG] Elemento sin SIDC identificado");
        }
    } else if (elementoSeleccionado instanceof L.Polyline || elementoSeleccionado instanceof L.Polygon) {
        console.log("🎯 [DEBUG] Es polyline/polygon, mostrando panel MCC");
        mostrarPanelEdicionMCC(elementoSeleccionado, determinarTipoMCC(elementoSeleccionado));
    }
}

function determinarTipoMCC(elemento) {
    if (elemento instanceof L.Polygon) return 'poligono';
    if (elemento.options.tipoElemento === 'flechaAncha') return 'flechaAncha';
    if (elemento.options.tipoElemento === 'flecha') return 'flecha';
    return 'linea';
}

function esEquipo(sidc) {
    return sidc.charAt(4) === 'E';
}

function esUnidad(sidc) {
    return sidc.charAt(4) === 'U';
}

function verificarElementosAntesDeEnviarListo() {
    // Función auxiliar para obtener el jugador propietario correcto
    function obtenerJugadorPropietario() {
        if (window.gestorTurnos && window.gestorTurnos.obtenerJugadorPropietario) {
            return window.gestorTurnos.obtenerJugadorPropietario();
        }
        return window.userId;
    }
    
    const jugadorId = obtenerJugadorPropietario();
    if (!jugadorId) {
        console.error('No hay ID de jugador disponible');
        return false;
    }
    
    // Obtener y mostrar todos los elementos
    const elementos = [];
    if (window.calcoActivo) {
        window.calcoActivo.eachLayer(layer => {
            if (layer.options && 
                (layer.options.jugadorId === jugadorId || layer.options.jugador === jugadorId)) {
                elementos.push(layer);
            }
        });
    }
    
    console.group(`[Diagnóstico] Elementos para jugador ${jugadorId} antes de marcar como listo`);
    console.log(`Total elementos: ${elementos.length}`);
    
    elementos.forEach((elem, i) => {
        const esEquipo = elem.options?.sidc?.charAt(4) === 'E';
        console.log(`Elemento #${i+1}:`, {
            id: elem.options?.id,
            tipo: elem.options?.tipo,
            designacion: elem.options?.designacion,
            dependencia: elem.options?.dependencia,
            magnitud: elem.options?.magnitud,
            sidc: elem.options?.sidc,
            esEquipo
        });
    });
    
    console.groupEnd();
    
    // En verificarElementosAntesDeEnviarListo(), agregar:
    if (window.gestorJuego?.gestorFases?.validarElementosJugador) {
        return window.gestorJuego.gestorFases.validarElementosJugador(jugadorId);
    }

    return elementos.length > 0;
}

// Usar esta función justo antes de enviar el estado "listo" al servidor



// Exportación de funciones para uso en otros archivos
window.mostrarPanelEdicionUnidad = mostrarPanelEdicionUnidad;
window.guardarCambiosUnidad = guardarCambiosUnidad;
window.cerrarPanelEdicion = cerrarPanelEdicion;
window.cerrarTodosPaneles = cerrarTodosPaneles; // ✅ AGREGAR FUNCIÓN FALTANTE
window.actualizarPreviewSimbolo = actualizarPreviewSimbolo;
window.mostrarPanelEdicionEquipo = mostrarPanelEdicionEquipo;
window.guardarCambiosEquipo = guardarCambiosEquipo;
window.mostrarPanelEdicionLinea = mostrarPanelEdicionLinea;
window.guardarCambiosLinea = guardarCambiosLinea;
window.actualizarEstiloElemento = actualizarEstiloElemento;
window.mostrarPanelEdicionMCC = mostrarPanelEdicionMCC;
window.guardarCambiosMCC = guardarCambiosMCC;
window.editarElementoSeleccionado = editarElementoSeleccionado;
window.actualizarCampoSIDC = actualizarCampoSIDC;
window.esEquipo = esEquipo;
window.esUnidad = esUnidad;

// Preservar la función original para uso en GB
window.editarElementoSeleccionadoOriginal = editarElementoSeleccionado;

// AGREGAR al final del archivo:
window.MAIRA = window.MAIRA || {};
window.MAIRA.EdicionCompleto = {
    verificarElementos: verificarElementosAntesDeEnviarListo,
    validarDatos: validarDatosElemento,
    aplicarRelleno: aplicarRelleno,
    obtenerPatronRelleno: obtenerPatronRelleno
};