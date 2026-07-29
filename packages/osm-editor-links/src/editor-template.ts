import type { LatLngLiteral } from '@osm-editor-kit/osm-data'
import type { OsmObjectType } from './osm-type'
import { toShortOsmType } from './osm-type'

export type EditorUrlTemplateVars = {
  zoom?: number
  center: LatLngLiteral
  osmType?: OsmObjectType | null
  osmId?: number | string | null
  editorId?: string | number | null
}

/**
 * Fill `{zoom}`, `{latitude}`, `{longitude}`, `{short_osm_type}`, `{long_osm_type}`,
 * `{editor_id}`, `{osm_id}` placeholders in an editor URL template (TILDA-style).
 */
export function fillEditorUrlTemplate(urlTemplate: string, vars: EditorUrlTemplateVars): string {
  const short = vars.osmType ? (toShortOsmType(vars.osmType) ?? '') : ''
  return urlTemplate
    .replaceAll('{zoom}', vars.zoom?.toString() ?? '19')
    .replaceAll('{latitude}', String(vars.center.lat))
    .replaceAll('{longitude}', String(vars.center.lng))
    .replaceAll('{short_osm_type}', short)
    .replaceAll('{long_osm_type}', vars.osmType ?? '')
    .replaceAll('{editor_id}', vars.editorId != null ? String(vars.editorId) : '')
    .replaceAll('{osm_id}', vars.osmId != null ? String(vars.osmId) : '')
}
