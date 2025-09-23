# Contributing to CodeVision

Thank you for your interest in contributing to CodeVision! This document provides guidelines for contributing.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/CodeVision.git
   cd CodeVision
   ```
3. **Set up** the development environment (see [README.md](README.md#quick-start))

## Development Workflow

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. Make your changes and test locally:
   - Run the Python backend: `cd backend && python -m uvicorn main:app --reload`
   - Run the frontend: `cd frontend && npm run dev`

3. Commit with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add support for X"
   # or
   git commit -m "fix: resolve Y when Z occurs"
   ```

4. Push to your fork and open a **Pull Request**

## Commit Message Convention

Use conventional commits for clarity:

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |
| `refactor:` | Code restructure, no behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance (deps, config, etc.) |

Examples:
- `feat: add recursion visualization to call stack`
- `fix: prevent spacebar from being captured in Monaco editor`
- `docs: update README with Supabase setup`

## Code Style

- **Python**: Follow PEP 8; use type hints where helpful
- **JavaScript/JSX**: Use consistent formatting (Prettier if configured)
- **Comments**: Add brief comments for non-obvious logic

## Areas to Contribute

- **Backend**: Extend `executor.py` to support more Python constructs (e.g., classes, decorators)
- **Frontend**: Improve UI/UX, add new example programs, enhance error explanations
- **Documentation**: Improve README, add inline docs, create tutorials
- **Bug fixes**: Check existing issues or report new ones

## Reporting Bugs

Open an issue with:
- **Description**: What went wrong?
- **Steps to reproduce**: How can we reproduce it?
- **Expected vs actual**: What did you expect vs what happened?
- **Environment**: OS, Node/Python versions

## Questions?

Feel free to open an issue for discussion.

Thank you for contributing!
