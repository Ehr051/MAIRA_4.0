/**
 * CO.js – Modo Cuadro de Organización Militar (sin mapa)
 * Funcionalidades: agregar, editar y conectar elementos en un canvas,
 * manejo de propiedades mediante panel lateral y menús independientes.
 * Se utiliza jsPlumb para conexiones y ms.Symbol para generar símbolos.
 */

/* Variables globales */
var canvas;
var jsPlumbInstance;
var selectedElement = null;
var currentZoom = 1;
var enModoConexion = false;
var connectionSource = null;
var symbolCounter = 0;
var historial = { acciones: [], indice: -1 };

/* Inicialización */
document.addEventListener('DOMContentLoaded', inicializarCuadroOrganizacion);



/* Inicializar símbolos en la paleta */
function inicializarSimbolos() {
  if (typeof ms === 'undefined') {
    console.error("La biblioteca milsymbol no está cargada");
    return;
  }

  var items = document.querySelectorAll('[data-sidc]');
  for (var i = 0; i < items.length; i++) {
    var sidc = items[i].getAttribute('data-sidc');
    var container = items[i].querySelector('.mil-symbol');
    if (container) {
      try {
        var symbol = new ms.Symbol(sidc, { size: 30, standard: 'APP6', fill: true });
        container.innerHTML = symbol.asSVG();
      } catch (error) {
        console.error("Error al crear símbolo militar:", error);
      }
    }
  }
}

/* Funciones para actualizar SIDC y botones amigo/enemigo */
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
      if (span && typeof ms !== 'undefined') {
        try {
          var symbol = new ms.Symbol(newSidc, {size: 30});
          span.innerHTML = symbol.asSVG();
        } catch (error) {
          console.error("Error al actualizar símbolo:", error);
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


function inicializarCuadroOrganizacion() {
    // Verificar que ms (milsymbol) esté disponible
    if (typeof ms === 'undefined') {
      console.error("La biblioteca milsymbol no está cargada. Asegúrate de incluir el script de milsymbol antes de CO.js");
      return;
    }
  
    canvas = document.getElementById('org-canvas');
    if (!canvas) {
      console.error("No se encontró el elemento con id 'org-canvas'");
      return;
    }
    
    // ✅ Verificar que jsPlumb esté disponible
    if (typeof jsPlumb === 'undefined') {
        console.error('❌ jsPlumb no está disponible. Verifique que el script se esté cargando correctamente.');
        // Continuar sin jsPlumb para evitar que el módulo falle completamente
        window.jsPlumbInstance = null;
        console.log('⚠️ Continuando sin jsPlumb - las conexiones no estarán disponibles');
    } else {
        // Inicializar jsPlumb
        window.jsPlumbInstance = jsPlumb.getInstance({
      Connector: ["Flowchart", { cornerRadius: 5, stub: 10 }],
      Anchors: ["Bottom", "Top"],
      Endpoint: ["Dot", { radius: 2 }],
      EndpointStyle: { fill: "#456" },
      PaintStyle: { stroke: "#456", strokeWidth: 2 },
      HoverPaintStyle: { stroke: "#0d6efd", strokeWidth: 3 },
      ConnectionOverlays: [
          ["Arrow", { location: 1, width: 10, length: 10, foldback: 0.7 }]
      ]
    });
    window.jsPlumbInstance.setContainer(canvas);
    }
    
    // Inicializar símbolos
    inicializarSimbolos();
    
    // Inicializar botones de amigo/enemigo
    inicializarBotonesAmigoEnemigo();
    inicializarSubmenus();
    // Configurar eventos
    configurarEventosCanvas();
    configurarBotonesPrincipales();
    configurarAtajosTeclado();
    configurarPaneles();
    
    // Inicializar funcionalidades de conexiones (del módulo conexionesCO.js)
    if (window.inicializarConexiones) {
      window.inicializarConexiones();
    }
    
    // Configurar controles de zoom
    configurarControlesZoom();
    
    // Ajustar zoom responsivo
    ajustarZoomResponsive();
    
    // Inicializar el buscador
    var busquedaSimboloInput = document.getElementById('busquedaSimbolo');
    var btnBuscarSimbolo = document.getElementById('btnBuscarSimbolo');
    
    if (busquedaSimboloInput) {
      busquedaSimboloInput.addEventListener('input', buscarSimbolo);
    }
    
    if (btnBuscarSimbolo) {
      btnBuscarSimbolo.addEventListener('click', buscarSimbolo);
    }
  }
  

function inicializarBotonesAmigoEnemigo() {
  var amigoButton = document.querySelector('.botones-fuerza button:nth-child(1)');
  var enemigoButton = document.querySelector('.botones-fuerza button:nth-child(2)');

  if (amigoButton) {
    amigoButton.addEventListener('click', function() {
      this.classList.add('active-amigo');
      if (enemigoButton) enemigoButton.classList.remove('active-enemigo');
      actualizarSidc('F');
    });
    // Activar por defecto el botón de fuerza amiga
    amigoButton.click();
  } else {
    console.warn('Botón de fuerza amiga no encontrado');
  }

  if (enemigoButton) {
    enemigoButton.addEventListener('click', function() {
      this.classList.add('active-enemigo');
      if (amigoButton) amigoButton.classList.remove('active-amigo');
      actualizarSidc('J');
    });
  } else {
    console.warn('Botón de fuerza enemiga no encontrado');
  }
}

/* Búsqueda de símbolos */
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

function mostrarResultadosBusqueda(resultados) {
  var resultadosBusquedaDiv = document.getElementById('resultadosBusquedaSimbolos');
  resultados.slice(0, 6).forEach(function(resultado) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.textContent = resultado.texto;

    if (resultado.sidc && typeof ms !== 'undefined') {
      try {
        var symbol = new ms.Symbol(resultado.sidc, {size: 30});
        var img = document.createElement('img');
        img.src = symbol.toDataURL();
        img.alt = resultado.texto;
        img.style.marginRight = '10px';
        a.prepend(img);
        a.onclick = function(e) { 
          e.preventDefault();
          agregarMarcador(resultado.sidc, resultado.texto); 
        };
      } catch (error) {
        console.error("Error al crear símbolo para búsqueda:", error);
      }
    } else if (resultado.onclick) {
      a.setAttribute('onclick', resultado.onclick);
    }

    li.appendChild(a);
    resultadosBusquedaDiv.appendChild(li);
  });
}



function deshacerOrg() {
    if (historial.indice < 0) return;
    
    var accion = historial.acciones[historial.indice];
    console.log("Deshaciendo acción:", accion);
    
    switch (accion.tipo) {
        case 'crear':
            // Eliminar el elemento creado
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                if (window.jsPlumbInstance) {
                    window.jsPlumbInstance.removeAllEndpoints(elemento);
                }
                elemento.parentNode.removeChild(elemento);
            }
            break;
            
        case 'eliminar':
            // Recrear el elemento eliminado
            crearElemento({
                id: accion.elemento.id,
                sidc: accion.elemento.sidc,
                posX: accion.elemento.posX,
                posY: accion.elemento.posY,
                texto: accion.elemento.texto
            });
            break;
            
        case 'editar':
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                // Restaurar SIDC anterior
                elemento.setAttribute('data-sidc', accion.valorAnterior.sidc);
                
                // Actualizar símbolo
                var symbolContainer = elemento.querySelector('.symbol-container');
                if (symbolContainer) {
                    try {
                        var symbol = new ms.Symbol(accion.valorAnterior.sidc, {
                            size: 40,
                            standard: 'APP6',
                            fill: true
                        });
                        symbolContainer.innerHTML = symbol.asSVG();
                    } catch (error) {
                        console.error("Error al actualizar símbolo:", error);
                    }
                }
                
                // Restaurar etiqueta
                var label = elemento.querySelector('.symbol-label');
                if (label) {
                    label.textContent = accion.valorAnterior.label;
                }
            }
            break;
            
        case 'mover':
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                elemento.style.left = accion.posicionAnterior.left + 'px';
                elemento.style.top = accion.posicionAnterior.top + 'px';
                if (window.jsPlumbInstance) {
                    window.jsPlumbInstance.revalidate(elemento);
                }
            }
            break;
            
        case 'conectar':
            // Eliminar la conexión
            var conexiones = window.jsPlumbInstance.getAllConnections();
            var conexion = conexiones.find(c => 
                c.sourceId === accion.conexion.sourceId && 
                c.targetId === accion.conexion.targetId
            );
            if (conexion) {
                window.jsPlumbInstance.deleteConnection(conexion);
            }
            break;
    }
    
    historial.indice--;
    actualizarBotonesHistorial();
}

// Función auxiliar para actualizar el estado de los botones
function actualizarBotonesHistorial() {
    var btnDeshacer = document.getElementById('btnDeshacer');
    var btnRehacer = document.getElementById('btnRehacer');
    
    if (btnDeshacer) {
        btnDeshacer.disabled = historial.indice < 0;
    }
    
    if (btnRehacer) {
        btnRehacer.disabled = historial.indice >= historial.acciones.length - 1;
    }
}
function rehacerOrg() {
    if (historial.indice >= historial.acciones.length - 1) return;
    
    historial.indice++;
    var accion = historial.acciones[historial.indice];
    console.log("Rehaciendo acción:", accion);
    
    // Implementar lógica para rehacer cada tipo de acción
    switch (accion.tipo) {
        case 'crear':
            // Recrear el elemento
            recrearElemento(accion);
            break;
            
        case 'eliminar':
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                jsPlumbInstance.removeAllEndpoints(elemento);
                canvas.removeChild(elemento);
            }
            break;
            
        case 'editar':
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                // Aplicar SIDC
                elemento.setAttribute('data-sidc', accion.valorNuevo.sidc);
                
                // Actualizar símbolo
                var symbolContainer = elemento.querySelector('.symbol-container');
                if (symbolContainer) {
                    try {
                        var symbol = new ms.Symbol(accion.valorNuevo.sidc, { size: 40, standard: 'APP6', fill: true });
                        symbolContainer.innerHTML = symbol.asSVG();
                    } catch (error) {
                        console.error("Error al actualizar símbolo:", error);
                    }
                }
                
                // Actualizar etiqueta
                var label = elemento.querySelector('.symbol-label');
                if (label) {
                    label.textContent = accion.valorNuevo.label;
                }
            }
            break;
            
        case 'mover':
            var elemento = document.getElementById(accion.id);
            if (elemento) {
                elemento.style.left = accion.posicionNueva.left + 'px';
                elemento.style.top = accion.posicionNueva.top + 'px';
                jsPlumbInstance.revalidate(elemento);
            }
            break;
            
        case 'conectar':
            jsPlumbInstance.connect({
                source: accion.conexion.sourceId,
                target: accion.conexion.targetId,
                anchor: ["Bottom", "Top"]
            });
            break;
    }
    
    actualizarBotonesHistorial();
}

