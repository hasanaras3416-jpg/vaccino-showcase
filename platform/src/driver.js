/* Driver Studio — referans sürücü 174 cm (MakeHuman CC0 türevi, bkz. docs/ASSETS.md).
   GLB'de her teçhizat ayrı mesh'tir; malzemeler burada katman bazında verilir.
   Yalnız Driver ekranı açılınca yüklenir. WebGL yoksa, yükleme başarısızsa ya da mobilde
   çizim yavaşsa sabit görsele düşer. */
import {driverGear, driverInfo, rozetler, driverErgonomics} from '../data/vaccino-data.js';
import {buildRepresentativeParts} from './rep-parts.js';

/* Sekme → GLB katmanları ve kamera açısı. Kask sekmesi kaskın tüm katmanlarını birlikte vurgular. */
const equipment = {
  helmet: {layers: ['Helmet', 'HelmetSeal', 'HelmetStripe', 'Visor'], azimuth: -.55, elevation: .12, fit: .95},
  suit: {layers: ['Suit', 'SuitPanels', 'Emblem'], azimuth: -.42, elevation: .14, fit: .62},
  glove: {layers: ['Gloves'], azimuth: -.70, elevation: .22, fit: 1.0},
  shoes: {layers: ['Shoes'], azimuth: -.55, elevation: .20, fit: .9},
  harness: {layers: ['Harness'], azimuth: -.18, elevation: .16, fit: .8}
};
/* Teçhizat anahtarları: kapatılan katmanın altında düz gri temel gövde görünür. */
const toggles = {
  helmet: ['Helmet', 'HelmetSeal', 'HelmetStripe', 'Visor', 'VisorInner'],
  suit: ['Suit', 'SuitPanels', 'Emblem'],
  glove: ['Gloves', 'GloveCuffs'],
  shoes: ['Shoes'],
  harness: ['Harness']
};
const CHAMPAGNE = 0xCBB98B;

/* ---------- prosedürel dokular (ek dosya yok) ---------- */
function heightToNormal(T, size, height, strength) {
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x - 1, y) - at(x + 1, y)) * strength, dy = (at(x, y - 1) - at(x, y + 1)) * strength;
    const len = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
    data[i] = (dx / len * .5 + .5) * 255; data[i + 1] = (dy / len * .5 + .5) * 255; data[i + 2] = (1 / len * .5 + .5) * 255; data[i + 3] = 255;
  }
  const texture = new T.DataTexture(data, size, size, T.RGBAFormat);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  // Mipmap + anizotropi: uzak görünümde dokuma kırpışmasın (moire).
  texture.generateMipmaps = true;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
function fabricNormal(T) {   // dimi (twill) dokuma
  const n = 128, h = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const warp = ((x + y) % 8) < 4 ? 1 : 0;
    h[y * n + x] = .55 * warp + .25 * Math.sin(x / n * Math.PI * 32) + .2 * Math.sin(y / n * Math.PI * 32);
  }
  return heightToNormal(T, n, h, 1.6);
}
function grainNormal(T, seed = 7) {   // deri / sentetik grenli yüzey
  const n = 128, h = new Float32Array(n * n);
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const coarse = Array.from({length: 32 * 32}, rand);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const cx = x / 4, cy = y / 4, ix = Math.floor(cx), iy = Math.floor(cy), fx = cx - ix, fy = cy - iy;
    const g = (a, b) => coarse[((b % 32) * 32) + (a % 32)];
    h[y * n + x] = (g(ix, iy) * (1 - fx) + g(ix + 1, iy) * fx) * (1 - fy) + (g(ix, iy + 1) * (1 - fx) + g(ix + 1, iy + 1) * fx) * fy + rand() * .15;
  }
  return heightToNormal(T, n, h, 1.1);
}

