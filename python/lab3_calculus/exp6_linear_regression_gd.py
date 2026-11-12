import numpy as np


def fit_line(x, y, lr=0.1, epochs=60):
    """Fit y ~ w x + b by gradient descent on the mean squared error."""
    w, b = 0.0, 0.0
    for epoch in range(epochs):
        y_hat = w * x + b  # predictions
        error = y_hat - y
        loss = (error**2).mean()  # mean squared error
        dw = 2 * (error * x).mean()  # dLoss/dw
        db = 2 * error.mean()  # dLoss/db
        w = w - lr * dw
        b = b - lr * db
    return w, b, loss


if __name__ == "__main__":
    x = np.array([-2.0, -1.2, -0.5, 0.0, 0.6, 1.1, 1.8, 2.4])
    y = np.array([-1.9, -0.9, 0.1, 0.4, 1.3, 1.6, 2.6, 3.0])
    w, b, loss = fit_line(x, y, epochs=300)
    w_ls, b_ls = np.polyfit(x, y, 1)  # closed-form least squares
    assert np.isclose(w, w_ls, atol=1e-4) and np.isclose(b, b_ls, atol=1e-4)
    print(f"gradient descent: w = {w:.4f}, b = {b:.4f}, loss = {loss:.4f}")
    print(f"np.polyfit      : w = {w_ls:.4f}, b = {b_ls:.4f}")
