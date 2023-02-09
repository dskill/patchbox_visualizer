export class SCBridge
{
  scLangAddress = 'http://' + window.location.hostname + ':3000/sclang' // 'http://192.168.50.237:3000/sclang'
  scSynthDefAddress = 'http://' + window.location.hostname + ':3000/synthDef' //'http://192.168.50.237:3000/synthDef'

  exampleSynthDef = `
  SynthDef("bubbles", { arg out=0, wobble=0.4, innerWobble=8, releaseTime=4;
    var f, zout;
    f = LFSaw.kr(wobble, 0, 24, LFSaw.kr([innerWobble, innerWobble / 1.106], 0, 3, 80)).midicps;
    zout = CombN.ar(SinOsc.ar(f, 0, 0.04), 0.2, 0.2, 4);  // echoing sine wave
    zout = zout * EnvGen.kr(Env.linen(releaseTime: releaseTime), doneAction: 2);
    Out.ar(out, zout);
  });
`

  constructor()
  {
    // hack for development. Change the port to 3000 no matter what we're on
    // this.scLangAddress = this.scLangAddress.replace(/:\d+/, ':3000')
    // this.scSynthDefAddress = this.scSynthDefAddress.replace(/:\d+/, ':3000')
  }

  /*
  sendMain() {
    // post window.location.hostname + '/sclang' to start sclang
    fetch(this.scLangAddress, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lang: this.main
      })
    })
      .then(response => response.json())
      .then(
        data => console.log(data)
      );
    } 
  }
  */

  sendSynthDef(synthName, synthDef)
  {
    console.log("scSynthDefAddress", this.scSynthDefAddress)
    // post window.location.hostname + '/sclang' to start sclang
    fetch(this.scSynthDefAddress, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        synthDef: synthDef,
        synthName: synthName
      })
    })
      .then(response => response.json())
      .then(
        data => console.log(data)
      );
  }
}


//example usage
/*
var exampleSynthDef = `
  SynthDef("bubbles", { arg out=0, wobble=0.4, innerWobble=8, releaseTime=4;
    var f, zout;
    f = LFSaw.kr(wobble, 0, 24, LFSaw.kr([innerWobble, innerWobble / 1.106], 0, 3, 80)).midicps;
    zout = CombN.ar(SinOsc.ar(f, 0, 0.04), 0.2, 0.2, 4);  // echoing sine wave
    zout = zout * EnvGen.kr(Env.linen(releaseTime: releaseTime), doneAction: 2);
    Out.ar(out, zout);
  });
`

var mySynthDef = `
SynthDef.new(\\wahdelay, { arg out=0, maxdtime=0.2, dtime=0.2, decay=2, gate=1, wah_noise=0.4, wah_amp=10.0, wah_freq_min=200, wah_freq_max=1000;
  var in = SoundIn.ar(0);
    var env = Linen.kr(gate, 0.05, 1, 0.1, 2);

  var rmsSize=2048*64;
  var rms = (RunningSum.ar(in.squared, rmsSize) / rmsSize).sqrt;
  var wah = RLPF.ar(in, LinExp.kr(LFNoise1.kr(wah_noise+rms*wah_amp), -1, 1, wah_freq_min, wah_freq_max),0.1);
  var echo = CombL.ar(in * env, maxdtime, dtime, decay, 1, wah).softclip * 0.4;
  var final = wah + echo;

  // MACHINERY FOR SAMPLING THE SIGNAL
  var phase = Phasor.ar(0, 1, 0, chunkSize);
  var trig = HPZ1.ar(phase) < 0;
  var partition = PulseCount.ar(trig) % numChunks;
  var fixed_timing_reset_trig = Impulse.ar(30);
  // write to buffers that will contain the waveform data we send via OSC
  BufWr.ar(in, relay_buffer0, phase + (chunkSize * partition));
  BufWr.ar(final, relay_buffer1, phase + (chunkSize * partition));
  SendReply.ar(fixed_timing_reset_trig, '/buffer_refresh', partition);
  Out.ar(out, final)
});
`

scBridge.sendSynthDef("test", mySynthDef);
*/