import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import 'leaflet.locatecontrol'
import 'leaflet-polylineoffset'
import 'leaflet-hash'
import 'leaflet-touch-helper'

import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import 'font-awesome/css/font-awesome.min.css'

import { hyper } from 'hyperhtml/esm'

import DatetimeControl from './controls/Datetime'
import AppInfoControl from './controls/AppInfo'
import LegendControl from './controls/Legend'
import LaneInfoControl from './controls/LaneInfo'
import AreaInfoControl from './controls/AreaInfo'
import FetchControl from './controls/Fetch'

import {
    parseParkingLane,
    parseChangedParkingLane,
    updateLaneColorsByDate,
    updateLaneStylesByZoom,
    getBacklights,
} from './parking-lane'

import { getLocationFromCookie, setLocationToCookie } from '../utils/location-cookie'
import { downloadBbox, osmData, resetLastBounds } from '../utils/data-client'
import { getUrl } from './data-url'
import { addChangedEntity, changesStore } from '../utils/changes-store'
import { authenticate, logout, userInfo, uploadChanges } from '../utils/osm-client'
import { type OurWindow } from '../utils/types/interfaces'
import { type OsmWay } from '../utils/types/osm-data'
import { type ParsedOsmData } from '../utils/types/osm-data-storage'
import { type ParkingAreas, type ParkingPoint, type ParkingLanes } from '../utils/types/parking'
import { parseParkingArea, updateAreaColorsByDate } from './parking-area'
import { parseParkingPoint, updatePointColorsByDate, updatePointStylesByZoom } from './parking-point'
import { AuthState, state, subscribe } from './state'

const editorName = 'PLanes'
const version = '0.8.6'

const useDevServer = false
const viewMinZoom = 15

const laneInfoControl = new LaneInfoControl({ position: 'topright' })
const areaInfoControl = new AreaInfoControl({ position: 'topright' })
const fetchControl = new FetchControl({ position: 'topright' })

// Reminder: Check `maxMaxZoomFromTileLayers` in `generateStyleMapByZoom()`
const tileLayers = {
    mapnik: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 21,
        maxNativeZoom: 19,
        className: 'mapnik_gray',
    }),
    esri: L.tileLayer('https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: "<a href='https://wiki.openstreetmap.org/wiki/Esri'>Terms & Feedback</a>",
        maxZoom: 21,
        maxNativeZoom: 19,
    }),
    maxar: L.tileLayer('https://services.digitalglobe.com/earthservice/tmsaccess/tms/1.0.0/DigitalGlobe:ImageryTileService@EPSG:3857@jpg/{z}/{x}/{-y}.jpg?connectId=c2cbd3f2-003a-46ec-9e46-26a3996d6484', {
        attribution: "<a href='https://wiki.openstreetmap.org/wiki/DigitalGlobe'>Terms & Feedback</a>",
        maxZoom: 21,
        maxNativeZoom: 20,
    }),
}

const layersControl = L.control.layers(
    {
        Mapnik: tileLayers.mapnik,
        'Esri Clarity': tileLayers.esri,
        'Maxar Premium Imagery': tileLayers.maxar,
    },
    undefined,
    { position: 'bottomright' })

export function initMap(): L.Map {
    const root = document.querySelector('#map') as HTMLElement
    const map = L.map(root, { fadeAnimation: false })

    if (!document.location.href.includes('#')) {
        const cookieLocation = getLocationFromCookie()
        map.setView(
            cookieLocation?.location ?? new L.LatLng(51.591, 24.609),
            cookieLocation?.zoom ?? 5)
    }

    tileLayers.mapnik.addTo(map)

    L.control.locate({ drawCircle: false, drawMarker: true }).addTo(map)

    new AppInfoControl({ position: 'bottomright' }).addTo(map)
    new LegendControl({ position: 'bottomleft' }).addTo(map)
    new DatetimeControl({ position: 'topright' }).addTo(map)
    fetchControl.addTo(map)
        .render(async() => await downloadParkingLanes(map))
    new InfoControl({ position: 'topright' }).addTo(map)
    new SaveControl({ position: 'topright' }).addTo(map)
    laneInfoControl.addTo(map)
    areaInfoControl.addTo(map)

    subscribe(handleDatetimeChange)
    subscribe(handleEditorChange)

    map.on('moveend', handleMapMoveEnd)
    map.on('click', closeLaneInfo)
    map.on('click', areaInfoControl.closeAreaInfo)

    layersControl.addTo(map)

    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const hash = new L.Hash(map)
    return map
}

