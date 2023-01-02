#pragma glslify: cnoise3 = require(glsl-noise/classic/3d.glsl) 
uniform float time;
uniform vec3 colorStart;
uniform vec3 colorEnd;
uniform sampler2D waveformTexture;
varying vec2 vUv;

void main() {
vec2 displacedUv = vUv + cnoise3(vec3(vUv * 1.0, time * 0.05));
float strength = cnoise3(vec3(displacedUv * 10.0, time * 0.2));
float outerGlow = distance(vUv, vec2(0.5)) * 2.0 - 0.5;
strength += outerGlow;
strength += step(-0.2, strength) * 0.6;
strength = clamp(strength, 0.0, 1.0);
vec3 color = mix(colorStart, colorEnd, strength);
// sample waveform texture
vec4 waveformColor = texture2D(waveformTexture, vUv);
//gl_FragColor = vec4(color, 1.0);
gl_FragColor = vec4(waveformColor.rrr, 1.0) ;

#include <tonemapping_fragment>
#include <encodings_fragment>