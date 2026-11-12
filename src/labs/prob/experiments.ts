import { betaPdf, binomPmf, clamp, fmt, linspace, normalPdf, rng } from '../../core/math'
import type { Experiment, Prim, Step, V3 } from '../../core/types'

import { C } from '../colors'

const seedParam = (d = 0) => ({ key: 'seed', label: 'Random seed', default: d, min: 0, max: 999 })

/* ------------------------------------------------------------------ 2.1 */
const monteCarloPi: Experiment = {
  id: 'monte-carlo-pi',
  title: 'Monte Carlo estimate of π',
  short: 'Throw darts, count, multiply by 4',
  file: 'lab2_probability/exp1_monte_carlo_pi.py',
  aim: 'To estimate π by throwing random points at a square and counting the fraction that land inside the inscribed circle, and to watch the error shrink as the number of throws grows.',
  apparatus: ['Python 3 with NumPy', 'A 2×2 square with a unit circle inside it', 'A uniform random number generator (`rng.uniform`)'],
  theory: `A dart landing uniformly in the square falls inside the circle with probability
$$P(\\text{inside})=\\frac{\\text{circle area}}{\\text{square area}}=\\frac{\\pi\\cdot1^2}{2^2}=\\frac{\\pi}{4}$$
So $\\pi\\approx4\\cdot\\frac{\\text{inside}}{n}$. By the law of large numbers the fraction converges to $\\pi/4$; its error shrinks like $1/\\sqrt{n}$: 100 times more darts buy one more correct digit.`,
  ml: 'Monte Carlo is how ML estimates quantities it cannot compute exactly: the expected loss is estimated with a mini-batch, dropout averages random sub-networks, reinforcement learning averages sampled returns, and Bayesian deep learning averages over sampled weights.',
  params: [
    seedParam(0),
    {
      key: 'N',
      label: 'Total darts',
      default: 5000,
      options: [
        { value: 1000, label: '1 000' },
        { value: 5000, label: '5 000' },
        { value: 20000, label: '20 000' },
      ],
    },
  ],
  columns: ['n', 'inside', 'π ≈ 4·inside/n', '|error|'],
  run: (p) => {
    const S = 3
    const r = rng(p.seed)
    const pts: V3[] = []
    const cols: string[] = []
    let inside = 0
    const square: V3[] = [
      [-S, -S, 0.02],
      [S, -S, 0.02],
      [S, S, 0.02],
      [-S, S, 0.02],
      [-S, -S, 0.02],
    ]
    const circle: V3[] = linspace(0, 2 * Math.PI, 121).map((t) => [S * Math.cos(t), S * Math.sin(t), 0.03])
    const conv: V3[] = []
    const X = (n: number) => -S + Math.log10(n) * 1.45
    const Z = (est: number) => 0.4 + clamp((est - 2.2) * 2, 0, 4.5)
    const wall = (): Prim[] => [
      { id: 'pi', k: 'line', pts: [[X(1), 4.2, Z(Math.PI)], [X(p.N), 4.2, Z(Math.PI)]], color: C.g, dashed: true },
      { id: 'pil', k: 'label', p: [X(p.N) + 0.6, 4.2, Z(Math.PI)], text: 'π', color: C.g, size: 'md' },
      { id: 'conv', k: 'line', pts: conv.length > 1 ? [...conv] : [], color: C.r, w: 2.5 },
      { id: 'wl', k: 'label', p: [X(1), 4.2, 5.4], text: 'estimate vs log₁₀ n', color: C.m },
    ]
    const base = (): Prim[] => [
      { id: 'sq', k: 'line', pts: square, color: C.w, w: 2 },
      { id: 'circ', k: 'line', pts: circle, color: C.g, w: 2 },
      { id: 'darts', k: 'cloud', pts: [...pts], color: [...cols], r: pts.length > 3000 ? 0.035 : pts.length > 500 ? 0.05 : 0.09, drop: true },
      ...wall(),
    ]
    const legend: [string, string][] = [
      [C.g, 'inside the circle'],
      [C.b, 'outside'],
      [C.r, 'running estimate'],
    ]
    const view = { pos: [0, -10, 10] as V3, target: [0, 0.8, 0.8] as V3 }
    const steps: Step[] = [
      {
        title: 'A square with a circle inside',
        text: 'The square runs from −1 to 1 on both axes (drawn 3× bigger), so its area is 4. The circle of radius 1 has area π. Random darts will tell us the ratio of the two areas.',
        line: 'def estimate_pi(n, seed=0):',
        scene: base(),
        view,
        legend,
      },
    ]
    const throwOne = () => {
      const x = r.uniform() * 2 - 1
      const y = r.uniform() * 2 - 1
      const ins = x * x + y * y <= 1
      if (ins) inside++
      pts.push([x * S, y * S, 0.1])
      cols.push(ins ? C.g : C.b)
      return { x, y, ins }
    }
    const record = () => {
      const n = pts.length
      const est = (4 * inside) / n
      conv.push([X(n), 4.2, Z(est)])
      return est
    }
    for (let i = 0; i < 5; i++) {
      const d = throwOne()
      const est = record()
      steps.push({
        title: `Dart ${i + 1} lands at (${fmt(d.x, 2)}, ${fmt(d.y, 2)})`,
        text: `$x^2+y^2=${fmt(d.x * d.x + d.y * d.y, 3)}$ ${d.ins ? '≤ 1, so it is **inside** and `inside` grows.' : '> 1, so it is **outside**.'} Estimate so far: $4\\cdot${inside}/${i + 1}=${fmt(est, 3)}$. Very rough, as expected.`,
        line: d.ins ? 'inside += 1' : 'if x * x + y * y <= 1.0:',
        tone: 'walk',
        scene: base(),
        view,
        vars: [
          ['x, y', `${fmt(d.x, 3)}, ${fmt(d.y, 3)}`],
          ['inside', String(inside)],
          ['n so far', String(i + 1)],
        ],
        row: [i + 1, inside, fmt(est, 4), fmt(Math.abs(est - Math.PI), 4)],
        legend,
      })
    }
    for (const target of [20, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000].filter((n) => n <= p.N)) {
      while (pts.length < target) {
        throwOne()
        if ([10, 30, 75, 175, 375, 750, 1750, 3750, 7500, 15000].includes(pts.length)) record()
      }
      const est = record()
      steps.push({
        title: `n = ${target.toLocaleString()}: π ≈ ${fmt(est, 4)}`,
        text: `${inside.toLocaleString()} of ${target.toLocaleString()} darts are inside. The gold line on the back wall is the running estimate; it wobbles less and less around the green π line. Typical error $\\approx 1.64/\\sqrt{n}=${fmt(1.64 / Math.sqrt(target), 3)}$.`,
        line: 'return 4 * inside / n',
        tone: target === p.N ? 'done' : 'make',
        scene: base(),
        view,
        vars: [
          ['n', String(target)],
          ['inside', String(inside)],
          ['estimate', fmt(est, 5)],
        ],
        row: [target, inside, fmt(est, 4), fmt(Math.abs(est - Math.PI), 4)],
        legend,
      })
    }
    return steps
  },
  result: 'The estimate converges to π, but slowly: the error falls like $1/\\sqrt{n}$. Monte Carlo trades exactness for generality: it works for any region you can test points against, in any number of dimensions.',
  viva: [
    { q: 'Why does the error shrink like $1/\\sqrt n$?', a: 'Each dart is a Bernoulli trial with $p=\\pi/4$. The fraction has standard deviation $\\sqrt{p(1-p)/n}$, so 4× the fraction has standard deviation about $1.64/\\sqrt n$.' },
    { q: 'How many darts for 3 correct decimals (error ≈ 0.0005)?', a: 'Solve $1.64/\\sqrt n=0.0005$: about $10^7$ darts. Monte Carlo is a poor way to get π, but a great way to get integrals nothing else can.' },
    { q: 'Why does Monte Carlo not get harder in high dimensions?', a: 'The $1/\\sqrt n$ rate does not depend on the dimension, while grid-based integration needs exponentially many points.' },
    { q: 'Where does this idea appear in training neural networks?', a: 'Stochastic gradient descent estimates the full-dataset gradient with a random mini-batch: a Monte Carlo average.' },
  ],
}

