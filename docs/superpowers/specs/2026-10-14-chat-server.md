# Chat server scope

Implement the requested chat server on foundation e67418a, preserving the branch and shared files.
Use the published version, pinned persona and selected opening. Prompt order follows original
section 1-3, constrained by the latest DTO. Traverse only the selected leaf's ancestors;
regeneration adds an assistant sibling, edits create a user sibling, branch copies that path.

Use shared ModelService, StreamService, CreditsService and begin/finishTurnRequest. No real
provider, pricing default, independent ledger or authentication bypass. Inject moderation and
model limits/pricing explicitly; absent policy fails closed. Full output is bounded and checked
before streaming public deltas to avoid leaking unmoderated partial output or control markers.

A transaction-scoped Database wrapper allows the injected CreditsService and turn persistence
to share one transaction without modifying their interface. Integration must construct both
services against this same wrapper. Claim a per-chat lease, atomically reserve, then generate
outside transactions. Commit message, credit settlement and terminal response together before
network delivery. Cancellation/failure releases atomically. Expired claims are recovered by a
worker; late model completion cannot win after lease recovery. Replays use saved safe events.

Add assigned 0100 migration only under supabase/migrations, explicitly applied by the chat
migration helper until the integration owner registers it. Add owned API handler as an opt-in
composition point; do not edit shared routing. Memory jobs are durable and anchored to message
ancestry; summaries and pinned notes use the same safety gate. No embeddings provider exists
in the latest contract: bounded ancestor summaries replace unimplemented vector retrieval.

Evidence: isolated PostgreSQL/PGlite tests, authenticated HTTP/SSE tests, full tests and build.
No UI change or deployment. Handoff records routing/migration, pricing, safety and worker setup.
