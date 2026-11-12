import numpy as np


def power_iteration(A, steps=12, seed=0):
    """Find the biggest eigenvalue and its eigenvector by repeated multiplying."""
    rng = np.random.default_rng(seed)
    v = rng.normal(size=A.shape[0])
    v = v / np.sqrt(v @ v)  # start: a random unit vector
    for _ in range(steps):
        w = A @ v  # let the matrix act on v
        v = w / np.sqrt(w @ w)  # rescale to length 1
        lam = v @ A @ v  # Rayleigh quotient = eigenvalue estimate
    return lam, v


if __name__ == "__main__":
    A = np.array([[2.0, 1.0], [1.0, 3.0]])
    lam, v = power_iteration(A, steps=40)
    vals, vecs = np.linalg.eigh(A)
    assert np.isclose(lam, vals.max())
    assert np.isclose(abs(v @ vecs[:, np.argmax(vals)]), 1.0)
    print(f"power iteration: lambda = {lam:.6f}, v = {np.round(v, 6)}")
    print(f"numpy eigh     : lambda = {vals.max():.6f}, v = {np.round(vecs[:, np.argmax(vals)], 6)}")
