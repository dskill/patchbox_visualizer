
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

function DistortionEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, ...global_props })
{
  //todo: useref()
  let effectParams0 = [0, 0, 0, 0];
  let effectParams1 = [0, 0, 0, 0];

  const [, set] = useControls(() => ({
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01 },
    reverbMix: {  value: 0, min: 0, max: 1, step: 0.01},
    delayMix: { value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    delayTime: {  value: 0.3, min: 0, max: 1, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayTime', value) } },
    delayFeedback: { value: .5, min: 0, max: 10, step: 0.01, onChange: (value) => { oscNetworkBridge.send('delayFeedback', value) } },
  }))

  const ref = useRef()
  const { width, height } = useThree((state) => state.viewport)
  const smoothTouchPos = useRef({x: 0, y: 0})
  const touchPosLerp = .2

  // update the uniforms
  useFrame((state, delta) =>
  {
    ref.current.time += delta
    ref.current.iWaveformRms = waveformRms
    ref.current.iWaveformRmsAccum = waveformRmsAccum

    // lerp touch pos
    smoothTouchPos.current.x = math.lerp(smoothTouchPos.current.x, state.mouse.x, touchPosLerp)
    smoothTouchPos.current.y = math.lerp(smoothTouchPos.current.y, state.mouse.y, touchPosLerp)

    let distortion = Math.max(0, smoothTouchPos.current.y * 200.0)
    let reverb = Math.abs(smoothTouchPos.current.x)
    let delay = Math.max(0, -1 * smoothTouchPos.current.y)
    // map touchPos onto controls
    set( {distortionPreGain: distortion} )
    set( {reverbMix: reverb} )
    set( {delayMix: delay} )

    // update the uniforms
    try
    {
      effectParams0[0] = 0
      effectParams0[1] = 0
      effectParams0[2] = reverb
      effectParams0[3] = smoothTouchPos.current.y
      effectParams1[0] = delay
      ref.current.iEffectParams0 = effectParams0
      ref.current.iEffectParams1 = effectParams1

      oscNetworkBridge.send('distortionPreGain', distortion)
      oscNetworkBridge.send('reverbMix', reverb)
      oscNetworkBridge.send('delayMix', delay)

    } catch (e)
    {
      console.log("error: ", e)
    }
  })

  // update params by touch
  const param_preset_a = {
    distortionPreGain: 200.0,
    delayMix: 1.0
  }
  const param_preset_b = {
    reverbMix: 1.0,
  }

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
      Distortion + Reverb + Delay     
    </Text>
    <mesh scale={[width, height, 1]}>
      <planeGeometry/>
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
