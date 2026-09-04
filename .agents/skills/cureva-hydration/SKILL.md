---
name: cureva-hydration
description: "Diagnose SSR hydration mismatches involving language, theme, authentication, storage, dates, or generated markup in the Next.js app."
---

# Hydration

Inspect apps/web/src/app/layout.tsx and the implicated provider before editing a leaf component. Compare server output with the first client render, including hidden loading chrome. Reading localStorage in a useState initializer can return English on the server and Arabic in the browser.

For an external browser store, use the existing useSyncExternalStore pattern with a stable primitive snapshot, deterministic getServerSnapshot, and subscription cleanup. Pass the context language or translations to render-time helpers. Reserve getTranslations() with an implicit stored language for events and non-render work. Check provider ordering before adding useLanguage to a provider.

Do not silence a text mismatch with suppressHydrationWarning or disable SSR for the whole app. A next-themes script warning may be secondary to recovery; fix the mismatch first. Verify a hard reload with saved Arabic, language switching, and theme persistence through the configured browser tool. See [React documentation](https://react.dev/reference/react/useSyncExternalStore).
