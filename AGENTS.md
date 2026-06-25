# AGENTS.md

This repository implements the Band Quest features documented in `../band-quest-docs`.

## Rules for agents

- Start from the matching feature documentation in `../band-quest-docs/docs/features/`.
- Read `planning/overview.md`, then the latest `refinement/iteration-XX.md`, then `refinement/questions.md`.
- Review `../band-quest-docs/docs/memory-bank/iteration-playbook.md` before starting feature work.
- Check `refinement/checklist.md` and `refinement/log.md` before implementing.
- Check the feature `refinement/log.md` to understand the latest decisions and unresolved items.
- Check `../band-quest-docs/docs/features/roadmap.md` and the feature `refinement/decomposition.md` before choosing an implementation slice.
- Do not invent requirements when a question is still open; update the docs flow instead.
- Keep implementation names and folder structure in English.
- Prefer small, incremental changes that map cleanly back to a single documented feature iteration.
- Always create explicit plans and document your actions whenever you execute creation or editing of files. Use the chat response to clarify the plan before/during execution, and log updates appropriately.
- If a feature is still ambiguous, stop and request clarification or feed the uncertainty back into the docs.

## Development expectation

Each feature should arrive here already refined enough to be implemented in small slices, with the documentation acting as the contract between planning and code.

## AI-DLC phases in this repo

The canonical phase/gate model lives in
`../band-quest-docs/docs/memory-bank/ai-dlc.md` — read it before starting a cycle.
A feature only arrives here **after Inception's gate G1** (spec approved). This
repo owns three of the four active phases:

- **Implement** — code against the spec + `tokens.css`, with Vitest tests written
  alongside the code. Exit gate **G2**: new behavior implemented and covered.
- **Validate** — the "gate verde": `npm run test:unit`, `npm run type-check`,
  `npm run lint`, build, plus a manual playtest (logged in
  `../band-quest-docs/docs/playtests/`) when mechanics change. Exit gate **G3**.
- **Deploy** (pre-alpha = **registrar o incremento**) — commit both repos and
  update the memory bank, roadmap, playtest docs and the feature `log.md`. Exit
  gate **G4**.

Scale the ceremony to the change (see the scaling rule in `ai-dlc.md`): small
fixes fast-track through Implement/Validate/Deploy in one cycle; mechanics,
economy, progression or structural-UI changes go through every gate, recorded
inline in the feature `log.md`. `Operate` is deferred until there is a published
build.

## Testing and validation (Validate phase, gate G3)

This is the **Validate** phase. The agent must be able to attest to its own work
without relying on the user opening files in a browser. Therefore:

- **Code:** every code change ships with unit tests (Vitest). Vue components are
  tested with `@vue/test-utils` (logic + render). Run `npm run test:unit`,
  `npm run type-check` and `npm run lint` before considering a slice done.
- **Art assets (SVG):** every SVG the agent creates must be covered by an
  automated test that validates, at minimum:
  - the file parses as **well-formed XML** (catches issues like `--` inside
    comments, unclosed tags);
  - the root `<svg>` has a **square `viewBox`** and a `viewBox` attribute;
  - there is **no embedded raster** (`<image>`) and no opaque full-bleed
    background rectangle (assets must be transparent);
  - the filename follows `member-<slug>.svg` and lives in `src/assets/members/`;
  - **coverage:** every character defined in the feature spec
    (`band-quest-docs/.../planning/design.md`) has a matching SVG, and every SVG
    maps back to a character.
- Do not mark an art handoff or implementation slice complete until its
  validation test exists and passes.