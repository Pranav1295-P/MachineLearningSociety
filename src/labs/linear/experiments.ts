import { add, cross, dot, eigSym, fmt, fmtV, len, mul, rng, sub, unit } from '../../core/math'
import type { Experiment, Prim, Step, V3 } from '../../core/types'
import { VIEWS } from '../../stage/Stage'
import { C } from '../colors'

const AX = ['x', 'y', 'z']
const E: V3[] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
]
const arc = (a: V3, b: V3, r: number): V3[] => {
  const u = unit(a)
  const w = unit(sub(b, mul(u, dot(b, u))))
  const th = Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b)))))
  return Array.from({ length: 33 }, (_, i) => {
    const t = (th * i) / 32
    return add(mul(u, r * Math.cos(t)), mul(w, r * Math.sin(t)))
  })
}

/* ------------------------------------------------------------------ 1.1 */
const dotProduct: Experiment = {
  id: 'dot-product',
  title: 'Dot product & projection',
  short: 'Multiply, add, then see the shadow',
  file: 'lab1_linear_algebra/exp1_dot_product.py',
  aim: 'To compute the dot product of two vectors with a plain loop, and to read it as a projection and an angle.',
  apparatus: ['Python 3 with NumPy', 'Two vectors $a, b \\in \\mathbb{R}^3$ (change them under Inputs)', 'The 3D bench with $x, y, z$ axes'],
  theory: `The dot product multiplies matching entries and adds them:
$$a\\cdot b=\\sum_i a_i b_i$$
The same number is also $|a|\\,|b|\\cos\\theta$. So it is large when the arrows agree, zero when they are perpendicular and negative when they point apart. Dividing by $|b|$ gives the length of the shadow of $a$ on $b$.`,
  ml: `A neuron computes $w\\cdot x + b$: a dot product between weights and inputs. Attention scores in transformers are dot products $q\\cdot k$. Search engines and recommenders rank items by cosine similarity of embedding vectors.`,
  params: [
    { key: 'ax', label: 'a.x', default: 3, min: -4, max: 4, step: 0.5 },
    { key: 'ay', label: 'a.y', default: 1, min: -4, max: 4, step: 0.5 },
    { key: 'az', label: 'a.z', default: 2, min: -4, max: 4, step: 0.5 },
    { key: 'bx', label: 'b.x', default: 1, min: -4, max: 4, step: 0.5 },
    { key: 'by', label: 'b.y', default: 2.5, min: -4, max: 4, step: 0.5 },
    { key: 'bz', label: 'b.z', default: 0.5, min: -4, max: 4, step: 0.5 },
  ],
  columns: ['i', 'a[i]', 'b[i]', 'a[i]·b[i]', 'total'],
  run: (p) => {
    const a: V3 = [p.ax, p.ay, p.az]
    const b: V3 = [p.bx, p.by, p.bz]
    const legend: [string, string][] = [
      [C.a, 'a'],
      [C.b, 'b'],
      [C.r, 'result'],
    ]
    const base: Prim[] = [
      { id: 'a', k: 'arrow', to: a, color: C.a, label: `a ${fmtV(a, 1)}` },
      { id: 'b', k: 'arrow', to: b, color: C.b, label: `b ${fmtV(b, 1)}` },
    ]
    const prods: string[] = []
    const table = (hi: number): Prim => ({
      id: 'tab',
      k: 'tiles',
      at: [-5.2, 3, 4.2],
      title: 'a · b, entry by entry',
      vals: [['', 'a', 'b', 'a×b'], ...[0, 1, 2].map((i) => [AX[i], fmt(a[i], 1), fmt(b[i], 1), prods[i] ?? ''])],
      hl: hi >= 0 ? { [`${hi + 1},*`]: C.r } : undefined,
    })
    const steps: Step[] = []
    let total = 0
    steps.push({
      title: 'Two arrows on the bench',
      text: 'Vector **a** (blue) and vector **b** (pink) are lists of three numbers, drawn as arrows from the origin. The dot product will turn the pair into a single number.',
      line: 'def dot(a, b):',
      scene: [...base, table(-1)],
      vars: [
        ['a', fmtV(a, 1)],
        ['b', fmtV(b, 1)],
      ],
      legend,
    })
    steps.push({
      title: 'Start the running total at zero',
      text: 'Both vectors have 3 entries, so the lengths match. `total` will collect one product per axis.',
      line: 'total = 0.0',
      tone: 'make',
      scene: [...base, table(-1)],
      vars: [['total', '0.00']],
      legend,
    })
    for (let i = 0; i < 3; i++) {
      const ca = mul(E[i], a[i])
      const cb = mul(E[i], b[i])
      const off: V3 = i === 2 ? [0.18, 0, 0] : i === 1 ? [0, 0, 0.18] : [0, 0, 0.18]
      const comp: Prim[] = [
        { id: 'ca', k: 'arrow', to: ca, color: C.a, r: 0.07, label: `a_${AX[i]} = ${fmt(a[i], 1)}` },
        { id: 'cb', k: 'arrow', from: off, to: add(cb, off), color: C.b, r: 0.07, label: `b_${AX[i]} = ${fmt(b[i], 1)}` },
        { id: 'da', k: 'line', pts: [a, ca], color: C.a, dashed: true, opacity: 0.7 },
        { id: 'db', k: 'line', pts: [b, cb], color: C.b, dashed: true, opacity: 0.7 },
      ]
      const prod = a[i] * b[i]
      prods[i] = fmt(prod, 2)
      steps.push({
        title: `Axis ${AX[i]}: multiply the matching entries`,
        text: `Look only along the **${AX[i]}** axis. The shadow of a on it has length ${fmt(a[i], 1)} and the shadow of b has length ${fmt(b[i], 1)}. Their product is $${fmt(a[i], 1)}\\times${fmt(b[i], 1)}=${fmt(prod, 2)}$. ${prod < 0 ? 'It is negative: on this axis the arrows point opposite ways.' : 'Positive: on this axis the arrows agree.'}`,
        line: 'product = a[i] * b[i]',
        tone: 'walk',
        scene: [...base, ...comp, table(i)],
        vars: [
          ['i', String(i)],
          ['a[i]', fmt(a[i], 2)],
          ['b[i]', fmt(b[i], 2)],
          ['product', fmt(prod, 2)],
          ['total', fmt(total, 2)],
        ],
        legend,
      })
      total += prod
      steps.push({
        title: `Add it to the total: ${fmt(total, 2)}`,
        text: `\`total\` grows by ${fmt(prod, 2)} and is now **${fmt(total, 2)}**.`,
        line: 'total += product',
        tone: 'make',
        scene: [...base, ...comp, table(i)],
        vars: [
          ['i', String(i)],
          ['a[i]', fmt(a[i], 2)],
          ['b[i]', fmt(b[i], 2)],
          ['product', fmt(prod, 2)],
          ['total', fmt(total, 2)],
        ],
        row: [i, fmt(a[i], 2), fmt(b[i], 2), fmt(prod, 2), fmt(total, 2)],
        legend,
      })
    }
    const d = total
    steps.push({
      title: `a · b = ${fmt(d, 2)}`,
      text: `The loop is done. This is exactly what \`np.dot(a, b)\` or \`a @ b\` returns. One number now summarises how much the two arrows agree.`,
      line: 'return total',
      tone: 'done',
      scene: [...base, table(-1), { id: 'res', k: 'label', p: [-5.2, 3, 2.3], text: `a · b = ${fmt(d, 2)}`, color: C.r, size: 'lg' }],
      vars: [['dot(a, b)', fmt(d, 4)]],
      legend,
    })
    const bb = dot(b, b)
    if (bb > 1e-9 && dot(a, a) > 1e-9) {
      const proj = mul(b, d / bb)
      steps.push({
        title: 'The same number, seen as a shadow',
        text: `Shine a light straight down onto the line through b. The shadow of a (gold) is $\\frac{a\\cdot b}{b\\cdot b}\\,b$. Its signed length is $\\frac{a\\cdot b}{|b|}=${fmt(d / Math.sqrt(bb), 3)}$. The dashed line from a to its shadow meets b at a right angle.`,
        line: 'scale = dot(a, b) / dot(b, b)',
        tone: 'make',
        scene: [
          ...base,
          { id: 'proj', k: 'arrow', to: proj, color: C.r, r: 0.07, label: 'shadow of a on b' },
          { id: 'perp', k: 'line', pts: [a, proj], color: C.w, dashed: true },
          { id: 'bl', k: 'line', pts: [mul(b, -1.6), mul(b, 1.6)], color: C.b, opacity: 0.35 },
        ],
        vars: [
          ['scale', fmt(d / bb, 4)],
          ['project(a, b)', fmtV(proj, 3)],
        ],
        legend,
      })
      const cos = d / (Math.sqrt(dot(a, a)) * Math.sqrt(bb))
      const deg = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
      steps.push({
        title: `Cosine similarity = ${fmt(cos, 3)}  (θ ≈ ${fmt(deg, 1)}°)`,
        text: `Divide out both lengths and only the angle is left: $\\cos\\theta=\\frac{a\\cdot b}{|a||b|}$. It is 1 for the same direction, 0 for perpendicular and −1 for opposite. Length no longer matters, which is why embeddings are compared this way.`,
        line: 'return dot(a, b) / (norm(a) * norm(b))',
        tone: 'done',
        scene: [
          ...base,
          { id: 'arc', k: 'line', pts: arc(a, b, 1.2), color: C.r, w: 3 },
          { id: 'th', k: 'label', p: mul(unit(add(unit(a), unit(b))), 1.7), text: `θ = ${fmt(deg, 1)}°`, color: C.r, size: 'md' },
        ],
        vars: [
          ['norm(a)', fmt(len(a), 4)],
          ['norm(b)', fmt(len(b), 4)],
          ['cosine', fmt(cos, 4)],
        ],
        legend,
      })
    }
    return steps
  },
  result: 'The loop gives the same value as `a @ b`. The dot product equals $|a||b|\\cos\\theta$: it measures how far one vector reaches along another, and after dividing by the lengths it measures only the angle.',
  viva: [
    { q: 'What is the time complexity of the dot product of two n-vectors?', a: '$O(n)$: one multiply and one add per entry.' },
    { q: 'Why is cosine similarity preferred over the raw dot product for comparing documents?', a: 'The raw dot product grows with vector length (longer documents have bigger counts). Cosine divides by both lengths so only direction, that is topic, matters.' },
    { q: 'What does a negative dot product tell you?', a: 'The angle between the vectors is more than 90°. They point in roughly opposite directions.' },
    { q: 'How is the dot product related to a single neuron?', a: 'A neuron outputs $\\sigma(w\\cdot x+b)$. The dot product $w\\cdot x$ is the weighted sum of its inputs.' },
  ],
}

