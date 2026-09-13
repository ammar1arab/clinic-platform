---
name: cureva-accessible-ui
description: "Review or repair keyboard, focus, accessible names, and RTL interaction in Cureva UI components."
---

# Accessible Ui

Inspect the existing Radix/shadcn primitive before adding behavior. Read components/ui and components/primitives at their current nested paths. Keep a control's visible label, accessible name, validation message, and tooltip translated consistently.

Exercise keyboard entry, tab order, Escape, focus return, disabled state, and loading state for the changed control. A dialog needs a title; icon-only controls need an accessible name. Avoid nesting buttons or placing inaccessible click handlers on static text. Preserve numeric/time direction where needed inside RTL layout.

Use the existing browser verification rule and its accessibility snapshot when available. Check light/dark token contrast and Arabic expansion for touched layouts. Fix the concrete usability defect without redesigning the entire screen. Report any untested assistive-technology behavior instead of claiming blanket accessibility compliance.
