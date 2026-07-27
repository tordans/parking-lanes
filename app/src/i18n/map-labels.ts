import * as m from '@app/paraglide/messages'
import type { EliCategory } from '@osm-editor-kit/maplibre-editor-layer-index/react'

const backgroundCategoryLabelByKey = {
  photo: m.map_background_category_photo,
  map: m.map_background_category_map,
  osmbasedmap: m.map_background_category_osmbasedmap,
  historicmap: m.map_background_category_historicmap,
  historicphoto: m.map_background_category_historicphoto,
  elevation: m.map_background_category_elevation,
  qa: m.map_background_category_qa,
  other: m.map_background_category_other,
} as const satisfies Record<EliCategory, () => string>

export function getBackgroundCategoryLabel(key: EliCategory): string {
  return backgroundCategoryLabelByKey[key]()
}
