import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { MissionChapter } from '../data/mission';
import {
  createAstronaut,
  createCSM,
  createEarth,
  createEnhancedLM,
  createFlag,
  createLM,
  createMoon,
  createPad,
  createParachutes,
  createRockField,
  createSaturnV,
  createStars,
  createTerrain,
  createTrajectoryLine,
  setEnhancedModelDetail,
  setExploded
} from './models';

interface SceneBundle {
  root: THREE.Group;
  update: (progress: number, delta: number, elapsed: number) => void;
  getCamera: (progress: number) => { position: THREE.Vector3; target: THREE.Vector3; fov?: number };
  scaleLabel: string;
  hero?: THREE.Object3D;
}

export interface RenderStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  quality: 'HIGH' | 'BALANCED' | 'BATTERY';
  renderer: string;
}

export interface SelectionInfo {
  label: string;
  description: string;
}

interface MissionRendererOptions {
  onSelect: (selection: SelectionInfo | null) => void;
  onStats: (stats: RenderStats) => void;
  reducedMotion: boolean;
  onFreeCamera: () => void;
}

const easeInOut = (t: number): number => t * t * (3 - 2 * t);
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function disposeObject(root: THREE.Object3D): void {
  root.traverse((child) => {
    child.userData.disposed = true;
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      child.geometry?.dispose();
      const material = child.material;
      const disposeMaterial = (item: THREE.Material): void => {
        Object.values(item).forEach((value) => {
          if (value instanceof THREE.Texture && !value.userData.persistentAsset && !String(value.image?.src ?? '').includes('/assets/')) value.dispose();
        });
        item.dispose();
      };
      if (Array.isArray(material)) material.forEach(disposeMaterial);
      else if (material) disposeMaterial(material);
    }
  });
}