function layerMaterials(T) {
  const fabric = fabricNormal(T); fabric.repeat.set(46, 46);
  const grain = grainNormal(T); grain.repeat.set(34, 34);
  const P = options => new T.MeshPhysicalMaterial(options);
  return {
    Body: P({color: 0x8F9295, roughness: .72}),
    Suit: P({color: 0x2A2F33, roughness: .86, sheen: .45, sheenColor: 0x50565c, sheenRoughness: .7, normalMap: fabric, normalScale: new T.Vector2(.35, .35)}),
    SuitPanels: P({color: CHAMPAGNE, roughness: .62, sheen: .3, sheenColor: 0xe8dcc0, normalMap: fabric, normalScale: new T.Vector2(.4, .4)}),
    Emblem: P({color: CHAMPAGNE, roughness: .32, metalness: .55}),
    Gloves: P({color: 0xC9C6C0, roughness: .5, sheen: .2, sheenColor: 0xffffff, normalMap: grain, normalScale: new T.Vector2(.14, .14)}),
    GloveCuffs: P({color: 0x2A2F33, roughness: .7}),
    Shoes: P({color: 0x1D2023, roughness: .92, normalMap: grain, normalScale: new T.Vector2(.25, .25)}),
    Helmet: P({color: 0xF5F2ED, roughness: .28, clearcoat: 1, clearcoatRoughness: .06}),
    HelmetStripe: P({color: CHAMPAGNE, roughness: .3, metalness: .35, clearcoat: .9, clearcoatRoughness: .08}),
    HelmetSeal: P({color: 0x141618, roughness: .9}),
    // Vizör: koyu, opak ve yansıtıcı; içerideki baş hiçbir açıdan seçilmez.
    Visor: P({color: 0x07090B, roughness: .05, metalness: .55, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.9}),
    VisorInner: new T.MeshBasicMaterial({color: 0x020304, side: T.DoubleSide}),
    SafetyDevices: P({color: 0xD8433A, roughness: .45, clearcoat: .6}),
    Harness: P({color: 0xA9ADB1, roughness: .74, normalMap: fabric, normalScale: new T.Vector2(.3, .3)})
  };
}

/* Eldiven manşeti: eldiven ağının açık kenar halkalarından (bilek) koyu bir bant. */
function cuffLoops(T, mesh) {
  const geometry = mesh.geometry, position = geometry.attributes.position, index = geometry.index;
  if (!index) return [];
  const key = i => `${position.getX(i).toFixed(5)},${position.getY(i).toFixed(5)},${position.getZ(i).toFixed(5)}`;
  const canon = new Map(), id = [];
  for (let i = 0; i < position.count; i++) { const k = key(i); if (!canon.has(k)) canon.set(k, i); id.push(canon.get(k)); }
  const edges = new Map();
  for (let t = 0; t < index.count; t += 3) {
    const tri = [id[index.getX(t)], id[index.getX(t + 1)], id[index.getX(t + 2)]];
    for (let e = 0; e < 3; e++) {
      const a = tri[e], b = tri[(e + 1) % 3], k = a < b ? `${a}_${b}` : `${b}_${a}`;
      edges.set(k, (edges.get(k) || 0) + 1);
    }
  }
  const next = new Map();
  for (const [k, count] of edges) {
    if (count !== 1) continue;
    const [a, b] = k.split('_').map(Number);
    (next.get(a) || next.set(a, []).get(a)).push(b);
    (next.get(b) || next.set(b, []).get(b)).push(a);
  }
  const seen = new Set(), loops = [];
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let prev = -1, cur = start;
    while (cur !== undefined && !seen.has(cur)) {
      seen.add(cur); loop.push(cur);
      const n = next.get(cur).find(v => v !== prev && !seen.has(v)); prev = cur; cur = n;
    }
    if (loop.length > 12) loops.push(loop.map(i => new T.Vector3().fromBufferAttribute(position, i)));
  }
  return loops.sort((a, b) => b.length - a.length).slice(0, 2);
}

