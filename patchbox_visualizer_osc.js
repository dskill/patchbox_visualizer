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
let osc; 

const waveformResolution = 256;
let waveformTexture0 = {};
let waveformArray0 = [];
let waveformArray1 = [];
// rename this now that i'm using it for history 
let waveformArray = new Float32Array(waveformResolution * 4);
let requestWaveformTextureUpdate = false;

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
      requestWaveformTextureUpdate = true;
    } else if (message.address == "/waveform1")
    {
      waveformArray1 = args;
      requestWaveformTextureUpdate = true;
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
    const message = new OSC.Message('/test', 12.221, 'hello')
    osc.send(message)
  })
  
  osc.open( )
}

function initParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  show_gui = urlParams.has('gui');
}

function initShaderGlobals(regl)
{
  // From a flat array
  waveformTexture0 = regl.texture({
    shape: [waveformResolution, 1],
    format: 'rgba',
    type: 'float32'
  });

  waveformTexture1 = regl.texture({
    shape: [waveformResolution, 2],
    format: 'rgba',
    type: 'float32'
  });
}

function initGUI()
{
  var gui = new GUI();
  let ip_label = { ip: ip };
  // TODO: can i set the waveform resolution here?
  var params = {
    "reverbMix": 0.5,
  };

  gui.add(params, "reverbMix", 0, 1).onChange(function(value) {
    //console.log("reverbMix changed to " + value);
    osc.send(new OSC.Message('/reverbMix', value) );
  });
  gui.add(ip_label, 'ip');

  // add a gui label
  //gui.add(params, 'waveformResolution', 0, 1024).listen();
  //gui.add(params, 'waveformResolution', 1, 1024);
  //gui.add(params, 'waveform0', 0, 1);
  //gui.add(params, 'waveform1', 0, 1);
}


function updateWaveformTexture()
{
    // make an array that concatenates the waveform with itself
    // so that we can draw a line between the two
    for (let i = 0; i < waveformResolution; i++)
    {
      waveformArray[i * 4] = waveformArray0[i];
      waveformArray[i * 4 + 1] = math.lerp(waveformArray[i * 4 + 1], Math.abs(waveformArray1[i]) * .02, 0.1);
      waveformArray[i * 4 + 2] = 0.0 * waveformArray1[i];
      waveformArray[i * 4 + 3 ] = 0.0 * waveformArray1[i];

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
  fps: 60,
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

function onTouch(ev, clientPosition)
{
  //Tone.start();
}

// renderer & canvas-sketch setup  //
const sketch = ({ canvas, gl, update, render, pause }) =>
{
  initParams();
  initOSC();
  if (show_gui) {
    initGUI();
  }
  // Create regl for handling GL stuff
  const regl = createRegl({ gl, extensions: ['OES_standard_derivatives', 'OES_texture_float'] });
  // A mesh for a flat plane
  const quad = createQuad();
  initShaderGlobals(regl);

  // Let's use this handy utility to handle mouse/touch taps
  const touches = createTouchListener(canvas).on('start', onTouch);

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
      if (requestWaveformTextureUpdate) {
        updateWaveformTexture();
        //updateWaveformTexture1(waveformArray1);
        requestWaveformTextureUpdate = false;
      }
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
      touches.disable();
      clearInterval(interval);
    }
  };
};

canvasSketch(sketch, settings);
