// 🔧 SCRIPT DE CORRECCIÓN DE ORDEN CSS EN TIEMPO REAL
// Ejecutar en consola para corregir inmediatamente el orden de CSS

window.fixCSSOrder = function() {
    console.log('🔧 CORRIGIENDO ORDEN DE CSS...');
    console.log('==============================');
    
    // 1. Obtener todos los links CSS actuales
    const allLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const head = document.head;
    
    console.log(`📋 Enlaces CSS encontrados: ${allLinks.length}`);
    
    // 2. Categorizar CSS
    const categorizedCSS = {
        leaflet: [],
        bootstrap: [],
        fontawesome: [],
        maira: [],
        other: []
    };
    
    allLinks.forEach(link => {
        const href = link.href;
        
        if (href.includes('leaflet')) {
            categorizedCSS.leaflet.push(link);
        } else if (href.includes('bootstrap')) {
            categorizedCSS.bootstrap.push(link);
        } else if (href.includes('fontawesome') || href.includes('font-awesome')) {
            categorizedCSS.fontawesome.push(link);
        } else if (href.includes('Client/css/') || href.includes('planeamiento.css') || href.includes('CYGMarcha.css')) {
            categorizedCSS.maira.push(link);
        } else {
            categorizedCSS.other.push(link);
        }
    });
    
    console.log('📊 Categorización:');
    Object.keys(categorizedCSS).forEach(category => {
        console.log(`   ${category}: ${categorizedCSS[category].length} archivos`);
    });
    
    // 3. Remover todos los links existentes
    allLinks.forEach(link => link.remove());
    
    // 4. Reordenar según prioridad correcta
    const correctOrder = [
        ...categorizedCSS.leaflet,
        ...categorizedCSS.other,
        ...categorizedCSS.fontawesome,
        ...categorizedCSS.bootstrap,
        ...categorizedCSS.maira
    ];
    
    console.log('🔄 Reordenando CSS...');
    
    // 5. Agregar en orden correcto
    correctOrder.forEach((link, index) => {
        head.appendChild(link);
        const filename = link.href.split('/').pop();
        console.log(`   ${index + 1}. ${filename}`);
    });
    
    console.log('✅ Orden de CSS corregido');
    
    // 6. Verificar que CYGMarcha.css sea el último de MAIRA
    const mairaFiles = categorizedCSS.maira.map(link => link.href.split('/').pop());
    console.log('🎨 Orden final CSS MAIRA:', mairaFiles);
    
    return {
        total: correctOrder.length,
        leaflet: categorizedCSS.leaflet.length,
        bootstrap: categorizedCSS.bootstrap.length,
        maira: categorizedCSS.maira.length
    };
};

// Función para verificar si el orden es correcto
window.verifyCSSOrder = function() {
    console.log('🔍 VERIFICANDO ORDEN ACTUAL DE CSS...');
    console.log('====================================');
    
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    let bootstrapIndex = -1;
    let lastMairaIndex = -1;
    let firstMairaIndex = -1;
    
    links.forEach((link, index) => {
        const href = link.href;
        const filename = href.split('/').pop();
        
        if (href.includes('bootstrap')) {
            bootstrapIndex = index;
            console.log(`🅱️ Bootstrap en posición: ${index + 1} (${filename})`);
        }
        
        if (href.includes('Client/css/') || href.includes('planeamiento.css') || href.includes('CYGMarcha.css')) {
            if (firstMairaIndex === -1) firstMairaIndex = index;
            lastMairaIndex = index;
            console.log(`🎨 MAIRA CSS en posición: ${index + 1} (${filename})`);
        }
    });
    
    const isCorrect = bootstrapIndex < firstMairaIndex;
    
    console.log('\n📊 ANÁLISIS:');
    console.log(`   Bootstrap posición: ${bootstrapIndex + 1}`);
    console.log(`   Primer MAIRA CSS: ${firstMairaIndex + 1}`);
    console.log(`   Último MAIRA CSS: ${lastMairaIndex + 1}`);
    console.log(`   ✅ Orden correcto: ${isCorrect ? 'SÍ' : 'NO'}`);
    
    if (!isCorrect) {
        console.log('\n🔧 Para corregir ejecuta: fixCSSOrder()');
    }
    
    return {
        isCorrect,
        bootstrapIndex,
        firstMairaIndex,
        lastMairaIndex,
        totalCSS: links.length
    };
};

// Función para forzar recarga de estilos MAIRA específicos
window.reloadMAIRAStyles = function() {
    console.log('🔄 RECARGANDO ESTILOS MAIRA...');
    
    const mairaCSS = [
        './css/common/planeamiento.css',
        './css/common/graficomarcha.css', 
        './css/common/CYGMarcha.css'
    ];
    
    mairaCSS.forEach(cssPath => {
        // Remover si existe
        const existing = document.querySelector(`link[href*="${cssPath.split('/').pop()}"]`);
        if (existing) {
            existing.remove();
        }
        
        // Agregar con timestamp para evitar cache
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${cssPath}?t=${Date.now()}`;
        document.head.appendChild(link);
        
        console.log(`✅ Recargado: ${cssPath.split('/').pop()}`);
    });
};

console.log('🔧 Scripts de corrección CSS cargados');
console.log('📋 Comandos disponibles:');
console.log('   - verifyCSSOrder() - Verificar orden actual');
console.log('   - fixCSSOrder() - Corregir orden inmediatamente');  
console.log('   - reloadMAIRAStyles() - Recargar solo CSS de MAIRA');
