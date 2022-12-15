//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec4 iWaveformRms;
uniform vec4 iWaveformRmsAccum;
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

float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
	vec2 uvOriginal = fragCoord.xy / iResolution.xy;
    vec2 uvCentered = -1.0 + 2.0 * uvOriginal;
	// pinch the uv's a bit to make up for the HD aspect ratio (yes, hack)
	uvCentered.x *= (16.0/9.0);
	float r = length(uvOriginal);
	float theta = atan(uvCentered.y, uvCentered.x);

	// grab waveform
	// make uvs that tile twice around the circle
	theta += iWaveformRmsAccum.g;
	theta = mod(theta, 3.14159*2.0);
	float thetaUV = (theta +  3.14159) / (1.0 * 3.14159);
	thetaUV = mod(thetaUV, 1.0);
//	thetaUV *= 2.0;
	//if (thetaUV > 1.0) thetaUV = 1.0 - thetaUV;
    vec2 waveform = -texture2D( iWaveformTexture0, vec2(thetaUV,0)).rg;	
	float waveform0 = waveform.r;
	float waveform1 = waveform.g;
    vec3 color = vec3(0.0); 
    
	//float pinch = 1.0;
	//float pinch = 2. - abs(uvOriginal.x - .5)*4.;
	
	// TODO: Instead of pinching at boundaries, mirror
	float pinch = pow(sin(thetaUV * 3.14159),.3);
	//pinch = 1.0;
	
	
	float ring = sdCircle(uvCentered, .5 + pinch * waveform0 * 2.0);
	ring = abs( sin(ring*2.0 - iWaveformRmsAccum.r*1.0));
	ring = pow(ring, 1.2);
	//ring = smoothstep(.0,.01,ring);
	color.r = 1.0 * pow(smoothstep(0.15*pinch,.001*pinch, ring),4.);
	color.g = .7 * pow(smoothstep(0.3*pinch,.001*pinch, ring),4.);
	color.b = 0.5 * pow(smoothstep(0.8*pinch,.001*pinch, ring),4.);

	float ring2 = sdCircle(uvCentered, .6 + pinch * waveform1 * 2.0);
	//ring2 = abs(ring2);
	ring2 = abs( sin(ring2*2.0 - abs(iWaveformRmsAccum.g)*2.0));
	ring2 = pow(ring2, 1.2);

	//ring = smoothstep(.0,.01,ring);
	color.r += 1.0 * pow(smoothstep(0.25*pinch,.001*pinch, ring2),4.);
	color.g += .7 * pow(smoothstep(0.1*pinch,.001*pinch, ring2),4.);
	color.b += 0.2 * pow(smoothstep(0.8*pinch,.001*pinch, ring2),4.); 

	float ring3 = sdCircle(uvCentered, .0 + waveform1 * .5);
	//ring = smoothstep(.0,.01,ring);
	color.r += .0 * pow(smoothstep(0.1,.001, ring3),1.);
	color.g += 0.0 * pow(smoothstep(0.1,.001, ring3),1.);
	color.b += .5 * pow(smoothstep(1.6,.001, ring3),1.);
	
	fragColor = vec4(color, 1.0);  
}

//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
