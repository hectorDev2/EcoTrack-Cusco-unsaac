# Skill Registry — eco-track-cusco-unsaac

Generated: 2026-06-17

## User-Level Skills

| Skill | Location | Triggers |
|-------|----------|----------|
| branch-pr | ~/.claude/skills/branch-pr/SKILL.md | Creating a pull request, opening a PR, or preparing changes for review |
| figma-generate-design | ~/.claude/skills/figma-generate-design/SKILL.md | Write to Figma, create in Figma from code, push page to Figma, build a landing page in Figma, convert modal/dialog/drawer/panel to Figma |
| figma-use | ~/.claude/skills/figma-use/SKILL.md | MANDATORY prerequisite before every `use_figma` tool call; create/edit/delete nodes, set up variables/tokens, build components/variants |
| find-skills | ~/.claude/skills/find-skills/SKILL.md | "how do I do X", "find a skill for X", "is there a skill that can...", expressing interest in extending capabilities |
| go-testing | ~/.claude/skills/go-testing/SKILL.md | Writing Go tests, using teatest, or adding test coverage |
| graphify | ~/.claude/skills/graphify/SKILL.md | `/graphify` — questions about codebase/documents/project content; especially if graphify-out/ exists |
| issue-creation | ~/.claude/skills/issue-creation/SKILL.md | Creating a GitHub issue, reporting a bug, or requesting a feature |
| judgment-day | ~/.claude/skills/judgment-day/SKILL.md | "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" |
| mmx-cli | ~/.claude/skills/mmx-cli/SKILL.md | Generate text, images, video, speech, and music via MiniMax AI |
| skill-creator | ~/.claude/skills/skill-creator/SKILL.md | Creating a new skill, adding agent instructions, or documenting patterns for AI |

## SDD Skills (auto-managed, loaded by orchestrator)

- sdd-apply, sdd-archive, sdd-design, sdd-explore, sdd-init, sdd-onboard, sdd-propose, sdd-spec, sdd-tasks, sdd-verify
- Location: ~/.claude/skills/sdd-*/ and ~/.config/opencode/skills/sdd-*/

## Project Conventions

| File | Location | Description |
|------|----------|-------------|
| AGENTS.md | `./AGENTS.md` | Next.js 16 breaking changes warning + Peruvian Spanish locale rules |
| CLAUDE.md | `./CLAUDE.md` | References `@AGENTS.md` — delegates to AGENTS.md for rules |

## Notes

- No project-level skills found (no `.claude/skills/`, `.gemini/skills/`, `.agent/skills/`, or `skills/` directories).
- User-level skills are auto-loaded by the orchestrator via `available_skills` in system prompt.
- `~/.agents/skills/` skills are symlinked into `~/.claude/skills/` (figma-generate-design, figma-use, find-skills, mmx-cli).
