import * as THREE from 'three';

const NASA_LM_URL = 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Apollo%20Lunar%20Module/Apollo%20Lunar%20Module.glb';
let nasaLunarModulePromise: Promise<THREE.Object3D | null> | null = null;

function loadNasaLunarModule(): Promise<THREE.Object3D | null> {
  if (nasaLunarModulePromise) return nasaLunarModulePromise;
  nasaLunarModulePromise = (async () => {
    const [{ DRACOLoader }, { GLTFLoader }] = await Promise.all([
      import('three/examples/jsm/loaders/DRACOLoader.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
    ]);
    const draco = new DRACOLoader();
    draco.setDecoderPath('./draco/');
    draco.preload();
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.setCrossOrigin('anonymous');
    try {
      const gltf = await loader.loadAsync(NASA_LM_URL);
      const source = gltf.scene;
      source.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) value.userData.persistentAsset = true;
          }
        }
      });
      return source;
    } catch (error) {
      console.warn('NASA Lunar Module enhancement unavailable; retaining mobile procedural model.', error);
      return null;
    } finally {
      draco.dispose();
    }
  })();
  return nasaLunarModulePromise;
}

function cloneNasaModel(source: THREE.Object3D): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry = child.geometry.clone();
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return clone;
}

function normalizeModelToHeight(model: THREE.Object3D, targetHeight: number): void {
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0.0001) return;
  model.scale.multiplyScalar(targetHeight / size.y);
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= box.min.y;
  model.position.z -= center.z;
}

const textureLoader = new THREE.TextureLoader();
let earthTexture: THREE.Texture | null = null;
let cloudTexture: THREE.Texture | null = null;
let moonTexture: THREE.Texture | null = null;

function tag<T extends THREE.Object3D>(object: T, label: string, description: string): T {
  object.userData.selectable = true;
  object.userData.label = label;
  object.userData.description = description;
  return object;
}

export function loadSharedTextures(): void {
  if (!earthTexture) {
    earthTexture = textureLoader.load('./assets/earth.jpg');
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    earthTexture.wrapS = THREE.RepeatWrapping;
  }
  if (!cloudTexture) {
    cloudTexture = textureLoader.load('./assets/clouds.png');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.wrapS = THREE.RepeatWrapping;
  }
  if (!moonTexture) {
    moonTexture = textureLoader.load('./assets/moon.jpg');
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    moonTexture.wrapS = THREE.RepeatWrapping;
  }
}

