import OSC from 'osc-js';

export class OSCNetworkBridge
{
  is_connected = false;
  osc_connection;
  osc_updates = 0;
  osc_samples = 0;
  osc_update_timer = 0;
  waveform_update_timer = 0;
  waveformArray0 = [];
  waveformArray1 = [];
  queue = [];

  constructor(waveformResolution = 512, ip)
  {  
    this.waveformArray0.length = waveformResolution
    this.waveformArray1.length = waveformResolution

    const options = {
      host: ip,    // @param {string} Hostname of WebSocket server
      port: 8080,           // @param {number} Port of WebSocket server
      //secure: true
    }

    this.osc_connection = new OSC({ plugin: new OSC.WebsocketClientPlugin(options) })

    this.osc_connection.on('*', (message) =>
    {
      const args = message.args;
      if (message.address === '/waveform0')
      {
        this.waveformArray0 = this.waveformArray0.concat(args);
        this.waveformArray0.splice(0, args.length);

        this.osc_updates += 1;
        this.osc_samples += args.length;
      } else if (message.address === '/waveform1')
      {
        this.waveformArray1 = this.waveformArray1.concat(args);
        this.waveformArray1.splice(0, args.length);
      } else
      {
        console.log('non waveform message:', message.address, message.args);
      }
    });

    this.osc_connection.on('/{foo,bar}/*/param', (message) =>
    {
      console.log(message.args);
    });

    this.osc_connection.on('open', () =>
    {
      // const message = new OSC.Message('/test', 12.221, 'hello');
      // osc.send(message);
      this.is_connected = true;
      console.log('OSC connection opened');
      // initialize osc values
      /*
      for (const key in params) {
        this.osc_connection.send(new OSC.Message(`/${key}`, params[key]));
      }
      */
    });
    console.log('trying to open osc connection')
    this.osc_connection.open();
  }

  update(deltaTime)
  {
    this.osc_update_timer += deltaTime;
    this.waveform_update_timer += deltaTime;
    if (this.osc_update_timer > .1)
    {
      console.log("OSC SAMPLES: " + this.osc_samples);
      console.log("OSC FPS: " + this.osc_updates / this.osc_update_timer);
      this.osc_update_timer = 0;
      this.osc_updates = 0;
      this.osc_samples = 0;
      console.log("Sending OSC messages: " + this.queue.length);
      this.sendQueue();
    }
  }

  setResolution(resolution)
  {
    this.waveformArray0.length = resolution;
    this.waveformArray1.length = resolution;
  }

  // Queuing up OSC messages makes sure they are only sent once per frame. Sometimes the UI udpates more often than that.
  addToQueue(name, value)
  {
    // if the key exists, update it. otherwise, add it.
    for (let i = 0; i < this.queue.length; i++)
    {
      if (this.queue[i].name === name)
      {
        this.queue[i].value = value;
        return;
      }
    }
    this.queue.push({name: name, value: value});
  }
 
  sendQueue()
  {
    if (this.is_connected) {
      for (let i = 0; i < this.queue.length; i++)
      {
        this.osc_connection.send(new OSC.Message('/' + this.queue[i].name, this.queue[i].value));
        //console.log("sending osc message: " + this.queue[i].name + " " + this.queue[i].value);
      }
    }
    this.queue = [];
  }

  send(name, value)
  {
    this.addToQueue(name, value);
    /*
    if (this.is_connected)
    {
      this.osc_connection.send(new OSC.Message('/' + name, value));
      console.log("sending osc message: " + name + " " + value);
    } else
    {
      console.log("not connected to osc server");
    }
    */
  }

  destroy() {
    this.osc_connection.close();
  }
}