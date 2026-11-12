import { add, cols3, det3, dot, fmt, fmtV, I3, len, mul, mv3, rng, unit } from '../../core/math'
import type { Lesson, Prim, Step, V3 } from '../../core/types'
import { VIEWS } from '../../stage/Stage'
import { C } from '../colors'

const basis = (m: number[], labels = true): Prim[] => {
  const [c1, c2, c3] = cols3(m)
  return [
    { id: 'i', k: 'arrow', to: c1, color: '#ff6b6b', label: labels ? `î → ${fmtV(c1, 1)}` : undefined },
    { id: 'j', k: 'arrow', to: c2, color: '#7bed9f', label: labels ? `ĵ → ${fmtV(c2, 1)}` : undefined },
    { id: 'k', k: 'arrow', to: c3, color: '#70a1ff', label: labels ? `k̂ → ${fmtV(c3, 1)}` : undefined },
  ]
}
const grid = (m: number[]): Prim => ({ id: 'g', k: 'grid', m, color: C.r, n: 5, opacity: 0.7 })

/* 1. Vectors */
const vectors: Lesson = {
  id: 'vectors',
  title: 'Vectors',
  short: 'Arrows, lists of numbers, data points',
  formula: 'v=\\begin{bmatrix}v_1\\\\v_2\\\\v_3\\end{bmatrix},\\quad |v|=\\sqrt{v_1^2+v_2^2+v_3^2}',
  ml: 'Every input to a model is a vector: a row of a spreadsheet, the pixels of an image, the embedding of a word. Training moves a weight vector through space.',
  steps: () => {
    const v: V3 = [3, 2, 2.5]
    const r = rng(11)
    const houses: V3[] = Array.from({ length: 36 }, () => {
      const area = 1 + r.uniform() * 4
      return [area, 0.5 + area * 0.6 + r.normal() * 0.4, 0.6 + r.uniform() * 3.6] as V3
    })
    const u: V3 = [3, 0.5, 1]
    const w: V3 = [0.5, 2.5, 1.5]
    const steps: Step[] = [
      {
        title: 'A vector is a list of numbers…',
        text: 'The vector $v=(3,\\,2,\\,2.5)$ says: walk 3 along $x$, 2 along $y$, then 2.5 up along $z$. The dashed path shows the three moves.',
        scene: [
          { id: 'v', k: 'arrow', to: v, color: C.a, label: 'v = (3, 2, 2.5)' },
          { id: 'path', k: 'line', pts: [[0, 0, 0], [3, 0, 0], [3, 2, 0], v], color: C.w, dashed: true },
          { id: 'px', k: 'label', p: [1.5, -0.4, 0], text: '3', color: '#ff6b6b' },
          { id: 'py', k: 'label', p: [3.4, 1, 0], text: '2', color: '#7bed9f' },
          { id: 'pz', k: 'label', p: [3.4, 2, 1.25], text: '2.5', color: '#70a1ff' },
        ],
      },
      {
        title: '…and also an arrow with a length',
        text: `Its length comes from Pythagoras twice: $|v|=\\sqrt{3^2+2^2+2.5^2}=${fmt(len(v), 3)}$. In NumPy: \`np.linalg.norm(v)\`.`,
        scene: [
          { id: 'v', k: 'arrow', to: v, color: C.a, label: `|v| = ${fmt(len(v), 2)}` },
          { id: 'path', k: 'line', pts: [[0, 0, 0], [3, 2, 0], v], color: C.w, dashed: true },
        ],
      },
      {
        title: 'A dataset is a cloud of vectors',
        text: 'Each dot is one house described by 3 features: area, rooms and age. One house is one vector; the whole table is a cloud. Models learn the shape of this cloud. Real data just has more axes than we can draw.',
        scene: [
          { id: 'cloud', k: 'cloud', pts: houses, color: C.a, r: 0.11 },
          { id: 'v', k: 'arrow', to: houses[3], color: C.r, label: 'one house' },
          { id: 'lx', k: 'label', p: [5.4, -0.6, 0], text: 'area', color: '#ff6b6b' },
          { id: 'ly', k: 'label', p: [-0.6, 5.4, 0], text: 'rooms', color: '#7bed9f' },
          { id: 'lz', k: 'label', p: [-0.4, 0, 4.7], text: 'age', color: '#70a1ff' },
        ],
      },
      {
        title: 'Adding vectors: tip to tail',
        text: `$u+w$ adds entry by entry: ${fmtV(u, 1)} + ${fmtV(w, 1)} = ${fmtV(add(u, w), 1)}. As arrows: put the tail of w on the tip of u.`,
        scene: [
          { id: 'u', k: 'arrow', to: u, color: C.a, label: 'u' },
          { id: 'w', k: 'arrow', to: w, color: C.b, label: 'w', opacity: 0.4 },
          { id: 'w2', k: 'arrow', from: u, to: add(u, w), color: C.b, label: 'w moved' },
          { id: 's', k: 'arrow', to: add(u, w), color: C.r, label: 'u + w' },
        ],
      },
      {
        title: 'Scaling: stretch, shrink, flip',
        text: 'Multiplying by a number scales every entry. $2u$ is twice as long; $-u$ points the other way. A gradient step $w-\\eta\\nabla L$ is exactly a scale and an add.',
        scene: [
          { id: 'u', k: 'arrow', to: u, color: C.a, label: 'u' },
          { id: 'w2', k: 'arrow', to: mul(u, 2), color: C.r, label: '2u', r: 0.035 },
          { id: 's', k: 'arrow', to: mul(u, -1), color: C.b, label: '−u' },
        ],
      },
    ]
    return steps
  },
  check: {
    q: 'Which vector goes from the tip of $u$ to the tip of $w$?',
    options: ['$w-u$', '$u-w$', '$u+w$', '$|w|-|u|$'],
    answer: 0,
    why: 'Start at u and add $w-u$: you land on $u+(w-u)=w$.',
  },
}