/* ------------------------------------------------------------------ 2.2 */
const inverseTransform: Experiment = {
  id: 'inverse-transform',
  title: 'Inverse transform sampling',
  short: 'Uniform numbers in, any distribution out',
  file: 'lab2_probability/exp2_inverse_transform.py',
  aim: 'To turn uniform random numbers into exponentially distributed ones by passing them through the inverse of the CDF, and to check the histogram against the density.',
  apparatus: ['Python 3 with NumPy', 'The exponential CDF $F(x)=1-e^{-\\lambda x}$ on the back wall', 'A histogram on the bench'],
  theory: `If $U\\sim\\text{Uniform}(0,1)$ and $F$ is a CDF, then $X=F^{-1}(U)$ has CDF $F$. For the exponential,
$$u=1-e^{-\\lambda x}\\;\\Rightarrow\\;x=-\\frac{\\ln(1-u)}{\\lambda}$$
Pick a random height on the CDF, walk across to the curve, drop down: that is a sample. Where the CDF is steep, many heights map to a small range of x, so samples pile up there.`,
  ml: 'Every random number in ML starts as a uniform one. Inverse-CDF sampling (and its cousins) generate initial weights, dropout masks, data augmentations and the next token a language model emits.',
  params: [
    {
      key: 'lam',
      label: 'Rate λ',
      default: 1.5,
      options: [0.5, 1, 1.5, 2, 3].map((v) => ({ value: v, label: String(v) })),
    },
    seedParam(1),
  ],
  columns: ['n', 'sample mean', 'theory 1/λ', 'sample var', 'theory 1/λ²'],
  run: (p) => {
    const lam = p.lam
    const xmax = Math.max(5, 5 / lam)
    const X = (x: number) => -5 + (10 * x) / xmax
    const ZF = (u: number) => 0.3 + 3.6 * u
    const W = 2.2
    const F = (x: number) => 1 - Math.exp(-lam * x)
    const r = rng(p.seed)
    const samples: number[] = []
    const nb = 20
    const bw = xmax / nb
    const hs = 2.4 / lam
    const cdf: V3[] = linspace(0, xmax, 120).map((x) => [X(x), W, ZF(F(x))])
    const pdf: V3[] = linspace(0, xmax, 120).map((x) => [X(x), -1.2, lam * Math.exp(-lam * x) * hs])
    const hist = (): Prim => {
      const counts = new Array(nb).fill(0)
      for (const s of samples) if (s < xmax) counts[Math.floor(s / bw)]++
      return {
        id: 'hist',
        k: 'bars',
        bars: counts.map((c, i) => ({ x: X((i + 0.5) * bw), y: -1.2, h: samples.length ? (c / (samples.length * bw)) * hs : 0 })),
        w: (10 / nb) * 0.9,
        d: 0.7,
        color: C.a,
        opacity: 0.85,
      }
    }
    const base = (): Prim[] => [
      { id: 'cdf', k: 'line', pts: cdf, color: C.r, w: 3 },
      { id: 'cdfl', k: 'label', p: [X(xmax * 0.8), W, ZF(1) + 0.4], text: `CDF  F(x) = 1 − e^(−${lam}x)`, color: C.r },
      { id: 'uax', k: 'line', pts: [[-5, W, ZF(0)], [-5, W, ZF(1)]], color: C.w },
      { id: 'u0', k: 'label', p: [-5.5, W, ZF(0)], text: 'u=0', color: C.m },
      { id: 'u1', k: 'label', p: [-5.5, W, ZF(1)], text: 'u=1', color: C.m },
      { id: 'xax', k: 'line', pts: [[-5, -1.2, 0.02], [5, -1.2, 0.02]], color: C.w },
      hist(),
    ]
    const stats = () => {
      const n = samples.length
      const m = samples.reduce((s, x) => s + x, 0) / n
      const v = samples.reduce((s, x) => s + (x - m) ** 2, 0) / n
      return [n, fmt(m, 4), fmt(1 / lam, 4), fmt(v, 4), fmt(1 / lam ** 2, 4)] as (string | number)[]
    }
    const view = { pos: [0, -12.5, 6.5] as V3, target: [0, 0.4, 1.8] as V3 }
    const legend: [string, string][] = [
      [C.r, 'CDF on the back wall'],
      [C.o, 'u → x'],
      [C.a, 'histogram of samples'],
      [C.b, 'true density'],
    ]
    const steps: Step[] = [
      {
        title: 'The CDF maps x to a height between 0 and 1',
        text: `The gold curve on the back wall is $F(x)=P(X\\le x)$ for an exponential with rate λ = ${lam}. It climbs fast at first: small values are common. The histogram on the bench is empty for now.`,
        line: 'def sample_exponential(lam, n, seed=0):',
        scene: base(),
        view,
        legend,
      },
    ]
    for (let i = 0; i < 5; i++) {
      const u = r.uniform()
      const x = -Math.log(1 - u) / lam
      steps.push({
        title: `Sample ${i + 1}: u = ${fmt(u, 3)}`,
        text: `Pick a uniform height u = ${fmt(u, 3)} on the left axis (any height is equally likely).`,
        line: 'u = rng.uniform()',
        tone: 'walk',
        scene: [...base(), { id: 'u', k: 'point', p: [-5, W, ZF(u)], color: C.o, label: `u = ${fmt(u, 2)}` }],
        view,
        vars: [['u', fmt(u, 4)]],
        legend,
      })
      samples.push(x)
      const xs = Math.min(x, xmax)
      steps.push({
        title: `…walk across to the curve and drop: x = ${fmt(x, 3)}`,
        text: `Solve $F(x)=u$: $x=-\\ln(1-${fmt(u, 3)})/${lam}=${fmt(x, 3)}$. The dashed path goes across to the CDF and straight down. ${i === 0 ? 'Notice how a wide band of heights near the bottom all drop onto a narrow range of small x.' : ''}`,
        line: 'x = -np.log(1.0 - u) / lam',
        tone: 'make',
        scene: [
          ...base(),
          { id: 'u', k: 'point', p: [-5, W, ZF(u)], color: C.o, label: `u = ${fmt(u, 2)}` },
          { id: 'path', k: 'line', pts: [[-5, W, ZF(u)], [X(xs), W, ZF(u)], [X(xs), W, 0.05], [X(xs), -1.2, 0.05]], color: C.o, dashed: true },
          { id: 'x', k: 'point', p: [X(xs), -1.2, 0.1], color: C.o, label: `x = ${fmt(x, 2)}` },
        ],
        view,
        vars: [
          ['u', fmt(u, 4)],
          ['x', fmt(x, 4)],
        ],
        row: stats(),
        legend,
      })
    }
    for (const target of [50, 200, 1000, 5000, 20000]) {
      while (samples.length < target) samples.push(-Math.log(1 - r.uniform()) / lam)
      steps.push({
        title: `n = ${target.toLocaleString()} samples`,
        text: `The histogram (blue, scaled as a density) takes the shape of the exponential: tall near 0, a long thin tail. Sample mean ${stats()[1]} vs theory $1/\\lambda=${fmt(1 / lam, 3)}$.`,
        line: 'samples.append(x)',
        tone: 'make',
        scene: base(),
        view,
        row: stats(),
        legend,
      })
    }
    steps.push({
      title: 'The histogram matches the density λe^(−λx)',
      text: 'The pink curve is the true density. The samples follow it, so the method works: uniform numbers in, exponential numbers out. The same recipe works for any distribution whose CDF you can invert.',
      line: 'return np.array(samples)',
      tone: 'done',
      scene: [...base(), { id: 'pdf', k: 'line', pts: pdf, color: C.b, w: 3 }],
      view,
      legend,
    })
    return steps
  },
  result: 'Passing uniform numbers through $F^{-1}$ produced samples whose histogram matches $\\lambda e^{-\\lambda x}$ and whose mean and variance match $1/\\lambda$ and $1/\\lambda^2$.',
  viva: [
    { q: 'Why does $1-U$ have the same distribution as $U$?', a: 'Uniform(0,1) is symmetric about 1/2, so $x=-\\ln(U)/\\lambda$ works just as well. The code uses $1-u$ to avoid $\\ln 0$ because `uniform()` can return exactly 0.' },
    { q: 'What do you do if $F^{-1}$ has no closed form, as for the normal?', a: 'Use a special trick (Box–Muller for normals), a numerical inverse, or rejection sampling.' },
    { q: 'How do you sample a discrete distribution this way?', a: 'Build the cumulative sums of the probabilities and find the first bucket whose cumulative value exceeds u (`np.searchsorted`).' },
    { q: 'What does the exponential distribution model?', a: 'Waiting times between independent random events at a constant rate λ, for example time between requests to a server.' },
  ],
}

