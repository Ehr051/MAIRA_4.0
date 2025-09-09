// 🧪 Script de Test Rápido para MAIRA 4.0
// Este script verifica el estado del botón "comenzar" y otros elementos críticos

console.log('🧪 MAIRA 4.0 - Test de Botón "Comenzar" - Iniciando...');

// 1. Verificar que estamos en la página correcta
function verificarPagina() {
    const url = window.location.href;
    const esMAIRA = url.includes('maira') || document.title.includes('MAIRA');
    console.log(`📍 URL: ${url}`);
    console.log(`🎯 Es página MAIRA: ${esMAIRA}`);
    return esMAIRA;
}

// 2. Buscar el botón "comenzar"
function buscarBotonComenzar() {
    console.log('🔍 Buscando botón "comenzar"...');
    
    // Múltiples estrategias de búsqueda
    const estrategias = [
        () => document.getElementById('comenzar'),
        () => document.querySelector('[onclick*="comenzar"]'),
        () => document.querySelector('button[onclick]'),
        () => document.querySelector('.btn-comenzar'),
        () => document.querySelector('[id*="comenzar"]'),
        () => [...document.querySelectorAll('button')].find(btn => 
               btn.textContent.toLowerCase().includes('comenzar')),
        () => [...document.querySelectorAll('a')].find(link => 
               link.textContent.toLowerCase().includes('comenzar')),
        () => [...document.querySelectorAll('*')].find(el => 
               el.getAttribute('onclick')?.includes('comenzar'))
    ];
    
    for (let i = 0; i < estrategias.length; i++) {
        try {
            const elemento = estrategias[i]();
            if (elemento) {
                console.log(`✅ Encontrado con estrategia ${i + 1}:`, elemento);
                console.log(`   - Tipo: ${elemento.tagName}`);
                console.log(`   - ID: ${elemento.id}`);
                console.log(`   - Clases: ${elemento.className}`);
                console.log(`   - Texto: "${elemento.textContent.trim()}"`);
                console.log(`   - onClick: ${elemento.getAttribute('onclick')}`);
                console.log(`   - Visible: ${window.getComputedStyle(elemento).display !== 'none'}`);
                return elemento;
            }
        } catch (error) {
            console.log(`❌ Error en estrategia ${i + 1}:`, error.message);
        }
    }
    
    console.log('❌ Botón "comenzar" no encontrado con ninguna estrategia');
    return null;
}

// 3. Verificar eventos del botón
function verificarEventos(boton) {
    if (!boton) return false;
    
    console.log('🔍 Verificando eventos del botón...');
    
    // Verificar onclick
    const onclick = boton.getAttribute('onclick');
    if (onclick) {
        console.log(`✅ Evento onclick encontrado: ${onclick}`);
        
        // Verificar si la función existe
        try {
            const funcionNombre = onclick.match(/(\w+)\s*\(/)?.[1];
            if (funcionNombre && typeof window[funcionNombre] === 'function') {
                console.log(`✅ Función ${funcionNombre} existe en window`);
                return true;
            } else {
                console.log(`❌ Función ${funcionNombre} no encontrada en window`);
            }
        } catch (error) {
            console.log(`❌ Error verificando función: ${error.message}`);
        }
    }
    
    // Verificar event listeners
    const listeners = getEventListeners ? getEventListeners(boton) : {};
    console.log('🎧 Event listeners:', listeners);
    
    return false;
}

// 4. Test de simulación de click
function testClickSimulado(boton) {
    if (!boton) return false;
    
    console.log('🖱️ Probando click simulado...');
    
    try {
        // Guardar estado antes del click
        const urlAntes = window.location.href;
        
        // Simular click
        boton.click();
        
        // Verificar cambios después de un momento
        setTimeout(() => {
            const urlDespues = window.location.href;
            const cambioURL = urlAntes !== urlDespues;
            
            console.log(`📍 URL antes: ${urlAntes}`);
            console.log(`📍 URL después: ${urlDespues}`);
            console.log(`🔄 ¿Cambió URL?: ${cambioURL}`);
            
            if (cambioURL) {
                console.log('✅ Click simulado funcionó - URL cambió');
            } else {
                console.log('⚠️ Click simulado no cambió URL');
                
                // Verificar si se ejecutó algún script
                console.log('🔍 Verificando cambios en el DOM...');
                // Aquí podrías agregar más verificaciones específicas
            }
        }, 1000);
        
        return true;
    } catch (error) {
        console.log(`❌ Error en click simulado: ${error.message}`);
        return false;
    }
}

// 5. Verificar dependencias críticas
function verificarDependencias() {
    console.log('📦 Verificando dependencias críticas...');
    
    const dependencias = {
        'jQuery': typeof $ !== 'undefined',
        'Leaflet': typeof L !== 'undefined',
        'Bootstrap': typeof bootstrap !== 'undefined' || typeof $.fn.modal !== 'undefined',
        'measurementHandler': typeof measurementHandler !== 'undefined',
        'toolsInitializer': typeof toolsInitializer !== 'undefined'
    };
    
    Object.entries(dependencias).forEach(([nombre, disponible]) => {
        const estado = disponible ? '✅' : '❌';
        console.log(`${estado} ${nombre}: ${disponible ? 'DISPONIBLE' : 'FALTANTE'}`);
    });
    
    return dependencias;
}

// 6. Diagnóstico completo
function diagnosticoCompleto() {
    console.log('🏥 DIAGNÓSTICO COMPLETO - MAIRA 4.0');
    console.log('=====================================');
    
    const resultados = {
        paginaCorrecta: verificarPagina(),
        botonEncontrado: null,
        eventosValidos: false,
        clickFunciona: false,
        dependencias: verificarDependencias()
    };
    
    const boton = buscarBotonComenzar();
    resultados.botonEncontrado = !!boton;
    
    if (boton) {
        resultados.eventosValidos = verificarEventos(boton);
        resultados.clickFunciona = testClickSimulado(boton);
    }
    
    console.log('📊 RESUMEN DE RESULTADOS:');
    console.log('========================');
    Object.entries(resultados).forEach(([key, value]) => {
        if (typeof value === 'object') {
            console.log(`${key}:`, value);
        } else {
            const estado = value ? '✅' : '❌';
            console.log(`${estado} ${key}: ${value}`);
        }
    });
    
    // Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    if (!resultados.botonEncontrado) {
        console.log('   - Verificar que el HTML contiene el botón "comenzar"');
    }
    if (!resultados.eventosValidos) {
        console.log('   - Verificar que las funciones JavaScript están definidas');
    }
    if (!resultados.dependencias.jQuery) {
        console.log('   - Cargar jQuery correctamente');
    }
    if (!resultados.dependencias.Leaflet) {
        console.log('   - Cargar Leaflet correctamente');
    }
    
    return resultados;
}

// Ejecutar diagnóstico automáticamente
const resultados = diagnosticoCompleto();

// Función para copiar resultados al portapapeles
window.copiarResultados = function() {
    const texto = JSON.stringify(resultados, null, 2);
    navigator.clipboard.writeText(texto).then(() => {
        console.log('📋 Resultados copiados al portapapeles');
    });
};

console.log('📋 Para copiar resultados, ejecuta: copiarResultados()');
console.log('🔄 Para repetir el test, recarga la página');
