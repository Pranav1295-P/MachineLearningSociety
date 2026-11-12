import type { LabDef, RefSection } from '../../core/types'
import { EXPERIMENTS } from './experiments'
import { LESSONS } from './lessons'
import { PRACTICE } from './practice'
import { ProbWorkbench } from './Workbench'

const REFERENCE: RefSection[] = [
  {
    title: 'Rules',
    rows: [
      { name: 'Complement', tex: 'P(A^c)=1-P(A)', numpy: '1 - p', use: 'probability of "not this class"' },
      { name: 'Sum rule', tex: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)', numpy: 'np.mean(a | b)', use: 'combining events' },
      { name: 'Product rule', tex: 'P(A\\cap B)=P(A\\mid B)P(B)', numpy: 'np.mean(a & b)', use: 'chain rule of language models' },
      { name: 'Independence', tex: 'P(A\\cap B)=P(A)P(B)', numpy: 'np.isclose(...)', use: 'the "naive" in Naive Bayes' },
      { name: "Bayes' rule", tex: 'P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}', numpy: 'lik * prior / evidence', use: 'classifiers, spam filters, diagnosis' },
      { name: 'Total probability', tex: 'P(B)=\\textstyle\\sum_i P(B\\mid A_i)P(A_i)', numpy: '(lik * prior).sum()', use: 'the denominator of Bayes' },
    ],
  },
  {
    title: 'Summaries',
    rows: [
      { name: 'Expectation', tex: 'E[X]=\\textstyle\\sum x\\,p(x)', numpy: 'x.mean()', use: 'expected loss, risk' },
      { name: 'Variance', tex: '\\mathrm{Var}(X)=E[X^2]-E[X]^2', numpy: 'x.var()', use: 'batch norm, uncertainty' },
      { name: 'Covariance', tex: '\\mathrm{Cov}(X,Y)=E[(X-\\mu_X)(Y-\\mu_Y)]', numpy: 'np.cov(x, y)', use: 'PCA, correlated features' },
      { name: 'Linearity', tex: 'E[aX+bY]=aE[X]+bE[Y]', numpy: '', use: 'averaging losses over a batch' },
      { name: 'Sum of independents', tex: '\\mathrm{Var}(X+Y)=\\mathrm{Var}X+\\mathrm{Var}Y', numpy: '', use: 'why noise shrinks like 1/√n' },
    ],
  },
  {
    title: 'Distributions',
    rows: [
      { name: 'Bernoulli(p)', tex: 'p^x(1-p)^{1-x}', numpy: 'rng.binomial(1, p)', use: 'binary labels, logistic regression' },
      { name: 'Binomial(n, p)', tex: '\\binom nk p^k(1-p)^{n-k}', numpy: 'rng.binomial(n, p)', use: 'accuracy on n test examples' },
      { name: 'Categorical', tex: 'P(X=k)=\\pi_k', numpy: 'rng.choice(K, p=pi)', use: 'softmax output, next token' },
      { name: 'Poisson(λ)', tex: '\\lambda^ke^{-\\lambda}/k!', numpy: 'rng.poisson(lam)', use: 'event counts' },
      { name: 'Normal(μ, σ²)', tex: '\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-(x-\\mu)^2/2\\sigma^2}', numpy: 'rng.normal(mu, sigma)', use: 'noise, init, VAEs' },
      { name: 'Exponential(λ)', tex: '\\lambda e^{-\\lambda x}', numpy: 'rng.exponential(1/lam)', use: 'waiting times' },
      { name: 'Beta(a, b)', tex: '\\propto p^{a-1}(1-p)^{b-1}', numpy: 'rng.beta(a, b)', use: 'priors on probabilities' },
      { name: 'Multivariate normal', tex: '\\propto e^{-\\frac12(x-\\mu)^T\\Sigma^{-1}(x-\\mu)}', numpy: 'rng.multivariate_normal(mu, S)', use: 'GMMs, Gaussian processes' },
    ],
  },
  {
    title: 'Estimation & information',
    rows: [
      { name: 'Likelihood', tex: 'L(\\theta)=\\textstyle\\prod_i p(x_i\\mid\\theta)', numpy: 'np.sum(np.log(p))', use: 'training objective' },
      { name: 'MLE', tex: '\\hat\\theta=\\arg\\max_\\theta\\log L(\\theta)', numpy: 'x.mean(), x.var()', use: 'MSE and cross-entropy losses' },
      { name: 'Posterior', tex: 'p(\\theta\\mid D)\\propto p(D\\mid\\theta)p(\\theta)', numpy: '', use: 'Bayesian ML, regularisation' },
      { name: 'Entropy', tex: 'H(p)=-\\textstyle\\sum p\\log p', numpy: '-(p * np.log(p)).sum()', use: 'decision-tree splits' },
      { name: 'Cross-entropy', tex: 'H(p,q)=-\\textstyle\\sum p\\log q', numpy: '-np.log(q[label])', use: 'classification loss' },
      { name: 'KL divergence', tex: 'D_{KL}(p\\|q)=\\textstyle\\sum p\\log\\frac pq', numpy: '(p * np.log(p / q)).sum()', use: 'VAEs, distillation, RLHF' },
    ],
  },
]

export const PROBABILITY: LabDef = {
  slug: 'probability',
  no: 2,
  room: 'PR-102',
  name: 'Probability & Distributions',
  accent: '#ff8fb1',
  tagline: 'Reasoning when the data is noisy',
  blurb: 'Events, expectation, Bayes, the common distributions, the normal curve and its 2D form. Monte Carlo, sampling, the CLT, maximum likelihood and Bayesian updating, simulated from scratch.',
  lessons: LESSONS,
  experiments: EXPERIMENTS,
  Workbench: ProbWorkbench,
  practice: PRACTICE,
  reference: REFERENCE,
}
