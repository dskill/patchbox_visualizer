import OSC from 'osc-js';

export class OSCNetworkBridge {
  osc_connection;
  osc_updates = 0;
  osc_samples = 0;
  osc_update_timer = 0;
  waveform_update_timer = 0;
  waveformArray0 = [];
  waveformArray1 = [];
  osc_bridge_ip;

  constructor(waveformResolution = 512) {
    this.waveformArray0.length = waveformResolution
    this.waveformArray1.length = waveformResolution
    this.osc_bridge_ip = window.location.hostname;

    const options = {
      host: this.osc_bridge_ip,    // @param {string} Hostname of WebSocket server
      port: 8080           // @param {number} Port of WebSocket server
    }

    this.osc_connection = new OSC({ plugin: new OSC.WebsocketClientPlugin(options) })

    this.osc_connection.on('*', (message) => {
      const args = message.args;
      if (message.address === '/waveform0') {
        this.waveformArray0 = this.waveformArray0.concat(args);
        this.waveformArray0.splice(0, args.length);

        this.osc_updates += 1;
        this.osc_samples += args.length;
      } else if (message.address === '/waveform1') {
        this.waveformArray1 = this.waveformArray1.concat(args);
        this.waveformArray1.splice(0, args.length);
      } else {
        console.log('non waveform message:', message.address, message.args);
      }
    });

    this.osc_connection.on('/{foo,bar}/*/param', (message) => {
      console.log(message.args);
    });

    this.osc_connection.on('open', () => {
      // const message = new OSC.Message('/test', 12.221, 'hello');
      // osc.send(message);
      this.osc_connected = true;
      // initialize osc values
      /*
      for (const key in params) {
        this.osc_connection.send(new OSC.Message(`/${key}`, params[key]));
      }
      */
    });
    this.osc_connection.open();
  }

  update(deltaTime) {
    this.osc_update_timer += deltaTime;
    this.waveform_update_timer += deltaTime;
      if (this.osc_update_timer > 1.0) {
        console.log("OSC SAMPLES: " + this.osc_samples);
        console.log("OSC FPS: " + this.osc_updates / this.osc_update_timer);
        this.osc_update_timer = 0;
        this.osc_updates = 0;
        this.osc_samples = 0;
      }
  }

  setResolution(resolution) {
    this.waveformArray0.length = resolution;
    this.waveformArray1.length = resolution;
  }

  
   send(name, value) {
    if (this.osc_connected ) {
      this.osc_connection.send(new OSC.Message('/' + name, value));
      console.log("sending osc message: " + name + " " + value);
    }
  }
}