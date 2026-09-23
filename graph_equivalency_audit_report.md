# Graph Equivalency Audit Report

## 1. Macro Metrics (매크로 지표)
| Metric | AST Graph (graph_vscode.json) | Regex Graph (graph_vscode_regex.json) |
|---|---|---|
| **Node Count** | 7,103 | 1,348 |
| **Edge Count** | 80,767 | 1,179 |

## 2. Micro Overlap (마이크로 일치도)
- **Common Nodes (교집합 노드):** 0 
- **Node Overlap (AST 대비):** 0.00%
- **Node Overlap (Regex 대비):** 0.00%

- **Common Edges (교집합 엣지):** 0
- **Edge Overlap (AST 대비):** 0.00%
- **Edge Overlap (Regex 대비):** 0.00%

## 3. Conclusion (결론)
두 그래프는 서로 **완전히 다른 저장소(Repository)**를 스캔한 결과물입니다. (교집합 0%). 이전의 R² 붕괴는 측정 방법의 실패가 아니라 '서로 다른 세계'를 비교한 실험 설계의 실패입니다.