/* ------------------------------------------------------------------ 1.2 */
const A2 = [
  [1, 2, 0],
  [-1, 3, 1],
]
const B2 = [
  [2, 1],
  [0, -1],
  [4, 2],
]
const matmul: Experiment = {
  id: 'matmul',
  title: 'Matrix multiplication',
  short: 'Every entry is a row · column dot product',
  file: 'lab1_linear_algebra/exp2_matmul.py',
  aim: 'To multiply two matrices with three nested loops and see that every entry of the product is a dot product of a row and a column.',
  apparatus: ['Python 3 with NumPy', '$A$ is 2×3, $B$ is 3×2, so $C=AB$ is 2×2', 'Rows of A and columns of B drawn as 3D arrows'],
  theory: `For $A$ of shape $(n,k)$ and $B$ of shape $(k,m)$:
$$C_{ij}=\\sum_{t=1}^{k}A_{it}B_{tj}$$
The inner dimensions must match ($k$). Entry $C_{ij}$ is the dot product of row $i$ of $A$ with column $j$ of $B$, so every rule from the dot product applies here.`,
  ml: `A batch of inputs $X$ (one row per example) times a weight matrix $W$ gives every neuron's output for every example at once: $XW$. GPUs exist largely to do this loop fast.`,
  columns: ['i', 'j', 'row i · col j', 'C[i,j]'],
  run: () => {
    const Cm = [
      ['', ''],
      ['', ''],
    ]
    const steps: Step[] = []
    const view = { pos: [0, -13, 7.5] as V3, target: [0, 0, 2.2] as V3 }
    const legend: [string, string][] = [
      [C.a, 'row i of A'],
      [C.b, 'column j of B'],
      [C.r, 'current entry'],
    ]
    const mats = (hlA: Record<string, string> = {}, hlB: Record<string, string> = {}, hlC: Record<string, string> = {}): Prim[] => [
      { id: 'A', k: 'tiles', at: [-5, 0, 5], title: 'A  (2×3)', vals: A2.map((r) => r.map((x) => fmt(x, 0))), hl: hlA },
      { id: 'B', k: 'tiles', at: [0, 0, 6.1], title: 'B  (3×2)', vals: B2.map((r) => r.map((x) => fmt(x, 0))), hl: hlB },
      { id: 'C', k: 'tiles', at: [5, 0, 5], title: 'C = A @ B  (2×2)', vals: Cm, hl: hlC },
    ]
    steps.push({
      title: 'Check the shapes',
      text: '$A$ is 2×3 and $B$ is 3×2. The inner sizes are both 3, so the product exists and has the outer sizes: 2×2.',
      line: 'assert k == k2',
      scene: mats(),
      view,
      vars: [
        ['A.shape', '(2, 3)'],
        ['B.shape', '(3, 2)'],
        ['C.shape', '(2, 2)'],
      ],
    })
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const row = A2[i] as V3
        const col = [B2[0][j], B2[1][j], B2[2][j]] as V3
        const arrows: Prim[] = [
          { id: 'row', k: 'arrow', to: mul(row, 0.9), color: C.a, label: `row ${i} = ${fmtV(row, 0)}` },
          { id: 'col', k: 'arrow', to: mul(col, 0.9), color: C.b, label: `col ${j} = ${fmtV(col, 0)}` },
        ]
        let s = 0
        Cm[i][j] = '?'
        steps.push({
          title: `Entry C[${i}, ${j}]: row ${i} of A meets column ${j} of B`,
          text: `Both are lists of 3 numbers, so both are 3D arrows. Their dot product will be C[${i}, ${j}].`,
          line: 's = 0.0',
          tone: 'walk',
          scene: [...mats({ [`${i},*`]: C.a }, { [`*,${j}`]: C.b }, { [`${i},${j}`]: C.r }), ...arrows],
          view,
          vars: [
            ['i', String(i)],
            ['j', String(j)],
            ['s', '0'],
          ],
          legend,
        })
        const parts: string[] = []
        for (let t = 0; t < 3; t++) {
          const pr = A2[i][t] * B2[t][j]
          s += pr
          parts.push(`${fmt(A2[i][t], 0)}×${fmt(B2[t][j], 0)}`)
          steps.push({
            title: `t = ${t}: add A[${i},${t}] × B[${t},${j}] = ${fmt(A2[i][t], 0)} × ${fmt(B2[t][j], 0)}`,
            text: `Walk along the row and down the column together. s = ${parts.join(' + ')} = **${fmt(s, 0)}**.`,
            line: 's += A[i, t] * B[t, j]',
            tone: 'make',
            scene: [...mats({ [`${i},*`]: '#2b6f86', [`${i},${t}`]: C.r }, { [`*,${j}`]: '#8a4a5c', [`${t},${j}`]: C.r }, { [`${i},${j}`]: C.r }), ...arrows],
            view,
            vars: [
              ['i', String(i)],
              ['j', String(j)],
              ['t', String(t)],
              ['s', fmt(s, 0)],
            ],
            legend,
          })
        }
        Cm[i][j] = fmt(s, 0)
        steps.push({
          title: `C[${i}, ${j}] = ${fmt(s, 0)}`,
          text: `Write the dot product into the result. ${s === 0 ? 'Zero would mean the two arrows are perpendicular.' : s < 0 ? 'Negative: the row and column arrows point more apart than together.' : 'Positive: the arrows point roughly the same way.'}`,
          line: 'C[i, j] = s',
          tone: 'done',
          scene: [...mats({}, {}, { [`${i},${j}`]: C.g }), ...arrows],
          view,
          vars: [
            ['i', String(i)],
            ['j', String(j)],
            ['C[i, j]', fmt(s, 0)],
          ],
          row: [i, j, parts.join(' + '), fmt(s, 0)],
          legend,
        })
      }
    steps.push({
      title: 'C is complete, and equals A @ B',
      text: 'Four entries, each a dot product of 3 pairs: $2\\times2\\times3=12$ multiplications. In general $n\\cdot m\\cdot k$, which is why big matrix products dominate training time.',
      line: 'return C',
      tone: 'done',
      scene: mats(),
      view,
      vars: [['C', '[[2, -1], [2, -2]]']],
    })
    return steps
  },
  result: 'The triple loop returns $\\begin{bmatrix}2&-1\\\\2&-2\\end{bmatrix}$, the same as `A @ B`. Every entry of a matrix product is a row·column dot product, and the cost is $O(nmk)$.',
  viva: [
    { q: 'Is matrix multiplication commutative?', a: 'No. Here $AB$ is 2×2 but $BA$ is 3×3. Even for square matrices $AB\\neq BA$ in general.' },
    { q: 'How many multiplications does an (n×k)(k×m) product need?', a: '$n\\cdot k\\cdot m$. Each of the $nm$ entries needs $k$ products.' },
    { q: 'Why is NumPy\'s `A @ B` so much faster than the triple loop?', a: 'It calls optimised BLAS code written in C/Fortran that uses vector instructions, cache blocking and several cores, instead of running the Python interpreter once per multiply.' },
    { q: 'What does $(AB)x$ mean as a transformation?', a: 'Apply $B$ first, then $A$. Matrix products compose transformations, right to left.' },
  ],
}

