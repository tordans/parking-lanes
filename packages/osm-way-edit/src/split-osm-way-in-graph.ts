import type { OsmRelation, OsmWay } from '@osm-editor-kit/osm-data'
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import { splitOsmWayAtNode, type SplitOsmWayResult } from './split-osm-way'
import { hasFromViaTo, parentRelations } from './way-split-relations'

const CIRCULAR_JUNCTIONS = ['roundabout', 'circular'] as const

export type SplitOsmWayInGraphResult = SplitOsmWayResult & {
  graph: ParsedOsmData
  modifiedRelations: OsmRelation[]
}

function isClosedWay(way: OsmWay): boolean {
  return way.nodes.length >= 2 && way.nodes[0] === way.nodes[way.nodes.length - 1]
}

function connects(way1: OsmWay, way2: OsmWay): boolean {
  if (way1.nodes.length < 2 || way2.nodes.length < 2) return false

  if (
    CIRCULAR_JUNCTIONS.includes(way1.tags.junction as (typeof CIRCULAR_JUNCTIONS)[number]) &&
    isClosedWay(way1)
  ) {
    return way1.nodes.some(
      (nodeId) => nodeId === way2.nodes[0] || nodeId === way2.nodes[way2.nodes.length - 1],
    )
  }
  if (
    CIRCULAR_JUNCTIONS.includes(way2.tags.junction as (typeof CIRCULAR_JUNCTIONS)[number]) &&
    isClosedWay(way2)
  ) {
    return way2.nodes.some(
      (nodeId) => nodeId === way1.nodes[0] || nodeId === way1.nodes[way1.nodes.length - 1],
    )
  }

  const end1 = way1.nodes[way1.nodes.length - 1]!
  const start1 = way1.nodes[0]!
  const end2 = way2.nodes[way2.nodes.length - 1]!
  const start2 = way2.nodes[0]!
  return end1 === end2 || end1 === start2 || start1 === end2 || start1 === start2
}

function membersByRole(relation: OsmRelation, role: string) {
  return relation.members.filter((member) => member.role === role)
}

function replaceWayMember(
  relation: OsmRelation,
  oldWayId: number,
  newWayId: number,
  role: string,
): OsmRelation {
  return {
    ...relation,
    members: relation.members.map((member) =>
      member.type === 'way' && member.ref === oldWayId
        ? { type: 'way', ref: newWayId, role }
        : member,
    ),
  }
}

function addWayMemberAt(
  relation: OsmRelation,
  wayId: number,
  role: string,
  index: number,
): OsmRelation {
  const members = [...relation.members]
  members.splice(index, 0, { type: 'way', ref: wayId, role })
  return { ...relation, members }
}

function splitWayMember(
  graph: ParsedOsmData,
  relation: OsmRelation,
  wayA: OsmWay,
  wayB: OsmWay,
): OsmRelation {
  const insertMembers: { at: number; role: string }[] = []
  const members = relation.members

  for (let index = 0; index < members.length; index++) {
    const member = members[index]!
    if (member.type !== 'way' || member.ref !== wayA.id) continue

    let wayAconnectsPrev = false
    let wayAconnectsNext = false
    let wayBconnectsPrev = false
    let wayBconnectsNext = false

    if (index > 0) {
      const prevMember = members[index - 1]!
      const prevWay = prevMember.type === 'way' ? graph.ways[prevMember.ref] : undefined
      if (prevWay) {
        wayAconnectsPrev = connects(prevWay, wayA)
        wayBconnectsPrev = connects(prevWay, wayB)
      }
    }
    if (index < members.length - 1) {
      const nextMember = members[index + 1]!
      const nextWay = nextMember.type === 'way' ? graph.ways[nextMember.ref] : undefined
      if (nextWay) {
        wayAconnectsNext = connects(nextWay, wayA)
        wayBconnectsNext = connects(nextWay, wayB)
      }
    }

    if (
      (wayAconnectsPrev && !wayAconnectsNext) ||
      (!wayBconnectsPrev && wayBconnectsNext && !(!wayAconnectsPrev && wayAconnectsNext))
    ) {
      insertMembers.push({ at: index + 1, role: member.role })
      continue
    }
    if (
      (!wayAconnectsPrev && wayAconnectsNext) ||
      (wayBconnectsPrev && !wayBconnectsNext && !(wayAconnectsPrev && !wayAconnectsNext))
    ) {
      insertMembers.push({ at: index, role: member.role })
      continue
    }

    if (wayAconnectsPrev && wayBconnectsPrev && wayAconnectsNext && wayBconnectsNext) {
      if (index > 2) {
        const prev2Member = members[index - 2]!
        const prev2Way = prev2Member.type === 'way' ? graph.ways[prev2Member.ref] : undefined
        if (prev2Way) {
          if (connects(prev2Way, wayA) && !connects(prev2Way, wayB)) {
            insertMembers.push({ at: index, role: member.role })
            continue
          }
          if (connects(prev2Way, wayB) && !connects(prev2Way, wayA)) {
            insertMembers.push({ at: index + 1, role: member.role })
            continue
          }
        }
      }
      if (index < members.length - 2) {
        const next2Member = members[index + 2]!
        const next2Way = next2Member.type === 'way' ? graph.ways[next2Member.ref] : undefined
        if (next2Way) {
          if (connects(next2Way, wayA) && !connects(next2Way, wayB)) {
            insertMembers.push({ at: index + 1, role: member.role })
            continue
          }
          if (connects(next2Way, wayB) && !connects(next2Way, wayA)) {
            insertMembers.push({ at: index, role: member.role })
            continue
          }
        }
      }
    }

    if (wayA.nodes[wayA.nodes.length - 1] === wayB.nodes[0]) {
      insertMembers.push({ at: index + 1, role: member.role })
    } else {
      insertMembers.push({ at: index, role: member.role })
    }
  }

  let updated = relation
  for (const item of [...insertMembers].reverse()) {
    updated = addWayMemberAt(updated, wayB.id, item.role, item.at)
  }
  return updated
}

