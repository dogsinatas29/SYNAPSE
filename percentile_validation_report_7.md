# 🧪 Percentile Contract Validation (7-Project Universe)

## Phase 2: Boundary Analysis (99% Threshold)
| Project | Nodes | Feature | Tie Count (Argsort) | Tie Count (AvgRank) | Type |
|---|---:|---|---:|---:|---|
| Linux | 51930 | fanIn | 39 | 39 | No Tie (VSCode-type) |
| Linux | 51930 | fanOut | 119 | 81 | No Tie (VSCode-type) |
| Linux | 51930 | fanRatio | 67 | 1 | No Tie (VSCode-type) |
| VSCode | 7103 | fanIn | 1 | 1 | No Tie (VSCode-type) |
| VSCode | 7103 | fanOut | 2 | 2 | No Tie (VSCode-type) |
| VSCode | 7103 | fanRatio | 1 | 1 | No Tie (VSCode-type) |
| Postgres | 15330 | fanIn | 2 | 2 | No Tie (VSCode-type) |
| Postgres | 15330 | fanOut | 7 | 7 | No Tie (VSCode-type) |
| Postgres | 15330 | fanRatio | 4 | 1 | No Tie (VSCode-type) |
| K8s | 17751 | fanIn | 212 | 37 | No Tie (VSCode-type) |
| K8s | 17751 | fanOut | 86 | 60 | No Tie (VSCode-type) |
| K8s | 17751 | fanRatio | 197 | 36 | No Tie (VSCode-type) |
| RustDesk | 283 | fanIn | 11 | 1 | No Tie (VSCode-type) |
| RustDesk | 283 | fanOut | 3 | 1 | No Tie (VSCode-type) |
| RustDesk | 283 | fanRatio | 7 | 0 | No Tie (VSCode-type) |

## Phase 3: Jaccard Stability
| Project | Feature | Method | >=90 | >=95 | >=99 | J(90,95) | J(95,99) |
|---|---|---|---:|---:|---:|---:|---:|
| Postgres | fanIn | Argsort | 1533 | 767 | 154 | 0.500 | 0.201 |
| Postgres | fanIn | AvgRank | 1505 | 775 | 154 | 0.515 | 0.199 |
| Postgres | fanIn | DenseRank | 17 | 9 | 2 | 0.529 | 0.222 |
| Postgres | fanOut | Argsort | 1533 | 767 | 154 | 0.500 | 0.201 |
| Postgres | fanOut | AvgRank | 1551 | 771 | 154 | 0.497 | 0.200 |
| Postgres | fanOut | DenseRank | 20 | 10 | 2 | 0.500 | 0.200 |
| Postgres | fanRatio | Argsort | 1533 | 767 | 154 | 0.500 | 0.201 |
| Postgres | fanRatio | AvgRank | 1412 | 755 | 153 | 0.535 | 0.203 |
| Postgres | fanRatio | DenseRank | 98 | 39 | 7 | 0.398 | 0.179 |
| K8s | fanIn | Argsort | 1776 | 888 | 178 | 0.500 | 0.200 |
| K8s | fanIn | AvgRank | 325 | 325 | 113 | 1.000 | 0.348 |
| K8s | fanIn | DenseRank | 3 | 2 | 1 | 0.667 | 0.500 |
| K8s | fanOut | Argsort | 1776 | 888 | 178 | 0.500 | 0.200 |
| K8s | fanOut | AvgRank | 353 | 353 | 146 | 1.000 | 0.414 |
| K8s | fanOut | DenseRank | 6 | 2 | 2 | 0.333 | 1.000 |
| K8s | fanRatio | Argsort | 1776 | 888 | 178 | 0.500 | 0.200 |
| K8s | fanRatio | AvgRank | 325 | 325 | 110 | 1.000 | 0.338 |
| K8s | fanRatio | DenseRank | 4 | 2 | 1 | 0.500 | 0.500 |

## Phase 4: Scale Sensitivity Stats (7 Projects, fanIn)
| Method | Threshold | Mean | StdDev | IQR |
|---|---|---:|---:|---:|
| Argsort | >=90% | 10.05% | 0.09% | 0.05% |
| Argsort | >=95% | 5.06% | 0.11% | 0.07% |
| Argsort | >=99% | 1.03% | 0.04% | 0.03% |
| AvgRank | >=90% | 7.98% | 3.21% | 2.88% |
| AvgRank | >=95% | 4.48% | 1.12% | 0.48% |
| AvgRank | >=99% | 0.87% | 0.25% | 0.20% |