/* ------------------------------------------------------------------ 1.3 */
const S3 = 1.6
const V3s: V3[] = [
  [2, 0.5, 0],
  [1, 2, 0.5],
  [0.5, 0, 2],
]
const gramSchmidt: Experiment = {
  id: 'gram-schmidt',
  title: 'Gram–Schmidt',
  short: 'Make a skewed basis perpendicular',
  file: 'lab1_linear_algebra/exp3_gram_schmidt.py',
  aim: 'To turn three skewed vectors into three perpendicular unit vectors that span the same space, by subtracting projections.',
  apparatus: ['Python 3 with NumPy', 'Columns $v_1, v_2, v_3$ of a 3×3 matrix $V$', 'Projection from Exp 1.1'],
  theory: `Keep the first vector, scaled to length 1. For every later vector, subtract its shadow on each finished direction, then scale what is left to length 1:
$$v \\leftarrow v-(q_i\\cdot v)\\,q_i,\\qquad q_j=\\frac{v}{|v|}$$
What is left after the subtraction is perpendicular to every earlier $q$.`,
  ml: `Orthonormal bases make maths easy: coordinates are just dot products. Gram–Schmidt is the idea behind the QR decomposition (\`np.linalg.qr\`), used to solve least-squares regression stably and to keep weight matrices orthogonal in some deep networks.`,
  columns: ['j', 'i', 'q_i · v removed', '|v| left'],
  run: () => {
    const vs = V3s.map((v) => mul(v, S3))
    const cols = [C.a, C.b, C.v]
    const qs: V3[] = []
    const steps: Step[] = []
    const legend: [string, string][] = [
      [C.a, 'v₁'],
      [C.b, 'v₂'],
      [C.v, 'v₃'],
      [C.r, 'finished q'],
      [C.w, 'working v'],
    ]
    const vArrows = (op = 0.45): Prim[] => vs.map((v, k) => ({ id: `v${k}`, k: 'arrow', to: v, color: cols[k], opacity: op, label: `v${k + 1}` }) as Prim)
    const qArrows = (): Prim[] => qs.map((q, k) => ({ id: `q${k}`, k: 'arrow', to: mul(q, S3 * 1.5), color: C.r, r: 0.06, label: `q${k + 1}` }) as Prim)
    steps.push({
      title: 'Three vectors that lean on each other',
      text: 'The columns of $V$ point in different directions, but no two are perpendicular. The box they span is skewed. We want three perpendicular unit vectors that span the same space.',
      line: 'def gram_schmidt(V):',
      scene: [...vArrows(1), { id: 'box', k: 'box', basis: vs as [V3, V3, V3], color: C.a, opacity: 0.12 }],
      legend,
    })
    for (let j = 0; j < 3; j++) {
      let v: V3 = [...V3s[j]] as V3
      steps.push({
        title: `j = ${j}: pick up v${j + 1}`,
        text: j === 0 ? 'The first vector has nothing to be perpendicular to yet, so it only needs scaling.' : `v${j + 1} still leans on the ${j === 1 ? 'first direction' : 'first two directions'}. We will remove ${j === 1 ? 'that part' : 'those parts'} one at a time.`,
        line: 'v = V[:, j].astype(float)',
        tone: 'walk',
        scene: [...vArrows(), ...qArrows(), { id: 'work', k: 'arrow', to: mul(v, S3), color: C.w, label: 'v' }],
        vars: [
          ['j', String(j)],
          ['v', fmtV(v, 3)],
        ],
        legend,
      })
      for (let i = 0; i < j; i++) {
        const q = qs[i]
        const c = dot(q, v)
        const before = v
        v = sub(v, mul(q, c))
        steps.push({
          title: `Remove the part of v along q${i + 1}`,
          text: `$q_${i + 1}\\cdot v=${fmt(c, 3)}$, so the shadow of v on q${i + 1} is ${fmt(c, 3)}·q${i + 1} (amber). Subtracting it slides the tip of v along the dashed line. The new v is perpendicular to q${i + 1}: $q_${i + 1}\\cdot v=${fmt(dot(q, v), 3)}$.`,
          line: 'v = v - (q @ v) * q',
          tone: 'cut',
          scene: [
            ...vArrows(),
            ...qArrows(),
            { id: 'work', k: 'arrow', to: mul(v, S3), color: C.w, label: 'v' },
            { id: 'shadow', k: 'arrow', to: mul(q, c * S3), color: C.o, r: 0.06, label: `(q${i + 1}·v) q${i + 1}` },
            { id: 'move', k: 'line', pts: [mul(before, S3), mul(v, S3)], color: C.o, dashed: true },
          ],
          vars: [
            ['j', String(j)],
            ['i', String(i)],
            ['q @ v', fmt(c, 4)],
            ['v', fmtV(v, 3)],
          ],
          row: [j, i, fmt(c, 4), fmt(len(v), 4)],
          legend,
        })
      }
      const L = len(v)
      const q = mul(v, 1 / L)
      qs.push(q)
      steps.push({
        title: `Scale to length 1: q${j + 1} = v / ${fmt(L, 3)}`,
        text: `What is left of v has length ${fmt(L, 3)}. Dividing by it gives the unit vector q${j + 1} (gold).${j > 0 ? ` It is perpendicular to every earlier q.` : ''}`,
        line: 'Q[:, j] = v / length',
        tone: 'make',
        scene: [...vArrows(), ...qArrows()],
        vars: [
          ['j', String(j)],
          ['length', fmt(L, 4)],
          [`Q[:, ${j}]`, fmtV(q, 4)],
        ],
        row: j === 0 ? [0, '-', '-', fmt(L, 4)] : undefined,
        legend,
      })
    }
    const QtQ = qs.map((a) => qs.map((b) => fmt(dot(a, b), 3)))
    steps.push({
      title: 'An orthonormal basis: QᵀQ = I',
      text: 'The three gold vectors are unit length and mutually perpendicular. The box they span is a rotated unit cube. Every dot product between different q is 0 and every q·q is 1.',
      line: 'return Q',
      tone: 'done',
      scene: [
        ...vArrows(0.3),
        ...qs.map((q, k) => ({ id: `q${k}`, k: 'arrow', to: mul(q, S3 * 1.5), color: C.r, r: 0.06, label: `q${k + 1}` }) as Prim),
        { id: 'box', k: 'box', basis: qs.map((q) => mul(q, S3 * 1.5)) as [V3, V3, V3], color: C.r, opacity: 0.15 },
        { id: 'qtq', k: 'tiles', at: [-5, 3, 4.5], title: 'Q.T @ Q', vals: QtQ },
      ],
      vars: qs.map((q, k) => [`q${k + 1}`, fmtV(q, 4)] as [string, string]),
      legend,
    })
    return steps
  },
  result: 'The three output vectors are orthonormal ($Q^TQ=I$) and span the same space as the inputs. They match `np.linalg.qr(V)[0]` up to sign.',
  viva: [
    { q: 'Why does subtracting $(q\\cdot v)q$ make v perpendicular to q?', a: 'Because $q\\cdot(v-(q\\cdot v)q)=q\\cdot v-(q\\cdot v)(q\\cdot q)=0$, using $q\\cdot q=1$.' },
    { q: 'What happens if the input columns are linearly dependent?', a: 'At some step nothing is left: $|v|=0$ and the division fails. Dependence means that column adds no new direction.' },
    { q: 'What is the relation to QR decomposition?', a: '$V=QR$ where $Q$ is the Gram–Schmidt output and $R$ is upper triangular, holding the dot products and lengths computed along the way.' },
    { q: 'Why do libraries prefer Householder reflections over classical Gram–Schmidt?', a: 'Classical Gram–Schmidt loses orthogonality through rounding errors when columns are nearly dependent. Householder (or modified Gram–Schmidt) is numerically stabler.' },
  ],
}

