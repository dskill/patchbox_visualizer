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
//uniform vec4 iMeter;
//uniform vec4 iMeterAccumulated;
vec2 iMeter = vec2(0.0,0.0);
vec2 iMeterAccumulated = vec2(0.0,0.0);
float iTweakValue0 = 0.2;
float iTweakValue1 = 0.5;
float iTweakValue2 = 0.1;



// DO NOT DELETE ABOVE
//
//
//
// FROM SHADERTOY. USE FOR EXPLORATION ONLY
// https://www.shadertoy.com/view/lsXcz8
// Created by Pheema - 2017
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define M_PI (3.14159265358979)
#define GRAVITY (9.80665)
#define EPS (1e-3)
#define WAVENUM (2)

const float kSensorWidth = 36e-3;
const float kFocalLength = 18e-3;

const vec2 kWind = vec2(0.0, 1.0);
const float kCloudHeight = 100.0;
const float kOceanScale = 2.0;

const float kCameraSpeed = 10.0;
const float kCameraHeight = 1.0;
const float kCameraShakeAmp = 0.002;
const float kCameraRollNoiseAmp = 0.2;

struct Ray
{
	vec3 o;
    vec3 dir;
};

struct HitInfo
{
	vec3 pos;
    vec3 normal;
    float dist;
    Ray ray;
};

float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float rand(vec3 n)
{
    return fract(sin(dot(n, vec3(12.9898, 4.1414, 5.87924))) * 43758.5453);
}

float Noise2D(vec2 p)
{
    vec2 e = vec2(0.0, 1.0);
    vec2 mn = floor(p);
    vec2 xy = fract(p);
    
    float val = mix(
        mix(rand(mn + e.xx), rand(mn + e.yx), xy.x),
        mix(rand(mn + e.xy), rand(mn + e.yy), xy.x),
        xy.y
    );  
    
    val = val * val * (3.0 - 2.0 * val);
    return val;
}

float Noise3D(vec3 p)
{
    vec2 e = vec2(0.0, 1.0);
    vec3 i = floor(p);
    vec3 f = fract(p);
    
    float x0 = mix(rand(i + e.xxx), rand(i + e.yxx), f.x);
    float x1 = mix(rand(i + e.xyx), rand(i + e.yyx), f.x);
    float x2 = mix(rand(i + e.xxy), rand(i + e.yxy), f.x);
    float x3 = mix(rand(i + e.xyy), rand(i + e.yyy), f.x);
    
    float y0 = mix(x0, x1, f.y);
    float y1 = mix(x2, x3, f.y);
    
    float val = mix(y0, y1, f.z);
    
    val = val * val * (3.0 - 2.0 * val);
    return val;
}

float SmoothNoise(vec3 p)
{
    float amp = 1.0;
    float freq = 1.0;
    float val = 0.0;
    
    for (int i = 0; i < 4; i++)
    {   
        amp *= 0.5;
        val += amp * Noise3D(freq * p - float(i) * 11.7179);
        freq *= 2.0;
    }
    
    return val;
}

float Pow5(float x)
{
    return (x * x) * (x * x) * x;
}

// Schlick approx
// Ref: https://en.wikipedia.org/wiki/Schlick's_approximation
float FTerm(float LDotH, float f0)
{
    return f0 + (1.0 - f0) * Pow5(1.0 - LDotH);
}

float OceanHeight(vec2 p)
{    
    float height = 0.0;
    vec2 grad = vec2(0.0, 0.0);
    float t = iTime;

    float windNorm = length(kWind);
    float windDir = atan(kWind.y, kWind.x);


    //vec2 oneDimUVs = vec2(length(p) * .1, 1.0 - iInputWaveformActiveRow / iInputWaveformTotalRows);
    //float waveform = iVizHeight * texture2D(texture1, oneDimUVs).x;
    //height = .1 * waveform; //sin(p.y ) * .1;
    float fade = max(1. - length(p) / 10000.0,0.);
    height = .025 * sin( length(p) * 2.0 + iMeterAccumulated.x);
/*
    for (int i = 1; i < WAVENUM; i++)
    {   
        float rndPhi = windDir + asin(2.0 * rand(vec2(0.141 * float(i), 0.1981)) - 1.0);
        float kNorm = 2.0 * M_PI * float(i) / kOceanScale;
        vec2 kDir = vec2(cos(rndPhi), sin(rndPhi)); 
        vec2 k = kNorm * kDir;
        float l = (windNorm * windNorm) / GRAVITY;
        float amp = exp(-0.5 / (kNorm * kNorm * l * l)) / (kNorm * kNorm);
        float omega = sqrt(GRAVITY * kNorm + 0.01 * sin(p.x));
        float phase = 2.0 * M_PI * rand(vec2(0.6814 * float(i), 0.7315));

        vec2 p2 = p;
        p2 -= amp * k * cos(dot(k, p2) - omega * t + phase);
        height += amp * sin(dot(k, p2) - omega * t + phase);
    }
    */
    return height;
}

