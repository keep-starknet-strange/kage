import { useTheme } from '@/providers/ThemeProvider';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

const PARTICLE_COUNT = 50;

export const SimpleParticleBackground = () => {
  const { colors } = useTheme();
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const colorRef = useRef<string>('#ff6b1a');

  // Parse hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 0.42, 0.1]; // fallback to orange
  };

  const initParticles = (width: number, height: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 6 + 3,
      life: Math.random(),
    }));
  };

  const updateParticles = (width: number, height: number, deltaTime: number) => {
    particlesRef.current.forEach((particle) => {
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Wrap around screen edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      // Pulse effect
      particle.life += deltaTime * 0.001;
      if (particle.life > Math.PI * 2) particle.life = 0;
    });
  };

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;
    colorRef.current = colors['brand.accent'];

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute float a_alpha;
      
      uniform vec2 u_resolution;
      
      varying float v_alpha;
      
      void main() {
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_alpha = a_alpha;
      }
    `;

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform vec3 u_color;
      varying float v_alpha;
      
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }
        
        float alpha = (1.0 - dist * 2.0) * v_alpha * 0.6;
        gl_FragColor = vec4(u_color, alpha);
      }
    `;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    programRef.current = program;

    // Create buffer
    bufferRef.current = gl.createBuffer();

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Initialize particles
    initParticles(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Start animation
    let lastTime = Date.now();
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      render(gl, deltaTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const render = (gl: ExpoWebGLRenderingContext, deltaTime: number) => {
    const program = programRef.current;
    if (!program) return;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    // Update particles
    updateParticles(width, height, deltaTime);

    // Clear canvas
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Prepare data
    const positions: number[] = [];
    const sizes: number[] = [];
    const alphas: number[] = [];

    particlesRef.current.forEach((particle) => {
      positions.push(particle.x, particle.y);
      sizes.push(particle.size * 3);
      alphas.push(0.3 + Math.sin(particle.life) * 0.3);
    });

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const sizeLocation = gl.getAttribLocation(program, 'a_size');
    const alphaLocation = gl.getAttribLocation(program, 'a_alpha');

    // Position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Size attribute
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(sizeLocation);
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

    // Alpha attribute
    const alphaBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(alphaLocation);
    gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

    // Set uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);

    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const [r, g, b] = hexToRgb(colorRef.current);
    gl.uniform3f(colorLocation, r, g, b);

    // Draw
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);

    // Flush
    gl.flush();
    gl.endFrameEXP();
  };

  useEffect(() => {
    colorRef.current = colors['brand.accent'];
  }, [colors]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <GLView
      style={styles.container}
      onContextCreate={onContextCreate}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