/* ------------------------------------------------------------------ 1.4 */
const GA = [
  [1, 1, 1],
  [2, -1, 1],
  [1, 2, -1],
]
const Gb = [4, 3, 1]
const gauss: Experiment = {
  id: 'gaussian-elimination',
  title: 'Gaussian elimination',
  short: 'Three planes, one meeting point',
  file: 'lab1_linear_algebra/exp4_gaussian_elimination.py',
  aim: 'To solve $Ax=b$ for three unknowns by row operations, and to see that every row operation keeps the meeting point of the three planes fixed.',
  apparatus: ['Python 3 with NumPy', 'Augmented matrix $[A\\,|\\,b]$ for 3 equations', 'Each equation drawn as a plane in 3D'],
  theory: `Each equation $a_{r}\\cdot x=b_r$ is a plane. The solution is the one point on all three planes. Swapping two equations, or subtracting a multiple of one from another, changes the planes but not that point. Elimination uses this to make the matrix upper triangular; back substitution then reads off $x_3$, then $x_2$, then $x_1$.`,
  ml: `Linear regression has a closed form $w=(X^TX)^{-1}X^Ty$. In practice it is computed by solving $X^TXw=X^Ty$ with an elimination-based solver (\`np.linalg.solve\`), never by forming the inverse.`,
  columns: ['operation', 'detail'],
  run: () => {
    const A = GA.map((r) => [...r])
    const b = [...Gb]
    const id = [0, 1, 2]
    const cols = [C.a, C.b, C.o]
    const sol: V3 = [1, 1, 2]
    const steps: Step[] = []
    const view = { pos: [9, -11, 6] as V3, target: [0.6, 0.6, 1.6] as V3 }
    const planes = (dim: number[] = []): Prim[] =>
      [0, 1, 2].map((r) => ({ id: `pl${id[r]}`, k: 'plane', n: A[r] as V3, d: b[r], color: cols[id[r]], size: 5.5, at: sol, opacity: dim.includes(r) ? 0.08 : 0.3 }) as Prim)
    const aug = (hl: Record<string, string> = {}): Prim => ({
      id: 'aug',
      k: 'tiles',
      at: [-5.5, 2, 5],
      title: '[ A | b ]',
      vals: A.map((r, i) => [...r.map((x) => fmt(x, 2)), '|', fmt(b[i], 2)]),
      rowColors: id.map((k) => cols[k]),
      hl,
    })
    const pt = (label = '?'): Prim => ({ id: 'x', k: 'point', p: sol, color: C.r, r: 0.14, label })
    steps.push({
      title: 'Three equations are three planes',
      text: 'Each row of $[A\\,|\\,b]$ is one equation, for example $x+y+z=4$, and each equation is a flat plane. The three planes cross at one point. Finding it is solving the system.',
      line: 'def solve(A, b):',
      scene: [...planes(), aug(), pt()],
      view,
      legend: [
        [C.a, 'x + y + z = 4'],
        [C.b, '2x − y + z = 3'],
        [C.o, 'x + 2y − z = 1'],
      ],
    })
    const n = 3
    for (let col = 0; col < n; col++) {
      let pivot = col
      for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r
      const hl: Record<string, string> = {}
      for (let r = col; r < n; r++) hl[`${r},${col}`] = r === pivot ? C.r : '#3c6670'
      steps.push({
        title: `Column ${col}: choose the pivot`,
        text: `Look down column ${col} from row ${col}. The biggest entry by size is ${fmt(A[pivot][col], 2)} in row ${pivot}. Dividing by a big number keeps rounding errors small (partial pivoting).`,
        line: 'pivot = col + np.argmax',
        tone: 'walk',
        scene: [...planes(), aug(hl), pt()],
        view,
        vars: [
          ['col', String(col)],
          ['pivot', String(pivot)],
        ],
      })
      if (pivot !== col) {
        ;[A[col], A[pivot]] = [A[pivot], A[col]]
        ;[b[col], b[pivot]] = [b[pivot], b[col]]
        ;[id[col], id[pivot]] = [id[pivot], id[col]]
        steps.push({
          title: `Swap rows ${col} and ${pivot}`,
          text: 'Swapping two equations only changes their order. No plane moves.',
          line: 'A[[col, pivot]] = A[[pivot, col]]',
          tone: 'make',
          scene: [...planes(), aug({ [`${col},*`]: C.r }), pt()],
          view,
          vars: [
            ['col', String(col)],
            ['pivot', String(pivot)],
          ],
          row: ['swap', `R${col} ↔ R${pivot}`],
        })
      }
      for (let row = col + 1; row < n; row++) {
        const factor = A[row][col] / A[col][col]
        if (Math.abs(factor) < 1e-12) continue
        steps.push({
          title: `factor = ${fmt(A[row][col], 2)} / ${fmt(A[col][col], 2)} = ${fmt(factor, 3)}`,
          text: `To clear the entry in row ${row}, column ${col}, we will subtract ${fmt(factor, 3)} times the pivot row from row ${row}.`,
          line: 'factor = A[row, col] / A[col, col]',
          tone: 'walk',
          scene: [...planes(), aug({ [`${row},${col}`]: C.r, [`${col},${col}`]: C.g }), pt()],
          view,
          vars: [
            ['col', String(col)],
            ['row', String(row)],
            ['factor', fmt(factor, 4)],
          ],
        })
        for (let k = 0; k < n; k++) A[row][k] -= factor * A[col][k]
        A[row][col] = 0
        b[row] -= factor * b[col]
        steps.push({
          title: `R${row} ← R${row} − ${fmt(factor, 3)}·R${col}`,
          text: `The plane of row ${row} tilts to a new position, but it still passes through the same gold point. Any combination of two equations is true wherever both are true.`,
          line: 'A[row] = A[row] - factor * A[col]',
          tone: 'make',
          scene: [...planes(), aug({ [`${row},*`]: '#3c6670', [`${row},${col}`]: C.g }), pt()],
          view,
          vars: [
            ['row', String(row)],
            [`A[${row}]`, fmtV(A[row], 3)],
            [`b[${row}]`, fmt(b[row], 3)],
          ],
          row: ['eliminate', `R${row} −= ${fmt(factor, 3)}·R${col}`],
        })
      }
    }
    steps.push({
      title: 'Upper triangular: the last plane is flat',
      text: `The last row has only a $z$ term left, so its plane is horizontal. The middle row has no $x$ term, so its plane runs parallel to the $x$ axis. Now we can read the answer from the bottom up.`,
      line: 'x = np.zeros(n)',
      tone: 'info',
      scene: [...planes(), aug(), pt()],
      view,
    })
    const x = [0, 0, 0]
    for (let i = n - 1; i >= 0; i--) {
      let s = b[i]
      for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]
      x[i] = s / A[i][i]
      steps.push({
        title: `Back substitution: x[${i}] = ${fmt(x[i], 3)}`,
        text: `Row ${i} reads ${A[i].map((a, k) => (Math.abs(a) < 1e-12 ? '' : `${fmt(a, 2)}·x${k}`)).filter(Boolean).join(' + ')} = ${fmt(b[i], 2)}. ${i < n - 1 ? 'Plug in the values already found, ' : ''}divide by the pivot ${fmt(A[i][i], 2)}, and $x_${i}=${fmt(x[i], 3)}$.`,
        line: 'x[i] = (b[i] - A[i, i + 1 :] @ x[i + 1 :]) / A[i, i]',
        tone: 'make',
        scene: [...planes([0, 1, 2].filter((r) => r !== i)), aug({ [`${i},*`]: C.r }), pt(`x = (${x.map((v, k) => (k >= i ? fmt(v, 2) : '?')).join(', ')})`)],
        view,
        vars: [
          ['i', String(i)],
          ['x', fmtV(x, 3)],
        ],
        row: ['back-sub', `x${i} = ${fmt(x[i], 4)}`],
      })
    }
    steps.push({
      title: `Solved: x = (${x.map((v) => fmt(v, 2)).join(', ')})`,
      text: 'Check: $1+1+2=4$, $2-1+2=3$, $1+2-2=1$. The answer matches `np.linalg.solve(A, b)`.',
      line: 'return x',
      tone: 'done',
      scene: [...planes(), aug(), pt(`x = (${x.map((v) => fmt(v, 0)).join(', ')})`)],
      view,
      vars: [['x', fmtV(x, 4)]],
    })
    return steps
  },
  result: 'Elimination with partial pivoting turns $[A\\,|\\,b]$ upper triangular in $O(n^3)$ work; back substitution then gives $x=(1,1,2)$. Row operations move the planes but never the solution point.',
  viva: [
    { q: 'Why choose the largest pivot?', a: 'Dividing by a tiny pivot multiplies rounding errors. Partial pivoting picks the largest entry by absolute value to keep the factors at most 1 in size.' },
    { q: 'What happens to the planes if $A$ is singular?', a: 'They do not meet in a single point: either they share a whole line (infinitely many solutions) or some pair never meets (no solution). A pivot becomes 0.' },
    { q: 'Why not compute $A^{-1}b$?', a: 'Forming the inverse costs more and loses more accuracy than solving directly. Solve, don\'t invert.' },
    { q: 'What is the cost of Gaussian elimination for an n×n system?', a: 'About $\\tfrac{2}{3}n^3$ floating-point operations for elimination plus $n^2$ for back substitution.' },
  ],
}

