
en juego de guerra:

bueno estoy viendo que un puntito azul al lado del manejo de zoom me deja ver en 3d un area muy extensa, ,sin importar el nivel de zoom del usuario.. (y creo que no toma los datos reales de elevacion del terreno)

y si hago scrol llego a un nivel de zoom que me abre una vista 3d diferente a esta.. (que no funciona bien)

en planeamiento: me muestra una vista 3d sin mapa solo una grilla (deberia ser como lo es en juego de guerra con el puntito azul.. pero con el boton de vista 3d del menu herramientas o, ,en su defecto con el scroll preguntando si desea o no abrir la vista 3d.. ) aca marca eeror por que espera elementos a renderizar y no lo hemos implementado.

en ambos casos me aparece un panel para la elevacion y para la calidad (que supongo que seran la cantidad de puntos de muestreo) ver o no la grid, etc.. 

en ninguno de los casos tengo una cruz para poder cerrar el modo 3d. 


por otro lado bien aparece el control de determinar sector, o marcar sector, me aparece "haga click en el mapa para marcar el sector" o similar... pero no me toma los clicks.. debe estar tomando que estoy haciendo click en los hexagonos y no en el mapa.. (esto funcionaba bien asi que hay que recuperar esa funcionalidad, tanto para sector como para zona. )

aun no me deja marcar hexagono,, eso activaba una demarcacion del hexagono en otro color (de hecho el color original del hexagono era en negro no en celeste..) y lo marcaba en un color medio flourecente.. eso me sirve para marcarle a alguien de mi equipo algo que yo estoy viendo y el no por distancia. tanto en local como en online. 

los simbolos de los menu se ven correctamente, no asi en planeamiento.html

en iniciarpartida.html:

la creacion de partidas online sigue sin funcionar.

no se actualizan las listas de partidas disponibles, jugadores conectados, etc

el chat no inicia, o inicia pero el socket no esta correctamenteconectado a la sala y no manda mensaje (esto si funciona en inicioGB habria que compararlo, aun asi parece activarse para la sala de la operacion una vez unido a la sala de espera, y luego dentro del juego funciona bien,, pero no asi en la sala general de inicioGB)

en inicioGB.html:

no se actualiza la lista de operaciones activas. 

basicamente la mayoria de los problemas son salvables facilmente. 


Tareas:

corregir estos errores.
comparar conexion de sockets y implementacion de chat en diferentes modos.
controlar los endpoints
solucionar el problema de los models y comprobar que cargue de SIDC a model en la vista 3d y a escala dependiendo la escala del mapa representado y su posicion en coordenadas. 
implementar el sistema de ordenes para los models (tal cual lo hacemos con los elementos) (esto aun no lo pudimos probar en los elementos normales por que no puedo delimitar sectores zonas, desplegar, ,e iniciar combate para comprobarlo)
solucionar pobremas de togle en el menu principal en GB (que es el mismo de planeamiento pero algo interfiere en el toggle y se cierran los menu cuando uni quiere clickear dentro de los mismos)
controlar los workers.
implementar mejoras en un autoinstall de detector de gestos. lo actual no sirve para un usuario promedio que no sabe como instalarlo. debe ser un intalador bat y un intslados sh para los diferentes sistemas operativos y que haga todo solo lo instale con acceso directo en el escritorio del usuario y se pueda activad desde ahi o desde maira. 

TODO ESTO FUE COMPROBADO SEGUN EL ULTIMO COMIT ACTIVO EN RENDER.

2e527ef
✅ Panel Inferior Unificado completado - Estilo Total War - Panel dinámico por fases (preparación→despliegue→combate) - Menu radial TypeError corregido (miradial.js) - Botones estáticos eliminados (pausa/x2 obsoletos) - Integración con gestores reales (tiempo real) - Elementos jugador dinámicos (solo fases apropiadas) - Limpieza paneles obsoletos y duplicados - Minimapa sin controles duplicados - Sistema eventos para sincronización automática - Archivos grandes agregados a .gitignore



