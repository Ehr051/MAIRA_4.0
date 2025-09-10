// 🔍 SCRIPT DE DIAGNÓSTICO DE ORDEN CSS
// Ejecutar en consola del navegador para ver el orden de carga de CSS

function analyzeCSSSLoadOrder() {
    console.log('🎨 ANÁLISIS DE ORDEN DE CARGA CSS');
    console.log('================================');
    
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const cssOrder = [];
    
    linkElements.forEach((link, index) => {
        const href = link.href;
        const filename = href.split('/').pop() || href;
        
        let category = '🔧 Otro';
        if (href.includes('bootstrap')) category = '🅱️ Bootstrap';
        else if (href.includes('leaflet')) category = '🍃 Leaflet';
        else if (href.includes('fontawesome') || href.includes('font-awesome')) category = '🔤 FontAwesome';
        else if (href.includes('planeamiento.css')) category = '🎯 MAIRA Principal';
        else if (href.includes('CYGMarcha.css')) category = '📊 MAIRA CYGMarcha';
        else if (href.includes('graficomarcha.css')) category = '📈 MAIRA Gráfico';
        else if (href.includes('test-buttons.css')) category = '🧪 MAIRA Test';
        else if (href.includes('Client/css/')) category = '🎨 MAIRA CSS';
        
        cssOrder.push({
            order: index + 1,
            category,
            filename,
            fullPath: href
        });
    });
    
    // Mostrar orden
    console.table(cssOrder);
    
    // Análisis de prioridades
    console.log('\n📊 ANÁLISIS DE PRIORIDADES:');
    console.log('============================');
    
    const bootstrap = cssOrder.find(css => css.category.includes('Bootstrap'));
    const mairaCSS = cssOrder.filter(css => css.category.includes('MAIRA'));
    
    if (bootstrap) {
        console.log(`🅱️ Bootstrap carga en posición: ${bootstrap.order}`);
    }
    
    if (mairaCSS.length > 0) {
        console.log('🎨 CSS de MAIRA:');
        mairaCSS.forEach(css => {
            console.log(`   ${css.category} - Posición: ${css.order}`);
        });
        
        const firstMAIRA = Math.min(...mairaCSS.map(css => css.order));
        const lastMAIRA = Math.max(...mairaCSS.map(css => css.order));
        
        if (bootstrap && bootstrap.order > lastMAIRA) {
            console.log('❌ PROBLEMA: Bootstrap se carga DESPUÉS de CSS MAIRA');
            console.log('   Esto puede causar que Bootstrap sobreescriba estilos MAIRA');
        } else if (bootstrap && bootstrap.order < firstMAIRA) {
            console.log('✅ CORRECTO: CSS MAIRA se carga DESPUÉS de Bootstrap');
        }
    }
    
    // Verificar conflictos conocidos
    console.log('\n⚠️ VERIFICACIÓN DE CONFLICTOS:');
    console.log('==============================');
    
    // Verificar si hay reglas importantes de Bootstrap que puedan interferir
    const bootstrapStylesheets = Array.from(document.styleSheets).filter(sheet => {
        try {
            return sheet.href && sheet.href.includes('bootstrap');
        } catch (e) {
            return false;
        }
    });
    
    console.log(`🅱️ Hojas de estilo Bootstrap encontradas: ${bootstrapStylesheets.length}`);
    
    // Verificar CSS de MAIRA
    const mairaStylesheets = Array.from(document.styleSheets).filter(sheet => {
        try {
            return sheet.href && (
                sheet.href.includes('planeamiento.css') ||
                sheet.href.includes('CYGMarcha.css') ||
                sheet.href.includes('Client/css/')
            );
        } catch (e) {
            return false;
        }
    });
    
    console.log(`🎨 Hojas de estilo MAIRA encontradas: ${mairaStylesheets.length}`);
    
    return {
        cssOrder,
        bootstrap,
        mairaCSS,
        totalCSS: linkElements.length
    };
}

// Función para comparar con orden ideal
function generateIdealOrder() {
    console.log('\n💡 ORDEN IDEAL RECOMENDADO:');
    console.log('===========================');
    
    const idealOrder = [
        '1. 🍃 Leaflet CSS base',
        '2. 🍃 Leaflet plugins CSS',
        '3. 🔤 FontAwesome CSS',
        '4. 🅱️ Bootstrap CSS (último de librerías)',
        '5. 🎯 MAIRA planeamiento.css (principal)',
        '6. 📊 MAIRA CYGMarcha.css (específico)',
        '7. 📈 MAIRA graficomarcha.css',
        '8. 🧪 MAIRA test-buttons.css (último)'
    ];
    
    idealOrder.forEach(item => console.log(item));
    
    console.log('\n📋 ESTRATEGIA DE CORRECCIÓN:');
    console.log('============================');
    console.log('1. Modificar dependency-manager.js para cargar Bootstrap antes de CSS MAIRA');
    console.log('2. O agregar CSS MAIRA con mayor especificidad');
    console.log('3. O usar !important solo donde sea necesario');
}

// Función para detectar reglas específicas que pueden estar en conflicto
function checkSpecificConflicts() {
    console.log('\n🔍 VERIFICACIÓN DE CONFLICTOS ESPECÍFICOS:');
    console.log('==========================================');
    
    const elementsToCheck = [
        { selector: '.sub-panel', property: 'position' },
        { selector: '.display-header', property: 'background' },
        { selector: 'body', property: 'margin' },
        { selector: 'body', property: 'font-family' }
    ];
    
    elementsToCheck.forEach(({ selector, property }) => {
        const element = document.querySelector(selector);
        if (element) {
            const computedStyle = window.getComputedStyle(element);
            const value = computedStyle.getPropertyValue(property);
            console.log(`${selector} { ${property}: ${value} }`);
        } else {
            console.log(`❌ Elemento no encontrado: ${selector}`);
        }
    });
}

// Ejecutar análisis completo
window.analyzeCSS = function() {
    const result = analyzeCSSSLoadOrder();
    generateIdealOrder();
    checkSpecificConflicts();
    return result;
};

console.log('🎨 Script de análisis CSS cargado');
console.log('📋 Ejecutar: analyzeCSS() para análisis completo');