export const InfoControl = L.Control.extend({
    onAdd: (map: L.Map) => hyper`
        <div id="min-zoom-btn"
             class="leaflet-control-layers control-padding control-bigfont control-button"
             onclick=${() => map.setZoom(viewMinZoom)}>
            Zoom in on the map
        </div>`,
})

export const SaveControl = L.Control.extend({
    onAdd: () => hyper`
        <button id="save-btn"
                class="leaflet-control-layers control-padding control-bigfont control-button save-control"
                style="display: none"
                onclick=${handleSaveClick}>
            Save
        </button>`,
})

function handleDatetimeChange(field?: string) {
    if (field === 'datetime') {
        updateLaneColorsByDate(lanes, state.datetime)
        updateAreaColorsByDate(areas, state.datetime)
        updatePointColorsByDate(points, state.datetime)
    }
}

const lanes: ParkingLanes = {}
const areas: ParkingAreas = {}
const points: ParkingPoint = {}
const markers: Record<string, L.Marker<any>> = {}

async function downloadParkingLanes(map: L.Map): Promise<void> {
    state.setFetchButtonText('Fetching data...')
    const url = getUrl(map.getBounds(), state.editorMode, useDevServer, state.osmDataSource)

    let newData: ParsedOsmData | null = null
    try {
        newData = await downloadBbox(map.getBounds(), url)
    } catch (e: any) {
        const errorMessage = e?.message === 'Request failed with status code 429' ?
            'Error: Too many requests - try again soon' :
            'Unknown error, please try again'
        state.setFetchButtonText(errorMessage)
        return
    }
    state.setFetchButtonText('Fetch parking data')

    if (!newData)
        return

    for (const way of Object.values(newData.ways)) {
        if (way.tags?.highway) {
            if (lanes['right' + way.id] || lanes['left' + way.id] || lanes['empty' + way.id])
                continue

            const newLanes = parseParkingLane(way, newData.nodeCoords, map.getZoom(), state.editorMode)
            if (newLanes !== undefined)
                addNewLanes(newLanes, map)
        } else if (way.tags?.amenity === 'parking') {
            if (areas[way.id])
                continue

            const newAreas = parseParkingArea(way, newData.nodeCoords, map.getZoom(), state.editorMode)
            if (newAreas !== undefined)
                addNewAreas(newAreas, map)
        }
    }

    for (const node of Object.values(newData.nodes)) {
        if (node.tags?.amenity === 'parking_entrance' || node.tags?.amenity === 'parking') {
            if (points[node.id])
                continue

            const newPoints = parseParkingPoint(node, map.getZoom(), state.editorMode)
            if (newPoints !== undefined)
                addNewPoint(newPoints, map)
        }
    }
}

function addNewLanes(newLanes: ParkingLanes, map: L.Map): void {
    updateLaneColorsByDate(newLanes, state.datetime)
    Object.assign(lanes, newLanes)
    for (const newLane of Object.values<L.Polyline>(newLanes)) {
        newLane.on('click', handleLaneClick)
        newLane.addTo(map)
        // L.path is added by plugin, types don't exist.
        // @ts-expect-error
        L.path.touchHelper(newLane).addTo(map)
    }
}

