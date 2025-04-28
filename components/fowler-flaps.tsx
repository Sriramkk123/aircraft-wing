"use client"

import { useRef, useMemo } from "react"
import * as THREE from "three"

export function FowlerFlaps({
  viewMode = "complete",
  explodeAmount = 0,
  deploymentPercentage = 0, // 0 = stowed, 1 = fully deployed
}) {
  const groupRef = useRef()

  // Wing parameters (matching the wing box)
  const wingLength = 5 // 5 meters
  const rootChord = 2 // 2 meters at root
  const tipChord = 1.4 // 1.4 meters at tip (semi-tapered)

  // Flap parameters
  const flapWidth = 0.6 // Width of the flap (percentage of chord)
  const flapExtension = 0.3 // How far the flap extends when deployed (percentage of chord)
  const flapRotation = Math.PI / 6 // Maximum rotation angle when deployed (30 degrees)
  const flapThickness = 0.06 // Thickness of the flap
  const vaneThickness = 0.04 // Thickness of the secondary flap (vane)

  // Flap sections
  const flapSections = [
    { start: -2.25, end: -0.75, name: "Inboard Flap" },
    { start: -0.5, end: 1.0, name: "Mid Flap" },
    { start: 1.25, end: 2.25, name: "Outboard Flap" },
  ]

  // Material properties based on view mode
  const flapMaterial = useMemo(() => {
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

  const vaneMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#8595a8",
      metalness: 0.7,
      roughness: 0.3,
      transparent: viewMode === "xray",
      opacity: viewMode === "xray" ? 0.4 : 1,
      wireframe: viewMode === "wireframe",
      side: THREE.DoubleSide,
    })
  }, [viewMode])

  const trackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#3a4a5a",
      metalness: 0.8,
      roughness: 0.2,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  const bracketMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#5a6a7a",
      metalness: 0.6,
      roughness: 0.4,
      wireframe: viewMode === "wireframe",
    })
  }, [viewMode])

  // Calculate deployment position and rotation based on percentage
  const calculateDeployment = (basePosition, spanPosition, chordAtPos) => {
    // Taper the deployment slightly from root to tip
    const taperFactor = 1 - (Math.abs(spanPosition) / (wingLength / 2)) * 0.2

    // First 50% of deployment is extension, second 50% is rotation
    const extensionPhase = Math.min(1, deploymentPercentage * 2)
    const rotationPhase = Math.max(0, deploymentPercentage * 2 - 1)

    // Calculate backward extension
    const backwardX = flapExtension * chordAtPos * extensionPhase * taperFactor

    // Calculate downward rotation (only in second phase)
    const rotation = flapRotation * rotationPhase

    return {
      x: basePosition.x + backwardX,
      y: basePosition.y,
      z: basePosition.z,
      rotation: rotation,
    }
  }

  // Calculate vane (second element) position and rotation
  const calculateVaneDeployment = (mainFlapDeployment, chordAtPos) => {
    // Vane deploys slightly differently - it rotates more and positions between main flap and wing
    const vaneRotation = mainFlapDeployment.rotation * 1.2
    const vaneOffsetX = -chordAtPos * 0.1 * deploymentPercentage
    const vaneOffsetY = -chordAtPos * 0.05 * deploymentPercentage

    return {
      x: mainFlapDeployment.x + vaneOffsetX,
      y: mainFlapDeployment.y + vaneOffsetY,
      z: mainFlapDeployment.z,
      rotation: vaneRotation,
    }
  }

  return (
    <group ref={groupRef} position={[1.5, 0, 0]} rotation={[0, 0, 0]}>
      {flapSections.map((section, sectionIndex) => {
        // Calculate section length
        const sectionLength = section.end - section.start
        // Number of flap segments in this section
        const numSegments = Math.max(2, Math.floor(sectionLength / 0.5))

        return Array.from({ length: numSegments }).map((_, segmentIndex) => {
          // Calculate position along the wing span
          const segmentWidth = sectionLength / numSegments
          const spanPosition = section.start + segmentIndex * segmentWidth + segmentWidth / 2

          // Calculate chord at this position (linear taper)
          const spanRatio = (spanPosition + wingLength / 2) / wingLength
          const chordAtPos = rootChord - (rootChord - tipChord) * spanRatio
          const flapChord = chordAtPos * flapWidth

          // Base position (stowed)
          const basePosition = {
            x: 0,
            y: 0,
            z: spanPosition,
          }

          // Deployed position and rotation
          const deployment = calculateDeployment(basePosition, spanPosition, chordAtPos)
          const vaneDeployment = calculateVaneDeployment(deployment, chordAtPos)

          // Explosion offset
          const explosionOffset = viewMode === "exploded" ? explodeAmount * 0.5 : 0

          return (
            <group key={`${sectionIndex}-${segmentIndex}`}>
              {/* Main flap element */}
              <group position={[deployment.x, deployment.y, deployment.z]} rotation={[0, 0, deployment.rotation]}>
                {/* Main flap body */}
                <mesh material={flapMaterial}>
                  <boxGeometry args={[flapChord, flapThickness, segmentWidth * 0.9]} />
                </mesh>

                {/* Flap leading edge (rounded) */}
                <mesh material={flapMaterial} position={[-flapChord / 2, 0, 0]}>
                  <cylinderGeometry
                    args={[flapThickness / 2, flapThickness / 2, segmentWidth * 0.9, 8, 1, false]}
                    rotation={[0, 0, Math.PI / 2]}
                  />
                </mesh>

                {/* Flap trailing edge (tapered) */}
                <mesh material={flapMaterial} position={[flapChord / 2 - flapThickness / 4, 0, 0]}>
                  <boxGeometry args={[flapThickness / 2, flapThickness / 2, segmentWidth * 0.9]} />
                </mesh>
              </group>

              {/* Secondary flap element (vane) */}
              <group
                position={[vaneDeployment.x, vaneDeployment.y, vaneDeployment.z]}
                rotation={[0, 0, vaneDeployment.rotation]}
              >
                {/* Vane body */}
                <mesh material={vaneMaterial}>
                  <boxGeometry args={[flapChord * 0.6, vaneThickness, segmentWidth * 0.85]} />
                </mesh>

                {/* Vane leading edge (rounded) */}
                <mesh material={vaneMaterial} position={[(-flapChord * 0.6) / 2, 0, 0]}>
                  <cylinderGeometry
                    args={[vaneThickness / 2, vaneThickness / 2, segmentWidth * 0.85, 8, 1, false]}
                    rotation={[0, 0, Math.PI / 2]}
                  />
                </mesh>

                {/* Vane trailing edge (tapered) */}
                <mesh material={vaneMaterial} position={[(flapChord * 0.6) / 2 - vaneThickness / 4, 0, 0]}>
                  <boxGeometry args={[vaneThickness / 2, vaneThickness / 2, segmentWidth * 0.85]} />
                </mesh>
              </group>

              {/* Flap tracks (2 per segment) */}
              {[-0.3, 0.3].map((trackOffset, trackIndex) => {
                // Create curved track path
                const trackCurve = new THREE.CubicBezierCurve3(
                  new THREE.Vector3(0, 0, spanPosition + trackOffset * segmentWidth * 0.4),
                  new THREE.Vector3(
                    flapExtension * chordAtPos * 0.3,
                    0,
                    spanPosition + trackOffset * segmentWidth * 0.4,
                  ),
                  new THREE.Vector3(
                    flapExtension * chordAtPos * 0.7,
                    -flapExtension * chordAtPos * 0.2,
                    spanPosition + trackOffset * segmentWidth * 0.4,
                  ),
                  new THREE.Vector3(
                    flapExtension * chordAtPos,
                    -flapExtension * chordAtPos * 0.4,
                    spanPosition + trackOffset * segmentWidth * 0.4,
                  ),
                )

                const trackPoints = trackCurve.getPoints(20)
                const trackGeometry = new THREE.BufferGeometry().setFromPoints(trackPoints)

                return (
                  <group key={trackIndex}>
                    {/* Track visualization */}
                    <line geometry={trackGeometry}>
                      <lineBasicMaterial attach="material" color="#3a4a5a" linewidth={2} />
                    </line>

                    {/* Track housing */}
                    <mesh
                      material={trackMaterial}
                      position={[flapExtension * chordAtPos * 0.3, 0, spanPosition + trackOffset * segmentWidth * 0.4]}
                    >
                      <boxGeometry args={[flapExtension * chordAtPos * 0.6, 0.04, 0.04]} />
                    </mesh>

                    {/* Flap bracket */}
                    <mesh
                      material={bracketMaterial}
                      position={[
                        deployment.x - Math.sin(deployment.rotation) * flapThickness,
                        deployment.y + Math.cos(deployment.rotation) * flapThickness,
                        spanPosition + trackOffset * segmentWidth * 0.4,
                      ]}
                    >
                      <boxGeometry args={[0.1, 0.15, 0.03]} rotation={[0, 0, deployment.rotation]} />
                    </mesh>

                    {/* Vane bracket */}
                    <mesh
                      material={bracketMaterial}
                      position={[
                        vaneDeployment.x - Math.sin(vaneDeployment.rotation) * vaneThickness,
                        vaneDeployment.y + Math.cos(vaneDeployment.rotation) * vaneThickness,
                        spanPosition + trackOffset * segmentWidth * 0.4,
                      ]}
                    >
                      <boxGeometry args={[0.08, 0.12, 0.02]} rotation={[0, 0, vaneDeployment.rotation]} />
                    </mesh>
                  </group>
                )
              })}

              {/* Actuator mechanism */}
              <group position={[flapExtension * chordAtPos * 0.5, -0.1, spanPosition]}>
                {/* Actuator housing */}
                <mesh material={bracketMaterial} position={[0, 0, 0]}>
                  <boxGeometry args={[0.15, 0.06, 0.06]} />
                </mesh>

                {/* Actuator arm */}
                <mesh material={bracketMaterial} position={[deployment.x * 0.5, -0.1 * deploymentPercentage, 0]}>
                  <boxGeometry
                    args={[0.2 + 0.1 * deploymentPercentage, 0.04, 0.04]}
                    rotation={[0, 0, deployment.rotation * 0.5]}
                  />
                </mesh>
              </group>
            </group>
          )
        })
      })}
    </group>
  )
}
