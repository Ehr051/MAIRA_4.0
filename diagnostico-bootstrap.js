// 🔍 DIAGNÓSTICO RÁPIDO BOOTSTRAP - Ejecutar en consola del navegador
console.clear();
console.log('🔍 === DIAGNÓSTICO BOOTSTRAP MAIRA 4.0 ===');

// 1. Verificar que MAIRABootstrap existe
if (typeof window.MAIRABootstrap === 'undefined') {
    console.error('❌ MAIRABootstrap NO disponible');
} else {
    console.log('✅ MAIRABootstrap disponible');
    
    // 2. Detectar página actual
    const pathname = window.location.pathname;
    const currentPage = pathname.includes('planeamiento') ? 'planeamiento' :
                       pathname.includes('juegodeguerra') ? 'juegodeguerra' :
                       pathname.includes('CO') ? 'CO' : 'index';
    
    console.log(`📍 Página detectada: ${currentPage} (URL: ${pathname})`);
    
    // 3. Verificar carga selectiva
    try {
        const files = window.MAIRABootstrap.loadForSpecificModule(currentPage);
        console.log(`📦 Archivos que se cargarían para ${currentPage}: ${files.length}`);
        
        // 4. Verificar que NO carga archivos incorrectos
        const wrongFiles = files.filter(f => {
            if (currentPage === 'planeamiento') {
                return f.includes('home') || f.includes('iniciarpartida');
            } else if (currentPage === 'index') {
                return f.includes('planeamiento') || f.includes('edicioncompleto');
            } else if (currentPage === 'juegodeguerra') {
                return f.includes('planeamiento') || f.includes('home');
            }
            return false;
        });
        
        if (wrongFiles.length === 0) {
            console.log('✅ NO carga archivos incorrectos - ¡CORRECTO!');
        } else {
            console.warn('⚠️ Carga archivos incorrectos:', wrongFiles);
        }
        
        // 5. Mostrar primeros 10 archivos
        console.log('📋 Primeros 10 archivos a cargar:');
        files.slice(0, 10).forEach((f, i) => {
            console.log(`  ${i+1}. ${f}`);
        });
        
        // 6. Verificar CSS cargados
        const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        console.log(`🎨 CSS cargados actualmente: ${cssLinks.length}`);
        cssLinks.forEach((link, i) => {
            console.log(`  CSS ${i+1}: ${link.href}`);
        });
        
    } catch (error) {
        console.error('💥 Error en diagnóstico:', error);
    }
}

// 7. Verificar dependencias críticas
console.log('\n🔗 === DEPENDENCIAS CRÍTICAS ===');
console.log('jQuery ($):', typeof $ !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
console.log('Leaflet (L):', typeof L !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
console.log('Proj4:', typeof proj4 !== 'undefined' ? '✅ Disponible' : '❌ No disponible');

// 8. Verificar scripts cargados
const scripts = Array.from(document.querySelectorAll('script[src]'));
console.log(`\n📜 Scripts cargados: ${scripts.length}`);
const jsFiles = scripts.filter(s => s.src.includes('.js')).length;
console.log(`📦 Archivos JS: ${jsFiles}`);

console.log('\n🏁 === DIAGNÓSTICO COMPLETO ===');
