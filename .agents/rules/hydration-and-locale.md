# Hydration and locale

- Server markup and the first browser render must agree. Do not read browser storage as the initial source for SSR-rendered text. Use the existing deterministic server snapshot or pass an explicit serialized initial locale.
- For render-time helpers, pass t/lang from useLanguage. getTranslations() without a locale is for event-time or client utility work; server callers must supply the request locale when it matters.
- Keep locale subscriptions stable and remove listeners. A locale change must update text and document direction without remounting the whole app.
- A provider using useLanguage must be nested under LanguageProvider. Do not import the provider barrel into a provider if a direct sibling import avoids a cycle.
- Fix the mismatch rather than adding suppressHydrationWarning to user-facing text. Check hidden loaders and theme-script recovery before changing next-themes.
- Preserve semantic values such as enum names and endpoint paths; translate labels and messages, not protocol identifiers.
