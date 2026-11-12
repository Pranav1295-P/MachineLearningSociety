import { fmt, linspace, normalCdf, normalPdf } from '../../core/math'
import type { Lesson, Prim, Step, V3 } from '../../core/types'
import { C } from '../colors'

const frontView = { pos: [0, -13, 4] as V3, target: [0, 0, 2.2] as V3 }

/* 1. Derivative */
const derivative: Lesson = {
  id: 'derivative',
  title: 'The derivative',
  short: 'Slope at a point, and the slope function',
  formula: "f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}",
  ml: 'The derivative of the loss with respect to a weight says which way to nudge that weight and how strongly the loss reacts. Training is following derivatives.',
  steps: () => {
    const f = (x: number) => Math.sin(x) + 0.3 * x * x
    const df = (x: number) => Math.cos(x) + 0.6 * x
    const P = (x: number, v: number, y = 0): V3 => [x * 1.4, y, v + 1.2]
    const curve: Prim = { id: 'f', k: 'line', pts: linspace(-3.1, 3.1, 160).map((x) => P(x, f(x))), color: C.a, w: 3 }
    const x0 = 1
    const sec = (h: number): Prim[] => {
      const s = (f(x0 + h) - f(x0)) / h
      return [
        { id: 'sec', k: 'line', pts: [P(x0 - 2, f(x0) - 2 * s), P(x0 + 2.2, f(x0) + 2.2 * s)], color: C.b, w: 2.5 },
        { id: 'p1', k: 'point', p: P(x0 + h, f(x0 + h)), color: C.b, r: 0.1 },
      ]
    }
    const p0: Prim = { id: 'p0', k: 'point', p: P(x0, f(x0)), color: C.r }
    return [
      {
        title: 'Average slope between two points',
        text: 'Pick two points on the curve and join them: the secant line. Its slope is rise over run, $\\frac{f(x+h)-f(x)}{h}$, here with $h=1.5$.',
        scene: [curve, p0, ...sec(1.5)],
        view: frontView,
      },
      {
        title: 'Slide the second point in',
        text: 'As $h$ shrinks, the secant swings round and settles on one line: the tangent. Its slope is the derivative $f\'(1)\\approx' + fmt(df(1), 3) + '$.',
        tone: 'make',
        scene: [curve, p0, ...sec(0.05)],
        view: frontView,
      },
      {
        title: "The derivative is itself a function",
        text: "Do this at every x and plot the slopes (pink, on the board behind). Where f climbs, f' is positive; where f falls, f' is negative; at the bottom of the dip f' crosses zero. Finding minima means finding where the derivative is zero.",
        tone: 'done',
        scene: [
          curve,
          { id: 'df', k: 'line', pts: linspace(-3.1, 3.1, 160).map((x) => P(x, df(x) * 0.8 + 0.9, 1.5)), color: C.b, w: 3 },
          { id: 'zero', k: 'line', pts: [P(-3.1, 0.9, 1.5), P(3.1, 0.9, 1.5)], color: C.m, dashed: true },
          { id: 'l1', k: 'label', p: P(3.3, f(3.1)), text: 'f', color: C.a, size: 'md' },
          { id: 'l2', k: 'label', p: P(3.3, df(3.1) * 0.8 + 0.9, 1.5), text: "f'", color: C.b, size: 'md' },
        ],
        view: { pos: [3, -13, 5], target: [0, 0.7, 2] },
      },
    ] as Step[]
  },
  check: {
    q: "At a point where $f'(x)=-3$, increasing x by a small 0.01 changes f by about…",
    options: ['+0.03', '−0.03', '−3', '−0.3'],
    answer: 1,
    why: "$\\Delta f\\approx f'(x)\\Delta x=-3\\times0.01=-0.03$.",
  },
}

