"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"

export function FixedLeadingEdge({ viewMode = "complete", explodeAmount = 0 }) {
  const groupRef = useRef()

  // Leading edge parameters
  const wingLength = 5 // 5 meters
  const rootChord = 0.6 // 0.6 meters at root (leading edge section)
  const tipChord = 0.4 // 0.4 meters at tip (semi-tapered)
  const maxThickness = 0.25 // Maximum thickness

  // Calculate slat positions (gaps in the leading edge)
  const slatGaps = [
    { start: -2.0, end: -1.2 }, // Inboard slat
    { start: 0.2, end: 1.0 }, // Mid slat
    { start: 1.5, end: 2.3 }, // Outboard slat
  ]

  // Material properties based on view mode
  const leadingEdgeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#8a9db5",
      metalness: 0.7,
      roughness: 0.2,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.4 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const mountingPointMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a6a7a",
      metalness: 0.5,
      roughness: 0.6,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Anti-ice duct mounting points
  const mountingPoints = [
    { position: -1.8, radius: 0.06 },
    { position: -0.9, radius: 0.06 },
    { position: 0, radius: 0.06 },
    { position: 1.2, radius: 0.06 },
    { position: 2.0, radius: 0.06 },
  ]

  // Generate leading edge sections (avoiding slat areas)
  const leadingEdgeSections = useMemo(() => {
    const sections = []
    let currentPos = -wingLength / 2

    while (currentPos < wingLength / 2) {
      // Check if current position is in a slat gap
      const inSlatGap = slatGaps.some(
        (gap) => currentPos >= gap.start - wingLength / 2 && currentPos <= gap.end - wingLength / 2,
      )

      if (!inSlatGap) {
        // Calculate position along wing (0 at root, 1 at tip)
        const spanPos = (currentPos + wingLength / 2) / wingLength
        // Calculate chord at this position (linear taper)
        const chordAtPos = rootChord - (rootChord - tipChord) * spanPos

        sections.push({
          position: currentPos,
          chord: chordAtPos,
          thickness: maxThickness * (1 - spanPos * 0.2),
        })
      }

      currentPos += 0.25 // 0.25m sections
    }

    return sections
  }, [wingLength, rootChord, tipChord, maxThickness, slatGaps])

  return (
    <group ref={groupRef} position={[-0.9, 0, 0]} rotation={[0, 0, 0]}>
      {/* Leading edge sections */}
      {leadingEdgeSections.map((section, index) => (
        <group key={index} position={[0, 0, section.position]}>
          {/* Main leading edge structure - curved shape */}
          <mesh material={leadingEdgeMaterial}>
            <cylinderGeometry
              args={[section.thickness / 2, section.thickness / 2, 0.2, 16, 1, true, Math.PI / 2, Math.PI]}
              rotation={[0, 0, Math.PI / 2]}
              position={[-section.chord / 4, 0, 0]}
            />
          </mesh>

          {/* Connection to wing box */}
          <mesh material={leadingEdgeMaterial}>
            <boxGeometry args={[section.chord / 2, section.thickness, 0.2]} position={[0, 0, 0]} />
          </mesh>
        </group>
      ))}

      {/* Anti-ice duct mounting points */}
      {mountingPoints.map((point, index) => {
        // Skip if in slat area
        const inSlatGap = slatGaps.some(
          (gap) => point.position >= gap.start - wingLength / 2 && point.position <= gap.end - wingLength / 2,
        )

        if (inSlatGap) return null

        return (
          <group key={index} position={[-rootChord / 3, 0, point.position]}>
            <mesh material={mountingPointMaterial}>
              <cylinderGeometry args={[point.radius, point.radius, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
            </mesh>
            {/* Mounting bracket */}
            <mesh material={mountingPointMaterial}>
              <boxGeometry args={[0.15, 0.08, 0.04]} position={[0.08, 0, 0]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
