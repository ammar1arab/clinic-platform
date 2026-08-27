import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function formatPhoneDisplay(
  value: string | null | undefined,
): string {
  const raw = value?.trim();
  if (!raw) return '';

  const parsed = parsePhoneNumberFromString(raw, 'JO');
  if (parsed?.isValid()) {
    if (parsed.country === 'JO') return `0${parsed.nationalNumber}`;
    return parsed.formatNational();
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('962') && digits.length >= 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.length === 9 && digits.startsWith('7')) {
    return `0${digits}`;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return digits;
  }
  return raw;
}

export function phoneHref(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw, 'JO');
  if (parsed?.isValid()) return parsed.getURI();
  const display = formatPhoneDisplay(raw);
  if (!display) return null;
  const digits = display.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) return `tel:+962${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function formatEmailDisplay(
  value: string | null | undefined,
): string {
  return value?.trim() ?? '';
}

export function emailHref(value: string | null | undefined): string | null {
  const email = formatEmailDisplay(value);
  if (!email || !email.includes('@')) return null;
  return `mailto:${email}`;
}
