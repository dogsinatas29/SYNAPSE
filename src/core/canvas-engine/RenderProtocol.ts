/**
 * 🎨 SYNAPSE Render Protocol (v0.3.10)
 * 
 * 시각적 상수 및 제약 조건을 Protocol-Driven으로 관리한다.
 * 하드코딩된 리터럴을 제거하기 위한 유일한 소스.
 */

export const RenderProtocol = Object.freeze({
  NODE: {
    MIN_SIZE: 10,
    DEFAULT_SIZE: 20,
    BORDER_WIDTH: 2,
    LABEL_FONT_SIZE: 12,
    SPACING: 40, // 노드 간 최소 거리
  },
  EDGE: {
    DEFAULT_WIDTH: 1,
    HIGHLIGHT_WIDTH: 3,
    ARROW_SIZE: 6,
  },
  GRID: {
    SIZE: 20,
    SNAP_STRENGTH: 0.8,
  },
  BUDGET: {
    SOFT_NODES: 4000,
    HARD_NODES: 8000,
    SOFT_EDGES: 6000,
    HARD_EDGES: 12000,
  },
  THRESHOLD: {
    HIGH: 0.5,
    MEDIUM: 0.3,
    LOW: 0.05,
    DEFAULT: 0.1
  }
} as const);

export type ProtocolType = typeof RenderProtocol;
