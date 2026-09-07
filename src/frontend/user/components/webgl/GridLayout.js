// GridLayout.js – infinite 2D scroll grid (vertical + horizontal).
// Planes wrap in both axes. Velocity drives shader distortion.

export class GridLayout {
  constructor(engine, planes, domElement, opts = {}) {
    this.engine  = engine;
    this.planes  = planes;
    this.dom     = domElement;
    this.cols    = opts.cols ?? 3;
    this.gapX    = opts.gapX ?? 0.1;
    this.gapY    = opts.gapY ?? 0.1;

    // Scroll state — both axes
    this.scrollX  = 0; this.targetX  = 0;
    this.scrollY  = 0; this.targetY  = 0;
    this.velX     = 0; this.velY     = 0;
    this._animId  = null;

    // FOV=50°, Z=6 → visible ≈ 5.6h × 9.95w world units
    this._visH = 5.6;
    this._visW = 9.95;

    const pw = planes[0]?.width  ?? 3.1;
    const ph = planes[0]?.height ?? 1.74;
    this._tileW = pw + this.gapX;
    this._tileH = ph + this.gapY;

    // Fill viewport + 1 buffer tile in every direction
    const visRows = Math.ceil(this._visH / this._tileH) + 2;
    const visCols = Math.ceil(this._visW / this._tileW) + 2;
    const totalSlots = visRows * visCols;

    // Build slot grid — cycle through planes
    this._slots = Array.from({ length: totalSlots }, (_, i) =>
      planes[i % planes.length]
    );

    // Clone meshes for duplicate slots, track base positions
    const usedMesh = new Map();
    this._meshes = this._slots.map((plane, idx) => {
      const col = idx % visCols;
      const row = Math.floor(idx / visCols);
      const x   = (col - (visCols - 1) / 2) * this._tileW;
      const y   = (visRows / 2 - 0.5) * this._tileH - row * this._tileH;

      let mesh;
      if (!usedMesh.has(plane)) {
        mesh = plane.mesh;
        usedMesh.set(plane, true);
      } else {
        mesh = plane.mesh.clone();
      }
      mesh.position.set(x, y, 0);
      mesh.userData._offX = 0;
      mesh.userData._offY = 0;
      engine.add(mesh);
      return { mesh, bx: x, by: y };
    });

    // Wrap bounds = one full grid cycle
    this._cycleW = visCols * this._tileW;
    this._cycleH = visRows * this._tileH;
    this._halfW  = this._visW / 2 + this._tileW;
    this._halfH  = this._visH / 2 + this._tileH;

    // Events
    this._onWheel      = this._onWheel.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove  = this._onTouchMove.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp   = this._onPointerUp.bind(this);
    this._isDragging    = false;
    this._dragX = 0; this._dragY = 0;
    this._touchX = 0; this._touchY = 0;

    this.dom.addEventListener('wheel',       this._onWheel,       { passive: true });
    this.dom.addEventListener('touchstart',  this._onTouchStart,  { passive: true });
    this.dom.addEventListener('touchmove',   this._onTouchMove,   { passive: true });
    this.dom.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove',   this._onPointerMove);
    window.addEventListener('pointerup',     this._onPointerUp);

    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }

  // ── px → world unit conversion ───────────────────────────────────
  _pxH(px) { return px / ((this.dom.offsetHeight || 600) / this._visH); }
  _pxW(px) { return px / ((this.dom.offsetWidth  || 900) / this._visW); }

  // ── Wheel ────────────────────────────────────────────────────────
  _onWheel(e) {
    this.targetX -= this._pxW(e.deltaX);
    this.targetY += this._pxH(e.deltaY);
  }

  // ── Touch ────────────────────────────────────────────────────────
  _onTouchStart(e) {
    this._touchX = e.touches[0].clientX;
    this._touchY = e.touches[0].clientY;
  }
  _onTouchMove(e) {
    const dx = this._touchX - e.touches[0].clientX;
    const dy = this._touchY - e.touches[0].clientY;
    this._touchX = e.touches[0].clientX;
    this._touchY = e.touches[0].clientY;
    this.targetX -= this._pxW(dx);
    this.targetY += this._pxH(dy);
  }

  // ── Pointer drag ─────────────────────────────────────────────────
  _onPointerDown(e) {
    this._isDragging = true;
    this._dragX = e.clientX;
    this._dragY = e.clientY;
    this.dom.setPointerCapture?.(e.pointerId);
  }
  _onPointerMove(e) {
    if (!this._isDragging) return;
    const dx = e.clientX - this._dragX;
    const dy = e.clientY - this._dragY;
    this._dragX = e.clientX;
    this._dragY = e.clientY;
    this.targetX += this._pxW(dx);
    this.targetY -= this._pxH(dy);
  }
  _onPointerUp() { this._isDragging = false; }

  // ── Tick ─────────────────────────────────────────────────────────
  _tick() {
    const px = this.scrollX;
    const py = this.scrollY;
    this.scrollX += (this.targetX - this.scrollX) * 0.1;
    this.scrollY += (this.targetY - this.scrollY) * 0.1;
    this.velX = this.scrollX - px;
    this.velY = this.scrollY - py;

    this._meshes.forEach(({ mesh, bx, by }) => {
      let x = bx + this.scrollX + (mesh.userData._offX ?? 0);
      let y = by + this.scrollY + (mesh.userData._offY ?? 0);

      // Wrap horizontally
      if (x > this._halfW)  mesh.userData._offX = (mesh.userData._offX ?? 0) - this._cycleW;
      if (x < -this._halfW) mesh.userData._offX = (mesh.userData._offX ?? 0) + this._cycleW;
      // Wrap vertically
      if (y > this._halfH)  mesh.userData._offY = (mesh.userData._offY ?? 0) - this._cycleH;
      if (y < -this._halfH) mesh.userData._offY = (mesh.userData._offY ?? 0) + this._cycleH;

      x = bx + this.scrollX + (mesh.userData._offX ?? 0);
      y = by + this.scrollY + (mesh.userData._offY ?? 0);
      mesh.position.set(x, y, 0);

      // Shader uniforms
      const u = mesh.material?.uniforms;
      if (!u) return;
      const vel = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
      if (u.u_velocity !== undefined) u.u_velocity.value = this.velY;
      if (u.u_bend     !== undefined) {
        const tb = 1.2 + vel * 25;
        u.u_bend.value += (tb - u.u_bend.value) * 0.1;
      }
    });

    this._animId = requestAnimationFrame(this._tick);
  }

  onScroll(dw) { this.targetY += dw; }

  // ── Dispose ──────────────────────────────────────────────────────
  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this.dom.removeEventListener('wheel',       this._onWheel);
    this.dom.removeEventListener('touchstart',  this._onTouchStart);
    this.dom.removeEventListener('touchmove',   this._onTouchMove);
    this.dom.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove',   this._onPointerMove);
    window.removeEventListener('pointerup',     this._onPointerUp);
    this._meshes.forEach(({ mesh }) => {
      mesh.userData._offX = 0;
      mesh.userData._offY = 0;
      this.engine.remove(mesh);
    });
  }
}
