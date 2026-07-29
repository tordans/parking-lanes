import type { LatLngLiteral } from '@osm-editor-kit/osm-data'
import { type OsmNode, type OsmRelation, type OsmWay } from '@osm-editor-kit/osm-data'
import { josmRemoteBase, josmUrl } from './hosts'
import type { OsmObjectType } from './osm-type'
import { toShortOsmType } from './osm-type'

export { josmUrl }

type IdEditorUrlProps = {
  center?: LatLngLiteral
  zoom?: number
  background?: string
  osmObjectType?: OsmRelation['type'] | OsmWay['type'] | OsmNode['type']
  osmObjectId?: number | string
}

/** iD hosted on ideditor-release.netlify.app (parking-lanes default). */
export function idEditorUrl({
  center,
  zoom,
  background,
  osmObjectType,
  osmObjectId,
}: IdEditorUrlProps) {
  const params: Record<string, string> = {
    disable_features: 'boundaries',
    photo_overlay: 'streetside,mapillary,kartaview',
  }
  if (zoom && center) params.map = `${zoom}/${center.lat}/${center.lng}`
  if (background) params.background = background
  if (osmObjectType && osmObjectId) params.id = `${osmObjectType.charAt(0)}${osmObjectId}`
  const hashUrlParams = new URLSearchParams(params)

  return `https://ideditor-release.netlify.app/#${hashUrlParams.toString()}`
}

type OsmEditIdUrlProps = {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
  comment?: string
  hashtags?: string
  source?: string
}

/** Official OSM.org iD edit URL (TILDA-style, with optional hashtags). */
export function osmEditIdUrl({
  osmType,
  osmId,
  comment,
  hashtags,
  source,
}: OsmEditIdUrlProps): string | undefined {
  if (!osmType || osmId == null || osmId === '') return undefined
  const url = new URL('https://www.openstreetmap.org/edit')
  url.searchParams.append(osmType, String(osmId))

  const hashParams = new URLSearchParams()
  if (comment) hashParams.append('comment', comment)
  if (source) hashParams.append('source', source)
  if (hashtags) hashParams.append('hashtags', hashtags)

  const hash = hashParams.toString()
  return hash ? `${url.toString()}#${hash}` : url.toString()
}

export function osmEditRapidUrl(options: {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
  hashtags?: string
  locale?: string
}): string | undefined {
  const { osmType, osmId, hashtags = 'TILDA', locale = 'de' } = options
  if (!osmType || osmId == null || osmId === '') return undefined
  const short = toShortOsmType(osmType)
  if (!short) return undefined
  return `https://rapideditor.org/edit#id=${short}${osmId}&disable_features=boundaries&locale=${locale}&hashtags=${hashtags}`
}

export function osmEditKyleKiwiIdUrl(options: {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
  hashtags?: string
  locale?: string
}): string | undefined {
  const { osmType, osmId, hashtags = 'TILDA', locale = 'en' } = options
  if (!osmType || osmId == null || osmId === '') return undefined
  const short = toShortOsmType(osmType)
  if (!short) return undefined
  return `https://kyle.kiwi/iD/#id=${short}${osmId}&locale=${locale}&disable_features=boundaries&hashtags=${hashtags}`
}

/** JOSM remote control `load_object` for a single OSM element. */
export function josmLoadObjectUrl(options: {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
  changesetHashtags?: string
}): string | undefined {
  const { osmType, osmId, changesetHashtags = 'TILDA' } = options
  if (!osmType || osmId == null || osmId === '') return undefined
  const short = toShortOsmType(osmType)
  if (!short) return undefined
  const url = new URL(`${josmRemoteBase}/load_object`)
  url.searchParams.set('objects', `${short}${osmId}`)
  if (changesetHashtags) url.searchParams.set('changeset_hashtags', changesetHashtags)
  return url.toString()
}

/** Prefix for JOSM `import?url=` (Overpass / map download). Same as `josmUrl`. */
export function josmImportUrl(): string {
  return josmUrl
}
