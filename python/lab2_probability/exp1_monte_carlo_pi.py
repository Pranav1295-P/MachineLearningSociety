import numpy as np


def estimate_pi(n, seed=0):
    """Throw n random darts at a 2x2 square; count the ones inside the circle."""
    rng = np.random.default_rng(seed)
    inside = 0
    for _ in range(n):
        x, y = rng.uniform(-1, 1, size=2)  # a dart lands uniformly in the square
        if x * x + y * y <= 1.0:  # inside the unit circle?
            inside += 1
    # P(inside) = circle area / square area = pi / 4
    return 4 * inside / n


if __name__ == "__main__":
    for n in [10, 100, 1_000, 20_000]:
        est = estimate_pi(n)
        print(f"n = {n:>6}: pi ~ {est:.4f}   error = {abs(est - np.pi):.4f}")
    assert abs(estimate_pi(20_000) - np.pi) < 0.05