function handleLaneClick(e: Event | any) {
    const { map } = (window as OurWindow)
    closeLaneInfo()

    const osm: OsmWay = e.target.options.osm

    const osmId = osm.id
    const lane = lanes['right' + osmId] || lanes['left' + osmId] || lanes['empty' + osmId]
    const backligntPolylines = getBacklights(lane.getLatLngs(), map.getZoom())
    const mapCenter = map.getCenter()
    lanes.right = backligntPolylines.right.addTo(map)
    lanes.left = backligntPolylines.left.addTo(map)

    if (state.editorMode) {
        laneInfoControl.showEditForm(
            osm,
            osmData.waysInRelation,
            handleCutLaneClick,
            mapCenter,
            handleOsmChange)
    } else {
        laneInfoControl.showLaneInfo(osm, mapCenter)
    }

    L.DomEvent.stopPropagation(e)
}

function closeLaneInfo() {
    laneInfoControl.closeLaneInfo()
    areaInfoControl.closeAreaInfo()

    for (const marker in markers) {
        markers[marker].remove()
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete markers[marker]
    }

    lanes.right?.remove()
    lanes.left?.remove()
}

function addNewAreas(newAreas: ParkingAreas, map: L.Map): void {
    updateAreaColorsByDate(newAreas, state.datetime)
    Object.assign(areas, newAreas)
    for (const newArea of Object.values<L.Polyline>(newAreas)) {
        newArea.on('click', handleAreaClick)
        newArea.addTo(map)
        // L.path is added by plugin, types don't exist.
        // @ts-expect-error
        L.path.touchHelper(newArea).addTo(map)
    }
}

function handleAreaClick(e: Event | any) {
    areaInfoControl.closeAreaInfo()
    closeLaneInfo()
    const osm: OsmWay = e.target.options.osm
    areaInfoControl.showAreaInfo(osm)
    L.DomEvent.stopPropagation(e)
}

function addNewPoint(newPoints: ParkingPoint, map: L.Map): void {
    updatePointColorsByDate(newPoints, state.datetime)
    Object.assign(points, newPoints)
    for (const newPoint of Object.values<L.Marker>(newPoints)) {
        newPoint.on('click', handleAreaClick)
        newPoint.addTo(map)
        // L.path is added by plugin, types don't exist.
        // L.path.touchHelper(newArea).addTo(map)
    }
}

// Map move handler

function handleMapMoveEnd() {
    const { map } = (window as OurWindow)
    const zoom = map.getZoom()
    const center = map.getCenter()
    const bounds = map.getBounds()

    state.setMapState({
        zoom,
        center,
        bounds: {
            south: bounds.getSouth(),
            west: bounds.getWest(),
            north: bounds.getNorth(),
            east: bounds.getEast(),
        },
    })
    setLocationToCookie(center, zoom)

    updateLaneStylesByZoom(lanes, zoom)
    updatePointStylesByZoom(points, zoom);

    (document.getElementById('min-zoom-btn') as HTMLButtonElement).style.display =
        zoom < viewMinZoom ? 'block' : 'none'

    if (zoom < viewMinZoom)
        return

    // Eslint: This worked before, so lets keep it; adding await will create new TS issues.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    downloadParkingLanes(map)
}

// Editor

async function handleEditorChange(field?: string) {
    if (field !== 'editorMode')
        return

    const { map } = (window as OurWindow)

    if (state.editorMode) {
        try {
            await authenticate(useDevServer)
            try {
                await userInfo()
            } catch {
                logout()
                await authenticate(useDevServer)
            }
            state.setAuthState(AuthState.success)
            resetLastBounds()
            handleMapMoveEnd()
        } catch (err) {
            state.setAuthState(AuthState.fail)
            state.setEditorMode(false)
            alert(err)
        }
    } else {
        if (map.hasLayer(tileLayers.esri)) {
            map.removeLayer(tileLayers.esri)
            map.addLayer(tileLayers.mapnik)
            tileLayers.mapnik.addTo(map)
        }

        state.setAuthState(AuthState.initial)

        for (const lane in lanes) {
            if (lane.startsWith('empty')) {
                lanes[lane].remove()
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete lanes[lane]
            }
        }
    }
}

