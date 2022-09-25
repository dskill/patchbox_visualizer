const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const createQuad = require('primitive-quad');
const math = require('canvas-sketch-util/math');
const glslify = require('glslify');
const path = require('path');
const tween = require('./util/tween');
const Tone = require('tone');
const createTouchListener = require('touches');
const { Console } = require('console');

//const serverURL = 'ws://192.168.50.125:3000'; // my laptop
//const serverURL = 'ws://localhost:3000'; 
//const serverURL = 'ws://192.168.50.237:3000'; // my pc
const serverURL = 'wss://evergreen-awake-wing.glitch.me'; 

let socket;

let useSmoothing = false;
let waveformTarget = [];
let analyserData = [];
let beatPulse = 0;
let hitPulse = 0;

const waveformResolution = 256;
let waveformTexture = {};


function initShaderGlobals(regl)
{
  // From a flat array
  waveformTexture = regl.texture({
    shape: [waveformResolution, 1, 1],
    format: 'luminance',
    type: 'float32'
  });
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
        2.0,
        deltaTime
      );
    }
  } else
  {
    analyserData = waveformTarget;
  }

  if (waveformTarget.length != waveformResolution) {
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
    // check if the data is of type bytes
    if (event.data instanceof ArrayBuffer)
    {
      // convert the data to a float32 array
      let float32Array = new Float32Array(event.data);
      waveformTarget = float32Array;
    } else // if it's not bytes, it's a string
    { 
      if (event.data == "beat")
      {
        beatPulse = 1;
      } else if (event.data == "hit")
      {
        hitPulse = 1;
      }

      //console.log('Message from server ', event.data);
    }
  });
}

function onTouch(ev, clientPosition)
{
  console.log(ev);
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
  startConnection();

  const drawQuad = regl({
    // Fragment & Vertex shaders 
    frag: glslify(path.resolve(__dirname, 'assets/shaders/waveform_from_unity.frag')),
    vert: glslify(path.resolve(__dirname, 'assets/shaders/default.vert')),
    // Pass down props from javascript
    uniforms: {
      aspect: regl.prop('aspect'),
      iTime: regl.prop('iTime'),
      iBeatPulse: regl.prop('iBeatPulse'),
      iHitPulse: regl.prop('iHitPulse'),
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
      //transmitWaveform();
      // decay beat pulse
      beatPulse *= 0.95;
      hitPulse *= 0.9;

      drawQuad({
        iTime: time,
        iBeatPulse: beatPulse,
        iHitPulse: hitPulse,
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
    }
  };
};

canvasSketch(sketch, settings);
