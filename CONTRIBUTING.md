# Contributing

Thanks for your interest in contributing! This project currently contains the frontend. The PiggyBank smart contracts live in a separate repository.

## Development workflow
- Frontend: React + Vite (TypeScript)
- Contracts: Foundry (external repo)

## Pull request conventions
- Create a feature branch from `main`.
- Keep PRs focused and reasonably small.
- Include a clear description and reference any related issues (e.g., "Fixes #9").
- Ensure `npm run lint` and `npm run type-check` pass.
- For contract-related changes (in contracts repo), include `forge build` and `forge test` passing in your PR there.

## Commit messages
- Use clear, descriptive messages. Example prefixes:
  - docs: update README, add CONTRACTS.md
  - feat: add feature
  - fix: bug fix
  - refactor: code refactor
  - chore: tooling or dependency changes

## Code style
- Follow ESLint/TypeScript rules.
- Keep UI copy consistent with `docs/ux-copy.md`.

## Opening issues
- Describe the problem, expected vs actual behavior, and steps to reproduce.
- Include environment details (browser, network, wallet).

## Security
- Do not include secrets in issues or PRs. Configure env vars locally or in deployment settings.