function rewriteRestrictionRelation(
  graph: ParsedOsmData,
  relation: OsmRelation,
  wayA: OsmWay,
  wayB: OsmWay,
): OsmRelation {
  const fromMembers = membersByRole(relation, 'from')
  const viaMembers = [...membersByRole(relation, 'via'), ...membersByRole(relation, 'intersection')]
  const toMembers = membersByRole(relation, 'to')
  const from = fromMembers[0]
  const to = toMembers[0]

  if (from?.type === 'way' && from.ref === wayA.id) {
    return rewriteFromToHalf(graph, relation, wayA, wayB, viaMembers)
  }
  if (to?.type === 'way' && to.ref === wayA.id) {
    return rewriteFromToHalf(graph, relation, wayA, wayB, viaMembers)
  }

  let updated = relation
  for (const via of viaMembers) {
    if (via.type === 'way' && via.ref === wayA.id) {
      updated = splitWayMember(graph, updated, wayA, wayB)
    }
  }
  return updated
}

function rewriteFromToHalf(
  graph: ParsedOsmData,
  relation: OsmRelation,
  wayA: OsmWay,
  wayB: OsmWay,
  viaMembers: OsmRelation['members'],
): OsmRelation {
  let keepB = false
  if (viaMembers.length === 1 && viaMembers[0]!.type === 'node') {
    keepB = wayB.nodes.includes(viaMembers[0]!.ref)
  } else {
    for (const via of viaMembers) {
      if (via.type !== 'way') continue
      const viaWay = graph.ways[via.ref]
      if (!viaWay) continue
      if (viaWay.nodes.some((nodeId) => wayB.nodes.includes(nodeId))) {
        keepB = true
        break
      }
    }
  }

  if (!keepB) return relation
  const member = relation.members.find((entry) => entry.type === 'way' && entry.ref === wayA.id)
  return replaceWayMember(relation, wayA.id, wayB.id, member?.role ?? '')
}

function markWayInRelation(graph: ParsedOsmData, wayId: number): ParsedOsmData {
  if (graph.waysInRelation[wayId]) return graph
  return {
    ...graph,
    waysInRelation: { ...graph.waysInRelation, [wayId]: true },
  }
}

function relationAddsWay(relation: OsmRelation, wayId: number): boolean {
  return relation.members.some((member) => member.type === 'way' && member.ref === wayId)
}

/**
 * Split a way in a parsed OSM graph and rewrite parent relations (iD-style).
 */
export function splitOsmWayAtNodeInGraph(
  graph: ParsedOsmData,
  wayId: number,
  nodeId: number,
  newWayId: number,
): SplitOsmWayInGraphResult | null {
  const way = graph.ways[wayId]
  if (!way) return null

  const split = splitOsmWayAtNode(way, nodeId, newWayId)
  if (!split) return null

  let nextGraph: ParsedOsmData = {
    ...graph,
    ways: {
      ...graph.ways,
      [wayId]: split.oldWay,
      [newWayId]: split.newWay,
    },
  }

  const modifiedRelations: OsmRelation[] = []
  const parents = parentRelations(graph, wayId)

  for (const parent of parents) {
    const before = nextGraph.relations[parent.id]
    if (!before) continue

    let updated: OsmRelation
    if (hasFromViaTo(before)) {
      updated = rewriteRestrictionRelation(nextGraph, before, split.oldWay, split.newWay)
    } else {
      updated = splitWayMember(nextGraph, before, split.oldWay, split.newWay)
    }

    if (updated !== before) {
      nextGraph = {
        ...nextGraph,
        relations: { ...nextGraph.relations, [parent.id]: updated },
      }
      modifiedRelations.push(updated)
      if (relationAddsWay(updated, newWayId)) {
        nextGraph = markWayInRelation(nextGraph, newWayId)
      }
    }
  }

  return {
    graph: nextGraph,
    oldWay: split.oldWay,
    newWay: split.newWay,
    modifiedRelations,
  }
}
