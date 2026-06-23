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

## Testing and validation

The agent must be able to attest to its own work without relying on the user
opening files in a browser. Therefore:

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