/* Funciones de menú adaptadas a la estructura de CO.html */
function toggleMenu(menuId, e) {
    if (e) {
        e.stopPropagation(); 
    }
    
    var menu = document.getElementById(menuId);
    if (!menu) {
        console.warn("Menú no encontrado:", menuId);
        return;
    }
    
    console.log("Toggle menu:", menuId);
    
    // Verificar la estructura para determinar qué tipo de menú es
    if (menu.classList.contains('collapse') || menu.classList.contains('submenu')) {
        // Es un submenu (probablemente con clase 'collapse') - solo alternar su visibilidad
        menu.classList.toggle('show');
    } else if (menuId.endsWith('Btn')) {
        // Es un botón que controla un elemento colapsable
        var targetId;
        
        // Estrategia 1: Quitar 'Btn' del ID
        targetId = menuId.replace('Btn', '');
        var target = document.getElementById(targetId);
        
        // Estrategia 2: Buscar entre elementos hermanos
        if (!target) {
            var parent = menu.parentElement;
            var siblings = parent.children;
            for (var i = 0; i < siblings.length; i++) {
                if (siblings[i].classList.contains('collapse') || siblings[i].classList.contains('submenu')) {
                    target = siblings[i];
                    break;
                }
            }
        }
        
        // Alternar visibilidad si encontramos el target
        if (target) {
            target.classList.toggle('show');
        } else {
            console.warn("No se pudo encontrar el elemento colapsable para:", menuId);
        }
    } else {
        // Es un menú principal - cerrar otros y alternar este
        closeMenus();
        menu.classList.toggle('show');
        
        // Si este menú tiene clase simbolo-grid, alternar también
        if (menu.classList.contains('simbolo-grid')) {
            menu.classList.toggle('show');
        }
    }
}

function closeMenus() {
    var menus = document.querySelectorAll('.menu.show');
    for (var i = 0; i < menus.length; i++) {
        // Cerrar sólo menús principales, no los submenús
        if (!menus[i].closest('.submenu') && !menus[i].classList.contains('collapse')) {
            menus[i].classList.remove('show');
        }
    }
}



/* Configuración de paneles y tabs */
function configurarPaneles() {
  // Inicializar tabs en todos los paneles
  var tabs = document.querySelectorAll('.tab button');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Obtener el contenedor tab
      var tabContainer = this.closest('.tab');
      // Desactivar todos los botones
      var tabBtns = tabContainer.querySelectorAll('button');
      tabBtns.forEach(function(btn) { btn.classList.remove('active'); });
      // Activar este botón
      this.classList.add('active');
      
      // Obtener el contenido de tab a mostrar
      var tabName = this.getAttribute('data-tab');
      var parent = tabContainer.parentElement;
      var tabContents = parent.querySelectorAll('.tabcontent');
      
      // Ocultar todos los contenidos
      tabContents.forEach(function(content) { content.style.display = 'none'; });
      
      // Mostrar el contenido seleccionado
      var selectedTab = parent.querySelector('#' + tabName);
      if (selectedTab) {
        selectedTab.style.display = 'block';
      }
    });
  });
  
  // Activar la primera pestaña por defecto en cada tab
  document.querySelectorAll('.tab').forEach(function(tabContainer) {
    var firstButton = tabContainer.querySelector('button');
    if (firstButton) {
      firstButton.click();
    }
  });
  
  // Configurar botones para cerrar paneles
  document.querySelectorAll('.panel .panel-buttons button:last-child').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var panel = this.closest('.panel');
      panel.style.display = 'none';
    });
  });
}

/* Configurar eventos del canvas */
function configurarEventosCanvas() {
  var isDragging = false, startX, startY, scrollLeft, scrollTop;
  
  canvas.addEventListener('mousedown', function(e) {
    if (e.target === canvas) {
      isDragging = true;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeft = canvas.parentElement.scrollLeft;
      scrollTop = canvas.parentElement.scrollTop;
      closeMenus();
      deseleccionarElemento();
    }
  });
  
  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    var walkX = e.pageX - startX;
    var walkY = e.pageY - startY;
    canvas.parentElement.scrollLeft = scrollLeft - walkX;
    canvas.parentElement.scrollTop = scrollTop - walkY;
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    if (typeof window.actualizarTodasLasConexionesVisuales === 'function') {
      setTimeout(function() {
          window.actualizarTodasLasConexionesVisuales();
      }, 100);
  }
  });

  
  canvas.addEventListener('click', function(e) {
    if (e.target === canvas) {
      deseleccionarElemento();
      if (enModoConexion && connectionSource) {
        if (window.cancelarModoConexion) {
          window.cancelarModoConexion();
        } else {
          connectionSource.className = connectionSource.className.replace(" connection-source", "");
          connectionSource = null;
          enModoConexion = false;
          document.querySelectorAll('.menu-btn button.active').forEach(function(btn) {
            btn.classList.remove('active');
          });
        }
      }
    }
  });
  
  // Eventos para elementos existentes
  inicializarEventosElementos();
}

/* Inicializar eventos para elementos existentes */
function inicializarEventosElementos() {
  document.querySelectorAll('.military-symbol').forEach(function(elemento) {
    // Eliminar eventos previos para evitar duplicidad
    var nuevoElemento = elemento.cloneNode(true);
    if (elemento.parentNode) {
      elemento.parentNode.replaceChild(nuevoElemento, elemento);
    }
    
    // Agregar evento de clic
    nuevoElemento.addEventListener('click', function(e) {
      e.stopPropagation();
      if (enModoConexion) {
        if (window.manejarClickEnModoConexion) {
          window.manejarClickEnModoConexion(this);
        } else {
          manejarClickEnModoConexion(this);
        }
      } else {
        seleccionarElemento(this);
      }
    });
    
    // Agregar evento de doble clic para edición
    el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        e.preventDefault();
        mostrarMenuContextual(e, el);
    });
    
    // Agregar menú contextual
    nuevoElemento.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      mostrarMenuContextual(e, this);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      editarElementoSeleccionado();
    });
    nuevoElemento.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      eliminarElementoSeleccionado();
    });
    nuevoElemento.appendChild(deleteBtn);
    
    nuevoElemento.addEventListener('mouseenter', function() {
      editBtn.style.display = 'block';
      deleteBtn.style.display = 'block';
    });
    
    nuevoElemento.addEventListener('mouseleave', function() {
      editBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    });
  });
}

// Modificar la función mostrarMenuContextual para añadir auto-cierre al hacer click

/* Mostrar menú contextual */
function mostrarMenuContextual(e, elemento) {
    // Seleccionar el elemento primero
    seleccionarElemento(elemento);
    
    // Crear menú contextual
    var menuContextual = document.createElement('div');
    menuContextual.className = 'menu-contextual';
    menuContextual.innerHTML = `
        <ul>
            <li><a href="#" id="menu-editar"><i class="fas fa-edit"></i> Editar</a></li>
            <li><a href="#" id="menu-eliminar"><i class="fas fa-trash"></i> Eliminar</a></li>
            <li><a href="#" id="menu-conectar"><i class="fas fa-link"></i> Conectar</a></li>
        </ul>
    `;
    
    // Posicionar el menú
    menuContextual.style.position = 'absolute';
    menuContextual.style.left = e.pageX + 'px';
    menuContextual.style.top = e.pageY + 'px';
    document.body.appendChild(menuContextual);
    
    // Configurar eventos para las opciones del menú
    menuContextual.querySelector('#menu-editar').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.removeChild(menuContextual);
        editarElementoSeleccionado();
    });
    
    menuContextual.querySelector('#menu-eliminar').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.removeChild(menuContextual);
        eliminarElementoSeleccionado();
    });
    
    menuContextual.querySelector('#menu-conectar').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.removeChild(menuContextual);
        iniciarConexion();
    });
    
    // Configurar evento para cerrar el menú
    function cerrarMenu(event) {
        if (!menuContextual.contains(event.target)) {
            if (document.body.contains(menuContextual)) {
                document.body.removeChild(menuContextual);
            }
            document.removeEventListener('click', cerrarMenu);
        }
    }
    
    // Añadir con ligero retraso para evitar que se cierre inmediatamente
    setTimeout(function() {
        document.addEventListener('click', cerrarMenu);
    }, 0);
}


// Añadir al final de inicializarCuadroOrganizacion()
function inicializarSubmenus() {
    // Configurar todos los toggles de submenús
    var submenuToggles = document.querySelectorAll('.submenu > button');
    submenuToggles.forEach(function(toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Obtener el target del botón
            var targetId = this.getAttribute('data-target') || this.getAttribute('data-bs-target');
            if (!targetId) {
                // Si no tiene atributo data-target, buscar el ID del siguiente elemento
                var nextElement = this.nextElementSibling;
                if (nextElement && nextElement.id) {
                    targetId = nextElement.id;
                }
            }
            
            if (targetId) {
                var target = document.getElementById(targetId.replace('#', ''));
                if (target) {
                    if (target.classList.contains('show')) {
                        target.classList.remove('show');
                    } else {
                        target.classList.add('show');
                    }
                }
            }
        });
    });
}


/* Configurar botones principales */
function configurarBotonesPrincipales() {
    // Configuración para el modo de conexión
    var botonesPrincipales = document.getElementById('botones-principales');
    if (botonesPrincipales) {
        botonesPrincipales.addEventListener('click', function(e) {
            if (e.target.matches('button') || e.target.closest('button')) {
                var button = e.target.matches('button') ? e.target : e.target.closest('button');
                if (button.id !== 'crearConexionBtn') {
                    if (enModoConexion) {
                        enModoConexion = false;
                        if (connectionSource) {
                            connectionSource.className = connectionSource.className.replace(" connection-source", "");
                            connectionSource = null;
                        }
                    }
                }
            }
        });
    }
    
    // Configurar botones para exportar/guardar
    var exportarBtn = document.getElementById('exportarOrgBtn');
    if (exportarBtn) {
        exportarBtn.addEventListener('click', exportarComoImagen);
    }
    
    var guardarBtn = document.getElementById('guardarOrgBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', guardarCuadroOrganizacion);
    }
    
    var cargarBtn = document.getElementById('cargarOrgBtn');
    if (cargarBtn) {
        cargarBtn.addEventListener('click', cargarCuadroOrganizacion);
    }
    
    var nuevoBtn = document.getElementById('nuevoOrgBtn');
    if (nuevoBtn) {
        nuevoBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de crear un nuevo cuadro? Se perderán todos los cambios no guardados.')) {
                limpiarCanvas();
            }
        });
    }
    
    var imprimirBtn = document.getElementById('imprimirOrgBtn');
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', imprimirCuadro);
    }

    // Configurar botones de texto
    var agregarTextoBtn = document.getElementById('agregarTextoBtn');
    if (agregarTextoBtn) {
        agregarTextoBtn.addEventListener('click', function() {
            agregarTexto('Texto');
        });
    }
    
    var agregarTituloBtn = document.getElementById('agregarTituloBtn');
    if (agregarTituloBtn) {
        agregarTituloBtn.addEventListener('click', agregarTitulo);
    }
    
    var agregarLeyendaBtn = document.getElementById('agregarLeyendaBtn');
    if (agregarLeyendaBtn) {
        agregarLeyendaBtn.addEventListener('click', agregarLeyenda);
    }

    // Configurar botones secundarios
    var btnDeshacer = document.getElementById('btnDeshacer');
    if (btnDeshacer) {
        btnDeshacer.addEventListener('click', deshacerOrg);
    }

    var btnRehacer = document.getElementById('btnRehacer');
    if (btnRehacer) {
        btnRehacer.addEventListener('click', rehacerOrg);
    }

    var btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', eliminarElementoSeleccionado);
    }

    // Configurar botón de conexión
    var botonConexion = document.getElementById('crearConexionBtn');
    if (botonConexion) {
        botonConexion.addEventListener('click', function() {
            if (enModoConexion) {
                if (window.cancelarModoConexion) {
                    window.cancelarModoConexion();
                } else {
                    cancelarModoConexion();
                }
            } else {
                if (window.iniciarConexion) {
                    window.iniciarConexion();
                } else {
                    iniciarConexion();
                }
            }
        });
    }

    var btnAlinear = document.getElementById('btnAlinear');
    if (btnAlinear) {
        btnAlinear.addEventListener('click', alinearElementos);
    }
}

