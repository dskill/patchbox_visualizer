import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Leva, useControls } from 'leva'
import FullScreenEffect from './FullScreenEffect'
import DistortionEffect from './DistortionEffect'
import {OSCNetworkBridge} from './OSCNetworkBridge.js'
import { WaveformTexture } from './WaveformTexture'

const resolution = 512;
const oscNetworkBridge = new OSCNetworkBridge(resolution);
const waveformTexture = new WaveformTexture(resolution);

export default function App() { 
  const searchParams = new URLSearchParams(window.location.search)
  let  url_param_gui = searchParams.get('gui')
  const effects = ["Effect 1", "Effect 2"]
  const [currentEffect, setEffect] = useState(0);
  const [waveformRms, setWaveformRms] = useState([0,0,0,0]);
  const [waveformRmsAccum, setWaveformRmsAccum] = useState([0,0,0,0]);

  let props = useControls({
    effects: {
      value: effects[0], 
      options: effects,
      onChange: (value) => {
        console.log(value)
        setEffect(value)
      } 
  }
  })

  props.waveformTexture = waveformTexture.texture
  props.waveformRms = waveformRms
  props.waveformRmsAccum = waveformRmsAccum
  props.oscNetworkBridge = oscNetworkBridge
  //props.currentEffect = currentEffect;

  function UpdateLoop({waveformRms}) {
    useFrame((state, delta, xrFrame) => {
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
          hidden={url_param_gui == null} // default = false, when true the GUI is hidden
        />


      <Canvas linear>
        {(() => {
          switch (currentEffect) {
            case 'Effect 1':
              return <FullScreenEffect {...props} />
            case 'Effect 2':
              return <DistortionEffect {...props} />
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
        
          <UpdateLoop {...props}/>
      </Canvas>
    </>
  )
  
}
