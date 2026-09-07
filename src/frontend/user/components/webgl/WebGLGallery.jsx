import { useCallback } from 'react';
import { useWebGLGallery } from '../webgl/useWebGLGallery';
import './WebGLGallery.css';

export default function WebGLGallery({ items }) {
  const { mode, setMode, selected, containerRef, setMouse, ready } =
    useWebGLGallery(items);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse(
      (e.clientX - rect.left) / rect.width,
      1 - (e.clientY - rect.top) / rect.height
    );
  }, [setMouse]);

  return (
    <div className="wgl-wrapper">
      {/* canvas */}
      <div
        ref={containerRef}
        className="wgl-canvas"
        onMouseMove={handleMouseMove}
      />

      {/* loading state */}
      {!ready && <div className="wgl-loading">Loading...</div>}

      {/* mode toggle */}
      <div className="wgl-controls">
        {['grid', 'carousel', 'list'].map(m => (
          <button
            key={m}
            className={`wgl-btn${mode === m ? ' wgl-btn--active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'grid' ? '⊞' : m === 'carousel' ? '◎' : '≡'}
          </button>
        ))}
      </div>

      {/* selected item info */}
      {selected && (
        <div className="wgl-info">
          <span className="wgl-info-title">{selected.title}</span>
          {selected.cat && <span className="wgl-info-cat">{selected.cat}</span>}
        </div>
      )}
    </div>
  );
}
