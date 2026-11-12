import numpy as np


def gram_schmidt(V):
    """Turn the columns of V into orthonormal columns Q (same span)."""
    n, k = V.shape
    Q = np.zeros((n, k))
    for j in range(k):
        v = V[:, j].astype(float)
        for i in range(j):
            q = Q[:, i]
            v = v - (q @ v) * q  # remove the part of v that points along q
        length = np.sqrt(v @ v)
        Q[:, j] = v / length  # stretch what is left to length 1
    return Q


if __name__ == "__main__":
    V = np.array([[2.0, 1.0, 0.5], [0.5, 2.0, 0.0], [0.0, 0.5, 2.0]])
    Q = gram_schmidt(V)
    assert np.allclose(Q.T @ Q, np.eye(3)), "columns must be orthonormal"
    Qn, R = np.linalg.qr(V)
    assert np.allclose(np.abs(Q), np.abs(Qn)), "same basis as numpy QR (up to sign)"
    print("Q =\n", np.round(Q, 4))
    print("Q.T @ Q =\n", np.round(Q.T @ Q, 6))
