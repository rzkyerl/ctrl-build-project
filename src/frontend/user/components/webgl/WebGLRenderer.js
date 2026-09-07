import * as THREE from 'three';

export class WebGLRendererEngine {
  constructor(container) {
    this.container = container;

    const w = container.offsetWidth  || container.clientWidth  || 800;
    const h = container.offsetHeight || container.clientHeight || 600;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false); // false = don't set canvas CSS size
    this.renderer.setClearColor(0x000000, 0);

    // Let CSS control visual size, setSize only sets internal buffer
    const canvas = this.renderer.domElement;
    canvas.style.display  = 'block';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    container.appendChild(canvas);

    this._rafId         = null;
    this._elapsed       = 0;
    this._lastTs        = null;
    this._resizeHandler = this._onResize.bind(this);
    this._onFrame       = this._onFrame.bind(this);

    window.addEventListener('resize', this._resizeHandler);
    this._rafId = requestAnimationFrame(this._onFrame);
  }

  _onFrame(ts) {
    if (this._lastTs === null) this._lastTs = ts;
    this._elapsed += (ts - this._lastTs) * 0.001;
    this._lastTs = ts;

    this.scene.children.forEach(obj => {
      const u = obj.material?.uniforms;
      if (!u) return;
      if (u.u_time     !== undefined) u.u_time.value     = this._elapsed;
      // u_velocity and u_bend are updated per-layout, not here
    });

    this.renderer.render(this.scene, this.camera);
    this._rafId = requestAnimationFrame(this._onFrame);
  }

  _onResize() {
    const w = this.container.offsetWidth  || this.container.clientWidth;
    const h = this.container.offsetHeight || this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  add(obj)    { this.scene.add(obj); }
  remove(obj) { this.scene.remove(obj); }

  dispose() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('resize', this._resizeHandler);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
