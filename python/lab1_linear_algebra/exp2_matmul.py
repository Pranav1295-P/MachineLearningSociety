import numpy as np


def matmul(A, B):
    """Matrix multiplication from scratch with three loops."""
    n, k = A.shape
    k2, m = B.shape
    assert k == k2, "inner dimensions must match"
    C = np.zeros((n, m))
    for i in range(n):  # every row of A
        for j in range(m):  # every column of B
            s = 0.0
            for t in range(k):  # walk along row i and column j together
                s += A[i, t] * B[t, j]
            C[i, j] = s  # C[i, j] = row i . column j
    return C


if __name__ == "__main__":
    A = np.array([[1.0, 2.0, 0.0], [-1.0, 3.0, 1.0]])
    B = np.array([[2.0, 1.0], [0.0, -1.0], [4.0, 2.0]])
    C = matmul(A, B)
    assert np.allclose(C, A @ B)
    rng = np.random.default_rng(0)
    X, Y = rng.normal(size=(5, 4)), rng.normal(size=(4, 3))
    assert np.allclose(matmul(X, Y), X @ Y)
    print("A @ B from scratch:\n", C)
    print("numpy A @ B:\n", A @ B)