/* 2. Chain rule */
const chain: Lesson = {
  id: 'chain-rule',
  title: 'The chain rule',
  short: 'Rates multiply through a pipeline',
  formula: '\\frac{dy}{dx}=\\frac{dy}{du}\\cdot\\frac{du}{dx}',
  ml: 'A network is a long composition of functions. Backpropagation is the chain rule applied from the loss back to every weight, multiplying local derivatives along the way.',
  steps: () => {
    const x = 1.2
    const u = x * x
    const y = Math.sin(u)
    const dudx = 2 * x
    const dydu = Math.cos(u)
    const pos: V3[] = [
      [-4.5, 0, 2.2],
      [0, 0, 2.2],
      [4.5, 0, 2.2],
    ]
    const nodes = (lines: string[][], hot = -1): Prim[] => [
      { id: 'e1', k: 'line', pts: [pos[0], pos[1]], color: C.m, w: 2 },
      { id: 'e2', k: 'line', pts: [pos[1], pos[2]], color: C.m, w: 2 },
      { id: 'n0', k: 'node', p: pos[0], title: 'x', lines: lines[0], color: C.a, hot: hot === 0 },
      { id: 'n1', k: 'node', p: pos[1], title: 'u = x²', lines: lines[1], color: C.v, hot: hot === 1 },
      { id: 'n2', k: 'node', p: pos[2], title: 'y = sin(u)', lines: lines[2], color: C.r, hot: hot === 2 },
    ]
    const view = { pos: [0, -11, 4] as V3, target: [0, 0, 2.4] as V3 }
    return [
      {
        title: 'A function made of two machines',
        text: '$y=\\sin(x^2)$ is "square, then take sine". Feed in x = 1.2: the first machine outputs u = 1.44, the second y = sin(1.44).',
        scene: nodes([[`= ${x}`], [`= ${fmt(u, 3)}`], [`= ${fmt(y, 3)}`]]),
        view,
      },
      {
        title: 'Each machine has its own local rate',
        text: `Squaring at 1.2 amplifies small changes: $du/dx=2x=${fmt(dudx, 2)}$. Sine at 1.44 is nearly flat: $dy/du=\\cos u=${fmt(dydu, 3)}$.`,
        tone: 'walk',
        scene: nodes([[`= ${x}`], [`= ${fmt(u, 3)}`, `du/dx = ${fmt(dudx, 2)}`], [`= ${fmt(y, 3)}`, `dy/du = ${fmt(dydu, 3)}`]]),
        view,
      },
      {
        title: 'The overall rate is the product',
        text: `Wiggle x by 0.001: u moves by 0.0024, then y moves by 0.0024 × ${fmt(dydu, 3)}. So $\\frac{dy}{dx}=${fmt(dudx, 2)}\\times${fmt(dydu, 3)}=${fmt(dudx * dydu, 4)}$. Computing this right-to-left, from y back to x, is backpropagation (Experiment 3.5).`,
        tone: 'done',
        scene: [
          ...nodes([[`= ${x}`, `dy/dx = ${fmt(dudx * dydu, 3)}`], [`= ${fmt(u, 3)}`, `dy/du = ${fmt(dydu, 3)}`], [`= ${fmt(y, 3)}`, 'dy/dy = 1']], 0),
          { id: 'b2', k: 'arrow', from: [4.2, 0, 1.6], to: [0.4, 0, 1.6], color: C.b, r: 0.035 },
          { id: 'b1', k: 'arrow', from: [-0.3, 0, 1.6], to: [-4.1, 0, 1.6], color: C.b, r: 0.035 },
        ],
        view,
      },
    ] as Step[]
  },
  check: {
    q: 'If $y=e^{3x}$, what is $dy/dx$?',
    options: ['$e^{3x}$', '$3e^{3x}$', '$3xe^{3x-1}$', '$e^3$'],
    answer: 1,
    why: 'Outer $e^u$ has derivative $e^u$, inner $u=3x$ has derivative 3. Multiply: $3e^{3x}$.',
  },
}