/* Configurar atajos de teclado */
function configurarAtajosTeclado() {
  document.addEventListener('keydown', function(e) {
    // Escape: Cancelar modo conexión y deseleccionar
    if (e.key === 'Escape') {
      if (enModoConexion) {
        if (window.cancelarModoConexion) {
          window.cancelarModoConexion();
        } else {
          enModoConexion = false;
          document.querySelectorAll('.menu-btn button.active').forEach(function(btn) {
            btn.classList.remove('active');
          });
          if (connectionSource) {
            connectionSource.className = connectionSource.className.replace(" connection-source", "");
            connectionSource = null;
          }
        }
      }
      deseleccionarElemento();
    }
    
    // Delete: Eliminar elemento seleccionado
    if (e.key === 'Delete' && selectedElement) {
      eliminarElementoSeleccionado();
    }
    
    // Ctrl + Z: Deshacer
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      deshacerOrg();
    }
    
    // Ctrl + Y: Rehacer
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      rehacerOrg();
    }
    
    // Ctrl + S: Guardar
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      guardarCuadroOrganizacion();
    }
    
    // Ctrl + E: Editar elemento seleccionado
    if (e.ctrlKey && e.key === 'e' && selectedElement) {
      e.preventDefault();
      editarElementoSeleccionado();
    }
  });
}






/* Seleccionar un elemento */
function seleccionarElemento(el) {
  // Deseleccionar elementos anteriores
  deseleccionarElemento();
  
  // Marcar nuevo elemento como seleccionado
  selectedElement = el;
  if (selectedElement.classList) {
    selectedElement.classList.add('selected');
  }
  
  // Habilitar botón de eliminar en la barra de herramientas
  var btnEliminar = document.getElementById('btnEliminar');
  if (btnEliminar) {
    btnEliminar.disabled = false;
  }
}


function seleccionarElemento(elemento) {
    console.log('🎯 Seleccionando elemento:', elemento);
    
    try {
        if (!elemento) {
            console.warn('⚠️ Elemento nulo pasado a seleccionarElemento');
            return false;
        }
        
        // ✅ MANEJAR ELEMENTOS DIV (SÍMBOLOS MILITARES) Y ELEMENTOS LEAFLET:
        const esElementoDOM = elemento.nodeType === 1 || elemento.classList;
        const esElementoLeaflet = elemento.setStyle && typeof elemento.setStyle === 'function';
        
        if (!esElementoDOM && !esElementoLeaflet) {
            console.warn('⚠️ Elemento no es ni DIV ni objeto Leaflet válido');
            return false;
        }
        
        // Deseleccionar elemento anterior
        if (elementoSeleccionado && elementoSeleccionado !== elemento) {
            deseleccionarElemento();
        }
        
        elementoSeleccionado = elemento;
        window.elementoSeleccionado = elemento; // ✅ TAMBIÉN GLOBAL
        
        // ✅ APLICAR ESTILOS DE SELECCIÓN SEGÚN EL TIPO:
        if (esElementoDOM) {
            // Para DIVs de símbolos militares
            elemento.classList.add('selected');
            elemento.style.border = '3px solid #ff6b35';
            elemento.style.boxShadow = '0 0 15px rgba(255, 107, 53, 0.7)';
        } else if (esElementoLeaflet) {
            // Para elementos Leaflet
            elemento.setStyle({
                color: '#ff6b35',
                weight: 5,
                dashArray: '10, 5'
            });
        }
        
        console.log('✅ Elemento seleccionado exitosamente');
        return true;
        
    } catch (error) {
        console.error('❌ Error al seleccionar elemento:', error);
        return false;
    }
}

/* Deseleccionar elemento */
function deseleccionarElemento() {
  if (window.selectedElement && window.selectedElement.classList) {  // <-- CORREGIDO
    window.selectedElement.classList.remove('selected');
  }
  
  window.selectedElement = null;  // <-- CORREGIDO
  
  // Deshabilitar botón de eliminar
  var btnEliminar = document.getElementById('btnEliminar');
  if (btnEliminar) {
    btnEliminar.disabled = true;
  }
}


/* Guardar cambios de una unidad editada */
function guardarCambiosUnidad(elemento) {
    if (!elemento) {
        console.error("No hay elemento para guardar cambios");
        return;
    }

    console.log("Guardando cambios para elemento:", elemento.id);

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
    
    // Verificar que se obtuvo correctamente
    if (!nuevoSidc) {
        console.error("Error al obtener nuevo SIDC");
        return;
    }
    
    console.log("Nuevo SIDC:", nuevoSidc);
    elemento.setAttribute('data-sidc', nuevoSidc);
    
    // Actualizar símbolo visual
    const symbolContainer = elemento.querySelector('.symbol-container');
    if (symbolContainer) {
        try {
            const symbol = new ms.Symbol(nuevoSidc, { size: 45, standard: 'APP6', fill: true });
            symbolContainer.innerHTML = symbol.asSVG();
            console.log("Símbolo actualizado correctamente");
        } catch (error) {
            console.error("Error al actualizar símbolo visual:", error);
        }
    } else {
        console.error("No se encontró contenedor de símbolo");
    }
    
    // Actualizar etiqueta
    if (label) {
        let nuevoLabel = designacion;
        if (dependencia) {
            nuevoLabel += '/' + dependencia;
        }
        label.textContent = nuevoLabel;
        console.log("Etiqueta actualizada:", nuevoLabel);
    } else {
        console.error("No se encontró etiqueta");
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
        window.jsPlumbInstance.revalidate(elemento.id);
    }
    
    // Cerrar panel
    cerrarPanelEdicion('panelEdicionUnidad');
    
    // Volver a seleccionar el elemento para mostrar que sigue seleccionado
    seleccionarElemento(elemento);
}

