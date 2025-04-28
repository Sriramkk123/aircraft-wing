"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function WingSurfaceDetails({ viewMode = "complete", explodeAmount = 0 }: { viewMode: string; explodeAmount: number }) {
  const groupRef = useRef<THREE.Group | null>(null)

  const wingLength = 5
  const rootChord = 2
  const maxThickness = 0.3

  // Access panels definitions
  const panelDefs = useMemo(
    () => [
      { x: 0, y: maxThickness / 2, z: -1, w: 0.5, h: 0.3 },
      { x: -0.8, y: maxThickness / 2, z: 0, w: 0.4, h: 0.25 },
      { x: 0.8, y: maxThickness / 2, z: 1, w: 0.4, h: 0.25 },
    ],
    [maxThickness]
  )

  // Rivet line geometry
  const rivetSpans = useMemo(() => [-2, -1, 0, 1, 2], [])
  const rivetLineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const verts: number[] = []
    rivetSpans.forEach((z) => {
      verts.push(-rootChord / 2, maxThickness / 2 + 0.01, z, rootChord / 2, maxThickness / 2 + 0.01, z)
    })
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3))
    return geom
  }, [rivetSpans, rootChord, maxThickness])

  // Static discharge rod positions
  const rodPositions = useMemo(() => [-2, 0, 2], [])
  
  // Pitot tube definition
  const pitotDefs = useMemo(
    () => [{ x: -rootChord / 2, y: maxThickness / 2 + 0.02, z: -1, radius: 0.02, length: 0.15 }],
    [rootChord, maxThickness]
  )

  // Navigation light at wing tip
  const navLightPos = useMemo(
    () => ({ x: rootChord / 4, y: maxThickness / 2 + 0.02, z: wingLength / 2 }),
    [rootChord, maxThickness, wingLength]
  )

  // Animate nav light pulsing
  useFrame((state) => {
    if (groupRef.current && viewMode === "complete") {
      const intensity = 0.5 + 0.5 * Math.sin(state.clock.getElapsedTime() * 4)
      const lightMesh = groupRef.current.children.find((_, i) => i === panelDefs.length + 3 + pitotDefs.length)
      if (lightMesh && (lightMesh as THREE.Mesh).material) {
        ;(lightMesh as THREE.Mesh).material.emissiveIntensity = intensity
      }
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Access panels */}
      {panelDefs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[p.w, p.h, 0.005]} />
          <meshStandardMaterial
            color="#5a5a5a"
            metalness={0.4}
            roughness={0.5}
            transparent={viewMode === "xray"}
            opacity={viewMode === "xray" ? 0.3 : 1}
            wireframe={viewMode === "wireframe"}
          />
        </mesh>
      ))}

      {/* Rivet lines */}
      <lineSegments geometry={rivetLineGeometry}>
        <lineBasicMaterial color="#333" linewidth={1} />
      </lineSegments>

      {/* Static discharge rods */}
      {rodPositions.map((z, i) => (
        <mesh key={i} position={[rootChord / 2 + 0.01, maxThickness / 2, z]}>  
          <cylinderGeometry args={[0.005, 0.005, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}

      {/* Pitot tubes */}
      {pitotDefs.map((tube, i) => (
        <mesh key={i} position={[tube.x, tube.y, tube.z]}>  
          <cylinderGeometry args={[tube.radius, tube.radius, tube.length, 16]} rotation={[0, Math.PI / 2, 0]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}

      {/* Navigation light */}
      <mesh position={[navLightPos.x, navLightPos.y, navLightPos.z]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}
