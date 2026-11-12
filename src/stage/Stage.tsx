import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import type { Prim, V3, View } from '../core/types'
import { Label, LabelCtx, LabelOverlay, LabelProjector, LabelStore, PrimView, T, TilesHud } from './prims'

export const VIEWS = {
  iso: { pos: [7.5, -10, 7.5], target: [0, 0, 1] },
  top: { pos: [0, -2.2, 14], target: [0, 0, 0] },
  front: { pos: [0, -14, 3.2], target: [0, 0, 2] },
  bench: { pos: [0, -12.5, 8.5], target: [0, 0.5, 1.2] },
  low: { pos: [9, -9, 4.5], target: [0, 0, 1.2] },
} satisfies Record<string, View>

/** The lab bench: a holographic table with a measured grid, axes and a ring of lamps. */
function LabRoom({ axes, table, accent }: { axes: boolean; table: boolean; accent: string }) {
  const posts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), [])
  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, table ? -1.25 : -4, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#0b171b" roughness={0.95} />
      </mesh>
      {table && (
        <group>
          {/* bench top */}
          <mesh position={[0, -0.11, 0]}>
            <cylinderGeometry args={[7.6, 7.9, 0.2, 72]} />
            <meshStandardMaterial color="#10262c" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[1.4, 2.2, 1.0, 36]} />
            <meshStandardMaterial color="#0d1e23" />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
            <ringGeometry args={[7.45, 7.6, 96]} />
            <meshBasicMaterial color={accent} transparent opacity={0.7} />
          </mesh>
          <gridHelper args={[12, 12, '#2f5a63', '#1d3a41']} position={[0, 0.004, 0]} />
        </group>
      )}
      {posts.map((a) => (
        <group key={a} position={[Math.cos(a) * 13, 0, Math.sin(a) * 13]}>
          <mesh position={[0, 1.6, 0]}>
            <boxGeometry args={[0.12, 5.6, 0.12]} />
            <meshStandardMaterial color="#132a30" />
          </mesh>
          <mesh position={[0, 4.4, 0]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshBasicMaterial color={accent} />
          </mesh>
        </group>
      ))}
      {axes && <Axes />}
    </group>
  )
}

const AXES: [V3, string, string][] = [
  [[5.6, 0, 0], '#ff6b6b', 'x'],
  [[0, 5.6, 0], '#7bed9f', 'y'],
  [[0, 0, 4.5], '#70a1ff', 'z'],
]
function Axes() {
  const lines = useMemo(
    () =>
      AXES.map(([v, c]) => {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.006, 0), T(v)])
        return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.7 }))
      }),
    [],
  )
  return (
    <group>
      {AXES.map(([v, c, n], i) => {
        const end = T(v)
        return (
          <group key={n}>
            <primitive object={lines[i]} />
            <group position={end}>
              <Label deps={[n, c]}>
                <span className="axis-tag" style={{ color: c }}>
                  {n}
                </span>
              </Label>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/** Glides the camera to a new view whenever the view changes; the user can orbit freely in between. */
function CameraRig({ view }: { view: View }) {
  const { camera } = useThree()
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3; t: number } | null>(null)
  const key = JSON.stringify(view)
  useEffect(() => {
    goal.current = { pos: T(view.pos), target: T(view.target ?? [0, 0, 0]), t: 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-dt * 3.2)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    g.t += dt
    if (g.t > 2.2) goal.current = null
  })
  return null
}

export function Stage({
  prims,
  view = VIEWS.iso,
  axes = true,
  table = true,
  accent = '#52e3c2',
  children,
  legend,
  autoRotate = false,
  hint = true,
}: {
  autoRotate?: boolean
  hint?: boolean
  prims: Prim[]
  view?: View
  axes?: boolean
  table?: boolean
  accent?: string
  children?: ReactNode
  legend?: [string, string][]
}) {
  const labels = useMemo(() => new LabelStore(), [])
  return (
    <div className="canvas-wrap">
      <Canvas camera={{ fov: 40, position: T(view.pos).toArray(), near: 0.1, far: 200 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#081114']} />
        <fog attach="fog" args={['#081114', 22, 48]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 12, 8]} intensity={1.15} />
        <pointLight position={[0, 6, 0]} intensity={18} distance={20} color={accent} />
        <LabelCtx.Provider value={labels}>
          <LabRoom axes={axes} table={table} accent={accent} />
          {prims.map((p) => (
            <PrimView key={`${p.k}:${p.id}`} p={p} />
          ))}
          {children}
          <LabelProjector />
        </LabelCtx.Provider>
        <OrbitControls makeDefault enableDamping dampingFactor={0.12} maxDistance={34} minDistance={3} autoRotate={autoRotate} autoRotateSpeed={0.5} />
        <CameraRig view={view} />
      </Canvas>
      <LabelOverlay store={labels} />
      <TilesHud prims={prims} />
      {legend && legend.length > 0 && (
        <ul className="legend">
          {legend.map(([c, l]) => (
            <li key={l}>
              <i style={{ background: c }} />
              {l}
            </li>
          ))}
        </ul>
      )}
      {hint && <p className="drag-hint">drag to orbit · scroll to zoom</p>}
    </div>
  )
}