/* 3. Partial derivatives and the gradient */
const gradient: Lesson = {
  id: 'gradient',
  title: 'Partial derivatives & gradient',
  short: 'Slopes in each direction, combined',
  formula: '\\nabla f=\\left(\\frac{\\partial f}{\\partial x},\\frac{\\partial f}{\\partial y}\\right)',
  ml: 'A loss depends on millions of weights. Its gradient is the list of all partial derivatives: one number per weight saying how the loss reacts to that weight alone. The gradient points uphill; training steps the other way.',
  steps: () => {
    const f = (x: number, y: number) => 0.12 * (x * x + 2 * y * y) + 0.3 * x + 0.4
    const fx = (x: number) => 0.24 * x + 0.3
    const fy = (y: number) => 0.48 * y
    const x0 = 1.5
    const y0 = 1.5
    const surf: Prim = { id: 's', k: 'surface', f, range: [-4, 4, -4, 4], color: C.o, opacity: 0.7 }
    const pt: Prim = { id: 'p', k: 'point', p: [x0, y0, f(x0, y0) + 0.08], color: C.r, r: 0.15 }
    const sliceX: Prim = { id: 'sx', k: 'line', pts: linspace(-4, 4, 80).map((x) => [x, y0, f(x, y0) + 0.03] as V3), color: C.a, w: 4 }
    const sliceY: Prim = { id: 'sy', k: 'line', pts: linspace(-4, 4, 80).map((y) => [x0, y, f(x0, y) + 0.03] as V3), color: C.b, w: 4 }
    const tanX: Prim = { id: 'tx', k: 'arrow', from: [x0, y0, f(x0, y0)], to: [x0 + 1.4, y0, f(x0, y0) + 1.4 * fx(x0)], color: C.a, label: `∂f/∂x = ${fmt(fx(x0), 2)}` }
    const tanY: Prim = { id: 'ty', k: 'arrow', from: [x0, y0, f(x0, y0)], to: [x0, y0 + 1.4, f(x0, y0) + 1.4 * fy(y0)], color: C.b, label: `∂f/∂y = ${fmt(fy(y0), 2)}` }
    const g: V3 = [fx(x0), fy(y0), 0]
    const contours: Prim[] = [0.6, 1.2, 2, 3].map((c, i) => {
      // 0.12(x² + 2y²) + 0.3x + 0.4 = c  → ellipse centred at x = −1.25
      const k = (c - 0.4) / 0.12 + 1.5625
      return { id: `c${i}`, k: 'line', pts: linspace(0, 2 * Math.PI, 97).map((t) => [-1.25 + Math.sqrt(k) * Math.cos(t), Math.sqrt(k / 2) * Math.sin(t), 0.03] as V3), color: C.m } as Prim
    })
    const view = { pos: [7, -9, 7] as V3, target: [0, 0, 0.8] as V3 }
    return [
      {
        title: 'A surface: f depends on x and y',
        text: 'A loss with two weights is a landscape. At the red point we want to know how steep it is, but steepness now depends on the direction we walk.',
        scene: [surf, pt],
        view,
      },
      {
        title: 'Hold y fixed: the partial derivative in x',
        text: `Slice the surface along x (blue curve). Its slope at the point is $\\partial f/\\partial x=0.24x+0.3=${fmt(fx(x0), 2)}$. Treat y as a constant and differentiate as usual.`,
        tone: 'walk',
        scene: [surf, pt, sliceX, tanX],
        view,
      },
      {
        title: 'Hold x fixed: the partial derivative in y',
        text: `Now slice along y (pink). $\\partial f/\\partial y=0.48y=${fmt(fy(y0), 2)}$.`,
        tone: 'walk',
        scene: [surf, pt, sliceY, tanY],
        view,
      },
      {
        title: 'Together: the gradient points straight uphill',
        text: `$\\nabla f=(${fmt(g[0], 2)},\\,${fmt(g[1], 2)})$. Drawn on the floor (gold), it is perpendicular to the contour line through the point and points to steepest ascent. $-\\nabla f$ is steepest descent.`,
        tone: 'done',
        scene: [
          { ...surf, opacity: 0.35 } as Prim,
          ...contours,
          { id: 'fp', k: 'point', p: [x0, y0, 0.05], color: C.r, r: 0.12 },
          { id: 'grad', k: 'arrow', from: [x0, y0, 0.05], to: [x0 + g[0] * 3, y0 + g[1] * 3, 0.05], color: C.r, label: '∇f (uphill)' },
          { id: 'neg', k: 'arrow', from: [x0, y0, 0.05], to: [x0 - g[0] * 3, y0 - g[1] * 3, 0.05], color: C.g, label: '−∇f (downhill)' },
        ],
        view: { pos: [0, -5, 11], target: [0, 0, 0] },
      },
    ] as Step[]
  },
  check: {
    q: 'For $f(x,y)=x^2y$, what is $\\nabla f$ at $(1,3)$?',
    options: ['(6, 1)', '(2, 1)', '(3, 1)', '(6, 3)'],
    answer: 0,
    why: '$\\partial f/\\partial x=2xy=6$ and $\\partial f/\\partial y=x^2=1$.',
  },
}

