import numpy as np


def sigmoid(z):
    return 1 / (1 + np.exp(-z))


def forward_backward(x, y, w, b):
    """One neuron, one example: forward pass, then the chain rule backwards."""
    # forward pass: compute every node, left to right
    z = w * x + b
    a = sigmoid(z)
    loss = (a - y) ** 2
    # backward pass: multiply local derivatives, right to left
    dloss_da = 2 * (a - y)
    da_dz = a * (1 - a)  # derivative of the sigmoid
    dloss_dz = dloss_da * da_dz
    dloss_dw = dloss_dz * x  # dz/dw = x
    dloss_db = dloss_dz * 1.0  # dz/db = 1
    return loss, dloss_dw, dloss_db


if __name__ == "__main__":
    x, y, w, b = 1.5, 1.0, 0.8, -0.5
    loss, dw, db = forward_backward(x, y, w, b)
    h = 1e-6
    num_dw = (forward_backward(x, y, w + h, b)[0] - forward_backward(x, y, w - h, b)[0]) / (2 * h)
    num_db = (forward_backward(x, y, w, b + h)[0] - forward_backward(x, y, w, b - h)[0]) / (2 * h)
    assert np.isclose(dw, num_dw) and np.isclose(db, num_db), "gradient check"
    print(f"loss = {loss:.6f}")
    print(f"dloss/dw = {dw:.6f} (numeric {num_dw:.6f})")
    print(f"dloss/db = {db:.6f} (numeric {num_db:.6f})")
