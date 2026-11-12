import numpy as np


def pca(X, k):
    """Principal component analysis from linear algebra building blocks."""
    mean = X.mean(axis=0)
    Xc = X - mean  # 1. centre the cloud on the origin
    C = (Xc.T @ Xc) / (len(X) - 1)  # 2. covariance matrix
    vals, vecs = np.linalg.eigh(C)  # 3. eigenvectors = directions of spread
    order = np.argsort(vals)[::-1]  # 4. biggest variance first
    vals, vecs = vals[order], vecs[:, order]
    W = vecs[:, :k]  # 5. keep the top-k directions
    Z = Xc @ W  # 6. project every point onto them
    explained = vals[:k] / vals.sum()
    return Z, W, explained


if __name__ == "__main__":
    rng = np.random.default_rng(7)
    latent = rng.normal(size=(200, 3)) * np.array([3.0, 1.2, 0.3])
    R = np.linalg.qr(rng.normal(size=(3, 3)))[0]
    X = latent @ R.T + np.array([2.0, -1.0, 0.5])
    Z, W, explained = pca(X, 2)
    C = np.cov(X, rowvar=False)
    assert np.allclose((X - X.mean(0)).T @ (X - X.mean(0)) / (len(X) - 1), C)
    U, S, Vt = np.linalg.svd(X - X.mean(0), full_matrices=False)
    assert np.allclose(np.abs(W), np.abs(Vt[:2].T)), "matches the SVD directions"
    print("explained variance ratio:", np.round(explained, 4))
    print("projected shape:", Z.shape)
