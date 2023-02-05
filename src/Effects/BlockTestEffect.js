
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScopeMaterial } from './Materials/ScopeMaterial'
import { useControls } from 'leva'
import { OrbitControls, TransformControls, useCursor } from '@react-three/drei'
import * as THREE from 'three'

import { Trail, Float, Line, Sphere, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'


export function BlockTestEffect({ waveformTex, waveformRms, waveformRmsAccum, oscNetworkBridge, setDpr, setUI, ...global_props })
{

  useEffect(() =>
  {
    setDpr(1)
    setUI({ downsample: 4 })
    setUI({ resolution: 256 })
    oscNetworkBridge.send('setEffect', 'wahdelay')
  }, [])  // empty array means effect will only be applied once

  return (
    <>
      <color attach="background" args={['black']} />
      <Float speed={10} rotationIntensity={1} floatIntensity={2}>
        <Atom waveformRms={waveformRms} />
      </Float>
      

    </>
  )
}

function Atom(props)
{
  const points = useMemo(() => new THREE.EllipseCurve(0, 0, 3, 1.15, 0, 2 * Math.PI, false, 0).getPoints(10), [])
  return (
    <group {...props}>
      <Line worldUnits points={points} color="turquoise" lineWidth={0.3} />
      <Line worldUnits points={points} color="turquoise" lineWidth={0.3} rotation={[0, 0, 1]} />
      <Line worldUnits points={points} color="turquoise" lineWidth={0.3} rotation={[0, 0, -1]} />
      <Electron waveformRms={props.waveformRms[0]} position={[0, 0, 0.5]} speed={2} />
      <Electron waveformRms={props.waveformRms[1]} position={[0, 0, 0.5]} rotation={[0, 0, Math.PI / 3]} speed={6.5} />
      <Electron waveformRms={props.waveformRms[1]} position={[0, 0, 0.5]} rotation={[0, 0, -Math.PI / 3]} speed={3} />

    </group>
  )
}

function Electron({ radius = 2.75, waveformRms, speed = 6, ...props })
{
  const ref = useRef()
  const drew = useRef({t: 1})
  useFrame((state) =>
  {
    let t = state.clock.getElapsedTime() * speed
    console.log(waveformRms)
    drew.current.t += .1// waveformRms * .1
    t = drew.current.t
    ref.current.position.set(Math.sin(t) * radius, (Math.cos(t) * radius * Math.atan(t)) / Math.PI / 1.25, 0)
  })
  return (
    <group {...props}>
      <Trail local width={5} length={2} color={new THREE.Color(2, 1, 10)} attenuation={(t) => t * t}>
        <mesh ref={ref}>
          <sphereGeometry args={[0.25]} />
          <meshBasicMaterial color={[10, 1, 10]} toneMapped={false} />
        </mesh>
      </Trail>
    </group>
  )
}


export default BlockTestEffect

