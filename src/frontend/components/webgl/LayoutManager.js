import { GridLayout }    from './GridLayout';
import { CarouselLayout } from './CarouselLayout';
import { ListLayout }    from './ListLayout';

export class LayoutManager {
  constructor(engine, planes, domElement) {
    this.engine  = engine;
    this.planes  = planes;
    this.dom     = domElement;
    this.current = null;
  }

  setMode(mode) {
    // cancel in-progress transition if any
    if (this._transitionRaf) cancelAnimationFrame(this._transitionRaf);

    const oldLayout = this.current;
    const newLayout = this._createLayout(mode);
    this.current    = newLayout;

    if (!oldLayout) {
      // first load — just show immediately
      this.planes.forEach(p => { p.mesh.material.opacity = 1; });
      return;
    }

    // sequential fade: fade out old (old planes still in scene from oldLayout)
    // then fade in new (new planes added by _createLayout above)
    // start new planes invisible
    this.planes.forEach(p => { p.mesh.material.opacity = 0; });

    let progress  = 0;
    let lastTime  = null;

    const animate = (ts) => {
      if (lastTime === null) lastTime = ts;
      const dt = ts - lastTime;
      lastTime = ts;
      progress += dt / 400; // 400ms fade
      const t = Math.min(progress, 1);

      this.planes.forEach(p => { p.mesh.material.opacity = t; });

      if (t < 1) {
        this._transitionRaf = requestAnimationFrame(animate);
      } else {
        this._transitionRaf = null;
        this.planes.forEach(p => { p.mesh.material.opacity = 1; });
        oldLayout.dispose();
      }
    };

    this._transitionRaf = requestAnimationFrame(animate);
  }

  _createLayout(mode) {
    switch (mode) {
      case 'carousel': return new CarouselLayout(this.engine, this.planes, this.dom);
      case 'list':     return new ListLayout(this.engine, this.planes, this.dom);
      default:         return new GridLayout(this.engine, this.planes, this.dom);
    }
  }
}