/* 2. Dot product */
const dotLesson: Lesson = {
  id: 'dot',
  title: 'Dot product & similarity',
  short: 'How much two vectors agree',
  formula: 'a\\cdot b=\\sum_i a_ib_i=|a|\\,|b|\\cos\\theta',
  ml: 'A neuron is a dot product $w\\cdot x$ plus a bias. Attention scores are $q\\cdot k$. Cosine similarity between embeddings powers semantic search, recommendations and retrieval for chatbots.',
  steps: () => {
    const a: V3 = [3.5, 0.5, 0.8]
    const dir = (deg: number): V3 => {
      const t = (deg * Math.PI) / 180
      return mul(add(mul(unit(a), Math.cos(t)), mul([0, 0.6, 0.8] as V3, Math.sin(t))), 3)
    }
    const shot = (deg: number, title: string, text: string): Step => {
      const b = dir(deg)
      const d = dot(a, b)
      const proj = mul(unit(a), d / len(a))
      return {
        title,
        text: `${text} Here $a\\cdot b=${fmt(d, 2)}$.`,
        scene: [
          { id: 'a', k: 'arrow', to: a, color: C.a, label: 'a' },
          { id: 'b', k: 'arrow', to: b, color: C.b, label: `b (θ = ${deg}°)` },
          { id: 'p', k: 'arrow', to: proj, color: C.r, r: 0.07, label: 'shadow of b on a' },
          { id: 'd', k: 'line', pts: [b, proj], color: C.w, dashed: true },
        ],
      }
    }
    const words: [string, V3, string][] = [
      ['king', [3.2, 1.2, 2.2], C.a],
      ['queen', [2.8, 1.8, 2.4], C.b],
      ['apple', [0.6, 3.6, 0.4], C.o],
    ]
    const cos = (x: V3, y: V3) => dot(x, y) / (len(x) * len(y))
    return [
      {
        title: 'Multiply matching entries, then add',
        text: `For $a=${fmtV(a, 1)}$ and $b=${fmtV(dir(40), 1)}$: $a\\cdot b=a_1b_1+a_2b_2+a_3b_3$. Geometrically it is the length of a times the length of b's shadow on a.`,
        scene: shot(40, '', '').scene,
      },
      shot(30, 'Small angle: large positive', 'The arrows agree, so the shadow is long and points along a.'),
      shot(90, 'Right angle: exactly zero', 'b casts no shadow on a. Perpendicular vectors are called **orthogonal**: they share no information.'),
      shot(150, 'Wide angle: negative', 'The shadow points backwards along a. The vectors disagree.'),
      {
        title: 'Cosine similarity compares directions',
        text: `Toy word embeddings: $\\cos(\\text{king},\\text{queen})=${fmt(cos(words[0][1], words[1][1]), 2)}$, $\\cos(\\text{king},\\text{apple})=${fmt(cos(words[0][1], words[2][1]), 2)}$. Words with related meaning point the same way.`,
        scene: words.map(([w, v, c]) => ({ id: w, k: 'arrow', to: v, color: c, label: w }) as Prim),
      },
    ]
  },
  check: {
    q: 'Two non-zero vectors have dot product 0. What is the angle between them?',
    options: ['0°', '45°', '90°', '180°'],
    answer: 2,
    why: '$\\cos\\theta=0$ only at 90°: the vectors are orthogonal.',
  },
}