vec3 OceanNormal(vec2 p, vec3 camPos)
{
    vec2 e = vec2(0, 1.0 * EPS);
    float l = 20.0 * distance(vec3(p.x, 0.0, p.y), camPos);
    e.y *= l;
    
    float hx = OceanHeight(p + e.yx) - OceanHeight(p - e.yx);
    float hz = OceanHeight(p + e.xy) - OceanHeight(p - e.xy);
    return normalize(vec3(-hx, 2.0 * e.y, -hz));
}

HitInfo IntersectOcean(Ray ray) {
    HitInfo hit;
    vec3 rayPos = ray.o;
    float dl = rayPos.y / abs(ray.dir.y);
    rayPos += ray.dir * dl;
    hit.pos = rayPos;
    hit.normal = OceanNormal(rayPos.xz, ray.o);
    hit.dist = length(rayPos - ray.o);
    return hit;
}

float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}


// Environment map
vec3 BGColor(vec3 dir, vec3 sunDir, float waveform) {
    vec3 color = vec3(0);
    
    //vec2 oneDimUVs = vec2(dir.y * 10.0, 1.0 - iInputWaveformActiveRow / iInputWaveformTotalRows);
    //float waveform1 = iVizHeight * texture2D(texture1, oneDimUVs).x;
    sunDir.x += .1 * waveform;
    color += mix(
        vec3(0.094, 0.2266, 0.3711),
        vec3(0.988, 0.6953, 0.3805),
       	clamp(dot(sunDir, dir) , 0.0, 1.0) * smoothstep(-0.4, 0.3, sunDir.y + .2 * iMeter.x)
    );
    
    dir.x += 0.01 * sin(312.47 * dir.y + iTime) * exp(-40.0 * dir.y);
    dir = normalize(dir);
    float sun_distance = dot(sunDir, dir);
    float line_distance = 1.0 - abs(dir.x - sunDir.x);
    //sun_distance =sun_distance - .005 + iMeter.x * .1;
    color += .7 * smoothstep(.995 - .01 * iTweakValue1, 1.0, sun_distance); 
    color += .7 * smoothstep(0.98, 1.02, line_distance); 

	return color;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = ( gl_FragCoord.xy / iResolution.xy ) * 2.0 - 1.0;
	float aspect = iResolution.y / iResolution.x;
    
    // Camera settings
	vec3 camPos = vec3(0, kCameraHeight, -kCameraSpeed * iMeterAccumulated.x);
    vec3 camDir = vec3(kCameraShakeAmp * (rand(vec2(iTime, 0.0)) - 0.5), kCameraShakeAmp * (rand(vec2(iTime, 0.1)) - 0.5), -1);
    //camDir.x = -iCenterTouchPos.x;
    //camDir.y = -iCenterTouchPos.y;
    vec3 up = vec3(.1 * iTweakValue2 * sin(iMeterAccumulated.x + iTime), 1.0, 0.0); // +  kCameraRollNoiseAmp * (SmoothNoise(vec3(0.2 * iTime, 0.0, 0.0)) - 0.5), 1.0, 0.0);
    
	vec3 camForward = normalize(camDir);
	vec3 camRight = cross(camForward, up);
	vec3 camUp = cross(camRight, camForward);
	
    // Ray
    Ray ray;
    ray.o = camPos;
    ray.dir = normalize(
        kFocalLength * camForward + 
        kSensorWidth * 0.5 * uv.x * camRight + 
        kSensorWidth * 0.5 * aspect * uv.y * camUp
    );
	
    // Controll the height of the sun
    vec2 centerTouchPos = vec2(.5,.5);
    vec3 sunDir = normalize(vec3(centerTouchPos.x, -.2 + iTweakValue0 * .3 + 0.3 * centerTouchPos.y + iMeter.x * 1.0, -1));

    vec3 color = vec3(0);
	HitInfo hit;
    float l = 0.0;
    
    //vec2 oneDimUVs = vec2(ray.dir.y * 2.0 + 10.0, 1.0 - iInputWaveformActiveRow / iInputWaveformTotalRows);
	vec2 oneDimUVs = vec2(ray.dir.y * 2.0 + 10.0, 1.0);
    float waveform = texture2D(iWaveformTexture0, oneDimUVs).x;
    //ray.dir.z += waveform * 1.1;

    if (ray.dir.y < 0.0) 
    {
        // Render an ocean
        HitInfo hit = IntersectOcean(ray);
        
        vec3 oceanColor = vec3(0.0, 0.2648, 0.4421) * dot(-ray.dir, vec3(0, 1, 0));
        vec3 refDir = reflect(ray.dir, hit.normal);
        refDir.y = abs(refDir.y);
        l = -camPos.y / ray.dir.y;
        color = oceanColor + BGColor(refDir, sunDir, waveform) * FTerm(dot(refDir, hit.normal), 0.5);
    } 
    else 
    {
        // Render clouds
        vec3 bgColor = BGColor(ray.dir, sunDir, waveform);
        color += bgColor;
        
    }
    
    // Fog
    color = mix(color, BGColor(ray.dir, sunDir, waveform), 1.0 - exp(-0.0001 * l));
    
    // Color grading
    color = smoothstep(0.3, 0.8, color);
	fragColor = vec4(color, 1.0);
}

//
// DON'T DELETE!
// This is part of the glue to get shadertoy shaders working.
//
void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }