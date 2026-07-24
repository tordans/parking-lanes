import { useParkingOsmQuery } from './parking-osm-query'
import {
  updateAreaFeatureColors,
  updatePointFeatureColors,
  updatePointFeatureStyles,
} from './parse-areas-points'
import { updateLaneFeatureColors, updateLaneFeatureStyles } from './parse-lanes'
import { parseParkingFeaturesFromData } from './parse-parking-data'
import type { MapBounds, ParkingFeatureCollection } from './types'

function emptyCollection(): ParkingFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function deriveParkingMapFeatures(
  graph: Parameters<typeof parseParkingFeaturesFromData>[0],
  bounds: MapBounds | undefined,
  zoom: number,
  datetime: Date,
  editorMode: boolean,
): {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
} {
  if (!bounds) {
    return { lanes: emptyCollection(), areas: emptyCollection(), points: emptyCollection() }
  }

  const { lanes, areas, points } = parseParkingFeaturesFromData(graph, bounds, zoom, editorMode)

  const wayTags = Object.fromEntries(Object.values(graph.ways).map((way) => [way.id, way.tags]))
  const nodeTags = Object.fromEntries(
    Object.values(graph.nodes).map((node) => [node.id, node.tags]),
  )
  const relationTags = Object.fromEntries(
    Object.values(graph.relations).map((relation) => [relation.id, relation.tags]),
  )

  const styledLanes = updateLaneFeatureStyles(
    updateLaneFeatureColors(lanes, datetime, wayTags),
    zoom,
  )
  const coloredAreas = updateAreaFeatureColors(areas, datetime, wayTags, relationTags)
  const styledPoints = updatePointFeatureStyles(
    updatePointFeatureColors(points, datetime, nodeTags),
    zoom,
  )

  return {
    lanes: { type: 'FeatureCollection', features: styledLanes },
    areas: { type: 'FeatureCollection', features: coloredAreas },
    points: { type: 'FeatureCollection', features: styledPoints },
  }
}

export function useParkingMapFeatures({
  bounds,
  zoom,
  datetime,
  editorMode,
}: {
  bounds: MapBounds | undefined
  zoom: number
  datetime: Date
  editorMode: boolean
}) {
  const { data } = useParkingOsmQuery({
    select: (osmData) =>
      deriveParkingMapFeatures(osmData.graph, bounds, zoom, datetime, editorMode),
  })

  return (
    data ?? {
      lanes: emptyCollection(),
      areas: emptyCollection(),
      points: emptyCollection(),
    }
  )
}
