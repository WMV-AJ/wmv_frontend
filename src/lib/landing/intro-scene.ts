// The landing intro, as pure data and canvas drawing. No React in here.
//
// Timeline (seconds):
//   0.2–3.3  one flat shape morphs through the five sources
//   3.3–3.8  the five shapes line up in a row
//   3.8–4.8  the row breaks into dots that swirl around the centre
//   4.8–6.6  the dots form a turning sphere; pills settle at the bottom
//   6.6–8.4  the sphere opens into the dotted world map
//
// Everything is drawn in a 430-wide design space. The design height follows
// the viewport (see makeLayout), so the same scene fits short and tall phones.

import { COLOR_HEX_MAP } from '@/lib/category-mappings';

export const TOTAL = 8.4;
/** The logo opening that runs before the intro proper. */
export const LOGO_TIME = 1.7;
/** Where the small logo rests in the top bar (its centre, in design px). */
export const BRAND_X = 38;
export const BRAND_Y = 48;
export const BRAND_SIZE = 28;
export const DESIGN_W = 430;

export const BEAT_START = 0.2;
export const BEAT_LENGTH = 0.62;
export const ROW_AT = 3.3;
const GATHER_AT = 3.8;
const MAP_START = 6.6;
const MAP_END = 8.0;
const WAVE_RADIUS = 640;
const SHAPE_SAMPLES = 144;
const DOTS_PER_SOURCE = 28;

export const BIG_RADIUS = 92;
const SMALL_RADIUS = 29;
export const RING_RADIUS = 140;

export type ShapeKind = 'circle' | 'square' | 'ticket' | 'triangle' | 'burst';

export interface SourceSpec {
  label: string;
  color: string;
  shape: ShapeKind;
}

/** One shape and one live category colour per source. */
export const SOURCES: readonly SourceSpec[] = [
  { label: 'Instagram stories', color: COLOR_HEX_MAP.purple, shape: 'circle' },
  { label: 'Instagram posts', color: COLOR_HEX_MAP.orange, shape: 'square' },
  { label: 'Ticketing platforms', color: COLOR_HEX_MAP.green, shape: 'ticket' },
  { label: 'Community events', color: COLOR_HEX_MAP.red, shape: 'triangle' },
  { label: 'Activities', color: COLOR_HEX_MAP.pink, shape: 'burst' },
];

export interface PillSpec {
  label: string;
  color: string;
}

/** The site's category pills, with the colours the map uses. */
export const PILLS: readonly PillSpec[] = [
  { label: 'Food & Dining', color: COLOR_HEX_MAP.orange },
  { label: 'Happy Hour', color: COLOR_HEX_MAP.teal },
  { label: 'Ladies Night', color: COLOR_HEX_MAP.purple },
  { label: 'Club Night', color: COLOR_HEX_MAP.pink },
  { label: 'Live', color: COLOR_HEX_MAP.green },
  { label: 'Sports Viewing', color: COLOR_HEX_MAP.red },
  { label: 'Pool Party', color: COLOR_HEX_MAP.blue },
  { label: 'Brunch', color: COLOR_HEX_MAP.indigo },
  { label: 'Business', color: COLOR_HEX_MAP.slate },
  { label: 'Comedy Night', color: COLOR_HEX_MAP.gray },
  { label: 'Workshop', color: COLOR_HEX_MAP.sage },
  { label: 'Karaoke', color: COLOR_HEX_MAP.rose },
];

const PALETTE: readonly string[] = [
  ...PILLS.map((pill) => pill.color),
  COLOR_HEX_MAP.yellow,
  COLOR_HEX_MAP.gold,
  COLOR_HEX_MAP.burgundy,
  COLOR_HEX_MAP.saffron,
];

