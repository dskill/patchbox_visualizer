const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const createQuad = require('primitive-quad');
const math = require('canvas-sketch-util/math');
const glslify = require('glslify');
const path = require('path');
const tween = require('./util/tween');
const Tone = require('tone');
const createTouchListener = require('touches');
const { Console, debug } = require('console');
const OSC = require('osc-js');


const options = {
  udpServer: {
    port: 9912
  }
}

const osc = new OSC(options)

osc.on('*', message => {
  console.log(message.args)
  let arg = message.args;
  // check if it's a uint8array
  console.log(arg);
  if (arg[0] instanceof Uint8Array)
  {
    //let float32Array = new Float32Array(arg[0], 4);
    let float32Array = bytesToFloatArray(arg[0]);
    console.log(float32Array);
    console.log(float32Array.length);

   // waveformTarget = float32Array;
  }

})

osc.on('/{foo,bar}/*/param', message => {
  console.log(message.args)
})

osc.on('open', () => {
  const message = new OSC.Message('/test', 12.221, 'hello')
  osc.send(message)
})
 
osc.open()

function bytesToFloatArray(bytes) {
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength/Float32Array.BYTES_PER_ELEMENT);
}



//const serverURL = 'ws://192.168.50.125:3000'; // my laptop
//const serverURL = 'ws://localhost:3000';
const serverURL = 'ws://192.168.50.241:3000';
//const serverURL = 'ws://192.168.50.237:3000'; // my pc
//const serverURL = 'wss://evergreen-awake-wing.glitch.me'; 

// HACK (or maybe not?)
// if localhost, send data to server.
// if IP then listen to data from server
let sendMode = window.location.hostname == "localhost";
sendMode = false;
console.log("App is in " + (sendMode ? "send" : "receive") + " mode");

let socket;

let useSmoothing = false;
let waveformTarget = [];
let analyserData = [];
let interval;

const waveformResolution = 512;
let waveformTexture = {};

function transmitWaveform()
{
  // if we are connected, send the waveform data
  if (socket.readyState === WebSocket.OPEN)
  {
    // send waveformTargets[0] as a float array
    // turn waveformTarget[0] to a float32 array
    let float32Array = new Float32Array(analyserData);
    socket.send(float32Array.buffer);
    //socket.send(JSON.stringify(waveformTargets));
  } else
  {
    console.log('not connected');
  }
}

function initShaderGlobals(regl)
{
  // From a flat array
  waveformTexture = regl.texture({
    shape: [waveformResolution, 1, 1],
    format: 'luminance',
    type: 'float32'
  });
}

function initTone()
{
  let toneSplit = new Tone.Split();
  let toneMic = new Tone.UserMedia().connect(toneSplit);
  let toneWaveform = new Tone.Waveform(waveformResolution);
  toneMic.open();

  toneSplit.connect(toneWaveform, 0, 0);
  waveformTarget = new Float32Array(waveformResolution);
  analyserData = new Float32Array(waveformResolution);

  const fps = 60;
  interval = setInterval(() =>
  {
    waveformTarget = toneWaveform.getValue();
  },
    (1 / fps) * 1000);
}

// Smooth linear interpolation that accounts for delta time
function damp(a, b, lambda, dt)
{
  return math.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function updateWaveformTexture(deltaTime)
{
  // smooth the waveform a bit

  // TODO - figure out waveform smoothing. 
  if (useSmoothing)
  {
    for (let n = 0; n < waveformResolution; n++)
    {
      analyserData[n] = damp(
        analyserData[n],
        waveformTarget[n],
        20.0,
        deltaTime
      );
    }
  } else
  {
    analyserData = waveformTarget;
  }

  if (waveformTarget.length != waveformResolution)
  {
    console.log("waveformTarget.length != waveformResolution");
    return;
  }
  // this is probably real slow. I wonder if there's a better way?
  waveformTexture({
    shape: [waveformResolution, 1, 1],
    format: 'luminance',
    type: 'float32',
    data: analyserData
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
    if (!sendMode)
    {
      // check if the data is of type bytes
      if (event.data instanceof ArrayBuffer)
      {
        // convert the data to a float32 array
        let float32Array = new Float32Array(event.data);
        waveformTarget = float32Array;
      }
    }
  });
}

function onTouch(ev, clientPosition)
{
  Tone.start();
}

// renderer & canvas-sketch setup  //
const sketch = ({ canvas, gl, update, render, pause }) =>
{
  // Create regl for handling GL stuff
  const regl = createRegl({ gl, extensions: ['OES_standard_derivatives', 'OES_texture_float'] });
  // A mesh for a flat plane
  const quad = createQuad();

  // Let's use this handy utility to handle mouse/touch taps
  const touches = createTouchListener(canvas).on('start', onTouch);

  initShaderGlobals(regl);
  if (sendMode) {
    initTone();
  }
  //startConnection();

  const drawQuad = regl({
    // Fragment & Vertex shaders 
    frag: glslify(path.resolve(__dirname, 'assets/shaders/simple_waveform.frag')),
    vert: glslify(path.resolve(__dirname, 'assets/shaders/default.vert')),
    // Pass down props from javascript
    uniforms: {
      aspect: regl.prop('aspect'),
      iTime: regl.prop('iTime'),
      time: regl.prop('time'), // no idea why this is still needed :O
      iResolution: regl.prop('iResolution'),
      // TODO: Pack these into a single RGB Float texture
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
    render({ context, time, deltaTime, width, height })
    {
      // On each tick, update regl timers and sizes
      regl.poll();

      // Clear backbuffer with pure white
      regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
        stencil: 0
      });

      // refresh the waveform texture
      updateWaveformTexture(deltaTime);
      if (sendMode)
      {
        transmitWaveform();
      }

      drawQuad({
        iTime: time,
        time: time,
        aspect: width / height,
        iResolution: [canvas.width, canvas.height],
        iWaveformTexture0: waveformTexture,
      });

      // Flush pending GL calls for this frame
      gl.flush();
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
