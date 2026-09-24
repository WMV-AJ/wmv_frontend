'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const HERO_POSES = ['Portal', 'Spread', 'Orbit', 'Cascade'] as const;
type Transform = [number, number, number, number, number, number, number, number];
type Pose = { loops: Transform[]; photos: Transform[] };
// Position, rotation and size for the same three metal forms and five photographs.
const POSES: Pose[] = [
  { loops: [[-.24,.1,-1.35,0,-.14,-.12,1.16,1.16],[0,0,-.98,0,0,0,1,1],[.24,-.12,-.6,0,.14,.12,.84,.84]], photos: [[.12,.1,1.28,0,0,.04,3.02,4.12],[-2.35,-.93,.25,0,-.1,-.14,1.52,2.11],[2.34,.84,.1,0,.1,.13,1.45,1.98],[-1.96,1.43,-.75,0,-.16,-.12,1.02,1.4],[1.92,-1.46,-.7,0,.15,.13,1.03,1.42]] },
  { loops: [[-2.1,.25,-1.3,0,.5,-.48,.84,.84],[.05,.05,-1.5,0,0,.16,.8,.8],[2.03,-.28,-1.42,0,-.5,.46,.78,.78]], photos: [[-1.85,.35,.8,0,-.12,-.19,1.67,2.35],[.27,.08,1.62,0,0,.025,3.03,4.12],[2.43,.55,.72,0,.16,.2,1.63,2.32],[-2.72,-.9,-.35,0,-.19,-.27,1.05,1.48],[2.69,-1.09,-.28,0,.19,.25,1.12,1.54]] },
  { loops: [[0,.08,-1.68,1.1,0,-.15,1.42,.82],[.12,.08,-1.28,1.22,0,.52,1.18,.73],[-.08,.01,-.92,1.29,0,-.8,.98,.65]], photos: [[-2.36,-.1,.04,0,-.28,-.1,1.33,1.84],[2.18,.52,-.08,0,.2,.13,1.2,1.7],[.13,.08,1.8,0,0,-.03,3.03,4.12],[2.23,-1.12,-.72,0,.2,.22,1.08,1.5],[-2.13,1.13,-.7,0,-.2,-.17,1.02,1.4]] },
  { loops: [[-1.54,1.05,-1.22,0,.42,-.36,.83,.83],[.04,.02,-1.33,0,-.3,.21,.91,.91],[1.49,-1.02,-1.39,0,.35,-.33,.87,.87]], photos: [[-2.17,1.29,.12,0,-.15,-.17,1.24,1.72],[-.95,.56,.47,0,-.1,-.1,1.3,1.83],[2.24,-.85,.08,0,.16,.15,1.22,1.68],[.64,-.13,1.75,0,0,.08,3.02,4.12],[2.31,1.31,-.57,0,.2,.16,1.02,1.42]] },
];
const HERO_PALETTES = [
  { metal: [0x80e0ff, 0xbecad0, 0xf0e000], edge: [0x80e0ff, 0x1090c0, 0xf0e000, 0x80e0ff, 0x1090c0], lights: [0x1090c0, 0x80e0ff, 0xf0e000] },
  { metal: [0x9040d0, 0xc4b7d1, 0xf080c0], edge: [0x9040d0, 0xf080c0, 0xd0f050, 0x9040d0, 0xf080c0], lights: [0xf080c0, 0x9040d0, 0xd0f050] },
  { metal: [0x087b75, 0xe5dfcc, 0xf05010], edge: [0x087b75, 0xf05010, 0xf05010, 0xfff0d5, 0x087b75], lights: [0xf05010, 0x087b75, 0xffefcc] },
  { metal: [0xb01020, 0xd6cecf, 0x70f0d0], edge: [0xb01020, 0x70f0d0, 0xb01020, 0x70f0d0, 0xb01020], lights: [0xb01020, 0x70f0d0, 0xfff4eb] },
] as const;
type Props = { pose: number; onReady: () => void; onFallback: () => void };

