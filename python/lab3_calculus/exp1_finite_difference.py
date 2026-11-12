import numpy as np


def f(x):
    return np.sin(x) + 0.3 * x**2


def secant_slopes(f, x, hs):
    """Slope of the secant line through (x, f(x)) and (x + h, f(x + h)) as h shrinks."""
    slopes = []
    for h in hs:
        rise = f(x + h) - f(x)
        slope = rise / h  # rise over run
        slopes.append(slope)
    return slopes


def derivative(f, x, h=1e-5):
    """Central difference: average of a step forward and a step back. Error ~ h^2."""
    return (f(x + h) - f(x - h)) / (2 * h)


if __name__ == "__main__":
    x0 = 1.0
    exact = np.cos(x0) + 0.6 * x0
    for h, s in zip([2.0, 1.0, 0.5, 0.1, 0.01], secant_slopes(f, x0, [2.0, 1.0, 0.5, 0.1, 0.01])):
        print(f"h = {h:<5} secant slope = {s:.5f}   error = {abs(s - exact):.5f}")
    print(f"central difference = {derivative(f, x0):.8f}   exact = {exact:.8f}")
    assert abs(derivative(f, x0) - exact) < 1e-8
