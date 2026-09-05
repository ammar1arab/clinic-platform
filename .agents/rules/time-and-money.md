# Time and money

- Keep date-only values, clinic wall-clock times, and timestamps distinct. Do not convert a date-only field to UTC accidentally. Test scheduling boundaries using the clinic timezone.
- Do not derive business dates from the developer machine timezone when the clinic timezone is available.
- Check duration, buffer, room/practitioner overlap, and concurrent booking when changing availability. Reuse established appointment transitions and tests.
- Keep database decimal semantics for money. JOD display precision is three decimal places; display formatting is not arithmetic.
- Preserve atomic balance/payment changes and safe repeat behavior. Test zero, exhaustion, boundary rounding, and reversal only when relevant to the change.
- Translate complete messages with placeholders. Choose singular/plural wording in dictionaries; do not join English grammar fragments for Arabic.
