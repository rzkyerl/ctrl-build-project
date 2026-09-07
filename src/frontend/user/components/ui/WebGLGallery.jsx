import { useCallback } from 'react';
import { useWebGLGallery } from '../webgl/useWebGLGallery';
import './WebGLGallery.css';

export default function WebGLGallery({ items }) {
  const { containerRef, setMouse } = useWebGLGallery(items);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    );
  }, [setMouse]);

  return (
    <div className="wgl-wrapper">
      <div
        ref={containerRef}
        className="wgl-canvas"
        onMouseMove={handleMouseMove}
      />
    </div>
  );
}
