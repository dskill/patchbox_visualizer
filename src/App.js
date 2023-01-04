import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree} from '@react-three/fiber'
import { Leva, useControls } from 'leva'
//https://github.com/pmndrs/drei/#performance -->
import { AdaptiveDpr } from '@react-three/drei' 

import { OSCNetworkBridge } from './OSCNetworkBridge.js'
import { WaveformTexture } from './WaveformTexture'

import FullScreenEffect from './Effects/FullScreenEffect'
import DistortionEffect from './Effects/DistortionEffect'
import ScopeEffect from './Effects/ScopeEffect'
import ScopeDistortionEffect from './Effects/ScopeDistortionEffect.js'
import GlitchDistortionEffect from './Effects/GlitchDistortionEffect.js'

let resolution = 512;
let oscNetworkBridge = new OSCNetworkBridge(resolution, 'localhost');
let waveformTexture = new WaveformTexture(resolution);

export default function App()
{
  const searchParams = new URLSearchParams(window.location.search)
  //let url_param_gui = searchParams.get('gui')
  let url_param_allow_server = searchParams.get('allow_server')
  const effects = [ "Debug", "Glitch Distortion", "Distortion", "Scope", "Scope Distortion"]
  const [currentEffect, setEffect] = useState(0);
  const [waveformRms, setWaveformRms] = useState([0, 0, 0, 0]);
  const [waveformRmsAccum, setWaveformRmsAccum] = useState([0, 0, 0, 0]);
  const [dpr, setDpr] = useState(1.0)
  const [connected, setConnected] = useState(false)

  let controls = {
      effects: {
      value: effects[0],
      options: effects,
      onChange: (value) =>
      {
        setEffect(value)
      }
    }
  }
  // TODO: allow server does not work currently.  The issue is that the osc bridge on server.js is only listening to localhost
  // so if you use the IP of the server from a remote machine, the connection fails.  
  if (url_param_allow_server != null) {
    controls["server"] = {
      value: window.location.hostname,
      onChange: (value) =>
      {
        oscNetworkBridge = new OSCNetworkBridge(resolution, value);
      }
    }
  }

  let props = useControls(controls)
  props.waveformTexture = waveformTexture
  props.waveformRms = waveformRms
  props.waveformRmsAccum = waveformRmsAccum
  props.oscNetworkBridge = oscNetworkBridge
  props.setDpr = setDpr

  useEffect(() =>
  {
    oscNetworkBridge.osc_connection.on('open', () =>
    {
      setConnected(true)
    })
  }, [])
  
  function UpdateLoop({ waveformRms })
  {
    useFrame((state, delta, xrFrame) =>
    {
      // This function runs at the native refresh rate inside of a shared render-loop
      oscNetworkBridge.update(delta)
      waveformTexture.update(oscNetworkBridge.waveformArray0, oscNetworkBridge.waveformArray1)
      setWaveformRms(waveformTexture.waveformRms);
      setWaveformRmsAccum(waveformTexture.waveformRmsAccum);
    })
  }

  return ( 
    <>
      <Leva
        //fill // default = false,  true makes the pane fill the parent dom node it's rendered in
        //flat // default = false,  true removes border radius and shadow
        //oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
        //hideTitleBar // default = false, hides the GUI header
        //collapsed // default = false, when true the GUI is collpased
        //hidden={url_param_gui == null} // default = false, when true the GUI is hidden
      />
      {connected ? 
      <Canvas linear dpr={dpr}>
        {(() =>
        {
          switch (currentEffect)
          {
            case 'Debug':
              return <FullScreenEffect {...props} />
            case 'Distortion':
              return <DistortionEffect {...props} />
            case 'Scope':
              return <ScopeEffect {...props} />
            case 'Scope Distortion':
              return <ScopeDistortionEffect {...props} />
            case 'Glitch Distortion':
                return <GlitchDistortionEffect {...props} />
            default:
              return null
          }
        })()}

        {/*
          <ambientLight />
                <mesh position={[0,0,0]} scale={[1, -1, 1]}>
                    <planeBufferGeometry attach="geometry" args={[16, 9, 1]} />
                    <meshBasicMaterial attach="material" map={waveformTexture.texture} />
               </mesh>
        */}

        <UpdateLoop {...props} />
      </Canvas>
      : <h1>Connecting...</h1>
    }
    </>
  )

}
