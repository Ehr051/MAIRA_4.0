/**
 * Font Awesome Test & Fix
 * Verifica y corrige problemas de iconos de Font Awesome
 */

(function() {
    'use strict';

    function testFontAwesome() {
        console.log('🔍 Verificando Font Awesome...');

        // Verificar si el CSS está cargado
        const faLink = document.querySelector('link[href*="fontawesome"]');
        if (!faLink) {
            console.error('❌ Font Awesome CSS no encontrado');
            return false;
        }

        console.log('✅ Font Awesome CSS encontrado:', faLink.href);

        // Verificar si hay iconos en el DOM
        const faIcons = document.querySelectorAll('[class*="fa-"]');
        console.log(`📋 ${faIcons.length} iconos Font Awesome encontrados en DOM`);

        // Test de renderizado de iconos específicos
        const testIcons = [
            'fa-eye', 'fa-mountain', 'fa-road', 'fa-satellite-dish', 
            'fa-bus', 'fa-tree', 'fa-tools', 'fa-search', 
            'fa-ruler-combined', 'fa-chart-line'
        ];

        const problemIcons = [];

        testIcons.forEach(iconClass => {
            const icon = document.querySelector(`.${iconClass}`);
            if (icon) {
                const style = window.getComputedStyle(icon, '::before');
                const content = style.getPropertyValue('content');
                
                if (!content || content === 'none' || content === '""') {
                    problemIcons.push(iconClass);
                    console.warn(`⚠️ Problema con icono: ${iconClass}`);
                } else {
                    console.log(`✅ Icono OK: ${iconClass}`);
                }
            }
        });

        if (problemIcons.length > 0) {
            console.warn('❌ Iconos problemáticos encontrados:', problemIcons);
            fixProblemIcons(problemIcons);
        } else {
            console.log('✅ Todos los iconos principales funcionan correctamente');
        }

        return problemIcons.length === 0;
    }

    function fixProblemIcons(problemIcons) {
        console.log('🔧 Intentando reparar iconos problemáticos...');

        // Mapeo de iconos problemáticos a alternativas
        const iconFixes = {
            'fa-satellite-dish': 'fa-satellite',
            'fa-ruler-combined': 'fa-ruler',
            'fa-chart-line': 'fa-chart-area'
        };

        problemIcons.forEach(iconClass => {
            const elements = document.querySelectorAll(`.${iconClass}`);
            const replacement = iconFixes[iconClass];

            if (replacement) {
                elements.forEach(el => {
                    el.classList.remove(iconClass);
                    el.classList.add(replacement);
                    console.log(`🔄 Reemplazado ${iconClass} por ${replacement}`);
                });
            } else {
                // Fallback a icono genérico
                elements.forEach(el => {
                    if (!el.textContent.trim()) {
                        el.textContent = '●'; // Bullet como fallback visual
                        el.style.fontFamily = 'monospace';
                        console.log(`🔄 Fallback aplicado a ${iconClass}`);
                    }
                });
            }
        });
    }

    function ensureFontAwesome() {
        return new Promise((resolve) => {
            // Si ya está cargado, test inmediatamente
            if (document.readyState === 'complete') {
                setTimeout(() => {
                    const result = testFontAwesome();
                    resolve(result);
                }, 500); // Dar tiempo para que los estilos se apliquen
            } else {
                // Esperar a que la página esté completamente cargada
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        const result = testFontAwesome();
                        resolve(result);
                    }, 500);
                });
            }
        });
    }

    // Auto-ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureFontAwesome);
    } else {
        ensureFontAwesome();
    }

    // Exportar función para uso manual
    window.testFontAwesome = testFontAwesome;
    window.fixFontAwesome = () => ensureFontAwesome();

    console.log('📦 Font Awesome Test & Fix cargado');
})();
