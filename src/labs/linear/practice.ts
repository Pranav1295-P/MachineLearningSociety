// Generated: every solution was run and its real output recorded in `expect`.
import type { Problem } from '../../core/types'

export const PRACTICE: Problem[] = [
  {
    "id": "norm",
    "title": "Length and unit vector",
    "level": "Warm-up",
    "prompt": "Write `norm(v)` without `np.linalg`. Use it to turn $v=(3,4,12)$ into a unit vector $u=v/|v|$ and confirm $|u|=1$.",
    "hints": [
      "$|v|=\\sqrt{v\\cdot v}$.",
      "Divide every entry by the length."
    ],
    "solution": "import numpy as np\n\ndef norm(v):\n    return np.sqrt(sum(x * x for x in v))\n\nv = np.array([3.0, 4.0, 12.0])\nu = v / norm(v)\nprint(norm(v))\nprint(np.round(u, 4))\nprint(round(float(norm(u)), 6))\n",
    "expect": "13.0\n[0.2308 0.3077 0.9231]\n1.0",
    "ml": "feature vectors are often normalised to unit length before computing similarities."
  },
  {
    "id": "cosine-rank",
    "title": "Rank documents by cosine similarity",
    "level": "Warm-up",
    "prompt": "Three documents are word-count vectors over the vocabulary `[ml, math, cricket, python]`. Rank them by cosine similarity to the query `[1, 1, 0, 1]`.",
    "hints": [
      "Compute $\\frac{q\\cdot d}{|q||d|}$ for each document.",
      "`np.argsort(-scores)` gives the order from best to worst."
    ],
    "solution": "import numpy as np\n\ndocs = np.array([[4, 3, 0, 5],    # a machine learning tutorial\n                 [0, 1, 6, 0],    # a cricket report\n                 [2, 6, 0, 0]])   # a maths lecture\nq = np.array([1, 1, 0, 1])\nscores = docs @ q / (np.linalg.norm(docs, axis=1) * np.linalg.norm(q))\nprint(np.round(scores, 3))\nprint(\"ranking:\", np.argsort(-scores))\n",
    "expect": "[0.98  0.095 0.73 ]\nranking: [0 2 1]",
    "ml": "this is how retrieval systems pick which passages to show a language model."
  },
  {
    "id": "matvec",
    "title": "Matrix-vector product, one loop",
    "level": "Core",
    "prompt": "Write `matvec(A, x)` using a single loop over the rows of `A` (use `@` only for a row·vector dot product). Check it against `A @ x`.",
    "hints": [
      "Entry $i$ of $Ax$ is row $i$ of $A$ dotted with $x$.",
      "Preallocate `y = np.zeros(A.shape[0])`."
    ],
    "solution": "import numpy as np\n\ndef matvec(A, x):\n    y = np.zeros(A.shape[0])\n    for i in range(A.shape[0]):\n        y[i] = A[i] @ x\n    return y\n\nA = np.array([[2.0, 0.0, 1.0], [1.0, 3.0, -1.0]])\nx = np.array([1.0, 2.0, 3.0])\nprint(matvec(A, x))\nprint(np.allclose(matvec(A, x), A @ x))\n",
    "expect": "[5. 4.]\nTrue"
  },
  {
    "id": "cofactor-det",
    "title": "Determinant by cofactor expansion",
    "level": "Core",
    "prompt": "Write a recursive `det(M)` that expands along the first row. Test it on a 3×3 and a 4×4 matrix against `np.linalg.det`. Why is this a bad idea for large matrices?",
    "hints": [
      "Base case: a 1×1 matrix. Minor $M_{0j}$ = delete row 0 and column $j$ (`np.delete`).",
      "Signs alternate: $(-1)^j$. The cost grows like $n!$; elimination is $O(n^3)$."
    ],
    "solution": "import numpy as np\n\ndef det(M):\n    n = M.shape[0]\n    if n == 1:\n        return M[0, 0]\n    total = 0.0\n    for j in range(n):\n        minor = np.delete(np.delete(M, 0, axis=0), j, axis=1)\n        total += (-1) ** j * M[0, j] * det(minor)\n    return total\n\nA = np.array([[2.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 4.0]])\nB = np.array([[1.0, 2.0, 0.0, 1.0], [0.0, 1.0, 3.0, 2.0], [2.0, 0.0, 1.0, 1.0], [1.0, 1.0, 1.0, 0.0]])\nprint(round(det(A), 6), round(np.linalg.det(A), 6))\nprint(round(det(B), 6), round(np.linalg.det(B), 6))\n",
    "expect": "18.0 18.0\n-15.0 -15.0"
  },
  {
    "id": "normal-eq",
    "title": "Linear regression with the normal equations",
    "level": "Core",
    "prompt": "Fit $y\\approx w_0+w_1x$ to the data below by solving $X^TXw=X^Ty$ with `np.linalg.solve`. Add a column of ones for the intercept. Print the weights and the mean squared error.",
    "hints": [
      "Build `X = np.column_stack([np.ones_like(x), x])`.",
      "Never compute `np.linalg.inv(X.T @ X)`; solve the system instead."
    ],
    "solution": "import numpy as np\n\nx = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0])\ny = np.array([2.1, 3.9, 6.2, 7.8, 10.1, 12.2])\nX = np.column_stack([np.ones_like(x), x])\nw = np.linalg.solve(X.T @ X, X.T @ y)\nmse = np.mean((X @ w - y) ** 2)\nprint(\"w =\", np.round(w, 4))\nprint(\"mse =\", round(mse, 4))\n",
    "expect": "w = [-0.02  2.02]\nmse = 0.0213",
    "ml": "this is exactly what `sklearn.linear_model.LinearRegression` computes (via a more stable factorisation)."
  },
  {
    "id": "markov",
    "title": "Steady state of a Markov chain",
    "level": "Core",
    "prompt": "Weather moves between Sunny, Cloudy and Rainy with the transition matrix `P` below (row = today, column = tomorrow). Find the long-run share of each weather by power iteration on $P^T$, and check it is an eigenvector with eigenvalue 1.",
    "hints": [
      "The distribution evolves as $\\pi_{t+1}=\\pi_tP$, i.e. $\\pi_{t+1}^T=P^T\\pi_t^T$.",
      "Start from `[1, 0, 0]` and iterate about 100 times; keep the entries summing to 1."
    ],
    "solution": "import numpy as np\n\nP = np.array([[0.7, 0.2, 0.1],\n              [0.3, 0.4, 0.3],\n              [0.2, 0.3, 0.5]])\npi = np.array([1.0, 0.0, 0.0])\nfor _ in range(100):\n    pi = P.T @ pi\n    pi = pi / pi.sum()\nprint(\"steady state:\", np.round(pi, 4))\nprint(\"pi P == pi:\", np.allclose(pi @ P, pi))\n",
    "expect": "steady state: [0.4565 0.2826 0.2609]\npi P == pi: True",
    "ml": "PageRank is the same computation on the web's link graph."
  },
  {
    "id": "deflation",
    "title": "Top two eigenvectors by deflation",
    "level": "Challenge",
    "prompt": "Use power iteration to get the top eigenpair of the symmetric matrix `A`. Then deflate, $A_2=A-\\lambda_1u_1u_1^T$, and run power iteration again to get the second pair. Compare with `np.linalg.eigh`.",
    "hints": [
      "Write `power(A, iters)` that returns `(lam, v)` with `lam = v @ A @ v`.",
      "`np.outer(u, u)` builds $uu^T$."
    ],
    "solution": "import numpy as np\n\ndef power(A, iters=500):\n    v = np.ones(A.shape[0]) / np.sqrt(A.shape[0])\n    for _ in range(iters):\n        w = A @ v\n        v = w / np.linalg.norm(w)\n    return v @ A @ v, v\n\nA = np.array([[4.0, 1.0, 0.5], [1.0, 3.0, 0.2], [0.5, 0.2, 1.0]])\nl1, u1 = power(A)\nl2, u2 = power(A - l1 * np.outer(u1, u1))\nvals = np.linalg.eigh(A)[0][::-1]\nprint(\"power:\", round(l1, 5), round(l2, 5))\nprint(\"eigh :\", round(vals[0], 5), round(vals[1], 5))\nprint(\"u1 . u2 =\", round(abs(u1 @ u2), 6))\n",
    "expect": "power: 4.69428 2.38765\neigh : 4.69428 2.38765\nu1 . u2 = 0.0"
  },
  {
    "id": "pca-recon",
    "title": "How many components do you need?",
    "level": "Challenge",
    "prompt": "Generate 300 points in 5D that really live near a 2D plane (code below). Run PCA from scratch and print, for $k=1\\dots5$, the explained variance ratio and the mean squared reconstruction error $|X_c-X_cWW^T|^2/n$.",
    "hints": [
      "Reconstruct with `Xc @ W @ W.T`.",
      "The error for $k$ components equals the sum of the dropped eigenvalues times $(n-1)/n$."
    ],
    "solution": "import numpy as np\n\nrng = np.random.default_rng(0)\nZ = rng.normal(size=(300, 2)) * [3.0, 1.5]\nX = Z @ rng.normal(size=(2, 5)) + 0.1 * rng.normal(size=(300, 5))\n\nXc = X - X.mean(axis=0)\nvals, vecs = np.linalg.eigh(Xc.T @ Xc / (len(X) - 1))\nvals, vecs = vals[::-1], vecs[:, ::-1]\nfor k in range(1, 6):\n    W = vecs[:, :k]\n    err = np.sum((Xc - Xc @ W @ W.T) ** 2) / len(X)\n    print(k, \"explained\", round(vals[:k].sum() / vals.sum(), 4), \"error\", round(err, 4))\n",
    "expect": "1 explained 0.9793 error 1.7279\n2 explained 0.9996 error 0.0303\n3 explained 0.9998 error 0.0183\n4 explained 0.9999 error 0.0087\n5 explained 1.0 error 0.0",
    "ml": "choosing the size of an embedding or bottleneck layer follows the same trade-off."
  }
]
