// CarouselLayout.js – curved strip carousel.
// Planes arranged along a horizontal arc. Drag/wheel to rotate.
// Active (centre) plane scales up. Velocity drives bend distortion via u_velocity.

import * as THREE from 'three';

export class CarouselLayout {
  /**
   * @param {WebGLRendererEngine} engine
   * @param {ImagePlane[]} planes
   * @param {HTMLElement} domElement
   * @param {Object} opts
   */
  constructor(engine, planes, domElement, opts = {}) {
    this.engine  = engine;
    this.planes  = planes;
    this.dom     = domElement;

    // Arc parameters
    this.radius    = opts.radius    ?? 7;    // radius of the arc circle
    this.arcSpread = opts.arcSpread ?? 0.38; // radians between each plane

    // Rotation state (in radians — index into the arc)
    this.rotation  = 0;        // current (lerped)
    this.targetRot = 0;        // destination
    this.velocity  = 0;        // per-frame delta for shader
    this._animId   = null;

    // Drag state
    this._isDragging  = false;
    this._dragStartX  = 0;
    this._dragStartRot = 0;

    // Scale per plane (active = bigger)
    this._scales = planes.map(() => 1);

    // Add all meshes to scene
    planes.forEach(p => {
      p.mesh.userData._offsetRot = 0;
      engine.add(p.mesh);
    });

    // Events
    this._onWheel     = this._onWheel.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp   = this._onPointerUp.bind(this);

    this.dom.addEventListener('wheel',       this._onWheel,       { passive: true });
    this.dom.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove',   this._onPointerMove);
    window.addEventListener('pointerup',     this._onPointerUp);

    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }

  // ── Input ────────────────────────────────────────────────────────

  _onWheel(e) {
    // horizontal deltaX for trackpad, deltaY as fallback
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    this.targetRot += delta * 0.003;
  }

  _onPointerDown(e) {
    this._isDragging   = true;
    this._dragStartX   = e.clientX;
    this._dragStartRot = this.targetRot;
    this.dom.setPointerCapture(e.pointerId);
  }

  _onPointerMove(e) {
    if (!this._isDragging) return;
    const dx = e.clientX - this._dragStartX;
    this.targetRot = this._dragStartRot - dx * 0.008;
  }

  _onPointerUp() {
    this._isDragging = false;
  }

  // ── Tick ─────────────────────────────────────────────────────────

  _tick() {
    const prev      = this.rotation;
    this.rotation  += (this.targetRot - this.rotation) * 0.08;
    this.velocity   = this.rotation - prev;

    const count = this.planes.length;

    this.planes.forEach((plane, i) => {
      // Angle of this plane in the arc
      const baseAngle = i * this.arcSpread;
      const angle     = baseAngle - this.rotation;

      // Position on arc (camera looks along -Z, arc curves in XZ plane)
      const x = Math.sin(angle) * this.radius;
      const z = Math.cos(angle) * this.radius - this.radius; // shift so centre is at z≈0
      plane.mesh.position.set(x, 0, z);

      // Face the camera (look toward positive Z)
      plane.mesh.lookAt(new THREE.Vector3(x, 0, 20));

      // Scale: plane closest to centre (angle≈0) gets 1.15×, others shrink
      const proximity    = 1 - Math.min(Math.abs(angle), Math.PI) / Math.PI;
      const targetScale  = 0.82 + proximity * 0.33; // range 0.82 – 1.15
      this._scales[i]   += (targetScale - this._scales[i]) * 0.08;
      plane.mesh.scale.setScalar(this._scales[i]);

      // Opacity: fade planes far from centre
      if (plane.mesh.material?.uniforms?.u_hover !== undefined) {
        plane.mesh.material.uniforms.u_hover.value = proximity * proximity;
      }

      // Velocity distortion
      if (plane.mesh.material?.uniforms?.u_velocity !== undefined) {
        plane.mesh.material.uniforms.u_velocity.value = this.velocity;
      }
    });

    this._animId = requestAnimationFrame(this._tick);
  }

  // ── Dispose ──────────────────────────────────────────────────────

  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this.dom.removeEventListener('wheel',       this._onWheel);
    this.dom.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove',   this._onPointerMove);
    window.removeEventListener('pointerup',     this._onPointerUp);
    this.planes.forEach(p => {
      p.mesh.scale.setScalar(1);
      this.engine.remove(p.mesh);
    });
  }
}
