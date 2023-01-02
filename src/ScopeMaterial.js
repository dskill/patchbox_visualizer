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
    iEffectParams0: new THREE.Vector4(0, 0, 0, 0),
    iEffectParams1: new THREE.Vector4(0, 0, 0, 0),
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
uniform vec4 iEffectParams0;
uniform vec4 iEffectParams1;
varying vec2 vUv;

//
//

//
// Custom audio input uniforms
uniform sampler2D iWaveformTexture0;

//
//
float squared(float value) { return value * value; }
		
// Smooth HSV to RGB conversion 
vec3 hsv2rgb_smooth( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
	rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	
	return c.z * mix( vec3(1.0), rgb, c.y);
}

// FROM https://iquilezles.org/articles/distfunctions2d/
float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }

float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

float sdRhombus( in vec2 p, in vec2 b ) 
{
    p = abs(p);
    float h = clamp( ndot(b-2.0*p,b)/dot(b,b), -1.0, 1.0 );
    float d = length( p-0.5*b*vec2(1.0-h,1.0+h) );
    return d * sign( p.x*b.y + p.y*b.x - b.x*b.y );
}

float sdEquilateralTriangle( in vec2 p )
{
    const float k = sqrt(3.0);
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    return -length(p)*sign(p.y);
}

float sdEffectBlend( in vec2 p, float radius, float waveform) {
	waveform *= 1.0; // scale down amplituce
	float d = 0.0;
	d = p.y + waveform;
	
	d = mix(d, sdCircle(p, radius + waveform), iEffectParams0.x); // reverb
	d = mix(d, sdEquilateralTriangle(p + abs(waveform)), iEffectParams0.y); // distortion
	d = mix(d, sdRhombus(p, vec2(radius + waveform, radius + waveform)), iEffectParams0.w); 
	d = mix(d, sin(d*3.0), iEffectParams0.z); // delay
	
	return d;
} 

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uvOriginal = vUv;
	vec2 waveform = -texture2D( iWaveformTexture0, vec2(uvOriginal.x,0)).rg;	
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
	color.r += 0.8 * pow(smoothstep(0.015,.001, scopeline1),4.);
	color.g += 0.9 * pow(smoothstep(0.05,.001, scopeline1),4.);
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
