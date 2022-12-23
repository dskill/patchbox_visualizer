const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const createQuad = require('primitive-quad');
const math = require('canvas-sketch-util/math');
const glslify = require('glslify');
const path = require('path');
const Tone = require('tone');
const createTouchListener = require('touches');
const { Console, debug } = require('console');
const OSC = require('osc-js');
const { GUI } = require("dat.gui");

let ip = window.location.hostname;
let show_gui = false;
let socket;
let interval;

// this should be const? not sure how to define it globally as a const tho
let osc, gui;
let osc_connected = false;
let touchx = 0.0;
let touchy = 0.0;

const waveformResolution = 64; 
let waveformRms = [0,0,0,0];
let waveformRmsAccum = [0.0,0.0,0.0,0.0];
let effectParams0 = [0,0,0,0];
let effectParams1 = [0,0,0,0];
let waveformTexture0 = {};
let waveformArray0 = [];
let waveformArray1 = [];
// rename this now that i'm using it for history 
let waveformArray = new Float32Array(waveformResolution * 4);

// PARAMS
let params = {
  "reverbMix": 0.5,
  "distortionPreGain": 1.0,
  "delayMix": 0.1,
  "delayTime": 0.1,
  "delayFeedback": 5.0,
};

let distortionPreset = {
  "reverbMix": 0.2,
  "distortionPreGain": 40.0,
  "delayMix": 0.02,
  "delayTime": 0.1,
  "delayFeedback": 1.0,
}

let heavyDistortionPreset = {
  "reverbMix": 0.3,
  "distortionPreGain": 200.0,
  "delayMix": 0.8,
  "delayTime": 0.1,
  "delayFeedback": 3.0,
}

let cleanPreset = {
  "reverbMix": 0.3,
  "distortionPreGain": 1.0,
  "delayMix": 0.02,
  "delayTime": 0.1,
  "delayFeedback": 1.0,
}

let delayPreset = {
  "reverbMix": 0.3,
  "distortionPreGain": 1.0,
  "delayMix": 1.0,
  "delayTime": 0.3,
  "delayFeedback": 6.0,
}

let heavyDelayPreset = {
  "reverbMix": 0.3,
  "distortionPreGain": 1.0,
  "delayMix": 1.0,
  "delayTime": 0.1,
  "delayFeedback": 8.0,
}

let reverbPreset = {
  "reverbMix": 1.0,
  "distortionPreGain": 1.0,
  "delayMix": 0.02,
  "delayTime": 0.1,
  "delayFeedback": 1.0,
}




function blendParams(param1, param2, blend)
{  
  for (const key in params) {
    // hard code some smoothness
    if (key == "delayTime" || key == "delayFeedback") {
      let newValue = math.lerp(param1[key], param2[key], blend);
      params[key] = math.lerp(params[key], newValue, 0.01);
    } else {
      params[key] = math.lerp(param1[key], param2[key], blend);
    }
  }
}

function onParamChanged(name) {
  if (osc_connected ) {
    osc.send(new OSC.Message('/' + name, params[name]));
    //console.log("sending osc message: " + name + " " + params[name]);
  }
}

// start an OSC connection to the node server running osc-js.  
// this server will pass messages between any browsers running this page, and supercollider
function initOSC() {

  const options = {
    host: ip,    // @param {string} Hostname of WebSocket server
    port: 8080           // @param {number} Port of WebSocket server
  }
  osc = new OSC({ plugin: new OSC.WebsocketClientPlugin(options) })
  
  osc.on('*', message =>
  {
    let args = message.args;
  
    if (message.address == "/waveform0")
    {
      waveformArray0 = args;
    } else if (message.address == "/waveform1")
    {
      waveformArray1 = args;
    } else {
      console.log("non waveform message:", message.address, message.args); //"message length: " + args.length);
    }
  })
  
  osc.on('/{foo,bar}/*/param', message =>
  {
    console.log(message.args)
  })
  
  osc.on('open', () =>
  {
    //const message = new OSC.Message('/test', 12.221, 'hello')
    //osc.send(message)
    osc_connected = true;
      // initialize osc values
    for (const key in params) {
        osc.send(new OSC.Message('/' + key, params[key]) );
      }
  })
  
  osc.open( )
}

function initShaderGlobals(regl)
{
  // From a flat array
  waveformTexture0 = regl.texture({
    shape: [waveformResolution, 1],
    format: 'rgba',
    type: 'float32'
  });
}

