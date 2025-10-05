const HexGrid = {
    map: null,
    hexSize: 3000, // Tamaño fijo de 3 km en metros
    grid: new Map(),
    hexLayer: null,
    originLatLng: null,

    initialize: function(map) {
        console.log("Inicializando HexGrid");
        this.map = map;
        this.hexLayer = L.layerGroup().addTo(map);

        // Establecer punto de origen (esquina inferior izquierda)
        const bounds = map.getBounds();
        this.originLatLng = bounds.getSouthWest();

        this.createInitialGrid();

        // Eventos del mapa
        map.on('moveend', this.updateVisibleHexagons.bind(this));
        map.on('zoomend', this.handleZoomChange.bind(this));

        console.log("HexGrid inicializado");
    },

    createInitialGrid: function() {
        const bounds = this.map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();

        // Buffer para área visible
        const buffer = 0.1;
        const extendedBounds = {
            latMin: southWest.lat - buffer,
            latMax: northEast.lat + buffer,
            lngMin: southWest.lng - buffer,
            lngMax: northEast.lng + buffer
        };

        // Calcular dimensiones en metros
        const widthInMeters = this.getDistanceInMeters(
            { lat: extendedBounds.latMin, lng: extendedBounds.lngMin },
            { lat: extendedBounds.latMin, lng: extendedBounds.lngMax }
        );
        const heightInMeters = this.getDistanceInMeters(
            { lat: extendedBounds.latMin, lng: extendedBounds.lngMin },
            { lat: extendedBounds.latMax, lng: extendedBounds.lngMin }
        );

        // Calcular número de hexágonos
        const columnas = Math.ceil(widthInMeters / (this.hexSize * 1.5)) + 2;
        const filas = Math.ceil(heightInMeters / (this.hexSize * Math.sqrt(3))) + 2;

        // Crear grid usando coordenadas axiales (q,r,s)
        for (let r = -filas; r < filas; r++) {
            for (let q = -columnas; q < columnas; q++) {
                const hex = { q, r, s: -q - r };
                const hexCenter = this.calculateHexCenter(hex);

                if (this.isWithinBounds(hexCenter)) {
                    const hexKey = `${hex.q},${hex.r},${hex.s}`;
                    
                    if (!this.grid.has(hexKey)) {
                        const corners = this.getHexCorners(hexCenter);
                        const polygon = L.polygon(corners, {

                            weight: 1,
                            opacity: 0.5,
                            fillOpacity: 0,
                            className: 'hex-cell'
                        }).addTo(this.hexLayer);

                        // ✅ EVENTO DOBLE CLICK para selección temporal de hexágonos
                        polygon.on('dblclick', (e) => {
                            L.DomEvent.stopPropagation(e);
                            this.selectHexagon(hexKey, polygon);
                        });

                        this.grid.set(hexKey, {
                            polygon: polygon,
                            hex: hex,
                            center: hexCenter
                        });
                    }
                }
            }
        }
    },

    calculateHexCenter: function(hex) {
        // Convertir coordenadas hexagonales a metros desde el origen
        const x = this.hexSize * (3/2 * hex.q);
        const y = this.hexSize * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);

        // Convertir a grados desde el origen
        const latLngPerMeterLat = 1 / 111320;
        const latLngPerMeterLng = 1 / (40075000 * Math.cos(this.originLatLng.lat * Math.PI / 180) / 360);

        const latOffset = y * latLngPerMeterLat;
        const lngOffset = x * latLngPerMeterLng;

        return L.latLng(
            this.originLatLng.lat + latOffset,
            this.originLatLng.lng + lngOffset
        );
    },

    getHexCorners: function(center) {
        const corners = [];
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const x = this.hexSize * Math.cos(angle);
            const y = this.hexSize * Math.sin(angle);

            // Convertir el desplazamiento a grados
            const latLngPerMeter = 1 / 111319.9;
            const latOffset = y * latLngPerMeter;
            const lngOffset = x * latLngPerMeter / Math.cos(center.lat * Math.PI / 180);

            corners.push(L.latLng(
                center.lat + latOffset,
                center.lng + lngOffset
            ));
        }
        return corners;
    },

    getDistanceInMeters: function(southWest, northEast) {
        const R = 6371000;
        const lat1 = this.degToRad(southWest.lat);
        const lat2 = this.degToRad(northEast.lat);
        const deltaLat = this.degToRad(northEast.lat - southWest.lat);
        const deltaLng = this.degToRad(northEast.lng - southWest.lng);

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    },

    degToRad: function(degrees) {
        return degrees * (Math.PI / 180);
    },

    isWithinBounds: function(center) {
        return this.map.getBounds().contains(center);
    },

    updateVisibleHexagons: function() {
        console.log("Actualizando hexágonos visibles...");
        this.createInitialGrid();
    },

    handleZoomChange: function() {
        console.log("Zoom cambiado, manteniendo tamaño fijo de hexágonos");
    },

    // Obtener el hexágono en una posición dada
    getHexagonAt: function(latLng) {
        if (!latLng) return null;

        // Convertir la posición del clic a coordenadas hexagonales
        const hex = this.pixelToHex(latLng);
        const hexKey = `${hex.q},${hex.r},${hex.s}`;

        // Buscar el hexágono en la grid
        const hexData = this.grid.get(hexKey);
        
        if (hexData && this.isPointInHexagon(latLng, hexData.polygon)) {
            return hexData;
        }

        return null;
    },

    // Convertir coordenadas lat/lng a coordenadas hexagonales
    pixelToHex: function(latLng) {
        // Convertir lat/lng a metros desde el origen
        const latDiff = (latLng.lat - this.originLatLng.lat) * 111320;
        const lngDiff = (latLng.lng - this.originLatLng.lng) * 
                       (40075000 * Math.cos(this.originLatLng.lat * Math.PI / 180) / 360);

        // Convertir metros a coordenadas hexagonales
        const x = lngDiff;
        const y = latDiff;

        // Convertir coordenadas cartesianas a hexagonales
        const q = (2/3 * x) / this.hexSize;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / this.hexSize;
        const s = -q - r;

        // Redondear a las coordenadas hexagonales más cercanas
        const roundedHex = this.roundHex({ q, r, s });
        return roundedHex;
    },

    // Redondear coordenadas hexagonales fraccionarias al hexágono más cercano
    roundHex: function(hex) {
        let rq = Math.round(hex.q);
        let rr = Math.round(hex.r);
        let rs = Math.round(hex.s);

        const qDiff = Math.abs(rq - hex.q);
        const rDiff = Math.abs(rr - hex.r);
        const sDiff = Math.abs(rs - hex.s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        } else {
            rs = -rq - rr;
        }

        return { q: rq, r: rr, s: rs };
    },

    // Verificar si un punto está dentro de un hexágono
    isPointInHexagon: function(point, polygon) {
        if (!polygon || !polygon.getLatLngs) return false;

        const vertices = polygon.getLatLngs()[0];
        let inside = false;

        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].lat;
            const yi = vertices[i].lng;
            const xj = vertices[j].lat;
            const yj = vertices[j].lng;

            const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
                (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    },

    // ✅ SELECCIÓN TEMPORAL DE HEXÁGONOS por doble click
    currentSelection: null,

    selectHexagon: function(hexKey, polygon) {
        // Limpiar selección anterior
        this.clearSelection();

        // Seleccionar nuevo hexágono (temporal, amarillo)
        this.currentSelection = { hexKey, polygon };
        polygon.getElement().classList.add('hex-selected');
        console.log('🔸 Hexágono seleccionado temporalmente:', hexKey);

        // Opcional: auto-limpiar después de unos segundos
        setTimeout(() => {
            if (this.currentSelection && this.currentSelection.hexKey === hexKey) {
                this.clearSelection();
            }
        }, 3000);
    },

    clearSelection: function() {
        if (this.currentSelection && this.currentSelection.polygon) {
            const element = this.currentSelection.polygon.getElement();
            if (element && element.classList) {
                element.classList.remove('hex-selected');
                console.log('🔸 Selección temporal limpiada:', this.currentSelection.hexKey);
            } else {
                console.warn('⚠️ Elemento del hexágono no disponible para limpiar selección');
            }
            this.currentSelection = null;
        }
    },

    // Función para compatibilidad con sistema existente
    clearAllSelections: function() {
        this.clearSelection();
        console.log('🔸 Selección temporal limpiada');
    }
};


window.HexGrid = HexGrid;

