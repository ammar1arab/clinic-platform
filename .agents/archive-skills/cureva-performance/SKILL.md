---
name: cureva-performance
description: "Investigate a demonstrated slow page, expensive query, repeated render, or excess network request in Cureva."
---

# Performance

Capture the symptom and a baseline before optimizing. Identify whether latency is transport, database, serialization, React rendering, FullCalendar layout, or repeated invalidation. Use existing timing/logging tools and bounded representative data, not real patient exports.

Inspect query keys and enable conditions before adding memoization. Check N+1 access, selected columns, pagination, and relevant indexes for backend work. Add useMemo/useCallback only where identity or expensive computation matters. Do not hide missing data with longer stale times or disable validation to improve a benchmark.

Make one change tied to the measured bottleneck. Compare the same action and dataset afterward and verify output correctness. State measurement limits and avoid promising a percentage improvement without evidence. Do not upgrade frameworks as a speculative performance fix.
