const equipment = {
  helmet: { node: 'FocusHelmet', radius: .19, azimuth: -.18, copy: 'Tam yüz yarış kaskı ve koyu vizör.' },
  suit: { node: 'FocusSuit', radius: .34, azimuth: .12, copy: 'Mat siyah kumaş, antrasit paneller ve göğüste Vaccino V.' },
  glove: { node: 'FocusGlove', radius: .16, azimuth: .72, copy: 'Sol yarış eldiveninin manşeti ve parmak yapısı.' }
};

function addStudio(T, renderer, scene) {
  scene.add(new T.HemisphereLight(0xe4e9f6, 0x363130, 1.20));
  for (const [color, strength, x, y, z] of [
    [0xfff2df, 3.2, -3, 4, 4],
    [0xe0e9fa, 3.4, 3, 3, -3],
    [0xf1eee7, 1.25, 3, 1, 4]
  ]) {
    const light = new T.DirectionalLight(color, strength);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const room = new T.Scene();
  room.background = new T.Color(0x25282b);
  for (const [x, y, z, w, h, color] of [
    [-3, 3, 3, 2.6, 4, 0xe8e0d3], [3, 2, -3, 1.8, 4, 0xaabacb], [1, 3, 4, 2, .8, 0x8b9198]
  ]) {
    const card = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color}));
    card.position.set(x, y, z);
    card.lookAt(0, 1, 0);
    room.add(card);
  }
  const generator = new T.PMREMGenerator(renderer);
  const environment = generator.fromScene(room, .025);
  scene.environment = environment.texture;
  generator.dispose();
  for (const card of room.children) {
    card.geometry.dispose();
    card.material.dispose();
  }

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapCanvas.height = 64;
  const ctx = mapCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.7)');
  gradient.addColorStop(.48, 'rgba(0,0,0,.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1.13, .75),
    new T.MeshBasicMaterial({map: new T.CanvasTexture(mapCanvas), transparent: true, depthWrite: false})
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.z = .04;
  scene.add(shadow);
}

