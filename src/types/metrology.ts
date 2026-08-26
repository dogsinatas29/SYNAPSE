export enum ObservabilityClass {
  OBSERVABLE = 'OBSERVABLE',
  PARTIALLY_OBSERVABLE = 'PARTIALLY_OBSERVABLE',
  INFERABLE = 'INFERABLE',
  BLIND = 'BLIND',
  MISLEADING = 'MISLEADING'
}

export enum RecoverabilityClass {
  RECOVERABLE = 'RECOVERABLE',
  PARTIALLY_RECOVERABLE = 'PARTIALLY_RECOVERABLE',
  UNRECOVERABLE = 'UNRECOVERABLE'
}

export enum SurvivabilityClass {
  TINY_READY = 'TINY_READY',
  MEDIUM_READY = 'MEDIUM_READY',
  LARGE_READY = 'LARGE_READY',
  KERNEL_READY = 'KERNEL_READY'
}

export enum AmplificationCause {
  CROSS_PRODUCT = 'CROSS_PRODUCT',
  DUPLICATE_TRAVERSAL = 'DUPLICATE_TRAVERSAL',
  RECURSIVE_EXPANSION = 'RECURSIVE_EXPANSION',
  VALIDATION_FANOUT = 'VALIDATION_FANOUT',
  STATE_REPLICATION = 'STATE_REPLICATION',
  CACHE_MISS_STORM = 'CACHE_MISS_STORM',
  UNKNOWN = 'UNKNOWN'
}

export enum ValidationFanoutCause {
  DUPLICATE_RULE_APPLICATION = 'DUPLICATE_RULE_APPLICATION',
  RECURSIVE_VALIDATION = 'RECURSIVE_VALIDATION',
  RULE_CHAIN_EXPANSION = 'RULE_CHAIN_EXPANSION',
  BROADCAST_VALIDATION = 'BROADCAST_VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

export enum CoverageSource {
  GROUND_TRUTH = 'GROUND_TRUTH',
  MANUAL_AUDIT = 'MANUAL_AUDIT',
  MULTI_EXTRACTOR_CONSENSUS = 'MULTI_EXTRACTOR_CONSENSUS',
  SYNTHETIC_DATASET = 'SYNTHETIC_DATASET'
}

export enum CostType {
  CPU = 'CPU',
  IO = 'IO',
  MEMORY = 'MEMORY',
  SERIALIZATION = 'SERIALIZATION',
  STATE_EXPLOSION = 'STATE_EXPLOSION'
}

export interface StabilityMetric {
  sampleCount: number;
  mean: number;
  variance: number;
}

export interface PipelinePhase {
  phase: string;
  count: number;
}

export interface ExtractorPropertyRegistry {
  extractorId: string;
  strength: string[];
  weakness: string[];
  bias: string;
  metricConfidence: number; // 0.0 to 1.0
}

export interface PropertyAttribution {
  projectDependency: number; // 0.0 to 1.0
  extractorDependency: number; // 0.0 to 1.0
}

export interface BenchmarkSnapshot {
  benchmark: string;
  version: string;
  timestamp: string;
  coverage: Record<string, any>; // Track A Data
  amplification: PipelinePhase[];
  cost: Record<string, any>; // Track B Data
}
