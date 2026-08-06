/**
 * Streetside preview strategy: when the API returns an imageUrl template we substitute
 * `{subdomain}` → `t0`, `{faceId}` → `01`, and `{tileId}` → empty string to request a
 * single cubemap face tile. This is a best-effort static preview — cubemap stitching is
 * not implemented in v1. When the template is missing or substitution fails, the viewer
 * shows metadata + "Open in Bing Maps" instead of an image.
 */
export const buildStreetsidePreviewUrl = (imageUrlTemplate: string | undefined): string | null => {
  if (!imageUrlTemplate || !imageUrlTemplate.includes('{')) {
    return null
  }

  return imageUrlTemplate
    .replace('{subdomain}', 't0')
    .replace('{faceId}', '01')
    .replace('{tileId}', '')
}
