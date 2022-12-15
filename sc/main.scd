~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
~o.sendMsg("/hello", "there");    // send the application the message "hello" with the
NetAddr.langPort.postln;

s.boot;
(
s.waitForBoot{


// from the wonderful forum post:
// https://scsynth.org/t/is-it-possible-to-get-the-output-of-a-ugen-as-an-array-of-floats-audio-buffer/6539/14
var chunkSize = 64; // 2 waveforms at 128 resolution is about the most the PI will handle right now
var numChunks = 16;
var relay_buffer0 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer1 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer2 = Buffer.alloc(s, 4096 * 2);


var synth;
var osc_receive;

	//var solobuffer = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/solo.wav");
	//var solobuffer = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/guitar-tuning.wav");

	var mylerp = { arg a, b, t; MulAdd(a, t) + MulAdd(b, (1.0-t)) };

synth = SynthDef(\testsynth, { |out,
		reverbMix = 0.5,
		distortionPreGain = 5.0,
		delayMix = 0.5,
	    delayTime = 0.5,
		delayFeedback = 5
		|

	//var sigB = SinOsc.ar(220);
	//var sig = MulAdd(SinOsc.ar(400), 0.4,0);
	//var sig = BufRd.ar(1, solobuffer, Phasor.ar(0, BufRateScale.kr(solobuffer), 0, BufFrames.kr(solobuffer)), 1, 2);

	var sig = SoundIn.ar(0);
	var dust =  MulAdd( LFNoise1.kr(1, 0.5, 0.5), 10.0, 0.0) ;
	//var sigD = MulAdd(SinOsc.ar(400), 0.2,0);
	//sig = sigB; //sigA + sigC; //sigA + sigB; //{Mix.new([sigA,sigB])};
		//var sig = sigD;

	// avg distortion volume
	var rmsSize = 256;
	var sig_distort_raw = (sig * distortionPreGain * dust).distort;
	var ampBefore = (RunningSum.ar(sig.squared, rmsSize) / rmsSize).sqrt;
	var ampAfter = (RunningSum.ar(sig_distort_raw.squared, rmsSize) / rmsSize).sqrt;
	var sig_distort =  sig_distort_raw * min(10, (ampBefore / max(0.01, ampAfter)));

	//var sig_distort = ConstantGainDistortion.ar(sig, distortionPreGain * dust);  // tanh default

	var comb_delay = CombL.ar(sig_distort, 2, delayTime, delayFeedback) ;
	var distort_delay_mixed = MulAdd( sig_distort, 1.0 - delayMix) + MulAdd(comb_delay, delayMix);
	var sig_reverb = FreeVerb.ar(distort_delay_mixed, reverbMix, 0.9, 0.5, 2.0);
	var final_sig = sig_reverb;

	// MACHINERY FOR SAMPLING THE SIGNAL
	var phase = Phasor.ar(0, 1, 0, chunkSize);
	// btw this is already guaranteed to be only a single-sample trigger
	// Trig.ar is not needed
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;
	var phase_reset_trig = Impulse.ar(30);
	// write to buffers that will contain the waveform data we send via OSC
	BufWr.ar(sig, relay_buffer0, phase + (chunkSize * partition));
	BufWr.ar(final_sig, relay_buffer1, phase + (chunkSize * partition));

	//SendReply.ar(trig, '/buffer_refresh', partition);
	SendReply.ar(phase_reset_trig, '/buffer_refresh', partition);

	// what audio to return from the function
	Out.ar(out, final_sig); //sig_reverb + sig);
	}).play;

OSCdef(\k, { |msg|
	// the partition to retrieve is the one BEFORE the latest transition point
	var partition = (msg[3] - 1) % numChunks;
	relay_buffer0.getn(partition.asInteger * chunkSize, chunkSize, { |data|
		~o.sendMsg(\waveform0, *(data.as(Array)));
	});

	relay_buffer1.getn(partition.asInteger * chunkSize, chunkSize, { |data|
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
OSCFunc(

	{ arg msg, time, addr, recvPort;

		//post('Received message to path: ');
		//msg[0].postln;

		//post('With value: ');
		//msg[1].postln;

		synth.set(\reverbMix, msg[1]);
}, '/reverbMix');
	// listen to OSC messages from the browser, via the node.js bridge
OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\distortionPreGain, msg[1]);
	}, '/distortionPreGain');
osc_receive = OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayMix, msg[1]);
}, '/delayMix');
osc_receive = OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayTime, msg[1]);
}, '/delayTime');
osc_receive = OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayFeedback, msg[1]);
}, '/delayFeedback');

} // end wait for boot
);


//
// NOTES
//

// FFT EXAMPLE
	//var inA = SinOsc.ar(SinOsc.kr(0.2, 0, 330/2.0 - 83, 330/2.0 + 83));
	//var inA = PlayBuf.ar(1, solobuffer, BufRateScale.kr(solobuffer), loop: 1);
		//var chain = FFT(relay_buffer2, inA);

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
		//sig =  SoundIn.ar(0);
	//final_sig = sig * dust;//sig_distort;//dust; //final_sig + dust;
	//BufWr.kr(chain, relay_buffer2); //phase + (chunkSize * partition));


	// for FFT
	/*
	relay_buffer2.getn(0, chunkSize, { |data|
		~o.sendMsg(\waveform1, *(data.as(Array)));
	});
	*/

