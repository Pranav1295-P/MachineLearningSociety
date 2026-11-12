import { clamp, erf, fmt, linspace, normalPdf } from '../../core/math'
import type { Experiment, Prim, Step, V3 } from '../../core/types'
import { C } from '../colors'

const front = (z = 2): { pos: V3; target: V3 } => ({ pos: [0, -13, z + 1.6], target: [0, 0, z] })

/* ------------------------------------------------------------------ 3.1 */
const finiteDiff: Experiment = {
  id: 'finite-difference',
  title: 'The derivative as a limit',
  short: 'Secant lines shrink into the tangent',
  file: 'lab3_calculus/exp1_finite_difference.py',
  aim: 'To approximate $f\'(x_0)$ by the slope of secant lines with shrinking step $h$, and to compare the forward and central difference formulas.',
  apparatus: ['Python 3 with NumPy', '$f(x)=\\sin x+0.3x^2$, drawn on a vertical board', 'A point $x_0$ (change it under Inputs)'],
  theory: `The derivative is the limit of rise over run:
$$f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}$$
For a finite $h$ the forward difference has error proportional to $h$. The central difference $\\frac{f(x+h)-f(x-h)}{2h}$ cancels the first error term, so its error is proportional to $h^2$.`,
  ml: 'The derivative tells you how the loss changes when you nudge a weight. Finite differences are too slow to train with (one extra forward pass per weight) but they are the standard way to check that a hand-written backward pass is correct: the "gradient check".',
  params: [{ key: 'x0', label: 'x₀', default: 1, min: -2, max: 2, step: 0.25 }],
  columns: ['h', 'rise', 'slope', '|error|'],
  run: (p) => {
    const f = (x: number) => Math.sin(x) + 0.3 * x * x
    const df = (x: number) => Math.cos(x) + 0.6 * x
    const X = (x: number) => x * 1.4
    const Z = (v: number) => v + 1.2
    const x0 = p.x0
    const f0 = f(x0)
    const exact = df(x0)
    const P = (x: number, v: number): V3 => [X(x), 0, Z(v)]
    const curve: Prim = { id: 'f', k: 'line', pts: linspace(-3.1, 3.1, 160).map((x) => P(x, f(x))), color: C.a, w: 3 }
    const line = (id: string, slope: number, color: string, w = 2.5): Prim => ({ id, k: 'line', pts: [P(x0 - 2.2, f0 - 2.2 * slope), P(x0 + 2.2, f0 + 2.2 * slope)], color, w })
    const pt: Prim = { id: 'p0', k: 'point', p: P(x0, f0), color: C.r, label: `x₀ = ${x0}` }
    const view = front(2.2)
    const legend: [string, string][] = [
      [C.a, 'f(x)'],
      [C.b, 'secant line'],
      [C.r, 'tangent (true slope)'],
    ]
    const steps: Step[] = [
      {
        title: 'Where is the curve going at x₀?',
        text: `$f(x)=\\sin x+0.3x^2$. At $x_0=${x0}$ the curve has some steepness. We cannot divide by zero, so we measure the slope between two nearby points and let them get closer.`,
        line: 'def f(x):',
        scene: [curve, pt],
        view,
        legend,
      },
    ]
    for (const h of [2, 1, 0.5, 0.1, 0.01]) {
      const rise = f(x0 + h) - f0
      const slope = rise / h
      const sc: Prim[] = [
        curve,
        pt,
        { id: 'p1', k: 'point', p: P(x0 + h, f(x0 + h)), color: C.b, r: 0.1, label: h >= 0.5 ? `x₀ + ${h}` : undefined },
        line('sec', slope, C.b),
        { id: 'run', k: 'line', pts: [P(x0, f0), P(x0 + h, f0), P(x0 + h, f(x0 + h))], color: C.w, dashed: true },
      ]
      steps.push({
        title: `h = ${h}: slope = ${fmt(slope, 4)}`,
        text: `Rise ${fmt(rise, 4)} over run ${h}. ${h >= 1 ? 'The second point is far away, so the secant line cuts across the curve and the slope is off.' : h > 0.05 ? 'Closer: the secant line is turning into the tangent.' : 'The two points are almost on top of each other; the secant is now practically the tangent.'} Error vs the true slope ${fmt(exact, 4)}: ${fmt(Math.abs(slope - exact), 4)}.`,
        line: 'slope = rise / h',
        tone: 'walk',
        scene: sc,
        view,
        vars: [
          ['h', String(h)],
          ['rise', fmt(rise, 5)],
          ['slope', fmt(slope, 5)],
        ],
        row: [h, fmt(rise, 5), fmt(slope, 5), fmt(Math.abs(slope - exact), 5)],
        legend,
      })
    }
    const hc = 1e-5
    const central = (f(x0 + hc) - f(x0 - hc)) / (2 * hc)
    steps.push({
      title: `Central difference: f'(${x0}) ≈ ${fmt(central, 8)}`,
      text: `Step both ways and divide by $2h$. With $h=10^{-5}$ it matches the exact derivative $\\cos x_0+0.6x_0=${fmt(exact, 8)}$ to about 10 digits. The gold line is the tangent: it touches the curve and has exactly this slope.`,
      line: 'return (f(x + h) - f(x - h)) / (2 * h)',
      tone: 'done',
      scene: [curve, pt, line('tan', central, C.r, 3.5)],
      view,
      vars: [
        ['derivative(f, x0)', fmt(central, 9)],
        ['exact', fmt(exact, 9)],
      ],
      row: ['central 1e-5', '-', fmt(central, 8), fmt(Math.abs(central - exact), 10)],
      legend,
    })
    return steps
  },
  result: 'The forward-difference slope approaches $f\'(x_0)$ as $h\\to0$ with error roughly proportional to $h$; the central difference is far more accurate for the same $h$ (error ∝ $h^2$).',
  viva: [
    { q: 'Why not use $h=10^{-15}$ to be even more accurate?', a: 'Rounding error. $f(x+h)-f(x)$ subtracts two nearly equal numbers and loses almost all significant digits. Around $h\\approx10^{-5}$ to $10^{-8}$ balances truncation against rounding.' },
    { q: 'Why is the central difference more accurate?', a: 'Taylor: $f(x\\pm h)=f\\pm hf\'+\\tfrac{h^2}{2}f\'\'\\pm\\dots$. Subtracting cancels the $f\'\'$ term, leaving an $O(h^2)$ error.' },
    { q: 'How many function evaluations does a numerical gradient of n weights cost?', a: '$2n$ for central differences. Backpropagation gets all n partial derivatives for about the cost of one extra pass.' },
    { q: 'What does a derivative of zero mean for a loss?', a: 'A flat spot: a minimum, a maximum or a saddle. Gradient descent stops moving there.' },
  ],
}

