import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { WidthMeasureGuideKind } from '../domain/width-measure-guide-kind'
import type { CrossSectionSpec } from './cross-section/types'
import {
  cyclewayBufferSpec,
  cyclewayClearSpec,
  estWidthProvenanceSpec,
  maxwidthVsWidthSpec,
  otherPathSpec,
  pathSegregatedSpec,
  roadKerbSpec,
  roadWidthLanesSpec,
  roadWidthVsLanesSpec,
  rowCompositionSpec,
  sidewalkSpec,
  vergeSpec,
} from './specs'

export type MeasureGuideGroup = 'carriageway' | 'cycle' | 'sidepath' | 'values'

export type MeasureGuideAudience = 'panel+audit' | 'audit'

export type MeasureGuideSectionId =
  | 'road_kerb'
  | 'road_parking_branch'
  | 'road_width_lanes'
  | 'road_width_vs_lanes'
  | 'cycleway_clear'
  | 'cycleway_buffer'
  | 'path_segregated'
  | 'sidewalk'
  | 'verge'
  | 'other_path'
  | 'maxwidth_vs_width'
  | 'est_width_provenance'
  | 'narrowings'
  | 'row_composition'

export type MeasureGuideMessages = {
  title: string
  body: string
  /** Optional note key (e.g. double-count / open-question callouts). */
  note?: string
}

/** OSM wiki / forum / ML / tool link shown in the section footer. Registry stays React-free. */
export type MeasureGuideLink = {
  href: string
  /** Paraglide message key for the visible label. */
  labelKey: string
}

export type MeasureGuideSection = {
  id: MeasureGuideSectionId
  group: MeasureGuideGroup
  /** Research anchor, e.g. `§3.3 Scenario B`. */
  research: string
  /**
   * Primary diagram, or `null` when text-only / multi-diagram (body renders diagrams).
   * `road_parking_branch` is dual-diagram; `narrowings` is longitudinal text-only.
   */
  spec: CrossSectionSpec | null
  messages: MeasureGuideMessages
  /** Footer source links (wiki, forum, ML, tools); URLs grounded in research sources. */
  links: readonly MeasureGuideLink[]
  panelKinds: readonly WidthMeasureGuideKind[]
  showWhen?: (tags: OsmTags) => boolean
  audience: MeasureGuideAudience
  /** What the width mode can tag, or that the section is documentation-only. */
  editorWrites: string
}

/**
 * Canonical sources surfaced in section footers (wiki, forum, ML, GitHub).
 * Grounded in research/width-measurements/sources.md so audit/panel readers
 * need not open the research folder for primary references.
 */
const DOC = {
  keyWidth: 'https://wiki.openstreetmap.org/wiki/Key:width',
  talkKeyWidth: 'https://wiki.openstreetmap.org/wiki/Talk:Key:width',
  lanes: 'https://wiki.openstreetmap.org/wiki/Lanes',
  keyLanes: 'https://wiki.openstreetmap.org/wiki/Key:lanes',
  deFahrspuren: 'https://wiki.openstreetmap.org/wiki/DE:Fahrspuren',
  sidewalks: 'https://wiki.openstreetmap.org/wiki/Sidewalks',
  verge: 'https://wiki.openstreetmap.org/wiki/Key:verge',
  shoulder: 'https://wiki.openstreetmap.org/wiki/Key:shoulder',
  berlinRadwege: 'https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Radwege',
  cyclewayBuffer: 'https://wiki.openstreetmap.org/wiki/Key:cycleway:buffer',
  cyclewayLane: 'https://wiki.openstreetmap.org/wiki/Tag:cycleway%3Dlane',
  parkingDe: 'https://wiki.openstreetmap.org/wiki/DE:Parken_im_Straßenraum',
  laneVsStreetSide:
    'https://wiki.openstreetmap.org/wiki/Tag:parking%3Dstreet_side/street_side_vs_lane',
  maxwidth: 'https://wiki.openstreetmap.org/wiki/Key:maxwidth',
  maxwidthPhysical: 'https://wiki.openstreetmap.org/wiki/Key:maxwidth:physical',
  estWidth: 'https://wiki.openstreetmap.org/wiki/Key:est_width',
  keyNarrow: 'https://wiki.openstreetmap.org/wiki/Key:narrow',
  hazardRoadNarrows: 'https://wiki.openstreetmap.org/wiki/Tag:hazard%3Droad_narrows',
  laneMarkings: 'https://wiki.openstreetmap.org/wiki/Key:lane_markings',
  separationProposal: 'https://wiki.openstreetmap.org/wiki/Proposal:Separation',
  taggingMl2020: 'https://lists.openstreetmap.org/pipermail/tagging/2020-September/055362.html',
  streetComplete5593: 'https://github.com/streetcomplete/StreetComplete/issues/5593',
  forumLaneCount: 'https://community.openstreetmap.org/t/quick-poll-lane-count/126298',
  forumUnmarkedLanes:
    'https://community.openstreetmap.org/t/poll-add-keep-change-or-remove-lanes-tagging-when-lane-markings-no/142099',
  strassenraumkarteMicromap:
    'https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update',
} as const