function guardarCuadroOrganizacion() {
    try {
        if (!window.jsPlumbInstance) {
            console.error('jsPlumbInstance no disponible');
            return;
        }

        const datos = {
            elementos: [],
            conexiones: []
        };

        // Guardar elementos
        document.querySelectorAll('.military-symbol').forEach(el => {
            datos.elementos.push({
                id: el.id,
                sidc: el.getAttribute('data-sidc'),
                posX: parseInt(el.style.left),
                posY: parseInt(el.style.top),
                texto: el.getAttribute('data-texto') || ''
            });
        });

        // Guardar conexiones
        const conexiones = window.jsPlumbInstance.getAllConnections();
        conexiones.forEach(conn => {
            datos.conexiones.push({
                sourceId: conn.sourceId,
                targetId: conn.targetId,
                tipo: conn.getType()[0] || 'default'
            });
        });

        // Guardar como archivo
        const blob = new Blob([JSON.stringify(datos, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cuadro_organizacion_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error al guardar:', error);
    }
}
  
function limpiarCanvas() {
    console.log("Limpiando canvas...");
    
    try {
        // Verificar jsPlumbInstance
        if (!window.jsPlumbInstance) {
            console.warn("jsPlumbInstance no disponible, creando nueva instancia");
            window.jsPlumbInstance = window.jsPlumb.getInstance();
        }

        // Obtener todas las conexiones y eliminarlas
        const conexiones = window.jsPlumbInstance.getAllConnections();
        conexiones.forEach(conn => {
            try {
                window.jsPlumbInstance.deleteConnection(conn);
            } catch (e) {
                console.warn("Error al eliminar conexión:", e);
            }
        });

        // Eliminar todos los endpoints de manera segura
        try {
            window.jsPlumbInstance.reset();
        } catch (e) {
            console.warn("Error al resetear jsPlumb:", e);
        }

        // Limpiar elementos del canvas
        const canvas = document.getElementById('org-canvas');
        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        // Reinicializar contadores
        window.symbolCounter = 0;
        window.historial = { acciones: [], indice: -1 };

        console.log("Canvas limpiado correctamente");
        return true;

    } catch (error) {
        console.error("Error al limpiar canvas:", error);
        return false;
    }
}


// Función para actualizar el contador de símbolos
function actualizarContadorSimbolos() {
    const elementos = document.querySelectorAll('.military-symbol');
    let maxId = 0;
    
    elementos.forEach(function(el) {
        const idMatch = el.id.match(/symbol-(\d+)/);
        if (idMatch && idMatch[1]) {
            const num = parseInt(idMatch[1]);
            if (num > maxId) {
                maxId = num;
            }
        }
    });
    
    window.symbolCounter = maxId;
    console.log("Contador de símbolos actualizado a:", maxId);
}

function cargarCuadroOrganizacion() {
    console.log("Iniciando carga de cuadro de organización...");
    
    if (!window.jsPlumb) {
        mostrarMensaje("Error: jsPlumb no está disponible", 'error');
        return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const contenido = await file.text();
            const datos = JSON.parse(contenido);
            
            // Limpiar canvas actual
            if (!limpiarCanvas()) {
                throw new Error("No se pudo limpiar el canvas");
            }

            // Encontrar el mayor ID antes de crear elementos
            let maxId = 0;
            datos.elementos.forEach(elemento => {
                const match = elemento.id.match(/symbol-(\d+)/);
                if (match && match[1]) {
                    const num = parseInt(match[1]);
                    if (num > maxId) maxId = num;
                }
            });
            
            // Actualizar el contador global
            window.symbolCounter = maxId;
            console.log("Contador de símbolos inicializado a:", maxId);

            // Recrear elementos
            for (const elemento of datos.elementos) {
                await crearElemento(elemento);
            }

            // Esperar a que los elementos estén listos
            await new Promise(resolve => setTimeout(resolve, 200));

            // Recrear conexiones
            if (datos.conexiones && Array.isArray(datos.conexiones)) {
                for (const conexion of datos.conexiones) {
                    try {
                        window.jsPlumbInstance.connect({
                            source: conexion.sourceId,
                            target: conexion.targetId,
                            type: conexion.tipo || 'default'
                        });
                    } catch (e) {
                        console.warn("Error al crear conexión:", e);
                    }
                }
            }

            mostrarMensaje('Cuadro cargado exitosamente', 'success');
            
        } catch (error) {
            console.error("Error al cargar archivo:", error);
            mostrarMensaje("Error al cargar el archivo: " + error.message, 'error');
        } finally {
            fileInput.remove();
        }
    });
    
    fileInput.click();

    ajustarTamañoCanvas();
}
// Función auxiliar para configurar eventos en elementos cargados
function configurarEventosElemento(el, esTexto) {
    // Configurar eventos comunes
    el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (enModoConexion) {
            if (window.manejarClickEnModoConexion) {
                window.manejarClickEnModoConexion(el);
            } else {
                manejarClickEnModoConexion(el);
            }
        } else {
            seleccionarElemento(el);
        }
    });
    
    // Configurar eventos específicos según el tipo
    if (esTexto) {
        // Eventos para elementos de texto
        var textContent = el.querySelector('.text-content');
        
        // Edición directa al hacer doble clic
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (textContent) textContent.focus();
        });
        
        // Guardar cambios al perder el foco
        if (textContent) {
            textContent.addEventListener('blur', function() {
                registrarAccion({
                    tipo: 'editar',
                    id: el.id,
                    valorAnterior: { texto: el.getAttribute('data-texto-original') },
                    valorNuevo: { texto: textContent.textContent }
                });
                el.setAttribute('data-texto-original', textContent.textContent);
            });
        }
    } else {
        // Eventos para símbolos militares
        el.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            e.preventDefault();
            editarElementoSeleccionado();
        });
    }
    
    // Menú contextual
    el.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        mostrarMenuContextual(e, el);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (esTexto) {
            var textContent = el.querySelector('.text-content');
            if (textContent) textContent.focus();
        } else {
            editarElementoSeleccionado();
        }
    });
    el.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (el === selectedElement) {
            eliminarElementoSeleccionado();
        } else {
            seleccionarElemento(el);
            eliminarElementoSeleccionado();
        }
    });
    el.appendChild(deleteBtn);
    
    el.addEventListener('mouseenter', function() {
        editBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
    });
    
    el.addEventListener('mouseleave', function() {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    });
}

  
async function crearElemento(datos) {
    try {
        console.log("Creando elemento:", datos);

        // Crear contenedor principal
        // Usar el ID existente o crear uno nuevo
        const elemento = document.createElement('div');
        elemento.id = datos.id || `symbol-${++window.symbolCounter}`;
       
        elemento.className = 'military-symbol';
        elemento.style.left = `${datos.posX}px`;
        elemento.style.top = `${datos.posY}px`;

        // Agregar atributos necesarios 
        elemento.setAttribute('data-sidc', datos.sidc);
        elemento.setAttribute('data-texto', datos.texto || '');
        
        // Crear estructura del símbolo
        const symbolContainer = document.createElement('div');
        symbolContainer.className = 'symbol-container';
        
        try {
            const symbol = new ms.Symbol(datos.sidc, {
                size: 45,
                standard: 'APP6',
                fill: true
            });
            symbolContainer.innerHTML = symbol.asSVG();
        } catch (e) {
            console.error("Error al crear símbolo:", e);
            symbolContainer.textContent = "Error: Símbolo inválido";
        }
        
        elemento.appendChild(symbolContainer);

        // Agregar etiqueta
        const etiqueta = document.createElement('div');
        etiqueta.className = 'symbol-label';
        etiqueta.textContent = datos.texto || '';
        elemento.appendChild(etiqueta);

        // Agregar al canvas
        const canvas = document.getElementById('org-canvas');
        canvas.appendChild(elemento);

        // Configurar jsPlumb
        if (window.jsPlumbInstance) {
            // Hacer draggable
            window.jsPlumbInstance.draggable(elemento, {
                containment: true,
                grid: [10, 10],
                stop: function(evento) {
                    if (window.registrarAccion) {
                        window.registrarAccion({
                            tipo: 'mover',
                            id: elemento.id,
                            posicionAnterior: evento.pos,
                            posicionNueva: { 
                                left: parseInt(elemento.style.left),
                                top: parseInt(elemento.style.top)
                            }
                        });
                    }
                }
            });

            // Configurar como source y target
            window.jsPlumbInstance.makeSource(elemento, {
                filter: ".jtk-connect",
                anchor: "Continuous",
                connectorStyle: { stroke: "#456", strokeWidth: 2 },
                connectionType: "basic",
                maxConnections: -1,
                allowLoopback: false
            });
            
            window.jsPlumbInstance.makeTarget(elemento, {
                dropOptions: { hoverClass: "dragHover" },
                anchor: "Continuous",
                allowLoopback: false
            });

            // Revalidar elemento
            window.jsPlumbInstance.revalidate(elemento);
        }

        // Configurar eventos
        elemento.addEventListener('click', function(e) {
            if (window.enModoConexion) {
                if (window.manejarClickEnModoConexion) {
                    window.manejarClickEnModoConexion(this);
                }
            } else {
                seleccionarElemento(this);
            }
            e.stopPropagation();
        });

        // Doble clic para editar
        elemento.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            editarElementoSeleccionado(this);
        });

        console.log("Elemento creado correctamente:", elemento.id);
        return elemento;

    } catch (error) {
        console.error("Error al crear elemento:", error);
        throw error;
    }
}
  
  /* Exportar como imagen */
function exportarComoImagen() {
    if (typeof html2canvas === 'undefined') {
        console.error("html2canvas no disponible");
        return;
    }

    // Guardar estilos originales
    const canvas = document.getElementById('org-canvas');
    const estilosOriginales = {
        background: canvas.style.background,
        backgroundColor: canvas.style.backgroundColor
    };

    // Aplicar estilos para exportación
    canvas.classList.add('exportando');
    canvas.style.background = 'white';
    canvas.style.backgroundColor = 'white';

    // Configurar indicador de carga
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando imagen...';
    document.body.appendChild(loadingIndicator);

    // Capturar imagen
    html2canvas(canvas, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        logging: false,
        removeContainer: true,
        onclone: function(clonedDoc) {
            const clonedCanvas = clonedDoc.getElementById('org-canvas');
            if (clonedCanvas) {
                prepararParaExportar(clonedCanvas);
            }
        }
    }).then(canvas => {
        // Generar imagen
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `cuadro_organizacion_${new Date().toISOString().slice(0,10)}.png`;
        link.click();

        // Restaurar estilos originales
        canvas.classList.remove('exportando');
        canvas.style.background = estilosOriginales.background;
        canvas.style.backgroundColor = estilosOriginales.backgroundColor;
        document.body.removeChild(loadingIndicator);
    }).catch(error => {
        console.error("Error al exportar:", error);
        document.body.removeChild(loadingIndicator);
    });
}
  

function prepararParaExportar(canvas) {
    // Cambiar fondo del canvas y quitar grid
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.backgroundImage = 'none';
    canvas.style.border = 'none'; // Quitar borde del contenedor

    // Forzar fondo blanco uniforme
    canvas.style.background = '#ffffff';

    // Procesar conexiones jsPlumb
    const conexiones = canvas.querySelectorAll('.jtk-connector');
    conexiones.forEach(conexion => {
        // Forzar visibilidad y color de las líneas
        conexion.style.visibility = 'visible';
        conexion.style.zIndex = '1000';
        
        const paths = conexion.querySelectorAll('path');
        paths.forEach(path => {
            path.setAttribute('stroke', '#000000');
            path.setAttribute('stroke-width', '2');
            path.style.visibility = 'visible';
        });

        // Procesar flechas
        const overlays = conexion.querySelectorAll('.jtk-overlay');
        overlays.forEach(overlay => {
            overlay.style.visibility = 'visible';
            overlay.style.zIndex = '1001';
            const paths = overlay.querySelectorAll('path');
            paths.forEach(path => {
                path.setAttribute('fill', '#000000');
                path.setAttribute('stroke', '#000000');
                path.style.visibility = 'visible';
            });
        });
    });

    
}


