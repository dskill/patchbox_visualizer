
//Quarks.install("dewdrop_lib");
// install all libraries from james harkins
// http://www.dewdrop-world.net
// MethodOverride.printAll

~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
~o.sendMsg("/hello", "there");    // send the application the message "hello" with the
NetAddr.langPort.postln;

// load fx
//"/Users/drew/src/patchbox_visualizer/sc/fx.scd".load
/*
(
var p;
var b;
var m;
var z;

b = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/solo.wav");
SynthDef(\solo, { |outbus = 0, rate=1, inter=2|
	var buff = BufRd.ar(2, ≥b, Phasor.ar(0, BufRateScale.kr(b) * rate, 0, BufFrames.kr(b)), 1, inter);
	Out.ar(outbus, buff);
});

m = MixerChannel(\solo);
b.play;
//s.sendBundle(0.1, [\s_new, \solo, -1, 0, m.synthgroup.nodeID, \outbus, m.inbus.index]);

p = m.playfx(Instr.at([\busfx, \dist]), [0, 1]);
p.set(\preGain, 5.3);
p.set(\postGain, 0.3);

z = m.playfx(Instr.at([\busfx, \chorus]), [0, 1]);
z.set(\speed, 0.64);
z.set(\xfade, 0.4);
z.set(\depth, 0.1);
)
*/


s.boot;
(
s.waitForBoot{


// from the wonderful forum post:
// https://scsynth.org/t/is-it-possible-to-get-the-output-of-a-ugen-as-an-array-of-floats-audio-buffer/6539/14

var chunkSize = 256;
var numChunks = 16;
var relay_buffer0 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer1 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer2 = Buffer.alloc(s, 4096 * 2);


var synth;
var osc_receive;

	var solobuffer = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/guitar-tuning.wav"); //solo.wav");

synth = SynthDef(\testsynth, { |out, reverbMix = 0.5|
	//var sigB = SinOsc.ar(220);
	//var sig = MulAdd(SinOsc.ar(400), 0.4,0);
	//var sig = BufRd.ar(1, solobuffer, Phasor.ar(0, BufRateScale.kr(solobuffer), 0, BufFrames.kr(solobuffer)), 1, 2);
	var sig = SoundIn.ar(0);
	var dust =  MulAdd( LFNoise1.kr(1, 0.5, 0.5), 10.0, 0.0) ;
	//var sigD = MulAdd(SinOsc.ar(2000), 0.2,0);
	//sig = sigB; //sigA + sigC; //sigA + sigB; //{Mix.new([sigA,sigB])};
	var preGain = 3.0;
	var postGain =0.1;
		//
	//var sig_distort = (sig * preGain * dust).distort * postGain;
	//var thing = CombL.ar(sig, 10, SinOsc.kr(1, 0, 0.5,0.5), 10) ;

	var sig_distort = ConstantGainDistortion.ar(sig, preGain * dust);  // tanh default

	var sig_reverb = FreeVerb.ar(sig_distort, reverbMix, 0.9, 0.5, 2.0);

	var phase = Phasor.ar(0, 1, 0, chunkSize);
	// btw this is already guaranteed to be only a single-sample trigger

	// Trig.ar is not needed
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;

	var phase_reset_trig = Impulse.ar(30);

	var final_sig = sig_distort;
	//var inA = SinOsc.ar(SinOsc.kr(0.2, 0, 330/2.0 - 83, 330/2.0 + 83));
	var inA = sig;//PlayBuf.ar(1, solobuffer, BufRateScale.kr(solobuffer), loop: 1);
    var chain = FFT(relay_buffer2, inA);

		//chain.inspect;
		// Convert to frequency domain and convert back
		// No processing here
		// You can add processing here before you convert back
	//sig = IFFT(chain);
		//chain = chain.pvcalc(256, {|mags, phases|
			//[mags, phase];
			//////// Try uncommenting each of these lines in turn and re-running the synth:
			//[mags * {1.5.rand}.dup(mags.size), phases + {pi.rand}.dup(phases.size)]; // Arbitrary filter, arbitrary phase shift
			//[mags.reverse, phases.reverse]; // Upside-down!
			//[mags.differentiate, phases.differentiate]; // Differentiate along frequency axis
			//[mags[30..] ++ mags[..30], phases[30..] ++ phases[..30]]; // ".rotate" doesn't work directly, but this is equivalent
	//});//, frombin: 0, tobin: 256, zeroothers: 1);

	final_sig = inA;
		//sig =  SoundIn.ar(0);
	//final_sig = sig * dust;//sig_distort;//dust; //final_sig + dust;

	BufWr.ar(final_sig, relay_buffer0, phase + (chunkSize * partition));
	//BufWr.kr(chain, relay_buffer2); //phase + (chunkSize * partition));


	//SendReply.ar(trig, '/buffer_refresh', partition);
	SendReply.ar(phase_reset_trig, '/buffer_refresh', partition);

	// what audio to return from the function
		Out.ar(out, final_sig); //sig_reverb + sig);
	}).play;

OSCdef(\k, { |msg|
	// the partition to retrieve is the one BEFORE the latest transition point
	var partition = (msg[3] - 1) % numChunks;
	//msg.postln;

	//relay_buffer0.getn(0, 5, { |data| data.size.postln; } );
	//'send reply'.postln;
	// also I'm using getn
	// loadToFloatArray goes through a disk file
	// that is faster for long collections
	// for short collections, this is very inefficient
	// you do not need to create/destroy 43 temp files per second here!
	relay_buffer0.getn(partition.asInteger * chunkSize, chunkSize, { |data|
		~o.sendMsg(\waveform0, *(data.as(Array)));
	});

	relay_buffer2.getn(0, chunkSize, { |data|
		~o.sendMsg(\waveform1, *(data.as(Array)));
	});


}, '/buffer_refresh');

synth.onFree {
	OSCdef(\k).free;
	// original code example leaks buffer references
	// that is also not a good habit
	relay_buffer0.free;
	relay_buffer1.free;
};

// listen to OSC messages from the browser, via the node.js bridge
osc_receive = OSCFunc(

	{ arg msg, time, addr, recvPort;

		post('Received message to path: ');
		msg[0].postln;

		post('With value: ');
		msg[1].postln;

		synth.set(\reverbMix, msg[1]);
}, '/reverbMix');

} // end wait for boot
);

