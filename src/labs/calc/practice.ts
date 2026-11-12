// Generated: every solution was run and its real output recorded in `expect`.
import type { Problem } from '../../core/types'

export const PRACTICE: Problem[] = [
  {
    "id": "poly-deriv",
    "title": "Check a derivative numerically",
    "level": "Warm-up",
    "prompt": "For $f(x)=x^3-4x^2+2$ compute $f'(2)$ by hand, then with forward and central differences for $h=10^{-1},10^{-3},10^{-5}$. Which converges faster?",
    "hints": [
      "$f'(x)=3x^2-8x$, so $f'(2)=-4$.",
      "Forward: $\\frac{f(x+h)-f(x)}{h}$. Central: $\\frac{f(x+h)-f(x-h)}{2h}$."
    ],
    "solution": "f = lambda x: x**3 - 4 * x**2 + 2\nx, exact = 2.0, -4.0\nfor h in [1e-1, 1e-3, 1e-5]:\n    fwd = (f(x + h) - f(x)) / h\n    cen = (f(x + h) - f(x - h)) / (2 * h)\n    print(f\"h={h:g}  forward err={abs(fwd - exact):.2e}  central err={abs(cen - exact):.2e}\")\n",
    "expect": "h=0.1  forward err=2.10e-01  central err=1.00e-02\nh=0.001  forward err=2.00e-03  central err=1.00e-06\nh=1e-05  forward err=2.00e-05  central err=1.07e-10"
  },
  {
    "id": "num-grad",
    "title": "A numerical gradient",
    "level": "Warm-up",
    "prompt": "Write `num_grad(f, p, h=1e-5)` that returns the gradient of any $f:\\mathbb{R}^n\\to\\mathbb{R}$ by central differences. Test it on $f(x,y)=x^2y+\\sin y$ at $(1,2)$ against the exact gradient $(2xy,\\;x^2+\\cos y)$.",
    "hints": [
      "Loop over coordinates; nudge one at a time with a unit vector `e`.",
      "This is the gradient check used to debug backprop."
    ],
    "solution": "import numpy as np\n\ndef num_grad(f, p, h=1e-5):\n    g = np.zeros_like(p)\n    for i in range(len(p)):\n        e = np.zeros_like(p)\n        e[i] = h\n        g[i] = (f(p + e) - f(p - e)) / (2 * h)\n    return g\n\nf = lambda p: p[0] ** 2 * p[1] + np.sin(p[1])\np = np.array([1.0, 2.0])\nprint(\"numeric:\", np.round(num_grad(f, p), 6))\nprint(\"exact  :\", np.round([2 * p[0] * p[1], p[0] ** 2 + np.cos(p[1])], 6))\n",
    "expect": "numeric: [4.       0.583853]\nexact  : [4.       0.583853]",
    "ml": "frameworks such as PyTorch ship a `gradcheck` that does exactly this."
  },
  {
    "id": "gd-1d",
    "title": "Gradient descent in one dimension",
    "level": "Core",
    "prompt": "Minimise $L(w)=(w-3)^2+1$ from $w=-2$ with learning rates 0.1, 0.5 and 1.1. Print $w$ after 20 steps for each. Explain what you see.",
    "hints": [
      "$L'(w)=2(w-3)$.",
      "Each step multiplies the distance to 3 by $(1-2\\eta)$."
    ],
    "solution": "for lr in [0.1, 0.5, 1.1]:\n    w = -2.0\n    for _ in range(20):\n        w = w - lr * 2 * (w - 3)\n    print(f\"lr={lr}: w = {w:.4f}\")\n",
    "expect": "lr=0.1: w = 2.9424\nlr=0.5: w = 3.0000\nlr=1.1: w = -188.6880",
    "ml": "lr = 0.5 jumps straight to the minimum (factor 0); lr = 1.1 makes the factor −1.2, so it overshoots further every step and diverges."
  },
  {
    "id": "sigmoid-chain",
    "title": "Chain rule through a sigmoid",
    "level": "Core",
    "prompt": "Let $y=\\sigma(3x^2)$ with $\\sigma(z)=1/(1+e^{-z})$. Derive $dy/dx$ with the chain rule and check it numerically at $x=0.5$.",
    "hints": [
      "$\\sigma'(z)=\\sigma(z)(1-\\sigma(z))$ and $\\frac{d}{dx}3x^2=6x$.",
      "Multiply them: $dy/dx=\\sigma(3x^2)(1-\\sigma(3x^2))\\cdot6x$."
    ],
    "solution": "import numpy as np\n\nsig = lambda z: 1 / (1 + np.exp(-z))\ny = lambda x: sig(3 * x**2)\nx = 0.5\nanalytic = sig(3 * x**2) * (1 - sig(3 * x**2)) * 6 * x\nh = 1e-6\nnumeric = (y(x + h) - y(x - h)) / (2 * h)\nprint(round(analytic, 8), round(numeric, 8))\n",
    "expect": "0.65368498 0.65368498"
  },
  {
    "id": "logreg",
    "title": "Logistic regression from scratch",
    "level": "Core",
    "prompt": "Train a logistic regression $p=\\sigma(w\\cdot x+b)$ on the 2D toy data below with gradient descent on the average cross-entropy. Print the loss every 200 epochs and the final accuracy.",
    "hints": [
      "The gradient of the average cross-entropy is $\\frac{1}{n}X^T(p-y)$ for $w$ and $\\text{mean}(p-y)$ for $b$.",
      "Use `lr = 0.5` and 1000 epochs."
    ],
    "solution": "import numpy as np\n\nrng = np.random.default_rng(2)\nX = np.vstack([rng.normal([-1, -1], 0.8, size=(50, 2)), rng.normal([1.5, 1], 0.8, size=(50, 2))])\ny = np.array([0] * 50 + [1] * 50)\nw, b = np.zeros(2), 0.0\nfor epoch in range(1000):\n    p = 1 / (1 + np.exp(-(X @ w + b)))\n    loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))\n    w -= 0.5 * X.T @ (p - y) / len(y)\n    b -= 0.5 * np.mean(p - y)\n    if epoch % 200 == 0:\n        print(epoch, round(loss, 4))\nprint(\"accuracy:\", np.mean((X @ w + b > 0) == y))\n",
    "expect": "0 0.6931\n200 0.0314\n400 0.0244\n600 0.0212\n800 0.0192\naccuracy: 1.0",
    "ml": "this is a one-neuron network; deep nets repeat the same update for every weight."
  },
  {
    "id": "momentum",
    "title": "Momentum on a narrow valley",
    "level": "Core",
    "prompt": "On $L(x,y)=x^2+25y^2$ starting at $(-4,1)$, count the steps needed to reach $L<10^{-6}$ with learning rate $\\eta=0.02$, for plain gradient descent ($\\beta=0$) and for momentum with $\\beta=0.7$ and $\\beta=0.9$.",
    "hints": [
      "Momentum: $v\\leftarrow\\beta v+\\nabla L$, then $p\\leftarrow p-\\eta v$.",
      "$\\nabla L=(2x,\\,50y)$."
    ],
    "solution": "import numpy as np\n\ngrad = lambda p: np.array([2 * p[0], 50 * p[1]])\nloss = lambda p: p[0] ** 2 + 25 * p[1] ** 2\n\ndef run(beta):\n    p, v = np.array([-4.0, 1.0]), np.zeros(2)\n    for t in range(1, 5000):\n        v = beta * v + grad(p)\n        p = p - 0.02 * v\n        if loss(p) < 1e-6:\n            return t\n    return None\n\nfor beta in [0.0, 0.7, 0.9]:\n    print(f\"beta = {beta}: {run(beta)} steps\")\n",
    "expect": "beta = 0.0: 204 steps\nbeta = 0.7: 45 steps\nbeta = 0.9: 150 steps",
    "ml": "momentum (and Adam, which builds on it) is the default in deep learning. Too much momentum overshoots and oscillates, so β is tuned like the learning rate."
  },
  {
    "id": "simpson",
    "title": "Trapezoid vs Simpson",
    "level": "Core",
    "prompt": "Integrate $\\int_0^\\pi\\sin x\\,dx=2$ with the trapezoid rule and Simpson's rule for $n=4,8,16$ intervals. How fast does each error shrink when $n$ doubles?",
    "hints": [
      "Trapezoid: $h\\left(\\frac{f_0+f_n}{2}+\\sum_{i=1}^{n-1}f_i\\right)$.",
      "Simpson: $\\frac{h}{3}\\left(f_0+4\\sum_{\\text{odd}}f_i+2\\sum_{\\text{even}}f_i+f_n\\right)$."
    ],
    "solution": "import numpy as np\n\ndef trap(f, a, b, n):\n    x = np.linspace(a, b, n + 1)\n    h = (b - a) / n\n    return h * (f(x[0]) / 2 + f(x[1:-1]).sum() + f(x[-1]) / 2)\n\ndef simpson(f, a, b, n):\n    x = np.linspace(a, b, n + 1)\n    h = (b - a) / n\n    return h / 3 * (f(x[0]) + 4 * f(x[1:-1:2]).sum() + 2 * f(x[2:-1:2]).sum() + f(x[-1]))\n\nfor n in [4, 8, 16]:\n    print(n, f\"trap err={abs(trap(np.sin, 0, np.pi, n) - 2):.2e}\", f\"simpson err={abs(simpson(np.sin, 0, np.pi, n) - 2):.2e}\")\n",
    "expect": "4 trap err=1.04e-01 simpson err=4.56e-03\n8 trap err=2.58e-02 simpson err=2.69e-04\n16 trap err=6.43e-03 simpson err=1.66e-05",
    "ml": "the trapezoid error drops about 4× per doubling (order $h^2$), Simpson's about 16× (order $h^4$)."
  },
  {
    "id": "two-layer",
    "title": "Backprop through a two-layer network",
    "level": "Challenge",
    "prompt": "For a network $h=\\tanh(W_1x+b_1)$, $\\hat y=W_2h+b_2$ with squared loss, write the forward and backward passes by hand. Verify $\\partial L/\\partial W_1$ with a numerical gradient check.",
    "hints": [
      "Backward: $\\delta_2=2(\\hat y-y)$, $\\partial L/\\partial W_2=\\delta_2h^T$, $\\delta_1=(W_2^T\\delta_2)\\odot(1-h^2)$, $\\partial L/\\partial W_1=\\delta_1x^T$.",
      "Nudge each entry of $W_1$ by $\\pm h$ and compare."
    ],
    "solution": "import numpy as np\n\nrng = np.random.default_rng(0)\nx, y = rng.normal(size=3), np.array([0.5])\nW1, b1 = rng.normal(size=(4, 3)), np.zeros(4)\nW2, b2 = rng.normal(size=(1, 4)), np.zeros(1)\n\ndef loss(W1):\n    h = np.tanh(W1 @ x + b1)\n    return float(np.sum((W2 @ h + b2 - y) ** 2))\n\nh = np.tanh(W1 @ x + b1)\ny_hat = W2 @ h + b2\nd2 = 2 * (y_hat - y)\nd1 = (W2.T @ d2) * (1 - h**2)\ndW1 = np.outer(d1, x)\n\nnum = np.zeros_like(W1)\nfor i in range(W1.shape[0]):\n    for j in range(W1.shape[1]):\n        E = np.zeros_like(W1)\n        E[i, j] = 1e-6\n        num[i, j] = (loss(W1 + E) - loss(W1 - E)) / 2e-6\nprint(\"max difference:\", f\"{np.abs(dW1 - num).max():.1e}\")\nprint(\"gradient check passed:\", np.allclose(dW1, num, atol=1e-6))\n",
    "expect": "max difference: 1.1e-10\ngradient check passed: True",
    "ml": "this is what `loss.backward()` does for you, layer by layer."
  }
]