cual de estos es el que me da el mapa que yo quiero ver?

  <!-- 🎮 GESTOR VISTA 3D UNIFICADO -->
  <script src="js/modules/shared/vista3DManager.js"></script>
  
  <!-- 🗺️ SERVICIO 3D CRÍTICO -->
  <script src="js/services/threeDMapService.js"></script>


  podemos integrar los simbolos al que me esta mostrando el mapa correctamente?

  debemos integrar las tif para realismo con una determinada catidad de puntos segun la superficie a cubrir (eso si seria modo dios)

  y de las tif de vegetacion de los mismos puntos el tipo de vegetacion para implementar los models de vegetacion que tenemos, y poder darle mas realismo (sin que la pc explote)


organiza equipos de trabajo con los subagentes, asigna las tareas y dales un tiempo dentro de las proximas 4 horas o 5.. 





### 🚀 Mejoras y Correcciones en el Sistema de Vehículos y Modelos 3D


 Detectado servicio en la nube: usando configuración optimizada
 URLs configuradas: Object
 milsymbol.js 2.0.0 - Copyright (c) 2018 Måns Beckman  http://www.spatialillusions.com
 Scripts "build/three.js" and "build/three.min.js" are deprecated with r150+, and will be removed with r160. Please use ES Modules or alternatives: https://threejs.org/docs/index.html#manual/en/introduction/Installation
