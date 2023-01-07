
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
}

function DistortionEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, touchPos, ...global_props })
{
  let effectParams0 = [0, 0, 0, 0];
  let effectParams1 = [0, 0, 0, 0];

  const [, set] = useControls(() => ({
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

  useEffect(() => 
  {
    set( {distortionPreGain: touchPos[1] * 200.0} )
  }, [touchPos])

  // send OSC messages only on start
  useEffect(() =>
  {
    setDpr(1)
    // start the effect
    setUI({ downsample: 8 })
    setUI({ resolution: 512 })
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
