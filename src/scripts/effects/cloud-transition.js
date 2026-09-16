// PARKED: the cloud transition.
//
// Not imported anywhere. This is the noise dissolve that used to sit between
// the world and a backdrop clip, kept because it is worth reusing and would be
// annoying to rebuild. It is the gl-transitions `displacement` idea plus a
// noise-thresholded dissolve: the noise is never drawn as a colour, it only
// displaces the two sources in opposite directions so they warp through each
// other, and it thresholds the mix so the destination arrives in cloud-shaped
// patches rather than a flat fade. A slight scale divergence rides along so it
// reads as movement rather than a crossfade.
//
// It was retired when the clips changed to line art and light on pure black,
// which carry their own entrance and exit and are composited additively. It
// suits full-frame photographic sources, where there are two dense images to
// interpenetrate. That is the case to bring it back for.
//
// To re-enable: import buildCloudTransition into world.js, build it alongside
// the blend pass, and render it with the two source textures and a progress
// value. It expects `uFrom`/`uTo` as full-frame textures, `uFromScale`/
// `uToScale` for cover fit, `uProgress` 0..1, `uAspect`, and `uDrift` (drive
// that from clock plus scrollY so the field moves with the reader).

import * as THREE from 'three';

export function buildCloudTransition() {
  const mat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uFrom: { value: null },
      uTo: { value: null },
      uFromScale: { value: new THREE.Vector2(1, 1) },
      uToScale: { value: new THREE.Vector2(1, 1) },
      uFromScrim: { value: 0 },
      uToScrim: { value: 0 },
      uProgress: { value: 0 },
      uAspect: { value: 1.7 },
      uDrift: { value: 0 },
      uScrimCol: { value: new THREE.Color('#07150f') },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uFrom, uTo;
      uniform vec2 uFromScale, uToScale;
      uniform float uFromScrim, uToScrim, uProgress, uAspect, uDrift;
      uniform vec3 uScrimCol;

      const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      vec2 hash(vec2 p){
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }
      float noise(vec2 p){
        const float K1 = 0.366025404, K2 = 0.211324865;
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
        vec3 n = h*h*h*h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
        return dot(n, vec3(70.0));
      }
      float fbm(vec2 n){
        float t = 0.0, amp = 0.5;
        for (int i = 0; i < 4; i++) { t += noise(n) * amp; n = m * n; amp *= 0.5; }
        return t;
      }

      // cover-fit sample, with the scrim that lets copy sit on a clip
      vec3 src(sampler2D t, vec2 uv, vec2 scale, float scrim, float zoom) {
        vec2 p = (uv - 0.5) * scale * zoom + 0.5;
        vec3 c = texture2D(t, clamp(p, 0.002, 0.998)).rgb;
        float d = 1.0 - vUv.y;
        float s = mix(0.34, 0.52, smoothstep(0.0, 0.45, d));
        s = mix(s, 0.44, smoothstep(0.45, 1.0, d));
        return mix(c, uScrimCol, s * scrim);
      }

      void main(){
        float pr = uProgress;
        vec2 np = vec2(vUv.x * uAspect, vUv.y) * 1.7 + uDrift;
        float n = fbm(np);
        float nn = clamp(n + 0.5, 0.0, 1.0);

        // gl-transitions displacement: both sources warp, in opposite
        // directions, weighted so each is undisturbed at its own end
        // enough warp to read as moving air, not so much that structure dissolves
        vec2 dir = vec2(0.30, 1.0) * (n * 0.085);
        vec2 uvF = vUv + dir * pr;
        vec2 uvT = vUv - dir * (1.0 - pr);

        // the motion term: outgoing pushes in, incoming settles back
        float zf = 1.0 - pr * 0.045;
        float zt = 1.0 + (1.0 - pr) * 0.045;

        vec3 cf = src(uFrom, uvF, uFromScale, uFromScrim, zf);
        vec3 ct = src(uTo, uvT, uToScale, uToScrim, zt);

        // noise-thresholded dissolve, so the destination arrives in patches
        const float e = 0.30;
        float m = smoothstep(nn - e, nn + e, pr * (1.0 + 2.0 * e) - e);
        gl_FragColor = vec4(mix(cf, ct, m), 1.0);
      }`,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return { scene, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), mat };
}
