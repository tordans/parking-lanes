import L from 'leaflet'
import { boroughsBerlin } from './boroughsBerlin.geojson'

export function addBoroughsLayer(map) {
    function boroughStyle(feature) {
        const base = {
            color: 'purple',
            weight: 5,
            dashArray: [5, 10],
            opacity: 0.5,
            fillColor: 'transparent',
            fillOpacity: 0,
        }
        const xhain = {
            color: 'blue',
            dashArray: [],
        }
        return feature.properties.name === 'Friedrichshain-Kreuzberg' ? { ...base, ...xhain } : base
    }

    L.geoJSON(boroughsBerlin, { style: boroughStyle }).addTo(map)
}
