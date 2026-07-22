const clinicTimezone = 'Asia/Riyadh';
const scheduledAt = new Date("2026-07-15T05:19:00.000Z");

const clinicLocalStr = scheduledAt.toLocaleString('en-US', { timeZone: clinicTimezone, hour12: false });
console.log(clinicLocalStr);

// Sometimes toLocaleString with hour12:false produces "24:00" instead of "00:00", 
// better to just use parts:
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: clinicTimezone,
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
}).formatToParts(scheduledAt);

console.log(parts);
