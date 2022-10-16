

// General effects examples
// dewdrop_world, http://www.dewdrop-world.net
// code is released under the LGPL, http://creativecommons.org/licenses/LGPL/2.1/

// the following code between ( ... ) can be pasted into a new file
// and saved as [sc root directory]/Instr/busfx.rtf. Then the definitions will be loaded
// automatically when you call on them.

// the kick drum usage example follows these definitions


(

////////// start with some simple ones

// dynamics processing

Instr(#[\busfx, \limiter], { arg bus, numChannels, level, lookAhead, gain;
	Limiter.ar(In.ar(bus, numChannels), level, lookAhead) * gain;
}, [\mybuf, ObjectSpec(1), #[0, 1, \linear, 0, 1], #[0.001, 0.1], #[0.1, 10, \exponential, 0, 1]]);

Instr(#[\busfx, \compander], { arg bus, numChannels, thresh, slopeBelow, slopeAbove, clampTime, relaxTime, postGain;
	var sig;
	sig = In.ar(bus, numChannels);
	Compander.ar(sig, sig, thresh, slopeBelow, slopeAbove, clampTime, relaxTime, postGain);
}, [\audiobus, ObjectSpec(1), #[0, 1, \linear, 0, 0.5], #[0.1, 10, \exponential, 0, 1], #[0.1, 10, \exponential, 0, 1], #[0.001, 5, \exponential], #[0.001, 5, \exponential], #[0.1, 10, \exponential, 0, 1]]);

Instr(#[\busfx, \companderd], { arg bus, numChannels, thresh, slopeBelow, slopeAbove, clampTime, relaxTime, postGain;
	var sig;
	sig = In.ar(bus, numChannels);
	CompanderD.ar(sig, thresh, slopeBelow, slopeAbove, clampTime, relaxTime, postGain);
}, [\audiobus, ObjectSpec(1), #[0, 1, \linear, 0, 0.5], #[0.1, 10, \exponential, 0, 1], #[0.1, 10, \exponential, 0, 1], #[0.001, 5, \exponential], #[0.001, 5, \exponential], #[0.1, 10, \exponential, 0, 1]]);



// simple distortion (variants may be built easily on this template)

Instr(#[\busfx, \dist], { arg bus, numChan, preGain, postGain;
	(In.ar(bus, numChan) * preGain).distort * postGain;
}, [\audiobu, ObjectSpec(1), #[0.05, 20, \exponential, 0, 1], #[0.05, 20, \exponential, 0, 1], #[0,1]]);



// filters

Instr(#[\busfx, \rlpf], { |bus, numChan, freq, rq, xfade|
	var sig, new;
	sig = In.ar(bus, numChan);
	new = RLPF.ar(sig, freq, rq);
	XFade2.ar(sig, new, xfade.madd(2, -1))
}, [\audiobus, ObjectSpec(1), \freq, \myrq, \amp]);

Instr(#[\busfx, \lpf], { |bus, numChan, freq, rq, xfade|
	var sig, new;
	sig = In.ar(bus, numChan);
	new = LPF.ar(sig, freq, rq);
	XFade2.ar(sig, new, xfade.madd(2, -1))
}, [\audiobus, ObjectSpec(1), \freq, \myrq, \amp]);



// some simple delays

Instr(#[\busfx, \singleDelay], { arg bus, numChan, delayClass, maxTime, time, mul, add;
	delayClass.ar(In.ar(bus, numChan), maxTime, time, mul, add)
}, [\audiobus, ObjectSpec(1), ObjectSpec(DelayL), #[0.25, 20], #[0.0001, 20]]);

Instr(#[\busfx, \combDelay], { arg bus, numChan, delayClass, maxTime, time, decay, mul, add;
	delayClass.ar(In.ar(bus, numChan), maxTime, time, decay, mul, add)
}, [\audiobus, ObjectSpec(1), ObjectSpec(DelayL), #[0.25, 20], #[0.0001, 20], #[0.0001, 20]]);

Instr(#[\busfx, \pingpong], { arg bus, numChan, bufnum, time, feedback, rotate;
	PingPong.ar(bufnum, In.ar(bus, numChan), time, feedback, rotate);
}, [\audiobus, ObjectSpec(1), #[0, 128, \lin, 1, 0], #[0, 20], #[0, 1], #[0, 20, \linear, 1, 1]]);



// simple ringmod

Instr(#[\busfx, \ring1], { arg bus, numChan, freq, mod_amp, xfade;
	var sig, new;
	sig = In.ar(bus, numChan);
	new = sig * SinOsc.ar(freq, 0, mod_amp);
	XFade2.ar(sig, new, xfade.madd(2, -1))
}, [\audiobus, ObjectSpec(1), \freq, \amp, \amp]);



////////// more complex delay effects

// chorus

Instr(#[\busfx, \chorus], { arg bus, numChan, predelay, speed, depth, ph_diff, xfade;
	var in, sig;
	in = In.ar(bus, numChan);
	in.isKindOf(Collection).if({
		sig = in.collect({ arg ch, i;	// ch is one channel
			DelayL.ar(ch, 0.5, SinOsc.kr(speed, ph_diff * i, depth, predelay));
		});
	}, {
		sig = DelayL.ar(in, 0.5, SinOsc.kr(speed, ph_diff, depth, predelay));
	});
	XFade2.ar(in, sig, xfade.madd(2, -1));
//	xf.value(in, sig, xfade)		// when felix has XOut working, this can be better
}, [\audiobus, ObjectSpec(1), #[0.0001, 0.2, \exponential, 0, 0.001], #[0.001, 10, \exponential], #[0.0001, 0.25, \exponential], #[0, 2pi], #[0, 1]]);


// based on Sound-on-Sound Synth Secrets:
// http://www.soundonsound.com/sos/jun04/articles/synthsecrets.htm
// allows mono-to-stereo

Instr(#[\busfx, \chorus2], { arg bus, numInChan, numOutChan, numDelays, predelay, speed, depth, ph_diff;
	var in, sig, mods;
	in = In.ar(bus, numInChan);
	mods = { |i|
		SinOsc.kr(speed * rrand(0.9, 1.1), ph_diff * i, depth, predelay);
	} ! (numDelays * numOutChan);
	sig = DelayL.ar(in, 0.5, mods);
	Mix(sig.clump(numOutChan))
}, [\audiobus, ObjectSpec(1), ObjectSpec(1), ObjectSpec(1), #[0.0001, 0.2, \exponential, 0, 0.001], #[0.001, 10, \exponential], #[0.0001, 0.25, \exponential], #[0, 2pi], #[0, 1]]);


Instr(#[\busfx, \chorus2band], { arg bus, numChan, predelay, speed, depth,
		ph_diff, crossover, xfade;
	var in, lo, hi;
	in = In.ar(bus, 1);
	lo = LPF.ar(in, crossover);
	hi = HPF.ar(in, crossover);
	lo = DelayL.ar(lo, 0.1, SinOsc.kr(speed, ph_diff, depth, predelay));
	hi = Array.fill(numChan, { |i|
		predelay = predelay + depth;
		DelayL.ar(hi, 0.5, SinOsc.kr(speed, ph_diff * i, depth, predelay));
	}).scramble;
	lo = lo + hi;
	XFade2.ar(in, lo, xfade.madd(2, -1))
}, [\audiobus, ObjectSpec(1), #[0.0001, 0.2, \exponential, 0, 0.001], #[0.001, 10, \exponential], #[0.0001, 0.25, \exponential], #[0, 2pi], \freq, #[0, 1]]);


Instr(#[\busfx, \chorus2band2], { arg bus, numChan, numDelays, predelay, speed, depth,
		ph_diff, crossover, xfade;
	var in, lo, hi, sig, mods, indexBase;
	in = In.ar(bus, 1);
	lo = LPF.ar(in, crossover);
	hi = HPF.ar(in, crossover);
	mods = { |i|
		SinOsc.kr(speed * rrand(0.9, 1.1), ph_diff * i, depth, predelay);	} ! (numDelays * numChan);
	sig = DelayL.ar(hi, 0.5, mods);
	indexBase = (0, numChan .. mods.size-1);
	hi = { |i| Mix(sig[indexBase + i]) } ! numChan;
	lo = lo + hi;
	XFade2.ar(in, lo, xfade.madd(2, -1))
}, [\audiobus, ObjectSpec(1), ObjectSpec(1), #[0.0001, 0.2, \exponential, 0, 0.001], #[0.001, 10, \exponential], #[0.0001, 0.25, \exponential], #[0, 2pi], \freq, #[0, 1]]);


// a feedback chorus -- this one is prone to strong comb effects

Instr(#[\busfx, \fbchorus], { arg bus, numChan, predelay, speed, depth, ph_diff, decaytime, xfade;
	var in, sig;
	in = In.ar(bus, numChan);
	in.isKindOf(Collection).if({
		sig = in.collect({ arg ch, i;	// ch is one channel
			CombL.ar(ch, 0.5, SinOsc.kr(speed, ph_diff * i, depth, predelay), decaytime);
		});
	}, {
		sig = CombL.ar(in, 0.5, SinOsc.kr(speed, ph_diff, depth, predelay), decaytime);
	});
	XFade2.ar(in, sig, xfade.madd(2, -1));
}, [\audiobus, ObjectSpec(1), #[0.002, 0.2, \exponential, 0, 0.01], #[0.001, 10, \exponential], #[0.0001, 0.25, \exponential], #[0, 2pi], #[0.001, 10, \exponential]]);



////////// reverbs

// better for long reverbs

Instr(#[\busfx, \rvb_allpass], { arg bus, numChan, maxDelay, preDelay, decay, numRefl, random;
	var sig, new;
	sig = In.ar(bus, numChan);
	new = sig;
	numRefl.do({
		new = AllpassN.ar(new, maxDelay, Array.fill(numChan, { random.rand }) + preDelay, decay);
	});
	new
}, [\audiobus, ObjectSpec(1), #[0.25, 2], #[0.001, 1.5, \exponential, 0, 0.05], #[0.01, 10, \exponential, 0, 0.25], ObjectSpec(4), #[0.001, 1, \exponential, 0, 0.03]]);

Instr(#[\busfx, \rvb_allpass2], { arg bus, numChan, maxDelay, preDelay, decay, numRefl, random;
	var sig, new, dlys;
	sig = In.ar(bus, numChan);
	new = sig;
	dlys = Array.fill(numRefl, {
		new = AllpassN.ar(new, maxDelay, Array.fill(numChan, { random.rand }) + preDelay, decay);	});
	Mix.ar(dlys * Array.series(numRefl, 1, (numRefl+1).reciprocal.neg))
}, [\audiobus, ObjectSpec(1), #[0.25, 2], #[0.001, 1.5, \exponential, 0, 0.05], #[0.01, 10, \exponential, 0, 0.25], ObjectSpec(4), #[0.001, 1, \exponential, 0, 0.03]]);


// better for tight reverbs

Instr(#[\busfx, \rvb_comb], { arg bus, numChan, maxDelay, preDelay, decay, numRefl, random;
	var sig, new;
	sig = In.ar(bus, numChan);
	new = Mix.arFill(numRefl, {
		CombC.ar(sig, maxDelay, Array.fill(numChan, { random.rand }) + preDelay, decay);
	});
	new
}, [\audiobus, ObjectSpec(1), #[0.25, 2], #[0.001, 1.5, \exponential, 0, 0.05], #[0.01, 10, \exponential, 0, 0.25], ObjectSpec(4), #[0.001, 1, \exponential, 0, 0.03]]);

)

////////// usage example: kick drum
// load the above definitions before running this example


s.boot;


// simple electro kick drum
SynthDef(\kik, { |basefreq = 50, envratio = 3, freqdecay = 0.02, ampdecay = 0.5, outbus = 0|
	var	fenv = EnvGen.kr(Env([envratio, 1], [freqdecay], \exp), 1) * basefreq,
		aenv = EnvGen.kr(Env.perc(0.005, ampdecay), 1, doneAction:2);
	Out.ar(outbus, SinOsc.ar(fenv, 0.5pi, aenv));
}).send(s);

m = MixerChannel(\kik);
PeakMonitor(m, 5);

r = fork {
	loop {	// the args here are to make sure the sound goes through the mixer
		s.sendBundle(0.1, [\s_new, \kik, -1, 0, m.synthgroup.nodeID, \outbus, m.inbus.index]);
		0.5.wait;
	}
};

// a method implemented in dewdrop_lib, to list each arg in the Instr with its spec
Instr.at([\busfx, \dist]).listArgs;

// MixerChannel-playfx makes the FxPatch and automatically substitutes the correct bus number
// you could also do
// p = FxPatch([\busfx, \companderd], [m.inbus.index, 1]).play(m.synthgroup, nil, m.inbus.index);

p = m.playfx(Instr.at([\busfx, \fbchorus]), [0, 1]);
p.gui;	// make a control panel for it

// now adjust the settings in the gui
// note that each slider has an appropriate range, as defined in the spec
// I like these, but you should experiment:

// thresh -> 0.337
// slopeBelow -> 1
// slopeAbove -> 0.307	// roughly 3:1 compression
// clampTime -> 0.00269
// relaxTime -> 0.0475
// postGain -> 1.887

// to prove it's doing something, turn the compander on and off
p.run(false);		// off
p.run(true);		// on -- sounds fatter, but the peak level is about the same

// clean up
r.stop;
p.free;
m.free;

// now that the settings are identified, you could use it in a piece like this
// the # button in the patch gui prints out all the values

FxPatch(#[\busfx, \companderd], #[16, 1, 0.33720930232558, 1, 0.30787334695492, 0.0026922339168174,
0.047581692465085, 1.887182729615]);
Platform.resourceDir

s.boot;
b = Buffer.read(s, "/Users/drew/src/patchbox_visualizer/assets/music/solo.wav");
(
x = { arg rate=1, inter=2;
    BufRd.ar(1, b, Phasor.ar(0, BufRateScale.kr(b) * rate, 0, BufFrames.kr(b)), 1, inter)
}.play;
)

(
SynthDef(\solo, { |outbus = 0, rate=1, inter=2|
	var buff = BufRd.ar(2, ≥b, Phasor.ar(0, BufRateScale.kr(b) * rate, 0, BufFrames.kr(b)), 1, inter);
	Out.ar(outbus, buff);
}).send(s);
)
m = MixerChannel(\solo);
s.sendBundle(0.1, [\s_new, \solo, -1, 0, m.synthgroup.nodeID, \outbus, m.inbus.index]);
p = m.playfx(Instr.at([\busfx, \dist]), [0, 1]);
p.set(\preGain, 5.3)
p.set(\postGain, 0.3)

z = m.playfx(Instr.at([\busfx, \chorus]), [0, 1]);

p.set(\decaytime, 0.1)
z.set(\speed, 0.64)
z.set(\xfade, 0.4)
z.set(\depth, 0.1)


z.gui;	// make a control panel for it

p = m.playfx(Instr.at([\busfx, \dist]), [0, 1]);
m.playfx(FxPatch(#[\busfx, \companderd], #[16, .....]));


