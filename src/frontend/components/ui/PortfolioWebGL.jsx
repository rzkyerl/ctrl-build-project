// PortfolioWebGL.jsx – renders a single portfolio image with three.js engine and hover shader.

import { useEffect, useRef } from 'react';
import { WebGLRendererEngine } from '../webgl/WebGLRenderer';
import { PortfolioTextureLoader } from '../webgl/TextureLoader';
import { ImagePlane } from '../webgl/ImagePlane';

export default function PortfolioWebGL({ url, title }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const planeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Initialize engine
    const engine = new WebGLRendererEngine(containerRef.current);
    engineRef.current = engine;

    // Load texture
    const loader = new PortfolioTextureLoader();
    loader.load([url]).then((textures) => {
      const tex = textures[0];
      const plane = new ImagePlane(tex, { width: 1, height: 1 });
      planeRef.current = plane;
      engine.add(plane.mesh);
    });

    // Mouse move updates uniforms
    const handleMouse = (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      if (planeRef.current) {
        planeRef.current.mesh.material.uniforms.u_mouse.value.set(mx, 1 - my);
      }
    };
    containerRef.current.addEventListener('mousemove', handleMouse);

    return () => {
      containerRef.current.removeEventListener('mousemove', handleMouse);
      if (engineRef.current) engineRef.current.dispose();
    };
  }, [url]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-label={title} />;
}