/* 3. Matrices as transformations */
const transform: Lesson = {
  id: 'matrices',
  title: 'Matrices transform space',
  short: 'Columns say where the axes land',
  formula: 'Mx=x_1\\,\\mathrm{col}_1(M)+x_2\\,\\mathrm{col}_2(M)+x_3\\,\\mathrm{col}_3(M)',
  ml: 'A dense layer computes $Wx+b$: a linear transformation of the input space followed by a shift. Stacking layers composes transformations. Without non-linear activations the whole network would collapse into one matrix.',
  steps: () => {
    const sh = [2, 1, 0, 0, 1, 0, 0, 0, 1]
    const c = Math.cos(Math.PI / 5)
    const s = Math.sin(Math.PI / 5)
    const rot = [c, -s, 0, s, c, 0, 0, 0, 1]
    const x: V3 = [1, 2, 0]
    const W = [1.2, 0.4, 0.2, -0.3, 1, 0.5, 0.2, -0.4, 1.3]
    const view = { pos: [0.5, -6.5, 8], target: [0.8, 0.6, 0] } as const
    return [
      {
        title: 'Start: the plain grid and its unit arrows',
        text: 'î = (1,0,0) and ĵ = (0,1,0) mark one step along x and y. The gold grid is drawn from them. Watch where they go.',
        scene: [grid(I3), ...basis(I3).slice(0, 2)],
        view: { pos: [...view.pos] as V3, target: [...view.target] as V3 },
      },
      {
        title: 'M = [[2, 1], [0, 1]]: a stretch and a shear',
        text: 'Every grid line stays straight, parallel and evenly spaced, and the origin stays put. That is what "linear" means. î lands on (2,0), the first column of M; ĵ lands on (1,1), the second column.',
        scene: [grid(sh), ...basis(sh).slice(0, 2)],
        view: { pos: [...view.pos] as V3, target: [...view.target] as V3 },
      },
      {
        title: 'A rotation is also a matrix',
        text: 'Rotating by 36° sends î to $(\\cos 36°, \\sin 36°)$ and ĵ to $(-\\sin 36°, \\cos 36°)$. Those two vectors are the columns.',
        scene: [grid(rot), ...basis(rot).slice(0, 2)],
        view: { pos: [...view.pos] as V3, target: [...view.target] as V3 },
      },
      {
        title: 'Where does x = (1, 2) go?',
        text: `Since x = 1·î + 2·ĵ, Mx = 1·(where î went) + 2·(where ĵ went) = 1·(2,0) + 2·(1,1) = (4, 2). Matrix-vector multiplication is this mix of columns.`,
        scene: [
          grid(sh),
          ...basis(sh).slice(0, 2),
          { id: 'x', k: 'arrow', to: mv3(sh, x), color: C.r, label: `Mx = ${fmtV(mv3(sh, x).slice(0, 2), 0)}` },
          { id: 'c1', k: 'line', pts: [[0, 0, 0.02], [2, 0, 0.02], [4, 2, 0.02]], color: C.w, dashed: true },
        ],
        view: { pos: [...view.pos] as V3, target: [...view.target] as V3 },
      },
      {
        title: 'In 3D: a layer W warps the whole cube',
        text: `A 3×3 weight matrix moves all three axes. The unit cube becomes a slanted box whose edges are the columns of W. A neural layer does this to every input, then adds a bias and bends it with an activation.`,
        scene: [{ id: 'box', k: 'box', basis: cols3(W), color: C.r }, ...basis(W, false)],
        view: VIEWS.iso,
      },
    ]
  },
  check: {
    q: 'A 2×2 matrix sends î to (0,1) and ĵ to (−1,0). What is it?',
    options: ['$\\begin{bmatrix}0&-1\\\\1&0\\end{bmatrix}$', '$\\begin{bmatrix}0&1\\\\-1&0\\end{bmatrix}$', '$\\begin{bmatrix}1&0\\\\0&-1\\end{bmatrix}$'],
    answer: 0,
    why: 'The columns are the images of î and ĵ: first column (0,1), second column (−1,0). It is a 90° rotation.',
  },
}

