// DragScroll.js – mouse drag scrolling for WebGL canvas.
// No preventDefault so native page scroll is not blocked.
// Inertia is handled manually via velocity decay.

export class DragScroll {
  /**
   * @param {HTMLElement} domElement – element to listen for drag events.
   * @param {function(deltaY:number):void} onScroll – callback receiving scroll delta.
   */
  constructor(domElement, onScroll) {
    this.dom = domElement;
    this.onScroll = onScroll;
    this.isDragging = false;
    this.lastY = 0;
    this.velocity = 0;
    this._rafId = null;

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);

    // pointer events only — no touch here, GridLayout handles touch scroll
    this.dom.addEventListener('mousedown', this._onDown);
  }

  _onDown(event) {
    // no preventDefault — allows page scroll to still work
    this.isDragging = true;
    this.velocity = 0;
    this.lastY = event.clientY;
    if (this._rafId) cancelAnimationFrame(this._rafId);

    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
  }

  _onMove(event) {
    if (!this.isDragging) return;
    const delta = this.lastY - event.clientY;
    this.lastY = event.clientY;
    this.velocity = delta;
    this.onScroll(delta);
  }

  _onUp() {
    this.isDragging = false;
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);

    // coast to stop with inertia decay
    const coast = () => {
      if (Math.abs(this.velocity) < 0.5) return;
      this.onScroll(this.velocity);
      this.velocity *= 0.88; // friction
      this._rafId = requestAnimationFrame(coast);
    };
    coast();
  }

  dispose() {
    this.isDragging = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
    this.dom.removeEventListener('mousedown', this._onDown);
  }
}
