import * as THREE from "three";

const top = new THREE.Vector2(0, 0.56);
const left = new THREE.Vector2(-0.49, 0.13);
const right = new THREE.Vector2(0.49, 0.13);
const base = new THREE.Vector2(0, -0.74);
const hub = new THREE.Vector2(0, 0.13);
const panels = [
  { tips: [top, left, hub], color: 0xbddb67 },
  { tips: [top, hub, right], color: 0x557f5b },
  { tips: [base, hub, left], color: 0x264c36 },
  { tips: [base, right, hub], color: 0x95b852 },
];

function sailDepth(x: number, y: number, pressure: number, time: number) {
  const taper = y > hub.y ? (top.y - y) / (top.y - hub.y) : (y - base.y) / (hub.y - base.y);
  const across = x / Math.max(0.001, right.x * taper);
  const billow = taper * (1 - Math.min(1, across * across));
  const ripple = Math.sin(x * 13 + y * 9 - time * 4.5) * Math.sin(y * 11 + time * 1.6);
  return 0.085 * taper + billow * (pressure + 0.018 * ripple);
}

function sailPanel(tips: THREE.Vector2[], material: THREE.Material) {
  const divisions = 21;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const triangles: number[] = [];
  const [a, b, c] = tips;
  for (let row = 0; row <= divisions; row++) {
    const start = vertices.length / 3;
    const previous = start - (divisions - row + 2);
    for (let column = 0; column <= divisions - row; column++) {
      const u = row / divisions;
      const v = column / divisions;
      const x = a.x + (b.x - a.x) * u + (c.x - a.x) * v;
      const y = a.y + (b.y - a.y) * u + (c.y - a.y) * v;
      vertices.push(x, y, 0);
      uvs.push(x + 0.5, y + 0.75);
      if (row > 0) {
        triangles.push(previous + column, start + column, previous + column + 1);
        if (column > 0) triangles.push(previous + column, start + column - 1, start + column);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(triangles);
  const panel = new THREE.Mesh(geometry, material);
  panel.frustumCulled = false;
  return panel;
}

function weaveTexture() {
  const side = 64;
  const data = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const index = (y * side + x) * 4;
      const thread = 232 + (x % 4 === 0 ? -22 : 0) + (y % 4 === 0 ? -12 : 0);
      const fleck = ((x * 83 + y * 37 + x * y * 13) % 19) - 9;
      data.set([thread + fleck, thread + fleck, thread + fleck, 255], index);
    }
  }
  const texture = new THREE.DataTexture(data, side, side);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function line(samples: number, color: number, opacity: number, vertexColors = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(samples * 3), 3).setUsage(THREE.DynamicDrawUsage));
  if (vertexColors) geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(samples * 3), 3));
  const stroke = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, opacity, transparent: opacity < 1, vertexColors }));
  stroke.frustumCulled = false;
  return stroke;
}

function windsweptRibbon() {
  const segments = 62;
  const geometry = new THREE.BufferGeometry();
  const triangles: number[] = [];
  for (let i = 0; i < segments * 2; i += 2) triangles.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((segments + 1) * 6), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(triangles);
  const ribbon = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xc8df8a, roughness: 0.78, side: THREE.DoubleSide }));
  ribbon.frustumCulled = false;
  return ribbon;
}

function windAt(time: number) {
  return Math.sin(time * 1.11) * 0.63 + Math.sin(time * 2.25 + 0.7) * 0.24 + Math.sin(time * 0.39) * 0.13;
}

