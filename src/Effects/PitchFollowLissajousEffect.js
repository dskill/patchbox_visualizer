
import { useRef, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
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
  lerp: (a, b, t) => a + (b - a) * t,
}

function PitchFollowLissajousEffect({ waveform0, waveform1, waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, ...global_props })
{
  const { width, height } = useThree((state) => state.viewport)

  const { camera, gl } = useThree()
  const ref = useRef()
  const smoothTouchPos = useRef({x: 0, y: 0})
  const touchPosLerp = .2

  const [{size}, set] = useControls(() => ({
    distortionPreGain: { value: 1, min: 1, max: 200, step: 0.01 },
    size: { value: 20, min: 1, max: 100, step: 0.01},
  }))

  // update the uniforms
  useFrame((state, delta) =>
  {
    //ref.current.time += delta
    //ref.current.iWaveformRms = waveformRms
    //ref.current.iWaveformRmsAccum = waveformRmsAccum
    
    // lerp touch pos
    smoothTouchPos.current.x = math.lerp(smoothTouchPos.current.x, state.mouse.x, touchPosLerp)
    smoothTouchPos.current.y = math.lerp(smoothTouchPos.current.y, state.mouse.y, touchPosLerp)
    let distortion = Math.max(0, smoothTouchPos.current.y * 200.0)
    set( {distortionPreGain: distortion} )
    oscNetworkBridge.send('distortionPreGain', distortion)

    const interleavedArray = new Float32Array(waveform0.length * 3)
    for (let i = 0; i < waveform0.length*3; i++) {
        interleavedArray[i*3] = waveform0[i] * size
        interleavedArray[i*3 + 1] = waveform1[i] * size
        interleavedArray[i*3 + 2] = 0
    }

    // if the position array does not exist, initialize it. In a hacky way.
    if (ref.current.geometry.attributes.position === undefined) {
      let vectorArray0 =[]
      for (var i = 0; i< 1024; i++) {
        vectorArray0.push(new THREE.Vector3(0,0,0))
      }
      //const vectorArray0 = waveform0.map((x, index) => new THREE.Vector3(0,0,0));
      ref.current.geometry.setFromPoints(vectorArray0)
    }
    //hopefully, this is faster 
    ref.current.geometry.attributes.position.set(interleavedArray)
    ref.current.geometry.attributes.position.needsUpdate = true
  })

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
        Pitch Follow Lissajous
      </Text>
      <line position={[0, 0, 0]} ref={ref}>
        <bufferGeometry attach="geometry" />
        <lineBasicMaterial attach="material" color={'white'} linewidth={2} linecap={'round'} linejoin={'round'} />
      </line>
      
    </>
  )
}

export default PitchFollowLissajousEffect
