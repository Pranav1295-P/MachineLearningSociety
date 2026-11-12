import numpy as np


def loss(p):
    x, y = p
    return x**2 + 3 * y**2  # a long, narrow bowl


def grad(p):
    x, y = p
    return np.array([2 * x, 6 * y])  # partial derivatives: dL/dx, dL/dy


def gradient_descent(grad, start, lr=0.1, steps=25):
    p = np.array(start, dtype=float)
    path = [p.copy()]
    for _ in range(steps):
        g = grad(p)  # direction of steepest climb
        p = p - lr * g  # step the other way, downhill
        path.append(p.copy())
    return np.array(path)


if __name__ == "__main__":
    for lr in [0.02, 0.1, 0.3, 0.34]:
        path = gradient_descent(grad, [2.5, 1.5], lr=lr)
        print(f"lr = {lr:<4}: final point {np.round(path[-1], 4)}   loss {loss(path[-1]):.6f}")
    assert loss(gradient_descent(grad, [2.5, 1.5], lr=0.1)[-1]) < 1e-3
