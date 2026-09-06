import * as THREE from 'three';
import vertexSource   from './shaders/image.vert?raw';
import fragmentSource from './shaders/image.frag?raw';

export class ImagePlane {
  constructor(texture, opts = {}) {
    const maxWidth = opts.maxWidth ?? 3.1;
    const img      = texture.image;
    const aspect   = (img?.width && img?.height) ? img.width / img.height : 16 / 9;

    this.width  = maxWidth;
    this.height = maxWidth / aspect;

    const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 20); // 20 Y segments for smooth bend
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_image:    { value: texture },
        u_mouse:    { value: new THREE.Vector2(0.5, 0.5) },
        u_time:     { value: 0 },
        u_hover:    { value: 0 },
        u_velocity: { value: 0 }, // scroll/rotate velocity
        u_bend:     { value: 1.2 }, // spherical dome bend strength
      },
      vertexShader:   vertexSource,
      fragmentShader: fragmentSource,
      transparent:    true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.name = 'ImagePlane';
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
