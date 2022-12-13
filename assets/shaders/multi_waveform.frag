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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uvTrue = fragCoord.xy / iResolution.xy;
    vec2 uv = -1.0 + 2.0 * uvTrue;

	// grab waveform
    vec2 waveform = -texture2D( iWaveformTexture0, 1.0 - uvTrue).rg;	
//vec2 waveform = vec2(sin(iTime), sin(iTime*2.0));
	float waveform0 = waveform.r;
	float waveform1 = waveform.g;
//	fragColor = vec4(waveform.x,waveform.y,0,1);	
//	return;	
    vec3 color = vec3(0.0); 
     
	//float pinch = 1.0;
	//float pinch = 2. - abs(uvTrue.x - .5)*4.;
	float pinch = 1.0 * 2.0/sin(uvTrue.x * 3.14159);

	//pinch = pow(pinch, .3);
	//waveform0 *= pinch;
	//waveform1 *= pinch;
	float waveformUV = uv.y + waveform0 * 1.0 - .25 * pinch + 0.5;
    color.r = 1.0 * pow(smoothstep(0.05*pinch,.001*pinch, abs(waveformUV)),4.);
	color.g = .7 * pow(smoothstep(0.2*pinch,.001*pinch, abs(waveformUV - .005)),4.);
	color.b = 0.5 * pow(smoothstep(0.6*pinch,.001*pinch, abs(waveformUV + .005)),4.);


	waveformUV = uv.y + waveform1 * 1.0 + .25 * pinch - 0.5;
    color.r += 1.2 * pow(smoothstep(0.45*pinch,.001*pinch, abs(waveformUV)),4.);
	color.g += .8 * pow(smoothstep(0.2*pinch,.001*pinch, abs(waveformUV - .005)),4.);
	color.b += 0.4 * pow(smoothstep(0.6*pinch,.001*pinch, abs(waveformUV + .005)),4.); 

	fragColor = vec4(color, 1.0);  
}

//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
