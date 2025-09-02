// simbolosP.js

// Función para buscar símbolos
function buscarSimbolo() {
    console.log("Iniciando búsqueda de símbolo");
    var query = document.getElementById('busquedaSimbolo').value.toLowerCase();
    var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
    resultadosBusquedaDiv.innerHTML = '';

    if (query.trim() !== "") {
        var elementos = recopilarElementosBuscables();
        var resultados = elementos.filter(function(elemento) {
            return elemento.texto.toLowerCase().includes(query);
        });

        mostrarResultadosBusqueda(resultados);
    }
}

// Función para recopilar elementos buscables
function recopilarElementosBuscables() {
    var elementos = [];
    var links = document.querySelectorAll('#agregar-menu a');
    links.forEach(function(link) {
        var texto = link.textContent.trim();
        var sidc = link.dataset.sidc;
        var onclick = link.getAttribute('onclick');
        elementos.push({ texto: texto, sidc: sidc, onclick: onclick });
    });
    return elementos;
}

// Función para mostrar los resultados de la búsqueda
function mostrarResultadosBusqueda(resultados) {
    var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
    resultados.slice(0, 6).forEach(function(resultado) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = resultado.texto;

        if (resultado.sidc) {
            var symbol = new ms.Symbol(resultado.sidc, {size: 30});
            var img = document.createElement('img');
            img.src = symbol.toDataURL();
            img.alt = resultado.texto;
            img.style.marginRight = '10px';
            a.prepend(img);
            a.onclick = function() { agregarMarcador(resultado.sidc, resultado.texto); };
        } else if (resultado.onclick) {
            a.setAttribute('onclick', resultado.onclick);
        }

        li.appendChild(a);
        resultadosBusquedaDiv.appendChild(li);
    });
}

// Función para actualizar el SIDC (Symbol Identification Code)
function actualizarSidc(nuevoCaracter) {
    console.log("Actualizando SIDC con carácter: " + nuevoCaracter);
    var allElements = document.querySelectorAll('#agregar-menu .sidc-container a, #agregar-menu [data-sidc]');
    
    allElements.forEach(function(element) {
        var originalSidc = element.dataset.sidc;
        
        if (originalSidc && (originalSidc.length === 10 || originalSidc.length === 15)) {
            var newSidc;
            if (originalSidc.length === 10) {
                newSidc = originalSidc.substring(0, 1) + nuevoCaracter + originalSidc.substring(2);
            } else {
                newSidc = originalSidc.substring(0, 1) + nuevoCaracter + originalSidc.substring(2, 15);
            }
            
            element.dataset.sidc = newSidc;
            
            var span = element.querySelector('.mil-symbol');
            if (span) {
                // Verificar que milsymbol esté disponible
                if (typeof ms !== 'undefined' && ms.Symbol) {
                    var symbol = new ms.Symbol(newSidc, {size: 30});
                    span.innerHTML = symbol.asSVG();
                } else {
                    console.warn('⚠️ Milsymbol no está disponible, usando texto como fallback');
                    span.innerHTML = `<span style="font-size:12px;">${newSidc}</span>`;
                }
            }
            
            if (element.hasAttribute('onclick')) {
                var originalOnclick = element.getAttribute('onclick');
                var newOnclick = originalOnclick.replace(originalSidc, newSidc);
                element.setAttribute('onclick', newOnclick);
            }
        }
    });
}

// Función para inicializar los botones de amigo/enemigo
function inicializarBotonesAmigoEnemigo() {
    var amigoButton = document.querySelector('.botones-fuerza button:nth-child(1)');
    var enemigoButton = document.querySelector('.botones-fuerza button:nth-child(2)');
  
    if (amigoButton) {
        amigoButton.addEventListener('click', function() {
            this.classList.add('active-amigo');
            enemigoButton.classList.remove('active-enemigo');
            actualizarSidc('F');
        });
    } else {
        console.warn('Botón de fuerza amiga no encontrado');
    }
  
    if (enemigoButton) {
        enemigoButton.addEventListener('click', function() {
            this.classList.add('active-enemigo');
            amigoButton.classList.remove('active-amigo');
            actualizarSidc('J');
        });
    } else {
        console.warn('Botón de fuerza enemiga no encontrado');
    }
}

