import React, { useEffect, useRef } from 'react';

// Simple WebGL shader with hover displacement + chromatic aberration
// Vertex passes through position & texcoord
const vertexSrc = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main(){
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

// Fragment creates RGB offset based on mouse + time
const fragmentSrc = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec2 u_mouse; // normalized 0..1
uniform float u_time;
void main(){
  vec2 disp = (u_mouse - 0.5) * 0.02; // small offset
  float t = sin(u_time) * 0.005;
  vec2 uvR = v_texCoord + disp + t;
  vec2 uvG = v_texCoord + disp * 0.8;
  vec2 uvB = v_texCoord + disp * 1.2;
  float r = texture2D(u_image, uvR).r;
  float g = texture2D(u_image, uvG).g;
  float b = texture2D(u_image, uvB).b;
  gl_FragColor = vec4(r,g,b,1.0);
}
`;

export default function PortfolioGL({ url, title }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef([0.5, 0.5]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // compile shader helper
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vert = compile(gl.VERTEX_SHADER, vertexSrc);
    const frag = compile(gl.FRAGMENT_SHADER, fragmentSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error', gl.getProgramInfoLog(program));
      return;
    }

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const imageLocation = gl.getUniformLocation(program, 'u_image');

    // quad vertices
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0,0,
      1,0,
      0,1,
      0,1,
      1,0,
      1,1,
    ]), gl.STATIC_DRAW);

    // load texture
    const texture = gl.createTexture();
    const image = new Image();
    image.crossOrigin = '';
    image.src = url;
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
    };

    const render = () => {
      timeRef.current += 0.016; // approx 60fps
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // bind position
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      // bind texcoord
      gl.enableVertexAttribArray(texCoordLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2fv(mouseLocation, mouseRef.current);
      gl.uniform1f(timeLocation, timeRef.current);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(imageLocation, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    };
    render();

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseRef.current = [x, y];
    };
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('mouseleave', () => (mouseRef.current = [0.5,0.5]));
    return () => {
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, [url]);

  // keep aspect ratio like image
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800 / 1.7}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-label={title}
    />
  );
}
