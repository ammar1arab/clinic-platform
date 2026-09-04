---
name: cureva-localized-exports
description: "Create or repair patient/practitioner exports and report formatting with translated labels, RTL, and correct data."
---

# Localized Exports

Read lib/export-table.ts, export-patients.ts, export-practitioners.ts, and services/reports.service.ts. Resolve translations when the user starts the export; module-level English columns remain stale. Pass the same locale to headers, status values, timestamps, and document direction.

Translate known enum values and preserve user-entered names. Prefer bilingual entity fields when supplied by the contract, with the existing fallback behavior. Escape CSV/XML/HTML content and preserve numeric zero. Check spreadsheet-formula risk when adding arbitrary user text. Document actual output encoding: the current Excel/Word paths may emit legacy XML/HTML files rather than OOXML.

Validate Arabic text, a zero value, commas/quotes, an empty dataset, and a long name in an artifact without using real patient data. Do not silently add dependencies or replace the export format under a localization-only request.
