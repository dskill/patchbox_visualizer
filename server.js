const crypto = require('crypto');
const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// static files
app.use(express.static('public'))

const server = createServer(app);
const wss = new WebSocket.Server({ server });
wss.binaryType = 'arraybuffer';

wss.on('connection', function(ws) {
  console.log("client joined.");

  // list the number of clients connected
  console.log("clients connected: " + wss.clients.size);

  // send "hello world" interval
  //const textInterval = setInterval(() => ws.send("hello world!"), 100);

  // send random bytes interval
  //const binaryInterval = setInterval(() => ws.send(crypto.randomBytes(8).buffer), 110);
  // create a float array from the random bytes
  /*
  const binaryInterval = setInterval(() => {
    let floatArray = new Float32Array(crypto.randomBytes(4 * 256).buffer);
    // send the float array
    ws.send(floatArray.buffer);
  }, 110);
  */

  //const binaryInterval = setInterval(() => ws.send( [1.23,2.23,432,.231], 110));

  ws.on('message', function(data) {
    if (typeof(data) === "string") {
      // client sent a string
      //console.log("string received from client -> '" + data + "'");

    } else {
      //console.log("binary received from client -> " + Array.from(data).join(", ") + "");
      //console.log(data);
    }

    // pass the message to all clients
    wss.clients.forEach(function(client) {
      if (typeof(data) === "string") {
        client.send(data);
      } else {
        client.send(Array.from(data));
        console.log('binary data: ' + Array.from(data));
      }
    });
  });

  ws.on('close', function() {
    console.log("client left.");
    //clearInterval(textInterval);
    //clearInterval(binaryInterval);
  });
});

server.listen(port, function() {
  // let people know what IP were on
  const os = require('os');
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e.
        return;
      }
      console.log("server IP: " + iface.address + ":" + port);
    });
  });
});

// serve up a static web page 
app.get('/', function(req, res){
  // log the request
  console.log("request: " + req.url);
  console.log("root:", __dirname + "/");
  
  res.sendFile('index.html', { root: __dirname + "/" } );
});
