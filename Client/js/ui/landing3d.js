// Variables para controlar elementos del DOM
let container;
let hamburgerMenu;
let main;
let sideMenu;
let loginForm;
let crearUsuarioForm;

// Inicializar la landing page cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Inicializando landing page 3D");
    initLandingPage();
    initSmoothScroll();
    
    // Debug adicional para elementos clickeables
    setTimeout(() => {
        debugClickableElements();
    }, 1000);
    
    // Listener global para detectar clicks
    document.addEventListener('click', function(e) {
        console.log("🎯 CLICK DETECTADO EN:", e.target);
        console.log("🎯 ID del elemento:", e.target.id);
        console.log("🎯 Clases del elemento:", e.target.className);
        console.log("🎯 Coordenadas:", e.clientX, e.clientY);
    });
});

// Función principal para inicializar la landing page 3D
function initLandingPage() {
    // Referencias a elementos del DOM
    container = document.querySelector(".container");
    hamburgerMenu = document.querySelector(".hamburger-menu");
    main = document.querySelector(".main");
    sideMenu = document.querySelector(".side-menu");
    loginForm = document.getElementById("loginForm");
    crearUsuarioForm = document.getElementById("crearUsuarioForm");
    
    // Botón de comenzar (acceso directo al login)
    const btnComenzar = document.getElementById("btnComenzar");
    console.log("🔍 DEBUG btnComenzar:", btnComenzar ? "ENCONTRADO" : "NO ENCONTRADO");
    
    if (btnComenzar) {
        console.log("✅ Agregando event listener a btnComenzar");
        btnComenzar.addEventListener("click", (e) => {
            console.log("🎯 CLICK en btnComenzar detectado!");
            e.preventDefault();
            console.log("📋 Container antes:", container?.classList.toString());
            container.classList.add("active");
            console.log("📋 Container después:", container?.classList.toString());
            console.log("🔄 Llamando showLoginForm()");
            showLoginForm();
        });
    } else {
        console.error("❌ btnComenzar no encontrado en el DOM");
    }
    
    // Evento para el menú hamburguesa
    // Modifica la parte del manejo del menú hamburguesa en landing3d.js

// Evento para el menú hamburguesa
if (hamburgerMenu) {
    hamburgerMenu.addEventListener("click", () => {
        // Guardar la posición de scroll actual
        const currentScrollPos = window.pageYOffset;
        
        // Comprobar si estamos en la página principal (landing page)
        const isInLanding = currentScrollPos < 100; // Ajusta este valor según sea necesario
        
        container.classList.toggle("active");
        
        // Si hay formularios visibles, ocultarlos y mostrar menú
        if ((loginForm && loginForm.style.display === "block") || 
            (crearUsuarioForm && crearUsuarioForm.style.display === "block")) {
            if (loginForm) loginForm.style.display = "none";
            if (crearUsuarioForm) crearUsuarioForm.style.display = "none";
            if (sideMenu) sideMenu.style.display = "block";
        }
        
        // Si estamos en la landing page y el menú se está abriendo, asegurar que seguimos viendo la parte correcta
        if (isInLanding && container.classList.contains("active")) {
            // Mantener la vista en la parte superior
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        } else if (!container.classList.contains("active")) {
            // Cuando cerramos el menú, volver a la posición original
            setTimeout(() => {
                window.scrollTo({
                    top: currentScrollPos,
                    behavior: 'auto'
                });
            }, 100);
        }
    });
}
    
    // Evento para clic en el área principal
    if (main) {
        main.addEventListener("click", (e) => {
            // Solo cerramos si se hizo clic directamente en main, no en sus elementos hijos
            if (e.target === main && container.classList.contains("active")) {
                container.classList.remove("active");
            }
        });
    }
    
    // Enlaces del menú lateral
    setupSideMenuLinks();
    
    // Botones para mostrar formularios desde el menú
    const menuBtnLogin = document.getElementById("menuBtnLogin");
    const menuBtnCrearUsuario = document.getElementById("menuBtnCrearUsuario");
    
    if (menuBtnLogin) {
        menuBtnLogin.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    if (menuBtnCrearUsuario) {
        menuBtnCrearUsuario.addEventListener("click", (e) => {
            e.preventDefault();
            showCreateUserForm();
        });
    }
    
    // Cambiar entre formularios
    const switchToLoginBtn = document.getElementById("switchToLoginBtn");
    const switchToCreateBtn = document.getElementById("switchToCreateBtn");
    
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    if (switchToCreateBtn) {
        switchToCreateBtn.addEventListener("click", (e) => {
            e.preventDefault();
            showCreateUserForm();
        });
    }
    
    // Configurar el botón "Conocer más" específicamente
    const btnConocerMas = document.querySelector("a.btn-secondary[href='#sobre-maira']");
    if (btnConocerMas) {
        console.log("Configurando botón 'Conocer más'");
        btnConocerMas.addEventListener("click", function(e) {
            e.preventDefault();
            console.log("Botón 'Conocer más' clickeado");
            
            const targetElement = document.getElementById('sobre-maira');
            if (targetElement) {
                // Directamente usar scrollIntoView que funciona bien
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    }
}

// Función para mostrar el formulario de login
function showLoginForm() {
    console.log("🔄 showLoginForm() ejecutada");
    console.log("📋 Elementos DOM:", {
        sideMenu: sideMenu ? "EXISTE" : "NO EXISTE",
        loginForm: loginForm ? "EXISTE" : "NO EXISTE", 
        crearUsuarioForm: crearUsuarioForm ? "EXISTE" : "NO EXISTE"
    });
    
    if (sideMenu) sideMenu.style.display = "none";
    if (loginForm) loginForm.style.display = "block";
    if (crearUsuarioForm) crearUsuarioForm.style.display = "none";
    
    console.log("✅ showLoginForm() completada");
}

// Función para mostrar el formulario de creación de usuario
function showCreateUserForm() {
    if (sideMenu) sideMenu.style.display = "none";
    if (crearUsuarioForm) crearUsuarioForm.style.display = "block";
    if (loginForm) loginForm.style.display = "none";
}

// Configurar los enlaces del menú lateral
function setupSideMenuLinks() {
    console.log("Configurando enlaces del menú lateral");
    
    const menuLinks = document.querySelectorAll(".side-menu a[href^='#']");
    
    menuLinks.forEach(link => {
        if (!link.id.includes("menuBtn")) { // Excluir botones de login/registro
            link.addEventListener("click", (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute("href");
                console.log(`Enlace de menú clickeado: ${targetId}`);
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    container.classList.remove("active");
                    
                    // Esperar a que se cierre el menú
                    setTimeout(() => {
                        // Usar scrollIntoView directamente
                        targetElement.scrollIntoView({ behavior: "smooth" });
                        
                        // Destacar visualmente la sección
                        targetElement.classList.add('highlighted-section');
                        setTimeout(() => {
                            targetElement.classList.remove('highlighted-section');
                        }, 2000);
                    }, 500);
                }
            });
        }
    });
}

// Implementar desplazamiento suave para todos los enlaces internos
function initSmoothScroll() {
    console.log("Inicializando smooth scroll");
    
    // Verificar que las secciones existen
    console.log("Verificando secciones:");
    ['sobre-maira', 'origen', 'caracteristicas', 'modos', 'aplicaciones', 'estado-actual', 'contacto'].forEach(id => {
        const element = document.getElementById(id);
        console.log(`- Sección #${id}: ${element ? 'EXISTE' : 'NO EXISTE'}`);
    });
    
    // Enlaces normales (no del menú lateral)
    const allLinks = document.querySelectorAll("a[href^='#']:not(.side-menu a):not(#btnComenzar):not(#menuBtnLogin):not(#menuBtnCrearUsuario):not(#switchToLoginBtn):not(#switchToCreateBtn)");
    
    allLinks.forEach(link => {
        if (link.getAttribute("href") !== "#" && !link.classList.contains("btn-secondary")) {
            link.addEventListener("click", function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute("href");
                console.log(`Enlace normal clickeado: ${targetId}`);
                
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Directamente usar scrollIntoView
                    targetElement.scrollIntoView({ behavior: "smooth" });
                    
                    // Destacar visualmente la sección
                    targetElement.classList.add('highlighted-section');
                    setTimeout(() => {
                        targetElement.classList.remove('highlighted-section');
                    }, 2000);
                }
            });
        }
    });
    
    // También manejar los enlaces de footer si existen
    const footerLinks = document.querySelectorAll(".footer-links a[href^='#']");
    footerLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute("href");
            console.log(`Enlace de footer clickeado: ${targetId}`);
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Directamente usar scrollIntoView
                targetElement.scrollIntoView({ behavior: "smooth" });
                
                // Destacar visualmente la sección
                targetElement.classList.add('highlighted-section');
                setTimeout(() => {
                    targetElement.classList.remove('highlighted-section');
                }, 2000);
            }
        });
    });
}

