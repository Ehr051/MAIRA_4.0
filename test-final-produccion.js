// 🚀 TEST DEFINITIVO MAIRA 4.0 - Deploy Exitoso
// Copiar y pegar en la consola del navegador en: https://maira-4-0.onrender.com

console.clear();
console.log('🚀 MAIRA 4.0 - TEST DEFINITIVO POST-DEPLOY');
console.log('==========================================');
console.log('⏰ Timestamp:', new Date().toLocaleString());
console.log('🌐 URL:', window.location.href);
console.log('');

// ✅ PASO 1: Verificar página correcta
console.log('📍 PASO 1: Verificando página...');
const esPaginaCorrecta = window.location.href.includes('maira-4-0.onrender.com');
console.log(`${esPaginaCorrecta ? '✅' : '❌'} Página correcta:`, esPaginaCorrecta);

// ✅ PASO 2: Buscar botón "comenzar"
console.log('\n🔍 PASO 2: Buscando botón "comenzar"...');
const estrategiasBusqueda = [
    () => document.getElementById('comenzar'),
    () => document.querySelector('[onclick*="comenzar"]'),
    () => document.querySelector('[onclick*="iniciarJuego"]'),
    () => document.querySelector('[onclick*="planeamiento"]'),
    () => [...document.querySelectorAll('button')].find(btn => 
           btn.textContent.toLowerCase().includes('comenzar')),
    () => [...document.querySelectorAll('a')].find(link => 
           link.textContent.toLowerCase().includes('comenzar')),
    () => document.querySelector('.btn-comenzar'),
    () => document.querySelector('#boton-comenzar'),
    () => document.querySelector('[value*="comenzar"]'),
    () => [...document.querySelectorAll('*')].find(el => 
           el.getAttribute('onclick')?.includes('comenzar'))
];

let botonComenzar = null;
let estrategiaExitosa = -1;

for (let i = 0; i < estrategiasBusqueda.length; i++) {
    try {
        const elemento = estrategiasBusqueda[i]();
        if (elemento) {
            botonComenzar = elemento;
            estrategiaExitosa = i + 1;
            break;
        }
    } catch (error) {
        // Continuar con la siguiente estrategia
    }
}

if (botonComenzar) {
    console.log('✅ Botón ENCONTRADO con estrategia', estrategiaExitosa);
    console.log('   🏷️  Tag:', botonComenzar.tagName);
    console.log('   🆔 ID:', botonComenzar.id || 'sin-id');
    console.log('   📝 Texto:', `"${botonComenzar.textContent.trim()}"`);
    console.log('   🖱️  OnClick:', botonComenzar.getAttribute('onclick') || 'sin-onclick');
    console.log('   👁️  Visible:', window.getComputedStyle(botonComenzar).display !== 'none');
    console.log('   📐 Posición:', botonComenzar.getBoundingClientRect());
} else {
    console.log('❌ Botón NO ENCONTRADO - Listando todos los botones:');
    [...document.querySelectorAll('button, a, input[type="button"], input[type="submit"]')]
        .forEach((btn, i) => {
            console.log(`   ${i + 1}. ${btn.tagName}#${btn.id || 'sin-id'}: "${btn.textContent.trim()}"`);
        });
}

// ✅ PASO 3: Verificar módulos refactorizados
console.log('\n📦 PASO 3: Verificando módulos refactorizados...');
const modulosRefactorizados = [
    'measurementHandler',
    'elevationProfileService',
    'mapInteractionHandler', 
    'geometryUtils',
    'mobileOptimizationHandler',
    'toolsInitializer'
];

const modulosDisponibles = modulosRefactorizados.filter(mod => window[mod] !== undefined);
console.log(`✅ Módulos disponibles: ${modulosDisponibles.length}/${modulosRefactorizados.length}`);
modulosDisponibles.forEach(mod => console.log(`   ✅ ${mod}`));