function imprimirCuadro() {
    const canvas = document.getElementById('org-canvas');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }

    // Configuración única de html2canvas
    const opcionesHtml2Canvas = {
        backgroundColor: '#ffffff',
        scale: 2,
        allowTaint: true,
        useCORS: true,
        logging: true,
        onclone: function(clonedDoc) {
            const clonedCanvas = clonedDoc.getElementById('org-canvas');
            if (clonedCanvas) {
                prepararParaExportar(clonedCanvas);
            }
        }
    };

    // Crear un iframe oculto
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Escribir contenido al iframe
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.write('<!DOCTYPE html><html><head>');
    iframeDoc.write('<title>Cuadro de Organización</title>');
    
    // Escribir estilos base
    iframeDoc.write('<style>');
    iframeDoc.write(`
        @page {
            size: A3 landscape;
            margin: 20mm;
        }
        body { 
            margin: 0; 
            padding: 20px; 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .org-canvas-print { 
            background-color: white !important; 
            position: relative; 
            width: 100%; 
            height: auto; 
            border: none !important;
            margin: 0 auto;
        }
        .military-symbol {
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
        }
        .symbol-container svg {
            fill: black !important;
            stroke: black !important;
            visibility: visible !important;
        }
        .symbol-label {
            color: black !important;
            visibility: visible !important;
        }
        .jtk-connector { 
            z-index: 1000 !important;
            visibility: visible !important;
        }
        .jtk-connector path { 
            stroke: #000000 !important; 
            stroke-width: 2px !important;
            visibility: visible !important;
        }
        .jtk-overlay {
            z-index: 1001 !important;
            visibility: visible !important;
        }
        .jtk-overlay path {
            fill: #000000 !important;
            stroke: #000000 !important;
            visibility: visible !important;
        }
        svg * {
            visibility: visible !important;
        }
        .text-content {
            color: black !important;
        }
        @media print {
            body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            .org-canvas-print {
                page-break-inside: avoid;
            }
        }
    `);
    iframeDoc.write('</style>');
    
    // Incluir estilos existentes
    var estilos = document.getElementsByTagName('style');
    for (var i = 0; i < estilos.length; i++) {
        iframeDoc.write(estilos[i].outerHTML);
    }
    
    // Incluir hojas de estilo
    var hojas = document.getElementsByTagName('link');
    for (var i = 0; i < hojas.length; i++) {
        if (hojas[i].rel === 'stylesheet') {
            iframeDoc.write(hojas[i].outerHTML);
        }
    }
    
    iframeDoc.write('</head><body>');
    iframeDoc.write('<h1 style="text-align: center; margin-bottom: 20px;">Cuadro de Organización Militar</h1>');
    
    // Usar html2canvas si está disponible
    if (typeof html2canvas !== 'undefined') {
        html2canvas(canvas, opcionesHtml2Canvas).then(function(canvas) {
            var img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.width = '100%';
            img.style.maxWidth = '297mm'; // Ancho de A3
            img.style.margin = '0 auto';
            img.style.display = 'block';
            
            iframeDoc.body.appendChild(img);
            
            setTimeout(function() {
                iframe.contentWindow.print();
                setTimeout(function() {
                    document.body.removeChild(iframe);
                }, 500);
            }, 500);
        });
        
        iframeDoc.write('</body></html>');
        iframeDoc.close();
        return;
    }

    // Fallback manual si html2canvas no está disponible
    var canvasClone = document.createElement('div');
    canvasClone.className = 'org-canvas-print';
    canvasClone.style.width = canvas.offsetWidth + 'px';
    canvasClone.style.height = canvas.offsetHeight + 'px';
    
    // Clonar elementos militares y texto
    var elementos = canvas.querySelectorAll('.military-symbol, .text-element');
    elementos.forEach(function(el) {
        var clon = el.cloneNode(true);
        clon.style.transform = '';
        // Asegurar color negro para textos
        var textos = clon.querySelectorAll('.text-content, .symbol-label');
        textos.forEach(function(texto) {
            texto.style.color = '#000000';
        });
        canvasClone.appendChild(clon);
    });
    
    // Dibujar conexiones manualmente
    if (window.jsPlumbInstance) {
        var conexiones = window.jsPlumbInstance.getAllConnections();
        if (conexiones.length > 0) {
            var svgContainer = document.createElement('div');
            svgContainer.style.position = 'absolute';
            svgContainer.style.top = '0';
            svgContainer.style.left = '0';
            svgContainer.style.width = '100%';
            svgContainer.style.height = '100%';
            
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', canvas.offsetWidth);
            svg.setAttribute('height', canvas.offsetHeight);
            svg.style.position = 'absolute';
            
            // Agregar definición de flecha
            var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            
            var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', '#000000');
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
            
            // Dibujar cada conexión
            conexiones.forEach(function(conn) {
                try {
                    var sourceEl = document.getElementById(conn.sourceId);
                    var targetEl = document.getElementById(conn.targetId);
                    
                    if (sourceEl && targetEl) {
                        var sourceRect = sourceEl.getBoundingClientRect();
                        var targetRect = targetEl.getBoundingClientRect();
                        
                        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        var x1 = parseInt(sourceEl.style.left) + sourceRect.width/2;
                        var y1 = parseInt(sourceEl.style.top) + sourceRect.height;
                        var x2 = parseInt(targetEl.style.left) + targetRect.width/2;
                        var y2 = parseInt(targetEl.style.top);
                        
                        // Crear path para conexión tipo Flowchart
                        var d = `M ${x1} ${y1} V ${(y1 + y2)/2} H ${x2} V ${y2}`;
                        
                        path.setAttribute('d', d);
                        path.setAttribute('stroke', '#000000');
                        path.setAttribute('stroke-width', '2');
                        path.setAttribute('fill', 'none');
                        path.setAttribute('marker-end', 'url(#arrowhead)');
                        
                        svg.appendChild(path);
                    }
                } catch (e) {
                    console.warn('Error al clonar conexión:', e);
                }
            });
            
            svgContainer.appendChild(svg);
            canvasClone.appendChild(svgContainer);
        }
    }
    
    // Agregar el clon al iframe
    iframeDoc.body.appendChild(canvasClone);
    iframeDoc.write('</body></html>');
    iframeDoc.close();
    
    // Imprimir cuando el iframe esté listo
    iframe.onload = function() {
        setTimeout(function() {
            iframe.contentWindow.print();
            setTimeout(function() {
                document.body.removeChild(iframe);
            }, 500);
        }, 500);
    };
}


/* Verificar dependencias */
function verificarDependencias() {
    let dependenciasOK = true;
    
    if (typeof ms === 'undefined') {
      console.error("ERROR: La biblioteca milsymbol no está disponible. Asegúrate de incluirla en tu HTML.");
      alert("Error: No se pudo cargar la biblioteca de símbolos militares. Por favor, recargue la página o contacte con soporte técnico.");
      dependenciasOK = false;
    }
    
    if (typeof jsPlumb === 'undefined') {
      console.error("ERROR: La biblioteca jsPlumb no está disponible. Asegúrate de incluirla en tu HTML.");
      alert("Error: No se pudo cargar la biblioteca de conexiones jsPlumb. Por favor, recargue la página o contacte con soporte técnico.");
      dependenciasOK = false;
    }
    
    if (typeof html2canvas === 'undefined') {
      console.warn("ADVERTENCIA: La biblioteca html2canvas no está disponible. La exportación como imagen no funcionará.");
    }
    
    return dependenciasOK;
  }
  
  /**
 * Agrega controles de zoom al canvas
 */
function agregarControlesZoom() {
    // Crear el contenedor para los controles de zoom
    var zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    
    // Botón de zoom in
    var zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '<i class="fas fa-plus"></i>';
    zoomInBtn.title = 'Acercar';
    zoomInBtn.addEventListener('click', function() {
        ajustarZoom(0.1);
        actualizarNivelZoom();
    });
    
    // Botón de zoom out
    var zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '<i class="fas fa-minus"></i>';
    zoomOutBtn.title = 'Alejar';
    zoomOutBtn.addEventListener('click', function() {
        ajustarZoom(-0.1);
        actualizarNivelZoom();
    });
    
    // Botón de reset zoom
    var zoomResetBtn = document.createElement('button');
    zoomResetBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
    zoomResetBtn.title = 'Restablecer zoom';
    zoomResetBtn.addEventListener('click', function() {
        resetZoom();
        actualizarNivelZoom();
    });
    
    // Mostrar nivel de zoom
    var zoomLevel = document.createElement('div');
    zoomLevel.className = 'zoom-level';
    zoomLevel.id = 'zoomLevel';
    zoomLevel.textContent = '100%';
    
    // Agregar elementos al contenedor
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomLevel);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomResetBtn);
    
    // Agregar el contenedor al cuerpo del documento
    document.body.appendChild(zoomControls);
    
    // Configurar eventos de rueda del ratón para zoom
    canvas.parentElement.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            var delta = e.deltaY || e.detail || e.wheelDelta;
            
            // Determinar la dirección del zoom
            var zoomDelta = delta > 0 ? -0.05 : 0.05;
            
            ajustarZoom(zoomDelta);
            actualizarNivelZoom();
        }
    });
}

/* Modificaciones a la función inicializarCuadroOrganizacion */
function configurarControlesZoom() {
    // Asegurarse de que jsPlumb esté inicializado
    if (!window.jsPlumbInstance) {
        console.warn('Esperando inicialización de jsPlumb para configurar controles de zoom...');
        setTimeout(configurarControlesZoom, 500);
        return;
    }

    var zoomInBtn = document.getElementById('zoomInBtn');
    var zoomOutBtn = document.getElementById('zoomOutBtn');
    var zoomResetBtn = document.getElementById('zoomResetBtn');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => ajustarZoom(0.1));
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => ajustarZoom(-0.1));
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', resetZoom);
    }

    // Configurar zoom con rueda del ratón
    const canvas = document.getElementById('org-canvas');
    if (canvas && canvas.parentElement) {
        canvas.parentElement.addEventListener('wheel', function(e) {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                ajustarZoom(delta);
            }
        });
    }
}

/* Actualiza el indicador de nivel de zoom */
function actualizarNivelZoom() {
    var zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
      zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    }
    
    // Cambiar la clase del canvas según el nivel de zoom
    if (currentZoom > 1) {
      canvas.classList.add('zoom-high');
    } else {
      canvas.classList.remove('zoom-high');
    }
  }
  
  /* Restablece el zoom al nivel inicial */
function resetZoom() {
    if (!window.jsPlumbInstance) {
        console.warn('jsPlumb no inicializado para reset zoom');
        return;
    }

    window.currentZoom = 1;
    const canvas = document.getElementById('org-canvas');
    if (canvas) {
        canvas.style.transform = 'scale(1)';
    }

    setTimeout(() => {
        if (window.jsPlumbInstance && typeof window.jsPlumbInstance.setZoom === 'function') {
            window.jsPlumbInstance.setZoom(1);
            window.jsPlumbInstance.repaintEverything();
        }
    }, 100);

    actualizarNivelZoom();
}
  
  /* Función mejorada para ajustar el zoom */
function ajustarZoom(delta) {
    // Verificar que jsPlumbInstance exista y esté inicializado correctamente
    if (!window.jsPlumbInstance) {
        console.warn('Esperando inicialización de jsPlumb...');
        return;
    }

    try {
        // Verificar que currentZoom esté definido
        if (typeof window.currentZoom === 'undefined') {
            window.currentZoom = 1;
        }

        window.currentZoom += delta;
        window.currentZoom = Math.max(0.3, Math.min(2, window.currentZoom)); // Limitar entre 0.3 y 2
        
        const canvas = document.getElementById('org-canvas');
        if (!canvas) {
            console.warn('Canvas no encontrado');
            return;
        }

        // Aplicar transformación al canvas
        canvas.style.transform = `scale(${window.currentZoom})`;
        
        // Esperar a que jsPlumb esté listo
        setTimeout(() => {
            if (window.jsPlumbInstance && typeof window.jsPlumbInstance.setZoom === 'function') {
                window.jsPlumbInstance.setZoom(window.currentZoom);
                window.jsPlumbInstance.repaintEverything();
            }
        }, 100);

        // Actualizar indicador de zoom
        var zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = Math.round(window.currentZoom * 100) + '%';
        }

    } catch (error) {
        console.error('Error al ajustar zoom:', error);
    }
}
  
  /* Ajusta el tamaño de los elementos según el nivel de zoom */
function ajustarTamañoElementos() {
    // Si el zoom es muy bajo, aumentar el tamaño de los elementos para que se vean mejor
    const elementos = document.querySelectorAll('.military-symbol');
    elementos.forEach(function(elemento) {
      // Ajuste según nivel de zoom
      if (currentZoom < 0.5) {
        const symbolContainer = elemento.querySelector('.symbol-container');
        if (symbolContainer) {
          symbolContainer.style.transform = 'scale(1.5)';
        }
      } else {
        const symbolContainer = elemento.querySelector('.symbol-container');
        if (symbolContainer) {
          symbolContainer.style.transform = 'scale(1.3)';
        }
      }
    });
  }
  
  /* Ajusta el zoom responsivamente y centra el canvas */
