// TextureLoader.js – loads portfolio images as Three.js textures.
// Uses ImageBitmapLoader and creates Texture correctly from the bitmap.

import * as THREE from 'three';

export class PortfolioTextureLoader {
  constructor() {
    this.loader = new THREE.ImageBitmapLoader();
    this.loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });
  }

  _isCrossOrigin(url) {
    try {
      const parsed = new URL(url, window.location.origin)
      return parsed.origin !== window.location.origin
    } catch {
      return false
    }
  }

  load(urls) {
    if (urls.some((url) => this._isCrossOrigin(url))) {
      this.loader.setCrossOrigin('anonymous')
    }

    return Promise.all(
      urls.map((url) =>
        new Promise((resolve, reject) => {
          this.loader.load(
            url,
            (bitmap) => {
              const tex = new THREE.Texture(bitmap)
              tex.wrapS = THREE.ClampToEdgeWrapping
              tex.wrapT = THREE.ClampToEdgeWrapping
              tex.minFilter = THREE.LinearFilter
              tex.magFilter = THREE.LinearFilter
              tex.generateMipmaps = false
              tex.colorSpace = THREE.SRGBColorSpace
              tex.needsUpdate = true
              resolve(tex)
            },
            undefined,
            (err) => reject(err)
          )
        })
      )
    )
  }
}