/* ------------------------------------------------------------------ 3.2 */
const LZ = 0.11
const bowl = (x: number, y: number) => x * x + 3 * y * y
const gradientDescent: Experiment = {
  id: 'gradient-descent',
  title: 'Gradient descent',
  short: 'Roll downhill on a loss surface',
  file: 'lab3_calculus/exp2_gradient_descent.py',
  aim: 'To minimise $L(x,y)=x^2+3y^2$ by repeatedly stepping against the gradient, and to see how the learning rate decides between crawling, converging and diverging.',
  apparatus: ['Python 3 with NumPy', 'The loss surface on the bench with its contour lines', 'Learning rate and starting point under Inputs'],
  theory: `The gradient $\\nabla L=(\\partial L/\\partial x,\\;\\partial L/\\partial y)=(2x,\\;6y)$ points uphill, at right angles to the contour lines. One step is
$$p\\leftarrow p-\\eta\\,\\nabla L(p)$$
Along y the update multiplies y by $(1-6\\eta)$. If $\\eta>1/3$ that factor is below −1 and y grows every step: divergence.`,
  ml: 'This loop is how every neural network is trained: compute the gradient of the loss with respect to all weights (by backpropagation), take a small step downhill, repeat millions of times. Choosing η is the first thing anyone tunes.',
  params: [
    {
      key: 'lr',
      label: 'Learning rate η',
      default: 0.1,
      options: [
        { value: 0.02, label: '0.02 (too small)' },
        { value: 0.1, label: '0.1 (good)' },
        { value: 0.3, label: '0.3 (zig-zag)' },
        { value: 0.34, label: '0.34 (diverges)' },
      ],
    },
    { key: 'sx', label: 'start x', default: 2.5, min: -3, max: 3, step: 0.5 },
    { key: 'sy', label: 'start y', default: 1.5, min: -2, max: 2, step: 0.5 },
  ],
  columns: ['k', 'x', 'y', 'loss', '|∇L|'],
  run: (p) => {
    const lr = p.lr
    const on = (x: number, y: number, lift = 0.12): V3 => [x, y, bowl(x, y) * LZ + lift]
    const surface: Prim = { id: 's', k: 'surface', f: (x, y) => bowl(x, y) * LZ, range: [-3.3, 3.3, -3.3, 3.3], color: C.o, opacity: 0.75, seg: 60 }
    const contours: Prim[] = [0.5, 2, 4.5, 8, 12.5].map((c, i) => ({ id: `ct${i}`, k: 'line', pts: linspace(0, 2 * Math.PI, 97).map((t) => [Math.sqrt(c) * Math.cos(t), Math.sqrt(c / 3) * Math.sin(t), 0.02] as V3), color: C.m, opacity: 0.8 }) as Prim)
    let x = p.sx
    let y = p.sy
    const path: V3[] = [on(x, y)]
    const floorPath: V3[] = [[x, y, 0.03]]
    const view = { pos: [6.5, -9.5, 8] as V3, target: [0, 0, 0.6] as V3 }
    const legend: [string, string][] = [
      [C.r, 'the ball (current weights)'],
      [C.b, 'gradient: uphill'],
      [C.g, 'step: −η·gradient'],
      [C.w, 'path'],
    ]
    const scene = (extra: Prim[] = []): Prim[] => [
      surface,
      ...contours,
      { id: 'path', k: 'line', pts: [...path], color: C.w, w: 2.5 },
      { id: 'fpath', k: 'line', pts: [...floorPath], color: C.w, w: 1.5, opacity: 0.5, dashed: true },
      { id: 'ball', k: 'point', p: on(x, y, 0.18), color: C.r, r: 0.18 },
      { id: 'min', k: 'label', p: [0, 0, 0.15], text: 'minimum', color: C.g },
      ...extra,
    ]
    const steps: Step[] = [
      {
        title: 'A long, narrow bowl',
        text: `The loss is $x^2+3y^2$: three times steeper in y than in x. The grey rings on the floor are contour lines (equal loss). The ball starts at (${p.sx}, ${p.sy}) with loss ${fmt(bowl(x, y), 2)}.`,
        line: 'return x**2 + 3 * y**2',
        scene: scene(),
        view,
        vars: [['p', `(${fmt(x, 3)}, ${fmt(y, 3)})`]],
        row: [0, fmt(x, 4), fmt(y, 4), fmt(bowl(x, y), 5), fmt(Math.hypot(2 * x, 6 * y), 4)],
        legend,
      },
    ]
    for (let k = 1; k <= 25; k++) {
      const g = [2 * x, 6 * y]
      const gs = 0.22
      if (k <= 2)
        steps.push({
          title: `Step ${k}: measure the slope, ∇L = (${fmt(g[0], 2)}, ${fmt(g[1], 2)})`,
          text: `The pink arrow is the gradient at the ball: the direction of steepest climb, perpendicular to the contour line. It leans mostly along ${Math.abs(g[1]) > Math.abs(g[0]) ? 'y, the steep direction' : 'x'}. We will move the opposite way, scaled by η = ${lr}.`,
          line: 'g = grad(p)',
          tone: 'walk',
          scene: scene([
            { id: 'g', k: 'arrow', from: [x, y, 0.05], to: [x + g[0] * gs, y + g[1] * gs, 0.05], color: C.b, label: '∇L' },
            { id: 'st', k: 'arrow', from: [x, y, 0.05], to: [x - lr * g[0], y - lr * g[1], 0.05], color: C.g, label: '−η∇L' },
          ]),
          view,
          vars: [
            ['p', `(${fmt(x, 3)}, ${fmt(y, 3)})`],
            ['g', `(${fmt(g[0], 3)}, ${fmt(g[1], 3)})`],
          ],
          legend,
        })
      const before = bowl(x, y)
      x -= lr * g[0]
      y -= lr * g[1]
      path.push(on(x, y))
      floorPath.push([x, y, 0.03])
      const L = bowl(x, y)
      const diverging = L > before
      steps.push({
        title: `Step ${k}: loss ${fmt(before, 3)} → ${fmt(L, 4)}`,
        text: diverging
          ? `The loss went **up**. With η = ${lr} the step overshoots the valley floor along y and lands higher on the other side, and each overshoot is bigger than the last.`
          : k <= 2
            ? `The ball moves to (${fmt(x, 3)}, ${fmt(y, 3)}). ${lr >= 0.3 ? 'It jumps across the narrow y direction: a zig-zag.' : 'Downhill, as promised.'}`
            : lr <= 0.02
              ? 'Tiny steps: safe, but it will take hundreds of them to reach the bottom.'
              : 'Repeat: gradient, step. The steep y direction settles first; the gentle x direction takes longer.',
        line: 'p = p - lr * g',
        tone: diverging ? 'warn' : k === 25 ? 'done' : 'make',
        scene: scene(),
        view,
        vars: [
          ['p', `(${fmt(x, 4)}, ${fmt(y, 4)})`],
          ['loss', fmt(L, 6)],
        ],
        row: [k, fmt(x, 4), fmt(y, 4), fmt(L, 5), fmt(Math.hypot(2 * x, 6 * y), 4)],
        legend,
      })
    }
    return steps
  },
  result: 'With a good learning rate the loss drops by a constant factor each step. Too small crawls; too large zig-zags across the steep direction; above $\\eta=1/3$ the steep direction blows up. The narrow valley (condition number 3) is what limits η.',
  viva: [
    { q: 'Why does the path zig-zag?', a: 'The gradient points across the narrow valley (steep y) more than along it. A step big enough to make progress in x overshoots in y.' },
    { q: 'What is the largest stable learning rate here?', a: 'Each coordinate is multiplied by $1-2\\eta\\lambda$ with $\\lambda\\in\\{1,3\\}$. Stability needs $|1-6\\eta|<1$, so $\\eta<1/3$.' },
    { q: 'How do momentum and Adam help on this surface?', a: 'Momentum averages past gradients, cancelling the zig-zag and building speed along the valley. Adam rescales each coordinate by its recent gradient size, so steep and flat directions get similar step sizes.' },
    { q: 'Why is the gradient perpendicular to contour lines?', a: 'Moving along a contour keeps L constant, so the directional derivative $\\nabla L\\cdot v$ is 0 there: the gradient is orthogonal to every contour direction.' },
  ],
}

