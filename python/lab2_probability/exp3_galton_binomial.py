import numpy as np
from math import comb


def galton(n_rows, n_balls, p=0.5, seed=0):
    """Drop balls through n_rows of pegs. Each peg: right with probability p."""
    rng = np.random.default_rng(seed)
    bins = np.zeros(n_rows + 1, dtype=int)
    for _ in range(n_balls):
        k = 0  # number of right bounces so far
        for _ in range(n_rows):
            if rng.uniform() < p:  # one Bernoulli(p) trial
                k += 1
        bins[k] += 1  # the ball lands in bin k
    return bins


def binomial_pmf(n, k, p):
    return comb(n, k) * p**k * (1 - p) ** (n - k)


if __name__ == "__main__":
    n, balls = 8, 20_000
    bins = galton(n, balls)
    for k in range(n + 1):
        print(f"bin {k}: simulated {bins[k] / balls:.4f}   binomial {binomial_pmf(n, k, 0.5):.4f}")
    assert np.allclose(bins / balls, [binomial_pmf(n, k, 0.5) for k in range(n + 1)], atol=0.01)