/* 4. Gradient descent and learning rate */
const descent: Lesson = {
  id: 'gradient-descent',
  title: 'Gradient descent & learning rate',
  short: 'Small steps downhill, sized by η',
  formula: 'w_{t+1}=w_t-\\eta\\,\\nabla L(w_t)',
  ml: 'This is the training loop. Every optimiser you will meet (SGD, momentum, RMSProp, Adam) is a variation on this one update; the learning rate is usually the most important hyper-parameter.',
  steps: () => {
    const L = (x: number, y: number) => x * x + 3 * y * y
    const Z = 0.11
    const surf: Prim = { id: 's', k: 'surface', f: (x, y) => L(x, y) * Z, range: [-3.3, 3.3, -3.3, 3.3], color: C.o, opacity: 0.7 }
    const run = (lr: number, n: number): V3[] => {
      let x = 2.6
      let y = 1.4
      const pts: V3[] = [[x, y, L(x, y) * Z + 0.1]]
      for (let i = 0; i < n; i++) {
        x -= lr * 2 * x
        y -= lr * 6 * y
        if (Math.abs(y) > 3.3) break
        pts.push([x, y, L(x, y) * Z + 0.1])
      }
      return pts
    }
    const shot = (lr: number, n: number, title: string, text: string, tone: Step['tone']): Step => {
      const pts = run(lr, n)
      return {
        title,
        text,
        tone,
        scene: [surf, { id: 'path', k: 'line', pts, color: C.w, w: 3 }, { id: 'ball', k: 'point', p: pts[pts.length - 1], color: C.r, r: 0.18 }, { id: 'pts', k: 'cloud', pts, color: C.r, r: 0.07 }],
        view: { pos: [7, -9.5, 8], target: [0, 0, 0.6] },
      }
    }
    return [
      shot(0.1, 0, 'A ball on the loss surface', 'The ball is the current set of weights; its height is the loss. We only ever know the slope right under it.', 'info'),
      shot(0.1, 20, 'η = 0.1: steady progress', 'Each step goes against the gradient, scaled by η. The steps shrink on their own because the slope flattens near the bottom.', 'make'),
      shot(0.015, 20, 'η = 0.015: too timid', 'Same 20 steps, but the ball has barely moved. Training would take far too long.', 'warn'),
      shot(0.31, 20, 'η = 0.31: zig-zag', 'Steps overshoot the narrow direction and bounce from wall to wall. Push η a little higher and the bounces grow until the loss explodes (try it in Experiment 3.2).', 'warn'),
    ]
  },
  check: {
    q: 'The training loss goes up and up every step. What should you try first?',
    options: ['Increase the learning rate', 'Decrease the learning rate', 'Add more layers', 'Train for longer'],
    answer: 1,
    why: 'A loss that grows each step usually means the steps overshoot: the learning rate is too large.',
  },
}

/* 5. Curvature */
const curvature: Lesson = {
  id: 'curvature',
  title: 'Curvature, Hessian, saddles',
  short: 'Second derivatives tell minimum from saddle',
  formula: 'H=\\begin{bmatrix}f_{xx}&f_{xy}\\\\f_{yx}&f_{yy}\\end{bmatrix}',
  ml: "Deep-learning losses are not bowls. They have many saddle points (gradient zero, but not a minimum) and flat regions. The Hessian's eigenvalues tell them apart; Newton's method and the analysis of sharp vs flat minima both use it.",
  steps: () => {
    const view = { pos: [7, -9, 6.5] as V3, target: [0, 0, 0.8] as V3 }
    const s = (id: string, f: (x: number, y: number) => number, color: string): Prim => ({ id: 's', k: 'surface', f, range: [-3, 3, -3, 3], color, opacity: 0.85, seg: 56 })
    const two = (x: number, y: number) => 0.06 * ((x * x - 4) ** 2) + 0.25 * y * y + 0.12 * x + 0.3
    return [
      {
        title: 'Minimum: curves up in every direction',
        text: '$f=0.15(x^2+y^2)$. Gradient zero at the origin, and $H=\\begin{bmatrix}0.3&0\\\\0&0.3\\end{bmatrix}$ has both eigenvalues positive: every direction curves upward. A **convex** bowl like this has only one minimum.',
        scene: [s('a', (x, y) => 0.15 * (x * x + y * y) + 0.2, C.g), { id: 'p', k: 'point', p: [0, 0, 0.3], color: C.r, label: 'minimum' }],
        view,
      },
      {
        title: 'Saddle: up one way, down the other',
        text: '$f=0.15(x^2-y^2)$. The gradient is zero at the origin too, but $H$ has eigenvalues $+0.3$ and $-0.3$. Gradient descent can stall here; in high dimensions most zero-gradient points are saddles, not minima.',
        tone: 'warn',
        scene: [s('a', (x, y) => 0.15 * (x * x - y * y) + 1.6, C.b), { id: 'p', k: 'point', p: [0, 0, 1.72], color: C.r, label: 'saddle point' }],
        view,
      },
      {
        title: 'Non-convex: more than one valley',
        text: 'Two valleys of different depth. Where you start decides which one gradient descent finds: the shallow one is a **local minimum**. Real loss landscapes have many of them, which is one reason random initialisation and momentum matter.',
        tone: 'done',
        scene: [s('a', two, C.v), { id: 'p', k: 'point', p: [-2, 0, two(-2, 0) + 0.12], color: C.g, label: 'global min' }, { id: 'q', k: 'point', p: [2, 0, two(2, 0) + 0.12], color: C.r, label: 'local min' }],
        view,
      },
    ] as Step[]
  },
  check: {
    q: "At a point with $\\nabla f=0$ the Hessian's eigenvalues are 4 and −1. The point is…",
    options: ['a minimum', 'a maximum', 'a saddle point', 'impossible to tell'],
    answer: 2,
    why: 'Mixed signs: the surface curves up along one eigenvector and down along the other.',
  },
}

