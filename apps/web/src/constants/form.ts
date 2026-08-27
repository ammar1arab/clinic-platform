export const FORM_NONE = '__none__';
export const FORM_ANY = '__any__';
export const FORM_ALL = '__all__';

export function toFormNone(value: string | null | undefined) {
  return value || FORM_NONE;
}

export function fromFormNone(value: string) {
  return value === FORM_NONE ? '' : value;
}
