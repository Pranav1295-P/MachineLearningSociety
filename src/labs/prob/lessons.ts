import { binomPmf, eigSym, fmt, linspace, normalPdf, poissonPmf, rng } from '../../core/math'
import type { Lesson, Prim, Step, V3 } from '../../core/types'
import { C } from '../colors'

const front = { pos: [0, -12, 6] as V3, target: [0, 0, 1.4] as V3 }

/* 1. Sample spaces and events */
const events: Lesson = {
  id: 'events',
  title: 'Outcomes, events, probability',
  short: 'Two dice, 36 outcomes, one event',
  formula: 'P(A)=\\frac{|A|}{|\\Omega|}\\quad\\text{(equally likely outcomes)}',
  ml: 'A classifier outputs a probability for each class: a distribution over a sample space of labels. Accuracy, precision and recall are all probabilities of events.',
  steps: () => {
    const S = 1.05
    const P = (i: number, j: number): V3 => [(i - 3.5) * S, (j - 3.5) * S, 0.15]
    const all: V3[] = []
    const sumCol: string[] = []
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) {
      all.push(P(i, j))
      sumCol.push(i + j === 7 ? C.r : C.a)
    }
    const sums = Array.from({ length: 11 }, (_, k) => k + 2)
    const count = (s: number) => 6 - Math.abs(s - 7)
    const labels: Prim[] = [
      { id: 'l1', k: 'label', p: [0, -4.4, 0], text: 'die 1 →', color: C.m },
      { id: 'l2', k: 'label', p: [-4.6, 0, 0], text: 'die 2 →', color: C.m },
    ]
    return [
      {
        title: 'The sample space: every possible outcome',
        text: 'Roll two dice. Each dot is one outcome (die 1, die 2): 6 × 6 = 36 of them, all equally likely. This set is the sample space $\\Omega$.',
        scene: [{ id: 'pts', k: 'cloud', pts: all, color: C.a, r: 0.16 }, ...labels],
        view: { pos: [0, -7, 10], target: [0, 0, 0] },
      },
      {
        title: 'An event is a set of outcomes',
        text: 'The event "the sum is 7" contains the 6 gold dots on the diagonal: (1,6), (2,5), …, (6,1). So $P(\\text{sum}=7)=6/36=1/6$.',
        tone: 'make',
        scene: [{ id: 'pts', k: 'cloud', pts: all, color: sumCol, r: 0.16 }, ...labels],
        view: { pos: [0, -7, 10], target: [0, 0, 0] },
      },
      {
        title: 'A distribution: probability for every sum',
        text: 'Group the 36 outcomes by their sum. The heights are the counts / 36. Sum 7 is most likely because the most outcomes give it. This list of probabilities is the **probability mass function** of the sum.',
        tone: 'done',
        scene: [
          { id: 'bars', k: 'bars', bars: sums.map((s) => ({ x: (s - 7) * 0.8, h: (count(s) / 36) * 18, color: s === 7 ? C.r : C.a })), w: 0.62, d: 0.62, color: C.a },
          ...sums.map((s) => ({ id: `s${s}`, k: 'label', p: [(s - 7) * 0.8, -0.8, 0], text: String(s), color: C.m }) as Prim),
          { id: 'p7', k: 'label', p: [0, 0, 3.4], text: '6/36', color: C.r },
        ],
        view: front,
      },
    ] as Step[]
  },
  check: {
    q: 'Two fair dice. What is $P(\\text{both show the same number})$?',
    options: ['1/36', '1/6', '1/12', '1/2'],
    answer: 1,
    why: 'The event is the 6 outcomes (1,1), (2,2), …, (6,6): $6/36=1/6$.',
  },
}

