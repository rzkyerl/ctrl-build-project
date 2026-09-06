// TrailRenderer.js – ping‑pong render targets that accumulate mouse trail.
// Each frame draws a fading copy of previous texture and a small white dot at
// the current mouse position. The resulting texture can be passed to post‑
// processing shaders as `uTrail`.

import * as THREE from 'three';

export class TrailRenderer {
  /**
   * @param {THREE.WebGLRenderer} renderer – shared three.js renderer.
   * @param {number} width  – render target width (pixels).
   * @param {number} height – render target height (pixels).
   */
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;

    // two render targets for ping‑pong
    const params = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    };
    this.rtA = new THREE.WebGLRenderTarget(width, height, params);
    this.rtB = new THREE.WebGLRenderTarget(width, height, params);

    // orthographic scene to draw full‑screen quad
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // shader draws previous texture (decayed) and a dot at mouse
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uPrev: { value: this.rtA.texture },
        uMouse: { value: new THREE.Vector2(-1, -1) }, // off‑screen default
        uDecay: { value: 0.96 }, // decay factor per frame
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uPrev;
        uniform vec2 uMouse;
        uniform float uDecay;
        varying vec2 vUv;
        void main(){
          // decay previous frame
          vec4 prev = texture2D(uPrev, vUv) * uDecay;
          // distance from current pixel to mouse (both in 0..1 space)
          float d = distance(vUv, uMouse);
          // soft dot – radius ~0.015
          float dot = smoothstep(0.015, 0.0, d);
          vec4 cur = vec4(vec3(dot), dot);
          // combine (max keeps brightest trail)
          gl_FragColor = max(prev, cur);
        }
      `,
      transparent: true,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(quad);

    // start with rtA as read, rtB as write
    this.readTarget = this.rtA;
    this.writeTarget = this.rtB;
  }

  /**
   * Update trail with normalized mouse coordinates (0..1).
   * @param {{x:number,y:number}} mouse
   */
  update(mouse) {
    // set uniforms for this frame
    this.material.uniforms.uPrev.value = this.readTarget.texture;
    this.material.uniforms.uMouse.value.set(mouse.x, 1.0 - mouse.y); // flip Y for texture space
    // render to write target
    this.renderer.setRenderTarget(this.writeTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    // swap ping‑pong buffers
    const tmp = this.readTarget;
    this.readTarget = this.writeTarget;
    this.writeTarget = tmp;
  }

  /**
   * Get current trail texture to use as uniform.
   * @returns {THREE.Texture}
   */
  getTexture() {
    return this.readTarget.texture;
  }

  /**
   * Dispose render targets and material.
   */
  dispose() {
    this.rtA.dispose();
    this.rtB.dispose();
    this.material.dispose();
  }
}