/* ------------------------------------------------------------------ 3.3 */
const NEWTON_FNS = [
  { f: (x: number) => x * x - 2, df: (x: number) => 2 * x, dom: [0.2, 3.4], root: Math.SQRT2, name: 'x² − 2', tex: 'x^2-2' },
  { f: (x: number) => x ** 3 - 2 * x - 5, df: (x: number) => 3 * x * x - 2, dom: [1, 3.2], root: 2.0945514815423265, name: 'x³ − 2x − 5', tex: 'x^3-2x-5' },
]
const newton: Experiment = {
  id: 'newton',
  title: "Newton's method",
  short: 'Ride the tangent line down to zero',
  file: 'lab3_calculus/exp3_newton.py',
  aim: "To find a root of $f(x)=0$ by following tangent lines, and to observe Newton's quadratic convergence: the number of correct digits roughly doubles each step.",
  apparatus: ['Python 3', 'A smooth function and its derivative', 'The curve on a vertical board with the line $f=0$'],
  theory: `Near $x_k$, replace $f$ by its tangent line $f(x_k)+f'(x_k)(x-x_k)$ and solve for where it is zero:
$$x_{k+1}=x_k-\\frac{f(x_k)}{f'(x_k)}$$
Close to a simple root the error squares each step: $e_{k+1}\\approx C\\,e_k^2$.`,
  ml: "Applied to $f=L'$, Newton's method minimises a loss using curvature: $w\\leftarrow w-L'/L''$, or $w\\leftarrow w-H^{-1}\\nabla L$ in many dimensions. It is used for logistic regression (IRLS) and inspires quasi-Newton methods such as L-BFGS. For deep nets the Hessian is too big, which is why first-order methods dominate.",
  params: [
    {
      key: 'fn',
      label: 'Function',
      default: 0,
      options: NEWTON_FNS.map((f, i) => ({ value: i, label: `f(x) = ${f.name}` })),
    },
    { key: 'x0', label: 'start x₀', default: 3, min: 0.5, max: 3.2, step: 0.1 },
  ],
  columns: ['k', 'x', 'f(x)', '|x − root|'],
  run: (p) => {
    const F = NEWTON_FNS[p.fn] ?? NEWTON_FNS[0]
    const [a, b] = F.dom
    const xs = linspace(a, b, 160)
    const vals = xs.map(F.f)
    const lo = Math.min(...vals, 0)
    const hi = Math.max(...vals)
    const X = (x: number) => (x - (a + b) / 2) * (9 / (b - a))
    const Z = (v: number) => 0.4 + ((v - lo) / (hi - lo)) * 4.4
    const P = (x: number, v: number): V3 => [X(x), 0, Z(v)]
    const base: Prim[] = [
      { id: 'f', k: 'line', pts: xs.map((x, i) => P(x, vals[i])), color: C.a, w: 3 },
      { id: 'zero', k: 'line', pts: [P(a, 0), P(b, 0)], color: C.w, w: 1.5 },
      { id: 'zl', k: 'label', p: [X(b) + 0.5, 0, Z(0)], text: 'f = 0', color: C.w },
      { id: 'root', k: 'point', p: P(F.root, 0), color: C.g, r: 0.09 },
    ]
    let x = clamp(p.x0, a, b)
    const view = front(2.6)
    const legend: [string, string][] = [
      [C.a, `f(x) = ${F.name}`],
      [C.r, 'tangent line'],
      [C.g, 'true root'],
    ]
    const err = (v: number) => Math.abs(v - F.root)
    const steps: Step[] = [
      {
        title: `Find where ${F.name} = 0`,
        text: `The green dot is the root we want (${fmt(F.root, 10)}). Start from a guess $x_0=${fmt(x, 2)}$, which can be far from it.`,
        line: 'def newton_root(f, df, x0, steps=6):',
        scene: [...base, { id: 'x', k: 'point', p: P(x, F.f(x)), color: C.r, label: `x₀ = ${fmt(x, 2)}` }],
        view,
        row: [0, fmt(x, 12), fmt(F.f(x), 6), fmt(err(x), 12)],
        legend,
      },
    ]
    for (let k = 1; k <= 6; k++) {
      const fx = F.f(x)
      const d = F.df(x)
      if (Math.abs(d) < 1e-12) {
        steps.push({ title: 'Flat tangent: Newton fails', text: "The derivative is zero, so the tangent never meets f = 0. Newton's method needs a non-zero slope.", tone: 'warn', scene: base, view, line: 'x = x - f(x) / df(x)' })
        break
      }
      const nx = x - fx / d
      const t0 = Math.max(a, Math.min(x, nx) - 0.3)
      const t1 = Math.min(b, Math.max(x, nx) + 0.3)
      const tangent: Prim = { id: 'tan', k: 'line', pts: [P(t0, fx + d * (t0 - x)), P(t1, fx + d * (t1 - x))], color: C.r, w: 2.5 }
      const curPt: Prim = { id: 'x', k: 'point', p: P(x, fx), color: C.r, label: `x${k - 1}` }
      steps.push({
        title: `Step ${k}: tangent at x = ${fmt(x, 6)}`,
        text: `Slope $f'(x)=${fmt(d, 4)}$, height $f(x)=${fmt(fx, 4)}$. Follow the gold tangent line down to where it crosses $f=0$: $x-f(x)/f'(x)=${fmt(nx, 8)}$.`,
        line: 'x = x - f(x) / df(x)',
        tone: 'walk',
        scene: [...base, tangent, curPt, { id: 'nx', k: 'point', p: P(clamp(nx, a, b), 0), color: C.o, r: 0.1 }, { id: 'up', k: 'line', pts: [P(clamp(nx, a, b), 0), P(clamp(nx, a, b), F.f(clamp(nx, a, b)))], color: C.o, dashed: true }],
        view,
        vars: [
          ['x', fmt(x, 10)],
          ['f(x)', fmt(fx, 8)],
          ['df(x)', fmt(d, 6)],
        ],
        legend,
      })
      x = nx
      const e = err(x)
      steps.push({
        title: `x${k} = ${fmt(x, 12)}  (error ${e.toExponential(1)})`,
        text: k >= 2 && e > 0 ? `Compare with the previous error: roughly its square. That is quadratic convergence — the number of correct digits about doubles each step.` : 'Move to the new point and repeat.',
        line: 'history.append(x)',
        tone: e < 1e-10 ? 'done' : 'make',
        scene: [...base, { id: 'x', k: 'point', p: P(clamp(x, a, b), F.f(clamp(x, a, b))), color: C.r, label: `x${k}` }],
        view,
        vars: [['x', fmt(x, 12)]],
        row: [k, fmt(x, 12), fmt(F.f(x), 6), e === 0 ? '0' : e.toExponential(2)],
        legend,
      })
    }
    return steps
  },
  result: "Newton's method reaches machine precision in about 5–6 steps from a reasonable start: the error is squared at every step once it is close. Far from the root, or where $f'$ is near 0, it can jump away or fail.",
  viva: [
    { q: 'Why does the error square each step?', a: 'Taylor-expand around the root r: $f(x)=f\'(r)e+\\tfrac12f\'\'(r)e^2+\\dots$. Plugging into the update gives $e_{k+1}=\\frac{f\'\'(r)}{2f\'(r)}e_k^2+O(e_k^3)$.' },
    { q: 'How do you use Newton to minimise a loss?', a: 'Find a zero of the derivative: $w\\leftarrow w-L\'(w)/L\'\'(w)$; in many dimensions $w\\leftarrow w-H^{-1}\\nabla L$.' },
    { q: 'Why is Newton rarely used for deep networks?', a: 'The Hessian has $n^2$ entries for n weights (millions squared) and inverting it costs $O(n^3)$. Also, near saddle points Newton can move towards them instead of away.' },
    { q: 'What is the Babylonian method for √2?', a: "It is Newton's method on $x^2-2$: $x\\leftarrow\\tfrac12(x+2/x)$." },
  ],
}

