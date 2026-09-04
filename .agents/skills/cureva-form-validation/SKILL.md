---
name: cureva-form-validation
description: "Build or fix React Hook Form and Zod validation, including language-dependent errors and numeric/date boundaries."
---

# Form Validation

Start at lib/validations.ts and the form's resolver/defaultValues. Preserve the API payload contract: empty text, undefined, null, numeric strings, and zero are not interchangeable. Inspect installed Zod types before using error callbacks or coercion APIs.

Resolve messages at validation time or recreate the schema with the active translations. A module-level schema must not capture English forever. Keep custom messages in both dictionaries; use the existing Zod locale integration for generic issues. Treat bilingual entity fields separately from interface language.

Test the same already-imported schema with English, Arabic, then English again. Include blank, invalid, boundary, and valid values for the changed rule. Verify that server DTO constraints agree. Do not add a form effect merely to compute derived data, and do not display raw validation internals as help text.