/* ------------------------------------------------------------------ 2.3 */
const galton: Experiment = {
  id: 'galton-board',
  title: 'Galton board → binomial',
  short: 'Many left/right bounces make a bell',
  file: 'lab2_probability/exp3_galton_binomial.py',
  aim: 'To simulate balls bouncing through rows of pegs, and to show that the bin counts follow the binomial distribution $\\text{Bin}(n,p)$.',
  apparatus: ['Python 3 with NumPy', 'A Galton board lying on the bench: n rows of pegs', 'Bins at the near end with 3D bars for the counts'],
  theory: `At each peg the ball goes right with probability p: one Bernoulli trial. After n rows the bin number k is the number of right bounces, so
$$P(K=k)=\\binom nk p^k(1-p)^{n-k}$$
The $\\binom nk$ counts the different paths that reach bin k. Middle bins have the most paths, which is why the pile is bell-shaped.`,
  ml: 'Binomial counts are everywhere: correct predictions out of n test examples (and the error bars on accuracy), clicks out of n impressions in A/B tests, and the number of units kept by dropout.',
  params: [
    { key: 'n', label: 'Rows of pegs', default: 8, options: [6, 8, 10].map((v) => ({ value: v, label: String(v) })) },
    { key: 'p', label: 'P(bounce right)', default: 0.5, options: [0.3, 0.5, 0.7].map((v) => ({ value: v, label: String(v) })) },
    seedParam(2),
  ],
  columns: ['balls', 'mean bin (sim)', 'np', 'variance (sim)', 'np(1−p)'],
  run: (p) => {
    const n = p.n
    const pr = p.p
    const r = rng(p.seed)
    const dx = 0.62
    const dy = 0.62
    const Y0 = 3.8
    const pegY = (row: number) => Y0 - row * dy
    const binY = pegY(n) - 0.5
    const pegX = (row: number, k: number) => (k - row / 2) * dx
    const pegs: V3[] = []
    for (let row = 0; row < n; row++) for (let k = 0; k <= row; k++) pegs.push([pegX(row, k), pegY(row), 0.12])
    const bins = new Array(n + 1).fill(0)
    let balls = 0
    const H = 3.2
    const bars = (): Prim => {
      const mx = Math.max(1, ...bins)
      return { id: 'bins', k: 'bars', bars: bins.map((c, k) => ({ x: pegX(n, k), y: binY, h: (c / mx) * H })), w: dx * 0.8, d: 0.55, color: C.a, opacity: 0.88 }
    }
    const base = (): Prim[] => [
      { id: 'pegs', k: 'cloud', pts: pegs, color: C.m, r: 0.07 },
      bars(),
      { id: 'top', k: 'point', p: [0, Y0 + 0.6, 0.15], color: C.w, r: 0.1, label: 'drop' },
    ]
    const stats = () => {
      const m = bins.reduce((s, c, k) => s + c * k, 0) / balls
      const v = bins.reduce((s, c, k) => s + c * (k - m) ** 2, 0) / balls
      return [balls, fmt(m, 3), fmt(n * pr, 3), fmt(v, 3), fmt(n * pr * (1 - pr), 3)] as (string | number)[]
    }
    const drop = () => {
      let k = 0
      const path: V3[] = [[0, Y0 + 0.6, 0.15]]
      const moves: string[] = []
      for (let row = 0; row < n; row++) {
        path.push([pegX(row, k), pegY(row) + 0.25, 0.15])
        if (r.uniform() < pr) {
          k++
          moves.push('R')
        } else moves.push('L')
      }
      path.push([pegX(n, k), binY, 0.15])
      bins[k]++
      balls++
      return { k, path, moves }
    }
    const view = { pos: [0, -11.5, 9.5] as V3, target: [0, 0.2, 0.6] as V3 }
    const legend: [string, string][] = [
      [C.a, 'simulated counts'],
      [C.r, 'binomial prediction'],
      [C.o, 'one ball\'s path'],
    ]
    const steps: Step[] = [
      {
        title: `A board with ${n} rows of pegs`,
        text: `A ball enters at the top and meets one peg per row. Each time it goes right with probability ${pr} and left otherwise. The bin it lands in (0 to ${n}, left to right) counts its right bounces.`,
        line: 'def galton(n_rows, n_balls, p=0.5, seed=0):',
        scene: base(),
        view,
        legend,
      },
    ]
    for (let i = 0; i < 3; i++) {
      const d = drop()
      steps.push({
        title: `Ball ${i + 1}: ${d.moves.join(' ')} → bin ${d.k}`,
        text: `${d.moves.length} independent coin flips with P(R) = ${pr}. ${d.moves.filter((m) => m === 'R').length} rights, so it lands in bin ${d.k}. The order of the bounces does not matter, only how many were right.`,
        line: 'if rng.uniform() < p:',
        tone: 'walk',
        scene: [...base(), { id: 'path', k: 'line', pts: d.path, color: C.o, w: 3 }, { id: 'ball', k: 'point', p: d.path[d.path.length - 1], color: C.o, r: 0.16 }],
        view,
        vars: [
          ['k', String(d.k)],
          ['bins', `[${bins.join(', ')}]`],
        ],
        row: stats(),
        legend,
      })
    }
    for (const target of [20, 100, 500, 2000, 10000]) {
      let last = drop()
      while (balls < target) last = drop()
      steps.push({
        title: `${target.toLocaleString()} balls`,
        text: `Bars are scaled so the tallest is the same height. ${target >= 500 ? 'The shape has settled: the middle bins win because far more paths lead there.' : 'The shape is still noisy.'} Mean bin ${stats()[1]} vs $np=${fmt(n * pr, 2)}$.`,
        line: 'bins[k] += 1',
        tone: 'make',
        scene: [...base(), { id: 'path', k: 'line', pts: last.path, color: C.o, w: 2, opacity: 0.6 }],
        view,
        vars: [['bins', `[${bins.join(', ')}]`]],
        row: stats(),
        legend,
      })
    }
    const mx = Math.max(...bins)
    const pmf = Array.from({ length: n + 1 }, (_, k) => binomPmf(n, k, pr))
    const theo: V3[] = pmf.map((q, k) => [pegX(n, k), binY - 0.35, ((q * balls) / mx) * H])
    steps.push({
      title: 'The counts match the binomial formula',
      text: `Gold dots: $\\binom{${n}}{k}${pr}^k(1-${pr})^{${n}-k}$ times the number of balls. Simulation and formula agree. Change p under Inputs: the pile shifts and becomes lopsided, but it is still binomial.`,
      line: 'return comb(n, k) * p**k * (1 - p) ** (n - k)',
      tone: 'done',
      scene: [...base(), { id: 'theo', k: 'cloud', pts: theo, color: C.r, r: 0.12 }, { id: 'theol', k: 'line', pts: theo, color: C.r, w: 2 }],
      view,
      vars: pmf.map((q, k) => [`P(K=${k})`, fmt(q, 4)] as [string, string]).slice(0, 6),
      legend,
    })
    return steps
  },
  result: 'After many balls the bin frequencies match $\\binom nk p^k(1-p)^{n-k}$, the mean is close to $np$ and the variance close to $np(1-p)$. Many independent small choices add up to a bell shape.',
  viva: [
    { q: 'Why does the order of bounces not matter?', a: 'The final bin depends only on the number of right bounces. Every path with k rights has the same probability $p^k(1-p)^{n-k}$, and there are $\\binom nk$ such paths.' },
    { q: 'What happens as the number of rows grows?', a: 'The binomial approaches a normal curve with mean $np$ and variance $np(1-p)$: an early example of the central limit theorem.' },
    { q: 'What are the mean and variance of one Bernoulli(p) bounce?', a: 'Mean $p$, variance $p(1-p)$. The bin is a sum of n of them, so mean $np$ and variance $np(1-p)$.' },
    { q: 'A model gets 87 of 100 test examples right. How uncertain is "87%"?', a: 'The count is roughly binomial, so the standard error is $\\sqrt{0.87\\cdot0.13/100}\\approx0.034$: about ±3.4 percentage points.' },
  ],
}