/* ------------------------------------------------------------------ 1.5 */
const PI_MATS = [
  [
    [2, 1],
    [1, 3],
  ],
  [
    [2.2, 0.3],
    [0.3, 2.0],
  ],
]
const powerIteration: Experiment = {
  id: 'power-iteration',
  title: 'Power iteration',
  short: 'Multiply again and again to find an eigenvector',
  file: 'lab1_linear_algebra/exp5_power_iteration.py',
  aim: 'To find the largest eigenvalue and its eigenvector of a symmetric matrix by repeatedly applying the matrix to a vector.',
  apparatus: ['Python 3 with NumPy', 'A 2×2 symmetric matrix $A$ (pick one under Inputs)', 'The unit circle and its image under $A$ (an ellipse) on the bench'],
  theory: `Write any start vector in the eigenvector basis: $v=c_1u_1+c_2u_2$. Then
$$A^kv=c_1\\lambda_1^ku_1+c_2\\lambda_2^ku_2$$
If $|\\lambda_1|>|\\lambda_2|$, the first term wins and $A^kv$ turns towards $u_1$. Rescaling each time keeps the numbers finite. The error shrinks like $(\\lambda_2/\\lambda_1)^k$.`,
  ml: `Google's PageRank is the top eigenvector of the web's link matrix, found by power iteration. PCA's first component is the top eigenvector of the covariance matrix. Spectral norm regularisation in GANs uses one power-iteration step per training step.`,
  params: [
    {
      key: 'm',
      label: 'Matrix',
      default: 0,
      options: [
        { value: 0, label: '[[2,1],[1,3]]  λ = 3.62, 1.38' },
        { value: 1, label: '[[2.2,.3],[.3,2]]  close λ (slow)' },
      ],
    },
    { key: 'seed', label: 'Random start (seed)', default: 4, min: 0, max: 99 },
    {
      key: 'iters',
      label: 'Iterations',
      default: 10,
      options: [
        { value: 6, label: '6' },
        { value: 10, label: '10' },
        { value: 20, label: '20' },
      ],
    },
  ],
  columns: ['k', 'v', 'λ estimate', 'angle to u₁'],
  run: (p) => {
    const M = PI_MATS[p.m] ?? PI_MATS[0]
    const S = 1.6
    const Av = (v: number[]) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]]
    const { vals, vecs } = eigSym(M)
    const u1 = vecs[0]
    const r = rng(p.seed)
    let v = [r.normal(), r.normal()]
    let n = Math.hypot(v[0], v[1])
    v = [v[0] / n, v[1] / n]
    const to3 = (w: number[], s = S): V3 => [w[0] * s, w[1] * s, 0.02]
    const circle: V3[] = Array.from({ length: 97 }, (_, i) => {
      const t = (2 * Math.PI * i) / 96
      return to3([Math.cos(t), Math.sin(t)])
    })
    const ellipse: V3[] = Array.from({ length: 97 }, (_, i) => {
      const t = (2 * Math.PI * i) / 96
      return to3(Av([Math.cos(t), Math.sin(t)]))
    })
    const angle = (w: number[]) => (Math.acos(Math.min(1, Math.abs(w[0] * u1[0] + w[1] * u1[1]))) * 180) / Math.PI
    const bench: Prim[] = [
      { id: 'circ', k: 'line', pts: circle, color: C.m },
      { id: 'ell', k: 'line', pts: ellipse, color: C.v, opacity: 0.8 },
      { id: 'e1', k: 'line', pts: [to3(u1, -6), to3(u1, 6)], color: C.g, dashed: true },
      { id: 'e2', k: 'line', pts: [to3(vecs[1], -4), to3(vecs[1], 4)], color: C.m, dashed: true },
      { id: 'e1l', k: 'label', p: to3(u1, 5.2), text: `u₁ (λ₁ = ${fmt(vals[0], 2)})`, color: C.g },
      { id: 'e2l', k: 'label', p: to3(vecs[1], 3.6), text: `u₂ (λ₂ = ${fmt(vals[1], 2)})`, color: C.m },
    ]
    const legend: [string, string][] = [
      [C.a, 'v (unit)'],
      [C.b, 'w = A v'],
      [C.v, 'A applied to the unit circle'],
      [C.g, 'true top eigenvector'],
    ]
    const view = VIEWS.top
    const steps: Step[] = []
    steps.push({
      title: 'What A does to every unit vector',
      text: `The grey circle holds every unit vector. A sends it to the violet ellipse. The ellipse's longest axis lies along the eigenvector $u_1$ (green dashes), stretched by $\\lambda_1=${fmt(vals[0], 3)}$. Power iteration finds that axis without solving any equation.`,
      line: 'def power_iteration(A, steps=12, seed=0):',
      scene: bench,
      view,
      legend,
    })
    steps.push({
      title: 'Start from a random unit vector',
      text: `A random direction almost surely has some part along $u_1$. That small part is all the method needs. Its angle to $u_1$ is ${fmt(angle(v), 1)}°.`,
      line: 'v = v / np.sqrt(v @ v)',
      tone: 'make',
      scene: [...bench, { id: 'v', k: 'arrow', to: to3(v), color: C.a, label: 'v' }],
      view,
      vars: [['v', fmtV(v, 4)]],
      row: [0, fmtV(v, 3), '-', `${fmt(angle(v), 2)}°`],
      legend,
    })
    for (let k = 1; k <= p.iters; k++) {
      const w = Av(v)
      const detail = k <= 2
      if (detail)
        steps.push({
          title: `Iteration ${k}: let A act on v`,
          text: `w = A v has length ${fmt(Math.hypot(w[0], w[1]), 3)}. Its tip lands on the ellipse and leans further towards $u_1$, because the $u_1$ part was multiplied by ${fmt(vals[0], 2)} and the $u_2$ part only by ${fmt(vals[1], 2)}.`,
          line: 'w = A @ v',
          tone: 'walk',
          scene: [...bench, { id: 'v', k: 'arrow', to: to3(v), color: C.a, label: 'v' }, { id: 'w', k: 'arrow', to: to3(w), color: C.b, label: 'A v' }],
          view,
          vars: [
            ['k', String(k)],
            ['w', fmtV(w, 4)],
          ],
          legend,
        })
      n = Math.hypot(w[0], w[1])
      v = [w[0] / n, w[1] / n]
      const lam = v[0] * Av(v)[0] + v[1] * Av(v)[1]
      steps.push({
        title: detail ? `Rescale to length 1, estimate λ = ${fmt(lam, 4)}` : `Iteration ${k}: angle to u₁ = ${fmt(angle(v), 3)}°`,
        text: detail
          ? `Dividing by $|w|$ keeps v a unit vector, so numbers never blow up. The Rayleigh quotient $v^TAv=${fmt(lam, 4)}$ estimates the eigenvalue.`
          : `Multiply, rescale, repeat. The angle error shrinks by about $\\lambda_2/\\lambda_1=${fmt(vals[1] / vals[0], 2)}$ each round${vals[1] / vals[0] > 0.6 ? ', which is slow here because the eigenvalues are close' : ''}. λ estimate: ${fmt(lam, 5)}.`,
        line: 'v = w / np.sqrt(w @ w)',
        tone: 'make',
        scene: [...bench, { id: 'v', k: 'arrow', to: to3(v), color: C.a, label: 'v' }, { id: 'w', k: 'arrow', to: to3(w), color: C.b, label: 'A v', opacity: 0.5 }],
        view,
        vars: [
          ['k', String(k)],
          ['v', fmtV(v, 5)],
          ['lam', fmt(lam, 6)],
        ],
        row: [k, fmtV(v, 3), fmt(lam, 5), `${fmt(angle(v), 3)}°`],
        legend,
      })
    }
    const lam = v[0] * Av(v)[0] + v[1] * Av(v)[1]
    steps.push({
      title: `Converged: λ ≈ ${fmt(lam, 5)} (true ${fmt(vals[0], 5)})`,
      text: `v now lies along the green eigenvector line (the sign may be flipped, which is still the same eigenvector). Applying A only stretches it: $Av\\approx\\lambda v$.`,
      line: 'return lam, v',
      tone: 'done',
      scene: [...bench, { id: 'v', k: 'arrow', to: to3(v), color: C.a, label: 'v ≈ u₁' }, { id: 'w', k: 'arrow', to: to3(Av(v)), color: C.b, label: 'A v ≈ λ v' }],
      view,
      vars: [
        ['lam', fmt(lam, 6)],
        ['v', fmtV(v, 5)],
      ],
      legend,
    })
    return steps
  },
  result: 'Repeated multiplication turns any start vector towards the dominant eigenvector, and the Rayleigh quotient converges to $\\lambda_1$. Convergence speed depends on the ratio $|\\lambda_2/\\lambda_1|$: compare the two matrices.',
  viva: [
    { q: 'When does power iteration fail?', a: 'If $|\\lambda_1|=|\\lambda_2|$ (no single dominant eigenvalue), or if the start vector has exactly zero component along $u_1$.' },
    { q: 'Why rescale v every iteration?', a: 'Without it $|A^kv|$ grows like $\\lambda_1^k$ and overflows (or underflows if $\\lambda_1<1$). Only the direction matters.' },
    { q: 'How would you get the second eigenvector?', a: 'Deflation: subtract $\\lambda_1u_1u_1^T$ from A and run power iteration again, or keep v orthogonal to $u_1$ each step.' },
    { q: 'What is the Rayleigh quotient?', a: '$r(v)=\\frac{v^TAv}{v^Tv}$. For an eigenvector it equals the eigenvalue; near one it is a very accurate estimate.' },
  ],
}

