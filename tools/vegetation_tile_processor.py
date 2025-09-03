#!/usr/bin/env python3
"""
MAIRA 4.0 - Procesador de Tiles de Vegetación NDVI
Convierte tiles TIF grandes en mini-tiles optimizados para GitHub

Basado en elevation_tile_processor.py adaptado para datos de vegetación NDVI
"""

import os
import sys
import json
import tarfile
import tempfile
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='🌿 %(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from osgeo import gdal, osr
    import numpy as np
    from PIL import Image
    gdal.UseExceptions()
except ImportError as e:
    logger.error(f"❌ Error importando dependencias: {e}")
    logger.error("💡 Instala las dependencias: pip install gdal pillow numpy")
    sys.exit(1)

class VegetationTileProcessor:
    """Procesador de tiles de vegetación NDVI para MAIRA 4.0"""
    
    def __init__(self, input_dir: str, output_dir: str, max_archive_size: int = 95):
        """
        Inicializar procesador de tiles de vegetación
        
        Args:
            input_dir: Directorio con archivos TIF de vegetación
            output_dir: Directorio de salida para mini-tiles
            max_archive_size: Tamaño máximo de archivo TAR en MB
        """
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.max_archive_size = max_archive_size * 1024 * 1024  # Convertir a bytes
        
        # Configuración específica para datos NDVI
        self.ndvi_scale_factor = 10000  # Factor de escala típico para NDVI
        self.ndvi_range = (-2000, 10000)  # Rango típico NDVI escalado
        
        # Configuración de tiles
        self.tile_size = 256  # Píxeles por tile
        self.compression = 'LZW'  # Compresión para GeoTIFF
        
        logger.info(f"🌱 Inicializando procesador de vegetación")
        logger.info(f"📂 Input: {self.input_dir}")
        logger.info(f"📁 Output: {self.output_dir}")
        logger.info(f"📦 Max size: {max_archive_size}MB")
    
    def encontrar_archivos_tif(self) -> List[Path]:
        """Encuentra todos los archivos TIF de vegetación en el directorio"""
        archivos = []
        
        # Buscar en subdirectorios también
        for pattern in ['*.tif', '*.tiff', '*.TIF', '*.TIFF']:
            archivos.extend(self.input_dir.rglob(pattern))
        
        # Filtrar por archivos que contengan indicadores de vegetación/NDVI
        archivos_ndvi = []
        keywords = ['ndvi', 'vi_ndvi', 'vegetation', 'veg', 'VI']
        
        for archivo in archivos:
            archivo_str = str(archivo).lower()
            if any(keyword.lower() in archivo_str for keyword in keywords):
                archivos_ndvi.append(archivo)
        
        if not archivos_ndvi:
            # Si no encuentra con keywords, usar todos los TIF
            archivos_ndvi = archivos
            logger.warning("⚠️ No se encontraron archivos con keywords NDVI, usando todos los TIF")
        
        logger.info(f"📊 Encontrados {len(archivos_ndvi)} archivos de vegetación")
        return sorted(archivos_ndvi)
    
    def analizar_archivo_tif(self, archivo: Path) -> Dict:
        """Analiza un archivo TIF para extraer metadatos"""
        try:
            dataset = gdal.Open(str(archivo))
            if not dataset:
                raise ValueError(f"No se puede abrir {archivo}")
            
            # Información básica
            info = {
                'archivo': archivo.name,
                'ruta_completa': str(archivo),
                'ancho': dataset.RasterXSize,
                'alto': dataset.RasterYSize,
                'bandas': dataset.RasterCount,
                'tipo_dato': gdal.GetDataTypeName(dataset.GetRasterBand(1).DataType),
                'tamaño_mb': archivo.stat().st_size / (1024 * 1024)
            }
            
            # Proyección y georreferenciación
            geotransform = dataset.GetGeoTransform()
            if geotransform:
                info['geotransform'] = geotransform
                info['bbox'] = self.calcular_bbox(dataset)
            
            proyeccion = dataset.GetProjection()
            if proyeccion:
                srs = osr.SpatialReference()
                srs.ImportFromWkt(proyeccion)
                info['epsg'] = srs.GetAttrValue('AUTHORITY', 1) if srs.GetAttrValue('AUTHORITY') else None
            
            # Estadísticas de la banda (asumiendo banda 1 es NDVI)
            banda = dataset.GetRasterBand(1)
            stats = banda.GetStatistics(True, True)
            if stats:
                info['estadisticas'] = {
                    'minimo': stats[0],
                    'maximo': stats[1],
                    'media': stats[2],
                    'desviacion': stats[3]
                }
            
            # Detectar si son valores NDVI escalados
            if stats and (stats[0] > -1 and stats[1] < 1):
                info['ndvi_tipo'] = 'real'  # Valores -1 a 1
            elif stats and (stats[0] > -10000 and stats[1] < 10000):
                info['ndvi_tipo'] = 'escalado'  # Valores escalados por 10000
            else:
                info['ndvi_tipo'] = 'desconocido'
            
            logger.info(f"📋 {archivo.name}: {info['ancho']}x{info['alto']}, "
                       f"{info['tamaño_mb']:.1f}MB, NDVI: {info['ndvi_tipo']}")
            
            return info
            
        except Exception as e:
            logger.error(f"❌ Error analizando {archivo}: {e}")
            return None
    
    def calcular_bbox(self, dataset) -> Dict:
        """Calcula el bounding box de un dataset"""
        geotransform = dataset.GetGeoTransform()
        ancho = dataset.RasterXSize
        alto = dataset.RasterYSize
        
        # Esquinas del dataset
        x_min = geotransform[0]
        y_max = geotransform[3]
        x_max = x_min + (ancho * geotransform[1])
        y_min = y_max + (alto * geotransform[5])
        
        return {
            'west': x_min,
            'east': x_max,
            'north': y_max,
            'south': y_min
        }
    
    def clasificar_por_regiones(self, archivos_info: List[Dict]) -> Dict[str, List[Dict]]:
        """Clasifica archivos por regiones geográficas de Argentina"""
        regiones = {
            'norte': [],        # Lat > -30
            'centro_norte': [], # -30 >= Lat > -35
            'centro': [],       # -35 >= Lat > -40
            'sur': [],          # -40 >= Lat > -50
            'patagonia': []     # Lat <= -50
        }
        
        for info in archivos_info:
            if 'bbox' not in info:
                # Si no tiene bbox, asignar a una región por defecto
                regiones['centro'].append(info)
                continue
            
            # Usar el centro del bbox para clasificar
            lat_centro = (info['bbox']['north'] + info['bbox']['south']) / 2
            
            if lat_centro > -30:
                regiones['norte'].append(info)
            elif lat_centro > -35:
                regiones['centro_norte'].append(info)
            elif lat_centro > -40:
                regiones['centro'].append(info)
            elif lat_centro > -50:
                regiones['sur'].append(info)
            else:
                regiones['patagonia'].append(info)
        
        # Log de distribución
        for region, archivos in regiones.items():
            if archivos:
                logger.info(f"🗺️ Región {region}: {len(archivos)} archivos")
        
        return regiones
    
    def procesar_archivo_ndvi(self, archivo_info: Dict, output_dir: Path) -> List[Dict]:
        """Procesa un archivo NDVI en mini-tiles"""
        archivo = Path(archivo_info['ruta_completa'])
        logger.info(f"🔄 Procesando {archivo.name}...")
        
        try:
            dataset = gdal.Open(str(archivo))
            if not dataset:
                raise ValueError(f"No se puede abrir {archivo}")
            
            banda = dataset.GetRasterBand(1)
            geotransform = dataset.GetGeoTransform()
            proyeccion = dataset.GetProjection()
            
            # Leer datos de la banda
            datos = banda.ReadAsArray()
            if datos is None:
                raise ValueError("No se pudieron leer los datos del raster")
            
            # Optimizar datos NDVI
            datos_optimizados = self.optimizar_datos_ndvi(datos, archivo_info)
            
            # Calcular número de tiles
            tiles_x = (dataset.RasterXSize + self.tile_size - 1) // self.tile_size
            tiles_y = (dataset.RasterYSize + self.tile_size - 1) // self.tile_size
            
            logger.info(f"🧩 Generando {tiles_x}x{tiles_y} = {tiles_x * tiles_y} mini-tiles")
            
            tiles_generados = []
            
            for tile_y in range(tiles_y):
                for tile_x in range(tiles_x):
                    # Calcular extents del tile
                    x_offset = tile_x * self.tile_size
                    y_offset = tile_y * self.tile_size
                    x_size = min(self.tile_size, dataset.RasterXSize - x_offset)
                    y_size = min(self.tile_size, dataset.RasterYSize - y_offset)
                    
                    if x_size <= 0 or y_size <= 0:
                        continue
                    
                    # Extraer datos del tile
                    tile_data = datos_optimizados[y_offset:y_offset + y_size, 
                                                 x_offset:x_offset + x_size]
                    
                    # Calcular geotransform del tile
                    tile_geotransform = (
                        geotransform[0] + x_offset * geotransform[1],
                        geotransform[1],
                        geotransform[2],
                        geotransform[3] + y_offset * geotransform[5],
                        geotransform[4],
                        geotransform[5]
                    )
                    
                    # Crear tile
                    tile_info = self.crear_mini_tile_ndvi(
                        tile_data, tile_geotransform, proyeccion,
                        output_dir, archivo.stem, tile_x, tile_y
                    )
                    
                    if tile_info:
                        tiles_generados.append(tile_info)
            
            logger.info(f"✅ Generados {len(tiles_generados)} mini-tiles de {archivo.name}")
            return tiles_generados
            
        except Exception as e:
            logger.error(f"❌ Error procesando {archivo}: {e}")
            return []
    
    def optimizar_datos_ndvi(self, datos: np.ndarray, archivo_info: Dict) -> np.ndarray:
        """Optimiza datos NDVI para mini-tiles"""
        # Detectar tipo de datos NDVI
        ndvi_tipo = archivo_info.get('ndvi_tipo', 'desconocido')
        
        if ndvi_tipo == 'escalado':
            # Datos escalados por 10000, convertir a rango 0-255
            datos = np.clip(datos, -2000, 10000)  # Clip a rango válido
            datos = ((datos + 2000) / 12000 * 255).astype(np.uint8)
        elif ndvi_tipo == 'real':
            # Datos reales -1 a 1, convertir a rango 0-255
            datos = np.clip(datos, -1, 1)
            datos = ((datos + 1) / 2 * 255).astype(np.uint8)
        else:
            # Datos desconocidos, normalizar al rango observado
            min_val = np.nanmin(datos)
            max_val = np.nanmax(datos)
            if max_val > min_val:
                datos = ((datos - min_val) / (max_val - min_val) * 255).astype(np.uint8)
            else:
                datos = np.zeros_like(datos, dtype=np.uint8)
        
        # Manejar valores NoData
        datos = np.nan_to_num(datos, nan=0, posinf=255, neginf=0)
        
        return datos
    
    def crear_mini_tile_ndvi(self, datos: np.ndarray, geotransform: tuple, 
                            proyeccion: str, output_dir: Path, 
                            base_name: str, tile_x: int, tile_y: int) -> Dict:
        """Crea un mini-tile NDVI optimizado"""
        try:
            # Nombre del tile
            tile_name = f"{base_name}_tile_{tile_x:03d}_{tile_y:03d}.tif"
            tile_path = output_dir / tile_name
            
            # Crear directorio si no existe
            tile_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Crear dataset de salida
            driver = gdal.GetDriverByName('GTiff')
            alto, ancho = datos.shape
            
            dataset = driver.Create(
                str(tile_path), ancho, alto, 1, gdal.GDT_Byte,
                options=[
                    'COMPRESS=LZW',
                    'PREDICTOR=2',
                    'TILED=YES',
                    'BLOCKXSIZE=256',
                    'BLOCKYSIZE=256'
                ]
            )
            
            if not dataset:
                raise ValueError(f"No se pudo crear {tile_path}")
            
            # Configurar georreferenciación
            dataset.SetGeoTransform(geotransform)
            dataset.SetProjection(proyeccion)
            
            # Escribir datos
            banda = dataset.GetRasterBand(1)
            banda.WriteArray(datos)
            banda.SetNoDataValue(0)
            
            # Metadatos específicos para NDVI
            banda.SetDescription("NDVI optimizado (0-255)")
            dataset.SetMetadataItem('NDVI_RANGE', '0-255')
            dataset.SetMetadataItem('ORIGINAL_TYPE', 'NDVI')
            dataset.SetMetadataItem('PROCESSOR', 'MAIRA_vegetation_processor')
            
            # Cerrar dataset
            dataset = None
            
            # Calcular información del tile
            tile_info = {
                'filename': tile_name,
                'path': str(tile_path),
                'size_bytes': tile_path.stat().st_size,
                'bounds': self.calcular_bounds_geotransform(geotransform, ancho, alto),
                'tile_x': tile_x,
                'tile_y': tile_y
            }
            
            return tile_info
            
        except Exception as e:
            logger.error(f"❌ Error creando mini-tile {tile_x},{tile_y}: {e}")
            return None
    
    def calcular_bounds_geotransform(self, geotransform: tuple, ancho: int, alto: int) -> Dict:
        """Calcula bounds a partir de geotransform"""
        x_min = geotransform[0]
        y_max = geotransform[3]
        x_max = x_min + (ancho * geotransform[1])
        y_min = y_max + (alto * geotransform[5])
        
        return {
            'west': x_min,
            'east': x_max,
            'north': y_max,
            'south': y_min
        }
    
    def crear_archivo_tar(self, tiles: List[Dict], region: str, part_num: int) -> str:
        """Crea archivo TAR.GZ con mini-tiles"""
        output_tar = self.output_dir / f"{region}_part_{part_num:02d}.tar.gz"
        
        logger.info(f"📦 Creando {output_tar} con {len(tiles)} tiles...")
        
        try:
            with tarfile.open(output_tar, 'w:gz', compresslevel=6) as tar:
                for tile in tiles:
                    tile_path = Path(tile['path'])
                    if tile_path.exists():
                        arcname = f"{region}/{tile['filename']}"
                        tar.add(tile_path, arcname=arcname)
            
            # Verificar tamaño
            size_mb = output_tar.stat().st_size / (1024 * 1024)
            logger.info(f"✅ Archivo creado: {output_tar.name} ({size_mb:.1f}MB)")
            
            # Limpiar tiles temporales
            for tile in tiles:
                tile_path = Path(tile['path'])
                if tile_path.exists():
                    tile_path.unlink()
            
            return str(output_tar)
            
        except Exception as e:
            logger.error(f"❌ Error creando TAR {output_tar}: {e}")
            return None
    
    def generar_indice_region(self, region: str, archivos_tar: List[str], tiles_info: List[Dict]) -> str:
        """Genera índice JSON para una región"""
        indice = {
            'type': 'vegetation_mini_tiles',
            'region': region,
            'version': '1.0',
            'generated': self.obtener_timestamp(),
            'total_parts': len(archivos_tar),
            'total_tiles': len(tiles_info),
            'compression': 'tar.gz',
            'archives': []
        }
        
        # Información de archivos TAR
        for i, tar_file in enumerate(archivos_tar, 1):
            tar_path = Path(tar_file)
            if tar_path.exists():
                indice['archives'].append({
                    'part': i,
                    'filename': tar_path.name,
                    'size_mb': round(tar_path.stat().st_size / (1024 * 1024), 2),
                    'tiles_count': len([t for t in tiles_info if t.get('part') == i])
                })
        
        # Índice de tiles
        indice['tiles'] = {}
        for tile in tiles_info:
            tile_key = f"tile_{tile['tile_x']:03d}_{tile['tile_y']:03d}"
            indice['tiles'][tile_key] = [{
                'filename': tile['filename'],
                'bounds': tile['bounds'],
                'part': tile.get('part', 1),
                'size_bytes': tile['size_bytes']
            }]
        
        # Guardar índice
        indice_path = self.output_dir / f"{region}_mini_tiles_index.json"
        with open(indice_path, 'w', encoding='utf-8') as f:
            json.dump(indice, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📋 Índice generado: {indice_path}")
        return str(indice_path)
    
    def obtener_timestamp(self) -> str:
        """Obtiene timestamp actual en formato ISO"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def procesar_region(self, region: str, archivos_region: List[Dict]) -> Dict:
        """Procesa todos los archivos de una región"""
        logger.info(f"🌍 Procesando región: {region} ({len(archivos_region)} archivos)")
        
        # Directorio temporal para tiles
        temp_dir = self.output_dir / 'temp' / region
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        todos_tiles = []
        archivos_tar = []
        
        try:
            # Procesar cada archivo
            for archivo_info in archivos_region:
                tiles_archivo = self.procesar_archivo_ndvi(archivo_info, temp_dir)
                todos_tiles.extend(tiles_archivo)
            
            if not todos_tiles:
                logger.warning(f"⚠️ No se generaron tiles para región {region}")
                return {'region': region, 'status': 'empty'}
            
            # Dividir tiles en parts según tamaño máximo
            part_num = 1
            tiles_actuales = []
            size_actual = 0
            
            for tile in todos_tiles:
                # Añadir tile al part actual
                tiles_actuales.append({**tile, 'part': part_num})
                size_actual += tile['size_bytes']
                
                # Verificar si necesitamos crear un nuevo part
                if size_actual >= self.max_archive_size or len(tiles_actuales) >= 1000:
                    # Crear archivo TAR
                    tar_file = self.crear_archivo_tar(tiles_actuales, region, part_num)
                    if tar_file:
                        archivos_tar.append(tar_file)
                    
                    # Reiniciar para siguiente part
                    part_num += 1
                    tiles_actuales = []
                    size_actual = 0
            
            # Procesar tiles restantes
            if tiles_actuales:
                tar_file = self.crear_archivo_tar(tiles_actuales, region, part_num)
                if tar_file:
                    archivos_tar.append(tar_file)
            
            # Generar índice de la región
            indice_path = self.generar_indice_region(region, archivos_tar, todos_tiles)
            
            # Limpiar directorio temporal
            shutil.rmtree(temp_dir, ignore_errors=True)
            
            resultado = {
                'region': region,
                'status': 'success',
                'archives': len(archivos_tar),
                'tiles': len(todos_tiles),
                'index': indice_path
            }
            
            logger.info(f"✅ Región {region} procesada: {len(archivos_tar)} archivos, {len(todos_tiles)} tiles")
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error procesando región {region}: {e}")
            shutil.rmtree(temp_dir, ignore_errors=True)
            return {'region': region, 'status': 'error', 'error': str(e)}
    
    def generar_indice_maestro(self, resultados_regiones: List[Dict]) -> str:
        """Genera índice maestro con todas las regiones"""
        indice_maestro = {
            'type': 'vegetation_master_index',
            'version': '1.0',
            'generated': self.obtener_timestamp(),
            'processor': 'MAIRA_vegetation_processor',
            'regions': {}
        }
        
        for resultado in resultados_regiones:
            if resultado['status'] == 'success':
                region = resultado['region']
                indice_maestro['regions'][region] = {
                    'total_parts': resultado['archives'],
                    'total_tiles': resultado['tiles'],
                    'index_file': Path(resultado['index']).name,
                    'base_path': f'vegetation_mini_tiles/{region}/'
                }
        
        # Guardar índice maestro
        maestro_path = self.output_dir / 'master_vegetation_index.json'
        with open(maestro_path, 'w', encoding='utf-8') as f:
            json.dump(indice_maestro, f, indent=2, ensure_ascii=False)
        
        logger.info(f"🎯 Índice maestro generado: {maestro_path}")
        return str(maestro_path)
    
    def procesar_todos(self) -> Dict:
        """Procesa todos los archivos de vegetación"""
        logger.info("🚀 Iniciando procesamiento de tiles de vegetación")
        
        # Crear directorio de salida
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Encontrar archivos
        archivos_tif = self.encontrar_archivos_tif()
        if not archivos_tif:
            logger.error("❌ No se encontraron archivos TIF de vegetación")
            return {'status': 'error', 'message': 'No hay archivos TIF'}
        
        # Analizar archivos
        archivos_info = []
        for archivo in archivos_tif:
            info = self.analizar_archivo_tif(archivo)
            if info:
                archivos_info.append(info)
        
        if not archivos_info:
            logger.error("❌ No se pudieron analizar archivos TIF")
            return {'status': 'error', 'message': 'Error analizando archivos'}
        
        # Clasificar por regiones
        regiones = self.clasificar_por_regiones(archivos_info)
        
        # Procesar cada región
        resultados = []
        for region, archivos_region in regiones.items():
            if archivos_region:  # Solo procesar regiones con archivos
                resultado = self.procesar_region(region, archivos_region)
                resultados.append(resultado)
        
        # Generar índice maestro
        indice_maestro = self.generar_indice_maestro(resultados)
        
        # Resumen final
        total_archivos = sum(1 for r in resultados if r['status'] == 'success')
        total_tiles = sum(r.get('tiles', 0) for r in resultados if r['status'] == 'success')
        
        logger.info(f"🎉 Procesamiento completo:")
        logger.info(f"   📦 Regiones procesadas: {total_archivos}")
        logger.info(f"   🧩 Total mini-tiles: {total_tiles}")
        logger.info(f"   📋 Índice maestro: {indice_maestro}")
        
        return {
            'status': 'success',
            'regions_processed': total_archivos,
            'total_tiles': total_tiles,
            'master_index': indice_maestro,
            'results': resultados
        }

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description="Procesador de tiles de vegetación NDVI para MAIRA 4.0"
    )
    parser.add_argument(
        '--input', '-i',
        required=True,
        help="Directorio con archivos TIF de vegetación"
    )
    parser.add_argument(
        '--output', '-o',
        required=True,
        help="Directorio de salida para mini-tiles"
    )
    parser.add_argument(
        '--max-size', '-s',
        type=int,
        default=95,
        help="Tamaño máximo de archivo TAR en MB (default: 95)"
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help="Modo verbose"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Verificar directorios
    input_dir = Path(args.input)
    if not input_dir.exists():
        logger.error(f"❌ Directorio de entrada no existe: {input_dir}")
        sys.exit(1)
    
    # Crear procesador
    processor = VegetationTileProcessor(
        input_dir=str(input_dir),
        output_dir=args.output,
        max_archive_size=args.max_size
    )
    
    # Procesar
    try:
        resultado = processor.procesar_todos()
        
        if resultado['status'] == 'success':
            logger.info("✅ Procesamiento exitoso")
            sys.exit(0)
        else:
            logger.error(f"❌ Error en procesamiento: {resultado.get('message', 'Error desconocido')}")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Error fatal: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
