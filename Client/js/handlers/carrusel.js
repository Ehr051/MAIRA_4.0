// Carrusel tipo coverflow para selección de modos
document.addEventListener('DOMContentLoaded', function() {
    // Al principio de document.addEventListener('DOMContentLoaded', function() {
    // Verificar si hay una sesión activa y mostrar directamente la selección de modos
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Ocultar el contenido principal
        const container = document.querySelector('.container');
        if (container) {
            container.style.display = 'none';
        }
        
        // Asegurarse de que la pantalla de selección de modo esté visible
        const seleccionModo = document.getElementById('seleccionModo');
        if (seleccionModo) {
            seleccionModo.style.display = 'flex';
    }
}
// Inicializar carrusel de la página principal
    initHeaderCarousel();
    
    // Configuración de modos
    const modos = [
        {
            id: 'planeamiento',
            nombre: 'Modo Planeamiento',
            icono: 'planning-icon.png',
            descripcion: 'Planifica operaciones, crea calcos y elementos en el mapa con libertad total.',
            url: 'planeamiento.html'
        },
        {
            id: 'juego-guerra',
            nombre: 'Simulador de Combate',
            icono: 'wargame-icon.png',
            descripcion: 'Simula combates por turnos con unidades que responden a la topografía y condiciones del terreno.',
            url: 'iniciarpartida.html'
        },
        {
            id: 'gestion-batalla',
            nombre: 'Gestión de Batalla',
            icono: 'battle-management-icon.png',
            descripcion: 'Administra recursos, unidades y comunica órdenes en tiempo real durante operaciones.',
            url: 'inicioGB.html'
        },
        {
            id: 'Cuadro de organizacion',
            nombre: 'Cuadro de organizacion',
            icono: 'CO.png',
            descripcion: 'Diseña Cuadros de organizacion de elementos militares.',
            url: 'CO.html'
        }
    ];

    // Esperar a que el div de selección de modo esté visible
    const checkForSeleccionModo = setInterval(function() {
        const seleccionModoDiv = document.getElementById('seleccionModo');
        
        if (seleccionModoDiv && seleccionModoDiv.style.display !== 'none') {
            clearInterval(checkForSeleccionModo);
            initCoverflowCarousel(seleccionModoDiv);
        }
    }, 500);
    
    // Función para inicializar el carrusel en la cabecera
    function initHeaderCarousel() {
        const carouselContainer = document.querySelector('header .carousel');
        if (!carouselContainer) return; // Si no existe, salir
        
        // Rutas a las imágenes (ajusta estas rutas a tus imágenes reales)
        const fallbackImages = [
            "https://via.placeholder.com/1920x1080/102030/0281a8?text=MAIRA+Tactical+Planning",
            "https://via.placeholder.com/1920x1080/102030/0281a8?text=MAIRA+Simulation",
            "https://via.placeholder.com/1920x1080/102030/0281a8?text=MAIRA+Training"
        ];
        
        // Limpiar el contenedor
        carouselContainer.innerHTML = '';
        
        // Crear elementos del carrusel
        fallbackImages.forEach((src, index) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            if (index === 0) slide.classList.add('active');
            
            const img = document.createElement('img');
            img.src = src;
            img.alt = `MAIRA Background ${index + 1}`;
            
            slide.appendChild(img);
            carouselContainer.appendChild(slide);
        });
        
        // Iniciar rotación automática
        let currentSlide = 0;
        setInterval(() => {
            const slides = carouselContainer.querySelectorAll('.carousel-slide');
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }

    function initCoverflowCarousel(container) {
        // Guardar referencia a los botones originales para no perder funcionalidad
        const btnPlaneamiento = document.getElementById('btnModoPlaneamiento');
        const btnJuegoGuerra = document.getElementById('btnModoJuegoGuerra');
        
        // Limpiar el contenedor pero mantener el título
        const titulo = container.querySelector('h2');
        Array.from(container.children).forEach(child => {
            if (child !== titulo) {
                // Si no es el título, lo ocultamos pero no lo eliminamos
                if (child.id === 'btnModoPlaneamiento' || child.id === 'btnModoJuegoGuerra') {
                    child.style.display = 'none';
                } else {
                    child.remove();
                }
            }
        });

        // Primero verificamos si ya existe un botón de logout para no duplicarlo
        if (!document.querySelector('.custom-logout-btn')) {
            // Crear el botón de cerrar sesión completamente desde cero
            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Cerrar Sesión';
            logoutButton.className = 'custom-logout-btn'; // Solo una clase personalizada
            
            // Estilos completamente inline sin usar clases predefinidas
            logoutButton.style.cssText = `
                background-color: #dc3545;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                font-size: 14px;
                width: auto;
                display: inline-block;
                text-align: center;
                white-space: nowrap;
            `;
            
            logoutButton.addEventListener('click', function() {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userId');
                localStorage.removeItem('username');
                window.location.reload();
            });
            
            // Añadir el botón directamente al body en lugar del contenedor
            document.body.appendChild(logoutButton);
        }

        // Crear el contenedor del carrusel
        const coverflowContainer = document.createElement('div');
        coverflowContainer.className = 'coverflow-container';
        
        // Crear el carrusel
        const coverflowCarousel = document.createElement('div');
        coverflowCarousel.className = 'coverflow-carousel';
        
        // Crear elementos para cada modo
        modos.forEach((modo, index) => {
            const item = document.createElement('div');
            item.className = 'coverflow-item';
            item.dataset.id = modo.id;
            item.dataset.index = index;
            
            // Contenido del item
            item.innerHTML = `
                <div class="glow"></div>
                <img src="/Client/image/${modo.icono}" alt="${modo.nombre}">
                <h3>${modo.nombre}</h3>
                <p>${modo.descripcion}</p>
                <button data-url="${modo.url}">Iniciar</button>
            `;
            
            coverflowCarousel.appendChild(item);
        });
        
        coverflowContainer.appendChild(coverflowCarousel);
        

        // Flechas de navegación
        const leftArrow = document.createElement('div');
        leftArrow.className = 'coverflow-arrow left';
        leftArrow.innerHTML = '&#10094;';
        
        const rightArrow = document.createElement('div');
        rightArrow.className = 'coverflow-arrow right';
        rightArrow.innerHTML = '&#10095;';
        
        coverflowContainer.appendChild(leftArrow);
        coverflowContainer.appendChild(rightArrow);
        
        // Indicadores
        const indicators = document.createElement('div');
        indicators.className = 'coverflow-indicators';
        
        modos.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'coverflow-indicator';
            indicator.dataset.index = index;
            indicators.appendChild(indicator);
        });
        
        coverflowContainer.appendChild(indicators);
        
            // Insertar el carrusel después del título
            if (titulo) {
                titulo.after(coverflowContainer);
            } else {
                container.appendChild(coverflowContainer);
            }
            
            // Inicializar el carrusel
            initCoverflowInteraction(coverflowCarousel, leftArrow, rightArrow, indicators, btnPlaneamiento, btnJuegoGuerra);
        }
    

    function initCoverflowInteraction(carousel, leftArrow, rightArrow, indicators, btnPlaneamiento, btnJuegoGuerra) {
        const items = Array.from(carousel.querySelectorAll('.coverflow-item'));
        const indicatorDots = Array.from(indicators.querySelectorAll('.coverflow-indicator'));
        
        if (items.length === 0) return;
        
        let currentIndex = 1; // Comenzar con el segundo elemento (índice 1)
        let startX, startY;
        let isDragging = false;
        let startRotation = 0;
        
        // Actualizar posiciones iniciales
        updateCoverflow();
        
        // Eventos de flechas
        leftArrow.addEventListener('click', () => {
            rotateCarousel('left');
        });
        
        rightArrow.addEventListener('click', () => {
            rotateCarousel('right');
        });
        
        // Eventos táctiles y de mouse
        carousel.addEventListener('mousedown', startDrag);
        carousel.addEventListener('touchstart', startDrag, { passive: true });
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: true });
        
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        
        // Clic en los indicadores
        indicatorDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (index < currentIndex) {
                    const stepsToRotate = currentIndex - index;
                    for (let i = 0; i < stepsToRotate; i++) {
                        setTimeout(() => {
                            rotateCarousel('left');
                        }, i * 200);
                    }
                } else if (index > currentIndex) {
                    const stepsToRotate = index - currentIndex;
                    for (let i = 0; i < stepsToRotate; i++) {
                        setTimeout(() => {
                            rotateCarousel('right');
                        }, i * 200);
                    }
                }
            });
        });
        
        // Clic en tarjetas
        items.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                // Si el clic fue en el botón, no rotar
                if (e.target.tagName === 'BUTTON') return;
                
                const itemIndex = parseInt(item.dataset.index);
                
                if (itemIndex < currentIndex) {
                    rotateCarousel('left');
                } else if (itemIndex > currentIndex) {
                    rotateCarousel('right');
                }
            });
            
            // Clic en botón
            const button = item.querySelector('button');
            if (button) {
                button.addEventListener('click', () => {
                    // Simulación de clic en los botones originales para mantener funcionalidad
                    if (item.dataset.id === 'planeamiento' && btnPlaneamiento) {
                        btnPlaneamiento.click();
                    } else if (item.dataset.id === 'juego-guerra' && btnJuegoGuerra) {
                        btnJuegoGuerra.click();
                    } else {
                        // Navegar directamente si no hay botón equivalente
                        const url = button.dataset.url;
                        if (url) {
                            window.location.href = url;
                        }
                    }
                });
            }
        });
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                rotateCarousel('left');
            } else if (e.key === 'ArrowRight') {
                rotateCarousel('right');
            }
        });
        
        // Funciones
        function startDrag(e) {
            if (e.button > 0) return; // Solo el botón principal del mouse
            
            isDragging = true;
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            startX = clientX;
            startY = clientY;
            startRotation = getCurrentRotation();
            
            // Prevenir comportamiento por defecto
            if (e.type === 'mousedown') {
                e.preventDefault();
            }
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const clientX = e.clientX || (e.touches ? e.touches[0].clientX : startX);
            const deltaX = clientX - startX;
            
            // Si el movimiento es significativo, considerarlo como arrastre
            if (Math.abs(deltaX) > 10) {
                e.preventDefault(); // Prevenir scroll
            }
        }
        
        function endDrag(e) {
            if (!isDragging) return;
            
            isDragging = false;
            const clientX = e.clientX || (e.changedTouches ? e.changedTouches[0].clientX : startX);
            const deltaX = clientX - startX;
            
            // Si hubo un arrastre significativo
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    rotateCarousel('left');
                } else {
                    rotateCarousel('right');
                }
            }
        }
        
        function rotateCarousel(direction) {
            if (direction === 'left') {
                currentIndex = (currentIndex - 1 + items.length) % items.length;
            } else {
                currentIndex = (currentIndex + 1) % items.length;
            }
            
            updateCoverflow();
        }
        
        function updateCoverflow() {
            // Actualizar clases y transformaciones para cada item
            items.forEach((item, index) => {
                // Limpiar clases previas
                item.classList.remove('active', 'prev', 'next');
                
                // Calcular posición relativa respecto al centro
                const relativePos = calculateRelativePosition(index, currentIndex, items.length);
                
                // Aplicar transformación 3D
                const translateZ = relativePos === 0 ? 200 : 0;
                const translateX = relativePos * 250; // Desplazamiento lateral
                const rotateY = relativePos * -15; // Rotación en Y
                const scale = relativePos === 0 ? 1 : 0.8; // Escala
                const opacity = relativePos === 0 ? 1 : 0.7; // Opacidad
                
                // La clave está en esta transformación, usando translate(-50%, -50%) para centrar adecuadamente
                item.style.transform = `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
                item.style.opacity = opacity;
                
                // Añadir clases específicas
                if (relativePos === 0) {
                    item.classList.add('active');
                } else if (relativePos < 0) {
                    item.classList.add('prev');
                } else {
                    item.classList.add('next');
                }
            });
            
            // Actualizar indicadores
            indicatorDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }
        
        function calculateRelativePosition(itemIndex, centerIndex, totalItems) {
            let diff = itemIndex - centerIndex;
            
            // Calcular el camino más corto en un carrusel circular
            if (Math.abs(diff) > totalItems / 2) {
                if (diff > 0) {
                    diff = diff - totalItems;
                } else {
                    diff = diff + totalItems;
                }
            }
            
            return diff;
        }
        
        function getCurrentRotation() {
            const transform = window.getComputedStyle(carousel).transform;
            if (transform === 'none') return 0;
            
            const matrix = transform.match(/^matrix3d\((.+)\)$/);
            if (matrix) {
                const values = matrix[1].split(', ');
                const a = values[0];
                const b = values[1];
                const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
                return angle;
            }
            
            return 0;
        }
    }
});