# Deterministic Audit Layer

## Overview
The **Deterministic Audit Layer** ensures that the SYNAPSE engine produces **consistent outputs** for the same input (`graph.json`). This is critical for **Evidence Vault**-based diagnosis, where reproducibility is a foundational requirement.

## Purpose
- **Verify determinism**: Ensure that the same `graph.json` input always produces the same `report.md` and `evidence/*.json` outputs.
- **Identify non-deterministic behavior**: Detect and report inconsistencies in outputs across multiple runs.
- **Support debugging**: Provide detailed diff reports and execution logs for failed runs.

## Key Features

### 1. Input and Output Hashing
- **Input Hash**: Computes a SHA-256 hash of the `graph.json` file to uniquely identify the input.
- **Output Hash**: Computes a SHA-256 hash of the `report/` and `evidence/` directories to uniquely identify the output.
- **Runtime Metadata**: Excludes `generatedAt`, `duration`, and `memoryUsage` from the output hash to avoid false negatives.

### 2. Floating Point Normalization
- Normalizes floating-point numbers in **calculation result fields** (`confidence`, `ratio`, `score`, `weight`, `probability`) to **4 decimal places**.
- Preserves the **original value** (`raw`) and stores the **normalized value** (`normalized`) for traceability.
- Example:
  ```json
  {
    "confidence": {
      "raw": 65.7100001,
      "normalized": 65.7100
    }
  }
  ```

### 3. JSON Canonicalization
- Ensures that JSON files are **canonicalized** (sorted keys, no unnecessary whitespace) before hashing.
- Prevents false negatives due to formatting differences.

### 4. Process Isolation
- Runs each analysis in a **separate process** to avoid memory leaks, global state contamination, or other side effects.

### 5. Diff Report
- Generates a **diff report** when outputs differ between runs.
- Compares `report.md` and `evidence/*.json` files line by line to identify discrepancies.

### 6. Engine Version Tracking
- Records the **engine version**, **report generator version**, and **Git commit hash** in the `summary.json` file.
- Helps diagnose whether output differences are due to code changes or non-deterministic behavior.

### 7. Execution Logs
- Saves the outputs of all runs (`run_1/`, `run_2/`, ..., `run_5/`) in the `.determinism/` directory.
- Includes a `summary.json` file with the results of the determinism check.

## Future Extensions

### Semantic Numeric Field Support

현재는 `confidence`, `ratio`, `score`, `weight`, `probability`와 같은 **필드명 기반**으로 정규화를 수행합니다. 그러나 향후 새로운 리포트가 추가되면 다음과 같은 필드가 등장할 수 있습니다:

```json
{
  "decisionConfidence": 67.123456
}
```

이 경우, 필드명 기반 정규화에서 누락될 수 있습니다. 따라서 **향후 확장성**을 고려하여 다음과 같은 방식을 지원할 예정입니다:

1. **Semantic Type Annotation**:
   ```json
   {
     "_semanticType": "confidence",
     "value": 67.123456
   }
   ```

2. **Normalization Hint**:
   ```json
   {
     "_normalization": "float4",
     "value": 67.123456
   }
   ```

이러한 확장 포인트를 통해 **필드명에 의존하지 않고**, **타입 또는 명시적 힌트**를 기반으로 정규화를 수행할 수 있습니다.

---

## Usage

### Command
```bash
synapse verify-determinism --input <graph.json>
```

### Example Output
```bash
Input Hash: 4a92d1...
Engine Version: 0.3.34.15
Git Commit: abcdef123456

Run 1: Output Hash A=8be11f ✅
Run 2: Output Hash A=8be11f ✅
Run 3: Output Hash A=7c2a4d ❌ (FAIL)
Run 4: Output Hash A=8be11f ✅
Run 5: Output Hash A=8be11f ✅

Deterministic: FAIL (4/5 runs matched)

Results saved to: .determinism/
- run_1/
- run_2/
- run_3/
- run_4/
- run_5/
- diff/
- summary.json
```

## Configuration
Configure the determinism audit in `synapse.config.json`:

```json
{
  "determinism": {
    "enabled": true,
    "runs": 5,
    "hashAlgorithm": "sha256",
    "diffReport": true,
    "isolateProcess": true,
    "canonicalizeJson": true,
    "normalizeFloats": {
      "enabled": true,
      "fields": ["confidence", "ratio", "score", "weight", "probability"]
    },
    "saveResults": true
  }
}
```

## Future Extensions

### Semantic Numeric Fields
To support future extensibility, the following annotation-based approach is planned:

```json
{
  "_semanticType": "confidence",
  "value": 67.123456
}
```

or

```json
{
  "_normalization": "float4",
  "value": 67.123456
}
```

This will allow the determinism audit to normalize floating-point numbers in **any field** without requiring hardcoded field names.

## PASS/FAIL Criteria
- **PASS**: All 5 runs produce the same `Output Hash A`.
- **FAIL**: At least 1 run produces a different `Output Hash A`.

## Debugging Non-Deterministic Behavior
If the determinism check fails:
1. Review the `diff/` directory for discrepancies between runs.
2. Check the `summary.json` file for details on which runs failed.
3. Investigate potential sources of non-determinism (e.g., unordered iterations, async operations, floating-point calculations).