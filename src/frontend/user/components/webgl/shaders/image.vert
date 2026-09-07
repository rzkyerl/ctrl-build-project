precision mediump float;

uniform float u_velocity;
uniform float u_bend;

varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 pos = position;

  // World position of this vertex
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  // Normalise world X and Y by half-visible size
  // visH ≈ 5.6, visW ≈ 9.95 at FOV=50°, Z=6
  float nx = worldPos.x / 5.0;   // -1..1 across visible width
  float ny = worldPos.y / 2.8;   // -1..1 across visible height

  // Radial distance from screen centre (0=centre, 1=corner)
  float r2 = nx * nx + ny * ny;

  // Spherical dome: z offset proportional to r² (zero at centre, max at edges)
  float bend    = u_bend + abs(u_velocity) * 1.5;
  float zOffset = r2 * bend;

  pos.z += zOffset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
