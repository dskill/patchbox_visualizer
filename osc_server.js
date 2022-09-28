const OSC = require('osc-js');

const options = {
    udpServer: {
      port: 9912
    }
  }
  
  const osc = new OSC({ plugin: new OSC.BridgePlugin(options) })
  osc.open()
  

// listen for invoing messages
osc.on('*', message => {
 console.log('MESSAGE');
 console.log(message);
  console.log(message.args)
})

// sent messages frequently when socket is ready

/*
osc.on('open', () => {
  setInterval(() => {
     osc.send(new OSC.Message('/response', Math.random()))
  }, 1000)
})
*/