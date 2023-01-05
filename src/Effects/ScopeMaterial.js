import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'

// This shader is from Bruno Simons Threejs-Journey: https://threejs-journey.xyz
const ScopeMaterial = shaderMaterial(
  {
    time: 0,
    iTime: 0,
    iWaveformRms: new THREE.Vector4(0, 0, 0, 0),
    iWaveformRmsAccum: new THREE.Vector4(0, 0, 0,0),
    iAmplitude: 1,
    iWaveformTexture0: { value: null },
  },
  glsl`
      varying vec2 vUv;
      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;
        gl_Position = projectionPosition;
        vUv = uv;
      }`,
  glsl`


  uniform float iTime;
uniform vec4 iWaveformRms;
uniform vec4 iWaveformRmsAccum;
uniform float iAmplitude;
varying vec2 vUv;

//
//

//
// Custom audio input uniforms
uniform sampler2D iWaveformTexture0;

//
//
float squared(float value) { return value * value; }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uvOriginal = vUv;
	vec2 waveform = -texture2D( iWaveformTexture0, vec2(uvOriginal.x,0)).rg;	
	waveform *= iAmplitude; // scale down
	float waveform0 = waveform.r;
	float waveform1 = waveform.g;
    vec3 color = vec3(0.0); 
    float pinch = 1.0;
	float scopeline0 = uvOriginal.y + waveform0 - .6;
	scopeline0 = abs(scopeline0);
	color.r = 1.0 * pow(smoothstep(0.015,.001, scopeline0),4.);
	color.g = .7 * pow(smoothstep(0.03,.001, scopeline0),4.);
	color.b = 0.5 * pow(smoothstep(0.08,.001, scopeline0),4.);

	float scopeline1 = uvOriginal.y + waveform1- .4;
	scopeline1 = abs(scopeline1);
	color.r += 1.1 * pow(smoothstep(0.035,.001, scopeline1),4.);
	color.g += 0.8 * pow(smoothstep(0.02,.001, scopeline1),4.);
	color.b += 0.5 * pow(smoothstep(0.08,.001, scopeline1),4.);
	
	fragColor = vec4(color, 1.0);  

  #include <tonemapping_fragment>
  #include <encodings_fragment>

}

//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`
)

extend({ ScopeMaterial: ScopeMaterial })

export { ScopeMaterial as ScopeMaterial }
