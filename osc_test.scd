~o = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
~o.sendMsg("/hello", "there");    // send the application the message "hello" with the parameter "there"

//this works
~msg =  [\n_sets, 2.231, 0.2, 0.233];
~o.sendMsg(*~msg);

// this ends up as a weird uint8???
x =  [1.11, 2.22,3.33];
x.asFloatArray.postln;
~o.sendMsg(\sand, x);

s.boot;
(
var relay_buffer = Buffer.alloc(s, 512);
var floatArrayToList = {
	arg arr;
	var list = List.new(arr.size);
	for (0, arr.size-1, { arg i; list.add(arr[i]) });
	list;
	//list.postln;
};

{
	var sigA = SinOsc.ar(2);
	var sigB = SoundIn.ar(0);
	var sigC = Dust.ar(1000);
	var sig = sigC; //sigA + sigB; //{Mix.new([sigA,sigB])};
	var phase = Phasor.ar(0, BufRateScale.kr(relay_buffer), 0, BufFrames.kr(relay_buffer));
	//var phase_reset_trig = Trig.ar(Slope.ar(phase) < 0);
	 var phase_reset_trig = Impulse.ar(40);

	BufWr.ar(sig, relay_buffer, phase);
	SendReply.ar(phase_reset_trig, '/buffer_refresh', 1);
	sig;
}.play;

OSCdef(\k, {
	// |msg|
	relay_buffer.loadToFloatArray(action: {|b|
        //b.postln;
        // ~some_net_addr.send(b);
		~o.sendMsg(\waveform, *floatArrayToList.value(b));
    });
}, '/buffer_refresh');

)

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

(
var arr = FloatArray[13.37, 3.3333333, 123.456];
var list = List.new(arr.size);
for (0, arr.size-1, { arg i; list.add(arr[i]) });
list.postln;
//o = NetAddr.new("127.0.0.1", 6969);
~o.sendMsg("/LoadAudioData", *list);
)


