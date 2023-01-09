~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
//~o.sendMsg("/hello", "there");    // send the application the message "hello" with the
NetAddr.langPort.postln;



// for windows (focusrite)
//ServerOptions.devices; // all devices
//ServerOptions.outDevices; // all devices
//o = Server.default.options;
//o.inDevice_(ServerOptions.devices[20]);
//o.outDevice_(ServerOptions.devices[20]);

s.boot;
(
s.waitForBoot{

// from the wonderful forum post:
// https://scsynth.org/t/is-it-possible-to-get-the-output-of-a-ugen-as-an-array-of-floats-audio-buffer/6539/14
var chunkSize = 1024; // 2 waveforms at 128 resolution is about the most the PI will handle right now
// when we send OSC messages, we need to downsample the waveform data.  On PI, it can handle about 6k samples per second.
// we're running at 44k, so downsampling by 8 is enough for good performance
// the waveform resolution can be as high as 2048 and the webGL thread will still be able to keep up.
// if we wanted higher resolution, we could compromise by sending the data at a lower framerate
// that would create discontinuities between OSC messages, but in the extreme case we could just send
// a single OSC message of 2048 samples.  That should probably be fine, but we would only want to send the sample
// a few times a second.  Anyway... there are a lot of knobs to tune and as long as we stay under 6k samples per second
// we should be fine.

var chunkDownsample = 32;
var inputChannel = 0;
var numChunks = 16;
var relay_buffer0 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer1 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer2 = Buffer.alloc(s, 4096 * 2);
var synth;

var mylerp = { arg a, b, t; MulAdd(a, t) + MulAdd(b, (1.0-t)) };


	//var solobuffer = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/solo.wav");
	//var solobuffer = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/guitar-tuning.wav");

SynthDef.new(\default, { |out,
		reverbMix = 0.5,
		distortionPreGain = 5.0,
		delayMix = 0.5,
	    delayTime = 0.5,
		delayFeedback = 5
		|

	var sig = SoundIn.ar(inputChannel);
	//var sig = MulAdd(SinOsc.ar(400), 0.4,0);
	//var sig = BufRd.ar(1, solobuffer, Phasor.ar(0, BufRateScale.kr(solobuffer), 0, BufFrames.kr(solobuffer)), 1, 2);


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
	var distort_delay_mixed = MulAdd( sig_distort, 1.0) + MulAdd(comb_delay, delayMix);
	var sig_reverb = FreeVerb.ar(distort_delay_mixed, reverbMix, 0.9, 0.5, 2.0);
	var final_sig = sig_reverb;

	// MACHINERY FOR SAMPLING THE SIGNAL
	var phase = Phasor.ar(0, 1, 0, chunkSize);
	// btw this is already guaranteed to be only a single-sample trigger
	// Trig.ar is not needed
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;
	var fixed_timing_reset_trig = Impulse.ar(10);
	// write to buffers that will contain the waveform data we send via OSC
	BufWr.ar(sig, relay_buffer0, phase + (chunkSize * partition));
	BufWr.ar(final_sig, relay_buffer1, phase + (chunkSize * partition));

	// send data as soon as it's available and orrect
	SendReply.ar(trig, '/buffer_refresh', partition);
	// or send data at a specified framerate. This is wrong if you're sending a real audio signal
	//SendReply.ar(fixed_timing_reset_trig, '/buffer_refresh', partition);

	// what audio to return from the function
	Out.ar(out, final_sig); //sig_reverb + sig);
	}).add;

SynthDef.new(\bypass, { |out|

	var sig = SoundIn.ar(inputChannel);

	// MACHINERY FOR SAMPLING THE SIGNAL
	var phase = Phasor.ar(0, 1, 0, chunkSize);
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;
	var fixed_timing_reset_trig = Impulse.ar(30);
	// write to buffers that will contain the waveform data we send via OSC
	BufWr.ar(sig, relay_buffer0, phase + (chunkSize * partition));
	BufWr.ar(sig, relay_buffer1, phase + (chunkSize * partition));
	SendReply.ar(fixed_timing_reset_trig, '/buffer_refresh', partition);
	Out.ar(out, sig);
	}).add;

SynthDef.new(\scopeDistortion, { |out, distortionPreGain = 1.0|

	var sig = SoundIn.ar(inputChannel);

	// avg distortion volume
	var rmsSize = 256;
	var sig_distort_raw = (sig * distortionPreGain).distort;
	var ampBefore = (RunningSum.ar(sig.squared, rmsSize) / rmsSize).sqrt;
	var ampAfter = (RunningSum.ar(sig_distort_raw.squared, rmsSize) / rmsSize).sqrt;
	var sig_distort =  sig_distort_raw * min(10, (ampBefore / max(0.01, ampAfter)));

	// MACHINERY FOR SAMPLING THE SIGNAL
	var phase = Phasor.ar(0, 1, 0, chunkSize);
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;
	var fixed_timing_reset_trig = Impulse.ar(30);
	// write to buffers that will contain the waveform data we send via OSC
	BufWr.ar(sig, relay_buffer0, phase + (chunkSize * partition));
	BufWr.ar(sig_distort, relay_buffer1, phase + (chunkSize * partition));
	SendReply.ar(fixed_timing_reset_trig, '/buffer_refresh', partition);
	Out.ar(out, sig_distort);
	}).add;

SynthDef.new(\wahdelay, { arg out=0, maxdtime=0.2, dtime=0.2, decay=2, gate=1, wah_noise=0.4, wah_amp=10.0, wah_freq_min=200, wah_freq_max=1000;
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
}).add;

 SynthDef.new(\pitchfollow, { |out|
		var in, amp, freq, hasFreq, sound;
		in = Mix.new(SoundIn.ar([0, 1]));
		amp = Amplitude.kr(in, 0.05, 0.05);
		# freq, hasFreq = Pitch.kr(in, ampThreshold: 0.02, median: 7);
		//freq = Lag.kr(freq.cpsmidi.round(1).midicps, 0.05);
		sound = Mix.new(VarSaw.ar(freq * [0.5, 1, 2], 0, LFNoise1.kr(0.3, 0.1, 0.1), amp));
		6.do {
			sound = AllpassN.ar(sound, 0.040, [0.040.rand,0.040.rand], 2)
		};
		Out.ar(out, sound)
}).add;


OSCdef(\k, { |msg|
	// the partition to retrieve is the one BEFORE the latest transition point
	var partition = (msg[3] - 1) % numChunks;
	relay_buffer0.getn(partition.asInteger * chunkSize, chunkSize, { |data|
		// downsample data
		//data.size.postln;
		data = data.resamp1(data.size/chunkDownsample);
		//data.size.postln;
		~o.sendMsg(\waveform0, *(data.as(Array)));
	});

	relay_buffer1.getn(partition.asInteger * chunkSize, chunkSize, { |data|
		data = data.resamp1(data.size/chunkDownsample);
		~o.sendMsg(\waveform1, *(data.as(Array)));
	});

}, '/buffer_refresh');

// listen to OSC messages from the browser, via the node.js bridge
// TODO: these OSC Funcs are probably leaking memory cause they
// don't ever get cleaned up...
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
OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayMix, msg[1]);
}, '/delayMix');
OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayTime, msg[1]);
}, '/delayTime');
OSCFunc(
	{ arg msg, time, addr, recvPort;
		//msg[1].postln;
		synth.set(\delayFeedback, msg[1]);
}, '/delayFeedback');
OSCFunc(
	{ arg msg, time, addr, recvPort;
		chunkDownsample = msg[1];
}, '/chunkDownsample');
OSCFunc(
	{ arg msg, time, addr, recvPort;
		chunkDownsample = msg[1];
}, '/chunkDownsample');
OSCFunc(
	{ arg msg, time, addr, recvPort;
		'setting effect'.postln;
		msg[1].postln;
		synth.free; // stop the last effect
		synth = Synth.new(msg[1]);
}, '/setEffect');

// start with the default synth active
synth = Synth.new(\default);
/*
	TODO: clean up stuff??
synth.onFree {
			OSCdef(\k).free;
			// original code example leaks buffer references
			// that is also not a good habit
			relay_buffer0.free;
			relay_buffer1.free;
	*/



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

// guitar tuner
/*

(
        SynthDef("pitchFollow2", { |out|
            var in, amp, freq, hasFreq, sound;
            in = Mix.new(SoundIn.ar([0, 1]));
            amp = Amplitude.kr(in, 0.05, 0.05);
            # freq, hasFreq = Pitch.kr(in, execFreq: 1000.0, ampThreshold: 0.01, median: 7, minFreq: 70, maxFreq:500, maxBinsPerOctave: 64);
            sound = CombC.ar(LPF.ar(in, 1000), 0.1, (2 * freq + 10).reciprocal, -6).distort * 0.05;
            6.do({
                sound = AllpassN.ar(sound, 0.040, [0.040.rand, 0.040.rand], 2)
            });
	freq.poll;
	hasFreq.poll;
	out = in;
	sound = in;
            Out.ar(out, sound);
        }).play(s);
)
*/

