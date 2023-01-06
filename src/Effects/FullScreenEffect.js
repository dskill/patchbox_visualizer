
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

function FullScreenEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, ...global_props })
{
  let effectParams0 = [0, 0, 0, 0];
  let effectParams1 = [0, 0, 0, 0];

  const [, set] = useControls(() => ({
    reverbMix: { value: 0, min: 0, max: 1, step: 0.01, onChange: (value) => { oscNetworkBridge.send('reverbMix', value) } },
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01, onChange: (value) => { oscNetworkBridge.send('distortionPreGain', value) } },
    delayMix: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayMix', value) } },
    delayTime: { value: 0.0, min: 0, max: 1, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayTime', value) } },
    delayFeedback: { value: 0, min: 0, max: 10, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayFeedback', value) } },
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
    effectParams0[0] = math.smoothstep(0, 1.0, reverbMix.value);
    effectParams0[1] = distortionPreGain.value / 200.0; 
    effectParams0[3] = math.smoothstep(.1, .15, delayTime.value);
    effectParams1[0] = delayFeedback.value;
    ref.current.iEffectParams0 = effectParams0;
    ref.current.iEffectParams1 = effectParams1;
    } catch (e) {
      console.log("error updating uniforms")
    }
  })

  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    setUI({ downsample: 8 })
    setUI({ resolution: 256 })
    // start the effect
    oscNetworkBridge.send('setEffect', 'default')
  }, [])  // empty array means effect will only be applied once


  return (
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <fullScreenMaterial ref={ref}
        key={FullScreenMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTex}
      />
    </mesh>
  )
}

export default FullScreenEffect
