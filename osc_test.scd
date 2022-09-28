b = NetAddr.new("127.0.0.1", 9912);    // create the NetAddr
b.sendMsg("/hello", "there");    // send the application the message "hello" with the parameter "there"

b.sendMsg("/test", [1.23, 23.1,23.0]);
v = Array.fill(3, {1.0.rand2});
v.postln;
x =  [1.23, 23.1,23.0];
x.postln;
// print x

b.sendMsg("/testv", x);


