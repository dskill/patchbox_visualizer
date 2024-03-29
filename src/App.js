import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Perf } from 'r3f-perf';
import { Leva, useControls } from 'leva'
//https://github.com/pmndrs/drei/#performance -->
import { AdaptiveDpr } from '@react-three/drei'

import { OSCNetworkBridge } from './OSCNetworkBridge.js'
import { WaveformTexture } from './WaveformTexture'

import DistortionEffect from './Effects/DistortionEffect'
import ScopeEffect from './Effects/ScopeEffect'
import ScopeDistortionEffect from './Effects/ScopeDistortionEffect.js'
import GlitchDistortionEffect from './Effects/GlitchDistortionEffect.js'
import PitchFollowEffect from './Effects/PitchFollowEffect.js'
import BlockTestEffect from './Effects/BlockTestEffect.js'
import PitchFollowLissajousEffect from './Effects/PitchFollowLissajousEffect.js'
import WahDelayEffect from './Effects/WahDelayEffect.js'

// MUI
import { IconButton, Button } from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';

let oscNetworkBridge
let waveformTexture
let resolution = 512

// make sure if we hot reload during development, we don't accidentally make multiple oscNetworkBridge instances
if (oscNetworkBridge != null)
{
  oscNetworkBridge.destroy()
}

oscNetworkBridge = new OSCNetworkBridge(resolution, 'localhost');
waveformTexture = new WaveformTexture(resolution);

function DebugQuad({ tex })
{
  return (
    <mesh scale={[1, 1, 1]} position={[0, 0, 1]}>
      <planeGeometry />
      <meshBasicMaterial color={'white'} map={tex} />
    </mesh>
  )
}