// ── Maths ────────────────────────────────────────────────────────────
export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));
export const lerp = (from: number, to: number, k: number): number => from + (to - from) * k;
export const prog = (t: number, start: number, end: number): number => clamp((t - start) / (end - start));
export const easeInOut = (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number): number => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number): number => k * k * k;
export const easeBack = (k: number): number => {
  const overshoot = 1.7;
  return 1 + (overshoot + 1) * Math.pow(k - 1, 3) + overshoot * Math.pow(k - 1, 2);
};
const hash = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const hexA = (hex: string, alpha: number): string => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
};
const mix = (fromHex: string, toHex: string, k: number): string => {
  const from = rgb(fromHex);
  const to = rgb(toHex);
  const kk = clamp(k);
  return `rgb(${from.map((v, i) => Math.round(lerp(v, to[i], kk))).join(',')})`;
};

export const beatAt = (index: number): number => BEAT_START + index * BEAT_LENGTH;
const rowX = (index: number): number => 59 + index * 78;

// ── Shapes: each outline as a radius per angle, so any one can morph into any other ──
const superellipse = (theta: number, a: number, b: number, power: number): number =>
  1 / Math.pow(Math.pow(Math.abs(Math.cos(theta)) / a, power) + Math.pow(Math.abs(Math.sin(theta)) / b, power), 1 / power);

const SHAPE_RADIUS: Record<ShapeKind, (theta: number) => number> = {
  circle: () => 1,
  square: (theta) => superellipse(theta, 0.9, 0.9, 7),
  ticket: (theta) => {
    const wrap = (angle: number): number => Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
    const fromNotch = Math.min(wrap(theta), wrap(theta - Math.PI));
    return superellipse(theta, 1.18, 0.74, 9) * (1 - 0.2 * Math.exp(-Math.pow(fromNotch / 0.15, 2)));
  },
  triangle: (theta) => {
    const segment = (Math.PI * 2) / 3;
    const local = (((theta + Math.PI / 2) % segment) + segment) % segment - segment / 2;
    return 0.6 / Math.cos(local);
  },
  burst: (theta) => 0.93 + 0.13 * Math.cos(8 * theta),
};

const OUTLINES: number[][] = SOURCES.map((source) =>
  Array.from({ length: SHAPE_SAMPLES }, (_, k) => SHAPE_RADIUS[source.shape]((k / SHAPE_SAMPLES) * Math.PI * 2)),
);

// ── Dotted world map: a coarse land outline, sampled on a grid ──
const LAND: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[-168,66],[-156,71],[-130,70],[-110,73],[-95,72],[-80,73],[-62,66],[-55,52],[-66,45],[-75,38],[-81,31],[-80,25],[-82,29],[-90,29],[-97,26],[-97,21],[-90,21],[-87,15],[-83,10],[-79,8],[-84,10],[-92,15],[-105,20],[-110,23],[-115,30],[-118,34],[-124,40],[-124,48],[-130,55],[-140,60],[-152,58],[-165,60]],
  [[-50,60],[-42,60],[-20,70],[-20,80],[-40,83],[-65,80],[-58,72]],
  [[-80,8],[-72,12],[-62,10],[-50,0],[-35,-5],[-38,-13],[-48,-25],[-58,-35],[-65,-42],[-68,-52],[-74,-50],[-72,-35],[-71,-18],[-77,-10],[-81,-3]],
  [[-10,36],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,57],[5,62],[15,69],[25,71],[40,68],[40,60],[30,55],[40,48],[30,45],[28,41],[22,37],[15,38],[12,44],[8,44],[3,43],[-5,36]],
  [[-6,50],[2,51],[0,53],[-2,57],[-5,58],[-5,55],[-3,54]],
  [[-17,15],[-17,21],[-13,28],[-6,35],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[42,-2],[40,-15],[35,-24],[27,-34],[18,-34],[12,-17],[9,-1],[5,5],[-8,4],[-14,9]],
  [[35,28],[39,22],[43,13],[52,16],[59,22],[56,26],[51,24],[48,29],[38,32]],
  [[26,41],[40,42],[48,42],[52,37],[48,30],[56,27],[62,25],[67,24],[72,21],[73,16],[77,8],[80,13],[80,16],[87,21],[92,22],[94,17],[98,16],[100,8],[103,1],[104,10],[109,12],[108,21],[117,23],[122,30],[121,37],[126,39],[129,35],[130,43],[141,46],[142,53],[136,55],[155,59],[162,62],[180,66],[180,72],[140,73],[110,77],[80,73],[60,70],[55,68],[40,66],[30,60],[30,50],[40,48],[45,43]],
  [[130,31],[135,34],[140,36],[142,41],[141,45],[139,42],[133,34]],
  [[114,-22],[114,-34],[118,-35],[129,-32],[138,-35],[147,-39],[153,-28],[146,-19],[142,-11],[136,-12],[130,-12],[122,-17]],
  [[95,5],[105,-6],[115,-8],[120,-9],[125,-8],[119,-3],[118,4],[110,2],[100,-1]],
];