window.agregarMarcador = function(sidc, nombre) {
    // 1. Validación inicial modo y permisos
    const modoJuegoGuerra = window.gestorJuego?.gestorAcciones !== undefined;
    if (modoJuegoGuerra) {
        const fase = window.gestorJuego?.gestorFases?.fase;
        const subfase = window.gestorJuego?.gestorFases?.subfase;
        
        if (fase !== 'preparacion' || subfase !== 'despliegue') {
            window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                'Solo puedes agregar unidades en fase de despliegue', 
                'error'
            );
            return;
        }
        
        if (!window.gestorJuego.gestorAcciones.validarDespliegueUnidad()) {
            return;
        }
    }

    // 2. Handler para click en mapa
    window.mapa.once('click', function(event) {
        const latlng = event.latlng;

        // 3. Validación zona despliegue
        if (modoJuegoGuerra) {
            const zonaEquipo = window.gestorJuego?.gestorFases?.zonasDespliegue[window.equipoJugador];
            if (!zonaEquipo?.contains(latlng)) {
                window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                    'Solo puedes desplegar unidades en tu zona asignada',
                    'error'
                );
                return;
            }
        }

        // 4. Configuración SIDC y símbolo
        let sidcFormateado = sidc.padEnd(15, '-');
        if (modoJuegoGuerra) {
            const sidcArray = sidcFormateado.split('');
            sidcArray[1] = window.equipoJugador === 'azul' ? 'F' : 'H';
            sidcFormateado = sidcArray.join('');
        }

        // Verificar que milsymbol esté disponible
        if (typeof ms === 'undefined' || !ms.Symbol) {
            console.error('❌ Milsymbol no está disponible. Verificar carga de librería.');
            return null;
        }

        const sym = new ms.Symbol(sidcFormateado, { 
            size: 35,
        });

        // 5. Crear marcador con propiedades específicas según modo
        const marcador = L.marker(latlng, {
            icon: L.divIcon({
                className: modoJuegoGuerra ? 
                    `custom-div-icon equipo-${window.equipoJugador}` : 
                    'elemento-militar',
                html: sym.asSVG(),
                iconSize: [70, 50],
                iconAnchor: [35, 25]
            }),
            draggable: modoJuegoGuerra ? 
                window.gestorJuego?.gestorFases?.fase === 'preparacion' : 
                true,
            sidc: sidcFormateado,
            nombre: nombre || '',
            ...(modoJuegoGuerra && {
                jugador: window.gestorTurnos?.obtenerJugadorPropietario?.() || window.userId,
                equipo: window.equipoJugador,
                id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                designacion: '',
                dependencia: '',
                magnitud: sidcFormateado.charAt(11) || '-',
                estado: 'operativo'
            })
        });

        // 6. Configurar eventos según modo
        marcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionado = this;
            window.seleccionarElemento(this);
        });

        // ✅ AGREGAR EVENTO DE DOBLE CLICK PARA EDICIÓN EN GB
        if (!modoJuegoGuerra) {
            // En modo GB (gestión de batalla), doble click para editar
            marcador.on('dblclick', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                window.elementoSeleccionado = this;
                window.elementoSeleccionadoGB = this;
                console.log('🎯 Doble click en elemento para editar:', this);
                if (window.editarElementoSeleccionado) {
                    window.editarElementoSeleccionado();
                } else {
                    console.warn('Función editarElementoSeleccionado no disponible');
                }
            });
        }

        if (modoJuegoGuerra) {
            // Eventos específicos juego guerra
            marcador.on('dblclick', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                window.elementoSeleccionado = this;
                if (window.MiRadial) {
                    window.MiRadial.selectedUnit = this;
                    window.MiRadial.selectedHex = null;
                    const point = window.mapa.latLngToContainerPoint(e.latlng);
                    window.MiRadial.mostrarMenu(point.x, point.y, 'elemento');
                }
            });

            marcador.on('contextmenu', (e) => {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                return false;
            });

            marcador.on('dragstart', function() {
                if (window.gestorJuego?.gestorFases?.fase !== 'preparacion') {
                    return false;
                }
                this._origLatLng = this.getLatLng();
            });

            marcador.on('drag', function(e) {
                if (window.gestorJuego?.gestorFases?.fase !== 'preparacion') {
                    this.setLatLng(this._origLatLng);
                    return;
                }
                const nuevaPosicion = e.latlng;
                const zonaEquipo = window.gestorJuego?.gestorFases?.zonasDespliegue[window.equipoJugador];
                if (!zonaEquipo?.contains(nuevaPosicion)) {
                    this.setLatLng(this._origLatLng);
                    window.gestorJuego?.gestorInterfaz?.mostrarMensaje(
                        'No puedes mover unidades fuera de tu zona', 
                        'warning'
                    );
                }
            });
        } else {
            marcador.on('contextmenu', window.mostrarMenuContextual);
        }

        // 7. Agregar al mapa y notificar
        window.calcoActivo.addLayer(marcador);

        if (nombre === 'Punto Inicial' || nombre === 'PI') {
            agregarPuntoControl('PI');
            return;
        } else if (nombre === 'Punto Terminal' || nombre === 'PT') {
            agregarPuntoControl('PT');
            return;
        } else if (nombre === 'Punto de Desdoblamiento' || nombre === 'PD') {
            agregarPuntoControl('PD');
            return;
        } else if (nombre === 'Punto de Encolumnamiento' || nombre === 'PE') {
            agregarPuntoControl('PE');
            return;
        } else if (nombre === 'Punto de Pasaje' || nombre === 'PP') {
            agregarPuntoControl('PP');
            return;
        }
    });
};


