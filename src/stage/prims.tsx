import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Prim, V3 } from '../core/types'

/**
 * Labels are plain DOM elements laid over the canvas. Each Label leaves an empty
 * anchor group in the scene; a projector moves the DOM element to the anchor's
 * screen position every frame. (Lighter and steadier than one React root per label.)
 */
export class LabelStore {
  map = new Map<number, { obj: THREE.Object3D; node: ReactNode }>()
  els = new Map<number, HTMLDivElement>()
  private subs = new Set<() => void>()
  private snap: [number, ReactNode][] = []
  private queued = false
  emit() {
    if (this.queued) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      this.snap = [...this.map].map(([k, v]) => [k, v.node])
      this.subs.forEach((f) => f())
    })
  }
  subscribe = (f: () => void) => {
    this.subs.add(f)
    return () => {
      this.subs.delete(f)
    }
  }
  get = () => this.snap
}
export const LabelCtx = createContext<LabelStore | null>(null)
let nextLabel = 1

export function Label({ children, deps }: { children: ReactNode; deps: unknown[] }) {
  const store = useContext(LabelCtx)
  const ref = useRef<THREE.Group>(null!)
  const id = useMemo(() => nextLabel++, [])
  useLayoutEffect(() => {
    if (!store) return
    store.map.set(id, { obj: ref.current, node: children })
    store.emit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useLayoutEffect(
    () => () => {
      store?.map.delete(id)
      store?.emit()
    },
    [store, id],
  )
  return <group ref={ref} />
}

export function LabelProjector() {
  const store = useContext(LabelCtx)
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    if (!store) return
    for (const [id, e] of store.map) {
      const el = store.els.get(id)
      if (!el) continue
      let vis = true
      for (let o: THREE.Object3D | null = e.obj; o; o = o.parent) if (!o.visible) vis = false
      e.obj.getWorldPosition(v).project(camera)
      if (!vis || v.z > 1) {
        el.style.visibility = 'hidden'
        continue
      }
      el.style.visibility = 'visible'
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -50%)`
    }
  })
  return null
}

export function LabelOverlay({ store }: { store: LabelStore }) {
  const items = useSyncExternalStore(store.subscribe, store.get)
  return (
    <div className="label-layer" aria-hidden>
      {items.map(([id, node]) => (
        <div
          key={id}
          className="lbl"
          style={{ visibility: 'hidden' }}
          ref={(el) => {
            if (el) store.els.set(id, el)
            else store.els.delete(id)
          }}
        >
          {node}
        </div>
      ))}
    </div>
  )
}

/** Math coordinates (z up) to three.js coordinates (y up). */
export const T = (v: V3) => new THREE.Vector3(v[0], v[2], -v[1])
const UP = new THREE.Vector3(0, 1, 0)
const ease = (dt: number, speed = 7) => 1 - Math.exp(-dt * speed)

type P<K extends Prim['k']> = Extract<Prim, { k: K }>

function Tag({ text, color, size = 'sm' }: { text: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Label deps={[text, color, size]}>
      <div className={`tag tag-${size}`} style={{ color, borderColor: color }}>
        {text}
      </div>
    </Label>
  )
}

function ArrowPrim({ p }: { p: P<'arrow'> }) {
  const shaft = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Mesh>(null!)
  const tag = useRef<THREE.Group>(null!)
  const cur = useRef({ from: T(p.from ?? [0, 0, 0]), to: T(p.to) })
  const tgt = useMemo(() => ({ from: T(p.from ?? [0, 0, 0]), to: T(p.to) }), [p.from, p.to])
  const r = p.r ?? 0.045
  const place = () => {
    const { from, to } = cur.current
    const d = to.clone().sub(from)
    const L = d.length()
    const vis = L > 1e-4
    shaft.current.visible = head.current.visible = vis
    if (!vis) return
    const n = d.clone().divideScalar(L)
    const hl = Math.min(0.32, L * 0.4)
    const q = new THREE.Quaternion().setFromUnitVectors(UP, n)
    shaft.current.quaternion.copy(q)
    shaft.current.scale.set(1, Math.max(L - hl, 1e-4), 1)
    shaft.current.position.copy(from).addScaledVector(n, (L - hl) / 2)
    head.current.quaternion.copy(q)
    head.current.scale.set(1, hl, 1)
    head.current.position.copy(to).addScaledVector(n, -hl / 2)
    tag.current.position.copy(to).addScaledVector(n, 0.32)
  }
  useLayoutEffect(place)
  useFrame((_, dt) => {
    const k = ease(dt)
    const c = cur.current
    if (c.from.distanceToSquared(tgt.from) + c.to.distanceToSquared(tgt.to) < 1e-8) return
    c.from.lerp(tgt.from, k)
    c.to.lerp(tgt.to, k)
    place()
  })
  const mat = <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.35} transparent={p.opacity != null} opacity={p.opacity ?? 1} />
  return (
    <group>
      <mesh ref={shaft}>
        <cylinderGeometry args={[r, r, 1, 14]} />
        {mat}
      </mesh>
      <mesh ref={head}>
        <coneGeometry args={[r * 2.8, 1, 18]} />
        {mat}
      </mesh>
      <group ref={tag}>{p.label && <Tag text={p.label} color={p.color} />}</group>
    </group>
  )
}

function PointPrim({ p }: { p: P<'point'> }) {
  const ref = useRef<THREE.Group>(null!)
  const tgt = useMemo(() => T(p.p), [p.p])
  const init = useRef(true)
  useFrame((_, dt) => {
    if (init.current) {
      ref.current.position.copy(tgt)
      init.current = false
    } else ref.current.position.lerp(tgt, ease(dt))
  })
  const r = p.r ?? 0.12
  return (
    <group ref={ref} position={tgt}>
      <mesh>
        <sphereGeometry args={[r, 20, 16]} />
        <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.45} />
      </mesh>
      {p.label && (
        <group position={[0, r + 0.28, 0]}>
          <Tag text={p.label} color={p.color} />
        </group>
      )}
    </group>
  )
}

function CloudPrim({ p }: { p: P<'cloud'> }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const cur = useRef<THREE.Vector3[]>([])
  const tgt = useMemo(() => p.pts.map(T), [p.pts])
  const max = Math.max(tgt.length, 1)
  const cap = useMemo(() => Math.max(64, 2 ** Math.ceil(Math.log2(max))), [max])
  const m = useMemo(() => new THREE.Object3D(), [])
  const settled = useRef(false)
  useEffect(() => {
    settled.current = false
    const c = cur.current
    for (let i = 0; i < tgt.length; i++) {
      if (!c[i]) c[i] = p.drop ? tgt[i].clone().add(new THREE.Vector3(0, 2.6, 0)) : tgt[i].clone()
    }
    c.length = tgt.length
    const mesh = ref.current
    mesh.count = tgt.length
    const colors = Array.isArray(p.color) ? p.color : null
    const col = new THREE.Color()
    for (let i = 0; i < tgt.length; i++) {
      col.set(colors ? colors[i] ?? colors[0] : (p.color as string))
      mesh.setColorAt(i, col)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [tgt, p.color, p.drop])
  useFrame((_, dt) => {
    if (settled.current && ref.current.userData.n === tgt.length) return
    const k = ease(dt, 6)
    const c = cur.current
    let moved = false
    for (let i = 0; i < tgt.length; i++) {
      if (!c[i]) continue
      if (c[i].distanceToSquared(tgt[i]) > 1e-7) {
        c[i].lerp(tgt[i], k)
        moved = true
      }
      m.position.copy(c[i])
      m.updateMatrix()
      ref.current.setMatrixAt(i, m.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.userData.n = tgt.length
    if (!moved) settled.current = true
  })
  const r = p.r ?? 0.07
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, cap]} key={cap} frustumCulled={false}>
      <sphereGeometry args={[r, 10, 8]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.12} />
    </instancedMesh>
  )
}

function LinePrim({ p }: { p: P<'line'> }) {
  const pts = useMemo(() => p.pts.map(T), [p.pts])
  if (pts.length < 2) return null
  return (
    <Line
      points={pts}
      color={p.color}
      lineWidth={p.w ?? 2}
      dashed={!!p.dashed}
      segments={!!p.segments}
      dashSize={0.18}
      gapSize={0.12}
      transparent={p.opacity != null}
      opacity={p.opacity ?? 1}
    />
  )
}

function GridPrim({ p }: { p: P<'grid'> }) {
  const n = p.n ?? 5
  const cur = useRef<number[]>([...p.m])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((2 * n + 1) * 4 * 3), 3))
    return g
  }, [n])
  const write = () => {
    const m = cur.current
    const arr = geo.attributes.position.array as Float32Array
    let o = 0
    const put = (x: number, y: number) => {
      const X = m[0] * x + m[1] * y
      const Y = m[3] * x + m[4] * y
      const Z = m[6] * x + m[7] * y
      arr[o++] = X
      arr[o++] = Z + 0.01
      arr[o++] = -Y
    }
    for (let i = -n; i <= n; i++) {
      put(i, -n)
      put(i, n)
      put(-n, i)
      put(n, i)
    }
    geo.attributes.position.needsUpdate = true
    geo.computeBoundingSphere()
  }
  useLayoutEffect(write, [geo])
  useFrame((_, dt) => {
    const c = cur.current
    let d = 0
    for (let i = 0; i < 9; i++) d += Math.abs(c[i] - p.m[i])
    if (d < 1e-5) return
    const k = ease(dt, 5)
    for (let i = 0; i < 9; i++) c[i] += (p.m[i] - c[i]) * k
    write()
  })
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <lineBasicMaterial color={p.color} transparent opacity={p.opacity ?? 0.75} />
    </lineSegments>
  )
}

const CUBE_EDGES = [0, 1, 0, 2, 0, 4, 1, 3, 1, 5, 2, 3, 2, 6, 3, 7, 4, 5, 4, 6, 5, 7, 6, 7]
const CUBE_TRIS = [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3]

function BoxPrim({ p }: { p: P<'box'> }) {
  const cur = useRef<number[]>([...p.basis.flat(), ...(p.origin ?? [0, 0, 0])])
  const tgt = useMemo(() => [...p.basis.flat(), ...(p.origin ?? [0, 0, 0])], [p.basis, p.origin])
  const [faces, edges] = useMemo(() => {
    const f = new THREE.BufferGeometry()
    f.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24), 3))
    f.setIndex(CUBE_TRIS)
    const e = new THREE.BufferGeometry()
    e.setAttribute('position', f.attributes.position)
    e.setIndex(CUBE_EDGES)
    return [f, e]
  }, [])
  const write = () => {
    const c = cur.current
    const a = faces.attributes.position.array as Float32Array
    for (let i = 0; i < 8; i++) {
      const s = [i & 1, (i >> 1) & 1, (i >> 2) & 1]
      const v: V3 = [c[9], c[10], c[11]]
      for (let b = 0; b < 3; b++) for (let d = 0; d < 3; d++) v[d] += s[b] * c[b * 3 + d]
      const t = T(v)
      a.set([t.x, t.y, t.z], i * 3)
    }
    faces.attributes.position.needsUpdate = true
    faces.computeVertexNormals()
    faces.computeBoundingSphere()
  }
  useLayoutEffect(write, [faces])
  useFrame((_, dt) => {
    const c = cur.current
    let d = 0
    for (let i = 0; i < 12; i++) d += Math.abs(c[i] - tgt[i])
    if (d < 1e-5) return
    const k = ease(dt, 5)
    for (let i = 0; i < 12; i++) c[i] += (tgt[i] - c[i]) * k
    write()
  })
  return (
    <group>
      <mesh geometry={faces}>
        <meshStandardMaterial color={p.color} transparent opacity={p.opacity ?? 0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={p.color} />
      </lineSegments>
    </group>
  )
}

function PlanePrim({ p }: { p: P<'plane'> }) {
  const ref = useRef<THREE.Group>(null!)
  const size = p.size ?? 6
  const tgt = useMemo(() => {
    const nl = Math.hypot(...p.n) || 1
    const n = T([p.n[0] / nl, p.n[1] / nl, p.n[2] / nl])
    const d = p.d / nl
    const base = T(p.at ?? [0, 0, 0])
    // center: the point of the plane closest to `at`
    const c = base.clone().addScaledVector(n, d - base.dot(n))
    return { n, c }
  }, [p.n, p.d, p.at])
  const cur = useRef({ n: tgt.n.clone(), c: tgt.c.clone() })
  const Z = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const place = () => {
    ref.current.position.copy(cur.current.c)
    ref.current.quaternion.setFromUnitVectors(Z, cur.current.n.clone().normalize())
  }
  useLayoutEffect(place)
  useFrame((_, dt) => {
    const c = cur.current
    if (c.n.distanceToSquared(tgt.n) + c.c.distanceToSquared(tgt.c) < 1e-8) return
    const k = ease(dt, 4)
    c.n.lerp(tgt.n, k)
    c.c.lerp(tgt.c, k)
    place()
  })
  const h = size / 2
  const outline = useMemo(() => [new THREE.Vector3(-h, -h, 0), new THREE.Vector3(h, -h, 0), new THREE.Vector3(h, h, 0), new THREE.Vector3(-h, h, 0), new THREE.Vector3(-h, -h, 0)], [h])
  return (
    <group ref={ref}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={p.color} transparent opacity={p.opacity ?? 0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Line points={outline} color={p.color} lineWidth={1.5} />
    </group>
  )
}

const LOW = new THREE.Color('#123a44')
function SurfacePrim({ p }: { p: P<'surface'> }) {
  const seg = p.seg ?? 64
  const geo = useMemo(() => {
    const [x0, x1, y0, y1] = p.range
    const g = new THREE.PlaneGeometry(1, 1, seg, seg)
    const pos = g.attributes.position as THREE.BufferAttribute
    const zs: number[] = []
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + 0.5
      const v = pos.getY(i) + 0.5
      const x = x0 + (x1 - x0) * u
      const y = y0 + (y1 - y0) * v
      let z = p.f(x, y)
      if (p.clip) z = Math.min(p.clip[1], Math.max(p.clip[0], z))
      if (!Number.isFinite(z)) z = 0
      zs.push(z)
      pos.setXYZ(i, x, z, -y)
    }
    const lo = Math.min(...zs)
    const hi = Math.max(...zs)
    const top = new THREE.Color(p.color ?? '#ffd23f')
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    zs.forEach((z, i) => {
      c.copy(LOW).lerp(top, hi - lo < 1e-9 ? 0.6 : (z - lo) / (hi - lo))
      colors.set([c.r, c.g, c.b], i * 3)
    })
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [p.f, p.range, p.color, seg, p.clip])
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} transparent opacity={p.opacity ?? 0.88} roughness={0.55} depthWrite={(p.opacity ?? 0.88) > 0.8} />
      </mesh>
      <mesh geometry={geo}>
        <meshBasicMaterial wireframe color="#ffffff" transparent opacity={0.07} />
      </mesh>
    </group>
  )
}

function Bar({ x, y, h, w, d, color, opacity, z0 }: { x: number; y: number; h: number; w: number; d: number; color: string; opacity: number; z0: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const cur = useRef(0)
  useFrame((_, dt) => {
    const diff = h - cur.current
    if (Math.abs(diff) < 1e-4 && ref.current.userData.ok) return
    cur.current += diff * ease(dt, 8)
    const hh = Math.max(Math.abs(cur.current), 1e-4)
    ref.current.scale.set(w, hh, d)
    ref.current.position.set(x, z0 + cur.current / 2, -y)
    ref.current.userData.ok = true
  })
  return (
    <mesh ref={ref} scale={[w, 1e-4, d]} position={[x, z0, -y]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

function BarsPrim({ p }: { p: P<'bars'> }) {
  return (
    <group>
      {p.bars.map((b, i) => (
        <Bar key={i} x={b.x} y={b.y ?? 0} h={b.h} w={p.w} d={p.d ?? p.w} color={b.color ?? p.color} opacity={p.opacity ?? 0.92} z0={p.z0 ?? 0} />
      ))}
    </group>
  )
}

function NodePrim({ p }: { p: P<'node'> }) {
  return (
    <group position={T(p.p)}>
      <mesh>
        <sphereGeometry args={[p.hot ? 0.3 : 0.24, 24, 18]} />
        <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={p.hot ? 0.9 : 0.3} />
      </mesh>
      <group position={[0, 0.95, 0]}>
        <Label deps={[p.title, p.color, p.hot, p.lines?.join('|')]}>
          <div className={`gnode ${p.hot ? 'hot' : ''}`} style={{ borderColor: p.color }}>
            <b style={{ color: p.color }}>{p.title}</b>
            {p.lines?.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </Label>
      </group>
    </group>
  )
}

export function PrimView({ p }: { p: Prim }) {
  switch (p.k) {
    case 'arrow':
      return <ArrowPrim p={p} />
    case 'point':
      return <PointPrim p={p} />
    case 'cloud':
      return <CloudPrim p={p} />
    case 'line':
      return <LinePrim p={p} />
    case 'grid':
      return <GridPrim p={p} />
    case 'box':
      return <BoxPrim p={p} />
    case 'plane':
      return <PlanePrim p={p} />
    case 'surface':
      return <SurfacePrim p={p} />
    case 'bars':
      return <BarsPrim p={p} />
    case 'tiles':
      return null
    case 'label':
      return (
        <group position={T(p.p)}>
          <Tag text={p.text} color={p.color} size={p.size} />
        </group>
      )
    case 'node':
      return <NodePrim p={p} />
  }
}

export function TilesHud({ prims }: { prims: Prim[] }) {
  const tiles = prims.filter((p): p is P<'tiles'> => p.k === 'tiles')
  if (!tiles.length) return null
  return (
    <div className="hud">
      {tiles.map((p) => (
        <div key={p.id} className="tiles">
          {p.title && <div className="tiles-title">{p.title}</div>}
          <table>
            <tbody>
              {p.vals.map((row, r) => (
                <tr key={r}>
                  {row.map((v, c) => {
                    const hl = p.hl?.[`${r},${c}`] ?? p.hl?.[`${r},*`] ?? p.hl?.[`*,${c}`]
                    return (
                      <td key={c} style={{ ...(hl ? { background: hl, color: '#081014' } : {}), ...(c === 0 && p.rowColors?.[r] ? { boxShadow: `inset 3px 0 0 ${p.rowColors[r]}` } : {}) }}>
                        {v}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
