import type { Map as MapLibreMap } from 'maplibre-gl';

// Declutters the Carto dark-matter basemap for the city-scale map view:
// small roads and their labels only appear when deeply zoomed, main-road
// fills are faded, and POI/housenumber clutter is hidden. Runs against the
// live style (no forked style JSON), so Carto keeps serving upstream fixes.
//
// Layer ids verified against https://basemaps.cartocdn.com/gl/dark-matter-gl-style
// but every operation is wrapped per-layer, so a renamed or missing id is a
// silent no-op instead of a crash.

const HIDE_ALWAYS = new Set([
  'roadname_minor',
  'roadname_sec',
  'poi_stadium',
  'poi_park',
  'housenumber',
  'place_hamlet',
]);

// Minor/service/path roads: only from zoom 16 (street level).
const MINOR_ROAD_RE = /^(road|tunnel|bridge)_(service|minor)_|^(road|tunnel|bridge)_path$/;
// Secondary roads: only from zoom 14.
const SEC_ROAD_RE = /^(road|tunnel|bridge)_sec_/;
// Primary/trunk/motorway fills: keep, but fade so venue markers dominate.
const MAJOR_FILL_RE = /^(road|tunnel|bridge)_(pri|trunk|mot)_fill/;

const LABEL_MIN_ZOOM: Record<string, number> = {
  roadname_major: 14,
  roadname_pri: 15,
};

export function applyBasemapSimplification(map: MapLibreMap): void {
  // Cheap idempotency check — a style reset clears this, which is exactly
  // when re-application is needed.
  try {
    if (map.getLayer('roadname_minor') && map.getLayoutProperty('roadname_minor', 'visibility') === 'none') {
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
      } else if (id in LABEL_MIN_ZOOM) {
        map.setLayerZoomRange(id, LABEL_MIN_ZOOM[id], 24);
      } else if (MINOR_ROAD_RE.test(id)) {
        map.setLayerZoomRange(id, 16, 24);
      } else if (SEC_ROAD_RE.test(id)) {
        map.setLayerZoomRange(id, 14, 24);
      } else if (MAJOR_FILL_RE.test(id) && layer.type === 'line') {
        map.setPaintProperty(id, 'line-opacity', 0.55);
      }
    } catch {
      /* missing/renamed layer — skip */
    }
  }
}
