"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

export function Winglets({ viewMode = "complete", explodeAmount = 0 }) {
  const groupRef = useRef()

  // Wing parameters (matching the wing box)
  const wingLength = 5 // 5 meters
  const rootChord = 2 // 2 meters at root
  const tipChord = 1.4 // 1.4 meters at tip (semi-tapered)

  // Winglet parameters
  const wingletHeight = 0.5 // 10% of wing span
  const wingletRootChord = tipChord * 0.9 // Slightly smaller than wing tip chord
  const wingletTipChord = tipChord * 0.5 // Tapered tip
  const wingletSweepAngle = Math.PI / 6 // 30 degrees sweep
  const wingletDihedralAngle = Math.PI / 3 // 60 degrees upward angle
  const wingletTwistAngle = -Math.PI / 36 // -5 degrees twist (washout)
  const filletRadius = 0.15 // Smooth transition radius

  // Material properties based on view mode
  const wingletMaterial = useMemo(() => {
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

  const filletMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#95a3b8",
      metalness: 0.7,
      roughness: 0.3,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.4 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const navigationLightMaterial = useMemo(() => {
    return {
      red: new THREE.MeshStandardMaterial({
        color: "#ff0000",
        emissive: "#ff0000",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        wireframe: viewMode === "wireframe",
      }),
      green: new THREE.MeshStandardMaterial({
        color: "#00ff00",
        emissive: "#00ff00",
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
        wireframe: viewMode === "wireframe",
      }),
    }
  }, [viewMode])

  // Create winglet path for the curved shape
  const createWingletPath = () => {
    const points = []
    const segments = 10

    for (let i = 0; i <= segments; i++) {
      const t = i / segments

      // Parametric curve for the winglet path
      // Start at wing tip and curve upward with sweep
      const x = wingletSweepAngle * t * wingletHeight
      const y = Math.pow(t, 0.8) * wingletHeight // Non-linear curve for more realistic shape
      const z = 0

      points.push(new THREE.Vector3(x, y, z))
    }

    return new THREE.CatmullRomCurve3(points)
  }

  // Create winglet cross-section (airfoil shape)
  const createWingletCrossSection = (t) => {
    // Interpolate between root and tip chord
    const chord = wingletRootChord - (wingletRootChord - wingletTipChord) * t
    const thickness = 0.12 * chord // 12% thickness-to-chord ratio

    // Create airfoil shape
    const points = []
    const numPoints = 12

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / (numPoints - 1)) * Math.PI
      const x = (Math.cos(angle) * 0.5 + 0.5) * chord - chord * 0.3 // Shift airfoil reference point
      const y = Math.sin(angle) * thickness * 0.5

      points.push(new THREE.Vector2(x, y))
    }

    return points
  }

  // Animate navigation lights
  useFrame((state) => {
    if (groupRef.current && viewMode === "complete") {
      // Subtle pulsing effect for navigation lights
      const intensity = 0.7 + 0.3 * Math.sin(state.clock.getElapsedTime() * 2)

      if (groupRef.current.children[2]?.material) {
        groupRef.current.children[2].material.emissiveIntensity = intensity
      }

      if (groupRef.current.children[3]?.material) {
        groupRef.current.children[3].material.emissiveIntensity = intensity
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Left Winglet (port side - red light) */}
      <group position={[0, 0, -wingLength / 2]} rotation={[0, 0, 0]}>
        <group position={[0, 0, 0]} rotation={[0, 0, wingletDihedralAngle]}>
          {/* Main winglet structure */}
          <mesh material={wingletMaterial}>
            <extrudeGeometry
              args={[
                new THREE.Shape(createWingletCrossSection(0)),
                {
                  steps: 20,
                  bevelEnabled: false,
                  extrudePath: createWingletPath(),
                },
              ]}
            />
          </mesh>

          {/* Winglet-wing junction fillet */}
          <mesh material={filletMaterial} position={[0, 0, 0]}>
            <torusGeometry args={[filletRadius, filletRadius / 2, 16, 8, Math.PI / 2]} rotation={[0, Math.PI / 2, 0]} />
          </mesh>

          {/* Navigation light (red for port/left side) */}
          <mesh material={navigationLightMaterial.red} position={[wingletSweepAngle * wingletHeight, wingletHeight, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
          </mesh>
        </group>
      </group>

      {/* Right Winglet (starboard side - green light) */}
      <group position={[0, 0, wingLength / 2]} rotation={[0, 0, 0]}>
        <group position={[0, 0, 0]} rotation={[0, 0, -wingletDihedralAngle]}>
          {/* Main winglet structure */}
          <mesh material={wingletMaterial}>
            <extrudeGeometry
              args={[
                new THREE.Shape(createWingletCrossSection(0)),
                {
                  steps: 20,
                  bevelEnabled: false,
                  extrudePath: createWingletPath(),
                },
              ]}
            />
          </mesh>

          {/* Winglet-wing junction fillet */}
          <mesh material={filletMaterial} position={[0, 0, 0]}>
            <torusGeometry
              args={[filletRadius, filletRadius / 2, 16, 8, Math.PI / 2]}
              rotation={[0, -Math.PI / 2, 0]}
            />
          </mesh>

          {/* Navigation light (green for starboard/right side) */}
          <mesh
            material={navigationLightMaterial.green}
            position={[wingletSweepAngle * wingletHeight, wingletHeight, 0]}
          >
            <sphereGeometry args={[0.04, 8, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
