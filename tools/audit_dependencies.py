#!/usr/bin/env python3
"""
MAIRA - Auditor de Dependencias Externas y Responsive Design
Verifica la independencia de CDNs y audita responsive design
"""

import os
import re
import json
from pathlib import Path

class MAIRADependencyAuditor:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.external_patterns = [
            r'https?://unpkg\.com',
            r'https?://cdnjs\.cloudflare\.com',
            r'https?://stackpath\.bootstrapcdn\.com',
            r'https?://ajax\.googleapis\.com',
            r'https?://d3js\.org',
            r'https?://cdn\.jsdelivr\.net',
            r'https?://maxcdn\.bootstrapcdn\.com'
        ]
        
        self.responsive_patterns = [
            r'@media\s*\([^)]*max-width[^)]*\)',
            r'@media\s*\([^)]*min-width[^)]*\)',
            r'viewport',
            r'mobile-web-app-capable',
            r'touch-action',
            r'user-scalable'
        ]
        
        self.results = {
            'external_dependencies': [],
            'responsive_features': [],
            'mobile_optimizations': [],
            'recommendations': []
        }

    def scan_html_files(self):
        """Escanea archivos HTML en busca de dependencias externas"""
        html_files = list(self.project_root.glob('**/*.html'))
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Buscar dependencias externas
                for pattern in self.external_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if match in line:
                                self.results['external_dependencies'].append({
                                    'file': str(html_file),
                                    'line': i + 1,
                                    'url': match,
                                    'context': line.strip()
                                })
                
                # Verificar responsive features
                for pattern in self.responsive_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        self.results['responsive_features'].append({
                            'file': str(html_file),
                            'feature': pattern,
                            'count': len(matches)
                        })
                        
            except Exception as e:
                print(f"Error procesando {html_file}: {e}")

    def scan_css_files(self):
        """Escanea archivos CSS en busca de optimizaciones responsive"""
        css_files = list(self.project_root.glob('**/*.css'))
        
        mobile_indicators = [
            'max-width.*768px',
            'max-width.*480px',
            'max-width.*576px',
            'touch-device',
            'mobile-theme',
            'min-height.*44px',  # Touch target size
            'hover:\s*none',
            'pointer:\s*coarse'
        ]
        
        for css_file in css_files:
            try:
                with open(css_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Contar media queries
                media_queries = re.findall(r'@media[^{]*{', content, re.IGNORECASE)
                
                # Buscar optimizaciones móviles
                mobile_optimizations = 0
                for indicator in mobile_indicators:
                    matches = re.findall(indicator, content, re.IGNORECASE)
                    mobile_optimizations += len(matches)
                
                if media_queries or mobile_optimizations > 0:
                    self.results['mobile_optimizations'].append({
                        'file': str(css_file),
                        'media_queries': len(media_queries),
                        'mobile_optimizations': mobile_optimizations
                    })
                    
            except Exception as e:
                print(f"Error procesando {css_file}: {e}")

    def scan_js_files(self):
        """Escanea archivos JavaScript en busca de dependencias externas"""
        js_files = list(self.project_root.glob('**/*.js'))
        
        for js_file in js_files:
            try:
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Buscar URLs externas en JavaScript
                for pattern in self.external_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if match in line:
                                self.results['external_dependencies'].append({
                                    'file': str(js_file),
                                    'line': i + 1,
                                    'url': match,
                                    'context': line.strip()[:100] + '...'
                                })
                                
            except Exception as e:
                print(f"Error procesando {js_file}: {e}")

    def generate_recommendations(self):
        """Genera recomendaciones basadas en el análisis"""
        recommendations = []
        
        # Verificar dependencias externas
        external_count = len(self.results['external_dependencies'])
        if external_count > 0:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Dependencies',
                'issue': f'Se encontraron {external_count} dependencias externas',
                'solution': 'Migrar todas las dependencias a node_modules local',
                'impact': 'Independencia de red, mejor rendimiento offline'
            })
        
        # Verificar optimizaciones móviles
        mobile_files = len(self.results['mobile_optimizations'])
        if mobile_files < 3:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Mobile UX',
                'issue': 'Pocas optimizaciones móviles detectadas',
                'solution': 'Implementar más media queries y optimizaciones táctiles',
                'impact': 'Mejor experiencia en dispositivos móviles'
            })
        
        # Verificar responsive features
        responsive_files = len(self.results['responsive_features'])
        if responsive_files < 2:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Responsive Design',
                'issue': 'Pocos archivos con características responsive',
                'solution': 'Añadir viewport meta tags y media queries',
                'impact': 'Funcionalidad en todos los dispositivos'
            })
        
        self.results['recommendations'] = recommendations

    def audit(self):
        """Ejecuta la auditoría completa"""
        print("🔍 Iniciando auditoría MAIRA...")
        
        print("  📄 Escaneando archivos HTML...")
        self.scan_html_files()
        
        print("  🎨 Escaneando archivos CSS...")
        self.scan_css_files()
        
        print("  ⚡ Escaneando archivos JavaScript...")
        self.scan_js_files()
        
        print("  💡 Generando recomendaciones...")
        self.generate_recommendations()
        
        return self.results

    def generate_report(self):
        """Genera un reporte detallado"""
        report = []
        report.append("=" * 60)
        report.append("MAIRA - AUDITORÍA DE DEPENDENCIAS Y RESPONSIVE DESIGN")
        report.append("=" * 60)
        report.append("")
        
        # Resumen ejecutivo
        ext_deps = len(self.results['external_dependencies'])
        mobile_opts = sum(opt['mobile_optimizations'] for opt in self.results['mobile_optimizations'])
        
        report.append("📊 RESUMEN EJECUTIVO:")
        report.append(f"   • Dependencias externas encontradas: {ext_deps}")
        report.append(f"   • Archivos con optimizaciones móviles: {len(self.results['mobile_optimizations'])}")
        report.append(f"   • Total de optimizaciones móviles: {mobile_opts}")
        report.append(f"   • Recomendaciones generadas: {len(self.results['recommendations'])}")
        report.append("")
        
        # Dependencias externas
        if self.results['external_dependencies']:
            report.append("🌐 DEPENDENCIAS EXTERNAS DETECTADAS:")
            for dep in self.results['external_dependencies']:
                report.append(f"   ⚠️  {dep['file']}:{dep['line']}")
                report.append(f"      URL: {dep['url']}")
                report.append(f"      Contexto: {dep['context']}")
                report.append("")
        
        # Optimizaciones móviles
        if self.results['mobile_optimizations']:
            report.append("📱 OPTIMIZACIONES MÓVILES:")
            for opt in self.results['mobile_optimizations']:
                report.append(f"   ✅ {opt['file']}")
                report.append(f"      Media queries: {opt['media_queries']}")
                report.append(f"      Optimizaciones móviles: {opt['mobile_optimizations']}")
                report.append("")
        
        # Recomendaciones
        if self.results['recommendations']:
            report.append("💡 RECOMENDACIONES:")
            for rec in self.results['recommendations']:
                priority_icon = "🔴" if rec['priority'] == 'HIGH' else "🟡" if rec['priority'] == 'MEDIUM' else "🟢"
                report.append(f"   {priority_icon} [{rec['priority']}] {rec['category']}")
                report.append(f"      Problema: {rec['issue']}")
                report.append(f"      Solución: {rec['solution']}")
                report.append(f"      Impacto: {rec['impact']}")
                report.append("")
        
        report.append("=" * 60)
        report.append("Auditoría completada ✅")
        report.append("=" * 60)
        
        return "\n".join(report)

def main():
    project_root = "/Users/mac/Documents/GitHub/MAIRA_git"
    
    auditor = MAIRADependencyAuditor(project_root)
    results = auditor.audit()
    
    # Generar reporte
    report = auditor.generate_report()
    print(report)
    
    # Guardar resultados en JSON
    output_file = os.path.join(project_root, "audit_results.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📋 Resultados guardados en: {output_file}")
    
    # Guardar reporte en texto
    report_file = os.path.join(project_root, "audit_report.txt")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📄 Reporte guardado en: {report_file}")

if __name__ == "__main__":
    main()