function createGlow(color: number, size: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  const c = new THREE.Color(color);
  gradient.addColorStop(0, `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},1)`);
  gradient.addColorStop(0.2, `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},0.75)`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.scale.setScalar(size);
  return sprite;
}

function createLocatorLabel(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const tone = new THREE.Color(color);
  const rgb = `${Math.round(tone.r * 255)},${Math.round(tone.g * 255)},${Math.round(tone.b * 255)}`;
  ctx.fillStyle = 'rgba(3,5,9,0.78)';
  ctx.strokeStyle = `rgba(${rgb},0.62)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 4, 376, 88, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgb(${rgb})`;
  ctx.font = '600 38px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 49);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  sprite.scale.set(46, 11.5, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function createParticleCloud(count: number, color: number, size: number): THREE.Points {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 2;
    positions[i * 3 + 1] = Math.random() * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    speeds[i] = 0.4 + Math.random() * 1.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Points(geometry, material);
}

function updateParticleCloud(points: THREE.Points, delta: number, rise: number, radius: number, resetY: number): void {
  const positions = points.geometry.attributes.position as THREE.BufferAttribute;
  const speeds = points.geometry.attributes.speed as THREE.BufferAttribute | undefined;
  for (let i = 0; i < positions.count; i += 1) {
    let x = positions.getX(i);
    let y = positions.getY(i);
    let z = positions.getZ(i);
    const speed = speeds ? speeds.getX(i) : 1;
    y += delta * rise * speed;
    x += Math.sin(y * 2.1 + i) * delta * 0.4;
    z += Math.cos(y * 1.7 + i) * delta * 0.4;
    if (y > resetY) {
      y = 0;
      x = (Math.random() - 0.5) * radius;
      z = (Math.random() - 0.5) * radius;
    }
    positions.setXYZ(i, x, y, z);
  }
  positions.needsUpdate = true;
}

function addSpaceLighting(root: THREE.Object3D, intensity = 3.2): void {
  const ambient = new THREE.HemisphereLight(0x8ea0bf, 0x050609, 0.32);
  root.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff2d1, intensity);
  sun.position.set(-18, 12, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 100;
  root.add(sun);
}

function curvePoints(start: THREE.Vector3, control: THREE.Vector3, end: THREE.Vector3, count = 100): THREE.Vector3[] {
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  return curve.getPoints(count);
}

export class MissionRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.02, 1000);
  private controls: OrbitControls;
  private bundle: SceneBundle | null = null;
  private chapterId = '';
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDown = new THREE.Vector2();
  private guided = true;
  private exploded = false;
  private scaleMode: 'TRUE' | 'EDUCATIONAL' = 'EDUCATIONAL';
  private quality: 'HIGH' | 'BALANCED' | 'BATTERY' = 'BALANCED';
  private running = true;
  private width = 1;
  private height = 1;
  private lastFrame = performance.now();
  private lastRenderAt = 0;
  private playbackActive = false;
  private simulationElapsed = 0;
  private frameAccumulator = 0;
  private frameCount = 0;
  private statTimer = 0;
  private frameMs = 16.7;
  private reducedMotion: boolean;
  private onSelect: MissionRendererOptions['onSelect'];
  private onStats: MissionRendererOptions['onStats'];
  private onFreeCamera: MissionRendererOptions['onFreeCamera'];
  private handlePointerDownBound: (event: PointerEvent) => void;
  private handlePointerUpBound: (event: PointerEvent) => void;
  private handleVisibilityBound: () => void;

  constructor(canvas: HTMLCanvasElement, options: MissionRendererOptions) {
    this.canvas = canvas;
    this.onSelect = options.onSelect;
    this.onStats = options.onStats;
    this.onFreeCamera = options.onFreeCamera;
    this.reducedMotion = options.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x030509, 1);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.52;
    this.controls.zoomSpeed = 0.75;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 95;
    this.controls.addEventListener('start', () => {
      this.guided = false;
      this.onFreeCamera();
    });

    this.handlePointerDownBound = this.handlePointerDown.bind(this);
    this.handlePointerUpBound = this.handlePointerUp.bind(this);
    this.handleVisibilityBound = this.handleVisibility.bind(this);
    canvas.addEventListener('pointerdown', this.handlePointerDownBound, { passive: true });
    canvas.addEventListener('pointerup', this.handlePointerUpBound, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityBound);

    this.setQuality('BALANCED');
  }

  private handleVisibility(): void {
    this.running = document.visibilityState === 'visible';
    if (this.running) this.lastFrame = performance.now();
  }

  private handlePointerDown(event: PointerEvent): void {
    this.pointerDown.set(event.clientX, event.clientY);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 12) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    const hit = hits.find((candidate) => {
      let node: THREE.Object3D | null = candidate.object;
      while (node) {
        if (node.userData.selectable) return true;
        node = node.parent;
      }
      return false;
    });
    if (!hit) {
      this.onSelect(null);
      return;
    }
    let node: THREE.Object3D | null = hit.object;
    while (node && !node.userData.selectable) node = node.parent;
    if (node) {
      this.onSelect({ label: node.userData.label as string, description: node.userData.description as string });
      const world = new THREE.Vector3();
      node.getWorldPosition(world);
      this.controls.target.lerp(world, 0.65);
    }
  }

  resize(width: number, height: number): void {
    this.width = Math.max(width, 1);
    this.height = Math.max(height, 1);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
    this.applyPixelRatio();
  }

  private applyPixelRatio(): void {
    const device = Math.min(window.devicePixelRatio || 1, 2.3);
    const scale = this.quality === 'HIGH' ? 0.95 : this.quality === 'BALANCED' ? 0.76 : 0.58;
    this.renderer.setPixelRatio(Math.max(0.8, device * scale));
  }

  setQuality(quality: 'HIGH' | 'BALANCED' | 'BATTERY'): void {
    this.quality = quality;
    this.applyPixelRatio();
    this.renderer.shadowMap.enabled = quality !== 'BATTERY';
    if (this.bundle) setEnhancedModelDetail(this.bundle.root, quality !== 'BATTERY');
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  setScaleMode(mode: 'TRUE' | 'EDUCATIONAL'): void {
    this.scaleMode = mode;
    this.guided = true;
    this.updateControlLimits();
  }

  setPlaybackActive(value: boolean): void {
    this.playbackActive = value;
    this.lastFrame = performance.now();
  }

  private updateControlLimits(): void {
    const astronomical = (this.chapterId === 'scale' || this.chapterId === 'epilogue') && this.scaleMode === 'TRUE';
    this.controls.minDistance = astronomical ? 12 : 2;
    this.controls.maxDistance = astronomical ? 950 : 95;
  }

  getScaleLabel(): string {
    if (this.chapterId === 'scale' || this.chapterId === 'epilogue') {
      return this.scaleMode === 'TRUE' ? 'TRUE RELATIVE SCALE' : 'EDUCATIONAL COMPRESSION';
    }
    return this.bundle?.scaleLabel ?? 'LOCAL RECONSTRUCTION';
  }

  setGuided(value: boolean): void {
    this.guided = value;
  }

  isGuided(): boolean {
    return this.guided;
  }

  setExploded(value: boolean): void {
    this.exploded = value;
  }

  setChapter(chapter: MissionChapter): void {
    if (this.chapterId === chapter.id) return;
    if (this.bundle) {
      this.scene.remove(this.bundle.root);
      disposeObject(this.bundle.root);
      this.bundle = null;
    }
    this.scene.background = new THREE.Color(0x030509);
    this.scene.fog = null;
    this.bundle = this.buildScene(chapter.id);
    this.scene.add(this.bundle.root);
    setEnhancedModelDetail(this.bundle.root, this.quality !== 'BATTERY');
    this.chapterId = chapter.id;
    this.simulationElapsed = 0;
    this.lastRenderAt = 0;
    this.guided = true;
    this.updateControlLimits();
    this.exploded = false;
    this.onSelect(null);
    const initial = this.bundle.getCamera(0);
    this.camera.position.copy(initial.position);
    this.controls.target.copy(initial.target);
    this.camera.fov = initial.fov ?? 45;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  render(progress: number): void {
    if (!this.running || !this.bundle) return;
    const now = performance.now();
    const targetFps = this.playbackActive
      ? (this.quality === 'HIGH' ? 60 : this.quality === 'BALANCED' ? 30 : 24)
      : (this.quality === 'HIGH' ? 30 : this.quality === 'BALANCED' ? 20 : 12);
    const minimumInterval = 1000 / targetFps;
    if (this.lastRenderAt > 0 && now - this.lastRenderAt < minimumInterval) return;
    this.lastRenderAt = now;

    const wallDelta = Math.min((now - this.lastFrame) / 1000, 0.08);
    const simulationDelta = this.playbackActive ? wallDelta : 0;
    this.lastFrame = now;
    this.simulationElapsed += simulationDelta;
    this.bundle.update(progress, simulationDelta, this.simulationElapsed);
    if (this.bundle.hero) setExploded(this.bundle.hero, this.exploded ? 1 : 0);

    if (this.guided) {
      const cameraCue = this.bundle.getCamera(progress);
      const lerp = this.reducedMotion ? 1 : 1 - Math.pow(0.00008, wallDelta);
      this.camera.position.lerp(cameraCue.position, lerp);
      this.controls.target.lerp(cameraCue.target, lerp);
      if (cameraCue.fov && Math.abs(this.camera.fov - cameraCue.fov) > 0.02) {
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, cameraCue.fov, lerp);
        this.camera.updateProjectionMatrix();
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const currentFrameMs = wallDelta * 1000;
    this.frameMs = this.frameMs * 0.9 + currentFrameMs * 0.1;
    this.frameAccumulator += wallDelta;
    this.frameCount += 1;
    this.statTimer += wallDelta;
    if (this.statTimer > 1) {
      const fps = this.frameCount / Math.max(this.frameAccumulator, 0.001);
      if (this.playbackActive && fps < targetFps * 0.72 && this.quality === 'HIGH') this.setQuality('BALANCED');
      else if (this.playbackActive && fps < targetFps * 0.72 && this.quality === 'BALANCED') this.setQuality('BATTERY');
      this.onStats({
        fps,
        frameMs: this.frameMs,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        quality: this.quality,
        renderer: `WebGL${this.renderer.capabilities.isWebGL2 ? '2' : '1'}`
      });
      this.frameAccumulator = 0;
      this.frameCount = 0;
      this.statTimer = 0;
    }
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDownBound);
    this.canvas.removeEventListener('pointerup', this.handlePointerUpBound);
    document.removeEventListener('visibilitychange', this.handleVisibilityBound);
    this.controls.dispose();
    if (this.bundle) disposeObject(this.bundle.root);
    this.renderer.dispose();
  }

  private buildScene(id: string): SceneBundle {
    switch (id) {
      case 'scale': return this.buildScale(false);
      case 'launch': return this.buildLaunch();
      case 'ascent': return this.buildAscent();
      case 'earth-orbit': return this.buildEarthOrbit();
      case 'tli': return this.buildTLI();
      case 'docking': return this.buildDocking();
      case 'coast': return this.buildCoast();
      case 'lunar-orbit': return this.buildLunarOrbit();
      case 'descent': return this.buildDescent();
      case 'eva': return this.buildEVA();
      case 'ascent-rendezvous': return this.buildAscentRendezvous();
      case 'return': return this.buildReturn();
      case 'reentry': return this.buildReentry();
      case 'epilogue': return this.buildScale(true);
      default: return this.buildScale(false);
    }
  }

  private buildScale(epilogue: boolean): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1700, 260));
    addSpaceLighting(root, 2.7);
    const earth = createEarth(3.67);
    const moon = createMoon(1);
    const earthLocator = createGlow(0x4f9dd8, 28);
    const moonLocator = createGlow(0xe2dfcf, 16);
    const earthLabel = createLocatorLabel('EARTH', 0x7ec5ef);
    const moonLabel = createLocatorLabel('MOON', 0xe2dfcf);
    (earthLocator.material as THREE.SpriteMaterial).opacity = 0.55;
    (moonLocator.material as THREE.SpriteMaterial).opacity = 0.45;
    root.add(earth, moon, earthLocator, moonLocator, earthLabel, moonLabel);

    const points = curvePoints(new THREE.Vector3(-18, 2.4, 0), new THREE.Vector3(0, 12, 3), new THREE.Vector3(18, 0, 0), 150);
    const returnPoints = curvePoints(new THREE.Vector3(18, -0.2, 0), new THREE.Vector3(1, -12, -3), new THREE.Vector3(-18, -2, 0), 120);
    const outbound = createTrajectoryLine(points, 0xd6a44b, 0.9);
    const inbound = createTrajectoryLine(returnPoints, 0x6ea2ce, epilogue ? 0.86 : 0.18);
    root.add(outbound, inbound);

    const ship = createCSM(0.22);
    const lm = createLM(0.16);
    lm.position.set(-1.2, -0.1, 0);
    ship.add(lm);
    root.add(ship);
    const beacon = createGlow(0xf2be62, 2.2);
    ship.add(beacon);

    const trueHalfDistance = 384400 / (2 * 1737.4);
    const truePathScale = trueHalfDistance / 18;
    const updateLayout = (): number => {
      if (this.scaleMode === 'TRUE') {
        earth.position.set(-trueHalfDistance, 0, 0);
        moon.position.set(trueHalfDistance, 0, 0);
        earthLocator.position.copy(earth.position);
        moonLocator.position.copy(moon.position);
        earthLabel.position.copy(earth.position).add(new THREE.Vector3(0, 12, 0));
        moonLabel.position.copy(moon.position).add(new THREE.Vector3(0, 10, 0));
        earthLocator.visible = true;
        moonLocator.visible = true;
        earthLabel.visible = true;
        moonLabel.visible = true;
        outbound.scale.set(truePathScale, 1.1, 1);
        inbound.scale.copy(outbound.scale);
        return truePathScale;
      }
      earth.position.set(-18, 0, 0);
      moon.position.set(18, 0, 0);
      earthLocator.position.copy(earth.position);
      moonLocator.position.copy(moon.position);
      earthLabel.position.copy(earth.position).add(new THREE.Vector3(0, 12, 0));
      moonLabel.position.copy(moon.position).add(new THREE.Vector3(0, 10, 0));
      earthLocator.visible = false;
      moonLocator.visible = false;
      earthLabel.visible = false;
      moonLabel.visible = false;
      outbound.scale.set(1, 1, 1);
      inbound.scale.set(1, 1, 1);
      return 1;
    };

    return {
      root,
      hero: ship,
      scaleLabel: 'EARTH–MOON OVERVIEW',
      update: (progress, delta) => {
        const pathScale = updateLayout();
        earth.rotation.y += delta * 0.035;
        const clouds = earth.userData.clouds as THREE.Object3D;
        if (clouds) clouds.rotation.y += delta * 0.045;
        moon.rotation.y += delta * 0.009;
        const path = epilogue && progress > 0.45 ? returnPoints : points;
        const p = epilogue ? (progress < 0.45 ? progress / 0.45 : (progress - 0.45) / 0.55) : progress;
        ship.position.copy(path[Math.min(path.length - 1, Math.floor(p * (path.length - 1)))]);
        ship.position.x *= pathScale;
        if (this.scaleMode === 'TRUE') ship.position.y *= 1.1;
        ship.rotation.y += delta * 0.32;
      },
      getCamera: (progress) => {
        const trueScale = this.scaleMode === 'TRUE';
        const portrait = this.camera.aspect < 0.72;
        const z = trueScale ? (portrait ? 720 : 285) : (portrait ? 100 : 47);
        const targetY = portrait ? (trueScale ? 42 : 13) : 0;
        const y = targetY + (epilogue ? 5 - progress * 2 : 5 - progress * 1.5);
        return { position: new THREE.Vector3(0, y, z), target: new THREE.Vector3(0, targetY, 0), fov: trueScale ? 45 : 47 };
      }
    };
  }

  private buildLaunch(): SceneBundle {
    const root = new THREE.Group();
    this.scene.background = new THREE.Color(0x071019);
    this.scene.fog = new THREE.Fog(0x071019, 35, 120);
    const ambient = new THREE.HemisphereLight(0x7186a1, 0x172017, 1.15);
    root.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe0a3, 3.2);
    sun.position.set(-30, 45, 24);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -15;
    root.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(230, 230), new THREE.MeshStandardMaterial({ color: 0x26372c, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.62;
    ground.receiveShadow = true;
    root.add(ground);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(100, 230), new THREE.MeshStandardMaterial({ color: 0x173b50, roughness: 0.3, metalness: 0.05 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(70, -1.58, 0);
    root.add(water);

    const pad = createPad();
    root.add(pad);
    const rocket = createSaturnV(0.86);
    rocket.position.y = 2.55;
    root.add(rocket);

    const exhaust = createParticleCloud(this.quality === 'BATTERY' ? 90 : 180, 0xff9b45, 0.5);
    exhaust.position.set(0, 0.1, 0);
    root.add(exhaust);
    const smoke = createParticleCloud(this.quality === 'BATTERY' ? 100 : 240, 0xb5b8b3, 1.2);
    smoke.position.set(0, -1.2, 0);
    (smoke.material as THREE.PointsMaterial).blending = THREE.NormalBlending;
    (smoke.material as THREE.PointsMaterial).opacity = 0.48;
    root.add(smoke);
    const glow = createGlow(0xff8d36, 8);
    glow.position.set(0, 1.2, 0);
    root.add(glow);

    return {
      root,
      hero: rocket,
      scaleLabel: 'VEHICLE / PAD SCALE',
      update: (progress, delta) => {
        const launch = clamp01((progress - 0.46) / 0.54);
        const lift = launch * launch * 64;
        rocket.position.y = 2.55 + lift;
        exhaust.position.y = 0.1 + lift;
        glow.position.y = 0.5 + lift;
        glow.visible = progress > 0.34;
        exhaust.visible = progress > 0.34;
        smoke.visible = progress > 0.36;
        updateParticleCloud(exhaust, delta, -4.5, 2.5, 10);
        updateParticleCloud(smoke, delta, 1.2, 8, 9);
        rocket.rotation.y += delta * (progress > 0.46 ? 0.02 : 0.004);
        rocket.rotation.z = -Math.sin(launch * Math.PI * 0.5) * 0.075;
      },
      getCamera: (progress) => {
        if (progress < 0.46) {
          const orbit = progress * Math.PI * 0.7;
          const radius = this.camera.aspect < 0.72 ? 37 : 29;
          return {
            position: new THREE.Vector3(radius * Math.cos(orbit), 13 + progress * 8, radius * Math.sin(orbit)),
            target: new THREE.Vector3(-1, 13.5, 0),
            fov: 46
          };
        }
        const launch = (progress - 0.46) / 0.54;
        return {
          position: new THREE.Vector3(30 - launch * 10, 18 + launch * 45, 31),
          target: new THREE.Vector3(0, 18 + launch * 52, 0),
          fov: 47
        };
      }
    };
  }

  private buildAscent(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1200, 220));
    addSpaceLighting(root, 3.3);
    const earth = createEarth(14);
    earth.position.y = -16;
    root.add(earth);
    const rocket = createSaturnV(0.42);
    rocket.rotation.z = -0.08;
    root.add(rocket);
    const glow = createGlow(0xff8a34, 5);
    glow.position.y = -1;
    rocket.add(glow);
    const s1 = rocket.children.find((child) => child.userData.label === 'S-IC first stage');
    const s2 = rocket.children.find((child) => child.userData.label === 'S-II second stage');
    const s3 = rocket.children.find((child) => child.userData.label === 'S-IVB third stage');

    return {
      root,
      hero: rocket,
      scaleLabel: 'ASCENT RECONSTRUCTION',
      update: (progress, delta, elapsed) => {
        earth.rotation.y += delta * 0.04;
        rocket.position.set(progress * 18, 1 + progress * 50, -progress * 5);
        rocket.rotation.z = -0.08 - progress * 0.19;
        rocket.rotation.y += delta * 0.02;
        glow.material.opacity = 0.7 + Math.sin(elapsed * 20) * 0.2;
        if (s1) {
          const sep = clamp01((progress - 0.28) / 0.08);
          s1.position.y = -sep * 16;
          s1.rotation.z = sep * 0.3;
          s1.visible = progress < 0.52;
        }
        if (s2) {
          const sep = clamp01((progress - 0.56) / 0.08);
          s2.position.y = -sep * 12;
          s2.rotation.x = sep * 0.25;
          s2.visible = progress < 0.78;
        }
        if (s3) s3.visible = true;
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(20 + progress * 10, 12 + progress * 42, 36 - progress * 8),
        target: new THREE.Vector3(progress * 18, 8 + progress * 48, -progress * 5),
        fov: 46
      })
    };
  }

  private buildEarthOrbit(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1500, 240));
    addSpaceLighting(root, 3.0);
    const earth = createEarth(9);
    root.add(earth);
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i += 1) {
      const a = i / 160 * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * 12, Math.sin(a) * 2.3, Math.sin(a) * 10));
    }
    root.add(createTrajectoryLine(orbitPoints, 0xd6a44b, 0.62));
    const stack = new THREE.Group();
    const csm = createCSM(0.7);
    const lm = createLM(0.45);
    lm.position.x = -2.2;
    csm.add(lm);
    const s4 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 3.3, 28), new THREE.MeshStandardMaterial({ color: 0xd8d6cf, roughness: 0.6, metalness: 0.22 }));
    s4.rotation.z = Math.PI / 2;
    s4.position.x = -4.1;
    stack.add(csm, s4);
    root.add(stack);

    return {
      root,
      hero: stack,
      scaleLabel: 'ORBITAL SCALE — VEHICLE ENLARGED',
      update: (progress, delta) => {
        const a = progress * Math.PI * 2.8;
        stack.position.set(Math.cos(a) * 12, Math.sin(a) * 2.3, Math.sin(a) * 10);
        stack.lookAt(new THREE.Vector3(0, 0, 0));
        stack.rotateY(Math.PI / 2);
        earth.rotation.y += delta * 0.04;
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(0, 15 - progress * 2, 27),
        target: new THREE.Vector3(0, 0, 0),
        fov: 45
      })
    };
  }

  private buildTLI(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1700, 260));
    addSpaceLighting(root, 3.0);
    const earth = createEarth(7);
    earth.position.x = -20;
    const moon = createMoon(2.1);
    moon.position.x = 25;
    root.add(earth, moon);
    const points = curvePoints(new THREE.Vector3(-11, -1, 0), new THREE.Vector3(0, 10, 3), new THREE.Vector3(21, 0, 0), 150);
    root.add(createTrajectoryLine(points, 0xd6a44b, 0.95));
    const stack = new THREE.Group();
    const csm = createCSM(0.55);
    const lm = createLM(0.36);
    lm.position.x = -1.8;
    csm.add(lm);
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.05, 3.4, 28), new THREE.MeshStandardMaterial({ color: 0xe0ddd5, roughness: 0.58, metalness: 0.2 }));
    stage.rotation.z = Math.PI / 2;
    stage.position.x = -3.8;
    stack.add(csm, stage);
    const flame = createGlow(0xff8c36, 3.5);
    flame.position.x = -6;
    stack.add(flame);
    root.add(stack);

    return {
      root,
      hero: stack,
      scaleLabel: 'INTERPLANETARY DIAGRAM — DISTANCE COMPRESSED',
      update: (progress, delta) => {
        const idx = Math.min(points.length - 1, Math.floor(progress * (points.length - 1)));
        stack.position.copy(points[idx]);
        stack.rotation.z = -0.08;
        stack.rotation.y += delta * 0.06;
        flame.visible = progress < 0.62;
        earth.rotation.y += delta * 0.03;
        moon.rotation.y += delta * 0.01;
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(1, 9 - progress * 3, 43),
        target: new THREE.Vector3(1, 1, 0),
        fov: 46
      })
    };
  }

  private buildDocking(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1600, 230));
    addSpaceLighting(root, 3.5);
    const earth = createEarth(4.5);
    earth.position.set(-21, -5, -15);
    root.add(earth);

    const stage = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 6.5, 32), new THREE.MeshStandardMaterial({ color: 0xdedbd3, roughness: 0.52, metalness: 0.22 }));
    barrel.rotation.z = Math.PI / 2;
    stage.add(barrel);
    const lm = createEnhancedLM(0.7);
    lm.rotation.z = -Math.PI / 2;
    lm.position.x = 4.2;
    stage.add(lm);
    stage.position.x = 3.5;
    root.add(stage);

    const csm = createCSM(0.75);
    csm.position.set(-8, 0, 0);
    root.add(csm);
    const rcs = createParticleCloud(50, 0x8fc7ff, 0.15);
    csm.add(rcs);

    return {
      root,
      hero: csm,
      scaleLabel: 'VEHICLE SCALE — RELATIVE MOTION RECONSTRUCTED',
      update: (progress, delta) => {
        const turn = clamp01(progress / 0.38);
        const approach = clamp01((progress - 0.36) / 0.5);
        const extract = clamp01((progress - 0.84) / 0.16);
        csm.position.set(-8 + approach * 6.8 - extract * 4, Math.sin(progress * Math.PI) * 0.7, 0);
        csm.rotation.y = turn * Math.PI;
        csm.rotation.z = Math.sin(turn * Math.PI) * 0.18;
        rcs.visible = progress < 0.75;
        updateParticleCloud(rcs, delta, 1.2, 0.7, 2.5);
        if (progress > 0.74) {
          lm.position.x = 4.2 - extract * 3.7;
          if (progress > 0.88 && !csm.children.includes(lm)) {
            stage.remove(lm);
            csm.add(lm);
            lm.position.set(-2.7, 0, 0);
            lm.rotation.z = -Math.PI / 2;
          }
        }
        stage.rotation.x += delta * 0.02;
        earth.rotation.y += delta * 0.03;
      },
      getCamera: (progress) => {
        const close = progress > 0.48 && progress < 0.82;
        const portrait = this.camera.aspect < 0.72;
        return {
          position: close
            ? new THREE.Vector3(-1, portrait ? 8 : 5, portrait ? 38 : 17)
            : new THREE.Vector3(-1, portrait ? 11 : 8, portrait ? 58 : 29),
          target: new THREE.Vector3(-0.5, 0, 0),
          fov: close ? 41 : 45
        };
      }
    };
  }

  private buildCoast(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(2200, 300));
    addSpaceLighting(root, 2.8);
    const earth = createEarth(3.4);
    earth.position.set(-25, 0, -8);
    const moon = createMoon(4.4);
    moon.position.set(30, 0, 0);
    root.add(earth, moon);
    const ship = createCSM(0.9);
    const lm = createEnhancedLM(0.58);
    lm.position.set(-2.8, 0, 0);
    lm.rotation.z = -Math.PI / 2;
    ship.add(lm);
    root.add(ship);

    return {
      root,
      hero: ship,
      scaleLabel: 'VEHICLE VIEW — JOURNEY TIME COMPRESSED',
      update: (progress, delta) => {
        ship.position.set(-8 + progress * 17, Math.sin(progress * Math.PI * 2) * 1.2, 0);
        ship.rotation.x += delta * 0.14;
        ship.rotation.y += delta * 0.08;
        earth.scale.setScalar(1 - progress * 0.55);
        moon.scale.setScalar(0.45 + progress * 0.55);
        earth.rotation.y += delta * 0.04;
        moon.rotation.y += delta * 0.008;
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(-2 + progress * 3, 6, 22),
        target: new THREE.Vector3(-1 + progress * 2, 0, 0),
        fov: 42
      })
    };
  }

  private buildLunarOrbit(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1600, 260));
    addSpaceLighting(root, 3.8);
    const moon = createMoon(10);
    root.add(moon);
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i += 1) {
      const a = i / 180 * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(a) * 13, Math.sin(a) * 2.4, Math.sin(a) * 12));
    }
    root.add(createTrajectoryLine(orbitPoints, 0xd6a44b, 0.7));
    const csm = createCSM(0.5);
    const lm = createEnhancedLM(0.44);
    lm.position.x = -2.1;
    lm.rotation.z = -Math.PI / 2;
    csm.add(lm);
    root.add(csm);
    const landingMarker = createGlow(0xe6b75e, 1.3);
    landingMarker.position.set(3.2, 1.2, 9.4);
    root.add(landingMarker);

    return {
      root,
      hero: csm,
      scaleLabel: 'LUNAR ORBIT — SPACECRAFT ENLARGED',
      update: (progress, delta, elapsed) => {
        const a = progress * Math.PI * 3.6;
        csm.position.set(Math.cos(a) * 13, Math.sin(a) * 2.4, Math.sin(a) * 12);
        csm.lookAt(new THREE.Vector3(0, 0, 0));
        csm.rotateY(Math.PI / 2);
        if (progress > 0.7 && csm.children.includes(lm)) {
          const world = new THREE.Vector3();
          lm.getWorldPosition(world);
          csm.remove(lm);
          root.add(lm);
          lm.position.copy(world);
          lm.rotation.set(0, 0, -Math.PI / 2);
        }
        if (lm.parent === root) {
          lm.position.add(new THREE.Vector3(delta * 0.28, -delta * 0.07, delta * 0.08));
        }
        moon.rotation.y += delta * 0.006;
        landingMarker.material.opacity = 0.55 + Math.sin(elapsed * 4) * 0.25;
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(0, 14 - progress * 3, 27),
        target: new THREE.Vector3(0, 0, 0),
        fov: 45
      })
    };
  }

  private buildDescent(): SceneBundle {
    const root = new THREE.Group();
    this.scene.background = new THREE.Color(0x020305);
    root.add(createStars(1200, 240));
    const ambient = new THREE.HemisphereLight(0xaeb7c2, 0x030405, 0.31);
    root.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff0cb, 4.7);
    sun.position.set(-35, 26, -18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.quality === 'HIGH' ? 2048 : 1024, this.quality === 'HIGH' ? 2048 : 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    root.add(sun);

    const terrain = createTerrain(150, this.quality === 'BATTERY' ? 56 : 88, 11);
    root.add(terrain);
    root.add(createRockField(this.quality === 'BATTERY' ? 90 : 190, 56));
    const lm = createEnhancedLM(1.05);
    root.add(lm);
    const pathPoints = curvePoints(new THREE.Vector3(-45, 21, -25), new THREE.Vector3(-8, 8, 9), new THREE.Vector3(0, 0.02, 0), 180);
    const plannedPoints = curvePoints(new THREE.Vector3(-45, 21, -25), new THREE.Vector3(-5, 7, -2), new THREE.Vector3(-8, 0.02, -5), 180);
    const actualLine = createTrajectoryLine(pathPoints, 0xd6a44b, 0.75);
    const plannedLine = createTrajectoryLine(plannedPoints, 0x86a5bb, 0.38);
    root.add(actualLine, plannedLine);

    const dust = createParticleCloud(this.quality === 'BATTERY' ? 70 : 180, 0xb9b4a8, 0.34);
    (dust.material as THREE.PointsMaterial).blending = THREE.NormalBlending;
    (dust.material as THREE.PointsMaterial).opacity = 0.48;
    root.add(dust);
    const engineGlow = createGlow(0xffc15e, 2.8);
    lm.add(engineGlow);
    engineGlow.position.y = -1.2;

    const targetMarker = createGlow(0x78b5e0, 1.0);
    targetMarker.position.set(-8, 0.1, -5);
    root.add(targetMarker);

    return {
      root,
      hero: lm,
      scaleLabel: 'LOCAL LANDING-SITE RECONSTRUCTION',
      update: (progress, delta, elapsed) => {
        const p = easeInOut(progress);
        const idx = Math.min(pathPoints.length - 1, Math.floor(p * (pathPoints.length - 1)));
        lm.position.copy(pathPoints[idx]);
        lm.rotation.z = THREE.MathUtils.lerp(-0.9, 0, clamp01(progress / 0.72));
        lm.rotation.x = Math.sin(progress * Math.PI) * 0.05;
        engineGlow.visible = progress < 0.94;
        engineGlow.scale.setScalar(1.4 + (1 - progress) * 2.2 + Math.sin(elapsed * 20) * 0.18);
        dust.visible = progress > 0.71;
        dust.position.set(lm.position.x, 0.15, lm.position.z);
        if (dust.visible) updateParticleCloud(dust, delta, 0.18, 7, 1.2);
        targetMarker.material.opacity = 0.35 + Math.sin(elapsed * 5) * 0.2;
      },
      getCamera: (progress) => {
        if (progress < 0.38) {
          const idx = Math.min(pathPoints.length - 1, Math.floor(easeInOut(progress) * (pathPoints.length - 1)));
          const lander = pathPoints[idx];
          const portrait = this.camera.aspect < 0.72;
          return {
            position: lander.clone().add(new THREE.Vector3(portrait ? 20 : 16, portrait ? 9 : 7, portrait ? 34 : 27)),
            target: lander.clone().add(new THREE.Vector3(0, -2.5, 0)),
            fov: portrait ? 48 : 44
          };
        }
        if (progress < 0.78) {
          return {
            position: new THREE.Vector3(-7, 6.4, 13),
            target: new THREE.Vector3(-3, 3, 0),
            fov: 39
          };
        }
        return {
          position: new THREE.Vector3(8, 3.8, 11 - (progress - 0.78) * 8),
          target: new THREE.Vector3(0, 2.2, 0),
          fov: 43
        };
      }
    };
  }

  private buildEVA(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1000, 220));
    const ambient = new THREE.HemisphereLight(0xb8c1ca, 0x0b0c0e, 0.58);
    root.add(ambient);
    const fill = new THREE.DirectionalLight(0xa8c2d8, 1.2);
    fill.position.set(18, 12, 20);
    root.add(fill);
    const sun = new THREE.DirectionalLight(0xfff0ce, 4.15);
    sun.position.set(-28, 24, -21);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.quality === 'HIGH' ? 2048 : 1024, this.quality === 'HIGH' ? 2048 : 1024);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    root.add(sun);
    const terrain = createTerrain(110, this.quality === 'BATTERY' ? 48 : 76, 17);
    root.add(terrain);
    root.add(createRockField(this.quality === 'BATTERY' ? 90 : 170, 43));
    const lm = createEnhancedLM(1.18);
    lm.position.set(0, 0.1, 0);
    root.add(lm);
    const neil = createAstronaut(0.78, true);
    const buzz = createAstronaut(0.78);
    neil.position.set(1, 0, 4.2);
    buzz.position.set(-2.2, 0, 2.4);
    root.add(neil, buzz);
    const flag = createFlag(0.78);
    flag.position.set(7.2, 0, 2.7);
    root.add(flag);

    const seismometer = new THREE.Group();
    seismometer.userData = { selectable: true, label: 'Passive seismometer', description: 'A surface experiment designed to measure lunar seismic activity.' };
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 1.1), new THREE.MeshStandardMaterial({ color: 0xc8c2a8, roughness: 0.8, metalness: 0.25 }));
    box.position.y = 0.25;
    seismometer.add(box);
    seismometer.position.set(-8, 0, -1.5);
    root.add(seismometer);

    const retro = new THREE.Group();
    retro.userData = { selectable: true, label: 'Laser retroreflector', description: 'An array of corner reflectors used for precision laser-ranging measurements from Earth.' };
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 1.1), new THREE.MeshStandardMaterial({ color: 0xaeb6bf, roughness: 0.32, metalness: 0.65 }));
    panel.rotation.x = -0.35;
    panel.position.y = 0.65;
    retro.add(panel);
    retro.position.set(-6, 0, 5.7);
    root.add(retro);

    const tv = new THREE.Group();
    tv.userData = { selectable: true, label: 'Television camera', description: 'The camera transmitted the first moonwalk to viewers on Earth.' };
    const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.75), new THREE.MeshStandardMaterial({ color: 0x838889, roughness: 0.52, metalness: 0.6 }));
    cameraBody.position.y = 1.15;
    tv.add(cameraBody);
    const tripod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.3, 12),
      new THREE.MeshStandardMaterial({ color: 0xa7aaa7, roughness: 0.45, metalness: 0.8 })
    );
    tripod.position.y = 0.55;
    tv.add(tripod);
    tv.position.set(5.2, 0, -5.2);
    root.add(tv);

    const walkPath = [
      new THREE.Vector3(1, 0, 4.2),
      new THREE.Vector3(4, 0, 3.5),
      new THREE.Vector3(7.2, 0, 2.7),
      new THREE.Vector3(-6, 0, 5.7),
      new THREE.Vector3(-8, 0, -1.5),
      new THREE.Vector3(5.2, 0, -5.2),
      new THREE.Vector3(0.8, 0, 3.2)
    ];
    root.add(createTrajectoryLine(walkPath.map((p) => p.clone().setY(0.07)), 0xbec7ce, 0.28));

    return {
      root,
      hero: lm,
      scaleLabel: 'HUMAN / SURFACE SCALE',
      update: (progress, delta) => {
        const segment = Math.min(walkPath.length - 2, Math.floor(progress * (walkPath.length - 1)));
        const local = progress * (walkPath.length - 1) - segment;
        neil.position.lerpVectors(walkPath[segment], walkPath[segment + 1], easeInOut(local));
        neil.rotation.y = Math.atan2(walkPath[segment + 1].x - walkPath[segment].x, walkPath[segment + 1].z - walkPath[segment].z);
        neil.position.y = Math.abs(Math.sin(progress * Math.PI * 18)) * 0.08;
        buzz.rotation.y += delta * 0.06;
      },
      getCamera: (progress) => {
        const destinations = [
          new THREE.Vector3(11, 4.6, 17),
          new THREE.Vector3(10, 3.2, 8),
          new THREE.Vector3(12, 3.7, -2),
          new THREE.Vector3(1, 3.6, 13),
          new THREE.Vector3(-12, 4.4, 10),
          new THREE.Vector3(-12, 3.6, -5),
          new THREE.Vector3(9, 4.2, 12)
        ];
        const targets = [
          new THREE.Vector3(0, 2, 0),
          new THREE.Vector3(7, 1.2, 2.5),
          new THREE.Vector3(-6, 0.7, 5.7),
          new THREE.Vector3(-8, 0.6, -1.5),
          new THREE.Vector3(5.2, 0.8, -5.2),
          new THREE.Vector3(0, 2, 0),
          new THREE.Vector3(0, 1.5, 0)
        ];
        const idx = Math.min(destinations.length - 2, Math.floor(progress * (destinations.length - 1)));
        const local = easeInOut(progress * (destinations.length - 1) - idx);
        return {
          position: destinations[idx].clone().lerp(destinations[idx + 1], local),
          target: targets[idx].clone().lerp(targets[idx + 1], local),
          fov: 45
        };
      }
    };
  }

  private buildAscentRendezvous(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1500, 260));
    addSpaceLighting(root, 3.7);
    const moon = createMoon(9);
    moon.position.y = -9.4;
    root.add(moon);
    const descent = createLM(0.75, true);
    const parkedAscent = descent.children.find((child) => child.userData.label === 'Eagle ascent stage');
    if (parkedAscent) parkedAscent.visible = false;
    descent.position.set(0, 0, 0);
    root.add(descent);
    const ascent = createLM(0.75, false);
    root.add(ascent);
    const csm = createCSM(0.55);
    csm.position.set(12, 8, 0);
    root.add(csm);
    const path = curvePoints(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 16, -4), new THREE.Vector3(11, 8, 0), 150);
    root.add(createTrajectoryLine(path, 0xd6a44b, 0.72));
    const flame = createGlow(0xffb852, 2.2);
    flame.position.y = -1;
    ascent.add(flame);

    return {
      root,
      hero: ascent,
      scaleLabel: 'ASCENT / RENDEZVOUS — DISTANCE COMPRESSED',
      update: (progress, delta) => {
        const idx = Math.min(path.length - 1, Math.floor(easeInOut(progress) * (path.length - 1)));
        ascent.position.copy(path[idx]);
        ascent.rotation.y += delta * 0.08;
        flame.visible = progress < 0.65;
        csm.rotation.x += delta * 0.025;
        moon.rotation.y += delta * 0.006;
        descent.visible = progress < 0.32;
      },
      getCamera: (progress) => {
        if (progress < 0.35) {
          return { position: new THREE.Vector3(12, 8, 17), target: new THREE.Vector3(0, 4, 0), fov: 44 };
        }
        return { position: new THREE.Vector3(4, 15, 27), target: new THREE.Vector3(6, 7, 0), fov: 45 };
      }
    };
  }

  private buildReturn(): SceneBundle {
    const root = new THREE.Group();
    root.add(createStars(1900, 280));
    addSpaceLighting(root, 3.0);
    const moon = createMoon(3.4);
    moon.position.set(-24, -2, -3);
    const earth = createEarth(8);
    earth.position.set(24, 0, 0);
    root.add(moon, earth);
    const csm = createCSM(0.82);
    root.add(csm);
    const path = curvePoints(new THREE.Vector3(-13, 3, 0), new THREE.Vector3(0, -5, 2), new THREE.Vector3(13, 0, 0), 130);
    root.add(createTrajectoryLine(path, 0x6ea2ce, 0.8));
    const service = csm.children.find((child) => child.userData.label === 'Service Module');

    return {
      root,
      hero: csm,
      scaleLabel: 'RETURN TRAJECTORY — DISTANCE COMPRESSED',
      update: (progress, delta) => {
        const idx = Math.min(path.length - 1, Math.floor(progress * (path.length - 1)));
        csm.position.copy(path[idx]);
        csm.rotation.x += delta * 0.035;
        csm.rotation.y += delta * 0.02;
        earth.rotation.y += delta * 0.035;
        moon.rotation.y += delta * 0.006;
        moon.scale.setScalar(1 - progress * 0.45);
        earth.scale.setScalar(0.55 + progress * 0.45);
        if (service && progress > 0.84) {
          service.position.y -= delta * 1.7;
          service.rotation.z += delta * 0.4;
        }
      },
      getCamera: (progress) => ({
        position: new THREE.Vector3(0, 8, 35 - progress * 5),
        target: new THREE.Vector3(0, 0, 0),
        fov: 45
      })
    };
  }

  private buildReentry(): SceneBundle {
    const root = new THREE.Group();
    this.scene.background = new THREE.Color(0x07111c);
    const ambient = new THREE.HemisphereLight(0x7196bb, 0x10151a, 1.0);
    root.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe9c9, 3.4);
    sun.position.set(-20, 30, 25);
    sun.castShadow = true;
    root.add(sun);
    const earth = createEarth(28);
    earth.position.y = -25;
    root.add(earth);
    const oceanSegments = this.quality === 'BATTERY' ? 20 : 32;
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150, oceanSegments, oceanSegments),
      new THREE.MeshStandardMaterial({ color: 0x16455f, roughness: 0.28, metalness: 0.18 })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2.3;
    ocean.receiveShadow = true;
    root.add(ocean);

    const capsule = createCSM(0.82);
    const service = capsule.children.find((child) => child.userData.label === 'Service Module');
    if (service) service.visible = false;
    capsule.rotation.z = -0.42;
    root.add(capsule);
    const plasma = createParticleCloud(this.quality === 'BATTERY' ? 100 : 260, 0xff6d25, 0.42);
    capsule.add(plasma);
    const glow = createGlow(0xff4a1f, 7);
    capsule.add(glow);
    const chutes = createParachutes(0.9);
    chutes.visible = false;
    root.add(chutes);
    const splash = createParticleCloud(this.quality === 'BATTERY' ? 80 : 150, 0xb9e2ed, 0.4);
    (splash.material as THREE.PointsMaterial).blending = THREE.NormalBlending;
    splash.visible = false;
    root.add(splash);
    let lastWaveUpdate = -1;

    return {
      root,
      hero: capsule,
      scaleLabel: 'ENTRY / RECOVERY RECONSTRUCTION',
      update: (progress, delta, elapsed) => {
        const entry = clamp01(progress / 0.58);
        const chutePhase = clamp01((progress - 0.55) / 0.3);
        const splashPhase = clamp01((progress - 0.84) / 0.16);
        if (progress < 0.58) {
          capsule.visible = true;
          capsule.position.set(-16 + entry * 22, 22 - entry * 12, -4 + entry * 4);
          capsule.rotation.z = -0.42 + entry * 0.75;
          plasma.visible = true;
          glow.visible = true;
          updateParticleCloud(plasma, delta, 2.8, 3.5, 7);
          plasma.rotation.z = Math.PI / 2;
        } else {
          plasma.visible = false;
          glow.visible = false;
          capsule.position.set(0, 9 - chutePhase * 9.5, 0);
          capsule.rotation.z = 0;
          chutes.visible = progress < 0.91;
          chutes.position.set(0, capsule.position.y + 1.4, 0);
          chutes.scale.setScalar(Math.max(0.05, easeInOut(chutePhase)));
        }
        splash.visible = splashPhase > 0.12;
        splash.position.set(0, -2.1, 0);
        if (splash.visible) updateParticleCloud(splash, delta, 3.5, 5, 5);
        earth.rotation.y += delta * 0.025;
        if (lastWaveUpdate < 0 || elapsed - lastWaveUpdate >= 0.066) {
          lastWaveUpdate = elapsed;
          const pos = ocean.geometry.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < pos.count; i += 1) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            pos.setY(i, Math.sin(x * 0.22 + elapsed * 1.3) * 0.1 + Math.cos(z * 0.18 + elapsed) * 0.08);
          }
          pos.needsUpdate = true;
          ocean.geometry.computeVertexNormals();
        }
      },
      getCamera: (progress) => {
        if (progress < 0.58) return { position: new THREE.Vector3(15, 17, 30), target: new THREE.Vector3(0, 10, 0), fov: 44 };
        return { position: new THREE.Vector3(12, 7, 18), target: new THREE.Vector3(0, 3, 0), fov: 43 };
      }
    };
  }
}