/* ------------------------------------------------------------------ 3.4 */
const riemann: Experiment = {
  id: 'riemann-integral',
  title: 'Integration as adding strips',
  short: 'Area under the normal curve, slab by slab',
  file: 'lab3_calculus/exp4_riemann_integral.py',
  aim: 'To approximate $\\int_{-k}^{k}\\varphi(x)\\,dx$ for the standard normal density with midpoint rectangles, and to see the error fall as the strips get thinner.',
  apparatus: ['Python 3 with NumPy', 'The standard normal density $\\varphi(x)$', 'Slabs of width $\\Delta x$ standing under the curve'],
  theory: `Cut $[a,b]$ into n strips of width $\\Delta x=(b-a)/n$. Each strip is roughly a rectangle whose height is $f$ at its midpoint:
$$\\int_a^bf(x)\\,dx\\approx\\sum_{i=0}^{n-1}f\\!\\left(a+(i+\\tfrac12)\\Delta x\\right)\\Delta x$$
The midpoint rule's error shrinks like $1/n^2$: double the strips, quarter the error.`,
  ml: 'Probabilities of continuous variables are areas under a density, and expectations are integrals. Most of them cannot be done by hand, so ML uses numerical integration in low dimensions and Monte Carlo (Lab 2) in high dimensions — for example the evidence $\\int p(D\\mid\\theta)p(\\theta)\\,d\\theta$ in Bayesian models.',
  params: [
    {
      key: 'k',
      label: 'Limits ±k',
      default: 1,
      options: [
        { value: 1, label: '±1σ' },
        { value: 2, label: '±2σ' },
        { value: 3, label: '±3σ' },
      ],
    },
  ],
  columns: ['n', 'area', 'exact', '|error|'],
  run: (p) => {
    const k = p.k
    const a = -k
    const b = k
    const exact = erf(k / Math.SQRT2)
    const XS = 1.3
    const ZS = 8
    const curve: Prim = { id: 'f', k: 'line', pts: linspace(-3.6, 3.6, 180).map((x) => [x * XS, -0.5, normalPdf(x) * ZS] as V3), color: C.r, w: 3 }
    const limits: Prim[] = [a, b].map((x, i) => ({ id: `lim${i}`, k: 'line', pts: [[x * XS, -0.5, 0.02], [x * XS, -0.5, normalPdf(x) * ZS]], color: C.w, dashed: true }) as Prim)
    const slabs = (n: number, upto = n): Prim => {
      const dx = (b - a) / n
      return { id: 'slabs', k: 'bars', bars: Array.from({ length: n }, (_, i) => ({ x: (a + (i + 0.5) * dx) * XS, h: i < upto ? normalPdf(a + (i + 0.5) * dx) * ZS : 0 })), w: dx * XS * 0.97, d: 0.9, color: C.a, opacity: 0.75 }
    }
    const view = front(1.6)
    const legend: [string, string][] = [
      [C.r, 'φ(x), the normal density'],
      [C.a, 'midpoint strips'],
    ]
    const steps: Step[] = [
      {
        title: `Area under φ between −${k} and ${k}`,
        text: `This area is $P(-${k}<Z<${k})$ for a standard normal. There is no formula in elementary functions for it, so we add up thin rectangles.`,
        line: 'def riemann(f, a, b, n):',
        scene: [curve, ...limits],
        view,
        legend,
      },
    ]
    const n0 = 4
    const dx0 = (b - a) / n0
    let total = 0
    for (let i = 0; i < n0; i++) {
      const xm = a + (i + 0.5) * dx0
      total += normalPdf(xm) * dx0
      steps.push({
        title: `Strip ${i + 1} of ${n0}: height φ(${fmt(xm, 2)}) = ${fmt(normalPdf(xm), 4)}`,
        text: `Width $\\Delta x=${fmt(dx0, 3)}$, so this strip adds ${fmt(normalPdf(xm) * dx0, 4)}. Running total: **${fmt(total, 5)}**.`,
        line: 'total += f(x_mid) * dx',
        tone: 'make',
        scene: [curve, ...limits, slabs(n0, i + 1), { id: 'mid', k: 'point', p: [xm * XS, -0.5, normalPdf(xm) * ZS], color: C.o, r: 0.1, label: 'midpoint' }],
        view,
        vars: [
          ['i', String(i)],
          ['x_mid', fmt(xm, 4)],
          ['total', fmt(total, 6)],
        ],
        row: i === n0 - 1 ? [n0, fmt(total, 6), fmt(exact, 6), fmt(Math.abs(total - exact), 6)] : undefined,
        legend,
      })
    }
    for (const n of [8, 16, 64]) {
      const dx = (b - a) / n
      let s = 0
      for (let i = 0; i < n; i++) s += normalPdf(a + (i + 0.5) * dx) * dx
      steps.push({
        title: `n = ${n}: area = ${fmt(s, 6)}`,
        text: `Thinner strips follow the curve better. Error ${fmt(Math.abs(s - exact), 6)}${n > 8 ? `, about 1/4 of the error with ${n / 2} strips` : ''}.`,
        line: 'dx = (b - a) / n',
        tone: n === 64 ? 'done' : 'make',
        scene: [curve, ...limits, slabs(n)],
        view,
        vars: [
          ['n', String(n)],
          ['dx', fmt(dx, 4)],
          ['total', fmt(s, 7)],
        ],
        row: [n, fmt(s, 6), fmt(exact, 6), fmt(Math.abs(s - exact), 6)],
        legend,
      })
    }
    steps[steps.length - 1].text += ` The exact value is ${fmt(exact, 6)}: ${k === 1 ? 'the 68%' : k === 2 ? 'the 95%' : 'the 99.7%'} of the 68–95–99.7 rule.`
    return steps
  },
  result: 'The midpoint sums converge to $P(-k<Z<k)$ (0.6827, 0.9545, 0.9973), with the error dropping about 4× each time n doubles.',
  viva: [
    { q: 'Why use the midpoint rather than the left edge of each strip?', a: 'The left-edge rule has error $O(1/n)$. The midpoint rule\'s over- and under-estimates on each strip cancel to first order, giving $O(1/n^2)$.' },
    { q: 'What is a definite integral, in words?', a: 'The limit of these sums as the strip width goes to 0: total accumulated value of f over the interval.' },
    { q: 'Why does numerical integration get hard in many dimensions?', a: 'A grid with m points per axis needs $m^d$ points in d dimensions. Monte Carlo\'s error does not depend on d, so it wins in high dimensions.' },
    { q: 'How does the fundamental theorem of calculus connect this to derivatives?', a: 'If $F\'=f$ then $\\int_a^bf=F(b)-F(a)$. For the normal, $F$ is the CDF $\\Phi$, which is exactly what our sums approximate.' },
  ],
}