/* ------------------------------------------------------------------ 1.6 */
function pcaData() {
  const r = rng(7)
  const sd = [2.3, 0.95, 0.28]
  const ax = unit([0.85, 0.45, 0.28])
  const by = unit(cross([0, 0, 1], ax))
  const cz = cross(ax, by)
  const R = [ax, by, cz]
  const offset: V3 = [1.6, -0.8, 2.6]
  return Array.from({ length: 70 }, () => {
    const l = sd.map((s) => s * r.normal())
    return add(offset, add(add(mul(R[0], l[0]), mul(R[1], l[1])), mul(R[2], l[2])))
  })
}
const pca: Experiment = {
  id: 'pca',
  title: 'Principal component analysis',
  short: 'Centre, covariance, eigenvectors, project',
  file: 'lab1_linear_algebra/exp6_pca.py',
  aim: 'To reduce a 3D point cloud to 2D while keeping as much spread as possible, using only centring, a covariance matrix, eigenvectors and projection.',
  apparatus: ['Python 3 with NumPy', '70 points in 3D, stretched along one direction', '`np.linalg.eigh` for the symmetric eigenproblem (Exp 1.5 shows how one works)'],
  theory: `Centre the data, then form the covariance matrix
$$C=\\frac{1}{n-1}X_c^TX_c$$
Its eigenvectors are the directions of greatest spread and its eigenvalues are the variances along them. Keep the top $k$ eigenvectors as the columns of $W$ and project: $Z=X_cW$.`,
  ml: `PCA compresses features before training, removes correlated inputs, and makes 2D pictures of high-dimensional data such as embeddings. It is also the linear version of an autoencoder.`,
  columns: ['component', 'eigenvalue', 'explained', 'cumulative'],
  run: () => {
    const X = pcaData()
    const n = X.length
    const mu = mul(X.reduce((s, x) => add(s, x), [0, 0, 0] as V3), 1 / n)
    const Xc = X.map((x) => sub(x, mu))
    const Cm = [0, 1, 2].map((i) => [0, 1, 2].map((j) => Xc.reduce((s, x) => s + x[i] * x[j], 0) / (n - 1)))
    const { vals, vecs } = eigSym(Cm)
    const pcs = vecs.map((v) => (v[0] < 0 ? mul(v as V3, -1) : (v as V3)))
    const total = vals[0] + vals[1] + vals[2]
    const center: V3 = [0, 0, 0]
    const view = { pos: [8, -11, 6.5] as V3, target: [0, 0, 0.3] as V3 }
    const steps: Step[] = []
    const cols = [C.r, C.b, C.v]
    const legend: [string, string][] = [
      [C.a, 'data points'],
      [C.r, 'PC1'],
      [C.b, 'PC2'],
      [C.v, 'PC3'],
    ]
    const pcArrows = (on = 3): Prim[] =>
      pcs.slice(0, on).map((v, k) => ({ id: `pc${k}`, k: 'arrow', to: mul(v, 2.2 * Math.sqrt(vals[k])), color: cols[k], r: 0.06, label: `PC${k + 1}  λ=${fmt(vals[k], 2)}` }) as Prim)
    const cloud = (pts: V3[]): Prim => ({ id: 'cloud', k: 'cloud', pts, color: C.a, r: 0.09 })
    steps.push({
      title: '70 points in 3D',
      text: 'Each point is an example with 3 features. The cloud is long in one direction, medium in another and very thin in the third. PCA will find those directions and drop the thin one.',
      line: 'def pca(X, k):',
      scene: [cloud(X)],
      view,
      table: false,
      legend,
    })
    steps.push({
      title: 'Find the centre of the cloud',
      text: `The mean of every feature is the point μ = ${fmtV(mu, 2)} (gold).`,
      line: 'mean = X.mean(axis=0)',
      tone: 'make',
      scene: [cloud(X), { id: 'mu', k: 'point', p: mu, color: C.r, r: 0.18, label: 'μ' }],
      view,
      table: false,
      vars: [['mean', fmtV(mu, 3)]],
      legend,
    })
    steps.push({
      title: 'Centre it: subtract the mean',
      text: 'Every point slides by −μ, so the cloud now sits on the origin. Variance is measured around the mean, so this step is required.',
      line: 'Xc = X - mean',
      tone: 'make',
      scene: [cloud(Xc), { id: 'mu', k: 'point', p: center, color: C.r, r: 0.18, label: 'origin' }],
      view,
      table: false,
      vars: [['Xc.mean(0)', '[0.000, 0.000, 0.000]']],
      legend,
    })
    const cov: Prim = { id: 'cov', k: 'tiles', at: [-5.5, 3, 4.5], title: 'covariance C', vals: Cm.map((r) => r.map((x) => fmt(x, 2))) }
    steps.push({
      title: 'The covariance matrix',
      text: 'Entry $C_{ij}$ is the average of (feature i)×(feature j) over the centred points. The diagonal holds each feature\'s variance; off-diagonal entries show how features move together. $C$ is symmetric.',
      line: 'C = (Xc.T @ Xc) / (len(X) - 1)',
      tone: 'make',
      scene: [cloud(Xc), cov],
      view,
      table: false,
      vars: [['C', `3×3, trace = ${fmt(total, 3)}`]],
      legend,
    })
    steps.push({
      title: 'Eigenvectors are the axes of the cloud',
      text: `The eigenvectors of $C$ are perpendicular and point along the cloud's natural axes. Each arrow is drawn with length proportional to $\\sqrt{\\lambda}$, the standard deviation along it.`,
      line: 'vals, vecs = np.linalg.eigh(C)',
      tone: 'make',
      scene: [cloud(Xc), cov, ...pcArrows()],
      view,
      table: false,
      vars: vals.map((v, k) => [`λ${k + 1}`, fmt(v, 4)] as [string, string]),
      legend,
    })
    let cum = 0
    steps.push({
      title: 'Sort by variance',
      text: `PC1 alone carries ${fmt((100 * vals[0]) / total, 1)}% of the total variance; PC3 only ${fmt((100 * vals[2]) / total, 1)}%.`,
      line: 'order = np.argsort(vals)[::-1]',
      tone: 'walk',
      scene: [cloud(Xc), ...pcArrows()],
      view,
      table: false,
      legend,
    })
    vals.forEach((v, k) => {
      cum += v / total
      steps.push({
        title: `PC${k + 1}: ${fmt((100 * v) / total, 1)}% of the variance`,
        text: k < 2 ? `Keep PC${k + 1}.` : 'PC3 is the thin direction. Dropping it loses only this small share of the information.',
        line: k < 2 ? 'W = vecs[:, :k]' : 'explained = vals[:k] / vals.sum()',
        tone: k < 2 ? 'make' : 'cut',
        scene: [cloud(Xc), ...pcArrows(), ...(k >= 1 ? [{ id: 'plane', k: 'plane', n: pcs[2], d: 0, color: C.r, size: 9, opacity: 0.12 } as Prim] : [])],
        view,
        table: false,
        row: [`PC${k + 1}`, fmt(v, 4), `${fmt((100 * v) / total, 1)}%`, `${fmt(100 * cum, 1)}%`],
        legend,
      })
    })
    const projected = Xc.map((x) => sub(x, mul(pcs[2], dot(x, pcs[2]))))
    const resid: V3[] = Xc.flatMap((x, i) => [x, projected[i]])
    steps.push({
      title: 'Project every point onto the PC1–PC2 plane',
      text: 'Each point drops straight onto the gold plane along PC3 (the short dashed lines). Those lines are the reconstruction error, and they are tiny because the cloud was thin in that direction.',
      line: 'Z = Xc @ W',
      tone: 'make',
      scene: [cloud(projected), ...pcArrows(2), { id: 'plane', k: 'plane', n: pcs[2], d: 0, color: C.r, size: 9, opacity: 0.12 }, { id: 'res', k: 'line', pts: resid, color: C.w, segments: true, opacity: 0.5, w: 1 }],
      view,
      table: false,
      legend,
    })
    const flat = Xc.map((x) => [dot(x, pcs[0]), dot(x, pcs[1]), 0] as V3)
    steps.push({
      title: `The new 2D dataset keeps ${fmt((100 * (vals[0] + vals[1])) / total, 1)}% of the variance`,
      text: 'Rotate the plane flat: each point is now described by two numbers, $(z_1, z_2)$, its coordinates along PC1 and PC2. Feed these to a model, or plot them.',
      line: 'return Z, W, explained',
      tone: 'done',
      scene: [cloud(flat), { id: 'pc0', k: 'arrow', to: [2.2 * Math.sqrt(vals[0]), 0, 0], color: C.r, r: 0.06, label: 'z₁ (PC1)' }, { id: 'pc1', k: 'arrow', to: [0, 2.2 * Math.sqrt(vals[1]), 0], color: C.b, r: 0.06, label: 'z₂ (PC2)' }],
      view: { pos: [0, -6, 13], target: [0, 0, 0] },
      table: true,
      vars: [
        ['Z.shape', '(70, 2)'],
        ['explained', `[${fmt(vals[0] / total, 4)}, ${fmt(vals[1] / total, 4)}]`],
      ],
      legend,
    })
    return steps
  },
  result: 'The top two eigenvectors of the covariance matrix keep almost all of the variance. Projecting onto them turns 3 features into 2 with a small, measurable loss: the share of the dropped eigenvalue.',
  viva: [
    { q: 'Why must the data be centred before PCA?', a: 'Covariance measures spread around the mean. Without centring, the first "component" mostly points at the mean instead of along the spread.' },
    { q: 'Why use `eigh` instead of `eig`?', a: 'The covariance matrix is symmetric. `eigh` exploits that: it is faster, always returns real eigenvalues and orthonormal eigenvectors.' },
    { q: 'How do you choose k?', a: 'Keep enough components to reach a target share of variance (for example 95%), or look for an "elbow" in the sorted eigenvalues.' },
    { q: 'How are PCA and SVD related?', a: 'If $X_c=U\\Sigma V^T$, the columns of $V$ are the principal directions and $\\sigma_i^2/(n-1)$ are the eigenvalues. Libraries usually compute PCA through the SVD.' },
  ],
}

export const EXPERIMENTS: Experiment[] = [dotProduct, matmul, gramSchmidt, gauss, powerIteration, pca]
