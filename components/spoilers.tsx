"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"

export function Spoilers({
  viewMode = "complete",
  explodeAmount = 0,
  deploymentPercentage = 0, // 0 = stowed, 1 = fully deployed
}) {
  const groupRef = useRef()

  // Wing parameters (matching the wing box)
  const wingLength = 5 // 5 meters
  const rootChord = 2 // 2 meters at root
  const tipChord = 1.4 // 1.4 meters at tip (semi-tapered)

  // Spoiler parameters
  const spoilerWidth = 0.3 // Width of each spoiler panel
  const spoilerLength = 0.4 // Length of each spoiler panel
  const spoilerThickness = 0.02 // Thickness of the spoiler panel
  const maxDeploymentAngle = Math.PI / 4 // Maximum deployment angle (45 degrees)
  const hingeOffset = 0.01 // Small gap for visual clarity

  // Spoiler positions - between flaps and ailerons
  const spoilerPositions = [
    { position: 1.2, width: spoilerWidth * 1.1 }, // Inboard spoiler
    { position: 1.7, width: spoilerWidth }, // Middle spoiler
    { position: 2.2, width: spoilerWidth * 0.9 }, // Outboard spoiler
  ]

  // Material properties based on view mode
  const spoilerMaterial = useMemo(() => {
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

  const hydraulicMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a6a7a",
      metalness: 0.9,
      roughness: 0.1,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const pistonMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#b36b00",
      metalness: 0.8,
      roughness: 0.2,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Calculate current deployment angle
  const currentDeployment = deploymentPercentage * maxDeploymentAngle

  return (
    <group ref={groupRef} position={[0.5, 0.25, 0]} rotation={[0, 0, 0]}>
      {spoilerPositions.map((spoiler, index) => {
        // Calculate chord at this position (linear taper)
        const spanRatio = (spoiler.position + wingLength / 2) / wingLength
        const chordAtPos = rootChord - (rootChord - tipChord) * spanRatio

        return (
          <group key={index} position={[0, 0, spoiler.position]}>
            {/* Spoiler panel */}
            <group
              position={[0, 0, 0]}
              rotation={[0, 0, -currentDeployment]} // Negative rotation to go upward
              origin={[spoilerWidth / 2, 0, 0]} // Rotate around the back edge
            >
              {/* Main spoiler panel */}
              <mesh material={spoilerMaterial} position={[0, spoilerThickness / 2, 0]}>
                <boxGeometry args={[spoiler.width, spoilerThickness, spoilerLength]} />
              </mesh>

              {/* Spoiler edge reinforcement */}
              <mesh material={spoilerMaterial} position={[-spoiler.width / 2, spoilerThickness / 2, 0]}>
                <boxGeometry args={[spoilerThickness, spoilerThickness * 1.5, spoilerLength]} />
              </mesh>

              {/* Spoiler internal structure */}
              {[-spoilerLength / 3, 0, spoilerLength / 3].map((offset, idx) => (
                <mesh key={idx} material={spoilerMaterial} position={[0, 0, offset]}>
                  <boxGeometry args={[spoiler.width * 0.9, spoilerThickness * 0.8, spoilerThickness / 2]} />
                </mesh>
              ))}
            </group>

            {/* Hinge mechanism */}
            {[-spoilerLength / 3, 0, spoilerLength / 3].map((offset, idx) => (
              <group key={idx} position={[-spoiler.width / 2, 0, offset]}>
                {/* Hinge bracket */}
                <mesh material={hingeMaterial}>
                  <boxGeometry args={[spoilerThickness * 1.5, spoilerThickness * 2, spoilerThickness]} />
                </mesh>

                {/* Hinge pin */}
                <mesh material={hingeMaterial} position={[0, 0, 0]}>
                  <cylinderGeometry
                    args={[spoilerThickness / 4, spoilerThickness / 4, spoilerThickness * 1.5, 8]}
                    rotation={[0, Math.PI / 2, 0]}
                  />
                </mesh>
              </group>
            ))}

            {/* Hydraulic actuator */}
            <group position={[0, -spoilerThickness * 2, 0]}>
              {/* Actuator mounting bracket */}
              <mesh material={hydraulicMaterial} position={[spoiler.width / 4, 0, 0]}>
                <boxGeometry args={[spoilerThickness, spoilerThickness * 3, spoilerThickness * 2]} />
              </mesh>

              {/* Hydraulic cylinder */}
              <mesh
                material={hydraulicMaterial}
                position={[spoiler.width / 4, -spoilerThickness * 2 - spoilerThickness * deploymentPercentage * 2, 0]}
              >
                <cylinderGeometry
                  args={[spoilerThickness * 0.8, spoilerThickness * 0.8, spoilerThickness * 4, 8]}
                  rotation={[0, 0, Math.PI / 2]}
                />
              </mesh>

              {/* Hydraulic piston */}
              <mesh
                material={pistonMaterial}
                position={[
                  spoiler.width / 4 - spoilerThickness * 2 + spoilerThickness * deploymentPercentage * 4,
                  -spoilerThickness * 2 - spoilerThickness * deploymentPercentage * 2,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[spoilerThickness * 0.6, spoilerThickness * 0.6, spoilerThickness * 4, 8]}
                  rotation={[0, 0, Math.PI / 2]}
                />
              </mesh>

              {/* Connection to spoiler */}
              <mesh
                material={hingeMaterial}
                position={[
                  -spoiler.width / 4 + (spoiler.width * Math.sin(currentDeployment)) / 2,
                  spoilerThickness * Math.cos(currentDeployment) * 2,
                  0,
                ]}
                rotation={[0, 0, -currentDeployment]}
              >
                <boxGeometry args={[spoilerThickness, spoilerThickness * 4, spoilerThickness]} />
              </mesh>
            </group>
          </group>
        )
      })}
    </group>
  )
}
