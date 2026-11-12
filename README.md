# MachineLearningSociety - Mathematics for Machine Learning Lab

Three interactive 3D labs for the maths behind machine learning. Every algorithm runs on a 3D lab bench, step by step, next to the NumPy code that does it, written from scratch.

| Lab | Room | Theory | Experiments (NumPy from scratch) | Workbench |
| --- | --- | --- | --- | --- |
| **1 · Linear Algebra** | LA-101 | vectors, dot product, matrices as transformations, determinant, Ax = b and least squares, eigenvectors | dot product & projection, matrix multiplication, Gram–Schmidt, Gaussian elimination, power iteration, PCA | type any 3×3 matrix and watch space morph; det, eigenvectors, Mx |
| **2 · Probability & Distributions** | PR-102 | events, expectation & variance, Bayes, Bernoulli/binomial/Poisson, the normal, the 2D Gaussian | Monte Carlo π, inverse-transform sampling, Galton board → binomial, central limit theorem, maximum likelihood, Bayesian updating | distribution explorer (8 distributions, sample vs theory) and a 2D Gaussian |
| **3 · Calculus** | CA-103 | derivative, chain rule, gradient, gradient descent, curvature & saddles, integrals | finite differences, gradient descent, Newton's method, Riemann sums, backpropagation, linear regression by GD | optimiser race: GD vs momentum vs Adam on four loss landscapes |

## How a lab session runs

Each lab has five sections, like a college lab record:

- **Theory** – guided 3D lessons, the key formula, where ML uses it, and a check question.
- **Experiments** – Aim, Apparatus, Theory, Procedure (the real Python file with the running line lit), live variables, an Observation table that fills as you step, Result and Viva voce questions.
- **Workbench** – an open bench to play with.
- **Practice** – 8 NumPy problems per lab with hints and solutions.
- **Reference** – formula sheet: maths, NumPy and the ML use.

Keys: `←` `→` step, `space` play/pause. Drag the bench to orbit, scroll to zoom.

## Run it

```bash
npm install
./scripts/icloud-nosync.sh   # only if the folder is in iCloud Drive (keeps node_modules out of sync)
npm run dev                   # http://localhost:5274
```

```bash
npm test      # every step points at a real Python line; every practice solution prints what the page says
npm run py    # run all 18 experiments; each checks its from-scratch result against NumPy
```

## Layout

```
python/                  the 18 experiments, one file each, with a NumPy self-check
src/core/                types, maths helpers, Python-source loader, KaTeX text
src/stage/               the 3D lab bench (Three.js via React Three Fiber) and its primitives
src/ui/                  pages, step player, code panel, observation table
src/labs/<lab>/          lessons, experiments, workbench, practice, reference for each lab
```

The code shown in the app is read straight from `python/`, so the page and the files never drift apart. Each experiment's TypeScript twin replays the same algorithm and describes every step as a scene (arrows, planes, surfaces, bars, point clouds); the stage animates from one scene to the next.

## Stack

React, TypeScript, Three.js, React Three Fiber, Drei, KaTeX and Vite. Python 3 with NumPy for the experiments.
