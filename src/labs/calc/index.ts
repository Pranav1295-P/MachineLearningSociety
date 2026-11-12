import type { LabDef, RefSection } from '../../core/types'
import { EXPERIMENTS } from './experiments'
import { LESSONS } from './lessons'
import { PRACTICE } from './practice'
import { CalcWorkbench } from './Workbench'

const REFERENCE: RefSection[] = [
  {
    title: 'Derivatives',
    rows: [
      { name: 'Definition', tex: "f'(x)=\\lim_{h\\to0}\\frac{f(x+h)-f(x)}{h}", numpy: '(f(x + h) - f(x - h)) / (2 * h)', use: 'gradient checks' },
      { name: 'Power rule', tex: '\\frac{d}{dx}x^n=nx^{n-1}', numpy: '', use: 'polynomial features, MSE' },
      { name: 'Exp and log', tex: "(e^x)'=e^x,\;(\\ln x)'=1/x", numpy: 'np.exp, np.log', use: 'softmax, cross-entropy' },
      { name: 'Product rule', tex: "(fg)'=f'g+fg'", numpy: '', use: 'gates in LSTMs, attention' },
      { name: 'Chain rule', tex: "(f\\circ g)'=f'(g(x))\\,g'(x)", numpy: '', use: 'backpropagation' },
      { name: 'Sigmoid', tex: "\\sigma'(z)=\\sigma(z)(1-\\sigma(z))", numpy: 's * (1 - s)', use: 'logistic regression, gates' },
      { name: 'tanh / ReLU', tex: "\\tanh'=1-\\tanh^2,\;\\mathrm{ReLU}'=[z>0]", numpy: '1 - t**2, (z > 0)', use: 'activations' },
    ],
  },
  {
    title: 'Many variables',
    rows: [
      { name: 'Partial derivative', tex: '\\frac{\\partial f}{\\partial x_i}', numpy: 'nudge one coordinate', use: 'effect of one weight' },
      { name: 'Gradient', tex: '\\nabla f=(\\partial_1f,\\dots,\\partial_nf)', numpy: 'num_grad(f, p)', use: 'direction of steepest ascent' },
      { name: 'Directional derivative', tex: 'D_vf=\\nabla f\\cdot v', numpy: 'g @ v', use: 'why −∇f is steepest descent' },
      { name: 'Jacobian', tex: 'J_{ij}=\\partial f_i/\\partial x_j', numpy: '', use: 'backprop through vector layers' },
      { name: 'Hessian', tex: 'H_{ij}=\\partial^2f/\\partial x_i\\partial x_j', numpy: 'np.linalg.eigvalsh(H)', use: 'curvature, Newton, saddles' },
      { name: 'Linear layer grads', tex: '\\frac{\\partial L}{\\partial W}=\\delta x^T,\;\\frac{\\partial L}{\\partial x}=W^T\\delta', numpy: 'np.outer(d, x), W.T @ d', use: 'every dense layer' },
    ],
  },
  {
    title: 'Optimisation',
    rows: [
      { name: 'Gradient descent', tex: 'w\\leftarrow w-\\eta\\nabla L', numpy: 'w -= lr * g', use: 'training' },
      { name: 'Momentum', tex: 'v\\leftarrow\\beta v+\\nabla L,\;w\\leftarrow w-\\eta v', numpy: 'v = b*v + g; w -= lr*v', use: 'faster, smoother training' },
      { name: 'Adam', tex: 'w\\leftarrow w-\\eta\\,\\hat m/(\\sqrt{\\hat s}+\\epsilon)', numpy: 'see Workbench', use: 'default deep-learning optimiser' },
      { name: "Newton's method", tex: 'w\\leftarrow w-H^{-1}\\nabla L', numpy: 'w -= np.linalg.solve(H, g)', use: 'logistic regression (IRLS), L-BFGS' },
      { name: 'Stationary point', tex: '\\nabla L=0', numpy: '', use: 'minimum, maximum or saddle' },
      { name: 'Convexity', tex: 'H\\succeq0', numpy: 'eigvalsh(H) >= 0', use: 'guarantees a global minimum' },
    ],
  },
  {
    title: 'Integrals',
    rows: [
      { name: 'Riemann (midpoint)', tex: '\\int_a^bf\\approx\\textstyle\\sum f(x_i^{mid})\\Delta x', numpy: '(f(mids) * dx).sum()', use: 'numeric probabilities' },
      { name: 'Trapezoid', tex: '\\tfrac{\\Delta x}{2}\\textstyle\\sum(f_i+f_{i+1})', numpy: 'np.trapezoid(y, x)', use: 'AUC of ROC curves' },
      { name: 'Fundamental theorem', tex: '\\int_a^bf=F(b)-F(a)', numpy: '', use: 'CDF differences' },
      { name: 'Expectation', tex: 'E[g(X)]=\\int g(x)p(x)\\,dx', numpy: 'g(samples).mean()', use: 'expected loss' },
      { name: 'Gaussian integral', tex: '\\int e^{-x^2/2}dx=\\sqrt{2\\pi}', numpy: '', use: 'normal density constant' },
    ],
  },
]

export const CALCULUS: LabDef = {
  slug: 'calculus',
  no: 3,
  room: 'CA-103',
  name: 'Calculus',
  accent: '#ffb547',
  tagline: 'How models learn: follow the slope',
  blurb: 'Derivatives, the chain rule, gradients, gradient descent, curvature and integrals. Finite differences, Newton, Riemann sums, backpropagation and a full regression training loop, from scratch.',
  lessons: LESSONS,
  experiments: EXPERIMENTS,
  Workbench: CalcWorkbench,
  practice: PRACTICE,
  reference: REFERENCE,
}
