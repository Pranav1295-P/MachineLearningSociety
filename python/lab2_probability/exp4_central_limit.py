import numpy as np


def sample_means(n, trials, seed=0):
    """Roll n fair dice, record the average. Repeat many times."""
    rng = np.random.default_rng(seed)
    means = np.empty(trials)
    for t in range(trials):
        rolls = rng.integers(1, 7, size=n)  # n dice, each 1..6
        means[t] = rolls.mean()
    return means


if __name__ == "__main__":
    mu, var = 3.5, 35 / 12  # one die: mean 3.5, variance 35/12
    for n in [1, 2, 5, 30]:
        m = sample_means(n, 20_000)
        print(f"n = {n:>2}: mean {m.mean():.3f} (3.5)   std {m.std():.3f} ({np.sqrt(var / n):.3f})")
    assert abs(sample_means(30, 20_000).std() - np.sqrt(var / 30)) < 0.01
