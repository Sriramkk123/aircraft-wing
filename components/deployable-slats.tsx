"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

export function DeployableSlats({
  viewMode = "complete",
  explodeAmount = 0,
  deploymentPercentage = 0, // 0 = stowed, 1 = fully deployed
}) {
  const groupRef = useRef()

  // Wing parameters (matching the fixed leading edge)
  const wingLength = 5 // 5 meters
  const rootChord = 0.6 // 0.6 meters at root (leading edge section)
  const tipChord = 0.4 // 0.4 meters at tip (semi-tapered)

  // Slat parameters
  const slatDepth = 0.3 // How far the slat extends when deployed
  const slatDrop = 0.15 // How far the slat drops when deployed
  const slatThickness = 0.04 // Thickness of the slat
  const slatCurve = 0.1 // Curvature of the slat

  // Slat positions (matching the gaps in the fixed leading edge)
  const slatSections = [
    { start: -2.0, end: -1.2, name: "Inboard Slat" }, // Inboard slat
    { start: 0.2, end: 1.0, name: "Mid Slat" }, // Mid slat
    { start: 1.5, end: 2.3, name: "Outboard Slat" }, // Outboard slat
  ]

  // Material properties based on view mode
  const slatMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#95a3b8",
      metalness: 0.8,
      roughness: 0.2,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.4 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const trackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#3a4a5a",
      metalness: 0.7,
      roughness: 0.4,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const actuatorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a6a7a",
      metalness: 0.9,
      roughness: 0.3,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const hydraulicMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#b36b00",
      metalness: 0.8,
      roughness: 0.2,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Calculate deployment position based on percentage
  const calculateDeploymentPosition = (basePosition, spanPosition) => {
    // Taper the deployment slightly from root to tip
    const taperFactor = 1 - (Math.abs(spanPosition) / (wingLength / 2)) * 0.2

    // Calculate forward movement (along curved path)
    const forwardX = -slatDepth * taperFactor * deploymentPercentage

    // Calculate downward movement (along curved path)
    const downwardY = -slatDrop * taperFactor * deploymentPercentage

    return {
      x: basePosition.x + forwardX,
      y: basePosition.y + downwardY,
      z: basePosition.z,
    }
  }

  // Generate track points for visualization
  const generateTrackPoints = (spanPosition) => {
    const points = []
    const taperFactor = 1 - (Math.abs(spanPosition) / (wingLength / 2)) * 0.2

    // Create a curved path for the track
    for (let t = 0; t <= 1; t += 0.1) {
      points.push(
        new THREE.Vector3(
          -slatDepth * taperFactor * t,
          -slatDrop * taperFactor * t * (2 - t), // Quadratic curve for smoother motion
          0,
        ),
      )
    }

    return points
  }

  // Animate slat deployment
  useFrame(() => {
    // Additional animation logic could be added here if needed
  })

  return (
    <group ref={groupRef} position={[-0.9, 0, 0]} rotation={[0, 0, 0]}>
      {slatSections.map((section, sectionIndex) => {
        // Calculate section length
        const sectionLength = section.end - section.start
        // Number of slat segments in this section
        const numSegments = Math.max(2, Math.floor(sectionLength / 0.4))

        return Array.from({ length: numSegments }).map((_, segmentIndex) => {
          // Calculate position along the wing span
          const segmentWidth = sectionLength / numSegments
          const spanPosition = section.start + segmentIndex * segmentWidth + segmentWidth / 2

          // Calculate chord at this position (linear taper)
          const spanRatio = (spanPosition + wingLength / 2) / wingLength
          const chordAtPos = rootChord - (rootChord - tipChord) * spanRatio

          // Base position (stowed)
          const basePosition = {
            x: 0,
            y: 0,
            z: spanPosition,
          }

          // Deployed position
          const deployedPosition = calculateDeploymentPosition(basePosition, spanPosition)

          // Current position based on deployment percentage
          const currentPosition = {
            x: basePosition.x + (deployedPosition.x - basePosition.x) * deploymentPercentage,
            y: basePosition.y + (deployedPosition.y - basePosition.y) * deploymentPercentage,
            z: basePosition.z,
          }

          // Explosion offset
          const explosionOffset = viewMode === "exploded" ? explodeAmount * 0.5 : 0

          return (
            <group
              key={`${sectionIndex}-${segmentIndex}`}
              position={[currentPosition.x, currentPosition.y, currentPosition.z]}
            >
              {/* Slat segment */}
              <group position={[0, 0, 0]}>
                {/* Main slat body - curved shape */}
                <mesh material={slatMaterial} position={[0, 0, 0]}>
                  <cylinderGeometry
                    args={[
                      slatThickness / 1.5,
                      slatThickness / 1.5,
                      segmentWidth * 0.9,
                      16,
                      1,
                      true,
                      Math.PI / 2,
                      Math.PI,
                    ]}
                    rotation={[0, 0, Math.PI / 2]}
                    position={[-chordAtPos / 8, 0, 0]}
                  />
                </mesh>

                {/* Slat trailing edge connection */}
                <mesh material={slatMaterial} position={[chordAtPos / 8, 0, 0]}>
                  <boxGeometry args={[chordAtPos / 4, slatThickness, segmentWidth * 0.9]} />
                </mesh>
              </group>

              {/* Tracks (2 per slat segment) */}
              {[-0.3, 0.3].map((trackOffset, trackIndex) => {
                const trackPoints = generateTrackPoints(spanPosition)
                const trackCurve = new THREE.CatmullRomCurve3(
                  trackPoints.map((p) => new THREE.Vector3(p.x, p.y, trackOffset * segmentWidth * 0.4)),
                )

                return (
                  <group key={trackIndex} position={[0, 0, 0]}>
                    {/* Track visualization */}
                    <mesh material={trackMaterial}>
                      <tubeGeometry args={[trackCurve, 20, 0.01, 8, false]} />
                    </mesh>

                    {/* Track rollers */}
                    <mesh
                      material={actuatorMaterial}
                      position={[currentPosition.x * 0.8, currentPosition.y * 0.8, trackOffset * segmentWidth * 0.4]}
                    >
                      <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} rotation={[Math.PI / 2, 0, 0]} />
                    </mesh>
                  </group>
                )
              })}

              {/* Hydraulic actuator */}
              <group position={[0, 0, 0]}>
                {/* Actuator body */}
                <mesh
                  material={actuatorMaterial}
                  position={[
                    -slatDepth * 0.3 * (1 - deploymentPercentage),
                    -slatDrop * 0.3 * (1 - deploymentPercentage),
                    0,
                  ]}
                >
                  <cylinderGeometry
                    args={[0.02, 0.02, 0.15, 8]}
                    rotation={[0, 0, Math.PI / 4 - (deploymentPercentage * Math.PI) / 6]}
                  />
                </mesh>

                {/* Hydraulic piston */}
                <mesh
                  material={hydraulicMaterial}
                  position={[-slatDepth * 0.5 * deploymentPercentage, -slatDrop * 0.5 * deploymentPercentage, 0]}
                >
                  <cylinderGeometry
                    args={[0.015, 0.015, 0.1 + 0.1 * deploymentPercentage, 8]}
                    rotation={[0, 0, Math.PI / 4 - (deploymentPercentage * Math.PI) / 6]}
                  />
                </mesh>

                {/* Mounting points */}
                <mesh material={actuatorMaterial} position={[0, 0, 0]}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                </mesh>

                <mesh
                  material={actuatorMaterial}
                  position={[-slatDepth * 0.6 * deploymentPercentage, -slatDrop * 0.6 * deploymentPercentage, 0]}
                >
                  <sphereGeometry args={[0.025, 8, 8]} />
                </mesh>
              </group>
            </group>
          )
        })
      })}
    </group>
  )
}
