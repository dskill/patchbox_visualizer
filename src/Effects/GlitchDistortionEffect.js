
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { GlitchDistortionMaterial } from './GlitchDistortionMaterial'
import { useControls } from 'leva'
import { AsciiEffect } from 'three-stdlib'
import { Glitch, EffectComposer } from "@react-three/postprocessing";
import { GlitchMode } from 'postprocessing'


function AsciiRenderer({
  renderIndex = 1,
  bgColor = 'black',
  fgColor = 'white',
  characters = ' .:-+*=%@#',
  invert = true,
  color = false,
  resolution = 0.15
}) {
  // Reactive state
  const { size, gl, scene, camera } = useThree()

  // Create effect
  const effect = useMemo(() => {
    const effect = new AsciiEffect(gl, characters, { invert, color, resolution })
    effect.domElement.style.position = 'absolute'
    effect.domElement.style.top = '0px'
    effect.domElement.style.left = '0px'
    effect.domElement.style.pointerEvents = 'none'
    return effect
  }, [characters, invert, color, resolution])

  // Styling
  useLayoutEffect(() => {
    effect.domElement.style.color = fgColor
    effect.domElement.style.backgroundColor = bgColor
  }, [fgColor, bgColor])

  // Append on mount, remove on unmount
  useEffect(() => {
    gl.domElement.style.opacity = '0'
    gl.domElement.parentNode.appendChild(effect.domElement)
    return () => {
      gl.domElement.style.opacity = '1'
      gl.domElement.parentNode.removeChild(effect.domElement)
    }
  }, [effect])

  // Set size
  useEffect(() => {
    effect.setSize(size.width/1, size.height/1)
  }, [effect, size])

  // Take over render-loop (that is what the index is for)
  useFrame((state) => {
    effect.render(scene, camera)
  }, renderIndex)

  // This component returns nothing, it is a purely logical
}


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

function GlitchDistortionEffect({ waveformTexture, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, ...global_props })
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
    setDpr(.25)
    set({ downsample: 4 })
    set({ resolution: 256 })
    set({ distortionPreGain: 1 })
    oscNetworkBridge.send('setEffect', 'scopeDistortion')
  }, [])  // empty array means effect will only be applied once

  return (
    <>
    <mesh scale={[width, height, 1]}>
      <planeGeometry />
      <glitchDistortionMaterial ref={ref}
        key={GlitchDistortionMaterial.key}
        toneMapped={true}
        iWaveformTexture0={waveformTexture.texture}
      />
    </mesh>

    <EffectComposer>
      <Glitch
      delay={[.0, .05]} // min and max glitch delay
      duration={[0.05, .4]} // min and max glitch duration
      mode={GlitchMode.Mild} // glitch mode
      active // turn on/off the effect (switches between "mode" prop and GlitchMode.DISABLED)
      strength={[ (props.distortionPreGain - 1) / 50.0, (props.distortionPreGain - 1) / 50.0]} // min and max glitch strength
      />
    </EffectComposer>
    </>
  )
}

export default GlitchDistortionEffect
