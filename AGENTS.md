# AGENTS.md

This repository implements the Band Quest features documented in `../band-quest-docs`.

## Rules for agents

- Start from the matching feature documentation in `../band-quest-docs/docs/features/`.
- Read `planning/overview.md`, then the latest `refinement/iteration-XX.md`, then `refinement/questions.md`.
- Review `../band-quest-docs/docs/agents/iteration-playbook.md` before starting feature work.
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