(anónimo) @ three.min.js:1
 ✅ GLTFLoader completo registrado globalmente
 ✅ Sistema 3D modular cargado v2.1 - Ruta GLB corregida a /Client/assets/models/
 ✅ Sistema de Paneles modular cargado
 ✅ Sistema de Planeamiento modular cargado
 ✅ OrbitControls (versión navegador) cargado correctamente
 Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead. Error
    at et.extend (https://maira-4-0.onrender.com/node_modules/leaflet/dist/leaflet.js:5:3233)
    at https://maira-4-0.onrender.com/Libs/leaflet-pattern/dist/leaflet.pattern.js:6:34
    at https://maira-4-0.onrender.com/Libs/leaflet-pattern/dist/leaflet.pattern.js:6:7077
(anónimo) @ leaflet.js:5
 🔄 Intentando cargar master_mini_tiles_index.json...
 📡 Intentando cargar desde: https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/master_mini_tiles_index.json
 🚀 Inicializando terrainAdapter (ejecución inmediata)
 ⏳ DOM aún cargando, esperando...
 ✅ MAIRAServicesManager registrado globalmente
 ✅ TransitabilityService registrado en MAIRA.Services.Transitability
 ✅ SlopeAnalysisService registrado en MAIRA.Services.SlopeAnalysis
 ✅ ElevationProfileService inicializado
 ✅ ElevationProfileService cargado y funciones exportadas al scope global
 ✅ ThreeDMapService registrado en MAIRA.Services.ThreeDMap
 ✅ Función toggleVista3D disponible globalmente
 🔄 Cargando master_mini_tiles_index.json desde archivos locales...
 📡 Intentando cargar desde: /api/proxy/github/master_mini_tiles_index.json
 🌿 Intentando cargar índice de vegetación desde: https://maira-4-0.onrender.com/static/tiles/data_argentina/vegetation_master_index.json
 🌿 VegetationHandler inicializado automáticamente
 ✅ GeometryUtils inicializado con Leaflet
 ✅ GeometryUtils con Leaflet cargado y funciones exportadas al scope global
 📱 Dispositivo móvil detectado: false
 📐 Orientación: landscape
 💻 Dispositivo de escritorio, optimizaciones móviles deshabilitadas
 ✅ MobileOptimizationHandler inicializado
 ✅ MobileOptimizationHandler cargado y función exportada al scope global
 ✅ MapInteractionHandler inicializado con Leaflet
 ✅ MapInteractionHandler cargado y funciones exportadas al scope global
 ✅ MeasurementHandler con Leaflet cargado y funciones exportadas al scope global
 ✅ Funciones de edición de líneas restauradas: hacerLineaEditable, deshabilitarEdicionLinea, convertirAPolyline
 ✅ MeasurementHandler cargado - Funciones exportadas al scope global - Menú contextual implementado
 🚀 PerformanceOptimizer inicializado
 🚀 PerformanceOptimizer cargado y funciones exportadas al scope global
 🔔 EventBus inicializado
 📡 EventBus cargado y funciones exportadas al scope global
 📐 PendienteHandler inicializado
 📐 PendienteHandler cargado y funciones exportadas al scope global
 🚗 TransitabilidadHandler inicializado
 🚗 TransitabilidadHandler cargado y funciones exportadas al scope global
 ✅ SearchHandler inicializado
 ✅ SearchHandler cargado - initializeBuscarLugar disponible globalmente
 ℹ️ Auto-inicialización desactivada - usar initializeBuscarLugar() manualmente si es necesario
 ✅ TestHandler inicializado
 ✅ TestHandler cargado - ejecutarTestPlaneamiento disponible globalmente
 🔍 DetectorZoom3D no disponible aún - se inicializará automáticamente
 🔍 Calcos inicializados correctamente
 🔄 herramientasP.js REFACTORIZADO
 📦 Funcionalidad distribuida en 6 módulos especializados
 ✅ UserIdentity stub inicializado
 ✅ MAIRA.Utils stub inicializado
 ✅ herramientasP.js stub cargado - funcionalidad en módulos especializados
 ✅ interpolarPuntosRuta restaurada para CalculoMarcha.js
 ✅ ToolsInitializer creado
 ✅ ToolsInitializer cargado - auto-inicialización programada
 MAIRA Atajos inicializado para macOS - 27 atajos disponibles
 🚀 Inicializando indexP (ejecución inmediata)
 ⏳ DOM aún cargando, esperando...
 🧪 Test de Planeamiento - Modo desarrollo
 🤖 Auto-test - Sistema de testing automático
 Auto-test system initialized
 👁️ Visualizador de Tests - UI para testing
 ⚠️ Socket.IO no disponible
(anónimo) @ planeamiento.html:979
 🔧 Service Worker deshabilitado temporalmente
 ✅ PerformanceOptimizer inicializado correctamente
 📐 Usando cálculo directo de pendientes (sin worker)
 ✅ PendienteHandler inicializado correctamente
 ✅ TransitabilidadHandler inicializado correctamente
 🔍 DOM cargado, auto-inicializando SearchHandler...
 DOM completamente cargado. Iniciando configuración del mapa...
 🎮 Integrando funcionalidades 3D en mapa base...
 ⚠️ Clases 3D no disponibles - funcionalidades limitadas
inicializarFuncionalidades3D @ mapaP.js:558
 📱 Desactivando vista 3D automática por cambio de nivel...
 🔍 Zoom nivel cambiado: estrategico → operacional (zoom: 10)
 🔍 Sistema Zoom Multi-Nivel inicializado con modelos 3D (Total War Style)
 🔍 Sistema Zoom Multi-Nivel inicializado
 ⚠️ Elementos de prueba deshabilitados - Juego iniciará limpio
 Mapa inicializado correctamente
 Consolidando event listeners del mapa...
 ✅ Event listener configurado: opacitySlider -> input
 ✅ Event listener configurado: colorSelector -> input
 ✅ Event listener configurado: gridWidthSlider -> input
 ✅ Event listener configurado: coordenadasCheckbox -> change
 Event listeners consolidados correctamente
 Configuración del mapa completada
 Inicializando funcionalidades de calcos
 Inicializando funcionalidades de símbolos
 🚀 Inicializando herramientas refactorizadas...
 Panel inicializado
 🎯 PlaneamientoManager inicializado
 🎯 Inicializando módulo de Planeamiento
 ⚠️ Socket no disponible - trabajando en modo local
configurarSocket @ planeamiento.js:28
 ✅ Cargados 0 elementos
 DOM completamente cargado y parseado
 Índice de tiles cargado correctamente, inicializando elevación.
 Inicializando datos de elevación con bounds: Object
 Esperando a que el índice de tiles se cargue.
cargarDatosElevacion @ elevationHandler.js:153
 DOM completamente cargado y parseado
 📦 indexP.js - Inicialización de mapa delegada a mapaP.js
 Inicializando controles...
 🎯 Inicializando MiRadial en planeamiento...
 🎯 MiRadial.inicializar llamado con: e planeamiento
 Cambiando fase a: preparacion
 MiRadial inicializado
 ✅ MiRadial inicializado correctamente
 Controles inicializados con éxito
 🔍 Inicializando búsqueda de lugares...
 🔍 Usando búsqueda básica con elementos HTML existentes
 🔍 Inicializando búsqueda básica...
 ✅ Elementos HTML de búsqueda encontrados
 ✅ Búsqueda básica inicializada con auto-activación
 Test visualizer initialized
 🚀 MAIRA 4.0 - Inicialización modular
planeamiento.html:1 Access to fetch at 'https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/master_mini_tiles_index.json' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/master_mini_tiles_index.json:1  Failed to load resource: net::ERR_FAILED
 ⚠️ Error cargando desde https://github.com/Ehr051/MAIRA-4.0/releases/download/v4.0/master_mini_tiles_index.json: Failed to fetch
(anónimo) @ terrainAdapter.js:106
 📡 Intentando cargar desde: https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json
 ⚠️ Error cargando desde https://maira-4-0.onrender.com/static/tiles/data_argentina/vegetation_master_index.json: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
loadVegetationIndex @ vegetacionhandler.js:55
 🌿 Intentando cargar índice de vegetación desde: Client/Libs/datos_argentina/Vegetacion_Mini_Tiles/vegetation_master_index.json
 🎯 Índice cargado exitosamente desde: /api/proxy/github/master_mini_tiles_index.json
 ✅ Formato mini-tiles detectado
 Índice de tiles cargado correctamente.
 ✅ MAIRA.Elevacion inicializado
 ✅ MAIRA.Elevacion inicializado
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.050, lng:-58.350
 📡 Cargando índice provincial desde: Client/Libs/datos_argentina/Altimetria_Mini_Tiles/centro_norte/centro_norte_mini_tiles_index.json
 No se encontró el menú MCC para añadir opciones de puntos
(anónimo) @ simbolosP.js:675
 ⚠️ FPS crítico detectado: 12
measureFPS @ performanceOptimizer.js:385
 🔧 Ejecutando optimización automática por FPS crítico
 ⚠️ elevationHandler.clearCache no disponible
limpiarCaches @ performanceOptimizer.js:481
 🧹 Cache de vegetación limpiado
 🗑️ Cache de transitabilidad limpiado
 🗑️ Cache de pendientes limpiado
 🗑️ Caches limpiados
 💾 Memoria optimizada
 🎨 Calidad visual reducida temporalmente
 ✅ Optimización automática completada
 🎯 Símbolos militares PI/PT listos para usar en gráficos
 🎯 Inicializando Sistema de Planeamiento...
 ✅ Sistema de Planeamiento inicializado
 ✅ Sistema de Planeamiento inicializado
 ✅ Sistema 3D disponible
 ✅ Eventos de planeamiento configurados
 📊 Funciones heredadas: 5/5
 🔍 Verificando funciones críticas:
   - editarElementoSeleccionado: function
   - mostrarMenuContextual: function
   - seleccionarElemento: function
   - Mapa inicializado correctamente
planeamiento.html:1 Access to fetch at 'https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json:1  Failed to load resource: net::ERR_FAILED
 ⚠️ Error cargando desde https://github.com/Ehr051/MAIRA/releases/download/tiles-v3.0/master_mini_tiles_index.json: Failed to fetch
(anónimo) @ terrainAdapter.js:106
 📡 Intentando cargar desde: /api/proxy/github/master_mini_tiles_index.json
 ✅ Índice provincial centro_norte cargado: 1653 tiles
 ❌ No se encontró tile en provincia centro_norte para bounds: Object
 ❌ No se encontró tile para bounds: Object
 No se encontró un tile correspondiente a la región especificada.
cargarDatosElevacion @ elevationHandler.js:167
 Los datos de elevación no se pudieron cargar o no están disponibles.
inicializarDatosElevacion @ elevationHandler.js:633
 Datos de elevación cargados
 📦 indexP.js - Inicialización de mapa delegada a mapaP.js
 Inicializando controles...
 🎯 Inicializando MiRadial en planeamiento...
 🎯 MiRadial.inicializar llamado con: e planeamiento
 Cambiando fase a: preparacion
 MiRadial inicializado
 ✅ MiRadial inicializado correctamente
 Controles inicializados con éxito
 🔍 Inicializando búsqueda de lugares...
 🔍 Usando búsqueda básica con elementos HTML existentes
 🔍 Inicializando búsqueda básica...
 ✅ Elementos HTML de búsqueda encontrados
 ✅ Búsqueda básica inicializada con auto-activación
 ✅ Índice de vegetación cargado desde: archivos locales
 🎯 Índice cargado exitosamente desde: /api/proxy/github/master_mini_tiles_index.json
 ✅ Formato mini-tiles detectado
 Índice de tiles cargado correctamente.
 El objeto map no es una instancia válida de Leaflet: 
init @ miradial.js:230
 ✅ Menú radial inicializado
 ✅ Funciones de herramientas cargadas (7/7): Array(7)
 🔗 Inicializando event listeners...
 ✅ Event listeners de medición disponibles
 ✅ Event listeners de selección disponibles
 ✅ Event listeners inicializados
 🔄 Configurando interacciones entre módulos...
 ✅ Interacciones de perfil de elevación disponibles
 ✅ ElevationHandler disponible para integración
 ✅ Interacciones configuradas
 🔍 Verificando funcionalidad...
 ✅ Funciones disponibles (7/7): Array(7)
 ✅ Funciones activas (5/5): Array(5)
 ✅ Handlers de terreno activos (2/2): Array(2)
 📱 Info del dispositivo: false
 ✅ Herramientas refactorizadas inicializadas correctamente
 🗂️ Paneles de propiedades cerrados
 🔧 Intentando alternar menú: herramientas-menu
 ✅ Menú 'herramientas-menu' mostrado
 🔧 Intentando alternar menú: herramientas-menu
 ✅ Menú 'herramientas-menu' ocultado
 🗂️ Paneles de propiedades cerrados
 ⚠️ PROBLEMA: Menú 'herramientas-menu' se cerró automáticamente después de 100ms
(anónimo) @ indexP.js:241
 Panel inicializado
 Panel inicializado
 🗂️ Paneles de propiedades cerrados
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1381/2465.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5436.200000047684ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1381/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5452.400000095367ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1380/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5453.399999976158ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1381/2466.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5472.5ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1383/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5932.800000071526ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1380/2467.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5934.299999952316ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1379/2466.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5934.399999976158ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1380/2466.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (5936ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1382/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6244.5ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1379/2465.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6245.100000023842ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1379/2467.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6263.799999952316ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1378/2466.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6279ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1379/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6551.600000023842ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1378/2467.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6560.5ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1378/2465.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6581.300000071526ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1378/2468.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6597.5ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 ⚠️ Recurso lento detectado: https://tile.thunderforest.com/landscape/12/1380/2465.png?apikey=c06b957582f643f99c630ec8e3fe7ff0 (6599.100000023842ms)
detectarProblemasRendimiento @ performanceOptimizer.js:340
 🎯 Iniciando medición de distancia con marcadores de PI y PT para MARCHA
 🎖️ Modo marcha activado para inserción automática de PI/PT
 🎖️ Configurando event listeners especiales para modo marcha
 📏 Usando sistema de medición global EN MODO MARCHA
 🔄 Iniciando medición con Leaflet
 🔧 Creando nueva línea de medición compatible con marcha...
 🗂️ Paneles de propiedades cerrados
 🎖️ Modo marcha activo - punto 0 agregado
 🔄 Línea actualizada: 0.00m
 📍 Punto agregado (PI) - Distancia: 0.00m
 🎖️ Creando símbolo PI en primer punto de marcha
 🎖️ Creando símbolo militar PI en coordenadas: v
 ✅ Punto de control PI agregado automáticamente a la lista
 ✅ Símbolo PI creado correctamente
 🗂️ Paneles de propiedades cerrados
 🎖️ Modo marcha activo - punto 1 agregado
 🔄 Línea actualizada: 1871.11m
 📍 Punto agregado  - Distancia: 1871.11m
 🗂️ Paneles de propiedades cerrados
 🎖️ Modo marcha activo - punto 2 agregado
 🔄 Línea actualizada: 4206.37m
 📍 Punto agregado  - Distancia: 4206.37m
 🗂️ Paneles de propiedades cerrados
 🎖️ Modo marcha activo - punto 3 agregado
 🔄 Línea actualizada: 6372.51m
 📍 Punto agregado  - Distancia: 6372.51m
 🗂️ Paneles de propiedades cerrados
 🎖️ Modo marcha activo - punto 4 agregado
 🔄 Línea actualizada: 6372.51m
 📍 Punto agregado  - Distancia: 6372.51m
 🗂️ Paneles de propiedades cerrados
 [MiRadial] Elemento encontrado: e distancia: 0
 [MiRadial] Mostrando menú para tipo: marcadorGenerico, modo: planeamiento
 4. MiRadial.mostrarMenu llamado: Object
 [MiRadial] Elemento encontrado: e distancia: 0
 [MiRadial] Mostrando menú para tipo: marcadorGenerico, modo: planeamiento
 4. MiRadial.mostrarMenu llamado: Object
 🎖️ Creando símbolo PT en último punto de marcha
 🎖️ Creando símbolo militar PT en coordenadas: v
 ✅ Punto de control PT agregado automáticamente a la lista
 ✅ Símbolo PT creado correctamente
 ✅ Medición finalizada: 6372.51 metros
 🔄 Línea actualizada: 6372.51m
 🎖️ Modo marcha finalizado
 Modo para agregar punto de control activado
 🗂️ Paneles de propiedades cerrados
 🗂️ Paneles de propiedades cerrados
 🗂️ Paneles de propiedades cerrados
 Modo para agregar punto de control activado
 🗂️ Paneles de propiedades cerrados
 🗂️ Paneles de propiedades cerrados
 Click en btnCalcularMarcha
 🔍 Estado de líneas: Object
 🔍 Elemento seleccionado: e
 📍 Seleccionando línea para cálculo: Línea 1
 🎯 Seleccionando elemento: e
 💾 Estilo original guardado: Object
 🎨 Estilo de selección aplicado - Color: blue, Peso: 5
 ✅ Elemento seleccionado correctamente
 🔧 No hay series configuradas, creando serie por defecto
 🔄 Interpolando ruta con 5 puntos base
 ✅ Ruta interpolada: 41 puntos totales
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.503, lng:-58.618
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436975_199787.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436975_199787.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.505, lng:-58.618
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436973_199781.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436973_199781.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.507, lng:-58.619
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436971_199775.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436971_199775.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.508, lng:-58.620
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436969_199770.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436969_199770.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.510, lng:-58.620
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436967_199764.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436967_199764.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.512, lng:-58.621
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436965_199758.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436965_199758.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.513, lng:-58.621
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436962_199752.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436962_199752.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.515, lng:-58.622
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436960_199746.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436960_199746.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.516, lng:-58.623
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436958_199741.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436958_199741.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.518, lng:-58.623
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436956_199735.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436956_199735.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.520, lng:-58.624
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436954_199729.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436954_199729.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.521, lng:-58.626
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436948_199724.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436948_199724.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.523, lng:-58.627
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436941_199718.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436941_199718.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.524, lng:-58.629
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436935_199713.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436935_199713.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.526, lng:-58.631
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436928_199707.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436928_199707.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.527, lng:-58.633
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436922_199702.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436922_199702.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.529, lng:-58.634
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436915_199697.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436915_199697.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.530, lng:-58.636
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436909_199691.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436909_199691.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.532, lng:-58.638
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436903_199686.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436903_199686.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.533, lng:-58.640
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436896_199680.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436896_199680.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.535, lng:-58.642
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436890_199675.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436890_199675.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.536, lng:-58.643
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436883_199671.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436883_199671.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.537, lng:-58.645
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436877_199666.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436877_199666.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.538, lng:-58.647
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436870_199662.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436870_199662.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.540, lng:-58.649
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436864_199657.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436864_199657.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.541, lng:-58.651
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1065
 🎯 Extrayendo vegetation_ndvi_436857_199653.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436857_199653.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.542, lng:-58.653
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436850_199648.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436850_199648.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.543, lng:-58.654
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436844_199644.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436844_199644.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.545, lng:-58.656
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436837_199639.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436837_199639.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.546, lng:-58.658
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436831_199635.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436831_199635.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🌍 Buscando en provincia: centro_norte para coordenadas lat:-34.547, lng:-58.660
 🎯 Tile encontrado en centro_norte: centro_norte_tile_1122
 🎯 Extrayendo vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📦 Extrayendo vegetación vegetation_ndvi_436824_199630.tif de GitHub Release v4.0
 📡 Descargando desde: https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1065.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1065.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Tile en formato mini-tiles: centro_norte_tile_1122.tif (provincia: centro_norte)
 🎯 ESTRATEGIA DOBLE: 1) .tif directo, 2) tar.gz (como v3.0)
 📦 Intentando cargar centro_norte_tile_1122.tif directo desde Release v4.0
 📡 Cargando .tif directo: /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🗂️ Paneles de propiedades cerrados
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436962_199752.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436941_199718.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
api/proxy/github/centro_norte/centro_norte_tile_1122.tif:1  Failed to load resource: the server responded with a status of 404 ()
 ⚠️ .tif directo falló (404): /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🔄 Fallback a tar.gz para centro_norte_tile_1122.tif
 📦 Extrayendo centro_norte_tile_1122.tif de GitHub Release v4.0
 📡 Descargando desde: /api/proxy/github/maira_altimetria_tiles.tar.gz
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436956_199735.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
api/proxy/github/centro_norte/centro_norte_tile_1065.tif:1  Failed to load resource: the server responded with a status of 404 ()
 ⚠️ .tif directo falló (404): /api/proxy/github/centro_norte/centro_norte_tile_1065.tif
 🔄 Fallback a tar.gz para centro_norte_tile_1065.tif
 📦 Extrayendo centro_norte_tile_1065.tif de GitHub Release v4.0
 📡 Descargando desde: /api/proxy/github/maira_altimetria_tiles.tar.gz
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436958_199741.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
api/proxy/github/centro_norte/centro_norte_tile_1122.tif:1  Failed to load resource: the server responded with a status of 404 ()
 ⚠️ .tif directo falló (404): /api/proxy/github/centro_norte/centro_norte_tile_1122.tif
 🔄 Fallback a tar.gz para centro_norte_tile_1122.tif
 📦 Extrayendo centro_norte_tile_1122.tif de GitHub Release v4.0
 📡 Descargando desde: /api/proxy/github/maira_altimetria_tiles.tar.gz
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436967_199764.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436948_199724.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436915_199697.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436954_199729.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436965_199758.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436883_199671.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436971_199775.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436922_199702.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436975_199787.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436864_199657.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436960_199746.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436850_199648.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436837_199639.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436877_199666.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436857_199653.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436896_199680.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436969_199770.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436903_199686.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436890_199675.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
 ❌ Error extrayendo vegetación vegetation_ndvi_436935_199713.tif: 
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
 ❌ Error en fetchNDVIData: 
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436973_199781.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 1)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436928_199707.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 14)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436909_199691.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 17)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 32)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 34)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436844_199644.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 27)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 39)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 30)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 35)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 40)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 36)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 38)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 37)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436824_199630.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 33)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436831_199635.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 29)
fetchNDVIData @ vegetacionhandler.js:118
planeamiento.html#:1 Access to fetch at 'https://github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz' from origin 'https://maira-4-0.onrender.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
github.com/Ehr051/MAIRA_4.0/releases/download/v4.0/maira_vegetacion_tiles.tar.gz:1  Failed to load resource: net::ERR_FAILED
vegetacionhandler.js:472 ❌ Error extrayendo vegetación vegetation_ndvi_436870_199662.tif: TypeError: Failed to fetch
    at window.fetch (performanceOptimizer.js:282:20)
    at VegetacionHandler.extractVegetationTileFromManifestTarGz (vegetacionhandler.js:452:36)
    at VegetacionHandler.loadTile (vegetacionhandler.js:179:45)
    at VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:41)
    at VegetacionHandler.getNDVI (vegetacionhandler.js:78:37)
    at VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:33)
    at CalculoMarcha.js:180:65
    at Array.map (<anonymous>)
    at CalculoMarchaController.inicializarDatos (CalculoMarcha.js:176:43)
    at CalculoMarcha.js:894:22
