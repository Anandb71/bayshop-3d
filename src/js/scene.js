import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  AmbientLight,
  DirectionalLight,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PointLight,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { coreFragment, coreVertex, pointsFragment, pointsVertex } from './shaders.js';

const TEAL = new Color('#3ddbd0');
const TEAL_DEEP = new Color('#0b3d3a');
const HOT = new Color('#e8c36a');
const ARM = new Color('#1a2a2c');
const ARM_LIGHT = new Color('#2a4a4c');

function isMobile() {
  return window.matchMedia('(max-width: 760px)').matches || navigator.maxTouchPoints > 2;
}

function fibonacciSphere(count, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = golden * i;
    pts.push(new Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

function latticePoints(count, span) {
  const pts = [];
  const side = Math.ceil(Math.cbrt(count));
  const step = span / side;
  const half = (span - step) * 0.5;
  for (let x = 0; x < side && pts.length < count; x += 1) {
    for (let y = 0; y < side && pts.length < count; y += 1) {
      for (let z = 0; z < side && pts.length < count; z += 1) {
        const jitter = (Math.sin(x * 12.1 + y * 4.3 + z * 7.7) * 0.5 + 0.5) * step * 0.28;
        pts.push(new Vector3(
          x * step - half + jitter,
          y * step - half + jitter * 0.6,
          z * step - half - jitter * 0.4,
        ));
      }
    }
  }
  return pts;
}

function sampleArmPoints(count) {
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const y = t * 2.4 - 0.2;
    const reach = Math.sin(t * Math.PI) * 1.35;
    const swing = Math.sin(t * 4.2) * 0.35;
    const r = 0.08 + (1 - Math.abs(t - 0.55)) * 0.12;
    const a = t * Math.PI * 6 + i * 0.4;
    pts.push(new Vector3(
      1.35 + reach * 0.55 + Math.cos(a) * r,
      y + swing * 0.15,
      Math.sin(a) * r + Math.sin(t * 3.0) * 0.25,
    ));
  }
  return pts;
}

function createRobotArm() {
  const metal = new MeshStandardMaterial({
    color: ARM,
    metalness: 0.52,
    roughness: 0.36,
  });
  const joint = new MeshStandardMaterial({
    color: ARM_LIGHT,
    metalness: 0.5,
    roughness: 0.32,
    emissive: TEAL_DEEP,
    emissiveIntensity: 0.55,
  });

  const root = new Group();
  const base = new Mesh(new CylinderGeometry(0.42, 0.56, 0.16, 20), metal);
  base.castShadow = false;
  root.add(base);

  const yaw = new Group();
  yaw.position.y = 0.18;
  root.add(yaw);

  const shoulder = new Mesh(new SphereGeometry(0.16, 16, 16), joint);
  yaw.add(shoulder);

  const upper = new Group();
  upper.position.y = 0.04;
  yaw.add(upper);
  const upperArm = new Mesh(new CylinderGeometry(0.075, 0.095, 1.05, 12), metal);
  upperArm.position.y = 0.56;
  upper.add(upperArm);

  const elbow = new Group();
  elbow.position.y = 1.12;
  upper.add(elbow);
  elbow.add(new Mesh(new SphereGeometry(0.11, 14, 14), joint));

  const forearm = new Group();
  forearm.rotation.z = -1.05;
  elbow.add(forearm);
  const foreMesh = new Mesh(new CylinderGeometry(0.055, 0.075, 0.86, 12), metal);
  foreMesh.position.y = 0.46;
  forearm.add(foreMesh);

  const wrist = new Group();
  wrist.position.y = 0.94;
  forearm.add(wrist);
  wrist.add(new Mesh(new SphereGeometry(0.08, 12, 12), joint));

  const grip = new Group();
  wrist.add(grip);
  const jawA = new Mesh(new CylinderGeometry(0.018, 0.03, 0.28, 8), metal);
  const jawB = jawA.clone();
  jawA.position.set(0.06, 0.16, 0);
  jawB.position.set(-0.06, 0.16, 0);
  jawA.rotation.z = -0.35;
  jawB.rotation.z = 0.35;
  grip.add(jawA, jawB);

  root.position.set(1.45, -0.55, 0.15);
  root.rotation.y = -0.45;

  return { root, yaw, upper, elbow, forearm, wrist };
}

function createCore() {
  const geo = new IcosahedronGeometry(0.95, 4);
  const mat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDisplace: { value: 0.2 },
      uPointer: { value: { x: 0, y: 0 } },
      uColor: { value: new Color('#0a2422') },
      uRim: { value: new Color('#3ddbd0') },
      uHot: { value: new Color('#c9a24a') },
    },
    vertexShader: coreVertex,
    fragmentShader: coreFragment,
    transparent: true,
  });
  const mesh = new Mesh(geo, mat);

  const wire = new Mesh(
    new IcosahedronGeometry(0.99, 1),
    new MeshStandardMaterial({
      color: TEAL,
      emissive: TEAL,
      emissiveIntensity: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    }),
  );

  const ringA = new Mesh(
    new TorusGeometry(1.38, 0.01, 8, 96),
    new MeshStandardMaterial({
      color: TEAL,
      emissive: TEAL,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
      side: DoubleSide,
    }),
  );
  ringA.rotation.x = Math.PI * 0.5;

  const ringB = ringA.clone();
  ringB.rotation.x = Math.PI * 0.28;
  ringB.rotation.y = 0.6;
  ringB.scale.setScalar(1.12);

  const group = new Group();
  group.add(mesh, wire, ringA, ringB);
  return { group, mat, wire, ringA, ringB };
}