/* 6. Integrals */
const integral: Lesson = {
  id: 'integral',
  title: 'Integrals as accumulated area',
  short: 'From density to probability',
  formula: '\\int_a^bf(x)\\,dx=F(b)-F(a),\\qquad F\'=f',
  ml: 'Probabilities of continuous variables, expected values $E[g(X)]=\\int g(x)p(x)dx$, and the normalising constants of densities are integrals. The CDF is the running integral of the density.',
  steps: () => {
    const XS = 1.3
    const pdf = (x: number) => normalPdf(x) * 8
    const cdf = (x: number) => normalCdf(x) * 4
    const curve: Prim = { id: 'f', k: 'line', pts: linspace(-3.6, 3.6, 160).map((x) => [x * XS, 0, pdf(x)] as V3), color: C.r, w: 3 }
    const fill = (a: number, b: number): Prim => {
      const n = Math.max(2, Math.round((b - a) * 10))
      const dx = (b - a) / n
      return { id: 'area', k: 'bars', bars: Array.from({ length: n }, (_, i) => ({ x: (a + (i + 0.5) * dx) * XS, h: pdf(a + (i + 0.5) * dx) })), w: dx * XS * 0.98, d: 0.3, color: C.a, opacity: 0.6 }
    }
    const view = { pos: [2, -13, 4.5], target: [0, 0.8, 2] }
    return [
      {
        title: 'The integral is the area under the curve',
        text: `$\\int_{-0.5}^{1.5}\\varphi(x)\\,dx\\approx${fmt(normalCdf(1.5) - normalCdf(-0.5), 4)}$: the blue area. For a density that area is a probability, $P(-0.5<X<1.5)$.`,
        scene: [curve, fill(-0.5, 1.5)],
        view,
      },
      {
        title: 'Accumulate the area as x moves right',
        text: 'Let the right edge slide and record the area so far. That running total is the CDF $\\Phi(x)$ (pink, on the board behind). It climbs fastest where the density is tallest.',
        tone: 'make',
        scene: [curve, fill(-3.6, 0.8), { id: 'F', k: 'line', pts: linspace(-3.6, 0.8, 80).map((x) => [x * XS, 2, cdf(x)] as V3), color: C.b, w: 3 }, { id: 'Fp', k: 'point', p: [0.8 * XS, 2, cdf(0.8)], color: C.b, label: `Φ(0.8) = ${fmt(normalCdf(0.8), 3)}` }],
        view,
      },
      {
        title: 'Derivative and integral undo each other',
        text: "The full CDF rises from 0 to 1. Its slope at every x is the density: $\\Phi'=\\varphi$. So areas can be read as differences of the CDF: $P(a<X<b)=\\Phi(b)-\\Phi(a)$ — the fundamental theorem of calculus.",
        tone: 'done',
        scene: [curve, { id: 'F', k: 'line', pts: linspace(-3.6, 3.6, 160).map((x) => [x * XS, 2, cdf(x)] as V3), color: C.b, w: 3 }, { id: 'one', k: 'line', pts: [[-3.6 * XS, 2, 4], [3.6 * XS, 2, 4]], color: C.m, dashed: true }, { id: 'onel', k: 'label', p: [3.9 * XS, 2, 4], text: '1', color: C.m }],
        view,
      },
    ] as Step[]
  },
  check: {
    q: 'A density p(x) on [0, 2] is constant. What is its value?',
    options: ['1', '2', '0.5', 'any constant'],
    answer: 2,
    why: 'The total area must be 1: height × width = 1, so height = 1/2.',
  },
}

export const LESSONS: Lesson[] = [derivative, chain, gradient, descent, curvature, integral]