/* 2. Expectation and variance */
const moments: Lesson = {
  id: 'expectation',
  title: 'Expectation & variance',
  short: 'Balance point and spread',
  formula: 'E[X]=\\sum_x x\\,p(x),\\qquad \\mathrm{Var}(X)=E\\big[(X-E[X])^2\\big]',
  ml: 'A loss function is an expectation over the data. The bias–variance trade-off splits a model\'s expected error into a systematic part and a spread part. Batch normalisation rescales activations to mean 0 and variance 1.',
  steps: () => {
    const fair = [1, 1, 1, 1, 1, 1].map((v) => v / 6)
    const loaded = [0.05, 0.05, 0.1, 0.1, 0.2, 0.5]
    const E = (p: number[]) => p.reduce((s, q, i) => s + q * (i + 1), 0)
    const V = (p: number[]) => p.reduce((s, q, i) => s + q * (i + 1 - E(p)) ** 2, 0)
    const bars = (id: string, p: number[], y: number, color: string): Prim => ({ id, k: 'bars', bars: p.map((q, i) => ({ x: (i - 2.5) * 1.1, y, h: q * 9 })), w: 0.8, d: 0.8, color })
    const fulcrum = (id: string, p: number[], y: number, color: string): Prim[] => [
      { id, k: 'arrow', from: [(E(p) - 3.5) * 1.1, y, -0.01], to: [(E(p) - 3.5) * 1.1, y, 0.6], color, r: 0.08 },
      { id: id + 'l', k: 'label', p: [(E(p) - 3.5) * 1.1, y - 1, 0], text: `E[X] = ${fmt(E(p), 2)}`, color },
    ]
    const narrow = [0, 0.1, 0.4, 0.4, 0.1, 0]
    const wide = [0.3, 0.1, 0.1, 0.1, 0.1, 0.3]
    return [
      {
        title: 'Expectation is the balance point',
        text: 'A fair die: each face weighs 1/6. If the bars were weights on a plank, the plank balances at $E[X]=\\sum x\\,p(x)=3.5$, even though you can never roll 3.5.',
        scene: [bars('a', fair, 0, C.a), ...fulcrum('f', fair, 0, C.r)],
        view: front,
      },
      {
        title: 'Move the weight, move the balance point',
        text: `A loaded die that shows 6 half the time balances at ${fmt(E(loaded), 2)}. The expectation is pulled towards where the probability sits.`,
        tone: 'make',
        scene: [bars('a', loaded, 0, C.b), ...fulcrum('f', loaded, 0, C.r)],
        view: front,
      },
      {
        title: 'Same mean, different spread',
        text: `Both rows balance at 3.5. The back row is concentrated (variance ${fmt(V(narrow), 2)}); the front row piles up at the ends (variance ${fmt(V(wide), 2)}). Variance is the average squared distance from the mean.`,
        tone: 'done',
        scene: [bars('a', narrow, 1.5, C.a), bars('b', wide, -1.5, C.o), ...fulcrum('f', narrow, 1.5, C.r), ...fulcrum('g', wide, -1.5, C.r)],
        view: { pos: [6, -11, 7], target: [0, 0, 0.8] },
      },
    ] as Step[]
  },
  check: {
    q: 'If $E[X]=2$ and $\\mathrm{Var}(X)=3$, what is $E[X^2]$?',
    options: ['5', '7', '4', '13'],
    answer: 1,
    why: '$\\mathrm{Var}(X)=E[X^2]-E[X]^2$, so $E[X^2]=3+4=7$.',
  },
}