export default function App()
{
  const searchParams = new URLSearchParams(window.location.search)
  //let url_param_gui = searchParams.get('gui')
  let url_param_allow_server = searchParams.get('allow_server')
  const [waveformRms, setWaveformRms] = useState([0, 0, 0, 0]);
  const [waveformRmsAccum, setWaveformRmsAccum] = useState([0, 0, 0, 0]);
  const [waveform0, setWavefrom0] = useState([]);
  const [waveform1, setWavefrom1] = useState([]);

  const [dpr, setDpr] = useState(1.0)
  const [connected, setConnected] = useState(true)
  const [waveformTex, setWaveformTex] = useState(null)
  const effectOptions = ["Glitch Distortion", "Distortion", "Scope", "Scope Distortion", "Pitch Follow", "Wah Delay", "Block Test"]

  const [{ currentEffect, ip }, setUI] = useControls(() => ({
    ip: {
      value: 'localhost',
      transient: false,
      editable: false,
    },
    currentEffect: {
      value: 'Distortion',
      transient: false,
      options: effectOptions,
    },
    resolution: {
      value: 1024,
      options: [32, 64, 128, 256, 512, 1024, 2048, 4096],
      onChange: (value) =>
      {
        oscNetworkBridge.setResolution(value)
        waveformTexture.setResolution(value)
        setWaveformTex(waveformTexture.texture)
      }
    },
    downsample: {
      value: 8,
      options: [1, 2, 4, 8, 16, 32, 64, 128, 256],
      onChange: (value) =>
      {
        oscNetworkBridge.send("chunkDownsample", value)
      }
    },
  }))


  // TODO: allow server does not work currently.  The issue is that the osc bridge on server.js is only listening to localhost
  // so if you use the IP of the server from a remote machine, the connection fails.  
  /*
  if (url_param_allow_server != null)
  {
    useControls({
      server: {
        value: 'localhost', //window.location.hostname,
        transient: false,
        onChange: (value) =>
        {
          // destroy the existing bridge if there is one
          if (oscNetworkBridge != null)
          {
            oscNetworkBridge.destroy()
          }
          oscNetworkBridge = new OSCNetworkBridge(resolution, value);
        }
      }
    })
  }
  */

  let props = {}
  props.waveformTexture = waveformTexture
  props.waveformRms = waveformRms
  props.waveformRmsAccum = waveformRmsAccum
  props.oscNetworkBridge = oscNetworkBridge
  props.setDpr = setDpr
  props.currentEffect = currentEffect
  props.setUI = setUI
  props.waveformTex = waveformTex
  props.effectOptions = effectOptions
  props.waveform0 = waveform0
  props.waveform1 = waveform1

  useEffect(() =>
  {
    oscNetworkBridge.osc_connection.on('open', () =>
    {
      setConnected(true)
    })

    // get the IP to display
    console.log("retrieving IP from ", window.location.hostname + '/ip')
    fetch(window.location.hostname + '/ip')
      .then(response => response.json())
      .then(
        data => props.setUI({ ip: data.ip })
      );

  }, [])

  function UpdateLoop()
  {
    useFrame((state, delta, xrFrame) =>
    {
      // This function runs at the native refresh rate inside of a shared render-loop
      oscNetworkBridge.update(delta)
      // right now the osc bridge is sending data every .1 seconds. Help with performance.
      // but should be smoothed in super collider
      //oscNetworkBridge.sendQueue();
      waveformTexture.update(oscNetworkBridge.waveformArray0, oscNetworkBridge.waveformArray1)
      setWaveformRms(waveformTexture.waveformRms);
      setWaveformRmsAccum(waveformTexture.waveformRmsAccum);
      setWavefrom0(oscNetworkBridge.waveformArray0)
      setWavefrom1(oscNetworkBridge.waveformArray1)
    })
  }

  const swipe_right = () =>
  {
    console.log('swipe_right')
    let index = props.effectOptions.indexOf(props.currentEffect) + 1
    if (index > props.effectOptions.length - 1)
    {
      index = 0
    }
    props.setUI({ currentEffect: props.effectOptions[index] })
  }

  const swipe_left = () =>
  {
    console.log('swipe_left')
    let index = props.effectOptions.indexOf(props.currentEffect) - 1
    if (index < 0)
    {
      index = props.effectOptions.length - 1
    }
    props.setUI({ currentEffect: props.effectOptions[index] })
  }

  const divStyle = {
    width: '100%',
    height: '100%',
    margin: '0px',
    padding: '0px',
    // required to allow touch events to behave
    touchAction: 'none',
  };


  if (connected)
  {
    return (
      <>
        <Leva
        //fill // default = false,  true makes the pane fill the parent dom node it's rendered in
        //flat // default = false,  true removes border radius and shadow
        //oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
        //hideTitleBar // default = false, hides the GUI header
        //collapsed // default = false, when true the GUI is collpased
        //hidden={url_param_gui == null} // default = false, when true the GUI is hidden
        //hidden="true"
        />
        <div style={divStyle}>

          <IconButton size="large" variant="outlined" color="primary" sx={{ display: 'grid', width: 200, height: 200, padding: 1, margin: 2, position: 'absolute', alignItems: 'center', justifyContent: 'center', left: -10, bottom: -10, zIndex: 1, opacity: 0.1 }} onClick={swipe_left}>
            <ArrowLeftIcon sx={{ width: 150, height: 150 }} />
          </IconButton>

          <IconButton size="large" variant="outlined" color="primary" sx={{ display: 'grid', width: 200, height: 200, padding: 1, margin: 2, position: 'absolute', alignItems: 'center', justifyContent: 'center', right: -10, bottom: -10, zIndex: 1, opacity: 0.1 }} onClick={swipe_right}>
            <ArrowRightIcon sx={{ width: 150, height: 150 }} />
          </IconButton>

          <Canvas linear dpr={dpr}>
            <Perf position="top-left" minimal="true"/>
            {(() =>
            {
              switch (currentEffect)
              {
                case 'Distortion':
                  return <DistortionEffect {...props} />
                case 'Scope':
                  return <ScopeEffect {...props} />
                case 'Scope Distortion':
                  return <ScopeDistortionEffect {...props} />
                case 'Glitch Distortion':
                  return <GlitchDistortionEffect {...props} />
                case 'Wah Delay':
                  return <WahDelayEffect {...props} />
                case 'Pitch Follow':
                  return <PitchFollowLissajousEffect {...props} />
                case 'Block Test':
                  return <BlockTestEffect {...props} />
                default:
                  return null
              }
            })()}

            {/*<DebugQuad tex={waveformTex} />*/}
            <UpdateLoop />
          </Canvas>
        </div>
      </>
    ) 
  } else return (
    <h1>Connecting...</h1>
  )
}