function inPolygon(x: number, y: number, polygon: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const LAND_POINTS: Array<[number, number]> = [];
for (let lat = -54; lat <= 80; lat += 2.2) {
  for (let lng = -180; lng < 180; lng += 2.2) {
    if (LAND.some((polygon) => inPolygon(lng, lat, polygon))) LAND_POINTS.push([lng, lat]);
  }
}

// ── The sphere: points on a ball, each linked to a few neighbours ──
interface SpherePoint {
  x: number;
  y: number;
  z: number;
  color: string;
}
const SPHERE: SpherePoint[] = Array.from({ length: 110 }, (_, k) => {
  const y = 1 - (2 * (k + 0.5)) / 110;
  const ring = Math.sqrt(1 - y * y);
  const angle = k * 2.399963;
  return { x: Math.cos(angle) * ring, y, z: Math.sin(angle) * ring, color: PALETTE[k % PALETTE.length] };
});
const SPHERE_LINKS: Array<[number, number]> = [];
SPHERE.forEach((point, i) => {
  SPHERE.map((other, j): [number, number] => [j, (point.x - other.x) ** 2 + (point.y - other.y) ** 2 + (point.z - other.z) ** 2])
    .filter(([j]) => j !== i)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .forEach(([j]) => {
      if (i < j && hash(i * 31 + j) > 0.25) SPHERE_LINKS.push([i, j]);
    });
});

// ── Layout: where things sit for a given design height ──
export interface Layout {
  height: number;
  cx: number;
  /** Centre of the shapes, the swirl and the sphere. */
  cy: number;
  /** Scale of the shape and its ring; below 1 on short screens. */
  mid: number;
  captionY: number;
  pillsTop: number;
  pillScale: number;
  mapTop: number;
  mapBottom: number;
}

const TOP_BLOCK_END = 262;

export function makeLayout(height: number): Layout {
  const mid = clamp((height - 420) / 390, 0.6, 1);
  const pillScale = height < 800 ? 0.86 : 1;
  const pillsTop = height < 800 ? height - 250 : height - 286;
  const cy = clamp((300 + pillsTop - 36) / 2, TOP_BLOCK_END + 159 * mid, 296 + 163 * mid);
  return {
    height,
    cx: DESIGN_W / 2,
    cy,
    mid,
    captionY: 268,
    pillsTop,
    pillScale,
    mapTop: 302,
    mapBottom: pillsTop - 42,
  };
}

interface MapDot {
  x: number;
  y: number;
  distance: number;
  edge: number;
}
interface Marker extends MapDot {
  color: string;
  phase: number;
  side: number;
}
interface Particle {
  color: string;
  size: number;
  goAt: number;
  startRadius: number;
  startAngle: number;
  orbit: number;
  turns: number;
  fallAt: number;
}
interface PlacedPill extends PillSpec {
  x: number;
  y: number;
}

export interface Scene {
  layout: Layout;
  mapDots: MapDot[];
  markers: Marker[];
  particles: Particle[];
  pills: PlacedPill[];
}

export interface IntroFonts {
  /** Resolved family for the heavy caption lines. */
  display: string;
  /** Resolved family for pills and small labels. */
  body: string;
}

const pillFont = (fonts: IntroFonts, size: number): string => `600 ${size}px ${fonts.body}`;

function placePills(ctx: CanvasRenderingContext2D, layout: Layout, fonts: IntroFonts): PlacedPill[] {
  const scale = layout.pillScale;
  ctx.font = pillFont(fonts, 12 * scale);
  const gap = 8 * scale;
  const maxWidth = DESIGN_W - 44;
  const rows: Array<Array<{ pill: PillSpec; width: number }>> = [[]];
  let rowWidth = 0;
  PILLS.forEach((pill) => {
    const width = ctx.measureText(pill.label).width + 36 * scale;
    if (rowWidth + width > maxWidth && rows[rows.length - 1].length) {
      rows.push([]);
      rowWidth = 0;
    }
    rows[rows.length - 1].push({ pill, width });
    rowWidth += width + gap;
  });
  const placed: PlacedPill[] = [];
  rows.forEach((row, rowIndex) => {
    const total = row.reduce((sum, item) => sum + item.width, 0) + gap * (row.length - 1);
    let x = (DESIGN_W - total) / 2;
    row.forEach((item) => {
      placed.push({ ...item.pill, x: x + item.width / 2, y: layout.pillsTop + rowIndex * 37 * scale });
      x += item.width + gap;
    });
  });
  return placed;
}

export function buildScene(ctx: CanvasRenderingContext2D, layout: Layout, fonts: IntroFonts): Scene {
  const { cx, cy, mapTop, mapBottom } = layout;
  const mapScale = 2.7 * clamp((mapBottom - mapTop) / 300, 0.7, 1.1);
  const mapCy = (mapTop + mapBottom) / 2 + 20;
  const mapDots: MapDot[] = [];
  for (const [lng, lat] of LAND_POINTS) {
    const x = cx + (lng - 55) * mapScale;
    const y = mapCy - (lat - 18) * mapScale;
    if (x < -4 || x > DESIGN_W + 4 || y < mapTop || y > mapBottom) continue;
    // Fade the map out under the captions above and the pills below.
    const edge = Math.min(prog(y, mapTop, mapTop + 42), 1 - prog(y, mapBottom - 56, mapBottom));
    mapDots.push({ x, y, distance: Math.hypot(x - cx, y - cy), edge });
  }
  const markers: Marker[] = mapDots
    .filter((dot, i) => hash(i) > 0.955 && dot.edge > 0.5)
    .map((dot, i) => ({
      ...dot,
      color: PALETTE[Math.floor(hash(i + 50) * PALETTE.length)],
      phase: hash(i + 9),
      side: hash(i + 21) > 0.5 ? 1 : -1,
    }));

  const particles: Particle[] = [];
  SOURCES.forEach((source, i) => {
    for (let k = 0; k < DOTS_PER_SOURCE; k++) {
      const seed = i * 100 + k;
      const dx = rowX(i) + (hash(seed) - 0.5) * 46 - cx;
      const dy = (hash(seed + 1) - 0.5) * 46;
      particles.push({
        color: hash(seed + 7) < 0.45 ? source.color : PALETTE[Math.floor(hash(seed + 8) * PALETTE.length)],
        size: 2 + hash(seed + 3) * 1.4,
        goAt: GATHER_AT + i * 0.04 + hash(seed + 11) * 0.4,
        startRadius: Math.hypot(dx, dy),
        startAngle: Math.atan2(dy, dx),
        orbit: (30 + hash(seed + 5) * 96) * layout.mid,
        turns: 5 + hash(seed + 13) * 5,
        fallAt: 4.95 + hash(seed + 17) * 0.3,
      });
    }
  });

  return { layout, mapDots, markers, particles, pills: placePills(ctx, layout, fonts) };
}

// ── Drawing ──────────────────────────────────────────────────────────
function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number, glow = 4): void {
  if (alpha <= 0 || radius <= 0) return;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * glow);
  gradient.addColorStop(0, hexA(color, 0.5 * alpha));
  gradient.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius * glow, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexA(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function shapePath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  from: number[],
  to: number[] | null,
  morph: number,
  rotation: number,
): void {
  ctx.beginPath();
  for (let k = 0; k < SHAPE_SAMPLES; k++) {
    const theta = (k / SHAPE_SAMPLES) * Math.PI * 2;
    const r = (to ? lerp(from[k], to[k], morph) : from[k]) * radius;
    const x = cx + Math.cos(theta + rotation) * r;
    const y = cy + Math.sin(theta + rotation) * r;
    if (k) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function drawShapes(ctx: CanvasRenderingContext2D, layout: Layout, t: number): void {
  const { cx, cy, mid } = layout;
  const big = BIG_RADIUS * mid;
  if (t >= BEAT_START && t < ROW_AT) {
    const index = clamp(Math.floor((t - BEAT_START) / BEAT_LENGTH), 0, SOURCES.length - 1);
    const start = beatAt(index);
    if (index === 0) {
      shapePath(ctx, cx, cy, big * clamp(easeBack(prog(t, start, start + 0.38)), 0, 1.12), OUTLINES[0], null, 0, 0);
      ctx.fillStyle = SOURCES[0].color;
    } else {
      const k = prog(t, start, start + 0.36);
      const swell = Math.sin(k * Math.PI);
      shapePath(ctx, cx, cy, big * (1 + 0.07 * swell), OUTLINES[index - 1], OUTLINES[index], easeBack(k), swell * 0.55);
      ctx.fillStyle = mix(SOURCES[index - 1].color, SOURCES[index].color, k * 1.6);
    }
    ctx.fill();
    return;
  }
  if (t < ROW_AT || t >= GATHER_AT + 0.8) return;
  const last = SOURCES.length - 1;
  for (let i = last; i >= 0; i--) {
    const k = prog(t, ROW_AT + (last - i) * 0.035, ROW_AT + 0.42 + (last - i) * 0.035);
    const eased = easeBack(k);
    const gone = easeIn(prog(t, GATHER_AT + i * 0.04, GATHER_AT + 0.42 + i * 0.04));
    const small = SMALL_RADIUS * mid;
    const radius = (i === last ? lerp(big, small, clamp(eased, 0, 1.06)) : small * clamp(eased, 0, 1.1)) * (1 - gone);
    if (radius <= 0.4) continue;
    shapePath(ctx, lerp(cx, rowX(i), eased), cy, radius, OUTLINES[i], null, 0, (1 - k) * -1.2 + gone * 1.4);
    ctx.fillStyle = SOURCES[i].color;
    ctx.fill();
  }
}

interface DotState {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

function particleAt(particle: Particle, layout: Layout, t: number): DotState | null {
  if (t < particle.goAt) return null;
  const fall = easeIn(prog(t, particle.fallAt, 5.62));
  const radius = lerp(particle.startRadius, particle.orbit, easeInOut(prog(t, particle.goAt, particle.goAt + 1.05))) * (1 - fall);
  const angle = particle.startAngle + particle.turns * Math.pow(prog(t, particle.goAt, 5.62), 2);
  return {
    x: layout.cx + Math.cos(angle) * radius,
    y: layout.cy + Math.sin(angle) * radius,
    size: particle.size * clamp(easeBack(prog(t, particle.goAt, particle.goAt + 0.22)), 0, 1.4) * (1 - fall * 0.5),
    alpha: 1 - prog(fall, 0.82, 1),
  };
}

function drawParticles(ctx: CanvasRenderingContext2D, scene: Scene, t: number): void {
  if (t >= 5.7) return;
  for (const particle of scene.particles) {
    const dot = particleAt(particle, scene.layout, t);
    if (!dot || dot.alpha <= 0) continue;
    if (t > particle.goAt + 0.15) {
      for (let j = 1; j <= 3; j++) {
        const trail = particleAt(particle, scene.layout, t - j * 0.028);
        if (!trail) continue;
        ctx.fillStyle = hexA(particle.color, dot.alpha * (0.34 - j * 0.09));
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, dot.size * (1 - j * 0.15), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    glowDot(ctx, dot.x, dot.y, dot.size, particle.color, dot.alpha, 3.4);
  }
}

function drawSphere(ctx: CanvasRenderingContext2D, layout: Layout, t: number, ambient: number): void {
  const grow = prog(t, 4.8, 5.6);
  const open = easeIn(prog(t, MAP_START, MAP_START + 0.6));
  if (grow <= 0 || open >= 1) return;
  const { cx, cy, mid } = layout;
  const radius = 62 * mid * clamp(easeBack(grow), 0, 1.08) * (1 + 0.14 * easeInOut(prog(t, 5.7, 6.45))) * (1 + open * 5);
  const alpha = 1 - open;
  const link = easeInOut(prog(t, 5.55, 6.3));
  const spin = ambient * 0.85;
  const cosSpin = Math.cos(spin);
  const sinSpin = Math.sin(spin);
  const cosTilt = Math.cos(0.38);
  const sinTilt = Math.sin(0.38);

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.3);
  halo.addColorStop(0, `rgba(255,255,255,${0.1 * alpha * grow})`);
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2.3, 0, Math.PI * 2);
  ctx.fill();

  const projected = SPHERE.map((point) => {
    const x = point.x * cosSpin - point.z * sinSpin;
    const z = point.x * sinSpin + point.z * cosSpin;
    const y = point.y * cosTilt - z * sinTilt;
    const depth = (point.y * sinTilt + z * cosTilt + 1) / 2;
    return { x: cx + x * radius, y: cy + y * radius, depth, color: point.color };
  });
  if (link > 0) {
    ctx.lineWidth = 0.8;
    for (const [i, j] of SPHERE_LINKS) {
      const a = projected[i];
      const b = projected[j];
      ctx.strokeStyle = hexA(a.color, link * alpha * (0.12 + 0.55 * Math.min(a.depth, b.depth)));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  for (const point of projected) {
    const size = (1 + 1.7 * point.depth) * Math.min(1, grow * 1.4);
    const pointAlpha = alpha * (0.28 + 0.72 * point.depth);
    ctx.fillStyle = point.color;
    if (point.depth > 0.55) {
      ctx.globalAlpha = pointAlpha * 0.22;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = pointAlpha;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMap(ctx: CanvasRenderingContext2D, scene: Scene, t: number, ambient: number): void {
  const wave = easeOut(prog(t, MAP_START, MAP_END)) * WAVE_RADIUS;
  if (wave <= 0) return;
  const { cx, cy } = scene.layout;
  for (const dot of scene.mapDots) {
    if (dot.distance > wave) continue;
    const front = wave < WAVE_RADIUS - 2 ? 1 - clamp((wave - dot.distance) / 46) : 0;
    ctx.fillStyle = front > 0 ? `rgba(255,255,255,${dot.edge * (0.5 + front * 0.5)})` : `rgba(205,210,220,${dot.edge * 0.5})`;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, 1.35 + front * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // The dots fly back out of the sphere and land as markers.
  for (const marker of scene.markers) {
    const k = prog(t, MAP_START + 0.05 + marker.phase * 0.55, MAP_START + 0.85 + marker.phase * 0.55);
    if (k <= 0) continue;
    const eased = easeOut(k);
    const bend = Math.sin(eased * Math.PI) * 26 * marker.side;
    const reach = marker.distance || 1;
    const x = lerp(cx, marker.x, eased) + (bend * (marker.y - cy)) / reach;
    const y = lerp(cy, marker.y, eased) - (bend * (marker.x - cx)) / reach;
    const breathe = 0.5 + 0.5 * Math.sin(ambient * 1.6 + marker.phase * 6.283);
    glowDot(ctx, x, y, 3.4 * (1 + breathe * 0.16 * k), marker.color, lerp(1, marker.edge * (0.8 + breathe * 0.2), k), 2.4);
  }
  const ringAlpha = 1 - prog(t, MAP_START, MAP_END - 0.2);
  if (ringAlpha > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * 0.45})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, wave, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function setTracking(ctx: CanvasRenderingContext2D, value: string): void {
  // letterSpacing on canvas is not in every browser; the text still reads without it.
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value;
}

function drawCaption(ctx: CanvasRenderingContext2D, fonts: IntroFonts, text: string, alpha: number, y: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  setTracking(ctx, '0.6px');
  let size = 19;
  ctx.font = `900 ${size}px ${fonts.display}`;
  const widest = ctx.measureText('EVERY MORNING, WE READ ALL OF IT.').width;
  if (widest > 376) {
    size = Math.floor(((size * 376) / widest) * 10) / 10;
    ctx.font = `900 ${size}px ${fonts.display}`;
  }
  ctx.fillText(text.toUpperCase(), DESIGN_W / 2, y + (1 - easeOut(alpha)) * 10);
  ctx.restore();
}

function drawPill(ctx: CanvasRenderingContext2D, fonts: IntroFonts, pill: PlacedPill, x: number, y: number, scale: number, alpha: number, pillScale: number): void {
  if (alpha <= 0 || scale <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * pillScale, scale * pillScale);
  ctx.globalAlpha = alpha;
  ctx.font = pillFont(fonts, 12);
  const width = ctx.measureText(pill.label).width + 36;
  const height = 28;
  // A stadium outline by hand: ctx.roundRect is missing on older Safari.
  const r = height / 2;
  ctx.beginPath();
  ctx.arc(-width / 2 + r, 0, r, Math.PI / 2, -Math.PI / 2);
  ctx.arc(width / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = '#141418';
  ctx.fill();
  ctx.fillStyle = hexA(pill.color, 0.16);
  ctx.fill();
  ctx.strokeStyle = hexA(pill.color, 0.6);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = pill.color;
  ctx.beginPath();
  ctx.arc(-width / 2 + 14, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2f2ef';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pill.label, -width / 2 + 24, 0.5);
  ctx.restore();
}

function drawPills(ctx: CanvasRenderingContext2D, scene: Scene, fonts: IntroFonts, t: number): void {
  const { layout } = scene;
  const labelAlpha = prog(t, 5.0, 5.35);
  if (labelAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = labelAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = `700 9.5px ${fonts.body}`;
    setTracking(ctx, '2px');
    ctx.fillText('SORTED INTO EVERY KIND OF NIGHT', layout.cx, layout.pillsTop - 30 * layout.pillScale);
    ctx.restore();
  }
  scene.pills.forEach((pill, i) => {
    const k = prog(t, 5.05 + i * 0.07, 5.6 + i * 0.07);
    if (k <= 0) return;
    const eased = easeOut(k);
    drawPill(ctx, fonts, pill, lerp(layout.cx, pill.x, eased), lerp(layout.cy, pill.y, eased), clamp(easeBack(k), 0, 1.08), Math.min(1, k * 2.5), layout.pillScale);
  });
}

export interface LogoPose {
  x: number;
  y: number;
  size: number;
  /** Opacity of the wordmark beside the small logo. */
  wordmark: number;
  /** Opacity of the headline block. */
  copy: number;
}

/** Where the logo is at `t` seconds into the opening: big in the middle, then up into the top bar. */
export function logoPose(layout: Layout, t: number): LogoPose {
  const arrive = clamp(easeBack(prog(t, 0, 0.42)), 0, 1.08);
  const rise = easeInOut(prog(t, 1.05, 1.6));
  return {
    x: lerp(layout.cx, BRAND_X, rise),
    y: lerp(layout.cy, BRAND_Y, rise),
    size: lerp(132 * layout.mid * arrive, BRAND_SIZE, rise),
    wordmark: prog(t, 1.45, LOGO_TIME),
    copy: prog(t, 1.3, LOGO_TIME),
  };
}

/** The opening: two rings of dots turning around the logo and the five source shapes bobbing under it. */
export function drawPrelude(ctx: CanvasRenderingContext2D, layout: Layout, fonts: IntroFonts, t: number, ambient: number): void {
  if (t >= LOGO_TIME) return;
  const { cx, cy, mid } = layout;
  const leave = easeInOut(prog(t, 1.0, 1.55));
  const rings = [
    { count: 22, radius: 100 * mid, speed: 0.9, size: 2.6 },
    { count: 34, radius: 130 * mid, speed: -0.6, size: 2 },
    { count: 46, radius: 160 * mid, speed: 0.38, size: 1.5 },
  ];
  // The name, above the rings; it fades as the logo rises and the small wordmark takes over.
  const nameAlpha = prog(t, 0.2, 0.55) * (1 - leave);
  if (nameAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = nameAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${30 * mid}px ${fonts.display}`;
    setTracking(ctx, '-0.3px');
    ctx.fillText('Where\u2019s My Vibe', cx, cy - 160 * mid - 34 - leave * 16 + (1 - easeOut(prog(t, 0.2, 0.55))) * 10);
    ctx.restore();
  }
  rings.forEach((ring, r) => {
    for (let j = 0; j < ring.count; j++) {
      const k = prog(t, 0.12 + j * 0.01 + r * 0.08, 0.42 + j * 0.01 + r * 0.08);
      if (k <= 0) continue;
      const angle = (j / ring.count) * Math.PI * 2 + ambient * ring.speed + r;
      const radius = ring.radius * (0.7 + 0.3 * easeOut(k)) * (1 + leave * 1.8);
      glowDot(ctx, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, ring.size * clamp(easeBack(k), 0, 1.3), PALETTE[(j * 5 + r * 7) % PALETTE.length], 1 - leave, 3.2);
    }
  });
  SOURCES.forEach((source, i) => {
    const k = prog(t, 0.3 + i * 0.07, 0.62 + i * 0.07);
    if (k <= 0) return;
    const restX = cx + (i - (SOURCES.length - 1) / 2) * 42 * mid;
    const restY = cy + 186 * mid + Math.sin(ambient * 3.2 + i * 1.3) * 5;
    // On the way out the shapes fall into the centre, where the first big shape then appears.
    const radius = 11 * mid * clamp(easeBack(k), 0, 1.15) * (1 - leave);
    if (radius <= 0.3) return;
    shapePath(ctx, lerp(restX, cx, leave), lerp(restY, cy, leave), radius, OUTLINES[i], null, 0, Math.sin(ambient * 1.4 + i) * 0.35);
    ctx.fillStyle = source.color;
    ctx.fill();
  });
}

/** Draw one frame. `t` is the intro time; `ambient` keeps running after the intro ends. */
export function drawIntro(ctx: CanvasRenderingContext2D, scene: Scene, fonts: IntroFonts, t: number, ambient: number): void {
  const { layout } = scene;
  ctx.clearRect(0, 0, DESIGN_W, layout.height);
  drawMap(ctx, scene, t, ambient);
  drawShapes(ctx, layout, t);
  drawParticles(ctx, scene, t);
  drawSphere(ctx, layout, t, ambient);
  drawCaption(ctx, fonts, 'Every morning, we read all of it.', prog(t, 4.25, 4.6), layout.captionY);
  drawCaption(ctx, fonts, 'Then put it on one map.', prog(t, 6.8, 7.15), layout.captionY + 26);
  drawPills(ctx, scene, fonts, t);
}
