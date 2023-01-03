
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { FullScreenMaterial } from './FullScreenMaterial'
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

function DistortionEffect({ waveformTexture, waveformRms, waveformRmsAccum, oscNetworkBridge, ...global_props })
{
  let effectParams0 = [0, 0, 0, 0];
  let effectParams1 = [0, 0, 0, 0];

  const [, set] = useControls(() => ({
    resolution: {
      value: 1024,
      options: [32, 64, 128, 256, 512, 1024, 2048, 4096],
      onChange: (value) =>
      {
        oscNetworkBridge.setResolution(value)
        waveformTexture.setResolution(value)
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
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01, onChange: (value) => { oscNetworkBridge.send('distortionPreGain', value) } },
  }))

  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)

  // update the uniforms
  useFrame((state, delta) =>
  {
    ref.current.time += delta
    ref.current.iWaveformRms = waveformRms
    ref.current.iWaveformRmsAccum = waveformRmsAccum

    // update the uniforms
    try {
    effectParams0[0] = 0
    effectParams0[1] = 0
    effectParams0[2] = 0
    effectParams0[3] = distortionPreGain.value / 200.0
    effectParams1[0] = 0
    ref.current.iEffectParams0 = effectParams0
    ref.current.iEffectParams1 = effectParams1
    } catch (e) {
      console.log("error: ", e)
    }
  })

  // send OSC messages only on start
  useEffect(() =>
  {
    // start the effect
    set({ downsample: 8 })
    set({ resolution: 512 })
    oscNetworkBridge.send('setEffect', 'default')

    // set defaults
    oscNetworkBridge.send('reverbMix', 0)
    oscNetworkBridge.send('delayMix', 0)
    oscNetworkBridge.send('delayTime', 0)
    oscNetworkBridge.send('delayFeedback', 0)
  }, [])  // empty array means effect will only be applied once


  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <fullScreenMaterial ref={ref}
        key={FullScreenMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTexture.texture}
      />
    </mesh>
  )
}

export default DistortionEffect
