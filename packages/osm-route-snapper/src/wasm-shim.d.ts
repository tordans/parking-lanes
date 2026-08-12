declare module '../vendor/osm-to-route-snapper/osm_to_route_snapper.js' {
  export function convert(input_bytes: Uint8Array, boundary_geojson: string): Uint8Array
  export default function init(
    module_or_path?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module,
  ): Promise<unknown>
}

export {}
