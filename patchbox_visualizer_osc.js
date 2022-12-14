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


//const serverURL = 'ws://192.168.50.125:3000'; // my laptop
//const serverURL = 'ws://localhost:3000';
//const serverURL = 'ws://192.168.50.241:3000';
//const serverURL = 'ws://192.168.50.237:3000'; // my pc
//const serverURL = 'wss://evergreen-awake-wing.glitch.me'; 

// HACK (or maybe not?)
// if localhost, send data to server.
// if IP then listen to data from server
//let sendMode = false; //window.location.hostname == "localhost";
//sendMode = false;
//console.log("App is in " + (sendMode ? "send" : "receive") + " mode");

let ip = window.location.hostname;
let show_gui = false;
let socket;
let interval;

// this should be const? not sure how to define it globally as a const tho
let osc, gui;
let osc_connected = false;
let touchx = 0.0;
let touchy = 0.0;

const waveformResolution = 128;
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
  "distortionPreGain": 10.0,
  "delayMix": 0.02,
  "delayTime": 0.1,
  "delayFeedback": 1.0,
}

let heavyDistortionPreset = {
  "reverbMix": 0.2,
  "distortionPreGain": 30.0,
  "delayMix": 0.3,
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
    for (let i = 0; i < waveformResolution; i++)
    {

      // for FFT waveformArray[i * 4 + 1] = math.lerp(waveformArray[i * 4 + 1], Math.abs(waveformArray1[i]) * .02, 0.3);
      waveformArray[i * 4] = waveformArray0[i];
      waveformArray[i * 4 + 1] = waveformArray1[i];
      waveformArray[i * 4 + 2] = waveformArray1[i];
      waveformArray[i * 4 + 3] = waveformArray1[i];
   }

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
  params.reverbMix = x;

  // turn the x,y coordinate into polar coordinates
  let r = Math.sqrt(x*x + y*y);
  let theta = Math.atan2(y,x);

  // as we go out from center, crank distortion
  blendParams(cleanPreset, distortionPreset, r);
  // blow out distortion at outer edges
  let outerEdge = math.smoothstep(0.5, 0.6, r);
  blendParams(params, heavyDistortionPreset, outerEdge);
 
  // delay is up top
  // calculate the dot product of (x,y) and the up vector
  let down = Math.sin(theta);
  down = math.smoothstep(0.5, 1.0, down);
  blendParams(params, delayPreset, down);

  let right = Math.sin(theta + Math.PI/2.0);
  right = math.smoothstep(0.75, 1.0, right);
  blendParams(params, heavyDelayPreset, right);

  let left = Math.sin(theta - Math.PI/2.0);
  left = math.smoothstep(0.75, 1.0, left);
  blendParams(params, reverbPreset, left);

  // get some clean in the center
  let center = math.smoothstep(0.1, 0.0, r);
  blendParams(params, cleanPreset, center);

  onParamChanged('reverbMix');
  onParamChanged('distortionPreGain');
  onParamChanged('delayMix');
  onParamChanged('delayTime');
  onParamChanged('delayFeedback');
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

      iWaveformTexture0: regl.prop('iWaveformTexture0'),
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
        iWaveformTexture0: waveformTexture0,
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
