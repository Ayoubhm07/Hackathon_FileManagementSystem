/**
 * DocFlow — Neural Document Constellation
 * A living 3D scene representing document intelligence:
 * A central data core surrounded by orbiting document nodes,
 * connected by neural network lines, embedded in a particle nebula.
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;

  // ─── Setup ────────────────────────────────────────────────────────────────
  const canvas = document.getElementById('neural-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x030712, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2, 14);
  camera.lookAt(0, 0, 0);

  // ─── Colours ──────────────────────────────────────────────────────────────
  const C_INDIGO  = new THREE.Color(0x6366F1);
  const C_CYAN    = new THREE.Color(0x06B6D4);
  const C_VIOLET  = new THREE.Color(0x8B5CF6);
  const C_WHITE   = new THREE.Color(0xF8FAFC);

  // ─── Lighting ─────────────────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x0F172A, 2.0);
  scene.add(ambientLight);

  const pointIndigo = new THREE.PointLight(C_INDIGO, 3.0, 20);
  pointIndigo.position.set(3, 3, 3);
  scene.add(pointIndigo);

  const pointCyan = new THREE.PointLight(C_CYAN, 2.5, 18);
  pointCyan.position.set(-4, -2, 2);
  scene.add(pointCyan);

  const pointViolet = new THREE.PointLight(C_VIOLET, 1.8, 16);
  pointViolet.position.set(0, 5, -3);
  scene.add(pointViolet);

  // ─── Central Data Core ────────────────────────────────────────────────────
  const coreGeo = new THREE.IcosahedronGeometry(1.1, 3);
  const coreMat = new THREE.MeshPhongMaterial({
    color: C_INDIGO,
    emissive: new THREE.Color(0x3730A3),
    emissiveIntensity: 0.6,
    shininess: 80,
    transparent: true,
    opacity: 0.85,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(coreMesh);

  // Core wireframe overlay
  const coreWireMat = new THREE.MeshBasicMaterial({
    color: C_INDIGO,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 3), coreWireMat);
  scene.add(coreWire);

  // Core outer glow ring
  const ringGeo = new THREE.TorusGeometry(1.6, 0.015, 16, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0.5 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.0, 0.01, 16, 120),
    new THREE.MeshBasicMaterial({ color: C_VIOLET, transparent: true, opacity: 0.3 })
  );
  ring2.rotation.x = Math.PI / 3;
  ring2.rotation.y = Math.PI / 5;
  scene.add(ring2);

  // ─── Orbiting Document Nodes ──────────────────────────────────────────────
  const nodeConfigs = [
    { geo: 'icosa', detail: 1, radius: 0.28, orbitR: 3.2, speed: 0.38, yOffset:  0.5, phase: 0,          color: C_INDIGO  },
    { geo: 'octa',  detail: 0, radius: 0.22, orbitR: 3.8, speed: 0.28, yOffset: -0.8, phase: Math.PI/3,  color: C_CYAN    },
    { geo: 'icosa', detail: 0, radius: 0.32, orbitR: 4.5, speed: 0.22, yOffset:  1.2, phase: Math.PI*2/3,color: C_VIOLET  },
    { geo: 'octa',  detail: 0, radius: 0.20, orbitR: 3.0, speed: 0.50, yOffset: -0.3, phase: Math.PI,    color: C_CYAN    },
    { geo: 'icosa', detail: 1, radius: 0.25, orbitR: 5.0, speed: 0.18, yOffset:  0.7, phase: Math.PI*4/3,color: C_INDIGO  },
    { geo: 'octa',  detail: 0, radius: 0.18, orbitR: 4.2, speed: 0.32, yOffset: -1.1, phase: Math.PI*5/3,color: C_VIOLET  },
    { geo: 'icosa', detail: 0, radius: 0.30, orbitR: 3.5, speed: 0.42, yOffset:  0.2, phase: Math.PI/2,  color: C_CYAN    },
    { geo: 'octa',  detail: 0, radius: 0.24, orbitR: 4.8, speed: 0.24, yOffset: -0.6, phase: Math.PI*7/6,color: C_INDIGO  },
  ];

  const nodes = nodeConfigs.map((cfg) => {
    const geo = cfg.geo === 'icosa'
      ? new THREE.IcosahedronGeometry(cfg.radius, cfg.detail)
      : new THREE.OctahedronGeometry(cfg.radius, cfg.detail);

    const mat = new THREE.MeshPhongMaterial({
      color: cfg.color,
      emissive: cfg.color.clone().multiplyScalar(0.4),
      emissiveIntensity: 0.8,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Wireframe overlay per node
    const wireMesh = new THREE.Mesh(
      cfg.geo === 'icosa'
        ? new THREE.IcosahedronGeometry(cfg.radius * 1.05, cfg.detail)
        : new THREE.OctahedronGeometry(cfg.radius * 1.05, cfg.detail),
      new THREE.MeshBasicMaterial({ color: cfg.color, wireframe: true, transparent: true, opacity: 0.4 })
    );
    scene.add(wireMesh);

    return { mesh, wireMesh, ...cfg, angle: cfg.phase };
  });

  // ─── Neural Connection Lines ───────────────────────────────────────────────
  const linePositions = new Float32Array(nodes.length * 2 * 3); // each node to core = 2 points
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: C_INDIGO,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  // Cross-node lines (between pairs)
  const crossPairs = [[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[0,4],[1,5]];
  const crossPositions = new Float32Array(crossPairs.length * 2 * 3);
  const crossGeo = new THREE.BufferGeometry();
  crossGeo.setAttribute('position', new THREE.BufferAttribute(crossPositions, 3));
  const crossMat = new THREE.LineBasicMaterial({
    color: C_CYAN,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
  });
  const crossLines = new THREE.LineSegments(crossGeo, crossMat);
  scene.add(crossLines);

  // ─── Particle Nebula (600+ points) ────────────────────────────────────────
  const PARTICLE_COUNT = 650;
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  const pColors    = new Float32Array(PARTICLE_COUNT * 3);
  const pSizes     = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribute in a spherical volume with some clustering near center
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 3 + Math.pow(Math.random(), 0.6) * 8;

    pPositions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pPositions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    pPositions[i*3+2] = r * Math.cos(phi);

    // Colour: interpolate between indigo and cyan based on distance
    const t = Math.random();
    const col = C_INDIGO.clone().lerp(C_CYAN, t).lerp(C_VIOLET, Math.random() * 0.3);
    pColors[i*3]   = col.r;
    pColors[i*3+1] = col.g;
    pColors[i*3+2] = col.b;

    pSizes[i] = 0.5 + Math.random() * 2.0;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  particleGeo.setAttribute('color',    new THREE.BufferAttribute(pColors, 3));
  particleGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ─── Floating data plane sheets (document metaphor) ───────────────────────
  const planeConfigs = [
    { pos: [-7, 1, -3], rot: [0.3, 0.5, 0.1], color: 0x1E1B4B },
    { pos: [ 6, -2, -4], rot: [-0.2, 0.8, 0.3], color: 0x164E63 },
    { pos: [-5, -3, -2], rot: [0.5, -0.3, 0.2], color: 0x2E1065 },
  ];

  planeConfigs.forEach(cfg => {
    const geo = new THREE.PlaneGeometry(1.8, 2.3);
    const mat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...cfg.pos);
    mesh.rotation.set(...cfg.rot);
    scene.add(mesh);

    // Edge border for the plane
    const edges = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: C_INDIGO, transparent: true, opacity: 0.15 });
    const edgeLines = new THREE.LineSegments(edges, edgeMat);
    edgeLines.position.copy(mesh.position);
    edgeLines.rotation.copy(mesh.rotation);
    scene.add(edgeLines);
  });

  // ─── Resize handler ────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ─── Animation loop ────────────────────────────────────────────────────────
  let t = 0;
  const tmpVec = new THREE.Vector3();

  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;

    // ── Core pulse
    const pulse = 1 + Math.sin(t * 1.5) * 0.04;
    coreMesh.scale.setScalar(pulse);
    coreWire.scale.setScalar(pulse * 1.01);
    coreMesh.rotation.y += 0.003;
    coreMesh.rotation.x += 0.001;
    coreWire.rotation.y -= 0.002;
    coreWire.rotation.z += 0.001;

    // Core emissive breathe
    coreMat.emissiveIntensity = 0.4 + Math.sin(t) * 0.25;

    // Rings spin
    ring1.rotation.z += 0.004;
    ring2.rotation.x += 0.003;
    ring2.rotation.y += 0.002;

    // ── Orbiting nodes
    nodes.forEach((n, i) => {
      n.angle += n.speed * 0.01;
      const x = Math.cos(n.angle) * n.orbitR;
      const z = Math.sin(n.angle) * n.orbitR;
      const y = n.yOffset + Math.sin(n.angle * 1.3 + n.phase) * 0.6;

      n.mesh.position.set(x, y, z);
      n.wireMesh.position.copy(n.mesh.position);
      n.mesh.rotation.x += 0.012 + i * 0.002;
      n.mesh.rotation.y += 0.009 + i * 0.001;
      n.wireMesh.rotation.copy(n.mesh.rotation);

      // Emissive breathe per node
      n.mesh.material.emissiveIntensity = 0.5 + Math.sin(t * 0.8 + i) * 0.3;
    });

    // ── Neural lines: core → each node
    const lPos = lineSegments.geometry.attributes.position.array;
    nodes.forEach((n, i) => {
      const off = i * 6;
      // core end (origin)
      lPos[off]   = 0; lPos[off+1] = 0; lPos[off+2] = 0;
      // node end
      lPos[off+3] = n.mesh.position.x;
      lPos[off+4] = n.mesh.position.y;
      lPos[off+5] = n.mesh.position.z;
    });
    lineSegments.geometry.attributes.position.needsUpdate = true;
    lineMat.opacity = 0.18 + Math.sin(t * 0.5) * 0.08;

    // ── Cross-node lines
    const cPos = crossLines.geometry.attributes.position.array;
    crossPairs.forEach(([a, b], i) => {
      const off = i * 6;
      cPos[off]   = nodes[a].mesh.position.x;
      cPos[off+1] = nodes[a].mesh.position.y;
      cPos[off+2] = nodes[a].mesh.position.z;
      cPos[off+3] = nodes[b].mesh.position.x;
      cPos[off+4] = nodes[b].mesh.position.y;
      cPos[off+5] = nodes[b].mesh.position.z;
    });
    crossLines.geometry.attributes.position.needsUpdate = true;
    crossMat.opacity = 0.08 + Math.sin(t * 0.3 + 1) * 0.05;

    // ── Particle slow drift + rotation
    particles.rotation.y += 0.0008;
    particles.rotation.x  = Math.sin(t * 0.12) * 0.05;
    particleMat.opacity = 0.55 + Math.sin(t * 0.4) * 0.12;

    // ── Dynamic lights drift
    pointIndigo.position.x = 3 + Math.sin(t * 0.4) * 2;
    pointIndigo.position.y = 3 + Math.cos(t * 0.3) * 1.5;
    pointCyan.position.x  = -4 + Math.cos(t * 0.35) * 2;
    pointCyan.position.z   = 2 + Math.sin(t * 0.28) * 2;

    // ── Slow camera orbit
    const camRadius = 14;
    camera.position.x = Math.sin(t * 0.04) * camRadius * 0.18;
    camera.position.y = 2 + Math.sin(t * 0.06) * 1.2;
    camera.position.z = Math.sqrt(camRadius * camRadius - camera.position.x * camera.position.x);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  // Respect prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
})();
