export class SCBridge
{
  scLangAddress =  'http://' + window.location.hostname + ':3000/sclang' // 'http://192.168.50.237:3000/sclang'
  scSynthDefAddress =  'http://' + window.location.hostname + ':3000/synthDef' //'http://192.168.50.237:3000/synthDef'

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