const modulosFaltantes = modulosRefactorizados.filter(mod => window[mod] === undefined);
if (modulosFaltantes.length > 0) {
    console.log('❌ Módulos faltantes:');
    modulosFaltantes.forEach(mod => console.log(`   ❌ ${mod}`));
}

// ✅ PASO 4: Verificar dependencias críticas
console.log('\n🔗 PASO 4: Verificando dependencias críticas...');
const dependencias = {
    'jQuery ($)': typeof $ !== 'undefined',
    'Leaflet (L)': typeof L !== 'undefined',
    'Bootstrap': typeof bootstrap !== 'undefined' || (typeof $ !== 'undefined' && $.fn.modal),
    'Console disponible': typeof console !== 'undefined'
};

Object.entries(dependencias).forEach(([nombre, disponible]) => {
    console.log(`${disponible ? '✅' : '❌'} ${nombre}: ${disponible ? 'OK' : 'FALTANTE'}`);
});

// ✅ PASO 5: Test de click (si encontramos el botón)
if (botonComenzar) {
    console.log('\n🖱️ PASO 5: Test de click simulado...');
    console.log('⚠️ NOTA: Este test podría cambiar la página actual');
    
    // Crear función de test que el usuario puede ejecutar manualmente
    window.testClickComenzar = function() {
        console.log('🧪 Ejecutando click en botón "comenzar"...');
        const urlAntes = window.location.href;
        
        try {
            botonComenzar.click();
            
            setTimeout(() => {
                const urlDespues = window.location.href;
                const cambioUrl = urlAntes !== urlDespues;
                
                console.log('📊 RESULTADO DEL CLICK:');
                console.log(`   📍 URL antes: ${urlAntes}`);
                console.log(`   📍 URL después: ${urlDespues}`);
                console.log(`   🔄 ¿Cambió?: ${cambioUrl ? 'SÍ' : 'NO'}`);
                
                if (cambioUrl) {
                    console.log('✅ ¡SUCCESS! El botón "comenzar" funciona correctamente');
                } else {
                    console.log('⚠️ El botón se clickeó pero no cambió la URL');
                    console.log('   Verificar si ejecutó alguna función JavaScript');
                }
            }, 1000);
            
        } catch (error) {
            console.log('❌ ERROR en click:', error.message);
        }
    };
    
    console.log('💡 Para probar el click ejecuta: testClickComenzar()');
} else {
    console.log('\n❌ PASO 5: No se puede probar click - botón no encontrado');
}

// ✅ PASO 6: Diagnóstico de errores en consola
console.log('\n🔍 PASO 6: Verificando errores JavaScript...');
const erroresConsola = [];
const originalError = console.error;
console.error = function(...args) {
    erroresConsola.push(args.join(' '));
    originalError.apply(console, args);
};

setTimeout(() => {
    if (erroresConsola.length === 0) {
        console.log('✅ No se detectaron errores JavaScript');
    } else {
        console.log('❌ Errores detectados:');
        erroresConsola.forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
        });
    }
}, 2000);

// ✅ RESUMEN FINAL
console.log('\n📊 RESUMEN FINAL:');
console.log('================');
const puntaje = [
    esPaginaCorrecta,
    botonComenzar !== null,
    modulosDisponibles.length >= modulosRefactorizados.length * 0.8,
    dependencias['jQuery ($)'],
    dependencias['Leaflet (L)']
].filter(Boolean).length;

console.log(`🎯 Puntaje: ${puntaje}/5`);
console.log(`📈 Estado: ${puntaje >= 4 ? '✅ EXCELENTE' : puntaje >= 3 ? '⚠️ BUENO' : '❌ NECESITA REVISIÓN'}`);

if (puntaje >= 4) {
    console.log('🎉 ¡DEPLOY EXITOSO! MAIRA 4.0 está funcionando correctamente');
} else {
    console.log('🔧 Revisar los elementos marcados con ❌ para completar la corrección');
}

console.log('\n🚀 Test completado -', new Date().toLocaleString());