/* 3. Conditional probability and Bayes */
const bayes: Lesson = {
  id: 'bayes',
  title: "Conditioning & Bayes' rule",
  short: 'How evidence changes a probability',
  formula: 'P(A\\mid B)=\\frac{P(B\\mid A)\\,P(A)}{P(B)}',
  ml: "Naive Bayes spam filters apply Bayes' rule word by word. Every probabilistic classifier estimates $P(\\text{class}\\mid\\text{features})$. Bayes also explains why a rare class gives many false alarms even with an accurate model.",
  steps: () => {
    const cols = 20
    const rows = 10
    const spam = new Set<number>()
    const free = new Set<number>()
    const r = rng(5)
    const idx = Array.from({ length: 200 }, (_, i) => i).sort(() => r.uniform() - 0.5)
    idx.slice(0, 40).forEach((i) => spam.add(i))
    const spamList = [...spam]
    const hamList = idx.slice(40)
    spamList.slice(0, 24).forEach((i) => free.add(i))
    hamList.slice(0, 8).forEach((i) => free.add(i))
    const pos = (i: number) => ({ x: ((i % cols) - (cols - 1) / 2) * 0.48, y: (Math.floor(i / cols) - (rows - 1) / 2) * 0.48 })
    const blocks = (mode: 0 | 1 | 2): Prim => ({
      id: 'blocks',
      k: 'bars',
      w: 0.4,
      d: 0.4,
      color: C.a,
      bars: Array.from({ length: 200 }, (_, i) => {
        const isSpam = spam.has(i)
        const lit = free.has(i)
        const h = mode === 0 ? 0.25 : mode === 1 ? (lit ? 1.4 : 0.25) : lit ? 1.4 : 0.001
        return { ...pos(i), h, color: isSpam ? C.b : C.a }
      }),
    })
    const view = { pos: [0, -8, 8.5] as V3, target: [0, 0, 0.4] as V3 }
    const legend: [string, string][] = [
      [C.b, 'spam'],
      [C.a, 'not spam'],
    ]
    return [
      {
        title: 'Prior: 200 emails, 20% spam',
        text: 'Each block is one email. 40 are spam (pink), 160 are not. Before reading anything, $P(\\text{spam})=0.2$.',
        scene: [blocks(0)],
        view,
        legend,
      },
      {
        title: 'Evidence: which emails contain "free"?',
        text: '60% of spam contains "free" (24 emails) but only 5% of normal mail does (8 emails). Those blocks rise. $P(\\text{free}\\mid\\text{spam})=0.6$, $P(\\text{free}\\mid\\text{ham})=0.05$.',
        tone: 'make',
        scene: [blocks(1)],
        view,
        legend,
      },
      {
        title: 'Condition: keep only the raised blocks',
        text: 'Given the email contains "free", only the 32 raised emails are possible. 24 of them are spam: $P(\\text{spam}\\mid\\text{free})=24/32=0.75$. Bayes\' rule computes the same: $\\frac{0.6\\times0.2}{0.6\\times0.2+0.05\\times0.8}=0.75$.',
        tone: 'done',
        scene: [blocks(2)],
        view,
        legend,
      },
    ] as Step[]
  },
  check: {
    q: 'A disease affects 1 in 1000 people. A test is 99% accurate both ways. You test positive. Roughly how likely is it that you are ill?',
    options: ['99%', 'about 50%', 'about 9%', '0.1%'],
    answer: 2,
    why: 'Out of 100 000 people: 100 ill, 99 test positive; 99 900 healthy, 999 test positive. $99/(99+999)\\approx9\\%$. The prior is tiny, so most positives are false.',
  },
}

/* 4. Discrete distributions */
const discrete: Lesson = {
  id: 'discrete',
  title: 'Bernoulli, binomial, Poisson',
  short: 'The distributions of counting',
  formula: 'P(K=k)=\\binom nk p^k(1-p)^{n-k}\\quad\\text{and}\\quad P(K=k)=\\frac{\\lambda^ke^{-\\lambda}}{k!}',
  ml: 'Binary labels are Bernoulli; logistic regression predicts its p. Click counts and test accuracy are binomial. Counts of rare events per hour (requests, failures, words in a document) are Poisson, the basis of Poisson regression.',
  steps: () => {
    const bars = (ps: number[], color: string, x0 = 0): Prim => ({ id: 'b', k: 'bars', bars: ps.map((q, k) => ({ x: x0 + (k - (ps.length - 1) / 2) * 0.7, h: q * 9 })), w: 0.55, d: 0.55, color })
    const ticks = (n: number): Prim[] => Array.from({ length: n }, (_, k) => ({ id: `t${k}`, k: 'label', p: [(k - (n - 1) / 2) * 0.7, -0.7, 0], text: String(k), color: C.m }) as Prim)
    const bin = Array.from({ length: 11 }, (_, k) => binomPmf(10, k, 0.3))
    const poi = Array.from({ length: 13 }, (_, k) => poissonPmf(k, 3))
    return [
      {
        title: 'Bernoulli(p): one yes/no trial',
        text: 'A single coin flip, click or correct prediction. 1 with probability p = 0.3, 0 otherwise. Mean $p$, variance $p(1-p)$.',
        scene: [bars([0.7, 0.3], C.a), ...ticks(2)],
        view: front,
      },
      {
        title: 'Binomial(10, 0.3): count the yeses',
        text: 'Ten independent Bernoulli trials; K = number of successes. Mean $np=3$, variance $np(1-p)=2.1$. Experiment 2.3 builds this with a Galton board.',
        tone: 'make',
        scene: [bars(bin, C.v), ...ticks(11)],
        view: front,
      },
      {
        title: 'Poisson(3): counts with no fixed n',
        text: 'Events that happen at an average rate λ = 3 per interval, independently: emails per hour, typos per page. Mean and variance are both λ. It is the binomial with huge n and tiny p, $np=\\lambda$.',
        tone: 'done',
        scene: [bars(poi, C.o), ...ticks(13)],
        view: front,
      },
    ] as Step[]
  },
  check: {
    q: 'A web page gets on average 2 sign-ups per hour. Which distribution models the sign-ups in one hour?',
    options: ['Bernoulli(0.2)', 'Poisson(2)', 'Normal(2, 1)', 'Uniform{0,…,4}'],
    answer: 1,
    why: 'Independent events at a constant average rate, counted in a fixed interval: Poisson with λ = 2.',
  },
}

