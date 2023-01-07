
import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { FullScreenMaterial } from './Materials/FullScreenMaterial'
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
  lerp: (a, b, t) => a + (b - a) * t,
}

function DistortionEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, touchPos, ...global_props })
{
  let effectParams0 = [0, 0, 0, 0];
  let effectParams1 = [0, 0, 0, 0];

  const [, set] = useControls(() => ({
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01, onChange: (value) => { oscNetworkBridge.send('distortionPreGain', value) } },
    reverbMix: {  value: 0, min: 0, max: 1, step: 0.01, onChange: (value) => { oscNetworkBridge.send('reverbMix', value) } },
    delayMix: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayMix', value) } },
    delayTime: {  value: 0.3, min: 0, max: 1, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayTime', value) } },
    delayFeedback: { value: .5, min: 0, max: 10, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayFeedback', value) } },
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
    try
    {
      effectParams0[0] = 0
      effectParams0[1] = 0
      effectParams0[2] = 0
      effectParams0[3] = distortionPreGain.value / 200.0
      effectParams1[0] = 0
      ref.current.iEffectParams0 = effectParams0
      ref.current.iEffectParams1 = effectParams1
    } catch (e)
    {
      console.log("error: ", e)
    }
  })

  // update params by touch
  const yparam = {
    distortionPreGain: 200.0,
    delayMix: 1.0
  }

  const xparam = {
    reverbMix: 1.0,
  }

  // funky math to update params based on touch
  useEffect(() => {
    const updateValues = () => {
      const center_touch = [touchPos[0] - 0.5, touchPos[1] - 0.5]
      const dist_from_center = Math.sqrt(center_touch[0] * center_touch[0] + center_touch[1] * center_touch[1])
      const dist_from_center_smooth = math.smoothstep(0, .5, dist_from_center)
      Object.keys(xparam).forEach((key) => {
        const value = xparam[key] * dist_from_center_smooth;
        set({ [key]: value });
      });
      Object.keys(yparam).forEach((key) => {
        const value = yparam[key] * math.smoothstep(0,.4, Math.abs(center_touch[1]));
        set({ [key]: value });
      });
    };
    updateValues();
  }, [touchPos]);

  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    // start the effect
    setUI({ downsample: 8 })
    setUI({ resolution: 512 })
    set({delayTime: .3 })
    set({delayFeedback: .5 })
    oscNetworkBridge.send('setEffect', 'default')

    // set defaults
    oscNetworkBridge.send('reverbMix', 0)
    oscNetworkBridge.send('delayMix', 0)
    oscNetworkBridge.send('delayTime', 0)
    oscNetworkBridge.send('delayFeedback', 0)
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
      Distortion
    </Text>
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <fullScreenMaterial ref={ref}
        key={FullScreenMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTex}
      />
    </mesh>
    </>
  )
}

export default DistortionEffect
