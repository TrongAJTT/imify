<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **imify** (14057 symbols, 24402 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/imify/context` | Codebase overview, check index freshness |
| `gitnexus://repo/imify/clusters` | All functional areas |
| `gitnexus://repo/imify/processes` | All execution flows |
| `gitnexus://repo/imify/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Ui area (279 symbols) | `.claude/skills/generated/ui/SKILL.md` |
| Work in the Stores area (247 symbols) | `.claude/skills/generated/stores/SKILL.md` |
| Work in the Processor area (230 symbols) | `.claude/skills/generated/processor/SKILL.md` |
| Work in the Filling area (209 symbols) | `.claude/skills/generated/filling/SKILL.md` |
| Work in the Onnx-engines area (171 symbols) | `.claude/skills/generated/onnx-engines/SKILL.md` |
| Work in the Pattern area (170 symbols) | `.claude/skills/generated/pattern/SKILL.md` |
| Work in the Converter area (169 symbols) | `.claude/skills/generated/converter/SKILL.md` |
| Work in the Splicing area (163 symbols) | `.claude/skills/generated/splicing/SKILL.md` |
| Work in the Inspector area (131 symbols) | `.claude/skills/generated/inspector/SKILL.md` |
| Work in the Fill area (122 symbols) | `.claude/skills/generated/fill/SKILL.md` |
| Work in the Splitter area (110 symbols) | `.claude/skills/generated/splitter/SKILL.md` |
| Work in the Hooks area (85 symbols) | `.claude/skills/generated/hooks/SKILL.md` |
| Work in the Diffchecker area (71 symbols) | `.claude/skills/generated/diffchecker/SKILL.md` |
| Work in the Batch area (45 symbols) | `.claude/skills/generated/batch/SKILL.md` |
| Work in the Symmetric-generator area (36 symbols) | `.claude/skills/generated/symmetric-generator/SKILL.md` |
| Work in the Background-removal area (36 symbols) | `.claude/skills/generated/background-removal/SKILL.md` |
| Work in the Upscaler area (34 symbols) | `.claude/skills/generated/upscaler/SKILL.md` |
| Work in the Grid-designer area (33 symbols) | `.claude/skills/generated/grid-designer/SKILL.md` |
| Work in the Options area (32 symbols) | `.claude/skills/generated/options/SKILL.md` |
| Work in the Context-menu area (32 symbols) | `.claude/skills/generated/context-menu/SKILL.md` |

<!-- gitnexus:end -->
