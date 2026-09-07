// post.frag – full‑screen post‑processing shader
// Fisheye distortion, velocity‑driven chromatic aberration, optional blur.

precision mediump float;

uniform sampler2D u_scene;   // rendered scene texture
uniform vec2 u_resolution; // viewport size
uniform vec2 u_mouse;       // current mouse (0..1)
uniform vec2 u_prevMouse;    // previous mouse (0..1)
uniform float u_time;

varying vec2 vUv;

// Fisheye function – pushes edges inward
vec2 fisheye(vec2 uv){
  vec2 centered = uv - 0.5;
  float r = length(centered);
  float theta = atan(centered.y, centered.x);
  float rDist = pow(r, 0.9); // stronger near edges
  return vec2(cos(theta), sin(theta)) * rDist + 0.5;
}

void main(){
  // velocity from mouse movement
  vec2 vel = (u_mouse - u_prevMouse) * 10.0; // amplify
  float speed = length(vel);

  // apply fisheye to UV
  vec2 uv = fisheye(vUv);

  // chromatic offset based on speed
  float chroma = speed * 0.002;
  vec2 uvR = uv + vec2(chroma, 0.0);
  vec2 uvG = uv;
  vec2 uvB = uv - vec2(chroma, 0.0);

  vec3 col = vec3(
    texture2D(u_scene, uvR).r,
    texture2D(u_scene, uvG).g,
    texture2D(u_scene, uvB).b
  );

  // simple blur – average with neighbours (2‑tap)
  if(speed > 0.05){
    vec2 off = vel * 0.001;
    col = (col + vec3(
      texture2D(u_scene, uvR + off).r,
      texture2D(u_scene, uvG + off).g,
      texture2D(u_scene, uvB + off).b
    )) * 0.5;
  }

  gl_FragColor = vec4(col, 1.0);
}