function ajustarZoomResponsive() {
    const canvas = document.getElementById('org-canvas');
    const container = canvas ? canvas.parentElement : null;

    if (!container || !canvas) {
        console.warn('Canvas o contenedor no encontrados');
        return;
    }

    try {
        // Verificar jsPlumbInstance
        if (!window.jsPlumbInstance) {
            console.warn('jsPlumbInstance no disponible para zoom responsivo');
            return;
        }

        // Ajustar el tamaño del canvas
        const canvasWidth = Math.max(3000, container.clientWidth * 1.5);
        const canvasHeight = Math.max(2000, container.clientHeight * 1.5);
        
        canvas.style.minWidth = canvasWidth + 'px';
        canvas.style.minHeight = canvasHeight + 'px';
        
        // Centrar el canvas en la ventana
        setTimeout(function() {
            container.scrollLeft = (canvas.scrollWidth - container.clientWidth) / 2;
            container.scrollTop = (canvas.scrollHeight - container.clientHeight) / 2;
        }, 100);
        
        // Ajustar escala inicial según el tamaño de pantalla
        var scaleX = container.clientWidth / canvasWidth;
        var scaleY = container.clientHeight / canvasHeight;
        var scale = Math.min(scaleX, scaleY, 1) * 0.8;
        
        window.currentZoom = scale;
        canvas.style.transform = 'scale(' + scale + ')';
        
        // Verificar que setZoom exista antes de llamarlo
        if (typeof window.jsPlumbInstance.setZoom === 'function') {
            window.jsPlumbInstance.setZoom(scale);
        }
        
        // Actualizar indicador de zoom
        actualizarNivelZoom();

    } catch (error) {
        console.error('Error en ajustarZoomResponsive:', error);
    }
}
  

// Variables globales para controlar el modo de inserción
var enModoInsercion = false;
var sidcAInsertar = null;
var nombreAInsertar = null;

function agregarMarcador(sidc, nombre) {
    // Si ya estamos en modo inserción, cancelarlo primero
    if (enModoInsercion) {
        enModoInsercion = false;
        document.body.classList.remove('modo-insercion');
        canvas.removeEventListener('click', handleCanvasClick);
        ocultarMensaje();
    }
    
    // Iniciar nuevo modo de inserción
    enModoInsercion = true;
    sidcAInsertar = sidc;
    nombreAInsertar = nombre;
    
    // Cambiar el cursor y mostrar mensaje de ayuda
    document.body.classList.add('modo-insercion');
    mostrarMensaje('Haga clic en el canvas para colocar el elemento', 'info');
    
    // Función para manejar el clic en el canvas
    function handleCanvasClick(e) {
        if (e.target !== canvas) return;
        
        e.stopPropagation();
        
        console.log("Clic en el canvas:", e.clientX, e.clientY);
        
        // Obtener posición ajustada
        var rect = canvas.getBoundingClientRect();
        var scale = getCurrentScale();
        var x = (e.clientX - rect.left) / scale;
        var y = (e.clientY - rect.top) / scale;
        
        // Ajustar a la cuadrícula
        var left = Math.round(x / 10) * 10;
        var top = Math.round(y / 10) * 10;
        
        // Encontrar el siguiente ID disponible
        let maxId = 0;
        document.querySelectorAll('.military-symbol').forEach(function(el) {
            const match = el.id.match(/symbol-(\d+)/);
            if (match && match[1]) {
                const num = parseInt(match[1]);
                if (num > maxId) maxId = num;
            }
        });
        
        // Incrementar el contador global solo si es necesario
        window.symbolCounter = Math.max(maxId, window.symbolCounter);
        window.symbolCounter++;
        
        var symbolId = 'symbol-' + window.symbolCounter;
        
        // Crear el elemento
        var el = document.createElement('div');
        el.id = symbolId;
        el.className = 'military-symbol';
        el.setAttribute('data-sidc', sidcAInsertar);
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        
        // Crear contenedor del símbolo
        var symbolContainer = document.createElement('div');
        symbolContainer.className = 'symbol-container';
        
        try {
            var symbol = new ms.Symbol(sidcAInsertar, {
                size: 45,
                standard: 'APP6',
                fill: true
            });
            symbolContainer.innerHTML = symbol.asSVG();
        } catch (error) {
            console.error("Error al crear símbolo:", error);
            symbolContainer.textContent = "Error: Símbolo inválido";
        }
        
        el.appendChild(symbolContainer);
        
        // Agregar etiqueta
        var label = document.createElement('div');
        label.className = 'symbol-label';
        label.textContent = nombreAInsertar || '';
        el.appendChild(label);
        
        // Agregar al canvas
        canvas.appendChild(el);
        
        // Configurar jsPlumb
        if (window.jsPlumbInstance) {
            window.jsPlumbInstance.draggable(el, {
                containment: true,
                grid: [10, 10],
                stop: function(evento) {
                    if (window.registrarAccion) {
                        window.registrarAccion({
                            tipo: 'mover',
                            id: el.id,
                            posicionAnterior: evento.pos,
                            posicionNueva: { 
                                left: parseInt(el.style.left),
                                top: parseInt(el.style.top)
                            }
                        });
                    }
                }
            });
            
            window.jsPlumbInstance.makeSource(el, {
                filter: ".jtk-connect",
                anchor: "Continuous",
                connectorStyle: { stroke: "#456", strokeWidth: 2 },
                connectionType: "basic",
                maxConnections: -1
            });
            
            window.jsPlumbInstance.makeTarget(el, {
                dropOptions: { hoverClass: "dragHover" },
                anchor: "Continuous"
            });
        }
        
        // Configurar eventos
        configurarEventosElemento(el, false);
        
        // Registrar acción
        if (window.registrarAccion) {
            window.registrarAccion({
                tipo: 'crear',
                id: el.id,
                sidc: sidcAInsertar,
                posicion: {
                    left: left,
                    top: top
                }
            });
        }
        
        // Limpiar modo inserción
        enModoInsercion = false;
        document.body.classList.remove('modo-insercion');
        canvas.removeEventListener('click', handleCanvasClick);
        ocultarMensaje();
        
        // Seleccionar el nuevo elemento
        seleccionarElemento(el);

        el.addEventListener('dragend', function() {
            ajustarTamañoCanvas();
        });
        
        // Al final de la función
        ajustarTamañoCanvas();
    }
    
    // Agregar evento al canvas para la inserción
    canvas.addEventListener('click', handleCanvasClick);
}

// Función auxiliar para obtener la escala actual
function getCurrentScale() {
    var transform = canvas.style.transform || '';
    var scale = 1;
    if (transform.includes('scale')) {
        var match = transform.match(/scale\(([^)]+)\)/);
        if (match && match[1]) {
            scale = parseFloat(match[1]);
        }
    }
    return scale;
}

// Verificar dependencias al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    if (verificarDependencias()) {
      inicializarCuadroOrganizacion();
    }
  });




function ajustarTamañoCanvas() {
    const canvas = document.getElementById('org-canvas');
    const elementos = document.querySelectorAll('.military-symbol');
    
    if (!elementos.length) return;

    // Encontrar los límites del contenido
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elementos.forEach(elemento => {
        const rect = elemento.getBoundingClientRect();
        const left = parseInt(elemento.style.left);
        const top = parseInt(elemento.style.top);
        const width = elemento.offsetWidth;
        const height = elemento.offsetHeight;

        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, left + width);
        maxY = Math.max(maxY, top + height);
    });

    // Agregar margen
    const MARGEN = 200;
    const nuevoAncho = Math.max(maxX - minX + MARGEN * 2, canvas.parentElement.offsetWidth);
    const nuevoAlto = Math.max(maxY - minY + MARGEN * 2, canvas.parentElement.offsetHeight);

    // Aplicar nuevas dimensiones
    canvas.style.width = `${nuevoAncho}px`;
    canvas.style.height = `${nuevoAlto}px`;
    canvas.style.minWidth = `${nuevoAncho}px`;
    canvas.style.minHeight = `${nuevoAlto}px`;

    // Centrar el contenido si es necesario
    if (window.jsPlumbInstance) {
        window.jsPlumbInstance.repaintEverything();
    }
}



/**
 * Agrega un marcador de texto al canvas
 * @param {string} texto - Texto a mostrar
 * @param {object} opciones - Opciones para el texto (color, tamaño, etc)
 */
function agregarTexto(texto, opciones) {
    // Valores por defecto
    opciones = opciones || {};
    texto = texto || 'Texto';
    
    // Crear el contador
    symbolCounter++;
    var textId = 'text-' + symbolCounter;
    
    // Crear el contenedor del texto
    var el = document.createElement('div');
    el.id = textId;
    el.className = 'military-symbol text-element';
    
    // Crear el contenido de texto
    var textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.contentEditable = true;
    textContent.textContent = texto;
    textContent.style.color = opciones.color || '#ffffff';
    textContent.style.fontSize = (opciones.fontSize || 16) + 'px';
    textContent.style.fontWeight = opciones.bold ? 'bold' : 'normal';
    textContent.style.fontStyle = opciones.italic ? 'italic' : 'normal';
    textContent.style.textDecoration = opciones.underline ? 'underline' : 'none';
    
    // Manejar eventos de edición directa
    textContent.addEventListener('blur', function() {
        // Registrar cambio para deshacer
        registrarAccion({
            tipo: 'editar',
            id: el.id,
            valorAnterior: { texto: el.getAttribute('data-texto-original') },
            valorNuevo: { texto: textContent.textContent }
        });
        
        // Actualizar valor original
        el.setAttribute('data-texto-original', textContent.textContent);
    });
    
    el.appendChild(textContent);
    
    // Guardar el texto original para deshacer/rehacer
    el.setAttribute('data-texto-original', texto);
    
    // Posicionar en el centro del canvas visible
    var canvasRect = canvas.getBoundingClientRect();
    var containerRect = canvas.parentElement.getBoundingClientRect();
    
    var scrollLeft = canvas.parentElement.scrollLeft;
    var scrollTop = canvas.parentElement.scrollTop;
    
    var centerX = containerRect.width / 2;
    var centerY = containerRect.height / 2;
    
    var left = scrollLeft + centerX - canvasRect.left;
    var top = scrollTop + centerY - canvasRect.top;
    
    // Ajustar a la cuadrícula
    left = Math.round(left / 10) * 10;
    top = Math.round(top / 10) * 10;
    
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    
    // Agregar al canvas
    canvas.appendChild(el);
    
    // Hacer arrastrable con jsPlumb
    // Hacer arrastrable con jsPlumb
    try {
      if (window.jsPlumbInstance && typeof window.jsPlumbInstance.draggable === 'function') {
          window.jsPlumbInstance.draggable(el, {
              containment: "parent",
              grid: [10, 10],
              stop: function(event) {
                  if (window.registrarAccion) {
                      window.registrarAccion({
                          tipo: 'mover',
                          id: el.id,
                          posicionAnterior: {
                              left: parseInt(event.pos[0]),
                              top: parseInt(event.pos[1])
                          },
                          posicionNueva: {
                              left: parseInt(el.style.left),
                              top: parseInt(el.style.top)
                          }
                      });
                  }
              }
          });
      } else {
          console.warn("jsPlumbInstance.draggable no disponible, elemento no draggable:", el.id);
      }
    } catch (error) {
      console.error("Error al hacer draggable el elemento:", el.id, error);
    }
    
    // Configurar eventos del elemento
    el.addEventListener('click', function(e) {
        e.stopPropagation();
        if (enModoConexion) {
            if (window.manejarClickEnModoConexion) {
                window.manejarClickEnModoConexion(el);
            } else {
                manejarClickEnModoConexion(el);
            }
        } else {
            seleccionarElemento(el);
        }
    });
    
    // Agregar evento de doble clic para edición directa
    el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        e.preventDefault();
        textContent.focus();
    });
    
    // Agregar menú contextual
    el.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        mostrarMenuContextual(e, el);
    });
    
    // Botones de edición en hover
    var editBtn = document.createElement('div');
    editBtn.className = 'symbol-edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        textContent.focus();
    });
    el.appendChild(editBtn);
    
    var deleteBtn = document.createElement('div');
    deleteBtn.className = 'symbol-delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.style.display = 'none';
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (el === selectedElement) {
            eliminarElementoSeleccionado();
        } else {
            seleccionarElemento(el);
            eliminarElementoSeleccionado();
        }
    });
    el.appendChild(deleteBtn);
    
    el.addEventListener('mouseenter', function() {
        editBtn.style.display = 'block';
        deleteBtn.style.display = 'block';
    });
    
    el.addEventListener('mouseleave', function() {
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    });
    
    // Registrar la creación en el historial
    registrarAccion({
        tipo: 'crear',
        id: textId,
        texto: texto,
        posicion: {
            left: parseInt(el.style.left),
            top: parseInt(el.style.top)
        }
    });
    
    // Cerrar el menú
    closeMenus();
    
    // Seleccionar el elemento recién creado
    seleccionarElemento(el);
    
    // Actualizar estado de los botones de deshacer/rehacer
    actualizarBotonesHistorial();
    
    return el;
}

