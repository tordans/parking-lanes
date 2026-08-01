import type { RoadSpaceSegmentRole } from '../types'

/**
 * Fixture tags are already oriented to the current way's direction.
 * Neighbour orientation (`normalizeTagsForDirection`) is the app's job —
 * fixtures never encode digitisation direction flips.
 */
export type DiagramFixture = {
  id: string
  title: string
  description: string
  segments: Array<{
    role: RoadSpaceSegmentRole
    wayId: number
    tags: Record<string, string>
    /** Opposite dual-carriageway branch when this segment is a dual oneway. */
    dualSibling?: { wayId: number; tags: Record<string, string> }
    /** Median gap meaning when dual (default verge). */
    medianHint?: 'verge' | 'crossing'
  }>
  note?: string
}

export const laneDiagramFixtures: readonly DiagramFixture[] = [
  {
    id: 'one-lane-each-way',
    title: 'One-lane each way',
    description: 'Three collinear segments, lanes=2, both sidewalks.',
    segments: [
      {
        role: 'prev',
        wayId: 101,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
        },
      },
      {
        role: 'current',
        wayId: 102,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
        },
      },
      {
        role: 'next',
        wayId: 103,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'two-lane-each-way',
    title: 'Two-lane each way + centre line',
    description: 'lanes=4, markings present.',
    segments: [
      {
        role: 'prev',
        wayId: 201,
        tags: {
          highway: 'secondary',
          lanes: '4',
          'lanes:forward': '2',
          'lanes:backward': '2',
          sidewalk: 'both',
          lane_markings: 'yes',
        },
      },
      {
        role: 'current',
        wayId: 202,
        tags: {
          highway: 'secondary',
          lanes: '4',
          'lanes:forward': '2',
          'lanes:backward': '2',
          sidewalk: 'both',
          lane_markings: 'yes',
        },
      },
      {
        role: 'next',
        wayId: 203,
        tags: {
          highway: 'secondary',
          lanes: '4',
          'lanes:forward': '2',
          'lanes:backward': '2',
          sidewalk: 'both',
          lane_markings: 'yes',
        },
      },
    ],
  },
  {
    id: 'right-turn-pocket',
    title: 'Right turn pocket',
    description:
      '2-lane prev/current; next (downstream, bottom) gains through|through|right — pocket ahead on the approach; left kerb fixed (left_of:2).',
    segments: [
      {
        role: 'prev',
        wayId: 301,
        tags: {
          highway: 'tertiary',
          oneway: 'yes',
          lanes: '2',
          'turn:lanes': 'through|through',
          placement: 'left_of:2',
          sidewalk: 'both',
        },
      },
      {
        role: 'current',
        wayId: 302,
        tags: {
          highway: 'tertiary',
          oneway: 'yes',
          lanes: '2',
          'turn:lanes': 'through|through',
          placement: 'left_of:2',
          sidewalk: 'both',
        },
      },
      {
        role: 'next',
        wayId: 303,
        tags: {
          highway: 'tertiary',
          oneway: 'yes',
          lanes: '3',
          // Pocket on approach to junction ahead (traffic flows down the page).
          'turn:lanes': 'through|through|right',
          placement: 'left_of:2',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'turn-pocket-then-continue',
    title: 'Turn pocket then continue',
    description:
      '4-lane pocket (left|through|through|right) then 2-lane continue. placement=left_of:3 → left_of:2 names the same through-lane axis (driving lanes only), so the purple guide stays straight.',
    segments: [
      {
        role: 'prev',
        wayId: 401,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '4',
          'turn:lanes': 'left|through|through|right',
          // OSM placement indexes driving lanes (lanes=*), LTR — not cycleway pipes.
          // 4 equal lanes → default is left_of:3 (centre of carriageway = between the
          // two throughs). Continue's left_of:2 names the *same* physical axis after the
          // pockets drop — so the purple guide stays straight (correct, not a bug).
          placement: 'left_of:3',
          sidewalk: 'both',
        },
      },
      {
        role: 'current',
        wayId: 402,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          'turn:lanes': 'through|through',
          placement: 'left_of:2',
          sidewalk: 'both',
        },
      },
      {
        role: 'next',
        wayId: 403,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          'turn:lanes': 'through|through',
          placement: 'left_of:2',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'dual-carriageway-island',
    title: 'Dual carriageway island',
    description:
      'Bidirectional approach meeting a dual_carriageway=yes pair (selected + opposite branches) that continues; real opposite slots + median gap (no grey placeholder).',
    segments: [
      {
        role: 'prev',
        wayId: 501,
        tags: {
          highway: 'primary',
          lanes: '2',
          sidewalk: 'both',
          name: 'Ringstraße',
        },
      },
      {
        role: 'current',
        wayId: 502,
        medianHint: 'verge',
        dualSibling: {
          wayId: 512,
          tags: {
            highway: 'primary',
            oneway: 'yes',
            lanes: '2',
            dual_carriageway: 'yes',
            sidewalk: 'right',
            name: 'Ringstraße',
          },
        },
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          dual_carriageway: 'yes',
          sidewalk: 'right',
          name: 'Ringstraße',
        },
      },
      {
        role: 'next',
        wayId: 503,
        medianHint: 'verge',
        dualSibling: {
          wayId: 513,
          tags: {
            highway: 'primary',
            oneway: 'yes',
            lanes: '2',
            dual_carriageway: 'yes',
            sidewalk: 'right',
            name: 'Ringstraße',
          },
        },
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          dual_carriageway: 'yes',
          sidewalk: 'right',
          name: 'Ringstraße',
        },
      },
    ],
    note: 'Five ways: prev approach, selected current/next (502→503), opposite current/next (512→513).',
  },
  {
    id: 'karl-marx-dual-split',
    title: 'Karl-Marx-Straße dual split',
    description:
      'Bidirectional Karl-Marx-Straße (way/37184618) with advisory cycle lanes meeting dual_carriageway oneways (selected way/964589555 + opposite way/213887879, crossing median).',
    segments: [
      {
        role: 'prev',
        wayId: 1002238497,
        tags: {
          highway: 'secondary',
          name: 'Karl-Marx-Straße',
          lanes: '3',
          'lanes:backward': '1',
          'lanes:forward': '2',
          lane_markings: 'yes',
          'cycleway:both': 'lane',
          'cycleway:both:width': '1.4',
          'cycleway:both:oneway': 'yes',
          'sidewalk:both': 'separate',
          'parking:both': 'no',
          'turn:lanes:forward': 'left|through',
          width: '13.5',
          'width:lanes:backward': '3.6',
          'width:lanes:forward': '3.2|3.2',
        },
      },
      {
        role: 'current',
        wayId: 37184618,
        tags: {
          highway: 'secondary',
          name: 'Karl-Marx-Straße',
          lanes: '3',
          'lanes:backward': '1',
          'lanes:forward': '2',
          lane_markings: 'yes',
          'cycleway:both': 'lane',
          'cycleway:both:width': '1.4',
          'cycleway:both:oneway': 'yes',
          'sidewalk:both': 'separate',
          'parking:both': 'no',
          'turn:lanes:forward': 'left|through',
          width: '13.5',
          'width:lanes:backward': '3.6',
          'width:lanes:forward': '3.2|3.2',
        },
      },
      {
        role: 'next',
        wayId: 964589555,
        medianHint: 'crossing',
        dualSibling: {
          wayId: 213887879,
          tags: {
            highway: 'secondary',
            name: 'Karl-Marx-Straße',
            oneway: 'yes',
            dual_carriageway: 'yes',
            lanes: '1',
            'cycleway:left': 'no',
            'cycleway:right': 'lane',
            'cycleway:right:width': '1.4',
            'cycleway:right:oneway': 'yes',
            'sidewalk:right': 'separate',
            'parking:both': 'no',
            width: '5.5',
            'width:lanes': '3.5',
          },
        },
        tags: {
          highway: 'secondary',
          name: 'Karl-Marx-Straße',
          oneway: 'yes',
          dual_carriageway: 'yes',
          lanes: '1',
          'cycleway:left': 'no',
          'cycleway:right': 'lane',
          'cycleway:right:width': '1.4',
          'cycleway:right:oneway': 'yes',
          'sidewalk:right': 'separate',
          'parking:both': 'no',
          width: '5.5',
          'width:lanes': '3.5',
        },
      },
    ],
  },
  {
    id: 't-junction',
    title: 'T-junction',
    description: 'Chain ends / angled stub; butt-end caps.',
    segments: [
      {
        role: 'prev',
        wayId: 601,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
        },
      },
      {
        role: 'current',
        wayId: 602,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
        },
      },
    ],
    note: 'No next segment — layout must emit a bottom butt-end cap.',
  },
  {
    id: 'cross-junction',
    title: 'Cross junction',
    description: 'Best-angle continue via osm-way-chain; stubs dimmed.',
    segments: [
      {
        role: 'prev',
        wayId: 701,
        tags: {
          highway: 'tertiary',
          lanes: '2',
          sidewalk: 'both',
          name: 'Hauptstraße',
        },
      },
      {
        role: 'current',
        wayId: 702,
        tags: {
          highway: 'tertiary',
          lanes: '2',
          sidewalk: 'both',
          name: 'Hauptstraße',
        },
      },
      {
        role: 'next',
        wayId: 703,
        tags: {
          highway: 'tertiary',
          lanes: '2',
          sidewalk: 'both',
          name: 'Hauptstraße',
        },
      },
    ],
    note: 'Stub ways are dimmed by the app; package only sees the continue chain.',
  },
  {
    id: 'mid-road-cycle-lane',
    title: 'Mid-road cycle lane',
    description: 'cycleway:lanes + placement + width:lanes (SRK mid-road case).',
    segments: [
      {
        role: 'current',
        wayId: 801,
        tags: {
          highway: 'secondary',
          oneway: 'yes',
          lanes: '2',
          'cycleway:lanes': 'none|lane|none',
          'width:lanes': '3.0|1.5|3.0',
          placement: 'middle_of:2',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'oneway-sidewalks-cycle',
    title: 'Oneway + sidewalks + cycle lane',
    description: 'Asymmetric L→R stack.',
    segments: [
      {
        role: 'current',
        wayId: 901,
        tags: {
          highway: 'residential',
          oneway: 'yes',
          lanes: '1',
          'cycleway:right': 'lane',
          'cycleway:right:width': '1.5',
          sidewalk: 'both',
          'sidewalk:left:width': '2.0',
          'sidewalk:right:width': '1.8',
        },
      },
    ],
  },
  {
    id: 'placement-transition',
    title: 'Placement transition',
    description: 'placement=transition between unequal stacks.',
    segments: [
      {
        role: 'prev',
        wayId: 1001,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '3',
          sidewalk: 'both',
          placement: 'middle_of:2',
        },
      },
      {
        role: 'current',
        wayId: 1002,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          sidewalk: 'both',
          placement: 'transition',
        },
      },
      {
        role: 'next',
        wayId: 1003,
        tags: {
          highway: 'primary',
          oneway: 'yes',
          lanes: '2',
          sidewalk: 'both',
          placement: 'left_of:2',
        },
      },
    ],
  },
  {
    id: 'shared-sidepath-segregated',
    title: 'Shared sidepath, segregated',
    description:
      'sidewalk+cycleway=track with segregated=yes; cycleway:right:surface ≠ footway:right:surface.',
    segments: [
      {
        role: 'current',
        wayId: 1101,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'right',
          'cycleway:right': 'track',
          segregated: 'yes',
          'cycleway:right:surface': 'asphalt',
          'footway:right:surface': 'paving_stones',
          'cycleway:right:width': '2.5',
        },
      },
    ],
  },
  {
    id: 'shared-sidepath-not-segregated',
    title: 'Shared sidepath, not segregated',
    description: 'segregated=no single shared band.',
    segments: [
      {
        role: 'current',
        wayId: 1201,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'right',
          'cycleway:right': 'track',
          segregated: 'no',
          'cycleway:right:width': '2.5',
        },
      },
    ],
  },
  {
    id: 'contraflow-cycling',
    title: 'Contraflow cycling',
    description: 'oneway=yes + oneway:bicycle=no, backward cycle slot on a oneway.',
    segments: [
      {
        role: 'current',
        wayId: 1301,
        tags: {
          highway: 'residential',
          oneway: 'yes',
          'oneway:bicycle': 'no',
          lanes: '1',
          'cycleway:left': 'lane',
          'cycleway:left:width': '1.5',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'no-sidewalk-tagged',
    title: 'No sidewalk tagged',
    description: 'Asserts nothing is drawn at the edges; form flags sidewalk unknown.',
    segments: [
      {
        role: 'current',
        wayId: 1401,
        tags: {
          highway: 'residential',
          lanes: '2',
        },
      },
    ],
  },
  {
    id: 'sidewalk-no-and-separate',
    title: 'Sidewalk no + separate',
    description:
      'sidewalk:left=no and sidewalk:right=separate produce no edge slots; separate is a text hint only.',
    segments: [
      {
        role: 'current',
        wayId: 1402,
        tags: {
          highway: 'residential',
          lanes: '2',
          'sidewalk:left': 'no',
          'sidewalk:right': 'separate',
        },
      },
    ],
  },
  {
    id: 'reversed-neighbour',
    title: 'Reversed neighbour',
    description:
      'Prev segment was digitised the opposite way; tags here are already normalized to the current way direction.',
    segments: [
      {
        role: 'prev',
        wayId: 1501,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
          'cycleway:right': 'lane',
        },
      },
      {
        role: 'current',
        wayId: 1502,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
          'cycleway:right': 'lane',
        },
      },
      {
        role: 'next',
        wayId: 1503,
        tags: {
          highway: 'residential',
          lanes: '2',
          sidewalk: 'both',
          'cycleway:right': 'lane',
        },
      },
    ],
    note: 'Orientation is applied by the app before buildRoadSpaceSegment.',
  },
  {
    id: 'width-vs-width-lanes',
    title: 'width vs width:lanes (Scenario A)',
    description: 'width:lanes=3|3 + width≈6.36 with paint residual; diagram uses clear 3+3.',
    segments: [
      {
        role: 'current',
        wayId: 1601,
        tags: {
          highway: 'residential',
          oneway: 'yes',
          lanes: '2',
          width: '6.36',
          'width:lanes': '3|3',
          sidewalk: 'both',
        },
      },
    ],
  },
  {
    id: 'parking-bike-buffer',
    title: 'Parking + bike + buffer (Scenario B)',
    description:
      'width=8, width:lanes=3|2, parking:left:width=2, cycleway:right:buffer:left=1; parking not a matrix column.',
    segments: [
      {
        role: 'current',
        wayId: 1701,
        tags: {
          highway: 'residential',
          oneway: 'yes',
          lanes: '1',
          width: '8',
          'width:lanes': '3|2',
          'parking:left:width': '2',
          'cycleway:right': 'lane',
          'cycleway:right:width': '2',
          'cycleway:right:buffer:left': '1',
          sidewalk: 'both',
        },
      },
    ],
    note: 'Parking widths feed soft sum in the form only; not drawn as slots here.',
  },
  {
    id: 'unmarked-carriageway',
    title: 'Unmarked carriageway',
    description: 'lane_markings=no, width present, no invented multilane lanes from metres.',
    segments: [
      {
        role: 'current',
        wayId: 1801,
        tags: {
          highway: 'residential',
          lanes: '2',
          lane_markings: 'no',
          width: '6.5',
          sidewalk: 'both',
        },
      },
    ],
  },
]