const ALL_KINDS: readonly WidthMeasureGuideKind[] = ['road', 'sidewalk', 'cycleway', 'other']

function hasParkingTags(tags: OsmTags): boolean {
  return Object.keys(tags).some((k) => k === 'parking' || k.startsWith('parking:'))
}

function hasWidthLanesTag(tags: OsmTags): boolean {
  return Object.keys(tags).some((k) => k === 'width:lanes' || k.startsWith('width:lanes:'))
}

function hasBufferTag(tags: OsmTags): boolean {
  return Object.keys(tags).some((k) => k === 'buffer' || k.includes('buffer'))
}

function hasFootAndCycleWidthTags(tags: OsmTags): boolean {
  const keys = Object.keys(tags)
  const hasCycle = keys.some(
    (k) =>
      k === 'cycleway:width' ||
      /^cycleway:(?:left|right|both):width$/.test(k) ||
      /^cycleway:(?:left|right|both):width:/.test(k),
  )
  const hasFoot = keys.some(
    (k) =>
      k === 'footway:width' ||
      /^footway:(?:left|right|both):width$/.test(k) ||
      /^footway:(?:left|right|both):width:/.test(k),
  )
  return hasCycle && hasFoot
}

function showPathSegregated(tags: OsmTags): boolean {
  return tags.segregated === 'yes' || hasFootAndCycleWidthTags(tags)
}

/**
 * Most tag-specific section first. Used to expand exactly one section in the panel.
 * Gated sections rank above kind primaries.
 */
export const PANEL_EXPAND_PRIORITY: readonly MeasureGuideSectionId[] = [
  'road_width_vs_lanes',
  'path_segregated',
  'cycleway_buffer',
  'road_parking_branch',
  'road_kerb',
  'cycleway_clear',
  'sidewalk',
  'other_path',
  'road_width_lanes',
  'verge',
  'maxwidth_vs_width',
  'narrowings',
  'est_width_provenance',
]

