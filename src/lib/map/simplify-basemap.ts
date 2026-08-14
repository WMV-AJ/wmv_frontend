import type { Map as MapLibreMap } from 'maplibre-gl';

// Declutters the Carto dark-matter basemap for the city-scale map view.
// Tuned for a middle ground: at browse zoom (~12) only the road skeleton
// shows; residential streets appear from zoom 14 (v1 pushed them to 16,
// which left the map empty even when zoomed in); road labels keep Carto's
// defaults. POI/housenumber clutter stays hidden. Runs against the live
// style (no forked style JSON), so Carto keeps serving upstream fixes.
//
// Layer ids verified against https://basemaps.cartocdn.com/gl/dark-matter-gl-style
// but every operation is wrapped per-layer, so a renamed or missing id is a
// silent no-op instead of a crash.

const HIDE_ALWAYS = new Set([
  'poi_stadium',
  'poi_park',
  'housenumber',
  'place_hamlet',
]);

// Residential/service roads: from zoom 14 (Carto default is ~13).
const MINOR_ROAD_RE = /^(road|tunnel|bridge)_(service|minor)_/;
// Foot/cycle paths: from zoom 15.
const PATH_RE = /^(road|tunnel|bridge)_path$/;
// Secondary roads: from zoom 13 (default ~11) — they're the bulk of the
// clutter at city browse zoom.
const SEC_ROAD_RE = /^(road|tunnel|bridge)_sec_/;
// Primary/trunk/motorway fills: keep, slightly faded so venue markers
// dominate.
const MAJOR_FILL_RE = /^(road|tunnel|bridge)_(pri|trunk|mot)_fill/;

export function applyBasemapSimplification(map: MapLibreMap): void {
  // Cheap idempotency check — a style reset clears this, which is exactly
  // when re-application is needed.
  try {
    if (map.getLayer('poi_park') && map.getLayoutProperty('poi_park', 'visibility') === 'none') {
      return;
    }
  } catch {
    /* fall through and apply */
  }

  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    const id = layer.id;
    try {
      if (HIDE_ALWAYS.has(id)) {
        map.setLayoutProperty(id, 'visibility', 'none');
      } else if (PATH_RE.test(id)) {
        map.setLayerZoomRange(id, 15, 24);
      } else if (MINOR_ROAD_RE.test(id)) {
        map.setLayerZoomRange(id, 14, 24);
      } else if (SEC_ROAD_RE.test(id)) {
        map.setLayerZoomRange(id, 13, 24);
      } else if (MAJOR_FILL_RE.test(id) && layer.type === 'line') {
        map.setPaintProperty(id, 'line-opacity', 0.7);
      }
    } catch {
      /* missing/renamed layer — skip */
    }
  }
}
