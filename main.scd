
~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
~o.sendMsg("/hello", "there");    // send the application the message "hello" with the
s.boot;
(
s.waitForBoot{
var relay_buffer0 = Buffer.alloc(s, 128);
var relay_buffer1 = Buffer.alloc(s, 128);
var floatArrayToList = {
	arg arr;
	var list = List.new(arr.size);
	for (0, arr.size-1, { arg i; list.add(arr[i]) });
	list;
	//list.postln;
};

{
	var sigA = MulAdd(SinOsc.ar(200), 0.1,0);
	var sigB = SoundIn.ar(0);
	var sigC =  MulAdd( Dust.ar(10000), 0.01, 0) ;
	var sigD = MulAdd(SinOsc.ar(2000), 0.2,0);
	var sig_reverb = FreeVerb.ar(sigB, 1.0, 0.9, 0.5, 2.0);
	var sig = sigB; //sigA + sigC; //sigA + sigB; //{Mix.new([sigA,sigB])};
	var phase = Phasor.ar(0, BufRateScale.kr(relay_buffer0), 0, BufFrames.kr(relay_buffer0));
	//var phase_reset_trig = Trig.ar(Slope.ar(phase) < 0);
	var phase1 = Phasor.ar(0, BufRateScale.kr(relay_buffer1), 0, BufFrames.kr(relay_buffer1));

	 var phase_reset_trig = Impulse.ar(40);
	BufWr.ar(sig, relay_buffer0, phase);
	BufWr.ar(sig_reverb, relay_buffer1, phase);
	SendReply.ar(phase_reset_trig, '/buffer_refresh', 1);
	sig_reverb + sig;
}.play;

OSCdef(\k, {
	// |msg|
	relay_buffer0.loadToFloatArray(action: {|b|
        //b.postln;
        // ~some_net_addr.send(b);
		~o.sendMsg(\waveform0, *floatArrayToList.value(b));

    });

	relay_buffer1.loadToFloatArray(action: {|b|
        //b.postln;
        // ~some_net_addr.send(b);
		~o.sendMsg(\waveform1, *floatArrayToList.value(b));

    });
}, '/buffer_refresh');
} // end wait for boot
);


// OTHER STUFF
//this works
/*
~msg =  [\n_sets, 2.231, 0.2, 0.233];
~o.sendMsg(*~msg);

// this ends up as a weird uint8???
x =  [1.11, 2.22,3.33];
x.asFloatArray.postln;
~o.sendMsg(\sand, x);

(
OSCdef(\listener, {|msg|
    var data = msg[3..];
    data.postln;
    ~testNetAddr.sendMsg("data", data);
}, '/analysis');
)

(
~floatArrayToList = {
	arg arr;
	var list = List.new(arr.size);
	for (0, arr.size-1, { arg i; list.add(arr[i]) });
	list.postln;
}
)

)
o = x.asRawOSC.postln
o.postln

~farr = FloatArray[13.37, 3.3333333, 123.456];
~farr.asArray.postln
*/
