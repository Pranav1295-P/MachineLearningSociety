def newton_root(f, df, x0, steps=6):
    """Newton's method: slide down the tangent line to where it hits zero."""
    x = x0
    history = [x]
    for _ in range(steps):
        x = x - f(x) / df(x)  # root of the tangent line at x
        history.append(x)
    return x, history


if __name__ == "__main__":
    f = lambda x: x**2 - 2  # root is sqrt(2)
    df = lambda x: 2 * x
    root, hist = newton_root(f, df, x0=3.0)
    for i, x in enumerate(hist):
        print(f"step {i}: x = {x:.12f}   error = {abs(x - 2 ** 0.5):.2e}")
    assert abs(root - 2**0.5) < 1e-12
