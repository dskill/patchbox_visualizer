const OSC = require('osc-js');
var ip = require("ip");
var myIP = ip.address();
console.log("Running websocket server on: " + myIP);

// completely confused about which of these options are relevant
let options = {
  receiver: 'udp',         // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
    udpServer: {
      host: 'localhost',    // @param {string} Hostname of udp server to bind to
      port: 9912,          // @param {number} Port of udp server to bind to
      exclusive: false      // @param {boolean} Exclusive flag
    },
    wsServer: {
      host: myIP,    // @param {string} Hostname of WebSocket server
      port: 8080            // @param {number} Port of WebSocket server
    },
    udpClient: {
      host: 'localhost',    // @param {string} Hostname of udp client for messaging
      port: 57120           // @param {number} Port of udp client for messaging
    }
  }

  /*
options = {
  //  host: '192.168.50.125',    // @param {string} Hostname of WebSocket server
    port: 8080           // @param {number} Port of WebSocket server
}
*/
 //const osc = new OSC({ plugin: new OSC.WebsocketServerPlugin(options) })
  //osc.open()

  const osc = new OSC({ plugin: new OSC.BridgePlugin(options) })
  osc.open()
  
// listen for invoing messages
osc.on('*', message => {
 //console.log('MESSAGE');
 //console.log(message);
})

// sent messages frequently when socket is ready


osc.on('open', () => {
  setInterval(() => {
     osc.send(new OSC.Message('/hello_udp', Math.random()), { receiver: 'udp' })  ;//, { receiver: 'udp' })
     osc.send(new OSC.Message('/hello_websocket', Math.random()), { receiver: 'ws' })  ;//, { receiver: 'udp' })
  }, 1000)
})