export function createStars(count = 1800, radius = 220): THREE.Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.75 + Math.random() * 0.25);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.4 + Math.random() * 1.4;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({
    color: 0xdde7f2,
    size: 0.45,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'Star field';
  return points;
}

export function createEarth(radius = 4): THREE.Group {
  loadSharedTextures();
  const group = tag(new THREE.Group(), 'Earth', 'The home world and starting point of Apollo 11.');
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 72, 48),
    new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.82, metalness: 0.02 })
  );
  sphere.receiveShadow = true;
  group.add(sphere);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.008, 64, 40),
    new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      roughness: 1
    })
  );
  clouds.name = 'Cloud layer';
  group.add(clouds);
  group.userData.clouds = clouds;

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.025, 48, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: { color: { value: new THREE.Color(0x4c9dff) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.66 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
          gl_FragColor = vec4(color, intensity * 0.58);
        }
      `
    })
  );
  group.add(atmosphere);
  return group;
}

export function createMoon(radius = 3.2): THREE.Group {
  loadSharedTextures();
  const group = tag(new THREE.Group(), 'Moon', 'Apollo 11 entered lunar orbit and landed in Mare Tranquillitatis.');
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 72, 48),
    new THREE.MeshStandardMaterial({ map: moonTexture, roughness: 1, metalness: 0 })
  );
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);
  return group;
}

function cylinder(radiusTop: number, radiusBottom: number, height: number, color: number, metalness = 0.25): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32, 1, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness })
  );
}

function ring(radius: number, tube: number, color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 48),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.55 })
  );
}

export function createSaturnV(scale = 1): THREE.Group {
  const rocket = tag(new THREE.Group(), 'Saturn V', 'The three-stage launch vehicle that placed Apollo 11 on a path to the Moon.');
  rocket.name = 'Saturn V';

  const white = 0xe8e6df;
  const dark = 0x111317;
  const silver = 0x9ea4a6;

  const s1 = tag(new THREE.Group(), 'S-IC first stage', 'Five F-1 engines powered the first stage through the dense lower atmosphere.');
  const body1 = cylinder(1.5, 1.55, 9, white, 0.15);
  body1.position.y = 4.5;
  s1.add(body1);
  for (let i = 0; i < 4; i += 1) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(i % 2 === 0 ? 0.75 : 3.15, 2.2, i % 2 === 0 ? 3.17 : 0.75),
      new THREE.MeshStandardMaterial({ color: dark, roughness: 0.7 })
    );
    stripe.position.y = i < 2 ? 2.1 : 7.25;
    stripe.rotation.y = (i % 2) * Math.PI / 2;
    s1.add(stripe);
  }
  const engines = tag(new THREE.Group(), 'F-1 engine cluster', 'Five large engines generated the launch thrust of the first stage.');
  const enginePositions: Array<[number, number]> = [[0, 0], [0.86, 0.86], [-0.86, 0.86], [0.86, -0.86], [-0.86, -0.86]];
  enginePositions.forEach(([x, z]) => {
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.52, 1.4, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x35383c, roughness: 0.38, metalness: 0.7, side: THREE.DoubleSide })
    );
    bell.position.set(x, -0.6, z);
    engines.add(bell);
  });
  s1.add(engines);
  s1.userData.explodeAxis = new THREE.Vector3(0, -1, 0);
  rocket.add(s1);

  const inter1 = cylinder(1.47, 1.47, 1.1, dark, 0.2);
  inter1.position.y = 9.55;
  rocket.add(inter1);

  const s2 = tag(new THREE.Group(), 'S-II second stage', 'Five J-2 engines continued acceleration after first-stage separation.');
  const body2 = cylinder(1.47, 1.47, 6.6, white, 0.15);
  body2.position.y = 13.4;
  s2.add(body2);
  const stripe2 = cylinder(1.49, 1.49, 1.2, dark, 0.15);
  stripe2.position.y = 10.8;
  s2.add(stripe2);
  s2.position.y = 0;
  s2.userData.explodeAxis = new THREE.Vector3(0, 0.6, 0);
  rocket.add(s2);

  const inter2 = cylinder(1.42, 1.42, 0.8, dark, 0.2);
  inter2.position.y = 17.1;
  rocket.add(inter2);

  const s3 = tag(new THREE.Group(), 'S-IVB third stage', 'The third stage completed Earth-orbit insertion and later restarted for translunar injection.');
  const body3 = cylinder(1.12, 1.42, 4.5, white, 0.14);
  body3.position.y = 19.75;
  s3.add(body3);
  s3.userData.explodeAxis = new THREE.Vector3(0, 1.2, 0);
  rocket.add(s3);

  const instrument = tag(cylinder(1.08, 1.08, 0.65, silver, 0.65), 'Instrument Unit', 'The ring of guidance and control equipment above the third stage.');
  instrument.position.y = 22.35;
  rocket.add(instrument);

  const adapter = tag(new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 1.08, 2.25, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: white, roughness: 0.52, metalness: 0.2, side: THREE.DoubleSide })
  ), 'Spacecraft-LM adapter', 'The tapered adapter protected the Lunar Module during launch.');
  adapter.position.y = 23.78;
  rocket.add(adapter);

  const service = cylinder(0.52, 0.52, 2.15, silver, 0.75);
  service.position.y = 25.95;
  rocket.add(service);

  const command = tag(new THREE.Mesh(
    new THREE.ConeGeometry(0.54, 1.6, 32),
    new THREE.MeshStandardMaterial({ color: 0xb7babb, roughness: 0.32, metalness: 0.78 })
  ), 'Command Module Columbia', 'The crew cabin and the only major spacecraft component to return to Earth.');
  command.position.y = 27.82;
  rocket.add(command);

  const escapeTower = tag(new THREE.Group(), 'Launch escape system', 'A solid-propellant tower designed to pull the Command Module away during a launch emergency.');
  const towerRod = cylinder(0.08, 0.08, 2.1, dark, 0.5);
  towerRod.position.y = 29.65;
  escapeTower.add(towerRod);
  const towerCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 18), new THREE.MeshStandardMaterial({ color: dark, roughness: 0.55 }));
  towerCone.position.y = 31.15;
  escapeTower.add(towerCone);
  rocket.add(escapeTower);

  rocket.scale.setScalar(scale);
  rocket.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return rocket;
}

export function createCSM(scale = 1): THREE.Group {
  const group = tag(new THREE.Group(), 'Columbia', 'Apollo 11 Command and Service Module. Michael Collins remained aboard in lunar orbit.');
  group.name = 'CSM';

  const service = tag(cylinder(0.92, 0.92, 2.6, 0x9da4a8, 0.78), 'Service Module', 'Propulsion, electrical power, oxygen, and other support systems were carried here.');
  service.rotation.z = Math.PI / 2;
  service.position.x = -0.6;
  group.add(service);

  const bands = [0x30343a, 0xd6d8d7, 0x30343a];
  bands.forEach((color, index) => {
    const b = ring(0.93, 0.025, color);
    b.rotation.y = Math.PI / 2;
    b.position.x = -1.25 + index * 0.65;
    group.add(b);
  });

  const command = tag(new THREE.Mesh(
    new THREE.ConeGeometry(0.92, 1.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xb5b9ba, roughness: 0.28, metalness: 0.82 })
  ), 'Command Module', 'The conical crew cabin carried Armstrong, Aldrin, and Collins and survived reentry.');
  command.rotation.z = -Math.PI / 2;
  command.position.x = 1.6;
  group.add(command);

  const heatShield = tag(new THREE.Mesh(
    new THREE.CylinderGeometry(0.94, 0.94, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0x4c2c1d, roughness: 0.95, metalness: 0 })
  ), 'Heat shield', 'Ablative material protected the Command Module during atmospheric entry.');
  heatShield.rotation.z = Math.PI / 2;
  heatShield.position.x = 0.68;
  group.add(heatShield);

  const engine = tag(new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.48, 1.15, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x363b40, roughness: 0.35, metalness: 0.78, side: THREE.DoubleSide })
  ), 'Service Propulsion System engine', 'The large restartable engine performed major maneuvers including lunar-orbit insertion and departure.');
  engine.rotation.z = Math.PI / 2;
  engine.position.x = -2.35;
  group.add(engine);

  const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.8, 0.04), new THREE.MeshStandardMaterial({ color: 0xd7d8d4, metalness: 0.8 }));
  antenna.position.set(-0.8, 1.55, 0);
  antenna.rotation.z = 0.25;
  group.add(antenna);

  group.scale.setScalar(scale);
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createLM(scale = 1, includeDescent = true): THREE.Group {
  const lm = tag(new THREE.Group(), 'Eagle', 'The Apollo 11 Lunar Module carried Armstrong and Aldrin between lunar orbit and the surface.');
  lm.name = 'Lunar Module';

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xc59233, roughness: 0.54, metalness: 0.68, flatShading: true });
  const goldDarkMat = new THREE.MeshStandardMaterial({ color: 0x6e4719, roughness: 0.68, metalness: 0.48, flatShading: true });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.78, metalness: 0.22, flatShading: true });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xaeb2b4, roughness: 0.38, metalness: 0.76, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d1, roughness: 0.68, metalness: 0.18 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x14202a, emissive: 0x05090d, roughness: 0.08, metalness: 0.45 });
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xbec2c1, roughness: 0.36, metalness: 0.82 });

  const strutBetween = (start: THREE.Vector3, end: THREE.Vector3, radius = 0.045, material: THREE.Material = tubeMat): THREE.Mesh => {
    const direction = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    return mesh;
  };

  if (includeDescent) {
    const descent = tag(new THREE.Group(), 'Eagle descent stage', 'The lower stage carried the landing engine, landing gear, consumables, and surface equipment. It remains at Tranquility Base.');
    descent.name = 'Descent Stage';

    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.72, 0.92, 8), goldMat);
    core.position.y = 0.48;
    descent.add(core);

    const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.12, 8), silverMat);
    deck.position.y = 1.0;
    descent.add(deck);

    const bayColors = [goldDarkMat, blackMat, goldMat, blackMat];
    for (let i = 0; i < 4; i += 1) {
      const angle = i * Math.PI / 2;
      const bay = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 0.38), bayColors[i]);
      bay.position.set(Math.sin(angle) * 1.58, 0.52, Math.cos(angle) * 1.58);
      bay.rotation.y = angle;
      descent.add(bay);
      const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.48), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x342613 : 0xd5a445, roughness: 0.82, metalness: 0.35, side: THREE.DoubleSide }));
      foil.position.set(Math.sin(angle) * 1.785, 0.52, Math.cos(angle) * 1.785);
      foil.rotation.y = angle;
      descent.add(foil);
    }

    const engine = tag(new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.64, 1.25, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x353a3d, roughness: 0.3, metalness: 0.8, side: THREE.DoubleSide })
    ), 'Descent engine', 'The throttleable descent propulsion system reduced orbital and vertical velocity during landing.');
    engine.position.y = -0.3;
    descent.add(engine);

    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + i * Math.PI / 2;
      const inner = new THREE.Vector3(Math.cos(angle) * 1.1, 0.72, Math.sin(angle) * 1.1);
      const knee = new THREE.Vector3(Math.cos(angle) * 1.75, -0.12, Math.sin(angle) * 1.75);
      const footPosition = new THREE.Vector3(Math.cos(angle) * 2.45, -1.06, Math.sin(angle) * 2.45);
      const leg = new THREE.Group();
      leg.add(strutBetween(inner, knee, 0.065));
      leg.add(strutBetween(knee, footPosition.clone().setY(-0.94), 0.075));
      leg.add(strutBetween(new THREE.Vector3(Math.cos(angle + 0.22) * 1.1, 0.72, Math.sin(angle + 0.22) * 1.1), knee, 0.035));
      leg.add(strutBetween(new THREE.Vector3(Math.cos(angle - 0.22) * 1.1, 0.72, Math.sin(angle - 0.22) * 1.1), knee, 0.035));

      const foot = tag(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.13, 28), goldMat), 'Landing footpad', 'Wide pads spread the vehicle load across the lunar regolith.');
      foot.position.copy(footPosition);
      leg.add(foot);

      if (i !== 2) {
        const probeTop = footPosition.clone().setY(-1.02);
        const probeBottom = footPosition.clone().setY(-1.9);
        leg.add(strutBetween(probeTop, probeBottom, 0.018, silverMat));
      }
      descent.add(leg);
    }

    const porch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.58), silverMat);
    porch.position.set(0, 1.08, 1.64);
    descent.add(porch);
    descent.userData.explodeAxis = new THREE.Vector3(0, -1.05, 0);
    lm.add(descent);
  }

  const ascent = tag(new THREE.Group(), 'Eagle ascent stage', 'The pressurized crew cabin and ascent propulsion system launched Armstrong and Aldrin back to lunar orbit.');
  ascent.name = 'Ascent Stage';

  const lowerCabin = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.34, 1.62, 8), silverMat);
  lowerCabin.position.y = 1.95;
  lowerCabin.rotation.y = Math.PI / 8;
  ascent.add(lowerCabin);

  const frontCabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.48, 0.62), new THREE.MeshStandardMaterial({ color: 0x8d9294, roughness: 0.48, metalness: 0.66, flatShading: true }));
  frontCabin.position.set(0, 2.08, 1.02);
  ascent.add(frontCabin);

  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.08, 1.28, 8), blackMat);
  upper.position.y = 3.33;
  upper.rotation.y = Math.PI / 8;
  ascent.add(upper);

  const topDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.12, 16), silverMat);
  topDeck.position.y = 4.0;
  ascent.add(topDeck);

  const windowShape = new THREE.Shape();
  windowShape.moveTo(-0.34, -0.28);
  windowShape.lineTo(0.28, -0.24);
  windowShape.lineTo(0.36, 0.3);
  windowShape.lineTo(-0.22, 0.34);
  windowShape.closePath();
  const windowGeometry = new THREE.ShapeGeometry(windowShape);
  const leftWindow = tag(new THREE.Mesh(windowGeometry, glassMat), 'Commander window', 'Armstrong used this triangular forward window to evaluate the landing area.');
  leftWindow.position.set(-0.5, 2.43, 1.342);
  leftWindow.rotation.z = -0.08;
  ascent.add(leftWindow);
  const rightWindow = tag(new THREE.Mesh(windowGeometry.clone(), glassMat), 'Lunar Module Pilot window', 'Aldrin monitored instruments and the lunar surface through the right forward window.');
  rightWindow.scale.x = -1;
  rightWindow.position.set(0.5, 2.43, 1.342);
  rightWindow.rotation.z = 0.08;
  ascent.add(rightWindow);

  const hatch = tag(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.72, 0.05), new THREE.MeshStandardMaterial({ color: 0x4b4f51, roughness: 0.48, metalness: 0.68 })), 'Forward hatch', 'The crew exited through the forward hatch and stepped onto the porch above the ladder.');
  hatch.position.set(0, 1.58, 1.35);
  ascent.add(hatch);
  const hatchHandle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 18, Math.PI * 1.5), tubeMat);
  hatchHandle.position.set(0.18, 1.58, 1.39);
  hatchHandle.rotation.x = Math.PI / 2;
  ascent.add(hatchHandle);

  const dockingPort = tag(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 12, 36), silverMat), 'Docking port', 'The top docking system connected Eagle with Columbia.');
  dockingPort.rotation.x = Math.PI / 2;
  dockingPort.position.y = 4.18;
  ascent.add(dockingPort);
  const dockingTunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.4, 24), blackMat);
  dockingTunnel.position.y = 4.08;
  ascent.add(dockingTunnel);

  const ascentBell = tag(new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.44, 0.84, 22, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x33383b, roughness: 0.34, metalness: 0.76, side: THREE.DoubleSide })
  ), 'Ascent engine', 'A fixed-thrust engine launched the ascent stage from the lunar surface.');
  ascentBell.position.y = 0.79;
  ascent.add(ascentBell);

  for (let i = 0; i < 4; i += 1) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const cluster = tag(new THREE.Group(), 'Reaction-control thruster cluster', 'Four RCS quads controlled Lunar Module attitude and translation.');
    cluster.position.set(Math.cos(angle) * 1.22, 3.18, Math.sin(angle) * 1.22);
    cluster.rotation.y = -angle;
    for (const y of [-0.16, 0.16]) {
      for (const x of [-0.16, 0.16]) {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.095, 0.25, 10, 1, true), blackMat);
        nozzle.rotation.z = Math.PI / 2;
        nozzle.position.set(0.18, y, x);
        cluster.add(nozzle);
      }
    }
    ascent.add(cluster);
  }

  const dishSupport = strutBetween(new THREE.Vector3(-0.72, 3.48, -0.68), new THREE.Vector3(-1.35, 4.05, -1.15), 0.025, tubeMat);
  ascent.add(dishSupport);
  const dish = tag(new THREE.Mesh(new THREE.SphereGeometry(0.52, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), whiteMat), 'S-band steerable antenna', 'The steerable high-gain antenna supported communications and tracking.');
  dish.scale.y = 0.18;
  dish.position.set(-1.38, 4.08, -1.18);
  dish.rotation.x = -0.7;
  ascent.add(dish);

  const railLeft = strutBetween(new THREE.Vector3(-0.64, 1.2, 1.48), new THREE.Vector3(-0.64, 2.0, 1.48), 0.02, tubeMat);
  const railRight = strutBetween(new THREE.Vector3(0.64, 1.2, 1.48), new THREE.Vector3(0.64, 2.0, 1.48), 0.02, tubeMat);
  ascent.add(railLeft, railRight);

  ascent.userData.explodeAxis = new THREE.Vector3(0, 1.0, 0);
  lm.add(ascent);

  if (includeDescent) {
    const ladder = tag(new THREE.Group(), 'Ladder', 'The ladder on the forward landing leg led from the porch to the forward footpad.');
    const frontZ = 1.88;
    for (const x of [-0.24, 0.24]) {
      ladder.add(strutBetween(new THREE.Vector3(x, 1.04, frontZ), new THREE.Vector3(x, -1.0, 2.28), 0.026, tubeMat));
    }
    for (let i = 0; i < 8; i += 1) {
      const t = i / 7;
      const rung = strutBetween(
        new THREE.Vector3(-0.24, 0.9 - t * 1.75, frontZ + t * 0.34),
        new THREE.Vector3(0.24, 0.9 - t * 1.75, frontZ + t * 0.34),
        0.018,
        tubeMat
      );
      ladder.add(rung);
    }
    lm.add(ladder);
  }

  lm.scale.setScalar(scale);
  lm.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return lm;
}

export function createEnhancedLM(scale = 1, includeDescent = true): THREE.Group {
  const wrapper = tag(new THREE.Group(), 'Eagle', 'Apollo 11 Lunar Module Eagle. When online, the presentation upgrades to NASA’s detailed public 3D model; the optimized reconstruction remains available as a fallback.');
  wrapper.name = 'Enhanced Lunar Module';
  const fallback = createLM(scale, includeDescent);
  fallback.userData.modelRole = 'fallback';
  wrapper.userData.fallbackModel = fallback;
  wrapper.userData.detailAllowed = true;
  wrapper.add(fallback);

  if (includeDescent) {
    void loadNasaLunarModule().then((source) => {
      if (!source || wrapper.userData.disposed) return;
      const detailed = cloneNasaModel(source);
      normalizeModelToHeight(detailed, 5.45 * scale);
      detailed.userData.modelRole = 'detailed';
      detailed.visible = wrapper.userData.detailAllowed !== false;
      fallback.visible = !detailed.visible;
      wrapper.userData.detailedModel = detailed;
      wrapper.add(detailed);
    });
  }
  return wrapper;
}

export function setEnhancedModelDetail(root: THREE.Object3D, enabled: boolean): void {
  root.traverse((child) => {
    const fallback = child.userData.fallbackModel as THREE.Object3D | undefined;
    const detailed = child.userData.detailedModel as THREE.Object3D | undefined;
    if (!fallback) return;
    child.userData.detailAllowed = enabled;
    const exploded = Boolean(child.userData.explodedActive);
    if (detailed) detailed.visible = enabled && !exploded;
    fallback.visible = !detailed || !enabled || exploded;
  });
}

export function createAstronaut(scale = 1, commander = false): THREE.Group {
  const astronaut = tag(new THREE.Group(), commander ? 'Neil Armstrong' : 'Buzz Aldrin', 'A mobile-optimized articulated representation of the Apollo A7L pressure suit and portable life-support system.');
  const suit = new THREE.MeshStandardMaterial({ color: 0xe4e3dd, roughness: 0.72, metalness: 0.03 });
  const joint = new THREE.MeshStandardMaterial({ color: 0xbec0bd, roughness: 0.76, metalness: 0.06 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x8a5b24, emissive: 0x1b0d02, roughness: 0.16, metalness: 0.82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x34383a, roughness: 0.84, metalness: 0.08 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa83b31, roughness: 0.75 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.02, 0.44, 3, 3, 2), suit);
  torso.position.y = 1.62;
  astronaut.add(torso);

  const chestUnit = tag(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.18), new THREE.MeshStandardMaterial({ color: 0xd2d0c6, roughness: 0.62, metalness: 0.18 })), 'Remote control unit', 'The chest-mounted controls and displays connected the astronaut to the life-support backpack.');
  chestUnit.position.set(0, 1.72, 0.3);
  astronaut.add(chestUnit);
  const gauge = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ color: 0x25323a }));
  gauge.position.set(-0.1, 1.79, 0.396);
  astronaut.add(gauge);

  const backpack = tag(new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.0, 0.34, 2, 3, 2), new THREE.MeshStandardMaterial({ color: 0xc8c7c0, roughness: 0.68, metalness: 0.06 })), 'Portable life-support system', 'The backpack supplied oxygen, cooling water, carbon-dioxide removal, power, and communications during the EVA.');
  backpack.position.set(0, 1.7, -0.36);
  astronaut.add(backpack);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 6), dark);
  antenna.position.set(0.22, 2.43, -0.4);
  antenna.rotation.z = -0.12;
  astronaut.add(antenna);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.39, 24, 18), suit);
  helmet.position.y = 2.45;
  astronaut.add(helmet);
  const faceplate = new THREE.Mesh(new THREE.SphereGeometry(0.325, 24, 16, -1.17, 2.34, 0.42, 1.72), visor);
  faceplate.position.set(0, 2.45, 0.075);
  astronaut.add(faceplate);
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 10, 28), joint);
  neckRing.rotation.x = Math.PI / 2;
  neckRing.position.y = 2.12;
  astronaut.add(neckRing);

  for (const side of [-1, 1]) {
    const hip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), joint);
    hip.position.set(side * 0.23, 1.06, 0);
    astronaut.add(hip);
    const thigh = cylinder(0.145, 0.17, 0.62, 0xe4e3dd, 0.03);
    thigh.position.set(side * 0.23, 0.78, 0);
    thigh.rotation.z = side * 0.04;
    astronaut.add(thigh);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 8), joint);
    knee.position.set(side * 0.25, 0.46, 0.025);
    astronaut.add(knee);
    const shin = cylinder(0.12, 0.145, 0.5, 0xe4e3dd, 0.03);
    shin.position.set(side * 0.26, 0.25, 0.03);
    astronaut.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.55), dark);
    boot.position.set(side * 0.27, -0.04, 0.12);
    astronaut.add(boot);

    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), suit);
    shoulder.position.set(side * 0.47, 1.86, 0);
    astronaut.add(shoulder);
    const upperArm = cylinder(0.105, 0.13, 0.48, 0xe4e3dd, 0.03);
    upperArm.position.set(side * 0.59, 1.65, 0.03);
    upperArm.rotation.z = side * -0.48;
    astronaut.add(upperArm);
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), joint);
    elbow.position.set(side * 0.7, 1.45, 0.07);
    astronaut.add(elbow);
    const forearm = cylinder(0.09, 0.11, 0.45, 0xe4e3dd, 0.03);
    forearm.position.set(side * 0.78, 1.28, 0.13);
    forearm.rotation.z = side * -0.25;
    astronaut.add(forearm);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), suit);
    glove.position.set(side * 0.84, 1.06, 0.17);
    astronaut.add(glove);

    if (commander && side === 1) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.025, 8, 20), red);
      stripe.rotation.x = Math.PI / 2;
      stripe.position.set(side * 0.63, 1.58, 0.04);
      astronaut.add(stripe);
    }
  }

  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.22, 1.9, 0.28),
    new THREE.Vector3(0.42, 1.62, 0.34),
    new THREE.Vector3(0.18, 1.35, 0.31)
  ]);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 20, 0.025, 6, false), dark);
  astronaut.add(hose);

  astronaut.scale.setScalar(scale);
  astronaut.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return astronaut;
}

export function createFlag(scale = 1): THREE.Group {
  const group = tag(new THREE.Group(), 'Flag assembly', 'The flag was supported by a vertical staff and a horizontal telescoping rod because there is no wind on the Moon.');
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c4, roughness: 0.42, metalness: 0.82 });
  const pole = cylinder(0.025, 0.025, 3, 0xc9c9c4, 0.82);
  pole.position.y = 1.5;
  group.add(pole);
  const bar = cylinder(0.02, 0.02, 1.8, 0xc9c9c4, 0.82);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0.9, 2.8, 0);
  group.add(bar);
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 250;
  const ctx = canvas.getContext('2d')!;
  for (let row = 0; row < 13; row += 1) {
    ctx.fillStyle = row % 2 === 0 ? '#b22234' : '#f5f3e8';
    ctx.fillRect(0, row * canvas.height / 13, canvas.width, canvas.height / 13 + 1);
  }
  ctx.fillStyle = '#3c3b6e';
  ctx.fillRect(0, 0, canvas.width * 0.42, canvas.height * 7 / 13);
  ctx.fillStyle = '#ffffff';
  for (let r = 0; r < 5; r += 1) {
    for (let c = 0; c < 7; c += 1) {
      ctx.beginPath();
      ctx.arc(13 + c * 23 + (r % 2) * 7, 12 + r * 21, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const cloth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.05, 12, 6),
    new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.9 })
  );
  const pos = cloth.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.sin((x + y) * 6) * 0.035 * ((x + 0.9) / 1.8));
  }
  cloth.position.set(0.9, 2.28, 0);
  group.add(cloth);
  group.scale.setScalar(scale);
  return group;
}

export function createTrajectoryLine(points: THREE.Vector3[], color = 0xd6a44b, opacity = 0.85): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const line = new THREE.Line(geometry, material);
  line.name = 'Mission trajectory';
  line.userData.selectable = true;
  line.userData.label = 'Mission trajectory';
  line.userData.description = 'A scaled visualization of the spacecraft path. Orbital and interplanetary segments are enlarged for legibility.';
  return line;
}

export function createTerrain(size = 130, segments = 88, seed = 3): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const color = new Float32Array(pos.count * 3);

  const craters = Array.from({ length: 32 }, (_, index) => {
    const a = Math.sin(seed * 71.7 + index * 13.41) * 43758.5453;
    const b = Math.sin(seed * 18.1 + index * 31.73) * 12515.873;
    const c = Math.sin(seed * 44.2 + index * 17.29) * 5921.217;
    return {
      x: ((a - Math.floor(a)) - 0.5) * size * 0.9,
      z: ((b - Math.floor(b)) - 0.5) * size * 0.9,
      r: 1.2 + (c - Math.floor(c)) * 7.5,
      d: 0.28 + ((a * 3) - Math.floor(a * 3)) * 1.4
    };
  });

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let y = Math.sin(x * 0.08 + seed) * 0.18 + Math.cos(z * 0.095 - seed) * 0.16 + Math.sin((x + z) * 0.21) * 0.07;
    for (const crater of craters) {
      const dx = x - crater.x;
      const dz = z - crater.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < crater.r * 1.35) {
        const t = dist / crater.r;
        if (t < 1) y -= (1 - t * t) * crater.d;
        y += Math.exp(-Math.pow((t - 1.02) / 0.16, 2)) * crater.d * 0.42;
      }
    }
    pos.setY(i, y);
    const shade = THREE.MathUtils.clamp(0.46 + y * 0.06 + Math.sin(x * 0.7 + z * 0.3) * 0.035, 0.32, 0.68);
    color[i * 3] = shade * 0.92;
    color[i * 3 + 1] = shade * 0.93;
    color[i * 3 + 2] = shade * 0.94;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const terrain = tag(new THREE.Mesh(geometry, material), 'Lunar terrain', 'Major terrain context is inspired by landing-site data; small-scale surface variation is illustrative.');
  terrain.receiveShadow = true;
  return terrain;
}

export function createRockField(count = 160, radius = 42): THREE.InstancedMesh {
  const geometry = new THREE.DodecahedronGeometry(0.28, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0x777773, roughness: 1 });
  const instanced = new THREE.InstancedMesh(geometry, material, count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.sqrt(Math.random()) * radius;
    position.set(Math.cos(angle) * r, -0.05, Math.sin(angle) * r);
    quaternion.setFromEuler(new THREE.Euler(Math.random(), Math.random(), Math.random()));
    const s = 0.25 + Math.pow(Math.random(), 3) * 1.2;
    scale.set(s * (0.7 + Math.random() * 0.6), s, s * (0.7 + Math.random() * 0.6));
    matrix.compose(position, quaternion, scale);
    instanced.setMatrixAt(i, matrix);
  }
  instanced.castShadow = true;
  instanced.receiveShadow = true;
  instanced.name = 'Lunar rocks';
  return instanced;
}

export function createPad(): THREE.Group {
  const pad = tag(new THREE.Group(), 'Launch Complex 39A', 'The launch complex, mobile launcher, and umbilical tower supported Saturn V before liftoff.');
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x747976, roughness: 0.96 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xa8432e, roughness: 0.68, metalness: 0.35 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x2e3334, roughness: 0.65, metalness: 0.48 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(22, 1.6, 22), concreteMat);
  base.position.y = -0.8;
  base.receiveShadow = true;
  pad.add(base);

  const mount = tag(new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.2, 7.2), darkSteel), 'Mobile launcher platform', 'The Saturn V stood on the mobile launcher platform above the flame opening.');
  mount.position.y = 1.3;
  pad.add(mount);

  const trench = tag(new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.2, 18), new THREE.MeshStandardMaterial({ color: 0x242625, roughness: 0.9 })), 'Flame trench', 'The trench redirected exhaust away from the launch vehicle and platform.');
  trench.position.set(0, -0.2, 8);
  pad.add(trench);

  const tower = tag(new THREE.Group(), 'Launch umbilical tower', 'The tower connected electrical, propellant, access, and servicing systems to Saturn V.');
  for (let level = 0; level < 14; level += 1) {
    const y = level * 2.25 + 1.4;
    for (const x of [-3.6, 3.6]) {
      for (const z of [-3.6, 3.6]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.25, 0.28), steelMat);
        post.position.set(x, y, z);
        tower.add(post);
      }
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 0.18, 8), darkSteel);
    deck.position.y = y + 1.05;
    tower.add(deck);
  }
  tower.position.set(-7.8, 0, 0);
  pad.add(tower);

  for (let i = 0; i < 7; i += 1) {
    const arm = tag(new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.35, 0.55), steelMat), i === 5 ? 'Crew access arm' : `Umbilical arm ${i + 1}`, i === 5 ? 'The crew entered the spacecraft through the access arm near the top of the tower.' : 'An umbilical arm carried servicing connections to the vehicle.');
    arm.position.set(-4.85, 5.2 + i * 3.45, 0);
    pad.add(arm);
  }

  pad.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return pad;
}

export function createParachutes(scale = 1): THREE.Group {
  const group = tag(new THREE.Group(), 'Main parachutes', 'Three main parachutes slowed the Command Module for splashdown.');
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xeae5d8, roughness: 0.92, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i += 1) {
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2), canopyMat);
    canopy.position.set((i - 1) * 2.7, 5 + Math.abs(i - 1) * 0.25, 0);
    canopy.scale.y = 0.48;
    group.add(canopy);
    for (let j = 0; j < 8; j += 1) {
      const angle = (j / 8) * Math.PI * 2;
      const start = new THREE.Vector3((i - 1) * 2.7 + Math.cos(angle) * 1.3, 5, Math.sin(angle) * 1.3);
      const end = new THREE.Vector3(0, 0.1, 0);
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xdad6ca, transparent: true, opacity: 0.7 })));
    }
  }
  group.scale.setScalar(scale);
  return group;
}

export function setExploded(root: THREE.Object3D, amount: number): void {
  root.traverse((child) => {
    if (!child.userData.basePosition) child.userData.basePosition = child.position.clone();
    const base = child.userData.basePosition as THREE.Vector3;
    const axis = child.userData.explodeAxis as THREE.Vector3 | undefined;
    if (axis) child.position.copy(base).addScaledVector(axis, amount);

    const fallback = child.userData.fallbackModel as THREE.Object3D | undefined;
    const detailed = child.userData.detailedModel as THREE.Object3D | undefined;
    if (fallback) {
      const active = amount > 0.001;
      child.userData.explodedActive = active;
      const detailAllowed = child.userData.detailAllowed !== false;
      if (detailed) detailed.visible = detailAllowed && !active;
      fallback.visible = !detailed || !detailAllowed || active;
    }
  });
}