export function initializeDriver() {
  const stage = document.getElementById('driver-stage');
  const canvas = document.getElementById('driver-canvas');
  const status = document.getElementById('driver-render-status');
  const controls = document.getElementById('driver-view-controls');
  const note = document.getElementById('driver-item-text');
  const buttons = [...document.querySelectorAll('[data-driver-focus]')];
  const zoomButtons = [...controls.querySelectorAll('[data-driver-zoom]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const T = window.THREE;

  let active = false;
  let startup, renderer, scene, camera, bounds, pose, transition, frameId;
  let failed = false;
  let anchors = {};
  let selected = '';
  const pointers = new Map();
  const direction = new T.Vector3();

  function limit(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function safeDistance(radius) {
    const vertical = T.MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    return radius / Math.sin(Math.min(vertical, horizontal));
  }

  function overview() {
    const size = bounds.getSize(new T.Vector3());
    const verticalDistance = size.y * .61 / Math.tan(T.MathUtils.degToRad(camera.fov / 2)) + size.z * .5;
    const orbitClearance = Math.hypot(size.x, size.z) * .59;
    return {
      target: bounds.getCenter(new T.Vector3()),
      distance: Math.max(verticalDistance, safeDistance(orbitClearance)),
      azimuth: -.26,
      elevation: .085
    };
  }

  function equipmentView(id) {
    if (!id) return overview();
    const {radius, azimuth} = equipment[id];
    return {target: anchors[id].clone(), distance: safeDistance(radius), azimuth, elevation: .075};
  }

  function requestFrame() {
    if (active && !document.hidden && renderer && pose && !frameId) frameId = requestAnimationFrame(draw);
  }

  function draw(now) {
    frameId = 0;
    if (!active || document.hidden) return;
    if (transition) {
      const {from, to, start} = transition;
      const progress = limit((now - start) / 600, 0, 1);
      const eased = progress * progress * (3 - 2 * progress);
      pose.target.lerpVectors(from.target, to.target, eased);
      pose.azimuth = T.MathUtils.lerp(from.azimuth, to.azimuth, eased);
      pose.elevation = T.MathUtils.lerp(from.elevation, to.elevation, eased);
      pose.distance = T.MathUtils.lerp(from.distance, to.distance, eased);
      if (progress === 1) transition = null;
    }
    direction.setFromSphericalCoords(pose.distance, Math.PI / 2 - pose.elevation, pose.azimuth);
    camera.position.copy(pose.target).add(direction);
    camera.lookAt(pose.target);
    renderer.render(scene, camera);
    if (transition) requestFrame();
  }

  function resize() {
    if (!active || !bounds || !stage.clientWidth || !stage.clientHeight) return;
    const {clientWidth: width, clientHeight: height} = stage;
    const aspect = width / height;
    const aspectChanged = Math.abs(camera.aspect - aspect) > .001;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile.matches ? 1 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    if (!pose || aspectChanged) {
      pose = equipmentView(selected);
      transition = null;
    }
    requestFrame();
  }

  function select(id, animate = true) {
    selected = id;
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.driverFocus === id));
    note.textContent = id ? equipment[id].copy : 'Yakından incelemek için bir ekipman seçin.';
    if (!pose) return;
    const goal = equipmentView(id);
    if (animate && !reduceMotion.matches) {
      const shortest = Math.atan2(Math.sin(goal.azimuth - pose.azimuth), Math.cos(goal.azimuth - pose.azimuth));
      goal.azimuth = pose.azimuth + shortest;
      transition = {from: {...pose, target: pose.target.clone()}, to: goal, start: performance.now()};
    } else {
      transition = null;
      pose = goal;
    }
    requestFrame();
  }

  function rotate(dx, dy) {
    transition = null;
    pose.azimuth -= dx;
    pose.elevation = limit(pose.elevation + dy, -.18, .36);
    requestFrame();
  }

  function zoom(factor) {
    transition = null;
    pose.distance = limit(pose.distance * factor, safeDistance(.105), overview().distance * 1.5);
    requestFrame();
  }

  function pinchDistance() {
    const [one, two] = pointers.values();
    return Math.hypot(one.x - two.x, one.y - two.y);
  }

  canvas.addEventListener('pointerdown', event => {
    if (!pose || event.button !== 0 || pointers.size >= 2) return;
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    canvas.setPointerCapture(event.pointerId);
    if (event.pointerType === 'mouse') canvas.focus({preventScroll: true});
  });
  canvas.addEventListener('pointermove', event => {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const before = pointers.size === 2 ? pinchDistance() : 0;
    pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pointers.size === 2) {
      const after = pinchDistance();
      if (before > 0 && after > 0) zoom(before / after);
    } else {
      rotate((event.clientX - last.x) * .008, (event.clientY - last.y) * .004);
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, event => pointers.delete(event.pointerId));
  }
  canvas.addEventListener('wheel', event => {
    if (!pose) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
    zoom(Math.exp(limit(event.deltaY * scale * .0015, -.25, .25)));
  }, {passive: false});
  canvas.addEventListener('keydown', event => {
    if (!pose) return;
    switch (event.key) {
      case 'ArrowLeft': rotate(-.15, 0); break;
      case 'ArrowRight': rotate(.15, 0); break;
      case 'ArrowUp': rotate(0, .08); break;
      case 'ArrowDown': rotate(0, -.08); break;
      case '+': case '=': zoom(.84); break;
      case '-': zoom(1.19); break;
      case 'Escape': select(''); break;
      default: return;
    }
    event.preventDefault();
  });
  for (const button of buttons) button.addEventListener('click', () => select(button.dataset.driverFocus));
  for (const button of zoomButtons) button.addEventListener('click', () => zoom(button.dataset.driverZoom === '1' ? .84 : 1.19));
  document.getElementById('driver-reset').addEventListener('click', () => select(''));

  async function load() {
    const {GLTFLoader} = await import('../vendor/driver-gltf-loader.js');
    const url = new URL('../assets/driver/pilot.glb', import.meta.url);
    url.search = new URL(import.meta.url).search;
    const {scene: pilot} = await new GLTFLoader().loadAsync(url.href);
    scene = new T.Scene();
    scene.add(pilot);
    bounds = new T.Box3().setFromObject(pilot);
    anchors = Object.fromEntries(Object.entries(equipment).map(([id, part]) => {
      const marker = pilot.getObjectByName(part.node);
      if (!marker) throw new Error('Missing Driver camera target: ' + part.node);
      return [id, marker.getWorldPosition(new T.Vector3())];
    }));
    camera = new T.PerspectiveCamera(34, 1, .03, 45);
  }

  function show() {
    if (!renderer) {
      renderer = new T.WebGLRenderer({canvas, antialias: !mobile.matches, alpha: true});
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.04;
      addStudio(T, renderer, scene);
    }
    status.hidden = true;
    canvas.hidden = controls.hidden = false;
    resize();
  }

  function showFailure(error) {
    failed = true;
    renderer?.dispose();
    renderer = undefined;
    status.textContent = '3B pilot açılamadı. Ekipman açıklamaları Kask, Tulum ve Eldiven seçeneklerinde.';
    console.warn('Driver Studio:', error.message);
  }

  function stopFrames() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    pointers.clear();
  }

  function syncRoute() {
    const next = document.body.dataset.route === 'driver';
    if (active === next) return;
    active = next;
    if (!active) {
      stopFrames();
      select('', false);
      return;
    }
    startup ??= load().catch(showFailure);
    startup.then(() => {
      if (active && !failed) show();
    }).catch(showFailure);
  }

  new ResizeObserver(resize).observe(stage);
  mobile.addEventListener('change', resize);
  document.addEventListener('vaccino:route', syncRoute);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopFrames();
    else requestFrame();
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches && transition) select(selected, false);
  });
  syncRoute();
}
