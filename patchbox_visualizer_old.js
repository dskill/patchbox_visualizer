const canvasSketch = require('canvas-sketch');
const createRegl = require('regl');
const createQuad = require('primitive-quad');
const math = require('canvas-sketch-util/math');
const glslify = require('glslify');
const path = require('path');
const tween = require('./util/tween');
const Tone = require('tone');
const createTouchListener = require('touches');

//const serverURL = 'ws://192.168.50.125:3000'; // my laptop
const serverURL = 'ws://localhost:3000'; 
//const serverURL = 'ws://192.168.50.237:3000'; // my pc
//const serverURL = 'wss://evergreen-awake-wing.glitch.me'; 
let socket;

let waveformTargets = new Array();
let analyserDatas = new Array();

let fftTargets = new Array();
let interval;

let playAudioFromMp3 = true; 
let tonePlayer;
let toneMic;
let toneSplit;
let toneWaveforms = new Array();
let toneFFTs = new Array();
let bandpass;

let shaderAudioInput = new Array();

let waveformTextures = new Array();
let fftTextures = new Array();

const waveformResolution = 512;

function initShaderGlobals(regl) {
  shaderAudioInput = new Array();
  // let's start with 4 channels
  for (let i = 0; i < 4; i++) {
    shaderAudioInput[i] = new Object();
    shaderAudioInput[i].value = 0;
    shaderAudioInput[i].accumulated = 0;
    shaderAudioInput[i].fader = 0; //position of the actual fader knob
  }

   // From a flat array
   for (let i = 0; i < 2; i++) {
    waveformTextures[i] = regl.texture({
      shape: [waveformResolution, 1, 1],
      format: 'luminance',
      type: 'float32'
    });
  }

   // From a flat array
   for (let i = 0; i < 2; i++) {
    fftTextures[i] = regl.texture({
      shape: [waveformResolution, 1, 1],
      format: 'luminance',
      type: 'float32'
    });
  }
}