/* ------------------------------------------------------------------ 2.4 */
const clt: Experiment = {
  id: 'central-limit',
  title: 'Central limit theorem',
  short: 'Averages of dice become a bell curve',
  file: 'lab2_probability/exp4_central_limit.py',
  aim: 'To show that the average of n dice rolls becomes normally distributed as n grows, with spread shrinking like $\\sigma/\\sqrt n$, even though one die is flat.',
  apparatus: ['Python 3 with NumPy', 'Fair six-sided dice', 'Four histograms on the bench, one per n'],
  theory: `One die has mean $\\mu=3.5$ and variance $\\sigma^2=35/12$. The average of n independent dice has the same mean and variance $\\sigma^2/n$. The central limit theorem says more: whatever the shape of one roll, the average tends to
$$\\bar X_n\\approx\\mathcal N\\!\\left(\\mu,\\;\\frac{\\sigma^2}{n}\\right)$$`,
  ml: 'This is why Gaussians are everywhere: errors made of many small causes are roughly normal (the assumption behind MSE loss), mini-batch gradients are roughly normal around the true gradient, and confidence intervals for accuracy use the normal approximation.',
  params: [
    { key: 'trials', label: 'Averages per row', default: 4000, options: [500, 4000, 20000].map((v) => ({ value: v, label: v.toLocaleString() })) },
    seedParam(3),
  ],
  columns: ['n dice', 'mean of averages', 'std (sim)', 'σ/√n'],
  run: (p) => {
    const r = rng(p.seed)
    const ns = [1, 2, 5, 30]
    const rowsY = [3.3, 1.1, -1.1, -3.3]
    const X = (m: number) => (m - 3.5) * 1.75
    const nb = 20
    const bw = 5 / nb
    const hs = 1.5
    const sd1 = Math.sqrt(35 / 12)
    const built: Prim[] = []
    const steps: Step[] = []
    const view = { pos: [7, -12, 8] as V3, target: [0, 0, 0.8] as V3 }
    const legend: [string, string][] = [
      [C.a, 'n = 1'],
      [C.v, 'n = 2'],
      [C.b, 'n = 5'],
      [C.r, 'n = 30'],
      [C.g, 'normal curve'],
    ]
    const cols = [C.a, C.v, C.b, C.r]
    const labels: Prim[] = ns.map((n, i) => ({ id: `nl${i}`, k: 'label', p: [-5.6, rowsY[i], 0.4], text: `n = ${n}`, color: cols[i], size: 'md' }) as Prim)
    steps.push({
      title: 'One die is flat, not bell-shaped',
      text: 'Each face 1–6 has probability 1/6. Mean 3.5, standard deviation 1.71. We will average n dice, repeat that thousands of times, and look at the histogram of the averages for n = 1, 2, 5 and 30.',
      line: 'def sample_means(n, trials, seed=0):',
      scene: labels,
      view,
      legend,
    })
    const curves: Prim[] = []
    ns.forEach((n, i) => {
      const means: number[] = []
      let example: number[] = []
      for (let t = 0; t < p.trials; t++) {
        let s = 0
        const rolls: number[] = []
        for (let j = 0; j < n; j++) {
          const v = r.int(1, 7)
          s += v
          if (t === 0) rolls.push(v)
        }
        if (t === 0) example = rolls
        means.push(s / n)
      }
      const counts = new Array(nb).fill(0)
      for (const m of means) counts[Math.min(nb - 1, Math.floor((m - 1) / bw))]++
      built.push({ id: `h${i}`, k: 'bars', bars: counts.map((c, b) => ({ x: X(1 + (b + 0.5) * bw), y: rowsY[i], h: (c / (p.trials * bw)) * hs })), w: 1.75 * bw * 0.9, d: 1.2, color: cols[i], opacity: 0.85 })
      const mu = means.reduce((a, b) => a + b, 0) / means.length
      const sd = Math.sqrt(means.reduce((a, b) => a + (b - mu) ** 2, 0) / means.length)
      const sdT = sd1 / Math.sqrt(n)
      curves.push({ id: `c${i}`, k: 'line', pts: linspace(1, 6, 140).map((m) => [X(m), rowsY[i] - 0.65, normalPdf(m, 3.5, sdT) * hs] as V3), color: C.g, w: 2.5 })
      steps.push({
        title: `n = ${n}: average ${n} dice, ${p.trials.toLocaleString()} times`,
        text: `First trial: rolls [${example.slice(0, 10).join(', ')}${n > 10 ? ', …' : ''}] → mean ${fmt(example.reduce((a, b) => a + b, 0) / n, 2)}. ${
          n === 1 ? 'With one die the histogram is flat.' : n === 2 ? 'Two dice already make a triangle: 7 is the most common sum.' : n === 5 ? 'Five dice: clearly a bell, and narrower.' : 'Thirty dice: a tight, smooth bell around 3.5.'
        } Spread ${fmt(sd, 3)} vs theory $\\sigma/\\sqrt{${n}}=${fmt(sdT, 3)}$.`,
        line: 'means[t] = rolls.mean()',
        tone: 'make',
        scene: [...labels, ...built],
        view,
        vars: [
          ['n', String(n)],
          ['means.mean()', fmt(mu, 4)],
          ['means.std()', fmt(sd, 4)],
        ],
        row: [n, fmt(mu, 3), fmt(sd, 3), fmt(sdT, 3)],
        legend,
      })
    })
    steps.push({
      title: 'Every row approaches a normal curve',
      text: 'The green curves are $\\mathcal N(3.5,\\,\\sigma^2/n)$. For n = 1 the fit is bad (a die is not normal), for n = 30 it is almost perfect. The width halves every time n is multiplied by 4.',
      line: 'return means',
      tone: 'done',
      scene: [...labels, ...built, ...curves],
      view,
      legend,
    })
    return steps
  },
  result: 'The averages stay centred on 3.5, their spread matches $\\sigma/\\sqrt n$, and their histogram becomes normal as n grows, although a single die is uniform.',
  viva: [
    { q: 'Does the CLT need the original distribution to be normal?', a: 'No. It needs independent, identically distributed values with finite variance. The die here is uniform.' },
    { q: 'Why does the spread shrink like $1/\\sqrt n$ and not $1/n$?', a: 'Variances of independent values add: $\\mathrm{Var}(\\sum X_i)=n\\sigma^2$. Dividing the sum by n divides the variance by $n^2$, leaving $\\sigma^2/n$, so the standard deviation is $\\sigma/\\sqrt n$.' },
    { q: 'What does this say about mini-batch size?', a: 'A mini-batch gradient is an average. Its noise shrinks like $1/\\sqrt{B}$: 4× the batch only halves the noise.' },
    { q: 'Name a case where the CLT fails.', a: 'Heavy-tailed distributions with infinite variance, such as the Cauchy: the average of Cauchy values is again Cauchy, no matter how many.' },
  ],
}