window.agregarPuntoControl = function(tipo) {
    // Handler para click en mapa
    window.mapa.once('click', function(event) {
        const latlng = event.latlng;
        let pcNumero = '';
        let pcTipo = tipo || 'PC';
        let color = '#2196F3'; // Color predeterminado para PC (azul)
        
        // Determinar si es un punto de control simple o un punto militar especial
        const esPuntoMilitar = ['PI', 'PT', 'PD', 'PE', 'PP'].includes(pcTipo);
        
        // Asignar número según tipo y determinar SIDC para puntos militares
        if (pcTipo === 'PC') {
            // Contar PCs existentes para generar número automático
            const pcsExistentes = [];
            window.calcoActivo.eachLayer(function(layer) {
                if (layer.options && layer.options.tipo === 'PC') {
                    const numero = parseInt(layer.options.numero) || 0;
                    if (!isNaN(numero)) {
                        pcsExistentes.push(numero);
                    }
                }
            });
            
            // Encontrar el siguiente número disponible
            pcNumero = pcsExistentes.length > 0 ? Math.max(...pcsExistentes) + 1 : 1;
        }
        
        let pcIcon;
        
        // Crear ícono según el tipo de punto
        if (pcTipo === 'PC') {
            // Crear círculo para PC
            pcIcon = L.divIcon({
                className: `punto-control-icon pc`,
                html: `<div class="pc-marker-container">
                          <div class="pc-marker" style="background-color: ${color}; color: white;">
                              <div class="pc-text">${pcNumero}</div>
                          </div>
                       </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],  // Anclaje en la parte inferior del ícono
                popupAnchor: [0, -40]  // Posición del popup
            });
        } else {
            // Crear símbolo militar para PI, PT, PD, PE, PP
            let sidc = '';
            switch(pcTipo) {
                case 'PI':
                    sidc = 'GFGPGPP---'; // Usar símbolo de punto de pasaje
                    break;
                case 'PT':
                    sidc = 'GFGPGPP---'; // Usar símbolo de punto de pasaje
                    break;
                case 'PD':
                    sidc = 'GFGPGPP---'; // Punto de desdoblamiento
                    break;
                case 'PE':
                    sidc = 'GFGPGPP---'; // Punto de encolumnamiento
                    break;
                case 'PP':
                    sidc = 'GFGPGPP---'; // Punto de pasaje
                    break;
            }
            
            // Crear símbolo militar con milsymbol.js
            const symbol = new ms.Symbol(sidc, {
                size: 35,
                uniqueDesignation: pcTipo, // Poner el texto en el centro del símbolo
                infoFields: false, // Esto oculta los campos de información adicionales
                colorMode: "Light", // Para mejor contraste
                fill: true, // Asegurarse de que el símbolo esté relleno
                monoColor: "black" // Para mejor visibilidad
            });
            
            pcIcon = L.divIcon({
                className: `punto-control-icon ${pcTipo.toLowerCase()}`,
                html: symbol.asSVG(),
                iconSize: [35, 35],
                iconAnchor: [17.5, 70], // Anclaje en la parte inferior central
                popupAnchor: [0, 35]   // Popup encima del símbolo
            });
        }
        
        // Crear marcador
        const pcMarcador = L.marker(latlng, {
            icon: pcIcon,
            draggable: true,
            tipo: pcTipo,
            numero: pcNumero,
            color: color,
            id: `pc_${Date.now()}`
        });
        
        // Configurar popup con información del punto
        let popupContent = `
            <div class="pc-popup">
                <h4>${pcTipo}${pcTipo === 'PC' ? ' #' + pcNumero : ''}</h4>
                <p class="coord-info">(${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)})</p>`;
        
        // Campos específicos según el tipo
        if (pcTipo === 'PC') {
            popupContent += `
                <div>
                    <label>Número:</label>
                    <input type="number" class="pc-numero" value="${pcNumero}" min="1">
                </div>
                <div>
                    <label>Mostrar:</label>
                    <select class="pc-display-type">
                        <option value="numero-completo">PC ${pcNumero}</option>
                        <option value="solo-numero">${pcNumero}</option>
                    </select>
                </div>
                <div>
                    <label>Color:</label>
                    <input type="color" class="pc-color" value="${color}">
                </div>`;
        }
        
        popupContent += `
                <div class="popup-buttons">
                    <button class="pc-save">Guardar</button>
                    <button class="pc-delete">Eliminar</button>
                </div>
            </div>`;
        
        pcMarcador.bindPopup(popupContent);
        
        // Evento click en el marcador
        pcMarcador.on('click', function(e) {
            L.DomEvent.stopPropagation(e);
            window.elementoSeleccionado = this;
            
            // Abrir popup al hacer click
            if (!this.isPopupOpen()) {
                this.openPopup();
            }
            
            // Configurar eventos en el popup
            setTimeout(() => {
                const saveBtn = document.querySelector('.pc-save');
                if (saveBtn) {
                    saveBtn.addEventListener('click', function() {
                        // Actualizar si es PC
                        if (pcTipo === 'PC') {
                            const numInput = document.querySelector('.pc-numero');
                            const colorInput = document.querySelector('.pc-color');
                            const displayType = document.querySelector('.pc-display-type');
                            
                            if (numInput) {
                                const nuevoNumero = numInput.value;
                                pcMarcador.options.numero = nuevoNumero;
                            }
                            
                            if (colorInput) {
                                const nuevoColor = colorInput.value;
                                pcMarcador.options.color = nuevoColor;
                            }
                            
                            // Obtener texto a mostrar según selección
                            let textoMostrar = pcMarcador.options.numero;
                            if (displayType && displayType.value === 'numero-completo') {
                                textoMostrar = `PC ${pcMarcador.options.numero}`;
                            }
                            
                            // Recrear ícono con nuevos valores
                            const newIcon = L.divIcon({
                                className: `punto-control-icon pc`,
                                html: `<div class="pc-marker-container">
                                          <div class="pc-marker" style="background-color: ${pcMarcador.options.color}; color: white;">
                                              <div class="pc-text">${textoMostrar}</div>
                                          </div>
                                       </div>`,
                                iconSize: [35, 35],
                                iconAnchor: [20, 40],
                                popupAnchor: [0, -40]
                            });
                            
                            pcMarcador.setIcon(newIcon);
                        }
                        
                        pcMarcador.closePopup();
                    });
                }
                
                const deleteBtn = document.querySelector('.pc-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        window.calcoActivo.removeLayer(pcMarcador);
                        pcMarcador.closePopup();
                    });
                }
            }, 100);
        });
        
        // Actualizar coordenadas en el popup al mover
        pcMarcador.on('dragend', function(e) {
            const newLatLng = this.getLatLng();
            const popup = this.getPopup();
            if (popup) {
                const content = popup.getContent();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                const coordInfo = tempDiv.querySelector('.coord-info');
                if (coordInfo) {
                    coordInfo.textContent = `(${newLatLng.lat.toFixed(6)}, ${newLatLng.lng.toFixed(6)})`;
                    popup.setContent(tempDiv.innerHTML);
                }
            }
        });
        
        // Añadir al calco activo
        window.calcoActivo.addLayer(pcMarcador);
    });
};

// Agregar estilos CSS para PC
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Contenedor común para todos los puntos */
        .punto-control-icon {
            background: transparent;
        }
        
        .pc-marker-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        /* Estilo para PC (círculo) */
        .pc-marker {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            overflow: hidden;
            white-space: nowrap;
        }
        
        .pc-text {
            text-align: center;
            max-width: 28px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Estilos para el popup */
        .pc-popup {
            padding: 10px;
        }
        
        .pc-popup h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        
        .punto-control-icon text {
            transform: translateX(-75px); /* Mueve el texto a la izquierda */
            font-size: 35px;!important;
            font-weight: bold;
            fill: black !important;
        }

        .pc-popup .coord-info {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .pc-popup label {
            display: block;
            margin-top: 8px;
            font-size: 14px;
        }
        
        .pc-popup input, .pc-popup select {
            width: 100%;
            padding: 5px;
            margin: 5px 0;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        
        .popup-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        
        .popup-buttons button {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .pc-save {
            background: #4CAF50;
            color: white;
        }
        
        .pc-delete {
            background: #F44336;
            color: white;
        }
    `;
    document.head.appendChild(style);
})();

// Inicialización cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidades de símbolos");
    
    var busquedaSimboloInput = document.getElementById('busquedaSimbolo');
    var btnBuscarSimbolo = document.getElementById('btnBuscarSimbolo');
    
    if (busquedaSimboloInput) {
        busquedaSimboloInput.addEventListener('input', buscarSimbolo);
    } else {
        console.warn("Elemento 'busquedaSimbolo' no encontrado");
    }
    
    if (btnBuscarSimbolo) {
        btnBuscarSimbolo.addEventListener('click', buscarSimbolo);
    } else {
        console.warn("Elemento 'btnBuscarSimbolo' no encontrado");
    }

    inicializarBotonesAmigoEnemigo();
    // Agregar opciones de PC, PI y PT al menú MCC
    // Agregar opciones de puntos al menú MCC
setTimeout(function() {
    const menuMCC = document.querySelector('#mccGeneralesBtn .simbolo-grid');
    if (menuMCC) {
        // Definir los tipos de puntos
        const puntos = [
            { tipo: 'PC', nombre: 'Punto de Control' },
            { tipo: 'PI', nombre: 'Punto Inicial' },
            { tipo: 'PT', nombre: 'Punto Terminal' },
            { tipo: 'PD', nombre: 'Punto de Desdoblamiento'},
            { tipo: 'PE', nombre: 'Punto de Encolumnamiento' },
            { tipo: 'PP', nombre: 'Punto de Pasaje' }
        ];
        
        // Crear y añadir elementos para cada tipo de punto
        puntos.forEach(punto => {
            const opcion = document.createElement('a');
            opcion.href = '#';
            opcion.innerHTML = ` ${punto.nombre} (${punto.tipo})`;
            opcion.onclick = function() { 
                agregarPuntoControl(punto.tipo); 
                return false; 
            };
            
            menuMCC.appendChild(opcion);
        });
        
        console.log('Opciones de puntos añadidas al menú MCC');
    } else {
        console.warn('No se encontró el menú MCC para añadir opciones de puntos');
    }
}, 1000); // Esperar 1 segundo para asegurarse de que el menú MCC ya se cargó
});



// Exportación de funciones para uso en otros archivos
window.buscarSimbolo = buscarSimbolo;
window.actualizarSidc = actualizarSidc;
window.agregarMarcador = agregarMarcador;
window.agregarPuntoControl = agregarPuntoControl;