function handleOsmChange(newOsm: OsmWay) {
    const { map } = (window as OurWindow)
    const newLanes = parseChangedParkingLane(newOsm, lanes, state.datetime, map.getZoom())
    updateLaneColorsByDate(newLanes, state.datetime)
    for (const newLane of newLanes) {
        newLane.on('click', handleLaneClick)
        newLane.addTo(map)
        // @ts-expect-error
        L.path.touchHelper(newLane).addTo(map)
    }

    const changesCount = addChangedEntity(newOsm)
    const saveBtn = (document.getElementById('save-btn') as HTMLButtonElement)
    saveBtn.innerText = 'Save (' + changesCount + ')'
    saveBtn.style.display = 'block'
}

async function handleSaveClick() {
    try {
        const changedIdMap = await uploadChanges(editorName, version, changesStore)
        for (const oldId in changedIdMap) {
            for (const side of ['right', 'left', 'empty']) {
                if (lanes[side + oldId]) {
                    lanes[side + changedIdMap[oldId]] = lanes[side + oldId]
                    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                    delete lanes[side + oldId]
                }
            }
        }
        (document.getElementById('save-btn') as HTMLButtonElement).style.display = 'none'
    } catch (err) {
        if (err instanceof XMLHttpRequest)
            alert(err.responseText || err)
        else
            alert(err)
    }
}

const cutIcon = L.divIcon({
    className: 'cut-icon',
    iconSize: new L.Point(20, 20),
    html: '✂',
})

function handleCutLaneClick(osm: OsmWay) {
    if (Object.keys(markers).length > 0)
        return

    const { map } = (window as OurWindow)
    for (const nd of osm.nodes.slice(1, osm.nodes.length - 1)) {
        markers[nd] = L.marker(
            osmData.nodeCoords[nd],
            {
                icon: cutIcon,
                // @ts-expect-error
                ndId: nd,
                wayId: osm.id,
            })
            .on('click', cutWay)
            .addTo(map)
    }
}

let newWayId = -1

function cutWay(arg: any) {
    const oldWay = osmData.ways[arg.target.options.wayId]
    const newWay: OsmWay = JSON.parse(JSON.stringify(oldWay))

    const ndIndex = oldWay.nodes.findIndex(e => e === arg.target.options.ndId)

    oldWay.nodes = oldWay.nodes.slice(0, ndIndex + 1)
    newWay.nodes = newWay.nodes.slice(ndIndex)
    newWay.id = newWayId--
    newWay.version = 1
    delete newWay.user
    delete newWay.uid
    delete newWay.timestamp

    lanes['right' + oldWay.id]?.setLatLngs(oldWay.nodes.map(x => osmData.nodeCoords[x]))
    lanes['left' + oldWay.id]?.setLatLngs(oldWay.nodes.map(x => osmData.nodeCoords[x]))
    lanes['empty' + oldWay.id]?.setLatLngs(oldWay.nodes.map(x => osmData.nodeCoords[x]))

    lanes.left?.setLatLngs(oldWay.nodes.map(x => osmData.nodeCoords[x]))
    lanes.right?.setLatLngs(oldWay.nodes.map(x => osmData.nodeCoords[x]))

    for (const marker in markers) {
        markers[marker].remove()
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete markers[marker]
    }

    osmData.ways[newWay.id] = newWay
    const { map } = (window as OurWindow)
    const newLanes = parseParkingLane(newWay, osmData.nodeCoords, map.getZoom(), state.editorMode)
    if (newLanes !== undefined)
        addNewLanes(newLanes, map)

    addChangedEntity(newWay)
    const changesCount = addChangedEntity(oldWay)
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
    saveBtn.innerText = 'Save (' + changesCount + ')'
    saveBtn.style.display = 'block'
}
