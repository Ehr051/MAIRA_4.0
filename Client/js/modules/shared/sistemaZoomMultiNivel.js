/**
 * SISTEMA ZOOM MULTI-NIVEL - MAIRA 4.0
 * =====================================
 * Inspirado en Total War: 3 niveles de visualización
 * 1. ESTRATÉGICO (zoom 5-8): Estandartes y símbolos militares - ZOOM 3 (más lejos)
 * 2. OPERACIONAL (zoom 9-12): Unidades detalladas con iconografía - ZOOM 2 (medio)
 * 3. TÁCTICO (zoom 13-18): Elementos individuales 3D - ZOOM 1 (más cerca)
 */

class SistemaZoomMultiNivel {
    constructor(mapa) {
        this.mapa = mapa;
        this.nivelActual = 'estrategico';
        this.niveles = {
            estrategico: { min: 5, max: 8, icono: 'flag', escala: 1.0 },    // Zoom 3 - Más lejos
            operacional: { min: 9, max: 12, icono: 'chess-board', escala: 0.8 },  // Zoom 2 - Medio
            tactico: { min: 13, max: 18, icono: 'cube', escala: 0.6 }       // Zoom 1 - Más cerca
        };
        
        this.elementos = new Map(); // Almacena todos los elementos del mapa
        this.capasRenderizado = {
            estandartes: null,
            unidades: null,
            elementos3d: null
        };
        
        // Integración con sistemas 3D
        this.modelos3DManager = window.modelos3DManager;
        this.elementoMapper = window.elementoModelo3DMapper;
        this.escena3D = null; // Se inicializa cuando se necesite
        
        this.inicializar();
        console.log('🔍 Sistema Zoom Multi-Nivel inicializado con modelos 3D (Total War Style)');
    }

    inicializar() {
        // Crear capas de renderizado
        this.crearCapas();
        
        // Escuchar cambios de zoom
        this.mapa.on('zoomend', () => {
            this.actualizarNivelZoom();
        });
        
        // Configurar zoom inicial
        this.actualizarNivelZoom();
    }

    crearCapas() {
        // Capa de estandartes (nivel estratégico)
        this.capasRenderizado.estandartes = L.layerGroup().addTo(this.mapa);
        
        // Capa de unidades (nivel táctico)
        this.capasRenderizado.unidades = L.layerGroup().addTo(this.mapa);
        
        // Capa de elementos 3D (nivel operacional)
        this.capasRenderizado.elementos3d = L.layerGroup().addTo(this.mapa);
    }

    actualizarNivelZoom() {
        const zoomActual = this.mapa.getZoom();
        const nivelAnterior = this.nivelActual;
        
        // Determinar nivel actual
        if (zoomActual >= this.niveles.estrategico.min && zoomActual <= this.niveles.estrategico.max) {
            this.nivelActual = 'estrategico';   // Zoom 3 - Estandartes (más lejos)
        } else if (zoomActual >= this.niveles.operacional.min && zoomActual <= this.niveles.operacional.max) {
            this.nivelActual = 'operacional';   // Zoom 2 - Unidades (medio)
        } else if (zoomActual >= this.niveles.tactico.min && zoomActual <= this.niveles.tactico.max) {
            this.nivelActual = 'tactico';       // Zoom 1 - Elementos 3D (más cerca)
        }
        
        // Si cambió el nivel, actualizar renderizado
        if (nivelAnterior !== this.nivelActual) {
            this.cambiarNivelRenderizado(nivelAnterior, this.nivelActual);
            this.actualizarIndicadorVisual(zoomActual);
            console.log(`🔍 Zoom nivel cambiado: ${nivelAnterior} → ${this.nivelActual} (zoom: ${zoomActual})`);
        } else {
            // Solo actualizar el zoom en el indicador
            this.actualizarIndicadorVisual(zoomActual);
        }
    }

    cambiarNivelRenderizado(nivelAnterior, nivelNuevo) {
        // Ocultar nivel anterior
        this.ocultarNivel(nivelAnterior);
        
        // Mostrar nivel nuevo
        this.mostrarNivel(nivelNuevo);
        
        // Emitir evento para otros sistemas
        document.dispatchEvent(new CustomEvent('cambioNivelZoom', {
            detail: { 
                nivelAnterior, 
                nivelNuevo, 
                zoom: this.mapa.getZoom() 
            }
        }));
    }