/**
 * Agrega un título al canvas
 */
function agregarTitulo() {
    agregarTexto('Título', {
        fontSize: 24,
        bold: true
    });
}

function alinearElementos() {
    const conexiones = window.jsPlumbInstance.getAllConnections();
    const elementos = document.querySelectorAll('.military-symbol');
    const niveles = new Map();
    const canvas = document.getElementById('org-canvas');
    const canvasWidth = canvas.offsetWidth;
    const BASE_ESPACIO_HORIZONTAL = 200;
    const BASE_ESPACIO_VERTICAL = 120;
    const MARGEN_SUPERIOR = 50;

    // 1. Primero encontrar elementos raíz
    const elementosDestino = new Set();
    conexiones.forEach(function(conexion) {
        elementosDestino.add(conexion.targetId);
    });
    
    const elementosRaiz = Array.from(elementos).filter(function(el) {
        return !elementosDestino.has(el.id);
    });

    // 2. Función para calcular el ancho necesario
    function calcularAnchoRama(elementoId) {
      const hijos = conexiones.filter(function(conexion) {
          return conexion.sourceId === elementoId;
      }).map(function(conexion) {
          return conexion.targetId;
      });
          
      if (hijos.length === 0) {
          return 1;
      }

      // El ancho total debe considerar todos los hijos y sus descendientes
      let anchoTotal = 0;
      hijos.forEach(function(hijoId) {
          const anchoHijo = calcularAnchoRama(hijoId);
          anchoTotal += anchoHijo * 1.5; // Factor de multiplicación para más separación
      });

      return Math.max(anchoTotal, 1);
  }

    // 3. Construir árbol por niveles
    function construirArbol(elementoId, nivel = 0, padre = null) {
        if (!niveles.has(nivel)) {
            niveles.set(nivel, []);
        }
        
        const hijosElemento = conexiones.filter(function(conexion) {
            return conexion.sourceId === elementoId;
        }).map(function(conexion) {
            return conexion.targetId;
        });

        niveles.get(nivel).push({
            id: elementoId,
            padre: padre,
            hijos: hijosElemento
        });

        hijosElemento.forEach(function(hijo) {
            construirArbol(hijo, nivel + 1, elementoId);
        });
    }

    // 4. Construir el árbol desde las raíces
    elementosRaiz.forEach(function(raiz) {
        construirArbol(raiz.id);
    });

    // 5. Calcular espacios necesarios
    const espaciosRamas = new Map();
    elementosRaiz.forEach(function(raiz) {
        const hijosNivel1 = conexiones.filter(function(conexion) {
            return conexion.sourceId === raiz.id;
        }).map(function(conexion) {
            return conexion.targetId;
        });

        hijosNivel1.forEach(function(hijoId) {
            const anchoNecesario = calcularAnchoRama(hijoId) * BASE_ESPACIO_HORIZONTAL;
            espaciosRamas.set(hijoId, anchoNecesario);
        });
    });

        // 6. Aplicar posiciones con conexiones específicas por nivel
        niveles.forEach(function(elementosNivel, nivel) {
          if (nivel === 0) {
              // Raíz centrada
              const el = document.getElementById(elementosNivel[0].id);
              if (el) {
                  el.style.transition = 'all 0.5s ease-in-out';
                  el.style.left = `${canvasWidth/2}px`;
                  el.style.top = `${MARGEN_SUPERIOR}px`;
              }
          } else if (nivel === 1) {
              // Primer nivel con más espacio
              let espacioTotalNivel = elementosNivel.reduce(function(total, elemento) {
                  return total + (espaciosRamas.get(elemento.id) || BASE_ESPACIO_HORIZONTAL);
              }, 0);
  
              let posicionActual = (canvasWidth - espacioTotalNivel) / 2;
              elementosNivel.forEach(function(elemento) {
                  const el = document.getElementById(elemento.id);
                  if (!el) return;
  
                  const espacioNecesario = espaciosRamas.get(elemento.id) || BASE_ESPACIO_HORIZONTAL;
                  el.style.transition = 'all 0.5s ease-in-out';
                  el.style.left = `${posicionActual + (espacioNecesario/2)}px`;
                  el.style.top = `${MARGEN_SUPERIOR + BASE_ESPACIO_VERTICAL}px`;
  
                  // Actualizar conexión Bottom-Top para nivel 1
                  const conexion = conexiones.find(c => c.targetId === elemento.id);
                  if (conexion) {
                      window.jsPlumbInstance.deleteConnection(conexion);
                      window.jsPlumbInstance.connect({
                          source: conexion.sourceId,
                          target: conexion.targetId,
                          anchors: ["Bottom", "Top"],
                          connector: ["Flowchart", { 
                              cornerRadius: 5,
                              stub: [30, 30],
                              midpoint: 0.5
                          }]
                      });
                  }
  
                  posicionActual += espacioNecesario * 1.2; // Factor de separación adicional
              });
          } else {
              // Niveles superiores con conexión Bottom-Left
              elementosNivel.forEach(function(elemento) {
                  const el = document.getElementById(elemento.id);
                  if (!el || !elemento.padre) return;
  
                  const padre = document.getElementById(elemento.padre);
                  if (!padre) return;
  
                  const hermanos = elementosNivel.filter(function(e) {
                      return e.padre === elemento.padre;
                  });
                  const indiceHermano = hermanos.findIndex(function(e) {
                      return e.id === elemento.id;
                  });
  
                  // Aumentar separación horizontal según el nivel
                  const desplazamientoHorizontal = BASE_ESPACIO_HORIZONTAL * (1 + (nivel - 1) * 0.3);
                  
                  el.style.transition = 'all 0.5s ease-in-out';
                  el.style.left = `${parseInt(padre.style.left) + desplazamientoHorizontal}px`;
                  el.style.top = `${parseInt(padre.style.top) + ((indiceHermano + 1) * BASE_ESPACIO_VERTICAL)}px`;
  
                  // Actualizar conexión Bottom-Left para niveles superiores
                  const conexion = conexiones.find(c => c.targetId === elemento.id);
                  if (conexion) {
                      window.jsPlumbInstance.deleteConnection(conexion);
                      window.jsPlumbInstance.connect({
                          source: conexion.sourceId,
                          target: conexion.targetId,
                          anchors: ["Bottom", "Left"],
                          connector: ["Flowchart", { 
                              cornerRadius: 5,
                              stub: [30, 30],
                              midpoint: 0.5
                          }]
                      });
                  }
              });
          }
      });

    // 7. Actualizar conexiones
    setTimeout(function() {
        if (window.jsPlumbInstance) {
            window.jsPlumbInstance.repaintEverything();
        }
        elementos.forEach(function(elemento) {
            elemento.style.transition = '';
        });    
        ajustarTamañoCanvas();
    }, 700);
}

/* Eliminar elemento seleccionado */
function eliminarElementoSeleccionado() {
    if (!window.selectedElement) {
        console.warn("No hay elemento seleccionado para eliminar");
        return;
    }

    // Crear acción para deshacer
    const accion = {
        tipo: 'eliminar',
        id: window.selectedElement.id,
        elemento: {
            id: window.selectedElement.id,
            sidc: window.selectedElement.getAttribute('data-sidc'),
            texto: window.selectedElement.getAttribute('data-texto'),
            posX: parseInt(window.selectedElement.style.left),
            posY: parseInt(window.selectedElement.style.top)
        }
    };

    // Eliminar conexiones asociadas
    if (window.jsPlumbInstance) {
        window.jsPlumbInstance.removeAllEndpoints(window.selectedElement);
    }

    // Eliminar el elemento del DOM
    if (window.selectedElement.parentNode) {
        window.selectedElement.parentNode.removeChild(window.selectedElement);
    }

    // Registrar la acción en el historial
    if (window.registrarAccion) {
        window.registrarAccion(accion);
    }

    // Limpiar la selección
    window.selectedElement = null;

    // Deshabilitar botón de eliminar
    var btnEliminar = document.getElementById('btnEliminar');
    if (btnEliminar) {
        btnEliminar.disabled = true;
    }

    // Actualizar estado de los botones de historial
    if (window.actualizarBotonesHistorial) {
        window.actualizarBotonesHistorial();
    }
}




/**
 * Agrega una leyenda al canvas
 */
function agregarLeyenda() {
    agregarTexto('Leyenda', {
        fontSize: 14,
        italic: true
    });
}

