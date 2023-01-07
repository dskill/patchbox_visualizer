
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScopeMaterial } from './Materials/ScopeMaterial'
import { useControls } from 'leva'
import { Text } from "@react-three/drei";

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

function ScopeDistortionEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, touchPos, ...global_props })
{
  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)
  const [, set] = useControls(() => ({
      distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01, onChange: (value) => { oscNetworkBridge.send('distortionPreGain', value) } },
      scope_scale_y: { value: 0.5, min: 0, max: 1, step: 0.01, onChange: (value) => { ref.current.iAmplitude = value } },
  }))

  // update the uniforms
  useFrame((state, delta) =>
  {
    ref.current.time += delta
    ref.current.iWaveformRms = waveformRms
    ref.current.iWaveformRmsAccum = waveformRmsAccum
  })

  useEffect(() => 
  {
    set( {distortionPreGain: touchPos[1] * 200.0} )
  }, [touchPos])
  
  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    setUI({ downsample: 4 })
    setUI({ resolution: 256 })
    oscNetworkBridge.send('setEffect', 'scopeDistortion')
  }, [])  // empty array means effect will only be applied once

  return (
    <>
     <Text
      scale={[2, 2, 2]}
      position={[0, 2.75, 1]}
      color="gray" // default
      anchorX="center" // default
      anchorY="middle" // default
    > 
      Scope Distortion
    </Text>
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <scopeMaterial ref={ref}
        key={ScopeMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTex}
      />
    </mesh>
    <Text
        scale={[2, 2, 2]}
        position={[-5, 1, 1]}
        color="gray" // default
        anchorX="center" // default
        anchorY="middle" // default
      >
        IN
      </Text>
      <Text
        scale={[2, 2, 2]}
        position={[-5, -1, 1]}
        color="gray" // default
        anchorX="center" // default
        anchorY="middle" // default
      >
        OUT
      </Text>
    </>
  )
}

export default ScopeDistortionEffect