function initGUI()
{
  gui = new GUI();
  let ip_label = { ip: ip };
  
  gui.add(params, "reverbMix", 0, 1).onChange(function(value) {
    onParamChanged('reverbMix');
  }).listen();
  gui.add(params, "distortionPreGain", 1, 30).onChange(function(value) {
    onParamChanged('distortionPreGain');
  }).listen();
  gui.add(params, "delayMix", 0, 1).onChange(function(value) {
    onParamChanged('delayMix');
  }).listen();
  gui.add(params, "delayTime", 0, 1).onChange(function(value) {
    onParamChanged('delayTime');
  }).listen();
  gui.add(params, "delayFeedback", 0, 10).onChange(function(value) {
    onParamChanged('delayFeedback');
  }).listen();
  gui.add(ip_label, 'ip').listen();

  // populate the ip label
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  show_gui = urlParams.has('gui');
  if (show_gui) { 
    gui.show();
    gui.close();
  } else {
    gui.hide(); 
  }
}

function updateWaveformTexture()
{
    // make an array that concatenates the waveform with itself
    // so that we can draw a line between the two
    waveformRms = [0,0,0,0];

    // if waveformRmsAccum contains a NaN, set to 0
    // this is from NaN RMS values at startup
    if (isNaN(waveformRmsAccum[0])) {
      waveformRmsAccum = [0,0,0,0];
    } else if (isNaN(waveformRmsAccum[1])) {
      waveformRmsAccum = [0,0,0,0];
    }
    
    for (let i = 0; i < waveformResolution; i++)
    {

      // for FFT waveformArray[i * 4 + 1] = math.lerp(waveformArray[i * 4 + 1], Math.abs(waveformArray1[i]) * .02, 0.3);
      waveformArray[i * 4] = waveformArray0[i];
      waveformArray[i * 4 + 1] = waveformArray1[i];
      waveformArray[i * 4 + 2] = waveformArray1[i];
      waveformArray[i * 4 + 3] = waveformArray1[i];

      //RMS
      waveformRms[0] += waveformArray[i * 4]  * waveformArray[i * 4];
      waveformRms[1] += waveformArray[i * 4 + 1]  * waveformArray[i * 4 + 1];
      waveformRms[2] += waveformArray[i * 4 + 2]  * waveformArray[i * 4 + 2];
      waveformRms[3] += waveformArray[i * 4 + 3]  * waveformArray[i * 4 + 3];
   }
    waveformRms[0] =  Math.sqrt(waveformRms[0]/waveformResolution);
    waveformRms[1] =  Math.sqrt(waveformRms[1]/waveformResolution);
    waveformRms[2] =  Math.sqrt(waveformRms[2]/waveformResolution);
    waveformRms[3] =  Math.sqrt(waveformRms[3]/waveformResolution);

    waveformRmsAccum[0] += waveformRms[0] ;
    waveformRmsAccum[1] += waveformRms[1] ;
    waveformRmsAccum[2] += waveformRms[2] ;
    waveformRmsAccum[3] += waveformRms[3] ;

    // this is probably real slow. I wonder if there's a better way?
    waveformTexture0({
      shape: [waveformResolution, 1],
      format: 'rgba',
      type: 'float32',
      data: waveformArray
    });
}

// Setup our sketch
const settings = {
  animate: true,
  scaleToView: true,
  context: 'webgl',
  //fps: 60,
  canvas: document.querySelector('.background-canvas')
};

// web sockets currently unused
function startConnection()
{
  socket = new WebSocket(serverURL);
  socket.binaryType = 'arraybuffer';

  // Connection opened
  socket.addEventListener('open', function (event)
  {
    socket.send('Hello Server from canvas sketch!');
  });

  // Listen for messages
  socket.addEventListener('message', function (event)
  {

    // check if the data is of type bytes
    if (event.data instanceof ArrayBuffer)
    {
      // convert the data to a float32 array
      let float32Array = new Float32Array(event.data);
      waveformArray0 = float32Array;
    }

  });
}

function onTouchMove(ev, clientPosition)
{
  // normalize the position
  let x = clientPosition[0] / window.innerWidth;
  let y = clientPosition[1] / window.innerHeight;
  touchx = x;
  touchy = y;
}

