export const coreVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  varying float vNoise;

  uniform float uTime;
  uniform float uDisplace;
  uniform vec2 uPointer;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    vec3 pos = position;
    float n = noise(pos * 1.7 + uTime * 0.22);
    n += 0.5 * noise(pos * 3.4 - uTime * 0.18);
    float pull = length(uPointer) * 0.08;
    pos += normal * ((n - 0.45) * uDisplace + pull * 0.04);
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec4 view = viewMatrix * world;
    vWorld = world.xyz;
    vView = -view.xyz;
    vNormal = normalize(normalMatrix * normal);
    vNoise = n;
    gl_Position = projectionMatrix * view;
  }
`;

export const coreFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorld;
  varying float vNoise;

  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform vec3 uHot;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.1);
    float pulse = 0.5 + 0.5 * sin(uTime * 1.1 + vNoise * 6.0);
    vec3 inner = mix(uColor * 0.35, uRim * 0.22, vNoise * 0.4);
    vec3 col = inner + uRim * fres * (0.75 + pulse * 0.18);
    col += uHot * pow(max(vNoise - 0.55, 0.0), 3.0) * 0.18;
    float alpha = 0.88 + fres * 0.08;
    gl_FragColor = vec4(col, alpha);
  }
`;

export const pointsVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aMorph;
  varying float vSeed;
  varying float vDepth;
  uniform float uTime;
  uniform float uMorph;
  uniform float uPixelRatio;
  uniform vec2 uPointer;

  void main() {
    vec3 pos = mix(position, aMorph, uMorph);
    pos.x += sin(uTime * 0.6 + aSeed * 12.0) * 0.035;
    pos.y += cos(uTime * 0.45 + aSeed * 9.0) * 0.03;
    pos += vec3(uPointer.x, uPointer.y, 0.0) * 0.12 * (0.4 + aSeed);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vSeed = aSeed;
    vDepth = -mv.z;
    gl_PointSize = aSize * uPixelRatio * (110.0 / max(vDepth, 1.2));
    gl_Position = projectionMatrix * mv;
  }
`;

export const pointsFragment = /* glsl */ `
  varying float vSeed;
  varying float vDepth;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uTime;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.12, d);
    float twinkle = 0.45 + 0.25 * sin(uTime * 1.6 + vSeed * 40.0);
    vec3 col = mix(uColor, uHot, vSeed * 0.35);
    float fade = smoothstep(16.0, 4.0, vDepth);
    gl_FragColor = vec4(col, glow * twinkle * fade * 0.42);
  }
`;