export function flyKite(frame: HTMLDivElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
  if (!context) return;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 3000);
  camera.position.z = 1400;
  const sunlight = new THREE.DirectionalLight(0xfff4ce, 2.25);
  sunlight.position.set(-250, 460, 600);
  scene.add(sunlight, new THREE.HemisphereLight(0xe9f4ff, 0x446247, 1.55));

  const kite = new THREE.Group();
  const weave = weaveTexture();
  const sails = panels.map(({ tips, color }) => sailPanel(tips, new THREE.MeshStandardMaterial({
    color, map: weave, side: THREE.DoubleSide, roughness: 0.84,
  })));
  const seams = [[top, left], [left, base], [base, right], [right, top], [top, base], [left, right]].map(([a, b], index) => ({
    a, b, stroke: line(28, index < 4 ? 0x416143 : 0x30432e, 0.85),
  }));
  const tail = windsweptRibbon();
  const tether = line(84, 0xffffff, 0.63, true);
  const bridle = line(3, 0x4d6048, 0.84);
  const anchor = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 24), new THREE.MeshBasicMaterial({ color: 0xa0ae8e }));
  scene.add(kite, tether, anchor);
  kite.add(...sails, ...seams.map(({ stroke }) => stroke), bridle, tail);

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const basePoint = new THREE.Vector3();
  const join = new THREE.Vector3();
  const darkGroundCord = new THREE.Color(0x93a87f);
  const lightGroundCord = new THREE.Color(0x586b4d);
  const cordColor = new THREE.Color();
  let width = 0;
  let height = 0;
  let clearance = 0;
  let size = 0;
  let time = 0.8;
  let lastFrame = 0;
  let animation = 0;
  let inView = false;
  let contextLost = false;
  let drift = 0;
  let lift = 0;
  let roll = -0.29;
  let pressure = 0.13;

  function draw() {
    if (!width || !height || contextLost) return;
    const gust = windAt(time);
    const origin = width - Math.max(20, width * 0.058, size * 0.69);
    kite.scale.setScalar(size);
    kite.position.set(origin + drift * size, height - clearance + (0.16 + lift) * size, 0);
    kite.rotation.set(-0.18 + gust * 0.13, -0.31 + Math.sin(time * 1.4) * 0.23, roll);

    for (const sail of sails) {
      const position = sail.geometry.getAttribute("position");
      for (let i = 0; i < position.count; i++) position.setZ(i, sailDepth(position.getX(i), position.getY(i), pressure, time));
      position.needsUpdate = true;
      sail.geometry.computeVertexNormals();
    }

    for (const { a, b, stroke } of seams) {
      const position = stroke.geometry.getAttribute("position");
      for (let i = 0; i < position.count; i++) {
        const s = i / (position.count - 1);
        const x = THREE.MathUtils.lerp(a.x, b.x, s);
        const y = THREE.MathUtils.lerp(a.y, b.y, s);
        position.setXYZ(i, x, y, sailDepth(x, y, pressure, time) + 0.004);
      }
      position.needsUpdate = true;
    }

    // The gust travels down the ribbon, with more freedom toward the trailing tip.
    const ribbon = tail.geometry.getAttribute("position");
    for (let i = 0; i < ribbon.count / 2; i++) {
      const s = i / (ribbon.count / 2 - 1);
      const wave = 15 * s - time * 4.1;
      const flutter = Math.sin(wave + Math.sin(s * 8 - time * 1.3));
      const x = -0.78 * s - 0.18 * s * s + flutter * s * 0.17;
      const y = base.y - s * (0.88 + gust * 0.08) + Math.sin(wave) * s * 0.045;
      const z = Math.cos(wave) * s * 0.12;
      const twist = wave * 0.55;
      const span = (0.025 - 0.020 * s) * (0.85 + 0.15 * Math.cos(wave));
      ribbon.setXYZ(i * 2, x - span * Math.cos(twist), y + span * 0.45, z - span * Math.sin(twist));
      ribbon.setXYZ(i * 2 + 1, x + span * Math.cos(twist), y - span * 0.45, z + span * Math.sin(twist));
    }
    ribbon.needsUpdate = true;
    tail.geometry.computeVertexNormals();

    const bridlePoints = bridle.geometry.getAttribute("position");
    bridlePoints.setXYZ(0, 0, 0.31, sailDepth(0, 0.31, pressure, time));
    bridlePoints.setXYZ(1, -0.12, 0.016, 0.34);
    bridlePoints.setXYZ(2, 0, -0.39, sailDepth(0, -0.39, pressure, time));
    bridlePoints.needsUpdate = true;
    kite.localToWorld(join.set(-0.12, 0.016, 0.34));

    const cord = tether.geometry.getAttribute("position");
    const tint = tether.geometry.getAttribute("color");
    const sag = Math.min(112, width * 0.10) * (0.85 - gust * 0.25);
    for (let i = 0; i < cord.count; i++) {
      const s = i / (cord.count - 1);
      const slack = 4 * s * (1 - s);
      const x = THREE.MathUtils.lerp(basePoint.x, join.x, s) - slack * sag * 0.54;
      const y = THREE.MathUtils.lerp(basePoint.y, join.y, s) - slack * sag;
      const flutter = Math.sin(s * 9 - time * 2) * slack;
      cord.setXYZ(i, x + flutter * 1.6, y + flutter * 2.2, THREE.MathUtils.lerp(basePoint.z, join.z, s));
      cordColor.copy(darkGroundCord).lerp(lightGroundCord, THREE.MathUtils.smoothstep(y, height - clearance - 6, height - clearance + 6));
      tint.setXYZ(i, cordColor.r, cordColor.g, cordColor.b);
    }
    cord.needsUpdate = tint.needsUpdate = true;
    renderer.render(scene, camera);
    if (!frame.hasAttribute("data-rendered")) frame.dataset.rendered = "true";
  }

  function resize() {
    width = frame.clientWidth;
    height = frame.clientHeight;
    clearance = height - (frame.parentElement?.clientHeight ?? height);
    size = THREE.MathUtils.clamp(width * 0.195, 121, 267);
    basePoint.set(Math.max(18, width * 0.029), 20, 0);
    anchor.position.copy(basePoint);
    renderer.setSize(width, height, false);
    camera.right = width;
    camera.top = height;
    camera.updateProjectionMatrix();
    if (inView) draw();
  }

  function tick(now: number) {
    const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.04) : 0;
    lastFrame = now;
    time += delta;
    const gust = windAt(time);
    drift = THREE.MathUtils.damp(drift, gust * 0.11 + Math.sin(time * 0.62) * 0.03, 2.1, delta);
    lift = THREE.MathUtils.damp(lift, gust * 0.105 + Math.sin(time * 1.23 + 1.15) * 0.03, 2.3, delta);
    roll = THREE.MathUtils.damp(roll, -0.29 + Math.sin(time * 1.35) * 0.14 + Math.sin(time * 2.17) * 0.06, 3.5, delta);
    pressure = THREE.MathUtils.damp(pressure, 0.105 + gust * 0.065, 4.2, delta);
    draw();
    animation = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    cancelAnimationFrame(animation);
    lastFrame = 0;
    if (!inView || contextLost || document.hidden) return;
    if (motion.matches) draw();
    else animation = requestAnimationFrame(tick);
  }

  function loseContext(event: Event) {
    event.preventDefault();
    contextLost = true;
    delete frame.dataset.rendered;
    updatePlayback();
  }

  function restoreContext() {
    contextLost = false;
    updatePlayback();
  }

  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  const sizeObserver = new ResizeObserver(resize);
  resize();
  sizeObserver.observe(frame);
  visibility.observe(frame);
  motion.addEventListener("change", updatePlayback);
  document.addEventListener("visibilitychange", updatePlayback);
  canvas.addEventListener("webglcontextlost", loseContext);
  canvas.addEventListener("webglcontextrestored", restoreContext);

  return () => {
    cancelAnimationFrame(animation);
    visibility.disconnect();
    sizeObserver.disconnect();
    motion.removeEventListener("change", updatePlayback);
    document.removeEventListener("visibilitychange", updatePlayback);
    canvas.removeEventListener("webglcontextlost", loseContext);
    canvas.removeEventListener("webglcontextrestored", restoreContext);
    delete frame.dataset.rendered;
    for (const object of [...sails, ...seams.map(({ stroke }) => stroke), tail, bridle, tether, anchor]) {
      object.geometry.dispose();
      object.material.dispose();
    }
    weave.dispose();
    renderer.dispose();
  };
}
