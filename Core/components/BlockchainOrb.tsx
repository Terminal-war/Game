import { useEffect, useRef } from 'react';

type Props = {
  quality: 'low' | 'medium' | 'high';
};

export function BlockchainOrb({ quality }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vtx = gl.createShader(gl.VERTEX_SHADER);
    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vtx || !frag || !program) return;

    gl.shaderSource(
      vtx,
      `attribute vec2 aPos;
       varying vec2 vUv;
       void main(){
         vUv = aPos * 0.5 + 0.5;
         gl_Position = vec4(aPos, 0.0, 1.0);
       }`,
    );

    gl.shaderSource(
      frag,
      `precision mediump float;
       varying vec2 vUv;
       uniform float uTime;
       uniform float uQuality;
       void main(){
         vec2 p = vUv * 2.0 - 1.0;
         float r = length(p);
         float ring = smoothstep(0.64, 0.63, abs(r - 0.55));
         float wave = sin((p.x * 8.0 + uTime * 0.02) * (2.0 + uQuality));
         float wire = smoothstep(0.0, 0.015, abs(fract((p.x + p.y + uTime * 0.001) * 10.0) - 0.5));
         float glow = max(0.0, 0.9 - r) * 0.25;
         vec3 base = vec3(0.01, 0.05, 0.10);
         vec3 neon = vec3(0.1, 1.0, 0.82) * (ring + glow + wave * 0.03 + (1.0 - wire) * 0.06);
         gl_FragColor = vec4(base + neon, 1.0);
       }`,
    );

    gl.compileShader(vtx);
    gl.compileShader(frag);
    if (!gl.getShaderParameter(vtx, gl.COMPILE_STATUS) || !gl.getShaderParameter(frag, gl.COMPILE_STATUS)) return;

    gl.attachShader(program, vtx);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const qualityMap = { low: 0.6, medium: 1, high: 1.5 } as const;
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uQuality = gl.getUniformLocation(program, 'uQuality');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const resize = () => {
      const dpr = quality === 'high' ? Math.min(window.devicePixelRatio, 1.5) : quality === 'medium' ? 1.1 : 1;
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      gl.uniform1f(uTime, frame);
      gl.uniform1f(uQuality, qualityMap[quality]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [quality]);

  return <canvas aria-hidden className="blockchain-orb" ref={canvasRef} />;
}
