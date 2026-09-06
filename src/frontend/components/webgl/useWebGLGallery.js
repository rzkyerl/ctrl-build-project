import { useEffect, useRef, useState } from 'react';
import { WebGLRendererEngine }    from './WebGLRenderer';
import { PortfolioTextureLoader } from './TextureLoader';
import { ImagePlane }             from './ImagePlane';
import { LayoutManager }          from './LayoutManager';
import { Raycaster }              from './Raycaster';
import { DragScroll }             from './DragScroll';

export function useWebGLGallery(items, initialMode = 'grid') {
  const containerRef  = useRef(null);
  const mouseRef      = useRef({ x: 0.5, y: 0.5 });
  const internalsRef  = useRef(null); // { layoutMgr, ray, drag }

  const [mode,     setModeState] = useState(initialMode);
  const [selected, setSelected]  = useState(null);
  const [ready,    setReady]     = useState(false);

  // ── One-time engine + texture init ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    // Wait until the container has real dimensions before initialising.
    // This guards against the case where the div hasn't been painted yet.
    const init = () => {
      if (disposed) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      if (!w || !h) {
        requestAnimationFrame(init);
        return;
      }
      startEngine();
    };

    const startEngine = () => {
    const engine = new WebGLRendererEngine(containerRef.current);
    const loader = new PortfolioTextureLoader();

    loader.load(items.map(i => i.url)).then((textures) => {
      if (disposed) return;

      const planes    = textures.map(tex => new ImagePlane(tex));
      const layoutMgr = new LayoutManager(engine, planes, containerRef.current);
      layoutMgr.setMode('grid');

      const ray = new Raycaster(containerRef.current, engine.camera, planes, {
        onHover: (plane) => {
          // animate u_hover uniform
          planes.forEach(p => {
            p.mesh.material.uniforms.u_hover.value = 0;
          });
          if (plane) {
            plane.mesh.material.uniforms.u_hover.value = 1;
            plane.mesh.material.uniforms.u_mouse.value.set(0.5, 0.5);
          }
        },
        onSelect: (plane) => {
          if (plane) setSelected(items[planes.indexOf(plane)]);
        },
      });

      const drag = new DragScroll(containerRef.current, (delta) => {
        const h = containerRef.current.offsetHeight || 600;
        const pxPerUnit = h / 5.6;
        if (layoutMgr.current?.onScroll) {
          layoutMgr.current.onScroll(delta / pxPerUnit);
        }
      });

      internalsRef.current = { engine, layoutMgr, ray, drag, planes };
      setReady(true);
    });
    }; // end startEngine

    init();

    return () => {
      disposed = true;
      const r = internalsRef.current;
      if (r) {
        r.ray.dispose();
        r.drag.dispose();
        r.layoutMgr.current?.dispose();
        r.engine.dispose();
        r.planes.forEach(p => p.dispose());
        internalsRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // ── Mode changes — just call layoutMgr.setMode, no engine rebuild ──
  useEffect(() => {
    if (!internalsRef.current) return;
    internalsRef.current.layoutMgr.setMode(mode);
  }, [mode]);

  // ── Mouse tracking for raycaster + hover uniform ────────────────
  const setMouse = (mx, my) => {
    mouseRef.current = { x: mx, y: my };
    // forward to hovered plane's uniform
    const r = internalsRef.current;
    if (!r) return;
    r.ray.planes.forEach(plane => {
      if (plane.mesh.material.uniforms.u_hover.value > 0) {
        plane.mesh.material.uniforms.u_mouse.value.set(mx, my);
      }
    });
  };

  const setMode = (newMode) => setModeState(newMode);

  return { mode, setMode, selected, setSelected, containerRef, setMouse, ready };
}
