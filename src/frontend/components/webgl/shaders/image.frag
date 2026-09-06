precision mediump float;

uniform sampler2D u_image;
uniform vec2      u_mouse;
uniform float     u_time;
uniform float     u_hover;    // 0..1  hover intensity (also used as proximity in carousel)
uniform float     u_velocity; // scroll/rotate velocity for distortion

varying vec2 vUv;

void main() {
  // ── Scroll / rotate distortion ───────────────────────────────────
  // Horizontal sine-wave bend driven by velocity.
  // Peak at centre of image (sin profile), zero at top/bottom edges.
  float velStr = clamp(u_velocity * 20.0, -1.0, 1.0);
  float bend   = sin(vUv.y * 3.14159) * velStr * 0.02;
  vec2  bentUv = vec2(vUv.x + bend, vUv.y);

  // ── Hover parallax ───────────────────────────────────────────────
  vec2 disp    = (u_mouse - 0.5) * 0.018 * u_hover;
  vec2 ghostUv = bentUv - disp * 0.5;

  // ── Chromatic aberration ─────────────────────────────────────────
  float velCA   = abs(velStr) * 0.004;
  float hoverCA = sin(u_time)  * 0.002 * u_hover;
  float ca      = velCA + hoverCA;

  vec2 uvR = bentUv + disp + vec2(ca,  0.0);
  vec2 uvG = bentUv + disp;
  vec2 uvB = bentUv + disp - vec2(ca,  0.0);

  float r = texture2D(u_image, uvR).r;
  float g = texture2D(u_image, uvG).g;
  float b = texture2D(u_image, uvB).b;

  // ── Ghost blend (hover / carousel proximity) ─────────────────────
  vec3 base  = vec3(r, g, b);
  vec3 ghost = texture2D(u_image, ghostUv).rgb;
  vec3 color = mix(base, ghost, 0.25 * u_hover);

  // ── Carousel proximity fade ──────────────────────────────────────
  // In carousel mode, u_hover is set to proximity² (0 = far, 1 = centre).
  // Planes far from centre are dimmed slightly.
  float brightness = mix(0.55, 1.0, u_hover);

  gl_FragColor = vec4(color * brightness, 1.0);
}