    ocultarNivel(nivel) {
        switch(nivel) {
            case 'estrategico':     // Zoom 3 - Estandartes
                this.capasRenderizado.estandartes.clearLayers();
                break;
            case 'operacional':     // Zoom 2 - Unidades
                this.capasRenderizado.unidades.clearLayers();
                break;
            case 'tactico':         // Zoom 1 - Elementos 3D
                this.capasRenderizado.elementos3d.clearLayers();
                break;
        }
    }

    mostrarNivel(nivel) {
        switch(nivel) {
            case 'estrategico':     // Zoom 3 - Más lejos del suelo
                this.renderizarEstandartes();
                // Asegurar que la vista 3D esté desactivada
                this.desactivarVista3DAutomatica();
                break;
            case 'operacional':     // Zoom 2 - Nivel medio
                this.renderizarUnidades();
                // Asegurar que la vista 3D esté desactivada
                this.desactivarVista3DAutomatica();
                break;
            case 'tactico':         // Zoom 1 - Más cerca del suelo
                this.renderizarElementos3D();
                // Activar automáticamente la vista 3D en nivel táctico
                this.activarVista3DAutomatica();
                break;
        }
    }

    // NIVEL ESTRATÉGICO: Estandartes y símbolos grandes
    renderizarEstandartes() {
        this.elementos.forEach((elemento, id) => {
            if (elemento.tipo === 'unidad' || elemento.tipo === 'formacion') {
                const estandarte = this.crearEstandarte(elemento);
                this.capasRenderizado.estandartes.addLayer(estandarte);
            }
        });
    }