function makeLocationLoop() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -2.43);
  shape.bezierCurveTo(-.49, -1.79, -1.83, -.50, -1.83, .68);
  shape.bezierCurveTo(-1.83, 1.76, -1.02, 2.29, 0, 2.29);
  shape.bezierCurveTo(1.02, 2.29, 1.83, 1.76, 1.83, .68);
  shape.bezierCurveTo(1.83, -.50, .49, -1.79, 0, -2.43);
  const hole = new THREE.Path();
  hole.moveTo(0, -1.82);
  hole.bezierCurveTo(.43, -1.25, 1.38, -.33, 1.38, .64);
  hole.bezierCurveTo(1.38, 1.40, .78, 1.83, 0, 1.83);
  hole.bezierCurveTo(-.78, 1.83, -1.38, 1.40, -1.38, .64);
  hole.bezierCurveTo(-1.38, -.33, -.43, -1.25, 0, -1.82);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth: .15, steps: 1, bevelEnabled: true, bevelThickness: .055, bevelSize: .055, bevelSegments: 3, curveSegments: 28 });
}

export default function HeroSculpture({ pose, onReady, onFallback }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef(pose);
  const initialPoseRef = useRef(pose);
  useEffect(() => { poseRef.current = pose; }, [pose]);
  const readyCallback = useRef(onReady);
  const fallbackCallback = useRef(onFallback);
  useEffect(() => { readyCallback.current = onReady; fallbackCallback.current = onFallback; }, [onReady, onFallback]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let environment: THREE.WebGLRenderTarget | undefined;
    let frame = 0;
    let stopped = false;
    let visible = true;
    let firstFrame = false;
    let loadedCount = 0;
    const pointer = { x: 0, y: 0 };
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .1, 11.5);
    const installation = new THREE.Group();
    scene.add(installation);
    const loops: THREE.Mesh[] = [];
    const photos: THREE.Mesh[] = [];
    const metalMaterials: THREE.MeshPhysicalMaterial[] = [];
    const edgeMaterials: THREE.MeshBasicMaterial[] = [];
    const paletteColors = HERO_PALETTES.map((palette) => ({
      metal: palette.metal.map((color) => new THREE.Color(color)),
      edge: palette.edge.map((color) => new THREE.Color(color)),
      lights: palette.lights.map((color) => new THREE.Color(color)),
    }));
    let rim: THREE.PointLight | undefined;
    let fill: THREE.PointLight | undefined;
    let glint: THREE.PointLight | undefined;
    const scroller = mount.closest('main');

    const dispose = (fallback = false) => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      resizeObserver?.disconnect();
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      environment?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      if (fallback) fallbackCallback.current();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); dispose(true); };
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    };
    const onPointerLeave = () => { pointer.x = 0; pointer.y = 0; };
    const onVisibility = () => { if (!document.hidden && visible && !frame && !stopped) frame = requestAnimationFrame(render); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden && !frame && !stopped) frame = requestAnimationFrame(render);
    }, { root: scroller, rootMargin: '120px' });
    const resizeObserver = new ResizeObserver(() => resize());

    const resize = () => {
      if (!renderer || stopped) return;
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 640 ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 10.55 : width < 950 ? 12.2 : 11.5;
      camera.updateProjectionMatrix();
    };
    function render(now: number) {
      frame = 0;
      if (stopped || !visible || document.hidden || !renderer) return;
      const breath = Math.sin(now * .00035) * .016;
      installation.rotation.y += ((-.12 + pointer.x * .15) - installation.rotation.y) * .055;
      installation.rotation.x += ((-.08 - pointer.y * .09) - installation.rotation.x) * .055;
      const target = POSES[poseRef.current];
      const palette = paletteColors[poseRef.current];
      const approach = (mesh: THREE.Mesh, [x,y,z,rx,ry,rz,sx,sy]: Transform) => {
        const ease = .055;
        mesh.position.x += (x - mesh.position.x) * ease;
        mesh.position.y += (y + breath - mesh.position.y) * ease;
        mesh.position.z += (z - mesh.position.z) * ease;
        mesh.rotation.x += (rx - mesh.rotation.x) * ease;
        mesh.rotation.y += (ry - mesh.rotation.y) * ease;
        mesh.rotation.z += (rz - mesh.rotation.z) * ease;
        mesh.scale.x += (sx - mesh.scale.x) * ease;
        mesh.scale.y += (sy - mesh.scale.y) * ease;
      };
      loops.forEach((loop, index) => approach(loop, target.loops[index]));
      photos.forEach((photo, index) => approach(photo, target.photos[index]));
      metalMaterials.forEach((material, index) => {
        material.color.lerp(palette.metal[index], .055);
        material.emissive.lerp(palette.metal[index], .055);
      });
      edgeMaterials.forEach((material, index) => material.color.lerp(palette.edge[index], .055));
      rim?.color.lerp(palette.lights[0], .055);
      fill?.color.lerp(palette.lights[1], .055);
      glint?.color.lerp(palette.lights[2], .055);
      try { renderer.render(scene, camera); } catch { dispose(true); return; }
      if (!firstFrame && loadedCount === photos.length) { firstFrame = true; readyCallback.current(); }
      frame = requestAnimationFrame(render);
    }

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.dataset.home3Scene = 'hero';
      mount.appendChild(renderer.domElement);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();

      const geometry = makeLocationLoop();
      geometries.push(geometry);
      const finishes = [
        new THREE.MeshPhysicalMaterial({ color: 0x80e0ff, emissive: 0x80e0ff, emissiveIntensity: .16, metalness: .86, roughness: .23, clearcoat: .45, side: THREE.DoubleSide }),
        new THREE.MeshPhysicalMaterial({ color: 0xbecad0, emissive: 0xbecad0, emissiveIntensity: .09, metalness: .85, roughness: .29, clearcoat: .35, side: THREE.DoubleSide }),
        new THREE.MeshPhysicalMaterial({ color: 0xf0e000, emissive: 0xf0e000, emissiveIntensity: .13, metalness: .74, roughness: .24, clearcoat: .56, side: THREE.DoubleSide }),
      ];
      materials.push(...finishes);
      metalMaterials.push(...finishes);
      finishes.forEach((finish, index) => {
        const mesh = new THREE.Mesh(geometry, finish);
        const [x,y,z,rx,ry,rz,sx,sy] = POSES[initialPoseRef.current].loops[index];
        mesh.position.set(x,y,z); mesh.rotation.set(rx,ry,rz); mesh.scale.set(sx,sy,1);
        loops.push(mesh);
        installation.add(mesh);
      });

      const planeGeometry = new THREE.PlaneGeometry(1, 1);
      geometries.push(planeGeometry);
      const sources = ['/home3/club-entry.webp','/home3/rooftop.webp','/home3/beach-terrace.webp','/home3/live-performance.webp','/home3/friends-night.webp'];
      sources.forEach((src,index) => {
        const material = new THREE.MeshBasicMaterial({ color: 0x535458, side: THREE.DoubleSide, toneMapped: false });
        materials.push(material);
        const plane = new THREE.Mesh(planeGeometry, material);
        const edgeMaterial = new THREE.MeshBasicMaterial({ color: HERO_PALETTES[initialPoseRef.current].edge[index], side: THREE.DoubleSide, toneMapped: false });
        const edge = new THREE.Mesh(planeGeometry, edgeMaterial);
        edge.scale.set(1.055, 1.045, 1);
        edge.position.z = -.015;
        plane.add(edge);
        edgeMaterials.push(edgeMaterial);
        materials.push(edgeMaterial);
        const [x,y,z,rx,ry,rz,sx,sy] = POSES[initialPoseRef.current].photos[index];
        plane.position.set(x,y,z); plane.rotation.set(rx,ry,rz); plane.scale.set(sx,sy,1);
        photos.push(plane);
        installation.add(plane);
        new THREE.TextureLoader().load(src, (texture) => {
          if (stopped) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(renderer?.capabilities.getMaxAnisotropy() ?? 1, 4);
          textures.push(texture);
          material.map = texture;
          material.color.set(0xffffff);
          material.needsUpdate = true;
          loadedCount += 1;
        }, undefined, () => { loadedCount += 1; });
      });

      scene.add(new THREE.HemisphereLight(0xffffff, 0x252527, 3.1));
      const key = new THREE.DirectionalLight(0xffffff, 4.2); key.position.set(-3.7, 5.6, 7); scene.add(key);
      rim = new THREE.PointLight(0x1090c0, 13, 18); rim.position.set(3.3, -1.3, 3.8); scene.add(rim);
      fill = new THREE.PointLight(0x80e0ff, 17, 18); fill.position.set(-4, .4, 3); scene.add(fill);
      glint = new THREE.PointLight(0xf0e000, 4, 13); glint.position.set(0, -3.1, 2.2); scene.add(glint);

      observer.observe(mount);
      resizeObserver.observe(mount);
      mount.addEventListener('pointermove', onPointerMove, { passive: true });
      mount.addEventListener('pointerleave', onPointerLeave);
      document.addEventListener('visibilitychange', onVisibility);
      renderer.domElement.addEventListener('webglcontextlost', onContextLost, { once: true });
      resize(); frame = requestAnimationFrame(render);
    } catch {
      dispose(true);
    }
    return () => dispose();
  }, []);

  return <div ref={mountRef} className="home3-three-mount" />;
}
