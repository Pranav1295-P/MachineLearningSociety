import type { ComponentType } from 'react'

/** A point or direction in math coordinates: x right, y away from you, z up. */
export type V3 = [number, number, number]

type Base = { id: string }

/**
 * Everything the 3D stage can draw. Steps describe a scene as a list of these;
 * the stage keeps prims with the same id and animates them to their new state.
 */
export type Prim =
  | (Base & { k: 'arrow'; to: V3; from?: V3; color: string; label?: string; r?: number; opacity?: number })
  | (Base & { k: 'point'; p: V3; color: string; r?: number; label?: string })
  | (Base & { k: 'cloud'; pts: V3[]; color: string | string[]; r?: number; drop?: boolean })
  | (Base & { k: 'line'; pts: V3[]; color: string; dashed?: boolean; w?: number; opacity?: number; segments?: boolean })
  | (Base & { k: 'grid'; m: number[]; color: string; n?: number; opacity?: number })
  | (Base & { k: 'box'; basis: [V3, V3, V3]; color: string; origin?: V3; opacity?: number })
  | (Base & { k: 'plane'; n: V3; d: number; color: string; size?: number; opacity?: number; at?: V3 })
  | (Base & {
      k: 'surface'
      f: (x: number, y: number) => number
      range: [number, number, number, number]
      color?: string
      opacity?: number
      seg?: number
      clip?: [number, number]
    })
  | (Base & {
      k: 'bars'
      bars: { x: number; y?: number; h: number; color?: string }[]
      w: number
      d?: number
      color: string
      opacity?: number
      z0?: number
    })
  | (Base & { k: 'tiles'; at?: V3; vals: (string | number)[][]; hl?: Record<string, string>; title?: string; rowColors?: string[] })
  | (Base & { k: 'label'; p: V3; text: string; color?: string; size?: 'sm' | 'md' | 'lg' })
  | (Base & { k: 'node'; p: V3; title: string; lines?: string[]; color: string; hot?: boolean })

export type View = { pos: V3; target?: V3 }

export type Tone = 'info' | 'make' | 'walk' | 'warn' | 'done' | 'cut'

export type Step = {
  title: string
  text: string
  tone?: Tone
  scene: Prim[]
  /** A snippet of the Python line that is running (first line containing it is lit). */
  line?: string
  /** Live watch: current variable values. */
  vars?: [string, string][]
  /** A row for the observation table (columns are defined on the experiment). */
  row?: (string | number)[]
  view?: View
  legend?: [string, string][]
  /** Hide the bench top (for scenes that go below z = 0). */
  table?: boolean
}

export type Check = { q: string; options: string[]; answer: number; why: string }

export type Lesson = {
  id: string
  title: string
  short: string
  formula?: string
  ml: string
  steps: () => Step[]
  check?: Check
}

export type Param = {
  key: string
  label: string
  default: number
  min?: number
  max?: number
  step?: number
  options?: { value: number; label: string }[]
}

export type Experiment = {
  id: string
  title: string
  short: string
  /** Path under python/, e.g. lab1_linear_algebra/exp1_dot_product.py */
  file: string
  aim: string
  apparatus: string[]
  theory: string
  ml: string
  params?: Param[]
  columns: string[]
  run: (p: Record<string, number>) => Step[]
  result: string
  viva: { q: string; a: string }[]
}

export type Problem = {
  id: string
  title: string
  level: 'Warm-up' | 'Core' | 'Challenge'
  prompt: string
  hints: string[]
  solution: string
  /** Text the solution must print (checked by the test suite). */
  expect: string
  ml?: string
}

export type RefRow = { name: string; tex: string; numpy: string; use: string }
export type RefSection = { title: string; rows: RefRow[] }

export type LabDef = {
  slug: string
  no: number
  room: string
  name: string
  accent: string
  tagline: string
  blurb: string
  lessons: Lesson[]
  experiments: Experiment[]
  Workbench: ComponentType
  practice: Problem[]
  reference: RefSection[]
}