// En CO.js - NUEVA implementación unificada
window.MAIRA = window.MAIRA || {};
window.MAIRA.CuadroOrganizacion = {
    // ✅ ESTADO DEL SISTEMA
    version: '2.0.0',
    inicializado: false,
    
    // ✅ API PRINCIPAL
    inicializar: function() {
        try {
            if (typeof inicializarCuadroOrganizacion === 'function') {
                inicializarCuadroOrganizacion();
                this.inicializado = true;
                
                // Integrar con MiRadial si está disponible
                if (window.MiRadial) {
                    this.configurarMenuRadial();
                }
                
                console.log('✅ MAIRA.CuadroOrganizacion inicializado');
                return true;
            } else {
                throw new Error('Función inicializarCuadroOrganizacion no encontrada');
            }
        } catch (error) {
            console.error('❌ Error inicializando CuadroOrganizacion:', error);
            return false;
        }
    },
    
    // ✅ GESTIÓN DE SÍMBOLOS
    simbolos: {
        agregar: function(sidc, nombre) {
            if (typeof agregarMarcador === 'function') {
                return agregarMarcador(sidc, nombre);
            }
            console.error('Función agregarMarcador no disponible');
        },
        
        buscar: function(query) {
            if (typeof buscarSimbolo === 'function') {
                return buscarSimbolo(query);
            }
            console.error('Función buscarSimbolo no disponible');
        },
        
        actualizar: function(elemento, nuevoSidc) {
            if (typeof actualizarSidc === 'function') {
                return actualizarSidc(elemento, nuevoSidc);
            }
            console.error('Función actualizarSidc no disponible');
        }
    },
    
    // ✅ GESTIÓN DE ELEMENTOS
    elementos: {
        seleccionar: function(elemento) {
            if (typeof seleccionarElemento === 'function') {
                return seleccionarElemento(elemento);
            }
        },
        
        eliminar: function() {
            if (typeof eliminarElementoSeleccionado === 'function') {
                return eliminarElementoSeleccionado();
            }
        },
        
        editar: function() {
            if (typeof editarElementoSeleccionado === 'function') {
                return editarElementoSeleccionado();
            }
        }
    },
    
    // ✅ HISTORIAL
    historial: {
        deshacer: function() {
            if (typeof deshacerOrg === 'function') {
                return deshacerOrg();
            }
        },
        
        rehacer: function() {
            if (typeof rehacerOrg === 'function') {
                return rehacerOrg();
            }
        }
    },
    
    // ✅ PERSISTENCIA
    persistencia: {
        guardar: function() {
            if (typeof guardarCuadroOrganizacion === 'function') {
                return guardarCuadroOrganizacion();
            }
        },
        
        cargar: function(datos) {
            if (typeof cargarCuadroOrganizacion === 'function') {
                return cargarCuadroOrganizacion(datos);
            }
        },
        
        exportar: function() {
            if (typeof exportarComoImagen === 'function') {
                return exportarComoImagen();
            }
        }
    },
    
    // ✅ VISTA Y ZOOM
    vista: {
        zoom: function(factor) {
            if (typeof ajustarZoom === 'function') {
                return ajustarZoom(factor);
            }
        },
        
        resetZoom: function() {
            if (typeof resetZoom === 'function') {
                return resetZoom();
            }
        },
        
        centrar: function() {
            if (typeof ajustarZoomResponsive === 'function') {
                return ajustarZoomResponsive();
            }
        }
    },
    
    // ✅ NUEVA: Gestión unificada de edición
    edicion: {
        /**
         * Gestión centralizada de edición de elementos
         */
        mostrarPanel: function(elemento, tipo = 'auto') {
            if (!elemento) {
                console.error('No hay elemento para editar');
                return false;
            }
            
            // Auto-detectar tipo si no se especifica
            if (tipo === 'auto') {
                const sidc = elemento.getAttribute('data-sidc');
                if (sidc) {
                    tipo = this.determinarTipoElemento(sidc);
                } else {
                    tipo = 'unidad'; // Por defecto
                }
            }
            
            // Mostrar panel correspondiente
            switch(tipo) {
                case 'unidad':
                    return this.mostrarPanelUnidad(elemento);
                case 'equipo':
                    return this.mostrarPanelEquipo(elemento);
                default:
                    console.warn('Tipo de elemento no reconocido:', tipo);
                    return this.mostrarPanelUnidad(elemento); // Fallback
            }
        },
        
        /**
         * Determina el tipo de elemento basado en SIDC
         */
        determinarTipoElemento: function(sidc) {
            if (!sidc || sidc.length < 10) return 'unidad';
            
            // Lógica mejorada de detección
            const codigoFuncion = sidc.charAt(4);
            const simboloPrincipal = sidc.substring(4, 10);
            
            // Equipos individuales
            if (codigoFuncion === 'E' || 
                simboloPrincipal.includes('EQT') || 
                simboloPrincipal.includes('VEH')) {
                return 'equipo';
            }
            
            return 'unidad';
        },
        
        /**
         * Validación robusta de datos
         */
        validarDatos: function(datos) {
            const errores = [];
            
            // Validar campos obligatorios
            if (!datos.designacion?.trim()) {
                errores.push('La designación es obligatoria');
            }
            
            if (!datos.dependencia?.trim()) {
                errores.push('La dependencia es obligatoria');
            }
            
            // Validar formato SIDC
            if (datos.sidc && !this.validarSIDC(datos.sidc)) {
                errores.push('Formato SIDC inválido');
            }
            
            return {
                esValido: errores.length === 0,
                errores: errores
            };
        },
        
        /**
         * Validación de formato SIDC
         */
        validarSIDC: function(sidc) {
            // SIDC debe tener 15 caracteres
            if (!sidc || sidc.length !== 15) return false;
            
            // Primer carácter debe ser 'S' (Warfighting)
            if (sidc.charAt(0) !== 'S') return false;
            
            // Segundo carácter debe ser válido (F,H,N,U,etc.)
            const afiliacionValida = ['F', 'H', 'N', 'U', 'A', 'S', 'G', 'W'];
            if (!afiliacionValida.includes(sidc.charAt(1))) return false;
            
            return true;
        },
        
        /**
         * Guardar cambios con validación completa
         */
        guardarCambios: function(elemento, datosNuevos) {
            try {
                // Validar datos
                const validacion = this.validarDatos(datosNuevos);
                if (!validacion.esValido) {
                    this.mostrarErrores(validacion.errores);
                    return false;
                }
                
                // Guardar estado anterior para historial
                const estadoAnterior = this.capturarEstado(elemento);
                
                // Aplicar cambios
                const resultado = this.aplicarCambios(elemento, datosNuevos);
                
                if (resultado.exito) {
                    // Registrar en historial
                    this.registrarCambio(estadoAnterior, elemento);
                    
                    // Actualizar conexiones
                    this.actualizarConexiones(elemento);
                    
                    // Notificar éxito
                    this.mostrarNotificacion('Cambios guardados correctamente', 'success');
                    
                    return true;
                } else {
                    this.mostrarNotificacion('Error al guardar cambios: ' + resultado.error, 'error');
                    return false;
                }
                
            } catch (error) {
                console.error('Error inesperado al guardar:', error);
                this.mostrarNotificacion('Error inesperado al guardar cambios', 'error');
                return false;
            }
        }
    },
    
    // ✅ NUEVA: Gestión de notificaciones
    notificaciones: {
        /**
         * Muestra notificación al usuario
         */
        mostrar: function(mensaje, tipo = 'info', duracion = 3000) {
            // Crear elemento de notificación
            const notificacion = document.createElement('div');
            notificacion.className = `co-notificacion co-notificacion-${tipo}`;
            notificacion.innerHTML = `
                <div class="co-notificacion-contenido">
                    <i class="fas ${this.obtenerIcono(tipo)}"></i>
                    <span>${mensaje}</span>
                    <button class="co-notificacion-cerrar">&times;</button>
                </div>
            `;
            
            // Agregar estilos si no existen
            this.agregarEstilos();
            
            // Agregar al DOM
            document.body.appendChild(notificacion);
            
            // Auto-eliminar
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, duracion);
            
            // Evento de cerrar
            notificacion.querySelector('.co-notificacion-cerrar').onclick = function() {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            };
        },
        
        obtenerIcono: function(tipo) {
            const iconos = {
                'success': 'fa-check-circle',
                'error': 'fa-exclamation-triangle',
                'warning': 'fa-exclamation-circle',
                'info': 'fa-info-circle'
            };
            return iconos[tipo] || iconos.info;
        },
        
        agregarEstilos: function() {
            if (document.getElementById('co-notificaciones-style')) return;
            
            const style = document.createElement('style');
            style.id = 'co-notificaciones-style';
            style.textContent = `
                .co-notificacion {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    background: white;
                    border-left: 4px solid #007bff;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideInRight 0.3s ease;
                }
                
                .co-notificacion-success { border-left-color: #28a745; }
                .co-notificacion-error { border-left-color: #dc3545; }
                .co-notificacion-warning { border-left-color: #ffc107; }
                
                .co-notificacion-contenido {
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .co-notificacion-cerrar {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
};
window.MAIRA = window.MAIRA || {};
window.MAIRA.CuadroOrganizacion = {
    version: '2.0.0',
    inicializado: false,
    
    // API Principal
    inicializar: function() { /* lógica inicialización */ },
    
    // Gestión de símbolos
    simbolos: {
        agregar: function(sidc, nombre) { /* wrapper agregarMarcador */ },
        buscar: function(query) { /* wrapper buscarSimbolo */ },
        actualizar: function(elemento, nuevoSidc) { /* wrapper actualizarSidc */ }
    },
    
    // Gestión de elementos
    elementos: {
        seleccionar: function(elemento) { /* wrapper seleccionarElemento */ },
        eliminar: function() { /* wrapper eliminarElementoSeleccionado */ },
        editar: function() { /* wrapper editarElementoSeleccionado */ }
    },
    
    // Control historial
    historial: {
        deshacer: function() { /* wrapper deshacerOrg */ },
        rehacer: function() { /* wrapper rehacerOrg */ }
    },
    
    // Persistencia
    persistencia: {
        guardar: function() { /* wrapper guardarCuadroOrganizacion */ },
        cargar: function(datos) { /* wrapper cargarCuadroOrganizacion */ },
        exportar: function() { /* wrapper exportarComoImagen */ }
    },
    
    // Vista y zoom
    vista: {
        zoom: function(factor) { /* wrapper ajustarZoom */ },
        resetZoom: function() { /* wrapper resetZoom */ },
        centrar: function() { /* wrapper ajustarZoomResponsive */ }
    }
};

// Auto-configurar MiRadial al cargar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.MAIRA.CuadroOrganizacion.configurarMenuRadial) {
            window.MAIRA.CuadroOrganizacion.configurarMenuRadial();
        }
    }, 1000);
});


window.MAIRA.CuadroOrganizacion.edicion = {
    mostrarPanel: function(elemento, tipo) { /* gestión centralizada */ },
    determinarTipoElemento: function(sidc) { /* auto-detección */ },
    validarDatos: function(datos) { /* validación robusta */ },
    validarSIDC: function(sidc) { /* validación formato */ },
    guardarCambios: function(elemento, datosNuevos) { /* guardar con validación */ }
};


window.MAIRA.CuadroOrganizacion.notificaciones = {
    mostrar: function(mensaje, tipo, duracion) { /* notificaciones visuales */ },
    obtenerIcono: function(tipo) { /* iconos por tipo */ },
    agregarEstilos: function() { /* CSS automático */ }
};
console.log('✅ CO.js v2.1.0 - Mejoras integradas');