export class ListLayout {
  constructor(engine, planes, domElement, opts = {}) {
    this.engine  = engine;
    this.planes  = planes;
    this.dom     = domElement;
    this.gapY    = opts.gapY ?? 0.2;
    this.scrollY = 0;
    this.targetY = 0;
    this._animId = null;

    // Stack vertically, centred on Y=0
    const totalHeight = planes.reduce((sum, p) => sum + p.height + this.gapY, 0) - this.gapY;
    let cursor = totalHeight / 2; // start from top half
    this._positions = planes.map((plane) => {
      const y = cursor - plane.height / 2;
      cursor -= plane.height + this.gapY;
      plane.mesh.position.set(0, y, 0);
      engine.add(plane.mesh);
      return { x: 0, y };
    });
    this._maxScroll = Math.max(0, totalHeight - (planes[0]?.height ?? 1));

    this._onWheel      = this._onWheel.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove  = this._onTouchMove.bind(this);
    this._touchY       = 0;

    this.dom.addEventListener('wheel',      this._onWheel,      { passive: true });
    this.dom.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.dom.addEventListener('touchmove',  this._onTouchMove,  { passive: true });

    this._tick = this._tick.bind(this);
    this._animId = requestAnimationFrame(this._tick);
  }

  _onWheel(e) {
    const pxPerUnit = (this.dom.offsetHeight || 600) / 5.6;
    this.targetY = Math.max(0, Math.min(this._maxScroll, this.targetY + e.deltaY / pxPerUnit));
  }
  _onTouchStart(e) { this._touchY = e.touches[0].clientY; }
  _onTouchMove(e) {
    const dy = this._touchY - e.touches[0].clientY;
    this._touchY = e.touches[0].clientY;
    const pxPerUnit = (this.dom.offsetHeight || 600) / 5.6;
    this.targetY = Math.max(0, Math.min(this._maxScroll, this.targetY + dy / pxPerUnit));
  }

  _tick() {
    this.scrollY += (this.targetY - this.scrollY) * 0.1;
    this.planes.forEach((plane, i) => {
      plane.mesh.position.y = this._positions[i].y - this.scrollY;
    });
    this._animId = requestAnimationFrame(this._tick);
  }

  onScroll(deltaWorldUnits) {
    this.targetY = Math.max(0, Math.min(this._maxScroll, this.targetY + deltaWorldUnits));
  }

  dispose() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this.dom.removeEventListener('wheel',      this._onWheel);
    this.dom.removeEventListener('touchstart', this._onTouchStart);
    this.dom.removeEventListener('touchmove',  this._onTouchMove);
    this.planes.forEach(p => this.engine.remove(p.mesh));
  }
}
