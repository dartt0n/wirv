export class GlobeVisualization {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.arcs = new Map();
    this.serverMarker = null;
    this.autoRotate = true;
    this.isDragging = false;
    this.previousMouseX = 0;
    this.previousMouseY = 0;
    this.rotationSpeed = 0.001;

    // Create a container for all rotating elements
    this.container = new THREE.Object3D();
    this.scene.add(this.container);

    this.setupScene();
    this.createGlobe();
    this.setupMouseControls();
    this.animate();

    window.addEventListener("resize", () => this.onWindowResize());
  }

  setupScene() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document
      .getElementById("globe-container")
      .appendChild(this.renderer.domElement);

    this.camera.position.z = 200;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  setupMouseControls() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener("mousedown", (event) => {
      this.isDragging = true;
      this.previousMouseX = event.clientX;
      this.previousMouseY = event.clientY;
      this.autoRotate = false;
    });

    canvas.addEventListener("mousemove", (event) => {
      if (this.isDragging) {
        const deltaX = event.clientX - this.previousMouseX;
        const deltaY = event.clientY - this.previousMouseY;

        // Horizontal rotation
        this.container.rotation.y += deltaX * 0.005;

        // Vertical rotation (limited to avoid flipping)
        this.container.rotation.x += deltaY * 0.005;
        // Clamp vertical rotation to avoid flipping
        this.container.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.container.rotation.x)
        );

        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
      }
    });

    canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
    });

    // Double click to toggle auto-rotation
    canvas.addEventListener("dblclick", () => {
      this.autoRotate = !this.autoRotate;
      if (this.autoRotate) {
        // Reset vertical rotation when auto-rotation starts
        this.container.rotation.x = 0;
      }
    });
  }

  createGlobe() {
    // Create earth sphere
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    const texture = new THREE.TextureLoader().load(
      "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg"
    );
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: 0.5,
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.container.add(this.globe);
  }

  createMarker(color) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geometry, material);
  }

  latLngToVector3(lat, lng, radius = 100) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  createArc(startLat, startLng, endLat, endLng, color) {
    const start = this.latLngToVector3(startLat, startLng);
    const end = this.latLngToVector3(endLat, endLng);

    const distance = start.distanceTo(end);
    const mid = start.clone().lerp(end, 0.5);
    mid.normalize().multiplyScalar(distance * 0.75 + 100);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: color === 0xff0000 ? 4 : 1,
    });

    return new THREE.Line(geometry, material);
  }

  addArc({ id, startLat, startLng, endLat, endLng, color, ip }) {
    const arc = this.createArc(startLat, startLng, endLat, endLng, color);
    this.container.add(arc);

    // Add client location dot
    const clientMarker = this.createMarker(
      color === 0xff0000 ? 0xff0000 : 0xffffff
    );
    const clientPos = this.latLngToVector3(startLat, startLng, 101);
    clientMarker.position.copy(clientPos);
    this.container.add(clientMarker);

    // Add or update server marker
    if (!this.serverMarker) {
      this.serverMarker = this.createMarker(0xffff00);
      const serverPos = this.latLngToVector3(endLat, endLng, 101);
      this.serverMarker.position.copy(serverPos);
      this.container.add(this.serverMarker);
    }

    // Store arc data for removal
    this.arcs.set(id, {
      arc,
      clientMarker,
      timestamp: Date.now(),
    });
  }

  clearArcs() {
    for (const { arc, clientMarker } of this.arcs.values()) {
      this.container.remove(arc);
      this.container.remove(clientMarker);
    }
    if (this.serverMarker) {
      this.container.remove(this.serverMarker);
      this.serverMarker = null;
    }
    this.arcs.clear();
  }

  removeOldArcs() {
    const now = Date.now();
    for (const [id, { arc, clientMarker, timestamp }] of this.arcs.entries()) {
      if (now - timestamp > 2000) {
        this.container.remove(arc);
        this.container.remove(clientMarker);
        this.arcs.delete(id);
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Auto-rotate only when not dragging
    if (this.autoRotate && !this.isDragging) {
      this.container.rotation.y += this.rotationSpeed;
      // Smoothly reset vertical rotation during auto-rotate
      this.container.rotation.x *= 0.95;
    }

    // Remove old arcs
    this.removeOldArcs();

    this.renderer.render(this.scene, this.camera);
  }
}
