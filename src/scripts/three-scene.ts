import * as THREE from 'three';

export function initThreeScene(container: HTMLElement) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a1a, 1);
  container.appendChild(renderer.domElement);

  // Mouse tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // --- Particle System ---
  const PARTICLE_COUNT = 800;
  const PARTICLE_SPREAD = 100;
  const CONNECTION_DISTANCE = 15;

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
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // --- Dynamic Connection Lines ---
  const MAX_CONNECTIONS = 1500;
  const linePositions = new Float32Array(MAX_CONNECTIONS * 6);
  const lineColors = new Float32Array(MAX_CONNECTIONS * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
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
      opacity: 0.25,
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

  // --- Animation Loop ---
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.005;

    // Smooth mouse following
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update particles
    const posArr = particleGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];

      // Mouse influence
      posArr[i3] += mouse.x * 0.01;
      posArr[i3 + 1] += mouse.y * 0.01;

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

    // Update connections
    updateConnections();

    // Update floating geometries
    wireframeMeshes.forEach((mesh, i) => {
      const data = meshData[i];
      mesh.rotation.x += data.rotSpeed.x;
      mesh.rotation.y += data.rotSpeed.y;
      mesh.rotation.z += data.rotSpeed.z;

      mesh.position.x = data.basePos.x + Math.sin(time * 2 + i) * 3;
      mesh.position.y = data.basePos.y + Math.cos(time * 1.5 + i * 0.7) * 2;
    });

    // Camera micro-movement based on mouse
    camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  animate();

  // --- Event Listeners ---
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
