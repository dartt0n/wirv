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

    this.setupScene();
    this.createGlobe();
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
    this.scene.add(this.globe);
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
    const material = new THREE.LineBasicMaterial({ color });

    return new THREE.Line(geometry, material);
  }

  addArc({ id, startLat, startLng, endLat, endLng, color, ip }) {
    const arc = this.createArc(startLat, startLng, endLat, endLng, color);
    this.scene.add(arc);

    // Add client location dot
    const clientMarker = this.createMarker(0xffffff);
    const clientPos = this.latLngToVector3(startLat, startLng, 101);
    clientMarker.position.copy(clientPos);
    this.scene.add(clientMarker);

    // Add or update server marker
    if (!this.serverMarker) {
      this.serverMarker = this.createMarker(0xffff00);
      const serverPos = this.latLngToVector3(endLat, endLng, 101);
      this.serverMarker.position.copy(serverPos);
      this.scene.add(this.serverMarker);
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
      this.scene.remove(arc);
      this.scene.remove(clientMarker);
    }
    this.arcs.clear();
  }

  removeOldArcs() {
    const now = Date.now();
    for (const [id, { arc, clientMarker, timestamp }] of this.arcs.entries()) {
      if (now - timestamp > 2000) {
        this.scene.remove(arc);
        this.scene.remove(clientMarker);
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

    // Rotate globe
    this.globe.rotation.y += 0.001;

    // Remove old arcs
    this.removeOldArcs();

    this.renderer.render(this.scene, this.camera);
  }
}
