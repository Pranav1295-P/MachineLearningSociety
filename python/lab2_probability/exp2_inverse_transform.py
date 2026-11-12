import numpy as np


def sample_exponential(lam, n, seed=0):
    """Inverse transform sampling: uniform numbers in, exponential numbers out."""
    rng = np.random.default_rng(seed)
    samples = []
    for _ in range(n):
        u = rng.uniform()  # a random height on the CDF, between 0 and 1
        x = -np.log(1.0 - u) / lam  # solve F(x) = u where F(x) = 1 - exp(-lam x)
        samples.append(x)
    return np.array(samples)


if __name__ == "__main__":
    lam = 1.5
    x = sample_exponential(lam, 50_000)
    print(f"sample mean = {x.mean():.4f}   theory 1/lam = {1 / lam:.4f}")
    print(f"sample var  = {x.var():.4f}   theory 1/lam^2 = {1 / lam**2:.4f}")
    assert abs(x.mean() - 1 / lam) < 0.02