// Smooth linear interpolation that accounts for delta time
function damp(a, b, lambda, dt) {
  return math.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function transmitWaveform() {
  // if we are connected, send the waveform data
  if (socket.readyState === WebSocket.OPEN) {
    // send waveformTargets[0] as a float array
    // turn waveformTarget[0] to a float32 array
    let float32Array = new Float32Array(waveformTargets[0]);
    socket.send(float32Array.buffer);
    //socket.send(JSON.stringify(waveformTargets));
  } else {
    console.log('not connected');
  }
}

function updateWaveformTextures(deltaTime) {
  // smooth the waveform a bit

  for (let i = 0; i < 2; i++) {

    // TODO - figure out waveform smoothing. 
    for (let n = 0; n < waveformResolution; n++) {
      analyserDatas[i][n] = damp(
        analyserDatas[i][n],
        waveformTargets[i][n],
        2.0,
        deltaTime
      );
    }
  
    // this is probably real slow. I wonder if there's a better way?
    waveformTextures[i]({
      shape: [waveformResolution, 1, 1],
      format: 'luminance',
      type: 'float32',
      data: analyserDatas[i]
    });

    // this is probably real slow. I wonder if there's a better way?
    fftTextures[i]({
      shape: [waveformResolution, 1, 1],
      format: 'luminance',
      type: 'float32',
      data: fftTargets[i]
    });
  }
}

// Setup our sketch
const settings = {
  animate: true,
  scaleToView: true,
  context: 'webgl',
  fps: 60,
  canvas: document.querySelector('.background-canvas')
};

function initTone() {
  // Only initiate audio upon a user gesture
  console.log("starting audio");

  toneSplit = new Tone.Split();
  if (playAudioFromMp3) {
    // load a sound and play it immediately
    tonePlayer = new Tone.Player({
      "url": 'assets/music/DanDeaconChangeYourLife.mp3',//  piano.mp3',
      "loop": true,
      "autostart": true
    }).connect(toneSplit);
    tonePlayer.toDestination();
  } else {
    // get the input from the microphone
    toneMic = new Tone.UserMedia().connect(toneSplit);
    toneMic.open();
  };
    
 
  for (let i = 0; i < 2; i++) {
    toneWaveforms[i] = new Tone.Waveform(waveformResolution);
    //init toneFFTs
    toneFFTs[i] = new Tone.FFT(waveformResolution);
    toneFFTs[i].window = 'blackman';
    toneFFTs[i].smoothing = 0.8;
  }

  toneSplit.connect(toneWaveforms[0],0,0);
  toneSplit.connect(toneWaveforms[1],1,0);  
  

  /*
    // create band pass filter test
  bandpass = new Tone.Filter({
    "type": "bandpass",
    "frequency": 10,
    "rolloff": -96,
    "Q": 1
  }).toDestination();

  //insert bandpass filter between split and tone waveforms
  toneSplit.connect(bandpass,0,0);
  toneSplit.connect(bandpass,1,0);
  bandpass.connect(toneWaveforms[0]);
  bandpass.connect(toneWaveforms[1]);
*/

  for (let i = 0; i < 2; i++) {
    waveformTargets[i] = new Float32Array(waveformResolution);
    fftTargets[i] = new Float32Array(waveformResolution);
    analyserDatas[i] = new Float32Array(waveformResolution);
    const fps = 60;
    interval = setInterval(() => {
      waveformTargets[i] = toneWaveforms[i].getValue();
      fftTargets[i] = toneFFTs[i].getValue();
    },
      (1 / fps) * 1000);
  }
}

function startConnection() {
  socket = new WebSocket(serverURL);

  // Connection opened
  socket.addEventListener('open', function (event) {
    socket.send('Hello Server from canvas sketch!');
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    //console.log('Message from server ', event.data);
  });
}

function onTouch(ev, clientPosition) {
  Tone.start();
    /*
    //console.log(clientPosition);
    let x = clientPosition[0];
    let y = clientPosition[1];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let xNorm = x / width;
    let yNorm = y / height;
    let freq = xNorm  * 2000;
    //let q = map(y, 0, height, 0, 20);
    bandpass.frequency.value = freq;
    //bandpass.Q.value = q;
    */
}

// renderer & canvas-sketch setup  //
const sketch = ({ canvas, gl, update, render, pause }) => {
  // Create regl for handling GL stuff
  const regl = createRegl({ gl, extensions: ['OES_standard_derivatives', 'OES_texture_float'] });
  // A mesh for a flat plane
  const quad = createQuad();

  // Let's use this handy utility to handle mouse/touch taps
  const touches = createTouchListener(canvas).on('start', onTouch);
  
  // get mouse position
  
   



  initShaderGlobals(regl);
  initTone()
  startConnection();

  const drawQuad = regl({
    // Fragment & Vertex shaders 
    frag: glslify(path.resolve(__dirname, 'assets/shaders/simple_waveform.frag')),
    vert: glslify(path.resolve(__dirname, 'assets/shaders/default.vert')),
    // Pass down props from javascript
    uniforms: {
      aspect: regl.prop('aspect'),
      iTime: regl.prop('iTime'),
      time: regl.prop('time'), // no idea why this is still needed :O
      iAudioInput: regl.prop('iAudioInput'),
      iAudioInputAccumulated: regl.prop('iAudioInputAccumulated'),
      iFaders: regl.prop('iFaders'),
      iResolution: regl.prop('iResolution'),
      // TODO: Pack these into a single RGB Float texture
      iWaveformTexture0: regl.prop('iWaveformTexture0'),
      iWaveformTexture1: regl.prop('iWaveformTexture1'),
      iFFTTexture0: regl.prop('iFFTTexture0'),
      iFFTTexture1: regl.prop('iFFTTexture1'),
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
    render({ context, time, deltaTime, width, height }) {
      // On each tick, update regl timers and sizes
      regl.poll();

      // Clear backbuffer with pure white
      regl.clear({
        color: [0, 0, 0, 0],
        depth: 1,
        stencil: 0
      });

      // refresh the waveform texture
      updateWaveformTextures(deltaTime);
      transmitWaveform();

      drawQuad({
        iTime: time,
        time: time,
        aspect: width / height,
        iResolution: [canvas.width, canvas.height],
        iAudioInput: [shaderAudioInput[0].value, shaderAudioInput[1].value, shaderAudioInput[2].value],
        iAudioInputAccumulated: [shaderAudioInput[0].accumulated, shaderAudioInput[1].accumulated, shaderAudioInput[2].accumulated],
        iFaders: [shaderAudioInput[0].fader, shaderAudioInput[1].fader, shaderAudioInput[2].fader],
        iWaveformTexture0: waveformTextures[0],
        iWaveformTexture1: waveformTextures[1],
        iFFTTexture0: fftTextures[0],
        iFFTTexture1: fftTextures[1]
      });

      // Flush pending GL calls for this frame
      gl.flush();
    },
    unload() {
      // Unload events and tone objects 
      touches.disable();
      if (toneMic) toneMic.dispose();
      if (toneSplit) toneSplit.dispose();
      toneWaveforms.forEach(el => el.dispose());
      toneFFTs.forEach(el => el.dispose());
    }
  };
};

canvasSketch(sketch, settings);