/** Registry of width measure-guide sections (React-free). */
export const measureGuideSections: readonly MeasureGuideSection[] = [
  {
    id: 'road_kerb',
    group: 'carriageway',
    // Rules in §2.1/§2.6; diagram metres from §3.3 Scenario B (both must be reachable).
    research: '§2.1/§2.6 · §3.3 Scenario B',
    spec: roadKerbSpec,
    messages: {
      title: 'width_guide_road_kerb_title',
      body: 'width_guide_road_kerb_body',
      note: 'width_guide_road_kerb_note',
    },
    links: [
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.taggingMl2020, labelKey: 'width_guide_link_tagging_ml_2020' },
      { href: DOC.talkKeyWidth, labelKey: 'width_guide_link_talk_key_width' },
      { href: DOC.shoulder, labelKey: 'width_guide_link_key_shoulder' },
      { href: DOC.forumUnmarkedLanes, labelKey: 'width_guide_link_forum_unmarked_lanes' },
    ],
    panelKinds: ['road'],
    audience: 'panel+audit',
    editorWrites: 'width',
  },
  {
    id: 'road_parking_branch',
    group: 'carriageway',
    research: '§2.6',
    // Dual diagrams (lane + street_side) rendered by the body component.
    spec: null,
    messages: {
      title: 'width_guide_road_parking_branch_title',
      body: 'width_guide_road_parking_branch_body',
    },
    links: [
      { href: DOC.parkingDe, labelKey: 'width_guide_link_parking_de' },
      { href: DOC.laneVsStreetSide, labelKey: 'width_guide_link_lane_vs_street_side' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.forumLaneCount, labelKey: 'width_guide_link_forum_lane_count' },
    ],
    panelKinds: ['road'],
    showWhen: hasParkingTags,
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'road_width_lanes',
    group: 'carriageway',
    research: '§2.2',
    spec: roadWidthLanesSpec,
    messages: {
      title: 'width_guide_road_width_lanes_title',
      body: 'width_guide_road_width_lanes_body',
    },
    links: [
      { href: DOC.lanes, labelKey: 'width_guide_link_lanes' },
      { href: DOC.deFahrspuren, labelKey: 'width_guide_link_de_fahrspuren' },
      { href: DOC.keyLanes, labelKey: 'width_guide_link_key_lanes' },
      { href: DOC.forumLaneCount, labelKey: 'width_guide_link_forum_lane_count' },
      { href: DOC.strassenraumkarteMicromap, labelKey: 'width_guide_link_strassenraumkarte' },
    ],
    panelKinds: ['road'],
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'road_width_vs_lanes',
    group: 'carriageway',
    research: '§2.2 + §3.1/§3.2',
    spec: roadWidthVsLanesSpec,
    messages: {
      title: 'width_guide_road_width_vs_lanes_title',
      body: 'width_guide_road_width_vs_lanes_body',
    },
    links: [
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.lanes, labelKey: 'width_guide_link_lanes' },
      { href: DOC.streetComplete5593, labelKey: 'width_guide_link_streetcomplete_5593' },
      { href: DOC.deFahrspuren, labelKey: 'width_guide_link_de_fahrspuren' },
    ],
    panelKinds: ['road'],
    showWhen: hasWidthLanesTag,
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'cycleway_clear',
    group: 'cycle',
    research: '§2.7',
    spec: cyclewayClearSpec,
    messages: {
      title: 'width_guide_cycleway_clear_title',
      body: 'width_guide_cycleway_clear_body',
    },
    links: [
      { href: DOC.berlinRadwege, labelKey: 'width_guide_link_berlin_cycleways' },
      { href: DOC.cyclewayLane, labelKey: 'width_guide_link_cycleway_lane' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
    ],
    panelKinds: ['cycleway'],
    audience: 'panel+audit',
    editorWrites: 'cycleway:SIDE:width',
  },
  {
    id: 'cycleway_buffer',
    group: 'cycle',
    research: '§2.8',
    spec: cyclewayBufferSpec,
    messages: {
      title: 'width_guide_cycleway_buffer_title',
      body: 'width_guide_cycleway_buffer_body',
    },
    links: [
      { href: DOC.cyclewayBuffer, labelKey: 'width_guide_link_buffer' },
      { href: DOC.berlinRadwege, labelKey: 'width_guide_link_berlin_cycleways' },
      { href: DOC.separationProposal, labelKey: 'width_guide_link_separation_proposal' },
      { href: DOC.cyclewayLane, labelKey: 'width_guide_link_cycleway_lane' },
    ],
    panelKinds: ['cycleway'],
    showWhen: hasBufferTag,
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'path_segregated',
    group: 'sidepath',
    research: '§2.7 + §7.1',
    spec: pathSegregatedSpec,
    messages: {
      title: 'width_guide_path_segregated_title',
      body: 'width_guide_path_segregated_body',
      note: 'width_guide_path_segregated_note',
    },
    links: [
      { href: DOC.berlinRadwege, labelKey: 'width_guide_link_berlin_cycleways' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
    ],
    panelKinds: ['cycleway'],
    showWhen: showPathSegregated,
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'sidewalk',
    group: 'sidepath',
    research: '§2.6',
    spec: sidewalkSpec,
    messages: {
      title: 'width_guide_sidewalk_title',
      body: 'width_guide_sidewalk_body',
    },
    links: [
      { href: DOC.sidewalks, labelKey: 'width_guide_link_sidewalks' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.verge, labelKey: 'width_guide_link_key_verge' },
    ],
    panelKinds: ['sidewalk'],
    audience: 'panel+audit',
    editorWrites: 'sidewalk:SIDE:width',
  },
  {
    id: 'verge',
    group: 'sidepath',
    research: '§2.6',
    spec: vergeSpec,
    messages: {
      title: 'width_guide_verge_title',
      body: 'width_guide_verge_body',
    },
    links: [
      { href: DOC.verge, labelKey: 'width_guide_link_key_verge' },
      { href: DOC.sidewalks, labelKey: 'width_guide_link_sidewalks' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.shoulder, labelKey: 'width_guide_link_key_shoulder' },
    ],
    panelKinds: ['sidewalk'],
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'other_path',
    group: 'sidepath',
    research: '§2.1',
    spec: otherPathSpec,
    messages: {
      title: 'width_guide_other_path_title',
      body: 'width_guide_other_path_body',
    },
    links: [
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.talkKeyWidth, labelKey: 'width_guide_link_talk_key_width' },
    ],
    panelKinds: ['other'],
    audience: 'panel+audit',
    editorWrites: 'width',
  },
  {
    id: 'maxwidth_vs_width',
    group: 'values',
    research: '§2.5',
    spec: maxwidthVsWidthSpec,
    messages: {
      title: 'width_guide_maxwidth_vs_width_title',
      body: 'width_guide_maxwidth_vs_width_body',
    },
    links: [
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.maxwidth, labelKey: 'width_guide_link_key_maxwidth' },
      { href: DOC.maxwidthPhysical, labelKey: 'width_guide_link_key_maxwidth_physical' },
    ],
    panelKinds: ['road'],
    audience: 'panel+audit',
    editorWrites: 'documentation-only',
  },
  {
    id: 'est_width_provenance',
    group: 'values',
    research: '§2.3',
    spec: estWidthProvenanceSpec,
    messages: {
      title: 'width_guide_est_width_provenance_title',
      body: 'width_guide_est_width_provenance_body',
    },
    links: [
      { href: DOC.estWidth, labelKey: 'width_guide_link_key_est_width' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.forumUnmarkedLanes, labelKey: 'width_guide_link_forum_unmarked_lanes' },
      { href: DOC.laneMarkings, labelKey: 'width_guide_link_key_lane_markings' },
    ],
    panelKinds: ALL_KINDS,
    audience: 'panel+audit',
    editorWrites: 'source:width',
  },
  {
    id: 'narrowings',
    group: 'values',
    research: '§3.6',
    spec: null,
    messages: {
      title: 'width_guide_narrowings_title',
      body: 'width_guide_narrowings_body',
    },
    links: [
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.keyNarrow, labelKey: 'width_guide_link_key_narrow' },
      { href: DOC.hazardRoadNarrows, labelKey: 'width_guide_link_hazard_road_narrows' },
      { href: DOC.talkKeyWidth, labelKey: 'width_guide_link_talk_key_width' },
    ],
    panelKinds: ['road', 'sidewalk', 'other'],
    audience: 'panel+audit',
    editorWrites: 'width',
  },
  {
    id: 'row_composition',
    group: 'values',
    research: '§3.4',
    spec: rowCompositionSpec,
    messages: {
      title: 'width_guide_row_composition_title',
      body: 'width_guide_row_composition_body',
    },
    links: [
      { href: DOC.sidewalks, labelKey: 'width_guide_link_sidewalks' },
      { href: DOC.verge, labelKey: 'width_guide_link_key_verge' },
      { href: DOC.keyWidth, labelKey: 'width_guide_link_key_width' },
      { href: DOC.shoulder, labelKey: 'width_guide_link_key_shoulder' },
    ],
    panelKinds: [],
    audience: 'audit',
    editorWrites: 'documentation-only',
  },
]

/** Sections shown in the width panel for a guide kind + current tags. */
export function sectionsForPanel(
  kind: WidthMeasureGuideKind,
  tags: OsmTags,
): MeasureGuideSection[] {
  return measureGuideSections.filter(
    (section) =>
      section.audience === 'panel+audit' &&
      section.panelKinds.includes(kind) &&
      (section.showWhen == null || section.showWhen(tags)),
  )
}

/** Id of the single section that should start expanded in the panel. */
export function expandedSectionId(
  sections: readonly MeasureGuideSection[],
): MeasureGuideSectionId | undefined {
  for (const id of PANEL_EXPAND_PRIORITY) {
    if (sections.some((s) => s.id === id)) return id
  }
  return sections[0]?.id
}
