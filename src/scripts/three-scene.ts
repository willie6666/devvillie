import * as THREE from 'three';

export function initThreeScene(container: HTMLElement) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050510, 1);
  container.appendChild(renderer.domElement);

  // Mouse tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Scroll tracking
  let scrollY = 0;
  let scrollTarget = 0;
  const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

  // --- Particle System ---
  const PARTICLE_COUNT = 400;
  const PARTICLE_SPREAD = 120;
  const CONNECTION_DISTANCE = 12;

  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  const cyanColor = new THREE.Color(0x00ffcc);
  const purpleColor = new THREE.Color(0x8b5cf6);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * PARTICLE_SPREAD;
    positions[i3 + 1] = (Math.random() - 0.5) * PARTICLE_SPREAD;
    positions[i3 + 2] = (Math.random() - 0.5) * PARTICLE_SPREAD;

    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

    const mixRatio = Math.random();
    const color = cyanColor.clone().lerp(purpleColor, mixRatio);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // --- Dynamic Connection Lines ---
  const MAX_CONNECTIONS = 600;
  const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
  const lineColors = new Float32Array(MAX_CONNECTIONS * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
  });

  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);

  // --- Floating Geometries ---
  const geometries = [
    new THREE.IcosahedronGeometry(4, 0),
    new THREE.OctahedronGeometry(3, 0),
    new THREE.TorusGeometry(3, 0.8, 8, 16),
    new THREE.TetrahedronGeometry(3, 0),
  ];

  const wireframeMeshes: THREE.Mesh[] = [];
  const meshData: { speed: THREE.Vector3; rotSpeed: THREE.Vector3; basePos: THREE.Vector3 }[] = [];

  geometries.forEach((geo, i) => {
    const color = i % 2 === 0 ? 0x00ffcc : 0x8b5cf6;
    const material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const mesh = new THREE.Mesh(geo, material);

    const angle = (i / geometries.length) * Math.PI * 2;
    const radius = 20 + Math.random() * 10;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 20,
      Math.sin(angle) * radius - 10
    );

    scene.add(mesh);
    wireframeMeshes.push(mesh);
    meshData.push({
      speed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.005,
        (Math.random() - 0.5) * 0.005
      ),
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ),
      basePos: mesh.position.clone(),
    });
  });

  // --- Update connections ---
  function updateConnections() {
    let connectionCount = 0;
    const posArr = particleGeometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT && connectionCount < MAX_CONNECTIONS; j++) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = posArr[i3] - posArr[j3];
        const dy = posArr[i3 + 1] - posArr[j3 + 1];
        const dz = posArr[i3 + 2] - posArr[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DISTANCE) {
          const idx = connectionCount * 6;
          linePositions[idx] = posArr[i3];
          linePositions[idx + 1] = posArr[i3 + 1];
          linePositions[idx + 2] = posArr[i3 + 2];
          linePositions[idx + 3] = posArr[j3];
          linePositions[idx + 4] = posArr[j3 + 1];
          linePositions[idx + 5] = posArr[j3 + 2];

          const alpha = 1 - dist / CONNECTION_DISTANCE;
          lineColors[idx] = cyanColor.r * alpha;
          lineColors[idx + 1] = cyanColor.g * alpha;
          lineColors[idx + 2] = cyanColor.b * alpha;
          lineColors[idx + 3] = purpleColor.r * alpha;
          lineColors[idx + 4] = purpleColor.g * alpha;
          lineColors[idx + 5] = purpleColor.b * alpha;

          connectionCount++;
        }
      }
    }

    lineGeometry.setDrawRange(0, connectionCount * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  }

  // --- Mouse repulsion sphere (project mouse to 3D) ---
  const MOUSE_REPEL_RADIUS = 15;
  const MOUSE_REPEL_STRENGTH = 0.4;
  const mouseWorld = new THREE.Vector3();

  // --- Among Us Crewmates ---
  function createAmogusShape() {
    const shape = new THREE.Shape();
    // Body
    shape.moveTo(-1.2, -2);
    shape.lineTo(-1.2, 0.5);
    shape.quadraticCurveTo(-1.2, 2, 0, 2.2);
    shape.quadraticCurveTo(1.2, 2, 1.2, 0.5);
    shape.lineTo(1.2, -0.5);
    // Right leg gap
    shape.lineTo(1.2, -2);
    shape.lineTo(0.15, -2);
    shape.lineTo(0.15, -1.2);
    shape.lineTo(-0.15, -1.2);
    shape.lineTo(-0.15, -2);
    shape.lineTo(-1.2, -2);
    return shape;
  }

  function createVisorShape() {
    const shape = new THREE.Shape();
    shape.moveTo(0.2, 0.6);
    shape.quadraticCurveTo(1.4, 0.6, 1.4, 1.2);
    shape.quadraticCurveTo(1.4, 1.8, 0.2, 1.8);
    shape.lineTo(0.2, 0.6);
    return shape;
  }

  function createBackpackShape() {
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, -0.5);
    shape.lineTo(-1.8, -0.5);
    shape.quadraticCurveTo(-2.0, -0.5, -2.0, 0);
    shape.lineTo(-2.0, 1.0);
    shape.quadraticCurveTo(-2.0, 1.3, -1.8, 1.3);
    shape.lineTo(-1.2, 1.3);
    return shape;
  }

  const AMOGUS_COLORS = [0x00ffcc, 0x8b5cf6, 0xff6b6b, 0xffd93d, 0x6bcb77];
  const amogusGroup: {
    mesh: THREE.Group;
    vel: THREE.Vector3;
    rotVel: number;
    life: number;
    maxLife: number;
  }[] = [];

  function spawnAmogus() {
    const group = new THREE.Group();
    const color = AMOGUS_COLORS[Math.floor(Math.random() * AMOGUS_COLORS.length)];

    const extrudeSettings = { depth: 0.5, bevelEnabled: false };

    // Body
    const bodyGeo = new THREE.ExtrudeGeometry(createAmogusShape(), extrudeSettings);
    const bodyMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Visor
    const visorGeo = new THREE.ExtrudeGeometry(createVisorShape(), { depth: 0.6, bevelEnabled: false });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x88cfff, transparent: true, opacity: 0, depthWrite: false });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.z = -0.05;
    group.add(visor);

    // Backpack
    const bpGeo = new THREE.ExtrudeGeometry(createBackpackShape(), extrudeSettings);
    const bpMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
    group.add(new THREE.Mesh(bpGeo, bpMat));

    // Random position far in the background
    group.position.set(
      (Math.random() - 0.5) * 120,
      (Math.random() - 0.5) * 70,
      -40 - Math.random() * 40
    );
    const s = 0.25 + Math.random() * 0.35;
    group.scale.set(s, s, s);

    scene.add(group);

    const maxLife = 6 + Math.random() * 6; // 6-12 seconds
    amogusGroup.push({
      mesh: group,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        0.02 + Math.random() * 0.03,
        0
      ),
      rotVel: (Math.random() - 0.5) * 0.01,
      life: 0,
      maxLife,
    });
  }

  // Spawn one initially, then periodically
  spawnAmogus();
  let amogusTimer = 0;
  const AMOGUS_SPAWN_INTERVAL = 4; // seconds between spawns

  // --- Animation Loop ---
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Smooth mouse following
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Smooth scroll following
    scrollY += (scrollTarget - scrollY) * 0.05;
    const scrollProgress = maxScroll() > 0 ? scrollY / maxScroll() : 0;

    // Project mouse position into 3D world space
    mouseWorld.set(mouse.x * 40, mouse.y * 25, 0);

    // Update particles
    const posArr = particleGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];

      // Mouse repulsion - particles flee from cursor
      const dx = posArr[i3] - mouseWorld.x;
      const dy = posArr[i3 + 1] - mouseWorld.y;
      const dz = posArr[i3 + 2] - mouseWorld.z;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distToMouse < MOUSE_REPEL_RADIUS && distToMouse > 0.1) {
        const force = (1 - distToMouse / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
        posArr[i3] += (dx / distToMouse) * force;
        posArr[i3 + 1] += (dy / distToMouse) * force;
        posArr[i3 + 2] += (dz / distToMouse) * force;
      }

      // Boundary wrapping
      const half = PARTICLE_SPREAD / 2;
      if (posArr[i3] > half) posArr[i3] = -half;
      if (posArr[i3] < -half) posArr[i3] = half;
      if (posArr[i3 + 1] > half) posArr[i3 + 1] = -half;
      if (posArr[i3 + 1] < -half) posArr[i3 + 1] = half;
      if (posArr[i3 + 2] > half) posArr[i3 + 2] = -half;
      if (posArr[i3 + 2] < -half) posArr[i3 + 2] = half;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Scroll rotates the entire particle + line group
    particles.rotation.y = scrollProgress * Math.PI * 0.6;
    particles.rotation.x = scrollProgress * Math.PI * 0.15;
    lines.rotation.y = particles.rotation.y;
    lines.rotation.x = particles.rotation.x;

    // Update connections
    updateConnections();

    // Update floating geometries - react to mouse + scroll
    wireframeMeshes.forEach((mesh, i) => {
      const data = meshData[i];
      mesh.rotation.x += data.rotSpeed.x + mouse.y * 0.003;
      mesh.rotation.y += data.rotSpeed.y + mouse.x * 0.003;
      mesh.rotation.z += data.rotSpeed.z;

      const scrollOffset = scrollProgress * 15 * (i % 2 === 0 ? 1 : -1);
      mesh.position.x = data.basePos.x + Math.sin(time * 2 + i) * 3 + mouse.x * 5;
      mesh.position.y = data.basePos.y + Math.cos(time * 1.5 + i * 0.7) * 2 + mouse.y * 3 + scrollOffset;
    });

    // Update Among Us crewmates
    const dt = 0.016; // ~60fps
    amogusTimer += dt;
    if (amogusTimer >= AMOGUS_SPAWN_INTERVAL && amogusGroup.length < 5) {
      spawnAmogus();
      amogusTimer = 0;
    }

    for (let i = amogusGroup.length - 1; i >= 0; i--) {
      const a = amogusGroup[i];
      a.life += dt;
      a.mesh.position.add(a.vel);
      a.mesh.rotation.z += a.rotVel;

      // Fade in/out
      let opacity: number;
      const fadeTime = 1.5;
      if (a.life < fadeTime) {
        opacity = a.life / fadeTime * 0.2;
      } else if (a.life > a.maxLife - fadeTime) {
        opacity = Math.max(0, (a.maxLife - a.life) / fadeTime * 0.2);
      } else {
        opacity = 0.2;
      }

      a.mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
      });

      // Remove when expired
      if (a.life >= a.maxLife) {
        scene.remove(a.mesh);
        a.mesh.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        amogusGroup.splice(i, 1);
      }
    }

    // Camera movement - mouse + scroll depth shift
    const camTargetX = mouse.x * 8;
    const camTargetY = mouse.y * 5 + scrollProgress * 10;
    const camTargetZ = 50 + scrollProgress * 20;
    camera.position.x += (camTargetX - camera.position.x) * 0.03;
    camera.position.y += (camTargetY - camera.position.y) * 0.03;
    camera.position.z += (camTargetZ - camera.position.z) * 0.03;
    camera.lookAt(0, scrollProgress * 5, 0);

    renderer.render(scene, camera);
  }

  animate();

  // --- Event Listeners ---
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
