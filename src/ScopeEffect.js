
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScopeMaterial } from './ScopeMaterial'
import { useControls } from 'leva'

// smoothstep function
// TODO just use a math module
const math = {
  smoothstep: (edge0, edge1, x) => {
    // Scale, bias and saturate x to 0..1 range
    x = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    // Evaluate polynomial
    return x * x * (3 - 2 * x)
  },
}

function ScopeEffect({waveformTexture, waveformRms, waveformRmsAccum, oscNetworkBridge, ...global_props }) {
  let effectParams0 = [0,0,0,0];
  let effectParams1 = [0,0,0,0];

  // set defaults
  oscNetworkBridge.send('reverbMix', 0)
  oscNetworkBridge.send('delayMix', 0)
  oscNetworkBridge.send('delayTime', 0)
  oscNetworkBridge.send('delayFeedback', 0)
  oscNetworkBridge.send('distortionPreGain', 1)
  // to do: send bypass effect OSC message

  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)

  // update the uniforms
  useFrame((state, delta) => {
    ref.current.time += delta
    ref.current.iWaveformRms = waveformRms
    ref.current.iWaveformRmsAccum = waveformRmsAccum
    
    // update the uniforms
    effectParams0[0] = 0
    effectParams0[1] = 0
    effectParams0[2] = 0
    effectParams0[3] = 0
    effectParams1[0] = 0
    ref.current.iEffectParams0 = effectParams0
    ref.current.iEffectParams1 = effectParams1
  })

  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry/>
      <scopeMaterial ref={ref} 
        key={ScopeMaterial.key} 
        toneMapped={true} 
        iWaveformTexture0={waveformTexture}
        />
    </mesh>
  )
}

export default ScopeEffect
