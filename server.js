const crypto = require('crypto');
const express = require('express');
const { createServer } = require('http');
const WebSocket = require('ws');
const OSC = require('osc-js');
const ip = require("ip");
const sc = require("supercolliderjs");
const myIP = ip.address();
const bodyParser = require('body-parser')
const { spawn } = require('child_process')

console.log('IP: ' + myIP);
//const myIP = 'localhost'
// if myIP is localhost, like below, then things will work w/out wifi
// otherwise the IP in the browser location bar is wrong and it doesn't
// this should be fixed at some point. Maybe by using the ip module...
//const myIP = "127.0.0.1";
const app = express();
const port = 3000;

//
// express server for static files
//
app.use(express.static('build'))

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json())

const server = createServer(app);

// boot up scsynth server
var scPath;
if (process.platform === 'win32') {
  scPath = "C:\\Program Files\\SuperCollider-3.13.0-rc1\\scsynth";
} else if (process.platform === 'darwin') {
  scPath = "/Applications/SuperCollider/SuperCollider.app/Contents/MacOS/scsynth";
} else if (process.platform === 'linux') {
  scPath = "/usr/local/bin/scsynth";
}


let scserver = null;
sc.server.boot({ scsynth: scPath }).then((server) => {
  scserver = server
  console.log("scserver", scserver) 
})


/*
// DOESNT WORK
sc.lang.boot({debug: false}).then(function(sclang) {
 sclang.executeFile("./test.scd")
});
*/


const sclang = spawn('sclang', ['sc/main.scd'])

sclang.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`)
})

sclang.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`)
})

sclang.on('close', (code) => {
  console.log(`child process exited with code ${code}`)
})

// static express server
server.listen(port, function ()
{
  // let people know what IP were on
  const os = require('os');
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname)
  {
    ifaces[ifname].forEach(function (iface)
    {
      if ('IPv4' !== iface.family || iface.internal !== false)
      {
        // skip over internal (i.e.
        return;
      }
      console.log("express server running on: " + iface.address + ":" + port);
    });
  });
});

// serve up a static web page 
app.get('/', function (req, res)
{
  // log the request
  console.log("request: " + req.url);
  console.log("root:", __dirname + "/");
  res.sendFile('index.html', { root: __dirname + "/" });
});

// get the IP of this machine
// due to CORS, it only works from localhost (in the current setup) 
app.get('/ip', function (req, res)
{
  // log the request
  console.log("request: " + req.url);
  // respond with the IP in JSON format
  res.json({ ip: myIP });
});

// create a route for posting sclang commands to the server
app.post('/synthDef', function (req, res)
{
  // access the JSON data in the request body
  var synthDef = req.body.synthDef
  console.log('synthDef', synthDef)
  let server = scserver
  
  // respond with the IP in JSON format
  // set the sc path to the supercollider app
    const def = server.synthDef(
      "bubbles",
      synthDef,
    );

    server.synth(def)

    setInterval(() =>
    {
      server.synth(def, {
        wobble: Math.random() * 10,
        innerWobble: Math.random() * 16,
        releaseTime: Math.random() * 4 + 2,
      });
    }, 4000);
});

//
// OSC bridge server
//
// completely confused about which of these options are relevant
let options = {

  receiver: 'udp',         // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
  // this is this node server, listening to UDP messages from supercollider
  udpServer: {
    host: 'localhost',    // @param {string} Hostname of udp server to bind to
    port: 9912,          // @param {number} Port of udp server to bind to
    exclusive: false      // @param {boolean} Exclusive flag
  },
  // this is this node server, listening to WS messages from the browser
  wsServer: {
    host: 'localhost', // 'localhost',    // @param {string} Hostname of WebSocket server
    port: 8080,            // @param {number} Port of WebSocket server
    //secure: true
  },
  // this is the supercollider client, where we send messages to supercollider
  udpClient: {
    host: 'localhost',    // @param {string} Hostname of udp client for messaging
    port: 57120           // @param {number} Port of udp client for messaging
  }
}

const osc = new OSC({ plugin: new OSC.BridgePlugin(options) })
osc.open()

// listen for invoing messages
osc.on('*', message =>
{
  /*
  console.log('MESSAGE');
  console.log(message);
 
  if (message.address == "/reverbMix") {
     console.log(message);
  }
  */
})

// useful for debugging
// sent messages frequently when socket is ready
osc.on('open', () =>
{
  setInterval(() =>
  {
    // osc.send(new OSC.Message('/hello_udp', Math.random()), { receiver: 'udp' })  ;//, { receiver: 'udp' })
    // osc.send(new OSC.Message('/hello_websocket', Math.random()), { receiver: 'ws' })  ;//, { receiver: 'udp' })
  }, 1000)
})



