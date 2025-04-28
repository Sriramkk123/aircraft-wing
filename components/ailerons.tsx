"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"

export function Ailerons({
  viewMode = "complete",
  explodeAmount = 0,
  deflectionAngle = 0, // -1 to 1, where -1 is full down, 0 is neutral, 1 is full up
}) {
  const groupRef = useRef()

  // Wing parameters (matching the wing box)
  const wingLength = 5 // 5 meters
  const rootChord = 2 // 2 meters at root
  const tipChord = 1.4 // 1.4 meters at tip (semi-tapered)

  // Aileron parameters
  const aileronWidth = 0.25 // Width of the aileron (percentage of chord)
  const aileronLength = 1.2 // Length of each aileron
  const aileronThickness = 0.05 // Thickness of the aileron
  const maxDeflectionAngle = Math.PI / 6 // Maximum deflection angle (30 degrees)
  const hingeOffset = 0.01 // Small gap between wing and aileron for visual clarity

  // Aileron positions - outboard section, after the flaps
  const aileronPosition = 2.0 // Position along the wing span (from center)
  const aileronStart = aileronPosition - aileronLength / 2
  const aileronEnd = aileronPosition + aileronLength / 2

  // Material properties based on view mode
  const aileronMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#8a9db5",
      metalness: 0.7,
      roughness: 0.3,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.4 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const hingeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#4a5a6a",
      metalness: 0.8,
      roughness: 0.2,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const counterweightMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a6a7a",
      metalness: 0.9,
      roughness: 0.1,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Calculate chord at aileron position (linear taper)
  const spanRatio = (aileronPosition + wingLength / 2) / wingLength
  const chordAtPos = rootChord - (rootChord - tipChord) * spanRatio
  const aileronChord = chordAtPos * aileronWidth

  // Calculate current deflection angle
  const currentDeflection = deflectionAngle * maxDeflectionAngle

  // Generate hinge positions
  const hingePositions = useMemo(() => {
    const positions = []
    const numHinges = 5 // Number of hinges along the aileron

    for (let i = 0; i < numHinges; i++) {
      const pos = aileronStart + (i / (numHinges - 1)) * aileronLength
      positions.push(pos)
    }

    return positions
  }, [aileronStart, aileronLength])

  return (
    <group ref={groupRef} position={[1.5, 0, 0]} rotation={[0, 0, 0]}>
      {/* Aileron body */}
      <group position={[0, 0, aileronPosition]} rotation={[0, 0, currentDeflection]}>
        {/* Main aileron body */}
        <mesh material={aileronMaterial} position={[aileronChord / 2, 0, 0]}>
          <boxGeometry args={[aileronChord, aileronThickness, aileronLength]} />
        </mesh>

        {/* Aileron leading edge (hinge line) */}
        <mesh material={aileronMaterial} position={[0, 0, 0]}>
          <cylinderGeometry
            args={[aileronThickness / 2, aileronThickness / 2, aileronLength, 8, 1, false]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </mesh>

        {/* Aileron trailing edge (tapered) */}
        <mesh material={aileronMaterial} position={[aileronChord - aileronThickness / 4, 0, 0]}>
          <boxGeometry args={[aileronThickness / 2, aileronThickness / 2, aileronLength]} />
        </mesh>

        {/* Counterweights (visible at the front of the aileron) */}
        {[-aileronLength / 3, 0, aileronLength / 3].map((offset, index) => (
          <mesh key={index} material={counterweightMaterial} position={[-aileronThickness * 1.5, 0, offset]}>
            <sphereGeometry args={[aileronThickness * 0.8, 8, 8]} />
          </mesh>
        ))}

        {/* Internal structure (ribs) */}
        {[-aileronLength / 3, 0, aileronLength / 3].map((offset, index) => (
          <mesh key={index} material={aileronMaterial} position={[aileronChord / 2, 0, offset]}>
            <boxGeometry args={[aileronChord * 0.9, aileronThickness * 0.8, aileronThickness / 2]} />
          </mesh>
        ))}
      </group>

      {/* Hinge attachments */}
      {hingePositions.map((pos, index) => (
        <group key={index} position={[0, 0, pos]}>
          {/* Hinge bracket on wing */}
          <mesh material={hingeMaterial} position={[-hingeOffset, 0, 0]}>
            <boxGeometry args={[aileronThickness, aileronThickness * 1.5, aileronThickness]} />
          </mesh>

          {/* Hinge pin */}
          <mesh material={hingeMaterial} position={[0, 0, 0]}>
            <cylinderGeometry
              args={[aileronThickness / 4, aileronThickness / 4, aileronThickness * 2, 8]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </mesh>

          {/* Control rod connection (moves with aileron) */}
          <mesh
            material={hingeMaterial}
            position={[
              -aileronThickness * 2 * Math.sin(currentDeflection),
              -aileronThickness * 2 * Math.cos(currentDeflection),
              0,
            ]}
            rotation={[0, 0, currentDeflection]}
          >
            <boxGeometry args={[aileronThickness / 2, aileronThickness * 3, aileronThickness / 2]} />
          </mesh>
        </group>
      ))}

      {/* Control linkage */}
      <mesh material={hingeMaterial} position={[0, -aileronThickness * 3, aileronPosition]}>
        <boxGeometry args={[aileronThickness, aileronThickness / 2, aileronLength * 0.8]} />
      </mesh>
    </group>
  )
}
