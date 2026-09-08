# Contributing

Thank you for your interest in contributing. This is an unofficial iPhone 18 Pro / iPhone Ultra
concept recap — animation-heavy, research-based, not an Apple product.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 9+
- **Git**

### Local Setup

```bash
# Clone the repository
git clone https://github.com/aungmyatmoe11/rezerv-ui-animation.git
cd rezerv-ui-animation

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Full check (typecheck + lint + build)
npm run check

# Playwright tests
npm test
npm run test:desktop
npm run test:ui
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── sections/         # Page sections (hero, display, etc.)
├── lib/              # Utilities and helpers
├── data/             # Static data and content
└── styles/           # SCSS modules and tokens

public/
├── video/            # Video assets (H.264)
├── frames/           # Frame sequences for scrub
├── poster/           # Video posters
└── img/              # Device images
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer `type` over `interface` for simple shapes
- Export types explicitly when used across files

### React

- Functional components only
- Use `useGSAP` for GSAP animations (scoped cleanup)
- Keep component files focused (one export per file preferred)

### CSS/SCSS

- Use SCSS Modules (`.module.scss`)
- Follow existing token system (`_tokens.scss`)
- Use mixins for type scale, layout, and breakpoints
- Only `transform` and `opacity` for animations (no layout-triggering properties)

### Comments

- **Do not** add obvious comments that narrate code
- **Do** explain non-obvious intent, trade-offs, or constraints
- Prefer Myanmar language for complex multi-step logic (per project preference)
- Keep comments concise and production-ready

## Pull Request Process

1. **Fork** the repository
2. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code patterns
   - Run `npm run check` to verify build + typecheck + lint
   - Test your changes in the browser
4. **Commit** with clear messages
   ```bash
   git commit -m "feat: add [feature description]"
   ```
5. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against `main`
   - Describe what changed and why
   - Include screenshots/videos for visual changes
   - Reference any related issues

### Commit Message Format

Use conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting (no code change)
- `refactor:` Code change (no behavior change)
- `perf:` Performance improvement
- `test:` Adding or updating tests
- `chore:` Build process or tooling

## Testing

### Manual Testing

- Test on **desktop (1440px+)**, **tablet (768-1023px)**, and **mobile (375-767px)**
- Verify scroll animations work smoothly
- Check `prefers-reduced-motion` fallback
- Test keyboard navigation and focus states

### Playwright Tests

```bash
# Run all tests
npm test

# Run with UI (interactive)
npm run test:ui

# Run desktop tests only
npm run test:desktop
```

Add tests for new features when applicable.

## Design System

### Colors

- Surfaces: `--ink`, `--ink-raised`, `--bone`, `--bone-dim`, `--bone-faint`
- Finishes: `--cherry-*`, `--blue-*`, `--silver-*`, `--graphite-*`
- Confidence: `--c-official`, `--c-high`, `--c-developing`, `--c-uncertain`, `--c-concept`

### Type Scale

Use mixins from `_type.scss`:
- `t-hero` — Rare, mostly baked into film
- `t-section` — Section headlines
- `t-sub` — Subheadings
- `t-body` — Body copy
- `t-eyebrow` — Labels (uppercase)
- `t-mono` — Monospace (specs, gauges)

### Layout

- `@mixin shell` — Content shell (max 1440px)
- `@mixin content-shell` — Reading measure (max 820px)
- `@mixin section-rhythm` — Vertical spacing

## Questions?

For questions or clarifications, open a [GitHub Discussion](https://github.com/aungmyatmoe11/rezerv-ui-animation/discussions) or contact [aungmyatmoe.dev11@gmail.com](mailto:aungmyatmoe.dev11@gmail.com).

---

**Note:** Unofficial concept recap. Not affiliated with Apple Inc.
