import type { OsmRelation, OsmWay } from '@osm-editor-kit/osm-data'
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'

export type WaySplitRelationAssessment = 'ok' | 'parent_incomplete' | 'simple_roundabout'

const CIRCULAR_JUNCTIONS = ['roundabout', 'circular'] as const
const ROUNDABOUT_RELATION_TYPE_EXCEPTIONS = ['junction', 'enforcement'] as const

export function graphHasEntity(
  graph: ParsedOsmData,
  ref: number,
  type: 'node' | 'way' | 'relation',
): boolean {
  if (type === 'way') return ref in graph.ways
  if (type === 'node') return ref in graph.nodeCoords || ref in graph.nodes
  return ref in graph.relations
}

/** Parent relations that list `wayId` as a way member. */
export function parentRelations(graph: ParsedOsmData, wayId: number): OsmRelation[] {
  const parents: OsmRelation[] = []
  for (const relation of Object.values(graph.relations)) {
    if (relation.members.some((member) => member.type === 'way' && member.ref === wayId)) {
      parents.push(relation)
    }
  }
  return parents
}

/** Turn restrictions and destination_sign relations with from/via/to roles. */
export function hasFromViaTo(relation: OsmRelation): boolean {
  const hasFrom = relation.members.some((member) => member.role === 'from')
  const hasVia = relation.members.some(
    (member) =>
      member.role === 'via' ||
      (member.role === 'intersection' && relation.tags.type === 'destination_sign'),
  )
  const hasTo = relation.members.some((member) => member.role === 'to')
  return hasFrom && hasVia && hasTo
}

function isClosedWay(way: OsmWay): boolean {
  return way.nodes.length >= 2 && way.nodes[0] === way.nodes[way.nodes.length - 1]
}

function isSimpleRoundabout(way: OsmWay): boolean {
  const junction = way.tags.junction
  return (
    junction != null &&
    CIRCULAR_JUNCTIONS.includes(junction as (typeof CIRCULAR_JUNCTIONS)[number]) &&
    isClosedWay(way)
  )
}

/**
 * Mirrors iD split `action.disabled` relation checks for a single way.
 * Returns the first blocking reason found across parent relations.
 */
export function assessWaySplitRegardingRelations(
  graph: ParsedOsmData,
  wayId: number,
): WaySplitRelationAssessment {
  const way = graph.ways[wayId]
  if (!way) return 'ok'

  for (const parentRelation of parentRelations(graph, wayId)) {
    if (hasFromViaTo(parentRelation)) {
      const vias = parentRelation.members.filter(
        (member) =>
          member.role === 'via' ||
          (member.role === 'intersection' && parentRelation.tags.type === 'destination_sign'),
      )
      if (!vias.every((via) => graphHasEntity(graph, via.ref, via.type))) {
        return 'parent_incomplete'
      }
    } else {
      for (let index = 0; index < parentRelation.members.length; index++) {
        const member = parentRelation.members[index]!
        if (member.type !== 'way' || member.ref !== wayId) continue

        const memberBeforePresent =
          index > 0 &&
          graphHasEntity(
            graph,
            parentRelation.members[index - 1]!.ref,
            parentRelation.members[index - 1]!.type,
          )
        const memberAfterPresent =
          index < parentRelation.members.length - 1 &&
          graphHasEntity(
            graph,
            parentRelation.members[index + 1]!.ref,
            parentRelation.members[index + 1]!.type,
          )
        if (!memberBeforePresent && !memberAfterPresent && parentRelation.members.length > 1) {
          return 'parent_incomplete'
        }
      }
    }

    const relationType = parentRelation.tags.type ?? ''
    if (
      isSimpleRoundabout(way) &&
      !ROUNDABOUT_RELATION_TYPE_EXCEPTIONS.includes(
        relationType as (typeof ROUNDABOUT_RELATION_TYPE_EXCEPTIONS)[number],
      )
    ) {
      return 'simple_roundabout'
    }
  }

  return 'ok'
}
