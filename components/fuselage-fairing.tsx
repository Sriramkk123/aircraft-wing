"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function FuselageFairing({ viewMode = "complete", explodeAmount = 0 }) {
  const groupRef = useRef<THREE.Group | null>(null)

  // Dimensions (matching wing box chord and thickness)
  const wingRootChord = 3
  const fairingSpan = 0.5
  const fairingHeight = 0.5

  // Create teardrop cross-section shape
  const crossSection = useMemo(() => {
    const w = wingRootChord
    const h = fairingHeight
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.quadraticCurveTo(-w / 4, h * 0.6, 0, h * 0.8)
    shape.quadraticCurveTo(w / 4, h * 0.6, w / 2, 0)
    shape.quadraticCurveTo(w / 4, -h * 0.4, 0, -h * 0.5)
    shape.quadraticCurveTo(-w / 4, -h * 0.4, -w / 2, 0)
    return shape
  }, [wingRootChord, fairingHeight])

  // Material for fairing
  const fairingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7a7a7a",
        metalness: 0.6,
        roughness: 0.3,
        transparent: viewMode === "xray",
        opacity: viewMode === "xray" ? 0.3 : 1,
        wireframe: viewMode === "wireframe",
        side: THREE.DoubleSide,
      }),
    [viewMode]
  )

  // Rotate gently for visualization
  useFrame((state) => {
    if (groupRef.current && viewMode === "complete") {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05
    }
  })

  // Panel line edges (spanwise)
  const edgeGeometry = new THREE.EdgesGeometry(new THREE.ShapeGeometry(crossSection))
  const panelOffsets = [-fairingSpan * 0.25, fairingSpan * 0.25]

  // Access hatch
  const hatch = {
    width: wingRootChord * 0.3,
    height: fairingHeight * 0.2,
    depth: 0.02,
    x: 0,
    y: -fairingHeight * 0.2,
    z: 0,
  }

  return (
    <group ref={groupRef} position={[0, -fairingHeight / 2, 0]}>
      {/* Main fairing body */}
      <mesh material={fairingMaterial}>
        <extrudeGeometry
          args={[crossSection, { steps: 1, depth: fairingSpan, bevelEnabled: false }]}
        />
      </mesh>

      {/* Panel lines */}
      {panelOffsets.map((z, idx) => (
        <lineSegments key={idx} geometry={edgeGeometry} position={[0, 0, z]}>
          <lineBasicMaterial color="#000" linewidth={1} transparent opacity={viewMode === "xray" ? 0.3 : 1} />
        </lineSegments>
      ))}

      {/* Access hatch */}
      <mesh position={[hatch.x, hatch.y, hatch.z]}>
        <boxGeometry args={[hatch.width, hatch.height, hatch.depth]} />
        <meshStandardMaterial
          color="#5a5a5a"
          metalness={0.7}
          roughness={0.4}
          transparent={viewMode === "xray"}
          opacity={viewMode === "xray" ? 0.3 : 1}
          wireframe={viewMode === "wireframe"}
        />
      </mesh>
    </group>
  )
}
