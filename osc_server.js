const OSC = require('osc-js');

// completely confused about which of these options are relevant
let options = {
  receiver: 'ws',         // @param {string} Where messages sent via 'send' method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
    udpServer: {
      host: 'localhost',    // @param {string} Hostname of udp server to bind to
      port: 9912,          // @param {number} Port of udp server to bind to
      exclusive: false      // @param {boolean} Exclusive flag
    },
    udpClient: {
      host: 'localhost',    // @param {string} Hostname of udp client for messaging
      port: 9912           // @param {number} Port of udp client for messaging
    },
    wsServer: {
      host: 'localhost',    // @param {string} Hostname of WebSocket server
      port: 8080            // @param {number} Port of WebSocket server
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

/*
osc.on('open', () => {
  setInterval(() => {
     osc.send(new OSC.Message('/response', Math.random()))
  }, 1000)
})
*/