/* ------------------------------------------------------------------ 2.5 */
const DATA = [4.1, 5.3, 3.6, 4.8, 6.0, 4.4, 5.1, 3.9]
const mle: Experiment = {
  id: 'mle-gaussian',
  title: 'Maximum likelihood',
  short: 'Fit a Gaussian; climb the likelihood hill',
  file: 'lab2_probability/exp5_mle_gaussian.py',
  aim: 'To fit a normal distribution to data by maximum likelihood, and to see the log-likelihood as a surface over $(\\mu,\\sigma)$ whose peak is the estimate.',
  apparatus: ['Python 3 with NumPy', '8 measurements (on the back wall)', 'The log-likelihood surface over $(\\mu,\\sigma)$ on the bench'],
  theory: `The likelihood of parameters is the probability density of the observed data under them:
$$\\log L(\\mu,\\sigma^2)=-\\frac n2\\log(2\\pi\\sigma^2)-\\frac{1}{2\\sigma^2}\\sum_i(x_i-\\mu)^2$$
Setting the derivatives to zero gives $\\hat\\mu=\\bar x$ and $\\hat\\sigma^2=\\frac1n\\sum(x_i-\\bar x)^2$.`,
  ml: 'Training is maximum likelihood. Minimising mean squared error is MLE under Gaussian noise; minimising cross-entropy is MLE for a classifier. "Loss = negative log-likelihood" is the bridge from probability to deep learning.',
  columns: ['guess', 'μ', 'σ²', 'log-likelihood'],
  run: () => {
    const x = DATA
    const n = x.length
    const mu = x.reduce((a, b) => a + b, 0) / n
    const v = x.reduce((a, b) => a + (b - mu) ** 2, 0) / n
    const ll = (m: number, s2: number) => -0.5 * n * Math.log(2 * Math.PI * s2) - x.reduce((a, b) => a + (b - m) ** 2, 0) / (2 * s2)
    const best = ll(mu, v)
    const WY = 3.4
    const XD = (d: number) => (d - mu) * 2.2
    const bell = (m: number, s2: number): V3[] => linspace(2.7, 6.6, 120).map((d) => [XD(d), WY, 0.3 + normalPdf(d, m, Math.sqrt(s2)) * 4.2])
    const SX = (m: number) => (m - mu) * 3.8
    const SY = (s: number) => -4.6 + ((s - 0.35) / 1.05) * 4.4
    const SZ = (l: number) => clamp(((l + 24) / (best + 24)) * 2.6, 0, 2.6)
    const surfF = (X: number, Y: number) => {
      const m = mu + X / 3.8
      const s = 0.35 + ((Y + 4.6) / 4.4) * 1.05
      return SZ(ll(m, s * s))
    }
    const surface: Prim = { id: 'll', k: 'surface', f: surfF, range: [-4, 4, -4.6, -0.2], color: C.b, opacity: 0.85, seg: 56 }
    const dataPts: Prim = { id: 'data', k: 'cloud', pts: x.map((d) => [XD(d), WY, 0.3] as V3), color: C.a, r: 0.14 }
    const axis: Prim = { id: 'ax', k: 'line', pts: [[XD(2.7), WY, 0.3], [XD(6.6), WY, 0.3]], color: C.w }
    const sAt = (m: number, s2: number): V3 => [SX(m), SY(Math.sqrt(s2)), SZ(ll(m, s2)) + 0.12]
    const view = { pos: [0, -12, 8] as V3, target: [0, 0, 1.4] as V3 }
    const legend: [string, string][] = [
      [C.a, 'data'],
      [C.r, 'MLE fit'],
      [C.m, 'a worse guess'],
      [C.b, 'log-likelihood surface'],
    ]
    const steps: Step[] = [
      {
        title: '8 measurements on the back wall',
        text: `Data: ${x.join(', ')}. We assume they came from some normal distribution $\\mathcal N(\\mu,\\sigma^2)$ and ask: which $\\mu$ and $\\sigma$ make this data most probable?`,
        line: 'def fit_gaussian(x):',
        scene: [axis, dataPts],
        view,
        legend,
      },
      {
        title: `μ̂ = sample mean = ${fmt(mu, 4)}`,
        text: 'Add up all 8 values and divide by 8. Setting $\\partial\\log L/\\partial\\mu=0$ gives exactly this: the MLE of the mean is the average.',
        line: 'mu = mu / n',
        tone: 'make',
        scene: [axis, dataPts, { id: 'mu', k: 'line', pts: [[XD(mu), WY, 0.3], [XD(mu), WY, 2.4]], color: C.r, w: 3 }, { id: 'mul', k: 'label', p: [XD(mu), WY, 2.7], text: `μ̂ = ${fmt(mu, 2)}`, color: C.r }],
        view,
        vars: [['mu', fmt(mu, 4)]],
        legend,
      },
      {
        title: 'Squared distances from the mean',
        text: 'Each square has side $|x_i-\\hat\\mu|$, so its area is $(x_i-\\hat\\mu)^2$. Far points make big squares. The variance is the average area.',
        line: 'var += (xi - mu) ** 2',
        tone: 'walk',
        scene: [
          axis,
          dataPts,
          { id: 'mu', k: 'line', pts: [[XD(mu), WY, 0.3], [XD(mu), WY, 2.4]], color: C.r, w: 3 },
          ...x.map(
            (d, i) =>
              ({
                id: `sq${i}`,
                k: 'line',
                pts: [
                  [XD(mu), WY - 0.02 * i, 0.3],
                  [XD(d), WY - 0.02 * i, 0.3],
                  [XD(d), WY - 0.02 * i, 0.3 + Math.abs(XD(d) - XD(mu))],
                  [XD(mu), WY - 0.02 * i, 0.3 + Math.abs(XD(d) - XD(mu))],
                  [XD(mu), WY - 0.02 * i, 0.3],
                ],
                color: C.o,
                opacity: 0.7,
              }) as Prim,
          ),
        ],
        view,
        vars: [['sum of squares', fmt(v * n, 4)]],
        legend,
      },
      {
        title: `σ̂² = ${fmt(v, 4)}  (divide by n)`,
        text: `The MLE divides by $n=8$, not $n-1$. The fitted bell $\\mathcal N(${fmt(mu, 2)},\\,${fmt(v, 3)})$ sits over the data.`,
        line: 'var = var / n',
        tone: 'make',
        scene: [axis, dataPts, { id: 'bell', k: 'line', pts: bell(mu, v), color: C.r, w: 3 }],
        view,
        vars: [
          ['mu', fmt(mu, 4)],
          ['var', fmt(v, 4)],
        ],
        row: ['MLE', fmt(mu, 3), fmt(v, 3), fmt(best, 3)],
        legend,
      },
      {
        title: 'The likelihood as a landscape',
        text: 'Every point of the bench surface is a choice of $(\\mu,\\sigma)$; its height is the log-likelihood of the 8 values. The gold ball marks our estimate: the top of the hill.',
        line: 'def log_likelihood(x, mu, var):',
        tone: 'info',
        scene: [axis, dataPts, { id: 'bell', k: 'line', pts: bell(mu, v), color: C.r, w: 3 }, surface, { id: 'ball', k: 'point', p: sAt(mu, v), color: C.r, r: 0.17, label: 'MLE' }, { id: 'sl', k: 'label', p: [4.6, -4.6, 0.2], text: 'σ →', color: C.m }, { id: 'ml', k: 'label', p: [4.4, -4.9, 0.2], text: 'μ →', color: C.m }],
        view,
        legend,
      },
    ]
    const guesses: [number, number, string][] = [
      [mu + 0.6, v, 'μ too large'],
      [mu, v * 2.4, 'σ too wide'],
      [mu - 0.35, v * 0.35, 'μ off and σ too narrow'],
    ]
    for (const [m, s2, why] of guesses) {
      const l = ll(m, s2)
      steps.push({
        title: `A worse guess (${why}): log L = ${fmt(l, 2)}`,
        text: `The grey bell ${why.startsWith('σ too wide') ? 'is flat and wastes probability on empty space' : why.startsWith('μ too') ? 'is shifted, so most points sit in its tail' : 'is too narrow: points away from its centre become nearly impossible'}. Its ball sits lower on the hill: ${fmt(l, 2)} < ${fmt(best, 2)}.`,
        line: 'return -0.5 * n * np.log(2 * np.pi * var)',
        tone: 'warn',
        scene: [axis, dataPts, { id: 'bell', k: 'line', pts: bell(mu, v), color: C.r, w: 3 }, { id: 'bell2', k: 'line', pts: bell(m, s2), color: C.m, w: 3 }, surface, { id: 'ball', k: 'point', p: sAt(mu, v), color: C.r, r: 0.17, label: 'MLE' }, { id: 'ball2', k: 'point', p: sAt(m, s2), color: C.w, r: 0.14, label: why }],
        view,
        row: [why, fmt(m, 3), fmt(s2, 3), fmt(l, 3)],
        legend,
      })
    }
    steps.push({
      title: 'The estimate is the peak',
      text: `No other $(\\mu,\\sigma)$ explains the data better. Gradient ascent on this surface would climb to the same point; for the normal we can solve for the peak exactly. For a neural network we cannot, so we climb.`,
      line: 'return mu, var',
      tone: 'done',
      scene: [axis, dataPts, { id: 'bell', k: 'line', pts: bell(mu, v), color: C.r, w: 3 }, surface, { id: 'ball', k: 'point', p: sAt(mu, v), color: C.r, r: 0.17, label: `μ̂=${fmt(mu, 2)}, σ̂²=${fmt(v, 3)}` }],
      view,
      legend,
    })
    return steps
  },
  result: 'The MLE is $\\hat\\mu=\\bar x=4.65$ and $\\hat\\sigma^2=0.5625$; every other guess tried has a lower log-likelihood. The log-likelihood surface has a single peak at the estimate.',
  viva: [
    { q: 'Why maximise the log-likelihood instead of the likelihood?', a: 'The log turns a product of many small densities into a sum, which avoids underflow and is easier to differentiate. The log is increasing, so the peak is in the same place.' },
    { q: 'Why does the MLE variance divide by n while `np.var(ddof=1)` divides by n−1?', a: 'The MLE is slightly biased low because $\\bar x$ was fitted to the same data. Dividing by n−1 makes the estimate unbiased.' },
    { q: 'How is minimising MSE the same as MLE?', a: 'If $y=f(x)+\\varepsilon$ with Gaussian $\\varepsilon$, the negative log-likelihood is a constant plus $\\frac{1}{2\\sigma^2}\\sum(y-f(x))^2$. Minimising it is minimising squared error.' },
    { q: 'What is overfitting from the MLE point of view?', a: 'With enough parameters, the likelihood of the training data can be pushed very high while the model explains new data badly. Priors (regularisation) push back.' },
  ],
}