function createField(count) {
  const sphere = fibonacciSphere(count, 3.15);
  const grid = latticePoints(count, 5.6);
  const arm = sampleArmPoints(count);
  const positions = new Float32Array(count * 3);
  const morph = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const src = i % 3 === 0 ? grid[i] : sphere[i];
    const dst = i % 5 === 0 ? arm[i] : sphere[(i * 3) % count];
    positions[i * 3] = src.x;
    positions[i * 3 + 1] = src.y;
    positions[i * 3 + 2] = src.z;
    morph[i * 3] = dst.x;
    morph[i * 3 + 1] = dst.y;
    morph[i * 3 + 2] = dst.z;
    sizes[i] = 1.05 + ((i * 17) % 10) * 0.12;
    seeds[i] = (i * 13.37) % 1;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aMorph', new BufferAttribute(morph, 3));
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const mat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointer: { value: { x: 0, y: 0 } },
      uColor: { value: new Color('#2a8f86') },
      uHot: { value: new Color('#7ee8de') },
    },
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geo, mat);

  const nodeCount = Math.min(160, Math.floor(count * 0.08));
  const nodeGeo = new IcosahedronGeometry(0.028, 0);
  const nodeMat = new MeshStandardMaterial({
    color: TEAL,
    emissive: TEAL,
    emissiveIntensity: 0.7,
    metalness: 0.2,
    roughness: 0.4,
  });
  const nodes = new InstancedMesh(nodeGeo, nodeMat, nodeCount);
  const dummy = new Object3D();
  const linePos = [];
  for (let i = 0; i < nodeCount; i += 1) {
    dummy.position.copy(sphere[i]);
    dummy.updateMatrix();
    nodes.setMatrixAt(i, dummy.matrix);
    nodes.instanceMatrix.needsUpdate = true;
    const j = (i + 7) % nodeCount;
    linePos.push(sphere[i].x, sphere[i].y, sphere[i].z, sphere[j].x, sphere[j].y, sphere[j].z);
  }
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new BufferAttribute(new Float32Array(linePos), 3));
  const lines = new LineSegments(
    lineGeo,
    new LineBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.14,
    }),
  );

  return { points, mat, nodes, lines, sphere, nodeCount };
}

function supportsWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  } catch {
    return false;
  }
}