    crearEstandarte(elemento) {
        // Determinar tipo de unidad y símbolo apropiado
        const tipoUnidad = this.determinarTipoUnidad(elemento);
        const simboloMilitar = this.obtenerSimboloMilitar(elemento);
        const bandoColor = this.obtenerColorBando(elemento.bando || 'azul');
        
        const icono = L.divIcon({
            className: 'estandarte-militar estrategico',
            html: `
                <div class="estandarte-contenedor">
                    <div class="estandarte-mástil"></div>
                    <div class="bandera-militar ${elemento.bando || 'azul'}" style="background: ${bandoColor}">
                        <div class="simbolo-nacional">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="codigo-unidad">${elemento.codigo || 'UNK'}</div>
                    </div>
                    <div class="info-tactica">
                        <div class="designacion-unidad">${elemento.nombre || 'UNIDAD'}</div>
                        <div class="tipo-fuerza">${tipoUnidad.toUpperCase()}</div>
                        <div class="efectivos-numericos">
                            <i class="fas fa-users"></i>
                            <span>${elemento.efectivos || '???'}</span>
                        </div>
                        <div class="estado-operacional ${elemento.estado || 'operativo'}">
                            <div class="indicador-estado"></div>
                            <span>${this.obtenerEstadoTexto(elemento.estado)}</span>
                        </div>
                    </div>
                    <div class="simbolo-militar-mini">
                        ${simboloMilitar}
                    </div>
                </div>
            `,
            iconSize: [80, 120],
            iconAnchor: [40, 110]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        // Evento click para mostrar información detallada
        marker.on('click', () => {
            this.mostrarInformacionEstandarte(elemento);
        });

        // Animación de aparición
        marker.on('add', () => {
            setTimeout(() => {
                const estandarteEl = marker.getElement();
                if (estandarteEl) {
                    estandarteEl.classList.add('estandarte-desplegado');
                }
            }, 100);
        });

        return marker;
    }

    // Funciones auxiliares para estandartes
    determinarTipoUnidad(elemento) {
        if (elemento.tipo) return elemento.tipo;
        if (elemento.sidc) {
            return this.obtenerTipoPorSIDC(elemento.sidc);
        }
        return 'Infantería';
    }

    obtenerSimboloMilitar(elemento) {
        if (elemento.sidc && window.ms) {
            try {
                const symbol = new window.ms.Symbol(elemento.sidc, {
                    size: 20,
                    fill: true,
                    colorMode: "Light"
                });
                return symbol.asSVG();
            } catch (e) {
                console.warn('Error generando símbolo SIDC:', e);
            }
        }
        
        // Símbolo genérico si no hay SIDC
        return '<i class="fas fa-shield-alt"></i>';
    }

    obtenerColorBando(bando) {
        const colores = {
            'azul': '#1e40af',
            'rojo': '#dc2626', 
            'verde': '#16a34a',
            'amarillo': '#ca8a04',
            'neutral': '#64748b'
        };
        return colores[bando] || colores['azul'];
    }

    obtenerEstadoTexto(estado) {
        const estados = {
            'operativo': 'OPERATIVO',
            'degradado': 'DEGRADADO',
            'no_operativo': 'NO OPERATIVO',
            'en_combate': 'EN COMBATE',
            'reagrupando': 'REAGRUPANDO'
        };
        return estados[estado] || 'OPERATIVO';
    }

    obtenerTipoPorSIDC(sidc) {
        // Lógica simplificada de tipos por SIDC
        if (!sidc || sidc.length < 6) return 'Infantería';
        
        const codigo = sidc.substring(4, 7);
        const tipos = {
            'UCI': 'Infantería',
            'UCR': 'Caballería', 
            'UCF': 'Artillería',
            'UCE': 'Ingenieros',
            'UCD': 'Def. Aérea',
            'UUS': 'Comunicaciones'
        };
        
        return tipos[codigo] || 'Unidad';
    }

    mostrarInformacionEstandarte(elemento) {
        // Panel de información detallada para el estandarte
        const infoPanel = document.createElement('div');
        infoPanel.className = 'panel-info-estandarte';
        infoPanel.innerHTML = `
            <div class="header-estandarte">
                <h3>${elemento.nombre || 'UNIDAD MILITAR'}</h3>
                <button class="btn-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="contenido-estandarte">
                <div class="seccion">
                    <h4>Identificación</h4>
                    <p><strong>Código:</strong> ${elemento.codigo || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${this.determinarTipoUnidad(elemento)}</p>
                    <p><strong>SIDC:</strong> ${elemento.sidc || 'N/A'}</p>
                </div>
                <div class="seccion">
                    <h4>Estado Operacional</h4>
                    <p><strong>Estado:</strong> ${this.obtenerEstadoTexto(elemento.estado)}</p>
                    <p><strong>Efectivos:</strong> ${elemento.efectivos || '???'}</p>
                    <p><strong>Posición:</strong> [${elemento.posicion?.lat?.toFixed(4) || '?'}, ${elemento.posicion?.lng?.toFixed(4) || '?'}]</p>
                </div>
            </div>
        `;
        
        // Posicionar el panel
        infoPanel.style.position = 'fixed';
        infoPanel.style.top = '20px';
        infoPanel.style.right = '20px';
        infoPanel.style.zIndex = '10000';
        
        document.body.appendChild(infoPanel);
        
        // Auto remove después de 10 segundos
        setTimeout(() => {
            if (infoPanel.parentElement) {
                infoPanel.remove();
            }
        }, 10000);
    }

    // NIVEL TÁCTICO: Unidades con iconografía detallada
    renderizarUnidades() {
        this.elementos.forEach((elemento, id) => {
            const unidad = this.crearUnidad(elemento);
            this.capasRenderizado.unidades.addLayer(unidad);
        });
    }

    crearUnidad(elemento) {
        const tipoIcono = this.getIconoTactico(elemento.tipo);
        
        const icono = L.divIcon({
            className: 'unidad-tactica',
            html: `
                <div class="unidad-contenedor ${elemento.estado || 'operacional'}">
                    <div class="icono-unidad">
                        <i class="fas fa-${tipoIcono}"></i>
                    </div>
                    <div class="barra-estado">
                        <div class="barra-vida" style="width: ${100 - (elemento.daños || 0)}%"></div>
                    </div>
                    <div class="etiqueta-unidad">${elemento.nombre?.substring(0, 8) || 'U-???'}</div>
                </div>
            `,
            iconSize: [40, 50],
            iconAnchor: [20, 45]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        marker.on('click', () => {
            if (window.panelUnificado) {
                window.panelUnificado.seleccionarElemento(elemento);
            }
        });

        return marker;
    }

    // NIVEL OPERACIONAL: Elementos 3D individuales
    async renderizarElementos3D() {
        console.log('🎮 Renderizando elementos 3D...');
        
        // Verificar que los sistemas estén disponibles
        if (!this.modelos3DManager || !this.elementoMapper) {
            console.warn('⚠️ Sistemas 3D no disponibles, usando renderizado básico');
            this.elementos.forEach((elemento, id) => {
                const elemento3d = this.crearElemento3D(elemento);
                this.capasRenderizado.elementos3d.addLayer(elemento3d);
            });
            return;
        }
        
        // Renderizar cada elemento como modelo 3D
        for (const [id, elemento] of this.elementos) {
            try {
                await this.agregarElemento3D(elemento);
            } catch (error) {
                console.error(`❌ Error renderizando elemento 3D ${id}:`, error);
                // Fallback al método básico
                const elemento3d = this.crearElemento3D(elemento);
                this.capasRenderizado.elementos3d.addLayer(elemento3d);
            }
        }
        
        console.log(`✅ ${this.elementos.size} elementos 3D renderizados`);
    }

    async agregarElemento3D(elemento) {
        // Obtener información del modelo
        const infoElemento = this.elementoMapper.obtenerInfoElemento(elemento.tipo || elemento.nombre);
        
        // ✨ NUEVO: Crear formación militar si es aplicable
        let modelo3D;
        const zoomActual = this.mapa.getZoom();
        
        // Verificar si debe generar formación militar
        if (this.esElementoFormacion(elemento) && this.modelos3DManager.sistemaFormaciones) {
            console.log(`🪖 Generando formación militar para: ${elemento.nombre || elemento.tipo}`);
            modelo3D = await this.modelos3DManager.crearFormacionMilitar(
                elemento, 
                zoomActual, 
                elemento.posicion
            );
        } else {
            // Obtener modelo 3D individual
            modelo3D = await this.modelos3DManager.obtenerModelo3D(
                infoElemento.modelo3D, 
                elemento.posicion
            );
        }
        
        // Crear marcador con canvas para el modelo 3D
        const marcador3D = L.marker(elemento.posicion, {
            icon: L.divIcon({
                className: 'marcador-3d',
                html: `
                    <div class="contenedor-modelo-3d" style="
                        width: 80px; 
                        height: 80px; 
                        position: relative;
                        background: rgba(0,0,0,0.1);
                        border-radius: 8px;
                        border: 2px solid ${infoElemento.colorMapa};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        <canvas class="canvas-modelo-3d" width="76" height="76" style="
                            position: absolute;
                            top: 2px;
                            left: 2px;
                            border-radius: 6px;
                        "></canvas>
                        <div class="etiqueta-elemento-3d" style="
                            position: absolute;
                            bottom: -20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background: rgba(0,0,0,0.8);
                            color: white;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-size: 10px;
                            white-space: nowrap;
                        ">${elemento.nombre || elemento.tipo}</div>
                        
                        <!-- Indicadores de estado -->
                        <div class="indicadores-estado" style="position: absolute; top: -8px; right: -8px;">
                            ${elemento.estado?.dañado ? '<i class="fas fa-exclamation-triangle" style="color: #ff6b6b;"></i>' : ''}
                            ${elemento.estado?.movimiento ? '<i class="fas fa-arrow-right" style="color: #4ecdc4;"></i>' : ''}
                        </div>
                    </div>
                `,
                iconSize: [80, 80],
                iconAnchor: [40, 40]
            })
        });
        
        // Eventos del marcador
        marcador3D.on('click', () => {
            this.mostrarDetallesElemento3D(elemento, infoElemento);
        });
        
        // Configurar renderizado 3D cuando se añada al mapa
        marcador3D.on('add', () => {
            setTimeout(() => {
                this.configurarRenderizadoModelo3D(marcador3D, modelo3D, elemento, infoElemento);
            }, 100);
        });
        
        // Añadir a la capa
        this.capasRenderizado.elementos3d.addLayer(marcador3D);
        
        // Almacenar referencia
        elemento._marcador3D = marcador3D;
        
        return marcador3D;
    }

    mostrarDetallesElemento3D(elemento, infoElemento) {
        // Panel con información detallada del elemento 3D
        const panel = document.createElement('div');
        panel.className = 'panel-elemento-3d';
        panel.innerHTML = `
            <div class="header-elemento">
                <i class="fas fa-cube"></i>
                <h3>${elemento.nombre || elemento.tipo}</h3>
                <button class="btn-cerrar" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="info-elemento">
                <p><strong>Categoría:</strong> ${infoElemento.categoria || 'N/A'}</p>
                <p><strong>Modelo 3D:</strong> ${infoElemento.modelo3D}</p>
                <p><strong>Estado:</strong> ${elemento.estado?.operacional ? '✅ Operacional' : '⚠️ Dañado'}</p>
                <p><strong>Posición:</strong> [${elemento.posicion.lat.toFixed(4)}, ${elemento.posicion.lng.toFixed(4)}]</p>
            </div>
            <div class="acciones-elemento">
                <button onclick="console.log('Mover elemento:', '${elemento.id}')">📍 Mover</button>
                <button onclick="console.log('Inspeccionar:', '${elemento.id}')">🔍 Inspeccionar</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    agregarModelo3D(unidad) {
        try {
            // Obtener el modelo 3D correspondiente
            const modelo3D = window.generadorModelos3D.obtenerModelo(unidad.tipo);
            
            // Posicionar el modelo en el mundo 3D
            const coordenadas = this.mapa.latLngToContainerPoint([unidad.posicion.lat, unidad.posicion.lng]);
            
            // Crear marcador Leaflet con canvas 3D embebido
            const marcador3D = L.marker([unidad.posicion.lat, unidad.posicion.lng], {
                icon: L.divIcon({
                    className: 'marcador-3d-real',
                    html: `<div class="contenedor-modelo-3d" data-unidad="${unidad.id}" data-tipo="${unidad.tipo}">
                             <canvas class="canvas-modelo-3d" width="60" height="60"></canvas>
                           </div>`,
                    iconSize: [60, 60]
                })
            });
            
            // Configurar renderizado 3D del modelo
            marcador3D.on('add', () => {
                this.configurarRenderizadoModelo3D(marcador3D, modelo3D, unidad);
            });
            
            this.capasRenderizado.elementos3d.addLayer(marcador3D);
            
        } catch (error) {
            console.error('❌ Error al agregar modelo 3D:', error);
            // Fallback a marcador simple
            this.agregarMarcadorFallback(unidad);
        }
    }

    configurarRenderizadoModelo3D(marcador, modelo3D, unidad) {
        const canvas = marcador.getElement().querySelector('.canvas-modelo-3d');
        if (!canvas) return;

        // Crear escena Three.js miniaturizada
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            alpha: true, 
            antialias: true 
        });
        
        renderer.setSize(60, 60);
        renderer.setClearColor(0x000000, 0); // Transparente
        
        // Configurar cámara
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        
        // Iluminación
        const luzAmbiente = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(luzAmbiente);
        
        const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
        luzDireccional.position.set(5, 10, 5);
        scene.add(luzDireccional);
        
        // Agregar el modelo a la escena
        scene.add(modelo3D);
        
        // Aplicar efectos de estado
        if (unidad.estado) {
            this.aplicarEfectosEstado(modelo3D, unidad.estado);
        }
        
        // Rotación suave del modelo
        let rotacion = unidad.orientacion || 0;
        modelo3D.rotation.y = rotacion;
        
        // Animación de rotación sutil
        const animar = () => {
            modelo3D.rotation.y += 0.01;
            renderer.render(scene, camera);
            
            // Continuar animación solo si el marcador está visible
            if (marcador._map) {
                requestAnimationFrame(animar);
            }
        };
        
        animar();
        
        // Interacciones del modelo
        canvas.addEventListener('click', () => {
            this.mostrarDetallesUnidad3D(unidad);
        });
        
        // Almacenar referencias para limpieza
        marcador._modelo3D = {
            scene: scene,
            renderer: renderer,
            camera: camera,
            modelo: modelo3D
        };
    }

    aplicarEfectosEstado(modelo3D, estado) {
        if (estado.daño && estado.daño > 0) {
            window.generadorModelos3D.aplicarDaño(modelo3D, estado.daño);
        }
        
        if (estado.movimiento) {
            // Efectos de movimiento (polvo, etc.)
            this.agregarEfectosMovimiento(modelo3D);
        }
        
        if (estado.combate) {
            // Efectos de combate (muzzle flash, etc.)
            this.agregarEfectosCombate(modelo3D);
        }
    }

    agregarEfectosMovimiento(modelo3D) {
        // Partículas de polvo simplificadas
        const polvillo = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const particula = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({ 
                    color: 0x8b7355, 
                    transparent: true, 
                    opacity: 0.3 
                })
            );
            particula.position.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 2
            );
            polvillo.add(particula);
        }
        modelo3D.add(polvillo);
    }

    agregarEfectosCombate(modelo3D) {
        // Efectos de disparo simplificados
        const flash = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 6, 6),
            new THREE.MeshBasicMaterial({ 
                color: 0xffff00, 
                transparent: true, 
                opacity: 0.8 
            })
        );
        flash.position.set(3, 2, 0); // Posición del cañón
        modelo3D.add(flash);
        
        // Fade out del flash
        setTimeout(() => {
            modelo3D.remove(flash);
        }, 200);
    }

    mostrarDetallesUnidad3D(unidad) {
        const detalles = `
            <div class="popup-unidad-3d">
                <h3>${unidad.nombre || unidad.tipo}</h3>
                <p><strong>Tipo:</strong> ${unidad.tipo}</p>
                <p><strong>Estado:</strong> ${unidad.estado?.operativo || 'Operativo'}</p>
                <p><strong>Munición:</strong> ${unidad.estado?.municion || 100}%</p>
                <p><strong>Combustible:</strong> ${unidad.estado?.combustible || 100}%</p>
                ${unidad.estado?.daño ? `<p><strong>Daño:</strong> ${unidad.estado.daño}%</p>` : ''}
            </div>
        `;
        
        // Mostrar en popup o panel lateral
        if (window.sistemaHUD) {
            window.sistemaHUD.mostrarInformacionUnidad(detalles);
        } else {
            alert(detalles.replace(/<[^>]*>/g, '\n')); // Fallback simple
        }
    }

    agregarMarcadorFallback(unidad) {
        // Marcador simple si falla el 3D
        const marcadorSimple = L.marker([unidad.posicion.lat, unidad.posicion.lng], {
            icon: L.divIcon({
                className: 'marcador-fallback',
                html: `<div class="elemento-fallback">${this.obtenerIconoTipo(unidad.tipo)}</div>`,
                iconSize: [30, 30]
            })
        });
        
        this.capasRenderizado.elementos3d.addLayer(marcadorSimple);
    }

    obtenerIconoTipo(tipo) {
        const iconos = {
            'tanque': '🚂',
            'tam': '🚂',
            'mecanizado': '🚐',
            'm113': '🚐',
            'artilleria': '🎯',
            'citer': '🎯',
            'infanteria': '🚶',
            'soldado': '🚶',
            'camion': '🚛'
        };
        
        return iconos[tipo?.toLowerCase()] || '⚫';
    }

    crearElemento3D(elemento) {
        const tipoIcono = this.getIconoOperacional(elemento.tipo);
        
        const icono = L.divIcon({
            className: 'elemento-3d',
            html: `
                <div class="modelo-3d ${elemento.tipo} ${elemento.estado || 'operacional'}">
                    <div class="sombra-elemento"></div>
                    <div class="modelo">
                        <i class="fas fa-${tipoIcono}"></i>
                    </div>
                    <div class="indicadores">
                        ${elemento.combustible < 20 ? '<div class="alerta combustible"><i class="fas fa-gas-pump"></i></div>' : ''}
                        ${elemento.municion < 20 ? '<div class="alerta municion"><i class="fas fa-bomb"></i></div>' : ''}
                        ${elemento.daños > 50 ? '<div class="alerta daños"><i class="fas fa-wrench"></i></div>' : ''}
                    </div>
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 28]
        });

        const marker = L.marker(elemento.posicion, { icon: icono });
        
        marker.on('click', () => {
            if (window.panelUnificado) {
                window.panelUnificado.seleccionarElemento(elemento);
            }
        });

        return marker;
    }

    // Métodos utilitarios
    getIconoTactico(tipo) {
        const iconos = {
            'tanque': 'tank',
            'mecanizado': 'truck-military', 
            'artilleria': 'cannon',
            'infanteria': 'running',
            'comando': 'star',
            'apoyo': 'medkit',
            'helicoptero': 'helicopter',
            'avion': 'plane'
        };
        return iconos[tipo?.toLowerCase()] || 'square';
    }

    getIconoOperacional(tipo) {
        return this.getIconoTactico(tipo); // Mismos iconos pero más detallados
    }

    // API pública
    agregarElemento(id, elemento) {
        this.elementos.set(id, elemento);
        this.actualizarNivelZoom(); // Refrescar renderizado
    }

    removerElemento(id) {
        this.elementos.delete(id);
        this.actualizarNivelZoom(); // Refrescar renderizado
    }

    actualizarElemento(id, propiedades) {
        if (this.elementos.has(id)) {
            Object.assign(this.elementos.get(id), propiedades);
            this.actualizarNivelZoom(); // Refrescar renderizado
        }
    }

    obtenerNivelActual() {
        return this.nivelActual;
    }

    actualizarIndicadorVisual(zoom) {
        const indicador = document.getElementById('indicadorNivelZoom');
        if (!indicador) return;
        
        // Actualizar clases CSS
        indicador.className = `indicador-nivel-zoom ${this.nivelActual}`;
        
        // Actualizar textos
        const textoNivel = indicador.querySelector('.nivel-texto');
        const textoZoom = indicador.querySelector('.nivel-zoom');
        
        if (textoNivel) {
            textoNivel.textContent = this.nivelActual.toUpperCase();
        }
        
        if (textoZoom) {
            textoZoom.textContent = `Zoom: ${zoom}`;
        }
    }

    /**
     * DETERMINA SI UN ELEMENTO DEBE GENERAR FORMACIÓN MILITAR
     */
    esElementoFormacion(elemento) {
        const tiposFormacion = [
            // Infantería
            'equipo', 'grupo', 'sección', 'subunidad', 'compañía',
            'equipo de infantería', 'grupo de infantería', 'sección de infantería',
            'equipo de tiradores', 'grupo de tiradores', 'sección de tiradores',
            'grupo de apoyo', 'puesto comando',
            
            // Caballería
            'sección de tanques', 'escuadrón de tanques', 'regimiento blindado',
            'tanque', 'tam', 'tam 2c', 'sk 105',
            
            // Artillería
            'batería', 'grupo de artillería', 'pieza de artillería',
            'mortero', 'cañón', 'obús',
            
            // Apoyo
            'tren de subunidad', 'columna logística', 'puesto de socorro'
        ];
        
        const nombre = (elemento.nombre || elemento.tipo || '').toLowerCase();
        const especialidad = (elemento.especialidad || '').toLowerCase();
        const subtipo = (elemento.subtipo || '').toLowerCase();
        
        // Verificar por nombre
        const esFormacionPorNombre = tiposFormacion.some(tipo => 
            nombre.includes(tipo) || tipo.includes(nombre)
        );
        
        // Verificar por especialidad militar
        const esFormacionPorEspecialidad = ['infantería', 'caballería', 'artillería', 'ingenieros']
            .some(esp => especialidad.includes(esp));
        
        // Verificar por cantidad de personal (indica formación)
        const tienePersonalMultiple = elemento.personal && elemento.personal > 1;
        
        // Verificar por estructura jerárquica
        const tieneEstructuraJerarquica = elemento.subordinados && elemento.subordinados.length > 0;
        
        return esFormacionPorNombre || esFormacionPorEspecialidad || tienePersonalMultiple || tieneEstructuraJerarquica;
    }

    forzarNivel(nivel) {
        if (this.niveles[nivel]) {
            const rango = this.niveles[nivel];
            const zoomTarget = Math.floor((rango.min + rango.max) / 2);
            this.mapa.setZoom(zoomTarget);
        }
    }

    /**
     * 🎮 ACTIVAR VISTA 3D
     * Función para activar manualmente la vista 3D desde el botón del menú
     */
    activar3D() {
        console.log('🎮 Activando vista 3D manual...');
        
        try {
            // Forzar nivel TÁCTICO para activar 3D (zoom más cercano)
            this.forzarNivel('tactico');
            
            // Esperar un momento para que el zoom se aplique
            setTimeout(() => {
                // Forzar actualización del nivel TÁCTICO (elementos 3D)
                this.nivelActual = 'tactico';
                this.actualizarIndicadorZoom();
                
                // Renderizar elementos 3D existentes
                this.renderizarElementos3D();
                
                console.log('✅ Vista 3D activada correctamente');
                
                // Disparar evento personalizado
                document.dispatchEvent(new CustomEvent('vista3DActivada', {
                    detail: { nivel: 'tactico', elementos: this.elementos.size }
                }));
                
            }, 500);
            
        } catch (error) {
            console.error('❌ Error activando vista 3D:', error);
            throw error;
        }
    }

    /**
     * 🎯 DESACTIVAR VISTA 3D
     * Volver al nivel operacional/estratégico
     */
    desactivar3D() {
        console.log('📱 Desactivando vista 3D...');
        
        try {
            // Volver al nivel operacional (unidades)
            this.forzarNivel('operacional');
            
            // Limpiar elementos 3D si existen
            if (this.capasRenderizado.elementos3d) {
                this.capasRenderizado.elementos3d.clearLayers();
            }
            
            console.log('✅ Vista 3D desactivada');
            
        } catch (error) {
            console.error('❌ Error desactivando vista 3D:', error);
        }
    }

    /**
     * 🔄 ACTIVAR VISTA 3D AUTOMÁTICA
     * Se ejecuta automáticamente cuando se alcanza el nivel táctico
     */
    activarVista3DAutomatica() {
        console.log('🎮 Activando vista 3D automática por nivel de zoom...');
        
        try {
            // Verificar si el sistema de vista 3D modular está disponible
            if (typeof toggleVista3DModular === 'function') {
                // Usar el sistema modular existente
                const vista3DContainer = document.getElementById('vista3D');
                if (vista3DContainer && vista3DContainer.style.display === 'none') {
                    toggleVista3DModular();
                    console.log('✅ Vista 3D modular activada automáticamente');
                }
            } else if (window.tactico3DIntegration && window.tactico3DIntegration.activarIntegracion) {
                // Usar el sistema de integración táctico 3D
                window.tactico3DIntegration.activarIntegracion();
                console.log('✅ Vista 3D táctica activada automáticamente');
            } else {
                // Fallback: mostrar contenedor 3D básico
                const vista3DContainer = document.getElementById('vista3D');
                if (vista3DContainer) {
                    vista3DContainer.style.display = 'block';
                    console.log('✅ Contenedor 3D básico activado automáticamente');
                }
            }

            // Emitir evento para que otros sistemas se enteren
            document.dispatchEvent(new CustomEvent('vista3DActivadaAutomatica', {
                detail: { 
                    nivel: 'tactico', 
                    zoom: this.mapa.getZoom(),
                    automatico: true
                }
            }));

        } catch (error) {
            console.error('❌ Error activando vista 3D automática:', error);
        }
    }

    /**
     * 🔄 DESACTIVAR VISTA 3D AUTOMÁTICA
     * Se ejecuta cuando se sale del nivel táctico
     */
    desactivarVista3DAutomatica() {
        console.log('📱 Desactivando vista 3D automática por cambio de nivel...');
        
        try {
            // Verificar si el sistema de vista 3D modular está disponible y activo
            const vista3DContainer = document.getElementById('vista3D');
            if (vista3DContainer && vista3DContainer.style.display !== 'none') {
                
                if (typeof toggleVista3DModular === 'function') {
                    // Usar el sistema modular existente
                    toggleVista3DModular();
                    console.log('✅ Vista 3D modular desactivada automáticamente');
                } else if (window.tactico3DIntegration && window.tactico3DIntegration.desactivarIntegracion) {
                    // Usar el sistema de integración táctico 3D
                    window.tactico3DIntegration.desactivarIntegracion();
                    console.log('✅ Vista 3D táctica desactivada automáticamente');
                } else {
                    // Fallback: ocultar contenedor 3D básico
                    vista3DContainer.style.display = 'none';
                    console.log('✅ Contenedor 3D básico desactivado automáticamente');
                }
            }

            // Emitir evento para que otros sistemas se enteren
            document.dispatchEvent(new CustomEvent('vista3DDesactivadaAutomatica', {
                detail: { 
                    nivelAnterior: 'tactico',
                    nivelActual: this.nivelActual,
                    zoom: this.mapa.getZoom(),
                    automatico: true
                }
            }));

        } catch (error) {
            console.error('❌ Error desactivando vista 3D automática:', error);
        }
    }
}

// Instancia global
let sistemaZoom;

// Función de inicialización
window.inicializarSistemaZoom = (mapa) => {
    sistemaZoom = new SistemaZoomMultiNivel(mapa);
    window.sistemaZoom = sistemaZoom;
    window.sistemaZoomMultiNivel = sistemaZoom; // Alias para compatibilidad
    return sistemaZoom;
};

// Exportar para uso como módulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SistemaZoomMultiNivel;
}
