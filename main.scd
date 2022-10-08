
~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
~o.sendMsg("/hello", "there");    // send the application the message "hello" with the
s.boot;
(
s.waitForBoot{


// from the wonderful forum post:
// https://scsynth.org/t/is-it-possible-to-get-the-output-of-a-ugen-as-an-array-of-floats-audio-buffer/6539/14

var chunkSize = 512;
var numChunks = 16;
var relay_buffer0 = Buffer.alloc(s, chunkSize * numChunks);
var relay_buffer1 = Buffer.alloc(s, chunkSize * numChunks);

var synth = {
	//var sigB = SinOsc.ar(220);
	//var sig = MulAdd(SinOsc.ar(200), 0.1,0);
	var sig = SoundIn.ar(0);
	//var sigC =  MulAdd( Dust.ar(10000), 0.01, 0) ;
	//var sigD = MulAdd(SinOsc.ar(2000), 0.2,0);
	var sig_reverb = FreeVerb.ar(sig, 1.0, 0.9, 0.5, 2.0);
	//sig = sigB; //sigA + sigC; //sigA + sigB; //{Mix.new([sigA,sigB])};

	var phase = Phasor.ar(0, 1, 0, chunkSize);
	// btw this is already guaranteed to be only a single-sample trigger

	// Trig.ar is not needed
	var trig = HPZ1.ar(phase) < 0;
	var partition = PulseCount.ar(trig) % numChunks;

	var phase_reset_trig = Impulse.ar(30);
		//sig =  SoundIn.ar(0);

	BufWr.ar(sig, relay_buffer0, phase + (chunkSize * partition));
	BufWr.ar(sig_reverb, relay_buffer1, phase + (chunkSize * partition));


	//SendReply.ar(trig, '/buffer_refresh', partition);
	SendReply.ar(phase_reset_trig, '/buffer_refresh', partition);


	// what audio to return from the function
	sig_reverb + sig;
}.play;

OSCdef(\k, { |msg|
	// the partition to retrieve is the one BEFORE the latest transition point
	var partition = (msg[3] - 1) % numChunks;

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

} // end wait for boot
);