/* 4. Determinant */
const determinant: Lesson = {
  id: 'determinant',
  title: 'Determinant',
  short: 'How much a matrix scales volume',
  formula: '\\det(M)=\\text{(signed) volume of the box spanned by the columns}',
  ml: '$\\det=0$ means the matrix squashes space and cannot be undone: collinear features make $X^TX$ singular in regression. The Gaussian density divides by $\\sqrt{\\det\\Sigma}$. Normalising flows track $\\log|\\det J|$ to keep probabilities right.',
  steps: () => {
    const cases: [number[], string, string][] = [
      [I3, 'The unit cube: volume 1', 'Before any transformation the cube spanned by î, ĵ, k̂ has volume 1.'],
      [[2, 0.5, 0, 0, 1.5, 0, 0, 0, 1], 'Stretch: volume × 3', 'Stretch x by 2 and y by 1.5 (plus a small shear). The box has volume 3, and so $\\det M=3$.'],
      [[1, 1, 0, 0, 1, 0, 0, 0, 1], 'Shear: shape changes, volume does not', 'A shear slides the top over. The box leans but keeps its volume: $\\det M=1$.'],
      [[1, 0, 1, 0, 1, 1, 0, 0, 0], 'Squash: volume 0', 'This M sends k̂ into the floor. The whole cube collapses to a flat sheet: $\\det M=0$. Many points land on the same spot, so there is no way back: M has no inverse.'],
      [[-1, 0, 0, 0, 1, 0, 0, 0, 1], 'Mirror: negative volume', 'Flipping x reverses orientation, like a mirror image. The volume is still 1, but the sign records the flip: $\\det M=-1$.'],
    ]
    return cases.map(([m, title, text], i) => ({
      title: `${title}  (det = ${fmt(det3(m), 2)})`,
      text,
      tone: i === 3 ? 'warn' : 'info',
      scene: [{ id: 'box', k: 'box', basis: cols3(m).map((c) => mul(c, 2)) as [V3, V3, V3], color: i === 3 ? C.bad : C.r }, ...basis(m.map((x) => x * 2), false)],
    }))
  },
  check: {
    q: 'If $\\det(A)=2$ and $\\det(B)=3$, what is $\\det(AB)$?',
    options: ['5', '6', '1.5', 'It depends'],
    answer: 1,
    why: 'Volumes scale one after the other: $\\det(AB)=\\det A\\cdot\\det B=6$.',
  },
}

