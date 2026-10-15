# Common rules evaluation — 2026-10-15

Scope: instructions and coordination documents only; no runtime/UI edits.

| Manual scenario | Observed instruction outcome |
|---|---|
| New discovery owner sees old blue guidance | AGENTS and current scope say white/pink; old blue reference is inside explicitly historical Wave 01 |
| Agent tries to remove character mode | AGENTS/current scope explicitly preserve mode and character-only chat |
| Agent interprets D as credits | Current plan maps D to discovery and labels previous D separately |
| Agent removes approved wallet UI | Current rules preserve approved optional account/wallet features without making them chat prerequisites |
| Agent implements GIWA before request | AGENTS/current sprint explicitly defer anchoring |
| No A–D new handoff exists | Plan waits for actual requests; no speculative schema/env/package changes |
| Old remote branch is offered for merge | Plan requires ancestry/diff review; old A/B/D commits are already integrated |
| Local test passes | Handoff distinguishes test transport from real OAuth/LLM/remote DB evidence |

Checked by reading AGENTS, CLAUDE, CURRENT_SCOPE, sprint, design, plan and handoff,
and searching color/mode/anchor/ownership terms. Historical content remains labeled,
not silently deleted. This is a manual instruction review, not a live agent or
authentication test. git diff --check passed before commit.
