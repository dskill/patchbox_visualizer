
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
