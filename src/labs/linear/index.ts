import type { LabDef, RefSection } from '../../core/types'
import { EXPERIMENTS } from './experiments'
import { LESSONS } from './lessons'
import { PRACTICE } from './practice'
import { LinearWorkbench } from './Workbench'

const REFERENCE: RefSection[] = [
  {
    title: 'Vectors',
    rows: [
      { name: 'Vector', tex: 'v\\in\\mathbb{R}^n', numpy: 'v = np.array([3., 1., 2.])', use: 'one example, one embedding, one weight vector' },
      { name: 'Length (L2 norm)', tex: '|v|=\\sqrt{\\textstyle\\sum v_i^2}', numpy: 'np.linalg.norm(v)', use: 'weight decay, normalising embeddings' },
      { name: 'Dot product', tex: 'a\\cdot b=\\textstyle\\sum a_ib_i=|a||b|\\cos\\theta', numpy: 'a @ b', use: 'neurons, attention scores' },
      { name: 'Cosine similarity', tex: '\\frac{a\\cdot b}{|a||b|}', numpy: 'a @ b / (norm(a) * norm(b))', use: 'semantic search, recommenders' },
      { name: 'Projection', tex: '\\mathrm{proj}_b a=\\frac{a\\cdot b}{b\\cdot b}b', numpy: '(a @ b) / (b @ b) * b', use: 'Gram–Schmidt, least squares' },
    ],
  },
  {
    title: 'Matrices',
    rows: [
      { name: 'Matrix-vector', tex: '(Ax)_i=\\textstyle\\sum_j A_{ij}x_j', numpy: 'A @ x', use: 'a dense layer Wx + b' },
      { name: 'Matrix product', tex: 'C_{ij}=\\textstyle\\sum_t A_{it}B_{tj}', numpy: 'A @ B', use: 'a batch through a layer: XW' },
      { name: 'Transpose', tex: '(AB)^T=B^TA^T', numpy: 'A.T', use: 'gradients of linear layers' },
      { name: 'Identity, inverse', tex: 'AA^{-1}=I', numpy: 'np.eye(n), np.linalg.inv(A)', use: 'rarely formed; solve instead' },
      { name: 'Determinant', tex: '\\det(AB)=\\det A\\det B', numpy: 'np.linalg.det(A)', use: 'Gaussian density, normalising flows' },
      { name: 'Solve', tex: 'Ax=b', numpy: 'np.linalg.solve(A, b)', use: 'closed-form regression' },
      { name: 'Rank', tex: '\\mathrm{rank}(A)=\\#\\text{independent columns}', numpy: 'np.linalg.matrix_rank(A)', use: 'detecting collinear features, LoRA' },
    ],
  },
  {
    title: 'Decompositions',
    rows: [
      { name: 'Eigen', tex: 'Av=\\lambda v', numpy: 'np.linalg.eigh(S)  # symmetric', use: 'PCA, PageRank, Hessian analysis' },
      { name: 'QR', tex: 'A=QR,\;Q^TQ=I', numpy: 'np.linalg.qr(A)', use: 'stable least squares' },
      { name: 'SVD', tex: 'A=U\\Sigma V^T', numpy: 'np.linalg.svd(A)', use: 'PCA, low-rank compression, recommenders' },
      { name: 'Cholesky', tex: 'S=LL^T', numpy: 'np.linalg.cholesky(S)', use: 'sampling Gaussians, Gaussian processes' },
      { name: 'Covariance', tex: 'C=\\tfrac{1}{n-1}X_c^TX_c', numpy: 'np.cov(X, rowvar=False)', use: 'PCA, Mahalanobis distance' },
      { name: 'Least squares', tex: 'X^TX\\hat w=X^Ty', numpy: 'np.linalg.lstsq(X, y)', use: 'linear regression' },
    ],
  },
]

export const LINEAR: LabDef = {
  slug: 'linear-algebra',
  no: 1,
  room: 'LA-101',
  name: 'Linear Algebra',
  accent: '#52e3c2',
  tagline: 'The language every model is written in',
  blurb: 'Vectors, dot products, matrices as transformations, determinants, solving systems, eigenvectors and PCA. Six algorithms built from scratch in NumPy.',
  lessons: LESSONS,
  experiments: EXPERIMENTS,
  Workbench: LinearWorkbench,
  practice: PRACTICE,
  reference: REFERENCE,
}
