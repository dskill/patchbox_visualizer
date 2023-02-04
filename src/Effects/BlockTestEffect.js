
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScopeMaterial } from './Materials/ScopeMaterial'
import { useControls } from 'leva'
import { Text } from "@react-three/drei";
import { OrbitControls } from '@react-three/drei'

// smoothstep function
// TODO just use a math module
const math = {
  smoothstep: (edge0, edge1, x) =>
  {
    // Scale, bias and saturate x to 0..1 range
    x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    // Evaluate polynomial
    return x * x * (3 - 2 * x)
  },
}


function Box(props) {
  // This reference gives us direct access to the THREE.Mesh object
  const ref = useRef()
  // Hold state for hovered and clicked events
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (ref.current.rotation.x += delta * props.waveformRms * 10))
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      position = {props.position}
      ref={ref}
      scale={clicked ? 1.5 : 1}
      onClick={(event) => click(!clicked)}
      onPointerOver={(event) => hover(true)}
      onPointerOut={(event) => hover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} /> 
    </mesh>
  )
}
function BlockTestEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, ...global_props })
{
  
  //const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)
  useControls(
    {
     // scope_scale_y: { value: 0.5, min: 0, max: 1, step: 0.01, onChange: (value) => { ref.current.iAmplitude = value } },
    }
  )

  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    setUI({ downsample: 4 })
    setUI({ resolution: 256 })
    oscNetworkBridge.send('setEffect', 'wahdelay')
  }, [])  // empty array means effect will only be applied once

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Box waveformRms={waveformRms[0]} position={[-1.2, 0, 0]} />
      <Box waveformRms={waveformRms[1]} position={[1.2, 0, 0]} />
      <OrbitControls />
      </>      
  )
}


export default BlockTestEffect
