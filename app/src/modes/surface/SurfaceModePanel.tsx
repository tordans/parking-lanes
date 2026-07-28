import * as m from '@app/paraglide/messages'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { expandSidepaths } from '@osm-editor-kit/osm-sidepath-tags'
import { useState } from 'react'
import { AuthState, useAuthState } from '../../shell/app-store'
import { AllTagsBlock } from '../../shell/controls/AllTagsBlock'
import {
  MapFeatureLoadEmptyState,
  MapFeaturePromptEmptyState,
} from '../../shell/controls/MapFeatureEmptyState'
import { ModePanelIntro } from '../../shell/controls/ModePanelIntro'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import { useMapViewport } from '../../shell/map/map-viewport'
import { LoginCallout } from '../parking/controls/LoginCallout'
import { viewMinZoom } from '../parking/map/constants'
import { useOsmAuth } from '../parking/map/use-osm-auth'
import { SurfaceChannelSection } from './controls/surface-channel-colors'
import { SurfaceChannelSwitcher } from './controls/SurfaceChannelSwitcher'
import { SurfaceSmoothnessPicker } from './controls/SurfaceSmoothnessPicker'
import {
  defaultSameMode,
  resolveSurfaceEditLayout,
  type SurfaceEditLayout,
} from './domain/surface-edit-layout'
import {
  DEFAULT_SURFACE_KEYS,
  type FieldKeys,
  type TagPatch,
  withSettLengthKey,
} from './domain/surface-tag-patches'
import {
  mergeSurfacePatches,
  stageSurfacePatchOnSidepath,
  stageSurfacePatchOnWay,
} from './map/surface-osm-edits'
import { useSurfaceOsmQuery } from './map/surface-osm-query'
import { useSurfaceOsmChangeHandler } from './use-surface-mode-handlers'

function formatFeatureLabel(ref: OsmFeatureRef): string {
  const suffix = ref.prefix && ref.side ? `/${ref.prefix}/${ref.side}` : ''
  return `${ref.type}/${ref.id}${suffix}`
}

function mirrorPatch(patch: TagPatch, from: FieldKeys, to: FieldKeys): TagPatch {
  const fromResolved = withSettLengthKey(from)
  const toResolved = withSettLengthKey(to)
  const mirrored: TagPatch = {}

  if (patch[fromResolved.surfaceKey] !== undefined) {
    mirrored[toResolved.surfaceKey] = patch[fromResolved.surfaceKey]
  }
  if (patch[fromResolved.smoothnessKey] !== undefined) {
    mirrored[toResolved.smoothnessKey] = patch[fromResolved.smoothnessKey]
  }
  if (
    fromResolved.settLengthKey &&
    toResolved.settLengthKey &&
    patch[fromResolved.settLengthKey] !== undefined
  ) {
    mirrored[toResolved.settLengthKey] = patch[fromResolved.settLengthKey]
  }

  return mirrored
}

function isSidepathRef(
  ref: OsmFeatureRef,
): ref is OsmFeatureRef & { type: 'way'; prefix: 'cycleway' | 'sidewalk'; side: 'left' | 'right' } {
  return (
    ref.type === 'way' &&
    (ref.prefix === 'cycleway' || ref.prefix === 'sidewalk') &&
    (ref.side === 'left' || ref.side === 'right')
  )
}

function pickerTagsForChannel(
  way: OsmWay,
  ref: OsmFeatureRef,
  layout: SurfaceEditLayout,
  keys: FieldKeys,
): { tags: OsmWay['tags']; keys: FieldKeys } {
  if (layout.kind === 'single' && isSidepathRef(ref)) {
    const sidepath = expandSidepaths(way.id, way.tags).find(
      (entry) => entry.ref.prefix === ref.prefix && entry.ref.side === ref.side,
    )
    if (sidepath) {
      return { tags: sidepath.tags, keys: withSettLengthKey(DEFAULT_SURFACE_KEYS) }
    }
  }

  return { tags: way.tags, keys }
}

function isNestableSidepathRef(
  ref: OsmFeatureRef,
  layout: SurfaceEditLayout,
): ref is OsmFeatureRef & { type: 'way'; prefix: 'cycleway' | 'sidewalk'; side: 'left' | 'right' } {
  return isSidepathRef(ref) && layout.kind === 'single'
}

