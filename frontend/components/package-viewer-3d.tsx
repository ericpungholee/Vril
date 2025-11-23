"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei"
import * as THREE from "three"
import type { PackageModel, PanelId } from "@/lib/packaging-types"
import { MiniDielineHud } from "@/components/mini-dieline-hud"

interface PackageViewer3DProps {
  model: PackageModel
  selectedPanelId?: PanelId | null
  onPanelSelect?: (panelId: PanelId | null) => void
  color?: string
}

function BoxPackage3D({
  dimensions,
  selectedPanelId,
  onPanelSelect,
  color = "#93c5fd",
}: {
  dimensions: { width: number; height: number; depth: number }
  selectedPanelId?: PanelId | null
  onPanelSelect?: (panelId: PanelId | null) => void
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { width, height, depth } = dimensions

  const fixedScale = 0.01 // 1mm = 0.01 Three.js units
  const w = width * fixedScale
  const h = height * fixedScale
  const d = depth * fixedScale

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2
    }
  })

  // Create materials for each face
  const materials = useMemo(() => {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1,
    })

    const selectedMaterial = new THREE.MeshStandardMaterial({
      color: "#fbbf24", // Yellow for selected
      roughness: 0.3,
      metalness: 0.1,
      emissive: "#fbbf24",
      emissiveIntensity: 0.3,
    })

    // Three.js BoxGeometry face order: [right, left, top, bottom, front, back]
    // We need to map our panel IDs to the correct face indices
    const faceToPanelMap: Record<number, PanelId> = {
      0: "right",   // right face
      1: "left",    // left face
      2: "top",     // top face
      3: "bottom",  // bottom face
      4: "front",   // front face
      5: "back",    // back face
    }

    const materials: THREE.Material[] = []
    for (let i = 0; i < 6; i++) {
      const panelId = faceToPanelMap[i]
      if (panelId === selectedPanelId) {
        materials.push(selectedMaterial.clone())
      } else {
        materials.push(baseMaterial.clone())
      }
    }

    return materials
  }, [color, selectedPanelId])

  const handleClick = (event: any) => {
    if (!onPanelSelect) return

    event.stopPropagation()
    const intersection = event.intersections?.[0]
    if (!intersection || intersection.faceIndex === undefined) return

    // Each face has 2 triangles, so divide by 2 to get face index
    const faceIndex = Math.floor(intersection.faceIndex / 2)

    // Three.js BoxGeometry face order: [right, left, top, bottom, front, back]
    const faceToPanelMap: Record<number, PanelId> = {
      0: "right",
      1: "left",
      2: "top",
      3: "bottom",
      4: "front",
      5: "back",
    }
    
    if (faceIndex >= 0 && faceIndex < 6) {
      const clickedPanel = faceToPanelMap[faceIndex]
      
      if (clickedPanel === selectedPanelId) {
        onPanelSelect(null) // Deselect if clicking same panel
      } else {
        onPanelSelect(clickedPanel)
      }
    }
  }

  return (
    <mesh
      ref={meshRef}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default"
      }}
    >
      <boxGeometry args={[w, h, d]} />
      <primitive object={materials} attach="material" />
    </mesh>
  )
}

function CylinderPackage3D({
  dimensions,
  selectedPanelId,
  onPanelSelect,
  color = "#93c5fd",
}: {
  dimensions: { width: number; height: number; depth: number }
  selectedPanelId?: PanelId | null
  onPanelSelect?: (panelId: PanelId | null) => void
  color?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { width, height } = dimensions

  const fixedScale = 0.01
  const radius = (width * fixedScale) / 2
  const cylinderHeight = height * fixedScale

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2
    }
  })

  const baseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.1,
      }),
    [color]
  )

  const selectedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fbbf24",
        roughness: 0.3,
        metalness: 0.1,
        emissive: "#fbbf24",
        emissiveIntensity: 0.3,
      }),
    []
  )

  const handleBodyClick = (event: THREE.Event) => {
    if (!onPanelSelect) return
    event.stopPropagation()
    if ("body" === selectedPanelId) {
      onPanelSelect(null)
    } else {
      onPanelSelect("body")
    }
  }

  const handleTopClick = (event: THREE.Event) => {
    if (!onPanelSelect) return
    event.stopPropagation()
    if ("top" === selectedPanelId) {
      onPanelSelect(null)
    } else {
      onPanelSelect("top")
    }
  }

  const handleBottomClick = (event: THREE.Event) => {
    if (!onPanelSelect) return
    event.stopPropagation()
    if ("bottom" === selectedPanelId) {
      onPanelSelect(null)
    } else {
      onPanelSelect("bottom")
    }
  }

  return (
    <group ref={groupRef}>
      {/* Main cylinder body */}
      <mesh
        castShadow
        receiveShadow
        onClick={handleBodyClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default"
        }}
        material={selectedPanelId === "body" ? selectedMaterial : baseMaterial}
      >
        <cylinderGeometry args={[radius, radius, cylinderHeight, 32]} />
      </mesh>
      {/* Top cap */}
      <mesh
        position={[0, cylinderHeight / 2 + 0.01, 0]}
        castShadow
        receiveShadow
        onClick={handleTopClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default"
        }}
        material={selectedPanelId === "top" ? selectedMaterial : baseMaterial}
      >
        <cylinderGeometry args={[radius, radius, 0.02, 32]} />
      </mesh>
      {/* Bottom cap */}
      <mesh
        position={[0, -cylinderHeight / 2 - 0.01, 0]}
        castShadow
        receiveShadow
        onClick={handleBottomClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default"
        }}
        material={selectedPanelId === "bottom" ? selectedMaterial : baseMaterial}
      >
        <cylinderGeometry args={[radius, radius, 0.02, 32]} />
      </mesh>
    </group>
  )
}

function Package3D({ model, selectedPanelId, onPanelSelect, color }: PackageViewer3DProps) {
  const { type, dimensions } = model

  switch (type) {
    case "box":
      return (
        <BoxPackage3D
          dimensions={dimensions}
          selectedPanelId={selectedPanelId}
          onPanelSelect={onPanelSelect}
          color={color}
        />
      )

    case "cylinder":
      return (
        <CylinderPackage3D
          dimensions={dimensions}
          selectedPanelId={selectedPanelId}
          onPanelSelect={onPanelSelect}
          color={color}
        />
      )

    default:
      return null
  }
}

export function PackageViewer3D(props: PackageViewer3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-border overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[4, 3, 4]} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={2} maxDistance={10} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Environment for reflections */}
        <Environment preset="apartment" />

        {/* Package */}
        <Package3D {...props} />
      </Canvas>

      {props.model.dielines && <MiniDielineHud dielines={props.model.dielines} />}
    </div>
  )
}
