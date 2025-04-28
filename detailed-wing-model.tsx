"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function DetailedWingModel({
  viewMode = "complete",
  showSkin = true,
  showSpars = true,
  showRibs = true,
  explodeAmount = 0,
}) {
  const groupRef = useRef()

  // Wing parameters
  const wingLength = 5 // 5 meters
  const rootChord = 2 // 2 meters at root
  const tipChord = 1.4 // 1.4 meters at tip (semi-tapered)
  const maxThickness = 0.3 // Maximum thickness
  const frontSparPos = 0.25 // 25% chord
  const rearSparPos = 0.7 // 70% chord
  const ribSpacing = 0.5 // 0.5 meter intervals

  // Calculate number of ribs
  const numRibs = Math.floor(wingLength / ribSpacing) + 1

  // Generate rib positions
  const ribPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < numRibs; i++) {
      positions.push(i * ribSpacing)
    }
    return positions
  }, [numRibs, ribSpacing])

  // Generate airfoil points for a NACA 4-digit airfoil
  const generateAirfoilPoints = (chord, thickness, numPoints = 50) => {
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * chord
      // Simplified NACA airfoil equation
      const t =
        thickness *
        (0.2969 * Math.sqrt(x / chord) -
          0.126 * (x / chord) -
          0.3516 * Math.pow(x / chord, 2) +
          0.2843 * Math.pow(x / chord, 3) -
          0.1015 * Math.pow(x / chord, 4))

      // Upper surface
      points.push(new THREE.Vector3(x - chord / 2, t, 0))
    }

    for (let i = numPoints - 1; i >= 0; i--) {
      const x = (i / (numPoints - 1)) * chord
      // Simplified NACA airfoil equation
      const t =
        thickness *
        (0.2969 * Math.sqrt(x / chord) -
          0.126 * (x / chord) -
          0.3516 * Math.pow(x / chord, 2) +
          0.2843 * Math.pow(x / chord, 3) -
          0.1015 * Math.pow(x / chord, 4))

      // Lower surface
      points.push(new THREE.Vector3(x - chord / 2, -t, 0))
    }

    return points
  }

  // Material properties based on view mode
  const skinMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#a0a0a0",
      metalness: 0.8,
      roughness: 0.2,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.3 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const sparMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#4a6fa5",
      metalness: 0.6,
      roughness: 0.3,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const ribMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#6d7a8c",
      metalness: 0.5,
      roughness: 0.5,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Animate rotation for better visualization
  useFrame((state) => {
    if (groupRef.current && viewMode === "complete") {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {/* Wing Skin */}
      {showSkin && (
        <group position={[0, 0, explodeAmount * (viewMode === "exploded" ? 0.5 : 0)]}>
          <mesh material={skinMaterial}>
            <boxGeometry args={[rootChord, maxThickness, wingLength]} />
            <meshStandardMaterial {...skinMaterial} />
          </mesh>
        </group>
      )}

      {/* Front Spar */}
      {showSpars && (
        <group
          position={[frontSparPos * rootChord - rootChord / 2, 0, explodeAmount * (viewMode === "exploded" ? -0.5 : 0)]}
        >
          <mesh material={sparMaterial}>
            <boxGeometry args={[0.05, maxThickness * 0.9, wingLength]} />
          </mesh>
        </group>
      )}

      {/* Rear Spar */}
      {showSpars && (
        <group
          position={[rearSparPos * rootChord - rootChord / 2, 0, explodeAmount * (viewMode === "exploded" ? -1 : 0)]}
        >
          <mesh material={sparMaterial}>
            <boxGeometry args={[0.05, maxThickness * 0.8, wingLength]} />
          </mesh>
        </group>
      )}

      {/* Ribs */}
      {showRibs && (
        <group position={[0, 0, explodeAmount * (viewMode === "exploded" ? -1.5 : 0)]}>
          {ribPositions.map((pos, index) => {
            // Calculate chord at this position (linear taper)
            const taperRatio = pos / wingLength
            const chordAtPos = rootChord - (rootChord - tipChord) * taperRatio
            const thicknessAtPos = maxThickness * (1 - taperRatio * 0.2)

            return (
              <group key={index} position={[0, 0, pos - wingLength / 2]}>
                {/* Main rib structure */}
                <mesh material={ribMaterial}>
                  <boxGeometry args={[chordAtPos, thicknessAtPos, 0.03]} />
                </mesh>

                {/* Lightening holes (3 per rib) */}
                {[0.3, 0.5, 0.6].map((holePos, holeIndex) => (
                  <mesh key={holeIndex} position={[holePos * chordAtPos - chordAtPos / 2, 0, 0]}>
                    <cylinderGeometry
                      args={[thicknessAtPos * 0.3, thicknessAtPos * 0.3, 0.04, 16]}
                      rotation={[Math.PI / 2, 0, 0]}
                    />
                    <meshBasicMaterial color="black" />
                  </mesh>
                ))}
              </group>
            )
          })}
        </group>
      )}
    </group>
  )
}
