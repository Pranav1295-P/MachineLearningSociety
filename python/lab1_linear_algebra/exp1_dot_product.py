import numpy as np


def dot(a, b):
    """Dot product from scratch: multiply matching entries, then add them up."""
    assert len(a) == len(b), "vectors must have the same length"
    total = 0.0
    for i in range(len(a)):
        product = a[i] * b[i]
        total += product
    return total


def norm(a):
    return np.sqrt(dot(a, a))  # length of a = sqrt(a . a)


def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))


def project(a, b):
    """The shadow of a on the line through b."""
    scale = dot(a, b) / dot(b, b)
    return scale * np.asarray(b, dtype=float)


if __name__ == "__main__":
    a = np.array([3.0, 1.0, 2.0])
    b = np.array([1.0, 2.5, 0.5])
    assert np.isclose(dot(a, b), a @ b)
    assert np.isclose(norm(a), np.linalg.norm(a))
    cos = a @ b / (np.linalg.norm(a) * np.linalg.norm(b))
    assert np.isclose(cosine_similarity(a, b), cos)
    assert np.allclose(project(a, b), (a @ b) / (b @ b) * b)
    print(f"dot = {dot(a, b):.4f}   numpy a @ b = {a @ b:.4f}")
    print(f"cosine similarity = {cosine_similarity(a, b):.4f}")
    print("projection of a on b =", np.round(project(a, b), 4))