/* 5. Continuous: the normal */
const normal: Lesson = {
  id: 'normal',
  title: 'Densities & the normal',
  short: 'Probability is area under a curve',
  formula: 'p(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}},\\qquad P(a<X<b)=\\int_a^b p(x)\\,dx',
  ml: 'Gaussian noise is the assumption behind mean squared error. Weights are initialised from normals (Xavier, He). Gaussian mixture models, Gaussian processes and diffusion models are all built from this one curve.',
  steps: () => {
    const XS = 1.5
    const ZS = 7
    const pdf = (m = 0, s = 1): V3[] => linspace(-3.6, 3.6, 160).map((x) => [x * XS, 0, normalPdf(x, m, s) * ZS])
    const area = (k: number, color: string): Prim => {
      const xs = linspace(-k, k, Math.round(k * 14) + 1)
      const w = (2 * k) / (xs.length - 1)
      return { id: 'area', k: 'bars', bars: xs.slice(0, -1).map((x) => ({ x: (x + w / 2) * XS, h: normalPdf(x + w / 2) * ZS })), w: w * XS * 0.98, d: 0.25, color, opacity: 0.6 }
    }
    const curve: Prim = { id: 'pdf', k: 'line', pts: pdf(), color: C.r, w: 3 }
    return [
      {
        title: 'A density, not a probability',
        text: 'For a continuous value, any exact number has probability 0. The curve $p(x)$ is a density: probability lives in the **area** under it. The total area is 1.',
        scene: [curve],
        view: front,
      },
      {
        title: '68% within one σ',
        text: '$P(-1<Z<1)=\\int_{-1}^{1}p(x)\\,dx\\approx0.683$. The blue slabs fill that area (Lab 3 computes it with a Riemann sum).',
        tone: 'make',
        scene: [curve, area(1, C.a), { id: 'l', k: 'label', p: [0, 0, 1.5], text: '68.3%', color: C.w, size: 'lg' }],
        view: front,
      },
      {
        title: '95% within two σ, 99.7% within three',
        text: 'The famous 68–95–99.7 rule. Values beyond 3σ are rare enough that they are often treated as outliers.',
        tone: 'make',
        scene: [curve, area(2, C.v), { id: 'l', k: 'label', p: [0, 0, 1.5], text: '95.4%', color: C.w, size: 'lg' }],
        view: front,
      },
      {
        title: 'μ moves it, σ stretches it',
        text: 'Pink: $\\mu=1,\\sigma=0.6$, taller and narrower. Gold: the standard normal. A smaller σ must be taller so the area stays 1.',
        tone: 'done',
        scene: [curve, { id: 'pdf2', k: 'line', pts: pdf(1, 0.6), color: C.b, w: 3 }],
        view: front,
      },
    ] as Step[]
  },
  check: {
    q: 'Heights are $\\mathcal N(170, 10^2)$ cm. Roughly what fraction is taller than 190 cm?',
    options: ['2.5%', '5%', '16%', '0.15%'],
    answer: 0,
    why: '190 is 2σ above the mean. 95% lie within ±2σ, leaving 5% in the two tails: 2.5% in the upper one.',
  },
}

