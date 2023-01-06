import { useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
//https://github.com/pmndrs/drei/#performance -->
import { AdaptiveDpr } from '@react-three/drei'
import { useDrag, useMove} from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'

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
  const [waveformRms, setWaveformRms] = useState([0, 0, 0, 0]);
  const [waveformRmsAccum, setWaveformRmsAccum] = useState([0, 0, 0, 0]);
  const [dpr, setDpr] = useState(1.0)
  const [connected, setConnected] = useState(true)
  const [waveformTex, setWaveformTex] = useState(null)
  const effectOptions = ["Debug", "Glitch Distortion", "Distortion", "Scope", "Scope Distortion"]
  const [{ x, y }, setXY] = useState({ x: 0, y: 0 })
  
  const bind =useDrag(({ down, xy: [x, y] })  => 
  setXY({ x: x / window.innerWidth, y: 1.0 - y / window.innerHeight }), 
  {
    pointer: {touch: true} 
  })
  

  const [{ currentEffect }, setUI] = useControls(() => ({
    currentEffect: {
      value: 'Debug',
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
  if (url_param_allow_server != null)
  {
    useControls({
      server: {
        value: window.location.hostname,
        transient: false,
        onChange: (value) =>
        {
          oscNetworkBridge = new OSCNetworkBridge(resolution, value);
        }
      }
    })
  }

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
  props.touchPos = [x, y]

  useEffect(() =>
    {
      oscNetworkBridge.osc_connection.on('open', () =>
      {
        setConnected(true)
      })
    }, [])
  
  function DebugQuad({tex}) {
    return (
    <mesh scale={[1 , 1, 1]} position={[0,0,1]}>
      <planeGeometry />
      <meshBasicMaterial color={'white'} map={tex} />
    </mesh>
    )
  }

  function UpdateLoop()
      {
        useFrame((state, delta, xrFrame) =>
        {
          // This function runs at the native refresh rate inside of a shared render-loop
          oscNetworkBridge.update(delta)
          oscNetworkBridge.sendQueue();
          waveformTexture.update(oscNetworkBridge.waveformArray0, oscNetworkBridge.waveformArray1)
          setWaveformRms(waveformTexture.waveformRms);
          setWaveformRmsAccum(waveformTexture.waveformRmsAccum);
        })
      }
    
    const swipe_right = () =>
    {
      let index = props.effectOptions.indexOf(props.currentEffect) + 1
      if (index > props.effectOptions.length - 1)
      {
        index = 0
      }
      props.setUI({ currentEffect: props.effectOptions[index] })
    }

    const swipe_left = () =>
    {
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
    };

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
          <div  {...bind()} style={divStyle}>
            <Canvas linear dpr={dpr} /*add click event to canvas*/ 
              onDoubleClick={(e) => {
                // if we're clicking on the right side of the screen then swipe right
                if (e.clientX > window.innerWidth / 2)
                {
                  swipe_right()
                }
                else
                {
                  swipe_left()
                }
              }
            }>
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

        {/*<DebugQuad tex={waveformTex} />*/}
              <UpdateLoop />
            </Canvas>
          </div>
          : <h1>Connecting...</h1>
        }
        
      </>
    )
  }