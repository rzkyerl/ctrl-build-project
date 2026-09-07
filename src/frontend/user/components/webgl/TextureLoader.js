// TextureLoader.js – loads portfolio images as Three.js textures.
// Uses ImageBitmapLoader and creates Texture correctly from the bitmap.

import * as THREE from 'three';

export class PortfolioTextureLoader {
  constructor() {
    this.loader = new THREE.ImageBitmapLoader();
    this.loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
    // do NOT set crossOrigin for same-origin Vite assets
  }

  /**
   * Load multiple URLs.
   * @param {string[]} urls
   * @returns {Promise<THREE.Texture[]>}
   */
  load(urls) {
    return Promise.all(
      urls.map((url) =>
        new Promise((resolve, reject) => {
          this.loader.load(
            url,
            (bitmap) => {
              // Texture (not CanvasTexture) accepts ImageBitmap directly
              const tex = new THREE.Texture(bitmap);
              tex.minFilter  = THREE.LinearFilter;
              tex.magFilter  = THREE.LinearFilter;
              tex.generateMipmaps = false;
              tex.needsUpdate = true;
              resolve(tex);
            },
            undefined,
            (err) => reject(err)
          );
        })
      )
    );
  }
}
