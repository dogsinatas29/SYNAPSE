# Phase 20: Linux Kernel Ecological Analysis

## 1. Topological Correlation (관측된 경향성)
규모 6만 개 이상의 생태계에서 위상 지표 간의 상관관계를 추출합니다. Long-tail 분포를 고려하여 **Spearman 순위 상관계수**를 최우선으로 해석합니다.

| Correlation Pair | Spearman ($ho$) | Kendall ($	au$) | Pearson ($r$) | 관측 결과 해석 |
| --- | --- | --- | --- | --- |
| **Reachability vs Incoming** | 0.1460 | 0.0304 | 0.0045 | 0에 수렴. (독립적 역할, 강한 연관성 없음) |
| **Reachability vs Diversity** | 0.8426 | - | - | Hub가 Bridge 역할을 크게 겸하는 현상 (집중화 구조) |

---

## 2. Largest SCC Composition (서브시스템 집중도)
전체 위상을 지배하는 가장 큰 SCC(크기: 1138)가 어떤 기능들로 이루어졌는지 해부합니다.

**Top Subsystems in Largest SCC:**
- **drivers/gpu**: 97.9% (1114 nodes)
- **arch/x86**: 0.7% (8 nodes)
- **drivers/accel**: 0.4% (4 nodes)
- **arch/arm**: 0.3% (3 nodes)
- **drivers/char**: 0.2% (2 nodes)
- **arch/alpha**: 0.2% (2 nodes)
- **drivers/dma**: 0.2% (2 nodes)
- **drivers/acpi**: 0.1% (1 nodes)
- **arch/microblaze**: 0.1% (1 nodes)
- **arch/powerpc**: 0.1% (1 nodes)

---

## 3. Subsystem Role Profile (기능별 평균 위상 역할)
파일 단위가 아닌, **서브시스템(Subsystem)** 단위로 생태계에서 어떤 위상을 차지하는지 프로파일링합니다.

### 👑 Top 5 Hub Subsystems (Average Reachability)
1. **drivers/cxl** (2383.03)
2. **drivers/hwmon** (1962.98)
3. **drivers/ata** (1747.17)
4. **drivers/crypto** (1661.11)
5. **drivers/fpga** (1660.04)

### 🛡️ Top 5 Victim (Sink) Subsystems (Average Incoming Paths)
1. **arch/alpha** (120.29)
2. **drivers/base** (14.48)
3. **arch/arc** (13.45)
4. **drivers/dma-buf** (7.90)
5. **arch/m68k** (6.27)

### 🌉 Top 5 Bridge Subsystems (Average Boundary Diversity)
1. **arch/alpha** (11.34)
2. **drivers/i2c** (6.38)
3. **drivers/gpio** (6.06)
4. **drivers/hwmon** (5.65)
5. **drivers/iio** (5.61)

---
**Data Summary**:
- Total Parsed Nodes: 110102
- Total Runtime Nodes (DAG): 99238
