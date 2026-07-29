import { describe, expect, test } from 'bun:test'
import {
  buildRoadSpaceSegment,
  layoutRoadSpace,
  type RoadSpaceChain,
} from '@osm-editor-kit/osm-lane-diagram'
import { parseWayLanes } from '@osm-editor-kit/osm-lanes'
import { nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import {
  buildMatrixColumns,
  edgePatchForRow,
  getMatrixCell,
  ON_CARRIAGEWAY_CYCLE_INDEX_BASE,
  onCarriagewayCycleSide,
} from '../modes/lanes/domain/lanes-matrix-model'

function sceneFor(tags: Record<string, string>, wayId = 1) {
  const segment = buildRoadSpaceSegment(tags, { wayId, role: 'current' })
  const chain: RoadSpaceChain = { segments: [segment] }
  return layoutRoadSpace(chain)
}

describe('edge-slot nestSideTags write path', () => {
  test('width / surface / smoothness: parse → patch → nest → re-read', () => {
    const tags = {
      highway: 'residential',
      lanes: '2',
      sidewalk: 'both',
      'sidewalk:right:width': '1.5',
      'sidewalk:right:surface': 'paving_stones',
    }
    const scene = sceneFor(tags)
    const columns = buildMatrixColumns(scene, tags)
    const right = columns.find((c) => c.edge?.prefix === 'sidewalk' && c.edge.side === 'right')
    expect(right).toBeDefined()
    expect(right!.isEdge).toBe(true)

    const model = parseWayLanes(tags)
    const widthCell = getMatrixCell('width', right!, model, tags, false)
    expect(widthCell.editable).toBe(true)
    expect(widthCell.writePath).toBe('nestSideTags')
    expect(widthCell.display).toBe('1.5')

    const surfaceCell = getMatrixCell('surface', right!, model, tags, false)
    expect(surfaceCell.display).toBe('paving_stones')

    let next = nestSideTags(tags, 'sidewalk', 'right', edgePatchForRow('width', '1.8')!)
    next = nestSideTags(next, 'sidewalk', 'right', edgePatchForRow('surface', 'asphalt')!)
    next = nestSideTags(next, 'sidewalk', 'right', edgePatchForRow('smoothness', 'good')!)

    expect(next['sidewalk:right:width']).toBe('1.8')
    expect(next['sidewalk:right:surface']).toBe('asphalt')
    expect(next['sidewalk:right:smoothness']).toBe('good')

    const again = getMatrixCell('smoothness', right!, model, next, false)
    expect(again.display).toBe('good')
    expect(again.provenance).toBe('tagged')

    const turnCell = getMatrixCell('turn', right!, model, next, false)
    expect(turnCell.editable).toBe(false)
    expect(turnCell.readOnlyReason).toBe('edge_na')
  })
})

describe('on-carriageway cycle-lane nestSideTags write path', () => {
  test('cycleway:right=lane reads and writes width/surface via nestSideTags', () => {
    const tags = {
      highway: 'residential',
      lanes: '2',
      'cycleway:right': 'lane',
      'cycleway:right:width': '1.4',
      'cycleway:right:surface': 'asphalt',
    }
    const scene = sceneFor(tags)
    const columns = buildMatrixColumns(scene, tags)
    const cycleCol = columns.find(
      (c) => c.kind === 'cycle' && c.edge?.prefix === 'cycleway' && c.edge.side === 'right',
    )
    expect(cycleCol).toBeDefined()
    expect(cycleCol!.isEdge).toBe(false)
    expect(cycleCol!.lane?.index).toBeGreaterThanOrEqual(ON_CARRIAGEWAY_CYCLE_INDEX_BASE)
    expect(onCarriagewayCycleSide(cycleCol!, tags)).toBe('right')

    const model = parseWayLanes(tags)
    // Not a parseWayLanes slot — without nest path this used to be unsupported.
    expect(
      model.slots.find(
        (s) => s.direction === cycleCol!.lane!.direction && s.index === cycleCol!.lane!.index,
      ),
    ).toBeUndefined()

    const widthCell = getMatrixCell('width', cycleCol!, model, tags, false)
    expect(widthCell.writePath).toBe('nestSideTags')
    expect(widthCell.editable).toBe(true)
    expect(widthCell.display).toBe('1.4')
    expect(widthCell.provenance).toBe('tagged')

    const surfaceCell = getMatrixCell('surface', cycleCol!, model, tags, false)
    expect(surfaceCell.display).toBe('asphalt')

    const turnCell = getMatrixCell('turn', cycleCol!, model, tags, false)
    expect(turnCell.editable).toBe(false)
    expect(turnCell.readOnlyReason).toBe('unsupported')

    const next = nestSideTags(tags, 'cycleway', 'right', edgePatchForRow('width', '1.6')!)
    expect(next['cycleway:right:width']).toBe('1.6')
    expect(getMatrixCell('width', cycleCol!, model, next, false).display).toBe('1.6')
  })
})

describe('cycleway:lanes pipe-positioned column', () => {
  test('shows tagged width:lanes value and pipe_positioned hint', () => {
    const tags = {
      highway: 'secondary',
      oneway: 'yes',
      lanes: '2',
      'cycleway:lanes': 'none|lane|none',
      'width:lanes': '3.0|1.5|3.0',
    }
    const scene = sceneFor(tags)
    const columns = buildMatrixColumns(scene, tags)
    const cycleCol = columns.find((c) => c.kind === 'cycle')
    expect(cycleCol).toBeDefined()
    expect(cycleCol!.edge).toBeUndefined()

    const model = parseWayLanes(tags)
    const widthCell = getMatrixCell('width', cycleCol!, model, tags, false, columns)
    expect(widthCell.editable).toBe(false)
    expect(widthCell.writePath).toBe('none')
    expect(widthCell.readOnlyReason).toBe('pipe_positioned')
    expect(widthCell.display).toBe('1.5')
    expect(widthCell.provenance).toBe('tagged')

    const turnCell = getMatrixCell('turn', cycleCol!, model, tags, false, columns)
    expect(turnCell.readOnlyReason).toBe('pipe_positioned')
    expect(turnCell.display).toBe('—')
  })
})
