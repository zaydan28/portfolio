/**
 * @file three-scene.js
 * @description Three.js WebGL particle field for the hero section background.
 * Creates 3000 interactive particles responding to mouse movement with
 * smooth parallax and organic sine-wave displacement.
 */

class HeroParticleScene {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas      = canvas;
    this.W           = window.innerWidth;
    this.H           = window.innerHeight;
    this.mouse       = { x: 0, y: 0 };
    this.targetMouse = { x: 0, y: 0 };
    this.time        = 0;
    this.rafId       = null;
    this._resizeTimer= null;

    if (!this._initRenderer()) return;
    this._initScene();
    this._initCamera();
    this._createParticles();
    this._createLines();
    this._bindEvents();
    this._animate();
  }

  _initRenderer() {
    if (!window.THREE) {
      console.warn('Three.js not loaded — hero scene skipped.');
      return false;
    }
    this.renderer = new THREE.WebGLRenderer({
      canvas:           this.canvas,
      antialias:        false,
      alpha:            true,
      powerPreference:  'high-performance',
    });
    this.renderer.setSize(this.W, this.H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    return true;
  }

  _initScene() {
    this.scene = new THREE.Scene();
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, this.W / this.H, 0.1, 2000);
    this.camera.position.z = 480;
  }

  _createParticles() {
    const COUNT = this.W < 768 ? 800 : 3000;

    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // Distribute in a wide 3D volume
      positions[i3]     = (Math.random() - 0.5) * 1400;
      positions[i3 + 1] = (Math.random() - 0.5) * 900;
      positions[i3 + 2] = (Math.random() - 0.5) * 600;

      // Color: 15% signal green, 8% electric lime, rest dim white
      const r = Math.random();
      if (r < 0.15) {
        // Signal green (#00FF88)
        colors[i3] = 0; colors[i3+1] = 1; colors[i3+2] = 0.533;
      } else if (r < 0.23) {
        // Electric lime (#C8FF00)
        colors[i3] = 0.784; colors[i3+1] = 1; colors[i3+2] = 0;
      } else {
        // Dim white/gray
        const b = 0.12 + Math.random() * 0.45;
        colors[i3] = b; colors[i3+1] = b; colors[i3+2] = b;
      }

      // Occasional larger star-like particles
      sizes[i] = Math.random() < 0.04 ? 4 + Math.random() * 5 : 1 + Math.random() * 2.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    // Keep original positions for displacement reference
    this._origPos = Float32Array.from(positions);
    this._count   = COUNT;

    const mat = new THREE.PointsMaterial({
      size:            2,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.7,
      sizeAttenuation: true,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  /** Subtle geometric lines give depth to the scene */
  _createLines() {
    const mat = new THREE.LineBasicMaterial({
      color:       0x00FF88,
      transparent: true,
      opacity:     0.06,
    });

    for (let i = 0; i < 10; i++) {
      const pts = [];
      const ox  = (Math.random() - 0.5) * 900;
      const oy  = (Math.random() - 0.5) * 600;
      const oz  = (Math.random() - 0.5) * 300;
      for (let j = 0; j < 3; j++) {
        pts.push(new THREE.Vector3(
          ox + (Math.random() - 0.5) * 500,
          oy + (Math.random() - 0.5) * 400,
          oz + (Math.random() - 0.5) * 150,
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(geo, mat));
    }
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / this.W) * 2 - 1;
      this.targetMouse.y = -((e.clientY / this.H) * 2 - 1);
    });

    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this._onResize(), 200);
    });
  }

  _onResize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.camera.aspect = this.W / this.H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.W, this.H);
  }

  _animate() {
    this.rafId  = requestAnimationFrame(() => this._animate());
    this.time  += 0.0008;

    // Smooth mouse tracking
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.04;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.04;

    // Displace particles with layered sine waves (cheap substitute for Perlin)
    const pos = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this._count; i++) {
      const i3 = i * 3;
      const ox = this._origPos[i3];
      const oy = this._origPos[i3 + 1];
      pos[i3]     = ox + Math.sin(this.time * 0.9 + oy * 0.009) * 14;
      pos[i3 + 1] = oy + Math.cos(this.time * 0.65 + ox * 0.007) * 11;
    }
    this.points.geometry.attributes.position.needsUpdate = true;

    // Slow drift
    this.points.rotation.y = this.time * 0.04;
    this.points.rotation.x = this.time * 0.015;

    // Camera parallax
    this.camera.position.x += (this.mouse.x * 90 - this.camera.position.x) * 0.035;
    this.camera.position.y += (this.mouse.y * 70 - this.camera.position.y) * 0.035;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.renderer.dispose();
  }
}
