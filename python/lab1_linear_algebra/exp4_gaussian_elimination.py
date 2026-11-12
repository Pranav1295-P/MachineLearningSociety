import numpy as np


def solve(A, b):
    """Solve A x = b with Gaussian elimination and back substitution."""
    A = A.astype(float).copy()
    b = b.astype(float).copy()
    n = len(b)
    for col in range(n):
        pivot = col + np.argmax(np.abs(A[col:, col]))  # biggest entry = safest pivot
        A[[col, pivot]] = A[[pivot, col]]
        b[[col, pivot]] = b[[pivot, col]]
        for row in range(col + 1, n):
            factor = A[row, col] / A[col, col]
            A[row] = A[row] - factor * A[col]  # knock out the entry below the pivot
            b[row] = b[row] - factor * b[col]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (b[i] - A[i, i + 1 :] @ x[i + 1 :]) / A[i, i]  # back substitution
    return x


if __name__ == "__main__":
    A = np.array([[1.0, 1.0, 1.0], [2.0, -1.0, 1.0], [1.0, 2.0, -1.0]])
    b = np.array([4.0, 3.0, 1.0])
    x = solve(A, b)
    assert np.allclose(x, np.linalg.solve(A, b))
    assert np.allclose(A @ x, b)
    print("x from scratch     =", np.round(x, 6))
    print("np.linalg.solve    =", np.round(np.linalg.solve(A, b), 6))
