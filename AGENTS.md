# AGENTS.md

This repository implements the Band Quest features documented in `../band-quest-docs`.

## Rules for agents

- Start from the matching feature documentation in `../band-quest-docs/docs/features/`.
- Read `planning/overview.md`, then the latest `refinement/iteration-XX.md`, then `refinement/questions.md`.
- Do not invent requirements when a question is still open; update the docs flow instead.
- Keep implementation names and folder structure in English.
- Prefer small, incremental changes that map cleanly back to a single documented feature iteration.
- If a feature is still ambiguous, stop and request clarification or feed the uncertainty back into the docs.

## Development expectation

Each feature should arrive here already refined enough to be implemented in small slices, with the documentation acting as the contract between planning and code.