/* ------------------------------------------------------------------ 3.5 */
const backprop: Experiment = {
  id: 'backprop',
  title: 'Backpropagation',
  short: 'The chain rule through one neuron',
  file: 'lab3_calculus/exp5_backprop.py',
  aim: 'To compute the loss of a single sigmoid neuron (forward pass) and the gradients of the loss with respect to its weight and bias (backward pass) using only the chain rule.',
  apparatus: ['Python 3 with NumPy', 'One neuron: $z=wx+b$, $a=\\sigma(z)$, $L=(a-y)^2$', 'Its computational graph on the bench'],
  theory: `Each node only needs its own local derivative. The chain rule multiplies them from the loss back to each weight:
$$\\frac{\\partial L}{\\partial w}=\\frac{\\partial L}{\\partial a}\\cdot\\frac{\\partial a}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w}=2(a-y)\\cdot a(1-a)\\cdot x$$
The shared part $\\partial L/\\partial z$ is computed once and reused for every weight feeding into z.`,
  ml: 'This is exactly what `loss.backward()` does in PyTorch, for every node of a network with millions of weights. Reusing the shared upstream gradient is what makes backpropagation cost about the same as one forward pass.',
  params: [
    { key: 'x', label: 'input x', default: 1.5, min: -3, max: 3, step: 0.5 },
    { key: 'y', label: 'target y', default: 1, min: 0, max: 1, step: 0.1 },
    { key: 'w', label: 'weight w', default: 0.8, min: -3, max: 3, step: 0.1 },
    { key: 'b', label: 'bias b', default: -0.5, min: -3, max: 3, step: 0.1 },
  ],
  columns: ['quantity', 'value', 'local rule'],
  run: (p) => {
    const { x, y, w, b } = p
    const sig = (t: number) => 1 / (1 + Math.exp(-t))
    const z = w * x + b
    const a = sig(z)
    const L = (a - y) ** 2
    const dLda = 2 * (a - y)
    const dadz = a * (1 - a)
    const dLdz = dLda * dadz
    const dLdw = dLdz * x
    const dLdb = dLdz
    const pos: Record<string, V3> = { x: [-5, 0, 4], w: [-5, 0, 2.4], b: [-5, 0, 0.8], z: [-1.6, 0, 2.4], a: [1.6, 0, 2.4], y: [1.6, 0, 0.7], L: [4.8, 0, 2.4] }
    const edges: [string, string][] = [
      ['x', 'z'],
      ['w', 'z'],
      ['b', 'z'],
      ['z', 'a'],
      ['a', 'L'],
      ['y', 'L'],
    ]
    type NodeState = { val?: string; grad?: string; hot?: boolean }
    const graph = (st: Record<string, NodeState>, back: [string, string][] = []): Prim[] => [
      ...edges.map(([u, v]) => ({ id: `e${u}${v}`, k: 'line', pts: [pos[u], pos[v]], color: C.m, w: 2 }) as Prim),
      ...back.map(([u, v]) => {
        const off: V3 = [0, 0, -0.35]
        return { id: `bk${u}${v}`, k: 'arrow', from: [pos[v][0] + off[0], 0, pos[v][2] + off[2]], to: [pos[u][0] * 0.82 + pos[v][0] * 0.18, 0, pos[u][2] * 0.82 + pos[v][2] * 0.18 - 0.35], color: C.b, r: 0.035 } as Prim
      }),
      ...Object.entries(pos).map(([n, pp]) => {
        const s = st[n] ?? {}
        const names: Record<string, string> = { x: 'x (input)', w: 'w (weight)', b: 'b (bias)', z: 'z = w·x + b', a: 'a = σ(z)', y: 'y (target)', L: 'L = (a − y)²' }
        const lines = [s.val ? `value ${s.val}` : '', s.grad ? `∂L/∂${n} = ${s.grad}` : ''].filter(Boolean)
        return { id: `n${n}`, k: 'node', p: pp, title: names[n], lines, color: s.grad ? C.b : s.val ? C.a : C.m, hot: s.hot } as Prim
      }),
    ]
    const known: Record<string, NodeState> = { x: { val: fmt(x, 2) }, w: { val: fmt(w, 2) }, b: { val: fmt(b, 2) }, y: { val: fmt(y, 2) } }
    const view = { pos: [0, -12.5, 4.5] as V3, target: [0, 0, 2.3] as V3 }
    const legend: [string, string][] = [
      [C.a, 'forward: values'],
      [C.b, 'backward: gradients'],
    ]
    const steps: Step[] = []
    const snap = (title: string, text: string, line: string, tone: Step['tone'], hot: string, back: [string, string][] = [], row?: (string | number)[]) => {
      const st: Record<string, NodeState> = {}
      for (const [k, v] of Object.entries(known)) st[k] = { ...v, hot: k === hot }
      steps.push({ title, text, line, tone, scene: graph(st, back), view, legend, row, table: true, vars: Object.entries(known).flatMap(([k, v]) => [[k, v.val ?? '-'] as [string, string], ...(v.grad ? [[`dL/d${k}`, v.grad] as [string, string]] : [])]) })
    }
    snap('A neuron as a graph', `Inputs x = ${x}, weight w = ${w}, bias b = ${b}, target y = ${y}. Every box is one simple operation. Forward: fill in values left to right. Backward: fill in gradients right to left.`, 'def forward_backward(x, y, w, b):', 'info', '')
    known.z = { val: fmt(z, 4) }
    snap(`Forward: z = ${fmt(w, 2)}·${fmt(x, 2)} + ${fmt(b, 2)} = ${fmt(z, 4)}`, 'The weighted sum: a dot product of weights and inputs, plus the bias.', 'z = w * x + b', 'make', 'z', [], ['z', fmt(z, 6), 'w·x + b'])
    known.a = { val: fmt(a, 4) }
    snap(`Forward: a = σ(${fmt(z, 3)}) = ${fmt(a, 4)}`, 'The sigmoid squashes z into (0, 1), so a can be read as a probability.', 'a = sigmoid(z)', 'make', 'a', [], ['a', fmt(a, 6), '1 / (1 + e^(−z))'])
    known.L = { val: fmt(L, 5) }
    snap(`Forward: L = (${fmt(a, 3)} − ${fmt(y, 2)})² = ${fmt(L, 5)}`, 'The squared error. The forward pass is done; now we ask how L would change if each input changed a little.', 'loss = (a - y) ** 2', 'make', 'L', [], ['L', fmt(L, 6), '(a − y)²'])
    known.a.grad = fmt(dLda, 4)
    snap(`Backward: ∂L/∂a = 2(a − y) = ${fmt(dLda, 4)}`, `Start at the loss. ${dLda < 0 ? 'Negative: increasing a would lower the loss (a is below the target).' : 'Positive: decreasing a would lower the loss.'}`, 'dloss_da = 2 * (a - y)', 'cut', 'a', [['a', 'L']], ['∂L/∂a', fmt(dLda, 6), '2(a − y)'])
    snap(`Local slope of the sigmoid: ∂a/∂z = a(1 − a) = ${fmt(dadz, 4)}`, 'The sigmoid\'s own derivative, using only its output. It is at most 0.25, which is why deep stacks of sigmoids pass back tiny gradients.', 'da_dz = a * (1 - a)', 'walk', 'a', [['a', 'L']], ['∂a/∂z', fmt(dadz, 6), 'a(1 − a)'])
    known.z.grad = fmt(dLdz, 4)
    snap(`Chain rule: ∂L/∂z = ${fmt(dLda, 3)} × ${fmt(dadz, 3)} = ${fmt(dLdz, 4)}`, 'Multiply the gradient arriving from the right by the local derivative. This one number is shared by every input of z.', 'dloss_dz = dloss_da * da_dz', 'cut', 'z', [['a', 'L'], ['z', 'a']], ['∂L/∂z', fmt(dLdz, 6), '∂L/∂a · ∂a/∂z'])
    known.w.grad = fmt(dLdw, 4)
    snap(`∂L/∂w = ∂L/∂z × x = ${fmt(dLdw, 4)}`, `Since $z=wx+b$, $\\partial z/\\partial w=x$. A large input makes its weight's gradient large.`, 'dloss_dw = dloss_dz * x', 'cut', 'w', [['a', 'L'], ['z', 'a'], ['w', 'z']], ['∂L/∂w', fmt(dLdw, 6), '∂L/∂z · x'])
    known.b.grad = fmt(dLdb, 4)
    snap(`∂L/∂b = ∂L/∂z × 1 = ${fmt(dLdb, 4)}`, '$\\partial z/\\partial b=1$, so the bias receives the upstream gradient unchanged.', 'dloss_db = dloss_dz * 1.0', 'cut', 'b', [['a', 'L'], ['z', 'a'], ['w', 'z'], ['b', 'z']], ['∂L/∂b', fmt(dLdb, 6), '∂L/∂z · 1'])
    const lr = 0.5
    const w2 = w - lr * dLdw
    const b2 = b - lr * dLdb
    const L2 = (sig(w2 * x + b2) - y) ** 2
    snap(
      `One gradient step: loss ${fmt(L, 5)} → ${fmt(L2, 5)}`,
      `With learning rate 0.5: $w\\leftarrow ${fmt(w, 3)}-0.5\\cdot${fmt(dLdw, 3)}=${fmt(w2, 3)}$ and $b\\leftarrow${fmt(b2, 3)}$. Running the forward pass again gives a ${L2 < L ? 'smaller' : 'different'} loss. That is one training step. The self-check in the Python file confirms these gradients against finite differences.`,
      'return loss, dloss_dw, dloss_db',
      'done',
      '',
      [['a', 'L'], ['z', 'a'], ['w', 'z'], ['b', 'z']],
      ['new loss', fmt(L2, 6), 'after w, b −= 0.5·grad'],
    )
    return steps
  },
  result: 'The forward pass gives the loss; one backward sweep of local derivatives gives $\\partial L/\\partial w$ and $\\partial L/\\partial b$, which match a numerical gradient check. A step against them lowers the loss.',
  viva: [
    { q: 'Why go backwards instead of forwards?', a: 'There is one output (the loss) and many inputs (weights). Going backwards computes all $\\partial L/\\partial w_i$ in one sweep, reusing shared intermediate gradients.' },
    { q: 'What is the vanishing gradient problem?', a: 'The sigmoid\'s derivative is at most 0.25. Through many layers these factors multiply and the gradient reaching early layers becomes tiny. ReLU, residual connections and normalisation reduce it.' },
    { q: 'Why does the forward pass have to store its values?', a: 'The backward pass needs them: $a(1-a)$ needs a, and $\\partial z/\\partial w$ needs x. This is why training uses much more memory than inference.' },
    { q: 'What does a gradient check do?', a: 'It compares the backprop gradient to a central-difference estimate; a mismatch means a bug in the backward pass.' },
  ],
}

