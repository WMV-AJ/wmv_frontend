'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const images = [
  '/home3/club-entry.webp',
  '/home3/brunch.webp',
  '/home3/rooftop.webp',
  '/home3/friends-night.webp',
  '/home3/beach-terrace.webp',
  '/home3/cocktails.webp',
  '/home3/pool-terrace.webp',
  '/home3/live-performance.webp',
];
const framePalette = [0xf080c0, 0x9040d0, 0x80e0ff, 0x70f0d0, 0xf05010, 0xd0f050, 0x1090c0, 0xb01020];

type Props = { activeIndex: number; onReady: () => void; onFallback: () => void };

export default function VibeInstallation({ activeIndex, onReady, onFallback }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(activeIndex);
  const readyCallback = useRef(onReady);
  const fallbackCallback = useRef(onFallback);
  useEffect(() => { activeRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { readyCallback.current = onReady; fallbackCallback.current = onFallback; }, [onReady, onFallback]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let frame = 0;
    let disposed = false;
    let visible = true;
    let firstReady = false;
    let loadedCount = 0;
    const scroller = mount.closest('main');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, .15, 9.3);
    const fan = new THREE.Group();
    scene.add(fan);
    const panels: THREE.Group[] = [];
    const frameMaterials: THREE.MeshStandardMaterial[] = [];
    const frameColors = framePalette.map((color) => new THREE.Color(color));
    const sideColors = frameColors.map((color) => color.clone().lerp(new THREE.Color(0x74777a), .42));
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const pointer = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    };
    const onPointerLeave = () => { pointer.x = 0; pointer.y = 0; };
    const onVisibility = () => { if (!document.hidden && visible && !frame && !disposed) frame = requestAnimationFrame(render); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden && !frame && !disposed) frame = requestAnimationFrame(render);
    }, { root: scroller, rootMargin: '160px' });
    const resizeObserver = new ResizeObserver(() => resize());
    const dispose = (fallback = false) => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect(); resizeObserver.disconnect();
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer?.domElement.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer?.dispose(); renderer?.domElement.remove();
      if (fallback) fallbackCallback.current();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); dispose(true); };
    const resize = () => {
      if (!renderer || disposed) return;
      const width = Math.max(1, mount.clientWidth), height = Math.max(1, mount.clientHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 640 ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 10.2 : 9.3;
      camera.updateProjectionMatrix();
    };
    function render(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || !renderer) return;
      const current = activeRef.current;
      panels.forEach((panel, index) => {
        const raw = (index - current + 8) % 8;
        const distance = raw > 4 ? raw - 8 : raw;
        const depth = Math.abs(distance);
        const targetX = distance * .73;
        const targetY = (depth ? -.12 * depth : .09) + Math.sin(now * .0006 + index) * .015;
        const targetZ = 1.4 - depth * .40;
        const targetYRotation = distance * -.17;
        const targetZRotation = distance * .048;
        const scale = depth ? Math.max(.58, .81 - depth * .045) : 1.14;
        panel.position.x += (targetX - panel.position.x) * .09;
        panel.position.y += (targetY - panel.position.y) * .09;
        panel.position.z += (targetZ - panel.position.z) * .09;
        panel.rotation.y += (targetYRotation - panel.rotation.y) * .09;
        panel.rotation.z += (targetZRotation - panel.rotation.z) * .09;
        panel.scale.x += (scale - panel.scale.x) * .09;
        panel.scale.y += (scale - panel.scale.y) * .09;
        frameMaterials[index].color.lerp(index === current ? frameColors[index] : sideColors[index], .09);
      });
      fan.rotation.y += ((pointer.x * .045) - fan.rotation.y) * .05;
      fan.rotation.x += ((-pointer.y * .03) - fan.rotation.x) * .05;
      try { renderer.render(scene, camera); } catch { dispose(true); return; }
      if (!firstReady && loadedCount === images.length) { firstReady = true; readyCallback.current(); }
      frame = requestAnimationFrame(render);
    }

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.dataset.home3Scene = 'vibes';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      mount.appendChild(renderer.domElement);

      const photoGeometry = new THREE.PlaneGeometry(2.4, 3.48);
      const frameGeometry = new THREE.BoxGeometry(2.53, 3.61, .09);
      geometries.push(photoGeometry, frameGeometry);
      images.forEach((src, index) => {
        const holder = new THREE.Group();
        const frameMaterial = new THREE.MeshStandardMaterial({ color: framePalette[index], emissive: framePalette[index], emissiveIntensity: .08, metalness: .61, roughness: .33 });
        const imageMaterial = new THREE.MeshBasicMaterial({ color: 0x414347, toneMapped: false, side: THREE.DoubleSide });
        materials.push(frameMaterial, imageMaterial);
        frameMaterials.push(frameMaterial);
        const plate = new THREE.Mesh(frameGeometry, frameMaterial);
        const photo = new THREE.Mesh(photoGeometry, imageMaterial);
        photo.position.z = .055;
        holder.add(plate, photo);
        holder.position.set((index - 3.5) * .63, -.08, -Math.abs(index - 3.5) * .4);
        panels.push(holder);
        fan.add(holder);
        new THREE.TextureLoader().load(src, (texture) => {
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(renderer?.capabilities.getMaxAnisotropy() ?? 1, 4);
          textures.push(texture);
          imageMaterial.map = texture;
          imageMaterial.color.set(0xffffff);
          imageMaterial.needsUpdate = true;
          loadedCount += 1;
        }, undefined, () => { loadedCount += 1; });
      });

      const orbitCurve = new THREE.EllipseCurve(0, 0, 4.25, 2.53, 0, Math.PI * 2, false, .15);
      const orbitPoints = orbitCurve.getPoints(160).map((point) => new THREE.Vector3(point.x, point.y, -2.2));
      const orbitGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(orbitPoints, true), 160, .025, 6, true);
      const orbitMaterial = new THREE.MeshStandardMaterial({ color: 0x9040d0, emissive: 0x9040d0, emissiveIntensity: .16, metalness: .8, roughness: .31, transparent: true, opacity: .75 });
      geometries.push(orbitGeometry); materials.push(orbitMaterial);
      scene.add(new THREE.Mesh(orbitGeometry, orbitMaterial));
      scene.add(new THREE.HemisphereLight(0xf4f4f2, 0x232427, 2.7));
      const key = new THREE.DirectionalLight(0xffffff, 3.7); key.position.set(-3, 4, 6); scene.add(key);
      const edge = new THREE.PointLight(0xf080c0, 22, 15); edge.position.set(4, -2, 5); scene.add(edge);

      observer.observe(mount); resizeObserver.observe(mount);
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