function updateInput() {
  let x = touchx;
  let y = touchy;
  x -= .5;
  y -= .5;

  // TODO ADD HEAVY DISTORTION UP
  
  // turn the x,y coordinate into polar coordinates
  let r = Math.sqrt(x*x + y*y);

  // as we go out from center, crank distortion
  blendParams(cleanPreset, distortionPreset, math.smoothstep(0,.3, -y));

  // blow out distortion at outer edges
  let upperEdge = math.smoothstep(0.3, 0.5, -y);
  blendParams(params, heavyDistortionPreset, upperEdge);
 
  // delay is up top
  // calculate the dot product of (x,y) and the up vector
  let down = y;
  down = math.smoothstep(0.0, 0.5, down);
  blendParams(params, delayPreset, down);

  let right = x;
  right = math.smoothstep(0.0, .5, right);
  blendParams(params, heavyDelayPreset, right);

  let left = -x;
  left = math.smoothstep(0.0, .5, left);
  blendParams(params, reverbPreset, left);

  // get some clean in the center
  let center = math.smoothstep(0.1, 0.0, r);
  blendParams(params, cleanPreset, center);

  onParamChanged('reverbMix');
  onParamChanged('distortionPreGain');
  onParamChanged('delayMix');
  onParamChanged('delayTime');
  onParamChanged('delayFeedback');

  // update visual params
  effectParams0[0] = math.smoothstep(0,1.0,params.reverbMix);
  effectParams0[1] = params.distortionPreGain / 200.0;
  effectParams0[2] = params.delayMix;
  effectParams0[3] = math.smoothstep(.1,.15, params.delayTime);
  effectParams1[0] = params.delayFeedback;
}

// renderer & canvas-sketch setup  //
const sketch = ({ canvas, gl, update, render, pause }) =>
{
  initGUI();
  initOSC();
  // Create regl for handling GL stuff
  const regl = createRegl({ gl, extensions: ['OES_standard_derivatives', 'OES_texture_float'] });
  // A mesh for a flat plane
  const quad = createQuad();
  initShaderGlobals(regl);

  // Let's use this handy utility to handle mouse/touch taps
  const touchMove = createTouchListener(canvas).on('move', onTouchMove);


  const drawQuad = regl({
    // Fragment & Vertex shaders 
    //frag: glslify(path.resolve(__dirname, 'assets/shaders/sunrise_realistic.frag')),
    frag: glslify(path.resolve(__dirname, 'assets/shaders/multi_waveform.frag')),
    
    vert: glslify(path.resolve(__dirname, 'assets/shaders/default.vert')),
    // Pass down props from javascript
    uniforms: {
      aspect: regl.prop('aspect'),
      iTime: regl.prop('iTime'),
      time: regl.prop('time'), // no idea why this is still needed :O
      iResolution: regl.prop('iResolution'),
      iWaveformRms: regl.prop('iWaveformRms'),
      iWaveformRmsAccum: regl.prop('iWaveformRmsAccum'),
      iWaveformTexture0: regl.prop('iWaveformTexture0'),
      iEffectParams0: regl.prop('iEffectParams0'),
      iEffectParams1: regl.prop('iEffectParams1'),
    },
    // Setup transparency blending
    blend: {
      enable: false,
      func: {
        srcRGB: 'one',
        srcAlpha: 1,
        dstRGB: 'one',
        dstAlpha: 1
      }
    },
    // Send mesh vertex attributes to shader
    attributes: {
      position: quad.positions
    },
    // The indices for the quad mesh
    elements: regl.elements(quad.cells)
  });

  return {
    render({ context, time, deltaTime, width, height, canvas })
    {
      // update UI input
      updateWaveformTexture();
      updateInput(); 

      // On each tick, update regl timers and sizes
      regl.poll();

      // Clear backbuffer with pure white
      regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
        stencil: 0
      });

      // refresh the waveform texture
      drawQuad({
        iTime: time,
        time: time,
        aspect: width / height,
        iResolution: [canvas.width, canvas.height],
        iWaveformRms: waveformRms,
        iWaveformRmsAccum: waveformRmsAccum,
        iWaveformTexture0: waveformTexture0,
        iEffectParams0: effectParams0,
        iEffectParams1: effectParams1,
      });

      // Flush pending GL calls for this frame
      gl.flush();

      //context.font = '48px serif';
      //context.fillText('Hello world', 10, 50);
    },
    unload()
    {
      // Unload events and tone objects 
      touchMove.disable();
      clearInterval(interval);
    }
  };
};

canvasSketch(sketch, settings);
