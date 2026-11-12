import numpy as np


def fit_gaussian(x):
    """Maximum likelihood estimates of a Gaussian's mean and variance."""
    n = len(x)
    mu = 0.0
    for xi in x:
        mu += xi
    mu = mu / n  # MLE of the mean = the sample average
    var = 0.0
    for xi in x:
        var += (xi - mu) ** 2
    var = var / n  # MLE of the variance divides by n (not n - 1)
    return mu, var


def log_likelihood(x, mu, var):
    """How well N(mu, var) explains the data: higher is better."""
    n = len(x)
    return -0.5 * n * np.log(2 * np.pi * var) - ((x - mu) ** 2).sum() / (2 * var)


if __name__ == "__main__":
    x = np.array([4.1, 5.3, 3.6, 4.8, 6.0, 4.4, 5.1, 3.9])
    mu, var = fit_gaussian(x)
    assert np.isclose(mu, x.mean()) and np.isclose(var, x.var())
    best = log_likelihood(x, mu, var)
    for dm, dv in [(0.3, 0), (-0.3, 0), (0, 0.2), (0, -0.2)]:
        assert log_likelihood(x, mu + dm, var + dv) < best, "MLE must be the peak"
    print(f"mu = {mu:.4f}  var = {var:.4f}  log-likelihood = {best:.4f}")
