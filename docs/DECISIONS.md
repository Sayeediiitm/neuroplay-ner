# DECISIONS.md — NeuroPlay NER

> Trade-off log. Append a new entry for every significant architectural or design decision.
> Format: `## [Part N] YYYY-MM-DD — Title`

---

## [Part 1] 2026-10-18 — Monorepo layout: app / api / docs

**Decision:** Keep frontend (`app/`), backend (`api/`), and documentation (`docs/`) as siblings in a single git repository without a monorepo tool (Turborepo, Nx, etc.).

**Rationale:** Adds zero tooling overhead for a hackathon codebase. A single `package.json` at root is not needed; each sub-project manages its own dependencies. Easy to split later.

**Trade-off:** No shared package hoisting. Acceptable at this scale.

---

## [Part 1] 2026-10-18 — Frontend framework: React + Vite + TypeScript

**Decision:** Use `create-vite` with `react-ts` template.

**Rationale:** Fastest iteration cycle; strong TypeScript support; excellent PWA plugin (`vite-plugin-pwa`). Next.js would add SSR complexity that is unnecessary for a mostly offline app.

**Trade-off:** No SSR/ISR -- not needed. SEO is irrelevant (local health tool, not a public website).

---

## [Part 1] 2026-10-18 — CSS: Tailwind CSS (v4 @tailwindcss/vite)

**Decision:** Use Tailwind v4 via the official `@tailwindcss/vite` plugin (no `postcss.config.js` needed).

**Rationale:** v4 uses a CSS-first config (`@theme` in CSS), reducing JS config boilerplate. Utility-first makes it trivial to enforce the design-system constraints (min touch target = 56px, color tokens, etc.).

**Trade-off:** v4 API is newer; some community plugins not yet updated. We avoid third-party Tailwind plugins entirely, so no breakage risk.

---

## [Part 1] 2026-10-18 — i18n: react-i18next

**Decision:** Use `react-i18next` with static JSON locale files loaded at build time.

**Rationale:** Zero runtime fetch needed -- all locale JSON bundled in the PWA, making language switching fully offline. `i18next-browser-languagedetector` auto-detects browser locale on first launch.

**Languages (MVP):** English (`en`), Hindi (`hi`), Assamese (`as` -- stubs, native speaker review needed).

**Trade-off:** Bundle size grows with each locale (~5 KB per language at current string count -- acceptable).

---

## [Part 1] 2026-10-18 — Audio prompts: Web Speech API (SpeechSynthesis)

**Decision:** Use the browser's built-in `window.speechSynthesis` for audio prompts, not a cloud TTS service.

**Rationale:** Fully offline, zero cost, zero privacy leakage. Voice quality varies by device but is sufficient for simple guidance phrases.

**Limitation (documented):** Assamese voice may fall back to English on devices without an Assamese TTS engine. The UI shows which language the voice is using. Labeled [LIMITED SUPPORT] in UI for Assamese audio.

**Trade-off:** Cloud TTS (e.g., Google Cloud TTS) would give much better voice quality but requires internet and sends user speech context to a third party -- unacceptable given privacy rules.

---

## [Part 1] 2026-10-18 — Local persistence: Dexie (IndexedDB)

**Decision:** Use `dexie` as the typed IndexedDB wrapper.

**Rationale:** Ergonomic async API, TypeScript generics, supports versioned schema migrations, and has a small bundle size (~25 KB gzip).

**Schema design:** Append-only `events` table. Every user action is an event with `{id (UUID), type, timestamp, patientId, payload, synced}`. This is the single source of truth for offline-first sync. Higher-level tables (mood_logs, game_sessions) are derived views or convenience tables written alongside events.

**Trade-off:** Append-only means storage grows. Pruning strategy (archive events > 90 days) deferred to Phase 2.

---

## [Part 1] 2026-10-18 — PWA: vite-plugin-pwa + Workbox

**Decision:** Use `vite-plugin-pwa` with `generateSW` strategy.

**Rationale:** Auto-generates a service worker with Workbox precaching of all Vite build assets. `NavigateFallback` ensures the SPA loads offline. No manual SW maintenance.

**Cache strategy:** `CacheFirst` for assets (hashed filenames), `NetworkFirst` for API calls (graceful degradation to offline when server unreachable).

**Trade-off:** Generated SW is not easily customisable. If we need advanced background sync, we will switch to `injectManifest` mode in Phase 2.

---

## [Part 1] 2026-10-18 — No diagnostic claims

**Positioning rule:** NeuroPlay NER is a **cognitive engagement and memory-assistance tool**. It is NOT diagnostic, NOT a cure, and gives NO medical advice. All alert wording uses phrasing like "may be worth discussing with a health worker".

This rule is enforced at the component level: no component may render a diagnosis string. Violations should be caught in code review.

---