/* ------------------------------------------------------------------ 2.6 */
const bayesCoin: Experiment = {
  id: 'bayes-coin',
  title: 'Bayesian updating',
  short: 'A belief about a coin, sharpened by each flip',
  file: 'lab2_probability/exp6_bayes_coin.py',
  aim: "To update a Beta prior over a coin's bias one flip at a time, and to watch the posterior narrow towards the true value.",
  apparatus: ['Python 3 with NumPy', 'A coin with unknown bias $p$', 'A ridge of posterior curves on the bench: time runs away from you'],
  theory: `Start with a prior $p\\sim\\text{Beta}(a,b)$. Seeing heads multiplies the density by $p$, tails by $1-p$. The result is again a Beta:
$$\\text{heads: }a\\leftarrow a+1,\\qquad\\text{tails: }b\\leftarrow b+1$$
The posterior mean is $\\frac{a}{a+b}$ and the spread shrinks like $1/\\sqrt{a+b}$.`,
  ml: 'This is Bayesian inference in its simplest form. Thompson sampling for A/B tests and recommendation keeps exactly these Beta posteriors per option. Add-one (Laplace) smoothing in Naive Bayes is a Beta(1,1) prior. Weight decay is a Gaussian prior on weights.',
  params: [
    { key: 'pt', label: 'True P(heads)', default: 0.7, options: [0.2, 0.5, 0.7, 0.9].map((v) => ({ value: v, label: String(v) })) },
    {
      key: 'prior',
      label: 'Prior',
      default: 2,
      options: [
        { value: 1, label: 'Beta(1,1): no idea' },
        { value: 2, label: 'Beta(2,2): probably fair-ish' },
        { value: 10, label: 'Beta(10,10): strongly fair' },
      ],
    },
    seedParam(3),
  ],
  columns: ['flips', 'heads', 'tails', 'posterior mean', 'P(p > 0.5)'],
  run: (p) => {
    const r = rng(p.seed)
    const flips: number[] = Array.from({ length: 60 }, () => (r.uniform() < p.pt ? 1 : 0))
    const snaps = [0, 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 45, 60]
    let a = p.prior
    let b = p.prior
    const hist: [number, number][] = [[a, b]]
    for (const f of flips) {
      if (f) a++
      else b++
      hist.push([a, b])
    }
    const grid = linspace(0.002, 0.998, 160)
    const maxD = Math.max(...snaps.map((s) => Math.max(...grid.map((q) => betaPdf(q, ...hist[s])))))
    const X = (q: number) => (q - 0.5) * 9
    const Y = (i: number) => -3.6 + (i * 7.2) / (snaps.length - 1)
    const Zs = 3.4 / maxD
    const curve = (s: number, i: number): V3[] => grid.map((q) => [X(q), Y(i), betaPdf(q, ...hist[s]) * Zs])
    const pGt = (ab: [number, number]) => {
      let tot = 0
      let hi = 0
      for (const q of grid) {
        const d = betaPdf(q, ...ab)
        tot += d
        if (q > 0.5) hi += d
      }
      return hi / tot
    }
    const view = { pos: [9, -10, 7] as V3, target: [0, 0, 1] as V3 }
    const legend: [string, string][] = [
      [C.r, 'current posterior'],
      [C.m, 'earlier beliefs'],
      [C.g, 'true p'],
    ]
    const truth: Prim[] = [
      { id: 'tl', k: 'line', pts: [[X(p.pt), -4, 0.03], [X(p.pt), 4, 0.03]], color: C.g, dashed: true },
      { id: 'tll', k: 'label', p: [X(p.pt), 4.4, 0.1], text: `true p = ${p.pt}`, color: C.g },
      { id: 'px', k: 'label', p: [X(0), -4.3, 0], text: 'p = 0', color: C.m },
      { id: 'px1', k: 'label', p: [X(1), -4.3, 0], text: 'p = 1', color: C.m },
    ]
    const steps: Step[] = []
    snaps.forEach((s, i) => {
      const ab = hist[s]
      const heads = flips.slice(0, s).reduce<number>((x, y) => x + y, 0)
      const lines: Prim[] = snaps.slice(0, i + 1).map((t, j) => ({ id: `c${j}`, k: 'line', pts: curve(t, j), color: j === i ? C.r : C.m, w: j === i ? 3.5 : 1.5, opacity: j === i ? 1 : 0.55 }) as Prim)
      const seq = flips
        .slice(0, s)
        .map((f) => (f ? 'H' : 'T'))
        .join('')
      const mean = ab[0] / (ab[0] + ab[1])
      const last = s > 0 ? flips[s - 1] : -1
      steps.push({
        title: s === 0 ? `Prior: Beta(${ab[0]}, ${ab[1]})` : `After ${s} flip${s > 1 ? 's' : ''}: Beta(${ab[0]}, ${ab[1]})`,
        text:
          s === 0
            ? `Before any data, our belief about the bias p is the prior. ${p.prior === 1 ? 'Flat: every p is equally plausible.' : p.prior === 2 ? 'A gentle hump: we lean towards a fair coin.' : 'A tall hump at 0.5: we are fairly sure the coin is fair, so it will take many flips to change our mind.'}`
            : `Flips so far: ${seq.length > 30 ? '…' + seq.slice(-30) : seq} (${heads} heads, ${s - heads} tails). Each flip just adds one to a or b. The posterior mean is ${fmt(mean, 3)}${s >= 30 ? ', and the curve is now narrow: we are confident' : ''}.`,
        line: s === 0 ? 'history = [(a, b)]' : last === 1 ? 'a += 1' : 'b += 1',
        tone: s === 60 ? 'done' : s === 0 ? 'info' : 'make',
        scene: [...truth, ...lines],
        view,
        vars: [
          ['a, b', `${ab[0]}, ${ab[1]}`],
          ['mean a/(a+b)', fmt(mean, 4)],
        ],
        row: [s, heads, s - heads, fmt(mean, 3), fmt(pGt(ab), 3)],
        legend,
      })
    })
    return steps
  },
  result: 'Each flip shifts the Beta posterior, and its peak moves towards the true bias while its width shrinks. A strong prior needs more data to move; with enough flips every reasonable prior ends at the same answer.',
  viva: [
    { q: 'Why is the posterior still a Beta distribution?', a: 'The Beta prior is conjugate to the Bernoulli likelihood: $p^{a-1}(1-p)^{b-1}\\cdot p$ is again of the form $p^{a_{new}-1}(1-p)^{b_{new}-1}$.' },
    { q: 'What do a and b mean intuitively?', a: 'Pseudo-counts: Beta(a, b) behaves like having already seen a−1 heads and b−1 tails.' },
    { q: 'How is this different from the MLE heads/n?', a: 'The MLE gives a single number and can be extreme with little data (1 flip, 1 head → p = 1). The posterior keeps the full uncertainty and is pulled towards the prior when data is scarce.' },
    { q: 'How does Thompson sampling use this?', a: 'For each option keep a Beta posterior; sample one p from each and pick the option with the largest sample. It explores uncertain options and exploits good ones.' },
  ],
}

export const EXPERIMENTS: Experiment[] = [monteCarloPi, inverseTransform, galton, clt, mle, bayesCoin]
