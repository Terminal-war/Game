export function initCyberGrid(canvas: HTMLCanvasElement, quality: 'low' | 'medium' | 'high'): () => void {
  const gl = canvas.getContext('webgl');
  if (!gl) return () => undefined;

  const vtx = gl.createShader(gl.VERTEX_SHADER);
  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vtx || !frag || !program) return () => undefined;

  gl.shaderSource(
    vtx,
    `attribute vec2 aPos;
     varying vec2 vUv;
     void main(){
       vUv = aPos * 0.5 + 0.5;
       gl_Position = vec4(aPos, 0.0, 1.0);
     }`,
  );
  gl.compileShader(vtx);

  gl.shaderSource(
    frag,
    `precision mediump float;
     uniform float uTime;
     uniform float uIntensity;
     varying vec2 vUv;
     void main(){
       float scan = sin((vUv.y + uTime * 0.05) * 160.0) * 0.07;
       float bars = step(0.985, fract(vUv.x * 14.0 + uTime * 0.04));
       vec3 base = vec3(0.01, 0.07, 0.12);
       vec3 glow = vec3(0.0, 0.95, 0.7) * (scan + bars * 0.22) * uIntensity;
       gl_FragColor = vec4(base + glow, 1.0);
     }`,
  );
  gl.compileShader(frag);

  if (!gl.getShaderParameter(vtx, gl.COMPILE_STATUS) || !gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
    return () => undefined;
  }

  gl.attachShader(program, vtx);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return () => undefined;

  gl.useProgram(program);

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'uTime');
  const uIntensity = gl.getUniformLocation(program, 'uIntensity');
  const intensityMap = { low: 0.55, medium: 0.85, high: 1.1 } as const;

  let frame = 0;

  const resize = () => {
    const dpr = quality === 'high' ? Math.min(window.devicePixelRatio, 1.5) : quality === 'medium' ? 1.15 : 1;
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  let rafId = 0;
  const loop = () => {
    frame += 1;
    gl.uniform1f(uTime, frame);
    gl.uniform1f(uIntensity, intensityMap[quality]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(loop);
  };
  loop();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
  };
}
