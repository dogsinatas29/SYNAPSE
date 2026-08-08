// @synapse-bypass Deterministic hash normalization helpers.
export interface FloatNormalizationOptions {
    enabled: boolean;
    precision: number;
    fields: string[];
    semanticTypes: string[];
    runtimeMetadataKeys: string[];
}

export interface NormalizationTrace {
    path: string;
    raw: number;
    normalized: number;
    reason: 'field' | 'semanticType' | 'normalizationHint';
}

export interface HashTransformResult {
    semantic: unknown;
    runtime: unknown;
    traces: NormalizationTrace[];
}

function roundTo(value: number, precision: number): number {
    const p = Math.max(0, precision);
    return Number(value.toFixed(p));
}

function toPath(parent: string, child: string): string {
    return parent ? `${parent}.${child}` : child;
}

function normalizeScalar(
    value: number,
    key: string,
    node: Record<string, unknown>,
    options: FloatNormalizationOptions,
    currentPath: string,
    traces: NormalizationTrace[]
): number {
    if (!options.enabled) return value;

    const semanticType = typeof node._semanticType === 'string' ? node._semanticType : '';
    const normalizationHint = typeof node._normalization === 'string' ? node._normalization : '';

    const byField = options.fields.includes(key);
    const bySemanticType = key === 'value' && semanticType.length > 0 && options.semanticTypes.includes(semanticType);
    const byHint = key === 'value' && normalizationHint === 'float4';

    if (!byField && !bySemanticType && !byHint) {
        return value;
    }

    const normalized = roundTo(value, options.precision);
    traces.push({
        path: currentPath,
        raw: value,
        normalized,
        reason: byField ? 'field' : bySemanticType ? 'semanticType' : 'normalizationHint'
    });
    return normalized;
}

export function splitRuntimeMetadata(input: unknown, runtimeMetadataKeys: string[]): { semantic: unknown; runtime: unknown } {
    if (Array.isArray(input)) {
        const semanticItems = input.map((item) => splitRuntimeMetadata(item, runtimeMetadataKeys).semantic);
        const runtimeItems = input
            .map((item) => splitRuntimeMetadata(item, runtimeMetadataKeys).runtime)
            .filter((item) => item !== undefined);
        return {
            semantic: semanticItems,
            runtime: runtimeItems.length > 0 ? runtimeItems : undefined
        };
    }

    if (input && typeof input === 'object') {
        const semanticObj: Record<string, unknown> = {};
        const runtimeObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
            if (runtimeMetadataKeys.includes(key)) {
                runtimeObj[key] = value;
                continue;
            }
            const nested = splitRuntimeMetadata(value, runtimeMetadataKeys);
            semanticObj[key] = nested.semantic;
            if (nested.runtime !== undefined) {
                runtimeObj[key] = nested.runtime;
            }
        }
        return {
            semantic: semanticObj,
            runtime: Object.keys(runtimeObj).length > 0 ? runtimeObj : undefined
        };
    }

    return { semantic: input, runtime: undefined };
}

export function normalizeForSemanticHash(
    input: unknown,
    options: FloatNormalizationOptions,
    currentPath = '',
    traces: NormalizationTrace[] = []
): HashTransformResult {
    const split = splitRuntimeMetadata(input, options.runtimeMetadataKeys);

    const normalizeNode = (node: unknown, pathPrefix: string): unknown => {
        if (Array.isArray(node)) {
            return node.map((item, index) => normalizeNode(item, `${pathPrefix}[${index}]`));
        }

        if (node && typeof node === 'object') {
            const out: Record<string, unknown> = {};
            const asRecord = node as Record<string, unknown>;
            for (const [key, value] of Object.entries(asRecord)) {
                const nextPath = toPath(pathPrefix, key);
                if (typeof value === 'number') {
                    out[key] = normalizeScalar(value, key, asRecord, options, nextPath, traces);
                } else {
                    out[key] = normalizeNode(value, nextPath);
                }
            }
            return out;
        }

        return node;
    };

    return {
        semantic: normalizeNode(split.semantic, currentPath),
        runtime: split.runtime,
        traces
    };
}

export function canonicalStringify(input: unknown): string {
    if (input === null || input === undefined) {
        return 'null';
    }

    if (typeof input === 'number') {
        if (!Number.isFinite(input)) return 'null';
        return Number.isInteger(input) ? String(input) : input.toString();
    }

    if (typeof input === 'string') {
        return JSON.stringify(input);
    }

    if (typeof input === 'boolean') {
        return input ? 'true' : 'false';
    }

    if (Array.isArray(input)) {
        return `[${input.map((item) => canonicalStringify(item)).join(',')}]`;
    }

    const obj = input as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const props = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
    return `{${props.join(',')}}`;
}