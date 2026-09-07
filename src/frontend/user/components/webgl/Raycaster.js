// Raycaster.js – handles mouse raycasting onto ImagePlane meshes.
// Responsible for hover detection (updates plane uniforms) and click selection.

import * as THREE from 'three';

export class Raycaster {
  /**
   * @param {HTMLElement} domElement – element receiving mouse events (e.g., renderer container).
   * @param {THREE.Camera} camera – three.js camera used for raycasting.
   * @param {ImagePlane[]} planes – list of ImagePlane instances to test against.
   * @param {Object} callbacks – optional callbacks { onHover(plane), onSelect(plane) }.
   */
  constructor(domElement, camera, planes, callbacks = {}) {
    this.dom = domElement;
    this.camera = camera;
    this.planes = planes;
    this.onHover = callbacks.onHover || (() => {});
    this.onSelect = callbacks.onSelect || (() => {});
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.currentHover = null;

    // bind event handlers
    this._onMove = this._onMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this.dom.addEventListener('mousemove', this._onMove);
    this.dom.addEventListener('click', this._onClick);
  }

  _onMove(event) {
    const rect = this.dom.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const objects = this.planes.map(p => p.mesh);
    const intersects = this.raycaster.intersectObjects(objects, true);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const hitPlane = this.planes.find(p => p.mesh === hitMesh);
      if (hitPlane && hitPlane !== this.currentHover) {
        this.currentHover = hitPlane;
        // update hover uniform for all planes (reset others)
        this.planes.forEach(p => {
          p.mesh.material.uniforms.u_mouse.value.set(0.5, 0.5);
        });
        // set uniform based on mouse position (0..1) for hovered plane
        const uv = new THREE.Vector2(
          (event.clientX - rect.left) / rect.width,
          1 - (event.clientY - rect.top) / rect.height
        );
        hitPlane.mesh.material.uniforms.u_mouse.value.copy(uv);
        this.onHover(hitPlane);
      }
    } else {
      if (this.currentHover) {
        // reset hover uniform
        this.currentHover.mesh.material.uniforms.u_mouse.value.set(0.5, 0.5);
        this.currentHover = null;
        this.onHover(null);
      }
    }
  }

  _onClick(event) {
    if (this.currentHover) {
      this.onSelect(this.currentHover);
    }
  }

  dispose() {
    this.dom.removeEventListener('mousemove', this._onMove);
    this.dom.removeEventListener('click', this._onClick);
  }
}