extractVegetationTileFromManifestTarGz @ vegetacionhandler.js:472
vegetacionhandler.js:118 ❌ Error en fetchNDVIData: ReferenceError: VEGETATION_FALLBACK_URLS is not defined
    at VegetacionHandler.loadTile (vegetacionhandler.js:201:16)
    at async VegetacionHandler.fetchNDVIData (vegetacionhandler.js:108:30)
    at async VegetacionHandler.getNDVI (vegetacionhandler.js:78:26)
    at async VegetacionHandler.getVegetationInfo (vegetacionhandler.js:265:22)
    at async Promise.all (index 1)
    at async Promise.all (index 23)
fetchNDVIData @ vegetacionhandler.js:118
performanceOptimizer.js:385 ⚠️ FPS crítico detectado: 14
measureFPS @ performanceOptimizer.js:385
performanceOptimizer.js:587 🔧 Ejecutando optimización automática por FPS crítico
performanceOptimizer.js:481 ⚠️ elevationHandler.clearCache no disponible
limpiarCaches @ performanceOptimizer.js:481
optimizarAutomaticamente @ performanceOptimizer.js:591
measureFPS @ performanceOptimizer.js:388
vegetacionhandler.js:341 🧹 Cache de vegetación limpiado
transitabilidadHandler.js:321 🗑️ Cache de transitabilidad limpiado
pendienteHandler.js:345 🗑️ Cache de pendientes limpiado
performanceOptimizer.js:499 🗑️ Caches limpiados
performanceOptimizer.js:619 💾 Memoria optimizada
performanceOptimizer.js:680 🎨 Calidad visual reducida temporalmente
performanceOptimizer.js:599 ✅ Optimización automática completada
performanceOptimizer.js:358 ⚠️ Uso de memoria alto: {used: '120.73MB', total: '125.86MB', limit: '4095.75MB'}
(anónimo) @ performanceOptimizer.js:358
performanceOptimizer.js:358 ⚠️ Uso de memoria alto: {used: '120.90MB', total: '126.38MB', limit: '4095.75MB'}
(anónimo) @ performanceOptimizer.js:358


aun esta buscando las tiles en release.. pero render ya las tiene en el server

📁 Directorio tiles configurado: /opt/render/project/src/static/tiles/data_argentina
🗂️ Configurando directorio estático para tiles...

eso es lo que dice el log... dame un scrip que pueda usar en el navegador para comprobar la obtencion desde esa direccion.

en medirdistancia me esta poniendo los PI y PT eso es exclusivo de calcilo de marcha (y encima lo esta pomniendo mal,, busca como estan configurados PI, PT, PE, PD, en simbolosP.js si no me equiboco... por que tienen una correccion en altura y direccion)

sigo teniendo llamadas a menucontextual en lugar de menuradial.
