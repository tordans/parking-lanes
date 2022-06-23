import L from 'leaflet'
import { hyper } from 'hyperhtml/esm'
import { idEditorUrl } from '../../utils/links'
import { OsmNode, OsmRelation, OsmWay } from '../../utils/types/osm-data'

export default L.Control.extend({
    onAdd: () => hyper`
        <div id="area-control"
             class="leaflet-control-layers control-padding"
             style="display: none"
             onmousedown=${L.DomEvent.stopPropagation}
             ondblclick=${L.DomEvent.stopPropagation}
             onpointerdown=${L.DomEvent.stopPropagation}
             onclick=${L.DomEvent.stopPropagation} />`,

    showAreaInfo(osm: OsmNode | OsmWay | OsmRelation) {
        const areainfo = document.getElementById('area-control')
        if (areainfo === null)
            return

        areainfo.appendChild(getPanel(osm, getAreaInfo(osm)))
        areainfo.style.display = 'block'
    },

    closeAreaInfo() {
        const areainfo = document.getElementById('area-control')
        if (areainfo === null)
            return

        areainfo.style.display = 'none'
        areainfo.innerHTML = ''
    },
})

function getPanel(osm: OsmNode | OsmWay | OsmRelation, body: any) {
    return hyper`
        <div>
            <div style="min-width:250px">
                <a href="https://openstreetmap.org/${osm.type}/${osm.id}" target="_blank">View in OSM</a>
                <span style="float:right">
                    Edit:
                    <a href="${idEditorUrl({ osmObjectType: 'way', osmObjectId: osm.id })}"
                       target="_blank">iD</a>
                </span>
            </div>
            <hr>
            ${body}
        </div>`
}

export function getAreaInfo(osm: OsmNode | OsmWay | OsmRelation) {
    return hyper`
        <table>
            ${Object.keys(osm.tags).map(tag => hyper`
                <tr>
                    <td>${tag}</td>
                    <td>${osm.tags[tag]}</td>
                </tr>
            `)}
        </table>`
}
