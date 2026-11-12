import numpy as np


def riemann(f, a, b, n):
    """Area under f from a to b, using n thin rectangles (midpoint rule)."""
    dx = (b - a) / n
    total = 0.0
    for i in range(n):
        x_mid = a + (i + 0.5) * dx  # middle of strip i
        total += f(x_mid) * dx  # strip area = height x width
    return total


def normal_pdf(x):
    return np.exp(-(x**2) / 2) / np.sqrt(2 * np.pi)


if __name__ == "__main__":
    exact = 0.682689492137  # P(-1 < Z < 1) for a standard normal
    for n in [2, 4, 8, 16, 64]:
        area = riemann(normal_pdf, -1, 1, n)
        print(f"n = {n:>2}: area = {area:.6f}   error = {abs(area - exact):.2e}")
    assert abs(riemann(normal_pdf, -1, 1, 64) - exact) < 1e-4