// Efecto de transición después de login/registro exitoso
function mostrarSeleccionModo() {
    // Ocultar el contenedor con animación fade-out
    container.classList.add("fade-out");
    
    // Mostrar pantalla de selección de modo después de un breve retraso
    setTimeout(() => {
        container.style.display = "none";
        
        const seleccionModo = document.getElementById("seleccionModo");
        if (seleccionModo) {
            seleccionModo.style.display = "flex";
        }
    }, 500);
}

// Función de debug para elementos clickeables
function debugClickableElements() {
    console.log("🔍 === DEBUG DE ELEMENTOS CLICKEABLES ===");
    
    // Verificar botón Comenzar
    const btnComenzar = document.getElementById("btnComenzar");
    console.log("🔍 btnComenzar:", btnComenzar);
    if (btnComenzar) {
        const computedStyle = window.getComputedStyle(btnComenzar);
        console.log("📊 btnComenzar styles:", {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            pointerEvents: computedStyle.pointerEvents,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            position: computedStyle.position
        });
        
        const rect = btnComenzar.getBoundingClientRect();
        console.log("📊 btnComenzar rect:", rect);
        
        // Verificar si hay elementos superpuestos
        const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
        console.log("🎯 Elemento en el centro del botón:", elementAtPoint);
        console.log("🔍 ¿Es el mismo botón?", elementAtPoint === btnComenzar);
    }
    
    // Verificar hamburger menu
    const hamburgerMenu = document.querySelector(".hamburger-menu");
    console.log("🍔 hamburgerMenu:", hamburgerMenu);
    if (hamburgerMenu) {
        const computedStyle = window.getComputedStyle(hamburgerMenu);
        console.log("📊 hamburgerMenu styles:", {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            pointerEvents: computedStyle.pointerEvents,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            position: computedStyle.position
        });
        
        const rect = hamburgerMenu.getBoundingClientRect();
        console.log("📊 hamburgerMenu rect:", rect);
        
        const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
        console.log("🎯 Elemento en el centro del hamburger:", elementAtPoint);
        console.log("🔍 ¿Es el mismo hamburger?", elementAtPoint === hamburgerMenu);
    }
    
    // Verificar barra (.bar)
    const bar = document.querySelector(".bar");
    console.log("📐 bar:", bar);
    if (bar) {
        const computedStyle = window.getComputedStyle(bar);
        console.log("📊 bar styles:", {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            pointerEvents: computedStyle.pointerEvents,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            position: computedStyle.position
        });
    }
    
    console.log("🔍 === FIN DEBUG ===");
}


// Exponer la función para que pueda ser utilizada desde validacion.js
window.mostrarSeleccionModo = mostrarSeleccionModo;