/* ------------------------------------------------------------------ 3.6 */
const RX = [-2, -1.2, -0.5, 0, 0.6, 1.1, 1.8, 2.4]
const RY = [-1.9, -0.9, 0.1, 0.4, 1.3, 1.6, 2.6, 3.0]
const linreg: Experiment = {
  id: 'linear-regression-gd',
  title: 'Linear regression by gradient descent',
  short: 'Fit a line by walking down its loss surface',
  file: 'lab3_calculus/exp6_linear_regression_gd.py',
  aim: 'To fit $\\hat y=wx+b$ to data by gradient descent on the mean squared error, watching both the line on the data and the point $(w,b)$ on the loss surface.',
  apparatus: ['Python 3 with NumPy', '8 data points (back wall)', 'The MSE surface over $(w,b)$ (bench)'],
  theory: `The loss and its partial derivatives:
$$L=\\frac1n\\sum_i(wx_i+b-y_i)^2,\\quad \\frac{\\partial L}{\\partial w}=\\frac2n\\sum_i e_ix_i,\\quad \\frac{\\partial L}{\\partial b}=\\frac2n\\sum_i e_i$$
where $e_i=wx_i+b-y_i$. The surface is a bowl (convex), so gradient descent reaches the same answer as the closed-form least squares of Lab 1.`,
  ml: 'This is the smallest complete training loop: model, loss, gradient, update. A neural network replaces $wx+b$ with many layers and uses backprop for the gradient, but the loop is identical.',
  params: [
    {
      key: 'lr',
      label: 'Learning rate η',
      default: 0.1,
      options: [
        { value: 0.02, label: '0.02' },
        { value: 0.1, label: '0.1' },
        { value: 0.3, label: '0.3' },
      ],
    },
  ],
  columns: ['epoch', 'w', 'b', 'loss'],
  run: (p) => {
    const n = RX.length
    const mse = (w: number, b: number) => RX.reduce((s, x, i) => s + (w * x + b - RY[i]) ** 2, 0) / n
    const mx = RX.reduce((s, x) => s + x, 0) / n
    const my = RY.reduce((s, x) => s + x, 0) / n
    const wls = RX.reduce((s, x, i) => s + (x - mx) * (RY[i] - my), 0) / RX.reduce((s, x) => s + (x - mx) ** 2, 0)
    const bls = my - wls * mx
    const WY = 3.8
    const DX = (x: number) => x * 1.6
    const DZ = (y: number) => 1.8 + y * 0.7
    const SX = (w: number) => (w - 0.9) * 3
    const SY = (b: number) => -4.6 + ((b + 1.2) / 2.8) * 4.2
    const SZ = (l: number) => Math.min(l, 4) * 0.62
    const surfF = (X: number, Y: number) => SZ(mse(0.9 + X / 3, -1.2 + ((Y + 4.6) / 4.2) * 2.8))
    const surface: Prim = { id: 's', k: 'surface', f: surfF, range: [-4, 4, -4.6, -0.4], color: C.o, opacity: 0.8, seg: 50 }
    const data: Prim = { id: 'data', k: 'cloud', pts: RX.map((x, i) => [DX(x), WY, DZ(RY[i])] as V3), color: C.a, r: 0.14 }
    const lineP = (w: number, b: number): Prim => ({ id: 'fit', k: 'line', pts: [[DX(-2.6), WY, DZ(w * -2.6 + b)], [DX(2.9), WY, DZ(w * 2.9 + b)]], color: C.r, w: 3 })
    const resid = (w: number, b: number): Prim => ({ id: 'res', k: 'line', pts: RX.flatMap((x, i) => [[DX(x), WY, DZ(RY[i])] as V3, [DX(x), WY, DZ(w * x + b)] as V3]), color: C.b, segments: true, w: 1.5 })
    const on = (w: number, b: number): V3 => [SX(w), SY(b), SZ(mse(w, b)) + 0.15]
    const path: V3[] = []
    const scene = (w: number, b: number, extra: Prim[] = []): Prim[] => [
      surface,
      data,
      lineP(w, b),
      resid(w, b),
      { id: 'path', k: 'line', pts: [...path], color: C.w, w: 2 },
      { id: 'ball', k: 'point', p: on(w, b), color: C.r, r: 0.17, label: `w=${fmt(w, 2)}, b=${fmt(b, 2)}` },
      { id: 'best', k: 'point', p: on(wls, bls), color: C.g, r: 0.08 },
      { id: 'wl', k: 'label', p: [4.4, -4.9, 0.1], text: 'w →', color: C.m },
      { id: 'bl', k: 'label', p: [-4.5, -0.3, 0.1], text: 'b ↑', color: C.m },
      ...extra,
    ]
    const view = { pos: [0, -12, 8.5] as V3, target: [0, 0, 1.5] as V3 }
    const legend: [string, string][] = [
      [C.a, 'data'],
      [C.r, 'current line / current (w, b)'],
      [C.b, 'errors e = ŷ − y'],
      [C.g, 'least-squares optimum'],
    ]
    let w = 0
    let b = 0
    path.push(on(w, b))
    const steps: Step[] = [
      {
        title: 'Two views of the same model',
        text: 'Back wall: the data and the current line (flat at first: w = 0, b = 0). Bench: every possible (w, b) and its mean squared error. One point on the bench is one line on the wall.',
        line: 'w, b = 0.0, 0.0',
        scene: scene(w, b),
        view,
        row: [0, fmt(w, 4), fmt(b, 4), fmt(mse(w, b), 5)],
        legend,
      },
    ]
    const errs = RX.map((x, i) => w * x + b - RY[i])
    steps.push({
      title: 'Predict and measure the errors',
      text: `Predictions $\\hat y=wx+b$ are all 0. The pink segments are the errors; the loss is their mean square: ${fmt(mse(w, b), 4)}.`,
      line: 'loss = (error**2).mean()',
      tone: 'walk',
      scene: scene(w, b),
      view,
      vars: [['loss', fmt(mse(w, b), 5)]],
      legend,
    })
    const dw0 = (2 * errs.reduce((s, e, i) => s + e * RX[i], 0)) / n
    const db0 = (2 * errs.reduce((s, e) => s + e, 0)) / n
    steps.push({
      title: `Gradient: ∂L/∂w = ${fmt(dw0, 3)}, ∂L/∂b = ${fmt(db0, 3)}`,
      text: `Both are negative: increasing w and b would reduce the loss. The pink arrow on the bench shows the uphill direction; we will step the other way.`,
      line: 'dw = 2 * (error * x).mean()',
      tone: 'walk',
      scene: scene(w, b, [{ id: 'g', k: 'arrow', from: [SX(w), SY(b), 0.05], to: [SX(w) + dw0 * 0.6, SY(b) + db0 * 0.6 * 1.5, 0.05], color: C.b, label: '∇L (uphill)' }]),
      view,
      vars: [
        ['dw', fmt(dw0, 4)],
        ['db', fmt(db0, 4)],
      ],
      legend,
    })
    const epoch = () => {
      const e = RX.map((x, i) => w * x + b - RY[i])
      const dw = (2 * e.reduce((s, v, i) => s + v * RX[i], 0)) / n
      const db = (2 * e.reduce((s, v) => s + v, 0)) / n
      w -= p.lr * dw
      b -= p.lr * db
      path.push(on(w, b))
    }
    const shown = [1, 2, 3, 5, 10, 20, 40, 60]
    for (let ep = 1; ep <= 60; ep++) {
      epoch()
      if (!shown.includes(ep)) continue
      const L = mse(w, b)
      steps.push({
        title: `Epoch ${ep}: loss ${fmt(L, 4)}`,
        text:
          ep === 1
            ? `$w\\leftarrow w-\\eta\\,\\partial L/\\partial w$, same for b. The line tilts up towards the data and the ball rolls down the bench.`
            : ep < 10
              ? 'Each epoch the errors shrink, so the gradient shrinks, so the steps shrink.'
              : ep === 60
                ? `Close to the least-squares answer $w=${fmt(wls, 4)},\\;b=${fmt(bls, 4)}$ (green dot), which \`np.polyfit\` computes in closed form.`
                : 'The ball approaches the bottom of the bowl.',
        line: 'w = w - lr * dw',
        tone: ep === 60 ? 'done' : 'make',
        scene: scene(w, b),
        view,
        vars: [
          ['epoch', String(ep)],
          ['w', fmt(w, 5)],
          ['b', fmt(b, 5)],
          ['loss', fmt(L, 6)],
        ],
        row: [ep, fmt(w, 4), fmt(b, 4), fmt(L, 5)],
        legend,
      })
    }
    return steps
  },
  result: 'Gradient descent drives the MSE down to its minimum and the parameters to the closed-form least-squares solution ($w\\approx1.121$, $b\\approx0.467$). The path on the bowl is the same idea as Exp 3.2 with real data.',
  viva: [
    { q: 'Why is the MSE surface a bowl?', a: 'It is a quadratic function of (w, b) with a positive semi-definite Hessian $\\frac2n X^TX$, so it is convex with one global minimum (if the x values are not all equal).' },
    { q: 'Why use gradient descent if a closed form exists?', a: 'For one feature the closed form is fine. With millions of examples or a non-linear model there is no closed form, or it is too expensive to compute, and the same gradient loop still works.' },
    { q: 'What happens to the gradient if the x values are large, say in thousands?', a: '$\\partial L/\\partial w$ scales with x, so the surface is very steep in w and flat in b: a narrow valley. Standardising features fixes this, which is why we normalise inputs.' },
    { q: 'What is an epoch?', a: 'One pass over the whole training set. Here each epoch is one full-batch gradient step.' },
  ],
}

export const EXPERIMENTS: Experiment[] = [finiteDiff, gradientDescent, newton, riemann, backprop, linreg]
