// Generated: every solution was run and its real output recorded in `expect`.
import type { Problem } from '../../core/types'

export const PRACTICE: Problem[] = [
  {
    "id": "dice-sum",
    "title": "Two dice: exact and simulated",
    "level": "Warm-up",
    "prompt": "Roll two fair dice. Find $P(\\text{sum}\\ge 10)$ exactly by listing all 36 outcomes, then estimate it from 100 000 simulated rolls.",
    "hints": [
      "`np.add.outer(range(1, 7), range(1, 7))` gives all 36 sums.",
      "`rng.integers(1, 7, size=(n, 2)).sum(axis=1)` simulates n rolls."
    ],
    "solution": "import numpy as np\n\nsums = np.add.outer(np.arange(1, 7), np.arange(1, 7))\nexact = (sums >= 10).mean()\nrng = np.random.default_rng(0)\nrolls = rng.integers(1, 7, size=(100_000, 2)).sum(axis=1)\nprint(\"exact    :\", round(exact, 4))\nprint(\"simulated:\", round((rolls >= 10).mean(), 4))\n",
    "expect": "exact    : 0.1667\nsimulated: 0.1656"
  },
  {
    "id": "loaded-die",
    "title": "Mean and variance of a loaded die",
    "level": "Warm-up",
    "prompt": "A die shows 6 with probability 0.5 and each other face with probability 0.1. Compute $E[X]$ and $\\mathrm{Var}(X)$ from the PMF, without sampling.",
    "hints": [
      "$E[X]=\\sum_x x\\,p(x)$.",
      "$\\mathrm{Var}(X)=E[X^2]-E[X]^2$."
    ],
    "solution": "import numpy as np\n\nx = np.arange(1, 7)\np = np.array([0.1, 0.1, 0.1, 0.1, 0.1, 0.5])\nmean = np.sum(x * p)\nvar = np.sum(x**2 * p) - mean**2\nprint(\"E[X] =\", round(mean, 4))\nprint(\"Var(X) =\", round(var, 4))\n",
    "expect": "E[X] = 4.5\nVar(X) = 3.25"
  },
  {
    "id": "bayes-test",
    "title": "A positive medical test",
    "level": "Core",
    "prompt": "A disease affects 1% of people. A test catches 95% of real cases and gives a false positive for 5% of healthy people. You test positive. What is the probability you have the disease?",
    "hints": [
      "Bayes: $P(D\\mid+)=\\frac{P(+\\mid D)P(D)}{P(+)}$.",
      "$P(+)=P(+\\mid D)P(D)+P(+\\mid\\neg D)P(\\neg D)$."
    ],
    "solution": "p_d = 0.01\np_pos_d = 0.95\np_pos_h = 0.05\np_pos = p_pos_d * p_d + p_pos_h * (1 - p_d)\nprint(\"P(disease | positive) =\", round(p_pos_d * p_d / p_pos, 4))\n",
    "expect": "P(disease | positive) = 0.161",
    "ml": "this base-rate effect is why a classifier for a rare class can have high accuracy and still be mostly wrong when it says yes."
  },
  {
    "id": "binomial",
    "title": "Binomial PMF from scratch",
    "level": "Core",
    "prompt": "Write `binom_pmf(n, k, p)` using `math.comb`. For $n=10,p=0.3$ check the PMF sums to 1, find the mean, and compute $P(X\\ge 5)$.",
    "hints": [
      "$\\binom{n}{k}p^k(1-p)^{n-k}$.",
      "The mean should equal $np$."
    ],
    "solution": "import numpy as np\nfrom math import comb\n\ndef binom_pmf(n, k, p):\n    return comb(n, k) * p**k * (1 - p) ** (n - k)\n\nn, p = 10, 0.3\npmf = np.array([binom_pmf(n, k, p) for k in range(n + 1)])\nprint(\"sum =\", round(pmf.sum(), 6))\nprint(\"mean =\", round(np.sum(np.arange(n + 1) * pmf), 6))\nprint(\"P(X >= 5) =\", round(pmf[5:].sum(), 4))\n",
    "expect": "sum = 1.0\nmean = 3.0\nP(X >= 5) = 0.1503",
    "ml": "the number of clicks out of n impressions is binomial."
  },
  {
    "id": "softmax",
    "title": "Softmax and cross-entropy",
    "level": "Core",
    "prompt": "Write a numerically stable `softmax(z)` and `cross_entropy(probs, label)`. Apply them to the logits `[2.0, 1.0, 0.1]` with true class 0. Then show the naive softmax overflows on `[1000, 1001]` while yours does not.",
    "hints": [
      "Subtract `z.max()` before `np.exp`; the result is unchanged.",
      "Cross-entropy is $-\\log p_{\\text{label}}$."
    ],
    "solution": "import numpy as np\n\ndef softmax(z):\n    e = np.exp(z - z.max())\n    return e / e.sum()\n\ndef cross_entropy(probs, label):\n    return -np.log(probs[label])\n\nz = np.array([2.0, 1.0, 0.1])\np = softmax(z)\nprint(\"probs:\", np.round(p, 4), \"sum\", round(p.sum(), 6))\nprint(\"loss :\", round(cross_entropy(p, 0), 4))\nwith np.errstate(over=\"ignore\", invalid=\"ignore\"):\n    big = np.array([1000.0, 1001.0])\n    naive = np.exp(big) / np.exp(big).sum()\nprint(\"naive:\", naive, \" stable:\", np.round(softmax(big), 4))\n",
    "expect": "probs: [0.659  0.2424 0.0986] sum 1.0\nloss : 0.417\nnaive: [nan nan]  stable: [0.2689 0.7311]",
    "ml": "every classifier's last layer is a softmax trained with cross-entropy."
  },
  {
    "id": "categorical",
    "title": "Sampling a categorical distribution",
    "level": "Core",
    "prompt": "Sample 50 000 draws from the classes `[cat, dog, bird]` with probabilities `[0.5, 0.3, 0.2]` using only `rng.uniform` and a cumulative sum. Print the observed frequencies.",
    "hints": [
      "`cdf = np.cumsum(p)` gives `[0.5, 0.8, 1.0]`.",
      "`np.searchsorted(cdf, u)` returns which bucket each uniform number falls in."
    ],
    "solution": "import numpy as np\n\np = np.array([0.5, 0.3, 0.2])\ncdf = np.cumsum(p)\nrng = np.random.default_rng(1)\nu = rng.uniform(size=50_000)\ndraws = np.searchsorted(cdf, u)\nprint(\"frequencies:\", np.round(np.bincount(draws, minlength=3) / len(draws), 3))\n",
    "expect": "frequencies: [0.5   0.299 0.201]",
    "ml": "language models pick the next token exactly this way."
  },
  {
    "id": "naive-bayes",
    "title": "Naive Bayes spam filter",
    "level": "Challenge",
    "prompt": "Train a Naive Bayes classifier on the six tiny messages below. Use word counts with Laplace smoothing (add 1). Classify `\"win free money\"` and `\"see you at lunch\"`. Work in log-probabilities.",
    "hints": [
      "$\\log P(c)+\\sum_w\\log P(w\\mid c)$ for each class $c$; pick the larger.",
      "$P(w\\mid c)=\\frac{\\text{count}(w,c)+1}{\\text{total words in }c+|V|}$."
    ],
    "solution": "import numpy as np\nfrom collections import Counter\n\ntrain = [(\"win money now\", 1), (\"free money offer\", 1), (\"win a free prize\", 1),\n         (\"lunch at noon\", 0), (\"see you at the meeting\", 0), (\"project meeting notes\", 0)]\nvocab = sorted({w for text, _ in train for w in text.split()})\ncounts = {c: Counter() for c in (0, 1)}\ndocs = Counter()\nfor text, c in train:\n    counts[c].update(text.split())\n    docs[c] += 1\n\ndef log_score(text, c):\n    total = sum(counts[c].values())\n    s = np.log(docs[c] / len(train))\n    for w in text.split():\n        s += np.log((counts[c][w] + 1) / (total + len(vocab)))\n    return s\n\nfor msg in [\"win free money\", \"see you at lunch\"]:\n    s1, s0 = log_score(msg, 1), log_score(msg, 0)\n    p_spam = 1 / (1 + np.exp(s0 - s1))\n    print(f\"{msg!r}: P(spam) = {p_spam:.3f}\")\n",
    "expect": "'win free money': P(spam) = 0.968\n'see you at lunch': P(spam) = 0.046"
  },
  {
    "id": "cholesky",
    "title": "Correlated Gaussian samples",
    "level": "Challenge",
    "prompt": "Draw 20 000 samples from a 2D Gaussian with mean $(1,-2)$ and covariance $\\Sigma=\\begin{bmatrix}2&1.2\\\\1.2&1\\end{bmatrix}$ using only standard normals and a Cholesky factor. Check the sample mean and covariance.",
    "hints": [
      "If $z\\sim N(0,I)$ and $\\Sigma=LL^T$, then $\\mu+Lz\\sim N(\\mu,\\Sigma)$.",
      "`np.linalg.cholesky(S)` returns L; `np.cov(X, rowvar=False)` checks the result."
    ],
    "solution": "import numpy as np\n\nmu = np.array([1.0, -2.0])\nS = np.array([[2.0, 1.2], [1.2, 1.0]])\nL = np.linalg.cholesky(S)\nrng = np.random.default_rng(0)\nZ = rng.normal(size=(20_000, 2))\nX = mu + Z @ L.T\nprint(\"mean:\", np.round(X.mean(axis=0), 2))\nprint(\"cov :\\n\", np.round(np.cov(X, rowvar=False), 2))\n",
    "expect": "mean: [ 1.01 -2.  ]\ncov :\n [[2.01 1.2 ]\n [1.2  1.  ]]",
    "ml": "the reparameterisation trick in variational autoencoders is this same $\\mu+Lz$ step."
  }
]
