import numpy as np
from math import lgamma


def beta_pdf(p, a, b):
    """Density of Beta(a, b) at p, using log-gamma for stability."""
    log_norm = lgamma(a + b) - lgamma(a) - lgamma(b)
    return np.exp(log_norm + (a - 1) * np.log(p) + (b - 1) * np.log(1 - p))


def update(a, b, flips):
    """Bayesian updating of a coin's bias. Prior Beta(a, b); each flip is 1 (heads) or 0."""
    history = [(a, b)]
    for f in flips:
        if f == 1:
            a += 1  # heads: one more vote for a large p
        else:
            b += 1  # tails: one more vote for a small p
        history.append((a, b))  # posterior is Beta(a, b) again
    return history


if __name__ == "__main__":
    rng = np.random.default_rng(3)
    flips = (rng.uniform(size=60) < 0.7).astype(int)  # a coin that lands heads 70% of the time
    hist = update(2, 2, flips)
    a, b = hist[-1]
    print(f"after {len(flips)} flips: Beta({a}, {b}), posterior mean = {a / (a + b):.3f}")
    grid = np.linspace(0.001, 0.999, 2001)
    area = np.trapezoid(beta_pdf(grid, a, b), grid)
    assert abs(area - 1) < 1e-3, "a density integrates to 1"