export function initScene({ canvas, reduced = false, page = 'home' }) {
  if (!canvas || !supportsWebGL()) {
    document.documentElement.classList.add('no-webgl');
    return null;
  }

  const mobile = isMobile();
  const particleCount = mobile ? 900 : 2800;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);

  const scene = new Scene();
  scene.background = new Color('#05070a');
  scene.fog = null;

  const camera = new PerspectiveCamera(38, 1, 0.1, 40);
  const startPos = page === 'home' && !mobile
    ? new Vector3(-3.4, 1.15, 8.4)
    : new Vector3(-1.2, 1.4, 8.6);
  camera.position.copy(startPos);

  let renderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  renderer.setPixelRatio(dpr);
  renderer.setClearColor('#05070a', 1);
  renderer.outputColorSpace = 'srgb';

  scene.add(new AmbientLight('#4d6764', 0.35));
  const key = new PointLight('#5eead4', 10, 12, 2);
  key.position.set(1.8, 1.6, 2.4);
  const fill = new PointLight('#e8c36a', 3.2, 10, 2);
  fill.position.set(-2.4, 0.2, 1.6);
  const rim = new DirectionalLight('#7aa8a3', 0.8);
  rim.position.set(-3, 4, -2);
  scene.add(key, fill, rim);

  const core = createCore();
  core.group.position.set(1.55, 0.05, 0);
  scene.add(core.group);

  const field = createField(particleCount);
  scene.add(field.points, field.nodes, field.lines);

  const arm = createRobotArm();
  scene.add(arm.root);
  if (page !== 'home') {
    arm.root.position.set(1.8, -0.7, -0.4);
    arm.root.scale.setScalar(0.85);
  }

  const camCurve = new CatmullRomCurve3([
    startPos.clone(),
    new Vector3(-2.6, 1.35, 7.8),
    new Vector3(-1.1, 1.7, 7.4),
    new Vector3(-2.0, 1.5, 8.1),
    new Vector3(-1.8, 2.15, 9.0),
  ]);
  const lookCurve = new CatmullRomCurve3([
    new Vector3(1.7, 0.1, 0),
    new Vector3(1.2, 0.12, 0.08),
    new Vector3(0.7, 0.1, 0.12),
    new Vector3(1.0, 0.18, 0),
    new Vector3(0.5, 0.3, 0),
  ]);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;
  let targetScroll = 0;
  let running = !document.hidden;
  let raf = 0;
  let time = 0;
  const clock = { last: performance.now() };

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    field.mat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.75);
  }

  const look = new Vector3();
  const cam = new Vector3();

  function frame(now) {
    const dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;
    time += dt;

    pointer.x = MathUtils.damp(pointer.x, pointer.tx, 3.2, dt);
    pointer.y = MathUtils.damp(pointer.y, pointer.ty, 3.2, dt);
    scroll = MathUtils.damp(scroll, targetScroll, 2.4, dt);

    const t = page === 'home' ? scroll : (0.12 + Math.sin(time * 0.12) * 0.04);
    camCurve.getPointAt(MathUtils.clamp(t, 0, 1), cam);
    lookCurve.getPointAt(MathUtils.clamp(t, 0, 1), look);

    camera.position.copy(cam);
    camera.position.x += pointer.x * 0.55;
    camera.position.y += pointer.y * 0.35;
    camera.lookAt(look.x + pointer.x * 0.15, look.y + pointer.y * 0.1, look.z);

    core.mat.uniforms.uTime.value = time;
    core.mat.uniforms.uPointer.value.x = pointer.x;
    core.mat.uniforms.uPointer.value.y = pointer.y;
    core.mat.uniforms.uDisplace.value = 0.12 + scroll * 0.1;
    core.group.rotation.y = time * 0.12 + pointer.x * 0.25;
    core.group.rotation.x = 0.18 + pointer.y * 0.18;
    core.wire.rotation.y = -time * 0.08;
    core.ringA.rotation.z = time * 0.22;
    core.ringB.rotation.z = -time * 0.16;

    field.mat.uniforms.uTime.value = time;
    field.mat.uniforms.uMorph.value = page === 'home' ? MathUtils.smoothstep(scroll, 0.15, 0.72) : 0.25;
    field.mat.uniforms.uPointer.value.x = pointer.x;
    field.mat.uniforms.uPointer.value.y = pointer.y;
    field.points.rotation.y = time * 0.03 + pointer.x * 0.08;

    arm.yaw.rotation.y = Math.sin(time * 0.35) * 0.55 + pointer.x * 0.4;
    arm.upper.rotation.z = -0.35 + Math.sin(time * 0.42) * 0.18 + scroll * 0.25;
    arm.elbow.rotation.z = -0.2 + Math.cos(time * 0.5) * 0.35;
    arm.forearm.rotation.z = -0.9 + Math.sin(time * 0.38 + 1.2) * 0.2;
    arm.wrist.rotation.y = time * 0.6;
    arm.root.position.y = -0.55 + Math.sin(time * 0.5) * 0.04;

    renderer.render(scene, camera);
    if (running && !reduced) raf = requestAnimationFrame(frame);
  }

  function renderOnce() {
    resize();
    clock.last = performance.now();
    frame(clock.last);
  }

  const onPointer = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((event.clientY / window.innerHeight) * 2 - 1);
  };

  const onVisibility = () => {
    running = !document.hidden && !reduced;
    if (running) {
      clock.last = performance.now();
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  renderOnce();
  if (!reduced) {
    running = true;
    raf = requestAnimationFrame(frame);
  }

  return {
    setScroll(value) {
      targetScroll = MathUtils.clamp(value, 0, 1);
    },
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    renderOnce,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
    },
  };
}
