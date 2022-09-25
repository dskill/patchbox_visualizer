//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
//
//

//
// Custom audio input uniforms
uniform vec3 iAudioInput;
uniform vec3 iAudioInputAccumulated;
uniform vec3 iFaders;
uniform sampler2D iWaveformTexture0;
uniform sampler2D iWaveformTexture1;
uniform sampler2D iFFTTexture0;
uniform sampler2D iFFTTexture1;

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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uvTrue = fragCoord.xy / iResolution.xy;
    vec2 uv = -1.0 + 2.0 * uvTrue;
	vec2 waveformUV = uv.yy;
	vec2 fftUV = uv.yy;
	
	// grab waveform
    float leftwaveform = texture2D( iWaveformTexture0, uvTrue).r;	
	float rightwaveform = texture2D( iWaveformTexture1, uvTrue).r;	
	float leftfft = texture2D( iFFTTexture0, uvTrue).r;	
	float rightfft = texture2D( iFFTTexture1, uvTrue).r;	

	fftUV.xy += -.5-.006*vec2(leftfft, rightfft);
	waveformUV.xy += vec2(leftwaveform, rightwaveform) * 2.0;
    vec3 color = vec3(0.0); 
     
	float pinch = 1. - abs(uvTrue.x - .5)*2.;
	pinch = pow(pinch,1.);
    color.r = 1.0 *pow(smoothstep(0.1*pinch,.001*pinch, abs(waveformUV.x)),4.);
	color.g = 1.0 * pow(smoothstep(0.004*pinch,.001*pinch, abs(waveformUV.x - .005)),4.);
	color.b = 1.0 * smoothstep(0.02*pinch,.001*pinch, abs(waveformUV.x + .005));

	
	fragColor = vec4(color, 1.0);  
}

//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}