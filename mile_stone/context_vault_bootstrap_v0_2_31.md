# 🚀 Context Vault Bootstrap Guide (v0.2.31)

## 1. Setup
- Create /specs directory
- Add markdown spec files

## 2. Add Context Tags
Use @context blocks in specs

## 3. Run Extractor
Generate `.active_context.md`

## 3. 3.5 Validate Context
- Check override priority applied
- Check quota clipping
- Check section placement

## 4. Use Prompt
@vault → inject context into LLM

## 5. Test
Run poison tests

## 6. Iterate
Refine rules and tags

## 7. Failure Loop
- Identify violated constraint
- Trace to spec id
- Patch spec
- Re-run extractor

## Goal
Stable constraint-driven LLM behavior
