
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScopeMaterial } from './ScopeMaterial'
import { useControls } from 'leva'

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

function ScopeDistortionEffect({ waveformTexture, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, ...global_props })
{
  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)

  // use controls with leva. Add amplitude float
  const [props, set] = useControls(() => ({
    resolution: {
      value: 256,
      options: [32, 64, 128, 256, 512, 1024, 2048, 4096],
      onChange: (value) =>
      {
        oscNetworkBridge.setResolution(value)
        waveformTexture.setResolution(value)
      }
    },
    downsample: {
      value: 4,
      options: [1, 2, 4, 8, 16, 32, 64, 128, 256],
      onChange: (value) =>
      {
        oscNetworkBridge.send("chunkDownsample", value)
      }
    },
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01, onChange: (value) => { oscNetworkBridge.send('distortionPreGain', value) }, transient: false },
    scope_scale_y: { value: 1.0, min: 0, max: 1, step: 0.01, onChange: (value) => { ref.current.iAmplitude = value }, transient: false },
  }))

  // update the uniforms
  useFrame((state, delta) =>
  {
    ref.current.time += delta
    ref.current.iWaveformRms = waveformRms
    ref.current.iWaveformRmsAccum = waveformRmsAccum
  })

  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    set({ downsample: 4 })
    set({ resolution: 256 })
    set({ distortionPreGain: 1 })
    oscNetworkBridge.send('setEffect', 'scopeDistortion')
  }, [])  // empty array means effect will only be applied once

  return (
    <>
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <scopeMaterial ref={ref}
        key={ScopeMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTexture.texture}
      />
    </mesh>
    </>
  )
}

export default ScopeDistortionEffect