/* 5. Systems and least squares */
const systems: Lesson = {
  id: 'systems',
  title: 'Solving Ax = b',
  short: 'Planes meeting, and least squares',
  formula: '\\hat w=\\arg\\min_w|Xw-y|^2 \\;\\Rightarrow\\; X^TX\\hat w=X^Ty',
  ml: 'Linear regression is least squares. The normal equations $X^TXw=X^Ty$ give the best weights in one solve. When features are collinear the planes stop meeting at a point, which is why ridge regression adds $\\lambda I$.',
  steps: () => {
    const sol: V3 = [1, 1, 2]
    const pl = (id: string, n: V3, color: string, d?: number, op = 0.28): Prim => ({ id, k: 'plane', n, d: d ?? dot(n, sol), color, size: 5.5, at: sol, opacity: op })
    const view = { pos: [9, -11, 6] as V3, target: [0.6, 0.6, 1.6] as V3 }
    const X = [
      [1, 0.2],
      [0.3, 1],
      [0.6, 0.5],
    ]
    const c1: V3 = [X[0][0], X[1][0], X[2][0]]
    const c2: V3 = [X[0][1], X[1][1], X[2][1]]
    const y: V3 = [1.2, 1.6, 3.2]
    // least squares by normal equations (2x2)
    const a = dot(c1, c1),
      b = dot(c1, c2),
      d = dot(c2, c2)
    const r1 = dot(c1, y),
      r2 = dot(c2, y)
    const det = a * d - b * b
    const w = [(d * r1 - b * r2) / det, (a * r2 - b * r1) / det]
    const p = add(mul(c1, w[0]), mul(c2, w[1]))
    const S = 1.7
    return [
      {
        title: 'One solution: three planes, one point',
        text: 'Three independent equations in three unknowns: the planes cross at exactly one point, here (1, 1, 2). $A$ is invertible.',
        scene: [pl('p1', [1, 1, 1], C.a), pl('p2', [2, -1, 1], C.b), pl('p3', [1, 2, -1], C.o), { id: 'x', k: 'point', p: sol, color: C.r, label: 'x' }],
        view,
      },
      {
        title: 'Infinitely many: the third plane adds nothing',
        text: 'Make the third equation the sum of the first two. Its plane contains their whole crossing line, so every point on that line solves the system. $\\det A=0$.',
        tone: 'warn',
        scene: [pl('p1', [1, 1, 1], C.a), pl('p2', [2, -1, 1], C.b), pl('p3', [3, 0, 2], C.o), { id: 'x', k: 'line', pts: [add(sol, mul([2, 1, -3], -0.6)), add(sol, mul([2, 1, -3], 0.6))], color: C.r, w: 4 }],
        view,
      },
      {
        title: 'No solution: the planes miss each other',
        text: 'Shift the third plane so it is parallel to that line but not through it. Now no point lies on all three. With real, noisy data this is the normal case: more equations than unknowns, and no exact answer.',
        tone: 'warn',
        scene: [pl('p1', [1, 1, 1], C.a), pl('p2', [2, -1, 1], C.b), pl('p3', [3, 0, 2], C.o, dot([3, 0, 2], sol) + 2.5)],
        view,
      },
      {
        title: 'Least squares: the closest reachable point',
        text: `$Xw$ can only reach the plane spanned by X's two columns (gold). The target y (pink) is off the plane. The best w gives the point $X\\hat w$ straight below y, so the error $y-X\\hat w$ (dashed) is perpendicular to the plane. Here $\\hat w=${fmtV(w, 3)}$.`,
        tone: 'done',
        scene: [
          { id: 'p1', k: 'plane', n: [c1[1] * c2[2] - c1[2] * c2[1], c1[2] * c2[0] - c1[0] * c2[2], c1[0] * c2[1] - c1[1] * c2[0]], d: 0, color: C.r, size: 9, opacity: 0.15, at: mul(p, S) },
          { id: 'c1', k: 'arrow', to: mul(c1, S), color: C.a, label: 'column 1 of X' },
          { id: 'c2', k: 'arrow', to: mul(c2, S), color: C.v, label: 'column 2 of X' },
          { id: 'y', k: 'arrow', to: mul(y, S), color: C.b, label: 'y' },
          { id: 'x', k: 'arrow', to: mul(p, S), color: C.r, label: 'X ŵ' },
          { id: 'e', k: 'line', pts: [mul(p, S), mul(y, S)], color: C.w, dashed: true },
        ],
        view: VIEWS.iso,
      },
    ] as Step[]
  },
  check: {
    q: 'In least squares, the residual $y-X\\hat w$ is…',
    options: ['zero', 'perpendicular to every column of $X$', 'parallel to $y$', 'equal to $\\hat w$'],
    answer: 1,
    why: 'That is exactly what $X^T(y-X\\hat w)=0$ says, and it is how the normal equations are derived.',
  },
}

