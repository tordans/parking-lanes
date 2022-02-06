- bounds from boroughsBerlin.geojson via qgis
- export as GeoJSON
- import in initMap via
```
    var tempGetBoundsXhain = L.geoJSON({
        "type": "FeatureCollection",
        "name": "xhainBounds",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": [
        { "type": "Feature", "properties": { "id": "relation/55764", "@id": "relation/55764", "name": "Friedrichshain-Kreuzberg", "name:prefix": null, "width": 0.123214, "height": 0.048233, "area": 0.005943, "perimeter": 0.342895 }, "geometry": { "type": "Polygon", "coordinates": [ [ [ 13.3682291, 52.4827923 ], [ 13.4914434, 52.4827923 ], [ 13.4914434, 52.5310256 ], [ 13.3682291, 52.5310256 ], [ 13.3682291, 52.4827923 ] ] ] } }
        ]
        }
        ).addTo(map)
```
- results in bounds for `L.tileLayer` in bounds: `L.latLngBounds(L.latLng(52.5310256, 13.4914434), L.latLng(52.4827923, 13.3682291))`
