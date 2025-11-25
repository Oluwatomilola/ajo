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

For bug reports and feature requests, please include the following information to help us address your issue effectively:

### For Bug Reports
- [ ] Clear description of the issue
- [ ] Steps to reproduce the issue
- [ ] Expected vs actual behavior
- [ ] File paths and line numbers where the issue occurs (if applicable)
- [ ] Screenshots or screen recordings (if visual issue)
- [ ] Environment details:
  - Browser and version
  - Operating system and version
  - Wallet (if applicable)
  - Network (e.g., mainnet, testnet, local)

### For Feature Requests
- [ ] Clear description of the feature
- [ ] Use case and expected benefits
- [ ] Any relevant file paths or components that would be affected
- [ ] Any alternative solutions or workarounds considered

## Security
- Do not include secrets in issues or PRs. Configure env vars locally or in deployment settings.

## Local Development Setup

For contributors working on both frontend and contracts, we've created comprehensive setup guides:

- **📖 Complete Setup Guide**: [CONTRACTS.md#Local Development Setup](./CONTRACTS.md#-local-development-setup)
- **🏠 Quick Start**: Use the environment switching scripts:
  - `./scripts/switch-env.sh local` (Unix/Linux/macOS)
  - `.\scripts\switch-env.ps1 -Environment local` (Windows PowerShell)

These scripts handle the contract address configuration automatically for local development, testnet, and mainnet environments.
