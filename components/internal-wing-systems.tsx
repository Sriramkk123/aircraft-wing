"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

export function InternalWingSystems({ viewMode = "complete", explodeAmount = 0 }: { viewMode: string; explodeAmount: number }) {
  const groupRef = useRef<THREE.Group | null>(null)

  const wingLength = 5
  const rootChord = 3
  const maxThickness = 0.5
  const ribSpacing = 0.5

  // Rib positions along span
  const ribPositions = useMemo(() => {
    const count = Math.floor(wingLength / ribSpacing) + 1
    const pts: number[] = []
    for (let i = 0; i < count; i++) pts.push(i * ribSpacing - wingLength / 2)
    return pts
  }, [wingLength, ribSpacing])

  // Materials
  const fuelBayMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#824B0A",
        metalness: 0.3,
        roughness: 0.6,
        transparent: viewMode === "xray",
        opacity: viewMode === "xray" ? 0.3 : 1,
      }),
    [viewMode]
  )
  const fuelLineMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#FFD700", metalness: 0.2, roughness: 0.7 }),
    []
  )
  const hydraulicMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#0047AB", metalness: 0.2, roughness: 0.7 }),
    []
  )
  const electricalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#555555", metalness: 0.1, roughness: 0.8 }),
    []
  )
  const valveMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#FF0000", emissive: "#FF0000", emissiveIntensity: 0.5 }),
    []
  )

  // Fuel line curve
  const fuelCurve = useMemo(() => {
    const pts = ribPositions.map((z) => new THREE.Vector3(0, -maxThickness / 4, z))
    return new THREE.CatmullRomCurve3(pts)
  }, [ribPositions, maxThickness])
  const fuelLineGeometry = useMemo(
    () => new THREE.TubeGeometry(fuelCurve, ribPositions.length * 4, 0.02, 8, false),
    [fuelCurve, ribPositions]
  )

  // Electrical conduit curve
  const elecCurve = useMemo(() => {
    const pts = ribPositions.map((z) => new THREE.Vector3(0, maxThickness / 2 - 0.02, z))
    return new THREE.CatmullRomCurve3(pts)
  }, [ribPositions, maxThickness])
  const elecGeometry = useMemo(
    () => new THREE.TubeGeometry(elecCurve, ribPositions.length * 4, 0.01, 6, false),
    [elecCurve, ribPositions]
  )

  // Animation rotation
  useFrame((state) => {
    if (groupRef.current && viewMode === "complete") {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.02
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Placeholder fuel bays between ribs */}
      {ribPositions.map((z, i) => (
        <mesh key={`bay-${i}`} position={[0, 0, z]}> 
          <boxGeometry args={[rootChord * 0.3, maxThickness * 0.5, ribSpacing * 0.8]} />
          <meshStandardMaterial {...fuelBayMaterial} />
        </mesh>
      ))}

      {/* Fuel line */}
      <mesh geometry={fuelLineGeometry}>
        <meshStandardMaterial {...fuelLineMaterial} />
      </mesh>

      {/* Electrical conduit */}
      <mesh geometry={elecGeometry}>
        <meshStandardMaterial {...electricalMaterial} />
      </mesh>

      {/* Hydraulic lines to flaps/spoilers */}
      {ribPositions.map((z, i) => (
        <mesh key={`hyd-${i}`} position={[rootChord * 0.2, 0, z]}>  
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial {...hydraulicMaterial} />
        </mesh>
      ))}

      {/* Pressure relief valves */}
      {ribPositions.map((z, i) => (
        <mesh key={`valve-${i}`} position={[-rootChord * 0.2, 0, z]}> 
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial {...valveMaterial} />
        </mesh>
      ))}
    </group>
  )
}