/* 6. Eigenvectors */
const eigen: Lesson = {
  id: 'eigen',
  title: 'Eigenvectors & PCA',
  short: 'Directions a matrix only stretches',
  formula: 'Av=\\lambda v',
  ml: 'PCA uses the eigenvectors of the covariance matrix. PageRank is an eigenvector. The eigenvalues of a Hessian tell an optimiser if it sits at a minimum or a saddle, and eigenvalues of recurrent weight matrices explain exploding and vanishing gradients.',
  steps: () => {
    const A = [2, 1, 0, 1, 2, 0, 0, 0, 1]
    const fan: V3[] = Array.from({ length: 12 }, (_, i) => {
      const t = (i * Math.PI * 2) / 12 + Math.PI / 12
      return [1.6 * Math.cos(t), 1.6 * Math.sin(t), 0.03]
    })
    const eig = [unit([1, 1, 0]), unit([1, -1, 0])].map((v) => mul(v, 1.6))
    const arrows = (m: number[], hi: boolean): Prim[] => [
      ...fan.map((v, i) => ({ id: `f${i}`, k: 'arrow', to: mv3(m, v), color: C.a, r: 0.03, opacity: hi ? 0.35 : 0.9 }) as Prim),
      ...eig.map((v, i) => ({ id: `e${i}`, k: 'arrow', to: mv3(m, v), color: C.g, r: 0.05, label: hi ? (i ? 'λ = 1: unchanged' : 'λ = 3: stretched ×3') : undefined }) as Prim),
    ]
    const lines: Prim[] = eig.map((v, i) => ({ id: `el${i}`, k: 'line', pts: [mul(v, -4), mul(v, 4)], color: C.g, dashed: true, opacity: 0.7 }) as Prim)
    const view: { pos: V3; target: V3 } = { pos: [0, -5.5, 9], target: [0, 0, 0] }
    const r = rng(3)
    const pts: V3[] = Array.from({ length: 90 }, () => {
      const s = r.normal() * 1.7
      const t = r.normal() * 0.5
      return [s * 0.82 - t * 0.57, s * 0.57 + t * 0.82, 0.05] as V3
    })
    return [
      {
        title: 'Fourteen arrows before the matrix acts',
        text: 'A fan of unit-length arrows on the bench, plus two green ones along the diagonals. Next, $A=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}$ acts on all of them.',
        scene: [grid(I3), ...arrows(I3, false)],
        view,
      },
      {
        title: 'Most arrows turn. Two do not.',
        text: 'After A, the blue arrows have all rotated towards the diagonal. The two green arrows stay on their own lines: one is stretched 3 times, the other not at all. Those are the **eigenvectors**, and 3 and 1 are their **eigenvalues**.',
        tone: 'make',
        scene: [grid(A), ...arrows(A, true), ...lines],
        view,
      },
      {
        title: 'Av = λv',
        text: 'An eigenvector is a direction the matrix only scales. Along it, a complicated matrix acts like a single number λ. Writing vectors in the eigenvector basis turns the matrix into a simple diagonal stretch.',
        scene: [grid(A), ...arrows(A, true), ...lines],
        view,
      },
      {
        title: 'Data clouds have eigenvectors too',
        text: 'For a cloud of points, the covariance matrix\'s eigenvectors point along the cloud\'s axes: the long one is the first principal component. That is PCA, and Experiment 1.6 builds it from scratch.',
        tone: 'done',
        scene: [
          { id: 'cloud', k: 'cloud', pts, color: C.a, r: 0.08 },
          { id: 'e0', k: 'arrow', to: mul([0.82, 0.57, 0.05], 3.4), color: C.r, label: 'PC1' },
          { id: 'e1', k: 'arrow', to: mul([-0.57, 0.82, 0.05], 1), color: C.b, label: 'PC2' },
        ],
        view,
      },
    ] as Step[]
  },
  check: {
    q: '$v$ is an eigenvector of $A$ with $\\lambda=-0.5$. What does $A$ do to $v$?',
    options: ['Rotates it 90°', 'Flips it and halves its length', 'Leaves it alone', 'Doubles it'],
    answer: 1,
    why: '$Av=-0.5v$: same line, opposite direction, half the length.',
  },
}

export const LESSONS: Lesson[] = [vectors, dotLesson, transform, determinant, systems, eigen]