/* 6. Multivariate Gaussian */
const mvn: Lesson = {
  id: 'multivariate',
  title: 'The multivariate Gaussian',
  short: 'A bell in 2D, shaped by a covariance matrix',
  formula: 'p(x)=\\frac{1}{2\\pi\\sqrt{\\det\\Sigma}}\\exp\\!\\left(-\\tfrac12(x-\\mu)^T\\Sigma^{-1}(x-\\mu)\\right)',
  ml: 'Gaussian discriminant analysis, Gaussian mixture models, the latent space of a variational autoencoder and Gaussian processes all use this density. Its covariance matrix links straight back to PCA in Lab 1.',
  steps: () => {
    const make = (sx: number, sy: number, rho: number) => {
      const det = sx * sx * sy * sy * (1 - rho * rho)
      const a = (sy * sy) / det
      const b = (-rho * sx * sy) / det
      const c = (sx * sx) / det
      const k = 1 / (2 * Math.PI * Math.sqrt(det))
      return (x: number, y: number) => 9 * k * Math.exp(-0.5 * (a * x * x + 2 * b * x * y + c * y * y))
    }
    const f1 = make(1.2, 1.2, 0)
    const f2 = make(1.6, 0.9, 0.8)
    const r = rng(9)
    const sx = 1.6,
      sy = 0.9,
      rho = 0.8
    const pts: V3[] = Array.from({ length: 300 }, () => {
      const z1 = r.normal()
      const z2 = r.normal()
      return [sx * z1, sy * (rho * z1 + Math.sqrt(1 - rho * rho) * z2), 0.04] as V3
    })
    const S = [
      [sx * sx, rho * sx * sy],
      [rho * sx * sy, sy * sy],
    ]
    const { vals, vecs } = eigSym(S)
    const view = { pos: [7, -9, 7] as V3, target: [0, 0, 0.6] as V3 }
    return [
      {
        title: 'Two independent normals: a round hill',
        text: 'For two independent standard-ish normals the joint density is the product of the two bells: a round hill. Every slice through it is itself a bell.',
        scene: [{ id: 's', k: 'surface', f: f1, range: [-4.5, 4.5, -4.5, 4.5], color: C.b, opacity: 0.9 }],
        view,
      },
      {
        title: 'Correlation tilts and squeezes the hill',
        text: 'With $\\sigma_x=1.6,\\;\\sigma_y=0.9,\\;\\rho=0.8$ the hill becomes a ridge along a diagonal: when x is large, y tends to be large too.',
        tone: 'make',
        scene: [{ id: 's', k: 'surface', f: f2, range: [-4.5, 4.5, -4.5, 4.5], color: C.b, opacity: 0.9 }],
        view,
      },
      {
        title: 'Samples and the covariance matrix',
        text: `Samples on the bench follow the ridge. $\\Sigma=\\begin{bmatrix}${fmt(S[0][0], 2)}&${fmt(S[0][1], 2)}\\\\${fmt(S[1][0], 2)}&${fmt(S[1][1], 2)}\\end{bmatrix}$. Its eigenvectors (arrows) point along the ridge and across it, with lengths $\\sqrt{\\lambda}$: exactly the principal components of Lab 1.`,
        tone: 'done',
        scene: [
          { id: 's', k: 'surface', f: f2, range: [-4.5, 4.5, -4.5, 4.5], color: C.b, opacity: 0.35 },
          { id: 'pts', k: 'cloud', pts, color: C.a, r: 0.06 },
          ...vecs.map((v, i) => ({ id: `e${i}`, k: 'arrow', from: [0, 0, 0.05], to: [v[0] * 2 * Math.sqrt(vals[i]), v[1] * 2 * Math.sqrt(vals[i]), 0.05], color: i ? C.v : C.r, label: `√λ${i + 1} = ${fmt(Math.sqrt(vals[i]), 2)}` }) as Prim),
          { id: 'cov', k: 'tiles', at: [0, 0, 0], title: 'Σ', vals: S.map((row) => row.map((v) => fmt(v, 2))) },
        ],
        view: { pos: [0, -6, 10], target: [0, 0, 0] },
      },
    ] as Step[]
  },
  check: {
    q: 'For a 2D Gaussian with $\\Sigma=\\begin{bmatrix}4&0\\\\0&1\\end{bmatrix}$, the density\'s contours are…',
    options: ['circles', 'ellipses twice as wide in x as in y', 'ellipses 4 times as wide in x', 'tilted ellipses'],
    answer: 1,
    why: 'Standard deviations are $\\sqrt4=2$ and $\\sqrt1=1$, and zero covariance means no tilt: axis-aligned ellipses twice as wide in x.',
  },
}

export const LESSONS: Lesson[] = [events, moments, bayes, discrete, normal, mvn]