function SurfaceModeEditor(props: {
  selectedWay: OsmWay
  selectedOsmRef: OsmFeatureRef
  layout: SurfaceEditLayout
  readOnly: boolean
  onLogin: () => void
  onOsmChange: ReturnType<typeof useSurfaceOsmChangeHandler>
}) {
  const { selectedWay, selectedOsmRef, layout, readOnly, onLogin, onOsmChange } = props
  const [sameMode, setSameMode] = useState(() => defaultSameMode(layout, selectedWay.tags))

  function commitPatch(patch: TagPatch, sourceKeys: FieldKeys, mirrorTargets: FieldKeys[] = []) {
    let merged = { ...patch }
    for (const target of mirrorTargets) {
      merged = mergeSurfacePatches(merged, mirrorPatch(patch, sourceKeys, target))
    }

    if (isNestableSidepathRef(selectedOsmRef, layout)) {
      onOsmChange(
        stageSurfacePatchOnSidepath(
          selectedWay,
          selectedOsmRef.prefix,
          selectedOsmRef.side,
          merged,
        ),
      )
      return
    }

    onOsmChange(stageSurfacePatchOnWay(selectedWay, merged))
  }

  function makePatchHandler(sourceKeys: FieldKeys, mirrorTargets: FieldKeys[] = []) {
    return (patch: TagPatch) => commitPatch(patch, sourceKeys, mirrorTargets)
  }

  function channelPicker(channelKeys: FieldKeys, mirrorTargets: FieldKeys[] = []) {
    const { tags, keys } = pickerTagsForChannel(selectedWay, selectedOsmRef, layout, channelKeys)
    return (
      <SurfaceSmoothnessPicker
        tags={tags}
        parentTags={selectedWay.tags}
        keys={keys}
        readOnly={readOnly}
        onPatch={makePatchHandler(channelKeys, mirrorTargets)}
      />
    )
  }

  const featureSuffix =
    selectedOsmRef.prefix && selectedOsmRef.side
      ? `${selectedOsmRef.prefix}/${selectedOsmRef.side}`
      : undefined

  const switcher =
    layout.kind === 'segregated' || layout.kind === 'cycleway-sides' ? (
      <SurfaceChannelSwitcher
        sameMode={sameMode}
        readOnly={readOnly}
        leftLabel={m.surface_split()}
        rightLabel={m.surface_same()}
        onSameModeChange={setSameMode}
      />
    ) : null

  return (
    <div className="flex min-w-[250px] flex-col gap-4 text-zinc-900">
      <ModePanelIntro
        wayId={selectedWay.id}
        highway={selectedWay.tags.highway}
        featureSuffix={featureSuffix}
        leading={switcher}
        className="flex items-center gap-2"
      />

      {readOnly ? <LoginCallout onLogin={onLogin} /> : null}

      {layout.kind === 'single' ? (
        <SurfaceChannelSection channel="single" shown>
          {channelPicker(layout.keys)}
        </SurfaceChannelSection>
      ) : null}

      {layout.kind === 'segregated' ? (
        <>
          <SurfaceChannelSection channel="same" shown={sameMode}>
            {channelPicker(layout.footKeys, [layout.cycleKeys])}
          </SurfaceChannelSection>
          <SurfaceChannelSection channel="foot" shown={!sameMode}>
            {channelPicker(layout.footKeys)}
          </SurfaceChannelSection>
          <SurfaceChannelSection channel="cycle" shown={!sameMode}>
            {channelPicker(layout.cycleKeys)}
          </SurfaceChannelSection>
        </>
      ) : null}

      {layout.kind === 'cycleway-sides' ? (
        <>
          <SurfaceChannelSection channel="same" shown={sameMode}>
            {channelPicker(layout.leftKeys, [layout.rightKeys])}
          </SurfaceChannelSection>
          <SurfaceChannelSection channel="left" shown={!sameMode}>
            {channelPicker(layout.leftKeys)}
          </SurfaceChannelSection>
          <SurfaceChannelSection channel="right" shown={!sameMode}>
            {channelPicker(layout.rightKeys)}
          </SurfaceChannelSection>
        </>
      ) : null}

      <AllTagsBlock tags={selectedWay.tags} />
    </div>
  )
}

export function SurfaceModePanel() {
  const onOsmChange = useSurfaceOsmChangeHandler()
  const mapViewport = useMapViewport()
  const selectedOsmRef = useSelectedOsmRef()
  const authState = useAuthState()
  const { login } = useOsmAuth()
  const { data: graph, isFetching } = useSurfaceOsmQuery({ select: (data) => data.graph })

  const selectedWay =
    selectedOsmRef?.type === 'way' ? (graph?.ways[selectedOsmRef.id] ?? null) : null
  const layout =
    selectedWay && selectedOsmRef
      ? resolveSurfaceEditLayout(selectedWay.tags, selectedWay.id, selectedOsmRef)
      : null

  if (!selectedOsmRef) {
    return <MapFeaturePromptEmptyState message={m.empty_click_surface()} />
  }

  if (!selectedWay || !layout) {
    return (
      <MapFeatureLoadEmptyState
        zoom={mapViewport.zoom}
        minZoom={viewMinZoom}
        isFetching={isFetching}
        featureLabel={formatFeatureLabel(selectedOsmRef)}
      />
    )
  }

  const editorKey = [
    selectedOsmRef.type,
    selectedOsmRef.id,
    selectedOsmRef.prefix ?? '',
    selectedOsmRef.side ?? '',
    layout.kind,
  ].join('/')

  return (
    <SurfaceModeEditor
      key={editorKey}
      selectedWay={selectedWay}
      selectedOsmRef={selectedOsmRef}
      layout={layout}
      readOnly={authState !== AuthState.success}
      onLogin={() => void login()}
      onOsmChange={onOsmChange}
    />
  )
}