function addStudio(T, renderer, scene, bounds) {
  scene.add(new T.HemisphereLight(0xf2f4f8, 0x4a4744, 1.55));
  for (const [color, strength, x, y, z] of [[0xfff4e6, 2.6, 2.5, 3.5, 3.0], [0xe6edf8, 1.4, -3, 2.5, 1.5], [0xf4f1ea, 1.2, 0, 2.5, -3.5]]) {
    const light = new T.DirectionalLight(color, strength); light.position.set(x, y, z); scene.add(light);
  }
  /* Parlak stüdyo ortamı: kaskın pahı ve kumaş dokusu seçilsin. */
  const room = new T.Scene();
  room.background = new T.Color(0x6a6e73);
  for (const [x, y, z, w, h, color] of [[-3, 3, 3, 3, 4, 0xfffaf0], [3, 2.5, 2, 2.4, 4, 0xe9eef6], [0, 4, 0, 4, 4, 0xffffff], [1, 1.5, -4, 3, 2, 0xc8ccd2]]) {
    const card = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color}));
    card.position.set(x, y, z); card.lookAt(0, 1, 0); room.add(card);
  }
  const generator = new T.PMREMGenerator(renderer);
  scene.environment = generator.fromScene(room, .03).texture;
  generator.dispose();
  for (const card of room.children) { card.geometry.dispose(); card.material.dispose(); }
  /* Temas gölgesi */
  const mapCanvas = document.createElement('canvas'); mapCanvas.width = mapCanvas.height = 64;
  const ctx = mapCanvas.getContext('2d'), gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.6)'); gradient.addColorStop(.5, 'rgba(0,0,0,.25)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3());
  const shadow = new T.Mesh(new T.PlaneGeometry(size.x * 1.6, size.z * 1.25), new T.MeshBasicMaterial({map: new T.CanvasTexture(mapCanvas), transparent: true, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(center.x, bounds.min.y + .002, center.z);
  scene.add(shadow);
}

function badge(item) {
  const span = document.createElement('span');
  span.className = `badge-verify badge-${item.rozet}`; span.textContent = rozetler[item.rozet];
  return span;
}
function productCard(id) {
  const gear = driverGear[id];
  const card = document.createElement('article');
  card.className = 'card driver-product';
  card.setAttribute('aria-label', `${gear.ad} ürün kartı`);
  const title = document.createElement('h2'); title.className = 'driver-product-title'; title.textContent = gear.ad;
  const list = document.createElement('dl'); list.className = 'drawer-facts';
  for (const [label, value] of [['Tür', gear.tur], ['Ürün', gear.urun], ['Standart', gear.standart], ['Kaynak', gear.kaynak]]) {
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label;
    if (typeof value === 'string') dd.textContent = value;
    else dd.append(`${value.metin} `, badge(value));
    row.append(dt, dd); list.append(row);
  }
  card.append(title, list);
  return card;
}

export function initializeDriver() {
  const stage = document.getElementById('driver-stage');
  const canvas = document.getElementById('driver-canvas');
  const status = document.getElementById('driver-render-status');
  const progress = document.getElementById('driver-progress');
  const fallback = document.getElementById('driver-fallback');
  const controls = document.getElementById('driver-view-controls');
  const panel = document.getElementById('driver-product');
  const buttons = [...document.querySelectorAll('[data-driver-focus]')];
  const switches = [...document.querySelectorAll('[data-driver-layer]')];
  const zoomButtons = [...controls.querySelectorAll('[data-driver-zoom]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const T = window.THREE;

  const facts = document.getElementById('driver-facts');
  facts?.replaceChildren(...[driverInfo.referans, driverInfo.poz, driverInfo.balast].filter(Boolean).map(item => {
    const p = document.createElement('p'); p.append(`${item.metin} `, badge(item)); return p;
  }));

  let active = false, failed = false, startup, renderer, scene, camera, bounds, pose, transition, frameId;
  let model, materials, selected = '', mode = 'adc', loader;
  let layerMeshes = new Map();
  const baseColor = new Map(), poses = {};          // mod → {model, layers}
  const modeButtons = [...document.querySelectorAll('[data-driver-mode]')];
  const modeNote = document.getElementById('driver-mode-note');
  const pointers = new Map(), direction = new T.Vector3(), frameTimes = [];

  const limit = (v, a, b) => Math.min(b, Math.max(a, v));
  function safeDistance(radius) {
    const vertical = T.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    return radius / Math.sin(Math.min(vertical, horizontal));
  }
  function boxOf(names) {
    const box = new T.Box3();
    for (const n of names) for (const mesh of layerMeshes.get(n) || []) box.expandByObject(mesh);
    return box;
  }
  function overview() {
    const size = bounds.getSize(new T.Vector3());
    return {target: bounds.getCenter(new T.Vector3()), distance: safeDistance(size.length() * .48), azimuth: -.62, elevation: .16};
  }
  function equipmentView(id) {
    if (!id) return overview();
    const part = equipment[id], box = boxOf(part.layers);
    const radius = Math.max(box.getSize(new T.Vector3()).length() * .5 * part.fit, .12);
    return {target: box.getCenter(new T.Vector3()), distance: safeDistance(radius), azimuth: part.azimuth, elevation: part.elevation};
  }

  function requestFrame() {
    if (active && !document.hidden && renderer && pose && !frameId) frameId = requestAnimationFrame(draw);
  }
  function draw(now) {
    frameId = 0;
    if (!active || document.hidden) return;
    // Ekran geçişi sürerken çizim bekler; geçiş bitince vaccino:resize yeniden başlatır.
    if (document.documentElement.dataset.transition) return;
    if (transition) {
      const {from, to, start} = transition;
      const p = limit((now - start) / 360, 0, 1), e = p * p * (3 - 2 * p);
      pose.target.lerpVectors(from.target, to.target, e);
      pose.azimuth = T.MathUtils.lerp(from.azimuth, to.azimuth, e);
      pose.elevation = T.MathUtils.lerp(from.elevation, to.elevation, e);
      pose.distance = T.MathUtils.lerp(from.distance, to.distance, e);
      if (p === 1) transition = null;
    }
    direction.setFromSphericalCoords(pose.distance, Math.PI / 2 - pose.elevation, pose.azimuth);
    camera.position.copy(pose.target).add(direction);
    camera.lookAt(pose.target);
    const t0 = performance.now();
    renderer.render(scene, camera);
    // Mobilde ilk karelerin çizim süresi yüksekse sabit görsele düş.
    if (mobile.matches && frameTimes.length < 12) {
      frameTimes.push(performance.now() - t0);
      if (frameTimes.length === 12 && [...frameTimes].sort((a, b) => a - b)[6] > 40) return useFallback('Bu cihazda 3B görünüm yavaş; sabit görsel gösteriliyor.');
    }
    if (transition) requestFrame();
  }
  function resize() {
    if (!active || !bounds || !renderer || !stage.clientWidth || !stage.clientHeight) return;
    const {clientWidth: width, clientHeight: height} = stage, aspect = width / height;
    const changed = Math.abs(camera.aspect - aspect) > .001;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1 : 1.5));
    renderer.setSize(width, height, false);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    sizeMarkers();
    if (!pose || changed) { pose = equipmentView(selected); transition = null; }
    requestFrame();
  }

  function highlight(id) {
    const focus = new Set(id ? equipment[id].layers : []);
    if (id === 'helmet') focus.add('VisorInner');
    if (id === 'glove') focus.add('GloveCuffs');
    for (const [name, meshes] of layerMeshes) for (const mesh of meshes) {
      const m = mesh.material, base = m && baseColor.get(m);
      if (!m || !m.color || !base || name === 'VisorInner') continue;   // simit gibi gruplar ve kendi malzemeli parçalar atlanır
      const dim = id && !focus.has(name);
      m.color.copy(base).multiplyScalar(dim ? .5 : 1);
      if ('emissive' in m) { m.emissive.setHex(focus.has(name) && name !== 'Visor' ? CHAMPAGNE : 0x000000); m.emissiveIntensity = .05; }
    }
  }
  function select(id, animate = true) {
    selected = id;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.driverFocus === id));
    panel.replaceChildren(id ? productCard(id) : Object.assign(document.createElement('p'), {className: 'driver-equipment-note', textContent: 'Yakından incelemek için bir ekipman seçin.'}));
    if (!pose) return;
    highlight(id);
    const goal = equipmentView(id);
    if (animate && !reduceMotion.matches) {
      goal.azimuth = pose.azimuth + Math.atan2(Math.sin(goal.azimuth - pose.azimuth), Math.cos(goal.azimuth - pose.azimuth));
      transition = {from: {...pose, target: pose.target.clone()}, to: goal, start: performance.now()};
    } else { transition = null; pose = goal; }
    requestFrame();
  }
  function setLayer(id, visible) {
    for (const name of toggles[id]) for (const mesh of layerMeshes.get(name) || []) mesh.visible = visible;
    requestFrame();
  }
  // Kullanıcı geçiş sırasında döndürür/yakınlaştırırsa geçiş hedefinde tamamlanır (başa dönmez).
  function settle() { if (transition) { pose = {...transition.to, target: transition.to.target.clone()}; transition = null; } }
  function rotate(dx, dy) { settle(); pose.azimuth -= dx; pose.elevation = limit(pose.elevation + dy, -.2, .6); requestFrame(); }
  function zoom(f) { settle(); pose.distance = limit(pose.distance * f, safeDistance(.08), overview().distance * 1.5); requestFrame(); }
  function pinchDistance() { const [a, b] = pointers.values(); return Math.hypot(a.x - b.x, a.y - b.y); }

  canvas.addEventListener('pointerdown', e => {
    if (!pose || e.button !== 0 || pointers.size >= 2) return;
    pointers.set(e.pointerId, {x: e.clientX, y: e.clientY}); canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'mouse') canvas.focus({preventScroll: true});
  });
  canvas.addEventListener('pointermove', e => {
    const last = pointers.get(e.pointerId); if (!last) return;
    const before = pointers.size === 2 ? pinchDistance() : 0;
    pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pointers.size === 2) { const after = pinchDistance(); if (before > 0 && after > 0) zoom(before / after); }
    else rotate((e.clientX - last.x) * .008, (e.clientY - last.y) * .004);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, e => pointers.delete(e.pointerId));
  canvas.addEventListener('wheel', e => {
    if (!pose) return; e.preventDefault();
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1;
    zoom(Math.exp(limit(e.deltaY * scale * .0015, -.25, .25)));
  }, {passive: false});
  canvas.addEventListener('keydown', e => {
    if (!pose) return;
    const actions = {ArrowLeft: () => rotate(-.15, 0), ArrowRight: () => rotate(.15, 0), ArrowUp: () => rotate(0, .08), ArrowDown: () => rotate(0, -.08),
      '+': () => zoom(.84), '=': () => zoom(.84), '-': () => zoom(1.19), Escape: () => select('')};
    if (!actions[e.key]) return; actions[e.key](); e.preventDefault();
  });
  for (const b of buttons) b.addEventListener('click', () => select(b.dataset.driverFocus === selected ? '' : b.dataset.driverFocus));
  for (const s of switches) s.addEventListener('change', () => setLayer(s.dataset.driverLayer, s.checked));
  for (const b of zoomButtons) b.addEventListener('click', () => zoom(b.dataset.driverZoom === '1' ? .84 : 1.19));
  document.getElementById('driver-reset').addEventListener('click', () => select(''));

  function webglAvailable() {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }

  /* Mod modeli: ADC (eller iki güvenlik cihazında) ve Mileage (eller simitte). Her biri ilk seçildiğinde yüklenir. */
  async function loadPose(which) {
    if (poses[which]) return poses[which];
    const url = new URL(`../assets/driver/driver-${which}.glb`, import.meta.url);
    url.search = new URL(import.meta.url).search;
    progress.hidden = false; progress.style.setProperty('--p', '.04');
    const gltf = await loader.loadAsync(url.href, event => {
      if (event.total) progress.style.setProperty('--p', String(event.loaded / event.total));
    });
    const group = gltf.scene, layers = new Map();
    const add = (layer, mesh) => (layers.get(layer) || layers.set(layer, []).get(layer)).push(mesh);
    group.traverse(object => {
      if (!object.isMesh) return;
      const layer = object.name.replace(/_\d+$/, '');
      object.material = materials[layer] ?? materials.Body;
      if (layer === 'Visor') object.renderOrder = 2;
      add(layer, object);
    });
    const helmetBox = new T.Box3(); (layers.get('Helmet') || []).forEach(m => helmetBox.expandByObject(m));
    const helmetCenter = helmetBox.getCenter(new T.Vector3());
    // Vizörün arkasına siyah iç kabuk (yalnız görsel): yandan bakınca baş seçilmesin.
    for (const visor of layers.get('Visor') || []) {
      const inner = new T.Mesh(visor.geometry.clone(), materials.VisorInner);
      const pos = inner.geometry.attributes.position, v = new T.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); v.lerp(helmetCenter, .025); pos.setXYZ(i, v.x, v.y, v.z); }
      inner.renderOrder = 1; visor.parent.add(inner); add('VisorInner', inner);
    }
    // Eldiven manşetleri: bilekte belirgin koyu bant
    for (const glove of layers.get('Gloves') || []) for (const loop of cuffLoops(T, glove)) {
      const cuff = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(loop, true), Math.min(loop.length * 2, 160), .0055, 8, true), materials.GloveCuffs);
      glove.parent.add(cuff); add('GloveCuffs', cuff);
    }
    // Mileage: simit (Temsili). Şasi koordinatından sürücü koordinatına: Y ekseni çevresinde +90°.
    if (which === 'mileage') {
      const wheel = buildRepresentativeParts(T).steeringWheel;
      const holder = new T.Group(); holder.rotation.y = Math.PI / 2; holder.add(wheel); group.add(holder);
      add('SteeringWheel', wheel);
    }
    poses[which] = {model: group, layers, bounds: new T.Box3().setFromObject(group)};
    return poses[which];
  }

  async function load() {
    if (!T || !webglAvailable()) throw new Error('WebGL yok');
    const {GLTFLoader} = await import('../vendor/driver-gltf-loader.js');
    loader = new GLTFLoader();
    materials = layerMaterials(T);
    for (const m of Object.values(materials)) if (m.color) baseColor.set(m, m.color.clone());
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(30, 1, .02, 40);
    useMode(await loadPose(mode));
  }

  function useMode(entry) {
    if (model) scene.remove(model);
    model = entry.model; layerMeshes = entry.layers; bounds = entry.bounds;
    scene.add(model);
    for (const s of switches) setLayer(s.dataset.driverLayer, s.checked);
    highlight(selected);
  }
  function syncModeUi() {
    for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.dataset.driverMode === mode));
    const info = driverInfo.modlar?.[mode];
    if (modeNote && info) modeNote.replaceChildren(`${info.metin} `, badge(info));
  }
  async function setMode(next) {
    if (next === mode && model) return;
    mode = next; syncModeUi();
    if (!loader || failed) return;
    try {
      const entry = await loadPose(next);
      if (mode !== next) return;
      useMode(entry);
      if (ergoOn && ergo) { bounds = new T.Box3().setFromObject(ergo.group).union(new T.Box3().setFromObject(model)); refreshErgonomics(); }
      progress.hidden = true;
      pose = equipmentView(selected); transition = null; requestFrame();
    } catch (error) { showFailure(error); }
  }
  for (const b of modeButtons) b.addEventListener('click', () => setMode(b.dataset.driverMode));
  syncModeUi();

  /* ---------- Ergonomi görünümü: sürücü Ø30 şasinin içinde, mesafeler mm (Doğrulanacak) ---------- */
  const ergoButton = document.getElementById('driver-ergo-toggle'), ergoPanel = document.getElementById('driver-ergonomics');
  // Şasi GLB koordinatı → sürücü koordinatı: Y çevresinde +90°. STEP (mm) → sürücü: x = Z, y = Y + 135, z = −(X − 1400)
  const S2D = (X, Y, Z) => new T.Vector3(Z / 1000, (Y + 135) / 1000, -(X - 1400) / 1000);
  let ergo = null, ergoOn = false;
  // Sahnede yalnız numaralı işaret (ekranda sabit ≈ 28 px); değerler yandaki numaralı listede → etiketler çakışmaz.
  const MARK_PX = 28;
  function marker(n) {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(9,11,13,.92)'; g.beginPath(); g.arc(48, 48, 42, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#CBB98B'; g.lineWidth = 6; g.stroke();
    g.fillStyle = '#F5F2ED'; g.font = '700 46px Inter, Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 48, 51);
    const sprite = new T.Sprite(new T.SpriteMaterial({map: new T.CanvasTexture(c), depthTest: false, transparent: true, sizeAttenuation: false}));
    sprite.renderOrder = 10; sprite.userData.marker = true; return sprite;
  }
  function sizeMarkers() {
    if (!ergo || !camera || !stage.clientHeight) return;
    const s = MARK_PX / stage.clientHeight * 2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    ergo.lines.traverse(o => { if (o.userData.marker) o.scale.set(s, s, 1); });
  }
  function measureLine(group, a, b, n, along) {
    const m = new T.LineBasicMaterial({color: CHAMPAGNE, depthTest: false, transparent: true});
    const line = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), m); line.renderOrder = 9; group.add(line);
    for (const p of [a, b]) { const dot = new T.Mesh(new T.SphereGeometry(.009, 10, 8), new T.MeshBasicMaterial({color: CHAMPAGNE, depthTest: false})); dot.position.copy(p); dot.renderOrder = 9; group.add(dot); }
    const tag = marker(n); tag.position.copy(a.clone().lerp(b, along)); group.add(tag);
  }
  function measurements() {
    const box = names => { const b = new T.Box3(); for (const n of names) for (const m of layerMeshes.get(n) || []) b.expandByObject(m); return b; };
    const helmet = box(['Helmet']), shoes = box(['Shoes']);
    const hc = helmet.getCenter(new T.Vector3());
    const roofY = S2D(0, 935, 0).y, hoopZ = S2D(2135, 0, 0).z, noseZ = S2D(-15, 0, 0).z;
    return {
      helmetRoof: {mm: Math.round((roofY - helmet.max.y) * 1000), a: new T.Vector3(hc.x, helmet.max.y, hc.z), b: new T.Vector3(hc.x, roofY, hc.z)},
      helmetHoop: {mm: Math.round((helmet.min.z - hoopZ) * 1000), a: new T.Vector3(hc.x, hc.y, helmet.min.z), b: new T.Vector3(hc.x, hc.y, hoopZ)},
      toeNose: {mm: Math.round((noseZ - shoes.max.z) * 1000), a: new T.Vector3(0, shoes.max.y - .03, shoes.max.z), b: new T.Vector3(0, shoes.max.y - .03, noseZ)},
      cabinHeight: {mm: 935 - 15, a: S2D(1700, 15, 0), b: S2D(1700, 935, 0)},
      shoulderWidth: {mm: 2 * (600 - 15), a: S2D(2150, 520, -585), b: S2D(2150, 520, 585)}
    };
  }
  async function buildErgonomics() {
    const url = new URL('../assets/vehicle/frame-step.glb', import.meta.url); url.search = new URL(import.meta.url).search;
    const gltf = await loader.loadAsync(url.href);
    const group = new T.Group(), frameHolder = new T.Group(); frameHolder.rotation.y = Math.PI / 2;
    const steel = new T.MeshStandardMaterial({color: 0xC9CDD0, metalness: .6, roughness: .35, transparent: true, opacity: .5, depthWrite: false});
    const pillar = new T.MeshStandardMaterial({color: 0xE9A85B, metalness: .4, roughness: .4, transparent: true, opacity: .6, depthWrite: false});
    gltf.scene.traverse(o => { if (o.isMesh) o.visible = false; });
    for (const name of ['Frame', 'UnknownPartL', 'UnknownPartR']) {
      const m = gltf.scene.getObjectByName(name); if (!m) continue;
      m.visible = true; m.material = name === 'Frame' ? steel : pillar; frameHolder.add(m);
    }
    const parts = buildRepresentativeParts(T);
    frameHolder.add(parts.seat);
    group.add(frameHolder);
    const lines = new T.Group(); group.add(lines);
    return {group, lines};
  }
  function refreshErgonomics() {
    if (!ergo) return;
    ergo.lines.clear();
    const m = measurements();
    // İşaretler çizgi üzerinde farklı oranlarda: kısa ve yakın çizgilerde üst üste binmez
    const along = {helmetRoof: .5, helmetHoop: .5, toeNose: .5, cabinHeight: .3, shoulderWidth: .82};
    driverErgonomics.olcumler.forEach((item, i) => measureLine(ergo.lines, m[item.id].a, m[item.id].b, i + 1, along[item.id] ?? .5));
    sizeMarkers();
    ergoPanel.replaceChildren(
      Object.assign(document.createElement('h2'), {className: 'driver-product-title', textContent: 'Ergonomi ölçüleri'}),
      (() => { const ol = document.createElement('ol'); ol.className = 'ergo-list';
        driverErgonomics.olcumler.forEach((item, i) => {
          const li = document.createElement('li');
          const num = Object.assign(document.createElement('span'), {className: 'ergo-num', textContent: String(i + 1)}); num.setAttribute('aria-hidden', 'true');
          const name = Object.assign(document.createElement('span'), {className: 'ergo-name', textContent: item.ad});
          const value = document.createElement('span'); value.className = 'ergo-value';
          value.append(Object.assign(document.createElement('b'), {textContent: `${m[item.id].mm} mm`}), ` sınır ${item.sinir} (${item.madde}) `, badge(item));
          if (item.not) value.append(Object.assign(document.createElement('small'), {className: 'ergo-note', textContent: item.not}));
          li.append(num, name, value); ol.append(li);
        }); return ol; })(),
      ...driverErgonomics.sabit.map(item => { const p = document.createElement('p'); p.className = 'ergo-line'; p.append(`${item.metin} `, badge(item)); return p; }),
      Object.assign(document.createElement('p'), {className: 'drawer-caveat', textContent: driverErgonomics.not}));
  }
  async function setErgonomics(on) {
    ergoOn = on; ergoButton.setAttribute('aria-pressed', String(on)); ergoPanel.hidden = !on;
    if (!loader || failed) return;
    if (on && !ergo) { ergoButton.disabled = true; try { ergo = await buildErgonomics(); } finally { ergoButton.disabled = false; } }
    if (!ergo) return;
    if (on) { scene.add(ergo.group); refreshErgonomics(); } else scene.remove(ergo.group);
    bounds = on ? new T.Box3().setFromObject(ergo.group).union(new T.Box3().setFromObject(model)) : poses[mode].bounds;
    select('', false);
    if (on) { pose = {...overview(), azimuth: Math.PI / 2 - .25, elevation: .22}; transition = null; }
    requestFrame();
  }
  ergoButton?.addEventListener('click', () => setErgonomics(!ergoOn));

  function show() {
    if (!renderer) {
      renderer = new T.WebGLRenderer({canvas, antialias: !mobile.matches, alpha: true});
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      addStudio(T, renderer, scene, bounds);
    }
    status.hidden = true; progress.hidden = true;
    canvas.hidden = controls.hidden = false;
    resize();
    highlight(selected);
  }
  function useFallback(message) {
    failed = true;
    stopFrames();
    renderer?.dispose(); renderer = undefined;
    canvas.hidden = controls.hidden = progress.hidden = true;
    fallback.hidden = false;
    status.hidden = false; status.textContent = message;
  }
  function showFailure(error) {
    console.warn('Driver Studio:', error.message);
    useFallback(error.message === 'WebGL yok' ? 'Tarayıcı 3B görünümü desteklemiyor; sabit görsel gösteriliyor.' : '3B sürücü açılamadı; sabit görsel gösteriliyor.');
  }
  function stopFrames() { cancelAnimationFrame(frameId); frameId = 0; pointers.clear(); }

  function syncRoute() {
    const next = document.body.dataset.route === 'driver';
    if (active === next) return;
    active = next;
    if (!active) { stopFrames(); select('', false); return; }
    if (failed) return;
    startup ??= load();
    startup.then(() => { if (active && !failed) show(); }).catch(showFailure);
  }

  select('', false);
  new ResizeObserver(resize).observe(stage);
  mobile.addEventListener('change', resize);
  document.addEventListener('vaccino:route', syncRoute);
  document.addEventListener('vaccino:resize', requestFrame);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopFrames(); else requestFrame(); });
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches && transition) select(selected, false); });
  syncRoute();
}
